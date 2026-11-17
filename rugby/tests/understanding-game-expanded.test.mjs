import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {playbackData,renderScene} from '../js/scene.js';
import {pitchGeometry} from '../js/pitch.js';

const drills=JSON.parse(readFileSync(new URL('../data/drills.json',import.meta.url),'utf8')).drills;
const pick=id=>playbackData(drills.find(d=>d.id===id));
const obj=(f,id)=>f.objects.find(o=>o.id===id);
const distance=(d,a,b)=>{
 const g=pitchGeometry(d.length,d.width,'up'),p=g.toView(a.x,a.y),q=g.toView(b.x,b.y);
 return Math.hypot(p.x-q.x,p.y-q.y)/g.scale;
};
test('all 15 understanding-the-game U10 lessons have specific coaching explanations',()=>{
 const lessons=drills.filter(d=>d.title.startsWith('Understand the game · U10'));
 assert.equal(lessons.length,15);
 for(const d of lessons){
  assert(d.objective?.length>30,d.id+' objective');
  assert(d.instructions?.length>75,d.id+' instructions');
  assert(d.coaching?.length>60,d.id+' coaching');
  assert(d.questions?.length>40,d.id+' coaching questions');
  assert(d.safety?.length>40,d.id+' safety');
  assert(d.frames.length>=4,d.id+' animated');
  for(let i=1;i<d.frames.length;i++){
   assert(d.frames[i].seconds>=.5&&d.frames[i].seconds<=30,d.id+' timing');
   assert(d.frames[i].notes?.length>20,d.id+' narration');
  }
  const s=renderScene(playbackData(d),{index:d.frames.length-1});
  assert.match(s.svg,/^<svg/);
 }
});
test('forward versus backwards pass lesson never animates the forbidden pass',()=>{
 const d=pick('seed-134');
 assert.equal(obj(d.frames[1],'b').ownerId,'a1');
 assert.equal(obj(d.frames[3],'b').ownerId,'a2');
 assert.equal(obj(d.frames[3],'b').transferKind,'pass');
});
test('knock-forward lesson shows loose ball on ground and a scrum award only',()=>{
 const d=pick('seed-135');
 assert.equal(obj(d.frames[2],'b').ownerId,undefined);
 assert.equal(obj(d.frames[2],'b').groundState,'grounded');
 assert(!d.frames.at(-1).objects.some(o=>o.type==='scrum'),'Do not pretend a six-player scrum exists in this lesson');
 assert.match(d.frames.at(-1).name,/awarded/i);
});
test('U10 free pass includes defenders retreating seven metres from the mark',()=>{
 const d=pick('seed-137'),f=d.frames[2],mark=obj(f,'mark');
 assert(mark);
 for(const id of ['d1','d2']){
  const player=obj(f,id);
  assert(player,'Missing '+id);
  const g=pitchGeometry(d.length,d.width,'up');
  assert(Math.abs(g.toView(player.y===null?mark:player).y-g.toView(mark).y)/g.scale>=7-1e-4,id+' not back seven metres');
 }
 assert.equal(obj(d.frames[3],'b').transferKind,'pass');
});
test('U10 three-player scrum and held-up demonstration do not misrepresent a live engagement',()=>{
 const scrum=pick('seed-138'),mark=scrum.frames[1].objects.find(o=>o.type==='scrum');
 assert.equal(mark.members.length,6);
 assert.equal(obj(scrum.frames.at(-1),'b').transferKind,'pass');
 const held=pick('seed-141'),inGoal=held.frames[2],stop=held.frames.at(-1);
 assert(inGoal.objects.some(o=>o.id==='tryLine'));
 assert(inGoal.objects.some(o=>o.id==='inGoalBand'));
 assert.equal(obj(inGoal,'b').ownerId,'a1','Held up means ball still held');
 assert.equal(stop.objects.filter(o=>o.type==='scrum').length,0,'Only award is drawn; scrum is a separate lesson');
 assert(Math.abs(distance(held,obj(stop,'restartScrum5m'),{x:450,y:100})-5)<.01);
});
test('scoring demonstration distinguishes crossing and grounding inside marked in-goal',()=>{
 const d=pick('seed-140');
 for(const f of d.frames){assert(f.objects.some(o=>o.id==='tryLine'));assert(f.objects.some(o=>o.id==='inGoalBand'));}
 assert.equal(obj(d.frames[2],'b').ownerId,'a1','Crossing without grounding is not yet a try');
 assert.equal(obj(d.frames[3],'b').groundState,'grounded');
 assert(obj(d.frames[3],'b').y<100,'Ball must be beyond marked try line');
 assert.match(renderScene(d,{index:3}).svg,/TRY LINE/);
});
test('maul and no-kick diagrams keep the teaching choice age appropriate',()=>{
 const d=pick('seed-139'),maul=d.frames[2].objects.find(o=>o.type==='maul');
 assert.equal(maul.members.length,4);
 const legal=pick('seed-142');
 assert.equal(obj(legal.frames[3],'b').transferKind,'pass');
 assert.equal(obj(legal.frames[3],'b').ownerId,'a2');
});
