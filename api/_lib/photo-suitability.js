import fs from 'node:fs/promises';
import sharp from 'sharp';
import { getPublicPhotoUrl } from './photo-urls.js';

const DESKTOP_ASPECT = 1440 / 720;
const MOBILE_ASPECT = 9 / 16;
const SAMPLE_SIZE = 96;
const DEFAULT_TIMEOUT_MS = 6000;
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalizeUrl(value) {
  return String(value || '').trim();
}

function getPhotoSourceUrl(photo, supabaseUrl) {
  if (!photo) return '';
  if (photo.storagePath || photo.storage_path) {
    const publicUrl = getPublicPhotoUrl(
      supabaseUrl,
      photo.storagePath || photo.storage_path,
      photo.bucket || 'photos'
    );
    if (publicUrl) return publicUrl;
  }
  return normalizeUrl(photo.originalUrl || photo.url);
}

async function fetchImageBuffer(source, { timeoutMs = DEFAULT_TIMEOUT_MS, maxBytes = DEFAULT_MAX_BYTES } = {}) {
  const url = normalizeUrl(source);
  if (!url) throw new Error('Missing image URL');

  if (url.startsWith('file://')) {
    return fs.readFile(new URL(url));
  }

  if (url.startsWith('/')) {
    return fs.readFile(url);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Image fetch failed (${response.status})`);

    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > maxBytes) throw new Error(`Image too large (${contentLength} bytes)`);

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > maxBytes) {
      throw new Error(`Image too large (${arrayBuffer.byteLength} bytes)`);
    }
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timer);
  }
}

function rgbToHslSaturation(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;
  if (max === min) return 0;
  const delta = max - min;
  return delta / (1 - Math.abs(2 * lightness - 1));
}

function buildSaliencyMap(raw, width, height) {
  const luminance = new Float32Array(width * height);
  const saturation = new Float32Array(width * height);
  let sumLum = 0;

  for (let i = 0, p = 0; i < raw.length; i += 3, p += 1) {
    const r = raw[i];
    const g = raw[i + 1];
    const b = raw[i + 2];
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    luminance[p] = lum;
    saturation[p] = rgbToHslSaturation(r, g, b);
    sumLum += lum;
  }

  const avgLum = sumLum / Math.max(1, width * height);
  const weights = new Float32Array(width * height);
  let sumWeight = 0;
  let sumEdge = 0;
  let sumSat = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const lum = luminance[index];
      const right = x + 1 < width ? luminance[index + 1] : lum;
      const down = y + 1 < height ? luminance[index + width] : lum;
      const edge = Math.abs(lum - right) + Math.abs(lum - down);
      const sat = saturation[index];
      const exposure = 1 - Math.min(1, Math.abs(lum - 0.52) * 2.4);
      const globalContrast = Math.abs(lum - avgLum);
      const weight = Math.max(0, edge * 1.45 + sat * 0.34 + exposure * 0.12 + globalContrast * 0.34);
      weights[index] = weight;
      sumWeight += weight;
      sumEdge += edge;
      sumSat += sat;
    }
  }

  if (sumWeight <= 0) {
    weights.fill(1 / Math.max(1, width * height));
    sumWeight = 1;
  }

  let cx = 0;
  let cy = 0;
  let entropy = 0;
  let activeCells = 0;
  const activeThreshold = sumWeight / Math.max(1, width * height) * 0.55;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const normalized = weights[index] / sumWeight;
      if (weights[index] > activeThreshold) activeCells += 1;
      if (normalized > 0) entropy -= normalized * Math.log(normalized);
      cx += ((x + 0.5) / width) * normalized;
      cy += ((y + 0.5) / height) * normalized;
    }
  }

  const maxEntropy = Math.log(Math.max(2, width * height));
  const spread = clamp(entropy / maxEntropy);
  const activeRatio = activeCells / Math.max(1, width * height);

  return {
    weights,
    width,
    height,
    centroidX: clamp(cx),
    centroidY: clamp(cy),
    spread,
    activeRatio,
    averageEdge: sumEdge / Math.max(1, width * height),
    averageSaturation: sumSat / Math.max(1, width * height),
  };
}

function scoreCrop(map, imageAspect, targetAspect) {
  let cropWidth = 1;
  let cropHeight = 1;
  if (imageAspect > targetAspect) {
    cropWidth = targetAspect / imageAspect;
  } else {
    cropHeight = imageAspect / targetAspect;
  }

  const useCenter = map.activeRatio > 0.48 || (map.spread > 0.88 && map.activeRatio > 0.24);
  const desiredX = useCenter ? 0.5 : map.centroidX;
  const desiredY = useCenter ? 0.5 : map.centroidY;
  const centerX = clamp(desiredX, cropWidth / 2, 1 - cropWidth / 2);
  const centerY = clamp(desiredY, cropHeight / 2, 1 - cropHeight / 2);
  const left = centerX - cropWidth / 2;
  const right = centerX + cropWidth / 2;
  const top = centerY - cropHeight / 2;
  const bottom = centerY + cropHeight / 2;

  let mass = 0;
  for (let y = 0; y < map.height; y += 1) {
    const py = (y + 0.5) / map.height;
    if (py < top || py > bottom) continue;
    for (let x = 0; x < map.width; x += 1) {
      const px = (x + 0.5) / map.width;
      if (px < left || px > right) continue;
      mass += map.weights[y * map.width + x];
    }
  }

  const totalMass = map.weights.reduce((sum, weight) => sum + weight, 0) || 1;
  const massFraction = mass / totalMass;
  const cropArea = cropWidth * cropHeight;
  const densityRatio = cropArea > 0 ? massFraction / cropArea : 0;
  const densityScore = clamp(densityRatio / 0.85);
  const massScore = clamp(massFraction / Math.min(0.82, cropArea * 1.15));
  const score = clamp((densityScore * 0.58) + (massScore * 0.42));

  return {
    score,
    massFraction,
    cropArea,
    centerX,
    centerY,
    position: `${Math.round(centerX * 100)}% ${Math.round(centerY * 100)}%`,
  };
}

function getReason(score, metadata, desktopCrop, mobileCrop) {
  if (!metadata.width || !metadata.height) return 'missing dimensions';
  if (metadata.width < 700 || metadata.height < 360) return 'too small for hero crop';
  if (desktopCrop.score < 0.42) return 'weak desktop crop';
  if (mobileCrop.score < 0.34) return 'weak mobile crop';
  if (score < 48) return 'low visual suitability';
  return 'usable';
}

export async function analyzeHeroPhotoSuitability(photo, options = {}) {
  const sourceUrl = getPhotoSourceUrl(photo, options.supabaseUrl || '');
  try {
    const buffer = await fetchImageBuffer(sourceUrl, options);
    const image = sharp(buffer, { failOn: 'none', animated: false, limitInputPixels: 50_000_000 }).rotate();
    const metadata = await image.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (!width || !height) {
      return { score: 0, usable: false, reason: 'missing dimensions', sourceUrl };
    }

    const { data, info } = await image
      .clone()
      .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const saliency = buildSaliencyMap(data, info.width, info.height);
    const imageAspect = width / height;
    const desktopCrop = scoreCrop(saliency, imageAspect, DESKTOP_ASPECT);
    const mobileCrop = scoreCrop(saliency, imageAspect, MOBILE_ASPECT);
    const dimensionScore = clamp(Math.min(width / 1200, height / 560));
    const textureScore = clamp((saliency.averageEdge * 4.2) + (saliency.averageSaturation * 0.9));
    const spreadScore = clamp((saliency.spread * 0.7) + (saliency.activeRatio * 0.8));
    const score = Math.round(100 * (
      dimensionScore * 0.22 +
      desktopCrop.score * 0.25 +
      mobileCrop.score * 0.25 +
      textureScore * 0.14 +
      spreadScore * 0.14
    ));
    const reason = getReason(score, { width, height }, desktopCrop, mobileCrop);

    return {
      score,
      usable: reason === 'usable',
      reason,
      width,
      height,
      aspect: Number(imageAspect.toFixed(3)),
      saliency: {
        x: Number(saliency.centroidX.toFixed(3)),
        y: Number(saliency.centroidY.toFixed(3)),
        spread: Number(saliency.spread.toFixed(3)),
        activeRatio: Number(saliency.activeRatio.toFixed(3)),
      },
      objectPosition: desktopCrop.position,
      desktopPosition: desktopCrop.position,
      mobilePosition: mobileCrop.position,
      desktopCropScore: Number(desktopCrop.score.toFixed(3)),
      mobileCropScore: Number(mobileCrop.score.toFixed(3)),
      sourceUrl,
    };
  } catch (error) {
    return {
      score: 0,
      usable: false,
      reason: error?.message || 'analysis failed',
      sourceUrl,
    };
  }
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function analyzeHeroPhotoCandidates(photos, options = {}) {
  const maxCandidates = options.maxHeroCandidates || 12;
  const candidates = (photos || []).slice(0, maxCandidates);
  const analyses = await mapWithConcurrency(candidates, options.concurrency || 4, async (photo) => ({
    photo,
    suitability: await analyzeHeroPhotoSuitability(photo, options),
  }));

  return analyses.sort((a, b) => (b.suitability?.score || 0) - (a.suitability?.score || 0));
}
