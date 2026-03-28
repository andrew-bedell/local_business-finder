// Design Engine V2 — Universal section renderers
// Used by all business types: hero, about, services, whyChooseUs, testimonials, gallery, CTA, hours, contact, footer

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function starsHTML(count) {
  const n = Math.round(Number(count) || 5);
  return '<span class="stars">' + '★'.repeat(n) + '</span>';
}

function getPhotoForSection(photos, sectionName) {
  if (!photos || !photos.length) return null;
  const match = photos.find(p => p.section && p.section.toLowerCase().includes(sectionName.toLowerCase()));
  return match ? match.url : null;
}

function getPhotosForSection(photos, sectionName) {
  if (!photos || !photos.length) return [];
  return photos.filter(p => p.section && p.section.toLowerCase().includes(sectionName.toLowerCase())).map(p => p.url);
}

function getAllPhotos(photos) {
  if (!photos || !photos.length) return [];
  return photos.map(p => p.url).filter(Boolean);
}

// ── Hero Section ──
export function heroSection(content, photos, business, ctaLabel) {
  const heroPhoto = getPhotoForSection(photos, 'hero') || (photos && photos[0] ? photos[0].url : '');
  const headline = esc(content?.hero?.headline || business.name);
  const subheadline = esc(content?.hero?.subheadline || '');
  const cta = ctaLabel || content?.cta?.buttonText || 'Contáctanos';
  const phoneHref = business.phone ? `tel:${business.phone.replace(/\s/g, '')}` : '#contact';

  const bgStyle = heroPhoto
    ? `background: linear-gradient(to bottom, rgba(26,23,20,0.3), rgba(26,23,20,0.7)), url('${esc(heroPhoto)}') center/cover no-repeat;`
    : `background: linear-gradient(135deg, var(--color-dark) 0%, rgba(26,23,20,0.9) 100%);`;

  return {
    html: `
    <section class="hero" style="${bgStyle}">
      <div class="hero__content container">
        <span class="eyebrow hero-animate">${esc(business.category || '')}</span>
        <h1 class="hero-animate">${headline}</h1>
        ${subheadline ? `<p class="hero__sub hero-animate">${subheadline}</p>` : ''}
        <div class="hero__actions hero-animate">
          <a href="${phoneHref}" class="btn btn--primary">${esc(cta)} <span class="btn-arrow">→</span></a>
        </div>
      </div>
      <div class="scroll-indicator">↓</div>
    </section>`,
    css: `
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: flex-end;
      position: relative;
      color: var(--color-text-light);
    }

    .hero__content {
      padding-bottom: 6rem;
      max-width: 800px;
    }

    .hero__content h1 {
      color: #fff;
      margin: 0.5rem 0 1.5rem;
    }

    .hero__sub {
      font-size: clamp(1rem, 1.8vw, 1.25rem);
      font-weight: 300;
      color: rgba(255,255,255,0.85);
      max-width: 600px;
      margin-bottom: 2rem;
      line-height: 1.7;
    }

    .hero__actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    @media (max-width: 900px) {
      .hero { min-height: 85vh; }
      .hero__content { padding-bottom: 4rem; }
    }`,
  };
}

