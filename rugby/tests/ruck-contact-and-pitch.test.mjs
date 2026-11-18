import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {pitchGeometry} from '../js/pitch.js';
import {checkDrill} from '../js/validation.js';

const drills=JSON.parse(readFileSync(new URL('../data/drills.json',import.meta.url),'utf8')).drills;
const side=p=>['attacker','shield'].includes(p?.type)?1:['defender','bagplayer'].includes(p?.type)?-1:0;
const metres=(g,a,b)=>{
 const A=g.toView(a.x,a.y),B=g.toView(b.x,b.y);
 return Math.hypot(A.x-B.x,A.y-B.y)/g.scale;
};

test('all saved formed non-pad rucks show opposing players in visual contact',()=>{
 const errors=[];let checked=0;
 for(const d of drills){
  const g=pitchGeometry(d.length,d.width,'up');
  for(const [i,f] of d.frames.entries()){
   for(const m of f.objects.filter(o=>o.type==='ruck'&&o.members?.length&&o.breakdown?.mode!=='pad')){
    const standing=m.members.filter(x=>['bound','standing','crouched','ready'].includes(x.pose))
      .map(x=>f.objects.find(o=>o.id===x.id)).filter(Boolean);
    const attack=standing.filter(p=>side(p)===1),defence=standing.filter(p=>side(p)===-1);
    if(!attack.length||!defence.length)continue;
    const gap=Math.min(...attack.flatMap(a=>defence.map(b=>metres(g,a,b))));
    checked++;
    if(gap>.65)errors.push(d.id+' step '+i+': '+gap.toFixed(2)+' m between contesting players');
   }
  }
 }
 assert(checked>=24,'Known formed-ruck teaching steps must remain in the audit');
 assert.deepEqual(errors,[]);
});

test('editor checker flags a formed ruck whose opponents are disconnected',()=>{
 const d=structuredClone(drills.find(x=>x.id==='seed-057'));
 const frame=d.frames.find(f=>f.objects.some(o=>o.type==='ruck'&&o.breakdown?.phase==='ruck'));
 frame.objects.find(o=>o.id==='d2').y-=80;
 const report=checkDrill(d,{age:10,offside:false});
 assert(report.findings.some(f=>f.group==='breakdown'&&/Ruck members from opposing sides/.test(f.message)),
   'Valid membership is not enough: there must be visible contact');
});

test('short skill demonstrations have compact pitches, but kicking has adequate room',()=>{
 const pick=id=>drills.find(d=>d.id===id);
 for(const id of ['seed-062','seed-063','seed-064']){
  const d=pick(id);
  assert(d.length<=16&&d.width<=12,id+' should be framed at skill-demonstration scale');
  const xs=d.frames.flatMap(f=>f.objects.filter(o=>['attacker','ball'].includes(o.type)).map(o=>o.x));
  assert(Math.min(...xs)>300&&Math.max(...xs)<650,id+' should be centred on the pitch');
 }
 for(const id of ['seed-059','seed-060','seed-061'])
  assert(pick(id).length<=24,id+' should not use the generic 60 m template');
 for(const id of ['seed-065','seed-066','seed-067','seed-068','seed-069','seed-070','seed-072'])
  assert(pick(id).length>=30,id+' retains space for long-range kicking');
});
