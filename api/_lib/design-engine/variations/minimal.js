// Design Engine V2 — Minimal variation
// Maximum whitespace, very light borders, muted tones, elegant simplicity

export function getVariationCSS() {
  return `
    /* Minimal: clean, airy, restrained */
    .minimal .section { padding: 7rem 0; }

    .minimal .section-header {
      text-align: center;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .minimal h2 {
      font-weight: 300;
    }

    .minimal .card {
      background: transparent;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 0;
      text-align: center;
      padding: 3rem 2rem;
    }

    .minimal .card:hover {
      border-color: var(--color-accent);
    }

    .minimal .divider {
      margin: 1.5rem auto;
    }

    .minimal .service-grid {
      background: transparent;
      border: none;
      gap: 2rem;
    }

    .minimal .service-grid__item {
      text-align: center;
      background: transparent;
      border: 1px solid rgba(0,0,0,0.06);
      padding: 3rem 2rem;
    }

    .minimal .service-grid__item:hover {
      border-color: var(--color-accent);
      background: transparent;
    }

    .minimal .hero__content {
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
    }

    .minimal .hero__content .eyebrow {
      display: inline-block;
    }

    .minimal .hero__actions {
      justify-content: center;
    }

    .minimal .split {
      gap: 6rem;
    }

    .minimal .quote {
      text-align: center;
      max-width: 700px;
      margin: 0 auto;
    }

    .minimal .quote-author {
      text-align: center;
    }

    @media (max-width: 900px) {
      .minimal .section { padding: 4rem 0; }
      .minimal .split { gap: 2rem; }
    }
  `;
}

/**
 * Arrange sections in the Minimal layout — clean, centered flow
 */
export function arrangeSections(sectionMap) {
  const order = [
    'hero',
    'about',
    'services',
    // Category-specific primary sections
    'menu', 'menuHighlights', 'nailServices', 'treatments', 'dentalServices',
    'autoServices', 'practiceAreas', 'memberships', 'credentials',
    // Category-specific secondary sections
    'ambiance', 'designGallery', 'team', 'classSchedule', 'dailySpecials',
    'insurance', 'coverageArea',
    'testimonials',
    'whyChooseUs',
    'gallery',
    // Category-specific CTA sections
    'emergencyCTA', 'estimateCTA',
    'hours',
    'cta',
    'contact',
    'footer',
  ];

  const ordered = new Set(order);
  let html = '<div class="minimal">';
  for (const key of order) {
    if (key === 'footer') {
      for (const k of Object.keys(sectionMap)) {
        if (!ordered.has(k) && sectionMap[k]?.html) html += sectionMap[k].html;
      }
    }
    if (sectionMap[key]?.html) html += sectionMap[key].html;
  }
  html += '</div>';
  return html;
}
