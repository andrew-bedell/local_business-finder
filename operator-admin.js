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
      thRating: 'Rating',
      thReviews: 'Reviews',
      thInstagram: 'IG',
      thFacebook: 'FB',
      thReport: 'Report',
      thWebsite: 'Website',
      thActions: 'Actions',
      viewBtn: 'View',
      badgeYes: 'Yes',
      badgeNo: '—',
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
      thRating: 'Calificación',
      thReviews: 'Reseñas',
      thInstagram: 'IG',
      thFacebook: 'FB',
      thReport: 'Informe',
      thWebsite: 'Sitio Web',
      thActions: 'Acciones',
      viewBtn: 'Ver',
      badgeYes: 'Sí',
      badgeNo: '—',
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

    resultsBody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:24px;color:var(--text-muted)">${t('loadingData')}</td></tr>`;
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
      const ig = getProfile(b, 'instagram');
      const fb = getProfile(b, 'facebook');
      const websiteStatus = getWebsiteStatus(b);

      const igBadge = ig
        ? `<span class="badge badge-has-site">${ig.post_count ? ig.post_count + ' posts' : t('badgeYes')}</span>`
        : `<span style="color:var(--text-dim)">${t('badgeNo')}</span>`;

      const fbBadge = fb
        ? `<span class="badge badge-has-site">${t('badgeYes')}</span>`
        : `<span style="color:var(--text-dim)">${t('badgeNo')}</span>`;

      const reportBadge = websiteStatus
        ? `<span class="badge badge-has-site">${t('badgeYes')}</span>`
        : `<span style="color:var(--text-dim)">${t('badgeNo')}</span>`;

      const websiteBadge = websiteStatus
        ? `<span class="badge ${websiteStatus === 'published' ? 'badge-has-site' : 'badge-no-site'}">${t('badge' + websiteStatus.charAt(0).toUpperCase() + websiteStatus.slice(1))}</span>`
        : `<span style="color:var(--text-dim)">${t('badgeNo')}</span>`;

      return `<tr>
        <td>${offset + i + 1}</td>
        <td><strong>${escapeHtml(b.name)}</strong></td>
        <td>${escapeHtml(extractCity(b.address_full))}</td>
        <td style="text-transform:capitalize">${escapeHtml(extractCategory(b.types))}</td>
        <td><span class="stars">${renderStars(b.rating)}</span> ${b.rating ? b.rating.toFixed(1) : '—'}</td>
        <td>${b.review_count || 0}</td>
        <td>${igBadge}</td>
        <td>${fbBadge}</td>
        <td>${reportBadge}</td>
        <td>${websiteBadge}</td>
        <td><button class="btn btn-view" data-id="${b.id}" data-i18n="viewBtn">${t('viewBtn')}</button></td>
      </tr>`;
    }).join('');

    // Bind view buttons
    resultsBody.querySelectorAll('.btn-view').forEach((btn) => {
      btn.addEventListener('click', () => {
        const businessId = btn.getAttribute('data-id');
        const business = currentResults.find(b => b.id === businessId);
        if (business) openDetailModal(business);
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
    // Load full details (reviews, photos) if not cached
    let details = detailCache[business.id];
    if (!details) {
      try {
        const [reviewsRes, photosRes] = await Promise.all([
          supabaseClient.from('business_reviews').select('*').eq('business_id', business.id).order('rating', { ascending: false }).limit(20),
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
    const googleReviews = details.reviews.filter(r => r.source === 'google');
    const fbReviews = details.reviews.filter(r => r.source === 'facebook');
    const photos = details.photos;

    // Build hours HTML
    let hoursHtml = '';
    if (business.hours && business.hours.length > 0) {
      hoursHtml = `<div class="modal-section">
        <h3>${t('modalHours')}</h3>
        <ul style="list-style:none;padding:0;font-size:13px;color:var(--text-muted)">${business.hours.map(h => `<li>${escapeHtml(h)}</li>`).join('')}</ul>
      </div>`;
    }

    // Build categories HTML
    let typesHtml = '';
    if (business.types && business.types.length > 0) {
      const tags = business.types.map(t => `<span class="feature-tag">${escapeHtml(t.replace(/_/g, ' '))}</span>`).join('');
      typesHtml = `<div class="modal-section"><h3>${t('modalTypes')}</h3><div class="features-grid">${tags}</div></div>`;
    }

    // Build social profiles HTML
    let socialHtml = '';
    if (profiles.length > 0) {
      const items = profiles.map(p =>
        `<a href="${escapeHtml(p.url || '#')}" target="_blank" rel="noopener" class="social-profile-item">
          <span style="text-transform:capitalize;font-weight:600">${escapeHtml(p.platform)}</span>
          ${p.handle ? `<span style="color:var(--text-muted)">@${escapeHtml(p.handle)}</span>` : ''}
          ${p.follower_count ? `<span style="color:var(--text-muted)">${p.follower_count.toLocaleString()} followers</span>` : ''}
        </a>`
      ).join('');
      socialHtml = `<div class="modal-section"><h3>${t('modalSocialProfiles')}</h3><div class="social-profiles-list">${items}</div></div>`;
    }

    // Build photos HTML
    let photosHtml = '';
    if (photos.length > 0) {
      const imgs = photos.map(p => `<img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.caption || '')}" class="photo-grid-item" loading="lazy">`).join('');
      photosHtml = `<div class="modal-section"><h3>${t('modalPhotos')}</h3><div class="photo-grid">${imgs}</div></div>`;
    }

    // Build Google reviews HTML
    let gReviewsHtml = '';
    if (googleReviews.length > 0) {
      const items = googleReviews.map(r =>
        `<div class="review-item">
          <div class="review-header">
            <strong>${escapeHtml(r.author_name || 'Anonymous')}</strong>
            <span class="stars">${renderStars(r.rating)}</span>
          </div>
          <p class="review-text">${escapeHtml(r.text || '')}</p>
        </div>`
      ).join('');
      gReviewsHtml = `<div class="modal-section"><h3>${t('modalGoogleReviews')} (${googleReviews.length})</h3>${items}</div>`;
    }

    // Build Facebook reviews HTML
    let fbReviewsHtml = '';
    if (fbReviews.length > 0) {
      const items = fbReviews.map(r =>
        `<div class="review-item">
          <div class="review-header">
            <strong>${escapeHtml(r.author_name || 'Anonymous')}</strong>
            <span class="stars">${renderStars(r.rating)}</span>
          </div>
          <p class="review-text">${escapeHtml(r.text || '')}</p>
        </div>`
      ).join('');
      fbReviewsHtml = `<div class="modal-section"><h3>${t('modalFacebookReviews')} (${fbReviews.length})</h3>${items}</div>`;
    }

    // Check if there's already a generated website
    const existingWebsite = (business.generated_websites || []).find(w => w.config && w.config.html);
    const hasReport = existingWebsite && existingWebsite.config && existingWebsite.config.researchReport;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'detail-modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:900px">
        <div class="modal-header">
          <h2>${escapeHtml(business.name)}</h2>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-section">
            <p><strong>${t('modalAddress')}:</strong> ${escapeHtml(business.address_full || '—')}</p>
            <p><strong>${t('modalPhone')}:</strong> ${business.phone ? `<a href="tel:${escapeHtml(business.phone)}">${escapeHtml(business.phone)}</a>` : '—'}</p>
            <p><strong>${t('modalRating')}:</strong> <span class="stars">${renderStars(business.rating)}</span> ${business.rating ? business.rating.toFixed(1) : '—'} (${business.review_count || 0} ${t('modalReviews').toLowerCase()})</p>
            ${business.maps_url ? `<p><a href="${escapeHtml(business.maps_url)}" target="_blank" rel="noopener" style="color:var(--primary)">Google Maps</a></p>` : ''}
          </div>

          ${typesHtml}
          ${hoursHtml}
          ${socialHtml}
          ${photosHtml}
          ${gReviewsHtml}
          ${fbReviewsHtml}

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
      </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    modal.querySelector('#modal-close-btn').addEventListener('click', () => modal.remove());
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

  // ── Start ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
