import { $, clone, esc, clamp, uid, types, shape, obj, sample, blank } from './model.js';
import { RESOURCES, EMPHASIS } from './resources.js';
import { initWorkspace, openInspector } from './workspace.js?v=0.3.1';
import { pitchGeometry, trainingField } from './pitch.js?v=0.4.2';
import { placePoint, gridStep, loadGridPrefs, saveGridPrefs } from './grid.js?v=0.4.2';
import { wrapAngle, shortestTurn, rotationFromPointer, rotationHandle } from './rotation.js?v=0.3.3';
import { removeObject, isEditingKeyTarget } from './object-edit.js?v=0.3.3';
import { cleanRoute, sanitizeRoutes, routeSamples, routeSVG, sampleRoute, waypointOverlay, routeInsertion, insertionHandles } from './routes.js?v=0.4.3';
import { createHistory } from './history.js?v=0.4.0';
import { canCarry, carrier, carriedPose, syncPossession, frameObjects, movementFor, transitionObjects, contactTarget, assignPossession } from './possession.js?v=0.4.6-1';
initWorkspace();
const SEEDS = await fetch(new URL('../data/drills.json?v=0.4.1', import.meta.url)).then(r => {
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}).then(data => {
  if (data.version !== 1 || !Array.isArray(data.drills) || !data.drills.length) throw new Error('Invalid drill catalogue');
  return data.drills;
}).catch(err => {
  const msg = document.createElement('p'); msg.setAttribute('role','alert'); msg.textContent = 'Could not load the drill library: ' + err.message; msg.style.padding = '16px'; document.body.prepend(msg); throw err;
});
const MAIN_SAMPLE=SEEDS.find(x=>x.title==='2 vs 1 · Draw and pass');MAIN_SAMPLE.frames=sample().frames;MAIN_SAMPLE.frames.forEach((fr,i)=>{fr.objects.find(o=>o.id==='b1').ownerId=i<2?'a1':'a2'});const CATEGORIES=['Attack','Defence','Handling','Contact','Breakdown','Set piece','Movement','Game'];const fields=['players','equipment','instructions','coaching','regression','progression','questions','notes'];function enrich(d){d.ageMin=Number.isInteger(d.ageMin)?clamp(d.ageMin,6,16):d.age==='U9'?9:d.age==='U10'?10:d.age==='U11–U12'?11:d.age==='U13–U14'?13:d.age==='U15–U16'?15:6;d.ageMax=Number.isInteger(d.ageMax)?clamp(d.ageMax,d.ageMin,16):d.age==='U6–U8'?8:d.age==='U9'?9:d.age==='U10'?10:d.age==='U11–U12'?12:d.age==='U13–U14'?14:16;d.minutes=clamp(Number(d.minutes)||8,1,120);for(let k of fields)d[k]=String(d[k]??'');d.links=Array.isArray(d.links)?d.links.filter(x=>x&&safeURL(x.url)).slice(0,100).map(x=>({label:String(x.label||x.url).slice(0,200),url:safeURL(x.url),kind:String(x.kind||'Reference').slice(0,80)})):[];d.provenance=String(d.provenance||'Coach-created / imported drill');d.review=String(d.review||'Coach review required');return d}function safeURL(u){try{let v=new URL(u);return ['https:','http:'].includes(v.protocol)?v.href:null}catch{return null}}function freshSeed(s){let d=clone(s);d.id=uid();d.age='Custom range';return enrich(d)}
const history=createHistory();let routeDrawing=false,routeClickCount=0,ballPicking=null,ballChoiceId=null,showPasses=true;
let autoAttach=true;try{autoAttach=localStorage.getItem('rugby-auto-attach')!=='off'}catch{}
const gridPrefs=loadGridPrefs();
let drill=freshSeed(MAIN_SAMPLE),idx=0,selected=null,showPaths=true,showGrid=gridPrefs.visible,orientation='up',playing=false,preview=null,clock=0,raf=0,drag=null,dirty=false;const pitch=$('pitch'),f=()=>drill.frames[idx],duration=()=>drill.frames.reduce((s,f,i)=>s+(i?f.seconds:0),0),at=i=>drill.frames.slice(1,i+1).reduce((a,x)=>a+x.seconds,0);function note(s){$('status').textContent=s;$('status').title=s}function changed(record=true){syncPossession(drill.frames,geometry());dirty=true;$('save').textContent='Save drill •';if(record){history.record(drill);historyButtons()}}function stop(){playing=false;cancelAnimationFrame(raf);$('play').textContent='▶ Play'}function locate(t){let acc=0;for(let i=1;i<drill.frames.length;i++){const end=acc+drill.frames[i].seconds;if(t<end)return {i,p:(t-acc)/(end-acc)};acc=end}return {i:drill.frames.length-1,p:1}}function tween(t){const g=geometry();if(!drill.frames.length||t<=0)return frameObjects(drill.frames[0],g);const {i,p}=locate(t);return i?transitionObjects(drill.frames[i-1],drill.frames[i],p,g):frameObjects(drill.frames[0],g)}
const geometry=()=>pitchGeometry(drill.length,drill.width,orientation);
const placement=(p,free=false)=>placePoint(p,geometry(),gridPrefs.snap&&!free,gridPrefs.step);
function syncGrid(){for(const [id,on] of [['grid',showGrid],['snapGrid',gridPrefs.snap]]){$(id).classList.toggle('selected',on);$(id).setAttribute('aria-pressed',String(on))}$('gridStep').value=String(gridPrefs.step);gridPrefs.visible=showGrid;saveGridPrefs(gridPrefs)}
function render(){
 const g=geometry(),objects=preview===null?frameObjects(f(),g):tween(preview);
 pitch.setAttribute('viewBox',`0 0 ${g.viewWidth} ${g.viewHeight}`);
 pitch.setAttribute('preserveAspectRatio','xMidYMid meet');
 let lines='',pathHits='';
 const lineIndex=preview===null?idx:locate(preview).i;
 if(lineIndex>0){
  const next=drill.frames[lineIndex],old=drill.frames[lineIndex-1];
  for(const o of next.objects){
   if(!(o.type==='ball'?showPasses:showPaths||routeDrawing&&preview===null)||preview!==null&&o.type!=='ball')continue;
   const move=movementFor(old,next,o,g),route=next.paths?.[o.id];
   if(move&&hasMovement(move.start,move.end,route)){
    const d=routeSVG(routeSamples(move.start,move.end,route,g)),sel=o.id===selected&&preview===null;
    lines+=`<path d="${d}" fill="none" stroke="${o.type==='ball'?'#ffe994':types[o.type][1]}" stroke-width="${sel?4:3}" ${o.type==='ball'?'stroke-dasharray="7 6"':''} marker-end="url(#arr)" opacity="${sel?1:.8}"/>`;
    if(preview===null)pathHits+=`<path d="${d}" data-path-id="${esc(o.id)}" data-editor-only="true" class="path-hit" fill="none" stroke="transparent" stroke-width="18" pointer-events="stroke"><title>Click to select path; drag selected path to bend</title></path>`;
   }
  }
 }
 const active=preview===null?objects.find(o=>o.id===selected):null;
 const raw=active&&f().objects.find(o=>o.id===active.id),move=raw&&movementFor(drill.frames[idx-1],f(),raw,g),route=active&&f().paths?.[active.id];
 const pathVisible=active?.type==='ball'?showPasses:showPaths;
 const magnet=preview===null&&drag?.contact?objects.find(o=>o.id===drag.contact.playerId):null;
 const magnetOverlay=magnet?(()=>{const p=g.toView(magnet.x,magnet.y);return `<g data-editor-only="true" pointer-events="none"><circle cx="${p.x}" cy="${p.y}" r="32" stroke="#d6f77b" stroke-width="3" stroke-dasharray="5 3" fill="#d6f77b" fill-opacity=".12"/><text x="${p.x}" y="${p.y-40}" fill="#e6ffac" font-size="13" text-anchor="middle" paint-order="stroke" stroke="#20372b" stroke-width="3">Release to attach</text></g>`})():'';
 const handles=pathVisible&&!routeDrawing&&move&&hasMovement(move.start,move.end,route)?insertionHandles(move.start,move.end,route,g):'';
 pitch.innerHTML=trainingField(g,showGrid,gridPrefs.step)+lines+pathHits+[...objects.filter(o=>o.type!=='ball'),...objects.filter(o=>o.type==='ball')].map(o=>{
  const sel=selected===o.id&&preview===null,p=g.toView(o.x,o.y);
  return `<g class="obj" data-id="${esc(o.id)}" transform="translate(${p.x} ${p.y})"><circle r="${o.type==='ball'?14:24}" fill="transparent"/>${sel?'<circle data-editor-only="true" r="25" stroke="#d6f77b" stroke-width="2" stroke-dasharray="4 3" fill="none" pointer-events="none"/>':''}<g transform="rotate(${o.rot+g.rotation})">${shape(o.type)}</g>${o.label?`<text y="${o.type==='label'?22:34}" text-anchor="middle" fill="#fff" paint-order="stroke" stroke="#234f38" stroke-width="3" font-size="13" font-weight="600">${esc(o.label)}</text>`:''}</g>`;
 }).join('')+(active&&!routeDrawing&&!ballPicking&&!(active.type==='ball'&&active.ownerId)?rotationHandle(g.toView(active.x,active.y),active.rot,g.rotation):'')+(pathVisible&&!routeDrawing&&!ballPicking?handles:'')+(active&&move&&!ballPicking&&(pathVisible||routeDrawing)?waypointOverlay(f().paths?.[active.id],g):'')+magnetOverlay;
 updateSelectionTools(active);updateRouteTools();updateBallTools();$('editCurrent').hidden=preview===null;
 $('sceneLabel').textContent=preview===null?`Step ${idx+1} of ${drill.frames.length} · ${f().name}`:drill.frames[locate(preview).i].name;$('narration').textContent=preview===null?f().notes:(drill.frames[locate(preview).i]?.notes||'');$('narration').title=$('narration').textContent;$('timeLabel').textContent=`${(preview??at(idx)).toFixed(1)} / ${duration().toFixed(1)} s`;$('scrub').max=Math.max(.01,duration());$('scrub').value=preview??at(idx)}
