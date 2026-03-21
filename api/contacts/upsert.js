// Vercel serverless function: Create or update a contact
// POST — { businessId, contactId?, contact_name, contact_title, contact_phone, contact_email, contact_whatsapp, notes, is_primary }

import { normalizePhone } from '../_lib/phone-utils.js';

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

  const { businessId, contactId, contact_name, contact_title, contact_phone, contact_email, contact_whatsapp, notes, is_primary } = req.body || {};

  if (!businessId) {
    return res.status(400).json({ error: 'Missing required field: businessId' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  try {
    // If setting as primary, unset other primary contacts for this business
    if (is_primary) {
      await fetch(
        `${supabaseUrl}/rest/v1/business_contacts?business_id=eq.${encodeURIComponent(businessId)}&is_primary=eq.true`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ is_primary: false }),
        }
      );
    }

    const payload = {
      business_id: businessId,
      updated_at: new Date().toISOString(),
    };

    if (contact_name !== undefined) payload.contact_name = contact_name;
    if (contact_title !== undefined) payload.contact_title = contact_title;
    if (contact_phone !== undefined) payload.contact_phone = normalizePhone(contact_phone);
    if (contact_email !== undefined) payload.contact_email = contact_email;
    if (contact_whatsapp !== undefined) payload.contact_whatsapp = normalizePhone(contact_whatsapp);
    if (notes !== undefined) payload.notes = notes;
    if (is_primary !== undefined) payload.is_primary = is_primary;

    let result;

    if (contactId) {
      // Update existing contact
      const patchRes = await fetch(
        `${supabaseUrl}/rest/v1/business_contacts?id=eq.${encodeURIComponent(contactId)}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
        }
      );

      if (!patchRes.ok) {
        const errText = await patchRes.text().catch(() => '');
        return res.status(502).json({ error: 'Failed to update contact', detail: errText });
      }
      result = await patchRes.json();
    } else {
      // Create new contact
      const postRes = await fetch(
        `${supabaseUrl}/rest/v1/business_contacts`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        }
      );

      if (!postRes.ok) {
        const errText = await postRes.text().catch(() => '');
        return res.status(502).json({ error: 'Failed to create contact', detail: errText });
      }
      result = await postRes.json();
    }

    // Also update the legacy contact fields on the businesses table with the primary contact
    await syncPrimaryContactToLegacy(supabaseUrl, headers, businessId);

    return res.status(200).json({ success: true, contact: result[0] || null });
  } catch (err) {
    console.error('Upsert contact error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Sync the primary contact's info back to the legacy contact_* fields on businesses
async function syncPrimaryContactToLegacy(supabaseUrl, headers, businessId) {
  try {
    const fetchRes = await fetch(
      `${supabaseUrl}/rest/v1/business_contacts?business_id=eq.${encodeURIComponent(businessId)}&is_primary=eq.true&limit=1`,
      { headers }
    );
    if (!fetchRes.ok) return;
    const contacts = await fetchRes.json();

    const primary = contacts[0] || null;
    const legacyUpdate = {
      contact_name: primary?.contact_name || null,
      contact_phone: primary?.contact_phone || null,
      contact_email: primary?.contact_email || null,
      contact_whatsapp: primary?.contact_whatsapp || null,
    };

    await fetch(
      `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}`,
      {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify(legacyUpdate),
      }
    );
  } catch (err) {
    console.warn('Failed to sync primary contact to legacy fields:', err);
  }
}
