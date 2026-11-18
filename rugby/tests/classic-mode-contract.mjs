// Classic mode is the source of truth. Run with:
//   node --test rugby/tests/classic-mode-contract.mjs
// Minion Mode may replace ARTWORK only; this test intentionally fails if a
// cartoon release changes the normal, data-derived Classic player appearance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {posedShape, PLAYER_POSES} from '../js/contact.js';
import {symbolFactors} from '../js/symbol-scale.js';
import {classicPlayerAppearance} from '../js/classic-player-appearance.js';
import {playerAppearance} from '../js/cartoon-players.js';

const player={id:'p1',type:'attacker',label:'A1',x:420,y:260,rot:0};
const defender={id:'d1',type:'defender',label:'D1',x:420,y:205,rot:180};
const g={scale:70,rotation:0,displayMode:'realistic',
 toView:(x,y)=>({x,y}),fromView:(x,y)=>({x,y})};
const frame={objects:[player,defender],seconds:2,timing:{},paths:{}};
const source='<circle r="15" fill="#75c9ff"/><path d="M-5 -12 L0 -19 L5 -12 Z" fill="#f7fff6"/>';
const clone=x=>JSON.parse(JSON.stringify(x));

test('All nine user-selectable Classic stances remain available',()=>{
 assert.deepEqual(Object.keys(PLAYER_POSES).sort(),
 ['bound','crouched','grounded','held','kneeling','ready','recovering','standing','tackling'].sort());
});

test('Classic output is unchanged by wrapping it in the Minion appearance dispatcher',()=>{
 const saved=clone(frame);
 for(const pose of Object.keys(PLAYER_POSES)){
  const original=posedShape(player,pose,source,'#75c9ff');
  const classic=classicPlayerAppearance(player,pose,original,frame.objects,g,null,frame,1);
  const dispatched=playerAppearance(player,pose,original,frame.objects,g,null,frame,1,{cartoonMode:false});
  assert.equal(dispatched,classic,'Classic appearance changed for '+pose);
 }
 assert.deepEqual(frame,saved,'Appearance functions must not mutate the drill');
});

test('Classic contact silhouettes and player sizing stay recognisable',()=>{
 const grounded=posedShape(player,'grounded',source,'#75c9ff');
 const tackling=posedShape(defender,'tackling',source,'#f6b56d');
 assert.match(grounded,/<rect x="-12" y="-23" width="24" height="46"/);
 assert.match(tackling,/<ellipse rx="12" ry="20"/);
 const [x,y]=symbolFactors(player,g,'grounded');
 assert.ok(Math.abs(x-70*.40/24)<1e-9);
 assert.ok(Math.abs(y-70*1.10/46)<1e-9);
 const [sx,sy]=symbolFactors(player,g,'standing');
 assert.ok(Math.abs(sx-70*.45/30)<1e-9);
 assert.equal(sx,sy);
});

test('Published QA fixtures use Classic editor fields, not Minion-only instructions',async()=>{
 const file=fileURLToPath(new URL('../data/test-drills.json',import.meta.url));
 const pack=JSON.parse(await readFile(file,'utf8'));
 assert.equal(pack.kind,'rugby-visual-qa');
 const contactPhases=new Set(['pad','tackle','release','support','ruck','contest','secured']);
 const typeSet=new Set(['attacker','defender','neutral','coach','shield','bagplayer',
 'ball','shieldItem','cone','flag','bag','sausage','donut','tackle','ruck',
 'maul','scrum','decision','label','ladder','hurdle','hoop','slalomPole',
 'markerDisc','offsideLine','fieldLine','directionArrow','measureLine',
 'zoneCircle','zoneRect','spotMarker']);
 for(const drill of pack.drills){
  assert.equal(drill.category,'Test drills');
  assert.ok(drill.frames.length>=2);
  for(const fr of drill.frames){
   for(const o of fr.objects){
    assert.ok(typeSet.has(o.type),'Unsupported object '+o.type+' in '+drill.id);
    assert.ok(!Object.hasOwn(o,'coachGesture'),
      'QA fixture must not depend on Minion-only coach art: '+drill.id);
    if(o.playerPose)assert.ok(Object.hasOwn(PLAYER_POSES,o.playerPose));
    if(o.breakdown){
     assert.ok(['tackle','ruck'].includes(o.type),'Invalid breakdown marker '+o.type);
     assert.ok(contactPhases.has(o.breakdown.phase),'Invalid phase '+o.breakdown.phase);
    }
   }
  }
 }
});
