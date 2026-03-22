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

  // ── Start ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
