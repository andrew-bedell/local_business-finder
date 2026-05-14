// Vercel serverless function: batch-persist old external photos + fix existing website HTML
// Protected by CRON_SECRET header. Can also be run as a Vercel cron job.

import { persistPhotoFromRecord } from '../_lib/photo-persist.js';
import {
  getOptimizedPhotoUrl,
  getPublicPhotoUrl,
  resolveStoredPhotoLocation,
  rewriteSupabasePhotoUrlsInHtml,
} from '../_lib/photo-urls.js';

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Auth check (Vercel cron sends GET with Bearer CRON_SECRET)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const supabaseKeyAlt = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKeyAlt || authHeader !== `Bearer ${supabaseKeyAlt}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const params = req.method === 'GET' ? (req.query || {}) : (req.body || {});
  const { source, businessId } = params;
  const fixHtml = params.fixHtml === true || params.fixHtml === 'true' || params.fixHtml === '1';
  const limit = Math.min(parseInt(params.limit || 50, 10) || 50, 100);
  const reprocessStored = params.reprocessStored !== false && params.reprocessStored !== 'false';

  try {
    const unpersisted = await queryPhotoRecords({
      supabaseUrl,
      supabaseKey,
      storageFilter: 'storage_path=is.null',
      source,
      businessId,
      limit,
    });

    const remaining = Math.max(0, limit - unpersisted.length);
    const storedToReprocess = reprocessStored && remaining > 0
      ? await queryPhotoRecords({
          supabaseUrl,
          supabaseKey,
          storageFilter: 'storage_path=not.is.null&storage_path=not.ilike.*.webp',
          source,
          businessId,
          limit: remaining,
        })
      : [];

    const records = [
      ...unpersisted.map((record) => ({ ...record, __forceOptimize: false })),
      ...storedToReprocess.map((record) => ({ ...record, __forceOptimize: true })),
    ];
    console.log(`Backfill: found ${unpersisted.length} photos to persist and ${storedToReprocess.length} stored photos to optimize`);

    // Process photos (sequentially in batches of 5 to avoid overwhelming)
    let persisted = 0, reprocessed = 0, skipped = 0, failed = 0;
    const errors = [];
    const persistedMap = {}; // oldUrl -> newPublicUrl

    for (let i = 0; i < records.length; i += 5) {
      const batch = records.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(record => persistPhotoFromRecord({
          record,
          supabaseUrl,
          supabaseKey,
          forceOptimize: record.__forceOptimize,
        }))
      );

      results.forEach((r, j) => {
        const record = batch[j];
        if (r.status === 'rejected') {
          failed++;
          errors.push({ id: record.id, error: r.reason?.message || String(r.reason) });
        } else if (r.value.skipped) {
          skipped++;
        } else if (r.value.success) {
          if (record.__forceOptimize) reprocessed++;
          else persisted++;
          addUrlReplacements(persistedMap, record, r.value, supabaseUrl);
        } else {
          failed++;
          errors.push({ id: record.id, error: r.value.error });
        }
      });
    }

    console.log(`Backfill persist: ${persisted} persisted, ${reprocessed} reprocessed, ${skipped} skipped, ${failed} failed`);

    // Fix HTML in generated_websites if requested
    let htmlFixed = 0;
    if (fixHtml) {
      htmlFixed = await fixWebsiteHtml(supabaseUrl, supabaseKey, persistedMap);
    }

    return res.status(200).json({ persisted, reprocessed, skipped, failed, htmlFixed, errors: errors.slice(0, 10) });
  } catch (err) {
    console.error('Photo backfill error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function queryPhotoRecords({ supabaseUrl, supabaseKey, storageFilter, source, businessId, limit }) {
  let queryUrl = `${supabaseUrl}/rest/v1/business_photos?${storageFilter}&select=id,business_id,source,photo_type,url,storage_path&limit=${limit}`;
  if (source) queryUrl += `&source=eq.${encodeURIComponent(source)}`;
  if (businessId) queryUrl += `&business_id=eq.${encodeURIComponent(businessId)}`;

  const queryRes = await fetch(queryUrl, {
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
    },
  });

  if (!queryRes.ok) {
    const errText = await queryRes.text();
    throw new Error(`Failed to query photos: ${queryRes.status} ${errText.substring(0, 200)}`);
  }

  return queryRes.json();
}

function addUrlReplacements(persistedMap, record, result, supabaseUrl) {
  if (!result?.publicUrl) return;

  const replacementUrl = getOptimizedPhotoUrl({
    url: result.publicUrl,
    storagePath: result.storagePath,
    supabaseUrl,
    preset: 'existing_html',
  }) || result.publicUrl;

  if (record.url) {
    persistedMap[record.url] = replacementUrl;
  }

  if (!record.storage_path) return;

  const previousLocation = resolveStoredPhotoLocation({
    url: record.url,
    storagePath: record.storage_path,
    supabaseUrl,
  });
  if (!previousLocation) return;

  const previousPublicUrl = getPublicPhotoUrl(supabaseUrl, previousLocation.storagePath, previousLocation.bucket);
  if (previousPublicUrl) {
    persistedMap[previousPublicUrl] = replacementUrl;
  }

  const previousOptimizedUrl = getOptimizedPhotoUrl({
    url: previousPublicUrl,
    storagePath: previousLocation.storagePath,
    bucket: previousLocation.bucket,
    supabaseUrl,
    preset: 'existing_html',
  });
  if (previousOptimizedUrl) {
    persistedMap[previousOptimizedUrl] = replacementUrl;
  }
}

/**
 * Replace old CDN URLs with persistent Supabase URLs in generated_websites config HTML.
 */
async function fixWebsiteHtml(supabaseUrl, supabaseKey, urlMap) {
  // Fetch all generated websites that have HTML
  const queryRes = await fetch(
    `${supabaseUrl}/rest/v1/generated_websites?select=id,config&or=(config->>html.not.is.null,config->>draft_html.not.is.null)&limit=200`,
    {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      },
    }
  );

  if (!queryRes.ok) {
    console.warn('Failed to fetch websites for HTML fixup:', queryRes.status);
    return 0;
  }

  const websites = await queryRes.json();
  let fixed = 0;

  for (const site of websites) {
    if (!site.config || (!site.config.html && !site.config.draft_html)) continue;

    let html = site.config.html || null;
    let draftHtml = site.config.draft_html || null;
    let changed = false;

    for (const [oldUrl, newUrl] of Object.entries(urlMap)) {
      if (html && html.includes(oldUrl)) {
        html = html.split(oldUrl).join(newUrl);
        changed = true;
      }
      if (draftHtml && draftHtml.includes(oldUrl)) {
        draftHtml = draftHtml.split(oldUrl).join(newUrl);
        changed = true;
      }
    }

    const optimizedHtml = html ? rewriteSupabasePhotoUrlsInHtml(html, supabaseUrl, 'existing_html') : html;
    const optimizedDraftHtml = draftHtml ? rewriteSupabasePhotoUrlsInHtml(draftHtml, supabaseUrl, 'existing_html') : draftHtml;
    if (optimizedHtml !== html || optimizedDraftHtml !== draftHtml) {
      html = optimizedHtml;
      draftHtml = optimizedDraftHtml;
      changed = true;
    }

    if (changed) {
      const updatedConfig = {
        ...site.config,
        ...(html ? { html } : {}),
        ...(draftHtml ? { draft_html: draftHtml } : {}),
      };
      const patchRes = await fetch(
        `${supabaseUrl}/rest/v1/generated_websites?id=eq.${site.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ config: updatedConfig }),
        }
      );

      if (patchRes.ok) {
        fixed++;
      } else {
        console.warn(`Failed to fix HTML for website ${site.id}:`, patchRes.status);
      }
    }
  }

  console.log(`HTML fixup: ${fixed} websites updated`);
  return fixed;
}
