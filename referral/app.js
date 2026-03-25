// Referral landing page logic
// Validates the referral code from URL, shows referrer info, submits lead
// Stores referral code in localStorage for persistence across sessions

(function () {
  'use strict';

  var referralCode = '';
  var referrerBusinessName = '';

  function init() {
    // Extract code from URL path: /ref/MARIA42
    var parts = window.location.pathname.split('/');
    var refIndex = parts.indexOf('ref');
    if (refIndex >= 0 && parts[refIndex + 1]) {
      referralCode = parts[refIndex + 1].toUpperCase();
    }

    if (!referralCode) {
      showInvalid();
      return;
    }

    // Persist referral code in localStorage immediately
    try {
      localStorage.setItem('referral_code', referralCode);
      localStorage.setItem('referral_code_at', new Date().toISOString());
    } catch (e) { /* private browsing */ }

    validateCode(referralCode);

    var form = document.getElementById('ref-form');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }

    // Bind "buy now" button
    var buyBtn = document.getElementById('ref-buy-btn');
    if (buyBtn) {
      buyBtn.addEventListener('click', function () {
        // Record the referral with minimal info before redirecting to checkout
        recordReferralAndRedirect();
      });
    }
  }

  async function validateCode(code) {
    try {
      var res = await fetch('/api/referrals/validate?code=' + encodeURIComponent(code));
      var data = await res.json();

      if (!data.valid) {
        showInvalid();
        // Clear invalid code from localStorage
        try { localStorage.removeItem('referral_code'); localStorage.removeItem('referral_code_at'); } catch (e) {}
        return;
      }

      referrerBusinessName = data.referrerBusinessName || '';

      // Show referrer badge
      var badge = document.getElementById('ref-badge');
      var nameEl = document.getElementById('ref-referrer-name');
      if (badge && nameEl && referrerBusinessName) {
        nameEl.textContent = referrerBusinessName;
        badge.style.display = '';
      }

      // Also store referrer name for checkout page
      try {
        localStorage.setItem('referral_referrer', referrerBusinessName);
      } catch (e) {}
    } catch (err) {
      console.error('Validate error:', err);
      // Still show the form — don't block on validation failure
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    var businessName = document.getElementById('ref-business').value.trim();
    var phone = document.getElementById('ref-phone').value.trim();
    var email = document.getElementById('ref-email').value.trim();
    var city = document.getElementById('ref-city').value.trim();

    if (!businessName || !phone) return;

    var btn = document.getElementById('ref-submit');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Enviando...';
    }

    try {
      var res = await fetch('/api/referrals/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode: referralCode,
          businessName: businessName,
          phone: phone,
          email: email || null,
          city: city || null,
        }),
      });

      var data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error');
      }

      // Show success
      document.getElementById('ref-form').style.display = 'none';
      var buySection = document.getElementById('ref-buy-section');
      if (buySection) buySection.style.display = 'none';
      document.getElementById('ref-success').style.display = '';

      // Show WhatsApp link to our business number
      var waNumber = '529991095806';
      var waLink = document.getElementById('ref-wa-link');
      if (waLink) {
        var waMessage = 'Hola! Me registre a traves de un referido (' + referralCode + '). Mi negocio es ' + businessName;
        waLink.href = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(waMessage);
        waLink.style.display = '';
      }

      // Show checkout link in success state
      var checkoutLink = document.getElementById('ref-checkout-link');
      if (checkoutLink) {
        checkoutLink.style.display = '';
      }
    } catch (err) {
      console.error('Submit error:', err);
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Quiero mi pagina web';
      }
      alert('Error al enviar. Intenta de nuevo.');
    }
  }

  function recordReferralAndRedirect() {
    // Redirect to pricing page — the checkout will pick up the referral code from localStorage
    window.location.href = '/#precios';
  }

  function showInvalid() {
    var form = document.getElementById('ref-form');
    var invalid = document.getElementById('ref-invalid');
    var badge = document.getElementById('ref-badge');
    var title = document.querySelector('.ref-title');
    var subtitle = document.querySelector('.ref-subtitle');
    var buySection = document.getElementById('ref-buy-section');

    if (form) form.style.display = 'none';
    if (invalid) invalid.style.display = '';
    if (badge) badge.style.display = 'none';
    if (title) title.style.display = 'none';
    if (subtitle) subtitle.style.display = 'none';
    if (buySection) buySection.style.display = 'none';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
