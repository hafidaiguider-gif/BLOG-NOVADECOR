/**
 * Ragnarok: The New World — landing page (TAF 2, Groupe 109)
 *
 * CONVERSION: the only conversion of the challenge is the FIRST LOGIN in the game,
 * reported by the client through a server-side postback (with the campaign id).
 * A CTA click is NOT a conversion, and the relay click is NOT a conversion either:
 * both are tracked here only to understand the funnel.
 *
 * This script never touches the Steam URL: the CTA links keep their exact href.
 *
 * Events (window.dataLayer if present — GA4 / AFBooster compatible — else console.debug):
 *   page_view, cta_click, scroll_faq, video_play, faq_open, relay_click
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'rtnw_lp_variant';
  var body = document.body;
  var docEl = document.documentElement;
  var reduceMotion = mq('(prefers-reduced-motion: reduce)');
  var variant = 'a';

  function mq(q) { return !!(window.matchMedia && window.matchMedia(q).matches); }

  function track(event, data) {
    var payload = { event: event, variant: variant, page_lang: docEl.lang };
    if (data) for (var k in data) if (Object.prototype.hasOwnProperty.call(data, k)) payload[k] = data[k];
    if (Array.isArray(window.dataLayer)) {
      try { window.dataLayer.push(payload); } catch (e) { /* never break the page */ }
    } else if (window.console && typeof window.console.debug === 'function') {
      window.console.debug('[lp]', payload);
    }
  }

  /* ---------- A/B 50/50 on the hero only (title, subtitle, visual, first proof) ---------- */
  function pickVariant() {
    var forced = null;
    try { forced = (new URLSearchParams(window.location.search).get('v') || '').toLowerCase(); } catch (e) { forced = null; }
    if (forced === 'a' || forced === 'b') return forced;          // QA override, not stored
    var stored = null;
    try { stored = window.localStorage.getItem(STORAGE_KEY); } catch (e) { stored = null; }
    if (stored === 'a' || stored === 'b') return stored;
    var drawn = Math.random() < 0.5 ? 'a' : 'b';
    try { window.localStorage.setItem(STORAGE_KEY, drawn); } catch (e) { /* storage blocked: keep for this view */ }
    return drawn;
  }

  function applyVariant(v) {
    variant = v;
    body.setAttribute('data-variant', v);
    var title = document.getElementById('hero-title');
    var text = title && title.getAttribute('data-title-' + v);
    if (text) title.textContent = text;
    Array.prototype.forEach.call(document.querySelectorAll('.hero [data-show]'), function (el) {
      el.hidden = el.getAttribute('data-show') !== v;
    });
  }

  /* ---------- CTA tracking (never blocks or rewrites the link) ---------- */
  function initCta() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[data-cta]') : null;
      if (a) track('cta_click', { cta_section: a.getAttribute('data-cta') });
    });
  }

  /* ---------- Sticky CTA: desktop shows it once the hero CTA is off screen ---------- */
  function initSticky() {
    var bar = document.getElementById('sticky-cta');
    var heroCta = document.querySelector('.hero .cta');
    if (!bar || !heroCta) return;
    var link = bar.querySelector('a');
    function set(visible) {
      bar.classList.toggle('is-visible', visible);
      // Mobile bar is always on screen; on desktop hide it from keyboard users while invisible.
      var desktop = mq('(min-width: 1024px)');
      if (link) link.tabIndex = (!desktop || visible) ? 0 : -1;
      bar.setAttribute('aria-hidden', String(desktop && !visible));
    }
    if (!('IntersectionObserver' in window)) { set(true); return; }
    new IntersectionObserver(function (entries) {
      set(!entries[0].isIntersecting);
    }, { threshold: 0 }).observe(heroCta);
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    var qs = Array.prototype.slice.call(document.querySelectorAll('.faq-q'));
    qs.forEach(function (q, i) {
      var panel = document.getElementById(q.getAttribute('aria-controls'));
      if (!panel) return;
      q.addEventListener('click', function () {
        var open = q.getAttribute('aria-expanded') === 'true';
        q.setAttribute('aria-expanded', String(!open));
        panel.hidden = open;
        if (!open) track('faq_open', { faq_id: q.getAttribute('data-faq'), faq_question: q.textContent.trim() });
      });
      q.addEventListener('keydown', function (e) {
        var t = null;
        if (e.key === 'ArrowDown') t = qs[(i + 1) % qs.length];
        else if (e.key === 'ArrowUp') t = qs[(i - 1 + qs.length) % qs.length];
        else if (e.key === 'Home') t = qs[0];
        else if (e.key === 'End') t = qs[qs.length - 1];
        if (t) { e.preventDefault(); t.focus(); }
      });
    });

    var faq = document.getElementById('faq');
    if (faq && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { track('scroll_faq', {}); io.disconnect(); }
      }, { threshold: 0.2 });
      io.observe(faq);
    }
  }

  /* ---------- Gallery lightbox (keyboard: arrows, Escape closes) ---------- */
  function initLightbox() {
    var dlg = document.getElementById('lightbox');
    var thumbs = Array.prototype.slice.call(document.querySelectorAll('.thumb'));
    if (!dlg || !thumbs.length || typeof dlg.showModal !== 'function') return;
    var img = dlg.querySelector('img');
    var cap = dlg.querySelector('.lb-cap');
    var current = 0, opener = null;

    function show(i) {
      current = (i + thumbs.length) % thumbs.length;
      var t = thumbs[current];
      var small = t.querySelector('img');
      img.src = t.getAttribute('data-full');
      img.alt = small ? small.alt : '';
      cap.textContent = (t.querySelector('.thumb-cap') || {}).textContent || '';
    }
    thumbs.forEach(function (t, i) {
      t.addEventListener('click', function () { opener = t; show(i); dlg.showModal(); dlg.querySelector('.lb-close').focus(); });
    });
    dlg.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1); });
    dlg.querySelector('.lb-next').addEventListener('click', function () { show(current + 1); });
    dlg.querySelector('.lb-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { if (opener) opener.focus(); });
  }

  /* ---------- Video: muted autoplay when on screen (not with reduced motion / Save-Data) ---------- */
  function initVideo() {
    var v = document.getElementById('teaser');
    if (!v) return;
    var played = false, userPaused = false;
    v.muted = true;
    v.addEventListener('play', function () {
      if (!played) { played = true; track('video_play', { video: 'teaser-47s', autoplay: !v.dataset.userStarted }); }
    });
    v.addEventListener('pause', function () { if (!v.dataset.autoPausing) userPaused = true; });
    v.addEventListener('click', function () { v.dataset.userStarted = '1'; });

    var saveData = !!(navigator.connection && navigator.connection.saveData);
    if (reduceMotion || saveData || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      if (e.isIntersecting && e.intersectionRatio >= 0.6) {
        if (!userPaused && v.paused) {
          var p = v.play();
          if (p && p.catch) p.catch(function () { /* autoplay refused: controls stay available */ });
        }
      } else if (!v.paused) {
        v.dataset.autoPausing = '1'; v.pause(); delete v.dataset.autoPausing;
      }
    }, { threshold: [0, 0.6] }).observe(v);
  }

  /* ---------- Relay mobile -> PC (not a conversion) ---------- */
  function relayUrl() {
    // Points to THIS landing page (never Steam), keeps the arrival params (campaign id…), adds relais=1.
    try {
      var u = new URL(window.location.href);
      u.hash = '';
      u.searchParams.set('relais', '1');
      return u.toString();
    } catch (e) {
      var base = window.location.href.split('#')[0];
      return base + (base.indexOf('?') === -1 ? '?' : '&') + 'relais=1';
    }
  }

  var toastTimer;
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 3800);
  }

  function initRelay() {
    var openBtn = document.querySelector('[data-relay-open]');
    var panel = document.getElementById('relay-panel');
    var t = document.getElementById('toast');
    if (!openBtn || !panel || !t) return;
    var input = document.getElementById('relay-url');
    var shareText = t.getAttribute('data-share-text');

    openBtn.addEventListener('click', function () {
      var url = relayUrl();
      input.value = url;
      panel.querySelector('[data-relay="email"]').href = 'mailto:?subject=' + encodeURIComponent(t.getAttribute('data-mail-subject')) + '&body=' + encodeURIComponent(shareText + ' ' + url);
      panel.querySelector('[data-relay="line"]').href = 'https://line.me/R/share?text=' + encodeURIComponent(shareText + ' ' + url);
      panel.querySelector('[data-relay="share"]').hidden = typeof navigator.share !== 'function';
      track('relay_click', { relay_method: 'open' });
      if (typeof panel.showModal === 'function') panel.showModal(); else panel.setAttribute('open', '');
    });

    panel.addEventListener('click', function (e) {
      if (e.target === panel || e.target.closest('[data-relay-close]')) { close(); return; }
      var act = e.target.closest('[data-relay]');
      if (!act) return;
      var method = act.getAttribute('data-relay');
      track('relay_click', { relay_method: method });
      if (method === 'copy') copy(input.value);
      if (method === 'share' && typeof navigator.share === 'function') {
        navigator.share({ title: document.title, text: shareText, url: input.value }).catch(function () { /* cancelled */ });
      }
    });

    function close() {
      if (typeof panel.close === 'function' && panel.open) panel.close(); else panel.removeAttribute('open');
      openBtn.focus();
    }
    function copy(text) {
      function fallback() {
        input.focus(); input.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        toast(ok ? t.getAttribute('data-copied') : t.getAttribute('data-fallback'));
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast(t.getAttribute('data-copied')); }, fallback);
      } else fallback();
    }
  }

  function init() {
    applyVariant(pickVariant());
    track('page_view', { page_path: window.location.pathname });
    initCta();
    initSticky();
    initFaq();
    initLightbox();
    initVideo();
    initRelay();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
