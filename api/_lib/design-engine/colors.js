// Design Engine V2 — Color system
// Category-specific accent defaults, palette validation, CSS custom property generation

import { normalizeBusinessType } from './taxonomy.js';

const CATEGORY_ACCENTS = {
  restaurant: { accent: '#C25B3A', accentLight: '#D4765C' },
  cafe: { accent: '#8B6F47', accentLight: '#A68B64' },
  bakery: { accent: '#D4956A', accentLight: '#E2B08E' },
  bar: { accent: '#1B3A4B', accentLight: '#2E5A6E' },
  salon: { accent: '#B08D7A', accentLight: '#C4A696' },
  'nail-salon': { accent: '#C5A572', accentLight: '#D4BA8A' },
  spa: { accent: '#7A9E8E', accentLight: '#95B5A6' },
  barber: { accent: '#8B7355', accentLight: '#A6906F' },
  gym: { accent: '#E63E21', accentLight: '#F06449' },
  dentist: { accent: '#4A90A4', accentLight: '#6AABB8' },
  doctor: { accent: '#2E6B8A', accentLight: '#4A8DAD' },
  veterinarian: { accent: '#5E8B5E', accentLight: '#7AA67A' },
  physiotherapist: { accent: '#4A90A4', accentLight: '#6AABB8' },
  lawyer: { accent: '#2C3E50', accentLight: '#3D5A73' },
  accountant: { accent: '#2C3E50', accentLight: '#3D5A73' },
  'real-estate': { accent: '#1A5632', accentLight: '#2D7A4D' },
  insurance: { accent: '#2E6B8A', accentLight: '#4A8DAD' },
  plumber: { accent: '#D97B2B', accentLight: '#E8954F' },
  electrician: { accent: '#D97B2B', accentLight: '#E8954F' },
  contractor: { accent: '#8B4513', accentLight: '#A0522D' },
  'auto-repair': { accent: '#3A3A3A', accentLight: '#5A5A5A' },
  hotel: { accent: '#8B7355', accentLight: '#A6906F' },
  furniture: { accent: '#8B7355', accentLight: '#A6906F' },
  retail: { accent: '#2C3E50', accentLight: '#3D5A73' },
  travel: { accent: '#2E6B8A', accentLight: '#4A8DAD' },
};

const DEFAULT_ACCENT = { accent: '#2C3E50', accentLight: '#3D5A73' };

// Warm-black and cream defaults
const WARM_BLACK = '#1A1714';
const CREAM = '#F7F3EE';

/**
 * Parse hex to RGB
 */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

/**
 * Check if a color is too close to pure black or pure white
 */
function isTooExtreme(hex) {
  if (!hex || typeof hex !== 'string') return true;
  const { r, g, b } = hexToRgb(hex);
  const luminance = (r + g + b) / 3;
  return luminance < 15 || luminance > 248;
}

/**
 * Lighten a hex color by a percentage (0-1)
 */
function lighten(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

/**
 * Generate CSS custom properties for the color palette
 */
export function getColorCSS(designPalette, category, subcategory) {
  const businessType = normalizeBusinessType(category, subcategory);
  const catDefaults = CATEGORY_ACCENTS[businessType] || DEFAULT_ACCENT;

  // Use AI-recommended colors if valid, fall back to category defaults
  let primary = designPalette?.primaryColor;
  let secondary = designPalette?.secondaryColor;
  let accent = designPalette?.accentColor;

  if (!primary || isTooExtreme(primary)) primary = catDefaults.accent;
  if (!accent || isTooExtreme(accent)) accent = catDefaults.accent;
  if (!secondary || isTooExtreme(secondary)) secondary = lighten(primary, 0.85);

  const accentLight = catDefaults.accentLight || lighten(accent, 0.3);
  const bgAlt = lighten(secondary, 0.4);

  const { r, g, b } = hexToRgb(accent);

  return `
    --color-primary: ${primary};
    --color-secondary: ${secondary};
    --color-accent: ${accent};
    --color-accent-light: ${accentLight};
    --color-accent-rgb: ${r}, ${g}, ${b};
    --color-bg: ${CREAM};
    --color-bg-alt: ${bgAlt};
    --color-dark: ${WARM_BLACK};
    --color-text: #2D2A26;
    --color-text-light: ${CREAM};
    --color-text-muted: #8A857D;`;
}
