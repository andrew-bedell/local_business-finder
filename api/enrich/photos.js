// Vercel serverless function: SearchAPI.io Google Maps Photos enrichment
// Fetches categorized, paginated photos for a business using the google_maps_photos engine.

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

  const { data_id, category_id, next_page_token } = req.query;

  if (!data_id) {
    return res.status(400).json({ error: 'Missing required parameter: data_id' });
  }

  try {
    const params = new URLSearchParams({
      engine: 'google_maps_photos',
      data_id: data_id,
      api_key: apiKey,
    });

    if (category_id) params.set('category_id', category_id);
    if (next_page_token) params.set('next_page_token', next_page_token);

    const response = await fetch(
      'https://www.searchapi.io/api/v1/search?' + params.toString()
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SearchAPI.io photos error:', response.status, errorText);
      return res.status(502).json({ error: 'SearchAPI.io request failed' });
    }

    const data = await response.json();
    const rawPhotos = data.photos || [];

    const photos = rawPhotos.map(p => ({
      url: p.image || '',
      thumbnail: p.thumbnail || '',
    }));

    // Return available categories so the client can fetch specific photo types
    const categories = (data.categories || []).map(c => ({
      id: c.category_id || '',
      name: c.name || '',
      photoType: mapCategoryToPhotoType(c.name),
    }));

    const result = {
      photos: photos,
      categories: categories,
      nextPageToken: data.serpapi_pagination ? data.serpapi_pagination.next_page_token || null : null,
      hasMore: !!(data.serpapi_pagination && data.serpapi_pagination.next_page_token),
    };

    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.status(200).json(result);
  } catch (err) {
    console.error('SearchAPI.io photos error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Map SearchAPI photo category names to the business_photos.photo_type enum
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
