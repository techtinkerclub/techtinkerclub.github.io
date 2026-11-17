import {isDiagramObject,diagramSettings,diagramSVG} from './diagram-shapes.js?v=0.12.10';
import {normaliseTextStyle,textLabelSVG} from './text-label.js?v=0.12.8';
import {normalScaleMode,symbolTransform,labelOffset,labelPosition,symbolFactors} from './symbol-scale.js?v=0.12.26';
// Output scenes use the same geometry, paths, poses and possession engine as the editor.
import {esc,types,shape,clamp} from './model.js?v=0.12.10';
import {copyTraining,cleanTraining,decisionOverlay,donutShape,trainingTransition,trainingPoses} from './training.js?v=0.12.20';
import {pitchGeometry,trainingField} from './pitch.js?v=0.12.23';
import {pitchSettings,copyLayoutMarker} from './drill-edit.js?v=0.12.10';
import {frameObjects,transitionObjects,movementFor,isShield,canCarry,syncPossession,normaliseRecoveryPoses} from './possession.js?v=0.12.27';
import {routeSamples,routeSVG,sanitizeRoutes} from './routes.js?v=0.4.3';
import {contactType,contactLabels,posesFor,posedShape,contactMarkerShape,cleanContacts,PLAYER_POSES} from './contact.js?v=0.12.25';
import {cleanBreakdowns} from './breakdown.js?v=0.12.25';
import {cleanGuide,guideCaption,phaseOverlay} from './game-phases.js?v=0.12.0';
import {cardLinks} from './coaching-output.js?v=0.7.1';
import {orderObjects,copyDrawingOrder} from './draw-order.js?v=0.12.27';
import {offsideOverlay} from './offside.js?v=0.12.23';
export function playbackData(d){
 if(d?.version!==1||!Array.isArray(d.frames)||!d.frames.length||d.frames.length>150)throw Error('Invalid drill.');
 const str=(s,n=4000)=>String(s??'').slice(0,n),num=(x,min,max,def)=>Number.isFinite(Number(x))?clamp(Number(x),min,max):def;
 const out={...pitchSettings(d),version:1,title:str(d.title,160)||'Rugby drill',length:num(d.length,5,100,20),width:num(d.width,5,70,15)};
 for(const k of ['age','objective','safety','instructions','coaching','equipment','players','regression','progression','questions','notes'])out[k]=str(d[k],20000);
 out.ageMin=num(d.ageMin,6,16,6);out.ageMax=num(d.ageMax,out.ageMin,16,16);out.minutes=num(d.minutes,1,120,8);out.category=str(d.category,80);out.links=cardLinks(d);
 out.frames=d.frames.map((f,i)=>{
  if(!Array.isArray(f?.objects)||f.objects.length>200)throw Error('Invalid objects.');
  const ids=new Set(),timing=Object.create(null),paths=Object.create(null);
  const objects=f.objects.map(o=>{
   if(!o||!Object.hasOwn(types,o.type)||typeof o.id!=='string'||o.id.length>200||['__proto__','prototype','constructor'].includes(o.id)||ids.has(o.id)||!Number.isFinite(o.x)||!Number.isFinite(o.y))throw Error('Invalid object.');
   ids.add(o.id);const q=copyDrawingOrder(o,{id:o.id,type:o.type,label:str(o.label,160),x:num(o.x,0,900,450),y:num(o.y,0,540,270),rot:num(o.rot,-360,360,0)});
   if(o.type==='label')q.textStyle=normaliseTextStyle(o.textStyle);
   if(isDiagramObject(o))q.diagram=diagramSettings(o.type,o.diagram,out.width);
   if(canCarry(o)&&Object.hasOwn(PLAYER_POSES,o.playerPose)){q.playerPose=o.playerPose;if(o.posePinned===true)q.posePinned=true}
    if(o.type==='ball'||isShield(o)){if(typeof o.ownerId==='string')q.ownerId=o.ownerId;if(o.type==='ball'){if(['left','right'].includes(o.carrySide))q.carrySide=o.carrySide;if(['turnover','presentation','set','handover','throw','feed','kick','pass','tap'].includes(o.transferKind))q.transferKind=o.transferKind;if(['presented','secured','grounded'].includes(o.groundState))q.groundState=o.groundState}}
   if(contactType(o.type)&&Array.isArray(o.members))q.members=o.members.slice(0,17).filter(m=>m&&typeof m.id==='string').map(m=>({id:m.id,pose:m.pose}));
   if(contactType(o.type)&&o.breakdown&&typeof o.breakdown==='object'){const b=o.breakdown;q.breakdown={phase:b.phase,mode:b.mode==='pad'?'pad':undefined,padId:typeof b.padId==='string'?b.padId:undefined,arrivalSide:b.arrivalSide,carrierId:b.carrierId,tacklerId:b.tacklerId,tacklerIds:Array.isArray(b.tacklerIds)?b.tacklerIds.slice(0,2):undefined,ballId:b.ballId}}
   const t=f.timing?.[o.id];if(t&&Object.hasOwn(f.timing,o.id)){const start=num(t.start,0,99,0);timing[o.id]={start,end:num(t.end,start+1,100,100)}}
   if(f.paths&&Object.hasOwn(f.paths,o.id))paths[o.id]=f.paths[o.id];return copyLayoutMarker(o,copyTraining(o,q));
  });
  const result={name:str(f.name,160)||'Step '+(i+1),seconds:i?num(f.seconds,.5,30,2):0,notes:str(f.notes),objects,timing,paths,guide:f.guide};cleanGuide(result);cleanTraining(result);return result;
 });
 cleanContacts(out.frames);cleanBreakdowns(out.frames);sanitizeRoutes(out.frames);normaliseRecoveryPoses(out.frames);syncPossession(out.frames,pitchGeometry(out.length,out.width,'up'));
 return out;
}
export function drillDuration(d){return d.frames.reduce((s,f,i)=>s+(i?f.seconds:0),0)}
export function timeLocation(d,t){if(t<=0||d.frames.length<2)return {i:0,p:1};let acc=0;for(let i=1;i<d.frames.length;i++){const end=acc+d.frames[i].seconds;if(t<=end)return {i,p:clamp((t-acc)/d.frames[i].seconds,0,1)};acc=end}return {i:d.frames.length-1,p:1}}
const svgObj=(o,g,poses,ink=false)=>{const q=g.toView(o.x,o.y),color=types[o.type][1];if(isDiagramObject(o))return '<g transform="translate('+q.x+' '+q.y+') rotate('+(o.rot+g.rotation)+')">'+diagramSVG(o,g,{ink})+'</g>';if(o.type==='label')return '<g transform="translate('+q.x+' '+q.y+')">'+textLabelSVG(o,{baseline:labelOffset(o,g),ink})+'</g>';return '<g transform="translate('+q.x+' '+q.y+')"><g transform="rotate('+(o.rot+g.rotation)+') '+symbolTransform(o,g,poses.get(o.id))+'">'+posedShape(o,poses.get(o.id),contactMarkerShape(o,donutShape(o,o.type==='label'?'':shape(o.type))),color)+'</g>'+(o.label&&!contactType(o.type)?'<text x="'+labelPosition(o,g,poses.get(o.id)).x+'" y="'+labelPosition(o,g,poses.get(o.id)).y+'" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="600" fill="'+(ink?'#172820':'#fff')+'" paint-order="stroke" stroke="'+(ink?'#fff':'#234f38')+'" stroke-width="3">'+esc(o.label)+'</text>':'')+'</g>'};
export function renderScene(d,{time=null,index=0,orientation='up',runs=true,passes=true,labels=true,decisions=true,offside=false,markups=true,scaleMode='realistic',ghosts=false,ink=false,prefix='scene'}={}){
 const g={...pitchGeometry(d.length,d.width,orientation),displayMode:normalScaleMode(scaleMode)},loc=time===null?{i:clamp(index,0,d.frames.length-1),p:1}:timeLocation(d,time),{i,p}=loc,fr=d.frames[i],old=d.frames[i-1],objects=old&&time!==null?trainingTransition(transitionObjects(old,fr,p,g),old,fr,p,g):frameObjects(fr,g),poses=trainingPoses(objects,posesFor(objects));
 let field=trainingField(g,false,.5,pitchSettings(d)),arrows='',starts='',changes=[];
 if(ink)field=field.replaceAll('#203b2b','#fff').replaceAll('#326844','#eff4ed').replaceAll('#d4e6c9','#355744').replaceAll('#f9f4d9','#34473b');
 if(old)for(const o of fr.objects){
  if(o.type==='decision'||isDiagramObject(o))continue;
  const m=movementFor(old,fr,o,g),route=fr.paths?.[o.id];
  if(o.type==='ball'&&m?.turnover){if(p*100>=(fr.timing?.[o.id]?.end??100))changes.push('Turnover');continue}
  if(m?.instant)continue;
  if(o.type==='ball'&&m?.presentation){if(!fr.guide)changes.push('Ball presentation');continue}
  if(!m||(o.type==='ball'?!passes:!runs)||(!Math.hypot(m.start.x-m.end.x,m.start.y-m.end.y)&&!route?.points?.length))continue;
  const ball=o.type==='ball',color=ink?(ball?'#8b5c00':o.type==='defender'?'#a6520e':'#155a91'):(ball?'#ffe994':types[o.type][1]),d=routeSVG(routeSamples(m.start,m.end,route,g));
  arrows+='<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+(ink?3.4:3)+'" '+(ball?(o.transferKind==='kick'?'stroke-dasharray="13 4 3 4" ':'stroke-dasharray="7 6" '):'')+'marker-end="url(#arr)" opacity=".95"/>';
  if(ghosts&&canCarry(o)){const q=g.toView(m.start.x,m.start.y);starts+='<circle cx="'+q.x+'" cy="'+q.y+'" r="'+Math.max(3,15*symbolFactors(o,g)[0])+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-dasharray="4 3"/>'}
 }
 const order=orderObjects(objects);
 if(guideCaption(fr)&&!objects.some(o=>contactType(o.type)&&o.label===guideCaption(fr)))changes.push(guideCaption(fr));
 let body=field+(offside?offsideOverlay(objects,d,g,'auto',ink):'')+(labels?phaseOverlay(fr,g):'')+arrows+starts+order.filter(o=>o.type!=='decision'&&(markups||!isDiagramObject(o))).map(o=>svgObj(o,g,poses,ink)).join('')+(decisions?decisionOverlay(fr,g,esc,'',ink,old):'')+(labels?contactLabels(objects,g,esc,[...new Set(changes)]):'');
 const safePrefix=String(prefix).replace(/[^a-zA-Z0-9_-]/g,'')||'scene';body=body.replaceAll('id="arr"','id="'+safePrefix+'-arr"').replaceAll('url(#arr)','url(#'+safePrefix+'-arr)').replaceAll('id="gridpat"','id="'+safePrefix+'-gridpat"');
 return {svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+g.viewWidth+' '+g.viewHeight+'" width="'+g.viewWidth+'" height="'+g.viewHeight+'" font-family="Arial,sans-serif">'+body+'</svg>',g,index:i,frame:fr};
}
