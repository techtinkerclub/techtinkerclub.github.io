import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pitchGeometry} from '../js/pitch.js';
import {actionViewport,followActionViewport,wholeFieldView} from '../js/action-camera.js';
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
 assert.match(play,/<option value="follow">Follow moving players and ball/);
 assert.match(player,/opts\.framing==='follow'/);
 assert.match(movie,/<option value="follow">Follow the action/);
 assert.match(publicVideo,/const options=\{\.\.\.settings\(\)/);
 assert.doesNotMatch(publicVideo,/scaleMode:'coaching',framing:'action'/,
  'public library must not overwrite user-selected follow mode');
 assert.match(video,/framing:opts\.framing\|\|'field'/);
});
