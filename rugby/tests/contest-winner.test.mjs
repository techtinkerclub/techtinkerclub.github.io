import assert from 'node:assert/strict';
import {contestDrive} from '../js/contest-motion.js';
import {transitionObjects,shieldPose} from '../js/possession.js';
import {playbackData,renderScene} from '../js/scene.js';
import {contestWinner,contestResultOverlay} from '../js/ruck-outcome.js';
import {pitchGeometry} from '../js/pitch.js';

const g=pitchGeometry(10,8,'up');
const copy=x=>JSON.parse(JSON.stringify(x));
const screen=o=>g.toView(o.x,o.y);
const gap=(a,b)=>Math.hypot(screen(a).x-screen(b).x,screen(a).y-screen(b).y);
function initial(){
 return {name:'Ruck formed',seconds:0,notes:'',paths:{},timing:{},objects:[
  {id:'pad',type:'sausage',x:450,y:270,rot:0},
  {id:'ruck',type:'ruck',x:450,y:270,rot:0,breakdown:{mode:'pad',phase:'ruck',padId:'pad'},members:[{id:'a',pose:'bound'},{id:'d',pose:'bound'}]},
  {id:'a',type:'attacker',label:'A1',x:450,y:291,rot:0},
  {id:'d',type:'defender',label:'D1',x:450,y:249,rot:180},
  {id:'shield',type:'shieldItem',x:450,y:249,rot:180,ownerId:'d'},
  {id:'ball-aside',type:'ball',x:700,y:100,rot:0},
  {id:'a2',type:'attacker',label:'A2',x:450,y:130,rot:0},
  {id:'d2',type:'defender',label:'D2',x:450,y:410,rot:180}
 ]};
}
for(const winner of ['attack','defence']){
 const before=initial(),current=copy(before);
 current.name='Contest';
 current.objects[1].breakdown.phase='contest';
 const response=contestDrive(current,before,current.objects[1],g,{distanceCm:10,exchanges:2,winner,clearanceCm:50});
 assert(response.ok,response.message);
 current.objects[1].breakdown.showWinnerLabel=true; // Explicit annotation: automatic captions are off by default.
 const pad=before.objects[0],other=winner==='attack'?'d':'a',winning=winner==='attack'?'a':'d';
 const loss=current.objects.find(o=>o.id===other),win=current.objects.find(o=>o.id===winning);
 assert(gap(loss,pad)>gap(win,pad)+20,'Winner must hold pad while loser steps clear');
 assert.equal(current.objects[1].members.find(m=>m.id===other).pose,'standing');
 assert.equal(current.objects[1].members.find(m=>m.id===winning).pose,'bound');
 assert.deepEqual(current.objects[0],before.objects[0],'Grounded pad stays in place');
 assert.deepEqual(current.objects[5],before.objects[5],'Separate ball stays in place');
 assert.deepEqual(current.objects[6],before.objects[6],'A2 waits');
 assert.deepEqual(current.objects[7],before.objects[7],'D2 waits');
 assert.equal(contestWinner(current.objects[1]),winner);
 for(let i=0;i<=40;i++){
  const p=i/40,state=transitionObjects(before,current,p,g);
  const D=state.find(o=>o.id==='d'),shield=state.find(o=>o.id==='shield');
  assert(gap(shield,shieldPose(shield,D,g))<1e-6,'D1 shield detached at '+p);
  if(p<.82)assert(!contestResultOverlay(current,state,g,p),'Result announced before the contest finished');
 }
 const finished=transitionObjects(before,current,1,g);
 assert.match(contestResultOverlay(current,finished,g,1),new RegExp('data-contest-result="'+winner+'"'));
 const raw={version:1,title:'Win the contest and use it',ageMin:10,ageMax:10,length:10,width:8,frames:[before,current]};
 const shared=playbackData(raw),marker=shared.frames[1].objects.find(o=>o.id==='ruck');
 assert.equal(marker.breakdown.winner,winner,'Saved outcome must survive export sanitization');
 const image=renderScene(shared,{index:1,runs:false,passes:false});
 assert.match(image.svg,new RegExp('data-contest-result="'+winner+'"'),'Shared view missing winner');
}
console.log('Ruck win: loser yields, winner holds pad, shield attached, safety ball and waiting players unchanged, saved and shared.');
