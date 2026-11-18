import test from 'node:test';
import assert from 'node:assert/strict';
import {removeObjectAcrossOutcomes,chooseOutcome} from '../js/branching.js';

const frame=()=>({name:'Step',seconds:2,objects:[{id:'cone-1',type:'cone',x:10,y:10},{id:'runner',type:'attacker',x:20,y:20}],timing:{'cone-1':{start:0,end:100}},paths:{}});
const drill=()=>({
 frames:[frame(),frame(),frame()],
 branching:{version:1,fork:0,question:'Which option?',active:'a',choices:[
  {id:'a',label:'Option A',frames:[frame(),frame()]},
  {id:'b',label:'Option B',frames:[frame(),frame()]}
 ]}
});
const present=d=>d.frames.map(f=>f.objects.some(o=>o.id==='cone-1'));
for(const [scope,expectedA,expectedB] of [
 ['here',[false,true,true],[false,true,true]],
 ['onward',[false,false,false],[false,false,false]],
 ['all',[false,false,false],[false,false,false]]
]){
 test('decision deletion '+scope+' from common setup propagates correctly',()=>{
  const d=drill();removeObjectAcrossOutcomes(d,'cone-1',0,scope);
  assert.deepEqual(present(d),expectedA);
  chooseOutcome(d,'b');assert.deepEqual(present(d),expectedB);
  assert.deepEqual(d.frames.map(f=>f.objects.some(o=>o.id==='runner')),[true,true,true]);
 });
}
test('deleting only within Option A leaves Option B unchanged',()=>{
 const d=drill();removeObjectAcrossOutcomes(d,'cone-1',1,'here');
 assert.deepEqual(present(d),[true,false,true]);
 chooseOutcome(d,'b');assert.deepEqual(present(d),[true,true,true]);
});
test('whole drill deletion from Option A suffix reaches Option B suffix too',()=>{
 const d=drill();removeObjectAcrossOutcomes(d,'cone-1',1,'all');
 chooseOutcome(d,'b');assert.deepEqual(present(d),[false,false,false]);
});
