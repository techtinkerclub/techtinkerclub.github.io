// Offline, fixed-timestamp WebM export for browsers that support WebCodecs.
// Heavy SVG rasterisation may take longer than one frame; it must not make the
// finished movie skip movement frames or run at uneven speed.
// MediaRecorder remains the fallback for unsupported browsers/long videos.
const textBytes=text=>new TextEncoder().encode(String(text));
function combine(parts){
 const size=parts.reduce((n,p)=>n+p.byteLength,0),out=new Uint8Array(size);
 let offset=0;
 for(const p of parts){out.set(p,offset);offset+=p.byteLength}
 return out;
}
const hexBytes=hex=>Uint8Array.from(hex.match(/../g).map(x=>parseInt(x,16)));
function unsigned(value,width=0){
 let n=BigInt(Math.max(0,Math.floor(Number(value)))),length=width||1;
 if(!width)while(n>=1n<<BigInt(8*length))length++;
 const out=new Uint8Array(length);
 for(let i=length-1;i>=0;i--){out[i]=Number(n&255n);n>>=8n}
 return out;
}
function vint(size){
 const n=BigInt(size);
 for(let bytes=1;bytes<=8;bytes++){
  if(n<=(1n<<BigInt(7*bytes))-2n){
   let m=n|(1n<<BigInt(7*bytes)),out=new Uint8Array(bytes);
   for(let i=bytes-1;i>=0;i--){out[i]=Number(m&255n);m>>=8n}
   return out;
  }
 }
 throw Error('The finished video is too large for WebM.');
}
function element(id,data){const b=typeof data==='string'?textBytes(data):data;return combine([hexBytes(id),vint(b.byteLength),b])}
function master(id,children){return element(id,combine(children))}
function float64(value){const b=new Uint8Array(8);new DataView(b.buffer).setFloat64(0,value,false);return b}
function muxWebM(samples,width,height,fps,seconds){
 const header=master('1a45dfa3',[
  element('4286',unsigned(1)),element('42f7',unsigned(1)),
  element('42f2',unsigned(4)),element('42f3',unsigned(8)),
  element('4282','webm'),element('4287',unsigned(4)),element('4285',unsigned(2))]);
 const info=master('1549a966',[
  element('2ad7b1',unsigned(1000000)),element('4489',float64(seconds*1000)),
  element('4d80','Rugby Coaching Studio'),element('5741','Rugby Coaching Studio')]);
 const tracks=master('1654ae6b',[master('ae',[
  element('d7',unsigned(1)),element('73c5',unsigned(1)),
  element('83',unsigned(1)),element('86','V_VP8'),
  element('23e383',unsigned(Math.round(1e9/fps))),
  master('e0',[element('b0',unsigned(width)),element('ba',unsigned(height))])
 ])]);
 const clusters=[];let batch=[],base=0;
 const flush=()=>{
  if(!batch.length)return;
  const parts=[element('e7',unsigned(base))];
  for(const frame of batch){
   const relative=Math.round(frame.timestamp/1000)-base;
   if(relative<0||relative>32767)throw Error('Invalid video frame timestamp.');
   const block=new Uint8Array(4+frame.data.length);
   block[0]=0x81;block[1]=(relative>>8)&255;block[2]=relative&255;
   block[3]=frame.key?0x80:0;block.set(frame.data,4);
   parts.push(element('a3',block));
  }
  clusters.push(master('1f43b675',parts));batch=[];
 };
 for(const frame of samples){
  const ms=Math.round(frame.timestamp/1000);
  if(batch.length&&ms-base>=10000&&frame.key){flush();base=ms}
  batch.push(frame);
 }
 flush();
 const segments=[info,tracks,...clusters];
 const length=segments.reduce((n,part)=>n+part.byteLength,0);
 return new Blob([header,hexBytes('18538067'),vint(length),...segments],{type:'video/webm'});
}

