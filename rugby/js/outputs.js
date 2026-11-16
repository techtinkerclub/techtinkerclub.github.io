import {esc} from './model.js?v=0.5.3';
import {playbackData,renderScene,drillDuration} from './scene.js?v=0.6.0';
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
 const drill=playbackData(d),options=outputOptions(opts),seconds=drillDuration(drill);
 if(seconds<=0)throw Error('Add at least one movement step before exporting a movie.');
 if(seconds>180)throw Error('Movie export currently supports drills up to three minutes. Use the presentation link for longer drills.');
 if(typeof MediaRecorder==='undefined')throw Error('Video recording is not supported in this browser. Try current Edge or Chrome.');
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;if(!canvas.captureStream)throw Error('Canvas video recording is unavailable in this browser.');
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas is unavailable.');
 const draw=async t=>{
  const scene=renderScene(drill,{...options,time:t}),im=await svgImage(scene.svg);ctx.fillStyle='#111c17';ctx.fillRect(0,0,1280,720);ctx.fillStyle='#eef5ec';ctx.font='bold 24px Arial';ctx.fillText(fitText(ctx,drill.title,1190),40,38);
  const scale=Math.min(1190/im.width,552/im.height),w=im.width*scale,h=im.height*scale;ctx.drawImage(im,(1280-w)/2,57+(552-h)/2,w,h);
  ctx.font='bold 18px Arial';ctx.fillStyle='#c9f07c';ctx.fillText(fitText(ctx,(scene.index+1)+'. '+scene.frame.name,1050),40,642);
  ctx.fillStyle='#d6e4d6';ctx.font='15px Arial';ctx.fillText(fitText(ctx,scene.frame.notes||'Solid arrows: runs · Dashed arrows: ball movement',1200),40,670);
  ctx.fillStyle='#81988a';ctx.fillRect(40,690,1200,4);ctx.fillStyle='#c9f07c';ctx.fillRect(40,690,1200*(t/seconds),4);
 };
 await draw(0);const stream=canvas.captureStream(25);
 let recorder,recorded;
 try{
  const types=['video/mp4;codecs=avc1.42001E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];const mime=types.find(v=>MediaRecorder.isTypeSupported?.(v));
  recorder=new MediaRecorder(stream,{...(mime?{mimeType:mime}:{}),videoBitsPerSecond:3500000});const chunks=[];
  recorded=new Promise((res,rej)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>res(new Blob(chunks,{type:recorder.mimeType||mime||'video/webm'}));recorder.onerror=e=>rej(e.error||Error('Video encoder failed.'))});
  recorder.start(250);progress(0);await delay(350);const start=performance.now();let t=0;
  while(t<seconds){const begin=performance.now();t=Math.min(seconds,(begin-start)/1000);await draw(t);progress(t/seconds);await delay(Math.max(0,40-(performance.now()-begin)))}
  await delay(450);recorder.stop();const blob=await recorded;if(!blob.size)throw Error('No video data was produced.');return {blob,extension:blob.type.includes('mp4')?'mp4':'webm'};
 }catch(e){if(recorder?.state==='recording')recorder.stop();if(recorded)recorded.catch(()=>{});throw e}finally{for(const track of stream.getTracks())track.stop()}
}
function excerpt(s,n){const v=String(s||'').trim();return v.length>n?v.slice(0,n-1)+'…':v}
export function printMarkup(raw,opts={}){
 const d=playbackData(raw),o=outputOptions(opts),pages=[];const age=d.ageMin===d.ageMax?'U'+d.ageMin:'U'+d.ageMin+'–U'+d.ageMax;
 for(let i=0;i<d.frames.length;i+=2){
  const cards=d.frames.slice(i,i+2).map((fr,j)=>{const k=i+j,scene=renderScene(d,{...o,index:k,ink:true,ghosts:true,runs:true,passes:true,labels:true,prefix:'p'+k});
   return '<article class="print-step"><h3>'+String(k+1).padStart(2,'0')+' · '+esc(fr.name)+' <small>'+(k?fr.seconds.toFixed(1)+' s':'Setup')+'</small></h3><div class="print-step-body"><div class="print-diagram">'+scene.svg+'</div><div><h4>What to do</h4><p>'+esc(excerpt(fr.notes,650)||'Follow the positions and movement arrows in the diagram.')+'</p><h4>Coach notes</h4><div class="print-notelines"></div></div></div></article>'}).join('');
  pages.push('<section class="print-page"><header><div><small>RUGBY COACHING STUDIO · '+age+'</small><h1>'+esc(d.title)+'</h1></div><p>'+d.length+' × '+d.width+' m<br>Page '+(i/2+1)+' / '+Math.ceil(d.frames.length/2)+'</p></header>'+(i===0?'<div class="print-summary"><b>Objective:</b> '+esc(excerpt(d.objective,330)||'See sequence.')+'<br><b>Equipment:</b> '+esc(excerpt(d.equipment,210)||'See setup.')+'<br><b>Safety:</b> '+esc(excerpt(d.safety,330)||'Follow club and age-grade guidance.')+'</div>':'')+'<div class="print-legend"><span> ───➤ Run / movement</span><span> – – ➤ Ball movement</span><span> ◌ Starting position</span></div>'+cards+'<footer>Coach-created diagram · check age-grade rules and safe practice before delivery.</footer></section>');
 }return pages.join('');
}
export function printDrill(d,opts={}){document.getElementById('printPack')?.remove();const div=document.createElement('div');div.id='printPack';div.innerHTML=printMarkup(d,opts);document.body.append(div);window.print()}