function inspector(){let o=f().objects.find(x=>x.id===selected);let disabled=preview!==null?'disabled':'';if(!o){$('objectPanel').innerHTML='<small>Select an object on the pitch to edit its label, rotation and timing.</small>';return}let t=f().timing?.[o.id]||{start:0,end:100};$('objectPanel').innerHTML=`<div class="field"><label>Object: ${esc(types[o.type][0])}</label><input id="objLabel" value="${esc(o.label)}" ${disabled}></div><div class="field"><label>Rotation (degrees)</label><input id="objRot" type="number" min="-360" max="360" value="${o.rot}" ${disabled}><div class="facing-buttons" aria-label="Quick facing directions">${[["↑",0,"up"],["→",90,"right"],["↓",180,"down"],["←",270,"left"]].map(([symbol,a,word])=>`<button type="button" data-facing="${a}" title="Face ${word} on screen" aria-label="Face ${word} on screen" ${disabled}>${symbol}</button>`).join("")}</div><small>Drag the green handle on the pitch to rotate. Hold Shift for 15° steps. Degrees are relative to the pitch.</small></div>${idx>0?`<div class="pair"><div class="field"><label>Start (%)</label><input id="start" type="number" min="0" max="99" value="${t.start}" ${disabled}></div><div class="field"><label>End (%)</label><input id="end" type="number" min="1" max="100" value="${t.end}" ${disabled}></div></div><small>Timing is relative to the transition into this step.</small>`:''}<div class="flex" style="margin-top:9px"><button id="copyObj" ${disabled}>Duplicate</button><button id="delObj" class="danger-action" ${disabled}>Delete object</button></div>`;$('objLabel').oninput=e=>{o.label=e.target.value;changed();render()};$('objRot').onchange=e=>{o.rot=clamp(Number(e.target.value)||0,-360,360);$('objRot').value=o.rot;changed();render();tracks()};for(const button of $('objectPanel').querySelectorAll('[data-facing]'))button.onclick=()=>{o.rot=wrapAngle(Number(button.dataset.facing)-geometry().rotation);$('objRot').value=o.rot;changed();render();tracks()};if(idx>0){function timing(){let s=clamp(Number($('start').value)||0,0,99),e=clamp(Number($('end').value)||1,s+1,100);f().timing[o.id]={start:s,end:e};changed();render();inspector();tracks()}$('start').onchange=timing;$('end').onchange=timing}$('copyObj').onclick=duplicateSelected;$('delObj').onclick=()=>deleteObject('here')}function tracks(){if(!idx){$('tracks').innerHTML='<div style="padding:10px" class="muted">Select a later step to configure independent movement tracks.</div>';return}let old=drill.frames[idx-1];let moving=f().objects.filter(o=>{let a=old.objects.find(x=>x.id===o.id);const m=movementFor(old,f(),o,geometry());return m&&(hasMovement(m.start,m.end,f().paths?.[o.id])||a.rot!==o.rot||a.ownerId!==o.ownerId)});$('tracks').innerHTML=moving.length?moving.map(o=>{let t=f().timing[o.id]||{start:0,end:100};return `<div class="track"><button class="track-name" data-track="${esc(o.id)}" title="Edit movement timing">${esc(o.type==='ball'&&carrier(old,old.objects.find(x=>x.id===o.id))&&carrier(f(),o)&&old.objects.find(x=>x.id===o.id)?.ownerId!==o.ownerId?'Pass → '+(carrier(f(),o).label||'receiver'):o.label||types[o.type][0])}</button><div class="trackbar"><div class="span" style="left:${t.start}%;width:${t.end-t.start}%;background:${types[o.type][1]}">${t.start}–${t.end}%</div></div></div>`}).join(''):'<div style="padding:10px" class="muted">No movement from the previous step. Drag an existing object to a new position.</div>'}$('tracks').addEventListener('click',e=>{const b=e.target.closest('[data-track]');if(!b)return;editMode();selected=b.dataset.track;render();inspector();openInspector('Object')});function refresh(){closeObjectMenu();const fr=f();$('stageTitle').textContent=drill.title+' · '+(drill.ageMin===drill.ageMax?'U'+drill.ageMin:'U'+drill.ageMin+'–U'+drill.ageMax);for(let k of ['title','age','category','length','width','objective','safety'])$(k).value=drill[k];$('stepName').value=fr.name;$('stepTime').value=idx?fr.seconds:0;$('stepTime').disabled=!idx;$('stepNotes').value=fr.notes;$('scenes').innerHTML=drill.frames.map((x,i)=>`<button class="scene ${i===idx?'selected':''}" data-step="${i}"><b>${String(i+1).padStart(2,'0')} · ${esc(x.name)}</b><span>${at(i).toFixed(1)} s · ${x.objects.length} objects</span></button>`).join('');$('deleteStep').disabled=drill.frames.length===1;$('back').disabled=idx===0;$('forward').disabled=idx===drill.frames.length-1;$('save').textContent=dirty?'Save drill •':'Save drill';render();inspector();tracks()}function choose(i){stop();ballPicking=null;routeDrawing=false;routeClickCount=0;preview=null;idx=clamp(i,0,drill.frames.length-1);if(!f().objects.some(o=>o.id===selected))selected=null;refresh();note(f().notes||'Edit positions on the pitch.')};function editMode(){if(preview!==null){stop();preview=null;refresh()}}function add(type){editMode();ballPicking=null;routeDrawing=false;const count=f().objects.filter(x=>x.type===type).length;let label=['attacker','defender','neutral'].includes(type)?({attacker:'A',defender:'D',neutral:'P'}[type]+(count+1)):['ball','cone','flag','bag','sausage','ladder'].includes(type)?'':types[type][0];let n=obj(uid(),type,label,450+((count%4)-1)*34,280+Math.floor(count/4)*28);Object.assign(n,placement(n));f().objects.push(n);selected=n.id;changed();refresh();openInspector('Object',false)};let groups=[['Players',['attacker','defender','neutral','coach','shield','bagplayer']],['Equipment',['ball','cone','flag','bag','sausage','ladder']],['Contact & markers',['tackle','ruck','maul','scrum','label']]];$('palette').innerHTML=groups.map(([name,ts])=>`<div class="group"><h3>${name}</h3><div class="palette">${ts.map(t=>`<button data-type="${t}"><svg viewBox="-32 -32 64 64" aria-hidden="true">${shape(t)}</svg>${esc(types[t][0])}</button>`).join('')}</div></div>`).join('');$('palette').onclick=e=>{let b=e.target.closest('[data-type]');if(b)add(b.dataset.type)};

