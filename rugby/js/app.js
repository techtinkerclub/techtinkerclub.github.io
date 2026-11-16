import { $, clone, esc, clamp, uid, types, shape, obj, sample, blank } from './model.js?v=0.8.0';
import {decisionData,copyTraining,cleanTraining,stripDecisions,decisionOverlay,decisionRoute,decisionFraction,decisionLocation,donutShape,donutSteps,donutLaneOverlay,trainingTransition,trainingPoses} from './training.js?v=0.8.4';
import { RESOURCES, EMPHASIS } from './resources.js';
import { initWorkspace, openInspector } from './workspace.js?v=0.4.9';
import { pitchGeometry, trainingField } from './pitch.js?v=0.9.0';
import {pitchSettings,canPropagate,canEntire,propagatePosition,copyLayoutMarker} from './drill-edit.js?v=0.9.0';
import {normaliseAge,setupValues,setupAge,prepareSetup} from './setup.js?v=0.9.1';
import { placePoint, gridStep, loadGridPrefs, saveGridPrefs } from './grid.js?v=0.4.2';
import { wrapAngle, shortestTurn, rotationFromPointer, rotationHandle } from './rotation.js?v=0.3.3';
import { removeObject, isEditingKeyTarget } from './object-edit.js?v=0.3.3';
import { cleanRoute, sanitizeRoutes, routeSamples, routeSVG, sampleRoute, waypointOverlay, routeInsertion, insertionHandles } from './routes.js?v=0.4.3';
import { createHistory } from './history.js?v=0.4.0';
import { canCarry, carrier, carriedPose, syncPossession, frameObjects, movementFor, transitionObjects, contactTarget, assignPossession, carrySide, setCarrySide, isShield, shieldPose, assignShield, shieldTarget } from './possession.js?v=0.8.4';
import {createCamera} from './camera.js?v=0.5.0';
import {contactType,contactTitle,contactCandidates,cleanContacts,arrangeContact,posesFor,posedShape,contactMarkerShape,contactLabels,PLAYER_POSES} from './contact.js?v=0.8.4';
import {PHASES,supportTitle,validPhase,nextPhase,team,roles,cleanBreakdowns,candidates,advance} from './breakdown.js?v=0.8.4';
import {insertable,fillMissing,syncInsertedCopies,scopeIndices} from './insertion.js?v=0.8.0';
import {breakdownContext} from './breakdown-context.js?v=0.5.7';
import {groupSnapshot,groupTranslate,groupRotate} from './group.js?v=0.6.0';
import {PRESETS} from './presets.js?v=0.6.0';
import {renderScene} from './scene.js?v=0.9.0';
import {shareCode,outputOptions,recordDrill,saveBlob,outputName,printDrill} from './outputs.js?v=0.9.0';
import {createExportProgress} from './export-progress.js?v=0.7.3';
import {bindMovieSettings} from './movie.js?v=0.7.1';
import {GAME_PHASES,RULES,phaseAge,phaseAllowed,ageNote,phaseFields,choicesFor,makeGuide,generateStage,cleanGuide,guideCaption,nextGuide,playerTeam,phaseOverlay} from './game-phases.js?v=0.7.0';
initWorkspace();
const SEEDS = await fetch(new URL('../data/drills.json?v=0.8.0', import.meta.url)).then(r => {
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}).then(data => {
  if (data.version !== 1 || !Array.isArray(data.drills) || !data.drills.length) throw new Error('Invalid drill catalogue');
  return data.drills;
}).catch(err => {
  const msg = document.createElement('p'); msg.setAttribute('role','alert'); msg.textContent = 'Could not load the drill library: ' + err.message; msg.style.padding = '16px'; document.body.prepend(msg); throw err;
});
const MAIN_SAMPLE=SEEDS.find(x=>x.title==='2 vs 1 · Draw and pass');MAIN_SAMPLE.frames=sample().frames;MAIN_SAMPLE.frames.forEach((fr,i)=>{fr.objects.find(o=>o.id==='b1').ownerId=i<2?'a1':'a2'});const CATEGORIES=['Attack','Defence','Handling','Contact','Breakdown','Set piece','Movement','Game'];const fields=['players','equipment','instructions','coaching','regression','progression','questions','notes'];function enrich(d){Object.assign(d,pitchSettings(d));Object.assign(d,normaliseAge(d));d.minutes=clamp(Number(d.minutes)||8,1,120);for(let k of fields)d[k]=String(d[k]??'');d.links=Array.isArray(d.links)?d.links.filter(x=>x&&safeURL(x.url)).slice(0,100).map(x=>({label:String(x.label||x.url).slice(0,200),url:safeURL(x.url),kind:String(x.kind||'Reference').slice(0,80)})):[];d.provenance=String(d.provenance||'Coach-created / imported drill');d.review=String(d.review||'Coach review required');return d}function safeURL(u){try{let v=new URL(u);return ['https:','http:'].includes(v.protocol)?v.href:null}catch{return null}}function freshSeed(s){let d=clone(s);d.id=uid();d.age='Custom range';return enrich(d)}
let setupPending=false;
const history=createHistory();let routeDrawing=false,routeClickCount=0,ballPicking=null,ballChoiceId=null,showPasses=true;
let ballPickKind='pass',showActionLabels=true,autoContact=true;try{autoContact=localStorage.getItem('rugby-auto-contact')!=='off'}catch{}
let trainingPick=null,showDecisions=true,pendingInsert=null,breakdownPreferred=null,breakdownView=null,groupIds=new Set(),groupMode=false;
let autoAttach=true;try{autoAttach=localStorage.getItem('rugby-auto-attach')!=='off'}catch{}
const gridPrefs=loadGridPrefs();
let drill=freshSeed(MAIN_SAMPLE),idx=0,selected=null,showPaths=true,showGrid=gridPrefs.visible,orientation='up',playing=false,preview=null,clock=0,raf=0,drag=null,dirty=false;const pitch=$('pitch'),f=()=>drill.frames[idx],duration=()=>drill.frames.reduce((s,f,i)=>s+(i?f.seconds:0),0),at=i=>drill.frames.slice(1,i+1).reduce((a,x)=>a+x.seconds,0);function note(s){$('status').textContent=s;$('status').title=s}function changed(record=true){drill.frames.forEach(fr=>{cleanGuide(fr);cleanTraining(fr)});cleanContacts(drill.frames);cleanBreakdowns(drill.frames);syncPossession(drill.frames,geometry());dirty=true;$('save').textContent='Save drill •';if(record){history.record(drill);historyButtons()}}function stop(){playing=false;cancelAnimationFrame(raf);$('play').textContent='▶ Play'}function locate(t){let acc=0;for(let i=1;i<drill.frames.length;i++){const end=acc+drill.frames[i].seconds;if(t<end)return {i,p:(t-acc)/(end-acc)};acc=end}return {i:drill.frames.length-1,p:1}}function tween(t){const g=geometry();if(!drill.frames.length||t<=0)return frameObjects(drill.frames[0],g);const {i,p}=locate(t);return i?trainingTransition(transitionObjects(drill.frames[i-1],drill.frames[i],p,g),drill.frames[i-1],drill.frames[i],p,g):frameObjects(drill.frames[0],g)}
const geometry=()=>pitchGeometry(drill.length,drill.width,orientation);
const camera=createCamera(pitch,{getGeometry:geometry,canNavigate:()=>!drag&&!routeDrawing&&!ballPicking&&!trainingPick,onChange:(z,pan)=>{$('zoomFit').textContent=Math.round(z*100)+'%';$('panMode').classList.toggle('selected',pan);$('panMode').setAttribute('aria-pressed',String(pan));$('zoomOut').disabled=z<=1.001;$('zoomIn').disabled=z>=4.999}});
$('zoomIn').onclick=()=>camera.changeZoom(1.25);$('zoomOut').onclick=()=>camera.changeZoom(.8);$('zoomFit').onclick=()=>camera.fit();$('panMode').onclick=()=>camera.setPanMode(!camera.panMode);
$('actionLabels').onclick=()=>{showActionLabels=!showActionLabels;$('actionLabels').classList.toggle('selected',showActionLabels);$('actionLabels').setAttribute('aria-pressed',String(showActionLabels));render()};
const placement=(p,free=false)=>placePoint(p,geometry(),gridPrefs.snap&&!free,gridPrefs.step);
function syncGrid(){for(const [id,on] of [['grid',showGrid],['snapGrid',gridPrefs.snap]]){$(id).classList.toggle('selected',on);$(id).setAttribute('aria-pressed',String(on))}$('gridStep').value=String(gridPrefs.step);gridPrefs.visible=showGrid;saveGridPrefs(gridPrefs)}
function render(){
 const g=geometry(),objects=preview===null?frameObjects(f(),g):tween(preview);
 camera.apply(g);
 pitch.setAttribute('preserveAspectRatio','xMidYMid meet');
 let lines='',pathHits='';
 const lineIndex=preview===null?idx:preview<=0?0:locate(preview).i;
 if(lineIndex>0){
  const next=drill.frames[lineIndex],old=drill.frames[lineIndex-1];
  for(const o of next.objects){
   if(o.type==='decision')continue;
   if(!(o.type==='ball'?showPasses:showPaths||routeDrawing&&preview===null)||preview!==null&&o.type!=='ball')continue;
   const move=movementFor(old,next,o,g),route=next.paths?.[o.id];
   if(move&&!move.turnover&&!move.instant&&!move.presentation&&hasMovement(move.start,move.end,route)){
    const d=routeSVG(routeSamples(move.start,move.end,route,g)),sel=o.id===selected&&preview===null;
    lines+=`<path d="${d}" fill="none" stroke="${o.type==='ball'?'#ffe994':types[o.type][1]}" stroke-width="${sel?4:3}" ${o.type==='ball'?(o.transferKind==='kick'?'stroke-dasharray="13 4 3 4"':'stroke-dasharray="7 6"'):''} marker-end="url(#arr)" opacity="${sel?1:.8}"/>`;
    if(preview===null&&!['donut','decision'].includes(o.type))pathHits+=`<path d="${d}" data-path-id="${esc(o.id)}" data-editor-only="true" class="path-hit" fill="none" stroke="transparent" stroke-width="18" pointer-events="stroke"><title>Click to select path; drag selected path to bend</title></path>`;
   }
  }
 }
 const active=preview===null?objects.find(o=>o.id===selected):null;
 const raw=active&&!['decision','donut'].includes(active.type)&&f().objects.find(o=>o.id===active.id),move=raw&&movementFor(drill.frames[idx-1],f(),raw,g),route=active&&f().paths?.[active.id];
 const pathVisible=active?.type==='ball'?showPasses:showPaths;
 const magnet=preview===null&&drag?.contact?objects.find(o=>o.id===drag.contact.playerId):null;
 const magnetOverlay=magnet?(()=>{const p=g.toView(magnet.x,magnet.y);return `<g data-editor-only="true" pointer-events="none"><circle cx="${p.x}" cy="${p.y}" r="32" stroke="#d6f77b" stroke-width="3" stroke-dasharray="5 3" fill="#d6f77b" fill-opacity=".12"/><text x="${p.x}" y="${p.y-40}" fill="#e6ffac" font-size="13" text-anchor="middle" paint-order="stroke" stroke="#20372b" stroke-width="3">Release to attach</text></g>`})():'';
 const handles=pathVisible&&!routeDrawing&&move&&!move.turnover&&!move.instant&&!move.presentation&&hasMovement(move.start,move.end,route)?insertionHandles(move.start,move.end,route,g):'';
 const poses=trainingPoses(objects,posesFor(objects));
 pitch.innerHTML=trainingField(g,showGrid,gridPrefs.step,pitchSettings(drill))+(showActionLabels?phaseOverlay(drill.frames[lineIndex],g):'')+lines+pathHits+(trainingPick?.kind==='roll'&&preview===null?'<g id="donutLanePreview" data-editor-only="true">'+donutLaneOverlay(f().objects.find(o=>o.id===trainingPick.id),g)+'</g>':'')+[...objects.filter(o=>contactType(o.type)),...objects.filter(o=>o.type!=='ball'&&o.type!=='decision'&&!isShield(o)&&!contactType(o.type)),...objects.filter(o=>isShield(o)),...objects.filter(o=>o.type==='ball')].map(o=>{
  const sel=(selected===o.id||groupIds.has(o.id))&&preview===null,p=g.toView(o.x,o.y);
  return `<g class="obj" data-id="${esc(o.id)}" transform="translate(${p.x} ${p.y})"><circle r="${o.type==='ball'?(o.ownerId?10:14):24}" fill="transparent"/>${sel?'<circle data-editor-only="true" r="25" stroke="#d6f77b" stroke-width="2" stroke-dasharray="4 3" fill="none" pointer-events="none"/>':''}<g transform="rotate(${o.rot+g.rotation})">${posedShape(o,poses.get(o.id),contactMarkerShape(o,donutShape(o,o.type==='label'?'':shape(o.type))),types[o.type][1])}</g>${o.label&&!contactType(o.type)?`<text y="${o.type==='label'?4:34}" text-anchor="middle" fill="#fff" paint-order="stroke" stroke="#234f38" stroke-width="3" font-size="13" font-weight="600">${esc(o.label)}</text>`:''}</g>`;
 }).join('')+(showDecisions?decisionOverlay(drill.frames[lineIndex],g,esc,preview===null?selected:'',false,drill.frames[lineIndex-1]):'')+(active&&active.type!=='decision'&&!(active.type==='donut'&&active.donutState==='down')&&!trainingPick&&!groupIds.size&&!routeDrawing&&!ballPicking&&!((active.type==='ball'||isShield(active))&&active.ownerId)?rotationHandle(g.toView(active.x,active.y),active.rot,g.rotation):'')+(pathVisible&&!routeDrawing&&!ballPicking?handles:'')+(active&&move&&!move.turnover&&!move.instant&&!move.presentation&&!ballPicking&&(pathVisible||routeDrawing)?waypointOverlay(f().paths?.[active.id],g):'')+magnetOverlay+(showActionLabels?contactLabels(objects,g,esc,[...new Set([...(turnoverCaption(objects,g,lineIndex)?['Turnover']:[]),...(guideCaption(drill.frames[lineIndex])&&!objects.some(o=>contactType(o.type)&&o.label===guideCaption(drill.frames[lineIndex]))?[guideCaption(drill.frames[lineIndex])]:[])])]):'');
 updateSelectionTools(active);$('trails').setAttribute('aria-pressed',String(showPaths));updateRouteTools();updateGroupTools();updateBallTools();updateCarryControls();updateShieldTools();updateExtendTools();updateObjectPicker();updateContactTools();updateBreakdownDock();updateGameDock();$('editCurrent').hidden=preview===null;
 $('sceneLabel').textContent=preview===null?`Step ${idx+1} of ${drill.frames.length} · ${f().name}`:drill.frames[locate(preview).i].name;$('narration').textContent=preview===null?f().notes:(drill.frames[locate(preview).i]?.notes||'');$('narration').title=$('narration').textContent;$('timeLabel').textContent=`${(preview??at(idx)).toFixed(1)} / ${duration().toFixed(1)} s`;$('scrub').max=Math.max(.01,duration());$('scrub').value=preview??at(idx)}
