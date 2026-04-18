// Employee Auth Module — handles login page logic and auth guard for protected pages
(function () {
  'use strict';

  var SUPABASE_URL_FALLBACK = 'https://xagfwyknlutmmtfufbfi.supabase.co';
  var SUPABASE_KEY_FALLBACK = '';

  if (typeof window.supabase === 'undefined') {
    console.error('Supabase SDK not loaded');
    return;
  }

  var supabase = null;
  var isLoginPage = window.location.pathname.indexOf('/employee/login') !== -1;
  var isRecoveryMode = false;
  var currentLang = localStorage.getItem('app_lang') || 'en';
  var translations = {
    en: {
      page_title: 'Employee Login — Local Business Finder',
      loading_access: 'Checking access…',
      login_subtitle: 'Employee Login',
      email_label: 'Email',
      email_placeholder: 'you@company.com',
      password_label: 'Password',
      password_placeholder: 'Enter your password',
      login_submit: 'Log In',
      forgot_password: 'Forgot password?',
      reset_subtitle: 'Reset Password',
      reset_submit: 'Send Reset Link',
      back_to_login: 'Back to login',
      new_password_subtitle: 'Set New Password',
      new_password_label: 'New Password',
      new_password_placeholder: 'Enter new password',
      confirm_password_label: 'Confirm Password',
      confirm_password_placeholder: 'Confirm new password',
      set_password_submit: 'Set Password',
      unauthorized_access: 'You do not have employee access. Contact your administrator.',
      logging_in: 'Logging in…',
      invalid_credentials: 'Invalid email or password.',
      login_failed: 'Login failed. Please try again.',
      sending_reset: 'Sending…',
      reset_success: 'Check your email for the reset link.',
      reset_failed: 'Failed to send reset email.',
      password_min_length: 'Password must be at least 6 characters.',
      passwords_do_not_match: 'Passwords do not match.',
      setting_password: 'Setting password…',
      set_password_failed: 'Failed to set password. Please try again.'
    },
    es: {
      page_title: 'Inicio de Empleados — Local Business Finder',
      loading_access: 'Verificando acceso…',
      login_subtitle: 'Inicio de Empleados',
      email_label: 'Correo electrónico',
      email_placeholder: 'tu@empresa.com',
      password_label: 'Contraseña',
      password_placeholder: 'Ingresa tu contraseña',
      login_submit: 'Iniciar sesión',
      forgot_password: '¿Olvidaste tu contraseña?',
      reset_subtitle: 'Restablecer contraseña',
      reset_submit: 'Enviar enlace',
      back_to_login: 'Volver al inicio',
      new_password_subtitle: 'Crear nueva contraseña',
      new_password_label: 'Nueva contraseña',
      new_password_placeholder: 'Ingresa la nueva contraseña',
      confirm_password_label: 'Confirmar contraseña',
      confirm_password_placeholder: 'Confirma la nueva contraseña',
      set_password_submit: 'Guardar contraseña',
      unauthorized_access: 'No tienes acceso de empleado. Ponte en contacto con tu administrador.',
      logging_in: 'Iniciando sesión…',
      invalid_credentials: 'Correo o contraseña incorrectos.',
      login_failed: 'No se pudo iniciar sesión. Inténtalo de nuevo.',
      sending_reset: 'Enviando…',
      reset_success: 'Revisa tu correo para ver el enlace de restablecimiento.',
      reset_failed: 'No se pudo enviar el correo de restablecimiento.',
      password_min_length: 'La contraseña debe tener al menos 6 caracteres.',
      passwords_do_not_match: 'Las contraseñas no coinciden.',
      setting_password: 'Guardando contraseña…',
      set_password_failed: 'No se pudo guardar la contraseña. Inténtalo de nuevo.'
    }
  };

  // Fetch Supabase credentials from server, then initialize
  initFromConfig().then(function () {
    if (!supabase) {
      console.error('Failed to initialize Supabase client');
      if (!isLoginPage) {
        window.location.href = '/employee/login?error=config';
      }
      return;
    }
    if (isLoginPage) {
      initLoginPage();
    } else {
      checkAuthAndRedirect();
    }
  });

  function initFromConfig() {
    return fetch('/api/config').then(function (res) {
      if (!res.ok) throw new Error('Config fetch failed');
      return res.json();
    }).then(function (data) {
      var url = data.supabaseUrl || SUPABASE_URL_FALLBACK;
      var key = data.supabaseKey || SUPABASE_KEY_FALLBACK;
      if (url && key) {
        supabase = window.supabase.createClient(url, key);
      }
    }).catch(function (err) {
      console.warn('Could not fetch config, using fallback:', err.message);
      if (SUPABASE_URL_FALLBACK && SUPABASE_KEY_FALLBACK) {
        supabase = window.supabase.createClient(SUPABASE_URL_FALLBACK, SUPABASE_KEY_FALLBACK);
      }
    });
  }

  // ── Auth Guard (for protected pages) ──
  function checkAuthAndRedirect() {
    var loadingEl = document.getElementById('auth-loading');
    if (loadingEl) loadingEl.style.display = '';

    supabase.auth.getSession().then(function (result) {
      var session = result.data.session;
      if (!session) {
        sessionStorage.setItem('employee_redirect', window.location.pathname);
        window.location.href = '/employee/login';
        return;
      }

      // Verify this user is an active employee
      supabase.from('employees')
        .select('id, email, display_name, outreach_sender_name, role, is_active')
        .eq('auth_user_id', session.user.id)
        .eq('is_active', true)
        .single()
        .then(function (empResult) {
          if (empResult.error || !empResult.data) {
            console.warn('User is not an active employee:', empResult.error);
            supabase.auth.signOut().then(function () {
              window.location.href = '/employee/login?error=unauthorized';
            });
            return;
          }

          // Auth passed — expose employee data and signal app to start
          window.__employeeAuth = {
            user: session.user,
            employee: empResult.data,
            supabase: supabase,
            signOut: function () {
              supabase.auth.signOut().then(function () {
                window.location.href = '/employee/login';
              });
            }
          };

          // Record employee IP for analytics exclusion (fire-and-forget)
          trackEmployeeIp(session.access_token, empResult.data);

          if (loadingEl) loadingEl.style.display = 'none';
          document.dispatchEvent(new CustomEvent('employee-auth-ready'));
        });
    }).catch(function (err) {
      console.error('Auth check failed:', err);
      window.location.href = '/employee/login';
    });
  }

  // ── Login Page Logic ──
  function initLoginPage() {
    bindLanguageControls();
    applyLanguage();

    // Check URL hash for recovery/invite tokens
    var hash = window.location.hash || '';
    if (hash.indexOf('type=recovery') !== -1 || hash.indexOf('type=invite') !== -1) {
      isRecoveryMode = true;
    }

    // Check for error params
    var params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'unauthorized') {
      showError('login-error', t('unauthorized_access'), 'unauthorized_access');
    }

    // Listen for auth state changes (handles recovery/invite token processing)
    supabase.auth.onAuthStateChange(function (event, session) {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && isRecoveryMode)) {
        isRecoveryMode = true;
        // Clean the URL hash
        if (window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        showScreen('new-password-screen');
        return;
      }
    });

    // Check if already logged in
    supabase.auth.getSession().then(function (result) {
      var session = result.data.session;
      if (isRecoveryMode) {
        if (window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        showScreen('new-password-screen');
      } else if (session) {
        // Already logged in — verify employee and redirect
        verifyAndRedirect(session);
      }
      // Otherwise stay on login screen (already visible by default)
    });

    // Bind form events
    var loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        handleLogin();
      });
    }

    var resetForm = document.getElementById('reset-form');
    if (resetForm) {
      resetForm.addEventListener('submit', function (e) {
        e.preventDefault();
        handleResetPassword();
      });
    }

    var newPasswordForm = document.getElementById('new-password-form');
    if (newPasswordForm) {
      newPasswordForm.addEventListener('submit', function (e) {
        e.preventDefault();
        handleSetPassword();
      });
    }

    var showResetLink = document.getElementById('show-reset');
    if (showResetLink) {
      showResetLink.addEventListener('click', function () {
        showScreen('reset-screen');
      });
    }

    var backToLoginLink = document.getElementById('show-login-from-reset');
    if (backToLoginLink) {
      backToLoginLink.addEventListener('click', function () {
        showScreen('login-screen');
      });
    }
  }

  function handleLogin() {
    var email = (document.getElementById('login-email').value || '').trim();
    var password = document.getElementById('login-password').value || '';
    var btn = document.getElementById('login-btn');

    if (!email || !password) return;

    hideError('login-error');
    btn.disabled = true;
    btn.textContent = t('logging_in');

    supabase.auth.signInWithPassword({ email: email, password: password })
      .then(function (result) {
        if (result.error) {
          showError('login-error', t('invalid_credentials'), 'invalid_credentials');
          btn.disabled = false;
          btn.textContent = t('login_submit');
          return;
        }
        verifyAndRedirect(result.data.session);
      })
      .catch(function (err) {
        console.error('Login error:', err);
        showError('login-error', t('login_failed'), 'login_failed');
        btn.disabled = false;
        btn.textContent = t('login_submit');
      });
  }

  function verifyAndRedirect(session) {
    supabase.from('employees')
      .select('id, email, display_name, role, is_active, joined_at')
      .eq('auth_user_id', session.user.id)
      .eq('is_active', true)
      .single()
      .then(function (empResult) {
        if (empResult.error || !empResult.data) {
          supabase.auth.signOut();
          showError('login-error', t('unauthorized_access'), 'unauthorized_access');
          var btn = document.getElementById('login-btn');
          if (btn) { btn.disabled = false; btn.textContent = t('login_submit'); }
          showScreen('login-screen');
          return;
        }

        // Record employee IP for analytics exclusion (fire-and-forget)
        trackEmployeeIp(session.access_token, empResult.data);

        // Update joined_at and send welcome email if this is the first login
        var isFirstLogin = !empResult.data.joined_at;
        if (isFirstLogin) {
          supabase.from('employees')
            .update({ joined_at: new Date().toISOString() })
            .eq('id', empResult.data.id)
            .then(function () {})
            .catch(function () {});

          // Send welcome/tutorial email (non-blocking)
          fetch('/api/employees/welcome', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + session.access_token
            },
            body: JSON.stringify({ employee_id: empResult.data.id })
          }).catch(function () {});
        }

        // First-time login → send to welcome/onboarding page
        if (isFirstLogin) {
          window.location.href = '/employee/welcome';
          return;
        }

        var redirect = sessionStorage.getItem('employee_redirect') || '/employee';
        sessionStorage.removeItem('employee_redirect');
        window.location.href = redirect;
      });
  }

  function handleResetPassword() {
    var email = (document.getElementById('reset-email').value || '').trim();
    var btn = document.getElementById('reset-btn');

    if (!email) return;

    hideError('reset-error');
    btn.disabled = true;
    btn.textContent = t('sending_reset');

    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/employee/login'
    }).then(function (result) {
      btn.disabled = false;
      btn.textContent = t('reset_submit');
      if (result.error) {
        showError('reset-error', result.error.message);
      } else {
        showSuccess('reset-success', t('reset_success'), 'reset_success');
      }
    }).catch(function (err) {
      console.error('Reset error:', err);
      showError('reset-error', t('reset_failed'), 'reset_failed');
      btn.disabled = false;
      btn.textContent = t('reset_submit');
    });
  }

  function handleSetPassword() {
    var password = document.getElementById('new-password').value || '';
    var confirm = document.getElementById('confirm-password').value || '';
    var btn = document.getElementById('set-password-btn');

    if (!password || password.length < 6) {
      showError('new-password-error', t('password_min_length'), 'password_min_length');
      return;
    }
    if (password !== confirm) {
      showError('new-password-error', t('passwords_do_not_match'), 'passwords_do_not_match');
      return;
    }

    hideError('new-password-error');
    btn.disabled = true;
    btn.textContent = t('setting_password');

    supabase.auth.updateUser({ password: password })
      .then(function (result) {
        if (result.error) {
          showError('new-password-error', result.error.message);
          btn.disabled = false;
          btn.textContent = t('set_password_submit');
          return;
        }
        isRecoveryMode = false;
        // Get session and redirect
        supabase.auth.getSession().then(function (sessionResult) {
          if (sessionResult.data.session) {
            verifyAndRedirect(sessionResult.data.session);
          } else {
            showScreen('login-screen');
          }
        });
      })
      .catch(function (err) {
        console.error('Set password error:', err);
        showError('new-password-error', t('set_password_failed'), 'set_password_failed');
        btn.disabled = false;
        btn.textContent = t('set_password_submit');
      });
  }

  // ── Track Employee IP for analytics exclusion ──
  function trackEmployeeIp(accessToken, employee) {
    try {
      fetch('/api/employees/track-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify({
          employee_id: employee.id,
          label: employee.display_name || employee.email
        })
      }).catch(function () {}); // fire-and-forget
    } catch (e) {
      // silent
    }
  }

  // ── Helpers ──
  function showScreen(id) {
    var screens = document.querySelectorAll('.auth-screen');
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.remove('active');
    }
    var target = document.getElementById(id);
    if (target) target.classList.add('active');
    // Hide loading if visible
    var loadingEl = document.getElementById('auth-loading');
    if (loadingEl) loadingEl.style.display = 'none';
  }

  function showError(elementId, message, key) {
    var el = document.getElementById(elementId);
    if (el) {
      el.textContent = message;
      el.dataset.i18nKey = key || '';
      el.classList.add('visible');
    }
  }

  function showSuccess(elementId, message, key) {
    var el = document.getElementById(elementId);
    if (el) {
      el.textContent = message;
      el.dataset.i18nKey = key || '';
      el.classList.add('visible');
    }
  }

  function hideError(elementId) {
    var el = document.getElementById(elementId);
    if (el) {
      el.textContent = '';
      el.dataset.i18nKey = '';
      el.classList.remove('visible');
    }
  }

  function t(key) {
    var lang = translations[currentLang] || translations.en;
    return lang[key] || (translations.en[key] || key);
  }

  function bindLanguageControls() {
    var langButtons = document.querySelectorAll('.lang-btn[data-lang]');
    for (var i = 0; i < langButtons.length; i++) {
      langButtons[i].addEventListener('click', function () {
        var nextLang = this.getAttribute('data-lang');
        if (!nextLang || nextLang === currentLang) return;
        currentLang = nextLang;
        localStorage.setItem('app_lang', currentLang);
        applyLanguage();
      });
    }
  }

  function applyLanguage() {
    if (!isLoginPage) return;

    document.documentElement.lang = currentLang;
    document.title = t('page_title');

    var loadingText = document.querySelector('.auth-loading-text');
    if (loadingText) loadingText.textContent = t('loading_access');

    var textEls = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textEls.length; i++) {
      var key = textEls[i].getAttribute('data-i18n');
      if (key) textEls[i].textContent = t(key);
    }

    var placeholderEls = document.querySelectorAll('[data-i18n-placeholder]');
    for (var j = 0; j < placeholderEls.length; j++) {
      var placeholderKey = placeholderEls[j].getAttribute('data-i18n-placeholder');
      if (placeholderKey) placeholderEls[j].placeholder = t(placeholderKey);
    }

    var langButtons = document.querySelectorAll('.lang-btn[data-lang]');
    for (var k = 0; k < langButtons.length; k++) {
      langButtons[k].classList.toggle('active', langButtons[k].getAttribute('data-lang') === currentLang);
    }

    var feedbackEls = document.querySelectorAll('.auth-error.visible, .auth-success.visible');
    for (var m = 0; m < feedbackEls.length; m++) {
      var feedbackKey = feedbackEls[m].dataset.i18nKey;
      if (feedbackKey) {
        feedbackEls[m].textContent = t(feedbackKey);
      }
    }
  }
})();