// Photos on iPhone/iPad accepts H.264 MP4 much more reliably than WebM.
// iPadOS desktop-class Safari can identify as a Mac while still being touch-only.
export function prefersPhotosCompatibleMP4(){
 if(typeof navigator==='undefined')return false;
 const ua=String(navigator.userAgent||''),platform=String(navigator.platform||'');
 return /iPhone|iPad|iPod/i.test(ua)||(platform==='MacIntel'&&navigator.maxTouchPoints>1);
}
// Prefer timestamp-accurate H.264 MP4 at every resolution. WebM is a fallback
// for desktop browsers only; never silently hand an iPhone an unsavable WebM.
export async function encodeDeterministicVideo({canvas,draw,seconds,fps=30,bitrate=6000000,signal=null,progress=()=>{}}){
 if(typeof VideoEncoder==='undefined'||typeof VideoFrame==='undefined'||!Number.isFinite(seconds)||
  seconds<=0||bitrate*seconds/8>140000000)return null;
 const {width,height}=canvas;
 // Levels are matched to maximum raster size. Reject a configuration rather
 // than silently encoding video at a lower resolution than the user selected.
 const avcLevel=Math.max(width,height)>2048?'avc1.640033':
  Math.max(width,height)>1280?'avc1.42E028':'avc1.42E01F';
 const candidates=[
  {kind:'mp4',config:{codec:avcLevel,width,height,framerate:fps,bitrate,avc:{format:'avc'}}},
  {kind:'mp4',config:{codec:Math.max(width,height)>2048?'avc1.640033':
   Math.max(width,height)>1280?'avc1.4D4028':'avc1.4D401F',
   width,height,framerate:fps,bitrate,avc:{format:'avc'}}},
  // If Safari cannot encode MP4 with WebCodecs, try its MediaRecorder MP4
  // fallback instead of immediately selecting an incompatible WebM file.
  ...(!prefersPhotosCompatibleMP4()?[{kind:'webm',
   config:{codec:'vp8',width,height,framerate:fps,bitrate}}]:[])
 ];
 let chosen=null;
 for(const candidate of candidates){
  try{
   const result=await VideoEncoder.isConfigSupported(candidate.config);
   if(result?.supported){chosen=candidate;break}
  }catch{}
 }
 if(!chosen)return null;
 const packets=[];let encoderError=null,mp4Muxer=null,encoder=null;
 if(chosen.kind==='mp4'){
  // Loaded only when Safari/another browser needs MP4, with no external CDN.
  const {Muxer,ArrayBufferTarget}=await import('./vendor/mp4-muxer.min.mjs');
  mp4Muxer=new Muxer({target:new ArrayBufferTarget(),
   video:{codec:'avc',width,height,frameRate:fps},fastStart:'in-memory'});
 }
 encoder=new VideoEncoder({
  output:(chunk,meta)=>{
   try{
    if(mp4Muxer)mp4Muxer.addVideoChunk(chunk,meta);
    else{
     const data=new Uint8Array(chunk.byteLength);
     chunk.copyTo(data);packets.push({timestamp:chunk.timestamp,key:chunk.type==='key',data});
    }
   }catch(e){encoderError=e}
  },
  error:err=>{encoderError=err||Error('Video encoding failed.')}
 });
 try{
  // A browser can report WebCodecs support while refusing this exact encoder.
  try{encoder.configure(chosen.config)}catch{return null}
  const count=Math.max(1,Math.ceil(seconds*fps));
  for(let i=0;i<count;i++){
   if(signal?.aborted)throw new DOMException('Export cancelled','AbortError');
   if(document.hidden)throw Error('Keep the browser tab visible while exporting the video.');
   if(encoderError)throw encoderError;
   const t=i/fps;
   await draw(t);
   const frame=new VideoFrame(canvas,{timestamp:Math.round(i*1e6/fps),duration:Math.round(1e6/fps)});
   try{encoder.encode(frame,{keyFrame:i%(fps*2)===0})}finally{frame.close()}
   if(encoder.encodeQueueSize>4)await encoder.flush();
   if(encoderError)throw encoderError;
   if(i%10===0||i===count-1){
    progress((i+1)/count,t);
    await new Promise(resolve=>setTimeout(resolve,0));
   }
  }
  await encoder.flush();
  if(encoderError)throw encoderError;
  if(mp4Muxer){
   mp4Muxer.finalize();
   return {blob:new Blob([mp4Muxer.target.buffer],{type:'video/mp4'}),
    extension:'mp4',width,height,seconds,encoder:'deterministic-mp4'};
  }
  return {blob:muxWebM(packets,width,height,fps,seconds),
   extension:'webm',width,height,seconds,encoder:'deterministic-webm'};
 }finally{encoder.close()}
}
