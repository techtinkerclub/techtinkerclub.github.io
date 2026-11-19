
import {initPanelLayout} from './layout.js?v=0.4.9';
import {initMobileEditor} from './mobile-editor.js?v=0.1.4';
const $=id=>document.getElementById(id);
const tabs=['Object','Step','Drill'];
let mobileEditor=null;
export function openInspector(name,reveal=true) {
 if(!tabs.includes(name))return;
 for(const tab of tabs){
  const active=tab===name,b=$('tab'+tab),p=$('pane'+tab);
  b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;p.hidden=!active;
 }
 if(reveal&&!document.body.classList.contains('presentation-mode')){
  document.body.classList.remove('hide-inspector');
  if(matchMedia('(max-width:1100px)').matches){document.body.classList.add('hide-equipment');mobileEditor?.show('edit')}
 }
 sync();
}
function sync(){
 const body=document.body;
 for(const [id,cls] of [['toggleEquipment','hide-equipment'],['toggleInspector','hide-inspector'],['toggleTracks','hide-tracks']]){
  const b=$(id),active=!body.classList.contains(cls);
  b.setAttribute('aria-expanded',String(active));b.classList.toggle('selected',active);
 }
 $('toggleTracks').textContent=body.classList.contains('hide-tracks')?'Tracks ▸':'Tracks ▾';
 mobileEditor?.update();
 const mode=body.classList.contains('presentation-mode');
 $('present').textContent=mode?'Exit presentation':'Presentation';
 $('present').setAttribute('aria-pressed',String(mode));
}
export function initWorkspace(){
 const body=document.body, mq=matchMedia('(max-width:1100px)');
 mobileEditor=initMobileEditor({enabled:()=>mq.matches,sync});
 function mobile(){
  if(mq.matches){body.classList.add('mobile-workspace');mobileEditor.reset(true)}
  else{body.classList.remove('mobile-workspace','hide-equipment','hide-inspector','hide-tracks');mobileEditor.reset(false)}
  sync();
 }
 mobile();mq.addEventListener('change',mobile);
 for(const [id,cls,other] of [['toggleEquipment','hide-equipment','hide-inspector'],['toggleInspector','hide-inspector','hide-equipment'],['toggleTracks','hide-tracks',null]]){
  $(id).addEventListener('click',()=>{const hidden=body.classList.toggle(cls);if(mq.matches&&other){mobileEditor.show(hidden?'pitch':cls==='hide-equipment'?'tools':'edit')}else{if(!hidden&&other&&mq.matches)body.classList.add(other);sync()}});
 }
 for(const name of tabs){
  const b=$('tab'+name);b.addEventListener('click',()=>openInspector(name));
  b.addEventListener('keydown',e=>{let i=tabs.indexOf(name);if(e.key==='ArrowRight')i=(i+1)%3;else if(e.key==='ArrowLeft')i=(i+2)%3;else if(e.key==='Home')i=0;else if(e.key==='End')i=2;else return;e.preventDefault();openInspector(tabs[i]);$('tab'+tabs[i]).focus()});
 }
 $('present').addEventListener('click',()=>{body.classList.toggle('presentation-mode');if(mq.matches)mobileEditor.show('pitch');sync()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')&&body.classList.contains('presentation-mode')){body.classList.remove('presentation-mode');sync();}});
 initPanelLayout({sync, mobile:()=>mq.matches});
 openInspector('Step',false);
}
