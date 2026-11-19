// Harburling Ruckus Mode: approved 54-pose user artwork. Visual translation ONLY.
// possession, coaching gaze, tackling, ball physics and timing use the same data
// and shared engines as Classic mode. Every source pose is ball- and pad-free.
import {canCarry,tackleImpacts} from './possession.js?v=0.19.1';
import {tagColor} from './skill-actions.js?v=8';
import {routeSamples,sampleRoute} from './routes.js?v=0.4.3';
import {playerHeadAngle} from './player-gaze.js?v=3';
import {classicPlayerAppearance} from './classic-player-appearance.js?v=1';
import {RUCKUS_RED_ATLAS_URI} from './ruckus-red-54-atlas.js?v=1';
import {RUCKUS_BLUE_ATLAS_URI} from './ruckus-blue-54-atlas.js?v=1';
import {RUCKUS_PRESENT_URI} from './ruckus-presentation-data.js?v=1';
import {RUCKUS_COACH_URI,RUCKUS_COACH_TILE,RUCKUS_COACH_COLUMNS} from './ruckus-coach-h8-data.js?v=1';
const RUCKUS_TILE=128,RUCKUS_COLS=8,RUCKUS_ROWS=7;
const POSE_NAMES=['idle','jog','sprint','defensive_ready','sidestep','turn','look_scan','carry_ball','prepare_pass','pass_follow','receive','pickup','ground_try','approach_tackle','tackle_contact','being_tackled','grounded','present_ball','getting_up','support_runner','ruck_bind','ruck_clearout','maul_bound','shield_ready','bag_ready'];
const RIG_POSES=POSE_NAMES.map((name,index)=>({name,grounded:[12,16,17].includes(index)}));
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const fmt=n=>Number.isFinite(n)?Number(n).toFixed(1):'0';
const hash=str=>{let h=0;for(const c of String(str||''))h=((h*33)^c.charCodeAt(0))>>>0;return h};
/** Embedded assets also survive self-contained SVG, printed coaching sheets and video canvas exports. */
// Construct the large, self-contained SVG image definitions ONCE per module.
// Rebuilding base64 image strings per animation frame wastes time and memory,
// especially when recording a 30 fps cartoon video on a mobile device.
const CARTOON_SPRITE_DEFS='<defs>'+
 '<image id="rugby-ruckus-red-54" href="'+RUCKUS_RED_ATLAS_URI+'" width="1024" height="896"/>'+
 '<image id="rugby-ruckus-blue-54" href="'+RUCKUS_BLUE_ATLAS_URI+'" width="1024" height="896"/>'+
 '<image id="rugby-ruckus-presentation-v1" href="'+RUCKUS_PRESENT_URI+'" width="208" height="208"/>'+
 '<image id="rugby-ruckus-coach-h8" href="'+RUCKUS_COACH_URI+'" width="'+(RUCKUS_COACH_TILE*RUCKUS_COACH_COLUMNS)+'" height="'+(RUCKUS_COACH_TILE*2)+'"/></defs>';
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
  // The standard pass created by the editor deliberately has NO transferKind.
  // A named 'pass' is also allowed. Never animate releases/pickups as passes.
  passed:balls.find(q=>previously(q.id)?.ownerId===o.id&&q.ownerId&&q.ownerId!==o.id
   &&!NON_PASS_TRANSFERS.has(q.transferKind)),
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
// The right-side catch in v0.20.36 was already correct. Its original
// 180° source-art orientation is the baseline for BOTH receive frames.
// Do not replace that with a guessed diagonal calibration.
const NON_PASS_TRANSFERS=new Set(['pickup','turnover','rip','handover','set','presentation','drop']);
/** Local bearing towards the ball as it ARRIVES, using the authored ball
 * route (or straight flight), never the receiver's previous body heading.
 * A null result means that no genuine pass flight is authored in this step.
 * This is artwork-only: no drill positions, facing or ball ownership change. */
