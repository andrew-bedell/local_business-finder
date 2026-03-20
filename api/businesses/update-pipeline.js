// Vercel serverless function: Update business pipeline status, contact, and info fields
// POST — updates pipeline_status and optionally contact/business fields

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

  const { businessId, pipeline_status, contact_name, contact_phone, contact_email, contact_whatsapp, phone, email, address_country, name, address_full, notes } = req.body || {};

  if (!businessId) {
    return res.status(400).json({ error: 'Missing required field: businessId' });
  }

  const validStatuses = ['saved', 'lead', 'demo', 'active_customer', 'inactive_customer'];
  if (pipeline_status && !validStatuses.includes(pipeline_status)) {
    return res.status(400).json({ error: 'Invalid pipeline_status. Must be one of: ' + validStatuses.join(', ') });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  try {
    const updatePayload = {};

    if (pipeline_status) {
      updatePayload.pipeline_status = pipeline_status;
      updatePayload.pipeline_status_changed_at = new Date().toISOString();
    }
    if (contact_name !== undefined) updatePayload.contact_name = contact_name;
    if (contact_phone !== undefined) updatePayload.contact_phone = contact_phone;
    if (contact_email !== undefined) updatePayload.contact_email = contact_email;
    if (contact_whatsapp !== undefined) updatePayload.contact_whatsapp = contact_whatsapp;
    if (phone !== undefined) updatePayload.phone = phone;
    if (email !== undefined) updatePayload.email = email;
    if (address_country !== undefined) updatePayload.address_country = address_country;
    if (name !== undefined) updatePayload.name = name;
    if (address_full !== undefined) updatePayload.address_full = address_full;
    if (notes !== undefined) updatePayload.notes = notes;

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}`,
      {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify(updatePayload),
      }
    );

    if (!patchRes.ok) {
      const errText = await patchRes.text().catch(() => '');
      console.error('Pipeline update error:', patchRes.status, errText);
      return res.status(502).json({ error: 'Failed to update business', detail: errText });
    }

    const updated = await patchRes.json();
    return res.status(200).json({ success: true, business: updated[0] || null });
  } catch (err) {
    console.error('Update pipeline error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
