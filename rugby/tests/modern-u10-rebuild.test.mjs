import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {playbackData,renderScene} from '../js/scene.js';
import {compactActionBubbleSVG} from '../js/comic-callouts.js';
import {cartoonPitchDecor} from '../js/cartoon-players.js';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const coach=JSON.parse(read('data/coach-drills.json')).drills.find(d=>d.id==='u10-tackle-secure-go-again-v082');
const publicCopy=JSON.parse(read('data/published-drills.json')).drills.find(d=>d.id==='seed-921');
const player=(f,label)=>f.objects.find(o=>o.label===label&&['attacker','defender'].includes(o.type));
const marker=f=>f.objects.find(o=>['ruck','tackle'].includes(o.type));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
test('U10 source and published copies use the same rebuilt ten-stage sequence',()=>{
 assert.ok(coach&&publicCopy);
 assert.equal(coach.frames.length,10);
 assert.equal(publicCopy.frames.length,10);
 assert.equal(coach.attackDirection,'down');
 assert.equal(coach.length,16);assert.equal(coach.width,12);
 assert.deepEqual(coach.frames,publicCopy.frames);
 assert.equal(publicCopy.savedFromCoachDrill,coach.id);
 assert.equal(marker(coach.frames[6]).breakdown.phase,'contest');
 assert.equal(marker(coach.frames[7]).breakdown.phase,'secured');
});
test('A2 meets the passive shield held by D2; contact stays close during contest',()=>{
 const formed=coach.frames[5],contest=coach.frames[6],pad=formed.objects.find(o=>o.type==='shieldItem');
 assert.equal(pad.ownerId,player(formed,'D2').id);
 assert.ok(dist(player(formed,'A2'),player(formed,'D2'))<=18);
 assert.ok(dist(player(contest,'A2'),player(contest,'D2'))<=24);
 const m=marker(contest);
 assert.equal(m.id,marker(formed).id);
 assert.equal(contest.paths[m.id].points.length,4,'Contest movement must remain editable');
 assert.equal(m.breakdown.winner,'attack');
 assert.equal(m.members.filter(a=>a.pose==='grounded').length,1);
 assert.deepEqual(m.members.filter(a=>a.pose==='bound').map(a=>a.id),[player(contest,'A2').id]);
});
test('Presentation is deliberate, grounded and within reach, not a thrown ball',()=>{
 for(const i of [3,9]){
  const f=coach.frames[i],b=f.objects.find(o=>o.type==='ball'),carrier=player(f,i===3?'A1':'A3');
  assert.equal(b.transferKind,'presentation');
  assert.ok(!b.ownerId);
  assert.ok(dist(carrier,b)<24);
  assert.ok(f.timing[b.id].end<=52);
 }
 const contest=coach.frames[6],b=contest.objects.find(o=>o.type==='ball');
 assert.equal(b.groundState,'presented');
 assert.equal(contest.paths[b.id],undefined,'Ball must not be dragged through the contest');
});
test('Second tackle involves A3 and D3, never magically returning D1',()=>{
 const f=coach.frames[8],m=marker(f);
 assert.equal(m.breakdown.carrierId,player(f,'A3').id);
 assert.deepEqual(m.breakdown.tacklerIds,[player(f,'D3').id]);
 assert.equal(m.members.length,2);
 assert.ok(dist(player(f,'A3'),player(f,'D3'))<23);
});
test('Rebuilt public drill survives sanitisation and both renderers',()=>{
 const playable=playbackData(publicCopy);
 assert.equal(playable.frames.length,10);
 assert.equal(marker(playable.frames[6]).breakdown.phase,'contest');
 assert.ok(playable.frames[6].paths[marker(playable.frames[6]).id]);
 const classic=renderScene(playable,{index:5,cartoonMode:false}).svg;
 const cartoon=renderScene(playable,{index:5,cartoonMode:true}).svg;
 assert.match(classic,/svg/);
 assert.match(cartoon,/ruckus-comic-pitch/);
});
test('Ruckus removes decorative grass glyphs and uses compact action captions',()=>{
 const g={margin:44,fw:800,fh:450,viewWidth:900,viewHeight:540};
 const decor=cartoonPitchDecor(g);
 assert.match(decor,/ruckus-comic-pitch/);
 assert.doesNotMatch(decor,/grass|q3 -7 6 -9|l3 -7 3 5 5 -8|flower/);
 const bubble=compactActionBubbleSVG({x:230,y:210,text:'Rip and pass',g,kind:'shout'});
 assert.match(bubble,/compact-action-bubble/);
 assert.match(bubble,/Rip and pass/);
 assert.doesNotMatch(bubble,/<polygon/);
 assert.ok(Number(/width="([0-9.]+)"/.exec(bubble)?.[1])<180);
});
