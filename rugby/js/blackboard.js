// Blackboard view uses the LIVE Classic editor, never a duplicated drill.
// All durable rugby actions are forwarded to existing Studio controls.
// The optional yellow ink is explicitly temporary and never enters drill data.
const $=id=>document.getElementById(id);
const escapeText=text=>String(text??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const STROKE_NS='http://www.w3.org/2000/svg';

export function initBlackboard({getState,fit,rotate,openDetails}){
 const host=document.querySelector('.field-wrap'),pitch=$('pitch');
 if(!host||!pitch)return {open:()=>{},close:()=>{},sync:()=>{}};
 const launch=document.createElement('button');
 launch.type='button';launch.id='blackboardLaunch';launch.className='blackboard-launch';
 launch.textContent='▤ Blackboard';launch.title='Full-pitch interactive coaching blackboard (B)';
 launch.setAttribute('aria-keyshortcuts','B');launch.setAttribute('aria-controls','blackboardUI');
 $('details')?.parentElement?.insertBefore(launch,$('details').nextSibling);
 const ui=document.createElement('div');ui.id='blackboardUI';ui.className='blackboard-ui';ui.hidden=true;
 ui.innerHTML=
 '<div class="bb-title" aria-live="polite"><strong id="bbName">Rugby blackboard</strong><small id="bbStep">Select and move a player</small></div>'+
 '<nav class="bb-rail" aria-label="Blackboard tools">'+
  '<button type="button" data-bb="select" class="is-active" title="Select and drag players">↖<span>Select</span></button>'+
  '<button type="button" data-bb="run" title="Draw the selected player\'s running path">↝<span>Run</span></button>'+
  '<button type="button" data-bb="pass" title="Pass the ball from the selected carrier">⇢<span>Pass</span></button>'+
  '<button type="button" data-bb="ink" title="Freehand coaching ink (temporary, not saved)">✎<span>Ink</span></button>'+
  '<button type="button" data-bb="add" title="Add a player or training object">＋<span>Add</span></button>'+
  '<button type="button" data-bb="details" title="Open the actual object and step inspector">☷<span>Details</span></button>'+
 '</nav>'+
 '<section id="bbAddMenu" class="bb-add-menu" aria-label="Add pitch object" hidden>'+
  '<strong>Add to drill</strong><div>'+
  '<button type="button" data-bb-add="attacker">Blue player</button>'+
  '<button type="button" data-bb-add="defender">Red player</button>'+
  '<button type="button" data-bb-add="ball">Rugby ball</button>'+
  '<button type="button" data-bb-add="cone">Cone</button>'+
  '<button type="button" data-bb-add="markerDisc">Marker</button>'+
  '<button type="button" data-bb-add="fieldLine">Line marking</button>'+
 '</div><small>Added to the same editable drill</small></section>'+
 '<section id="bbSelection" class="bb-selection" aria-label="Selected player actions" hidden>'+
  '<strong id="bbSelected">Player</strong>'+
  '<div class="bb-actions">'+
  '<button type="button" data-bb="run">↝ Run</button>'+
  '<button type="button" data-bb="pass">⇢ Pass</button>'+
  '<button type="button" data-bb="turn-left" title="Turn 15° left">↶ Turn</button>'+
  '<button type="button" data-bb="turn-right" title="Turn 15° right">↷ Turn</button>'+
  '<button type="button" data-bb="details">Edit details</button>'+
  '</div></section>'+
 '<section class="bb-ink-controls" id="bbInkControls" hidden>'+
  '<strong>Temporary coaching ink</strong>'+
  '<label>Colour <input id="bbInkColour" type="color" value="#ffe68c" aria-label="Ink colour"></label>'+
  '<button type="button" data-bb="ink-undo">Undo mark</button>'+
  '<button type="button" data-bb="ink-clear">Clear ink</button>'+
  '<small>Visible on this board only · not saved or included in video export</small>'+
 '</section>'+
 '<nav class="bb-top-actions" aria-label="Blackboard options">'+
  '<button type="button" data-bb="undo" title="Undo edit">↶ <span>Undo</span></button>'+
  '<button type="button" data-bb="redo" title="Redo edit">↷ <span>Redo</span></button>'+
  '<button type="button" data-bb="fit" title="Fit all of the pitch">⊞ <span>Fit</span></button>'+
  '<button type="button" data-bb="fullscreen" title="Use display fullscreen if available">⛶ <span>Fullscreen</span></button>'+
  '<button type="button" data-bb="ruckus" id="bbRuckus" title="Switch Classic/Ruckus appearance">◉ <span>Ruckus</span></button>'+
  '<button type="button" data-bb="exit" class="bb-close" title="Return to Studio">× <span>Exit</span></button>'+
 '</nav>'+
 '<nav class="bb-steps" aria-label="Drill steps">'+
  '<button type="button" data-bb="prev" title="Previous step">◀</button>'+
  '<span id="bbStepCount">Step 1 / 1</span>'+
  '<button type="button" data-bb="next" title="Next step">▶</button>'+
  '<button type="button" data-bb="new-step" title="Copy this step to create a movement">＋ Step</button>'+
  '<button type="button" data-bb="play" class="bb-play" title="Play or pause this drill">▶ Play</button>'+
 '</nav>'+
 '<div id="bbNotice" class="bb-notice" role="status" aria-live="polite"></div>'+
 '<button type="button" data-bb="close-details" id="bbCloseDetails" title="Close inspector" hidden>× Close details</button>';
 document.body.appendChild(ui);
 const ink=document.createElementNS(STROKE_NS,'svg');ink.id='blackboardInk';ink.classList.add('blackboard-ink');
 ink.setAttribute('aria-label','Temporary freehand annotations');ink.setAttribute('aria-hidden','true');
 ink.setAttribute('preserveAspectRatio','xMidYMid meet');host.appendChild(ink);
 let active=false,pen=false,drawer=false,adding=false,drag=null;
 const marks=[];
 const hint=message=>{const el=$('bbNotice');if(el)el.textContent=message};
 const btn=name=>ui.querySelector('[data-bb="'+name+'"]');
 const click=id=>{const el=$(id);if(!el||el.disabled||el.hidden)return false;el.click();return true};
 function syncInkView(){
  const box=pitch.getAttribute('viewBox')||'0 0 900 540';
  if(ink.getAttribute('viewBox')!==box)ink.setAttribute('viewBox',box);
 }
 function setPen(on){
  pen=!!on;ink.classList.toggle('is-drawing',pen);
  ui.classList.toggle('bb-pen-mode',pen);
  $('bbInkControls').hidden=!pen;
  for(const button of ui.querySelectorAll('[data-bb="ink"]'))button.classList.toggle('is-active',pen);
  btn('select')?.classList.toggle('is-active',!pen);
  if(pen){adding=false;$('bbAddMenu').hidden=true;hint('Draw freely over the pitch. Ink is temporary and does not change the drill.');}
 }
 function sync(){
  if(!active)return;
  syncInkView();
  const state=getState();
  $('bbName').textContent=state.title||'Rugby blackboard';
  $('bbStep').textContent=state.stepName||'Click a player, then choose an action';
  $('bbStepCount').textContent='Step '+(state.idx+1)+' / '+state.total;
  $('bbSelected').textContent=state.selection?.label||'Selected object';
  const showSelection=!!state.selection&&!state.playing&&state.preview===null&&!pen;
  $('bbSelection').hidden=!showSelection;
  for(const button of ui.querySelectorAll('[data-bb="run"]'))
   button.disabled=!showSelection||!state.canRun;
  for(const button of ui.querySelectorAll('[data-bb="pass"]'))
   button.disabled=!showSelection||!state.canPass;
  for(const b of ui.querySelectorAll('[data-bb="prev"]'))b.disabled=state.idx===0;
  for(const b of ui.querySelectorAll('[data-bb="next"]'))b.disabled=state.idx>=state.total-1;
  btn('play').textContent=state.playing?'Ⅱ Pause':'▶ Play';
  btn('ruckus').classList.toggle('is-active',state.cartoonMode);
  btn('run')?.classList.toggle('is-active',state.routeDrawing);
  btn('undo').disabled=$('undoEdit')?.disabled??true;
  btn('redo').disabled=$('redoEdit')?.disabled??true;
  const routeButton=btn('run');
  if(routeButton)routeButton.title=state.routeDrawing?'Finish drawing this route':'Draw the selected player’s route';
 }
 function showDetails(open){
  drawer=!!open;document.body.classList.toggle('blackboard-details-open',drawer);
  $('bbCloseDetails').hidden=!drawer;
  btn('details')?.classList.toggle('is-active',drawer);
  if(drawer){openDetails();hint('Edit the selected object or step in the original inspector.');}
  else fit?.();
 }
 async function fullscreen(){
  try{
   if(document.fullscreenElement){await document.exitFullscreen();return}
   if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
   else hint('Blackboard already fills your browser window. Use the device fullscreen control if supported.');
  }catch{hint('Browser fullscreen is unavailable. The pitch still fills the window.')}
 }
 function handle(action){
  const state=getState();
  switch(action){
   case 'exit':close();return;
   case 'select':
    if(state.routeDrawing)click('drawRouteSide');
    setPen(false);adding=false;$('bbAddMenu').hidden=true;hint('Tap a player to select; drag to move.');break;
   case 'ink':if(state.routeDrawing)click('drawRouteSide');setPen(!pen);break;
   case 'run':setPen(false);
    if(!click('drawRouteSide'))hint('Select a player first, then choose Run.');else hint('Click points on the pitch for the run. Tap Run again to finish.');break;
   case 'pass':setPen(false);
    if(!click('passBallSide'))hint('Select the player carrying the ball first.');else hint('Now tap the teammate who should receive the ball.');break;
   case 'add':setPen(false);adding=!adding;$('bbAddMenu').hidden=!adding;break;
   case 'details':showDetails(!drawer);break;
   case 'close-details':showDetails(false);break;
   case 'turn-left':rotate(-15);break;
   case 'turn-right':rotate(15);break;
   case 'prev':click('back');break;
   case 'next':click('forward');break;
   case 'new-step':click('addStep');break;
   case 'play':setPen(false);click('play');break;
   case 'undo':click('undoEdit');break;
   case 'redo':click('redoEdit');break;
   case 'fit':fit?.();break;
   case 'ruckus':click('minionMode');break;
   case 'fullscreen':fullscreen();break;
   case 'ink-undo':{const last=marks.pop();last?.remove();hint(marks.length+' temporary marks remain.');break}
   case 'ink-clear':marks.splice(0).forEach(p=>p.remove());hint('Temporary ink cleared.');break;
  }
  requestAnimationFrame(sync);
 }
 ui.addEventListener('click',event=>{
  const addButton=event.target.closest('[data-bb-add]');
  if(addButton){
   const type=addButton.dataset.bbAdd;
   let original=document.querySelector('#palette [data-type="'+type+'"]');
   if(!original)original=document.querySelector('#rugbyPalette [data-type="'+type+'"]');
   if(original){original.click();hint(type+' added to the editable drill.');}
   else hint('This object is not available in the current palette.');
   adding=false;$('bbAddMenu').hidden=true;
   requestAnimationFrame(sync);return;
  }
  const b=event.target.closest('[data-bb]');if(b&&!b.disabled)handle(b.dataset.bb);
 });
 function point(e){
  const p=ink.createSVGPoint();p.x=e.clientX;p.y=e.clientY;
  return p.matrixTransform(ink.getScreenCTM().inverse());
 }
 ink.addEventListener('pointerdown',event=>{
  if(!pen||!active||event.button!==0)return;
  const p=point(event);const path=document.createElementNS(STROKE_NS,'path');
  path.setAttribute('d','M '+p.x.toFixed(2)+' '+p.y.toFixed(2));
  path.setAttribute('fill','none');
  path.setAttribute('stroke',$('bbInkColour').value);
  path.setAttribute('stroke-width','3.5');path.setAttribute('stroke-linecap','round');
  path.setAttribute('stroke-linejoin','round');path.setAttribute('vector-effect','non-scaling-stroke');
  ink.appendChild(path);marks.push(path);
  drag={id:event.pointerId,path,points:1};
  ink.setPointerCapture(event.pointerId);event.preventDefault();
 });
 ink.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  const p=point(event);drag.path.setAttribute('d',drag.path.getAttribute('d')+' L '+p.x.toFixed(2)+' '+p.y.toFixed(2));drag.points++;
  event.preventDefault();
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])ink.addEventListener(type,event=>{
  if(!drag||drag.id!==event.pointerId)return;
  if(drag.points===1){
   const p=point(event);drag.path.setAttribute('d',drag.path.getAttribute('d')+' l .1 .1');
  }
  drag=null;
 });
 const observer=new MutationObserver(()=>{if(active)requestAnimationFrame(sync)});
 observer.observe(pitch,{attributes:true,attributeFilter:['viewBox'],childList:true});
 for(const id of ['selectionLabel','sceneLabel','status'])if($(id))observer.observe($(id),{childList:true,characterData:true,subtree:true});
 function open(){
  if(active)return;
  active=true;document.body.classList.add('blackboard-mode');
  ui.hidden=false;setPen(false);showDetails(false);
  fit?.();sync();
  hint('Tap and drag a player. Draw a run or pass using the left toolbar. B or Esc returns to Studio.');
  launch.setAttribute('aria-pressed','true');
 }
 function close(){
  if(!active)return;
  if(drag)drag=null;
  setPen(false);showDetails(false);
  active=false;ui.hidden=true;document.body.classList.remove('blackboard-mode');
  launch.setAttribute('aria-pressed','false');
  if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});
  fit?.();
  launch.focus({preventScroll:true});
 }
 launch.addEventListener('click',open);
 document.addEventListener('keydown',event=>{
  if(event.target.closest('input,textarea,select,[contenteditable]')||document.querySelector('dialog[open]'))return;
  if(!active&&event.key.toLowerCase()==='b'&&!event.altKey&&!event.ctrlKey&&!event.metaKey){
   event.preventDefault();open();return;
  }
  if(active&&event.key==='Escape'){
   if(!$('objectMenu')?.hidden)return;
   if(getState().routeDrawing){click('drawRouteSide');event.preventDefault();event.stopImmediatePropagation();return}
   if(drawer){showDetails(false);event.preventDefault();event.stopImmediatePropagation();return}
   event.preventDefault();event.stopImmediatePropagation();close();
  }
 },true);
 return {open,close,sync};
}
