// IMAGE-BASED Minion Mode. The artwork is extracted from the user-supplied 90-degree
// top-down pose sheet. This skin cannot change any drill positions, timing or ball state.
import {canCarry} from './possession.js?v=0.19.1';
import {MINION_ATLAS_URI,MINION_TILE,MINION_COLUMNS,MINION_POSES_PER_TEAM} from './minion-atlas-v2.js?v=1';
import {COACH_ATLAS_URI,COACH_TILE,COACH_COLUMNS,COACH_GESTURES} from './coach-atlas-data.js?v=1';
const arrowRE=/<path d="M-5 -12 L0 -19 L5 -12 Z" fill="#f7fff6"\s*\/>|<path d="M-5 -8L0 -16L5 -8Z" fill="#fff"\s*\/>|<path d="M-5 -12L0 -19L5 -12Z" fill="#fff"\s*\/>|<path d="M-4 -15L0 -21L4 -15Z" fill="#fff"\s*\/>|<path d="M-5 -7L0 -14L5 -7Z" fill="#fff"\s*\/>/g;
const safeAngle=n=>Number.isFinite(n)?n.toFixed(1):'0';
const hash=str=>{let h=0;for(const c of String(str||''))h=((h*33)^c.charCodeAt(0))>>>0;return h};

/** Add once at the SVG root so that exports and canvases contain the actual raster artwork. */
export function cartoonSpriteDefs(){
 return '<defs><image id="rugby-minion-atlas" href="'+MINION_ATLAS_URI+
  '" width="'+(MINION_COLUMNS*MINION_TILE)+'" height="'+(4*MINION_TILE)+'" />'+
  '<image id="rugby-coach-atlas" href="'+COACH_ATLAS_URI+'" width="'+(COACH_COLUMNS*COACH_TILE)+'" height="'+(2*COACH_TILE)+'" /></defs>';
}
// Visual-only mapping of the existing game states to the extracted, ball-free sheet.
function spriteIndex(o,pose,objects,previous,frame,progress){
 const members=(frame?.objects||[]).filter(m=>['tackle','ruck','maul','scrum'].includes(m.type)&&m.members?.some(member=>member.id===o.id));
 const inContact=members.find(m=>m.type==='tackle'),inRuck=members.find(m=>m.type==='ruck'),inMaul=members.find(m=>m.type==='maul');
 if(pose==='grounded')return 6;
 if(pose==='recovering'||pose==='kneeling')return 7;
 if(pose==='tackling')return inContact&&progress>.55?5:4;
 if(pose==='held')return 4;
 if(pose==='bound')return inMaul?14:inRuck?13:8;
 if(pose==='ready'||pose==='crouched')return 3;
 const before=previous?.objects?.find(p=>p.id===o.id),end=frame?.objects?.find(p=>p.id===o.id);
 const balls=frame?.objects?.filter(b=>b.type==='ball')||[];
 if(pose==='standing'&&previous&&frame){
  const passing=balls.some(b=>previous.objects?.find(q=>q.id===b.id)?.ownerId===o.id&&b.ownerId!==o.id&&b.transferKind==='pass');
  const receiving=balls.some(b=>b.ownerId===o.id&&previous.objects?.find(q=>q.id===b.id)?.ownerId!==o.id&&b.transferKind==='pass');
  if((passing||receiving)&&progress>=.25&&progress<=.85)return 11; // empty hands; ball stays separate
 }
 if(before&&end&&pose==='standing'){
  const distance=Math.hypot((Number(end.x)||0)-(Number(before.x)||0),(Number(end.y)||0)-(Number(before.y)||0));
  const timing=frame?.timing?.[o.id]||{start:0,end:100},start=Number(timing.start)/100,finish=Number(timing.end)/100;
  if(distance>2&&progress>=start&&progress<=finish){
   if(Math.abs((Number(end.rot)||0)-(Number(before.rot)||0))>32)return 10; // changing direction
   return distance/(Number(frame?.seconds)||2)>35?2:1;
  }
 }
 return hash(o.id)%5===0?9:0;
}
// An equipped pad belongs to the player's model even when the character body
// is replaced by artwork. Draw equipment AFTER the sprite so it remains visible.
function attachedEquipmentGraphic(o){
 if(o.type==='shield')return '<g class="minion-equipment-overlay" aria-label="Tackle shield carried">'+
  '<rect x="-17" y="-19" width="34" height="16" rx="4" fill="#31444e" stroke="#d6e7ed" stroke-width="2"/>'+
  '<path d="M-12 -11H12" fill="none" stroke="#85aab5" stroke-width="2"/>'+
  '<path d="M-11 -19V-23M11 -19V-23" fill="none" stroke="#131c24" stroke-width="2.5"/>'+
  '</g>';
 if(o.type==='bagplayer')return '<g class="minion-equipment-overlay" aria-label="Tackle bag carried">'+
  '<rect x="-11" y="-30" width="22" height="28" rx="7" fill="#be7848" stroke="#502e22" stroke-width="2"/>'+
  '<path d="M-6 -22V-8M6 -22V-8" fill="none" stroke="#e4ab6e" stroke-width="1.8"/>'+
  '</g>';
 return '';
}
const COACH_INDEX={idle:0,walking:1,pointing_down:2,celebrate:3,pointing_out:4,arms_folded:5,hands_on_hips:6,shrug:7};
function coachSpriteIndex(o,previous,frame,progress){
 const gesture=String(o.coachGesture||'auto');
 if(Object.hasOwn(COACH_INDEX,gesture))return COACH_INDEX[gesture];
 const signal=frame?.signal;
 const fraction=Number(progress)||0,duration=Math.max(.01,Number(frame?.seconds)||2);
 if(signal?.kind==='whistle'&&signal.coachId===o.id&&fraction*duration<Math.max(.1,Number(signal.duration)||.5))
  return COACH_INDEX.pointing_out;
 const prior=previous?.objects?.find(p=>p.id===o.id);
 const next=frame?.objects?.find(p=>p.id===o.id);
 if(prior&&next&&Math.hypot((next.x||0)-(prior.x||0),(next.y||0)-(prior.y||0))>.2&&fraction>0&&fraction<1)
  return COACH_INDEX.walking;
 return COACH_INDEX.idle;
}
function coachSprite(o,objects,g,previous,frame,progress){
 const index=coachSpriteIndex(o,previous,frame,progress),col=index%COACH_COLUMNS,row=Math.floor(index/COACH_COLUMNS);
 const t=COACH_TILE,size=76;
 // The original sheet already places the head north and boots south.
 // Follow the same look/target cue used in Classic mode without reversing
 // that silhouette or altering the coach's saved orientation.
 const look=playerHeadAngle(o,objects||[],g,previous,frame,progress);
 const angle=look===null?0:look;
 return '<g class="cartoon-player cartoon-coach top-down-coach-image" pointer-events="none" transform="rotate('+safeAngle(angle)+')">'+
  '<svg x="'+(-size/2)+'" y="'+(-size/2)+'" width="'+size+'" height="'+size+
  '" viewBox="'+(col*t)+' '+(row*t)+' '+t+' '+t+'" overflow="hidden">'+
  '<use href="#rugby-coach-atlas"/></svg></g>';
}
// Silver goggles must follow exactly the same calculated gaze as Classic mode.
// The static goggles were removed from the raster atlas so no contradictory
// second pair remains. A single eye or a pair is based on stable player ID.
function facingGoggles(cx,cy,angle,oneEye){
 const lens=(x,rx)=>'<g transform="translate('+x+' -19)">'+
  '<ellipse rx="'+rx+'" ry="4.5" fill="#aeb8c2" stroke="#20282e" stroke-width="1.5"/>'+
  '<ellipse cy=".7" rx="'+(rx-1.5)+'" ry="2.8" fill="#f8faf8"/>'+
  '<circle cx="0" cy="-.6" r="1.5" fill="#443628"/><circle cx=".5" cy="-1.3" r=".65" fill="#fff"/></g>';
 return '<g class="minion-gaze" transform="translate('+cx+' '+cy+') rotate('+safeAngle(angle)+')">'+
  '<path d="M-16 -17 Q0 -24 16 -17" stroke="#2a2c31" stroke-width="2.5" fill="none"/>'+
  (oneEye?lens(0,7.2):lens(-6.2,5.4)+lens(6.2,5.4))+'</g>';
}
function sheetPlayer(o,pose,objects,g,previous,frame,progress){
 const index=spriteIndex(o,pose,objects,previous,frame,progress)+(o.type==='defender'||o.type==='bagplayer'?MINION_POSES_PER_TEAM:0);
 const col=index%MINION_COLUMNS,row=Math.floor(index/MINION_COLUMNS),t=MINION_TILE,size=54;
 const angle=playerHeadAngle(o,objects||[],g,previous,frame,progress);
 const lenses=(pose==='grounded'||pose==='kneeling')?'':facingGoggles(col*t+36,row*t+28,angle??0,hash(o.id)%4===0);
 return '<g class="cartoon-player minion-mode-player minion-top-down minion-image-player" data-pose="'+(pose||'standing')+'" pointer-events="none">'+
  '<svg x="'+(-size/2)+'" y="'+(-size/2)+'" width="'+size+'" height="'+size+
  '" viewBox="'+(col*t)+' '+(row*t)+' '+t+' '+t+'" overflow="hidden">'+
  '<use href="#rugby-minion-atlas"/>'+lenses+'</svg>'+attachedEquipmentGraphic(o)+'</g>';
}
/** The regular player keeps its existing diagram geometry and a single gaze arrow. */
export function playerAppearance(o,pose,original,objects,g,previous,frame,progress=1,{cartoonMode=false,ink=false}={}){
 if(!canCarry(o))return original;
 if(cartoonMode&&!ink)return o.type==='coach'?coachSprite(o,objects,g,previous,frame,progress):sheetPlayer(o,pose,objects,g,previous,frame,progress);
 const plain=original.replace(arrowRE,'');
 if(['grounded','kneeling'].includes(pose))return plain;
 // Normal view preserves the single gaze arrow, but never an extra pair of eyes.
 // Import lazily via the separate player-gaze module, avoiding contact changes.
 return gazeArrow(o,objects,g,previous,frame,progress,plain,ink);
}
import {playerHeadAngle} from './player-gaze.js?v=3';
function gazeArrow(o,objects,g,previous,frame,progress,original,ink){
 const angle=playerHeadAngle(o,objects,g,previous,frame,progress);
 if(angle===null)return original;
 return original+'<g class="player-gaze-arrow" pointer-events="none" transform="rotate('+safeAngle(angle)+')">'+
  '<path d="M0 -21L-6 -11L6 -11Z" fill="#fffefa" stroke="'+(ink?'#333':'#173526')+'" stroke-width="1.5" stroke-linejoin="round"/></g>';
}
/** In cartoon mode a shield held by a player must sit IN FRONT of the player.
 * Free shields retain their normal drawing order; classic view is untouched.
 * This does not move any object or change its stored drawLayer/drawOrder. */
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
