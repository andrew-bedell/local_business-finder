function cleanBusinessId(value) {
  var raw = String(value || '').trim();
  return /^\d+$/.test(raw) ? raw : '';
}

function parsePrice(value) {
  if (value == null || value === '') return null;
  var normalized = String(value).replace(/[^\d.,-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  var parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
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

    var files = Array.isArray(body.files) ? body.files : [];
    var imageRows = files
      .filter(function (file) {
        return file && file.file_type === 'image' && (file.public_url || file.url);
      })
      .map(function (file, index) {
        return {
          business_id: parseInt(businessId, 10),
          source: 'customer_catalog_upload',
          photo_type: 'product',
          storage_path: file.storage_path || null,
          url: file.public_url || file.url,
          is_primary: index === 0
        };
      });

    if (imageRows.length) {
      await fetch(supabaseUrl + '/rest/v1/business_photos', {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(imageRows)
      });
    }

    if (body.replaceServices) {
      await fetch(supabaseUrl + '/rest/v1/business_services?business_id=eq.' + encodeURIComponent(businessId), {
        method: 'DELETE',
        headers: {
          ...headers,
          'Prefer': 'return=minimal'
        }
      });
    }

    var items = Array.isArray(body.items) ? body.items : [];
    var serviceRows = items
      .map(function (item, index) {
        var name = String(item && item.name || '').trim();
        var description = String(item && item.description || '').trim();
        if (!name && description) name = description.slice(0, 80);
        return {
          business_id: parseInt(businessId, 10),
          name: name,
          description: description || null,
          price: parsePrice(item && item.price),
          currency: String(item && item.currency || 'COP').trim().slice(0, 12) || 'COP',
          sort_order: index
        };
      })
      .filter(function (row) {
        return row.name;
      });

    if (serviceRows.length) {
      var servicesRes = await fetch(supabaseUrl + '/rest/v1/business_services', {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(serviceRows)
      });

      if (!servicesRes.ok) {
        var serviceErr = await servicesRes.text().catch(function () { return ''; });
        console.error('public-builder/save-catalog services error:', servicesRes.status, serviceErr.substring(0, 300));
        return res.status(502).json({ error: 'Failed to save catalog items' });
      }
    }

    await fetch(supabaseUrl + '/rest/v1/businesses?id=eq.' + encodeURIComponent(businessId), {
      method: 'PATCH',
      headers: {
        ...headers,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        pipeline_status: 'lead',
        pipeline_status_changed_at: new Date().toISOString()
      })
    }).catch(function (err) {
      console.warn('Failed to update business status after catalog save:', err && err.message || err);
    });

    return res.status(200).json({
      success: true,
      savedItems: serviceRows.length,
      savedPhotos: imageRows.length
    });
  } catch (err) {
    console.error('public-builder/save-catalog error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
