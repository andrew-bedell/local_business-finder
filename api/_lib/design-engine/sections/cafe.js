// Design Engine V2 — Cafe-specific section renderers
// Menu highlights and daily specials for cafe/coffee shop websites

import { getMenuCategorySectionCss, renderMenuCategories } from './menu-media.js';

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Menu Highlights Section ──
export function menuHighlightsSection(content, photos) {
  const heading = esc(content?.menuHighlights?.heading || 'Nuestro Menu');
  const categories = content?.menuHighlights?.categories || [];

  if (!categories.length) return { html: '', css: '' };

  return {
    html: `
    <section id="menu" class="section section--alt">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Menu</span>
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

// ── Daily Specials Section ──
export function dailySpecialsSection(content) {
  const heading = esc(content?.dailySpecials?.heading || 'Especiales del Dia');
  const items = content?.dailySpecials?.items || [];

  if (!items.length) return { html: '', css: '' };

  return {
    html: `
    <section id="specials" class="section">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Especiales</span>
          <h2>${heading}</h2>
        </div>
        <div class="grid grid--3 reveal">
          ${items.map((item, i) => `
          <div class="card card--bordered stagger-${i + 1}">
            <h3>${esc(item.name)}</h3>
            <div class="divider"></div>
            <p style="color:var(--color-text-muted)">${esc(item.description)}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>`,
    css: '',
  };
}
