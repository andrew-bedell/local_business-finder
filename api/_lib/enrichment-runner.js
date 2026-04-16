import { enrichBusiness } from './enrich-business.js';

const SYNTHETIC_PLACE_PREFIXES = ['marketing-', 'manual-', 'builder-', 'onboarding-'];
const RETRY_DELAYS_MINUTES = [10, 30, 60, 180, 360];
const MAX_ENRICHMENT_ATTEMPTS = 5;

export function isEnrichablePlaceId(placeId) {
  if (!placeId) return false;
  return !SYNTHETIC_PLACE_PREFIXES.some(prefix => placeId.startsWith(prefix));
}

export function buildInitialEnrichmentState(placeId) {
  if (isEnrichablePlaceId(placeId)) {
    return {
      enrichment_status: 'pending',
      enrichment_attempts: 0,
      enrichment_last_started_at: null,
      enrichment_last_finished_at: null,
      enrichment_next_retry_at: null,
      enrichment_last_error: null,
    };
  }

  return {
    enrichment_status: 'skipped',
    enrichment_attempts: 0,
    enrichment_last_started_at: null,
    enrichment_last_finished_at: new Date().toISOString(),
    enrichment_next_retry_at: null,
    enrichment_last_error: null,
  };
}

export async function resolveGoogleDataId({ placeId, businessName, businessAddress, searchApiKey }) {
  if (!searchApiKey || !placeId) return null;

  const query = [businessName, businessAddress].filter(Boolean).join(' ').trim();
  if (!query) return null;

  const params = new URLSearchParams({
    engine: 'google_maps',
    q: query,
    api_key: searchApiKey,
  });

  const searchRes = await fetch('https://www.searchapi.io/api/v1/search?' + params.toString());
  if (!searchRes.ok) {
    throw new Error(`data_id_lookup_http_${searchRes.status}`);
  }

  const searchData = await searchRes.json();
  const results = searchData.local_results || [];
  const match = results.find(r => r.place_id === placeId);
  if (match?.data_id) return match.data_id;
  if (results.length === 1 && results[0]?.data_id) return results[0].data_id;
  return null;
}

export async function runTrackedBusinessEnrichment({
  businessId,
  placeId,
  businessName,
  businessAddress,
  supabaseUrl,
  supabaseKey,
}) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured');
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  if (!isEnrichablePlaceId(placeId)) {
    await patchBusinessEnrichmentState({
      businessId,
      supabaseUrl,
      headers,
      patch: {
        enrichment_status: 'skipped',
        enrichment_last_finished_at: new Date().toISOString(),
        enrichment_next_retry_at: null,
        enrichment_last_error: null,
      },
    });

    return { success: true, status: 'skipped', dataId: null };
  }

  const business = await fetchBusinessEnrichmentState({ businessId, supabaseUrl, headers });
  const attempts = (business?.enrichment_attempts || 0) + 1;
  const startedAt = new Date().toISOString();

  await patchBusinessEnrichmentState({
    businessId,
    supabaseUrl,
    headers,
    patch: {
      enrichment_status: 'in_progress',
      enrichment_attempts: attempts,
      enrichment_last_started_at: startedAt,
      enrichment_next_retry_at: null,
      enrichment_last_error: null,
    },
  });

  const searchApiKey = process.env.SEARCHAPI_KEY;
  if (!searchApiKey) {
    return await finalizeEnrichmentFailure({
      businessId,
      attempts,
      errorMessage: 'SEARCHAPI_KEY not configured',
      supabaseUrl,
      headers,
    });
  }

  let dataId = null;
  let dataIdLookupError = null;
  try {
    dataId = await resolveGoogleDataId({ placeId, businessName, businessAddress, searchApiKey });
  } catch (err) {
    dataIdLookupError = err;
  }

  try {
    const summary = await enrichBusiness({
      businessId,
      placeId,
      dataId,
      businessName,
      businessAddress,
      supabaseUrl,
      supabaseKey,
    });

    const stats = await fetchBusinessEnrichmentStats({ businessId, supabaseUrl, headers });
    const missingGooglePhotos = !dataId && stats.googlePhotoCount === 0;
    const hardFailure = summary?.hasFailures || false;

    if (dataIdLookupError || hardFailure || missingGooglePhotos) {
      const reasons = [];
      if (dataIdLookupError) reasons.push(dataIdLookupError.message || 'data_id_lookup_failed');
      if (hardFailure) reasons.push('enrichment_step_failed');
      if (missingGooglePhotos) reasons.push('no_data_id_and_no_google_photos');

      return await finalizeEnrichmentFailure({
        businessId,
        attempts,
        errorMessage: reasons.join('; '),
        supabaseUrl,
        headers,
      });
    }

    await patchBusinessEnrichmentState({
      businessId,
      supabaseUrl,
      headers,
      patch: {
        enrichment_status: 'completed',
        enrichment_last_finished_at: new Date().toISOString(),
        enrichment_next_retry_at: null,
        enrichment_last_error: null,
      },
    });

    return {
      success: true,
      status: 'completed',
      dataId: dataId || null,
      attempts,
      summary,
      stats,
    };
  } catch (err) {
    return await finalizeEnrichmentFailure({
      businessId,
      attempts,
      errorMessage: err.message || 'enrichment_failed',
      supabaseUrl,
      headers,
    });
  }
}

