// Vercel serverless function: List email templates
// GET — optional query params: category, active

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
    const { category, active } = req.query || {};

    let url = `${supabaseUrl}/rest/v1/email_templates?order=category.asc,name.asc`;

    if (category) {
      url += `&category=eq.${encodeURIComponent(category)}`;
    }

    if (active === 'true') {
      url += '&is_active=eq.true';
    } else if (active === 'false') {
      url += '&is_active=eq.false';
    }

    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Email templates list error:', err);
      return res.status(502).json({ error: 'Failed to fetch email templates' });
    }

    const templates = await response.json();
    return res.status(200).json(templates);
  } catch (err) {
    console.error('Email templates list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
