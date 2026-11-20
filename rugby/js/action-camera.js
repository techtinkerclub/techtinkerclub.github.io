import {transitionObjects} from './possession.js?v=0.20.78';
// View-only automatic framing: never edits drill dimensions, object positions or paths.
// The full-field view remains the default for precise offside/distance teaching.
const ACTIVE=new Set(['attacker','defender','neutral','coach','shield','bagplayer','ball','donut','sausage','bag','ruck','tackle','maul','scrum']);
const PLAYER=new Set(['attacker','defender','neutral','coach','shield','bagplayer']);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,q)=>a+(b-a)*q;
export const wholeFieldView=g=>({x:0,y:0,width:g.viewWidth,height:g.viewHeight});
const find=(f,id)=>f?.objects?.find(o=>o.id===id);
export function actionViewport(d,g,index){
 const frames=d?.frames||[];
 if(!frames.length)return wholeFieldView(g);
 // Initial still previews the first actual action instead of jumping when Play starts.
 const i=clamp(index===0&&frames.length>1?1:index,0,frames.length-1);
 const f=frames[i],old=frames[i-1];
 const points=[],add=o=>{if(o&&Number.isFinite(o.x)&&Number.isFinite(o.y)){const p=g.toView(o.x,o.y);points.push(p)}};
 const activeIds=new Set();
 // A teaching stage about who stays onside/waits needs the wide context.
 const wide=/offside|onside|who waits|hold your line|retreat|7 metre|7 m/i.test(f.name||'');
 if(wide)for(const o of f.objects.filter(o=>PLAYER.has(o.type)))activeIds.add(o.id);
 for(const o of f.objects){
  if(!ACTIVE.has(o.type))continue;
  const prior=find(old,o.id);
  if(prior){
   const a=g.toView(o.x,o.y),b=g.toView(prior.x,prior.y);
   const distance=Math.hypot(a.x-b.x,a.y-b.y)/g.scale;
   if(distance>.22){add(o);add(prior);activeIds.add(o.id)}
  }
  if(['ruck','tackle','maul','scrum'].includes(o.type)&&o.members?.length){
   add(o);for(const m of o.members)activeIds.add(m.id);
   const ball=find(f,o.breakdown?.ballId);if(ball)add(ball);
  }
 }
 for(const id of activeIds){add(find(f,id));add(find(old,id));const route=f.paths?.[id];for(const pt of route?.points||[])add(pt)}
 for(const b of f.objects.filter(o=>o.type==='ball')){
  add(b);
  if(b.ownerId)add(find(f,b.ownerId));
 }
 // Keep measured arrows/markers visible in the teaching stages that use them.
 for(const mark of f.teachingGuides||[]){add(mark.a);add(mark.b)}
 if(!points.length){
  for(const o of f.objects.filter(o=>PLAYER.has(o.type)||o.type==='ball'||o.type==='donut'))add(o);
 }
 if(!points.length)return wholeFieldView(g);
 const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));
 const minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
 const pad=Math.max(21,1.6*g.scale),ratio=g.viewWidth/g.viewHeight;
 // Fit the entire meaningful action within a steady aspect ratio, avoiding
 // huge zooms (and apparent teleportation) on isolated contact symbols.
 const minWidth=g.viewWidth/3.15,minHeight=g.viewHeight/3.15;
 let width=Math.max(maxX-minX+2*pad,(maxY-minY+2*pad)*ratio,minWidth,minHeight*ratio);
 let height=width/ratio;
 if(height>g.viewHeight){height=g.viewHeight;width=height*ratio}
 if(width>g.viewWidth){width=g.viewWidth;height=width/ratio}
 const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
 return {x:clamp(cx-width/2,0,g.viewWidth-width),y:clamp(cy-height/2,0,g.viewHeight-height),width,height};
}
export function actionViewportAt(d,g,index,progress=1){
 const target=actionViewport(d,g,index);
 if(index<=0)return target;
 // A brief, eased transition prevents hard camera cuts at step boundaries.
 const old=actionViewport(d,g,index-1);
 const u=clamp(progress/.32,0,1),q=u*u*(3-2*u);
 return {x:lerp(old.x,target.x,q),y:lerp(old.y,target.y,q),
  width:lerp(old.width,target.width,q),height:lerp(old.height,target.height,q)};
}

/**
 * FOLLOW ACTION: continuous camera-only tracking of moving rugby actors.
 * Stage framing sets zoom and keeps the whole meaningful action visible;
 * live interpolated positions shift the centre as the play unfolds. Camera
 * movement never alters saved drill coordinates, routes or player facing.
 */
export function followActionViewport(d,g,index,progress=1){
 const frames=d?.frames||[];
 if(index<=0||index>=frames.length)return actionViewport(d,g,Math.max(0,index));
 const stage=actionViewportAt(d,g,index,progress),old=frames[index-1],next=frames[index];
 const t=clamp(progress,0,1),current=transitionObjects(old,next,t,g);
 const moving=new Set();
 for(const end of next.objects||[]){
  if(!PLAYER.has(end.type)&&end.type!=='ball'&&!['ruck','tackle','scrum','maul'].includes(end.type))continue;
  const before=find(old,end.id);
  if(!before)continue;
  const a=g.toView(before.x,before.y),b=g.toView(end.x,end.y);
  if(Math.hypot(b.x-a.x,b.y-a.y)>Math.max(3,.2*g.scale)||end.type==='ball'&&before.ownerId!==end.ownerId)
   moving.add(end.id);
 }
 const positions=[];
 for(const o of current){
  if(!o||!moving.has(o.id)||!Number.isFinite(o.x)||!Number.isFinite(o.y))continue;
  const p=g.toView(o.x,o.y);if(!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
  positions.push({...p,weight:o.type==='ball'?1.5:1});
 }
 if(!positions.length)return stage;
 const sum=positions.reduce((v,p)=>v+p.weight,0);
 const tx=positions.reduce((v,p)=>v+p.x*p.weight,0)/sum;
 const ty=positions.reduce((v,p)=>v+p.y*p.weight,0)/sum;
 const stageX=stage.x+stage.width/2,stageY=stage.y+stage.height/2;
 // Bias towards the running ball/players, but retain wider tactical context.
 const cx=lerp(stageX,tx,.68),cy=lerp(stageY,ty,.68);
 const view={x:clamp(cx-stage.width/2,0,Math.max(0,g.viewWidth-stage.width)),
  y:clamp(cy-stage.height/2,0,Math.max(0,g.viewHeight-stage.height)),
  width:stage.width,height:stage.height};
 // A short ease at step boundaries avoids an abrupt camera jump.
 if(index>1&&t<.22){
  const prev=followActionViewport(d,g,index-1,1),u=t/.22,q=u*u*(3-2*u);
  return {x:lerp(prev.x,view.x,q),y:lerp(prev.y,view.y,q),
   width:lerp(prev.width,view.width,q),height:lerp(prev.height,view.height,q)};
 }
 return view;
}
