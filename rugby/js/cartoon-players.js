// Ball-free, genuine overhead cartoon players based on the user's 20-pose reference sheets.
// All poses are drawn from the same 90-degree camera, with the goggles at the leading edge.
// Only the visual skin changes. Positions, timing, contact mechanics and ball ownership remain
// exclusively controlled by the underlying Rugby Coaching Studio model.
import {canCarry} from './possession.js?v=0.19.1';
import {playerHeadAngle} from './player-gaze.js?v=3';

const arrowRE=/<path d="M-5 -12 L0 -19 L5 -12 Z" fill="#f7fff6"\s*\/>|<path d="M-5 -8L0 -16L5 -8Z" fill="#fff"\s*\/>|<path d="M-5 -12L0 -19L5 -12Z" fill="#fff"\s*\/>|<path d="M-4 -15L0 -21L4 -15Z" fill="#fff"\s*\/>|<path d="M-5 -7L0 -14L5 -7Z" fill="#fff"\s*\/>/g;
const safeAngle=n=>Number.isFinite(n)?n.toFixed(1):'0';
const hash=str=>{let h=0;for(const c of String(str||''))h=((h*33)^c.charCodeAt(0))>>>0;return h};
const n=x=>(Math.round(x*10)/10).toString();
const STANCES={
 standing:{w:16.6,h:19,hy:-3.8,hw:15.7,hh:15.3,legs:[[-8,17],[8,17]],arms:[[-13,1,-23,6],[13,1,23,6]]},
 ready:{w:18.4,h:16.5,hy:-3,hw:17,hh:14.7,legs:[[-15,14],[15,14]],arms:[[-14,-4,-24,-13],[14,-4,24,-13]]},
 tackling:{w:13.5,h:21,hy:-8,hw:12.9,hh:13.4,legs:[[-8,18],[8,18]],arms:[[-10,-7,-18,-21],[10,-7,18,-21]]},
 held:{w:15.5,h:20,hy:-4.5,hw:14.6,hh:15,legs:[[-10,18],[10,18]],arms:[[-13,-6,-22,-15],[13,-6,22,-15]]},
 grounded:{w:13.3,h:26,hy:-13,hw:12.6,hh:12,legs:[[-8,25],[8,25]],arms:[[-12,-4,-24,-3],[12,-4,24,-3]]},
 kneeling:{w:18,h:15.5,hy:-4,hw:16.7,hh:14.2,legs:[[-16,14],[16,14]],arms:[[-14,3,-24,14],[14,3,24,14]]},
 recovering:{w:15.2,h:18.6,hy:-6.5,hw:14.1,hh:14,legs:[[-15,16],[9,19]],arms:[[-13,1,-25,17],[13,-3,24,-8]]},
 crouched:{w:19,h:15,hy:-3,hw:17.6,hh:13.6,legs:[[-16,13],[16,13]],arms:[[-14,-5,-24,-15],[14,-5,24,-15]]},
 bound:{w:17,h:18,hy:-6,hw:15.6,hh:14.5,legs:[[-14,16],[14,16]],arms:[[-13,-7,-19,-21],[13,-7,19,-21]]}
};
const colorFor=(o,ink)=>ink?'#9a9c97':o.type==='defender'?'#e5784d':o.type==='coach'?'#77a85d':o.type==='neutral'?'#a68bd0':'#286cb8';
const line=(x1,y1,x2,y2,stroke,w)=>'<path d="M'+n(x1)+' '+n(y1)+'Q'+n((x1+x2)/2)+' '+n(y2)+' '+n(x2)+' '+n(y2)+'" fill="none" stroke="'+stroke+'" stroke-width="'+n(w)+'" stroke-linecap="round"/>';
const boot=(x,y,ground,ink)=>{
 const rot=x<0?-13:13,fill=ink?'#414141':'#252b30';
 return '<g transform="translate('+n(x)+' '+n(y)+') rotate('+rot+')"><rect x="-4.3" y="-4" width="8.6" height="'+(ground?12:9)+'" rx="3.5" fill="'+fill+'" stroke="'+(ink?'#333':'#15252a')+'" stroke-width="1.2"/><path d="M-3 0H3" stroke="#81878b" stroke-width=".9" opacity=".55"/></g>';
};
const mitt=(x,y,ink,turn=0)=>'<g transform="translate('+n(x)+' '+n(y)+') rotate('+n(turn)+')"><ellipse rx="4.8" ry="4.4" fill="'+(ink?'#343434':'#262c31')+'" stroke="'+(ink?'#222':'#17242a')+'" stroke-width="1"/><path d="M-3.5 -2Q0 -4 3 -1" stroke="#7d838a" stroke-width=".9" fill="none" opacity=".7"/></g>';

