// Design Engine V2 — Inline JavaScript runtime
// Hamburger menu, scroll reveal (IntersectionObserver), smooth scroll, nav scroll behavior

export function getRuntimeJS() {
  return `
(function() {
  'use strict';

  // Hamburger toggle
  var hamburger = document.querySelector('.hamburger');
  var mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // Nav scroll behavior — shrink + solid bg
  var nav = document.querySelector('.site-nav');
  if (nav) {
    var lastScroll = 0;
    window.addEventListener('scroll', function() {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollY > 80) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
      lastScroll = scrollY;
    }, { passive: true });
  }

  // Scroll reveal — IntersectionObserver
  var reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (reveals.length > 0 && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(function(el) { observer.observe(el); });
  } else {
    // Fallback: show everything
    reveals.forEach(function(el) { el.classList.add('visible'); });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
  `.trim();
}
