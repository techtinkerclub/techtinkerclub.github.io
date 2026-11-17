// Navigation is independent of object selection. Never resurrect a missing marker or modify data.
import {validPhase,nextPhase} from './breakdown.js?v=0.12.30';
export function breakdownContext(frames,index,selected=null,preferred=null){
 const markers=(i)=>frames[i]?.objects.filter(o=>validPhase(o.breakdown?.phase))||[];
 const current=markers(index);
 const marker=current.find(o=>o.id===selected)||current.find(o=>o.id===preferred)||current.find(o=>nextPhase(o.breakdown.phase))||current[0]||null;
 if(marker){const next=nextPhase(marker.breakdown.phase);let existing=-1;
  if(next)for(let i=index+1;i<frames.length;i++){const m=markers(i).find(o=>o.id===marker.id);if(!m)break;if(m.breakdown.phase===next){existing=i;break}if(m.breakdown.phase!==marker.breakdown.phase)break}
  return {marker,current,existing,resume:null};
 }
 // If absent, offer a deliberate return to the nearest earlier unfinished phase.
 for(let i=index-1;i>=0;i--){const unfinished=markers(i).filter(o=>nextPhase(o.breakdown.phase));const earlier=unfinished.find(o=>o.id===preferred)||unfinished[0];if(earlier)return {marker:null,current:[],existing:-1,resume:{index:i,id:earlier.id,label:earlier.label||earlier.breakdown.phase}};if(markers(i).length)break}
 return {marker:null,current:[],existing:-1,resume:null};
}
