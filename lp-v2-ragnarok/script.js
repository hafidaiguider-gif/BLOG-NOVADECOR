/**
 * Ragnarok: The New World — LP v2
 * Reads window.LP_CONFIG (config.js) and window.I18N (translations.js).
 * No visible text is hard-coded here: everything goes through t(key).
 *
 *  - i18n: ?lang=th (fallback to English per key)
 *  - draft / live mode: missing real data → "to fill" tag (draft) or hidden block (live)
 *  - gift code: 1-click copy with "Copied!" state
 *  - countdown to config.eventEnd (hidden when missing or over)
 *  - milestone bar from real thresholds + current figure
 *  - class tier list with PvP / MVP / Farm tabs, CTA under each class
 *  - claimed counter (counts up to the real figure once, no fake live ticker)
 *  - tracking: cta_click, copy_code, tier_mode → window.dataLayer (console only with ?debug=1)
 */
(function () {
  'use strict';

  var cfg = window.LP_CONFIG || {};
  var I18N = window.I18N || { en: {} };
  var params;
  try { params = new URLSearchParams(window.location.search); } catch (e) { params = { get: function () { return null; } }; }
  var lang = (params.get('lang') || cfg.defaultLang || 'en').toLowerCase();
  if (!I18N[lang]) lang = 'en';
  var draft = cfg.mode !== 'live';
  var DEBUG = params.get('debug') === '1';
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var locale = lang === 'th' ? 'th-TH' : 'en-US';

  /* ---------- helpers ---------- */
  function raw(key) {
    var d = I18N[lang] || {};
    if (Object.prototype.hasOwnProperty.call(d, key) && d[key] !== '') return d[key];
    return (I18N.en && I18N.en[key] != null) ? I18N.en[key] : '';
  }
  function t(key, vars) {
    return String(raw(key)).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; });
  }
  function filled(v) { return v !== null && v !== undefined && v !== ''; }
  function fmt(n) { return Number(n).toLocaleString(locale); }
  function todoTag() {
    var s = document.createElement('span');
    s.className = 'todo';
    s.textContent = t('draft.tag');
    return s;
  }
  function missing(el, hideTarget) {
    // draft: show a "to fill" tag in el; live: hide the target block
    if (draft) { el.textContent = ''; el.appendChild(todoTag()); }
    else (hideTarget || el).hidden = true;
  }
  function track(event, data) {
    window.dataLayer = window.dataLayer || [];
    var p = { event: event, lang: lang };
    for (var k in data) if (Object.prototype.hasOwnProperty.call(data, k)) p[k] = data[k];
    try { window.dataLayer.push(p); } catch (e) { /* never break the page */ }
    if (DEBUG && window.console) window.console.log('[track]', p);
  }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- i18n ---------- */
  function applyI18n() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var varsAttr = el.getAttribute('data-i18n-vars');
      if (!varsAttr) { el.textContent = t(key); return; }
      var vars = {}, ok = true;
      varsAttr.split(',').forEach(function (pair) {
        var p = pair.split(':'), v = raw(p[1].trim());
        if (!filled(v)) ok = false;
        vars[p[0].trim()] = v;
      });
      if (ok) el.textContent = t(key, vars); else missing(el);
    });
    $$('[data-i18n-alt]').forEach(function (el) { el.setAttribute('alt', t(el.getAttribute('data-i18n-alt'))); });
    $$('[data-i18n-content]').forEach(function (el) { el.setAttribute('content', t(el.getAttribute('data-i18n-content'))); });
    $$('[data-i18n-aria-label]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria-label'))); });
    $$('[data-draft-only]').forEach(function (el) { el.hidden = !draft; });
  }

  /* ---------- starter pack + gift code ---------- */
  var packReady = !!(cfg.starterPack && filled(cfg.starterPack.code));

  function initPack() {
    // CTA label: pack wording only if a real pack exists (or while reviewing the draft)
    var label = (packReady || draft) ? t('cta.main') : t('cta.fallback');
    $$('[data-cta-label]').forEach(function (el) { el.textContent = label; });

    if (!packReady && !draft) { $$('[data-block="pack"]').forEach(function (el) { el.hidden = true; }); return; }

    (cfg.starterPack.items || []).forEach(function (it) {
      if (!filled(it.image)) return;
      var box = $('[data-item="' + it.id + '"] .item-visual');
      if (!box) return;
      var img = document.createElement('img');
      img.src = it.image; img.alt = ''; img.width = 64; img.height = 64; img.loading = 'lazy';
      box.textContent = ''; box.appendChild(img);
    });

    var out = $('#gift-code');
    var btn = $('[data-copy-code]');
    if (!packReady) { missing(out); if (btn) btn.disabled = true; return; }
    out.textContent = cfg.starterPack.code;

    var label2 = $('[data-copy-label]', btn), timer;
    btn.addEventListener('click', function () {
      var code = cfg.starterPack.code;
      function done(ok) {
        btn.classList.toggle('is-copied', ok);
        label2.textContent = ok ? t('code.copied') : t('code.copyFail');
        toast(ok ? t('toast.copied') : t('code.copyFail'));
        track('copy_code', { success: ok });
        window.clearTimeout(timer);
        timer = window.setTimeout(function () { btn.classList.remove('is-copied'); label2.textContent = t('code.copy'); }, 2200);
      }
      function fallback() {
        var r = document.createRange(); r.selectNodeContents(out);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        done(ok);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(function () { done(true); }, fallback);
      else fallback();
    });
  }

  /* ---------- countdown ---------- */
  function initCountdown() {
    var card = $('[data-block="countdown"]');
    var end = filled(cfg.eventEnd) ? Date.parse(cfg.eventEnd) : NaN;
    if (isNaN(end)) {
      if (draft) $('#urgency-title').appendChild(document.createTextNode(' ')), $('#urgency-title').appendChild(todoTag());
      else card.hidden = true;
      return;
    }
    var els = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
    var timer;
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function tick() {
      var left = Math.max(0, end - Date.now());
      if (left === 0) {
        window.clearInterval(timer);
        if (draft) $('#urgency-title').textContent = t('urgency.ended'); else card.hidden = true;
        hideUrgencyIfEmpty();
        return;
      }
      var s = Math.floor(left / 1000);
      els.d.textContent = pad(Math.floor(s / 86400));
      els.h.textContent = pad(Math.floor(s % 86400 / 3600));
      els.m.textContent = pad(Math.floor(s % 3600 / 60));
      els.s.textContent = pad(s % 60);
    }
    tick();
    timer = window.setInterval(tick, 1000);
  }

  /* ---------- milestones ---------- */
  function initMilestones() {
    var card = $('[data-block="milestones"]');
    var list = $('.ms-list', card);
    var ms = (cfg.milestones || []).slice();
    var cur = cfg.milestoneCurrent;
    var ready = filled(cur) && ms.length && ms.every(function (m) { return filled(m.at); });
    if (!ready && !draft) { card.hidden = true; return; }

    var max = ready ? Math.max.apply(null, ms.map(function (m) { return m.at; })) : 0;
    ms.forEach(function (m) {
      var li = document.createElement('li');
      var unlocked = ready && cur >= m.at;
      li.className = 'ms-step' + (unlocked ? ' is-unlocked' : '');
      var strong = document.createElement('strong');
      if (filled(m.at)) strong.textContent = t('milestone.at', { count: fmt(m.at) }); else strong.appendChild(todoTag());
      var name = document.createElement('span'); name.textContent = t(m.rewardKey);
      var state = document.createElement('span'); state.className = 'ms-state'; state.textContent = unlocked ? t('milestone.unlocked') : t('milestone.locked');
      li.appendChild(strong); li.appendChild(name); li.appendChild(document.createElement('br')); li.appendChild(state);
      list.appendChild(li);
    });

    var curEl = $('[data-ms-current]'), asOf = $('[data-ms-asof]');
    if (filled(cur)) curEl.textContent = t('milestone.current', { count: fmt(cur) }); else missing(curEl);
    if (filled(cfg.milestoneAsOf)) asOf.textContent = t('milestone.asOf', { date: cfg.milestoneAsOf }); else if (draft) asOf.appendChild(todoTag());

    if (ready) {
      var pct = Math.min(100, Math.round(cur / max * 100));
      var bar = $('.ms-bar', card);
      bar.setAttribute('aria-valuenow', String(pct));
      var fill = $('.ms-fill', card);
      window.requestAnimationFrame(function () { fill.style.width = pct + '%'; });
    }
  }

  function hideUrgencyIfEmpty() {
    var sec = $('[data-block="urgency"]');
    if ($$('[data-block="countdown"], [data-block="milestones"]').every(function (c) { return c.hidden; })) sec.hidden = true;
  }

  /* ---------- tier list ---------- */
  function initTier() {
    var list = $('[data-class-list]');
    var tpl = $('#class-tpl');
    var tabs = $$('.mode');
    var mode = 'pvp';
    var classes = cfg.tierList || [];
    var anyRank = classes.some(function (c) { return ['pvp', 'mvp', 'farm'].some(function (m) { return filled(c.ranks && c.ranks[m]); }); });

    classes.forEach(function (c) {
      var node = tpl.content.firstElementChild.cloneNode(true);
      var name = t('class.' + c.id);
      $('.class-name', node).textContent = name;
      $('.class-role', node).textContent = t('class.' + c.id + '.role');
      $('.class-cta', node).textContent = t('cta.class', { 'class': name });
      var a = $('a', node);
      a.setAttribute('data-cta', 'class-' + c.id);
      a.setAttribute('aria-label', t('cta.aria'));
      node.setAttribute('data-class', c.id);
      list.appendChild(node);
    });

    if (!anyRank && !draft) {               // no real ranks: show classes + CTAs only
      $$('.rank-wrap', list).forEach(function (r) { r.hidden = true; });
      $('.modes').hidden = true;
      $('.disclaimer').hidden = true;
      return;
    }

    function render() {
      classes.forEach(function (c) {
        var node = $('[data-class="' + c.id + '"]', list);
        var r = c.ranks ? c.ranks[mode] : null;
        $('.rank-label', node).textContent = t('tier.rankLabel', { mode: t('tier.mode.' + mode) });
        var rank = $('.rank', node);
        rank.textContent = '';
        if (filled(r)) { rank.classList.remove('is-empty'); rank.textContent = r; rank.setAttribute('data-rank', r); }
        else { rank.classList.add('is-empty'); rank.removeAttribute('data-rank'); if (draft) rank.appendChild(todoTag()); else rank.textContent = '—'; }
      });
      tabs.forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-mode') === mode)); b.tabIndex = b.getAttribute('data-mode') === mode ? 0 : -1; });
    }
    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () { mode = b.getAttribute('data-mode'); render(); track('tier_mode', { mode: mode }); });
      b.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); n.focus(); n.click(); }
      });
    });
    render();
  }

  /* ---------- claimed counter ---------- */
  function initClaimed() {
    var card = $('[data-block="claimed"]');
    var el = $('[data-claimed]'), asOf = $('[data-claimed-asof]');
    var n = cfg.claimedCount;
    if (!filled(n)) { if (draft) missing(el); else card.hidden = true; return; }
    if (filled(cfg.claimedAsOf)) asOf.textContent = t('proof.asOf', { date: cfg.claimedAsOf });
    el.textContent = fmt(n);
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    el.textContent = fmt(0);
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      var t0 = null;
      (function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / 1400);
        el.textContent = fmt(Math.round(n * (1 - Math.pow(1 - k, 3))));
        if (k < 1) window.requestAnimationFrame(step);
      })(performance.now());
    }, { threshold: .5 });
    io.observe(el);
  }

  /* ---------- toast ---------- */
  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg; el.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el.classList.remove('is-visible'); }, 2600);
  }

  /* ---------- tracking + media fallback ---------- */
  function initTracking() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[data-cta]') : null;
      if (a) track('cta_click', { cta_position: a.getAttribute('data-cta'), cta_url: a.getAttribute('href'), pack: packReady });
    });
  }
  function initMediaFallback() {
    document.addEventListener('error', function (e) {
      var tg = e.target;
      if (tg && tg.tagName === 'IMG' && tg.closest) { var f = tg.closest('.media'); if (f) f.classList.add('is-missing'); }
    }, true);
  }

  function init() {
    initMediaFallback();
    applyI18n();
    initPack();
    initCountdown();
    initMilestones();
    hideUrgencyIfEmpty();
    initTier();
    initClaimed();
    initTracking();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
