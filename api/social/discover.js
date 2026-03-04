// Vercel serverless function: Social media profile discovery
// Proxies requests to Yelp Fusion API (and future platforms)
// to keep API keys server-side.

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

  const { name, address, phone, latitude, longitude } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Missing required parameter: name' });
  }

  const result = {};

  // --- Yelp Fusion API ---
  const yelpApiKey = process.env.YELP_API_KEY;
  if (yelpApiKey) {
    try {
      const yelpResult = await searchYelp(yelpApiKey, name, address, phone, latitude, longitude);
      if (yelpResult) {
        result.yelp = yelpResult;
      }
    } catch (err) {
      console.error('Yelp API error:', err.message);
    }
  }

  // --- Facebook & Instagram discovery via web search ---
  try {
    const [fbResult, igResult] = await Promise.all([
      searchSocialWeb('facebook', name, address),
      searchSocialWeb('instagram', name, address),
    ]);
    if (fbResult) result.facebook = fbResult;
    if (igResult) result.instagram = igResult;
  } catch (err) {
    console.error('Social web search error:', err.message);
  }

  res.setHeader('Cache-Control', 'private, max-age=3600');
  return res.status(200).json(result);
}

// Search Yelp Fusion API for a matching business
async function searchYelp(apiKey, name, address, phone, latitude, longitude) {
  // Strategy 1: Try phone match first (most precise)
  if (phone) {
    const cleanPhone = phone.replace(/[^+\d]/g, '');
    if (cleanPhone.length >= 10) {
      const phoneResult = await yelpPhoneSearch(apiKey, cleanPhone);
      if (phoneResult) return phoneResult;
    }
  }

  // Strategy 2: Name + location match
  const params = new URLSearchParams({
    term: name,
    limit: '3',
  });

  if (latitude && longitude) {
    params.set('latitude', latitude);
    params.set('longitude', longitude);
  } else if (address) {
    params.set('location', address);
  } else {
    return null;
  }

  const response = await fetch(
    'https://api.yelp.com/v3/businesses/search?' + params.toString(),
    {
      headers: { Authorization: 'Bearer ' + apiKey },
    }
  );

  if (!response.ok) {
    console.error('Yelp search error:', response.status, await response.text());
    return null;
  }

  const data = await response.json();
  if (!data.businesses || data.businesses.length === 0) return null;

  // Find best match by comparing name similarity
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const match = data.businesses.find((biz) => {
    const bizName = biz.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return bizName === normalizedName ||
      bizName.includes(normalizedName) ||
      normalizedName.includes(bizName);
  });

  if (!match) return null;

  return {
    url: match.url,
    alias: match.alias,
    rating: match.rating,
    review_count: match.review_count,
  };
}

// Search for a business's Facebook or Instagram page via DuckDuckGo HTML search
async function searchSocialWeb(platform, name, address) {
  const site = platform === 'facebook' ? 'facebook.com' : 'instagram.com';
  const city = address ? address.split(',').slice(-2, -1)[0]?.trim() || '' : '';
  const query = `${name} ${city} site:${site}`;

  try {
    const ddgUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
    const response = await fetch(ddgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BusinessFinder/1.0)',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extract URLs from DuckDuckGo result links
    const urlPattern = platform === 'facebook'
      ? /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/g
      : /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+/g;

    const matches = html.match(urlPattern);
    if (!matches || matches.length === 0) return null;

    // Filter out generic pages (login, help, etc.)
    const excluded = ['login', 'help', 'about', 'privacy', 'terms', 'policies', 'pages', 'groups', 'events', 'marketplace', 'watch', 'gaming', 'fundraisers', 'explore', 'accounts', 'directory', 'reel', 'stories', 'p/'];
    const validUrl = matches.find(url => {
      const path = new URL(url).pathname.replace(/^\//, '').replace(/\/$/, '').toLowerCase();
      return path.length > 0 && !excluded.some(ex => path === ex || path.startsWith(ex + '/'));
    });

    if (!validUrl) return null;

    // Extract handle from URL
    const handle = new URL(validUrl).pathname.replace(/^\//, '').replace(/\/$/, '');

    return {
      url: validUrl,
      handle: handle,
    };
  } catch (err) {
    console.warn(`${platform} web search failed:`, err.message);
    return null;
  }
}

// Yelp Phone Search — returns match if phone number is found
async function yelpPhoneSearch(apiKey, phone) {
  const normalizedPhone = phone.startsWith('+') ? phone : '+1' + phone;

  const response = await fetch(
    'https://api.yelp.com/v3/businesses/search/phone?phone=' + encodeURIComponent(normalizedPhone),
    {
      headers: { Authorization: 'Bearer ' + apiKey },
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  if (!data.businesses || data.businesses.length === 0) return null;

  const biz = data.businesses[0];
  return {
    url: biz.url,
    alias: biz.alias,
    rating: biz.rating,
    review_count: biz.review_count,
  };
}