function inspector(){let o=f().objects.find(x=>x.id===selected);if(preview!==null&&['decision','donut'].includes(o?.type)){$('objectPanel').innerHTML='<small>Select a step to edit the annotation or equipment.</small>';return}if(o?.type==='decision'){decisionInspector(o);return}if(o?.type==='donut'){donutInspector(o);return}let disabled=preview!==null?'disabled':'';if(!o){$('objectPanel').innerHTML=groupIds.size?'<small>Group editing affects the current step only. Attached equipment follows its holder.</small>':'<small>Select an object on the pitch to edit its label, rotation and timing.</small>';return}let t=f().timing?.[o.id]||{start:0,end:100};$('objectPanel').innerHTML=`<div class="field"><label>Object: ${esc(types[o.type][0])}</label><input id="objLabel" value="${esc(o.label)}" ${disabled}></div><div class="field"><label>Rotation (degrees)</label><input id="objRot" type="number" min="-360" max="360" value="${o.rot}" ${disabled}><div class="facing-buttons" aria-label="Quick facing directions">${[["↑",0,"up"],["→",90,"right"],["↓",180,"down"],["←",270,"left"]].map(([symbol,a,word])=>`<button type="button" data-facing="${a}" title="Face ${word} on screen" aria-label="Face ${word} on screen" ${disabled}>${symbol}</button>`).join("")}</div><small>Drag the green handle on the pitch to rotate. Hold Shift for 15° steps. Degrees are relative to the pitch.</small></div>${idx>0?`<div class="pair"><div class="field"><label>Start (%)</label><input id="start" type="number" min="0" max="99" value="${t.start}" ${disabled}></div><div class="field"><label>End (%)</label><input id="end" type="number" min="1" max="100" value="${t.end}" ${disabled}></div></div><small>Timing is relative to the transition into this step.</small>`:''}<div class="flex" style="margin-top:9px"><button id="copyObj" ${disabled}>Duplicate</button><button id="delObj" class="danger-action" ${disabled} ${contactType(o.type)&&!(f().guide&&o.id===f().guide.id+'-formation')?'hidden':''}>Delete object</button></div>`;if(canCarry(o)){const formation=f().objects.find(m=>contactType(m.type)&&m.members?.some(x=>x.id===o.id)),pose=formation?.members.find(x=>x.id===o.id)?.pose||o.playerPose||'standing';const el=document.createElement('div');el.className='field';el.innerHTML='<label>Player pose<select id="playerPose" '+(formation||preview!==null?'disabled':'')+'>'+Object.entries(PLAYER_POSES).map(([k,v])=>'<option value="'+k+'" '+(k===pose?'selected':'')+'>'+v+'</option>').join('')+'</select></label><small>'+(formation?'Managed by the contact formation. Select its marker to edit.':'Applies to this step only. Use another step to change pose.')+'</small>';$('objectPanel').insertBefore(el,$('objectPanel').lastElementChild);$('playerPose').onchange=e=>{o.playerPose=e.target.value;changed();render();tracks()}};$('objLabel').oninput=e=>{o.label=e.target.value;changed();render()};$('objRot').onchange=e=>{o.rot=clamp(Number(e.target.value)||0,-360,360);$('objRot').value=o.rot;changed();render();tracks()};for(const button of $('objectPanel').querySelectorAll('[data-facing]'))button.onclick=()=>{o.rot=wrapAngle(Number(button.dataset.facing)-geometry().rotation);$('objRot').value=o.rot;changed();render();tracks()};if(idx>0){function timing(){let s=clamp(Number($('start').value)||0,0,99),e=clamp(Number($('end').value)||1,s+1,100);f().timing[o.id]={start:s,end:e};changed();render();inspector();tracks()}$('start').onchange=timing;$('end').onchange=timing}$('copyObj').onclick=duplicateSelected;$('delObj').onclick=()=>deleteObject('here')}function tracks(){if(!idx){$('tracks').innerHTML='<div style="padding:10px" class="muted">Select a later step to configure independent movement tracks.</div>';return}let old=drill.frames[idx-1];let moving=f().objects.filter(o=>{if(o.type==='decision')return false;let a=old.objects.find(x=>x.id===o.id);const m=movementFor(old,f(),o,geometry());return m&&(hasMovement(m.start,m.end,f().paths?.[o.id])||a.rot!==o.rot||a.ownerId!==o.ownerId||a.playerPose!==o.playerPose)});$('tracks').innerHTML=moving.length?moving.map(o=>{let t=f().timing[o.id]||{start:0,end:100};return `<div class="track"><button class="track-name" data-track="${esc(o.id)}" title="Edit movement timing">${esc(o.type==='ball'&&o.transferKind==='turnover'?'Turnover → '+(carrier(f(),o)?.label||'receiver'):o.type==='ball'&&carrier(old,old.objects.find(x=>x.id===o.id))&&carrier(f(),o)&&old.objects.find(x=>x.id===o.id)?.ownerId!==o.ownerId?'Pass → '+(carrier(f(),o).label||'receiver'):o.label||types[o.type][0])}</button><div class="trackbar"><div class="span" style="left:${t.start}%;width:${t.end-t.start}%;background:${types[o.type][1]}">${t.start}–${t.end}%</div></div></div>`}).join(''):'<div style="padding:10px" class="muted">No movement from the previous step. Drag an existing object to a new position.</div>'}$('tracks').addEventListener('click',e=>{const b=e.target.closest('[data-track]');if(!b)return;editMode();selected=b.dataset.track;render();inspector();openInspector('Object')});function refresh(){closeObjectMenu();const fr=f();$('stageTitle').textContent=drill.title+' · '+(drill.ageMin===drill.ageMax?'U'+drill.ageMin:'U'+drill.ageMin+'–U'+drill.ageMax);if(!setupPending)syncSetup();$('stepName').value=fr.name;$('stepTime').value=idx?fr.seconds:0;$('stepTime').disabled=!idx;$('stepNotes').value=fr.notes;$('scenes').innerHTML=drill.frames.map((x,i)=>`<button class="scene ${i===idx?'selected':''}" data-step="${i}"><b>${String(i+1).padStart(2,'0')} · ${esc(x.name)}</b><span>${at(i).toFixed(1)} s · ${x.objects.length} objects</span></button>`).join('');$('deleteStep').disabled=drill.frames.length===1;$('back').disabled=idx===0;$('forward').disabled=idx===drill.frames.length-1;$('save').textContent=dirty?'Save drill •':'Save drill';render();inspector();tracks()}function choose(i){trainingPick=null;pendingInsert=null;stop();ballPicking=null;routeDrawing=false;routeClickCount=0;preview=null;idx=clamp(i,0,drill.frames.length-1);groupIds=new Set([...groupIds].filter(id=>f().objects.some(o=>o.id===id)));if(!f().objects.some(o=>o.id===selected))selected=null;refresh();note(f().notes||'Edit positions on the pitch.')};function editMode(){if(preview!==null){stop();preview=null;refresh()}}function add(type){const prior=activeObject();editMode();trainingPick=null;groupIds.clear();groupMode=false;pendingInsert=null;ballPicking=null;routeDrawing=false;const count=f().objects.filter(x=>x.type===type).length;let label=['attacker','defender','neutral'].includes(type)?({attacker:'A',defender:'D',neutral:'P'}[type]+(count+1)):['ball','shieldItem','cone','flag','bag','sausage','ladder','donut'].includes(type)?'':types[type][0];let n=obj(uid(),type,label,450+((count%4)-1)*34,280+Math.floor(count/4)*28);Object.assign(n,placement(n));if(type==='decision'){const from=drill.frames[idx-1]?.objects.find(o=>o.id===prior?.id)||prior;if(canCarry(prior)&&from){n.x=from.x;n.y=from.y}n.label='Decision '+(count+1);n.decision=decisionData({playerId:canCarry(prior)?prior.id:'',options:[{label:'Demonstrated action',kind:'main'},{label:'Alternative',kind:'run'}]});showDecisions=true;$('decisionToggle').classList.add('selected');$('decisionToggle').setAttribute('aria-pressed','true')}if(type==='donut')n.donutState='ready';if(f().objects.length>=200){note('Maximum objects in this step reached.');return}f().objects.push(n);selected=n.id;
 const result=fillMissing(drill.frames,idx,n,insertable(n)?$('insertScope').value:'here',geometry());
 if(result.added.length)pendingInsert={id:n.id,index:idx,indices:result.added,origin:{x:n.x,y:n.y}};
 changed();refresh();openInspector('Object',false);if(result.added.length||result.skipped)note(insertionMessage(n,result));};let groups=[['Players',['attacker','defender','neutral','coach']],['Ball & markers',['ball','cone','flag']],['Contact equipment',['shieldItem','bag','donut']],['Agility equipment',['sausage','ladder']],['Annotations',['label']]];
