import {esc} from './model.js?v=0.5.3';
import {playbackData,renderScene,drillDuration} from './scene.js?v=0.7.0';
import {moviePlan,movieMoment,movieRaster,rasterSVG} from './movie.js?v=0.6.1';
const RAW_LIMIT=3000000,LINK_LIMIT=60000;
const encode64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')};
const decode64=s=>{if(!/^[A-Za-z0-9_-]+$/.test(s))throw Error('Invalid share code.');return Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0))};
export async function readLimited(stream,max=RAW_LIMIT){const reader=stream.getReader(),parts=[];let length=0;try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();throw Error('Drill is too large.')}parts.push(value)}}finally{reader.releaseLock()}const out=new Uint8Array(length);let offset=0;for(const p of parts){out.set(p,offset);offset+=p.length}return out}
export function outputOptions(o={}){return {orientation:o.orientation==='right'?'right':'up',runs:o.runs!==false,passes:o.passes!==false,labels:o.labels!==false}}
export async function shareCode(d,opts={}){
 const raw=new TextEncoder().encode(JSON.stringify({drill:playbackData(d),options:outputOptions(opts)}));if(raw.length>RAW_LIMIT)throw Error('Drill too large for a link. Export JSON and open it in the player instead.');
 let prefix='j',bytes=raw;
 if(typeof CompressionStream!=='undefined'){const packed=await readLimited(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip')));if(packed.length<raw.length){bytes=packed;prefix='g'}}
 const code=prefix+'.'+encode64(bytes);if(code.length>LINK_LIMIT)throw Error('Link is too long. Export JSON and open it in the read-only player instead.');return code;
}
export async function decodeShare(code){
 if(typeof code!=='string'||code.length>LINK_LIMIT||!['j.','g.'].includes(code.slice(0,2)))throw Error('Invalid or oversized presentation link.');
 let bytes=decode64(code.slice(2));if(code.startsWith('g.')){if(typeof DecompressionStream==='undefined')throw Error('This browser cannot open compressed links. Use a modern browser.');bytes=await readLimited(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')))}
 const p=JSON.parse(new TextDecoder().decode(bytes));return {drill:playbackData(p.drill),options:outputOptions(p.options)};
}
export function saveBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
export const outputName=d=>String(d.title||'rugby-drill').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'').slice(0,90)||'rugby-drill';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function svgImage(svg){return new Promise((resolve,reject)=>{const uri=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'})),im=new Image();im.onload=()=>{URL.revokeObjectURL(uri);resolve(im)};im.onerror=()=>{URL.revokeObjectURL(uri);reject(Error('Could not render the video frame.'))};im.src=uri})}
function fitText(ctx,text,max){let s=String(text||'');while(s.length>1&&ctx.measureText(s).width>max)s=s.slice(0,-2)+'…';return s}
export async function recordDrill(d,opts={},progress=()=>{}){
 const drill=playbackData(d),options=outputOptions(opts),seconds=drillDuration(drill),plan=moviePlan(seconds,opts);
 if(plan.total>360)throw Error('The complete movie exceeds six minutes. Choose normal speed only or a faster replay.');
 if(typeof MediaRecorder==='undefined')throw Error('Video recording is not supported in this browser. Try current Edge or Chrome.');
 const {width:W,height:H,bitrate,fps}=plan.quality,canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 if(!canvas.captureStream)throw Error('Canvas video recording is unavailable in this browser.');
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas is unavailable.');
 // Layout in a 1920 × 1080 design space, rasterise vectors directly at actual output pixels.
 const unit=W/1920,pad=Math.round(38*unit),top=Math.round(92*unit),bottom=Math.round(112*unit);
 const font=(size,bold=false)=>(bold?'bold ':'')+Math.round(size*unit)+'px Arial';
 const draw=async elapsed=>{
  const moment=movieMoment(plan,elapsed),{segment,time}=moment,scene=renderScene(drill,{...options,runs:segment.runs,passes:segment.passes,time});
  const {width:w,height:h}=movieRaster(scene.g,W-2*pad,H-top-bottom);
  const im=await svgImage(rasterSVG(scene.svg,w,h));
  ctx.fillStyle='#111c17';ctx.fillRect(0,0,W,H);ctx.fillStyle='#eef5ec';ctx.font=font(32,true);
  ctx.fillText(fitText(ctx,drill.title,W-2*pad),pad,Math.round(39*unit));
  ctx.fillStyle='#c9f07c';ctx.font=font(22,true);ctx.fillText(segment.title,pad,Math.round(72*unit));
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(im,Math.round((W-w)/2),Math.round(top+(H-top-bottom-h)/2),w,h);
  ctx.font=font(24,true);ctx.fillStyle='#c9f07c';ctx.fillText(fitText(ctx,(scene.index+1)+'. '+scene.frame.name,W-2*pad),pad,H-Math.round(77*unit));
  ctx.fillStyle='#d6e4d6';ctx.font=font(20);
  const legend=segment.kind==='replay'?'Solid arrows: runs · Dashed: pass / ball movement · Dash-dot: kick':segment.runs||segment.passes?'Follow movement and ball position':'Watch the movement without paths';
  ctx.fillText(fitText(ctx,scene.frame.notes||legend,W-2*pad),pad,H-Math.round(43*unit));
  const trackY=H-Math.round(17*unit),trackH=Math.max(2,Math.round(5*unit));
  ctx.fillStyle='#526b59';ctx.fillRect(pad,trackY,W-2*pad,trackH);ctx.fillStyle='#c9f07c';ctx.fillRect(pad,trackY,(W-2*pad)*moment.progress,trackH);
  // Mark the boundary between normal-speed and coaching replay.
  if(plan.segments.length>1){ctx.fillStyle='#f4f7ee';ctx.fillRect(pad+(W-2*pad)*plan.segments[0].end/plan.total-1,trackY-2,Math.max(2,Math.round(3*unit)),trackH+4)}
 };
 await draw(0);const stream=canvas.captureStream(fps);
 let recorder,recorded;
 try{
  // Avoid a restrictive fixed H.264 profile/level, especially for Full HD and 4K.
  const types=['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
  const candidates=types.filter(v=>MediaRecorder.isTypeSupported?.(v));candidates.push('');
  let lastError;for(const mime of candidates){try{recorder=new MediaRecorder(stream,{...(mime?{mimeType:mime}:{}),videoBitsPerSecond:bitrate});break}catch(e){lastError=e}}
  if(!recorder)throw lastError||Error('The chosen resolution cannot be encoded in this browser.');
  const chunks=[];let encoderError=null;
  recorded=new Promise((res,rej)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>res(new Blob(chunks,{type:recorder.mimeType||chunks[0]?.type||'video/webm'}));recorder.onerror=e=>{encoderError=e.error||Error('Video encoder failed.');rej(encoderError)}});
  recorded.catch(()=>{});
  recorder.start(250);progress(0);const start=performance.now();let elapsed=0;
  // Record in real time. Holds introduce each pass and make the reset intentional.
  while(elapsed<plan.total){
   if(encoderError)throw encoderError;if(recorder.state==='inactive')throw Error('Recording ended unexpectedly.');
   if(document.hidden)throw Error('The tab was hidden during recording. Export again with this tab visible.');
   const begin=performance.now();elapsed=Math.min(plan.total,(begin-start)/1000);await draw(elapsed);
   const m=movieMoment(plan,elapsed);progress(elapsed/plan.total,m.segment.title);
   await delay(Math.max(0,1000/fps-(performance.now()-begin)));
  }
  await delay(120);recorder.stop();const blob=await recorded;if(!blob.size)throw Error('No video data was produced.');
  return {blob,extension:blob.type.includes('mp4')?'mp4':'webm',width:W,height:H,seconds:plan.total};
 }catch(e){if(recorder?.state==='recording')recorder.stop();throw e}finally{for(const track of stream.getTracks())track.stop()}
}
function excerpt(s,n){const v=String(s||'').trim();return v.length>n?v.slice(0,n-1)+'…':v}
export function printMarkup(raw,opts={}){
 const d=playbackData(raw),o=outputOptions(opts),pages=[];const age=d.ageMin===d.ageMax?'U'+d.ageMin:'U'+d.ageMin+'–U'+d.ageMax;
 for(let i=0;i<d.frames.length;i+=2){
  const cards=d.frames.slice(i,i+2).map((fr,j)=>{const k=i+j,scene=renderScene(d,{...o,index:k,ink:true,ghosts:true,runs:true,passes:true,labels:true,prefix:'p'+k});
   return '<article class="print-step"><h3>'+String(k+1).padStart(2,'0')+' · '+esc(fr.name)+' <small>'+(k?fr.seconds.toFixed(1)+' s':'Setup')+'</small></h3><div class="print-step-body"><div class="print-diagram">'+scene.svg+'</div><div><h4>What to do</h4><p>'+esc(excerpt(fr.notes,650)||'Follow the positions and movement arrows in the diagram.')+'</p><h4>Coach notes</h4><div class="print-notelines"></div></div></div></article>'}).join('');
  pages.push('<section class="print-page"><header><div><small>RUGBY COACHING STUDIO · '+age+'</small><h1>'+esc(d.title)+'</h1></div><p>'+d.length+' × '+d.width+' m<br>Page '+(i/2+1)+' / '+Math.ceil(d.frames.length/2)+'</p></header>'+(i===0?'<div class="print-summary"><b>Objective:</b> '+esc(excerpt(d.objective,330)||'See sequence.')+'<br><b>Equipment:</b> '+esc(excerpt(d.equipment,210)||'See setup.')+'<br><b>Safety:</b> '+esc(excerpt(d.safety,330)||'Follow club and age-grade guidance.')+'</div>':'')+'<div class="print-legend"><span> ───➤ Run / movement</span><span> – – ➤ Ball movement · – · – Kick</span><span> ◌ Starting position</span></div>'+cards+'<footer>Coach-created diagram · check age-grade rules and safe practice before delivery.</footer></section>');
 }return pages.join('');
}
export function printDrill(d,opts={}){document.getElementById('printPack')?.remove();const div=document.createElement('div');div.id='printPack';div.innerHTML=printMarkup(d,opts);document.body.append(div);window.print()}
