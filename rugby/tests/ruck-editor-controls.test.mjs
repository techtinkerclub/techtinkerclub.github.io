import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clearContestOutcome,contestResultOverlay} from '../js/ruck-outcome.js';
import {contestDrive} from '../js/contest-motion.js';
import {cleanBreakdowns} from '../js/breakdown.js';
import {cleanContacts} from '../js/contact.js';
import {playbackData} from '../js/scene.js';

const copy=o=>structuredClone(o);
const g={scale:70,margin:44,fw:560,fh:700,rotation:0,
 toView:(x,y)=>({x:44+(x-42)/816*560,y:44+(y-37)/466*700}),
 fromView:(x,y)=>({x:42+(x-44)/560*816,y:37+(y-44)/700*466})};
const initial={
 name:'Ruck formed',seconds:1.5,timing:{},paths:{},objects:[
  {id:'pad',type:'sausage',x:450,y:270,rot:0},
  {id:'ruck',type:'ruck',x:450,y:270,rot:0,members:[{id:'a',pose:'bound'},{id:'d',pose:'bound'}],breakdown:{phase:'ruck',mode:'pad',padId:'pad'}},
  {id:'a',type:'attacker',x:455,y:270,rot:0,label:'A1'},
  {id:'d',type:'defender',x:435,y:278,rot:180,label:'D1'},
  {id:'shield',type:'shieldItem',ownerId:'d',x:435,y:262,rot:180},
  {id:'ball',type:'ball',x:500,y:235,rot:0}
 ]};
for(const winner of ['attack','defence']){
 const before=copy(initial),now=copy(initial),ruck=now.objects[1];
 ruck.breakdown.phase='contest';
 const result=contestDrive(now,before,ruck,g,{winner,distanceCm:10,exchanges:2,clearanceCm:50});
 assert(result.ok,result.message);
 ruck.breakdown.showWinnerLabel=true;
 assert(contestResultOverlay(now,now.objects,g,1).includes(winner==='attack'?'ATTACK SECURES':'DEFENCE SECURES'));
 ruck.breakdown.showWinnerLabel=false;
 assert.equal(contestResultOverlay(now,now.objects,g,1),'','Hide only the generated callouts');
 const persisted=playbackData({version:1,title:'Outcome controls',ageMin:10,ageMax:10,length:10,width:8,frames:[before,now]});
 assert.equal(persisted.frames[1].objects.find(o=>o.id==='ruck').breakdown.showWinnerLabel,false,
  'Callout visibility must survive export');
 const paths=JSON.stringify(now.paths);
 const cleared=clearContestOutcome(now,before,ruck);
 assert(cleared.ok,cleared.message);
 assert.equal(ruck.breakdown.winner,undefined);
 assert.equal(JSON.stringify(now.paths),paths,'Keep coach-authored movement');
 const loser=winner==='attack'?'d':'a',player=now.objects.find(o=>o.id===loser),previous=before.objects.find(o=>o.id===loser);
 assert.equal(ruck.members.find(m=>m.id===loser).pose,'bound');
 assert(Math.abs(player.x-previous.x-(ruck.x-before.objects[1].x))<1e-7);
 assert(Math.abs(player.y-previous.y-(ruck.y-before.objects[1].y))<1e-7);
 assert.equal(now.objects.find(o=>o.id==='ball').x,before.objects.find(o=>o.id==='ball').x);
}
const frame=copy(initial);
frame.objects[1].members[0].pose='ready';
cleanContacts([frame]);
assert.equal(frame.objects[1].members[0].pose,'ready','Explicit stance must survive cleanContacts');
const app=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
assert.match(app,/member\.pose=e\.target\.value/);
assert.match(app,/releaseFormationPlayer/);
assert.match(app,/hidePlayerNameAll/);
assert.match(app,/clearContestOutcome\(f\(\),drill\.frames\[idx-1\],marker\)/);
const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(page,/ANIMATED LIBRARY 0\.12\.33/);
assert.match(page,/id="showContestLabel"/);
assert.match(page,/id="clearContestResult"/);
console.log('Editable formation poses, hide winner caption, clear outcome and restore loser, preserve path, exported state: passed.');
