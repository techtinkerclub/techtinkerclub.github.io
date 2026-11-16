// Coach's diagram checker, not a referee or contact technique validator.
import {playbackData} from './scene.js?v=0.10.2';
import {pitchGeometry} from './pitch.js?v=0.9.0';
import {canCarry,carrier,ballMovement,objectPose,transitionObjects} from './possession.js?v=0.10.2';
import {posesFor} from './contact.js?v=0.8.4';
import {decisionLocation,trainingTransition,trainingPoses} from './training.js?v=0.10.2';
import {routeSamples} from './routes.js?v=0.4.3';
const team=o=>['attacker','shield'].includes(o?.type)?1:['defender','bagplayer'].includes(o?.type)?-1:0;
const lookup=(f,id)=>f?.objects.find(o=>o.id===id);
const low=p=>['grounded','tackling','recovering','kneeling','bound','crouched'].includes(p);
const name=o=>o?.label||o?.id||'Player';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const same=(a,b)=>a&&b&&a.id===b.id;
export const CHECK_GROUPS={possession:'Ball and possession',passing:'Passing direction',recovery:'Recovery poses',age:'Age-grade actions (U10)',breakdown:'Breakdown and restarts',offside:'Offside and entry',spacing:'Player spacing'};
export function attackVector(d,g,mode='auto'){
 if(mode==='none'||mode==='auto'&&d.showAttack===false)return null;
 const angle=(({up:0,right:90,down:180,left:270}[d.attackDirection]??0)+g.rotation)*Math.PI/180;
 return {x:Math.sin(angle),y:-Math.cos(angle)};
}
const dot=(p,v)=>p.x*v.x+p.y*v.y;
const projected=(o,g,v)=>dot(g.toView(o.x,o.y),v);
const onFeet=p=>!['grounded','kneeling','recovering','tackling'].includes(p);
function extent(o,pose,g,v){
 // Icon footprints, NOT a measured anatomical back foot. Keep the guide deliberately approximate.
 const a=((o.rot||0)+g.rotation)*Math.PI/180,h={x:Math.sin(a),y:-Math.cos(a)},along=pose==='grounded'?23:pose==='bound'||pose==='crouched'?12:14,across=pose==='bound'||pose==='crouched'?20:12;
 return Math.hypot(along*dot(h,v),across*dot({x:h.y,y:-h.x},v));
}
export function offsideBands(objects,d,g,mode='auto'){
 const v=attackVector(d,g,mode);if(!v)return [];
 const out=[],map=new Map(objects.map(o=>[o.id,o]));
 for(const m of objects){
  const ruck=m.type==='ruck'&&m.members?.length,support=m.type==='tackle'&&m.breakdown?.phase==='support'&&m.members?.length;
  if(!ruck&&!support)continue;
  const b=m.breakdown?.ballId?map.get(m.breakdown.ballId):objects.filter(o=>o.type==='ball'&&!o.ownerId&&dist(g.toView(o.x,o.y),g.toView(m.x,m.y))<70).sort((a,b)=>dist(g.toView(a.x,a.y),g.toView(m.x,m.y))-dist(g.toView(b.x,b.y),g.toView(m.x,m.y)))[0];
  if(!b||b.ownerId)continue;
  const all=m.members.map(q=>({o:map.get(q.id),pose:q.pose})).filter(q=>q.o&&team(q.o)),standing=all.filter(q=>onFeet(q.pose));
  if(support&&!standing.length||ruck&&(!standing.some(q=>team(q.o)===1)||!standing.some(q=>team(q.o)===-1)))continue;
  const participants=ruck?standing:all,extents=participants.map(q=>({p:projected(q.o,g,v),r:extent(q.o,q.pose,g,v)}));
  const corners=[{x:g.margin,y:g.margin},{x:g.margin+g.fw,y:g.margin+g.fh},{x:g.margin+g.fw,y:g.margin},{x:g.margin,y:g.margin+g.fh}].map(p=>dot(p,v)),lo=Math.min(...corners),hi=Math.max(...corners);
  out.push({id:m.id,v,blue:clamp(Math.min(...extents.map(q=>q.p-q.r)),lo,hi),orange:clamp(Math.max(...extents.map(q=>q.p+q.r)),lo,hi),members:all.map(q=>q.o.id),excluded:[...all.map(q=>q.o.id),m.breakdown?.carrierId],kind:ruck?'Ruck':'Tackle support'});
 }
 return out;
}
export function offsideOverlay(objects,d,g,mode='auto'){
 return offsideBands(objects,d,g,mode).map(b=>{
  const horizontal=Math.abs(b.v.y)>.5;
  return '<g data-editor-only="true" pointer-events="none" aria-label="Approximate breakdown offside lines">'+[[b.blue,'#9bd6ff','BLUE'],[b.orange,'#ffc28d','ORANGE']].map(([p,c,label])=>{
   const k=p/(horizontal?b.v.y:b.v.x),pos=horizontal?'x1="'+g.margin+'" x2="'+(g.margin+g.fw)+'" y1="'+k+'" y2="'+k+'"':'x1="'+k+'" x2="'+k+'" y1="'+g.margin+'" y2="'+(g.margin+g.fh)+'"';
   return '<line '+pos+' stroke="'+c+'" stroke-width="2" stroke-dasharray="7 5"/><text x="'+(horizontal?g.margin+5:k+4)+'" y="'+(horizontal?k-5:g.margin+12)+'" font-size="10" fill="'+c+'" paint-order="stroke" stroke="#203b2b" stroke-width="3">'+label+' · OFFSIDE GUIDE</text>';
  }).join('')+'</g>'
 }).join('');
}
export function checkDrill(raw,{age=Number(raw.ageMin)||10,direction='auto',offside=true,spacing=false}={}){
 const findings=[],coverage=Object.fromEntries(Object.keys(CHECK_GROUPS).map(k=>[k,0])),seen=new Set(),add=(group,step,ids,message,level='review',fraction=null)=>{
  const key=[group,step,ids.join(','),message].join('|');if(seen.has(key))return;seen.add(key);findings.push({group,step,ids,message,level,fraction});
 };
 // Check unsanitised ownership before the playback engine discards invalid links.
 for(const [i,f] of raw.frames.entries()){
  const ids=new Set(),owners=new Set();for(const o of f.objects){
   if(ids.has(o.id))add('possession',i,[o.id],'Duplicate object identifier.','data');ids.add(o.id);
   if(o.type!=='ball')continue;coverage.possession++;
   if(o.ownerId&&!canCarry(lookup(f,o.ownerId)))add('possession',i,[o.id],'Ball refers to a missing or invalid carrier.','data');
   if(o.ownerId&&owners.has(o.ownerId))add('possession',i,[o.id,o.ownerId],'One player holds more than one ball. Check whether this is intentional.');
   if(o.ownerId){owners.add(o.ownerId);if(o.groundState)add('possession',i,[o.id,o.ownerId],'Ball is carried but still marked as on the ground.','data')}
  }
  for(const m of f.objects.filter(o=>Array.isArray(o.members)))for(const p of m.members)if(!canCarry(lookup(f,p.id)))add('possession',i,[m.id],'Formation refers to a missing player.','data');
 }
 let d;try{d=playbackData(raw)}catch(err){add('possession',0,[],'Cannot validate playback: '+err.message,'data');return {findings,coverage,age,steps:raw.frames.length,directionKnown:false}}
 const g=pitchGeometry(d.length,d.width,'up'),v=attackVector(d,g,direction);
 let samples=0;
 for(let i=0;i<d.frames.length;i++){
  const f=d.frames[i],old=d.frames[i-1],players=f.objects.filter(canCarry),poses=trainingPoses(f.objects,posesFor(f.objects)),bands=offside?offsideBands(f.objects,d,g,direction):[];
  for(const m of f.objects){
   const members=m.members||[],phase=m.breakdown?.phase;
   if(age===10){
    if(m.type==='ball'&&['kick','tap'].includes(m.transferKind)&&(!old||lookup(old,m.id)?.transferKind!==m.transferKind)){coverage.age++;add('age',i,[m.id],'Kicking/tap kick shown in a U10 drill; match restarts use a free pass. Confirm training intent.')}
    if(m.type==='ruck'||m.type==='maul'||m.type==='scrum'){
     if(!members.length)continue;coverage.age++;const counts=[1,-1].map(t=>members.filter(p=>team(lookup(f,p.id))===t).length);
     if(m.type==='ruck'&&m.breakdown){const original=[m.breakdown.carrierId,...(m.breakdown.tacklerIds?.length?m.breakdown.tacklerIds:[m.breakdown.tacklerId])].filter(Boolean);const combined=[...new Set([...original,...members.map(x=>x.id)])];for(const t of [1,-1])if(combined.filter(id=>team(lookup(f,id))===t).length>2)add('age',i,[m.id],'More than two players on one side of this U10 tackle-to-ruck sequence. Review original participants and arrivals.')}
     if(m.type==='ruck'&&!m.breakdown&&Math.max(...counts)>2||m.type==='maul'&&Math.max(...counts)>2)add('age',i,[m.id],'More than two participants on one side in the U10 formation.');
     if(m.type==='scrum'&&counts.some(n=>n!==3))add('age',i,[m.id],'U10 scrum should show three players per side.');
    }
   }
   if(m.type==='ruck'&&members.length){coverage.breakdown++;const up=members.filter(p=>onFeet(p.pose));if(![1,-1].every(t=>up.some(p=>team(lookup(f,p.id))===t)))add('breakdown',i,[m.id],'Ruck marker lacks an on-feet participant from each team. Check the formation.')}
   if(phase==='release'){coverage.breakdown++;const b=lookup(f,m.breakdown.ballId);if(!b||b.ownerId||!['presented','secured','grounded'].includes(b.groundState))add('breakdown',i,[m.id],'Release stage does not show the ball available on the ground.');if(members.some(p=>p.pose==='tackling'))add('breakdown',i,[m.id],'Tackler remains in the tackle pose at release.')}
   if(age===10&&f.guide?.kind==='lineout'&&(!old||old.guide?.id!==f.guide.id)){coverage.age++;add('age',i,[],'U10 match play uses a free pass after touch, not a lineout.')}
  }
  if(offside)for(const b of bands){
   for(const p of players){const t=team(p);if(!t||b.excluded.includes(p.id))continue;coverage.offside++;const q=projected(p,g,b.v),margin=14; // Position only: not a legal judgement about interference or immediate retreat.
    if(t===1?q>b.blue+margin:q<b.orange-margin)add('offside',i,[p.id,b.id],name(p)+' is ahead of the approximate '+b.kind.toLowerCase()+' offside line. Check retreat/participation.');
   }
   if(old){const prev=offsideBands(old.objects,d,g,direction).find(q=>q.id===b.id);if(prev)for(const id of b.members.filter(id=>!prev.members.includes(id))){const p=lookup(old,id),t=team(p);if(!t)continue;coverage.offside++;const q=projected(p,g,b.v);if(t===1?q>prev.blue+14:q<prev.orange-14)add('offside',i,[id,b.id],name(p)+' starts the arrival ahead of the previous offside guide. Check the actual entry route.');}}
  }
  if(!old)continue;
  const events=[]; // authored pass endpoints are sampled by the same engine; tackle impact calculation remains in the shared engine
  for(const b of f.objects.filter(o=>o.type==='ball')){
   const a=lookup(old,b.id);if(!a)continue;const m=ballMovement(old,f,b,g);
   if(!m?.pass&&!a.ownerId&&!b.ownerId&&!b.transferKind&&dist(g.toView(a.x,a.y),g.toView(b.x,b.y))>12)add('possession',i,[b.id],'Unattached ball moves without a named action. Check carry, loose-ball movement or reset.');
   if(!v||!m?.pass||['kick','tap','feed','throw','handover','turnover','set'].includes(b.transferKind))continue;
   const t=team(m.from);if(!t)continue;coverage.passing++;const s=g.toView(m.start.x,m.start.y),points=routeSamples(m.start,m.end,f.paths?.[b.id],g),max=Math.max(...points.map(p=>t*(dot(p,v)-dot(s,v)))),release=m.timing.start/100;
   const receiver=objectPose(old,f,m.to.id,release,g),passer=objectPose(old,f,m.from.id,release,g);
   if(max>1)add('passing',i,[b.id,m.from.id,m.to.id],name(m.from)+' → '+name(m.to)+': ball travels forward in the diagram ('+(max/g.scale).toFixed(2)+' m). Check release timing or pass path.','review',release);
   if(receiver&&passer&&t*(projected(receiver,g,v)-projected(passer,g,v))>1)add('passing',i,[m.to.id,m.from.id],name(m.to)+' is ahead of the passer at release. Check support depth.','review',release);
   if(team(m.from)&&team(m.to)&&team(m.from)!==team(m.to))add('possession',i,[b.id], 'Pass changes teams; use turnover if possession is awarded or intercepted.');
   if(age===10&&old.guide?.kind==='freepass'){coverage.age++;for(const p of old.objects.filter(canCarry)){if(team(p)!==-t)continue;if(t*(projected(p,g,v)-projected(passer,g,v))<7*g.scale-1)add('age',i,[p.id],name(p)+' is less than 7 m from the illustrated free-pass mark. Check scale and actual restart distance.','review',release)}}
  }
  if(v)for(const o of f.objects.filter(o=>o.type==='decision')){
   const p=lookup(f,o.decision?.playerId),t=team(p);if(!t)continue;const origin=decisionLocation(f,o,g,old);
   for(const q of o.decision?.options||[])if(q.kind==='pass'&&q.points?.length){coverage.passing++;if(q.points.some(x=>t*(projected(x,g,v)-dot(origin,v))>1))add('passing',i,[o.id,p.id],'Alternative "'+q.label+'" points forward from the decision anchor.');}
  }
  const prior=trainingPoses(old.objects,posesFor(old.objects)),departing=players.filter(p=>lookup(old,p.id)&&low(prior.get(p.id))&&(!low(poses.get(p.id))||p.posePinned)&&dist(g.toView(p.x,p.y),g.toView(lookup(old,p.id).x,lookup(old,p.id).y))>1);
  coverage.recovery+=departing.length;
  // Only check moving departures, never intentional ball presentation or intact bound movement.
  if(departing.length||spacing&&players.length<=40){
   const flagged=new Set();for(const q of [.1,.2,.35,.5,.65,.8,.95]){
    const objects=trainingTransition(transitionObjects(old,f,q,g),old,f,q,g),mp=new Map(objects.map(o=>[o.id,o])),ps=trainingPoses(objects,posesFor(objects));samples++;
    for(const p of departing)if(!flagged.has(p.id)&&mp.has(p.id)&&low(ps.get(p.id))&&dist(g.toView(mp.get(p.id).x,mp.get(p.id).y),g.toView(lookup(old,p.id).x,lookup(old,p.id).y))>2){flagged.add(p.id);add('recovery',i,[p.id],name(p)+' moves in a low pose while leaving contact. Check the deliberate pose override.','review',q)}
    if(spacing){const participants=new Set(objects.flatMap(o=>o.members?.map(x=>x.id)||[])),pp=objects.filter(o=>canCarry(o)&&!participants.has(o.id));for(let u=0;u<pp.length;u++)for(let w=u+1;w<pp.length;w++){const x=pp[u],y=pp[w],key=x.id+'|'+y.id;if(flagged.has(key))continue;const A=g.toView(x.x,x.y),B=g.toView(y.x,y.y);coverage.spacing++;if(dist(A,B)<16&&(!low(ps.get(x.id))&&!low(ps.get(y.id)))){flagged.add(key);add('spacing',i,[x.id,y.id],name(x)+' and '+name(y)+' overlap at a sampled point. Check whether contact is intended.','review',q)}}}
   }
  }
 }
 if(!v)add('passing',0,[],'No fixed attack direction selected; directional passing and offside checks skipped. Choose “Use pitch direction” for a directional drill.','info');
 if(age!==10)add('age',0,[],'Season-specific rule checks currently cover U10 only. Verify other ages with the current RFU appendix.','info');
 if(d.frames.length===1)add('recovery',0,[],'Static card: no animated transitions to check.','info');
 if(spacing&&d.frames.some(f=>f.objects.filter(canCarry).length>40))add('spacing',0,[],'Spacing samples skipped for steps with more than 40 players.','info');
 findings.sort((a,b)=>({data:0,review:1,info:2}[a.level]-{data:0,review:1,info:2}[b.level])||a.step-b.step);
 return {findings,coverage,age,steps:d.frames.length,directionKnown:!!v,samples};
}
