import {playbackData,renderScene,drillDuration} from './scene.js?v=0.6.0';
import {decodeShare,outputOptions,printDrill,recordDrill,saveBlob,outputName} from './outputs.js?v=0.6.0';
const $=id=>document.getElementById(id);let d=null,opts=outputOptions(),t=0,raf=0,playing=false,last=0;
function stop(){playing=false;cancelAnimationFrame(raf);$('play').textContent='Play'}
function render(){if(!d)return;const s=renderScene(d,{...opts,time:t});$('board').innerHTML=s.svg;$('phase').textContent=(s.index+1)+' / '+d.frames.length+' · '+s.frame.name;$('notes').textContent=s.frame.notes||'';$('time').textContent=t.toFixed(1)+' / '+drillDuration(d).toFixed(1)+' s';$('seek').value=t}
function open(data,options){stop();d=playbackData(data);opts=outputOptions(options);t=0;$('title').textContent=d.title;$('objective').textContent=d.objective;$('seek').max=drillDuration(d);$('runs').checked=opts.runs;$('passes').checked=opts.passes;$('labels').checked=opts.labels;$('orientation').value=opts.orientation;$('controls').hidden=false;$('empty').hidden=true;$('message').textContent='';render()}
$('play').onclick=()=>{if(!d)return;if(playing){stop();return}if(t>=drillDuration(d))t=0;playing=true;$('play').textContent='Pause';last=performance.now();function tick(now){if(!playing)return;t=Math.min(drillDuration(d),t+(now-last)/1000*Number($('speed').value));last=now;render();if(t>=drillDuration(d))stop();else raf=requestAnimationFrame(tick)}raf=requestAnimationFrame(tick)};
$('restart').onclick=()=>{stop();t=0;render()};$('seek').oninput=()=>{stop();t=Number($('seek').value);render()};
for(const k of ['runs','passes','labels','orientation'])$(k).onchange=()=>{opts[k]=k==='orientation'?$(k).value:$(k).checked;render()};
$('file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>3000000)throw Error('File is too large.');open(JSON.parse(await file.text()),opts)}catch(err){$('message').textContent=err.message}};
$('print').onclick=()=>{if(d){stop();printDrill(d,opts)}};
$('video').onclick=async()=>{if(!d)return;stop();$('video').disabled=true;try{const result=await recordDrill(d,opts,p=>$('message').textContent='Recording '+Math.round(p*100)+'% · keep this tab open');saveBlob(result.blob,outputName(d)+'.'+result.extension);$('message').textContent='Video exported.'}catch(err){$('message').textContent=err.message}finally{$('video').disabled=false}};
try{if(location.hash.length>1){const p=await decodeShare(location.hash.slice(1));open(p.drill,p.options)}}catch(err){$('message').textContent=err.message+' Open an exported JSON file instead.'}
