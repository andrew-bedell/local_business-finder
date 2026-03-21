// Vercel serverless function: WhatsApp webhook receiver
// GET  — webhook verification (Meta challenge)
// POST — inbound messages + message status updates + auto-reply

import { createHmac } from 'crypto';
import { handleAutoReply } from '../_lib/whatsapp-responder.js';

export default async function handler(req, res) {
  // GET: Webhook verification
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // POST: Incoming events
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  // Validate signature
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const signature = req.headers['x-hub-signature-256'];
    if (signature) {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');
      if (signature !== expected) {
        console.warn('Webhook signature mismatch');
        return res.status(401).send('Invalid signature');
      }
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not configured for webhook');
    return res.status(200).send('OK');
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const body = req.body;
    const entries = body?.entry || [];

    for (const entry of entries) {
      const changes = entry?.changes || [];

      for (const change of changes) {
        if (change.field !== 'messages') continue;
        const value = change.value || {};

        // Process inbound messages
        const messages = value.messages || [];
        for (const msg of messages) {
          const result = await handleInboundMessage(msg, value.contacts, supabaseUrl, supabaseKey, headers);

          // Trigger auto-reply (non-blocking — don't let failures hold up the webhook)
          if (result) {
            handleAutoReply({
              senderPhone: msg.from,
              messageBody: msg.text?.body || '',
              messageType: msg.type || 'text',
              businessId: result.businessId,
              conversationId: result.conversationId,
              supabaseUrl,
              supabaseKey,
            }).catch(err => console.error('Auto-reply error (non-blocking):', err));
          }
        }

        // Process status updates
        const statuses = value.statuses || [];
        for (const status of statuses) {
          await handleStatusUpdate(status, supabaseUrl, headers);
        }
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  // Always return 200 quickly so Meta doesn't retry
  return res.status(200).send('OK');
}

/**
 * Process an inbound message: log it to DB and return context for auto-reply.
 * Returns { businessId, conversationId } or null.
 */
async function handleInboundMessage(msg, contacts, supabaseUrl, supabaseKey, headers) {
  const senderPhone = msg.from;
  const wamid = msg.id;
  const timestamp = msg.timestamp;
  const messageBody = msg.text?.body || '';
  const messageType = msg.type || 'text';
  const senderName = contacts?.[0]?.profile?.name || null;

  // Look up conversation by recipient_phone
  const convResp = await fetch(
    `${supabaseUrl}/rest/v1/whatsapp_conversations?recipient_phone=eq.%2B${senderPhone}&select=id,business_id,unread_count`,
    { headers }
  );
  if (!convResp.ok) {
    console.error('Conversation lookup failed:', convResp.status, await convResp.text().catch(() => ''));
    return { businessId: null, conversationId: null };
  }
  const convData = await convResp.json();

  if (!convData || convData.length === 0) {
    // No existing conversation — try matching by phone in businesses table
    const lastTen = senderPhone.slice(-10);
    const bizLookupUrl = `${supabaseUrl}/rest/v1/businesses?or=(phone.ilike.*${lastTen},contact_phone.ilike.*${lastTen},contact_whatsapp.ilike.*${lastTen},whatsapp.ilike.*${lastTen})&select=id&limit=1`;
    const bizResp = await fetch(bizLookupUrl, { headers });

    if (!bizResp.ok) {
      console.error('Business phone lookup failed:', bizResp.status, await bizResp.text().catch(() => ''));
      console.log('Inbound from unknown number (lookup error):', senderPhone, '| Name:', senderName);
      return { businessId: null, conversationId: null };
    }

    let bizData = await bizResp.json();

    let matchSource = 'businesses';

    // Fallback: check business_contacts table if no match in businesses
    if (!Array.isArray(bizData) || bizData.length === 0) {
      const contactLookupUrl = `${supabaseUrl}/rest/v1/business_contacts?or=(contact_phone.ilike.*${lastTen},contact_whatsapp.ilike.*${lastTen})&select=business_id&limit=1`;
      const contactResp = await fetch(contactLookupUrl, { headers });
      if (contactResp.ok) {
        const contactData = await contactResp.json();
        if (Array.isArray(contactData) && contactData.length > 0) {
          bizData = [{ id: contactData[0].business_id }];
          matchSource = 'business_contacts';
          console.log('[webhook] Phone matched via business_contacts:', contactData[0].business_id, '| phone:', senderPhone);
        }
      } else {
        console.error('[webhook] business_contacts fallback lookup failed:', contactResp.status, await contactResp.text().catch(() => ''));
      }
    }

    if (!Array.isArray(bizData) || bizData.length === 0) {
      // Unknown contact — no business match. Create conversation so message is saved.
      console.log('Inbound from unknown number:', senderPhone, '| lastTen:', lastTen, '| Name:', senderName, '| Message:', messageBody.substring(0, 100));

      const now = new Date().toISOString();
      const normalizedPhone = '+' + senderPhone;
      const createConv = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_conversations`,
        {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify({
            business_id: null,
            recipient_phone: normalizedPhone,
            status: 'active',
            last_inbound_at: now,
            unread_count: 1,
            last_message_text: messageBody.substring(0, 200),
            last_message_at: now,
          }),
        }
      );

      if (!createConv.ok) {
        console.error('Failed to create conversation for unknown contact:', await createConv.text().catch(() => ''));
        return { businessId: null, conversationId: null };
      }

      const newConv = await createConv.json();
      const conversationId = newConv[0]?.id;

      if (conversationId) {
        await fetch(
          `${supabaseUrl}/rest/v1/whatsapp_messages`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              conversation_id: conversationId,
              business_id: null,
              direction: 'inbound',
              message_type: messageType,
              body: messageBody,
              wamid: wamid,
              status: 'delivered',
              delivered_at: new Date(parseInt(timestamp) * 1000).toISOString(),
              created_at: new Date(parseInt(timestamp) * 1000).toISOString(),
            }),
          }
        );
      }

      return { businessId: null, conversationId };
    }

    console.log('[webhook] Matched via', matchSource, '| business_id:', bizData[0].id, '| phone:', senderPhone, '| Name:', senderName);

    // Write sender's WhatsApp number to matched contact if contact_whatsapp is empty
    const whatsappNumber = '+' + senderPhone;
    try {
      const contactLookup = await fetch(
        `${supabaseUrl}/rest/v1/business_contacts?business_id=eq.${bizData[0].id}&order=is_primary.desc,id.asc&limit=1&select=id,contact_whatsapp`,
        { headers }
      );
      if (contactLookup.ok) {
        const existingContacts = await contactLookup.json();
        if (existingContacts.length > 0 && !existingContacts[0].contact_whatsapp) {
          await fetch(
            `${supabaseUrl}/rest/v1/business_contacts?id=eq.${existingContacts[0].id}`,
            { method: 'PATCH', headers, body: JSON.stringify({ contact_whatsapp: whatsappNumber }) }
          );
        }
      }
    } catch (err) {
      console.warn('Failed to backfill contact WhatsApp:', err.message);
    }

    // Check for existing conversation by business_id (phone format may differ)
    const existConvResp = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_conversations?business_id=eq.${bizData[0].id}&select=id,unread_count&limit=1`,
      { headers }
    );
    const existConvData = existConvResp.ok ? await existConvResp.json() : [];

    const now = new Date().toISOString();

    if (existConvData.length > 0) {
      // Found existing conversation — update phone to Meta format + save inbound message
      const existConv = existConvData[0];
      console.log('[webhook] Found existing conversation by business_id:', existConv.id, '| updating recipient_phone to:', whatsappNumber);

      await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_conversations?id=eq.${existConv.id}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            recipient_phone: whatsappNumber,
            last_inbound_at: now,
            unread_count: (existConv.unread_count || 0) + 1,
            last_message_text: messageBody.substring(0, 200),
            last_message_at: now,
          }),
        }
      );

      await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_messages`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            conversation_id: existConv.id,
            business_id: bizData[0].id,
            direction: 'inbound',
            message_type: messageType,
            body: messageBody,
            wamid: wamid,
            status: 'delivered',
            delivered_at: new Date(parseInt(timestamp) * 1000).toISOString(),
            created_at: new Date(parseInt(timestamp) * 1000).toISOString(),
          }),
        }
      );

      await updateCampaignReplyCount(bizData[0].id, supabaseUrl, headers);
      return { businessId: bizData[0].id, conversationId: existConv.id };
    }

    // No existing conversation — create new one
    const createConv = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_conversations`,
      {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          business_id: bizData[0].id,
          recipient_phone: whatsappNumber,
          status: 'active',
          last_inbound_at: now,
          unread_count: 1,
          last_message_text: messageBody.substring(0, 200),
          last_message_at: now,
        }),
      }
    );
    const newConv = await createConv.json();
    const conversationId = newConv[0]?.id;

    await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_messages`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversation_id: conversationId,
          business_id: bizData[0].id,
          direction: 'inbound',
          message_type: messageType,
          body: messageBody,
          wamid: wamid,
          status: 'delivered',
          delivered_at: new Date(parseInt(timestamp) * 1000).toISOString(),
          created_at: new Date(parseInt(timestamp) * 1000).toISOString(),
        }),
      }
    );

    return { businessId: bizData[0].id, conversationId };
  }

  // Existing conversation
  const conv = convData[0];
  const now = new Date().toISOString();

  let resolvedBusinessId = conv.business_id;

  // If conversation exists but has no business_id, re-run phone matching to fix it
  if (!resolvedBusinessId) {
    console.log('[webhook] Existing conversation has null business_id — re-matching phone:', senderPhone, '| conv:', conv.id);
    const lastTen = senderPhone.slice(-10);

    // Try businesses table first
    const bizLookupUrl = `${supabaseUrl}/rest/v1/businesses?or=(phone.ilike.*${lastTen},contact_phone.ilike.*${lastTen},contact_whatsapp.ilike.*${lastTen},whatsapp.ilike.*${lastTen})&select=id&limit=1`;
    const bizResp = await fetch(bizLookupUrl, { headers });
    if (bizResp.ok) {
      const bizData = await bizResp.json();
      if (Array.isArray(bizData) && bizData.length > 0) {
        resolvedBusinessId = bizData[0].id;
        console.log('[webhook] Re-match SUCCESS via businesses table:', resolvedBusinessId, '| phone:', senderPhone);
      }
    } else {
      console.error('[webhook] Re-match businesses lookup failed:', bizResp.status);
    }

    // Fallback: business_contacts table
    if (!resolvedBusinessId) {
      const contactLookupUrl = `${supabaseUrl}/rest/v1/business_contacts?or=(contact_phone.ilike.*${lastTen},contact_whatsapp.ilike.*${lastTen})&select=business_id&limit=1`;
      const contactResp = await fetch(contactLookupUrl, { headers });
      if (contactResp.ok) {
        const contactData = await contactResp.json();
        if (Array.isArray(contactData) && contactData.length > 0) {
          resolvedBusinessId = contactData[0].business_id;
          console.log('[webhook] Re-match SUCCESS via business_contacts:', resolvedBusinessId, '| phone:', senderPhone);
        }
      } else {
        console.error('[webhook] Re-match business_contacts lookup failed:', contactResp.status);
      }
    }

    // Update conversation with resolved business_id
    if (resolvedBusinessId) {
      console.log('[webhook] Updating conversation', conv.id, 'with business_id:', resolvedBusinessId);
      await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_conversations?id=eq.${conv.id}`,
        { method: 'PATCH', headers, body: JSON.stringify({ business_id: resolvedBusinessId }) }
      );
    } else {
      console.log('[webhook] Re-match FAILED — no business found for phone:', senderPhone);
    }
  } else {
    console.log('[webhook] Existing conversation matched:', conv.id, '| business_id:', conv.business_id, '| phone:', senderPhone);
  }

  // Update conversation
  await fetch(
    `${supabaseUrl}/rest/v1/whatsapp_conversations?id=eq.${conv.id}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        last_inbound_at: now,
        unread_count: (conv.unread_count || 0) + 1,
        last_message_text: messageBody.substring(0, 200),
        last_message_at: now,
      }),
    }
  );

  // Insert message
  await fetch(
    `${supabaseUrl}/rest/v1/whatsapp_messages`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        conversation_id: conv.id,
        business_id: resolvedBusinessId,
        direction: 'inbound',
        message_type: messageType,
        body: messageBody,
        wamid: wamid,
        status: 'delivered',
        delivered_at: new Date(parseInt(timestamp) * 1000).toISOString(),
        created_at: new Date(parseInt(timestamp) * 1000).toISOString(),
      }),
    }
  );

  // Track campaign reply
  if (resolvedBusinessId) {
    await updateCampaignReplyCount(resolvedBusinessId, supabaseUrl, headers);
  }

  return { businessId: resolvedBusinessId, conversationId: conv.id };
}

async function handleStatusUpdate(status, supabaseUrl, headers) {
  const wamid = status.id;
  const statusValue = status.status; // sent, delivered, read, failed

  const updates = {};

  if (statusValue === 'sent') {
    updates.status = 'sent';
    updates.sent_at = new Date(parseInt(status.timestamp) * 1000).toISOString();
  } else if (statusValue === 'delivered') {
    updates.status = 'delivered';
    updates.delivered_at = new Date(parseInt(status.timestamp) * 1000).toISOString();
  } else if (statusValue === 'read') {
    updates.status = 'read';
    updates.read_at = new Date(parseInt(status.timestamp) * 1000).toISOString();
  } else if (statusValue === 'failed') {
    updates.status = 'failed';
    const errors = status.errors || [];
    updates.error_message = errors.map(e => e.title || e.message || 'Unknown error').join('; ');
  }

  if (Object.keys(updates).length === 0) return;

  // Update message status
  await fetch(
    `${supabaseUrl}/rest/v1/whatsapp_messages?wamid=eq.${wamid}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    }
  );

  // Update campaign stats if this message belongs to a campaign
  try {
    const msgResp = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_messages?wamid=eq.${wamid}&select=campaign_id`,
      { headers }
    );
    const msgData = await msgResp.json();
    const campaignId = msgData?.[0]?.campaign_id;

    if (campaignId) {
      const counterField =
        statusValue === 'delivered' ? 'delivered_count' :
        statusValue === 'read' ? 'read_count' :
        statusValue === 'failed' ? 'failed_count' : null;

      if (counterField) {
        // Read current count and increment
        const campResp = await fetch(
          `${supabaseUrl}/rest/v1/whatsapp_campaigns?id=eq.${campaignId}&select=${counterField}`,
          { headers }
        );
        const campData = await campResp.json();
        if (campData && campData.length > 0) {
          const currentCount = campData[0][counterField] || 0;
          await fetch(
            `${supabaseUrl}/rest/v1/whatsapp_campaigns?id=eq.${campaignId}`,
            {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ [counterField]: currentCount + 1 }),
            }
          );
        }
      }
    }
  } catch (err) {
    console.warn('Campaign stat update error:', err);
  }
}

// Track campaign replies when inbound messages arrive
async function updateCampaignReplyCount(businessId, supabaseUrl, headers) {
  try {
    // Check if this business has any campaign messages
    const cmResp = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_campaign_messages?business_id=eq.${businessId}&select=campaign_id&order=created_at.desc&limit=1`,
      { headers }
    );
    const cmData = await cmResp.json();
    if (cmData && cmData.length > 0) {
      const campaignId = cmData[0].campaign_id;
      const campResp = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_campaigns?id=eq.${campaignId}&select=replied_count`,
        { headers }
      );
      const campData = await campResp.json();
      if (campData && campData.length > 0) {
        await fetch(
          `${supabaseUrl}/rest/v1/whatsapp_campaigns?id=eq.${campaignId}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ replied_count: (campData[0].replied_count || 0) + 1 }),
          }
        );
      }
    }
  } catch (err) {
    console.warn('Campaign reply count update error:', err);
  }
}
