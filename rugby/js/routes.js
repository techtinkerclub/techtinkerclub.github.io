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

// Project onto the actual displayed route and return the interval between editable nodes.
// Smooth paths use 20 samples per interval; insertion preserves traversal order.
export function routeInsertion(start,end,route,g,pointer=null){
 const samples=routeSamples(start,end,route,g);
 const subdivisions=route?.mode==='smooth'&&route?.points?.length?20:1;
 const intervals=(route?.points?.length||0)+1;
 let best=null,score=Infinity;
 for(let i=0;i<intervals;i++){
  const first=i*subdivisions,last=first+subdivisions;
  if(!pointer){
   let length=0;for(let j=first;j<last;j++)length+=dist(samples[j],samples[j+1]);
   if(!best||length>best.length)best={index:i,point:sampleRoute(samples.slice(first,last+1),.5).point,length};
   continue;
  }
  for(let j=first;j<last;j++){
   const a=samples[j],b=samples[j+1],dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;
   if(len2<1e-10)continue;
   const t=Math.max(0,Math.min(1,((pointer.x-a.x)*dx+(pointer.y-a.y)*dy)/len2));
   const p=mix(a,b,t),d=dist(pointer,p);
   if(d<score){score=d;best={index:i,point:p}}
  }
 }
 return best?{index:best.index,point:g.fromView(best.point.x,best.point.y)}:null;
}
export function insertionHandles(start,end,route,g){
 const samples=routeSamples(start,end,route,g),n=(route?.points?.length||0)+1;
 const subdivisions=route?.mode==='smooth'&&route?.points?.length?20:1;
 if(n>16)return '';
 return Array.from({length:n},(_,i)=>{
  const seg=samples.slice(i*subdivisions,(i+1)*subdivisions+1);
  let len=0;for(let j=1;j<seg.length;j++)len+=dist(seg[j-1],seg[j]);
  if(len<68)return '';
  const p=sampleRoute(seg,.5).point;
  return `<g data-editor-only="true" data-insert-point="${i}" class="path-insert" transform="translate(${p.x} ${p.y})"><title>Drag to bend this section of the path</title><circle r="16" fill="transparent"/><circle r="10" fill="#193e2d" stroke="#e6f9bf" stroke-width="2"/><path d="M-4 0H4M0 -4V4" stroke="#e6f9bf" stroke-width="2" stroke-linecap="round" pointer-events="none"/></g>`;
 }).join('');
}
