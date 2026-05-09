// Vercel serverless function: Google Places business search proxy.
// Uses native Google Places first and falls back to SearchAPI when needed.

import {
  buildCircularLocationBias,
  humanizePlaceType,
  normalizeGooglePlace,
  searchGooglePlacesText,
} from '../_lib/google-places.js';

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

  const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || '';
  const searchApiKey = process.env.SEARCHAPI_KEY || '';
  if (!googlePlacesApiKey && !searchApiKey) {
    return res.status(503).json({ error: 'No search provider configured' });
  }

  const { q, lat, lng, radius, type, page, page_token: pageToken, hl } = req.query;

  if (!q && !type && !pageToken) {
    return res.status(400).json({ error: 'Missing required parameter: q or type' });
  }

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing required parameters: lat, lng' });
  }

  const searchQuery = buildSearchQuery({ q, type });
  const includedType = isLikelyGooglePlaceType(type) ? type : undefined;
  const languageCode = String(hl || 'en');

  if (googlePlacesApiKey) {
    try {
      const result = await searchGooglePlacesText({
        apiKey: googlePlacesApiKey,
        textQuery: searchQuery,
        languageCode,
        maxResultCount: 20,
        pageToken: pageToken || undefined,
        includedType,
        locationBias: buildCircularLocationBias({
          lat,
          lng,
          radiusMeters: radius,
        }),
      });

      const normalized = result.places.map((place) => normalizeGooglePlace(place));

      res.setHeader('Cache-Control', 'private, max-age=3600');
      return res.status(200).json({
        results: normalized,
        totalResults: normalized.length,
        hasMore: !!result.nextPageToken,
        nextPageToken: result.nextPageToken,
        page: parseInt(page, 10) || 1,
        source: 'google_places',
      });
    } catch (googleError) {
      console.warn('Google Places search failed, falling back to SearchAPI:', googleError.message);
      if (!searchApiKey) {
        return res.status(502).json({ error: googleError.message || 'Google Places request failed' });
      }
    }
  }

  try {
    const fallbackResult = await searchViaSearchApi({
      q,
      lat,
      lng,
      radius,
      type,
      page,
      hl,
      apiKey: searchApiKey,
    });

    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.status(200).json({
      ...fallbackResult,
      source: 'searchapi',
    });
  } catch (err) {
    console.error('Business search error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function searchViaSearchApi({ q, lat, lng, radius, type, page, hl, apiKey }) {
  const searchQuery = type && q ? `${type} ${q}` : (type || q);
  const radiusMeters = parseFloat(radius) || 5000;
  const zoom = radiusToZoom(radiusMeters);

  const params = new URLSearchParams({
    engine: 'google_maps',
    q: searchQuery,
    ll: `@${lat},${lng},${zoom}z`,
    api_key: apiKey,
    hl: hl || 'en',
  });

  if (page && parseInt(page, 10) > 1) {
    params.set('page', page);
  }

  const response = await fetch('https://www.searchapi.io/api/v1/search?' + params.toString());
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('SearchAPI search failed:', response.status, errorText);
    throw new Error('SearchAPI.io request failed');
  }

  const data = await response.json();
  const localResults = data.local_results || [];
  const normalized = localResults.map(normalizeSearchApiResult);

  return {
    results: normalized,
    totalResults: localResults.length,
    hasMore: !!(data.serpapi_pagination && data.serpapi_pagination.next),
    nextPageToken: null,
    page: parseInt(page, 10) || 1,
  };
}

function buildSearchQuery({ q, type }) {
  const rawType = humanizePlaceType(type || '');
  const rawQuery = String(q || '').trim();
  return [rawType, rawQuery].filter(Boolean).join(' ').trim();
}

function isLikelyGooglePlaceType(value) {
  const normalized = String(value || '').trim();
  return !!normalized && /^[a-z_]+$/.test(normalized);
}

function radiusToZoom(radiusMeters) {
  if (radiusMeters <= 1000) return 15;
  if (radiusMeters <= 2000) return 14;
  if (radiusMeters <= 5000) return 13;
  if (radiusMeters <= 10000) return 12;
  if (radiusMeters <= 20000) return 11;
  if (radiusMeters <= 40000) return 10;
  if (radiusMeters <= 80000) return 9;
  return 8;
}

function normalizeSearchApiResult(place) {
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
    reviewData: [],
    photos: normalizePlaceImages(place.images),
    hours,
    latitude: place.gps_coordinates ? place.gps_coordinates.latitude : null,
    longitude: place.gps_coordinates ? place.gps_coordinates.longitude : null,
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

function normalizePlaceImages(images) {
  if (!Array.isArray(images)) return [];

  return images.map((image) => {
    if (!image) return null;

    if (typeof image === 'string') {
      return { url: image, thumbnail: image, photoType: null };
    }

    const url = image.image || image.thumbnail || image.url || '';
    if (!url || typeof url !== 'string') return null;

    return {
      url,
      thumbnail: typeof image.thumbnail === 'string' ? image.thumbnail : url,
      photoType: mapImageTitleToPhotoType(image.title),
      title: image.title || '',
    };
  }).filter(Boolean);
}

function mapImageTitleToPhotoType(title) {
  const normalized = (title || '').toLowerCase();
  if (normalized.includes('owner')) return 'team';
  if (normalized.includes('interior') || normalized.includes('inside')) return 'interior';
  if (normalized.includes('exterior') || normalized.includes('outside')) return 'exterior';
  return null;
}

function parseExtensions(extensions) {
  const result = {
    serviceOptions: [],
    amenities: [],
    highlights: [],
    accessibility: [],
  };

  for (const group of extensions) {
    const title = (group.title || '').toLowerCase();
    const items = (group.items || []).map((item) => item.title || item.value || '');

    if (title.includes('service')) {
      result.serviceOptions.push(...items);
    } else if (title.includes('accessibility')) {
      result.accessibility.push(...items);
    } else if (title.includes('highlight')) {
      result.highlights.push(...items);
    } else if (title.includes('amenit') || title.includes('offering') || title.includes('planning') || title.includes('dining') || title.includes('atmosphere') || title.includes('crowd') || title.includes('payment')) {
      result.amenities.push(...items);
    } else {
      result.amenities.push(...items);
    }
  }

  return result;
}
