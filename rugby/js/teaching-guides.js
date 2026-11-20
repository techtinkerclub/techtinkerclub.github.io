import {cameraTextPlacement} from './annotation-camera.js?v=1';
// Measured teaching guides for age-grade rule explanations.
// Coordinates use the drill's 900 x 540 editor space; metres are always
// computed from pitchGeometry, never hard-coded into the graphic.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=900&&p.y>=0&&p.y<=540?{x:p.x,y:p.y}:null;
const text=s=>String(s??'').slice(0,90);
export function cleanTeachingGuides(input){
 if(!Array.isArray(input))return [];
 return input.slice(0,12).flatMap(raw=>{
  if(!raw||!['distance','line','mark'].includes(raw.kind))return [];
  const a=point(raw.a),b=point(raw.b),label=text(raw.label);
  if(!a||raw.kind!=='mark'&&!b)return [];
  if(raw.kind==='mark')return [{kind:'mark',a,label}];
  if(Math.hypot(b.x-a.x,b.y-a.y)<.1)return [];
  return [{kind:raw.kind,a,b,label}];
 });
}
export function measuredMetres(g,a,b){
 const p=g.toView(a.x,a.y),q=g.toView(b.x,b.y);
 return Math.hypot(q.x-p.x,q.y-p.y)/g.scale;
}
export function teachingGuidesSVG(frame,g,{ink=false}={}){
 const all=cleanTeachingGuides(frame?.teachingGuides);
 if(!all.length)return '';
 const fg=ink?'#304b38':'#f5f7df',accent=ink?'#355a73':'#bde8ff',other=ink?'#805124':'#ffe09a',bg=ink?'#fff':'#182d24';
 const common=' stroke-linecap="round" stroke-linejoin="round"';
 const labelAt=(x,y,value,col)=>{
  if(!value)return '';
  const size=Math.min(240,Math.max(50,value.length*6.6+18));
  const camera=g.annotationViewport;
  const safeX=camera?x:Math.max(size/2+4,Math.min(g.viewWidth-size/2-4,x));
  const safeY=camera?y:Math.max(18,Math.min(g.viewHeight-10,y));
  const placement=cameraTextPlacement(g,{x:safeX,y:safeY},size,20);
  if(!placement.visible)return '';
  const transform=placement.scale<.999?
   ' transform="translate('+placement.dx+' '+placement.dy+') translate('+safeX+' '+safeY+') scale('+placement.scale+') translate('+(-safeX)+' '+(-safeY)+')"':'';
  return '<g'+transform+'><rect x="'+(safeX-size/2)+'" y="'+(safeY-14)+'" width="'+size+'" height="20" rx="6" fill="'+bg+'" stroke="'+col+'" stroke-width="1"/><text x="'+safeX+'" y="'+safeY+'" font-size="12" font-weight="700" text-anchor="middle" fill="'+fg+'">'+esc(value)+'</text></g>';
 };
 const items=all.map(guide=>{
  const A=g.toView(guide.a.x,guide.a.y),B=guide.b?g.toView(guide.b.x,guide.b.y):null;
  if(guide.kind==='mark'){
   return '<circle cx="'+A.x+'" cy="'+A.y+'" r="8" fill="none" stroke="'+other+'" stroke-width="2.4"/>'+
    '<path d="M'+(A.x-13)+' '+A.y+'h26M'+A.x+' '+(A.y-13)+'v26" stroke="'+other+'" stroke-width="1.5"'+common+'/>'+
    labelAt(A.x,A.y-19,guide.label,other);
  }
  if(guide.kind==='line'){
   const midX=(A.x+B.x)/2,midY=(A.y+B.y)/2;
   return '<path d="M'+A.x+' '+A.y+'L'+B.x+' '+B.y+'" stroke="'+accent+'" stroke-width="2.6" stroke-dasharray="9 6" fill="none"'+common+'/>'+
    labelAt(midX,midY-17,guide.label,accent);
  }
  const d=measuredMetres(g,guide.a,guide.b),dx=B.x-A.x,dy=B.y-A.y,len=Math.hypot(dx,dy),nx=-dy/len*7,ny=dx/len*7,midX=(A.x+B.x)/2,midY=(A.y+B.y)/2;
  const metres=Number(d.toFixed(1)).toString()+' m';
  const label=guide.label?metres+' · '+guide.label:metres;
  return '<path d="M'+A.x+' '+A.y+'L'+B.x+' '+B.y+'" stroke="'+other+'" stroke-width="2.3" stroke-dasharray="3 3" fill="none"'+common+'/>'+
   '<path d="M'+(A.x-nx)+' '+(A.y-ny)+'L'+(A.x+nx)+' '+(A.y+ny)+'M'+(B.x-nx)+' '+(B.y-ny)+'L'+(B.x+nx)+' '+(B.y+ny)+'" stroke="'+other+'" stroke-width="2.3" fill="none"'+common+'/>'+
   labelAt(midX,midY-16,label,other);
 });
 return '<g class="teaching-guides" data-teaching-guides="true" aria-label="Measured rugby teaching guides" pointer-events="none">'+items.join('')+'</g>';
}
