// Shared logic: download external photo → upload to Supabase Storage → update business_photos record

/**
 * Persist a single photo from its external URL to Supabase Storage.
 * Never throws — returns a result object.
 *
 * @param {Object} params
 * @param {Object} params.record - Row from business_photos (id, business_id, source, photo_type, url, storage_path)
 * @param {string} params.supabaseUrl
 * @param {string} params.supabaseKey - Service role key
 * @returns {Promise<{success: boolean, storagePath?: string, publicUrl?: string, skipped?: boolean, error?: string}>}
 */
async function persistPhotoFromRecord({ record, supabaseUrl, supabaseKey }) {
  try {
    // Skip if already persisted or URL is already Supabase Storage
    if (record.storage_path) {
      return { success: true, skipped: true };
    }
    if (!record.url || record.url.includes(supabaseUrl)) {
      return { success: true, skipped: true };
    }

    // Download with 10s timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response;
    try {
      response = await fetch(record.url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status} fetching image` };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return { success: false, error: `Not an image: ${contentType}` };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > 5 * 1024 * 1024) {
      return { success: false, error: `Image too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB` };
    }

    // Determine extension from content type
    let ext = 'jpg';
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';

    // Build storage path: {business_id}/{source}-{photo_type}-{id_prefix}.{ext}
    const photoType = record.photo_type || 'photo';
    const idPrefix = (record.id || '').substring(0, 8);
    const storagePath = `${record.business_id}/${record.source}-${photoType}-${idPrefix}.${ext}`;

    // Upload to Supabase Storage (same pattern as api/ai/generate-photos.js)
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/photos/${storagePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': contentType.split(';')[0],
        'x-upsert': 'true',
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return { success: false, error: `Storage upload failed: ${uploadRes.status} ${errText.substring(0, 200)}` };
    }

    // Update the business_photos record with storage_path
    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/business_photos?id=eq.${record.id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ storage_path: storagePath }),
      }
    );

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      return { success: false, error: `DB update failed: ${patchRes.status} ${errText.substring(0, 200)}` };
    }

    const publicUrl = getPublicPhotoUrl(supabaseUrl, storagePath);
    return { success: true, storagePath, publicUrl };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Build the public URL for a photo stored in Supabase Storage.
 */
function getPublicPhotoUrl(supabaseUrl, storagePath) {
  return `${supabaseUrl}/storage/v1/object/public/photos/${storagePath}`;
}

module.exports = { persistPhotoFromRecord, getPublicPhotoUrl };
