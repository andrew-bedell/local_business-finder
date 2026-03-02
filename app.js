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
        const reviewRows = place.reviewData.map((r) => ({
          business_id: businessId,
          source: 'google',
          author_name: r.authorAttribution ? r.authorAttribution.displayName || '' : '',
          author_photo_url: r.authorAttribution ? r.authorAttribution.photoURI || '' : '',
          rating: Math.max(1, Math.min(5, Math.round(r.rating || 3))),
          text: r.text || '',
          published_at: r.relativePublishTimeDescription || '',
        }));

        const { error: reviewError } = await supabaseClient
          .from('business_reviews')
          .upsert(reviewRows, { onConflict: 'business_id,source,author_name,text' });

        if (reviewError) {
          console.warn('Review save error (non-fatal):', reviewError);
        }
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

    // Load previously saved business IDs from Supabase
    loadSavedIds();

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
          loadSavedIds();
        }
        if (data.googleApiKey) {
          apiKey = data.googleApiKey;
          document.getElementById('api-setup').style.display = 'none';
          loadGoogleMaps(apiKey);
          return;
        }
      }
    } catch (_) {
      // Server not available (e.g. local dev) — fall back silently
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

      // Step 3: Map to internal format and filter — searchNearby returns all fields
      const mapped = places.map(mapPlaceToResult);
      const noWebsite = mapped.filter((p) => !p.website);

      updateProgress(90, t('foundBusinesses', places.length));

      allResults = noWebsite;

      updateProgress(100, t('searchComplete'));
      progressStats.textContent = t('progressStatsText', places.length, allResults.length);

      // Show results
      showResults();
    } catch (err) {
      console.error('Search error:', err);
      updateProgress(0, t('searchError'));
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
      new Promise((resolve) => {
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

      const hasContent = (place.reviewData && place.reviewData.length > 0) || (place.photos && place.photos.length > 0);
      const viewBtnHtml = hasContent
        ? `<button class="btn btn-view" data-idx="${idx}">${t('viewBtn')}</button>`
        : `<span style="color:var(--text-dim);font-size:12px">${t('noData')}</span>`;

      const isSaved = savedPlaceIds.has(place.placeId);
      const saveBtnHtml = isSaved
        ? `<span class="badge badge-saved">${t('savedBtn')}</span>`
        : `<button class="btn btn-save-row" data-idx="${idx}">${t('saveBtn')}</button>`;

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
    if (!photo || !photo.getURI) return null;
    return photo.getURI({ maxWidth: maxWidth || 600 });
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
  }

  // ── Start ──
  init();
})();
