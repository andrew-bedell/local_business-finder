// Design Engine V2 — Selection logic
// Deterministic variation selection, mood mapping, and category detection

const VARIATIONS = ['editorial', 'dynamic', 'minimal', 'immersive'];

const MOOD_MAP = {
  // Food & Drink
  'Restaurant': 'warm',
  'Cafe': 'warm',
  'Bakery': 'warm',
  'Bar': 'warm',
  // Beauty & Personal Care
  'Salon': 'luxury',
  'Nail Salon': 'luxury',
  'Spa': 'luxury',
  'Beauty Salon': 'luxury',
  // Health & Fitness
  'Gym': 'modern',
  'Doctor': 'clean',
  'Dentist': 'clean',
  'Pharmacy': 'clean',
  'Veterinarian': 'clean',
  'Physiotherapist': 'clean',
  // Professional Services
  'Lawyer': 'professional',
  'Accountant': 'professional',
  'Real Estate': 'professional',
  'Insurance': 'professional',
  // Home Services & Trades
  'Plumber': 'artisan',
  'Electrician': 'artisan',
  'Painter': 'artisan',
  'Contractor': 'artisan',
  'Locksmith': 'artisan',
  'Roofing': 'artisan',
  'Moving': 'modern',
  // Automotive
  'Auto Repair': 'artisan',
  'Car Wash': 'modern',
  'Car Dealer': 'luxury',
  // Retail
  'Clothing': 'modern',
  'Jewelry': 'luxury',
  'Florist': 'warm',
  'Pet Store': 'warm',
  'Furniture': 'artisan',
  'Hardware': 'artisan',
  // Hospitality
  'Hotel': 'luxury',
  // Other
  'Laundry': 'clean',
  'Storage': 'modern',
  'Travel': 'warm',
};

// Subcategory overrides (more specific than category)
const SUBCATEGORY_MOOD = {
  'Nail Salon': 'luxury',
  'Hair Salon': 'luxury',
  'Beauty Salon': 'luxury',
  'Barber': 'artisan',
  'Mexican Cuisine': 'warm',
  'Coffee Shop': 'warm',
  'CrossFit': 'modern',
  'Yoga': 'clean',
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
 * Select layout variation by business name hash
 * Returns: 'editorial' | 'dynamic' | 'minimal' | 'immersive'
 */
export function selectVariation(businessName) {
  return VARIATIONS[hashString(businessName || 'default') % VARIATIONS.length];
}

/**
 * Select design mood from category + subcategory + tone recommendation
 * Returns: 'luxury' | 'professional' | 'warm' | 'modern' | 'clean' | 'artisan'
 */
export function selectMood(category, subcategory, toneRecommendation) {
  // Subcategory takes priority
  if (subcategory && SUBCATEGORY_MOOD[subcategory]) {
    return SUBCATEGORY_MOOD[subcategory];
  }

  // Category mapping
  if (category && MOOD_MAP[category]) {
    return MOOD_MAP[category];
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
