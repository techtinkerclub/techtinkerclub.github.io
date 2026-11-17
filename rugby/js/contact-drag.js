// Contact formations are anchored on a marker. Reposition the arranged players
// and the ground ball together; never silently move unrelated training equipment.
export function contactDragIds(frame,marker){
 if(!marker||!Array.isArray(frame?.objects))return [];
 const present=new Map(frame.objects.map(o=>[o.id,o]));
 if(!present.has(marker.id))return [];
 const ids=[marker.id],related=new Set();
 for(const m of Array.isArray(marker.members)?marker.members:[]){
  const o=present.get(m.id);
  if(!o||!['attacker','defender','neutral','shield','bagplayer'].includes(o.type))continue;
  if(!related.has(o.id)){related.add(o.id);ids.push(o.id)}
 }
 if(!related.size)return ids;
 const ball=present.get(marker.breakdown?.ballId);
 if(ball?.type==='ball'&&!ids.includes(ball.id))ids.push(ball.id);
 for(const o of frame.objects){
  if((o.type==='ball'||o.type==='shieldItem')&&related.has(o.ownerId)&&!ids.includes(o.id))ids.push(o.id);
 }
 return ids;
}
// Place a selected contact marker's drag grip outside the overlap of players,
// balls and pads. The point is in pitch SVG coordinates.
// A compact proxy with a FIXED screen direction relative to its contact
// marker. Never choose a different side because other equipment has moved:
// that made the grip apparently rotate/jump during a drag.
export function contactHandlePoint(_frame,marker,g){
 const center=g.toView(marker.x,marker.y),margin=g.margin||0;
 const x=Math.max(margin+49,Math.min(margin+g.fw-49,center.x-62));
 const y=Math.max(margin+50,Math.min(margin+g.fh-30,center.y-44));
 return {x,y};
}
