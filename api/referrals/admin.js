// Vercel serverless function: List all referrals for employee admin
// GET — returns referrals with referrer info, supports status filter

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const { status, search } = req.query || {};

    // Build query — join referral_codes and customers for referrer info
    let url = `${supabaseUrl}/rest/v1/referrals?select=*,referral_codes(code,customer_id),referrer:referrer_customer_id(contact_name,email,business_id)&order=created_at.desc&limit=200`;

    if (status) {
      url += `&status=eq.${encodeURIComponent(status)}`;
    }

    const refRes = await fetch(url, { headers: supabaseHeaders });
    if (!refRes.ok) {
      const errText = await refRes.text().catch(() => '');
      console.error('Referrals fetch error:', refRes.status, errText);
      return res.status(502).json({ error: 'Failed to fetch referrals' });
    }

    let referrals = await refRes.json();

    // Enrich with referrer business names
    const businessIds = [...new Set(
      referrals
        .filter(r => r.referrer && r.referrer.business_id)
        .map(r => r.referrer.business_id)
    )];

    let businessMap = {};
    if (businessIds.length > 0) {
      const bizRes = await fetch(
        `${supabaseUrl}/rest/v1/businesses?id=in.(${businessIds.join(',')})&select=id,name`,
        { headers: supabaseHeaders }
      );
      if (bizRes.ok) {
        const biz = await bizRes.json();
        biz.forEach(b => { businessMap[b.id] = b.name; });
      }
    }

    // Map to flat response
    const result = referrals.map(r => ({
      id: r.id,
      referralCode: r.referral_codes ? r.referral_codes.code : null,
      referrerName: r.referrer ? r.referrer.contact_name : null,
      referrerEmail: r.referrer ? r.referrer.email : null,
      referrerBusinessName: r.referrer && r.referrer.business_id ? businessMap[r.referrer.business_id] || null : null,
      referredBusinessName: r.referred_business_name,
      referredPhone: r.referred_phone,
      referredEmail: r.referred_email,
      referredCity: r.referred_city,
      status: r.status,
      referrerRewardStatus: r.referrer_reward_status,
      referredRewardStatus: r.referred_reward_status,
      source: r.source,
      createdAt: r.created_at,
      convertedAt: r.converted_at,
      rewardedAt: r.rewarded_at,
    }));

    // Client-side search filter
    let filtered = result;
    if (search) {
      const q = search.toLowerCase();
      filtered = result.filter(r =>
        (r.referrerName && r.referrerName.toLowerCase().includes(q)) ||
        (r.referrerBusinessName && r.referrerBusinessName.toLowerCase().includes(q)) ||
        (r.referredBusinessName && r.referredBusinessName.toLowerCase().includes(q)) ||
        (r.referredPhone && r.referredPhone.includes(q)) ||
        (r.referredEmail && r.referredEmail.toLowerCase().includes(q)) ||
        (r.referralCode && r.referralCode.toLowerCase().includes(q))
      );
    }

    return res.status(200).json(filtered);
  } catch (err) {
    console.error('Admin referrals error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