// ── About Section ──
export function aboutSection(content, photos, business) {
  const aboutPhoto = getPhotoForSection(photos, 'about') || getPhotoForSection(photos, 'sobre');
  const heading = esc(content?.about?.heading || 'Sobre Nosotros');
  const paragraphs = content?.about?.paragraphs || [];

  // Founder info from customer-provided data
  const founderName = (business && business.founderName) || '';
  const founderDesc = (business && business.founderDescription) || '';
  const founderPhoto = getPhotoForSection(photos, 'founder');
  const hasFounder = founderName || founderDesc;

  return {
    html: `
    <section id="about" class="section">
      <div class="container split${aboutPhoto ? '' : ''}">
        <div class="reveal">
          <div class="section-header">
            <span class="eyebrow">Nuestra historia</span>
            <h2>${heading}</h2>
          </div>
          ${paragraphs.map(p => `<p>${esc(p)}</p>`).join('\n          ')}
        </div>
        ${aboutPhoto ? `
        <div class="reveal-right img-rounded aspect-4-3">
          <img src="${esc(aboutPhoto)}" alt="${heading}" class="img-cover">
        </div>` : ''}
      </div>
      ${hasFounder ? `
      <div class="container founder-block reveal" style="margin-top:3rem;">
        ${founderPhoto ? `
        <div class="founder-block__photo">
          <img src="${esc(founderPhoto)}" alt="${esc(founderName)}" class="img-cover">
        </div>` : ''}
        <div class="founder-block__text">
          ${founderName ? `<h3>${esc(founderName)}</h3>` : ''}
          ${founderDesc ? `<p style="color:var(--color-text-muted);line-height:1.7">${esc(founderDesc)}</p>` : ''}
        </div>
      </div>` : ''}
    </section>`,
    css: hasFounder ? `
    .founder-block {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(0,0,0,0.06);
    }
    .founder-block__photo {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
    }
    .founder-block__photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    @media (max-width: 768px) {
      .founder-block { flex-direction: column; text-align: center; }
    }` : '',
  };
}

// ── Services Section ──
export function servicesSection(content, photos, business) {
  const heading = esc(content?.services?.heading || 'Servicios');
  const aiItems = content?.services?.items || [];
  const customerServices = (business && business.services) || [];

  // Merge: customer-provided services take priority, then AI-generated ones fill in
  const mergedItems = [];

  // Add customer-provided services first (they have real data from the business owner)
  customerServices.forEach(svc => {
    const photoUrl = svc.photo_url || '';
    mergedItems.push({
      name: svc.name,
      description: svc.description || '',
      price: svc.price ? `${svc.currency || '$'}${svc.price}` : '',
      photoUrl,
    });
  });

  // Add AI-generated items that don't duplicate customer services (by name similarity)
  const customerNames = customerServices.map(s => (s.name || '').toLowerCase().trim());
  aiItems.forEach(item => {
    const nameLower = (item.name || '').toLowerCase().trim();
    const isDuplicate = customerNames.some(cn => cn === nameLower || cn.includes(nameLower) || nameLower.includes(cn));
    if (!isDuplicate) {
      mergedItems.push({ name: item.name, description: item.description, price: item.price || '', photoUrl: '' });
    }
  });

  return {
    html: `
    <section id="services" class="section section--alt">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Lo que ofrecemos</span>
          <h2>${heading}</h2>
        </div>
        <div class="service-grid reveal">
          ${mergedItems.map(item => `
          <div class="service-grid__item">
            ${item.photoUrl ? `<div class="service-grid__photo"><img src="${esc(item.photoUrl)}" alt="${esc(item.name)}" loading="lazy" class="img-cover"></div>` : ''}
            <h3>${esc(item.name)}</h3>
            <p>${esc(item.description)}</p>
            ${item.price ? `<p style="margin-top:0.75rem;color:var(--color-accent);font-family:var(--font-heading);font-size:1.05rem">${esc(item.price)}</p>` : ''}
          </div>`).join('')}
        </div>
      </div>
    </section>`,
    css: `
    .service-grid__photo {
      width: 100%;
      height: 180px;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 1rem;
    }
    .service-grid__photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }`,
  };
}

