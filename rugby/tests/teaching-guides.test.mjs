import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {pitchGeometry} from '../js/pitch.js';
import {cleanTeachingGuides,teachingGuidesSVG,measuredMetres} from '../js/teaching-guides.js';
import {playbackData,renderScene} from '../js/scene.js';
import {outputOptions} from '../js/outputs.js';
const catalogue=JSON.parse(readFileSync(new URL('../data/drills.json',import.meta.url),'utf8')).drills;
const find=id=>catalogue.find(x=>x.id===id);
test('measured free-pass overlays agree with actual metre geometry',()=>{
 const d=find('seed-086'),g=pitchGeometry(d.length,d.width,'up'),fr=d.frames[2];
 const measures=fr.teachingGuides.filter(x=>x.kind==='distance');
 assert.equal(measures.length,2);
 assert(Math.abs(measuredMetres(g,measures[0].a,measures[0].b)-5)<1e-7);
 assert(Math.abs(measuredMetres(g,measures[1].a,measures[1].b)-7)<1e-7);
 const clean=playbackData(d);
 assert.equal(clean.frames[2].teachingGuides.length,4,'Guide metadata survives read-only player import');
 const picture=renderScene(clean,{index:2,teachingGuides:true});
 assert.match(picture.svg,/5 m · In from touch/);
 assert.match(picture.svg,/7 m · Back 7 m/);
 assert.match(picture.svg,/data-teaching-guides="true"/);
 const plain=renderScene(clean,{index:2,teachingGuides:false});
 assert.doesNotMatch(plain.svg,/data-teaching-guides="true"/,'Presentation toggle can hide overlays');
 assert.match(renderScene(clean,{index:2,ink:true}).svg,/data-teaching-guides="true"/,'Printed output includes guides');
});
test('other U10 measured guides remain accurate',()=>{
 for(const [id,step,expected] of [['seed-137',2,7],['seed-138',1,5]]){
  const d=playbackData(find(id)),g=pitchGeometry(d.length,d.width,'up'),guide=d.frames[step].teachingGuides.find(x=>x.kind==='distance');
  assert(guide,id+' missing measured distance');
  assert(Math.abs(measuredMetres(g,guide.a,guide.b)-expected)<1e-7,id+' guide must match geometry');
  assert.match(teachingGuidesSVG(d.frames[step],g),new RegExp(expected+' m'));
 }
});
test('guide input cannot inject markup or corrupt saved objects',()=>{
 const g=pitchGeometry(20,15,'up');
 assert.deepEqual(cleanTeachingGuides(null),[]);
 assert.deepEqual(cleanTeachingGuides([{kind:'invalid',a:{x:1,y:1}},{kind:'line',a:{x:10,y:20},b:{x:Infinity,y:20}}]),[]);
 const html=teachingGuidesSVG({teachingGuides:[{kind:'mark',a:{x:450,y:270},label:'<script>alert("x")</script>'}]},g);
 assert(!html.includes('<script>'));
 assert(html.includes('&lt;script&gt;'));
 assert.equal(outputOptions().teachingGuides,true);
 assert.equal(outputOptions({teachingGuides:false}).teachingGuides,false);
});
