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
      .local-utility-bar { display: none; }
      .site-nav--local,
      .site-nav--local.scrolled { top: 0; }
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

      /* Sticky CTA rail */
      .sticky-cta-spacer {
        height: 96px;
        display: block;
      }

      .sticky-cta-bar {
        padding: 0.75rem 0.9rem calc(0.9rem + env(safe-area-inset-bottom));
        display: block;
      }

      .sticky-cta-bar__inner {
        gap: 0.6rem;
      }

      .sticky-cta-btn {
        min-height: 50px;
        padding: 0.9rem 0.85rem;
        font-size: 0.7rem;
      }

      .sticky-cta-bar--local .sticky-cta-btn {
        min-width: 0;
        padding: 0.85rem 0.35rem;
        font-size: 0.62rem;
        letter-spacing: 0;
        white-space: nowrap;
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
