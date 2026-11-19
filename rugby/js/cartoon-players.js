// Independent-head, image-based Minion Mode. Visual translation ONLY: the editor,
// possession, coaching gaze, tackling, ball physics and timing use the same data
// and shared engines as Classic mode. Every source pose is ball- and pad-free.
import {canCarry} from './possession.js?v=0.19.1';
import {routeSamples,sampleRoute} from './routes.js?v=0.4.3';
import {playerHeadAngle} from './player-gaze.js?v=3';
import {classicPlayerAppearance} from './classic-player-appearance.js?v=1';
import {RIG_TILE,RIG_COLS,RIG_TEAM_STRIDE,RIG_ROWS,RIG_POSES,RIG_BODY_URI,RIG_HEAD_URI,RIG_CLEAN_CATCH_URI} from './minion-rig-data.js?v=4';
import {REAR_COACH_URI,REAR_COACH_TILE,REAR_COACH_COLS} from './coach-rear-data.js?v=2';
import {COACH_OVERHEAD_URI} from './coach-user-overhead-data.js?v=1';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const fmt=n=>Number.isFinite(n)?Number(n).toFixed(1):'0';
const hash=str=>{let h=0;for(const c of String(str||''))h=((h*33)^c.charCodeAt(0))>>>0;return h};
// The original illustration sheet was not drawn on a uniform sprite scale.
// At 128px source resolution, the upright head artwork ranges from 62px to
// 85px wide. Normalise HEAD size (not arm reach / stance width) so jogging,
// supporting, recovering and defending do not appear to grow or shrink.
// Measured directly from the transparent alpha bounds of the approved atlas.
// 12, 16 and 17 are grounded poses with the head already baked into the body.
const MINION_SOURCE_HEAD_WIDTHS=[85,68,71,69,71,71,71,72,73,73,75,73,0,69,72,64,0,0,73,63,65,66,62,69,72];
const MINION_HEAD_TARGET_PX=79;
const minionHeadScale=poseId=>MINION_SOURCE_HEAD_WIDTHS[poseId]>0
 ?(MINION_HEAD_TARGET_PX/MINION_SOURCE_HEAD_WIDTHS[poseId]).toFixed(3):'1';


/** Embedded assets also survive self-contained SVG, printed coaching sheets and video canvas exports. */
// Construct the large, self-contained SVG image definitions ONCE per module.
// Rebuilding base64 image strings per animation frame wastes time and memory,
// especially when recording a 30 fps cartoon video on a mobile device.
const CARTOON_SPRITE_DEFS='<defs><image id="rugby-minion-body-v9" href="'+RIG_BODY_URI+'" width="'+(RIG_COLS*RIG_TILE)+'" height="'+(RIG_ROWS*RIG_TILE)+'"/>'+
  '<image id="rugby-minion-head-v9" href="'+RIG_HEAD_URI+'" width="'+(RIG_COLS*RIG_TILE)+'" height="'+(RIG_ROWS*RIG_TILE)+'"/>'+
  '<image id="rugby-minion-catch-clean-v1" href="'+RIG_CLEAN_CATCH_URI+'" width="'+RIG_TILE+'" height="'+(2*RIG_TILE)+'"/>'+
  '<image id="rugby-coach-rear-v11" href="'+REAR_COACH_URI+'" width="'+(REAR_COACH_COLS*REAR_COACH_TILE)+'" height="'+(2*REAR_COACH_TILE)+'"/>'+ 
  '<image id="rugby-coach-user-overhead-v1" href="'+COACH_OVERHEAD_URI+'" width="112" height="69"/></defs>';
