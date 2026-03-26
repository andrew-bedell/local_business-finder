// Design Engine V2 — Editorial variation
// Asymmetric grids, left-aligned hero, photography-forward, minimal color

export function getVariationCSS() {
  return `
    /* Editorial: asymmetric layouts, narrow text columns */
    .editorial .section-header { max-width: 680px; }

    .editorial .split {
      grid-template-columns: 1.2fr 0.8fr;
    }

    .editorial .split--reverse {
      grid-template-columns: 0.8fr 1.2fr;
    }

    .editorial .service-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .editorial .grid--3 {
      grid-template-columns: 1fr 1fr 1fr;
    }

    .editorial .card {
      border-left: 3px solid var(--color-accent);
      padding-left: 2rem;
      border-radius: 0;
    }

    .editorial .hero__content {
      max-width: 700px;
    }

    @media (max-width: 900px) {
      .editorial .split,
      .editorial .split--reverse {
        grid-template-columns: 1fr;
      }
      .editorial .service-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
}

/**
 * Arrange sections in the Editorial layout order
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
  let html = '<div class="editorial">';
  for (const key of order) {
    if (key === 'footer') {
      // Insert any unknown extra sections before footer
      for (const k of Object.keys(sectionMap)) {
        if (!ordered.has(k) && sectionMap[k]?.html) html += sectionMap[k].html;
      }
    }
    if (sectionMap[key]?.html) html += sectionMap[key].html;
  }
  html += '</div>';
  return html;
}
