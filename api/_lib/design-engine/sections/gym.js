// Design Engine V2 — Gym-specific section renderers
// Membership tiers and class schedule for fitness businesses

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Membership Tiers Section ──
export function membershipTiersSection(content) {
  const heading = esc(content?.memberships?.heading || 'Membresias');
  const tiers = content?.memberships?.tiers || [];

  if (!tiers.length) return { html: '', css: '' };

  return {
    html: `
    <section id="memberships" class="section">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Planes</span>
          <h2>${heading}</h2>
        </div>
        <div class="grid grid--3 reveal">
          ${tiers.map((tier, i) => `
          <div class="tier-card stagger-${i + 1}">
            <h3>${esc(tier.name)}</h3>
            <div class="tier-card__price">${esc(tier.price)}</div>
            <ul class="tier-card__features">
              ${(tier.features || []).map(f => `
              <li>${esc(f)}</li>`).join('')}
            </ul>
          </div>`).join('')}
        </div>
      </div>
    </section>`,
    css: '',
  };
}

// ── Class Schedule Section ──
export function classScheduleSection(content) {
  const heading = esc(content?.classSchedule?.heading || 'Horario de Clases');
  const classes = content?.classSchedule?.classes || [];

  if (!classes.length) return { html: '', css: '' };

  return {
    html: `
    <section id="class-schedule" class="section section--alt">
      <div class="container">
        <div class="section-header reveal" style="text-align:center;">
          <span class="eyebrow">Clases</span>
          <h2>${heading}</h2>
        </div>
        <div class="grid grid--3 reveal">
          ${classes.map((cls, i) => `
          <div class="card card--bordered stagger-${i + 1}">
            <h3>${esc(cls.name)}</h3>
            ${cls.schedule ? `<p style="color:var(--color-accent);font-size:0.9rem;margin:0.5rem 0;">${esc(cls.schedule)}</p>` : ''}
            <div class="divider"></div>
            ${cls.description ? `<p style="color:var(--color-text-muted)">${esc(cls.description)}</p>` : ''}
          </div>`).join('')}
        </div>
      </div>
    </section>`,
    css: '',
  };
}
