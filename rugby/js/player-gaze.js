// Lightweight coaching gaze cues. No physical head IK or invented contact.
// The existing rotation remains the player's BODY orientation.
import {canCarry,ballMovement} from './possession.js?v=0.19.1';
import {routeSamples,sampleRoute} from './routes.js?v=0.4.3';
export const HEAD_MODES=Object.freeze({run:'Follow running direction',player:'Follow another player',forward:'Look straight ahead'});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wrap=n=>((n+180)%360+360)%360-180;
const where=(o,g)=>g.toView(o.x,o.y);
const bearing=(a,b)=>Math.atan2(b.x-a.x,a.y-b.y)*180/Math.PI;
export function headSettings(o){
 const mode=Object.hasOwn(HEAD_MODES,o?.headMode)?o.headMode:'run';
 return {mode,targetId:mode==='player'&&typeof o.headTargetId==='string'?o.headTargetId:null};
}
export function validHeadTarget(o,objects){
 const {mode,targetId}=headSettings(o);
 return mode==='player'&&(objects||[]).some(p=>p.id===targetId&&p.id!==o.id&&canCarry(p));
}
export function playerHeadAngle(o,objects,g,previous=null,current=null,p=1){
 if(!canCarry(o))return null;
 if(['grounded','kneeling'].includes(o.playerPose))return null;
 const look=headSettings(o),find=id=>objects.find(p=>p.id===id&&canCarry(p)),before=previous?.objects?.find(p=>p.id===o.id);
 const marker=(current?.objects||[]).find(m=>m.type==='tackle'&&m.members?.some(member=>member.id===o.id&&member.pose==='tackling'));
 let target=null,override=false;
 if(marker){
  const carrier=marker.breakdown?.carrierId||marker.members?.find(m=>['grounded','held'].includes(m.pose))?.id;
  target=find(carrier);override=!!target;
 }
 if(!override&&previous&&current){
  // Check the receiver BEFORE the ball is passed. Transfer and the head motion
  // remain independent authored actions.
  const pass=(current.objects||[]).find(b=>{
   if(b.type!=='ball'||!b.ownerId||b.ownerId===o.id)return false;
   const prev=previous.objects.find(p=>p.id===b.id);
   return prev?.ownerId===o.id&&!['turnover','rip','handover','set','pickup'].includes(b.transferKind);
  });
  if(pass){
   const timing=current.timing?.[pass.id]||{start:35,end:70};
   const begin=clamp((Number(timing.start)||35)/100,0,1);
   if(p>=Math.max(0,begin-.28)&&p<=Math.min(1,begin+.07)){target=find(pass.ownerId);override=!!target}
  }
 }
 if(!override&&previous&&current&&o.type==='defender'){
  // A genuine pursuit closes distance on a ball carrier. Do not redirect a
  // whole defensive line just because an opponent happens to be on the pitch.
  const threats=objects.filter(p=>p.type==='attacker'&&(current.objects||[]).some(b=>b.type==='ball'&&b.ownerId===p.id));
  const oldMe=before;
  if(oldMe){
   for(const threat of threats){
    const oldThreat=previous.objects.find(a=>a.id===threat.id);
    if(!oldThreat)continue;
    const oldDist=Math.hypot(where(oldMe,g).x-where(oldThreat,g).x,where(oldMe,g).y-where(oldThreat,g).y);
    const dist=Math.hypot(where(o,g).x-where(threat,g).x,where(o,g).y-where(threat,g).y);
    const movement=Math.hypot(where(o,g).x-where(oldMe,g).x,where(o,g).y-where(oldMe,g).y);
    if(movement>10&&dist<155&&oldDist-dist>9){target=threat;override=true;break}
   }
  }
 }
 if(!target&&look.mode==='player')target=find(look.targetId);
 let absolute=null;
 if(target)absolute=bearing(where(o,g),where(target,g));
 else if(look.mode==='run'&&before&&current){
  const end=current.objects.find(q=>q.id===o.id)||o;
  const route=current.paths?.[o.id],timing=current.timing?.[o.id]||{start:0,end:100};
  const start=clamp(Number(timing.start)/100||0,0,1),finish=clamp(Number(timing.end)/100||1,0,1);
  const total=Math.hypot(where(before,g).x-where(end,g).x,where(before,g).y-where(end,g).y);
  if(total>3&&p>=start&&p<=finish){
   const t=clamp((p-start)/Math.max(.01,finish-start),0,1);
   absolute=sampleRoute(routeSamples(before,end,route,g),t).angle;
  }
 }
 if(absolute===null||!Number.isFinite(absolute))return 0;
 return clamp(wrap(absolute-(Number(o.rot)||0)-(Number(g.rotation)||0)),-100,100);
}
export function playerHeadSVG(o,objects,g,previous=null,current=null,p=1,ink=false,visiblePose=null){
 if(['grounded','kneeling'].includes(visiblePose))return '';
 const angle=playerHeadAngle(o,objects,g,previous,current,p);
 if(angle===null)return '';
 // Small overhead head with a dark gaze dot. It rotates independently inside
 // the player's body transform and doesn't shift the arms or tackle stance.
 const face=ink?'#f4f4ed':'#fff0cf',outline=ink?'#333':'#173526';
 return '<g class="player-head-gaze" pointer-events="none" transform="rotate('+angle.toFixed(1)+')">'+
 '<circle cx="0" cy="-12" r="5.2" fill="'+face+'" stroke="'+outline+'" stroke-width="1.4"/>'+
 '<circle cx="0" cy="-15.2" r="1.6" fill="'+outline+'"/>'+
 '</g>';
}
