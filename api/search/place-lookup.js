// Vercel serverless function: SearchAPI.io Google Maps Place lookup
// Fetches a single business by place_id, data_id, or Google Maps URL.
// Returns a full normalized business object (same shape as maps.js) plus enrichment fields.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.SEARCHAPI_KEY;
  if (!apiKey) return res.status(503).json({ error: 'SearchAPI key not configured' });

  let { place_id, data_id, url, hl } = req.query;

  // If a URL is provided, resolve it to extract place_id or data_id
  if (url && !place_id && !data_id) {
    const parsed = await resolveUrl(url);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    if (parsed.place_id) place_id = parsed.place_id;
    if (parsed.data_id) data_id = parsed.data_id;

    // Strategy 0: Web Search for unresolved share.google URLs
    // share.google uses a JS redirect that server-side fetch() can't follow.
    // Google's own search engine resolves its own share codes and returns a
    // knowledge_graph object with kgmid, title, address, and GPS coordinates.
    if (!place_id && !data_id && parsed.is_share_url && parsed.original_url) {
      try {
        const webParams = new URLSearchParams({
          engine: 'google',
          q: parsed.original_url,
          api_key: apiKey,
        });

        const webRes = await fetch('https://www.searchapi.io/api/v1/search?' + webParams.toString());
        if (webRes.ok) {
          const webData = await webRes.json();
          const kg = webData.knowledge_graph;

          if (kg) {
            // Try kgmid first — exact match via Google Maps
            if (kg.kgmid && !place_id && !data_id) {
              const kgParams = new URLSearchParams({
                engine: 'google_maps',
                q: kg.kgmid,
                api_key: apiKey,
              });
              if (hl) kgParams.set('hl', hl);

              const kgRes = await fetch('https://www.searchapi.io/api/v1/search?' + kgParams.toString());
              if (kgRes.ok) {
                const kgData = await kgRes.json();
                const results = kgData.local_results || [];
                if (results.length > 0) {
                  data_id = results[0].data_id || null;
                  if (!data_id) place_id = results[0].place_id || null;
                }
              }
            }

            // Fallback: use name + address with coordinate bias from knowledge_graph
            if (!place_id && !data_id && kg.title) {
              const nameQuery = kg.address ? `${kg.title} ${kg.address}` : kg.title;
              const fallbackParams = new URLSearchParams({
                engine: 'google_maps',
                q: nameQuery,
                api_key: apiKey,
              });
              if (hl) fallbackParams.set('hl', hl);

              // Use GPS coordinates from knowledge_graph for location bias
              if (kg.local_results_map && kg.local_results_map.gps_coordinates) {
                const coords = kg.local_results_map.gps_coordinates;
                fallbackParams.set('ll', `@${coords.latitude},${coords.longitude},14z`);
              } else if (kg.latitude && kg.longitude) {
                fallbackParams.set('ll', `@${kg.latitude},${kg.longitude},14z`);
              }

              const fallbackRes = await fetch('https://www.searchapi.io/api/v1/search?' + fallbackParams.toString());
              if (fallbackRes.ok) {
                const fallbackData = await fallbackRes.json();
                const results = fallbackData.local_results || [];
                if (results.length > 0) {
                  data_id = results[0].data_id || null;
                  if (!data_id) place_id = results[0].place_id || null;
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Strategy 0 (web search) failed:', err.message);
      }
    }

    // share.google URLs resolve to a kgmid and/or search query
    if (!place_id && !data_id && (parsed.kgmid || parsed.search_query)) {
      // Strategy 1: Use kgmid as the search query — Google Maps understands /g/ identifiers
      // This gives an exact match for the specific business location.
      if (parsed.kgmid) {
        const kgParams = new URLSearchParams({
          engine: 'google_maps',
          q: parsed.kgmid,
          api_key: apiKey,
        });
        if (hl) kgParams.set('hl', hl);

        const kgRes = await fetch('https://www.searchapi.io/api/v1/search?' + kgParams.toString());
        if (kgRes.ok) {
          const kgData = await kgRes.json();
          const results = kgData.local_results || [];
          if (results.length > 0) {
            data_id = results[0].data_id || null;
            if (!data_id) place_id = results[0].place_id || null;
          }
        }
      }

      // Strategy 2: Fallback — search by business name
      if (!place_id && !data_id && parsed.search_query) {
        const searchParams = new URLSearchParams({
          engine: 'google_maps',
          q: parsed.search_query,
          api_key: apiKey,
        });
        if (hl) searchParams.set('hl', hl);

        const searchRes = await fetch('https://www.searchapi.io/api/v1/search?' + searchParams.toString());
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const firstResult = (searchData.local_results || [])[0];
          if (firstResult) {
            data_id = firstResult.data_id || null;
            if (!data_id) place_id = firstResult.place_id || null;
          }
        }
      }
    }
  }

  if (!place_id && !data_id) {
    return res.status(400).json({ error: 'Missing required parameter: place_id, data_id, or url' });
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
      console.error('SearchAPI.io place-lookup error:', response.status, errorText);
      return res.status(502).json({ error: 'SearchAPI.io request failed' });
    }

    const data = await response.json();
    const place = data.place_result || {};

    if (!place.title) {
      return res.status(404).json({ error: 'Place not found' });
    }

    // Normalize to the same shape as maps.js normalizeResult()
    const normalized = normalizePlaceResult(place);

    // Add enrichment fields
    const reviews = normalizeReviews(data.review_results || place.reviews || []);
    const webReviews = (data.web_reviews || []).map(wr => ({
      source: (wr.source || '').toLowerCase(),
      rating: wr.rating || null,
      reviewCount: wr.reviews || 0,
      url: wr.link || '',
    }));

    normalized.reviewData = reviews;
    normalized.webReviews = webReviews;
    normalized.reviewsHistogram = place.reviews_histogram || null;
    normalized.popularTimes = parsePopularTimes(place.popular_times || {});

    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.status(200).json(normalized);
  } catch (err) {
    console.error('SearchAPI.io place-lookup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Resolve a Google Maps URL to extract place_id or data_id
async function resolveUrl(url) {
  try {
    const originalUrl = url;
    const isShareGoogle = originalUrl.includes('share.google');

    // Handle shortened URLs by following redirects
    if (url.includes('maps.app.goo.gl') || url.includes('goo.gl') || isShareGoogle) {
      const resolved = await fetch(url, { redirect: 'follow' });
      url = resolved.url;
    }

    // Extract data_id from full Maps URL (hex format after !1s)
    const dataIdMatch = url.match(/!1s(0x[a-fA-F0-9]+:0x[a-fA-F0-9]+)/);
    if (dataIdMatch) return { data_id: dataIdMatch[1] };

    // Extract ChIJ-format place_id from URL
    const chijMatch = url.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
    if (chijMatch) return { place_id: chijMatch[1] };

    // Extract from ftid parameter
    const ftidMatch = url.match(/ftid=(0x[a-fA-F0-9]+:0x[a-fA-F0-9]+)/);
    if (ftidMatch) return { data_id: ftidMatch[1] };

    // Extract CID from ?cid= parameter
    const cidMatch = url.match(/[?&]cid=(\d+)/);
    if (cidMatch) {
      // CID is the decimal representation of the hex place identifier
      return { data_id: '0x0:0x' + BigInt(cidMatch[1]).toString(16) };
    }

    // Extract kgmid (Knowledge Graph ID) — unique per business location (share.google URLs)
    const kgmidMatch = url.match(/[?&]kgmid=([^&]+)/);
    if (kgmidMatch) {
      const kgmid = decodeURIComponent(kgmidMatch[1]);
      // Also grab the query for fallback
      try {
        const searchUrl = new URL(url);
        const searchQuery = searchUrl.searchParams.get('q');
        return { kgmid, search_query: searchQuery || '' };
      } catch (_) {
        return { kgmid };
      }
    }

    // Detect unresolved share.google URLs — the JS redirect wasn't followed,
    // so the resolved URL is still on /share.google with the raw share code as ?q=
    // Set search_query to null to prevent Strategy 2 from searching a nonsense share code
    try {
      const searchUrl = new URL(url);
      const isUnresolvedShare = isShareGoogle && searchUrl.pathname === '/share.google';

      if (isUnresolvedShare) {
        return {
          search_query: null,
          is_share_url: true,
          original_url: originalUrl,
        };
      }

      // Fallback: extract search query from Google Search redirect
      const searchQuery = searchUrl.searchParams.get('q');
      if (searchQuery) {
        return { search_query: searchQuery };
      }
    } catch (_) { /* not a valid URL, fall through */ }

    return { error: 'Could not extract place identifier from URL' };
  } catch (err) {
    return { error: 'Failed to resolve URL: ' + err.message };
  }
}

// Normalize SearchAPI.io place_result to the app's internal format (same shape as maps.js)
function normalizePlaceResult(place) {
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

  const extensions = parseExtensions(place.extensions || []);

  // reviewCount: place.reviews may be a number (count) or array (review data)
  const reviewCount = typeof place.reviews === 'number' ? place.reviews
    : Array.isArray(place.reviews) ? place.reviews.length : 0;

  return {
    name: place.title || '',
    address: place.address || '',
    phone: place.phone || '',
    website: place.website || '',
    rating: place.rating || 0,
    reviewCount: reviewCount,
    status: place.open_state === 'Closed permanently' ? 'CLOSED_PERMANENTLY'
      : place.open_state === 'Temporarily closed' ? 'CLOSED_TEMPORARILY'
      : 'OPERATIONAL',
    mapsUrl: place.link || '',
    types: place.types || (place.type ? [place.type] : []),
    placeId: place.place_id || '',
    dataId: place.data_id || '',
    reviewData: [],
    photos: (place.images || []).map(url => ({ url })),
    hours: hours,
    latitude: place.gps_coordinates ? place.gps_coordinates.latitude : null,
    longitude: place.gps_coordinates ? place.gps_coordinates.longitude : null,
    description: place.description || '',
    thumbnail: place.thumbnail || '',
    priceLevel: place.price || '',
    priceDescription: place.price_description || '',
    serviceOptions: extensions.serviceOptions,
    amenities: extensions.amenities,
    highlights: extensions.highlights,
    accessibility: extensions.accessibility,
    source: 'searchapi',
  };
}

// Parse SearchAPI.io extensions array into categorized arrays
function parseExtensions(extensions) {
  const result = { serviceOptions: [], amenities: [], highlights: [], accessibility: [] };

  for (const group of extensions) {
    const title = (group.title || '').toLowerCase();
    const items = (group.items || []).map(item => item.title || item.value || '');

    if (title.includes('service')) {
      result.serviceOptions.push(...items);
    } else if (title.includes('accessibility')) {
      result.accessibility.push(...items);
    } else if (title.includes('highlight')) {
      result.highlights.push(...items);
    } else if (title.includes('amenit') || title.includes('offering') || title.includes('planning') || title.includes('dining') || title.includes('atmosphere') || title.includes('crowd') || title.includes('payment')) {
      result.amenities.push(...items);
    } else {
      result.amenities.push(...items);
    }
  }

  return result;
}

// Normalize review objects from SearchAPI.io response
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

// Parse popular times data
function parsePopularTimes(popularTimes) {
  if (!popularTimes.chart) return null;

  const result = { typicalTimeSpent: null, days: {} };

  if (popularTimes.live && popularTimes.live.typical_time_spent) {
    result.typicalTimeSpent = popularTimes.live.typical_time_spent;
  }

  for (const [day, hours] of Object.entries(popularTimes.chart)) {
    const peak = hours.reduce((max, h) => h.busyness_score > max.score
      ? { score: h.busyness_score, time: h.time, info: h.info || '' }
      : max, { score: 0, time: '', info: '' });
    result.days[day] = peak;
  }

  return result;
}
