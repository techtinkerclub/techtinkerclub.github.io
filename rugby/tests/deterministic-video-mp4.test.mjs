import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeDeterministicVideo} from '../js/deterministic-video.js';

// Exercise Safari's H.264 route without depending on WebCodecs or a GPU in CI.
// The muxer must produce a real MP4 container with frame-accurate timestamps.
test('offline export uses H.264 MP4 instead of the real-time fallback when VP8 is unavailable',async()=>{
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
  static async isConfigSupported(config){return {supported:config.codec.startsWith('avc1.')}}
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
