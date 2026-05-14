// Design Engine V2 — Universal section renderers
// Used by all business types: hero, about, services, whyChooseUs, testimonials, gallery, CTA, hours, contact, footer

import {
  buildWhatsAppHref,
  getOfferConfig,
  getNavigationItems,
  getPrimaryActionLabel,
  getStickyWhatsappLabel,
  normalizeBusinessType,
} from '../taxonomy.js';
import { buildResponsiveImageTag, getOptimizedBackgroundUrl } from '../image-helpers.js';
import { formatBusinessName } from '../../format-business-name.js';

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function starsHTML(count) {
  const n = Math.round(Number(count) || 5);
  return '<span class="stars">' + '★'.repeat(n) + '</span>';
}

function getPhotoForSection(photos, sectionName) {
  if (!photos || !photos.length) return null;
  const match = photos.find((photo) => photo.section && photo.section.toLowerCase().includes(sectionName.toLowerCase()));
  return match ? match.url : null;
}

function getPhotoRecordForSection(photos, sectionName) {
  if (!photos || !photos.length) return null;
  return photos.find((photo) => photo.section && photo.section.toLowerCase().includes(sectionName.toLowerCase())) || null;
}

function getPhotosForSection(photos, sectionName) {
  if (!photos || !photos.length) return [];
  return photos
    .filter((photo) => photo.section && photo.section.toLowerCase().includes(sectionName.toLowerCase()))
    .map((photo) => photo.url)
    .filter(Boolean);
}

function getAllPhotos(photos) {
  if (!photos || !photos.length) return [];
  return photos.map((photo) => photo.url).filter(Boolean);
}

