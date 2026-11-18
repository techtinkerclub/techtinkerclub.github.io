import test from 'node:test';
import assert from 'node:assert/strict';
import {drillSeconds,stepEndSeconds,stepStartSeconds,stepLocation} from '../js/step-timeline.js';
import {playbackData,timeLocation,renderScene} from '../js/scene.js';
import {whistleAt} from '../js/whistle-signal.js';
import {ballPose} from '../js/possession.js';
import {decisionTime} from '../js/branching-visual.js';
const initial={name:'Setup',seconds:3,notes:'',paths:{},timing:{},objects:[{id:'a',type:'attacker',label:'A1',x:200,y:350,rot:0},{id:'b',type:'attacker',label:'A2',x:450,y:400,rot:0},{id:'ball',type:'ball',label:'',x:210,y:340,rot:0,ownerId:'a'},{id:'coach',type:'coach',label:'Coach',x:100,y:350,rot:0}]};
const follow=structuredClone(initial);follow.name='Pass';follow.seconds=2;follow.objects.find(o=>o.id==='ball').ownerId='b';follow.objects.find(o=>o.id==='ball').transferKind='pass';follow.signal={kind:'whistle',coachId:'coach',duration:.5};
const d={version:1,id:'test',title:'Setup',ageMin:10,ageMax:10,category:'Attack',length:20,width:15,frames:[initial,follow]};
test('setup is a stationary 3-second hold in all playback paths',()=>{
 assert.equal(drillSeconds(d),5);assert.equal(stepEndSeconds(d,0),3);assert.equal(stepStartSeconds(d,1),3);
 assert.equal(stepLocation(d,1.5).i,0);assert.equal(timeLocation(d,2).i,0);assert.deepEqual(timeLocation(d,3),{i:1,p:0});
 const safe=playbackData(d);assert.equal(safe.frames[0].seconds,3);
 assert.equal(renderScene(safe,{time:1}).svg,renderScene(safe,{time:2}).svg);
 assert.equal(whistleAt(safe,1).at,3);
});
test('legacy initial zero-second step stays unchanged',()=>{const old=structuredClone(d);old.frames[0].seconds=0;assert.equal(drillSeconds(old),2);assert.equal(timeLocation(old,0).i,0);assert.equal(timeLocation(old,.01).i,1)});
test('branched drill decision clock includes the setup hold',()=>{const b=structuredClone(d);b.branching={version:1,fork:0,question:'Choice?',active:'a',choices:[{id:'a',label:'A',frames:[structuredClone(follow)]},{id:'b',label:'B',frames:[structuredClone(follow)]}]};assert.equal(decisionTime(b),3)});
test('ball heading during a pass is temporary and path-derived',()=>{
 const g={rotation:0,scale:30,displayMode:'realistic',margin:30,fw:900,fh:540,toView:(x,y)=>({x,y}),fromView:(x,y)=>({x,y})};
 const ball=follow.objects.find(o=>o.type==='ball'),snapshot=structuredClone(ball);
 const moving=ballPose(initial,follow,ball,.5,g);
 assert.equal(moving.ownerId,undefined);assert.notEqual(moving.rot,ball.rot);assert.deepEqual(ball,snapshot);
});
