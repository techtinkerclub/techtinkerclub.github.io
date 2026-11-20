import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pack=JSON.parse(readFileSync(new URL('../data/u10-match-showcases.json',import.meta.url),'utf8'));
const catalogue=readFileSync(new URL('../js/catalogue.js',import.meta.url),'utf8');
const editor=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const options=d=>d.branching?d.branching.choices.map(c=>({name:c.id,frames:[...d.frames.slice(0,d.branching.fork+1),...c.frames]})):[{name:'main',frames:d.frames}];
const obj=(frame,id)=>frame.objects.find(x=>x.id===id);
const ball=frame=>frame.objects.find(x=>x.type==='ball');

test('match showcase is shared by public and Studio catalogues',()=>{
 assert.equal(pack.kind,'rugby-match-showcases');
 assert.equal(pack.drills.length,3);
 assert.match(catalogue,/u10-match-showcases\.json/);
 assert.match(catalogue,/matchShowcases/);
 assert.match(catalogue,/U10 Match Showcases/);
 assert.match(editor,/U10 Match Showcases/);
 assert.deepEqual(pack.drills.map(d=>d.id),['seed-970','seed-971','seed-972']);
});

test('U10 pitch, numbers, coaching text and contact restrictions',()=>{
 for(const d of pack.drills){
  assert.equal(d.category,'U10 Match Showcases');
  assert.equal(d.ageMin,10);assert.equal(d.ageMax,10);
  assert.equal(d.length,60);assert.equal(d.width,35);
  assert.equal(d.pitchContext.mode,'field');
  assert.equal(d.pitchContext.age,'U10');
  assert.ok(d.safety.includes('one arriving support player'));
  assert.ok(d.questions&&d.coaching&&d.instructions&&d.notes&&d.links.length);
  for(const route of options(d)){
   assert.ok(route.frames.length>=18);
   for(const f of route.frames){
    assert.equal(f.objects.filter(x=>x.type==='attacker').length,8);
    assert.equal(f.objects.filter(x=>x.type==='defender').length,8);
    assert.equal(f.objects.filter(x=>x.type==='ball').length,1);
    assert.equal(f.objects.filter(x=>x.type==='tryLine').length,1);
    assert.equal(new Set(f.objects.map(x=>x.id)).size,f.objects.length);
    if(ball(f).ownerId)assert.ok(obj(f,ball(f).ownerId),'ball carrier exists');
    assert.ok((f.callouts||[]).length<=1,'avoid overlapping callouts');
    for(const r of f.objects.filter(x=>x.type==='ruck')){
     assert.equal(r.members.filter(x=>x.pose==='bound').length,2,'one arriving rucker per team');
     assert.ok(r.breakdown.carrierId&&r.breakdown.ballId);
    }
   }
  }
 }
});

test('every outcome has exactly one in-goal grounding and no backwards try celebration',()=>{
 for(const d of pack.drills)for(const route of options(d)){
  const grounds=route.frames.flatMap((f,i)=>(f.tryGroundings||[]).map(g=>({f,i,g})));
  assert.equal(grounds.length,1,d.id+' '+route.name+' must ground once');
  const {i,g}=grounds[0],before=route.frames[i-1],score=route.frames[i],after=route.frames[i+1];
  assert.ok(i>0&&after);
  const player=obj(score,g.actorId),prior=obj(before,g.actorId),next=obj(after,g.actorId);
  assert.ok(ball(score).ownerId===g.actorId,'scorer carries ball');
  assert.ok(prior.y>37&&player.y<37,'scorer crosses from playing area into in-goal');
  assert.deepEqual([next.x,next.y],[player.x,player.y],'no reverse animation after score');
  const line=obj(score,'goal');
  assert.ok(line&&line.diagram.scoringSide==='negative'&&line.diagram.opacity===0);
  assert.ok(Math.abs(player.x-line.x)<=line.diagram.length*10/2+3,'grounding within active line section');
 }
});

test('each changed owner receives backwards, not forwards, and the decision is a real fork',()=>{
 for(const d of pack.drills)for(const route of options(d)){
  for(let i=1;i<route.frames.length;i++){
   const a=route.frames[i-1],b=route.frames[i],old=ball(a).ownerId,newOwner=ball(b).ownerId;
   if(!old||!newOwner||old===newOwner)continue;
   const passer=obj(b,old),receiver=obj(b,newOwner);
   assert.ok(receiver.y>=passer.y-0.25,d.id+' '+route.name+' forward pass step '+i);
  }
 }
 const d=pack.drills.find(x=>x.id==='seed-971');
 assert.equal(d.branching.version,1);
 assert.equal(d.branching.choices.length,2);
 assert.equal(d.frames.length,d.branching.fork+1+d.branching.choices[0].frames.length);
 assert.notDeepEqual(d.branching.choices[0].frames,d.branching.choices[1].frames);
});

