// === Local Business Finder Application ===

(function () {
  'use strict';

  // ── i18n ──
  let currentLang = localStorage.getItem('app_lang') || 'en';

  const translations = {
    en: {
      // Header
      logo: 'Local Business Finder',
      tagline: 'Find businesses without websites near any location',
      // API section
      apiKeyTitle: 'Google Places API Key',
      setupGuide: 'Setup Guide',
      apiKeyPlaceholder: 'Enter your Google Places API key',
      saveKey: 'Save Key',
      helpStep1: 'Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener">Google Cloud Console</a>',
      helpStep2: 'Create a new project (or select existing)',
      helpStep3: 'Enable the <strong>Places API (New)</strong> and <strong>Maps JavaScript API</strong>',
      helpStep4: 'Go to <strong>Credentials</strong> and create an API key',
      helpStep5: 'For security, restrict the key to your domain and the Places/Maps APIs',
      helpStep6: 'Paste your key above and click Save',
      // Search section
      searchTitle: 'Search for Businesses',
      countryLabel: 'Country',
      countryUS: 'United States',
      countryMX: 'Mexico',
      countryCO: 'Colombia',
      locationLabel: 'Location',
      locationPlaceholder: 'City, zip code, or address (e.g., Austin TX, 90210, 123 Main St)',
      locationPlaceholderMX: 'City, zip code, or address (e.g., Ciudad de México, Guadalajara, Cancún)',
      locationPlaceholderCO: 'City, zip code, or address (e.g., Bogotá, Medellín, Cartagena)',
      businessTypeLabel: 'Business Type',
      selectType: 'Select a business type...',
      // Business type groups
      groupFood: 'Food & Drink',
      groupBeauty: 'Beauty & Personal Care',
      groupHealth: 'Health & Fitness',
      groupHome: 'Home Services',
      groupAuto: 'Automotive',
      groupShopping: 'Shopping',
      groupProfessional: 'Professional Services',
      groupOther: 'Other',
      // Business types
      typeRestaurant: 'Restaurants',
      typeCafe: 'Cafes & Coffee Shops',
      typeBakery: 'Bakeries',
      typeBar: 'Bars & Pubs',
      typeMealDelivery: 'Meal Delivery',
      typeMealTakeaway: 'Takeaway / Fast Food',
      typeHairCare: 'Barbers & Hair Salons',
      typeBeautySalon: 'Beauty Salons',
      typeSpa: 'Spas & Massage',
      typeNailSalon: 'Nail Salons',
      typeGym: 'Gyms & Fitness Centers',
      typeDentist: 'Dentists',
      typeDoctor: 'Doctors',
      typePharmacy: 'Pharmacies',
      typePhysio: 'Physiotherapists',
      typeVet: 'Veterinary Care',
      typePlumber: 'Plumbers',
      typeElectrician: 'Electricians',
      typeLocksmith: 'Locksmiths',
      typePainter: 'Painters',
      typeRoofing: 'Roofing Contractors',
      typeMoving: 'Moving Companies',
      typeCarRepair: 'Auto Repair',
      typeCarWash: 'Car Washes',
      typeCarDealer: 'Car Dealers',
      typeGasStation: 'Gas Stations',
      typeClothing: 'Clothing Stores',
      typeJewelry: 'Jewelry Stores',
      typeFlorist: 'Florists',
      typePetStore: 'Pet Stores',
      typeFurniture: 'Furniture Stores',
      typeHardware: 'Hardware Stores',
      typeLawyer: 'Lawyers',
      typeAccountant: 'Accountants',
      typeRealEstate: 'Real Estate Agencies',
      typeInsurance: 'Insurance Agencies',
      typeLaundry: 'Laundry & Dry Cleaning',
      typeStorage: 'Storage Facilities',
      typeTravel: 'Travel Agencies',
      typeLodging: 'Hotels & Lodging',
      // Radius & results
      radiusLabel: 'Search Radius',
      maxResultsLabel: 'Max Results',
      searchBtn: 'Search Businesses',
      searching: 'Searching...',
      // Progress
      progressTitle: 'Search Progress',
      initSearch: 'Initializing search...',
      geocoding: 'Geocoding location...',
      locationNotFound: 'Could not find that location. Please try a different address, city, or zip code.',
      locationFound: 'Location found: {0}. Searching for businesses...',
      foundSoFar: 'Found {0} businesses so far, loading more...',
      foundBusinesses: 'Found {0} businesses. Checking for websites...',
      checkingBusiness: 'Checking business {0} of {1}...',
      searchComplete: 'Search complete!',
      noBusinessesFound: 'No businesses found in this area. Try expanding the search radius.',
      progressStatsText: '{0} total businesses found | {1} without a website',
      // Results
      resultsTitle: 'Results',
      exportCsv: 'Export CSV',
      clearBtn: 'Clear',
      filterPlaceholder: 'Filter results by name or address...',
      sortName: 'Sort by Name',
      sortRating: 'Sort by Rating',
      sortReviews: 'Sort by Reviews',
      thName: 'Business Name',
      thAddress: 'Address',
      thPhone: 'Phone',
      thRating: 'Rating',
      thReviews: 'Reviews',
      thStatus: 'Status',
      thDetails: 'Details',
      noResults1: 'All businesses found in this area already have websites.',
      noResults2: 'Try expanding the search radius or changing the business type.',
      noWebsitesFound: 'No businesses without websites found.',
      showingResults: 'Showing {0} of {1} businesses without websites',
      // Table cell text
      statusOpen: 'Open',
      statusTempClosed: 'Temp Closed',
      statusClosed: 'Closed',
      statusUnknown: 'Unknown',
      noWebsite: 'No Website',
      viewBtn: 'View',
      noData: 'No data',
      // Modal
      photos: 'Photos',
      topReviewsTitle: 'Top Reviews for Website',
      topReviewsSubtitle: 'Ranked by sentiment analysis — best testimonials first',
      reviewsTitle: 'Reviews',
      noReviewsAvailable: 'No reviews available for this business.',
      businessHours: 'Business Hours',
      copyTopReviews: 'Copy Top Reviews',
      copied: 'Copied!',
      closeBtn: 'Close',
      topPick: 'Top Pick',
      good: 'Good',
      reviews: 'reviews',
      noReviews: 'No reviews',
      // API status messages
      enterValidKey: 'Please enter a valid API key.',
      keySaved: 'Key saved. Loading Google Maps...',
      mapsLoaded: 'Google Maps loaded successfully.',
      mapsLoadFailed: 'Failed to load Google Maps. Check your API key and ensure Places API (New) is enabled.',
      apiKeyAutoLoaded: 'API key loaded from server. Connecting to Google Maps...',
      apiKeyAutoFailed: 'Could not load API key from server. Enter your key manually below.',
      // Footer
      footer: 'Powered by Google Places API. Results may not be 100% accurate — always verify before outreach.',
      // Radius labels
      radius1mi: '1 mile',
      radius3mi: '3 miles',
      radius5mi: '5 miles',
      radius10mi: '10 miles',
      radius20mi: '20 miles',
      radius30mi: '30 miles',
      radius1_5km: '1.5 km',
      radius5km: '5 km',
      radius8km: '8 km',
      radius15km: '15 km',
      radius30km: '30 km',
      radius50km: '50 km',
      // Save to DB
      saveAllBtn: 'Save All to DB',
      thSave: 'Save',
      saveBtn: 'Save',
      savedBtn: 'Saved',
      savingBtn: 'Saving...',
      saveAllSuccess: 'All businesses saved to database!',
      saveError: 'Error saving. Check console for details.',
      savedCount: '{0} of {1} saved to database',
      dbNotAvailable: 'Database connection not available. The Supabase library may not have loaded.',
      noResultsToSave: 'No results to save. Run a search first.',
      saveAllSuccessToast: 'Successfully saved {0} of {1} businesses to database!',
      saveRowSuccess: '"{0}" saved to database.',
      saveRowError: 'Failed to save "{0}". Check console for details.',
      // Error messages
      searchError: 'Search failed. Please check your API key and network connection, then try again.',
      timeoutError: '{0} timed out after {1}s. Check your API key and network connection.',
      mapsAuthFailed: 'Google Maps API key is not authorized. Check that your API key allows this domain and that Maps JavaScript API is enabled in Google Cloud Console.',
      geocodeRequestDenied: 'Geocoding request denied. Verify your API key is valid, billing is enabled, and the Geocoding API is active in Google Cloud Console.',
      // Social Media Auto-Discovery
      socialDiscovering: 'Finding social profiles...',
      socialYelpRating: '{0} stars on Yelp',
      socialViewOn: 'View on {0}',
      thFacebook: 'Facebook',
      thInstagram: 'Instagram',
      socialNotFound: 'Not Found',
      // Social Media Discovery
      socialProfiles: 'Social Profiles',
      socialProfilesSubtitle: 'Discover and link social media profiles for this business',
      addProfile: 'Add Profile',
      saveProfile: 'Save',
      removeProfile: 'Remove',
      platformLabel: 'Platform',
      profileUrlLabel: 'Profile URL',
      searchPlatforms: 'Find on Platforms',
      searchPlatformsSubtitle: 'Click to search for this business on each platform',
      saveToDatabaseFirst: 'Save this business to the database to manage social profiles.',
      saveToDatabaseBtn: 'Save to Database',
      noProfilesYet: 'No social profiles linked yet. Use the search links below to find this business on social media.',
      profileSaved: 'Social profile saved.',
      profileRemoved: 'Social profile removed.',
      profileSaveError: 'Failed to save social profile.',
      profileRemoveError: 'Failed to remove social profile.',
      profileUrlRequired: 'Please enter a profile URL.',
      selectPlatform: 'Select platform...',
      platformFacebook: 'Facebook',
      platformInstagram: 'Instagram',
      platformWhatsapp: 'WhatsApp',
      platformTwitter: 'Twitter / X',
      platformTiktok: 'TikTok',
      platformLinkedin: 'LinkedIn',
      platformYoutube: 'YouTube',
      platformYelp: 'Yelp',
      platformTripadvisor: 'TripAdvisor',
      platformOpentable: 'OpenTable',
      platformResy: 'Resy',
      platformDoordash: 'DoorDash',
      platformUbereats: 'Uber Eats',
      platformGrubhub: 'Grubhub',
      // SearchAPI.io integration
      searchingViaSearchApi: 'Searching via SearchAPI.io...',
      searchApiFallback: 'SearchAPI.io unavailable, using Google Places...',
      autoSaving: 'Auto-saving businesses...',
      autoSaveComplete: 'Auto-saved {0} businesses to database',
      enriching: 'Enriching business data...',
      enrichComplete: 'Enrichment complete',
      // Modal enrichment sections
      businessDescription: 'About This Business',
      businessFeatures: 'Features & Services',
      serviceOptionsTitle: 'Service Options',
      highlightsTitle: 'Highlights',
      businessAmenities: 'Amenities',
      accessibilityTitle: 'Accessibility',
      reviewBreakdown: 'Rating Breakdown',
      facebookProfile: 'Facebook',
      instagramProfile: 'Instagram',
      followers: '{0} followers',
      posts: 'Posts',
      noDescription: 'No description available.',
      // Search pagination
      searchingPage: 'Searching page {0} of {1}...',
      // Google review enrichment
      fetchingReviews: 'Fetching reviews via Google...',
      fetchingReviewsProgress: 'Fetching reviews... {0} of {1}',
    },
    es: {
      // Header
      logo: 'Buscador de Negocios Locales',
      tagline: 'Encuentra negocios sin sitio web cerca de cualquier ubicación',
      // API section
      apiKeyTitle: 'Clave API de Google Places',
      setupGuide: 'Guía de Configuración',
      apiKeyPlaceholder: 'Ingresa tu clave API de Google Places',
      saveKey: 'Guardar Clave',
      helpStep1: 'Ve a <a href="https://console.cloud.google.com/" target="_blank" rel="noopener">Google Cloud Console</a>',
      helpStep2: 'Crea un proyecto nuevo (o selecciona uno existente)',
      helpStep3: 'Habilita la <strong>Places API (New)</strong> y la <strong>Maps JavaScript API</strong>',
      helpStep4: 'Ve a <strong>Credenciales</strong> y crea una clave API',
      helpStep5: 'Por seguridad, restringe la clave a tu dominio y las APIs de Places/Maps',
      helpStep6: 'Pega tu clave arriba y haz clic en Guardar',
      // Search section
      searchTitle: 'Buscar Negocios',
      countryLabel: 'País',
      countryUS: 'Estados Unidos',
      countryMX: 'México',
      countryCO: 'Colombia',
      locationLabel: 'Ubicación',
      locationPlaceholder: 'Ciudad, código postal o dirección (ej., Austin TX, 90210, 123 Main St)',
      locationPlaceholderMX: 'Ciudad, código postal o dirección (ej., Ciudad de México, Guadalajara, Cancún)',
      locationPlaceholderCO: 'Ciudad, código postal o dirección (ej., Bogotá, Medellín, Cartagena)',
      businessTypeLabel: 'Tipo de Negocio',
      selectType: 'Selecciona un tipo de negocio...',
      // Business type groups
      groupFood: 'Comida y Bebida',
      groupBeauty: 'Belleza y Cuidado Personal',
      groupHealth: 'Salud y Fitness',
      groupHome: 'Servicios para el Hogar',
      groupAuto: 'Automotriz',
      groupShopping: 'Compras',
      groupProfessional: 'Servicios Profesionales',
      groupOther: 'Otros',
      // Business types
      typeRestaurant: 'Restaurantes',
      typeCafe: 'Cafeterías',
      typeBakery: 'Panaderías',
      typeBar: 'Bares y Cantinas',
      typeMealDelivery: 'Entrega a Domicilio',
      typeMealTakeaway: 'Comida Rápida / Para Llevar',
      typeHairCare: 'Barberías y Peluquerías',
      typeBeautySalon: 'Salones de Belleza',
      typeSpa: 'Spas y Masajes',
      typeNailSalon: 'Salones de Uñas',
      typeGym: 'Gimnasios y Centros de Fitness',
      typeDentist: 'Dentistas',
      typeDoctor: 'Doctores',
      typePharmacy: 'Farmacias',
      typePhysio: 'Fisioterapeutas',
      typeVet: 'Veterinarias',
      typePlumber: 'Plomeros',
      typeElectrician: 'Electricistas',
      typeLocksmith: 'Cerrajeros',
      typePainter: 'Pintores',
      typeRoofing: 'Techadores',
      typeMoving: 'Empresas de Mudanzas',
      typeCarRepair: 'Talleres Mecánicos',
      typeCarWash: 'Autolavados',
      typeCarDealer: 'Agencias de Autos',
      typeGasStation: 'Gasolineras',
      typeClothing: 'Tiendas de Ropa',
      typeJewelry: 'Joyerías',
      typeFlorist: 'Florerías',
      typePetStore: 'Tiendas de Mascotas',
      typeFurniture: 'Mueblerías',
      typeHardware: 'Ferreterías',
      typeLawyer: 'Abogados',
      typeAccountant: 'Contadores',
      typeRealEstate: 'Agencias Inmobiliarias',
      typeInsurance: 'Agencias de Seguros',
      typeLaundry: 'Lavanderías y Tintorerías',
      typeStorage: 'Bodegas de Almacenamiento',
      typeTravel: 'Agencias de Viajes',
      typeLodging: 'Hoteles y Hospedaje',
      // Radius & results
      radiusLabel: 'Radio de Búsqueda',
      maxResultsLabel: 'Máx. Resultados',
      searchBtn: 'Buscar Negocios',
      searching: 'Buscando...',
      // Progress
      progressTitle: 'Progreso de Búsqueda',
      initSearch: 'Iniciando búsqueda...',
      geocoding: 'Geocodificando ubicación...',
      locationNotFound: 'No se encontró esa ubicación. Intenta con otra dirección, ciudad o código postal.',
      locationFound: 'Ubicación encontrada: {0}. Buscando negocios...',
      foundSoFar: 'Se encontraron {0} negocios hasta ahora, cargando más...',
      foundBusinesses: 'Se encontraron {0} negocios. Verificando sitios web...',
      checkingBusiness: 'Verificando negocio {0} de {1}...',
      searchComplete: '¡Búsqueda completada!',
      noBusinessesFound: 'No se encontraron negocios en esta área. Intenta expandir el radio de búsqueda.',
      progressStatsText: '{0} negocios encontrados en total | {1} sin sitio web',
      // Results
      resultsTitle: 'Resultados',
      exportCsv: 'Exportar CSV',
      clearBtn: 'Limpiar',
      filterPlaceholder: 'Filtrar resultados por nombre o dirección...',
      sortName: 'Ordenar por Nombre',
      sortRating: 'Ordenar por Calificación',
      sortReviews: 'Ordenar por Reseñas',
      thName: 'Nombre del Negocio',
      thAddress: 'Dirección',
      thPhone: 'Teléfono',
      thRating: 'Calificación',
      thReviews: 'Reseñas',
      thStatus: 'Estado',
      thDetails: 'Detalles',
      noResults1: 'Todos los negocios encontrados en esta área ya tienen sitio web.',
      noResults2: 'Intenta expandir el radio de búsqueda o cambiar el tipo de negocio.',
      noWebsitesFound: 'No se encontraron negocios sin sitio web.',
      showingResults: 'Mostrando {0} de {1} negocios sin sitio web',
      // Table cell text
      statusOpen: 'Abierto',
      statusTempClosed: 'Cerrado Temp.',
      statusClosed: 'Cerrado',
      statusUnknown: 'Desconocido',
      noWebsite: 'Sin Sitio Web',
      viewBtn: 'Ver',
      noData: 'Sin datos',
      // Modal
      photos: 'Fotos',
      topReviewsTitle: 'Mejores Reseñas para el Sitio Web',
      topReviewsSubtitle: 'Clasificadas por análisis de sentimiento — los mejores testimonios primero',
      reviewsTitle: 'Reseñas',
      noReviewsAvailable: 'No hay reseñas disponibles para este negocio.',
      businessHours: 'Horario de Atención',
      copyTopReviews: 'Copiar Mejores Reseñas',
      copied: '¡Copiado!',
      closeBtn: 'Cerrar',
      topPick: 'Destacado',
      good: 'Bueno',
      reviews: 'reseñas',
      noReviews: 'Sin reseñas',
      // API status messages
      enterValidKey: 'Por favor ingresa una clave API válida.',
      keySaved: 'Clave guardada. Cargando Google Maps...',
      mapsLoaded: 'Google Maps cargado exitosamente.',
      mapsLoadFailed: 'Error al cargar Google Maps. Verifica tu clave API y asegúrate de que la Places API (New) esté habilitada.',
      apiKeyAutoLoaded: 'Clave API cargada del servidor. Conectando a Google Maps...',
      apiKeyAutoFailed: 'No se pudo cargar la clave API del servidor. Ingresa tu clave manualmente.',
      // Footer
      footer: 'Impulsado por Google Places API. Los resultados pueden no ser 100% precisos — siempre verifica antes de contactar.',
      // Radius labels
      radius1mi: '1 milla',
      radius3mi: '3 millas',
      radius5mi: '5 millas',
      radius10mi: '10 millas',
      radius20mi: '20 millas',
      radius30mi: '30 millas',
      radius1_5km: '1.5 km',
      radius5km: '5 km',
      radius8km: '8 km',
      radius15km: '15 km',
      radius30km: '30 km',
      radius50km: '50 km',
      // Save to DB
      saveAllBtn: 'Guardar Todo en BD',
      thSave: 'Guardar',
      saveBtn: 'Guardar',
      savedBtn: 'Guardado',
      savingBtn: 'Guardando...',
      saveAllSuccess: '¡Todos los negocios guardados en la base de datos!',
      saveError: 'Error al guardar. Revisa la consola para más detalles.',
      savedCount: '{0} de {1} guardados en la base de datos',
      dbNotAvailable: 'Conexión a la base de datos no disponible. La librería Supabase puede no haberse cargado.',
      noResultsToSave: 'No hay resultados para guardar. Ejecuta una búsqueda primero.',
      saveAllSuccessToast: '¡{0} de {1} negocios guardados en la base de datos!',
      saveRowSuccess: '"{0}" guardado en la base de datos.',
      saveRowError: 'Error al guardar "{0}". Revisa la consola para más detalles.',
      // Error messages
      searchError: 'La búsqueda falló. Verifica tu clave API y conexión a internet, e intenta de nuevo.',
      timeoutError: '{0} agotó el tiempo de espera después de {1}s. Verifica tu clave API y conexión a internet.',
      mapsAuthFailed: 'La clave de Google Maps API no está autorizada. Verifica que tu clave permita este dominio y que la Maps JavaScript API esté habilitada en Google Cloud Console.',
      geocodeRequestDenied: 'Solicitud de geocodificación denegada. Verifica que tu clave API sea válida, la facturación esté habilitada y la Geocoding API esté activa en Google Cloud Console.',
      // Social Media Auto-Discovery
      socialDiscovering: 'Buscando perfiles sociales...',
      socialYelpRating: '{0} estrellas en Yelp',
      socialViewOn: 'Ver en {0}',
      thFacebook: 'Facebook',
      thInstagram: 'Instagram',
      socialNotFound: 'No Encontrado',
      // Social Media Discovery
      socialProfiles: 'Perfiles Sociales',
      socialProfilesSubtitle: 'Descubre y vincula perfiles de redes sociales para este negocio',
      addProfile: 'Agregar Perfil',
      saveProfile: 'Guardar',
      removeProfile: 'Eliminar',
      platformLabel: 'Plataforma',
      profileUrlLabel: 'URL del Perfil',
      searchPlatforms: 'Buscar en Plataformas',
      searchPlatformsSubtitle: 'Haz clic para buscar este negocio en cada plataforma',
      saveToDatabaseFirst: 'Guarda este negocio en la base de datos para gestionar perfiles sociales.',
      saveToDatabaseBtn: 'Guardar en Base de Datos',
      noProfilesYet: 'No hay perfiles sociales vinculados aún. Usa los enlaces de búsqueda abajo para encontrar este negocio en redes sociales.',
      profileSaved: 'Perfil social guardado.',
      profileRemoved: 'Perfil social eliminado.',
      profileSaveError: 'Error al guardar perfil social.',
      profileRemoveError: 'Error al eliminar perfil social.',
      profileUrlRequired: 'Por favor ingresa una URL de perfil.',
      selectPlatform: 'Seleccionar plataforma...',
      platformFacebook: 'Facebook',
      platformInstagram: 'Instagram',
      platformWhatsapp: 'WhatsApp',
      platformTwitter: 'Twitter / X',
      platformTiktok: 'TikTok',
      platformLinkedin: 'LinkedIn',
      platformYoutube: 'YouTube',
      platformYelp: 'Yelp',
      platformTripadvisor: 'TripAdvisor',
      platformOpentable: 'OpenTable',
      platformResy: 'Resy',
      platformDoordash: 'DoorDash',
      platformUbereats: 'Uber Eats',
      platformGrubhub: 'Grubhub',
      // SearchAPI.io integration
      searchingViaSearchApi: 'Buscando via SearchAPI.io...',
      searchApiFallback: 'SearchAPI.io no disponible, usando Google Places...',
      autoSaving: 'Guardando negocios automáticamente...',
      autoSaveComplete: '{0} negocios guardados automáticamente en la base de datos',
      enriching: 'Enriqueciendo datos del negocio...',
      enrichComplete: 'Enriquecimiento completo',
      // Modal enrichment sections
      businessDescription: 'Acerca de Este Negocio',
      businessFeatures: 'Características y Servicios',
      serviceOptionsTitle: 'Opciones de Servicio',
      highlightsTitle: 'Destacados',
      businessAmenities: 'Comodidades',
      accessibilityTitle: 'Accesibilidad',
      reviewBreakdown: 'Desglose de Calificaciones',
      facebookProfile: 'Facebook',
      instagramProfile: 'Instagram',
      followers: '{0} seguidores',
      posts: 'Publicaciones',
      noDescription: 'No hay descripción disponible.',
      // Search pagination
      searchingPage: 'Buscando página {0} de {1}...',
      // Google review enrichment
      fetchingReviews: 'Obteniendo reseñas de Google...',
      fetchingReviewsProgress: 'Obteniendo reseñas... {0} de {1}',
    },
  };

  function t(key, ...args) {
    let str = (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
    args.forEach((val, i) => {
      str = str.replace(`{${i}}`, val);
    });
    return str;
  }

  function applyLanguage() {
    document.documentElement.lang = currentLang;

    // Text content
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      // Use innerHTML for keys that contain HTML tags
      if (val.includes('<a ') || val.includes('<strong>')) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });

    // Optgroup labels
    document.querySelectorAll('[data-i18n-label]').forEach((el) => {
      el.label = t(el.getAttribute('data-i18n-label'));
    });

    // Update lang switcher active state
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    });

    // Update page title
    document.title = currentLang === 'es'
      ? 'Buscador de Negocios Locales - Sin Sitio Web'
      : 'Local Business Finder - No Website';

    // Refresh radius labels and location placeholder for current country
    onCountryChange();

    // Re-render table if we have results
    if (filteredResults.length > 0) {
      resultsSummary.textContent = t('showingResults', filteredResults.length, allResults.length);
      renderTable();
    }
  }

  // ── Toast Notifications ──
  function showToast(message, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4000);
  }

  // ── Supabase ──
  // Fallback credentials used when server config is unavailable (local dev)
  const SUPABASE_URL_FALLBACK = 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const SUPABASE_KEY_FALLBACK = 'sb_publishable_2ZsXzfuXEPF7MJxxB7mA-Q_H--jfttp';
  let supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL_FALLBACK, SUPABASE_KEY_FALLBACK) : null;
  const savedPlaceIds = new Set();

  if (!supabaseClient) {
    console.warn('Supabase client not initialized. window.supabase =', window.supabase);
  }

  function initSupabaseFromConfig(url, key) {
    if (window.supabase && url && key) {
      supabaseClient = window.supabase.createClient(url, key);
    }
  }

  async function loadSavedIds() {
    if (!supabaseClient) return;
    try {
      const { data } = await supabaseClient.from('businesses').select('place_id');
      if (data) data.forEach((row) => savedPlaceIds.add(row.place_id));
    } catch (e) {
      console.warn('Could not load saved IDs:', e);
    }
  }

  // Valid business_status values per database CHECK constraint
  const VALID_BUSINESS_STATUSES = ['OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY', 'UNKNOWN'];

  async function saveBusiness(place) {
    if (!supabaseClient) return false;
    try {
      const location = locationInput.value.trim();
      const type = businessType.value;

      // Validate business_status against CHECK constraint
      const status = VALID_BUSINESS_STATUSES.includes(place.status) ? place.status : 'UNKNOWN';

      const row = {
        place_id: place.placeId,
        name: place.name,
        address_full: place.address,
        phone: place.phone,
        website: place.website || '',
        rating: place.rating || null,
        review_count: place.reviewCount || 0,
        business_status: status,
        maps_url: place.mapsUrl,
        types: place.types || [],
        latitude: place.latitude || null,
        longitude: place.longitude || null,
        hours: place.hours || [],
        search_location: location,
        search_type: type,
        description: place.description || null,
        thumbnail: place.thumbnail || null,
        price_level: place.priceLevel ? parseInt(place.priceLevel) || null : null,
        service_options: place.serviceOptions || [],
        amenities: place.amenities || [],
        highlights: place.highlights || [],
        accessibility_info: (place.accessibility || []).join(', ') || null,
      };

      // Upsert business and get back the id for saving reviews
      const { data, error } = await supabaseClient
        .from('businesses')
        .upsert(row, { onConflict: 'place_id' })
        .select('id');

      if (error) {
        console.error('Save error:', error);
        return false;
      }

      // Save reviews to business_reviews table
      const businessId = data && data[0] && data[0].id;
      if (businessId && place.reviewData && place.reviewData.length > 0) {
        const reviewRows = place.reviewData.map((r) => {
          const authorName = r.authorAttribution?.displayName || null;
          const reviewText = r.text || '';
          const sentiment = analyzeSentiment(r);
          return {
            business_id: businessId,
            source: 'google',
            author_name: authorName,
            author_photo_url: r.authorAttribution?.photoURI || null,
            rating: Math.max(1, Math.min(5, Math.round(r.rating || 3))),
            text: reviewText,
            published_at: r.relativePublishTimeDescription || '',
            sentiment_score: Math.round(sentiment.score * 10000) / 10000,
            sentiment_label: sentimentLabelToDb(sentiment.label),
            review_hash: reviewHash('google', authorName, reviewText),
          };
        });

        const { error: reviewError } = await supabaseClient
          .from('business_reviews')
          .upsert(reviewRows, { onConflict: 'business_id,review_hash' });

        if (reviewError) {
          console.warn('Review save error (non-fatal):', reviewError);
        }
      }

      // Save discovered social profiles if available
      if (businessId && place.socialProfiles && place.socialProfiles.length > 0) {
        await saveDiscoveredProfiles(businessId, place.socialProfiles);
      }

      savedPlaceIds.add(place.placeId);
      return true;
    } catch (err) {
      console.error('Save error (exception):', err);
      return false;
    }
  }

  async function saveAllBusinesses() {
    if (!supabaseClient) {
      showToast(t('dbNotAvailable'), 'error');
      return;
    }
    if (filteredResults.length === 0) {
      showToast(t('noResultsToSave'), 'warning');
      return;
    }

    const btn = document.getElementById('btn-save-all');
    btn.disabled = true;
    btn.textContent = t('savingBtn');

    let savedCount = 0;
    for (const place of filteredResults) {
      if (savedPlaceIds.has(place.placeId)) {
        savedCount++;
        continue;
      }
      const ok = await saveBusiness(place);
      if (ok) savedCount++;
    }

    btn.textContent = t('savedCount', savedCount, filteredResults.length);
    btn.disabled = false;
    setTimeout(() => { btn.textContent = t('saveAllBtn'); }, 3000);

    if (savedCount > 0) {
      showToast(t('saveAllSuccessToast', savedCount, filteredResults.length), 'success');
    } else {
      showToast(t('saveError'), 'error');
    }

    // Re-render to update individual save buttons
    renderTable();
  }

  // ── State ──
  let apiKey = localStorage.getItem('google_places_api_key') || '';
  let geocoder = null;
  let allResults = [];
  let filteredResults = [];
  let isSearching = false;
  let mapsLoaded = false;

  // ── DOM refs ──
  const $ = (sel) => document.querySelector(sel);
  const apiKeyInput = $('#api-key-input');
  const apiStatus = $('#api-status');
  const apiHelpToggle = $('#api-help-toggle');
  const apiHelp = $('#api-help');
  const btnSaveKey = $('#btn-save-key');
  const locationInput = $('#location-input');
  const businessType = $('#business-type');
  const radiusSelect = $('#radius-select');
  const maxResults = $('#max-results');
  const countrySelect = $('#country-select');
  const btnSearch = $('#btn-search');
  const progressSection = $('#progress-section');
  const progressBar = $('#progress-bar');
  const progressText = $('#progress-text');
  const progressStats = $('#progress-stats');
  const resultsSection = $('#results-section');
  const resultsSummary = $('#results-summary');
  const resultsBody = $('#results-body');
  const noResults = $('#no-results');
  const filterInput = $('#filter-input');
  const sortSelect = $('#sort-select');
  const btnExportCsv = $('#btn-export-csv');
  const btnClear = $('#btn-clear');

  // ── Initialize ──
  function init() {
    btnSaveKey.addEventListener('click', saveApiKey);
    apiKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveApiKey();
    });
    apiHelpToggle.addEventListener('click', () => {
      apiHelp.style.display = apiHelp.style.display === 'none' ? 'block' : 'none';
    });
    btnSearch.addEventListener('click', startSearch);
    filterInput.addEventListener('input', applyFilterAndSort);
    sortSelect.addEventListener('change', applyFilterAndSort);
    btnExportCsv.addEventListener('click', exportCsv);
    btnClear.addEventListener('click', clearResults);
    document.getElementById('btn-save-all').addEventListener('click', saveAllBusinesses);
    countrySelect.addEventListener('change', onCountryChange);

    // Language switcher
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentLang = btn.getAttribute('data-lang');
        localStorage.setItem('app_lang', currentLang);
        applyLanguage();
      });
    });

    applyLanguage();
    updateSearchButton();

    // Try to load API key from server, fall back to localStorage
    fetchApiKeyFromServer();
  }

  async function fetchApiKeyFromServer() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        // Re-initialize Supabase client with server-provided credentials
        if (data.supabaseUrl && data.supabaseKey) {
          initSupabaseFromConfig(data.supabaseUrl, data.supabaseKey);
        }
        // Load saved IDs after final Supabase client is determined
        loadSavedIds();
        if (data.googleApiKey) {
          apiKey = data.googleApiKey;
          document.getElementById('api-setup').style.display = 'none';
          loadGoogleMaps(apiKey);
          return;
        }
      } else {
        // Server returned non-OK — use fallback Supabase client
        loadSavedIds();
      }
    } catch (_) {
      // Server not available (e.g. local dev) — use fallback Supabase client
      loadSavedIds();
    }

    // Fall back to localStorage key or manual input
    if (apiKey) {
      apiKeyInput.value = '••••••••••••••••••••';
      loadGoogleMaps(apiKey);
    }
  }

  // ── API Key Management ──
  function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (!key || key === '••••••••••••••••••••') {
      showApiStatus(t('enterValidKey'), 'error');
      return;
    }
    apiKey = key;
    localStorage.setItem('google_places_api_key', apiKey);
    apiKeyInput.value = '••••••••••••••••••••';
    showApiStatus(t('keySaved'), 'success');
    loadGoogleMaps(apiKey);
  }

  function showApiStatus(msg, type) {
    apiStatus.textContent = msg;
    apiStatus.className = 'api-status ' + type;
  }

  // ── Google Maps Loading ──
  let mapsAuthError = false;

  function loadGoogleMaps(key) {
    if (mapsLoaded && !mapsAuthError) {
      initServices();
      return;
    }

    mapsAuthError = false;

    // Remove any existing script
    const existing = document.querySelector('script[src*="maps.googleapis"]');
    if (existing) existing.remove();

    // Google Maps calls this global when API key auth fails (ApiTargetBlockedMapError, etc.)
    window.gm_authFailure = function () {
      mapsAuthError = true;
      mapsLoaded = false;
      showApiStatus(t('mapsAuthFailed'), 'error');
      showToast(t('mapsAuthFailed'), 'error');
      updateSearchButton();
      console.error('Google Maps auth failure: API key is not authorized for this domain or the required APIs are not enabled.');
    };

    window._gmapsCallback = function () {
      if (!mapsAuthError) {
        mapsLoaded = true;
        initServices();
        showApiStatus(t('mapsLoaded'), 'success');
        updateSearchButton();
      }
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=places&callback=_gmapsCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      showApiStatus(t('mapsLoadFailed'), 'error');
    };
    document.head.appendChild(script);
  }

  function initServices() {
    geocoder = new google.maps.Geocoder();
  }

  // ── Search Button State ──
  function updateSearchButton() {
    const hasLocation = locationInput.value.trim().length > 0;
    const hasType = businessType.value !== '';
    const hasApi = mapsLoaded;
    btnSearch.disabled = !(hasLocation && hasType && hasApi);
  }

  locationInput.addEventListener('input', updateSearchButton);
  businessType.addEventListener('change', updateSearchButton);

  // ── Main Search Flow ──
  async function startSearch() {
    if (isSearching) return;
    isSearching = true;

    const location = locationInput.value.trim();
    const type = businessType.value;
    const radius = parseInt(radiusSelect.value);
    const maxCount = parseInt(maxResults.value);

    // Show progress, hide results
    progressSection.style.display = 'block';
    resultsSection.style.display = 'none';
    allResults = [];
    filteredResults = [];
    updateProgress(0, t('geocoding'));

    btnSearch.querySelector('.btn-text').style.display = 'none';
    btnSearch.querySelector('.btn-loading').style.display = 'inline-flex';
    btnSearch.disabled = true;

    try {
      // Step 1: Geocode the location
      const coords = await geocodeLocation(location);
      if (!coords) {
        updateProgress(0, t('locationNotFound'));
        resetSearchButton();
        return;
      }

      updateProgress(10, t('locationFound', coords.formattedAddress));

      // Step 2: Try SearchAPI.io first, fall back to Google Places JS API
      let mapped = [];
      let usedSearchApi = false;

      // Extract lat/lng from Google Maps LatLng object
      const lat = typeof coords.latLng.lat === 'function' ? coords.latLng.lat() : coords.latLng.lat;
      const lng = typeof coords.latLng.lng === 'function' ? coords.latLng.lng() : coords.latLng.lng;

      try {
        updateProgress(15, t('searchingViaSearchApi'));
        const searchApiResults = await searchViaSearchApi(type, lat, lng, radius, maxCount);
        if (searchApiResults && searchApiResults.length > 0) {
          mapped = searchApiResults;
          usedSearchApi = true;
        }
      } catch (searchApiErr) {
        console.warn('SearchAPI.io search failed, falling back to Google Places:', searchApiErr);
        updateProgress(20, t('searchApiFallback'));
      }

      if (!usedSearchApi) {
        // Fallback: use Google Places JS API
        const places = await searchPlaces(coords.latLng, type, radius, maxCount);
        if (places.length === 0) {
          updateProgress(100, t('noBusinessesFound'));
          resetSearchButton();
          return;
        }
        mapped = places.map(mapPlaceToResult);
      }

      if (mapped.length === 0) {
        updateProgress(100, t('noBusinessesFound'));
        resetSearchButton();
        return;
      }

      // Step 3: Filter — keep businesses without websites or with FB/IG as their website
      const noWebsite = mapped.filter((p) => shouldShowBusiness(p));

      updateProgress(90, t('foundBusinesses', mapped.length));

      allResults = noWebsite;

      updateProgress(95, t('searchComplete'));
      progressStats.textContent = t('progressStatsText', mapped.length, allResults.length);

      // Show results immediately, then enrich in background
      showResults();

      // Background enrichment pipeline (non-blocking)
      runEnrichmentPipeline(allResults).catch((err) => {
        console.warn('Enrichment pipeline error:', err);
      });
    } catch (err) {
      console.error('Search error:', err);
      const errorMsg = err.message || t('searchError');
      updateProgress(0, errorMsg);
      showToast(errorMsg, 'error');
    }

    resetSearchButton();
  }

  function resetSearchButton() {
    isSearching = false;
    btnSearch.querySelector('.btn-text').style.display = 'inline';
    btnSearch.querySelector('.btn-loading').style.display = 'none';
    updateSearchButton();
  }

  // ── Country Selection ──
  function onCountryChange() {
    const country = countrySelect.value;
    const useKm = country === 'mx' || country === 'co';

    if (country === 'mx') {
      locationInput.placeholder = t('locationPlaceholderMX');
    } else if (country === 'co') {
      locationInput.placeholder = t('locationPlaceholderCO');
    } else {
      locationInput.placeholder = t('locationPlaceholder');
    }

    updateRadiusLabels(useKm);
  }

  function updateRadiusLabels(useKm) {
    const radiusOptions = radiusSelect.querySelectorAll('option');
    const labels = useKm
      ? [t('radius1_5km'), t('radius5km'), t('radius8km'), t('radius15km'), t('radius30km'), t('radius50km')]
      : [t('radius1mi'), t('radius3mi'), t('radius5mi'), t('radius10mi'), t('radius20mi'), t('radius30mi')];
    radiusOptions.forEach((opt, i) => {
      opt.textContent = labels[i];
    });
  }

  // ── Timeout helper ──
  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(t('timeoutError', label, ms / 1000))), ms)
      ),
    ]);
  }

  // ── Geocoding ──
  function geocodeLocation(address) {
    const country = countrySelect.value;
    return withTimeout(
      new Promise((resolve, reject) => {
        geocoder.geocode(
          { address, componentRestrictions: { country } },
          (results, status) => {
            if (status === 'OK' && results.length > 0) {
              resolve({
                latLng: results[0].geometry.location,
                formattedAddress: results[0].formatted_address,
              });
            } else if (status === 'REQUEST_DENIED') {
              console.error('Geocoding REQUEST_DENIED:', status);
              reject(new Error(t('geocodeRequestDenied')));
            } else {
              resolve(null);
            }
          }
        );
      }),
      15000,
      'Geocoding'
    );
  }

  // ── Places Search (New API) ──
  async function searchPlaces(latLng, type, radius, maxCount) {
    const request = {
      fields: ['displayName', 'formattedAddress', 'nationalPhoneNumber', 'websiteURI', 'rating', 'userRatingCount', 'businessStatus', 'googleMapsURI', 'types', 'id', 'reviews', 'photos', 'regularOpeningHours', 'location'],
      locationRestriction: {
        center: latLng,
        radius: radius,
      },
      includedPrimaryTypes: [type],
      maxResultCount: Math.min(maxCount, 20),
    };

    try {
      const { places } = await google.maps.places.Place.searchNearby(request);
      return places || [];
    } catch (err) {
      console.warn('Nearby search error:', err);
      if (err.message && err.message.includes('not enabled')) {
        throw new Error('The Places API (New) is not enabled for your project. Please enable it in Google Cloud Console under APIs & Services > Library.');
      }
      return [];
    }
  }

  // ── Map Place objects to internal format ──
  function mapPlaceToResult(place) {
    // Normalize reviews to plain objects for spread compatibility
    const normalizedReviews = (place.reviews || []).map((r) => ({
      text: r.text || '',
      rating: r.rating || 0,
      relativePublishTimeDescription: r.relativePublishTimeDescription || '',
      authorAttribution: r.authorAttribution ? {
        displayName: r.authorAttribution.displayName || '',
        photoURI: r.authorAttribution.photoURI || '',
      } : null,
    }));

    // Extract latitude/longitude from place.location (LatLng object)
    const loc = place.location;
    const latitude = loc ? (typeof loc.lat === 'function' ? loc.lat() : loc.lat) : null;
    const longitude = loc ? (typeof loc.lng === 'function' ? loc.lng() : loc.lng) : null;

    return {
      name: place.displayName || '',
      address: place.formattedAddress || '',
      phone: place.nationalPhoneNumber || '',
      website: place.websiteURI || '',
      rating: place.rating || 0,
      reviewCount: place.userRatingCount || 0,
      status: place.businessStatus || 'UNKNOWN',
      mapsUrl: place.googleMapsURI || '',
      types: place.types || [],
      placeId: place.id || '',
      reviewData: normalizedReviews,
      photos: place.photos || [],
      hours: place.regularOpeningHours ? place.regularOpeningHours.weekdayDescriptions || [] : [],
      latitude: latitude,
      longitude: longitude,
    };
  }

  // ── Progress ──
  function updateProgress(pct, text) {
    progressBar.style.width = Math.round(pct) + '%';
    progressText.textContent = text;
  }

  // ── Display Results ──
  function showResults() {
    resultsSection.style.display = 'block';

    if (allResults.length === 0) {
      noResults.style.display = 'block';
      document.querySelector('.results-table-wrapper').style.display = 'none';
      document.querySelector('.filter-bar').style.display = 'none';
      resultsSummary.textContent = t('noWebsitesFound');
      return;
    }

    noResults.style.display = 'none';
    document.querySelector('.results-table-wrapper').style.display = 'block';
    document.querySelector('.filter-bar').style.display = 'flex';

    applyFilterAndSort();
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  function applyFilterAndSort() {
    const filter = filterInput.value.toLowerCase().trim();
    const sort = sortSelect.value;

    // Filter
    filteredResults = allResults.filter((r) => {
      if (!filter) return true;
      return r.name.toLowerCase().includes(filter) || r.address.toLowerCase().includes(filter);
    });

    // Sort
    filteredResults.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sort === 'reviews') return (b.reviewCount || 0) - (a.reviewCount || 0);
      return 0;
    });

    resultsSummary.textContent = t('showingResults', filteredResults.length, allResults.length);
    renderTable();
  }

  function renderTable() {
    resultsBody.innerHTML = '';

    filteredResults.forEach((place, idx) => {
      const tr = document.createElement('tr');

      // Business status display
      const statusText = place.status === 'OPERATIONAL' ? t('statusOpen') :
        place.status === 'CLOSED_TEMPORARILY' ? t('statusTempClosed') :
        place.status === 'CLOSED_PERMANENTLY' ? t('statusClosed') : t('statusUnknown');

      const statusClass = place.status === 'OPERATIONAL' ? 'success' :
        place.status === 'CLOSED_PERMANENTLY' ? 'danger' : 'warning';

      // Star rating
      const starsHtml = renderStars(place.rating);

      const mapsLink = place.mapsUrl
        ? `<a href="${escapeHtml(place.mapsUrl)}" target="_blank" rel="noopener" class="maps-link" title="Open in Google Maps">\u{1F4CD}</a>`
        : `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}" target="_blank" rel="noopener" class="maps-link" title="Search on Google Maps">\u{1F4CD}</a>`;

      const hasContent = (place.reviewData && place.reviewData.length > 0) || (place.photos && place.photos.length > 0) || place.description || (place.serviceOptions && place.serviceOptions.length > 0) || (place.amenities && place.amenities.length > 0) || (place.highlights && place.highlights.length > 0);
      const viewBtnHtml = hasContent
        ? `<button class="btn btn-view" data-idx="${idx}">${t('viewBtn')}</button>`
        : `<span style="color:var(--text-dim);font-size:12px">${t('noData')}</span>`;

      const isSaved = savedPlaceIds.has(place.placeId);
      const saveBtnHtml = isSaved
        ? `<span class="badge badge-saved">${t('savedBtn')}</span>`
        : `<button class="btn btn-save-row" data-idx="${idx}">${t('saveBtn')}</button>`;

      const fbProfile = (place.socialProfiles || []).find(p => p.platform === 'facebook');
      const igProfile = (place.socialProfiles || []).find(p => p.platform === 'instagram');
      const fbHtml = fbProfile
        ? `<a href="${escapeHtml(fbProfile.url)}" target="_blank" rel="noopener" class="social-profile-link social-facebook">${escapeHtml(fbProfile.handle || 'Facebook')}</a>`
        : `<span class="social-not-found">${t('socialNotFound')}</span>`;
      const igHtml = igProfile
        ? `<a href="${escapeHtml(igProfile.url)}" target="_blank" rel="noopener" class="social-profile-link social-instagram">${escapeHtml(igProfile.handle || 'Instagram')}</a>`
        : `<span class="social-not-found">${t('socialNotFound')}</span>`;

      tr.innerHTML = `
        <td class="td-center">${idx + 1}</td>
        <td><strong>${escapeHtml(place.name)}</strong></td>
        <td>${escapeHtml(place.address)}</td>
        <td>${escapeHtml(place.phone) || '<span style="color:var(--text-dim)">N/A</span>'}</td>
        <td class="td-center">
          <span class="stars">${starsHtml}</span>
          <span class="rating-num">${place.rating > 0 ? place.rating.toFixed(1) : 'N/A'}</span>
        </td>
        <td class="td-center">${place.reviewCount > 0 ? place.reviewCount.toLocaleString() : '0'}</td>
        <td><span class="badge badge-no-site">${t('noWebsite')}</span></td>
        <td class="td-center">${fbHtml}</td>
        <td class="td-center">${igHtml}</td>
        <td class="td-center">${viewBtnHtml}</td>
        <td class="td-center">${mapsLink}</td>
        <td class="td-center">${saveBtnHtml}</td>
      `;

      // Attach click handler for View button
      const viewBtn = tr.querySelector('.btn-view');
      if (viewBtn) {
        viewBtn.addEventListener('click', () => openDetailModal(place));
      }

      // Attach click handler for Save button
      const saveRowBtn = tr.querySelector('.btn-save-row');
      if (saveRowBtn) {
        saveRowBtn.addEventListener('click', async function () {
          if (!supabaseClient) {
            showToast(t('dbNotAvailable'), 'error');
            return;
          }
          this.disabled = true;
          this.textContent = t('savingBtn');
          const ok = await saveBusiness(place);
          if (ok) {
            this.outerHTML = `<span class="badge badge-saved">${t('savedBtn')}</span>`;
            showToast(t('saveRowSuccess', place.name), 'success');
          } else {
            this.textContent = t('saveError');
            this.disabled = false;
            showToast(t('saveRowError', place.name), 'error');
          }
        });
      }

      resultsBody.appendChild(tr);
    });
  }

  // ── Export CSV ──
  function exportCsv() {
    if (filteredResults.length === 0) return;

    const headers = ['#', t('thName'), t('thAddress'), t('thPhone'), t('thRating'), t('thReviews'), t('thStatus'), 'Yelp', 'Facebook', 'Instagram', 'Google Maps URL'].map(csvEscape);
    const rows = filteredResults.map((p, i) => {
      const socialUrls = {};
      (p.socialProfiles || []).forEach((sp) => { socialUrls[sp.platform] = sp.url; });
      return [
        i + 1,
        csvEscape(p.name),
        csvEscape(p.address),
        csvEscape(p.phone),
        p.rating || '',
        p.reviewCount || '',
        p.status || '',
        csvEscape(socialUrls.yelp || ''),
        csvEscape(socialUrls.facebook || ''),
        csvEscape(socialUrls.instagram || ''),
        p.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + p.address)}`,
      ];
    });

    let csv = headers.join(',') + '\n';
    rows.forEach((row) => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    const typeName = businessType.options[businessType.selectedIndex].text;
    a.download = `businesses-no-website-${typeName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Clear Results ──
  function clearResults() {
    allResults = [];
    filteredResults = [];
    resultsSection.style.display = 'none';
    progressSection.style.display = 'none';
    filterInput.value = '';
    resultsBody.innerHTML = '';
  }

  // ── Utility ──
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderStars(rating) {
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.5;
    let html = '';
    for (let i = 0; i < 5; i++) {
      if (i < full) html += '\u2605';
      else if (i === full && hasHalf) html += '<span class="star-half">\u2605</span>';
      else html += '\u2606';
    }
    return html;
  }

  function csvEscape(str) {
    if (!str) return '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  // ── Review Hash ──
  // Simple string hash for review deduplication (not cryptographic)
  function reviewHash(source, authorName, text) {
    const str = (source || '') + '|' + (authorName || '') + '|' + (text || '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash.toString(36);
  }

  // Map analyzeSentiment label to DB CHECK constraint format
  function sentimentLabelToDb(label) {
    const map = { 'very positive': 'very_positive', 'positive': 'positive', 'neutral': 'neutral', 'negative': 'negative' };
    return map[label] || 'neutral';
  }

  // ── Sentiment Analysis ──
  const positiveWords = [
    'amazing', 'awesome', 'best', 'beautiful', 'clean', 'delicious', 'excellent',
    'exceptional', 'fantastic', 'favorite', 'friendly', 'generous', 'genuine',
    'good', 'gorgeous', 'great', 'happy', 'helpful', 'impressed', 'incredible',
    'kind', 'love', 'loved', 'lovely', 'nice', 'outstanding', 'perfect',
    'phenomenal', 'pleasant', 'polite', 'professional', 'quality', 'recommend',
    'remarkable', 'satisfied', 'stellar', 'superb', 'terrific', 'top-notch',
    'welcoming', 'wonderful', 'worth'
  ];
  const negativeWords = [
    'awful', 'bad', 'cold', 'complaint', 'dirty', 'disappoint', 'disgusting',
    'dreadful', 'horrible', 'mediocre', 'never', 'overpriced', 'poor', 'rude',
    'slow', 'terrible', 'unfriendly', 'unprofessional', 'waste', 'worst'
  ];

  function analyzeSentiment(review) {
    if (!review || !review.text) return { score: 0, label: 'neutral' };

    const text = review.text.toLowerCase();
    const words = text.split(/\s+/);

    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach((word) => {
      const clean = word.replace(/[^a-z-]/g, '');
      if (positiveWords.includes(clean)) positiveCount++;
      if (negativeWords.includes(clean)) negativeCount++;
    });

    // Combine keyword sentiment with star rating
    const keywordScore = (positiveCount - negativeCount) / Math.max(words.length, 1);
    const ratingScore = ((review.rating || 3) - 3) / 2; // Normalize: 1=-1, 3=0, 5=1

    // Weighted: 40% keywords, 60% rating
    const score = (keywordScore * 0.4) + (ratingScore * 0.6);

    // Bonus for review length (longer reviews are more useful for websites)
    const lengthBonus = Math.min(text.length / 500, 0.2);

    const finalScore = score + lengthBonus;

    let label = 'neutral';
    if (finalScore > 0.15) label = 'positive';
    if (finalScore > 0.4) label = 'very positive';
    if (finalScore < -0.1) label = 'negative';

    return { score: finalScore, label, positiveCount, negativeCount };
  }

  function getTopReviews(reviewData, count) {
    if (!reviewData || reviewData.length === 0) return [];

    const scored = reviewData.map((review) => ({
      ...review,
      sentiment: analyzeSentiment(review),
    }));

    // Sort by sentiment score (best first), then filter to positive only
    scored.sort((a, b) => b.sentiment.score - a.sentiment.score);

    return scored
      .filter((r) => r.sentiment.label === 'positive' || r.sentiment.label === 'very positive')
      .slice(0, count);
  }

  // ── Photo URLs ──
  function getPhotoUrl(photo, maxWidth) {
    // Support both Google Places photo objects (with getURI) and SearchAPI URL objects
    if (!photo) return null;
    if (photo.getURI) return photo.getURI({ maxWidth: maxWidth || 600 });
    if (photo.url) return photo.url;
    if (typeof photo === 'string') return photo;
    return null;
  }

  // ── SearchAPI.io Search ──
  // Search via SearchAPI.io Google Maps endpoint (server-side proxy)
  async function searchViaSearchApi(type, lat, lng, radius, maxCount) {
    const allResults = [];
    const pagesNeeded = Math.ceil((maxCount || 20) / 20);

    for (let page = 1; page <= pagesNeeded; page++) {
      const params = new URLSearchParams({
        type: type,
        lat: lat,
        lng: lng,
        radius: radius,
      });
      if (page > 1) params.set('page', page);

      const res = await withTimeout(
        fetch('/api/search/maps?' + params.toString()),
        20000,
        'SearchAPI.io search'
      );

      if (res.status === 503) {
        throw new Error('SearchAPI key not configured');
      }

      if (!res.ok) {
        throw new Error('SearchAPI.io search failed: ' + res.status);
      }

      const data = await res.json();
      const results = data.results || [];
      allResults.push(...results);

      if (page > 1) {
        updateProgress(15 + Math.round((page / pagesNeeded) * 10), t('searchingPage', page, pagesNeeded));
      }

      // Stop if no more results or we have enough
      if (results.length === 0 || !data.hasMore || allResults.length >= maxCount) break;
    }

    return allResults.slice(0, maxCount);
  }

  // Determine if a business should be shown (no website or using social media as website)
  function shouldShowBusiness(place) {
    if (!place.website) return true;
    const w = place.website.toLowerCase();
    if (w.includes('facebook.com')) return true;
    if (w.includes('instagram.com')) return true;
    return false;
  }

  // ── Google Places Review Enrichment ──
  // Fetch reviews via Google Places JS API for businesses that lack review data
  async function enrichWithGoogleReviews(results) {
    const needsReviews = results.filter(p => p.placeId && (!p.reviewData || p.reviewData.length === 0));
    if (needsReviews.length === 0) return;

    updateProgress(92, t('fetchingReviews'));
    const batchSize = 3;
    let fetched = 0;

    for (let i = 0; i < needsReviews.length; i += batchSize) {
      const batch = needsReviews.slice(i, i + batchSize);
      await Promise.all(batch.map(async (place) => {
        try {
          const placeObj = new google.maps.places.Place({ id: place.placeId });
          await placeObj.fetchFields({ fields: ['reviews'] });

          if (placeObj.reviews && placeObj.reviews.length > 0) {
            place.reviewData = placeObj.reviews.map((r) => ({
              text: r.text || '',
              rating: r.rating || 0,
              relativePublishTimeDescription: r.relativePublishTimeDescription || '',
              authorAttribution: r.authorAttribution ? {
                displayName: r.authorAttribution.displayName || '',
                photoURI: r.authorAttribution.photoURI || '',
              } : null,
            }));

            // Save reviews to DB if business is already saved
            if (supabaseClient && savedPlaceIds.has(place.placeId)) {
              saveReviewsForBusiness(place).catch(err =>
                console.warn('Failed to save reviews for', place.name, err)
              );
            }
          }
          fetched++;
          updateProgress(92 + Math.round((fetched / needsReviews.length) * 3), t('fetchingReviewsProgress', fetched, needsReviews.length));
        } catch (err) {
          console.warn('Google review fetch failed for', place.name, err);
        }
      }));
    }
  }

  // Save reviews to business_reviews table for a place (used after Google review enrichment)
  async function saveReviewsForBusiness(place) {
    if (!supabaseClient || !place.placeId || !place.reviewData || place.reviewData.length === 0) return;

    const businessId = await getBusinessId(place.placeId);
    if (!businessId) return;

    const reviewRows = place.reviewData.map((r) => {
      const authorName = r.authorAttribution?.displayName || null;
      const reviewText = r.text || '';
      const sentiment = analyzeSentiment(r);
      return {
        business_id: businessId,
        source: 'google',
        author_name: authorName,
        author_photo_url: r.authorAttribution?.photoURI || null,
        rating: Math.max(1, Math.min(5, Math.round(r.rating || 3))),
        text: reviewText,
        published_at: r.relativePublishTimeDescription || '',
        sentiment_score: Math.round(sentiment.score * 10000) / 10000,
        sentiment_label: sentimentLabelToDb(sentiment.label),
        review_hash: reviewHash('google', authorName, reviewText),
      };
    });

    const { error } = await supabaseClient
      .from('business_reviews')
      .upsert(reviewRows, { onConflict: 'business_id,review_hash' });

    if (error) {
      console.warn('Review save error (non-fatal):', error);
    }
  }

  // ── Enrichment Pipeline ──
  // Runs after search results are displayed. Non-blocking background enrichment.
  async function runEnrichmentPipeline(results) {
    // Phase 1: Social discovery (existing Yelp + DuckDuckGo)
    enrichWithSocialProfiles(results).then(() => {
      renderTable();
    }).catch((err) => {
      console.warn('Social enrichment error:', err);
    });

    // Phase 2: Auto-save qualifying businesses to Supabase
    if (supabaseClient) {
      const toSave = results.filter((p) => !savedPlaceIds.has(p.placeId));
      if (toSave.length > 0) {
        updateProgress(96, t('autoSaving'));
        let savedCount = 0;
        for (const place of toSave) {
          const ok = await saveBusiness(place);
          if (ok) savedCount++;
        }
        if (savedCount > 0) {
          showToast(t('autoSaveComplete', savedCount), 'success');
          renderTable();
        }
      }
    }

    // Phase 3: Fetch reviews via Google Places JS API (for SearchAPI results that lack reviews)
    if (mapsLoaded) {
      await enrichWithGoogleReviews(results);
      renderTable();
    }

    // Phase 4: Enrich with SearchAPI.io place details (description, amenities)
    await enrichWithPlaceDetails(results);

    // Phase 5: Enrich with Facebook/Instagram data (after social discovery has run)
    await enrichWithSocialData(results);

    updateProgress(100, t('searchComplete'));
    renderTable();
  }

  // Enrich businesses with SearchAPI.io place details
  async function enrichWithPlaceDetails(results) {
    const batchSize = 3;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      await Promise.all(batch.map(async (place) => {
        // Skip if already has enriched data or no placeId
        if (place.enrichedData || !place.placeId) return;
        // Skip if SearchAPI already provided description (from search results)
        if (place.description && place.serviceOptions && place.serviceOptions.length > 0) return;
        try {
          const params = new URLSearchParams({ place_id: place.placeId });
          if (place.dataId) params.set('data_id', place.dataId);
          const res = await withTimeout(
            fetch('/api/enrich/place?' + params.toString()),
            15000,
            'Place enrichment'
          );
          if (res.ok) {
            const data = await res.json();
            place.enrichedData = data;
            // Merge enriched data into place object (don't overwrite existing)
            if (!place.description && data.description) place.description = data.description;
            if ((!place.serviceOptions || place.serviceOptions.length === 0) && data.serviceOptions) {
              place.serviceOptions = data.serviceOptions;
            }
            if ((!place.amenities || place.amenities.length === 0) && data.amenities) {
              place.amenities = data.amenities;
            }
            if ((!place.highlights || place.highlights.length === 0) && data.highlights) {
              place.highlights = data.highlights;
            }
            if (data.reviewsHistogram) place.reviewsHistogram = data.reviewsHistogram;
            if (data.popularTimes) place.popularTimes = data.popularTimes;

            // Update Supabase with enriched data
            if (supabaseClient && savedPlaceIds.has(place.placeId)) {
              updateBusinessEnrichedData(place).catch(err =>
                console.warn('Failed to update enriched data in DB:', err)
              );
            }
          }
        } catch (err) {
          console.warn('Place enrichment failed for', place.name, err);
        }
      }));
    }
  }

  // Enrich businesses that have discovered Facebook/Instagram profiles
  async function enrichWithSocialData(results) {
    const batchSize = 3;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      await Promise.all(batch.map(async (place) => {
        const profiles = place.socialProfiles || [];
        // Facebook enrichment
        const fb = profiles.find(p => p.platform === 'facebook');
        if (fb && fb.handle && !place.facebookData) {
          try {
            const res = await withTimeout(
              fetch('/api/enrich/facebook?username=' + encodeURIComponent(fb.handle)),
              15000,
              'Facebook enrichment'
            );
            if (res.ok) {
              place.facebookData = await res.json();
            }
          } catch (err) {
            console.warn('Facebook enrichment failed for', place.name, err);
          }
        }
        // Instagram enrichment
        const ig = profiles.find(p => p.platform === 'instagram');
        if (ig && ig.handle && !place.instagramData) {
          try {
            const res = await withTimeout(
              fetch('/api/enrich/instagram?username=' + encodeURIComponent(ig.handle)),
              15000,
              'Instagram enrichment'
            );
            if (res.ok) {
              place.instagramData = await res.json();
            }
          } catch (err) {
            console.warn('Instagram enrichment failed for', place.name, err);
          }
        }
      }));
    }
  }

  // Update Supabase business record with enriched data
  async function updateBusinessEnrichedData(place) {
    if (!supabaseClient || !place.placeId) return;
    const updates = {};
    if (place.description) updates.description = place.description;
    if (place.thumbnail) updates.thumbnail = place.thumbnail;
    if (place.priceLevel) updates.price_level = parseInt(place.priceLevel) || null;
    if (place.serviceOptions && place.serviceOptions.length > 0) updates.service_options = place.serviceOptions;
    if (place.amenities && place.amenities.length > 0) updates.amenities = place.amenities;
    if (place.highlights && place.highlights.length > 0) updates.highlights = place.highlights;
    if (place.accessibility && place.accessibility.length > 0) updates.accessibility_info = place.accessibility.join(', ');
    if (Object.keys(updates).length === 0) return;

    await supabaseClient
      .from('businesses')
      .update(updates)
      .eq('place_id', place.placeId);
  }

  // ── Social Media Discovery ──
  const SOCIAL_PLATFORMS = [
    { id: 'facebook', nameKey: 'platformFacebook', icon: '\uD83D\uDCD8', domain: 'facebook.com' },
    { id: 'instagram', nameKey: 'platformInstagram', icon: '\uD83D\uDCF7', domain: 'instagram.com' },
    { id: 'whatsapp', nameKey: 'platformWhatsapp', icon: '\uD83D\uDCAC', domain: 'wa.me' },
    { id: 'twitter', nameKey: 'platformTwitter', icon: '\uD83D\uDCAD', domain: 'x.com' },
    { id: 'tiktok', nameKey: 'platformTiktok', icon: '\uD83C\uDFB5', domain: 'tiktok.com' },
    { id: 'linkedin', nameKey: 'platformLinkedin', icon: '\uD83D\uDCBC', domain: 'linkedin.com' },
    { id: 'youtube', nameKey: 'platformYoutube', icon: '\u25B6\uFE0F', domain: 'youtube.com' },
    { id: 'yelp', nameKey: 'platformYelp', icon: '\u2B50', domain: 'yelp.com' },
    { id: 'tripadvisor', nameKey: 'platformTripadvisor', icon: '\uD83E\uDDED', domain: 'tripadvisor.com' },
    { id: 'opentable', nameKey: 'platformOpentable', icon: '\uD83C\uDF7D\uFE0F', domain: 'opentable.com' },
    { id: 'resy', nameKey: 'platformResy', icon: '\uD83D\uDCCB', domain: 'resy.com' },
    { id: 'doordash', nameKey: 'platformDoordash', icon: '\uD83D\uDE97', domain: 'doordash.com' },
    { id: 'ubereats', nameKey: 'platformUbereats', icon: '\uD83C\uDF54', domain: 'ubereats.com' },
    { id: 'grubhub', nameKey: 'platformGrubhub', icon: '\uD83C\uDF71', domain: 'grubhub.com' },
  ];

  function buildSearchUrl(platform, businessName, businessAddress) {
    const q = encodeURIComponent(businessName + ' ' + businessAddress);
    const name = encodeURIComponent(businessName);
    // Extract city from address (first part before first comma, or full address)
    const city = businessAddress.split(',')[0].trim();
    const loc = encodeURIComponent(city);

    switch (platform) {
      case 'facebook': return 'https://www.facebook.com/search/pages/?q=' + q;
      case 'instagram': return 'https://www.google.com/search?q=' + encodeURIComponent(businessName + ' ' + city + ' instagram');
      case 'whatsapp': return 'https://www.google.com/search?q=' + encodeURIComponent(businessName + ' ' + city + ' whatsapp');
      case 'twitter': return 'https://www.google.com/search?q=' + encodeURIComponent(businessName + ' ' + city + ' site:x.com OR site:twitter.com');
      case 'tiktok': return 'https://www.google.com/search?q=' + encodeURIComponent(businessName + ' ' + city + ' site:tiktok.com');
      case 'linkedin': return 'https://www.google.com/search?q=' + encodeURIComponent(businessName + ' ' + city + ' site:linkedin.com');
      case 'youtube': return 'https://www.youtube.com/results?search_query=' + name;
      case 'yelp': return 'https://www.yelp.com/search?find_desc=' + name + '&find_loc=' + loc;
      case 'tripadvisor': return 'https://www.tripadvisor.com/Search?q=' + q;
      case 'opentable': return 'https://www.opentable.com/s?term=' + name + '&queryUnderstandingType=location&locationString=' + loc;
      case 'resy': return 'https://www.google.com/search?q=' + encodeURIComponent(businessName + ' ' + city + ' site:resy.com');
      case 'doordash': return 'https://www.doordash.com/search/store/' + name;
      case 'ubereats': return 'https://www.google.com/search?q=' + encodeURIComponent(businessName + ' ' + city + ' site:ubereats.com');
      case 'grubhub': return 'https://www.grubhub.com/search?queryText=' + name;
      default: return 'https://www.google.com/search?q=' + q;
    }
  }

  function extractHandleFromUrl(platform, url) {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      const path = parsed.pathname.replace(/\/$/, '');
      const segments = path.split('/').filter(Boolean);
      switch (platform) {
        case 'facebook':
        case 'instagram':
        case 'twitter':
        case 'tiktok':
        case 'linkedin':
        case 'youtube':
          // Last meaningful segment is typically the handle
          return segments.length > 0 ? segments[segments.length - 1].replace(/^@/, '') : '';
        default:
          return '';
      }
    } catch (_) {
      return '';
    }
  }

  // ── Social Auto-Discovery (Yelp API) ──
  // Platform icon SVGs (inline for zero-dependency rendering)
  const SOCIAL_ICONS = {
    yelp: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.271 6.997c-.263 3.6-.681 5.632-1.554 5.632-.192 0-.417-.085-.661-.254L6.59 9.834c-.748-.516-.88-1.2-.355-1.838.526-.637 2.009-1.782 3.236-2.502.765-.449 1.395-.49 1.823-.118.284.247.248.788-.023 1.621zm-2.225 8.592c.206-.134.482-.2.807-.2.855 0 1.618.525 1.699.612l3.01 3.345c.542.638.453 1.338-.243 1.883a10.146 10.146 0 0 1-3.643 1.619c-.86.212-1.447-.026-1.67-.593l-1.255-3.91c-.268-.833.154-1.487 1.295-2.756zm5.96-2.461l3.773-1.367c.825-.278 1.431-.067 1.63.563a10.15 10.15 0 0 1-.104 3.99c-.228.847-.766 1.196-1.488.96l-3.828-1.186c-.9-.279-1.217-.864-1.042-1.628.138-.612.55-1.12 1.059-1.332zm-.34-2.138l-3.808-1.27c-.868-.291-1.16-.882-.96-1.638.16-.606.587-1.1 1.1-1.296l3.754-1.445c.823-.295 1.435-.095 1.647.536a10.151 10.151 0 0 1 .022 3.994c-.213.852-.762 1.213-1.495.986l-.26-.087v.22zm-5.49 3.858c.867.113 1.308.614 1.308 1.414 0 .175-.018.362-.052.558l-.722 3.981c-.16.814-.69 1.155-1.476.925a10.063 10.063 0 0 1-3.3-2.088c-.615-.614-.692-1.262-.21-1.793l2.808-2.825c.31-.31.547-.343 1.644-.172z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
  };

  const SOCIAL_COLORS = {
    yelp: '#d32323',
    facebook: '#1877f2',
    instagram: '#e4405f',
  };

  // Discover social profiles for a business via serverless proxy
  async function discoverSocialProfiles(place) {
    const profiles = [];

    // Discover all platforms via the serverless proxy (Yelp, Facebook, Instagram)
    try {
      const params = new URLSearchParams({
        name: place.name,
        address: place.address,
        phone: place.phone || '',
      });
      if (place.latitude && place.longitude) {
        params.set('latitude', place.latitude);
        params.set('longitude', place.longitude);
      }

      const res = await withTimeout(
        fetch('/api/social/discover?' + params.toString()),
        15000,
        'Social discovery'
      );

      if (res.ok) {
        const data = await res.json();
        if (data.yelp) {
          profiles.push({
            platform: 'yelp',
            url: data.yelp.url,
            handle: data.yelp.alias || null,
            rating: data.yelp.rating || null,
            reviewCount: data.yelp.review_count || null,
          });
        }
        if (data.facebook) {
          profiles.push({
            platform: 'facebook',
            url: data.facebook.url,
            handle: data.facebook.handle || null,
          });
        }
        if (data.instagram) {
          profiles.push({
            platform: 'instagram',
            url: data.instagram.url,
            handle: data.instagram.handle || null,
          });
        }
      }
    } catch (err) {
      console.warn('Social discovery failed:', err);
    }

    return profiles;
  }

  // Enrich all search results with social profiles (called after search completes)
  async function enrichWithSocialProfiles(results) {
    const batchSize = 5;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      await Promise.all(batch.map(async (place) => {
        if (!place.socialProfiles) {
          place.socialProfiles = await discoverSocialProfiles(place);
        }
      }));
    }
  }

  // Save discovered social profiles to Supabase (bulk)
  async function saveDiscoveredProfiles(businessId, profiles) {
    if (!supabaseClient || !businessId || !profiles || profiles.length === 0) return;

    const rows = profiles.map((p) => ({
      business_id: businessId,
      platform: p.platform,
      url: p.url || null,
      handle: p.handle || null,
    }));

    const { error } = await supabaseClient
      .from('business_social_profiles')
      .upsert(rows, { onConflict: 'business_id,platform' });

    if (error) {
      console.warn('Social profile save error (non-fatal):', error);
    }
  }

  // Build social icons HTML for table rows (compact)
  function buildSocialIconsHtml(profiles) {
    if (!profiles || profiles.length === 0) {
      return '<span style="color:var(--text-dim);font-size:11px">\u2014</span>';
    }

    return profiles.map((p) => {
      const icon = SOCIAL_ICONS[p.platform] || '';
      const color = SOCIAL_COLORS[p.platform] || 'var(--text-muted)';
      const title = p.platform === 'yelp' && p.rating
        ? t('socialYelpRating', p.rating)
        : t('socialViewOn', p.platform.charAt(0).toUpperCase() + p.platform.slice(1));
      return `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener" class="social-icon-link" title="${escapeHtml(title)}" style="color:${color}">${icon}</a>`;
    }).join('');
  }

  // ── Social Profile Supabase Operations ──
  async function getBusinessId(placeId) {
    if (!supabaseClient) return null;
    try {
      const { data } = await supabaseClient
        .from('businesses')
        .select('id')
        .eq('place_id', placeId)
        .single();
      return data ? data.id : null;
    } catch (_) {
      return null;
    }
  }

  async function loadSocialProfiles(businessId) {
    if (!supabaseClient || !businessId) return [];
    try {
      const { data, error } = await supabaseClient
        .from('business_social_profiles')
        .select('*')
        .eq('business_id', businessId)
        .order('platform');
      if (error) {
        console.warn('Load social profiles error:', error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('Load social profiles exception:', e);
      return [];
    }
  }

  async function saveSocialProfile(businessId, platform, url) {
    if (!supabaseClient || !businessId) return false;
    try {
      const handle = extractHandleFromUrl(platform, url);
      const { error } = await supabaseClient
        .from('business_social_profiles')
        .upsert({
          business_id: businessId,
          platform: platform,
          url: url,
          handle: handle || null,
        }, { onConflict: 'business_id,platform' });
      if (error) {
        console.error('Save social profile error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Save social profile exception:', e);
      return false;
    }
  }

  async function deleteSocialProfile(profileId) {
    if (!supabaseClient || !profileId) return false;
    try {
      const { error } = await supabaseClient
        .from('business_social_profiles')
        .delete()
        .eq('id', profileId);
      if (error) {
        console.error('Delete social profile error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Delete social profile exception:', e);
      return false;
    }
  }

  // ── Detail Modal ──
  async function openDetailModal(place) {
    // Remove existing modal if any
    const existing = document.getElementById('detail-modal');
    if (existing) existing.remove();

    const topReviews = getTopReviews(place.reviewData, 5);
    const photos = (place.photos || []).slice(0, 8);

    const modal = document.createElement('div');
    modal.id = 'detail-modal';
    modal.className = 'modal-overlay';

    // Build photo gallery HTML
    let photosHtml = '';
    if (photos.length > 0) {
      const photoItems = photos.map((photo) => {
        const url = getPhotoUrl(photo, 600);
        if (!url) return '';
        return `<div class="photo-item"><img src="${url}" alt="Business photo" loading="lazy"></div>`;
      }).filter(Boolean).join('');

      if (photoItems) {
        photosHtml = `
          <div class="modal-section">
            <h3>${t('photos')}</h3>
            <div class="photo-gallery">${photoItems}</div>
          </div>
        `;
      }
    }

    // Build reviews HTML
    let reviewsHtml = '';
    if (topReviews.length > 0) {
      const reviewItems = topReviews.map((review) => {
        const stars = '\u2605'.repeat(Math.floor(review.rating)) + '\u2606'.repeat(5 - Math.floor(review.rating));
        const sentimentBadge = review.sentiment.label === 'very positive'
          ? `<span class="sentiment-badge sentiment-great">${t('topPick')}</span>`
          : `<span class="sentiment-badge sentiment-good">${t('good')}</span>`;
        const timeAgo = review.relativePublishTimeDescription || '';
        const authorName = review.authorAttribution ? review.authorAttribution.displayName || 'Anonymous' : 'Anonymous';
        const authorPhoto = review.authorAttribution ? review.authorAttribution.photoURI : null;
        return `
          <div class="review-card">
            <div class="review-header">
              <div class="review-author">
                ${authorPhoto ? `<img src="${escapeHtml(authorPhoto)}" alt="" class="review-avatar">` : '<div class="review-avatar-placeholder"></div>'}
                <div>
                  <strong>${escapeHtml(authorName)}</strong>
                  <span class="review-time">${escapeHtml(timeAgo)}</span>
                </div>
              </div>
              <div class="review-meta">
                <span class="stars">${stars}</span>
                ${sentimentBadge}
              </div>
            </div>
            <p class="review-text">${escapeHtml(review.text)}</p>
          </div>
        `;
      }).join('');

      reviewsHtml = `
        <div class="modal-section">
          <h3>${t('topReviewsTitle')}</h3>
          <p class="section-subtitle">${t('topReviewsSubtitle')}</p>
          <div class="reviews-list">${reviewItems}</div>
        </div>
      `;
    } else {
      reviewsHtml = `
        <div class="modal-section">
          <h3>${t('reviewsTitle')}</h3>
          <p class="section-subtitle" style="color:var(--text-dim)">${t('noReviewsAvailable')}</p>
        </div>
      `;
    }

    // Build hours HTML
    let hoursHtml = '';
    if (place.hours && place.hours.length > 0) {
      const hourItems = place.hours.map((h) => `<li>${escapeHtml(h)}</li>`).join('');
      hoursHtml = `
        <div class="modal-section">
          <h3>${t('businessHours')}</h3>
          <ul class="hours-list">${hourItems}</ul>
        </div>
      `;
    }

    // Star rating display
    const starsHtml = renderStars(place.rating);

    // Build description HTML
    let descriptionHtml = '';
    if (place.description) {
      descriptionHtml = `
        <div class="modal-section">
          <h3>${t('businessDescription')}</h3>
          <p class="business-description-text">${escapeHtml(place.description)}</p>
        </div>
      `;
    }

    // Build price level HTML
    let priceHtml = '';
    if (place.priceLevel || place.priceDescription) {
      const priceDisplay = place.priceDescription || place.priceLevel || '';
      priceHtml = `<span class="meta-sep">|</span><span>${escapeHtml(String(priceDisplay))}</span>`;
    }

    // Build service options HTML
    let serviceOptionsHtml = '';
    if (place.serviceOptions && place.serviceOptions.length > 0) {
      const tags = place.serviceOptions.map(f => `<span class="feature-tag">${escapeHtml(f)}</span>`).join('');
      serviceOptionsHtml = `
        <div class="modal-section">
          <h3>${t('serviceOptionsTitle')}</h3>
          <div class="features-grid">${tags}</div>
        </div>
      `;
    }

    // Build highlights HTML
    let highlightsHtml = '';
    if (place.highlights && place.highlights.length > 0) {
      const tags = place.highlights.map(f => `<span class="feature-tag feature-tag-highlight">${escapeHtml(f)}</span>`).join('');
      highlightsHtml = `
        <div class="modal-section">
          <h3>${t('highlightsTitle')}</h3>
          <div class="features-grid">${tags}</div>
        </div>
      `;
    }

    // Build amenities HTML
    let amenitiesHtml = '';
    if (place.amenities && place.amenities.length > 0) {
      const tags = place.amenities.map(f => `<span class="feature-tag">${escapeHtml(f)}</span>`).join('');
      amenitiesHtml = `
        <div class="modal-section">
          <h3>${t('businessAmenities')}</h3>
          <div class="features-grid">${tags}</div>
        </div>
      `;
    }

    // Build accessibility HTML
    let accessibilityHtml = '';
    if (place.accessibility && place.accessibility.length > 0) {
      const tags = place.accessibility.map(f => `<span class="feature-tag feature-tag-accessibility">${escapeHtml(f)}</span>`).join('');
      accessibilityHtml = `
        <div class="modal-section">
          <h3>${t('accessibilityTitle')}</h3>
          <div class="features-grid">${tags}</div>
        </div>
      `;
    }

    // Build review histogram HTML
    let histogramHtml = '';
    if (place.reviewsHistogram) {
      const h = place.reviewsHistogram;
      const total = (h['1'] || 0) + (h['2'] || 0) + (h['3'] || 0) + (h['4'] || 0) + (h['5'] || 0);
      if (total > 0) {
        const rows = [5, 4, 3, 2, 1].map(star => {
          const count = h[star] || 0;
          const pct = Math.round((count / total) * 100);
          return `
            <div class="histogram-row">
              <span class="histogram-star">${star}</span>
              <div class="histogram-bar-track">
                <div class="histogram-bar-fill" style="width:${pct}%"></div>
              </div>
              <span class="histogram-count">${count.toLocaleString()}</span>
            </div>
          `;
        }).join('');
        histogramHtml = `
          <div class="modal-section">
            <h3>${t('reviewBreakdown')}</h3>
            <div class="review-histogram">${rows}</div>
          </div>
        `;
      }
    }

    // Build Facebook profile HTML
    let facebookHtml = '';
    if (place.facebookData) {
      const fb = place.facebookData;
      const fbPhotos = [];
      if (fb.coverPhoto) fbPhotos.push(`<img src="${escapeHtml(fb.coverPhoto)}" alt="Cover photo" class="social-cover-photo">`);
      facebookHtml = `
        <div class="modal-section">
          <h3>${t('facebookProfile')}</h3>
          <div class="social-profile-card">
            <div class="social-profile-card-header">
              ${fb.profilePhoto ? `<img src="${escapeHtml(fb.profilePhoto)}" alt="" class="social-profile-avatar">` : ''}
              <div>
                <strong>${escapeHtml(fb.name || place.name)}</strong>
                ${fb.category && fb.category.length > 0 ? `<span class="social-profile-category">${escapeHtml(Array.isArray(fb.category) ? fb.category.join(', ') : fb.category)}</span>` : ''}
                ${fb.followers ? `<span class="social-profile-followers">${t('followers', fb.followers.toLocaleString())}</span>` : ''}
              </div>
            </div>
            ${fbPhotos.join('')}
            ${fb.ratingsText ? `<p class="social-profile-rating">${escapeHtml(fb.ratingsText)}</p>` : ''}
          </div>
        </div>
      `;
    }

    // Build Instagram profile HTML
    let instagramHtml = '';
    if (place.instagramData) {
      const ig = place.instagramData;
      const igPostsGrid = (ig.posts || []).slice(0, 6).map(post =>
        post.thumbnail ? `<a href="${escapeHtml(post.permalink)}" target="_blank" rel="noopener" class="ig-post-item"><img src="${escapeHtml(post.thumbnail)}" alt="${escapeHtml(post.caption || '').substring(0, 50)}" loading="lazy"></a>` : ''
      ).filter(Boolean).join('');

      instagramHtml = `
        <div class="modal-section">
          <h3>${t('instagramProfile')}</h3>
          <div class="social-profile-card">
            <div class="social-profile-card-header">
              ${ig.avatar ? `<img src="${escapeHtml(ig.avatar)}" alt="" class="social-profile-avatar">` : ''}
              <div>
                <strong>@${escapeHtml(ig.username || '')}</strong>
                ${ig.followerCount ? `<span class="social-profile-followers">${t('followers', ig.followerCount.toLocaleString())}</span>` : ''}
              </div>
            </div>
            ${ig.bio ? `<p class="social-profile-bio">${escapeHtml(ig.bio)}</p>` : ''}
            ${igPostsGrid ? `<div class="ig-posts-grid">${igPostsGrid}</div>` : ''}
          </div>
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h2>${escapeHtml(place.name)}</h2>
            <p class="modal-address">${escapeHtml(place.address)}</p>
            <div class="modal-meta">
              <span class="stars">${starsHtml}</span>
              <span>${place.rating > 0 ? place.rating.toFixed(1) : 'N/A'}</span>
              <span class="meta-sep">|</span>
              <span>${place.reviewCount > 0 ? place.reviewCount.toLocaleString() + ' ' + t('reviews') : t('noReviews')}</span>
              ${priceHtml}
              ${place.phone ? `<span class="meta-sep">|</span><span>${escapeHtml(place.phone)}</span>` : ''}
            </div>
          </div>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          ${descriptionHtml}
          ${photosHtml}
          ${serviceOptionsHtml}
          ${highlightsHtml}
          ${amenitiesHtml}
          ${accessibilityHtml}
          ${histogramHtml}
          ${reviewsHtml}
          ${hoursHtml}
          ${facebookHtml}
          ${instagramHtml}
          <div class="modal-section" id="social-profiles-section">
            <h3>${t('socialProfiles')}</h3>
            <p class="section-subtitle">${t('socialProfilesSubtitle')}</p>
            <div id="social-profiles-content">
              <div class="social-profiles-loading"><span class="spinner"></span></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-copy-reviews">${t('copyTopReviews')}</button>
          <button class="btn btn-primary" id="modal-close-btn-footer">${t('closeBtn')}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    function escHandler(e) {
      if (e.key === 'Escape') closeModal();
    }
    const closeModal = () => {
      document.removeEventListener('keydown', escHandler);
      modal.remove();
    };
    modal.querySelector('#modal-close-btn').addEventListener('click', closeModal);
    modal.querySelector('#modal-close-btn-footer').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', escHandler);

    // Copy reviews button
    modal.querySelector('#modal-copy-reviews').addEventListener('click', () => {
      if (topReviews.length === 0) return;
      const text = topReviews.map((r) =>
        `"${r.text}"\n— ${r.authorAttribution ? r.authorAttribution.displayName || 'Anonymous' : 'Anonymous'}, ${'\u2605'.repeat(r.rating)} (${r.rating}/5)`
      ).join('\n\n');
      navigator.clipboard.writeText(text).then(() => {
        const btn = modal.querySelector('#modal-copy-reviews');
        btn.textContent = t('copied');
        setTimeout(() => { btn.textContent = t('copyTopReviews'); }, 2000);
      });
    });

    // Load social profiles asynchronously
    initSocialProfilesSection(modal, place);
  }

  // ── Social Profiles Section Logic ──
  async function initSocialProfilesSection(modal, place) {
    const container = modal.querySelector('#social-profiles-content');
    if (!container) return;

    const isSaved = savedPlaceIds.has(place.placeId);

    if (!isSaved) {
      // Business not saved — show prompt to save first
      container.innerHTML = `
        <p class="social-save-prompt">${t('saveToDatabaseFirst')}</p>
        <button class="btn btn-primary" id="social-save-db-btn">${t('saveToDatabaseBtn')}</button>
        ${buildSearchLinksHtml(place, [])}
      `;
      const saveBtn = container.querySelector('#social-save-db-btn');
      saveBtn.addEventListener('click', async () => {
        if (!supabaseClient) {
          showToast(t('dbNotAvailable'), 'error');
          return;
        }
        saveBtn.disabled = true;
        saveBtn.textContent = t('savingBtn');
        const ok = await saveBusiness(place);
        if (ok) {
          showToast(t('saveRowSuccess', place.name), 'success');
          // Re-render the social profiles section now that business is saved
          initSocialProfilesSection(modal, place);
        } else {
          saveBtn.textContent = t('saveToDatabaseBtn');
          saveBtn.disabled = false;
          showToast(t('saveRowError', place.name), 'error');
        }
      });
      attachSearchLinkHandlers(container);
      return;
    }

    // Business is saved — load existing profiles
    const businessId = await getBusinessId(place.placeId);
    if (!businessId) {
      container.innerHTML = `<p class="social-save-prompt">${t('saveToDatabaseFirst')}</p>`;
      return;
    }

    const profiles = await loadSocialProfiles(businessId);
    renderSocialProfiles(container, place, businessId, profiles);
  }

  function renderSocialProfiles(container, place, businessId, profiles) {
    const linkedPlatforms = profiles.map((p) => p.platform);
    const unlinkedPlatforms = SOCIAL_PLATFORMS.filter((p) => !linkedPlatforms.includes(p.id));

    // Linked profiles list
    let linkedHtml = '';
    if (profiles.length > 0) {
      const items = profiles.map((profile) => {
        const platConfig = SOCIAL_PLATFORMS.find((p) => p.id === profile.platform);
        const icon = platConfig ? platConfig.icon : '\uD83C\uDF10';
        const name = platConfig ? t(platConfig.nameKey) : profile.platform;
        return `
          <div class="social-profile-item" data-profile-id="${escapeHtml(profile.id)}">
            <span class="social-profile-icon">${icon}</span>
            <div class="social-profile-info">
              <strong>${escapeHtml(name)}</strong>
              <a href="${escapeHtml(profile.url)}" target="_blank" rel="noopener" class="social-profile-url">${escapeHtml(profile.url)}</a>
              ${profile.handle ? `<span class="social-profile-handle">@${escapeHtml(profile.handle)}</span>` : ''}
            </div>
            <button class="btn btn-social-remove" data-profile-id="${escapeHtml(profile.id)}" title="${t('removeProfile')}">&times;</button>
          </div>
        `;
      }).join('');
      linkedHtml = `<div class="social-profiles-list">${items}</div>`;
    } else {
      linkedHtml = `<p class="social-no-profiles">${t('noProfilesYet')}</p>`;
    }

    // Add profile form
    const platformOptions = unlinkedPlatforms.map((p) =>
      `<option value="${p.id}">${t(p.nameKey)}</option>`
    ).join('');

    const addFormHtml = unlinkedPlatforms.length > 0 ? `
      <div class="social-add-form" id="social-add-form">
        <div class="social-add-row">
          <select class="input social-add-select" id="social-platform-select">
            <option value="">${t('selectPlatform')}</option>
            ${platformOptions}
          </select>
          <input type="url" class="input social-add-input" id="social-url-input" placeholder="${t('profileUrlLabel')}">
          <button class="btn btn-primary social-add-btn" id="social-add-btn">${t('saveProfile')}</button>
        </div>
      </div>
    ` : '';

    // Search links
    const searchLinksHtml = buildSearchLinksHtml(place, linkedPlatforms);

    container.innerHTML = linkedHtml + addFormHtml + searchLinksHtml;

    // Attach delete handlers
    container.querySelectorAll('.btn-social-remove').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const profileId = btn.getAttribute('data-profile-id');
        btn.disabled = true;
        const ok = await deleteSocialProfile(profileId);
        if (ok) {
          showToast(t('profileRemoved'), 'success');
          const updated = await loadSocialProfiles(businessId);
          renderSocialProfiles(container, place, businessId, updated);
        } else {
          btn.disabled = false;
          showToast(t('profileRemoveError'), 'error');
        }
      });
    });

    // Attach add handler
    const addBtn = container.querySelector('#social-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', async () => {
        const platformSelect = container.querySelector('#social-platform-select');
        const urlInput = container.querySelector('#social-url-input');
        const platform = platformSelect.value;
        const url = urlInput.value.trim();

        if (!platform) return;
        if (!url) {
          showToast(t('profileUrlRequired'), 'warning');
          return;
        }

        addBtn.disabled = true;
        addBtn.textContent = t('savingBtn');
        const ok = await saveSocialProfile(businessId, platform, url);
        if (ok) {
          showToast(t('profileSaved'), 'success');
          const updated = await loadSocialProfiles(businessId);
          renderSocialProfiles(container, place, businessId, updated);
        } else {
          addBtn.disabled = false;
          addBtn.textContent = t('saveProfile');
          showToast(t('profileSaveError'), 'error');
        }
      });
    }

    attachSearchLinkHandlers(container);
  }

  function buildSearchLinksHtml(place, linkedPlatforms) {
    const unlinked = SOCIAL_PLATFORMS.filter((p) => !linkedPlatforms.includes(p.id));
    if (unlinked.length === 0) return '';

    const links = unlinked.map((p) => {
      const searchUrl = buildSearchUrl(p.id, place.name, place.address);
      return `
        <a href="${escapeHtml(searchUrl)}" target="_blank" rel="noopener" class="social-search-link" data-platform="${p.id}">
          <span class="social-search-icon">${p.icon}</span>
          <span>${t(p.nameKey)}</span>
        </a>
      `;
    }).join('');

    return `
      <div class="social-search-section">
        <h4>${t('searchPlatforms')}</h4>
        <p class="section-subtitle">${t('searchPlatformsSubtitle')}</p>
        <div class="social-search-grid">${links}</div>
      </div>
    `;
  }

  function attachSearchLinkHandlers(container) {
    // No extra handlers needed — links use target="_blank" natively
  }

  // ── Start ──
  init();
})();
