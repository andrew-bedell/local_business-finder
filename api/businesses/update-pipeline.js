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

  const { businessId, pipeline_status, lead_source, contact_name, contact_phone, contact_email, contact_whatsapp, phone, email, address_country, name, address_full, notes, outreach_sent, outreach_step, outreach_cancel, outreach_domain_select } = req.body || {};

  if (!businessId) {
    return res.status(400).json({ error: 'Missing required field: businessId' });
  }

  const validStatuses = ['saved', 'lead', 'demo', 'active_customer', 'inactive_customer'];
  if (pipeline_status && !validStatuses.includes(pipeline_status)) {
    return res.status(400).json({ error: 'Invalid pipeline_status. Must be one of: ' + validStatuses.join(', ') });
  }

  const validSteps = ['1', '2', '3', 'followup', 'about'];
  if (outreach_step && !validSteps.includes(outreach_step)) {
    return res.status(400).json({ error: 'Invalid outreach_step. Must be one of: ' + validSteps.join(', ') });
  }

  const supabaseHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  try {
    // If marking an outreach step, cancelling, or saving domain selection, we need to fetch current steps first then merge
    let mergedSteps = null;
    if (outreach_step || outreach_cancel || outreach_domain_select) {
      const getRes = await fetch(
        `${supabaseUrl}/rest/v1/businesses?id=eq.${encodeURIComponent(businessId)}&select=outreach_steps`,
        { headers: supabaseHeaders }
      );
      const current = getRes.ok ? await getRes.json() : [];
      const existing = (current[0] && current[0].outreach_steps) || {};

      if (outreach_step) {
        mergedSteps = { ...existing, [outreach_step]: { sent_at: new Date().toISOString() } };
      }

      if (outreach_cancel) {
        const validReasons = ['no_whatsapp', 'wrong_number', 'not_a_business', 'not_interested', 'other'];
        if (outreach_cancel.action === 'cancel') {
          if (!outreach_cancel.reason || !validReasons.includes(outreach_cancel.reason)) {
            return res.status(400).json({ error: 'Invalid cancel reason. Must be one of: ' + validReasons.join(', ') });
          }
          mergedSteps = { ...(mergedSteps || existing), _cancelled: { at: new Date().toISOString(), reason: outreach_cancel.reason } };
        } else if (outreach_cancel.action === 'uncancel') {
          const base = mergedSteps || { ...existing };
          delete base._cancelled;
          mergedSteps = base;
        } else {
          return res.status(400).json({ error: 'Invalid outreach_cancel action. Must be cancel or uncancel' });
        }
      }

      if (outreach_domain_select) {
        const base = mergedSteps || existing;
        mergedSteps = { ...base, _domain: outreach_domain_select };
      }
    }

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
    if (lead_source) updatePayload.lead_source = lead_source;
    if (outreach_sent !== undefined) updatePayload.outreach_sent = outreach_sent;

    if (mergedSteps) {
      updatePayload.outreach_steps = mergedSteps;
      // Auto-set outreach_sent when all 3 core steps are done
      const coreSteps = ['1', '2', '3'];
      const allCoreDone = coreSteps.every(s => mergedSteps[s] && mergedSteps[s].sent_at);
      if (allCoreDone) {
        updatePayload.outreach_sent = true;
      }
    }

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
