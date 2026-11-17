// Flexible contact-pad practice: the grounded equipment is a reference
// position, not an automatically tackled ball carrier.
export function isGroundPad(o){
 return !!o&&(o.type==='sausage'||o.type==='donut'&&o.donutState==='down');
}
export function padTitle(o){return o?.type==='donut'?'donut lying flat':'sausage bag'}
const attack=new Set(['attacker','shield']),defence=new Set(['defender','bagplayer']);
const side=o=>attack.has(o?.type)?'attack':defence.has(o?.type)?'defence':null;
export function linkRuckPlayersInPlace(frame,marker,ids,u10=false){
 if(!frame?.objects||marker?.type!=='ruck'||marker.breakdown?.mode!=='pad')return {ok:false,message:'Select a pad-based ruck marker first.'};
 const pad=frame.objects.find(o=>o.id===marker.breakdown.padId);
 if(!isGroundPad(pad))return {ok:false,message:'The linked sausage or grounded donut is missing. Set the donut to Down first.'};
 const all=[...new Set(ids||[])].map(id=>frame.objects.find(o=>o.id===id)).filter(Boolean);
 const members=all.filter(o=>side(o)),a=members.filter(o=>side(o)==='attack'),d=members.filter(o=>side(o)==='defence');
 if(all.length!==members.length)return {ok:false,message:'Choose attacking and defending players, not coaches or equipment.'};
 if(!members.length)return {ok:false,message:'Choose at least one player to link to this ruck.'};
 if(u10&&(a.length>1||d.length>1))return {ok:false,message:'U10: select no more than one arriving player from each team.'};
 if(members.length>16)return {ok:false,message:'Too many players in this contact formation.'};
 const contested=!!a.length&&!!d.length,oldPhase=marker.breakdown.phase;
 const phase=contested?['contest','secured'].includes(oldPhase)?oldPhase:'ruck':'support';
 const first=contested?marker.breakdown.arrivalSide||'attack':a.length?'attack':'defence';
 // Only mutate the formation after all input has been checked.
 const chosen=new Set(members.map(o=>o.id));
 for(const other of frame.objects){
  if(other===marker||!Array.isArray(other.members))continue;
  other.members=other.members.filter(m=>!chosen.has(m.id));
 }
 marker.members=members.map(o=>({id:o.id,pose:contested?'bound':'standing'}));
 marker.breakdown={...marker.breakdown,phase,arrivalSide:first};
 marker.label=contested?'Ruck formed · pad drill':(first==='defence'?'Defender arrives · pad drill':'Attacker arrives · pad drill');
 return {ok:true,message:(contested?'Linked both sides':'Linked first arriving player')+' without changing their positions.',count:members.length};
}
// Move one included player by a small, measured distance in pitch coordinates.
// Retain ruck membership, facing and every other object, including the pad.
export function nudgeRuckPlayer(frame,marker,id,g,dx,dy,metres=.15){
 if(marker?.breakdown?.mode!=='pad'||!marker.members?.some(m=>m.id===id))return false;
 const player=frame.objects.find(o=>o.id===id);
 if(!side(player)||!Number.isFinite(g?.scale))return false;
 const q=g.toView(player.x,player.y),margin=g.margin,step=g.scale*metres;
 const x=Math.min(margin+g.fw-5,Math.max(margin+5,q.x+step*dx));
 const y=Math.min(margin+g.fh-5,Math.max(margin+5,q.y+step*dy));
 if(Math.abs(x-q.x)+Math.abs(y-q.y)<1e-7)return false;
 const p=g.fromView(x,y);
 player.x=p.x;player.y=p.y;
 return true;
}

// An intentional preset only: this is NOT called by Next stage. Never use
// the rugby ball as the centre of a contact-pad training exercise.
export function placeRuckPlayersAtPad(frame,marker,ids,g,u10=false){
 const checked=linkRuckPlayersInPlace(frame,marker,ids,u10);
 if(!checked.ok)return checked;
 const pad=frame.objects.find(o=>o.id===marker.breakdown.padId);
 const center=g.toView(pad.x,pad.y),scale=Number.isFinite(g.scale)?g.scale*.45/30:1;
 const a=(Number(marker.rot||0)+Number(g.rotation||0))*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 for(const member of marker.members){
  const player=frame.objects.find(o=>o.id===member.id),who=side(player);
  if(!player||!who)continue;
  // Player icons partially overlap the grounded pad (as viewed from above).
  const forward=who==='attack'?1:-1,offset=20*scale;
  const px=center.x-forward*offset*s,py=center.y+forward*offset*c;
  const x=Math.max(g.margin+8,Math.min(g.margin+g.fw-8,px));
  const y=Math.max(g.margin+8,Math.min(g.margin+g.fh-8,py));
  Object.assign(player,g.fromView(x,y),{rot:((Number(marker.rot||0)+(who==='attack'?0:180))%360+360)%360});
 }
 return {ok:true,message:'Players positioned around the '+padTitle(pad)+'. Ball and other equipment left alone.',count:checked.count};
}
