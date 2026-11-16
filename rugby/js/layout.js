// Workspace dimensions are local preferences, never part of saved drill data.
const KEY='rugby-workspace-layout-v1';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function defaults(width,height){return {left:width>1100?184:150,right:width>1100?258:220,timeline:clamp(Math.round(height*.22),145,220)}}
export function sizeLimits(width,height,header=60){
 const mobile=width<=760,minLeft=132,minRight=190,room=Math.max(minLeft+minRight,Math.floor(width-365));
 const minTimeline=mobile?185:132,maxTimeline=Math.max(minTimeline,Math.floor(Math.min(520,height-header-(mobile?150:190))));
 return {mobile,minLeft,minRight,room,minTimeline,maxTimeline,maxLeft:365,maxRight:410};
}
export function constrainLayout(pref,width,height,header=60,changed=null){
 const d=defaults(width,height),l=sizeLimits(width,height,header);
 let left=Math.round(clamp(finite(pref?.left)?pref.left:d.left,l.minLeft,l.maxLeft)),right=Math.round(clamp(finite(pref?.right)?pref.right:d.right,l.minRight,l.maxRight));
 if(left+right>l.room){
  if(changed==='left'){left=Math.max(l.minLeft,l.room-right);right=Math.min(right,l.room-left)}
  else if(changed==='right'){right=Math.max(l.minRight,l.room-left);left=Math.min(left,l.room-right)}
  else {const budget=l.room-l.minLeft-l.minRight,flex=left-l.minLeft+right-l.minRight;const freeLeft=flex?Math.floor(budget*(left-l.minLeft)/flex):0;left=l.minLeft+freeLeft;right=l.minRight+budget-freeLeft}
 }
 return {left,right,timeline:Math.round(clamp(finite(pref?.timeline)?pref.timeline:d.timeline,l.minTimeline,l.maxTimeline))};
}
function readPrefs(){try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');return Object.fromEntries(['left','right','timeline'].filter(k=>finite(raw?.[k])).map(k=>[k,raw[k]]))}catch{return {}}}
export function initPanelLayout({sync=()=>{},mobile=()=>false}={}){
 const $=id=>document.getElementById(id),body=document.body,handles={left:$('splitTools'),right:$('splitInspector'),timeline:$('splitTimeline')};let pref=readPrefs(),current=null,drag=null;
 const viewport=()=>({width:document.documentElement.clientWidth,height:document.documentElement.clientHeight,header:document.querySelector('body > header')?.getBoundingClientRect().height||60});
 function save(){try{localStorage.setItem(KEY,JSON.stringify(pref))}catch{}}
 function apply(changed=null,source=pref){
  const {width,height,header}=viewport(),l=sizeLimits(width,height,header);
  current=constrainLayout(source,width,height,header,changed);
  for(const [key,variable] of [['left','--user-tools-width'],['right','--user-inspector-width'],['timeline','--user-timeline-height']])body.style.setProperty(variable,current[key]+'px');
  const ranges={left:[l.minLeft,Math.min(l.maxLeft,l.room-current.right)],right:[l.minRight,Math.min(l.maxRight,l.room-current.left)],timeline:[l.minTimeline,l.maxTimeline]};
  for(const [key,handle] of Object.entries(handles)){handle.setAttribute('aria-valuemin',String(ranges[key][0]));handle.setAttribute('aria-valuemax',String(ranges[key][1]));handle.setAttribute('aria-valuenow',String(current[key]));handle.setAttribute('aria-valuetext',current[key]+' pixels')}
 }
 function allowed(key){return !body.classList.contains('presentation-mode')&&(key==='timeline'?!body.classList.contains('hide-tracks'):!mobile()&&!body.classList.contains(key==='left'?'hide-equipment':'hide-inspector'))}
 function resize(key,value){apply(key,{...current,[key]:value});pref[key]=current[key]}
 function finish(e){if(!drag||e.pointerId!==drag.pointerId)return;drag.handle.classList.remove('dragging');body.classList.remove('resizing-workspace');body.classList.remove('resize-horizontal');drag=null;save()}
 for(const [key,handle] of Object.entries(handles)){
  const axis=key==='timeline'?'clientY':'clientX',sign=key==='left'?1:-1;
  handle.addEventListener('pointerdown',e=>{if(e.button!==0||!allowed(key)||drag)return;apply();drag={key,handle,pointerId:e.pointerId,origin:e[axis],initial:current[key]};handle.setPointerCapture(e.pointerId);handle.classList.add('dragging');body.classList.add('resizing-workspace');body.classList.toggle('resize-horizontal',key==='timeline');e.preventDefault()});
  handle.addEventListener('pointermove',e=>{if(drag?.handle!==handle||drag.pointerId!==e.pointerId)return;resize(key,drag.initial+(e[axis]-drag.origin)*sign);e.preventDefault()});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(name,finish);
  handle.addEventListener('dblclick',()=>{if(!allowed(key))return;delete pref[key];apply();save()});
  handle.addEventListener('keydown',e=>{if(!allowed(key))return;const step=e.shiftKey?32:8;let delta=0;
   if(key==='timeline'){if(e.key==='ArrowUp')delta=step;else if(e.key==='ArrowDown')delta=-step}
   else {if(e.key==='ArrowRight')delta=step*sign;else if(e.key==='ArrowLeft')delta=-step*sign}
   if(delta){resize(key,current[key]+delta);save();e.preventDefault()}
   else if(e.key==='Home'||e.key==='End'){resize(key,e.key==='Home'?Number(handle.getAttribute('aria-valuemin')):Number(handle.getAttribute('aria-valuemax')));save();e.preventDefault()}
  });
 }
 $('resetLayout').addEventListener('click',()=>{pref={};body.classList.toggle('hide-equipment',mobile());body.classList.toggle('hide-inspector',mobile());body.classList.remove('hide-tracks');apply();save();sync()});
 window.addEventListener('resize',()=>apply());apply();
}
