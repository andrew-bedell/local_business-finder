// Vercel serverless function: SearchAPI.io Google Maps search proxy
// Searches for local businesses via SearchAPI.io and returns normalized results.
// Falls back gracefully (503) if SEARCHAPI_KEY is not configured.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SEARCHAPI_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'SearchAPI key not configured' });
  }

  const { q, lat, lng, radius, type, page, hl } = req.query;

  if (!q && !type) {
    return res.status(400).json({ error: 'Missing required parameter: q or type' });
  }

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing required parameters: lat, lng' });
  }

  try {
    // Build search query — combine type and query for better results
    const searchQuery = type && q ? `${type} ${q}` : (type || q);

    // SearchAPI.io uses @lat,lng,zoom format for location
    // Convert radius (meters) to approximate zoom level
    const radiusMeters = parseFloat(radius) || 5000;
    const zoom = radiusToZoom(radiusMeters);

    const params = new URLSearchParams({
      engine: 'google_maps',
      q: searchQuery,
      ll: `@${lat},${lng},${zoom}z`,
      api_key: apiKey,
      hl: hl || 'en',
    });

    if (page && parseInt(page) > 1) {
      params.set('page', page);
    }

    const response = await fetch(
      'https://www.searchapi.io/api/v1/search?' + params.toString()
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SearchAPI.io error:', response.status, errorText);
      return res.status(502).json({ error: 'SearchAPI.io request failed', status: response.status });
    }

    const data = await response.json();
    const localResults = data.local_results || [];

    // Normalize results to match the app's internal business object shape
    const normalized = localResults.map(normalizeResult);

    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.status(200).json({
      results: normalized,
      totalResults: localResults.length,
      hasMore: !!(data.serpapi_pagination && data.serpapi_pagination.next),
      page: parseInt(page) || 1,
    });
  } catch (err) {
    console.error('SearchAPI.io search error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Convert radius in meters to approximate Google Maps zoom level
function radiusToZoom(radiusMeters) {
  // Approximate mapping: zoom 15 ≈ 1km, zoom 13 ≈ 5km, zoom 11 ≈ 20km, zoom 9 ≈ 80km
  if (radiusMeters <= 1000) return 15;
  if (radiusMeters <= 2000) return 14;
  if (radiusMeters <= 5000) return 13;
  if (radiusMeters <= 10000) return 12;
  if (radiusMeters <= 20000) return 11;
  if (radiusMeters <= 40000) return 10;
  if (radiusMeters <= 80000) return 9;
  return 8;
}

// Normalize a SearchAPI.io Google Maps result to the app's internal format
function normalizeResult(place) {
  // Parse open_hours into weekday descriptions array
  const hours = [];
  if (place.open_hours) {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of dayOrder) {
      if (place.open_hours[day]) {
        const capitalized = day.charAt(0).toUpperCase() + day.slice(1);
        hours.push(`${capitalized}: ${place.open_hours[day]}`);
      }
    }
  }

  // Parse extensions into structured data
  const extensions = parseExtensions(place.extensions || []);

  return {
    name: place.title || '',
    address: place.address || '',
    phone: place.phone || '',
    website: place.website || '',
    rating: place.rating || 0,
    reviewCount: place.reviews || 0,
    status: place.open_state === 'Closed permanently' ? 'CLOSED_PERMANENTLY'
      : place.open_state === 'Temporarily closed' ? 'CLOSED_TEMPORARILY'
      : 'OPERATIONAL',
    mapsUrl: place.link || '',
    types: place.types || (place.type ? [place.type] : []),
    placeId: place.place_id || '',
    dataId: place.data_id || '',
    reviewData: [],  // Reviews come from separate endpoint
    photos: (place.images || []).map(url => ({ url })),
    hours: hours,
    latitude: place.gps_coordinates ? place.gps_coordinates.latitude : null,
    longitude: place.gps_coordinates ? place.gps_coordinates.longitude : null,
    // New fields from SearchAPI.io
    description: place.description || '',
    thumbnail: place.thumbnail || '',
    priceLevel: place.price || '',
    priceDescription: place.price_description || '',
    serviceOptions: extensions.serviceOptions,
    amenities: extensions.amenities,
    highlights: extensions.highlights,
    accessibility: extensions.accessibility,
    source: 'searchapi',
  };
}

// Parse SearchAPI.io extensions array into categorized arrays
function parseExtensions(extensions) {
  const result = {
    serviceOptions: [],
    amenities: [],
    highlights: [],
    accessibility: [],
  };

  for (const group of extensions) {
    const title = (group.title || '').toLowerCase();
    const items = (group.items || []).map(item => item.title || item.value || '');

    if (title.includes('service')) {
      result.serviceOptions.push(...items);
    } else if (title.includes('accessibility')) {
      result.accessibility.push(...items);
    } else if (title.includes('highlight')) {
      result.highlights.push(...items);
    } else if (title.includes('amenit') || title.includes('offering') || title.includes('planning') || title.includes('dining') || title.includes('atmosphere') || title.includes('crowd') || title.includes('payment')) {
      result.amenities.push(...items);
    } else {
      // Default to amenities for unknown categories
      result.amenities.push(...items);
    }
  }

  return result;
}
