import test from 'node:test';
import assert from 'node:assert/strict';
import {symbolFactors,visualUnit,symbolLabelSize} from '../js/symbol-scale.js';

const large={scale:6,fieldContext:{mode:'field'}};
test('realistic preserves actual metre-based scaling',()=>{
 const factors=symbolFactors({type:'attacker'},{...large,displayMode:'realistic'});
 assert.ok(factors[0]<.2);
 assert.equal(factors[0],factors[1]);
});
test('full-field coaching view uses a modest symbol floor',()=>{
 const geometry={...large,displayMode:'coaching'};
 const player=symbolFactors({type:'attacker'},geometry);
 const cone=symbolFactors({type:'cone'},geometry);
 const ball=symbolFactors({type:'ball'},geometry);
 assert.deepEqual(player,[.29,.29]);
 assert.deepEqual(cone,[.17,.17]);
 assert.deepEqual(ball,[.18,.18]);
 assert.ok(player[0]>cone[0]);
 assert.ok(player[0]<.4,'Oversized players would obscure the training pitch');
 assert.equal(visualUnit(geometry),.29);
 assert.equal(symbolLabelSize(geometry),10);
});
test('training-only pitch keeps existing coaching size and label',()=>{
 const g={scale:6,displayMode:'coaching'};
 assert.deepEqual(symbolFactors({type:'attacker'},g),[.8,.8]);
 assert.equal(symbolLabelSize(g),13);
});
test('display scale never mutates saved drill objects',()=>{
 const object={type:'attacker',id:'D1',x:510,y:240,rot:90};
 const snapshot=structuredClone(object);
 symbolFactors(object,{...large,displayMode:'realistic'});
 symbolFactors(object,{...large,displayMode:'coaching'});
 assert.deepEqual(object,snapshot);
});
