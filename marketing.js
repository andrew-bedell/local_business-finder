(function() {
  'use strict';

  // ── Translations ──
  var translations = {
    es: {
      nav_problem: 'El Problema',
      nav_how: 'Como Funciona',
      nav_features: 'Funciones',
      nav_pricing: 'Precios',
      nav_cta: 'Crea Tu Pagina Gratis',

      hero_title: 'Tu negocio ya existe.<br><span>Ahora ponlo en internet.</span>',
      hero_sub: 'Creamos tu pagina web profesional en 72 horas. Sin complicaciones, sin contratos largos. Solo resultados.',
      hero_cta: 'Crea Tu Pagina Gratis',
      hero_how: 'Ver Como Funciona',

      proof_businesses: 'Negocios atendidos',
      proof_delivery: 'Tiempo de entrega',
      proof_cancel: 'Costo de cancelacion',
      proof_support: 'Soporte en espanol',

      problem_tag: 'El Problema',
      problem_title: 'Tus clientes te buscan en Google. Si no apareces, no existes.',
      problem_desc: 'El 97% de las personas buscan negocios locales en internet antes de visitarlos. Sin una pagina web, estas perdiendo clientes todos los dias.',
      problem_li1: 'Tus clientes no pueden encontrarte cuando buscan en Google',
      problem_li2: 'Pierdes credibilidad frente a competidores que si tienen pagina',
      problem_li3: 'No puedes mostrar tus servicios, precios ni horarios facilmente',
      problem_li4: 'Dependes solo del trafico que pasa por tu puerta',
      problem_li5: 'No tienes forma de recibir citas o consultas en linea',

      solution_tag: 'Como Funciona',
      solution_title: 'Tu pagina web en 3 pasos simples',
      solution_sub: 'Nos encargamos de todo. Tu solo revisas y apruebas.',
      step1_title: 'Ingresa tu informacion',
      step1_desc: 'Danos el nombre de tu negocio, tu pagina de Facebook y tu perfil de Google. Con eso recopilamos fotos, resenas, horarios y todo lo necesario.',
      step2_title: 'Tu la revisas',
      step2_desc: 'Te enviamos una vista previa de tu pagina web. Tu la revisas, nos dices si quieres cambios, y la ajustamos hasta que quede perfecta.',
      step3_title: 'La lanzamos al mundo',
      step3_desc: 'Publicamos tu pagina, la conectamos a Google y la optimizamos para que tus clientes te encuentren. Lista para recibir visitas y clientes.',

      case_tag: 'Caso de Exito',
      case_title: 'Maria aumento sus citas un 40% en el primer mes',
      case_desc: 'Maria tiene un salon de unas en Bogota. Antes dependia solo de clientes que pasaban por su local. Ahora recibe citas por su pagina web y sus clientes la encuentran en Google.',
      case_stat1: 'Mas clientes',
      case_stat2: 'Mas visitas',
      case_stat3: 'Citas perdidas',

      features_tag: 'Funciones',
      features_title: 'Todo lo que tu pagina necesita',
      features_sub: 'Cada pagina viene con todo lo necesario para que tu negocio brille en internet.',
      feat1_title: 'Pagina web profesional',
      feat1_desc: 'Diseno moderno y profesional que refleja la calidad de tu negocio. Personalizada con tus fotos, colores y estilo.',
      feat2_title: 'Optimizada para celular',
      feat2_desc: 'Tu pagina se ve perfecta en cualquier dispositivo. El 80% de tus clientes te buscaran desde su celular.',
      feat3_title: 'Visible en Google',
      feat3_desc: 'Optimizamos tu pagina para que aparezca en los resultados de busqueda cuando tus clientes busquen negocios como el tuyo.',
      feat4_title: 'Sistema de citas',
      feat4_desc: 'Tus clientes pueden agendar citas directamente desde tu pagina. Sin llamadas, sin mensajes, sin complicaciones.',
      feat5_title: 'Redes sociales integradas',
      feat5_desc: 'Conectamos tu Instagram, Facebook y WhatsApp para que tus clientes te sigan y te contacten facilmente.',
      feat6_title: 'Seguimiento de visitas',
      feat6_desc: 'Panel de control donde ves cuantas personas visitan tu pagina, de donde vienen y que hacen. Datos reales, sin adivinar.',

      pricing_tag: 'Precios',
      pricing_title: 'Simple y transparente',
      pricing_sub: 'Sin sorpresas, sin costos ocultos. Cancela cuando quieras.',
      pricing_note: 'Sin costo de instalacion. Sin contratos.',
      pricing_f1: 'Pagina web profesional personalizada',
      pricing_f2: 'Optimizada para celular y Google',
      pricing_f3: 'Dominio personalizado incluido',
      pricing_f4: 'Hosting y SSL incluidos',
      pricing_f5: 'Cambios y actualizaciones ilimitados',
      pricing_f6: 'Soporte en espanol por WhatsApp',
      pricing_f7: 'Panel de analiticas incluido',
      pricing_cta: 'Comenzar Ahora',

      faq_tag: 'Preguntas Frecuentes',
      faq_title: 'Resolvemos tus dudas',
      faq_q1: 'Necesito saber de tecnologia para tener mi pagina?',
      faq_a1: 'No, para nada. Nosotros nos encargamos de todo: diseno, contenido, publicacion y mantenimiento. Tu solo nos dices que quieres y nosotros lo hacemos realidad.',
      faq_q2: 'Cuanto tiempo toma tener mi pagina lista?',
      faq_a2: 'Tu pagina estara lista en 72 horas o menos. Recopilamos la informacion de tu negocio, creamos tu pagina y te la enviamos para que la revises antes de publicarla.',
      faq_q3: 'Puedo cancelar en cualquier momento?',
      faq_a3: 'Si, puedes cancelar cuando quieras. No hay contratos a largo plazo ni penalizaciones. Si cancelas, tu pagina se desactiva al final del periodo pagado.',
      faq_q4: 'Que pasa si quiero hacer cambios en mi pagina?',
      faq_a4: 'Cambios ilimitados estan incluidos en tu plan. Solo envias un mensaje por WhatsApp con lo que quieres cambiar y nosotros lo actualizamos, generalmente en menos de 24 horas.',
      faq_q5: 'Mi negocio es muy pequeno, vale la pena tener pagina web?',
      faq_a5: 'Absolutamente. Los negocios pequenos son los que mas se benefician. Una pagina web te da credibilidad, te hace visible en Google y te permite competir con negocios mas grandes.',

      cta_title: 'Tu competencia ya tiene pagina. Y tu?',
      cta_desc: 'No dejes que tus clientes se vayan con otro negocio. Empieza hoy y ten tu pagina lista en 72 horas.',
      cta_btn: 'Crea Tu Pagina Gratis',

      footer_desc: 'Creamos paginas web profesionales para negocios locales en Latinoamerica. Simple, rapido y sin complicaciones.',
      footer_links: 'Enlaces',
      footer_contact: 'Contacto',
      footer_copy: '&copy; 2026 AhoraTengoPagina. Todos los derechos reservados.',

      modal_title: 'Crea tu pagina gratis',
      modal_sub: 'Solo necesitamos estos datos para armar tu pagina web.',
      modal_business_label: 'Nombre de tu negocio',
      modal_business_ph: 'Ej: Salon de Unas Maria',
      modal_facebook_label: 'Tu pagina de Facebook',
      modal_facebook_ph: 'Ej: https://facebook.com/tunegocio',
      modal_google_label: 'Tu perfil de Google',
      modal_google_ph: 'Ej: https://maps.google.com/...',
      modal_google_hint: 'Buscate en Google Maps y copia el enlace de tu negocio.',
      modal_submit: 'Crear Mi Pagina Gratis',
      modal_success_title: 'Estamos creando tu pagina!',
      modal_success_desc: 'Recibimos tu informacion. Te avisaremos cuando tu pagina este lista para que la revises.',
      modal_sending: 'Creando...',
      modal_error: 'Error. Intentar de nuevo.',
    },
    en: {
      nav_problem: 'The Problem',
      nav_how: 'How It Works',
      nav_features: 'Features',
      nav_pricing: 'Pricing',
      nav_cta: 'Create Your Free Page',

      hero_title: 'Your business already exists.<br><span>Now put it online.</span>',
      hero_sub: 'We create your professional website in 72 hours. No hassle, no long contracts. Just results.',
      hero_cta: 'Create Your Free Page',
      hero_how: 'See How It Works',

      proof_businesses: 'Businesses served',
      proof_delivery: 'Delivery time',
      proof_cancel: 'Cancellation cost',
      proof_support: 'Spanish support',

      problem_tag: 'The Problem',
      problem_title: 'Your customers search for you on Google. If you don\'t show up, you don\'t exist.',
      problem_desc: '97% of people search for local businesses online before visiting. Without a website, you\'re losing customers every day.',
      problem_li1: 'Your customers can\'t find you when they search on Google',
      problem_li2: 'You lose credibility against competitors who have a website',
      problem_li3: 'You can\'t easily showcase your services, prices, or hours',
      problem_li4: 'You depend only on foot traffic passing your door',
      problem_li5: 'You have no way to receive appointments or inquiries online',

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
      case_desc: 'Maria runs a nail salon in Bogota. She used to depend only on walk-in customers. Now she receives appointments through her website and her customers find her on Google.',
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
      feat3_title: 'Visible on Google',
      feat3_desc: 'We optimize your website to appear in search results when your customers look for businesses like yours.',
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
      faq_a5: 'Absolutely. Small businesses benefit the most. A website gives you credibility, makes you visible on Google, and lets you compete with larger businesses.',

      cta_title: 'Your competition already has a website. Do you?',
      cta_desc: 'Don\'t let your customers go to another business. Start today and have your website ready in 72 hours.',
      cta_btn: 'Create Your Free Page',

      footer_desc: 'We create professional websites for local businesses in Latin America. Simple, fast, and hassle-free.',
      footer_links: 'Links',
      footer_contact: 'Contact',
      footer_copy: '&copy; 2026 AhoraTengoPagina. All rights reserved.',

      modal_title: 'Create your free page',
      modal_sub: 'We just need this info to build your website.',
      modal_business_label: 'Your business name',
      modal_business_ph: 'E.g.: Maria\'s Nail Salon',
      modal_facebook_label: 'Your Facebook page',
      modal_facebook_ph: 'E.g.: https://facebook.com/yourbusiness',
      modal_google_label: 'Your Google profile',
      modal_google_ph: 'E.g.: https://maps.google.com/...',
      modal_google_hint: 'Search for yourself on Google Maps and copy the link to your business.',
      modal_submit: 'Create My Free Page',
      modal_success_title: 'We\'re building your page!',
      modal_success_desc: 'We received your info. We\'ll let you know when your page is ready for review.',
      modal_sending: 'Creating...',
      modal_error: 'Error. Try again.',
    }
  };

  var currentLang = localStorage.getItem('m_lang') || 'es';

  function t(key) {
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

  // ── Language Toggle ──
  document.getElementById('m-lang-toggle').addEventListener('click', toggleLanguage);
  document.getElementById('m-lang-toggle-mobile').addEventListener('click', toggleLanguage);

  // Apply saved language on load
  applyLanguage();

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
  leadForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    var businessName = document.getElementById('lead-business').value.trim();
    var facebookUrl = document.getElementById('lead-facebook').value.trim();
    var googleListingUrl = document.getElementById('lead-google').value.trim();

    if (!businessName) return;

    formSubmitBtn.disabled = true;
    formSubmitBtn.textContent = t('modal_sending');

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
      formSubmitBtn.textContent = t('modal_error');
      formSubmitBtn.style.background = '#ef4444';
      setTimeout(function() {
        formSubmitBtn.textContent = t('modal_submit');
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
