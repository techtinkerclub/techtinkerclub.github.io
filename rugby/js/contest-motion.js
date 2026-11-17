// A short, optional editor shortcut for a formed ruck contest.
// "Distance" is the real travel of each drive, in centimetres: attackers
// push forwards, defenders push back, and the chosen side wins the last drive.
// The pitch-space route is also used by export and the animation.
import {contactDragIds} from './contact-drag.js?v=0.12.29';

const between=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const playerTypes=new Set(['attacker','defender','neutral','shield','bagplayer']);
export function contestDrive(frame,previous,marker,g,{distanceCm=10,exchanges=2,winner='attack'}={}){
 if(!frame?.objects||!previous?.objects||marker?.type!=='ruck'||marker.breakdown?.phase!=='contest')
  return {ok:false,message:'Select a Contest step with a ruck marker.'};
 if(!['attack','defence'].includes(winner))return {ok:false,message:'Choose attackers or defenders to win the final drive.'};
 const cm=Number(distanceCm),rounds=Number(exchanges);
 if(!Number.isFinite(cm)||cm<1||cm>150)return {ok:false,message:'Enter a drive distance between 1 and 150 cm.'};
 if(!Number.isInteger(rounds)||rounds<1||rounds>4)return {ok:false,message:'Choose 1–4 push–pull exchanges.'};
 const ids=contactDragIds(frame,marker),included=ids.map(id=>frame.objects.find(o=>o.id===id));
 const side=o=>['attacker','shield'].includes(o?.type)?'attack':['defender','bagplayer'].includes(o?.type)?'defence':null;
 const contestSides=new Set((marker.members||[]).map(m=>side(frame.objects.find(o=>o.id===m.id))).filter(Boolean));
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
 const nextPositions=ids.map(id=>{
  const src=old.get(id),p=g.toView(src.x,src.y);
  return {id,position:g.fromView(p.x+vx*final,p.y+vy*final)};
 });
 frame.paths||={};
 frame.timing||={};
 frame.paths[marker.id]={mode:'corners',points:waypoints,follow:false};
 delete frame.timing[marker.id];
 for(const {id,position} of nextPositions){
  const target=frame.objects.find(o=>o.id===id);
  target.x=position.x;target.y=position.y;
  if(id!==marker.id){delete frame.paths[id];delete frame.timing[id]}
 }
 // Half a second per push keeps the contact movement legible at normal speed.
 frame.seconds=Math.max(Number(frame.seconds)||1.5,.6*offsets.length);
 return {ok:true,message:rounds+' push–pull exchange'+(rounds===1?'':'s')+' at '+cm+' cm per drive; '+(winner==='attack'?'attackers':'defenders')+' finish in front. Movement set in this step; pad and unrelated ball unchanged.',distanceCm:cm,exchanges:rounds,winner,waypoints:waypoints.length,seconds:frame.seconds};
}
