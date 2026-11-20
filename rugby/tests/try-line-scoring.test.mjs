import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {diagramSettings,diagramSVG} from '../js/diagram-shapes.js';
import {tryLineEvents,tryFeedbackSVG} from '../js/try-scoring.js';
import {playbackData,renderScene} from '../js/scene.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const g={scale:10,width:20,viewWidth:900,viewHeight:540};
const line={id:'try',type:'tryLine',label:'TRY LINE',x:400,y:250,rot:0,diagram:{length:20,scoringSide:'positive',labelAnchor:'end',labelSide:'inside'}};
const make=(type='attacker',oldY=230,newY=285,ground=true,own=true,side='positive')=>{
 const marker={...line,diagram:{...line.diagram,scoringSide:side}};
 const actor=(y)=>({id:'a1',type,label:'A1',x:400,y,rot:180});
 const ball=(y)=>({id:'ball',type:'ball',x:415,y,rot:0,...(own?{ownerId:'a1'}:{})});
 return {version:1,title:'Try demonstration',length:20,width:15,frames:[
  {name:'Ready',seconds:0,objects:[marker,actor(oldY),ball(oldY)],timing:{},paths:{}},
  {name:'Enter in-goal',seconds:2,objects:[marker,actor(newY),ball(newY)],
   ...(ground?{tryGroundings:[{id:'ground1',actorId:'a1',at:.85}]}:{}),timing:{},paths:{}}
 ]};
};
test('A directed attacking ball carrier crossing and grounding scores exactly one try',()=>{
 const d=make(),events=tryLineEvents(d,g);
 assert.equal(events.length,1);
 assert.equal(events[0].actorId,'a1');
 assert.equal(events[0].lineId,'try');
 assert.equal(events[0].time,1.7);
 assert.equal(tryLineEvents(d,g).length,1);
 assert.match(tryFeedbackSVG(events,1.9,g,{cartoonMode:true}),/TRY!/);
 assert.match(tryFeedbackSVG(events,9,g),/TRIES: 1/);
 assert.doesNotMatch(tryFeedbackSVG(events,0.7,g),/TRY!/);
});
test('Defender carrying the ball NEVER scores, in either direction',()=>{
 assert.deepEqual(tryLineEvents(make('defender',230,285),g),[]);
 assert.deepEqual(tryLineEvents(make('defender',285,230,true,true,'negative'),g),[]);
});
test('Crossing without grounding, without possession, or in the wrong direction does not score',()=>{
 assert.equal(tryLineEvents(make('attacker',230,285,false),g).length,0);
 assert.equal(tryLineEvents(make('attacker',230,285,true,false),g).length,0);
 assert.equal(tryLineEvents(make('attacker',285,230,true,true,'positive'),g).length,0);
 assert.equal(tryLineEvents(make('attacker',230,285,true,true,'negative'),g).length,0);
 assert.equal(tryLineEvents(make('attacker',285,230,true,true,'negative'),g).length,1);
});
test('No score outside the designated line segment or before eligible crossing',()=>{
 const outside=make(),wrong=make();
 for(const f of outside.frames){for(const o of f.objects)if(o.type==='attacker')o.x=580}
 assert.equal(tryLineEvents(outside,g).length,0);
 wrong.frames[1].tryGroundings[0].at=.1;
 assert.equal(tryLineEvents(wrong,g).length,0);
});
test('Try line and ordinary line support positional labels inside/aside with escaped text',()=>{
 const settings=diagramSettings('tryLine',line.diagram,20);
 assert.equal(settings.scoringSide,'positive');
 assert.equal(settings.labelAnchor,'end');
 assert.equal(settings.labelSide,'inside');
 const scene=diagramSVG({...line,label:'<TRY>'},g);
 assert.match(scene,/data-line-kind="try-line"/);
 assert.match(scene,/&lt;TRY&gt;/);
 assert.match(scene,/text-anchor="end"/);
 assert.match(scene,/pointer-events="none"/);
 const ordinary=diagramSVG({...line,type:'fieldLine',label:'WIDE',diagram:{labelAnchor:'start',labelSide:'right'}},g);
 assert.match(ordinary,/text-anchor="start"/);
 assert.match(ordinary,/WIDE/);
});
test('Published playback preserves try line, grounding and automatic feedback',()=>{
 const d=make(),clean=playbackData(d);
 assert.equal(clean.frames[1].tryGroundings[0].actorId,'a1');
 assert.equal(clean.frames[1].objects.some(o=>o.type==='tryLine'),true);
 assert.match(renderScene(clean,{time:1.9,cartoonMode:true}).svg,/try-score-feedback/);
 assert.doesNotMatch(renderScene(clean,{time:.7,cartoonMode:false}).svg,/try-score-feedback/);
});
test('Native editor has scoring direction and grounding controls; Blackboard keeps true open/save integration',()=>{
 const app=read('js/app.js'),blackboard=read('js/blackboard.js'),html=read('index.html');
 assert.match(app,/id="markScoringSide"/);
 assert.match(app,/id="markLabelAnchor"/);
 assert.match(app,/id="markLabelSide"/);
 assert.match(app,/id="tryGroundNow"/);
 assert.match(app,/kind==='open-library'/);
 assert.match(app,/kind==='save-library'/);
 assert.match(app,/function offerPublicationAfterSave\(/);
 assert.match(app,/if\(committedId&&offerPublish\)/);
 assert.match(blackboard,/id="bbDrillsMenu"/);
 assert.match(blackboard,/data-bb="open-library"/);
 assert.match(blackboard,/data-bb="save-library"/);
 assert.match(blackboard,/data-bb="publish-saved"/);
 assert.match(html,/ANIMATED LIBRARY v0\.20\.65/);
});
