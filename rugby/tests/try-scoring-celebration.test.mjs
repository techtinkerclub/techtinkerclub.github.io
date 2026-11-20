import test from 'node:test';
import assert from 'node:assert/strict';
import {tryLineEvents,tryVisualDuration,tryCelebrationAt,RUCKUS_TRY_CELEBRATION_SECONDS} from '../js/try-scoring.js';
import {playerAppearance} from '../js/cartoon-players.js';
import {renderScene,playbackData} from '../js/scene.js';
import {drillGeometry} from '../js/pitch.js';
import {propagatePosition} from '../js/drill-edit.js';
const line={id:'goal',type:'tryLine',label:'TRY LINE',x:450,y:270,rot:0,diagram:{length:14,scoringSide:'positive'}};
const attack=(y,type='attacker')=>({id:'a1',type,label:'A1',x:450,y,rot:180});
const ball=(y,owner='a1')=>({id:'ball',type:'ball',x:450,y,rot:0,ownerId:owner});
const d=(ground=true,type='attacker',side='positive')=>({
 version:1,id:'try-demo-test',title:'Try celebration acceptance',length:20,width:15,
 ageMin:10,ageMax:10,minutes:3,category:'Understanding the game',
 frames:[
 {name:'Set up',seconds:.4,objects:[attack(240,type),ball(240),{...line,diagram:{...line.diagram,scoringSide:side}}],timing:{},paths:{}},
 {name:'Ground try',seconds:2,objects:[attack(350,type),ball(350),{...line,diagram:{...line.diagram,scoringSide:side}}],timing:{},paths:{},...(ground?{tryGroundings:[{id:'g1',actorId:'a1',at:.85}]}:{})}
 ]});
const g=drillGeometry(d(),'up');
test('directed attacker crossing alone never scores',()=>{
 assert.deepEqual(tryLineEvents(d(false),g),[]);
 assert.deepEqual(tryLineEvents(d(true,'defender'),g),[],'defending ball carrier cannot score');
 assert.deepEqual(tryLineEvents(d(true,'attacker','negative'),g),[],'wrong direction cannot score');
});
test('grounding must follow the crossing, with the correct ball carrier',()=>{
 const drill=d(),events=tryLineEvents(drill,g);
 assert.equal(events.length,1);
 assert.equal(events[0].actorId,'a1');
 assert(Math.abs(events[0].time-2.1)<.0001,'setup hold is included in the scoring time');
 const noOwner=d();for(const f of noOwner.frames)f.objects.find(x=>x.type==='ball').ownerId='someone-else';
 assert.deepEqual(tryLineEvents(noOwner,g),[]);
 const early=d();early.frames[1].tryGroundings[0].at=.01;
 assert.deepEqual(tryLineEvents(early,g),[],'grounding cannot precede crossing');
});
test('Ruckus-only visual tail grants enough time for the whole victory sequence',()=>{
 const x=d(),total=.4+2;
 assert.equal(tryVisualDuration(x,g,false),total,'Classic duration untouched');
 assert(Math.abs(tryVisualDuration(x,g,true)-(2.1+RUCKUS_TRY_CELEBRATION_SECONDS))<.0001);
 assert.equal(tryVisualDuration(d(false),g,true),total,'no score produces no outro');
 const events=tryLineEvents(x,g),t=events[0].time;
 assert.equal(tryCelebrationAt(events,t+.1,'a1').phase,'ground');
 assert.equal(tryCelebrationAt(events,t+.4,'a1').phase,'rise');
 assert.equal(tryCelebrationAt(events,t+.8,'a1').phase,'celebrate');
 assert.equal(tryCelebrationAt(events,t+RUCKUS_TRY_CELEBRATION_SECONDS+.02,'a1'),null);
 assert.equal(tryCelebrationAt(events,t+.8,'d1'),null);
});
test('celebration uses approved raised-arms artwork, never changes Classic mode',()=>{
 const x=d(),events=tryLineEvents(x,g);
 const o=x.frames[1].objects[0];
 const base='<circle r="15"/>';
 const celebrate=tryCelebrationAt(events,events[0].time+1.1,'a1');
 const styled=playerAppearance(o,'standing',base,x.frames[1].objects,g,x.frames[0],x.frames[1],1,{cartoonMode:true,celebration:celebrate});
 assert.match(styled,/data-try-celebration="celebrate"/);
 assert.match(styled,/data-ruckus-pose="5[23]"/);
 assert.match(styled,/rugby-ruckus-blue-54/);
 const classic=playerAppearance(o,'standing',base,x.frames[1].objects,g,x.frames[0],x.frames[1],1,{cartoonMode:false,celebration:celebrate});
 assert.doesNotMatch(classic,/ruckus|celebration/);
});
test('common scene keeps the Ruckus try dance during visual outro',()=>{
 const parsed=playbackData(d()),events=tryLineEvents(parsed,drillGeometry(parsed,'up'));
 assert.equal(events.length,1,'playbackData must preserve tryGroundings');
 const time=events[0].time+1.1;
 const cartoon=renderScene(parsed,{time,cartoonMode:true});
 assert.match(cartoon.svg,/data-try-celebration="celebrate"/);
 assert.match(cartoon.svg,/try-score-feedback/);
 const classic=renderScene(parsed,{time,cartoonMode:false});
 assert.doesNotMatch(classic.svg,/data-try-celebration="celebrate"/);
});
