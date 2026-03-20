// Vercel serverless function: List contacts for a business
// GET ?businessId=123

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const { businessId } = req.query;
  if (!businessId) {
    return res.status(400).json({ error: 'Missing required query param: businessId' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const fetchRes = await fetch(
      `${supabaseUrl}/rest/v1/business_contacts?business_id=eq.${encodeURIComponent(businessId)}&order=is_primary.desc,created_at.asc`,
      { headers }
    );

    if (!fetchRes.ok) {
      const errText = await fetchRes.text().catch(() => '');
      return res.status(502).json({ error: 'Failed to fetch contacts', detail: errText });
    }

    const contacts = await fetchRes.json();
    return res.status(200).json({ contacts });
  } catch (err) {
    console.error('List contacts error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
