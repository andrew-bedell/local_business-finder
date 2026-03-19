// Server-side enrichment: fetch place details, reviews, photos, and social links
// from SearchAPI.io and save to Supabase. Called non-blocking after signup.

/**
 * Simple keyword-based sentiment analysis (mirrors employee/app.js logic).
 */
const positiveWords = [
  'amazing', 'awesome', 'best', 'beautiful', 'clean', 'delicious', 'excellent',
  'exceptional', 'fantastic', 'favorite', 'friendly', 'generous', 'genuine',
  'good', 'gorgeous', 'great', 'happy', 'helpful', 'impressed', 'incredible',
  'kind', 'love', 'loved', 'lovely', 'nice', 'outstanding', 'perfect',
  'phenomenal', 'pleasant', 'polite', 'professional', 'quality', 'recommend',
  'remarkable', 'satisfied', 'stellar', 'superb', 'terrific', 'top-notch',
  'welcoming', 'wonderful', 'worth'
];
const negativeWords = [
  'awful', 'bad', 'cold', 'complaint', 'dirty', 'disappoint', 'disgusting',
  'dreadful', 'horrible', 'mediocre', 'never', 'overpriced', 'poor', 'rude',
  'slow', 'terrible', 'unfriendly', 'unprofessional', 'waste', 'worst'
];

function analyzeSentiment(review) {
  if (!review || !review.text) return { score: 0, label: 'neutral' };
  const text = review.text.toLowerCase();
  const words = text.split(/\s+/);
  let pos = 0, neg = 0;
  words.forEach(w => {
    const clean = w.replace(/[^a-z-]/g, '');
    if (positiveWords.includes(clean)) pos++;
    if (negativeWords.includes(clean)) neg++;
  });
  const keywordScore = (pos - neg) / Math.max(words.length, 1);
  const ratingScore = ((review.rating || 3) - 3) / 2;
  const score = (keywordScore * 0.4) + (ratingScore * 0.6);
  const lengthBonus = Math.min(text.length / 500, 0.2);
  const finalScore = score + lengthBonus;
  let label = 'neutral';
  if (finalScore > 0.15) label = 'positive';
  if (finalScore > 0.4) label = 'very_positive';
  if (finalScore < -0.1) label = 'negative';
  return { score: Math.round(finalScore * 10000) / 10000, label };
}

/**
 * Simple hash for review deduplication (mirrors employee/app.js).
 */
function reviewHash(source, authorName, text) {
  const raw = `${source}|${authorName || ''}|${(text || '').slice(0, 200)}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Enrich a business with place details, reviews, photos, and social profiles.
 * All steps are independent and fail silently — partial enrichment is fine.
 *
 * @param {Object} opts
 * @param {number} opts.businessId - DB business ID
 * @param {string} opts.placeId - Google place_id
 * @param {string} [opts.dataId] - SearchAPI data_id (needed for photos)
 * @param {string} opts.supabaseUrl
 * @param {string} opts.supabaseKey
 */
export async function enrichBusiness({ businessId, placeId, dataId, supabaseUrl, supabaseKey }) {
  const searchApiKey = process.env.SEARCHAPI_KEY;
  if (!searchApiKey || !placeId) return;

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  // Run all enrichment steps in parallel
  const results = await Promise.allSettled([
    enrichPlaceDetail({ businessId, placeId, searchApiKey, supabaseUrl, headers }),
    enrichReviews({ businessId, placeId, dataId, searchApiKey, supabaseUrl, headers }),
    dataId ? enrichPhotos({ businessId, dataId, searchApiKey, supabaseUrl, headers }) : Promise.resolve(),
  ]);

  for (const r of results) {
    if (r.status === 'rejected') {
      console.warn('Enrichment step failed (non-blocking):', r.reason?.message || r.reason);
    }
  }
}

/**
 * Step 1: Place detail — description, amenities, highlights, service options, web reviews (social links)
 */
async function enrichPlaceDetail({ businessId, placeId, searchApiKey, supabaseUrl, headers }) {
  const params = new URLSearchParams({
    engine: 'google_maps_place',
    place_id: placeId,
    api_key: searchApiKey,
  });

  const res = await fetch('https://www.searchapi.io/api/v1/search?' + params.toString());
  if (!res.ok) {
    console.warn('SearchAPI place detail failed:', res.status);
    return;
  }

  const data = await res.json();
  const place = data.place_result || {};

  // Parse extensions
  const extensions = place.extensions || [];
  const parsed = { serviceOptions: [], amenities: [], highlights: [] };
  for (const group of extensions) {
    const title = (group.title || '').toLowerCase();
    const items = (group.items || []).map(item => item.title || item.value || '');
    if (title.includes('service')) parsed.serviceOptions.push(...items);
    else if (title.includes('highlight')) parsed.highlights.push(...items);
    else parsed.amenities.push(...items);
  }

  // Update business record with enriched fields
  const updates = {};
  if (place.description) updates.description = place.description;
  if (parsed.serviceOptions.length) updates.service_options = parsed.serviceOptions;
  if (parsed.amenities.length) updates.amenities = parsed.amenities;
  if (parsed.highlights.length) updates.highlights = parsed.highlights;

  if (Object.keys(updates).length > 0) {
    await fetch(`${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify(updates),
    });
  }

  // Extract reviews from place detail response and save
  const reviews = data.review_results || place.reviews || [];
  if (Array.isArray(reviews) && reviews.length > 0) {
    await saveReviews({ businessId, reviews, supabaseUrl, headers });
  }

  // Extract social/external links from web_reviews
  const webReviews = data.web_reviews || [];
  if (webReviews.length > 0) {
    await saveSocialFromWebReviews({ businessId, webReviews, supabaseUrl, headers });
  }
}

