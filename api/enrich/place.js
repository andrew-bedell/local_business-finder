// Vercel serverless function: place detail enrichment.
// Uses native Google Places first and falls back to SearchAPI when needed.

import {
  getGooglePlaceDetails,
  normalizeGooglePlace,
  normalizeGoogleReviews,
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
  const { place_id: placeId, data_id: dataId, hl } = req.query;

  if (!placeId && !dataId) {
    return res.status(400).json({ error: 'Missing required parameter: place_id or data_id' });
  }

  if (googlePlacesApiKey && placeId) {
    try {
      const place = await getGooglePlaceDetails({
        apiKey: googlePlacesApiKey,
        placeId,
        languageCode: hl || 'en',
      });
      const normalized = normalizeGooglePlace(place);
      const reviews = normalizeGoogleReviews(place?.reviews || []);

      res.setHeader('Cache-Control', 'private, max-age=86400');
      return res.status(200).json({
        description: normalized.description || '',
        hours: normalized.hours || [],
        serviceOptions: normalized.serviceOptions || [],
        amenities: normalized.amenities || [],
        highlights: normalized.highlights || [],
        accessibility: normalized.accessibility || [],
        reviewsHistogram: null,
        popularTimes: null,
        questionsAndAnswers: null,
        reviews,
        webReviews: [],
        priceLevel: normalized.priceLevel,
        priceDescription: normalized.priceDescription || '',
        provider: 'google_places',
      });
    } catch (googleError) {
      console.warn('Google Places place enrichment failed, falling back to SearchAPI:', googleError.message);
      if (!searchApiKey) {
        return res.status(502).json({ error: googleError.message || 'Google Places request failed' });
      }
    }
  }

  if (!searchApiKey) {
    return res.status(503).json({ error: 'No enrichment provider configured' });
  }

  try {
    const params = new URLSearchParams({
      engine: 'google_maps_place',
      api_key: searchApiKey,
    });

    if (placeId) params.set('place_id', placeId);
    if (dataId) params.set('data_id', dataId);
    if (hl) params.set('hl', hl);

    const response = await fetch('https://www.searchapi.io/api/v1/search?' + params.toString());

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('SearchAPI place error:', response.status, errorText);
      return res.status(502).json({ error: 'SearchAPI.io request failed' });
    }

    const data = await response.json();
    const place = data.place_result || {};
    const extensions = parseExtensions(place.extensions || []);
    const reviewsHistogram = place.reviews_histogram || null;
    const popularTimes = parsePopularTimes(place.popular_times || {});
    const questionsAndAnswers = place.questions_and_answers || null;
    const reviews = normalizeSearchApiReviews(data.review_results || place.reviews || []);
    const webReviews = (data.web_reviews || []).map((wr) => ({
      source: (wr.source || '').toLowerCase(),
      rating: wr.rating || null,
      reviewCount: wr.reviews || 0,
      url: wr.link || '',
    }));

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

    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.status(200).json({
      description: place.description || '',
      hours,
      serviceOptions: extensions.serviceOptions,
      amenities: extensions.amenities,
      highlights: extensions.highlights,
      accessibility: extensions.accessibility,
      reviewsHistogram,
      popularTimes,
      questionsAndAnswers,
      reviews,
      webReviews,
      priceLevel: place.price || '',
      priceDescription: place.price_description || '',
      provider: 'searchapi',
    });
  } catch (err) {
    console.error('Place enrichment error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
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
    } else {
      result.amenities.push(...items);
    }
  }

  return result;
}

function parsePopularTimes(popularTimes) {
  if (!popularTimes.chart) return null;

  const result = { typicalTimeSpent: null, days: {} };

  if (popularTimes.live && popularTimes.live.typical_time_spent) {
    result.typicalTimeSpent = popularTimes.live.typical_time_spent;
  }

  for (const [day, hours] of Object.entries(popularTimes.chart)) {
    const peak = hours.reduce((max, hour) => hour.busyness_score > max.score
      ? { score: hour.busyness_score, time: hour.time, info: hour.info || '' }
      : max, { score: 0, time: '', info: '' });
    result.days[day] = peak;
  }

  return result;
}

function normalizeSearchApiReviews(reviews) {
  if (!Array.isArray(reviews)) return [];
  return reviews.map((review) => ({
    authorName: review.user ? review.user.name || '' : '',
    authorPhoto: review.user ? review.user.thumbnail || '' : '',
    rating: review.rating || 0,
    text: review.original_snippet || review.snippet || review.text || '',
    date: review.date || '',
    isoDate: review.iso_date || review.extracted_date || '',
    isLocalGuide: review.user ? review.user.is_local_guide || false : false,
    source: 'google',
  }));
}
