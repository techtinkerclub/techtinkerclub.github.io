import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pitchGeometry} from '../js/pitch.js';
import {transitionObjects} from '../js/possession.js';
const load=path=>JSON.parse(readFileSync(new URL('../data/'+path,import.meta.url),'utf8'));
const master=load('drills.json'),published=load('published-drills.json'),coach=load('coach-drills.json');
const short=load('showcase-drills.json'),match=load('u10-match-showcases.json'),qa=load('test-drills.json');
const by=(pack,id)=>pack.drills.find(x=>x.id===id);
const metre=(a,b,d)=>Math.hypot((a.x-b.x)*d.width/816,(a.y-b.y)*d.length/466);

test('both editor and public retain the complete resource families and stable IDs',()=>{
 assert(master.drills.length>=143&&published.drills.length===6&&coach.drills.length>=10);
 assert(short.drills.length===8&&match.drills.length===3&&qa.drills.length===20);
 for(const pack of [master,published,short,match,qa]){
  const names=new Set();
  for(const drill of pack.drills){
   assert(!names.has(drill.id),'Duplicate public/editor ID: '+drill.id);
   names.add(drill.id);
   assert(drill.title&&drill.objective&&drill.instructions&&drill.coaching);
   assert(Array.isArray(drill.frames)&&drill.frames.length>0);
   for(const [i,f] of drill.frames.entries()){
    if(i)assert(f.seconds>=.5&&f.seconds<=30,'Invalid duration '+drill.id+' '+i);
    if(i)assert(String(f.notes||'').trim(),'Missing narrative '+drill.id+' '+i);
    const seen=new Set();
    for(const o of f.objects||[]){
     assert(!seen.has(o.id),'Duplicate object '+drill.id+' '+i+' '+o.id);
     seen.add(o.id);
    }
    for(const o of f.objects||[])if(o.type==='ball'&&o.ownerId)
     assert(seen.has(o.ownerId),'Missing ball owner '+drill.id+' '+i);
   }
  }
 }
});

test('promotional and match showcase balls have short separately timed passes and readable cues',()=>{
 for(const d of [...short.drills,...match.drills]){
  const variants=d.branching?.choices?.length?d.branching.choices.map(c=>
   [...d.frames.slice(0,d.branching.fork+1),...c.frames]):[d.frames];
  for(const frames of variants){
   let t=0,last=-1;
   for(let i=0;i<frames.length;i++){
    const f=frames[i],previous=frames[i-1];
    if(previous){
     const ball=f.objects.find(o=>o.type==='ball');
     const old=previous.objects.find(o=>o.id===ball?.id);
     if(ball&&old&&ball.ownerId&&old.ownerId&&ball.ownerId!==old.ownerId
        &&!['pickup','rip','turnover','handover','set','throw','drop'].includes(ball.transferKind)){
      const timing=f.timing?.[ball.id];
      assert(timing&&timing.end>timing.start,d.id+' '+i+' pass must have a separate flight');
      const flight=f.seconds*(timing.end-timing.start)/100;
      assert(flight>=.2&&flight<=1.5,d.id+' '+i+' ball should not float for '+flight+' seconds');
     }
    }
    for(const callout of f.callouts||[]){
     const begin=t+callout.at*f.seconds;
     assert(callout.displaySeconds>=1.5&&callout.displaySeconds<=3,d.id+' cue too short or long');
     assert(begin>=last-.03,d.id+' successive coaching callouts overlap');
     last=begin+callout.displaySeconds;
    }
    t+=f.seconds;
   }
  }
 }
});

test('legacy diamond follower speed, L-shaped pass and modified handling games are meaningful',()=>{
 const diamond=by(master,'seed-013');
 for(let i=1;i<diamond.frames.length;i++){
  const f=diamond.frames[i],prev=diamond.frames[i-1];
  for(const o of f.objects.filter(o=>o.type==='attacker')){
   const p=prev.objects.find(q=>q.id===o.id);
   const range=f.timing[o.id]||{start:0,end:100};
   const actual=f.seconds*(range.end-range.start)/100;
   if(p)assert(metre(p,o,diamond)/actual<=6.5,'Diamond should not make players teleport/sprint');
  }
 }
 const L=by(master,'seed-011'),turn=L.frames.at(-1);
 assert(turn.objects.find(o=>o.id==='a3').y>turn.objects.find(o=>o.id==='a1').y,
  'L pattern's receiver must stay behind the turned carrier');
 assert.match(by(master,'seed-014').frames[2].notes,/NOT normal rugby laws/);
 assert.match(by(master,'seed-086').frames.at(-1).notes,/orange attacking downfield/);
});

test('contact demonstrates contest, clean ball exit, and pickup as separate actions',()=>{
 const src=by(coach,'u10-tackle-secure-go-again-v082');
 const pub=by(published,'seed-921');
 assert.deepEqual(pub.frames,src.frames,'published contact drill stays synchronised with saved source');
 const at=pub.frames.findIndex(x=>x.name==='Ball available · A3 picks up');
 assert(at>1);
 const old=pub.frames[at-1],next=pub.frames[at],ball=next.objects.find(o=>o.type==='ball');
 assert.equal(ball.transferKind,'pickup');
 assert(!next.objects.some(o=>o.type==='ruck'),'old ruck ends when possession is collected');
 const g=pitchGeometry(pub.length,pub.width,'up');
 const before=transitionObjects(old,next,.25,g),after=transitionObjects(old,next,.95,g);
 assert(before.some(o=>o.type==='ruck'),'prior contact remains while the ball is still on the ground');
 assert(!after.some(o=>o.type==='ruck'),'previous ruck disappears once ball has left');
 const pad=by(coach,'mwknxqa9qygu8c');
 const contest=pad.frames.findIndex(x=>x.name==='Controlled contest');
 assert(!pad.frames[contest].objects.find(o=>o.type==='ball').ownerId);
 assert.equal(pad.frames[contest+1].objects.find(o=>o.type==='ball').transferKind,'pickup');
 assert(!pad.frames[contest+1].objects.some(o=>o.type==='ruck'));
 assert(/pass away/.test(pad.frames[contest+2].name));
});
test('public and editor defensive preview have readable hold, tag direction matches pass direction',()=>{
 const base=by(master,'seed-143'),pub=by(published,'seed-143'),src=by(coach,'mwlws9j9rth2wb');
 for(const d of [base,pub,src])assert(d.frames.at(-1).seconds>=2);
 assert.deepEqual(pub.frames,src.frames);
 const tag=by(coach,'mwm9audbu64no1');
 assert.equal(tag.attackDirection,'down');
 const pass=tag.frames.find(f=>/passes backwards/.test(f.name));
 const carrier=pass.objects.find(o=>o.id==='mwm9aw076rsq4c');
 const receiver=pass.objects.find(o=>o.id==='mwm9e69z9y4p4a');
 assert(receiver.y<carrier.y,'receiver is behind the ball for downward attack');
});
