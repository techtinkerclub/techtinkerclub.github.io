/* 99 Club Studio · Broken Calculator quality guard v1.53
 * - Verifies reachability using normal arithmetic precedence.
 * - No brackets are used in proofs.
 * - Challenge puzzles expose division as a working operation.
 */
(function(global){
'use strict';
const A=global.TT99ArithmeticGames;
if(!A||A.__brokenCalcQualityV153)return;

const baseGenerate=A.generate.bind(A),OPS=['+','-','×','÷'];
function difficultyOf(settings){const d=settings?.engineSettings?.brokencalc?.difficulty;return ['easy','standard','challenge'].includes(d)?d:'standard';}
function workingParts(puzzle){const keys=new Set(puzzle?.keys||[]);return {digits:[...keys].filter(k=>/^\d$/.test(k)).map(Number),ops:[...keys].filter(k=>OPS.includes(k))};}
function stateKey(sum,term){return `${Math.round(sum*1e8)/1e8}|${Math.round(term*1e8)/1e8}`;}
function finalValue(s){return s.sum+s.term;}
function appendState(s,op,b){
  if(op==='×')return {sum:s.sum,term:s.term*b};
  if(op==='÷')return b===0?null:{sum:s.sum,term:s.term/b};
  if(op==='+')return {sum:s.sum+s.term,term:b};
  if(op==='-')return {sum:s.sum+s.term,term:-b};
  return null;
}
function reachable(target,puzzle,{maxOperands=8,valueCap=5000,maxStates=30000}={}){
  target=Number(target);if(!Number.isFinite(target))return null;
  const {digits,ops}=workingParts(puzzle);if(!digits.length||!ops.length)return null;
  let layer=new Map();
  for(const d of digits){const s={sum:0,term:d,expr:String(d)};layer.set(stateKey(s.sum,s.term),s);if(Math.abs(d-target)<1e-9)return s.expr;}
  for(let used=2;used<=maxOperands;used++){
    const next=new Map();
    for(const s of layer.values()){
      for(const op of ops)for(const d of digits){
        const n=appendState(s,op,d);if(!n)continue;
        const value=finalValue(n);if(!Number.isFinite(value)||!Number.isFinite(n.sum)||!Number.isFinite(n.term))continue;
        if(Math.abs(n.sum)>valueCap||Math.abs(n.term)>valueCap||Math.abs(value)>valueCap)continue;
        const k=stateKey(n.sum,n.term);if(next.has(k))continue;
        n.expr=`${s.expr} ${op} ${d}`;next.set(k,n);
        if(Math.abs(value-target)<1e-9)return n.expr;
        if(next.size>=maxStates)break;
      }
      if(next.size>=maxStates)break;
    }
    layer=next;if(!layer.size)break;
  }
  return null;
}
function verify(puzzle){
  if(!puzzle||puzzle.engineId!=='brokencalc'||puzzle.error)return {ok:false,error:puzzle?.error||'Not a Broken Calculator puzzle'};
  const proofs=[];
  for(const t of puzzle.targets||[]){const expr=reachable(t.target,puzzle);if(!expr)return {ok:false,error:`Target ${t.target} is not reachable using normal order of operations and the visible working keys.`};proofs.push({target:Number(t.target),expression:expr,evaluation:'standard-precedence'});}
  return {ok:true,proofs};
}
function enhance(puzzle,settings){
  if(!puzzle||puzzle.engineId!=='brokencalc'||puzzle.error)return puzzle;
  const out=JSON.parse(JSON.stringify(puzzle));
  if(difficultyOf(settings)==='challenge'&&!out.keys.includes('÷')){const eqIndex=out.keys.indexOf('=');if(eqIndex>=0)out.keys.splice(eqIndex,0,'÷');else out.keys.push('÷');}
  out.keys=out.keys.filter(k=>k!=='('&&k!==')');
  const proof=verify(out);if(!proof.ok)return null;
  out.evaluationMode='standard-precedence';out.bracketsAllowed=false;
  out.brokenCalcQuality={version:'1.53',reachable:true,proofs:proof.proofs,divisionAvailable:out.keys.includes('÷'),evaluation:'standard-precedence',brackets:false};
  return out;
}
function generateClean(settings,seed){for(let attempt=0;attempt<30;attempt++){const p=baseGenerate('brokencalc',settings,attempt?`${seed}:precedence:${attempt}`:seed),fixed=enhance(p,settings);if(fixed)return fixed;}return {engineId:'brokencalc',title:'Broken Calculator',error:'Could not build a calculator puzzle whose targets are reachable using normal order of operations.'};}
A.generate=function(id,settings,seed){return id==='brokencalc'?generateClean(settings,seed):baseGenerate(id,settings,seed);};
A.BROKENCALC_QUALITY={version:'1.53',evaluation:'standard-precedence',reachable,verify};
A.__brokenCalcQualityV153=true;
})(typeof globalThis!=='undefined'?globalThis:this);
