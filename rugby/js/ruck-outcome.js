// Display a coach-authored contest result without pretending that the ball
// lying separately for a safety exercise has come out of the ruck.
export const ruckSide=o=>['attacker','shield'].includes(o?.type)?'attack':['defender','bagplayer'].includes(o?.type)?'defence':null;
export const contestWinner=m=>['contest','secured'].includes(m?.breakdown?.phase)&&['attack','defence'].includes(m?.breakdown?.winner)?m.breakdown.winner:null;

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
export function contestResultOverlay(frame,objects,g,progress=1,ink=false){
 const markers=(frame?.objects||[]).filter(o=>o.type==='ruck'&&contestWinner(o));
 if(!markers.length)return '';
 const safe=(x,a,b)=>Math.max(a,Math.min(b,x));
 return markers.map(marker=>{
  if(marker.breakdown.phase==='contest'&&progress<.82)return '';
  const winner=contestWinner(marker);
  const found=(marker.members||[]).map(m=>objects.find(o=>o.id===m.id))
   .find(o=>ruckSide(o)===winner);
  if(!found)return '';
  const p=g.toView(found.x,found.y),line=winner==='attack'?'ATTACK SECURES':'DEFENCE SECURES';
  const bw=148,bh=23;
  const badgeX=safe(p.x+40,g.margin+7,g.margin+g.fw-bw-7);
  const badgeY=safe(p.y-50,g.margin+7,g.margin+g.fh-bh-7);
  const accent=ink?'#2d6136':winner==='attack'?'#b9ed83':'#ffbf7c';
  return '<g data-contest-result="'+winner+'" pointer-events="none">'+
   '<circle cx="'+p.x+'" cy="'+p.y+'" r="26" stroke="'+accent+'" stroke-width="3" fill="none" stroke-dasharray="4 3"/>'+
   '<path d="M'+(p.x+16)+' '+(p.y-17)+'L'+(badgeX+6)+' '+(badgeY+bh/2)+'" stroke="'+accent+'" stroke-width="2" stroke-dasharray="3 3" fill="none"/>'+
   '<rect x="'+badgeX+'" y="'+badgeY+'" width="'+bw+'" height="'+bh+'" rx="9" fill="'+(ink?'#fff':'#172c22')+'" stroke="'+accent+'" stroke-width="2"/>'+
   '<text x="'+(badgeX+bw/2)+'" y="'+(badgeY+15.5)+'" fill="'+(ink?'#172c22':accent)+'" font-size="12" font-weight="750" text-anchor="middle">'+line+'</text>'+
   '</g>';
 }).join('');
}
