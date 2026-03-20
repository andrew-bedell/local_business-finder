// Vercel serverless function: List active products
// GET — returns active products ordered by sort_order

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

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/products?is_active=eq.true&order=sort_order.asc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Products list error:', err);
      return res.status(502).json({ error: 'Failed to fetch products' });
    }

    const products = await response.json();
    return res.status(200).json({ products });
  } catch (err) {
    console.error('Products list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
