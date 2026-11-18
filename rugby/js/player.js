import {loadCatalogue,readFilters,libraryHref,drillHref,copyText,feedbackText,isAnimated} from './catalogue.js?v=0.17.0';
import {stepEndSeconds,stepStartSeconds} from './step-timeline.js?v=1';
import {playbackData,renderScene,drillDuration} from './scene.js?v=0.19.6';
import {hasOutcomes,branchInfo,chooseOutcome} from './branching.js?v=2';
import {zoomWindow,viewerZoomLevel} from './viewer-camera.js?v=1';
import {playWhistle,crossedWhistles} from './whistle-signal.js?v=2';
import {decisionTime,outcomeCardsMarkup} from './branching-visual.js?v=4';
import {decodeShare,outputOptions,printDrill,recordDrill,saveBlob,outputName} from './outputs.js?v=0.19.6';
import {createExportProgress} from './export-progress.js?v=0.18.3';
import {bindMovieSettings} from './movie.js?v=0.18.4';
import {coachingMarkup,sequenceMarkup,decisionMarkup,branchDecisionMarkup} from './coaching-output.js?v=0.13.10';
const $=id=>document.getElementById(id);const movieProgress=createExportProgress();const getMovieSettings=bindMovieSettings($('playerMovieOptions'),'playerMovie');let d=null,opts=outputOptions(),t=0,raf=0,playing=false,last=0,shownStep=-1,notesKey='',pitchRatio=0,choiceResolved=false;
let viewZoom=1,viewPan={x:0,y:0},viewBase=null,panEnabled=false,dragStart=null,pinchStart=null;
const touches=new Map();
$('playerMinionMode').onclick=()=>{
 opts.cartoonMode=!opts.cartoonMode;
 const b=$('playerMinionMode');
 b.textContent=opts.cartoonMode?'◉ Classic view':'◉ Minion Mode';
 b.setAttribute('aria-pressed',String(!!opts.cartoonMode));
 b.title=opts.cartoonMode?'Return to classic coaching view':'See playful goggle-eyed cartoon players';
 render();
};

