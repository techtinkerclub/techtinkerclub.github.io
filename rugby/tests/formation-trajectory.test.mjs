import assert from 'node:assert/strict';
import {transitionObjects} from '../js/possession.js';
import {formationTrajectorySVG,formationRouteOffset,unraiseFormationPoint} from '../js/formation-trajectory.js';
import {orderObjects,drawLayer,setDrawingOrder,copyDrawingOrder} from '../js/draw-order.js';
import {labelPosition} from '../js/symbol-scale.js';

const g={scale:65,margin:40,fw:900,fh:560,rotation:0,displayMode:'realistic',
 toView:(x,y)=>({x,y}),fromView:(x,y)=>({x,y})};
const players=[
 {id:'sausage',type:'sausage',x:500,y:500,rot:0},
 {id:'ruck',type:'ruck',x:500,y:500,rot:0,
  breakdown:{mode:'pad',phase:'ruck',padId:'sausage',ballId:'ball'},
  members:[{id:'a',pose:'bound'},{id:'d',pose:'bound'}]},
 {id:'a',type:'attacker',x:470,y:480,rot:0,label:'A1'},
 {id:'d',type:'defender',x:530,y:520,rot:180,label:'D1'},
 {id:'ball',type:'ball',x:500,y:490,rot:0},
 {id:'unrelated',type:'defender',x:680,y:340,rot:0}
];
const old={objects:structuredClone(players),paths:{},timing:{},seconds:2};
const next={objects:structuredClone(players),paths:{ruck:{mode:'corners',follow:false,
 points:[{x:500,y:440},{x:500,y:530},{x:500,y:440}]}},timing:{},seconds:3};
next.objects[1].breakdown.phase='contest';
const f=transitionObjects(old,next,.25,g);
const pick=id=>f.find(o=>o.id===id);
const shift=pick('ruck').y-500;
assert(Math.abs(shift)>1);
assert(Math.abs((pick('a').y-480)-shift)<1e-6);
assert(Math.abs((pick('d').y-520)-shift)<1e-6);
assert(Math.abs((pick('ball').y-490)-shift)<1e-6);
assert.equal(pick('sausage').y,500);
assert.equal(pick('unrelated').y,340);
const overlay=formationTrajectorySVG(old.objects[1],next,next.objects[1],g);
assert.match(overlay,/data-contact-route-waypoint="0"/);
assert.match(overlay,/data-contact-route-insert="true"/);
const offset=formationRouteOffset(next,next.objects[1],g);
const shifted={x:500+offset.x,y:440+offset.y};
assert.deepEqual(unraiseFormationPoint(shifted,next,next.objects[1],g),{x:500,y:440});
assert(labelPosition({...players[2],rot:0},g,'standing').y>0);
assert(labelPosition({...players[2],rot:180},g,'standing').y<0);
assert.equal(orderObjects(players)[0].id,'sausage');
setDrawingOrder([next],'sausage','front','top');
assert.equal(orderObjects(next.objects).at(-1).id,'sausage');
assert.equal(drawLayer(copyDrawingOrder(next.objects[0],{type:'sausage'})),'front');
console.log('Formation trajectories, ruck participants, floor equipment, player captions and drawing order: passed.');
