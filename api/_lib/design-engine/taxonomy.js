// Design Engine V2 — Business taxonomy normalization
// Converts inconsistent upstream categories/subcategories into stable internal types

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

function includesAny(value, needles) {
  return needles.some((needle) => value.includes(needle));
}

function normalizeLanguage(language) {
  return language === 'en' ? 'en' : 'es';
}

function labelForLanguage(language, english, spanish) {
  return normalizeLanguage(language) === 'en' ? english : spanish;
}

export function normalizeBusinessType(category, subcategory) {
  const cat = lower(category);
  const sub = lower(subcategory);
  const combined = `${cat} ${sub}`.trim();

  if (includesAny(combined, ['nail_salon', 'nail salon', 'manicur', 'pedicur', 'uñas'])) {
    return 'nail-salon';
  }

  if (includesAny(combined, ['restaurant', 'restaurante', 'food', 'comida'])) {
    if (includesAny(combined, ['bakery', 'panadería', 'panaderia'])) return 'bakery';
    if (includesAny(combined, ['cafe', 'café', 'coffee'])) return 'cafe';
    if (includesAny(combined, ['bar', 'pub', 'cantina'])) return 'bar';
    if (includesAny(combined, ['delivery', 'takeout', 'take-out'])) return 'restaurant';
    return 'restaurant';
  }

  if (includesAny(combined, ['cafe', 'café', 'coffee'])) return 'cafe';
  if (includesAny(combined, ['bakery', 'panadería', 'panaderia'])) return 'bakery';
  if (includesAny(combined, ['bar', 'pub', 'cantina'])) return 'bar';

  if (includesAny(combined, ['salon', 'salón', 'beauty salon', 'beauty', 'belleza', 'hair_care', 'hair salon'])) {
    return 'salon';
  }
  if (includesAny(combined, ['spa'])) return 'spa';
  if (includesAny(combined, ['barber', 'barbería', 'barberia'])) return 'barber';

  if (includesAny(combined, ['dentist', 'dental', 'odontol'])) return 'dentist';
  if (includesAny(combined, ['veterinary', 'veterinarian', 'veterin'])) return 'veterinarian';
  if (includesAny(combined, ['physiotherapy', 'physiotherapist', 'fisioterapia', 'rehabilit'])) return 'physiotherapist';
  if (includesAny(combined, ['doctor', 'medical', 'médico', 'medico', 'clinic', 'clínica', 'consultorio'])) return 'doctor';
  if (includesAny(combined, ['gym', 'gimnasio', 'fitness', 'crossfit'])) return 'gym';

  if (includesAny(combined, ['lawyer', 'abogad', 'legal', 'attorney'])) return 'lawyer';
  if (includesAny(combined, ['accountant', 'contador'])) return 'accountant';
  if (includesAny(combined, ['insurance', 'seguros'])) return 'insurance';
  if (includesAny(combined, ['real estate', 'inmobili'])) return 'real-estate';

  if (includesAny(combined, ['plumber', 'plomero'])) return 'plumber';
  if (includesAny(combined, ['electrician', 'electricista'])) return 'electrician';
  if (includesAny(combined, ['contractor', 'contratista', 'painter', 'pintor', 'handyman'])) return 'contractor';
  if (includesAny(combined, ['auto repair', 'mechanic', 'mecánic', 'mecanic', 'taller'])) return 'auto-repair';

  if (includesAny(combined, ['hotel'])) return 'hotel';
  if (includesAny(combined, ['travel'])) return 'travel';
  if (includesAny(combined, ['furniture', 'muebles'])) return 'furniture';
  if (includesAny(combined, [
    'retail',
    'store',
    'shop',
    'boutique',
    'clothing',
    'apparel',
    'fashion',
    'ropa',
    'jewelry',
    'joyer',
    'shoe',
    'zapato',
    'gift',
    'regalo',
  ])) return 'retail';

  return 'generic';
}

function getOfferCopy(businessType, language = 'es') {
  const lang = normalizeLanguage(language);

  switch (businessType) {
    case 'restaurant':
    case 'cafe':
    case 'bakery':
    case 'bar':
      return lang === 'en'
        ? { mode: 'menu', navLabel: 'Menu', actionLabel: 'See Menu', sectionHeading: 'Menu & Pricing', eyebrow: 'Menu' }
        : { mode: 'menu', navLabel: 'Menú', actionLabel: 'Ver Menú', sectionHeading: 'Menú y Precios', eyebrow: 'Menú' };

    case 'retail':
    case 'furniture':
      return lang === 'en'
        ? { mode: 'products', navLabel: 'Products', actionLabel: 'See Our Products', sectionHeading: 'Featured Products', eyebrow: 'Products' }
        : { mode: 'products', navLabel: 'Productos', actionLabel: 'Ver Productos', sectionHeading: 'Productos Destacados', eyebrow: 'Productos' };

    case 'gym':
      return lang === 'en'
        ? { mode: 'services', navLabel: 'Plans', actionLabel: 'See Plans', sectionHeading: 'Plans & Pricing', eyebrow: 'Plans' }
        : { mode: 'services', navLabel: 'Planes', actionLabel: 'Ver Planes', sectionHeading: 'Planes y Precios', eyebrow: 'Planes' };

    default:
      return lang === 'en'
        ? { mode: 'services', navLabel: 'Services', actionLabel: 'See Our Services', sectionHeading: 'Services & Pricing', eyebrow: 'Services' }
        : { mode: 'services', navLabel: 'Servicios', actionLabel: 'Ver Servicios', sectionHeading: 'Servicios y Precios', eyebrow: 'Servicios' };
  }
}

