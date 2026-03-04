// Vercel serverless function: SearchAPI.io Instagram Profile enrichment
// Fetches Instagram profile data (bio, avatar, posts with photos, follower count)

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

  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Missing required parameter: username' });
  }

  try {
    const params = new URLSearchParams({
      engine: 'instagram_profile',
      username: username,
      api_key: apiKey,
    });

    const response = await fetch(
      'https://www.searchapi.io/api/v1/search?' + params.toString()
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SearchAPI.io Instagram error:', response.status, errorText);
      return res.status(502).json({ error: 'SearchAPI.io request failed' });
    }

    const data = await response.json();

    // Extract profile data
    const profile = data.profile || data;

    // Extract recent posts (limit to 12 most recent)
    const rawPosts = data.posts || [];
    const posts = rawPosts.slice(0, 12).map(post => ({
      id: post.id || '',
      permalink: post.permalink || '',
      type: post.type || 'image',
      caption: post.caption || '',
      likes: post.likes || 0,
      comments: post.comments || 0,
      thumbnail: post.thumbnail || '',
      timestamp: post.timestamp || '',
    }));

    const result = {
      username: profile.username || username,
      name: profile.name || '',
      bio: profile.bio || '',
      avatar: profile.avatar_hd || profile.avatar || '',
      isVerified: profile.is_verified || false,
      isBusinessAccount: profile.is_business_account || false,
      followerCount: profile.followers || 0,
      followingCount: profile.following || 0,
      postCount: profile.posts_count || 0,
      externalUrl: profile.external_url || '',
      posts: posts,
    };

    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.status(200).json(result);
  } catch (err) {
    console.error('SearchAPI.io Instagram error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
