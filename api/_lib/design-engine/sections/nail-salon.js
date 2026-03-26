// Design Engine V2 — Nail salon section renderers
// Business-type-specific: nail services with pricing, design gallery portfolio

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
  return photos.filter(p => p.section && p.section.toLowerCase().includes(sectionName.toLowerCase())).map(p => p.url);
}

function getAllPhotos(photos) {
  if (!photos || !photos.length) return [];
  return photos.map(p => p.url).filter(Boolean);
}

// ── Nail Services Section ──
export function nailServicesSection(content, photos) {
  const treatments = content?.treatments;
  if (!treatments) return { html: '', css: '' };

  const heading = esc(treatments.heading || 'Nuestros Servicios');
  const categories = treatments.categories || [];

  if (!categories.length) return { html: '', css: '' };

  return {
    html: `
    <section id="nail-services" class="section section--alt">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Tratamientos</span>
          <h2>${heading}</h2>
        </div>
        <div class="nail-categories reveal">
          ${categories.map(cat => `
          <div class="nail-category card card--bordered">
            <h3 class="nail-category__title">${esc(cat.name)}</h3>
            <div class="divider"></div>
            <ul class="nail-items">
              ${(cat.items || []).map(item => `
              <li class="nail-item">
                <div class="nail-item__header">
                  <span class="nail-item__name">${esc(item.name)}</span>
                  <span class="nail-item__meta">
                    ${item.duration ? `<span class="nail-item__duration">${esc(item.duration)}</span>` : ''}
                    ${item.priceRange ? `<span class="nail-item__price">${esc(item.priceRange)}</span>` : ''}
                  </span>
                </div>
                ${item.description ? `<p class="nail-item__desc">${esc(item.description)}</p>` : ''}
              </li>`).join('')}
            </ul>
          </div>`).join('')}
        </div>
      </div>
    </section>`,
    css: `
    .nail-categories {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
    }

    .nail-category {
      padding: 2.5rem;
    }

    .nail-category__title {
      font-family: var(--font-heading);
    }

    .nail-items {
      list-style: none;
    }

    .nail-item {
      padding: 0.75rem 0;
      border-bottom: 1px dotted rgba(0,0,0,0.08);
    }

    .nail-item:last-child {
      border-bottom: none;
    }

    .nail-item__header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
    }

    .nail-item__name {
      font-family: var(--font-heading);
      font-size: 1.05rem;
      font-weight: 500;
    }

    .nail-item__meta {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      white-space: nowrap;
    }

    .nail-item__duration {
      font-size: 0.85rem;
      color: var(--color-text-muted);
    }

    .nail-item__price {
      font-family: var(--font-heading);
      font-size: 1.05rem;
      color: var(--color-accent);
    }

    .nail-item__desc {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      margin-top: 0.25rem;
      margin-bottom: 0;
    }

    @media (max-width: 900px) {
      .nail-categories {
        grid-template-columns: 1fr;
      }
    }`,
  };
}

// ── Design Gallery Section (Nail Art Portfolio) ──
export function designGallerySection(content, photos) {
  const heading = esc(content?.designGallery?.heading || 'Galería de Diseños');

  // Look for photos tagged with design/nail/art/diseño
  const designKeywords = ['design', 'nail', 'art', 'diseño'];
  let galleryPhotos = [];
  if (photos && photos.length) {
    galleryPhotos = photos.filter(p =>
      p.section && designKeywords.some(kw => p.section.toLowerCase().includes(kw))
    ).map(p => p.url);
  }

  // Fall back to all available photos if not enough tagged
  if (galleryPhotos.length < 4) {
    const allPhotos = getAllPhotos(photos);
    if (allPhotos.length > 0) {
      galleryPhotos = allPhotos.slice(0, 8);
    }
  }

  if (galleryPhotos.length === 0) return { html: '', css: '' };

  return {
    html: `
    <section id="design-gallery" class="section">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Portafolio</span>
          <h2>${heading}</h2>
        </div>
      </div>
      <div class="h-scroll reveal" style="padding-left:3rem;">
        ${galleryPhotos.map((url, i) => `
        <div class="h-scroll__item">
          <img src="${esc(url)}" alt="Diseño ${i + 1}" loading="lazy">
        </div>`).join('')}
      </div>
    </section>`,
    css: '',
  };
}
