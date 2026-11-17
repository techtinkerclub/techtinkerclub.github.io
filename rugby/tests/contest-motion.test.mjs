import assert from 'node:assert/strict';
import {contestDrive} from '../js/contest-motion.js';
import {transitionObjects} from '../js/possession.js';
import {formationTrajectoryTransform,formationTrajectorySVG} from '../js/formation-trajectory.js';
import {contactHandlePoint} from '../js/contact-drag.js';
import {readFileSync} from 'node:fs';

const g={margin:44,scale:70,fw:560,fh:700,rotation:0,
 toView:(x,y)=>({x:44+(x-42)/816*560,y:44+(y-37)/466*700}),
 fromView:(x,y)=>({x:42+(x-44)/560*816,y:37+(y-44)/700*466})};
const initial=[
 {id:'pad',type:'sausage',x:450,y:270,rot:0},
 {id:'ruck',type:'ruck',x:450,y:270,rot:0,members:[{id:'A',pose:'bound'},{id:'D',pose:'bound'}],breakdown:{mode:'pad',phase:'ruck',padId:'pad'}},
 {id:'A',type:'attacker',label:'A1',x:430,y:290,rot:0},
 {id:'D',type:'defender',label:'D1',x:470,y:245,rot:180},
 {id:'safe-ball',type:'ball',x:700,y:100,rot:0}
];
const source=()=>({objects:structuredClone(initial),paths:{},timing:{},seconds:1.5});
for(const winner of ['attack','defence']){
 const previous=source(),current=source(),marker=current.objects[1];
 marker.breakdown.phase='contest';
 const result=contestDrive(current,previous,marker,g,{distanceCm:10,exchanges:2,winner});
 assert(result.ok,result.message);
 assert.equal(result.waypoints,4);
 assert.equal(current.paths.ruck.mode,'corners');
 assert.equal(current.paths.ruck.follow,false);
 assert(current.seconds>=3);
 const oldCenter=g.toView(previous.objects[1].x,previous.objects[1].y);
 const endCenter=g.toView(marker.x,marker.y);
 assert(Math.abs((endCenter.y-oldCenter.y)-(winner==='attack'?-7:7))<1e-7);
 assert.deepEqual(current.objects[0],previous.objects[0],'Ground bag stays still');
 assert.deepEqual(current.objects[4],previous.objects[4],'Separate ball stays still');
 const animated=transitionObjects(previous,current,.16,g);
 const motion=g.toView(animated.find(o=>o.id==='ruck').x,animated.find(o=>o.id==='ruck').y).y-oldCenter.y;
 for(const id of ['A','D']){
  const a=animated.find(o=>o.id===id),b=previous.objects.find(o=>o.id===id);
  assert(Math.abs(g.toView(a.x,a.y).y-g.toView(b.x,b.y).y-motion)<1e-6,'Players must travel with ruck');
 }
 assert.notEqual(motion,0);
 const trans=formationTrajectoryTransform(previous.objects[1],current,marker,g);
 const point=g.toView(current.paths.ruck.points[0].x,current.paths.ruck.points[0].y);
 const inverse=trans.fromProxy(trans.toProxy(point));
 assert(Math.abs(inverse.x-point.x)+Math.abs(inverse.y-point.y)<1e-7);
 assert(trans.scale>1.1,'Tiny 10 cm paths should be visibly enlarged only in editor');
 const overlay=formationTrajectorySVG(previous.objects[1],current,marker,g);
 assert.match(overlay,/data-contact-route-waypoint="0"/);
 assert.match(overlay,/data-contact-route-insert="true"/);
 assert.match(overlay,/Path enlarged/);
}
const marker=initial[1],grip=contactHandlePoint({objects:initial},marker,g);
const reordered={objects:structuredClone(initial)};
reordered.objects[4].x=550;
assert.deepEqual(contactHandlePoint(reordered,marker,g),grip,'Fixed position independent of clutter');
const invalid=source(),before=source();
invalid.objects[1].breakdown.phase='contest';
invalid.objects[1].members=[{id:'A',pose:'bound'}];
const snapshot=structuredClone(invalid);
assert.equal(contestDrive(invalid,before,invalid.objects[1],g,{distanceCm:10,exchanges:2,winner:'attack'}).ok,false);
assert.deepEqual(invalid,snapshot,'Rejected presets cannot partially edit the scene');
const studio=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
assert.match(studio,/formationTrajectoryTransform/);
assert.match(studio,/contestDrive\(f\(\),drill\.frames\[idx-1\],marker,geometry\(\)/);
console.log('Quick contest presets: exact cm, attacking or defending winner, animated linked players, static pad/ball, visible editable proxy.');
