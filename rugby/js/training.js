import {routeSamples,routeSVG,sampleRoute} from './routes.js?v=0.4.3';
// Schematic training annotations, independent of actual animation routes.
const clip=(v,a,b)=>Math.max(a,Math.min(b,v)),str=(v,n)=>String(v??'').slice(0,n);
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?{x:clip(p.x,42,858),y:clip(p.y,37,503)}:null;
export function decisionData(raw){raw=raw||{};return {playerId:str(raw.playerId,200),anchor:Number.isFinite(raw.anchor)?clip(raw.anchor,0,1):null,question:str(raw.question,500),cue:str(raw.cue,1000),options:(Array.isArray(raw.options)?raw.options:[]).slice(0,6).map((q,i)=>({id:'option-'+(i+1),label:str(q?.label,200),kind:['main','run','pass','note'].includes(q?.kind)?q.kind:'run',mode:q?.mode==='corners'?'corners':'smooth',points:(Array.isArray(q?.points)?q.points:[]).slice(0,12).map(point).filter(Boolean)}))}}
// Keep this list consistent with the player pose selector in contact.js.
// Every selectable pose must survive cleanTraining(), JSON import and playbackData().
const POSE_TYPES=['attacker','defender','neutral','coach','shield','bagplayer'],POSE_VALUES=['standing','tackling','grounded','kneeling','bound','recovering','crouched','ready'];
export function copyTraining(src,dst){if(POSE_TYPES.includes(src.type)&&POSE_VALUES.includes(src.playerPose))dst.playerPose=src.playerPose;else delete dst.playerPose;if(POSE_TYPES.includes(src.type)&&POSE_VALUES.includes(src.playerPose)&&src.posePinned===true)dst.posePinned=true;else delete dst.posePinned;if(src.type==='decision')dst.decision=decisionData(src.decision);if(src.type==='donut'){dst.donutState=['rolling','impact','down'].includes(src.donutState)?src.donutState:'ready';if(['impact','down'].includes(dst.donutState)&&typeof src.donutTacklerId==='string')dst.donutTacklerId=src.donutTacklerId.slice(0,200);else delete dst.donutTacklerId;}return dst}
export function cleanTraining(f){for(const x of f.objects){copyTraining(x,x);if(x.type==='decision'||x.type==='donut'){if(x.type==='decision'&&!f.objects.some(p=>p.id===x.decision.playerId))x.decision.playerId='';if(x.type==='donut'&&!f.objects.some(p=>p.id===x.donutTacklerId))delete x.donutTacklerId;if(f.paths)delete f.paths[x.id];if(x.type==='decision'&&f.timing)delete f.timing[x.id]}}return f}
export function stripDecisions(f){f.objects=f.objects.filter(o=>o.type!=='decision');for(const o of f.objects)delete o.posePinned;return f}
export const decisionList=f=>(f?.objects||[]).filter(o=>o.type==='decision');
export function decisionText(f){return decisionList(f).map(o=>(o.label||'Decision')+': '+[o.decision?.question,o.decision?.cue,...decisionData(o.decision).options.map((q,i)=>String.fromCharCode(65+i)+': '+q.label+(q.kind==='main'?' (shown)':' (alternative)'))].filter(Boolean).join(' ')).join(' · ')}
// Keep a decision at its fraction of the player's displayed running route.
export function decisionRoute(f,old,id,g){
 const start=old?.objects.find(p=>p.id===id),end=f?.objects.find(p=>p.id===id);
 if(!start||!end)return null;
 const route=f.paths?.[id];if(Math.hypot(end.x-start.x,end.y-start.y)<1e-6&&!route?.points?.length)return null;
 return routeSamples(start,end,route,g);
}
export function decisionFraction(samples,p){
 let total=0,best=Infinity,at=0;
 for(let i=1;i<samples.length;i++){
  const a=samples[i-1],b=samples[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(!len)continue;
  const t=clip(((p.x-a.x)*dx+(p.y-a.y)*dy)/(len*len),0,1),dist=Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
  if(dist<best){best=dist;at=total+t*len}total+=len;
 }
 return total?at/total:0;
}
export function decisionLocation(f,o,g,old){
 const d=decisionData(o.decision),route=decisionRoute(f,old,d.playerId,g);
 return route&&d.anchor!==null?sampleRoute(route,d.anchor).point:g.toView(o.x,o.y);
}
export function decisionOverlay(f,g,esc,selected='',ink=false,old=null){
 const col=ink?'#80611b':'#f2d18a',bg=ink?'#fff':'#28583d';
 return decisionList(f).map(o=>{
  const a=decisionLocation(f,o,g,old),start=g.fromView(a.x,a.y),d=decisionData(o.decision),sel=o.id===selected;
  const paths=d.options.map((v,i)=>{
   if(!['run','pass'].includes(v.kind)||!v.points.length)return '';
   const end=v.points.at(-1),ps=routeSamples(start,end,{mode:v.mode,points:v.points.slice(0,-1)},g),b=ps.at(-1),prev=ps.slice(0,-1).reverse().find(p=>Math.hypot(p.x-b.x,p.y-b.y)>1e-4)||a,ang=Math.atan2(b.y-prev.y,b.x-prev.x),u={x:b.x-8*Math.cos(ang-.45),y:b.y-8*Math.sin(ang-.45)},w={x:b.x-8*Math.cos(ang+.45),y:b.y-8*Math.sin(ang+.45)};
   const dash=v.kind==='pass'?' stroke-dasharray="7 6"':'',width=sel?2.5:1.7;
   return '<g pointer-events="none"><path d="'+routeSVG(ps)+'" fill="none" stroke="'+col+'" stroke-width="'+width+'"'+dash+' stroke-linecap="round" stroke-linejoin="round"/><path d="M'+u.x+' '+u.y+'L'+b.x+' '+b.y+'L'+w.x+' '+w.y+'" stroke="'+col+'" stroke-width="'+width+'" fill="none"/></g>'+
    (sel?v.points.map((p,k)=>{const q=g.toView(p.x,p.y);return '<g data-editor-only="true" data-dp-point="'+k+'" data-dp-option="'+i+'" transform="translate('+q.x+' '+q.y+')" cursor="move"><title>Drag to shape alternative; Alt-click to remove</title><circle r="13" fill="transparent"/><circle r="5" fill="'+col+'" stroke="'+bg+'" stroke-width="1.7"/></g>'}).join(''):'');
  }).join('');
  return paths+'<g class="obj" data-id="'+esc(o.id)+'" transform="translate('+a.x+' '+a.y+')"><title>'+esc(o.label+' — '+d.question)+'</title><circle r="15" fill="transparent"/>'+(sel?'<circle data-editor-only="true" r="17" stroke="#d6f77b" stroke-width="1.5" fill="none"/>':'')+'<path d="M0 -13L13 0L0 13L-13 0Z" fill="'+bg+'" stroke="'+col+'" stroke-width="2.4" stroke-linejoin="round"/><text y="4.5" text-anchor="middle" font-weight="bold" font-size="13" fill="'+col+'" pointer-events="none">?</text>'+(sel?'<text y="-21" text-anchor="middle" font-size="13" fill="'+col+'" paint-order="stroke" stroke="'+bg+'" stroke-width="3">'+esc(o.label||'Decision')+'</text>':'')+'</g>';
 }).join('');
}
// An upright tackle wheel is viewed edge-on. Its long axis is its forward rolling direction.
export function donutShape(o,base){
 if(o.type!=='donut')return base;
 if(o.donutState==='down')return '<path d="M-23 0a23 23 0 1 0 46 0a23 23 0 1 0 -46 0M-11 0a11 11 0 1 0 22 0a11 11 0 1 0 -22 0" fill-rule="evenodd" fill="#e8a75d" stroke="#553a28" stroke-width="2"/>';
 const phase=Number(o.rollPhase)||0;
 const tread=[0,11,22].map(offset=>{const y=-16+((offset+phase*34)%33+33)%33;return '<path d="M-6 '+y+'H6" stroke="#8d552e" opacity=".6" stroke-width="1.3"/>'}).join('');
 return '<rect x="-10" y="-23" width="20" height="46" rx="8" fill="#e8a75d" stroke="#553a28" stroke-width="2.2"/><path d="M-4 -16V16M4 -16V16" stroke="#ffd7a2" stroke-width="1.5" opacity=".8"/>'+tread;
}
// In view coordinates, 0 degrees points up; the orientation transform rotates the heading too.
export function donutLane(pad,g,direction='forward'){
 const a=g.toView(pad.x,pad.y),angle=((Number(pad.rot)||0)+g.rotation)*Math.PI/180;
 const h=direction==='reverse'?{x:-Math.sin(angle),y:Math.cos(angle)}:{x:Math.sin(angle),y:-Math.cos(angle)};
 // Allow for the physical footprint of the wheel at the end of the illustrated lane.
 const inset=Math.min(.375*g.scale,Math.min(g.fw,g.fh)/2),loX=g.margin+inset,hiX=g.margin+g.fw-inset,loY=g.margin+inset,hiY=g.margin+g.fh-inset;
 let max=Infinity;
 for(const [v,k,lo,hi] of [[a.x,h.x,loX,hiX],[a.y,h.y,loY,hiY]]){
  if(Math.abs(k)<1e-9){if(v<lo||v>hi)max=0;continue}
  max=Math.min(max,((k>0?hi:lo)-v)/k);
 }
 max=Math.max(0,max);
 return {a,h,max,end:{x:a.x+h.x*max,y:a.y+h.y*max}};
}
export function donutTarget(pad,end,g,direction='forward'){
 if(!end||!Number.isFinite(end.x)||!Number.isFinite(end.y))throw Error('Choose a rolling distance on the pitch.');
 const b=g.toView(end.x,end.y),axis=donutLane(pad,g,'forward');
 const signed=(b.x-axis.a.x)*axis.h.x+(b.y-axis.a.y)*axis.h.y;
 const chosen=direction==='auto'?(signed<0?'reverse':'forward'):direction;
 const lane=donutLane(pad,g,chosen),{a,h,max}=lane;
 const projection=(b.x-a.x)*h.x+(b.y-a.y)*h.y,distance=clip(projection,0,max);
 return {...lane,direction:chosen,distance,target:{x:a.x+h.x*distance,y:a.y+h.y*distance}};
}
export function donutLaneOverlay(pad,g,pointer=null,direction='forward'){
 if(!pad||pad.donutState==='down')return '';
 const directions=direction==='auto'?['forward','reverse']:[direction];
 const paths=directions.map(dir=>{
  const {a,h,max,end}=donutLane(pad,g,dir);if(max<10)return '';
  const offset=Math.min(24,max*.5),start={x:a.x+h.x*offset,y:a.y+h.y*offset};
  return '<path d="M'+start.x+' '+start.y+'L'+end.x+' '+end.y+'" fill="none" stroke="#f6cf80" stroke-opacity=".7" stroke-width="2.5" marker-end="url(#arr)"/>';
 }).join('');
 if(!paths)return '';
 const target=pointer?donutTarget(pad,g.fromView(pointer.x,pointer.y),g,direction):null;
 const info=target&&target.distance>=10?'<circle cx="'+target.target.x+'" cy="'+target.target.y+'" r="7" fill="#ffe2a0" stroke="#483b27" stroke-width="1.5"/><text x="'+(target.target.x+12)+'" y="'+(target.target.y-9)+'" font-size="13" fill="#ffe2a0" paint-order="stroke" stroke="#203b2b" stroke-width="3">'+(target.distance/g.scale).toFixed(1)+' m</text>':'';
 return '<g pointer-events="none">'+paths+info+'</g>';
}
export function trainingTransition(objects,old,next,p,g){
 return objects.map(o=>{
 if(o.type!=='donut')return o;const b=next.objects.find(x=>x.id===o.id),a=old?.objects.find(x=>x.id===o.id);if(!a||!b)return o;
 const A=g.toView(a.x,a.y),B=g.toView(b.x,b.y),distance=Math.hypot(B.x-A.x,B.y-A.y),timing=next.timing?.[o.id]||{start:0,end:100},q=clip((p*100-timing.start)/Math.max(1,timing.end-timing.start),0,1);
 if(distance>1e-6&&['rolling','impact'].includes(b.donutState)){o={...o,rot:b.rot,donutState:b.donutState==='impact'&&q>=.999?'impact':'rolling',rollPhase:distance*q*((B.x-A.x)*Math.sin((b.rot+g.rotation)*Math.PI/180)-(B.y-A.y)*Math.cos((b.rot+g.rotation)*Math.PI/180)<0?-1:1)/(2*Math.PI*.375*g.scale)};if(o.donutState==='rolling')delete o.donutTacklerId;return o}
 if(b.donutState==='down'&&a.donutState==='impact'&&q<.45)return {...o,donutState:'impact',donutTacklerId:a.donutTacklerId,rot:a.rot};
 return o;
 });
}
// A donut impact explicitly makes its selected tackler tackle, regardless of an
// inherited Standing or Ready pose. A pose deliberately pinned in *this* step wins.
// Never show a tackling pose for an unassigned, rolling or reset training pad.
export function trainingPoses(objects,poses){
 for(const o of objects){
  if(o.type!=='donut'||!['impact','down'].includes(o.donutState)||!o.donutTacklerId)continue;
  const player=objects.find(p=>p.id===o.donutTacklerId&&['attacker','defender','neutral','shield','bagplayer'].includes(p.type));
  if(!player||player.posePinned===true)continue;
  if(objects.some(marker=>Array.isArray(marker.members)&&marker.members.some(member=>member.id===player.id)))continue;
  poses.set(player.id,'tackling');
 }
 return poses;
}
// The wheel represents a moving target. Put the tackler at its rear quarter,
// not in front of the roll. This is schematic positioning, not a head/neck technique model.
export function donutRearContact(z,h,approach,g){
 const right={x:-h.y,y:h.x},side=(approach.x-z.x)*right.x+(approach.y-z.y)*right.y<0?-1:1;
 const contact={x:z.x+(-.48*h.x+side*.20*right.x)*g.scale,y:z.y+(-.48*h.y+side*.20*right.y)*g.scale};
 const heading=(Math.atan2(z.x-contact.x,contact.y-z.y)*180/Math.PI-g.rotation+360)%360;
 return {...contact,heading};
}
export function donutSteps(f,id,end,tacklerId,fraction,seconds,g,direction='forward'){const pad=f.objects.find(o=>o.id===id&&o.type==='donut'),dest=end;if(!pad||!dest)throw Error('Select a donut and target.');if(pad.donutState==='down')throw Error('Stand the donut upright before rolling.');const lane=donutTarget(pad,dest,g,direction),a=lane.a,dist=lane.distance,dx=lane.h.x*dist,dy=lane.h.y*dist;if(dist<10)throw Error('Choose a point farther along the selected rolling direction.');const player=f.objects.find(o=>o.id===tacklerId&&['attacker','defender','neutral','shield','bagplayer'].includes(o.type));if(tacklerId&&!player)throw Error('Select an existing tackler.');if(player&&f.objects.some(o=>o.members?.some(m=>m.id===player.id)||o.type==='ball'&&o.ownerId===player.id))throw Error('Choose a player who is free of the ball and other contact formations.');const q=player?clip(Number(fraction)||.65,.1,.95):1,z={x:a.x+dx*q,y:a.y+dy*q},step=stripDecisions(JSON.parse(JSON.stringify(f)));delete step.guide;step.name=player?'Intercept rolling donut':'Roll tackle donut';step.seconds=Math.max(.5,clip(Number(seconds)||2,.5,30)*q);step.notes=player?'Track the moving pad and arrive at its trailing quarter under coach control.':'Roll in a straight line; keep the lane clear.';step.paths={};step.timing={};Object.assign(step.objects.find(o=>o.id===id),g.fromView(z.x,z.y),{rot:pad.rot,donutState:player?'impact':'rolling'});const rollItem=step.objects.find(o=>o.id===id);delete rollItem.donutTacklerId;if(!player)return [step];rollItem.donutTacklerId=player.id;const contact=donutRearContact(z,lane.h,g.toView(player.x,player.y),g);if(contact.x<g.margin||contact.x>g.margin+g.fw||contact.y<g.margin||contact.y>g.margin+g.fh)throw Error('Choose an interception farther from the boundary.');Object.assign(step.objects.find(o=>o.id===player.id),g.fromView(contact.x,contact.y),{rot:contact.heading});const down=JSON.parse(JSON.stringify(step));down.name='Donut stopped';down.seconds=.6;down.notes='Release the pad and reset. No player ruck is implied.';down.objects.find(o=>o.id===id).donutState='down';return [step,down]}
