// The contact marker is visually hidden by arranged players. In the editor,
// show a transposed route beside its MOVE proxy instead. Real pitch coordinates
// are unchanged; short routes are magnified only in this editor-only overlay.
import {routeSamples,routeSVG} from './routes.js?v=0.4.3';
import {contactHandlePoint} from './contact-drag.js?v=0.12.29';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

// Build an invertible proxy transform for viewing and editing paths.
// The endpoint is near/below the fixed MOVE handle; the entire visible line
// stays below the icon, rather than disappearing under the players or pad.
export function formationTrajectoryTransform(before,frame,marker,g){
 const handle=contactHandlePoint(frame,marker,g),end=g.toView(marker.x,marker.y);
 const route=frame.paths?.[marker.id];
 const nodes=[before,...(route?.points||[]),marker].map(o=>g.toView(o.x,o.y));
 const span=Math.max(0,...nodes.map(p=>distance(p,end)));
 const scale=span>0.001?clamp(55/span,1,8):1;
 const dyMin=Math.min(0,...nodes.map(q=>(q.y-end.y)*scale));
 const dxMin=Math.min(0,...nodes.map(q=>(q.x-end.x)*scale)),dxMax=Math.max(0,...nodes.map(q=>(q.x-end.x)*scale));
 let anchorX=handle.x;
 // Keep the enlarged line inside the pitch even next to touchlines.
 anchorX=clamp(anchorX,g.margin+13-dxMin,g.margin+g.fw-13-dxMax);
 const anchorY=handle.y+33-dyMin;
 return {
  scale,handle,
  toProxy:p=>({x:anchorX+(p.x-end.x)*scale,y:anchorY+(p.y-end.y)*scale}),
  fromProxy:p=>({x:end.x+(p.x-anchorX)/scale,y:end.y+(p.y-anchorY)/scale})
 };
}
// The old translation helper remains for older integrations; the new
// transform above handles both magnification and stable grip position.
export function formationRouteOffset(frame,marker,g){
 const p=g.toView(marker.x,marker.y),h=contactHandlePoint(frame,marker,g);
 return {x:h.x-p.x,y:h.y-p.y};
}
export function unraiseFormationPoint(point,frame,marker,g,before){
 if(before){
  const transform=formationTrajectoryTransform(before,frame,marker,g);
  const view=transform.fromProxy(point);
  return g.fromView(view.x,view.y);
 }
 const off=formationRouteOffset(frame,marker,g);
 return g.fromView(point.x-off.x,point.y-off.y);
}
// Tiny direction arrows alongside repeated, opposite-direction segments.
// These arrows are NOT pitch-space motion: they just separate overlapping
// editor strokes so both directions of a short contest are readable.
function legArrows(nodes){
 if(nodes.length<2||nodes.length>13)return '';
 return nodes.slice(1).map((b,i)=>{
  const a=nodes[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
  if(len<5)return '';
  const along={x:dx/len,y:dy/len},side={x:-along.y,y:along.x};
  const stagger=(i%4-1.5)*5;
  const from={x:a.x+dx*.22+side.x*stagger,y:a.y+dy*.22+side.y*stagger};
  const to={x:a.x+dx*.72+side.x*stagger,y:a.y+dy*.72+side.y*stagger};
  const head={x:to.x-along.x*6,y:to.y-along.y*6};
  const left={x:head.x+side.x*3.5,y:head.y+side.y*3.5};
  const right={x:head.x-side.x*3.5,y:head.y-side.y*3.5};
  return '<path d="M'+from.x+' '+from.y+'L'+to.x+' '+to.y+'M'+left.x+' '+left.y+'L'+to.x+' '+to.y+'L'+right.x+' '+right.y+'" fill="none" stroke="#102d20" stroke-width="4.1" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>'+
  '<path d="M'+from.x+' '+from.y+'L'+to.x+' '+to.y+'M'+left.x+' '+left.y+'L'+to.x+' '+to.y+'L'+right.x+' '+right.y+'" fill="none" stroke="'+(i%2?'#91d6ff':'#eeffaa')+'" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>';
 }).join('');
}
export function formationTrajectorySVG(before,frame,marker,g,frozen=null){
 if(!before||!marker)return '';
 const route=frame.paths?.[marker.id];
 if(!route||distance(before,marker)<1e-7&&!route.points?.length)return '';
 const transform=frozen||formationTrajectoryTransform(before,frame,marker,g);
 const samples=routeSamples(before,marker,route,g).map(transform.toProxy);
 const d=routeSVG(samples),start=samples[0],end=samples.at(-1);
 const nodePoints=[before,...(route.points||[]),marker].map(p=>transform.toProxy(g.toView(p.x,p.y)));
 const handles=(route.points||[]).map((p,i)=>{
  const q=transform.toProxy(g.toView(p.x,p.y)),x=q.x,y=q.y;
  return `<g data-contact-route-waypoint="${i}" class="contact-route-point" cursor="move">
   <circle cx="${x}" cy="${y}" r="15" fill="#193e2b" stroke="#e6ff99" stroke-width="2"/>
   <circle cx="${x}" cy="${y}" r="10.5" fill="#e6ff99" stroke="#193b2a" stroke-width="1.5"/>
   <text x="${x}" y="${y+3.8}" font-size="10" font-weight="700" text-anchor="middle" fill="#1b4028" pointer-events="none">${i+1}</text>
   <title>Drag move point ${i+1} · Alt-click removes it</title>
  </g>`;
 }).join('');
 const scaleNote=transform.scale>1.1?'<text x="'+(transform.handle.x+28)+'" y="'+(transform.handle.y+25)+'" font-size="9.5" font-weight="700" fill="#e8f4cf" paint-order="stroke" stroke="#193e2b" stroke-width="2.5" pointer-events="none">Path enlarged ×'+transform.scale.toFixed(1)+' (editor only)</text>':'';
 return `<g data-editor-only="true" class="formation-trajectory">
  <path d="${d}" fill="none" stroke="#0b3022" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
  <path d="${d}" fill="none" stroke="#e9ff91" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
  <path d="${d}" data-contact-route-insert="true" fill="none" stroke="transparent" stroke-width="20" pointer-events="stroke"><title>Click to add a move point</title></path>
  ${legArrows(nodePoints)}
  <circle cx="${start.x}" cy="${start.y}" r="7" fill="#183827" stroke="#e9ff91" stroke-width="2" pointer-events="none"/>
  <circle cx="${end.x}" cy="${end.y}" r="6" fill="#e9ff91" stroke="#183827" stroke-width="2" pointer-events="none"/>
  ${handles}
  ${scaleNote}
 </g>`;
}
