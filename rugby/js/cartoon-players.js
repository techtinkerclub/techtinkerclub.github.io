// IMAGE-BASED Minion Mode. The artwork is extracted from the user-supplied 90-degree
// top-down pose sheet. This skin cannot change any drill positions, timing or ball state.
import {canCarry} from './possession.js?v=0.19.1';
import {MINION_ATLAS_URI,MINION_TILE,MINION_COLUMNS} from './minion-atlas-data.js?v=1';
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
function spriteIndex(o,pose,previous,frame,progress){
 const fixed={ready:3,crouched:3,tackling:5,held:4,grounded:6,kneeling:7,recovering:7,bound:8};
 if(Object.hasOwn(fixed,pose))return fixed[pose];
 const before=previous?.objects?.find(p=>p.id===o.id),end=frame?.objects?.find(p=>p.id===o.id);
 if(before&&end&&pose==='standing'){
  const distance=Math.hypot((Number(end.x)||0)-(Number(before.x)||0),(Number(end.y)||0)-(Number(before.y)||0));
  const timing=frame?.timing?.[o.id]||{start:0,end:100};
  const start=Number(timing.start)/100,finish=Number(timing.end)/100;
  if(distance>2&&Number(progress)>=start&&Number(progress)<=finish)
   return distance/(Number(frame?.seconds)||2)>35?2:1; // sprint or jog
 }
 // The supplied sheet has one single-eye idle example (no single-eye tackle poses).
 // Preserve that original rather than inventing eye artwork for missing action poses.
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
function coachSprite(o,previous,frame,progress){
 const index=coachSpriteIndex(o,previous,frame,progress),col=index%COACH_COLUMNS,row=Math.floor(index/COACH_COLUMNS);
 const t=COACH_TILE,size=76;
 return '<g class="cartoon-player cartoon-coach top-down-coach-image" pointer-events="none">'+
  '<svg x="'+(-size/2)+'" y="'+(-size/2)+'" width="'+size+'" height="'+size+
  '" viewBox="'+(col*t)+' '+(row*t)+' '+t+' '+t+'" overflow="hidden">'+
  '<use href="#rugby-coach-atlas"/></svg></g>';
}
function sheetPlayer(o,pose,previous,frame,progress){
 const index=spriteIndex(o,pose,previous,frame,progress)+(o.type==='defender'?10:0);
 const col=index%MINION_COLUMNS,row=Math.floor(index/MINION_COLUMNS);
 const t=MINION_TILE, size=54;
 return '<g class="cartoon-player minion-mode-player minion-top-down minion-image-player" data-pose="'+(pose||'standing')+'" pointer-events="none">'+
  '<svg x="'+(-size/2)+'" y="'+(-size/2)+'" width="'+size+'" height="'+size+
  '" viewBox="'+(col*t)+' '+(row*t)+' '+t+' '+t+'" overflow="hidden">'+
  '<use href="#rugby-minion-atlas"/></svg>'+attachedEquipmentGraphic(o)+'</g>';
}

/** The regular player keeps its existing diagram geometry and a single gaze arrow. */
export function playerAppearance(o,pose,original,objects,g,previous,frame,progress=1,{cartoonMode=false,ink=false}={}){
 if(!canCarry(o))return original;
 if(cartoonMode&&!ink)return o.type==='coach'?coachSprite(o,previous,frame,progress):sheetPlayer(o,pose,previous,frame,progress);
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
