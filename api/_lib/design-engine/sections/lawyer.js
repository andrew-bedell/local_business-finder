// Design Engine V2 — Lawyer-specific section renderers
// Practice areas display for law firm websites

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Practice Areas Section ──
export function practiceAreasSection(content) {
  const heading = esc(content?.practiceAreas?.heading || 'Areas de Practica');
  const areas = content?.practiceAreas?.areas || [];

  if (!areas.length) return { html: '', css: '' };

  return {
    html: `
    <section id="practice-areas" class="section section--alt">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Especialidades</span>
          <h2>${heading}</h2>
        </div>
        <div class="grid grid--2 reveal">
          ${areas.map((area, i) => `
          <div class="card card--bordered stagger-${i + 1}">
            <h3>${esc(area.name)}</h3>
            <div class="divider"></div>
            <p style="color:var(--color-text-muted)">${esc(area.description)}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>`,
    css: '',
  };
}
