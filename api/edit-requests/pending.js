// Vercel serverless function: Get pending approval edit requests for a customer
// GET ?customer_id=<uuid> — returns edit requests with status 'ready_for_review'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(503).json({ error: 'Supabase not configured' });

  const customerId = req.query.customer_id;
  if (!customerId) return res.status(400).json({ error: 'Missing required parameter: customer_id' });

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/edit_requests?customer_id=eq.${encodeURIComponent(customerId)}&status=eq.ready_for_review&select=id,description,request_type,ai_edit_summary,created_at,website_id&order=created_at.desc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Pending edit requests fetch error:', await response.text());
      return res.status(502).json({ error: 'Failed to fetch pending edit requests' });
    }

    const editRequests = await response.json();

    return res.status(200).json({
      editRequests: editRequests || [],
      count: (editRequests || []).length,
    });
  } catch (err) {
    console.error('Pending edit requests error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
