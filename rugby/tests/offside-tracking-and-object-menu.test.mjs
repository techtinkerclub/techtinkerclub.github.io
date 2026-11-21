import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drillGeometry} from '../js/pitch.js';
import {diagramSettings} from '../js/diagram-shapes.js';
import {offsideBands,offsideOverlay,trackedOffsidePosition,trackedOffsideObjects,moveTrackedOffsideGuide} from '../js/offside.js';
import {labelPosition,cartoonLabelPosition,symbolFactors,symbolLabelSize,symbolRadius} from '../js/symbol-scale.js';
import {playbackData,renderScene} from '../js/scene.js';

const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pack=JSON.parse(read('data/u10-match-showcases.json'));
const match=pack.drills.find(d=>d.id==='seed-972');
const guide=(frame,side)=>frame.objects.find(o=>o.type==='offsideLine'&&o.diagram?.followSide===side);
const project=(p,v)=>p.x*v.x+p.y*v.y;

test('all three match showcases link both offside guides to each actual ruck',()=>{
 for(const drill of pack.drills){
  for(const frame of drill.frames){
   const lines=frame.objects.filter(o=>o.type==='offsideLine');
   if(!lines.length)continue;
   const contact=frame.objects.find(o=>o.type==='ruck');
   assert.ok(contact,drill.id+' shows an offside line without a ruck');
   assert.equal(lines.length,2,drill.id+' requires exactly two guide lines');
   assert.deepEqual(lines.map(o=>o.diagram.followSide).sort(),['attack','defence']);
   assert.ok(lines.every(o=>o.diagram.followContactId===contact.id));
  }
 }
 for(const i of [8,15]){
  const f=match.frames[i];
  assert.ok(!f.objects.some(o=>o.type==='ruck'),'the ball has been picked up');
  assert.ok(!f.objects.some(o=>o.type==='offsideLine'),'guides disappear after pickup');
 }
});

test('tracked ruck guides align to each hindmost visible participant and follow live positions',()=>{
 const d=playbackData(match),g={...drillGeometry(d,'up'),displayMode:'realistic'};
 for(const i of [6,7,13,14]){
  const f=d.frames[i],b=offsideBands(f.objects,d,g,'guide');
  assert.equal(b.length,1,'expected formed U10 ruck at step '+i);
  const guideObjects=trackedOffsideObjects(f.objects,d,g);
  for(const [side,key] of [['attack','blue'],['defence','orange']]){
   const raw=guide(f,side),tracked=guideObjects.find(o=>o.id===raw.id);
   assert.ok(tracked,side+' guide must remain visible while ruck is active');
   const p=g.toView(tracked.x,tracked.y);
   assert.ok(Math.abs(project(p,b[0].v)-b[0][key])<1e-7,side+' line is not aligned with the ruck');
  }
 }
 const f=d.frames[6],b=offsideBands(f.objects,d,g,'guide')[0];
 const shifted=structuredClone(f.objects),support=shifted.find(o=>o.id==='a4');
 support.y+=50;
 const after=offsideBands(shifted,d,g,'guide')[0];
 assert.notEqual(after.blue,b.blue,'attack offside line must respond to player movement');
 const old=trackedOffsidePosition(guide(f,'attack'),f.objects,d,g);
 const updated=trackedOffsidePosition(guide(f,'attack'),shifted,d,g);
 assert.notEqual(old.y,updated.y,'tracked line must follow its moving contest');
});

test('manual shift of a dynamic guide keeps link and persists as a metric offset',()=>{
 const d=playbackData(match),f=d.frames[6],g={...drillGeometry(d,'up'),displayMode:'realistic'};
 const raw=structuredClone(guide(f,'attack')),start=trackedOffsidePosition(raw,f.objects,d,g);
 const pos=g.toView(start.x,start.y),next=g.fromView(pos.x,pos.y+g.scale);
 assert.equal(moveTrackedOffsideGuide(raw,f.objects,d,g,next),true);
 assert.equal(raw.diagram.followContactId,'redContact1');
 const end=trackedOffsidePosition(raw,f.objects,d,g);
 assert.ok(Math.abs(g.toView(end.x,end.y).y-pos.y-g.scale)<1e-6);
 const manual={...raw,diagram:diagramSettings('offsideLine',{length:35})};
 assert.deepEqual(trackedOffsidePosition(manual,f.objects,d,g),manual,'ordinary lines remain manually editable');
 const falsePositive={...raw,diagram:{...raw.diagram,followContactId:'missing-contact'}};
 assert.equal(trackedOffsidePosition(falsePositive,f.objects,d,g),null);
});

test('manual guide and calculated guide toggles remain independent',()=>{
 const d=playbackData(match),g={...drillGeometry(d,'up'),displayMode:'realistic'},f=d.frames[6];
 assert.ok(offsideOverlay(f.objects,d,g,'guide',false,false).includes('data-offside-guide="true"'));
 assert.equal(offsideOverlay(f.objects,d,g,'guide',false,true),'',
  'do not draw a duplicate automatically calculated guide when tracked markings are visible');
 const picture=renderScene(d,{index:6,markups:true,offside:true});
 assert.equal((picture.svg.match(/data-line-kind="offside-guide"/g)||[]).length,2);
 const hidden=renderScene(d,{index:8,markups:true,offside:true});
 assert.doesNotMatch(hidden.svg,/data-line-kind="offside-guide"/);
});

test('Classic and cartoon player captions have equal visible gaps for both teams in camera follow',()=>{
 const d=playbackData(match),base={...drillGeometry(d,'up'),displayMode:'realistic'};
 for(const zoom of [1,.65]){
  const g={...base,annotationScale:zoom},ascent=symbolLabelSize(g)*.78*zoom;
  for(const layout of [labelPosition,cartoonLabelPosition]){
   const gaps=[];
   for(const [type,rot] of [['attacker',0],['defender',180]]){
    const obj={type,rot,x:450,y:270,label:type==='attacker'?'A1':'D1'};
    const p=layout(obj,g,'standing'),scales=symbolFactors(obj,g,'standing');
    const outer=layout===cartoonLabelPosition?Math.max(symbolRadius(obj,g,'standing'),27*Math.max(...scales)):symbolRadius(obj,g,'standing');
    gaps.push(rot===0?p.y-ascent-outer:-p.y-outer);
   }
   assert.ok(Math.abs(gaps[0]-gaps[1])<.02,
    'attacker and defender caption clearance differs at zoom '+zoom);
  }
 }
});

test('selection and commands are scoped to the clicked object in desktop, mobile and Blackboard',()=>{
 const src=read('js/app.js'),board=read('js/blackboard.js');
 assert.match(src,/if\(group\)selected=group\.dataset\.id/,'clicked line must override a previously selected player');
 assert.match(src,/visible\('menuAction',player\|\|ballObject\)/);
 assert.match(src,/visible\('menuBall',\(player\|\|ballObject\)&&hasBall/);
 assert.match(src,/visible\('menuAddPoint',drawable&&canInsertPoint\(\)\)/);
 assert.match(src,/if\(b\.hidden\|\|b\.disabled\)return/);
 assert.match(src,/if\(!fromGroup&&!canCarry\(activeObject\(\)\)/);
 assert.match(src,/openObjectMenu\(\{target:node/,'mobile actions must use the same filtered menu');
 assert.match(board,/openObjectActions\?\.\(\)/,'Blackboard must use the same filtered context action menu');
});
