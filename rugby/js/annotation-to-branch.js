// Convert an existing DRAWN decision into an actual two-way animation.
// This preserves the original drill (returns a copy) and places the true
// fork at the linked player's position along the movement step.
// Drawn routes can seed player runs and backwards ball transfers, but never
// invent tackles, tactical choices or decisions by defending players.
import {hasOutcomes,branchInfo} from './branching.js?v=1';
import {decisionData} from './training.js?v=0.12.20';
import {routeSamples,sampleRoute} from './routes.js?v=0.4.3';
import {pitchGeometry} from './pitch.js?v=0.12.23';

const copy=x=>JSON.parse(JSON.stringify(x));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const round=x=>Math.round(x*100)/100;
const actorTypes=new Set(['coach','attacker','neutral','shield','bagplayer']);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const labelFor=(option,i,actor,receiver)=>{
 const current=String(option.label||'').trim();
 if(current&&!['New option','Alternative run','Demonstrated action','Alternative'].includes(current))return current.slice(0,140);
 if(option.kind==='pass')return receiver?'Pass to '+receiver.label:'Pass to a support player';
 if(option.kind==='run')return (actor?.label||'Ball carrier')+' finds a gap';
 return i===0?'Continue the attack':'Alternative response';
};
const pointAt=(prev,current,route,g,t)=>{
 if(!prev||!current)return current?{x:current.x,y:current.y}:null;
 if(route?.points?.length){
  const samples=routeSamples(prev,current,route,g);
  const view=sampleRoute(samples,t).point;
  return g.fromView(view.x,view.y);
 }
 return {x:prev.x+(current.x-prev.x)*t,y:prev.y+(current.y-prev.y)*t};
};
function tracePart(prev,current,route,g,start,end){
 if(!prev||!current||!(route?.points?.length))return undefined;
 const samples=routeSamples(prev,current,route,g);
 const count=8,points=[];
 for(let i=1;i<count;i++){
  const q=sampleRoute(samples,start+(end-start)*i/count).point;
  points.push(g.fromView(q.x,q.y));
 }
 return {mode:'corners',points,follow:false};
}
export function drawnDecisionAt(drill,step,selectedId=''){
 if(hasOutcomes(drill))return null;
 const frame=drill?.frames?.[step];
 const list=(frame?.objects||[]).filter(o=>o.type==='decision');
 return list.find(o=>o.id===selectedId)||list.length===1&&list[0]||null;
}
export function convertDrawnDecision(source,stepIndex,markerId,{question,labelA,labelB,actionA,actionB,receiverA,receiverB,strict=false}={}){
 if(hasOutcomes(source))throw Error('This drill already has a playable decision.');
 if(!Number.isInteger(stepIndex)||stepIndex<0||stepIndex>=source?.frames?.length)
  throw Error('Select the step containing your question-mark diamond first.');
 const d=copy(source),original=d.frames[stepIndex];
 const marker=original.objects.find(o=>o.id===markerId&&o.type==='decision');
 if(!marker)throw Error('Select the decision diamond you want to make playable.');
 const old=stepIndex?d.frames[stepIndex-1]:null,def=decisionData(marker.decision);
 if(def.options.length!==2)throw Error('Playable decisions currently need exactly two options. Remove extra options first.');
 if(!def.playerId||!original.objects.some(o=>o.id===def.playerId&&actorTypes.has(o.type)))
  throw Error('Choose the player making the decision in the diamond’s Player field first.');
 const actor=original.objects.find(o=>o.id===def.playerId);
 const forkPoint=original.objects.find(o=>o.id===markerId);
 const sampleOptions=def.options.map((o,i)=>{
  const override=i===0?actionA:actionB;
  if(!override)return copy(o);
  if(!['main','run','pass'].includes(override))throw Error('Choose a recognised action for each outcome.');
  // Keep a previously drawn path only when its action type is unchanged.
  return {...copy(o),kind:override,points:override===o.kind?copy(o.points):[]};
 });
 const receiverIds=[receiverA,receiverB];
 const ball=original.objects.find(o=>o.type==='ball'&&o.ownerId===actor.id);
 const receiverFor=option=>{
  if(option.kind!=='pass'||!option.points.length)return null;
  const target=option.points.at(-1);
  const candidates=original.objects.filter(o=>actorTypes.has(o.type)&&o.id!==actor.id&&o.type!=='coach');
  const nearest=candidates.sort((a,b)=>dist(a,target)-dist(b,target))[0];
  return nearest&&dist(nearest,target)<=65?nearest:null;
 };
 const receivers=sampleOptions.map((option,i)=>{
  if(option.kind!=='pass')return null;
  const explicit=receiverIds[i];
  if(explicit){
   const receiver=original.objects.find(o=>o.id===explicit&&actorTypes.has(o.type)&&o.id!==actor.id);
   if(!receiver)throw Error('The selected receiving player is no longer in this step.');
   if(!option.points.length)option.points=[{x:receiver.x,y:receiver.y}];
   return receiver;
  }
  return receiverFor(option);
 });
 const names=[labelA,labelB].map((v,i)=>String(v||labelFor(sampleOptions[i],i,actor,receivers[i])).trim().slice(0,140));
 if(names.some(x=>!x))throw Error('Give both outcomes a name.');
 const q=String(question||def.question||'What happens next?').trim().slice(0,240)||'What happens next?';
 const geom=pitchGeometry(d.length||20,d.width||15,'up');
 const anchored=stepIndex>0&&Number.isFinite(def.anchor)&&def.anchor>.05&&def.anchor<.95;
 const fraction=anchored?def.anchor:1;
 if(anchored){
  // A fork must not falsify the moment of arrival by lengthening either half.
  // The existing editor supports a minimum action-step duration of 0.5 s.
  const seconds=Number(original.seconds)||2;
  if(Math.min(seconds*fraction,seconds*(1-fraction))<.5)
   throw Error('This run is too short for the selected decision point. Allow at least 0.5 seconds before and after the decision by increasing Step duration or choosing a point closer to the middle.');
 }
 const common=copy(original);
 if(anchored){
  common.seconds=Math.max(.5,round(original.seconds*fraction));
  common.objects=original.objects.map(obj=>{
   if(obj.type==='decision')return obj;
   const before=old?.objects.find(v=>v.id===obj.id),next=copy(obj);
   if(before&&Number.isFinite(before.x)&&Number.isFinite(before.y)){
    const pos=pointAt(before,obj,original.paths?.[obj.id],geom,fraction);
    next.x=pos.x;next.y=pos.y;
   }
   return next;
  });
  common.paths={};
  for(const obj of common.objects){
   const before=old?.objects.find(v=>v.id===obj.id),now=original.objects.find(v=>v.id===obj.id);
   const route=tracePart(before,now,original.paths?.[obj.id],geom,0,fraction);
   if(route)common.paths[obj.id]=route;
  }
 }
 const selectedMarker=common.objects.find(o=>o.id===markerId);
 selectedMarker.decision.question=q;
 selectedMarker.decision.anchor=null;
 if(anchored){
  const current=common.objects.find(o=>o.id===actor.id);
  // Align the decision diamond to the moving player, not the old full-step endpoint.
  selectedMarker.x=current.x;selectedMarker.y=current.y;
 }
 selectedMarker.decision.options=sampleOptions.map((opt,i)=>({
  id:'option-'+(i+1),label:names[i],kind:opt.kind,mode:opt.mode,points:[]
 }));
 common.name=anchored?(original.name.includes('Decision')?original.name:'Decision reached · '+original.name):original.name;
 // Original action-step sound stays on the shared step only.
 const tailSeconds=Math.max(.5,round((original.seconds||2)-(anchored?common.seconds:original.seconds)));
 const extra=d.frames.slice(stepIndex+1).map(copy);
 let warnings=[];
 function makeSuffix(option,i){
  const end=copy(original);
  end.objects=end.objects.filter(o=>o.id!==markerId);
  delete end.signal;delete end.guide;
  end.name=String.fromCharCode(65+i)+' · '+names[i];
  end.seconds=anchored?tailSeconds:2;
  end.notes=def.cue?def.cue.trim():'';
  end.paths={};
  // Continue ordinary, already-authored movement after the exact fork point.
  if(anchored){
   for(const obj of end.objects){
    const before=old?.objects.find(v=>v.id===obj.id),atEnd=original.objects.find(v=>v.id===obj.id);
    const route=tracePart(before,atEnd,original.paths?.[obj.id],geom,fraction,1);
    if(route)end.paths[obj.id]=route;
   }
  }
  if(option.kind==='run'&&option.points.length){
   const last=option.points.at(-1),runner=end.objects.find(o=>o.id===actor.id);
   runner.x=last.x;runner.y=last.y;
   // A carried ball must end beside its moving carrier, not at the position
   // from the original unbranched step (which can be metres away).
   if(ball){
    const carried=end.objects.find(o=>o.id===ball.id);
    if(carried&&carried.ownerId===actor.id){
     carried.x=runner.x+(ball.x-actor.x);
     carried.y=runner.y+(ball.y-actor.y);
    }
   }
   end.paths[runner.id]={mode:option.mode==='corners'?'corners':'smooth',points:copy(option.points.slice(0,-1)),follow:false};
   end.notes+=' The selected player follows the drawn run into the channel.';
  }else if(option.kind==='pass'){
   const receiver=receivers[i],passBall=ball&&end.objects.find(o=>o.id===ball.id);
   if(!receiver){
    const warning='Option '+String.fromCharCode(65+i)+': select the receiving player before creating the pass.';
    if(strict)throw Error(warning);
    warnings.push(warning);
   }
   else if(!passBall){
    const warning='Option '+String.fromCharCode(65+i)+': '+actor.label+' must carry the ball before the decision to pass it.';
    if(strict)throw Error(warning);
    warnings.push(warning);
   }
   // Default editor attack direction is up; never pre-create an obviously forward pass.
   else if(receiver.y<common.objects.find(o=>o.id===actor.id).y-2){
    const warning='Option '+String.fromCharCode(65+i)+': the pass would be forward. Move the receiver level with or behind the carrier before creating it.';
    if(strict)throw Error(warning);
    warnings.push(warning);
   }else{
    passBall.ownerId=receiver.id;passBall.transferKind='pass';
    passBall.x=receiver.x+11;passBall.y=receiver.y-11;
    if(option.points.length>1)end.paths[passBall.id]={mode:option.mode==='corners'?'corners':'smooth',points:copy(option.points.slice(0,-1)),follow:false};
    end.notes+=' '+actor.label+' passes backwards to '+receiver.label+'.';
   }
  }
  // Keep any already-existing following steps in each outcome, for review.
  return [end,...copy(extra)];
 }
 const framesA=makeSuffix(sampleOptions[0],0),framesB=makeSuffix(sampleOptions[1],1);
 if(stepIndex+1+Math.max(framesA.length,framesB.length)>150)throw Error('This fork would exceed 150 animation steps.');
 d.frames=d.frames.slice(0,stepIndex).concat([common],copy(framesA));
 d.branching={version:1,fork:stepIndex,question:q,active:'a',markerId,choices:[
  {id:'a',label:names[0],frames:copy(framesA)},
  {id:'b',label:names[1],frames:copy(framesB)}
 ]};
 branchInfo(d);
 return {drill:d,warnings,midStep:anchored,forkTime:d.frames.slice(0,stepIndex+1).reduce((n,f)=>n+(Number(f.seconds)||0),0)};
}