function overheadMinion(o,pose,objects,g,previous,frame,progress,ink){
 const stance=STANCES[pose]||STANCES.standing;
 const seed=hash(o.id),oneEye=seed%4===0,hairStyle=seed%3;
 const outline=ink?'#303030':'#172732',yellow=ink?'#e4e1bf':'#ffe05d',shade=ink?'#d0cbaa':'#f4c749';
 const suit=colorFor(o,ink),s=stance,w=s.w,h=s.h;
 const last=previous?.objects?.find(p=>p.id===o.id),next=frame?.objects?.find(p=>p.id===o.id);
 const moving=pose==='standing'&&last&&next&&Math.hypot(last.x-next.x,last.y-next.y)>.2;
 const swing=moving?Math.sin((Number(progress)||0)*Math.PI*8)*5:0;
 const arms=s.arms.map(([x1,y1,x2,y2],i)=>[x1,y1,x2,y2+(i===0?swing:-swing)]);
 const boots=s.legs.map(([x,y],i)=>boot(x,y+(moving?(i===0?-swing*.6:swing*.6):0),pose==='grounded',ink)).join('');
 const armShapes=arms.map(([x1,y1,x2,y2])=>line(x1,y1,x2,y2,outline,8)+line(x1,y1,x2,y2,yellow,5.8)).join('');
 const gloves=arms.map(([, ,x,y],i)=>mitt(x,y,ink,i===0?-20:20)).join('');
 // Head and overalls are seen from above; no front-facing mouth or vertical torso.
 const body='<ellipse rx="'+n(w)+'" ry="'+n(h)+'" fill="'+yellow+'" stroke="'+outline+'" stroke-width="2.3"/>';
 const bandY=pose==='grounded'?2:h*.32;
 const bottomY=h*.89;
 const overalls='<path d="M'+n(-w*.89)+' '+n(bandY)+' Q0 '+n(bandY+4)+' '+n(w*.89)+' '+n(bandY)+' L'+n(w*.76)+' '+n(bottomY)+' Q0 '+n(h+.4)+' '+n(-w*.76)+' '+n(bottomY)+'Z" fill="'+suit+'" stroke="'+outline+'" stroke-width="1.5"/>'+
  '<path d="M'+n(-w*.83)+' '+n(bandY-2)+' L'+n(-w*.66)+' '+n(bottomY-1)+' M'+n(w*.83)+' '+n(bandY-2)+' L'+n(w*.66)+' '+n(bottomY-1)+'" stroke="'+suit+'" stroke-width="4.2" fill="none"/>'+
  '<path d="M'+n(-w*.6)+' '+n(bottomY-2)+' Q0 '+n(bottomY+1)+' '+n(w*.6)+' '+n(bottomY-2)+'" stroke="#173c61" stroke-width="1" opacity=".6" fill="none"/>'+
  '<path d="M-5 '+n(h*.7)+'L0 '+n(h*.57)+'L5 '+n(h*.7)+'L0 '+n(h*.83)+'Z" fill="#e8f2fb" stroke="#203c5b" stroke-width=".7"/>';
 const crown='<ellipse cx="0" cy="'+n(s.hy)+'" rx="'+n(s.hw)+'" ry="'+n(s.hh)+'" fill="'+yellow+'" stroke="'+outline+'" stroke-width="1.8"/>'+
  '<path d="M'+n(-s.hw*.58)+' '+n(s.hy-s.hh*.27)+'Q'+n(-s.hw*.29)+' '+n(s.hy-s.hh*.6)+' '+n(-s.hw*.02)+' '+n(s.hy-s.hh*.35)+'" fill="none" stroke="#fff2a1" stroke-width="2" stroke-linecap="round" opacity=".8"/>'+
  '<path d="M'+n(-s.hw*.79)+' '+n(s.hy+s.hh*.43)+'Q0 '+n(s.hy+s.hh*.66)+' '+n(s.hw*.79)+' '+n(s.hy+s.hh*.43)+'" fill="none" stroke="'+shade+'" stroke-width="1" opacity=".7"/>';
 const yFront=-s.hh*.70, lens=(x,r)=>'<g transform="translate('+n(x)+' '+n(yFront)+')"><ellipse rx="'+n(r)+'" ry="4.2" fill="#a8b2ba" stroke="'+outline+'" stroke-width="1.4"/>'+
  '<ellipse cy=".7" rx="'+n(r-1.6)+'" ry="2.45" fill="#f9fbf9"/><ellipse cy="-.4" rx="1.45" ry="1.4" fill="#71523a"/><circle cx=".45" cy="-1" r=".6" fill="#fff"/></g>';
 const goggles='<path d="M'+n(-s.hw*.82)+' '+n(yFront+1)+'Q0 '+n(yFront-4)+' '+n(s.hw*.82)+' '+n(yFront+1)+'" fill="none" stroke="'+outline+'" stroke-width="3"/>'+
  (oneEye?lens(0,6.9):lens(-5.3,5.1)+lens(5.3,5.1));
 const gazeAngle=playerHeadAngle(o,objects,g,previous,frame,progress);
 const gaze='<g class="cartoon-player-goggles" transform="translate(0 '+n(s.hy)+') rotate('+safeAngle(gazeAngle===null?0:gazeAngle)+')">'+goggles+'</g>';
 const hair=hairStyle===0?'<path d="M-3 -3l-2 -3M0 -4v-4M3 -3l2 -3" stroke="'+outline+'" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
  :hairStyle===1?'<path d="M-3 -3Q2 -9 5 -2" stroke="'+outline+'" stroke-width="1.4" fill="none" stroke-linecap="round"/>':'';
 return '<g class="cartoon-player minion-mode-player minion-top-down" data-pose="'+(STANCES[pose]?pose:'standing')+'" pointer-events="none">'+
  '<ellipse cy="3.5" rx="'+n(w+3)+'" ry="'+n(h+3)+'" fill="#000" opacity="'+(ink?'.04':'.12')+'"/>'+
  boots+armShapes+body+overalls+crown+hair+gaze+gloves+'</g>';
}

