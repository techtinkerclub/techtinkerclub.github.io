import test from 'node:test';
import assert from 'node:assert/strict';
import {ruckusIncomingPassBearing,ruckusOutgoingPassBearing,ruckusPassLook,playerAppearance,cartoonPoseIndex} from '../js/cartoon-players.js';
import {classicPlayerAppearance} from '../js/classic-player-appearance.js';

const g={toView:(x,y)=>({x,y}),rotation:0,viewWidth:900,viewHeight:540};
const receiver={id:'A1',type:'attacker',x:200,y:120,rot:0,headMode:'run'};
const original='<circle r="15" fill="#76b5fc"/>';
function passFrom(x,y,{transferKind=undefined,receiverMoving=false}={}){
 const sender={id:'A2',type:'attacker',x,y,rot:0,headMode:'run'};
 const r={...receiver};
 const before={objects:[r,sender,{type:'ball',id:'b1',ownerId:sender.id,x,y}],seconds:2,timing:{},paths:{}};
 const after={objects:[r,sender,{type:'ball',id:'b1',ownerId:r.id,x:200,y:120,transferKind}],
  seconds:2,timing:{b1:{start:35,end:70}},paths:{}};
 if(receiverMoving){before.objects[0]={...r,x:190};after.timing.A1={start:0,end:100}}
 return {r:after.objects[0],sender,before,after};
}
function svg(o,previous,frame,p){return playerAppearance(o,'standing',original,frame.objects,g,previous,frame,p,{cartoonMode:true})}
function poseOf(markup){return Number(markup.match(/data-ruckus-pose="(\d+)"/)?.[1])}
function bodyAngle(markup){return Number(markup.match(/rotate\((-?\d+(?:\.\d+)?) 64 64\)/)?.[1])}
function approx(a,b){assert.ok(Math.abs(a-b)<.01,a+' !== '+b)}

test('passing and receiving retain normal standing/carrying poses on BOTH sides throughout transfer',()=>{
 for(const fromX of [100,300]){
  const {r,sender,before,after}=passFrom(fromX,120);
  for(const p of [0,.1,.25,.4,.55,.7,.85,1]){
   const passing=svg(sender,before,after,p),catching=svg(r,before,after,p);
   const pPose=cartoonPoseIndex(sender,'standing',after.objects,before,after,p);
   const cPose=cartoonPoseIndex(r,'standing',after.objects,before,after,p);
   assert.ok(![8,9,10].includes(pPose),'passer must not acquire a forced ball-facing body pose');
   assert.ok(![8,9,10].includes(cPose),'receiver must not acquire a forced ball-facing body pose');
   assert.ok(poseOf(passing)>=0&&poseOf(passing)<=4,'passer continues standard standing cycle');
   assert.ok(poseOf(catching)>=0&&poseOf(catching)<=4,'receiver continues standard carrying/standing cycle');
   assert.match(passing,/data-ruckus-mirror="1,1"/);
   assert.match(catching,/data-ruckus-mirror="1,1"/);
   approx(bodyAngle(passing),180);
   approx(bodyAngle(catching),180);
   assert.doesNotMatch(passing,/data-ruckus-pose="4[34567]"/);
   assert.doesNotMatch(catching,/data-ruckus-pose="4[34567]"/);
  }
 }
});

test('passing side glance is gently eased, never spins the body or turns head backwards',()=>{
 for(const x of [100,300]){
  const {r,sender,before,after}=passFrom(x,120);
  const actual=ruckusIncomingPassBearing(r,before,after,g);
  const outgoing=ruckusOutgoingPassBearing(sender,before,after,g);
  approx(actual,x===100?-90:90);
  approx(outgoing,x===100?90:-90);
  for(const actor of [r,sender]){
   const values=[0,.05,.1,.15,.2,.3,.4,.55,.7,.8,.9,1]
    .map(p=>ruckusPassLook(actor,before,after,g,p,0,0));
   approx(values[0],0);approx(values.at(-1),0);
   assert(values.some(v=>Math.abs(v)>0),'side glance should be visible briefly');
   assert(values.every(v=>Number.isFinite(v)&&Math.abs(v)<=90),
    'head motion is bounded by existing five-way look poses');
  }
 }
});

test('running and carrying pose selection continues independent of transfer side',()=>{
 for(const x of [100,300]){
  const {r,before,after}=passFrom(x,120,{receiverMoving:true});
  for(const p of [.2,.5,.8]){
   const semantic=cartoonPoseIndex(r,'standing',after.objects,before,after,p);
   assert.ok([1,2,7,19].includes(semantic),'receiver keeps natural move/carry semantics');
   const markup=svg(r,before,after,p);
   assert.match(markup,/data-ruckus-mirror="1,1"/);
   assert.doesNotMatch(markup,/data-ruckus-pose="4[34567]"/);
  }
 }
});

test('pickups and non-pass ownership changes do not trigger fake pass glances',()=>{
 for(const transferKind of ['pickup','rip','turnover','handover','presentation','drop']){
  const {r,sender,before,after}=passFrom(100,120,{transferKind});
  assert.equal(ruckusIncomingPassBearing(r,before,after,g),null,transferKind);
  approx(ruckusPassLook(r,before,after,g,.5,0,0),0);
  approx(ruckusPassLook(sender,before,after,g,.5,0,0),0);
 }
});

test('Ruckus visual selection is pure; Classic mode and the authored pass are unchanged',()=>{
 const {r,sender,before,after}=passFrom(100,120);
 const beforeData=JSON.stringify([r,sender,before,after]);
 const classic=playerAppearance(r,'standing',original,after.objects,g,before,after,.5,{cartoonMode:false});
 const expected=classicPlayerAppearance(r,'standing',original,after.objects,g,before,after,.5,{ink:false});
 assert.equal(classic,expected);
 for(const p of [0,.1,.3,.5,.7,1]){svg(r,before,after,p);svg(sender,before,after,p)}
 assert.equal(JSON.stringify([r,sender,before,after]),beforeData);
});
