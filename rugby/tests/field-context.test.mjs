import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {FIELD_PRESETS,fieldContext,fieldAnchor,validateFieldContext} from '../js/field-context.js';
import {pitchGeometry,drillGeometry,trainingField} from '../js/pitch.js';
import {playbackData,renderScene} from '../js/scene.js';
import {setupValues,prepareSetup} from '../js/setup.js';

const d={version:1,id:'field-test',title:'Try-line attack',age:'U10',ageMin:10,ageMax:10,
 category:'Attack',length:12,width:10,minutes:10,
 frames:[{name:'Set up',seconds:0,notes:'Set out a small training area.',objects:[
  {id:'a',type:'attacker',x:400,y:400,rot:0,label:'A1'},
  {id:'b',type:'ball',x:417,y:392,rot:0,label:'Ball',ownerId:'a'}
 ],paths:{},timing:{}},
 {name:'Run to try line',seconds:3,notes:'Attack the gap towards the try line.',objects:[
  {id:'a',type:'attacker',x:400,y:150,rot:0,label:'A1'},
  {id:'b',type:'ball',x:417,y:142,rot:0,label:'Ball',ownerId:'a'}
 ],paths:{},timing:{}}]};
const diff=(a,b)=>Math.abs(a-b);
const range={U7:[20,12],U8:[45,22],U9:[60,30],U10:[60,35],
 U11:[60,43],U12:[60,43],U13:[90,60],U14:[100,70]};
test('age-grade maxima are differentiated and old drills remain training-area mode',()=>{
 for(const [k,v] of Object.entries(range))assert.deepEqual([FIELD_PRESETS[k].length,FIELD_PRESETS[k].width],v);
 assert.equal(fieldContext(d).mode,'training');
 assert(!trainingField(pitchGeometry(d.length,d.width)).includes('data-practice-area'));
});
test('metric placement preserves every route and remains invertible in both orientations',()=>{
 const source=structuredClone(d),candidate={...source,pitchContext:{mode:'field',age:'U10',x:0,y:-5}};
 const clean=playbackData(candidate);
 assert.equal(clean.pitchContext.age,'U10');assert.equal(clean.pitchContext.y,-5);
 assert.deepEqual(clean.frames[1].objects,playbackData(source).frames[1].objects);
 for(const direction of ['up','right']){
  const g=drillGeometry(clean,direction);
  const width=direction==='up'?g.trainingRect.width:g.trainingRect.height;
  const length=direction==='up'?g.trainingRect.height:g.trainingRect.width;
  assert(diff(width/g.scale,10)<1e-7);
  assert(diff(length/g.scale,12)<1e-7);
  for(const pt of [{x:42,y:37},{x:420,y:265},{x:858,y:503}]){
   const actual=g.fromView(...Object.values(g.toView(pt.x,pt.y)));
   assert(diff(pt.x,actual.x)<1e-6&&diff(pt.y,actual.y)<1e-6,'Field transform reverses');
  }
 }
});
test('whole field and closer action framing share actual field markings and posts',()=>{
 const drill=playbackData({...d,pitchContext:{mode:'field',age:'U10',x:0,y:-5}});
 const full=renderScene(drill,{index:1,framing:'field'});
 assert.match(full.svg,/data-practice-area="true"/);
 assert.match(full.svg,/IN-GOAL/);
 assert.match(full.svg,/TRAINING AREA/);
 assert.match(full.svg,/<circle/,'Goalpost bases or players should render');
 const close=renderScene(drill,{index:1,framing:'action'});
 assert(close.camera.width<full.camera.width||close.camera.height<full.camera.height,
  'Action focus should show a smaller field window');
 assert.match(close.svg,/data-practice-area="true"/);
 assert.equal(drill.length,12);assert.equal(drill.width,10);
});
test('placing a practice at the try line retains metres; unsuitable areas reject cleanly',()=>{
 const values={...setupValues(d),title:d.title,fieldMode:'field',fieldAge:'U10',fieldX:0,fieldY:-5};
 const ok=prepareSetup(d,values,()=> 'id');
 assert(ok.ok,ok.message);assert.equal(ok.drill.pitchContext.y,-5);
 assert.deepEqual(ok.drill.frames,d.frames,'Location is metadata, not a rewritten route');
 assert(!validateFieldContext({...values,x:32,y:0,mode:'field',age:'U10'},d.length,d.width).ok);
 assert(!validateFieldContext({...values,x:0,y:0,mode:'field',age:'U7'},d.length,15).ok);
 const atTop=fieldAnchor({age:'U10'},12,10,'top-try');
 assert.equal(atTop.y,-5);
 assert.equal(fieldAnchor({age:'U10'},12,10,'right-touch').x,25);
 assert.equal(fieldAnchor({age:'U10'},12,10,'left-five').x,5);
});
test('both editors expose the same field controls without replacing their engine',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const classic=read('index.html'),coach=read('coach/index.html');
 for(const s of [classic,coach])for(const id of ['fieldMode','fieldAge','fieldX','fieldY','fieldAnchor','zoomArea','shareFraming'])
  assert(s.includes('id="'+id+'"'),id+' must be present in both editors');
 assert.match(read('js/app.js'),/function previewSetup\(\)/);
 assert.match(read('js/app.js'),/drillGeometry\(draft,'up'\)/);
 assert.match(read('js/app.js'),/fieldDrag/);
});

test('published touch restart and U14 lineout carry age-appropriate field context',()=>{
 const data=JSON.parse(readFileSync(new URL('../data/drills.json',import.meta.url),'utf8'));
 const get=id=>data.drills.find(d=>d.id===id);
 assert.equal(get('seed-063').pitchContext?.age,'U10');
 assert.equal(get('seed-061').pitchContext?.age,'U14');
 for(const id of ['seed-063','seed-061']){
  const scene=renderScene(playbackData(get(id)),{index:0,framing:'field'});
  assert.match(scene.svg,/data-practice-area="true"/);
 }
});
test('manual read-only zoom changes SVG viewBox without changing the field',async()=>{
 const {zoomWindow}=await import('../js/viewer-camera.js');
 const base={x:0,y:0,width:700,height:1200};
 const a=zoomWindow(base,1),b=zoomWindow(base,2);
 assert.equal(a.width,700);assert.equal(b.width,350);
 assert.equal(zoomWindow(base,4,{x:900,y:-100}).x,525);
 assert.equal(zoomWindow(base,4,{x:900,y:-100}).y,0);
});
