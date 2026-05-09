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

function formatAppResultFromPlaces(place, fallbackName, fallbackCity) {
  var cityComponent = (place.addressComponents || []).find(function (component) {
    return component.types && (
      component.types.includes('locality') ||
      component.types.includes('administrative_area_level_2')
    );
  });
  var horario = '';
  if (place.regularOpeningHours && Array.isArray(place.regularOpeningHours.weekdayDescriptions)) {
    horario = place.regularOpeningHours.weekdayDescriptions.slice(0, 5).join('\n');
  }

  return {
    nombre: place.displayName && place.displayName.text || fallbackName,
    tipo: place.primaryTypeDisplayName && place.primaryTypeDisplayName.text || 'Negocio local',
    ciudad: cityComponent && cityComponent.longText || fallbackCity,
    direccion: place.formattedAddress || '',
    shortAddress: place.shortFormattedAddress || place.formattedAddress || '',
    telefono: place.internationalPhoneNumber || '',
    horario: horario,
    calificacion: place.rating ? String(place.rating) : '',
    resenas: place.userRatingCount || 0,
    sobre: place.editorialSummary && place.editorialSummary.text || '',
    place_id: place.id || null,
    photos: Array.isArray(place.photos) ? place.photos.slice(0, 10).map(function (photo) {
      return photo.name;
    }).filter(Boolean) : []
  };
}

function formatAppResultFromSearchApi(result, fallbackName, fallbackCity) {
  var normalized = formatGoogleResult(result);
  return {
    nombre: normalized.name || fallbackName,
    tipo: normalized.types && normalized.types[0] || 'Negocio local',
    ciudad: normalized.addressCity || fallbackCity,
    direccion: normalized.address || '',
    shortAddress: normalized.address || '',
    telefono: normalized.phone || '',
    horario: normalized.hours || '',
    calificacion: normalized.rating ? String(normalized.rating) : '',
    resenas: normalized.reviewCount || 0,
    sobre: '',
    place_id: normalized.placeId,
    photos: []
  };
}

async function searchGooglePlaces(apiKey, businessName, city) {
  var response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.shortFormattedAddress',
        'places.internationalPhoneNumber',
        'places.rating',
        'places.userRatingCount',
        'places.regularOpeningHours',
        'places.primaryTypeDisplayName',
        'places.editorialSummary',
        'places.addressComponents',
        'places.photos'
      ].join(',')
    },
    body: JSON.stringify({
      textQuery: businessName + ' ' + city,
      languageCode: 'es',
      maxResultCount: 5
    })
  });

  if (!response.ok) {
    var errorText = await response.text().catch(function () { return ''; });
    throw new Error('Google Places request failed (' + response.status + '): ' + errorText.substring(0, 300));
  }

  var data = await response.json();
  var places = Array.isArray(data.places) ? data.places : [];
  return places
    .filter(function (place) {
      return namesMatch(place.displayName && place.displayName.text, businessName);
    })
    .map(function (place) {
      return formatAppResultFromPlaces(place, businessName, city);
    });
}

async function searchSearchApi(apiKey, businessName, city) {
  var query = businessName + ', ' + city;
  var url = 'https://www.searchapi.io/api/v1/search?engine=google_maps&q=' + encodeURIComponent(query) + '&api_key=' + encodeURIComponent(apiKey);
  var response = await fetch(url);

  if (!response.ok) {
    var errorText = await response.text().catch(function () { return ''; });
    console.error('SearchAPI request failed:', response.status, errorText.substring(0, 300));
    throw new Error('Google search request failed');
  }

  var data = await response.json();
  return (data.local_results || []).filter(function (item) {
    return namesMatch(item.title, businessName);
  }).map(function (item) {
    return formatAppResultFromSearchApi(item, businessName, city);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || '';
  var searchApiKey = process.env.SEARCHAPI_KEY || '';
  if (!googlePlacesApiKey && !searchApiKey) {
    return res.status(503).json({ error: 'No search provider configured' });
  }

  var body = req.body || {};
  var businessName = String(body.businessName || '').trim();
  var city = String(body.city || '').trim();
  if (!businessName || !city) {
    return res.status(400).json({ error: 'businessName and city are required' });
  }

  try {
    var matches = [];

    if (googlePlacesApiKey) {
      try {
        matches = await searchGooglePlaces(googlePlacesApiKey, businessName, city);
      } catch (googleError) {
        console.warn('Google Places lookup failed, falling back to SearchAPI:', googleError.message);
      }
    }

    if (!matches.length && searchApiKey) {
      matches = await searchSearchApi(searchApiKey, businessName, city);
    }

    if (matches.length === 0) {
      return res.status(200).json({ outcome: 'not_found' });
    }

    if (matches.length === 1) {
      return res.status(200).json({
        outcome: 'matched',
        match: matches[0]
      });
    }

    return res.status(200).json({
      outcome: 'ambiguous',
      candidates: matches.slice(0, 5)
    });
  } catch (err) {
    console.error('public-builder/google-match error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
