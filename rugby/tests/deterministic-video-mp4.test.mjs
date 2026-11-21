import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeDeterministicVideo,prefersPhotosCompatibleMP4} from '../js/deterministic-video.js';
import {MOVIE_QUALITIES} from '../js/movie.js';

// Exercise Safari's H.264 route without depending on WebCodecs or a GPU in CI.
// The muxer must produce a real MP4 container with frame-accurate timestamps.
test('offline export selects H.264 MP4 even when the browser also supports VP8 WebM',async()=>{
 const original={encoder:globalThis.VideoEncoder,frame:globalThis.VideoFrame,doc:globalThis.document,chunk:globalThis.EncodedVideoChunk};
 const avcConfig=Uint8Array.from([
  1,66,224,31,255,225,0,10,103,66,224,31,149,168,20,1,110,155,1,0,4,104,206,60,128
 ]);
 const nalu=Uint8Array.from([0,0,0,4,101,136,132,33]);
 const drawing=[];
 class FakeEncodedVideoChunk{
  constructor({timestamp,duration,type}){this.byteLength=nalu.length;this.timestamp=timestamp;
   this.duration=duration;this.type=type}
  copyTo(destination){destination.set(nalu)}
 }
 class FakeVideoFrame{
  constructor(surface,{timestamp,duration}){this.timestamp=timestamp;this.duration=duration}
  close(){}
 }
 class FakeVideoEncoder{
  static async isConfigSupported(config){return {supported:true}}
  constructor({output,error}){this.output=output;this.error=error;this.encodeQueueSize=0}
  configure(config){this.config=config}
  encode(frame,{keyFrame}){
   this.output(new FakeEncodedVideoChunk({timestamp:frame.timestamp,duration:frame.duration,
    type:keyFrame?'key':'delta'}),
    {decoderConfig:{codec:this.config.codec,description:avcConfig}});
  }
  async flush(){}
  close(){}
 }
 globalThis.EncodedVideoChunk=FakeEncodedVideoChunk;
 globalThis.VideoFrame=FakeVideoFrame;
 globalThis.VideoEncoder=FakeVideoEncoder;
 globalThis.document={hidden:false};
 try{
  const result=await encodeDeterministicVideo({canvas:{width:640,height:360},
   draw:async t=>drawing.push(t),seconds:.4,fps:10,bitrate:300000});
  assert.equal(result.extension,'mp4');
  assert.equal(result.encoder,'deterministic-mp4');
  assert.equal(drawing.length,4);
  assert.deepEqual(drawing.map(n=>Number(n.toFixed(3))),[0,.1,.2,.3]);
  const bytes=new Uint8Array(await result.blob.arrayBuffer());
  const types=[];
  for(let offset=0;offset+8<=bytes.length;){
   const size=new DataView(bytes.buffer,offset).getUint32(0,false);
   if(!size||offset+size>bytes.length)break;
   types.push(String.fromCharCode(...bytes.slice(offset+4,offset+8)));
   offset+=size;
  }
  assert(types.includes('ftyp'),'MP4 file branding is present');
  assert(types.includes('moov'),'MP4 sample tables are present');
  assert(types.includes('mdat'),'MP4 video sample data is present');
 }finally{
  if(original.encoder===undefined)delete globalThis.VideoEncoder;else globalThis.VideoEncoder=original.encoder;
  if(original.frame===undefined)delete globalThis.VideoFrame;else globalThis.VideoFrame=original.frame;
  if(original.doc===undefined)delete globalThis.document;else globalThis.document=original.doc;
  if(original.chunk===undefined)delete globalThis.EncodedVideoChunk;else globalThis.EncodedVideoChunk=original.chunk;
 }
});

test('4K 44-second showcase remains within the frame-accurate export memory budget',()=>{
 const preset=MOVIE_QUALITIES['2160'];
 assert.equal(preset.width,3840);
 assert.equal(preset.height,2160);
 assert.equal(preset.fps,30);
 assert(preset.bitrate*44/8<140000000,'4K showcase should avoid live recorder fallback');
});

test('iOS devices request a Photos-compatible MP4, including desktop-class iPadOS',()=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 try{
  Object.defineProperty(globalThis,'navigator',{configurable:true,
   value:{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    platform:'iPhone',maxTouchPoints:5}});
  assert.equal(prefersPhotosCompatibleMP4(),true);
  Object.defineProperty(globalThis,'navigator',{configurable:true,
   value:{userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    platform:'MacIntel',maxTouchPoints:5}});
  assert.equal(prefersPhotosCompatibleMP4(),true);
  Object.defineProperty(globalThis,'navigator',{configurable:true,
   value:{userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    platform:'Win32',maxTouchPoints:0}});
  assert.equal(prefersPhotosCompatibleMP4(),false);
 }finally{
  if(old)Object.defineProperty(globalThis,'navigator',old);
  else delete globalThis.navigator;
 }
});
