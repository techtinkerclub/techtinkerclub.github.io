import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pack=JSON.parse(readFileSync(new URL('../data/showcase-drills.json',import.meta.url),'utf8'));
const drill=id=>pack.drills.find(d=>d.id==='seed-'+id);
const obj=(frame,id)=>frame.objects.find(o=>o.id===id);

test('showcase pack contains eight editor-compatible multi-step drills',()=>{
 assert.equal(pack.kind,'rugby-showcase');
 assert.equal(pack.drills.length,8);
 const ids=new Set();
 for(const d of pack.drills){
  assert.match(d.id,/^seed-\d{3,}$/);
  assert.ok(!ids.has(d.id));ids.add(d.id);
  assert.ok(d.frames.length>=6);
  assert.ok(d.length<=26&&d.width<=18,'pitch is compact');
  assert.ok(d.objective&&d.safety&&d.coaching&&d.questions);
  for(const f of d.frames){
   const objects=new Map(f.objects.map(o=>[o.id,o]));
   assert.equal(objects.size,f.objects.length,'unique object IDs');
   assert.ok(f.name&&f.notes);
   for(const o of f.objects)if(o.type==='ball'&&o.ownerId)assert.ok(objects.has(o.ownerId),'ball owner exists');
  }
 }
});

test('transfers between carriers in the common storyline travel backwards',()=>{
 for(const d of pack.drills){
  for(let i=1;i<d.frames.length;i++){
   const last=d.frames[i-1],next=d.frames[i],a=obj(last,'ball'),b=obj(next,'ball');
   if(!a?.ownerId||!b?.ownerId||a.ownerId===b.ownerId)continue;
   const passer=obj(last,a.ownerId),receiver=obj(next,b.ownerId);
   assert.ok(receiver.y>=passer.y,'forward-looking pass in '+d.id+' step '+i);
  }
 }
});

test('touch rollout is specific to England Touch and gives 7m retreat',()=>{
 const d=drill(954);
 assert.match(d.coaching,/7 m/);
 assert.match(d.safety,/NOT RFU U10/);
 for(const i of [3,4,5]){
  assert.ok(obj(d.frames[i],'d1').y<=115);
  assert.ok(obj(d.frames[i],'d2').y<=80);
 }
 assert.equal(d.frames[2].interactions[0].kind,'touch');
});

test('U8 tag is an event followed by a separately authored return',()=>{
 const d=drill(953);
 assert.equal(d.frames[2].interactions[0].kind,'tag');
 assert.equal(d.frames[4].interactions[0].kind,'tag-return');
 assert.equal(obj(d.frames[2],'a1').tags.left,false);
 assert.equal(obj(d.frames[4],'a1').tags.left,true);
});

test('decision has shared fork and two distinct editable suffixes',()=>{
 const d=drill(956),b=d.branching;
 assert.equal(b.fork,3);
 assert.equal(b.choices.length,2);
 assert.equal(b.active,'a');
 assert.equal(d.frames.length,b.fork+1+b.choices[0].frames.length);
 assert.notDeepEqual(b.choices[0].frames,b.choices[1].frames);
 assert.ok(b.context&&b.watchFor);
});

test('ground demonstration shows release and presentation before support pickup',()=>{
 const d=drill(951);
 assert.equal(obj(d.frames[2],'a1').playerPose,'grounded');
 assert.equal(obj(d.frames[4],'ball').groundState,'presented');
 assert.equal(obj(d.frames[4],'ball').ownerId,undefined);
 assert.equal(obj(d.frames[5],'ball').ownerId,'a2');
 assert.equal(obj(d.frames[2],'d1').playerPose,'tackling');
 assert.notEqual(obj(d.frames[3],'d1').playerPose,'tackling');
});
