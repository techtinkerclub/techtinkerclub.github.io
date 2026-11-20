import {bubbleSVG} from './comic-callouts.js?v=1';
// Display a coach-authored contest result without pretending that the ball
// lying separately for a safety exercise has come out of the ruck.
export const ruckSide=o=>['attacker','shield'].includes(o?.type)?'attack':['defender','bagplayer'].includes(o?.type)?'defence':null;
export const contestWinner=m=>['contest','secured'].includes(m?.breakdown?.phase)&&['attack','defence'].includes(m?.breakdown?.winner)?m.breakdown.winner:null;

// Undo a generated ruck result without destroying the coach-authored
// push-pull route. Return the losing participant and their attached shield to
// the normal formation-relative destination, and restore the earlier pose.
// The separate pad, ball and waiting players are never touched.
export function clearContestOutcome(frame,previous,marker){
 const winner=contestWinner(marker);
 if(!winner||marker.breakdown.phase!=='contest')return {ok:false,message:'There is no generated contest result to clear.'};
 const oldMarker=previous?.objects?.find(o=>o.id===marker.id);
 if(!oldMarker)return {ok:false,message:'The preceding ruck step is missing.'};
 const find=(f,id)=>f?.objects.find(o=>o.id===id);
 const dx=marker.x-oldMarker.x,dy=marker.y-oldMarker.y;
 let restored=0;
 for(const member of marker.members||[]){
  const player=find(frame,member.id),before=find(previous,member.id);
  if(!player||!before||ruckSide(player)===winner)continue;
  player.x=before.x+dx;player.y=before.y+dy;
  const prior=oldMarker.members?.find(m=>m.id===member.id);
  member.pose=prior?.pose||'bound';
  for(const item of frame.objects.filter(o=>o.type==='shieldItem'&&o.ownerId===member.id)){
   const previousItem=find(previous,item.id);
   if(previousItem){item.x=previousItem.x+dx;item.y=previousItem.y+dy;item.rot=previousItem.rot}
  }
  restored++;
 }
 delete marker.breakdown.winner;
 delete marker.breakdown.clearanceCm;
 delete marker.breakdown.showWinnerLabel;
 delete marker.breakdown.showNextPlayerLabel;
 delete marker.breakdown.nextPlayerId;
 return {ok:true,message:'Contest result cleared; '+restored+' losing player'+(restored===1?'':'s')+' returned to the formation. Your push–pull path is preserved.'};
}


export function outcomeMemberDisplacement(old,next,marker,id,p,g){
 const winner=contestWinner(marker);
 if(!winner||marker.breakdown?.phase!=='contest'||!marker.members?.some(m=>m.id===id))return null;
 const a=old?.objects?.find(o=>o.id===id),b=next?.objects?.find(o=>o.id===id);
 const from=old?.objects?.find(o=>o.id===marker.id);
 if(!a||!b||!from)return null;
 const oldMember=g.toView(a.x,a.y),newMember=g.toView(b.x,b.y);
 const oldMarker=g.toView(from.x,from.y),newMarker=g.toView(marker.x,marker.y);
 const leftover={x:(newMember.x-oldMember.x)-(newMarker.x-oldMarker.x),y:(newMember.y-oldMember.y)-(newMarker.y-oldMarker.y)};
 const u=Math.max(0,Math.min(1,(p-.76)/.24)),smooth=u*u*(3-2*u);
 return {x:leftover.x*smooth,y:leftover.y*smooth};
}

