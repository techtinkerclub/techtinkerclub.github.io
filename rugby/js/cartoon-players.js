// Optional playful renderer. This never changes drill objects, body poses or timing.
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
 // Yellow goggle-eyed cartoon teammates: clearly a FUN visual theme, not a coaching pose.
 // Variations depend on stable IDs: same player is drawn consistently in every frame.
 const seed=hash(o.id),oneEye=(seed%4===0),silly=(seed%3===0);
 const suit=o.type==='defender'?'#e77a4f':o.type==='coach'?'#74aa64':o.type==='neutral'?'#ac8cd3':'#468bcb';
 const stroke=inkLine(ink),yellow=ink?'#f2edb7':'#ffe063',shade=ink?'#d3c989':'#e6b73e';
 const horizontal=pose==='grounded',low=pose==='kneeling',height=horizontal?17:low?19:23;
 const arm=pose==='tackling'||pose==='held'||pose==='ready';
 const arms='<path d="'+(arm?'M-13 -1L-24 -10M13 -1L24 -10':'M-14 1L-23 9M14 1L23 9')+'" fill="none" stroke="'+yellow+'" stroke-width="6" stroke-linecap="round"/>'+
 '<circle cx="-23" cy="'+(arm?-10:9)+'" r="4" fill="'+stroke+'"/><circle cx="23" cy="'+(arm?-10:9)+'" r="4" fill="'+stroke+'"/>';
 const legs='<path d="M-7 14L-9 22M7 14L9 22" fill="none" stroke="'+stroke+'" stroke-width="5" stroke-linecap="round"/>';
 const body='<ellipse cx="0" cy="0" rx="'+(horizontal?18:15)+'" ry="'+height+'" fill="'+yellow+'" stroke="'+stroke+'" stroke-width="2.5"/>'+
 '<path d="M-12 5Q0 9 12 5L12 16Q0 20 -12 16Z" fill="'+suit+'" stroke="'+stroke+'" stroke-width="1.3"/>'+
 '<path d="M-10 4L-8 11M10 4L8 11" stroke="'+suit+'" stroke-width="4"/><circle cy="13" r="2" fill="#f8f4d3"/>';
 const eyes=oneEye?
  '<circle cx="0" cy="-8" r="8.3" fill="#a0a8ae" stroke="'+stroke+'" stroke-width="1.7"/>'+
  '<circle cx="0" cy="-8" r="5.7" fill="#fff" />'+
  '<circle cx="0" cy="-10.4" r="2.6" fill="#5b3927"/><circle cx=".7" cy="-11" r=".9" fill="#fff"/>':
  '<path d="M-15 -9H15" stroke="'+stroke+'" stroke-width="4"/>'+
  [-7,7].map(x=>'<circle cx="'+x+'" cy="-8" r="7" fill="#a0a8ae" stroke="'+stroke+'" stroke-width="1.4"/>'+
     '<circle cx="'+x+'" cy="-8" r="4.7" fill="#fff"/>'+
     '<circle cx="'+x+'" cy="-10" r="2" fill="#5b3927"/>'+
     '<circle cx="'+(x+.6)+'" cy="-10.5" r=".8" fill="#fff"/>').join('');
 const mouth=silly?'<path d="M-5 5Q0 12 5 5" stroke="'+stroke+'" stroke-width="1.4" fill="none"/>':
 '<path d="M-3 6Q0 8 3 6" stroke="'+stroke+'" stroke-width="1.4" fill="none"/>';
 const hair=seed%3===0?'<path d="M-5 -21L-7 -26M0 -22L0 -27M5 -21L7 -26" stroke="'+stroke+'" stroke-width="1.6" stroke-linecap="round"/>':'';
 // Eyes and goggles are the sole facing signal in this mode: NO arrow.
 const eyeDirection=angle===null?0:angle;
 const face='<g class="cartoon-player-eyes" transform="rotate('+safeAngle(eyeDirection)+')">'+eyes+mouth+hair+'</g>';
 return '<g class="cartoon-player minion-mode-player" pointer-events="none">'+arms+legs+body+face+'</g>';
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