const paletteNames={tackle:'Tackle',ruck:'Ruck',maul:'Maul',scrum:'Scrum',label:'Text label',decision:'Standalone decision',shieldItem:'Contact shield',sausage:'Sausage bag',donut:'Tackle donut'};
const paletteTiles=ts=>ts.map(t=>`<button data-type="${t}" title="Add ${esc(types[t][0])}"><svg viewBox="-32 -32 64 64" aria-hidden="true">${shape(t)}</svg>${esc(paletteNames[t]||types[t][0])}</button>`).join('');
$('palette').innerHTML=groups.map(([name,ts])=>`<div class="group"><h4>${esc(name)}</h4><div class="palette">${paletteTiles(ts)}</div></div>`).join('');
$('rugbyPalette').innerHTML=paletteTiles(['tackle']);
$('legacyPalette').innerHTML=paletteTiles(['ruck','maul','scrum','decision','bagplayer'])+'<small class="legacy-hint">For standalone diagrams or older drills. For a route decision, select its path and use Add decision on path in the Object inspector.</small>';
for(const id of ['palette','rugbyPalette','legacyPalette'])$(id).onclick=e=>{const b=e.target.closest('[data-type]');if(b)add(b.dataset.type)};
$('pitchPreset').innerHTML='<option value="">Current / custom size</option>'+PRESETS.map(p=>'<option value="'+p.id+'">'+esc(p.name)+'</option>').join('');
const setupFields={title:'title',age:'age',ageMin:'ageMin',ageMax:'ageMax',category:'category',minutes:'minutes',length:'length',width:'width',attackDirection:'attackDirection',boundary:'boundaryStyle',preset:'pitchPreset',markers:'presetMarkers',resizeMode:'resizeMode'};
function setupStatus(message,state=''){const status=$('pitchSettingsStatus');status.textContent=message;status.dataset.state=state;$('applyPitchSettings').disabled=!setupPending;$('revertSetup').disabled=!setupPending;$('tabDrill').textContent=setupPending?'Drill •':'Drill'}
function previewSetup(){
 $('customAge').hidden=$('age').value!=='Custom range';
 const l=Number($('length').value),w=Number($('width').value),container=$('setupPreview');
 if(!Number.isFinite(l)||!Number.isFinite(w)||l<5||l>100||w<5||w>70){container.textContent='Enter valid dimensions';return}
 const dir=$('attackDirection').value,g=pitchGeometry(l,w,'up'),body=trainingField(g,false,.5,{attackDirection:dir,showAttack:dir!=='hidden',boundary:$('boundaryStyle').value}).replaceAll('id="arr"','id="setup-arr"').replaceAll('url(#arr)','url(#setup-arr)').replaceAll('id="gridpat"','id="setup-grid"').replaceAll('url(#gridpat)','url(#setup-grid)');
 container.innerHTML='<svg viewBox="0 0 '+g.viewWidth+' '+g.viewHeight+'" preserveAspectRatio="xMidYMid meet">'+body+'</svg>';
}
function readSetup(){return Object.fromEntries(Object.entries(setupFields).map(([k,id])=>[k,$(id).value]))}
function syncSetup(){
 const values=setupValues(drill);for(const [k,id] of Object.entries(setupFields))$(id).value=values[k];
 setupPending=false;setupStatus('All settings applied.');previewSetup();
}
function setupChanged(){
 const v=readSetup(),base=setupValues(drill);
 setupPending=['title','age','category','minutes','length','width','attackDirection','boundary','markers'].some(k=>String(v[k])!==String(base[k]))||v.age==='Custom range'&&['ageMin','ageMax'].some(k=>String(v[k])!==String(base[k]));
 setupStatus(setupPending?'Unapplied changes · apply to all steps.':'All settings applied.',setupPending?'pending':'');previewSetup();
}
$('setupForm').addEventListener('input',setupChanged);
$('setupForm').addEventListener('change',e=>{
 if(e.target.id==='pitchPreset'){const p=PRESETS.find(x=>x.id===$('pitchPreset').value);if(p){$('length').value=p.length;$('width').value=p.width}}
 if(e.target.id==='age'){const range=setupAge($('age').value);if(range){$('ageMin').value=range[0];$('ageMax').value=range[1]}}
 setupChanged();
});
$('setupForm').onsubmit=e=>{
 e.preventDefault();if(!setupPending)return;
 if(!canEditObjects()){setupStatus('Stop playback or select a step before applying.','error');return}
 const out=prepareSetup(drill,readSetup(),uid);
 if(!out.ok){setupStatus(out.message,'error');note(out.message);return}
 drill=out.drill;pendingInsert=null;setupPending=false;changed();refresh();
 const msg='Applied to '+drill.frames.length+' steps.'+(out.added||out.removed?' Generated marker instances: +'+out.added+' / −'+out.removed+'.':'')+' Undo restores previous settings.';
 setupStatus(msg);note(msg);
};
$('revertSetup').onclick=()=>{syncSetup();note('Unapplied settings discarded.')};
function requireAppliedSetup(){if(!setupPending)return true;openInspector('Drill',true);setupStatus('Apply or discard the pending settings first.','pending');note('Apply or discard the pending drill setup first.');return false}
$('setupCoaching').onclick=()=>{if(requireAppliedSetup())openDetails()};
function insertionMessage(o,r){return (o.label||types[o.type][0])+' added to '+r.added.length+' other step'+(r.added.length===1?'':'s')+(r.skipped?' · '+r.skipped+' skipped (missing holder, occupied holder or capacity)':'')+'.'}
function extendObject(o,scope){if(!canEditObjects()||!insertable(o))return;const r=fillMissing(drill.frames,idx,o,scope,geometry());if(r.added.length){changed();refresh()}note(insertionMessage(o,r))}
function missingInScope(o,scope){return !!o&&insertable(o)&&scopeIndices(drill.frames,idx,scope).some(i=>!drill.frames[i].objects.some(x=>x.id===o.id))}
function updateExtendTools(){const o=preview===null?activeObject():null;const onward=missingInScope(o,'onward'),all=missingInScope(o,'all');$('extendTools').hidden=!all;$('extendOnward').disabled=!onward||routeDrawing||!!ballPicking;$('extendAll').disabled=!all||routeDrawing||!!ballPicking;}
$('extendOnward').onclick=()=>extendObject(activeObject(),'onward');$('extendAll').onclick=()=>extendObject(activeObject(),'all');
$('extendShieldOnward').onclick=()=>extendObject(selectedShield(),'onward');$('extendShieldAll').onclick=()=>extendObject(selectedShield(),'all');
function canEditObjects(){return !trainingPick&&!routeDrawing&&!ballPicking&&preview===null&&!playing&&!drag&&!document.body.classList.contains('presentation-mode')&&!document.querySelector('dialog[open]')}
function groupTarget(o){return canCarry(o)?o:carrier(f(),o)}
function toggleGroupPlayer(o){const p=groupTarget(o);if(!p)return;pendingInsert=null;if(groupIds.has(p.id))groupIds.delete(p.id);else groupIds.add(p.id);selected=null;render();inspector();openInspector('Object',false)}
function updateGroupTools(){const count=groupIds.size;$('groupToggle').classList.toggle('selected',groupMode);$('groupToggle').setAttribute('aria-pressed',String(groupMode));$('groupTools').hidden=preview!==null||(!groupMode&&!count);$('groupCount').textContent=count?count+' players selected · drag any selected player':'Ctrl-click players or select a team';for(const id of ['groupLeft','groupRight','groupQuarter','groupFaceLeft','groupFaceRight'])$(id).disabled=!count||preview!==null}
function setGroup(test){if(!canEditObjects())return;groupIds=new Set(f().objects.filter(o=>canCarry(o)&&test(o)).map(o=>o.id));selected=null;groupMode=true;pendingInsert=null;render();inspector();openInspector('Object',true)}
function rotateGroup(delta,formation){if(!canEditObjects()||!groupIds.size)return;const out=groupRotate(groupSnapshot(f(),[...groupIds],geometry()),delta,geometry(),formation);if(!out){note('Group would extend outside the pitch. Move it inward first.');return}for(const p of out)Object.assign(f().objects.find(o=>o.id===p.id),p);changed();render();inspector();tracks()}
$('groupToggle').onclick=()=>{if(!canEditObjects())return;groupMode=!groupMode;if(!groupMode)groupIds.clear();else if(groupTarget(activeObject())){groupIds.add(groupTarget(activeObject()).id);selected=null}render();inspector();openInspector('Object',true)};
$('groupAttack').onclick=()=>setGroup(o=>o.type==='attacker'||o.type==='shield');$('groupDefence').onclick=()=>setGroup(o=>o.type==='defender'||o.type==='bagplayer');$('groupAll').onclick=()=>setGroup(()=>true);
$('groupClear').onclick=()=>{groupIds.clear();groupMode=false;render();inspector()};
$('groupLeft').onclick=()=>rotateGroup(-15,true);$('groupRight').onclick=()=>rotateGroup(15,true);$('groupQuarter').onclick=()=>rotateGroup(90,true);
$('groupFaceLeft').onclick=()=>rotateGroup(-15,false);$('groupFaceRight').onclick=()=>rotateGroup(15,false);
function activeObject(){return f().objects.find(o=>o.id===selected)}
function focusPitch(){pitch.focus({preventScroll:true})}
function updateSelectionTools(o){
 $('moveScope').disabled=preview!==null||!!routeDrawing||!!ballPicking||!!trainingPick||groupMode||!!groupIds.size;$('moveScope').title=groupMode||groupIds.size?'Group moves affect this step only. Individual move scope is unchanged.':'Position change scope for individual objects';
 $('groupToggle').disabled=preview!==null||!!routeDrawing||!!ballPicking||!!trainingPick;
 $('selectionLabel').textContent=groupIds.size?groupIds.size+' players selected':o?(o.label||types[o.type][0]):'No selection';
 $('drawRouteSide').disabled=!o||['decision','donut'].includes(o.type)||!!ballPicking||!!((o.type==='ball'||isShield(o))&&o.ownerId&&!selectedMovement());
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
 pendingInsert=null;const n={...clone(o),id:uid(),x:clamp(o.x+35,30,870),y:clamp(o.y+35,25,515),label:o.label?o.label+' copy':''};delete n.ownerId;delete n.members;delete n.breakdown;delete n.transferKind;delete n.groundState;delete n.donutTacklerId;delete n.layoutMarker;
 Object.assign(n,placement(n));if(f().objects.length>=200){note('Maximum objects in this step reached.');return}f().objects.push(n);selected=n.id;const r=fillMissing(drill.frames,idx,n,insertable(n)?$('insertScope').value:'here',geometry());if(r.added.length)pendingInsert={id:n.id,index:idx,indices:r.added,origin:{x:n.x,y:n.y}};changed();refresh();openInspector('Object',false);focusPitch();note('Object duplicated. '+insertionMessage(n,r));
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
 const group=e.target.closest('[data-id]'),handle=e.target.closest('[data-rotate]'),stack=overlapAt(viewPoint(e));
 if(!group&&!handle&&!stack.length)return;
 groupIds.clear();groupMode=false;
 if(group&&!stack.some(o=>o.id===selected))selected=group.dataset.id;else if(!group&&!handle)selected=stack[0].id;
 $('stackOptions').hidden=stack.length<2;$('stackOptions').innerHTML=stack.length<2?'':'<small>Choose overlapping object</small>'+stack.map(o=>'<button data-stack-id="'+esc(o.id)+'">'+esc(objectName(o))+'</button>').join('');
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
 const stacked=e.target.closest('[data-stack-id]');if(stacked){selectObject(stacked.dataset.stackId);closeObjectMenu();return}
 const b=e.target.closest('[data-object-command]');if(!b)return;
 const command=b.dataset.objectCommand;closeObjectMenu();focusPitch();
 if(command==='left')rotateSelected(-15);else if(command==='right')rotateSelected(15);else if(command==='duplicate')duplicateSelected();else if(command==='route')toggleRoute();else if(command==='point')insertPathPoint();else if(command==='ball')beginBallPick();else if(command==='release')releaseBall();else deleteObject(command);
});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#objectMenu'))closeObjectMenu()},{capture:true});
window.addEventListener('resize',closeObjectMenu);
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&trainingPick){trainingPick=null;render();inspector();note('Placement finished.');e.preventDefault();return}
 if(e.key==='Escape'&&ballPicking){ballPicking=null;render();note('Ball selection cancelled.');e.preventDefault();return}
 if(e.key==='Escape'&&routeDrawing){finishRoute();e.preventDefault();return}
 if(e.key==='Escape'&&!$('objectMenu').hidden){closeObjectMenu();focusPitch();e.preventDefault();return}
 if(e.key==='Escape'&&(groupIds.size||groupMode)&&!isEditingKeyTarget(e.target)&&!document.querySelector('dialog[open]')){groupIds.clear();groupMode=false;render();inspector();e.preventDefault();return}
 if(e.key!=='Delete'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||isEditingKeyTarget(e.target)||!canEditObjects()||!activeObject())return;
 e.preventDefault();closeObjectMenu();deleteObject('here');
});


