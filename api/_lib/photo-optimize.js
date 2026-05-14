const sharp = require('sharp');

const WEBP_CONTENT_TYPE = 'image/webp';
const WEBP_EXTENSION = 'webp';
const DEFAULT_MAX_BYTES = 50 * 1024;
const DEFAULT_MAX_DIMENSION = 1280;
const DEFAULT_MIN_DIMENSION = 360;
const DEFAULT_START_QUALITY = 74;
const DEFAULT_MIN_QUALITY = 18;

function readPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getPhotoOptimizationConfig(options = {}) {
  const maxBytes = readPositiveInt(options.maxBytes || process.env.PHOTO_WEBP_MAX_BYTES, DEFAULT_MAX_BYTES);
  const maxDimension = readPositiveInt(options.maxDimension || process.env.PHOTO_WEBP_MAX_DIMENSION, DEFAULT_MAX_DIMENSION);
  const minDimension = readPositiveInt(options.minDimension || process.env.PHOTO_WEBP_MIN_DIMENSION, DEFAULT_MIN_DIMENSION);
  const startQuality = readPositiveInt(options.startQuality || process.env.PHOTO_WEBP_START_QUALITY, DEFAULT_START_QUALITY);
  const minQuality = readPositiveInt(options.minQuality || process.env.PHOTO_WEBP_MIN_QUALITY, DEFAULT_MIN_QUALITY);

  return {
    maxBytes,
    maxDimension: Math.max(maxDimension, minDimension),
    minDimension,
    startQuality: clamp(startQuality, 1, 100),
    minQuality: clamp(Math.min(minQuality, startQuality), 1, 100),
  };
}

function buildDimensionCandidates(sourceMaxDimension, config) {
  const cap = Math.min(sourceMaxDimension || config.maxDimension, config.maxDimension);
  const floor = Math.min(config.minDimension, cap);
  const seeds = [
    cap,
    1120,
    960,
    800,
    640,
    520,
    420,
    config.minDimension,
  ];

  return Array.from(new Set(
    seeds
      .map((value) => Math.round(value))
      .filter((value) => value > 0 && value <= cap && value >= floor)
  )).sort((a, b) => b - a);
}

async function optimizePhotoForStorage(input, options = {}) {
  const sourceBuffer = Buffer.isBuffer(input) ? input : Buffer.from(input || []);
  if (!sourceBuffer.length) {
    throw new Error('Cannot optimize an empty image');
  }

  const config = getPhotoOptimizationConfig(options);
  const metadata = await sharp(sourceBuffer, { failOn: 'none', animated: false }).metadata();
  const sourceMaxDimension = Math.max(metadata.width || 0, metadata.height || 0) || config.maxDimension;
  const dimensions = buildDimensionCandidates(sourceMaxDimension, config);
  let smallestCandidate = null;

  async function render(maxDimension, quality) {
    const pipeline = sharp(sourceBuffer, { failOn: 'none', animated: false })
      .rotate()
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality,
        effort: 5,
        smartSubsample: true,
      });

    const result = await pipeline.toBuffer({ resolveWithObject: true });
    const candidate = {
      buffer: result.data,
      byteLength: result.data.length,
      width: result.info.width,
      height: result.info.height,
      quality,
      maxDimension,
    };

    if (!smallestCandidate || candidate.byteLength < smallestCandidate.byteLength) {
      smallestCandidate = candidate;
    }

    return candidate;
  }

  for (const maxDimension of dimensions) {
    const lowestQualityCandidate = await render(maxDimension, config.minQuality);
    if (lowestQualityCandidate.byteLength > config.maxBytes) {
      continue;
    }

    let best = lowestQualityCandidate;
    let low = config.minQuality + 1;
    let high = config.startQuality;

    while (low <= high) {
      const quality = Math.floor((low + high) / 2);
      const candidate = await render(maxDimension, quality);

      if (candidate.byteLength <= config.maxBytes) {
        best = candidate;
        low = quality + 1;
      } else {
        high = quality - 1;
      }
    }

    return {
      ...best,
      contentType: WEBP_CONTENT_TYPE,
      extension: WEBP_EXTENSION,
      originalByteLength: sourceBuffer.length,
      originalContentType: options.contentType || options.sourceContentType || '',
      maxBytes: config.maxBytes,
    };
  }

  const detail = smallestCandidate
    ? `${Math.round(smallestCandidate.byteLength / 1024)}KB at ${smallestCandidate.width}x${smallestCandidate.height}`
    : 'no candidate generated';
  throw new Error(`Image could not be compressed under ${Math.round(config.maxBytes / 1024)}KB (${detail})`);
}

module.exports = {
  WEBP_CONTENT_TYPE,
  WEBP_EXTENSION,
  getPhotoOptimizationConfig,
  optimizePhotoForStorage,
};
