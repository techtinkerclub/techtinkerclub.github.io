// Grid coordinates are measured in metres from the logical top-left of the pitch.
// The same positions snap identically in either screen orientation.
export const GRID_STEPS=[.25,.5,1,2,5];
export function gridStep(value){return GRID_STEPS.includes(Number(value))?Number(value):.5}
export function placePoint(p,g,enabled=true,step=.5,bounds={minX:24,maxX:876,minY:25,maxY:515}){
 const {minX,maxX,minY,maxY}=bounds;
 const constrain=(v,min,max)=>Math.max(min,Math.min(max,v));
 if(!enabled)return {x:constrain(p.x,minX,maxX),y:constrain(p.y,minY,maxY)};
 const s=gridStep(step);
 function axis(v,origin,span,metres,min,max){
  const increment=span*s/metres;
  const lo=Math.ceil((min-origin)/increment-1e-9),hi=Math.floor((max-origin)/increment+1e-9);
  return origin+constrain(Math.round((v-origin)/increment),lo,hi)*increment;
 }
 return {x:axis(p.x,42,816,g.width,minX,maxX),y:axis(p.y,37,466,g.length,minY,maxY)};
}
const KEY='rugby-studio-grid-v1';
export function loadGridPrefs(){
 try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');return {snap:p.snap!==false,visible:p.visible===true,step:gridStep(p.step)}}catch{return {snap:true,visible:false,step:.5}}
}
export function saveGridPrefs(p){try{localStorage.setItem(KEY,JSON.stringify(p))}catch{}}
