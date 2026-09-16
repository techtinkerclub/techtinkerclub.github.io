/* 99 Club Studio · Online Play hint guard v1.65
 * Keeps shared Hint behaviour instructional: point to a strategy or useful
 * constraint, never disclose a hidden answer or a step copied from a stored
 * solution. Most adapters already follow this rule; this guard fixes the two
 * arithmetic adapters that previously exposed a first solution step.
 */
(function(global){
'use strict';
const Play=global.TT99GamesPlay;
if(!Play?.adapters)return;

function currentTaskIndex(root){
  const tabs=[...root.querySelectorAll('[data-task]')];
  const i=tabs.findIndex(b=>b.classList.contains('is-current'));
  return i>=0?i:0;
}

function patchTarget(){
  const adapter=Play.adapters.get('target');
  if(!adapter||adapter.__hintGuard165)return;
  adapter.__hintGuard165=true;
  const originalMount=adapter.mount;
  adapter.mount=function(root,p,ctx){
    const view=originalMount(root,p,ctx);
    view.hint=function(){
      const i=currentTaskIndex(root),ch=p.challenges?.[i]||p.challenges?.[0];
      if(!ch)return {tone:'hint',message:'Compare the available number tiles with the target and look for a simple way to get close before making a final adjustment.'};
      const used=root.querySelectorAll('[data-num-index].is-used').length;
      const available=Math.max(0,(ch.numbers?.length||0)-used);
      const valueText=root.querySelector('[data-target-value]')?.textContent?.trim()||'';
      const match=valueText.match(/=\s*(-?\d+(?:\.\d+)?)/);
      if(match){
        const value=Number(match[1]),target=Number(ch.target),diff=target-value;
        if(Number.isFinite(value)&&Number.isFinite(diff)&&diff!==0){
          return {tone:'hint',message:`Your current expression makes ${value}. The target is ${target}, so think about how the ${available} unused number tile${available===1?'':'s'} could ${diff>0?'increase':'decrease'} the result by ${Math.abs(diff)}. Look at the allowed operations rather than starting again immediately.`};
        }
      }
      return {tone:'hint',message:`Target ${ch.target}: compare the available numbers with the target. Try a simple pair that gets reasonably close, then keep another tile for an adjustment. You do not need to copy one particular route — there may be several valid solutions.`};
    };
    return view;
  };
}

function patchBrokenCalculator(){
  const adapter=Play.adapters.get('brokencalc');
  if(!adapter||adapter.__hintGuard165)return;
  adapter.__hintGuard165=true;
  const originalMount=adapter.mount;
  adapter.mount=function(root,p,ctx){
    const view=originalMount(root,p,ctx);
    view.hint=function(){
      const i=currentTaskIndex(root),t=p.targets?.[i]||p.targets?.[0];
      if(!t)return {tone:'hint',message:'Look first at which digits and operations still work. Make a friendly number near the target, then adjust it.'};
      const resultText=root.querySelector('[data-calc-result]')?.textContent?.trim()||'';
      const match=resultText.match(/=\s*(-?\d+(?:\.\d+)?)/);
      if(match){
        const value=Number(match[1]),target=Number(t.target),diff=target-value;
        if(Number.isFinite(value)&&Number.isFinite(diff)&&diff!==0){
          return {tone:'hint',message:`That attempt makes ${value}; the target is ${target}. You need a change of ${Math.abs(diff)} ${diff>0?'upwards':'downwards'}. Check which working digit and operation keys could create that kind of adjustment.`};
        }
      }
      const workingOps=['+','-','×','÷'].filter(op=>(p.keys||[]).includes(op));
      const ops=workingOps.length?workingOps.map(op=>op==='-'?'−':op).join(', '):'the working operation keys';
      return {tone:'hint',message:`Target ${t.target}: start from the keys you actually have. Try making a friendly nearby number, then adjust it using ${ops}. The hint deliberately does not reveal a stored solution step.`};
    };
    return view;
  };
}

patchTarget();
patchBrokenCalculator();
})(typeof globalThis!=='undefined'?globalThis:this);
