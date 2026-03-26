// Vercel serverless function: persist external photos to Supabase Storage
// Called fire-and-forget from client after saving Instagram/Facebook data

import { persistPhotoFromRecord } from '../_lib/photo-persist.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  const { photoIds } = req.body || {};
  if (!Array.isArray(photoIds) || photoIds.length === 0) {
    return res.status(400).json({ error: 'photoIds array required' });
  }
  if (photoIds.length > 20) {
    return res.status(400).json({ error: 'Max 20 photos per request' });
  }

  try {
    // Fetch matching records that need persisting
    const idsParam = photoIds.map(id => `"${id}"`).join(',');
    const queryRes = await fetch(
      `${supabaseUrl}/rest/v1/business_photos?id=in.(${idsParam})&storage_path=is.null&source=in.(instagram,facebook)&select=id,business_id,source,photo_type,url,storage_path`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
      }
    );

    if (!queryRes.ok) {
      const errText = await queryRes.text();
      return res.status(500).json({ error: 'Failed to query photos', detail: errText.substring(0, 200) });
    }

    const records = await queryRes.json();
    if (records.length === 0) {
      return res.status(200).json({ persisted: 0, skipped: photoIds.length, failed: 0 });
    }

    // Process all in parallel
    const results = await Promise.allSettled(
      records.map(record => persistPhotoFromRecord({ record, supabaseUrl, supabaseKey }))
    );

    let persisted = 0, skipped = 0, failed = 0;
    const errors = [];
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        failed++;
        errors.push({ id: records[i].id, error: r.reason?.message || String(r.reason) });
      } else if (r.value.skipped) {
        skipped++;
      } else if (r.value.success) {
        persisted++;
      } else {
        failed++;
        errors.push({ id: records[i].id, error: r.value.error });
      }
    });

    // Also count IDs that weren't found in the query
    skipped += photoIds.length - records.length;

    console.log(`Photo persist: ${persisted} persisted, ${skipped} skipped, ${failed} failed`);
    if (errors.length > 0) console.warn('Photo persist errors:', errors);

    return res.status(200).json({ persisted, skipped, failed });
  } catch (err) {
    console.error('Photo persist error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
