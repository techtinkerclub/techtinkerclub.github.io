import { routeSamples, sampleRoute } from './routes.js?v=0.4.3';
import { wrapAngle, shortestTurn } from './rotation.js?v=0.3.3';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const canCarry=o=>!!o&&['attacker','defender','neutral','coach','shield','bagplayer'].includes(o.type);
export const findObject=(frame,id)=>frame?.objects.find(o=>o.id===id);
export const carrier=(frame,ball)=>{const o=ball?.ownerId&&findObject(frame,ball.ownerId);return canCarry(o)?o:null};
export function carriedPose(ball,player,g){
 if(!player)return {...ball};
 // A fixed offset in the logical pitch keeps the small ball symbol visible beside its carrier.
 const p=g.toView(player.x,player.y),right=g.orientation==='right';
 return {...ball,...g.fromView(p.x+(right?16:24),p.y+(right?24:-16))};
}
export function syncPossession(frames,g){
 for(const frame of frames)for(const o of frame.objects){
  if(o.type!=='ball'){delete o.ownerId;continue}
  const p=carrier(frame,o);
  if(p)Object.assign(o,carriedPose(o,p,g));else delete o.ownerId;
 }
 return frames;
}
export function frameObjects(frame,g){
 return frame.objects.map(o=>o.type==='ball'?carriedPose(o,carrier(frame,o),g):o);
}
export function objectPose(old,next,id,p,g){
 const a=findObject(old,id),b=findObject(next,id);
 if(!a)return b?{...b}:null;if(!b)return {...a};
 const t=next.timing?.[id]||{start:0,end:100},q=clamp((p*100-t.start)/Math.max(1,t.end-t.start),0,1);
 const route=next.paths?.[id],s=sampleRoute(routeSamples(a,b,route,g),q),pos=g.fromView(s.point.x,s.point.y);
 return {...b,...pos,rot:route?.follow&&s.angle!==null&&p*100>=t.start?wrapAngle(s.angle-g.rotation):a.rot+shortestTurn(a.rot,b.rot)*q};
}
export function ballMovement(old,next,ball,g){
 const a=findObject(old,ball.id);if(!a)return null;
 const from=carrier(old,a),to=carrier(next,ball);
 if(from&&to&&from.id===to.id)return null;
 const t=next.timing?.[ball.id]||{start:0,end:100};
 const start=from?carriedPose(a,objectPose(old,next,from.id,t.start/100,g),g):a;
 const end=to?carriedPose(ball,objectPose(old,next,to.id,t.end/100,g),g):ball;
 return {start,end,pass:!!(from&&to),from,to,timing:t};
}
export function movementFor(old,next,o,g){
 if(!old)return null;
 if(o.type==='ball')return ballMovement(old,next,o,g);
 const a=findObject(old,o.id);return a?{start:a,end:o,pass:false}:null;
}
export function ballPose(old,next,ball,p,g){
 const a=findObject(old,ball.id);if(!a)return p>=1?carriedPose(ball,carrier(next,ball),g):null;
 const from=carrier(old,a),to=carrier(next,ball);
 if(from&&to&&from.id===to.id)return carriedPose(ball,objectPose(old,next,to.id,p,g),g);
 const m=ballMovement(old,next,ball,g),t=m.timing;
 if(from&&p*100<=t.start)return carriedPose(a,objectPose(old,next,from.id,p,g),g);
 if(to&&p*100>=t.end)return carriedPose(ball,objectPose(old,next,to.id,p,g),g);
 const q=clamp((p*100-t.start)/Math.max(1,t.end-t.start),0,1);
 const s=sampleRoute(routeSamples(m.start,m.end,next.paths?.[ball.id],g),q);
 return {...ball,...g.fromView(s.point.x,s.point.y),rot:a.rot+shortestTurn(a.rot,ball.rot)*q,ownerId:undefined};
}
export function transitionObjects(old,next,p,g){
 return next.objects.map(o=>{
  if(!findObject(old,o.id)&&p<1)return null;
  return o.type==='ball'?ballPose(old,next,o,p,g):objectPose(old,next,o.id,p,g);
 }).filter(Boolean).concat(p<1?frameObjects(old,g).filter(o=>!findObject(next,o.id)):[]);
}
