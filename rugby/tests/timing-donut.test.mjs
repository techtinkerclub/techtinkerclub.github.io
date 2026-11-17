import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalTiming,shiftedTiming} from '../js/timing-tracks.js';
import {donutTarget,donutSteps,donutLane,donutLaneOverlay} from '../js/training.js';

const g={rotation:0,margin:0,fw:1000,fh:1000,scale:50,toView:(x,y)=>({x,y}),fromView:(x,y)=>({x,y})};
const pad={id:'donut',type:'donut',x:500,y:500,rot:0,donutState:'ready',label:'Donut'};
const tackler={id:'D1',type:'defender',label:'D1',x:450,y:650,rot:0};
const frame={name:'Setup',objects:[pad,tackler],paths:{},timing:{}};
const arrival=(target,who=null,direction='auto')=>donutSteps(frame,pad.id,target,who,.65,2,g,direction);
const moved=steps=>steps[0].objects.find(o=>o.id===pad.id);

// Click either side of an upright donut. Orientation must never flip 180 degrees.
assert.equal(moved(arrival({x:500,y:350})).y,350);
assert.equal(moved(arrival({x:500,y:650})).y,650);
assert.equal(moved(arrival({x:500,y:350})).rot,0);
assert.equal(moved(arrival({x:500,y:650})).rot,0);
assert.equal(donutTarget(pad,{x:500,y:350},g,'auto').direction,'forward');
assert.equal(donutTarget(pad,{x:500,y:650},g,'auto').direction,'reverse');
assert.equal(donutLane(pad,g,'reverse').h.y,1);

// An explicit direction cannot silently roll the wrong way.
assert.throws(()=>arrival({x:500,y:650},null,'forward'),/farther along/);
assert.throws(()=>arrival({x:500,y:350},null,'reverse'),/farther along/);

// Reverse roll and interception preserve a trailing approach, then stop.
const interception=arrival({x:500,y:650},tackler.id);
assert.equal(interception.length,2);
assert.equal(moved(interception).y,597.5);
assert.equal(moved(interception).rot,0);
assert.equal(interception[1].objects.find(o=>o.id===pad.id).donutState,'down');

// At a right-angle, auto direction still follows the axis in both directions.
const sideways={...pad,rot:90};
assert.equal(donutTarget(sideways,{x:700,y:500},g,'auto').direction,'forward');
assert.equal(donutTarget(sideways,{x:300,y:500},g,'auto').direction,'reverse');

// Timing handles constrain each boundary and shift the whole window without changing length.
assert.deepEqual(normalTiming(),{start:0,end:100});
assert.deepEqual(shiftedTiming({start:0,end:100},'start',50),{start:50,end:100});
assert.deepEqual(shiftedTiming({start:0,end:100},'end',-50),{start:0,end:50});
assert.deepEqual(shiftedTiming({start:25,end:50},'move',20),{start:45,end:70});
assert.deepEqual(shiftedTiming({start:25,end:50},'move',80),{start:75,end:100});
assert.deepEqual(shiftedTiming({start:25,end:50},'move',-80),{start:0,end:25});
assert.deepEqual(shiftedTiming({start:79,end:80},'end',-30),{start:79,end:80});
// Regression for the live pitch-hover redraw: the initial button preview can be
// correct even when pointermove accidentally reverts to the forward default.
const studioSource=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
assert.match(studioSource,/donutLaneOverlay\(pad,geometry\(\),viewPoint\(e\),trainingPick\.direction\)/);
const reversePreview=donutLaneOverlay(pad,g,{x:500,y:650},'reverse');
const forwardPreview=donutLaneOverlay(pad,g,{x:500,y:350},'forward');
assert.match(reversePreview,/M500 524L500 981\.25/);
assert.match(reversePreview,/cy="650"/);
assert.match(forwardPreview,/M500 476L500 18\.75/);
assert.match(forwardPreview,/cy="350"/);
console.log('Rugby timings and donut axes: two-sided rolls, reverse interceptions, orientation and timing limits passed.');
