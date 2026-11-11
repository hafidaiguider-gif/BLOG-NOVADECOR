/**
 * Ragnarok: The New World — Landing page (TAF 2, Groupe 109)
 * Single conversion goal: first login after installing via Steam.
 *
 * - A/B hero headline: ?v=a / ?v=b, else localStorage, else A
 * - cta_click tracking pushed to window.dataLayer (only if it exists), never blocks navigation
 * - Accessible FAQ accordion (aria-expanded / aria-controls, arrow keys)
 * - "Send this link to my PC" relay button (navigator.share on mobile, clipboard + toast otherwise)
 * - Mobile sticky CTA bar after 300 px of scroll
 * - Scroll reveal + light hero parallax, both disabled with prefers-reduced-motion
 * No external libraries. No console output.
 */
(function () {
  'use strict';

  var STEAM_URL = 'https://store.steampowered.com/app/4212480/Ragnarok_The_New_World/';
  var STORAGE_KEY = 'rtnw_hero_variant';
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var variant = 'a';

  root.classList.add('js');

  function push(data) {
    // Push only if a tag manager created dataLayer; never create or block anything.
    if (Array.isArray(window.dataLayer)) {
      try { window.dataLayer.push(data); } catch (e) { /* ignore */ }
    }
  }

  /* ---------- A/B hero ---------- */
  function readStoredVariant() {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function storeVariant(v) {
    try { window.localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* storage blocked */ }
  }
  function applyVariant(v) {
    variant = v === 'b' ? 'b' : 'a';
    root.setAttribute('data-variant', variant);
    var title = document.getElementById('hero-title');
    if (title) {
      var text = title.getAttribute('data-title-' + variant);
      if (text) title.textContent = text;
    }
    var buttons = document.querySelectorAll('.ab-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-variant') === variant));
    }
  }
  function initVariant() {
    var param = null;
    try { param = new URLSearchParams(window.location.search).get('v'); } catch (e) { param = null; }
    if (param === 'a' || param === 'b') {
      storeVariant(param);
      applyVariant(param);
    } else {
      applyVariant(readStoredVariant());
    }
    push({ event: 'ab_variant_view', variant: variant });

    var buttons = document.querySelectorAll('.ab-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        var v = this.getAttribute('data-variant');
        storeVariant(v);
        applyVariant(v);
      });
    }
  }

  /* ---------- CTA tracking ---------- */
  function initCtaTracking() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('a[data-cta]') : null;
      if (!link) return;
      push({
        event: 'cta_click',
        cta_position: link.getAttribute('data-cta'),
        variant: variant,
        destination: STEAM_URL
      });
      // No preventDefault: the browser follows the Steam link normally.
    });
  }

  /* ---------- Accordion ---------- */
  function initAccordion() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('.acc-btn'));
    buttons.forEach(function (btn, index) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        panel.hidden = open;
      });
      btn.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowDown') next = buttons[(index + 1) % buttons.length];
        else if (e.key === 'ArrowUp') next = buttons[(index - 1 + buttons.length) % buttons.length];
        else if (e.key === 'Home') next = buttons[0];
        else if (e.key === 'End') next = buttons[buttons.length - 1];
        if (next) { e.preventDefault(); next.focus(); }
      });
    });
  }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(message) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el.classList.remove('is-visible'); }, 4500);
  }

  /* ---------- Relay: send this landing page to my PC ---------- */
  function relayUrl() {
    var url;
    try {
      url = new URL(window.location.href);
      url.hash = '';
      url.search = '';
      url.searchParams.set('relais', '1');
      url.searchParams.set('v', variant);
      return url.toString();
    } catch (e) {
      return window.location.href.split('#')[0].split('?')[0] + '?relais=1&v=' + variant;
    }
  }
  function initRelay() {
    var btn = document.querySelector('[data-relay]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var link = relayUrl();
      var isMobile = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      push({ event: 'relay_click', variant: variant, method: isMobile && navigator.share ? 'share' : 'copy' });

      if (isMobile && navigator.share) {
        navigator.share({ title: 'Ragnarok: The New World — install on PC', url: link })
          .then(function () { toast('Link sent. Open it on your PC.'); })
          .catch(function (err) { if (!err || err.name !== 'AbortError') copy(link); });
        return;
      }
      copy(link);
    });

    function copy(link) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link)
          .then(function () { toast('Link copied. Paste it on your PC.'); })
          .catch(function () { toast('Copy this link: ' + link); });
      } else {
        toast('Copy this link: ' + link);
      }
    }
  }

  /* ---------- Scroll: sticky bar + parallax ---------- */
  function initScroll() {
    var bar = document.getElementById('sticky-cta');
    var barLink = bar ? bar.querySelector('a') : null;
    var heroImg = document.querySelector('.hero-art-img');
    var hero = document.getElementById('hero');
    var ticking = false;
    var barShown = false;

    function update() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var show = y > 300;
      if (bar && show !== barShown) {
        barShown = show;
        bar.classList.toggle('is-visible', show);
        bar.setAttribute('aria-hidden', String(!show));
        if (barLink) barLink.setAttribute('tabindex', show ? '0' : '-1');
      }
      if (!reduceMotion && heroImg && hero && y < hero.offsetHeight) {
        heroImg.style.setProperty('--parallax', (y * 0.18).toFixed(1) + 'px');
      }
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add('is-visible');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  function init() {
    initVariant();
    initCtaTracking();
    initAccordion();
    initRelay();
    initScroll();
    initReveal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
