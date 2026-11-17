// Optional coaching diagrams, measured in metres. These are annotations, not laws or collision objects.
export const DIAGRAM_TYPES=['offsideLine','fieldLine','directionArrow','measureLine','zoneCircle','zoneRect','spotMarker'];
const defaults={
 offsideLine:{length:8,width:2,color:'#ffd48a',opacity:90,fill:false,fillOpacity:12,dashed:true},
 fieldLine:{length:8,width:2,color:'#e6f0e4',opacity:92,fill:false,fillOpacity:12,dashed:false},
 directionArrow:{length:3,width:2,color:'#bde8ff',opacity:90,fill:false,fillOpacity:12,dashed:false},
 measureLine:{length:3,width:2,color:'#d4e6c9',opacity:95,fill:false,fillOpacity:12,dashed:false},
 zoneCircle:{length:3,width:3,color:'#bce6f5',opacity:85,fill:false,fillOpacity:12,dashed:false},
 zoneRect:{length:4,width:3,color:'#c9f07c',opacity:85,fill:false,fillOpacity:12,dashed:false},
 spotMarker:{length:.65,width:.65,color:'#ffe79a',opacity:95,fill:false,fillOpacity:12,dashed:false}
};
export const isDiagramObject=o=>DIAGRAM_TYPES.includes(typeof o==='string'?o:o?.type);
const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
export function diagramSettings(type,raw={},pitchWidth=15){
 const base=defaults[type]||defaults.zoneRect,v=raw&&typeof raw==='object'?raw:{};
 const length=['offsideLine','fieldLine'].includes(type)&&!Object.hasOwn(v,'length')?pitchWidth:base.length;
 const color=/^#[0-9a-fA-F]{6}$/.test(v.color||'')?v.color:base.color;
 return {length:clamp(v.length,.25,70,length),width:clamp(v.width,.25,70,base.width),color,opacity:clamp(v.opacity,0,100,base.opacity),fill:v.fill===true,fillOpacity:clamp(v.fillOpacity,0,100,base.fillOpacity),dashed:v.dashed===undefined?base.dashed:v.dashed===true};
}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n.toFixed(2)).toString();
// The parent position/rotation is supplied by the shared editor/output rendering.
export function diagramSVG(o,g,{ink=false}={}){
 if(!isDiagramObject(o))return '';
 const s=diagramSettings(o.type,o.diagram,g.width),a=s.length*g.scale,b=s.width*g.scale,st=ink?'#244c42':s.color;
 const attrs=' fill="none" stroke="'+st+'" stroke-opacity="'+s.opacity/100+'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"'+(s.dashed?' stroke-dasharray="8 5"':'');
 let visible='',hit='',measurement='';
 const label=o.type==='offsideLine'?'OFFSIDE · COACH GUIDE':o.type==='measureLine'?fmt(s.length)+' m':String(o.label||'');
 if(o.type==='offsideLine'||o.type==='measureLine'||o.type==='fieldLine'){
  visible='<path d="M'+(-a/2)+' 0H'+(a/2)+'"'+attrs+'/>';
  if(o.type==='measureLine'){
   visible+='<path d="M'+(-a/2)+' -8v16M'+(a/2)+' -8v16"'+attrs+'/>';
   // One tick per whole metre measured from the starting cap.
   for(let mark=1;mark<s.length;mark++)visible+='<path d="M'+(-a/2+mark*g.scale)+' -4v8"'+attrs.replace('stroke-width="2.5"','stroke-width="1.4"')+'/>';
   measurement='<text x="0" y="-10" text-anchor="middle" font-size="12" font-weight="650" fill="'+st+'" paint-order="stroke" stroke="'+(ink?'#ffffff':'#203b2b')+'" stroke-width="3" pointer-events="none">'+escape(label)+'</text>';
  }
  hit='<path d="M'+(-a/2)+' 0H'+(a/2)+'" fill="none" stroke="transparent" stroke-width="22" pointer-events="stroke"/>';
 }else if(o.type==='directionArrow'){
  const end=-a/2,tip=end,base=end+Math.min(17,a*.3);
  visible='<path d="M0 '+(a/2)+'V'+tip+'M-9 '+base+'L0 '+tip+'L9 '+base+'"'+attrs+'/>';
  hit='<path d="M0 '+(a/2)+'V'+tip+'" fill="none" stroke="transparent" stroke-width="22" pointer-events="stroke"/>';
 }else if(o.type==='spotMarker'){
  const radius=a/2;visible='<circle r="'+radius+'" fill="'+st+'" fill-opacity="'+s.opacity/100+'" stroke="'+st+'" stroke-width="1"/><path d="M'+(-Math.max(7,radius+3))+' 0H'+Math.max(7,radius+3)+'M0 '+(-Math.max(7,radius+3))+'V'+Math.max(7,radius+3)+'" fill="none" stroke="'+st+'" stroke-opacity="'+s.opacity/100+'" stroke-width="1.4"/>';
  hit='<circle r="'+Math.max(12,radius+4)+'" fill="transparent" pointer-events="all"/>';
 }else if(o.type==='zoneCircle'){
  const radius=a/2;visible='<circle r="'+radius+'" fill="'+(s.fill?st:'none')+'" fill-opacity="'+(s.fill?s.fillOpacity/100:0)+'"'+attrs.replace(' fill="none"','')+'/>';
  hit='<circle r="'+radius+'" fill="transparent" stroke="transparent" stroke-width="16" pointer-events="all"/>';
 }else{
  visible='<rect x="'+(-a/2)+'" y="'+(-b/2)+'" width="'+a+'" height="'+b+'" rx="2" fill="'+(s.fill?st:'none')+'" fill-opacity="'+(s.fill?s.fillOpacity/100:0)+'"'+attrs.replace(' fill="none"','')+'/>';
  hit='<rect x="'+(-a/2)+'" y="'+(-b/2)+'" width="'+a+'" height="'+b+'" fill="transparent" stroke="transparent" stroke-width="14" pointer-events="all"/>';
 }
 const description=o.type==='offsideLine'?'<text x="0" y="-9" text-anchor="middle" font-size="10" font-weight="650" fill="'+st+'" paint-order="stroke" stroke="'+(ink?'#fff':'#203b2b')+'" stroke-width="3" pointer-events="none">'+escape(label)+'</text>':o.type!=='measureLine'&&o.label?'<text x="0" y="'+(o.type==='fieldLine'?-10:o.type==='zoneRect'?-b/2-8:o.type==='zoneCircle'?-a/2-8:-a/2-9)+'" text-anchor="middle" font-size="11" font-weight="600" fill="'+st+'" paint-order="stroke" stroke="'+(ink?'#fff':'#203b2b')+'" stroke-width="3" pointer-events="none">'+escape(o.label)+'</text>':'';
 return '<g class="diagram-markup" data-markup="true" data-line-kind="'+(o.type==='fieldLine'?'field-reference':o.type==='offsideLine'?'offside-guide':'other')+'" aria-label="Coach-drawn annotation">'+visible+hit+measurement+description+'</g>';
}
