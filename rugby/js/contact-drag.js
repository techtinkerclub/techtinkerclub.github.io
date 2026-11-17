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
export function contactHandlePoint(frame,marker,g){
 const center=g.toView(marker.x,marker.y);
 const edges={left:g.margin+21,right:g.margin+g.fw-21,top:g.margin+21,bottom:g.margin+g.fh-21};
 const offsets=[[104,-83],[-104,-83],[104,83],[-104,83],[0,-115],[115,0],[-115,0],[0,115],[150,-109],[-150,-109],[150,109],[-150,109]];
 let best=null,score=-Infinity;
 for(let i=0;i<offsets.length;i++){
  const [dx,dy]=offsets[i],x=center.x+dx,y=center.y+dy;
  if(x<edges.left||x>edges.right||y<edges.top||y>edges.bottom)continue;
  const clearance=Math.min(200,...frame.objects.filter(o=>o.id!==marker.id).map(o=>{
   const v=g.toView(o.x,o.y);
   const extent=o.type==='sausage'?64:o.type==='bag'?45:o.type==='donut'?44:o.type==='shieldItem'?35:29;
   return Math.hypot(v.x-x,v.y-y)-extent;
  }));
  if(clearance-i*.75>score){score=clearance-i*.75;best={x,y}}
 }
 return best||{x:Math.max(edges.left,Math.min(edges.right,center.x+85)),y:Math.max(edges.top,Math.min(edges.bottom,center.y-85))};
}
