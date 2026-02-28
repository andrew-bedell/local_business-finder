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
      helpStep3: 'Enable the <strong>Places API</strong> and <strong>Maps JavaScript API</strong>',
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
      thCreateSite: 'Create Site',
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
      createSiteBtn: 'Create Site',
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
      mapsLoadFailed: 'Failed to load Google Maps. Check your API key and ensure Places API is enabled.',
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
      // Generated website
      genGetInTouch: 'Get in Touch',
      genWelcome: 'Welcome',
      genWelcomeSub: 'Your trusted local business serving the community',
      genCallUs: 'Call Us',
      genVisitUs: 'Visit Us',
      genHighlyRated: 'Highly Rated',
      genStarsFrom: '{0} stars from {1} reviews',
      genDirections: 'Directions',
      genOpenMaps: 'Open in Google Maps',
      genCustomersSay: 'What Our Customers Say',
      genRealReviews: 'Real reviews from real customers',
      genGallery: 'Gallery',
      genGallerySub: 'Take a look around',
      genBusinessHours: 'Business Hours',
      genHoursSub: 'Come see us during our operating hours',
      genContactUs: 'Contact Us',
      genContactSub: "We'd love to hear from you",
      genAllRights: 'All rights reserved.',
      genAbout: 'About',
      genContact: 'Contact',
      genHours: 'Hours',
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
      helpStep3: 'Habilita la <strong>Places API</strong> y la <strong>Maps JavaScript API</strong>',
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
      thCreateSite: 'Crear Sitio',
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
      createSiteBtn: 'Crear Sitio',
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
      mapsLoadFailed: 'Error al cargar Google Maps. Verifica tu clave API y asegúrate de que la Places API esté habilitada.',
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
      // Generated website
      genGetInTouch: 'Contáctanos',
      genWelcome: 'Bienvenidos',
      genWelcomeSub: 'Tu negocio local de confianza al servicio de la comunidad',
      genCallUs: 'Llámanos',
      genVisitUs: 'Visítanos',
      genHighlyRated: 'Altamente Calificado',
      genStarsFrom: '{0} estrellas de {1} reseñas',
      genDirections: 'Cómo Llegar',
      genOpenMaps: 'Abrir en Google Maps',
      genCustomersSay: 'Lo Que Dicen Nuestros Clientes',
      genRealReviews: 'Reseñas reales de clientes reales',
      genGallery: 'Galería',
      genGallerySub: 'Echa un vistazo',
      genBusinessHours: 'Horario de Atención',
      genHoursSub: 'Visítanos durante nuestro horario de atención',
      genContactUs: 'Contáctanos',
      genContactSub: 'Nos encantaría saber de ti',
      genAllRights: 'Todos los derechos reservados.',
      genAbout: 'Acerca de',
      genContact: 'Contacto',
      genHours: 'Horario',
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

  // ── State ──
  let apiKey = localStorage.getItem('google_places_api_key') || '';
  let map = null;
  let placesService = null;
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
    if (apiKey) {
      apiKeyInput.value = '••••••••••••••••••••';
      loadGoogleMaps(apiKey);
    }

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
  function loadGoogleMaps(key) {
    if (mapsLoaded) {
      initServices();
      return;
    }

    // Remove any existing script
    const existing = document.querySelector('script[src*="maps.googleapis"]');
    if (existing) existing.remove();

    window._gmapsCallback = function () {
      mapsLoaded = true;
      initServices();
      showApiStatus(t('mapsLoaded'), 'success');
      updateSearchButton();
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=_gmapsCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      showApiStatus(t('mapsLoadFailed'), 'error');
    };
    document.head.appendChild(script);
  }

  function initServices() {
    // Create a hidden map div (required by PlacesService)
    let mapDiv = document.getElementById('hidden-map');
    if (!mapDiv) {
      mapDiv = document.createElement('div');
      mapDiv.id = 'hidden-map';
      mapDiv.style.display = 'none';
      document.body.appendChild(mapDiv);
    }
    map = new google.maps.Map(mapDiv, { center: { lat: 0, lng: 0 }, zoom: 2 });
    placesService = new google.maps.places.PlacesService(map);
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

      // Step 2: Search for businesses nearby
      const places = await searchPlaces(coords.latLng, type, radius, maxCount);
      if (places.length === 0) {
        updateProgress(100, t('noBusinessesFound'));
        resetSearchButton();
        return;
      }

      updateProgress(30, t('foundBusinesses', places.length));

      // Step 3: Get details for each place (to check for website)
      const detailedPlaces = await getPlaceDetails(places, 30, 95);

      // Step 4: Filter to only those without websites
      const noWebsite = detailedPlaces.filter((p) => !p.website);
      allResults = noWebsite;

      updateProgress(100, t('searchComplete'));
      progressStats.textContent = t('progressStatsText', places.length, noWebsite.length);

      // Show results
      showResults();
    } catch (err) {
      console.error('Search error:', err);
      updateProgress(0, `Error: ${err.message || 'An unexpected error occurred.'}`);
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

  // ── Geocoding ──
  function geocodeLocation(address) {
    const country = countrySelect.value;
    return new Promise((resolve) => {
      geocoder.geocode(
        { address, componentRestrictions: { country } },
        (results, status) => {
          if (status === 'OK' && results.length > 0) {
            resolve({
              latLng: results[0].geometry.location,
              formattedAddress: results[0].formatted_address,
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  // ── Places Search ──
  function searchPlaces(latLng, type, radius, maxCount) {
    return new Promise((resolve) => {
      const allPlaces = [];

      const request = {
        location: latLng,
        radius: radius,
        type: type,
      };

      function handleResults(results, status, pagination) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          allPlaces.push(...results);

          // Google returns up to 20 results per page, up to 3 pages (60 total)
          if (pagination && pagination.hasNextPage && allPlaces.length < maxCount) {
            updateProgress(20, t('foundSoFar', allPlaces.length));
            // Google requires a short delay before requesting next page
            setTimeout(() => {
              pagination.nextPage();
            }, 2000);
          } else {
            resolve(allPlaces.slice(0, maxCount));
          }
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          console.warn('Places search status:', status);
          resolve(allPlaces);
        }
      }

      placesService.nearbySearch(request, handleResults);
    });
  }

  // ── Place Details ──
  function getPlaceDetails(places, progressStart, progressEnd) {
    return new Promise((resolve) => {
      const detailed = [];
      let completed = 0;
      const total = places.length;

      // Process in batches to respect rate limits
      const batchSize = 5;
      let batchIndex = 0;

      function processBatch() {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, total);
        const batch = places.slice(start, end);

        if (batch.length === 0) {
          resolve(detailed);
          return;
        }

        let batchCompleted = 0;

        batch.forEach((place) => {
          const request = {
            placeId: place.place_id,
            fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'rating', 'user_ratings_total', 'business_status', 'url', 'types', 'reviews', 'photos', 'opening_hours'],
          };

          placesService.getDetails(request, (result, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              detailed.push({
                name: result.name || '',
                address: result.formatted_address || '',
                phone: result.formatted_phone_number || '',
                website: result.website || '',
                rating: result.rating || 0,
                reviewCount: result.user_ratings_total || 0,
                status: result.business_status || 'UNKNOWN',
                mapsUrl: result.url || '',
                types: result.types || [],
                placeId: place.place_id,
                reviewData: result.reviews || [],
                photos: result.photos || [],
                hours: result.opening_hours ? result.opening_hours.weekday_text || [] : [],
              });
            } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
              // If rate limited, still add with basic info
              detailed.push({
                name: place.name || '',
                address: place.vicinity || '',
                phone: '',
                website: '', // Unknown — treat as no website
                rating: place.rating || 0,
                reviewCount: place.user_ratings_total || 0,
                status: place.business_status || 'UNKNOWN',
                mapsUrl: '',
                types: place.types || [],
                placeId: place.place_id,
                reviewData: [],
                photos: place.photos || [],
                hours: [],
              });
            }

            completed++;
            batchCompleted++;
            const pct = progressStart + ((completed / total) * (progressEnd - progressStart));
            updateProgress(pct, t('checkingBusiness', completed, total));

            if (batchCompleted === batch.length) {
              batchIndex++;
              if (batchIndex * batchSize < total) {
                // Small delay between batches to avoid rate limiting
                setTimeout(processBatch, 300);
              } else {
                resolve(detailed);
              }
            }
          });
        });
      }

      processBatch();
    });
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
      const fullStars = Math.floor(place.rating);
      const hasHalf = place.rating - fullStars >= 0.5;
      let starsHtml = '';
      for (let i = 0; i < 5; i++) {
        if (i < fullStars) starsHtml += '\u2605';
        else if (i === fullStars && hasHalf) starsHtml += '\u2606';
        else starsHtml += '\u2606';
      }

      const mapsLink = place.mapsUrl
        ? `<a href="${escapeHtml(place.mapsUrl)}" target="_blank" rel="noopener" class="maps-link" title="Open in Google Maps">\u{1F4CD}</a>`
        : `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}" target="_blank" rel="noopener" class="maps-link" title="Search on Google Maps">\u{1F4CD}</a>`;

      const hasContent = (place.reviewData && place.reviewData.length > 0) || (place.photos && place.photos.length > 0);
      const viewBtnHtml = hasContent
        ? `<button class="btn btn-view" data-idx="${idx}">${t('viewBtn')}</button>`
        : `<span style="color:var(--text-dim);font-size:12px">${t('noData')}</span>`;

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
        <td class="td-center">${viewBtnHtml}</td>
        <td class="td-center"><button class="btn btn-create-site" data-idx="${idx}">${t('createSiteBtn')}</button></td>
        <td class="td-center">${mapsLink}</td>
      `;

      // Attach click handler for View button
      const viewBtn = tr.querySelector('.btn-view');
      if (viewBtn) {
        viewBtn.addEventListener('click', () => openDetailModal(place));
      }

      // Attach click handler for Create Site button
      const createSiteBtn = tr.querySelector('.btn-create-site');
      if (createSiteBtn) {
        createSiteBtn.addEventListener('click', () => generateWebsite(place));
      }

      resultsBody.appendChild(tr);
    });
  }

  // ── Export CSV ──
  function exportCsv() {
    if (filteredResults.length === 0) return;

    const headers = ['#', t('thName'), t('thAddress'), t('thPhone'), t('thRating'), t('thReviews'), t('thStatus'), 'Google Maps URL'];
    const rows = filteredResults.map((p, i) => [
      i + 1,
      csvEscape(p.name),
      csvEscape(p.address),
      csvEscape(p.phone),
      p.rating || '',
      p.reviewCount || '',
      p.status || '',
      p.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + p.address)}`,
    ]);

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

  function csvEscape(str) {
    if (!str) return '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
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
    if (!photo || !photo.getUrl) return null;
    return photo.getUrl({ maxWidth: maxWidth || 600 });
  }

  // ── Detail Modal ──
  function openDetailModal(place) {
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
        const timeAgo = review.relative_time_description || '';
        return `
          <div class="review-card">
            <div class="review-header">
              <div class="review-author">
                ${review.profile_photo_url ? `<img src="${review.profile_photo_url}" alt="" class="review-avatar">` : '<div class="review-avatar-placeholder"></div>'}
                <div>
                  <strong>${escapeHtml(review.author_name || 'Anonymous')}</strong>
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
    const fullStars = Math.floor(place.rating);
    const hasHalf = place.rating - fullStars >= 0.5;
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) starsHtml += '\u2605';
      else if (i === fullStars && hasHalf) starsHtml += '\u2606';
      else starsHtml += '\u2606';
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
              ${place.phone ? `<span class="meta-sep">|</span><span>${escapeHtml(place.phone)}</span>` : ''}
            </div>
          </div>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          ${photosHtml}
          ${reviewsHtml}
          ${hoursHtml}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-copy-reviews">${t('copyTopReviews')}</button>
          <button class="btn btn-primary" id="modal-close-btn-footer">${t('closeBtn')}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const closeModal = () => modal.remove();
    modal.querySelector('#modal-close-btn').addEventListener('click', closeModal);
    modal.querySelector('#modal-close-btn-footer').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });

    // Copy reviews button
    modal.querySelector('#modal-copy-reviews').addEventListener('click', () => {
      if (topReviews.length === 0) return;
      const text = topReviews.map((r) =>
        `"${r.text}"\n— ${r.author_name || 'Anonymous'}, ${'\u2605'.repeat(r.rating)} (${r.rating}/5)`
      ).join('\n\n');
      navigator.clipboard.writeText(text).then(() => {
        const btn = modal.querySelector('#modal-copy-reviews');
        btn.textContent = t('copied');
        setTimeout(() => { btn.textContent = t('copyTopReviews'); }, 2000);
      });
    });
  }

  // ── Website Generator ──
  function generateWebsite(place) {
    const topReviews = getTopReviews(place.reviewData, 3);
    const photos = (place.photos || []).slice(0, 6);
    const photoUrls = photos.map((p) => getPhotoUrl(p, 800)).filter(Boolean);
    const heroPhoto = photoUrls.length > 0 ? photoUrls[0] : '';
    const galleryPhotos = photoUrls.slice(1);

    // Star HTML for the generated site
    const fullStars = Math.floor(place.rating);
    let starStr = '';
    for (let i = 0; i < 5; i++) {
      starStr += i < fullStars ? '\u2605' : '\u2606';
    }

    // Build hours rows
    let hoursRows = '';
    if (place.hours && place.hours.length > 0) {
      hoursRows = place.hours.map((h) => {
        const parts = h.split(': ');
        const day = parts[0] || h;
        const time = parts.slice(1).join(': ') || '';
        return `<tr><td>${esc(day)}</td><td>${esc(time)}</td></tr>`;
      }).join('');
    }

    // Build testimonials
    let testimonialsHtml = '';
    if (topReviews.length > 0) {
      testimonialsHtml = topReviews.map((r) => {
        const rStars = '\u2605'.repeat(Math.floor(r.rating)) + '\u2606'.repeat(5 - Math.floor(r.rating));
        return `
          <div class="testimonial">
            <div class="testimonial-stars">${rStars}</div>
            <p class="testimonial-text">"${esc(r.text)}"</p>
            <p class="testimonial-author">— ${esc(r.author_name || 'Anonymous')}</p>
          </div>`;
      }).join('');
    }

    // Build gallery
    let galleryHtml = '';
    if (galleryPhotos.length > 0) {
      galleryHtml = galleryPhotos.map((url) =>
        `<div class="gallery-item"><img src="${url}" alt="${esc(place.name)} photo" loading="lazy"></div>`
      ).join('');
    }

    // Determine accent color from business type
    const typeColors = {
      restaurant: '#e74c3c', cafe: '#8B4513', bakery: '#d4a373',
      bar: '#6c3483', hair_care: '#2980b9', beauty_salon: '#e91e63',
      spa: '#16a085', gym: '#e67e22', dentist: '#3498db',
      doctor: '#2ecc71', car_repair: '#34495e', default: '#2563eb'
    };
    const businessTypeVal = businessType.value || 'default';
    const accent = typeColors[businessTypeVal] || typeColors.default;

    const mapsQuery = encodeURIComponent(place.name + ' ' + place.address);
    const langAttr = currentLang;

    const html = `<!DOCTYPE html>
<html lang="${langAttr}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(place.name)}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--accent:${accent};--accent-light:${accent}22;--text:#1a1a2e;--text-light:#555;--bg:#fff;--section-bg:#f8f9fa;--radius:10px}
html{scroll-behavior:smooth}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:var(--text);line-height:1.6}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}

/* Nav */
.nav{position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);border-bottom:1px solid #eee;padding:16px 24px;display:flex;align-items:center;justify-content:space-between}
.nav-brand{font-size:20px;font-weight:800;color:var(--accent)}
.nav-links{display:flex;gap:24px;list-style:none}
.nav-links a{color:var(--text);font-weight:500;font-size:14px;transition:color .2s}
.nav-links a:hover{color:var(--accent);text-decoration:none}

/* Hero */
.hero{position:relative;min-height:480px;display:flex;align-items:center;justify-content:center;text-align:center;color:#fff;overflow:hidden}
.hero-bg{position:absolute;inset:0;background:${heroPhoto ? `url('${heroPhoto}') center/cover no-repeat` : `linear-gradient(135deg, var(--accent), ${accent}cc)`};filter:brightness(0.45)}
.hero-content{position:relative;z-index:1;padding:40px 24px;max-width:700px}
.hero h1{font-size:48px;font-weight:800;margin-bottom:12px;text-shadow:0 2px 8px rgba(0,0,0,.3)}
.hero p{font-size:18px;opacity:0.9;margin-bottom:24px}
.hero-rating{font-size:22px;letter-spacing:2px;margin-bottom:24px;color:#ffd700}
.hero-rating span{color:rgba(255,255,255,0.8);font-size:15px;margin-left:8px}
.hero-btn{display:inline-block;padding:14px 36px;background:var(--accent);color:#fff;border-radius:50px;font-weight:700;font-size:16px;transition:transform .2s,box-shadow .2s;box-shadow:0 4px 15px rgba(0,0,0,.2)}
.hero-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.3);text-decoration:none}

/* Sections */
section{padding:64px 24px}
.section-title{text-align:center;font-size:28px;font-weight:800;margin-bottom:8px}
.section-subtitle{text-align:center;color:var(--text-light);margin-bottom:40px;font-size:16px}
.alt-bg{background:var(--section-bg)}

/* Info Cards */
.info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px;max-width:900px;margin:0 auto}
.info-card{background:#fff;border:1px solid #eee;border-radius:var(--radius);padding:28px;text-align:center;transition:transform .2s,box-shadow .2s}
.info-card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,.08)}
.info-icon{font-size:32px;margin-bottom:12px}
.info-card h3{font-size:16px;font-weight:700;margin-bottom:6px}
.info-card p{color:var(--text-light);font-size:14px}

