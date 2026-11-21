import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pitchGeometry,drillGeometry} from '../js/pitch.js';
import {actionViewport,followActionViewport,wholeFieldView,FOLLOW_OPEN_ZOOM,FOLLOW_CONTACT_ZOOM} from '../js/action-camera.js';
import {playbackData,renderScene,timeLocation} from '../js/scene.js';
import {outputOptions} from '../js/outputs.js';
import {movieSettingsMarkup} from '../js/movie.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const frames=[
 {name:'Setup',seconds:0,objects:[
  {id:'a1',type:'attacker',x:240,y:260,rot:90},
  {id:'a2',type:'attacker',x:290,y:260,rot:90},
  {id:'b1',type:'ball',x:250,y:245,ownerId:'a1'}],timing:{},paths:{}},
 {name:'Run with the ball',seconds:3,objects:[
  {id:'a1',type:'attacker',x:640,y:260,rot:90},
  {id:'a2',type:'attacker',x:690,y:260,rot:90},
  {id:'b1',type:'ball',x:650,y:245,ownerId:'a1'}],
  timing:{},paths:{}}
];
const raw={version:1,length:30,width:18,ageMin:10,ageMax:10,title:'Follow camera test',frames};
const rectangle=(v,g)=>v.x>=-1e-6&&v.y>=-1e-6&&v.x+v.width<=g.viewWidth+1e-6&&v.y+v.height<=g.viewHeight+1e-6;
const roughly=(a,b)=>Math.abs(a-b)<.001;

test('follow camera tracks real interpolated players and ball throughout a run',()=>{
 const d=playbackData(raw),g=pitchGeometry(d.length,d.width,'up'),before=JSON.stringify(d);
 const early=followActionViewport(d,g,1,.08),half=followActionViewport(d,g,1,.5),late=followActionViewport(d,g,1,.92);
 assert(rectangle(early,g)&&rectangle(half,g)&&rectangle(late,g));
 assert(late.x>early.x+12,'camera should track moving players rather than stay on a static step');
 assert(half.x>early.x&&half.x<late.x,'camera movement is gradual through the step');
 assert(early.width>0&&late.width>0);
 assert.equal(JSON.stringify(d),before,'camera follow cannot edit a saved drill');
});
test('whole pitch and action framing remain independent choices',()=>{
 const d=playbackData(raw),g=pitchGeometry(d.length,d.width,'up');
 const whole=wholeFieldView(g),single=actionViewport(d,g,1);
 assert.deepEqual(whole,{x:0,y:0,width:g.viewWidth,height:g.viewHeight});
 assert(single.width<=whole.width);
 const t=1.45,loc=timeLocation(d,t),follow=followActionViewport(d,g,loc.i,loc.p);
 const scene=renderScene(d,{time:t,framing:'follow'});
 assert(roughly(scene.camera.x,follow.x)&&roughly(scene.camera.y,follow.y));
 assert.equal(renderScene(d,{time:t,framing:'field'}).camera.x,0);
 assert.equal(outputOptions({framing:'follow'}).framing,'follow');
 assert.equal(outputOptions({framing:'action'}).framing,'action');
 assert.equal(outputOptions({framing:'field'}).framing,'field');
});
test('follow mode works for read-only Ruckus without changing body animation or drill data',()=>{
 const d=playbackData(raw),saved=JSON.stringify(d);
 const a=renderScene(d,{time:1.2,cartoonMode:true,framing:'follow'});
 const b=renderScene(d,{time:1.2,cartoonMode:true,framing:'field'});
 assert.match(a.svg,/ruckus-player/);
 assert(a.camera.width<=b.camera.width);
 assert.equal(JSON.stringify(d),saved);
});
test('follow camera is reachable in Studio, both library players and video exports',()=>{
 const editor=read('index.html'),coach=read('coach/index.html'),play=read('play.html');
 const app=read('js/app.js'),player=read('js/player.js'),publicVideo=read('js/public-video.js');
 const video=read('js/video-recorder.js'),movie=movieSettingsMarkup('movie');
 for(const html of [editor,coach])assert.match(html,/id="followAction"/);
 assert.match(app,/followActionViewport\(drill,g,lineIndex,p\)/);
 assert.match(play,/id="playerFollow"/);
 assert.match(play,/<option value="follow">Follow action · moving camera/);
 assert.match(player,/opts\.framing==='follow'/);
 assert.match(movie,/<option value="follow">Follow action · smooth moving camera/);
 assert.match(publicVideo,/const options=\{\.\.\.settings\(\)/);
 const exportOptions=publicVideo.slice(publicVideo.indexOf('const options={...settings()'),
  publicVideo.indexOf('const file=await',publicVideo.indexOf('const options={...settings()')));
 assert.doesNotMatch(exportOptions,/framing:'action'/,
  'public library video options must not override the chosen camera; printing may still use action framing');
 assert.match(video,/framing:settings\.framing/);
});


test('follow view retains nearby tactical context and starts the first movement without a camera jump',()=>{
 const d=playbackData(raw),g=pitchGeometry(d.length,d.width,'up');
 const setup=followActionViewport(d,g,0),entry=followActionViewport(d,g,1,0);
 assert(Math.abs(setup.x-entry.x)<1e-6&&Math.abs(setup.y-entry.y)<1e-6);
 assert(Math.abs(setup.width-entry.width)<1e-6,
  'first moving frame must not jump in zoom relative to the setup card');
 for(const p of [.1,.25,.5,.75,1]){
  const view=followActionViewport(d,g,1,p);
  assert(view.width>=g.viewWidth/FOLLOW_OPEN_ZOOM-1e-6,
   'camera must not crop so close that supporting runners disappear');
  assert(rectangle(view,g),'camera must remain within the pitch boundaries');
 }
});

test('U10 match showcase camera restores close contact shots without hiding contact players',()=>{
 const catalogue=JSON.parse(read('data/u10-match-showcases.json'));
 const d=playbackData(catalogue.drills.find(drill=>drill.id==='seed-972'));
 const g=drillGeometry(d,'up'),unchanged=JSON.stringify(d);
 const wider=followActionViewport(d,g,10,1);
 const close=followActionViewport(d,g,6,1);
 assert(close.width>=g.viewWidth/FOLLOW_CONTACT_ZOOM-1e-6,'contact zoom must stay bounded');
 assert(close.width<wider.width,'ruck should be a closer shot than open running play');
 assert(close.width<g.viewWidth/FOLLOW_OPEN_ZOOM,'contact should zoom closer than open-play cap');
 for(const id of ['a3','a4','d4']){
  const p=d.frames[6].objects.find(o=>o.id===id);
  assert(p&&g.toView(p.x,p.y).x>=close.x-1e-6&&g.toView(p.x,p.y).x<=close.x+close.width+1e-6,
   'participant must remain inside close-up: '+id);
  assert(g.toView(p.x,p.y).y>=close.y-1e-6&&g.toView(p.x,p.y).y<=close.y+close.height+1e-6,
   'participant must remain inside close-up vertically: '+id);
 }
 const incoming=followActionViewport(d,g,6,0),previous=followActionViewport(d,g,5,1);
 assert(roughly(incoming.x,previous.x)&&roughly(incoming.y,previous.y)&&roughly(incoming.width,previous.width),
  'camera must enter a close-up without snapping at the stage boundary');
 assert.equal(JSON.stringify(d),unchanged,'camera remains view-only');
});
