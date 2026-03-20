// Vercel serverless function: Create or update an email template
// POST — if body contains id, update (PATCH); otherwise insert (POST)

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

  const {
    id,
    name,
    description,
    category,
    trigger_key,
    subject,
    body_html,
    body_text,
    gjs_components,
    gjs_styles,
    gjs_html,
    merge_tags,
    is_active,
  } = req.body || {};

  if (!name || !subject || !body_html) {
    return res.status(400).json({ error: 'Missing required fields: name, subject, body_html' });
  }

  const payload = {
    name,
    description: description || null,
    category: category || 'custom',
    trigger_key: trigger_key || null,
    subject,
    body_html,
    body_text: body_text || null,
    gjs_components: gjs_components || null,
    gjs_styles: gjs_styles || null,
    gjs_html: gjs_html || null,
    merge_tags: merge_tags || [],
    is_active: is_active !== false,
  };

  try {
    let url = `${supabaseUrl}/rest/v1/email_templates`;
    let method = 'POST';
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };

    if (id) {
      url += `?id=eq.${encodeURIComponent(id)}`;
      method = 'PATCH';
      payload.last_updated_at = new Date().toISOString();
    }

    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Email template save error:', response.status, err);
      return res.status(502).json({ error: 'Failed to save email template', detail: err.message || err.msg || JSON.stringify(err) });
    }

    const data = await response.json();
    return res.status(200).json(data[0] || data);
  } catch (err) {
    console.error('Email template save error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
