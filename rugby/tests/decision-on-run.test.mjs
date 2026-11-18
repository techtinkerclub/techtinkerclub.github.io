import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDecisionOnRun} from '../js/annotation-to-branch.js';
import {branchInfo,outcomeViews,chooseOutcome} from '../js/branching.js';
import {decisionTime} from '../js/branching-visual.js';
import {playbackData,renderScene} from '../js/scene.js';
import {printMarkup} from '../js/outputs.js';

const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const first=[
 {id:'coach',type:'coach',label:'Coach',x:170,y:380,rot:0},
 {id:'runner',type:'attacker',label:'A1',x:580,y:420,rot:0},
 {id:'defender1',type:'defender',label:'D1',x:260,y:160,rot:0},
 {id:'defender2',type:'defender',label:'D2',x:450,y:160,rot:0},
 {id:'ball1',type:'ball',label:'',x:184,y:366,rot:0,ownerId:'coach'}
];
const last=structuredClone(first);
for(const o of last){
 if(o.id==='coach'){o.x=230;o.y=280}
 if(o.id==='ball1'){o.x=244;o.y=266}
 if(o.id.startsWith('defender'))o.y=205;
}
const source={id:'test',title:'Coach decision',version:1,age:'U10',category:'Attack',length:20,width:15,
 frames:[
  {name:'Set up',seconds:0,notes:'',objects:first,timing:{},paths:{}},
  {name:'GO and run',seconds:2,notes:'',objects:last,timing:{},paths:{coach:{mode:'smooth',points:[{x:192,y:330}],follow:false}},signal:{kind:'whistle',coachId:'coach',duration:0.2}}
 ]};
const untouched=structuredClone(source);
const settings={question:'Run or pass?',labelA:'Coach carries through the gap',labelB:'Pass to A1',actionA:'main',actionB:'pass',receiverB:'runner'};
const created=createDecisionOnRun(source,1,'coach',.55,'decision-main',settings);
const drill=created.drill,paths=outcomeViews(drill),fork=drill.frames[1],before=drill.frames[0];
assert.deepEqual(source,untouched,'The original drill must not be edited before user confirms');
assert.equal(drill.branching.fork,1);
assert.equal(drill.branching.markerId,'decision-main');
assert.equal(drill.branching.question,settings.question);
assert.equal(paths.length,2);
assert.ok(created.midStep);
assert.equal(decisionTime(drill),fork.seconds);
assert.equal(fork.seconds,1.1);
assert.equal(drill.frames[2].seconds,.9);
assert.equal(fork.signal.duration,.2,'Whistle remains on shared action only');
assert.equal(drill.frames[2].signal,undefined);
const diamond=fork.objects.find(o=>o.id==='decision-main');
assert.equal(diamond.decision.playerId,'coach');
assert.equal(diamond.decision.anchor,null,'After splitting, the diamond is already at the exact arrival position');
assert.equal(fork.objects.filter(o=>o.type==='decision').length,1);
assert.equal(drill.frames[2].objects.filter(o=>o.type==='decision').length,0);
assert.equal(fork.objects.find(o=>o.id==='defender1').y,184.75,'Defenders must be mid-advance when the choice occurs');
const coachAt=fork.objects.find(o=>o.id==='coach');
assert.ok(coachAt.y>280&&coachAt.y<380,'Coach has run INTO the decision point');
assert.ok(Math.hypot(coachAt.x-diamond.x,coachAt.y-diamond.y)<.01,'Decision is at player position, not a random pitch location');
const A=paths[0].drill.frames[2],B=paths[1].drill.frames[2];
assert.equal(A.objects.find(o=>o.id==='ball1').ownerId,'coach','Option A continues the carry');
assert.equal(B.objects.find(o=>o.id==='ball1').ownerId,'runner','Option B changes possession to A1');
assert.equal(B.objects.find(o=>o.id==='ball1').transferKind,'pass');
assert.deepEqual(A.objects.filter(o=>o.type==='defender').map(o=>o.y),B.objects.filter(o=>o.type==='defender').map(o=>o.y),'Both options start with the same defending line');
const projected=playbackData(drill);
assert.equal(projected.branching.choices.length,2);
for(const v of outcomeViews(projected)){
 const picture=renderScene(v.drill,{time:decisionTime(drill),runs:true,passes:true,decisions:true});
 assert.match(picture.svg,/<svg/);
}
const printed=printMarkup(projected);
assert.match(printed,/OPTION A/);
assert.match(printed,/OPTION B/);
assert.match(printed,/Run or pass/);
const switched=structuredClone(drill);
chooseOutcome(switched,'b');
switched.frames[2].notes='Coach chooses to pass';
chooseOutcome(switched,'a');
assert.notEqual(switched.frames[2].notes,'Coach chooses to pass','Editing B must not edit A');
chooseOutcome(switched,'b');
assert.equal(switched.frames[2].notes,'Coach chooses to pass');
const restored=JSON.parse(JSON.stringify(switched));
assert.equal(branchInfo(restored).active,'b','The fork survives JSON save and reload');
assert.deepEqual(outcomeViews(restored).map(v=>v.drill.frames.length),[3,3]);
assert.throws(()=>createDecisionOnRun(source,0,'coach',.5,'bad',settings),/First add a running step/);
assert.throws(()=>createDecisionOnRun(source,1,'runner',.5,'bad',settings),/Draw a running path/);
assert.throws(()=>createDecisionOnRun(source,1,'coach',.01,'bad',settings),/Place the decision/);
assert.throws(()=>createDecisionOnRun(source,1,'coach',.15,'bad',settings),/too close/);
const forward=structuredClone(source);
forward.frames[1].objects.find(o=>o.id==='runner').y=270;
assert.throws(()=>createDecisionOnRun(forward,1,'coach',.55,'bad',settings),/forward/i,'Forward pass cannot be silently animated');
const noBall=structuredClone(source);
for(const f of noBall.frames)f.objects=f.objects.filter(o=>o.type!=='ball');
assert.throws(()=>createDecisionOnRun(noBall,1,'coach',.55,'bad',settings),/must carry the ball/);
const noReceiver=structuredClone(source);
for(const f of noReceiver.frames)f.objects=f.objects.filter(o=>o.id!=='runner');
assert.throws(()=>createDecisionOnRun(noReceiver,1,'coach',.55,'bad',settings),/receiving player/);
const app=file('js/app.js');
assert.match(app,/function beginDecisionPlacement\(/,'Main Classic action must use guided decision placement');
assert.match(app,/createDecisionOnRun\(drill,fork,placement.actorId/,'Decision is created on the exact clicked run');
assert.match(app,/pendingDecisionPlacement=\{step:idx,actorId:o.id,anchor,markerId:uid\(\)\}/,'The running path is not modified until confirmation');
assert.match(app,/addDecisionButton\.textContent='◆ Add decision to this run'/);
assert.match(app,/function decisionInspector\(o\)/);
assert.match(app,/function compareOutcomePaths/);
assert.match(app,/showOutcomeDecision|compareOutcomePaths\(\{atFork:true\}\)/);
for(const page of ['index.html','coach/index.html']){
 const html=file(page);
 for(const id of ['outcomeDialog','outcomePrompt','outcomeActionA','outcomeActionB','outcomeReceiverA','outcomeReceiverB','outcomeSave','outcomeCancel'])
  assert.ok(html.includes('id="'+id+'"'),page+' missing '+id);
 assert.match(html,/app\.js\?v=0\.\d+\.\d+/);
}
console.log('Decision on run: single-step creation, actual mid-run pause, independent editable A/B paths, backward pass, whistle, serialization, safety checks and both editor entrypoints passed.');
