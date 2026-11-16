// Routes are stored in the destination frame using the original drill coordinate system.
// Interpolation uses physical distance in the proportional view, including smooth curves.
export function cleanRoute(raw){
 if(!raw||typeof raw!=='object')return null;
 const points=Array.isArray(raw.points)?raw.points.slice(0,64).filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({x:Math.max(0,Math.min(900,p.x)),y:Math.max(0,Math.min(540,p.y))})):[];
 return {mode:raw.mode==='corners'?'corners':'smooth',points,follow:raw.follow===true};
}
export function sanitizeRoutes(frames){
 for(let i=0;i<frames.length;i++){
  const fr=frames[i],prev=frames[i-1],map=Object.create(null);
  for(const o of fr.objects){
   if(!prev?.objects.some(p=>p.id===o.id)||!Object.hasOwn(fr.paths||{},o.id))continue;
   const route=cleanRoute(fr.paths[o.id]);if(route)map[o.id]=route;
  }
  fr.paths=map;
 }
 return frames;
}
const dist=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
function smoothPoint(a,b,c,d,t){
 const t2=t*t,t3=t2*t;
 return {x:.5*((2*b.x)+(-a.x+c.x)*t+(2*a.x-5*b.x+4*c.x-d.x)*t2+(-a.x+3*b.x-3*c.x+d.x)*t3),y:.5*((2*b.y)+(-a.y+c.y)*t+(2*a.y-5*b.y+4*c.y-d.y)*t2+(-a.y+3*b.y-3*c.y+d.y)*t3)};
}
export function routeSamples(start,end,route,g){
 const nodes=[start,...(route?.points||[]),end].map(p=>g.toView(p.x,p.y));
 if(route?.mode!=='smooth'||nodes.length<3)return nodes;
 const out=[nodes[0]];
 for(let i=0;i<nodes.length-1;i++){
  const a=nodes[Math.max(0,i-1)],b=nodes[i],c=nodes[i+1],d=nodes[Math.min(nodes.length-1,i+2)];
  for(let j=1;j<=20;j++)out.push(smoothPoint(a,b,c,d,j/20));
 }
 return out;
}
export function routeSVG(samples){
 return samples.map((p,i)=>(i?'L':'M')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' ');
}
export function sampleRoute(samples,t){
 const segments=[];let total=0;
 for(let i=1;i<samples.length;i++){const len=dist(samples[i-1],samples[i]);if(len>1e-8){segments.push({a:samples[i-1],b:samples[i],start:total,len});total+=len}}
 if(!total)return {point:samples[0],angle:null};
 const at=Math.max(0,Math.min(1,t))*total,s=segments.find(s=>at<=s.start+s.len+1e-8)||segments.at(-1);
 return {point:mix(s.a,s.b,Math.max(0,Math.min(1,(at-s.start)/s.len))),angle:Math.atan2(s.b.x-s.a.x,s.a.y-s.b.y)*180/Math.PI};
}
export function waypointOverlay(route,g){
 return (route?.points||[]).map((p,i)=>{
  const q=g.toView(p.x,p.y);
  return `<g data-editor-only="true" data-waypoint="${i}" class="waypoint" transform="translate(${q.x} ${q.y})" cursor="move"><title>Drag waypoint ${i+1}; Alt-click to remove</title><circle r="16" fill="transparent"/><circle r="9" fill="#ffe69a" stroke="#26352a" stroke-width="2"/><text y="3" font-size="9" text-anchor="middle" fill="#27382a" pointer-events="none">${i+1}</text></g>`;
 }).join('');
}
