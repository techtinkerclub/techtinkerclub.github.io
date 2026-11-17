import assert from 'node:assert/strict';
import {COACHING_MAGNIFICATION,normalScaleMode,physicalUnit,visualUnit,symbolFactors,symbolTransform,symbolRadius} from '../js/symbol-scale.js';
import {pitchGeometry,trainingField} from '../js/pitch.js';

const g=pitchGeometry(10,8);
const real={...g,displayMode:'realistic'},coach={...g,displayMode:'coaching'};
const approx=(value,expected,tolerance=1e-8)=>assert.ok(Math.abs(value-expected)<=tolerance, `${value} !== ${expected}`);
assert.equal(COACHING_MAGNIFICATION,1.3);
assert.equal(normalScaleMode('unexpected'),'realistic');

// A 10 × 8 metre pitch exposes the original bug: the cone changed size but
// players and the donut stayed exactly the same.
const types=['attacker','defender','neutral','coach','shield','bagplayer','ball','cone','flag','shieldItem','bag','sausage','ladder','donut','tackle','ruck','maul','scrum'];
for(const type of types)for(const pose of type==='donut'?['ready','impact','down']:[undefined]){
 const o={id:type,type,x:250,y:250,...(pose?{donutState:pose}:{})};
 const before=JSON.stringify(o),r=symbolFactors(o,real),c=symbolFactors(o,coach);
 assert.ok(c[0]>r[0]&&c[1]>r[1], `${type} (${pose||'default'}) did not grow in coaching view`);
 assert.ok(c[0]>=r[0]*1.3-1e-9&&c[1]>=r[1]*1.3-1e-9, `${type} did not receive a uniform enlargement`);
 assert.equal(JSON.stringify(o),before,'Scaling must not change drill data');
 assert.ok(symbolRadius(o,coach)>symbolRadius(o,real), `${type} selection radius stayed unchanged`);
 assert.notEqual(symbolTransform(o,real),symbolTransform(o,coach));
}

// Realistic mode continues to use verified nominal top-view dimensions.
const cone=symbolFactors({type:'cone'},real);
approx(22*cone[0]/g.scale,0.20);
const player=symbolFactors({type:'attacker'},real);
approx(30*player[0]/g.scale,0.45);
const donutDown=symbolFactors({type:'donut',donutState:'down'},real);
approx(46*donutDown[0]/g.scale,0.75);
const donutUp=symbolFactors({type:'donut',donutState:'ready'},real);
approx(20*donutUp[0]/g.scale,0.30);
approx(physicalUnit(real),physicalUnit(coach));
approx(visualUnit(coach)/visualUnit(real),1.3);

// Nonphysical annotations are not stretched or moved.
for(const type of ['label','decision']){
 assert.deepEqual(symbolFactors({type},real),[1,1]);
 assert.deepEqual(symbolFactors({type},coach),[1,1]);
}
assert.deepEqual(real.toView(120,400),coach.toView(120,400));

// Pitch boundary equipment uses the same factors as added equipment.
for(const type of ['cones','flags']){
 const element=type==='cones'?'cone':'flag';
 for(const view of [real,coach]){
  const [x,y]=symbolFactors({type:element},view);
  const svg=trainingField(view,false,.5,{boundary:type,showAttack:false});
  const needle=`scale(${x} ${y})`;
  assert.equal(svg.split(needle).length-1,4, `Four ${type} corner markers must scale with view mode`);
 }
}

// Legibility floor applies on larger training areas; never shrink physical
// objects when switching to coaching view.
const wide={...pitchGeometry(60,40),displayMode:'coaching'};
for(const type of ['attacker','cone','donut','bag']){
 const c=symbolFactors({type,donutState:'ready'},wide);
 assert.ok(c.every(value=>value>=0.8), `Missing visibility floor for ${type}`);
}
console.log('Rugby symbol scale: player, donut, 15 equipment/marker types, dimensions, corner equipment, labels and non-mutating mode changes passed.');
