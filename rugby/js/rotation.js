// Angles are clockwise, with 0 pointing towards the attacking end of the pitch.
export const wrapAngle=a=>((a%360)+360)%360;
export const shortestTurn=(from,to)=>wrapAngle(to-from+180)-180;
export function rotationFromPointer(center,pointer,viewRotation=0,snap=1){
 const dx=pointer.x-center.x,dy=pointer.y-center.y;
 if(Math.hypot(dx,dy)<8)return null; // avoid unstable angles close to the centre
 const angle=Math.atan2(dx,-dy)*180/Math.PI-viewRotation;
 return wrapAngle(Math.round(angle/snap)*snap);
}
export function rotationHandle(center,angle,viewRotation=0){
 // Place the handle on the facing ray. Render above all the other objects.
 const a=wrapAngle(angle+viewRotation)*Math.PI/180;
 const x=center.x+Math.sin(a)*45,y=center.y-Math.cos(a)*45;
 const ix=center.x+Math.sin(a)*25,iy=center.y-Math.cos(a)*25;
 return `<g class="rotation-overlay" data-editor-only="true" pointer-events="none">
 <path d="M${ix} ${iy} L${x} ${y}" stroke="#f3ffb3" stroke-width="3.5" stroke-linecap="round"/>
 <g class="rotation-handle" data-rotate="true" transform="translate(${x} ${y})" pointer-events="all" cursor="grab">
 <title>Drag to rotate · Shift snaps to 15 degrees</title>
 <circle r="18" fill="transparent"/>
 <circle r="13" fill="#d6f77b" stroke="#102218" stroke-width="2.4"/>
 <path d="M-4 -3A5 5 0 1 1 -2 4 M-4 -7V-3H0" fill="none" stroke="#172d20" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" transform="scale(1.25)"/>
 </g></g>`;
}
