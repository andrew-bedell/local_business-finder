import { runTrackedBusinessEnrichment } from '../_lib/enrichment-runner.js';

export const config = { maxDuration: 300 };

const TIME_BUDGET_MS = 240_000;
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_STALE_MINUTES = 90;
const BUSINESS_SELECT = [
  'id',
  'place_id',
  'name',
  'address_full',
  'created_at',
  'enrichment_status',
  'enrichment_attempts',
  'enrichment_last_started_at',
  'enrichment_last_finished_at',
  'enrichment_next_retry_at',
].join(',');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const supabaseKeyAlt = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKeyAlt || authHeader !== `Bearer ${supabaseKeyAlt}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  if (process.env.BACKGROUND_ENRICHMENT_ENABLED === 'false') {
    return res.status(200).json({ message: 'Background enrichment is disabled' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  const batchSize = clampInteger(process.env.ENRICHMENT_CRON_BATCH_SIZE, DEFAULT_BATCH_SIZE, 1, 25);
  const staleMinutes = clampInteger(process.env.ENRICHMENT_STALE_MINUTES, DEFAULT_STALE_MINUTES, 15, 24 * 60);
  const now = new Date();

  try {
    const dueBusinesses = await fetchDueBusinesses({
      supabaseUrl,
      headers,
      now,
      batchSize,
      staleMinutes,
    });

    if (dueBusinesses.length === 0) {
      return res.status(200).json({ message: 'No businesses due for enrichment' });
    }

    const startedAt = Date.now();
    const results = [];
    let processed = 0;

    for (const business of dueBusinesses) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) {
        break;
      }

      try {
        const result = await runTrackedBusinessEnrichment({
          businessId: business.id,
          placeId: business.place_id,
          businessName: business.name || null,
          businessAddress: business.address_full || null,
          supabaseUrl,
          supabaseKey,
        });

        processed++;
        results.push({
          businessId: business.id,
          name: business.name,
          previousStatus: business.enrichment_status || 'pending',
          status: result.status,
          success: !!result.success,
          nextRetryAt: result.nextRetryAt || null,
          error: result.error || null,
        });
      } catch (err) {
        processed++;
        results.push({
          businessId: business.id,
          name: business.name,
          previousStatus: business.enrichment_status || 'pending',
          status: 'failed',
          success: false,
          error: err.message || 'Background enrichment failed',
        });
      }
    }

    return res.status(200).json({
      processed,
      selected: dueBusinesses.length,
      remaining: Math.max(dueBusinesses.length - processed, 0),
      results,
    });
  } catch (err) {
    console.error('[EnrichmentCron] Failed:', err);
    return res.status(500).json({ error: err.message || 'Background enrichment failed' });
  }
}

async function fetchDueBusinesses({ supabaseUrl, headers, now, batchSize, staleMinutes }) {
  const retryLimit = batchSize * 3;
  const staleCutoffMs = now.getTime() - (staleMinutes * 60 * 1000);

  const [pending, retry, inProgress, missingStatus] = await Promise.all([
    fetchBusinessBatch({
      supabaseUrl,
      headers,
      filterValue: 'eq.pending',
      order: 'created_at.asc',
      limit: batchSize,
    }),
    fetchBusinessBatch({
      supabaseUrl,
      headers,
      filterValue: 'eq.retry',
      order: 'enrichment_next_retry_at.asc.nullsfirst',
      limit: retryLimit,
    }),
    fetchBusinessBatch({
      supabaseUrl,
      headers,
      filterValue: 'eq.in_progress',
      order: 'enrichment_last_started_at.asc.nullsfirst',
      limit: retryLimit,
    }),
    fetchBusinessBatch({
      supabaseUrl,
      headers,
      filterValue: 'is.null',
      order: 'created_at.asc',
      limit: batchSize,
    }),
  ]);

  const due = [];
  const seen = new Set();

  function pushBusiness(business) {
    if (!business || !business.id || !business.place_id || seen.has(business.id)) return;
    seen.add(business.id);
    due.push(business);
  }

  retry
    .filter((business) => {
      if (!business.enrichment_next_retry_at) return true;
      const retryAt = Date.parse(business.enrichment_next_retry_at);
      return Number.isFinite(retryAt) ? retryAt <= now.getTime() : true;
    })
    .forEach(pushBusiness);

  inProgress
    .filter((business) => {
      if (!business.enrichment_last_started_at) return true;
      const startedAt = Date.parse(business.enrichment_last_started_at);
      return Number.isFinite(startedAt) ? startedAt <= staleCutoffMs : true;
    })
    .forEach(pushBusiness);

  pending.forEach(pushBusiness);
  missingStatus.forEach(pushBusiness);

  return due.slice(0, batchSize);
}

async function fetchBusinessBatch({ supabaseUrl, headers, filterValue, order, limit }) {
  const params = new URLSearchParams({
    select: BUSINESS_SELECT,
    limit: String(limit),
  });
  params.set('enrichment_status', filterValue);
  if (order) params.set('order', order);

  const response = await fetch(`${supabaseUrl}/rest/v1/businesses?${params.toString()}`, { headers });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to query businesses for enrichment: ${text.substring(0, 200)}`);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows : [];
}

function clampInteger(value, fallback, min, max) {
  const parsed = parseInt(value || '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}
