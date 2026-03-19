// Vercel serverless function: Customer rejects draft HTML
// POST { editRequestId, reason } — deletes draft_html, sets status to customer_rejected

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(503).json({ error: 'Supabase not configured' });

  const { editRequestId, reason } = req.body || {};
  if (!editRequestId) return res.status(400).json({ error: 'Missing required field: editRequestId' });

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Fetch the edit request
    const erRes = await fetch(
      `${supabaseUrl}/rest/v1/edit_requests?id=eq.${encodeURIComponent(editRequestId)}&select=*`,
      { headers: supabaseHeaders }
    );
    const erData = await erRes.json();
    if (!erData || erData.length === 0) {
      return res.status(404).json({ error: 'Edit request not found' });
    }
    const editRequest = erData[0];

    if (editRequest.status !== 'ready_for_review') {
      return res.status(400).json({ error: 'Edit request is not ready for review' });
    }

    const websiteId = editRequest.website_id;

    // 2. Remove draft_html from website config
    if (websiteId) {
      const webRes = await fetch(
        `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}&select=id,config`,
        { headers: supabaseHeaders }
      );
      const webData = await webRes.json();
      if (webData?.[0]?.config?.draft_html) {
        const updatedConfig = { ...webData[0].config };
        delete updatedConfig.draft_html;
        await fetch(
          `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}`,
          {
            method: 'PATCH',
            headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ config: updatedConfig }),
          }
        );
      }
    }

    // 3. Update edit request status to customer_rejected with reason
    await fetch(
      `${supabaseUrl}/rest/v1/edit_requests?id=eq.${encodeURIComponent(editRequestId)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          status: 'customer_rejected',
          rejection_reason: reason || null,
        }),
      }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Customer reject edit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
