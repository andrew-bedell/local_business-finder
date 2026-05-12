function cleanBusinessId(value) {
  var raw = String(value || '').trim();
  return /^\d+$/.test(raw) ? raw : '';
}

function resolveLeadSource(body) {
  return body && body.leadSource === 'advanced_intake' ? 'advanced_intake' : '';
}

async function savePrimaryContact(supabaseUrl, serviceKey, businessId, body) {
  var headers = {
    'apikey': serviceKey,
    'Authorization': 'Bearer ' + serviceKey,
    'Content-Type': 'application/json'
  };

  var contactPayload = {
    business_id: parseInt(businessId, 10),
    contact_name: body.contactName || null,
    contact_email: body.contactEmail || null,
    contact_phone: body.businessPhone || null,
    contact_whatsapp: body.contactWhatsapp || null,
    is_primary: true
  };

  var existingRes = await fetch(
    supabaseUrl + '/rest/v1/business_contacts?business_id=eq.' + encodeURIComponent(businessId) + '&is_primary=eq.true&select=id&limit=1',
    { headers: headers }
  );
  var existing = existingRes.ok ? await existingRes.json() : [];

  if (Array.isArray(existing) && existing.length) {
    await fetch(supabaseUrl + '/rest/v1/business_contacts?id=eq.' + encodeURIComponent(existing[0].id), {
      method: 'PATCH',
      headers: {
        ...headers,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(contactPayload)
    });
    return;
  }

  await fetch(supabaseUrl + '/rest/v1/business_contacts', {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(contactPayload)
  });
}

async function saveLogoPhoto(supabaseUrl, serviceKey, businessId, body) {
  var logo = body.logoPhoto || null;
  if (!logo) return;

  var headers = {
    'apikey': serviceKey,
    'Authorization': 'Bearer ' + serviceKey,
    'Content-Type': 'application/json'
  };

  var sourceFilter = 'source=in.(customer_logo_upload,customer_generated_logo,customer_upload)';
  await fetch(
    supabaseUrl + '/rest/v1/business_photos?business_id=eq.' + encodeURIComponent(businessId) + '&photo_type=eq.logo&' + sourceFilter,
    {
      method: 'DELETE',
      headers: {
        ...headers,
        'Prefer': 'return=minimal'
      }
    }
  );

  if (logo.clear) return;

  var logoUrl = String(logo.public_url || logo.url || '').trim();
  if (!logoUrl) return;

  await fetch(supabaseUrl + '/rest/v1/business_photos', {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      business_id: parseInt(businessId, 10),
      source: logo.source === 'generated' ? 'customer_generated_logo' : 'customer_logo_upload',
      photo_type: 'logo',
      storage_path: logo.storage_path || null,
      url: logoUrl,
      caption: logo.label || null,
      is_primary: false
    })
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var supabaseUrl = process.env.SUPABASE_URL;
  var serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({ error: 'Supabase service key not configured' });
  }

  var body = req.body || {};
  var businessId = cleanBusinessId(body.businessId || body.business_id);
  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' });
  }

  var company = String(body.company || '').trim();
  var businessType = String(body.businessType || '').trim();

  var updatePayload = {
    pipeline_status: 'lead',
    pipeline_status_changed_at: new Date().toISOString()
  };

  if (company) updatePayload.name = company;
  if (businessType) updatePayload.category = businessType;
  if (body.addressFull != null) updatePayload.address_full = body.addressFull || null;
  if (body.city != null) updatePayload.address_city = body.city || null;
  if (body.businessPhone != null) updatePayload.phone = body.businessPhone || null;
  if (body.contactWhatsapp != null) updatePayload.whatsapp = body.contactWhatsapp || null;
  if (body.publicEmail != null || body.contactEmail != null) updatePayload.email = body.publicEmail || body.contactEmail || null;
  if (body.aboutBusiness != null) updatePayload.description = body.aboutBusiness || null;
  if (body.contactName != null) updatePayload.contact_name = body.contactName || null;
  if (body.contactEmail != null) updatePayload.contact_email = body.contactEmail || null;
  if (body.contactWhatsapp != null) updatePayload.contact_whatsapp = body.contactWhatsapp || null;
  if (body.extraNotes != null) updatePayload.notes = body.extraNotes || null;
  var leadSource = resolveLeadSource(body);
  if (leadSource) updatePayload.lead_source = leadSource;
  if (body.hours && typeof body.hours === 'object' && Object.keys(body.hours).length) {
    updatePayload.hours = body.hours;
  }

  var headers = {
    'apikey': serviceKey,
    'Authorization': 'Bearer ' + serviceKey,
    'Content-Type': 'application/json'
  };

  try {
    var bizRes = await fetch(supabaseUrl + '/rest/v1/businesses?id=eq.' + encodeURIComponent(businessId) + '&select=id', {
      headers: headers
    });
    var bizRows = bizRes.ok ? await bizRes.json() : [];
    if (!Array.isArray(bizRows) || !bizRows.length) {
      return res.status(404).json({ error: 'Business not found' });
    }

    var updateRes = await fetch(supabaseUrl + '/rest/v1/businesses?id=eq.' + encodeURIComponent(businessId), {
      method: 'PATCH',
      headers: {
        ...headers,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(updatePayload)
    });

    if (!updateRes.ok) {
      var updateErr = await updateRes.text().catch(function () { return ''; });
      console.error('save-intake-progress business update error:', updateRes.status, updateErr.substring(0, 300));
      return res.status(502).json({ error: 'Failed to save progress' });
    }

    await savePrimaryContact(supabaseUrl, serviceKey, businessId, body).catch(function (err) {
      console.warn('save-intake-progress contact warning:', err && err.message || err);
    });

    await saveLogoPhoto(supabaseUrl, serviceKey, businessId, body).catch(function (err) {
      console.warn('save-intake-progress logo warning:', err && err.message || err);
    });

    return res.status(200).json({ success: true, businessId: parseInt(businessId, 10) });
  } catch (err) {
    console.error('save-intake-progress error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
