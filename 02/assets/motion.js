(() => {
  'use strict';
  const embedded = parent !== window;
  const origin = document.querySelector('meta[name="gtl-parent-origin"]')?.content || location.origin;
  const hero = document.querySelector('[data-opening]');
  const rio = document.querySelector('[data-rio-trigger]');
  const post = rio.closest('.rio');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const done = new Set(), running = new Set();
  const supported = typeof IntersectionObserver === 'function' && typeof Element.prototype.animate === 'function';
  let active = !embedded, observer;
  const pending = (target, state) => (target === hero ? hero : post).classList.toggle('motion-pending', state);
  const visible = () => active && document.visibilityState === 'visible';
  function finish() { running.forEach(a => a.cancel()); running.clear(); }
  function mark(node, axis, from, to, end) {
    const a = node.animate([
      {transform:`scale${axis}(0)`,offset:0},
      {transform:`scale${axis}(0)`,offset:from/end,easing:'cubic-bezier(.22,.61,.36,1)'},
      {transform:`scale${axis}(1)`,offset:to/end},
      {transform:`scale${axis}(1)`,offset:1}
    ], {duration:end});
    running.add(a);
    a.onfinish = () => running.delete(a);
  }
  function start(target) {
    done.add(target);
    observer.unobserve(target);
    pending(target, false);
    if (target === hero) mark(hero.querySelector('.brace'), 'Y', 80, 290, 360);
    else document.querySelectorAll('.rule').forEach((node,i) => mark(node,'X',i?150:80,i?370:300,400));
  }
  function observe() {
    observer?.disconnect();
    observer = null;
    for (const node of [hero,rio]) pending(node, false);
    if (!visible()) finish();
    if (!supported || !visible() || reduced.matches) return;
    observer = new IntersectionObserver((entries, current) => {
      if (observer !== current) return;
      for (const e of entries) if (visible() && !reduced.matches && !done.has(e.target) && e.isIntersecting && (e.target === hero || e.intersectionRatio >= .999)) start(e.target);
    }, {threshold:[0,.999]});
    for (const node of [hero,rio]) if (!done.has(node)) {
      const rect = node.getBoundingClientRect();
      const inView = rect.bottom > 0 && rect.top < innerHeight;
      if (!inView) pending(node, true);
      observer.observe(node);
    }
  }
  function motionPreference() {
    if (reduced.matches) { finish(); done.add(hero); done.add(rio); }
    observe();
  }
  reduced.addEventListener('change', motionPreference);
  document.addEventListener('visibilitychange', observe);
  window.addEventListener('pagehide', finish);
  window.addEventListener('pageshow', e => { if (e.persisted) observe(); });
  if (!embedded) {
    const painted = performance.getEntriesByName('first-contentful-paint').length > 0;
    const box = hero.getBoundingClientRect();
    const marker = rio.getBoundingClientRect();
    const inView = box.bottom > 0 && box.top < innerHeight;
    const rioInView = marker.top >= 0 && marker.bottom <= innerHeight;
    if (painted && !location.hash) {
      if (inView) done.add(hero);
      if (rioInView) done.add(rio);
    }
    motionPreference();
    // No anticipar la posición de scroll cuando el enlace trae un ancla.
    if (observer && !location.hash) {
      if (inView && !done.has(hero)) start(hero);
      if (rioInView && !done.has(rio)) start(rio);
    }
  } else if (origin !== 'null') {
    motionPreference();
    window.addEventListener('message', e => {
      const d = e.data;
      if (e.source !== parent || e.origin !== origin || !d || d.type !== 'gtl-opening-visibility' || typeof d.visible !== 'boolean' || active === d.visible) return;
      active = d.visible;
      observe();
    });
    parent.postMessage({type:'gtl-opening-ready'},origin);
  }
})();
