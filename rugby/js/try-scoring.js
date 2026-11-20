// Deterministic coaching-only try-line evaluator.
// Crossing in the permitted direction creates eligibility, NEVER a try.
// Only an authored grounding by the attacking ball-carrier can score.
import {diagramSettings} from './diagram-shapes.js?v=2';
const eligible=o=>o?.type==='attacker'; // Defending players cannot score on these designated lines.
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const number=n=>Number.isFinite(Number(n))?Number(n):0;
const markLine=(line,g)=>{
 const s=diagramSettings('tryLine',line.diagram,g.width||15);
 const r=number(line.rot)*Math.PI/180,ux=Math.cos(r),uy=Math.sin(r);
 const normal=s.scoringSide==='negative'?-1:1;
 return {id:line.id,x:number(line.x),y:number(line.y),ux,uy,nx:-uy*normal,ny:ux*normal,length:s.length*(g.scale||1)};
};
function signed(p,line){return (number(p.x)-line.x)*line.nx+(number(p.y)-line.y)*line.ny}
function crossing(a,b,line){
 const start=signed(a,line),end=signed(b,line);
 if(!(start<-.25&&end>=-.25))return null;
 const frac=-start/(end-start);
 if(!(frac>=0&&frac<=1))return null;
 const x=number(a.x)+(number(b.x)-number(a.x))*frac,y=number(a.y)+(number(b.y)-number(a.y))*frac;
 const along=Math.abs((x-line.x)*line.ux+(y-line.y)*line.uy);
 if(along>line.length/2+3)return null;
 return frac;
}
function route(a,b,frame,id){
 const entries=[a,...(frame.paths?.[id]?.points||[]),b].filter(p=>Number.isFinite(Number(p?.x))&&Number.isFinite(Number(p?.y)));
 return entries.length>1?entries:[a,b];
}
function carrier(frame,id){return(frame.objects||[]).some(o=>o.type==='ball'&&o.ownerId===id)}
export function tryLineEvents(drill,g){
 if(!Array.isArray(drill?.frames)||drill.frames.length<2||!g?.scale)return [];
 const result=[],pending=new Map(),seenGroundings=new Set();let startTime=Math.max(0,number(drill.frames[0]?.seconds));
 for(let i=1;i<drill.frames.length;i++){
  const before=drill.frames[i-1],frame=drill.frames[i],sec=Math.max(0,number(frame.seconds));
  const lines=(frame.objects||[]).filter(o=>o.type==='tryLine').map(o=>markLine(o,g));
  for(const line of lines){
   for(const actor of (frame.objects||[]).filter(eligible)){
    const prior=(before.objects||[]).find(o=>o.id===actor.id);
    if(!prior||!carrier(before,actor.id)||!carrier(frame,actor.id))continue;
    const segments=route(prior,actor,frame,actor.id);
    for(let n=1;n<segments.length;n++){
     const t=crossing(segments[n-1],segments[n],line);
     if(t===null)continue;
     const progress=(n-1+t)/(segments.length-1);
     pending.set(line.id+':'+actor.id,{lineId:line.id,actorId:actor.id,time:startTime+progress*sec});
     break;
    }
   }
  }
  for(const ground of frame.tryGroundings||[]){
   const at=clamp(number(ground.at),0,1),id=String(ground.actorId||'');
   const actor=frame.objects?.find(o=>o.id===id);
   if(!eligible(actor)||!carrier(frame,id))continue;
   for(const line of lines){
    const key=line.id+':'+id,prior=pending.get(key),stamp=startTime+at*sec;
    if(!prior||prior.time>stamp||seenGroundings.has(i+':'+id+':'+line.id))continue;
    const old=before.objects?.find(o=>o.id===id)||actor;
    const p={x:number(old.x)+(number(actor.x)-number(old.x))*at,y:number(old.y)+(number(actor.y)-number(old.y))*at};
    const within=Math.abs((p.x-line.x)*line.ux+(p.y-line.y)*line.uy)<=line.length/2+3;
    if(signed(p,line)<-.25||!within)continue;
    result.push({lineId:line.id,actorId:id,step:i,time:stamp,kind:'try'});
    seenGroundings.add(i+':'+id+':'+line.id);
    pending.delete(key); // one crossing gives at most one try
   }
  }
  startTime+=sec;
 }
 return result;
}
export const RUCKUS_TRY_CELEBRATION_SECONDS=2.8;
// A deliberate hold makes it clear that the ball has been grounded before
// the player stands and celebrates, especially during teaching playback.
export const TRY_GROUND_HOLD_SECONDS=.92;
export const TRY_RISE_END_SECONDS=1.3;
// Score animations are visual epilogues. They do not change authored step
// timing, Classic mode, ball transfers, score eligibility or saved drill data.
export function tryVisualDuration(drill,g,cartoonMode=false){
 const base=(drill?.frames||[]).reduce((sum,f)=>sum+Math.max(0,number(f.seconds)),0);
 if(!cartoonMode)return base;
 const tries=tryLineEvents(drill,g);
 return tries.length?Math.max(base,tries[tries.length-1].time+RUCKUS_TRY_CELEBRATION_SECONDS):base;
}
export function tryCelebrationAt(events,time,actorId){
 const eligible=(events||[]).filter(e=>e.actorId===actorId&&time>=e.time-1e-6&&time<e.time+RUCKUS_TRY_CELEBRATION_SECONDS);
 if(!eligible.length)return null;
 const elapsed=Math.max(0,time-eligible[eligible.length-1].time);
 if(elapsed<TRY_GROUND_HOLD_SECONDS)return {phase:'ground',elapsed};
 if(elapsed<TRY_RISE_END_SECONDS)return {phase:'rise',index:Math.min(4,Math.floor((elapsed-TRY_GROUND_HOLD_SECONDS)/(TRY_RISE_END_SECONDS-TRY_GROUND_HOLD_SECONDS)*5)),elapsed};
 // Atlas 52/53 contains the approved raised-arms celebratory poses.
 const beat=Math.min(4,Math.floor((elapsed-TRY_RISE_END_SECONDS)/(RUCKUS_TRY_CELEBRATION_SECONDS-TRY_RISE_END_SECONDS)*5));
 return {phase:'celebrate',index:beat,elapsed};
}
export function tryFeedbackSVG(events,time,g,{cartoonMode=false,ink=false}={}){
 if(!Array.isArray(events)||!events.length||!g)return '';
 const eligible=events.filter(e=>e.time<=time+1e-5);
 if(!eligible.length)return '';
 const recent=eligible[eligible.length-1];
 const label=recent&&time-recent.time<=2.5?'TRY!':'TRIES: '+eligible.length;
 const x=Math.max(66,(g.viewWidth||900)-85),y=22,w=145,h=37;
 const fill=ink?'#fff':cartoonMode?'#fff0aa':'#18482c',stroke=ink?'#222':'#172f24',colour=ink?'#222':cartoonMode?'#203623':'#f1fbdc';
 return '<g class="try-score-feedback" data-score="'+eligible.length+'" pointer-events="none">'+
  '<rect x="'+(x-w/2)+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(cartoonMode?12:7)+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+(cartoonMode?3:1.8)+'"/>'+
  '<text x="'+x+'" y="'+(y+25)+'" text-anchor="middle" font-weight="900" font-size="21" fill="'+colour+'">'+label+'</text></g>';
}
