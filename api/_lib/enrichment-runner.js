import { enrichBusiness } from './enrich-business.js';
import {
  createEnrichmentRun,
  finalizeEnrichmentRun,
  getEnrichmentPauseState,
  isConfigurationBlockerError,
  isQuotaOrBillingError,
  pauseEnrichmentPipeline,
  truncateEnrichmentText,
} from './enrichment-monitor.js';

const SYNTHETIC_PLACE_PREFIXES = ['marketing-', 'manual-', 'builder-', 'onboarding-'];
const RETRY_DELAYS_MINUTES = [10, 30, 60, 180, 360];
const MAX_ENRICHMENT_ATTEMPTS = 5;
let cachedEnrichmentTrackingSchemaSupport = null;
const ENRICHMENT_TRACKING_FIELDS = [
  'enrichment_status',
  'enrichment_attempts',
  'enrichment_last_started_at',
  'enrichment_last_finished_at',
  'enrichment_next_retry_at',
  'enrichment_last_error',
];

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

export function isMissingEnrichmentTrackingSchemaError(message) {
  const normalized = String(message || '').toLowerCase();
  return (
    normalized.includes('42703')
    && normalized.includes('enrichment_')
  ) || normalized.includes('column businesses.enrichment_');
}

export function stripEnrichmentTrackingFields(payload) {
  const copy = { ...(payload || {}) };
  for (const field of ENRICHMENT_TRACKING_FIELDS) {
    delete copy[field];
  }
  return copy;
}

export async function insertBusinessWithSchemaFallback({ supabaseUrl, headers, payload }) {
  const createBusiness = (body) => fetch(`${supabaseUrl}/rest/v1/businesses`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(body),
  });

  const initialRes = await createBusiness(payload);
  if (initialRes.ok) return initialRes;

  const initialErrText = await initialRes.text().catch(() => '');
  if (!isMissingEnrichmentTrackingSchemaError(initialErrText)) {
    throw new Error(initialErrText || `Failed to create business (HTTP ${initialRes.status})`);
  }

  console.warn('Businesses insert missing enrichment schema; retrying without enrichment tracking fields');

  const fallbackRes = await createBusiness(stripEnrichmentTrackingFields(payload));
  if (fallbackRes.ok) return fallbackRes;

  const fallbackErrText = await fallbackRes.text().catch(() => '');
  throw new Error(fallbackErrText || `Failed to create business after legacy fallback (HTTP ${fallbackRes.status})`);
}

