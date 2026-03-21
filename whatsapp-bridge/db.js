// Supabase helpers — log messages, upsert conversations, fetch history
// Uses Supabase JS SDK (not REST API) since we're in a Node.js context

const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getClient() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  }
  return supabase;
}


/**
 * Find an existing conversation by phone variants.
 * Returns the conversation record or null.
 */
async function findConversationByPhone(phoneVariants) {
  const sb = getClient();

  // Build OR filter for all phone variants
  const filters = phoneVariants.map(v => `recipient_phone.eq.${v}`).join(',');

  const { data, error } = await sb
    .from('whatsapp_conversations')
    .select('id, business_id, recipient_phone, unread_count')
    .or(filters)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows — that's expected, anything else is a real error
    console.error('findConversationByPhone error:', error.message);
  }

  return data || null;
}


/**
 * Upsert a conversation record and return its ID.
 * Creates a new conversation if none exists, or updates the existing one.
 *
 * @param {Object} opts
 * @param {string|null} opts.businessId — FK to businesses (nullable for unknown contacts)
 * @param {string} opts.phone — Canonical phone number
 * @param {string} opts.messagePreview — First 200 chars of message
 * @param {string} opts.direction — 'inbound' or 'outbound'
 * @param {Object|null} opts.existingConversation — From findConversationByPhone
 * @returns {string|null} conversation ID
 */
async function upsertConversation({ businessId, phone, messagePreview, direction, existingConversation }) {
  const sb = getClient();
  const now = new Date().toISOString();

  if (existingConversation) {
    const updates = {
      last_message_text: messagePreview,
      last_message_at: now,
    };

    if (direction === 'inbound') {
      updates.last_inbound_at = now;
      updates.unread_count = (existingConversation.unread_count || 0) + 1;
    }

    // If we now have a business match but the conversation didn't before, link it
    if (businessId && !existingConversation.business_id) {
      updates.business_id = businessId;
    }

    const { error } = await sb
      .from('whatsapp_conversations')
      .update(updates)
      .eq('id', existingConversation.id);

    if (error) console.error('upsertConversation update error:', error.message);

    return existingConversation.id;
  }

  // Create new conversation — business_id is nullable, so we can save unknown contacts too
  const insertData = {
    recipient_phone: phone,
    status: 'active',
    last_inbound_at: direction === 'inbound' ? now : null,
    last_message_text: messagePreview,
    last_message_at: now,
    unread_count: direction === 'inbound' ? 1 : 0,
  };

  if (businessId) {
    insertData.business_id = businessId;
  }

  const { data, error } = await sb
    .from('whatsapp_conversations')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    console.error('upsertConversation insert error:', error.message);
    return null;
  }

  return data?.id || null;
}


/**
 * Log a message (inbound or outbound) to whatsapp_messages.
 *
 * @param {Object} opts
 * @param {string} opts.conversationId
 * @param {string} opts.businessId
 * @param {string} opts.direction — 'inbound' or 'outbound'
 * @param {string} opts.body — Message text
 * @param {string} [opts.messageType='text']
 */
async function logMessage({ conversationId, businessId, direction, body, messageType = 'text' }) {
  const sb = getClient();
  const now = new Date().toISOString();

  const record = {
    conversation_id: conversationId,
    business_id: businessId,
    direction,
    message_type: messageType,
    body: body || '',
    status: direction === 'inbound' ? 'delivered' : 'sent',
  };

  if (direction === 'outbound') {
    record.sent_at = now;
  } else {
    record.created_at = now;
  }

  const { error } = await sb
    .from('whatsapp_messages')
    .insert(record);

  if (error) {
    console.error('logMessage error:', error.message);
  }
}


/**
 * Fetch recent conversation history for Claude context.
 * Returns messages ordered oldest-first so Claude sees them chronologically.
 *
 * @param {string} conversationId
 * @param {number} [limit=20]
 * @returns {Array<{role: string, content: string}>} Claude-formatted messages
 */
async function getConversationHistory(conversationId, limit = 20) {
  const sb = getClient();

  const { data, error } = await sb
    .from('whatsapp_messages')
    .select('direction, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getConversationHistory error:', error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Reverse to chronological order, map to Claude format
  return data.reverse().map(msg => ({
    role: msg.direction === 'inbound' ? 'user' : 'assistant',
    content: msg.body || '',
  })).filter(m => m.content);
}


module.exports = {
  findConversationByPhone,
  upsertConversation,
  logMessage,
  getConversationHistory,
};