// ── Why Choose Us Section ──
export function whyChooseUsSection(content) {
  const heading = esc(content?.whyChooseUs?.heading || '¿Por qué elegirnos?');
  const points = content?.whyChooseUs?.points || [];

  return {
    html: `
    <section id="why" class="section">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">La diferencia</span>
          <h2>${heading}</h2>
        </div>
        <div class="grid grid--3 reveal">
          ${points.map((p, i) => `
          <div class="card card--bordered stagger-${i + 1}">
            <h3>${esc(p.title)}</h3>
            <div class="divider"></div>
            <p style="color:var(--color-text-muted)">${esc(p.description)}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>`,
    css: '',
  };
}

// ── Testimonials Section ──
export function testimonialsSection(content) {
  const heading = esc(content?.testimonials?.heading || 'Lo que dicen nuestros clientes');
  const reviews = content?.testimonials?.reviews || [];

  return {
    html: `
    <section id="testimonials" class="section section--dark">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Testimonios</span>
          <h2>${heading}</h2>
        </div>
        <div class="grid grid--${Math.min(reviews.length, 3)} reveal">
          ${reviews.map((r, i) => `
          <div class="card card--dark stagger-${i + 1}">
            ${starsHTML(r.stars)}
            <p class="quote">"${esc(r.quote)}"</p>
            <p class="quote-author">— ${esc(r.author)}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>`,
    css: '',
  };
}

// ── Gallery Section ──
export function gallerySection(content, photos) {
  const heading = esc(content?.gallery?.heading || 'Galería');
  const galleryPhotos = getPhotosForSection(photos, 'gallery') || [];
  // If not enough gallery-tagged photos, use all remaining
  const allPhotos = galleryPhotos.length >= 4 ? galleryPhotos : getAllPhotos(photos).slice(0, 8);

  if (allPhotos.length === 0) return { html: '', css: '' };

  return {
    html: `
    <section id="gallery" class="section section--alt">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Galería</span>
          <h2>${heading}</h2>
        </div>
      </div>
      <div class="h-scroll reveal" style="padding-left:3rem;">
        ${allPhotos.map((url, i) => `
        <div class="h-scroll__item">
          <img src="${esc(url)}" alt="Foto ${i + 1}" loading="lazy">
        </div>`).join('')}
      </div>
    </section>`,
    css: '',
  };
}

// ── CTA Section ──
export function ctaSection(content, business) {
  const heading = esc(content?.cta?.heading || '¿Listo para visitarnos?');
  const btnText = esc(content?.cta?.buttonText || 'Contáctanos');
  const supporting = esc(content?.cta?.supportingText || '');
  const phoneHref = business.phone ? `tel:${business.phone.replace(/\s/g, '')}` : '#contact';

  return {
    html: `
    <section id="cta-section" class="section section--accent" style="text-align:center;">
      <div class="container reveal">
        <h2>${heading}</h2>
        <p style="max-width:600px;margin:1.5rem auto 2rem;color:rgba(255,255,255,0.9)">${supporting}</p>
        <a href="${phoneHref}" class="btn btn--white">${btnText} <span class="btn-arrow">→</span></a>
        ${business.phone ? `<p style="margin-top:1.5rem;font-size:1.1rem;"><a href="${phoneHref}" style="color:#fff;font-family:var(--font-heading);font-weight:400">${esc(business.phone)}</a></p>` : ''}
      </div>
    </section>`,
    css: '',
  };
}

// ── Hours Section ──
export function hoursSection(content) {
  const heading = esc(content?.hours?.heading || 'Horario');
  const formatted = content?.hours?.formatted || [];

  if (!formatted.length) return { html: '', css: '' };

  return {
    html: `
    <section id="hours" class="section">
      <div class="container" style="max-width:600px;">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Horario</span>
          <h2>${heading}</h2>
        </div>
        <div class="reveal">
          ${formatted.map(line => `<p style="text-align:center;padding:0.4rem 0;color:var(--color-text-muted);border-bottom:1px solid rgba(0,0,0,0.04)">${esc(line)}</p>`).join('\n          ')}
        </div>
      </div>
    </section>`,
    css: '',
  };
}

// ── Contact Section ──
export function contactSection(content, business, photos) {
  const heading = esc(content?.contact?.heading || 'Contacto');
  const phone = esc(content?.contact?.phone || business.phone || '');
  const address = esc(content?.contact?.address || business.address || '');
  const directionsText = esc(content?.contact?.directionsText || 'Cómo llegar');
  const mapsUrl = esc(business.mapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(address)}`);
  const contactPhoto = getPhotoForSection(photos, 'contact') || getPhotoForSection(photos, 'ubicaci');

  return {
    html: `
    <section id="contact" class="section section--alt">
      <div class="container split">
        <div class="reveal">
          <div class="section-header">
            <span class="eyebrow">Encuéntranos</span>
            <h2>${heading}</h2>
          </div>
          ${phone ? `<p style="margin-bottom:1rem"><strong>Teléfono:</strong><br><a href="tel:${phone.replace(/\s/g, '')}" style="font-family:var(--font-heading);font-size:1.2rem">${phone}</a></p>` : ''}
          ${address ? `<p style="margin-bottom:1rem;color:var(--color-text-muted)">${address}</p>` : ''}
          ${address ? `<a href="${mapsUrl}" target="_blank" class="btn btn--outline" style="margin-top:0.5rem">${directionsText} <span class="btn-arrow">→</span></a>` : ''}
        </div>
        ${contactPhoto ? `
        <div class="reveal-right img-rounded aspect-4-3">
          <img src="${esc(contactPhoto)}" alt="Ubicación" class="img-cover">
        </div>` : ''}
      </div>
    </section>`,
    css: '',
  };
}

// ── Footer Section ──
export function footerSection(content, business) {
  const tagline = esc(content?.footer?.tagline || business.name);
  const copyright = esc(content?.footer?.copyright || `© ${new Date().getFullYear()} ${business.name}. Todos los derechos reservados.`);
  const socials = business.socialProfiles || [];

  return {
    html: `
    <footer class="site-footer">
      <div class="site-footer__inner">
        <div class="site-footer__top">
          <div>
            <div class="site-footer__brand">${esc(business.name)}</div>
            <p class="site-footer__tagline">${tagline}</p>
          </div>
          ${socials.length ? `
          <div class="site-footer__social">
            ${socials.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.platform)}</a>`).join('\n            ')}
          </div>` : ''}
        </div>
        <div class="site-footer__bottom">
          <p class="site-footer__copyright">${copyright}</p>
          <p class="site-footer__attribution">Diseñado por <a href="https://www.ahoratengopagina.com/about" target="_blank">AhoraTengoPagina.com</a></p>
        </div>
      </div>
    </footer>`,
    css: '',
  };
}

