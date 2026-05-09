// Vercel serverless function: place photo enrichment.
// Uses native Google Places first and falls back to SearchAPI when needed.

import { getGooglePlaceDetails, getGooglePlacePhotoSet } from '../_lib/google-places.js';

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
  const { place_id: placeId, data_id: dataId, category_id: categoryId, next_page_token: nextPageToken } = req.query;

  if (!placeId && !dataId) {
    return res.status(400).json({ error: 'Missing required parameter: place_id or data_id' });
  }

  if (googlePlacesApiKey && placeId) {
    try {
      const place = await getGooglePlaceDetails({
        apiKey: googlePlacesApiKey,
        placeId,
        fieldMask: 'id,photos',
      });
      const photos = await getGooglePlacePhotoSet({
        apiKey: googlePlacesApiKey,
        photos: place?.photos || [],
        limit: 10,
      });

      res.setHeader('Cache-Control', 'private, max-age=86400');
      return res.status(200).json({
        photos,
        categories: [],
        nextPageToken: null,
        hasMore: false,
        provider: 'google_places',
      });
    } catch (googleError) {
      console.warn('Google Places photo enrichment failed, falling back to SearchAPI:', googleError.message);
      if (!searchApiKey) {
        return res.status(502).json({ error: googleError.message || 'Google Places request failed' });
      }
    }
  }

  if (!searchApiKey || !dataId) {
    return res.status(503).json({ error: 'SearchAPI photo fallback requires data_id' });
  }

  try {
    const params = new URLSearchParams({
      engine: 'google_maps_photos',
      data_id: dataId,
      api_key: searchApiKey,
    });

    if (categoryId) params.set('category_id', categoryId);
    if (nextPageToken) params.set('next_page_token', nextPageToken);

    const response = await fetch('https://www.searchapi.io/api/v1/search?' + params.toString());

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('SearchAPI photos error:', response.status, errorText);
      return res.status(502).json({ error: 'SearchAPI.io request failed' });
    }

    const data = await response.json();
    const rawPhotos = data.photos || [];

    const photos = rawPhotos.map((photo) => ({
      url: photo.image || '',
      thumbnail: photo.thumbnail || '',
    }));

    const categories = (data.categories || []).map((category) => ({
      id: category.category_id || '',
      name: category.name || '',
      photoType: mapCategoryToPhotoType(category.name),
    }));

    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.status(200).json({
      photos,
      categories,
      nextPageToken: data.serpapi_pagination ? data.serpapi_pagination.next_page_token || null : null,
      hasMore: !!(data.serpapi_pagination && data.serpapi_pagination.next_page_token),
      provider: 'searchapi',
    });
  } catch (err) {
    console.error('Photo enrichment error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function mapCategoryToPhotoType(categoryName) {
  const name = (categoryName || '').toLowerCase();
  if (name.includes('menu')) return 'menu';
  if (name.includes('food') || name.includes('drink')) return 'food';
  if (name.includes('interior') || name.includes('inside') || name.includes('vibe')) return 'interior';
  if (name.includes('exterior') || name.includes('outside')) return 'exterior';
  if (name.includes('team') || name.includes('staff') || name.includes('owner')) return 'team';
  if (name.includes('logo')) return 'logo';
  if (name.includes('product')) return 'product';
  return null;
}
