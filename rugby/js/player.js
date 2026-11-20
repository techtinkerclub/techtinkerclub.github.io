import {loadCatalogue,readFilters,libraryHref,drillHref,copyText,feedbackText,isAnimated} from './catalogue.js?v=0.18.7';
import {stepEndSeconds,stepStartSeconds} from './step-timeline.js?v=1';
import {playbackData,renderScene,drillDuration} from './scene.js?v=0.20.65';
import {drillGeometry} from './pitch.js?v=0.16.1';
import {tryVisualDuration} from './try-scoring.js?v=4';
import {hasOutcomes,branchInfo,chooseOutcome} from './branching.js?v=2';
import {zoomWindow,viewerZoomLevel} from './viewer-camera.js?v=1';
import {playWhistle,crossedWhistles} from './whistle-signal.js?v=0.20.51';
import {decisionTime,outcomeCardsMarkup} from './branching-visual.js?v=12';
import {decodeShare,outputOptions,printDrill,recordDrill,saveBlob,outputName} from './outputs.js?v=0.20.65';
import {createExportProgress} from './export-progress.js?v=0.18.3';
import {bindMovieSettings} from './movie.js?v=0.20.55';
import {coachingMarkup,sequenceMarkup,decisionMarkup,branchDecisionMarkup} from './coaching-output.js?v=0.13.10';
import {teachingOverlay,keyMoments,loopStepBounds,loopProgress,followFramingViewport} from './blackboard-coaching.js?v=2';
import {stepLocation} from './step-timeline.js?v=1';
import {transitionObjects} from './possession.js?v=0.19.1';
const $=id=>document.getElementById(id);
const visualDuration=()=>d?tryVisualDuration(d,drillGeometry(d,'up'),opts.cartoonMode):0;const movieProgress=createExportProgress();const getMovieSettings=bindMovieSettings($('playerMovieOptions'),'playerMovie');let d=null,opts=outputOptions(),t=0,raf=0,playing=false,last=0,shownStep=-1,notesKey='',pitchRatio=0,choiceResolved=false;
let viewZoom=1,viewPan={x:0,y:0},viewBase=null,panEnabled=false,dragStart=null,pinchStart=null;
let decisionRewind=0;
let publicBoard=null;
$('playerMovieCamera').closest('label').classList.add('video-camera-choice');
$('playerVideoStyle').closest('label').after($('playerMovieCamera').closest('label'));
const touches=new Map();
function syncLibraryVideoStyle(){
 const a=$('addPlayerToVideo');
 if(!a||a.hidden||!a.getAttribute('href'))return;
 const link=new URL(a.href,location.href);
 if($('playerVideoStyle').value==='ruckus')link.searchParams.set('style','ruckus');
 else link.searchParams.delete('style');
 a.href=link.href;
}
$('playerVideoStyle').addEventListener('change',syncLibraryVideoStyle);
$('playerMinionMode').onclick=()=>{
 opts.cartoonMode=!opts.cartoonMode;
 const b=$('playerMinionMode');
 b.textContent=opts.cartoonMode?'◉ Classic view':'◉ Harburling Ruckus';
 b.setAttribute('aria-pressed',String(!!opts.cartoonMode));
 $('playerVideoStyle').value=opts.cartoonMode?'ruckus':'classic';
 syncLibraryVideoStyle();
 if(d)$('seek').max=visualDuration();
 b.title=opts.cartoonMode?'Return to classic coaching view':'Show the red rugby mascot animation skin';
 render();
};

function applyZoom(){
 if(!viewBase)return;
 const svg=$('board').querySelector('svg');if(!svg)return;
 const v=zoomWindow(viewBase,viewZoom,viewPan);
 svg.setAttribute('viewBox',[v.x,v.y,v.width,v.height].join(' '));
 publicBoard?.syncView();
 $('playerZoomLevel').textContent=Math.round(viewZoom*100)+'%';
 $('playerZoomIn').disabled=viewZoom>=11.999;
 $('playerZoomOut').disabled=viewZoom<=1.001;
}
function resetZoom(){viewZoom=1;viewPan={x:0,y:0};dragStart=null;pinchStart=null;applyZoom()}
function changeZoom(factor){viewZoom=viewerZoomLevel(viewZoom*factor);applyZoom()}
$('playerZoomIn').onclick=()=>changeZoom(1.5);
$('playerZoomOut').onclick=()=>changeZoom(1/1.5);
$('playerZoomFit').onclick=()=>resetZoom();
$('playerPan').onclick=()=>{
 panEnabled=!panEnabled;$('playerPan').setAttribute('aria-pressed',String(panEnabled));
};
const boardEl=$('board');
const pinchDist=()=>{const [a,b]=[...touches.values()];return Math.hypot(a.x-b.x,a.y-b.y)};
boardEl.addEventListener('pointerdown',event=>{
 if(!d||event.button!==0||event.pointerType!=='touch'&&!panEnabled)return;
 if(event.pointerType==='touch')touches.set(event.pointerId,{x:event.clientX,y:event.clientY});
 if(touches.size===2){pinchStart={distance:pinchDist(),zoom:viewZoom};dragStart=null}
 else if(panEnabled)dragStart={id:event.pointerId,x:event.clientX,y:event.clientY,pan:{...viewPan}};
 boardEl.setPointerCapture(event.pointerId);event.preventDefault();
});
boardEl.addEventListener('pointermove',event=>{
 if(!d)return;
 if(touches.has(event.pointerId))touches.set(event.pointerId,{x:event.clientX,y:event.clientY});
 if(touches.size===2&&pinchStart&&pinchStart.distance>0){
  viewZoom=viewerZoomLevel(pinchStart.zoom*pinchDist()/pinchStart.distance);applyZoom();event.preventDefault();return;
 }
 if(!dragStart||dragStart.id!==event.pointerId||!viewBase)return;
 const rect=boardEl.getBoundingClientRect();
 viewPan={x:dragStart.pan.x-(event.clientX-dragStart.x)*viewBase.width/(Math.max(rect.width,1)*viewZoom),
  y:dragStart.pan.y-(event.clientY-dragStart.y)*viewBase.height/(Math.max(rect.height,1)*viewZoom)};
 applyZoom();event.preventDefault();
});
for(const kind of ['pointerup','pointercancel','lostpointercapture'])boardEl.addEventListener(kind,event=>{
 touches.delete(event.pointerId);
 if(dragStart?.id===event.pointerId)dragStart=null;
 if(touches.size<2)pinchStart=null;
 if(boardEl.hasPointerCapture?.(event.pointerId))boardEl.releasePointerCapture(event.pointerId);
});
boardEl.addEventListener('wheel',event=>{
 if(!d)return;
 event.preventDefault();changeZoom(event.deltaY<0?1.18:1/1.18);
},{passive:false});