// ── Nav HTML (not a section, but generated here for convenience) ──
export function navHTML(business, ctaLabel) {
  const cta = ctaLabel || 'Contáctanos';
  const phoneHref = business.phone ? `tel:${business.phone.replace(/\s/g, '')}` : '#contact';

  return `
  <nav class="site-nav">
    <div class="site-nav__inner">
      <a href="#" class="site-nav__logo">${esc(business.name)}</a>
      <ul class="site-nav__links">
        <li><a href="#about">Sobre Nosotros</a></li>
        <li><a href="#services">Servicios</a></li>
        <li><a href="#gallery">Galería</a></li>
        <li><a href="#testimonials">Reseñas</a></li>
        <li><a href="#contact">Contacto</a></li>
        <li><a href="${phoneHref}" class="site-nav__cta site-nav__cta--desktop">${esc(cta)}</a></li>
      </ul>
      <button class="hamburger" aria-label="Menú">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
  <div class="mobile-menu">
    <a href="#about">Sobre Nosotros</a>
    <a href="#services">Servicios</a>
    <a href="#gallery">Galería</a>
    <a href="#testimonials">Reseñas</a>
    <a href="#contact">Contacto</a>
    <a href="${phoneHref}" class="mobile-cta">${esc(cta)}</a>
  </div>`;
}

// ── WhatsApp FAB HTML ──
export function whatsappFAB(business) {
  if (!business.whatsapp && !business.phone) return '';

  // wa.me requires international format digits only (no +, spaces, dashes)
  const raw = (business.whatsapp || business.phone || '').replace(/[^\d]/g, '');
  // If number doesn't look international (too short), skip — wa.me won't resolve it
  if (raw.length < 10) return '';
  const message = encodeURIComponent(`Hola! Me gustaría más información sobre ${business.name || 'sus servicios'}.`);
  const href = `https://wa.me/${raw}?text=${message}`;

  return `
  <a href="${href}" target="_blank" rel="noopener" class="whatsapp-fab" aria-label="WhatsApp">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  </a>`;
}
