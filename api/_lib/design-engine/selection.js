// Design Engine V2 — Selection logic
// Deterministic variation selection, mood mapping, and category detection

import { getOfferMode, normalizeBusinessType } from './taxonomy.js';

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

const PROFILE_VARIATIONS = {
  'menu-rich': ['immersive', 'editorial', 'dynamic'],
  'menu-compact': ['editorial', 'minimal'],
  'catalog-visual': ['editorial', 'dynamic', 'immersive'],
  'catalog-clean': ['editorial', 'minimal'],
  'luxury-portfolio': ['immersive', 'editorial'],
  'service-polished': ['editorial', 'minimal', 'dynamic'],
  'trust-conversion': ['minimal', 'editorial'],
  'trust-editorial': ['editorial', 'minimal'],
  'urgent-visual': ['dynamic', 'editorial', 'immersive'],
  'urgent-conversion': ['dynamic', 'editorial'],
  'membership-driven': ['dynamic', 'immersive', 'editorial'],
  showcase: ['immersive', 'editorial', 'dynamic'],
  conversion: ['editorial', 'dynamic', 'minimal'],
  balanced: VARIATIONS,
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

function countOfferItems(content) {
  const serviceItems = content?.services?.items?.length || 0;
  const productItems = content?.products?.items?.length || 0;
  const menuItems = (content?.menuHighlights?.categories || [])
    .reduce((total, category) => total + ((category?.items || []).length), 0);
  const treatments = (content?.treatments?.categories || [])
    .reduce((total, category) => total + ((category?.items || []).length), 0);
  const dental = content?.dentalServices?.items?.length || 0;
  const practiceAreas = content?.practiceAreas?.areas?.length || 0;
  const membershipTiers = content?.memberships?.tiers?.length || 0;
  const autoServices = content?.autoServices?.items?.length || 0;

  return serviceItems + productItems + menuItems + treatments + dental + practiceAreas + membershipTiers + autoServices;
}

function countPricingSignals(content) {
  const servicePrices = (content?.services?.items || []).filter((item) => item?.price).length;
  const productPrices = (content?.products?.items || []).filter((item) => item?.price || item?.priceRange).length;
  const menuPrices = (content?.menuHighlights?.categories || [])
    .reduce((total, category) => total + ((category?.items || []).filter((item) => item?.price).length), 0);
  const treatmentPrices = (content?.treatments?.categories || [])
    .reduce((total, category) => total + ((category?.items || []).filter((item) => item?.priceRange).length), 0);
  const membershipPrices = (content?.memberships?.tiers || []).filter((tier) => tier?.price).length;

  return servicePrices + productPrices + menuPrices + treatmentPrices + membershipPrices;
}

function selectTemplateProfile({ businessType, offerMode, photoCount, content }) {
  const hasRichMenu = !!(content?.menuHighlights?.categories?.length || content?.dailySpecials?.items?.length);
  const hasPortfolio = !!(content?.designGallery?.heading);
  const offerItemCount = countOfferItems(content);
  const pricingSignals = countPricingSignals(content);
  const hasDeepPhotoSet = photoCount >= 8;
  const hasStrongOffer = offerItemCount >= 6;

  if (offerMode === 'menu') {
    return hasRichMenu || hasDeepPhotoSet ? 'menu-rich' : 'menu-compact';
  }

  if (businessType === 'retail' || businessType === 'furniture') {
    return hasDeepPhotoSet || hasStrongOffer ? 'catalog-visual' : 'catalog-clean';
  }

  if (['salon', 'nail-salon', 'spa', 'barber'].includes(businessType)) {
    return hasPortfolio || hasDeepPhotoSet ? 'luxury-portfolio' : 'service-polished';
  }

  if (['doctor', 'dentist', 'veterinarian', 'physiotherapist', 'lawyer', 'accountant', 'insurance', 'real-estate'].includes(businessType)) {
    return pricingSignals > 0 || hasStrongOffer ? 'trust-conversion' : 'trust-editorial';
  }

  if (businessType === 'gym') {
    return pricingSignals > 0 || content?.memberships?.tiers?.length ? 'membership-driven' : 'service-polished';
  }

  if (['plumber', 'electrician', 'contractor', 'auto-repair'].includes(businessType)) {
    return hasDeepPhotoSet ? 'urgent-visual' : 'urgent-conversion';
  }

  if (hasDeepPhotoSet) return 'showcase';
  if (pricingSignals > 0 || hasStrongOffer) return 'conversion';
  return 'balanced';
}

/**
 * Select layout variation using business type first, then deterministic hashing
 * Returns: 'editorial' | 'dynamic' | 'minimal' | 'immersive'
 */
export function selectVariation({ businessName, category, subcategory, content, photoManifest }) {
  const businessType = normalizeBusinessType(category, subcategory);
  const offerMode = getOfferMode(businessType);
  const photoCount = (photoManifest || []).filter((item) => item && item.url).length;
  const profile = selectTemplateProfile({ businessType, offerMode, photoCount, content });
  const allowed = PROFILE_VARIATIONS[profile] || VARIATIONS;

  return allowed[hashString(`${profile}:${businessType}:${businessName || 'default'}`) % allowed.length];
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
