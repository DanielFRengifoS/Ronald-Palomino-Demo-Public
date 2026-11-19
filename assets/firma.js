/* Original composition/motion. The parent bridge remains unchanged. */
(() => {
 'use strict';
 const root=document.documentElement, embedded=parent!==window;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const targets=[...document.querySelectorAll('[data-gesture]')];
 const used=new Set(); let allowed=!embedded;
 // A browsing-context marker also survives a same-frame document restoration.
 // Direct visits always animate; a newly opened selector has fresh iframe names.
 let visit='';
 try{if(embedded)visit=String(parent.performance.timeOrigin);}catch{/* file contexts can have opaque origins. */}
 const marker='gtl-rp-signature:'+root.dataset.rpOption+':'+visit+':';
 const seen=new Set(embedded&&String(window.name||'').startsWith(marker)?String(window.name).slice(marker.length).split(','):[]);
 const remember=node=>{if(embedded){seen.add(node.dataset.gesture);window.name=marker+[...seen].join(',');}};
 const supported='IntersectionObserver' in window;
 const running=new Map();
 function final(node){node.classList.remove('sf-wait','sf-playing');node.classList.add('sf-done');clearTimeout(running.get(node));running.delete(node);}
 function play(node){
   if(used.has(node)||!allowed||document.hidden)return;
   used.add(node);remember(node);node.classList.remove('sf-wait');
   if(reduce.matches||!supported){final(node);return;}
   node.classList.add('sf-playing');
   const animations=node.getAnimations?.({subtree:true})||[];
   if(animations.length){
    running.set(node,setTimeout(()=>final(node),2600));
    Promise.allSettled(animations.map(a=>a.finished)).then(()=>final(node));
   } else running.set(node,setTimeout(()=>final(node),2600));
 }
 function opening(){if(allowed)targets.filter(n=>n.dataset.gesture==='opening').forEach(play);}
 function visiblePost(){
  if(!allowed)return;
  targets.filter(n=>n.dataset.gesture==='post').forEach(n=>{
   const r=n.getBoundingClientRect();
   if(r.top<innerHeight*.84&&r.bottom>innerHeight*.12)play(n);
  });
 }
 targets.forEach(n=>{if(seen.has(n.dataset.gesture)){used.add(n);final(n);}else if(!reduce.matches&&supported)n.classList.add('sf-wait');else{used.add(n);remember(n);final(n);}});
 const io=supported?new IntersectionObserver(entries=>{
   entries.forEach(e=>{if(e.isIntersecting&&allowed){play(e.target);if(used.has(e.target))io.unobserve(e.target);}});
 },{threshold:0,rootMargin:'-12% 0px -16% 0px'}):null;
 targets.filter(n=>n.dataset.gesture==='post').forEach(n=>io?.observe(n));
 function sync(){
  if(!allowed||document.hidden){running.forEach((_,n)=>final(n));return;}
  opening();visiblePost();
 }
 if(embedded){
  addEventListener('message',e=>{
   if(e.source!==parent||e.origin!==(location.protocol==='file:'?'null':location.origin))return;
   if(e.data?.type!=='gtl-opening-visibility'||typeof e.data.visible!=='boolean')return;
   allowed=e.data.visible;sync();
  });
  parent.postMessage({type:'gtl-opening-ready'},location.protocol==='file:'?'*':location.origin);
 }
 document.addEventListener('visibilitychange',sync);
 reduce.addEventListener('change',()=>{if(reduce.matches)targets.forEach(n=>{used.add(n);final(n);});});
 // The base image, name and credential never depend on this animation or on decoding.
 const images=[...document.querySelectorAll('.sf-scene img')];
 Promise.all(images.map(i=>i.decode?.().catch(()=>{}))).then(sync);
 sync();
})();
