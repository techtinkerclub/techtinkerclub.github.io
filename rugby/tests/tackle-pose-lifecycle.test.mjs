import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {playbackData,renderScene} from '../js/scene.js';
import {pitchGeometry} from '../js/pitch.js';
import {tackleImpacts,transitionObjects,normaliseRecoveryPoses} from '../js/possession.js';
import {posesFor} from '../js/contact.js';
import {trainingPoses} from '../js/training.js';

const drills=JSON.parse(readFileSync(new URL('../data/drills.json',import.meta.url),'utf8')).drills;
const visible=objects=>trainingPoses(objects,posesFor(objects));
const state=(a,b,p,g)=>visible(transitionObjects(a,b,p,g));
test('real player-on-player tackle changes tackler stance before and at contact',()=>{
 const d=playbackData(drills.find(x=>x.id==='seed-084'));
 const g=pitchGeometry(d.length,d.width,'up');
 const old=d.frames[1],next=d.frames[2],events=tackleImpacts(old,next,g);
 const impact=events.find(e=>e.tackler==='d1'&&e.carrier==='a1');
 assert(impact,'Newly authored contact should have a determined event');
 assert(impact.time>.2&&impact.time<1,'Sample must have actual approach then contact');
 const before=Math.max(0,impact.time-.1),contact=Math.min(1,impact.time+.02);
 assert.equal(state(old,next,before,g).get('d1'),'ready','Tackler lowers stance during approach');
 assert.equal(state(old,next,contact,g).get('d1'),'tackling','Tackler must switch at contact');
 assert.equal(state(old,next,contact,g).get('a1'),'grounded','Carrier is grounded at contact');
 assert.equal(state(old,next,1,g).get('d1'),'tackling','Contact remains visible in final still');
 const scene=renderScene(d,{time:d.frames[1].seconds+next.seconds*.99});
 assert.match(scene.svg,/<svg/,'Read-only view must render same animation');
});
test('tackler releases and carrier recovers without sliding grounded',()=>{
 const d=playbackData(drills.find(x=>x.id==='seed-084'));
 const g=pitchGeometry(d.length,d.width,'up');
 assert.equal(state(d.frames[2],d.frames[3],.8,g).get('d1'),'standing');
 assert.equal(state(d.frames[2],d.frames[3],.8,g).get('a1'),'grounded','Carrier presents ball while down');
 assert.equal(state(d.frames[3],d.frames[4],.4,g).get('a1'),'standing','Moving player must be upright before travelling');
 assert.equal(visible(d.frames[4].objects).get('a1'),'standing','Final still is not stuck on ground');
});
test('inherited unpinned tackle/recovery pose clears even if player stays put',()=>{
 const frames=[
  {objects:[{id:'a',type:'attacker',x:100,y:100,playerPose:'recovering'},{id:'d',type:'defender',x:200,y:200,playerPose:'tackling'}],timing:{},paths:{}},
  {objects:[{id:'a',type:'attacker',x:100,y:100,playerPose:'recovering'},{id:'d',type:'defender',x:200,y:200,playerPose:'tackling'}],timing:{},paths:{}}
 ];
 normaliseRecoveryPoses(frames);
 assert.equal(frames[1].objects[0].playerPose,'standing');
 assert.equal(frames[1].objects[1].playerPose,'standing');
 const pinned=structuredClone(frames[0]);pinned.objects[0].posePinned=true;
 normaliseRecoveryPoses([frames[0],pinned]);
 assert.equal(pinned.objects[0].playerPose,'recovering','Explicit pinned coach pose survives');
 const grounded=structuredClone(frames[0]);
 grounded.objects[0].playerPose='grounded';
 const copied=structuredClone(grounded);
 normaliseRecoveryPoses([grounded,copied]);
 assert.equal(copied.objects[0].playerPose,'grounded','Intentional stationary ball presentation remains');
});
test('no tackle pose is fabricated when only two players approach',()=>{
 const g=pitchGeometry(20,15,'up');
 const first={objects:[{id:'a',type:'attacker',x:200,y:300},{id:'d',type:'defender',x:200,y:100}],timing:{},paths:{}};
 const next={objects:[{id:'a',type:'attacker',x:200,y:200},{id:'d',type:'defender',x:200,y:210}],timing:{},paths:{},seconds:2};
 const poses=state(first,next,.9,g);
 assert.equal(poses.get('a')||'standing','standing');
 assert.equal(poses.get('d')||'standing','standing');
});
