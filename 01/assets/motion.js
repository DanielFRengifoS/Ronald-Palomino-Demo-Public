(() => {
  'use strict';
  const root = document.documentElement;
  const embedded = window.parent !== window;
  const origin = location.origin;
  const file = location.protocol === 'file:';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const supported = 'IntersectionObserver' in window;
  let allowed = !embedded, known = !embedded;
  const gestures = [
    { selector: '.hero', threshold: 0, pending: 'pending-opening', active: 'opening' },
    { selector: '.continuity-trigger', threshold: 1, pending: 'pending-bridge', active: 'connecting' },
  ];
  function finish(g) {
    g.used = true;
    root.classList.remove(g.pending, g.active);
  }
  function sync() {
    for (const g of gestures) {
      if (!supported || reduced.matches) { finish(g); continue; }
      const eligible = allowed && g.inView && !document.hidden;
      if (g.used) { if (!eligible) finish(g); continue; }
      if (!known) continue;
      if (eligible) {
        g.used = true;
        root.classList.remove(g.pending);
        root.classList.add(g.active);
      } else root.classList.add(g.pending);
    }
  }
  if (supported) for (const g of gestures) {
    new IntersectionObserver(([entry]) => {
      g.inView = entry.isIntersecting && entry.intersectionRect.height > 0 && entry.intersectionRatio >= g.threshold;
      sync();
    }, {threshold:g.threshold ? [0,1] : [0,.001]}).observe(document.querySelector(g.selector));
  }
  document.addEventListener('animationend', e => {
    if (e.target.matches('.pair i')) finish(gestures[0]);
    if (e.target.matches('.bridge i')) finish(gestures[1]);
  });
  document.addEventListener('visibilitychange', sync);
  if (reduced.addEventListener) reduced.addEventListener('change', sync);
  else reduced.addListener(sync);
  if (embedded) {
    addEventListener('message', e => {
      if (e.source !== window.parent || e.origin !== (file ? 'null' : origin)) return;
      if (e.data?.type !== 'gtl-opening-visibility' || typeof e.data.visible !== 'boolean') return;
      known = true;
      allowed = e.data.visible;
      sync();
    });
    window.parent.postMessage({type:'gtl-opening-ready'}, file ? '*' : origin);
  }
  sync();
})();
