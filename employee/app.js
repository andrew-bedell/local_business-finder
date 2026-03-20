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
      navSearch: 'Search',
      navSaved: 'Saved',
      navPipeline: 'Pipeline',
      navGroupPipeline: 'Pipeline',
      navGroupMessaging: 'Messaging',
      navGroupCustomers: 'Customers',
      navGroupSettings: 'Settings',
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
      countryEC: 'Ecuador',
      locationLabel: 'Location',
      locationPlaceholder: 'City, zip code, or address (e.g., Austin TX, 90210, 123 Main St)',
      locationPlaceholderMX: 'City, zip code, or address (e.g., Ciudad de México, Guadalajara, Cancún)',
      locationPlaceholderCO: 'City, zip code, or address (e.g., Bogotá, Medellín, Cartagena)',
      locationPlaceholderEC: 'City, zip code, or address (e.g., Quito, Guayaquil, Cuenca)',
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
      typeAll: 'All Types',
      searchingType: 'Searching {0}...',
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
      thType: 'Type',
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
      viewInPipeline: 'View in Pipeline',
      searchCollapse: 'Collapse',
      searchExpand: 'Expand',
      searchSummaryText: 'Last search: {0} — {1} results',
      // Error messages
      searchError: 'Search failed. Please check your API key and network connection, then try again.',
      timeoutError: '{0} timed out after {1}s. Check your API key and network connection.',
      mapsAuthFailed: 'Google Maps API key is not authorized. Check that your API key allows this domain and that Maps JavaScript API is enabled in Google Cloud Console.',
      geocodeRequestDenied: 'Geocoding request denied. Verify your API key is valid, billing is enabled, and the Geocoding API is active in Google Cloud Console.',
      // Social Media Auto-Discovery
      socialDiscovering: 'Finding social profiles...',
      socialYelpRating: '{0} stars on Yelp',
      socialViewOn: 'View on {0}',
      thSocial: 'Social',
      socialEnrichmentComplete: 'Found social profiles for {0} of {1} businesses',
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
      anonymous: 'Anonymous',
      fbReactions: 'reactions',
      fbReviewsTitle: 'Facebook Reviews ({0})',
      viewOnFacebook: 'View on Facebook',
      priceRange: 'Price range',
      igPosts: 'posts',
      igFollowers: 'followers',
      igFollowing: 'following',
      igVerified: 'Verified account',
      enrichSocialBtn: 'Enrich Social Data',
      enrichingSocial: 'Fetching social data...',
      enrichSocialSuccess: 'Social data loaded successfully',
      enrichSocialError: 'Failed to fetch social data',
      enrichSocialNone: 'No Facebook or Instagram profiles found to enrich',
      // Deep Research Report
      generateReport: 'Generate Research Report',
      generatingReport: 'Generating report...',
      reportGenerating: 'Analyzing business data and generating website content report. This may take up to 30 seconds...',
      reportError: 'Failed to generate research report. Please try again.',
      reportTitle: 'Website Content Report',
      reportBusinessSummary: 'Business Summary',
      reportSellingPoints: 'Key Selling Points',
      reportReviewHighlights: 'Review Highlights',
      reportReviewThemes: 'Recurring Themes',
      reportQuotableReviews: 'Best Quotes for Website',
      reportAreasToAvoid: 'Topics to Avoid',
      reportSuggestedSections: 'Suggested Website Sections',
      reportToneRec: 'Tone & Writing Style',
      reportOverallTone: 'Overall Tone',
      reportWritingStyle: 'Writing Style',
      reportWordsToUse: 'Vocabulary to Use',
      reportWordsToAvoid: 'Vocabulary to Avoid',
      reportCompetitive: 'Competitive Positioning',
      reportContentGaps: 'Content Gaps',
      reportSocialInsights: 'Social Media Insights',
      reportSeoKeywords: 'Local SEO Keywords',
      reportPriorityHigh: 'High',
      reportPriorityMedium: 'Medium',
      reportPriorityLow: 'Low',
      reportPhotoAssetPlan: 'Photo & Asset Plan',
      reportPhotoExisting: 'Use Existing',
      reportPhotoGenerate: 'AI Generate',
      reportPhotoSource: 'Photo ID',
      reportPhotoPrompt: 'AI Prompt',
      // Website Generation
      generateWebsite: 'Generate Website',
      generatingWebsite: 'Generating...',
      websiteGenTitle: 'Website Generation',
      websiteGenerating: 'Generating a complete website using AI. This may take up to 60 seconds...',
      websiteError: 'Failed to generate website. Please try again.',
      websiteDownload: 'Download HTML',
      websiteOpenNewTab: 'Open in New Tab',
      websiteSaved: 'Website saved to database',
      // Table action buttons
      thReport: 'Report',
      thAiPhotos: 'AI Photos',
      thWebsite: 'Website',
      btnReport: 'Report',
      btnPhotos: 'Generate Photos',
      generatingPhotos: 'Generating...',
      photosSuccess: 'AI photos generated for {0}',
      photosError: 'Failed to generate photos. Please try again.',
      photosNoneNeeded: 'All photos are existing — no AI generation needed',
      needsPhotos: 'Generate photos first',
      btnWebsite: 'Website',
      reportSuccess: 'Research report generated for {0}',
      websiteSuccess: 'Website generated for {0}',
      needsReport: 'Generate report first to see photo plan',
      noDescription: 'No description available.',
      // Search pagination
      searchingPage: 'Searching page {0} of {1}...',
      // Google review enrichment
      fetchingReviews: 'Fetching reviews via Google...',
      fetchingReviewsProgress: 'Fetching reviews... {0} of {1}',
      // SearchAPI review + photo enrichment
      fetchingAdditionalReviews: 'Fetching additional reviews...',
      fetchingAdditionalReviewsProgress: 'Fetching additional reviews... {0} of {1}',
      fetchingPhotos: 'Fetching photos...',
      fetchingPhotosProgress: 'Fetching photos... {0} of {1}',
      // Enrichment modal
      enrichmentModalTitle: 'Gathering Business Data',
      enrichmentSocialProfiles: 'Discovering social profiles...',
      enrichmentSocialProfilesDone: 'Social profiles discovered',
      enrichmentGoogleReviews: 'Fetching Google reviews...',
      enrichmentGoogleReviewsDone: 'Google reviews fetched',
      enrichmentPlaceDetails: 'Gathering place details...',
      enrichmentPlaceDetailsDone: 'Place details gathered',
      enrichmentReviews: 'Fetching additional reviews...',
      enrichmentReviewsDone: 'Additional reviews fetched',
      enrichmentPhotos: 'Fetching photos...',
      enrichmentPhotosDone: 'Photos fetched',
      enrichmentFacebook: 'Gathering Facebook information...',
      enrichmentFacebookDone: 'Facebook information gathered',
      enrichmentInstagram: 'Gathering Instagram information...',
      enrichmentInstagramDone: 'Instagram information gathered',
      enrichmentKnowledgeGraph: 'Looking up Knowledge Graph profiles...',
      enrichmentKnowledgeGraphDone: 'Knowledge Graph profiles found',
      enrichmentSaving: 'Saving all data to database...',
      enrichmentSavingDone: 'All data saved to database',
      enrichmentComplete: 'Enrichment complete!',
      enrichmentBizProgress: '{0} of {1} businesses',
      // Enrichment status bar
      enrichmentBarProgress: 'Enriching {0} of {1} businesses',
      enrichmentBarComplete: 'Enrichment complete — {0} businesses enriched',
      enrichmentBarEnrichMore: 'Enrich remaining {0} businesses',
      enrichmentBarStopped: 'Enriched first {0} of {1} businesses',
      // URL Lookup
      lookupDivider: 'or add a specific business',
      lookupPlaceholder: 'Paste a Google Maps URL or Place ID...',
      lookupBtn: 'Look Up',
      lookingUp: 'Looking up...',
      lookupInvalidInput: 'Please paste a valid Google Maps URL or Place ID (starts with ChIJ).',
      lookupNotFound: 'Place not found. Check the URL or Place ID and try again.',
      lookupError: 'Failed to look up business. Please try again.',
      lookupSuccess: '"{0}" added to results.',
    },
    es: {
      // Header
      logo: 'Buscador de Negocios Locales',
      tagline: 'Encuentra negocios sin sitio web cerca de cualquier ubicación',
      navSearch: 'Buscar',
      navSaved: 'Guardados',
      navPipeline: 'Pipeline',
      navGroupPipeline: 'Pipeline',
      navGroupMessaging: 'Mensajes',
      navGroupCustomers: 'Clientes',
      navGroupSettings: 'Ajustes',
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
      countryEC: 'Ecuador',
      locationLabel: 'Ubicación',
      locationPlaceholder: 'Ciudad, código postal o dirección (ej., Austin TX, 90210, 123 Main St)',
      locationPlaceholderMX: 'Ciudad, código postal o dirección (ej., Ciudad de México, Guadalajara, Cancún)',
      locationPlaceholderCO: 'Ciudad, código postal o dirección (ej., Bogotá, Medellín, Cartagena)',
      locationPlaceholderEC: 'Ciudad, código postal o dirección (ej., Quito, Guayaquil, Cuenca)',
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
      typeAll: 'Todos los Tipos',
      searchingType: 'Buscando {0}...',
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
      thType: 'Tipo',
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
      viewInPipeline: 'Ver en Pipeline',
      searchCollapse: 'Contraer',
      searchExpand: 'Expandir',
      searchSummaryText: 'Última búsqueda: {0} — {1} resultados',
      // Error messages
      searchError: 'La búsqueda falló. Verifica tu clave API y conexión a internet, e intenta de nuevo.',
      timeoutError: '{0} agotó el tiempo de espera después de {1}s. Verifica tu clave API y conexión a internet.',
      mapsAuthFailed: 'La clave de Google Maps API no está autorizada. Verifica que tu clave permita este dominio y que la Maps JavaScript API esté habilitada en Google Cloud Console.',
      geocodeRequestDenied: 'Solicitud de geocodificación denegada. Verifica que tu clave API sea válida, la facturación esté habilitada y la Geocoding API esté activa en Google Cloud Console.',
      // Social Media Auto-Discovery
      socialDiscovering: 'Buscando perfiles sociales...',
      socialYelpRating: '{0} estrellas en Yelp',
      socialViewOn: 'Ver en {0}',
      thSocial: 'Social',
      socialEnrichmentComplete: 'Se encontraron perfiles sociales para {0} de {1} negocios',
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
      anonymous: 'Anónimo',
      fbReactions: 'reacciones',
      fbReviewsTitle: 'Reseñas de Facebook ({0})',
      viewOnFacebook: 'Ver en Facebook',
      priceRange: 'Rango de precios',
      igPosts: 'publicaciones',
      igFollowers: 'seguidores',
      igFollowing: 'siguiendo',
      igVerified: 'Cuenta verificada',
      enrichSocialBtn: 'Enriquecer Datos Sociales',
      enrichingSocial: 'Obteniendo datos sociales...',
      enrichSocialSuccess: 'Datos sociales cargados exitosamente',
      enrichSocialError: 'Error al obtener datos sociales',
      enrichSocialNone: 'No se encontraron perfiles de Facebook o Instagram para enriquecer',
      // Deep Research Report
      generateReport: 'Generar Informe de Investigación',
      generatingReport: 'Generando informe...',
      reportGenerating: 'Analizando datos del negocio y generando informe de contenido web. Esto puede tardar hasta 30 segundos...',
      reportError: 'Error al generar el informe. Por favor intente de nuevo.',
      reportTitle: 'Informe de Contenido Web',
      reportBusinessSummary: 'Resumen del Negocio',
      reportSellingPoints: 'Puntos de Venta Clave',
      reportReviewHighlights: 'Destacados de Reseñas',
      reportReviewThemes: 'Temas Recurrentes',
      reportQuotableReviews: 'Mejores Citas para el Sitio Web',
      reportAreasToAvoid: 'Temas a Evitar',
      reportSuggestedSections: 'Secciones Sugeridas para el Sitio Web',
      reportToneRec: 'Tono y Estilo de Escritura',
      reportOverallTone: 'Tono General',
      reportWritingStyle: 'Estilo de Escritura',
      reportWordsToUse: 'Vocabulario a Usar',
      reportWordsToAvoid: 'Vocabulario a Evitar',
      reportCompetitive: 'Posicionamiento Competitivo',
      reportContentGaps: 'Brechas de Contenido',
      reportSocialInsights: 'Perspectivas de Redes Sociales',
      reportSeoKeywords: 'Palabras Clave SEO Local',
      reportPriorityHigh: 'Alta',
      reportPriorityMedium: 'Media',
      reportPriorityLow: 'Baja',
      reportPhotoAssetPlan: 'Plan de Fotos y Recursos',
      reportPhotoExisting: 'Usar Existente',
      reportPhotoGenerate: 'Generar con IA',
      reportPhotoSource: 'ID de Foto',
      reportPhotoPrompt: 'Prompt IA',
      // Website Generation
      generateWebsite: 'Generar Sitio Web',
      generatingWebsite: 'Generando...',
      websiteGenTitle: 'Generación de Sitio Web',
      websiteGenerating: 'Generando un sitio web completo con IA. Esto puede tardar hasta 60 segundos...',
      websiteError: 'Error al generar el sitio web. Por favor intente de nuevo.',
      websiteDownload: 'Descargar HTML',
      websiteOpenNewTab: 'Abrir en Nueva Pestaña',
      websiteSaved: 'Sitio web guardado en la base de datos',
      // Table action buttons
      thReport: 'Informe',
      thAiPhotos: 'Fotos IA',
      thWebsite: 'Sitio Web',
      btnReport: 'Informe',
      btnPhotos: 'Generar Fotos',
      generatingPhotos: 'Generando...',
      photosSuccess: 'Fotos IA generadas para {0}',
      photosError: 'Error al generar fotos. Por favor intente de nuevo.',
      photosNoneNeeded: 'Todas las fotos son existentes — no se necesita generación IA',
      needsPhotos: 'Genera las fotos primero',
      btnWebsite: 'Sitio',
      reportSuccess: 'Informe generado para {0}',
      websiteSuccess: 'Sitio web generado para {0}',
      needsReport: 'Genera el informe primero para ver el plan de fotos',
      noDescription: 'No hay descripción disponible.',
      // Search pagination
      searchingPage: 'Buscando página {0} de {1}...',
      // Google review enrichment
      fetchingReviews: 'Obteniendo reseñas de Google...',
      fetchingReviewsProgress: 'Obteniendo reseñas... {0} de {1}',
      // SearchAPI review + photo enrichment
      fetchingAdditionalReviews: 'Obteniendo reseñas adicionales...',
      fetchingAdditionalReviewsProgress: 'Obteniendo reseñas adicionales... {0} de {1}',
      fetchingPhotos: 'Obteniendo fotos...',
      fetchingPhotosProgress: 'Obteniendo fotos... {0} de {1}',
      // Enrichment modal
      enrichmentModalTitle: 'Recopilando Datos de Negocios',
      enrichmentSocialProfiles: 'Descubriendo perfiles sociales...',
      enrichmentSocialProfilesDone: 'Perfiles sociales descubiertos',
      enrichmentGoogleReviews: 'Obteniendo reseñas de Google...',
      enrichmentGoogleReviewsDone: 'Reseñas de Google obtenidas',
      enrichmentPlaceDetails: 'Recopilando detalles del lugar...',
      enrichmentPlaceDetailsDone: 'Detalles del lugar recopilados',
      enrichmentReviews: 'Obteniendo reseñas adicionales...',
      enrichmentReviewsDone: 'Reseñas adicionales obtenidas',
      enrichmentPhotos: 'Obteniendo fotos...',
      enrichmentPhotosDone: 'Fotos obtenidas',
      enrichmentFacebook: 'Recopilando información de Facebook...',
      enrichmentFacebookDone: 'Información de Facebook recopilada',
      enrichmentInstagram: 'Recopilando información de Instagram...',
      enrichmentInstagramDone: 'Información de Instagram recopilada',
      enrichmentKnowledgeGraph: 'Buscando perfiles en Knowledge Graph...',
      enrichmentKnowledgeGraphDone: 'Perfiles de Knowledge Graph encontrados',
      enrichmentSaving: 'Guardando todos los datos en la base de datos...',
      enrichmentSavingDone: 'Todos los datos guardados en la base de datos',
      enrichmentComplete: '¡Enriquecimiento completado!',
      enrichmentBizProgress: '{0} de {1} negocios',
      // Enrichment status bar
      enrichmentBarProgress: 'Enriqueciendo {0} de {1} negocios',
      enrichmentBarComplete: 'Enriquecimiento completado — {0} negocios enriquecidos',
      enrichmentBarEnrichMore: 'Enriquecer los {0} negocios restantes',
      enrichmentBarStopped: 'Enriquecidos los primeros {0} de {1} negocios',
      // URL Lookup
      lookupDivider: 'o agregar un negocio específico',
      lookupPlaceholder: 'Pega una URL de Google Maps o Place ID...',
      lookupBtn: 'Buscar',
      lookingUp: 'Buscando...',
      lookupInvalidInput: 'Pega una URL válida de Google Maps o un Place ID (comienza con ChIJ).',
      lookupNotFound: 'Negocio no encontrado. Verifica la URL o Place ID e intenta de nuevo.',
      lookupError: 'Error al buscar el negocio. Por favor intenta de nuevo.',
      lookupSuccess: '"{0}" agregado a los resultados.',
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

    // Text content — only set elements whose keys exist in our translations
    const lang = translations[currentLang] || {};
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!lang[key]) return;
      const val = lang[key];
      if (val.includes('<a ') || val.includes('<strong>')) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (!lang[key]) return;
      el.placeholder = lang[key];
    });

    // Optgroup labels
    document.querySelectorAll('[data-i18n-label]').forEach((el) => {
      const key = el.getAttribute('data-i18n-label');
      if (!lang[key]) return;
      el.label = lang[key];
    });

    // Update lang switcher active state
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    });

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

  function showToastWithLink(message, type, linkText, scrollTargetId) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    const span = document.createElement('span');
    span.textContent = message + ' ';
    toast.appendChild(span);
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = linkText;
    link.style.cssText = 'color:inherit;text-decoration:underline;font-weight:600';
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.getElementById(scrollTargetId);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      toast.remove();
    });
    toast.appendChild(link);
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 6000);
  }

  // ── Supabase ──
  // Fallback credentials used when server config is unavailable (local dev)
  const SUPABASE_URL_FALLBACK = 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const SUPABASE_KEY_FALLBACK = '';
  let supabaseClient = null;
  const savedPlaceIds = new Set();

  function initSupabaseFromConfig(url, key) {
    if (window.supabase && url && key) {
      supabaseClient = window.supabase.createClient(url, key);
    }
  }

  async function loadSavedIds() {
    if (!supabaseClient) return;
    try {
      const { data } = await supabaseClient.from('businesses').select('place_id').limit(10000);
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

      const country = countrySelect ? countrySelect.value.toUpperCase() : null;
      const mapped = mapTypesToCategory(place.types, place.searchType || type);

      const row = {
        place_id: place.placeId,
        name: place.name,
        address_full: place.address,
        address_country: country,
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
        category: mapped.category,
        subcategory: mapped.subcategory,
        search_type: place.searchType || type,
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

      // Save related data in parallel (all depend on businessId from upsert above)
      const businessId = data && data[0] && data[0].id;
      const parallelOps = [];

      // Save reviews to business_reviews table
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

        parallelOps.push(
          supabaseClient
            .from('business_reviews')
            .upsert(reviewRows, { onConflict: 'business_id,review_hash' })
            .then(({ error }) => { if (error) console.warn('Review save error (non-fatal):', error); })
        );
      }

      // Save discovered social profiles if available
      if (businessId && place.socialProfiles && place.socialProfiles.length > 0) {
        parallelOps.push(
          saveDiscoveredProfiles(businessId, place.socialProfiles)
        );
      }

      // Save photos to business_photos table
      if (businessId && place.photos && place.photos.length > 0) {
        const photoRows = place.photos
          .filter(p => p.url)
          .map((p, index) => ({
            business_id: businessId,
            source: 'google',
            photo_type: p.photoType || null,
            url: p.url,
            caption: p.caption || null,
            is_primary: index === 0,
          }));

        if (photoRows.length > 0) {
          parallelOps.push(
            supabaseClient
              .from('business_photos')
              .insert(photoRows)
              .then(({ error }) => { if (error) console.warn('Photo save error (non-fatal):', error); })
          );
        }
      }

      // Save Facebook enrichment data (photos, reviews, follower counts)
      if (place.facebookData) {
        parallelOps.push(
          saveFacebookData(place, businessId).catch(err =>
            console.warn('Failed to save Facebook data:', err)
          )
        );
      }

      // Save Instagram enrichment data (photos, follower/post counts)
      if (place.instagramData) {
        parallelOps.push(
          saveInstagramData(place, businessId).catch(err =>
            console.warn('Failed to save Instagram data:', err)
          )
        );
      }

      // Update enriched place details in DB
      parallelOps.push(
        updateBusinessEnrichedData(place).catch(err =>
          console.warn('Failed to update enriched data:', err)
        )
      );

      await Promise.all(parallelOps);

      savedPlaceIds.add(place.placeId);
      document.dispatchEvent(new CustomEvent('business-saved', { detail: { placeId: place.placeId } }));

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
  let allResults = [];
  let filteredResults = [];
  let isSearching = false;
  let mapsLoaded = false;
  let searchCollapsed = false;
  let lastSearchInfo = null; // { location, count }

  function getSearchLanguage() {
    const country = countrySelect.value;
    const langMap = { us: 'en', mx: 'es', co: 'es', ec: 'es' };
    return langMap[country] || 'en';
  }

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
  const resultsSection = $('#search-results-section');
  const resultsSummary = $('#search-results-summary');
  const resultsBody = $('#search-results-body');
  const noResults = $('#search-no-results');
  const filterInput = $('#search-filter-input');
  const sortSelect = $('#search-sort-select');
  const btnExportCsv = $('#btn-export-csv');
  const btnClear = $('#btn-clear');
  const lookupInput = $('#lookup-input');
  const btnLookup = $('#btn-lookup');

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
    btnLookup.addEventListener('click', lookupByUrl);
    lookupInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') lookupByUrl();
    });

    // Collapse search toggle
    const btnCollapse = document.getElementById('btn-collapse-search');
    if (btnCollapse) btnCollapse.addEventListener('click', toggleSearchCollapse);

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
        // Hide API setup — search works via SearchAPI.io without a Google key
        document.getElementById('api-setup').style.display = 'none';
        // Optionally load Google Maps for review enrichment
        if (data.googleApiKey) {
          apiKey = data.googleApiKey;
          loadGoogleMaps(apiKey);
        }
        return;
      } else {
        // Server returned non-OK — use fallback Supabase client
        loadSavedIds();
      }
    } catch (_) {
      // Server not available (e.g. local dev) — use fallback Supabase client
      loadSavedIds();
    }

    // Fall back to localStorage key or manual input (local dev without server)
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
        showApiStatus(t('mapsLoaded'), 'success');
        updateSearchButton();
      }
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=places&language=${getSearchLanguage()}&callback=_gmapsCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      showApiStatus(t('mapsLoadFailed'), 'error');
    };
    document.head.appendChild(script);
  }


  // ── Search Button State ──
  function updateSearchButton() {
    const hasLocation = locationInput.value.trim().length > 0;
    const hasType = businessType.value !== '';
    btnSearch.disabled = !(hasLocation && hasType);
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

      // Step 2: Search via SearchAPI.io
      const lat = coords.latLng.lat;
      const lng = coords.latLng.lng;

      // Build list of types to search
      const ALL_TYPES = [...businessType.querySelectorAll('option[value]')]
        .map(o => o.value).filter(v => v && v !== '' && v !== 'all');
      const typesToSearch = type === 'all' ? ALL_TYPES : [type];
      const perTypeMax = type === 'all' ? 20 : maxCount;

      let mapped = [];
      const seenPlaceIds = new Set();

      for (let i = 0; i < typesToSearch.length; i++) {
        const currentType = typesToSearch[i];
        if (type === 'all') {
          const pct = 15 + Math.round((i / typesToSearch.length) * 70);
          const typeLabel = businessType.querySelector(`option[value="${currentType}"]`);
          const typeName = typeLabel ? typeLabel.textContent : currentType;
          updateProgress(pct, t('searchingType', typeName));
        } else {
          updateProgress(15, t('searchingViaSearchApi'));
        }

        const results = await searchViaSearchApi(currentType, lat, lng, radius, perTypeMax);
        if (results) {
          for (const r of results) {
            if (!seenPlaceIds.has(r.placeId)) {
              seenPlaceIds.add(r.placeId);
              r.searchType = currentType;
              mapped.push(r);
            }
          }
        }
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
      lastSearchInfo = { location: location, count: allResults.length };
      updateSearchSummary();

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
    const useKm = country === 'mx' || country === 'co' || country === 'ec';

    if (country === 'mx') {
      locationInput.placeholder = t('locationPlaceholderMX');
    } else if (country === 'co') {
      locationInput.placeholder = t('locationPlaceholderCO');
    } else if (country === 'ec') {
      locationInput.placeholder = t('locationPlaceholderEC');
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
  async function geocodeLocation(address) {
    const country = countrySelect.value;
    const params = new URLSearchParams({ address });
    if (country) params.set('country', country);

    const res = await withTimeout(
      fetch('/api/geocode?' + params.toString()),
      15000,
      'Geocoding'
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || t('geocodeRequestDenied'));
    }

    const data = await res.json();
    if (!data.found) return null;

    return {
      latLng: { lat: data.lat, lng: data.lng },
      formattedAddress: data.formattedAddress,
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
      resultsSection.querySelector('.results-table-wrapper').style.display = 'none';
      resultsSection.querySelector('.filter-bar').style.display = 'none';
      resultsSummary.textContent = t('noWebsitesFound');
      return;
    }

    noResults.style.display = 'none';
    resultsSection.querySelector('.results-table-wrapper').style.display = 'block';
    resultsSection.querySelector('.filter-bar').style.display = 'flex';

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

      const socialCellHtml = buildSocialCellHtml(place.socialProfiles);

      const categoryDisplay = formatCategory(place) || getTypeLabel(place.searchType || businessType.value);

      tr.innerHTML = `
        <td class="td-center">${idx + 1}</td>
        <td>${escapeHtml(categoryDisplay)}</td>
        <td><strong>${escapeHtml(place.name)}</strong></td>
        <td>${escapeHtml(place.address)}</td>
        <td>${escapeHtml(place.phone) || '<span style="color:var(--text-dim)">N/A</span>'}</td>
        <td class="td-center">
          <span class="stars">${starsHtml}</span>
          <span class="rating-num">${place.rating > 0 ? place.rating.toFixed(1) : 'N/A'}</span>
        </td>
        <td class="td-center">${place.reviewCount > 0 ? place.reviewCount.toLocaleString() : '0'}</td>
        <td><span class="badge badge-no-site">${t('noWebsite')}</span></td>
        <td class="td-center" data-social-place="${escapeHtml(place.placeId)}">${socialCellHtml}</td>
        <td class="td-center"><button class="btn btn-view btn-report" data-idx="${idx}">${place.researchReport ? '✓' : t('btnReport')}</button></td>
        <td class="td-center"><button class="btn btn-view btn-photos" data-idx="${idx}" ${place.researchReport ? '' : 'disabled'}>${place.generatedPhotos ? '✓' : t('btnPhotos')}</button></td>
        <td class="td-center"><button class="btn btn-view btn-website" data-idx="${idx}" ${place.generatedPhotos ? '' : 'disabled'}>${place.generatedWebsiteHtml ? '✓' : t('btnWebsite')}</button></td>
        <td class="td-center">${viewBtnHtml}</td>
        <td class="td-center">${mapsLink}</td>
        <td class="td-center">${saveBtnHtml}</td>
      `;

      // Attach click handler for Report button
      const reportBtn = tr.querySelector('.btn-report');
      if (reportBtn) {
        reportBtn.addEventListener('click', () => handleTableReport(place, reportBtn));
      }

      // Attach click handler for AI Photos button
      const photosBtn = tr.querySelector('.btn-photos');
      if (photosBtn) {
        photosBtn.addEventListener('click', () => handleTableAiPhotos(place, photosBtn));
      }

      // Attach click handler for Website button
      const websiteBtn = tr.querySelector('.btn-website');
      if (websiteBtn) {
        websiteBtn.addEventListener('click', () => handleTableWebsite(place, websiteBtn));
      }

      // Attach click handler for View button
      const viewBtn = tr.querySelector('.btn-view:not(.btn-report):not(.btn-photos):not(.btn-website)');
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
            showToastWithLink(t('saveRowSuccess', place.name), 'success', t('viewInPipeline'), 'pipeline-anchor');
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

    const headers = ['#', t('thType'), t('thName'), t('thAddress'), t('thPhone'), t('thRating'), t('thReviews'), t('thStatus'), 'Yelp', 'Facebook', 'Instagram', 'Other Social', 'Google Maps URL'].map(csvEscape);
    const rows = filteredResults.map((p, i) => {
      const socialUrls = {};
      (p.socialProfiles || []).forEach((sp) => { socialUrls[sp.platform] = sp.url; });
      const otherProfiles = (p.socialProfiles || [])
        .filter((sp) => !['yelp', 'facebook', 'instagram'].includes(sp.platform))
        .map((sp) => sp.url)
        .join('; ');
      return [
        i + 1,
        csvEscape(getTypeLabel(p.searchType || businessType.value)),
        csvEscape(p.name),
        csvEscape(p.address),
        csvEscape(p.phone),
        p.rating || '',
        p.reviewCount || '',
        p.status || '',
        csvEscape(socialUrls.yelp || ''),
        csvEscape(socialUrls.facebook || ''),
        csvEscape(socialUrls.instagram || ''),
        csvEscape(otherProfiles),
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

  // ── Collapsible Search ──
  function toggleSearchCollapse() {
    const section = document.getElementById('search-section');
    if (!section) return;
    searchCollapsed = !searchCollapsed;
    section.classList.toggle('collapsed', searchCollapsed);
    const btn = document.getElementById('btn-collapse-search');
    if (btn) btn.textContent = searchCollapsed ? t('searchExpand') : t('searchCollapse');
  }

  function updateSearchSummary() {
    const el = document.getElementById('search-summary');
    if (!el || !lastSearchInfo) return;
    el.textContent = t('searchSummaryText', lastSearchInfo.location, lastSearchInfo.count);
  }

  // ── Category Mapping ──
  // Maps Google Places type strings to clean category/subcategory pairs.
  // Used for website template selection, audience filtering, and display.
  const CATEGORY_MAP = {
    // Food & Drink — specific cuisine types first
    'mexican_restaurant':    { category: 'Restaurant', subcategory: 'Mexican Cuisine' },
    'italian_restaurant':    { category: 'Restaurant', subcategory: 'Italian Cuisine' },
    'chinese_restaurant':    { category: 'Restaurant', subcategory: 'Chinese Cuisine' },
    'japanese_restaurant':   { category: 'Restaurant', subcategory: 'Japanese Cuisine' },
    'indian_restaurant':     { category: 'Restaurant', subcategory: 'Indian Cuisine' },
    'thai_restaurant':       { category: 'Restaurant', subcategory: 'Thai Cuisine' },
    'korean_restaurant':     { category: 'Restaurant', subcategory: 'Korean Cuisine' },
    'vietnamese_restaurant': { category: 'Restaurant', subcategory: 'Vietnamese Cuisine' },
    'french_restaurant':     { category: 'Restaurant', subcategory: 'French Cuisine' },
    'greek_restaurant':      { category: 'Restaurant', subcategory: 'Greek Cuisine' },
    'mediterranean_restaurant': { category: 'Restaurant', subcategory: 'Mediterranean Cuisine' },
    'middle_eastern_restaurant': { category: 'Restaurant', subcategory: 'Middle Eastern Cuisine' },
    'latin_american_restaurant': { category: 'Restaurant', subcategory: 'Latin American Cuisine' },
    'brazilian_restaurant':  { category: 'Restaurant', subcategory: 'Brazilian Cuisine' },
    'peruvian_restaurant':   { category: 'Restaurant', subcategory: 'Peruvian Cuisine' },
    'colombian_restaurant':  { category: 'Restaurant', subcategory: 'Colombian Cuisine' },
    'argentinian_restaurant': { category: 'Restaurant', subcategory: 'Argentinian Cuisine' },
    'sushi_restaurant':      { category: 'Restaurant', subcategory: 'Sushi' },
    'pizza_restaurant':      { category: 'Restaurant', subcategory: 'Pizza' },
    'seafood_restaurant':    { category: 'Restaurant', subcategory: 'Seafood' },
    'steak_house':           { category: 'Restaurant', subcategory: 'Steakhouse' },
    'hamburger_restaurant':  { category: 'Restaurant', subcategory: 'Burgers' },
    'sandwich_shop':         { category: 'Restaurant', subcategory: 'Sandwiches' },
    'ice_cream_shop':        { category: 'Restaurant', subcategory: 'Ice Cream' },
    'bakery':                { category: 'Restaurant', subcategory: 'Bakery' },
    'cafe':                  { category: 'Restaurant', subcategory: 'Cafe' },
    'coffee_shop':           { category: 'Restaurant', subcategory: 'Coffee Shop' },
    'bar':                   { category: 'Restaurant', subcategory: 'Bar' },
    'meal_delivery':         { category: 'Restaurant', subcategory: 'Delivery' },
    'meal_takeaway':         { category: 'Restaurant', subcategory: 'Fast Food' },
    'restaurant':            { category: 'Restaurant', subcategory: null },
    'food':                  { category: 'Restaurant', subcategory: null },
    // Beauty & Personal Care
    'hair_care':             { category: 'Salon', subcategory: 'Hair Salon' },
    'beauty_salon':          { category: 'Salon', subcategory: 'Beauty Salon' },
    'nail_salon':            { category: 'Salon', subcategory: 'Nail Salon' },
    'spa':                   { category: 'Salon', subcategory: 'Spa' },
    // Health & Fitness
    'dentist':               { category: 'Healthcare', subcategory: 'Dentist' },
    'doctor':                { category: 'Healthcare', subcategory: 'Doctor' },
    'pharmacy':              { category: 'Healthcare', subcategory: 'Pharmacy' },
    'physiotherapist':       { category: 'Healthcare', subcategory: 'Physiotherapy' },
    'veterinary_care':       { category: 'Healthcare', subcategory: 'Veterinary' },
    'gym':                   { category: 'Healthcare', subcategory: 'Gym' },
    'hospital':              { category: 'Healthcare', subcategory: 'Hospital' },
    // Home Services
    'plumber':               { category: 'Contractor', subcategory: 'Plumber' },
    'electrician':           { category: 'Contractor', subcategory: 'Electrician' },
    'locksmith':             { category: 'Contractor', subcategory: 'Locksmith' },
    'painter':               { category: 'Contractor', subcategory: 'Painter' },
    'roofing_contractor':    { category: 'Contractor', subcategory: 'Roofing' },
    'moving_company':        { category: 'Contractor', subcategory: 'Moving' },
    'general_contractor':    { category: 'Contractor', subcategory: null },
    // Automotive
    'car_repair':            { category: 'Automotive', subcategory: 'Auto Repair' },
    'car_wash':              { category: 'Automotive', subcategory: 'Car Wash' },
    'car_dealer':            { category: 'Automotive', subcategory: 'Car Dealer' },
    'gas_station':           { category: 'Automotive', subcategory: 'Gas Station' },
    // Shopping / Retail
    'clothing_store':        { category: 'Retail', subcategory: 'Clothing' },
    'jewelry_store':         { category: 'Retail', subcategory: 'Jewelry' },
    'florist':               { category: 'Retail', subcategory: 'Florist' },
    'pet_store':             { category: 'Retail', subcategory: 'Pet Store' },
    'furniture_store':       { category: 'Retail', subcategory: 'Furniture' },
    'hardware_store':        { category: 'Retail', subcategory: 'Hardware' },
    // Professional Services
    'lawyer':                { category: 'Professional Services', subcategory: 'Legal' },
    'accounting':            { category: 'Professional Services', subcategory: 'Accounting' },
    'real_estate_agency':    { category: 'Professional Services', subcategory: 'Real Estate' },
    'insurance_agency':      { category: 'Professional Services', subcategory: 'Insurance' },
    // Other Services
    'laundry':               { category: 'Services', subcategory: 'Laundry' },
    'storage':               { category: 'Services', subcategory: 'Storage' },
    'travel_agency':         { category: 'Services', subcategory: 'Travel' },
    'lodging':               { category: 'Hospitality', subcategory: 'Hotel' },
  };

  // Derive category/subcategory from Google Places types array.
  // Prefers the most specific match (one with a subcategory).
  // Falls back to the search type if no types match.
  function mapTypesToCategory(types, fallback) {
    if (!types || types.length === 0) {
      if (fallback && CATEGORY_MAP[fallback]) return CATEGORY_MAP[fallback];
      return { category: fallback || null, subcategory: null };
    }
    var withSub = null;
    var withoutSub = null;
    for (var i = 0; i < types.length; i++) {
      var match = CATEGORY_MAP[types[i]];
      if (match && match.subcategory && !withSub) withSub = match;
      if (match && !withoutSub) withoutSub = match;
    }
    if (withSub) return withSub;
    if (withoutSub) return withoutSub;
    if (fallback && CATEGORY_MAP[fallback]) return CATEGORY_MAP[fallback];
    return { category: fallback || null, subcategory: null };
  }

  // Format category + subcategory for display (e.g., "Restaurant > Mexican Cuisine")
  function formatCategory(place) {
    var mapped = mapTypesToCategory(place.types, place.searchType || '');
    if (mapped.category && mapped.subcategory) return mapped.category + ' > ' + mapped.subcategory;
    if (mapped.category) return mapped.category;
    return getTypeLabel(place.searchType || '') || '';
  }

  // ── Utility ──
  function getTypeLabel(typeValue) {
    if (!typeValue) return '';
    const opt = businessType.querySelector(`option[value="${typeValue}"]`);
    return opt ? opt.textContent : typeValue;
  }

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

  // ── URL Lookup ──
  function parseGoogleMapsInput(input) {
    input = input.trim();

    // Raw place ID (starts with ChIJ)
    if (/^ChIJ[A-Za-z0-9_-]+$/.test(input)) {
      return { place_id: input };
    }

    // Raw hex data_id (0x format)
    if (/^0x[a-fA-F0-9]+:0x[a-fA-F0-9]+$/.test(input)) {
      return { data_id: input };
    }

    // URL — try to parse client-side, fall back to server resolution
    if (input.startsWith('http')) {
      // Extract data_id from full Maps URL (hex format after !1s)
      const dataIdMatch = input.match(/!1s(0x[a-fA-F0-9]+:0x[a-fA-F0-9]+)/);
      if (dataIdMatch) return { data_id: dataIdMatch[1] };

      // Extract ChIJ-format place_id
      const chijMatch = input.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
      if (chijMatch) return { place_id: chijMatch[1] };

      // Extract from ftid parameter
      const ftidMatch = input.match(/ftid=(0x[a-fA-F0-9]+:0x[a-fA-F0-9]+)/);
      if (ftidMatch) return { data_id: ftidMatch[1] };

      // Shortened URLs, CID URLs, or anything else — send to server
      return { url: input };
    }

    return { error: true };
  }

  async function lookupByUrl() {
    const input = lookupInput.value.trim();
    if (!input) return;

    const parsed = parseGoogleMapsInput(input);
    if (parsed.error) {
      showToast(t('lookupInvalidInput'), 'error');
      return;
    }

    // Show loading state
    btnLookup.disabled = true;
    btnLookup.querySelector('.btn-text').style.display = 'none';
    btnLookup.querySelector('.btn-loading').style.display = 'inline-flex';

    try {
      const params = new URLSearchParams();
      if (parsed.place_id) params.set('place_id', parsed.place_id);
      if (parsed.data_id) params.set('data_id', parsed.data_id);
      if (parsed.url) params.set('url', parsed.url);
      params.set('hl', getSearchLanguage());

      const isShareUrl = parsed.url && parsed.url.includes('share.google');
      const res = await withTimeout(
        fetch('/api/search/place-lookup?' + params.toString()),
        isShareUrl ? 35000 : 20000,
        'Place lookup'
      );

      if (res.status === 404) {
        showToast(t('lookupNotFound'), 'error');
        resetLookupButton();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || t('lookupError'), 'error');
        resetLookupButton();
        return;
      }

      const business = await res.json();

      // Add to front of results
      allResults.unshift(business);
      showResults();
      showToast(t('lookupSuccess', business.name), 'success');
      lookupInput.value = '';

      // Run enrichment pipeline on the looked-up business (non-blocking)
      runEnrichmentPipeline([business]).catch(function(err) {
        console.warn('Lookup enrichment error:', err);
      });
    } catch (err) {
      console.error('Place lookup error:', err);
      showToast(t('lookupError'), 'error');
    }

    resetLookupButton();
  }

  function resetLookupButton() {
    btnLookup.disabled = false;
    btnLookup.querySelector('.btn-text').style.display = 'inline';
    btnLookup.querySelector('.btn-loading').style.display = 'none';
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
        hl: getSearchLanguage(),
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
              text: r.originalText || r.text || '',
              rating: r.rating || 0,
              relativePublishTimeDescription: r.relativePublishTimeDescription || '',
              authorAttribution: r.authorAttribution ? {
                displayName: r.authorAttribution.displayName || '',
                photoURI: r.authorAttribution.photoURI || '',
              } : null,
            }));
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

  // Save photos to business_photos table for a place
  async function savePhotosForBusiness(place) {
    if (!supabaseClient || !place.placeId || !place.photos || place.photos.length === 0) return;

    const businessId = await getBusinessId(place.placeId);
    if (!businessId) return;

    const photoRows = place.photos
      .filter(p => p.url)
      .map((p, index) => ({
        business_id: businessId,
        source: 'google',
        photo_type: p.photoType || null,
        url: p.url,
        caption: p.caption || null,
        is_primary: index === 0,
      }));

    if (photoRows.length === 0) return;

    // Delete existing google photos for this business then insert fresh
    // (no unique constraint on business_id + url, so upsert isn't possible)
    const { error: deleteError } = await supabaseClient
      .from('business_photos')
      .delete()
      .eq('business_id', businessId)
      .eq('source', 'google');

    if (deleteError) {
      console.warn('Photo delete error (non-fatal):', deleteError);
    }

    const { error: insertError } = await supabaseClient
      .from('business_photos')
      .insert(photoRows);

    if (insertError) {
      console.warn('Photo save error (non-fatal):', insertError);
    }
  }

  // Save Facebook data (photos + reviews) to Supabase
  async function saveFacebookData(place, knownBusinessId) {
    if (!supabaseClient || !place.placeId || !place.facebookData) return;

    const businessId = knownBusinessId || await getBusinessId(place.placeId);
    if (!businessId) return;

    const fb = place.facebookData;

    // Save Facebook photos (profile + cover)
    const photoRows = [];
    if (fb.profilePhoto) {
      photoRows.push({
        business_id: businessId,
        source: 'facebook',
        photo_type: 'logo',
        url: fb.profilePhoto,
        caption: fb.name ? fb.name + ' - Facebook profile photo' : 'Facebook profile photo',
        is_primary: false,
      });
    }
    if (fb.coverPhoto) {
      photoRows.push({
        business_id: businessId,
        source: 'facebook',
        photo_type: 'exterior',
        url: fb.coverPhoto,
        caption: fb.name ? fb.name + ' - Facebook cover photo' : 'Facebook cover photo',
        is_primary: false,
      });
    }

    if (photoRows.length > 0) {
      // Delete existing facebook photos then insert fresh
      await supabaseClient
        .from('business_photos')
        .delete()
        .eq('business_id', businessId)
        .eq('source', 'facebook');

      const { error } = await supabaseClient
        .from('business_photos')
        .insert(photoRows);

      if (error) console.warn('Facebook photo save error (non-fatal):', error);
    }

    // Save Facebook reviews
    const fbReviews = fb.reviews || [];
    if (fbReviews.length > 0) {
      const reviewRows = fbReviews.map((r) => {
        const sentiment = analyzeSentiment({ text: r.text, rating: r.rating || 4 });
        return {
          business_id: businessId,
          source: 'facebook',
          author_name: r.authorName || null,
          author_photo_url: r.authorPhoto || null,
          rating: r.rating ? Math.max(1, Math.min(5, Math.round(r.rating))) : null,
          text: r.text,
          published_at: r.date || r.isoDate || '',
          sentiment_score: Math.round(sentiment.score * 10000) / 10000,
          sentiment_label: sentimentLabelToDb(sentiment.label),
          review_hash: reviewHash('facebook', r.authorName, r.text),
        };
      });

      const { error } = await supabaseClient
        .from('business_reviews')
        .upsert(reviewRows, { onConflict: 'business_id,review_hash' });

      if (error) console.warn('Facebook review save error (non-fatal):', error);
    }

    // Update social profile with follower count
    if (fb.followers) {
      await supabaseClient
        .from('business_social_profiles')
        .update({
          follower_count: fb.followers || null,
        })
        .eq('business_id', businessId)
        .eq('platform', 'facebook');
    }
  }

  // Save Instagram data (photos from posts) to Supabase
  async function saveInstagramData(place, knownBusinessId) {
    if (!supabaseClient || !place.placeId || !place.instagramData) return;

    const businessId = knownBusinessId || await getBusinessId(place.placeId);
    if (!businessId) return;

    const ig = place.instagramData;
    const photoRows = [];

    // Save avatar as logo
    if (ig.avatar) {
      photoRows.push({
        business_id: businessId,
        source: 'instagram',
        photo_type: 'logo',
        url: ig.avatar,
        caption: ig.username ? '@' + ig.username + ' - Instagram avatar' : 'Instagram avatar',
        is_primary: false,
      });
    }

    // Save post images (use full-res imageUrl when available, fall back to thumbnail)
    const posts = ig.posts || [];
    posts.forEach((post) => {
      const url = post.imageUrl || post.thumbnail;
      if (!url) return;
      photoRows.push({
        business_id: businessId,
        source: 'instagram',
        photo_type: null,
        url: url,
        caption: (post.caption || '').substring(0, 500),
        is_primary: false,
        width: post.width || null,
        height: post.height || null,
      });

      // Also save carousel items as separate photos
      (post.carouselItems || []).forEach((item) => {
        if (!item.imageUrl) return;
        photoRows.push({
          business_id: businessId,
          source: 'instagram',
          photo_type: null,
          url: item.imageUrl,
          caption: (post.caption || '').substring(0, 500),
          is_primary: false,
          width: item.width || null,
          height: item.height || null,
        });
      });
    });

    if (photoRows.length > 0) {
      // Delete existing instagram photos then insert fresh
      await supabaseClient
        .from('business_photos')
        .delete()
        .eq('business_id', businessId)
        .eq('source', 'instagram');

      const { error } = await supabaseClient
        .from('business_photos')
        .insert(photoRows);

      if (error) console.warn('Instagram photo save error (non-fatal):', error);
    }

    // Update social profile with follower/post counts
    if (ig.followerCount || ig.postCount) {
      await supabaseClient
        .from('business_social_profiles')
        .update({
          follower_count: ig.followerCount || null,
          post_count: ig.postCount || null,
        })
        .eq('business_id', businessId)
        .eq('platform', 'instagram');
    }
  }

  // ── Enrichment Status Bar ──
  // Non-blocking bottom bar that shows enrichment progress while user can interact with results.
  const ENRICHMENT_STEPS = [
    { id: 'social-profiles', labelKey: 'enrichmentSocialProfiles', doneKey: 'enrichmentSocialProfilesDone' },
    { id: 'google-reviews', labelKey: 'enrichmentGoogleReviews', doneKey: 'enrichmentGoogleReviewsDone' },
    { id: 'place-details', labelKey: 'enrichmentPlaceDetails', doneKey: 'enrichmentPlaceDetailsDone' },
    { id: 'additional-reviews', labelKey: 'enrichmentReviews', doneKey: 'enrichmentReviewsDone' },
    { id: 'photos', labelKey: 'enrichmentPhotos', doneKey: 'enrichmentPhotosDone' },
    { id: 'facebook', labelKey: 'enrichmentFacebook', doneKey: 'enrichmentFacebookDone' },
    { id: 'instagram', labelKey: 'enrichmentInstagram', doneKey: 'enrichmentInstagramDone' },
    { id: 'saving', labelKey: 'enrichmentSaving', doneKey: 'enrichmentSavingDone' },
  ];

  let enrichmentBarCurrentStep = '';

  function showEnrichmentBar(totalCount) {
    let bar = document.getElementById('enrichment-bar');
    if (bar) bar.remove();
    bar = document.createElement('div');
    bar.id = 'enrichment-bar';
    bar.className = 'enrichment-bar';
    bar.innerHTML = `
      <div class="enrichment-bar-inner">
        <div class="enrichment-bar-left">
          <span class="spinner-sm"></span>
          <span class="enrichment-bar-step" id="enrichment-bar-step"></span>
        </div>
        <div class="enrichment-bar-center">
          <span class="enrichment-bar-biz" id="enrichment-bar-biz"></span>
        </div>
        <div class="enrichment-bar-right">
          <div class="enrichment-bar-progress-track">
            <div class="enrichment-bar-progress-fill" id="enrichment-bar-fill" style="width:0%"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(bar);
  }

  function updateEnrichmentStep(stepId, status, customLabel) {
    const step = ENRICHMENT_STEPS.find(s => s.id === stepId);
    if (!step) return;
    if (status === 'active') {
      enrichmentBarCurrentStep = customLabel || t(step.labelKey);
      const stepEl = document.getElementById('enrichment-bar-step');
      if (stepEl) stepEl.textContent = enrichmentBarCurrentStep;
    }
    // Update progress bar fill based on which step we're on
    if (status === 'done' || status === 'skipped') {
      const idx = ENRICHMENT_STEPS.findIndex(s => s.id === stepId);
      const pct = Math.round(((idx + 1) / ENRICHMENT_STEPS.length) * 100);
      const fill = document.getElementById('enrichment-bar-fill');
      if (fill) fill.style.width = pct + '%';
    }
  }

  function updateEnrichmentBizProgress(current, total) {
    const el = document.getElementById('enrichment-bar-biz');
    if (el) el.textContent = t('enrichmentBarProgress', current, total);
  }

  function showEnrichmentBarComplete(enrichedCount) {
    const bar = document.getElementById('enrichment-bar');
    if (!bar) return;
    bar.classList.add('enrichment-bar-done');
    bar.innerHTML = `
      <div class="enrichment-bar-inner">
        <div class="enrichment-bar-left">
          <span class="enrichment-bar-check">&#10003;</span>
          <span class="enrichment-bar-step">${t('enrichmentBarComplete', enrichedCount)}</span>
        </div>
        <div class="enrichment-bar-right">
          <button class="enrichment-bar-dismiss" onclick="document.getElementById('enrichment-bar').remove()">&times;</button>
        </div>
      </div>
    `;
    setTimeout(() => {
      const b = document.getElementById('enrichment-bar');
      if (b && b.classList.contains('enrichment-bar-done')) b.remove();
    }, 8000);
  }

  function showEnrichmentBarStopped(enrichedCount, totalCount, remainingResults) {
    const bar = document.getElementById('enrichment-bar');
    if (!bar) return;
    const remainingCount = remainingResults.length;
    bar.classList.add('enrichment-bar-paused');
    bar.classList.remove('enrichment-bar-done');
    bar.innerHTML = `
      <div class="enrichment-bar-inner">
        <div class="enrichment-bar-left">
          <span class="enrichment-bar-check" style="color:var(--warning)">&#9679;</span>
          <span class="enrichment-bar-step">${t('enrichmentBarStopped', enrichedCount, totalCount)}</span>
        </div>
        <div class="enrichment-bar-right">
          <button class="btn btn-primary enrichment-bar-enrich-more" id="enrichment-bar-enrich-more">
            ${t('enrichmentBarEnrichMore', remainingCount)}
          </button>
          <button class="enrichment-bar-dismiss" onclick="document.getElementById('enrichment-bar').remove()">&times;</button>
        </div>
      </div>
    `;
    document.getElementById('enrichment-bar-enrich-more').addEventListener('click', function() {
      runEnrichmentPipeline(remainingResults, remainingResults.length);
    });
  }

  function closeEnrichmentBar() {
    const bar = document.getElementById('enrichment-bar');
    if (bar) bar.remove();
  }

  // ── Enrichment Pipeline ──
  // Runs after search results are displayed. Shows non-blocking bottom status bar.
  // Only enriches businesses without websites. Auto-enriches first 50, then offers button for the rest.
  const ENRICHMENT_BATCH_LIMIT = 50;

  async function runEnrichmentPipeline(results, limit) {
    // Filter to only businesses without websites (our actual leads)
    const noWebsiteResults = results.filter(p => !p.website || p.website.toLowerCase().includes('facebook.com') || p.website.toLowerCase().includes('instagram.com'));
    // Skip already-enriched businesses
    const unenriched = noWebsiteResults.filter(p => !p._enriched);

    if (unenriched.length === 0) return;

    const batchLimit = limit || ENRICHMENT_BATCH_LIMIT;
    const batch = unenriched.slice(0, batchLimit);
    const remaining = unenriched.slice(batchLimit);

    showEnrichmentBar(batch.length);
    updateEnrichmentBizProgress(0, batch.length);

    // Phase 1: Social discovery (Yelp, Facebook/Instagram search, Knowledge Graph)
    updateEnrichmentStep('social-profiles', 'active');
    try {
      await enrichWithSocialProfiles(batch);
      renderTable();
    } catch (err) {
      console.warn('Social enrichment error:', err);
    }
    updateEnrichmentStep('social-profiles', 'done');

    // Phase 2: Fetch reviews via Google Places JS API
    if (mapsLoaded) {
      updateEnrichmentStep('google-reviews', 'active');
      await enrichWithGoogleReviews(batch);
      renderTable();
      updateEnrichmentStep('google-reviews', 'done');
    } else {
      updateEnrichmentStep('google-reviews', 'skipped', 'Google reviews — Maps not loaded');
    }

    // Phase 3: Enrich with SearchAPI.io place details
    updateEnrichmentStep('place-details', 'active');
    await enrichWithPlaceDetails(batch);
    renderTable();
    updateEnrichmentStep('place-details', 'done');

    // Phase 4: Fetch additional reviews
    updateEnrichmentStep('additional-reviews', 'active');
    await enrichWithSearchAPIReviews(batch);
    renderTable();
    updateEnrichmentStep('additional-reviews', 'done');

    // Phase 5: Fetch additional photos
    updateEnrichmentStep('photos', 'active');
    await enrichWithSearchAPIPhotos(batch);
    renderTable();
    updateEnrichmentStep('photos', 'done');

    // Phase 6: Facebook enrichment
    updateEnrichmentStep('facebook', 'active');
    try {
      await enrichWithSocialDataByPlatform(batch, 'facebook');
      renderTable();
    } catch (err) {
      console.warn('Facebook enrichment error:', err);
    }
    updateEnrichmentStep('facebook', 'done');

    // Phase 7: Instagram enrichment
    updateEnrichmentStep('instagram', 'active');
    try {
      await enrichWithSocialDataByPlatform(batch, 'instagram');
      renderTable();
    } catch (err) {
      console.warn('Instagram enrichment error:', err);
    }
    updateEnrichmentStep('instagram', 'done');

    // Phase 8: Save everything to database (after ALL enrichment is done)
    if (supabaseClient) {
      updateEnrichmentStep('saving', 'active');
      const toSave = batch.filter((p) => !savedPlaceIds.has(p.placeId));
      let savedCount = 0;
      for (let i = 0; i < toSave.length; i++) {
        updateEnrichmentBizProgress(i + 1, toSave.length);
        const ok = await saveBusiness(toSave[i]);
        if (ok) savedCount++;
      }
      if (savedCount > 0) {
        showToast(t('autoSaveComplete', savedCount), 'success');
        renderTable();
      }
      updateEnrichmentStep('saving', 'done');
    } else {
      updateEnrichmentStep('saving', 'skipped', 'Database not connected');
    }

    // Mark batch as enriched so they won't be re-enriched
    batch.forEach(p => { p._enriched = true; });

    updateProgress(100, t('searchComplete'));
    renderTable();

    // Show completion or "enrich more" button
    if (remaining.length > 0) {
      showEnrichmentBarStopped(batch.length, batch.length + remaining.length, remaining);
    } else {
      showEnrichmentBarComplete(batch.length);
    }
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
          params.set('hl', getSearchLanguage());
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

            // Consume reviews from the place response (previously discarded)
            if (data.reviews && data.reviews.length > 0 && (!place.reviewData || place.reviewData.length === 0)) {
              place.reviewData = data.reviews.map(r => ({
                text: r.text,
                rating: r.rating,
                relativePublishTimeDescription: r.date || r.isoDate || '',
                authorAttribution: {
                  displayName: r.authorName,
                  photoURI: r.authorPhoto,
                },
              }));
            }

            // Store web reviews (external sources like TripAdvisor)
            if (data.webReviews && data.webReviews.length > 0) {
              place.webReviews = data.webReviews;
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
    await enrichWithSocialDataByPlatform(results, 'facebook');
    await enrichWithSocialDataByPlatform(results, 'instagram');
  }

  async function enrichWithSocialDataByPlatform(results, platform) {
    const batchSize = 3;
    const dataKey = platform === 'facebook' ? 'facebookData' : 'instagramData';
    const endpoint = platform === 'facebook' ? '/api/enrich/facebook' : '/api/enrich/instagram';
    const saveFn = platform === 'facebook' ? saveFacebookData : saveInstagramData;

    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      await Promise.all(batch.map(async (place) => {
        const profiles = place.socialProfiles || [];
        const profile = profiles.find(p => p.platform === platform);
        if (!profile || !profile.handle || place[dataKey]) return;
        try {
          const res = await withTimeout(
            fetch(endpoint + '?username=' + encodeURIComponent(profile.handle)),
            15000,
            platform + ' enrichment'
          );
          if (res.ok) {
            place[dataKey] = await res.json();
          }
        } catch (err) {
          console.warn(platform + ' enrichment failed for', place.name, err);
        }
      }));
    }
  }

  // Fetch additional reviews via SearchAPI.io dedicated reviews engine
  // Only called for businesses that still lack reviews after Google Places JS + place details
  async function enrichWithSearchAPIReviews(results) {
    const needsReviews = results.filter(p => p.dataId && (!p.reviewData || p.reviewData.length === 0));
    if (needsReviews.length === 0) return;

    updateProgress(96, t('fetchingAdditionalReviews'));
    const batchSize = 3;
    let fetched = 0;

    for (let i = 0; i < needsReviews.length; i += batchSize) {
      const batch = needsReviews.slice(i, i + batchSize);
      await Promise.all(batch.map(async (place) => {
        try {
          const params = new URLSearchParams({ data_id: place.dataId });
          if (place.placeId) params.set('place_id', place.placeId);
          params.set('hl', getSearchLanguage());
          const res = await withTimeout(
            fetch('/api/enrich/reviews?' + params.toString()),
            15000,
            'Review enrichment'
          );
          if (res.ok) {
            const data = await res.json();
            if (data.reviews && data.reviews.length > 0) {
              place.reviewData = data.reviews.map(r => ({
                text: r.text,
                rating: r.rating,
                relativePublishTimeDescription: r.date || r.isoDate || '',
                authorAttribution: {
                  displayName: r.authorName,
                  photoURI: r.authorPhoto,
                },
              }));
            }
          }
          fetched++;
          updateProgress(96 + Math.round((fetched / needsReviews.length) * 1), t('fetchingAdditionalReviewsProgress', fetched, needsReviews.length));
        } catch (err) {
          console.warn('SearchAPI review enrichment failed for', place.name, err);
        }
      }));
    }
  }

  // Fetch additional photos via SearchAPI.io dedicated photos engine
  // Only called for businesses that have few or no photos
  async function enrichWithSearchAPIPhotos(results) {
    const needsPhotos = results.filter(p => p.dataId && (!p.photos || p.photos.length <= 1));
    if (needsPhotos.length === 0) return;

    updateProgress(97, t('fetchingPhotos'));
    const batchSize = 3;
    let fetched = 0;

    for (let i = 0; i < needsPhotos.length; i += batchSize) {
      const batch = needsPhotos.slice(i, i + batchSize);
      await Promise.all(batch.map(async (place) => {
        try {
          const res = await withTimeout(
            fetch('/api/enrich/photos?data_id=' + encodeURIComponent(place.dataId)),
            15000,
            'Photo enrichment'
          );
          if (res.ok) {
            const data = await res.json();
            if (data.photos && data.photos.length > 0) {
              // Merge, avoiding duplicates by URL
              const existingUrls = new Set((place.photos || []).map(p => p.url));
              const newPhotos = data.photos
                .filter(p => p.url && !existingUrls.has(p.url))
                .map(p => ({ url: p.url, thumbnail: p.thumbnail, photoType: null }));
              place.photos = (place.photos || []).concat(newPhotos);
              place.photoCategories = data.categories;
            }
          }
          fetched++;
          updateProgress(97 + Math.round((fetched / needsPhotos.length) * 1), t('fetchingPhotosProgress', fetched, needsPhotos.length));
        } catch (err) {
          console.warn('SearchAPI photo enrichment failed for', place.name, err);
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

  // Discover social profiles for a business via serverless proxies
  async function discoverSocialProfiles(place) {
    const profiles = [];
    const foundPlatforms = new Set();

    // Source 1: Existing social discover proxy (Yelp, Facebook, Instagram)
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
          foundPlatforms.add('yelp');
        }
        if (data.facebook) {
          profiles.push({
            platform: 'facebook',
            url: data.facebook.url,
            handle: data.facebook.handle || null,
          });
          foundPlatforms.add('facebook');
        }
        if (data.instagram) {
          profiles.push({
            platform: 'instagram',
            url: data.instagram.url,
            handle: data.instagram.handle || null,
          });
          foundPlatforms.add('instagram');
        }
      }
    } catch (err) {
      console.warn('Social discovery failed:', err);
    }

    // Source 2: Knowledge Graph (discovers Twitter, LinkedIn, TikTok, YouTube, etc.)
    try {
      const kgProfiles = await lookupKnowledgeGraphProfiles(place.name, place.address);
      for (const sp of kgProfiles) {
        if (!foundPlatforms.has(sp.platform)) {
          profiles.push(sp);
          foundPlatforms.add(sp.platform);
        }
      }
    } catch (err) {
      console.warn('Knowledge Graph discovery failed:', err);
    }

    return profiles;
  }

  // Enrich all search results with social profiles (called after search completes)
  async function enrichWithSocialProfiles(results) {
    let foundCount = 0;
    let processed = 0;
    const batchSize = 5;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      // Show loading spinners for this batch
      batch.forEach((place) => {
        if (!place.socialProfiles) {
          updateSocialCell(place.placeId, 'loading', null);
        }
      });
      await Promise.all(batch.map(async (place) => {
        if (!place.socialProfiles) {
          place.socialProfiles = await discoverSocialProfiles(place);
          updateSocialCell(place.placeId, 'done', place.socialProfiles);
        }
        if (place.socialProfiles && place.socialProfiles.length > 0) foundCount++;
        processed++;
        updateEnrichmentBizProgress(processed, results.length);
      }));
    }
    if (results.length > 0) {
      showToast(t('socialEnrichmentComplete', foundCount, results.length), 'success');
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

  // Build unified social cell HTML for table rows (with icons)
  function buildSocialCellHtml(profiles) {
    if (!profiles || profiles.length === 0) {
      return '<span class="social-cell-none">--</span>';
    }
    const maxShow = 4;
    const shown = profiles.slice(0, maxShow);
    const icons = shown.map((p) => {
      const icon = SOCIAL_ICONS[p.platform] || '';
      const color = SOCIAL_COLORS[p.platform] || 'var(--text-muted)';
      const title = p.platform.charAt(0).toUpperCase() + p.platform.slice(1);
      if (!icon) {
        const platConfig = SOCIAL_PLATFORMS.find((s) => s.id === p.platform);
        const emoji = platConfig ? platConfig.icon : '\uD83C\uDF10';
        return `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener" class="social-cell-icon" title="${escapeHtml(title)}">${emoji}</a>`;
      }
      return `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener" class="social-cell-icon" title="${escapeHtml(title)}" style="color:${color}">${icon}</a>`;
    }).join('');
    const extra = profiles.length > maxShow ? `<span class="social-cell-more">+${profiles.length - maxShow}</span>` : '';
    return `<span class="social-cell">${icons}${extra}</span>`;
  }

  // Live-update a single social cell in the table during enrichment
  function updateSocialCell(placeId, state, profiles) {
    const cell = document.querySelector(`[data-social-place="${placeId}"]`);
    if (!cell) return;
    if (state === 'loading') {
      cell.innerHTML = '<span class="spinner-sm"></span>';
    } else {
      cell.innerHTML = buildSocialCellHtml(profiles);
    }
  }

  // ── Knowledge Graph Lookup ──
  const KG_PLATFORM_MAP = {
    'Facebook':    'facebook',
    'Instagram':   'instagram',
    'Twitter':     'twitter',
    'X (Twitter)': 'twitter',
    'YouTube':     'youtube',
    'LinkedIn':    'linkedin',
    'TikTok':      'tiktok',
    'Yelp':        'yelp',
    'TripAdvisor': 'tripadvisor',
    'Pinterest':   'pinterest',
  };

  function mapKnowledgeGraphProfile(profile) {
    const name = profile.name || '';
    const url = profile.link || '';
    const platform = KG_PLATFORM_MAP[name];
    if (!platform || !url) return null;
    return {
      platform: platform,
      url: url,
      handle: extractHandleFromUrl(platform, url),
    };
  }

  async function lookupKnowledgeGraphProfiles(businessName, address) {
    const city = address.split(',')[0].trim();
    const q = businessName + ' ' + city;
    try {
      const resp = await withTimeout(
        fetch('/api/social/knowledge-graph?q=' + encodeURIComponent(q)),
        10000,
        'Knowledge Graph'
      );
      if (!resp.ok) return [];
      const data = await resp.json();
      return (data.profiles || [])
        .map(mapKnowledgeGraphProfile)
        .filter(Boolean);
    } catch (err) {
      console.warn('Knowledge Graph lookup failed for', businessName, err);
      return [];
    }
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

      // Build Facebook reviews HTML
      const fbReviews = (fb.reviews || []).slice(0, 5);
      let fbReviewsHtml = '';
      if (fbReviews.length > 0) {
        const fbReviewItems = fbReviews.map(r => `
          <div class="review-item">
            <div class="review-header">
              ${r.authorPhoto ? `<img src="${escapeHtml(r.authorPhoto)}" alt="" class="review-author-photo">` : ''}
              <div>
                <strong class="review-author">${escapeHtml(r.authorName || t('anonymous'))}</strong>
                ${r.date ? `<span class="review-date">${escapeHtml(r.date)}</span>` : ''}
              </div>
              ${r.rating ? `<span class="stars">${renderStars(r.rating)}</span>` : ''}
            </div>
            <p class="review-text">${escapeHtml(r.text)}</p>
            ${r.reactionsCount ? `<span class="fb-reactions">${r.reactionsCount} ${t('fbReactions')}</span>` : ''}
          </div>
        `).join('');
        fbReviewsHtml = `
          <div class="fb-reviews">
            <h4>${t('fbReviewsTitle', fbReviews.length)}</h4>
            ${fbReviewItems}
          </div>
        `;
      }

      // Facebook link
      const fbLinkHtml = fb.link ? `<a href="${escapeHtml(fb.link)}" target="_blank" rel="noopener" class="social-profile-link">${t('viewOnFacebook')}</a>` : '';

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
            ${fb.address ? `<p class="social-profile-address">${escapeHtml(fb.address)}</p>` : ''}
            ${fb.phone ? `<p class="social-profile-phone">${escapeHtml(fb.phone)}</p>` : ''}
            ${fb.priceRange ? `<p class="social-profile-price">${t('priceRange')}: ${escapeHtml(fb.priceRange)}</p>` : ''}
            ${fbLinkHtml}
            ${fbReviewsHtml}
          </div>
        </div>
      `;
    }

    // Build Instagram profile HTML
    let instagramHtml = '';
    if (place.instagramData) {
      const ig = place.instagramData;
      // Use full-res imageUrl when available, fall back to thumbnail
      const igPostsGrid = (ig.posts || []).slice(0, 9).map(post => {
        const imgSrc = post.imageUrl || post.thumbnail;
        if (!imgSrc) return '';
        return `<a href="${escapeHtml(post.permalink)}" target="_blank" rel="noopener" class="ig-post-item" title="${escapeHtml((post.caption || '').substring(0, 100))}"><img src="${escapeHtml(imgSrc)}" alt="${escapeHtml((post.caption || '').substring(0, 50))}" loading="lazy">${post.likes ? `<span class="ig-post-likes">${post.likes.toLocaleString()}</span>` : ''}</a>`;
      }).filter(Boolean).join('');

      // Build bio links HTML
      const bioLinks = ig.bioLinks || [];
      let bioLinksHtml = '';
      if (bioLinks.length > 0) {
        bioLinksHtml = `<div class="ig-bio-links">${bioLinks.map(link =>
          `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener" class="ig-bio-link">${escapeHtml(link.title || link.url)}</a>`
        ).join('')}</div>`;
      }

      // Stats row
      const statsItems = [];
      if (ig.postCount) statsItems.push(`<span class="ig-stat"><strong>${ig.postCount.toLocaleString()}</strong> ${t('igPosts')}</span>`);
      if (ig.followerCount) statsItems.push(`<span class="ig-stat"><strong>${ig.followerCount.toLocaleString()}</strong> ${t('igFollowers')}</span>`);
      if (ig.followingCount) statsItems.push(`<span class="ig-stat"><strong>${ig.followingCount.toLocaleString()}</strong> ${t('igFollowing')}</span>`);
      const statsHtml = statsItems.length > 0 ? `<div class="ig-stats">${statsItems.join('')}</div>` : '';

      // External URL
      const extUrlHtml = ig.externalUrl ? `<a href="${escapeHtml(ig.externalUrl)}" target="_blank" rel="noopener" class="social-profile-link">${escapeHtml(ig.externalUrl)}</a>` : '';

      instagramHtml = `
        <div class="modal-section">
          <h3>${t('instagramProfile')}</h3>
          <div class="social-profile-card">
            <div class="social-profile-card-header">
              ${ig.avatar ? `<img src="${escapeHtml(ig.avatar)}" alt="" class="social-profile-avatar">` : ''}
              <div>
                <strong>@${escapeHtml(ig.username || '')}</strong>
                ${ig.isVerified ? `<span class="ig-verified" title="${t('igVerified')}">&#10003;</span>` : ''}
                ${ig.name ? `<span class="social-profile-name">${escapeHtml(ig.name)}</span>` : ''}
              </div>
            </div>
            ${statsHtml}
            ${ig.bio ? `<p class="social-profile-bio">${escapeHtml(ig.bio)}</p>` : ''}
            ${extUrlHtml}
            ${bioLinksHtml}
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
              ${formatCategory(place) ? `<span>${escapeHtml(formatCategory(place))}</span><span class="meta-sep">|</span>` : ''}
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
          <div id="social-enrich-container"></div>
          <div id="facebook-data-container">${facebookHtml}</div>
          <div id="instagram-data-container">${instagramHtml}</div>
          <div class="modal-section" id="social-profiles-section">
            <h3>${t('socialProfiles')}</h3>
            <p class="section-subtitle">${t('socialProfilesSubtitle')}</p>
            <div id="social-profiles-content">
              <div class="social-profiles-loading"><span class="spinner"></span></div>
            </div>
          </div>
          <div class="modal-section" id="research-report-section">
            <h3>${t('reportTitle')}</h3>
            <button class="btn btn-primary" id="generate-report-btn">${t('generateReport')}</button>
            <div id="research-report-container"></div>
          </div>
          <div class="modal-section" id="website-generation-section" style="display:none">
            <h3>${t('websiteGenTitle')}</h3>
            <button class="btn btn-primary" id="generate-website-btn">${t('generateWebsite')}</button>
            <div id="website-generation-container"></div>
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

    // Show "Enrich Social Data" button if FB/IG handles exist but data isn't loaded
    initEnrichSocialButton(modal, place);

    // Research report button
    const reportBtn = modal.querySelector('#generate-report-btn');
    if (reportBtn) {
      // If report already cached, render it immediately and hide button
      if (place.researchReport) {
        reportBtn.style.display = 'none';
        renderResearchReport(modal, place.researchReport);
        // Show website generation section since report exists
        const websiteSection = modal.querySelector('#website-generation-section');
        if (websiteSection) websiteSection.style.display = '';
      }
      reportBtn.addEventListener('click', () => generateResearchReport(modal, place, reportBtn));
    }

    // Website generation button
    const websiteBtn = modal.querySelector('#generate-website-btn');
    if (websiteBtn) {
      if (place.generatedWebsiteHtml) {
        websiteBtn.style.display = 'none';
        renderWebsitePreview(modal, place.generatedWebsiteHtml, place);
      }
      websiteBtn.addEventListener('click', () => generateWebsite(modal, place, websiteBtn));
    }
  }

  // ── Enrich Social Data Button ──
  function initEnrichSocialButton(modal, place) {
    const container = modal.querySelector('#social-enrich-container');
    if (!container) return;

    updateEnrichButton(container, modal, place);
  }

  function updateEnrichButton(container, modal, place) {
    const profiles = place.socialProfiles || [];
    const fbProfile = profiles.find(p => p.platform === 'facebook' && p.handle);
    const igProfile = profiles.find(p => p.platform === 'instagram' && p.handle);
    const canEnrichFb = fbProfile && !place.facebookData;
    const canEnrichIg = igProfile && !place.instagramData;

    if (!canEnrichFb && !canEnrichIg) {
      container.innerHTML = '';
      return;
    }

    const platformNames = [];
    if (canEnrichFb) platformNames.push('Facebook');
    if (canEnrichIg) platformNames.push('Instagram');

    container.innerHTML = `
      <div class="modal-section">
        <button class="btn btn-primary" id="enrich-social-btn">
          ${t('enrichSocialBtn')} (${platformNames.join(' + ')})
        </button>
      </div>
    `;

    const btn = container.querySelector('#enrich-social-btn');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = t('enrichingSocial');

      let success = false;

      // Fetch Facebook data
      if (canEnrichFb) {
        try {
          const res = await withTimeout(
            fetch('/api/enrich/facebook?username=' + encodeURIComponent(fbProfile.handle)),
            15000,
            'Facebook enrichment'
          );
          if (res.ok) {
            place.facebookData = await res.json();
            success = true;
            // Persist to Supabase
            if (supabaseClient && savedPlaceIds.has(place.placeId)) {
              saveFacebookData(place).catch(err =>
                console.warn('Failed to save Facebook data:', err)
              );
            }
          }
        } catch (err) {
          console.warn('Facebook enrichment failed for', place.name, err);
        }
      }

      // Fetch Instagram data
      if (canEnrichIg) {
        try {
          const res = await withTimeout(
            fetch('/api/enrich/instagram?username=' + encodeURIComponent(igProfile.handle)),
            15000,
            'Instagram enrichment'
          );
          if (res.ok) {
            place.instagramData = await res.json();
            success = true;
            // Persist to Supabase
            if (supabaseClient && savedPlaceIds.has(place.placeId)) {
              saveInstagramData(place).catch(err =>
                console.warn('Failed to save Instagram data:', err)
              );
            }
          }
        } catch (err) {
          console.warn('Instagram enrichment failed for', place.name, err);
        }
      }

      if (success) {
        showToast(t('enrichSocialSuccess'), 'success');
        // Re-render the Facebook and Instagram sections in the modal
        renderFacebookSection(modal, place);
        renderInstagramSection(modal, place);
        // Hide or update the enrich button
        updateEnrichButton(container, modal, place);
      } else {
        showToast(t('enrichSocialError'), 'error');
        btn.disabled = false;
        btn.textContent = t('enrichSocialBtn') + ' (' + platformNames.join(' + ') + ')';
      }
    });
  }

  function renderFacebookSection(modal, place) {
    const fbContainer = modal.querySelector('#facebook-data-container');
    if (!fbContainer || !place.facebookData) return;

    const fb = place.facebookData;
    const fbPhotos = [];
    if (fb.coverPhoto) fbPhotos.push(`<img src="${escapeHtml(fb.coverPhoto)}" alt="Cover photo" class="social-cover-photo">`);

    const fbReviews = (fb.reviews || []).slice(0, 5);
    let fbReviewsHtml = '';
    if (fbReviews.length > 0) {
      const fbReviewItems = fbReviews.map(r => `
        <div class="review-item">
          <div class="review-header">
            ${r.authorPhoto ? `<img src="${escapeHtml(r.authorPhoto)}" alt="" class="review-author-photo">` : ''}
            <div>
              <strong class="review-author">${escapeHtml(r.authorName || t('anonymous'))}</strong>
              ${r.date ? `<span class="review-date">${escapeHtml(r.date)}</span>` : ''}
            </div>
            ${r.rating ? `<span class="stars">${renderStars(r.rating)}</span>` : ''}
          </div>
          <p class="review-text">${escapeHtml(r.text)}</p>
          ${r.reactionsCount ? `<span class="fb-reactions">${r.reactionsCount} ${t('fbReactions')}</span>` : ''}
        </div>
      `).join('');
      fbReviewsHtml = `
        <div class="fb-reviews">
          <h4>${t('fbReviewsTitle', fbReviews.length)}</h4>
          ${fbReviewItems}
        </div>
      `;
    }

    const fbLinkHtml = fb.link ? `<a href="${escapeHtml(fb.link)}" target="_blank" rel="noopener" class="social-profile-link">${t('viewOnFacebook')}</a>` : '';

    fbContainer.innerHTML = `
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
          ${fb.address ? `<p class="social-profile-address">${escapeHtml(fb.address)}</p>` : ''}
          ${fb.phone ? `<p class="social-profile-phone">${escapeHtml(fb.phone)}</p>` : ''}
          ${fb.priceRange ? `<p class="social-profile-price">${t('priceRange')}: ${escapeHtml(fb.priceRange)}</p>` : ''}
          ${fbLinkHtml}
          ${fbReviewsHtml}
        </div>
      </div>
    `;
  }

  function renderInstagramSection(modal, place) {
    const igContainer = modal.querySelector('#instagram-data-container');
    if (!igContainer || !place.instagramData) return;

    const ig = place.instagramData;
    const igPostsGrid = (ig.posts || []).slice(0, 9).map(post => {
      const imgSrc = post.imageUrl || post.thumbnail;
      if (!imgSrc) return '';
      return `<a href="${escapeHtml(post.permalink)}" target="_blank" rel="noopener" class="ig-post-item" title="${escapeHtml((post.caption || '').substring(0, 100))}"><img src="${escapeHtml(imgSrc)}" alt="${escapeHtml((post.caption || '').substring(0, 50))}" loading="lazy">${post.likes ? `<span class="ig-post-likes">${post.likes.toLocaleString()}</span>` : ''}</a>`;
    }).filter(Boolean).join('');

    const bioLinks = ig.bioLinks || [];
    let bioLinksHtml = '';
    if (bioLinks.length > 0) {
      bioLinksHtml = `<div class="ig-bio-links">${bioLinks.map(link =>
        `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener" class="ig-bio-link">${escapeHtml(link.title || link.url)}</a>`
      ).join('')}</div>`;
    }

    const statsItems = [];
    if (ig.postCount) statsItems.push(`<span class="ig-stat"><strong>${ig.postCount.toLocaleString()}</strong> ${t('igPosts')}</span>`);
    if (ig.followerCount) statsItems.push(`<span class="ig-stat"><strong>${ig.followerCount.toLocaleString()}</strong> ${t('igFollowers')}</span>`);
    if (ig.followingCount) statsItems.push(`<span class="ig-stat"><strong>${ig.followingCount.toLocaleString()}</strong> ${t('igFollowing')}</span>`);
    const statsHtml = statsItems.length > 0 ? `<div class="ig-stats">${statsItems.join('')}</div>` : '';

    const extUrlHtml = ig.externalUrl ? `<a href="${escapeHtml(ig.externalUrl)}" target="_blank" rel="noopener" class="social-profile-link">${escapeHtml(ig.externalUrl)}</a>` : '';

    igContainer.innerHTML = `
      <div class="modal-section">
        <h3>${t('instagramProfile')}</h3>
        <div class="social-profile-card">
          <div class="social-profile-card-header">
            ${ig.avatar ? `<img src="${escapeHtml(ig.avatar)}" alt="" class="social-profile-avatar">` : ''}
            <div>
              <strong>@${escapeHtml(ig.username || '')}</strong>
              ${ig.isVerified ? `<span class="ig-verified" title="${t('igVerified')}">&#10003;</span>` : ''}
              ${ig.name ? `<span class="social-profile-name">${escapeHtml(ig.name)}</span>` : ''}
            </div>
          </div>
          ${statsHtml}
          ${ig.bio ? `<p class="social-profile-bio">${escapeHtml(ig.bio)}</p>` : ''}
          ${extUrlHtml}
          ${bioLinksHtml}
          ${igPostsGrid ? `<div class="ig-posts-grid">${igPostsGrid}</div>` : ''}
        </div>
      </div>
    `;
  }

  // ── Deep Research Report ──
  function buildPhotoInventoryMap(place) {
    const inventory = [];

    // Google photos
    if (place.photos && place.photos.length > 0) {
      place.photos.forEach((photo, i) => {
        const url = getPhotoUrl(photo, 800);
        if (url) {
          inventory.push({
            id: `google_photo_${i}`,
            source: 'google',
            type: photo.photoType || 'unclassified',
            caption: null,
            url: url,
          });
        }
      });
    }

    // Facebook photos
    if (place.facebookData) {
      const fb = place.facebookData;
      if (fb.profilePhoto) {
        inventory.push({ id: 'fb_profile', source: 'facebook', type: 'logo', caption: fb.name || null, url: fb.profilePhoto });
      }
      if (fb.coverPhoto) {
        inventory.push({ id: 'fb_cover', source: 'facebook', type: 'exterior', caption: null, url: fb.coverPhoto });
      }
    }

    // Instagram photos
    if (place.instagramData) {
      const ig = place.instagramData;
      if (ig.avatar) {
        inventory.push({ id: 'ig_avatar', source: 'instagram', type: 'logo', caption: null, url: ig.avatar });
      }
      if (ig.posts && ig.posts.length > 0) {
        ig.posts.forEach((post, i) => {
          const imgUrl = post.imageUrl || post.thumbnail;
          if (imgUrl) {
            inventory.push({
              id: `ig_post_${i}`,
              source: 'instagram',
              type: 'unclassified',
              caption: post.caption ? post.caption.substring(0, 150) : null,
              url: imgUrl,
            });
          }
        });
      }
    }

    return inventory;
  }

  function compileBusinessDataForPrompt(place) {
    const sections = [];

    // Core identity
    sections.push('=== BUSINESS IDENTITY ===');
    sections.push(`Name: ${place.name}`);
    sections.push(`Address: ${place.address}`);
    if (place.phone) sections.push(`Phone: ${place.phone}`);
    const catDisplay = formatCategory(place);
    if (catDisplay) sections.push(`Category: ${catDisplay}`);
    if (place.types && place.types.length > 0) sections.push(`Google Types: ${place.types.join(', ')}`);
    if (place.status) sections.push(`Status: ${place.status}`);
    if (place.description) sections.push(`Description: ${place.description}`);

    // Ratings
    sections.push('\n=== RATINGS & REVIEWS OVERVIEW ===');
    sections.push(`Google Rating: ${place.rating || 'N/A'} / 5`);
    sections.push(`Total Reviews: ${place.reviewCount || 0}`);
    if (place.priceLevel || place.priceDescription) {
      sections.push(`Price Level: ${place.priceDescription || place.priceLevel}`);
    }
    if (place.reviewsHistogram) {
      const h = place.reviewsHistogram;
      sections.push(`Rating Breakdown: 5★=${h['5']||0}, 4★=${h['4']||0}, 3★=${h['3']||0}, 2★=${h['2']||0}, 1★=${h['1']||0}`);
    }

    // Google reviews (up to 15)
    if (place.reviewData && place.reviewData.length > 0) {
      sections.push('\n=== GOOGLE REVIEWS ===');
      place.reviewData.slice(0, 15).forEach((r, i) => {
        const author = r.authorAttribution ? r.authorAttribution.displayName || 'Anonymous' : 'Anonymous';
        sections.push(`Review ${i + 1} (${r.rating}★ by ${author}): "${r.text}"`);
      });
    }

    // Hours
    if (place.hours && place.hours.length > 0) {
      sections.push('\n=== BUSINESS HOURS ===');
      place.hours.forEach(h => sections.push(h));
    }

    // Service options, highlights, amenities, accessibility
    if (place.serviceOptions && place.serviceOptions.length > 0) {
      sections.push(`\n=== SERVICE OPTIONS ===\n${place.serviceOptions.join(', ')}`);
    }
    if (place.highlights && place.highlights.length > 0) {
      sections.push(`\n=== HIGHLIGHTS ===\n${place.highlights.join(', ')}`);
    }
    if (place.amenities && place.amenities.length > 0) {
      sections.push(`\n=== AMENITIES ===\n${place.amenities.join(', ')}`);
    }
    if (place.accessibility && place.accessibility.length > 0) {
      sections.push(`\n=== ACCESSIBILITY ===\n${place.accessibility.join(', ')}`);
    }

    // Social profiles
    if (place.socialProfiles && place.socialProfiles.length > 0) {
      sections.push('\n=== SOCIAL MEDIA PROFILES ===');
      place.socialProfiles.forEach(sp => {
        sections.push(`${sp.platform}: ${sp.url}${sp.handle ? ' (@' + sp.handle + ')' : ''}`);
      });
    }

    // Facebook data
    if (place.facebookData) {
      const fb = place.facebookData;
      sections.push('\n=== FACEBOOK DATA ===');
      if (fb.name) sections.push(`Page Name: ${fb.name}`);
      if (fb.category) sections.push(`Category: ${Array.isArray(fb.category) ? fb.category.join(', ') : fb.category}`);
      if (fb.followers) sections.push(`Followers: ${fb.followers.toLocaleString()}`);
      if (fb.rating) sections.push(`Facebook Rating: ${fb.rating}`);
      if (fb.ratingsText) sections.push(`Rating Text: ${fb.ratingsText}`);
      if (fb.priceRange) sections.push(`Price Range: ${fb.priceRange}`);
      if (fb.address) sections.push(`Facebook Address: ${fb.address}`);
      // Facebook reviews (up to 5)
      if (fb.reviews && fb.reviews.length > 0) {
        sections.push('Facebook Reviews:');
        fb.reviews.slice(0, 5).forEach((r, i) => {
          sections.push(`  FB Review ${i + 1} (${r.rating || 'N/A'}★ by ${r.authorName || 'Anonymous'}): "${r.text}"`);
        });
      }
    }

    // Instagram data
    if (place.instagramData) {
      const ig = place.instagramData;
      sections.push('\n=== INSTAGRAM DATA ===');
      if (ig.username) sections.push(`Username: @${ig.username}`);
      if (ig.name) sections.push(`Display Name: ${ig.name}`);
      if (ig.bio) sections.push(`Bio: ${ig.bio}`);
      if (ig.followerCount) sections.push(`Followers: ${ig.followerCount.toLocaleString()}`);
      if (ig.followingCount) sections.push(`Following: ${ig.followingCount.toLocaleString()}`);
      if (ig.postCount) sections.push(`Total Posts: ${ig.postCount.toLocaleString()}`);
      if (ig.isVerified) sections.push('Verified: Yes');
      if (ig.externalUrl) sections.push(`Website in Bio: ${ig.externalUrl}`);
      // Recent post captions (up to 10)
      if (ig.posts && ig.posts.length > 0) {
        sections.push('Recent Post Captions:');
        ig.posts.slice(0, 10).forEach((post, i) => {
          if (post.caption) {
            sections.push(`  Post ${i + 1} (${post.likes || 0} likes): "${post.caption.substring(0, 300)}"`);
          }
        });
      }
    }

    // Photo inventory (individual photos with IDs for asset planning)
    const photoInventory = buildPhotoInventoryMap(place);
    place._photoInventory = photoInventory;
    if (photoInventory.length > 0) {
      sections.push('\n=== PHOTO INVENTORY ===');
      sections.push(`Total Photos Available: ${photoInventory.length}`);
      photoInventory.forEach(p => {
        let line = `ID: ${p.id} | Source: ${p.source} | Type: ${p.type}`;
        if (p.caption) line += ` | Caption: "${p.caption}"`;
        sections.push(line);
      });
    }

    // Web reviews (external platforms)
    if (place.webReviews && place.webReviews.length > 0) {
      sections.push('\n=== EXTERNAL PLATFORM RATINGS ===');
      place.webReviews.forEach(wr => {
        sections.push(`${wr.source}: ${wr.rating || 'N/A'} rating, ${wr.reviewCount || 0} reviews`);
      });
    }

    return sections.join('\n');
  }

  // ── SSE Report Parsing Helper ──
  async function parseSSEReportResponse(response) {
    let fullText = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const eventData = line.slice(6).trim();
        if (eventData === '[DONE]') continue;
        try {
          const event = JSON.parse(eventData);
          if (event.type === 'content_block_delta' && event.delta && event.delta.type === 'text_delta') {
            fullText += event.delta.text;
          }
        } catch (e) { /* skip malformed SSE events */ }
      }
    }

    let jsonText = fullText.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    try {
      return JSON.parse(jsonText);
    } catch (parseErr) {
      console.warn('Report JSON parse failed:', parseErr.message);
      return { rawText: fullText, parseError: true };
    }
  }

  // ── Fetch Report API (shared by modal and table) ──
  async function fetchReportFromApi(place) {
    const businessData = compileBusinessDataForPrompt(place);
    const language = getSearchLanguage();
    const res = await withTimeout(
      fetch('/api/ai/research-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessData, name: place.name, language }),
      }),
      120000,
      'Research report'
    );
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Request failed');
    }
    return parseSSEReportResponse(res);
  }

  // ── Table Action Handlers ──
  async function handleTableReport(place, btn) {
    if (place.researchReport) {
      openDetailModal(place);
      return;
    }
    btn.disabled = true;
    btn.textContent = t('generatingReport');
    try {
      const report = await fetchReportFromApi(place);
      place.researchReport = report;
      btn.disabled = false;
      btn.textContent = '\u2713';
      btn.title = t('generateReport');
      showToast(t('reportSuccess', place.name), 'success');
      // Enable AI photos button (website requires photos first)
      const row = btn.closest('tr');
      const photosBtn = row ? row.querySelector('.btn-photos') : null;
      if (photosBtn) photosBtn.disabled = false;
    } catch (err) {
      console.error('Research report error:', err);
      showToast(t('reportError'), 'error');
      btn.disabled = false;
      btn.textContent = t('btnReport');
    }
  }

  async function handleTableAiPhotos(place, btn) {
    // If already generated, open detail modal to view them
    if (place.generatedPhotos) {
      openDetailModal(place);
      return;
    }
    if (!place.researchReport) {
      showToast(t('needsReport'), 'warning');
      return;
    }

    const report = place.researchReport;
    const plan = report.photoAssetPlan || [];
    const aiItems = plan.filter(item => item.recommendation === 'generate_ai' && item.aiPrompt);

    // If no AI photos needed, mark as complete immediately
    if (aiItems.length === 0) {
      place.generatedPhotos = [];
      btn.textContent = '\u2713';
      showToast(t('photosNoneNeeded'), 'success');
      const row = btn.closest('tr');
      const websiteBtn = row ? row.querySelector('.btn-website') : null;
      if (websiteBtn) websiteBtn.disabled = false;
      return;
    }

    btn.disabled = true;
    btn.textContent = t('generatingPhotos');
    const generated = [];

    try {
      for (let i = 0; i < aiItems.length; i++) {
        const item = aiItems[i];
        btn.textContent = `${i + 1}/${aiItems.length}...`;

        const res = await withTimeout(
          fetch('/api/ai/generate-photos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: item.aiPrompt,
              section: item.section,
              slot: item.slot,
            }),
          }),
          90000,
          'Photo generation'
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn(`Photo generation failed for ${item.section}/${item.slot}:`, errData.error);
          continue;
        }

        const data = await res.json();
        generated.push({
          id: `ai_${(item.section || 'photo').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${i}`,
          section: item.section,
          slot: item.slot,
          url: data.url,
          source: 'ai_generated',
          type: 'ai_generated',
        });
      }

      place.generatedPhotos = generated;
      btn.disabled = false;
      btn.textContent = '\u2713';
      showToast(t('photosSuccess', place.name), 'success');

      // Enable website button
      const row = btn.closest('tr');
      const websiteBtn = row ? row.querySelector('.btn-website') : null;
      if (websiteBtn) websiteBtn.disabled = false;
    } catch (err) {
      console.error('Photo generation error:', err);
      showToast(t('photosError'), 'error');
      btn.disabled = false;
      btn.textContent = t('btnPhotos');
    }
  }

  async function handleTableWebsite(place, btn) {
    if (place.generatedWebsiteHtml) {
      openDetailModal(place);
      return;
    }
    if (!place.researchReport) {
      showToast(t('needsReport'), 'warning');
      return;
    }
    if (!place.generatedPhotos) {
      showToast(t('needsPhotos'), 'warning');
      return;
    }
    btn.disabled = true;
    btn.textContent = t('generatingWebsite');
    try {
      const businessData = compileBusinessDataForPrompt(place);
      const baseInventory = place._photoInventory || buildPhotoInventoryMap(place);
      // Include AI-generated photos in the inventory
      const photoInventory = [...baseInventory, ...(place.generatedPhotos || [])];
      const language = getSearchLanguage();
      const res = await withTimeout(
        fetch('/api/ai/generate-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessData,
            researchReport: place.researchReport,
            photoInventory: photoInventory.map(p => ({ id: p.id, type: p.type, url: p.url })),
            name: place.name,
            language,
          }),
        }),
        130000,
        'Website generation'
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Request failed');
      }
      const data = await res.json();
      place.generatedWebsiteHtml = data.html;
      btn.disabled = false;
      btn.textContent = '\u2713';
      btn.title = t('generateWebsite');
      showToast(t('websiteSuccess', place.name), 'success');
      saveGeneratedWebsite(place, data.html).catch(err =>
        console.warn('Failed to save generated website:', err)
      );
    } catch (err) {
      console.error('Website generation error:', err);
      showToast(t('websiteError'), 'error');
      btn.disabled = false;
      btn.textContent = t('btnWebsite');
    }
  }

  // ── Research Report (Modal) ──
  async function generateResearchReport(modal, place, btn) {
    if (place.researchReport) {
      btn.style.display = 'none';
      renderResearchReport(modal, place.researchReport);
      return;
    }

    const container = modal.querySelector('#research-report-container');
    if (!container) return;

    btn.disabled = true;
    btn.textContent = t('generatingReport');
    container.innerHTML = `<div class="report-loading"><span class="spinner"></span><p>${t('reportGenerating')}</p></div>`;

    try {
      const report = await fetchReportFromApi(place);
      place.researchReport = report;

      if (!document.getElementById('detail-modal')) return;

      btn.style.display = 'none';
      renderResearchReport(modal, report);

      const websiteSection = modal.querySelector('#website-generation-section');
      if (websiteSection) websiteSection.style.display = '';
    } catch (err) {
      console.error('Research report error:', err);
      showToast(t('reportError'), 'error');
      btn.disabled = false;
      btn.textContent = t('generateReport');
      container.innerHTML = '';
    }
  }

  function renderResearchReport(modal, report) {
    const container = modal.querySelector('#research-report-container');
    if (!container) return;

    // Handle raw text fallback (JSON parse failed on server)
    if (report.parseError && report.rawText) {
      container.innerHTML = `<div class="report-raw-text"><p>${escapeHtml(report.rawText)}</p></div>`;
      return;
    }

    let html = '';

    // Business Summary
    if (report.businessSummary) {
      html += `<div class="report-section">
        <h4>${t('reportBusinessSummary')}</h4>
        <p>${escapeHtml(report.businessSummary)}</p>
      </div>`;
    }

    // Key Selling Points
    if (report.keySellingPoints && report.keySellingPoints.length > 0) {
      const tags = report.keySellingPoints.map(p => `<span class="feature-tag">${escapeHtml(p)}</span>`).join('');
      html += `<div class="report-section">
        <h4>${t('reportSellingPoints')}</h4>
        <div class="features-grid">${tags}</div>
      </div>`;
    }

    // Review Highlights
    if (report.reviewHighlights) {
      const rh = report.reviewHighlights;
      let rhHtml = '';

      if (rh.themes && rh.themes.length > 0) {
        const tags = rh.themes.map(th => `<span class="feature-tag">${escapeHtml(th)}</span>`).join('');
        rhHtml += `<div class="report-subsection">
          <h5>${t('reportReviewThemes')}</h5>
          <div class="features-grid">${tags}</div>
        </div>`;
      }

      if (rh.quotableReviews && rh.quotableReviews.length > 0) {
        const quotes = rh.quotableReviews.map(q => `<blockquote class="report-blockquote">${escapeHtml(q)}</blockquote>`).join('');
        rhHtml += `<div class="report-subsection">
          <h5>${t('reportQuotableReviews')}</h5>
          ${quotes}
        </div>`;
      }

      if (rh.areasToAvoid && rh.areasToAvoid.length > 0) {
        const tags = rh.areasToAvoid.map(a => `<span class="feature-tag report-warning-tag">${escapeHtml(a)}</span>`).join('');
        rhHtml += `<div class="report-subsection">
          <h5>${t('reportAreasToAvoid')}</h5>
          <div class="features-grid">${tags}</div>
        </div>`;
      }

      if (rhHtml) {
        html += `<div class="report-section">
          <h4>${t('reportReviewHighlights')}</h4>
          ${rhHtml}
        </div>`;
      }
    }

    // Suggested Website Sections
    if (report.suggestedSections && report.suggestedSections.length > 0) {
      const items = report.suggestedSections.map(s => {
        const priorityKey = 'reportPriority' + s.priority.charAt(0).toUpperCase() + s.priority.slice(1);
        const priorityClass = s.priority === 'high' ? 'badge-priority-high' : s.priority === 'medium' ? 'badge-priority-medium' : 'badge-priority-low';
        return `<div class="report-section-item">
          <div class="report-section-item-header">
            <strong>${escapeHtml(s.name)}</strong>
            <span class="badge ${priorityClass}">${t(priorityKey)}</span>
          </div>
          <p>${escapeHtml(s.description)}</p>
        </div>`;
      }).join('');
      html += `<div class="report-section">
        <h4>${t('reportSuggestedSections')}</h4>
        ${items}
      </div>`;
    }

    // Tone Recommendations
    if (report.toneRecommendations) {
      const tone = report.toneRecommendations;
      let toneHtml = '';
      if (tone.overallTone) {
        toneHtml += `<p><strong>${t('reportOverallTone')}:</strong> ${escapeHtml(tone.overallTone)}</p>`;
      }
      if (tone.writingStyle) {
        toneHtml += `<p><strong>${t('reportWritingStyle')}:</strong> ${escapeHtml(tone.writingStyle)}</p>`;
      }
      if (tone.wordsToUse && tone.wordsToUse.length > 0) {
        const tags = tone.wordsToUse.map(w => `<span class="feature-tag">${escapeHtml(w)}</span>`).join('');
        toneHtml += `<div class="report-subsection"><h5>${t('reportWordsToUse')}</h5><div class="features-grid">${tags}</div></div>`;
      }
      if (tone.wordsToAvoid && tone.wordsToAvoid.length > 0) {
        const tags = tone.wordsToAvoid.map(w => `<span class="feature-tag report-warning-tag">${escapeHtml(w)}</span>`).join('');
        toneHtml += `<div class="report-subsection"><h5>${t('reportWordsToAvoid')}</h5><div class="features-grid">${tags}</div></div>`;
      }
      if (toneHtml) {
        html += `<div class="report-section"><h4>${t('reportToneRec')}</h4>${toneHtml}</div>`;
      }
    }

    // Competitive Positioning
    if (report.competitivePositioning) {
      html += `<div class="report-section">
        <h4>${t('reportCompetitive')}</h4>
        <p>${escapeHtml(report.competitivePositioning)}</p>
      </div>`;
    }

    // Content Gaps
    if (report.contentGaps && report.contentGaps.length > 0) {
      const tags = report.contentGaps.map(g => `<span class="feature-tag report-warning-tag">${escapeHtml(g)}</span>`).join('');
      html += `<div class="report-section">
        <h4>${t('reportContentGaps')}</h4>
        <div class="features-grid">${tags}</div>
      </div>`;
    }

    // Social Media Insights
    if (report.socialMediaInsights) {
      html += `<div class="report-section">
        <h4>${t('reportSocialInsights')}</h4>
        <p>${escapeHtml(report.socialMediaInsights)}</p>
      </div>`;
    }

    // Local SEO Keywords
    if (report.localSeoKeywords && report.localSeoKeywords.length > 0) {
      const tags = report.localSeoKeywords.map(k => `<span class="feature-tag feature-tag-highlight">${escapeHtml(k)}</span>`).join('');
      html += `<div class="report-section">
        <h4>${t('reportSeoKeywords')}</h4>
        <div class="features-grid">${tags}</div>
      </div>`;
    }

    // Photo Asset Plan
    if (report.photoAssetPlan && report.photoAssetPlan.length > 0) {
      const items = report.photoAssetPlan.map(p => {
        const isExisting = p.recommendation === 'use_existing';
        const badgeClass = isExisting ? 'badge-has-site' : 'badge-no-site';
        const badgeText = isExisting ? t('reportPhotoExisting') : t('reportPhotoGenerate');

        let detailHtml = '';
        if (isExisting && p.existingPhotoId) {
          detailHtml = `<p class="photo-plan-detail"><strong>${t('reportPhotoSource')}:</strong> ${escapeHtml(p.existingPhotoId)}</p>`;
        } else if (p.aiPrompt) {
          detailHtml = `<p class="photo-plan-detail"><strong>${t('reportPhotoPrompt')}:</strong> ${escapeHtml(p.aiPrompt)}</p>`;
        }

        return `<div class="report-section-item">
          <div class="report-section-item-header">
            <strong>${escapeHtml(p.section)} — ${escapeHtml(p.slot)}</strong>
            <span class="badge ${badgeClass}">${badgeText}</span>
          </div>
          <p>${escapeHtml(p.rationale || '')}</p>
          ${detailHtml}
        </div>`;
      }).join('');

      html += `<div class="report-section">
        <h4>${t('reportPhotoAssetPlan')}</h4>
        ${items}
      </div>`;
    }

    container.innerHTML = html;
  }

  // ── Website Generation ──
  async function generateWebsite(modal, place, btn) {
    if (place.generatedWebsiteHtml) {
      btn.style.display = 'none';
      renderWebsitePreview(modal, place.generatedWebsiteHtml, place);
      return;
    }

    const container = modal.querySelector('#website-generation-container');
    if (!container) return;

    btn.disabled = true;
    btn.textContent = t('generatingWebsite');
    container.innerHTML = `<div class="report-loading"><span class="spinner"></span><p>${t('websiteGenerating')}</p></div>`;

    try {
      const businessData = compileBusinessDataForPrompt(place);
      const photoInventory = place._photoInventory || buildPhotoInventoryMap(place);
      const language = getSearchLanguage();

      const res = await withTimeout(
        fetch('/api/ai/generate-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessData,
            researchReport: place.researchReport,
            photoInventory: photoInventory.map(p => ({ id: p.id, type: p.type, url: p.url })),
            name: place.name,
            language,
          }),
        }),
        130000,
        'Website generation'
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Request failed');
      }

      const data = await res.json();
      place.generatedWebsiteHtml = data.html;

      // Check modal still exists
      if (!document.getElementById('detail-modal')) return;

      btn.style.display = 'none';
      renderWebsitePreview(modal, data.html, place);

      // Auto-save to Supabase if business is saved
      saveGeneratedWebsite(place, data.html).catch(err =>
        console.warn('Failed to save generated website:', err)
      );
    } catch (err) {
      console.error('Website generation error:', err);
      showToast(t('websiteError'), 'error');
      btn.disabled = false;
      btn.textContent = t('generateWebsite');
      container.innerHTML = '';
    }
  }

  function renderWebsitePreview(modal, html, place) {
    const container = modal.querySelector('#website-generation-container');
    if (!container) return;

    container.innerHTML = `
      <div class="website-preview-wrapper">
        <div class="website-preview-toolbar">
          <button class="btn btn-secondary" id="website-download-btn">${t('websiteDownload')}</button>
          <button class="btn btn-secondary" id="website-new-tab-btn">${t('websiteOpenNewTab')}</button>
        </div>
        <iframe id="website-preview-iframe" class="website-preview-iframe" sandbox="allow-same-origin"></iframe>
      </div>
    `;

    // Write HTML into iframe
    const iframe = container.querySelector('#website-preview-iframe');
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Download button
    container.querySelector('#website-download-btn').addEventListener('click', () => {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${place.name.replace(/[^a-zA-Z0-9]/g, '_')}_website.html`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Open in new tab
    container.querySelector('#website-new-tab-btn').addEventListener('click', () => {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }

  async function saveGeneratedWebsite(place, html) {
    if (!supabaseClient) return;
    if (!savedPlaceIds.has(place.placeId)) return;

    const businessId = await getBusinessId(place.placeId);
    if (!businessId) return;

    try {
      const { error } = await supabaseClient
        .from('generated_websites')
        .insert({
          business_id: businessId,
          template_name: 'ai_generated_single_page',
          status: 'draft',
          config: {
            html: html,
            researchReport: place.researchReport,
            generatedAt: new Date().toISOString(),
            photoInventory: (place._photoInventory || []).map(p => ({ id: p.id, url: p.url, type: p.type })),
          },
        });

      if (error) {
        console.warn('Website save error:', error);
      } else {
        showToast(t('websiteSaved'), 'success');
      }
    } catch (e) {
      console.warn('Website save exception:', e);
    }
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
          showToastWithLink(t('saveRowSuccess', place.name), 'success', t('viewInPipeline'), 'pipeline-anchor');
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

    // Merge DB profiles into place.socialProfiles so enrich button can detect handles
    if (profiles.length > 0) {
      if (!place.socialProfiles) place.socialProfiles = [];
      for (const dbProfile of profiles) {
        const existing = place.socialProfiles.find(sp => sp.platform === dbProfile.platform);
        if (!existing) {
          place.socialProfiles.push({
            platform: dbProfile.platform,
            url: dbProfile.url,
            handle: dbProfile.handle || null,
          });
        } else if (!existing.handle && dbProfile.handle) {
          existing.handle = dbProfile.handle;
        }
      }
      // Re-check enrich button now that we have DB profiles
      const enrichContainer = modal.querySelector('#social-enrich-container');
      if (enrichContainer) updateEnrichButton(enrichContainer, modal, place);
    }

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
  // Wait for auth guard (auth.js) to verify employee before initializing
  // ── Mobile Bottom Nav (Search Page) ──
  function initMobileNav() {
    const bottomNav = document.getElementById('bottom-nav');
    const subNavRow = document.getElementById('sub-nav-row');
    if (!bottomNav || !subNavRow) return;

    // Pipeline group is active on search page, Search sub-item highlighted
    subNavRow.innerHTML = '<a href="/employee" class="sub-nav-pill active">' + t('navSearch') + '</a>' +
      '<a href="/employee/admin" class="sub-nav-pill">' + t('navPipeline') + '</a>';
    subNavRow.style.display = '';
    subNavRow.classList.add('visible');

    // Other groups navigate to admin page with hash
    bottomNav.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.group;
        if (group === 'pipeline') {
          // Already here — just highlight
          bottomNav.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          subNavRow.innerHTML = '<a href="/employee" class="sub-nav-pill active">' + t('navSearch') + '</a>' +
            '<a href="/employee/admin" class="sub-nav-pill">' + t('navPipeline') + '</a>';
          subNavRow.style.display = '';
          subNavRow.classList.add('visible');
        } else if (group === 'settings') {
          // Show lang toggle in sub-nav
          bottomNav.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          var lang = localStorage.getItem('app_lang') || 'en';
          subNavRow.innerHTML = '<button class="sub-nav-pill ' + (lang === 'en' ? 'active' : '') + '" data-lang-toggle="en">EN</button>' +
            '<button class="sub-nav-pill ' + (lang === 'es' ? 'active' : '') + '" data-lang-toggle="es">ES</button>';
          subNavRow.style.display = '';
          subNavRow.classList.add('visible');
          subNavRow.querySelectorAll('[data-lang-toggle]').forEach(pill => {
            pill.addEventListener('click', () => {
              currentLang = pill.dataset.langToggle;
              localStorage.setItem('app_lang', currentLang);
              applyLanguage();
              initMobileNav(); // re-render
            });
          });
        } else {
          window.location.href = '/employee/admin#' + group;
        }
      });
    });
  }

  // Desktop dropdown toggle for search page
  function initDesktopDropdowns() {
    document.querySelectorAll('.nav-group-trigger').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        const group = trigger.closest('.nav-group');
        if (!group || !group.querySelector('.nav-dropdown')) return;
        e.preventDefault();
        document.querySelectorAll('.nav-group.open').forEach(g => {
          if (g !== group) g.classList.remove('open');
        });
        group.classList.toggle('open');
      });
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-group')) {
        document.querySelectorAll('.nav-group.open').forEach(g => g.classList.remove('open'));
      }
    });
    // Lang buttons in desktop dropdown
    document.querySelectorAll('.nav-dropdown-lang .lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentLang = btn.dataset.lang;
        localStorage.setItem('app_lang', currentLang);
        applyLanguage();
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === currentLang));
      });
    });
  }

  function startApp() {
    // Only initialize search — admin.js handles app container, user info, and navigation
    init();
  }

  if (window.__employeeAuth) {
    startApp();
  } else {
    document.addEventListener('employee-auth-ready', startApp);
  }
})();
