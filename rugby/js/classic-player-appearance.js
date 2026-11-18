// Classic coaching player rendering is isolated from all cartoon sprite changes.
// Retains the existing posedShape output and the existing head/target gaze arrow;
// no Minion atlas, pose mapping or sprite transformations are referenced here.
import {canCarry} from './possession.js?v=0.19.1';
import {playerHeadAngle} from './player-gaze.js?v=3';
const arrowRE=/<path d="M-5 -12 L0 -19 L5 -12 Z" fill="#f7fff6"\s*\/>|<path d="M-5 -8L0 -16L5 -8Z" fill="#fff"\s*\/>|<path d="M-5 -12L0 -19L5 -12Z" fill="#fff"\s*\/>|<path d="M-4 -15L0 -21L4 -15Z" fill="#fff"\s*\/>|<path d="M-5 -7L0 -14L5 -7Z" fill="#fff"\s*\/>/g;
const fmt=n=>Number.isFinite(n)?Number(n).toFixed(1):'0';
export function classicPlayerAppearance(o,pose,original,objects,g,previous,frame,progress=1,{ink=false}={}){
 if(!canCarry(o))return original;
 const plain=original.replace(arrowRE,'');
 if(['grounded','kneeling'].includes(pose))return plain;
 const angle=playerHeadAngle(o,objects,g,previous,frame,progress);
 if(angle===null)return plain;
 return plain+'<g class="player-gaze-arrow" pointer-events="none" transform="rotate('+fmt(angle)+')">'+
  '<path d="M0 -21L-6 -11L6 -11Z" fill="#fffefa" stroke="'+(ink?'#333':'#173526')+'" stroke-width="1.5" stroke-linejoin="round"/></g>';
}
