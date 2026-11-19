// node evidencia/qa/probar_lifecycle.cjs — lifecycle assertions using production JS.
const {readFileSync}=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=readFileSync(require('node:path').join(__dirname,'../../assets/firma.js'),'utf8');
function environment({embed=false,reduce=false,io=true,name=""}={}){
 const events={},docEvents={},timers=new Map();let id=0,callback,starts=0;
 const classes=()=>{let set=new Set();return {add(...s){s.forEach(x=>set.add(x));if(s.includes('sf-playing'))starts++},remove(...s){s.forEach(x=>set.delete(x))},contains:s=>set.has(s),toString:()=>[...set].join(' ')}};
 const nodes=['opening','post'].map(gesture=>({dataset:{gesture},classList:classes(),getAnimations:()=>[],getBoundingClientRect:()=>({top:2000,bottom:2500})}));
 const parent={postMessage(){}},doc={documentElement:{classList:classes(),dataset:{rpOption:'01'}},hidden:false,querySelectorAll:s=>s==='[data-gesture]'?nodes:[],addEventListener:(n,f)=>docEvents[n]=f};
 const context={document:doc,location:{protocol:'http:',origin:'http://qa'},parent,matchMedia:()=>({matches:reduce,addEventListener(){}}),addEventListener:(n,f)=>events[n]=f,setTimeout:f=>{timers.set(++id,f);return id},clearTimeout:i=>timers.delete(i),Promise,innerHeight:800};context.window=embed?{name}:parent;
 if(io)context.IntersectionObserver=class{constructor(cb){callback=cb}observe(){}unobserve(){}};
 if(io)context.window.IntersectionObserver=context.IntersectionObserver;
 vm.runInNewContext(source,context);
 return {nodes,get starts(){return starts},message:visible=>events.message?.({source:parent,origin:'http://qa',data:{type:'gtl-opening-visibility',visible}}),intersect:()=>callback?.([{isIntersecting:true,target:nodes[1]}]),finish:()=>[...timers.values()].forEach(f=>f()),hide:()=>{doc.hidden=true;docEvents.visibilitychange()},show:()=>{doc.hidden=false;docEvents.visibilitychange()}};
}
const direct=environment();assert.equal(direct.starts,1);direct.intersect();assert.equal(direct.starts,2);direct.finish();assert.ok(direct.nodes.every(n=>n.classList.contains('sf-done')));direct.intersect();assert.equal(direct.starts,2);
const embedded=environment({embed:true});assert.equal(embedded.starts,0);embedded.intersect();assert.equal(embedded.starts,0);embedded.message(true);assert.equal(embedded.starts,1);embedded.finish();embedded.message(false);embedded.message(true);assert.equal(embedded.starts,1);embedded.intersect();assert.equal(embedded.starts,2);embedded.hide();embedded.show();assert.equal(embedded.starts,2);
const restored=environment({embed:true,name:'gtl-rp-signature:01::opening'});restored.message(true);assert.equal(restored.starts,0);restored.intersect();assert.equal(restored.starts,1);
for(const options of [{reduce:true},{io:false}]){const e=environment(options);assert.equal(e.starts,0);assert.ok(e.nodes.every(n=>n.classList.contains('sf-done')))}
console.log('PASS: directo, espera de bienvenida, opción oculta, no repetición incluso tras restaurar el iframe, post por intersección, watchdog, preferencia reduce y ausencia de IntersectionObserver.');
