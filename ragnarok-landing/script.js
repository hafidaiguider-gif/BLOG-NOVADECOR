/**
 * Ragnarok: The New World — Landing page (TAF 2, Group 109)
 * - Hero headline A/B test: ?angle=b on the landing URL (default: angle A)
 * - Accessible mobile menu (aria-expanded, Escape, closes on link click)
 * - WAI-ARIA FAQ accordion (Enter/Space, arrow keys, Home/End)
 * - Floating CTA bar shown outside the hero, hidden over the final CTA
 * - Trailer: native <video>, MP4 fetched only on click, "Watch on Steam" fallback
 * - "Send to my PC": Web Share API, clipboard fallback
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
    var player = document.querySelector('[data-video]');
    if (!bar || !hero) return;
    var link = bar.querySelector('a');

    var heroVisible = true;
    var finalVisible = false;
    var playerVisible = false;

    function update() {
      var show = !heroVisible && !finalVisible && !playerVisible;
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

    if (player) {
      new IntersectionObserver(function (entries) {
        playerVisible = entries[0].intersectionRatio >= 0.6;
        update();
      }, { threshold: [0, 0.6, 1] }).observe(player);
    }
  }

  /* ---------- Trailer player (native <video>, loaded on click only) ---------- */
  function track(data) {
    window.dataLayer = window.dataLayer || [];
    data.hero_angle = heroAngle;
    window.dataLayer.push(data);
  }

  function initVideo() {
    var frame = document.querySelector('[data-video]');
    if (!frame) return;
    var video = frame.querySelector('video');
    var poster = frame.querySelector('.video-poster');
    var source = video && video.querySelector('source[data-src]');
    var fallback = frame.querySelector('.video-fallback');
    if (!video || !poster || !source) return;
    var fellBack = false;

    function fallbackToSteam(reason) {
      if (fellBack) return;
      fellBack = true;
      track({ event: 'video_fallback', reason: reason, video_destination: STEAM_URL });
      try { video.pause(); } catch (err) { /* ignore */ }
      frame.classList.remove('is-playing');
      video.hidden = true;
      poster.hidden = false;
      if (fallback) {
        fallback.hidden = false;
        var link = fallback.querySelector('a');
        if (link) link.focus();
      }
    }

    function goFullscreenOnMobile() {
      if (!window.matchMedia('(max-width: 767px)').matches) return;
      try {
        if (video.requestFullscreen) {
          var p = video.requestFullscreen();
          if (p && p.catch) p.catch(function () {});
        } else if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
        }
      } catch (err) { /* fullscreen not allowed here: keep inline playback */ }
    }

    poster.addEventListener('click', function () {
      if (!source.getAttribute('src')) {
        source.setAttribute('src', source.getAttribute('data-src'));
        source.addEventListener('error', function () { fallbackToSteam('source_error'); });
        video.load();
      }
      if (video.canPlayType && !video.canPlayType('video/mp4')) {
        fallbackToSteam('mp4_unsupported');
        return;
      }
      frame.classList.add('is-playing');
      video.hidden = false;
      poster.hidden = true;
      track({ event: 'video_play', video_title: 'Official trailer' });
      var playing = video.play();
      if (playing && playing.catch) {
        playing.catch(function (err) {
          if (err && err.name === 'NotAllowedError') return; // user can press play in the native controls
          fallbackToSteam('play_error');
        });
      }
      video.focus();
      goFullscreenOnMobile();
    });

    video.addEventListener('ended', function () {
      track({ event: 'video_complete', video_title: 'Official trailer' });
      if (document.fullscreenElement && document.exitFullscreen) {
        var p = document.exitFullscreen();
        if (p && p.catch) p.catch(function () {});
      }
    });
  }

  /* ---------- "Send to my PC" share button ---------- */
  function initShare() {
    var btn = document.querySelector('[data-share]');
    if (!btn) return;
    var status = btn.parentNode.querySelector('.share-status');
    var url = window.location.href.split('#')[0];

    function say(msg) { if (status) status.textContent = msg; }

    btn.addEventListener('click', function () {
      track({ event: 'share_to_pc_click' });
      if (navigator.share) {
        navigator.share({ title: 'Ragnarok: The New World — Play Free on Steam', url: url })
          .then(function () { say('Sent! Open it on your PC to install.'); })
          .catch(function (err) {
            if (!err || err.name !== 'AbortError') copyLink();
          });
        return;
      }
      copyLink();
    });

    function copyLink() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
          .then(function () { say('Link copied. Paste it on your PC to install.'); })
          .catch(function () { say('Copy this link to your PC: ' + url); });
      } else {
        say('Copy this link to your PC: ' + url);
      }
    }
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
    initVideo();
    initShare();
    initTracking();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
