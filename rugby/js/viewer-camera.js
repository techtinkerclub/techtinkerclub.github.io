// Additional read-only zoom inside the selected full-field or action camera.
// No pitch / player coordinates are changed; the user pans only the viewBox.
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
export function zoomWindow(base,level=1,pan={x:0,y:0}){
 const z=clamp(Number(level)||1,1,12),width=base.width/z,height=base.height/z;
 return {x:clamp(base.x+(base.width-width)/2+(Number(pan.x)||0),base.x,base.x+base.width-width),
  y:clamp(base.y+(base.height-height)/2+(Number(pan.y)||0),base.y,base.y+base.height-height),
  width,height};
}
export function viewerZoomLevel(value){return clamp(Number(value)||1,1,12)}