function canEditObjects(){return !routeDrawing&&!ballPicking&&preview===null&&!playing&&!drag&&!document.body.classList.contains('presentation-mode')&&!document.querySelector('dialog[open]')}
function activeObject(){return f().objects.find(o=>o.id===selected)}
function focusPitch(){pitch.focus({preventScroll:true})}
function updateSelectionTools(o){
 $('selectionLabel').textContent=o?(o.label||types[o.type][0]):'No selection';
 $('drawRouteSide').disabled=!o||!!ballPicking||!!(o.type==='ball'&&o.ownerId&&!selectedMovement());
 $('drawRouteSideLabel').textContent=routeDrawing?'Finish path':'Draw path';
 $('drawRouteSide').classList.toggle('selected',routeDrawing);$('drawRouteSide').setAttribute('aria-pressed',String(routeDrawing));
}
function rotateSelected(delta){
 if(!canEditObjects())return;
 const o=activeObject();if(!o)return;
 o.rot=wrapAngle(o.rot+delta);changed();render();inspector();tracks();focusPitch();
}
function duplicateSelected(){
 if(!canEditObjects())return;
 const o=activeObject();if(!o)return;
 const n={...o,id:uid(),x:clamp(o.x+35,30,870),y:clamp(o.y+35,25,515),label:o.label?o.label+' copy':''};delete n.ownerId;
 Object.assign(n,placement(n));f().objects.push(n);selected=n.id;changed();refresh();openInspector('Object',false);focusPitch();note('Object duplicated in this step.');
}
function deleteObject(scope='here'){
 if(!canEditObjects())return;
 const o=activeObject();if(!o)return;
 const name=o.label||types[o.type][0],result=removeObject(drill.frames,o.id,idx,scope);
 if(!result.removed)return;
 if(scope!=='here'&&result.removed>1&&!confirm('Delete '+name+' from '+result.removed+' steps?'))return;
 drill.frames=sanitizeRoutes(result.frames);selected=null;changed();refresh();focusPitch();
 note(name+' deleted from '+(result.removed===1?'one step':result.removed+' steps')+'.');
}
function closeObjectMenu(){const menu=$('objectMenu');if(menu)menu.hidden=true}
function openObjectMenu(e){
 if(!canEditObjects())return;
 const group=e.target.closest('[data-id]'),handle=e.target.closest('[data-rotate]');
 if(!group&&!handle)return;
 if(group)selected=group.dataset.id;
 const o=activeObject();if(!o)return;
 e.preventDefault();render();inspector();openInspector('Object',false);$('menuAddPoint').disabled=!canInsertPoint();$('menuBall').disabled=!chosenBall();$('menuRelease').disabled=!carrier(f(),chosenBall());
 const menu=$('objectMenu');$('objectMenuLabel').textContent=o.label||types[o.type][0];
 menu.hidden=false;
 menu.style.left='0px';menu.style.top='0px';
 const r=menu.getBoundingClientRect(),pad=8;
 menu.style.left=Math.max(pad,Math.min(e.clientX,window.innerWidth-r.width-pad))+'px';
 menu.style.top=Math.max(pad,Math.min(e.clientY,window.innerHeight-r.height-pad))+'px';
 menu.querySelector('button').focus({preventScroll:true});
}
pitch.addEventListener('contextmenu',openObjectMenu);
$('objectMenu').addEventListener('click',e=>{
 const b=e.target.closest('[data-object-command]');if(!b)return;
 const command=b.dataset.objectCommand;closeObjectMenu();focusPitch();
 if(command==='left')rotateSelected(-15);else if(command==='right')rotateSelected(15);else if(command==='duplicate')duplicateSelected();else if(command==='route')toggleRoute();else if(command==='point')insertPathPoint();else if(command==='ball')beginBallPick();else if(command==='release')releaseBall();else deleteObject(command);
});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#objectMenu'))closeObjectMenu()},{capture:true});
window.addEventListener('resize',closeObjectMenu);
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&ballPicking){ballPicking=null;render();note('Ball selection cancelled.');e.preventDefault();return}
 if(e.key==='Escape'&&routeDrawing){finishRoute();e.preventDefault();return}
 if(e.key==='Escape'&&!$('objectMenu').hidden){closeObjectMenu();focusPitch();e.preventDefault();return}
 if(e.key!=='Delete'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||isEditingKeyTarget(e.target)||!canEditObjects()||!activeObject())return;
 e.preventDefault();closeObjectMenu();deleteObject('here');
});