/**
 * Step 2: Reviews — full paginated reviews
 */
async function enrichReviews({ businessId, placeId, dataId, searchApiKey, supabaseUrl, headers }) {
  const params = new URLSearchParams({
    engine: 'google_maps_reviews',
    api_key: searchApiKey,
  });
  // Prefer data_id (more reliable for reviews), fall back to place_id
  if (dataId) params.set('data_id', dataId);
  else params.set('place_id', placeId);

  const res = await fetch('https://www.searchapi.io/api/v1/search?' + params.toString());
  if (!res.ok) {
    console.warn('SearchAPI reviews failed:', res.status);
    return;
  }

  const data = await res.json();
  const reviews = data.reviews || [];
  if (reviews.length > 0) {
    await saveReviews({ businessId, reviews, supabaseUrl, headers });
  }
}

/**
 * Step 3: Photos — fetch default photo set (skip if already enriched)
 */
async function enrichPhotos({ businessId, dataId, searchApiKey, supabaseUrl, headers }) {
  // Delete existing google-source photos before inserting fresh ones (supports refresh)
  await fetch(
    `${supabaseUrl}/rest/v1/business_photos?business_id=eq.${businessId}&source=eq.google`,
    { method: 'DELETE', headers: { ...headers, 'Prefer': 'return=minimal' } }
  );

  const params = new URLSearchParams({
    engine: 'google_maps_photos',
    data_id: dataId,
    api_key: searchApiKey,
  });

  const res = await fetch('https://www.searchapi.io/api/v1/search?' + params.toString());
  if (!res.ok) {
    console.warn('SearchAPI photos failed:', res.status);
    return;
  }

  const data = await res.json();
  const photos = data.photos || [];
  if (photos.length === 0) return;

  // Build category lookup for photo_type classification
  const categories = (data.categories || []);
  const categoryMap = {};
  for (const c of categories) {
    if (c.category_id) categoryMap[c.category_id] = mapCategoryToPhotoType(c.name);
  }

  const photoRows = photos.slice(0, 20).map((p, i) => ({
    business_id: businessId,
    source: 'google',
    photo_type: null,  // Default photos don't have category, will be null
    url: p.image || p.thumbnail || '',
    is_primary: i === 0,
  })).filter(r => r.url);

  if (photoRows.length === 0) return;

  await fetch(`${supabaseUrl}/rest/v1/business_photos`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(photoRows),
  });
}

/**
 * Save reviews to business_reviews table (upsert by review_hash).
 */
async function saveReviews({ businessId, reviews, supabaseUrl, headers }) {
  const rows = reviews.map(r => {
    const text = r.original_snippet || r.snippet || r.text || '';
    const authorName = r.user ? r.user.name || '' : '';
    const rating = r.rating || 0;
    const sentiment = analyzeSentiment({ text, rating });
    const hash = reviewHash('google', authorName, text);

    return {
      business_id: businessId,
      source: 'google',
      author_name: authorName || null,
      author_photo_url: r.user ? r.user.thumbnail || null : null,
      rating: Math.max(1, Math.min(5, rating)) || null,
      text: text || null,
      published_at: r.date || null,
      sentiment_score: sentiment.score,
      sentiment_label: sentiment.label,
      review_hash: hash,
    };
  }).filter(r => r.text);

  if (rows.length === 0) return;

  // Upsert: on conflict (business_id, review_hash), update text and sentiment
  await fetch(`${supabaseUrl}/rest/v1/business_reviews`, {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'return=minimal,resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });
}

/**
 * Extract social profile links from web_reviews and save to business_social_profiles.
 */
async function saveSocialFromWebReviews({ businessId, webReviews, supabaseUrl, headers }) {
  const platformMap = {
    'yelp': 'yelp',
    'tripadvisor': 'tripadvisor',
    'facebook': 'facebook',
    'opentable': 'opentable',
    'resy': 'resy',
    'doordash': 'doordash',
    'ubereats': 'ubereats',
    'grubhub': 'grubhub',
  };

  const profiles = [];
  for (const wr of webReviews) {
    const source = (wr.source || '').toLowerCase();
    const url = wr.link || '';
    if (!url) continue;

    // Find matching platform
    let platform = null;
    for (const [key, value] of Object.entries(platformMap)) {
      if (source.includes(key) || url.includes(key)) {
        platform = value;
        break;
      }
    }
    if (!platform) continue;

    profiles.push({
      business_id: businessId,
      platform,
      url,
    });
  }

  if (profiles.length === 0) return;

  // Upsert: on conflict (business_id, platform), update url
  await fetch(`${supabaseUrl}/rest/v1/business_social_profiles`, {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'return=minimal,resolution=merge-duplicates',
    },
    body: JSON.stringify(profiles),
  });
}

/**
 * Map SearchAPI photo category names to business_photos.photo_type enum.
 */
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