export function cartoonSpriteDefs(){return CARTOON_SPRITE_DEFS;}
function movingInfo(o,previous,frame,p){
 const before=previous?.objects?.find(q=>q.id===o.id),after=frame?.objects?.find(q=>q.id===o.id);
 if(!before||!after)return {moving:false,distance:0,speed:0,turning:false};
 const dist=Math.hypot(after.x-before.x,after.y-before.y);
 const range=frame.timing?.[o.id]||{start:0,end:100};
 const start=clamp((Number(range.start)||0)/100,0,1),end=clamp(Number.isFinite(Number(range.end))?Number(range.end)/100:1,0,1);
 const path=frame.paths?.[o.id];
 const changing=!!path?.points?.length||Math.abs((Number(after.rot)||0)-(Number(before.rot)||0))>35;
 return {moving:(dist>2||!!path?.points?.length)&&p>=start&&p<=end,distance:dist,
  speed:dist/Math.max(.1,Number(frame.seconds)||2),turning:changing};
}
function currentBall(o,previous,frame){
 const balls=(frame?.objects||[]).filter(q=>q.type==='ball');
 const previously=id=>previous?.objects?.find(q=>q.id===id);
 return {
  held:balls.find(q=>q.ownerId===o.id),
  received:balls.find(q=>q.ownerId===o.id&&previously(q.id)?.ownerId!==o.id),
  passed:balls.find(q=>previously(q.id)?.ownerId===o.id&&q.ownerId!==o.id&&q.transferKind==='pass'),
  all:balls
 };
}
function inWindow(frame,id,p,lead=.07,trail=.15){
 const v=frame?.timing?.[id]||{start:30,end:70};
 return p>=Math.max(0,Number(v.start)/100-lead)&&p<=Math.min(1,Number(v.end)/100+trail);
}
// The player pose is authored by the *same* contact/skill model as Classic mode.
// This layer only chooses which existing original artwork best illustrates it.
export function cartoonPoseIndex(o,pose,objects,previous,frame,p=1){
 const markers=(frame?.objects||[]).filter(m=>['tackle','ruck','maul','scrum'].includes(m.type)&&m.members?.some(v=>v.id===o.id));
 const tackle=markers.find(m=>m.type==='tackle'),ruck=markers.find(m=>m.type==='ruck'),maul=markers.find(m=>m.type==='maul');
 const ball=currentBall(o,previous,frame),move=movingInfo(o,previous,frame,p);
 if(pose==='grounded'){
  if(ball.all.some(b=>(b.ownerId===o.id||(!b.ownerId&&Math.hypot(b.x-o.x,b.y-o.y)<35))&&
    (b.groundState==='presented'||b.transferKind==='presentation')) )return 17;
  if(ball.held?.groundState==='grounded')return 12;
  const earlier=previous?.objects?.find(q=>q.id===o.id)?.playerPose;
  if(earlier&&earlier!=='grounded'&&p<.34)return 15;
  return 16;
 }
 if(pose==='recovering')return 18;
 if(pose==='kneeling')return 11; // one knee down, hand bracing against pitch
 if(o.type==='shield')return 23;
 if(o.type==='bagplayer')return 24;
 if(pose==='tackling')return tackle&&p>=.53?14:13;
 if(pose==='held')return 7; // upright, both arms held close to the ball carrier
 if(pose==='bound')return maul?22:ruck?.breakdown?.phase==='clearout'?21:20;
 if(pose==='crouched')return ruck?21:14; // distinct low two-armed crouch, not ready stance
 if(pose==='ready')return 3;
 if(tackle&&tackle.members?.some(m=>m.id===o.id&&m.pose==='tackling'))return p<.5?13:14;
 if(maul)return 22;
 if(ruck)return ruck.breakdown?.phase==='clearout'?21:20;
 if(ball.passed&&inWindow(frame,ball.passed.id,p,.23,.1)){
  const when=frame.timing?.[ball.passed.id]||{start:35};
  return p<Number(when.start)/100?8:9;
 }
 if(ball.received&&inWindow(frame,ball.received.id,p,.06,.1)){
  if(ball.received.transferKind==='pickup')return 11;
  return 10;
 }
 if(ball.held?.groundState==='grounded')return 12;
 if(ball.held&&ball.held.groundState!=='presented'&&move.moving)return move.speed>42?2:7;
 if(ball.held)return 7;
 if(move.moving){
  if(move.turning){
   const before=previous?.objects?.find(q=>q.id===o.id),after=frame?.objects?.find(q=>q.id===o.id);
   const diff=before&&after?Math.abs((((Number(after.rot)||0)-(Number(before.rot)||0)+540)%360)-180):0;
   // A true reversal uses the turn sprite; a lateral feint uses the
   // side-step sprite. They must not silently be identical.
   return diff>=120?5:4;
  }
  if(move.speed>42)return 2;
  const anotherCarrier=ball.all.some(b=>b.ownerId&&b.ownerId!==o.id);
  return anotherCarrier&&o.type==='attacker'?19:1;
 }
 if(o.headMode==='player'&&o.headTargetId)return 6;
 return 0;
}
// Brief five-sample averaging softens abrupt look-before-pass onset/return,
// without calculating separate cartoon tactics or changing authored targeting.
function smoothGaze(o,objects,g,previous,frame,p){
 const offsets=[-.085,-.045,0,.045,.085],weights=[1,2,3,2,1];
 let sum=0,weight=0;
 for(let i=0;i<offsets.length;i++){
  const value=playerHeadAngle(o,objects,g,previous,frame,clamp(p+offsets[i],0,1));
  if(Number.isFinite(value)){sum+=value*weights[i];weight+=weights[i];}
 }
 return weight?sum/weight:0;
}
function cartoonStandalonePad(){
 // The same footprint as the Classic pad; distinct comic styling only.
 return '<g class="minion-pad-standalone" pointer-events="none">'+
  '<rect x="-18" y="-8" width="36" height="16" rx="5" fill="#1a344b" stroke="#d4f0ff" stroke-width="1.5"/>'+
  '<rect x="-15" y="-6" width="30" height="12" rx="3.5" fill="#377fc4" stroke="#203d57" stroke-width="1"/>'+
  '<path d="M-9 -5V5M9 -5V5" stroke="#d5edff" stroke-width="1.5" opacity=".75"/>'+
  '<path d="M-5 -1H5" stroke="#fef5a6" stroke-width="2" stroke-linecap="round"/>'+
  '</g>';
}
function bodyEquipment(o){
 if(o.type==='shield'){
  // Empty-hand pad-holding player sprite. Pad is a visual overlay, not a
  // replacement for shield/ownership/contact logic or the actual equipment object.
  // Two mitts visibly grip the SIDE edges, never float in front of the head.
  return '<g class="minion-equipment-overlay" aria-label="Tackle shield held at both side grips">'+
   '<path d="M-11 -8Q-18 -15 -18 -23M11 -8Q18 -15 18 -23" stroke="#172832" stroke-width="7" fill="none" stroke-linecap="round"/>'+
   '<path d="M-11 -8Q-18 -15 -18 -23M11 -8Q18 -15 18 -23" stroke="#ffd45b" stroke-width="4.6" fill="none" stroke-linecap="round"/>'+
   '<rect x="-17" y="-37" width="34" height="23" rx="6.5" fill="#19334b" stroke="#f0fcff" stroke-width="1.8"/>'+
   '<rect x="-14" y="-34" width="28" height="17" rx="4" fill="#307fc6" stroke="#1d4d73" stroke-width="1.4"/>'+
   '<path d="M-10 -32V-19M10 -32V-19" stroke="#a9daf2" stroke-width="2"/>'+
   '<path d="M-5 -26H5" stroke="#fff1a5" stroke-width="2.2" stroke-linecap="round"/>'+
   '<ellipse cx="-17" cy="-23" rx="5.5" ry="6.5" fill="#272c34" stroke="#131a20" stroke-width="1.6"/>'+
   '<ellipse cx="17" cy="-23" rx="5.5" ry="6.5" fill="#272c34" stroke="#131a20" stroke-width="1.6"/>'+
   '<path d="M-20 -25L-15 -26M15 -26L20 -25" stroke="#777c81" stroke-width="1.2"/>'+
   '</g>';
 }
 if(o.type==='bagplayer'){
  return '<g class="minion-equipment-overlay" aria-label="Tackle bag held with both hands">'+
   '<path d="M-10 -8L-14 -17M10 -8L14 -17" stroke="#ffd45b" stroke-width="6" stroke-linecap="round"/>'+
   '<rect x="-13" y="-38" width="26" height="32" rx="9" fill="#1c3447" stroke="#e4f2ff" stroke-width="1.8"/>'+
   '<rect x="-10.5" y="-35" width="21" height="26" rx="7" fill="#398cbb" stroke="#24638b" stroke-width="1.1"/>'+
   '<path d="M-6 -32V-12M6 -32V-12" stroke="#bfecff" stroke-width="1.8" opacity=".85"/>'+
   '<ellipse cx="-13" cy="-19" rx="5.2" ry="6" fill="#222a30" stroke="#151c26" stroke-width="1.5"/>'+
   '<ellipse cx="13" cy="-19" rx="5.2" ry="6" fill="#222a30" stroke="#151c26" stroke-width="1.5"/>'+
   '</g>';
 }
 return '';
}
const tileUse=(id,x,y,t)=>'<svg width="'+t+'" height="'+t+'" viewBox="'+x+' '+y+' '+t+' '+t+'" overflow="hidden" style="overflow:hidden"><use href="#'+id+'"/></svg>';
// The Classic editor stores body rotation (rot), while the gaze engine already
// follows curved run paths. Apply the SAME route tangent to the cartoon torso;
// otherwise the eyes turn correctly but the feet and arms run backwards.
const wrapMinionAngle=n=>((n+180)%360+360)%360-180;
function minionTravelHeading(o,g,previous,frame,p){
 const start=previous?.objects?.find(q=>q.id===o.id),end=frame?.objects?.find(q=>q.id===o.id);
 if(!start||!end||!g?.toView||!movingInfo(o,previous,frame,p).moving)return null;
 const timing=frame.timing?.[o.id]||{start:0,end:100};
 const a=clamp(Number(timing.start??0)/100,0,1);
 const b=clamp(Number(timing.end??100)/100,a,1);
 const ratio=clamp((p-a)/Math.max(.001,b-a),0,1);
 const absolute=sampleRoute(routeSamples(start,end,frame.paths?.[o.id],g),ratio).angle;
 return Number.isFinite(absolute)
  ?wrapMinionAngle(absolute-(Number(o.rot)||0)-(Number(g.rotation)||0)):null;
}
// At a catch, hands should face the INCOMING ball, not an unrelated old body
// heading. This is a visual orientation: possession and ball timing are untouched.
function minionCatchHeading(o,g,previous,frame){
 if(!previous||!g?.toView)return null;
 const incoming=currentBall(o,previous,frame).received;
 const earlierBall=incoming&&previous.objects.find(q=>q.id===incoming.id);
 const passer=earlierBall?.ownerId&&previous.objects.find(q=>q.id===earlierBall.ownerId);
 if(!passer||passer.id===o.id)return null;
 const a=g.toView(o.x,o.y),b=g.toView(passer.x,passer.y);
 if(Math.hypot(a.x-b.x,a.y-b.y)<.1)return null;
 const angle=Math.atan2(b.x-a.x,a.y-b.y)*180/Math.PI;
 return wrapMinionAngle(angle-(Number(o.rot)||0)-(Number(g.rotation)||0));
}
// Only the authored tackle stance uses these extra limbs. The original
// detailed atlas remains the body/head artwork for every character.
// Atlas faces south at rest (goggle at lower edge), so hands extend toward +Y.
// Draw underneath the articulated head to preserve the one-/two-eye artwork.
function minionTackleArms(poseId){
 if(poseId!==13&&poseId!==14)return '';
 const contact=poseId===14;
 const left=contact?[37,103]:[23,98],right=contact?[91,103]:[105,98];
 const arm=(side,hand)=>{
  const fromX=side<0?30:98,elbowX=side<0?19:109;
  const midX=contact?(side<0?30:98):elbowX;
  return '<path d="M'+fromX+' 68 Q'+midX+' 83 '+hand[0]+' '+hand[1]+'" fill="none" stroke="#1c292b" stroke-width="12" stroke-linecap="round"/>'+
   '<path d="M'+fromX+' 68 Q'+midX+' 83 '+hand[0]+' '+hand[1]+'" fill="none" stroke="#ffdb31" stroke-width="8" stroke-linecap="round"/>'+
   '<ellipse cx="'+hand[0]+'" cy="'+hand[1]+'" rx="7" ry="8" fill="#262b30" stroke="#121a1d" stroke-width="1.8"/>';
 };
 return '<g class="minion-tackle-arms" data-tackle-phase="'+(contact?'wrap':'ready')+'">'+arm(-1,left)+arm(1,right)+'</g>';
}
function cartoonMinion(o,pose,objects,g,previous,frame,p){
 const poseId=cartoonPoseIndex(o,pose,objects,previous,frame,p);
 const move=movingInfo(o,previous,frame,p);
 const incoming=poseId===10?minionCatchHeading(o,g,previous,frame):null;
 const team=o.type==='defender'||o.type==='bagplayer'?1:0;
 // The original "grounded" artwork (cell 16) is a side-on tumble: from our
 // strict overhead camera it reads like a standing player tipped sideways.
 // Keep its semantic pose ID, but draw the true prone, head-to-boots artwork
 // from cell 12. Cell 17 remains the separate, arms-back ball-presentation pose.
 // This is strictly a Minion visual translation, NOT a change to Classic,
 // contact state, possession, player coordinates, or published drill data.
 const prone=poseId===16;
 // The original catching cell holds its hands low, behind a north-facing
 // goggle. Use the forward, open-arm rig artwork for a true receiving shape.
 // The semantic catch pose is unchanged, and the ball remains separately drawn.
 const artworkId=prone?12:poseId===10?13:poseId;
 const atlasId=artworkId+team*RIG_TEAM_STRIDE;
 const tile=RIG_TILE,x=(atlasId%RIG_COLS)*tile,y=Math.floor(atlasId/RIG_COLS)*tile;
 const entry=RIG_POSES[poseId],pivot=RIG_POSES[artworkId].headPivot;
 // Original source goggles face south; articulated standing heads face north.
 // Ground poses include their heads baked into the overhead body artwork.
 // Only normal running/carrying stances inherit path heading. Contact,
 // side-step, turn and bound poses retain their deliberate authored body angle.
 const followTravel=[1,2,7,19].includes(poseId);
 const travel=entry.grounded||!followTravel?null:minionTravelHeading(o,g,previous,frame,p);
 const bodyTurn=entry.grounded?0:(travel??incoming??0);
 // Preserve the independent head bearing when the body turns, including when
 // it is watching a receiver or a tackle target instead of its running path.
 let gaze=smoothGaze(o,objects,g,previous,frame,p);
 if(incoming!==null&&travel===null&&(!o.headMode||o.headMode==='run'))gaze=incoming;
 else if(o.headMode==='forward')gaze=bodyTurn;
 const rotation=entry.grounded?0:180+gaze-bodyTurn;
 const headScale=minionHeadScale(artworkId);
 const animated=move.moving&&!entry.grounded;
 const gait=animated?Math.sin(p*12*Math.PI)*1.3:0;
 const wobble=animated?Math.sin(p*7*Math.PI)*1.1:0;
 const size=54;
 // Preserve a clear, shadow-free pitch beneath the character.
 // A modest rotation distinguishes an ordinary tackled player from the
 // straight-on try grounding (12) and ball presentation (17) illustrations.
 // Minion poses have no synthetic drop or contact shadow.
 const floorTilt=prone?'rotate(-15 64 64)':'';
 // Clip the atlas cell before any pose-level rotation, or adjacent art leaks.
 // The catching atlas cells contained a grey backing oval. Use their
 // individually cleaned art for both teams, with all other poses unchanged.
 const body=artworkId===10
  ?tileUse('rugby-minion-catch-clean-v1',0,team*tile,tile)
  :tileUse('rugby-minion-body-v9',x,y,tile);
 const head=entry.grounded?'': 
  '<g class="minion-independent-head" data-head-angle="'+fmt(rotation)+'" data-head-scale="'+headScale+'" transform="translate('+fmt(pivot[0])+' '+fmt(pivot[1])+') rotate('+fmt(rotation)+') scale('+headScale+') translate('+fmt(-pivot[0])+' '+fmt(-pivot[1])+')">'+
    tileUse('rugby-minion-head-v9',x,y,tile)+'</g>';
 return '<g class="cartoon-player minion-mode-player minion-rig-player" data-stance="'+entry.name+'" pointer-events="none">'+
  '<g transform="translate(0 '+fmt(gait)+') rotate('+fmt(wobble)+')">'+
   '<svg x="'+(-size/2)+'" y="'+(-size/2)+'" width="'+size+'" height="'+size+'" viewBox="0 0 '+tile+' '+tile+'" overflow="visible">'+
    '<g transform="rotate('+fmt(bodyTurn)+' 64 64)'+(floorTilt?' '+floorTilt:'')+'">'+body+minionTackleArms(poseId)+head+'</g></svg>'+
    '<g transform="rotate('+fmt(bodyTurn)+')">'+bodyEquipment(o)+'</g></g></g>';
}
const COACH_POSES={idle:0,walking:1,pointing_down:2,celebrate:3,pointing_out:4,arms_folded:5,hands_on_hips:6,shrug:7};
function coachIndex(o,previous,frame,p){
 const gesture=String(o.coachGesture||'auto');
 if(Object.hasOwn(COACH_POSES,gesture))return COACH_POSES[gesture];
 const signal=frame?.signal,duration=Math.max(.1,Number(frame?.seconds)||2);
 if(signal?.kind==='whistle'&&signal.coachId===o.id&&p*duration<=Math.max(.1,Number(signal.duration)||.5))return COACH_POSES.pointing_out;
 if(movingInfo(o,previous,frame,p).moving)return COACH_POSES.walking;
 return COACH_POSES.idle;
}
function coachTravelAngle(o,g,previous,frame,p){
 if(o.headMode==='player')return null;
 const begin=previous?.objects?.find(q=>q.id===o.id),end=frame?.objects?.find(q=>q.id===o.id);
 if(!begin||!end||!g?.toView)return null;
 const moving=movingInfo(o,previous,frame,p);
 if(!moving.moving)return null;
 const timing=frame.timing?.[o.id]||{start:0,end:100};
 const a=clamp((Number(timing.start)||0)/100,0,1),b=clamp(Number.isFinite(Number(timing.end))?Number(timing.end)/100:1,0,1);
 const param=clamp((p-a)/Math.max(.001,b-a),0,1);
 const absolute=sampleRoute(routeSamples(begin,end,frame.paths?.[o.id],g),param).angle;
 if(!Number.isFinite(absolute))return null;
 return ((absolute-(Number(o.rot)||0)-(Number(g.rotation)||0)+180)%360+360)%360-180;
}
function cartoonCoach(o,objects,g,previous,frame,p){
 const k=coachIndex(o,previous,frame,p);
 // User's original overhead Gru reference is facing SOUTH (nose at bottom).
 // Rotate by 180 degrees in local coordinates so that "forward" is north,
 // matching the Classic arrow; the outer renderer already applies o.rot.
 const turn=coachTravelAngle(o,g,previous,frame,p)??smoothGaze(o,objects,g,previous,frame,p);
 const angle=wrapMinionAngle(turn+180);
 return '<g class="cartoon-coach top-down-coach-image coach-user-overhead" data-coach-pose="'+k+'" pointer-events="none" transform="rotate('+fmt(angle)+')">'+
  '<svg x="-39" y="-25" width="78" height="50" viewBox="0 0 112 69" overflow="visible">'+
    '<use href="#rugby-coach-user-overhead-v1"/></svg></g>';
}
export function playerAppearance(o,pose,original,objects,g,previous,frame,progress=1,{cartoonMode=false,ink=false}={}){
 // Explicit output-mode boundary: cartoon changes must not alter Classic pose,
 // eye/arrow, scale, team colours or equipment.
 if(!cartoonMode)return classicPlayerAppearance(o,pose,original,objects,g,previous,frame,progress,{ink});
 if(!canCarry(o))return o.type==='shieldItem'?cartoonStandalonePad():original;
 return o.type==='coach'?cartoonCoach(o,objects,g,previous,frame,progress):cartoonMinion(o,pose,objects,g,previous,frame,progress);
}
export function cartoonObjectOrder(items,cartoonMode){
 if(!cartoonMode)return items;
 const attached=[],others=[];
 for(const item of items){
  if(item.type==='shieldItem'&&item.ownerId)attached.push(item);
  else others.push(item);
 }
 return others.concat(attached);
}
export function cartoonPitchDecor(g){
 const w=Number(g.viewWidth||900),h=Number(g.viewHeight||540),positions=[[30,30],[w-30,30],[30,h-30],[w-30,h-30]];
 const n=x=>(Math.round(x*10)/10).toString();
 return '<g class="cartoon-pitch-decor" pointer-events="none">'+
 positions.map(([x,y],i)=>'<g transform="translate('+x+' '+y+')">'+
 '<circle r="9" fill="#ffe97e" opacity=".8"/>'+
 Array.from({length:5},(_,k)=>'<circle cx="'+n(Math.cos(k*Math.PI*2/5)*12)+'" cy="'+n(Math.sin(k*Math.PI*2/5)*12)+'" r="6" fill="'+(i%2?'#f7b0d1':'#f9f3c5')+'" opacity=".7"/>').join('')+
 '<circle r="5" fill="#f4b743"/></g>').join('')+'</g>';
}