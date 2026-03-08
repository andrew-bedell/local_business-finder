(function() {
  'use strict';

  // ── DOM refs ──
  const nav = document.getElementById('m-nav');
  const hamburger = document.getElementById('m-hamburger');
  const mobileMenu = document.getElementById('m-mobile-menu');
  const leadModal = document.getElementById('m-lead-modal');
  const modalClose = document.getElementById('m-modal-close');
  const leadForm = document.getElementById('m-lead-form');
  const formSubmitBtn = document.getElementById('m-form-submit');
  const formSuccess = document.getElementById('m-form-success');

  // ── Sticky Nav ──
  const heroSection = document.querySelector('.m-hero');
  if (heroSection) {
    const navObserver = new IntersectionObserver(
      function(entries) {
        nav.classList.toggle('m-nav--scrolled', !entries[0].isIntersecting);
      },
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' }
    );
    navObserver.observe(heroSection);
  }

  // ── Smooth Scroll ──
  document.querySelectorAll('a[href^="#"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      closeMobileMenu();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ── Mobile Hamburger ──
  hamburger.addEventListener('click', function() {
    hamburger.classList.toggle('m-active');
    mobileMenu.classList.toggle('m-active');
  });

  function closeMobileMenu() {
    hamburger.classList.remove('m-active');
    mobileMenu.classList.remove('m-active');
  }

  // Close mobile menu on link click
  mobileMenu.querySelectorAll('.m-nav-link').forEach(function(link) {
    link.addEventListener('click', closeMobileMenu);
  });

  // ── Scroll Reveal ──
  var revealElements = document.querySelectorAll('[data-reveal]');
  if (revealElements.length > 0) {
    var revealObserver = new IntersectionObserver(
      function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('m-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    revealElements.forEach(function(el) {
      revealObserver.observe(el);
    });
  }

  // ── FAQ Accordion ──
  document.querySelectorAll('.m-faq-question').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = this.closest('.m-faq-item');
      var wasActive = item.classList.contains('m-active');

      // Close all
      document.querySelectorAll('.m-faq-item.m-active').forEach(function(active) {
        active.classList.remove('m-active');
      });

      // Toggle clicked
      if (!wasActive) {
        item.classList.add('m-active');
      }
    });
  });

  // ── Lead Capture Modal ──
  document.querySelectorAll('[data-open-modal]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      openModal();
    });
  });

  function openModal() {
    leadModal.classList.add('m-active');
    document.body.style.overflow = 'hidden';
    // Focus first input
    var firstInput = leadForm.querySelector('input');
    if (firstInput) setTimeout(function() { firstInput.focus(); }, 100);
  }

  function closeModal() {
    leadModal.classList.remove('m-active');
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeModal);

  // Close on overlay click
  leadModal.addEventListener('click', function(e) {
    if (e.target === leadModal) closeModal();
  });

  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && leadModal.classList.contains('m-active')) {
      closeModal();
    }
  });

  // ── Lead Form Submission ──
  leadForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    var businessName = document.getElementById('lead-business').value.trim();
    var facebookUrl = document.getElementById('lead-facebook').value.trim();
    var googleListingUrl = document.getElementById('lead-google').value.trim();

    if (!businessName) return;

    formSubmitBtn.disabled = true;
    formSubmitBtn.textContent = 'Creando...';

    try {
      var response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_name: businessName, facebook_url: facebookUrl || null, google_listing_url: googleListingUrl || null })
      });

      if (!response.ok) throw new Error('Server error');

      // Show success state
      leadForm.style.display = 'none';
      formSuccess.style.display = 'block';
    } catch (err) {
      console.error('Lead capture error:', err);
      formSubmitBtn.disabled = false;
      formSubmitBtn.textContent = 'Error. Intentar de nuevo.';
      formSubmitBtn.style.background = '#ef4444';
      setTimeout(function() {
        formSubmitBtn.textContent = 'Crear Mi Pagina Gratis';
        formSubmitBtn.style.background = '';
      }, 3000);
    }
  });

  // ── YouTube Lite Embed ──
  var videoContainer = document.getElementById('m-video');
  if (videoContainer) {
    var videoId = videoContainer.getAttribute('data-video-id');
    if (videoId) {
      videoContainer.addEventListener('click', function() {
        var iframe = document.createElement('iframe');
        iframe.setAttribute('src', 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'autoplay; encrypted-media');
        iframe.setAttribute('allowfullscreen', '');
        iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
        videoContainer.innerHTML = '';
        videoContainer.appendChild(iframe);
        videoContainer.style.cursor = 'default';
      });
    } else {
      // No video ID — hide the video container
      videoContainer.style.display = 'none';
    }
  }

  // ── WhatsApp Float: hide near footer ──
  var waFloat = document.querySelector('.m-whatsapp-float');
  var footer = document.querySelector('.m-footer');
  if (waFloat && footer) {
    var footerObserver = new IntersectionObserver(
      function(entries) {
        waFloat.style.opacity = entries[0].isIntersecting ? '0' : '1';
        waFloat.style.pointerEvents = entries[0].isIntersecting ? 'none' : 'auto';
      },
      { threshold: 0.1 }
    );
    footerObserver.observe(footer);
  }

})();
