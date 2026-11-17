// Direct manipulation of an object's start/end percentages within one step.
// No new drill schema: existing frame.timing[id] values remain authoritative.
export function normalTiming(t) {
 const rawStart=Number(t?.start),rawEnd=Number(t?.end);
 const start=Math.max(0,Math.min(99,Math.round(Number.isFinite(rawStart)?rawStart:0)));
 const end=Math.max(start+1,Math.min(100,Math.round(Number.isFinite(rawEnd)?rawEnd:100)));
 return {start,end};
}
export function shiftedTiming(t,part,delta) {
 const {start,end}=normalTiming(t),d=Math.round(delta);
 if(part==='start')return {start:Math.max(0,Math.min(end-1,start+d)),end};
 if(part==='end')return {start,end:Math.max(start+1,Math.min(100,end+d))};
 const width=end-start,next=Math.max(0,Math.min(100-width,start+d));
 return {start:next,end:next+width};
}
const same=(a,b)=>a.start===b.start&&a.end===b.end;
export function timingTrackHTML({id,label,color,timing,selected=false,esc}) {
 const t=normalTiming(timing),n=esc(label),key=esc(id),c=/^#[\da-f]{3,8}$/i.test(color)?color:'#f1aa63';
 const text=t.end-t.start>=13?t.start+'–'+t.end+'%':'';
 const range=t.start+' to '+t.end+' percent';
 return `<div class="track timing-row ${selected?'timing-selected':''}">
 <button type="button" class="track-name" data-track="${key}" title="${n} · ${range}. Click to edit numeric timing.">${n}</button>
 <div class="trackbar timing-bar" data-timing-id="${key}" style="--timing-color:${c}" role="group" aria-label="${n} timing">
  <div class="timing-span" tabindex="0" role="slider" data-timing-part="move" style="left:${t.start}%;width:${t.end-t.start}%" aria-label="Move ${n} timing window" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${t.start}" aria-valuetext="${range}" title="Drag to shift both ends together. Arrow keys adjust by 1% (Shift: 5%)."><span class="timing-span-text">${text}</span></div>
  <button type="button" class="timing-handle timing-handle-start" data-timing-part="start" style="left:${t.start}%" aria-label="Start of ${n} movement, ${t.start} percent" title="Drag to change the start of ${n}'s movement"></button>
  <button type="button" class="timing-handle timing-handle-end" data-timing-part="end" style="left:${t.end}%" aria-label="End of ${n} movement, ${t.end} percent" title="Drag to change the end of ${n}'s movement"></button>
 </div></div>`;
}
function paint(bar,t) {
 const span=bar.querySelector('.timing-span'),start=bar.querySelector('.timing-handle-start'),end=bar.querySelector('.timing-handle-end');
 span.style.left=t.start+'%';span.style.width=(t.end-t.start)+'%';
 span.querySelector('.timing-span-text').textContent=t.end-t.start>=13?t.start+'–'+t.end+'%':'';
 span.setAttribute('aria-valuenow',String(t.start));
 span.setAttribute('aria-valuetext',t.start+' to '+t.end+' percent');
 start.style.left=t.start+'%';end.style.left=t.end+'%';
 const name=bar.getAttribute('aria-label').replace(/ timing$/,'');
 start.setAttribute('aria-label','Start of '+name+' movement, '+t.start+' percent');
 end.setAttribute('aria-label','End of '+name+' movement, '+t.end+' percent');
}
export function createTimingTrackEditor(root,{read,write,onBegin,onPreview,onCommit,onCancel,onSelect}) {
 let gesture=null;
 const partFrom=e=>e.target.closest?.('[data-timing-part]');
 const find=e=>{const element=partFrom(e),bar=element?.closest('.timing-bar[data-timing-id]');return element&&bar?{element,bar,id:bar.dataset.timingId,part:element.dataset.timingPart}:null};
 const finish=(cancel=false)=>{
  if(!gesture)return;
  const g=gesture;gesture=null;
  if(root.hasPointerCapture?.(g.pointerId))root.releasePointerCapture(g.pointerId);
  if(cancel||same(g.current,g.original)){
   if(!same(g.current,g.original))write(g.id,g.raw);
   onCancel?.(g.id,g.raw);return;
  }
  onCommit?.(g.id,g.current,g.original);
 };
 root.addEventListener('pointerdown',e=>{
  if(e.button!==0||e.isPrimary===false||gesture)return;
  const target=find(e);if(!target)return;
  const originalRaw=read(target.id),original=normalTiming(originalRaw);
  gesture={...target,pointerId:e.pointerId,startX:e.clientX,width:Math.max(1,target.bar.getBoundingClientRect().width),original,current:original,raw:originalRaw};
  root.setPointerCapture(e.pointerId);e.preventDefault();
  onBegin?.(target.id);
 });
 root.addEventListener('pointermove',e=>{
  const g=gesture;if(!g||e.pointerId!==g.pointerId)return;
  const dx=Math.round((e.clientX-g.startX)*100/g.width);
  const next=shiftedTiming(g.original,g.part,dx);
  if(same(next,g.current))return;
  g.current=next;write(g.id,next);paint(g.bar,next);onPreview?.(g.id,next,g.part);
 });
 root.addEventListener('pointerup',e=>{if(gesture&&e.pointerId===gesture.pointerId)finish()});
 root.addEventListener('pointercancel',e=>{if(gesture&&e.pointerId===gesture.pointerId)finish(true)});
 root.addEventListener('lostpointercapture',()=>{if(gesture)finish(true)});
 root.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&gesture){finish(true);e.preventDefault();return}
  if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
  const target=find(e);if(!target)return;
  e.preventDefault();if(e.repeat)return;
  const old=normalTiming(read(target.id));
  const next=shiftedTiming(old,target.part,(e.key==='ArrowRight'?1:-1)*(e.shiftKey?5:1));
  if(same(old,next))return;
  onBegin?.(target.id);
  write(target.id,next);paint(target.bar,next);onCommit?.(target.id,next,old);
 });
 root.addEventListener('click',e=>{
  const name=e.target.closest('[data-track]');if(name)onSelect?.(name.dataset.track);
 });
 return {cancel:()=>finish(true)};
}
