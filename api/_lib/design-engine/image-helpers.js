import { getOptimizedPhotoUrl, getResponsivePhotoAttributes } from '../photo-urls.js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getOptimizedBackgroundUrl(url, preset = 'hero') {
  return getOptimizedPhotoUrl({
    url,
    supabaseUrl: SUPABASE_URL,
    preset,
  }) || String(url || '');
}

export function buildResponsiveImageTag({ url, alt, preset = 'section', sizes = '', loading = 'lazy', className = '' }) {
  const attrs = getResponsivePhotoAttributes({
    url,
    supabaseUrl: SUPABASE_URL,
    preset,
    sizes,
  });

  const src = esc(attrs.src || url || '');
  const srcset = attrs.srcset ? ` srcset="${esc(attrs.srcset)}"` : '';
  const sizesAttr = attrs.sizes ? ` sizes="${esc(attrs.sizes)}"` : '';
  const loadingAttr = loading ? ` loading="${esc(loading)}"` : '';
  const classAttr = className ? ` class="${esc(className)}"` : '';

  return `<img src="${src}" alt="${esc(alt)}"${srcset}${sizesAttr}${loadingAttr}${classAttr}>`;
}
