// === Operator Admin — Local Business Finder ===

(function () {
  'use strict';

  // ── i18n ──
  let currentLang = localStorage.getItem('app_lang') || 'en';

  const translations = {
    en: {
      adminTitle: 'Saved Businesses',
      adminTagline: 'View and manage all businesses saved to the database',
      navSearch: 'Search',
      navSaved: 'Saved',
      statTotal: 'Total Businesses',
      statWithReviews: 'With Reviews',
      statWithInstagram: 'With Instagram',
      statWithWebsites: 'With Websites',
      filtersTitle: 'Filters',
      clearFilters: 'Clear Filters',
      applyFilters: 'Apply Filters',
      filterLocation: 'Location',
      filterLocationPlaceholder: 'City, state, or zip...',
      filterCountry: 'Country',
      filterAll: 'All',
      filterAny: 'Any',
      filterYes: 'Yes',
      filterNo: 'No',
      filterType: 'Business Type',
      filterMinRating: 'Min Rating',
      filterMinReviews: 'Min Reviews',
      filterHasInstagram: 'Has Instagram',
      filterMinPosts: 'Min IG Posts',
      filterHasFacebook: 'Has Facebook',
      filterHasReport: 'Has Report',
      filterHasWebsite: 'Has Website',
      adminResultsTitle: 'Saved Businesses',
      prevPage: 'Prev',
      nextPage: 'Next',
      pageInfo: 'Page {0} of {1}',
      showingCount: 'Showing {0} of {1} businesses',
      adminNoResults: 'No businesses match your filters.',
      adminFooter: 'Operator Admin — Local Business Finder',
      thName: 'Business Name',
      thLocation: 'Location',
      thType: 'Type',
      thPhone: 'Phone',
      thRating: 'Rating',
      thReviews: 'Reviews',
      thSocial: 'Social',
      thDetails: 'Details',
      thReport: 'Report',
      thWebsite: 'Website',
      thActions: 'Actions',
      viewBtn: 'View',
      badgeYes: 'Yes',
      badgeNo: '—',
      noData: 'No Data',
      // Modal detail sections
      modalDescription: 'Description',
      modalServiceOptions: 'Service Options',
      modalHighlights: 'Highlights',
      modalAmenities: 'Amenities',
      modalAccessibility: 'Accessibility',
      modalReviewBreakdown: 'Review Breakdown',
      topPick: 'Top Pick',
      good: 'Good',
      topReviewsTitle: 'Top Reviews',
      topReviewsSubtitle: 'Best reviews selected by sentiment analysis',
      noReviewsAvailable: 'No reviews available',
      copyTopReviews: 'Copy Top Reviews',
      closeBtn: 'Close',
      facebookProfile: 'Facebook Profile',
      instagramProfile: 'Instagram Profile',
      followers: '{0} followers',
      viewOnFacebook: 'View on Facebook',
      fbReactions: 'reactions',
      fbReviewsTitle: 'Facebook Reviews ({0})',
      igPosts: 'posts',
      igFollowers: 'followers',
      igFollowing: 'following',
      igVerified: 'Verified account',
      priceRange: 'Price Range',
      anonymous: 'Anonymous',
      reviews: 'reviews',
      noReviews: 'No reviews',
      badgeDraft: 'Draft',
      badgePublished: 'Published',
      loadingData: 'Loading...',
      errorLoading: 'Failed to load data. Please refresh.',
      // Detail modal
      modalClose: 'Close',
      modalBusinessDetails: 'Business Details',
      modalAddress: 'Address',
      modalPhone: 'Phone',
      modalRating: 'Rating',
      modalReviews: 'Reviews',
      modalHours: 'Business Hours',
      modalTypes: 'Categories',
      modalSocialProfiles: 'Social Profiles',
      modalPhotos: 'Photos',
      modalGoogleReviews: 'Google Reviews',
      modalFacebookReviews: 'Facebook Reviews',
      // Research report
      generateReport: 'Generate Research Report',
      generatingReport: 'Generating report...',
      reportGenerating: 'Analyzing business data and generating website content report. This may take up to 30 seconds...',
      reportError: 'Failed to generate research report. Please try again.',
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
      // Website generation
      generateWebsite: 'Generate Website',
      generatingWebsite: 'Generating...',
      websiteGenTitle: 'Website Generation',
      websiteGenerating: 'Generating a complete website using AI. This may take up to 60 seconds...',
      websiteError: 'Failed to generate website. Please try again.',
      websiteDownload: 'Download HTML',
      websiteOpenNewTab: 'Open in New Tab',
      websiteSaved: 'Website saved to database',
      timeoutError: '{0} timed out after {1}s.',
      // WhatsApp messaging
      navMessages: 'Messages',
      msgConversations: 'Conversations',
      msgSearchPlaceholder: 'Search businesses...',
      msgSelectConversation: 'Select a conversation to start messaging',
      msgSend: 'Send',
      msgSendTemplate: 'Send Template',
      msgPlaceholder: 'Type a message...',
      msgWindowOpen: '24h window open',
      msgWindowClosed: 'Window closed',
      msgTemplateRequired: 'Use a template to start a conversation',
      msgNoConversations: 'No conversations yet',
      msgTemplateSelect: 'Select template...',
      msgTemplateParam: 'Parameter {0}',
      msgSending: 'Sending...',
      msgSendError: 'Failed to send message',
      msgSendSuccess: 'Message sent',
      msgSyncTemplates: 'Syncing templates...',
      msgSyncSuccess: 'Templates synced',
      msgSyncError: 'Failed to sync templates',
      msgBtnLabel: 'Msg',
      msgNoPhone: 'No phone number available for this business',
      msgStatusSent: 'Sent',
      msgStatusDelivered: 'Delivered',
      msgStatusRead: 'Read',
      msgStatusFailed: 'Failed',
      msgToday: 'Today',
      msgYesterday: 'Yesterday',
    },
    es: {
      adminTitle: 'Negocios Guardados',
      adminTagline: 'Ver y gestionar todos los negocios guardados en la base de datos',
      navSearch: 'Buscar',
      navSaved: 'Guardados',
      statTotal: 'Total Negocios',
      statWithReviews: 'Con Reseñas',
      statWithInstagram: 'Con Instagram',
      statWithWebsites: 'Con Sitios Web',
      filtersTitle: 'Filtros',
      clearFilters: 'Limpiar Filtros',
      applyFilters: 'Aplicar Filtros',
      filterLocation: 'Ubicación',
      filterLocationPlaceholder: 'Ciudad, estado o código postal...',
      filterCountry: 'País',
      filterAll: 'Todos',
      filterAny: 'Cualquiera',
      filterYes: 'Sí',
      filterNo: 'No',
      filterType: 'Tipo de Negocio',
      filterMinRating: 'Calificación Mín.',
      filterMinReviews: 'Reseñas Mín.',
      filterHasInstagram: 'Tiene Instagram',
      filterMinPosts: 'Posts IG Mín.',
      filterHasFacebook: 'Tiene Facebook',
      filterHasReport: 'Tiene Informe',
      filterHasWebsite: 'Tiene Sitio Web',
      adminResultsTitle: 'Negocios Guardados',
      prevPage: 'Anterior',
      nextPage: 'Siguiente',
      pageInfo: 'Página {0} de {1}',
      showingCount: 'Mostrando {0} de {1} negocios',
      adminNoResults: 'Ningún negocio coincide con los filtros.',
      adminFooter: 'Admin del Operador — Buscador de Negocios Locales',
      thName: 'Nombre',
      thLocation: 'Ubicación',
      thType: 'Tipo',
      thPhone: 'Teléfono',
      thRating: 'Calificación',
      thReviews: 'Reseñas',
      thSocial: 'Social',
      thDetails: 'Detalles',
      thReport: 'Informe',
      thWebsite: 'Sitio Web',
      thActions: 'Acciones',
      viewBtn: 'Ver',
      badgeYes: 'Sí',
      badgeNo: '—',
      noData: 'Sin Datos',
      modalDescription: 'Descripción',
      modalServiceOptions: 'Opciones de Servicio',
      modalHighlights: 'Destacados',
      modalAmenities: 'Comodidades',
      modalAccessibility: 'Accesibilidad',
      modalReviewBreakdown: 'Desglose de Reseñas',
      topPick: 'Top',
      good: 'Bueno',
      topReviewsTitle: 'Mejores Reseñas',
      topReviewsSubtitle: 'Mejores reseñas seleccionadas por análisis de sentimiento',
      noReviewsAvailable: 'No hay reseñas disponibles',
      copyTopReviews: 'Copiar Mejores Reseñas',
      closeBtn: 'Cerrar',
      facebookProfile: 'Perfil de Facebook',
      instagramProfile: 'Perfil de Instagram',
      followers: '{0} seguidores',
      viewOnFacebook: 'Ver en Facebook',
      fbReactions: 'reacciones',
      fbReviewsTitle: 'Reseñas de Facebook ({0})',
      igPosts: 'publicaciones',
      igFollowers: 'seguidores',
      igFollowing: 'siguiendo',
      igVerified: 'Cuenta verificada',
      priceRange: 'Rango de Precio',
      anonymous: 'Anónimo',
      reviews: 'reseñas',
      noReviews: 'Sin reseñas',
      badgeDraft: 'Borrador',
      badgePublished: 'Publicado',
      loadingData: 'Cargando...',
      errorLoading: 'Error al cargar datos. Por favor recargue.',
      modalClose: 'Cerrar',
      modalBusinessDetails: 'Detalles del Negocio',
      modalAddress: 'Dirección',
      modalPhone: 'Teléfono',
      modalRating: 'Calificación',
      modalReviews: 'Reseñas',
      modalHours: 'Horario',
      modalTypes: 'Categorías',
      modalSocialProfiles: 'Perfiles Sociales',
      modalPhotos: 'Fotos',
      modalGoogleReviews: 'Reseñas de Google',
      modalFacebookReviews: 'Reseñas de Facebook',
      generateReport: 'Generar Informe de Investigación',
      generatingReport: 'Generando informe...',
      reportGenerating: 'Analizando datos del negocio y generando informe. Esto puede tardar hasta 30 segundos...',
      reportError: 'Error al generar el informe. Intente de nuevo.',
      reportBusinessSummary: 'Resumen del Negocio',
      reportSellingPoints: 'Puntos de Venta Clave',
      reportReviewHighlights: 'Destacados de Reseñas',
      reportReviewThemes: 'Temas Recurrentes',
      reportQuotableReviews: 'Mejores Citas para el Sitio Web',
      reportAreasToAvoid: 'Temas a Evitar',
      reportSuggestedSections: 'Secciones Sugeridas',
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
      reportPhotoAssetPlan: 'Plan de Fotos y Activos',
      reportPhotoExisting: 'Usar Existente',
      reportPhotoGenerate: 'Generar con IA',
      reportPhotoSource: 'ID de Foto',
      reportPhotoPrompt: 'Prompt IA',
      generateWebsite: 'Generar Sitio Web',
      generatingWebsite: 'Generando...',
      websiteGenTitle: 'Generación de Sitio Web',
      websiteGenerating: 'Generando un sitio web completo con IA. Esto puede tardar hasta 60 segundos...',
      websiteError: 'Error al generar el sitio web. Intente de nuevo.',
      websiteDownload: 'Descargar HTML',
      websiteOpenNewTab: 'Abrir en Nueva Pestaña',
      websiteSaved: 'Sitio web guardado en la base de datos',
      timeoutError: '{0} agotó el tiempo después de {1}s.',
      // WhatsApp messaging
      navMessages: 'Mensajes',
      msgConversations: 'Conversaciones',
      msgSearchPlaceholder: 'Buscar negocios...',
      msgSelectConversation: 'Seleccione una conversación para enviar mensajes',
      msgSend: 'Enviar',
      msgSendTemplate: 'Enviar Plantilla',
      msgPlaceholder: 'Escribe un mensaje...',
      msgWindowOpen: 'Ventana 24h abierta',
      msgWindowClosed: 'Ventana cerrada',
      msgTemplateRequired: 'Use una plantilla para iniciar una conversación',
      msgNoConversations: 'Sin conversaciones aún',
      msgTemplateSelect: 'Seleccionar plantilla...',
      msgTemplateParam: 'Parámetro {0}',
      msgSending: 'Enviando...',
      msgSendError: 'Error al enviar mensaje',
      msgSendSuccess: 'Mensaje enviado',
      msgSyncTemplates: 'Sincronizando plantillas...',
      msgSyncSuccess: 'Plantillas sincronizadas',
      msgSyncError: 'Error al sincronizar plantillas',
      msgBtnLabel: 'Msg',
      msgNoPhone: 'No hay número de teléfono para este negocio',
      msgStatusSent: 'Enviado',
      msgStatusDelivered: 'Entregado',
      msgStatusRead: 'Leído',
      msgStatusFailed: 'Fallido',
      msgToday: 'Hoy',
      msgYesterday: 'Ayer',
    },
  };

  function t(key, ...args) {
    let str = (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
    args.forEach((arg, i) => {
      str = str.replace(`{${i}}`, arg);
    });
    return str;
  }

  function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    });
    document.title = currentLang === 'es'
      ? 'Admin del Operador — Buscador de Negocios Locales'
      : 'Operator Admin — Local Business Finder';
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

  // ── Utilities ──
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderStars(rating) {
    if (!rating) return '—';
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

  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(t('timeoutError', label, ms / 1000))), ms)
      ),
    ]);
  }

  // ── Supabase ──
  const SUPABASE_URL = 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_2ZsXzfuXEPF7MJxxB7mA-Q_H--jfttp';
  let supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

  if (!supabaseClient) {
    console.warn('Supabase client not initialized.');
  }

  // ── State ──
  let currentPage = 0;
  let pageSize = 25;
  let totalCount = 0;
  let currentResults = [];
  // Cache for detail modal data (keyed by business ID)
  const detailCache = {};

  // ── DOM refs ──
  const $ = (sel) => document.querySelector(sel);
  const resultsBody = $('#results-body');
  const resultsSummary = $('#results-summary');
  const pageInfo = $('#page-info');
  const noResults = $('#no-results');
  const btnPrev = $('#btn-prev');
  const btnNext = $('#btn-next');
  const pageSizeSelect = $('#page-size');

  // Filter inputs
  const filterLocation = $('#filter-location');
  const filterCountry = $('#filter-country');
  const filterType = $('#filter-type');
  const filterRating = $('#filter-rating');
  const filterReviews = $('#filter-reviews');
  const filterInstagram = $('#filter-instagram');
  const filterIgPosts = $('#filter-ig-posts');
  const filterFacebook = $('#filter-facebook');
  const filterReport = $('#filter-report');
  const filterWebsite = $('#filter-website');

  // ── Initialize ──
  function init() {
    applyLanguage();

    // Language switcher
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentLang = btn.getAttribute('data-lang');
        localStorage.setItem('app_lang', currentLang);
        applyLanguage();
        // Re-render table with new language
        if (currentResults.length > 0) renderTable();
      });
    });

    // Enable/disable IG posts filter based on Has Instagram
    filterInstagram.addEventListener('change', () => {
      filterIgPosts.disabled = filterInstagram.value !== 'yes';
      if (filterIgPosts.disabled) filterIgPosts.value = '';
    });

    // Apply filters
    $('#btn-apply-filters').addEventListener('click', () => {
      currentPage = 0;
      loadBusinesses();
    });

    // Clear filters
    $('#btn-clear-filters').addEventListener('click', () => {
      filterLocation.value = '';
      filterCountry.value = '';
      filterType.value = '';
      filterRating.value = '';
      filterReviews.value = '';
      filterInstagram.value = '';
      filterIgPosts.value = '';
      filterIgPosts.disabled = true;
      filterFacebook.value = '';
      filterReport.value = '';
      filterWebsite.value = '';
      currentPage = 0;
      loadBusinesses();
    });

    // Pagination
    btnPrev.addEventListener('click', () => {
      if (currentPage > 0) {
        currentPage--;
        loadBusinesses();
      }
    });
    btnNext.addEventListener('click', () => {
      const totalPages = Math.ceil(totalCount / pageSize);
      if (currentPage < totalPages - 1) {
        currentPage++;
        loadBusinesses();
      }
    });
    pageSizeSelect.addEventListener('change', () => {
      pageSize = parseInt(pageSizeSelect.value, 10);
      currentPage = 0;
      loadBusinesses();
    });

    // Enter key on location filter
    filterLocation.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        currentPage = 0;
        loadBusinesses();
      }
    });

    // Messaging tab navigation
    const navSaved = document.getElementById('nav-saved');
    const navMessages = document.getElementById('nav-messages');

    if (navSaved) {
      navSaved.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('saved');
      });
    }
    if (navMessages) {
      navMessages.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('messages');
      });
    }

    // Sync templates button
    const syncBtn = document.getElementById('btn-sync-templates');
    if (syncBtn) {
      syncBtn.addEventListener('click', syncTemplates);
    }

    // Conversation search
    const convSearch = document.getElementById('conv-search');
    if (convSearch) {
      convSearch.addEventListener('input', renderConversationsList);
    }

    // Load templates and start realtime
    loadTemplates();
    setupRealtimeSubscription();

    // Initial load
    loadStats();
    loadBusinesses();
  }

  // ── Stats ──
  async function loadStats() {
    if (!supabaseClient) return;

    try {
      const [totalRes, reviewsRes, igRes, websitesRes] = await Promise.all([
        supabaseClient.from('businesses').select('id', { count: 'exact', head: true }),
        supabaseClient.from('business_reviews').select('business_id', { count: 'exact', head: true }),
        supabaseClient.from('business_social_profiles').select('id', { count: 'exact', head: true }).eq('platform', 'instagram'),
        supabaseClient.from('generated_websites').select('id', { count: 'exact', head: true }),
      ]);

      $('#stat-total').textContent = totalRes.count || 0;
      $('#stat-reviews').textContent = reviewsRes.count || 0;
      $('#stat-instagram').textContent = igRes.count || 0;
      $('#stat-websites').textContent = websitesRes.count || 0;
    } catch (err) {
      console.error('Stats load error:', err);
    }
  }

  // ── Load Businesses ──
  async function loadBusinesses() {
    if (!supabaseClient) {
      showToast(t('errorLoading'), 'error');
      return;
    }

    resultsBody.innerHTML = `<tr><td colspan="13" style="text-align:center;padding:24px;color:var(--text-muted)">${t('loadingData')}</td></tr>`;
    noResults.style.display = 'none';

    try {
      let query = supabaseClient
        .from('businesses')
        .select('*, business_social_profiles(*), generated_websites(id, status, config)', { count: 'exact' });

      // Apply filters
      const loc = filterLocation.value.trim();
      if (loc) {
        query = query.ilike('address_full', `%${loc}%`);
      }
      const country = filterCountry.value;
      if (country) {
        query = query.eq('address_country', country);
      }
      const type = filterType.value;
      if (type) {
        query = query.contains('types', [type]);
      }
      const minRating = filterRating.value;
      if (minRating) {
        query = query.gte('rating', parseFloat(minRating));
      }
      const minReviews = filterReviews.value;
      if (minReviews && parseInt(minReviews, 10) > 0) {
        query = query.gte('review_count', parseInt(minReviews, 10));
      }

      // Order and paginate
      query = query.order('created_at', { ascending: false });
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      totalCount = count || 0;
      currentResults = data || [];

      // Client-side filtering for social profile filters (Supabase doesn't easily filter on nested joins)
      let filtered = currentResults;

      const igFilter = filterInstagram.value;
      if (igFilter === 'yes') {
        filtered = filtered.filter(b => hasProfile(b, 'instagram'));
      } else if (igFilter === 'no') {
        filtered = filtered.filter(b => !hasProfile(b, 'instagram'));
      }

      const igPostsMin = parseInt(filterIgPosts.value, 10);
      if (igFilter === 'yes' && igPostsMin > 0) {
        filtered = filtered.filter(b => {
          const ig = getProfile(b, 'instagram');
          return ig && ig.post_count && ig.post_count >= igPostsMin;
        });
      }

      const fbFilter = filterFacebook.value;
      if (fbFilter === 'yes') {
        filtered = filtered.filter(b => hasProfile(b, 'facebook'));
      } else if (fbFilter === 'no') {
        filtered = filtered.filter(b => !hasProfile(b, 'facebook'));
      }

      const reportFilter = filterReport.value;
      if (reportFilter === 'yes') {
        filtered = filtered.filter(b => hasGeneratedWebsite(b));
      } else if (reportFilter === 'no') {
        filtered = filtered.filter(b => !hasGeneratedWebsite(b));
      }

      const websiteFilter = filterWebsite.value;
      if (websiteFilter === 'yes') {
        filtered = filtered.filter(b => hasGeneratedWebsite(b));
      } else if (websiteFilter === 'no') {
        filtered = filtered.filter(b => !hasGeneratedWebsite(b));
      }

      currentResults = filtered;
      renderTable();
      updatePagination();
    } catch (err) {
      console.error('Load businesses error:', err);
      showToast(t('errorLoading'), 'error');
      resultsBody.innerHTML = '';
    }
  }

  // ── Helpers ──
  function hasProfile(business, platform) {
    const profiles = business.business_social_profiles || [];
    return profiles.some(p => p.platform === platform);
  }

  function getProfile(business, platform) {
    const profiles = business.business_social_profiles || [];
    return profiles.find(p => p.platform === platform);
  }

  function hasGeneratedWebsite(business) {
    return business.generated_websites && business.generated_websites.length > 0;
  }

  function getWebsiteStatus(business) {
    if (!business.generated_websites || business.generated_websites.length === 0) return null;
    return business.generated_websites[0].status || 'draft';
  }

  function extractCity(addressFull) {
    if (!addressFull) return '—';
    // Try to extract city, state from full address
    const parts = addressFull.split(',').map(s => s.trim());
    if (parts.length >= 3) return parts[1] + ', ' + parts[2].split(' ')[0];
    if (parts.length >= 2) return parts[1];
    return parts[0];
  }

  function extractCategory(types) {
    if (!types || types.length === 0) return '—';
    // Get the most relevant type (skip generic ones)
    const skip = ['point_of_interest', 'establishment', 'store', 'food'];
    const filtered = types.filter(t => !skip.includes(t));
    const type = filtered[0] || types[0];
    return type.replace(/_/g, ' ');
  }

  // ── Social Cell Rendering ──
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

  const SOCIAL_PLATFORM_EMOJIS = {
    facebook: '\uD83D\uDCD8', instagram: '\uD83D\uDCF7', whatsapp: '\uD83D\uDCAC',
    twitter: '\uD83D\uDCAD', tiktok: '\uD83C\uDFB5', linkedin: '\uD83D\uDCBC',
    youtube: '\u25B6\uFE0F', yelp: '\u2B50', tripadvisor: '\uD83E\uDDED',
    opentable: '\uD83C\uDF7D\uFE0F', resy: '\uD83D\uDCCB', doordash: '\uD83D\uDE97',
    ubereats: '\uD83C\uDF54', grubhub: '\uD83C\uDF71',
  };

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
      const url = p.url || '#';
      if (!icon) {
        const emoji = SOCIAL_PLATFORM_EMOJIS[p.platform] || '\uD83C\uDF10';
        return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="social-cell-icon" title="${escapeHtml(title)}">${emoji}</a>`;
      }
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="social-cell-icon" title="${escapeHtml(title)}" style="color:${color}">${icon}</a>`;
    }).join('');
    const extra = profiles.length > maxShow ? `<span class="social-cell-more">+${profiles.length - maxShow}</span>` : '';
    return `<span class="social-cell">${icons}${extra}</span>`;
  }

  // ── Render Table ──
  function renderTable() {
    if (currentResults.length === 0) {
      resultsBody.innerHTML = '';
      noResults.style.display = '';
      resultsSummary.textContent = '';
      return;
    }

    noResults.style.display = 'none';
    resultsSummary.textContent = t('showingCount', currentResults.length, totalCount);

    const offset = currentPage * pageSize;
    resultsBody.innerHTML = currentResults.map((b, i) => {
      const profiles = b.business_social_profiles || [];
      const websiteStatus = getWebsiteStatus(b);

      const socialCellHtml = buildSocialCellHtml(profiles);

      const reportBadge = websiteStatus
        ? `<span class="badge badge-has-site">${t('badgeYes')}</span>`
        : `<span style="color:var(--text-dim)">${t('badgeNo')}</span>`;

      const websiteBadge = websiteStatus
        ? `<span class="badge ${websiteStatus === 'published' ? 'badge-has-site' : 'badge-no-site'}">${t('badge' + websiteStatus.charAt(0).toUpperCase() + websiteStatus.slice(1))}</span>`
        : `<span style="color:var(--text-dim)">${t('badgeNo')}</span>`;

      const mapsLink = b.maps_url
        ? `<a href="${escapeHtml(b.maps_url)}" target="_blank" rel="noopener" class="maps-link" title="Open in Google Maps">\u{1F4CD}</a>`
        : `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + ' ' + (b.address_full || ''))}" target="_blank" rel="noopener" class="maps-link" title="Search on Google Maps">\u{1F4CD}</a>`;

      return `<tr>
        <td class="td-center">${offset + i + 1}</td>
        <td><strong>${escapeHtml(b.name)}</strong></td>
        <td>${escapeHtml(extractCity(b.address_full))}</td>
        <td style="text-transform:capitalize">${escapeHtml(extractCategory(b.types))}</td>
        <td>${b.phone ? escapeHtml(b.phone) : '<span style="color:var(--text-dim)">N/A</span>'}</td>
        <td class="td-center"><span class="stars">${renderStars(b.rating)}</span> <span class="rating-num">${b.rating ? b.rating.toFixed(1) : '—'}</span></td>
        <td class="td-center">${b.review_count ? b.review_count.toLocaleString() : '0'}</td>
        <td class="td-center">${socialCellHtml}</td>
        <td class="td-center">${reportBadge}</td>
        <td class="td-center">${websiteBadge}</td>
        <td class="td-center"><button class="btn btn-view" data-id="${b.id}">${t('viewBtn')}</button></td>
        <td class="td-center">${mapsLink}</td>
        <td class="td-center">${b.phone ? `<button class="btn-msg" data-id="${b.id}" data-phone="${escapeHtml(b.phone)}">${t('msgBtnLabel')}</button>` : ''}</td>
      </tr>`;
    }).join('');

    // Bind view buttons
    resultsBody.querySelectorAll('.btn-view').forEach((btn) => {
      btn.addEventListener('click', () => {
        const businessId = btn.getAttribute('data-id');
        const business = currentResults.find(b => String(b.id) === businessId);
        if (business) openDetailModal(business);
      });
    });

    // Bind msg buttons
    resultsBody.querySelectorAll('.btn-msg').forEach((btn) => {
      btn.addEventListener('click', () => {
        const businessId = btn.getAttribute('data-id');
        const phone = btn.getAttribute('data-phone');
        startNewConversation(businessId, phone);
      });
    });
  }

  // ── Pagination ──
  function updatePagination() {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    pageInfo.textContent = t('pageInfo', currentPage + 1, totalPages);
    btnPrev.disabled = currentPage === 0;
    btnNext.disabled = currentPage >= totalPages - 1;
  }

  // ── Detail Modal ──
  async function openDetailModal(business) {
    // Remove existing modal if any
    const existing = document.getElementById('detail-modal');
    if (existing) existing.remove();

    // Load full details (reviews, photos) if not cached
    let details = detailCache[business.id];
    if (!details) {
      try {
        const [reviewsRes, photosRes] = await Promise.all([
          supabaseClient.from('business_reviews').select('*').eq('business_id', business.id).order('sentiment_score', { ascending: false, nullsFirst: false }).limit(20),
          supabaseClient.from('business_photos').select('*').eq('business_id', business.id).limit(30),
        ]);
        details = {
          reviews: reviewsRes.data || [],
          photos: photosRes.data || [],
        };
        detailCache[business.id] = details;
      } catch (err) {
        console.error('Detail load error:', err);
        details = { reviews: [], photos: [] };
      }
    }

    const profiles = business.business_social_profiles || [];
    const allReviews = details.reviews;
    const googleReviews = allReviews.filter(r => r.source === 'google');
    const fbReviews = allReviews.filter(r => r.source === 'facebook');
    const photos = details.photos;

    // Star rating display
    const starsHtml = renderStars(business.rating);

    // Build description HTML
    let descriptionHtml = '';
    if (business.description) {
      descriptionHtml = `
        <div class="modal-section">
          <h3>${t('modalDescription')}</h3>
          <p class="business-description-text">${escapeHtml(business.description)}</p>
        </div>
      `;
    }

    // Build price level HTML
    let priceHtml = '';
    if (business.price_level) {
      const priceDisplay = '$'.repeat(business.price_level);
      priceHtml = `<span class="meta-sep">|</span><span>${escapeHtml(priceDisplay)}</span>`;
    }

    // Build photo gallery HTML
    let photosHtml = '';
    if (photos.length > 0) {
      const imgs = photos.map(p => `<div class="photo-item"><img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.caption || '')}" loading="lazy"></div>`).join('');
      photosHtml = `<div class="modal-section"><h3>${t('modalPhotos')}</h3><div class="photo-gallery">${imgs}</div></div>`;
    }

    // Build service options HTML
    let serviceOptionsHtml = '';
    if (business.service_options && business.service_options.length > 0) {
      const tags = business.service_options.map(f => `<span class="feature-tag">${escapeHtml(f)}</span>`).join('');
      serviceOptionsHtml = `<div class="modal-section"><h3>${t('modalServiceOptions')}</h3><div class="features-grid">${tags}</div></div>`;
    }

    // Build highlights HTML
    let highlightsHtml = '';
    if (business.highlights && business.highlights.length > 0) {
      const tags = business.highlights.map(f => `<span class="feature-tag feature-tag-highlight">${escapeHtml(f)}</span>`).join('');
      highlightsHtml = `<div class="modal-section"><h3>${t('modalHighlights')}</h3><div class="features-grid">${tags}</div></div>`;
    }

    // Build amenities HTML
    let amenitiesHtml = '';
    if (business.amenities && business.amenities.length > 0) {
      const tags = business.amenities.map(f => `<span class="feature-tag">${escapeHtml(f)}</span>`).join('');
      amenitiesHtml = `<div class="modal-section"><h3>${t('modalAmenities')}</h3><div class="features-grid">${tags}</div></div>`;
    }

    // Build accessibility HTML
    let accessibilityHtml = '';
    if (business.accessibility_info) {
      // accessibility_info is TEXT in DB, may be comma-separated or a single string
      const items = business.accessibility_info.split(',').map(s => s.trim()).filter(Boolean);
      if (items.length > 0) {
        const tags = items.map(f => `<span class="feature-tag feature-tag-accessibility">${escapeHtml(f)}</span>`).join('');
        accessibilityHtml = `<div class="modal-section"><h3>${t('modalAccessibility')}</h3><div class="features-grid">${tags}</div></div>`;
      }
    }

    // Build review histogram HTML
    let histogramHtml = '';
    if (googleReviews.length > 0) {
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      googleReviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) counts[r.rating]++; });
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      if (total > 0) {
        const rows = [5, 4, 3, 2, 1].map(star => {
          const count = counts[star];
          const pct = Math.round((count / total) * 100);
          return `
            <div class="histogram-row">
              <span class="histogram-star">${star}</span>
              <div class="histogram-bar-track">
                <div class="histogram-bar-fill" style="width:${pct}%"></div>
              </div>
              <span class="histogram-count">${count}</span>
            </div>
          `;
        }).join('');
        histogramHtml = `<div class="modal-section"><h3>${t('modalReviewBreakdown')}</h3><div class="review-histogram">${rows}</div></div>`;
      }
    }

    // Build reviews HTML with sentiment badges (matching search modal style)
    let reviewsHtml = '';
    // Sort by sentiment score desc for "top reviews"
    const topReviews = [...allReviews].sort((a, b) => (b.sentiment_score || 0) - (a.sentiment_score || 0)).slice(0, 10);
    if (topReviews.length > 0) {
      const reviewItems = topReviews.map(r => {
        const stars = '\u2605'.repeat(Math.floor(r.rating || 0)) + '\u2606'.repeat(5 - Math.floor(r.rating || 0));
        const label = r.sentiment_label || '';
        const sentimentBadge = label === 'very_positive'
          ? `<span class="sentiment-badge sentiment-great">${t('topPick')}</span>`
          : label === 'positive'
          ? `<span class="sentiment-badge sentiment-good">${t('good')}</span>`
          : '';
        const authorName = r.author_name || t('anonymous');
        const timeAgo = r.published_at || '';
        return `
          <div class="review-card">
            <div class="review-header">
              <div class="review-author">
                ${r.author_photo_url ? `<img src="${escapeHtml(r.author_photo_url)}" alt="" class="review-avatar">` : '<div class="review-avatar-placeholder"></div>'}
                <div>
                  <strong>${escapeHtml(authorName)}</strong>
                  ${r.source !== 'google' ? `<span class="review-source-badge">${escapeHtml(r.source)}</span>` : ''}
                  <span class="review-time">${escapeHtml(timeAgo)}</span>
                </div>
              </div>
              <div class="review-meta">
                <span class="stars">${stars}</span>
                ${sentimentBadge}
              </div>
            </div>
            <p class="review-text">${escapeHtml(r.text || '')}</p>
          </div>
        `;
      }).join('');
      reviewsHtml = `
        <div class="modal-section">
          <h3>${t('topReviewsTitle')} (${allReviews.length})</h3>
          <p class="section-subtitle">${t('topReviewsSubtitle')}</p>
          <div class="reviews-list">${reviewItems}</div>
        </div>
      `;
    } else {
      reviewsHtml = `
        <div class="modal-section">
          <h3>${t('topReviewsTitle')}</h3>
          <p class="section-subtitle" style="color:var(--text-dim)">${t('noReviewsAvailable')}</p>
        </div>
      `;
    }

    // Build hours HTML
    let hoursHtml = '';
    if (business.hours && business.hours.length > 0) {
      const hourItems = business.hours.map(h => `<li>${escapeHtml(h)}</li>`).join('');
      hoursHtml = `<div class="modal-section"><h3>${t('modalHours')}</h3><ul class="hours-list">${hourItems}</ul></div>`;
    }

    // Build categories HTML
    let typesHtml = '';
    if (business.types && business.types.length > 0) {
      const tags = business.types.map(ty => `<span class="feature-tag">${escapeHtml(ty.replace(/_/g, ' '))}</span>`).join('');
      typesHtml = `<div class="modal-section"><h3>${t('modalTypes')}</h3><div class="features-grid">${tags}</div></div>`;
    }

    // Build social profiles HTML
    let socialHtml = '';
    if (profiles.length > 0) {
      const items = profiles.map(p => {
        const icon = SOCIAL_ICONS[p.platform] || '';
        const color = SOCIAL_COLORS[p.platform] || 'var(--text-muted)';
        const emoji = SOCIAL_PLATFORM_EMOJIS[p.platform] || '\uD83C\uDF10';
        const iconHtml = icon ? `<span style="color:${color}">${icon}</span>` : emoji;
        return `<a href="${escapeHtml(p.url || '#')}" target="_blank" rel="noopener" class="social-profile-item">
          ${iconHtml}
          <span style="text-transform:capitalize;font-weight:600">${escapeHtml(p.platform)}</span>
          ${p.handle ? `<span style="color:var(--text-muted)">@${escapeHtml(p.handle)}</span>` : ''}
          ${p.follower_count ? `<span style="color:var(--text-muted)">${p.follower_count.toLocaleString()} followers</span>` : ''}
          ${p.post_count ? `<span style="color:var(--text-muted)">${p.post_count.toLocaleString()} posts</span>` : ''}
        </a>`;
      }).join('');
      socialHtml = `<div class="modal-section"><h3>${t('modalSocialProfiles')}</h3><div class="social-profiles-list">${items}</div></div>`;
    }

    // Check if there's already a generated website
    const existingWebsite = (business.generated_websites || []).find(w => w.config && w.config.html);
    const hasReport = existingWebsite && existingWebsite.config && existingWebsite.config.researchReport;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'detail-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h2>${escapeHtml(business.name)}</h2>
            <p class="modal-address">${escapeHtml(business.address_full || '')}</p>
            <div class="modal-meta">
              <span class="stars">${starsHtml}</span>
              <span>${business.rating ? business.rating.toFixed(1) : 'N/A'}</span>
              <span class="meta-sep">|</span>
              <span>${business.review_count ? business.review_count.toLocaleString() + ' ' + t('reviews') : t('noReviews')}</span>
              ${priceHtml}
              ${business.phone ? `<span class="meta-sep">|</span><span>${escapeHtml(business.phone)}</span>` : ''}
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
          ${typesHtml}
          ${histogramHtml}
          ${reviewsHtml}
          ${hoursHtml}
          ${socialHtml}

          <!-- Research Report -->
          <div class="modal-section" id="research-report-section">
            <h3>${t('generateReport')}</h3>
            <button class="btn btn-primary" id="generate-report-btn">${hasReport ? t('badgeYes') + ' — View Report' : t('generateReport')}</button>
            <div id="research-report-container"></div>
          </div>

          <!-- Website Generation -->
          <div class="modal-section" id="website-generation-section" style="${hasReport ? '' : 'display:none'}">
            <h3>${t('websiteGenTitle')}</h3>
            <button class="btn btn-primary" id="generate-website-btn">${existingWebsite ? 'View Website' : t('generateWebsite')}</button>
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

    // Close handlers
    modal.querySelector('#modal-close-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('#modal-close-btn-footer').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        const m = document.getElementById('detail-modal');
        if (m) m.remove();
        document.removeEventListener('keydown', handler);
      }
    });

    // Copy top reviews button
    modal.querySelector('#modal-copy-reviews').addEventListener('click', () => {
      const reviewTexts = topReviews.map(r => {
        const authorName = r.author_name || t('anonymous');
        const stars = '\u2605'.repeat(r.rating || 0);
        return `${stars} — ${authorName}\n"${r.text || ''}"`;
      }).join('\n\n');
      navigator.clipboard.writeText(reviewTexts).then(() => {
        showToast(t('copyTopReviews') + ' \u2713', 'success');
      });
    });

    // Report button
    const reportBtn = modal.querySelector('#generate-report-btn');
    reportBtn.addEventListener('click', () => {
      generateResearchReport(modal, business, details, reportBtn);
    });

    // If report already exists, auto-render it
    if (hasReport) {
      renderResearchReport(modal, existingWebsite.config.researchReport);
      reportBtn.style.display = 'none';
    }

    // Website button
    const websiteBtn = modal.querySelector('#generate-website-btn');
    websiteBtn.addEventListener('click', () => {
      generateWebsite(modal, business, details, websiteBtn);
    });

    // If website already exists, auto-render preview
    if (existingWebsite && existingWebsite.config && existingWebsite.config.html) {
      renderWebsitePreview(modal, existingWebsite.config.html, business);
      websiteBtn.style.display = 'none';
    }
  }

  // ── Compile Business Data for Prompt ──
  function compileBusinessDataForPrompt(business, details) {
    const sections = [];
    const profiles = business.business_social_profiles || [];
    const reviews = details.reviews || [];
    const photos = details.photos || [];

    sections.push('=== BUSINESS IDENTITY ===');
    sections.push(`Name: ${business.name}`);
    sections.push(`Address: ${business.address_full || ''}`);
    if (business.phone) sections.push(`Phone: ${business.phone}`);
    if (business.types && business.types.length > 0) sections.push(`Categories: ${business.types.join(', ')}`);
    if (business.business_status) sections.push(`Status: ${business.business_status}`);

    sections.push('\n=== RATINGS & REVIEWS OVERVIEW ===');
    sections.push(`Google Rating: ${business.rating || 'N/A'} / 5`);
    sections.push(`Total Reviews: ${business.review_count || 0}`);

    // Google reviews
    const googleReviews = reviews.filter(r => r.source === 'google');
    if (googleReviews.length > 0) {
      sections.push('\n=== GOOGLE REVIEWS ===');
      googleReviews.slice(0, 15).forEach((r, i) => {
        sections.push(`Review ${i + 1} (${r.rating}★ by ${r.author_name || 'Anonymous'}): "${r.text}"`);
      });
    }

    // Facebook reviews
    const fbReviews = reviews.filter(r => r.source === 'facebook');
    if (fbReviews.length > 0) {
      sections.push('\n=== FACEBOOK REVIEWS ===');
      fbReviews.slice(0, 5).forEach((r, i) => {
        sections.push(`FB Review ${i + 1} (${r.rating || 'N/A'}★ by ${r.author_name || 'Anonymous'}): "${r.text}"`);
      });
    }

    // Hours
    if (business.hours && business.hours.length > 0) {
      sections.push('\n=== BUSINESS HOURS ===');
      business.hours.forEach(h => sections.push(h));
    }

    // Social profiles
    if (profiles.length > 0) {
      sections.push('\n=== SOCIAL MEDIA PROFILES ===');
      profiles.forEach(sp => {
        let line = `${sp.platform}: ${sp.url || ''}`;
        if (sp.handle) line += ` (@${sp.handle})`;
        if (sp.follower_count) line += ` | ${sp.follower_count} followers`;
        if (sp.post_count) line += ` | ${sp.post_count} posts`;
        sections.push(line);
      });
    }

    // Photo inventory
    if (photos.length > 0) {
      sections.push('\n=== PHOTO INVENTORY ===');
      sections.push(`Total Photos Available: ${photos.length}`);
      photos.forEach((p, i) => {
        let line = `ID: ${p.source}_photo_${i} | Source: ${p.source} | Type: ${p.photo_type || 'unclassified'}`;
        if (p.caption) line += ` | Caption: "${p.caption.substring(0, 150)}"`;
        sections.push(line);
      });
    }

    return sections.join('\n');
  }

  // ── Build Photo Inventory ──
  function buildPhotoInventory(details) {
    const photos = details.photos || [];
    return photos.map((p, i) => ({
      id: `${p.source}_photo_${i}`,
      source: p.source,
      type: p.photo_type || 'unclassified',
      url: p.url,
    }));
  }

  // ── Research Report ──
  async function generateResearchReport(modal, business, details, btn) {
    // Check for cached report in existing website
    const existingWebsite = (business.generated_websites || []).find(w => w.config && w.config.researchReport);
    if (existingWebsite) {
      btn.style.display = 'none';
      renderResearchReport(modal, existingWebsite.config.researchReport);
      const websiteSection = modal.querySelector('#website-generation-section');
      if (websiteSection) websiteSection.style.display = '';
      return;
    }

    const container = modal.querySelector('#research-report-container');
    if (!container) return;

    btn.disabled = true;
    btn.textContent = t('generatingReport');
    container.innerHTML = `<div class="report-loading"><span class="spinner"></span><p>${t('reportGenerating')}</p></div>`;

    try {
      const businessData = compileBusinessDataForPrompt(business, details);
      const language = business.address_country === 'MX' || business.address_country === 'CO' ? 'es' : 'en';

      const res = await withTimeout(
        fetch('/api/ai/research-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessData, name: business.name, language }),
        }),
        60000,
        'Research report'
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Request failed');
      }

      const data = await res.json();

      // Check modal still exists
      if (!document.getElementById('detail-modal')) return;

      btn.style.display = 'none';
      renderResearchReport(modal, data.report);

      // Store report on the business's website config for caching
      business._cachedReport = data.report;

      // Show website generation section
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

  // ── Render Research Report ──
  function renderResearchReport(modal, report) {
    const container = modal.querySelector('#research-report-container');
    if (!container) return;

    if (report.parseError && report.rawText) {
      container.innerHTML = `<div class="report-raw-text"><p>${escapeHtml(report.rawText)}</p></div>`;
      return;
    }

    let html = '';

    if (report.businessSummary) {
      html += `<div class="report-section"><h4>${t('reportBusinessSummary')}</h4><p>${escapeHtml(report.businessSummary)}</p></div>`;
    }

    if (report.keySellingPoints && report.keySellingPoints.length > 0) {
      const tags = report.keySellingPoints.map(p => `<span class="feature-tag">${escapeHtml(p)}</span>`).join('');
      html += `<div class="report-section"><h4>${t('reportSellingPoints')}</h4><div class="features-grid">${tags}</div></div>`;
    }

    if (report.reviewHighlights) {
      const rh = report.reviewHighlights;
      let rhHtml = '';
      if (rh.themes && rh.themes.length > 0) {
        const tags = rh.themes.map(th => `<span class="feature-tag">${escapeHtml(th)}</span>`).join('');
        rhHtml += `<div class="report-subsection"><h5>${t('reportReviewThemes')}</h5><div class="features-grid">${tags}</div></div>`;
      }
      if (rh.quotableReviews && rh.quotableReviews.length > 0) {
        const quotes = rh.quotableReviews.map(q => `<blockquote class="report-blockquote">${escapeHtml(q)}</blockquote>`).join('');
        rhHtml += `<div class="report-subsection"><h5>${t('reportQuotableReviews')}</h5>${quotes}</div>`;
      }
      if (rh.areasToAvoid && rh.areasToAvoid.length > 0) {
        const tags = rh.areasToAvoid.map(a => `<span class="feature-tag report-warning-tag">${escapeHtml(a)}</span>`).join('');
        rhHtml += `<div class="report-subsection"><h5>${t('reportAreasToAvoid')}</h5><div class="features-grid">${tags}</div></div>`;
      }
      if (rhHtml) {
        html += `<div class="report-section"><h4>${t('reportReviewHighlights')}</h4>${rhHtml}</div>`;
      }
    }

    if (report.suggestedSections && report.suggestedSections.length > 0) {
      const items = report.suggestedSections.map(s => {
        const priorityKey = 'reportPriority' + s.priority.charAt(0).toUpperCase() + s.priority.slice(1);
        const priorityClass = s.priority === 'high' ? 'badge-priority-high' : s.priority === 'medium' ? 'badge-priority-medium' : 'badge-priority-low';
        return `<div class="report-section-item">
          <div class="report-section-item-header"><strong>${escapeHtml(s.name)}</strong><span class="badge ${priorityClass}">${t(priorityKey)}</span></div>
          <p>${escapeHtml(s.description)}</p>
        </div>`;
      }).join('');
      html += `<div class="report-section"><h4>${t('reportSuggestedSections')}</h4>${items}</div>`;
    }

    if (report.toneRecommendations) {
      const tone = report.toneRecommendations;
      let toneHtml = '';
      if (tone.overallTone) toneHtml += `<p><strong>${t('reportOverallTone')}:</strong> ${escapeHtml(tone.overallTone)}</p>`;
      if (tone.writingStyle) toneHtml += `<p><strong>${t('reportWritingStyle')}:</strong> ${escapeHtml(tone.writingStyle)}</p>`;
      if (tone.wordsToUse && tone.wordsToUse.length > 0) {
        const tags = tone.wordsToUse.map(w => `<span class="feature-tag">${escapeHtml(w)}</span>`).join('');
        toneHtml += `<div class="report-subsection"><h5>${t('reportWordsToUse')}</h5><div class="features-grid">${tags}</div></div>`;
      }
      if (tone.wordsToAvoid && tone.wordsToAvoid.length > 0) {
        const tags = tone.wordsToAvoid.map(w => `<span class="feature-tag report-warning-tag">${escapeHtml(w)}</span>`).join('');
        toneHtml += `<div class="report-subsection"><h5>${t('reportWordsToAvoid')}</h5><div class="features-grid">${tags}</div></div>`;
      }
      if (toneHtml) html += `<div class="report-section"><h4>${t('reportToneRec')}</h4>${toneHtml}</div>`;
    }

    if (report.competitivePositioning) {
      html += `<div class="report-section"><h4>${t('reportCompetitive')}</h4><p>${escapeHtml(report.competitivePositioning)}</p></div>`;
    }

    if (report.contentGaps && report.contentGaps.length > 0) {
      const tags = report.contentGaps.map(g => `<span class="feature-tag report-warning-tag">${escapeHtml(g)}</span>`).join('');
      html += `<div class="report-section"><h4>${t('reportContentGaps')}</h4><div class="features-grid">${tags}</div></div>`;
    }

    if (report.socialMediaInsights) {
      html += `<div class="report-section"><h4>${t('reportSocialInsights')}</h4><p>${escapeHtml(report.socialMediaInsights)}</p></div>`;
    }

    if (report.localSeoKeywords && report.localSeoKeywords.length > 0) {
      const tags = report.localSeoKeywords.map(k => `<span class="feature-tag feature-tag-highlight">${escapeHtml(k)}</span>`).join('');
      html += `<div class="report-section"><h4>${t('reportSeoKeywords')}</h4><div class="features-grid">${tags}</div></div>`;
    }

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
          <div class="report-section-item-header"><strong>${escapeHtml(p.section)} — ${escapeHtml(p.slot)}</strong><span class="badge ${badgeClass}">${badgeText}</span></div>
          <p>${escapeHtml(p.rationale || '')}</p>
          ${detailHtml}
        </div>`;
      }).join('');
      html += `<div class="report-section"><h4>${t('reportPhotoAssetPlan')}</h4>${items}</div>`;
    }

    container.innerHTML = html;
  }

  // ── Website Generation ──
  async function generateWebsite(modal, business, details, btn) {
    // Check for cached website
    const existingWebsite = (business.generated_websites || []).find(w => w.config && w.config.html);
    if (existingWebsite) {
      btn.style.display = 'none';
      renderWebsitePreview(modal, existingWebsite.config.html, business);
      return;
    }

    const container = modal.querySelector('#website-generation-container');
    if (!container) return;

    btn.disabled = true;
    btn.textContent = t('generatingWebsite');
    container.innerHTML = `<div class="report-loading"><span class="spinner"></span><p>${t('websiteGenerating')}</p></div>`;

    try {
      const businessData = compileBusinessDataForPrompt(business, details);
      const photoInventory = buildPhotoInventory(details);
      const language = business.address_country === 'MX' || business.address_country === 'CO' ? 'es' : 'en';
      const report = business._cachedReport ||
        ((business.generated_websites || []).find(w => w.config && w.config.researchReport) || {}).config?.researchReport;

      const res = await withTimeout(
        fetch('/api/ai/generate-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessData,
            researchReport: report || null,
            photoInventory: photoInventory.map(p => ({ id: p.id, type: p.type, url: p.url })),
            name: business.name,
            language,
          }),
        }),
        90000,
        'Website generation'
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Request failed');
      }

      const data = await res.json();

      if (!document.getElementById('detail-modal')) return;

      btn.style.display = 'none';
      renderWebsitePreview(modal, data.html, business);

      // Save to Supabase
      saveGeneratedWebsite(business, data.html, report).catch(err =>
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

  // ── Website Preview ──
  function renderWebsitePreview(modal, html, business) {
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

    const iframe = container.querySelector('#website-preview-iframe');
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    container.querySelector('#website-download-btn').addEventListener('click', () => {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${business.name.replace(/[^a-zA-Z0-9]/g, '_')}_website.html`;
      a.click();
      URL.revokeObjectURL(url);
    });

    container.querySelector('#website-new-tab-btn').addEventListener('click', () => {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }

  // ── Save Generated Website ──
  async function saveGeneratedWebsite(business, html, report) {
    if (!supabaseClient) return;

    try {
      const { error } = await supabaseClient
        .from('generated_websites')
        .insert({
          business_id: business.id,
          template_name: 'ai_generated_single_page',
          status: 'draft',
          config: {
            html: html,
            researchReport: report || null,
            generatedAt: new Date().toISOString(),
          },
        });

      if (error) {
        console.warn('Website save error:', error);
      } else {
        showToast(t('websiteSaved'), 'success');
        // Refresh stats
        loadStats();
      }
    } catch (e) {
      console.warn('Website save exception:', e);
    }
  }

  // ── WhatsApp Messaging ──

  // Messaging state
  let activeConversationId = null;
  let conversations = [];
  let currentMessages = [];
  let templates = [];
  let realtimeChannel = null;
  let activeTab = 'saved'; // 'saved' or 'messages'

  function switchTab(tab) {
    activeTab = tab;
    const statsBar = document.getElementById('stats-bar');
    const filterSection = document.getElementById('filter-section');
    const resultsSection = document.getElementById('results-section');
    const messagingSection = document.getElementById('messaging-section');
    const navSaved = document.getElementById('nav-saved');
    const navMessages = document.getElementById('nav-messages');

    if (tab === 'saved') {
      statsBar.style.display = '';
      filterSection.style.display = '';
      resultsSection.style.display = '';
      messagingSection.style.display = 'none';
      navSaved.classList.add('active');
      navMessages.classList.remove('active');
    } else {
      statsBar.style.display = 'none';
      filterSection.style.display = 'none';
      resultsSection.style.display = 'none';
      messagingSection.style.display = '';
      navSaved.classList.remove('active');
      navMessages.classList.add('active');
      loadConversations();
    }
  }

  async function loadConversations() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('whatsapp_conversations')
        .select('*, businesses(name, phone)')
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }
      conversations = data || [];
      renderConversationsList();
    } catch (err) {
      console.error('Load conversations error:', err);
    }
  }

  function renderConversationsList() {
    const container = document.getElementById('conversations-list');
    const searchTerm = (document.getElementById('conv-search')?.value || '').toLowerCase();

    const filtered = searchTerm
      ? conversations.filter(c => {
          const name = c.businesses?.name || '';
          return name.toLowerCase().includes(searchTerm);
        })
      : conversations;

    if (filtered.length === 0) {
      container.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-dim);font-size:13px">${t('msgNoConversations')}</div>`;
      return;
    }

    container.innerHTML = filtered.map(c => {
      const name = escapeHtml(c.businesses?.name || 'Unknown');
      const preview = escapeHtml(c.last_message_text || '');
      const time = c.last_message_at ? formatMessageTime(c.last_message_at) : '';
      const isActive = c.id === activeConversationId;
      const unread = c.unread_count > 0
        ? `<span class="unread-badge">${c.unread_count}</span>`
        : '';
      const initial = (c.businesses?.name || '?')[0].toUpperCase();

      return `<div class="conversation-item${isActive ? ' active' : ''}" data-conv-id="${c.id}">
        <div class="conversation-avatar">${initial}</div>
        <div class="conversation-info">
          <div class="conversation-name">${name}</div>
          <div class="conversation-preview">${preview}</div>
        </div>
        <div class="conversation-meta">
          <span class="conversation-time">${time}</span>
          ${unread}
        </div>
      </div>`;
    }).join('');

    container.querySelectorAll('.conversation-item').forEach(el => {
      el.addEventListener('click', () => {
        const convId = el.getAttribute('data-conv-id');
        openConversation(convId);
      });
    });
  }

  async function openConversation(convId) {
    activeConversationId = convId;
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;

    // Reset unread count
    if (conv.unread_count > 0) {
      conv.unread_count = 0;
      if (supabaseClient) {
        supabaseClient
          .from('whatsapp_conversations')
          .update({ unread_count: 0 })
          .eq('id', convId)
          .then(() => {});
      }
    }

    renderConversationsList();
    await loadMessages(convId);
    renderChatView(conv);
  }

  async function loadMessages(conversationId) {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }
      currentMessages = data || [];
    } catch (err) {
      console.error('Load messages error:', err);
    }
  }

  function renderChatView(conv) {
    const chatPanel = document.getElementById('chat-panel');
    const name = escapeHtml(conv.businesses?.name || 'Unknown');
    const phone = escapeHtml(conv.recipient_phone || '');
    const windowOpen = check24HourWindow(conv);
    const windowBadge = windowOpen
      ? `<span class="chat-window-badge chat-window-open">${t('msgWindowOpen')}</span>`
      : `<span class="chat-window-badge chat-window-closed">${t('msgWindowClosed')}</span>`;

    let inputHtml;
    if (windowOpen) {
      inputHtml = `<div class="chat-input-area">
        <textarea id="chat-input" rows="1" placeholder="${t('msgPlaceholder')}"></textarea>
        <button class="btn-send" id="btn-send-msg">${t('msgSend')}</button>
      </div>`;
    } else {
      inputHtml = `<div class="template-selector" id="template-selector">
        <div class="template-selector-label">${t('msgTemplateRequired')}</div>
        <div class="template-selector-row">
          <select class="input" id="template-select">
            <option value="">${t('msgTemplateSelect')}</option>
            ${templates.filter(tpl => tpl.meta_status === 'APPROVED').map(tpl =>
              `<option value="${escapeHtml(tpl.template_name)}" data-params="${tpl.param_count}">${escapeHtml(tpl.template_name)} (${escapeHtml(tpl.language)})</option>`
            ).join('')}
          </select>
          <button class="btn-send" id="btn-send-template">${t('msgSendTemplate')}</button>
        </div>
        <div class="template-params" id="template-params"></div>
      </div>`;
    }

    chatPanel.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-info">
          <h3>${name}</h3>
          <div class="chat-header-phone">${phone}</div>
        </div>
        ${windowBadge}
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      ${inputHtml}
    `;

    renderMessages();
    bindChatEvents(conv);

    // Scroll to bottom
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  function renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    let lastDate = '';
    container.innerHTML = currentMessages.map(msg => {
      const msgDate = new Date(msg.created_at).toLocaleDateString();
      let dateDivider = '';
      if (msgDate !== lastDate) {
        lastDate = msgDate;
        dateDivider = `<div class="msg-date-divider">${formatDateLabel(msg.created_at)}</div>`;
      }

      const isOutbound = msg.direction === 'outbound';
      const bubbleClass = isOutbound ? 'msg-outbound' : 'msg-inbound';
      const failedClass = msg.status === 'failed' ? ' msg-failed' : '';
      const templateClass = msg.message_type === 'template' ? ' msg-template' : '';
      const time = formatMessageTime(msg.created_at, true);
      const statusTick = isOutbound ? renderStatusTick(msg.status) : '';
      const body = msg.body
        ? escapeHtml(msg.body)
        : msg.template_name
          ? `[${escapeHtml(msg.template_name)}]`
          : '';

      return `${dateDivider}<div class="msg-bubble ${bubbleClass}${failedClass}${templateClass}" data-msg-id="${msg.id}">
        <div>${body}</div>
        <div class="msg-time">${time}${statusTick}</div>
      </div>`;
    }).join('');
  }

  function renderStatusTick(status) {
    switch (status) {
      case 'sent': return ' <span class="msg-status" title="' + t('msgStatusSent') + '">&#10003;</span>';
      case 'delivered': return ' <span class="msg-status" title="' + t('msgStatusDelivered') + '">&#10003;&#10003;</span>';
      case 'read': return ' <span class="msg-status" title="' + t('msgStatusRead') + '" style="color:#53bdeb">&#10003;&#10003;</span>';
      case 'failed': return ' <span class="msg-status" title="' + t('msgStatusFailed') + '" style="color:var(--danger)">&#10007;</span>';
      default: return ' <span class="msg-status">&#9711;</span>';
    }
  }

  function bindChatEvents(conv) {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('btn-send-msg');
    const templateSelect = document.getElementById('template-select');
    const sendTemplateBtn = document.getElementById('btn-send-template');
    const templateParamsContainer = document.getElementById('template-params');

    if (chatInput && sendBtn) {
      // Auto-resize textarea
      chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
      });

      // Send on Enter (Shift+Enter for newline)
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage(conv);
        }
      });

      sendBtn.addEventListener('click', () => sendMessage(conv));
    }

    if (templateSelect) {
      templateSelect.addEventListener('change', () => {
        if (!templateParamsContainer) return;
        const paramCount = parseInt(templateSelect.selectedOptions[0]?.getAttribute('data-params') || '0', 10);
        templateParamsContainer.innerHTML = '';
        for (let i = 0; i < paramCount; i++) {
          templateParamsContainer.innerHTML += `<input type="text" class="input" placeholder="${t('msgTemplateParam', i + 1)}" data-param-index="${i}">`;
        }
      });
    }

    if (sendTemplateBtn) {
      sendTemplateBtn.addEventListener('click', () => sendTemplateMessage(conv));
    }
  }

  async function sendMessage(conv) {
    const chatInput = document.getElementById('chat-input');
    const text = chatInput?.value?.trim();
    if (!text) return;

    const sendBtn = document.getElementById('btn-send-msg');
    sendBtn.disabled = true;
    sendBtn.textContent = t('msgSending');
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Optimistic UI
    const optimisticMsg = {
      id: 'temp-' + Date.now(),
      conversation_id: conv.id,
      business_id: conv.business_id,
      direction: 'outbound',
      message_type: 'text',
      body: text,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    currentMessages.push(optimisticMsg);
    renderMessages();
    scrollChatToBottom();

    try {
      const res = await withTimeout(
        fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: conv.business_id,
            phone: conv.recipient_phone,
            message: text,
          }),
        }),
        15000,
        'WhatsApp send'
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Send failed');
      }

      // Update optimistic message
      const idx = currentMessages.findIndex(m => m.id === optimisticMsg.id);
      if (idx >= 0) {
        currentMessages[idx].id = data.messageId;
        currentMessages[idx].wamid = data.wamid;
        currentMessages[idx].status = 'sent';
      }
      renderMessages();

      // Update conversation preview
      conv.last_message_text = text.substring(0, 200);
      conv.last_message_at = new Date().toISOString();
      renderConversationsList();
    } catch (err) {
      console.error('Send message error:', err);
      showToast(t('msgSendError'), 'error');
      // Mark optimistic message as failed
      const idx = currentMessages.findIndex(m => m.id === optimisticMsg.id);
      if (idx >= 0) {
        currentMessages[idx].status = 'failed';
      }
      renderMessages();
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = t('msgSend');
    }
  }

  async function sendTemplateMessage(conv) {
    const templateSelect = document.getElementById('template-select');
    const templateName = templateSelect?.value;
    if (!templateName) return;

    const paramInputs = document.querySelectorAll('#template-params input');
    const templateParams = Array.from(paramInputs).map(inp => inp.value);

    const sendBtn = document.getElementById('btn-send-template');
    sendBtn.disabled = true;
    sendBtn.textContent = t('msgSending');

    // Find template for language
    const tpl = templates.find(t => t.template_name === templateName);

    // Optimistic UI
    const optimisticMsg = {
      id: 'temp-' + Date.now(),
      conversation_id: conv.id,
      business_id: conv.business_id,
      direction: 'outbound',
      message_type: 'template',
      template_name: templateName,
      body: null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    currentMessages.push(optimisticMsg);
    renderMessages();
    scrollChatToBottom();

    try {
      const res = await withTimeout(
        fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: conv.business_id,
            phone: conv.recipient_phone,
            templateName: templateName,
            templateParams: templateParams.length > 0 ? templateParams : undefined,
            language: tpl?.language || 'en',
          }),
        }),
        15000,
        'WhatsApp send template'
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Send failed');
      }

      const idx = currentMessages.findIndex(m => m.id === optimisticMsg.id);
      if (idx >= 0) {
        currentMessages[idx].id = data.messageId;
        currentMessages[idx].wamid = data.wamid;
        currentMessages[idx].status = 'sent';
      }
      renderMessages();
      showToast(t('msgSendSuccess'), 'success');

      conv.last_message_text = `[Template: ${templateName}]`;
      conv.last_message_at = new Date().toISOString();
      renderConversationsList();
    } catch (err) {
      console.error('Send template error:', err);
      showToast(t('msgSendError'), 'error');
      const idx = currentMessages.findIndex(m => m.id === optimisticMsg.id);
      if (idx >= 0) {
        currentMessages[idx].status = 'failed';
      }
      renderMessages();
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = t('msgSendTemplate');
    }
  }

  function check24HourWindow(conv) {
    if (!conv.last_inbound_at) return false;
    const lastInbound = new Date(conv.last_inbound_at);
    const hoursSince = (Date.now() - lastInbound.getTime()) / (1000 * 60 * 60);
    return hoursSince <= 24;
  }

  async function startNewConversation(businessId, phone) {
    if (!phone) {
      showToast(t('msgNoPhone'), 'warning');
      return;
    }

    // Switch to messages tab
    switchTab('messages');

    // Check if conversation already exists
    const existing = conversations.find(c => c.business_id == businessId);
    if (existing) {
      openConversation(existing.id);
      return;
    }

    // Upsert new conversation
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('whatsapp_conversations')
        .upsert({
          business_id: businessId,
          recipient_phone: phone,
          status: 'active',
        }, { onConflict: 'business_id' })
        .select('*, businesses(name, phone)');

      if (error) {
        console.error('Create conversation error:', error);
        return;
      }
      if (data && data.length > 0) {
        // Refresh and open
        await loadConversations();
        openConversation(data[0].id);
      }
    } catch (err) {
      console.error('Start conversation error:', err);
    }
  }

  async function loadTemplates() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('whatsapp_templates')
        .select('*')
        .eq('meta_status', 'APPROVED');

      if (error) {
        console.warn('Error loading templates:', error);
        return;
      }
      templates = data || [];
    } catch (err) {
      console.warn('Load templates error:', err);
    }
  }

  async function syncTemplates() {
    showToast(t('msgSyncTemplates'), 'warning');
    try {
      const res = await withTimeout(
        fetch('/api/whatsapp/templates'),
        15000,
        'Template sync'
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sync failed');
      }
      templates = data.templates || [];
      showToast(t('msgSyncSuccess'), 'success');
    } catch (err) {
      console.error('Sync templates error:', err);
      showToast(t('msgSyncError'), 'error');
    }
  }

  function setupRealtimeSubscription() {
    if (!supabaseClient) return;

    realtimeChannel = supabaseClient
      .channel('whatsapp-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
        (payload) => {
          const msg = payload.new;
          // Inbound message
          if (msg.direction === 'inbound') {
            handleNewInboundMessage(msg);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'whatsapp_messages' },
        (payload) => {
          handleMessageStatusUpdate(payload.new);
        }
      )
      .subscribe();
  }

  function handleNewInboundMessage(msg) {
    // If viewing this conversation, append message
    if (msg.conversation_id === activeConversationId) {
      currentMessages.push(msg);
      renderMessages();
      scrollChatToBottom();

      // Reset unread since we're viewing
      if (supabaseClient) {
        supabaseClient
          .from('whatsapp_conversations')
          .update({ unread_count: 0 })
          .eq('id', msg.conversation_id)
          .then(() => {});
      }
    }

    // Update conversations list
    const conv = conversations.find(c => c.id === msg.conversation_id);
    if (conv) {
      conv.last_message_text = (msg.body || '').substring(0, 200);
      conv.last_message_at = msg.created_at;
      conv.last_inbound_at = msg.created_at;
      if (msg.conversation_id !== activeConversationId) {
        conv.unread_count = (conv.unread_count || 0) + 1;
      }
      // Re-sort conversations
      conversations.sort((a, b) => {
        const aTime = a.last_message_at || a.created_at;
        const bTime = b.last_message_at || b.created_at;
        return new Date(bTime) - new Date(aTime);
      });
      renderConversationsList();
    } else {
      // New conversation — reload the list
      loadConversations();
    }
  }

  function handleMessageStatusUpdate(msg) {
    if (msg.conversation_id !== activeConversationId) return;
    const idx = currentMessages.findIndex(m => m.id === msg.id || m.wamid === msg.wamid);
    if (idx >= 0) {
      currentMessages[idx].status = msg.status;
      currentMessages[idx].delivered_at = msg.delivered_at;
      currentMessages[idx].read_at = msg.read_at;
      renderMessages();
    }
  }

  function scrollChatToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  function formatMessageTime(ts, timeOnly) {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (timeOnly) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return t('msgYesterday');
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  function formatDateLabel(ts) {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('msgToday');
    if (diffDays === 1) return t('msgYesterday');
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  }

  // ── Start ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
