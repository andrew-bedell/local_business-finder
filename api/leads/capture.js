// Vercel serverless function: Marketing lead capture
// Receives lead form submissions and saves to Supabase marketing_leads table.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { business_name, facebook_url, google_listing_url } = req.body || {};

  if (!business_name) {
    return res.status(400).json({ error: 'Missing required field: business_name' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const row = {
      business_name: business_name.trim(),
      source: 'website',
    };
    if (facebook_url) row.facebook_url = facebook_url.trim();
    if (google_listing_url) row.google_listing_url = google_listing_url.trim();

    const response = await fetch(
      `${supabaseUrl}/rest/v1/marketing_leads`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(row),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase insert error:', response.status, errorText);
      return res.status(500).json({ error: 'Failed to save lead' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Lead capture error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
