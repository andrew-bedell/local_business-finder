// Employee Auth Module — handles login page logic and auth guard for protected pages
(function () {
  'use strict';

  var SUPABASE_URL = 'https://xagfwyknlutmmtfufbfi.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_2ZsXzfuXEPF7MJxxB7mA-Q_H--jfttp';

  if (typeof window.supabase === 'undefined') {
    console.error('Supabase SDK not loaded');
    return;
  }

  var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  var isLoginPage = window.location.pathname.indexOf('/employee/login') !== -1;
  var isRecoveryMode = false;

  if (isLoginPage) {
    initLoginPage();
  } else {
    checkAuthAndRedirect();
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
        .select('id, email, display_name, role, is_active')
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
    // Check URL hash for recovery/invite tokens
    var hash = window.location.hash || '';
    if (hash.indexOf('type=recovery') !== -1 || hash.indexOf('type=invite') !== -1) {
      isRecoveryMode = true;
    }

    // Check for error params
    var params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'unauthorized') {
      showError('login-error', 'You do not have employee access. Contact your administrator.');
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
    btn.textContent = 'Logging in…';

    supabase.auth.signInWithPassword({ email: email, password: password })
      .then(function (result) {
        if (result.error) {
          showError('login-error', 'Invalid email or password.');
          btn.disabled = false;
          btn.textContent = 'Log In';
          return;
        }
        verifyAndRedirect(result.data.session);
      })
      .catch(function (err) {
        console.error('Login error:', err);
        showError('login-error', 'Login failed. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Log In';
      });
  }

  function verifyAndRedirect(session) {
    supabase.from('employees')
      .select('id, email, display_name, role, is_active')
      .eq('auth_user_id', session.user.id)
      .eq('is_active', true)
      .single()
      .then(function (empResult) {
        if (empResult.error || !empResult.data) {
          supabase.auth.signOut();
          showError('login-error', 'You do not have employee access. Contact your administrator.');
          var btn = document.getElementById('login-btn');
          if (btn) { btn.disabled = false; btn.textContent = 'Log In'; }
          showScreen('login-screen');
          return;
        }

        // Update joined_at if this is the first login
        if (!empResult.data.joined_at) {
          supabase.from('employees')
            .update({ joined_at: new Date().toISOString() })
            .eq('id', empResult.data.id)
            .then(function () {})
            .catch(function () {});
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
    btn.textContent = 'Sending…';

    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/employee/login'
    }).then(function (result) {
      btn.disabled = false;
      btn.textContent = 'Send Reset Link';
      if (result.error) {
        showError('reset-error', result.error.message);
      } else {
        var successEl = document.getElementById('reset-success');
        if (successEl) {
          successEl.textContent = 'Check your email for the reset link.';
          successEl.classList.add('visible');
        }
      }
    }).catch(function (err) {
      console.error('Reset error:', err);
      showError('reset-error', 'Failed to send reset email.');
      btn.disabled = false;
      btn.textContent = 'Send Reset Link';
    });
  }

  function handleSetPassword() {
    var password = document.getElementById('new-password').value || '';
    var confirm = document.getElementById('confirm-password').value || '';
    var btn = document.getElementById('set-password-btn');

    if (!password || password.length < 6) {
      showError('new-password-error', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      showError('new-password-error', 'Passwords do not match.');
      return;
    }

    hideError('new-password-error');
    btn.disabled = true;
    btn.textContent = 'Setting password…';

    supabase.auth.updateUser({ password: password })
      .then(function (result) {
        if (result.error) {
          showError('new-password-error', result.error.message);
          btn.disabled = false;
          btn.textContent = 'Set Password';
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
        showError('new-password-error', 'Failed to set password. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Set Password';
      });
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

  function showError(elementId, message) {
    var el = document.getElementById(elementId);
    if (el) {
      el.textContent = message;
      el.classList.add('visible');
    }
  }

  function hideError(elementId) {
    var el = document.getElementById(elementId);
    if (el) {
      el.textContent = '';
      el.classList.remove('visible');
    }
  }
})();
