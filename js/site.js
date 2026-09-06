/* Intimista — small, dependency-free behaviour. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- header turns solid once you leave the hero ---- */
  var header = document.getElementById('header');
  var onScroll = function () {
    header.classList.toggle('is-stuck', window.scrollY > 80);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- mobile menu ---- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  var setMenu = function (open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };

  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      burger.focus();
    }
  });

  /* ---- reveal on scroll ---- */
  var items = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---- the walkthrough only downloads when you scroll to it ---- */
  var video = document.querySelector('.phone video');
  if (video) {
    var src = video.getAttribute('src');
    video.removeAttribute('src');

    var play = function () {
      if (!video.getAttribute('src')) {
        video.setAttribute('src', src);
        video.load();
      }
      var p = video.play();
      if (p && p.catch) p.catch(function () { video.setAttribute('controls', ''); });
    };

    if (!('IntersectionObserver' in window)) {
      video.setAttribute('controls', '');
      video.setAttribute('src', src);
    } else {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) play();
          else if (video.getAttribute('src')) video.pause();
        });
      }, { threshold: 0.35 });
      vio.observe(video);
    }
  }

  /* ---- um dia aqui: the sun crosses the hours ---- */
  var arc = document.getElementById('dia');
  if (arc) {
    var tabs = Array.prototype.slice.call(arc.querySelectorAll('.arc__hour'));
    var scenes = Array.prototype.slice.call(arc.querySelectorAll('.arc__slide'));
    var sun = arc.querySelector('.arc__sun');
    var lit = arc.querySelector('.arc__lit');
    var last = tabs.length - 1;
    var hour = 0;
    var roaming = !reduced;
    var clock = null;

    /* the path is M0 110 Q500 -40 1000 110 inside a 1000x120 box,
       so x is linear in t and y follows the quadratic. */
    var sunAt = function (t) {
      return { x: t * 100, y: (110 - 300 * t + 300 * t * t) / 1.2 };
    };

    var trail = lit && lit.getTotalLength ? lit.getTotalLength() : 0;
    if (lit) lit.style.setProperty('--len', trail);

    var show = function (i, focus) {
      hour = i < 0 ? last : i > last ? 0 : i;
      var t = last > 0 ? hour / last : 0;

      arc.setAttribute('data-scene', hour);

      if (sun) {
        var p = sunAt(t);
        sun.style.left = p.x + '%';
        sun.style.top = p.y + '%';
      }
      if (lit) lit.style.setProperty('--off', trail * (1 - t));

      tabs.forEach(function (b, k) {
        var on = k === hour;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      scenes.forEach(function (s, k) { s.classList.toggle('is-on', k === hour); });
    };

    var pause = function () { clearInterval(clock); clock = null; };
    var resume = function () {
      if (!roaming || clock) return;
      clock = setInterval(function () { show(hour + 1); }, 5200);
    };
    /* the day stops running on its own the moment someone takes the wheel */
    var settle = function () { roaming = false; pause(); };

    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () { settle(); show(i); });
    });

    arc.querySelector('.arc__hours').addEventListener('keydown', function (e) {
      var step = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: -1, ArrowDown: 1 }[e.key];
      var jump = e.key === 'Home' ? 0 : e.key === 'End' ? last : null;
      if (step === undefined && jump === null) return;
      e.preventDefault();
      settle();
      show(jump === null ? hour + step : jump, true);
    });

    arc.addEventListener('pointerenter', pause);
    arc.addEventListener('pointerleave', resume);

    show(0);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) resume();
          else pause();
        });
      }, { threshold: 0.3 }).observe(arc);
    } else {
      resume();
    }
  }
})();