export function getOfferMode(businessType) {
  return getOfferCopy(businessType).mode;
}

function getOfferSectionHref(sectionKey) {
  switch (sectionKey) {
    case 'menu':
    case 'menuHighlights':
      return '#menu';
    case 'nailServices':
      return '#nail-services';
    case 'treatments':
      return '#treatments';
    case 'dentalServices':
      return '#dental-services';
    case 'practiceAreas':
      return '#practice-areas';
    case 'memberships':
      return '#memberships';
    case 'autoServices':
      return '#auto-services';
    case 'products':
      return '#products';
    case 'services':
    default:
      return '#services';
  }
}

export function getOfferSectionCandidates(businessType) {
  switch (businessType) {
    case 'restaurant':
    case 'cafe':
    case 'bakery':
    case 'bar':
      return ['menu', 'menuHighlights'];
    case 'nail-salon':
      return ['nailServices', 'services'];
    case 'salon':
    case 'spa':
    case 'barber':
      return ['treatments', 'services'];
    case 'dentist':
      return ['dentalServices', 'services'];
    case 'lawyer':
      return ['practiceAreas', 'services'];
    case 'gym':
      return ['memberships', 'services'];
    case 'auto-repair':
      return ['autoServices', 'services'];
    case 'retail':
    case 'furniture':
      return ['products', 'services'];
    default:
      return ['services'];
  }
}

export function shouldUseGenericServicesSection(businessType) {
  return ![
    'restaurant',
    'cafe',
    'bakery',
    'bar',
    'nail-salon',
    'salon',
    'spa',
    'barber',
    'dentist',
    'lawyer',
    'gym',
    'auto-repair',
    'retail',
    'furniture',
  ].includes(businessType);
}

export function getOfferConfig(businessType, availableSections = new Set(), language = 'es') {
  const copy = getOfferCopy(businessType, language);
  const candidates = getOfferSectionCandidates(businessType);
  const targetKey = candidates.find((key) => availableSections.has(key)) || candidates[0] || 'services';

  return {
    ...copy,
    targetKey,
    targetHref: getOfferSectionHref(targetKey),
  };
}

export function getStickyWhatsappLabel(language = 'es') {
  return normalizeLanguage(language) === 'en' ? 'WhatsApp' : 'WhatsApp';
}

export function getPrimaryActionLabel(businessType, language = 'es') {
  const lang = normalizeLanguage(language);

  switch (businessType) {
    case 'restaurant':
    case 'cafe':
    case 'bakery':
    case 'bar':
      return lang === 'en' ? 'Order on WhatsApp' : 'Pide por WhatsApp';
    case 'salon':
    case 'nail-salon':
    case 'spa':
    case 'barber':
    case 'gym':
      return lang === 'en' ? 'Book on WhatsApp' : 'Reserva por WhatsApp';
    case 'doctor':
    case 'dentist':
    case 'veterinarian':
    case 'physiotherapist':
      return lang === 'en' ? 'Book on WhatsApp' : 'Agenda por WhatsApp';
    case 'retail':
    case 'furniture':
      return lang === 'en' ? 'Shop on WhatsApp' : 'Compra por WhatsApp';
    case 'plumber':
    case 'electrician':
    case 'contractor':
    case 'auto-repair':
      return lang === 'en' ? 'Get a Quote on WhatsApp' : 'Cotiza por WhatsApp';
    case 'lawyer':
    case 'accountant':
    case 'insurance':
    case 'real-estate':
      return lang === 'en' ? 'Message us on WhatsApp' : 'Escríbenos por WhatsApp';
    default:
      return lang === 'en' ? 'Message us on WhatsApp' : 'Escríbenos por WhatsApp';
  }
}

export function buildWhatsAppHref(business, options = {}) {
  const businessType = options.businessType || normalizeBusinessType(business?.category, business?.subcategory);
  const language = normalizeLanguage(options.language || business?.language);
  const raw = String(business?.whatsapp || business?.phone || '').replace(/[^\d]/g, '');

  if (raw.length < 10) return '';

  const name = business?.name || (language === 'en' ? 'your business' : 'su negocio');
  const offer = getOfferCopy(businessType, language);

  let message = '';
  if (language === 'en') {
    if (offer.mode === 'menu') message = `Hi! I'd like to see the menu for ${name}.`;
    else if (offer.mode === 'products') message = `Hi! I'd like to learn more about the products at ${name}.`;
    else message = `Hi! I'd like more information about the services at ${name}.`;
  } else {
    if (offer.mode === 'menu') message = `Hola! Quiero ver el menú de ${name}.`;
    else if (offer.mode === 'products') message = `Hola! Quiero más información sobre los productos de ${name}.`;
    else message = `Hola! Quiero más información sobre los servicios de ${name}.`;
  }

  return `https://wa.me/${raw}?text=${encodeURIComponent(message)}`;
}

