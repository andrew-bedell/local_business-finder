// Design Engine V2 — Base CSS
// Reset, typography scale, spacing, layout utilities, section patterns

export function getBaseCSS() {
  return `
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    html { scroll-behavior: smooth; }

    body {
      font-family: var(--font-body);
      font-weight: 300;
      font-size: 1rem;
      line-height: 1.8;
      color: var(--color-text);
      background-color: var(--color-bg);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    img { max-width: 100%; height: auto; display: block; }

    a { color: var(--color-accent); text-decoration: none; transition: opacity 0.3s ease; }
    a:hover { opacity: 0.8; }

    /* Typography scale — fluid sizing with clamp() */
    h1, h2, h3, h4 { font-family: var(--font-heading); line-height: 1.15; }

    h1 {
      font-size: clamp(2.5rem, 5vw, 4.5rem);
      font-weight: var(--hero-weight);
      line-height: 1.05;
      letter-spacing: -0.02em;
    }

    h2 {
      font-size: clamp(1.8rem, 3.5vw, 2.8rem);
      font-weight: 400;
    }

    h3 {
      font-size: clamp(1.2rem, 2vw, 1.5rem);
      font-weight: 500;
    }

    p { margin-bottom: 1rem; }
    p:last-child { margin-bottom: 0; }

    /* Eyebrow / label text */
    .eyebrow {
      font-family: var(--font-body);
      font-size: 0.72rem;
      font-weight: 500;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--color-accent);
      margin-bottom: 1rem;
      display: block;
    }

    /* Container */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 3rem;
    }

    /* Section base */
    .section {
      padding: 6rem 0;
      position: relative;
    }

    .section--alt { background-color: var(--color-bg-alt); }
    .section--dark {
      background-color: var(--color-dark);
      color: var(--color-text-light);
    }
    .section--dark h2, .section--dark h3 { color: var(--color-text-light); }
    .section--dark .eyebrow { color: var(--color-accent-light); }
    .section--dark p { color: rgba(247, 243, 238, 0.8); }
    .section--accent {
      background-color: var(--color-accent);
      color: var(--color-on-accent);
    }
    .section--accent h2,
    .section--accent h3 { color: var(--color-on-accent); }
    .section--accent p { color: rgba(var(--color-on-accent-rgb), 0.88); }

    .section-header {
      margin-bottom: 3.5rem;
    }

    .section-header h2 {
      margin-top: 0.5rem;
    }

    /* Grid utilities */
    .grid { display: grid; gap: 2rem; }
    .grid--2 { grid-template-columns: repeat(2, 1fr); }
    .grid--3 { grid-template-columns: repeat(3, 1fr); }
    .grid--4 { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }

    /* Split layout (image + text) */
    .split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
    }

    .split--reverse { direction: rtl; }
    .split--reverse > * { direction: ltr; }

    /* Card */
    .card {
      padding: 2rem;
      border-radius: 4px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .card:hover {
      transform: translateY(-4px);
    }

    .card--bordered {
      border: 1px solid rgba(0,0,0,0.06);
    }

    .card--filled {
      background: var(--color-bg-alt);
    }

    .card--dark {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
    }

    /* Image containers */
    .img-cover {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .img-rounded { border-radius: 8px; overflow: hidden; }

    .aspect-4-3 { aspect-ratio: 4/3; }
    .aspect-16-9 { aspect-ratio: 16/9; }
    .aspect-1 { aspect-ratio: 1; }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-family: var(--font-body);
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      padding: 1rem 2.2rem;
      border: none;
      cursor: pointer;
      transition: transform 0.2s ease, background 0.3s ease, box-shadow 0.3s ease;
      text-decoration: none;
      line-height: 1;
    }

    .btn:hover {
      transform: translateY(-2px);
      opacity: 1;
    }

    .btn--primary {
      background: var(--color-accent);
      color: var(--color-on-accent);
    }

    .btn--primary:hover {
      box-shadow: 0 8px 24px rgba(var(--color-accent-rgb), 0.3);
    }

    .btn--outline {
      background: transparent;
      border: 1.5px solid var(--color-accent);
      color: var(--color-accent);
    }

    .btn--outline:hover {
      background: var(--color-accent);
      color: var(--color-on-accent);
    }

    .btn--white {
      background: #fff;
      color: var(--color-accent);
    }

    .btn-arrow {
      display: inline-block;
      transition: transform 0.3s ease;
    }

    .btn:hover .btn-arrow {
      transform: translateX(4px);
    }

    /* Stars */
    .stars { color: #D4A017; letter-spacing: 2px; }

    /* Divider */
    .divider {
      width: 60px;
      height: 2px;
      background: var(--color-accent);
      margin: 1.5rem 0;
    }

    /* Service grid with 1px gap luxury effect */
    .service-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1px;
      background: rgba(0,0,0,0.06);
      border: 1px solid rgba(0,0,0,0.06);
    }

    .service-grid__item {
      background: var(--color-bg);
      padding: 2.5rem;
      position: relative;
      transition: background 0.3s ease;
    }

    .service-grid__item::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 3px;
      background: var(--color-accent);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.4s ease;
    }

    .service-grid__item:hover::before {
      transform: scaleX(1);
    }

    .service-grid__item:hover {
      background: var(--color-bg-alt);
    }

    .service-grid__item h3 {
      margin-bottom: 0.75rem;
    }

    .service-grid__item p {
      color: var(--color-text-muted);
      font-size: 0.95rem;
    }

    /* Testimonial quote */
    .quote {
      font-family: var(--font-heading);
      font-style: italic;
      font-size: clamp(1.1rem, 2vw, 1.4rem);
      line-height: 1.7;
    }

    .quote-author {
      font-family: var(--font-body);
      font-size: 0.85rem;
      font-weight: 500;
      margin-top: 1rem;
      font-style: normal;
    }

    /* Horizontal scroll gallery */
    .h-scroll {
      display: flex;
      gap: 1.5rem;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      padding: 1rem 0;
      scrollbar-width: none;
    }

    .h-scroll::-webkit-scrollbar { display: none; }

    .h-scroll__item {
      flex: 0 0 320px;
      scroll-snap-align: start;
      border-radius: 6px;
      overflow: hidden;
      transition: transform 0.3s ease;
    }

    .h-scroll__item:hover {
      transform: scale(0.98);
    }

    .h-scroll__item img {
      width: 100%;
      height: 280px;
      object-fit: cover;
    }

    /* Menu display (restaurants) */
    .menu-category { margin-bottom: 3rem; }

    .menu-category h3 {
      font-family: var(--font-heading);
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(0,0,0,0.1);
      margin-bottom: 1.5rem;
    }

    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 0.75rem 0;
      border-bottom: 1px dotted rgba(0,0,0,0.08);
    }

    .menu-item__name {
      font-family: var(--font-heading);
      font-size: 1.05rem;
      font-weight: 500;
    }

    .menu-item__desc {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      margin-top: 0.25rem;
    }

    .menu-item__price {
      font-family: var(--font-heading);
      font-size: 1.05rem;
      color: var(--color-accent);
      white-space: nowrap;
      margin-left: 2rem;
    }

    /* Pricing tiers (gyms, services) */
    .tier-card {
      text-align: center;
      padding: 2.5rem 2rem;
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 4px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .tier-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.08);
    }

    .tier-card--featured {
      border-color: var(--color-accent);
      position: relative;
    }

    .tier-card--featured::before {
      content: 'Popular';
      position: absolute;
      top: -12px; left: 50%;
      transform: translateX(-50%);
      background: var(--color-accent);
      color: var(--color-on-accent);
      font-size: 0.7rem;
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 4px 16px;
      border-radius: 20px;
    }

    .tier-card__price {
      font-family: var(--font-heading);
      font-size: 2.5rem;
      font-weight: 400;
      color: var(--color-accent);
      margin: 1rem 0;
    }

    .tier-card__features {
      list-style: none;
      margin: 1.5rem 0;
    }

    .tier-card__features li {
      padding: 0.5rem 0;
      font-size: 0.95rem;
      color: var(--color-text-muted);
      border-bottom: 1px solid rgba(0,0,0,0.04);
    }
  `;
}
