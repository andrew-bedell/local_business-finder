// === Customer Admin Portal — AhoraTengoPagina ===

(function () {
  'use strict';

  // ── Config ──
  const SUPABASE_URL_FALLBACK = 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const SUPABASE_KEY_FALLBACK = '';

  // ── State ──
  let supabase = null;
  let businessSlug = null;
  let currentUser = null;
  let customerData = null;   // { customer, customerUser }
  let businessData = null;
  let websiteData = null;
  let subscriptionData = null;
  let isRecoveryMode = false;
  let pendingReviewEditRequestId = null;
  let reviewDraftHtml = null;
  let reviewCurrentHtml = null;

  // ── i18n ──
  var currentLang = localStorage.getItem('c_lang') || 'es';

  var translations = {
    es: {
      // Sidebar
      sidebar_sub: 'Panel de control',
      sidebar_label: 'Principal',
      nav_business: 'Mi Negocio',
      nav_billing: 'Facturación',
      nav_requests: 'Solicitudes',
      nav_editor: 'Editor Visual',
      nav_team: 'Equipo',
      nav_account: 'Mi Cuenta',
      nav_logout: 'Cerrar sesión',

      // Dashboard
      dash_title: 'Tu <span>Dashboard</span>',
      hero_eyebrow: 'Tu Página Web',
      hero_visit: 'Visitar mi sitio',
      hero_customize: 'Personalizar',
      stat_visits: 'Visitas este mes',
      stat_visits_sub: 'Disponible al publicar',
      stat_requests: 'Solicitudes abiertas',
      stat_requests_sub: 'Sin solicitudes aún',
      stat_billing: 'Próximo cobro',
      stat_billing_sub: 'Sin plan activo',
      stat_plan: 'Tu plan',
      stat_plan_sub: 'Plan Mensual — AhoraTengoPagina',
      dash_recent: 'Solicitudes Recientes',
      dash_view_all: 'Ver todas →',
      dash_no_requests: 'Sin solicitudes todavía',
      dash_no_requests_sub: 'Cuando necesites cambios en tu página, aparecerán aquí.',
      dash_actions: 'Acciones Rápidas',
      action_subscription: 'Administrar suscripción',
      action_subscription_sub: 'Ver tu plan y facturación',
      action_business: 'Completar mi negocio',
      action_business_sub: 'Agrega info y servicios',
      action_changes: 'Solicitar cambios',
      action_changes_sub: 'Actualiza tu página web',
      action_support: 'Contactar soporte',
      action_support_sub: 'Estamos aquí para ayudarte',

      // Analytics
      nav_analytics: 'Analíticas',
      nav_analytics_short: 'Stats',
      analytics_title: 'Analíticas de tu <span>Sitio Web</span>',
      analytics_7d: 'Últimos 7 días',
      analytics_30d: 'Últimos 30 días',
      analytics_90d: 'Últimos 90 días',
      analytics_views: 'Visitas',
      analytics_unique: 'visitantes únicos',
      analytics_calls: 'Llamadas',
      analytics_calls_sub: 'clics en teléfono',
      analytics_directions: 'Direcciones',
      analytics_directions_sub: 'clics en mapa',
      analytics_contacts: 'Contactos',
      analytics_contacts_sub: 'email + redes + formularios',
      analytics_chart_title: 'Visitas por día',
      analytics_referrers: 'Fuentes de Tráfico',
      analytics_devices: 'Dispositivos',
      analytics_no_data: 'Sin datos aún',
      analytics_loading: 'Cargando datos...',
      analytics_direct: 'Directo',
      analytics_desktop: 'Escritorio',
      analytics_mobile: 'Móvil',
      analytics_tablet: 'Tablet',

      // Scheduling
      nav_scheduling: 'Reservas',
      nav_scheduling_short: 'Reservas',
      sched_title: 'Sistema de <span>Reservas</span>',
      sched_desc: 'Configura tu sistema de reservas, administra tu personal y define tus servicios.',
      sched_tab_config: 'Configuración',
      sched_tab_staff: 'Personal',
      sched_tab_services: 'Servicios',
      sched_config_title: 'Tipo de Negocio',
      sched_type_label: 'Modelo de reservas',
      sched_type_appointment: 'Citas',
      sched_type_appointment_desc: 'Barbería, salón, spa, consultorio',
      sched_type_class: 'Clases',
      sched_type_class_desc: 'Gimnasio, yoga, estudio de baile',
      sched_timezone: 'Zona horaria',
      sched_booking_window: 'Ventana de reservas (días)',
      sched_min_advance: 'Anticipación mínima (horas)',
      sched_cancel_hours: 'Cancelación permitida (horas antes)',
      sched_save_config: 'Guardar Configuración',
      sched_config_saved: 'Configuración guardada.',
      sched_config_error: 'Error al guardar configuración.',
      sched_staff_title: 'Personal',
      sched_staff_name: 'Nombre',
      sched_staff_phone: 'Teléfono',
      sched_staff_email: 'Correo',
      sched_staff_specialties: 'Especialidades',
      sched_staff_bio: 'Biografía',
      sched_add_staff: '+ Agregar',
      sched_save_staff: 'Guardar',
      sched_cancel: 'Cancelar',
      sched_staff_loading: 'Cargando...',
      sched_staff_empty: 'Sin personal registrado',
      sched_staff_empty_sub: 'Agrega a tu equipo para empezar.',
      sched_staff_saved: 'Personal guardado.',
      sched_staff_deleted: 'Personal eliminado.',
      sched_staff_error: 'Error al guardar personal.',
      sched_svc_title: 'Servicios',
      sched_svc_name: 'Nombre del servicio',
      sched_svc_category: 'Categoría',
      sched_svc_description: 'Descripción',
      sched_svc_duration: 'Duración (min)',
      sched_svc_price: 'Precio',
      sched_svc_currency: 'Moneda',
      sched_svc_capacity: 'Capacidad máxima',
      sched_svc_capacity_hint: '1 = cita individual, >1 = clase grupal',
      sched_svc_color: 'Color',
      sched_add_service: '+ Agregar',
      sched_save_service: 'Guardar',
      sched_svc_loading: 'Cargando...',
      sched_svc_empty: 'Sin servicios registrados',
      sched_svc_empty_sub: 'Define los servicios que ofreces.',
      sched_svc_saved: 'Servicio guardado.',
      sched_svc_deleted: 'Servicio eliminado.',
      sched_svc_error: 'Error al guardar servicio.',
      sched_edit: 'Editar',
      sched_delete: 'Eliminar',
      sched_confirm_delete_staff: '¿Eliminar este miembro del personal?',
      sched_confirm_delete_service: '¿Eliminar este servicio?',

      // Wizard
      nav_wizard: 'Completar Datos',
      nav_wizard_short: 'Datos',
      wiz_title: 'Completar <span>Datos</span>',
      wiz_score_label: 'Puntaje de datos',
      wiz_hint_default: 'Completa las secciones para mejorar tu puntaje.',
      wiz_hint_photos: 'Agrega {0} foto(s) más para mejorar tu puntaje en {1} puntos.',
      wiz_hint_reviews: 'Agrega {0} reseña(s) más para mejorar tu puntaje en {1} puntos.',
      wiz_hint_whatsapp: 'Agrega tu número de WhatsApp para ganar {0} puntos.',
      wiz_hint_address: 'Agrega tu dirección para ganar {0} puntos.',
      wiz_hint_hours: 'Agrega tu horario para ganar {0} puntos.',
      wiz_hint_founder: 'Agrega la historia del fundador para ganar {0} puntos.',
      wiz_hint_complete: '¡Excelente! Tus datos están completos.',
      wiz_photos_title: 'Fotos',
      wiz_photos_drop: 'Arrastra fotos aquí o haz clic para seleccionar',
      wiz_photos_hint: 'JPG, PNG o WebP. Máximo 4MB por foto.',
      wiz_photos_type_label: 'Tipo de foto',
      wiz_type_exterior: 'Exterior',
      wiz_type_interior: 'Interior',
      wiz_type_product: 'Producto',
      wiz_type_food: 'Comida',
      wiz_type_team: 'Equipo',
      wiz_type_logo: 'Logo',
      wiz_reviews_title: 'Reseñas de Clientes',
      wiz_review_name: 'Nombre del cliente',
      wiz_review_rating: 'Calificación',
      wiz_review_text: 'Reseña',
      wiz_review_add: 'Agregar Reseña',
      wiz_review_confirm_delete: '¿Eliminar esta reseña?',
      wiz_whatsapp_label: 'Número de WhatsApp (con código de país)',
      wiz_address_title: 'Dirección',
      wiz_address_label: 'Dirección completa',
      wiz_hours_title: 'Horario de Atención',
      wiz_hours_same: 'Mismo horario todos los días',
      wiz_day_mon: 'Lunes',
      wiz_day_tue: 'Martes',
      wiz_day_wed: 'Miércoles',
      wiz_day_thu: 'Jueves',
      wiz_day_fri: 'Viernes',
      wiz_day_sat: 'Sábado',
      wiz_day_sun: 'Domingo',
      wiz_founder_title: 'Sobre el Fundador',
      wiz_founder_name_label: 'Nombre del fundador / dueño',
      wiz_founder_photo_label: 'Foto del fundador',
      wiz_founder_photo_btn: 'Subir foto',
      wiz_founder_story_label: 'Historia del fundador (100-300 caracteres)',
      wiz_optional: '(opcional)',
      wiz_services_title: 'Servicios / Productos',
      wiz_svc_name: 'Nombre del servicio / producto',
      wiz_svc_price: 'Precio',
      wiz_svc_currency: 'Moneda',
      wiz_svc_photo: 'Foto',
      wiz_svc_photo_btn: 'Subir foto',
      wiz_svc_description: 'Descripción',
      wiz_svc_save: 'Guardar Servicio',
      wiz_svc_saved: 'Servicio guardado.',
      wiz_svc_deleted: 'Servicio eliminado.',
      wiz_svc_error: 'Error al guardar el servicio.',
      wiz_svc_name_required: 'Escribe el nombre del servicio.',
      wiz_svc_confirm_delete: '¿Eliminar este servicio?',
      wiz_hint_services: 'Agrega servicios o productos para ganar hasta {0} puntos.',
      wiz_saved: 'Guardado',
      wiz_saving: 'Guardando...',
      wiz_uploading: 'Subiendo...',
      wiz_upload_error: 'Error al subir la foto. Intenta de nuevo.',
      wiz_upload_too_large: 'La foto es muy grande. Máximo 4MB.',
      wiz_review_error: 'Error al guardar la reseña.',
      wiz_review_deleted: 'Reseña eliminada.',
      wiz_save_error: 'Error al guardar. Intenta de nuevo.',
      wiz_photo_deleted: 'Foto eliminada.',
      wiz_photo_delete_error: 'Error al eliminar la foto.',
      wiz_confirm_delete_photo: '¿Eliminar esta foto?',
      wiz_review_name_required: 'Agrega el nombre del cliente.',
      wiz_review_text_required: 'Escribe la reseña.',

      // Footer
      footer_copy: 'Todos los derechos reservados.',
      footer_privacy: 'Privacidad',
      footer_support: 'Soporte',

      // Login
      login_title: 'Inicia sesión en tu panel',
      login_email_label: 'Tu correo electrónico',
      login_email_ph: 'tu@email.com',
      login_submit: 'Enviar enlace de acceso',
      login_hint: 'Te enviaremos un enlace mágico — sin contraseña necesaria.'
    },
    en: {
      // Sidebar
      sidebar_sub: 'Control Panel',
      sidebar_label: 'Main',
      nav_business: 'My Business',
      nav_billing: 'Billing',
      nav_requests: 'Requests',
      nav_editor: 'Visual Editor',
      nav_team: 'Team',
      nav_account: 'My Account',
      nav_logout: 'Sign out',

      // Dashboard
      dash_title: 'Your <span>Dashboard</span>',
      hero_eyebrow: 'Your Website',
      hero_visit: 'Visit my site',
      hero_customize: 'Customize',
      stat_visits: 'Visits this month',
      stat_visits_sub: 'Available when published',
      stat_requests: 'Open requests',
      stat_requests_sub: 'No requests yet',
      stat_billing: 'Next charge',
      stat_billing_sub: 'No active plan',
      stat_plan: 'Your plan',
      stat_plan_sub: 'Monthly Plan — AhoraTengoPagina',
      dash_recent: 'Recent Requests',
      dash_view_all: 'View all →',
      dash_no_requests: 'No requests yet',
      dash_no_requests_sub: 'When you need changes to your page, they\'ll appear here.',
      dash_actions: 'Quick Actions',
      action_subscription: 'Manage subscription',
      action_subscription_sub: 'View your plan and billing',
      action_business: 'Complete my business',
      action_business_sub: 'Add info and services',
      action_changes: 'Request changes',
      action_changes_sub: 'Update your website',
      action_support: 'Contact support',
      action_support_sub: 'We\'re here to help',

      // Analytics
      nav_analytics: 'Analytics',
      nav_analytics_short: 'Stats',
      analytics_title: 'Your <span>Website Analytics</span>',
      analytics_7d: 'Last 7 days',
      analytics_30d: 'Last 30 days',
      analytics_90d: 'Last 90 days',
      analytics_views: 'Views',
      analytics_unique: 'unique visitors',
      analytics_calls: 'Calls',
      analytics_calls_sub: 'phone clicks',
      analytics_directions: 'Directions',
      analytics_directions_sub: 'map clicks',
      analytics_contacts: 'Contacts',
      analytics_contacts_sub: 'email + social + forms',
      analytics_chart_title: 'Views per day',
      analytics_referrers: 'Traffic Sources',
      analytics_devices: 'Devices',
      analytics_no_data: 'No data yet',
      analytics_loading: 'Loading data...',
      analytics_direct: 'Direct',
      analytics_desktop: 'Desktop',
      analytics_mobile: 'Mobile',
      analytics_tablet: 'Tablet',

      // Scheduling
      nav_scheduling: 'Bookings',
      nav_scheduling_short: 'Book',
      sched_title: 'Booking <span>System</span>',
      sched_desc: 'Configure your booking system, manage staff and define your services.',
      sched_tab_config: 'Configuration',
      sched_tab_staff: 'Staff',
      sched_tab_services: 'Services',
      sched_config_title: 'Business Type',
      sched_type_label: 'Booking model',
      sched_type_appointment: 'Appointments',
      sched_type_appointment_desc: 'Barber, salon, spa, office',
      sched_type_class: 'Classes',
      sched_type_class_desc: 'Gym, yoga, dance studio',
      sched_timezone: 'Timezone',
      sched_booking_window: 'Booking window (days)',
      sched_min_advance: 'Minimum advance (hours)',
      sched_cancel_hours: 'Cancellation allowed (hours before)',
      sched_save_config: 'Save Configuration',
      sched_config_saved: 'Configuration saved.',
      sched_config_error: 'Error saving configuration.',
      sched_staff_title: 'Staff',
      sched_staff_name: 'Name',
      sched_staff_phone: 'Phone',
      sched_staff_email: 'Email',
      sched_staff_specialties: 'Specialties',
      sched_staff_bio: 'Bio',
      sched_add_staff: '+ Add',
      sched_save_staff: 'Save',
      sched_cancel: 'Cancel',
      sched_staff_loading: 'Loading...',
      sched_staff_empty: 'No staff members',
      sched_staff_empty_sub: 'Add your team to get started.',
      sched_staff_saved: 'Staff member saved.',
      sched_staff_deleted: 'Staff member removed.',
      sched_staff_error: 'Error saving staff member.',
      sched_svc_title: 'Services',
      sched_svc_name: 'Service name',
      sched_svc_category: 'Category',
      sched_svc_description: 'Description',
      sched_svc_duration: 'Duration (min)',
      sched_svc_price: 'Price',
      sched_svc_currency: 'Currency',
      sched_svc_capacity: 'Max capacity',
      sched_svc_capacity_hint: '1 = individual appointment, >1 = group class',
      sched_svc_color: 'Color',
      sched_add_service: '+ Add',
      sched_save_service: 'Save',
      sched_svc_loading: 'Loading...',
      sched_svc_empty: 'No services yet',
      sched_svc_empty_sub: 'Define the services you offer.',
      sched_svc_saved: 'Service saved.',
      sched_svc_deleted: 'Service removed.',
      sched_svc_error: 'Error saving service.',
      sched_edit: 'Edit',
      sched_delete: 'Delete',
      sched_confirm_delete_staff: 'Remove this staff member?',
      sched_confirm_delete_service: 'Remove this service?',

      // Wizard
      nav_wizard: 'Complete Data',
      nav_wizard_short: 'Data',
      wiz_title: 'Complete Your <span>Data</span>',
      wiz_score_label: 'Data score',
      wiz_hint_default: 'Complete the sections to improve your score.',
      wiz_hint_photos: 'Add {0} more photo(s) to improve your score by {1} points.',
      wiz_hint_reviews: 'Add {0} more review(s) to improve your score by {1} points.',
      wiz_hint_whatsapp: 'Add your WhatsApp number to gain {0} points.',
      wiz_hint_address: 'Add your address to gain {0} points.',
      wiz_hint_hours: 'Add your hours to gain {0} points.',
      wiz_hint_founder: 'Add the founder story to gain {0} points.',
      wiz_hint_complete: 'Excellent! Your data is complete.',
      wiz_photos_title: 'Photos',
      wiz_photos_drop: 'Drag photos here or click to select',
      wiz_photos_hint: 'JPG, PNG or WebP. Max 4MB per photo.',
      wiz_photos_type_label: 'Photo type',
      wiz_type_exterior: 'Exterior',
      wiz_type_interior: 'Interior',
      wiz_type_product: 'Product',
      wiz_type_food: 'Food',
      wiz_type_team: 'Team',
      wiz_type_logo: 'Logo',
      wiz_reviews_title: 'Customer Reviews',
      wiz_review_name: 'Customer name',
      wiz_review_rating: 'Rating',
      wiz_review_text: 'Review',
      wiz_review_add: 'Add Review',
      wiz_review_confirm_delete: 'Delete this review?',
      wiz_whatsapp_label: 'WhatsApp number (with country code)',
      wiz_address_title: 'Address',
      wiz_address_label: 'Full address',
      wiz_hours_title: 'Business Hours',
      wiz_hours_same: 'Same hours every day',
      wiz_day_mon: 'Monday',
      wiz_day_tue: 'Tuesday',
      wiz_day_wed: 'Wednesday',
      wiz_day_thu: 'Thursday',
      wiz_day_fri: 'Friday',
      wiz_day_sat: 'Saturday',
      wiz_day_sun: 'Sunday',
      wiz_founder_title: 'About the Founder',
      wiz_founder_name_label: 'Founder / owner name',
      wiz_founder_photo_label: 'Founder photo',
      wiz_founder_photo_btn: 'Upload photo',
      wiz_founder_story_label: 'Founder story (100-300 characters)',
      wiz_optional: '(optional)',
      wiz_services_title: 'Services / Products',
      wiz_svc_name: 'Service / product name',
      wiz_svc_price: 'Price',
      wiz_svc_currency: 'Currency',
      wiz_svc_photo: 'Photo',
      wiz_svc_photo_btn: 'Upload photo',
      wiz_svc_description: 'Description',
      wiz_svc_save: 'Save Service',
      wiz_svc_saved: 'Service saved.',
      wiz_svc_deleted: 'Service deleted.',
      wiz_svc_error: 'Error saving service.',
      wiz_svc_name_required: 'Enter the service name.',
      wiz_svc_confirm_delete: 'Delete this service?',
      wiz_hint_services: 'Add services or products to gain up to {0} points.',
      wiz_saved: 'Saved',
      wiz_saving: 'Saving...',
      wiz_uploading: 'Uploading...',
      wiz_upload_error: 'Error uploading photo. Please try again.',
      wiz_upload_too_large: 'Photo too large. Max 4MB.',
      wiz_review_error: 'Error saving review.',
      wiz_review_deleted: 'Review deleted.',
      wiz_save_error: 'Error saving. Please try again.',
      wiz_photo_deleted: 'Photo deleted.',
      wiz_photo_delete_error: 'Error deleting photo.',
      wiz_confirm_delete_photo: 'Delete this photo?',
      wiz_review_name_required: 'Add the customer name.',
      wiz_review_text_required: 'Write the review.',

      // Footer
      footer_copy: 'All rights reserved.',
      footer_privacy: 'Privacy',
      footer_support: 'Support',

      // Login
      login_title: 'Sign in to your dashboard',
      login_email_label: 'Your email address',
      login_email_ph: 'you@email.com',
      login_submit: 'Send access link',
      login_hint: 'We\'ll send you a magic link — no password needed.'
    }
  };

  function t(key) {
    var lang = translations[currentLang] || translations.es;
    return lang[key] || (translations.es[key] || key);
  }

  function applyLanguage() {
    // Text content
    var textEls = document.querySelectorAll('[data-i18n]');
    textEls.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });

    // innerHTML (for elements with styled markup)
    var htmlEls = document.querySelectorAll('[data-i18n-html]');
    htmlEls.forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (key) el.innerHTML = t(key);
    });

    // Placeholders
    var phEls = document.querySelectorAll('[data-i18n-placeholder]');
    phEls.forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (key) el.placeholder = t(key);
    });

    // Update toggle button text
    var toggleBtn = $('#c-lang-toggle');
    if (toggleBtn) {
      toggleBtn.textContent = currentLang === 'es' ? 'EN' : 'ES';
    }
  }

  function toggleLanguage() {
    currentLang = currentLang === 'es' ? 'en' : 'es';
    localStorage.setItem('c_lang', currentLang);
    applyLanguage();
  }

  // ── DOM refs ──
  const $ = function (sel) { return document.querySelector(sel); };
  const $$ = function (sel) { return document.querySelectorAll(sel); };

  // ── Init ──
  async function init() {
    // Initialize Supabase client from server config
    if (typeof window.supabase === 'undefined' && typeof window.Supabase === 'undefined') {
      console.error('Supabase SDK not loaded');
      return;
    }

    var sb = window.supabase;

    // Fetch credentials from server
    try {
      var configRes = await fetch('/api/config');
      if (configRes.ok) {
        var configData = await configRes.json();
        var url = configData.supabaseUrl || SUPABASE_URL_FALLBACK;
        var key = configData.supabaseKey || SUPABASE_KEY_FALLBACK;
        if (url && key) {
          supabase = sb.createClient(url, key);
        }
      }
    } catch (err) {
      console.warn('Could not fetch config:', err.message);
    }

    // Fallback to hardcoded values if config fetch failed
    if (!supabase && SUPABASE_URL_FALLBACK && SUPABASE_KEY_FALLBACK) {
      supabase = sb.createClient(SUPABASE_URL_FALLBACK, SUPABASE_KEY_FALLBACK);
    }

    if (!supabase) {
      console.error('Failed to initialize Supabase client');
      return;
    }

    // Extract business slug from URL: /mipagina/:nombre
    var pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2 && pathParts[0] === 'mipagina') {
      businessSlug = decodeURIComponent(pathParts[1]);
    }

    // Detect recovery mode from URL hash (before Supabase processes the token)
    var hash = window.location.hash;
    if (hash && (hash.indexOf('type=recovery') !== -1 || hash.indexOf('type=invite') !== -1)) {
      isRecoveryMode = true;
    }

    // Set up event listeners
    bindEvents();

    // Apply language (i18n)
    applyLanguage();

    // Listen for auth state changes (handles OAuth redirects and token refresh)
    // Skip SIGNED_IN if dashboard is already loading (handleLogin handles its own load)
    supabase.auth.onAuthStateChange(function (event, session) {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && isRecoveryMode)) {
        // Recovery flow — show new password form instead of dashboard
        isRecoveryMode = true;
        currentUser = session.user;
        // Clean the URL hash
        if (window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        showNewPasswordScreen();
        return;
      }
      if (event === 'SIGNED_IN' && session && !currentUser) {
        currentUser = session.user;
        showLoading();
        loadDashboard();
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        customerData = null;
        businessData = null;
        websiteData = null;
        subscriptionData = null;
        showLoginScreen();
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(function (result) {
      var session = result.data.session;
      if (isRecoveryMode) {
        // In recovery mode, show password form — don't load dashboard
        // The onAuthStateChange handler will also catch this, but
        // if the user is already logged in we need to handle it here
        if (session) {
          currentUser = session.user;
        }
        if (window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        showNewPasswordScreen();
      } else if (session) {
        currentUser = session.user;
        showLoading();
        loadDashboard();
      } else {
        showLoginScreen();
      }
    }).catch(function (err) {
      console.error('Session check failed:', err);
      showLoginScreen();
    });
  }

  function bindEvents() {
    // Login form
    var loginForm = $('#login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = ($('#login-email') || {}).value || '';
        var password = ($('#login-password') || {}).value || '';
        handleLogin(email.trim(), password);
      });
    }

    // Forgot password
    var btnForgot = $('#btn-forgot-password');
    if (btnForgot) {
      btnForgot.addEventListener('click', function () {
        showResetScreen();
      });
    }

    // Reset form
    var resetForm = $('#reset-form');
    if (resetForm) {
      resetForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = ($('#reset-email') || {}).value || '';
        handleForgotPassword(email.trim());
      });
    }

    // Back to login from reset
    var btnBackToLogin = $('#btn-back-to-login');
    if (btnBackToLogin) {
      btnBackToLogin.addEventListener('click', function () {
        showLoginScreen();
      });
    }

    // Logout
    var btnLogout = $('#btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', function () {
        handleLogout();
      });
    }

    // Language toggle
    var btnLangToggle = $('#c-lang-toggle');
    if (btnLangToggle) {
      btnLangToggle.addEventListener('click', function () {
        toggleLanguage();
      });
    }

    // Navigation
    var navItems = $$('[data-section]');
    navItems.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var sectionId = item.getAttribute('data-section');
        showSection(sectionId);
      });
    });

    // Save business info form
    var businessForm = $('#business-form');
    if (businessForm) {
      businessForm.addEventListener('submit', function (e) {
        e.preventDefault();
        // Collect hours from individual day inputs
        var hourInputs = $$('#biz-hours input[data-day]');
        var hoursObj = {};
        hourInputs.forEach(function (input) {
          hoursObj[input.getAttribute('data-day')] = input.value.trim();
        });
        var formData = {
          phone: ($('#biz-phone') || {}).value || '',
          email: ($('#biz-email') || {}).value || '',
          address_full: ($('#biz-address') || {}).value || '',
          hours: hoursObj
        };
        saveBusinessInfo(formData);
      });
    }

    // Submit edit request form
    var requestForm = $('#request-form');
    if (requestForm) {
      requestForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var type = ($('#request-type') || {}).value || '';
        var description = ($('#request-description') || {}).value || '';
        var priority = ($('#request-priority') || {}).value || 'normal';
        submitEditRequest(type, description, priority);
      });
    }

    // Analytics range selector
    var analyticsRange = $('#analytics-range');
    if (analyticsRange) {
      analyticsRange.addEventListener('change', function () {
        analyticsCache = {};  // clear cache on range change
        loadAnalytics(parseInt(analyticsRange.value, 10) || 30);
      });
    }

    // Stripe portal
    var btnStripePortal = $('#btn-stripe-portal');
    if (btnStripePortal) {
      btnStripePortal.addEventListener('click', function () {
        openStripePortal();
      });
    }

    // New password form (recovery flow)
    var newPasswordForm = $('#new-password-form');
    if (newPasswordForm) {
      newPasswordForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var newPw = ($('#recovery-new-password') || {}).value || '';
        var confirmPw = ($('#recovery-confirm-password') || {}).value || '';
        handleSetNewPassword(newPw, confirmPw);
      });
    }

    // Change password form
    var passwordForm = $('#password-form');
    if (passwordForm) {
      passwordForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var currentPw = ($('#current-password') || {}).value || '';
        var newPw = ($('#new-password') || {}).value || '';
        var confirmPw = ($('#confirm-password') || {}).value || '';
        handlePasswordChange(currentPw, newPw, confirmPw);
      });
    }

    // Cancel subscription
    var btnCancelSubscription = $('#btn-cancel-subscription');
    if (btnCancelSubscription) {
      btnCancelSubscription.addEventListener('click', function () {
        cancelSubscription();
      });
    }

    // Review section — approval banner
    var btnReviewChanges = $('#btn-review-changes');
    if (btnReviewChanges) {
      btnReviewChanges.addEventListener('click', function () {
        if (pendingReviewEditRequestId) {
          loadReviewSection(pendingReviewEditRequestId);
        }
      });
    }

    // Review section — back button
    var btnBackFromReview = $('#btn-back-from-review');
    if (btnBackFromReview) {
      btnBackFromReview.addEventListener('click', function () {
        showSection('dashboard');
      });
    }

    // Review section — before/after toggle
    var btnAfter = $('#btn-review-after');
    var btnBefore = $('#btn-review-before');
    if (btnAfter) {
      btnAfter.addEventListener('click', function () {
        btnAfter.classList.add('active');
        if (btnBefore) btnBefore.classList.remove('active');
        showReviewVersion('after');
      });
    }
    if (btnBefore) {
      btnBefore.addEventListener('click', function () {
        btnBefore.classList.add('active');
        if (btnAfter) btnAfter.classList.remove('active');
        showReviewVersion('before');
      });
    }

    // Review section — approve
    var btnApprove = $('#btn-approve-change');
    if (btnApprove) {
      btnApprove.addEventListener('click', function () {
        approveChange();
      });
    }

    // Review section — reject flow
    var btnReject = $('#btn-reject-change');
    if (btnReject) {
      btnReject.addEventListener('click', function () {
        var rejectForm = $('#review-reject-form');
        if (rejectForm) rejectForm.style.display = '';
      });
    }

    var btnConfirmReject = $('#btn-confirm-reject');
    if (btnConfirmReject) {
      btnConfirmReject.addEventListener('click', function () {
        var reason = ($('#review-reject-reason') || {}).value || '';
        rejectChange(reason);
      });
    }

    var btnCancelReject = $('#btn-cancel-reject');
    if (btnCancelReject) {
      btnCancelReject.addEventListener('click', function () {
        var rejectForm = $('#review-reject-form');
        if (rejectForm) rejectForm.style.display = 'none';
      });
    }
  }

  // ── Auth ──
  async function handleLogin(email, password) {
    if (!email || !password) {
      showToast('Por favor ingresa tu correo y contraseña.', 'warning');
      return;
    }

    var btnLogin = $('#btn-login');
    if (btnLogin) {
      btnLogin.disabled = true;
      btnLogin.textContent = 'Iniciando sesión...';
    }

    try {
      var result = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (result.error) {
        throw result.error;
      }

      currentUser = result.data.user;
    } catch (err) {
      console.error('Login failed:', err.message, err.status, err);
      var msg = 'Error al iniciar sesión. Verifica tus credenciales.';
      if (err.message && err.message.includes('Invalid login')) {
        msg = 'Correo o contraseña incorrectos.';
      } else if (err.message && err.message.includes('Email not confirmed')) {
        msg = 'Tu correo no ha sido confirmado. Revisa tu bandeja de entrada.';
      } else if (err.message) {
        msg = 'Error: ' + err.message;
      }
      showToast(msg, 'error');
      return;
    } finally {
      if (btnLogin) {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Iniciar Sesión';
      }
    }

    // Login succeeded — load dashboard (separate try/catch so login errors don't mix with data errors)
    try {
      showLoading();
      await loadDashboard();
    } catch (err) {
      console.error('Dashboard load after login failed:', err);
      hideLoading();
      showToast('Sesión iniciada, pero hubo un error al cargar los datos.', 'error');
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      currentUser = null;
      customerData = null;
      businessData = null;
      websiteData = null;
      subscriptionData = null;
      showLoginScreen();
      showToast('Sesión cerrada.', 'success');
    } catch (err) {
      console.error('Logout failed:', err);
      showToast('Error al cerrar sesión.', 'error');
    }
  }

  async function handleForgotPassword(email) {
    if (!email) {
      showToast('Por favor ingresa tu correo electrónico.', 'warning');
      return;
    }

    var btnSendReset = $('#btn-send-reset');
    if (btnSendReset) {
      btnSendReset.disabled = true;
      btnSendReset.textContent = 'Enviando...';
    }

    try {
      var result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/mipagina'
      });

      if (result.error) {
        throw result.error;
      }

      showToast('Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.', 'success');
      showLoginScreen();
    } catch (err) {
      console.error('Password reset failed:', err.message, err.status, err);
      showToast('Error: ' + (err.message || 'Error al enviar el enlace de restablecimiento.'), 'error');
    } finally {
      if (btnSendReset) {
        btnSendReset.disabled = false;
        btnSendReset.textContent = 'Enviar Enlace';
      }
    }
  }

  async function handlePasswordChange(currentPassword, newPassword, confirmPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Por favor completa todos los campos.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Las contraseñas nuevas no coinciden.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres.', 'warning');
      return;
    }

    var btnChange = $('#btn-change-password');
    if (btnChange) {
      btnChange.disabled = true;
      btnChange.textContent = 'Actualizando...';
    }

    try {
      // Verify current password by re-authenticating
      var verifyResult = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword
      });

      if (verifyResult.error) {
        showToast('La contraseña actual es incorrecta.', 'error');
        return;
      }

      // Update password
      var updateResult = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateResult.error) {
        throw updateResult.error;
      }

      showToast('Contraseña actualizada correctamente.', 'success');

      // Clear fields
      var currentPwField = $('#current-password');
      var newPwField = $('#new-password');
      var confirmPwField = $('#confirm-password');
      if (currentPwField) currentPwField.value = '';
      if (newPwField) newPwField.value = '';
      if (confirmPwField) confirmPwField.value = '';
    } catch (err) {
      console.error('Password change failed:', err);
      showToast('Error al cambiar la contraseña. Intenta de nuevo.', 'error');
    } finally {
      if (btnChange) {
        btnChange.disabled = false;
        btnChange.textContent = 'Cambiar Contraseña';
      }
    }
  }

  async function handleSetNewPassword(newPassword, confirmPassword) {
    if (!newPassword || !confirmPassword) {
      showToast('Por favor completa ambos campos.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Las contraseñas no coinciden.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres.', 'warning');
      return;
    }

    var btnSet = $('#btn-set-new-password');
    if (btnSet) {
      btnSet.disabled = true;
      btnSet.textContent = 'Actualizando...';
    }

    try {
      var result = await supabase.auth.updateUser({
        password: newPassword
      });

      if (result.error) {
        throw result.error;
      }

      isRecoveryMode = false;
      showToast('Contraseña restablecida correctamente. Iniciando sesión...', 'success');

      // Sign out and redirect to login so they can log in fresh
      await supabase.auth.signOut();
      showLoginScreen();
    } catch (err) {
      console.error('Set new password failed:', err);
      showToast('Error al restablecer la contraseña: ' + (err.message || 'Intenta de nuevo.'), 'error');
    } finally {
      if (btnSet) {
        btnSet.disabled = false;
        btnSet.textContent = 'Restablecer Contraseña';
      }
    }
  }

  // ── Data Loading ──
  async function loadCustomerData() {
    if (!currentUser) return null;

    var result = await supabase
      .from('customer_users')
      .select('*, customers(*)')
      .eq('auth_user_id', currentUser.id)
      .single();

    if (result.error) {
      console.error('Failed to load customer data:', result.error);
      return null;
    }

    // Store role at top level for easy access
    if (result.data) {
      result.data.role = result.data.role || 'owner';
    }

    return result.data;
  }

  async function loadBusinessInfo(businessId) {
    var result = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (result.error) {
      console.error('Failed to load business info:', result.error);
      return null;
    }

    return result.data;
  }

  async function loadWebsiteInfo(businessId) {
    // Fetch any generated website (published or draft) — prefer published
    var result = await supabase
      .from('generated_websites')
      .select('*')
      .eq('business_id', businessId)
      .order('status', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (result.error) {
      // Not an error if no website exists yet
      if (result.error.code === 'PGRST116') {
        return null;
      }
      console.error('Failed to load website info:', result.error);
      return null;
    }

    return result.data;
  }

  async function loadSubscription(customerId) {
    var result = await supabase
      .from('subscriptions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (result.error) {
      if (result.error.code === 'PGRST116') {
        return null;
      }
      console.error('Failed to load subscription:', result.error);
      return null;
    }

    return result.data;
  }

  async function loadEditRequests(customerId) {
    var result = await supabase
      .from('edit_requests')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (result.error) {
      console.error('Failed to load edit requests:', result.error);
      return [];
    }

    return result.data || [];
  }

  async function loadDashboard() {
    showLoading();

    try {
      // Step 1: Load customer data (links auth user to customer + business)
      customerData = await loadCustomerData();

      if (!customerData || !customerData.customers) {
        hideLoading();
        showToast('No se encontró tu cuenta de cliente. Contacta al soporte.', 'error');
        showLoginScreen();
        return;
      }

      var customer = customerData.customers;
      var businessId = customer.business_id;
      var customerId = customer.id;

      // Step 2: Load all data in parallel
      var results = await Promise.all([
        loadBusinessInfo(businessId),
        loadWebsiteInfo(businessId),
        loadSubscription(customerId),
        loadEditRequests(customerId),
        loadTeamMembers()
      ]);

      businessData = results[0];
      websiteData = results[1];
      subscriptionData = results[2];
      var editRequests = results[3];
      var team = results[4];

      // Step 3: Render everything
      renderDashboard(businessData, websiteData, subscriptionData, editRequests);
      renderBusinessInfo(businessData);
      renderBilling(subscriptionData, customer);
      renderEditRequests(editRequests);
      renderInvoiceHistory();
      setupTeamSection();
      renderTeamTable(team);

      // Load analytics for dashboard visitor stat
      loadAnalytics(30);

      // Update header
      var businessNameEl = $('#business-name');
      if (businessNameEl && businessData) {
        businessNameEl.textContent = escapeHtml(businessData.name);
      }

      hideLoading();
      showDashboardScreen();

      // Check for ?review= URL parameter
      var urlParams = new URLSearchParams(window.location.search);
      var reviewId = urlParams.get('review');
      if (reviewId) {
        loadReviewSection(reviewId);
      } else {
        showSection('dashboard');
        // Check for pending approvals (show banner)
        checkPendingApprovals();
      }
    } catch (err) {
      console.error('Dashboard load failed:', err);
      hideLoading();
      showToast('Error al cargar los datos. Intenta recargar la página.', 'error');
    }
  }

  // ── Rendering ──
  function renderDashboard(business, website, subscription, editRequests) {
    // Website URL — show actual published_url or custom domain
    var websiteUrlEl = $('#website-url');
    var websiteSubEl = $('#website-sub');
    var visitBtn = $('#website-visit-btn');
    var displayUrl = null;

    var previewUrl = website ? '/ver/' + website.id : null;

    if (website && website.custom_domain && website.domain_status === 'verified') {
      displayUrl = 'https://' + website.custom_domain;
    } else if (website && website.published_url) {
      displayUrl = website.published_url;
    }

    if (websiteUrlEl) {
      if (displayUrl) {
        websiteUrlEl.innerHTML = '<a href="' + escapeHtml(displayUrl) + '" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;">' + escapeHtml(displayUrl) + '</a>';
      } else if (previewUrl) {
        websiteUrlEl.innerHTML = 'Tu sitio web está en vista previa — <a href="' + escapeHtml(previewUrl) + '" target="_blank" rel="noopener" style="color:var(--c-primary);text-decoration:underline;">Ver demo</a>';
      } else {
        websiteUrlEl.textContent = 'Tu sitio web está en construcción';
      }
    }

    if (websiteSubEl) {
      if (displayUrl) {
        websiteSubEl.textContent = 'Tu página web está activa y lista para recibir clientes.';
      } else if (previewUrl) {
        websiteSubEl.textContent = 'Tu página web está lista para revisar. Pronto será publicada.';
      } else {
        websiteSubEl.textContent = 'Estamos construyendo tu presencia en línea. Pronto tus clientes podrán encontrarte.';
      }
    }

    if (visitBtn) {
      if (displayUrl) {
        visitBtn.href = displayUrl;
        visitBtn.style.display = '';
      } else if (previewUrl) {
        visitBtn.href = previewUrl;
        visitBtn.style.display = '';
      } else {
        visitBtn.style.display = 'none';
      }
    }

    // Render domain management card
    renderDomainCard(website);

    // Subscription status
    var statusEl = $('#subscription-status');
    if (statusEl) {
      if (subscription) {
        var statusLabels = {
          active: 'Activa',
          past_due: 'Pago pendiente',
          cancelled: 'Cancelada',
          incomplete: 'Incompleta',
          trialing: 'Periodo de prueba'
        };
        var statusClasses = {
          active: 'c-badge--active',
          past_due: 'c-badge--past-due',
          cancelled: 'c-badge--cancelled',
          incomplete: 'c-badge--incomplete',
          trialing: 'c-badge--trialing'
        };
        var label = statusLabels[subscription.status] || subscription.status;
        var cls = statusClasses[subscription.status] || '';
        statusEl.innerHTML = '<span class="c-badge ' + cls + '">' + escapeHtml(label) + '</span>';
      } else {
        statusEl.innerHTML = '<span class="c-badge c-badge--incomplete">Sin suscripción</span>';
      }
    }

    // Next billing date
    var billingEl = $('#next-billing');
    if (billingEl) {
      if (subscription && subscription.current_period_end) {
        billingEl.textContent = formatDate(subscription.current_period_end);
      } else {
        billingEl.textContent = '—';
      }
    }

    // Stats — visitors placeholder
    var statVisitors = $('#stat-visitors');
    if (statVisitors) {
      statVisitors.textContent = '—';
    }

    // Stats — open requests (use already-fetched edit requests passed in)
    var statRequests = $('#stat-requests');
    if (statRequests && editRequests) {
      var openCount = editRequests.filter(function (r) {
        return r.status !== 'completed' && r.status !== 'rejected' && r.status !== 'customer_rejected';
      }).length;
      statRequests.textContent = String(openCount);
    } else if (statRequests) {
      statRequests.textContent = '0';
    }
  }

  function renderBusinessInfo(business) {
    if (!business) return;

    var nameField = $('#biz-name');
    var categoryField = $('#biz-category');
    var phoneField = $('#biz-phone');
    var emailField = $('#biz-email');
    var addressField = $('#biz-address');

    if (nameField) nameField.value = business.name || '';
    if (categoryField) categoryField.value = business.category || business.subcategory || '';
    if (phoneField) phoneField.value = business.phone || '';
    if (emailField) emailField.value = business.email || '';
    if (addressField) addressField.value = business.address_full || '';

    // Populate hours grid — hours can be JSONB object, string array, or null
    if (business.hours) {
      var hours = business.hours;
      var dayInputs = $$('#biz-hours input[data-day]');
      if (Array.isArray(hours)) {
        // Array of strings like ["Monday: 9 AM - 5 PM", ...]
        dayInputs.forEach(function (input, idx) {
          var line = hours[idx] || '';
          // Strip "Day: " prefix if present
          var colonIdx = line.indexOf(':');
          input.value = colonIdx > -1 ? line.substring(colonIdx + 1).trim() : line;
        });
      } else if (typeof hours === 'object') {
        // Object like { monday: "9:00 AM - 6:00 PM", ... }
        dayInputs.forEach(function (input) {
          var day = input.getAttribute('data-day');
          input.value = hours[day] || '';
        });
      }
    }

    // Populate account section
    var accountEmail = $('#account-email');
    var accountName = $('#account-contact-name');
    if (accountEmail && currentUser) accountEmail.textContent = currentUser.email || '—';
    if (accountName && customerData && customerData.customers) {
      accountName.textContent = customerData.customers.contact_name || business.name || '—';
    }
  }

  function renderBilling(subscription, customer) {
    var planLabel = 'Plan Mensual — AhoraTengoPagina';
    var priceLabel = '—';
    if (customer) {
      priceLabel = formatCurrency(customer.monthly_price, customer.currency);
    }

    // Dashboard stat card
    var planNameEl = $('#plan-name');
    if (planNameEl) planNameEl.textContent = planLabel;
    var planPriceEl = $('#plan-price');
    if (planPriceEl) planPriceEl.textContent = priceLabel;

    // Billing section
    var billingPlanNameEl = $('#billing-plan-name');
    if (billingPlanNameEl) billingPlanNameEl.textContent = planLabel;
    var billingPlanPriceEl = $('#billing-plan-price');
    if (billingPlanPriceEl) billingPlanPriceEl.textContent = priceLabel;

    // Billing status badge
    var billingBadge = $('#billing-status-badge');
    if (billingBadge && subscription) {
      var statusLabels = {
        active: 'Activa',
        past_due: 'Pago pendiente',
        cancelled: 'Cancelada',
        incomplete: 'Incompleta',
        trialing: 'Periodo de prueba'
      };
      var statusClasses = {
        active: 'c-badge--active',
        past_due: 'c-badge--past-due',
        cancelled: 'c-badge--cancelled',
        incomplete: 'c-badge--incomplete',
        trialing: 'c-badge--trialing'
      };
      billingBadge.textContent = statusLabels[subscription.status] || subscription.status;
      billingBadge.className = 'c-badge ' + (statusClasses[subscription.status] || '');
    } else if (billingBadge) {
      billingBadge.textContent = 'Sin suscripción';
      billingBadge.className = 'c-badge c-badge--incomplete';
    }

    // Billing date
    var billingDateEl = $('#billing-date');
    if (billingDateEl) {
      if (subscription && subscription.current_period_end) {
        billingDateEl.textContent = formatDate(subscription.current_period_end);
      } else {
        billingDateEl.textContent = '—';
      }
    }

    // Payment method
    var paymentMethodEl = $('#payment-method');
    if (paymentMethodEl) {
      paymentMethodEl.textContent = 'Administrado por Stripe';
    }

    // Update cancel button state
    var btnCancel = $('#btn-cancel-subscription');
    if (btnCancel && subscription) {
      if (subscription.status === 'cancelled') {
        btnCancel.disabled = true;
        btnCancel.textContent = 'Suscripción cancelada';
      } else if (subscription.cancel_at_period_end) {
        btnCancel.disabled = true;
        btnCancel.textContent = 'Cancelación programada';
      }
    }
  }

  function renderEditRequests(requests) {
    var tbody = $('#requests-table-body');
    if (!tbody) return;

    if (!requests || requests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="c-table-empty">No tienes solicitudes de edición aún.</td></tr>';
      return;
    }

    var typeLabels = {
      content_update: 'Contenido',
      photo_update: 'Fotos',
      contact_update: 'Contacto',
      hours_update: 'Horarios',
      menu_update: 'Menú',
      design_change: 'Diseño',
      other: 'Otro'
    };

    var statusLabels = {
      submitted: 'Enviada',
      processing: 'Procesando',
      in_review: 'En revisión',
      in_progress: 'En progreso',
      ready_for_review: 'Listo para revisar',
      completed: 'Completada',
      rejected: 'Rechazada',
      customer_rejected: 'Rechazado por ti'
    };

    var statusClasses = {
      submitted: 'c-badge--submitted',
      processing: 'c-badge--submitted',
      in_review: 'c-badge--in-review',
      in_progress: 'c-badge--in-progress',
      ready_for_review: 'c-badge--in-review',
      completed: 'c-badge--completed',
      rejected: 'c-badge--rejected',
      customer_rejected: 'c-badge--rejected'
    };

    var priorityLabels = {
      low: 'Baja',
      normal: 'Normal',
      high: 'Alta',
      urgent: 'Urgente'
    };

    var priorityClasses = {
      low: 'c-badge--low',
      normal: 'c-badge--normal',
      high: 'c-badge--high',
      urgent: 'c-badge--urgent'
    };

    var html = '';
    requests.forEach(function (req) {
      var typeLabel = typeLabels[req.request_type] || req.request_type;
      var statusLabel = statusLabels[req.status] || req.status;
      var statusClass = statusClasses[req.status] || '';
      var priorityLabel = priorityLabels[req.priority] || req.priority;
      var priorityClass = priorityClasses[req.priority] || '';

      html += '<tr>';
      html += '<td class="c-table-date">' + escapeHtml(formatDate(req.created_at)) + '</td>';
      html += '<td>' + escapeHtml(typeLabel) + '</td>';
      html += '<td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(req.description || '') + '</td>';
      html += '<td><span class="c-badge ' + priorityClass + '">' + escapeHtml(priorityLabel) + '</span></td>';
      html += '<td><span class="c-badge ' + statusClass + '">' + escapeHtml(statusLabel) + '</span>';
      if (req.status === 'ready_for_review') {
        html += ' <button class="c-btn-review-link" data-review-id="' + escapeHtml(req.id) + '">Revisar</button>';
      }
      html += '</td>';
      html += '</tr>';
    });

    tbody.innerHTML = html;

    // Bind "Revisar" links in the table
    var reviewLinks = tbody.querySelectorAll('.c-btn-review-link');
    reviewLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        var reviewId = link.getAttribute('data-review-id');
        if (reviewId) loadReviewSection(reviewId);
      });
    });
  }

  function renderInvoiceHistory() {
    // Placeholder — invoices are managed through Stripe
    // This section can be expanded later with Stripe API integration
  }

  // ── Analytics ──
  let analyticsCache = {};

  async function loadAnalytics(days) {
    if (!businessData || !businessData.id) return;

    var cacheKey = businessData.id + '_' + days;
    if (analyticsCache[cacheKey]) {
      renderAnalytics(analyticsCache[cacheKey]);
      return;
    }

    // Show loading state
    var chartEl = document.getElementById('analytics-chart');
    if (chartEl) chartEl.innerHTML = '<div class="c-analytics-chart-empty">' + t('analytics_loading') + '</div>';

    try {
      var res = await fetch('/api/analytics/stats?businessId=' + businessData.id + '&days=' + days);
      if (!res.ok) throw new Error('Failed');
      var data = await res.json();
      analyticsCache[cacheKey] = data;
      renderAnalytics(data);
    } catch (err) {
      console.error('Analytics load error:', err);
      if (chartEl) chartEl.innerHTML = '<div class="c-analytics-chart-empty">' + t('analytics_no_data') + '</div>';
    }
  }

  function renderAnalytics(data) {
    // Stats cards
    var viewsEl = document.getElementById('analytics-views');
    var uniqueEl = document.getElementById('analytics-unique');
    var callsEl = document.getElementById('analytics-calls');
    var directionsEl = document.getElementById('analytics-directions');
    var contactsEl = document.getElementById('analytics-contacts');

    if (viewsEl) viewsEl.textContent = (data.totals.page_views || 0).toLocaleString();
    if (uniqueEl) uniqueEl.textContent = (data.totals.unique_visitors || 0).toLocaleString() + ' ' + t('analytics_unique');
    if (callsEl) callsEl.textContent = (data.totals.phone_clicks || 0).toLocaleString();
    if (directionsEl) directionsEl.textContent = (data.totals.direction_clicks || 0).toLocaleString();
    if (contactsEl) {
      var contactTotal = (data.totals.email_clicks || 0) + (data.totals.social_clicks || 0) + (data.totals.form_submissions || 0);
      contactsEl.textContent = contactTotal.toLocaleString();
    }

    // Also update dashboard stat
    var statVisitors = document.getElementById('stat-visitors');
    if (statVisitors) statVisitors.textContent = (data.totals.page_views || 0).toLocaleString();

    // Chart
    renderChart(data.daily);

    // Referrers
    renderReferrers(data.topReferrers);

    // Devices
    renderDeviceBreakdown(data.deviceBreakdown);
  }

  function renderChart(daily) {
    var chartEl = document.getElementById('analytics-chart');
    if (!chartEl || !daily || daily.length === 0) {
      if (chartEl) chartEl.innerHTML = '<div class="c-analytics-chart-empty">' + t('analytics_no_data') + '</div>';
      return;
    }

    var maxViews = Math.max.apply(null, daily.map(function (d) { return d.page_views; }));
    if (maxViews === 0) maxViews = 1;

    var chartHeight = 200;
    var barWidth = Math.max(4, Math.min(20, Math.floor((chartEl.offsetWidth - 40) / daily.length) - 2));

    // Build SVG bar chart
    var svgWidth = daily.length * (barWidth + 2) + 40;
    var displayWidth = Math.max(svgWidth, chartEl.offsetWidth);

    var bars = '';
    var labels = '';
    var gridLines = '';

    // Grid lines (4 lines)
    for (var g = 0; g <= 4; g++) {
      var gy = chartHeight - (g / 4) * chartHeight;
      var gVal = Math.round((g / 4) * maxViews);
      gridLines += '<line x1="35" y1="' + gy + '" x2="' + displayWidth + '" y2="' + gy + '" stroke="var(--c-border, #2e3140)" stroke-width="1" stroke-dasharray="4,4"/>';
      gridLines += '<text x="30" y="' + (gy + 4) + '" text-anchor="end" fill="var(--c-text-muted, #8b8fa3)" font-size="10">' + gVal + '</text>';
    }

    for (var i = 0; i < daily.length; i++) {
      var d = daily[i];
      var barHeight = (d.page_views / maxViews) * chartHeight;
      var x = 40 + i * (barWidth + 2);
      var y = chartHeight - barHeight;

      bars += '<rect x="' + x + '" y="' + y + '" width="' + barWidth + '" height="' + barHeight +
        '" rx="2" fill="var(--c-accent, #7c5cfc)" opacity="0.85">' +
        '<title>' + d.date + ': ' + d.page_views + ' views</title></rect>';

      // Show date labels (every 7th day or first/last)
      if (i === 0 || i === daily.length - 1 || i % 7 === 0) {
        var dateParts = d.date.split('-');
        var labelText = dateParts[1] + '/' + dateParts[2];
        labels += '<text x="' + (x + barWidth / 2) + '" y="' + (chartHeight + 14) + '" text-anchor="middle" fill="var(--c-text-muted, #8b8fa3)" font-size="10">' + labelText + '</text>';
      }
    }

    chartEl.innerHTML = '<svg width="100%" height="' + (chartHeight + 24) + '" viewBox="0 0 ' + displayWidth + ' ' + (chartHeight + 24) + '" preserveAspectRatio="none" style="overflow:visible">' +
      gridLines + bars + labels + '</svg>';
  }

  function renderReferrers(referrers) {
    var el = document.getElementById('analytics-referrers');
    if (!el) return;

    if (!referrers || referrers.length === 0) {
      el.innerHTML = '<p class="c-text-muted">' + t('analytics_no_data') + '</p>';
      return;
    }

    var maxCount = referrers[0].count || 1;
    el.innerHTML = referrers.map(function (r) {
      var pct = Math.round((r.count / maxCount) * 100);
      var domain = r.domain || t('analytics_direct');
      return '<div class="c-referrer-row">' +
        '<div class="c-referrer-info">' +
          '<span class="c-referrer-domain">' + escapeHtml(domain) + '</span>' +
          '<span class="c-referrer-count">' + r.count + '</span>' +
        '</div>' +
        '<div class="c-referrer-bar"><div class="c-referrer-bar-fill" style="width:' + pct + '%"></div></div>' +
      '</div>';
    }).join('');
  }

  function renderDeviceBreakdown(breakdown) {
    var el = document.getElementById('analytics-devices');
    if (!el) return;

    if (!breakdown || (breakdown.desktop === 0 && breakdown.mobile === 0 && breakdown.tablet === 0)) {
      el.innerHTML = '<p class="c-text-muted">' + t('analytics_no_data') + '</p>';
      return;
    }

    var devices = [
      { key: 'desktop', label: t('analytics_desktop'), pct: breakdown.desktop || 0, icon: '🖥️' },
      { key: 'mobile', label: t('analytics_mobile'), pct: breakdown.mobile || 0, icon: '📱' },
      { key: 'tablet', label: t('analytics_tablet'), pct: breakdown.tablet || 0, icon: '📲' }
    ];

    el.innerHTML = devices.map(function (d) {
      return '<div class="c-device-row">' +
        '<div class="c-device-info">' +
          '<span class="c-device-icon">' + d.icon + '</span>' +
          '<span class="c-device-label">' + d.label + '</span>' +
          '<span class="c-device-pct">' + d.pct + '%</span>' +
        '</div>' +
        '<div class="c-device-bar"><div class="c-device-bar-fill c-device-bar-' + d.key + '" style="width:' + d.pct + '%"></div></div>' +
      '</div>';
    }).join('');
  }

  // ── Actions ──
  async function saveBusinessInfo(formData) {
    if (!businessData) {
      showToast('No se pudo identificar tu negocio.', 'error');
      return;
    }

    var btnSave = $('#btn-save-business');
    if (btnSave) {
      btnSave.disabled = true;
      btnSave.textContent = 'Guardando...';
    }

    try {
      var updateData = {
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address_full: formData.address_full.trim() || null,
        hours: formData.hours || null
      };

      var result = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', businessData.id);

      if (result.error) {
        throw result.error;
      }

      // Update local state
      businessData.phone = updateData.phone;
      businessData.email = updateData.email;
      businessData.address_full = updateData.address_full;
      businessData.hours = updateData.hours;

      showToast('Información actualizada correctamente.', 'success');
    } catch (err) {
      console.error('Save business info failed:', err);
      showToast('Error al guardar los cambios. Intenta de nuevo.', 'error');
    } finally {
      if (btnSave) {
        btnSave.disabled = false;
        btnSave.textContent = 'Guardar Cambios';
      }
    }
  }

  function pollEditRequestStatus(editRequestId, customerId, maxAttempts) {
    var attempts = 0;
    var interval = setInterval(async function () {
      attempts++;
      if (attempts >= maxAttempts) { clearInterval(interval); return; }
      try {
        var requests = await loadEditRequests(customerId);
        var found = requests.find(function (r) { return r.id === editRequestId; });
        if (found && found.status === 'ready_for_review') {
          clearInterval(interval);
          renderEditRequests(requests);
          checkPendingApprovals();
          showToast('¡Tu cambio está listo para revisar!', 'success');
        }
      } catch (err) {
        console.warn('Poll edit request status error:', err);
      }
    }, 5000);
  }

  async function submitEditRequest(type, description, priority) {
    if (!type) {
      showToast('Selecciona un tipo de solicitud.', 'warning');
      return;
    }

    if (!description || description.trim().length === 0) {
      showToast('Por favor describe los cambios que necesitas.', 'warning');
      return;
    }

    if (!customerData || !customerData.customers) {
      showToast('Error: no se pudo identificar tu cuenta.', 'error');
      return;
    }

    var btnSubmit = $('#btn-submit-request');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Enviando...';
    }

    try {
      var customer = customerData.customers;
      var requestData = {
        business_id: customer.business_id,
        customer_id: customer.id,
        website_id: websiteData ? websiteData.id : null,
        request_type: type,
        description: description.trim(),
        priority: priority || 'normal',
      };

      var response = await fetch('/api/edit-requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      var result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create edit request');
      }

      showToast('Solicitud enviada. Estamos aplicando el cambio automáticamente...', 'success');

      // Clear form
      var descField = $('#request-description');
      var typeField = $('#request-type');
      var priorityField = $('#request-priority');
      if (descField) descField.value = '';
      if (typeField) typeField.selectedIndex = 0;
      if (priorityField) priorityField.value = 'normal';

      // Reload edit requests
      var requests = await loadEditRequests(customer.id);
      renderEditRequests(requests);

      // Poll for AI auto-apply completion (every 5s, max 12 attempts = 60s)
      var editRequestId = result.editRequest ? result.editRequest.id : null;
      if (editRequestId) {
        pollEditRequestStatus(editRequestId, customer.id, 12);
      }
    } catch (err) {
      console.error('Submit edit request failed:', err);
      showToast('Error al enviar la solicitud. Intenta de nuevo.', 'error');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Enviar Solicitud';
      }
    }
  }

  async function openStripePortal() {
    if (!customerData || !customerData.customers || !customerData.customers.stripe_customer_id) {
      showToast('No se encontró tu información de facturación.', 'error');
      return;
    }

    var btnPortal = $('#btn-stripe-portal');
    if (btnPortal) {
      btnPortal.disabled = true;
      btnPortal.textContent = 'Redirigiendo...';
    }

    try {
      var response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerData.customers.stripe_customer_id,
          return_url: window.location.href
        })
      });

      if (!response.ok) {
        throw new Error('Server returned ' + response.status);
      }

      var data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err) {
      console.error('Stripe portal redirect failed:', err);
      showToast('Error al abrir el portal de facturación. Intenta de nuevo.', 'error');
    } finally {
      if (btnPortal) {
        btnPortal.disabled = false;
        btnPortal.textContent = 'Administrar Facturación';
      }
    }
  }

  async function cancelSubscription() {
    if (!subscriptionData) {
      showToast('No se encontró una suscripción activa.', 'error');
      return;
    }

    if (subscriptionData.status === 'cancelled') {
      showToast('Tu suscripción ya fue cancelada.', 'warning');
      return;
    }

    if (subscriptionData.cancel_at_period_end) {
      showToast('La cancelación ya está programada para el final de tu período actual.', 'warning');
      return;
    }

    // Multi-step confirmation
    var confirmed = window.confirm(
      '¿Estás seguro de que deseas cancelar tu suscripción?\n\n' +
      '• Tu sitio web se suspenderá al final del período de facturación actual.\n' +
      '• Tus datos se conservarán por 90 días.\n' +
      '• Puedes reactivar tu suscripción antes de que termine el período.'
    );

    if (!confirmed) return;

    var doubleConfirmed = window.confirm(
      'Confirma la cancelación:\n\n' +
      'Tu suscripción permanecerá activa hasta el ' +
      formatDate(subscriptionData.current_period_end) +
      ' y luego se cancelará automáticamente.'
    );

    if (!doubleConfirmed) return;

    var btnCancel = $('#btn-cancel-subscription');
    if (btnCancel) {
      btnCancel.disabled = true;
      btnCancel.textContent = 'Cancelando...';
    }

    try {
      // Use Stripe portal for cancellation (safest approach)
      await openStripePortal();
    } catch (err) {
      console.error('Cancel subscription failed:', err);
      showToast('Error al cancelar la suscripción. Intenta de nuevo o contacta al soporte.', 'error');
      if (btnCancel) {
        btnCancel.disabled = false;
        btnCancel.textContent = 'Cancelar Suscripción';
      }
    }
  }

  // ── Navigation ──
  function showSection(sectionId) {
    // Normalize — support both "dashboard" and "section-dashboard"
    var normalizedId = sectionId.replace(/^section-/, '');

    // Hide all sections
    var sections = $$('.c-section');
    sections.forEach(function (section) {
      section.style.display = 'none';
      section.classList.remove('active');
    });

    // Show target section
    var target = $('#section-' + normalizedId);
    if (target) {
      target.style.display = '';
      target.classList.add('active');
    }

    // Update active nav (both sidebar and mobile tabs)
    var navItems = $$('[data-section]');
    navItems.forEach(function (item) {
      if (item.getAttribute('data-section') === normalizedId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Load visual editor when section is shown
    if (normalizedId === 'editor') {
      initVisualEditor();
    }

    // Load analytics when section is shown
    if (normalizedId === 'analytics') {
      var rangeEl = document.getElementById('analytics-range');
      var days = rangeEl ? parseInt(rangeEl.value, 10) || 30 : 30;
      loadAnalytics(days);
    }

    // Load referrals when section is shown
    if (normalizedId === 'referrals') {
      loadReferralSection();
    }

    // Load scheduling when section is shown
    if (normalizedId === 'scheduling') {
      loadSchedulingSection();
    }

    // Load wizard when section is shown
    if (normalizedId === 'wizard') {
      loadWizardData();
    }
  }

  // ── Referral System ──

  var referralData = null;
  var referralHistoryLoaded = false;

  async function loadReferralSection() {
    if (!referralData) {
      await loadReferralCode();
    }
    if (!referralHistoryLoaded) {
      await loadReferralHistory();
    }
    bindReferralEvents();
  }

  async function loadReferralCode() {
    try {
      var session = await supabase.auth.getSession();
      var token = session.data.session ? session.data.session.access_token : null;
      if (!token) return;

      var res = await fetch('/api/referrals/get-code', {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      var data = await res.json();

      if (res.ok && data.code) {
        referralData = data;
        var codeEl = document.getElementById('referral-code');
        if (codeEl) codeEl.textContent = data.code;

        var sentEl = document.getElementById('ref-stat-sent');
        var convEl = document.getElementById('ref-stat-converted');
        var rewEl = document.getElementById('ref-stat-rewards');
        if (sentEl) sentEl.textContent = data.totalReferrals || 0;
        if (convEl) convEl.textContent = data.successfulReferrals || 0;
        if (rewEl) rewEl.textContent = data.totalRewards || 0;
      }
    } catch (err) {
      console.error('Load referral code error:', err);
    }
  }

  async function loadReferralHistory() {
    try {
      var session = await supabase.auth.getSession();
      var token = session.data.session ? session.data.session.access_token : null;
      if (!token) return;

      var res = await fetch('/api/referrals/list', {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      var data = await res.json();

      if (res.ok && data.referrals) {
        renderReferralHistory(data.referrals);
        referralHistoryLoaded = true;
      }
    } catch (err) {
      console.error('Load referral history error:', err);
    }
  }

  function renderReferralHistory(referrals) {
    var container = document.getElementById('referral-history');
    if (!container) return;

    if (!referrals || referrals.length === 0) {
      container.innerHTML = '<p class="c-text-muted c-referral-empty">Aun no tienes referidos. Comparte tu codigo por WhatsApp!</p>';
      return;
    }

    var statusLabels = {
      pending: 'Pendiente',
      contacted: 'Contactado',
      converted: 'Convertido',
      rewarded: 'Recompensado',
      expired: 'Expirado',
      rejected: 'Rechazado',
    };

    var rows = referrals.map(function (r) {
      var date = r.created_at ? new Date(r.created_at).toLocaleDateString('es') : '—';
      var status = r.status || 'pending';
      var label = statusLabels[status] || status;
      var reward = r.referrer_reward_status === 'applied' ? '1 mes gratis' : '—';

      return '<tr>' +
        '<td>' + escapeHtml(r.referred_business_name || '—') + '</td>' +
        '<td><span class="c-ref-badge c-ref-badge-' + status + '">' + escapeHtml(label) + '</span></td>' +
        '<td>' + date + '</td>' +
        '<td>' + reward + '</td>' +
        '</tr>';
    }).join('');

    container.innerHTML = '<table class="c-referral-table">' +
      '<thead><tr><th>Negocio</th><th>Estado</th><th>Fecha</th><th>Recompensa</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '</table>';
  }

  function bindReferralEvents() {
    var btnWa = document.getElementById('btn-share-wa');
    var btnCopy = document.getElementById('btn-copy-link');

    if (btnWa) {
      btnWa.onclick = function () {
        if (!referralData || !referralData.code) return;
        var link = 'https://ahoratengopagina.com/ref/' + referralData.code;
        var message = 'Hola! Te recomiendo AhoraTengoPagina para crear la pagina web de tu negocio. '
          + 'Yo ya tengo la mia y me ha ayudado mucho a conseguir mas clientes.\n\n'
          + 'Con mi codigo tienes 50% de descuento los primeros 2 meses.\n\n'
          + link;
        window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank');
      };
    }

    if (btnCopy) {
      btnCopy.onclick = function () {
        if (!referralData || !referralData.code) return;
        var link = 'https://ahoratengopagina.com/ref/' + referralData.code;
        navigator.clipboard.writeText(link).then(function () {
          showToast('Enlace copiado!', 'success');
        }).catch(function () {
          // Fallback
          var input = document.createElement('input');
          input.value = link;
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          document.body.removeChild(input);
          showToast('Enlace copiado!', 'success');
        });
      };
    }
  }

  function showLoginScreen() {
    var loginScreen = $('#login-screen');
    var resetScreen = $('#reset-screen');
    var newPasswordScreen = $('#new-password-screen');
    var dashboard = $('#dashboard');

    if (loginScreen) loginScreen.style.display = '';
    if (resetScreen) resetScreen.style.display = 'none';
    if (newPasswordScreen) newPasswordScreen.style.display = 'none';
    if (dashboard) dashboard.style.display = 'none';

    hideLoading();
  }

  function showResetScreen() {
    var loginScreen = $('#login-screen');
    var resetScreen = $('#reset-screen');

    if (loginScreen) loginScreen.style.display = 'none';
    if (resetScreen) resetScreen.style.display = '';
  }

  function showNewPasswordScreen() {
    var loginScreen = $('#login-screen');
    var resetScreen = $('#reset-screen');
    var newPasswordScreen = $('#new-password-screen');
    var dashboard = $('#dashboard');

    if (loginScreen) loginScreen.style.display = 'none';
    if (resetScreen) resetScreen.style.display = 'none';
    if (newPasswordScreen) newPasswordScreen.style.display = '';
    if (dashboard) dashboard.style.display = 'none';

    hideLoading();
  }

  function showDashboardScreen() {
    var loginScreen = $('#login-screen');
    var resetScreen = $('#reset-screen');
    var newPasswordScreen = $('#new-password-screen');
    var dashboard = $('#dashboard');

    if (loginScreen) loginScreen.style.display = 'none';
    if (resetScreen) resetScreen.style.display = 'none';
    if (newPasswordScreen) newPasswordScreen.style.display = 'none';
    if (dashboard) dashboard.style.display = '';
  }

  // ── UI Helpers ──
  function showLoading() {
    var overlay = $('#loading-overlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function hideLoading() {
    var overlay = $('#loading-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  function escapeHtml(str) {
    if (!str) return '';
    var text = String(str);
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      var date = new Date(dateStr);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return '—';
    }
  }

  function formatCurrency(amount, currency) {
    if (amount === null || amount === undefined) return '—';
    currency = currency || 'USD';
    try {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currency
      }).format(amount) + ' ' + currency;
    } catch (e) {
      return '$' + Number(amount).toFixed(2) + ' ' + currency;
    }
  }

  // ── Toast ──
  function showToast(message, type) {
    type = type || 'success';
    var container = $('#toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'c-toast-container';
      document.body.appendChild(container);
    }

    var toast = document.createElement('div');
    toast.className = 'c-toast c-toast--' + type;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto-dismiss after 4 seconds
    setTimeout(function () {
      toast.classList.add('c-toast--dismissing');
      setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }

  // ── Domain Management ──
  function renderDomainCard(website) {
    var card = $('#domain-card');
    if (!card) return;

    // Only show if website is published
    if (!website || website.status !== 'published') {
      card.style.display = 'none';
      return;
    }
    card.style.display = '';

    var stateNone = $('#domain-state-none');
    var statePending = $('#domain-state-pending');
    var stateVerified = $('#domain-state-verified');
    var stateFailed = $('#domain-state-failed');
    var badge = $('#domain-badge');

    // Hide all states
    if (stateNone) stateNone.style.display = 'none';
    if (statePending) statePending.style.display = 'none';
    if (stateVerified) stateVerified.style.display = 'none';
    if (stateFailed) stateFailed.style.display = 'none';
    if (badge) badge.style.display = 'none';

    if (!website.custom_domain) {
      // No domain
      if (stateNone) stateNone.style.display = '';
    } else if (website.domain_status === 'verified') {
      // Verified
      if (stateVerified) stateVerified.style.display = '';
      var verifiedName = $('#domain-verified-name');
      if (verifiedName) verifiedName.textContent = website.custom_domain;
      if (badge) {
        badge.style.display = '';
        badge.className = 'c-badge c-badge--active';
        badge.textContent = 'Verificado';
      }
    } else if (website.domain_status === 'failed') {
      // Failed
      if (stateFailed) stateFailed.style.display = '';
      if (badge) {
        badge.style.display = '';
        badge.className = 'c-badge c-badge--cancelled';
        badge.textContent = 'Error';
      }
    } else {
      // Pending
      if (statePending) statePending.style.display = '';
      var dnsName = $('#dns-name');
      if (dnsName) {
        dnsName.textContent = website.custom_domain.startsWith('www.') ? 'www' : '@';
      }
      if (badge) {
        badge.style.display = '';
        badge.className = 'c-badge c-badge--past-due';
        badge.textContent = 'Pendiente';
      }
    }

    // Bind domain events (re-bind each render)
    bindDomainEvents(website);
  }

  function bindDomainEvents(website) {
    var btnAdd = $('#btn-add-domain');
    var btnVerify = $('#btn-verify-domain');
    var btnRetry = $('#btn-retry-domain');
    var btnRemovePending = $('#btn-remove-domain-pending');
    var btnRemoveVerified = $('#btn-remove-domain-verified');
    var btnRemoveFailed = $('#btn-remove-domain-failed');

    // Clone and replace to remove old listeners
    function rebind(el, handler) {
      if (!el) return;
      var clone = el.cloneNode(true);
      el.parentNode.replaceChild(clone, el);
      clone.addEventListener('click', handler);
    }

    rebind(btnAdd, function () { addDomain(website); });
    rebind(btnVerify, function () { verifyDomain(website); });
    rebind(btnRetry, function () { verifyDomain(website); });
    rebind(btnRemovePending, function () { removeDomain(website); });
    rebind(btnRemoveVerified, function () { removeDomain(website); });
    rebind(btnRemoveFailed, function () { removeDomain(website); });
  }

  async function addDomain(website) {
    var input = $('#domain-input');
    var domain = input ? input.value.trim() : '';
    if (!domain) {
      showToast('Por favor ingresa un dominio.', 'warning');
      return;
    }

    var btn = $('#btn-add-domain');
    if (btn) { btn.disabled = true; btn.textContent = 'Conectando...'; }

    try {
      var response = await fetch('/api/domains/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: website.id, domain: domain })
      });
      var data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al conectar dominio');
      }

      // Update local state
      website.custom_domain = data.domain;
      website.domain_status = 'pending_verification';
      websiteData = website;

      showToast('Dominio agregado. Configura tu DNS para verificarlo.', 'success');
      renderDomainCard(website);
    } catch (err) {
      console.error('Add domain error:', err);
      showToast(err.message || 'Error al conectar dominio.', 'error');
    } finally {
      // Re-query button since renderDomainCard may have replaced it
      var newBtn = $('#btn-add-domain');
      if (newBtn) { newBtn.disabled = false; newBtn.textContent = 'Conectar'; }
    }
  }

  async function verifyDomain(website) {
    var btn = $('#btn-verify-domain') || $('#btn-retry-domain');
    if (btn) { btn.disabled = true; btn.textContent = 'Verificando...'; }

    try {
      var response = await fetch('/api/domains/verify?websiteId=' + encodeURIComponent(website.id));
      var data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar');
      }

      website.domain_status = data.status;
      websiteData = website;

      if (data.verified) {
        showToast('Dominio verificado correctamente.', 'success');
        // Update hero URL
        renderDashboard(businessData, website, subscriptionData);
      } else {
        showToast('El dominio aún no está verificado. Revisa tu configuración DNS.', 'warning');
      }
      renderDomainCard(website);
    } catch (err) {
      console.error('Verify domain error:', err);
      showToast('Error al verificar el dominio.', 'error');
    }
  }

  async function removeDomain(website) {
    if (!window.confirm('¿Desconectar el dominio ' + (website.custom_domain || '') + '?')) return;

    try {
      var response = await fetch('/api/domains/remove?websiteId=' + encodeURIComponent(website.id), {
        method: 'DELETE'
      });
      var data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al desconectar');
      }

      website.custom_domain = null;
      website.domain_status = null;
      website.domain_verified_at = null;
      websiteData = website;

      showToast('Dominio desconectado.', 'success');
      renderDomainCard(website);
      // Update hero URL back to default
      renderDashboard(businessData, website, subscriptionData);
    } catch (err) {
      console.error('Remove domain error:', err);
      showToast('Error al desconectar el dominio.', 'error');
    }
  }

  // ── Team Management ──
  var teamMembers = [];

  async function loadTeamMembers() {
    try {
      var session = await supabase.auth.getSession();
      var token = session.data.session ? session.data.session.access_token : null;
      if (!token) return [];

      var response = await fetch('/api/customers/team', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!response.ok) {
        console.error('Load team failed:', response.status);
        return [];
      }
      return await response.json();
    } catch (err) {
      console.error('Load team error:', err);
      return [];
    }
  }

  function renderTeamTable(members) {
    var tbody = $('#team-table-body');
    if (!tbody) return;

    teamMembers = members;

    if (!members || members.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="c-table-empty">No hay miembros en tu equipo.</td></tr>';
      return;
    }

    var roleLabels = { owner: 'Propietario', manager: 'Gerente', employee: 'Empleado' };
    var roleClasses = { owner: 'c-badge--owner', manager: 'c-badge--manager', employee: 'c-badge--employee' };
    var isOwner = customerData && customerData.role === 'owner';

    var html = '';
    members.forEach(function (m) {
      var roleLabel = roleLabels[m.role] || m.role;
      var roleClass = roleClasses[m.role] || '';
      var statusLabel = m.is_active === false ? 'Inactivo' : (m.joined_at ? 'Activo' : 'Pendiente');
      var statusClass = m.is_active === false ? 'c-badge--inactive' : (m.joined_at ? 'c-badge--active' : 'c-badge--incomplete');

      html += '<tr>';
      html += '<td>' + escapeHtml(m.display_name || '—') + '</td>';
      html += '<td>' + escapeHtml(m.email || '—') + '</td>';
      html += '<td><span class="c-badge ' + roleClass + '">' + escapeHtml(roleLabel) + '</span></td>';
      html += '<td><span class="c-badge ' + statusClass + '">' + escapeHtml(statusLabel) + '</span></td>';
      html += '<td>';
      if (isOwner && m.role !== 'owner') {
        if (m.is_active === false) {
          html += '<button class="c-btn-toggle" data-member-id="' + escapeHtml(m.id) + '" data-action="activate">Activar</button>';
        } else {
          html += '<button class="c-btn-toggle" data-member-id="' + escapeHtml(m.id) + '" data-action="deactivate">Desactivar</button>';
          if (!m.joined_at) {
            html += ' <button class="c-btn-toggle" data-member-id="' + escapeHtml(m.id) + '" data-action="resend" style="margin-left:4px;">Reenviar</button>';
          }
        }
      } else {
        html += '<span style="color:var(--c-text-dim);font-size:12px;">—</span>';
      }
      html += '</td>';
      html += '</tr>';
    });

    tbody.innerHTML = html;

    // Bind toggle buttons
    tbody.querySelectorAll('.c-btn-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var memberId = btn.getAttribute('data-member-id');
        var action = btn.getAttribute('data-action');
        if (action === 'resend') {
          resendTeamInvite(memberId, btn);
        } else {
          toggleTeamMember(memberId, action === 'activate');
        }
      });
    });
  }

  async function inviteTeamMember(email, displayName, role) {
    if (!email) {
      showToast('Ingresa un correo electrónico.', 'warning');
      return;
    }

    var btnInvite = $('#btn-invite-team');
    if (btnInvite) {
      btnInvite.disabled = true;
      btnInvite.textContent = 'Enviando...';
    }

    try {
      var session = await supabase.auth.getSession();
      var token = session.data.session ? session.data.session.access_token : null;
      if (!token) throw new Error('No session');

      var response = await fetch('/api/customers/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({
          email: email.trim(),
          display_name: displayName ? displayName.trim() : null,
          role: role || 'employee',
        }),
      });

      var data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar invitación');
      }

      showToast('Invitación enviada a ' + escapeHtml(email) + '.', 'success');

      // Clear form
      var emailField = $('#team-invite-email');
      var nameField = $('#team-invite-name');
      var roleField = $('#team-invite-role');
      if (emailField) emailField.value = '';
      if (nameField) nameField.value = '';
      if (roleField) roleField.value = 'employee';

      // Reload team
      var members = await loadTeamMembers();
      renderTeamTable(members);
    } catch (err) {
      console.error('Invite team member error:', err);
      showToast(err.message || 'Error al enviar la invitación.', 'error');
    } finally {
      if (btnInvite) {
        btnInvite.disabled = false;
        btnInvite.textContent = 'Enviar Invitación';
      }
    }
  }

  async function toggleTeamMember(memberId, activate) {
    try {
      var session = await supabase.auth.getSession();
      var token = session.data.session ? session.data.session.access_token : null;
      if (!token) throw new Error('No session');

      var response = await fetch('/api/customers/team', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({
          member_id: memberId,
          is_active: activate,
        }),
      });

      var data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar');
      }

      showToast(activate ? 'Miembro activado.' : 'Miembro desactivado.', 'success');

      // Reload team
      var members = await loadTeamMembers();
      renderTeamTable(members);
    } catch (err) {
      console.error('Toggle team member error:', err);
      showToast(err.message || 'Error al actualizar miembro.', 'error');
    }
  }

  async function resendTeamInvite(memberId, btn) {
    var member = teamMembers.find(function (m) { return m.id === memberId; });
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
      var session = await supabase.auth.getSession();
      var token = session.data.session ? session.data.session.access_token : null;
      if (!token) throw new Error('No session');

      var response = await fetch('/api/customers/resend-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ member_id: memberId }),
      });

      var data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al reenviar');
      }

      showToast('Invitación reenviada a ' + escapeHtml(member ? member.email : '') + '.', 'success');
    } catch (err) {
      console.error('Resend team invite error:', err);
      showToast(err.message || 'Error al reenviar la invitación.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  function setupTeamSection() {
    // Show invite panel only for owners
    var invitePanel = $('#team-invite-panel');
    if (invitePanel && customerData && customerData.role === 'owner') {
      invitePanel.style.display = '';
    }

    // Bind invite form
    var teamForm = $('#team-invite-form');
    if (teamForm) {
      teamForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = ($('#team-invite-email') || {}).value || '';
        var name = ($('#team-invite-name') || {}).value || '';
        var role = ($('#team-invite-role') || {}).value || 'employee';
        inviteTeamMember(email, name, role);
      });
    }
  }

  // ── Visual Editor ──
  var editorLoaded = false;
  var selectedElement = null;
  var chatMessages = [];
  var pendingEditRequest = null;
  var chatStreaming = false;

  function initVisualEditor() {
    var noWebsite = $('#editor-no-website');
    var editorMain = $('#editor-main');

    if (!websiteData || !websiteData.id) {
      if (noWebsite) noWebsite.style.display = '';
      if (editorMain) editorMain.style.display = 'none';
      return;
    }

    if (noWebsite) noWebsite.style.display = 'none';
    if (editorMain) editorMain.style.display = '';

    if (!editorLoaded) {
      editorLoaded = true;
      bindEditorEvents();
      loadEditorPreview();
    }
  }

  function bindEditorEvents() {
    // Device toggle
    var btnDesktop = $('#btn-editor-desktop');
    var btnMobile = $('#btn-editor-mobile');
    if (btnDesktop) btnDesktop.addEventListener('click', function () {
      setEditorDevice('desktop');
    });
    if (btnMobile) btnMobile.addEventListener('click', function () {
      setEditorDevice('mobile');
    });

    // Reload button
    var btnReload = $('#btn-editor-reload');
    if (btnReload) btnReload.addEventListener('click', function () {
      editorLoaded = false;
      loadEditorPreview();
      editorLoaded = true;
    });

    // Clear pin
    var btnClearPin = $('#btn-clear-pin');
    if (btnClearPin) btnClearPin.addEventListener('click', clearSelectedElement);

    // Chat form
    var chatForm = $('#editor-chat-form');
    if (chatForm) chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#editor-chat-input');
      if (!input) return;
      var text = input.value.trim();
      if (!text || chatStreaming) return;
      input.value = '';
      sendChatMessage(text);
    });

    // Chat input — submit on Enter (Shift+Enter for newline)
    var chatInput = $('#editor-chat-input');
    if (chatInput) chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        var form = $('#editor-chat-form');
        if (form) form.dispatchEvent(new Event('submit'));
      }
    });

    // Chat reset
    var btnChatReset = $('#btn-chat-reset');
    if (btnChatReset) btnChatReset.addEventListener('click', resetChat);

    // Listen for postMessage from iframe
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'element-selected') {
        handleElementSelected(e.data);
      }
    });
  }

  function setEditorDevice(mode) {
    var btnDesktop = $('#btn-editor-desktop');
    var btnMobile = $('#btn-editor-mobile');
    var iframeWrap = $('#editor-iframe-wrap');

    if (mode === 'mobile') {
      if (btnDesktop) btnDesktop.classList.remove('active');
      if (btnMobile) btnMobile.classList.add('active');
      if (iframeWrap) iframeWrap.classList.add('c-editor-mobile');
    } else {
      if (btnDesktop) btnDesktop.classList.add('active');
      if (btnMobile) btnMobile.classList.remove('active');
      if (iframeWrap) iframeWrap.classList.remove('c-editor-mobile');
    }
  }

  function loadEditorPreview() {
    var iframe = $('#editor-iframe');
    var loading = $('#editor-loading');
    if (!iframe || !websiteData) return;

    if (loading) loading.style.display = 'flex';
    clearSelectedElement();

    fetch('/api/preview/website?id=' + encodeURIComponent(websiteData.id))
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.html) {
          if (loading) loading.innerHTML = '<span style="color:var(--c-accent3);">No se pudo cargar la página.</span>';
          return;
        }
        var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(data.html);
        iframeDoc.close();

        // Wait for content to render, then inject edit bridge
        setTimeout(function () {
          injectEditBridge(iframeDoc);
          if (loading) loading.style.display = 'none';
        }, 500);
      })
      .catch(function (err) {
        console.error('Editor preview load error:', err);
        if (loading) loading.innerHTML = '<span style="color:var(--c-accent3);">Error al cargar la página.</span>';
      });
  }

  function injectEditBridge(iframeDoc) {
    var script = iframeDoc.createElement('script');
    script.textContent = [
      '(function() {',
      '  var selectedEl = null;',
      '  var hoverEl = null;',
      '',
      '  // Highlight on hover',
      '  document.addEventListener("mouseover", function(e) {',
      '    if (e.target === document.body || e.target === document.documentElement) return;',
      '    if (hoverEl && hoverEl !== selectedEl) {',
      '      hoverEl.style.outline = "";',
      '      hoverEl.style.outlineOffset = "";',
      '    }',
      '    hoverEl = e.target;',
      '    if (hoverEl !== selectedEl) {',
      '      hoverEl.style.outline = "2px dashed rgba(108, 92, 231, 0.6)";',
      '      hoverEl.style.outlineOffset = "2px";',
      '    }',
      '  }, true);',
      '',
      '  document.addEventListener("mouseout", function(e) {',
      '    if (e.target !== selectedEl) {',
      '      e.target.style.outline = "";',
      '      e.target.style.outlineOffset = "";',
      '    }',
      '  }, true);',
      '',
      '  // Click to select',
      '  document.addEventListener("click", function(e) {',
      '    e.preventDefault();',
      '    e.stopPropagation();',
      '    var el = e.target;',
      '    if (el === document.body || el === document.documentElement) return;',
      '',
      '    // Clear previous selection',
      '    if (selectedEl) {',
      '      selectedEl.style.outline = "";',
      '      selectedEl.style.outlineOffset = "";',
      '    }',
      '',
      '    selectedEl = el;',
      '    selectedEl.style.outline = "2px solid #6C5CE7";',
      '    selectedEl.style.outlineOffset = "2px";',
      '',
      '    var rect = el.getBoundingClientRect();',
      '    window.parent.postMessage({',
      '      type: "element-selected",',
      '      tagName: el.tagName,',
      '      text: el.textContent ? el.textContent.substring(0, 300) : "",',
      '      src: el.src || el.getAttribute("src") || "",',
      '      href: el.href || "",',
      '      className: el.className || "",',
      '      elId: el.id || "",',
      '      selector: buildSelector(el),',
      '      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },',
      '      iframeScrollY: window.scrollY || 0,',
      '      elementType: classifyElement(el)',
      '    }, "*");',
      '  }, true);',
      '',
      '  function buildSelector(el) {',
      '    if (el.id) return "#" + el.id;',
      '    if (el.dataset && el.dataset.section) return "[data-section=\\"" + el.dataset.section + "\\"]";',
      '    var path = [];',
      '    var current = el;',
      '    while (current && current.nodeType === 1 && current !== document.documentElement) {',
      '      var tag = current.tagName.toLowerCase();',
      '      if (current.id) { path.unshift("#" + current.id); break; }',
      '      var idx = 1;',
      '      var sib = current.previousElementSibling;',
      '      while (sib) { if (sib.tagName === current.tagName) idx++; sib = sib.previousElementSibling; }',
      '      path.unshift(tag + ":nth-of-type(" + idx + ")");',
      '      current = current.parentElement;',
      '    }',
      '    return path.join(" > ");',
      '  }',
      '',
      '  function classifyElement(el) {',
      '    var tag = el.tagName.toLowerCase();',
      '    if (tag === "img") return "image";',
      '    if (tag === "a" || tag === "button") return "button";',
      '    if (["h1","h2","h3","h4","h5","h6"].indexOf(tag) >= 0) return "heading";',
      '    if (tag === "p" || tag === "span" || tag === "li") return "text";',
      '    if (tag === "section" || tag === "div" || tag === "header" || tag === "footer" || tag === "nav") return "section";',
      '    return "element";',
      '  }',
      '})();',
    ].join('\n');
    iframeDoc.body.appendChild(script);

    // Also inject a style to change cursor
    var style = iframeDoc.createElement('style');
    style.textContent = '* { cursor: crosshair !important; } a, button { pointer-events: auto !important; }';
    iframeDoc.head.appendChild(style);
  }

  function handleElementSelected(data) {
    selectedElement = data;

    // Show pin marker on iframe
    showEditorPin(data);

    // Show element info card
    var pinInfo = $('#editor-pin-info');
    var pinDetails = $('#editor-pin-details');
    if (pinInfo) pinInfo.style.display = '';

    if (pinDetails) {
      var typeLabels = {
        heading: 'Título', text: 'Texto', image: 'Imagen',
        button: 'Botón', section: 'Sección', element: 'Elemento'
      };
      var typeLabel = typeLabels[data.elementType] || 'Elemento';
      var contentPreview = '';

      if (data.elementType === 'image' && data.src) {
        contentPreview = '<img src="' + escapeHtml(data.src) + '" style="max-width:100%;max-height:60px;border-radius:6px;margin-top:6px;" alt="preview">';
      } else if (data.text) {
        contentPreview = '<div class="c-pin-content">' + escapeHtml(data.text.substring(0, 150)) + '</div>';
      }

      pinDetails.innerHTML =
        '<div class="c-pin-type">' + escapeHtml(data.tagName) + ' — ' + typeLabel + '</div>' +
        contentPreview;
    }

    // Focus chat input
    var chatInput = $('#editor-chat-input');
    if (chatInput) chatInput.focus();
  }

  function showEditorPin(data) {
    var pin = $('#editor-pin');
    var iframeWrap = $('#editor-iframe-wrap');
    if (!pin || !iframeWrap || !data.rect) return;

    var iframe = $('#editor-iframe');
    if (!iframe) return;

    var iframeRect = iframe.getBoundingClientRect();
    var wrapRect = iframeWrap.getBoundingClientRect();

    // Position pin relative to iframe wrapper
    var pinLeft = (data.rect.left + data.rect.width / 2);
    var pinTop = (data.rect.top + data.rect.height / 2) - (data.iframeScrollY || 0);

    // Clamp to iframe bounds
    pinLeft = Math.max(10, Math.min(pinLeft, iframeRect.width - 10));
    pinTop = Math.max(10, Math.min(pinTop, iframeRect.height - 10));

    pin.style.left = pinLeft + 'px';
    pin.style.top = pinTop + 'px';
    pin.style.display = '';
  }

  function clearSelectedElement() {
    selectedElement = null;
    var pin = $('#editor-pin');
    if (pin) pin.style.display = 'none';
    var pinInfo = $('#editor-pin-info');
    if (pinInfo) pinInfo.style.display = 'none';
  }

  // ── AI Chat ──
  function appendChatMessage(role, content, isHtml) {
    var container = $('#editor-chat-messages');
    if (!container) return;

    var div = document.createElement('div');
    div.className = 'c-chat-message c-chat-message--' + role;

    var avatar = document.createElement('div');
    avatar.className = 'c-chat-avatar';
    avatar.textContent = role === 'ai' ? '🤖' : '👤';

    var bubble = document.createElement('div');
    bubble.className = 'c-chat-bubble';
    if (isHtml) {
      bubble.innerHTML = content;
    } else {
      bubble.textContent = content;
    }

    div.appendChild(avatar);
    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    return bubble;
  }

  function showTypingIndicator() {
    var container = $('#editor-chat-messages');
    if (!container) return null;

    var div = document.createElement('div');
    div.className = 'c-chat-message c-chat-message--ai';
    div.id = 'chat-typing';

    var avatar = document.createElement('div');
    avatar.className = 'c-chat-avatar';
    avatar.textContent = '🤖';

    var bubble = document.createElement('div');
    bubble.className = 'c-chat-bubble c-chat-typing';
    bubble.innerHTML = '<div class="c-chat-typing-dot"></div><div class="c-chat-typing-dot"></div><div class="c-chat-typing-dot"></div>';

    div.appendChild(avatar);
    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    return div;
  }

  function removeTypingIndicator() {
    var typing = $('#chat-typing');
    if (typing && typing.parentNode) {
      typing.parentNode.removeChild(typing);
    }
  }

  function sendChatMessage(text) {
    chatMessages.push({ role: 'user', content: text });
    appendChatMessage('user', text);
    chatStreaming = true;

    var btnSend = $('#btn-chat-send');
    if (btnSend) btnSend.disabled = true;

    var typingEl = showTypingIndicator();

    var body = {
      messages: chatMessages,
      elementContext: selectedElement ? {
        elementType: selectedElement.elementType,
        selector: selectedElement.selector,
        currentValue: selectedElement.text || selectedElement.src || '',
        tagName: selectedElement.tagName
      } : null,
      businessName: businessData ? businessData.name : '',
      websiteId: websiteData ? websiteData.id : null,
    };

    fetch('/api/ai/edit-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    .then(function (res) {
      if (!res.ok) {
        throw new Error('Error del servidor: ' + res.status);
      }
      return parseSSEStream(res);
    })
    .catch(function (err) {
      console.error('Chat send error:', err);
      removeTypingIndicator();
      appendChatMessage('ai', 'Lo siento, hubo un error. Intenta de nuevo.');
      chatStreaming = false;
      if (btnSend) btnSend.disabled = false;
    });
  }

  function parseSSEStream(response) {
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    var assistantText = '';
    var toolUseData = null;
    var toolInputBuffer = '';
    var inToolInput = false;
    var bubble = null;
    var btnSend = $('#btn-chat-send');

    function processLine(line) {
      if (!line.startsWith('data: ')) return;
      var jsonStr = line.substring(6).trim();
      if (jsonStr === '[DONE]') return;

      try {
        var event = JSON.parse(jsonStr);

        if (event.type === 'content_block_start') {
          if (event.content_block && event.content_block.type === 'tool_use') {
            inToolInput = true;
            toolUseData = {
              name: event.content_block.name,
              id: event.content_block.id,
            };
            toolInputBuffer = '';
          } else if (event.content_block && event.content_block.type === 'text') {
            // Starting text block — remove typing, create bubble
            removeTypingIndicator();
            bubble = appendChatMessage('ai', '');
          }
        }

        if (event.type === 'content_block_delta') {
          if (event.delta && event.delta.type === 'text_delta' && event.delta.text) {
            assistantText += event.delta.text;
            if (bubble) bubble.textContent = assistantText;
            var container = $('#editor-chat-messages');
            if (container) container.scrollTop = container.scrollHeight;
          }
          if (event.delta && event.delta.type === 'input_json_delta' && event.delta.partial_json) {
            toolInputBuffer += event.delta.partial_json;
          }
        }

        if (event.type === 'content_block_stop') {
          if (inToolInput && toolUseData) {
            inToolInput = false;
            try {
              var toolInput = JSON.parse(toolInputBuffer);
              toolUseData.input = toolInput;
              handleToolUse(toolUseData);
            } catch (parseErr) {
              console.error('Tool input parse error:', parseErr);
            }
            toolUseData = null;
            toolInputBuffer = '';
          }
        }

        if (event.type === 'message_stop') {
          if (assistantText) {
            chatMessages.push({ role: 'assistant', content: assistantText });
          }
          removeTypingIndicator();
          chatStreaming = false;
          if (btnSend) btnSend.disabled = false;
        }
      } catch (e) {
        // Skip unparseable lines
      }
    }

    function pump() {
      return reader.read().then(function (result) {
        if (result.done) {
          // Process remaining buffer
          if (buffer) {
            buffer.split('\n').forEach(processLine);
          }
          removeTypingIndicator();
          chatStreaming = false;
          if (btnSend) btnSend.disabled = false;
          return;
        }

        buffer += decoder.decode(result.value, { stream: true });
        var lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        lines.forEach(processLine);
        return pump();
      });
    }

    return pump();
  }

  function handleToolUse(toolData) {
    if (toolData.name === 'submit_edit_request' && toolData.input) {
      pendingEditRequest = toolData.input;
      showConfirmationCard(toolData.input);
    }
  }

  function showConfirmationCard(data) {
    var typeLabels = {
      content_update: 'Actualizar contenido',
      photo_update: 'Actualizar fotos',
      contact_update: 'Actualizar contacto',
      hours_update: 'Actualizar horario',
      menu_update: 'Actualizar menú',
      design_change: 'Cambio de diseño',
      other: 'Otro',
    };

    var html = '<div class="c-editor-confirm-card">' +
      '<div class="c-confirm-title">Confirmar solicitud</div>' +
      '<div class="c-confirm-row"><span>Tipo:</span> <span>' + escapeHtml(typeLabels[data.request_type] || data.request_type) + '</span></div>' +
      '<div class="c-confirm-row"><span>Cambio:</span> <span>' + escapeHtml(data.description || '') + '</span></div>' +
      '<div class="c-confirm-row"><span>Prioridad:</span> <span>' + escapeHtml(data.priority || 'normal') + '</span></div>' +
      '<div class="c-confirm-actions">' +
        '<button type="button" class="c-btn c-btn-primary" id="btn-confirm-edit">Confirmar</button>' +
        '<button type="button" class="c-btn c-btn-ghost" id="btn-cancel-edit">Cancelar</button>' +
      '</div>' +
    '</div>';

    removeTypingIndicator();
    var container = $('#editor-chat-messages');
    if (!container) return;

    var div = document.createElement('div');
    div.innerHTML = html;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    // Bind confirm/cancel
    var btnConfirm = $('#btn-confirm-edit');
    var btnCancel = $('#btn-cancel-edit');

    if (btnConfirm) btnConfirm.addEventListener('click', function () {
      confirmEditFromChat();
    });
    if (btnCancel) btnCancel.addEventListener('click', function () {
      cancelEditFromChat();
      div.parentNode.removeChild(div);
      appendChatMessage('ai', 'Solicitud cancelada. ¿En qué más te puedo ayudar?');
    });
  }

  function confirmEditFromChat() {
    if (!pendingEditRequest || !customerData || !customerData.customers) {
      showToast('Error: no se pudo enviar la solicitud.', 'error');
      return;
    }

    var customer = customerData.customers;
    var requestData = {
      business_id: customer.business_id,
      customer_id: customer.id,
      website_id: websiteData ? websiteData.id : null,
      request_type: pendingEditRequest.request_type || 'other',
      description: pendingEditRequest.description || '',
      priority: pendingEditRequest.priority || 'normal',
      element_type: pendingEditRequest.element_type || (selectedElement ? selectedElement.elementType : null),
      element_selector: pendingEditRequest.element_selector || (selectedElement ? selectedElement.selector : null),
      current_value: pendingEditRequest.current_value || (selectedElement ? (selectedElement.text || selectedElement.src || '') : null),
      ai_conversation: chatMessages.length > 0 ? chatMessages : null,
    };

    // Step 1: Create the edit request
    fetch('/api/edit-requests/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    })
    .then(function (res) { return res.json(); })
    .then(function (result) {
      if (!result.success) throw new Error(result.error || 'Error');

      var editRequestId = result.editRequest ? result.editRequest.id : null;
      pendingEditRequest = null;
      clearSelectedElement();

      // Show processing message — server handles AI apply automatically
      appendChatMessage('ai', 'Estamos aplicando tu cambio... esto puede tomar unos segundos.');

      if (!editRequestId) {
        appendChatMessage('ai', '¡Solicitud enviada! Nuestro equipo la revisará pronto.');
        return;
      }

      // Poll for AI auto-apply completion (every 5s, max 12 attempts = 60s)
      var customerId = customerData && customerData.customers ? customerData.customers.id : null;
      if (customerId) {
        var chatPollAttempts = 0;
        var chatPollInterval = setInterval(async function () {
          chatPollAttempts++;
          if (chatPollAttempts >= 12) { clearInterval(chatPollInterval); return; }
          try {
            var requests = await loadEditRequests(customerId);
            var found = requests.find(function (r) { return r.id === editRequestId; });
            if (found && found.status === 'ready_for_review') {
              clearInterval(chatPollInterval);
              appendChatMessage('ai', '¡Cambio aplicado! Te enviamos un correo para que lo revises. También puedes revisarlo desde tu Dashboard.');
              checkPendingApprovals();
            }
          } catch (pollErr) {
            console.warn('Chat poll error:', pollErr);
          }
        }, 5000);
      }
    })
    .catch(function (err) {
      console.error('Confirm edit request error:', err);
      showToast('Error al enviar la solicitud. Intenta de nuevo.', 'error');
    });
  }

  function cancelEditFromChat() {
    pendingEditRequest = null;
  }

  function resetChat() {
    chatMessages = [];
    selectedElement = null;
    pendingEditRequest = null;
    chatStreaming = false;

    var container = $('#editor-chat-messages');
    if (container) {
      container.innerHTML = '';
      appendChatMessage('ai', '¡Hola! Soy tu asistente de edición. Haz clic en cualquier elemento de tu página y dime qué cambio quieres hacer.');
    }

    clearSelectedElement();

    var btnSend = $('#btn-chat-send');
    if (btnSend) btnSend.disabled = false;
  }

  // ── Review Changes ──

  function checkPendingApprovals() {
    if (!customerData || !customerData.customers) return;

    var customerId = customerData.customers.id;
    fetch('/api/edit-requests/pending?customer_id=' + encodeURIComponent(customerId))
      .then(function (res) { return res.json(); })
      .then(function (result) {
        var banner = $('#c-approval-banner');
        if (!banner) return;

        if (result.count && result.count > 0) {
          banner.style.display = '';
          var desc = $('#c-approval-banner-desc');
          if (desc) {
            desc.textContent = result.count === 1
              ? 'Tienes 1 cambio pendiente de revisión.'
              : 'Tienes ' + result.count + ' cambios pendientes de revisión.';
          }
          // Store the first pending edit request ID for the banner button
          pendingReviewEditRequestId = result.editRequests[0].id;
        } else {
          banner.style.display = 'none';
          pendingReviewEditRequestId = null;
        }
      })
      .catch(function (err) {
        console.warn('Check pending approvals error:', err);
      });
  }

  function loadReviewSection(editRequestId) {
    showSection('review');

    var summaryEl = $('#review-summary');
    var promptEl = $('#review-prompt');
    var iframe = $('#review-iframe');
    var rejectForm = $('#review-reject-form');
    if (rejectForm) rejectForm.style.display = 'none';

    if (summaryEl) summaryEl.textContent = 'Cargando...';
    if (promptEl) promptEl.textContent = '';

    // Reset toggle to "after" view
    var btnAfter = $('#btn-review-after');
    var btnBefore = $('#btn-review-before');
    if (btnAfter) btnAfter.classList.add('active');
    if (btnBefore) btnBefore.classList.remove('active');

    // Store the current review edit request ID
    pendingReviewEditRequestId = editRequestId;

    // Fetch edit request details and draft HTML in parallel
    Promise.all([
      fetch('/api/edit-requests/detail?id=' + encodeURIComponent(editRequestId)).then(function (r) { return r.json(); }),
      null // We'll get website_id from the detail response
    ]).then(function (results) {
      var detailResult = results[0];
      if (!detailResult.editRequest) {
        showToast('No se encontró la solicitud de cambio.', 'error');
        showSection('dashboard');
        return;
      }

      var er = detailResult.editRequest;
      if (summaryEl) summaryEl.textContent = er.ai_edit_summary || 'Cambio aplicado por IA';
      if (promptEl) promptEl.textContent = er.description || '';

      // Fetch draft HTML
      if (er.website_id) {
        return fetch('/api/preview/draft?website_id=' + encodeURIComponent(er.website_id))
          .then(function (r) { return r.json(); });
      }
      return null;
    }).then(function (previewResult) {
      if (!previewResult) return;

      reviewDraftHtml = previewResult.draftHtml || null;
      reviewCurrentHtml = previewResult.currentHtml || null;

      // Show draft (after) by default
      if (iframe && reviewDraftHtml) {
        iframe.srcdoc = reviewDraftHtml;
      } else if (iframe) {
        iframe.srcdoc = '<p style="text-align:center;padding:40px;color:#666;">No hay vista previa disponible.</p>';
      }
    }).catch(function (err) {
      console.error('Load review section error:', err);
      showToast('Error al cargar la revisión.', 'error');
    });
  }

  function showReviewVersion(version) {
    var iframe = $('#review-iframe');
    if (!iframe) return;

    if (version === 'before' && reviewCurrentHtml) {
      iframe.srcdoc = reviewCurrentHtml;
    } else if (version === 'after' && reviewDraftHtml) {
      iframe.srcdoc = reviewDraftHtml;
    }
  }

  function approveChange() {
    if (!pendingReviewEditRequestId) return;

    var btnApprove = $('#btn-approve-change');
    if (btnApprove) {
      btnApprove.disabled = true;
      btnApprove.textContent = 'Publicando...';
    }

    fetch('/api/edit-requests/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editRequestId: pendingReviewEditRequestId }),
    })
    .then(function (res) { return res.json(); })
    .then(function (result) {
      if (result.success) {
        showToast('¡Cambio aprobado y publicado!', 'success');
        pendingReviewEditRequestId = null;
        reviewDraftHtml = null;
        reviewCurrentHtml = null;
        showSection('dashboard');
        // Refresh dashboard data
        loadDashboard();
      } else {
        throw new Error(result.error || 'Error');
      }
    })
    .catch(function (err) {
      console.error('Approve change error:', err);
      showToast('Error al aprobar el cambio. Intenta de nuevo.', 'error');
    })
    .finally(function () {
      if (btnApprove) {
        btnApprove.disabled = false;
        btnApprove.textContent = 'Aprobar y Publicar';
      }
    });
  }

  function rejectChange(reason) {
    if (!pendingReviewEditRequestId) return;

    var btnReject = $('#btn-confirm-reject');
    if (btnReject) {
      btnReject.disabled = true;
      btnReject.textContent = 'Enviando...';
    }

    fetch('/api/edit-requests/customer-reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        editRequestId: pendingReviewEditRequestId,
        reason: reason || null,
      }),
    })
    .then(function (res) { return res.json(); })
    .then(function (result) {
      if (result.success) {
        showToast('Cambio rechazado. Puedes enviar una nueva solicitud con más detalles.', 'success');
        pendingReviewEditRequestId = null;
        reviewDraftHtml = null;
        reviewCurrentHtml = null;
        showSection('dashboard');
        loadDashboard();
      } else {
        throw new Error(result.error || 'Error');
      }
    })
    .catch(function (err) {
      console.error('Reject change error:', err);
      showToast('Error al rechazar el cambio. Intenta de nuevo.', 'error');
    })
    .finally(function () {
      if (btnReject) {
        btnReject.disabled = false;
        btnReject.textContent = 'Confirmar Rechazo';
      }
    });
  }

  // ── Scheduling System ──

  var schedStaffData = [];
  var schedServicesData = [];
  var schedConfigLoaded = false;

  async function getAuthToken() {
    var session = await supabase.auth.getSession();
    return session.data.session ? session.data.session.access_token : null;
  }

  async function loadSchedulingSection() {
    if (!schedConfigLoaded) {
      await loadSchedulingConfig();
      schedConfigLoaded = true;
    }
    bindSchedulingEvents();
  }

  var schedEvtsBound = false;

  function bindSchedulingEvents() {
    if (schedEvtsBound) return;
    schedEvtsBound = true;

    // Sub-tab switching
    var tabs = document.querySelectorAll('[data-sched-tab]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var tabId = tab.getAttribute('data-sched-tab');
        // Update tab active state
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        // Show/hide content
        var contents = document.querySelectorAll('[data-sched-content]');
        contents.forEach(function (c) {
          c.style.display = 'none';
          c.classList.remove('active');
        });
        var target = document.querySelector('[data-sched-content="' + tabId + '"]');
        if (target) {
          target.style.display = '';
          target.classList.add('active');
        }
        // Load data for the tab
        if (tabId === 'staff') loadSchedulingStaff();
        if (tabId === 'services') loadSchedulingServices();
      });
    });

    // Type card selection
    var typeCards = document.querySelectorAll('.c-sched-type-card');
    typeCards.forEach(function (card) {
      card.addEventListener('click', function () {
        typeCards.forEach(function (c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        var radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        // Show config fields
        var fields = document.getElementById('sched-config-fields');
        if (fields) fields.style.display = '';
      });
    });

    // Config form
    var configForm = document.getElementById('sched-config-form');
    if (configForm) {
      configForm.addEventListener('submit', function (e) {
        e.preventDefault();
        saveSchedulingConfig();
      });
    }

    // Staff form
    var staffForm = document.getElementById('sched-staff-form');
    if (staffForm) {
      staffForm.addEventListener('submit', function (e) {
        e.preventDefault();
        saveStaffMember();
      });
    }

    var btnAddStaff = document.getElementById('btn-add-staff');
    if (btnAddStaff) {
      btnAddStaff.addEventListener('click', function () {
        showStaffForm(null);
      });
    }

    var btnCancelStaff = document.getElementById('btn-cancel-staff');
    if (btnCancelStaff) {
      btnCancelStaff.addEventListener('click', function () {
        hideStaffForm();
      });
    }

    // Service form
    var serviceForm = document.getElementById('sched-service-form');
    if (serviceForm) {
      serviceForm.addEventListener('submit', function (e) {
        e.preventDefault();
        saveServiceItem();
      });
    }

    var btnAddService = document.getElementById('btn-add-service');
    if (btnAddService) {
      btnAddService.addEventListener('click', function () {
        showServiceForm(null);
      });
    }

    var btnCancelService = document.getElementById('btn-cancel-service');
    if (btnCancelService) {
      btnCancelService.addEventListener('click', function () {
        hideServiceForm();
      });
    }
  }

  // ── Config ──

  async function loadSchedulingConfig() {
    try {
      var token = await getAuthToken();
      if (!token) return;

      var res = await fetch('/api/scheduling/config', {
        headers: { 'Authorization': 'Bearer ' + token },
      });

      if (!res.ok) {
        console.error('Load scheduling config failed:', res.status, await res.text().catch(function () { return ''; }));
        return;
      }

      var data = await res.json();

      if (data) {
        // Set type cards
        if (data.scheduling_type) {
          var card = document.querySelector('.c-sched-type-card[data-type="' + data.scheduling_type + '"]');
          if (card) {
            card.classList.add('selected');
            var radio = card.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
          }
          var fields = document.getElementById('sched-config-fields');
          if (fields) fields.style.display = '';
        }

        // Set config fields
        var config = data.scheduling_config || {};
        var tz = document.getElementById('sched-timezone');
        if (tz && config.timezone) tz.value = config.timezone;
        var bw = document.getElementById('sched-booking-window');
        if (bw && config.booking_window_days != null) bw.value = config.booking_window_days;
        var ma = document.getElementById('sched-min-advance');
        if (ma && config.min_advance_hours != null) ma.value = config.min_advance_hours;
        var ch = document.getElementById('sched-cancel-hours');
        if (ch && config.cancellation_hours != null) ch.value = config.cancellation_hours;
      }
    } catch (err) {
      console.error('Load scheduling config error:', err);
    }
  }

  async function saveSchedulingConfig() {
    var btnSave = document.getElementById('btn-save-sched-config');
    if (btnSave) {
      btnSave.disabled = true;
      btnSave.textContent = 'Guardando...';
    }

    try {
      var token = await getAuthToken();
      if (!token) throw new Error('No session');

      var typeRadio = document.querySelector('input[name="scheduling_type"]:checked');
      var scheduling_type = typeRadio ? typeRadio.value : null;

      var scheduling_config = {
        timezone: (document.getElementById('sched-timezone') || {}).value || 'America/Mexico_City',
        booking_window_days: parseInt((document.getElementById('sched-booking-window') || {}).value, 10) || 30,
        min_advance_hours: parseInt((document.getElementById('sched-min-advance') || {}).value, 10) || 2,
        cancellation_hours: parseInt((document.getElementById('sched-cancel-hours') || {}).value, 10) || 24,
      };

      var res = await fetch('/api/scheduling/config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ scheduling_type: scheduling_type, scheduling_config: scheduling_config }),
      });

      if (!res.ok) {
        var errText = await res.text().catch(function () { return ''; });
        console.error('Scheduling config API error:', res.status, errText);
        try { var errObj = JSON.parse(errText); throw new Error(errObj.error || 'Error ' + res.status); } catch (parseErr) { throw new Error('Error ' + res.status); }
      }

      var result = await res.json();
      console.log('Scheduling config saved:', result);
      showToast(t('sched_config_saved'), 'success');
    } catch (err) {
      console.error('Save scheduling config error:', err);
      showToast(t('sched_config_error'), 'error');
    } finally {
      if (btnSave) {
        btnSave.disabled = false;
        btnSave.textContent = t('sched_save_config');
      }
    }
  }

  // ── Staff CRUD ──

  async function loadSchedulingStaff() {
    var listEl = document.getElementById('sched-staff-list');
    if (!listEl) return;
    listEl.innerHTML = '<div class="c-table-empty">' + t('sched_staff_loading') + '</div>';

    try {
      var token = await getAuthToken();
      if (!token) return;

      var res = await fetch('/api/scheduling/staff', {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      var data = await res.json();
      schedStaffData = Array.isArray(data) ? data : [];
      renderStaffList();
    } catch (err) {
      console.error('Load staff error:', err);
      listEl.innerHTML = '<div class="c-table-empty">' + t('sched_staff_error') + '</div>';
    }
  }

  function renderStaffList() {
    var listEl = document.getElementById('sched-staff-list');
    if (!listEl) return;

    if (schedStaffData.length === 0) {
      listEl.innerHTML = '<div class="c-sched-empty">' +
        '<div class="c-sched-empty-icon"><svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>' +
        '<div class="c-sched-empty-text">' + t('sched_staff_empty') + '</div>' +
        '<div class="c-sched-empty-sub">' + t('sched_staff_empty_sub') + '</div>' +
        '</div>';
      return;
    }

    var html = '';
    schedStaffData.forEach(function (s) {
      var initials = (s.name || '?').split(' ').map(function (w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
      var meta = [];
      if (s.phone) meta.push(escapeHtml(s.phone));
      if (s.email) meta.push(escapeHtml(s.email));

      html += '<div class="c-sched-card" data-staff-id="' + escapeHtml(s.id) + '">';
      html += '<div class="c-sched-card-avatar">' + escapeHtml(initials) + '</div>';
      html += '<div class="c-sched-card-info">';
      html += '<div class="c-sched-card-name">' + escapeHtml(s.name) + '</div>';
      if (meta.length > 0) {
        html += '<div class="c-sched-card-meta">' + meta.join(' · ') + '</div>';
      }
      if (s.specialties && s.specialties.length > 0) {
        html += '<div class="c-sched-tags">';
        s.specialties.forEach(function (sp) {
          html += '<span class="c-sched-tag">' + escapeHtml(sp) + '</span>';
        });
        html += '</div>';
      }
      html += '</div>';
      html += '<div class="c-sched-card-actions">';
      html += '<button class="c-btn c-btn-ghost c-btn--sm" data-action="edit-staff" data-id="' + escapeHtml(s.id) + '">' + t('sched_edit') + '</button>';
      html += '<button class="c-btn c-btn-ghost c-btn--sm" data-action="delete-staff" data-id="' + escapeHtml(s.id) + '" style="color:var(--c-danger);">' + t('sched_delete') + '</button>';
      html += '</div>';
      html += '</div>';
    });

    listEl.innerHTML = html;

    // Bind action buttons
    listEl.querySelectorAll('[data-action="edit-staff"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        var staff = schedStaffData.find(function (s) { return s.id === id; });
        if (staff) showStaffForm(staff);
      });
    });

    listEl.querySelectorAll('[data-action="delete-staff"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        if (window.confirm(t('sched_confirm_delete_staff'))) {
          deleteStaffMember(id);
        }
      });
    });
  }

  function showStaffForm(staff) {
    var panel = document.getElementById('sched-staff-form-panel');
    var title = document.getElementById('sched-staff-form-title');
    if (!panel) return;
    panel.style.display = '';

    if (staff) {
      title.textContent = t('sched_edit') + ' — ' + staff.name;
      document.getElementById('sched-staff-id').value = staff.id;
      document.getElementById('sched-staff-name').value = staff.name || '';
      document.getElementById('sched-staff-phone').value = staff.phone || '';
      document.getElementById('sched-staff-email').value = staff.email || '';
      document.getElementById('sched-staff-specialties').value = (staff.specialties || []).join(', ');
      document.getElementById('sched-staff-bio').value = staff.bio || '';
    } else {
      title.textContent = t('sched_add_staff').replace('+ ', '');
      document.getElementById('sched-staff-id').value = '';
      document.getElementById('sched-staff-name').value = '';
      document.getElementById('sched-staff-phone').value = '';
      document.getElementById('sched-staff-email').value = '';
      document.getElementById('sched-staff-specialties').value = '';
      document.getElementById('sched-staff-bio').value = '';
    }

    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function hideStaffForm() {
    var panel = document.getElementById('sched-staff-form-panel');
    if (panel) panel.style.display = 'none';
  }

  async function saveStaffMember() {
    var btnSave = document.getElementById('btn-save-staff');
    if (btnSave) { btnSave.disabled = true; btnSave.textContent = 'Guardando...'; }

    try {
      var token = await getAuthToken();
      if (!token) throw new Error('No session');

      var id = (document.getElementById('sched-staff-id') || {}).value;
      var name = (document.getElementById('sched-staff-name') || {}).value.trim();
      var phone = (document.getElementById('sched-staff-phone') || {}).value.trim();
      var email = (document.getElementById('sched-staff-email') || {}).value.trim();
      var specialtiesStr = (document.getElementById('sched-staff-specialties') || {}).value;
      var bio = (document.getElementById('sched-staff-bio') || {}).value.trim();

      if (!name) { showToast(t('sched_staff_name') + ' requerido', 'warning'); return; }

      var specialties = specialtiesStr ? specialtiesStr.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];

      var payload = { name: name, phone: phone || null, email: email || null, bio: bio || null, specialties: specialties };

      var method = id ? 'PATCH' : 'POST';
      if (id) payload.id = id;

      var res = await fetch('/api/scheduling/staff', {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        var errData = await res.json();
        throw new Error(errData.error || 'Error');
      }

      showToast(t('sched_staff_saved'), 'success');
      hideStaffForm();
      await loadSchedulingStaff();
    } catch (err) {
      console.error('Save staff error:', err);
      showToast(t('sched_staff_error'), 'error');
    } finally {
      if (btnSave) { btnSave.disabled = false; btnSave.textContent = t('sched_save_staff'); }
    }
  }

  async function deleteStaffMember(staffId) {
    try {
      var token = await getAuthToken();
      if (!token) throw new Error('No session');

      var res = await fetch('/api/scheduling/staff?id=' + encodeURIComponent(staffId), {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token },
      });

      if (!res.ok) {
        var errData = await res.json();
        throw new Error(errData.error || 'Error');
      }

      showToast(t('sched_staff_deleted'), 'success');
      await loadSchedulingStaff();
    } catch (err) {
      console.error('Delete staff error:', err);
      showToast(t('sched_staff_error'), 'error');
    }
  }

  // ── Services CRUD ──

  async function loadSchedulingServices() {
    var listEl = document.getElementById('sched-service-list');
    if (!listEl) return;
    listEl.innerHTML = '<div class="c-table-empty">' + t('sched_svc_loading') + '</div>';

    try {
      var token = await getAuthToken();
      if (!token) return;

      var res = await fetch('/api/scheduling/services', {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      var data = await res.json();
      schedServicesData = Array.isArray(data) ? data : [];
      renderServiceList();
    } catch (err) {
      console.error('Load services error:', err);
      listEl.innerHTML = '<div class="c-table-empty">' + t('sched_svc_error') + '</div>';
    }
  }

  function renderServiceList() {
    var listEl = document.getElementById('sched-service-list');
    if (!listEl) return;

    if (schedServicesData.length === 0) {
      listEl.innerHTML = '<div class="c-sched-empty">' +
        '<div class="c-sched-empty-icon"><svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg></div>' +
        '<div class="c-sched-empty-text">' + t('sched_svc_empty') + '</div>' +
        '<div class="c-sched-empty-sub">' + t('sched_svc_empty_sub') + '</div>' +
        '</div>';
      return;
    }

    var html = '';
    schedServicesData.forEach(function (svc) {
      var badges = [];
      badges.push('<span class="c-sched-card-badge c-sched-badge-duration">' + escapeHtml(svc.duration_minutes + ' min') + '</span>');
      if (svc.price > 0) {
        badges.push('<span class="c-sched-card-badge c-sched-badge-price">$' + escapeHtml(Number(svc.price).toFixed(0)) + ' ' + escapeHtml(svc.currency || 'MXN') + '</span>');
      }
      if (svc.max_capacity > 1) {
        badges.push('<span class="c-sched-card-badge c-sched-badge-capacity">' + escapeHtml(String(svc.max_capacity)) + ' max</span>');
      }

      html += '<div class="c-sched-card" data-service-id="' + escapeHtml(svc.id) + '">';
      if (svc.color) {
        html += '<div class="c-sched-color-dot" style="background:' + escapeHtml(svc.color) + ';"></div>';
      }
      html += '<div class="c-sched-card-info">';
      html += '<div class="c-sched-card-name">' + escapeHtml(svc.name) + '</div>';
      var meta = [];
      if (svc.category) meta.push(escapeHtml(svc.category));
      if (svc.description) meta.push(escapeHtml(svc.description));
      if (meta.length > 0) {
        html += '<div class="c-sched-card-meta">' + meta.join(' · ') + '</div>';
      }
      html += '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">' + badges.join('') + '</div>';
      html += '</div>';
      html += '<div class="c-sched-card-actions">';
      html += '<button class="c-btn c-btn-ghost c-btn--sm" data-action="edit-service" data-id="' + escapeHtml(svc.id) + '">' + t('sched_edit') + '</button>';
      html += '<button class="c-btn c-btn-ghost c-btn--sm" data-action="delete-service" data-id="' + escapeHtml(svc.id) + '" style="color:var(--c-danger);">' + t('sched_delete') + '</button>';
      html += '</div>';
      html += '</div>';
    });

    listEl.innerHTML = html;

    // Bind action buttons
    listEl.querySelectorAll('[data-action="edit-service"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        var svc = schedServicesData.find(function (s) { return s.id === id; });
        if (svc) showServiceForm(svc);
      });
    });

    listEl.querySelectorAll('[data-action="delete-service"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        if (window.confirm(t('sched_confirm_delete_service'))) {
          deleteServiceItem(id);
        }
      });
    });
  }

  function showServiceForm(svc) {
    var panel = document.getElementById('sched-service-form-panel');
    var title = document.getElementById('sched-service-form-title');
    if (!panel) return;
    panel.style.display = '';

    if (svc) {
      title.textContent = t('sched_edit') + ' — ' + svc.name;
      document.getElementById('sched-service-id').value = svc.id;
      document.getElementById('sched-svc-name').value = svc.name || '';
      document.getElementById('sched-svc-category').value = svc.category || '';
      document.getElementById('sched-svc-description').value = svc.description || '';
      document.getElementById('sched-svc-duration').value = svc.duration_minutes || 60;
      document.getElementById('sched-svc-price').value = svc.price || 0;
      document.getElementById('sched-svc-currency').value = svc.currency || 'MXN';
      document.getElementById('sched-svc-capacity').value = svc.max_capacity || 1;
      document.getElementById('sched-svc-color').value = svc.color || '#6C5CE7';
    } else {
      title.textContent = t('sched_add_service').replace('+ ', '');
      document.getElementById('sched-service-id').value = '';
      document.getElementById('sched-svc-name').value = '';
      document.getElementById('sched-svc-category').value = '';
      document.getElementById('sched-svc-description').value = '';
      document.getElementById('sched-svc-duration').value = '60';
      document.getElementById('sched-svc-price').value = '0';
      document.getElementById('sched-svc-currency').value = 'MXN';
      document.getElementById('sched-svc-capacity').value = '1';
      document.getElementById('sched-svc-color').value = '#6C5CE7';
    }

    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function hideServiceForm() {
    var panel = document.getElementById('sched-service-form-panel');
    if (panel) panel.style.display = 'none';
  }

  async function saveServiceItem() {
    var btnSave = document.getElementById('btn-save-service');
    if (btnSave) { btnSave.disabled = true; btnSave.textContent = 'Guardando...'; }

    try {
      var token = await getAuthToken();
      if (!token) throw new Error('No session');

      var id = (document.getElementById('sched-service-id') || {}).value;
      var name = (document.getElementById('sched-svc-name') || {}).value.trim();
      var category = (document.getElementById('sched-svc-category') || {}).value.trim();
      var description = (document.getElementById('sched-svc-description') || {}).value.trim();
      var duration_minutes = parseInt((document.getElementById('sched-svc-duration') || {}).value, 10);
      var price = parseFloat((document.getElementById('sched-svc-price') || {}).value) || 0;
      var currency = (document.getElementById('sched-svc-currency') || {}).value || 'MXN';
      var max_capacity = parseInt((document.getElementById('sched-svc-capacity') || {}).value, 10) || 1;
      var color = (document.getElementById('sched-svc-color') || {}).value || '#6C5CE7';

      if (!name) { showToast(t('sched_svc_name') + ' requerido', 'warning'); return; }
      if (!duration_minutes || duration_minutes < 1) { showToast(t('sched_svc_duration') + ' inválido', 'warning'); return; }

      var payload = {
        name: name,
        description: description || null,
        duration_minutes: duration_minutes,
        price: price,
        currency: currency,
        category: category || null,
        max_capacity: max_capacity,
        color: color,
      };

      var method = id ? 'PATCH' : 'POST';
      if (id) payload.id = id;

      var res = await fetch('/api/scheduling/services', {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        var errData = await res.json();
        throw new Error(errData.error || 'Error');
      }

      showToast(t('sched_svc_saved'), 'success');
      hideServiceForm();
      await loadSchedulingServices();
    } catch (err) {
      console.error('Save service error:', err);
      showToast(t('sched_svc_error'), 'error');
    } finally {
      if (btnSave) { btnSave.disabled = false; btnSave.textContent = t('sched_save_service'); }
    }
  }

  async function deleteServiceItem(serviceId) {
    try {
      var token = await getAuthToken();
      if (!token) throw new Error('No session');

      var res = await fetch('/api/scheduling/services?id=' + encodeURIComponent(serviceId), {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token },
      });

      if (!res.ok) {
        var errData = await res.json();
        throw new Error(errData.error || 'Error');
      }

      showToast(t('sched_svc_deleted'), 'success');
      await loadSchedulingServices();
    } catch (err) {
      console.error('Delete service error:', err);
      showToast(t('sched_svc_error'), 'error');
    }
  }

  // ── Data Wizard ──

  var wizardPhotos = [];
  var wizardReviews = [];
  var wizardServices = [];
  var wizardStarRating = 5;
  var wizardSvcPhotoId = null;  // temp photo ID for service being edited
  var wizardSvcPhotoUrl = null; // temp photo URL for service being edited

  function tArgs(key) {
    var str = t(key);
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < args.length; i++) {
      str = str.replace('{' + i + '}', args[i]);
    }
    return str;
  }

  async function loadWizardData() {
    if (!businessData || !businessData.id) return;

    try {
      // Load photos, reviews, and services in parallel
      var results = await Promise.all([
        supabase.from('business_photos').select('*').eq('business_id', businessData.id).order('created_at', { ascending: false }),
        supabase.from('business_reviews').select('*').eq('business_id', businessData.id).order('created_at', { ascending: false }),
        supabase.from('business_services').select('*').eq('business_id', businessData.id).order('sort_order', { ascending: true })
      ]);

      wizardPhotos = (results[0].data || []);
      wizardReviews = (results[1].data || []);
      wizardServices = (results[2].data || []);

      var scoreData = calculateWizardScore(businessData, wizardPhotos, wizardReviews);
      renderWizardScore(scoreData);
      renderWizardAccordion(scoreData);

      if (!wizardEventsFound) bindWizardEvents();
    } catch (err) {
      console.error('Wizard load error:', err);
    }
  }

  var wizardEventsFound = false;

  function calculateWizardScore(business, photos, reviews) {
    var breakdown = {};
    var total = 0;

    // Photos: 20 pts, 4 pts per photo up to 5
    var photoCount = photos.length;
    var photoScore = Math.min(photoCount * 4, 20);
    breakdown.photos = { score: photoScore, max: 20, count: photoCount, target: 5 };
    total += photoScore;

    // Reviews: 20 pts, ~6.67 pts per review up to 3
    var customerReviews = reviews.filter(function (r) { return r.source === 'customer'; });
    var allReviewCount = reviews.length;
    var reviewScore = Math.min(Math.round(allReviewCount * 6.67), 20);
    breakdown.reviews = { score: reviewScore, max: 20, count: allReviewCount, customerCount: customerReviews.length, target: 3 };
    total += reviewScore;

    // WhatsApp: 10 pts
    var hasWhatsapp = !!(business.whatsapp && business.whatsapp.trim());
    breakdown.whatsapp = { score: hasWhatsapp ? 10 : 0, max: 10, filled: hasWhatsapp };
    total += breakdown.whatsapp.score;

    // Address: 10 pts
    var hasAddress = !!(business.address_full && business.address_full.trim());
    breakdown.address = { score: hasAddress ? 10 : 0, max: 10, filled: hasAddress };
    total += breakdown.address.score;

    // Hours: 10 pts
    var hasHours = !!(business.hours && typeof business.hours === 'object' && Object.keys(business.hours).length > 0);
    // Check if any hour value is non-empty
    if (hasHours) {
      var hourValues = Object.values(business.hours);
      hasHours = hourValues.some(function (v) { return v && String(v).trim() !== ''; });
    }
    breakdown.hours = { score: hasHours ? 10 : 0, max: 10, filled: hasHours };
    total += breakdown.hours.score;

    // Founder: 10 pts (5 for name, 5 for story)
    var hasOwnerName = !!(business.owner_name && business.owner_name.trim());
    var hasFounderDesc = !!(business.founder_description && business.founder_description.trim());
    var founderScore = (hasOwnerName ? 5 : 0) + (hasFounderDesc ? 5 : 0);
    breakdown.founder = { score: founderScore, max: 10, hasName: hasOwnerName, hasStory: hasFounderDesc };
    total += founderScore;

    // Services: 10 pts (5 pts per service up to 2)
    var svcCount = wizardServices.length;
    var svcScore = Math.min(svcCount * 5, 10);
    breakdown.services = { score: svcScore, max: 10, count: svcCount, target: 2 };
    total += svcScore;

    // Bonus from other fields (name, phone, email, rating, etc.) fill remaining 10 pts
    var bonusScore = 0;
    if (business.name) bonusScore += 2;
    if (business.phone) bonusScore += 2;
    if (business.email) bonusScore += 2;
    if (business.rating) bonusScore += 2;
    if (business.category) bonusScore += 2;
    bonusScore = Math.min(bonusScore, 10);
    breakdown.bonus = { score: bonusScore, max: 10 };
    total += bonusScore;

    total = Math.min(total, 100);

    return { total: total, breakdown: breakdown };
  }

  function renderWizardScore(scoreData) {
    var score = scoreData.total;
    var scoreNumEl = document.getElementById('wiz-score-num');
    var circleEl = document.getElementById('wiz-score-circle');
    var progressEl = document.getElementById('wiz-progress-fill');
    var hintEl = document.getElementById('wiz-hint');

    if (scoreNumEl) scoreNumEl.textContent = score;

    // SVG ring: circumference = 2 * PI * 52 ≈ 326.73
    if (circleEl) {
      var circumference = 326.73;
      var offset = circumference - (score / 100) * circumference;
      circleEl.setAttribute('stroke-dashoffset', offset);
      // Color based on score
      var color = score < 40 ? 'var(--c-danger)' : score < 70 ? 'var(--c-warning)' : 'var(--c-success)';
      circleEl.setAttribute('stroke', color);
    }

    if (progressEl) {
      progressEl.style.width = score + '%';
      var level = score < 40 ? 'low' : score < 70 ? 'mid' : 'high';
      progressEl.setAttribute('data-level', level);
    }

    // Dynamic hint
    if (hintEl) {
      var hint = getWizardHint(scoreData);
      hintEl.textContent = hint;
    }
  }

  function getWizardHint(scoreData) {
    var bd = scoreData.breakdown;

    if (scoreData.total >= 95) return t('wiz_hint_complete');

    // Find the category with the best points-to-effort ratio
    // Photos
    if (bd.photos.count < bd.photos.target) {
      var remaining = bd.photos.target - bd.photos.count;
      var potential = Math.min(remaining * 4, bd.photos.max - bd.photos.score);
      return tArgs('wiz_hint_photos', remaining, potential);
    }
    // Reviews
    if (bd.reviews.count < bd.reviews.target) {
      var remaining = bd.reviews.target - bd.reviews.count;
      var potential = Math.min(Math.round(remaining * 6.67), bd.reviews.max - bd.reviews.score);
      return tArgs('wiz_hint_reviews', remaining, potential);
    }
    // WhatsApp
    if (!bd.whatsapp.filled) return tArgs('wiz_hint_whatsapp', bd.whatsapp.max);
    // Address
    if (!bd.address.filled) return tArgs('wiz_hint_address', bd.address.max);
    // Hours
    if (!bd.hours.filled) return tArgs('wiz_hint_hours', bd.hours.max);
    // Founder
    if (bd.founder.score < bd.founder.max) return tArgs('wiz_hint_founder', bd.founder.max - bd.founder.score);
    // Services
    if (bd.services.count < bd.services.target) return tArgs('wiz_hint_services', bd.services.max - bd.services.score);

    return t('wiz_hint_default');
  }

  function renderWizardAccordion(scoreData) {
    var bd = scoreData.breakdown;

    // Photo status
    var photoStatus = document.getElementById('wiz-status-photos');
    if (photoStatus) {
      photoStatus.textContent = bd.photos.count + '/' + bd.photos.target;
      photoStatus.setAttribute('data-complete', bd.photos.score >= bd.photos.max ? 'true' : 'false');
    }

    // Review status
    var reviewStatus = document.getElementById('wiz-status-reviews');
    if (reviewStatus) {
      reviewStatus.textContent = bd.reviews.count + '/' + bd.reviews.target;
      reviewStatus.setAttribute('data-complete', bd.reviews.score >= bd.reviews.max ? 'true' : 'false');
    }

    // WhatsApp status
    var waStatus = document.getElementById('wiz-status-whatsapp');
    if (waStatus) {
      waStatus.textContent = bd.whatsapp.filled ? '\u2713' : '—';
      waStatus.setAttribute('data-complete', bd.whatsapp.filled ? 'true' : 'false');
    }

    // Address status
    var addrStatus = document.getElementById('wiz-status-address');
    if (addrStatus) {
      addrStatus.textContent = bd.address.filled ? '\u2713' : '—';
      addrStatus.setAttribute('data-complete', bd.address.filled ? 'true' : 'false');
    }

    // Hours status
    var hoursStatus = document.getElementById('wiz-status-hours');
    if (hoursStatus) {
      hoursStatus.textContent = bd.hours.filled ? '\u2713' : '—';
      hoursStatus.setAttribute('data-complete', bd.hours.filled ? 'true' : 'false');
    }

    // Founder status
    var founderStatus = document.getElementById('wiz-status-founder');
    if (founderStatus) {
      founderStatus.textContent = bd.founder.score >= bd.founder.max ? '\u2713' : '—';
      founderStatus.setAttribute('data-complete', bd.founder.score >= bd.founder.max ? 'true' : 'false');
    }

    // Services status
    var svcStatus = document.getElementById('wiz-status-services');
    if (svcStatus) {
      svcStatus.textContent = bd.services.count > 0 ? String(bd.services.count) : '0';
      svcStatus.setAttribute('data-complete', bd.services.score >= bd.services.max ? 'true' : 'false');
    }

    // Render photo grid
    renderWizardPhotos();
    // Render review list
    renderWizardReviews();
    // Render services list
    renderWizardServices();
    // Render founder photo
    renderFounderPhoto();
    // Fill form fields
    fillWizardFields();
  }

  function renderWizardPhotos() {
    var grid = document.getElementById('wiz-photo-grid');
    if (!grid) return;

    if (wizardPhotos.length === 0) {
      grid.innerHTML = '';
      return;
    }

    var html = '';
    for (var i = 0; i < wizardPhotos.length; i++) {
      var photo = wizardPhotos[i];
      var imgUrl = photo.storage_path
        ? photo.url || ''
        : photo.url || '';
      var canDelete = photo.source === 'customer_upload';
      html += '<div class="c-wizard-photo-thumb">';
      html += '<img src="' + escapeHtml(imgUrl) + '" alt="" loading="lazy">';
      html += '<span class="c-wizard-photo-type-badge">' + escapeHtml(photo.photo_type || '') + '</span>';
      if (canDelete) {
        html += '<button type="button" class="c-wizard-photo-delete" data-photo-id="' + escapeHtml(photo.id) + '">&times;</button>';
      }
      html += '</div>';
    }
    grid.innerHTML = html;

    // Bind delete buttons
    var deleteButtons = grid.querySelectorAll('.c-wizard-photo-delete');
    deleteButtons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var photoId = btn.getAttribute('data-photo-id');
        if (confirm(t('wiz_confirm_delete_photo'))) {
          deleteWizardPhoto(photoId);
        }
      });
    });
  }

  function renderWizardReviews() {
    var list = document.getElementById('wiz-review-list');
    if (!list) return;

    var customerReviews = wizardReviews.filter(function (r) { return r.source === 'customer'; });

    if (customerReviews.length === 0) {
      list.innerHTML = '';
      return;
    }

    var html = '';
    for (var i = 0; i < customerReviews.length; i++) {
      var review = customerReviews[i];
      var stars = '';
      for (var s = 0; s < (review.rating || 5); s++) stars += '&#9733;';

      html += '<div class="c-wizard-review-card">';
      html += '<div class="c-wizard-review-card-body">';
      html += '<div class="c-wizard-review-author">' + escapeHtml(review.author_name || '') + '</div>';
      html += '<div class="c-wizard-review-stars">' + stars + '</div>';
      html += '<div class="c-wizard-review-text">' + escapeHtml(review.text || '') + '</div>';
      html += '</div>';
      html += '<button type="button" class="c-wizard-review-delete" data-review-id="' + escapeHtml(review.id) + '">&times;</button>';
      html += '</div>';
    }
    list.innerHTML = html;

    // Bind delete buttons
    var deleteButtons = list.querySelectorAll('.c-wizard-review-delete');
    deleteButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var reviewId = btn.getAttribute('data-review-id');
        if (confirm(t('wiz_review_confirm_delete'))) {
          deleteWizardReview(reviewId);
        }
      });
    });
  }

  function fillWizardFields() {
    if (!businessData) return;

    // WhatsApp
    var waInput = document.getElementById('wiz-whatsapp');
    if (waInput && businessData.whatsapp) waInput.value = businessData.whatsapp;

    // Address
    var addrInput = document.getElementById('wiz-address');
    if (addrInput && businessData.address_full) addrInput.value = businessData.address_full;

    // Hours
    if (businessData.hours && typeof businessData.hours === 'object') {
      var hours = businessData.hours;
      var hourInputs = document.querySelectorAll('#wiz-hours-grid input[data-day]');
      hourInputs.forEach(function (input) {
        var day = input.getAttribute('data-day');
        if (hours[day]) input.value = hours[day];
      });
    }

    // Founder name
    var founderNameInput = document.getElementById('wiz-founder-name');
    if (founderNameInput && businessData.owner_name) founderNameInput.value = businessData.owner_name;

    // Founder story
    var founderStoryInput = document.getElementById('wiz-founder-story');
    if (founderStoryInput && businessData.founder_description) {
      founderStoryInput.value = businessData.founder_description;
    }

    // Update char count
    updateFounderCharCount();
  }

  function updateFounderCharCount() {
    var textarea = document.getElementById('wiz-founder-story');
    var countEl = document.getElementById('wiz-founder-chars');
    if (textarea && countEl) {
      countEl.textContent = (textarea.value || '').length;
    }
  }

  function renderFounderPhoto() {
    var preview = document.getElementById('wiz-founder-photo-preview');
    if (!preview) return;

    var founderPhoto = wizardPhotos.filter(function (p) { return p.photo_type === 'founder'; })[0];
    if (founderPhoto) {
      var url = founderPhoto.url || '';
      preview.innerHTML = '<img src="' + escapeHtml(url) + '" alt="">';
      preview.classList.add('has-photo');
    } else {
      preview.innerHTML = '\u{1F464}';
      preview.classList.remove('has-photo');
    }
  }

  function renderWizardServices() {
    var list = document.getElementById('wiz-service-list');
    if (!list) return;

    if (wizardServices.length === 0) {
      list.innerHTML = '';
      return;
    }

    var html = '';
    for (var i = 0; i < wizardServices.length; i++) {
      var svc = wizardServices[i];
      var photoUrl = '';
      if (svc.photo_id) {
        var photo = wizardPhotos.filter(function (p) { return p.id === svc.photo_id; })[0];
        if (photo) photoUrl = photo.url || '';
      }
      var priceStr = svc.price ? ('$' + Number(svc.price).toLocaleString(undefined, { minimumFractionDigits: 0 }) + ' ' + (svc.currency || '')) : '';

      html += '<div class="c-wizard-service-item">';
      html += '<div class="c-wizard-service-item-photo">';
      if (photoUrl) {
        html += '<img src="' + escapeHtml(photoUrl) + '" alt="" loading="lazy">';
      } else {
        html += '\u{1F4BC}';
      }
      html += '</div>';
      html += '<div class="c-wizard-service-item-body">';
      html += '<div class="c-wizard-service-item-name">' + escapeHtml(svc.name) + '</div>';
      if (svc.description) html += '<div class="c-wizard-service-item-desc">' + escapeHtml(svc.description) + '</div>';
      html += '</div>';
      if (priceStr) html += '<div class="c-wizard-service-item-price">' + escapeHtml(priceStr) + '</div>';
      html += '<div class="c-wizard-service-item-actions">';
      html += '<button type="button" class="c-wizard-svc-delete" data-svc-id="' + escapeHtml(svc.id) + '">&times;</button>';
      html += '</div>';
      html += '</div>';
    }
    list.innerHTML = html;

    // Bind delete buttons
    var deleteButtons = list.querySelectorAll('.c-wizard-svc-delete');
    deleteButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var svcId = btn.getAttribute('data-svc-id');
        if (confirm(t('wiz_svc_confirm_delete'))) {
          deleteWizardService(svcId);
        }
      });
    });
  }

  async function uploadFounderPhoto(file) {
    var token = await getAuthToken();
    if (!token) return;

    if (file.size > 4 * 1024 * 1024) {
      showToast(t('wiz_upload_too_large'), 'warning');
      return;
    }

    try {
      // Remove existing founder photo first
      var existing = wizardPhotos.filter(function (p) { return p.photo_type === 'founder'; })[0];
      if (existing) {
        await fetch('/api/wizard/delete-photo?photoId=' + encodeURIComponent(existing.id), {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token },
        });
        wizardPhotos = wizardPhotos.filter(function (p) { return p.id !== existing.id; });
      }

      var buffer = await file.arrayBuffer();
      var res = await fetch('/api/wizard/upload-photo?photo_type=founder', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': file.type,
        },
        body: buffer,
      });

      if (!res.ok) throw new Error('Upload failed');
      var data = await res.json();

      wizardPhotos.unshift({
        id: data.id,
        source: 'customer_upload',
        photo_type: 'founder',
        url: data.public_url,
        storage_path: data.storage_path,
        business_id: businessData.id,
      });

      renderFounderPhoto();
    } catch (err) {
      console.error('Founder photo upload error:', err);
      showToast(t('wiz_upload_error'), 'error');
    }
  }

  async function uploadServicePhoto(file) {
    var token = await getAuthToken();
    if (!token) return null;

    if (file.size > 4 * 1024 * 1024) {
      showToast(t('wiz_upload_too_large'), 'warning');
      return null;
    }

    try {
      var buffer = await file.arrayBuffer();
      var res = await fetch('/api/wizard/upload-photo?photo_type=service', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': file.type,
        },
        body: buffer,
      });

      if (!res.ok) throw new Error('Upload failed');
      var data = await res.json();

      wizardPhotos.unshift({
        id: data.id,
        source: 'customer_upload',
        photo_type: 'service',
        url: data.public_url,
        storage_path: data.storage_path,
        business_id: businessData.id,
      });

      return { id: data.id, url: data.public_url };
    } catch (err) {
      console.error('Service photo upload error:', err);
      showToast(t('wiz_upload_error'), 'error');
      return null;
    }
  }

  async function saveWizardService() {
    if (!businessData) return;

    var nameInput = document.getElementById('wiz-svc-name');
    var priceInput = document.getElementById('wiz-svc-price');
    var currencyInput = document.getElementById('wiz-svc-currency');
    var descInput = document.getElementById('wiz-svc-description');
    var saveBtn = document.getElementById('wiz-svc-save');

    var name = nameInput ? nameInput.value.trim() : '';
    if (!name) { showToast(t('wiz_svc_name_required'), 'warning'); return; }

    var price = priceInput && priceInput.value ? parseFloat(priceInput.value) : null;
    var currency = currencyInput ? currencyInput.value : 'MXN';
    var description = descInput ? descInput.value.trim() : null;

    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = t('wiz_saving'); }

    try {
      var insertData = {
        business_id: businessData.id,
        name: name,
        description: description || null,
        price: price,
        currency: currency,
        photo_id: wizardSvcPhotoId || null,
        sort_order: wizardServices.length,
      };

      var result = await supabase.from('business_services').insert(insertData).select();
      if (result.error) throw result.error;

      if (result.data && result.data[0]) {
        wizardServices.push(result.data[0]);
      }

      // Clear form
      if (nameInput) nameInput.value = '';
      if (priceInput) priceInput.value = '';
      if (descInput) descInput.value = '';
      clearSvcPhotoPreview();

      showToast(t('wiz_svc_saved'), 'success');
      refreshWizardScore();
    } catch (err) {
      console.error('Save service error:', err);
      showToast(t('wiz_svc_error'), 'error');
    } finally {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = t('wiz_svc_save'); }
    }
  }

  function clearSvcPhotoPreview() {
    wizardSvcPhotoId = null;
    wizardSvcPhotoUrl = null;
    var preview = document.getElementById('wiz-svc-photo-preview');
    if (preview) {
      preview.innerHTML = '\u{1F4F7}';
      preview.classList.remove('has-photo');
    }
  }

  async function deleteWizardService(svcId) {
    try {
      var result = await supabase.from('business_services').delete().eq('id', svcId);
      if (result.error) throw result.error;

      wizardServices = wizardServices.filter(function (s) { return s.id !== svcId; });
      showToast(t('wiz_svc_deleted'), 'success');
      refreshWizardScore();
    } catch (err) {
      console.error('Delete service error:', err);
      showToast(t('wiz_svc_error'), 'error');
    }
  }

  function bindWizardEvents() {
    if (wizardEventsFound) return;
    wizardEventsFound = true;

    // Accordion toggle
    var toggleButtons = document.querySelectorAll('[data-wiz-toggle]');
    toggleButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cardId = btn.getAttribute('data-wiz-toggle');
        var card = document.querySelector('[data-wiz-card="' + cardId + '"]');
        if (card) card.classList.toggle('open');
      });
    });

    // Photo upload zone — click
    var uploadZone = document.getElementById('wiz-upload-zone');
    var photoInput = document.getElementById('wiz-photo-input');
    if (uploadZone && photoInput) {
      uploadZone.addEventListener('click', function () {
        photoInput.click();
      });

      photoInput.addEventListener('change', function () {
        if (photoInput.files && photoInput.files.length > 0) {
          handleWizardPhotoUpload(photoInput.files);
          photoInput.value = '';
        }
      });

      // Drag and drop
      uploadZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
      });
      uploadZone.addEventListener('dragleave', function () {
        uploadZone.classList.remove('drag-over');
      });
      uploadZone.addEventListener('drop', function (e) {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleWizardPhotoUpload(e.dataTransfer.files);
        }
      });
    }

    // Star picker
    var starPicker = document.getElementById('wiz-star-picker');
    if (starPicker) {
      var stars = starPicker.querySelectorAll('.c-wizard-star');
      stars.forEach(function (star) {
        star.addEventListener('click', function () {
          wizardStarRating = parseInt(star.getAttribute('data-star'), 10);
          updateStarPicker();
        });
      });
      updateStarPicker();
    }

    // Add review button
    var addReviewBtn = document.getElementById('wiz-add-review');
    if (addReviewBtn) {
      addReviewBtn.addEventListener('click', function () {
        submitWizardReview();
      });
    }

    // Field auto-save on blur
    var waInput = document.getElementById('wiz-whatsapp');
    if (waInput) {
      waInput.addEventListener('blur', function () {
        saveWizardField('whatsapp', waInput.value.trim());
      });
    }

    var addrInput = document.getElementById('wiz-address');
    if (addrInput) {
      addrInput.addEventListener('blur', function () {
        saveWizardField('address_full', addrInput.value.trim());
      });
    }

    // Hours — save on blur of any hours input
    var hourInputs = document.querySelectorAll('#wiz-hours-grid input[data-day]');
    hourInputs.forEach(function (input) {
      input.addEventListener('blur', function () {
        saveWizardHours();
      });
    });

    // Hours — "same every day" toggle
    var sameToggle = document.getElementById('wiz-hours-same');
    if (sameToggle) {
      sameToggle.addEventListener('change', function () {
        if (sameToggle.checked) {
          // Copy first day's value to all
          var firstInput = document.querySelector('#wiz-hours-grid input[data-day="lunes"]');
          var value = firstInput ? firstInput.value : '';
          hourInputs.forEach(function (input) {
            input.value = value;
          });
          saveWizardHours();
        }
      });
    }

    // Founder name — save on blur
    var founderNameInput = document.getElementById('wiz-founder-name');
    if (founderNameInput) {
      founderNameInput.addEventListener('blur', function () {
        saveWizardField('owner_name', founderNameInput.value.trim());
      });
    }

    // Founder story — save on blur + char count
    var founderStoryInput = document.getElementById('wiz-founder-story');
    if (founderStoryInput) {
      founderStoryInput.addEventListener('input', updateFounderCharCount);
      founderStoryInput.addEventListener('blur', function () {
        saveWizardField('founder_description', founderStoryInput.value.trim());
      });
    }

    // Founder photo upload
    var founderPhotoBtn = document.getElementById('wiz-founder-photo-btn');
    var founderPhotoInput = document.getElementById('wiz-founder-photo-input');
    if (founderPhotoBtn && founderPhotoInput) {
      founderPhotoBtn.addEventListener('click', function () {
        founderPhotoInput.click();
      });
      founderPhotoInput.addEventListener('change', function () {
        if (founderPhotoInput.files && founderPhotoInput.files[0]) {
          uploadFounderPhoto(founderPhotoInput.files[0]);
          founderPhotoInput.value = '';
        }
      });
    }

    // Service photo upload
    var svcPhotoBtn = document.getElementById('wiz-svc-photo-btn');
    var svcPhotoInput = document.getElementById('wiz-svc-photo-input');
    if (svcPhotoBtn && svcPhotoInput) {
      svcPhotoBtn.addEventListener('click', function () {
        svcPhotoInput.click();
      });
      svcPhotoInput.addEventListener('change', async function () {
        if (svcPhotoInput.files && svcPhotoInput.files[0]) {
          svcPhotoBtn.disabled = true;
          svcPhotoBtn.textContent = t('wiz_uploading');
          var result = await uploadServicePhoto(svcPhotoInput.files[0]);
          svcPhotoBtn.disabled = false;
          svcPhotoBtn.textContent = t('wiz_svc_photo_btn');
          svcPhotoInput.value = '';
          if (result) {
            wizardSvcPhotoId = result.id;
            wizardSvcPhotoUrl = result.url;
            var preview = document.getElementById('wiz-svc-photo-preview');
            if (preview) {
              preview.innerHTML = '<img src="' + escapeHtml(result.url) + '" alt="">';
              preview.classList.add('has-photo');
            }
          }
        }
      });
    }

    // Save service button
    var svcSaveBtn = document.getElementById('wiz-svc-save');
    if (svcSaveBtn) {
      svcSaveBtn.addEventListener('click', function () {
        saveWizardService();
      });
    }
  }

  function updateStarPicker() {
    var stars = document.querySelectorAll('#wiz-star-picker .c-wizard-star');
    stars.forEach(function (star) {
      var val = parseInt(star.getAttribute('data-star'), 10);
      if (val <= wizardStarRating) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });
  }

  async function handleWizardPhotoUpload(files) {
    var token = await getAuthToken();
    if (!token) return;

    var typeSelect = document.getElementById('wiz-photo-type');
    var photoType = typeSelect ? typeSelect.value : 'product';
    var uploadZone = document.getElementById('wiz-upload-zone');

    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      // Validate type
      if (!file.type.startsWith('image/')) continue;

      // Validate size (4MB)
      if (file.size > 4 * 1024 * 1024) {
        showToast(t('wiz_upload_too_large'), 'warning');
        continue;
      }

      if (uploadZone) uploadZone.classList.add('uploading');

      try {
        var buffer = await file.arrayBuffer();

        var res = await fetch('/api/wizard/upload-photo?photo_type=' + encodeURIComponent(photoType), {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': file.type,
          },
          body: buffer,
        });

        if (!res.ok) {
          var errData = await res.json().catch(function () { return {}; });
          throw new Error(errData.error || 'Upload failed');
        }

        var data = await res.json();

        // Add to local array and re-render
        wizardPhotos.unshift({
          id: data.id,
          source: 'customer_upload',
          photo_type: data.photo_type,
          url: data.public_url,
          storage_path: data.storage_path,
          business_id: businessData.id,
        });

      } catch (err) {
        console.error('Photo upload error:', err);
        showToast(t('wiz_upload_error'), 'error');
      }
    }

    if (uploadZone) uploadZone.classList.remove('uploading');

    // Re-render and recalculate
    refreshWizardScore();
  }

  async function deleteWizardPhoto(photoId) {
    var token = await getAuthToken();
    if (!token) return;

    try {
      var res = await fetch('/api/wizard/delete-photo?photoId=' + encodeURIComponent(photoId), {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token },
      });

      if (!res.ok) {
        var errData = await res.json().catch(function () { return {}; });
        throw new Error(errData.error || 'Delete failed');
      }

      // Remove from local array
      wizardPhotos = wizardPhotos.filter(function (p) { return p.id !== photoId; });

      showToast(t('wiz_photo_deleted'), 'success');
      refreshWizardScore();
    } catch (err) {
      console.error('Photo delete error:', err);
      showToast(t('wiz_photo_delete_error'), 'error');
    }
  }

  async function submitWizardReview() {
    if (!businessData) return;

    var nameInput = document.getElementById('wiz-review-name');
    var textInput = document.getElementById('wiz-review-text');
    var addBtn = document.getElementById('wiz-add-review');

    var name = nameInput ? nameInput.value.trim() : '';
    var text = textInput ? textInput.value.trim() : '';

    if (!name) { showToast(t('wiz_review_name_required'), 'warning'); return; }
    if (!text) { showToast(t('wiz_review_text_required'), 'warning'); return; }

    if (addBtn) { addBtn.disabled = true; addBtn.textContent = t('wiz_saving'); }

    try {
      // Generate review hash for dedup
      var hashInput = 'customer|' + name + '|' + text;
      var reviewHash = simpleHash(hashInput);

      var result = await supabase.from('business_reviews').insert({
        business_id: businessData.id,
        source: 'customer',
        author_name: name,
        rating: wizardStarRating,
        text: text,
        sentiment_label: 'very_positive',
        is_curated: true,
        review_hash: reviewHash,
      }).select();

      if (result.error) throw result.error;

      // Add to local array
      if (result.data && result.data[0]) {
        wizardReviews.unshift(result.data[0]);
      }

      // Clear form
      if (nameInput) nameInput.value = '';
      if (textInput) textInput.value = '';
      wizardStarRating = 5;
      updateStarPicker();

      refreshWizardScore();
    } catch (err) {
      console.error('Review submit error:', err);
      showToast(t('wiz_review_error'), 'error');
    } finally {
      if (addBtn) { addBtn.disabled = false; addBtn.textContent = t('wiz_review_add'); }
    }
  }

  function simpleHash(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash = hash & hash; // Convert to 32bit int
    }
    return 'cust_' + Math.abs(hash).toString(36);
  }

  async function deleteWizardReview(reviewId) {
    try {
      var result = await supabase.from('business_reviews').delete().eq('id', reviewId);
      if (result.error) throw result.error;

      wizardReviews = wizardReviews.filter(function (r) { return r.id !== reviewId; });
      showToast(t('wiz_review_deleted'), 'success');
      refreshWizardScore();
    } catch (err) {
      console.error('Review delete error:', err);
      showToast(t('wiz_review_error'), 'error');
    }
  }

  async function saveWizardField(column, value) {
    if (!businessData) return;

    // Determine saved indicator ID
    var indicatorMap = {
      whatsapp: 'wiz-saved-whatsapp',
      address_full: 'wiz-saved-address',
      owner_name: 'wiz-saved-founder-name',
      founder_description: 'wiz-saved-founder-story',
    };
    var indicatorId = indicatorMap[column];

    try {
      var updateData = {};
      updateData[column] = value || null;

      var result = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', businessData.id);

      if (result.error) throw result.error;

      // Update local state
      businessData[column] = value || null;

      // Show saved indicator
      flashSaved(indicatorId);
      refreshWizardScore();
    } catch (err) {
      console.error('Wizard save field error:', err);
      showToast(t('wiz_save_error'), 'error');
    }
  }

  async function saveWizardHours() {
    if (!businessData) return;

    var hourInputs = document.querySelectorAll('#wiz-hours-grid input[data-day]');
    var hoursObj = {};
    hourInputs.forEach(function (input) {
      hoursObj[input.getAttribute('data-day')] = input.value.trim();
    });

    try {
      var result = await supabase
        .from('businesses')
        .update({ hours: hoursObj })
        .eq('id', businessData.id);

      if (result.error) throw result.error;

      businessData.hours = hoursObj;
      flashSaved('wiz-saved-hours');
      refreshWizardScore();
    } catch (err) {
      console.error('Wizard save hours error:', err);
      showToast(t('wiz_save_error'), 'error');
    }
  }

  function flashSaved(indicatorId) {
    if (!indicatorId) return;
    var el = document.getElementById(indicatorId);
    if (!el) return;
    el.textContent = t('wiz_saved');
    el.classList.add('show');
    setTimeout(function () {
      el.classList.remove('show');
    }, 2000);
  }

  function refreshWizardScore() {
    var scoreData = calculateWizardScore(businessData, wizardPhotos, wizardReviews);
    renderWizardScore(scoreData);
    renderWizardAccordion(scoreData);

    // Also update the businesses.data_completeness_score in DB (fire and forget)
    if (businessData && businessData.id) {
      supabase.from('businesses').update({
        data_completeness_score: scoreData.total,
        last_updated_at: new Date().toISOString(),
      }).eq('id', businessData.id).then(function () {
        // silent
      });
    }
  }

  // ── Start ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
