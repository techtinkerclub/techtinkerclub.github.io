// Visual stacking is independent of pitch position or creation order.
// Ground equipment stays beneath players by default. Coaches can override it.
export const DRAW_LAYERS=['back','middle','front'];
const rank={back:0,middle:1,front:2};
const ground=new Set(['sausage','ladder','cone','flag','offsideLine','directionArrow','measureLine','zoneCircle','zoneRect','spotMarker']);
const central=new Set(['bag','donut','shieldItem','tackle','ruck','maul','scrum','decision']);
export function defaultDrawLayer(type){return ground.has(type)?'back':central.has(type)?'middle':'front'}
export function drawLayer(o){return DRAW_LAYERS.includes(o?.drawLayer)?o.drawLayer:o?.type==='donut'&&o.donutState==='down'?'back':defaultDrawLayer(o?.type)}
export function drawOrderValue(o,i){return Number.isFinite(o?.drawOrder)?o.drawOrder:i}
export function orderObjects(objects){
 return objects.map((o,i)=>({o,i})).sort((a,b)=>
  rank[drawLayer(a.o)]-rank[drawLayer(b.o)]||
  drawOrderValue(a.o,a.i)-drawOrderValue(b.o,b.i)||
  a.i-b.i
 ).map(x=>x.o);
}
export function setDrawingOrder(frames,id,layer,edge='normal'){
 if(!DRAW_LAYERS.includes(layer))return 0;
 let updated=0;
 for(const frame of frames){
  const target=frame.objects?.find(o=>o.id===id);if(!target)continue;
  const peers=frame.objects.map((o,i)=>({o,i})).filter(({o})=>o.id!==id&&drawLayer(o)===layer);
  target.drawLayer=layer;
  // Compare against each peer's original index in the full frame, not an
  // index in a filtered subset (which could leave a later player above us).
  const values=peers.map(({o,i})=>drawOrderValue(o,i));
  if(edge==='top')target.drawOrder=Math.min(1000000,Math.max(-1000000,0,...values))+1;
  else if(edge==='bottom')target.drawOrder=Math.max(-1000000,Math.min(1000000,0,...values))-1;
  else delete target.drawOrder;
  updated++;
 }
 return updated;
}
export function copyDrawingOrder(raw,target){
 if(DRAW_LAYERS.includes(raw?.drawLayer))target.drawLayer=raw.drawLayer;
 if(Number.isFinite(raw?.drawOrder)&&Math.abs(raw.drawOrder)<2000000)target.drawOrder=raw.drawOrder;
 return target;
}
