import {esc} from './model.js?v=0.5.3';
import {playbackData,renderScene,drillDuration} from './scene.js?v=0.20.84';
import {hasOutcomes,outcomeViews} from './branching.js?v=2';
import {outcomeCardsMarkup} from './branching-visual.js?v=12';
import {decisionList,decisionText} from './training.js?v=0.18.8';
import {moviePlan,movieMoment,movieRaster,rasterSVG} from './movie.js?v=0.20.81';
import {recordCoachingMovie} from './video-recorder.js?v=0.20.83';
import {createMovieFrame} from './movie-frame.js?v=0.7.2';
import {encodeDeterministicVideo} from './deterministic-video.js?v=0.20.83';
import {cardAge,cardMeta,cardEntries,cardLinks,coachingMarkup,wrapCanvas,noteLines,decisionMarkup,branchDecisionMarkup} from './coaching-output.js?v=0.13.10';
const RAW_LIMIT=3000000,LINK_LIMIT=60000;
const encode64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')};
const decode64=s=>{if(!/^[A-Za-z0-9_-]+$/.test(s))throw Error('Invalid share code.');return Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0))};
export async function readLimited(stream,max=RAW_LIMIT){const reader=stream.getReader(),parts=[];let length=0;try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();throw Error('Drill is too large.')}parts.push(value)}}finally{reader.releaseLock()}const out=new Uint8Array(length);let offset=0;for(const p of parts){out.set(p,offset);offset+=p.length}return out}
export function outputOptions(o={}){return {orientation:o.orientation==='right'?'right':'up',runs:o.runs!==false,passes:o.passes!==false,labels:o.labels!==false,decisions:o.decisions!==false,offside:o.offside===true,teachingGuides:o.teachingGuides!==false,markups:o.markups!==false,scaleMode:o.scaleMode==='coaching'?'coaching':'realistic',framing:['action','follow'].includes(o.framing)?o.framing:'field',cartoonMode:o.cartoonMode===true}}
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
export async function recordDrill(d,opts={},progress=()=>{},signal=null){
 // Storyboard mode is the default for decisions and linked drill videos.
 // Keep the proven legacy player for a single ordinary linear-drill export.
 const movieSequence=Array.isArray(opts.sequenceDrills)&&opts.sequenceDrills.length?opts.sequenceDrills:null;
 if(movieSequence||hasOutcomes(d)||opts.cartoonMode===true)
  return recordCoachingMovie(movieSequence||[d],opts,progress,signal);

 const checkAbort=()=>{if(signal?.aborted)throw new DOMException('Export cancelled','AbortError')};checkAbort();progress(0,'Preparing video…');
 const drill=playbackData(d),options=outputOptions(opts);
 const views=hasOutcomes(drill)&&opts.branchMode!=='selected'?outcomeViews(drill):[{id:hasOutcomes(drill)?drill.branching.active:'',label:hasOutcomes(drill)?drill.branching.choices.find(c=>c.id===drill.branching.active).label:'Complete drill',drill:outcomeViews(drill).find(v=>!hasOutcomes(drill)||v.id===drill.branching.active).drill}];
 let videoDuration=0;
 const chapters=views.map(v=>{const plan=moviePlan(drillDuration(v.drill),opts),start=videoDuration;videoDuration+=plan.total;return {...v,plan,start,end:videoDuration,headline:v.id?'OPTION '+v.id.toUpperCase()+' · '+v.label:''}});
 const plan=chapters[0].plan;
 if(videoDuration>360)throw Error('The complete video exceeds six minutes. Choose normal speed only, a faster replay, or export only the selected outcome.');
 const {width:W,height:H,bitrate,fps}=plan.quality,frame=createMovieFrame(W,H),{canvas,ctx}=frame;
 // Short-form video uses a distinct layout, not a cropped landscape video.
 const portrait=plan.options.format==='portrait',unit=W/(portrait?1080:1920),pad=Math.round((portrait?72:42)*unit),right=portrait?Math.round(120*unit):pad,content=W-pad-right;
 const top=Math.round((portrait?260:110)*unit),bottom=Math.round((portrait?(plan.options.notes?490:285):(plan.options.notes?190:105))*unit);
 const font=(size,bold=false)=>(bold?'bold ':'')+Math.round(size*unit)+'px Arial';
 const line=(s,y,size,bold=false,color='#eef5ec')=>{ctx.font=font(size,bold);ctx.fillStyle=color;ctx.fillText(fitText(ctx,s,content),pad,Math.round(y))};
 const block=(lines,y,size,bold=false,color='#eef5ec')=>{ctx.font=font(size,bold);ctx.fillStyle=color;for(const text of lines){ctx.fillText(text,pad,Math.round(y));y+=size*1.28*unit}return y};
 // Optional paginated full coaching card. Text is wrapped, not silently truncated.
 const cardPages=[];if(plan.options.card){
  const size=portrait?34:28,maxLines=portrait?26:21;ctx.font=font(size);
  for(const entry of [...cardEntries(drill),...chapters.flatMap(ch=>ch.drill.frames.map((f,i)=>({label:(ch.headline?ch.headline+' · ':'')+'Step '+(i+1)+' · '+f.name,value:[f.signal?.kind==='whistle'?'Coach whistle · GO ('+Number(f.signal.duration??0.5).toFixed(1)+' s cue)':'',String(f.notes||'').trim(),hasOutcomes(drill)&&i===drill.branching.fork?drill.branching.question+' · '+drill.branching.choices.map(q=>q.id.toUpperCase()+': '+q.label).join(' / '):decisionText(f)].filter(Boolean).join('\n')}))).filter(x=>x.value),...cardLinks(drill).map(x=>({label:'Reference',value:x.label+' — '+x.url}))]){
   const lines=wrapCanvas(ctx,entry.value,content);for(let n=0;n<lines.length;n+=maxLines){const part=lines.slice(n,n+maxLines),words=part.join(' ').split(/\s+/).length;cardPages.push({label:entry.label+(n?' (continued)':''),lines:part,seconds:Math.max(3,1.5+words/3)})}
  }
 }
 let total=videoDuration;for(const page of cardPages){page.start=total;total+=page.seconds;page.end=total}
 if(total>360)throw Error('Video with coaching card exceeds six minutes. Choose a faster replay or export the full card as paper / presentation.');
 const draw=elapsed=>frame.present(async()=>{
  ctx.fillStyle='#111c17';ctx.fillRect(0,0,W,H);
  const page=elapsed>=videoDuration&&cardPages.length?(cardPages.find(p=>elapsed<p.end)||cardPages.at(-1)):null;
  if(page){const k=cardPages.indexOf(page);line('COACHING CARD · '+(k+1)+' / '+cardPages.length,72*unit,portrait?26:22,true,'#c9f07c');line(drill.title,125*unit,portrait?40:36,true);line(cardMeta(drill),171*unit,portrait?27:24,false,'#b7c8ba');line(page.label,240*unit,portrait?39:35,true,'#c9f07c');block(page.lines,302*unit,portrait?34:28);return}
  const chapter=chapters.find(c=>elapsed<c.end)||chapters.at(-1);
  const moment=movieMoment(chapter.plan,Math.max(0,elapsed-chapter.start)),{segment,time}=moment,scene=renderScene(chapter.drill,{...options,runs:segment.runs,passes:segment.passes,decisions:options.decisions&&(plan.options.mode==='single'||segment.kind==='replay'),time});
  const headline=chapter.headline?chapter.headline+' · '+segment.title:segment.title;
  const {width:w,height:h}=movieRaster(scene.g,content,H-top-bottom),im=await svgImage(rasterSVG(scene.svg,w,h));
  if(portrait){line('RUGBY COACHING STUDIO',76*unit,25,true,'#c9f07c');ctx.font=font(42,true);const title=noteLines(ctx,drill.title,content,2);block(title,132*unit,42,true);line(headline,235*unit,28,true,'#c9f07c')}
  else{line(drill.title,39*unit,34,true);line(headline,77*unit,23,true,'#c9f07c')}
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(im,Math.round(pad+(content-w)/2),Math.round(top+(H-top-bottom-h)/2),w,h);
  const base=H-bottom+Math.round((portrait?53:32)*unit);
  line((scene.index+1)+'. '+scene.frame.name,base,portrait?34:26,true,'#c9f07c');
  const legend=segment.kind==='replay'?'Solid: runs · Dashed: ball movement · Dash-dot: kick':'Watch the movement';
  const size=portrait?32:23;ctx.font=font(size);
  if(plan.options.notes){const q=options.decisions&&(plan.options.mode==='single'||segment.kind==='replay')?decisionList(scene.frame).map(x=>x.label+': '+x.decision.question).join(' · '):'';const value=[q,scene.frame.notes].filter(Boolean).join('\n')||legend,limit=portrait?5:3;const wrapped=wrapCanvas(ctx,value,content),lines=noteLines(ctx,value,content,limit);let after=block(lines,base+(portrait?53:37)*unit,size,false,'#d6e4d6');if(wrapped.length>limit)line('Full step notes in coaching sheets / presentation',after+6*unit,portrait?22:17,false,'#b7c8ba')}
  const trackY=H-Math.round((portrait?140:16)*unit),trackH=Math.max(2,Math.round(5*unit));ctx.fillStyle='#526b59';ctx.fillRect(pad,trackY,content,trackH);ctx.fillStyle='#c9f07c';ctx.fillRect(pad,trackY,content*Math.min(1,elapsed/total),trackH);
  if(chapters.length>1){for(const ch of chapters.slice(1)){ctx.fillStyle='#f4f7ee';ctx.fillRect(pad+content*ch.start/total-1,trackY-2,Math.max(2,Math.round(3*unit)),trackH+4)}}
  else if(plan.segments.length>1){ctx.fillStyle='#f4f7ee';ctx.fillRect(pad+content*plan.segments[0].end/total-1,trackY-2,Math.max(2,Math.round(3*unit)),trackH+4)}
 });
 await draw(0);checkAbort(); // Start capture only after a complete initial frame exists.
 if(!frame.ready)throw Error('Initial movie frame did not render.');
 const precise=await encodeDeterministicVideo({canvas,draw,seconds:total,
  fps,bitrate,signal,progress:(fraction,t)=>{
   const ch=chapters.find(x=>t<x.end)||chapters.at(-1);
   const m=movieMoment(ch.plan,Math.max(0,t-ch.start));
   progress(fraction,t>=videoDuration&&cardPages.length?'Rendering · Coaching card':'Rendering · '+(ch.headline?ch.headline+' · ':'')+m.segment.title);
  }});
 if(precise)return precise;
 if(typeof MediaRecorder==='undefined')throw Error('Video recording is not supported in this browser. Try current Edge or Chrome.');
 if(!canvas.captureStream)throw Error('Canvas video recording is unavailable in this browser.');
 const stream=canvas.captureStream(fps);
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
  recorder.start(250);progress(0,'Recording · '+(chapters[0].headline||plan.segments[0].title));const start=performance.now();let elapsed=0;
  // Record in real time. Holds introduce each pass and make the reset intentional.
  while(elapsed<total){
   checkAbort();if(encoderError)throw encoderError;if(recorder.state==='inactive')throw Error('Recording ended unexpectedly.');
   if(document.hidden)throw Error('The tab was hidden during recording. Export again with this tab visible.');
   const begin=performance.now();elapsed=Math.min(total,(begin-start)/1000);await draw(elapsed);checkAbort();
   const ch=chapters.find(x=>elapsed<x.end)||chapters.at(-1),m=movieMoment(ch.plan,Math.max(0,elapsed-ch.start));
   progress(elapsed/total,elapsed>=videoDuration&&cardPages.length?'Coaching card':(ch.headline?ch.headline+' · ':'')+m.segment.title);
   await delay(Math.max(0,1000/fps-(performance.now()-begin)));
  }
  checkAbort();progress(1,'Finalising video…');await delay(120);checkAbort();recorder.stop();const blob=await recorded;checkAbort();if(!blob.size)throw Error('No video data was produced.');
  return {blob,extension:blob.type.includes('mp4')?'mp4':'webm',width:W,height:H,seconds:total,encoder:'compatibility-live'};
 }catch(e){if(recorder?.state==='recording')recorder.stop();throw e}finally{for(const track of stream.getTracks())track.stop()}
}
export function printMarkup(raw,opts={}){
 const d=playbackData(raw);
 if(hasOutcomes(d)){
  const b=d.branching;
  const cover='<section class="print-page print-card"><header><div><small>RUGBY COACHING STUDIO · DECISION DRILL</small><h1>'+esc(d.title)+'</h1></div><p>Shared setup · two playable outcomes</p></header>'+coachingMarkup(d)+outcomeCardsMarkup(d,'print',opts)+'<footer>Check current age-grade rules and contact safety before delivery.</footer></section>';
  return cover+outcomeViews(d).map((v,i)=>'<section class="print-page print-branch-heading"><small>◆ PLAYABLE DECISION · OPTION '+v.id.toUpperCase()+'</small><h2>'+esc(v.label)+'</h2><p><strong>Decision:</strong> '+esc(b.question)+'</p><p>Shared setup and signal, then outcome '+v.id.toUpperCase()+'. Repeat the exercise with the other outcome.</p></section>'+printMarkup(v.drill,{...opts,_skipCard:true,_branching:b,_branchFork:b.fork})).join('');
 }
 const o=outputOptions(opts),pages=[],age=cardAge(d),groups=[];
 // Long notes receive their own sequence section; they may flow to another sheet rather than disappear.
 for(let i=0;i<d.frames.length;){const count=d.frames[i].notes.length>500||d.frames[i+1]?.notes.length>500||decisionList(d.frames[i]).length||decisionList(d.frames[i+1]).length?1:2;groups.push({start:i,frames:d.frames.slice(i,i+count)});i+=count}
 const head=(label)=>'<header><div><small>RUGBY COACHING STUDIO · '+esc(age)+'</small><h1>'+esc(d.title)+'</h1></div><p>'+esc(label)+'</p></header>';
 if(!opts._skipCard)pages.push('<section class="print-page print-card">'+head('Coaching card')+coachingMarkup(d)+'<footer>Check current age-grade laws and safe coaching practice before delivery.</footer></section>');
 for(const [index,group] of groups.entries()){
  const cards=group.frames.map((fr,j)=>{const k=group.start+j,scene=renderScene(d,{...o,index:k,ink:true,ghosts:true,runs:true,passes:true,labels:true,prefix:'p'+k});
   return '<article class="print-step'+(fr.notes.length>500||decisionList(fr).length?' long-note':'')+'"><h3>'+String(k+1).padStart(2,'0')+' · '+esc(fr.name)+' <small>'+(k?fr.seconds.toFixed(1)+' s':fr.seconds>0?'Setup hold · '+fr.seconds.toFixed(1)+' s':'Setup')+'</small></h3><div class="print-step-body"><div class="print-diagram">'+scene.svg+'</div><div><h4>Technical coaching notes</h4><p>'+esc(fr.notes||'Follow the positions and movement arrows in the diagram.')+'</p>'+(o.decisions?(opts._branching&&k===opts._branchFork?branchDecisionMarkup(opts._branching):decisionMarkup(fr)):'')+'<h4>Coach observations</h4><div class="print-notelines"></div></div></div></article>'}).join('');
  pages.push('<section class="print-page">'+head('Sequence '+(index+1)+' / '+groups.length)+'<div class="print-legend"><span> ───➤ Run / movement</span><span> – – ➤ Ball movement · – · – Kick</span><span> ◌ Starting position · ◆ Decision / dotted alternative</span></div>'+cards+'<footer>'+esc(cardMeta(d))+' · check age-grade laws before delivery.</footer></section>');
 }return pages.join('');
}
export function printProgression(drills,title='Coaching progression',opts={}){
 if(!Array.isArray(drills)||!drills.length||drills.length>8)throw Error('Choose between one and eight drills for the progression pack.');
 const list=drills.map(d=>playbackData(d));
 const heading='<section class="print-page print-card"><header><div><small>RUGBY COACHING STUDIO · PROGRESSION PACK</small><h1>'+esc(String(title||'Coaching progression').slice(0,160))+'</h1></div><p>'+list.length+' linked drills</p></header><h2>Session sequence</h2><ol>'+list.map((d,i)=>'<li><strong>'+String(i+1)+'. '+esc(d.title)+'</strong> · '+esc(cardMeta(d))+(d.objective?'<p>'+esc(d.objective)+'</p>':'')+'</li>').join('')+'</ol><p>Follow the drills in this order. Each section has its own coaching notes and diagrams; return to its setup before beginning the next drill.</p><footer>Check current age-grade rules, space, supervision and contact safety before delivery.</footer></section>';
 const chapters=list.map((d,i)=>'<section class="print-page print-branch-heading"><small>PROGRESSION STAGE '+(i+1)+' OF '+list.length+'</small><h2>'+esc(d.title)+'</h2><p>'+esc(cardMeta(d))+'</p></section>'+printMarkup(d,opts)).join('');
 document.getElementById('printPack')?.remove();
 const div=document.createElement('div');div.id='printPack';div.innerHTML=heading+chapters;document.body.append(div);window.print();
}
export function printDrill(d,opts={}){document.getElementById('printPack')?.remove();const div=document.createElement('div');div.id='printPack';div.innerHTML=printMarkup(d,opts);document.body.append(div);window.print()}
