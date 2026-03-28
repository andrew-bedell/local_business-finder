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
    // Strategy: If businessId provided, find existing conversation by business_id first.
    // This avoids phone format mismatches (local vs international) creating duplicate rows.
    if (businessId) {
      const lookupResp = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_conversations?business_id=eq.${businessId}&select=id&limit=1`,
        { headers }
      );
      const rows = lookupResp.ok ? await lookupResp.json() : [];

      if (rows.length > 0) {
        // PATCH the existing row (created by webhook with correct international phone)
        const patchResp = await fetch(
          `${supabaseUrl}/rest/v1/whatsapp_conversations?id=eq.${rows[0].id}`,
          {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=representation' },
            body: JSON.stringify({ auto_reply_disabled: disabled }),
          }
        );

        if (!patchResp.ok) {
          const errBody = await patchResp.text();
          console.error('Supabase patch error:', patchResp.status, errBody);
          return res.status(502).json({ error: 'Failed to update auto-reply setting' });
        }

        return res.status(200).json({ success: true, auto_reply_disabled: disabled });
      }
      // No existing conversation for this business — fall through to phone upsert
    }

    // Fallback: upsert by phone (pre-creates row for future inbound messages)
    const upsertResp = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_conversations`,
      {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          recipient_phone: normalizedPhone,
          auto_reply_disabled: disabled,
        }),
      }
    );

    if (!upsertResp.ok) {
      const errBody = await upsertResp.text();
      console.error('Supabase upsert error:', upsertResp.status, errBody);
      return res.status(502).json({ error: 'Failed to update auto-reply setting' });
    }

    return res.status(200).json({ success: true, auto_reply_disabled: disabled });
  } catch (err) {
    console.error('Toggle auto-reply error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