function applyZoom(){
 if(!viewBase)return;
 const svg=$('board').querySelector('svg');if(!svg)return;
 const v=zoomWindow(viewBase,viewZoom,viewPan);
 svg.setAttribute('viewBox',[v.x,v.y,v.width,v.height].join(' '));
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

function stop(){playing=false;cancelAnimationFrame(raf);$('play').textContent='Play'}
function stepEnd(i){return stepEndSeconds(d,i)}
function stepTarget(direction){if(!d)return 0;const i=Math.max(0,shownStep),atEnd=Math.abs(t-stepEnd(i))<1e-7;return Math.max(0,Math.min(d.frames.length-1,direction<0?i-1:atEnd?i+1:i))}
function jumpStep(i,scroll=false){if(!d)return;stop();t=stepStartSeconds(d,Math.max(0,Math.min(i,d.frames.length-1)));if(hasOutcomes(d)&&t<decisionTime(d)-1e-6)choiceResolved=false;$('branchDecisionPanel').hidden=true;render();if(scroll)$('board').scrollIntoView({block:'start',behavior:'auto'})}
function render(){
 if(!d)return;
 const s=renderScene(d,{...opts,time:t}),ratio=s.g.viewWidth/s.g.viewHeight,board=$('board');
 if(ratio!==pitchRatio){board.style.setProperty('--pitch-ratio',String(ratio));pitchRatio=ratio}
 board.innerHTML=s.svg;viewBase=s.camera;applyZoom();shownStep=s.index;
 const key=(hasOutcomes(d)?d.branching.active:'single')+':'+s.index+':'+opts.decisions;
 if(notesKey!==key){notesKey=key;$('phase').textContent=(s.index+1)+' / '+d.frames.length+' · '+s.frame.name;$('notes').textContent=s.frame.notes||'';$('decisionNow').innerHTML=opts.decisions?(hasOutcomes(d)&&s.index===d.branching.fork?branchDecisionMarkup(d.branching):decisionMarkup(s.frame)):'';$('stepReading').hidden=!s.frame.notes&&!$('decisionNow').innerHTML}
 $('time').textContent=t.toFixed(1)+' / '+drillDuration(d).toFixed(1)+' s';$('seek').value=t;
 $('previousStep').disabled=t<=0;$('nextStep').disabled=t>=drillDuration(d);$('play').disabled=d.frames.length<2;
}
function showOutcomeDecision({jump=true}={}){
 if(!d||!hasOutcomes(d))return;
 stop();
 const fork=decisionTime(d);
 if(jump)t=fork;
 $('branchDecisionQuestion').textContent='◆ '+d.branching.question;
 $('branchDecisionCards').innerHTML=outcomeCardsMarkup(d,'choose');
 $('branchDecisionPanel').hidden=false;
 render();
 $('branchDecisionPanel').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function setPlayerOutcome(id,{atFork=false,resume=false}={}){
 if(!d||!hasOutcomes(d))return;
 stop();
 chooseOutcome(d,id);
 t=atFork?decisionTime(d):0;
 choiceResolved=true;
 shownStep=-1;notesKey='';
 $('branchChoice').value=id;$('seek').max=drillDuration(d);
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
function open(data,options){stop();d=playbackData(data);opts=outputOptions(options);if(d.pitchContext?.mode==='field'&&options?.framing===undefined)opts.framing='action';choiceResolved=false;$('branchDecisionPanel').hidden=true;
 const b=hasOutcomes(d)?branchInfo(d):null;
 $('branchPlayer').hidden=!b;
 if(b){
  $('branchPrompt').textContent='◆ '+b.question;
  $('branchChoice').replaceChildren(...b.choices.map(c=>new Option(c.id.toUpperCase()+' · '+c.label,c.id)));
  $('branchChoice').value=b.active;
 }
t=0;shownStep=-1;notesKey='';resetZoom();$('viewerCamera').hidden=false;$('title').textContent=d.title;$('objective').textContent=d.objective;$('seek').max=drillDuration(d);$('runs').checked=opts.runs;$('passes').checked=opts.passes;$('labels').checked=opts.labels;$('decisions').checked=opts.decisions;$('markups').checked=opts.markups;$('offside').checked=opts.offside;$('teachingGuides').checked=opts.teachingGuides;$('orientation').value=opts.orientation;$('scaleMode').value=opts.scaleMode;$('framing').value=opts.framing;$('controls').hidden=false;$('empty').hidden=true;$('coachResources').hidden=false;$('coachCardContent').innerHTML=coachingMarkup(d);$('coachSequenceContent').innerHTML=sequenceMarkup(d);$('message').textContent='';render()}
let soundOn=true;
$('whistleSound').onclick=()=>{soundOn=!soundOn;$('whistleSound').setAttribute('aria-pressed',String(soundOn));$('whistleSound').textContent=soundOn?'Whistle sound: on':'Whistle sound: off'};
$('play').onclick=()=>{
 if(!d)return;
 if(playing){stop();return}
 const total=drillDuration(d);
 if(t>=total){t=0;choiceResolved=false}
 if(hasOutcomes(d)&&!choiceResolved&&t>=decisionTime(d)-1e-6){showOutcomeDecision();return}
 playing=true;$('play').textContent='Pause';
 if(soundOn&&crossedWhistles(d,t,t,{includeStart:true}).length)playWhistle();
 last=performance.now();
 function tick(now){
  if(!playing)return;
  const from=t,delta=(now-last)/1000*Number($('speed').value);
  t=Math.min(total,from+delta);last=now;
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
for(const k of ['runs','passes','labels','decisions','markups','offside','teachingGuides','orientation','scaleMode','framing'])$(k).onchange=()=>{opts[k]=['orientation','scaleMode','framing'].includes(k)?$(k).value:$(k).checked;if(['orientation','framing'].includes(k))resetZoom();render()};
$('file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>3000000)throw Error('File is too large.');open(JSON.parse(await file.text()),opts)}catch(err){$('message').textContent=err.message}};
$('coachSequenceContent').onclick=e=>{const b=e.target.closest('[data-jump-step]');if(!b||!d)return;stop();jumpStep(Number(b.dataset.jumpStep),true)};
$('downloadDrill').onclick=()=>{if(d)saveBlob(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),outputName(d)+'-presentation.json')};
$('print').onclick=()=>{if(d){stop();printDrill(d,opts)}};
$('video').onclick=async()=>{if(!d||movieProgress.active)return;stop();$('video').disabled=true;$('message').textContent='';try{const snapshot=d,settings={...opts,...getMovieSettings()};const result=await movieProgress.run(async(progress,signal)=>{const result=await recordDrill(snapshot,settings,progress,signal);if(!signal.aborted)saveBlob(result.blob,outputName(snapshot)+'.'+result.extension);return result});if(result)$('message').textContent='Video exported · '+result.width+' × '+result.height+' · '+result.extension.toUpperCase()+'.'}finally{$('video').disabled=false}};
const params=new URLSearchParams(location.search),catalogueId=params.get('drill');
async function reviewCopy(value,message){if(await copyText(value)){$('reviewStatus').textContent=message;return}$('reviewCopyValue').value=value;$('reviewCopyDialog').showModal();$('reviewCopyValue').select()}
if(catalogueId!==null){
 // Catalogued resources are read-only and load only by a validated catalogue identifier.
 document.body.classList.add('catalogue-player');$('backLibrary').hidden=false;$('backLibrary').href=libraryHref(readFilters(params));$('openFileLabel').hidden=true;$('downloadDrill').hidden=true;
 $('empty').innerHTML='<h2>Loading drill…</h2><p>Please use the library link to choose another resource.</p>';
 try{
  if(!/^seed-[0-9]{3,}$/.test(catalogueId))throw Error('Invalid drill identifier.');
  const list=await loadCatalogue(),entry=list.find(x=>x.id===catalogueId);if(!entry)throw Error('This drill is not in the published catalogue.');
  const compose=new URL('./library.html',location.href);compose.searchParams.set('video',entry.id);$('addPlayerToVideo').href=compose.href;$('addPlayerToVideo').hidden=false;
  open(entry,{offside:params.has('offside')?params.get('offside')==='1':entry.id==='seed-082',teachingGuides:params.get('guides')!=='0',scaleMode:params.get('scale')==='coaching'?'coaching':'realistic',framing:params.get('framing')==='action'?'action':'field'});document.title=entry.title+' · Rugby Coaching Library';
  if(entry.publishedAt){const stamp=document.createElement('small');stamp.className='published-stamp';stamp.textContent='Public copy updated '+new Date(entry.publishedAt).toLocaleDateString('en-GB')+' · '+(Number.isInteger(entry.publishedRevision)?'Revision '+entry.publishedRevision:'Legacy revision');$('objective').before(stamp)}
  $('catalogueReview').hidden=false;
  const shareLink=()=>{const link=new URL(drillHref(entry.id),location.href);link.searchParams.set('offside',opts.offside?'1':'0');link.searchParams.set('guides',opts.teachingGuides?'1':'0');link.searchParams.set('scale',opts.scaleMode);link.searchParams.set('framing',opts.framing);return link.href};
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

