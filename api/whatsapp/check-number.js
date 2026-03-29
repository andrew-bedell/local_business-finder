// Vercel serverless function: Check if a phone number is registered on WhatsApp
// POST — proxies to self-hosted bridge, persists result to business record

import { toE164 } from '../_lib/phone-utils.js';

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

  const { phone, businessId, addressCountry } = req.body || {};

  if (!phone || !businessId) {
    return res.status(400).json({ error: 'Missing required fields: phone, businessId' });
  }

  // Normalize phone to E.164
  const normalizedPhone = toE164(phone, { addressCountry }) || phone.replace(/[\s\-()]/g, '').replace(/^(?!\+)/, '+');

  try {
    // Forward to bridge
    const bridgeResp = await fetch(`${bridgeUrl}/check-number`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizedPhone, secret: bridgeSecret }),
    });

    const bridgeData = await bridgeResp.json();

    if (!bridgeResp.ok) {
      console.error('Bridge check-number error:', bridgeData);
      return res.status(502).json({
        error: 'Bridge check failed',
        detail: bridgeData.error || 'Unknown error',
      });
    }

    const isValid = !!bridgeData.registered;

    // Persist result to business outreach_steps._wa_check
    const supabaseHeaders = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };

    const getRes = await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}&select=outreach_steps`,
      { headers: supabaseHeaders }
    );
    const current = getRes.ok ? await getRes.json() : [];
    const existing = (current[0] && current[0].outreach_steps) || {};

    const mergedSteps = {
      ...existing,
      _wa_check: {
        checked_at: new Date().toISOString(),
        is_valid: isValid,
        phone_checked: normalizedPhone,
      },
    };

    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}`,
      {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify({ outreach_steps: mergedSteps }),
      }
    );

    const updated = patchRes.ok ? await patchRes.json() : [];

    return res.status(200).json({
      registered: isValid,
      phone: normalizedPhone,
      business: updated[0] || null,
    });
  } catch (err) {
    console.error('WhatsApp check-number error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
