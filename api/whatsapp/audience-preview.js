// Vercel serverless function: Preview businesses matching audience filters
// POST — returns matching businesses and count

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase credentials not configured' });
  }

  const { filters, limit, offset } = req.body || {};

  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/get_audience_businesses`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_filters: filters || {},
        p_limit: limit || 50,
        p_offset: offset || 0,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error('Audience preview RPC error:', data);
      return res.status(502).json({ error: 'Failed to preview audience', detail: data });
    }

    const totalCount = data && data.length > 0 ? parseInt(data[0].total_count, 10) : 0;

    return res.status(200).json({
      businesses: data || [],
      total_count: totalCount,
    });
  } catch (err) {
    console.error('Audience preview error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
