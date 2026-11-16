import { routeSamples, sampleRoute } from './routes.js?v=0.4.3';
import { wrapAngle, shortestTurn } from './rotation.js?v=0.3.3';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const canCarry=o=>!!o&&['attacker','defender','neutral','coach','shield','bagplayer'].includes(o.type);
export const findObject=(frame,id)=>frame?.objects.find(o=>o.id===id);
export const carrier=(frame,ball)=>{const o=ball?.ownerId&&findObject(frame,ball.ownerId);return canCarry(o)?o:null};
export const isShield=o=>o?.type==='shieldItem';
export function shieldPose(item,player,g){if(!player)return {...item};const p=g.toView(player.x,player.y),a=((Number(player.rot)||0)+g.rotation)*Math.PI/180;return {...item,...g.fromView(p.x+16*Math.sin(a),p.y-16*Math.cos(a)),rot:player.rot}}
export function assignShield(frames,index,id,ownerId,g,originalPosition=null){
 const item=findObject(frames[index],id);if(!isShield(item))return 0;const old=item.ownerId||null;
 if(old===(ownerId||null))return 0;if(ownerId&&!canCarry(findObject(frames[index],ownerId)))return 0;
 const drop=shieldPose(item,carrier(frames[index],item),g);let count=0,previous=originalPosition||item;
 for(let i=index;i<frames.length;i++){const f=frames[i],s=findObject(f,id),p=ownerId&&findObject(f,ownerId);
  if(!isShield(s)||(s.ownerId||null)!==old||(ownerId&&(!canCarry(p)||f.objects.some(o=>isShield(o)&&o.id!==id&&o.ownerId===ownerId))))break;
  if(i>index&&!old&&(Math.hypot(s.x-previous.x,s.y-previous.y)>1e-5||f.paths?.[id]?.points?.length||Object.hasOwn(f.timing||{},id)))break;
  previous=i===index&&originalPosition?originalPosition:{x:s.x,y:s.y};if(ownerId){s.ownerId=ownerId;Object.assign(s,shieldPose(s,p,g))}else{delete s.ownerId;Object.assign(s,{x:drop.x,y:drop.y,rot:drop.rot})}
  if(i>index){if(f.timing)delete f.timing[id];if(f.paths)delete f.paths[id]}count++
 }return count
}
export function shieldTarget(frame,item,position,g){if(!isShield(item)||carrier(frame,item))return null;const p=g.toView(position.x,position.y);let best=null,d=32;for(const o of frame.objects){if(!canCarry(o)||frame.objects.some(s=>isShield(s)&&s.ownerId===o.id))continue;const q=g.toView(o.x,o.y),dist=Math.hypot(p.x-q.x,p.y-q.y);if(dist<d){d=dist;best={shieldId:item.id,playerId:o.id}}}return best}
export const carrySide=ball=>ball?.carrySide==='left'?'left':'right';
const lateral=ball=>carrySide(ball)==='left'?-11:11;
export function carriedPose(ball,player,g,sideOffset=lateral(ball)){
 if(!player)return {...ball};
 // Relative to the player's facing direction, not the screen. The ball overlaps the front shoulder.
 const p=g.toView(player.x,player.y),a=((Number(player.rot)||0)+g.rotation)*Math.PI/180;
 return {...ball,...g.fromView(p.x+sideOffset*Math.cos(a)+12*Math.sin(a),p.y+sideOffset*Math.sin(a)-12*Math.cos(a))};
}
export function setCarrySide(frames,index,ballId,side,g){
 const ball=findObject(frames[index],ballId),owner=carrier(frames[index],ball);
 if(!owner||!['left','right'].includes(side))return 0;
 const prior=carrySide(ball);if(prior===side)return 0;
 let count=0;
 for(let i=index;i<frames.length;i++){
  const fr=frames[i],b=findObject(fr,ballId),p=carrier(fr,b);
  if(!p||p.id!==owner.id||carrySide(b)!==prior)break;
  b.carrySide=side;Object.assign(b,carriedPose(b,p,g));count++;
 }
 return count;
}
export function syncPossession(frames,g){
 for(const frame of frames)for(const o of frame.objects){
  if(o.type!=='ball'&&!isShield(o)){delete o.ownerId;continue}
  const p=carrier(frame,o);
  if(p)Object.assign(o,isShield(o)?shieldPose(o,p,g):carriedPose(o,p,g));else delete o.ownerId;
 }
 return frames;
}
export function frameObjects(frame,g){
 return frame.objects.map(o=>o.type==='ball'?carriedPose(o,carrier(frame,o),g):isShield(o)?shieldPose(o,carrier(frame,o),g):o);
}
function rawObjectPose(old,next,id,p,g){
 const a=findObject(old,id),b=findObject(next,id);
 if(!a)return b?{...b}:null;if(!b)return {...a};
 const t=next.timing?.[id]||{start:0,end:100},q=clamp((p*100-t.start)/Math.max(1,t.end-t.start),0,1);
 const route=next.paths?.[id],s=sampleRoute(routeSamples(a,b,route,g),q),pos=g.fromView(s.point.x,s.point.y);
 return {...b,...pos,rot:route?.follow&&s.angle!==null&&p*100>=t.start?wrapAngle(s.angle-g.rotation):a.rot+shortestTurn(a.rot,b.rot)*q};
}
// Find the first visual contact between the two authored approach paths.
// No collision physics or automatic tackle inference: only newly authored tackle formations.
export function tackleImpacts(old,next,g){
 const events=[];
 for(const marker of next.objects){
  if(marker.type!=='tackle'||marker.breakdown&&marker.breakdown.phase!=='tackle')continue;
  const a=marker.members?.find(m=>m.pose==='grounded')?.id,d=marker.members?.find(m=>m.pose==='tackling')?.id;
  if(!a||!d||!findObject(old,a)||!findObject(old,d))continue;
  const prior=findObject(old,marker.id);
  if(prior?.type==='tackle'&&prior.members?.some(m=>m.id===a&&m.pose==='grounded')&&prior.members?.some(m=>m.id===d&&m.pose==='tackling'))continue;
  const distance=t=>{const x=rawObjectPose(old,next,a,t,g),y=rawObjectPose(old,next,d,t,g),u=g.toView(x.x,x.y),v=g.toView(y.x,y.y);return Math.hypot(u.x-v.x,u.y-v.y)};
  const radius=34;let time=1;
  if(distance(0)<=radius)time=0;
  else for(let i=1;i<=40;i++)if(distance(i/40)<=radius){let lo=(i-1)/40,hi=i/40;for(let j=0;j<10;j++){const mid=(lo+hi)/2;if(distance(mid)<=radius)hi=mid;else lo=mid}time=hi;break}
  events.push({marker:marker.id,players:[a,d],time});
 }
 return events;
}
export function objectPose(old,next,id,p,g,events=null){
 const pose=rawObjectPose(old,next,id,p,g),a=findObject(old,id),b=findObject(next,id);
 if(!pose||!a||!b)return pose;
 const impact=(events??tackleImpacts(old,next,g)).find(e=>e.players.includes(id));
 if(!impact)return pose;
 const t=impact.time,route=next.paths?.[id];
 // Keep the standing orientation during approach; a followed run uses its path tangent.
 const facing=route?.follow?rawObjectPose(old,next,id,Math.min(p,t),g).rot:a.rot;
 if(p<t)pose.rot=facing;
 else{const q=t>=1?1:clamp((p-t)/(1-t),0,1),smooth=q*q*(3-2*q);pose.rot=facing+shortestTurn(facing,b.rot)*smooth}
 return pose;
}
export function ballMovement(old,next,ball,g,events=null){
 const a=findObject(old,ball.id);if(!a)return null;
 const from=carrier(old,a),to=carrier(next,ball);
 if(from&&to&&from.id===to.id)return null;
 const t=next.timing?.[ball.id]||{start:0,end:100};
 const start=from?carriedPose(a,objectPose(old,next,from.id,t.start/100,g,events),g):a;
 const end=to?carriedPose(ball,objectPose(old,next,to.id,t.end/100,g,events),g):ball;
 return {start,end,pass:!!(from&&to)&&!['turnover','set','handover','throw'].includes(ball.transferKind),turnover:!!to&&ball.transferKind==='turnover',instant:['set','handover'].includes(ball.transferKind),presentation:ball.transferKind==='presentation'&&!to,from,to,timing:t};
}
export function movementFor(old,next,o,g){
 if(!old)return null;
 if(o.type==='ball')return ballMovement(old,next,o,g);
 if(isShield(o)){const a=findObject(old,o.id);return a&&!carrier(old,a)&&!carrier(next,o)?{start:a,end:o,pass:false}:null}
 const a=findObject(old,o.id);return a?{start:a,end:o,pass:false}:null;
}
export function ballPose(old,next,ball,p,g,events=null){
 const a=findObject(old,ball.id);if(!a)return p>=1?carriedPose(ball,carrier(next,ball),g):null;
 const from=carrier(old,a),to=carrier(next,ball);
 if(from&&to&&from.id===to.id){
  // A change of hand stays attached, and creates no pass trajectory.
  const s=clamp(p,0,1),eased=s*s*(3-2*s);
  return carriedPose(ball,objectPose(old,next,to.id,p,g,events),g,lateral(a)+(lateral(ball)-lateral(a))*eased);
 }
 const m=ballMovement(old,next,ball,g,events),t=m.timing;
 if(m.turnover||m.instant){if(p*100>=t.end)return to?carriedPose(ball,objectPose(old,next,to.id,p,g,events),g):{...ball};return from?carriedPose(a,objectPose(old,next,from.id,p,g,events),g):{...a}}
 if(from&&p*100<=t.start)return carriedPose(a,objectPose(old,next,from.id,p,g,events),g);
 if(to&&p*100>=t.end)return carriedPose(ball,objectPose(old,next,to.id,p,g,events),g);
 const q=clamp((p*100-t.start)/Math.max(1,t.end-t.start),0,1);
 const s=sampleRoute(routeSamples(m.start,m.end,next.paths?.[ball.id],g),q);
 return {...ball,...g.fromView(s.point.x,s.point.y),rot:a.rot+shortestTurn(a.rot,ball.rot)*q,ownerId:undefined};
}
export function shieldTransition(old,next,item,p,g,events=null){
 const a=findObject(old,item.id);if(!a)return p>=1?shieldPose(item,carrier(next,item),g):null;
 const from=carrier(old,a),to=carrier(next,item);
 if(from&&to&&from.id===to.id)return shieldPose(item,objectPose(old,next,to.id,p,g,events),g);
 if(!from&&!to)return objectPose(old,next,item.id,p,g,events);
 const end=next.timing?.[item.id]?.end??100;
 if(p*100>=end)return to?shieldPose(item,objectPose(old,next,to.id,p,g,events),g):{...item};
 return from?shieldPose(a,objectPose(old,next,from.id,p,g,events),g):{...a};
}
export function transitionObjects(old,next,p,g){
 const events=tackleImpacts(old,next,g);
 return next.objects.map(o=>{
  const prior=findObject(old,o.id),impact=events.find(e=>e.marker===o.id);
  const switchAt=impact?impact.time:o.breakdown?.phase==='release'?.15:.65;
  if(!prior&&p<1&&!(Array.isArray(o.members)&&p>=(impact?switchAt:.78)))return null;
  if(o.type==='ball')return ballPose(old,next,o,p,g,events);
  if(isShield(o))return shieldTransition(old,next,o,p,g,events);
  const pose=objectPose(old,next,o.id,p,g,events);
  if(Array.isArray(o.members)||Array.isArray(prior?.members)){
   pose.members=p>=switchAt?o.members:prior?.members;
   if(prior&&p<switchAt){pose.type=prior.type;pose.label=prior.label;pose.breakdown=prior.breakdown}
  }
  return pose;
 }).filter(Boolean).concat(p<1?frameObjects(old,g).filter(o=>!findObject(next,o.id)):[]);
}

