// Vercel serverless function: Add custom domain to a website
// POST — validates domain, adds to Vercel project, saves to DB

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }
  if (!vercelToken || !vercelProjectId) {
    return res.status(503).json({ error: 'Vercel domain management not configured' });
  }

  const { websiteId, domain } = req.body || {};

  if (!websiteId || !domain) {
    return res.status(400).json({ error: 'Missing required fields: websiteId, domain' });
  }

  // Basic domain validation
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
  const cleanDomain = domain.toLowerCase().trim();
  if (!domainRegex.test(cleanDomain)) {
    return res.status(400).json({ error: 'Invalid domain format' });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Add domain to Vercel project
    const vercelRes = await fetch(
      `https://api.vercel.com/v10/projects/${vercelProjectId}/domains`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: cleanDomain }),
      }
    );

    const vercelData = await vercelRes.json();

    if (!vercelRes.ok && vercelData.error?.code !== 'domain_already_in_use') {
      console.error('Vercel domain add error:', vercelData);
      return res.status(502).json({
        error: 'Failed to add domain to hosting',
        detail: vercelData.error?.message || 'Unknown error',
      });
    }

    // 2. Update the website record with the custom domain
    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          custom_domain: cleanDomain,
          domain_status: 'pending_verification',
        }),
      }
    );

    if (!patchRes.ok) {
      const patchErr = await patchRes.json().catch(() => ({}));
      console.error('DB update error:', patchErr);
      return res.status(502).json({ error: 'Failed to save domain to database' });
    }

    // 3. Return DNS instructions
    return res.status(200).json({
      success: true,
      domain: cleanDomain,
      status: 'pending_verification',
      dns: {
        type: 'CNAME',
        name: cleanDomain.startsWith('www.') ? 'www' : '@',
        value: 'cname.vercel-dns.com',
        instructions: `Agrega un registro CNAME en tu proveedor de dominio:\n\nTipo: CNAME\nNombre: ${cleanDomain.startsWith('www.') ? 'www' : '@'}\nValor: cname.vercel-dns.com\n\nLa verificacion puede tardar hasta 24 horas.`,
      },
    });
  } catch (err) {
    console.error('Domain add error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
