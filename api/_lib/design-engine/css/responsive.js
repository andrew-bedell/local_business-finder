// Design Engine V2 — Responsive CSS
// 1100px breakpoint, mobile overrides

export function getResponsiveCSS() {
  return `
    @media (max-width: 1100px) {
      /* Nav: show hamburger, hide desktop links */
      .hamburger { display: flex; }
      .site-nav__links { display: none; }
      .site-nav__cta--desktop { display: none; }

      .site-nav__inner { padding: 0 1.5rem; }
      .site-nav__logo {
        flex: 1 1 auto;
        max-width: none;
      }

      /* Container */
      .container { padding: 0 1.5rem; }

      /* Sections */
      .section { padding: 4rem 0; }

      /* Grids collapse */
      .grid--2, .grid--3 { grid-template-columns: 1fr; }

      /* Split layout stacks */
      .split {
        grid-template-columns: 1fr;
        gap: 2rem;
      }

      .split--reverse { direction: ltr; }

      /* Service grid */
      .service-grid {
        grid-template-columns: 1fr;
      }

      /* Gallery items */
      .h-scroll__item {
        flex: 0 0 260px;
      }

      .h-scroll__item img {
        height: 220px;
      }

      /* Hero adjustments */
      .hero { padding: 0 1.5rem; }
      .hero__content { padding: 0 0.5rem; }

      /* Tier cards */
      .tier-card { padding: 2rem 1.5rem; }

      /* Footer */
      .site-footer__top {
        flex-direction: column;
        gap: 1.5rem;
      }

      .site-footer__inner { padding: 0 1.5rem; }

      .site-footer__bottom {
        flex-direction: column;
        text-align: center;
      }

      /* Buttons — ensure touch targets */
      .btn {
        min-height: 44px;
        padding: 0.9rem 2rem;
      }

      /* WhatsApp FAB */
      .whatsapp-fab {
        bottom: 1.5rem;
        right: 1.5rem;
        width: 52px;
        height: 52px;
      }

      /* Menu items */
      .menu-item {
        flex-direction: column;
        gap: 0.25rem;
      }

      .menu-item__price {
        margin-left: 0;
      }
    }
  `;
}
