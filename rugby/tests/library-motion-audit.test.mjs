import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {pitchGeometry} from '../js/pitch.js';

const catalogue=JSON.parse(readFileSync(new URL('../data/drills.json',import.meta.url),'utf8')).drills;
const players=new Set(['attacker','defender','neutral','coach','shield','bagplayer']);
const dist=(g,a,b)=>{
 const p=g.toView(a.x,a.y),q=g.toView(b.x,b.y);
 return Math.hypot(p.x-q.x,p.y-q.y)/g.scale;
};
test('library animation quality audit: no broken carriers, overlong presentation or implausible timed runs',()=>{
 assert(catalogue.length>=142,'Full current starter library must remain available');
 const findings=[];
 for(const d of catalogue){
  const g=pitchGeometry(d.length,d.width,'up');
  for(const [i,f] of d.frames.entries()){
   const ids=new Set();
   for(const o of f.objects){
    if(ids.has(o.id))findings.push(d.id+' step '+i+' duplicate object '+o.id);
    ids.add(o.id);
    if(o.type==='ball'&&o.ownerId&&!f.objects.some(p=>p.id===o.ownerId&&players.has(p.type)))
     findings.push(d.id+' step '+i+' missing ball carrier '+o.ownerId);
   }
   if(i===0)continue;
   if(!(f.seconds>=.5&&f.seconds<=30))findings.push(d.id+' step '+i+' invalid seconds');
   if(!String(f.notes||'').trim())findings.push(d.id+' step '+i+' no narration');
   const old=d.frames[i-1];
   for(const o of f.objects.filter(p=>players.has(p.type))){
    const before=old.objects.find(p=>p.id===o.id);
    if(!before)continue;
    const speed=dist(g,before,o)/f.seconds;
    if(speed>8.5)findings.push(d.id+' step '+i+' '+o.id+' animated at '+speed.toFixed(1)+'m/s');
   }
   for(const b of f.objects.filter(o=>o.type==='ball'&&o.transferKind==='presentation')){
    const prior=old.objects.find(x=>x.id===b.id),carrier=prior?.ownerId&&f.objects.find(x=>x.id===prior.ownerId);
    if(!carrier||b.ownerId)continue;
    const separation=dist(g,b,carrier);
    // This is a pedagogical diagram heuristic, not a legal maximum reach.
    if(separation>1.35)findings.push(d.id+' step '+i+' ball presented '+separation.toFixed(2)+'m away');
   }
  }
 }
 assert.deepEqual(findings,[],'Motion review findings:\n'+findings.join('\n'));
});
test('intentional grounded final frames are genuine freeze-frames, not recovery animation bugs',()=>{
 const exceptions=new Set(['seed-078','seed-081']);
 const remaining=[];
 for(const d of catalogue){
  const fr=d.frames.at(-1);
  for(const o of fr.objects.filter(o=>players.has(o.type))){
   const member=fr.objects.find(m=>m.members?.some(p=>p.id===o.id));
   const pose=member?.members.find(p=>p.id===o.id)?.pose||o.playerPose||'standing';
   if(['grounded','tackling','recovering'].includes(pose))remaining.push({id:d.id,pose,formation:!!member});
  }
 }
 assert(remaining.every(r=>exceptions.has(r.id)&&r.formation&&r.pose==='grounded'),
 'All other drill endings should be upright or still explicitly part of a breakdown: '+JSON.stringify(remaining));
});
