import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {arrangeContact,PLAYER_POSES,posesFor} from '../js/contact.js';
import {pitchGeometry} from '../js/pitch.js';
import {playbackData,renderScene} from '../js/scene.js';
import {nextPhase} from '../js/breakdown.js';
import {blank} from '../js/model.js';

const build=(outcome)=>{
 const d=blank();d.ageMin=10;d.ageMax=10;d.title=outcome==='held'?'Upright hold':'Ground tackle';
 const players=[
  {id:'a',type:'attacker',label:'A1',x:420,y:285,rot:0},
  {id:'d',type:'defender',label:'D1',x:444,y:263,rot:180},
  {id:'ball',type:'ball',label:'',x:420,y:285,rot:0,ownerId:'a'}
 ];
 d.frames[0].objects=structuredClone(players);
 const marker={id:'contact',type:'tackle',label:'Contact',x:435,y:275,rot:0,members:[]};
 if(outcome==='held')marker.contactOutcome='held';
 const fr={name:'Contact',seconds:2,notes:'',objects:[...structuredClone(players),marker],timing:{},paths:{}};
 const result=arrangeContact(fr,marker,pitchGeometry(20,15),d.frames[0],['a','d'],true);
 assert.equal(result.ok,true,result.message);
 d.frames.push(fr);
 return {d,marker,fr};
};
const held=build('held');
assert.equal(held.marker.contactOutcome,'held');
assert.equal(held.marker.breakdown,undefined,'Upright hold must not manufacture a grounded tackle breakdown');
assert.equal(held.marker.members.find(m=>m.id==='a').pose,'held','Ball carrier stays on feet');
assert.notEqual(held.marker.members.find(m=>m.id==='a').pose,'grounded');
assert.equal(posesFor(held.fr.objects).get('a'),'held');
assert.ok(PLAYER_POSES.held);
const saved=playbackData(held.d);
assert.equal(saved.frames[1].objects.find(o=>o.id==='contact').contactOutcome,'held','Outcome survives save and publication');
assert.equal(saved.frames[1].objects.find(o=>o.id==='contact').breakdown,undefined);
const svg=renderScene(saved,{index:1}).svg;
assert.match(svg,/Held upright/,'Presentation shows upright hold label');
const ground=build('ground');
assert.equal(ground.marker.contactOutcome,undefined);
assert.equal(ground.marker.members.find(m=>m.id==='a').pose,'grounded','Traditional tackle must ground the carrier');
assert.equal(ground.marker.breakdown.phase,'tackle','Ground tackle must remain linked to the breakdown system');
assert.equal(nextPhase(ground.marker.breakdown.phase),'release');
assert.equal(nextPhase('release'),'support');
assert.equal(nextPhase('support'),'ruck');
assert.equal(playbackData(ground.d).frames[1].objects.find(o=>o.id==='contact').breakdown.phase,'tackle');
const app=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/id="tackleOutcome"/,'Contact outcome selector must exist');
assert.match(html,/Held upright/);
assert.match(app,/arrangeSelectedContact\(choice,outcome\)/,'Chooser must pass the selected contact outcome');
assert.match(app,/marker\.contactOutcome='held'/);
