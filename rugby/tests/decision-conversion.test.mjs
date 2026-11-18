import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {convertDrawnDecision,drawnDecisionAt} from '../js/annotation-to-branch.js';
import {branchInfo,outcomeViews,chooseOutcome} from '../js/branching.js';
import {playbackData,renderScene} from '../js/scene.js';
import {printMarkup} from '../js/outputs.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const basic=[
{id:'coach',type:'coach',label:'Coach',x:150,y:390,rot:0},
{id:'runner',type:'attacker',label:'A1',x:590,y:430,rot:0},
{id:'d1',type:'defender',label:'D1',x:280,y:150,rot:0},
{id:'d2',type:'defender',label:'D2',x:410,y:150,rot:0},
{id:'ball',type:'ball',label:'',x:162,y:376,rot:0,ownerId:'coach'}
];
const diamond={id:'decision',type:'decision',label:'Decision',x:190,y:330,rot:0,
 decision:{playerId:'coach',anchor:.6,question:'Carry or pass?',cue:'Read the defenders',options:[
  {label:'Alternative run',kind:'run',mode:'smooth',points:[{x:245,y:260},{x:285,y:100}]},
  {label:'New option',kind:'pass',mode:'corners',points:[{x:589,y:430}]}
 ]}};
const source={version:1,id:'test',title:'Drawn choice',length:20,width:15,age:'U10',category:'Attack',
 frames:[
 {name:'Set up',seconds:0,notes:'',objects:structuredClone(basic),timing:{},paths:{}},
 {name:'Signal and advance',seconds:2,notes:'',objects:structuredClone(basic).map(o=>{
  if(o.id==='coach'){o.x=230;o.y=300}if(o.id==='ball'){o.x=242;o.y=286}
  if(o.id==='d1')o.y=200;if(o.id==='d2')o.y=200;
  return o;
 }).concat([diamond]),timing:{},paths:{coach:{mode:'smooth',points:[{x:190,y:340}],follow:false}},signal:{kind:'whistle',coachId:'coach',duration:.2}}
 ]};
const original=structuredClone(source);
assert.equal(drawnDecisionAt(source,1,'decision').id,'decision');
assert.equal(drawnDecisionAt(source,0),null);
const result=convertDrawnDecision(source,1,'decision');
const d=result.drill,views=outcomeViews(d);
assert.deepEqual(source,original,'Conversion must not edit original until user confirms');
assert.equal(result.midStep,true);
assert.ok(result.forkTime>0&&result.forkTime<2,'Decision needs to pause WITHIN the movement');
assert.equal(d.frames[1].signal.duration,.2,'Shared whistle must survive');
assert.equal(d.frames[2].signal,undefined,'Whistle must not sound twice after branching');
assert.equal(views.length,2);
assert.equal(d.branching.markerId,'decision','Reuse original diamond, not a duplicate');
assert.equal(d.frames[1].objects.filter(o=>o.type==='decision').length,1);
assert.equal(views[0].drill.frames[2].objects.filter(o=>o.type==='decision').length,0);
assert.equal(d.frames[1].objects.find(o=>o.type==='decision').decision.options[0].points.length,0,'Old visual arrows must not overlay actual movements');
assert.ok(d.frames[1].objects.find(o=>o.id==='d1').y>150&&d.frames[1].objects.find(o=>o.id==='d1').y<200,'Defenders must be paused mid-step');
const a=views[0].drill.frames[2],b=views[1].drill.frames[2];
assert.equal(a.objects.find(o=>o.id==='coach').y,100,'Run alternative follows drawn endpoint');
assert.equal(b.objects.find(o=>o.id==='ball').ownerId,'runner','Pass alternative transfers real ball possession');
assert.equal(b.objects.find(o=>o.id==='ball').transferKind,'pass');
assert.equal(a.objects.find(o=>o.id==='ball').ownerId,'coach');
assert.ok(Math.abs(a.objects.find(o=>o.id==='ball').y-a.objects.find(o=>o.id==='coach').y)<25,'Ball must follow the carrier through option A');
assert.equal(result.warnings.length,0);
assert.ok(branchInfo(d));
chooseOutcome(d,'b');assert.equal(d.frames[2].objects.find(o=>o.id==='ball').ownerId,'runner');
chooseOutcome(d,'a');assert.equal(d.frames[2].objects.find(o=>o.id==='ball').ownerId,'coach');
const safe=playbackData(d);
assert.equal(safe.branching.choices.length,2);
assert.equal(safe.frames[1].signal.duration,.2);
assert.match(renderScene(outcomeViews(safe)[0].drill,{time:result.forkTime+.2,runs:true,passes:true}).svg,/<svg/);
assert.match(printMarkup(safe),/Carry or pass\?/);
const noActor=structuredClone(source);noActor.frames[1].objects.at(-1).decision.playerId='';
assert.throws(()=>convertDrawnDecision(noActor,1,'decision'),/Choose the player making the decision/);
const tooMany=structuredClone(source);tooMany.frames[1].objects.at(-1).decision.options.push({label:'C',kind:'run',points:[]});
assert.throws(()=>convertDrawnDecision(tooMany,1,'decision'),/exactly two options/);
const forward=structuredClone(source);forward.frames[1].objects.find(o=>o.id==='runner').y=260;
forward.frames[1].objects.at(-1).decision.options[1].points=[{x:589,y:260}];
const notForward=convertDrawnDecision(forward,1,'decision');
assert.match(notForward.warnings.join(' '),/forward/i,'Do not silently turn a drawn forward arrow into a rugby pass');
assert.equal(outcomeViews(notForward.drill)[1].drill.frames[2].objects.find(o=>o.id==='ball').ownerId,'coach');
const app=read('js/app.js');
assert.match(app,/dpMakePlayable/,'Decision inspector must include an obvious conversion button');
assert.match(app,/convertDrawnDecision\(drill,fork,markerId/);
assert.match(app,/Drawing only — not an animated choice/);
assert.match(app,/Playing the linear drill/,'Do not promise a pause for annotation-only diamonds');
for(const path of ['index.html','coach/index.html']){
 const page=read(path);
 assert.match(page,/id="outcomeDialogHint"/);
 assert.match(page,/app\.js\?v=0\.(14|15)\.\d+/);
}
console.log('Rugby decision conversion: linked mid-run pause, preserved shared whistle, A run, B backwards pass, independent timelines, original drill preservation and guided editor — passed.');