function stop(){playing=false;cancelAnimationFrame(raf);cancelAnimationFrame(decisionRewind);decisionRewind=0;$('play').textContent='Play'}
function stepEnd(i){return stepEndSeconds(d,i)}
function stepTarget(direction){if(!d)return 0;const i=Math.max(0,shownStep),atEnd=Math.abs(t-stepEnd(i))<1e-7;return Math.max(0,Math.min(d.frames.length-1,direction<0?i-1:atEnd?i+1:i))}
function jumpStep(i,scroll=false){if(!d)return;stop();t=stepStartSeconds(d,Math.max(0,Math.min(i,d.frames.length-1)));if(hasOutcomes(d)&&t<decisionTime(d)-1e-6)choiceResolved=false;$('branchDecisionPanel').hidden=true;render();if(scroll)document.getElementById('presentation-tab-step')?.click()}
function render(){
 if(!d)return;
 $('playerFollow').setAttribute('aria-pressed',String(opts.framing==='follow'));
 $('playerFollow').classList.toggle('selected',opts.framing==='follow');
 const s=renderScene(d,{...opts,time:t}),ratio=s.g.viewWidth/s.g.viewHeight,board=$('board');
 if(ratio!==pitchRatio){board.style.setProperty('--pitch-ratio',String(ratio));pitchRatio=ratio}
 board.innerHTML=s.svg;viewBase=publicBoard?.cameraView(s)||s.camera;applyZoom();shownStep=s.index;
 publicBoard?.refresh(s);
 const key=(hasOutcomes(d)?d.branching.active:'single')+':'+s.index+':'+opts.decisions;
 if(notesKey!==key){notesKey=key;$('phase').textContent=(s.index+1)+' / '+d.frames.length+' · '+s.frame.name;$('notes').textContent=s.frame.notes||'';$('decisionNow').innerHTML=opts.decisions?(hasOutcomes(d)&&s.index===d.branching.fork?branchDecisionMarkup(d.branching):decisionMarkup(s.frame)):'';renderStepRoute(s.index);$('stepReading').hidden=!s.frame.notes&&!$('decisionNow').innerHTML}
 $('time').textContent=t.toFixed(1)+' / '+visualDuration().toFixed(1)+' s';$('seek').value=t;
 $('previousStep').disabled=t<=0;$('nextStep').disabled=t>=visualDuration();$('play').disabled=d.frames.length<2;
}
function showOutcomeDecision({jump=true}={}){
 if(!d||!hasOutcomes(d))return;
 stop();
 const fork=decisionTime(d);
 const present=()=>{
  t=fork;
  $('branchDecisionQuestion').textContent='◆ '+d.branching.question;
  $('branchDecisionCards').innerHTML=outcomeCardsMarkup(d,'choose',{cartoonMode:opts.cartoonMode});
  $('branchDecisionPanel').hidden=false;
  render();
  $('branchDecisionPanel').focus({preventScroll:true}); // Keep the pitch/page position stable while the choice panel opens.
 };
 // A coach comparing outcomes after playing one of them must see the reset.
 // Never teleport the runner straight to the decision point. Playback that
 // naturally arrives at the fork remains frozen there without any rewind.
 if(jump&&t>fork+.03){
  const end=t,started=performance.now();
  const duration=Math.max(550,Math.min(1800,(end-fork)*180));
  const back=now=>{
   const p=Math.min(1,(now-started)/duration);
   t=end-(end-fork)*(1-(1-p)*(1-p));
   render();
   if(p<1)decisionRewind=requestAnimationFrame(back);
   else {decisionRewind=0;present();}
  };
  decisionRewind=requestAnimationFrame(back);
 }else present();
}
function setPlayerOutcome(id,{atFork=false,resume=false}={}){
 if(!d||!hasOutcomes(d))return;
 stop();
 chooseOutcome(d,id);
 t=atFork?decisionTime(d):0;
 choiceResolved=true;
 shownStep=-1;notesKey='';
 $('branchChoice').value=id;$('seek').max=visualDuration();
 $('branchDecisionPanel').hidden=true;
 $('coachCardContent').innerHTML=coachingMarkup(d);
 $('coachSequenceContent').innerHTML=sequenceMarkup(d);render();
 if(resume)$('play').click();
}
$('branchChoice').onchange=()=>setPlayerOutcome($('branchChoice').value);
$('branchCompare').onclick=()=>{choiceResolved=false;showOutcomeDecision()};
$('branchDismiss').onclick=()=>{$('branchDecisionPanel').hidden=true;choiceResolved=true;render()};
$('branchDecisionCards').onclick=e=>{
 const target=e.target.closest('[data-branch-choice]');
 if(target)setPlayerOutcome(target.dataset.branchChoice,{atFork:true,resume:true});
};
function open(data,options){stop();d=playbackData(data);opts=outputOptions(options);if(d.pitchContext?.mode==='field'&&options?.framing===undefined)opts.framing='action';
 publicBoard?.opened();choiceResolved=false;$('branchDecisionPanel').hidden=true;
 const b=hasOutcomes(d)?branchInfo(d):null;
 $('playerMinionMode').setAttribute('aria-pressed',String(!!opts.cartoonMode));
 $('playerMinionMode').textContent=opts.cartoonMode?'◉ Classic view':'◉ Harburling Ruckus';
 $('playerVideoStyle').value=opts.cartoonMode?'ruckus':'classic';
 getMovieSettings.setContext({hasDecision:hasOutcomes(d),story:hasOutcomes(d),framing:opts.framing});
 $('branchPlayer').hidden=!b;
 if(b){
  $('branchPrompt').textContent='◆ '+b.question;
  $('branchChoice').replaceChildren(...b.choices.map(c=>new Option(c.id.toUpperCase()+' · '+c.label,c.id)));
  $('branchChoice').value=b.active;
 }
t=0;shownStep=-1;notesKey='';resetZoom();$('viewerCamera').hidden=false;$('title').textContent=d.title;$('objective').textContent=d.objective;$('seek').max=visualDuration();$('runs').checked=opts.runs;$('passes').checked=opts.passes;$('labels').checked=opts.labels;$('decisions').checked=opts.decisions;$('markups').checked=opts.markups;$('offside').checked=opts.offside;$('teachingGuides').checked=opts.teachingGuides;$('orientation').value=opts.orientation;$('scaleMode').value=opts.scaleMode;$('framing').value=opts.framing;$('controls').hidden=false;$('empty').hidden=true;$('coachResources').hidden=false;$('coachCardContent').innerHTML=coachingMarkup(d);$('coachSequenceContent').innerHTML=sequenceMarkup(d);$('message').textContent='';render()}
let soundOn=true;
$('whistleSound').onclick=()=>{soundOn=!soundOn;$('whistleSound').setAttribute('aria-pressed',String(soundOn));$('whistleSound').textContent=soundOn?'Whistle sound: on':'Whistle sound: off'};
$('play').onclick=()=>{
 if(!d)return;
 if(playing){stop();return}
 const total=visualDuration();
 if(t>=total){t=0;choiceResolved=false}
 if(hasOutcomes(d)&&!choiceResolved&&t>=decisionTime(d)-1e-6){showOutcomeDecision();return}
 playing=true;$('play').textContent='Pause';
 if(soundOn&&crossedWhistles(d,t,t,{includeStart:true}).length)playWhistle();
 last=performance.now();
 function tick(now){
  if(!playing)return;
  const from=t,delta=(now-last)/1000*Number($('speed').value);
  t=Math.min(total,from+delta);last=now;
  if(publicBoard?.loopEnabled()){const bounds=publicBoard.loopBounds();if(bounds&&from>=bounds.start-.001)t=loopProgress(from,delta,bounds)}
  if(hasOutcomes(d)&&!choiceResolved&&from<=decisionTime(d)+1e-6&&t>=decisionTime(d)-1e-6){
   t=decisionTime(d);showOutcomeDecision({jump:false});return;
  }
  if(soundOn&&crossedWhistles(d,from,t).length)playWhistle();
  render();
  if(t>=total)stop();else raf=requestAnimationFrame(tick);
 }
 raf=requestAnimationFrame(tick);
};
$('restart').onclick=()=>jumpStep(0);$('previousStep').onclick=()=>jumpStep(stepTarget(-1));$('nextStep').onclick=()=>jumpStep(stepTarget(1));$('seek').oninput=()=>{stop();t=Number($('seek').value);if(hasOutcomes(d)&&t<decisionTime(d)-1e-6)choiceResolved=false;$('branchDecisionPanel').hidden=true;render()};
$('playerFollow').onclick=()=>{const next=opts.framing==='follow'?'field':'follow';if(publicBoard)publicBoard.selectCameraMode(next);else{opts.framing=next;$('framing').value=next;resetZoom();render()}};
for(const k of ['runs','passes','labels','decisions','markups','offside','teachingGuides','orientation','scaleMode','framing'])$(k).onchange=()=>{opts[k]=['orientation','scaleMode','framing'].includes(k)?$(k).value:$(k).checked;if(['orientation','framing'].includes(k))resetZoom();render()};
$('file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>3000000)throw Error('File is too large.');open(JSON.parse(await file.text()),opts)}catch(err){$('message').textContent=err.message}};
$('coachSequenceContent').onclick=e=>{const b=e.target.closest('[data-jump-step]');if(!b||!d)return;stop();jumpStep(Number(b.dataset.jumpStep),true)};
$('downloadDrill').onclick=()=>{if(d)saveBlob(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),outputName(d)+'-presentation.json')};
$('print').onclick=()=>{if(d){stop();printDrill(d,opts)}};
$('video').onclick=async()=>{if(!d||movieProgress.active)return;stop();$('video').disabled=true;$('message').textContent='';try{const snapshot=d,settings={...opts,...getMovieSettings(),cartoonMode:$('playerVideoStyle').value==='ruckus'};const result=await movieProgress.run(async(progress,signal)=>{const result=await recordDrill(snapshot,settings,progress,signal);if(!signal.aborted)saveBlob(result.blob,outputName(snapshot)+'.'+result.extension);return result});if(result)$('message').textContent='Video exported · '+result.width+' × '+result.height+' · '+result.extension.toUpperCase()+'.'}finally{$('video').disabled=false}};
// One-screen public presentation layout. Move the EXISTING functional controls
// rather than duplicating them; all playback, camera, branch and export handlers
// above keep their original element identities and event listeners.
// Mini drill-flow chalkboard: a readable current-step sequence with clickable
// surrounding steps. This is presentation UI only; it never edits the drill.
function renderStepRoute(index){
 const list=$('presentationStepRoute');
 if(!list||!d)return;
 list.replaceChildren();
 const heading=document.createElement('div');heading.className='chalk-route-head';
 const label=document.createElement('strong');label.textContent='DRILL FLOW';
 const progress=document.createElement('span');progress.textContent=(index+1)+' OF '+d.frames.length;
 heading.append(label,progress);list.append(heading);
 const start=Math.max(0,Math.min(index-1,Math.max(0,d.frames.length-4)));
 const end=Math.min(d.frames.length,start+4);
 for(let i=start;i<end;i++){
  const button=document.createElement('button');
  button.type='button';button.className='chalk-route-step';
  button.setAttribute('aria-current',i===index?'step':'false');
  button.setAttribute('aria-label','Jump to step '+(i+1)+': '+d.frames[i].name);
  const number=document.createElement('span');number.className='chalk-route-number';number.textContent=String(i+1).padStart(2,'0');
  const name=document.createElement('span');name.className='chalk-route-name';name.textContent=d.frames[i].name;
  const state=document.createElement('span');state.className='chalk-route-state';state.textContent=i===index?'●':i<index?'✓':'›';
  button.append(number,name,state);
  button.addEventListener('click',()=>jumpStep(i));
  list.append(button);
 }
}
function initPresentationWorkspace(){
 const main=document.querySelector('.read-only-player main');
 if(!main||document.querySelector('.presentation-workspace'))return;
 const workspace=document.createElement('div');
 workspace.className='presentation-workspace';
 const stage=document.createElement('section');
 stage.className='presentation-stage';
 stage.setAttribute('aria-label','Pitch and playback controls');
 const sidebar=document.createElement('aside');
 sidebar.className='presentation-sidebar';
 sidebar.setAttribute('aria-label','Coaching information and settings');
 const top=document.createElement('div');top.className='presentation-sidebar-top';
 const tabs=document.createElement('div');tabs.className='presentation-tabs';
 tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Presentation information');
 const close=document.createElement('button');close.type='button';close.className='presentation-sidebar-close';close.textContent='Close';close.setAttribute('aria-label','Close coaching panel');
 top.append(tabs,close);sidebar.append(top);
 const panels={};
 const entries=[['step','On pitch'],['coach','Coach notes'],['steps','Sequence'],['view','Display'],['share','Export']];
 for(const [key,label] of entries){
  const button=document.createElement('button');
  button.type='button';button.id='presentation-tab-'+key;button.textContent=label;
  button.setAttribute('role','tab');button.setAttribute('aria-controls','presentation-panel-'+key);
  button.setAttribute('aria-selected',String(key==='step'));button.tabIndex=key==='step'?0:-1;
  const panel=document.createElement('section');panel.className='presentation-panel';panel.id='presentation-panel-'+key;
  panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);
  panel.hidden=key!=='step';panels[key]=panel;
  tabs.append(button);sidebar.append(panel);
  button.addEventListener('click',()=>activate(key));
 }
 function activate(key){
  for(const [name] of entries){
   const active=name===key,tab=document.getElementById('presentation-tab-'+name);
   tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
   panels[name].hidden=!active;
  }
  if(window.matchMedia('(max-width:850px)').matches)sidebar.dataset.open='true';
 }
 tabs.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const names=entries.map(e=>e[0]),current=names.findIndex(name=>document.getElementById('presentation-tab-'+name).getAttribute('aria-selected')==='true');
  const index=event.key==='Home'?0:event.key==='End'?names.length-1:(current+(event.key==='ArrowRight'?1:-1)+names.length)%names.length;
  activate(names[index]);document.getElementById('presentation-tab-'+names[index]).focus();
 });
 close.addEventListener('click',()=>{sidebar.dataset.open='false';toggle.focus()});
 const stageHead=document.createElement('div');stageHead.className='presentation-stage-head';
 const toggle=document.createElement('button');toggle.type='button';toggle.className='presentation-sidebar-toggle';toggle.textContent='☰ Coaching & options';
 toggle.setAttribute('aria-label','Open coaching notes and settings');
 toggle.addEventListener('click',()=>{sidebar.dataset.open='true';const current=tabs.querySelector('[aria-selected="true"]');current?.focus()});
 stageHead.append(toggle);stage.append(stageHead);
 for(const id of ['empty','branchDecisionPanel']){const item=$(id);if(item)stage.append(item)}
 const branch=$('branchPlayer');if(branch)panels.step.append(branch);
 const summary=document.createElement('p');summary.className='presentation-step-summary';
 summary.textContent='THE COACH’S BLACKBOARD';
 panels.step.append(summary);
 panels.step.append($('stepReading'));
 const route=document.createElement('nav');route.id='presentationStepRoute';route.className='chalk-route';route.setAttribute('aria-label','Nearby steps in this drill');panels.step.append(route);
 const coach=$('coachResources'),allSteps=$('coachSequenceContent').closest('.coach-resource');
 allSteps.open=true;
 panels.steps.append(allSteps);
 const heading=document.createElement('h2');heading.textContent='Coaching card';panels.coach.append(heading);
 coach.querySelector('.coach-resource').open=true;
 panels.coach.append(coach);
 const control=$('controls');
 const view=control.querySelector('.player-options');
 const share=control.querySelectorAll('.player-options')[1];
 if(view){view.open=true;panels.view.append(view)}
 const guides=control.querySelector('.step-reading');
 if(guides)panels.view.prepend(guides);
 if(share){share.open=true;panels.share.append(share)}
 panels.share.append($('catalogueReview'));
 const download=$('downloadDrill');if(download)panels.share.append(download);
 for(const [key,label] of [['steps','Step-by-step technical notes'],['view','Pitch display & camera'],['share','Share, export & review']]){
  const h=document.createElement('h2');h.textContent=label;panels[key].prepend(h);
 }
 const pitch=document.querySelector('.presentation-pitch-shell');
 stage.append(pitch,$('viewerCamera'),control,$('message'));
 workspace.append(stage,sidebar);
 main.prepend(workspace);
 document.body.classList.add('player-workspace-ready');
 window.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&sidebar.dataset.open==='true'){sidebar.dataset.open='false';toggle.focus()}
 });
}
initPresentationWorkspace();


