// Design Engine V2 — Immersive variation
// Full-width dark sections alternating with light, dramatic transitions, split-screen layouts

export function getVariationCSS() {
  return `
    /* Immersive: dramatic dark/light alternation, full-bleed */
    .immersive .section:nth-child(even) {
      background: var(--color-dark);
      color: var(--color-text-light);
    }

    .immersive .section:nth-child(even) h2,
    .immersive .section:nth-child(even) h3 {
      color: var(--color-text-light);
    }

    .immersive .section:nth-child(even) p {
      color: rgba(247,243,238,0.75);
    }

    .immersive .section:nth-child(even) .eyebrow {
      color: var(--color-accent-light);
    }

    .immersive .section:nth-child(even) .card {
      background: rgba(255,255,255,0.05);
      border-color: rgba(255,255,255,0.08);
    }

    .immersive .section:nth-child(even) .service-grid {
      background: rgba(255,255,255,0.1);
    }

    .immersive .section:nth-child(even) .service-grid__item {
      background: var(--color-dark);
    }

    .immersive .section-header {
      text-align: center;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }

    .immersive .hero {
      min-height: 100vh;
    }

    .immersive .hero__content {
      text-align: center;
      max-width: 900px;
      margin: 0 auto;
      padding-bottom: 8rem;
    }

    .immersive .hero__content .eyebrow {
      display: inline-block;
    }

    .immersive .hero__actions {
      justify-content: center;
    }

    .immersive .split {
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }

    .immersive .split > div:first-child {
      padding: 4rem 3rem;
    }

    .immersive .split .img-rounded {
      border-radius: 0;
    }

    .immersive .card {
      border-radius: 0;
    }

    .immersive .h-scroll__item {
      border-radius: 0;
    }

    @media (max-width: 900px) {
      .immersive .split {
        grid-template-columns: 1fr;
      }
      .immersive .split > div:first-child {
        padding: 2rem 0;
      }
      .immersive .hero__content {
        padding-bottom: 5rem;
      }
    }
  `;
}

/**
 * Arrange sections for Immersive — alternating dark/light, testimonials as full-width quote
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
  let html = '<div class="immersive">';
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
