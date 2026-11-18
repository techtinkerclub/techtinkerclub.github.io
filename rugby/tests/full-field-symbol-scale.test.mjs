import test from 'node:test';
import assert from 'node:assert/strict';
import {symbolFactors,visualUnit} from '../js/symbol-scale.js';

const large={scale:6,fieldContext:{mode:'field'}};
test('realistic keeps physical metre scale even on a full-size pitch',()=>{
 const factors=symbolFactors({type:'attacker'},{...large,displayMode:'realistic'});
 assert.ok(factors[0]<.2);
 assert.equal(factors[0],factors[1]);
});
test('coaching makes players and all common equipment visible across full-field scenes',()=>{
 const geometry={...large,displayMode:'coaching'};
 for(const type of ['attacker','defender','coach','ball','cone','donut','shieldItem','sausage']){
  const factors=symbolFactors({type},geometry);
  assert.ok(factors.every(x=>x>=1.05),'Poor full-field visibility for '+type);
 }
 assert.ok(visualUnit(geometry)>=1.05);
});
test('a training-only pitch retains its original coaching minimum',()=>{
 const geometry={scale:6,displayMode:'coaching'};
 assert.deepEqual(symbolFactors({type:'attacker'},geometry),[.8,.8]);
});
test('changing symbol mode never alters saved positions or geometry',()=>{
 const object={type:'attacker',id:'D1',x:510,y:240,rot:90};
 const snapshot=structuredClone(object);
 symbolFactors(object,{...large,displayMode:'realistic'});
 symbolFactors(object,{...large,displayMode:'coaching'});
 assert.deepEqual(object,snapshot);
});
