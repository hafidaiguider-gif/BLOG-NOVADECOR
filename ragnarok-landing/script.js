/**
 * Ragnarok: The New World — Landing page (TAF 2, Groupe 109)
 * - Menu mobile accessible (aria-expanded, Échap, fermeture au clic)
 * - Accordéon FAQ WAI-ARIA (Entrée/Espace, flèches, Début/Fin)
 * - Barre CTA flottante affichée hors du hero et masquée sur le CTA final
 * - Suivi des clics CTA via window.dataLayer (sans modifier l'URL Steam)
 */
(function () {
  'use strict';

  var STEAM_URL = 'https://store.steampowered.com/app/4212480/Ragnarok_The_New_World/';

  /* ---------- Menu mobile ---------- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
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

  /* ---------- Accordéon FAQ ---------- */
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

  /* ---------- Barre CTA flottante ---------- */
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

  /* ---------- Suivi des clics CTA ---------- */
  function initTracking() {
    window.dataLayer = window.dataLayer || [];
    document.addEventListener('click', function (e) {
      var cta = e.target.closest('[data-cta]');
      if (!cta) return;
      window.dataLayer.push({
        event: 'cta_click',
        cta_location: cta.getAttribute('data-cta'),
        cta_destination: STEAM_URL,
        conversion_goal: 'first_login'
      });
    });
  }

  function init() {
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
