const DEFAULT_BUCKET = 'photos';

const PHOTO_PRESETS = {
  hero: { width: 1600, widths: [640, 960, 1280, 1600], quality: 72 },
  section: { width: 1200, widths: [480, 768, 1200], quality: 74 },
  gallery: { width: 960, widths: [360, 540, 720, 960], quality: 72 },
  card: { width: 720, widths: [320, 480, 720], quality: 72 },
  avatar: { width: 360, widths: [180, 240, 360], quality: 72 },
  background: { width: 1600, widths: [960, 1280, 1600], quality: 72 },
  existing_html: { width: 1400, widths: [960, 1400], quality: 72 },
};

function normalizeSupabaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function areImageTransformsEnabled() {
  const value = String(process.env.SUPABASE_IMAGE_TRANSFORMS_ENABLED || '').trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

function encodeStoragePath(storagePath) {
  return String(storagePath || '')
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function inferPhotoBucket(url) {
  const match = String(url || '').match(/\/storage\/v1\/(?:object\/public|render\/image\/public)\/([^/?#]+)\/(.+?)(?:\?.*)?$/);
  return match ? safeDecode(match[1]) : null;
}

function extractStoragePathFromUrl(url, supabaseUrl) {
  const normalizedSupabaseUrl = normalizeSupabaseUrl(supabaseUrl);
  const input = String(url || '');
  if (!input || !normalizedSupabaseUrl || !input.startsWith(normalizedSupabaseUrl)) {
    return null;
  }

  const match = input.match(/\/storage\/v1\/(?:object\/public|render\/image\/public)\/([^/?#]+)\/(.+?)(?:\?.*)?$/);
  if (!match) return null;

  return {
    bucket: safeDecode(match[1]),
    storagePath: safeDecode(match[2]),
  };
}

function resolveStoredPhotoLocation({ url, storagePath, bucket, supabaseUrl }) {
  if (storagePath) {
    return {
      bucket: bucket || inferPhotoBucket(url) || DEFAULT_BUCKET,
      storagePath,
    };
  }

  const fromUrl = extractStoragePathFromUrl(url, supabaseUrl);
  if (!fromUrl) return null;
  return fromUrl;
}

function getPublicPhotoUrl(supabaseUrl, storagePath, bucket = DEFAULT_BUCKET) {
  const normalizedSupabaseUrl = normalizeSupabaseUrl(supabaseUrl);
  if (!normalizedSupabaseUrl || !storagePath) return '';
  return `${normalizedSupabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeStoragePath(storagePath)}`;
}

function buildTransformedPhotoUrl(supabaseUrl, storagePath, options = {}) {
  const normalizedSupabaseUrl = normalizeSupabaseUrl(supabaseUrl);
  if (!normalizedSupabaseUrl || !storagePath) return '';

  const bucket = options.bucket || DEFAULT_BUCKET;
  const url = new URL(`${normalizedSupabaseUrl}/storage/v1/render/image/public/${encodeURIComponent(bucket)}/${encodeStoragePath(storagePath)}`);

  if (options.width) url.searchParams.set('width', String(Math.round(options.width)));
  if (options.height) url.searchParams.set('height', String(Math.round(options.height)));
  if (options.quality) url.searchParams.set('quality', String(Math.round(options.quality)));
  if (options.resize) url.searchParams.set('resize', String(options.resize));

  return url.toString();
}

function getPhotoTransformPreset(name) {
  return PHOTO_PRESETS[name] || PHOTO_PRESETS.section;
}

function getOptimizedPhotoUrl({ url, storagePath, bucket, supabaseUrl, preset = 'section', width, height, quality, resize }) {
  const location = resolveStoredPhotoLocation({ url, storagePath, bucket, supabaseUrl });
  if (!location) return String(url || '');
  if (!areImageTransformsEnabled()) {
    return getPublicPhotoUrl(supabaseUrl, location.storagePath, location.bucket);
  }

  const presetOptions = typeof preset === 'string' ? getPhotoTransformPreset(preset) : (preset || {});

  return buildTransformedPhotoUrl(supabaseUrl, location.storagePath, {
    bucket: location.bucket,
    width: width || presetOptions.width,
    height: height || presetOptions.height,
    quality: quality || presetOptions.quality,
    resize: resize || presetOptions.resize,
  });
}

function getResponsivePhotoAttributes({ url, storagePath, bucket, supabaseUrl, preset = 'section', sizes = '' }) {
  const location = resolveStoredPhotoLocation({ url, storagePath, bucket, supabaseUrl });
  if (!location) {
    return {
      src: String(url || ''),
      srcset: '',
      sizes: sizes || '',
      bucket: null,
      storagePath: null,
      optimized: false,
    };
  }

  if (!areImageTransformsEnabled()) {
    return {
      src: getPublicPhotoUrl(supabaseUrl, location.storagePath, location.bucket),
      srcset: '',
      sizes: sizes || '',
      bucket: location.bucket,
      storagePath: location.storagePath,
      optimized: false,
    };
  }

  const presetOptions = typeof preset === 'string' ? getPhotoTransformPreset(preset) : (preset || {});
  const widths = Array.from(new Set((presetOptions.widths || [presetOptions.width || 1200]).filter(Boolean)))
    .sort((a, b) => a - b);
  const defaultWidth = presetOptions.width || widths[widths.length - 1] || 1200;

  return {
    src: buildTransformedPhotoUrl(supabaseUrl, location.storagePath, {
      bucket: location.bucket,
      width: defaultWidth,
      height: presetOptions.height,
      quality: presetOptions.quality,
      resize: presetOptions.resize,
    }),
    srcset: widths.map((candidateWidth) => (
      `${buildTransformedPhotoUrl(supabaseUrl, location.storagePath, {
        bucket: location.bucket,
        width: candidateWidth,
        height: presetOptions.height,
        quality: presetOptions.quality,
        resize: presetOptions.resize,
      })} ${candidateWidth}w`
    )).join(', '),
    sizes: sizes || presetOptions.sizes || '',
    bucket: location.bucket,
    storagePath: location.storagePath,
    optimized: true,
  };
}

function inferPresetFromSection(section, slot = '') {
  const label = `${section || ''} ${slot || ''}`.toLowerCase();

  if (/(hero|cover|banner)/.test(label)) return 'hero';
  if (/(gallery|portafolio|portfolio|design)/.test(label)) return 'gallery';
  if (/(founder|owner|team|staff|equipo|avatar)/.test(label)) return 'avatar';
  if (/(service|services|menu|product|food|treatment|card)/.test(label)) return 'card';
  if (/(about|contact|ambiance|interior|exterior|location|ubicaci)/.test(label)) return 'section';
  return 'section';
}

function rewriteSupabasePhotoUrlsInHtml(html, supabaseUrl, preset = 'existing_html') {
  const normalizedSupabaseUrl = normalizeSupabaseUrl(supabaseUrl);
  if (!normalizedSupabaseUrl || !html) return String(html || '');
  if (!areImageTransformsEnabled()) return String(html || '');

  const storageUrlPattern = /https?:\/\/[^\s"'()<>]+\/storage\/v1\/(?:object\/public|render\/image\/public)\/[^\s"'()<>]+/g;

  return String(html).replace(storageUrlPattern, (match) => {
    const optimized = getOptimizedPhotoUrl({ url: match, supabaseUrl: normalizedSupabaseUrl, preset });
    return optimized || match;
  });
}

module.exports = {
  buildTransformedPhotoUrl,
  extractStoragePathFromUrl,
  areImageTransformsEnabled,
  getOptimizedPhotoUrl,
  getPhotoTransformPreset,
  getPublicPhotoUrl,
  getResponsivePhotoAttributes,
  inferPhotoBucket,
  inferPresetFromSection,
  normalizeSupabaseUrl,
  resolveStoredPhotoLocation,
  rewriteSupabasePhotoUrlsInHtml,
};