/**
 * Public read-only Blackboard. Nothing here mutates a drill, creates routes,
 * saves objects or modifies published data. Ink/focus are local view overlays.
 * The existing Studio presentation renderer remains the only rugby engine.
 */
function initPublicBoard(){
 if(!new URLSearchParams(location.search).has('drill'))return null;
 const stage=document.querySelector('.presentation-stage');
 const sidebar=document.querySelector('.presentation-sidebar');
 const pitch=document.querySelector('.presentation-pitch-shell');
 const board=$('board');
 if(!stage||!sidebar||!pitch||!board)return null;
 document.body.classList.add('public-blackboard');
 const toolbar=document.createElement('nav');
 toolbar.className='public-board-toolbar';
 toolbar.setAttribute('aria-label','Public coaching blackboard tools');
 const make=(label,title,action)=>{
  const button=document.createElement('button');
  button.type='button';button.textContent=label;button.title=title;
  button.addEventListener('click',action);toolbar.append(button);return button;
 };
 const openPanel=key=>{
  toolbar.dataset.mobileOpen='false';mobileMenu?.setAttribute('aria-expanded','false');
  document.getElementById('presentation-tab-'+key)?.click();
  sidebar.dataset.open='true';
  closeButton.focus({preventScroll:true});
 };
 make('‹ Library','Back to the public coaching library',()=>$('backLibrary').click());
 make('☷ Notes','Current step and coaching flow',()=>openPanel('step'));
 make('▤ Coach','Full coaching card, safety and rules',()=>openPanel('coach'));
 make('≡ Steps','Step-by-step coaching sequence',()=>openPanel('steps'));
 make('◎ View','Camera, overlays and pitch options',()=>openPanel('view'));
 make('↗ Share','Links, coaching sheets and videos',()=>openPanel('share'));
 const focusButton=make('◎ Focus','Tap a player to spotlight them without editing',()=>setPickFocus(!pickFocus));
 focusButton.setAttribute('aria-pressed','false');
 const inkButton=make('✎ Ink','Draw temporary marks on the pitch',()=>setInk(!inkEnabled));
 inkButton.setAttribute('aria-pressed','false');
 const fullButton=make('⛶ Fullscreen','Enter or exit fullscreen presentation',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}
  catch{showNotice('Fullscreen is unavailable in this browser.')}
 });
 const closeButton=sidebar.querySelector('.presentation-sidebar-close');
 const backdrop=document.createElement('button');backdrop.type='button';
 backdrop.className='public-board-backdrop';backdrop.setAttribute('aria-label','Close coaching drawer');
 backdrop.addEventListener('click',()=>{sidebar.dataset.open='false'});
 document.body.append(backdrop);
 stage.append(toolbar);
 const boardHeading=document.createElement('div');boardHeading.className='public-board-heading';
 boardHeading.innerHTML='<small>RUGBY COACHING BLACKBOARD · VIEW ONLY</small><strong id="publicBoardTitle"></strong><p id="publicBoardObjective"></p>';
 stage.append(boardHeading);
 // View-only floating panels: a grip is a pointer/keyboard drag handle.
 // Local positions are clamped to the viewport and never written to drills.
 const movablePanels=[
  {node:toolbar,key:'tools',label:'Move tools'},
  {node:boardHeading,key:'title',label:'Move title'},
  {node:$('viewerCamera'),key:'camera',label:'Move camera'},
  {node:$('controls'),key:'playback',label:'Move playback'}
 ];
 const layoutKey='rugby-public-blackboard-layout-v1';
 const settings=(()=>{
  try{const raw=JSON.parse(localStorage.getItem(layoutKey)||'{}');return raw&&typeof raw==='object'?raw:{}}catch{return {}}
 })();
 function savePanelPositions(){
  const positions={};
  for(const item of movablePanels){
   const box=item.node.getBoundingClientRect();
   if(item.node.dataset.floating==='true')positions[item.key]=[
    Math.round(box.left/window.innerWidth*1000)/1000,
    Math.round(box.top/window.innerHeight*1000)/1000];
  }
  settings.positions=positions;settings.opacity=panelOpacity.value;settings.opacityVersion=2;
  try{localStorage.setItem(layoutKey,JSON.stringify(settings))}catch{}
 }
 function positionPanel(node,left,top){
  const rect=node.getBoundingClientRect(),w=rect.width||200,h=rect.height||50;
  node.dataset.floating='true';
  node.style.setProperty('left',Math.max(5,Math.min(window.innerWidth-w-5,left))+'px');
  node.style.setProperty('top',Math.max(5,Math.min(window.innerHeight-h-5,top))+'px');
  node.style.setProperty('right','auto');node.style.setProperty('bottom','auto');
  node.style.setProperty('transform','none');
 }
 function resetPanelPositions(){
  for(const item of movablePanels){
   delete item.node.dataset.floating;
   for(const prop of ['left','top','right','bottom','transform'])item.node.style.removeProperty(prop);
  }
  savePanelPositions();
 }
 function setOpacity(value){
  const v=Math.max(12,Math.min(88,Number(value)||48));
  document.body.style.setProperty('--public-panel-alpha',(v/100).toFixed(2));
  document.body.style.setProperty('--public-panel-blur',(v<60?0:2)+'px');
 }
 const panelPrefs=document.createElement('section');panelPrefs.className='public-board-panel-prefs';
 panelPrefs.innerHTML='<h2>Blackboard appearance</h2>'+
  '<label>Floating panel opacity <input type="range" id="publicPanelOpacity" min="12" max="88" step="1" value="48"><output id="publicPanelOpacityValue">48%</output></label>'+
  '<button type="button" id="publicPanelReset">Reset floating panels</button>'+
  '<small>Drag a panel by its grip. These preferences stay on this device only.</small>';
 document.getElementById('presentation-panel-view')?.append(panelPrefs);
 const panelOpacity=panelPrefs.querySelector('#publicPanelOpacity');
 panelOpacity.value=String(settings.opacityVersion===2?settings.opacity:48);setOpacity(panelOpacity.value);
 panelPrefs.querySelector('#publicPanelOpacityValue').textContent=panelOpacity.value+'%';
 panelOpacity.addEventListener('input',()=>{
  setOpacity(panelOpacity.value);
  panelPrefs.querySelector('#publicPanelOpacityValue').textContent=panelOpacity.value+'%';
 });
 panelOpacity.addEventListener('change',savePanelPositions);
 panelPrefs.querySelector('#publicPanelReset').addEventListener('click',resetPanelPositions);
 const narrow=()=>window.matchMedia('(max-width:700px)').matches;
 for(const item of movablePanels){
  const grip=document.createElement('button');grip.type='button';grip.className='public-board-grip';
  grip.textContent='⠿';grip.title=item.label;grip.setAttribute('aria-label',item.label);
  grip.setAttribute('aria-keyshortcuts','ArrowLeft ArrowRight ArrowUp ArrowDown');
  item.node.prepend(grip);
  let drag=null;
  grip.addEventListener('pointerdown',event=>{
   if(event.button!==0||narrow())return;
   event.preventDefault();event.stopPropagation();
   const rect=item.node.getBoundingClientRect();
   drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};
   grip.setPointerCapture(event.pointerId);
  });
  grip.addEventListener('pointermove',event=>{
   if(!drag||event.pointerId!==drag.id)return;
   positionPanel(item.node,drag.left+event.clientX-drag.x,drag.top+event.clientY-drag.y);
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])grip.addEventListener(type,event=>{
   if(!drag||event.pointerId!==drag.id)return;drag=null;savePanelPositions();
   if(grip.hasPointerCapture?.(event.pointerId))grip.releasePointerCapture(event.pointerId);
  });
  grip.addEventListener('keydown',event=>{
   const delta={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]}[event.key];
   if(!delta||narrow())return;
   event.preventDefault();const r=item.node.getBoundingClientRect();
   positionPanel(item.node,r.left+delta[0],r.top+delta[1]);savePanelPositions();
  });
 }
 function reflowPanels(){
  if(window.innerWidth<=700){
   for(const item of movablePanels){
    delete item.node.dataset.floating;
    for(const prop of ['left','top','right','bottom','transform'])item.node.style.removeProperty(prop);
   }
   return;
  }
  for(const item of movablePanels){
   const p=settings.positions?.[item.key];
   if(Array.isArray(p)&&p.length===2&&p.every(Number.isFinite))
    positionPanel(item.node,p[0]*window.innerWidth,p[1]*window.innerHeight);
  }
 }
 requestAnimationFrame(reflowPanels);
 window.addEventListener('resize',reflowPanels);
 // Fold-away rails leave the pitch clear without removing useful functions.
 const dock=document.createElement('nav');dock.className='public-board-dock';
 dock.setAttribute('aria-label','Show and hide floating panels');
 dock.dataset.open='false';
 const dockToggle=document.createElement('button');dockToggle.type='button';
 dockToggle.className='public-board-dock-toggle';dockToggle.textContent='☷';
 dockToggle.title='Show panel controls';dockToggle.setAttribute('aria-label','Show panel controls');
 dockToggle.setAttribute('aria-expanded','false');
 dockToggle.addEventListener('click',()=>{
  const opened=dock.dataset.open!=='true';
  dock.dataset.open=String(opened);
  dockToggle.setAttribute('aria-expanded',String(opened));
  dockToggle.setAttribute('aria-label',opened?'Hide panel controls':'Show panel controls');
 });
 dock.append(dockToggle);
 for(const [key,label,node] of [
  ['tools','Tools',toolbar],['title','Title',boardHeading],
  ['camera','Camera',$('viewerCamera')],['playback','Playback',$('controls')]
 ]){
  const button=document.createElement('button');button.type='button';
  button.textContent=label;button.title='Show or hide '+label.toLowerCase();
  button.setAttribute('aria-pressed','true');button.dataset.panel=key;
  button.addEventListener('click',()=>{
   const hide=node.dataset.collapsed!=='true';
   node.dataset.collapsed=String(hide);
   button.setAttribute('aria-pressed',String(!hide));
  });
  dock.append(button);
 }
 stage.append(dock);
 // Shortcuts work only while the published blackboard is visible, and never
 // intercept typing, forms, dialogs or buttons.
 const shortcuts=document.createElement('details');shortcuts.className='public-board-shortcuts';
 shortcuts.innerHTML='<summary title="Keyboard shortcuts">? Shortcuts</summary>'+
  '<div><b>Space</b> Play / pause <b>← →</b> Previous / next step '+
  '<b>R</b> Replay step <b>I</b> Toggle chalk <b>Esc</b> Exit focus or close tools</div>';
 document.getElementById('presentation-panel-step')?.append(shortcuts);
 window.addEventListener('keydown',event=>{
  if(!document.body.classList.contains('public-blackboard')||event.altKey||event.ctrlKey||event.metaKey||event.repeat)return;
  if(document.querySelector('dialog[open]')||event.target.closest?.('input,textarea,select,button,[contenteditable="true"],summary'))return;
  if(event.code==='Space'){event.preventDefault();$('play').click()}
  else if(event.key==='ArrowLeft'){event.preventDefault();$('previousStep').click()}
  else if(event.key==='ArrowRight'){event.preventDefault();$('nextStep').click()}
  else if(event.key.toLowerCase()==='r'){event.preventDefault();$('publicReplayStep')?.click()}
  else if(event.key.toLowerCase()==='i'){event.preventDefault();inkButton.click()}
 });
 const mobileMenu=document.createElement('button');mobileMenu.type='button';
 mobileMenu.className='public-board-mobile-menu';mobileMenu.textContent='☰ Tools';
 mobileMenu.setAttribute('aria-expanded','false');mobileMenu.setAttribute('aria-controls','publicBoardFloatingTools');
 mobileMenu.addEventListener('click',()=>{
  const open=toolbar.dataset.mobileOpen!=='true';
  toolbar.dataset.mobileOpen=String(open);mobileMenu.setAttribute('aria-expanded',String(open));
 });
 toolbar.id='publicBoardFloatingTools';stage.append(mobileMenu);
 const shareTools=document.createElement('section');shareTools.className='public-board-share-tools';
 shareTools.innerHTML='<h2>Coaching snapshot</h2><p>Save the current frame for handouts or messages. The exported image can include your temporary chalk, without changing the drill.</p>'+
  '<label><input id="publicSnapshotInk" type="checkbox" checked> Include my chalk marks</label>'+
  '<button type="button" id="publicSnapshotPng">Save current board (PNG)</button><p id="publicSnapshotStatus" role="status"></p>';
 document.getElementById('presentation-panel-share')?.prepend(shareTools);
 shareTools.querySelector('#publicSnapshotPng').addEventListener('click',async()=>{
  if(!d)return;
  const button=shareTools.querySelector('#publicSnapshotPng'),status=shareTools.querySelector('#publicSnapshotStatus');
  button.disabled=true;status.textContent='Preparing image…';
  try{
   const source=board.querySelector('svg:not(.public-board-ink)');
   if(!source)throw Error('There is no pitch image to save.');
   const copy=source.cloneNode(true);
   // Preserve the currently visible camera crop and optional ink. Do not
   // include floating controls, notes, toolbars or editor-only data.
   if(shareTools.querySelector('#publicSnapshotInk').checked){
    const group=document.createElementNS('http://www.w3.org/2000/svg','g');
    group.setAttribute('aria-label','Coach chalk annotations');
    for(const path of paths)group.append(path.cloneNode(true));
    copy.append(group);
   }
   copy.setAttribute('xmlns','http://www.w3.org/2000/svg');
   const serialized=new XMLSerializer().serializeToString(copy);
   const blob=new Blob([serialized],{type:'image/svg+xml;charset=utf-8'});
   const url=URL.createObjectURL(blob);
   try{
    const picture=new Image();
    await new Promise((resolve,reject)=>{picture.onload=resolve;picture.onerror=()=>reject(Error('The board image could not be rendered.'));picture.src=url});
    const view=source.viewBox.baseVal,ratio=view.width>0?view.height/view.width:9/16;
    const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=Math.max(550,Math.round(1600*ratio));
    const context=canvas.getContext('2d');if(!context)throw Error('PNG export is not supported in this browser.');
    context.drawImage(picture,0,0,canvas.width,canvas.height);
    const png=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Could not encode PNG.')),'image/png'));
    saveBlob(png,outputName(d)+'-coaching-board.png');
    status.textContent='PNG saved to your device.';
   }finally{URL.revokeObjectURL(url)}
  }catch(err){status.textContent='Snapshot unavailable: '+err.message}
  finally{button.disabled=false}
 });
 const inkTools=document.createElement('section');inkTools.className='public-board-ink-tools';inkTools.hidden=true;
 inkTools.innerHTML='<strong>Coaching chalk</strong><label>Tool <select id="publicInkTool" aria-label="Choose chalk tool"><option value="pen">✎ Freehand</option><option value="arrow">↗ Arrow</option><option value="circle">◯ Circle</option><option value="marker">▰ Highlighter</option></select></label><label>Colour <input id="publicInkColour" type="color" value="#ffe68c"></label>'+
  '<label>Width <select id="publicInkWidth" aria-label="Chalk stroke width"><option value="2.5">Fine</option><option value="4" selected>Normal</option><option value="7">Broad</option></select></label>'+
  '<button type="button" id="publicInkUndo">↶ Undo</button><button type="button" id="publicInkClear">Clear</button>'+
  '<small>Local only · optional in PNG snapshots, never in saved drills or videos</small>';
 stage.append(inkTools);
 const notice=document.createElement('p');notice.className='public-board-notice';notice.setAttribute('role','status');stage.append(notice);
 function showNotice(value){notice.textContent=value;}
 const focus=document.createElement('section');focus.className='public-board-focus';
 focus.innerHTML='<label>Spotlight <select id="publicSpotlight" aria-label="Spotlight player"><option value="">Off</option></select></label>'+
  '<label><input id="publicBoardGrid" type="checkbox"> Show visual guide grid</label>'+
  '<label>Ghost <select id="publicGhost" aria-label="Show past or next positions"><option value="off">Off</option><option value="start">Previous</option><option value="next">Next</option><option value="both">Both</option></select></label>';
 document.getElementById('presentation-panel-view')?.prepend(focus);
 // Single home for all camera controls, alongside Zoom/Fit/Pan/Follow.
 // Existing select elements move rather than being cloned so their handlers work.
 const cameraMenu=document.createElement('details');cameraMenu.className='public-board-camera-menu';
 const cameraSummary=document.createElement('summary');cameraSummary.textContent='⚙ Camera';
 const cameraContents=document.createElement('div');cameraContents.className='public-board-camera-settings';
 cameraContents.innerHTML='<label>Camera mode <select id="publicCameraTarget" aria-label="Choose how the camera follows the drill"><option value="field">Whole pitch</option><option value="action">Frame this step</option><option value="follow">Follow action</option><option value="ball">Follow ball</option><option value="player">Follow player</option></select></label>'+
  '<label id="publicCameraPlayerLabel" hidden>Player <select id="publicCameraPlayer" aria-label="Player to follow"></select></label>'+
  '<label>Camera distance <select id="publicCameraFraming" aria-label="Camera distance"><option value="close">Close</option><option value="standard" selected>Standard</option><option value="wide">Wide</option><option value="veryWide">Very wide</option><option value="full">Full pitch</option></select></label>';
 const legacyFraming=$('framing')?.closest('label');
 if(legacyFraming){legacyFraming.hidden=true;cameraContents.append(legacyFraming)}
 const orient=$('orientation');
 if(orient){
  const wrapper=document.createElement('label');wrapper.textContent='Pitch orientation';
  wrapper.append(orient);cameraContents.append(wrapper);
 }
 cameraMenu.append(cameraSummary,cameraContents);
 $('viewerCamera').append(cameraMenu);
