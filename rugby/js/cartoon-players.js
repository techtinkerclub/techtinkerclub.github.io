// Independent-head, image-based Minion Mode. Visual translation ONLY: the editor,
// possession, coaching gaze, tackling, ball physics and timing use the same data
// and shared engines as Classic mode. Every source pose is ball- and pad-free.
import {canCarry} from './possession.js?v=0.19.1';
import {routeSamples,sampleRoute} from './routes.js?v=0.4.3';
import {playerHeadAngle} from './player-gaze.js?v=3';
import {RIG_TILE,RIG_COLS,RIG_TEAM_STRIDE,RIG_ROWS,RIG_POSES,RIG_BODY_URI,RIG_HEAD_URI} from './minion-rig-data.js?v=1';
import {COACH_ATLAS_URI,COACH_TILE,COACH_COLUMNS} from './coach-atlas-data.js?v=1';
const arrowRE=/<path d="M-5 -12 L0 -19 L5 -12 Z" fill="#f7fff6"\s*\/>|<path d="M-5 -8L0 -16L5 -8Z" fill="#fff"\s*\/>|<path d="M-5 -12L0 -19L5 -12Z" fill="#fff"\s*\/>|<path d="M-4 -15L0 -21L4 -15Z" fill="#fff"\s*\/>|<path d="M-5 -7L0 -14L5 -7Z" fill="#fff"\s*\/>/g;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const fmt=n=>Number.isFinite(n)?Number(n).toFixed(1):'0';
const hash=str=>{let h=0;for(const c of String(str||''))h=((h*33)^c.charCodeAt(0))>>>0;return h};

