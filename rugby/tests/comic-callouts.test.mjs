import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {blank} from '../js/model.js';
import {bubbleSVG,cleanCallouts,calloutOverlay} from '../js/comic-callouts.js';
import {playbackData,renderScene} from '../js/scene.js';

const g={margin:44,viewWidth:900,viewHeight:540,fw:812,fh:452,toView:(x,y)=>({x,y})};
const player={id:'p1',type:'attacker',label:'A1',x:320,y:245,rot:0};
const cue={id:'cue1',actorId:'p1',text:'SPREAD OUT!',kind:'shout',at:.5,displaySeconds:3};
const frames=[{seconds:0,objects:[player]},{seconds:2,objects:[player],callouts:[cue]},{seconds:3,objects:[player]}];

test('user speech is timed, editable and can continue into the next step',()=>{
 assert.doesNotMatch(calloutOverlay(frames,1,[player],g,.2,{cartoonMode:true}),/SPREAD OUT!/);
 assert.match(calloutOverlay(frames,1,[player],g,.6,{cartoonMode:true}),/SPREAD OUT!/);
 assert.match(calloutOverlay(frames,2,[player],g,.4,{cartoonMode:true}),/SPREAD OUT!/);
 assert.doesNotMatch(calloutOverlay(frames,2,[player],g,.9,{cartoonMode:true}),/SPREAD OUT!/);
 assert.match(calloutOverlay(frames,1,[player],g,0,{cartoonMode:true,editing:true}),/SPREAD OUT!/);
});
test('Ruckus uses comic style, Classic continues with its plain styling',()=>{
 const cartoon=calloutOverlay(frames,1,[player],g,.7,{cartoonMode:true});
 const classic=calloutOverlay(frames,1,[player],g,.7,{cartoonMode:false});
 assert.match(cartoon,/graphic-novel-bubble/);
 assert.match(classic,/standard-speech-bubble/);
 assert.doesNotMatch(classic,/graphic-novel-bubble/);
 assert.match(bubbleSVG({x:200,y:150,text:'Look <script>',g}),/&lt;script&gt;/);
});
test('cleanCallouts prevents invalid IDs, untrusted text lengths and timing',()=>{
 const source={objects:[player],callouts:[
  {id:'a',actorId:'p1',text:' Hi ',at:-10,displaySeconds:200,kind:'thought'},
  {id:'b',actorId:'unknown',text:'Not a speaker'},
  {id:'c',actorId:'p1',text:'',kind:'shout'}
 ]};
 cleanCallouts(source);
 assert.equal(source.callouts.length,1);
 assert.equal(source.callouts[0].text,'Hi');
 assert.equal(source.callouts[0].at,0);
 assert.equal(source.callouts[0].displaySeconds,8);
});
test('saved and published scenes retain custom speech for Ruckus and movie renderer',()=>{
 const drill=blank();
 drill.frames=[{...drill.frames[0],seconds:0,objects:[player]},{
  ...drill.frames[0],seconds:2,name:'Watch the runners',objects:[player],callouts:[cue]
 }];
 const clean=playbackData(drill);
 assert.equal(clean.frames[1].callouts[0].text,'SPREAD OUT!');
 assert.match(renderScene(clean,{time:1.5,cartoonMode:true}).svg,/graphic-novel-bubble/);
 assert.match(renderScene(clean,{time:1.5,cartoonMode:false}).svg,/standard-speech-bubble/);
 assert.match(renderScene(clean,{index:1,cartoonMode:true,ink:true}).svg,/SPREAD OUT!/);
});
test('editor, public player and movie share the same feature, no separate action engine',()=>{
 const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const app=read('js/app.js'),scene=read('js/scene.js'),html=read('index.html');
 for(const id of ['addSpeechCallout','speechSpeaker','speechText','speechKind','speechAt','speechDuration','speechCalloutRows','menuSpeech'])
  assert.ok(html.includes('id="'+id+'"'),id+' must be reachable by the coach');
 assert.match(app,/cleanCallouts\(fr\)/);
 assert.match(app,/calloutOverlay\(drill\.frames,lineIndex/);
 assert.match(scene,/calloutOverlay\(d\.frames,i/);
 assert.match(scene,/result\.callouts=f\.callouts;cleanCallouts\(result\)/);
 assert.match(read('js/video-recorder.js'),/from '\.\/scene\.js\?v=0\.20\.52'/);
});