// Magnetic pickup is an editor gesture, never an inferred turnover in playback.
export function contactTarget(frame,moving,position,g,radius=32){
 if(!moving)return null;
 const isBall=moving.type==='ball';
 if(isBall&&(carrier(frame,moving)||['presented','grounded'].includes(moving.groundState)))return null;
 if(!isBall&&(!canCarry(moving)||frame.objects.some(o=>o.type==='ball'&&o.ownerId===moving.id)))return null;
 const p=g.toView(position.x,position.y);
 let best=null,distance=radius;
 for(const o of frame.objects){
  if(o.id===moving.id)continue;
  if(isBall?(!canCarry(o)||frame.objects.some(b=>b.type==='ball'&&b.ownerId===o.id)):(o.type!=='ball'||!!carrier(frame,o)||['presented','grounded'].includes(o.groundState)))continue;
  const v=g.toView(o.x,o.y),d=Math.hypot(p.x-v.x,p.y-v.y);
  if(d<distance){distance=d;best=isBall?{ballId:moving.id,playerId:o.id}:{ballId:o.id,playerId:moving.id}}
 }
 return best;
}
// Propagate into unchanged later steps; preserve a different authored possession,
// missing player/ball, or independently animated free-ball movement.
export function assignPossession(frames,index,ballId,ownerId,g,originalPosition=null){
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
  previous=i===index&&originalPosition?originalPosition:{x:b.x,y:b.y};
  if(ownerId){b.ownerId=ownerId;delete b.groundState;Object.assign(b,carriedPose(b,findObject(fr,ownerId),g))}
  else{delete b.ownerId;Object.assign(b,{x:releasePosition.x,y:releasePosition.y})}
  if(i>index){delete b.transferKind;if(fr.timing)delete fr.timing[ballId];if(fr.paths)delete fr.paths[ballId]}
  count++;
 }
 return count;
}
