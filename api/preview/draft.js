// Vercel serverless function: Fetch draft website HTML for review preview
// GET ?website_id=<uuid> — returns draft_html from website config

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(503).json({ error: 'Supabase not configured' });

  const websiteId = req.query.website_id;
  if (!websiteId) return res.status(400).json({ error: 'Missing required parameter: website_id' });

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}&select=id,config,businesses(id,name)`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Draft preview fetch error:', await response.text());
      return res.status(502).json({ error: 'Failed to fetch website' });
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const website = data[0];
    const draftHtml = website.config?.draft_html;
    const currentHtml = website.config?.html;
    const business = website.businesses || {};

    return res.status(200).json({
      draftHtml: draftHtml || null,
      currentHtml: currentHtml || null,
      businessName: business.name || '',
      websiteId: website.id,
    });
  } catch (err) {
    console.error('Draft preview error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
