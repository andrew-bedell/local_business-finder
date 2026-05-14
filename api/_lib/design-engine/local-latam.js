import {
  buildWhatsAppHref,
  getOfferConfig,
  getPrimaryActionLabel,
  normalizeBusinessType,
} from './taxonomy.js';

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

function escAttr(value) {
  return String(value || '').replace(/"/g, '&quot;');
}

function normalizeCountry(value) {
  const country = lower(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (country === 'mx' || country.includes('mexico')) return 'MX';
  if (country === 'co' || country.includes('colombia')) return 'CO';
  return String(value || '').trim().toUpperCase();
}

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function firstAvailable(...values) {
  return values.map(compact).find(Boolean) || '';
}

function hasAny(value, words) {
  const text = lower(Array.isArray(value) ? value.join(' ') : value);
  return words.some((word) => text.includes(word));
}

function isUrgentBusiness(business, businessType = '') {
  const type = businessType || normalizeBusinessType(business?.category, business?.subcategory);
  const combined = `${business?.category || ''} ${business?.subcategory || ''} ${(business?.types || []).join(' ')}`;
  return ['plumber', 'electrician', 'contractor', 'auto-repair'].includes(type) ||
    hasAny(combined, ['urgencia', 'emergency', '24/7', 'cerraj', 'grua', 'grúa']);
}

function getCountryCode(business) {
  return normalizeCountry(
    business?.addressCountry ||
    business?.address_country ||
    business?.country ||
    business?.address ||
    ''
  );
}

function getCityState(business) {
  const city = firstAvailable(business?.addressCity, business?.address_city, business?.city);
  const state = firstAvailable(business?.addressState, business?.address_state, business?.state);

  if (city || state) {
    return { city, state };
  }

  const address = compact(business?.address || business?.address_full);
  const parts = address.split(',').map(compact).filter(Boolean);
  if (parts.length >= 3) {
    const statePart = parts[parts.length - 2] || '';
    const cityMatch = statePart.match(/(?:\d{4,6}\s+)?([^,]+?)(?:\s+[A-Z]{2,}|$)/i);
    return {
      city: compact(cityMatch?.[1] || parts[parts.length - 3] || ''),
      state: compact(statePart.replace(/^\d{4,6}\s+/, '')),
    };
  }

  return { city: '', state: '' };
}

function getShortLocation(business) {
  const { city, state } = getCityState(business);
  if (city && state && !lower(state).includes(lower(city))) return `${city}, ${state}`;
  return city || state || compact(business?.address || '').split(',').slice(-2, -1)[0] || '';
}

function isPuebloLike(business) {
  const { city } = getCityState(business);
  const country = getCountryCode(business);
  const cityName = lower(city);
  if (!cityName) return false;

  const largeCities = country === 'CO'
    ? ['bogota', 'medellin', 'cali', 'barranquilla', 'cartagena', 'bucaramanga']
    : ['ciudad de mexico', 'cdmx', 'guadalajara', 'monterrey', 'puebla', 'queretaro', 'tijuana', 'leon', 'merida'];

  return !largeCities.some((largeCity) => cityName.includes(largeCity));
}

function hasPricing(content, business) {
  const servicePrices = (content?.services?.items || []).some((item) => item?.price || item?.priceRange);
  const productPrices = (content?.products?.items || []).some((item) => item?.price || item?.priceRange);
  const menuPrices = (content?.menuHighlights?.categories || [])
    .some((category) => (category?.items || []).some((item) => item?.price));
  const storedPrices = (business?.services || []).concat(business?.products || [])
    .some((item) => item?.price || item?.priceRange);
  return servicePrices || productPrices || menuPrices || storedPrices;
}

export function shouldUsePremiumLocalLatam(business) {
  const explicit = lower(business?.designMode || business?.design_mode || business?.theme);
  if (explicit === 'premium-local-latam') return true;
  if (explicit && explicit !== 'auto') return false;
  return ['MX', 'CO'].includes(getCountryCode(business));
}

export function getLocalTrustDensity(business, businessType = '') {
  if (!shouldUsePremiumLocalLatam(business)) return 0;

  const type = businessType || normalizeBusinessType(business?.category, business?.subcategory);
  const combined = `${business?.category || ''} ${business?.subcategory || ''} ${(business?.types || []).join(' ')}`;
  let density = 2;

  if (['doctor', 'dentist', 'veterinarian', 'physiotherapist'].includes(type) || hasAny(combined, ['clinic', 'clinica', 'hospital', 'school', 'colegio', 'institucion'])) {
    density = 5;
  } else if (isUrgentBusiness(business, type)) {
    density = 4;
  } else if (['salon', 'nail-salon', 'spa', 'barber', 'retail', 'furniture', 'gym'].includes(type)) {
    density = 3;
  }

  if (isPuebloLike(business) && density < 5) density += 1;
  return Math.min(5, Math.max(1, density));
}

function getCategoryPhrase(businessType, business) {
  const category = compact(business?.subcategory || business?.category);
  if (category && !['contractor', 'local business', 'negocio local'].includes(lower(category))) {
    return category;
  }

  switch (businessType) {
    case 'restaurant':
      return 'Restaurante';
    case 'bar':
      return 'Bar y restobar';
    case 'cafe':
    case 'bakery':
      return 'Café y panadería';
    case 'retail':
    case 'furniture':
      return 'Productos y atención local';
    case 'nail-salon':
      return 'Uñas y belleza';
    case 'salon':
    case 'spa':
    case 'barber':
      return 'Belleza y cuidado personal';
    case 'doctor':
    case 'dentist':
    case 'physiotherapist':
      return 'Atención médica';
    case 'plumber':
    case 'electrician':
    case 'contractor':
    case 'auto-repair':
      return 'Servicio local';
    default:
      return 'Negocio local';
  }
}

function localizeHeadline(headline, businessType, business) {
  const raw = compact(headline || business?.name);
  const location = getShortLocation(business);
  if (!location) return raw;

  const city = getCityState(business).city;
  const haystack = lower(raw);
  if ((city && haystack.includes(lower(city))) || haystack.includes(lower(location))) {
    return raw;
  }

  const phrase = getCategoryPhrase(businessType, business);
  if (!raw || raw.length > 74 || /soluciones|experiencias únicas|excelencia|transform/i.test(raw)) {
    return `${phrase} en ${location}`;
  }
  return `${raw} en ${location}`;
}

function getTelHref(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
}

function directionsHref(business) {
  const address = compact(business?.address || business?.address_full);
  return business?.mapsUrl || business?.maps_url || (address ? `https://www.google.com/maps/search/${encodeURIComponent(address)}` : '');
}

function addAction(actions, label, href, options = {}) {
  if (!href || actions.some((action) => action.href === href || action.label === label)) return;
  actions.push({
    label,
    href,
    kind: options.kind || 'secondary',
    external: options.external !== false && /^https?:\/\//.test(href),
  });
}

export function getPrimaryLocalCtas({ business, businessType, language = 'es', offer }) {
  const actions = [];
  const whatsappHref = buildWhatsAppHref(business, { businessType, language });
  const phone = firstAvailable(business?.phone);
  const telHref = getTelHref(phone);
  const mapsHref = directionsHref(business);
  const resolvedOffer = offer || getOfferConfig(businessType, new Set(['services']), language);

  if (['plumber', 'electrician', 'contractor', 'auto-repair'].includes(businessType)) {
    addAction(actions, 'Llamar ahora', telHref, { kind: 'primary', external: false });
    addAction(actions, 'WhatsApp', whatsappHref, { kind: actions.length ? 'secondary' : 'primary' });
    addAction(actions, 'Ver cobertura', '#coverage', { kind: 'ghost', external: false });
  } else if (['restaurant', 'cafe', 'bakery', 'bar'].includes(businessType)) {
    addAction(actions, businessType === 'bar' ? 'Reservar por WhatsApp' : 'Reservar', whatsappHref, { kind: 'primary' });
    addAction(actions, resolvedOffer.actionLabel || 'Ver menú', resolvedOffer.targetHref || '#menu', { kind: 'secondary', external: false });
    addAction(actions, 'Cómo llegar', mapsHref, { kind: 'ghost' });
  } else if (['doctor', 'dentist', 'veterinarian', 'physiotherapist', 'salon', 'nail-salon', 'spa', 'barber', 'gym'].includes(businessType)) {
    addAction(actions, businessType === 'nail-salon' ? 'Agenda por WhatsApp' : 'Agendar cita', whatsappHref, { kind: 'primary' });
    addAction(actions, resolvedOffer.actionLabel || 'Ver servicios', resolvedOffer.targetHref || '#services', { kind: 'secondary', external: false });
    addAction(actions, 'Cómo llegar', mapsHref, { kind: 'ghost' });
  } else if (['retail', 'furniture'].includes(businessType)) {
    addAction(actions, 'Consultar disponibilidad', whatsappHref, { kind: 'primary' });
    addAction(actions, resolvedOffer.actionLabel || 'Ver productos', resolvedOffer.targetHref || '#products', { kind: 'secondary', external: false });
    addAction(actions, 'Cómo llegar', mapsHref, { kind: 'ghost' });
  } else {
    addAction(actions, getPrimaryActionLabel(businessType, language), whatsappHref, { kind: 'primary' });
    addAction(actions, resolvedOffer.actionLabel || 'Ver servicios', resolvedOffer.targetHref || '#services', { kind: 'secondary', external: false });
    addAction(actions, 'Cómo llegar', mapsHref, { kind: 'ghost' });
  }

  if (!actions.length) addAction(actions, 'Contacto', '#contact', { kind: 'primary', external: false });
  return actions.slice(0, 3);
}

export function getTrustChips({ business, content, businessType }) {
  const chips = [];
  const rating = business?.rating || business?.googleRating;
  const reviewCount = business?.reviewCount || business?.review_count;
  const location = getShortLocation(business);
  const hours = content?.hours?.formatted || business?.hours || [];
  const payments = business?.paymentMethods || business?.payment_methods || [];
  const highlights = (business?.highlights || []).concat(business?.serviceOptions || business?.service_options || []);

  if (rating) chips.push(`${rating} estrellas`);
  else if ((content?.testimonials?.reviews || []).length) chips.push('Reseñas de clientes');

  if (reviewCount) chips.push(`${reviewCount} reseñas`);
  if (location) chips.push(location);
  if (hours.length) chips.push('Horario disponible');
  if (business?.whatsapp || business?.phone) chips.push('Atención por WhatsApp');
  if (hasAny(payments, ['transfer', 'transferencia'])) chips.push('Aceptamos transferencia');
  if (hasAny(highlights, ['delivery', 'domicilio'])) chips.push('Servicio a domicilio');
  if (hasAny(highlights, ['warranty', 'garantia', 'garantía'])) chips.push('Garantía disponible');
  if (['plumber', 'electrician', 'contractor', 'auto-repair'].includes(businessType)) chips.push('Técnicos locales');

  ['Atención local', 'Consulta disponibilidad', 'Ubicación visible'].forEach((fallback) => {
    if (chips.length < 4) chips.push(fallback);
  });

  return Array.from(new Set(chips)).slice(0, 6);
}

export function getQuickActionCards({ business, content, businessType, availableSections = new Set(), offer }) {
  const cards = [];
  const resolvedOffer = offer || getOfferConfig(businessType, availableSections, business?.language || 'es');
  const has = (key) => availableSections.has(key);
  const pricingLabel = hasPricing(content, business) ? 'Precios / Desde' : null;

  function card(label, href, detail) {
    if (!href || cards.some((item) => item.label === label || item.href === href)) return;
    cards.push({ label, href, detail });
  }

  if (['doctor', 'dentist', 'veterinarian', 'physiotherapist'].includes(businessType)) {
    card('Agenda tu cita', buildWhatsAppHref(business, { businessType }), 'Atención por WhatsApp');
    card(resolvedOffer.navLabel || 'Servicios', resolvedOffer.targetHref || '#services', 'Especialidades y servicios');
    if (has('credentials')) card('Directorio médico', '#credentials', 'Equipo y especialistas');
    card('Contacto', '#contact', 'Teléfono, dirección y horarios');
  } else if (['restaurant', 'cafe', 'bakery', 'bar'].includes(businessType)) {
    card(resolvedOffer.navLabel || 'Menú', resolvedOffer.targetHref || '#menu', 'Bebidas, comida y precios');
    card('Reservar', buildWhatsAppHref(business, { businessType }), 'Por WhatsApp');
    if (has('gallery')) card('Galería', '#gallery', 'Fotos reales');
    card('Ubicación', '#contact', getShortLocation(business) || 'Cómo llegar');
  } else {
    card(resolvedOffer.navLabel || 'Servicios', resolvedOffer.targetHref || '#services', pricingLabel || 'Opciones principales');
    if (pricingLabel) card(pricingLabel, resolvedOffer.targetHref || '#services', 'Consulta rangos disponibles');
    if (has('testimonials')) card('Reseñas', '#testimonials', 'Opiniones de clientes');
    if (has('gallery')) card('Galería', '#gallery', 'Fotos reales');
    card('Ubicación', '#contact', getShortLocation(business) || 'Cómo llegar');
  }

  return cards.slice(0, 5);
}

export function getLatamNavItems({ business, businessType, availableSections = new Set(), content, offer }) {
  const items = [];
  const resolvedOffer = offer || getOfferConfig(businessType, availableSections, business?.language || 'es');
  const has = (key) => availableSections.has(key);

  function add(href, label) {
    if (!href || items.some((item) => item.label === label)) return;
    items.push({ href, label });
  }

  if (['restaurant', 'cafe', 'bakery', 'bar'].includes(businessType)) {
    add(resolvedOffer.targetHref, resolvedOffer.navLabel || 'Menú');
    if (has('ambiance')) add('#ambiance', 'Ambiente');
    if (has('gallery')) add('#gallery', 'Galería');
    if (has('testimonials')) add('#testimonials', 'Reseñas');
    add('#contact', 'Ubicación');
  } else if (['doctor', 'dentist', 'veterinarian', 'physiotherapist'].includes(businessType)) {
    add(resolvedOffer.targetHref, 'Servicios');
    if (has('credentials')) add('#credentials', 'Especialistas');
    add(buildWhatsAppHref(business, { businessType }) || '#contact', 'Agenda tu cita');
    add('#contact', 'Contacto');
  } else if (['plumber', 'electrician', 'contractor', 'auto-repair'].includes(businessType)) {
    add(resolvedOffer.targetHref, 'Servicios');
    if (has('emergencyCTA')) add('#emergency', 'Urgencias');
    if (has('coverageArea')) add('#coverage', 'Cobertura');
    if (has('testimonials')) add('#testimonials', 'Reseñas');
    add('#contact', 'Contacto');
  } else {
    add(resolvedOffer.targetHref, resolvedOffer.navLabel || 'Servicios');
    if (hasPricing(content, business)) add(resolvedOffer.targetHref, 'Precios');
    if (has('gallery')) add('#gallery', 'Galería');
    if (has('testimonials')) add('#testimonials', 'Reseñas');
    add('#contact', 'Ubicación');
  }

  return items.slice(0, 6);
}

export function getStickyMobileActions({ business, businessType, offer, language = 'es' }) {
  const actions = getPrimaryLocalCtas({ business, businessType, language, offer });
  return actions.map((action) => ({
    ...action,
    label: action.label
      .replace('Consultar disponibilidad', 'WhatsApp')
      .replace('Reservar por WhatsApp', 'Reservar')
      .replace('Agenda por WhatsApp', 'Agendar')
      .replace('Cómo llegar', 'Mapa')
      .replace('Llamar ahora', 'Llamar'),
  })).slice(0, 3);
}

export function getLocalUtilityItems({ business, content, businessType }) {
  const items = [];
  const phone = firstAvailable(business?.whatsapp, business?.phone);
  const location = getShortLocation(business);
  const hours = content?.hours?.formatted || business?.hours || [];

  if (phone) items.push({ label: `WhatsApp: ${phone}`, href: buildWhatsAppHref(business, { businessType }) || getTelHref(phone) });
  if (location) items.push({ label: location });
  if (hours.length) items.push({ label: 'Horario disponible' });
  else items.push({ label: 'Consulta horarios' });
  if (business?.whatsapp || business?.phone) items.push({ label: 'Atención local' });

  return items.slice(0, 4);
}

export function getLocalHeroData({ business, content, businessType, language, offer, availableSections = new Set() }) {
  const location = getShortLocation(business);
  return {
    eyebrow: [getCategoryPhrase(businessType, business), location].filter(Boolean).join(' · '),
    headline: localizeHeadline(content?.hero?.headline, businessType, business),
    actions: getPrimaryLocalCtas({ business, businessType, language, offer }),
    chips: getTrustChips({ business, content, businessType }),
    quickCards: getQuickActionCards({ business, content, businessType, availableSections, offer }),
    location,
  };
}

export function getLocalLatamContext({ business, content, businessType, language = 'es', offer, availableSections = new Set() }) {
  const enabled = shouldUsePremiumLocalLatam(business);
  const density = getLocalTrustDensity(business, businessType);
  const resolvedOffer = offer || getOfferConfig(businessType, availableSections, language);
  const hero = getLocalHeroData({ business, content, businessType, language, offer: resolvedOffer, availableSections });
  const isUrgent = isUrgentBusiness(business, businessType);

  return {
    enabled,
    mode: enabled ? 'premium-local-latam' : 'default',
    country: getCountryCode(business),
    density,
    utilityItems: enabled ? getLocalUtilityItems({ business, content, businessType }) : [],
    navItems: enabled ? getLatamNavItems({ business, businessType, availableSections, content, offer: resolvedOffer }) : [],
    stickyActions: enabled ? getStickyMobileActions({ business, businessType, offer: resolvedOffer, language }) : [],
    hero,
    quickCards: hero.quickCards,
    location: hero.location,
    isInstitutional: density >= 5,
    isUrgent,
    hasPricing: hasPricing(content, business),
    escAttr,
  };
}
