// Design Engine V2 — Main Assembler
// Orchestrates variation selection, CSS composition, section rendering, and HTML output

import { selectVariation, selectMood } from './selection.js';
import { getFontCSS } from './fonts.js';
import { getColorCSS } from './colors.js';
import { getBaseCSS } from './css/base.js';
import { getAnimationCSS } from './css/animations.js';
import { getNavCSS } from './css/nav.js';
import { getFooterCSS } from './css/footer.js';
import { getResponsiveCSS } from './css/responsive.js';
import { getRuntimeJS } from './js-runtime.js';
import {
  normalizeBusinessType,
  getBusinessSchemaType,
} from './taxonomy.js';

import {
  heroSection, aboutSection, servicesSection, whyChooseUsSection,
  testimonialsSection, gallerySection, ctaSection, hoursSection,
  contactSection, footerSection, navHTML, whatsappFAB,
} from './sections/universal.js';

// Business-type section modules
import { menuSection, ambianceSection } from './sections/restaurant.js';
import { treatmentsSection as salonTreatmentsSection, teamSection } from './sections/beauty-salon.js';
import { nailServicesSection, designGallerySection } from './sections/nail-salon.js';
import { credentialsSection, insuranceSection as doctorInsuranceSection } from './sections/doctor.js';
import { dentalServicesSection, insuranceSection as dentistInsuranceSection } from './sections/dentist.js';
import { practiceAreasSection } from './sections/lawyer.js';
import { membershipTiersSection, classScheduleSection } from './sections/gym.js';
import { menuHighlightsSection as cafeMenuSection, dailySpecialsSection } from './sections/cafe.js';
import { autoServicesSection, estimateCTASection } from './sections/auto-repair.js';
import { emergencyCTASection, coverageAreaSection } from './sections/plumber.js';

import * as editorial from './variations/editorial.js';
import * as dynamic from './variations/dynamic.js';
import * as minimal from './variations/minimal.js';
import * as immersive from './variations/immersive.js';

const VARIATIONS = { editorial, dynamic, minimal, immersive };

