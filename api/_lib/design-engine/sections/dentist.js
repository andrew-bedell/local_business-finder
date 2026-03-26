// Design Engine V2 — Dentist-specific section renderers
// Dental services grid and insurance acceptance

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Dental Services Section ──
export function dentalServicesSection(content) {
  const heading = esc(content?.dentalServices?.heading || 'Nuestros Servicios Dentales');
  const items = content?.dentalServices?.items || [];

  if (!items.length) return { html: '', css: '' };

  return {
    html: `
    <section id="dental-services" class="section section--alt">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Servicios</span>
          <h2>${heading}</h2>
        </div>
        <div class="grid grid--3 reveal">
          ${items.map((item, i) => `
          <div class="card card--bordered stagger-${i + 1}">
            <h3>${esc(item.name)}</h3>
            <div class="divider"></div>
            <p style="color:var(--color-text-muted)">${esc(item.description)}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>`,
    css: '',
  };
}

// ── Insurance Section ──
export function insuranceSection(content) {
  const heading = esc(content?.insuranceAccepted?.heading || 'Seguros Aceptados');
  const providers = content?.insuranceAccepted?.providers || [];

  if (!providers.length) return { html: '', css: '' };

  return {
    html: `
    <section id="insurance" class="section">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Cobertura</span>
          <h2>${heading}</h2>
        </div>
        <div class="insurance-grid reveal">
          ${providers.map(provider => `
          <span class="insurance-tag">${esc(provider)}</span>`).join('')}
        </div>
      </div>
    </section>`,
    css: `
    .insurance-grid {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.75rem;
    }

    .insurance-tag {
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

    .insurance-tag:hover {
      transform: translateY(-2px);
      border-color: var(--color-accent);
    }`,
  };
}
