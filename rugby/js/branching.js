import {removeObject} from './object-edit.js';
// Shared decision-path model for Classic Studio, Coach Edition and read-only outputs.
// One common opening sequence; each outcome owns its steps after the decision.
// Keep the saved drill's frames as the currently selected, linear editing path.
const copy=value=>JSON.parse(JSON.stringify(value));
export const hasOutcomes=d=>!!d?.branching&&d.branching.version===1&&Array.isArray(d.branching.choices)&&d.branching.choices.length===2;
export function branchInfo(d){
 if(!hasOutcomes(d))return null;
 const b=d.branching;
 if(!Number.isInteger(b.fork)||b.fork<0||b.fork>=d.frames.length||b.fork>=150)throw Error('Invalid decision step.');
 if(typeof b.question!=='string'||b.question.length>240)throw Error('Invalid decision question.');
 if(!['a','b'].includes(b.active))throw Error('Invalid active outcome.');
 if(b.choices[0].id!=='a'||b.choices[1].id!=='b')throw Error('Invalid decision outcome IDs.');
 for(const value of [b.context,b.watchFor,...b.choices.flatMap(c=>[c.explanation,c.watchFor])])
  if(value!==undefined&&(typeof value!=='string'||value.length>500))throw Error('Invalid decision coaching text.');
 for(const c of b.choices){
  if(typeof c.label!=='string'||c.label.length>140||!Array.isArray(c.frames)||c.frames.length<1||c.frames.length>149-b.fork)throw Error('Invalid decision outcome.');
 }
 return b;
}
function cleanStep(source,name){
 const step=copy(source);
 step.name=name;step.seconds=2;step.notes='';
 step.objects=step.objects.filter(o=>o.type!=='decision');
 step.timing={};step.paths={};
 delete step.guide;
 for(const ball of step.objects.filter(o=>o.type==='ball'))delete ball.transferKind;
 return step;
}
export function createOutcomes(d,fork,question,labelA,labelB){
 if(hasOutcomes(d))throw Error('This drill already has an outcome decision. Finish the current decision first.');
 if(!Number.isInteger(fork)||fork<0||fork>=d.frames.length||fork>=148)throw Error('Choose an earlier step for the decision.');
 const names=[String(labelA||'Option A').trim().slice(0,140),String(labelB||'Option B').trim().slice(0,140)];
 if(names.some(x=>!x))throw Error('Give both outcomes a name.');
 const rest=d.frames.slice(fork+1);
 const make=(name)=>rest.length?copy(rest):[cleanStep(d.frames[fork],name)];
 const a=make(names[0]),b=make(names[1]);
 if(!rest.length){a[0].name='A · '+names[0];b[0].name='B · '+names[1]}
 d.branching={version:1,fork,question:String(question||'What happens next?').trim().slice(0,240)||'What happens next?',active:'a',choices:[{id:'a',label:names[0],frames:a},{id:'b',label:names[1],frames:b}]};
 d.frames=d.frames.slice(0,fork+1).concat(copy(a));
 return d.branching;
}
export function syncActiveOutcome(d){
 const b=branchInfo(d);if(!b)return;
 const current=b.choices.find(c=>c.id===b.active);
 current.frames=copy(d.frames.slice(b.fork+1));
 if(!current.frames.length)throw Error('An outcome needs at least one step. Add another step before saving.');
}
export function chooseOutcome(d,id){
 const b=branchInfo(d);if(!b||!['a','b'].includes(id))throw Error('Choose outcome A or B.');
 if(b.active===id)return;
 syncActiveOutcome(d);
 const prefix=copy(d.frames.slice(0,b.fork+1));
 const target=b.choices.find(c=>c.id===id);
 d.frames=prefix.concat(copy(target.frames));b.active=id;
}
export function outcomeView(d,id){
 const b=branchInfo(d);
 if(!b)return copy(d);
 const choice=b.choices.find(c=>c.id===id);if(!choice)throw Error('Unknown outcome.');
 const result=copy(d);
 result.frames=copy(d.frames.slice(0,b.fork+1)).concat(copy(id===b.active?d.frames.slice(b.fork+1):choice.frames));
 delete result.branching;
 return result;
}
export function outcomeViews(d){
 const b=branchInfo(d);
 if(!b)return [{id:'',label:'Complete drill',drill:copy(d)}];
 return b.choices.map(c=>({id:c.id,label:c.label,drill:outcomeView(d,c.id)}));
}
export function editOutcomes(d,question,labelA,labelB,guidance=null){
 const b=branchInfo(d);if(!b)throw Error('This drill has no outcome decision.');
 b.question=String(question||'What happens next?').trim().slice(0,240)||'What happens next?';
 for(const [i,value] of [labelA,labelB].entries()){
  const label=String(value||'').trim().slice(0,140);
  if(!label)throw Error('Give each outcome a name.');
  b.choices[i].label=label;
 }
 if(guidance){
  b.context=String(guidance.context||'').trim().slice(0,500);
  b.watchFor=String(guidance.watchFor||'').trim().slice(0,500);
  b.choices.forEach((choice,i)=>{
   choice.explanation=String(guidance.choices?.[i]?.explanation||'').trim().slice(0,500);
   choice.watchFor=String(guidance.choices?.[i]?.watchFor||'').trim().slice(0,500);
  });
 }
}
export function removeOutcomes(d){
 const b=branchInfo(d);if(!b)return false;
 const markerId=b.markerId;
 if(markerId)for(const frame of d.frames){
  frame.objects=frame.objects.filter(o=>o.id!==markerId);
  if(frame.paths)delete frame.paths[markerId];
  if(frame.timing)delete frame.timing[markerId];
 }
 delete d.branching;
 return true;
}

// Apply a scoped deletion to the common opening and both stored outcomes.
// The currently selected outcome is represented by drill.frames, not necessarily
// by its cached choice.frames; refresh that cache before editing the other branch.
export function removeObjectAcrossOutcomes(drill,id,index,scope='here'){
 if(!hasOutcomes(drill)){
  const result=removeObject(drill.frames,id,index,scope);
  return {frames:result.frames,removed:result.removed};
 }
 const b=branchInfo(drill);
 syncActiveOutcome(drill);
 const active=b.active;
 const commonCount=b.fork+1;
 const main=removeObject(drill.frames,id,index,scope);
 let removed=main.removed;
 const other=b.choices.find(c=>c.id!==active);
 // A shared step deletion affects the corresponding object in *both* options;
 // for 'onward' only the suffix from the selected step is affected.
 const suffixStart=scope==='onward'&&index<commonCount?0:scope==='all'?0:null;
 if(suffixStart!==null){
  const otherResult=removeObject(other.frames,id,suffixStart,scope==='here'?'all':scope==='all'?'all':'onward');
  other.frames=otherResult.frames;
  removed+=otherResult.removed;
 }
 drill.frames=main.frames;
 b.choices.find(c=>c.id===active).frames=copy(main.frames.slice(commonCount));
 return {frames:drill.frames,removed};
}
