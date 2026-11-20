import {compactActionBubbleSVG} from './comic-callouts.js?v=6';
import {stepStartSeconds} from './step-timeline.js?v=1';
// Coach-authored start signals: independent from player objects and law/decision markers.
// The whistle lives on the action step it starts and can be carried through
// editor preview, read-only playback, video visuals, shared JSON and printed notes.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const DEFAULT_WHISTLE_DURATION=0.5; // seconds of VISUAL cue, not animation-step duration
export function normalWhistleDuration(value){
 const number=Number(value);
 return Number.isFinite(number)&&number>=0.1
  ?Math.round(clamp(number,0.1,3)*10)/10
  :DEFAULT_WHISTLE_DURATION;
}
// Removing an existing cue must never depend on the editor's selected step,
// the first-step setup, or whether a player has been moved since adding it.
export function removeWhistle(drill,coachId){
 if(!Array.isArray(drill?.frames))return 0;
 let removed=0;
 drill.frames.forEach((frame,index)=>{
  if(frame.signal?.kind!=='whistle'||frame.signal.coachId!==coachId)return;
  delete frame.signal;removed++;
  if(frame.name==='GO · coach whistle')frame.name='Step '+(index+1);
  if(frame.notes==='The coach blows the whistle. Players start the action.')frame.notes='';
 });
 return removed;
}
export function signalForFrame(frame){
 const s=frame?.signal;
 return s?.kind==='whistle'&&typeof s.coachId==='string'&&frame.objects?.some(o=>o.id===s.coachId&&o.type==='coach')
  ?{kind:'whistle',coachId:s.coachId,label:'GO',duration:normalWhistleDuration(s.duration)}:null;
}
export function whistleAt(drill,frameIndex){
 if(!drill||!Number.isInteger(frameIndex)||frameIndex<0||frameIndex>=drill.frames.length)return null;
 const s=signalForFrame(drill.frames[frameIndex]);
 if(!s)return null;
 const at=stepStartSeconds(drill,frameIndex);
 return {at,...s,step:frameIndex};
}
export function whistleEvents(drill){
 return (drill?.frames||[]).map((f,i)=>whistleAt(drill,i)).filter(Boolean);
}
export function crossedWhistles(drill,from,to,{includeStart=false}={}){
 return whistleEvents(drill).filter(e=>e.at<=to+1e-5&&(e.at>from+1e-5||(includeStart&&Math.abs(e.at-from)<1e-5)));
}
export function whistleOverlay(frame,g,elapsed=0,{ink=false,staticView=false,cartoonMode=false}={}){
 const signal=signalForFrame(frame);
 if(!signal||(!staticView&&elapsed>=signal.duration))return '';
 const actor=frame.objects.find(o=>o.id===signal.coachId);
 if(!actor)return '';
 const p=g.toView(actor.x,actor.y),x=clamp(p.x+25,g.margin+10,g.margin+g.fw-124),y=clamp(p.y-57,g.margin+9,g.margin+g.fh-41);
 const view=g.annotationViewport,scale=view?g.annotationScale||1:1;
 if(view&&(p.x<view.x-8||p.x>view.x+view.width+8||p.y<view.y-8||p.y>view.y+view.height+8))return '';
 const accent=ink?'#254f3b':'#ffdf86',fill=ink?'#fff':'#1c3329';
 if(cartoonMode&&!ink)return '<g data-coach-signal="whistle" pointer-events="none">'+compactActionBubbleSVG({x:p.x,y:p.y,text:'WHISTLE · GO',kind:'shout',g,comic:true,accent})+'</g>';
 const prefix=view&&scale<.999?'<g transform="translate('+p.x+' '+p.y+') scale('+scale+') translate('+(-p.x)+' '+(-p.y)+')">':'';
 return prefix+'<g data-coach-signal="whistle" pointer-events="none">'+
 '<path d="M'+p.x+' '+p.y+'L'+(x+12)+' '+(y+20)+'" stroke="'+accent+'" stroke-width="2" stroke-dasharray="3 3"/>'+
 '<circle cx="'+p.x+'" cy="'+p.y+'" r="25" fill="none" stroke="'+accent+'" stroke-width="2.6" stroke-dasharray="5 5"/>'+
 '<rect x="'+x+'" y="'+y+'" width="118" height="33" rx="9" fill="'+fill+'" stroke="'+accent+'" stroke-width="2"/>'+
 '<text x="'+(x+59)+'" y="'+(y+21.5)+'" text-anchor="middle" fill="'+accent+'" font-family="Arial,sans-serif" font-size="13" font-weight="800">WHISTLE · GO</text></g>'+(prefix?'</g>':'');
}
let context=null;
export function playWhistle({enabled=true}={}){
 if(!enabled)return;
 try{
  const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
  context=context||new A();context.resume?.();
  const now=context.currentTime,master=context.createGain();
  master.gain.setValueAtTime(.0001,now);
  master.gain.exponentialRampToValueAtTime(.11,now+.022);
  master.gain.setValueAtTime(.11,now+.23);
  master.gain.exponentialRampToValueAtTime(.0001,now+.37);
  master.connect(context.destination);
  for(const [f,level] of [[1900,.8],[2250,.35]]){
   const oscillator=context.createOscillator(),gain=context.createGain();
   oscillator.type='sine';oscillator.frequency.setValueAtTime(f,now);
   oscillator.frequency.linearRampToValueAtTime(f*1.045,now+.22);
   gain.gain.value=level;
   oscillator.connect(gain);gain.connect(master);
   oscillator.start(now);oscillator.stop(now+.4);
   oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};
  }
  setTimeout(()=>master.disconnect(),600);
 }catch{} // Browser may prohibit audio until the user plays the drill.
}