async function fetchBusinessEnrichmentState({ businessId, supabaseUrl, headers }) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}&select=id,enrichment_attempts`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch business enrichment state: ${text.substring(0, 200)}`);
  }

  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Business not found');
  }

  return rows[0];
}

async function fetchBusinessEnrichmentStats({ businessId, supabaseUrl, headers }) {
  const [photosRes, reviewsRes, socialsRes] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/business_photos?business_id=eq.${businessId}&source=eq.google&select=id&limit=20`,
      { headers }
    ),
    fetch(
      `${supabaseUrl}/rest/v1/business_reviews?business_id=eq.${businessId}&source=eq.google&select=id&limit=20`,
      { headers }
    ),
    fetch(
      `${supabaseUrl}/rest/v1/business_social_profiles?business_id=eq.${businessId}&select=id&limit=20`,
      { headers }
    ),
  ]);

  const [photos, reviews, socials] = await Promise.all([
    photosRes.ok ? photosRes.json() : [],
    reviewsRes.ok ? reviewsRes.json() : [],
    socialsRes.ok ? socialsRes.json() : [],
  ]);

  return {
    googlePhotoCount: Array.isArray(photos) ? photos.length : 0,
    googleReviewCount: Array.isArray(reviews) ? reviews.length : 0,
    socialProfileCount: Array.isArray(socials) ? socials.length : 0,
  };
}

async function finalizeEnrichmentFailure({ businessId, attempts, errorMessage, supabaseUrl, headers }) {
  const exhausted = attempts >= MAX_ENRICHMENT_ATTEMPTS;
  const retryDelay = RETRY_DELAYS_MINUTES[Math.min(attempts - 1, RETRY_DELAYS_MINUTES.length - 1)];
  const nextRetryAt = exhausted ? null : new Date(Date.now() + retryDelay * 60 * 1000).toISOString();
  const status = exhausted ? 'failed' : 'retry';

  await patchBusinessEnrichmentState({
    businessId,
    supabaseUrl,
    headers,
    patch: {
      enrichment_status: status,
      enrichment_last_finished_at: new Date().toISOString(),
      enrichment_next_retry_at: nextRetryAt,
      enrichment_last_error: truncateError(errorMessage),
    },
  });

  return {
    success: false,
    status,
    attempts,
    error: errorMessage,
    nextRetryAt,
  };
}

async function patchBusinessEnrichmentState({ businessId, supabaseUrl, headers, patch }) {
  const res = await fetch(`${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update enrichment state: ${text.substring(0, 200)}`);
  }
}

function truncateError(message) {
  return String(message || '').slice(0, 500);
}
