import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const library=JSON.parse(readFileSync(new URL('../data/drills.json',import.meta.url),'utf8')).drills;
const attackVectors={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
const team=o=>['attacker','shield'].includes(o?.type)?1:['defender','bagplayer'].includes(o?.type)?-1:0;
const view=(d,p)=>({x:(p.x-42)/816*d.width,y:(p.y-37)/466*d.length});
function playerAt(old,next,id,t){
 const a=old.objects.find(o=>o.id===id),b=next.objects.find(o=>o.id===id);
 if(!a||!b)return a||b;
 const timing=next.timing?.[id]||{start:0,end:100};
 const q=Math.max(0,Math.min(1,(t*100-timing.start)/Math.max(1,timing.end-timing.start)));
 return {x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q};
}
test('directional library drill passes do not go forward at release/catch',()=>{
 const issues=[];let verified=0,nondirectional=0;
 for(const d of library){
  const direction=attackVectors[d.attackDirection||'up'];
  for(let i=1;i<d.frames.length;i++){
   const old=d.frames[i-1],next=d.frames[i];
   for(const ball of next.objects.filter(o=>o.type==='ball'&&o.transferKind==='pass')){
    const prior=old.objects.find(o=>o.id===ball.id);
    const from=prior?.ownerId&&old.objects.find(o=>o.id===prior.ownerId);
    const to=ball.ownerId&&next.objects.find(o=>o.id===ball.ownerId);
    if(!from||!to){issues.push(d.id+' step '+i+' missing passing player');continue}
    if(d.showAttack===false||!direction||!team(from)){nondirectional++;continue}
    const t=next.timing?.[ball.id]||{start:0,end:100};
    const start=view(d,playerAt(old,next,from.id,t.start/100));
    const end=view(d,playerAt(old,next,to.id,t.end/100));
    const forward=team(from)*((end.x-start.x)*direction.x+(end.y-start.y)*direction.y);
    verified++;
    if(forward>.3)issues.push(d.id+' step '+i+' '+from.id+' → '+to.id+' appears '+forward.toFixed(2)+'m forward in the authored transition');
   }
  }
 }
 assert(verified>75,'Directional pass checking must cover a meaningful share of the library');
 assert(nondirectional>0,'Circle/diamond handling exercises must be separately recognised as non-directional');
 assert.deepEqual(issues,[],'Review apparent forward-pass movements:\n'+issues.join('\n'));
});
test('stationary handling patterns do not pretend to have a fixed attacking end',()=>{
 for(const id of ['seed-009','seed-011','seed-013']){
  const d=library.find(q=>q.id===id);
  assert.equal(d.showAttack,false,id+' should not show an attack arrow');
  assert.match(d.notes,/non-directional|no single match|does not represent a fixed/i,id+' needs a plain coaching caveat');
 }
});
