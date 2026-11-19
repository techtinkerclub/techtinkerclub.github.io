// Independent-head, image-based Minion Mode. Visual translation ONLY: the editor,
// possession, coaching gaze, tackling, ball physics and timing use the same data
// and shared engines as Classic mode. Every source pose is ball- and pad-free.
import {canCarry} from './possession.js?v=0.19.1';
import {routeSamples,sampleRoute} from './routes.js?v=0.4.3';
import {playerHeadAngle} from './player-gaze.js?v=3';
import {classicPlayerAppearance} from './classic-player-appearance.js?v=1';
import {RIG_TILE,RIG_COLS,RIG_TEAM_STRIDE,RIG_ROWS,RIG_POSES,RIG_BODY_URI,RIG_HEAD_URI,RIG_CLEAN_CATCH_URI} from './minion-rig-data.js?v=4';
import {REAR_COACH_URI,REAR_COACH_TILE,REAR_COACH_COLS} from './coach-rear-data.js?v=2';
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
  '<image id="rugby-coach-rear-v11" href="'+REAR_COACH_URI+'" width="'+(REAR_COACH_COLS*REAR_COACH_TILE)+'" height="'+(2*REAR_COACH_TILE)+'"/></defs>';
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
// A single, truly overhead character rig. All poses use the same north-facing
// coordinate system (forward = negative Y), then rotate as a whole. No 3/4 view,
// image-atlas perspective changes, drop shadows, or out-of-sync head/body art.
function overheadMinion(o,pose,objects,g,previous,frame,p){
 const poseId=cartoonPoseIndex(o,pose,objects,previous,frame,p);
 const defender=o.type==='defender'||o.type==='bagplayer';
 const kit=defender?'#dc5045':'#277fcd';
 const trim=defender?'#ffce6a':'#a5e7ff';
 const move=movingInfo(o,previous,frame,p);
 const grounded=[12,16,17].includes(poseId);
 const falling=poseId===15;
 const running=[1,2,4,5,7,19].includes(poseId)&&move.moving;
 const contact=[13,14,20,21,22].includes(poseId);
 const crouch=[3,11,13,14,20,21,22,23,24].includes(poseId);
 const carrying=[7,8,9].includes(poseId);
 const reach=[9,10,13,14,21].includes(poseId);
 const travel=(!grounded&&running)?minionTravelHeading(o,g,previous,frame,p):null;
 const incoming=poseId===10?minionCatchHeading(o,g,previous,frame):null;
 const bodyTurn=grounded?0:(travel??incoming??0);
 const gaze=grounded?0:smoothGaze(o,objects,g,previous,frame,p);
 // This head angle is *relative to the turning torso*; north is 0 throughout.
 const headTurn=grounded?0:wrapMinionAngle(gaze-bodyTurn);
 const cycle=running?Math.sin(p*8*Math.PI):0;
 const leftStep=running?cycle*6:0,rightStep=-leftStep;
 const armSwing=running?cycle*8:0;
 const limb=(x1,y1,x2,y2)=>'<path d="M'+x1+' '+y1+'Q'+((x1+x2)/2)+' '+((y1+y2)/2-3)+' '+x2+' '+y2+'" stroke="#e4b327" stroke-width="9" fill="none" stroke-linecap="round"/>'+
  '<path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" stroke="#ffe04a" stroke-width="6.5" stroke-linecap="round"/>'+
  '<ellipse cx="'+x2+'" cy="'+y2+'" rx="5.5" ry="6" fill="#242933" stroke="#11151b" stroke-width="1.4"/>';
 const boot=(x,y)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="7" ry="9.5" fill="#242933" stroke="#111820" stroke-width="1.6"/>'+
  '<path d="M'+(x-3)+' '+(y-4)+'q3 -2 6 0" fill="none" stroke="#74808a" stroke-width="1.6"/>';
 const eye=(x,y,r)=>'<circle cx="'+x+'" cy="'+y+'" r="'+(r+1.6)+'" fill="#27313a" stroke="#151b20" stroke-width="1.3"/>'+
  '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="url(#rugby-mascot-metal)" stroke="#56636a" stroke-width="1.1"/>'+
  '<circle cx="'+x+'" cy="'+y+'" r="'+(r-3.5)+'" fill="#fffef7" stroke="#859da6" stroke-width=".8"/>'+
  '<circle cx="'+x+'" cy="'+(y-1.2)+'" r="'+(r*.36)+'" fill="#79522e"/>'+
  '<circle cx="'+x+'" cy="'+(y-1.2)+'" r="'+(r*.23)+'" fill="#161d22"/>'+
  '<circle cx="'+(x-2.5)+'" cy="'+(y-3.4)+'" r="1.8" fill="#fff"/>';
 const goggles=defender?eye(0,-29,12.6):eye(-11.5,-29,10.7)+eye(11.5,-29,10.7);
 const hair='<path d="M-8 -9l-3 -7M-2 -10l-1 -8M5 -10l3 -7" stroke="#483528" stroke-width="1.8" stroke-linecap="round" fill="none"/>';
 const head='<g class="minion-independent-head" data-head-angle="'+fmt(headTurn)+'" transform="rotate('+fmt(headTurn)+')">'+
  '<path d="M-23 -27Q-30 -15 -26 -3M23 -27Q30 -15 26 -3" stroke="#252b31" stroke-width="5.5" fill="none"/>'+
  '<ellipse cx="0" cy="-10" rx="24" ry="24.5" fill="url(#rugby-mascot-yellow)" stroke="#6b5616" stroke-width="1.8"/>'+
  '<path d="M-14 -29Q0 -37 14 -29" stroke="#fff59b" stroke-width="2.5" fill="none" opacity=".8"/>'+
  hair+goggles+'</g>';
 const gradients='<defs><radialGradient id="rugby-mascot-yellow" cx="65%" cy="35%" r="75%"><stop stop-color="#fff36b"/><stop offset=".55" stop-color="#f9d62a"/><stop offset="1" stop-color="#c99713"/></radialGradient>'+
  '<linearGradient id="rugby-mascot-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#edf6f9"/><stop offset=".38" stop-color="#889aa3"/><stop offset=".68" stop-color="#eef5f7"/><stop offset="1" stop-color="#62737e"/></linearGradient></defs>';
 if(grounded){
  // Ground poses are LONG, not a standing circle tipped sideways.
  // The yellow head is at the front (north); boots and kit remain at the rear.
  const presentation=poseId===17;
  const arms=presentation
   ?limb(-12,7,-17,27)+limb(12,7,17,27)
   :limb(-15,-2,-28,-9)+limb(15,-2,28,-9);
  return '<g class="cartoon-player minion-mode-player minion-overhead-player" data-stance="'+RIG_POSES[poseId].name+'" data-eye-count="'+(defender?1:2)+'" pointer-events="none">'+
   '<svg x="-30" y="-30" width="60" height="60" viewBox="-44 -46 88 94" overflow="visible">'+
   '<g transform="rotate('+(poseId===16?'-14':'0')+')">'+
   gradients+boot(-12,33)+boot(12,33)+
   '<rect x="-18" y="0" width="36" height="29" rx="12" fill="'+kit+'" stroke="#18354e" stroke-width="1.8"/>'+
   '<path d="M-13 2V23M13 2V23" stroke="'+trim+'" stroke-width="2.5"/>'+
   arms+
   '<ellipse cx="0" cy="-13" rx="19" ry="20" fill="url(#rugby-mascot-yellow)" stroke="#78621b" stroke-width="1.7"/>'+
   '<path d="M-13 -29Q0 -37 13 -29" stroke="#fff1a0" stroke-width="2" fill="none"/>'+
   (presentation?'<path d="M-7 17L-12 25M7 17L12 25" stroke="#242933" stroke-width="3" stroke-linecap="round"/>':'')+
   '</g></svg></g>';
 }
 const armY=crouch?-5:3;
 const leftArmX=reach?-29:-30, rightArmX=reach?29:30;
 const leftArmY=reach?-22:armY+armSwing;
 const rightArmY=reach?-22:armY-armSwing;
 const boots=boot(-12+leftStep,33-(crouch?5:0))+boot(12+rightStep,33-(crouch?5:0));
 const torso='<path d="M-23 2Q-24 -3 -19 -5L19 -5Q24 -3 23 2L22 29Q0 39 -22 29Z" fill="'+kit+'" stroke="#16374a" stroke-width="2"/>'+
  '<path d="M-17 6L-14 25M17 6L14 25" stroke="'+trim+'" stroke-width="3.5" fill="none"/>'+
  '<rect x="-11" y="19" width="22" height="12" rx="3" fill="'+kit+'" stroke="'+trim+'" stroke-width="1.5"/>'+ 
 '<path d="M-9 21h18" stroke="#fff" opacity=".25" stroke-width="1.3"/>';
 const body=gradients+boots+torso+limb(-21,4,leftArmX,leftArmY)+limb(21,4,rightArmX,rightArmY)+head;
 const tilt=falling?'-20':running?fmt(cycle*2):'0';
 return '<g class="cartoon-player minion-mode-player minion-overhead-player" data-stance="'+RIG_POSES[poseId].name+'" data-eye-count="'+(defender?1:2)+'" pointer-events="none">'+
  '<svg x="-28" y="-28" width="56" height="56" viewBox="-44 -46 88 94" overflow="visible">'+
   '<g transform="rotate('+fmt(bodyTurn)+' 0 0) rotate('+tilt+' 0 0)">'+body+'</g></svg>'+
   '<g transform="rotate('+fmt(bodyTurn)+')">'+bodyEquipment(o)+'</g></g>';
}
function cartoonMinion(o,pose,objects,g,previous,frame,p){
 return overheadMinion(o,pose,objects,g,previous,frame,p);
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
 const k=coachIndex(o,previous,frame,p),t=REAR_COACH_TILE,size=66;
 const x=k%REAR_COACH_COLS*t,y=Math.floor(k/REAR_COACH_COLS)*t;
 // The newly supplied rear-view coach sheet points north (head leading, boots
 // trailing), the SAME local forward axis (-Y) as the Classic arrow.
 // No nose markers, secondary eyes or fixed 180-degree correction are added.
 // Pitch rotation is already applied by the outer object transform.
 const angle=coachTravelAngle(o,g,previous,frame,p)??smoothGaze(o,objects,g,previous,frame,p);
 return '<g class="cartoon-coach top-down-coach-image" data-coach-pose="'+k+'" pointer-events="none" transform="rotate('+fmt(angle)+')">'+
  '<svg x="'+(-size/2)+'" y="'+(-size/2)+'" width="'+size+'" height="'+size+'" viewBox="'+x+' '+y+' '+t+' '+t+'" overflow="hidden" style="overflow:hidden">'+
  '<use href="#rugby-coach-rear-v11"/></svg></g>';
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