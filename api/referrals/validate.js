// Vercel serverless function: Validate referral code (public, no auth)
// GET ?code=TACOS42 — returns referrer's business name if valid

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const code = (req.query.code || '').trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ valid: false, error: 'Missing code parameter' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ valid: false, error: 'Service unavailable' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Look up referral code
    const codeRes = await fetch(
      `${supabaseUrl}/rest/v1/referral_codes?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=id,customer_id`,
      { headers }
    );
    const codes = await codeRes.json();

    if (!codes || codes.length === 0) {
      return res.status(200).json({ valid: false });
    }

    const customerId = codes[0].customer_id;

    // Get business name via customer → business
    const custRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?id=eq.${customerId}&select=business_id,contact_name`,
      { headers }
    );
    const custs = await custRes.json();

    let referrerBusinessName = '';
    let referrerName = '';

    if (custs && custs.length > 0) {
      referrerName = custs[0].contact_name || '';

      if (custs[0].business_id) {
        const bizRes = await fetch(
          `${supabaseUrl}/rest/v1/businesses?id=eq.${custs[0].business_id}&select=name`,
          { headers }
        );
        const bizData = await bizRes.json();
        referrerBusinessName = bizData?.[0]?.name || '';
      }
    }

    return res.status(200).json({
      valid: true,
      referrerBusinessName,
      referrerName,
    });
  } catch (err) {
    console.error('Validate referral code error:', err);
    return res.status(500).json({ valid: false, error: 'Internal server error' });
  }
}
