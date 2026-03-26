// Design Engine V2 — Plumber-specific section renderers
// Emergency CTA and coverage area for plumbing/trade businesses

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Emergency CTA Section ──
export function emergencyCTASection(content, photos, business) {
  const heading = esc(content?.emergencyCTA?.heading || 'Servicio de Emergencia');
  const description = esc(content?.emergencyCTA?.description || '');
  const available247 = content?.emergencyCTA?.available247 || false;
  const buttonText = esc(content?.emergencyCTA?.buttonText || 'Llamar Ahora');
  const phoneHref = business.phone ? `tel:${business.phone.replace(/\s/g, '')}` : '#contact';

  return {
    html: `
    <section id="emergency" class="section section--accent" style="text-align:center;">
      <div class="container reveal">
        ${available247 ? `<span class="emergency-badge">24/7</span>` : ''}
        <h2>${heading}</h2>
        ${description ? `<p style="max-width:600px;margin:1.5rem auto 2rem;color:rgba(255,255,255,0.9)">${description}</p>` : ''}
        <a href="${phoneHref}" class="btn btn--white">${buttonText} <span class="btn-arrow">&rarr;</span></a>
        ${business.phone ? `<p style="margin-top:1.5rem;font-size:1.3rem;font-weight:500;"><a href="${phoneHref}" style="color:#fff;font-family:var(--font-heading);font-weight:400">${esc(business.phone)}</a></p>` : ''}
      </div>
    </section>`,
    css: `
    .emergency-badge {
      display: inline-block;
      font-family: var(--font-body);
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      padding: 0.5rem 1.4rem;
      border: 2px solid #fff;
      border-radius: 2rem;
      color: #fff;
      margin-bottom: 1.5rem;
    }`,
  };
}

// ── Coverage Area Section ──
export function coverageAreaSection(content) {
  const heading = esc(content?.coverageArea?.heading || 'Areas de Cobertura');
  const areas = content?.coverageArea?.areas || [];
  const description = esc(content?.coverageArea?.description || '');

  if (!areas.length) return { html: '', css: '' };

  return {
    html: `
    <section id="coverage" class="section">
      <div class="container" style="max-width:700px;">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Cobertura</span>
          <h2>${heading}</h2>
        </div>
        ${description ? `<p class="reveal" style="text-align:center;color:var(--color-text-muted);margin-bottom:2rem;">${description}</p>` : ''}
        <div class="coverage-list reveal">
          ${areas.map(area => `
          <span class="coverage-tag">${esc(area)}</span>`).join('')}
        </div>
      </div>
    </section>`,
    css: `
    .coverage-list {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.75rem;
    }

    .coverage-tag {
      display: inline-block;
      font-family: var(--font-body);
      font-size: 0.85rem;
      font-weight: 500;
      letter-spacing: 0.02em;
      padding: 0.6rem 1.4rem;
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 2rem;
      color: var(--color-text);
      background: var(--color-bg-alt);
      transition: transform 0.2s ease, border-color 0.3s ease;
    }

    .coverage-tag:hover {
      transform: translateY(-2px);
      border-color: var(--color-accent);
    }`,
  };
}
