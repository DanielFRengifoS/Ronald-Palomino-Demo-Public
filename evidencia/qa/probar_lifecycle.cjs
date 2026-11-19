const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=process.argv[2] || path.resolve(__dirname,'../..');
const code=f=>fs.readFileSync(path.join(root,f),'utf8');
const opts=['01','02','03'];

function setup(protocol, {reduced=false, hash='', delayPhoto=null, standalone=null, supportObserver=true}={}) {
  const origin=protocol==='file:'?'null':'http://localhost:8000';
  const timers=new Map(), events=[], rafs=new Map(), logs=[], children=new Map();
  let uid=0, observer, stage='init';
  function signal(){if(observer) events.push(() => observer());}
  class E {
    constructor(tag='', id='') {
      this.tag=tag;this.id=id;this.children=[];this.attrs=new Map();this.events=new EventTarget();
      this.classes=new Set();this.classList={add:(...c)=>c.forEach(x=>this.classes.add(x)),remove:(...c)=>c.forEach(x=>this.classes.delete(x)),contains:c=>this.classes.has(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};
      this.style={setProperty(){}};this.hidden=false;this.width=300;
      this.dataset=new Proxy({}, {set(o,k,v){o[k]=v;if(k==='openingDemo')signal();return true;},deleteProperty(o,k){delete o[k];signal();return true;}});
    }
    setAttribute(k,v){this.attrs.set(k,v);}
    getAttribute(k){return this.attrs.get(k)??null;}
    removeAttribute(k){this.attrs.delete(k);}
    hasAttribute(k){return this.attrs.has(k);}
    addEventListener(t,f){this.events.addEventListener(t,f);}
    removeEventListener(t,f){this.events.removeEventListener(t,f);}
    emit(t,props={}){const event=Object.assign(new Event(t),props);Object.defineProperty(event,'target',{value:this});this.events.dispatchEvent(event);}
    append(...children){children.forEach(c=>{c.parentElement=this;this.children.push(c);});}
    remove(){if(this.parentElement){const sibs=this.parentElement.children;sibs.splice(sibs.indexOf(this),1);}}
    getBoundingClientRect(){return {left:0,top:20,right:300,bottom:400,width:300,height:380};}
    get className(){return [...this.classes].join(' ');}
    set className(v){this.classes=new Set(v.split(' '));}
    focus(){}
    pause(){}
    play(){return Promise.resolve();}
    click(){this.emit('click',{button:0});}
  }
  const doc=new E('document'), global=new E('window'), body=new E('body'), welcome=new E('section'), hub=new E('main'), start=new E('a'), film=new E('video'), aperture=new E('figure'), selector=new E('div');
  hub.hidden=true;
  const frames=opts.map(id=>new E('iframe','frame-'+id)), buttons=opts.map(id=>new E('button','tab-'+id));
  for(const [i,f] of frames.entries()) {
    const id=opts[i];
    const button=buttons[i];
    button.setAttribute('aria-controls',f.id);
    button.setAttribute('aria-selected',String(i===0));
    button.dataset.demo=id;
    f.dataset.src=id+'/index.html';
    f.contentWindow={postMessage(data,to){
      assert.equal(to,protocol==='file:'?'*':origin);
      events.push(()=>{logs.push({kind:'bridge',id,data,stage});children.get(id)?.global.emit('message',{data,source:parentEndpoint,origin});});
    }};
    Object.defineProperty(f,'src',{set(url){f.setAttribute('src',url);child(id);}});
  }
  doc.body=body;
  doc.visibilityState='visible';
  doc.getElementById=id=>({'bienvenida':welcome,'empezar-demo':start,'brand-film':film,'demo-aperture':aperture}[id]||[...frames,...buttons].find(e=>e.id===id));
  doc.querySelector=s=>({'.hub':hub,'.switch':selector}[s]);
  doc.querySelectorAll=s=>s==='.switch button'?buttons:[];
  hub.querySelectorAll=s=>s==='.stage iframe'?frames:[];
  const matchMedia=()=>({matches:reduced,addEventListener(){}});
  const location={protocol,origin,hash};
  const parentEndpoint={};
  const parentEnv={
    document:doc,location,matchMedia,innerWidth:1280,innerHeight:800,
    history:{pushState(_,__,url){location.hash=url;},replaceState(_,__,url){location.hash=url;}},
    addEventListener:global.addEventListener.bind(global),
    MutationObserver:class{constructor(fn){observer=fn;}observe(){}},
    setTimeout(fn,ms){timers.set(++uid,{fn,ms});return uid;},
    clearTimeout(id){timers.delete(id);}
  };
  parentEnv.window=parentEnv;
  const parent=vm.createContext(parentEnv);
  function child(id) {
    if(children.has(id))return children.get(id);
    const f=frames[opts.indexOf(id)], document=new E('document'), global=new E('window');
    document.visibilityState='visible';
    document.hidden=false;
    const opening=new E('div'), post=new E('section'), photo=new E('img');
    let afterDecode, notifyIntersection;
    photo.decode=()=>id===delayPhoto?new Promise(resolve=>{afterDecode=resolve;}):Promise.resolve();
    opening.dataset.gesture='opening';
    post.dataset.gesture='post';
    opening.querySelectorAll=s=>s==='img'?[photo]:[];
    post.getBoundingClientRect=()=>({top:1350-ctx.scrollY,bottom:1600-ctx.scrollY});
    document.querySelectorAll=s=>s==='[data-gesture]'?[opening,post]:[];
    const runs=[];
    for(const node of [opening,post]){
      const nativeAdd=node.classList.add;
      node.classList.add=(...cls)=>{
        nativeAdd(...cls);
        if(cls.includes('sf-playing'))logs.push({kind:'motion',id,effect:node.dataset.gesture,stage,welcomeHidden:welcome.hidden,scroll:ctx.scrollY});
      };
      node.getAnimations=()=>{
        let done;
        const finished=new Promise(resolve=>{done=resolve;});
        runs.push({done,node});
        return [{finished}];
      };
    }
    const ctx={
      document,location:{protocol,origin},matchMedia,
      addEventListener:global.addEventListener.bind(global),innerHeight:800,scrollY:0,
      setTimeout:parentEnv.setTimeout,clearTimeout:parentEnv.clearTimeout,
      requestAnimationFrame(fn){rafs.set(++uid,fn);return uid;},cancelAnimationFrame(id){rafs.delete(id);},
      scrollTo(ops){if(ops.top===0)ctx.scrollY=0;}
    };
    if(supportObserver)ctx.IntersectionObserver=class{constructor(cb){notifyIntersection=cb;}observe(){}};
    ctx.window=ctx;
    ctx.parent=standalone===id?ctx:parentEndpoint;
    parentEndpoint.postMessage=function(data,to){
      assert.equal(to,protocol==='file:'?'*':origin);
      const source=f.contentWindow;
      events.push(()=>setupParentGlobal.emit('message',{data,source,origin}));
    };
    const child={document,global,ctx,opening,post,photo,runs,
      setScroll(y){ctx.scrollY=y;notifyIntersection?.([{target:post,isIntersecting:true}]);},
      resolveDecode(){afterDecode();},
      finish(){runs.splice(0).forEach(a=>a.done());}
    };
    children.set(id,child);
    vm.runInNewContext(code('assets/firma.js'),ctx);
    events.push(()=>f.emit('load'));
    return child;
  }
  const setupParentGlobal=global;
  if(standalone) child(standalone);
  else {
    vm.runInContext(code('opening-bridge.js'),parent);
    vm.runInContext(code('welcome.js'),parent);
  }
  return {
    logs,children,hub,welcome,body,start,global,buttons,selector,location,
    stage(s){stage=s;},
    message(id,data,source=parentEndpoint,from=origin){children.get(id).global.emit('message',{data,source,origin:from});},
    readStage(){return stage;},
    timer(ms){for(const [id,t] of timers){if(t.ms===ms){timers.delete(id);t.fn();return;}}throw Error('No timer '+ms);},
    endDoor(){hub.emit('animationend',{animationName:'open-demo'});},
    async flush(){
      for(let i=0;i<6;i++){
        while(events.length) events.shift()();
        const queue=[...rafs];rafs.clear();for(const [,fn] of queue) fn();
        await Promise.resolve();
      }
    },
    motions(){return logs.filter(e=>e.kind==='motion');},
    finish(){children.forEach(c=>c.finish());}
  };
}

(async()=>{
  const report={};
  for(const protocol of ['file:','http:']){
    const s=setup(protocol);
    await s.flush();
    assert.equal(s.children.size,0);
    s.stage('cover click / preload');
    s.start.click();
    await s.flush();
    assert.equal(s.hub.hasAttribute('inert'),true);
    assert.equal(s.children.size,1);
    assert.equal(s.motions().length,0);
    const forged={type:'gtl-opening-activation',active:true};
    s.message('01',forged,{});
    s.message('01',forged,undefined,'https://wrong.invalid');
    s.children.get('01').setScroll(1000);
    await s.flush();
    assert.equal(s.motions().length,0);
    s.stage('door midway');
    s.timer(180);
    assert.equal(s.body.classList.contains('revealing'),true);
    await s.flush();
    assert.equal(s.motions().length,0);
    s.stage('door finished');
    s.endDoor();
    await s.flush();
    assert.deepEqual(s.motions(),[{kind:'motion',id:'01',effect:'opening',stage:'door finished',welcomeHidden:true,scroll:0}]);
    s.children.get('01').setScroll(1000);
    assert.equal(s.motions().at(-1).effect,'post');
    s.finish();await s.flush();
    const selection=[1,2,0,1,2,0];
    for(const i of selection){
      const id=opts[i], before=s.motions().length;
      s.stage('activate '+id);
      const old=s.children.get(id);
      if(old)old.setScroll(1000);
      s.buttons[i].click();
      await s.flush();
      const selected=s.children.get(id);
      assert.deepEqual(s.motions().slice(before).map(({id,effect,scroll})=>({id,effect,scroll})),[{id,effect:'opening',scroll:0}]);
      if(old)assert.equal(old,selected,'replay keeps the same iframe document');
      s.buttons[i].click();
      await s.flush();
      assert.equal(s.motions().length,before+1,'same tab does not retrigger');
      selected.setScroll(1000);selected.setScroll(0);selected.setScroll(1000);
      assert.deepEqual(s.motions().slice(before).map(({id,effect,scroll})=>({id,effect,scroll})),[{id,effect:'opening',scroll:0},{id,effect:'post',scroll:1000}]);
      s.finish();await s.flush();
      assert(selected.opening.classList.contains('sf-done'));
      assert(selected.post.classList.contains('sf-done'));
    }
    s.buttons[1].click();await s.flush();
    const old=s.children.get('02');
    const previous=old.runs.at(-1);
    assert(old.opening.classList.contains('sf-playing'));
    s.buttons[2].click();await s.flush();
    assert(old.opening.classList.contains('sf-done'));
    s.buttons[1].click();await s.flush();
    previous.done();await s.flush();
    assert(old.opening.classList.contains('sf-playing'),'old completion must not end the new opening');
    s.timer(2600);await s.flush();
    assert(old.opening.classList.contains('sf-done'),'watchdog closes the active opening');
    s.finish();await s.flush();

    s.location.hash='';s.global.emit('popstate');await s.flush();
    assert.equal(s.welcome.hidden,false);
    const count=s.motions().length;
    s.start.click();s.timer(180);await s.flush();
    assert.equal(s.motions().length,count);
    s.timer(1200);await s.flush();
    assert.equal(s.motions().length,count+1);
    assert.equal(s.motions().at(-1).id,'01');
    s.finish();await s.flush();

    const direct=setup(protocol,{hash:'#03'});
    await direct.flush();assert.deepEqual(direct.motions().map(x=>x.id),['03']);
    direct.selector.emit('keydown',{key:'ArrowRight'});await direct.flush();
    assert.deepEqual(direct.motions().map(x=>x.id),['03','01']);
    direct.finish();await direct.flush();

    const slow=setup(protocol,{hash:'#01',delayPhoto:'01'});
    await slow.flush();assert.equal(slow.motions().length,0);
    slow.buttons[1].click();await slow.flush();
    slow.children.get('01').resolveDecode();await slow.flush();
    assert.equal(slow.motions().filter(x=>x.id==='01').length,0);
    slow.buttons[0].click();await slow.flush();
    assert.equal(slow.motions().filter(x=>x.id==='01').length,1);
    slow.finish();await slow.flush();

    const standalone=setup(protocol,{standalone:'03'});
    await standalone.flush();assert.equal(standalone.motions().length,1);
    standalone.children.get('03').setScroll(1000);
    assert.equal(standalone.motions().length,2);
    standalone.finish();await standalone.flush();

    for(const options of [{reduced:true,hash:'#01'},{supportObserver:false,hash:'#01'}]){
      const noMotion=setup(protocol,options);await noMotion.flush();
      noMotion.buttons[1].click();await noMotion.flush();
      noMotion.children.get('02').setScroll(1000);
      assert.equal(noMotion.motions().length,0);
      assert(noMotion.children.get('02').opening.classList.contains('sf-done'));
      assert(noMotion.children.get('02').post.classList.contains('sf-done'));
    }

    report[protocol]={noOpeningBehindWelcome:true,replay:selection.map(i=>opts[i]),postReplayOnScroll:true,scrollReset:true,iframeRetained:true,noReplayOfActiveTab:true,keyboard:true,rapidSwitchAndStaleCompletion:true,deepLink:true,standalone:true,slowImage:true,reducedMotionAndNoObserver:true};
  }
  console.log(JSON.stringify({method:'Production JS with DOM, iframe messages and animation frames simulated.',protocols:report},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
