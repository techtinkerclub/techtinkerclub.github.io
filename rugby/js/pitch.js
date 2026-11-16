
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
export function trainingField(g,grid=false){
 const {margin:m,fw,fh,viewWidth:vw,viewHeight:vh,orientation,scale,length,width}=g;
 const right=orientation==='right',n=8,step=Math.max(length,width)>35?5:Math.max(length,width)>20?2:1,spacing=step*scale;
 const stripes=Array.from({length:n},(_,i)=>i%2===0?'':right?
  `<rect x="${m+i*fw/n}" y="${m}" width="${fw/n}" height="${fh}" fill="#fff" opacity=".035"/>`:
  `<rect x="${m}" y="${m+i*fh/n}" width="${fw}" height="${fh/n}" fill="#fff" opacity=".035"/>`).join('');
 const gridLines=grid?`<rect x="${m}" y="${m}" width="${fw}" height="${fh}" fill="url(#gridpat)"/>`:'';
 return `<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#f9f4d9"/></marker><pattern id="gridpat" x="${m}" y="${m}" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse"><path d="M${spacing} 0H0V${spacing}" fill="none" stroke="#fff" stroke-opacity=".20" stroke-width="1"/></pattern></defs>
 <rect width="${vw}" height="${vh}" rx="8" fill="#203b2b"/>
 <rect x="${m}" y="${m}" width="${fw}" height="${fh}" fill="#326844"/>${stripes}${gridLines}
 <rect x="${m}" y="${m}" width="${fw}" height="${fh}" fill="none" stroke="#d4e6c9" stroke-width="2"/>
 <text x="${vw/2}" y="24" fill="#d4e6c9" font-size="14" text-anchor="middle">ATTACK ${right?'→':'↑'}</text>
 <text x="${vw/2}" y="${vh-17}" fill="#d4e6c9" font-size="13" text-anchor="middle">${length} m long × ${width} m wide${grid?' · '+step+' m grid':''}</text>`;
}
