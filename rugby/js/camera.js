// View-only camera. Drill coordinates, paths and exports are independent of zoom.
const camClamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function cameraRect(g,w,h,z=1,cx=g.viewWidth/2,cy=g.viewHeight/2){
 const scale=Math.min(Math.max(1,w)/g.viewWidth,Math.max(1,h)/g.viewHeight);
 const width=Math.max(1,w)/scale/z,height=Math.max(1,h)/scale/z;
 const x=width>=g.viewWidth?(g.viewWidth-width)/2:camClamp(cx-width/2,0,g.viewWidth-width);
 const y=height>=g.viewHeight?(g.viewHeight-height)/2:camClamp(cy-height/2,0,g.viewHeight-height);
 return {x,y,width,height};
}
export function createCamera(pitch,{canNavigate=()=>true,getGeometry,onChange=()=>{}}){
 let zoom=1,cx=0,cy=0,key='',rect=null,space=false,pan=null,panMode=false;
 const size=()=>({w:pitch.clientWidth||900,h:pitch.clientHeight||540});
 function apply(g=getGeometry()){
  const k=[g.viewWidth,g.viewHeight,g.orientation].join(':');if(k!==key){key=k;zoom=1;cx=g.viewWidth/2;cy=g.viewHeight/2}
  const {w,h}=size();rect=cameraRect(g,w,h,zoom,cx,cy);cx=rect.x+rect.width/2;cy=rect.y+rect.height/2;
  pitch.setAttribute('viewBox',[rect.x,rect.y,rect.width,rect.height].join(' '));onChange(zoom,panMode);
 }
 function fit(){const g=getGeometry();zoom=1;cx=g.viewWidth/2;cy=g.viewHeight/2;apply(g)}
 function point(e){const p=pitch.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(pitch.getScreenCTM().inverse())}
 function changeZoom(factor,anchor=null){if(!canNavigate())return;if(!rect)apply();const next=camClamp(zoom*factor,1,5);if(Math.abs(next-zoom)<1e-9)return;
  if(anchor){const ratio=zoom/next;cx=anchor.x+(cx-anchor.x)*ratio;cy=anchor.y+(cy-anchor.y)*ratio}
  zoom=next;apply();
 }
 function setPanMode(on){panMode=!!on;pitch.classList.toggle('pan-ready',panMode||space);onChange(zoom,panMode)}
 function down(e){if(!canNavigate()||pan||!(e.button===1||e.button===0&&(space||panMode)))return;
  if(!rect)apply();pan={id:e.pointerId,x:e.clientX,y:e.clientY,cx,cy,scale:rect.width/(pitch.clientWidth||900)};
  pitch.setPointerCapture(e.pointerId);pitch.classList.add('panning');e.stopImmediatePropagation();e.preventDefault();
 }
 function move(e){if(!pan||pan.id!==e.pointerId)return;cx=pan.cx-(e.clientX-pan.x)*pan.scale;cy=pan.cy-(e.clientY-pan.y)*pan.scale;apply();e.stopImmediatePropagation();e.preventDefault()}
 function finish(e){if(!pan||pan.id!==e.pointerId)return;pan=null;pitch.classList.remove('panning');e.stopImmediatePropagation()}
 pitch.addEventListener('pointerdown',down,true);pitch.addEventListener('pointermove',move,true);for(const n of ['pointerup','pointercancel','lostpointercapture'])pitch.addEventListener(n,finish,true);
 pitch.addEventListener('wheel',e=>{if(!canNavigate())return;e.preventDefault();changeZoom(Math.exp(-e.deltaY*.0016),point(e))},{passive:false});
 pitch.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault()});
 document.addEventListener('keydown',e=>{if(e.code!=='Space'||e.target?.closest?.('input,textarea,select,button,[contenteditable]')||!canNavigate())return;space=true;pitch.classList.add('pan-ready');e.preventDefault()});
 document.addEventListener('keyup',e=>{if(e.code==='Space'){space=false;pitch.classList.toggle('pan-ready',panMode)}});
 window.addEventListener('blur',()=>{space=false;pitch.classList.toggle('pan-ready',panMode)});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>apply()).observe(pitch);
 return {apply,fit,changeZoom,setPanMode,get panMode(){return panMode},get zoom(){return zoom}};
}