test('all U10 ruck arrivals engage at realistic close range, with ball presented nearby',()=>{
 const metres=(a,b)=>Math.hypot((a.x-b.x)*35/816,(a.y-b.y)*60/466);
 for(const d of pack.drills)for(const route of options(d)){
  let rucks=0,contests=0;
  for(let i=1;i<route.frames.length;i++){
   const f=route.frames[i],marker=f.objects.find(x=>x.type==='ruck');
   if(!marker)continue;
   const involved=marker.members.filter(m=>m.pose==='bound');
   assert.equal(involved.length,2,'U10 ruck supports are limited to one from each team');
   const [first,second]=involved.map(m=>obj(f,m.id));
   assert.notEqual(first.type,second.type,'ruck has attacker and defender');
   assert.ok(metres(first,second)<=1.35,d.id+' '+route.name+' '+f.name+' · players metres apart');
   const carrier=obj(f,marker.breakdown.carrierId),presented=ball(f);
   assert.ok(!presented.ownerId,'the ruck ball remains unowned until it is picked up');
   assert.ok(metres(carrier,presented)<=1.5,d.id+' '+route.name+' ball too far from grounded carrier');
   if(marker.breakdown.phase==='contest'){
    contests++;
    const preceding=route.frames[i-1].objects.find(x=>x.id===marker.id);
    assert.ok(preceding&&preceding.breakdown?.phase==='ruck',
      'contesting the ball requires a preceding formed ruck');
    assert.equal(marker.breakdown.winner,'attack');
   }else assert.equal(marker.breakdown.phase,'ruck');
   rucks++;
  }
  assert.ok(rucks>=2&&contests>=1,'sequence contains a formed ruck and a distinct contest');
 }
});

test('the close-range showcase collects ball before each pass away from the ruck',()=>{
 const d=pack.drills.find(x=>x.id==='seed-972');
 const collectionSteps=d.frames.filter(f=>/A1 (collects at the back|picks up secured ball)/.test(f.name));
 assert.equal(collectionSteps.length,2,'both rucks end with an explicit pickup');
 for(const frame of collectionSteps){
  assert.equal(ball(frame).ownerId,'a1');
  assert.equal(ball(frame).transferKind,'pickup');
  assert.ok(!frame.objects.some(o=>o.type==='ruck'),'no ruck marker persists after collection');
 }
});

test('showcase running never teleports at contact and ball passes take a normal flight interval',()=>{
 const metres=(a,b)=>Math.hypot((a.x-b.x)*35/816,(a.y-b.y)*60/466);
 let normalPasses=0;
 for(const d of pack.drills)for(const route of options(d)){
  for(let i=1;i<route.frames.length;i++){
   const previous=route.frames[i-1],frame=route.frames[i];
   for(const player of frame.objects.filter(o=>o.type==='attacker'||o.type==='defender')){
    const old=obj(previous,player.id);
    if(!old)continue;
    const speed=metres(player,old)/frame.seconds;
    assert.ok(speed<=6.3,d.id+' '+route.name+' '+frame.name+' has unrealistic '+player.id+' '+speed.toFixed(1)+'m/s movement');
   }
   const oldBall=ball(previous),newBall=ball(frame);
   if(!oldBall.ownerId||!newBall.ownerId||oldBall.ownerId===newBall.ownerId||
      ['pickup','handover','set','drop','turnover','throw'].includes(newBall.transferKind))continue;
   const timing=frame.timing?.ball;
   assert.ok(timing&&timing.end>timing.start,'pass is timed separately from the whole step');
   assert.ok(frame.seconds*(timing.end-timing.start)/100<=1.5,'ball flight is not in slow motion');
   normalPasses++;
  }
 }
 assert.ok(normalPasses>=4,'showcase includes multiple timed passes');
});

test('coaching callouts do not duplicate contact captions or flash for a fraction of a second',()=>{
 const redundant=new Set(['TACKLE','RELEASE','PRESENT','RELEASE · PRESENT','RUCK']);
 for(const d of pack.drills)for(const route of options(d)){
  let elapsed=0,events=[];
  for(const f of route.frames){
   const contact=f.objects.find(o=>o.type==='ruck'||o.type==='tackle');
   for(const c of f.callouts||[]){
    assert.ok(c.displaySeconds>=1.5,'callout too short: '+d.id+' '+c.text);
    assert.ok(c.displaySeconds<=3,'callout unnecessarily long');
    if(contact)assert.ok(!redundant.has(c.text.toUpperCase()),'duplicate phase and bubble');
    if(f.tryGroundings?.length)assert.ok(c.at>=.88,'try bubble must not appear before grounding');
    events.push({start:elapsed+c.at*f.seconds,end:elapsed+c.at*f.seconds+c.displaySeconds});
   }
   elapsed+=f.seconds;
  }
  for(let i=1;i<events.length;i++)assert.ok(events[i].start>=events[i-1].end-.01,'overlapping coaching cues');
 }
});
