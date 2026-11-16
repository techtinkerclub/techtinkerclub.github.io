// Group transforms are calculated in proportional pitch-view space, not normalized coordinates.
const limit=(n,a,b)=>Math.min(b,Math.max(a,n));
export function groupSnapshot(frame,ids,g){return frame.objects.filter(o=>ids.includes(o.id)).map(o=>({id:o.id,...g.toView(o.x,o.y),rot:o.rot}))}
export function groupTranslate(items,dx,dy,g){
 if(!items.length)return [];
 const xs=items.map(o=>o.x),ys=items.map(o=>o.y),m=g.margin;
 dx=limit(dx,m-Math.min(...xs),m+g.fw-Math.max(...xs));dy=limit(dy,m-Math.min(...ys),m+g.fh-Math.max(...ys));
 return items.map(o=>({id:o.id,...g.fromView(o.x+dx,o.y+dy),rot:o.rot}));
}
export function groupRotate(items,degrees,g,formation=true){
 if(!items.length)return [];
 const cx=items.reduce((s,o)=>s+o.x,0)/items.length,cy=items.reduce((s,o)=>s+o.y,0)/items.length,r=degrees*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
 const next=items.map(o=>({id:o.id,x:formation?cx+(o.x-cx)*c-(o.y-cy)*s:o.x,y:formation?cy+(o.x-cx)*s+(o.y-cy)*c:o.y,rot:((o.rot+degrees)%360+360)%360}));
 if(next.some(o=>o.x<g.margin-1e-6||o.x>g.margin+g.fw+1e-6||o.y<g.margin-1e-6||o.y>g.margin+g.fh+1e-6))return null;
 return next.map(o=>({id:o.id,...g.fromView(o.x,o.y),rot:o.rot}));
}
