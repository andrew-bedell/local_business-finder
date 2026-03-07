// Vercel serverless function: Knowledge Graph profile discovery via SearchAPI.io
// Discovers social profiles (Twitter, LinkedIn, TikTok, YouTube, Pinterest, TripAdvisor)
// from Google Knowledge Graph results.

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

  const searchApiKey = process.env.SEARCHAPI_KEY || '';

  if (!searchApiKey) {
    return res.status(500).json({ error: 'SEARCHAPI_KEY not configured' });
  }

  const q = req.query.q;
  if (!q) {
    return res.status(400).json({ error: 'Missing ?q= parameter' });
  }

  try {
    const params = new URLSearchParams({
      engine: 'google',
      q: q,
      api_key: searchApiKey,
    });

    const response = await fetch(
      'https://www.searchapi.io/api/v1/search?' + params.toString()
    );

    if (!response.ok) {
      console.error('SearchAPI Knowledge Graph error:', response.status, await response.text());
      return res.status(502).json({ profiles: [] });
    }

    const data = await response.json();
    const profiles = (data.knowledge_graph && data.knowledge_graph.profiles) || [];

    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).json({ profiles });
  } catch (err) {
    console.error('Knowledge Graph lookup error:', err);
    return res.status(502).json({ profiles: [] });
  }
}