export async function supportsEnrichmentTrackingSchema({ supabaseUrl, headers }) {
  if (cachedEnrichmentTrackingSchemaSupport !== null) {
    return cachedEnrichmentTrackingSchemaSupport;
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/businesses?select=id,enrichment_attempts&limit=1`,
    { headers }
  );

  if (res.ok) {
    cachedEnrichmentTrackingSchemaSupport = true;
    return true;
  }

  const text = await res.text().catch(() => '');
  if (isMissingEnrichmentTrackingSchemaError(text)) {
    cachedEnrichmentTrackingSchemaSupport = false;
    return false;
  }

  throw new Error(`Failed to detect enrichment schema support: ${text.substring(0, 200)}`);
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
    const errorText = await searchRes.text().catch(() => '');
    throw new Error(buildHttpFailureReason('data_id_lookup', searchRes.status, errorText));
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
  triggerSource = 'manual',
}) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured');
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };
  const trackingSupported = await supportsEnrichmentTrackingSchema({ supabaseUrl, headers });

  const pauseState = await getEnrichmentPauseState({ supabaseUrl, headers });
  if (pauseState.paused) {
    const errorMessage = pauseState.reason || 'enrichment_paused';
    const pausedRunId = await createEnrichmentRun({
      supabaseUrl,
      headers,
      businessId,
      placeId,
      triggerSource,
      attempt: 0,
    });

    await finalizeEnrichmentRun({
      supabaseUrl,
      headers,
      runId: pausedRunId,
      status: 'blocked',
      errorMessage,
      evidence: { paused: true },
    });

    return {
      success: false,
      status: 'paused',
      error: errorMessage,
      trackingSupported,
      globalPause: true,
    };
  }

  if (!isEnrichablePlaceId(placeId)) {
    const skippedRunId = await createEnrichmentRun({
      supabaseUrl,
      headers,
      businessId,
      placeId,
      triggerSource,
      attempt: 0,
    });

    if (trackingSupported) {
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
    }

    await finalizeEnrichmentRun({
      supabaseUrl,
      headers,
      runId: skippedRunId,
      status: 'skipped',
      evidence: { skipped: true },
    });

    return { success: true, status: 'skipped', dataId: null, trackingSupported };
  }

  const attempts = trackingSupported
    ? ((await fetchBusinessEnrichmentState({ businessId, supabaseUrl, headers }))?.enrichment_attempts || 0) + 1
    : 1;

  if (trackingSupported) {
    await patchBusinessEnrichmentState({
      businessId,
      supabaseUrl,
      headers,
      patch: {
        enrichment_status: 'in_progress',
        enrichment_attempts: attempts,
        enrichment_last_started_at: new Date().toISOString(),
        enrichment_next_retry_at: null,
        enrichment_last_error: null,
      },
    });
  }

  const runId = await createEnrichmentRun({
    supabaseUrl,
    headers,
    businessId,
    placeId,
    triggerSource,
    attempt: attempts,
  });

  const searchApiKey = process.env.SEARCHAPI_KEY;
  if (!searchApiKey) {
    const result = await handleBlockingEnrichmentFailure({
      businessId,
      placeId,
      attempts,
      errorMessage: 'SEARCHAPI_KEY not configured',
      supabaseUrl,
      headers,
      trackingSupported,
      runId,
      triggerSource,
      dataId: null,
      summary: null,
      stats: null,
    });

    return result;
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

    const snapshot = await fetchBusinessEnrichmentSnapshot({ businessId, supabaseUrl, headers });
    const stats = buildEvidencePayload(snapshot.stats);
    const reasons = collectEnrichmentFailureReasons({ dataIdLookupError, summary, snapshot });
    const blockingReason = findBlockingEnrichmentReason(reasons);

    if (!hasEnrichmentEvidence(snapshot)) {
      const errorMessage = reasons.length ? reasons.join('; ') : 'no_enrichment_evidence';
      if (blockingReason) {
        return await handleBlockingEnrichmentFailure({
          businessId,
          placeId,
          attempts,
          errorMessage,
          supabaseUrl,
          headers,
          trackingSupported,
          runId,
          triggerSource,
          dataId,
          summary,
          stats,
          blockerReason: blockingReason,
        });
      }

      if (!trackingSupported) {
        await finalizeEnrichmentRun({
          supabaseUrl,
          headers,
          runId,
          status: 'failed',
          dataId,
          errorMessage,
          stepResults: summary?.steps || {},
          evidence: stats,
        });

        return {
          success: false,
          status: 'failed',
          attempts,
          error: errorMessage,
          dataId: dataId || null,
          summary,
          stats,
          trackingSupported,
        };
      }

      const failureResult = await finalizeEnrichmentFailure({
        businessId,
        attempts,
        errorMessage,
        supabaseUrl,
        headers,
      });

      await finalizeEnrichmentRun({
        supabaseUrl,
        headers,
        runId,
        status: failureResult.status,
        dataId,
        errorMessage,
        stepResults: summary?.steps || {},
        evidence: stats,
      });

      return {
        ...failureResult,
        dataId: dataId || null,
        summary,
        stats,
        trackingSupported,
      };
    }

    if (trackingSupported) {
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
    }

    await finalizeEnrichmentRun({
      supabaseUrl,
      headers,
      runId,
      status: 'completed',
      dataId,
      warnings: reasons.length ? reasons : null,
      stepResults: summary?.steps || {},
      evidence: stats,
    });

    return {
      success: true,
      status: 'completed',
      dataId: dataId || null,
      attempts,
      summary,
      stats,
      trackingSupported,
      warnings: reasons.length ? reasons : null,
    };
  } catch (err) {
    const errorMessage = err.message || 'enrichment_failed';
    const blockingReason = findBlockingEnrichmentReason([errorMessage]);
    if (blockingReason) {
      return await handleBlockingEnrichmentFailure({
        businessId,
        placeId,
        attempts,
        errorMessage,
        supabaseUrl,
        headers,
        trackingSupported,
        runId,
        triggerSource,
        dataId,
        summary: null,
        stats: null,
        blockerReason: blockingReason,
      });
    }

    if (!trackingSupported) {
      await finalizeEnrichmentRun({
        supabaseUrl,
        headers,
        runId,
        status: 'failed',
        dataId,
        errorMessage,
      });

      return {
        success: false,
        status: 'failed',
        attempts,
        error: errorMessage,
        trackingSupported,
      };
    }

    const failureResult = await finalizeEnrichmentFailure({
      businessId,
      attempts,
      errorMessage,
      supabaseUrl,
      headers,
    });

    await finalizeEnrichmentRun({
      supabaseUrl,
      headers,
      runId,
      status: failureResult.status,
      dataId,
      errorMessage,
    });

    return {
      ...failureResult,
      dataId: dataId || null,
      trackingSupported,
    };
  }
}

async function fetchBusinessCoreSnapshot({ businessId, supabaseUrl, headers }) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/businesses?id=eq.${businessId}&select=id,description,service_options,amenities,highlights`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch business enrichment snapshot: ${text.substring(0, 200)}`);
  }

  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Business not found');
  }

  return rows[0];
}

async function fetchBusinessEnrichmentSnapshot({ businessId, supabaseUrl, headers }) {
  const [business, stats] = await Promise.all([
    fetchBusinessCoreSnapshot({ businessId, supabaseUrl, headers }),
    fetchBusinessEnrichmentStats({ businessId, supabaseUrl, headers }),
  ]);

  return { business, stats };
}

function hasEnrichmentEvidence(snapshot) {
  const stats = snapshot?.stats || {};

  return stats.googlePhotoCount > 0;
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

async function finalizeEnrichmentFailure({ businessId, attempts, errorMessage, supabaseUrl, headers, forceFailed = false }) {
  const exhausted = forceFailed || attempts >= MAX_ENRICHMENT_ATTEMPTS;
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

function collectEnrichmentFailureReasons({ dataIdLookupError, summary, snapshot }) {
  const reasons = [];

  if (dataIdLookupError?.message) reasons.push(dataIdLookupError.message);

  for (const step of Object.values(summary?.steps || {})) {
    if (step?.ok === false && step.reason) {
      reasons.push(step.reason);
    }
  }

  if (!summary?.steps?.photos?.skipped && snapshot?.stats?.googlePhotoCount === 0) {
    reasons.push('no_google_photos_saved');
  }
  if (!summary?.steps?.reviews?.skipped && snapshot?.stats?.googleReviewCount === 0) {
    reasons.push('no_google_reviews_saved');
  }
  if (!summary?.steps?.social_profiles?.skipped && snapshot?.stats?.socialProfileCount === 0) {
    reasons.push('no_social_profiles_saved');
  }

  return Array.from(new Set(reasons.filter(Boolean)));
}

function findBlockingEnrichmentReason(reasons) {
  const text = Array.isArray(reasons) ? reasons.join(' ') : String(reasons || '');
  if (isConfigurationBlockerError(text)) {
    return 'SearchAPI configuration missing';
  }
  if (isQuotaOrBillingError(text)) {
    return 'SearchAPI quota or billing limit reached';
  }
  return null;
}

function buildEvidencePayload(stats) {
  return {
    googlePhotoCount: Number(stats?.googlePhotoCount || 0),
    googleReviewCount: Number(stats?.googleReviewCount || 0),
    socialProfileCount: Number(stats?.socialProfileCount || 0),
  };
}

function buildHttpFailureReason(prefix, status, errorText) {
  const detail = truncateEnrichmentText(errorText, 200)
    .replace(/\s+/g, ' ')
    .trim();
  return detail ? `${prefix}_http_${status}:${detail}` : `${prefix}_http_${status}`;
}

async function handleBlockingEnrichmentFailure({
  businessId,
  placeId,
  attempts,
  errorMessage,
  supabaseUrl,
  headers,
  trackingSupported,
  runId,
  triggerSource,
  dataId,
  summary,
  stats,
  blockerReason,
}) {
  const pauseReason = blockerReason || findBlockingEnrichmentReason([errorMessage]) || 'External enrichment API blocked';
  const pauseResult = await pauseEnrichmentPipeline({
    supabaseUrl,
    headers,
    reason: pauseReason,
    errorMessage,
    triggerSource,
    businessId,
    placeId,
    runId,
  });

  let failureResult = {
    success: false,
    status: 'failed',
    attempts,
    error: errorMessage,
    nextRetryAt: null,
  };

  if (trackingSupported) {
    failureResult = await finalizeEnrichmentFailure({
      businessId,
      attempts,
      errorMessage,
      supabaseUrl,
      headers,
      forceFailed: true,
    });
  }

  await finalizeEnrichmentRun({
    supabaseUrl,
    headers,
    runId,
    status: 'blocked',
    dataId,
    errorMessage,
    stepResults: summary?.steps || {},
    evidence: stats || {},
  });

  return {
    ...failureResult,
    dataId: dataId || null,
    summary: summary || null,
    stats: stats || null,
    trackingSupported,
    globalPause: true,
    pauseReason: pauseResult.reason || pauseReason,
  };
}
