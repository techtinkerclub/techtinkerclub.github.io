import {isDiagramObject} from './diagram-shapes.js?v=0.12.10';
import {textVisible} from './text-label.js?v=0.12.8';
import {visualUnit} from './symbol-scale.js?v=0.12.23';
import { routeSamples, sampleRoute } from './routes.js?v=0.4.3';
import { wrapAngle, shortestTurn } from './rotation.js?v=0.3.3';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const canCarry=o=>!!o&&['attacker','defender','neutral','coach','shield','bagplayer'].includes(o.type);
export const findObject=(frame,id)=>frame?.objects.find(o=>o.id===id);
export const carrier=(frame,ball)=>{const o=ball?.ownerId&&findObject(frame,ball.ownerId);return canCarry(o)?o:null};
export const isShield=o=>o?.type==='shieldItem';
export function shieldPose(item,player,g){if(!player)return {...item};const p=g.toView(player.x,player.y),a=((Number(player.rot)||0)+g.rotation)*Math.PI/180;return {...item,...g.fromView(p.x+16*visualUnit(g)*Math.sin(a),p.y-16*visualUnit(g)*Math.cos(a)),rot:player.rot}}
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
 return {...ball,...g.fromView(p.x+visualUnit(g)*(sideOffset*Math.cos(a)+12*Math.sin(a)),p.y+visualUnit(g)*(sideOffset*Math.sin(a)-12*Math.cos(a)))};
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
// Resolve authored formations before standalone player poses. A departing player must
// regain their feet before translating; do not let the retired marker override that pose.
const LOW_POSES=new Set(['grounded','tackling','kneeling','recovering','crouched','bound']);
const formationPose=(frame,id)=>{for(const marker of frame?.objects||[]){const m=marker.members?.find(m=>m.id===id);if(m)return m.pose;if(marker.type==='donut'&&['impact','down'].includes(marker.donutState)&&marker.donutTacklerId===id)return 'tackling'}return null};
const authoredPose=(frame,id)=>formationPose(frame,id)||findObject(frame,id)?.playerPose||'standing';
const travels=(a,b,next)=>!!a&&!!b&&(Math.hypot(b.x-a.x,b.y-a.y)>1e-5||!!next.paths?.[b.id]?.points?.length);
function destinationPose(old,next,id){
 const a=findObject(old,id),b=findObject(next,id),formed=formationPose(next,id);
 if(formed)return formed;
 const current=b?.playerPose||'standing',prior=authoredPose(old,id);
 if(prior==='ready'&&travels(a,b,next)&&current==='ready'&&b?.posePinned!==true)return 'standing';
  if(b?.posePinned!==true&&travels(a,b,next)&&LOW_POSES.has(prior)&&(current===prior||current==='recovering'))return 'standing';
 return current;
}
// Clean inherited standalone poses in imported/editor data, without changing coordinates,
// timings, active formations or a pose explicitly selected by the coach.
export function normaliseRecoveryPoses(frames){
 let count=0;const inherited=new Map();
 for(let i=1;i<frames.length;i++){
  const old=frames[i-1],next=frames[i];
  for(const id of inherited.keys())if(!findObject(next,id))inherited.delete(id);
  for(const player of next.objects){
   if(!canCarry(player))continue;
   if(formationPose(next,player.id)||player.posePinned===true){inherited.delete(player.id);continue}
   const copied=inherited.get(player.id),raw=player.playerPose;
   let pose=destinationPose(old,next,player.id);
   if(copied&&raw===copied)pose='standing';else if(copied)inherited.delete(player.id);
   if(raw&&raw!==pose){inherited.set(player.id,raw);player.playerPose=pose;delete player.posePinned;count++}
  }
 }return count;
}
function recoveryPlan(old,next,id){
 const a=findObject(old,id),b=findObject(next,id);if(!canCarry(a)||!canCarry(b))return null;
 const prior=authoredPose(old,id),target=destinationPose(old,next,id),moving=travels(a,b,next);
 if(!LOW_POSES.has(prior)||LOW_POSES.has(target)&&target!=='recovering'||b.posePinned===true&&LOW_POSES.has(target))return null;
 // Keep intentional stationary recovery poses. Explicitly pinned floor poses remain authored.
 const t=next.timing?.[id]||{start:0,end:100},start=clamp(t.start/100,0,.99),end=clamp(t.end/100,start+.01,1);
 const pause=Math.min((end-start)*.3,.24/Math.max(.5,Number(next.seconds)||2));
 return {prior,target,start,ready:start+pause,end,moving};
}
// If a coach drags a player out of a copied formation in a later step, detach
// only that player. Moving a whole formation or editing an initial layout is not a release.
export function releaseMovedPlayer(old,next,id,g){
 const a=findObject(old,id),b=findObject(next,id);if(!canCarry(a)||!canCarry(b)||!travels(a,b,next))return false;
 const A=g.toView(a.x,a.y),B=g.toView(b.x,b.y);let released=false;
 for(const m of next.objects){
  if(!Array.isArray(m.members))continue;
  const prev=findObject(old,m.id),member=m.members.find(q=>q.id===id);
  if(!member||!LOW_POSES.has(member.pose)||!prev?.members?.some(q=>q.id===id&&q.pose===member.pose)||prev.type!==m.type||prev.breakdown?.phase!==m.breakdown?.phase)continue;
  const P=g.toView(prev.x,prev.y),M=g.toView(m.x,m.y);
  if(Math.hypot(P.x-M.x,P.y-M.y)>2||Math.hypot(A.x-B.x,A.y-B.y)<32||Math.hypot(B.x-M.x,B.y-M.y)<45)continue;
  m.members=m.members.filter(q=>q.id!==id);b.playerPose='standing';delete b.posePinned;released=true;
  // A manually edited formation is no longer an intact guided phase.
  if(m.breakdown)delete m.breakdown;if(next.guide&&m.id===next.guide.id+'-formation')delete next.guide;
 }
 if(!formationPose(next,id)&&!b.posePinned&&LOW_POSES.has(authoredPose(old,id))&&LOW_POSES.has(b.playerPose)){b.playerPose='standing';released=true}
 return released;
}
function rawObjectPose(old,next,id,p,g){
 const a=findObject(old,id),b=findObject(next,id);
 if(!a)return b?{...b}:null;if(!b)return {...a};
 const t=next.timing?.[id]||{start:0,end:100},recovery=recoveryPlan(old,next,id),q=recovery?.moving?clamp((p-recovery.ready)/Math.max(.0001,recovery.end-recovery.ready),0,1):clamp((p*100-t.start)/Math.max(1,t.end-t.start),0,1);
 const route=next.paths?.[id],s=sampleRoute(routeSamples(a,b,route,g),q),pos=g.fromView(s.point.x,s.point.y);
 return {...b,...pos,rot:route?.follow&&s.angle!==null&&p*100>=t.start?wrapAngle(s.angle-g.rotation):a.rot+shortestTurn(a.rot,b.rot)*q};
}
// An intact formation can travel along the contact marker's route. Each
// participant keeps their relative position as the whole contest shifts;
// there is no inferred tackle or automated clearout. This only applies when
// the coach has moved the marker and members together in the destination step.
function formationRoutePosition(old,next,id,p,g){
 const from=findObject(old,id),to=findObject(next,id);
 if(!from||!to)return null;
 for(const marker of next.objects){
  if(!['ruck','tackle','maul','scrum'].includes(marker.type)||!next.paths?.[marker.id]?.points?.length)continue;
  const previous=findObject(old,marker.id);
  if(!previous||previous.type!==marker.type)continue;
  const member=marker.members?.some(m=>m.id===id)&&previous.members?.some(m=>m.id===id);
  const linkedBall=to.type==='ball'&&marker.breakdown?.ballId===id&&previous.breakdown?.ballId===id&&!to.ownerId&&!from.ownerId;
  if(!member&&!linkedBall)continue;
  if(next.paths?.[id]?.points?.length||Object.hasOwn(next.timing||{},id))continue;
  if(Math.hypot((to.x-from.x)-(marker.x-previous.x),(to.y-from.y)-(marker.y-previous.y))>0.0001)continue;
  const moving=rawObjectPose(old,next,marker.id,p,g);
  return {x:from.x+moving.x-previous.x,y:from.y+moving.y-previous.y};
 }
 return null;
}
// Find the first visual contact between the two authored approach paths.
// No collision physics or automatic tackle inference: only newly authored tackle formations.
export function tackleImpacts(old,next,g){
 const events=[];
 for(const marker of next.objects){
  if(marker.type!=='tackle'||marker.breakdown&&marker.breakdown.phase!=='tackle')continue;
  const a=marker.members?.find(m=>m.pose==='grounded')?.id,ds=(marker.members||[]).filter(m=>m.pose==='tackling').map(m=>m.id);
  if(!a||!findObject(old,a)||!ds.length)continue;
  const prior=findObject(old,marker.id);
  for(const d of ds){
   if(!findObject(old,d)||prior?.members?.some(m=>m.id===d&&m.pose==='tackling'))continue;
   const distance=t=>{const x=rawObjectPose(old,next,a,t,g),y=rawObjectPose(old,next,d,t,g),u=g.toView(x.x,x.y),v=g.toView(y.x,y.y);return Math.hypot(u.x-v.x,u.y-v.y)};
   let time=1;if(distance(0)<=34)time=0;
   else for(let i=1;i<=40;i++)if(distance(i/40)<=34){let lo=(i-1)/40,hi=i/40;for(let j=0;j<10;j++){const mid=(lo+hi)/2;if(distance(mid)<=34)hi=mid;else lo=mid}time=hi;break}
   events.push({marker:marker.id,players:[a,d],time,tackler:d,carrier:a});
  }
 }
 return events.sort((a,b)=>a.time-b.time);
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
 if(!from&&!to){
  const attached=formationRoutePosition(old,next,ball.id,p,g);
  if(attached)return {...ball,...attached};
 }
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
 const events=tackleImpacts(old,next,g),recoveries=new Map();
 for(const o of next.objects){const plan=recoveryPlan(old,next,o.id);if(plan)recoveries.set(o.id,plan)}
 const result=next.objects.map(o=>{
  const prior=findObject(old,o.id),impact=events.find(e=>e.marker===o.id);
  const switchAt=impact?impact.time:o.breakdown?.phase==='release'?.15:.65;
  if(o.type==='label'||isDiagramObject(o))return textVisible(next.timing?.[o.id],p)?{...o}:null;
  if(!prior&&p<1&&!(Array.isArray(o.members)&&p>=(impact?switchAt:.78)))return null;
  if(o.type==='ball')return ballPose(old,next,o,p,g,events);
  if(isShield(o))return shieldTransition(old,next,o,p,g,events);
  const pose=objectPose(old,next,o.id,p,g,events);
  const groupPosition=formationRoutePosition(old,next,o.id,p,g);
  if(groupPosition)Object.assign(pose,groupPosition);
  // A ready stance is a deliberate pause, not a pose that slides along the ground.
  const moving=prior&&travels(prior,o,next);
  if(prior&&o.playerPose==='ready'&&(prior.playerPose!=='ready'||moving&&o.posePinned===true)){
   const switchAt=moving?(next.timing?.[o.id]?.end??100)/100:0;
   pose.playerPose=p>=switchAt?'ready':moving?'standing':(prior.playerPose||'standing');
  }else if(prior?.playerPose==='ready'&&moving&&o.playerPose!=='ready'){
   pose.playerPose=p*100>=(next.timing?.[o.id]?.start??0)?'standing':'ready';
  }else if(prior&&p<(next.timing?.[o.id]?.end??100)/100){
   if(prior.playerPose)pose.playerPose=prior.playerPose;else delete pose.playerPose;
  }
  const recovery=recoveries.get(o.id);if(recovery)pose.playerPose=p<=recovery.start?recovery.prior:p<recovery.ready?(recovery.prior==='bound'?'standing':'recovering'):recovery.moving?'standing':recovery.target;
  if(Array.isArray(o.members)||Array.isArray(prior?.members)){
   pose.members=p>=switchAt?o.members:prior?.members;
   if(o.type==='tackle'&&(!o.breakdown||o.breakdown.phase==='tackle')){const arrived=events.filter(e=>e.marker===o.id&&p>=e.time);if(arrived.length||prior?.members?.length){const ready=new Set([...(prior?.members||[]).map(m=>m.id),...arrived.flatMap(e=>e.players)]);pose.members=(o.members||[]).filter(m=>ready.has(m.id)||!events.some(e=>e.marker===o.id&&e.tackler===m.id)&&p>=switchAt);}}
   if(prior&&p<switchAt){pose.type=prior.type;pose.label=prior.label;pose.breakdown=prior.breakdown}
  }
  return pose;
 }).filter(Boolean).concat(p<1?frameObjects(old,g).filter(o=>o.type!=='label'&&!isDiagramObject(o)&&!findObject(next,o.id)):[]);
 // Old markers are kept for visual continuity, but may never control a player who has left.
 return result.map(o=>{if(!o.members?.length)return o;const members=o.members.filter(m=>{const recovery=recoveries.get(m.id);return !recovery||p<=recovery.start||m.pose===recovery.target&&formationPose(next,m.id)===m.pose});return members.length===o.members.length?o:{...o,members}});
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
