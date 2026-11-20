// View-dependent *presentation* scaling. Never change pitch coordinates,
// actor size, movement paths or metre measurements to compensate for zoom.
// A camera crop enlarges world pixels; annotation glyphs must counter-scale.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function annotationCamera(g,view){
 if(!view||!Number.isFinite(view.width)||!Number.isFinite(view.height)||view.width<=0||view.height<=0)
  return {scale:1,view:null};
 const zoom=Math.max(1,Math.min(g.viewWidth/view.width,g.viewHeight/view.height));
 const scale=clamp(1/zoom,.08,1);
 return {scale,view:{x:view.x,y:view.y,width:view.width,height:view.height}};
}
export function withAnnotationCamera(g,view){
 const camera=annotationCamera(g,view);
 return {...g,annotationViewport:camera.view,annotationScale:camera.scale};
}
export function isVisibleAnnotation(g,x,y,pad=0){
 const v=g?.annotationViewport;
 return !v||x>=v.x-pad&&x<=v.x+v.width+pad&&y>=v.y-pad&&y<=v.y+v.height+pad;
}
// Use local, camera-relative coordinates in a uniformly scaled group.
// All bubble collision boxes are mapped back to world coordinates so
// existing planners, reservations and multiple simultaneous bubbles work.
export function bubbleCameraSpace(g,x,y,avoid=[],reserved=[]){
 const v=g?.annotationViewport,s=Number(g?.annotationScale)||1;
 if(!v||s>=.999)return null;
 if(!isVisibleAnnotation(g,x,y,10*s))return {hidden:true};
 const map=p=>({x:(p.x-v.x)/s,y:(p.y-v.y)/s,...(p.id?{id:p.id}:{})});
 const rect=r=>({x:(r.x-v.x)/s,y:(r.y-v.y)/s,w:r.w/s,h:r.h/s});
 return {
  hidden:false,
  x:(x-v.x)/s,y:(y-v.y)/s,
  avoid:avoid.map(map),reserved:reserved.map(rect),
  geometry:{...g,margin:8,viewWidth:v.width/s,viewHeight:v.height/s,
   annotationViewport:null,annotationScale:1},
  opening:'<g class="camera-readable-bubble" transform="translate('+v.x+' '+v.y+') scale('+s+')">',
  closing:'</g>',
  toWorld:r=>({x:v.x+r.x*s,y:v.y+r.y*s,w:r.w*s,h:r.h*s})
 };
}
// Text remains screen-sized but anchored to its world point. Suppress an
// unrelated caption once the camera has moved far away from its authoring spot.
export function cameraTextPlacement(g,p,width,height){
 const v=g?.annotationViewport,s=Number(g?.annotationScale)||1;
 if(!v||s>=.999)return {visible:true,scale:1,dx:0,dy:0};
 if(!isVisibleAnnotation(g,p.x,p.y,8*s))return {visible:false,scale:s,dx:0,dy:0};
 const pad=6*s,halfW=Math.min(width*s/2,Math.max(0,v.width/2-pad)),halfH=Math.min(height*s/2,Math.max(0,v.height/2-pad));
 const centerX=clamp(p.x,v.x+pad+halfW,v.x+v.width-pad-halfW);
 const centerY=clamp(p.y,v.y+pad+halfH,v.y+v.height-pad-halfH);
 return {visible:true,scale:s,dx:centerX-p.x,dy:centerY-p.y};
}
