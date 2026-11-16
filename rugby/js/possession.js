import { routeSamples, sampleRoute } from './routes.js?v=0.4.3';
import { wrapAngle, shortestTurn } from './rotation.js?v=0.3.3';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const canCarry=o=>!!o&&['attacker','defender','neutral','coach','shield','bagplayer'].includes(o.type);
export const findObject=(frame,id)=>frame?.objects.find(o=>o.id===id);
export const carrier=(frame,ball)=>{const o=ball?.ownerId&&findObject(frame,ball.ownerId);return canCarry(o)?o:null};
export function carriedPose(ball,player,g){
 if(!player)return {...ball};
 // Ball follows the carrier's translation and facing direction.
 const p=g.toView(player.x,player.y),a=((Number(player.rot)||0)+g.rotation)*Math.PI/180;
 return {...ball,...g.fromView(p.x+24*Math.cos(a)+16*Math.sin(a),p.y+24*Math.sin(a)-16*Math.cos(a))};
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

// Magnetic pickup is an editor gesture, never an inferred turnover in playback.
export function contactTarget(frame,moving,position,g,radius=32){
 if(!moving)return null;
 const isBall=moving.type==='ball';
 if(isBall&&carrier(frame,moving))return null;
 if(!isBall&&(!canCarry(moving)||frame.objects.some(o=>o.type==='ball'&&o.ownerId===moving.id)))return null;
 const p=g.toView(position.x,position.y);
 let best=null,distance=radius;
 for(const o of frame.objects){
  if(o.id===moving.id)continue;
  if(isBall?(!canCarry(o)||frame.objects.some(b=>b.type==='ball'&&b.ownerId===o.id)):(o.type!=='ball'||!!carrier(frame,o)))continue;
  const v=g.toView(o.x,o.y),d=Math.hypot(p.x-v.x,p.y-v.y);
  if(d<distance){distance=d;best=isBall?{ballId:moving.id,playerId:o.id}:{ballId:o.id,playerId:moving.id}}
 }
 return best;
}
// Propagate into unchanged later steps; preserve a different authored possession,
// missing player/ball, or independently animated free-ball movement.
export function assignPossession(frames,index,ballId,ownerId,g){
 const frame=frames[index],ball=findObject(frame,ballId);if(ball?.type!=='ball')return 0;
 if(ownerId&&!canCarry(findObject(frame,ownerId)))return 0;
 const oldOwner=ball.ownerId||null;
 if(oldOwner===(ownerId||null))return 0;
 const releasePosition=oldOwner?carriedPose(ball,carrier(frame,ball),g):ball;
 let count=0,previous={x:ball.x,y:ball.y};
 for(let i=index;i<frames.length;i++){
  const fr=frames[i],b=findObject(fr,ballId);
  if(b?.type!=='ball'||(b.ownerId||null)!==oldOwner||(ownerId&&!canCarry(findObject(fr,ownerId))))break;
  if(i>index&&!oldOwner&&(Math.hypot(b.x-previous.x,b.y-previous.y)>1e-5||fr.paths?.[ballId]?.points?.length||Object.hasOwn(fr.timing||{},ballId)))break;
  previous={x:b.x,y:b.y};
  if(ownerId){b.ownerId=ownerId;Object.assign(b,carriedPose(b,findObject(fr,ownerId),g))}
  else{delete b.ownerId;Object.assign(b,{x:releasePosition.x,y:releasePosition.y})}
  if(i>index){if(fr.timing)delete fr.timing[ballId];if(fr.paths)delete fr.paths[ballId]}
  count++;
 }
 return count;
}
