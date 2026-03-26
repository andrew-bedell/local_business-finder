// Design Engine V2 — Beauty Salon section renderers
// Business-type-specific sections: treatments grid, team/staff profiles

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getPhotoForSection(photos, sectionName) {
  if (!photos || !photos.length) return null;
  const match = photos.find(p => p.section && p.section.toLowerCase().includes(sectionName.toLowerCase()));
  return match ? match.url : null;
}

function getPhotosForSection(photos, sectionName) {
  if (!photos || !photos.length) return [];
  return photos.filter(p => p.section && p.section.toLowerCase().includes(sectionName.toLowerCase())).map(p => p.url);
}

// ── Treatments Section ──
export function treatmentsSection(content, photos) {
  const heading = esc(content?.treatments?.heading || 'Nuestros Tratamientos');
  const categories = content?.treatments?.categories || [];

  if (!categories.length) return { html: '', css: '' };

  return {
    html: `
    <section id="treatments" class="section section--alt">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Tratamientos</span>
          <h2>${heading}</h2>
        </div>
        <div class="service-grid reveal">
          ${categories.map(cat => `
          <div class="service-grid__item">
            <h3>${esc(cat.name)}</h3>
            <div class="treatments-list">
              ${(cat.items || []).map(item => `
              <div class="treatment-item">
                <div class="treatment-item__header">
                  <span class="treatment-item__name">${esc(item.name)}</span>
                  ${item.priceRange ? `<span class="treatment-item__price">${esc(item.priceRange)}</span>` : ''}
                </div>
                ${item.description ? `<p class="treatment-item__desc">${esc(item.description)}</p>` : ''}
                ${item.duration ? `<span class="treatment-item__duration">${esc(item.duration)}</span>` : ''}
              </div>`).join('')}
            </div>
          </div>`).join('')}
        </div>
      </div>
    </section>`,
    css: `
    .treatments-list {
      margin-top: 1rem;
    }

    .treatment-item {
      padding: 0.75rem 0;
      border-bottom: 1px dotted rgba(0,0,0,0.08);
    }

    .treatment-item:last-child {
      border-bottom: none;
    }

    .treatment-item__header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
    }

    .treatment-item__name {
      font-family: var(--font-heading);
      font-size: 1rem;
      font-weight: 500;
    }

    .treatment-item__price {
      font-family: var(--font-heading);
      font-size: 0.95rem;
      color: var(--color-accent);
      white-space: nowrap;
    }

    .treatment-item__desc {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      margin: 0.25rem 0 0;
    }

    .treatment-item__duration {
      display: inline-block;
      font-size: 0.8rem;
      color: var(--color-text-muted);
      margin-top: 0.25rem;
      font-style: italic;
    }`,
  };
}

// ── Team Section ──
export function teamSection(content, photos) {
  const heading = esc(content?.team?.heading || 'Nuestro Equipo');
  const members = content?.team?.members || [];

  if (!members.length) return { html: '', css: '' };

  // Look for team/staff/equipo photos
  const teamPhotos = [
    ...getPhotosForSection(photos, 'team'),
    ...getPhotosForSection(photos, 'staff'),
    ...getPhotosForSection(photos, 'equipo'),
  ];

  return {
    html: `
    <section id="team" class="section">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Equipo</span>
          <h2>${heading}</h2>
        </div>
        <div class="grid grid--3 reveal">
          ${members.map((m, i) => {
            const photo = teamPhotos[i] || null;
            return `
          <div class="card card--bordered team-card stagger-${i + 1}">
            ${photo ? `
            <div class="team-card__photo img-rounded aspect-1">
              <img src="${esc(photo)}" alt="${esc(m.name)}" class="img-cover">
            </div>` : ''}
            <h3 class="team-card__name">${esc(m.name)}</h3>
            ${m.title ? `<p class="team-card__title">${esc(m.title)}</p>` : ''}
            ${m.bio ? `<p class="team-card__bio">${esc(m.bio)}</p>` : ''}
          </div>`;
          }).join('')}
        </div>
      </div>
    </section>`,
    css: `
    .team-card {
      text-align: center;
    }

    .team-card__photo {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      overflow: hidden;
      margin: 0 auto 1.25rem;
    }

    .team-card__name {
      margin-bottom: 0.25rem;
    }

    .team-card__title {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--color-accent);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.75rem;
    }

    .team-card__bio {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      line-height: 1.7;
    }`,
  };
}
