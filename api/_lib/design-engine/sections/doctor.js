// Design Engine V2 — Doctor/Medical section renderers
// Business-type-specific sections: credentials, insurance

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Credentials Section ──
export function credentialsSection(content) {
  const heading = esc(content?.credentials?.heading || 'Nuestro Equipo');
  const items = content?.credentials?.items || [];

  if (!items.length) return { html: '', css: '' };

  const cols = items.length <= 2 ? 2 : 3;

  return {
    html: `
    <section id="credentials" class="section section--alt">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Profesionales</span>
          <h2>${heading}</h2>
        </div>
        <div class="grid grid--${cols} reveal">
          ${items.map((item, i) => `
          <div class="card card--bordered stagger-${i + 1}" style="text-align:center;">
            <h3>${esc(item.name)}</h3>
            <p style="color:var(--color-accent);font-size:0.95rem;margin:0.5rem 0;">${esc(item.title)}</p>
            <div class="divider" style="margin:1rem auto;"></div>
            <p style="color:var(--color-text-muted);font-size:0.9rem;">${esc(item.credentials)}</p>
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
