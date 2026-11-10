/**
 * Ragnarok: The New World — Landing page (TAF 2, Group 109)
 * - Hero headline A/B test: ?angle=b on the landing URL (default: angle A)
 * - Accessible mobile menu (aria-expanded, Escape, closes on link click)
 * - WAI-ARIA FAQ accordion (Enter/Space, arrow keys, Home/End)
 * - Floating CTA bar shown outside the hero, hidden over the final CTA
 * - CTA click tracking via window.dataLayer (Steam URL is never modified)
 */
(function () {
  'use strict';

  var STEAM_URL = 'https://store.steampowered.com/app/4212480/Ragnarok_The_New_World/';
  var heroAngle = 'a';

  /* ---------- Hero headline A/B ---------- */
  function initHeroAngle() {
    var title = document.getElementById('hero-title');
    if (!title) return;
    var match = /[?&]angle=([ab])\b/i.exec(window.location.search || '');
    heroAngle = match ? match[1].toLowerCase() : 'a';
    var text = title.getAttribute('data-angle-' + heroAngle);
    if (text) title.textContent = text;
    document.documentElement.setAttribute('data-hero-angle', heroAngle);
  }

  /* ---------- Mobile menu ---------- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    var mq = window.matchMedia('(min-width: 881px)');
    var onChange = function () { if (mq.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* ---------- FAQ accordion ---------- */
  function initAccordion() {
    var triggers = Array.prototype.slice.call(document.querySelectorAll('.accordion-trigger'));
    if (!triggers.length) return;

    triggers.forEach(function (btn, index) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;

      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        panel.hidden = expanded;
      });

      btn.addEventListener('keydown', function (e) {
        var target = null;
        switch (e.key) {
          case 'ArrowDown': target = triggers[(index + 1) % triggers.length]; break;
          case 'ArrowUp': target = triggers[(index - 1 + triggers.length) % triggers.length]; break;
          case 'Home': target = triggers[0]; break;
          case 'End': target = triggers[triggers.length - 1]; break;
          default: return;
        }
        e.preventDefault();
        target.focus();
      });
    });
  }

  /* ---------- Floating CTA bar ---------- */
  function initFloatingBar() {
    var bar = document.getElementById('floating-bar');
    var hero = document.getElementById('hero');
    var final = document.getElementById('final');
    if (!bar || !hero) return;
    var link = bar.querySelector('a');

    var heroVisible = true;
    var finalVisible = false;

    function update() {
      var show = !heroVisible && !finalVisible;
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', String(!show));
      if (link) link.setAttribute('tabindex', show ? '0' : '-1');
    }

    if (!('IntersectionObserver' in window)) {
      heroVisible = false;
      update();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target === hero) heroVisible = entry.isIntersecting;
        if (entry.target === final) finalVisible = entry.isIntersecting;
      });
      update();
    }, { threshold: 0.15 });

    observer.observe(hero);
    if (final) observer.observe(final);
  }

  /* ---------- CTA click tracking ---------- */
  function initTracking() {
    window.dataLayer = window.dataLayer || [];
    document.addEventListener('click', function (e) {
      var cta = e.target.closest('[data-cta]');
      if (!cta) return;
      window.dataLayer.push({
        event: 'cta_click',
        cta_location: cta.getAttribute('data-cta'),
        cta_destination: STEAM_URL,
        hero_angle: heroAngle,
        conversion_goal: 'first_login'
      });
    });
  }

  function init() {
    initHeroAngle();
    initNav();
    initAccordion();
    initFloatingBar();
    initTracking();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
