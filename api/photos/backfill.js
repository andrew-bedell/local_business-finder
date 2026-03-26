// Vercel serverless function: batch-persist old external photos + fix existing website HTML
// Protected by CRON_SECRET header. Can also be run as a Vercel cron job.

import { persistPhotoFromRecord, getPublicPhotoUrl } from '../_lib/photo-persist.js';

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

  const { source, businessId, limit = 50, fixHtml = false } = req.body || {};

  try {
    // Build query for unpersisted photos
    let queryUrl = `${supabaseUrl}/rest/v1/business_photos?storage_path=is.null&source=in.(instagram,facebook)&select=id,business_id,source,photo_type,url,storage_path&limit=${Math.min(limit, 100)}`;
    if (source) queryUrl += `&source=eq.${source}`;
    if (businessId) queryUrl += `&business_id=eq.${businessId}`;

    const queryRes = await fetch(queryUrl, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      },
    });

    if (!queryRes.ok) {
      const errText = await queryRes.text();
      return res.status(500).json({ error: 'Failed to query photos', detail: errText.substring(0, 200) });
    }

    const records = await queryRes.json();
    console.log(`Backfill: found ${records.length} photos to persist`);

    // Process photos (sequentially in batches of 5 to avoid overwhelming)
    let persisted = 0, skipped = 0, failed = 0;
    const errors = [];
    const persistedMap = {}; // oldUrl -> newPublicUrl

    for (let i = 0; i < records.length; i += 5) {
      const batch = records.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(record => persistPhotoFromRecord({ record, supabaseUrl, supabaseKey }))
      );

      results.forEach((r, j) => {
        const record = batch[j];
        if (r.status === 'rejected') {
          failed++;
          errors.push({ id: record.id, error: r.reason?.message || String(r.reason) });
        } else if (r.value.skipped) {
          skipped++;
        } else if (r.value.success) {
          persisted++;
          if (r.value.publicUrl && record.url) {
            persistedMap[record.url] = r.value.publicUrl;
          }
        } else {
          failed++;
          errors.push({ id: record.id, error: r.value.error });
        }
      });
    }

    console.log(`Backfill persist: ${persisted} persisted, ${skipped} skipped, ${failed} failed`);

    // Fix HTML in generated_websites if requested
    let htmlFixed = 0;
    if (fixHtml && Object.keys(persistedMap).length > 0) {
      htmlFixed = await fixWebsiteHtml(supabaseUrl, supabaseKey, persistedMap);
    }

    return res.status(200).json({ persisted, skipped, failed, htmlFixed, errors: errors.slice(0, 10) });
  } catch (err) {
    console.error('Photo backfill error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Replace old CDN URLs with persistent Supabase URLs in generated_websites config.html
 */
async function fixWebsiteHtml(supabaseUrl, supabaseKey, urlMap) {
  // Fetch all generated websites that have HTML
  const queryRes = await fetch(
    `${supabaseUrl}/rest/v1/generated_websites?select=id,config&config->>html=not.is.null&limit=200`,
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
    if (!site.config || !site.config.html) continue;

    let html = site.config.html;
    let changed = false;

    for (const [oldUrl, newUrl] of Object.entries(urlMap)) {
      if (html.includes(oldUrl)) {
        html = html.split(oldUrl).join(newUrl);
        changed = true;
      }
    }

    if (changed) {
      const updatedConfig = { ...site.config, html };
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