function historyButtons(){
 $('undoEdit').disabled=!history.canUndo;$('redoEdit').disabled=!history.canRedo;
}
function resetHistory(){sanitizeRoutes(drill.frames);syncPossession(drill.frames,geometry());history.reset(drill);historyButtons()}
function restoreHistory(direction){
 if(drag||document.querySelector('dialog[open]')||document.body.classList.contains('presentation-mode'))return;
 const value=history[direction]();if(!value)return;
 drill=value;dirty=true;selected=null;choose(Math.min(idx,drill.frames.length-1));historyButtons();note(direction==='undo'?'Undid last change.':'Redid last change.');
}
$('undoEdit').onclick=()=>restoreHistory('undo');$('redoEdit').onclick=()=>restoreHistory('redo');
document.addEventListener('keydown',e=>{
 if(!(e.ctrlKey||e.metaKey)||e.altKey||isEditingKeyTarget(e.target)||document.querySelector('dialog[open]'))return;
 const k=e.key.toLowerCase();
 if(k==='z'||k==='y'){e.preventDefault();restoreHistory(k==='y'||e.shiftKey?'redo':'undo')}
});
function previousObject(){return idx>0?drill.frames[idx-1].objects.find(o=>o.id===selected):null}
function selectedMovement(){const o=activeObject();return o&&movementFor(drill.frames[idx-1],f(),o,geometry())}
function ensureRoute(){
 if(!f().paths)f().paths=Object.create(null);
 if(!Object.hasOwn(f().paths,selected))Object.defineProperty(f().paths,selected,{value:{mode:'smooth',points:[],follow:false},enumerable:true,writable:true,configurable:true});
 return f().paths[selected];
}
function hasMovement(a,b,r){return !!(a&&b&&(Math.hypot(a.x-b.x,a.y-b.y)>1e-6||r?.points?.length))}
function canInsertPoint(){const o=preview===null?activeObject():null,r=o&&f().paths?.[o.id];const m=selectedMovement();return !routeDrawing&&!ballPicking&&!!o&&!!m&&hasMovement(m.start,m.end,r)&&(r?.points?.length||0)<64}
function updateRouteTools(){
 const o=preview===null?activeObject():null,route=o&&f().paths?.[o.id],m=o&&selectedMovement(),existing=!!(m&&(hasMovement(m.start,m.end,route)||route));
 $('routeTools').hidden=!(routeDrawing||existing);
 $('addPointSide').disabled=!canInsertPoint();
 $('actionHint').textContent=routeDrawing?'Click route points, then Finish path.':ballPicking?'Choose a player on the pitch.':$('drawRouteSide').disabled?'Select a player or a free/pass ball.':canInsertPoint()?'Drag a + on the line to curve it.':'Draw a route or move into a new step.';
 $('routeStyle').value=route?.mode||'smooth';$('followRoute').checked=!!route?.follow;$('followRoute').disabled=o?.type==='ball';
 $('clearRoute').disabled=!route?.points?.length;$('removeWaypoint').disabled=!route?.points?.length;
 $('routeHelp').textContent=routeDrawing?'Click route points, then Finish path in Actions.':'Drag a + on the line or numbered points. Alt-click removes a point.';
 pitch.classList.toggle('drawing-route',routeDrawing);
}
function insertPathPoint(pointer=null,interval=null,event=null){
 if(!canInsertPoint())return false;
 const {start,end}=selectedMovement(),g=geometry(),r=ensureRoute();
 let insertion=routeInsertion(start,end,r,g,pointer);
 if(!insertion)return false;
 if(interval!==null){const all=routeSamples(start,end,r,g),n=r.mode==='smooth'&&r.points.length?20:1;const mid=sampleRoute(all.slice(interval*n,(interval+1)*n+1),.5).point;if(!mid)return false;insertion={index:interval,point:g.fromView(mid.x,mid.y)}}
 r.points.splice(insertion.index,0,insertion.point);if(activeObject().type==='ball'){showPasses=true;$('passTrails').classList.add('selected');$('passTrails').setAttribute('aria-pressed','true')}else{showPaths=true;$('trails').classList.add('selected')}
 if(event){drag={id:selected,kind:'waypoint',index:insertion.index,pointerId:event.pointerId,moved:true};pitch.setPointerCapture(event.pointerId);changed(false)}else{changed();tracks()}
 render();focusPitch();note('Path point added. Drag the numbered point to shape the route.');return true;
}
function toggleRoute(){
 if(routeDrawing){finishRoute();return}
 if(!canEditObjects()||!activeObject())return;
 if(activeObject().type==='ball'){showPasses=true;$('passTrails').classList.add('selected');$('passTrails').setAttribute('aria-pressed','true')}
 if(activeObject().type==='ball'&&activeObject().ownerId){if(!selectedMovement()){note('The ball follows its carrier. Create a pass or release it first.');return}routeDrawing=true;routeClickCount=0;render();focusPitch();note('Click intermediate points on the pass path, then Finish path. The receiver is the destination.');return}
 if(!previousObject()){
  if(drill.frames.length>=150){note('Maximum of 150 steps reached.');return}
  const n=clone(f());n.name='Step '+(idx+2);n.seconds=2;n.notes='';n.timing={};n.paths={};
  drill.frames.splice(idx+1,0,n);idx++;sanitizeRoutes(drill.frames);changed();refresh();
 }
 routeDrawing=true;routeClickCount=0;render();focusPitch();note('Click the pitch to draw the route, then Finish path. The final click is the destination.');
}
function finishRoute(){
 routeDrawing=false;routeClickCount=0;render();inspector();tracks();note('Path ready. Press Play or adjust the numbered waypoints.');
}
function addRoutePoint(e){
 const o=activeObject();if(!o||!previousObject())return;
 const p=point(e),q=placement(p,e.shiftKey);
 const route=ensureRoute();
 if(o.type==='ball'&&o.ownerId){if(routeClickCount===0)route.points=[];if(route.points.length>=64)return;route.points.push(q);routeClickCount++;changed();render();tracks();return}
 if(routeClickCount===0)route.points=[];
 else if(route.points.length<64)route.points.push({x:o.x,y:o.y});
 else {note('Maximum of 64 intermediate points. Finish this route.');return}
 o.x=q.x;o.y=q.y;routeClickCount++;changed();render();tracks();
}
$('drawRouteSide').onclick=toggleRoute;
$('addPointSide').onclick=()=>insertPathPoint();
$('routeStyle').onchange=()=>{if(!activeObject()||!previousObject())return;const r=ensureRoute();r.mode=$('routeStyle').value;changed();render();tracks()};
$('followRoute').onchange=()=>{if(!activeObject()||!previousObject())return;ensureRoute().follow=$('followRoute').checked;changed();render()};
$('clearRoute').onclick=()=>{if(!activeObject()||!previousObject())return;ensureRoute().points=[];changed();render();tracks();focusPitch()};
$('removeWaypoint').onclick=()=>{if(!activeObject()||!previousObject())return;ensureRoute().points.pop();changed();render();tracks();focusPitch()};
$('editCurrent').onclick=()=>{if(preview===null)return;let t=preview,best=0;for(let i=1;i<drill.frames.length;i++)if(Math.abs(at(i)-t)<Math.abs(at(best)-t))best=i;choose(best)};

