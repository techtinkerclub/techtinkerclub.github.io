import assert from 'node:assert/strict';
import {deriveDrill,readDerivation,relationLabel,rekeyImportedFamilies} from '../js/drill-variations.js';

const source={version:1,id:'base',title:'Rolling donut tackle',ageMin:10,ageMax:10,
 objective:'Original notes',frames:[
  {name:'Set up',seconds:0,notes:'Ready',objects:[{id:'pad',type:'donut',x:20,y:20,rot:30,donutState:'ready'}],timing:{},paths:{}},
  {name:'Run',seconds:2,notes:'Go',objects:[{id:'pad',type:'donut',x:50,y:70,rot:30,donutState:'rolling'}],timing:{pad:{start:20,end:90}},paths:{}},
 ],savedAt:'2026-11-17T12:09:20Z'};
const snapshot=JSON.stringify(source);
const v=deriveDrill(source,'variation','var1');
assert.equal(v.id,'var1');
assert.equal(v.title,'Rolling donut tackle · variation');
assert.equal(v.frames.length,source.frames.length);
assert.deepEqual(v.frames,source.frames);
assert.deepEqual(v.derivedFrom,{parentId:'base',rootId:'base',parentTitle:'Rolling donut tackle',kind:'variation'});
assert.equal(relationLabel(v),'Variation of Rolling donut tackle');
assert.equal(v.savedAt,undefined);
v.frames[0].objects[0].x=999;v.objective='Changed';
assert.equal(source.frames[0].objects[0].x,20);
assert.equal(source.objective,'Original notes');

const e=deriveDrill(source,'extension','ext1');
assert.equal(e.frames.length,3);
assert.equal(e.frames[2].name,'New stage');
assert.equal(e.frames[2].seconds,2);
assert.equal(e.frames[2].notes,'');
assert.deepEqual(e.frames[2].timing,{});
assert.deepEqual(e.frames[2].paths,{});
assert.equal(e.frames[2].objects[0].x,50);
assert.equal(relationLabel(e),'Extension of Rolling donut tackle');

const nested=deriveDrill(e,'variation','nested1');
assert.equal(nested.derivedFrom.parentId,'ext1');
assert.equal(nested.derivedFrom.rootId,'base');
assert.equal(nested.derivedFrom.kind,'variation');
assert.equal(nested.derivedFrom.parentTitle,'Rolling donut tackle · extension');
assert.deepEqual(readDerivation(nested.derivedFrom,nested.id),nested.derivedFrom);
assert.equal(readDerivation({parentId:'same'},'same'),null);
assert.equal(readDerivation({rootId:'base',parentId:'different',kind:'unknown'},'my-id').kind,'variation');
assert.throws(()=>deriveDrill(source,'unknown','test'),/variation or an extension/);
assert.throws(()=>deriveDrill(source,'variation','base'),/unique ID/);
const full={...source,frames:Array.from({length:150},(_,i)=>({...source.frames[1],name:'Step '+i}))};
assert.throws(()=>deriveDrill(full,'extension','too-many'),/150/);

const imported=rekeyImportedFamilies([source,e,nested],(()=>{let n=1;return ()=>'import'+n++})());
assert.deepEqual(imported.map(d=>d.id),['import1','import2','import3']);
assert.equal(imported[1].derivedFrom.parentId,'import1');
assert.equal(imported[1].derivedFrom.rootId,'import1');
assert.equal(imported[2].derivedFrom.parentId,'import2');
assert.equal(imported[2].derivedFrom.rootId,'import1');
assert.equal(imported[2].frames.length,nested.frames.length);
assert.equal(JSON.stringify(source),snapshot);
console.log('Rugby drill families: independent variations, appended stages, ancestry, import IDs and guards passed.');
