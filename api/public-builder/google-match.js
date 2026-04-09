function namesMatch(a, b) {
  if (!a || !b) return false;
  var normalize = function (value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]/g, '')
      .trim();
  };
  var na = normalize(a);
  var nb = normalize(b);
  return na === nb || na.indexOf(nb) !== -1 || nb.indexOf(na) !== -1;
}

function parseAddressComponents(addressStr) {
  if (!addressStr) return {};
  var parts = String(addressStr).split(',').map(function (part) { return part.trim(); }).filter(Boolean);
  var result = {};

  for (var i = parts.length - 1; i >= 0 && i >= parts.length - 3; i--) {
    var part = parts[i];
    if (!result.address_zip && /^\d{4,6}$/.test(part)) {
      result.address_zip = part;
      continue;
    }
    var stateZipMatch = part.match(/^([A-Za-zÀ-ÿ.]+)\s+(\d{4,6})$/);
    if (stateZipMatch && !result.address_state) {
      result.address_state = stateZipMatch[1];
      if (!result.address_zip) result.address_zip = stateZipMatch[2];
      continue;
    }
    if (!result.address_state && !result.address_city && /^[A-Za-zÀ-ÿ\s.]{2,30}$/.test(part) && !/^\d/.test(part)) {
      if (i === parts.length - 1 || (i === parts.length - 2 && result.address_zip)) {
        result.address_state = part;
      }
    }
  }

  if (result.address_state) {
    var stateIndex = parts.findIndex(function (part) { return part === result.address_state; });
    if (stateIndex > 0 && /^[A-Za-zÀ-ÿ\s.'-]{2,40}$/.test(parts[stateIndex - 1])) {
      result.address_city = parts[stateIndex - 1];
    }
  }

  if (!result.address_city && parts.length >= 2) {
    var lastPart = result.address_zip ? parts[parts.length - 2] : parts[parts.length - 1];
    if (lastPart && /^[A-Za-zÀ-ÿ\s.'-]{2,40}$/.test(lastPart)) {
      result.address_city = lastPart;
    }
  }

  return result;
}

function formatGoogleResult(result) {
  var addr = parseAddressComponents(result.address);
  return {
    placeId: result.place_id || null,
    dataId: result.data_id || null,
    name: result.title || '',
    address: result.address || '',
    addressCity: addr.address_city || null,
    addressState: addr.address_state || null,
    addressZip: addr.address_zip || null,
    rating: result.rating || null,
    reviewCount: result.reviews || null,
    mapsUrl: result.link || null,
    phone: result.phone || null,
    types: result.type ? [result.type] : [],
    latitude: result.gps_coordinates && result.gps_coordinates.latitude || null,
    longitude: result.gps_coordinates && result.gps_coordinates.longitude || null,
    hours: result.hours || null,
    thumbnail: result.thumbnail || null
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var apiKey = process.env.SEARCHAPI_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'SearchAPI key not configured' });
  }

  var body = req.body || {};
  var businessName = String(body.businessName || '').trim();
  var city = String(body.city || '').trim();
  if (!businessName || !city) {
    return res.status(400).json({ error: 'businessName and city are required' });
  }

  try {
    var query = businessName + ', ' + city;
    var url = 'https://www.searchapi.io/api/v1/search?engine=google_maps&q=' + encodeURIComponent(query) + '&api_key=' + encodeURIComponent(apiKey);
    var response = await fetch(url);

    if (!response.ok) {
      var errorText = await response.text().catch(function () { return ''; });
      console.error('SearchAPI request failed:', response.status, errorText.substring(0, 300));
      return res.status(502).json({ error: 'Google search request failed' });
    }

    var data = await response.json();
    var matches = (data.local_results || []).filter(function (item) {
      return namesMatch(item.title, businessName);
    });

    if (matches.length === 0) {
      return res.status(200).json({ outcome: 'not_found' });
    }

    if (matches.length === 1) {
      return res.status(200).json({
        outcome: 'matched',
        match: formatGoogleResult(matches[0])
      });
    }

    return res.status(200).json({
      outcome: 'ambiguous',
      candidates: matches.slice(0, 5).map(formatGoogleResult)
    });
  } catch (err) {
    console.error('public-builder/google-match error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