function chosenBall(){
 const o=activeObject(),balls=f().objects.filter(x=>x.type==='ball');
 if(o?.type==='ball')return o;
 return balls.find(b=>b.ownerId===o?.id)||balls.find(b=>b.id===ballChoiceId)||balls[0]||null;
}
function updateBallTools(){
 const balls=f().objects.filter(o=>o.type==='ball'),b=chosenBall(),owner=carrier(f(),b),active=activeObject(),enabled=preview===null&&!routeDrawing;
 const options=balls.map((b,i)=>'<option value="'+esc(b.id)+'">'+esc(b.label||'Ball '+(i+1))+'</option>').join('');
 if($('ballChoice').innerHTML!==options)$('ballChoice').innerHTML=options;
 $('ballChoice').value=b?.id||'';$('ballChoice').disabled=!enabled||!b||!!ballPicking;$('ballChoice').hidden=balls.length<2;
 
 $('autoAttach').checked=autoAttach;$('autoAttach').disabled=!enabled||!!ballPicking;
 const text=ballPicking?'Click the receiving player (Esc to cancel).':owner?'Carried by '+(owner.label||types[owner.type][0]):b?autoAttach?'Free ball · drop onto a player':'Ball is free':'Add a rugby ball to begin.';
 $('ballSideStatus').textContent=text;
 
 $('attachBallSide').disabled=!enabled||!b||!!owner;$('passBallSide').disabled=!enabled||!b||!owner;
 $('attachBallSideLabel').textContent=ballPicking&&!owner?'Cancel':'Attach ball';$('passBallSideLabel').textContent=ballPicking&&owner?'Cancel':'Pass ball';
 $('attachBallSide').classList.toggle('selected',!!ballPicking&&!owner);$('passBallSide').classList.toggle('selected',!!ballPicking&&!!owner);
 $('releaseBallSide').disabled=!enabled||!owner||!!ballPicking;
 $('selectBallSide').disabled=!enabled||!!ballPicking;$('selectBallSideLabel').textContent=b?'Select ball':'Add ball';
 pitch.classList.toggle('picking-ball',!!ballPicking);
}
$('autoAttach').onchange=()=>{autoAttach=$('autoAttach').checked;try{localStorage.setItem('rugby-auto-attach',autoAttach?'on':'off')}catch{}render()};
$('ballChoice').onchange=()=>{ballPicking=null;ballChoiceId=$('ballChoice').value;selected=ballChoiceId;render();inspector();openInspector('Object',false)};
$('selectBallSide').onclick=()=>{if(!canEditObjects())return;const b=chosenBall();if(!b){add('ball');return}selected=ballChoiceId=b.id;render();inspector();openInspector('Object',false);focusPitch()};
function beginBallPick(){
 if(ballPicking){ballPicking=null;render();return}
 if(!canEditObjects())return;const b=chosenBall();if(!b)return;
 selected=ballChoiceId=b.id;ballPicking=b.id;render();inspector();focusPitch();note('Click a player to attach or pass the ball.');
}
function finishBallPick(targetId){
 const b=f().objects.find(o=>o.id===ballPicking),target=f().objects.find(o=>o.id===targetId);
 if(!b||!canCarry(target)){note('Choose a player on the pitch, or press Esc to cancel.');return}
 const from=carrier(f(),b);if(from?.id===targetId){ballPicking=null;render();return}
 ballPicking=null;
 // If the selected frame already contains a transfer, create a new step for the next pass.
 let ball=b;
 if(from&&(!idx||!drill.frames[idx-1].objects.some(o=>o.id===b.id&&o.ownerId===from.id))){
  if(drill.frames.length>=150){render();note('Maximum of 150 steps reached.');return}
  const n=clone(f());n.name='Pass to '+(target.label||'player');n.seconds=2;n.notes='';n.timing={};n.paths={};drill.frames.splice(idx+1,0,n);idx++;ball=n.objects.find(o=>o.id===b.id);sanitizeRoutes(drill.frames);
 }
 assignPossession(drill.frames,idx,ball.id,targetId,geometry());selected=ballChoiceId=ball.id;
 if(idx&&from){f().timing[ball.id]={start:35,end:70};if(f().paths)delete f().paths[ball.id]}
 showPasses=true;$('passTrails').classList.add('selected');$('passTrails').setAttribute('aria-pressed','true');
 changed();refresh();focusPitch();note(from?'Pass created. Adjust the ball timing in Object and bend its dashed path.':'Ball attached. It will follow this player when you add a step.');
}
function releaseBall(){
 if(!canEditObjects())return;const b=chosenBall(),p=carrier(f(),b);if(!p)return;
 assignPossession(drill.frames,idx,b.id,null,geometry());
 if(idx&&drill.frames[idx-1].objects.some(o=>o.id===b.id&&o.ownerId)){f().timing[b.id]={start:99,end:100};if(f().paths)delete f().paths[b.id]}
 selected=ballChoiceId=b.id;changed();refresh();focusPitch();note('Ball released at its current position. You can move it independently.');
}
$('attachBallSide').onclick=$('passBallSide').onclick=beginBallPick;
$('releaseBallSide').onclick=releaseBall;
$('passTrails').onclick=()=>{showPasses=!showPasses;$('passTrails').classList.toggle('selected',showPasses);$('passTrails').setAttribute('aria-pressed',String(showPasses));render()};
function viewPoint(e){
 const p=pitch.createSVGPoint();p.x=e.clientX;p.y=e.clientY;
 return p.matrixTransform(pitch.getScreenCTM().inverse());
}
function point(e){const q=viewPoint(e);return geometry().fromView(q.x,q.y)}
pitch.addEventListener('pointerdown',e=>{
 if(preview!==null||drag||e.button!==0||document.body.classList.contains('presentation-mode'))return;
 focusPitch();
 if(ballPicking){const target=e.target.closest('[data-id]');if(target)finishBallPick(target.dataset.id);e.preventDefault();return}
 if(routeDrawing){addRoutePoint(e);e.preventDefault();return}
 const plus=e.target.closest('[data-insert-point]');
 if(plus){insertPathPoint(viewPoint(e),Number(plus.dataset.insertPoint),e);e.preventDefault();return}
 const wp=e.target.closest('[data-waypoint]');
 if(wp&&activeObject()&&previousObject()){
  const i=Number(wp.dataset.waypoint),r=ensureRoute();if(!r.points[i])return;
  if(e.altKey){r.points.splice(i,1);changed();render();tracks();return}
  drag={id:selected,kind:'waypoint',index:i,pointerId:e.pointerId,moved:false};pitch.setPointerCapture(e.pointerId);e.preventDefault();return;
 }
 if(e.target.closest('[data-rotate]')){
  const o=f().objects.find(x=>x.id===selected);if(!o)return;
  drag={id:o.id,kind:'rotate',pointerId:e.pointerId,moved:false};
  pitch.setPointerCapture(e.pointerId);
  e.preventDefault();return;
 }
 const path=e.target.closest('[data-path-id]');
 if(path){const id=path.dataset.pathId;if(id!==selected){selected=id;render();inspector();openInspector('Object',false);note('Path selected. Drag the line or a + handle to bend it.')}else{insertPathPoint(viewPoint(e),null,e)}e.preventDefault();return}
 const g=e.target.closest('[data-id]');
 if(!g){selected=null;render();inspector();return}
 selected=g.dataset.id;
 const o=f().objects.find(x=>x.id===selected);if(!o)return;
 render();inspector();openInspector('Object',false);
 // Clicking a carried ball still selects it for passing; dragging it moves its carrier.
 const owner=o.type==='ball'?carrier(f(),o):null,moving=owner||o,p=point(e);
 drag={id:moving.id,kind:'move',pointerId:e.pointerId,dx:moving.x-p.x,dy:moving.y-p.y,moved:false,contact:null,origin:viewPoint(e),originalPosition:{x:moving.x,y:moving.y}};
 if(owner)note('Ball attached to '+(owner.label||'player')+' · drag to move both.');
 pitch.setPointerCapture(e.pointerId);
 e.preventDefault();
});
pitch.addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.pointerId)return;
 const o=f().objects.find(x=>x.id===drag.id);if(!o)return;
 if(drag.kind==='waypoint'){
  const q=point(e),p=ensureRoute().points[drag.index];if(!p)return;
  const pos=placement(q,e.shiftKey);if(Math.abs(pos.x-p.x)<1e-8&&Math.abs(pos.y-p.y)<1e-8)return;Object.assign(p,pos);
 }else if(drag.kind==='rotate'){
  const g=geometry(),angle=rotationFromPointer(g.toView(o.x,o.y),viewPoint(e),g.rotation,e.shiftKey?15:1);
  if(angle===null||angle===o.rot)return;
  o.rot=angle;
  const box=$('objRot');if(box)box.value=o.rot;
 }else{
  const p=point(e),raw={x:p.x+drag.dx,y:p.y+drag.dy},v=viewPoint(e);
  if(!drag.moved&&Math.hypot(v.x-drag.origin.x,v.y-drag.origin.y)<3)return;
  const {x,y}=placement(raw,e.shiftKey);
  const before=drag.contact;
  drag.contact=autoAttach&&!e.altKey?(contactTarget(f(),o,raw,geometry())||contactTarget(f(),o,{x,y},geometry())):null;
  if(Math.abs(x-o.x)<1e-8&&Math.abs(y-o.y)<1e-8){
   if(JSON.stringify(before)!==JSON.stringify(drag.contact))render();
   return
  }
  o.x=x;o.y=y;
 }
 if(!drag.moved)changed(false);
 drag.moved=true;render();
});
function finishDrag(e){
 if(!drag||e.pointerId!==drag.pointerId)return;
 const gesture=drag;drag=null;
 let attached=false;
 if(e.type==='pointerup'&&gesture.kind==='move'&&gesture.contact&&autoAttach&&!e.altKey){
  const {ballId,playerId}=gesture.contact,b=f().objects.find(o=>o.id===ballId),player=f().objects.find(o=>o.id===playerId);
  if(b&&!carrier(f(),b)&&canCarry(player)){
   // Moving a player to a free ball is a pickup, not a pass.
   const pickup=gesture.id===playerId;
   if(idx&&f().paths)delete f().paths[ballId];
   const n=assignPossession(drill.frames,idx,ballId,playerId,geometry(),pickup?null:gesture.originalPosition);
   if(n){
    if(idx&&drill.frames[idx-1].objects.some(o=>o.id===ballId&&!o.ownerId)){
     f().timing[ballId]=pickup?{start:99,end:100}:{start:0,end:100};
    }
    selected=playerId;ballChoiceId=ballId;attached=true;
    note('Ball attached to '+(player.label||'player')+' · move either to move both.');
   }
  }
 }
 if(gesture.moved||attached){changed();render();inspector();tracks()}
 else if(gesture.contact)render();
}
pitch.addEventListener('pointerup',finishDrag);
pitch.addEventListener('pointercancel',finishDrag);
pitch.addEventListener('lostpointercapture',finishDrag);
for(let k of ['title','objective','safety','age','category','length','width'])$(k).onchange=()=>{drill[k]=['length','width'].includes(k)?clamp(Number($(k).value)||5,5,k==='length'?100:70):$(k).value;if(k==='age'&&drill.age!=='Custom range'){delete drill.ageMin;delete drill.ageMax;enrich(drill)}changed();refresh()};$('stepName').onchange=()=>{editMode();f().name=$('stepName').value||'Step';changed();refresh()};$('stepTime').onchange=()=>{if(!idx)return;editMode();f().seconds=clamp(Number($('stepTime').value)||1,.5,30);changed();refresh()};$('stepNotes').onchange=()=>{editMode();f().notes=$('stepNotes').value;changed();refresh()};$('scenes').onclick=e=>{let b=e.target.closest('[data-step]');if(b){choose(Number(b.dataset.step));openInspector('Step',false)}};$('addStep').onclick=()=>{editMode();let n=clone(f());n.name='Step '+(idx+2);n.seconds=2;n.notes='';n.timing={};n.paths={};drill.frames.splice(idx+1,0,n);sanitizeRoutes(drill.frames);changed();choose(idx+1)};$('deleteStep').onclick=()=>{if(drill.frames.length<2)return;editMode();drill.frames.splice(idx,1);drill.frames[0].seconds=0;sanitizeRoutes(drill.frames);changed();choose(Math.min(idx,drill.frames.length-1))};$('back').onclick=()=>choose(idx-1);$('forward').onclick=()=>choose(idx+1);$('restart').onclick=()=>choose(0);$('trails').onclick=()=>{showPaths=!showPaths;$('trails').classList.toggle('selected',showPaths);render()};$('grid').onclick=()=>{showGrid=!showGrid;syncGrid();render()};$('snapGrid').onclick=()=>{gridPrefs.snap=!gridPrefs.snap;syncGrid();note(gridPrefs.snap?'Snap on · '+gridPrefs.step+' m spacing. Hold Shift for free movement.':'Snap off · free movement.');};$('gridStep').onchange=()=>{gridPrefs.step=gridStep($('gridStep').value);syncGrid();render();note('Grid spacing set to '+gridPrefs.step+' m. Existing positions unchanged.')};$('orientation').onclick=()=>{orientation=orientation==='up'?'right':'up';$('orientation').textContent=orientation==='up'?'Attack ↑':'Attack →';render()};$('scrub').oninput=()=>{ballPicking=null;routeDrawing=false;stop();preview=Number($('scrub').value);render();inspector();note('Preview mode. Select a step to resume editing.')};$('play').onclick=()=>{ballPicking=null;if(routeDrawing)finishRoute();if(playing){stop();return}if(duration()<=0){note('Add a second step to animate the drill.');return}let base=preview??at(idx);if(base>=duration()-.01)base=0;preview=base;playing=true;$('play').textContent='Ⅱ Pause';clock=performance.now();function tick(now){if(!playing)return;preview=Math.min(duration(),preview+(now-clock)/1000*Number($('speed').value));clock=now;render();if(preview>=duration()){stop();return}raf=requestAnimationFrame(tick)}raf=requestAnimationFrame(tick);note('Playing the drill. Select a step to edit.');inspector()};function download(name,body,type){const url=URL.createObjectURL(new Blob([body],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}const filename=()=>drill.title.replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'')||'rugby-drill';$('export').onclick=()=>download(filename()+'.json',JSON.stringify(drill,null,2),'application/json');$('png').onclick=()=>{const copy=pitch.cloneNode(true);copy.querySelectorAll('[data-editor-only]').forEach(n=>n.remove());download(filename()+'-step-'+(idx+1)+'.svg',new XMLSerializer().serializeToString(copy),'image/svg+xml')};function stored(){try{return JSON.parse(localStorage.getItem('rugby-studio-v1')||'[]')}catch{return []}}$('save').onclick=()=>{try{let lib=stored().filter(x=>x.id!==drill.id);lib.unshift(clone(drill));localStorage.setItem('rugby-studio-v1',JSON.stringify(lib));dirty=false;$('save').textContent='Save drill';note('Saved in this browser. Export JSON to share or back up.')}catch(e){note('Browser storage unavailable. Use Export JSON.')}};function confirmLeave(){return !dirty||confirm('You have unsaved changes. Continue without saving?')}$('new').onclick=()=>{if(!confirmLeave())return;drill=enrich(blank());dirty=false;selected=null;resetHistory();choose(0)};function libraryItems(){return [...stored().map(x=>({d:enrich(x),mine:true})),...SEEDS.map(d=>({d,mine:false}))]}function mini(d){
 const objects=d.frames[0]?frameObjects(d.frames[0],pitchGeometry(d.length,d.width,'up')):[];
 if(!objects.length)return '<svg class="mini" viewBox="0 0 250 90"><text x="125" y="48" fill="#d4e6c9" font-size="11" text-anchor="middle">Coaching card · diagram not yet built</text></svg>';
 const g=pitchGeometry(d.length,d.width,'up'),m=g.margin;
 return `<svg class="mini" viewBox="0 0 ${g.viewWidth} ${g.viewHeight}" preserveAspectRatio="xMidYMid meet"><rect width="${g.viewWidth}" height="${g.viewHeight}" fill="#203b2b"/><rect x="${m}" y="${m}" width="${g.fw}" height="${g.fh}" fill="#326844" stroke="#d4e6c9" stroke-width="4"/>${objects.map(o=>{const p=g.toView(o.x,o.y);return `<g transform="translate(${p.x} ${p.y}) rotate(${o.rot}) scale(1.4)">${shape(o.type)}</g>`}).join('')}</svg>`;
}function renderLibrary(){const q=$('searchLib').value.trim().toLowerCase(),age=Number($('filterAge').value),cat=$('filterCat').value,mode=$('filterMode').value;let items=libraryItems().filter(({d,mine})=>(!age||d.ageMin<=age&&d.ageMax>=age)&&(!cat||d.category===cat)&&(!mode||mode==='animated'&&d.frames.length>1||mode==='saved'&&mine)&&(!q||[d.title,d.objective,d.equipment,d.instructions,d.coaching,d.notes,d.provenance,...d.links.map(l=>l.label)].join(' ').toLowerCase().includes(q)));$('libraryCount').textContent=`${items.length} matching · ${SEEDS.length} starter cards · ${stored().length} saved locally`;$('libraryRows').innerHTML=items.map(({d,mine})=>`<article class="drillcard">${mini(d)}<div class="tag">${mine?'MY SAVED DRILL':d.frames.length>1?'ANIMATED STARTER':'STARTER CARD'} · ${esc(d.category)}</div><h3>${esc(d.title)}</h3><p>U${d.ageMin}–U${d.ageMax} · ${d.minutes} min · ${esc(d.players||'Flexible')}</p><p>${esc(d.objective)}</p><p>${esc(d.review)} · ${d.links.length} links</p><div class="flex"><button data-load="${esc(d.id)}" data-mine="${mine}">Open${mine?'':' copy'}</button><button data-card="${esc(d.id)}" data-mine="${mine}">Read card</button>${mine?`<button data-remove="${esc(d.id)}">Delete</button>`:''}</div></article>`).join('')||'<p class="muted">No matching drills. Try a different filter.</p>'}function openLibrary(){renderLibrary();$('libraryDialog').showModal()}$('filterAge').innerHTML+=Array.from({length:11},(_,i)=>`<option value="${i+6}">U${i+6}</option>`).join('');$('filterCat').innerHTML+=CATEGORIES.map(c=>`<option>${c}</option>`).join('');for(let k of ['searchLib','filterAge','filterCat','filterMode'])$(k).oninput=renderLibrary;$('library').onclick=openLibrary;$('closeLibrary').onclick=()=>$('libraryDialog').close();$('libraryRows').onclick=e=>{let b=e.target.closest('[data-load],[data-card],[data-remove]');if(!b)return;if(b.dataset.remove){if(confirm('Delete this saved local drill?')){try{localStorage.setItem('rugby-studio-v1',JSON.stringify(stored().filter(x=>x.id!==b.dataset.remove)));renderLibrary()}catch{note('Could not delete local drill.')}}return}if(!confirmLeave())return;let key=b.dataset.load||b.dataset.card;let d=b.dataset.mine==='true'?stored().find(x=>x.id===key):SEEDS.find(x=>x.id===key);if(d){drill=b.dataset.mine==='true'?enrich(d):freshSeed(d);dirty=false;selected=null;resetHistory();$('libraryDialog').close();choose(0);if(b.dataset.card)openDetails()}};function openDetails(){enrich(drill);$('cardTitle').textContent=drill.title;$('cardMeta').textContent=`${drill.category} · ${drill.frames.length>1?'Animated demonstration':'Coaching card; diagram can be created'}`;$('cardSource').textContent=drill.provenance+' '+drill.review;for(let k of [...fields,'ageMin','ageMax','minutes'])$(k).value=drill[k];$('cardObjective').value=drill.objective;$('cardSafety').value=drill.safety;$('linkStatus').textContent='';renderLinks();$('detailsDialog').showModal()}function syncCard(){for(let k of fields)drill[k]=$(k).value;drill.ageMin=clamp(Math.round(Number($('ageMin').value)||6),6,16);drill.ageMax=clamp(Math.round(Number($('ageMax').value)||16),drill.ageMin,16);drill.age='Custom range';drill.minutes=clamp(Number($('minutes').value)||8,1,120);drill.objective=$('cardObjective').value;drill.safety=$('cardSafety').value;changed();refresh()}$('details').onclick=openDetails;for(let k of [...fields,'ageMin','ageMax','minutes','cardObjective','cardSafety'])$(k).onchange=syncCard;$('closeDetails').onclick=()=>$('detailsDialog').close();function renderLinks(){$('linkRows').innerHTML=drill.links.length?drill.links.map((l,i)=>`<div class="linkrow"><div><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a><small>${esc(l.kind)} · ${esc(new URL(l.url).hostname)}</small></div><button data-unlink="${i}">Remove</button></div>`).join(''):'<small>No links yet. Add a video or coaching source.</small>'}$('addLink').onclick=()=>{const u=safeURL($('linkURL').value.trim());if(!u){$('linkStatus').textContent='Enter a valid http or https URL.';return}drill.links.push({url:u,label:$('linkLabel').value.trim()||u,kind:$('linkKind').value});$('linkURL').value='';$('linkLabel').value='';$('linkStatus').textContent='Link added.';changed();renderLinks()};$('linkRows').onclick=e=>{let b=e.target.closest('[data-unlink]');if(!b)return;drill.links.splice(Number(b.dataset.unlink),1);changed();renderLinks()};$('backup').onclick=()=>download('rugby-my-library.json',JSON.stringify({version:1,kind:'rugby-library',drills:stored()},null,2),'application/json');$('resources').onclick=()=>{$('resourceRows').innerHTML=RESOURCES.map(([country,title,url])=>`<div class="resource-row"><small>${esc(country)}</small><div><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a></div><p class="muted">${esc(EMPHASIS[country]||'')}</p></div>`).join('');$('resourceDialog').showModal()};$('closeResources').onclick=()=>$('resourceDialog').close();$('import').onclick=()=>$('file').click();function validate(d){if(!d||d.version!==1||!Array.isArray(d.frames)||!d.frames.length||d.frames.length>150)throw Error('Unsupported or invalid drill file.');let clean=blank();for(let k of ['id','title','age','category','objective','safety'])if(typeof d[k]==='string')clean[k]=d[k].slice(0,4000);for(let k of ['length','width'])clean[k]=clamp(Number(d[k])||20,5,k==='length'?100:70);clean.frames=d.frames.map((fr,i)=>{if(!Array.isArray(fr.objects)||fr.objects.length>200)throw Error('Invalid objects.');let seen=new Set();let objects=fr.objects.map(o=>{if(!Object.hasOwn(types,o.type)||typeof o.id!=='string'||seen.has(o.id)||!Number.isFinite(o.x)||!Number.isFinite(o.y))throw Error('Invalid object.');seen.add(o.id);const n=obj(o.id,o.type,String(o.label??'').slice(0,160),clamp(o.x,0,900),clamp(o.y,0,540),clamp(Number(o.rot)||0,-360,360));if(o.type==='ball'&&typeof o.ownerId==='string')n.ownerId=o.ownerId;return n});let timing={};objects.forEach(o=>{let t=fr.timing?.[o.id];if(t){let s=clamp(Number(t.start)||0,0,99);Object.defineProperty(timing,o.id,{value:{start:s,end:clamp(Number(t.end)||100,s+1,100)},enumerable:true,writable:true,configurable:true})}});return {name:String(fr.name??'Step').slice(0,160),seconds:i?clamp(Number(fr.seconds)||2,.5,30):0,notes:String(fr.notes??'').slice(0,4000),objects,timing,paths:fr.paths||{}}});sanitizeRoutes(clean.frames);syncPossession(clean.frames,pitchGeometry(clean.length,clean.width,'up'));for(let k of [...fields,'provenance','review'])if(typeof d[k]==='string')clean[k]=d[k].slice(0,20000);for(let k of ['ageMin','ageMax','minutes'])if(Number.isFinite(d[k]))clean[k]=d[k];clean.links=d.links;return enrich(clean)}$('file').onchange=async e=>{try{let file=e.target.files[0];if(!file||!confirmLeave())return;let parsed=JSON.parse(await file.text());if(parsed?.kind==='rugby-library'&&Array.isArray(parsed.drills)){let imported=parsed.drills.map(validate),existing=stored();for(let d of imported){d.id=uid();existing.push(d)}localStorage.setItem('rugby-studio-v1',JSON.stringify(existing));note('Imported '+imported.length+' saved drills into local library.');return}drill=validate(parsed);dirty=true;selected=null;resetHistory();choose(0);note('Imported drill. Save it to add to this browser’s library.')}catch(err){note('Import failed: '+err.message)}finally{e.target.value=''}};window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});resetHistory();syncGrid();refresh();
