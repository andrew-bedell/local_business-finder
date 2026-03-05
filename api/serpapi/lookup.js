export default async function handler(req, res) {
  const serpApiKey = process.env.SERPAPI_KEY || '';

  if (!serpApiKey) {
    return res.status(500).json({ error: 'SERPAPI_KEY not configured' });
  }

  const q = req.query.q;
  if (!q) {
    return res.status(400).json({ error: 'Missing ?q= parameter' });
  }

  try {
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&api_key=${serpApiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('SerpApi error:', response.status, await response.text());
      return res.status(502).json({ profiles: [] });
    }

    const data = await response.json();
    const profiles = (data.knowledge_graph && data.knowledge_graph.profiles) || [];

    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).json({ profiles });
  } catch (err) {
    console.error('SerpApi lookup error:', err);
    return res.status(502).json({ profiles: [] });
  }
}
