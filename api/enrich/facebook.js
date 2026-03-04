// Vercel serverless function: SearchAPI.io Facebook Business Page enrichment
// Fetches Facebook page data (profile photo, cover photo, rating, followers, etc.)

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

  const { username, page_id } = req.query;

  if (!username && !page_id) {
    return res.status(400).json({ error: 'Missing required parameter: username or page_id' });
  }

  try {
    const params = new URLSearchParams({
      engine: 'facebook_business_page',
      api_key: apiKey,
    });

    if (username) params.set('username', username);
    if (page_id) params.set('page_id', page_id);

    const response = await fetch(
      'https://www.searchapi.io/api/v1/search?' + params.toString()
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SearchAPI.io Facebook error:', response.status, errorText);
      return res.status(502).json({ error: 'SearchAPI.io request failed' });
    }

    const data = await response.json();

    // Extract relevant fields from the response
    const result = {
      name: data.name || '',
      profilePhoto: data.profile_photo_original || data.profile_photo_link || '',
      coverPhoto: data.cover_photo_original || data.cover_photo_link || '',
      category: data.category_formatted || data.category || [],
      address: data.address || '',
      phone: data.phone || '',
      website: data.website || '',
      rating: data.rating || null,
      ratingsText: data.ratings || '',
      reviewsCount: data.reviews_count || 0,
      followers: data.followers ? (data.followers.count || 0) : 0,
      followersText: data.followers ? (data.followers.text || '') : '',
      priceRange: data.price_range || '',
      coordinates: data.gps_coordinates || null,
      link: data.link || '',
    };

    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.status(200).json(result);
  } catch (err) {
    console.error('SearchAPI.io Facebook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
