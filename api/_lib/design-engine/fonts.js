// Design Engine V2 — Font pairings
// Serif heading + sans-serif body for each mood, loaded from Google Fonts

const FONT_PAIRINGS = {
  luxury: {
    heading: 'Cormorant Garamond',
    headingWeights: '300;400;500',
    body: 'DM Sans',
    bodyWeights: '300;400;500',
    heroWeight: 300,
  },
  professional: {
    heading: 'Playfair Display',
    headingWeights: '400;500;700',
    body: 'Source Sans 3',
    bodyWeights: '300;400;600',
    heroWeight: 300,
  },
  warm: {
    heading: 'Lora',
    headingWeights: '400;500;600',
    headingItalic: true,
    body: 'Nunito Sans',
    bodyWeights: '300;400;600',
    heroWeight: 400,
  },
  modern: {
    heading: 'Sora',
    headingWeights: '300;400;600',
    body: 'Outfit',
    bodyWeights: '300;400;500',
    heroWeight: 300,
  },
  clean: {
    heading: 'Fraunces',
    headingWeights: '300;400;500',
    body: 'Inter Tight',
    bodyWeights: '300;400;500',
    heroWeight: 300,
  },
  artisan: {
    heading: 'Libre Baskerville',
    headingWeights: '400;700',
    headingItalic: true,
    body: 'Work Sans',
    bodyWeights: '300;400;500',
    heroWeight: 400,
  },
};

/**
 * Generate Google Fonts @import URL and CSS custom properties for the given mood
 * Returns { importRule: string, css: string }
 */
export function getFontCSS(mood) {
  const pairing = FONT_PAIRINGS[mood] || FONT_PAIRINGS.professional;

  const headingParam = `family=${encodeURIComponent(pairing.heading)}:${pairing.headingItalic ? 'ital,' : ''}wght@${pairing.headingItalic ? '0,' : ''}${pairing.headingWeights.replace(/;/g, pairing.headingItalic ? ';1,' : ';')}${pairing.headingItalic ? ';1,400' : ''}`;
  const bodyParam = `family=${encodeURIComponent(pairing.body)}:wght@${pairing.bodyWeights}`;

  // Simplified import — let Google Fonts handle the details
  const importRule = `@import url('https://fonts.googleapis.com/css2?${headingParam}&${bodyParam}&display=swap');`;

  const css = `
    --font-heading: '${pairing.heading}', Georgia, serif;
    --font-body: '${pairing.body}', -apple-system, sans-serif;
    --hero-weight: ${pairing.heroWeight};`;

  return { importRule, css };
}
