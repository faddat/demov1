export function mountHub(doc,{Observer=doc.defaultView.IntersectionObserver}={}){
 const win=doc.defaultView,reduced=win.matchMedia('(prefers-reduced-motion: reduce)'),saveData=!!win.navigator.connection?.saveData;
 const cards=[...doc.querySelectorAll('.demo-card')],filters=[...doc.querySelectorAll('[data-filter]')],listeners=[],states=new Map();let observer;
 const listen=(node,type,fn)=>{node.addEventListener(type,fn);listeners.push(()=>node.removeEventListener(type,fn));};
 function update(state){state.button.setAttribute('aria-pressed',String(state.playing));state.button.textContent=state.playing?'Ⅱ Pause':'▶ Preview';state.button.setAttribute('aria-label',(state.playing?'Pause ':'Play ')+state.title+' preview');}
 function pause(state){state.request++;state.video.pause();state.playing=false;update(state);}
 async function play(state){
  if(!state.video.getAttribute('src')){state.video.src=state.video.dataset.video;state.video.load();}
  const request=++state.request;
  try{await state.video.play();if(request!==state.request)return;state.playing=true;state.button.title='';update(state);}
  catch{if(request!==state.request)return;state.playing=false;update(state);state.button.title='Preview could not play. Open the demo to try it.';}
 }
 for(const card of cards){const video=card.querySelector('video'),button=card.querySelector('.preview-toggle'),state={card,video,button,title:card.querySelector('h3').textContent,request:0,playing:false,manualPause:false,visible:false};video.muted=true;states.set(card,state);listen(button,'click',()=>{if(state.playing){state.manualPause=true;pause(state);}else{state.manualPause=false;play(state);}});listen(video,'error',()=>{pause(state);button.title='Preview is unavailable. Open the demo to try it.';});}
 function filter(value){let visible=0;for(const state of states.values()){const show=value==='all'||state.card.dataset.category===value;state.card.hidden=!show;if(show)visible++;else pause(state);}for(const group of doc.querySelectorAll('[data-sector]'))group.hidden=![...group.querySelectorAll('.demo-card')].some(c=>!c.hidden);for(const b of filters)b.setAttribute('aria-pressed',String(b.dataset.filter===value));doc.getElementById('demo-count').textContent=visible+' interactive '+(visible===1?'demo':'demos');}
 for(const b of filters)listen(b,'click',()=>filter(b.dataset.filter));
 if(Observer){observer=new Observer(entries=>{for(const entry of entries){const state=states.get(entry.target);if(!state)continue;state.visible=entry.isIntersecting;if(state.visible&&!state.card.hidden&&!reduced.matches&&!saveData&&!state.manualPause&&!doc.hidden)play(state);else if(!state.visible)pause(state);}},{threshold:.25});for(const c of cards)observer.observe(c);}
 const pauseAll=()=>{for(const s of states.values())pause(s);};
 listen(doc,'visibilitychange',()=>{if(doc.hidden)pauseAll();else for(const s of states.values())if(s.visible&&!s.card.hidden&&!s.manualPause&&!reduced.matches&&!saveData)play(s);});
 const motionChange=()=>{if(reduced.matches)pauseAll();};reduced.addEventListener?.('change',motionChange);
 function dispose(){observer?.disconnect();pauseAll();listeners.forEach(fn=>fn());reduced.removeEventListener?.('change',motionChange);}
 listen(win,'pagehide',dispose);
 return {filter,dispose};
}
if(typeof document!=='undefined')mountHub(document);
