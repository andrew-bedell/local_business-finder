// === Customer Admin Portal — AhoraTengoPagina ===

(function () {
  'use strict';

  // ── Config ──
  const SUPABASE_URL = 'https://xagfwyknlutmmtfufbfi.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_2ZsXzfuXEPF7MJxxB7mA-Q_H--jfttp';

  // ── State ──
  let supabase = null;
  let businessSlug = null;
  let currentUser = null;
  let customerData = null;   // { customer, customerUser }
  let businessData = null;
  let websiteData = null;
  let subscriptionData = null;
  let isRecoveryMode = false;

  // ── DOM refs ──
  const $ = function (sel) { return document.querySelector(sel); };
  const $$ = function (sel) { return document.querySelectorAll(sel); };

  // ── Init ──
  function init() {
    // Initialize Supabase client
    if (typeof window.supabase === 'undefined' && typeof window.Supabase === 'undefined') {
      console.error('Supabase SDK not loaded');
      return;
    }

    var sb = window.supabase;
    supabase = sb.createClient(SUPABASE_URL, SUPABASE_KEY);

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
    var result = await supabase
      .from('generated_websites')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'published')
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

      // Update header
      var businessNameEl = $('#business-name');
      if (businessNameEl && businessData) {
        businessNameEl.textContent = escapeHtml(businessData.name);
      }

      hideLoading();
      showDashboardScreen();
      showSection('dashboard');
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

    if (website && website.custom_domain && website.domain_status === 'verified') {
      displayUrl = 'https://' + website.custom_domain;
    } else if (website && website.published_url) {
      displayUrl = website.published_url;
    }

    if (websiteUrlEl) {
      if (displayUrl) {
        websiteUrlEl.innerHTML = '<a href="' + escapeHtml(displayUrl) + '" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;">' + escapeHtml(displayUrl) + '</a>';
      } else {
        websiteUrlEl.textContent = 'Tu sitio web está en construcción';
      }
    }

    if (websiteSubEl) {
      if (displayUrl) {
        websiteSubEl.textContent = 'Tu página web está activa y lista para recibir clientes.';
      } else {
        websiteSubEl.textContent = 'Estamos construyendo tu presencia en línea. Pronto tus clientes podrán encontrarte.';
      }
    }

    if (visitBtn) {
      if (displayUrl) {
        visitBtn.href = displayUrl;
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
        return r.status !== 'completed' && r.status !== 'rejected';
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
      in_review: 'En revisión',
      in_progress: 'En progreso',
      completed: 'Completada',
      rejected: 'Rechazada'
    };

    var statusClasses = {
      submitted: 'c-badge--submitted',
      in_review: 'c-badge--in-review',
      in_progress: 'c-badge--in-progress',
      completed: 'c-badge--completed',
      rejected: 'c-badge--rejected'
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
      html += '<td><span class="c-badge ' + statusClass + '">' + escapeHtml(statusLabel) + '</span></td>';
      html += '</tr>';
    });

    tbody.innerHTML = html;
  }

  function renderInvoiceHistory() {
    // Placeholder — invoices are managed through Stripe
    // This section can be expanded later with Stripe API integration
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

      showToast('Solicitud enviada correctamente. Te notificaremos cuando esté lista.', 'success');

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
        toggleTeamMember(memberId, action === 'activate');
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

    fetch('/api/edit-requests/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    })
    .then(function (res) { return res.json(); })
    .then(function (result) {
      if (result.success) {
        showToast('Solicitud enviada correctamente.', 'success');
        appendChatMessage('ai', '¡Listo! Tu solicitud ha sido enviada. Nuestro equipo la revisará pronto. ¿Quieres hacer otro cambio?');
        pendingEditRequest = null;
        clearSelectedElement();
      } else {
        throw new Error(result.error || 'Error');
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

  // ── Start ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