function historyButtons(){
 $('undoEdit').disabled=!history.canUndo;$('redoEdit').disabled=!history.canRedo;
}
function resetHistory(){setupPending=false;trainingPick=null;drill.frames.forEach(cleanTraining);groupIds.clear();groupMode=false;breakdownPreferred=null;breakdownView=null;arrivalSignature='';cleanContacts(drill.frames);cleanBreakdowns(drill.frames);sanitizeRoutes(drill.frames);syncPossession(drill.frames,geometry());history.reset(drill);historyButtons()}
function restoreHistory(direction){
 if(drag||document.querySelector('dialog[open]')||document.body.classList.contains('presentation-mode'))return;
 if(!requireAppliedSetup())return;const value=history[direction]();if(!value)return;
 drill=value;dirty=true;selected=null;groupIds.clear();groupMode=false;choose(Math.min(idx,drill.frames.length-1));historyButtons();note(direction==='undo'?'Undid last change.':'Redid last change.');
}
$('undoEdit').onclick=()=>restoreHistory('undo');$('redoEdit').onclick=()=>restoreHistory('redo');
document.addEventListener('keydown',e=>{
 if(!(e.ctrlKey||e.metaKey)||e.altKey||isEditingKeyTarget(e.target)||document.querySelector('dialog[open]'))return;
 const k=e.key.toLowerCase();
 if(k==='z'||k==='y'){e.preventDefault();restoreHistory(k==='y'||e.shiftKey?'redo':'undo')}
});
function previousObject(){return idx>0?drill.frames[idx-1].objects.find(o=>o.id===selected):null}
function selectedMovement(){const o=activeObject(),m=o&&!['decision','donut'].includes(o.type)&&movementFor(drill.frames[idx-1],f(),o,geometry());return m?.turnover||m?.instant||m?.presentation?null:m}
function ensureRoute(){
 if(!f().paths)f().paths=Object.create(null);
 if(!Object.hasOwn(f().paths,selected))Object.defineProperty(f().paths,selected,{value:{mode:'smooth',points:[],follow:false},enumerable:true,writable:true,configurable:true});
 return f().paths[selected];
}
function hasMovement(a,b,r){return !!(a&&b&&(Math.hypot(a.x-b.x,a.y-b.y)>1e-6||r?.points?.length))}
function canInsertPoint(){const o=preview===null?activeObject():null,r=o&&f().paths?.[o.id];const m=selectedMovement();return !routeDrawing&&!ballPicking&&!!o&&!!m&&hasMovement(m.start,m.end,r)&&(r?.points?.length||0)<64}
const addDecisionButton=document.createElement('button');addDecisionButton.id='addDecisionOnRoute';addDecisionButton.textContent='+ Add decision on path';$('routeHelp').before(addDecisionButton);addDecisionButton.onclick=()=>{const o=activeObject();if(!o||!decisionRoute(f(),drill.frames[idx-1],o.id,geometry()))return;trainingPick={kind:'anchor',id:o.id};showDecisions=true;$('decisionToggle').classList.add('selected');$('decisionToggle').setAttribute('aria-pressed','true');note('Click the running trajectory where the player makes a decision.');focusPitch();};
function updateRouteTools(){
 const o=preview===null?activeObject():null,route=o&&f().paths?.[o.id],m=o&&selectedMovement(),existing=!!(m&&(hasMovement(m.start,m.end,route)||route));
 $('routeTools').hidden=!(routeDrawing||existing);addDecisionButton.hidden=!existing||!canCarry(o)||routeDrawing||!!ballPicking;addDecisionButton.disabled=!!trainingPick;
 $('addPointSide').hidden=!canInsertPoint();$('addPointSide').disabled=!canInsertPoint();
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
 if(!canEditObjects()||!activeObject()||['decision','donut'].includes(activeObject().type))return;
 if(activeObject().type==='ball'){showPasses=true;$('passTrails').classList.add('selected');$('passTrails').setAttribute('aria-pressed','true')}
 if(isShield(activeObject())&&activeObject().ownerId){note('Move the shield holder or choose a new holder in the Object inspector.');return}
 if(activeObject().type==='ball'&&activeObject().ownerId){if(!selectedMovement()){note('The ball follows its carrier. Create a pass or release it first.');return}routeDrawing=true;routeClickCount=0;render();focusPitch();note('Click intermediate points on the pass path, then Finish path. The receiver is the destination.');return}
 if(!previousObject()){
  if(drill.frames.length>=150){note('Maximum of 150 steps reached.');return}
  const n=stripDecisions(clone(f()));n.name='Step '+(idx+2);n.seconds=2;n.notes='';n.timing={};n.paths={};
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

function selectedCarriedBall(){const o=activeObject();if(!o)return null;if(o.type==='ball')return carrier(f(),o)?o:null;return f().objects.find(b=>b.type==='ball'&&b.ownerId===o.id)||null}
function updateCarryControls(){const b=preview===null?selectedCarriedBall():null;$('carryTools').hidden=!b;for(const side of ['left','right']){const button=$(side==='left'?'carryLeft':'carryRight'),on=!!b&&carrySide(b)===side;button.classList.toggle('selected',on);button.setAttribute('aria-pressed',String(on));button.disabled=!b||routeDrawing||!!ballPicking}if(b)$('carryOwner').textContent='Carried by '+(carrier(f(),b).label||'player')+' · relative to facing direction'}
function changeCarrySide(side){if(!canEditObjects())return;const b=selectedCarriedBall();if(!b)return;if(setCarrySide(drill.frames,idx,b.id,side,geometry())){changed();render();tracks();note('Ball carry: front-'+side+'.')}}
$('carryLeft').onclick=()=>changeCarrySide('left');$('carryRight').onclick=()=>changeCarrySide('right');
function objectName(o){return (o.label||types[o.type][0])+((o.type==='ball'||isShield(o))&&carrier(f(),o)?' · '+(carrier(f(),o).label||'carried'):'')}
function overlapAt(p){const g=geometry();return frameObjects(f(),g).filter(o=>{const q=g.toView(o.x,o.y);return Math.hypot(p.x-q.x,p.y-q.y)<(o.type==='ball'?16:29)}).reverse()}
function selectObject(id){if(!f().objects.some(o=>o.id===id))return;trainingPick=null;groupIds.clear();groupMode=false;if(pendingInsert&&pendingInsert.id!==id)pendingInsert=null;selected=id;render();inspector();openInspector('Object',false)}
function updateObjectPicker(){const list=$('objectPicker'),isGroup=groupMode||groupIds.size>0;$('objectHeading').hidden=isGroup;list.hidden=isGroup;$('objectPanel').hidden=isGroup;const options='<option value="">Select an object…</option>'+f().objects.map(o=>'<option value="'+esc(o.id)+'">'+esc(objectName(o))+'</option>').join('');if(list.innerHTML!==options)list.innerHTML=options;list.value=selected||'';list.disabled=preview!==null||!!ballPicking||routeDrawing}
$('objectPicker').onchange=()=>{if($('objectPicker').value)selectObject($('objectPicker').value);else{selected=null;render();inspector()}};
let memberSignature='';
function updateContactTools(){
 const o=preview===null?activeObject():null,ok=!!o&&contactType(o.type);$('continueBreakdown').hidden=!ok||!validPhase(o?.breakdown?.phase);$('contactTools').hidden=!ok||!!(f().guide&&o?.id===f().guide.id+'-formation');if(!ok){memberSignature='';return}
 const details=$('currentFormationEdit'),key=o.id+':'+idx+':'+(o.breakdown?.phase||'');if(details.dataset.key!==key){details.dataset.key=key;details.open=o.type==='tackle'&&(!o.breakdown||o.breakdown.phase==='tackle')||!o.breakdown}
 const breakdown=validPhase(o.breakdown?.phase),near=contactCandidates(f(),o,geometry()),ids=new Set((o.members||[]).map(m=>m.id));
 const tackle=o.type==='tackle'&&(!breakdown||o.breakdown.phase==='tackle');
 const players=breakdown&&o.breakdown.phase!=='tackle'?[...candidates(f(),o,'attack'),...candidates(f(),o,'defence')]:f().objects.filter(canCarry),sig=JSON.stringify([o.id,idx,players.map(p=>[p.id,p.label]),[...ids],near.map(p=>p.id),o.breakdown?.tacklerIds,tackle]);
 if(sig!==memberSignature){
  memberSignature=sig;
  if(tackle){
   const r=roles(f(),o),ballHolders=f().objects.filter(x=>x.type==='ball'&&carrier(f(),x)).map(x=>carrier(f(),x)).filter(p=>team(p)),all=players.filter(p=>team(p));
   const primary=r.tacklerId||'',second=r.tacklerIds.find(id=>id!==primary)||'',car=r.carrierId||ballHolders[0]?.id||'';
   const option=(p,id)=>'<option value="'+esc(p.id)+'" '+(p.id===id?'selected':'')+'>'+esc(objectName(p))+'</option>';
   $('contactMembers').innerHTML='<label>Ball carrier<select id="tackleCarrier"><option value="">Choose ball carrier</option>'+all.map(p=>option(p,car)).join('')+'</select></label><label>Primary tackler<select id="primaryTackler"></select></label><label>Additional tackler (optional)<select id="additionalTackler"></select></label><small>Diagram only. Observe current age-grade and club contact rules; both tacklers must release. Existing later steps are not rewritten.</small>';
   const c=$('tackleCarrier'),p=$('primaryTackler'),x=$('additionalTackler');const opponents=()=>all.filter(v=>v.id!==c.value&&team(v)!==team(all.find(q=>q.id===c.value)));
   function fillSecond(wanted){const available=opponents().filter(v=>v.id!==p.value);x.innerHTML='<option value="">None</option>'+available.map(v=>option(v,wanted)).join('');x.value=available.some(v=>v.id===wanted)?wanted:''}
   function fillPrimary(wanted,extra){const available=opponents();p.innerHTML='<option value="">Choose tackler</option>'+available.map(v=>option(v,wanted)).join('');p.value=available.some(v=>v.id===wanted)?wanted:available.find(v=>near.some(q=>q.id===v.id))?.id||'';fillSecond(extra)}
   c.onchange=()=>fillPrimary(p.value,x.value);p.onchange=()=>fillSecond(x.value);fillPrimary(primary,second);
  }else $('contactMembers').innerHTML=players.map(p=>'<label><input type="checkbox" data-contact-player="'+esc(p.id)+'" '+((ids.size?ids.has(p.id):near.some(x=>x.id===p.id))?'checked':'')+'> '+esc(objectName(p))+'</label>').join('');
 }
 $('contactInfo').textContent=(breakdown?o.label||PHASES[o.breakdown.phase]:contactTitle(o.type))+' · '+(o.members?.length||0)+' arranged players';$('arrangeContact').disabled=routeDrawing||!!ballPicking;$('endContact').disabled=routeDrawing||!!ballPicking;
}
function arrangeMarker(o,explicit=null){if(f().guide&&o.id===f().guide.id+'-formation'){note('This is a guided formation. Move players or use the next guided stage.');return false}const result=arrangeContact(f(),o,geometry(),drill.frames[idx-1],explicit,drill.ageMin===10&&drill.ageMax===10);note(result.message);return result.ok}
$('arrangeContact').onclick=()=>{if(!canEditObjects())return;const o=activeObject();if(!contactType(o?.type))return;const ids=$('tackleCarrier')?[$('tackleCarrier').value,$('primaryTackler').value,$('additionalTackler').value].filter(Boolean):[...$('contactMembers').querySelectorAll('input:checked')].map(x=>x.dataset.contactPlayer);if($('tackleCarrier')&&(!$('tackleCarrier').value||!$('primaryTackler').value)){note('Choose a ball carrier and a primary tackler.');return}if(arrangeMarker(o,ids)){changed();memberSignature='';refresh()}};
$('endContact').onclick=()=>deleteObject('here');$('continueBreakdown').onclick=revealBreakdown;
function activeBreakdown(){return breakdownContext(drill.frames,idx,selected,breakdownPreferred).marker}
function revealBreakdown(){openInspector('Step',true);$('breakdownDock').focus({preventScroll:true});$('breakdownDock').scrollIntoView({block:'nearest'})}
function updateBreakdownDock(){
 const dock=$('breakdownDock'),nav=$('breakdownNav');
 if(preview!==null){dock.hidden=true;nav.hidden=true;return}
 const c=breakdownContext(drill.frames,idx,selected,breakdownPreferred);breakdownView=c;
 dock.hidden=!(c.marker||c.resume);nav.hidden=dock.hidden;
 $('breakdownResume').hidden=!!c.marker||!c.resume;
 $('breakdownTools').hidden=!c.marker;
 if(!c.marker){
  arrivalSignature='';
  if(c.resume){$('resumeBreakdown').textContent='Return to step '+(c.resume.index+1);$('resumeSummary').textContent='No breakdown in this step. Last unfinished: '+c.resume.label;nav.textContent='Resume breakdown'}
  return
 }
 breakdownPreferred=c.marker.id;nav.textContent='Breakdown';
 const choices=$('breakdownSelect'),opts=c.current.map((m,i)=>'<option value="'+esc(m.id)+'">'+esc(m.label||PHASES[m.breakdown.phase])+(c.current.length>1?' · '+(i+1):'')+'</option>').join('');
 $('breakdownSelectWrap').hidden=c.current.length<2;if(choices.innerHTML!==opts)choices.innerHTML=opts;choices.value=c.marker.id;
 $('breakdownSource').textContent='Step '+(idx+1)+' of '+drill.frames.length+' · '+(c.existing>=0?'next stage already exists':'continue from this step');
 updateBreakdownTools(c.marker);
 if(c.existing>=0){$('advanceBreakdown').textContent='Go to step '+(c.existing+1)+' · '+(drill.frames[c.existing].objects.find(o=>o.id===c.marker.id)?.label||'Next stage');$('advanceBreakdown').disabled=routeDrawing||!!ballPicking;$('arrivalChoices').hidden=true;$('arrivalOrderWrap').hidden=true;$('retainedArrivals').hidden=true;$('breakdownError').textContent=''}
}
$('breakdownSelect').onchange=()=>{breakdownPreferred=$('breakdownSelect').value;selected=breakdownPreferred;arrivalSignature='';render();inspector()};
$('breakdownNav').onclick=revealBreakdown;
$('resumeBreakdown').onclick=()=>{if(!canEditObjects())return;const r=breakdownView?.resume;if(!r)return;breakdownPreferred=r.id;choose(r.index);revealBreakdown()};
$('selectBreakdownMarker').onclick=()=>{const m=activeBreakdown();if(m&&canEditObjects()){selectObject(m.id);openInspector('Object',true)}};

let arrivalSignature='';
function existingArrivals(frame,o){const eligible=new Set([...candidates(frame,o,'attack'),...candidates(frame,o,'defence')].map(p=>p.id));return [...new Set((o.members||[]).map(m=>m.id).filter(id=>eligible.has(id)))]}
function updateBreakdownTools(o){
 const phase=o.breakdown?.phase,next=nextPhase(phase);$('breakdownTools').hidden=!validPhase(phase);
 if(!validPhase(phase)){arrivalSignature='';$('arrivalChoices').hidden=true;return}
 $('breakdownPhase').textContent=o.label||PHASES[phase];
 $('arrivalOrderWrap').hidden=phase!=='release';const order=$('arrivalOrder');
 if(phase==='release'&&order.dataset.marker!==o.id+':'+idx){order.dataset.marker=o.id+':'+idx;order.value=o.breakdown?.arrivalSide||'defence'}
 const side=phase==='release'?order.value:o.breakdown?.arrivalSide||'attack';
 $('advanceBreakdown').textContent=next?'Next: '+(next==='support'?supportTitle(side):next==='ruck'&&side==='defence'?'Clearout · ruck formed':PHASES[next]):'Sequence complete';
 $('advanceBreakdown').disabled=!next||routeDrawing||!!ballPicking;
 const current=next&&next!=='release'&&next!=='support'?existingArrivals(f(),o):[];
 const attack=candidates(f(),o,'attack'),defence=candidates(f(),o,'defence'),u10=drill.ageMin===10&&drill.ageMax===10;
 const eligible=next==='support'?candidates(f(),o,side):next&&next!=='release'?[...attack,...defence].filter(p=>!current.includes(p.id)&&(!u10||!(attack.some(a=>a.id===p.id)?attack:defence).some(a=>current.includes(a.id)))):[];
 const sig=JSON.stringify([o.id,idx,phase,side,current,eligible.map(p=>[p.id,p.label])]);
 if(sig!==arrivalSignature){
  arrivalSignature=sig;$('breakdownError').textContent='';
  $('arrivalList').innerHTML=eligible.map(p=>'<label><input type="checkbox" data-arrival="'+esc(p.id)+'"> '+esc(objectName(p))+'</label>').join('');
 }
 $('retainedArrivals').hidden=!current.length;
 $('retainedArrivals').textContent=current.length?'Already involved: '+current.map(id=>objectName(f().objects.find(p=>p.id===id))).join(', ')+' · retained automatically.':'';
 $('arrivalChoices').hidden=!eligible.length;
 $('arrivalPrompt').textContent=next==='support'?(side==='defence'?'Choose arriving defender(s)':'Choose arriving attacker(s)'):next==='ruck'?'Choose additional players to form the ruck':'Optional additional arrivals';
}
function nextBreakdownStep(marker){
 if(!canEditObjects()||!marker?.breakdown||!f().objects.some(o=>o===marker))return;
 const context=breakdownContext(drill.frames,idx,marker.id,marker.id);if(context.existing>=0){breakdownPreferred=marker.id;choose(context.existing);revealBreakdown();return}
 const phase=nextPhase(marker.breakdown.phase);if(!phase||drill.frames.length>=150)return;
 const frame=stripDecisions(clone(f()));frame.name=PHASES[phase];frame.seconds=phase==='release'?.8:1.5;frame.notes='';frame.timing={};frame.paths={};
 const m=frame.objects.find(o=>o.id===marker.id);let ids=phase==='release'?[]:[...$('arrivalList').querySelectorAll('input:checked')].map(x=>x.dataset.arrival);
 if(['ruck','contest','secured'].includes(phase))ids=[...new Set([...existingArrivals(f(),marker),...ids])];
 const side=phase==='support'?$('arrivalOrder').value:phase==='release'?'defence':m.breakdown.arrivalSide||'attack';
 if(phase==='support')ids=ids.filter(id=>candidates(frame,m,side).some(o=>o.id===id));
 const res=advance(frame,m,geometry(),phase,ids,drill.ageMin===10&&drill.ageMax===10,side);
 if(!res.ok){$('breakdownError').textContent=res.message;note(res.message);return}
 frame.name=res.message;
 drill.frames.splice(idx+1,0,frame);idx++;breakdownPreferred=m.id;sanitizeRoutes(drill.frames);changed();choose(idx);revealBreakdown();note(res.message);
}
$('arrivalOrder').onchange=()=>{const o=activeBreakdown();if(o?.breakdown?.phase==='release')updateBreakdownDock()};
$('advanceBreakdown').onclick=()=>nextBreakdownStep(activeBreakdown());


$('autoContact').checked=autoContact;$('autoContact').onchange=()=>{autoContact=$('autoContact').checked;try{localStorage.setItem('rugby-auto-contact',autoContact?'on':'off')}catch{}};
function turnoverCaption(objects,g,i){if(i<1)return false;const before=drill.frames[i-1],after=drill.frames[i],progress=preview===null?1:locate(preview).p;return after.objects.some(o=>o.type==='ball'&&o.transferKind==='turnover'&&o.ownerId&&before.objects.find(a=>a.id===o.id)?.ownerId!==o.ownerId&&progress*100>=(after.timing?.[o.id]?.end??100)&&objects.some(x=>x.id===o.id))}
function selectedShield(){const o=activeObject();return isShield(o)?o:f().objects.find(s=>isShield(s)&&s.ownerId===o?.id)||null}
function updateShieldTools(){const o=preview===null?activeObject():null,s=o?selectedShield():null,p=carrier(f(),s),player=canCarry(o)?o:null;const panel=$('shieldTools');panel.hidden=!s&&!player;
 const options='<option value="">On the ground</option>'+f().objects.filter(x=>canCarry(x)&&!f().objects.some(q=>isShield(q)&&q.id!==s?.id&&q.ownerId===x.id)).map(x=>'<option value="'+esc(x.id)+'">'+esc(objectName(x))+'</option>').join('');
 const sel=$('shieldHolder');if(sel.innerHTML!==options)sel.innerHTML=options;sel.value=p?.id||'';sel.disabled=!s||routeDrawing||!!ballPicking;
 $('shieldExtend').hidden=isShield(o)||!missingInScope(s,'all');$('extendShieldOnward').disabled=!missingInScope(s,'onward')||routeDrawing||!!ballPicking;$('extendShieldAll').disabled=!missingInScope(s,'all')||routeDrawing||!!ballPicking;
 $('shieldHolderWrap').hidden=!s;$('shieldEquip').hidden=!!s||!player;$('shieldEquip').disabled=!player||routeDrawing||!!ballPicking;
 $('shieldStatus').textContent=s?(p?'Held by '+(p.label||'player'):'Free shield · drag onto a player'):'Add a shield to this player.';
}
function changeShieldHolder(id){
 if(!canEditObjects())return;let s=selectedShield();if(!s)return;const old=carrier(f(),s);if((old?.id||'')===id)return;
 if(id&&(!canCarry(f().objects.find(o=>o.id===id))||f().objects.some(o=>isShield(o)&&o.id!==s.id&&o.ownerId===id)))return;
 if(old&&idx&&drill.frames[idx-1].objects.find(o=>o.id===s.id)?.ownerId!==old.id){if(drill.frames.length>=150)return;const n=stripDecisions(clone(f()));n.name=id?'Shield handover':'Put shield down';n.seconds=1;n.notes='';n.timing={};n.paths={};drill.frames.splice(idx+1,0,n);idx++;s=n.objects.find(o=>o.id===s.id)}
 if(assignShield(drill.frames,idx,s.id,id||null,geometry())){if(pendingInsert?.id===s.id&&pendingInsert.index===idx){syncInsertedCopies(drill.frames,pendingInsert.indices,s,pendingInsert.origin,geometry());pendingInsert=null}if(idx){f().timing[s.id]={start:79,end:80};delete f().paths[s.id]}selected=s.id;changed();refresh();note(id?'Shield assigned to '+(f().objects.find(o=>o.id===id)?.label||'player')+'.':'Shield placed on ground.')}
}
$('shieldHolder').onchange=()=>changeShieldHolder($('shieldHolder').value);
$('shieldEquip').onclick=()=>{if(!canEditObjects())return;const p=activeObject();if(!canCarry(p)||selectedShield())return;const s=obj(uid(),'shieldItem','',p.x,p.y,p.rot);if(f().objects.length>=200){note('Maximum objects in this step reached.');return}f().objects.push(s);assignShield(drill.frames,idx,s.id,p.id,geometry());const r=fillMissing(drill.frames,idx,s,$('insertScope').value,geometry());selected=p.id;changed();refresh();note('Shield equipped. '+insertionMessage(s,r))};
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
 const recipients=$('recipientChoice'),rOptions='<option value="">Choose recipient by name…</option>'+f().objects.filter(o=>canCarry(o)&&o.id!==owner?.id).map(o=>'<option value="'+esc(o.id)+'">'+esc(objectName(o))+'</option>').join('');if(recipients.innerHTML!==rOptions)recipients.innerHTML=rOptions;recipients.hidden=!ballPicking;recipients.disabled=!ballPicking;recipients.value='';
 
 $('autoAttach').checked=autoAttach;$('autoAttach').disabled=!enabled||!!ballPicking;
 const text=ballPicking?'Choose a recipient on the pitch or by name (Esc cancels).':owner?'Carried by '+(owner.label||types[owner.type][0]):b?autoAttach?'Free ball · drop onto a player':'Ball is free':'Add a rugby ball to begin.';
 $('ballSideStatus').textContent=text;
 
 $('attachBallSide').disabled=!enabled||!b||!!owner||!!ballPicking&&ballPickKind==='turnover';$('passBallSide').disabled=!enabled||!b||!owner||!!ballPicking&&ballPickKind==='turnover';$('turnoverSide').disabled=!enabled||!b||!!ballPicking&&ballPickKind!=='turnover';$('turnoverLabel').textContent=ballPicking&&ballPickKind==='turnover'?'Cancel':'Turnover';$('turnoverSide').classList.toggle('selected',!!ballPicking&&ballPickKind==='turnover');
 $('attachBallSideLabel').textContent=ballPicking&&!owner?'Cancel':'Attach ball';$('passBallSideLabel').textContent=ballPicking&&owner?'Cancel':'Pass ball';
 $('attachBallSide').classList.toggle('selected',!!ballPicking&&!owner);$('passBallSide').classList.toggle('selected',!!ballPicking&&!!owner);
 $('releaseBallSide').disabled=!enabled||!owner||!!ballPicking;
 $('selectBallSide').disabled=!enabled||!!ballPicking;$('selectBallSideLabel').textContent=b?'Select ball':'Add ball';$('selectBallSide').hidden=!b||!!ballPicking;
 // One primary transfer action for the current ball state. Retain the active action as Cancel.
 $('attachBallSide').hidden=!b||!!owner||!!ballPicking&&ballPickKind==='turnover';$('passBallSide').hidden=!b||!owner||!!ballPicking&&ballPickKind==='turnover';$('turnoverSide').hidden=!b||!!ballPicking&&ballPickKind!=='turnover';$('releaseBallSide').hidden=!owner||!!ballPicking;
 pitch.classList.toggle('picking-ball',!!ballPicking);
}
$('autoAttach').onchange=()=>{autoAttach=$('autoAttach').checked;try{localStorage.setItem('rugby-auto-attach',autoAttach?'on':'off')}catch{}render()};
$('ballChoice').onchange=()=>{ballPicking=null;ballChoiceId=$('ballChoice').value;selected=ballChoiceId;render();inspector();openInspector('Object',false)};
$('selectBallSide').onclick=()=>{if(!canEditObjects())return;const b=chosenBall();if(!b){add('ball');return}selected=ballChoiceId=b.id;render();inspector();openInspector('Object',false);focusPitch()};
function beginBallPick(kind='pass'){
 if(ballPicking){ballPicking=null;render();return}
 if(!canEditObjects())return;const b=chosenBall();if(!b)return;
 groupIds.clear();groupMode=false;ballPickKind=kind==='turnover'?'turnover':'pass';selected=ballChoiceId=b.id;ballPicking=b.id;render();inspector();focusPitch();note(kind==='turnover'?'Choose the new ball carrier (turnover).':'Choose a player for '+(carrier(f(),b)?'the pass.':'ball attachment.'));
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
  const n=stripDecisions(clone(f()));n.name=(ballPickKind==='turnover'?'Turnover to ':'Pass to ')+(target.label||'player');n.seconds=2;n.notes='';n.timing={};n.paths={};drill.frames.splice(idx+1,0,n);idx++;ball=n.objects.find(o=>o.id===b.id);sanitizeRoutes(drill.frames);
 }
 assignPossession(drill.frames,idx,ball.id,targetId,geometry());if(pendingInsert?.id===ball.id&&pendingInsert.index===idx){syncInsertedCopies(drill.frames,pendingInsert.indices,ball,pendingInsert.origin,geometry());pendingInsert=null}selected=ballChoiceId=ball.id;
 if(ballPickKind==='turnover'){ball.transferKind='turnover';if(idx){f().timing[ball.id]={start:79,end:80};if(f().paths)delete f().paths[ball.id]}}
 else{delete ball.transferKind;delete ball.groundState;if(idx&&from){f().timing[ball.id]={start:35,end:70};if(f().paths)delete f().paths[ball.id]}}
 showPasses=true;$('passTrails').classList.add('selected');$('passTrails').setAttribute('aria-pressed','true');
 changed();refresh();focusPitch();note(ballPickKind==='turnover'?'Possession changed without a pass.':from?'Pass created. Adjust its timing or path.':'Ball attached. It follows the player.');
}
function releaseBall(){
 if(!canEditObjects())return;const b=chosenBall(),p=carrier(f(),b);if(!p)return;
 assignPossession(drill.frames,idx,b.id,null,geometry());delete b.transferKind;
 if(idx&&drill.frames[idx-1].objects.some(o=>o.id===b.id&&o.ownerId)){f().timing[b.id]={start:99,end:100};if(f().paths)delete f().paths[b.id]}
 selected=ballChoiceId=b.id;changed();refresh();focusPitch();note('Ball released at its current position. You can move it independently.');
}
$('attachBallSide').onclick=$('passBallSide').onclick=()=>beginBallPick('pass');$('turnoverSide').onclick=()=>beginBallPick('turnover');$('recipientChoice').onchange=()=>{if(ballPicking&&$('recipientChoice').value)finishBallPick($('recipientChoice').value)};
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
 if(trainingPick){handleTrainingPick(e);e.preventDefault();return}
 if(ballPicking){const owner=carrier(f(),chosenBall()),players=overlapAt(viewPoint(e)).filter(o=>canCarry(o)&&o.id!==owner?.id);if(players.length===1)finishBallPick(players[0].id);else if(players.length>1){$('recipientChoice').focus();note('Several players overlap. Choose the recipient by name in Actions.')}e.preventDefault();return}
 if(routeDrawing){addRoutePoint(e);e.preventDefault();return}
 const dp=e.target.closest('[data-dp-point]');if(dp&&activeObject()?.type==='decision'){const o=activeObject(),i=Number(dp.dataset.dpOption),k=Number(dp.dataset.dpPoint),option=o.decision.options[i];if(!option?.points[k])return;if(e.altKey){option.points.splice(k,1);changed();render();inspector();return}drag={id:o.id,kind:'decision-waypoint',option:i,index:k,pointerId:e.pointerId,moved:false};pitch.setPointerCapture(e.pointerId);e.preventDefault();return;}
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
 if(path&&!groupMode&&!groupIds.size){const id=path.dataset.pathId;if(id!==selected){selected=id;render();inspector();openInspector('Object',false);note('Path selected. Drag the line or a + handle to bend it.')}else{insertPathPoint(viewPoint(e),null,e)}e.preventDefault();return}
 const g=e.target.closest('[data-id]');
 if(!g){selected=null;groupIds.clear();render();inspector();return}
 const hit=f().objects.find(o=>o.id===g.dataset.id),gp=groupTarget(hit);
 if((e.ctrlKey||e.metaKey)&&gp){if(!groupIds.size){const prior=groupTarget(activeObject());if(prior)groupIds.add(prior.id)}groupMode=true;toggleGroupPlayer(hit);e.preventDefault();return}
 if(gp&&groupIds.has(gp.id)){const items=groupSnapshot(f(),[...groupIds],geometry());drag={id:gp.id,kind:'group',items,pointerId:e.pointerId,origin:viewPoint(e),moved:false};pitch.setPointerCapture(e.pointerId);e.preventDefault();return}
 if(groupMode&&gp){toggleGroupPlayer(hit);e.preventDefault();return}
 groupIds.clear();groupMode=false;selected=g.dataset.id;
 if(pendingInsert&&pendingInsert.id!==selected)pendingInsert=null;
 const o=f().objects.find(x=>x.id===selected);if(!o)return;
 render();inspector();openInspector('Object',false);
 // Clicking a carried ball still selects it for passing; dragging it moves its carrier.
 const owner=o.type==='ball'||isShield(o)?carrier(f(),o):null,moving=owner||o,p=point(e),scope=$('moveScope').value;
 if(scope!=='here'&&(!canPropagate(f(),moving)||scope==='entire'&&!canEntire(moving))){note('Choose Current step only for this object or contact formation.');e.preventDefault();return}
 drag={id:moving.id,scope,kind:o.type==='decision'&&o.decision?.anchor!==null&&decisionRoute(f(),drill.frames[idx-1],o.decision?.playerId,geometry())?'decision-anchor':'move',pointerId:e.pointerId,dx:moving.x-p.x,dy:moving.y-p.y,moved:false,contact:null,origin:viewPoint(e),originalPosition:{x:moving.x,y:moving.y}};
 if(owner)note((isShield(o)?'Shield':'Ball')+' attached to '+(owner.label||'player')+' · drag to move both.');
 pitch.setPointerCapture(e.pointerId);
 e.preventDefault();
});
pitch.addEventListener('pointermove',e=>{
 if(trainingPick?.kind==='roll'&&!drag){const lane=$('donutLanePreview'),pad=f().objects.find(o=>o.id===trainingPick.id);if(lane&&pad)lane.innerHTML=donutLaneOverlay(pad,geometry(),viewPoint(e));return}
 if(!drag||e.pointerId!==drag.pointerId)return;
 const o=f().objects.find(x=>x.id===drag.id);if(!o)return;
 if(drag.kind==='group'){
  const q=viewPoint(e),rawX=q.x-drag.origin.x,rawY=q.y-drag.origin.y;if(!drag.moved&&Math.hypot(rawX,rawY)<3)return;
  const g=geometry(),anchor=drag.items.find(x=>x.id===drag.id),target=anchor&&placement(g.fromView(anchor.x+rawX,anchor.y+rawY),e.shiftKey),snap=target&&g.toView(target.x,target.y);const dx=snap?snap.x-anchor.x:rawX,dy=snap?snap.y-anchor.y:rawY;
  for(const p of groupTranslate(drag.items,dx,dy,g))Object.assign(f().objects.find(o=>o.id===p.id),p);
 }else if(drag.kind==='decision-waypoint'){const p=o.decision.options[drag.option]?.points[drag.index];if(!p)return;Object.assign(p,placement(point(e),e.shiftKey));
 }else if(drag.kind==='decision-anchor'){const g=geometry(),route=decisionRoute(f(),drill.frames[idx-1],o.decision.playerId,g);if(!route)return;o.decision.anchor=decisionFraction(route,viewPoint(e));const q=decisionLocation(f(),o,g,drill.frames[idx-1]);Object.assign(o,g.fromView(q.x,q.y));
 }else if(drag.kind==='waypoint'){
  const q=point(e),p=ensureRoute().points[drag.index];if(!p)return;
  const pos=placement(q,e.shiftKey);if(Math.abs(pos.x-p.x)<1e-8&&Math.abs(pos.y-p.y)<1e-8)return;Object.assign(p,pos);
 }else if(drag.kind==='rotate'){
  const g=geometry(),angle=rotationFromPointer(g.toView(o.x,o.y),viewPoint(e),g.rotation,e.shiftKey?15:1);
  if(angle===null||angle===o.rot)return;
  o.rot=angle;
  const box=$('objRot')||$('donutRot');if(box)box.value=o.rot;
 }else{
  const p=point(e),raw={x:p.x+drag.dx,y:p.y+drag.dy},v=viewPoint(e);
  if(!drag.moved&&Math.hypot(v.x-drag.origin.x,v.y-drag.origin.y)<3)return;
  const {x,y}=placement(raw,e.shiftKey);
  const before=drag.contact;
  drag.contact=(!drag.scope||drag.scope==='here')&&autoAttach&&!e.altKey?(isShield(o)?shieldTarget(f(),o,raw,geometry())||shieldTarget(f(),o,{x,y},geometry()):contactTarget(f(),o,raw,geometry())||contactTarget(f(),o,{x,y},geometry())):null;
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
  const {ballId,shieldId,playerId}=gesture.contact,b=f().objects.find(o=>o.id===ballId),player=f().objects.find(o=>o.id===playerId);
  if(shieldId&&assignShield(drill.frames,idx,shieldId,playerId,geometry(),gesture.originalPosition)){selected=playerId;attached=true;if(idx)f().timing[shieldId]={start:99,end:100};note('Shield attached to '+(player.label||'player')+'.')}
  if(b&&!carrier(f(),b)&&canCarry(player)){
   // Moving a player to a free ball is a pickup, not a pass.
   const pickup=gesture.id===playerId;
   if(idx&&f().paths)delete f().paths[ballId];
   const n=assignPossession(drill.frames,idx,ballId,playerId,geometry(),pickup?null:gesture.originalPosition);
   if(n){
    delete b.transferKind;
    if(idx&&drill.frames[idx-1].objects.some(o=>o.id===ballId&&!o.ownerId)){
     f().timing[ballId]=pickup?{start:99,end:100}:{start:0,end:100};
    }
    selected=playerId;ballChoiceId=ballId;attached=true;
    note('Ball attached to '+(player.label||'player')+' · move either to move both.');
   }
  }
 }
 const marker=f().objects.find(o=>o.id===gesture.id);
 if(e.type==='pointerup'&&gesture.kind==='move'&&gesture.moved&&marker&&gesture.scope&&gesture.scope!=='here'){
  const result=propagatePosition(drill.frames,idx,marker.id,gesture.originalPosition,gesture.scope);
  if(!result.ok){Object.assign(marker,gesture.originalPosition);pendingInsert=null;changed();render();inspector();tracks();note(result.reason);return}
  pendingInsert=null;changed();render();inspector();tracks();note('Position updated in '+(1+result.count)+' step'+(result.count?'s':'')+(result.stop!==null?' · stopped before step '+(result.stop+1)+': '+result.reason+'.':'.')+' Undo reverses the whole edit.');return;
 }
 if(pendingInsert?.id===gesture.id&&pendingInsert.index===idx&&marker&&(gesture.moved||attached)){
  const result=syncInsertedCopies(drill.frames,pendingInsert.indices,marker,pendingInsert.origin,geometry());pendingInsert.origin={x:marker.x,y:marker.y};if(attached||marker.ownerId)pendingInsert=null;if(result.skipped)note('Attached here; '+result.skipped+' copies skipped because the holder is unavailable.');
 }if(e.type==='pointerup'&&gesture.kind==='move'&&gesture.moved&&autoContact&&!e.altKey&&contactType(marker?.type))arrangeMarker(marker,marker.members?.length?marker.members.map(m=>m.id):null);
 if(gesture.moved||attached){changed();render();inspector();tracks()}
 else if(gesture.contact)render();
}
pitch.addEventListener('pointerup',finishDrag);
pitch.addEventListener('pointercancel',finishDrag);
pitch.addEventListener('lostpointercapture',finishDrag);
$('stepName').onchange=()=>{editMode();f().name=$('stepName').value||'Step';changed();refresh()};$('stepTime').onchange=()=>{if(!idx)return;editMode();f().seconds=clamp(Number($('stepTime').value)||1,.5,30);changed();refresh()};$('stepNotes').onchange=()=>{editMode();f().notes=$('stepNotes').value;changed();refresh()};$('scenes').onclick=e=>{let b=e.target.closest('[data-step]');if(b){choose(Number(b.dataset.step));openInspector('Step',false)}};$('addStep').onclick=()=>{editMode();if(drill.frames.length>=150){note('Maximum of 150 steps reached.');return}let n=stripDecisions(clone(f()));if(n.guide&&n.guide.stage===GAME_PHASES[n.guide.kind]?.stages.length-1)delete n.guide;for(const b of n.objects.filter(o=>o.type==='ball'))delete b.transferKind;n.name='Step '+(idx+2);n.seconds=2;n.notes='';n.timing={};n.paths={};drill.frames.splice(idx+1,0,n);sanitizeRoutes(drill.frames);changed();choose(idx+1)};$('deleteStep').onclick=()=>{if(drill.frames.length<2)return;editMode();drill.frames.splice(idx,1);drill.frames[0].seconds=0;sanitizeRoutes(drill.frames);changed();choose(Math.min(idx,drill.frames.length-1))};$('back').onclick=()=>choose(idx-1);$('forward').onclick=()=>choose(idx+1);$('restart').onclick=()=>choose(0);$('trails').onclick=()=>{showPaths=!showPaths;$('trails').classList.toggle('selected',showPaths);$('trails').setAttribute('aria-pressed',String(showPaths));render()};$('grid').onclick=()=>{showGrid=!showGrid;syncGrid();render()};$('snapGrid').onclick=()=>{gridPrefs.snap=!gridPrefs.snap;syncGrid();note(gridPrefs.snap?'Snap on · '+gridPrefs.step+' m spacing. Hold Shift for free movement.':'Snap off · free movement.');};$('gridStep').onchange=()=>{gridPrefs.step=gridStep($('gridStep').value);syncGrid();render();note('Grid spacing set to '+gridPrefs.step+' m. Existing positions unchanged.')};$('orientation').onclick=()=>{orientation=orientation==='up'?'right':'up';$('orientation').textContent=orientation==='up'?'View ↕':'View ↔';render()};$('scrub').oninput=()=>{ballPicking=null;routeDrawing=false;stop();preview=Number($('scrub').value);render();inspector();note('Preview mode. Select a step to resume editing.')};$('play').onclick=()=>{trainingPick=null;ballPicking=null;if(routeDrawing)finishRoute();if(playing){stop();return}if(duration()<=0){note('Add a second step to animate the drill.');return}let base=preview??at(idx);if(base>=duration()-.01)base=0;preview=base;playing=true;$('play').textContent='Ⅱ Pause';clock=performance.now();function tick(now){if(!playing)return;preview=Math.min(duration(),preview+(now-clock)/1000*Number($('speed').value));clock=now;render();if(preview>=duration()){stop();return}raf=requestAnimationFrame(tick)}raf=requestAnimationFrame(tick);note('Playing the drill. Select a step to edit.');inspector()};function download(name,body,type){const url=URL.createObjectURL(new Blob([body],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}const filename=()=>drill.title.replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'')||'rugby-drill';$('export').onclick=()=>{if(requireAppliedSetup()){download(filename()+'.json',JSON.stringify(drill,null,2),'application/json');$('shareStatus').textContent='Editable drill JSON exported.'}};$('png').onclick=()=>{if(!requireAppliedSetup())return;const scene=renderScene(drill,{...shareOptions(),index:idx});download(filename()+'-step-'+(idx+1)+'.svg',scene.svg,'image/svg+xml');$('shareStatus').textContent='Step '+(idx+1)+' SVG exported.'};function stored(){try{return JSON.parse(localStorage.getItem('rugby-studio-v1')||'[]')}catch{return []}}$('save').onclick=()=>{if(!requireAppliedSetup())return;try{let lib=stored().filter(x=>x.id!==drill.id);lib.unshift(clone(drill));localStorage.setItem('rugby-studio-v1',JSON.stringify(lib));dirty=false;$('save').textContent='Save drill';note('Saved in this browser. Export JSON to share or back up.')}catch(e){note('Browser storage unavailable. Use Export JSON.')}};function confirmLeave(){return !(dirty||setupPending)||confirm('You have unsaved or unapplied changes. Continue without saving?')}$('new').onclick=()=>{if(!confirmLeave())return;drill=enrich(blank());dirty=false;selected=null;$('moveScope').value='here';resetHistory();choose(0);openInspector('Drill',true)};function libraryItems(){return [...stored().map(x=>({d:enrich(x),mine:true})),...SEEDS.map(d=>({d,mine:false}))]}function mini(d){
 const objects=d.frames[0]?frameObjects(d.frames[0],pitchGeometry(d.length,d.width,'up')):[];
 if(!objects.length)return '<svg class="mini" viewBox="0 0 250 90"><text x="125" y="48" fill="#d4e6c9" font-size="11" text-anchor="middle">Coaching card · diagram not yet built</text></svg>';
 const g=pitchGeometry(d.length,d.width,'up'),m=g.margin;
 return `<svg class="mini" viewBox="0 0 ${g.viewWidth} ${g.viewHeight}" preserveAspectRatio="xMidYMid meet"><rect width="${g.viewWidth}" height="${g.viewHeight}" fill="#203b2b"/><rect x="${m}" y="${m}" width="${g.fw}" height="${g.fh}" fill="#326844" stroke="#d4e6c9" stroke-width="4"/>${objects.map(o=>{const p=g.toView(o.x,o.y);return `<g transform="translate(${p.x} ${p.y}) rotate(${o.rot}) scale(1.4)">${shape(o.type)}</g>`}).join('')}</svg>`;
}function renderLibrary(){const q=$('searchLib').value.trim().toLowerCase(),age=Number($('filterAge').value),cat=$('filterCat').value,mode=$('filterMode').value;let items=libraryItems().filter(({d,mine})=>(!age||d.ageMin<=age&&d.ageMax>=age)&&(!cat||d.category===cat)&&(!mode||mode==='animated'&&d.frames.length>1||mode==='saved'&&mine)&&(!q||[d.title,d.objective,d.equipment,d.instructions,d.coaching,d.notes,d.provenance,...d.links.map(l=>l.label)].join(' ').toLowerCase().includes(q)));$('libraryCount').textContent=`${items.length} matching · ${SEEDS.length} starter cards · ${stored().length} saved locally`;$('libraryRows').innerHTML=items.map(({d,mine})=>`<article class="drillcard">${mini(d)}<div class="tag">${mine?'MY SAVED DRILL':d.frames.length>1?'ANIMATED STARTER':'STARTER CARD'} · ${esc(d.category)}</div><h3>${esc(d.title)}</h3><p>U${d.ageMin}–U${d.ageMax} · ${d.minutes} min · ${esc(d.players||'Flexible')}</p><p>${esc(d.objective)}</p><p>${esc(d.review)} · ${d.links.length} links</p><div class="flex"><button data-load="${esc(d.id)}" data-mine="${mine}">Open${mine?'':' copy'}</button><button data-card="${esc(d.id)}" data-mine="${mine}">Read card</button>${mine?`<button data-remove="${esc(d.id)}">Delete</button>`:''}</div></article>`).join('')||'<p class="muted">No matching drills. Try a different filter.</p>'}function openLibrary(){renderLibrary();$('libraryDialog').showModal()}$('filterAge').innerHTML+=Array.from({length:11},(_,i)=>`<option value="${i+6}">U${i+6}</option>`).join('');$('filterCat').innerHTML+=CATEGORIES.map(c=>`<option>${c}</option>`).join('');for(let k of ['searchLib','filterAge','filterCat','filterMode'])$(k).oninput=renderLibrary;$('library').onclick=openLibrary;$('closeLibrary').onclick=()=>$('libraryDialog').close();$('libraryRows').onclick=e=>{let b=e.target.closest('[data-load],[data-card],[data-remove]');if(!b)return;if(b.dataset.remove){if(confirm('Delete this saved local drill?')){try{localStorage.setItem('rugby-studio-v1',JSON.stringify(stored().filter(x=>x.id!==b.dataset.remove)));renderLibrary()}catch{note('Could not delete local drill.')}}return}if(!confirmLeave())return;let key=b.dataset.load||b.dataset.card;let d=b.dataset.mine==='true'?stored().find(x=>x.id===key):SEEDS.find(x=>x.id===key);if(d){drill=b.dataset.mine==='true'?enrich(d):freshSeed(d);dirty=false;selected=null;resetHistory();$('libraryDialog').close();choose(0);if(b.dataset.card)openDetails()}};function openDetails(){if(!requireAppliedSetup())return;$('viewMenu').open=false;enrich(drill);$('cardTitle').textContent=drill.title;$('cardMeta').textContent=`${drill.category} · ${drill.frames.length>1?'Animated demonstration':'Coaching card; diagram can be created'}`;$('cardSource').textContent=drill.provenance+' '+drill.review;for(let k of fields)$(k).value=drill[k];$('cardSetupSummary').textContent=(drill.ageMin===drill.ageMax?'U'+drill.ageMin:'U'+drill.ageMin+'–U'+drill.ageMax)+' · '+drill.minutes+' min · '+drill.length+' × '+drill.width+' m';$('cardObjective').value=drill.objective;$('cardSafety').value=drill.safety;$('linkStatus').textContent='';renderLinks();$('detailsDialog').showModal()}function syncCard(){for(let k of fields)drill[k]=$(k).value;drill.objective=$('cardObjective').value;drill.safety=$('cardSafety').value;changed();refresh()}$('details').onclick=openDetails;for(let k of [...fields,'cardObjective','cardSafety'])$(k).onchange=syncCard;$('closeDetails').onclick=()=>$('detailsDialog').close();$('cardEditSetup').onclick=()=>{$('detailsDialog').close();openInspector('Drill',true)};function renderLinks(){$('linkRows').innerHTML=drill.links.length?drill.links.map((l,i)=>`<div class="linkrow"><div><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a><small>${esc(l.kind)} · ${esc(new URL(l.url).hostname)}</small></div><button data-unlink="${i}">Remove</button></div>`).join(''):'<small>No links yet. Add a video or coaching source.</small>'}$('addLink').onclick=()=>{const u=safeURL($('linkURL').value.trim());if(!u){$('linkStatus').textContent='Enter a valid http or https URL.';return}drill.links.push({url:u,label:$('linkLabel').value.trim()||u,kind:$('linkKind').value});$('linkURL').value='';$('linkLabel').value='';$('linkStatus').textContent='Link added.';changed();renderLinks()};$('linkRows').onclick=e=>{let b=e.target.closest('[data-unlink]');if(!b)return;drill.links.splice(Number(b.dataset.unlink),1);changed();renderLinks()};$('backup').onclick=()=>download('rugby-my-library.json',JSON.stringify({version:1,kind:'rugby-library',drills:stored()},null,2),'application/json');$('resources').onclick=()=>{$('resourceRows').innerHTML=RESOURCES.map(([country,title,url])=>`<div class="resource-row"><small>${esc(country)}</small><div><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a></div><p class="muted">${esc(EMPHASIS[country]||'')}</p></div>`).join('');$('resourceDialog').showModal()};$('closeResources').onclick=()=>$('resourceDialog').close();$('import').onclick=()=>$('file').click();function validate(d){if(!d||d.version!==1||!Array.isArray(d.frames)||!d.frames.length||d.frames.length>150)throw Error('Unsupported or invalid drill file.');let clean=blank();Object.assign(clean,pitchSettings(d));for(let k of ['id','title','age','category','objective','safety'])if(typeof d[k]==='string')clean[k]=d[k].slice(0,4000);for(let k of ['length','width'])clean[k]=clamp(Number(d[k])||20,5,k==='length'?100:70);clean.frames=d.frames.map((fr,i)=>{if(!Array.isArray(fr.objects)||fr.objects.length>200)throw Error('Invalid objects.');let seen=new Set();let objects=fr.objects.map(o=>{if(!Object.hasOwn(types,o.type)||typeof o.id!=='string'||seen.has(o.id)||!Number.isFinite(o.x)||!Number.isFinite(o.y))throw Error('Invalid object.');seen.add(o.id);const n=obj(o.id,o.type,String(o.label??'').slice(0,160),clamp(o.x,0,900),clamp(o.y,0,540),clamp(Number(o.rot)||0,-360,360));if(isShield(o)&&typeof o.ownerId==='string')n.ownerId=o.ownerId;if(o.type==='ball'){if(typeof o.ownerId==='string')n.ownerId=o.ownerId;if(['left','right'].includes(o.carrySide))n.carrySide=o.carrySide;if(['turnover','presentation','set','handover','throw','feed','kick','pass','tap'].includes(o.transferKind))n.transferKind=o.transferKind;if(['presented','secured','grounded'].includes(o.groundState))n.groundState=o.groundState}if(contactType(o.type)&&Array.isArray(o.members))n.members=o.members.slice(0,17);if(['tackle','ruck'].includes(o.type)&&o.breakdown&&typeof o.breakdown==='object')n.breakdown=o.breakdown;return copyLayoutMarker(o,copyTraining(o,n))});let timing={};objects.forEach(o=>{let t=fr.timing?.[o.id];if(t){let s=clamp(Number(t.start)||0,0,99);Object.defineProperty(timing,o.id,{value:{start:s,end:clamp(Number(t.end)||100,s+1,100)},enumerable:true,writable:true,configurable:true})}});const result={name:String(fr.name??'Step').slice(0,160),seconds:i?clamp(Number(fr.seconds)||2,.5,30):0,notes:String(fr.notes??'').slice(0,4000),objects,timing,paths:fr.paths||{},guide:fr.guide};cleanGuide(result);cleanTraining(result);return result});cleanContacts(clean.frames);cleanBreakdowns(clean.frames);sanitizeRoutes(clean.frames);syncPossession(clean.frames,pitchGeometry(clean.length,clean.width,'up'));for(let k of [...fields,'provenance','review'])if(typeof d[k]==='string')clean[k]=d[k].slice(0,20000);for(let k of ['ageMin','ageMax','minutes'])if(Number.isFinite(d[k]))clean[k]=d[k];clean.links=d.links;return enrich(clean)}$('file').onchange=async e=>{try{let file=e.target.files[0];if(!file||!confirmLeave())return;let parsed=JSON.parse(await file.text());if(parsed?.kind==='rugby-library'&&Array.isArray(parsed.drills)){let imported=parsed.drills.map(validate),existing=stored();for(let d of imported){d.id=uid();existing.push(d)}localStorage.setItem('rugby-studio-v1',JSON.stringify(existing));note('Imported '+imported.length+' saved drills into local library.');return}drill=validate(parsed);dirty=true;selected=null;resetHistory();choose(0);note('Imported drill. Save it to add to this browser’s library.')}catch(err){note('Import failed: '+err.message)}finally{e.target.value=''}};
// Phase wizard and dock: independent from the currently selected object.
function phaseSelectOptions(){const age=phaseAge(drill);return Object.entries(GAME_PHASES).map(([k,v])=>'<option value="'+k+'" '+(phaseAllowed(k,age)?'':'disabled')+'>'+esc(v.title)+(phaseAllowed(k,age)?'':' · unavailable at U'+age)+'</option>').join('')}
function buildPhaseRoles(){
 const kind=$('gameKind').value,side=$('gameTeam').value,age=phaseAge(drill),spec=GAME_PHASES[kind];if(!spec)return;
 $('gameAgeNote').textContent='U'+age+' · '+ageNote(kind,age)+' '+spec.note;
 $('gameSource').href=spec.url;$('gameSource').textContent='World Rugby law reference';
 const used=new Set(),ball=chosenBall();
 $('gameRoles').innerHTML=phaseFields(kind,age).filter(field=>!field.many||field.max>0).map(field=>{
  const list=choicesFor(f(),field,side);
  if(field.many)return '<fieldset><legend>'+esc(field.label)+'</legend><small>Choose '+field.min+(field.min===field.max?'':'–'+field.max)+'. Order follows the player list.</small>'+list.map(o=>'<label class="phase-check"><input type="checkbox" data-phase-many="'+field.key+'" value="'+esc(o.id)+'"> '+esc(objectName(o))+'</label>').join('')+'</fieldset>';
  const suggested=field.type==='ball'?ball?.id:field.key==='actor'?carrier(f(),ball)?.id:null;
  return '<label>'+esc(field.label)+'<select data-phase-role="'+field.key+'"><option value="">Choose…</option>'+list.map(o=>'<option value="'+esc(o.id)+'" '+(suggested===o.id?'selected':'')+'>'+esc(objectName(o))+'</option>').join('')+'</select></label>';
 }).join('');
 $('gameError').textContent='';
}
function openGameWizard(){if(!canEditObjects())return;if(f().guide&&f().guide.stage<GAME_PHASES[f().guide.kind].stages.length-1&&!confirm('Start a different guided phase from this step? The existing sequence will remain in the drill.'))return;const age=phaseAge(drill);$('gameKind').innerHTML=phaseSelectOptions();$('gameKind').value=Object.keys(GAME_PHASES).find(k=>phaseAllowed(k,age))||'freepass';$('gameTeam').value=playerTeam(carrier(f(),chosenBall()))||playerTeam(activeObject())||'A';buildPhaseRoles();$('gameDialog').showModal()}
$('gamePhases').onclick=openGameWizard;$('gameKind').onchange=buildPhaseRoles;$('gameTeam').onchange=buildPhaseRoles;$('closeGame').onclick=()=>$('gameDialog').close();
function insertGameFrame(frame){stripDecisions(frame);if(drill.frames.length>=150)throw Error('Maximum of 150 steps reached.');drill.frames.splice(idx+1,0,frame);idx++;pendingInsert=null;sanitizeRoutes(drill.frames);changed();choose(idx);openInspector('Step',true);note(frame.notes)}
$('startGame').onclick=()=>{try{
 if(drill.frames.length>=150)throw Error('Maximum of 150 steps reached.');
 const kind=$('gameKind').value,side=$('gameTeam').value,roles={own:[],opp:[]};
 for(const sel of $('gameRoles').querySelectorAll('select[data-phase-role]'))roles[sel.dataset.phaseRole]=sel.value;
 for(const check of $('gameRoles').querySelectorAll('input[data-phase-many]:checked'))roles[check.dataset.phaseMany].push(check.value);
 const q=makeGuide(f(),kind,phaseAge(drill),side,roles,uid()),n=generateStage(f(),q,drill.length,drill.width);
 $('gameDialog').close();insertGameFrame(n)
 }catch(e){$('gameError').textContent=e.message}};
function updateGameDock(){
 const q=preview===null?f().guide:null,box=$('gameDock'),spec=q&&GAME_PHASES[q.kind];box.hidden=!spec;$('gameNav').hidden=!spec;$('gamePhases').disabled=preview!==null||routeDrawing||!!ballPicking;
 if(!spec)return;
 $('gamePhaseTitle').textContent=spec.title;$('gameStage').textContent='Step '+(idx+1)+' · '+(q.stage+1)+' / '+spec.stages.length+' · '+spec.stages[q.stage];
 $('gameStageNote').textContent=f().notes;
 const exists=nextGuide(drill.frames,idx),complete=q.stage>=spec.stages.length-1;
 $('nextGame').disabled=complete||routeDrawing||!!ballPicking;$('nextGame').textContent=complete?'Sequence complete':exists>=0?'Go to step '+(exists+1)+' · '+spec.stages[q.stage+1]:'Next: '+spec.stages[q.stage+1];
 const key=q.id+':'+idx+':'+q.stage;if($('gameDock').dataset.key!==key){$('gameDock').dataset.key=key;$('gameDockError').textContent=''}
 // Older breakdown navigation is still available if a marker exists, but its historical resume prompt need not compete.
 if(!$('breakdownResume').hidden&&!activeBreakdown()){$('breakdownDock').hidden=true;$('breakdownNav').hidden=true}
}
$('gameNav').onclick=()=>{openInspector('Step',true);$('gameDock').scrollIntoView({block:'nearest'})};
$('nextGame').onclick=()=>{if(!canEditObjects())return;const q=f().guide;if(!q)return;try{const exists=nextGuide(drill.frames,idx);if(exists>=0){choose(exists);return}if(phaseAge(drill)!==q.age)throw Error('Age group changed; start a new guided phase to apply the new rules.');if(q.stage>=GAME_PHASES[q.kind].stages.length-1)return;const next=generateStage(f(),{...q,stage:q.stage+1},drill.length,drill.width);insertGameFrame(next)}catch(e){$('gameDockError').textContent=e.message;note(e.message)}};
$('finishGame').onclick=()=>{if(!canEditObjects()||!f().guide)return;try{const n=clone(f()),id=n.guide.id;delete n.guide;n.objects=n.objects.filter(o=>o.id!==id+'-formation');n.name='Open play';n.seconds=1;n.notes='Continue open play with editable players.';n.timing={};n.paths={};for(const b of n.objects.filter(o=>o.type==='ball'))delete b.transferKind;insertGameFrame(n)}catch(e){$('gameDockError').textContent=e.message}};


$('decisionToggle').onclick=()=>{trainingPick=null;showDecisions=!showDecisions;$('decisionToggle').classList.toggle('selected',showDecisions);$('decisionToggle').setAttribute('aria-pressed',String(showDecisions));render();inspector()};
function decisionInspector(o){const d=o.decision=decisionData(o.decision),panel=$('objectPanel');panel.innerHTML='<div class="decision-inspector"><h3>Decision point</h3><small>Drag the decision diamond along its running path. Alternatives are visual only; click their points to edit.</small><label>Title<input id="dpTitle" value="'+esc(o.label)+'"></label><label>Player<select id="dpPlayer"><option value="">Any player</option>'+f().objects.filter(canCarry).map(p=>'<option value="'+esc(p.id)+'" '+(d.playerId===p.id?'selected':'')+'>'+esc(objectName(p))+'</option>').join('')+'</select></label><label>Question<textarea id="dpQuestion">'+esc(d.question)+'</textarea></label><label>Coaching cue<textarea id="dpCue">'+esc(d.cue)+'</textarea></label><h3>Options</h3>'+d.options.map((q,i)=>'<div class="decision-option"><b>'+String.fromCharCode(65+i)+'</b><input data-dp-label="'+i+'" value="'+esc(q.label)+'" aria-label="Option label"><select data-dp-kind="'+i+'" aria-label="Option type">'+[['main','Demonstrated action'],['run','Alternative run'],['pass','Alternative pass'],['note','Text only']].map(([v,label])=>'<option value="'+v+'" '+(q.kind===v?'selected':'')+'>'+label+'</option>').join('')+'</select>'+(['run','pass'].includes(q.kind)?'<button data-dp-path="'+i+'">'+(trainingPick?.kind==='option'&&trainingPick.id===o.id&&trainingPick.index===i?'Finish preview':q.points.length?'Redraw preview':'Draw preview')+'</button><small>'+q.points.length+' points</small><label>Path shape<select data-dp-mode="'+i+'"><option value="smooth" '+(q.mode==='smooth'?'selected':'')+'>Smooth curve</option><option value="corners" '+(q.mode==='corners'?'selected':'')+'>Straight segments</option></select></label>':'')+'<button data-dp-remove="'+i+'">Remove option</button></div>').join('')+'<button id="dpAdd" '+(d.options.length>=6?'disabled':'')+'>+ Add option</button><button id="dpDelete" class="danger-action">Delete decision</button></div>';
 const commit=()=>{changed();render()};$('dpTitle').onchange=e=>{o.label=e.target.value.slice(0,160);commit()};$('dpPlayer').onchange=e=>{o.decision.playerId=e.target.value;o.decision.anchor=null;commit()};$('dpQuestion').onchange=e=>{o.decision.question=e.target.value;commit()};$('dpCue').onchange=e=>{o.decision.cue=e.target.value;commit()};
 for(const b of panel.querySelectorAll('[data-dp-mode]'))b.onchange=()=>{o.decision.options[Number(b.dataset.dpMode)].mode=b.value;commit();inspector()};
 for(const b of panel.querySelectorAll('[data-dp-label]'))b.onchange=()=>{o.decision.options[Number(b.dataset.dpLabel)].label=b.value;commit()};
 for(const b of panel.querySelectorAll('[data-dp-kind]'))b.onchange=()=>{trainingPick=null;o.decision.options[Number(b.dataset.dpKind)].kind=b.value;commit();inspector()};
 for(const b of panel.querySelectorAll('[data-dp-path]'))b.onclick=()=>{const index=Number(b.dataset.dpPath);if(trainingPick?.kind==='option'&&trainingPick.id===o.id&&trainingPick.index===index){trainingPick=null;note('Preview saved.')}else{trainingPick={kind:'option',id:o.id,index,fresh:true};note('Click intermediate points and the final destination, then Finish preview. Drag points to adjust the curve.')}render();inspector()};
 for(const b of panel.querySelectorAll('[data-dp-remove]'))b.onclick=()=>{trainingPick=null;o.decision.options.splice(Number(b.dataset.dpRemove),1);commit();inspector()};$('dpAdd').onclick=()=>{o.decision.options.push({label:'New option',kind:'run',points:[]});commit();inspector()};$('dpDelete').onclick=()=>{trainingPick=null;deleteObject('here')}
}
function donutInspector(o){
 const panel=$('objectPanel'),down=o.donutState==='down',picking=trainingPick?.kind==='roll'&&trainingPick.id===o.id;
 panel.innerHTML='<div class="decision-inspector"><h3>Tackle donut</h3><label>Name<input id="donutName" value="'+esc(o.label)+'"></label><label>Rolling heading (degrees)<input id="donutRot" type="number" min="0" max="359" step="1" value="'+wrapAngle(o.rot)+'" '+(picking||down?'disabled':'')+'></label><div class="facing-buttons" aria-label="Quick rolling directions">'+[[0,'↑'],[90,'→'],[180,'↓'],[270,'←']].map(([a,t])=>'<button type="button" data-donut-facing="'+a+'" '+(picking||down?'disabled':'')+'>'+t+'</button>').join('')+'</div><small>Rotate the upright donut using its handle or heading controls. The long axis is the rolling direction.</small><label>Intercepting player<select id="donutTackler"><option value="">None · roll only</option>'+f().objects.filter(p=>['attacker','defender','neutral','shield','bagplayer'].includes(p.type)).map(p=>'<option value="'+esc(p.id)+'">'+esc(objectName(p))+'</option>').join('')+'</select></label><label>Stop at (% of planned roll)<input id="donutFraction" type="number" min="10" max="95" value="65"></label><label>Full roll duration (s)<input id="donutSeconds" type="number" min=".5" max="30" step=".5" value="2"></label><button id="donutRoll" class="primary" '+(down?'disabled':'')+'>'+(picking?'Cancel target selection':'Choose rolling distance')+'</button><button id="donutReset">Stand donut upright</button><button id="donutDelete" class="danger-action">Delete donut</button><small>Coach-controlled equipment practice; not a live player tackle.</small></div>';
 const locked=()=>trainingPick?.kind==='roll'&&trainingPick.id===o.id;
 const fields=['donutTackler','donutFraction','donutSeconds','donutName'];
 $('donutName').onchange=e=>{o.label=e.target.value;changed();render()};
 const rotateTo=angle=>{if(locked()||o.donutState==='down')return;o.rot=wrapAngle(angle);$('donutRot').value=o.rot;changed();render();tracks()};
 $('donutRot').onchange=e=>rotateTo(Number(e.target.value)||0);
 for(const button of panel.querySelectorAll('[data-donut-facing]'))button.onclick=()=>rotateTo(Number(button.dataset.donutFacing)-geometry().rotation);
 $('donutReset').onclick=()=>{trainingPick=null;o.donutState='ready';delete o.donutTacklerId;changed();render();inspector()};
 $('donutDelete').onclick=()=>{trainingPick=null;deleteObject('here')};
 function setPickUI(on){for(const id of [...fields,'donutRot'])$(id).disabled=on||id==='donutRot'&&down;for(const b of panel.querySelectorAll('[data-donut-facing]'))b.disabled=on||down;$('donutRoll').textContent=on?'Cancel target selection':'Choose rolling distance'}
 if(picking){$('donutTackler').value=trainingPick.tackler;$('donutFraction').value=trainingPick.fraction*100;$('donutSeconds').value=trainingPick.seconds}
 setPickUI(picking);
 $('donutRoll').onclick=()=>{
  if(locked()){trainingPick=null;setPickUI(false);render();note('Rolling target cancelled.');return}
  if(down)return;
  trainingPick={kind:'roll',id:o.id,tackler:$('donutTackler').value,fraction:clamp(Number($('donutFraction').value)||65,10,95)/100,seconds:clamp(Number($('donutSeconds').value)||2,.5,30)};
  setPickUI(true);render();note('Click ahead of the donut. Distance snaps onto the highlighted rolling lane.');focusPitch();
 };
}
function handleTrainingPick(e){const pick=trainingPick,o=f().objects.find(o=>o.id===pick.id),p=point(e);if(!o){trainingPick=null;return}if(pick.kind==='anchor'){const g=geometry(),route=decisionRoute(f(),drill.frames[idx-1],o.id,g);trainingPick=null;if(!route||f().objects.length>=200){render();return}const anchor=decisionFraction(route,viewPoint(e)),n={id:uid(),type:'decision',label:'Decision '+(f().objects.filter(x=>x.type==='decision').length+1),x:p.x,y:p.y,rot:0,decision:decisionData({playerId:o.id,anchor,options:[{label:'Demonstrated action',kind:'main'},{label:'Alternative run',kind:'run'}]})};const q=decisionLocation(f(),n,g,drill.frames[idx-1]);Object.assign(n,g.fromView(q.x,q.y));f().objects.push(n);selected=n.id;changed();refresh();openInspector('Object',true);note('Decision added to the run. Draw the alternative in the inspector.');return}if(pick.kind==='option'){const option=o.decision.options[pick.index];if(!option){trainingPick=null;return}if(pick.fresh){option.points=[];pick.fresh=false}if(option.points.length<12)option.points.push(p);changed();render();inspector();return}try{const frames=donutSteps(f(),o.id,p,pick.tackler,pick.fraction,pick.seconds,geometry());if(drill.frames.length+frames.length>150)throw Error('Maximum of 150 steps reached.');trainingPick=null;drill.frames.splice(idx+1,0,...frames);sanitizeRoutes(drill.frames);changed();choose(idx+1);selectObject(o.id);note(frames[0].notes)}catch(err){note(err.message)}}

function shareOptions(){return outputOptions({orientation,runs:$('shareRuns').checked,passes:$('sharePasses').checked,labels:$('shareLabels').checked,decisions:$('shareDecisions').checked})}
const getMovieSettings=bindMovieSettings($('movieOptions'),'movie');
const movieProgress=createExportProgress();
let sharingBusy=false;
$('share').onclick=()=>{if(!requireAppliedSetup())return;$('viewMenu').open=false;$('shareRuns').checked=showPaths;$('sharePasses').checked=showPasses;$('shareLabels').checked=showActionLabels;$('shareDecisions').checked=showDecisions;$('shareLink').value='';$('shareStatus').textContent='';$('shareDialog').showModal()};
$('closeShare').onclick=()=>{if(!sharingBusy)$('shareDialog').close()};
$('shareDialog').addEventListener('cancel',e=>{if(sharingBusy)e.preventDefault()});
for(const id of ['shareRuns','sharePasses','shareLabels','shareDecisions'])$(id).onchange=()=>{$('shareLink').value=''};
function shareBusy(on){sharingBusy=on;for(const id of ['shareCopy','shareOpen','shareMovie','sharePrint','export','png','closeShare'])$(id).disabled=on}
async function makeShare(){const code=await shareCode(drill,shareOptions()),url=new URL('./play.html',location.href);url.hash=code;return url.href}
$('shareCopy').onclick=async()=>{shareBusy(true);try{const link=await makeShare();$('shareLink').value=link;try{await navigator.clipboard.writeText(link);$('shareStatus').textContent='Link copied. Anyone with the link can view this snapshot.'}catch{$('shareLink').focus();$('shareLink').select();$('shareStatus').textContent='Select and copy the link manually.'}if(link.length>8000)$('shareStatus').textContent+=' Long links may be truncated by messaging apps.'}catch(err){$('shareStatus').textContent=err.message}finally{shareBusy(false)}};
$('shareOpen').onclick=async()=>{const w=window.open('about:blank','_blank');if(!w){$('shareStatus').textContent='Popup blocked. Copy the link instead.';return}w.opener=null;shareBusy(true);try{const url=await makeShare();$('shareLink').value=url;w.location.replace(url)}catch(err){w.close();$('shareStatus').textContent=err.message}finally{shareBusy(false)}};
$('shareMovie').onclick=async()=>{if(sharingBusy)return;shareBusy(true);$('shareStatus').textContent='';try{const settings={...shareOptions(),...getMovieSettings()},name=outputName(drill);const result=await movieProgress.run(async(progress,signal)=>{const result=await recordDrill(drill,settings,progress,signal);if(!signal.aborted)saveBlob(result.blob,name+'.'+result.extension);return result});if(result)$('shareStatus').textContent='Movie exported · '+result.width+' × '+result.height+' · '+result.extension.toUpperCase()+'.'}finally{shareBusy(false)}};
$('sharePrint').onclick=()=>{const opts=shareOptions();$('shareDialog').close();printDrill(drill,opts)};
// Close board options when returning to the pitch or leaving with Escape.
document.addEventListener('pointerdown',e=>{const menu=$('viewMenu');if(menu.open&&!menu.contains(e.target))menu.open=false});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('viewMenu').open){$('viewMenu').open=false;$('viewMenu').querySelector('summary').focus()}});
$('resetLayout').addEventListener('click',()=>{$('viewMenu').open=false});
window.addEventListener('beforeunload',e=>{if(dirty||setupPending){e.preventDefault();e.returnValue=''}});resetHistory();syncGrid();refresh();