const local={spot:'',ghost:'off',camera:'field',cameraPlayer:'',cameraFraming:'standard',grid:false};
 const cameraTarget=cameraContents.querySelector('#publicCameraTarget');
 const cameraPlayer=cameraContents.querySelector('#publicCameraPlayer');
 function selectCameraMode(mode){
  local.camera=mode;
  cameraTarget.value=mode;
  cameraContents.querySelector('#publicCameraPlayerLabel').hidden=mode!=='player';
  opts.framing=mode==='follow'?'follow':mode==='action'?'action':'field';
  $('framing').value=opts.framing;
  resetZoom();render();
 }
 cameraTarget.addEventListener('change',()=>selectCameraMode(cameraTarget.value));
 cameraPlayer.addEventListener('change',()=>{local.cameraPlayer=cameraPlayer.value;resetZoom();render()});
 cameraContents.querySelector('#publicCameraFraming').addEventListener('change',e=>{local.cameraFraming=e.target.value;resetZoom();render()});
 focus.querySelector('#publicSpotlight').addEventListener('change',e=>{local.spot=e.target.value;render()});
 focus.querySelector('#publicGhost').addEventListener('change',e=>{local.ghost=e.target.value;render()});
 focus.querySelector('#publicBoardGrid').addEventListener('change',e=>{local.grid=e.target.checked;render()});
 const ink=document.createElementNS('http://www.w3.org/2000/svg','svg');
 ink.setAttribute('aria-label','Temporary coaching ink');ink.classList.add('public-board-ink');
 ink.setAttribute('preserveAspectRatio','xMidYMid meet');
 board.append(ink);
 let pickFocus=false,inkEnabled=false,activePath=null,paths=[],previousScene=null,stepLoop=false,loopIndex=1;
 const colour=inkTools.querySelector('#publicInkColour'),width=inkTools.querySelector('#publicInkWidth');
 function setPickFocus(value){
  pickFocus=!!value;focusButton.setAttribute('aria-pressed',String(pickFocus));
  board.classList.toggle('public-picking-focus',pickFocus);
  if(pickFocus){setInk(false);showNotice('Tap a player to spotlight them. Nothing in the drill is changed.')}
  else showNotice('');
 }
 board.addEventListener('click',event=>{
  if(!pickFocus||!d||!document.body.classList.contains('public-blackboard'))return;
  if(event.target.closest('.public-board-ink'))return;
  const svg=board.querySelector('svg:not(.public-board-ink)');
  if(!svg)return;
  const ctm=svg.getScreenCTM();if(!ctm)return;
  const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
  const p=point.matrixTransform(ctm.inverse());
  const i=Math.max(0,shownStep),g=drillGeometry(d,opts.orientation);
  const loc=stepLocation(d,t),before=d.frames[Math.max(0,i-1)];
  const candidates=i?transitionObjects(before,d.frames[i],loc.p,g):d.frames[0].objects;
  let nearest=null,distance=Infinity;
  for(const o of candidates){
   if(!['attacker','defender','neutral','coach','shield','bagplayer'].includes(o.type))continue;
   const position=g.toView(o.x,o.y),delta=Math.hypot(p.x-position.x,p.y-position.y);
   if(delta<distance){distance=delta;nearest=o}
  }
  if(nearest&&distance<Math.max(38,g.scale*.7)){
   local.spot=nearest.id;focus.querySelector('#publicSpotlight').value=nearest.id;
   showNotice('Spotlight: '+(nearest.label||nearest.id)+' · use View to switch it off');
   setPickFocus(false);render();
  }else showNotice('Tap nearer to a player to spotlight them.');
 });
 function setInk(enabled){
  inkEnabled=!!enabled;inkTools.hidden=!inkEnabled;inkButton.setAttribute('aria-pressed',String(inkEnabled));
  board.classList.toggle('public-inking',inkEnabled);
  if(inkEnabled){pickFocus=false;focusButton.setAttribute('aria-pressed','false');board.classList.remove('public-picking-focus');stop();toolbar.dataset.mobileOpen='false';mobileMenu.setAttribute('aria-expanded','false');showNotice('Draw with your mouse, finger or pen. Marks stay local to this board.')}
  else showNotice('');
 }
 function syncView(){
  const svg=board.querySelector('svg:not(.public-board-ink)');
  if(!svg)return;
  // The ink is a sibling of the scene SVG. Both share the same world-space
  // viewBox, including manual zoom, pan and automatic tracking.
  ink.setAttribute('viewBox',svg.getAttribute('viewBox')||'0 0 900 540');
 }
 function point(event){
  const ctm=ink.getScreenCTM();if(!ctm)return null;
  const p=ink.createSVGPoint();p.x=event.clientX;p.y=event.clientY;
  return p.matrixTransform(ctm.inverse());
 }
 const seg=(p)=>p.x.toFixed(2)+' '+p.y.toFixed(2);
 ink.addEventListener('pointerdown',event=>{
  if(!inkEnabled||event.button!==0)return;
  const p=point(event);if(!p)return;
  const tool=inkTools.querySelector('#publicInkTool').value;
  const path=document.createElementNS('http://www.w3.org/2000/svg',tool==='circle'?'ellipse':'path');
  if(tool==='circle'){
   path.setAttribute('cx',String(p.x));path.setAttribute('cy',String(p.y));
   path.setAttribute('rx','0.01');path.setAttribute('ry','0.01');
  }else path.setAttribute('d','M'+seg(p)+' L'+(p.x+.01).toFixed(2)+' '+p.y.toFixed(2));
  path.setAttribute('fill','none');path.setAttribute('stroke',colour.value);
  path.setAttribute('stroke-width',tool==='marker'?String(Math.max(13,Number(width.value)*3)):width.value);
  if(tool==='marker')path.setAttribute('opacity','.35');
  path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');
  path.setAttribute('vector-effect','non-scaling-stroke');
  ink.append(path);paths.push(path);activePath={id:event.pointerId,path,tool,start:p};
  ink.setPointerCapture(event.pointerId);event.preventDefault();
 });
 ink.addEventListener('pointermove',event=>{
  if(!activePath||activePath.id!==event.pointerId)return;
  const p=point(event);if(!p)return;
  const {path,tool,start}=activePath;
  if(tool==='circle'){
   path.setAttribute('cx',String((start.x+p.x)/2));
   path.setAttribute('cy',String((start.y+p.y)/2));
   path.setAttribute('rx',String(Math.max(.01,Math.abs(p.x-start.x)/2)));
   path.setAttribute('ry',String(Math.max(.01,Math.abs(p.y-start.y)/2)));
  }else if(tool==='arrow'){
   const dx=p.x-start.x,dy=p.y-start.y,len=Math.hypot(dx,dy);
   const unit=len>.001?{x:dx/len,y:dy/len}:{x:0,y:-1};
   const size=Math.max(9,Math.min(23,len*.2));
   const left={x:p.x-unit.x*size-unit.y*size*.45,y:p.y-unit.y*size+unit.x*size*.45};
   const right={x:p.x-unit.x*size+unit.y*size*.45,y:p.y-unit.y*size-unit.x*size*.45};
   path.setAttribute('d','M'+seg(start)+' L'+seg(p)+' M'+seg(left)+' L'+seg(p)+' L'+seg(right));
  }else path.setAttribute('d',path.getAttribute('d')+' L'+seg(p));
  event.preventDefault();
 });
 for(const kind of ['pointerup','pointercancel','lostpointercapture'])ink.addEventListener(kind,event=>{
  if(activePath?.id===event.pointerId)activePath=null;
  if(ink.hasPointerCapture?.(event.pointerId))ink.releasePointerCapture(event.pointerId);
 });
 inkTools.querySelector('#publicInkUndo').addEventListener('click',()=>paths.pop()?.remove());
 inkTools.querySelector('#publicInkClear').addEventListener('click',()=>{for(const path of paths)path.remove();paths=[]});
 function opened(){
  boardHeading.querySelector('#publicBoardTitle').textContent=d?.title||'Rugby drill';
  boardHeading.querySelector('#publicBoardObjective').textContent=d?.objective||'';
  local.camera=opts.framing==='follow'?'follow':opts.framing==='action'?'action':'field';
  cameraTarget.value=local.camera;
  stepLoop=false;loopIndex=1;refreshPlaybackTools();
 }
 function refreshPlaybackTools(){
  const toggle=$('publicLoopStep');if(toggle){toggle.setAttribute('aria-pressed',String(stepLoop));toggle.textContent=stepLoop?'⟲ Loop: on':'⟲ Loop current step'}
 }
 function refresh(scene){
  previousScene=scene;
  if(!document.body.classList.contains('public-blackboard')){
   if(ink.parentNode!==board)board.append(ink);
   syncView();return;
  }
  // Player choice is derived from the saved read-only frame, never from editing.
  const select=focus.querySelector('#publicSpotlight'),current=select.value;
  const names=scene.frame.objects.filter(o=>['attacker','defender','neutral','coach','shield','bagplayer'].includes(o.type));
  const signature=names.map(o=>o.id+':'+o.label).join('|');
  if(cameraPlayer.dataset.signature!==signature){
   const previous=cameraPlayer.value;cameraPlayer.dataset.signature=signature;cameraPlayer.replaceChildren();
   for(const o of names){const option=document.createElement('option');option.value=o.id;option.textContent=o.label||o.id;cameraPlayer.append(option)}
   if(names.some(o=>o.id===previous))cameraPlayer.value=previous;
   local.cameraPlayer=cameraPlayer.value;
  }
  if(select.dataset.signature!==signature){
   select.dataset.signature=signature;select.innerHTML='<option value="">Off</option>';
   for(const o of names){const opt=document.createElement('option');opt.value=o.id;opt.textContent=o.label||o.id;select.append(opt)}
   select.value=names.some(o=>o.id===current)?current:'';
   local.spot=select.value;
  }
  const g=drillGeometry(d,opts.orientation),loc=stepLocation(d,t);
  const moments=$('publicKeyMoments');
  if(moments&&moments.dataset.drill!==d.id+':'+(d.branching?.active||'')){
   moments.dataset.drill=d.id+':'+(d.branching?.active||'');
   moments.replaceChildren();
   for(const m of keyMoments(d,14)){
    const button=document.createElement('button');button.type='button';
    button.textContent=m.label;button.title=m.title;
    button.dataset.step=String(m.index);
    button.addEventListener('click',()=>jumpStep(m.index));
    moments.append(button);
   }
  }
  if(moments)for(const b of moments.children)b.setAttribute('aria-current',Number(b.dataset.step)===scene.index?'step':'false');
  const before=d.frames[Math.max(0,scene.index-1)],next=d.frames[Math.min(d.frames.length-1,scene.index+1)];
  const actors=scene.index>0?transitionObjects(before,scene.frame,loc.p,g):scene.frame.objects;
  if(local.grid){
   const svg=board.querySelector('svg:not(.public-board-ink)');
   if(svg){
    let grid='<g class="public-board-grid" pointer-events="none" stroke="#e7f3bd" stroke-width=".8" stroke-dasharray="3 8" opacity=".2">';
    for(let x=1;x<10;x++)grid+='<path d="M'+(x*g.viewWidth/10)+' 0V'+g.viewHeight+'"/>';
    for(let y=1;y<8;y++)grid+='<path d="M0 '+(y*g.viewHeight/8)+'H'+g.viewWidth+'"/>';
    svg.insertAdjacentHTML('beforeend',grid+'</g>');
   }
  }
  if(local.spot||local.ghost!=='off'){
   const svg=board.querySelector('svg:not(.public-board-ink)');
   if(svg){
    const overlay=teachingOverlay({objects:actors,previous:before,next,g,
     spotlightIds:local.spot?[local.spot]:[],ghostIds:local.spot?[local.spot]:names.map(o=>o.id),
     ghostMode:local.ghost});
    if(overlay)svg.insertAdjacentHTML('beforeend',overlay);
   }
  }
  // Rebuild only the transient presentation overlay. Ink paths survive frame
  // changes and stay independent of exported or shared rugby drill data.
  if(ink.parentNode!==board)board.append(ink);
  syncView();
 }
 window.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||document.activeElement?.closest('dialog'))return;
  if(inkEnabled){setInk(false);return}
  if(pickFocus){setPickFocus(false);return}
  if(toolbar.dataset.mobileOpen==='true'){toolbar.dataset.mobileOpen='false';mobileMenu.setAttribute('aria-expanded','false');return}
  if(sidebar.dataset.open==='true'){sidebar.dataset.open='false';return}
 });
 const controls=document.createElement('section');controls.className='public-board-play-tools';
 controls.innerHTML='<h2>Playback tools</h2><div class="public-board-play-buttons">'+
  '<button type="button" id="publicReplayStep">↺ Replay current step</button>'+
  '<button type="button" id="publicLoopStep" aria-pressed="false">⟲ Loop current step</button></div>'+
  '<h2>Key moments</h2><div id="publicKeyMoments" class="public-board-moments"></div>';
 document.getElementById('presentation-panel-step')?.append(controls);
 controls.querySelector('#publicReplayStep').addEventListener('click',()=>{
  if(!d)return;const i=Math.max(1,shownStep);jumpStep(i);$('play').click();
 });
 controls.querySelector('#publicLoopStep').addEventListener('click',()=>{
  if(!d)return;stepLoop=!stepLoop;
  if(stepLoop){loopIndex=Math.max(1,shownStep);if(shownStep===0)jumpStep(1);}
  refreshPlaybackTools();
 });
 function cameraView(scene){
  if(!document.body.classList.contains('public-blackboard')||!d||local.camera==='action'||local.cameraFraming==='full')return null;
  const g=drillGeometry(d,opts.orientation),loc=stepLocation(d,t),i=scene.index;
  const prev=d.frames[Math.max(0,i-1)],objects=i>0?transitionObjects(prev,scene.frame,loc.p,g):scene.frame.objects;
  const target=local.camera==='ball'?objects.find(o=>o.type==='ball'):objects.find(o=>o.id===local.cameraPlayer);
  if(!target)return null;
  const p=g.toView(target.x,target.y),width=g.viewWidth*.42,height=g.viewHeight*.42;
  const view={x:Math.max(0,Math.min(g.viewWidth-width,p.x-width/2)),
   y:Math.max(0,Math.min(g.viewHeight-height,p.y-height/2)),width,height};
  return followFramingViewport(view,g,local.cameraFraming);
 }
 return {refresh,syncView,cameraView,opened,selectCameraMode,loopEnabled:()=>stepLoop,loopBounds:()=>d?loopStepBounds(d,loopIndex):null};
}

