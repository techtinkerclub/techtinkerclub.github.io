import test from 'node:test';
import assert from 'node:assert/strict';
import {ruckusIncomingPassBearing,ruckusOutgoingPassBearing,ruckusActionSpriteTransform,playerAppearance,cartoonPoseIndex} from '../js/cartoon-players.js';
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

// The atlas action poses visibly face north-east (45°) before transforms.
// Verify the actual SVG reflection+rotation matrix, not only data attributes.
function renderedFacing(t){
 const rad=Math.PI/180,original=45*rad,theta=t.angle*rad;
 const x=Math.sin(original)*t.mirrorX,y=-Math.cos(original)*t.mirrorY;
 const dx=x*Math.cos(theta)-y*Math.sin(theta),dy=x*Math.sin(theta)+y*Math.cos(theta);
 return ((Math.atan2(dx,-dy)/rad+180)%360+360)%360-180;
}
function equalAngle(actual,expected){
 const error=((actual-expected+540)%360)-180;
 assert.ok(Math.abs(error)<.01,'visible character faces '+actual+'°, expected '+expected+'°');
}
test('the original sprite plus mirrors on X, Y, and both axes cover every direction',()=>{
 const checks=[
  [45,-1,-1],[135,-1,1],[-45,1,-1],[-135,1,1],
  [0,-1,-1],[90,-1,1],[180,1,1],[-90,1,-1]
 ];
 for(const [target,x,y] of checks){
  const transform=ruckusActionSpriteTransform(target);
  assert.equal(transform.mirrorX,x,'horizontal mirror at '+target);
  assert.equal(transform.mirrorY,y,'vertical mirror at '+target);
  equalAngle(renderedFacing(transform),target);
 }
 for(let target=-180;target<=180;target+=5)
  equalAngle(renderedFacing(ruckusActionSpriteTransform(target)),target);
});
test('receiver faces the incoming pass from either side without reversing backwards',()=>{
 for(const [from,side] of [[100,-90],[300,90]]){
  const {receiving,before,after}=passFrom(from,120);
  near(ruckusIncomingPassBearing(receiving,before,after,g),side);
  assert.equal(cartoonPoseIndex(receiving,'standing',after.objects,before,after,.5),10);
  const svg=playerAppearance(receiving,'standing',artwork,after.objects,g,before,after,.5,{cartoonMode:true});
  assert.match(svg,/data-ruckus-pose="4[67]"/);
  assert.ok(svg.includes('data-ruckus-catch="'+side.toFixed(1)+'"'));
  const t=ruckusActionSpriteTransform(side);
  assert.ok(svg.includes('rotate('+t.angle.toFixed(1)+' 64 64)'));
  assert.ok(svg.includes('scale('+t.mirrorX+' '+t.mirrorY+')'));
  equalAngle(renderedFacing(t),side);
 }
});
test('sender faces the receiver during ordinary editor passes without a transferKind',()=>{
 for(const from of [100,300]){
  const {receiving,before,after}=passFrom(from,120);
  const passer={...before.objects[1],type:'attacker'};
  before.objects[1]=passer;after.objects[1]=passer;
  const heading=from===100?90:-90;
  near(ruckusOutgoingPassBearing(passer,before,after,g),heading);
  assert.ok([8,9].includes(cartoonPoseIndex(passer,'standing',after.objects,before,after,.5)),
   'Standard editor transfer must select pass action instead of idle');
  const svg=playerAppearance(passer,'standing',artwork,after.objects,g,before,after,.5,{cartoonMode:true});
  assert.ok(svg.includes('data-ruckus-pass="'+heading.toFixed(1)+'"'));
  assert.match(svg,/data-ruckus-pose="4[345]"/);
  const t=ruckusActionSpriteTransform(heading);
  assert.ok(svg.includes('scale('+t.mirrorX+' '+t.mirrorY+')'));
  equalAngle(renderedFacing(t),heading);
 }
});
test('diagonal and curved passes retain local directions even when field and body are rotated',()=>{
 for(const [fromX,fromY,expected] of [[100,20,-45],[100,220,-135],[300,20,45],[300,220,135]]){
  const {receiving,before,after}=passFrom(fromX,fromY);
  near(ruckusIncomingPassBearing(receiving,before,after,g),expected);
  equalAngle(renderedFacing(ruckusActionSpriteTransform(expected)),expected);
 }
 const curved=passFrom(100,120,{route:{mode:'corners',points:[{x:200,y:70}]}});
 near(ruckusIncomingPassBearing(curved.receiving,curved.before,curved.after,g),0);
 const rotated=passFrom(100,120,{rot:90,fieldRotation:90});
 near(ruckusIncomingPassBearing(rotated.receiving,rotated.before,rotated.after,rotated.geometry),90);
 equalAngle(renderedFacing(ruckusActionSpriteTransform(90)),90);
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
