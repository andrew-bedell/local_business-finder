// Design Engine V2 — Navigation CSS
// Sticky nav with mix-blend-mode, hamburger, mobile menu, sticky CTA

export function getNavCSS() {
  return `
    /* Navigation */
    .site-nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 1000;
      padding: 1.5rem 0;
      transition: padding 0.3s ease, background 0.3s ease;
      mix-blend-mode: difference;
    }

    .site-nav.scrolled {
      padding: 0.8rem 0;
      mix-blend-mode: normal;
      background: rgba(26, 23, 20, 0.95);
      backdrop-filter: blur(12px);
    }

    .site-nav__inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 3rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.25rem;
    }

    .site-nav__logo {
      display: block;
      flex: 0 1 28rem;
      min-width: 0;
      max-width: min(30rem, 36vw);
      font-family: var(--font-heading);
      font-size: 1.4rem;
      font-weight: 400;
      color: #fff;
      text-decoration: none;
      letter-spacing: -0.02em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .site-nav__links {
      display: flex;
      flex: 0 1 auto;
      min-width: 0;
      align-items: center;
      justify-content: flex-end;
      gap: clamp(1rem, 1.8vw, 2.5rem);
      list-style: none;
    }

    .site-nav__links li {
      flex: 0 0 auto;
    }

    .site-nav__links a {
      font-family: var(--font-body);
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #fff;
      text-decoration: none;
      transition: opacity 0.3s ease;
      white-space: nowrap;
    }

    .site-nav__links a:hover {
      opacity: 0.7;
    }

    /* Nav CTA button */
    .site-nav__cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-body);
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #fff;
      background: var(--color-accent);
      padding: 0.7rem 1.6rem;
      border: none;
      text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.3s ease;
      cursor: pointer;
      mix-blend-mode: normal;
      white-space: nowrap;
    }

    .site-nav__cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(var(--color-accent-rgb), 0.4);
      opacity: 1;
    }

    /* Hamburger */
    .hamburger {
      display: none;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      z-index: 1001;
      flex-shrink: 0;
      flex-direction: column;
      gap: 5px;
    }

    .hamburger span {
      display: block;
      width: 24px;
      height: 2px;
      background: #fff;
      border-radius: 1px;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }

    .hamburger.active span:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }

    .hamburger.active span:nth-child(2) {
      opacity: 0;
    }

    .hamburger.active span:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }

    /* Mobile menu */
    .mobile-menu {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: var(--color-dark);
      z-index: 999;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 0;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .mobile-menu.active {
      display: flex;
      opacity: 1;
    }

    .mobile-menu a {
      font-family: var(--font-heading);
      font-size: clamp(1.5rem, 4vw, 2.2rem);
      font-weight: 300;
      color: var(--color-text-light);
      text-decoration: none;
      padding: 1rem 2rem;
      transition: color 0.3s ease;
      display: block;
    }

    .mobile-menu a:hover {
      color: var(--color-accent-light);
      opacity: 1;
    }

    .mobile-menu .mobile-cta {
      margin-top: 2rem;
      font-family: var(--font-body);
      font-size: 0.85rem;
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      background: var(--color-accent);
      color: #fff;
      padding: 1rem 2.5rem;
      text-decoration: none;
    }
  `;
}
