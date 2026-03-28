// Design Engine V2 — Animation CSS
// Scroll reveal, stagger, marquee, hover micro-interactions

export function getAnimationCSS() {
  return `
    /* Scroll reveal */
    .reveal {
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }

    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .reveal-left {
      opacity: 0;
      transform: translateX(-40px);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }

    .reveal-left.visible {
      opacity: 1;
      transform: translateX(0);
    }

    .reveal-right {
      opacity: 0;
      transform: translateX(40px);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }

    .reveal-right.visible {
      opacity: 1;
      transform: translateX(0);
    }

    /* Fallback: if JS/IntersectionObserver fails, show content after 2s */
    @media (prefers-reduced-motion: reduce) {
      .reveal, .reveal-left, .reveal-right { opacity: 1; transform: none; transition: none; }
    }

    /* Stagger delays */
    .stagger-1 { transition-delay: 0.1s; }
    .stagger-2 { transition-delay: 0.2s; }
    .stagger-3 { transition-delay: 0.3s; }
    .stagger-4 { transition-delay: 0.4s; }
    .stagger-5 { transition-delay: 0.5s; }

    /* Hero entrance — staggered fade-up */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .hero-animate {
      opacity: 0;
      animation: fadeUp 0.8s ease forwards;
    }

    .hero-animate:nth-child(1) { animation-delay: 0.3s; }
    .hero-animate:nth-child(2) { animation-delay: 0.5s; }
    .hero-animate:nth-child(3) { animation-delay: 0.7s; }
    .hero-animate:nth-child(4) { animation-delay: 0.9s; }

    /* Marquee strip */
    @keyframes marquee {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }

    .marquee-strip {
      overflow: hidden;
      white-space: nowrap;
      padding: 1.2rem 0;
      background: var(--color-dark);
      color: var(--color-text-light);
    }

    .marquee-strip__inner {
      display: inline-block;
      animation: marquee 25s linear infinite;
    }

    .marquee-strip__inner span {
      font-family: var(--font-heading);
      font-size: 0.85rem;
      font-weight: 400;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin: 0 3rem;
    }

    /* Scroll indicator */
    @keyframes scrollBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(8px); }
    }

    .scroll-indicator {
      position: absolute;
      bottom: 2.5rem;
      left: 50%;
      transform: translateX(-50%);
      animation: scrollBounce 2s ease infinite;
      color: rgba(255,255,255,0.6);
      font-size: 1.5rem;
    }

    /* Link underline animation */
    .link-animated {
      position: relative;
      text-decoration: none;
    }

    .link-animated::after {
      content: '';
      position: absolute;
      bottom: -2px; left: 0;
      width: 0; height: 1px;
      background: currentColor;
      transition: width 0.3s ease;
    }

    .link-animated:hover::after {
      width: 100%;
    }
  `;
}
