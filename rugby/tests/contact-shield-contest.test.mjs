import assert from 'node:assert/strict';
import {contestDrive} from '../js/contest-motion.js';
import {transitionObjects,shieldPose,frameObjects} from '../js/possession.js';

const g={margin:44,scale:70,fw:560,fh:700,rotation:0,
 toView:(x,y)=>({x:44+(x-42)/816*560,y:44+(y-37)/466*700}),
 fromView:(x,y)=>({x:42+(x-44)/560*816,y:37+(y-44)/700*466})};
const copy=x=>JSON.parse(JSON.stringify(x));
const positionError=(a,b)=>Math.hypot(g.toView(a.x,a.y).x-g.toView(b.x,b.y).x,
 g.toView(a.x,a.y).y-g.toView(b.x,b.y).y);
const base=()=>({
 objects:[
  {id:'pad',type:'sausage',x:450,y:270,rot:0},
  {id:'ruck',type:'ruck',x:450,y:270,rot:0,members:[{id:'a',pose:'bound'},{id:'d',pose:'bound'}],breakdown:{phase:'ruck',mode:'pad',padId:'pad'}},
  {id:'a',type:'attacker',label:'A1',x:450,y:305,rot:0},
  {id:'d',type:'defender',label:'D1',x:450,y:235,rot:180},
  {id:'shield',type:'shieldItem',x:450,y:250,rot:180,ownerId:'d'},
  {id:'safety-ball',type:'ball',x:650,y:110,rot:0},
  {id:'other-shield',type:'shieldItem',x:550,y:170,rot:0}
 ],timing:{},paths:{},seconds:1.5
});
function checkAttachment(old,now){
 for(let i=0;i<=40;i++){
  const t=i/40,state=transitionObjects(old,now,t,g);
  const d1=state.find(o=>o.id==='d'),shield=state.find(o=>o.id==='shield');
  assert(d1&&shield,'D1 or shield missing during playback');
  const expected=shieldPose(shield,d1,g);
  assert(positionError(shield,expected)<1e-6,'Shield must stay with D1 at '+t);
  for(const [id,idx] of [['pad',0],['safety-ball',5],['other-shield',6]]){
   assert(positionError(state.find(o=>o.id===id),old.objects[idx])<1e-6,id+' is unrelated to this contest');
  }
 }
}
for(const winner of ['attack','defence']){
 const old=base(),now=copy(old);
 now.objects[1].breakdown.phase='contest';
 const result=contestDrive(now,old,now.objects[1],g,{distanceCm:10,exchanges:3,winner});
 assert(result.ok,result.message);
 assert.equal(now.objects.find(o=>o.id==='shield').ownerId,'d');
 checkAttachment(old,now);
 // The ordinary static step must also render the attached pad at D1's position.
 const items=frameObjects(now,g),d=items.find(o=>o.id==='d'),shield=items.find(o=>o.id==='shield');
 assert(positionError(shield,shieldPose(shield,d,g))<1e-6);
}
// Zero-net back/forth: D1 ends exactly where they started, but moves in between.
// Without formation-aware attached equipment, the shield remains stationary.
const old=base(),next=copy(old);
next.objects[1].breakdown.phase='contest';
next.paths.ruck={mode:'corners',follow:false,points:[
 {x:450,y:230},{x:450,y:310},{x:450,y:240}
]};
checkAttachment(old,next);
const mid=transitionObjects(old,next,.2,g);
assert(positionError(mid.find(o=>o.id==='d'),old.objects.find(o=>o.id==='d'))>1,
 'Test fixture must actually move D1 through the contest');
console.log('Attached tackle shield follows D1 during push-pull, zero-net motion, final frames; other equipment stays still.');
