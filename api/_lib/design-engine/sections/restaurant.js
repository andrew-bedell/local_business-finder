// Design Engine V2 — Restaurant-specific section renderers
// Menu highlights and ambiance sections for restaurant websites

import { getMenuCategorySectionCss, renderMenuCategories } from './menu-media.js';

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getPhotoForSection(photos, sectionName) {
  if (!photos || !photos.length) return null;
  const match = photos.find(p => p.section && p.section.toLowerCase().includes(sectionName.toLowerCase()));
  return match ? match.url : null;
}

// ── Menu Section ──
export function menuSection(content, photos) {
  const heading = esc(content?.menuHighlights?.heading || 'Nuestro Menú');
  const categories = content?.menuHighlights?.categories || [];

  if (!categories.length) return { html: '', css: '' };

  return {
    html: `
    <section id="menu" class="section section--alt">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Menú</span>
          <h2>${heading}</h2>
        </div>
        <div class="reveal" style="max-width:700px;margin:0 auto;">
          ${renderMenuCategories(categories, photos)}
        </div>
      </div>
    </section>`,
    css: getMenuCategorySectionCss(),
  };
}

// ── Ambiance Section ──
export function ambianceSection(content, photos) {
  const heading = esc(content?.ambiance?.heading || 'Nuestro Ambiente');
  const description = esc(content?.ambiance?.description || '');
  const photo = getPhotoForSection(photos, 'ambiance')
    || getPhotoForSection(photos, 'interior')
    || getPhotoForSection(photos, 'ambiente');

  if (!description && !photo) return { html: '', css: '' };

  return {
    html: `
    <section id="ambiance" class="section">
      <div class="container split">
        <div class="reveal">
          <div class="section-header">
            <span class="eyebrow">Ambiente</span>
            <h2>${heading}</h2>
          </div>
          ${description ? `<p>${description}</p>` : ''}
        </div>
        ${photo ? `
        <div class="reveal-right img-rounded aspect-4-3">
          <img src="${esc(photo)}" alt="${heading}" class="img-cover">
        </div>` : ''}
      </div>
    </section>`,
    css: '',
  };
}
