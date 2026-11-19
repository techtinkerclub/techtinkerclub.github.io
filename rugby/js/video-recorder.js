// Story-led movie renderer. Uses the exact shared pitch/animation renderer;
// title/decision/option cards freeze a real scene without changing the drill.
import {playbackData,renderScene} from './scene.js?v=0.20.35';
import {movieStoryboard,storyboardClip,storyboardTime} from './movie-storyboard.js?v=0.20.9';
import {movieOptions,movieRaster,rasterSVG} from './movie.js?v=0.18.4';
import {createMovieFrame} from './movie-frame.js?v=0.7.2';
import {wrapCanvas,cardEntries,cardLinks} from './coaching-output.js?v=0.13.10';

const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function imageFromSVG(svg){
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'})),img=new Image();
  img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
  img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Could not draw a video frame.'))};img.src=url;
 });
}
function fitted(ctx,text,maxWidth){
 let out=String(text||'');
 while(out.length>1&&ctx.measureText(out).width>maxWidth)out=out.slice(0,-2)+'…';
 return out;
}
export async function recordCoachingMovie(raw,opts={},progress=()=>{},signal=null){
 const check=()=>{if(signal?.aborted)throw new DOMException('Export cancelled','AbortError')};
 check();progress(0,'Preparing the coaching video…');
 const source=Array.isArray(raw)?raw:[raw],drills=source.map(playbackData);
 const settings=movieOptions(opts),story=movieStoryboard(drills,opts);
 if(typeof MediaRecorder==='undefined')throw Error('Video recording is not supported in this browser. Try current Chrome or Edge.');
 const quality=settings.quality==='720'?{width:1280,height:720,bitrate:6000000,fps:30}:
  settings.quality==='2160'?{width:3840,height:2160,bitrate:36000000,fps:30}:
  {width:1920,height:1080,bitrate:14000000,fps:30};
 const portrait=settings.format==='portrait',W=portrait?quality.height:quality.width,H=portrait?quality.width:quality.height;
 const {canvas,present,ready}=createMovieFrame(W,H),unit=W/(portrait?1080:1920);
 if(!canvas.captureStream)throw Error('Canvas video recording is unavailable.');
 const pad=Math.round((portrait?65:55)*unit),content=W-pad*2;
 const top=Math.round((portrait?225:130)*unit);
 const bottom=Math.round((portrait?345:205)*unit);
 const sceneHeight=H-top-bottom;
 // Themes affect the output video only. Editor controls remain exactly as before.
 const cartoon=opts.cartoonMode===true;
 const colors=cartoon?{background:'#172d49',panel:'#152943',accent:'#ffe05f',muted:'#a8e0ef',text:'#fff9e8',bar:'#617b94',border:'#ffd45a'}:
  {background:'#101e18',panel:'#203a2b',accent:'#c9f07c',muted:'#a5d4e4',text:'#f3f8f0',bar:'#526657',border:'#a8cf77'};
 const font=(n,bold=false)=>(bold?'700 ':'400 ')+Math.round(n*unit)+'px '+(cartoon?'"Trebuchet MS",Arial,sans-serif':'Arial,sans-serif');
 const cardPages=[];
 // Optional end-card is paginated; leave the film's explanatory pauses intact.
 if(settings.card){
  const probe=canvas.getContext('2d');
  probe.font=font(portrait?32:28);
  for(const [i,d] of drills.entries()){
   const entries=[...cardEntries(d),...cardLinks(d).map(x=>({label:'Reference',value:x.label+' — '+x.url}))];
   for(const entry of entries.filter(q=>q.value)){
    const value=String(entry.value||''),lines=wrapCanvas(probe,value,content-90*unit);
    const maxLines=portrait?20:12;
    for(let offset=0;offset<lines.length;offset+=maxLines){
     const part=lines.slice(offset,offset+maxLines);
     cardPages.push({title:'STAGE '+(i+1)+' · '+d.title,label:entry.label,lines:part,
      seconds:Math.max(3,2+part.join(' ').split(/\s+/).length/3.5)});
    }
   }
  }
 }
 let total=story.total;for(const c of cardPages){c.start=total;total+=c.seconds;c.end=total}
 if(total>360)throw Error('The video with coaching cards exceeds six minutes. Choose a shorter playlist, normal speed, or print the full coaching notes.');
 const draw=(elapsed)=>present(async ctx=>{
  check();
  const endCard=elapsed>=story.total&&cardPages.length?(cardPages.find(q=>elapsed<q.end)||cardPages.at(-1)):null;
  const clip=storyboardClip(story,Math.min(elapsed,Math.max(0,story.total-.0001)));
  ctx.fillStyle=colors.background;ctx.fillRect(0,0,W,H);
  function drawText(text,x,y,size,{bold=false,color=colors.text,max=content}={}){
   ctx.font=font(size,bold);ctx.fillStyle=color;ctx.fillText(fitted(ctx,text,max),x,y);
  }
  function wrapText(text,x,y,size,maxWidth,maxLines=4,{bold=false,color=colors.text}={}){
   ctx.font=font(size,bold);ctx.fillStyle=color;
   const lines=wrapCanvas(ctx,String(text||''),maxWidth);
   let out=y;
   for(const line of lines.slice(0,maxLines)){
    ctx.fillText(fitted(ctx,line,maxWidth),x,out);out+=size*1.34*unit;
   }
   if(lines.length>maxLines){ctx.fillStyle='#bad0bb';ctx.fillText('…',x,out);}
   return out;
  }
  const renderHeading=(title,detail)=>{
   if(cartoon){
    // The playful briefing stripe is confined to the exported film.
    ctx.fillStyle=colors.accent;ctx.fillRect(pad-13*unit,24*unit,6*unit,93*unit);
   }
   drawText(title,pad,Math.round(65*unit),portrait?32:34,{bold:true,color:colors.accent});
   drawText(detail,pad,Math.round(108*unit),portrait?28:24,{max:content});
  };
  if(endCard){
   renderHeading(endCard.title,'FULL COACHING NOTES');
   ctx.fillStyle=colors.panel;ctx.fillRect(pad,top,content,sceneHeight);
   drawText(endCard.label,pad+30*unit,top+55*unit,portrait?38:34,{bold:true,color:colors.accent,max:content-60*unit});
   const size=portrait?32:28;
   let y=top+110*unit;for(const ln of endCard.lines){
    drawText(ln,pad+30*unit,y,size,{max:content-60*unit});y+=size*1.35*unit;
   }
  }else{
   const time=storyboardTime(clip,elapsed);
   const playingClip=clip.kind==='motion'||clip.kind==='rewind';
   const showArrows=clip.kind==='motion'&&clip.pass==='replay';
   const options={orientation:opts.orientation||'up',scaleMode:opts.scaleMode||'realistic',
    framing:opts.framing||'field',offside:opts.offside===true,
    teachingGuides:opts.teachingGuides!==false,markups:opts.markups!==false,
    labels:opts.labels!==false,decisions:opts.decisions!==false,
    runs:showArrows,passes:showArrows,cartoonMode:opts.cartoonMode===true};
   const scene=renderScene(clip.drill,{...options,time,prefix:'video-story'});
   const {width:w,height:h}=movieRaster(scene.g,content,sceneHeight);
   const image=await imageFromSVG(rasterSVG(scene.svg,w,h));
   const videoTitle=clip.kind==='intro'&&clip.index===0&&story.drills.length>1&&String(opts.movieTitle||'').trim()
    ?String(opts.movieTitle).trim().slice(0,160):clip.title;
   renderHeading(videoTitle,playingClip?clip.heading:clip.stage);
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.drawImage(image,Math.round(pad+(content-w)/2),Math.round(top+(sceneHeight-h)/2),w,h);
   if(!playingClip){
    // Freeze the scene and put a readable explanation OVER it. This is not
    // an inserted invented action or an editing-only annotation.
    const x=pad+20*unit,y=top+25*unit,bw=content-40*unit,bh=sceneHeight-50*unit;
    ctx.fillStyle=cartoon?'rgba(17,41,76,.95)':'rgba(9,25,19,.89)';ctx.fillRect(x,y,bw,bh);
    ctx.strokeStyle=colors.border;ctx.lineWidth=Math.max(1,(cartoon?5:2.1)*unit);ctx.strokeRect(x,y,bw,bh);
    if(cartoon){ // Corner rivets make the video card read like a comic coaching board.
     ctx.fillStyle='#ffffff';
     for(const [cx,cy] of [[x+12*unit,y+12*unit],[x+bw-12*unit,y+12*unit],[x+12*unit,y+bh-12*unit],[x+bw-12*unit,y+bh-12*unit]]){
      ctx.beginPath();ctx.arc(cx,cy,3.2*unit,0,Math.PI*2);ctx.fill();
     }
    }
    const tx=x+30*unit,max=bw-60*unit;
    let next=y+Math.round((portrait?58:58)*unit);
    drawText(clip.heading,tx,next,portrait?36:36,{bold:true,color:colors.accent,max});
    next+=Math.round((portrait?67:66)*unit);
    next=wrapText(clip.body,tx,next,portrait?33:29,max,portrait?6:3,{bold:true});
    if(clip.why){
     next+=22*unit;drawText('WHY IT MATTERS',tx,next,portrait?24:21,{bold:true,color:colors.muted,max});
     next+=32*unit;next=wrapText(clip.why,tx,next,portrait?29:25,max,portrait?5:3);
    }
    if(clip.watch){
     next+=18*unit;drawText('WATCH FOR',tx,next,portrait?24:21,{bold:true,color:'#a5d4e4',max});
     next+=32*unit;wrapText(clip.watch,tx,next,portrait?29:25,max,portrait?5:3);
    }
   }else{
    const label=clip.pass==='replay'?'COACHING REPLAY · '+clip.speed+'×':clip.heading;
    drawText(label,pad,top+sceneHeight+Math.round(46*unit),portrait?31:27,{bold:true,color:colors.accent,max:content});
    if(settings.notes&&clip.kind==='motion'){
     const note=scene.frame.notes||'Watch how the players move and react.';
     wrapText(note,pad,top+sceneHeight+Math.round(90*unit),portrait?29:24,content,portrait?4:2);
    }
   }
  }
  // Global playback progress, including option pauses and linked stages.
  const barY=H-Math.round((portrait?115:30)*unit),barH=Math.max(3,Math.round(7*unit));
  ctx.fillStyle=colors.bar;ctx.fillRect(pad,barY,content,barH);
  ctx.fillStyle=colors.accent;ctx.fillRect(pad,barY,content*Math.max(0,Math.min(1,elapsed/total)),barH);
  for(const c of story.clips.filter(x=>['intro','decision','choice'].includes(x.kind)&&x.start>0)){
   ctx.fillStyle='#f8f8e8';ctx.fillRect(pad+content*c.start/total-1,barY-2,Math.max(2,3*unit),barH+4);
  }
 });
 await draw(0);check();
 const stream=canvas.captureStream(quality.fps),types=['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
 let recorder,recorded;
 try{
  let failure;
  for(const mime of [...types.filter(t=>MediaRecorder.isTypeSupported?.(t)),'']){
   try{recorder=new MediaRecorder(stream,{...(mime?{mimeType:mime}:{}),videoBitsPerSecond:quality.bitrate});break}
   catch(e){failure=e}
  }
  if(!recorder)throw failure||Error('This browser cannot encode the selected video.');
  const chunks=[];let error=null;
  recorded=new Promise((resolve,reject)=>{
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
   recorder.onstop=()=>resolve(new Blob(chunks,{type:recorder.mimeType||chunks[0]?.type||'video/webm'}));
   recorder.onerror=e=>{error=e.error||Error('Video encoder failed.');reject(error)};
  });recorded.catch(()=>{});
  recorder.start(250);
  const started=performance.now();let elapsed=0;
  progress(0,'Recording · '+story.clips[0].heading);
  while(elapsed<total){
   check();if(error)throw error;if(recorder.state==='inactive')throw Error('Recording ended unexpectedly.');
   if(document.hidden)throw Error('Keep the browser tab visible while exporting the video.');
   const began=performance.now();elapsed=Math.min(total,(began-started)/1000);
   await draw(elapsed);check();
   const clip=storyboardClip(story,Math.min(elapsed,Math.max(0,story.total-.0001)));
   progress(elapsed/total,elapsed>=story.total?'Coaching notes':clip.heading||clip.title);
   await delay(Math.max(0,1000/quality.fps-(performance.now()-began)));
  }
  progress(1,'Finalising video…');await delay(120);check();recorder.stop();
  const blob=await recorded;check();if(!blob.size)throw Error('Video encoder returned an empty file.');
  return {blob,extension:blob.type.includes('mp4')?'mp4':'webm',width:W,height:H,seconds:total,chapters:story.clips.length};
 }catch(e){if(recorder?.state==='recording')recorder.stop();throw e}
 finally{for(const track of stream.getTracks())track.stop()}
}
