// Optional overhead playful renderer. This never changes drill objects, body poses or timing.
import {canCarry} from './possession.js?v=0.19.1';
import {playerHeadAngle} from './player-gaze.js?v=3';

const arrowRE=/<path d="M-5 -12 L0 -19 L5 -12 Z" fill="#f7fff6"\s*\/>|<path d="M-5 -8L0 -16L5 -8Z" fill="#fff"\s*\/>|<path d="M-5 -12L0 -19L5 -12Z" fill="#fff"\s*\/>|<path d="M-4 -15L0 -21L4 -15Z" fill="#fff"\s*\/>|<path d="M-5 -7L0 -14L5 -7Z" fill="#fff"\s*\/>/g;
const inkLine=(ink)=>ink?'#222':'#112d27';
const safeAngle=n=>Number.isFinite(n)?n.toFixed(1):'0';
const hash=str=>{let h=0;for(const c of String(str||''))h=((h*33)^c.charCodeAt(0))>>>0;return h};

/** In the normal view, retain the original rugby player and show ONE directional arrow.
 * The built-in fixed arrow is stripped, so gaze and body are not contradictory. */
export function playerAppearance(o,pose,original,objects,g,previous,frame,progress=1,{cartoonMode=false,ink=false}={}){
 if(!canCarry(o))return original;
 const angle=playerHeadAngle(o,objects,g,previous,frame,progress);
 if(!cartoonMode){
  const plain=original.replace(arrowRE,'');
  if(angle===null||['grounded','kneeling'].includes(pose))return plain;
  const line=ink?'#333':'#173526';
  const arrow='<g class="player-gaze-arrow" pointer-events="none" transform="rotate('+safeAngle(angle)+')">'+
    '<path d="M0 -21L-6 -11L6 -11Z" fill="#fffefa" stroke="'+line+'" stroke-width="1.5" stroke-linejoin="round"/></g>';
  return plain+arrow;
 }
 // From above, the Minion is mostly a yellow crown, not a face-on figure.
 // Only the shallow leading edge of the goggles is visible, showing gaze.
 // Team-coloured overalls sit on the rear of the body, retaining team identity.
 const seed=hash(o.id),oneEye=seed%4===0,hairStyle=seed%3;
 const suit=o.type==='defender'?'#e77a4f':o.type==='coach'?'#74aa64':o.type==='neutral'?'#ac8cd3':'#468bcb';
 const stroke=inkLine(ink),yellow=ink?'#f2edb7':'#ffe063',shade=ink?'#d3c989':'#e6b73e';
 const grounded=pose==='grounded',low=pose==='kneeling'||pose==='crouched';
 const reaching=['tackling','ready','held','bound'].includes(pose);
 const radiusX=grounded?19:low?16:16.5,radiusY=grounded?16.5:low?17:19;
 // Hands and feet are short overhead shapes, never dangling upright legs.
 const hands=reaching
  ?'<path d="M-13 -4Q-18 -11 -22 -16M13 -4Q18 -11 22 -16" stroke="'+yellow+'" stroke-width="5.5" fill="none" stroke-linecap="round"/>'+
   '<ellipse cx="-22" cy="-16" rx="4" ry="3.5" fill="'+stroke+'"/><ellipse cx="22" cy="-16" rx="4" ry="3.5" fill="'+stroke+'"/>'
  :'<path d="M-14 1Q-21 0 -24 5M14 1Q21 0 24 5" stroke="'+yellow+'" stroke-width="5.5" fill="none" stroke-linecap="round"/>'+
   '<ellipse cx="-24" cy="5" rx="4" ry="3.5" fill="'+stroke+'"/><ellipse cx="24" cy="5" rx="4" ry="3.5" fill="'+stroke+'"/>';
 const boots='<rect x="-11" y="'+(grounded?12:16)+'" width="8" height="6" rx="2.4" fill="'+stroke+'"/>'+
  '<rect x="3" y="'+(grounded?12:16)+'" width="8" height="6" rx="2.4" fill="'+stroke+'"/>';
 const body='<ellipse cx="0" cy="0" rx="'+radiusX+'" ry="'+radiusY+'" fill="'+yellow+'" stroke="'+stroke+'" stroke-width="2.2"/>'+
  '<path d="M-13 6Q0 10 13 6L12 14Q0 20 -12 14Z" fill="'+suit+'" stroke="'+stroke+'" stroke-width="1.2"/>'+
  '<path d="M-11 5L-9 11M11 5L9 11" stroke="'+suit+'" stroke-width="4" stroke-linecap="round"/>'+
  '<path d="M-8 13Q0 16 8 13" stroke="'+stroke+'" stroke-opacity=".45" stroke-width="1" fill="none"/>'+
  '<circle cx="-8" cy="10.5" r="1.2" fill="#f7e9b7"/><circle cx="8" cy="10.5" r="1.2" fill="#f7e9b7"/>'+
  '<path d="M-10 -7Q-7 -13 -2 -13" fill="none" stroke="#fff4a7" stroke-width="2" stroke-linecap="round" opacity=".8"/>'+
  '<path d="M-13 7Q0 12 13 7" fill="none" stroke="'+shade+'" stroke-width="1" opacity=".6"/>';
 // Tiny hair swirls sit on the crown; no face-on smile or forehead.
 const hair=hairStyle===0?'<path d="M-4 -3l-2 -4M0 -4v-5M4 -3l2 -4" stroke="'+stroke+'" stroke-width="1.6" stroke-linecap="round"/>'
  :hairStyle===1?'<path d="M-3 -3q5 -6 7 0" fill="none" stroke="'+stroke+'" stroke-width="1.5" stroke-linecap="round"/>':'';
 const lens=(x)=>'<ellipse cx="'+x+'" cy="-13.2" rx="'+(oneEye?6.5:5.4)+'" ry="4" fill="#9ca7ad" stroke="'+stroke+'" stroke-width="1.2"/>'+
  '<ellipse cx="'+x+'" cy="-13.4" rx="'+(oneEye?4.6:3.8)+'" ry="2.6" fill="#f9fcf8"/>'+
  '<ellipse cx="'+x+'" cy="-14.4" rx="1.7" ry="1.7" fill="#5b3927"/>'+
  '<circle cx="'+(x+.55)+'" cy="-14.9" r=".6" fill="#fff"/>';
 const goggles='<path d="M-12 -12Q0 -17 12 -12" fill="none" stroke="'+stroke+'" stroke-width="3.2" stroke-linecap="round"/>'+
  (oneEye?lens(0):lens(-5.6)+lens(5.6));
 // The goggles swivel with head direction, not the overall body or rugby stance.
 const eyeDirection=angle===null?0:angle;
 const gaze='<g class="cartoon-player-goggles" transform="rotate('+safeAngle(eyeDirection)+')">'+goggles+'</g>';
 return '<g class="cartoon-player minion-mode-player minion-top-down" pointer-events="none">'+boots+hands+body+hair+gaze+'</g>';
}
export function cartoonPitchDecor(g){
 const w=Number(g.viewWidth||900),h=Number(g.viewHeight||540);
 const positions=[[30,30],[w-30,30],[30,h-30],[w-30,h-30]];
 return '<g class="cartoon-pitch-decor" pointer-events="none">'+
 positions.map(([x,y],i)=>'<g transform="translate('+x+' '+y+')">'+
 '<circle r="9" fill="#ffe97e" opacity=".8"/>'+
 Array.from({length:5},(_,k)=>'<circle cx="'+(Math.cos(k*Math.PI*2/5)*12).toFixed(1)+'" cy="'+(Math.sin(k*Math.PI*2/5)*12).toFixed(1)+'" r="6" fill="'+(i%2?'#f7b0d1':'#f9f3c5')+'" opacity=".7"/>').join('')+
 '<circle r="5" fill="#f4b743"/></g>').join('')+'</g>';
}