/** Embedded assets also survive self-contained SVG, printed coaching sheets and video canvas exports. */
export function cartoonSpriteDefs(){
 return '<defs><image id="rugby-minion-body-v9" href="'+RIG_BODY_URI+'" width="'+(RIG_COLS*RIG_TILE)+'" height="'+(RIG_ROWS*RIG_TILE)+'"/>'+
  '<image id="rugby-minion-head-v9" href="'+RIG_HEAD_URI+'" width="'+(RIG_COLS*RIG_TILE)+'" height="'+(RIG_ROWS*RIG_TILE)+'"/>'+
  '<image id="rugby-coach-original-v10" href="'+COACH_ATLAS_URI+'" width="'+(COACH_COLUMNS*COACH_TILE)+'" height="'+(2*COACH_TILE)+'"/></defs>';
}
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
 if(pose==='recovering'||pose==='kneeling')return 18;
 if(o.type==='shield')return 23;
 if(o.type==='bagplayer')return 24;
 if(pose==='tackling')return tackle&&p>=.53?14:13;
 if(pose==='held')return 14;
 if(pose==='bound')return maul?22:ruck?.breakdown?.phase==='clearout'?21:20;
 if(pose==='crouched')return ruck?21:3;
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
  if(move.turning)return 4;
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
function bodyEquipment(o){
 if(o.type==='shield')return '<g class="minion-equipment-overlay" aria-label="Tackle shield carried">'+
  '<rect x="-18" y="-25" width="36" height="20" rx="5" fill="#31444e" stroke="#d6e7ed" stroke-width="2.2"/>'+
  '<path d="M-11 -15H11" stroke="#85aab5" stroke-width="2"/>'+
  '<path d="M-11 -24V-28M11 -24V-28" stroke="#1e2b35" stroke-width="2.5"/></g>';
 if(o.type==='bagplayer')return '<g class="minion-equipment-overlay" aria-label="Tackle bag carried">'+
  '<rect x="-12" y="-32" width="24" height="31" rx="8" fill="#c17b4a" stroke="#603626" stroke-width="2"/>'+
  '<path d="M-7 -25V-10M7 -25V-10" stroke="#f2b47e" stroke-width="1.9"/></g>';
 return '';
}
const tileUse=(id,x,y,t)=>'<svg width="'+t+'" height="'+t+'" viewBox="'+x+' '+y+' '+t+' '+t+'" overflow="hidden" style="overflow:hidden"><use href="#'+id+'"/></svg>';
function cartoonMinion(o,pose,objects,g,previous,frame,p){
 const poseId=cartoonPoseIndex(o,pose,objects,previous,frame,p);
 const team=o.type==='defender'||o.type==='bagplayer'?1:0;
 const atlasId=poseId+team*RIG_TEAM_STRIDE;
 const tile=RIG_TILE,x=(atlasId%RIG_COLS)*tile,y=Math.floor(atlasId/RIG_COLS)*tile;
 const entry=RIG_POSES[poseId],pivot=entry.headPivot;
 const move=movingInfo(o,previous,frame,p);
 // The source goggle is at the SOUTH edge of the head, so rotate only the
 // articulated head by 180 degrees to align its original eye with the game's
 // local forward (-Y). Keep the legs, arms and torso in their original stance.
 const rotation=entry.grounded?0:180+smoothGaze(o,objects,g,previous,frame,p);
 const gait=move.moving?Math.sin(p*12*Math.PI)*1.3:0;
 const wobble=move.moving?Math.sin(p*7*Math.PI)*1.1:0;
 const size=54;
 // Render the clipped head CELL before rotating it. Rotating the entire source
 // atlas instead would leak neighbouring sprites into the character viewport.
 const body=tileUse('rugby-minion-body-v9',x,y,tile);
 const head=entry.grounded?'':
  '<g class="minion-independent-head" data-head-angle="'+fmt(rotation)+'" transform="rotate('+fmt(rotation)+' '+fmt(pivot[0])+' '+fmt(pivot[1])+')">'+
    tileUse('rugby-minion-head-v9',x,y,tile)+'</g>';
 return '<g class="cartoon-player minion-mode-player minion-rig-player" data-stance="'+entry.name+'" pointer-events="none">'+
  '<g transform="translate(0 '+fmt(gait)+') rotate('+fmt(wobble)+')">'+
   '<svg x="'+(-size/2)+'" y="'+(-size/2)+'" width="'+size+'" height="'+size+'" viewBox="0 0 '+tile+' '+tile+'" overflow="visible">'+body+head+'</svg>'+bodyEquipment(o)+'</g></g>';
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
 const k=coachIndex(o,previous,frame,p),t=COACH_TILE,size=46;
 const x=k%COACH_COLUMNS*t,y=Math.floor(k/COACH_COLUMNS)*t;
 // Use the actual coach artwork supplied by the user. The artificial
 // protruding nose was visually incorrect and has been discarded.
 // Body/head remain upright (crown north, boots south), with body-facing and
 // route-following handled by the same object rotation as Classic mode.
 const angle=coachTravelAngle(o,g,previous,frame,p)??smoothGaze(o,objects,g,previous,frame,p);
 return '<g class="cartoon-coach top-down-coach-image" data-coach-pose="'+k+'" pointer-events="none" transform="rotate('+fmt(angle)+')">'+
  '<svg x="'+(-size/2)+'" y="'+(-size/2)+'" width="'+size+'" height="'+size+'" viewBox="'+x+' '+y+' '+t+' '+t+'" overflow="hidden" style="overflow:hidden">'+
  '<use href="#rugby-coach-original-v10"/></svg></g>';
}
export function playerAppearance(o,pose,original,objects,g,previous,frame,progress=1,{cartoonMode=false,ink=false}={}){
 if(!canCarry(o))return original;
 if(cartoonMode)return o.type==='coach'?cartoonCoach(o,objects,g,previous,frame,progress):cartoonMinion(o,pose,objects,g,previous,frame,progress);
 // Leave the normal editor and presentation appearance untouched.
 const plain=original.replace(arrowRE,'');
 if(['grounded','kneeling'].includes(pose))return plain;
 const angle=playerHeadAngle(o,objects,g,previous,frame,progress);
 if(angle===null)return plain;
 return plain+'<g class="player-gaze-arrow" pointer-events="none" transform="rotate('+fmt(angle)+')">'+
  '<path d="M0 -21L-6 -11L6 -11Z" fill="#fffefa" stroke="'+(ink?'#333':'#173526')+'" stroke-width="1.5" stroke-linejoin="round"/></g>';
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