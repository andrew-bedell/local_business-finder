// Vercel serverless function: Proxy outreach message to WhatsApp bridge
// POST — forwards message to self-hosted bridge, logs to DB, marks outreach_sent

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const bridgeUrl = process.env.BRIDGE_URL;
  const bridgeSecret = process.env.BRIDGE_API_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!bridgeUrl || !bridgeSecret) {
    return res.status(503).json({ error: 'WhatsApp bridge not configured' });
  }
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase credentials not configured' });
  }

  const { phone, message, businessId } = req.body || {};

  if (!phone || !message || !businessId) {
    return res.status(400).json({ error: 'Missing required fields: phone, message, businessId' });
  }

  try {
    // Forward to bridge
    const bridgeResp = await fetch(`${bridgeUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message, secret: bridgeSecret }),
    });

    const bridgeData = await bridgeResp.json();

    if (!bridgeResp.ok) {
      console.error('Bridge error:', bridgeData);
      return res.status(502).json({
        error: 'Bridge send failed',
        detail: bridgeData.error || 'Unknown error',
      });
    }

    // Mark outreach_sent on business record
    const now = new Date().toISOString();

    await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ outreach_sent: true }),
      }
    );

    // Normalize phone for conversation logging
    const normalizedPhone = phone.replace(/[^\d+]/g, '').replace(/^(?!\+)/, '+');

    // Upsert conversation
    const upsertResp = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_conversations`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({
          business_id: businessId,
          recipient_phone: normalizedPhone,
          status: 'active',
          last_message_text: message.substring(0, 200),
          last_message_at: now,
        }),
      }
    );

    const convResult = await upsertResp.json();
    const conversationId = convResult[0]?.id;

    // Log outbound message
    if (conversationId) {
      await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_messages`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            business_id: businessId,
            direction: 'outbound',
            message_type: 'text',
            body: message,
            status: 'sent',
            sent_at: now,
          }),
        }
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Bridge-send error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
