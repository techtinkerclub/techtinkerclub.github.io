// An editor-only, raised copy of a contact marker's actual trajectory.
// Rendering is offset toward the MOVE grip to keep tight back-and-forth
// movements visible above pads and players. The stored route and animation
// remain on the real pitch coordinates.
import {routeSamples,routeSVG} from './routes.js?v=0.4.3';
import {contactHandlePoint} from './contact-drag.js?v=0.12.24';
export function formationRouteOffset(frame,marker,g){
 const p=g.toView(marker.x,marker.y),h=contactHandlePoint(frame,marker,g);
 return {x:h.x-p.x,y:h.y-p.y};
}
export function unraiseFormationPoint(point,frame,marker,g){
 const offset=formationRouteOffset(frame,marker,g);
 return g.fromView(point.x-offset.x,point.y-offset.y);
}
export function formationTrajectorySVG(before,frame,marker,g){
 if(!before||!marker)return '';
 const route=frame.paths?.[marker.id];
 if(!route)return '';
 if(Math.hypot(before.x-marker.x,before.y-marker.y)<1e-7&&!route.points?.length)return '';
 const offset=formationRouteOffset(frame,marker,g);
 const samples=routeSamples(before,marker,route,g).map(p=>({x:p.x+offset.x,y:p.y+offset.y}));
 const d=routeSVG(samples);
 const start=samples[0];
 const handles=(route.points||[]).map((p,i)=>{
  const q=g.toView(p.x,p.y),x=q.x+offset.x,y=q.y+offset.y;
  return `<g data-contact-route-waypoint="${i}" class="contact-route-point" cursor="move">
   <circle cx="${x}" cy="${y}" r="19" fill="#1e3c29" fill-opacity=".88" stroke="#e6ff99" stroke-width="2.5"/>
   <circle cx="${x}" cy="${y}" r="11.5" fill="#e6ff99" stroke="#193b2a" stroke-width="2"/>
   <text x="${x}" y="${y+4}" font-size="11" font-weight="700" text-anchor="middle" fill="#1b4028" pointer-events="none">${i+1}</text>
   <title>Drag contact movement point ${i+1}; Alt-click removes it</title>
  </g>`;
 }).join('');
 return `<g data-editor-only="true" class="formation-trajectory">
  <path d="${d}" fill="none" stroke="#142c22" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
  <path d="${d}" fill="none" stroke="#e9ff91" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arr)" pointer-events="none"/>
  <path d="${d}" data-contact-route-insert="true" fill="none" stroke="transparent" stroke-width="19" pointer-events="stroke"><title>Click to add a movement point</title></path>
  <circle cx="${start.x}" cy="${start.y}" r="9" fill="#203d2b" stroke="#e9ff91" stroke-width="2" pointer-events="none"/>
  ${handles}
 </g>`;
}
