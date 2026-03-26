// Design Engine V2 — Auto Repair-specific section renderers
// Auto services with certifications and estimate CTA

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Auto Services Section ──
export function autoServicesSection(content) {
  const heading = esc(content?.autoServices?.heading || 'Nuestros Servicios');
  const items = content?.autoServices?.items || [];
  const certifications = content?.autoServices?.certifications || [];

  if (!items.length) return { html: '', css: '' };

  return {
    html: `
    <section id="auto-services" class="section section--alt">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Servicios</span>
          <h2>${heading}</h2>
        </div>
        <div class="service-grid reveal">
          ${items.map(item => `
          <div class="service-grid__item">
            <h3>${esc(item.name)}</h3>
            <p>${esc(item.description)}</p>
          </div>`).join('')}
        </div>
        ${certifications.length ? `
        <div class="certifications reveal" style="margin-top:3rem;text-align:center;">
          <p style="font-size:0.85rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:1rem;">Certificaciones</p>
          <div class="certifications__list">
            ${certifications.map(cert => `
            <span class="certification-badge">${esc(cert)}</span>`).join('')}
          </div>
        </div>` : ''}
      </div>
    </section>`,
    css: `
    .certifications__list {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.75rem;
    }

    .certification-badge {
      display: inline-block;
      font-family: var(--font-body);
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.02em;
      padding: 0.5rem 1.2rem;
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 2rem;
      color: var(--color-accent);
      background: var(--color-bg);
      transition: transform 0.2s ease, border-color 0.3s ease;
    }

    .certification-badge:hover {
      transform: translateY(-2px);
      border-color: var(--color-accent);
    }`,
  };
}

// ── Estimate CTA Section ──
export function estimateCTASection(content, photos, business) {
  const heading = esc(content?.estimateCTA?.heading || 'Solicite su Cotizacion');
  const description = esc(content?.estimateCTA?.description || '');
  const buttonText = esc(content?.estimateCTA?.buttonText || 'Llamar Ahora');
  const phoneHref = business.phone ? `tel:${business.phone.replace(/\s/g, '')}` : '#contact';

  return {
    html: `
    <section id="estimate" class="section section--accent" style="text-align:center;">
      <div class="container reveal">
        <h2>${heading}</h2>
        ${description ? `<p style="max-width:600px;margin:1.5rem auto 2rem;color:rgba(255,255,255,0.9)">${description}</p>` : ''}
        <a href="${phoneHref}" class="btn btn--white">${buttonText} <span class="btn-arrow">&rarr;</span></a>
        ${business.phone ? `<p style="margin-top:1.5rem;font-size:1.1rem;"><a href="${phoneHref}" style="color:#fff;font-family:var(--font-heading);font-weight:400">${esc(business.phone)}</a></p>` : ''}
      </div>
    </section>`,
    css: '',
  };
}
