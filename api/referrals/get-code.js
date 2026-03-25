// Vercel serverless function: Get or create referral code for logged-in customer
// GET — returns the customer's referral code and stats

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  // Extract auth token to identify the customer
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.replace('Bearer ', '');
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Resolve auth user → customer
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}` },
    });
    if (!userRes.ok) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }
    const user = await userRes.json();

    const cuRes = await fetch(
      `${supabaseUrl}/rest/v1/customer_users?auth_user_id=eq.${user.id}&select=customer_id`,
      { headers }
    );
    const cuData = await cuRes.json();
    if (!cuData || cuData.length === 0) {
      return res.status(404).json({ error: 'No customer account found' });
    }
    const customerId = cuData[0].customer_id;

    // Look up existing referral code
    const codeRes = await fetch(
      `${supabaseUrl}/rest/v1/referral_codes?customer_id=eq.${customerId}&select=*`,
      { headers }
    );
    const codes = await codeRes.json();

    if (codes && codes.length > 0) {
      return res.status(200).json({
        code: codes[0].code,
        totalReferrals: codes[0].total_referrals,
        successfulReferrals: codes[0].successful_referrals,
        totalRewards: codes[0].total_rewards,
      });
    }

    // Generate a new code from contact name (preferred) or business name (fallback)
    const custRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?id=eq.${customerId}&select=business_id,contact_name`,
      { headers }
    );
    const custs = await custRes.json();
    let codeName = '';
    if (custs && custs.length > 0) {
      // Prefer contact name (e.g. "María García" → "MARIA")
      codeName = custs[0].contact_name || '';
      if (!codeName && custs[0].business_id) {
        const bizRes = await fetch(
          `${supabaseUrl}/rest/v1/businesses?id=eq.${custs[0].business_id}&select=name`,
          { headers }
        );
        const bizData = await bizRes.json();
        codeName = bizData?.[0]?.name || '';
      }
    }

    const code = await generateUniqueCode(codeName, supabaseUrl, headers);

    // Insert
    const insertRes = await fetch(
      `${supabaseUrl}/rest/v1/referral_codes`,
      {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          customer_id: customerId,
          code,
        }),
      }
    );

    if (!insertRes.ok) {
      console.error('Referral code insert error:', await insertRes.text().catch(() => ''));
      return res.status(500).json({ error: 'Failed to create referral code' });
    }

    return res.status(200).json({
      code,
      totalReferrals: 0,
      successfulReferrals: 0,
      totalRewards: 0,
    });
  } catch (err) {
    console.error('Get referral code error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function generateUniqueCode(contactName, supabaseUrl, headers) {
  // Use first name only, strip accents & non-alpha, keep it short
  const firstName = contactName.split(/\s+/)[0] || '';
  const base = firstName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase() || 'REF';

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = String(Math.floor(Math.random() * 90) + 10); // 10-99
    const candidate = base + suffix;

    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/referral_codes?code=eq.${encodeURIComponent(candidate)}&select=id`,
      { headers }
    );
    const existing = await checkRes.json();
    if (!existing || existing.length === 0) {
      return candidate;
    }
  }

  // Fallback: use random string
  const fallback = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
  return fallback;
}
