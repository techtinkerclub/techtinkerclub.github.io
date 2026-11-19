import test from 'node:test';
import assert from 'node:assert/strict';
import {ruckusIncomingPassBearing,ruckusCatchPoseTransform,playerAppearance,cartoonPoseIndex} from '../js/cartoon-players.js';
import {classicPlayerAppearance} from '../js/classic-player-appearance.js';

const g={toView:(x,y)=>({x,y}),rotation:0,viewWidth:900,viewHeight:540};
const player={id:'A1',type:'attacker',x:200,y:120,rot:0,headMode:'run'};
const sender={id:'coach',type:'coach',x:100,y:120,rot:0};
const artwork='<circle r="15" fill="#76b5fc"/>';
function passFrom(x,y,{rot=0,fieldRotation=0,route=null,transferKind=undefined}={}){
 const receiving={...player,rot},src={...sender,x,y};
 const before={objects:[receiving,src,{type:'ball',id:'b1',ownerId:src.id,x,y}],timing:{},paths:{},seconds:2};
 const after={objects:[receiving,src,{type:'ball',id:'b1',ownerId:receiving.id,x:200,y:120,transferKind}],
  timing:{b1:{start:35,end:70}},paths:route?{b1:route}:{},seconds:2};
 return {receiving,before,after,geometry:{...g,rotation:fieldRotation}};
}
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<.01,actual+' should be '+expected);

test('the receiving mascot looks towards a ball arriving from either side',()=>{
 const left=passFrom(100,120),right=passFrom(300,120);
 near(ruckusIncomingPassBearing(left.receiving,left.before,left.after,g),-90);
 near(ruckusIncomingPassBearing(right.receiving,right.before,right.after,g),90);
 for(const [arrangement,expectedSide,expectedAngle,expectedMirror] of [
  [left,'-90.0','180.0','-1'],[right,'90.0','180.0','1']
 ]){
  const {receiving,before,after}=arrangement;
  assert.equal(cartoonPoseIndex(receiving,'standing',after.objects,before,after,.5),10);
  const image=playerAppearance(receiving,'standing',artwork,after.objects,g,before,after,.5,{cartoonMode:true});
  assert.match(image,/data-ruckus-pose="4[67]"/);
  assert.ok(image.includes('data-ruckus-catch="'+expectedSide+'"'),image);
  assert.ok(image.includes('data-ruckus-mirror="'+expectedMirror+'"'),image);
  assert.ok(image.includes('rotate('+expectedAngle+' 64 64)'),image);
 }
});

test('diagonal, north/south and turning catches face the incoming ball, not the old body rotation',()=>{
 near(ruckusIncomingPassBearing(player,passFrom(200,20).before,passFrom(200,20).after,g),0);
 near(ruckusIncomingPassBearing(player,passFrom(200,220).before,passFrom(200,220).after,g),-180);
 near(ruckusIncomingPassBearing(player,passFrom(100,20).before,passFrom(100,20).after,g),-45);
 const rotated=passFrom(100,120,{rot:90,fieldRotation:90});
 near(ruckusIncomingPassBearing(rotated.receiving,rotated.before,rotated.after,rotated.geometry),90);
 const mirrored=playerAppearance(rotated.receiving,'standing',artwork,rotated.after.objects,rotated.geometry,
  rotated.before,rotated.after,.5,{cartoonMode:true});
 assert.ok(mirrored.includes('data-ruckus-catch="90.0"'));
 // The base 180° orientation must never be thrown away, even with field rotation.
 assert.ok(mirrored.includes('rotate(180.0 64 64)'));
});

test('catch direction follows the final tangent of a curved pass',()=>{
 const curved=passFrom(100,120,{route:{mode:'corners',points:[{x:200,y:70}]}});
 near(ruckusIncomingPassBearing(curved.receiving,curved.before,curved.after,g),0);
 const face=playerAppearance(curved.receiving,'standing',artwork,curved.after.objects,g,
  curved.before,curved.after,.5,{cartoonMode:true});
 assert.ok(face.includes('data-ruckus-catch="0.0"'));
});


test('right-side reception is pixel-transform identical to the previously working v0.20.36 pose',()=>{
 const right=passFrom(300,120),out=playerAppearance(right.receiving,'standing',artwork,right.after.objects,g,
  right.before,right.after,.5,{cartoonMode:true});
 assert.ok(out.includes('rotate(180.0 64 64) translate(0.0 0) scale(1 1)'),
  'Do not rotate or mirror the already-correct right-side catch from v0.20.36');
 const left=passFrom(100,120),flipped=playerAppearance(left.receiving,'standing',artwork,left.after.objects,g,
  left.before,left.after,.5,{cartoonMode:true});
 assert.ok(flipped.includes('rotate(180.0 64 64) translate(128.0 0) scale(-1 1)'),
  'Left-side catch should ONLY mirror the same source receive frame');
});

test('receive transform is calibrated around the original v0.20.36 right-facing artwork',()=>{
 assert.deepEqual(ruckusCatchPoseTransform(90),{mirror:1,angle:180});
 assert.deepEqual(ruckusCatchPoseTransform(-90),{mirror:-1,angle:180});
 assert.deepEqual(ruckusCatchPoseTransform(45),{mirror:1,angle:135});
 assert.deepEqual(ruckusCatchPoseTransform(-45),{mirror:-1,angle:225});
 assert.deepEqual(ruckusCatchPoseTransform(90+30,30),{mirror:1,angle:210});
});

test('pickup, rip, turnover and ordinary possession never impose a catch animation direction',()=>{
 for(const kind of ['pickup','rip','turnover','handover','presentation','drop']){
  const event=passFrom(100,120,{transferKind:kind});
  assert.equal(ruckusIncomingPassBearing(event.receiving,event.before,event.after,g),null,kind);
 }
 const regular=passFrom(100,120);
 regular.before.objects.at(-1).ownerId=player.id;
 assert.equal(ruckusIncomingPassBearing(regular.receiving,regular.before,regular.after,g),null);
});

test('catch skin never changes saved facing, ball ownership, or Classic appearance',()=>{
 const {receiving,before,after}=passFrom(100,120);
 const snapshot=JSON.stringify([receiving,before,after]);
 const untouched=classicPlayerAppearance(receiving,'standing',artwork,after.objects,g,before,after,.5,{ink:false});
 const classic=playerAppearance(receiving,'standing',artwork,after.objects,g,before,after,.5,{cartoonMode:false});
 assert.equal(classic,untouched);
 assert.doesNotMatch(classic,/data-ruckus-catch/);
 playerAppearance(receiving,'standing',artwork,after.objects,g,before,after,.5,{cartoonMode:true});
 assert.equal(JSON.stringify([receiving,before,after]),snapshot);
});
