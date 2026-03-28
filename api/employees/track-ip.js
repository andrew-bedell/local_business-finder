// Vercel serverless function: Record employee IP for analytics exclusion
// POST — called automatically on employee login (fire-and-forget)

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server config missing' });
  }

  // Extract IP from request
  const forwarded = req.headers['x-forwarded-for'] || '';
  const ip = forwarded.split(',')[0].trim() || req.headers['x-real-ip'] || 'unknown';

  if (!ip || ip === 'unknown') {
    return res.status(204).end();
  }

  // Parse body for employee info
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    body = {};
  }

  const employee_id = body.employee_id || null;
  const label = body.label || null;

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=minimal',
  };

  try {
    // Upsert — insert new IP or update last_seen_at if it already exists
    const response = await fetch(`${supabaseUrl}/rest/v1/excluded_ips`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ip_address: ip,
        employee_id,
        label,
        last_seen_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Excluded IP upsert error:', text);
    }

    return res.status(204).end();
  } catch (err) {
    console.error('Track IP error:', err);
    return res.status(204).end();
  }
}
