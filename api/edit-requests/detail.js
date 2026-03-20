// Vercel serverless function: Get single edit request with full details
// GET ?id=<uuid> — returns edit request with all fields

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(503).json({ error: 'Supabase not configured' });

  const editRequestId = req.query.id;
  if (!editRequestId) return res.status(400).json({ error: 'Missing required parameter: id' });

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/edit_requests?id=eq.${encodeURIComponent(editRequestId)}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Edit request detail fetch error:', await response.text());
      return res.status(502).json({ error: 'Failed to fetch edit request' });
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Edit request not found' });
    }

    return res.status(200).json({ editRequest: data[0] });
  } catch (err) {
    console.error('Edit request detail error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
