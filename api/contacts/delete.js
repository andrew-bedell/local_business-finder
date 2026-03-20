// Vercel serverless function: Delete a contact
// POST — { contactId, businessId }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const { contactId, businessId } = req.body || {};

  if (!contactId) {
    return res.status(400).json({ error: 'Missing required field: contactId' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const delRes = await fetch(
      `${supabaseUrl}/rest/v1/business_contacts?id=eq.${encodeURIComponent(contactId)}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    if (!delRes.ok) {
      const errText = await delRes.text().catch(() => '');
      return res.status(502).json({ error: 'Failed to delete contact', detail: errText });
    }

    // Sync legacy fields after deletion
    if (businessId) {
      const fetchRes = await fetch(
        `${supabaseUrl}/rest/v1/business_contacts?business_id=eq.${encodeURIComponent(businessId)}&is_primary=eq.true&limit=1`,
        { headers }
      );
      const contacts = fetchRes.ok ? await fetchRes.json() : [];
      const primary = contacts[0] || null;

      await fetch(
        `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            contact_name: primary?.contact_name || null,
            contact_phone: primary?.contact_phone || null,
            contact_email: primary?.contact_email || null,
            contact_whatsapp: primary?.contact_whatsapp || null,
          }),
        }
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete contact error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
