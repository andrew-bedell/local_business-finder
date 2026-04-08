// Design Engine V2 — Selection logic
// Deterministic variation selection, mood mapping, and category detection

import { normalizeBusinessType } from './taxonomy.js';

const VARIATIONS = ['editorial', 'dynamic', 'minimal', 'immersive'];

const MOOD_MAP = {
  restaurant: 'warm',
  cafe: 'warm',
  bakery: 'warm',
  bar: 'warm',
  salon: 'luxury',
  'nail-salon': 'luxury',
  spa: 'luxury',
  barber: 'artisan',
  gym: 'modern',
  doctor: 'clean',
  dentist: 'clean',
  veterinarian: 'clean',
  physiotherapist: 'clean',
  lawyer: 'professional',
  accountant: 'professional',
  'real-estate': 'professional',
  insurance: 'professional',
  plumber: 'artisan',
  electrician: 'artisan',
  contractor: 'artisan',
  'auto-repair': 'artisan',
  hotel: 'luxury',
  retail: 'modern',
  furniture: 'artisan',
  travel: 'warm',
};

/**
 * Deterministic hash of a string → positive integer
 */
export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Select layout variation using business type first, then deterministic hashing
 * Returns: 'editorial' | 'dynamic' | 'minimal' | 'immersive'
 */
export function selectVariation({ businessName, category, subcategory, content, photoManifest }) {
  const businessType = normalizeBusinessType(category, subcategory);
  const photoCount = (photoManifest || []).filter((item) => item && item.url).length;
  const hasRichMenu = !!(content?.menuHighlights?.categories?.length || content?.dailySpecials?.items?.length);
  const hasPortfolio = !!(content?.designGallery || content?.gallery);

  let allowed = VARIATIONS;

  switch (businessType) {
    case 'restaurant':
    case 'cafe':
    case 'bakery':
    case 'bar':
      allowed = hasRichMenu || photoCount >= 6 ? ['immersive', 'editorial'] : ['editorial', 'minimal'];
      break;
    case 'salon':
    case 'nail-salon':
    case 'spa':
    case 'barber':
      allowed = hasPortfolio || photoCount >= 8 ? ['immersive', 'editorial'] : ['editorial', 'minimal'];
      break;
    case 'doctor':
    case 'dentist':
    case 'veterinarian':
    case 'physiotherapist':
      allowed = ['minimal', 'editorial'];
      break;
    case 'plumber':
    case 'electrician':
    case 'contractor':
    case 'auto-repair':
    case 'gym':
      allowed = ['dynamic', 'editorial'];
      break;
    case 'lawyer':
    case 'accountant':
    case 'insurance':
    case 'real-estate':
      allowed = ['editorial', 'minimal'];
      break;
    default:
      allowed = VARIATIONS;
  }

  return allowed[hashString(`${businessType}:${businessName || 'default'}`) % allowed.length];
}

/**
 * Select design mood from category + subcategory + tone recommendation
 * Returns: 'luxury' | 'professional' | 'warm' | 'modern' | 'clean' | 'artisan'
 */
export function selectMood(category, subcategory, toneRecommendation) {
  const businessType = normalizeBusinessType(category, subcategory);

  if (MOOD_MAP[businessType]) {
    return MOOD_MAP[businessType];
  }

  // Try to infer from tone recommendation keywords
  if (toneRecommendation) {
    const tone = (typeof toneRecommendation === 'string'
      ? toneRecommendation
      : toneRecommendation.overallTone || ''
    ).toLowerCase();

    if (tone.includes('luxur') || tone.includes('elegant') || tone.includes('refin')) return 'luxury';
    if (tone.includes('profes') || tone.includes('trust') || tone.includes('author')) return 'professional';
    if (tone.includes('warm') || tone.includes('invit') || tone.includes('cozy') || tone.includes('friendly')) return 'warm';
    if (tone.includes('modern') || tone.includes('bold') || tone.includes('energ')) return 'modern';
    if (tone.includes('clean') || tone.includes('clinic') || tone.includes('calm')) return 'clean';
    if (tone.includes('artisan') || tone.includes('craft') || tone.includes('rustic')) return 'artisan';
  }

  return 'professional';
}
