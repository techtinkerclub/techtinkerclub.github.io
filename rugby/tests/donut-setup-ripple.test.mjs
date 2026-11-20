import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canPropagate,canEntire,propagatePosition} from '../js/drill-edit.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const donut=(x,y,state='ready')=>({id:'donut',type:'donut',label:'Tackle donut',x,y,rot:133,donutState:state});
const defender={id:'d1',type:'defender',x:540,y:220,rot:180};
const frame=(n,obj,extras={})=>({name:n,seconds:1,objects:[obj,structuredClone(defender)],paths:{},timing:{},...extras});
const mk=()=>[
 frame('Set up',donut(450,95)),
 frame('Chase',donut(450,95)),
 frame('Chill',donut(450,95)),
 frame('Intercept rolling donut',{...donut(650,182,'impact'),donutTacklerId:'d1'}),
 frame('Donut stopped',{...donut(650,182,'down'),donutTacklerId:'d1'})
];
const frames=mk();
assert.equal(canPropagate(frames[0],frames[0].objects[0]),true,'ready donut can be repositioned');
assert.equal(canPropagate(frames[3],frames[3].objects[0]),false,'impact donut is protected');
assert.equal(canEntire(frames[0].objects[0]),false,'entire drill cannot translate rolling donut contact');
frames[0].objects[0].x+=30;frames[0].objects[0].y+=10;
const result=propagatePosition(frames,0,'donut',{x:450,y:95},'onward');
assert.equal(result.ok,true);
assert.equal(result.count,2,'stationary Chase and Chill steps inherit new start');
assert.equal(result.stop,3,'roll/contact is preserved');
assert.equal(frames[1].objects[0].x,480);assert.equal(frames[2].objects[0].y,105);
assert.equal(frames[3].objects[0].x,650,'authored impact destination is untouched');
assert.equal(frames[3].objects[1].x,540,'tackler is untouched');
assert.equal(mk()[0].objects[0].x,450,'original snapshots unchanged');
const still=mk();
still[1].objects[0].x=470;
still[0].objects[0].x=480;
const partial=propagatePosition(still,0,'donut',{x:450,y:95},'onward');
assert.equal(partial.stop,1,'a manual donut movement stops propagation');
assert.equal(still[1].objects[0].x,470,'manual next-step position remains authored');
const code=read('js/app.js');
assert.match(code,/propagatePosition\(drill\.frames,idx,marker\.id,gesture\.originalPosition,gesture\.scope\)/);
assert.match(code,/scope='here';note\('Linked action/);
console.log('Ready donut ripple preserves movement origin through stationary frames and stops before authored roll/contact.');
