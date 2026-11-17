import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {advance,cleanBreakdowns,nextPhase,setParticipants} from '../js/breakdown.js';
import {arrangeContact} from '../js/contact.js';
import {playbackData} from '../js/scene.js';

const g={rotation:0,margin:0,fw:1000,fh:1000,scale:50,toView:(x,y)=>({x,y}),fromView:(x,y)=>({x,y})};
function fixture(){
 return {objects:[
  {id:'pad',type:'sausage',x:500,y:500,rot:0},
  {id:'ruck',type:'ruck',label:'Sausage ready · ruck practice',x:500,y:500,rot:0,breakdown:{phase:'pad',mode:'pad',padId:'pad',arrivalSide:'attack'}},
  {id:'A1',type:'attacker',x:450,y:690,rot:0},
  {id:'D1',type:'defender',x:550,y:320,rot:180}
 ],timing:{},paths:{}};
}
assert.equal(nextPhase('pad'),'support');
assert.equal(nextPhase('tackle'),'release'); // Existing tackle sequence is unchanged.
for(const firstSide of ['attack','defence']){
 const f=fixture(),m=f.objects[1],first=firstSide==='attack'?'A1':'D1';
 cleanBreakdowns([f]);
 assert.equal(m.breakdown.mode,'pad');
 assert.equal(m.breakdown.padId,'pad');
 assert.equal(advance(f,m,g,'support',[first],true,firstSide).ok,true);
 assert.deepEqual(m.members.map(x=>x.id),[first]);
 assert(m.members.every(x=>x.pose!=='tackling'&&x.pose!=='grounded'));
 assert.equal(advance(f,m,g,'ruck',['A1','D1'],true,firstSide).ok,true);
 assert.deepEqual(new Set(m.members.map(x=>x.id)),new Set(['A1','D1']));
 assert(m.members.every(x=>x.pose==='bound'));
 assert.equal(advance(f,m,g,'contest',['A1','D1'],true,firstSide).ok,true);
 assert.equal(advance(f,m,g,'secured',['A1','D1'],true,firstSide).ok,true);
 assert.match(m.label,/Clearout complete/);
 assert.equal(f.objects.some(x=>x.type==='ball'||x.type==='tackle'),false);
 assert.equal(f.objects[0].x,500);assert.equal(f.objects[0].y,500);
}
const direct=fixture();
assert.equal(arrangeContact(direct,direct.objects[1],g,null,['A1','D1'],true).ok,true);
assert.equal(direct.objects[1].breakdown.phase,'ruck');
const overloaded=fixture();
overloaded.objects.push({id:'A2',type:'attacker',x:470,y:680,rot:0});
overloaded.objects[1].breakdown.phase='ruck';
assert.equal(setParticipants(overloaded,overloaded.objects[1],g,['A1','A2','D1'],true).ok,false);
const noPad=fixture();
noPad.objects.shift();
assert.match(advance(noPad,noPad.objects[0],g,'support',['A1'],true,'attack').message,/sausage bag/);
const readOnly=playbackData({version:1,title:'Ruck over sausage',ageMin:10,ageMax:10,category:'Contact',length:10,width:8,frames:[fixture()]});
assert.equal(readOnly.frames[0].objects.find(x=>x.id==='ruck').breakdown.mode,'pad');
assert.equal(readOnly.frames[0].objects.find(x=>x.id==='ruck').breakdown.padId,'pad');
const editor=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
assert.match(editor,/paletteTiles\(\['tackle','ruck'\]\)/);
assert.match(editor,/phase:'pad',mode:'pad',padId:pad.id/);
assert.match(editor,/\$\('startPadRuck'\)\.onclick/);
console.log('Pad ruck: attacker/defender first, no tackle or ball, U10 limit, manual arrangement, import/playback passed.');
