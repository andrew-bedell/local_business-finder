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
      nav_cta: 'Prueba PáginaPro gratis',

      hero_title: 'Tus clientes ya te buscan.<br><span>Dales lo que necesitan.</span>',
      hero_sub: 'Tu negocio aparece en Google, pero sin página web tus clientes no encuentran precios, horarios ni cómo contactarte. Nosotros lo resolvemos en 20 minutos.',
      hero_cta: 'Prueba PáginaPro gratis por 1 mes',
      hero_how: 'Ver Cómo Funciona',

      proof_whatsapp: 'Más mensajes',
      proof_maps: 'Más visibilidad',
      proof_chatgpt: 'Mejor contexto',
      proof_fast: 'Página lista rápido',
      proof_no_code: 'Nosotros lo hacemos',
      proof_customers: 'Empieza hoy',
      proof_detail_close: 'Cerrar',
      proof_detail_whatsapp_aria: 'Ver detalle de WhatsApp',
      proof_detail_maps_aria: 'Ver detalle de Google Maps',
      proof_detail_chatgpt_aria: 'Ver detalle de ChatGPT',
      proof_detail_fast_aria: 'Ver detalle de 20 minutos',
      proof_detail_no_code_aria: 'Ver detalle de sin código',
      proof_detail_customers_aria: 'Ver detalle de más clientes',
      proof_detail_whatsapp_title: 'Convertimos visitas en conversaciones',
      proof_detail_whatsapp_body: 'Tu página muestra botones claros para escribir, llamar o cotizar por WhatsApp justo cuando el cliente ya está interesado.',
      proof_detail_maps_title: 'Damos más contexto a tu ficha',
      proof_detail_maps_body: 'Conectamos tu página con tu presencia en Google para que la gente encuentre horarios, servicios, fotos, ubicación y formas de contacto en un solo lugar.',
      proof_detail_chatgpt_title: 'Tu negocio queda más fácil de entender',
      proof_detail_chatgpt_body: 'Organizamos tus servicios, zona, horarios y datos clave para que asistentes de IA tengan mejor información al explicar o recomendar tu negocio.',
      proof_detail_fast_title: 'Una primera versión rápida',
      proof_detail_fast_body: 'Con tus datos, fotos y perfiles existentes armamos una página inicial en minutos para que puedas revisarla y pedir ajustes antes de publicar.',
      proof_detail_no_code_title: 'Nosotros hacemos la parte técnica',
      proof_detail_no_code_body: 'No necesitas tocar dominios, hosting, diseño o código. Nuestro equipo prepara, publica y mantiene la página contigo.',
      proof_detail_customers_title: 'Menos dudas, más acciones',
      proof_detail_customers_body: 'La meta es que más personas pasen de buscarte a contactarte: con información clara, confianza y botones listos para comprar, reservar o cotizar.',

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
      solution_sub: 'Empiezas sin tarjeta. Nosotros te guiamos hasta que tu página quede lista.',
      step1_title: 'Ingresa tu información',
      step1_desc: 'Danos el nombre de tu negocio, tu página de Facebook y tu perfil de Google. Con eso recopilamos fotos, reseñas, horarios y todo lo necesario.',
      step2_title: 'Tú la revisas',
      step2_desc: 'Te enviamos una vista previa con una dirección temporal asignada. Durante tu prueba tienes una reunión de diseño con tu agente de Customer Success para dejarla como quieres.',
      step3_title: 'La lanzamos al mundo',
      step3_desc: 'Cuando activas tu plan mensual, publicamos tu página con un dominio propio, soporte continuo y optimización para Google Maps y recomendaciones de IA.',

      case_tag: 'Caso de Éxito',
      case_title: 'María aumentó sus citas un 40% en el primer mes',
      case_desc: 'María tiene un salón de uñas en Guadalajara. Sus clientes la encontraban en Google pero no podían ver sus servicios ni agendar citas. Con su nueva página web, ahora recibe reservas directas y sus clientes tienen toda la información que necesitan.',
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
      pricing_title: 'Prueba PáginaPro gratis por 1 mes',
      pricing_sub: 'Sin tarjeta al empezar. Después decides si activas tu plan mensual.',
      pricing_note: '1 mes gratis. Sin tarjeta. Cancela antes de activar.',
      pricing_f1: 'Página web profesional personalizada',
      pricing_f2: 'Optimizada para celular y Google',
      pricing_f3: 'Dirección temporal asignada durante la prueba',
      pricing_f4: 'Hosting y SSL incluidos',
      pricing_f5: '1 reunión de diseño incluida en la prueba',
      pricing_f6: 'Soporte 24 horas para cambios pequeños al activar tu plan',
      pricing_f7: 'Panel de analíticas incluido',
      pricing_cta: 'Empezar prueba gratis',
      pricing_premium_badge: 'Premium',
      pricing_premium_label: 'Plan premium',
      pricing_premium_note: 'Pago requerido para activar citas, pagos, reservas y herramientas premium en tu página.',
      pricing_premium_cta: 'Elegir Página Negocio+',

      faq_tag: 'Preguntas Frecuentes',
      faq_title: 'Resolvemos tus dudas',
      faq_q1: 'Necesito saber de tecnología para tener mi página?',
      faq_a1: 'No, para nada. Nosotros nos encargamos de todo: diseño, contenido, publicación y mantenimiento. Tú solo nos dices qué quieres y nosotros lo hacemos realidad.',
      faq_q2: 'Qué incluye la prueba gratis?',
      faq_a2: 'Incluye 1 mes de PáginaPro, una dirección temporal asignada y una reunión de diseño con tu agente de Customer Success. No necesitas tarjeta para empezar.',
      faq_q3: 'Puedo cancelar en cualquier momento?',
      faq_a3: 'Sí. La prueba no requiere tarjeta. Si no activas el plan mensual al terminar el mes gratis, tu página pasa a estado bloqueado hasta que entres a Mi Página y realices el pago.',
      faq_q4: 'Qué pasa si quiero hacer cambios en mi página?',
      faq_a4: 'Durante la prueba tienes una reunión de diseño incluida. Después de aprobar el diseño, el soporte continúa cuando activas tu plan mensual: cambios pequeños con soporte 24 horas y temas complejos con respuesta mínima de 6 horas.',
      faq_q5: 'Mi negocio es muy pequeño, vale la pena tener página web?',
      faq_a5: 'Sí. Te ayudamos a ganar más visibilidad en Google Maps, aumentar las probabilidades de que sistemas de IA como ChatGPT recomienden tu negocio, y convertir más visitas en conversaciones por WhatsApp.',

      cta_title: 'Tus clientes ya te están buscando. Dales una razón para quedarse.',
      cta_desc: 'Prueba PáginaPro gratis por 1 mes y deja que nuestro equipo te guíe para conseguir más clientes por WhatsApp.',
      cta_btn: 'Empezar prueba gratis de PáginaPro',
      sticky_cta: 'Prueba PáginaPro gratis por 1 mes',

      footer_desc: 'Creamos páginas web profesionales para negocios locales en Latinoamérica. Simple, rápido y sin complicaciones.',
      footer_links: 'Enlaces',
      footer_about: 'Sobre Nosotros',
      footer_contact: 'Contacto',
      footer_copy: '&copy; 2026 AhoraTengoPagina. Todos los derechos reservados.',

      modal_title: 'Empieza tu prueba gratis de PáginaPro',
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
      modal_disclaimer: 'No pedimos tarjeta para empezar. Te contactaremos por WhatsApp, publicaremos tu prueba en una dirección temporal asignada y agendaremos tu reunión de diseño.',
      modal_submit: 'Hablar con mi agente \u2192',
      modal_sending: 'Enviando...',
      modal_error: 'Hubo un error. Por favor intenta de nuevo.',

    },
    en: {
      nav_about: 'About Us',
      nav_problem: 'The Problem',
      nav_how: 'How It Works',
      nav_features: 'Features',
      nav_pricing: 'Pricing',
      nav_cta: 'Try PáginaPro free',

      hero_title: 'Your customers are already looking.<br><span>Give them what they need.</span>',
      hero_sub: 'Your business shows up on Google, but without a website your customers can\'t find prices, hours, or how to reach you. We fix that in 20 minutes.',
      hero_cta: 'Try PáginaPro free for 1 month',
      hero_how: 'See How It Works',

      proof_whatsapp: 'More messages',
      proof_maps: 'More visibility',
      proof_chatgpt: 'Better context',
      proof_fast: 'Website ready fast',
      proof_no_code: 'We handle it',
      proof_customers: 'Start today',
      proof_detail_close: 'Close',
      proof_detail_whatsapp_aria: 'View WhatsApp detail',
      proof_detail_maps_aria: 'View Google Maps detail',
      proof_detail_chatgpt_aria: 'View ChatGPT detail',
      proof_detail_fast_aria: 'View 20 minute detail',
      proof_detail_no_code_aria: 'View no-code detail',
      proof_detail_customers_aria: 'View more customers detail',
      proof_detail_whatsapp_title: 'We turn visits into conversations',
      proof_detail_whatsapp_body: 'Your page shows clear buttons to message, call, or request a quote on WhatsApp right when the customer is already interested.',
      proof_detail_maps_title: 'We give your listing more context',
      proof_detail_maps_body: 'We connect your page with your Google presence so people can find hours, services, photos, location, and contact options in one place.',
      proof_detail_chatgpt_title: 'Your business becomes easier to understand',
      proof_detail_chatgpt_body: 'We organize your services, service area, hours, and key details so AI assistants have better information when explaining or recommending your business.',
      proof_detail_fast_title: 'A fast first version',
      proof_detail_fast_body: 'Using your details, photos, and existing profiles, we build an initial page in minutes so you can review it and request edits before publishing.',
      proof_detail_no_code_title: 'We handle the technical work',
      proof_detail_no_code_body: 'You do not need to touch domains, hosting, design, or code. Our team prepares, publishes, and maintains the page with you.',
      proof_detail_customers_title: 'Fewer doubts, more action',
      proof_detail_customers_body: 'The goal is to move more people from searching to contacting you with clear information, trust, and buttons ready for buying, booking, or quoting.',

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
      solution_sub: 'Start without a card. We guide you until your page is ready.',
      step1_title: 'Enter your information',
      step1_desc: 'Give us your business name, Facebook page, and Google profile. We\'ll gather photos, reviews, hours, and everything we need.',
      step2_title: 'You review it',
      step2_desc: 'We send you a preview on an assigned temporary address. During your trial, you get one design meeting with your Customer Success agent to make it feel right.',
      step3_title: 'We launch it',
      step3_desc: 'When you activate your monthly plan, we publish your page with its own domain, ongoing support, and optimization for Google Maps and AI recommendations.',

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
      pricing_title: 'Try PáginaPro free for 1 month',
      pricing_sub: 'No card to start. After that, choose whether to activate your monthly plan.',
      pricing_note: '1 month free. No card. No activation required.',
      pricing_f1: 'Custom professional website',
      pricing_f2: 'Optimized for mobile and Google',
      pricing_f3: 'Assigned temporary address during the trial',
      pricing_f4: 'Hosting and SSL included',
      pricing_f5: '1 design meeting included in the trial',
      pricing_f6: '24-hour support for small changes after activation',
      pricing_f7: 'Analytics dashboard included',
      pricing_cta: 'Start free trial',
      pricing_premium_badge: 'Premium',
      pricing_premium_label: 'Premium plan',
      pricing_premium_note: 'Payment is required to activate booking, payments, reservations, and premium tools on your website.',
      pricing_premium_cta: 'Choose Página Negocio+',

      faq_tag: 'Frequently Asked Questions',
      faq_title: 'We answer your questions',
      faq_q1: 'Do I need to know about technology to have my website?',
      faq_a1: 'Not at all. We handle everything: design, content, publishing, and maintenance. You just tell us what you want and we make it happen.',
      faq_q2: 'What is included in the free trial?',
      faq_a2: 'You get 1 month of PáginaPro, an assigned temporary address, and one design meeting with your Customer Success agent. No card is required to start.',
      faq_q3: 'Can I cancel at any time?',
      faq_a3: 'Yes. The trial does not require a card. If you do not activate the monthly plan after the free month, your page moves to a locked state until you sign in to Mi Página and pay.',
      faq_q4: 'What if I want to make changes to my website?',
      faq_a4: 'During the trial you get one included design meeting. After you approve the design, support continues when you activate your monthly plan: small changes have 24-hour support and complex issues have a minimum 6-hour response window.',
      faq_q5: 'My business is very small, is it worth having a website?',
      faq_a5: 'Yes. We help you earn more visibility on Google Maps, improve the odds that AI systems like ChatGPT recommend your business, and turn more visitors into WhatsApp conversations.',

      cta_title: 'Your customers are already searching for you. Give them a reason to stay.',
      cta_desc: 'Try PáginaPro free for 1 month and let our team guide you toward more customers through WhatsApp.',
      cta_btn: 'Start free PáginaPro trial',
      sticky_cta: 'Try PáginaPro free for 1 month',

      footer_desc: 'We create professional websites for local businesses in Latin America. Simple, fast, and hassle-free.',
      footer_links: 'Links',
      footer_about: 'About Us',
      footer_contact: 'Contact',
      footer_copy: '&copy; 2026 AhoraTengoPagina. All rights reserved.',

      modal_title: 'Start your free PáginaPro trial',
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
      modal_disclaimer: 'No card is required to start. We will contact you on WhatsApp, publish your trial on an assigned temporary address, and schedule your design meeting.',
      modal_submit: 'Talk to my agent \u2192',
      modal_sending: 'Sending...',
      modal_error: 'There was an error. Please try again.',

    },
    // ── Country-specific overrides (only keys that differ from base es) ──
    es_CO: {
      case_title: 'Carolina aumentó sus citas un 40% en el primer mes',
      case_desc: 'Carolina tiene una peluquería en Medellín. Sus clientes la encontraban en Google pero no podían ver sus servicios ni agendar citas. Con su nueva página web, ahora recibe reservas directas y sus clientes tienen toda la información que necesitan.',
      modal_name_ph: 'Ej: Carolina López',
      modal_business_ph: 'Ej: Peluquería Sandra',
      modal_address_ph: 'Ej: Calle 80 #45-20, Medellín',
      footer_desc: 'Creamos páginas web profesionales para negocios locales en Colombia. Simple, rápido y sin complicaciones.',
    },
    es_EC: {
      case_title: 'Patricia aumentó sus citas un 40% en el primer mes',
      case_desc: 'Patricia tiene una peluquería en Guayaquil. Sus clientes la encontraban en Google pero no podían ver sus servicios ni agendar citas. Con su nueva página web, ahora recibe reservas directas y sus clientes tienen toda la información que necesitan.',
      modal_name_ph: 'Ej: Patricia Reyes',
      modal_business_ph: 'Ej: Cevichería Don Luis',
      modal_address_ph: 'Ej: Av. 6 de Diciembre N34-120, Quito',
      footer_desc: 'Creamos páginas web profesionales para negocios locales en Ecuador. Simple, rápido y sin complicaciones.',
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
    document.querySelectorAll('[data-i18n-aria-label]').forEach(function(el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria-label')));
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
    if (activeProofKey) updateProofPopoverContent(activeProofKey);
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
  var proofPopover = document.getElementById('m-proof-popover');
  var proofPopoverClose = document.getElementById('m-proof-popover-close');
  var proofPopoverKicker = document.getElementById('m-proof-popover-kicker');
  var proofPopoverTitle = document.getElementById('m-proof-popover-title');
  var proofPopoverBody = document.getElementById('m-proof-popover-body');
  var proofButtons = document.querySelectorAll('[data-proof-key]');
  var activeProofKey = null;
  var activeProofButton = null;

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
    // URL param override always wins: ?country=CO
    var urlCountry = (new URLSearchParams(window.location.search).get('country') || '').toUpperCase();
    if (urlCountry && /^[A-Z]{2}$/.test(urlCountry)) {
      currentCountry = urlCountry;
      localStorage.setItem('m_country', currentCountry);
      onCountryReady();
      return;
    }
    if (currentCountry) {
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

  // ── Proof Detail Popovers ──
  var proofLabelKeys = {
    whatsapp: 'proof_whatsapp',
    maps: 'proof_maps',
    chatgpt: 'proof_chatgpt',
    fast: 'proof_fast',
    no_code: 'proof_no_code',
    customers: 'proof_customers'
  };

  function updateProofPopoverContent(key) {
    if (!proofPopover) return;
    proofPopoverKicker.textContent = t(proofLabelKeys[key] || 'proof_customers');
    proofPopoverTitle.textContent = t('proof_detail_' + key + '_title');
    proofPopoverBody.textContent = t('proof_detail_' + key + '_body');
  }

  function positionProofPopover() {
    if (!proofPopover || !activeProofButton || !activeProofKey) return;

    if (window.matchMedia('(max-width: 768px)').matches) {
      proofPopover.style.left = '';
      proofPopover.style.top = '';
      return;
    }

    var margin = 16;
    var rect = activeProofButton.getBoundingClientRect();
    var popoverWidth = proofPopover.offsetWidth;
    var popoverHeight = proofPopover.offsetHeight;
    var top = rect.bottom + 12;
    var left = rect.left + (rect.width / 2) - (popoverWidth / 2);

    if (top + popoverHeight > window.innerHeight - margin && rect.top - popoverHeight - 12 > margin) {
      top = rect.top - popoverHeight - 12;
    }

    left = Math.max(margin, Math.min(left, window.innerWidth - popoverWidth - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - popoverHeight - margin));

    proofPopover.style.left = left + 'px';
    proofPopover.style.top = top + 'px';
  }

  function closeProofDetail(restoreFocus) {
    if (!proofPopover || !activeProofKey) return;
    proofPopover.classList.remove('m-active');
    proofPopover.hidden = true;
    proofButtons.forEach(function(btn) {
      btn.classList.remove('m-active');
      btn.setAttribute('aria-expanded', 'false');
    });
    if (restoreFocus !== false && activeProofButton) {
      activeProofButton.focus();
    }
    activeProofKey = null;
    activeProofButton = null;
  }

  function openProofDetail(key, button) {
    if (!proofPopover || !key || !button) return;
    activeProofKey = key;
    activeProofButton = button;
    updateProofPopoverContent(key);

    proofButtons.forEach(function(btn) {
      var isActive = btn === button;
      btn.classList.toggle('m-active', isActive);
      btn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });

    proofPopover.hidden = false;
    proofPopover.classList.add('m-active');
    positionProofPopover();
    if (proofPopoverClose) {
      setTimeout(function() { proofPopoverClose.focus(); }, 0);
    }
  }

  proofButtons.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      openProofDetail(btn.getAttribute('data-proof-key'), btn);
    });
  });

  if (proofPopoverClose) {
    proofPopoverClose.addEventListener('click', function() {
      closeProofDetail(true);
    });
  }

  document.addEventListener('click', function(e) {
    if (!activeProofKey || !proofPopover) return;
    if (proofPopover.contains(e.target) || (activeProofButton && activeProofButton.contains(e.target))) return;
    closeProofDetail(false);
  });

  window.addEventListener('resize', positionProofPopover);
  window.addEventListener('scroll', positionProofPopover, { passive: true });

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

  // ── Create-Page CTAs ──
  // Every trial/start button on marketing pages now leads into the guided
  // create-page experience. The legacy lead modal is kept in the DOM for now
  // but no longer opened from these CTAs.
  var TRIAL_START_URL = '/crear-tu-pagina';
  var PREMIUM_START_URL = '/crear-tu-pagina/personalizada';
  var PREMIUM_INTENT_KEY = 'atp_premium_plan_intent';

  function normalizePlanText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function isPremiumProduct(product) {
    var text = normalizePlanText([product && product.name, product && product.description].filter(Boolean).join(' '));
    return text.indexOf('negocio') !== -1 && text.indexOf('+') !== -1;
  }

  function buildPlanUrl(baseUrl, params) {
    var url = new URL(baseUrl, window.location.origin);
    Object.keys(params || {}).forEach(function(key) {
      if (params[key] != null && params[key] !== '') {
        url.searchParams.set(key, params[key]);
      }
    });
    return url.pathname + url.search;
  }

  function savePremiumIntent(dataset) {
    var intent = {
      productId: dataset.productId || '',
      productName: dataset.productName || '',
      productPrice: dataset.productPrice || '',
      productCurrency: dataset.productCurrency || '',
      billingInterval: dataset.billingInterval || '',
      selectedAt: new Date().toISOString(),
    };
    localStorage.setItem(PREMIUM_INTENT_KEY, JSON.stringify(intent));
    return intent;
  }

  function clearPremiumIntent() {
    localStorage.removeItem(PREMIUM_INTENT_KEY);
  }

  function startTrial(e) {
    if (e) e.preventDefault();
    var trigger = e && e.currentTarget;
    var dataset = trigger && trigger.dataset ? trigger.dataset : {};
    if (dataset.planType === 'premium') {
      var intent = savePremiumIntent(dataset);
      window.location.href = buildPlanUrl(PREMIUM_START_URL, {
        plan: 'negocio-plus',
        premiumProductId: intent.productId,
      });
      return;
    }
    clearPremiumIntent();
    window.location.href = TRIAL_START_URL;
  }
  document.querySelectorAll('[data-open-modal]').forEach(function(btn) {
    btn.addEventListener('click', startTrial);
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
    if (e.key === 'Escape' && activeProofKey) {
      closeProofDetail(true);
      return;
    }
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
        countryCode: currentCountry || null,
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
      stickyBtn.addEventListener('click', startTrial);
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
        var products = (data.products || [])
          .filter(function(p) { return parseFloat(p.price) > 0; })
          .slice(0, 3);
        if (products.length === 0) {
          renderFallbackPricing();
          return;
        }
        pricingGrid.setAttribute('data-cols', products.length);
        pricingGrid.innerHTML = products.map(function(p, i) {
          var isFeatured = i === 0 && !isPremiumProduct(p);
          return renderPricingCard(p, isFeatured);
        }).join('');

        // Attach CTA click handlers — trial pricing cards lead into the create-page flow
        pricingGrid.querySelectorAll('[data-open-modal]').forEach(function(btn) {
          btn.addEventListener('click', startTrial);
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
    var isPremium = isPremiumProduct(product);
    var featuredClass = isFeatured ? ' m-pricing-featured' : '';
    var premiumClass = isPremium ? ' m-pricing-premium' : '';
    var badgeHtml = isPremium
      ? '<span class="m-pricing-badge m-pricing-badge--premium">' + t('pricing_premium_badge') + '</span>'
      : (isFeatured ? '<span class="m-pricing-badge">' + (currentLang === 'en' ? '1 month free' : '1 mes gratis') + '</span>' : '');
    var noteKey = isPremium
      ? t('pricing_premium_note')
      : (currentLang === 'en'
      ? 'No card to start. You add payment only when you activate.'
      : 'Sin tarjeta para empezar. Pagas solo cuando activas.');
    var afterTrialLabel = isPremium ? t('pricing_premium_label') : (currentLang === 'en' ? 'After the free month' : 'Después del mes gratis');
    var futurePriceLabel = formattedPrice + ' ' + intervalText;

    var featuresHtml = features.map(function(f) {
      return '<div class="m-pricing-feature"><span class="m-pricing-check">&#10003;</span><span>' + escapeHtml(f) + '</span></div>';
    }).join('');

    var descHtml = product.description ? '<p class="m-pricing-desc">' + escapeHtml(product.description) + '</p>' : '';
    var trialHeadline = isPremium ? formattedPrice : (currentLang === 'en' ? '1 month free' : '1 mes gratis');
    var trialSubline = isPremium ? intervalText : (currentLang === 'en' ? 'PáginaPro trial' : 'Prueba PáginaPro');
    var ctaText = isPremium ? t('pricing_premium_cta') : t('pricing_cta');
    var buttonAttrs = isPremium
      ? ' data-open-modal data-plan-type="premium" data-product-id="' + escapeHtml(product.id || '') + '" data-product-name="' + escapeHtml(product.name || '') + '" data-product-price="' + escapeHtml(product.price || '') + '" data-product-currency="' + escapeHtml(product.currency || '') + '" data-billing-interval="' + escapeHtml(product.billing_interval || '') + '"'
      : ' data-open-modal';

    return '<div class="m-pricing-card' + featuredClass + premiumClass + '" data-reveal>' +
      badgeHtml +
      '<div class="m-pricing-price">' + trialHeadline + ' <span>' + trialSubline + '</span></div>' +
      '<div class="m-pricing-after"><span>' + afterTrialLabel + '</span><strong>' + futurePriceLabel + '</strong></div>' +
      '<p class="m-pricing-note">' + noteKey + '</p>' +
      (product.name ? '<p style="font-size:16px;font-weight:700;margin-bottom:16px;color:#0c1b33">' + escapeHtml(product.name) + '</p>' : '') +
      descHtml +
      '<div class="m-pricing-features">' + featuresHtml + '</div>' +
      '<button class="m-pricing-cta"' + buttonAttrs + '>' + ctaText + '</button>' +
    '</div>';
  }

  function renderFallbackPricing() {
    // Static fallback if API fails — show country-appropriate pricing
    var fb = FALLBACK_PRICING[currentCountry] || FALLBACK_PRICING.MX;
    var afterTrialLabel = currentLang === 'en' ? 'After the free month' : 'Después del mes gratis';
    var futurePriceLabel = fb.price + ' ' + fb.currency + ' / mes';
    pricingGrid.setAttribute('data-cols', '1');
    pricingGrid.innerHTML =
      '<div class="m-pricing-card m-visible" data-reveal>' +
        '<div class="m-pricing-price">' + (currentLang === 'en' ? '1 month free' : '1 mes gratis') + ' <span>' + (currentLang === 'en' ? 'PáginaPro trial' : 'Prueba PáginaPro') + '</span></div>' +
        '<div class="m-pricing-after"><span>' + afterTrialLabel + '</span><strong>' + futurePriceLabel + '</strong></div>' +
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
      btn.addEventListener('click', startTrial);
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

})();
