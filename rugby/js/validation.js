// Coach's diagram checker, not a referee or contact technique validator.
import {playbackData} from './scene.js?v=0.12.28';
import {pitchGeometry} from './pitch.js?v=0.12.23';
import {canCarry,carrier,ballMovement,objectPose,transitionObjects} from './possession.js?v=0.12.27';
import {posesFor} from './contact.js?v=0.12.28';
import {decisionLocation,trainingTransition,trainingPoses} from './training.js?v=0.12.0';
import {routeSamples} from './routes.js?v=0.4.3';
const team=o=>['attacker','shield'].includes(o?.type)?1:['defender','bagplayer'].includes(o?.type)?-1:0;
const lookup=(f,id)=>f?.objects.find(o=>o.id===id);
const low=p=>['grounded','tackling','recovering','kneeling','bound','crouched'].includes(p);
const name=o=>o?.label||o?.id||'Player';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const same=(a,b)=>a&&b&&a.id===b.id;
export const CHECK_GROUPS={possession:'Ball and possession',passing:'Passing direction',recovery:'Recovery poses',age:'Age-grade actions (U10)',breakdown:'Breakdown and restarts',offside:'Offside and entry',spacing:'Player spacing'};
// Same guides as the presentation player.
import {attackVector,offsideBands,offsideOverlay} from './offside.js?v=0.12.23';
export {attackVector,offsideBands,offsideOverlay};
const dot=(p,v)=>p.x*v.x+p.y*v.y;
const projected=(o,g,v)=>dot(g.toView(o.x,o.y),v);
const onFeet=p=>!['grounded','kneeling','recovering','tackling'].includes(p);
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
     if(m.type==='ruck'&&m.breakdown){const original=[m.breakdown.carrierId,...(m.breakdown.tacklerIds?.length?m.breakdown.tacklerIds:[m.breakdown.tacklerId])].filter(Boolean);const combined=[...new Set([...original,...members.map(x=>x.id)])],padPractice=m.breakdown.mode==='pad';for(const t of [1,-1])if(combined.filter(id=>team(lookup(f,id))===t).length>(padPractice?1:2))add('age',i,[m.id],padPractice?'U10 sausage practice: use one arriving player from each team.':'More than two players on one side of this U10 tackle-to-ruck sequence. Review original participants and arrivals.')}
     if(m.type==='ruck'&&!m.breakdown&&Math.max(...counts)>2||m.type==='maul'&&Math.max(...counts)>2)add('age',i,[m.id],'More than two participants on one side in the U10 formation.');
     if(m.type==='scrum'&&counts.some(n=>n!==3))add('age',i,[m.id],'U10 scrum should show three players per side.');
    }
   }
   if(m.type==='ruck'&&members.length&&!(m.breakdown?.mode==='pad'&&m.breakdown.phase==='support')){coverage.breakdown++;const up=members.filter(p=>onFeet(p.pose));if(![1,-1].every(t=>up.some(p=>team(lookup(f,p.id))===t)))add('breakdown',i,[m.id],'Ruck marker lacks an on-feet participant from each team. Check the formation.')}
   if(phase==='release'){coverage.breakdown++;const b=lookup(f,m.breakdown.ballId);if(!b||b.ownerId||!['presented','secured','grounded'].includes(b.groundState))add('breakdown',i,[m.id],'Release stage does not show the ball available on the ground.');if(members.some(p=>p.pose==='tackling'))add('breakdown',i,[m.id],'Tackler remains in the tackle pose at release.')}
   if(age===10&&f.guide?.kind==='lineout'&&(!old||old.guide?.id!==f.guide.id)){coverage.age++;add('age',i,[],'U10 match play uses a free pass after touch, not a lineout.')}
  }
  if(offside)for(const b of bands){
   for(const p of players){const t=team(p);if(!t||b.excluded.includes(p.id))continue;coverage.offside++;const q=projected(p,g,b.v),margin=.21*g.scale; // Position only: not a legal judgement about interference or immediate retreat.
    if(t===1?q>b.blue+margin:q<b.orange-margin)add('offside',i,[p.id,b.id],name(p)+' is ahead of the approximate '+b.kind.toLowerCase()+' offside line. Check retreat/participation.');
   }
   if(old){const prev=offsideBands(old.objects,d,g,direction).find(q=>q.id===b.id);if(prev)for(const id of b.members.filter(id=>!prev.members.includes(id))){const p=lookup(old,id),t=team(p);if(!t)continue;coverage.offside++;const q=projected(p,g,b.v);if(t===1?q>prev.blue+.21*g.scale:q<prev.orange-.21*g.scale)add('offside',i,[id,b.id],name(p)+' starts the arrival ahead of the previous offside guide. Check the actual entry route.');}}
  }
  if(!old)continue;
  // Authored pass endpoints are evaluated by the same engine used in playback.
  for(const b of f.objects.filter(o=>o.type==='ball')){
   const a=lookup(old,b.id);if(!a)continue;const m=ballMovement(old,f,b,g);
   if(!m?.pass&&!a.ownerId&&!b.ownerId&&!b.transferKind&&dist(g.toView(a.x,a.y),g.toView(b.x,b.y))>12)add('possession',i,[b.id],'Unattached ball moves without a named action. Check carry, loose-ball movement or reset.');
   if(m?.pass&&team(m.from)&&team(m.to)&&team(m.from)!==team(m.to))add('possession',i,[b.id], 'Pass changes teams; review whether this is a turnover or interception.');
   if(!v||!m?.pass||['kick','tap','feed','throw','handover','turnover','set'].includes(b.transferKind))continue;
   const t=team(m.from);if(!t)continue;coverage.passing++;const s=g.toView(m.start.x,m.start.y),points=routeSamples(m.start,m.end,f.paths?.[b.id],g),max=Math.max(...points.map(p=>t*(dot(p,v)-dot(s,v)))),release=m.timing.start/100;
   const receiver=objectPose(old,f,m.to.id,release,g),passer=objectPose(old,f,m.from.id,release,g);
   if(max>1)add('passing',i,[b.id,m.from.id,m.to.id],name(m.from)+' → '+name(m.to)+': ball travels forward in the diagram ('+(max/g.scale).toFixed(2)+' m). Check release timing or pass path.','review',release);
   if(receiver&&passer&&t*(projected(receiver,g,v)-projected(passer,g,v))>1)add('passing',i,[m.to.id,m.from.id],name(m.to)+' is ahead of the passer at release. Check support depth.','review',release);
   const freepass=old.guide?.kind==='freepass'||f.guide?.kind==='freepass'||/free[ -]pass/i.test(old.name)&&/pass|restart/i.test(f.name)||/free[ -]pass/i.test(f.name);
   if(age===10&&freepass){
    coverage.age++;
    const opponents=old.objects.filter(p=>canCarry(p)&&team(p)===-t);
    for(const p of opponents){coverage.age++;if(t*(projected(p,g,v)-projected(passer,g,v))<7*g.scale-1)add('age',i,[p.id],name(p)+' is less than 7 m in front of the illustrated free-pass mark. Check actual restart distance.','review',release)}
    if(!opponents.length)add('age',i,[],'No defending team drawn at this free pass; the 7 m retreat cannot be checked.','info');
    for(const p of old.objects.filter(canCarry)){const atRelease=objectPose(old,f,p.id,release,g);if(!atRelease)continue;coverage.age++;if(dist(g.toView(p.x,p.y),g.toView(atRelease.x,atRelease.y))>2)add('age',i,[p.id],name(p)+' moves before the illustrated free pass is released. Check that everyone waits.','review',release)}
   }
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
    if(spacing){const participants=new Set(objects.flatMap(o=>o.members?.map(x=>x.id)||[])),pp=objects.filter(o=>canCarry(o)&&!participants.has(o.id));for(let u=0;u<pp.length;u++)for(let w=u+1;w<pp.length;w++){const x=pp[u],y=pp[w],key=x.id+'|'+y.id;if(flagged.has(key))continue;const A=g.toView(x.x,x.y),B=g.toView(y.x,y.y);coverage.spacing++;if(dist(A,B)<.36*g.scale&&(!low(ps.get(x.id))&&!low(ps.get(y.id)))){flagged.add(key);add('spacing',i,[x.id,y.id],name(x)+' and '+name(y)+' overlap at a sampled point. Check whether contact is intended.','review',q)}}}
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
