// Vercel serverless function: SearchAPI.io Google Maps Reviews enrichment
// Fetches paginated reviews for a business using the google_maps_reviews engine.

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

  const { data_id, place_id, next_page_token, sort_by, hl } = req.query;

  if (!data_id && !place_id) {
    return res.status(400).json({ error: 'Missing required parameter: data_id or place_id' });
  }

  try {
    const params = new URLSearchParams({
      engine: 'google_maps_reviews',
      api_key: apiKey,
    });

    if (data_id) params.set('data_id', data_id);
    if (place_id) params.set('place_id', place_id);
    if (next_page_token) params.set('next_page_token', next_page_token);
    if (sort_by) params.set('sort_by', sort_by);
    if (hl) params.set('hl', hl);

    const response = await fetch(
      'https://www.searchapi.io/api/v1/search?' + params.toString()
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SearchAPI.io reviews error:', response.status, errorText);
      return res.status(502).json({ error: 'SearchAPI.io request failed' });
    }

    const data = await response.json();
    const rawReviews = data.reviews || [];

    const reviews = rawReviews.map(r => ({
      authorName: r.user ? r.user.name || '' : '',
      authorPhoto: r.user ? r.user.thumbnail || '' : '',
      rating: r.rating || 0,
      text: r.snippet || r.text || '',
      date: r.date || '',
      isoDate: r.iso_date || r.extracted_date || '',
      images: (r.images || []).map(img => img.image || img),
      isLocalGuide: r.user ? r.user.is_local_guide || false : false,
      likes: r.likes || 0,
    }));

    const result = {
      reviews: reviews,
      totalReviews: data.place_info ? data.place_info.reviews || 0 : 0,
      nextPageToken: data.serpapi_pagination ? data.serpapi_pagination.next_page_token || null : null,
      hasMore: !!(data.serpapi_pagination && data.serpapi_pagination.next_page_token),
    };

    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.status(200).json(result);
  } catch (err) {
    console.error('SearchAPI.io reviews error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
