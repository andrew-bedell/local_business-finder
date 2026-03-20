// Vercel serverless function: Duplicate an email template
// POST — body: { id } of template to duplicate

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const { id } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id' });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // Fetch the original template
    const fetchRes = await fetch(
      `${supabaseUrl}/rest/v1/email_templates?id=eq.${encodeURIComponent(id)}`,
      { headers: supabaseHeaders }
    );

    if (!fetchRes.ok) {
      const err = await fetchRes.json().catch(() => ({}));
      console.error('Email template fetch error:', err);
      return res.status(502).json({ error: 'Failed to fetch template' });
    }

    const templates = await fetchRes.json();
    if (!templates.length) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const original = templates[0];

    // Create a copy with modifications
    const copy = {
      name: `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      trigger_key: null, // Clear trigger_key for the copy
      subject: original.subject,
      body_html: original.body_html,
      body_text: original.body_text,
      gjs_components: original.gjs_components,
      gjs_styles: original.gjs_styles,
      gjs_html: original.gjs_html,
      merge_tags: original.merge_tags,
      is_active: false, // Copies start inactive
    };

    const insertRes = await fetch(
      `${supabaseUrl}/rest/v1/email_templates`,
      {
        method: 'POST',
        headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
        body: JSON.stringify(copy),
      }
    );

    if (!insertRes.ok) {
      const err = await insertRes.json().catch(() => ({}));
      console.error('Email template duplicate insert error:', err);
      return res.status(502).json({ error: 'Failed to duplicate template', detail: err.message || err.msg || JSON.stringify(err) });
    }

    const data = await insertRes.json();
    return res.status(200).json({ template: data[0] || data });
  } catch (err) {
    console.error('Email template duplicate error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
