// Vercel serverless function: SearchAPI.io Google Maps Place detail enrichment
// Fetches extended place details not available from Google Places JS API.

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

  const { place_id, data_id, hl } = req.query;

  if (!place_id && !data_id) {
    return res.status(400).json({ error: 'Missing required parameter: place_id or data_id' });
  }

  try {
    const params = new URLSearchParams({
      engine: 'google_maps_place',
      api_key: apiKey,
    });

    if (place_id) params.set('place_id', place_id);
    if (data_id) params.set('data_id', data_id);
    if (hl) params.set('hl', hl);

    const response = await fetch(
      'https://www.searchapi.io/api/v1/search?' + params.toString()
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SearchAPI.io place error:', response.status, errorText);
      return res.status(502).json({ error: 'SearchAPI.io request failed' });
    }

    const data = await response.json();
    const place = data.place_result || {};

    // Parse extensions into categorized arrays
    const extensions = parseExtensions(place.extensions || []);

    // Parse reviews histogram
    const reviewsHistogram = place.reviews_histogram || null;

    // Parse popular times
    const popularTimes = parsePopularTimes(place.popular_times || {});

    // Parse Q&A
    const questionsAndAnswers = place.questions_and_answers || null;

    // Extract reviews from the response (these were previously discarded)
    const reviews = normalizeReviews(data.review_results || place.reviews || []);

    // Extract web reviews (external sources like TripAdvisor aggregated by Google)
    const webReviews = (data.web_reviews || []).map(wr => ({
      source: (wr.source || '').toLowerCase(),
      rating: wr.rating || null,
      reviewCount: wr.reviews || 0,
      url: wr.link || '',
    }));

    const result = {
      description: place.description || '',
      serviceOptions: extensions.serviceOptions,
      amenities: extensions.amenities,
      highlights: extensions.highlights,
      accessibility: extensions.accessibility,
      reviewsHistogram: reviewsHistogram,
      popularTimes: popularTimes,
      questionsAndAnswers: questionsAndAnswers,
      reviews: reviews,
      webReviews: webReviews,
      // Additional fields not available from Google Places JS API
      priceLevel: place.price || '',
      priceDescription: place.price_description || '',
    };

    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.status(200).json(result);
  } catch (err) {
    console.error('SearchAPI.io place error:', err);
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
    const items = (group.items || []).map(item => item.title || item.value || '');

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
    // Find peak busyness for each day
    const peak = hours.reduce((max, h) => h.busyness_score > max.score
      ? { score: h.busyness_score, time: h.time, info: h.info || '' }
      : max, { score: 0, time: '', info: '' });
    result.days[day] = peak;
  }

  return result;
}

function normalizeReviews(reviews) {
  if (!Array.isArray(reviews)) return [];
  return reviews.map(r => ({
    authorName: r.user ? r.user.name || '' : '',
    authorPhoto: r.user ? r.user.thumbnail || '' : '',
    rating: r.rating || 0,
    text: r.original_snippet || r.snippet || r.text || '',
    date: r.date || '',
    isoDate: r.iso_date || r.extracted_date || '',
    isLocalGuide: r.user ? r.user.is_local_guide || false : false,
    source: 'google',
  }));
}
