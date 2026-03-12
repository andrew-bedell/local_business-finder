// Vercel serverless function: Check domain verification status
// GET ?websiteId=<uuid> — checks Vercel API and updates DB

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}&select=id,custom_domain,domain_status`,
      { headers: supabaseHeaders }
    );
    const webData = await webRes.json();
    if (!webData || webData.length === 0 || !webData[0].custom_domain) {
      return res.status(404).json({ error: 'No custom domain found for this website' });
    }
    const website = webData[0];

    // 2. Check domain status on Vercel
    const vercelRes = await fetch(
      `https://api.vercel.com/v10/projects/${vercelProjectId}/domains/${encodeURIComponent(website.custom_domain)}`,
      {
        headers: { 'Authorization': `Bearer ${vercelToken}` },
      }
    );

    if (!vercelRes.ok) {
      return res.status(200).json({
        domain: website.custom_domain,
        status: 'failed',
        verified: false,
      });
    }

    const vercelDomain = await vercelRes.json();
    const isVerified = vercelDomain.verified === true;

    // 3. Update DB if status changed
    const newStatus = isVerified ? 'verified' : 'pending_verification';
    if (newStatus !== website.domain_status) {
      const updatePayload = { domain_status: newStatus };
      if (isVerified) {
        updatePayload.domain_verified_at = new Date().toISOString();
      }

      await fetch(
        `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}`,
        {
          method: 'PATCH',
          headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify(updatePayload),
        }
      );
    }

    return res.status(200).json({
      domain: website.custom_domain,
      status: newStatus,
      verified: isVerified,
    });
  } catch (err) {
    console.error('Domain verify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
