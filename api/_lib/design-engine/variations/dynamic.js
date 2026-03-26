// Design Engine V2 — Dynamic variation
// Bold geometric shapes, marquee strips, strong accent color usage, card-based

export function getVariationCSS() {
  return `
    /* Dynamic: bold, energetic, card-focused */
    .dynamic .section-header {
      text-align: center;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }

    .dynamic .card {
      background: var(--color-bg-alt);
      border-radius: 0;
      border: none;
      position: relative;
      overflow: hidden;
    }

    .dynamic .card::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0;
      width: 100%; height: 4px;
      background: var(--color-accent);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.4s ease;
    }

    .dynamic .card:hover::after {
      transform: scaleX(1);
    }

    .dynamic .service-grid {
      background: var(--color-accent);
      gap: 2px;
    }

    .dynamic .service-grid__item {
      background: var(--color-bg);
    }

    .dynamic .hero__content {
      text-align: center;
      max-width: 900px;
      margin: 0 auto;
    }

    .dynamic .hero__content .eyebrow {
      display: inline-block;
    }

    .dynamic .hero__actions {
      justify-content: center;
    }

    .dynamic .split {
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }

    .dynamic .split > *:first-child {
      padding: 3rem;
    }

    @media (max-width: 900px) {
      .dynamic .split {
        grid-template-columns: 1fr;
        gap: 0;
      }
      .dynamic .split > *:first-child {
        padding: 2rem 0;
      }
    }
  `;
}

/**
 * Arrange sections with marquee strip between key sections
 */
export function arrangeSections(sectionMap, content, business) {
  // Build a marquee strip from services
  const serviceNames = (content?.services?.items || []).map(s => s.name).filter(Boolean);
  const marqueeItems = serviceNames.length >= 3
    ? serviceNames
    : [business.category || 'Servicios', 'Calidad', 'Experiencia', 'Profesionalismo'];

  const marqueeHTML = `
    <div class="marquee-strip">
      <div class="marquee-strip__inner">
        ${marqueeItems.concat(marqueeItems).map(s => `<span>${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`).join(' · ')}
      </div>
    </div>`;

  const order = [
    'hero',
    '_marquee',
    'about',
    'services',
    // Category-specific primary sections
    'menu', 'menuHighlights', 'nailServices', 'treatments', 'dentalServices',
    'autoServices', 'practiceAreas', 'memberships', 'credentials',
    // Category-specific secondary sections
    'ambiance', 'designGallery', 'team', 'classSchedule', 'dailySpecials',
    'insurance', 'coverageArea',
    'whyChooseUs',
    'testimonials',
    'gallery',
    // Category-specific CTA sections
    'emergencyCTA', 'estimateCTA',
    'hours',
    'cta',
    'contact',
    'footer',
  ];

  const ordered = new Set(order);
  let html = '<div class="dynamic">';
  for (const key of order) {
    if (key === '_marquee') {
      html += marqueeHTML;
    } else if (key === 'footer') {
      for (const k of Object.keys(sectionMap)) {
        if (!ordered.has(k) && sectionMap[k]?.html) html += sectionMap[k].html;
      }
      if (sectionMap.footer?.html) html += sectionMap.footer.html;
    } else if (sectionMap[key]?.html) {
      html += sectionMap[key].html;
    }
  }
  html += '</div>';
  return html;
}