publicBoard=initPublicBoard();

const params=new URLSearchParams(location.search),catalogueId=params.get('drill');
async function reviewCopy(value,message){if(await copyText(value)){$('reviewStatus').textContent=message;return}$('reviewCopyValue').value=value;$('reviewCopyDialog').showModal();$('reviewCopyValue').select()}
if(catalogueId!==null){
 // Catalogued resources are read-only and load only by a validated catalogue identifier.
 document.body.classList.add('catalogue-player');$('backLibrary').hidden=false;$('backLibrary').href=libraryHref(readFilters(params));$('openFileLabel').hidden=true;$('downloadDrill').hidden=true;
 $('empty').innerHTML='<h2>Loading drill…</h2><p>Please use the library link to choose another resource.</p>';
 try{
  if(!/^seed-[0-9]{3,}$/.test(catalogueId))throw Error('Invalid drill identifier.');
  const list=await loadCatalogue(),entry=list.find(x=>x.id===catalogueId);if(!entry)throw Error('This drill is not in the published catalogue.');
  const compose=new URL('./library.html',location.href);compose.searchParams.set('video',entry.id);$('addPlayerToVideo').href=compose.href;$('addPlayerToVideo').hidden=false;syncLibraryVideoStyle();
  open(entry,{offside:params.has('offside')?params.get('offside')==='1':entry.id==='seed-082',teachingGuides:params.get('guides')!=='0',scaleMode:params.get('scale')==='realistic'?'realistic':'coaching',framing:params.get('framing')==='action'?'action':'field',orientation:params.get('orientation')==='up'?'up':'right',cartoonMode:params.get('minion')==='1'});document.title=entry.title+' · Rugby Coaching Library';
  if(entry.publishedAt){const stamp=document.createElement('small');stamp.className='published-stamp';stamp.textContent='Public copy updated '+new Date(entry.publishedAt).toLocaleDateString('en-GB')+' · '+(Number.isInteger(entry.publishedRevision)?'Revision '+entry.publishedRevision:'Legacy revision');$('objective').before(stamp)}
  $('catalogueReview').hidden=false;
  const shareLink=()=>{const link=new URL(drillHref(entry.id),location.href);link.searchParams.set('offside',opts.offside?'1':'0');link.searchParams.set('guides',opts.teachingGuides?'1':'0');link.searchParams.set('scale',opts.scaleMode);link.searchParams.set('framing',opts.framing);link.searchParams.set('orientation',opts.orientation);if(opts.cartoonMode)link.searchParams.set('minion','1');return link.href};
  $('copyDrillLink').onclick=()=>reviewCopy(shareLink(),'Drill link copied.');
  $('copyReview').onclick=()=>reviewCopy(feedbackText(entry,shareLink()),'Review questions copied.');
  if(!isAnimated(entry)){
   // A text card is not a missing animation: show its existing coaching content only.
   $('board').hidden=true;$('controls').hidden=true;$('stepReading').hidden=true;
   $('coachSequenceContent').closest('details').hidden=true;
   $('empty').hidden=false;$('empty').innerHTML='<h2>Coaching card</h2><p>This resource has written guidance but no animation yet.</p>';
  }
 }catch(err){$('empty').hidden=false;$('empty').innerHTML='<h2>Drill unavailable</h2><p>Return to the library and try again.</p>';$('message').textContent=err.message}
}else{try{if(location.hash.length>1){const p=await decodeShare(location.hash.slice(1));open(p.drill,p.options)}}catch(err){$('message').textContent=err.message+' Open an exported JSON file instead.'}}

