(() => {
  'use strict';
  const root = document.documentElement, embedded = parent !== window;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let allowed = !embedded, answered = !embedded, fallback;
  const enabled = !reduced.matches && 'IntersectionObserver' in window;
  const gestures = enabled ? [
    {key:'hero', selector:'.hero-copy', threshold:0, ms:380},
    {key:'register', selector:'.trigger', threshold:1, ms:440}
  ] : [];
  const finish = g => {
    g.state = 'done'; clearTimeout(g.timer); g.observer?.disconnect();
    root.classList.remove(g.key+'-armed',g.key+'-playing');
  };
  const start = g => {
    if (g.state !== 'armed' || !g.view || !allowed || document.hidden || reduced.matches) return;
    g.state = 'playing'; g.observer?.disconnect();
    root.classList.replace(g.key+'-armed',g.key+'-playing');
    g.timer = setTimeout(() => finish(g),g.ms);
  };
  gestures.forEach(g => { g.state='armed'; root.classList.add(g.key+'-armed'); });
  if (embedded && location.origin !== 'null') {
    addEventListener('message', e => {
      if (e.source !== parent || e.origin !== location.origin || e.data?.type !== 'gtl-opening-visibility' || typeof e.data.visible !== 'boolean') return;
      answered=true; clearTimeout(fallback); allowed=e.data.visible;
      gestures.forEach(g => { if (!allowed && g.state === 'playing') finish(g); else start(g); });
    });
    parent.postMessage({type:'gtl-opening-ready'},location.origin);
    fallback=setTimeout(() => { if (!answered) gestures.forEach(finish); },700);
  } else if (embedded) gestures.forEach(finish);
  document.addEventListener('DOMContentLoaded', () => gestures.forEach(g => {
    if (g.state !== 'armed') return;
    const el=document.querySelector(g.selector);
    if (!el) return finish(g);
    g.observer=new IntersectionObserver(([entry]) => {
      g.view=entry.isIntersecting && (g.threshold ? entry.intersectionRatio >= g.threshold : entry.intersectionRatio > 0);
      start(g);
    }, {threshold:g.threshold || [0,0.001]});
    g.observer.observe(el);
  }), {once:true});
  document.addEventListener('visibilitychange', () => gestures.forEach(g => {
    if (document.hidden && g.state === 'playing') finish(g); else start(g);
  }));
  reduced.addEventListener('change', e => { if (e.matches) gestures.forEach(finish); });
})();
