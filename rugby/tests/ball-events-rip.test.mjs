import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {blank} from '../js/model.js';
import {ballMovement} from '../js/possession.js';
import {playbackData,renderScene} from '../js/scene.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const base=blank();
base.title='Rip and secure';
base.ageMin=10;base.ageMax=10;
const before=[
 {id:'a',type:'attacker',label:'A1',x:310,y:260,rot:0,playerPose:'grounded'},
 {id:'support',type:'attacker',label:'A2',x:328,y:265,rot:0},
 {id:'d',type:'defender',label:'D1',x:380,y:270,rot:180},
 {id:'ball',type:'ball',label:'',x:312,y:260,rot:0,ownerId:'a'}
];
base.frames[0].objects=structuredClone(before);
const after=structuredClone(before),ball=after.find(o=>o.id==='ball');
ball.ownerId='support';ball.transferKind='rip';ball.ripLabel='Support player strips and passes';
base.frames.push({name:'Rip from grounded carrier',seconds:2,notes:'Rip and move the ball away',objects:after,timing:{ball:{start:69,end:70}},paths:{}});
const g={toView:(x,y)=>({x,y}),fromView:(x,y)=>({x,y}),scale:30,rotation:0};
const m=ballMovement(base.frames[0],base.frames[1],ball,g);
assert.equal(m.instant,true,'A rip must not travel as a thrown ball');
assert.equal(m.pass,false,'A rip must never be mislabelled a pass');
const safe=playbackData(base);
assert.equal(safe.frames[1].objects.find(o=>o.id==='ball').transferKind,'rip');
assert.equal(safe.frames[1].objects.find(o=>o.id==='ball').ripLabel,'Support player strips and passes');
const svg=renderScene(safe,{index:1}).svg;
assert.match(svg,/Support player strips and passes/,'Rip cue should appear on the presentation');
assert.doesNotMatch(svg,/stroke-dasharray="7 6"/,'Rip must not create the pass trajectory');

const released=structuredClone(before);
const free=released.find(o=>o.id==='ball');delete free.ownerId;free.transferKind='drop';
const drop=ballMovement({objects:before},{objects:released,timing:{ball:{start:84,end:85}}},free,g);
assert.equal(drop.drop,true);assert.equal(drop.pass,false);assert.equal(drop.instant,true);
const picked=structuredClone(released);
const collected=picked.find(o=>o.id==='ball');collected.ownerId='d';collected.transferKind='pickup';
const pickup=ballMovement({objects:released},{objects:picked,timing:{ball:{start:54,end:55}}},collected,g);
assert.equal(pickup.pickup,true);assert.equal(pickup.pass,false);assert.equal(pickup.instant,true);
const app=read('js/app.js'),html=read('index.html'),css=read('assets/workspace.css');
assert.match(html,/id="ripDialog"/);
assert.match(html,/value="rip-ball"/);
assert.match(html,/id="contactParticipants"/,'Contacts must support selecting players in the chooser');
assert.match(app,/function openRipDialog\(/);
assert.match(app,/age===9&&from\.type!==to\.type/,'U9 ripping by opponents is not allowed');
assert.match(app,/arrangeSelectedContact\(choice,outcome\)/,'Contact chooser sends selected participants and tackle outcome');
assert.match(app,/ball\.transferKind='rip'/);
assert.match(app,/retimeBallEvent/,'Timed possession events can be edited');
assert.match(app,/data-rip-label/,'Rip label remains editable');
assert.match(app,/undoBallEvent/,'Rip and possession events are removable');
assert.match(css,/\.action-participants/);

assert.match(html,/id="pickupDialog"/,'Loose-ball pickup needs a recipient and timing dialog');
assert.match(app,/function openPickupDialog\(/);
assert.match(app,/choice==='pickup-ball'\)\{openPickupDialog\(\)/,'Contextual pickup should open the pickup chooser');
assert.match(app,/ballPickKind='pass';\s*finishBallPick\(player\.id\)/,'Pickup should use the existing non-pass pickup transition');
assert.match(app,/option\.value==='ruck'/,'Unavailable contact actions should explain loose-ball requirement');
assert.match(app,/function arrangeSelectedContact/,'Contact formation reuse remains intact');
