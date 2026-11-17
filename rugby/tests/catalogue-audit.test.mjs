import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {playbackData,renderScene} from '../js/scene.js';
import {pitchGeometry} from '../js/pitch.js';
import {canCarry} from '../js/possession.js';
import {posesFor} from '../js/contact.js';

const catalogue=JSON.parse(readFileSync(new URL('../data/drills.json',import.meta.url),'utf8'));
const byId=(f,id)=>f?.objects.find(o=>o.id===id);
const metres=(g,a,b)=>{
 const p=g.toView(a.x,a.y),q=g.toView(b.x,b.y);
 return Math.hypot(p.x-q.x,p.y-q.y)/g.scale;
};
const errors=[];
const issue=(d,step,description)=>errors.push(d.id+' step '+step+': '+description);

test('all starter drill IDs and objects are unique; scenes render and timelines are valid',()=>{
 const ids=new Set();
 assert(catalogue.drills.length>=142,'Original catalogue and new U10 lessons must be present');
 for(const d of catalogue.drills){
  assert(!ids.has(d.id),'Duplicate drill '+d.id);ids.add(d.id);
  assert(d.frames?.length,'Missing animation '+d.id);
  const projected=playbackData(d);
  const stills=new Set([0,Math.floor(projected.frames.length/2),projected.frames.length-1]);
  for(const i of stills)assert.match(renderScene(projected,{index:i,markups:true}).svg,/^<svg/,'Unreadable still: '+d.id+' / '+i);
  for(const [i,f] of d.frames.entries()){
   assert(!i||f.seconds>=.5&&f.seconds<=30,'Invalid step timing '+d.id+' / '+i);
   const objectIds=f.objects.map(x=>x.id);
   assert.equal(new Set(objectIds).size,objectIds.length,'Duplicate object ID '+d.id+' / '+i);
   for(const object of f.objects){
    assert(Number.isFinite(object.x)&&Number.isFinite(object.y),'Invalid coordinates '+d.id+' / '+i);
    if(object.type==='ball'&&object.ownerId)assert(canCarry(byId(f,object.ownerId)),'Missing ball carrier '+d.id+' / '+i);
    for(const m of object.members||[])assert(canCarry(byId(f,m.id)),'Missing formation member '+d.id+' / '+i);
   }
  }
 }
});
test('all starter drills keep ball presentation within reach and do not teleport loose presented balls',()=>{
 for(const d of catalogue.drills){
  const g=pitchGeometry(d.length,d.width,'up');
  for(let i=1;i<d.frames.length;i++){
   const current=d.frames[i],previous=d.frames[i-1];
   for(const ball of current.objects.filter(o=>o.type==='ball')){
    const before=byId(previous,ball.id);
    if(!before)continue;
    if(ball.transferKind==='presentation'&&before.ownerId&&!ball.ownerId){
     const player=byId(current,before.ownerId);
     if(player){
      const reach=metres(g,ball,player);
      if(reach>1.25)issue(d,i,'Presented ball is '+reach.toFixed(2)+' m from '+before.ownerId+' (not within reach)');
     }
    }
    if(before.groundState==='presented'&&ball.groundState==='presented'&&!before.ownerId&&!ball.ownerId){
     const jump=metres(g,before,ball);
     if(jump>0.75)issue(d,i,'Already-presented ball jumps '+jump.toFixed(2)+' m without collection');
    }
   }
  }
 }
 assert.deepEqual(errors,[],'Ball placement failures');
});
test('all authored player movements are paced and recovery poses do not persist beyond their final scene',()=>{
 const pace=[],pose=[];
 for(const d of catalogue.drills){
  const g=pitchGeometry(d.length,d.width,'up');
  for(let i=1;i<d.frames.length;i++){
   const now=d.frames[i],old=d.frames[i-1];
   for(const player of now.objects.filter(canCarry)){
    const before=byId(old,player.id);
    if(!before)continue;
    const speed=metres(g,player,before)/now.seconds;
    // This is a review threshold, not a player's measured sprint ability.
    if(speed>6.5)pace.push(d.id+' step '+i+' '+player.id+': '+speed.toFixed(2)+' m/s');
   }
  }
  const last=d.frames.at(-1),active=new Set(last.objects.flatMap(o=>(o.members||[]).map(m=>m.id)));
  for(const p of last.objects.filter(canCarry)){
   if(p.posePinned||active.has(p.id))continue;
   if(['tackling','grounded','recovering'].includes(p.playerPose))
    pose.push(d.id+' '+p.id+' ends with unpinned '+p.playerPose);
  }
 }
 assert.deepEqual(pace,[],'Implausible stage-average player speeds; lengthen time or explain reset');
 assert.deepEqual(pose,[],'Player remains down at end of unpinned scene');
});
test('U10 Understanding the Game covers both contact and open-play laws without static-only lessons',()=>{
 const lessons=catalogue.drills.filter(x=>x.title.startsWith('Understand the game · U10 '));
 assert(lessons.length>=15,'Missing new U10 rules lessons');
 for(const d of lessons){
  assert(d.frames.length>=4,d.id+' needs a real animation');
  assert(d.frames.slice(1).every(f=>f.notes.length>=20&&f.seconds>=.5),d.id+' needs clear pacing and narration');
  assert(d.instructions.length>=100&&d.coaching.length>=90,d.id+' lacks actionable coach instructions');
  assert(d.links?.length>=1,d.id+' is missing a regulation reference');
 }
});
