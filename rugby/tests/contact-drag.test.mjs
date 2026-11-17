import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {contactDragIds,contactHandlePoint} from '../js/contact-drag.js';
import {groupSnapshot,groupTranslate} from '../js/group.js';

const g={margin:0,fw:900,fh:540,toView:(x,y)=>({x,y}),fromView:(x,y)=>({x,y})};
const objects=[
 {id:'ruck',type:'ruck',x:450,y:250,rot:0,members:[{id:'a',pose:'bound'},{id:'d',pose:'bound'},{id:'carrier',pose:'grounded'}],breakdown:{phase:'ruck',ballId:'ball'}},
 {id:'a',type:'attacker',x:450,y:275,rot:0},
 {id:'d',type:'defender',x:450,y:225,rot:180},
 {id:'carrier',type:'attacker',x:430,y:250,rot:0},
 {id:'ball',type:'ball',x:460,y:245,rot:0},
 {id:'sausage',type:'sausage',x:450,y:250,rot:0},
 {id:'unrelated',type:'defender',x:650,y:350,rot:0}
];
const frame={objects},marker=objects[0];
const ids=contactDragIds(frame,marker);
assert.deepEqual(ids,['ruck','a','d','carrier','ball']);
assert(!ids.includes('sausage'));
assert(!ids.includes('unrelated'));
const newPosition=groupTranslate(groupSnapshot(frame,ids,g),85,-45,g);
assert.equal(newPosition.length,5);
for(const moved of newPosition){
 const original=objects.find(o=>o.id===moved.id);
 assert.equal(moved.x-original.x,85);
 assert.equal(moved.y-original.y,-45);
}
assert.equal(objects.find(o=>o.id==='sausage').x,450);
const grip=contactHandlePoint(frame,marker,g);
assert(grip.x>20&&grip.x<880&&grip.y>20&&grip.y<520);
assert(Math.hypot(grip.x-450,grip.y-250)>95);
const bare={id:'tackle',type:'tackle',x:300,y:100,rot:0,members:[]};
assert.deepEqual(contactDragIds({objects:[bare]},bare),['tackle']);
const studio=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
assert.match(studio,/contactDragGrip\(f\(\),active,g\)/);
assert.match(studio,/e\.target\.closest\('\[data-contact-grip\]'\)/);
assert.match(studio,/drag\.kind==='group'\|\|drag\.kind==='formation'/);
assert.match(studio,/contactDragIds\(f\(\),marker\)/);
console.log('Contact marker grip, participants, ball, isolated equipment and formation translation: passed.');
