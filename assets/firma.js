/* Cada visita a una pestaña rearma sus dos gestos sin recargar el documento. */
(() => {
 'use strict';
 const embedded=parent!==window, local=location.protocol==='file:';
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const supported='IntersectionObserver' in window;
 const targets=[...document.querySelectorAll('[data-gesture]')];
 const openings=targets.filter(n=>n.dataset.gesture==='opening');
 const posts=targets.filter(n=>n.dataset.gesture==='post');
 const used=new Set(), running=new Map();
 let active=!embedded, painted=false, queued=0, imageReady=false;
 const eligible=()=>active&&painted&&!document.hidden;

 function final(node){
  clearTimeout(running.get(node)?.timer);
  running.delete(node);
  node.classList.remove('sf-wait','sf-playing');
  node.classList.add('sf-done');
 }
 function arm(){
  used.clear();
  targets.forEach(node=>{
   if(reduce.matches||!supported){used.add(node);final(node);return;}
   node.classList.remove('sf-done','sf-playing');
   node.classList.add('sf-wait');
  });
 }
 function play(node){
  if(used.has(node)||!eligible())return;
  used.add(node);
  if(reduce.matches||!supported){final(node);return;}
  node.classList.remove('sf-wait','sf-done');
  node.classList.add('sf-playing');
  const run={};
  running.set(node,run);
  const close=()=>{if(running.get(node)===run)final(node);};
  run.timer=setTimeout(close,2600);
  const animations=node.getAnimations?.({subtree:true})||[];
  if(animations.length)Promise.allSettled(animations.map(a=>a.finished)).then(close);
 }
 function visiblePost(){
  if(!eligible())return;
  posts.forEach(node=>{
   if(used.has(node))return;
   const r=node.getBoundingClientRect();
   if(r.top<innerHeight*.84&&r.bottom>innerHeight*.12)play(node);
  });
 }
 function sync(){
  if(!eligible())return;
  if(imageReady)openings.forEach(play);
  visiblePost();
 }
 function queue(){
  if(!active||document.hidden||painted||queued)return;
  // Dejar que el iframe seleccionado se pinte después de la portada o el cambio.
  queued=requestAnimationFrame(()=>{
   queued=requestAnimationFrame(()=>{
    queued=0;
    if(!active||document.hidden)return;
    painted=true;
    sync();
   });
  });
 }
 function setActive(next){
  if(active===next)return;
  active=next;painted=false;
  if(queued){cancelAnimationFrame(queued);queued=0;}
  if(!active){targets.forEach(final);return;}
  arm();
  window.scrollTo({top:0,left:0,behavior:'instant'});
  queue();
 }

 arm();
 if(supported){
  const observer=new IntersectionObserver(visiblePost,{threshold:0,rootMargin:'-12% 0px -16% 0px'});
  posts.forEach(node=>observer.observe(node));
 }
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)running.forEach((_,node)=>final(node));
  else {queue();sync();}
 });
 reduce.addEventListener('change',()=>{
  if(reduce.matches)targets.forEach(node=>{used.add(node);final(node);});
 });

 const photos=openings.flatMap(node=>[...node.querySelectorAll('img')]);
 Promise.all(photos.map(img=>{
  if(typeof img.decode==='function')return img.decode().catch(()=>{});
  if(!img.complete)return new Promise(resolve=>{
   img.addEventListener('load',resolve,{once:true});
   img.addEventListener('error',resolve,{once:true});
  });
 })).then(()=>{imageReady=true;sync();});

 if(embedded&&(local||/^https?:$/.test(location.protocol))){
  addEventListener('message',e=>{
   if(e.source!==parent||e.origin!==(local?'null':location.origin))return;
   if(e.data?.type!=='gtl-opening-activation'||typeof e.data.active!=='boolean')return;
   setActive(e.data.active);
  });
  parent.postMessage({type:'gtl-opening-ready'},local?'*':location.origin);
 } else if(!embedded)queue();
})();
