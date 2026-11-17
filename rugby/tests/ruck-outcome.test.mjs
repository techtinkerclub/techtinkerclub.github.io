import assert from 'node:assert/strict';
import {contestDrive} from '../js/contest-motion.js';
import {transitionObjects,shieldPose} from '../js/possession.js';
import {contestResultOverlay,contestWinner} from '../js/ruck-outcome.js';
import {cleanBreakdowns} from '../js/breakdown.js';
import {readFileSync} from 'node:fs';

const copy=v=>structuredClone(v);
const g={margin:44,scale:70,fw:560,fh:700,rotation:0,
 toView:(x,y)=>({x:44+(x-42)/816*560,y:44+(y-37)/466*700}),
 fromView:(x,y)=>({x:42+(x-44)/560*816,y:37+(y-44)/700*466})};
const distance=(a,b)=>Math.hypot(g.toView(a.x,a.y).x-g.toView(b.x,b.y).x,g.toView(a.x,a.y).y-g.toView(b.x,b.y).y);
const initial=[
 {id:'pad',type:'sausage',x:450,y:270,rot:0},
 {id:'ruck',type:'ruck',x:450,y:270,rot:0,members:[{id:'A1',pose:'bound'},{id:'D1',pose:'bound'}],breakdown:{mode:'pad',phase:'ruck',padId:'pad'}},
 {id:'A1',type:'attacker',label:'A1',x:455,y:270,rot:0},
 {id:'D1',type:'defender',label:'D1',x:435,y:278,rot:180},
 {id:'D1-shield',type:'shieldItem',x:435,y:262,rot:180,ownerId:'D1'},
 {id:'safety-ball',type:'ball',x:500,y:235,rot:0},
 {id:'A2',type:'attacker',label:'A2',x:525,y:190,rot:0},
 {id:'D2',type:'defender',label:'D2',x:535,y:370,rot:180}
];
const frame=()=>({objects:copy(initial),paths:{},timing:{},seconds:1.5,notes:'',name:'Ruck formed'});
for(const winner of ['attack','defence']){
 const before=frame(),after=frame(),ruck=after.objects[1];
 ruck.breakdown.phase='contest';
 const result=contestDrive(after,before,ruck,g,{winner,distanceCm:10,exchanges:2,clearanceCm:50});
 assert(result.ok,result.message);
 assert.equal(contestWinner(ruck),winner);
 assert.equal(ruck.breakdown.clearanceCm,50);
 assert.equal(after.paths.ruck.points.length,4);
 assert.equal(ruck.members.find(m=>m.id===(winner==='attack'?'A1':'D1')).pose,'bound');
 assert.equal(ruck.members.find(m=>m.id===(winner==='attack'?'D1':'A1')).pose,'standing');
 assert.deepEqual(after.objects[0],before.objects[0],'Ground pad stays stationary');
 assert.deepEqual(after.objects[5],before.objects[5],'Safety ball stays aside');
 assert.deepEqual(after.objects.slice(6),before.objects.slice(6),'Waiting players stay ready');
 for(let i=0;i<=40;i++){
  const p=i/40,display=transitionObjects(before,after,p,g);
  const defender=display.find(o=>o.id==='D1'),shield=display.find(o=>o.id==='D1-shield');
  assert(distance(shield,shieldPose(shield,defender,g))<1e-5,
   'Tackle pad must follow D1 through contest, even on losing side');
  const svg=contestResultOverlay(after,display,g,p,false);
  if(p<.9)assert.equal(svg,'','Result badge must not appear early');
  else{
   assert.match(svg,new RegExp(winner==='attack'?'ATTACK SECURES':'DEFENCE SECURES'));
   assert.match(svg,new RegExp(winner==='attack'?'A2 NEXT':'D2 NEXT'));
  }
 }
 const end=transitionObjects(before,after,1,g);
 const won=end.find(o=>o.id===(winner==='attack'?'A1':'D1')),lost=end.find(o=>o.id===(winner==='attack'?'D1':'A1'));
 assert(distance(lost,end.find(o=>o.id==='pad'))>distance(won,end.find(o=>o.id==='pad'))+10,
  'Losing player should visibly give ground');
 const persisted=frame();
 persisted.objects[1]=copy(ruck);
 cleanBreakdowns([persisted]);
 assert.equal(persisted.objects[1].breakdown.winner,winner,'Winner must survive sanitising');
 assert.equal(persisted.objects[1].breakdown.clearanceCm,50);
}
const noProp=frame(),marker=noProp.objects[1];marker.breakdown={...marker.breakdown,phase:'contest',winner:'attack'};
noProp.objects=noProp.objects.filter(o=>o.id!=='safety-ball');
assert(!contestResultOverlay(noProp,noProp.objects,g,1).includes('NEXT'),
 'Do not invent a next-play ball where no prop exists');
const studio=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
assert.match(studio,/contestResultOverlay\(/);
console.log('Contest winner, losing side clearance, waiting player ball cue, shield attachment and saved result: passed.');
