import {playbackData,renderScene,drillDuration} from './scene.js?v=0.9.0';
import {decodeShare,outputOptions,printDrill,recordDrill,saveBlob,outputName} from './outputs.js?v=0.9.0';
import {createExportProgress} from './export-progress.js?v=0.7.3';
import {bindMovieSettings} from './movie.js?v=0.7.1';
import {coachingMarkup,sequenceMarkup,decisionMarkup} from './coaching-output.js?v=0.8.0';
const $=id=>document.getElementById(id);const movieProgress=createExportProgress();const getMovieSettings=bindMovieSettings($('playerMovieOptions'),'playerMovie');let d=null,opts=outputOptions(),t=0,raf=0,playing=false,last=0,shownStep=-1,notesKey='',pitchRatio=0;
function stop(){playing=false;cancelAnimationFrame(raf);$('play').textContent='Play'}
function stepEnd(i){return d.frames.slice(0,i+1).reduce((sum,f,k)=>sum+(k?f.seconds:0),0)}
function stepTarget(direction){if(!d)return 0;const i=Math.max(0,shownStep),atEnd=Math.abs(t-stepEnd(i))<1e-7;return Math.max(0,Math.min(d.frames.length-1,direction<0?i-1:atEnd?i+1:i))}
function jumpStep(i,scroll=false){if(!d)return;stop();t=stepEnd(Math.max(0,Math.min(i,d.frames.length-1)));render();if(scroll)$('board').scrollIntoView({block:'start',behavior:'auto'})}
function render(){
 if(!d)return;
 const s=renderScene(d,{...opts,time:t}),ratio=s.g.viewWidth/s.g.viewHeight,board=$('board');
 if(ratio!==pitchRatio){board.style.setProperty('--pitch-ratio',String(ratio));pitchRatio=ratio}
 board.innerHTML=s.svg;shownStep=s.index;
 const key=s.index+':'+opts.decisions;
 if(notesKey!==key){notesKey=key;$('phase').textContent=(s.index+1)+' / '+d.frames.length+' · '+s.frame.name;$('notes').textContent=s.frame.notes||'';$('decisionNow').innerHTML=opts.decisions?decisionMarkup(s.frame):'';$('stepReading').hidden=!s.frame.notes&&!$('decisionNow').innerHTML}
 $('time').textContent=t.toFixed(1)+' / '+drillDuration(d).toFixed(1)+' s';$('seek').value=t;
 $('previousStep').disabled=t<=0;$('nextStep').disabled=t>=drillDuration(d);$('play').disabled=d.frames.length<2;
}
function open(data,options){stop();d=playbackData(data);opts=outputOptions(options);t=0;shownStep=-1;notesKey='';$('title').textContent=d.title;$('objective').textContent=d.objective;$('seek').max=drillDuration(d);$('runs').checked=opts.runs;$('passes').checked=opts.passes;$('labels').checked=opts.labels;$('decisions').checked=opts.decisions;$('orientation').value=opts.orientation;$('controls').hidden=false;$('empty').hidden=true;$('coachResources').hidden=false;$('coachCardContent').innerHTML=coachingMarkup(d);$('coachSequenceContent').innerHTML=sequenceMarkup(d);$('message').textContent='';render()}
$('play').onclick=()=>{if(!d)return;if(playing){stop();return}if(t>=drillDuration(d))t=0;playing=true;$('play').textContent='Pause';last=performance.now();function tick(now){if(!playing)return;t=Math.min(drillDuration(d),t+(now-last)/1000*Number($('speed').value));last=now;render();if(t>=drillDuration(d))stop();else raf=requestAnimationFrame(tick)}raf=requestAnimationFrame(tick)};
$('restart').onclick=()=>jumpStep(0);$('previousStep').onclick=()=>jumpStep(stepTarget(-1));$('nextStep').onclick=()=>jumpStep(stepTarget(1));$('seek').oninput=()=>{stop();t=Number($('seek').value);render()};
for(const k of ['runs','passes','labels','decisions','orientation'])$(k).onchange=()=>{opts[k]=k==='orientation'?$(k).value:$(k).checked;render()};
$('file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>3000000)throw Error('File is too large.');open(JSON.parse(await file.text()),opts)}catch(err){$('message').textContent=err.message}};
$('coachSequenceContent').onclick=e=>{const b=e.target.closest('[data-jump-step]');if(!b||!d)return;stop();jumpStep(Number(b.dataset.jumpStep),true)};
$('downloadDrill').onclick=()=>{if(d)saveBlob(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),outputName(d)+'-presentation.json')};
$('print').onclick=()=>{if(d){stop();printDrill(d,opts)}};
$('video').onclick=async()=>{if(!d||movieProgress.active)return;stop();$('video').disabled=true;$('message').textContent='';try{const snapshot=d,settings={...opts,...getMovieSettings()};const result=await movieProgress.run(async(progress,signal)=>{const result=await recordDrill(snapshot,settings,progress,signal);if(!signal.aborted)saveBlob(result.blob,outputName(snapshot)+'.'+result.extension);return result});if(result)$('message').textContent='Movie exported · '+result.width+' × '+result.height+' · '+result.extension.toUpperCase()+'.'}finally{$('video').disabled=false}};
try{if(location.hash.length>1){const p=await decodeShare(location.hash.slice(1));open(p.drill,p.options)}}catch(err){$('message').textContent=err.message+' Open an exported JSON file instead.'}
