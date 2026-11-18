import assert from 'node:assert/strict';
import test from 'node:test';
import {resetStepMovement} from '../js/object-edit.js';
import {propagatePosition} from '../js/drill-edit.js';

const player=(x,y)=>({id:'a1',type:'attacker',label:'A1',x,y,rot:0});
const step=(name,x,y)=>({name,seconds:2,notes:name,objects:[player(x,y)],paths:{},timing:{}});
test('cancel a run returns the player to their previous position without deleting them',()=>{
 const frames=[step('Ready',350,400),step('Run',450,300),step('Finish',550,200)];
 frames[1].paths.a1={mode:'corners',points:[{x:405,y:365}]};
 frames[1].timing.a1={start:20,end:80};
 const result=resetStepMovement(frames,1,'a1');
 assert(result.ok);
 assert.equal(result.frames[1].objects.length,1);
 assert.deepEqual([result.frames[1].objects[0].x,result.frames[1].objects[0].y],[350,400]);
 assert.equal(result.frames[1].paths.a1,undefined);
 assert.equal(result.frames[1].timing.a1,undefined);
 assert.deepEqual([frames[2].objects[0].x,frames[2].objects[0].y],[550,200]);
 assert.deepEqual([frames[1].objects[0].x,frames[1].objects[0].y],[450,300],'Original editable snapshot must remain untouched');
});

test('ripple from earlier step moves later run destinations and route waypoints together',()=>{
 const frames=[step('Set up',365,420),step('Run',400,365),step('Pass',430,310)];
 frames[0].objects[0].x+=25; // teacher moves the player in an earlier snapshot
 frames[1].paths.a1={mode:'smooth',points:[{x:389,y:381}]};
 const result=propagatePosition(frames,0,'a1',{x:365,y:420},'onward');
 assert(result.ok);
 assert.equal(result.count,2);
 assert.equal(frames[1].objects[0].x,425);
 assert.equal(frames[1].paths.a1.points[0].x,414);
 assert.equal(frames[2].objects[0].x,455);
});

test('until-next-run stops at the first deliberately animated position',()=>{
 const frames=[step('Set up',365,420),step('Ready',365,420),step('Run',430,325)];
 frames[0].objects[0].x+=15;
 const result=propagatePosition(frames,0,'a1',{x:365,y:420},'until');
 assert(result.ok);
 assert.equal(result.count,1);
 assert.equal(result.stop,2);
 assert.equal(frames[1].objects[0].x,380);
 assert.equal(frames[2].objects[0].x,430);
});

test('contact participants are protected from casual ripple edits',()=>{
 const frames=[step('Ready',365,420),step('Contact',400,350)];
 frames[1].objects.push({id:'m',type:'tackle',x:405,y:350,members:[{id:'a1',pose:'grounded'}],breakdown:{phase:'tackle',carrierId:'a1'}});
 frames[0].objects[0].x+=15;
 const result=propagatePosition(frames,0,'a1',{x:365,y:420},'onward');
 assert.equal(result.stop,1);
 assert.match(result.reason,/contact formation/);
 assert.equal(frames[1].objects[0].x,400);
});
