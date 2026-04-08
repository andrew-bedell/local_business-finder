// Vercel serverless function: Fetch lightweight business data for demo landing page
// GET ?id=<uuid> — returns business name, category, city, country (no HTML)

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

  const websiteId = req.query.id;
  if (!websiteId) {
    return res.status(400).json({ error: 'Missing required parameter: id' });
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}&select=id,slug,businesses(name,category,address_city,address_country)`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Demo landing fetch error:', err);
      return res.status(502).json({ error: 'Failed to fetch website data' });
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const website = data[0];
    const business = website.businesses || {};

    return res.status(200).json({
      websiteId: website.id,
      slug: website.slug || '',
      businessName: business.name || '',
      businessCategory: business.category || '',
      businessCity: business.address_city || '',
      businessCountry: business.address_country || '',
    });
  } catch (err) {
    console.error('Demo landing fetch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
