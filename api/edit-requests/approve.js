// Vercel serverless function: Customer approves draft HTML — pushes to live
// POST { editRequestId } — moves draft_html → html, increments version, marks completed

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(503).json({ error: 'Supabase not configured' });

  const { editRequestId } = req.body || {};
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
    if (!websiteId) {
      return res.status(400).json({ error: 'Edit request has no associated website' });
    }

    // 2. Fetch the website
    const webRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}&select=id,config,version`,
      { headers: supabaseHeaders }
    );
    const webData = await webRes.json();
    if (!webData || webData.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }
    const website = webData[0];

    const draftHtml = website.config?.draft_html;
    if (!draftHtml) {
      return res.status(400).json({ error: 'No draft HTML found' });
    }

    // 3. Promote draft to live: html = draft_html, delete draft_html, increment version
    const updatedConfig = { ...website.config, html: draftHtml };
    delete updatedConfig.draft_html;

    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/generated_websites?id=eq.${encodeURIComponent(websiteId)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          config: updatedConfig,
          version: (website.version || 0) + 1,
          last_edited_at: new Date().toISOString(),
        }),
      }
    );
    if (!patchRes.ok) {
      return res.status(502).json({ error: 'Failed to update website' });
    }

    // 4. Update edit request status to completed
    await fetch(
      `${supabaseUrl}/rest/v1/edit_requests?id=eq.${encodeURIComponent(editRequestId)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'completed' }),
      }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Approve edit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
