// IMAGE-BASED Minion Mode. The artwork is extracted from the user-supplied 90-degree
// top-down pose sheet. This skin cannot change any drill positions, timing or ball state.
import {canCarry} from './possession.js?v=0.19.1';
import {MINION_ATLAS_URI,MINION_TILE,MINION_COLUMNS} from './minion-atlas-data.js?v=1';
const arrowRE=/<path d="M-5 -12 L0 -19 L5 -12 Z" fill="#f7fff6"\s*\/>|<path d="M-5 -8L0 -16L5 -8Z" fill="#fff"\s*\/>|<path d="M-5 -12L0 -19L5 -12Z" fill="#fff"\s*\/>|<path d="M-4 -15L0 -21L4 -15Z" fill="#fff"\s*\/>|<path d="M-5 -7L0 -14L5 -7Z" fill="#fff"\s*\/>/g;
const safeAngle=n=>Number.isFinite(n)?n.toFixed(1):'0';
const hash=str=>{let h=0;for(const c of String(str||''))h=((h*33)^c.charCodeAt(0))>>>0;return h};

/** Add once at the SVG root so that exports and canvases contain the actual raster artwork. */
export function cartoonSpriteDefs(){
 return '<defs><image id="rugby-minion-atlas" href="'+MINION_ATLAS_URI+
  '" width="'+(MINION_COLUMNS*MINION_TILE)+'" height="'+(4*MINION_TILE)+'" /></defs>';
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
function sheetPlayer(o,pose,previous,frame,progress){
 const index=spriteIndex(o,pose,previous,frame,progress)+(o.type==='defender'?10:0);
 const col=index%MINION_COLUMNS,row=Math.floor(index/MINION_COLUMNS);
 const t=MINION_TILE, size=54;
 return '<g class="cartoon-player minion-mode-player minion-top-down minion-image-player" data-pose="'+(pose||'standing')+'" pointer-events="none">'+
  '<svg x="'+(-size/2)+'" y="'+(-size/2)+'" width="'+size+'" height="'+size+
  '" viewBox="'+(col*t)+' '+(row*t)+' '+t+' '+t+'" overflow="hidden">'+
  '<use href="#rugby-minion-atlas"/></svg></g>';
}

/** The regular player keeps its existing diagram geometry and a single gaze arrow. */
export function playerAppearance(o,pose,original,objects,g,previous,frame,progress=1,{cartoonMode=false,ink=false}={}){
 if(!canCarry(o))return original;
 if(cartoonMode&&!ink)return sheetPlayer(o,pose,previous,frame,progress);
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
export function cartoonPitchDecor(g){
 const w=Number(g.viewWidth||900),h=Number(g.viewHeight||540),positions=[[30,30],[w-30,30],[30,h-30],[w-30,h-30]];
 const n=x=>(Math.round(x*10)/10).toString();
 return '<g class="cartoon-pitch-decor" pointer-events="none">'+
 positions.map(([x,y],i)=>'<g transform="translate('+x+' '+y+')">'+
 '<circle r="9" fill="#ffe97e" opacity=".8"/>'+
 Array.from({length:5},(_,k)=>'<circle cx="'+n(Math.cos(k*Math.PI*2/5)*12)+'" cy="'+n(Math.sin(k*Math.PI*2/5)*12)+'" r="6" fill="'+(i%2?'#f7b0d1':'#f9f3c5')+'" opacity=".7"/>').join('')+
 '<circle r="5" fill="#f4b743"/></g>').join('')+'</g>';
}