function matchesBusinessKeyword(business, keywords) {
  const haystack = [
    business?.name,
    business?.category,
    business?.subcategory,
  ].join(' ').toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

function buildLaundryFallbackHero() {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#dff4ff"/>
        <stop offset="50%" stop-color="#b9ebd3"/>
        <stop offset="100%" stop-color="#f2fbff"/>
      </linearGradient>
      <linearGradient id="washer" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#e8f4ef"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#bg)"/>
    <circle cx="1350" cy="170" r="110" fill="rgba(255,255,255,0.55)"/>
    <circle cx="1210" cy="280" r="46" fill="rgba(255,255,255,0.72)"/>
    <circle cx="1420" cy="330" r="26" fill="rgba(255,255,255,0.8)"/>
    <circle cx="260" cy="180" r="92" fill="rgba(255,255,255,0.5)"/>
    <circle cx="190" cy="300" r="36" fill="rgba(255,255,255,0.72)"/>
    <rect x="520" y="165" rx="44" ry="44" width="560" height="560" fill="url(#washer)" stroke="#d0e6dc" stroke-width="8"/>
    <circle cx="800" cy="445" r="180" fill="#8dd7c1" opacity="0.35"/>
    <circle cx="800" cy="445" r="142" fill="#ffffff" stroke="#9fd9c8" stroke-width="10"/>
    <path d="M705 445c34-42 71-55 103-55 44 0 90 24 131 76 25 31 44 46 68 53-19 33-57 62-105 74-74 20-166-9-197-64z" fill="#7bc7f2" opacity="0.85"/>
    <path d="M742 413c22 28 46 42 77 42 31 0 63-15 96-45 10 49-12 98-60 123-60 31-144 11-177-44-13-20-18-47-13-76 24 8 49 8 77 0z" fill="#5ab79b" opacity="0.88"/>
    <circle cx="675" cy="330" r="20" fill="#ffffff" opacity="0.82"/>
    <circle cx="940" cy="308" r="16" fill="#ffffff" opacity="0.7"/>
    <circle cx="980" cy="610" r="18" fill="#ffffff" opacity="0.7"/>
    <circle cx="640" cy="598" r="12" fill="#ffffff" opacity="0.85"/>
    <rect x="610" y="205" width="88" height="18" rx="9" fill="#cde5da"/>
    <circle cx="970" cy="214" r="12" fill="#8dd7c1"/>
    <circle cx="1008" cy="214" r="12" fill="#a9d8fb"/>
    <path d="M1160 700c55-74 102-115 142-123 37-7 68 6 96 39-10 36-28 67-53 93-32 34-67 53-109 56-26 2-52-3-76-15z" fill="#ffffff" opacity="0.6"/>
    <path d="M255 700c70-17 118-14 145 10 26 23 37 58 34 106-36 13-74 15-114 6-52-12-93-39-123-80-18-25-32-52-42-82 36-6 69-6 100 0z" fill="#ffffff" opacity="0.5"/>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getFallbackHeroPhoto(business) {
  if (matchesBusinessKeyword(business, ['laundry', 'lavander', 'tintorer', 'dry clean'])) {
    return buildLaundryFallbackHero();
  }
  return '';
}

function collapseWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sanitizeBackgroundPosition(value) {
  const match = String(value || '').trim().match(/^(\d{1,3})%\s+(\d{1,3})%$/);
  if (!match) return 'center center';
  const x = Math.min(100, Math.max(0, Number(match[1])));
  const y = Math.min(100, Math.max(0, Number(match[2])));
  return `${x}% ${y}%`;
}

function splitTitleParts(value) {
  return collapseWhitespace(value)
    .split(/\s+[—–-]\s+|\s+\|\s+|\s*:\s*/)
    .map((part) => collapseWhitespace(part))
    .filter(Boolean);
}

function deriveNavBrandName(business, content) {
  const explicitBrand = formatBusinessName(collapseWhitespace(content?.brand?.shortName || content?.brandName));
  if (explicitBrand) return explicitBrand;

  const name = formatBusinessName(collapseWhitespace(business?.name));
  const metaParts = splitTitleParts(content?.meta?.title);
  if (metaParts.length > 0) {
    const candidate = formatBusinessName(metaParts[0]);
    if (candidate.length >= 3 && candidate.length <= 32) {
      return candidate;
    }
  }

  const nameParts = splitTitleParts(name);
  if (nameParts.length > 0) {
    const candidate = formatBusinessName(nameParts[0]);
    if (candidate.length >= 3 && candidate.length <= 32) {
      return candidate;
    }
  }

  return name;
}

function compactNavCTALabel(label) {
  const fullLabel = collapseWhitespace(label);
  if (!fullLabel) return '';

  let compact = fullLabel
    .replace(/\s+en\s+l[ií]nea\b/ig, '')
    .replace(/\s+por\s+tel[eé]fono\b/ig, '')
    .replace(/\s+ahora\b/ig, '');
  compact = collapseWhitespace(compact);

  if (!compact) compact = fullLabel;
  if (compact.length <= 18) return compact;

  const words = compact.split(' ').filter(Boolean);
  if (words.length <= 2) return compact;
  return words.slice(0, 2).join(' ');
}

function formatStoredPrice(item) {
  if (!item || item.price === null || item.price === undefined || item.price === '') return '';
  return `${item.currency || '$'}${item.price}`;
}

function mergeCommercialItems({ mode, content, business, photos }) {
  const aiItems = mode === 'products'
    ? (content?.products?.items || [])
    : (content?.services?.items || []);
  const businessItems = mode === 'products'
    ? ((business?.products && business.products.length > 0) ? business.products : (business?.services || []))
    : (business?.services || []);
  const sectionPhotos = mode === 'products'
    ? Array.from(new Set(
      getPhotosForSection(photos, 'products')
        .concat(getPhotosForSection(photos, 'product'))
        .concat(getPhotosForSection(photos, 'services'))
        .concat(getPhotosForSection(photos, 'gallery'))
    ))
    : getPhotosForSection(photos, 'services');
  const mergedItems = [];
  const seenNames = new Set();

  businessItems.forEach((item, index) => {
    const normalized = String(item?.name || '').toLowerCase().trim();
    if (!normalized || seenNames.has(normalized)) return;
    seenNames.add(normalized);
    mergedItems.push({
      name: item.name,
      description: item.description || '',
      price: formatStoredPrice(item),
      photoUrl: item.photo_url || sectionPhotos[index] || '',
    });
  });

  aiItems.forEach((item, index) => {
    const normalized = String(item?.name || '').toLowerCase().trim();
    if (!normalized || seenNames.has(normalized)) return;
    const isDuplicate = Array.from(seenNames).some((name) => (
      name === normalized || name.includes(normalized) || normalized.includes(name)
    ));
    if (isDuplicate) return;
    seenNames.add(normalized);
    mergedItems.push({
      name: item.name,
      description: item.description || '',
      price: item.price || item.priceRange || '',
      photoUrl: sectionPhotos[index] || '',
    });
  });

  return mergedItems;
}

// ── Hero Section ──
export function heroSection(content, photos, business, pageContext = {}) {
  const heroPhotoRecord =
    getPhotoRecordForSection(photos, 'hero') ||
    getPhotoRecordForSection(photos, 'gallery') ||
    getPhotoRecordForSection(photos, 'services') ||
    getPhotoRecordForSection(photos, 'products') ||
    (photos && photos[0] ? photos[0] : null);
  const heroPhoto =
    heroPhotoRecord?.url ||
    getFallbackHeroPhoto(business);
  const headline = esc(content?.hero?.headline || business.name);
  const subheadline = esc(content?.hero?.subheadline || '');
  const language = pageContext.language || business?.language || 'es';
  const businessType = pageContext.businessType || normalizeBusinessType(business?.category, business?.subcategory);
  const offer = pageContext.offer || getOfferConfig(businessType, new Set(), language);
  const cta = content?.cta?.buttonText || pageContext.primaryActionLabel || getPrimaryActionLabel(businessType, language);
  const whatsappHref = pageContext.whatsappHref || buildWhatsAppHref(business, { businessType, language });
  const primaryHref = whatsappHref || '#contact';
  const primaryAttrs = whatsappHref ? ' target="_blank" rel="noopener"' : '';
  const localDesign = pageContext.localDesign || {};
  const optimizedHeroPhoto = getOptimizedBackgroundUrl(heroPhoto, localDesign.enabled ? 'latamHero' : 'hero');
  const desktopPosition = sanitizeBackgroundPosition(heroPhotoRecord?.desktopPosition || heroPhotoRecord?.objectPosition || heroPhotoRecord?.heroSuitability?.desktopPosition);
  const mobilePosition = sanitizeBackgroundPosition(heroPhotoRecord?.mobilePosition || heroPhotoRecord?.heroSuitability?.mobilePosition || desktopPosition);
  const heroOverlay = localDesign.enabled
    ? 'linear-gradient(90deg, rgba(18,18,16,0.9) 0%, rgba(18,18,16,0.58) 48%, rgba(18,18,16,0.74) 100%)'
    : 'linear-gradient(to bottom, rgba(26,23,20,0.3), rgba(26,23,20,0.7))';
  const bgStyle = optimizedHeroPhoto
    ? (localDesign.enabled
      ? `--hero-bg-position-desktop:${esc(desktopPosition)};--hero-bg-position-mobile:${esc(mobilePosition)};--hero-bg-position:var(--hero-bg-position-desktop);background-image:${heroOverlay}, url('${esc(optimizedHeroPhoto)}');background-size:cover;background-repeat:no-repeat;background-position:var(--hero-bg-position);`
      : `background: ${heroOverlay}, url('${esc(optimizedHeroPhoto)}') ${esc(desktopPosition)}/cover no-repeat;`)
    : `background: linear-gradient(135deg, var(--color-dark) 0%, rgba(26,23,20,0.9) 100%);`;

  if (localDesign.enabled) {
    const localHero = localDesign.hero || {};
    const heroHeadline = esc(localHero.headline || content?.hero?.headline || business.name);
    const eyebrow = esc(localHero.eyebrow || business.category || '');
    const chips = localHero.chips || [];
    const actions = localHero.actions || [];
    const panelItems = [
      business.whatsapp || business.phone ? { label: 'WhatsApp', value: business.whatsapp || business.phone } : null,
      localDesign.location ? { label: 'Ubicación', value: localDesign.location } : null,
      (content?.hours?.formatted || business?.hours || []).length ? { label: 'Horario', value: 'Horario disponible' } : null,
      business.rating ? { label: 'Reseñas', value: `${business.rating} estrellas` } : null,
    ].filter(Boolean).slice(0, localDesign.isInstitutional ? 4 : 3);

    const actionClass = (kind) => {
      if (kind === 'primary') return 'btn btn--primary';
      if (kind === 'ghost') return 'btn btn--ghost-light';
      return 'btn btn--white';
    };
    const panelActionLabel = localDesign.isUrgent
      ? 'Atención inmediata'
      : (actions.find((action) => action.kind === 'primary')?.label || 'Escríbenos por WhatsApp');

    return {
      html: `
    <section class="hero latam-hero latam-hero--density-${localDesign.density}" style="${bgStyle}">
      <div class="container latam-hero__grid">
        <div class="latam-hero__content hero-animate">
          <span class="eyebrow">${eyebrow}</span>
          <h1>${heroHeadline}</h1>
          ${subheadline ? `<p class="hero__sub">${subheadline}</p>` : ''}
          <div class="latam-hero__actions">
            ${actions.map((action) => `<a href="${esc(action.href)}" class="${actionClass(action.kind)}"${action.external ? ' target="_blank" rel="noopener"' : ''}>${esc(action.label)}</a>`).join('\n            ')}
          </div>
          <div class="latam-trust-chips" aria-label="Datos de confianza">
            ${chips.map((chip) => `<span>${esc(chip)}</span>`).join('\n            ')}
          </div>
        </div>
        <aside class="latam-hero__panel hero-animate" aria-label="Información rápida">
          <div class="latam-panel__label">${localDesign.isInstitutional ? 'Accesos rápidos' : 'Información útil'}</div>
          ${panelItems.map((item) => `
          <div class="latam-panel__item">
            <span>${esc(item.label)}</span>
            <strong>${esc(item.value)}</strong>
          </div>`).join('')}
          ${whatsappHref ? `<a href="${whatsappHref}" target="_blank" rel="noopener" class="latam-panel__whatsapp">${esc(panelActionLabel)}</a>` : ''}
        </aside>
      </div>
    </section>`,
      css: `
    .latam-hero {
      min-height: clamp(540px, 66vh, 680px);
      align-items: center;
      padding-top: 6.7rem;
      padding-bottom: 4.5rem;
      overflow: hidden;
      background-position: center center;
    }

    .latam-hero::after {
      content: '';
      position: absolute;
      inset: auto 0 0 0;
      height: 26%;
      background: linear-gradient(to top, rgba(0,0,0,0.38), transparent);
      pointer-events: none;
    }

    .latam-hero--density-5 {
      min-height: clamp(520px, 62vh, 640px);
    }

    .latam-hero__grid {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.62fr);
      gap: clamp(1.5rem, 4vw, 4rem);
      align-items: center;
      width: 100%;
    }

    .latam-hero__content {
      max-width: 760px;
    }

    .latam-hero__content h1 {
      font-size: clamp(2.3rem, 4.1vw, 4rem);
      color: #fff;
      margin: 0.45rem 0 0.9rem;
      max-width: 820px;
    }

    .latam-hero--density-5 .latam-hero__content h1 {
      font-size: clamp(2.15rem, 3.6vw, 3.55rem);
    }

    .latam-hero .hero__sub {
      color: rgba(255,255,255,0.9);
      text-shadow: 0 1px 18px rgba(0,0,0,0.28);
      max-width: 660px;
      margin-bottom: 0;
      line-height: 1.55;
    }

    .latam-hero__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin: 1.15rem 0 0.95rem;
    }

    .latam-hero__actions .btn {
      border-radius: 999px;
      letter-spacing: 0.08em;
      padding: 0.9rem 1.35rem;
    }

    .latam-trust-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
      max-width: 720px;
    }

    .latam-trust-chips span {
      display: inline-flex;
      align-items: center;
      min-height: 34px;
      padding: 0.35rem 0.8rem;
      border-radius: 999px;
      background: rgba(255,255,255,0.14);
      border: 1px solid rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.92);
      backdrop-filter: blur(10px);
      font-size: 0.82rem;
      font-weight: 500;
      line-height: 1.2;
    }

    .latam-hero__panel {
      background: rgba(255,255,255,0.92);
      color: var(--color-text);
      border: 1px solid rgba(255,255,255,0.34);
      border-radius: 16px;
      padding: 1.2rem;
      box-shadow: 0 24px 70px rgba(0,0,0,0.24);
      backdrop-filter: blur(18px);
      align-self: center;
    }

    .latam-panel__label {
      font-family: var(--font-body);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--color-accent);
      margin-bottom: 0.75rem;
    }

    .latam-panel__item {
      display: grid;
      gap: 0.15rem;
      padding: 0.8rem 0;
      border-top: 1px solid rgba(0,0,0,0.08);
    }

    .latam-panel__item span {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .latam-panel__item strong {
      font-family: var(--font-heading);
      font-size: 1.05rem;
      line-height: 1.25;
    }

    .latam-panel__whatsapp {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 0.85rem;
      padding: 0.85rem 1rem;
      border-radius: 999px;
      background: var(--color-accent);
      color: var(--color-on-accent);
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    @media (max-width: 900px) {
      .latam-hero {
        --hero-bg-position: var(--hero-bg-position-mobile);
        min-height: auto;
        padding: 7rem 0 2rem;
      }
      .latam-hero__grid {
        grid-template-columns: 1fr;
        align-items: start;
      }
      .latam-hero__content {
        padding-bottom: 0;
      }
      .latam-hero__panel {
        border-radius: 12px;
      }
      .latam-hero__actions .btn {
        width: 100%;
        justify-content: center;
      }
    }`,
    };
  }

  return {
    html: `
    <section class="hero" style="${bgStyle}">
      <div class="hero__content container">
        <span class="eyebrow hero-animate">${esc(business.category || '')}</span>
        <h1 class="hero-animate">${headline}</h1>
        ${subheadline ? `<p class="hero__sub hero-animate">${subheadline}</p>` : ''}
        <div class="hero__actions hero-animate">
          <a href="${offer.targetHref}" class="btn btn--ghost-light">${esc(offer.actionLabel)} <span class="btn-arrow">→</span></a>
          <a href="${primaryHref}" class="btn btn--primary"${primaryAttrs}>${esc(cta)} <span class="btn-arrow">→</span></a>
        </div>
      </div>
      <div class="scroll-indicator">↓</div>
    </section>`,
    css: `
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: flex-end;
      position: relative;
      color: var(--color-text-light);
    }

    .hero__content {
      padding-bottom: 6rem;
      max-width: 800px;
    }

    .hero__content h1 {
      color: #fff;
      margin: 0.5rem 0 1.5rem;
    }

    .hero__sub {
      font-size: clamp(1rem, 1.8vw, 1.25rem);
      font-weight: 300;
      color: rgba(255,255,255,0.85);
      max-width: 600px;
      margin-bottom: 2rem;
      line-height: 1.7;
    }

    .hero__actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    @media (max-width: 900px) {
      .hero { min-height: 85vh; }
      .hero__content { padding-bottom: 4rem; }
    }`,
  };
}

// ── About Section ──
export function aboutSection(content, photos, business) {
  const aboutPhoto = getPhotoForSection(photos, 'about') || getPhotoForSection(photos, 'sobre');
  const heading = esc(content?.about?.heading || 'Sobre Nosotros');
  const paragraphs = content?.about?.paragraphs || [];

  const founderName = business?.founderName || '';
  const founderDesc = business?.founderDescription || '';
  const founderPhoto = getPhotoForSection(photos, 'founder');
  const hasFounder = founderName || founderDesc;

  return {
    html: `
    <section id="about" class="section">
      <div class="container split">
        <div class="reveal">
          <div class="section-header">
            <span class="eyebrow">Nuestra historia</span>
            <h2>${heading}</h2>
          </div>
          ${paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('\n          ')}
        </div>
        ${aboutPhoto ? `
        <div class="reveal-right img-rounded aspect-4-3">
          ${buildResponsiveImageTag({ url: aboutPhoto, alt: heading, preset: 'section', sizes: '(max-width: 900px) 100vw, 48vw', className: 'img-cover' })}
        </div>` : ''}
      </div>
      ${hasFounder ? `
      <div class="container founder-block reveal" style="margin-top:3rem;">
        ${founderPhoto ? `
        <div class="founder-block__photo">
          ${buildResponsiveImageTag({ url: founderPhoto, alt: founderName, preset: 'avatar', sizes: '120px', className: 'img-cover' })}
        </div>` : ''}
        <div class="founder-block__text">
          ${founderName ? `<h3>${esc(founderName)}</h3>` : ''}
          ${founderDesc ? `<p style="color:var(--color-text-muted);line-height:1.7">${esc(founderDesc)}</p>` : ''}
        </div>
      </div>` : ''}
    </section>`,
    css: hasFounder ? `
    .founder-block {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(0,0,0,0.06);
    }
    .founder-block__photo {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
    }
    .founder-block__photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    @media (max-width: 768px) {
      .founder-block { flex-direction: column; text-align: center; }
    }` : '',
  };
}

// ── Services / Products Fallback Section ──
export function servicesSection(content, photos, business) {
  const language = business?.language || 'es';
  const businessType = normalizeBusinessType(business?.category, business?.subcategory);
  const offer = getOfferConfig(businessType, new Set(['services']), language);
  const headingSource = offer.mode === 'products'
    ? (content?.products?.heading || content?.services?.heading)
    : content?.services?.heading;
  const heading = esc(headingSource || offer.sectionHeading);
  const mergedItems = mergeCommercialItems({ mode: offer.mode, content, business, photos });

  if (!mergedItems.length) return { html: '', css: '' };

  return {
    html: `
    <section id="services" class="section section--alt">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">${esc(offer.eyebrow)}</span>
          <h2>${heading}</h2>
        </div>
        <div class="service-grid reveal">
          ${mergedItems.map((item) => `
          <div class="service-grid__item">
            ${item.photoUrl ? `<div class="service-grid__photo">${buildResponsiveImageTag({ url: item.photoUrl, alt: item.name, preset: 'card', sizes: '(max-width: 768px) 100vw, 33vw', className: 'img-cover' })}</div>` : ''}
            <h3>${esc(item.name)}</h3>
            <p>${esc(item.description)}</p>
            ${item.price ? `<p style="margin-top:0.75rem;color:var(--color-accent);font-family:var(--font-heading);font-size:1.05rem">${esc(item.price)}</p>` : ''}
          </div>`).join('')}
        </div>
      </div>
    </section>`,
    css: `
    .service-grid__photo {
      width: 100%;
      height: 180px;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 1rem;
    }
    .service-grid__photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }`,
  };
}

// ── Why Choose Us Section ──
export function whyChooseUsSection(content) {
  const heading = esc(content?.whyChooseUs?.heading || '¿Por qué elegirnos?');
  const points = content?.whyChooseUs?.points || [];

  return {
    html: `
    <section id="why" class="section">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">La diferencia</span>
          <h2>${heading}</h2>
        </div>
        <div class="grid grid--3 reveal">
          ${points.map((point, index) => `
          <div class="card card--bordered stagger-${index + 1}">
            <h3>${esc(point.title)}</h3>
            <div class="divider"></div>
            <p style="color:var(--color-text-muted)">${esc(point.description)}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>`,
    css: '',
  };
}

// ── Testimonials Section ──
export function testimonialsSection(content) {
  const heading = esc(content?.testimonials?.heading || 'Lo que dicen nuestros clientes');
  const reviews = content?.testimonials?.reviews || [];

  return {
    html: `
    <section id="testimonials" class="section section--dark">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Testimonios</span>
          <h2>${heading}</h2>
        </div>
        <div class="grid grid--${Math.min(reviews.length, 3)} reveal">
          ${reviews.map((review, index) => `
          <div class="card card--dark stagger-${index + 1}">
            ${starsHTML(review.stars)}
            <p class="quote">"${esc(review.quote)}"</p>
            <p class="quote-author">— ${esc(review.author)}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>`,
    css: '',
  };
}

// ── Gallery Section ──
export function gallerySection(content, photos) {
  const heading = esc(content?.gallery?.heading || 'Galería');
  const galleryPhotos = getPhotosForSection(photos, 'gallery') || [];
  const allPhotos = galleryPhotos.length >= 4 ? galleryPhotos : getAllPhotos(photos).slice(0, 8);

  if (allPhotos.length === 0) return { html: '', css: '' };

  return {
    html: `
    <section id="gallery" class="section section--alt">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Galería</span>
          <h2>${heading}</h2>
        </div>
      </div>
      <div class="h-scroll reveal" style="padding-left:3rem;">
        ${allPhotos.map((url, index) => `
        <div class="h-scroll__item">
          ${buildResponsiveImageTag({ url, alt: `Foto ${index + 1}`, preset: 'gallery', sizes: '(max-width: 768px) 82vw, 36vw' })}
        </div>`).join('')}
      </div>
    </section>`,
    css: '',
  };
}

// ── Local LATAM Quick Actions ──
export function localQuickActionsSection(content, business, pageContext = {}) {
  const localDesign = pageContext.localDesign || {};
  const cards = localDesign.quickCards || [];
  if (!localDesign.enabled || cards.length === 0) return { html: '', css: '' };

  return {
    html: `
    <section id="acciones" class="latam-quick-actions">
      <div class="container">
        <div class="latam-quick-actions__grid reveal">
          ${cards.map((card) => `
          <a href="${esc(card.href)}" class="latam-action-card"${/^https?:\/\//.test(card.href) ? ' target="_blank" rel="noopener"' : ''}>
            <span>${esc(card.detail || 'Acceso rápido')}</span>
            <strong>${esc(card.label)}</strong>
          </a>`).join('')}
        </div>
      </div>
    </section>`,
    css: `
    .latam-quick-actions {
      position: relative;
      z-index: 2;
      margin-top: -3.4rem;
      padding: 0 0 2.1rem;
    }

    .latam-quick-actions__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.9rem;
    }

    .latam-action-card {
      min-height: 104px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      border-radius: 10px;
      background: var(--color-bg);
      color: var(--color-text);
      border: 1px solid rgba(0,0,0,0.08);
      box-shadow: 0 12px 34px rgba(0,0,0,0.08);
      transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    }

    .latam-action-card:hover {
      transform: translateY(-3px);
      border-color: rgba(var(--color-accent-rgb), 0.45);
      box-shadow: 0 18px 42px rgba(0,0,0,0.12);
      opacity: 1;
    }

    .latam-action-card span {
      color: var(--color-text-muted);
      font-size: 0.78rem;
      line-height: 1.35;
      font-weight: 500;
    }

    .latam-action-card strong {
      font-family: var(--font-heading);
      font-size: 1.05rem;
      line-height: 1.2;
      color: var(--color-text);
    }

    @media (max-width: 900px) {
      .latam-quick-actions {
        margin-top: 0;
        padding-top: 0.8rem;
      }
      .latam-quick-actions__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .latam-action-card {
        min-height: 98px;
      }
    }`,
  };
}

// ── CTA Section ──
export function ctaSection(content, business, pageContext = {}) {
  const language = pageContext.language || business?.language || 'es';
  const businessType = pageContext.businessType || normalizeBusinessType(business?.category, business?.subcategory);
  const whatsappHref = pageContext.whatsappHref || buildWhatsAppHref(business, { businessType, language });
  const heading = esc(content?.cta?.heading || (language === 'en' ? 'Ready to message us?' : '¿Listo para escribirnos?'));
  const btnText = esc(content?.cta?.buttonText || pageContext.primaryActionLabel || getPrimaryActionLabel(businessType, language));
  const supporting = esc(content?.cta?.supportingText || '');
  const contactValue = esc(business.whatsapp || business.phone || '');
  const buttonHref = whatsappHref || '#contact';
  const buttonAttrs = whatsappHref ? ' target="_blank" rel="noopener"' : '';

  return {
    html: `
    <section id="cta-section" class="section section--accent" style="text-align:center;">
      <div class="container reveal">
        <h2>${heading}</h2>
        <p style="max-width:600px;margin:1.5rem auto 2rem;color:rgba(255,255,255,0.9)">${supporting}</p>
        <a href="${buttonHref}" class="btn btn--white"${buttonAttrs}>${btnText} <span class="btn-arrow">→</span></a>
        ${contactValue ? `<p style="margin-top:1.5rem;font-size:1.1rem;"><a href="${buttonHref}"${buttonAttrs} style="color:#fff;font-family:var(--font-heading);font-weight:400">${contactValue}</a></p>` : ''}
      </div>
    </section>`,
    css: '',
  };
}

// ── Hours Section ──
export function hoursSection(content) {
  const heading = esc(content?.hours?.heading || 'Horario');
  const formatted = content?.hours?.formatted || [];

  if (!formatted.length) return { html: '', css: '' };

  return {
    html: `
    <section id="hours" class="section">
      <div class="container" style="max-width:600px;">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Horario</span>
          <h2>${heading}</h2>
        </div>
        <div class="reveal">
          ${formatted.map((line) => `<p style="text-align:center;padding:0.4rem 0;color:var(--color-text-muted);border-bottom:1px solid rgba(0,0,0,0.04)">${esc(line)}</p>`).join('\n          ')}
        </div>
      </div>
    </section>`,
    css: '',
  };
}

// ── Contact Section ──
export function contactSection(content, business, photos, pageContext = {}) {
  const language = pageContext.language || business?.language || 'es';
  const businessType = pageContext.businessType || normalizeBusinessType(business?.category, business?.subcategory);
  const heading = esc(content?.contact?.heading || 'Contacto');
  const phone = esc(content?.contact?.phone || business.phone || '');
  const whatsapp = esc(business.whatsapp || '');
  const whatsappHref = pageContext.whatsappHref || buildWhatsAppHref(business, { businessType, language });
  const quickActionLabel = esc(getStickyWhatsappLabel(language));
  const address = esc(content?.contact?.address || business.address || '');
  const directionsText = esc(content?.contact?.directionsText || 'Cómo llegar');
  const mapsUrl = esc(business.mapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(address)}`);
  const contactPhoto = getPhotoForSection(photos, 'contact') || getPhotoForSection(photos, 'ubicaci');
  const showPhone = phone && (!whatsapp || whatsapp !== phone);

  return {
    html: `
    <section id="contact" class="section section--alt">
      <div class="container split">
        <div class="reveal">
          <div class="section-header">
            <span class="eyebrow">Encuéntranos</span>
            <h2>${heading}</h2>
          </div>
          ${whatsappHref ? `<p style="margin-bottom:1rem"><strong>WhatsApp:</strong><br><a href="${whatsappHref}" target="_blank" rel="noopener" style="font-family:var(--font-heading);font-size:1.2rem">${whatsapp || quickActionLabel}</a></p>` : ''}
          ${showPhone ? `<p style="margin-bottom:1rem"><strong>Teléfono:</strong><br><a href="tel:${phone.replace(/\s/g, '')}" style="font-family:var(--font-heading);font-size:1.2rem">${phone}</a></p>` : ''}
          ${address ? `<p style="margin-bottom:1rem;color:var(--color-text-muted)">${address}</p>` : ''}
          <div style="display:flex;gap:0.85rem;flex-wrap:wrap;margin-top:0.5rem;">
            ${whatsappHref ? `<a href="${whatsappHref}" target="_blank" rel="noopener" class="btn btn--primary">${quickActionLabel} <span class="btn-arrow">→</span></a>` : ''}
            ${address ? `<a href="${mapsUrl}" target="_blank" class="btn btn--outline">${directionsText} <span class="btn-arrow">→</span></a>` : ''}
          </div>
        </div>
        ${contactPhoto ? `
        <div class="reveal-right img-rounded aspect-4-3">
          ${buildResponsiveImageTag({ url: contactPhoto, alt: 'Ubicación', preset: 'section', sizes: '(max-width: 900px) 100vw, 48vw', className: 'img-cover' })}
        </div>` : ''}
      </div>
    </section>`,
    css: '',
  };
}

// ── Footer Section ──
export function footerSection(content, business) {
  const tagline = esc(content?.footer?.tagline || business.name);
  const copyright = esc(content?.footer?.copyright || `© ${new Date().getFullYear()} ${business.name}. Todos los derechos reservados.`);
  const socials = business.socialProfiles || [];

  return {
    html: `
    <footer class="site-footer">
      <div class="site-footer__inner">
        <div class="site-footer__top">
          <div>
            <div class="site-footer__brand">${esc(business.name)}</div>
            <p class="site-footer__tagline">${tagline}</p>
          </div>
          ${socials.length ? `
          <div class="site-footer__social">
            ${socials.map((social) => `<a href="${esc(social.url)}" target="_blank" rel="noopener">${esc(social.platform)}</a>`).join('\n            ')}
          </div>` : ''}
        </div>
        <div class="site-footer__bottom">
          <p class="site-footer__copyright">${copyright}</p>
          <p class="site-footer__attribution">Diseñado por <a href="https://www.ahoratengopagina.com/about" target="_blank">AhoraTengoPagina.com</a></p>
        </div>
      </div>
    </footer>`,
    css: '',
  };
}

// ── Nav HTML (not a section, but generated here for convenience) ──
export function navHTML(business, ctaLabel, options = {}) {
  const language = options.language || business?.language || 'es';
  const businessType = options.businessType || normalizeBusinessType(business?.category, business?.subcategory);
  const availableSections = options.availableSections || new Set(['about', 'services', 'gallery', 'testimonials', 'contact']);
  const localDesign = options.localDesign || {};
  const navItems = localDesign.enabled && localDesign.navItems?.length
    ? localDesign.navItems
    : getNavigationItems(businessType, availableSections, language);
  const whatsappHref = options.whatsappHref || buildWhatsAppHref(business, { businessType, language });
  const cta = whatsappHref ? getStickyWhatsappLabel(language) : (language === 'en' ? 'Contact' : 'Contacto');
  const navBrand = localDesign.enabled
    ? (formatBusinessName(collapseWhitespace(business?.name)) || deriveNavBrandName(business, options.content))
    : deriveNavBrandName(business, options.content);
  const compactCTA = compactNavCTALabel(whatsappHref ? cta : (ctaLabel || cta));
  const ctaHref = whatsappHref || '#contact';
  const ctaAttrs = whatsappHref ? ' target="_blank" rel="noopener"' : '';
  const utilityItems = localDesign.enabled ? (localDesign.utilityItems || []) : [];
  const navClass = localDesign.enabled ? 'site-nav site-nav--local' : 'site-nav';

  return `
  ${utilityItems.length ? `
  <div class="local-utility-bar">
    <div class="local-utility-bar__inner">
      ${utilityItems.map((item) => item.href
        ? `<a href="${esc(item.href)}"${/^https?:\/\//.test(item.href) ? ' target="_blank" rel="noopener"' : ''}>${esc(item.label)}</a>`
        : `<span>${esc(item.label)}</span>`).join('\n      ')}
    </div>
  </div>` : ''}
  <nav class="${navClass}">
    <div class="site-nav__inner">
      <div class="site-nav__primary">
        <a href="#" class="site-nav__logo" title="${esc(business.name)}">${esc(navBrand || business.name)}</a>
        <ul class="site-nav__links">
          ${navItems.map((item) => `<li><a href="${item.href}">${esc(item.label)}</a></li>`).join('\n          ')}
        </ul>
      </div>
      <a href="${ctaHref}" class="site-nav__cta site-nav__cta--desktop"${ctaAttrs}>${esc(compactCTA || cta)}</a>
      <button class="hamburger" aria-label="Menú">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
  <div class="mobile-menu">
    ${navItems.map((item) => `<a href="${item.href}">${esc(item.label)}</a>`).join('\n    ')}
    <a href="${ctaHref}" class="mobile-cta"${ctaAttrs}>${esc(cta)}</a>
  </div>`;
}

export function stickyBottomActions(business, pageContext = {}) {
  const language = pageContext.language || business?.language || 'es';
  const businessType = pageContext.businessType || normalizeBusinessType(business?.category, business?.subcategory);
  const offer = pageContext.offer || getOfferConfig(businessType, new Set(), language);
  const localDesign = pageContext.localDesign || {};

  if (localDesign.enabled && localDesign.stickyActions?.length) {
    return `
  <div class="sticky-cta-spacer" aria-hidden="true"></div>
  <div class="sticky-cta-bar sticky-cta-bar--local" aria-label="Acciones rápidas">
    <div class="sticky-cta-bar__inner">
      ${localDesign.stickyActions.map((action, index) => `
      <a href="${esc(action.href)}" class="sticky-cta-btn ${index === 0 ? 'sticky-cta-btn--primary' : 'sticky-cta-btn--secondary'}"${action.external ? ' target="_blank" rel="noopener"' : ''}>${esc(action.label)}</a>`).join('')}
    </div>
  </div>`;
  }

  const whatsappHref = pageContext.whatsappHref || buildWhatsAppHref(business, { businessType, language });
  const primaryLabel = whatsappHref ? getStickyWhatsappLabel(language) : (language === 'en' ? 'Contact' : 'Contacto');
  const primaryHref = whatsappHref || '#contact';
  const primaryAttrs = whatsappHref ? ' target="_blank" rel="noopener"' : '';

  return `
  <div class="sticky-cta-spacer" aria-hidden="true"></div>
  <div class="sticky-cta-bar" aria-label="Quick actions">
    <div class="sticky-cta-bar__inner">
      <a href="${offer.targetHref}" class="sticky-cta-btn sticky-cta-btn--secondary">${esc(offer.actionLabel)}</a>
      <a href="${primaryHref}" class="sticky-cta-btn sticky-cta-btn--primary"${primaryAttrs}>${esc(primaryLabel)}</a>
    </div>
  </div>`;
}
