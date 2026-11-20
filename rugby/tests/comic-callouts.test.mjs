import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {blank} from '../js/model.js';
import {bubbleSVG,compactActionBubbleSVG,planBubble,cleanCallouts,calloutOverlay} from '../js/comic-callouts.js';
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
 assert.match(read('js/video-recorder.js'),/from '\.\/scene\.js\?v=0\.20\.\d+'/);
});

test('callout planner stays within pitch and moves away from the speaking player',()=>{
 const speaker={x:250,y:270},mate={x:307,y:220};
 const placement=planBubble({...speaker,width:122,height:56,g,avoid:[speaker,mate]});
 assert(placement.left>=44&&placement.left+placement.width<=856);
 assert(placement.top>=44&&placement.top+placement.height<=496);
 const hit=(p)=>p.x>=placement.left-26&&p.x<=placement.left+placement.width+26&&
   p.y>=placement.top-26&&p.y<=placement.top+placement.height+26;
 assert.equal(hit(speaker),false,'bubble cannot cover speaker or their head');
 const other=planBubble({...speaker,width:122,height:56,g,avoid:[mate],reserved:[placement.rect]});
 const overlap=Math.max(0,Math.min(placement.left+placement.width,other.left+other.width)-Math.max(placement.left,other.left))*
  Math.max(0,Math.min(placement.top+placement.height,other.top+other.height)-Math.max(placement.top,other.top));
 assert.equal(overlap,0,'second callout avoids the first rather than floating on top');
 for(const point of [{x:50,y:48},{x:850,y:486}]){
  const p=planBubble({...point,width:140,height:53,g});
  assert(p.left>=44&&p.top>=44&&p.left+p.width<=856&&p.top+p.height<=496,
   'edge placement remains inside visible pitch');
 }
});
test('manual and automatic cues share vertically centred text and no grey shadow',()=>{
 const opts={x:350,y:180,g};
 for(const comic of [false,true]){
  const manual=bubbleSVG({...opts,text:'Quick support call',kind:'speech',comic});
  const automatic=compactActionBubbleSVG({...opts,text:'TAG!',kind:'shout',comic});
  for(const src of [manual,automatic]){
   assert.match(src,/dominant-baseline="middle"/,'SVG centres text vertically');
   assert.match(src,/text-anchor="middle"/,'SVG centres text horizontally');
   assert.match(src,/data-callout-side="/,'layout records a safe side');
   assert.doesNotMatch(src,/opacity="\.2[0-9]|opacity="\.3[0-9]/,'no decorative grey shadow');
  }
  assert.match(manual,comic?/graphic-novel-bubble/:/standard-speech-bubble/);
  assert.match(automatic,comic?/graphic-novel-bubble/:/standard-speech-bubble/);
 }
});
test('auto tag/touch/rip cues use shared styled caption in both modes',()=>{
 const source=readFileSync(new URL('../js/skill-actions.js',import.meta.url),'utf8');
 assert.match(source,/comic:context\?\.cartoonMode===true&&!ink/);
 assert.match(source,/bubbleReservations/);
 assert.match(source,/classic-action-cue/);
 assert.match(source,/ball-rip-cue/);
 assert.doesNotMatch(source,/opacity="\.23"/);
});
test('authored speech avoids all nearby players and reserves positions for adjacent bubbles',()=>{
 const a={...player},b={...player,id:'p2',x:365,y:235};
 const call={...cue,displaySeconds:4};
 const f=[{seconds:0,objects:[a,b]},{seconds:3,objects:[a,b],callouts:[call,{...call,id:'two',actorId:'p2',text:'Cover the space'}]}];
 const svg=calloutOverlay(f,1,[a,b],g,.8,{cartoonMode:true});
 assert.equal((svg.match(/data-callout-side="/g)||[]).length,2);
 assert.match(svg,/SPREAD OUT!/);
 assert.match(svg,/Cover the space/);
 assert.doesNotMatch(svg,/fill="#122b1c" opacity="\.38"/);
});
