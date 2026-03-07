// Vercel serverless function: WhatsApp webhook receiver
// GET  — webhook verification (Meta challenge)
// POST — inbound messages + message status updates

import { createHmac } from 'crypto';

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
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
          await handleInboundMessage(msg, value.contacts, supabaseUrl, headers);
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

async function handleInboundMessage(msg, contacts, supabaseUrl, headers) {
  const senderPhone = msg.from;
  const wamid = msg.id;
  const timestamp = msg.timestamp;
  const messageBody = msg.text?.body || '';
  const messageType = msg.type || 'text';

  // Look up conversation by recipient_phone
  const convResp = await fetch(
    `${supabaseUrl}/rest/v1/whatsapp_conversations?recipient_phone=eq.%2B${senderPhone}&select=id,business_id,unread_count`,
    { headers }
  );
  const convData = await convResp.json();

  if (!convData || convData.length === 0) {
    // No existing conversation — try matching by phone in businesses table
    const bizResp = await fetch(
      `${supabaseUrl}/rest/v1/businesses?phone=like.*${senderPhone.slice(-10)}*&select=id&limit=1`,
      { headers }
    );
    const bizData = await bizResp.json();

    if (!bizData || bizData.length === 0) {
      console.warn('Inbound message from unknown number:', senderPhone);
      return;
    }

    // Create new conversation
    const now = new Date().toISOString();
    const createConv = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_conversations`,
      {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          business_id: bizData[0].id,
          recipient_phone: '+' + senderPhone,
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

    // Insert message
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
    return;
  }

  // Existing conversation
  const conv = convData[0];
  const now = new Date().toISOString();

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
        business_id: conv.business_id,
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

  await fetch(
    `${supabaseUrl}/rest/v1/whatsapp_messages?wamid=eq.${wamid}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    }
  );
}