// Map category keywords to section renderers
function getCategorySections(category, subcategory) {
  const businessType = normalizeBusinessType(category, subcategory);

  switch (businessType) {
    case 'restaurant':
      return { type: 'restaurant', sections: { menu: menuSection, ambiance: ambianceSection } };
    case 'nail-salon':
      return { type: 'nail-salon', sections: { nailServices: nailServicesSection, designGallery: designGallerySection } };
    case 'salon':
    case 'spa':
    case 'barber':
      return { type: 'beauty-salon', sections: { treatments: salonTreatmentsSection, team: teamSection } };
    case 'dentist':
      return { type: 'dentist', sections: { dentalServices: dentalServicesSection, insurance: dentistInsuranceSection } };
    case 'doctor':
    case 'veterinarian':
    case 'physiotherapist':
      return { type: 'doctor', sections: { credentials: credentialsSection, insurance: doctorInsuranceSection } };
    case 'lawyer':
      return { type: 'lawyer', sections: { practiceAreas: practiceAreasSection } };
    case 'gym':
      return { type: 'gym', sections: { memberships: membershipTiersSection, classSchedule: classScheduleSection } };
    case 'cafe':
    case 'bakery':
    case 'bar':
      return { type: 'cafe', sections: { menuHighlights: cafeMenuSection, dailySpecials: dailySpecialsSection } };
    case 'auto-repair':
      return { type: 'auto-repair', sections: { autoServices: autoServicesSection, estimateCTA: estimateCTASection } };
    case 'plumber':
    case 'electrician':
    case 'contractor':
      return { type: 'plumber', sections: { emergencyCTA: emergencyCTASection, coverageArea: coverageAreaSection } };
  }

  return { type: 'generic', sections: {} };
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Assemble a complete website HTML string from content, report, photos, and business data.
 *
 * @param {object} params
 * @param {object} params.content - Output from write-content.js
 * @param {object} params.researchReport - Output from research-report.js (needs designPalette)
 * @param {Array} params.photoManifest - Array of { section, slot, url }
 * @param {object} params.business - { name, category, subcategory, phone, whatsapp, address, mapsUrl, socialProfiles, language, menuItems, staffMembers }
 * @returns {string} Complete HTML document
 */
export function assembleWebsite({ content, researchReport, photoManifest, business }) {
  const lang = business.language === 'en' ? 'en' : 'es';
  const report = researchReport || {};
  const photos = photoManifest || [];
  const businessType = normalizeBusinessType(business.category, business.subcategory);

  // 1. Select variation and mood
  const variationName = selectVariation({
    businessName: business.name,
    category: business.category,
    subcategory: business.subcategory,
    content,
    photoManifest: photos,
  });
  const mood = selectMood(
    business.category,
    business.subcategory,
    report.toneRecommendations || report.designPalette?.mood
  );

  // 2. Generate font and color CSS
  const { importRule, css: fontVars } = getFontCSS(mood);
  const colorVars = getColorCSS(report.designPalette, business.category, business.subcategory);

  // 3. Get variation module
  const variation = VARIATIONS[variationName] || VARIATIONS.editorial;

  // 4. Render all universal sections
  const sectionMap = {};

  sectionMap.hero = heroSection(content, photos, business, content?.cta?.buttonText);
  sectionMap.about = aboutSection(content, photos, business);
  sectionMap.services = servicesSection(content, photos, business);
  sectionMap.whyChooseUs = whyChooseUsSection(content);
  sectionMap.testimonials = testimonialsSection(content);
  sectionMap.gallery = gallerySection(content, photos);
  sectionMap.cta = ctaSection(content, business);
  sectionMap.hours = hoursSection(content);
  sectionMap.contact = contactSection(content, business, photos);
  sectionMap.footer = footerSection(content, business);

  // 4b. Render business-type-specific sections
  const { sections: categorySections } = getCategorySections(business.category, business.subcategory);
  for (const [key, renderFn] of Object.entries(categorySections)) {
    const result = renderFn(content, photos, business);
    if (result && result.html) {
      sectionMap[key] = result;
    }
  }

  // 5. Collect section-specific CSS
  const sectionCSS = Object.values(sectionMap)
    .map(s => s.css || '')
    .filter(Boolean)
    .join('\n');

  // 6. Arrange sections using the variation layout
  const bodyHTML = variation.arrangeSections(sectionMap, content, business);
  const availableSections = new Set(
    Object.entries(sectionMap)
      .filter(([, section]) => section && section.html)
      .map(([key]) => key)
  );

  // 7. Generate nav and WhatsApp FAB
  const nav = navHTML(business, content?.cta?.buttonText, {
    businessType,
    availableSections,
    content,
  });
  const fab = whatsappFAB(business);

  // 8. Compose meta tags
  const metaTitle = esc(content?.meta?.title || `${business.name} — ${business.category || ''}`);
  const metaDesc = esc(content?.meta?.description || '');
  const metaKeywords = esc(content?.meta?.keywords || '');
  const schema = buildLocalBusinessSchema({ business, content, businessType });

  // 9. Assemble final HTML
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metaTitle}</title>
  <meta name="description" content="${metaDesc}">
  ${metaKeywords ? `<meta name="keywords" content="${metaKeywords}">` : ''}
  <meta property="og:title" content="${metaTitle}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:type" content="website">
  ${business.name ? `<meta property="og:site_name" content="${esc(business.name)}">` : ''}
  ${schema ? `<script type="application/ld+json">${schema}</script>` : ''}
  <style>
    ${importRule}
    :root {
      ${fontVars}
      ${colorVars}
    }
    ${getBaseCSS()}
    ${getNavCSS()}
    ${getAnimationCSS()}
    ${getFooterCSS()}
    ${sectionCSS}
    ${variation.getVariationCSS()}
    ${getResponsiveCSS()}
  </style>
</head>
<body>
  ${nav}
  <main>
    ${bodyHTML}
  </main>
  ${fab}
  <script>${getRuntimeJS()}</script>
</body>
</html>`;
}

function buildLocalBusinessSchema({ business, content, businessType }) {
  if (!business?.name) return '';

  const schema = {
    '@context': 'https://schema.org',
    '@type': getBusinessSchemaType(businessType),
    name: business.name,
    description: content?.meta?.description || undefined,
    telephone: business.phone || undefined,
    address: business.address || undefined,
    image: undefined,
    sameAs: (business.socialProfiles || [])
      .map((profile) => profile.url || profile.profile_url)
      .filter(Boolean),
    openingHours: Array.isArray(content?.hours?.formatted) && content.hours.formatted.length
      ? content.hours.formatted
      : undefined,
  };

  return JSON.stringify(schema, null, 0)
    .replace(/</g, '\\u003c');
}
