import { reducedMotion } from './motion.js';

/* How long a scene holds before the day moves on by itself. */
const HOLD = 5200;

/* The rail is M0 110 Q500 -40 1000 110 inside a 1000x120 box, so x is
   linear in t and y follows the quadratic. Percentages, for the sun. */
function sunAt(t) {
  return { x: t * 100, y: (110 - 300 * t + 300 * t * t) / 1.2 };
}

/* Um dia aqui: five hours, one photograph at a time. The day runs on
   its own until someone takes the wheel, and never again after that. */
export function mountDia() {
  const arc = document.getElementById('dia');
  if (!arc) return;

  const tabs = [...arc.querySelectorAll('.arc__hour')];
  const scenes = [...arc.querySelectorAll('.arc__slide')];
  const sun = arc.querySelector('.arc__sun');
  const lit = arc.querySelector('.arc__lit');
  const last = tabs.length - 1;

  let hour = 0;
  let roaming = !reducedMotion;
  let clock = null;

  const trail = lit?.getTotalLength ? lit.getTotalLength() : 0;
  if (lit) lit.style.setProperty('--len', trail);

  const show = (i, focus) => {
    hour = i < 0 ? last : i > last ? 0 : i;
    const t = last > 0 ? hour / last : 0;

    /* the scene tokens (tint, glow, sun colour) hang off this attribute */
    arc.setAttribute('data-scene', hour);

    if (sun) {
      const { x, y } = sunAt(t);
      sun.style.left = x + '%';
      sun.style.top = y + '%';
    }
    if (lit) lit.style.setProperty('--off', trail * (1 - t));

    tabs.forEach((tab, k) => {
      const on = k === hour;
      tab.classList.toggle('is-on', on);
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    scenes.forEach((scene, k) => scene.classList.toggle('is-on', k === hour));
  };

  const pause = () => {
    clearInterval(clock);
    clock = null;
  };
  const resume = () => {
    if (!roaming || clock) return;
    clock = setInterval(() => show(hour + 1), HOLD);
  };
  /* the day stops running on its own the moment someone takes the wheel */
  const settle = () => {
    roaming = false;
    pause();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      settle();
      show(i);
    });
  });

  arc.querySelector('.arc__hours').addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: -1, ArrowDown: 1 }[e.key];
    const jump = e.key === 'Home' ? 0 : e.key === 'End' ? last : null;
    if (step === undefined && jump === null) return;
    e.preventDefault();
    settle();
    show(jump === null ? hour + step : jump, true);
  });

  arc.addEventListener('pointerenter', pause);
  arc.addEventListener('pointerleave', resume);

  show(0);

  /* the day only runs while the section is on screen */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => (entry.isIntersecting ? resume() : pause()));
      },
      { threshold: 0.3 }
    ).observe(arc);
  } else {
    resume();
  }
}
