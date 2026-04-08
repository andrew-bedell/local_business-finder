// Design Engine V2 — Business taxonomy normalization
// Converts inconsistent upstream categories/subcategories into stable internal types

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

function includesAny(value, needles) {
  return needles.some((needle) => value.includes(needle));
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
  if (includesAny(combined, ['retail', 'store', 'shop'])) return 'retail';

  return 'generic';
}

export function getPrimaryActionLabel(businessType) {
  switch (businessType) {
    case 'restaurant':
    case 'cafe':
    case 'bakery':
    case 'bar':
      return 'Llámanos';
    case 'salon':
    case 'nail-salon':
    case 'spa':
    case 'barber':
      return 'Reserva por teléfono';
    case 'doctor':
    case 'dentist':
    case 'veterinarian':
    case 'physiotherapist':
      return 'Agenda por teléfono';
    case 'plumber':
    case 'electrician':
    case 'contractor':
    case 'auto-repair':
      return 'Llamar ahora';
    case 'gym':
      return 'Agenda tu visita';
    case 'lawyer':
    case 'accountant':
    case 'insurance':
    case 'real-estate':
      return 'Consulta por teléfono';
    default:
      return 'Contáctanos';
  }
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

export function getNavigationItems(businessType, availableSections = new Set()) {
  const has = (key) => availableSections.has(key);

  switch (businessType) {
    case 'restaurant':
    case 'cafe':
    case 'bakery':
    case 'bar':
      return [
        has('about') && { href: '#about', label: 'Nosotros' },
        has('menu') && { href: '#menu', label: 'Menú' },
        has('menuHighlights') && { href: '#menu', label: 'Especialidades' },
        has('ambiance') && { href: '#ambiance', label: 'Ambiente' },
        has('gallery') && { href: '#gallery', label: 'Fotos' },
        has('hours') && { href: '#hours', label: 'Horario' },
        has('contact') && { href: '#contact', label: 'Contacto' },
      ].filter(Boolean);

    case 'salon':
    case 'nail-salon':
    case 'spa':
    case 'barber':
      return [
        has('about') && { href: '#about', label: 'Nosotros' },
        has('nailServices')
          ? { href: '#nail-services', label: 'Servicios' }
          : (has('services') && { href: '#services', label: 'Servicios' }),
        has('treatments') && { href: '#treatments', label: 'Tratamientos' },
        has('designGallery') && { href: '#design-gallery', label: 'Diseños' },
        has('gallery') && { href: '#gallery', label: 'Galería' },
        has('testimonials') && { href: '#testimonials', label: 'Reseñas' },
        has('contact') && { href: '#contact', label: 'Contacto' },
      ].filter(Boolean);

    case 'doctor':
    case 'dentist':
    case 'veterinarian':
    case 'physiotherapist':
      return [
        has('services') && { href: '#services', label: 'Servicios' },
        has('credentials') && { href: '#credentials', label: 'Equipo' },
        has('insurance') && { href: '#insurance', label: 'Seguros' },
        has('testimonials') && { href: '#testimonials', label: 'Reseñas' },
        has('hours') && { href: '#hours', label: 'Horario' },
        has('contact') && { href: '#contact', label: 'Contacto' },
      ].filter(Boolean);

    case 'plumber':
    case 'electrician':
    case 'contractor':
    case 'auto-repair':
      return [
        has('services') && { href: '#services', label: 'Servicios' },
        has('emergencyCTA') && { href: '#emergency', label: 'Urgencias' },
        has('coverageArea') && { href: '#coverage', label: 'Cobertura' },
        has('testimonials') && { href: '#testimonials', label: 'Reseñas' },
        has('contact') && { href: '#contact', label: 'Contacto' },
      ].filter(Boolean);

    default:
      return [
        has('about') && { href: '#about', label: 'Sobre Nosotros' },
        has('services') && { href: '#services', label: 'Servicios' },
        has('gallery') && { href: '#gallery', label: 'Galería' },
        has('testimonials') && { href: '#testimonials', label: 'Reseñas' },
        has('contact') && { href: '#contact', label: 'Contacto' },
      ].filter(Boolean);
  }
}
