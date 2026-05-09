// Vercel serverless function: review enrichment.
// Uses SearchAPI for deeper review pagination, with Google Places fallback when only place_id is available.

import { getGooglePlaceDetails, normalizeGoogleReviews } from '../_lib/google-places.js';

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
  const { data_id: dataId, place_id: placeId, next_page_token: nextPageToken, sort_by: sortBy, hl } = req.query;

  if (!dataId && !placeId) {
    return res.status(400).json({ error: 'Missing required parameter: data_id or place_id' });
  }

  if (searchApiKey && (dataId || placeId)) {
    try {
      const params = new URLSearchParams({
        engine: 'google_maps_reviews',
        api_key: searchApiKey,
      });

      if (dataId) params.set('data_id', dataId);
      if (placeId) params.set('place_id', placeId);
      if (nextPageToken) params.set('next_page_token', nextPageToken);
      if (sortBy) params.set('sort_by', sortBy);
      if (hl) params.set('hl', hl);

      const response = await fetch('https://www.searchapi.io/api/v1/search?' + params.toString());

      if (response.ok) {
        const data = await response.json();
        const rawReviews = data.reviews || [];
        const reviews = rawReviews.map((review) => ({
          authorName: review.user ? review.user.name || '' : '',
          authorPhoto: review.user ? review.user.thumbnail || '' : '',
          rating: review.rating || 0,
          text: review.original_snippet || review.snippet || review.text || '',
          date: review.date || '',
          isoDate: review.iso_date || review.extracted_date || '',
          images: (review.images || []).map((image) => image.image || image),
          isLocalGuide: review.user ? review.user.is_local_guide || false : false,
          likes: review.likes || 0,
        }));

        res.setHeader('Cache-Control', 'private, max-age=86400');
        return res.status(200).json({
          reviews,
          totalReviews: data.place_info ? data.place_info.reviews || 0 : 0,
          nextPageToken: data.serpapi_pagination ? data.serpapi_pagination.next_page_token || null : null,
          hasMore: !!(data.serpapi_pagination && data.serpapi_pagination.next_page_token),
          provider: 'searchapi',
        });
      }

      const errorText = await response.text().catch(() => '');
      console.error('SearchAPI reviews error:', response.status, errorText);
      if (!googlePlacesApiKey || !placeId) {
        return res.status(502).json({ error: 'SearchAPI.io request failed' });
      }
    } catch (searchError) {
      console.warn('SearchAPI review enrichment failed, falling back to Google Places:', searchError.message);
      if (!googlePlacesApiKey || !placeId) {
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  if (!googlePlacesApiKey || !placeId) {
    return res.status(503).json({ error: 'No review provider configured' });
  }

  try {
    const place = await getGooglePlaceDetails({
      apiKey: googlePlacesApiKey,
      placeId,
      languageCode: hl || 'en',
      fieldMask: 'id,reviews,userRatingCount',
    });
    const reviews = normalizeGoogleReviews(place?.reviews || []);

    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.status(200).json({
      reviews,
      totalReviews: place?.userRatingCount || reviews.length,
      nextPageToken: null,
      hasMore: false,
      provider: 'google_places',
    });
  } catch (err) {
    console.error('Review enrichment error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
