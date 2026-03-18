// Vercel serverless function: Delete an email template
// DELETE — body or query param: id

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const id = (req.body && req.body.id) || (req.query && req.query.id);

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id' });
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/email_templates?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Email template delete error:', err);
      return res.status(502).json({ error: 'Failed to delete email template' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email template delete error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
