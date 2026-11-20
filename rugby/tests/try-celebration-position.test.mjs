import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const catalogue=JSON.parse(readFileSync(new URL('../data/coach-drills.json',import.meta.url),'utf8'));

test('U10 3v2 try scorer and ball do not reverse during the celebration',()=>{
 const drill=catalogue.drills.find(d=>d.id==='u10-3v2-overload-to-try-v1');
 assert.ok(drill,'coach drill exists');
 const grounding=drill.frames.at(-2),celebration=drill.frames.at(-1);
 assert.ok(grounding.tryGroundings?.some(e=>e.actorId==='o2'));
 const player=f=>f.objects.find(o=>o.id==='o2');
 const ball=f=>f.objects.find(o=>o.id==='o5');
 assert.deepEqual([player(celebration).x,player(celebration).y],[player(grounding).x,player(grounding).y]);
 assert.deepEqual([ball(celebration).x,ball(celebration).y],[ball(grounding).x,ball(grounding).y]);
 const line=celebration.objects.find(o=>o.type==='tryLine');
 assert.ok(line);
 assert.ok(player(celebration).y<line.y,'scorer stays beyond the attacking try line');
});
