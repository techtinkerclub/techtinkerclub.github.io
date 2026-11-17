import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {advance,roles,cleanBreakdowns,setParticipants} from '../js/breakdown.js';
import {isGroundPad,linkRuckPlayersInPlace,placeRuckPlayersAtPad,nudgeRuckPlayer} from '../js/ruck-practice.js';
import {orderObjects} from '../js/draw-order.js';
import {playbackData} from '../js/scene.js';

const g={margin:44,fw:700,fh:500,scale:50,rotation:0,toView:(x,y)=>({x,y}),fromView:(x,y)=>({x,y})};
function frame(type){
 const pad={id:'pad',type,x:450,y:270,rot:0};
 if(type==='donut')pad.donutState='down';
 return {name:'Set up',seconds:0,notes:'',timing:{},paths:{},objects:[
  pad,
  {id:'ruck',type:'ruck',label:'Pad ready',x:450,y:270,rot:0,breakdown:{mode:'pad',phase:'pad',padId:'pad',arrivalSide:'attack'}},
  {id:'A',type:'attacker',label:'A1',x:430,y:360,rot:0},
  {id:'D',type:'defender',label:'D1',x:470,y:170,rot:180},
  {id:'ball-aside',type:'ball',label:'',x:650,y:110,rot:0,groundState:'grounded'}
 ]};
}
for(const type of ['sausage','donut']){
 let f=frame(type),ruck=f.objects[1],initial=structuredClone(f.objects),ball=structuredClone(f.objects[4]);
 assert(isGroundPad(f.objects[0]));
 assert.equal(roles(f,ruck).ballId,null,'Never infer an unrelated free ball');
 for(const [phase,ids] of [['support',['A']],['ruck',['A','D']],['contest',['A','D']],['secured',['A','D']]]){
  const result=advance(f,ruck,g,phase,ids,true,'attack');
  assert.equal(result.ok,true,result.message);
  for(let i=0;i<f.objects.length;i++){
   assert.equal(f.objects[i].x,initial[i].x,phase+' must not move '+f.objects[i].id);
   assert.equal(f.objects[i].y,initial[i].y,phase+' must not move '+f.objects[i].id);
  }
 }
 assert.deepEqual(f.objects[4],ball,'Ball placed aside remains untouched');
 assert(!f.objects.some(o=>o.type==='tackle'),'No tackle marker should be inferred');
 assert.equal(orderObjects(f.objects)[0].id,'pad','Ground equipment appears behind players');
 f=frame(type);ruck=f.objects[1];
 const snapshot=structuredClone(f.objects);
 const link=linkRuckPlayersInPlace(f,ruck,['A','D'],true);
 assert(link.ok,link.message);
 assert.equal(ruck.members.length,2);
 assert.deepEqual(f.objects.map(o=>[o.x,o.y]),snapshot.map(o=>[o.x,o.y]),'Link preserves positions');
 assert(nudgeRuckPlayer(f,ruck,'A',g,0,-1),'Nudge linked participant');
 assert.equal(f.objects[3].y,snapshot[3].y);
 assert.equal(f.objects[0].y,snapshot[0].y);
 assert.equal(f.objects[4].y,snapshot[4].y);
 const place=placeRuckPlayersAtPad(f,ruck,['A','D'],g,true);
 assert(place.ok,place.message);
 assert.equal(f.objects[4].x,snapshot[4].x);
 assert.equal(f.objects[4].y,snapshot[4].y);
 const readOnly=playbackData({version:1,title:'Pad ruck',ageMin:10,ageMax:10,length:15,width:10,frames:[frame(type)]});
 assert.equal(readOnly.frames[0].objects.find(o=>o.id==='ruck').breakdown.padId,'pad');
}
assert.equal(isGroundPad({type:'donut',donutState:'rolling'}),false);
const editor=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
for(const required of ['linkRuckPlayersInPlace','placeRuckPlayersAtPad','nudgeRuckPlayer','isGroundPad','ruckPadChoice']){
 assert(editor.includes(required),'Missing editor control '+required);
}
console.log('Pad/flat donut ruck: ball aside, no surprise rearrangements, link, place, nudge and export passed.');
