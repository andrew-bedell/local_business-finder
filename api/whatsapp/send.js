// Vercel serverless function: Send WhatsApp message via Meta Cloud API
// POST — sends a free-form text or template message to a business owner

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

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!phoneNumberId || !accessToken) {
    return res.status(503).json({ error: 'WhatsApp API credentials not configured' });
  }
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase credentials not configured' });
  }

  const { businessId, phone, message, templateName, templateParams, language } = req.body || {};

  if (!businessId || !phone) {
    return res.status(400).json({ error: 'Missing required fields: businessId, phone' });
  }
  if (!message && !templateName) {
    return res.status(400).json({ error: 'Must provide either message or templateName' });
  }

  // Normalize phone to E.164 (strip spaces/dashes, ensure leading +)
  const normalizedPhone = phone.replace(/[\s\-()]/g, '').replace(/^(?!\+)/, '+');

  try {
    // If sending free-form text, check the 24-hour window
    if (message && !templateName) {
      const convResp = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_conversations?business_id=eq.${businessId}&select=last_inbound_at`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );
      const convData = await convResp.json();

      if (!convData || convData.length === 0 || !convData[0].last_inbound_at) {
        return res.status(422).json({
          error: 'No active messaging window. The business must message you first, or use a template message.',
        });
      }

      const lastInbound = new Date(convData[0].last_inbound_at);
      const hoursSince = (Date.now() - lastInbound.getTime()) / (1000 * 60 * 60);
      if (hoursSince > 24) {
        return res.status(422).json({
          error: '24-hour messaging window has expired. Use a template message to re-initiate.',
        });
      }
    }

    // Build Meta API payload
    let metaPayload;
    if (templateName) {
      const components = [];
      if (templateParams && templateParams.length > 0) {
        components.push({
          type: 'body',
          parameters: templateParams.map(p => ({ type: 'text', text: p })),
        });
      }
      metaPayload = {
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: language || 'en' },
          components: components.length > 0 ? components : undefined,
        },
      };
    } else {
      metaPayload = {
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        type: 'text',
        text: { body: message },
      };
    }

    // Send via Meta API
    const metaResp = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metaPayload),
      }
    );

    const metaData = await metaResp.json();

    if (!metaResp.ok) {
      console.error('Meta API error:', metaData);
      return res.status(502).json({
        error: 'WhatsApp API error',
        detail: metaData.error?.message || 'Unknown error',
      });
    }

    const wamid = metaData.messages?.[0]?.id;

    // Upsert conversation
    const now = new Date().toISOString();
    const messagePreview = message || `[Template: ${templateName}]`;

    const upsertConv = await fetch(
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
          last_message_text: messagePreview.substring(0, 200),
          last_message_at: now,
        }),
      }
    );

    const convResult = await upsertConv.json();
    const conversationId = convResult[0]?.id;

    // Insert message record
    const insertMsg = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_messages`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          business_id: businessId,
          direction: 'outbound',
          message_type: templateName ? 'template' : 'text',
          body: message || null,
          template_name: templateName || null,
          template_params: templateParams || null,
          wamid: wamid,
          status: 'sent',
          sent_at: now,
        }),
      }
    );

    const msgResult = await insertMsg.json();

    return res.status(200).json({
      success: true,
      messageId: msgResult[0]?.id,
      wamid: wamid,
    });
  } catch (err) {
    console.error('WhatsApp send error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