export function getBusinessSchemaType(businessType) {
  switch (businessType) {
    case 'restaurant':
      return 'Restaurant';
    case 'cafe':
      return 'CafeOrCoffeeShop';
    case 'bakery':
      return 'Bakery';
    case 'bar':
      return 'BarOrPub';
    case 'salon':
    case 'spa':
    case 'barber':
      return 'BeautySalon';
    case 'nail-salon':
      return 'NailSalon';
    case 'dentist':
      return 'Dentist';
    case 'doctor':
    case 'physiotherapist':
      return 'MedicalBusiness';
    case 'veterinarian':
      return 'VeterinaryCare';
    case 'plumber':
      return 'Plumber';
    case 'electrician':
      return 'Electrician';
    case 'auto-repair':
      return 'AutoRepair';
    case 'gym':
      return 'ExerciseGym';
    case 'hotel':
      return 'Hotel';
    default:
      return 'LocalBusiness';
  }
}

export function getNavigationItems(businessType, availableSections = new Set(), language = 'es') {
  const has = (key) => availableSections.has(key);
  const offer = getOfferConfig(businessType, availableSections, language);
  const offerItem = offer.targetKey ? { href: offer.targetHref, label: offer.navLabel } : null;
  const aboutLabel = labelForLanguage(language, 'About', 'Nosotros');
  const ambianceLabel = labelForLanguage(language, 'Ambiance', 'Ambiente');
  const galleryLabel = labelForLanguage(language, 'Gallery', 'Galería');
  const hoursLabel = labelForLanguage(language, 'Hours', 'Horario');
  const contactLabel = labelForLanguage(language, 'Contact', 'Contacto');
  const treatmentsLabel = labelForLanguage(language, 'Treatments', 'Tratamientos');
  const designsLabel = labelForLanguage(language, 'Designs', 'Diseños');
  const reviewsLabel = labelForLanguage(language, 'Reviews', 'Reseñas');
  const teamLabel = labelForLanguage(language, 'Team', 'Equipo');
  const insuranceLabel = labelForLanguage(language, 'Insurance', 'Seguros');
  const emergencyLabel = labelForLanguage(language, 'Emergency', 'Urgencias');
  const coverageLabel = labelForLanguage(language, 'Coverage', 'Cobertura');

  switch (businessType) {
    case 'restaurant':
    case 'cafe':
    case 'bakery':
    case 'bar':
      return [
        has('about') && { href: '#about', label: aboutLabel },
        offerItem,
        has('ambiance') && { href: '#ambiance', label: ambianceLabel },
        has('gallery') && { href: '#gallery', label: galleryLabel },
        has('hours') && { href: '#hours', label: hoursLabel },
        has('contact') && { href: '#contact', label: contactLabel },
      ].filter(Boolean);

    case 'salon':
    case 'nail-salon':
    case 'spa':
    case 'barber':
      return [
        has('about') && { href: '#about', label: aboutLabel },
        offerItem,
        has('treatments') && { href: '#treatments', label: treatmentsLabel },
        has('designGallery') && { href: '#design-gallery', label: designsLabel },
        has('gallery') && { href: '#gallery', label: galleryLabel },
        has('testimonials') && { href: '#testimonials', label: reviewsLabel },
        has('contact') && { href: '#contact', label: contactLabel },
      ].filter(Boolean);

    case 'doctor':
    case 'dentist':
    case 'veterinarian':
    case 'physiotherapist':
      return [
        offerItem,
        has('credentials') && { href: '#credentials', label: teamLabel },
        has('insurance') && { href: '#insurance', label: insuranceLabel },
        has('testimonials') && { href: '#testimonials', label: reviewsLabel },
        has('hours') && { href: '#hours', label: hoursLabel },
        has('contact') && { href: '#contact', label: contactLabel },
      ].filter(Boolean);

    case 'plumber':
    case 'electrician':
    case 'contractor':
    case 'auto-repair':
      return [
        offerItem,
        has('emergencyCTA') && { href: '#emergency', label: emergencyLabel },
        has('coverageArea') && { href: '#coverage', label: coverageLabel },
        has('testimonials') && { href: '#testimonials', label: reviewsLabel },
        has('contact') && { href: '#contact', label: contactLabel },
      ].filter(Boolean);

    default:
      return [
        has('about') && { href: '#about', label: aboutLabel },
        offerItem,
        has('gallery') && { href: '#gallery', label: galleryLabel },
        has('testimonials') && { href: '#testimonials', label: reviewsLabel },
        has('contact') && { href: '#contact', label: contactLabel },
      ].filter(Boolean);
  }
}
