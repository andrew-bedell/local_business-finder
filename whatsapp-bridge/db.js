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
    .select('id, business_id, recipient_phone, unread_count, auto_reply_disabled')
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


// ── Onboarding flow CRUD ──

/**
 * Find an active onboarding flow by phone number.
 * Active = step not in (complete, abandoned, error).
 *
 * @param {string} phone — Canonical phone number
 * @returns {Object|null} { flowId, step, flow_data, business_id, conversation_id } or null
 */
async function findActiveFlow(phone) {
  const sb = getClient();

  const { data, error } = await sb
    .from('onboarding_flows')
    .select('id, step, flow_data, business_id, conversation_id')
    .eq('phone', phone)
    .not('step', 'in', '("complete","abandoned","error","human_review")')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('findActiveFlow error:', error.message);
  }

  return data || null;
}


/**
 * Create a new onboarding flow.
 *
 * @param {Object} opts
 * @param {string} opts.conversationId — FK to whatsapp_conversations
 * @param {string} opts.phone — Canonical phone number
 * @param {string} opts.chatId — WhatsApp chat ID (e.g., 5216241234567@c.us)
 * @param {Object} [opts.initialData={}] — Initial flow_data (e.g., pre-collected business name/city)
 * @returns {string|null} flow id
 */
async function createFlow({ conversationId, phone, chatId, initialData = {} }) {
  const sb = getClient();

  const flowData = {
    collected: {},
    searchResults: [],
    selectedPlace: null,
    enrichmentSummary: null,
    chatId,
    retryCount: 0,
    ...initialData,
  };

  const { data, error } = await sb
    .from('onboarding_flows')
    .insert({
      conversation_id: conversationId,
      phone,
      step: 'collect_info',
      flow_data: flowData,
    })
    .select('id')
    .single();

  if (error) {
    console.error('createFlow error:', error.message);
    return null;
  }

  return data?.id || null;
}


/**
 * Update an onboarding flow's step, data, or linked records.
 *
 * @param {string} flowId — UUID of the flow
 * @param {Object} updates — Fields to update
 * @param {string} [updates.step] — New step
 * @param {Object} [updates.flow_data] — Updated flow_data (replaces entire JSONB)
 * @param {number} [updates.business_id] — Link to business
 * @param {string} [updates.website_id] — Link to generated website
 */
async function updateFlow(flowId, updates) {
  const sb = getClient();

  const record = { last_activity_at: new Date().toISOString() };

  if (updates.step !== undefined) record.step = updates.step;
  if (updates.flow_data !== undefined) record.flow_data = updates.flow_data;
  if (updates.business_id !== undefined) record.business_id = updates.business_id;
  if (updates.website_id !== undefined) record.website_id = updates.website_id;

  if (updates.step === 'complete') {
    record.completed_at = new Date().toISOString();
  }

  const { error } = await sb
    .from('onboarding_flows')
    .update(record)
    .eq('id', flowId);

  if (error) {
    console.error('updateFlow error:', error.message);
  }
}


/**
 * Get a flow by ID.
 *
 * @param {string} flowId — UUID
 * @returns {Object|null} Full flow record
 */
async function getFlow(flowId) {
  const sb = getClient();

  const { data, error } = await sb
    .from('onboarding_flows')
    .select('*')
    .eq('id', flowId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('getFlow error:', error.message);
  }

  return data || null;
}


/**
 * Find a marketing lead by phone variants.
 * Returns the most recent lead or null.
 *
 * @param {string[]} phoneVariants — Phone format variants
 * @returns {Object|null} Marketing lead record
 */
async function findMarketingLeadByPhone(phoneVariants) {
  const sb = getClient();
  const digits = (phoneVariants[0] || '').replace(/\D/g, '');
  const lastTen = digits.slice(-10);

  const filters = phoneVariants.map(v => `phone.eq.${v}`).join(',');
  let orFilter = filters;
  if (lastTen.length === 10) {
    orFilter += `,phone.ilike.%${lastTen}`;
  }

  const { data, error } = await sb
    .from('marketing_leads')
    .select('id, business_name, name, phone, email, city, address, status, source')
    .or(orFilter)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.warn('findMarketingLeadByPhone error:', error.message);
  }

  return data || null;
}


/**
 * Update a marketing lead's status.
 *
 * @param {string} leadId — Marketing lead UUID
 * @param {string} status — New status
 */
async function updateMarketingLeadStatus(leadId, status) {
  const sb = getClient();

  const { error } = await sb
    .from('marketing_leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId);

  if (error) {
    console.error('updateMarketingLeadStatus error:', error.message);
  }
}


/**
 * Check if auto-reply is disabled for any conversation linked to this business.
 * Returns { isDisabled: true/false }.
 */
async function isAutoReplyDisabledForBusiness(businessId) {
  const sb = getClient();
  try {
    const { data, error } = await sb
      .from('whatsapp_conversations')
      .select('id')
      .eq('business_id', businessId)
      .eq('auto_reply_disabled', true)
      .limit(1);

    if (error) {
      console.error('isAutoReplyDisabledForBusiness error:', error.message);
      return { isDisabled: true }; // Fail closed
    }
    return { isDisabled: data && data.length > 0 };
  } catch (err) {
    console.error('isAutoReplyDisabledForBusiness error:', err);
    return { isDisabled: true }; // Fail closed
  }
}

module.exports = {
  findConversationByPhone,
  upsertConversation,
  logMessage,
  getConversationHistory,
  isAutoReplyDisabledForBusiness,
  findActiveFlow,
  createFlow,
  updateFlow,
  getFlow,
  findMarketingLeadByPhone,
  updateMarketingLeadStatus,
};
