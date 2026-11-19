/* Integración no visual. Conserva el opening propio de Ronald después del del template. */
(() => {
  'use strict';
  const local = location.protocol === 'file:';
  if (!local && !/^https?:$/.test(location.protocol)) return;
  const origin = local ? 'null' : location.origin;
  const target = local ? '*' : origin;
  const welcome = document.getElementById('bienvenida');
  const hub = document.querySelector('.hub');
  const frames = [...hub.querySelectorAll('iframe')];
  const interested = new Set();

  function notify(frame) {
    if (!interested.has(frame) || !frame.hasAttribute('src')) return;
    const visible = !document.hidden && welcome.hidden && !hub.hidden &&
      !hub.hasAttribute('inert') && frame.classList.contains('is-on');
    frame.contentWindow.postMessage({type: 'gtl-opening-visibility', visible}, target);
  }
  const sync = () => frames.forEach(notify);

  addEventListener('message', event => {
    if (event.origin !== origin || event.data?.type !== 'gtl-opening-ready') return;
    const frame = frames.find(frame => frame.hasAttribute('src') && frame.contentWindow === event.source);
    if (!frame) return;
    interested.add(frame);
    notify(frame);
  });
  document.addEventListener('visibilitychange', sync);
  addEventListener('pageshow', sync);
  const observer = new MutationObserver(sync);
  observer.observe(welcome, {attributes: true, attributeFilter: ['hidden']});
  observer.observe(hub, {attributes: true, attributeFilter: ['hidden', 'inert']});
  frames.forEach(frame => observer.observe(frame, {attributes: true, attributeFilter: ['class', 'src']}));
})();