// A coaching annotation is explicitly authored, never inferred from distance.
// The actual ball transfer is a separate, deliberate edit in a following step.
export function nextPlayCue(frame,objects,marker,g,ink=false,cartoonMode=false){
 if(!marker?.breakdown?.showNextPlayerLabel||!marker.breakdown.nextPlayerId)return '';
 const winner=contestWinner(marker),id=marker.breakdown.nextPlayerId;
 const player=objects.find(o=>o.id===id);
 if(!winner||!player||ruckSide(player)!==winner||(marker.members||[]).some(m=>m.id===id))return '';
 const safe=String(player.label||'PLAYER').replace(/[^a-zA-Z0-9 _-]/g,'').trim().slice(0,16)||'PLAYER';
 const p=g.toView(player.x,player.y),accent=ink?'#2d6136':winner==='attack'?'#b9ed83':'#ffbf7c';
 const text=safe+' NEXT',width=Math.max(92,Math.min(165,66+safe.length*8));
 const x=Math.max(g.margin+7,Math.min(g.margin+g.fw-width-7,p.x+31));
 const y=Math.max(g.margin+7,Math.min(g.margin+g.fh-25,p.y+21));
 if(cartoonMode&&!ink)return '<g data-next-play-cue="'+winner+'" pointer-events="none">'+bubbleSVG({x:p.x,y:p.y,text,kind:'speech',g,comic:true,accent})+'</g>';
 return '<g data-next-play-cue="'+winner+'" pointer-events="none">'+
  '<circle cx="'+p.x+'" cy="'+p.y+'" r="22" stroke="'+accent+'" stroke-width="2.3" fill="none" stroke-dasharray="4 4"/>'+
  '<path d="M'+(p.x+13)+' '+(p.y+12)+'L'+(x+8)+' '+(y+12)+'" stroke="'+accent+'" stroke-dasharray="3 3" stroke-width="1.5"/>'+
  '<rect x="'+x+'" y="'+y+'" width="'+width+'" height="23" rx="8" fill="'+(ink?'#fff':'#183528')+'" stroke="'+accent+'" stroke-width="1.8"/>'+
  '<text x="'+(x+width/2)+'" y="'+(y+15.5)+'" text-anchor="middle" font-weight="700" font-size="11.5" fill="'+(ink?'#183528':accent)+'">'+text+'</text></g>';
}
export function contestResultOverlay(frame,objects,g,progress=1,ink=false,cartoonMode=false){
 const markers=(frame?.objects||[]).filter(o=>o.type==='ruck'&&contestWinner(o));
 if(!markers.length)return '';
 const safe=(x,a,b)=>Math.max(a,Math.min(b,x));
 return markers.map(marker=>{
  if(marker.breakdown.phase==='contest'&&progress<.9)return '';
  const winner=contestWinner(marker);
  let svg='';
  // Explicit per-step opt-in, including for older drills whose winner was saved.
  if(marker.breakdown.showWinnerLabel===true){
   const found=(marker.members||[]).map(m=>objects.find(o=>o.id===m.id))
    .find(o=>ruckSide(o)===winner);
   if(found){
    const p=g.toView(found.x,found.y),line=winner==='attack'?'ATTACK SECURES':'DEFENCE SECURES';
    const bw=148,bh=23;
    const badgeX=safe(p.x+40,g.margin+7,g.margin+g.fw-bw-7);
    const badgeY=safe(p.y-50,g.margin+7,g.margin+g.fh-bh-7);
    const accent=ink?'#2d6136':winner==='attack'?'#b9ed83':'#ffbf7c';
    if(cartoonMode&&!ink)svg='<g data-contest-result="'+winner+'" pointer-events="none">'+bubbleSVG({x:p.x,y:p.y,text:line,kind:'shout',g,comic:true,accent})+'</g>';
    else svg='<g data-contest-result="'+winner+'" pointer-events="none">'+
     '<circle cx="'+p.x+'" cy="'+p.y+'" r="26" stroke="'+accent+'" stroke-width="3" fill="none" stroke-dasharray="4 3"/>'+
     '<path d="M'+(p.x+16)+' '+(p.y-17)+'L'+(badgeX+6)+' '+(badgeY+bh/2)+'" stroke="'+accent+'" stroke-width="2" stroke-dasharray="3 3" fill="none"/>'+
     '<rect x="'+badgeX+'" y="'+badgeY+'" width="'+bw+'" height="'+bh+'" rx="9" fill="'+(ink?'#fff':'#172c22')+'" stroke="'+accent+'" stroke-width="2"/>'+
     '<text x="'+(badgeX+bw/2)+'" y="'+(badgeY+15.5)+'" fill="'+(ink?'#172c22':accent)+'" font-size="12" font-weight="750" text-anchor="middle">'+line+'</text></g>';
   }
  }
  return svg+nextPlayCue(frame,objects,marker,g,ink,cartoonMode);
 }).join('');
}
