// Design Engine V2 — Footer CSS
// Footer styles, WhatsApp FAB, "Diseñado por" attribution

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

    /* WhatsApp FAB */
    .whatsapp-fab {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 56px;
      height: 56px;
      background: #25D366;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
      z-index: 900;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      text-decoration: none;
    }

    .whatsapp-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 24px rgba(37, 211, 102, 0.5);
      opacity: 1;
    }

    .whatsapp-fab svg {
      width: 28px;
      height: 28px;
      fill: #fff;
    }
  `;
}
