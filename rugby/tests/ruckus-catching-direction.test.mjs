import test from 'node:test';
import assert from 'node:assert/strict';
import {
 cartoonPoseIndex,playerAppearance,ruckusPassLook,
 ruckusIncomingPassBearing,ruckusOutgoingPassBearing
} from '../js/cartoon-players.js';
import {classicPlayerAppearance} from '../js/classic-player-appearance.js';

const g={toView:(x,y)=>({x,y}),rotation:0,viewWidth:900,viewHeight:540};
const base={id:'A1',type:'attacker',x:200,y:120,rot:0,headMode:'run'};
const artwork='<circle r="15" fill="#76b5fc"/>';
function passFrom(x,y,{rot=0,fieldRotation=0,route=null,transferKind=undefined}={}){
 const receiving={...base,rot},sender={id:'A2',type:'attacker',x,y,rot:0,headMode:'run'};
 const before={objects:[receiving,sender,{type:'ball',id:'b1',ownerId:'A2',x,y}],
  timing:{},paths:{},seconds:2};
 const after={objects:[receiving,sender,{type:'ball',id:'b1',ownerId:'A1',x:200,y:120,transferKind}],
  timing:{b1:{start:35,end:70}},paths:route?{b1:route}:{},seconds:2};
 return {receiving,sender,before,after,geometry:{...g,rotation:fieldRotation}};
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<.01,`${a} should be ${b}`);
function sprite(svg){
 const m=svg.match(/data-ruckus-pose="(\d+)"/);
 assert.ok(m,'Expected Ruckus atlas pose');
 return Number(m[1]);
}
function ruckus(actor,sequence,progress=.5){
 return playerAppearance(actor,'standing',artwork,sequence.after.objects,
  sequence.geometry,sequence.before,sequence.after,progress,{cartoonMode:true});
}

test('passing uses normal standing sprites, receiving uses normal carrying sprites',()=>{
 for(const x of [100,300]){
  const drill=passFrom(x,120);
  const passer=drill.sender,receiver=drill.receiving;
  assert.equal(cartoonPoseIndex(passer,'standing',drill.after.objects,drill.before,drill.after,.5),0);
  assert.equal(cartoonPoseIndex(receiver,'standing',drill.after.objects,drill.before,drill.after,.5),7);
  for(const actor of [passer,receiver]){
   const svg=ruckus(actor,drill);
   assert.ok(sprite(svg)>=0&&sprite(svg)<=4,'no special pass/catch atlas frames 43–47');
   assert.ok(svg.includes('scale(1 1)'),'no X/Y reflections during normal passes');
   assert.ok(svg.includes('rotate(180.0 64 64)'),'normal standing/carrying body pose is preserved');
   assert.doesNotMatch(svg,/data-ruckus-catch|data-ruckus-pass/);
  }
 }
});

test('left/right teammates look towards each other without rotating their bodies',()=>{
 for(const x of [100,300]){
  const drill=passFrom(x,120),out=x===100?90:-90;
  near(ruckusOutgoingPassBearing(drill.sender,drill.before,drill.after,g),out);
  near(ruckusIncomingPassBearing(drill.receiving,drill.before,drill.after,g),-out);
  near(ruckusPassLook(drill.sender,drill.before,drill.after,g,.5,0),out);
  near(ruckusPassLook(drill.receiving,drill.before,drill.after,g,.5,0),-out);
  const giver=ruckus(drill.sender,drill),taker=ruckus(drill.receiving,drill);
  assert.ok(giver.includes('data-ruckus-look="'+out.toFixed(1)+'"'));
  assert.ok(taker.includes('data-ruckus-look="'+(-out).toFixed(1)+'"'));
  assert.notEqual(sprite(giver),sprite(taker),'two normal gaze positions face the teammates');
 }
});

test('teammate gaze eases in and out; no sudden full-body turnaround',()=>{
 const drill=passFrom(100,120);
 for(const actor of [drill.sender,drill.receiving]){
  const p0=ruckusPassLook(actor,drill.before,drill.after,g,0,0);
  const pEarly=ruckusPassLook(actor,drill.before,drill.after,g,.12,0);
  const pMid=ruckusPassLook(actor,drill.before,drill.after,g,.5,0);
  const pEnd=ruckusPassLook(actor,drill.before,drill.after,g,.99,0);
  near(p0,0);near(pEnd,0);
  assert.ok(Math.abs(pEarly)<Math.abs(pMid),'face turn ramps up instead of snapping');
  assert.ok(Math.abs(pMid)<=90,'head/visor only turns up to 90 degrees');
  const svg=ruckus(actor,drill);
  assert.ok(svg.includes('scale(1 1)'),svg);
 }
});

test('running players still use running sprites during a pass',()=>{
 const drill=passFrom(100,120);
 drill.before.objects[1]={...drill.sender,x:74};
 drill.after.objects[1]={...drill.sender,x:100};
 const pose=cartoonPoseIndex(drill.sender,'standing',drill.after.objects,drill.before,drill.after,.5);
 assert.ok([1,2,4,5,19].includes(pose),'running/turning remains a movement pose');
 const svg=ruckus(drill.sender,drill);
 assert.ok(sprite(svg)>=6&&sprite(svg)<=19,'uses original walking/running atlas, not pass frames');
});

test('pickup, turnover, rip and non-pass possessions do not cause teammate gaze',()=>{
 for(const transferKind of ['pickup','turnover','rip','handover','set','presentation','drop']){
  const drill=passFrom(100,120,{transferKind});
  near(ruckusPassLook(drill.sender,drill.before,drill.after,g,.5,17),17);
  near(ruckusPassLook(drill.receiving,drill.before,drill.after,g,.5,-12),-12);
 }
 const drill=passFrom(100,120);
 drill.before.objects.at(-1).ownerId='A1';
 near(ruckusPassLook(drill.receiving,drill.before,drill.after,g,.5,7),7);
});

test('curve bearings, field rotation and Classic rendering retain original drill state',()=>{
 const curved=passFrom(100,120,{route:{mode:'corners',points:[{x:200,y:70}]}});
 near(ruckusIncomingPassBearing(curved.receiving,curved.before,curved.after,g),0);
 const rotated=passFrom(100,120,{rot:90,fieldRotation:90});
 near(ruckusIncomingPassBearing(rotated.receiving,rotated.before,rotated.after,rotated.geometry),90);
 const drill=passFrom(100,120),snapshot=JSON.stringify(drill);
 const classic=playerAppearance(drill.receiving,'standing',artwork,drill.after.objects,g,
  drill.before,drill.after,.5,{cartoonMode:false});
 const reference=classicPlayerAppearance(drill.receiving,'standing',artwork,drill.after.objects,g,
  drill.before,drill.after,.5,{ink:false});
 assert.equal(classic,reference,'Classic player artwork is unchanged');
 ruckus(drill.sender,drill);ruckus(drill.receiving,drill);
 assert.equal(JSON.stringify(drill),snapshot,'Ruckus gaze changes do not edit drill data or ball physics');
});
