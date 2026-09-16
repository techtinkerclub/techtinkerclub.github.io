/* 99 Club Studio · Broken Calculator quality guard v1.52
 * - Challenge puzzles expose division as a working operation.
 * - Every target is independently proven reachable using only visible working keys.
 * - The original arithmetic generator remains the source of puzzle targets.
 */
(function(global){
'use strict';
const A=global.TT99ArithmeticGames;
if(!A||A.__brokenCalcQualityV152)return;

const baseGenerate=A.generate.bind(A);
const OPS=['+','-','×','÷'];

function difficultyOf(settings){
  const d=settings?.engineSettings?.brokencalc?.difficulty;
  return ['easy','standard','challenge'].includes(d)?d:'standard';
}
function evalOp(a,op,b){
  if(typeof A._evalOp==='function')return A._evalOp(a,op,b);
  if(op==='+')return a+b;if(op==='-')return a-b;if(op==='×')return a*b;if(op==='÷')return b!==0?a/b:NaN;return NaN;
}
function workingParts(puzzle){
  const keys=new Set(puzzle?.keys||[]);
  return {
    digits:[...keys].filter(k=>/^\d$/.test(k)).map(Number),
    ops:[...keys].filter(k=>OPS.includes(k))
  };
}
function reachable(target,puzzle,{maxOperands=8,valueCap=5000}={}){
  target=Number(target);if(!Number.isFinite(target))return null;
  const {digits,ops}=workingParts(puzzle);if(!digits.length||!ops.length)return null;
  let layer=new Map();
  for(const d of digits)if(!layer.has(d))layer.set(d,String(d));
  if(layer.has(target))return layer.get(target);
  for(let used=2;used<=maxOperands;used++){
    const next=new Map();
    for(const [value,expr] of layer){
      for(const op of ops)for(const d of digits){
        if(op==='÷'&&d===0)continue;
        const v=evalOp(value,op,d);
        if(!Number.isFinite(v)||Math.abs(v-Math.round(v))>1e-9)continue;
        const iv=Math.round(v);if(iv<0||iv>valueCap)continue;
        if(!next.has(iv))next.set(iv,`${expr} ${op} ${d}`);
      }
    }
    if(next.has(target))return next.get(target);
    layer=next;if(!layer.size)break;
  }
  return null;
}
function verify(puzzle){
  if(!puzzle||puzzle.engineId!=='brokencalc'||puzzle.error)return {ok:false,error:puzzle?.error||'Not a Broken Calculator puzzle'};
  const proofs=[];
  for(const t of puzzle.targets||[]){
    const expr=reachable(t.target,puzzle);
    if(!expr)return {ok:false,error:`Target ${t.target} is not reachable using the visible working keys.`};
    proofs.push({target:Number(t.target),expression:expr});
  }
  return {ok:true,proofs};
}
function enhance(puzzle,settings){
  if(!puzzle||puzzle.engineId!=='brokencalc'||puzzle.error)return puzzle;
  const out=JSON.parse(JSON.stringify(puzzle));
  if(difficultyOf(settings)==='challenge'&&!out.keys.includes('÷')){
    const eqIndex=out.keys.indexOf('=');
    if(eqIndex>=0)out.keys.splice(eqIndex,0,'÷');else out.keys.push('÷');
  }
  const proof=verify(out);
  if(!proof.ok)return null;
  out.brokenCalcQuality={version:'1.52',reachable:true,proofs:proof.proofs,divisionAvailable:out.keys.includes('÷')};
  return out;
}
function generateClean(settings,seed){
  for(let attempt=0;attempt<20;attempt++){
    const p=baseGenerate('brokencalc',settings,attempt?`${seed}:reachable:${attempt}`:seed);
    const fixed=enhance(p,settings);if(fixed)return fixed;
  }
  return {engineId:'brokencalc',title:'Broken Calculator',error:'Could not build a calculator puzzle whose targets are all reachable from the working keys.'};
}
A.generate=function(id,settings,seed){return id==='brokencalc'?generateClean(settings,seed):baseGenerate(id,settings,seed);};
A.BROKENCALC_QUALITY={version:'1.52',reachable,verify};
A.__brokenCalcQualityV152=true;
})(typeof globalThis!=='undefined'?globalThis:this);
