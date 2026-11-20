// Blackboard view uses the LIVE Classic editor, never a duplicated drill.
// All durable rugby actions are forwarded to existing Studio controls.
// The optional yellow ink is explicitly temporary and never enters drill data.
const $=id=>document.getElementById(id);
const escapeText=text=>String(text??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const STROKE_NS='http://www.w3.org/2000/svg';
import {keyMoments} from './blackboard-coaching.js?v=1';

export function initBlackboard({getState,fit,rotate,openDetails,openStepDetails,openObjectActions,onCoachTool=()=>false}){
 const host=document.querySelector('.field-wrap'),pitch=$('pitch');
 if(!host||!pitch)return {open:()=>{},close:()=>{},sync:()=>{}};
 const launch=document.createElement('button');
 launch.type='button';launch.id='blackboardLaunch';launch.className='blackboard-launch';
 launch.textContent='▤ Blackboard';launch.title='Full-pitch interactive coaching blackboard (B)';
 launch.setAttribute('aria-keyshortcuts','B');launch.setAttribute('aria-controls','blackboardUI');
 launch.setAttribute('aria-pressed','false');
 $('details')?.parentElement?.insertBefore(launch,$('details').nextSibling);
 const viewPanel=document.querySelector('#viewMenu .view-menu-panel');
 if(viewPanel){
  const entry=document.createElement('button');entry.id='blackboardFromView';entry.type='button';
  entry.textContent='▤ Open full-screen Blackboard';
  entry.title='Open the live editable pitch with floating blackboard tools';
  viewPanel.appendChild(entry);
  entry.addEventListener('click',()=>{$('viewMenu').open=false;open()});
 }
 const ui=document.createElement('div');ui.id='blackboardUI';ui.className='blackboard-ui';ui.hidden=true;
 ui.innerHTML=
 '<div class="bb-title bb-movable" data-bb-panel="title" aria-live="polite"><button type="button" class="bb-grip" aria-label="Move title panel" title="Drag or use arrow keys to move panel">⠿</button><strong id="bbName">Rugby blackboard</strong><small id="bbStep">Select and move a player</small></div>'+
 '<nav class="bb-rail bb-movable" data-bb-panel="tools" aria-label="Blackboard tools">'+
  '<button type="button" class="bb-grip" aria-label="Move tools panel" title="Drag or use arrow keys to move panel">⠿</button>'+
  '<button type="button" data-bb="select" class="is-active" title="Select and drag players">↖<span>Select</span></button>'+
  '<button type="button" data-bb="run" title="Draw the selected player\'s running path">↝<span>Run</span></button>'+
  '<button type="button" data-bb="pass" title="Pass the ball from the selected carrier">⇢<span>Pass</span></button>'+
  '<button type="button" data-bb="ink" title="Freehand coaching ink (temporary, not saved)">✎<span>Ink</span></button>'+
  '<button type="button" data-bb="add" title="Add a player or training object">＋<span>Add</span></button>'+
  '<button type="button" data-bb="details" title="Open the actual object and step inspector">☷<span>Details</span></button>'+
 '</nav>'+
 '<section id="bbAddMenu" class="bb-add-menu bb-movable" data-bb-panel="add" aria-label="Add pitch object" hidden>'+
  '<button type="button" class="bb-grip" aria-label="Move add-objects panel" title="Drag panel">⠿</button>'+
  '<strong>Add to drill</strong><div>'+
  '<button type="button" data-bb-add="attacker">Blue player</button>'+
  '<button type="button" data-bb-add="defender">Red player</button>'+
  '<button type="button" data-bb-add="ball">Rugby ball</button>'+
  '<button type="button" data-bb-add="cone">Cone</button>'+
  '<button type="button" data-bb-add="markerDisc">Marker</button>'+
  '<button type="button" data-bb-add="fieldLine">Line marking</button>'+
 '</div><small>Added to the same editable drill</small></section>'+
 '<section id="bbSelection" class="bb-selection bb-movable" data-bb-panel="selection" aria-label="Selected player actions" hidden>'+
  '<button type="button" class="bb-grip" aria-label="Move selected-player panel" title="Drag panel">⠿</button>'+
  '<strong id="bbSelected">Player</strong>'+
  '<div class="bb-actions">'+
  '<button type="button" data-bb="run">↝ Run</button>'+
  '<button type="button" data-bb="pass">⇢ Pass</button>'+
  '<button type="button" data-bb="turn-left" title="Turn 15° left">↶ Turn</button>'+
  '<button type="button" data-bb="turn-right" title="Turn 15° right">↷ Turn</button>'+
  '<button type="button" data-bb="actions" title="Open existing contact, ball and movement commands">⋯ Actions</button>'+
  '<button type="button" data-bb="details">Edit details</button>'+
  '</div></section>'+
 '<section class="bb-ink-controls bb-movable" data-bb-panel="ink" id="bbInkControls" hidden>'+
  '<button type="button" class="bb-grip" aria-label="Move ink panel" title="Drag panel">⠿</button>'+
  '<strong>Temporary coaching ink</strong>'+
  '<label>Colour <input id="bbInkColour" type="color" value="#ffe68c" aria-label="Ink colour"></label>'+
  '<button type="button" data-bb="ink-undo">Undo mark</button>'+
  '<button type="button" data-bb="ink-clear">Clear ink</button>'+
  '<small>Visible on this board only · not saved or included in video export</small>'+
 '</section>'+
 '<nav class="bb-top-actions bb-movable" data-bb-panel="options" aria-label="Blackboard options">'+
  '<button type="button" class="bb-grip" aria-label="Move top actions" title="Drag or use arrow keys to move panel">⠿</button>'+
  '<button type="button" data-bb="undo" title="Undo edit">↶ <span>Undo</span></button>'+
  '<button type="button" data-bb="redo" title="Redo edit">↷ <span>Redo</span></button>'+
  '<button type="button" data-bb="fit" title="Fit all of the pitch">⊞ <span>Fit</span></button>'+
  '<button type="button" data-bb="camera" title="Open camera and view controls" aria-controls="bbCameraPanel" aria-expanded="false">◎ <span>View</span></button>'+
  '<button type="button" data-bb="fullscreen" title="Use display fullscreen if available">⛶ <span>Fullscreen</span></button>'+
  '<button type="button" data-bb="ruckus" id="bbRuckus" title="Switch to Ruckus cartoon view" aria-pressed="false">◉ <span>Ruckus</span></button>'+
  '<button type="button" data-bb="save" title="Save the current drill through Studio">⬇ <span>Save</span></button>'+
  '<button type="button" data-bb="exit" class="bb-close" title="Return to Studio">× <span>Exit</span></button>'+
 '</nav>'+
 '<nav class="bb-steps bb-movable" data-bb-panel="steps" aria-label="Drill steps">'+
  '<button type="button" class="bb-grip" aria-label="Move step controls" title="Drag or use arrow keys to move panel">⠿</button>'+
  '<button type="button" data-bb="prev" title="Previous step">◀</button>'+
  '<span id="bbStepCount">Step 1 / 1</span>'+
  '<button type="button" data-bb="next" title="Next step">▶</button>'+
  '<button type="button" data-bb="new-step" title="Copy this step to create a movement">＋ Step</button>'+
  '<button type="button" data-bb="delete-step" title="Delete the selected step (Undo restores it)">− Step</button>'+
  '<button type="button" data-bb="timeline" title="Edit step durations, timeline and object timing" aria-controls="bbTimelinePanel" aria-expanded="false">≡ <span>Timeline</span></button>'+ 
  '<button type="button" data-bb="decision" id="bbDecisionShortcut" title="View the actual A/B consequences" hidden>◆ Decision</button>'+
  '<button type="button" data-bb="play" class="bb-play" title="Play or pause this drill">▶ Play</button>'+
 '</nav>'+
 '<section id="bbCameraPanel" class="bb-camera-panel bb-movable" data-bb-panel="camera" hidden aria-label="Camera and view options">'+
  '<div class="bb-panel-heading"><button type="button" class="bb-grip" aria-label="Move camera panel" title="Drag panel">⠿</button><strong>Camera & view</strong><button type="button" class="bb-panel-close" data-bb="close-camera" aria-label="Close camera panel">×</button></div>'+
  '<div class="bb-camera-buttons">'+
  '<button type="button" data-bb="zoom-out" title="Zoom out">−</button><button type="button" data-bb="fit" title="Fit whole pitch">Fit</button><button type="button" data-bb="fit-drill" title="Fit drill area">Drill</button><button type="button" data-bb="fit-action" title="Focus current action">Action</button><button type="button" data-bb="zoom-in" title="Zoom in">＋</button>'+
  '</div><div class="bb-view-buttons">'+
  '<button type="button" data-bb="pan" aria-pressed="false" title="Move view by dragging empty pitch">✥ Pan</button>'+
  '<button type="button" data-bb="rotate-view" title="Rotate pitch view">⇅ Rotate</button>'+
  '<button type="button" data-bb="grid" aria-pressed="false" title="Toggle grid">▦ Grid</button>'+
  '<button type="button" data-bb="paths" aria-pressed="false" title="Show running and passing routes">↝ Paths</button>'+
  '<button type="button" data-bb="markings" aria-pressed="false" title="Show pitch markings">▤ Marks</button>'+
  '<button type="button" data-bb="follow" aria-pressed="false" title="Follow action during playback. Manual zoom, fit or pan turns it off.">◎ Follow action</button>'+ 
  '</div><details id="bbAdvancedView" class="bb-advanced-view"><summary>Focus &amp; panel layouts</summary><div class="bb-teaching-settings">'+
  '<label class="bb-setting">Follow <select id="bbFollowTarget" aria-label="Camera follows"><option value="action">Whole action</option><option value="selected">Selected player</option><option value="ball">Ball</option></select></label>'+ 
  '<button type="button" data-bb="spotlight" aria-pressed="false" title="Dim everyone except selected player or group">◉ Spotlight</button>'+ 
  '<label class="bb-setting">Ghost positions <select id="bbGhostMode" aria-label="Show ghost positions"><option value="off">Off</option><option value="start">Start</option><option value="next">Next</option><option value="both">Start + next</option></select></label>'+ 
  '</div><div class="bb-layout-settings">'+
  '<label class="bb-setting">Layout <select id="bbLayoutPreset" aria-label="Blackboard layout"><option value="editing">Editing · build</option><option value="coaching">Coaching · present</option></select></label>'+ 
  '<button type="button" data-bb="save-layout" title="Remember where you placed these panels on this device">Save layout</button>'+
  '</div><small id="bbLayoutHint" class="bb-layout-hint">Editing: all controls visible. Coaching: simpler, quieter panels.</small><button type="button" data-bb="reset-panels" class="bb-reset-panels">Reset panel positions</button></details>'+
 '</section>'+
 '<section id="bbTimelinePanel" class="bb-timeline-panel bb-movable" data-bb-panel="timeline" hidden aria-label="Steps and timing">'+
  '<div class="bb-panel-heading"><button type="button" class="bb-grip" aria-label="Move timeline panel" title="Drag panel">⠿</button><strong>Steps & timing</strong><button type="button" data-bb="tracks" title="Show or hide player movement tracks">Tracks ▾</button><button type="button" class="bb-panel-close" data-bb="close-timeline" aria-label="Close timeline">×</button></div>'+
  '<div class="bb-duration-row"><label for="bbStepSeconds">Step travel time (s)</label><input type="number" id="bbStepSeconds" min="0" max="30" step="0.1" value="2"><button type="button" data-bb="edit-step" title="Open full step editing inspector">Step details</button></div>'+ 
  '<div class="bb-playback-row"><button type="button" data-bb="replay" title="Play only the current movement again">↺ Replay step</button><button type="button" data-bb="loop" aria-pressed="false" title="Repeat this movement until you stop">⟲ Loop step</button><label>Speed <select id="bbSpeed" aria-label="Blackboard playback speed"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></div>'+ 
  '<details id="bbKeyMoments" class="bb-key-moments" hidden><summary>◆ Key moments <small id="bbMomentCount"></small></summary><div id="bbMomentChips" class="bb-moment-chips"></div></details>'+ 
  '<div id="bbDecisionBar" class="bb-decision-bar" hidden><strong id="bbDecisionQuestion"></strong><div class="bb-decision-actions"><button type="button" data-bb-choice="a">A</button><button type="button" data-bb-choice="b">B</button><button type="button" data-bb="compare-decision">Compare A / B</button><button type="button" data-bb="edit-decision">Edit</button></div></div>'+
  '<small>Pick a step below to edit it. Drag the playhead to preview; select a step to return to editing.</small>'+
  '<div id="bbNativeTimeline" class="bb-native-timeline"></div>'+
 '</section>'+
 '<div id="bbNotice" class="bb-notice" role="status" aria-live="polite"></div>'+
 '<button type="button" data-bb="close-details" id="bbCloseDetails" title="Close inspector" hidden>× Close details</button>';
 document.body.appendChild(ui);
 const ink=document.createElementNS(STROKE_NS,'svg');ink.id='blackboardInk';ink.classList.add('blackboard-ink');
 ink.setAttribute('aria-label','Temporary freehand annotations');ink.setAttribute('aria-hidden','true');
 ink.setAttribute('preserveAspectRatio','xMidYMid meet');host.appendChild(ink);
 let active=false,pen=false,drawer=false,adding=false,drag=null;
 let cameraOpen=false,timelineOpen=false,panelDrag=null;
 const layoutKey='rugby-blackboard-layouts-v1';
 const savedLayouts=(()=>{try{const raw=JSON.parse(localStorage.getItem(layoutKey)||'{}');return raw&&typeof raw==='object'?raw:{}}catch{return {}}})();
 let layoutPreset=savedLayouts.active==='coaching'?'coaching':'editing',momentSignature='';
 const nativeTimeline=$('timelinePanel'),timelineHome=nativeTimeline?.parentElement,timelineNext=nativeTimeline?.nextSibling;
 function mountTimeline(){
  const slot=$('bbNativeTimeline');
  if(nativeTimeline&&slot&&nativeTimeline.parentElement!==slot)slot.appendChild(nativeTimeline);
 }
 function restoreTimeline(){
  if(!nativeTimeline||!timelineHome||nativeTimeline.parentElement===timelineHome)return;
  if(timelineNext?.parentElement===timelineHome)timelineHome.insertBefore(nativeTimeline,timelineNext);
  else timelineHome.appendChild(nativeTimeline);
 }
 function openTimeline(show){
  timelineOpen=!!show;
  $('bbTimelinePanel').hidden=!timelineOpen;
  const button=btn('timeline');
  button?.setAttribute('aria-expanded',String(timelineOpen));
  button?.classList.toggle('is-active',timelineOpen);
  if(timelineOpen)mountTimeline();
 }
 function openCamera(show){
  cameraOpen=!!show;
  $('bbCameraPanel').hidden=!cameraOpen;
  const button=btn('camera');
  button?.setAttribute('aria-expanded',String(cameraOpen));
  button?.classList.toggle('is-active',cameraOpen);
 }
 const bounds=(panel,x,y)=>{
  const width=panel.getBoundingClientRect().width||panel.offsetWidth||200;
  const height=panel.getBoundingClientRect().height||panel.offsetHeight||80;
  return {left:Math.max(6,Math.min(x,Math.max(6,window.innerWidth-width-6))),
   top:Math.max(6,Math.min(y,Math.max(6,window.innerHeight-height-6)))};
 };
 function placePanel(panel,x,y){
  const pos=bounds(panel,x,y);
  panel.classList.add('is-moved');
  panel.style.left=pos.left+'px';panel.style.top=pos.top+'px';
  panel.style.right='auto';panel.style.bottom='auto';panel.style.transform='none';
 }
 function clearPanelPositions(){
  for(const panel of ui.querySelectorAll('[data-bb-panel]')){
   panel.classList.remove('is-moved','is-dragging');
   for(const prop of ['left','top','right','bottom','transform'])panel.style[prop]='';
  }
 }
 function storeLayouts(){
  try{savedLayouts.active=layoutPreset;localStorage.setItem(layoutKey,JSON.stringify(savedLayouts))}catch{}
 }
 function saveLayout(){
  const panels={};
  for(const panel of ui.querySelectorAll('[data-bb-panel].is-moved')){
   const key=panel.dataset.bbPanel,left=parseFloat(panel.style.left),top=parseFloat(panel.style.top);
   if(key&&Number.isFinite(left)&&Number.isFinite(top))panels[key]=[left,top];
  }
  savedLayouts[layoutPreset]={panels,camera:cameraOpen,timeline:timelineOpen};
  storeLayouts();
 }
 function useLayout(name){
  if(!['coaching','editing'].includes(name))return;
  layoutPreset=name;
  ui.classList.toggle('bb-coaching-layout',name==='coaching');
  $('bbLayoutPreset').value=name;
  $('bbLayoutHint').textContent=name==='coaching'?
   'Coaching hides Undo, Redo and Save, with quieter panels. It uses the same drill.':
   'Editing shows Undo, Redo and Save. Prepare and adjust the same drill.';
  const stored=savedLayouts[name];
  clearPanelPositions();
  // When first switching to a new layout, keep the current panel open:
  // otherwise the selector itself disappears and cannot switch back.
  if(stored){openTimeline(stored.timeline??false);openCamera(stored.camera??false)}
  for(const [key,p] of Object.entries(stored?.panels||{})){
   if(!Array.isArray(p)||!Number.isFinite(p[0])||!Number.isFinite(p[1]))continue;
   const panel=ui.querySelector('[data-bb-panel="'+key+'"]');if(panel)placePanel(panel,p[0],p[1]);
  }
  clampMovedPanels();storeLayouts();
 }
 function resetPanels(){
  delete savedLayouts[layoutPreset];
  clearPanelPositions();
  storeLayouts();
  hint('Panel positions reset for this layout.');
 }
 function clampMovedPanels(){
  for(const panel of ui.querySelectorAll('[data-bb-panel].is-moved')){
   if(panel.hidden)continue;
   placePanel(panel,Number.parseFloat(panel.style.left)||6,Number.parseFloat(panel.style.top)||6);
  }
 }
 window.addEventListener('resize',()=>{if(active)clampMovedPanels()});
 ui.addEventListener('pointerdown',event=>{
  const grip=event.target.closest('.bb-grip'),panel=grip?.closest('[data-bb-panel]');
  if(!active||!panel||event.button!==0)return;
  const rect=panel.getBoundingClientRect();
  panelDrag={id:event.pointerId,grip,panel,fromX:event.clientX,fromY:event.clientY,
   left:rect.left,top:rect.top};
  placePanel(panel,rect.left,rect.top);
  panel.classList.add('is-dragging');
  grip.setPointerCapture(event.pointerId);
  event.preventDefault();
 });
 ui.addEventListener('pointermove',event=>{
  if(!panelDrag||panelDrag.id!==event.pointerId)return;
  const state=panelDrag;
  placePanel(state.panel,state.left+event.clientX-state.fromX,state.top+event.clientY-state.fromY);
  event.preventDefault();
 });
 function finishPanelDrag(event){
  if(!panelDrag||panelDrag.id!==event.pointerId)return;
  panelDrag.panel.classList.remove('is-dragging');panelDrag=null;saveLayout();
 }
 for(const type of ['pointerup','pointercancel','lostpointercapture'])ui.addEventListener(type,finishPanelDrag);
 ui.addEventListener('keydown',event=>{
  const grip=event.target.closest('.bb-grip');
  if(!grip||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
  const panel=grip.closest('[data-bb-panel]'),rect=panel.getBoundingClientRect(),n=event.shiftKey?32:12;
  const dx=event.key==='ArrowLeft'?-n:event.key==='ArrowRight'?n:0;
  const dy=event.key==='ArrowUp'?-n:event.key==='ArrowDown'?n:0;
  placePanel(panel,rect.left+dx,rect.top+dy);saveLayout();event.preventDefault();
 });

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
  const seconds=$('bbStepSeconds');
  if(seconds&&document.activeElement!==seconds){
   seconds.value=String(Number(state.stepSeconds)||0);
   seconds.min=state.idx===0?'0':'0.5';
   seconds.disabled=!!state.playing||state.preview!==null;
  }
  const label=ui.querySelector('label[for="bbStepSeconds"]');
  if(label)label.textContent=state.idx===0?'Setup hold (s)':'Travel time into step (s)';
  const deletion=btn('delete-step');
  if(deletion)deletion.disabled=state.total<=1||$('deleteStep')?.disabled===true;
  for(const [action,id] of [['pan','panMode'],['grid','grid'],['paths','trails'],['markings','markups']]){
   const control=ui.querySelector('[data-bb="'+action+'"]'),original=$(id);
   if(control&&original){const pressed=original.getAttribute('aria-pressed')==='true'||original.classList.contains('selected');
    control.setAttribute('aria-pressed',String(pressed));control.classList.toggle('is-active',pressed)}
  }
  // The follow setting belongs to Studio's original camera, not a Blackboard copy.
  // Manual pan/zoom/fit in Studio switches it off; always reflect that here.
  const follow=btn('follow'),originalFollow=$('followAction');
  if(follow&&originalFollow){
   const enabled=originalFollow.checked===true;
   follow.setAttribute('aria-pressed',String(enabled));
   follow.classList.toggle('is-active',enabled);
  }
  const target=$('bbFollowTarget');
  if(target){
   if(document.activeElement!==target)target.value=state.followTarget||'action';
   const selectedOption=target.querySelector('option[value="selected"]');
   if(selectedOption)selectedOption.disabled=!state.selection||!['attacker','defender','neutral','coach','ball'].includes(state.selection.type);
   const ballOption=target.querySelector('option[value="ball"]');
   if(ballOption)ballOption.disabled=!(state.frames||[]).some(fr=>(fr.objects||[]).some(o=>o.type==='ball'));
  }
  const ghost=$('bbGhostMode');
  if(ghost&&document.activeElement!==ghost)ghost.value=state.ghostMode||'off';
  const spot=btn('spotlight');if(spot){
   spot.setAttribute('aria-pressed',String(!!state.spotlight));spot.classList.toggle('is-active',!!state.spotlight);
   spot.disabled=!state.spotlight&&!state.selection;
  }
  const loop=btn('loop');if(loop){loop.disabled=state.total<2;loop.setAttribute('aria-pressed',String(!!state.loop));loop.classList.toggle('is-active',!!state.loop)}
  const replay=btn('replay');if(replay)replay.disabled=state.total<2;
  const speed=$('bbSpeed');if(speed&&document.activeElement!==speed)speed.value=String(state.speed||1);
  const branch=state.branching;
  $('bbDecisionShortcut').hidden=!branch;
  $('bbDecisionBar').hidden=!branch;
  if(branch){
   $('bbDecisionQuestion').textContent='◆ '+branch.question;
   for(const choice of ['a','b']){
    const b=ui.querySelector('[data-bb-choice="'+choice+'"]');
    const info=branch.choices?.find(c=>c.id===choice);
    if(b){b.textContent=choice.toUpperCase()+' · '+(info?.label||'Option '+choice.toUpperCase());b.setAttribute('aria-pressed',String(branch.active===choice));b.classList.toggle('is-active',branch.active===choice)}
   }
  }
  if(timelineOpen){
   const moments=keyMoments({frames:state.frames,branching:branch});
   const stamp=moments.map(m=>m.index+':'+m.kind+':'+m.title).join('|');
   if(stamp!==momentSignature){
    momentSignature=stamp;
    const visible=moments.filter(m=>m.kind!=='setup'||moments.length>2);
    $('bbKeyMoments').hidden=visible.length<2;
    $('bbMomentCount').textContent=visible.length+' events';
    $('bbMomentChips').innerHTML=visible.map(m=>'<button type="button" data-bb-moment="'+m.index+'" title="'+escapeText(m.title)+'">'+(m.index+1)+' · '+escapeText(m.label)+'</button>').join('');
   }
  }
  for(const chip of ui.querySelectorAll('[data-bb-moment]'))chip.classList.toggle('is-active',Number(chip.dataset.bbMoment)===state.idx);
  const tracks=btn('tracks');if(tracks)tracks.setAttribute('aria-expanded',String($('toggleTracks')?.getAttribute('aria-expanded')==='true'));
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
  const ruckus=btn('ruckus');
  ruckus.classList.toggle('is-active',!!state.cartoonMode);
  ruckus.setAttribute('aria-pressed',String(!!state.cartoonMode));
  ruckus.title=state.cartoonMode?'Switch to Classic view':'Switch to Ruckus cartoon view';
  btn('run')?.classList.toggle('is-active',state.routeDrawing);
  btn('undo').disabled=$('undoEdit')?.disabled??true;
  btn('redo').disabled=$('redoEdit')?.disabled??true;
  const routeButton=btn('run');
  if(routeButton)routeButton.title=state.routeDrawing?'Finish drawing this route':'Draw the selected player’s route';
 }
 function showDetails(open,tab='object'){
  drawer=!!open;document.body.classList.toggle('blackboard-details-open',drawer);
  $('bbCloseDetails').hidden=!drawer;
  btn('details')?.classList.toggle('is-active',drawer);
  if(drawer){
   if(tab==='step')openStepDetails?.();
   else openDetails();
   hint('The original Studio inspector is open; edits stay in the same drill.');
  }
  // Closing the inspector must not unexpectedly reset the user's camera.
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
   case 'actions':setPen(false);openObjectActions?.();break;
   case 'details':showDetails(!drawer);break;
   case 'close-details':showDetails(false);break;
   case 'turn-left':rotate(-15);break;
   case 'turn-right':rotate(15);break;
   case 'prev':click('back');break;
   case 'next':click('forward');break;
   case 'new-step':click('addStep');break;
   case 'delete-step':if(!click('deleteStep'))hint('This step cannot be deleted.');break;
   case 'timeline':openTimeline(!timelineOpen);break;
   case 'close-timeline':openTimeline(false);break;
   case 'tracks':click('toggleTracks');break;
   case 'replay':onCoachTool('replay',true);break;
   case 'loop':onCoachTool('loop',!state.loop);sync();break;
   case 'decision':case 'compare-decision':click('compareOutcomes');break;
   case 'edit-decision':click('editOutcomes');break;
   case 'save-layout':saveLayout();hint('Saved '+layoutPreset+' panel layout on this device.');break;
   case 'edit-step':showDetails(true,'step');break;
   case 'play':setPen(false);click('play');break;
   case 'undo':click('undoEdit');break;
   case 'redo':click('redoEdit');break;
   case 'fit':click('zoomFit');break;
   case 'fit-drill':click('zoomArea');break;
   case 'fit-action':click('zoomAction');break;
   case 'zoom-in':click('zoomIn');break;
   case 'zoom-out':click('zoomOut');break;
   case 'pan':setPen(false);click('panMode');break;
   case 'follow':if(!click('followAction'))hint('Follow action is unavailable in this view.');else sync();break;
   case 'grid':click('grid');break;
   case 'paths':click('trails');break;
   case 'markings':click('markups');break;
   case 'rotate-view':click('orientation');break;
   case 'camera':openCamera(!cameraOpen);break;
   case 'close-camera':openCamera(false);break;
   case 'reset-panels':resetPanels();break;
   case 'spotlight':if(!onCoachTool('spotlight',!state.spotlight))hint('Select a player or group to spotlight.');break;
   case 'ruckus':click('minionMode');break;
   case 'fullscreen':fullscreen();break;
   case 'save':if(!click('save'))hint('Saving requires a connected GitHub account. Exit to Studio to connect or export a drill file.');break;
   case 'ink-undo':{const last=marks.pop();last?.remove();hint(marks.length+' temporary marks remain.');break}
   case 'ink-clear':marks.splice(0).forEach(p=>p.remove());hint('Temporary ink cleared.');break;
  }
  // Camera controls change Studio's follow checkbox synchronously. Update
  // Blackboard's pressed indicators on this same click, not one animation
  // frame later (important for keyboard/touch feedback as well).
  if(['pan','fit','fit-drill','fit-action','zoom-in','zoom-out'].includes(action))sync();
  requestAnimationFrame(sync);
 }
 $('bbLayoutPreset').addEventListener('change',event=>{saveLayout();useLayout(event.target.value);hint('Switched to '+layoutPreset+' layout.');});
 $('bbFollowTarget').addEventListener('change',event=>{
  if(!onCoachTool('follow-target',event.target.value))event.target.value=getState().followTarget||'action';
  requestAnimationFrame(sync);
 });
 $('bbGhostMode').addEventListener('change',event=>{
  if(!onCoachTool('ghost',event.target.value))event.target.value=getState().ghostMode||'off';
  requestAnimationFrame(sync);
 });
 $('bbSpeed').addEventListener('change',event=>{
  const value=Number(event.target.value),source=$('speed');
  if(!source||![.25,.5,1,2].includes(value))return;
  source.value=String(value);
  source.dispatchEvent(new Event('change',{bubbles:true}));
  hint('Playback speed '+value+'× · timings in the saved drill stay unchanged.');
 });
 $('bbStepSeconds').addEventListener('change',()=>{
  const edit=$('stepTime'),value=Number($('bbStepSeconds').value);
  const current=getState();
  if(!edit||!Number.isFinite(value)||(current.idx>0&&value<.5)||value<0||value>30){
   hint('Enter '+(current.idx?'0.5–30':'0–30')+' seconds for this step.');sync();return;
  }
  if(current.preview!==null||current.playing){
   hint('Choose a step to return to editing before changing its duration.');sync();return;
  }
  edit.value=String(value);
  edit.dispatchEvent(new Event('change',{bubbles:true}));
  hint('Step '+(current.idx+1)+' timing changed to '+value.toFixed(1)+' seconds. The original timeline has updated.');
  requestAnimationFrame(sync);
 });
 ui.addEventListener('click',event=>{
  const moment=event.target.closest('[data-bb-moment]');
  if(moment){const step=Number(moment.dataset.bbMoment);const original=$('scenes')?.querySelector('[data-step="'+step+'"]');original?.click();requestAnimationFrame(sync);return}
  const option=event.target.closest('[data-bb-choice]');
  if(option){
   const choice=option.dataset.bbChoice;
   if(['a','b'].includes(choice))click('outcome'+choice.toUpperCase());
   requestAnimationFrame(sync);return;
  }
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
  openTimeline(false);openCamera(false);
  useLayout(layoutPreset);
  fit?.();sync();
  hint('Tap and drag a player. Draw a run or pass using the left toolbar. B or Esc returns to Studio.');
  launch.setAttribute('aria-pressed','true');
 }
 function close(){
  if(!active)return;
  if(drag)drag=null;
  if(panelDrag){panelDrag.panel.classList.remove('is-dragging');panelDrag=null}
  saveLayout();
  onCoachTool('reset-ephemeral',true);
  setPen(false);showDetails(false);openTimeline(false);openCamera(false);
  restoreTimeline();
  active=false;ui.hidden=true;document.body.classList.remove('blackboard-mode');
  launch.setAttribute('aria-pressed','false');
  if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});
  fit?.();
  launch.focus({preventScroll:true});
 }
 launch.addEventListener('click',open);
 if(new URLSearchParams(location.search).get('blackboard')==='1')requestAnimationFrame(open);
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
