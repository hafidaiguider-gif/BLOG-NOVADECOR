/**
 * Ragnarok: The New World — Landing page (AFBooster)
 * Single conversion goal: first login on PC via Steam.
 *
 *  - A/B hero: ?variant=a | ?variant=b (default B), remembered in localStorage
 *  - Tracking: cta_click, relay_click, video_play (+ video_progress) → window.dataLayer
 *    console.log mirror only in debug mode (?debug=1) to keep the production console clean
 *  - FAQ accordion (keyboard: Enter/Space, ArrowUp/Down, Home/End)
 *  - Trailer: custom play button, chapters, captions toggle, no autoplay
 *  - Relay "send this page to my PC": copy link + Email / WhatsApp / LINE / native share, toast
 *  - Discord counter, scroll reveal, light hero parallax (all off with prefers-reduced-motion)
 */
(function () {
  'use strict';

  var STEAM_URL = 'https://store.steampowered.com/app/4212480/Ragnarok_The_New_World/';
  var STORAGE_KEY = 'rtnw_variant';
  var root = document.documentElement;
  var params = safeParams();
  var DEBUG = params.get('debug') === '1';
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var variant = 'b';

  root.classList.add('js');
  window.dataLayer = window.dataLayer || [];

  function safeParams() {
    try { return new URLSearchParams(window.location.search); } catch (e) { return { get: function () { return null; } }; }
  }

  function track(event, data) {
    var payload = { event: event, variant: variant };
    for (var k in data) if (Object.prototype.hasOwnProperty.call(data, k)) payload[k] = data[k];
    try { window.dataLayer.push(payload); } catch (e) { /* never break the page */ }
    if (DEBUG && window.console) window.console.log('[track]', payload);
  }

  /* ---------- A/B hero ---------- */
  function store(v) { try { window.localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* blocked */ } }
  function stored() { try { return window.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; } }

  function applyVariant(v) {
    variant = v === 'a' ? 'a' : 'b';
    root.setAttribute('data-variant', variant);
    var title = document.getElementById('hero-title');
    var text = title && title.getAttribute('data-variant-' + variant);
    if (text) title.textContent = text;
  }

  function initVariant() {
    var fromUrl = (params.get('variant') || '').toLowerCase();
    if (fromUrl === 'a' || fromUrl === 'b') { store(fromUrl); applyVariant(fromUrl); }
    else applyVariant(stored() || 'b');
    track('variant_view', {});

    if (DEBUG) {
      var box = document.querySelector('.ab-debug');
      if (box) {
        box.hidden = false;
        box.addEventListener('click', function (e) {
          var b = e.target.closest('[data-set-variant]');
          if (b) { store(b.getAttribute('data-set-variant')); applyVariant(b.getAttribute('data-set-variant')); }
        });
      }
    }
  }

  /* ---------- CTA tracking (never blocks navigation) ---------- */
  function initCta() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[data-cta]') : null;
      if (!a) return;
      track('cta_click', { cta_position: a.getAttribute('data-cta'), cta_url: STEAM_URL });
    });
  }

  /* ---------- FAQ ---------- */
  function initFaq() {
    var qs = Array.prototype.slice.call(document.querySelectorAll('.faq-q'));
    qs.forEach(function (q, i) {
      var panel = document.getElementById(q.getAttribute('aria-controls'));
      if (!panel) return;
      q.addEventListener('click', function () {
        var open = q.getAttribute('aria-expanded') === 'true';
        q.setAttribute('aria-expanded', String(!open));
        if (open) {
          panel.classList.remove('is-open');
          if (reduceMotion) panel.hidden = true;
          else window.setTimeout(function () { if (q.getAttribute('aria-expanded') === 'false') panel.hidden = true; }, 360);
        } else {
          panel.hidden = false;
          window.requestAnimationFrame(function () { panel.classList.add('is-open'); });
        }
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
  }

  /* Build a captions track from the inline WebVTT block (works from file:// and http) */
  function toSeconds(t) {
    var p = t.trim().split(':');
    var s = 0;
    for (var i = 0; i < p.length; i++) s = s * 60 + parseFloat(p[i]);
    return s;
  }
  function buildCaptions(video) {
    var src = document.getElementById('captions-en');
    if (!src || !video.addTextTrack || typeof window.VTTCue !== 'function') return null;
    var track = video.addTextTrack('captions', src.getAttribute('data-label') || 'English', src.getAttribute('data-lang') || 'en');
    src.textContent.replace(/\r/g, '').split(/\n\s*\n/).forEach(function (block) {
      var lines = block.trim().split('\n');
      var timing = null, i;
      for (i = 0; i < lines.length; i++) { if (lines[i].indexOf('-->') !== -1) { timing = lines[i]; break; } }
      if (!timing) return;
      var parts = timing.split('-->');
      var text = lines.slice(i + 1).join('\n').trim();
      if (text) track.addCue(new window.VTTCue(toSeconds(parts[0]), toSeconds(parts[1].trim().split(' ')[0]), text));
    });
    track.mode = 'hidden';
    return track;
  }

  /* ---------- Trailer player ---------- */
  function initPlayer() {
    var wrap = document.querySelector('[data-player]');
    if (!wrap) return;
    var video = wrap.querySelector('video');
    var overlay = wrap.querySelector('.player-overlay');
    var chapters = wrap.querySelectorAll('.chapter');
    var cc = wrap.querySelector('.cc-btn');
    var started = false;
    var marks = { 25: false, 50: false, 75: false, 100: false };

    function start(at) {
      wrap.classList.add('is-playing');
      video.controls = true;
      if (typeof at === 'number') {
        try { video.currentTime = at; } catch (e) { /* metadata not loaded yet */ }
        if (video.readyState < 1) video.addEventListener('loadedmetadata', function once() { video.currentTime = at; video.removeEventListener('loadedmetadata', once); });
      }
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* user can press play in native controls */ });
      video.focus();
    }

    overlay.addEventListener('click', function () { start(); });

    video.addEventListener('play', function () {
      if (!started) { started = true; track('video_play', { video_title: 'Official trailer', video_position: Math.round(video.currentTime) }); }
    });
    video.addEventListener('timeupdate', function () {
      if (!video.duration) return;
      var pct = (video.currentTime / video.duration) * 100;
      [25, 50, 75].forEach(function (m) { if (!marks[m] && pct >= m) { marks[m] = true; track('video_progress', { percent: m }); } });
      for (var i = 0; i < chapters.length; i++) {
        var from = +chapters[i].getAttribute('data-time');
        var to = chapters[i + 1] ? +chapters[i + 1].getAttribute('data-time') : Infinity;
        chapters[i].setAttribute('aria-pressed', String(video.currentTime >= from && video.currentTime < to));
      }
    });
    video.addEventListener('ended', function () { if (!marks[100]) { marks[100] = true; track('video_progress', { percent: 100 }); } });

    Array.prototype.forEach.call(chapters, function (btn) {
      btn.addEventListener('click', function () {
        var t = +btn.getAttribute('data-time');
        track('video_chapter', { chapter: btn.firstChild.textContent.trim(), time: t });
        start(t);
      });
    });

    // "Real in-game footage" is shown only when the section is flagged data-footage-note="real"
    var section = wrap.closest('[data-footage-note]');
    var note = document.getElementById('footage-note');
    if (section && note && section.getAttribute('data-footage-note') === 'real') {
      note.textContent = 'Real in-game footage. No sound until you press play.';
    }

    var captions = buildCaptions(video);
    if (cc && !captions) cc.hidden = true;
    if (cc && captions) {
      cc.addEventListener('click', function () {
        var on = cc.getAttribute('aria-pressed') !== 'true';
        cc.setAttribute('aria-pressed', String(on));
        captions.mode = on ? 'showing' : 'hidden';
      });
    }
  }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el.classList.remove('is-visible'); }, 3800);
  }

  /* ---------- Relay: send this page to my PC ---------- */
  function pageUrl() {
    try {
      var u = new URL(window.location.href);
      u.hash = ''; u.search = '';
      u.searchParams.set('variant', variant);
      u.searchParams.set('relay', '1');
      return u.toString();
    } catch (e) {
      return window.location.href.split('#')[0].split('?')[0] + '?variant=' + variant + '&relay=1';
    }
  }

  function initRelay() {
    var dialog = document.getElementById('relay-dialog');
    var openBtn = document.querySelector('[data-relay-open]');
    if (!dialog || !openBtn) return;
    var input = document.getElementById('relay-url');
    var msg = 'Ragnarok: The New World is free on PC. Install it here: ';

    function fill() {
      var url = pageUrl();
      input.value = url;
      var enc = encodeURIComponent(url);
      dialog.querySelector('[data-relay="email"]').href = 'mailto:?subject=' + encodeURIComponent('Install Ragnarok: The New World on my PC') + '&body=' + encodeURIComponent(msg) + enc;
      dialog.querySelector('[data-relay="whatsapp"]').href = 'https://wa.me/?text=' + encodeURIComponent(msg) + enc;
      dialog.querySelector('[data-relay="line"]').href = 'https://line.me/R/msg/text/?' + encodeURIComponent(msg + url);
      var share = dialog.querySelector('[data-relay="share"]');
      if (share) share.hidden = !navigator.share;
    }

    openBtn.addEventListener('click', function () {
      fill();
      track('relay_click', { relay_method: 'open' });
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) close();                       // click on backdrop
      if (e.target.closest('[data-relay-close]')) close();
      var act = e.target.closest('[data-relay]');
      if (!act) return;
      var method = act.getAttribute('data-relay');
      track('relay_click', { relay_method: method });
      if (method === 'copy') copy(input.value);
      if (method === 'share' && navigator.share) {
        navigator.share({ title: 'Ragnarok: The New World', text: msg, url: input.value })
          .then(function () { toast('Shared. Open it on your PC.'); close(); })
          .catch(function () { /* cancelled */ });
      }
    });

    function close() {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      else dialog.removeAttribute('open');
      openBtn.focus();
    }

    function copy(text) {
      function fallback() {
        input.focus(); input.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        toast(ok ? 'Link copied. Paste it on your PC.' : 'Select the link above and copy it.');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast('Link copied. Paste it on your PC.'); }, fallback);
      } else fallback();
    }
  }

  /* ---------- Testimonials (rendered only if real data exists) ---------- */
  function initTestimonials() {
    var data = [];
    try { data = JSON.parse((document.getElementById('testimonials-data') || {}).textContent || '[]'); } catch (e) { data = []; }
    if (!Array.isArray(data) || !data.length) return;
    var box = document.getElementById('testimonials');
    var list = box.querySelector('ul');
    data.forEach(function (t) {
      if (!t || !t.quote || !t.author || !t.date) return;
      var li = document.createElement('li');
      li.className = 'glass testimonial';
      var fig = document.createElement('figure');
      var q = document.createElement('blockquote'); q.textContent = '“' + t.quote + '”';
      var cap = document.createElement('figcaption'); cap.textContent = t.author + ' · ' + t.date;
      fig.appendChild(q); fig.appendChild(cap); li.appendChild(fig); list.appendChild(li);
    });
    box.hidden = !list.children.length;
  }

  /* ---------- Counter ---------- */
  function initCounter() {
    var el = document.querySelector('[data-count-to]');
    if (!el || reduceMotion || !('IntersectionObserver' in window)) return;
    var target = +el.getAttribute('data-count-to');
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      var t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / 1400);
        var eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-US');
        if (k < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(el);
  }

  /* ---------- Reveal + parallax ---------- */
  function initMotion() {
    var items = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (n) { n.classList.add('is-visible'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      Array.prototype.forEach.call(items, function (n) { io.observe(n); });
    }

    var img = document.querySelector('.hero-media img');
    if (!img || reduceMotion) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = window.pageYOffset || 0;
        if (y < 1000) img.style.setProperty('--parallax', (y * 0.2).toFixed(1) + 'px');
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Media fallback: a missing screenshot/video shows a dark cinema frame, never a broken icon ---------- */
  function markMissing(el) {
    var frame = el.closest ? el.closest('.media') : null;
    if (frame) frame.classList.add('is-missing');
    if (el.tagName === 'IMG') el.style.visibility = 'hidden';
  }
  function initMediaFallback() {
    document.addEventListener('error', function (e) {
      var t = e.target;
      if (!t || !t.tagName) return;
      if (t.tagName === 'IMG') markMissing(t);
      else if (t.tagName === 'SOURCE' && t.parentNode && t.parentNode.tagName === 'VIDEO') markMissing(t.parentNode);
      else if (t.tagName === 'VIDEO') markMissing(t);
    }, true);
    // Images that already failed before this script ran
    Array.prototype.forEach.call(document.querySelectorAll('.media img'), function (img) {
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('loading') !== 'lazy') markMissing(img);
    });
  }

  function init() {
    initMediaFallback();
    initVariant();
    initCta();
    initFaq();
    initPlayer();
    initRelay();
    initTestimonials();
    initCounter();
    initMotion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
