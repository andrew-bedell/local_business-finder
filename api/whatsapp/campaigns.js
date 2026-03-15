// Vercel serverless function: CRUD for WhatsApp campaigns
// GET  — list campaigns or get one by ?id=
// POST — create campaign
// PATCH — update campaign (status changes, params, schedule)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase credentials not configured' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // GET — list or get by id
    if (req.method === 'GET') {
      const id = req.query.id;
      const status = req.query.status;
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
      const offset = parseInt(req.query.offset, 10) || 0;

      let url = `${supabaseUrl}/rest/v1/whatsapp_campaigns?select=*,whatsapp_audiences(name),whatsapp_templates(template_name,body_text,language)&order=created_at.desc&limit=${limit}&offset=${offset}`;
      if (id) url = `${supabaseUrl}/rest/v1/whatsapp_campaigns?id=eq.${id}&select=*,whatsapp_audiences(name),whatsapp_templates(template_name,body_text,language)`;
      else if (status) url += `&status=eq.${status}`;

      const resp = await fetch(url, { headers });
      const data = await resp.json();
      return res.status(200).json(id ? (data[0] || null) : data);
    }

    // POST — create
    if (req.method === 'POST') {
      const { name, audience_id, template_id, template_params, scheduled_at } = req.body || {};
      if (!name || !audience_id || !template_id) {
        return res.status(400).json({ error: 'name, audience_id, and template_id are required' });
      }

      const campaignStatus = scheduled_at ? 'scheduled' : 'draft';

      const resp = await fetch(`${supabaseUrl}/rest/v1/whatsapp_campaigns`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          name,
          audience_id,
          template_id,
          template_params: template_params || [],
          status: campaignStatus,
          scheduled_at: scheduled_at || null,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) return res.status(resp.status).json({ error: 'Failed to create campaign', detail: data });
      return res.status(201).json(data[0]);
    }

    // PATCH — update
    if (req.method === 'PATCH') {
      const { id, name, template_params, scheduled_at, status } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });

      // Only allow updates on draft/scheduled campaigns
      const checkResp = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_campaigns?id=eq.${id}&select=status`,
        { headers }
      );
      const checkData = await checkResp.json();
      if (!checkData || checkData.length === 0) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const currentStatus = checkData[0].status;
      if (status === 'cancelled' && !['draft', 'scheduled'].includes(currentStatus)) {
        return res.status(409).json({ error: 'Can only cancel draft or scheduled campaigns' });
      }
      if (status !== 'cancelled' && !['draft', 'scheduled'].includes(currentStatus)) {
        return res.status(409).json({ error: 'Cannot modify a campaign that is sending or already sent' });
      }

      const updates = {};
      if (name !== undefined) updates.name = name;
      if (template_params !== undefined) updates.template_params = template_params;
      if (scheduled_at !== undefined) {
        updates.scheduled_at = scheduled_at;
        if (scheduled_at && currentStatus === 'draft') updates.status = 'scheduled';
      }
      if (status !== undefined) updates.status = status;

      const resp = await fetch(`${supabaseUrl}/rest/v1/whatsapp_campaigns?id=eq.${id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(updates),
      });

      const data = await resp.json();
      if (!resp.ok) return res.status(resp.status).json({ error: 'Failed to update campaign', detail: data });
      return res.status(200).json(data[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Campaigns API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
