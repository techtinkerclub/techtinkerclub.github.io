import {fieldContext,fullFieldSVG} from './field-context.js?v=1';
import {symbolFactors} from './symbol-scale.js?v=0.12.23';

/** Scale the original normalized drill coordinates into a proportional training area.
 * Legacy records use 42..858 across, 37..503 along, with attack toward decreasing y.
 * Keep that schema so saved drills, animation tracks and older imports remain compatible.
 */
export function pitchGeometry(length,width,orientation='up'){
 const l=Number(length)>0?Number(length):20,w=Number(width)>0?Number(width):15;
 const scale=700/Math.max(l,w),across=w*scale,along=l*scale,margin=44;
 const right=orientation==='right',fw=right?along:across,fh=right?across:along;
 const viewWidth=fw+2*margin,viewHeight=fh+2*margin;
 const toView=(x,y)=>{
  const u=(x-42)/816,v=(y-37)/466;
  return right?{x:margin+(1-v)*along,y:margin+u*across}:{x:margin+u*across,y:margin+v*along};
 };
 const fromView=(x,y)=>{
  const u=right?(y-margin)/across:(x-margin)/across;
  const v=right?1-(x-margin)/along:(y-margin)/along;
  return {x:42+u*816,y:37+v*466};
 };
 return {length:l,width:w,scale,margin,fw,fh,viewWidth,viewHeight,toView,fromView,rotation:right?90:0,orientation:right?'right':'up'};
}
// The large field is a background reference. The drill still owns independent
// metre dimensions and legacy normalized coordinates; placing the rectangle on
// a field must never change the relative paths, speed or player spacing.
export function drillGeometry(d,orientation='up'){
 const context=fieldContext(d);
 if(context.mode!=='field')return pitchGeometry(d.length,d.width,orientation);
 const fullLength=context.length+2*context.inGoal;
 const base=pitchGeometry(fullLength,context.width,orientation);
 const fieldPoint=(x,y)=>base.toView(42+x*816/context.width,37+y*466/fullLength);
 const toView=(x,y)=>fieldPoint(context.x+(x-42)/816*d.width,
   context.inGoal+context.y+(y-37)/466*d.length);
 const fromView=(x,y)=>{
  const pos=base.fromView(x,y);
  const mx=(pos.x-42)*context.width/816,my=(pos.y-37)*fullLength/466;
  return {x:42+(mx-context.x)*816/d.width,
   y:37+(my-context.inGoal-context.y)*466/d.length};
 };
 const a=toView(42,37),b=toView(858,503);
 return {...base,toView,fromView,fieldPoint,fieldContext:context,
  practice:{length:d.length,width:d.width},
  trainingRect:{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),
   width:Math.abs(a.x-b.x),height:Math.abs(a.y-b.y)}};
}
// Rulers follow screen axes; labels are measured from the displayed top-left.
export function metreRulers(g){
 const {margin:m,fw,fh,scale}=g;
 const axis=(size,horizontal)=>{
  const metres=size/scale,major=scale*5>=26?5:10;
  let values=Array.from({length:Math.floor(metres+1e-7)+1},(_,i)=>i);
  if(Math.abs(metres-Math.round(metres))>1e-6)values.push(metres);
  return values.map((v,i)=>{
   const end=i===values.length-1,important=i===0||end||Math.abs(v%major)<1e-7;
   const label=important&&(end||metres-v>=Math.min(major/2,16/scale));
   const pos=m+v*scale,edge=horizontal?m+fh:m+fw,tick=important?6:3;
   const line=horizontal?'<path d="M'+pos+' '+edge+'v'+tick+'"/>':'<path d="M'+edge+' '+pos+'h'+tick+'"/>';
   const t=label?'<text stroke="none" '+(horizontal?'x="'+pos+'" y="'+(edge+17)+'" text-anchor="middle"':'x="'+(edge+9)+'" y="'+(pos+3.5)+'" text-anchor="start"')+'>'+Number(v.toFixed(2))+'</text>':'';
   return line+t;
  }).join('');
 };
 return '<g data-metre-rulers="true" aria-label="Pitch edge scale in metres" pointer-events="none" fill="#b6cbb9" stroke="#b6cbb9" stroke-width=".85" font-size="10" font-weight="500">'+axis(fw,true)+axis(fh,false)+'</g>';
}
export function trainingField(g,grid=false,gridStep=.5,settings={}){
 if(g.fieldContext?.mode==='field')return fullFieldSVG(g,grid,gridStep,settings);
 const {margin:m,fw,fh,viewWidth:vw,viewHeight:vh,orientation,scale,length,width}=g;
 const right=orientation==='right',n=8,step=[.25,.5,1,2,5].includes(Number(gridStep))?Number(gridStep):.5,spacing=step*scale;
 const stripes=Array.from({length:n},(_,i)=>i%2===0?'':right?
  `<rect x="${m+i*fw/n}" y="${m}" width="${fw/n}" height="${fh}" fill="#fff" opacity=".035"/>`:
  `<rect x="${m}" y="${m+i*fh/n}" width="${fw}" height="${fh/n}" fill="#fff" opacity=".035"/>`).join('');
 const boundary=['line','cones','flags','none'].includes(settings.boundary)?settings.boundary:'line';
 const cornerType=boundary==='cones'?'cone':'flag';
 const [cx,cy]=symbolFactors({type:cornerType},g);
 const cornerShape=boundary==='cones'
  ?'<path d="M0 -12L11 10H-11Z" fill="#ffda78" stroke="#754c29" stroke-width="1.5"/>'
  :'<path d="M-5 14V-15L13 -8L-5 -2" fill="#ef8177" stroke="#ffe4ce" stroke-width="1.6"/>';
 const border=boundary==='line'?'<rect x="'+m+'" y="'+m+'" width="'+fw+'" height="'+fh+'" fill="none" stroke="#d4e6c9" stroke-width="2"/>':boundary==='none'?'':[[m,m],[m+fw,m],[m,m+fh],[m+fw,m+fh]].map(([x,y])=>'<g transform="translate('+x+' '+y+') scale('+cx+' '+cy+')">'+cornerShape+'</g>').join('');
 const dir=({up:0,right:90,down:180,left:270}[settings.attackDirection]??0)+g.rotation;
 const angle=((dir%360)+360)%360,vertical=angle%180===0;
 const sign=angle===0||angle===90?1:-1,span=Math.min(64,(vertical?fh:fw)*.27);
 const arrowY=grid?25:m+fh+16,arrowTextY=grid?14:m+fh+28;
 const arrow=settings.showAttack===false?'':vertical
 ?'<g aria-label="Attack direction" pointer-events="none"><path d="M22 '+(m+fh/2+sign*span/2)+'V'+(m+fh/2-sign*span/2)+'" stroke="#d4e6c9" stroke-width="2.2" stroke-linecap="round" marker-end="url(#arr)"/><text transform="translate(10 '+(m+fh/2)+') rotate(-90)" font-size="11" font-weight="600" fill="#d4e6c9" text-anchor="middle">ATTACK</text></g>'
 :'<g aria-label="Attack direction" pointer-events="none"><path d="M'+(m+fw/2-sign*span/2)+' '+arrowY+'H'+(m+fw/2+sign*span/2)+'" stroke="#d4e6c9" stroke-width="2.2" stroke-linecap="round" marker-end="url(#arr)"/><text x="'+(m+fw/2)+'" y="'+arrowTextY+'" font-size="10" fill="#d4e6c9" font-weight="600" text-anchor="middle">ATTACK</text></g>';
 const gridLines=grid?`<rect x="${m}" y="${m}" width="${fw}" height="${fh}" fill="url(#gridpat)"/>`:'';
 return `<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#f9f4d9"/></marker><pattern id="gridpat" x="${right?m+fw:m}" y="${m}" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse"><path d="M${spacing} 0H0V${spacing}" fill="none" stroke="#fff" stroke-opacity=".24" stroke-width="${Math.min(1,spacing*.09)}"/></pattern></defs>
 <rect width="${vw}" height="${vh}" rx="8" fill="#203b2b"/>
 <rect x="${m}" y="${m}" width="${fw}" height="${fh}" fill="#326844"/>${stripes}${gridLines}
 ${border}${arrow}${grid?metreRulers(g):''}
 <text x="${vw/2}" y="${vh-(grid?6:vertical||settings.showAttack===false?17:5)}" fill="#d4e6c9" font-size="${vertical||settings.showAttack===false?13:11}" text-anchor="middle">${length} m long × ${width} m wide${grid?' · '+step+' m grid':''}</text>`;
}
