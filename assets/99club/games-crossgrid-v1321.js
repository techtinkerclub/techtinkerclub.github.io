/* 99 Club Studio · Arithmetic Equation Crossgrid usability patch
 * v1.0.0 — marks missing operators with a corner hint and explains the notation.
 */
(function(global){
  'use strict';
  const A=global.TT99ArithmeticGames;
  if(!A||A.__crossgridCornerHintV1)return;

  const originalGenerate=A.generate.bind(A);
  const originalWorked=A.workedExample.bind(A);
  const OPS=new Set(['+','-','×','÷']);

  function enrich(activity){
    if(!activity||activity.error||activity.engineId!=='equationcrossgrid')return activity;
    const hidden=new Set(activity.hiddenKeys||[]),solution=activity.solutionGrid||[],hiddenOperatorKeys=[];
    for(let r=0;r<solution.length;r++)for(let c=0;c<(solution[r]||[]).length;c++){
      if(hidden.has(`${r}:${c}`)&&OPS.has(solution[r][c]))hiddenOperatorKeys.push(`${r}:${c}`);
    }
    activity.hiddenOperatorKeys=hiddenOperatorKeys;
    activity.instruction=hiddenOperatorKeys.length
      ?'Fill the missing numbers. A small ? in a corner marks a missing operation sign: write +, −, × or ÷ in that square. Make every connected equation true. Black squares are not used.'
      :'Fill the missing numbers so every connected equation is true. Black squares are not used.';
    return activity;
  }

  A.generate=function(id,settings,seed){
    return id==='equationcrossgrid'?enrich(originalGenerate(id,settings,seed)):originalGenerate(id,settings,seed);
  };
  A.workedExample=function(id,...args){
    const ex=originalWorked(id,...args);
    if(id!=='equationcrossgrid'||!ex)return ex;
    const rules=[...(ex.rules||[])];
    if(!rules.some(x=>/small \?/i.test(String(x))))rules.push('A small ? in the corner of a square means the operation sign is missing; write the operator in the centre of that square.');
    const steps=[...(ex.steps||[])];
    if(!steps.some(x=>/operation/i.test(String(x))&&/\?/i.test(String(x))))steps.unshift('If you see a small ? in a corner, use the surrounding numbers to decide whether +, −, × or ÷ belongs in that square.');
    return {...ex,rules,steps,commonMistake:ex.commonMistake||'Do not write over the small ?; it is only a hint that the centre of that square needs an operation sign.'};
  };

  A.__crossgridCornerHintV1=true;
})(typeof globalThis!=='undefined'?globalThis:this);
