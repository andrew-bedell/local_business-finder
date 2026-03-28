// Vercel serverless function: Toggle auto-reply on/off for a WhatsApp conversation
// POST — upserts whatsapp_conversations with auto_reply_disabled flag

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

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase credentials not configured' });
  }

  const { phone, disabled, businessId } = req.body || {};

  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'Missing required field: phone (string)' });
  }

  if (typeof disabled !== 'boolean') {
    return res.status(400).json({ error: 'Missing required field: disabled (boolean)' });
  }

  // Normalize phone: strip non-digit/+ chars, prepend + if missing
  const normalizedPhone = phone.replace(/[^\d+]/g, '').replace(/^(?!\+)/, '+');

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Look up existing conversation by business_id first, then by phone
    let existingId = null;

    if (businessId) {
      const bizResp = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_conversations?business_id=eq.${businessId}&select=id&limit=1`,
        { headers }
      );
      const bizRows = bizResp.ok ? await bizResp.json() : [];
      if (bizRows.length > 0) existingId = bizRows[0].id;
    }

    if (!existingId) {
      const phoneResp = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_conversations?recipient_phone=eq.${encodeURIComponent(normalizedPhone)}&select=id&limit=1`,
        { headers }
      );
      const phoneRows = phoneResp.ok ? await phoneResp.json() : [];
      if (phoneRows.length > 0) existingId = phoneRows[0].id;
    }

    if (existingId) {
      // PATCH existing conversation
      const patchBody = { auto_reply_disabled: disabled };
      if (businessId) patchBody.business_id = businessId;

      const patchResp = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_conversations?id=eq.${existingId}`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(patchBody),
        }
      );

      if (!patchResp.ok) {
        const errBody = await patchResp.text();
        console.error('Supabase patch error:', patchResp.status, errBody);
        return res.status(502).json({ error: 'Failed to update auto-reply setting' });
      }
    } else {
      // INSERT new conversation
      const insertResp = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_conversations`,
        {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify({
            recipient_phone: normalizedPhone,
            auto_reply_disabled: disabled,
            ...(businessId ? { business_id: businessId } : {}),
          }),
        }
      );

      if (!insertResp.ok) {
        const errBody = await insertResp.text();
        console.error('Supabase insert error:', insertResp.status, errBody);
        return res.status(502).json({ error: 'Failed to update auto-reply setting' });
      }
    }

    return res.status(200).json({ success: true, auto_reply_disabled: disabled });
  } catch (err) {
    console.error('Toggle auto-reply error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
