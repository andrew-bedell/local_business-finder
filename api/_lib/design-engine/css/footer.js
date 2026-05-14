// Design Engine V2 — Footer CSS
// Footer styles, sticky CTA rail, "Diseñado por" attribution

export function getFooterCSS() {
  return `
    /* Footer */
    .site-footer {
      background: var(--color-dark);
      color: var(--color-text-light);
      padding: 4rem 0 2rem;
    }

    .site-footer__inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 3rem;
    }

    .site-footer__top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 3rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      margin-bottom: 2rem;
      gap: 2rem;
      flex-wrap: wrap;
    }

    .site-footer__brand {
      font-family: var(--font-heading);
      font-size: 1.4rem;
      font-weight: 400;
      color: var(--color-text-light);
      margin-bottom: 0.75rem;
    }

    .site-footer__tagline {
      font-size: 0.95rem;
      color: rgba(247,243,238,0.6);
      max-width: 320px;
      line-height: 1.6;
    }

    .site-footer__links {
      display: flex;
      gap: 2rem;
    }

    .site-footer__links a {
      font-size: 0.85rem;
      color: rgba(247,243,238,0.6);
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .site-footer__links a:hover {
      color: var(--color-accent-light);
    }

    .site-footer__social {
      display: flex;
      gap: 1.5rem;
    }

    .site-footer__social a {
      font-size: 0.8rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(247,243,238,0.5);
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .site-footer__social a:hover {
      color: var(--color-accent-light);
    }

    .site-footer__bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .site-footer__copyright {
      font-size: 0.8rem;
      color: rgba(247,243,238,0.4);
    }

    .site-footer__attribution {
      font-size: 0.75rem;
      color: rgba(247,243,238,0.35);
    }

    .site-footer__attribution a {
      color: rgba(247,243,238,0.5);
      text-decoration: none;
    }

    .site-footer__attribution a:hover {
      color: var(--color-accent-light);
    }

    /* Sticky CTA rail */
    .sticky-cta-spacer {
      height: 88px;
      display: none;
    }

    .sticky-cta-bar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 980;
      padding: 1rem 1.5rem calc(1rem + env(safe-area-inset-bottom));
      background: linear-gradient(180deg, rgba(247,243,238,0) 0%, rgba(247,243,238,0.92) 24%, rgba(247,243,238,0.98) 100%);
      backdrop-filter: blur(12px);
      display: none;
    }

    .sticky-cta-bar__inner {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 0.75rem;
    }

    .sticky-cta-bar--local .sticky-cta-bar__inner {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .sticky-cta-btn {
      min-height: 54px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-body);
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 0.95rem 1.2rem;
      text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.25s ease, background 0.25s ease;
      box-shadow: 0 10px 24px rgba(0,0,0,0.08);
    }

    .sticky-cta-btn:hover {
      transform: translateY(-2px);
      opacity: 1;
    }

    .sticky-cta-btn--secondary {
      background: rgba(255,255,255,0.92);
      color: var(--color-text);
      border: 1px solid rgba(0,0,0,0.08);
    }

    .sticky-cta-btn--primary {
      background: #25D366;
      color: #fff;
      border: 1px solid rgba(37,211,102,0.38);
    }

    .sticky-cta-btn--primary:hover {
      box-shadow: 0 14px 28px rgba(37, 211, 102, 0.26);
    }
  `;
}