// Primary Classic editor path: select an actual moving player, click their run,
// name A and B, and create the true fork in ONE action. No annotation-only stage.
export function createDecisionOnRun(source,stepIndex,actorId,fraction,markerId,options={}){
 if(hasOutcomes(source))throw Error('This drill already has a decision with two outcomes.');
 const frame=source?.frames?.[stepIndex],before=source?.frames?.[stepIndex-1];
 if(!frame||!before)throw Error('First add a running step. The setup alone has no movement.');
 const actor=frame.objects.find(o=>o.id===actorId&&actorTypes.has(o.type));
 const previous=before.objects.find(o=>o.id===actorId);
 if(!actor||!previous)throw Error('Select a player whose run is visible in this step.');
 const moving=dist(actor,previous)>.1||frame.paths?.[actorId]?.points?.length>0;
 if(!moving)throw Error('Draw a running path for this player before adding a decision.');
 if(!Number.isFinite(fraction)||fraction<=.01||fraction>=.99)
  throw Error('Place the decision somewhere between the beginning and end of the run.');
 if(frame.objects.length>=200)throw Error('The step already has the maximum number of objects.');
 if(frame.objects.some(o=>o.type==='decision'))
  throw Error('This step already has a decision. Select its diamond to make it playable.');
 const safeId=String(markerId||'').trim();
 if(!safeId||frame.objects.some(o=>o.id===safeId))throw Error('Decision marker needs a unique identifier.');
 const cloneDrill=copy(source);
 const geom=pitchGeometry(source.length||20,source.width||15,'up');
 const loc=pointAt(previous,actor,frame.paths?.[actorId],geom,fraction);
 const receivers=frame.objects.filter(o=>actorTypes.has(o.type)&&o.id!==actorId&&o.type!=='coach');
 const preferred=receivers.find(o=>o.id===options.receiverB)||receivers[0];
 const wantsPass=options.actionB==='pass';
 const markers=[
  {label:options.labelA||'Keep running',kind:options.actionA||'main',mode:'smooth',points:[]},
  {label:options.labelB||(wantsPass?'Pass to '+(preferred?.label||'support'):'Different route'),kind:options.actionB||'run',mode:'smooth',
    points:wantsPass&&preferred?[{x:preferred.x,y:preferred.y}]:[]}
 ];
 const marker={id:safeId,type:'decision',label:'Decision',x:loc.x,y:loc.y,rot:0,
  decision:{playerId:actorId,anchor:fraction,question:options.question||'What should the ball carrier do?',cue:'React to the defenders at this point.',options:markers}};
 cloneDrill.frames[stepIndex].objects.push(marker);
 return convertDrawnDecision(cloneDrill,stepIndex,safeId,{
  question:options.question,labelA:options.labelA||markers[0].label,labelB:options.labelB||markers[1].label,
  actionA:options.actionA||'main',actionB:options.actionB||'run',
  receiverA:options.receiverA,receiverB:options.receiverB,strict:true
 });
}
