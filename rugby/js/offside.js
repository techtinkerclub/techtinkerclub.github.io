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
// Dynamic coach-drawn offside lines stay attached to the live breakdown.
// The automatic guide is illustrative: icon footprints approximate hindmost feet.
// Objects without a followContactId keep their fully editable manual positions.
export function trackedOffsidePosition(o,objects,d,g){
 if(o?.type!=='offsideLine'||!o.diagram?.followContactId)return o;
 const band=offsideBands(objects,d,g,'guide').find(b=>b.id===o.diagram.followContactId);
 if(!band)return null; // The ruck has ended (e.g. the ball has been picked up).
 const v=band.v,t={x:-v.y,y:v.x};
 const center={x:g.margin+g.fw/2,y:g.margin+g.fh/2};
 const offset=clamp(Number(o.diagram.followOffset)||0,-15,15)*g.scale;
 const lateral=clamp(Number(o.diagram.followLateral)||0,-15,15)*g.scale;
 const foot=(o.diagram.followSide==='defence'?band.orange:band.blue)+offset;
 const across=dot(center,t)+lateral;
 const q=g.fromView(foot*v.x+across*t.x,foot*v.y+across*t.y);
 const rot=Math.atan2(t.y,t.x)*180/Math.PI-g.rotation;
 return {...o,x:q.x,y:q.y,rot};
}
export function trackedOffsideObjects(objects,d,g){
 return objects.flatMap(o=>{const q=trackedOffsidePosition(o,objects,d,g);return q?[q]:[]});
}
// Dragging a tracked guide adjusts its anchor, rather than breaking the link.
// Offsets are in real metres so different cameras and video resolutions agree.
export function moveTrackedOffsideGuide(o,objects,d,g,point){
 if(o?.type!=='offsideLine'||!o.diagram?.followContactId)return false;
 const current=trackedOffsidePosition(o,objects,d,g),v=attackVector(d,g,'guide');
 if(!current||!v||!g.scale)return false;
 const a=g.toView(current.x,current.y),b=g.toView(point.x,point.y),dx=b.x-a.x,dy=b.y-a.y;
 const forward=(dx*v.x+dy*v.y)/g.scale,lateral=(-dx*v.y+dy*v.x)/g.scale;
 o.diagram.followOffset=clamp((Number(o.diagram.followOffset)||0)+forward,-15,15);
 o.diagram.followLateral=clamp((Number(o.diagram.followLateral)||0)+lateral,-15,15);
 return true;
}
export function offsideOverlay(objects,d,g,mode='auto',ink=false,suppressTracked=false){
 const tracked=suppressTracked?new Set(objects.filter(o=>o.type==='offsideLine'&&o.diagram?.followContactId).map(o=>o.diagram.followContactId)):new Set();
 return offsideBands(objects,d,g,mode).filter(b=>!tracked.has(b.id)).map(b=>{
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
