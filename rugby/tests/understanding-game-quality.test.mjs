import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {pitchGeometry} from '../js/pitch.js';
import {playbackData,renderScene} from '../js/scene.js';
import {transitionObjects} from '../js/possession.js';

const catalog=JSON.parse(readFileSync(new URL('../data/drills.json',import.meta.url),'utf8'));
const get=id=>catalog.drills.find(d=>d.id===id);
const geometry=d=>pitchGeometry(d.length,d.width,'up');
const metres=(g,a,b)=>{
 const p=g.toView(a.x,a.y),q=g.toView(b.x,b.y);
 return Math.hypot(p.x-q.x,p.y-q.y)/g.scale;
};
test('library remains readable and old drill identities are preserved',()=>{
 assert.equal(catalog.drills.length,133);
 for(const d of catalog.drills){
  assert(d.frames.length>=1,d.id);
  for(const [i,f] of d.frames.entries()){
   const ids=f.objects.map(o=>o.id);
   assert.equal(ids.length,new Set(ids).size,d.id+' step '+i+' has duplicate object IDs');
   assert(!i||(f.seconds>=.5&&f.seconds<=30),d.id+' step '+i+' invalid timing');
  }
 }
});
test('six U10 understanding lessons have useful written steps and deliberate pacing',()=>{
 for(const id of ['seed-081','seed-082','seed-083','seed-084','seed-085','seed-086']){
  const d=get(id);assert(d&&d.ageMin<=10&&d.ageMax>=10,id);
  assert(d.frames.length>=4,id);
  assert(d.frames.slice(1).every(f=>f.name?.length>=8&&f.notes?.length>=35),id);
  assert(d.frames.some(f=>f.objects.some(o=>o.id==='learningCue')),id+' needs a visible lesson cue');
  assert(d.instructions?.length>100&&d.coaching?.length>100&&d.questions?.length>40,id);
  const p=playbackData(d),last=renderScene(p,{index:p.frames.length-1});
  assert.match(last.svg,/<svg/);
 }
});
test('grounded ball placement remains close to player and does not simulate a pass',()=>{
 const d=playbackData(get('seed-085')),g=geometry(d),from=d.frames[1],to=d.frames[2];
 const ball=to.objects.find(o=>o.id==='b'),carrier=to.objects.find(o=>o.id==='a1');
 assert(metres(g,ball,carrier)<1.05,'Presentation must finish within reach of A1');
 assert.equal(ball.transferKind,'presentation');
 assert.equal(ball.groundState,'presented');
 for(let i=0;i<=20;i++){
  const p=i/20;
  const state=transitionObjects(from,to,p,g);
  const b=state.find(o=>o.id==='b'),c=state.find(o=>o.id==='a1');
  assert(b&&c,'Ball/carrier must be visible at '+p);
  const held=from.objects.find(o=>o.id==='b');
  assert(metres(g,b,carrier)<1.15,'Presentation must stay near the grounded player');
  if(p===1){assert.equal(b.ownerId,undefined);assert.equal(b.groundState,'presented')}
 }
 const final=d.frames.at(-1);
 assert.equal(final.objects.find(o=>o.id==='a1').playerPose,'standing','Carrier must recover');
 assert.equal(final.objects.find(o=>o.id==='b').ownerId,'a2','Support must collect');
});
test('offside explanation shows two guides which end when the ruck finishes',()=>{
 const d=playbackData(get('seed-082'));
 assert.equal(d.frames.length,10);
 for(let i=5;i<=8;i++)assert.equal(d.frames[i].objects.filter(o=>o.type==='offsideLine').length,2,'Both lines at '+i);
 const last=d.frames.at(-1);
 assert.equal(last.objects.filter(o=>o.type==='offsideLine').length,0,'Offside guides end');
 assert.equal(last.objects.filter(o=>o.type==='ruck').length,0,'Ruck has ended');
 assert.equal(last.objects.find(o=>o.id==='b').ownerId,'a3','Ball is played away');
 const scene=renderScene(d,{index:6,markups:true});
 assert.match(scene.svg,/stroke-dasharray="8 5"/,'Teaching lines visible by default');
 // "Use it" to ball-away window is under 5s at 1x speed.
 const total=d.frames.slice(7).reduce((s,f)=>s+f.seconds,0);
 assert(total<=5,'No five-second violation in U10 teaching playback');
});
test('who joins demonstration plays away without trapping carrier on ground',()=>{
 const d=playbackData(get('seed-083'));
 assert.equal(d.frames.at(-1).objects.find(o=>o.id==='a1').playerPose,'standing');
 assert.equal(d.frames.at(-1).objects.find(o=>o.id==='b').ownerId,'a2');
 assert(d.frames.slice(7).reduce((s,f)=>s+f.seconds,0)<=5);
});
test('touch free pass is placed exactly 5m inside field, defence retired 7m',()=>{
 const d=playbackData(get('seed-086')),g=geometry(d),step=d.frames[2];
 const p=step.objects.find(o=>o.id==='d1'),x=step.objects.find(o=>o.id==='restart5m');
 const touch={x:858,y:p.y},back=step.objects.find(o=>o.id==='a1');
 assert(Math.abs(metres(g,p,touch)-5)<.01,'Free pass 5m in from right touch');
 assert(Math.abs(x.x-p.x)<1e-8&&Math.abs(x.y-p.y)<1e-8,'Cone marks passer position');
 assert(metres(g,{x:p.x,y:p.y},{x:p.x,y:back.y})>=7,'Opposition retires 7m');
 assert.equal(d.frames.at(-1).objects.find(o=>o.id==='b').transferKind,'pass');
});
