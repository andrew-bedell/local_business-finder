// Shared logic: download external photo → upload to Supabase Storage → update business_photos record

const crypto = require('crypto');
const { getPublicPhotoUrl, resolveStoredPhotoLocation } = require('./photo-urls.js');
const { optimizePhotoForStorage } = require('./photo-optimize.js');

function withWebpExtension(storagePath, extension) {
  const path = String(storagePath || '').trim();
  if (!path) return '';
  if (/\.[a-z0-9]+$/i.test(path)) {
    return path.replace(/\.[a-z0-9]+$/i, `.${extension}`);
  }
  return `${path}.${extension}`;
}

function isWebpStoragePath(storagePath) {
  return /\.webp$/i.test(String(storagePath || '').split('?')[0]);
}

function buildPhotoStoragePath({ businessId, source, photoType, idPrefix, extension }) {
  const cleanBusinessId = String(businessId || 'unassigned').replace(/[^a-z0-9-_]/gi, '-');
  const cleanSource = String(source || 'photo').replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
  const cleanType = String(photoType || 'photo').replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
  const cleanId = String(idPrefix || crypto.randomUUID()).replace(/[^a-z0-9-_]/gi, '').substring(0, 12);
  return `${cleanBusinessId}/${cleanSource}-${cleanType}-${cleanId}.${extension}`;
}

function buildPhotoRecordMetadata({ originalUrl, publicUrl, storagePath, optimized }) {
  return {
    original_url: originalUrl || null,
    storage_path: storagePath,
    url: publicUrl,
    content_type: optimized.contentType,
    byte_size: optimized.byteLength,
    width: optimized.width,
    height: optimized.height,
    optimized_at: new Date().toISOString(),
    is_website_eligible: true,
  };
}

/**
 * Persist a single photo from its external URL to Supabase Storage.
 * Never throws — returns a result object.
 *
 * @param {Object} params
 * @param {Object} params.record - Row from business_photos (id, business_id, source, photo_type, url, storage_path)
 * @param {string} params.supabaseUrl
 * @param {string} params.supabaseKey - Service role key
 * @param {boolean} [params.forceOptimize] - Reprocess already-persisted photos into optimized WebP
 * @returns {Promise<{success: boolean, storagePath?: string, publicUrl?: string, skipped?: boolean, error?: string}>}
 */
async function persistPhotoFromRecord({ record, supabaseUrl, supabaseKey, forceOptimize = false, updateRecord = true }) {
  try {
    // Skip only when the canonical persisted asset is already optimized WebP.
    if (record.storage_path && isWebpStoragePath(record.storage_path) && !forceOptimize) {
      return { success: true, skipped: true };
    }

    const storedLocation = resolveStoredPhotoLocation({
      url: record.url,
      storagePath: record.storage_path,
      supabaseUrl,
    });
    const sourceUrl = record.storage_path && storedLocation
      ? getPublicPhotoUrl(supabaseUrl, storedLocation.storagePath, storedLocation.bucket)
      : record.url;

    if (!sourceUrl) {
      return { success: true, skipped: true };
    }

    // Download with 10s timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response;
    try {
      response = await fetch(sourceUrl, { signal: controller.signal });
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
    if (buffer.length > 20 * 1024 * 1024) {
      return { success: false, error: `Image too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB` };
    }

    const optimized = await optimizePhotoForStorage(buffer, { sourceContentType: contentType });

    // Build storage path: {business_id}/{source}-{photo_type}-{id_prefix}.{ext}
    const photoType = record.photo_type || 'photo';
    const source = record.source || 'photo';
    const idPrefix = String(record.id || '').substring(0, 8) || Date.now().toString(36);
    const storagePath = record.storage_path
      ? withWebpExtension(record.storage_path, optimized.extension)
      : buildPhotoStoragePath({
          businessId: record.business_id,
          source,
          photoType,
          idPrefix,
          extension: optimized.extension,
        });
    const publicUrl = getPublicPhotoUrl(supabaseUrl, storagePath);

    // Upload normalized WebP to Supabase Storage.
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/photos/${storagePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': optimized.contentType,
        'x-upsert': 'true',
      },
      body: optimized.buffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return { success: false, error: `Storage upload failed: ${uploadRes.status} ${errText.substring(0, 200)}` };
    }

    const result = {
      success: true,
      storagePath,
      publicUrl,
      previousStoragePath: record.storage_path || null,
      previousUrl: record.url || null,
      originalBytes: optimized.originalByteLength,
      optimizedBytes: optimized.byteLength,
      width: optimized.width,
      height: optimized.height,
      quality: optimized.quality,
      contentType: optimized.contentType,
      optimizedAt: new Date().toISOString(),
    };

    if (!updateRecord) {
      return result;
    }

    // Update the business_photos record with canonical WebP metadata.
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
        body: JSON.stringify(buildPhotoRecordMetadata({
          originalUrl: record.original_url || record.url || null,
          publicUrl,
          storagePath,
          optimized,
        })),
      }
    );

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      return { success: false, error: `DB update failed: ${patchRes.status} ${errText.substring(0, 200)}` };
    }

    return result;
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
}

async function persistPhotoFromUrl({
  businessId,
  source,
  photoType,
  url,
  supabaseUrl,
  supabaseKey,
  idPrefix,
}) {
  const record = {
    id: idPrefix || crypto.randomUUID(),
    business_id: businessId,
    source,
    photo_type: photoType,
    url,
    original_url: url,
    storage_path: null,
  };

  const result = await persistPhotoFromRecord({
    record,
    supabaseUrl,
    supabaseKey,
    forceOptimize: true,
    updateRecord: false,
  });

  if (!result.success) return result;

  return {
    ...result,
    row: {
      business_id: businessId,
      source,
      photo_type: photoType || null,
      url: result.publicUrl,
      storage_path: result.storagePath,
      original_url: url,
      content_type: 'image/webp',
      byte_size: result.optimizedBytes,
      width: result.width,
      height: result.height,
      optimized_at: result.optimizedAt,
      is_website_eligible: true,
    },
  };
}

module.exports = {
  buildPhotoRecordMetadata,
  getPublicPhotoUrl,
  isWebpStoragePath,
  persistPhotoFromRecord,
  persistPhotoFromUrl,
};