/** The regular player remains untouched except for its single correct gaze arrow. */
export function playerAppearance(o,pose,original,objects,g,previous,frame,progress=1,{cartoonMode=false,ink=false}={}){
 if(!canCarry(o))return original;
 if(cartoonMode)return overheadMinion(o,pose,objects,g,previous,frame,progress,ink);
 const plain=original.replace(arrowRE,'');
 if(['grounded','kneeling'].includes(pose))return plain;
 const angle=playerHeadAngle(o,objects,g,previous,frame,progress);
 if(angle===null)return plain;
 const outline=ink?'#333':'#173526';
 return plain+'<g class="player-gaze-arrow" pointer-events="none" transform="rotate('+safeAngle(angle)+')">'+
  '<path d="M0 -21L-6 -11L6 -11Z" fill="#fffefa" stroke="'+outline+'" stroke-width="1.5" stroke-linejoin="round"/></g>';
}
export function cartoonPitchDecor(g){
 const w=Number(g.viewWidth||900),h=Number(g.viewHeight||540),positions=[[30,30],[w-30,30],[30,h-30],[w-30,h-30]];
 return '<g class="cartoon-pitch-decor" pointer-events="none">'+
 positions.map(([x,y],i)=>'<g transform="translate('+x+' '+y+')">'+
 '<circle r="9" fill="#ffe97e" opacity=".8"/>'+
 Array.from({length:5},(_,k)=>'<circle cx="'+n(Math.cos(k*Math.PI*2/5)*12)+'" cy="'+n(Math.sin(k*Math.PI*2/5)*12)+'" r="6" fill="'+(i%2?'#f7b0d1':'#f9f3c5')+'" opacity=".7"/>').join('')+
 '<circle r="5" fill="#f4b743"/></g>').join('')+'</g>';
}
