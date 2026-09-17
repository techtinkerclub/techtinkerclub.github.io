/* 99 Club Studio · Broken Calculator engine patch v1.53
 * Generates targets using normal arithmetic precedence (× and ÷ before + and −).
 * No brackets are used or required.
 */
(function(global){
'use strict';
const A=global.TT99ArithmeticGames;
if(!A||A.__brokenCalcOrderV153)return;

const baseGenerate=A.generate.bind(A),OPS=['+','-','×','÷'];
function hash(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rngFromSeed(seed){let a=hash(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function choose(rng,arr){return arr[Math.floor(rng()*arr.length)];}
function shuffle(rng,arr){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function norm(raw={}){return {difficulty:['easy','standard','challenge'].includes(raw.difficulty)?raw.difficulty:'standard',targets:['2','3','4'].includes(String(raw.targets))?String(raw.targets):'3',keyLevel:['auto','generous','tight'].includes(raw.keyLevel)?raw.keyLevel:'auto'};}
function evaluate(tokens){
  const t=(tokens||[]).map(String);if(!t.length||t.length%2===0||!/^\d+$/.test(t[0]))return NaN;
  let sum=0,term=Number(t[0]);
  for(let i=1;i<t.length;i+=2){const op=t[i],b=Number(t[i+1]);if(!OPS.includes(op)||!Number.isFinite(b))return NaN;
    if(op==='×')term*=b;else if(op==='÷'){if(b===0)return NaN;term/=b;}else{sum+=term;term=op==='+'?b:-b;}
    if(!Number.isFinite(sum)||!Number.isFinite(term))return NaN;
  }
  return sum+term;
}
function makeExpression(digits,ops,rng,difficulty){
  const terms=difficulty==='easy'?2:difficulty==='challenge'?4:3;
  const nums=Array.from({length:terms},()=>choose(rng,digits));
  const tokens=[String(nums[0])];
  for(let i=1;i<terms;i++){tokens.push(choose(rng,ops),String(nums[i]));}
  const value=evaluate(tokens);return {tokens,value,expr:tokens.join(' ')};
}
function generate(settings,seed){
  const c=norm(settings?.engineSettings?.brokencalc||{}),rng=rngFromSeed(`${seed}:brokencalc:v153`),maxYear=clamp(Number(settings?.maxYear)||6,1,6);
  const digitCount=c.keyLevel==='generous'?4:c.keyLevel==='tight'?2:(c.difficulty==='easy'?4:3);
  const digits=shuffle(rng,[1,2,3,4,5,6,7,8,9]).slice(0,digitCount).sort((a,b)=>a-b);
  let ops;if(c.difficulty==='easy')ops=['+'];else if(maxYear<=2)ops=['+','-'];else if(c.difficulty==='challenge')ops=['+','-','×','÷'];else ops=['+','×'];
  const keys=[...digits.map(String),...ops,'='],digitSet=new Set(digits.map(String)),targetCount=clamp(Number(c.targets)||3,2,4),targets=[],seen=new Set();
  const typeable=value=>String(Math.trunc(value)).split('').every(ch=>digitSet.has(ch));
  for(let tries=0;tries<1800&&targets.length<targetCount;tries++){
    const q=makeExpression(digits,ops,rng,c.difficulty),v=q.value;
    if(!Number.isFinite(v)||Math.abs(v-Math.round(v))>1e-9)continue;
    const iv=Math.round(v);if(iv<=0||iv>=1000||typeable(iv)||seen.has(iv))continue;
    seen.add(iv);targets.push({target:iv,solution:q.expr,keyPresses:`${q.expr} =`,evaluation:'standard-precedence'});
  }
  if(targets.length<targetCount){
    const a=digits[0]||2;
    for(let n=2;n<=10&&targets.length<targetCount;n++){
      const iv=a*n;if(iv<=0||iv>=1000||typeable(iv)||seen.has(iv))continue;
      const expr=Array(n).fill(String(a)).join(' + ');seen.add(iv);targets.push({target:iv,solution:expr,keyPresses:`${expr} =`,evaluation:'standard-precedence'});
    }
  }
  if(targets.length<targetCount)return generate(settings,`${seed}:retry`);
  return {engineId:'brokencalc',title:'Broken Calculator',difficulty:c.difficulty,keys,targets,instruction:'Only the keys shown still work. Make each target using normal order of operations.',seed,options:c,evaluationMode:'standard-precedence',bracketsAllowed:false};
}

A.generate=function(id,settings,seed){return id==='brokencalc'?generate(settings,seed):baseGenerate(id,settings,seed);};
A._brokenCalcEvaluateV153=evaluate;
A.generateBrokenCalcV153=generate;
A.__brokenCalcOrderV153=true;
})(typeof globalThis!=='undefined'?globalThis:this);
