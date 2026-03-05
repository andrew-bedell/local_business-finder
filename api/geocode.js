// Vercel serverless function: Geocoding proxy using OpenStreetMap Nominatim
// Converts address text to lat/lng coordinates without requiring Google Maps JS API.

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

  const { address, country } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Missing required parameter: address' });
  }

  try {
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    });

    if (country) {
      params.set('countrycodes', country.toLowerCase());
    }

    const response = await fetch(
      'https://nominatim.openstreetmap.org/search?' + params.toString(),
      {
        headers: {
          'User-Agent': 'LocalBusinessFinder/1.0',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Nominatim error:', response.status);
      return res.status(502).json({ error: 'Geocoding service error' });
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      return res.status(200).json({ found: false });
    }

    const result = results[0];

    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).json({
      found: true,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formattedAddress: result.display_name || address,
    });
  } catch (err) {
    console.error('Geocoding error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
