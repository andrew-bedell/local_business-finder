// Design Engine V2 — Color system
// Category-specific accent defaults, palette validation, CSS custom property generation

const CATEGORY_ACCENTS = {
  'Restaurant': { accent: '#C25B3A', accentLight: '#D4765C' },
  'Cafe': { accent: '#8B6F47', accentLight: '#A68B64' },
  'Bakery': { accent: '#D4956A', accentLight: '#E2B08E' },
  'Bar': { accent: '#1B3A4B', accentLight: '#2E5A6E' },
  'Salon': { accent: '#B08D7A', accentLight: '#C4A696' },
  'Beauty Salon': { accent: '#B08D7A', accentLight: '#C4A696' },
  'Nail Salon': { accent: '#C5A572', accentLight: '#D4BA8A' },
  'Spa': { accent: '#7A9E8E', accentLight: '#95B5A6' },
  'Gym': { accent: '#E63E21', accentLight: '#F06449' },
  'Dentist': { accent: '#4A90A4', accentLight: '#6AABB8' },
  'Doctor': { accent: '#2E6B8A', accentLight: '#4A8DAD' },
  'Veterinarian': { accent: '#5E8B5E', accentLight: '#7AA67A' },
  'Lawyer': { accent: '#2C3E50', accentLight: '#3D5A73' },
  'Accountant': { accent: '#2C3E50', accentLight: '#3D5A73' },
  'Real Estate': { accent: '#1A5632', accentLight: '#2D7A4D' },
  'Insurance': { accent: '#2E6B8A', accentLight: '#4A8DAD' },
  'Plumber': { accent: '#D97B2B', accentLight: '#E8954F' },
  'Electrician': { accent: '#D97B2B', accentLight: '#E8954F' },
  'Auto Repair': { accent: '#3A3A3A', accentLight: '#5A5A5A' },
  'Car Wash': { accent: '#2E6B8A', accentLight: '#4A8DAD' },
  'Hotel': { accent: '#8B7355', accentLight: '#A6906F' },
  'Florist': { accent: '#C17B8E', accentLight: '#D49AAB' },
  'Jewelry': { accent: '#B8860B', accentLight: '#D4A82A' },
  'Locksmith': { accent: '#2C3E50', accentLight: '#3D5A73' },
  'Painter': { accent: '#8B7355', accentLight: '#A6906F' },
  'Clothing': { accent: '#2C3E50', accentLight: '#3D5A73' },
  'Pet Store': { accent: '#5E8B5E', accentLight: '#7AA67A' },
  'Furniture': { accent: '#8B7355', accentLight: '#A6906F' },
  'Hardware': { accent: '#D97B2B', accentLight: '#E8954F' },
  'Pharmacy': { accent: '#5E8B5E', accentLight: '#7AA67A' },
  'Physiotherapist': { accent: '#4A90A4', accentLight: '#6AABB8' },
  'Travel': { accent: '#2E6B8A', accentLight: '#4A8DAD' },
  'Laundry': { accent: '#4A90A4', accentLight: '#6AABB8' },
  'Moving': { accent: '#2E6B8A', accentLight: '#4A8DAD' },
  'Roofing': { accent: '#8B4513', accentLight: '#A0522D' },
  'Storage': { accent: '#D97B2B', accentLight: '#E8954F' },
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
  const catDefaults = CATEGORY_ACCENTS[subcategory] || CATEGORY_ACCENTS[category] || DEFAULT_ACCENT;

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
