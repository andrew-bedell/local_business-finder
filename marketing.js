(function() {
  'use strict';

  // ── Translations ──
  var translations = {
    es: {
      nav_about: 'Sobre Nosotros',
      nav_problem: 'El Problema',
      nav_how: 'Cómo Funciona',
      nav_features: 'Funciones',
      nav_pricing: 'Precios',
      nav_cta: 'Empieza gratis',

      hero_title: 'Tus clientes ya te buscan.<br><span>Dales lo que necesitan.</span>',
      hero_sub: 'Tu negocio aparece en Google, pero sin página web tus clientes no encuentran precios, horarios ni cómo contactarte. Nosotros lo resolvemos en 72 horas.',
      hero_cta: 'Empieza gratis — página lista en 72 horas',
      hero_how: 'Ver Cómo Funciona',

      proof_businesses: 'Negocios atendidos',
      proof_delivery: 'Tiempo de entrega',
      proof_cancel: 'Costo de cancelación',
      proof_support: 'Soporte en español',

      problem_tag: 'El Problema',
      problem_title: 'Tus clientes te encuentran en Google. Pero se van porque no tienes página.',
      problem_desc: 'Tu negocio ya aparece en Google Maps y en redes sociales. Pero cuando un cliente quiere saber más — tus precios, horarios o cómo contactarte — no encuentra nada. Y se va con quien sí tiene esa información.',
      problem_li1: 'Tus clientes te encuentran en Google pero no pueden ver tus servicios ni precios',
      problem_li2: 'Pierdes credibilidad frente a competidores que sí tienen página',
      problem_li3: 'No tienes un lugar donde mostrar tu menú, catálogo o portafolio',
      problem_li4: 'Tus clientes no pueden agendar citas ni contactarte fácilmente',
      problem_li5: 'Estás dejando dinero en la mesa cada día que pasa sin página',

      solution_tag: 'Cómo Funciona',
      solution_title: 'Tu página web en 3 pasos simples',
      solution_sub: 'Nos encargamos de todo. Tú solo revisas y apruebas.',
      step1_title: 'Ingresa tu información',
      step1_desc: 'Danos el nombre de tu negocio, tu página de Facebook y tu perfil de Google. Con eso recopilamos fotos, reseñas, horarios y todo lo necesario.',
      step2_title: 'Tú la revisas',
      step2_desc: 'Te enviamos una vista previa de tu página web. Tú la revisas, nos dices si quieres cambios, y la ajustamos hasta que quede perfecta.',
      step3_title: 'La lanzamos al mundo',
      step3_desc: 'Publicamos tu página, la conectamos a Google y la optimizamos para que tus clientes te encuentren. Lista para recibir visitas y clientes.',

      case_tag: 'Caso de Éxito',
      case_title: 'María aumentó sus citas un 40% en el primer mes',
      case_desc: 'María tiene un salón de uñas en Bogotá. Sus clientes la encontraban en Google pero no podían ver sus servicios ni agendar citas. Con su nueva página web, ahora recibe reservas directas y sus clientes tienen toda la información que necesitan.',
      case_stat1: 'Más clientes',
      case_stat2: 'Más visitas',
      case_stat3: 'Citas perdidas',

      features_tag: 'Funciones',
      features_title: 'Todo lo que tu página necesita',
      features_sub: 'Cada página viene con todo lo necesario para que tu negocio brille en internet.',
      feat1_title: 'Página web profesional',
      feat1_desc: 'Diseño moderno y profesional que refleja la calidad de tu negocio. Personalizada con tus fotos, colores y estilo.',
      feat2_title: 'Optimizada para celular',
      feat2_desc: 'Tu página se ve perfecta en cualquier dispositivo. El 80% de tus clientes te buscarán desde su celular.',
      feat3_title: 'Conectada a Google',
      feat3_desc: 'Vinculamos tu página web con tu perfil de Google para que cuando tus clientes te encuentren, vean toda tu información completa.',
      feat4_title: 'Sistema de citas',
      feat4_desc: 'Tus clientes pueden agendar citas directamente desde tu página. Sin llamadas, sin mensajes, sin complicaciones.',
      feat5_title: 'Redes sociales integradas',
      feat5_desc: 'Conectamos tu Instagram, Facebook y WhatsApp para que tus clientes te sigan y te contacten fácilmente.',
      feat6_title: 'Seguimiento de visitas',
      feat6_desc: 'Panel de control donde ves cuántas personas visitan tu página, de dónde vienen y qué hacen. Datos reales, sin adivinar.',

      pricing_tag: 'Precios',
      pricing_title: 'Simple y transparente',
      pricing_sub: 'Sin sorpresas, sin costos ocultos. Cancela cuando quieras.',
      pricing_note: 'Sin costo de instalación. Sin contratos.',
      pricing_f1: 'Página web profesional personalizada',
      pricing_f2: 'Optimizada para celular y Google',
      pricing_f3: 'Dominio personalizado incluido',
      pricing_f4: 'Hosting y SSL incluidos',
      pricing_f5: 'Cambios y actualizaciones ilimitados',
      pricing_f6: 'Soporte en español por WhatsApp',
      pricing_f7: 'Panel de analíticas incluido',
      pricing_cta: 'Comenzar Ahora',

      faq_tag: 'Preguntas Frecuentes',
      faq_title: 'Resolvemos tus dudas',
      faq_q1: 'Necesito saber de tecnología para tener mi página?',
      faq_a1: 'No, para nada. Nosotros nos encargamos de todo: diseño, contenido, publicación y mantenimiento. Tú solo nos dices qué quieres y nosotros lo hacemos realidad.',
      faq_q2: 'Cuánto tiempo toma tener mi página lista?',
      faq_a2: 'Tu página estará lista en 72 horas o menos. Recopilamos la información de tu negocio, creamos tu página y te la enviamos para que la revises antes de publicarla.',
      faq_q3: 'Puedo cancelar en cualquier momento?',
      faq_a3: 'Sí, puedes cancelar cuando quieras. No hay contratos a largo plazo ni penalizaciones. Si cancelas, tu página se desactiva al final del período pagado.',
      faq_q4: 'Qué pasa si quiero hacer cambios en mi página?',
      faq_a4: 'Cambios ilimitados están incluidos en tu plan. Solo envías un mensaje por WhatsApp con lo que quieres cambiar y nosotros lo actualizamos, generalmente en menos de 24 horas.',
      faq_q5: 'Mi negocio es muy pequeño, vale la pena tener página web?',
      faq_a5: 'Absolutamente. Los negocios pequeños son los que más se benefician. Tus clientes ya te buscan en Google — una página web les da la información que necesitan para elegirte a ti en vez de a la competencia.',

      cta_title: 'Tus clientes ya te están buscando. Dales una razón para quedarse.',
      cta_desc: 'Cada día sin página web es dinero que pierdes. Empieza hoy y tenla lista en 72 horas.',
      cta_btn: 'Empieza gratis — página lista en 72 horas',
      sticky_cta: 'Empieza gratis — página lista en 72 horas',

      footer_desc: 'Creamos páginas web profesionales para negocios locales en Latinoamérica. Simple, rápido y sin complicaciones.',
      footer_links: 'Enlaces',
      footer_about: 'Sobre Nosotros',
      footer_contact: 'Contacto',
      footer_copy: '&copy; 2026 AhoraTengoPagina. Todos los derechos reservados.',

      modal_title: 'Crea tu página gratis',
      modal_name_label: 'Tu nombre',
      modal_name_ph: 'Ej: María García',
      modal_business_label: 'Nombre de tu negocio',
      modal_business_ph: 'Ej: Salón de Uñas María',
      modal_whatsapp_label: 'Tu WhatsApp',
      modal_whatsapp_ph: '999 123 4567',
      modal_email_label: 'Tu email',
      modal_email_ph: 'Ej: maria@gmail.com',
      modal_address_label: 'Dirección de tu negocio',
      modal_address_ph: 'Ej: Calle 60 #500, Centro, Mérida',
      modal_disclaimer: 'Al hacer clic te vamos a contactar por WhatsApp. Cuéntanos un poco sobre tu negocio y tu diseñador personal te tendrá una página lista para revisar en 72 horas.',
      modal_submit: 'Hablar con mi diseñador \u2192',
      modal_sending: 'Enviando...',
      modal_error: 'Hubo un error. Por favor intenta de nuevo.',

    },
    en: {
      nav_about: 'About Us',
      nav_problem: 'The Problem',
      nav_how: 'How It Works',
      nav_features: 'Features',
      nav_pricing: 'Pricing',
      nav_cta: 'Start free',

      hero_title: 'Your customers are already looking.<br><span>Give them what they need.</span>',
      hero_sub: 'Your business shows up on Google, but without a website your customers can\'t find prices, hours, or how to reach you. We fix that in 72 hours.',
      hero_cta: 'Start free — website ready in 72 hours',
      hero_how: 'See How It Works',

      proof_businesses: 'Businesses served',
      proof_delivery: 'Delivery time',
      proof_cancel: 'Cancellation cost',
      proof_support: 'Spanish support',

      problem_tag: 'The Problem',
      problem_title: 'Your customers find you on Google. But they leave because you have no website.',
      problem_desc: 'Your business already shows up on Google Maps and social media. But when a customer wants to know more — your prices, hours, or how to contact you — they find nothing. And they go to someone who does have that info.',
      problem_li1: 'Customers find you on Google but can\'t see your services or prices',
      problem_li2: 'You lose credibility against competitors who have a website',
      problem_li3: 'You have nowhere to show your menu, catalog, or portfolio',
      problem_li4: 'Customers can\'t book appointments or contact you easily',
      problem_li5: 'You\'re leaving money on the table every day without a website',

      solution_tag: 'How It Works',
      solution_title: 'Your website in 3 simple steps',
      solution_sub: 'We handle everything. You just review and approve.',
      step1_title: 'Enter your information',
      step1_desc: 'Give us your business name, Facebook page, and Google profile. We\'ll gather photos, reviews, hours, and everything we need.',
      step2_title: 'You review it',
      step2_desc: 'We send you a preview of your website. You review it, tell us if you want changes, and we adjust it until it\'s perfect.',
      step3_title: 'We launch it',
      step3_desc: 'We publish your website, connect it to Google, and optimize it so your customers can find you. Ready to receive visits and clients.',

      case_tag: 'Success Story',
      case_title: 'Maria increased her appointments by 40% in the first month',
      case_desc: 'Maria runs a nail salon in Bogota. Customers found her on Google but couldn\'t see her services or book appointments. With her new website, she now receives direct bookings and her customers have all the info they need.',
      case_stat1: 'More clients',
      case_stat2: 'More visits',
      case_stat3: 'Lost appointments',

      features_tag: 'Features',
      features_title: 'Everything your website needs',
      features_sub: 'Every website comes with everything your business needs to shine online.',
      feat1_title: 'Professional website',
      feat1_desc: 'Modern, professional design that reflects the quality of your business. Customized with your photos, colors, and style.',
      feat2_title: 'Mobile optimized',
      feat2_desc: 'Your website looks perfect on any device. 80% of your customers will search from their phone.',
      feat3_title: 'Connected to Google',
      feat3_desc: 'We link your website to your Google profile so when customers find you, they see all your information in one place.',
      feat4_title: 'Appointment system',
      feat4_desc: 'Your customers can book appointments directly from your website. No calls, no messages, no hassle.',
      feat5_title: 'Social media integrated',
      feat5_desc: 'We connect your Instagram, Facebook, and WhatsApp so your customers can follow and contact you easily.',
      feat6_title: 'Visit tracking',
      feat6_desc: 'Dashboard where you see how many people visit your website, where they come from, and what they do. Real data, no guessing.',

      pricing_tag: 'Pricing',
      pricing_title: 'Simple and transparent',
      pricing_sub: 'No surprises, no hidden costs. Cancel anytime.',
      pricing_note: 'No setup fee. No contracts.',
      pricing_f1: 'Custom professional website',
      pricing_f2: 'Optimized for mobile and Google',
      pricing_f3: 'Custom domain included',
      pricing_f4: 'Hosting and SSL included',
      pricing_f5: 'Unlimited changes and updates',
      pricing_f6: 'Spanish support via WhatsApp',
      pricing_f7: 'Analytics dashboard included',
      pricing_cta: 'Get Started',

      faq_tag: 'Frequently Asked Questions',
      faq_title: 'We answer your questions',
      faq_q1: 'Do I need to know about technology to have my website?',
      faq_a1: 'Not at all. We handle everything: design, content, publishing, and maintenance. You just tell us what you want and we make it happen.',
      faq_q2: 'How long does it take to get my website ready?',
      faq_a2: 'Your website will be ready in 72 hours or less. We gather your business information, create your website, and send it for your review before publishing.',
      faq_q3: 'Can I cancel at any time?',
      faq_a3: 'Yes, you can cancel whenever you want. No long-term contracts or penalties. If you cancel, your website is deactivated at the end of the paid period.',
      faq_q4: 'What if I want to make changes to my website?',
      faq_a4: 'Unlimited changes are included in your plan. Just send a WhatsApp message with what you want to change and we\'ll update it, usually in less than 24 hours.',
      faq_q5: 'My business is very small, is it worth having a website?',
      faq_a5: 'Absolutely. Small businesses benefit the most. Your customers are already searching for you on Google — a website gives them the information they need to choose you over the competition.',

      cta_title: 'Your customers are already searching for you. Give them a reason to stay.',
      cta_desc: 'Every day without a website is money you\'re losing. Start today and have it ready in 72 hours.',
      cta_btn: 'Start free — website ready in 72 hours',
      sticky_cta: 'Start free — website ready in 72 hours',

      footer_desc: 'We create professional websites for local businesses in Latin America. Simple, fast, and hassle-free.',
      footer_links: 'Links',
      footer_about: 'About Us',
      footer_contact: 'Contact',
      footer_copy: '&copy; 2026 AhoraTengoPagina. All rights reserved.',

      modal_title: 'Create your free page',
      modal_name_label: 'Your name',
      modal_name_ph: 'E.g.: Maria Garcia',
      modal_business_label: 'Your business name',
      modal_business_ph: 'E.g.: Maria\'s Nail Salon',
      modal_whatsapp_label: 'Your WhatsApp',
      modal_whatsapp_ph: '999 123 4567',
      modal_email_label: 'Your email',
      modal_email_ph: 'E.g.: maria@gmail.com',
      modal_address_label: 'Your business address',
      modal_address_ph: 'E.g.: 123 Main St, Merida',
      modal_disclaimer: 'When you click, we\'ll contact you via WhatsApp. Tell us a bit about your business and your personal designer will have a page ready for you to review in 72 hours.',
      modal_submit: 'Talk to my designer \u2192',
      modal_sending: 'Sending...',
      modal_error: 'There was an error. Please try again.',

    },
    // ── Country-specific overrides (only keys that differ from base es) ──
    es_CO: {
      modal_address_ph: 'Ej: Calle 80 #45-20, Medellín',
      case_desc: 'María tiene un salón de uñas en Bogotá. Sus clientes la encontraban en Google pero no podían ver sus servicios ni agendar citas. Con su nueva página web, ahora recibe reservas directas y sus clientes tienen toda la información que necesitan.',
    },
    es_EC: {
      modal_address_ph: 'Ej: Av. 6 de Diciembre N34-120, Quito',
      case_desc: 'María tiene un salón de uñas en Quito. Sus clientes la encontraban en Google pero no podían ver sus servicios ni agendar citas. Con su nueva página web, ahora recibe reservas directas y sus clientes tienen toda la información que necesitan.',
    }
  };

  var currentLang = localStorage.getItem('m_lang') || 'es';
  var currentCountry = localStorage.getItem('m_country') || null;

  function t(key) {
    // Check country-specific override for Spanish
    if (currentLang === 'es' && currentCountry && currentCountry !== 'MX') {
      var countryKey = 'es_' + currentCountry;
      if (translations[countryKey] && translations[countryKey][key]) {
        return translations[countryKey][key];
      }
    }
    return (translations[currentLang] && translations[currentLang][key]) || key;
  }

  function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.documentElement.lang = currentLang;
    // Toggle data-lang blocks (used on about page)
    var aboutSection = document.querySelector('.m-about');
    if (aboutSection) {
      aboutSection.classList.remove('m-lang-es', 'm-lang-en');
      aboutSection.classList.add('m-lang-' + currentLang);
    }
    // Update toggle button labels
    var otherLang = currentLang === 'es' ? 'EN' : 'ES';
    var toggleDesktop = document.getElementById('m-lang-toggle');
    var toggleMobile = document.getElementById('m-lang-toggle-mobile');
    if (toggleDesktop) toggleDesktop.textContent = otherLang;
    if (toggleMobile) toggleMobile.textContent = otherLang;
  }

  function toggleLanguage() {
    currentLang = currentLang === 'es' ? 'en' : 'es';
    localStorage.setItem('m_lang', currentLang);
    applyLanguage();
  }

  // ── DOM refs ──
  var nav = document.getElementById('m-nav');
  var hamburger = document.getElementById('m-hamburger');
  var mobileMenu = document.getElementById('m-mobile-menu');
  var leadModal = document.getElementById('m-lead-modal');
  var modalClose = document.getElementById('m-modal-close');
  var leadForm = document.getElementById('m-lead-form');
  var formSubmitBtn = document.getElementById('m-form-submit');
  var formSuccess = document.getElementById('m-form-success');
  var pricingGrid = document.getElementById('pricing-grid');

  // ── Language Toggle ──
  document.getElementById('m-lang-toggle').addEventListener('click', toggleLanguage);
  document.getElementById('m-lang-toggle-mobile').addEventListener('click', toggleLanguage);

  // ── Country Detection ──
  var DIAL_CODES = { MX: '52', CO: '57', EC: '593' };
  var FALLBACK_PRICING = {
    MX: { price: '$250', currency: 'MXN' },
    CO: { price: '$100,000', currency: 'COP' },
    EC: { price: '$15', currency: 'USD' },
  };

  function detectCountry() {
    if (currentCountry) {
      onCountryReady();
      return;
    }
    // URL param override: ?country=CO
    var urlCountry = (new URLSearchParams(window.location.search).get('country') || '').toUpperCase();
    if (urlCountry && /^[A-Z]{2}$/.test(urlCountry)) {
      currentCountry = urlCountry;
      localStorage.setItem('m_country', currentCountry);
      onCountryReady();
      return;
    }
    fetch('/api/geo')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        currentCountry = data.country || 'MX';
        localStorage.setItem('m_country', currentCountry);
        onCountryReady();
      })
      .catch(function() {
        currentCountry = 'MX';
        localStorage.setItem('m_country', currentCountry);
        onCountryReady();
      });
  }

  function onCountryReady() {
    applyLanguage();
    updateCountryDefaults();
    if (pricingGrid) loadPricingProducts();
  }

  function updateCountryDefaults() {
    var dialCode = DIAL_CODES[currentCountry];
    if (!dialCode) return;
    var select = document.getElementById('lead-country-code');
    if (select) {
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === dialCode) {
          select.selectedIndex = i;
          break;
        }
      }
    }
  }

  // Apply language immediately, then detect country (may re-apply with overrides)
  applyLanguage();
  detectCountry();

  // ── Sticky Nav ──
  var heroSection = document.querySelector('.m-hero');
  if (heroSection) {
    var navObserver = new IntersectionObserver(
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
  var WHATSAPP_NUMBER = '529991095806'; // Our business WhatsApp number

  var formError = document.getElementById('m-form-error');

  leadForm.addEventListener('submit', function(e) {
    e.preventDefault();

    var customerName = document.getElementById('lead-name').value.trim();
    var businessName = document.getElementById('lead-business').value.trim();
    var businessAddress = document.getElementById('lead-address').value.trim();
    var countryCode = document.getElementById('lead-country-code').value;
    var rawPhone = document.getElementById('lead-whatsapp').value.trim();
    var customerEmail = document.getElementById('lead-email').value.trim();

    if (!customerName || !businessName || !businessAddress || !rawPhone || !customerEmail) return;

    // Build E.164 number: strip non-digits from input, prepend +countryCode
    var digits = rawPhone.replace(/[^\d]/g, '');
    // If user typed the country code already, don't double it
    var whatsappNumber = digits.startsWith(countryCode) ? '+' + digits : '+' + countryCode + digits;

    formSubmitBtn.disabled = true;
    formSubmitBtn.textContent = t('modal_sending');
    if (formError) formError.style.display = 'none';

    // Call free-signup API to create customer record with matching
    fetch('/api/free-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: businessName,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: whatsappNumber,
        address: businessAddress,
        countryCode: countryCode,
      }),
    }).then(function(res) {
      if (res.ok || res.status === 409) {
        // Success or already exists — save lead (non-blocking) and open WhatsApp
        fetch('/api/leads/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business_name: businessName,
            whatsapp_number: whatsappNumber,
            email: customerEmail,
            name: customerName,
            address: businessAddress,
            country_code: currentCountry,
          }),
        }).catch(function(err) {
          console.warn('Lead capture error (non-blocking):', err);
        });

        var message = 'Hola! Soy ' + customerName + '. Quiero crear mi página web para mi negocio: ' + businessName;
        var waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
        window.open(waUrl, '_blank');
        closeModal();
        leadForm.reset();
      } else {
        // Show error
        if (formError) {
          formError.textContent = t('modal_error');
          formError.style.display = 'block';
        }
      }
    }).catch(function(err) {
      console.error('Free signup error:', err);
      if (formError) {
        formError.textContent = t('modal_error');
        formError.style.display = 'block';
      }
    }).finally(function() {
      formSubmitBtn.disabled = false;
      formSubmitBtn.textContent = t('modal_submit');
    });
  });

  // ── YouTube Lite Embed ──
  var videoContainer = document.getElementById('m-video');
  if (videoContainer) {
    var videoId = videoContainer.getAttribute('data-video-id');
    if (videoId) {
      // Set YouTube thumbnail dynamically from video ID
      var thumb = videoContainer.querySelector('.m-video-thumb');
      if (thumb) {
        thumb.src = 'https://img.youtube.com/vi/' + videoId + '/maxresdefault.jpg';
        thumb.onerror = function() { this.src = 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg'; };
      }
      videoContainer.addEventListener('click', function() {
        var iframe = document.createElement('iframe');
        iframe.setAttribute('src', 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0');
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

  // ── WhatsApp Button ──
  var WHATSAPP_WIDGET_NUMBER = '529991095806';
  var waFloatBtn = document.getElementById('m-wa-float-btn');

  if (waFloatBtn) {
    waFloatBtn.addEventListener('click', function() {
      var defaultMsg = encodeURIComponent('Hola! Quiero más información sobre sus servicios de páginas web');
      window.open('https://wa.me/' + WHATSAPP_WIDGET_NUMBER + '?text=' + defaultMsg, '_blank');
    });

    // Hide float button near footer
    var footer = document.querySelector('.m-footer');
    if (footer) {
      var footerObserver = new IntersectionObserver(
        function(entries) {
          var hidden = entries[0].isIntersecting;
          waFloatBtn.style.opacity = hidden ? '0' : '1';
          waFloatBtn.style.pointerEvents = hidden ? 'none' : 'auto';
        },
        { threshold: 0.1 }
      );
      footerObserver.observe(footer);
    }
  }

  // ── Sticky CTA ──
  var stickyCta = document.getElementById('m-sticky-cta');
  if (stickyCta) {
    var stickyBtn = stickyCta.querySelector('[data-open-modal]');
    if (stickyBtn) {
      stickyBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openModal();
      });
    }
    // Show sticky CTA after scrolling past hero
    var heroEl = document.querySelector('.m-hero');
    var footerEl = document.querySelector('.m-footer');
    if (heroEl) {
      var stickyObserver = new IntersectionObserver(
        function(entries) {
          var pastHero = !entries[0].isIntersecting;
          stickyCta.classList.toggle('m-visible', pastHero);
        },
        { threshold: 0 }
      );
      stickyObserver.observe(heroEl);
    }
    // Hide near footer
    if (footerEl) {
      var stickyFooterObserver = new IntersectionObserver(
        function(entries) {
          if (entries[0].isIntersecting) {
            stickyCta.classList.remove('m-visible');
          }
        },
        { threshold: 0.1 }
      );
      stickyFooterObserver.observe(footerEl);
    }
  }

  // ── Dynamic Pricing Cards ──

  function loadPricingProducts() {
    var url = '/api/products/list';
    if (currentCountry) url += '?country=' + currentCountry;
    fetch(url)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var products = (data.products || []).slice(0, 3);
        if (products.length === 0) {
          renderFallbackPricing();
          return;
        }
        pricingGrid.setAttribute('data-cols', products.length);
        pricingGrid.innerHTML = products.map(function(p, i) {
          var isFeatured = products.length > 1 && i === 1;
          return renderPricingCard(p, isFeatured);
        }).join('');

        // Attach CTA click handlers
        pricingGrid.querySelectorAll('[data-open-modal]').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
          });
        });

        // Add reveal animation
        pricingGrid.querySelectorAll('.m-pricing-card').forEach(function(card) {
          card.classList.add('m-visible');
        });
      })
      .catch(function() {
        renderFallbackPricing();
      });
  }

  function renderPricingCard(product, isFeatured) {
    var symbol = '$';
    var price = parseFloat(product.price);
    var formattedPrice = symbol + price.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    var intervalLabels = { monthly: ' / mes', yearly: ' / año', one_time: '' };
    var intervalText = (product.currency || 'MXN') + (intervalLabels[product.billing_interval] || '');
    var features = product.features || [];
    var featuredClass = isFeatured ? ' m-pricing-featured' : '';
    var badgeHtml = isFeatured ? '<span class="m-pricing-badge">Popular</span>' : '';
    var noteKey = currentLang === 'en' ? 'No setup fee. No contracts.' : 'Sin costo de instalación. Sin contratos.';

    var featuresHtml = features.map(function(f) {
      return '<div class="m-pricing-feature"><span class="m-pricing-check">&#10003;</span><span>' + escapeHtml(f) + '</span></div>';
    }).join('');

    var descHtml = product.description ? '<p class="m-pricing-desc">' + escapeHtml(product.description) + '</p>' : '';
    var ctaText = price === 0 ? (currentLang === 'en' ? 'Free Trial' : 'Prueba Gratis') : t('pricing_cta');

    return '<div class="m-pricing-card' + featuredClass + '" data-reveal>' +
      badgeHtml +
      '<div class="m-pricing-price">' + formattedPrice + ' <span>' + intervalText + '</span></div>' +
      '<p class="m-pricing-note">' + noteKey + '</p>' +
      (product.name ? '<p style="font-size:16px;font-weight:700;margin-bottom:16px;color:#0c1b33">' + escapeHtml(product.name) + '</p>' : '') +
      descHtml +
      '<div class="m-pricing-features">' + featuresHtml + '</div>' +
      (price > 0 && product.id ? '<a href="/checkout/' + encodeURIComponent(product.id) + '" class="m-pricing-cta">' + ctaText + '</a>' : '<button class="m-pricing-cta" data-open-modal>' + ctaText + '</button>') +
    '</div>';
  }

  function renderFallbackPricing() {
    // Static fallback if API fails — show country-appropriate pricing
    var fb = FALLBACK_PRICING[currentCountry] || FALLBACK_PRICING.MX;
    pricingGrid.setAttribute('data-cols', '1');
    pricingGrid.innerHTML =
      '<div class="m-pricing-card m-visible" data-reveal>' +
        '<div class="m-pricing-price">' + fb.price + ' <span>' + fb.currency + ' / mes</span></div>' +
        '<p class="m-pricing-note">' + t('pricing_note') + '</p>' +
        '<div class="m-pricing-features">' +
          '<div class="m-pricing-feature"><span class="m-pricing-check">&#10003;</span><span>' + t('pricing_f1') + '</span></div>' +
          '<div class="m-pricing-feature"><span class="m-pricing-check">&#10003;</span><span>' + t('pricing_f2') + '</span></div>' +
          '<div class="m-pricing-feature"><span class="m-pricing-check">&#10003;</span><span>' + t('pricing_f3') + '</span></div>' +
          '<div class="m-pricing-feature"><span class="m-pricing-check">&#10003;</span><span>' + t('pricing_f4') + '</span></div>' +
          '<div class="m-pricing-feature"><span class="m-pricing-check">&#10003;</span><span>' + t('pricing_f5') + '</span></div>' +
          '<div class="m-pricing-feature"><span class="m-pricing-check">&#10003;</span><span>' + t('pricing_f6') + '</span></div>' +
          '<div class="m-pricing-feature"><span class="m-pricing-check">&#10003;</span><span>' + t('pricing_f7') + '</span></div>' +
        '</div>' +
        '<button class="m-pricing-cta" data-open-modal>' + t('pricing_cta') + '</button>' +
      '</div>';

    pricingGrid.querySelectorAll('[data-open-modal]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        openModal();
      });
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

})();
