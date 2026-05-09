// Design Engine V2 — Retail/product section renderers
// Business-type-specific: featured products and catalog-style offer presentation

import { buildResponsiveImageTag } from '../image-helpers.js';

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getPhotosForSection(photos, sectionName) {
  if (!photos || !photos.length) return [];
  return photos
    .filter((photo) => photo.section && photo.section.toLowerCase().includes(sectionName.toLowerCase()))
    .map((photo) => photo.url)
    .filter(Boolean);
}

function buildProductPhotoPool(photos) {
  const direct = getPhotosForSection(photos, 'products')
    .concat(getPhotosForSection(photos, 'product'))
    .concat(getPhotosForSection(photos, 'services'))
    .concat(getPhotosForSection(photos, 'gallery'));
  return Array.from(new Set(direct));
}

function mergeProducts(contentProducts, businessProducts, sectionPhotos) {
  const merged = [];
  const seen = new Set();

  (businessProducts || []).forEach((product, index) => {
    const key = String(product?.name || '').trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push({
      name: product.name,
      description: product.description || '',
      price: product.price ? `${product.currency || '$'}${product.price}` : '',
      badge: product.badge || '',
      photoUrl: product.photo_url || sectionPhotos[index] || '',
    });
  });

  (contentProducts || []).forEach((product, index) => {
    const key = String(product?.name || '').trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push({
      name: product.name,
      description: product.description || '',
      price: product.price || product.priceRange || '',
      badge: product.badge || '',
      photoUrl: sectionPhotos[index] || '',
    });
  });

  return merged;
}

export function productsSection(content, photos, business) {
  const heading = esc(content?.products?.heading || 'Productos Destacados');
  const language = business?.language === 'en' ? 'en' : 'es';
  const eyebrow = language === 'en' ? 'Products' : 'Productos';
  const productPhotos = buildProductPhotoPool(photos);
  const items = mergeProducts(content?.products?.items || [], business?.products || [], productPhotos);

  if (!items.length) return { html: '', css: '' };

  return {
    html: `
    <section id="products" class="section section--alt">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">${eyebrow}</span>
          <h2>${heading}</h2>
        </div>
        <div class="product-grid reveal">
          ${items.map((item, index) => `
          <article class="product-card stagger-${(index % 3) + 1}">
            ${item.photoUrl ? `
            <div class="product-card__photo aspect-1">
              ${buildResponsiveImageTag({ url: item.photoUrl, alt: item.name, preset: 'card', sizes: '(max-width: 768px) 100vw, 33vw', className: 'img-cover' })}
            </div>` : ''}
            <div class="product-card__body">
              <div class="product-card__topline">
                <h3>${esc(item.name)}</h3>
                ${item.badge ? `<span class="product-card__badge">${esc(item.badge)}</span>` : ''}
              </div>
              ${item.description ? `<p>${esc(item.description)}</p>` : ''}
              ${item.price ? `<p class="product-card__price">${esc(item.price)}</p>` : ''}
            </div>
          </article>`).join('')}
        </div>
      </div>
    </section>`,
    css: `
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.75rem;
    }

    .product-card {
      background: var(--color-bg);
      border: 1px solid rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .product-card__photo {
      width: 100%;
      overflow: hidden;
      background: rgba(0,0,0,0.03);
    }

    .product-card__photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .product-card__body {
      padding: 1.5rem;
    }

    .product-card__topline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .product-card__topline h3 {
      margin: 0;
    }

    .product-card__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem 0.7rem;
      border-radius: 999px;
      background: rgba(var(--color-accent-rgb), 0.12);
      color: var(--color-accent);
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .product-card__price {
      margin-top: 0.9rem;
      color: var(--color-accent);
      font-family: var(--font-heading);
      font-size: 1.05rem;
    }`,
  };
}