export function ruckusIncomingPassBearing(o,previous,frame,g){
 if(!previous?.objects||!frame?.objects||typeof g?.toView!=='function')return null;
 const ball=frame.objects.find(q=>q.type==='ball'&&q.ownerId===o.id&&!NON_PASS_TRANSFERS.has(q.transferKind)
  &&previous.objects.some(prior=>prior.id===q.id&&prior.ownerId!==o.id));
 if(!ball)return null;
 const prior=previous.objects.find(q=>q.id===ball.id);
 if(!prior)return null;
 const start=g.toView(prior.x,prior.y),end=g.toView(ball.x,ball.y);
 let incoming=null;
 if(Number.isFinite(start.x)&&Number.isFinite(start.y)&&Number.isFinite(end.x)&&Number.isFinite(end.y)
    &&Math.hypot(end.x-start.x,end.y-start.y)>3){
  // Follow the actual arrival tangent of a curved pass, not just the sender.
  incoming=sampleRoute(routeSamples(prior,ball,frame.paths?.[ball.id],g),.999).angle;
 }
 if(!Number.isFinite(incoming)){
  const sender=previous.objects.find(q=>q.id===prior.ownerId);
  const source=sender?g.toView(sender.x,sender.y):start;
  const target=g.toView(o.x,o.y),dx=target.x-source.x,dy=target.y-source.y;
  if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)<=3)return null;
  incoming=Math.atan2(dx,-dy)*180/Math.PI;
 }
 // Invert the direction of travel: the player's visor and catching hands
 // must look TOWARDS the source, regardless of existing authored rotation.
 return wrapMinionAngle(incoming+180-(Number(o.rot)||0)-(Number(g.rotation)||0));
}
// The pass and receive artwork was drawn looking diagonally up and right.
// Reflections across BOTH atlas axes produce the other three diagonal
// directions. A final correction of at most 45° handles any in-between
// direction, without turning the player around or changing drill coordinates.
export function ruckusActionSpriteTransform(localBearing){
 if(!Number.isFinite(localBearing))return null;
 const target=wrapMinionAngle(localBearing);
 // The original sprite points NE (+45). The existing global 180° turn
 // points it SW (-135), so keep this stable baseline rather than replacing
 // it with the incorrect v0.20.37 calibration.
 let mirrorX=1,mirrorY=1,source=-135;
 if(target>=0&&target<90){mirrorX=-1;mirrorY=-1;source=45}
 else if(target>=90){mirrorX=-1;source=135}
 else if(target>=-90){mirrorY=-1;source=-45}
 return {mirrorX,mirrorY,angle:180+wrapMinionAngle(target-source)};
}
// Keep the old exported name for any existing tests or integrations.
export function ruckusCatchPoseTransform(bearing,forward=0){
 const transform=ruckusActionSpriteTransform(wrapMinionAngle(bearing-forward));
 return {mirror:transform?.mirrorX??1,angle:(transform?.angle??180)+forward,
  mirrorY:transform?.mirrorY??1};
}
export function ruckusOutgoingPassBearing(o,previous,frame,g){
 if(!previous?.objects||!frame?.objects||typeof g?.toView!=='function')return null;
 const ball=frame.objects.find(q=>q.type==='ball'&&q.ownerId&&q.ownerId!==o.id
  &&!NON_PASS_TRANSFERS.has(q.transferKind)
  &&previous.objects.some(prior=>prior.id===q.id&&prior.ownerId===o.id));
 if(!ball)return null;
 const prior=previous.objects.find(q=>q.id===ball.id),to=frame.objects.find(q=>q.id===ball.ownerId);
 if(!prior)return null;
 const from=g.toView(prior.x,prior.y),end=g.toView(ball.x,ball.y);
 let outgoing=null;
 if(Math.hypot(end.x-from.x,end.y-from.y)>3)
  outgoing=sampleRoute(routeSamples(prior,ball,frame.paths?.[ball.id],g),.001).angle;
 if(!Number.isFinite(outgoing)&&to){
  const a=g.toView(o.x,o.y),b=g.toView(to.x,to.y);
  if(Math.hypot(a.x-b.x,a.y-b.y)>3)outgoing=Math.atan2(b.x-a.x,a.y-b.y)*180/Math.PI;
 }
 if(!Number.isFinite(outgoing))return null;
 return wrapMinionAngle(outgoing-(Number(o.rot)||0)-(Number(g.rotation)||0));
}
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
// Harburling Ruckus is a purely visual translation of the Classic drill model.
// The approved red mascot art is packed in a transparent 26-pose atlas. For
// moving players the body follows the existing run-path heading; a separate
// five-direction look selection follows the existing gaze engine. For static
// players, the entire mascot faces the authored look target (no new actions).
// Index positions are from the EXACT 54 PNGs supplied by the user, packed into
// two identically indexed full-resolution 8x7 atlases. The app controls its ball
// separately; there is never any ball painted into the player artwork.
const RUCKUS_POSE=[5,8,12,24,11,17,2,12,43,45,46,21,35,27,31,33,35,36,37,12,20,30,24,24,24];
// Hold each key pose for a readable part of the already-authored step.
// We do NOT add time to the drill, alter the Classic timeline, or loop contact.
const ruckusSequence=(start,count,p)=>{
 const t=clamp(p,0,.99999);
 const eased=t<.12?0:t>.88?.99999:(t-.12)/.76;
 return start+Math.min(count-1,Math.floor(eased*count));
};
const ruckusLookBucket=angle=>4-Math.round((clamp(wrapMinionAngle(angle),-90,90)+90)/45);
function cartoonRuckus(o,pose,objects,g,previous,frame,p){
 const semantic=cartoonPoseIndex(o,pose,objects,previous,frame,p);
 const entry=RIG_POSES[semantic],move=movingInfo(o,previous,frame,p);
 const travel=minionTravelHeading(o,g,previous,frame,p);
 const moving=move.moving&&travel!==null;
 const forward=travel??0;
 let gaze=smoothGaze(o,objects,g,previous,frame,p);
 if(o.headMode==='forward'&&moving)gaze=forward;
 const relative=moving?wrapMinionAngle(gaze-forward):gaze;
 const catchLocal=semantic===10?ruckusIncomingPassBearing(o,previous,frame,g):null;
 const passLocal=[8,9].includes(semantic)?ruckusOutgoingPassBearing(o,previous,frame,g):null;
 const actionBearing=catchLocal??passLocal;
 const look=ruckusLookBucket(relative);
 const step=clamp(p,0,1);
 const team=(o.type==='defender'||o.type==='bagplayer')?'red':'blue';
 let sprite=RUCKUS_POSE[semantic]??5;
 // Prefer the *actual* contact and possession event over the ordinary stance.
 // The Classic engine still owns coordinates, physics and event timing.
 const tackleMarker=frame?.objects?.find(m=>m.type==='tackle'&&m.members?.some(member=>member.id===o.id));
 const markerRole=tackleMarker?.members?.find(m=>m.id===o.id)?.pose;
 const impact=previous&&frame?tackleImpacts(previous,frame,g).find(event=>event.players.includes(o.id)):null;
 const hasContact=tackleMarker&&(!tackleMarker.breakdown||tackleMarker.breakdown.phase==='tackle');
 const activeTackler=hasContact&&markerRole==='tackling';
 const activeCarrier=hasContact&&markerRole==='grounded';
 const wasTackler=previous?.objects?.some(m=>m.type==='tackle'&&m.members?.some(v=>v.id===o.id&&v.pose==='tackling'));
 const leavingTackle=wasTackler&&!hasContact;
 const impactAt=impact?.time??0;
 // The ruck/maul orientation is determined by where the player binds, not
 // their old sprint heading. Only Ruckus artwork turns towards the formation.
 const binding=frame?.objects?.find(m=>['ruck','maul','scrum'].includes(m.type)&&
  m.members?.some(member=>member.id===o.id));
 const bindingPeers=binding?.members?.map(m=>objects.find(q=>q.id===m.id)).filter(q=>q&&q.id!==o.id)||[];
 const sameTeam=q=>['defender','bagplayer'].includes(q.type)===['defender','bagplayer'].includes(o.type);
 const partner=bindingPeers.find(q=>!sameTeam(q))||bindingPeers[0];
 const partnerView=partner&&g?.toView?g.toView(partner.x,partner.y):null;
 const myView=partnerView?g.toView(o.x,o.y):null;
 const bindBearing=partnerView&&myView?Math.atan2(partnerView.x-myView.x,myView.y-partnerView.y)*180/Math.PI:null;
 const bindLocal=bindBearing===null?null:wrapMinionAngle(bindBearing-(Number(o.rot)||0)-(Number(g.rotation)||0));

 const earlierBall=previous?.objects?.filter(b=>b.type==='ball')||[];
 // Reuse the real ball already placed by the shared breakdown engine.
 // In an authored release, that ball is on the support-side of the player;
 // we never infer 'backwards' from screen left/right or the player's visor.
 const presentingBalls=(frame?.objects||[]).filter(b=>{
  if(b.type!=='ball'||(b.transferKind!=='presentation'&&b.groundState!=='presented'))return false;
  const old=earlierBall.find(a=>a.id===b.id);
  return old?.ownerId===o.id||b.ownerId===o.id||
   ((pose==='grounded'||markerRole==='grounded')&&!old?.ownerId&&Math.hypot(b.x-o.x,b.y-o.y)<45);
 });
 const presentBall=presentingBalls.find(b=>b.id===tackleMarker?.breakdown?.ballId)||presentingBalls[0]||null;
 const presentation=!!presentBall;
 const presentationVisible=(presentation||semantic===17)&&(pose==='grounded'||activeCarrier||semantic===17);
 const ballAnchor=presentBall?g.toView(presentBall.x,presentBall.y):null;
 const playerAnchor=ballAnchor?g.toView(o.x,o.y):null;
 const vx=ballAnchor&&playerAnchor?ballAnchor.x-playerAnchor.x:0;
 const vy=ballAnchor&&playerAnchor?ballAnchor.y-playerAnchor.y:0;
 // Bearing is screen-up=0, clockwise-positive. Subtract the already-applied
 // player+field rotation; the source sprite's hands point LEFT (-90 degrees).
 const presentationBearing=Math.hypot(vx,vy)>2
  ?Math.atan2(vx,-vy)*180/Math.PI
  :Number(o.rot)||0;
 const presentationLocal=wrapMinionAngle(presentationBearing-(Number(o.rot)||0)-(Number(g.rotation)||0));

 if(pose==='held')sprite=24;
 else if(pose==='crouched')sprite=21;
 else if(pose==='ready')sprite=23+Math.min(3,Math.floor(step*4));
 else if(pose==='kneeling')sprite=21;
 else if(pose==='recovering')sprite=ruckusSequence(37,5,step);
 else if(activeTackler){
  // Approach frames before contact and low wrap/contact frames afterwards.
  const fraction=impact?clamp(step/Math.max(.12,impactAt),0,1):step;
  sprite=!impact?32:step<impactAt?27+Math.min(3,Math.floor(fraction*4)):
   31+Math.min(1,Math.floor(clamp((step-impactAt)/Math.max(.08,1-impactAt),0,.999)*2));
 }
 else if(activeCarrier){
  // The ball carrier stays upright until impact, then actually lies down.
  sprite=presentation?36:!impact?35:step<impactAt?(moving?10+look:look):
   33+Math.min(3,Math.floor(clamp((step-impactAt)/Math.max(.12,1-impactAt),0,.999)*4));
 }
 else if(pose==='grounded'||semantic===17||semantic===12||semantic===16){
  // 'present.png' was visibly a crouched pose. Use the genuine grounded
  // sprites supplied as tackled1..4 instead, with the real ball overlay.
  sprite=presentation||semantic===17?36:35;
 }
 else if(leavingTackle&&pose!=='grounded'&&pose!=='recovering')sprite=step<.3?24:look; // visibly let go and reset to normal stance
 else if(pose==='tackling'||[13,14].includes(semantic))sprite=ruckusSequence(27,6,step);
 else if(semantic===8)sprite=ruckusSequence(43,2,step);
 else if(semantic===9)sprite=ruckusSequence(44,2,step);
 else if(semantic===10)sprite=ruckusSequence(46,2,step);
 else if(semantic===11)sprite=ruckusSequence(20,3,step);
 else if(semantic===20)sprite=ruckusSequence(20,3,step);
 else if(semantic===21)sprite=ruckusSequence(29,3,step);
 else if(semantic===22)sprite=ruckusSequence(23,2,step);
 else if(semantic===15)sprite=ruckusSequence(33,4,step);
 else if(semantic===5)sprite=15+look;
 else if(semantic===6||(!moving&&semantic===0))sprite=look;
 else if(moving){
  if(semantic===1&&move.speed<14)sprite=6+Math.min(3,Math.round(look*3/4));
  else sprite=10+look;
 } else if([0,1,2,7,19].includes(semantic))sprite=look;
 // The source artwork faces towards the bottom of the source image; a single
 // 180 degree local rotation makes the *forward* character match Classic's
 // north-facing zero angle. The enclosing scene already applies o.rot.
 // Direction is chosen using the authored five-way sprite before rotation,
 // so we never rotate the entire head independently of its arms/feet.
 // Both PASS and RECEIVE use the same four-directional sprite reflections.
 // This avoids the old one-axis-only flip and keeps source art/timing intact.
 const action=actionBearing===null?null:ruckusActionSpriteTransform(actionBearing);
 const forwardAngle=180+(bindLocal!==null&&[20,21,22].includes(semantic)?bindLocal:(moving?forward:0));
 const mirrorX=action?.mirrorX??(([8,9,10].includes(semantic)&&relative<0)?-1:1);
 const mirrorY=action?.mirrorY??1;
 const angle=action?.angle??forwardAngle;
 // Our new image is a genuinely PRONE, ball-free pose, with both hands left.
 // A 90-degree offset aligns its hands with the existing presented ball.
 const proneAngle=90+presentationLocal;
 // The source passing/receiving poses are lateral; mirror the whole illustration
 // for the opposite side without changing the existing ball ownership or flight.
 const pulse=moving?Math.sin(step*12*Math.PI)*.55:0;
 const atlasId=team==='red'?'rugby-ruckus-red-54':'rugby-ruckus-blue-54';
 const cell=tileUse(atlasId,(sprite%RUCKUS_COLS)*RUCKUS_TILE,Math.floor(sprite/RUCKUS_COLS)*RUCKUS_TILE,RUCKUS_TILE);
 // The first fifth of the release shows the regular grounded silhouette.
 // The remainder shows a clearly held presentation pose without an extra ball.
 const showProne=presentationVisible&&(!previous||step>=.2);
 const presentArt=showProne?
  '<g transform="rotate('+fmt(proneAngle)+' 64 64)">'+
   '<svg x="0" y="33" width="128" height="62" viewBox="0 0 208 104" overflow="hidden">'+
    '<use href="#rugby-ruckus-presentation-v1" x="0" y="'+(team==='red'?-104:0)+'"/>'+
   '</svg></g>':null;
 const spriteArt=showProne?presentArt:
  '<g transform="rotate('+fmt(angle)+' 64 64) translate('+fmt(mirrorX===-1?128:0)+' '+fmt(mirrorY===-1?128:0)+') scale('+mirrorX+' '+mirrorY+')">'+cell+'</g>';

 return '<g class="cartoon-player ruckus-player" data-ruckus-team="'+team+'" data-stance="'+entry.name+'" data-ruckus-pose="'+(showProne?'present-prone':sprite)+'" data-ruckus-presentation-bearing="'+(showProne?fmt(presentationBearing):'none')+'" data-ruckus-look="'+fmt(gaze)+'" data-ruckus-catch="'+(catchLocal===null?'none':fmt(catchLocal))+'" data-ruckus-pass="'+(passLocal===null?'none':fmt(passLocal))+'" data-ruckus-mirror="'+mirrorX+','+mirrorY+'" data-ruckus-bind="'+(bindLocal===null?'none':fmt(bindLocal))+'" pointer-events="none">'+
  '<svg x="-35" y="'+fmt(-35+pulse)+'" width="70" height="70" viewBox="0 0 128 128" overflow="visible">'+
    spriteArt+
  '</svg><g>'+bodyEquipment(o)+'</g></g>';
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
// Eight H-cap coach illustrations selected from the user's actual 54-pose
// Harburling coach pack. The coach is a Ruckus-only visual replacement.
const H_COACH_FRAMES=[1,3,5,7,6,4,4,6]; // idle,walk,point spot,celebrate,point out,folded,hips,shrug
function cartoonCoach(o,objects,g,previous,frame,p){
 const gesture=coachIndex(o,previous,frame,p);
 const poseId=H_COACH_FRAMES[gesture]??1;
 const turn=coachTravelAngle(o,g,previous,frame,p)??smoothGaze(o,objects,g,previous,frame,p);
 // Original H-cap images look towards the bottom of their tile; the scene
 // already applies o.rot and field rotation, just as it does for players.
 const angle=wrapMinionAngle(turn+180);
 const t=RUCKUS_COACH_TILE,x=(poseId%RUCKUS_COACH_COLUMNS)*t,y=Math.floor(poseId/RUCKUS_COACH_COLUMNS)*t;
 const moving=movingInfo(o,previous,frame,p).moving;
 const bounce=moving?Math.sin(clamp(p,0,1)*12*Math.PI)*.65:0;
 return '<g class="cartoon-coach ruckus-h-coach" data-coach-pose="'+gesture+'" data-coach-frame="'+poseId+'" pointer-events="none" transform="rotate('+fmt(angle)+')">'+
  '<svg x="-39" y="'+fmt(-39+bounce)+'" width="78" height="78" viewBox="0 0 '+t+' '+t+'" overflow="visible">'+
   tileUse('rugby-ruckus-coach-h8',x,y,t)+'</svg></g>';
}

export function playerAppearance(o,pose,original,objects,g,previous,frame,progress=1,{cartoonMode=false,ink=false}={}){
 // Explicit output-mode boundary: cartoon changes must not alter Classic pose,
 // eye/arrow, scale, team colours or equipment.
 if(!cartoonMode)return classicPlayerAppearance(o,pose,original,objects,g,previous,frame,progress,{ink});
 if(!canCarry(o))return o.type==='shieldItem'?cartoonStandalonePad():original;
 return o.type==='coach'?cartoonCoach(o,objects,g,previous,frame,progress):cartoonRuckus(o,pose,objects,g,previous,frame,progress);
}
// The Classic belt tag overlay covers the Ruckus visor at pitch scale.
// In Ruckus only, attach small coloured strips directly to the hips.
export function cartoonTagIcon(o){
 if(!canCarry(o)||o.tagBelt!==true)return '';
 const c=tagColor(o.tagColor),left=o.tags?.left!==false,right=o.tags?.right!==false;
 // The artwork occupies the centre of its atlas viewport: attach both tabs
 // to the visible hips rather than +/-20px outside the character.
 const belt='<path d="M-10 7Q0 10 10 7" fill="none" stroke="#172932" stroke-width="2.5" stroke-linecap="round"/>';
 const tab=(x,side)=>'<g class="ruckus-tag-'+side+'"><rect x="'+x+'" y="5" width="5" height="10" rx="1.7" fill="'+c+'" stroke="#102e23" stroke-width="1.1"/><path d="M'+(x+1.3)+' 7v6" stroke="#fff" stroke-opacity=".65" stroke-width=".8"/></g>';
 const taken=Math.max(0,Number(o.heldTags)||0);
 const counter=taken?'<g transform="translate(19 -17)"><circle r="7" fill="#f5e8a4" stroke="#173526" stroke-width="1.5"/><text y="3" text-anchor="middle" font-size="9" font-weight="700" fill="#172820">'+Math.min(12,taken)+'</text></g>':'';
 return '<g class="ruckus-tag-indicators" pointer-events="none">'+belt+(left?tab(-12,'left'):'')+(right?tab(7,'right'):'')+counter+'</g>';
}
export function cartoonObjectOrder(items,cartoonMode){
 if(!cartoonMode)return items;
 // Keep loose and carried rugby balls visually in front of the mascot, rather
 // than buried under the torso after a catch. This changes draw order ONLY.
 const balls=[],attached=[],others=[];
 for(const item of items){
  if(item.type==='ball')balls.push(item);
  else if(item.type==='shieldItem'&&item.ownerId)attached.push(item);
  else others.push(item);
 }
 return others.concat(attached,balls);
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