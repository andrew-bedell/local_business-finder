// Vercel serverless function: List referrals for logged-in customer
// GET — returns the customer's referral history

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

    // Fetch referrals
    const refRes = await fetch(
      `${supabaseUrl}/rest/v1/referrals?referrer_customer_id=eq.${customerId}&select=id,referred_business_name,referred_city,status,referrer_reward_status,source,created_at,converted_at,rewarded_at&order=created_at.desc`,
      { headers }
    );
    const referrals = await refRes.json();

    return res.status(200).json({ referrals: referrals || [] });
  } catch (err) {
    console.error('List referrals error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
