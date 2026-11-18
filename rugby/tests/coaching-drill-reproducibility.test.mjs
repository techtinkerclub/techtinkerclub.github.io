// Guardrail: curated personal demonstrations must use ordinary Studio objects,
// timing, paths, whistle cues and playable A/B outcome data. No magic object types
// or hidden renderer-only properties are allowed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const data=JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../data/coach-drills.json'),'utf8'));
const ids=['mwlws9j9rth2wb','mwlwflvgp8foni'];
const types=new Set(['attacker','defender','neutral','coach','shield','bagplayer','ball','shieldItem','cone','flag','bag','sausage','donut','decision','ladder','tackle','ruck','maul','scrum','offsideLine','fieldLine','directionArrow','measureLine','zoneCircle','zoneRect','spotMarker','label']);
const fields=new Set(['id','type','label','x','y','rot','ownerId','decision','transferKind','members','breakdown','textStyle','playerPose','groundState','posePinned','diagram','carrySide','training','drawOrder','order','layout','groupId','size','scale']);
const framesOf=d=>[...d.frames,...(d.branching?.choices||[]).flatMap(c=>c.frames||[])];
test('defensive teaching drills contain only supported editor elements',()=>{
 for(const id of ids){
  const drill=data.drills.find(x=>x.id===id);assert.ok(drill,'Missing example '+id);
  for(const [i,f] of framesOf(drill).entries()){
   assert.ok(Number.isFinite(f.seconds),id+' step '+i+' missing duration');
   assert.ok(typeof f.notes==='string',id+' step '+i+' missing editable notes');
   const seen=new Set();
   for(const o of f.objects){
    assert.ok(types.has(o.type),id+' magic object type '+o.type);
    for(const key of Object.keys(o))assert.ok(fields.has(key),id+' unsupported object field '+key);
    assert.ok(!seen.has(o.id),'Duplicate object ID in frame');
    seen.add(o.id);
   }
   for(const objId of Object.keys(f.paths||{}))assert.ok(seen.has(objId),id+' path without object');
   for(const objId of Object.keys(f.timing||{}))assert.ok(seen.has(objId),id+' timing without object');
  }
 }
});
test('both outcomes use standard editable frame lists',()=>{
 const drill=data.drills.find(x=>x.id==='mwlwflvgp8foni');
 assert.equal(drill.branching.version,1);
 assert.deepEqual(drill.branching.choices.map(c=>c.id),['a','b']);
 for(const choice of drill.branching.choices)assert.ok(choice.frames.length>0);
 assert.deepEqual(drill.frames.slice(drill.branching.fork+1),drill.branching.choices.find(c=>c.id===drill.branching.active).frames);
});
