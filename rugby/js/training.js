import {routeSamples,routeSVG,sampleRoute} from './routes.js?v=0.4.3';
// Schematic training annotations, independent of actual animation routes.
const clip=(v,a,b)=>Math.max(a,Math.min(b,v)),str=(v,n)=>String(v??'').slice(0,n);
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?{x:clip(p.x,42,858),y:clip(p.y,37,503)}:null;
export function decisionData(raw){raw=raw||{};return {playerId:str(raw.playerId,200),anchor:Number.isFinite(raw.anchor)?clip(raw.anchor,0,1):null,question:str(raw.question,500),cue:str(raw.cue,1000),options:(Array.isArray(raw.options)?raw.options:[]).slice(0,6).map((q,i)=>({id:'option-'+(i+1),label:str(q?.label,200),kind:['main','run','pass','note'].includes(q?.kind)?q.kind:'run',mode:q?.mode==='corners'?'corners':'smooth',points:(Array.isArray(q?.points)?q.points:[]).slice(0,12).map(point).filter(Boolean)}))}}
export function copyTraining(src,dst){if(src.type==='decision')dst.decision=decisionData(src.decision);if(src.type==='donut'){dst.donutState=['rolling','impact','down'].includes(src.donutState)?src.donutState:'ready';if(['impact','down'].includes(dst.donutState)&&typeof src.donutTacklerId==='string')dst.donutTacklerId=src.donutTacklerId.slice(0,200);else delete dst.donutTacklerId;}return dst}
export function cleanTraining(f){for(const x of f.objects){if(x.type==='decision'||x.type==='donut'){copyTraining(x,x);if(x.type==='decision'&&!f.objects.some(p=>p.id===x.decision.playerId))x.decision.playerId='';if(x.type==='donut'&&!f.objects.some(p=>p.id===x.donutTacklerId))delete x.donutTacklerId;if(f.paths)delete f.paths[x.id];if(x.type==='decision'&&f.timing)delete f.timing[x.id]}}return f}
export function stripDecisions(f){f.objects=f.objects.filter(o=>o.type!=='decision');return f}
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
  return paths+'<g class="obj" data-id="'+esc(o.id)+'" transform="translate('+a.x+' '+a.y+')"><title>'+esc(o.label+' — '+d.question)+'</title><circle r="15" fill="transparent"/>'+(sel?'<circle data-editor-only="true" r="13" stroke="#d6f77b" stroke-width="1.5" fill="none"/>':'')+'<circle r="7" fill="'+bg+'" stroke="'+col+'" stroke-width="1.8"/><text y="3.4" text-anchor="middle" font-weight="bold" font-size="10" fill="'+col+'" pointer-events="none">?</text>'+(sel?'<text y="-15" text-anchor="middle" font-size="11" fill="'+col+'" paint-order="stroke" stroke="'+bg+'" stroke-width="3">'+esc(o.label||'Decision')+'</text>':'')+'</g>';
 }).join('');
}
export function donutShape(o,base){
 if(o.type!=='donut')return base;
 if(o.donutState==='down')return '<path d="M-21 0a21 17 0 1 0 42 0a21 17 0 1 0 -42 0M-10 0a10 8 0 1 0 20 0a10 8 0 1 0 -20 0" fill-rule="evenodd" fill="#e8a75d" stroke="#553a28" stroke-width="2"/>';
 // The upright ring is seen edge-on from above; its axle lies across the rolling direction.
 const phase=Number(o.rollPhase)||0;const stripe=-4+8*((phase%1+1)%1);
 return '<rect x="-23" y="-8" width="46" height="16" rx="7" fill="#e8a75d" stroke="#553a28" stroke-width="2"/><path d="M-15 '+stripe+'H15" stroke="#fff0d6" stroke-width="2" opacity=".85"/>';
}
export function trainingTransition(objects,old,next,p,g){
 return objects.map(o=>{
 if(o.type!=='donut')return o;const b=next.objects.find(x=>x.id===o.id),a=old?.objects.find(x=>x.id===o.id);if(!a||!b)return o;
 const A=g.toView(a.x,a.y),B=g.toView(b.x,b.y),distance=Math.hypot(B.x-A.x,B.y-A.y),timing=next.timing?.[o.id]||{start:0,end:100},q=clip((p*100-timing.start)/Math.max(1,timing.end-timing.start),0,1);
 if(distance>1e-6&&['rolling','impact'].includes(b.donutState)){o={...o,rot:b.rot,donutState:b.donutState==='impact'&&q>=.999?'impact':'rolling',rollPhase:distance*q/(2*Math.PI*21)};if(o.donutState==='rolling')delete o.donutTacklerId;return o}
 if(b.donutState==='down'&&a.donutState==='impact'&&q<.45)return {...o,donutState:'impact',donutTacklerId:a.donutTacklerId,rot:a.rot};
 return o;
 });
}
export function trainingPoses(objects,poses){for(const o of objects)if(o.type==='donut'&&['impact','down'].includes(o.donutState)&&o.donutTacklerId&&!poses.has(o.donutTacklerId))poses.set(o.donutTacklerId,'tackling');return poses}
export function donutSteps(f,id,end,tacklerId,fraction,seconds,g){const pad=f.objects.find(o=>o.id===id&&o.type==='donut'),dest=point(end);if(!pad||!dest)throw Error('Select a donut and target.');const a=g.toView(pad.x,pad.y),b=g.toView(dest.x,dest.y),dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);if(dist<10)throw Error('Choose a target farther away.');const player=f.objects.find(o=>o.id===tacklerId&&['attacker','defender','neutral','shield','bagplayer'].includes(o.type));if(tacklerId&&!player)throw Error('Select an existing tackler.');if(player&&f.objects.some(o=>o.members?.some(m=>m.id===player.id)||o.type==='ball'&&o.ownerId===player.id))throw Error('Choose a player who is free of the ball and other contact formations.');const q=player?clip(Number(fraction)||.65,.1,.95):1,z={x:a.x+dx*q,y:a.y+dy*q},step=stripDecisions(JSON.parse(JSON.stringify(f)));delete step.guide;step.name=player?'Intercept rolling donut':'Roll tackle donut';step.seconds=Math.max(.5,clip(Number(seconds)||2,.5,30)*q);step.notes=player?'Track the moving pad; intercept under coach control.':'Roll in a straight line; keep the lane clear.';step.paths={};step.timing={};Object.assign(step.objects.find(o=>o.id===id),g.fromView(z.x,z.y),{rot:(Math.atan2(dx,-dy)*180/Math.PI-g.rotation+360)%360,donutState:player?'impact':'rolling'});const rollItem=step.objects.find(o=>o.id===id);delete rollItem.donutTacklerId;if(!player)return [step];rollItem.donutTacklerId=player.id;const v=g.toView(player.x,player.y),len=Math.hypot(v.x-z.x,v.y-z.y),u=len>1?{x:(v.x-z.x)/len,y:(v.y-z.y)/len}:{x:dy/dist,y:-dx/dist},contact={x:z.x+u.x*29,y:z.y+u.y*29};if(contact.x<g.margin||contact.x>g.margin+g.fw||contact.y<g.margin||contact.y>g.margin+g.fh)throw Error('Choose an interception farther from the boundary.');Object.assign(step.objects.find(o=>o.id===player.id),g.fromView(contact.x,contact.y),{rot:(Math.atan2(-u.x,u.y)*180/Math.PI-g.rotation+360)%360});const down=JSON.parse(JSON.stringify(step));down.name='Donut stopped';down.seconds=.6;down.notes='Release the pad and reset. No player ruck is implied.';down.objects.find(o=>o.id===id).donutState='down';return [step,down]}
