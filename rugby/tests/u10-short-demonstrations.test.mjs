import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const drills=JSON.parse(readFileSync(new URL('../data/drills.json',import.meta.url),'utf8')).drills;
const pick=id=>drills.find(d=>d.id===id);
const obj=(f,id)=>f.objects.find(o=>o.id===id);
const metres=(d,p,q)=>Math.hypot((p.x-q.x)*d.width/816,(p.y-q.y)*d.length/466);

test('U10 short offload example shows moving players, not an independent ball drifting',()=>{
 const d=pick('seed-062');
 assert(d.frames.length>=4,'Support must carry on after receiving');
 const [setup,run,pass,follow]=d.frames;
 assert(metres(d,obj(setup,'a1'),obj(run,'a1'))>.5,'Carrier should actually move');
 assert(metres(d,obj(setup,'a2'),obj(run,'a2'))>.2,'Supporting player should follow');
 assert.equal(obj(run,'b').ownerId,'a1','Ball stays with the running carrier');
 assert.equal(obj(pass,'b').transferKind,'pass');
 assert.equal(obj(pass,'b').ownerId,'a2');
 assert(obj(pass,'a2').y>obj(pass,'a1').y,'The receiver is behind the carrier');
 assert(metres(d,obj(pass,'a2'),obj(follow,'a2'))>1.5,'Receiver continues after the catch');
 assert.equal(obj(follow,'b').ownerId,'a2');
});

test('U10 restart after touch shows a measured 5 m mark and 7 m defender retreat',()=>{
 const d=pick('seed-063');
 const [setup,retreat,pass,play]=d.frames;
 assert(d.frames.length>=4);
 const mark=obj(retreat,'a1');
 assert(Math.abs((mark.x-42)*d.width/816-5)<.01,'Free pass must be five metres in from touch');
 for(const id of ['d1','d2']){
  const before=obj(setup,id),after=obj(retreat,id);
  assert(after,'Missing defender '+id);
  const signed=(mark.y-after.y)*d.length/466;
  assert(signed>=7,id+' has not retired seven metres');
  assert(metres(d,before,after)>=3,id+' must visibly retreat');
  assert.deepEqual([obj(pass,id).x,obj(pass,id).y],[after.x,after.y],id+' cannot run before the pass');
 }
 assert.equal(obj(pass,'b').transferKind,'pass');
 assert.equal(obj(pass,'b').ownerId,'a2');
 for(const id of ['a1','a2'])assert.deepEqual([obj(pass,id).x,obj(pass,id).y],[obj(retreat,id).x,obj(retreat,id).y],id+' must wait for ball to leave');
 assert(obj(pass,'a2').y>obj(pass,'a1').y,'Free pass must travel backwards');
 assert(metres(d,obj(pass,'a2'),obj(play,'a2'))>2,'Open play should continue once passed');
 const guide=retreat.teachingGuides.find(g=>g.kind==='distance'&&/7 m/.test(g.label));
 assert(guide,'Show a measured defender retreat');
 assert(Math.abs((guide.a.y-guide.b.y)*d.length/466-7)<.01,'Seven-metre guide must be measured');
});
