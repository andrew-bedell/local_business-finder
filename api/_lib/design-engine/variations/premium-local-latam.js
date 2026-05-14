// Design Engine V2 — Premium Local LATAM variation
// Dense local trust and action layout for Mexico/Colombia small businesses.

export function getVariationCSS() {
  return `
    .premium-local-latam .section {
      padding: 5rem 0;
    }

    .premium-local-latam .section-header {
      max-width: 760px;
      margin-bottom: 2.5rem;
    }

    .premium-local-latam .service-grid {
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }

    .premium-local-latam .service-grid__item {
      padding: 2rem;
    }

    .premium-local-latam .card {
      border-radius: 8px;
    }

    .premium-local-latam .grid--3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .premium-local-latam .section--dark {
      background:
        radial-gradient(circle at 10% 0%, rgba(var(--color-accent-rgb), 0.18), transparent 34rem),
        var(--color-dark);
    }

    .premium-local-latam .section--accent {
      background:
        linear-gradient(135deg, rgba(255,255,255,0.12), transparent),
        var(--color-accent);
    }

    @media (max-width: 900px) {
      .premium-local-latam .section {
        padding: 3.5rem 0;
      }
      .premium-local-latam .grid--3 {
        grid-template-columns: 1fr;
      }
    }
  `;
}

export function arrangeSections(sectionMap) {
  const order = [
    'hero',
    'localQuickActions',
    'menu', 'menuHighlights', 'products', 'nailServices', 'treatments', 'dentalServices',
    'autoServices', 'practiceAreas', 'memberships', 'services',
    'testimonials',
    'gallery',
    'whyChooseUs',
    'emergencyCTA', 'estimateCTA', 'coverageArea',
    'hours',
    'contact',
    'about',
    'credentials',
    'ambiance', 'designGallery', 'team', 'classSchedule', 'dailySpecials', 'insurance',
    'cta',
    'footer',
  ];

  const ordered = new Set(order);
  let html = '<div class="premium-local-latam">';
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
