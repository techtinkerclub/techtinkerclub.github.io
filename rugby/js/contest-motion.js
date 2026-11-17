// A short, optional editor shortcut for a formed ruck contest.
// "Distance" is the real travel of each drive, in centimetres: attackers
// push forwards, defenders push back, and the chosen side wins the last drive.
// The pitch-space route is also used by export and the animation.
import {contactDragIds} from './contact-drag.js?v=0.12.29';
import {ruckSide} from './ruck-outcome.js?v=0.12.30';

const playerTypes=new Set(['attacker','defender','neutral','shield','bagplayer']);
export function contestDrive(frame,previous,marker,g,{distanceCm=10,exchanges=2,winner='attack',clearanceCm=50}={}){
 if(!frame?.objects||!previous?.objects||marker?.type!=='ruck'||marker.breakdown?.phase!=='contest')
  return {ok:false,message:'Select a Contest step with a ruck marker.'};
 if(!['attack','defence'].includes(winner))return {ok:false,message:'Choose attackers or defenders to win the final drive.'};
 const cm=Number(distanceCm),rounds=Number(exchanges),clearCm=Number(clearanceCm);
 if(!Number.isFinite(cm)||cm<1||cm>150)return {ok:false,message:'Enter a drive distance between 1 and 150 cm.'};
 if(!Number.isInteger(rounds)||rounds<1||rounds>4)return {ok:false,message:'Choose 1–4 push–pull exchanges.'};
 if(!Number.isFinite(clearCm)||clearCm<20||clearCm>100)return {ok:false,message:'Set the losing side’s step back between 20 and 100 cm.'};
 const ids=contactDragIds(frame,marker);
 const contestSides=new Set((marker.members||[]).map(m=>ruckSide(frame.objects.find(o=>o.id===m.id))).filter(Boolean));
 if(!contestSides.has('attack')||!contestSides.has('defence'))
  return {ok:false,message:'A ruck contest needs at least one attacker and one defender linked.'};
 const old=new Map(previous.objects.map(o=>[o.id,o]));
 if(ids.length<3||!marker.members?.some(m=>playerTypes.has(frame.objects.find(o=>o.id===m.id)?.type)))
  return {ok:false,message:'Link the attacking and defending players to the ruck first.'};
 if(marker.members?.some(m=>!old.get(m.id)||!previous.objects.some(o=>o.type==='ruck'&&o.id===marker.id&&o.members?.some(q=>q.id===m.id))))
  return {ok:false,message:'The players must already be involved in the preceding Ruck formed step.'};
 if(ids.some(id=>!old.has(id)))return {ok:false,message:'The ruck or its players are missing from the previous step.'};
 const source=old.get(marker.id),d=(cm/100)*g.scale;
 const angle=((Number(source.rot)||0)+(Number(g.rotation)||0))*Math.PI/180;
 const vx=d*Math.sin(angle),vy=-d*Math.cos(angle);
 const offsets=Array.from({length:rounds*2},(_,i)=>i%2===0?1:0);
 offsets.push(winner==='attack'?1:-1);
 const within=(q)=>q.x>=g.margin+6&&q.x<=g.margin+g.fw-6&&q.y>=g.margin+6&&q.y<=g.margin+g.fh-6;
 for(const id of ids){
  const q=g.toView(old.get(id).x,old.get(id).y);
  if(offsets.some(f=>!within({x:q.x+vx*f,y:q.y+vy*f})))
   return {ok:false,message:'Not enough room for that push–pull distance. Move the formation away from the pitch edge or choose a smaller distance.'};
 }
 // Compute before mutating, so a rejected preset never partly edits a drill.
 const origin=g.toView(source.x,source.y),waypoints=offsets.slice(0,-1).map(f=>g.fromView(origin.x+vx*f,origin.y+vy*f));
 const final=offsets.at(-1);
 // After the last drive, the losing player yields the pad. This is a
 // separate, late-stage visual outcome; the winner stays over the pad.
 // Do NOT chase the loose ball: A2/D2 should play that in the following step.
 const ground=frame.objects.find(o=>o.id===marker.breakdown?.padId);
 const ref=ground?g.toView(ground.x,ground.y):g.toView(source.x,source.y);
 const losers=new Set((marker.members||[]).filter(m=>{
  const p=frame.objects.find(o=>o.id===m.id);
  return ruckSide(p)&&ruckSide(p)!==winner;
 }).map(m=>m.id));
 const clearance=clearCm/100*g.scale;
 const loserOffsets=new Map();
 for(const id of losers){
  const src=old.get(id),pos=g.toView(src.x,src.y);
  const at={x:pos.x+vx*final,y:pos.y+vy*final};
  let dx=at.x-ref.x,dy=at.y-ref.y,len=Math.hypot(dx,dy);
  if(len<2){dx=0;dy=winner==='attack'?1:-1;len=1}
  loserOffsets.set(id,{x:clearance*dx/len,y:clearance*dy/len});
 }
 const nextPositions=ids.map(id=>{
  const src=old.get(id),p=g.toView(src.x,src.y);
  const retreat=loserOffsets.get(id)||(src.ownerId&&loserOffsets.get(src.ownerId))||{x:0,y:0};
  return {id,position:g.fromView(p.x+vx*final+retreat.x,p.y+vy*final+retreat.y)};
 });
 // Validate the final distinct positions, not only the shared route.
 if(nextPositions.some(({position})=>!within(g.toView(position.x,position.y))))
  return {ok:false,message:'Not enough space for the losing player to step back. Reduce the separation or move the ruck towards the centre.'};
 frame.paths||={};
 frame.timing||={};
 frame.paths[marker.id]={mode:'corners',points:waypoints,follow:false};
 marker.breakdown={...marker.breakdown,winner,clearanceCm:clearCm};
 // The side that loses the contest is no longer bound at the final frame.
 // It changes pose only near the end of the contest transition.
 marker.members=marker.members.map(m=>losers.has(m.id)?{...m,pose:'standing'}:{...m,pose:'bound'});
 delete frame.timing[marker.id];
 for(const {id,position} of nextPositions){
  const target=frame.objects.find(o=>o.id===id);
  target.x=position.x;target.y=position.y;
  if(id!==marker.id){delete frame.paths[id];delete frame.timing[id]}
 }
 // Half a second per push keeps the contact movement legible at normal speed.
 frame.seconds=Math.max(Number(frame.seconds)||1.5,.6*offsets.length);
 return {ok:true,message:rounds+' push–pull exchange'+(rounds===1?'':'s')+' at '+cm+' cm per drive. '+(winner==='attack'?'A1 / attacking side':'Defending side')+' secures the pad; the opposition gives '+clearCm+' cm. The separate ball stays ready for the next player.',distanceCm:cm,exchanges:rounds,winner,clearanceCm:clearCm,waypoints:waypoints.length,seconds:frame.seconds};
}
