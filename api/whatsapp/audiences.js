// Vercel serverless function: CRUD for WhatsApp audiences
// GET  — list all audiences, or get one by ?id=
// POST — create audience
// PATCH — update audience
// DELETE — delete audience

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
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
      let url = `${supabaseUrl}/rest/v1/whatsapp_audiences?select=*&order=created_at.desc`;
      if (id) url = `${supabaseUrl}/rest/v1/whatsapp_audiences?id=eq.${id}&select=*`;

      const resp = await fetch(url, { headers });
      const data = await resp.json();
      return res.status(200).json(id ? (data[0] || null) : data);
    }

    // POST — create
    if (req.method === 'POST') {
      const { name, description, filters } = req.body || {};
      if (!name) return res.status(400).json({ error: 'Name is required' });

      // Compute business count
      const count = await computeAudienceCount(supabaseUrl, supabaseKey, filters || {});

      const resp = await fetch(`${supabaseUrl}/rest/v1/whatsapp_audiences`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          name,
          description: description || null,
          filters: filters || {},
          business_count: count,
          last_computed_at: new Date().toISOString(),
        }),
      });

      const data = await resp.json();
      if (!resp.ok) return res.status(resp.status).json({ error: 'Failed to create audience', detail: data });
      return res.status(201).json(data[0]);
    }

    // PATCH — update
    if (req.method === 'PATCH') {
      const { id, name, description, filters } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });

      const updates = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (filters !== undefined) {
        updates.filters = filters;
        updates.business_count = await computeAudienceCount(supabaseUrl, supabaseKey, filters);
        updates.last_computed_at = new Date().toISOString();
      }

      const resp = await fetch(`${supabaseUrl}/rest/v1/whatsapp_audiences?id=eq.${id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(updates),
      });

      const data = await resp.json();
      if (!resp.ok) return res.status(resp.status).json({ error: 'Failed to update audience', detail: data });
      return res.status(200).json(data[0]);
    }

    // DELETE
    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id query param is required' });

      // Check for active campaigns referencing this audience
      const campResp = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_campaigns?audience_id=eq.${id}&status=in.(draft,scheduled,sending)&select=id&limit=1`,
        { headers }
      );
      const campData = await campResp.json();
      if (campData && campData.length > 0) {
        return res.status(409).json({ error: 'Cannot delete audience with active campaigns' });
      }

      await fetch(`${supabaseUrl}/rest/v1/whatsapp_audiences?id=eq.${id}`, {
        method: 'DELETE',
        headers,
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Audiences API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function computeAudienceCount(supabaseUrl, supabaseKey, filters) {
  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/get_audience_businesses`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_filters: filters, p_limit: 1, p_offset: 0 }),
    });

    const data = await resp.json();
    if (data && data.length > 0 && data[0].total_count !== undefined) {
      return parseInt(data[0].total_count, 10);
    }
    return 0;
  } catch {
    return 0;
  }
}
