// Vercel serverless function: Remove custom domain from a website
// DELETE — removes from Vercel project and clears DB

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID;

  if (!supabaseUrl || !supabaseKey || !vercelToken || !vercelProjectId) {
    return res.status(503).json({ error: 'Service not configured' });
  }

  const websiteId = req.query.websiteId;
  if (!websiteId) {
    return res.status(400).json({ error: 'Missing required parameter: websiteId' });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Get website's custom domain
    const webRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}&select=id,custom_domain`,
      { headers: supabaseHeaders }
    );
    const webData = await webRes.json();
    if (!webData || webData.length === 0 || !webData[0].custom_domain) {
      return res.status(404).json({ error: 'No custom domain found for this website' });
    }
    const domain = webData[0].custom_domain;

    // 2. Remove from Vercel
    await fetch(
      `https://api.vercel.com/v10/projects/${vercelProjectId}/domains/${encodeURIComponent(domain)}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${vercelToken}` },
      }
    );

    // 3. Clear from DB
    await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          custom_domain: null,
          domain_status: null,
          domain_verified_at: null,
        }),
      }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Domain remove error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
