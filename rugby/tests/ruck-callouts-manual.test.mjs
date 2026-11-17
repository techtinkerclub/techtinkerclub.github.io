import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {contestResultOverlay,clearContestOutcome} from '../js/ruck-outcome.js';
import {prepareRuckPlayAway,nextPlayPlayers} from '../js/ruck-next-action.js';
import {cleanBreakdowns} from '../js/breakdown.js';
import {playbackData} from '../js/scene.js';

const g={margin:44,scale:70,fw:560,fh:700,rotation:0,
 toView:(x,y)=>({x:44+(x-42)/816*560,y:44+(y-37)/466*700}),
 fromView:(x,y)=>({x:42+(x-44)/560*816,y:37+(y-44)/700*466})};
const fixture=()=>({name:'Contest over the pad',seconds:3,notes:'',timing:{},paths:{},objects:[
 {id:'pad',type:'sausage',x:450,y:270,rot:0},
 {id:'ruck',type:'ruck',label:'Contest',x:450,y:270,rot:0,
  members:[{id:'A1',pose:'bound'},{id:'D1',pose:'standing'}],
  breakdown:{mode:'pad',phase:'contest',padId:'pad',winner:'attack',clearanceCm:50}},
 {id:'A1',type:'attacker',label:'A1',x:450,y:260,rot:180},
 {id:'D1',type:'defender',label:'D1',x:450,y:300,rot:0},
 {id:'A2',type:'attacker',label:'A2',x:500,y:180,rot:180},
 {id:'A3',type:'attacker',label:'A3',x:480,y:220,rot:180},
 {id:'D2',type:'defender',label:'D2',x:500,y:330,rot:0},
 {id:'ball',type:'ball',x:502,y:270,rot:0}
]});
const f=fixture(),marker=f.objects[1];
assert.equal(contestResultOverlay(f,f.objects,g,1),'',
 'Old winning drills must not display any guessed coaching annotation');
marker.breakdown.showWinnerLabel=true;
assert.match(contestResultOverlay(f,f.objects,g,1),/ATTACK SECURES/);
assert.doesNotMatch(contestResultOverlay(f,f.objects,g,1),/NEXT/);
delete marker.breakdown.showWinnerLabel;
marker.breakdown.nextPlayerId='A2';marker.breakdown.showNextPlayerLabel=true;
assert.match(contestResultOverlay(f,f.objects,g,1),/A2 NEXT/);
assert.doesNotMatch(contestResultOverlay(f,f.objects,g,1),/A3 NEXT/);
marker.breakdown.nextPlayerId='D2';
assert.equal(contestResultOverlay(f,f.objects,g,1),'','Do not show a player from losing team');
marker.breakdown.nextPlayerId='A2';
cleanBreakdowns([f]);
assert.equal(marker.breakdown.nextPlayerId,'A2');
assert.equal(marker.breakdown.showNextPlayerLabel,true);
assert.deepEqual(nextPlayPlayers(f,marker).map(o=>o.id),['A2','A3']);
const published=playbackData({version:1,title:'Ruck next action',ageMin:10,ageMax:10,length:15,width:10,frames:[fixture(),f]});
assert.equal(published.frames[1].objects.find(o=>o.id==='ruck').breakdown.nextPlayerId,'A2');
assert.equal(published.frames[1].objects.find(o=>o.id==='ruck').breakdown.showNextPlayerLabel,true);
const snapshot=JSON.stringify(f);
const chosen=prepareRuckPlayAway(f,marker.id,'A2','ball',g);
assert(chosen.ok,chosen.message);
assert.equal(JSON.stringify(f),snapshot,'Creating a follow-up must not edit the saved source step');
assert.equal(chosen.frame.objects.find(o=>o.id==='ball').ownerId,'A2');
assert.equal(chosen.frame.objects.find(o=>o.id==='A3').x,480);
assert.equal(contestResultOverlay(chosen.frame,chosen.frame.objects,g,1),'',
 'New step must not inherit coaching captions');
assert.equal(chosen.frame.name,'A2 plays ball away');
assert.equal(prepareRuckPlayAway(f,marker.id,'D2','ball',g).ok,false);
assert.equal(prepareRuckPlayAway(f,marker.id,'A1','ball',g).ok,false);
const cleaned=structuredClone(f);
const result=clearContestOutcome(cleaned,fixture(),cleaned.objects[1]);
assert(result.ok,result.message);
assert.equal(cleaned.objects[1].breakdown.winner,undefined);
assert.equal(cleaned.objects[1].breakdown.showNextPlayerLabel,undefined);
const old=fixture();old.objects[1].breakdown.phase='secured';
assert.equal(contestResultOverlay(old,old.objects,g,1),'',
 'Saved winning side in later stages is not an implicit caption');
const app=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
assert.match(app,/showRuckNextLabel/);
assert.match(app,/clearRuckCallouts/);
assert.match(app,/prepareRuckPlayAway/);
assert.match(app,/delete marker.breakdown.nextPlayerId/);
const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(page,/ANIMATED LIBRARY 0\.14\.\d+/);
console.log('Manual captions: hidden by default, explicit next-player only, no guessed A3, clean export, separate ball-play step, no source mutation.');
