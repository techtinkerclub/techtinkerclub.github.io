import {symbolFactors} from './symbol-scale.js?v=0.12.23';
// Shared approximate offside guide, using diagram icon footprints rather than actual feet.
const team=o=>['attacker','shield'].includes(o?.type)?1:['defender','bagplayer'].includes(o?.type)?-1:0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function attackVector(d,g,mode='auto'){
 if(mode==='none'||mode==='auto'&&d.showAttack===false)return null;
 const angle=(({up:0,right:90,down:180,left:270}[d.attackDirection]??0)+g.rotation)*Math.PI/180;
 return {x:Math.sin(angle),y:-Math.cos(angle)};
}
const dot=(p,v)=>p.x*v.x+p.y*v.y;
const projected=(o,g,v)=>dot(g.toView(o.x,o.y),v);
const onFeet=p=>!['grounded','kneeling','recovering','tackling'].includes(p);
function extent(o,pose,g,v){
 // Icon footprints, NOT a measured anatomical back foot. Keep the guide deliberately approximate.
 const a=((o.rot||0)+g.rotation)*Math.PI/180,h={x:Math.sin(a),y:-Math.cos(a)},along=pose==='grounded'?23:pose==='bound'||pose==='crouched'?12:14,across=pose==='bound'||pose==='crouched'?20:12;
 const [sx,sy]=symbolFactors(o,{...g,displayMode:'realistic'},pose);return Math.hypot(along*sy*dot(h,v),across*sx*dot({x:h.y,y:-h.x},v));
}
export function offsideBands(objects,d,g,mode='auto'){
 const v=attackVector(d,g,mode);if(!v)return [];
 const out=[],map=new Map(objects.map(o=>[o.id,o]));
 for(const m of objects){
  const ruck=m.type==='ruck'&&m.members?.length,support=m.type==='tackle'&&m.breakdown?.phase==='support'&&m.members?.length;
  if(!ruck&&!support)continue;
  const b=m.breakdown?.ballId?map.get(m.breakdown.ballId):objects.filter(o=>o.type==='ball'&&!o.ownerId&&dist(g.toView(o.x,o.y),g.toView(m.x,m.y))<70).sort((a,b)=>dist(g.toView(a.x,a.y),g.toView(m.x,m.y))-dist(g.toView(b.x,b.y),g.toView(m.x,m.y)))[0];
  if(!b||b.ownerId)continue;
  const all=m.members.map(q=>({o:map.get(q.id),pose:q.pose})).filter(q=>q.o&&team(q.o)),standing=all.filter(q=>onFeet(q.pose));
  if(support&&!standing.length||ruck&&(!standing.some(q=>team(q.o)===1)||!standing.some(q=>team(q.o)===-1)))continue;
  const participants=ruck?standing:all,extents=participants.map(q=>({p:projected(q.o,g,v),r:extent(q.o,q.pose,g,v)}));
  const corners=[{x:g.margin,y:g.margin},{x:g.margin+g.fw,y:g.margin+g.fh},{x:g.margin+g.fw,y:g.margin},{x:g.margin,y:g.margin+g.fh}].map(p=>dot(p,v)),lo=Math.min(...corners),hi=Math.max(...corners);
  out.push({id:m.id,v,blue:clamp(Math.min(...extents.map(q=>q.p-q.r)),lo,hi),orange:clamp(Math.max(...extents.map(q=>q.p+q.r)),lo,hi),members:all.map(q=>q.o.id),excluded:[...all.map(q=>q.o.id),m.breakdown?.carrierId],kind:ruck?'Ruck':'Tackle support'});
 }
 return out;
}
export function offsideOverlay(objects,d,g,mode='auto',ink=false){
 return offsideBands(objects,d,g,mode).map(b=>{
  const horizontal=Math.abs(b.v.y)>.5;
  return '<g data-offside-guide="true" pointer-events="none" aria-label="Approximate breakdown offside lines">'+[[b.blue,ink?'#155a91':'#9bd6ff','BLUE'],[b.orange,ink?'#a6520e':'#ffc28d','ORANGE']].map(([p,c,label])=>{
   const k=p/(horizontal?b.v.y:b.v.x),pos=horizontal?'x1="'+g.margin+'" x2="'+(g.margin+g.fw)+'" y1="'+k+'" y2="'+k+'"':'x1="'+k+'" x2="'+k+'" y1="'+g.margin+'" y2="'+(g.margin+g.fh)+'"';
   const zoomView=g.annotationViewport,scale=zoomView?g.annotationScale||1:1;
   const view=scale<.999?zoomView:null;
   const lineVisible=!view||horizontal?k>=view.y&&k<=view.y+view.height:k>=view.x&&k<=view.x+view.width;
   const tx=horizontal?(view?Math.max(g.margin+5,view.x+9*scale):g.margin+5):k+4*scale;
   const ty=horizontal?k-5*scale:(view?Math.max(g.margin+12,view.y+12*scale):g.margin+12);
   const guideText=lineVisible?'<text x="'+tx+'" y="'+ty+'" font-size="'+(10*scale)+'" fill="'+c+'" paint-order="stroke" stroke="'+(ink?'#fff':'#203b2b')+'" stroke-width="'+(3*scale)+'">'+(view?'OFFSIDE · GUIDE':label+' · OFFSIDE GUIDE')+'</text>':'';
   return '<line '+pos+' stroke="'+c+'" stroke-width="2" stroke-dasharray="7 5"/>'+guideText;
  }).join('')+'</g>'
 }).join('');
}