/* Testimonials */
.testimonials-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:960px;margin:0 auto}
.testimonial{background:#fff;border:1px solid #eee;border-radius:var(--radius);padding:24px;position:relative}
.testimonial-stars{color:#ffd700;font-size:16px;margin-bottom:10px;letter-spacing:2px}
.testimonial-text{font-size:14px;color:var(--text-light);line-height:1.7;margin-bottom:12px;font-style:italic}
.testimonial-author{font-size:13px;font-weight:600;color:var(--accent)}

/* Gallery */
.gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;max-width:960px;margin:0 auto}
.gallery-item{border-radius:var(--radius);overflow:hidden;aspect-ratio:4/3;border:1px solid #eee}
.gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform .3s}
.gallery-item:hover img{transform:scale(1.05)}

/* Hours */
.hours-table{max-width:500px;margin:0 auto;border-collapse:collapse;width:100%}
.hours-table td{padding:10px 16px;border-bottom:1px solid #eee;font-size:14px}
.hours-table tr:last-child td{border-bottom:none}
.hours-table td:first-child{font-weight:600;color:var(--text)}
.hours-table td:last-child{color:var(--text-light);text-align:right}

/* Contact / Footer */
.contact-section{background:var(--accent);color:#fff;text-align:center}
.contact-section .section-title{color:#fff}
.contact-section .section-subtitle{color:rgba(255,255,255,0.8)}
.contact-info{display:flex;flex-wrap:wrap;justify-content:center;gap:32px;margin-top:24px}
.contact-item{font-size:16px}
.contact-item a{color:#fff;font-weight:600}
.footer{text-align:center;padding:24px;background:#1a1a2e;color:rgba(255,255,255,.5);font-size:12px}

@media(max-width:768px){
  .hero h1{font-size:32px}
  .hero{min-height:380px}
  .nav-links{display:none}
  section{padding:48px 16px}
}
</style>
</head>
<body>

<nav class="nav">
  <div class="nav-brand">${esc(place.name)}</div>
  <ul class="nav-links">
    <li><a href="#about">${t('genAbout')}</a></li>
    ${testimonialsHtml ? `<li><a href="#reviews">${t('genCustomersSay').split(' ').slice(0, 1).join('')}</a></li>` : ''}
    ${galleryHtml ? `<li><a href="#gallery">${t('genGallery')}</a></li>` : ''}
    ${hoursRows ? `<li><a href="#hours">${t('genHours')}</a></li>` : ''}
    <li><a href="#contact">${t('genContact')}</a></li>
  </ul>
</nav>

<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-content">
    <h1>${esc(place.name)}</h1>
    <p>${esc(place.address)}</p>
    ${place.rating > 0 ? `<div class="hero-rating">${starStr}<span>${place.rating.toFixed(1)} / 5 &middot; ${place.reviewCount.toLocaleString()} ${t('reviews')}</span></div>` : ''}
    <a class="hero-btn" href="#contact">${t('genGetInTouch')}</a>
  </div>
</section>

<section id="about">
  <h2 class="section-title">${t('genWelcome')}</h2>
  <p class="section-subtitle">${t('genWelcomeSub')}</p>
  <div class="info-grid">
    ${place.phone ? `<div class="info-card"><div class="info-icon">&#128222;</div><h3>${t('genCallUs')}</h3><p>${esc(place.phone)}</p></div>` : ''}
    <div class="info-card"><div class="info-icon">&#128205;</div><h3>${t('genVisitUs')}</h3><p>${esc(place.address)}</p></div>
    ${place.rating > 0 ? `<div class="info-card"><div class="info-icon">&#11088;</div><h3>${t('genHighlyRated')}</h3><p>${t('genStarsFrom', place.rating.toFixed(1), place.reviewCount.toLocaleString())}</p></div>` : ''}
    <div class="info-card"><div class="info-icon">&#128640;</div><h3>${t('genDirections')}</h3><p><a href="https://www.google.com/maps/search/?api=1&query=${mapsQuery}" target="_blank">${t('genOpenMaps')}</a></p></div>
  </div>
</section>

${testimonialsHtml ? `
<section id="reviews" class="alt-bg">
  <h2 class="section-title">${t('genCustomersSay')}</h2>
  <p class="section-subtitle">${t('genRealReviews')}</p>
  <div class="testimonials-grid">${testimonialsHtml}</div>
</section>` : ''}

${galleryHtml ? `
<section id="gallery">
  <h2 class="section-title">${t('genGallery')}</h2>
  <p class="section-subtitle">${t('genGallerySub')}</p>
  <div class="gallery-grid">${galleryHtml}</div>
</section>` : ''}

${hoursRows ? `
<section id="hours" class="alt-bg">
  <h2 class="section-title">${t('genBusinessHours')}</h2>
  <p class="section-subtitle">${t('genHoursSub')}</p>
  <table class="hours-table">${hoursRows}</table>
</section>` : ''}

<section id="contact" class="contact-section">
  <h2 class="section-title">${t('genContactUs')}</h2>
  <p class="section-subtitle">${t('genContactSub')}</p>
  <div class="contact-info">
    ${place.phone ? `<div class="contact-item">&#128222; <a href="tel:${esc(place.phone.replace(/[^+\d]/g, ''))}">${esc(place.phone)}</a></div>` : ''}
    <div class="contact-item">&#128205; <a href="https://www.google.com/maps/search/?api=1&query=${mapsQuery}" target="_blank">${esc(place.address)}</a></div>
  </div>
</section>

<footer class="footer">
  &copy; ${new Date().getFullYear()} ${esc(place.name)}. ${t('genAllRights')}
</footer>

</body>
</html>`;

    // Open in new tab
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    // Also offer download
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${place.name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-').toLowerCase()}-website.html`;
      a.click();
    }, 500);
  }

  // HTML escape helper for generated website content
  function esc(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Start ──
  init();
})();
