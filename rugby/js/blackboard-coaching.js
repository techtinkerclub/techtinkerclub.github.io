// Lightweight, view-only Blackboard coaching helpers. Nothing here edits a drill.
// The existing Studio model, playback, camera and decision engines remain authoritative.
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const playerTypes=new Set(['attacker','defender','neutral','coach','shield','bagplayer']);
export function loopStepBounds(drill,index){
 if(!Array.isArray(drill?.frames)||index<1||index>=drill.frames.length)return null;
 const start=drill.frames.slice(1,index).reduce((sum,f)=>sum+Math.max(0,Number(f.seconds)||0),0);
 const seconds=Math.max(.001,Number(drill.frames[index].seconds)||0);
 return {start,end:start+seconds,seconds,index};
}
export function loopProgress(time,advance,bounds){
 if(!bounds||!(bounds.seconds>0))return time+advance;
 const remainder=((time-bounds.start+advance)%bounds.seconds+bounds.seconds)%bounds.seconds;
 return bounds.start+remainder;
}
const labels={tackle:'Tackle',release:'Release',support:'Support',ruck:'Ruck',contest:'Contest',secured:'Ball secured',held:'Held up'};
const ballLabels={pass:'Pass',drop:'Ball drop',pickup:'Pickup',rip:'Ball rip',presentation:'Present ball',turnover:'Turnover',kick:'Kick',feed:'Feed'};
export function keyMoments(drill,maximum=18){
 if(!Array.isArray(drill?.frames))return [];
 const entries=[];
 const fork=Number.isInteger(drill?.branching?.fork)?drill.branching.fork:-1;
 drill.frames.forEach((f,i)=>{
  const types=[],add=(kind,label)=>{if(!types.some(v=>v.kind===kind))types.push({kind,label})};
  if(i===0)add('setup','Start');
  if(i===fork)add('decision','Decision');
  if(f.signal?.kind==='whistle')add('whistle','Whistle');
  for(const o of f.objects||[]){
   if(o?.breakdown?.phase&&labels[o.breakdown.phase])add(o.breakdown.phase,labels[o.breakdown.phase]);
   else if(o?.type==='tackle')add('tackle','Tackle');
   else if(o?.type==='ruck')add('ruck','Ruck');
   if(o?.type==='ball'&&ballLabels[o.transferKind])add(o.transferKind,ballLabels[o.transferKind]);
  }
  if((f.interactions||[]).some(a=>a.kind==='tag'))add('tag','Tag');
  else if((f.interactions||[]).some(a=>a.kind==='touch'))add('touch','Touch');
  if(!types.length&&i===drill.frames.length-1)add('finish','Finish');
  if(types.length)entries.push({index:i,label:types[0].label,kind:types[0].kind,title:f.name||'Step '+(i+1)});
 });
 if(entries.length<=maximum)return entries;
 // Keep the opening, closing and decision; sample the remainder instead of
 // flooding the narrow Blackboard timeline with up to 150 buttons.
 const mandatory=new Set([0,entries.length-1,...entries.map((e,i)=>e.kind==='decision'?i:-1).filter(i=>i>=0)]);
 const result=entries.filter((e,i)=>mandatory.has(i));
 const others=entries.filter((e,i)=>!mandatory.has(i));
 const slots=Math.max(0,maximum-result.length);
 if(slots)for(let i=0;i<slots;i++)result.push(others[Math.floor(i*others.length/slots)]);
 return result.filter(Boolean).sort((a,b)=>a.index-b.index);
}
export function targetViewport(objects,g,id){
 if(!id||!g?.toView)return null;
 const obj=(objects||[]).find(o=>o.id===id);
 if(!obj)return null;
 const p=g.toView(obj.x,obj.y);
 const width=Math.min(210,g.viewWidth*.46),height=Math.min(150,g.viewHeight*.46);
 return {x:p.x-width/2,y:p.y-height/2,width,height};
}
// Shared, view-only Blackboard field-of-view presets. The scale factor is
// relative to the existing tracking target; a higher factor reveals more of
// the pitch. "full" uses the true pitch viewport and never changes drill data.
export const FOLLOW_FRAMING=Object.freeze({
 close:.72,standard:1,wide:1.6,veryWide:2.35,full:null
});
export function followFramingViewport(view,g,preset='standard'){
 if(!view||!g||![g.viewWidth,g.viewHeight].every(v=>Number.isFinite(v)&&v>0))return view;
 const factor=Object.prototype.hasOwnProperty.call(FOLLOW_FRAMING,preset)?FOLLOW_FRAMING[preset]:1;
 if(factor===null)return {x:0,y:0,width:g.viewWidth,height:g.viewHeight};
 if(!Number.isFinite(view.x)||!Number.isFinite(view.y)||!(view.width>0)||!(view.height>0))return view;
 const cx=view.x+view.width/2,cy=view.y+view.height/2;
 const width=Math.min(g.viewWidth,Math.max(1,view.width*factor));
 const height=Math.min(g.viewHeight,Math.max(1,view.height*factor));
 return {x:Math.max(0,Math.min(g.viewWidth-width,cx-width/2)),
  y:Math.max(0,Math.min(g.viewHeight-height,cy-height/2)),
  width,height};
}

const circle=(p,r,colour,caption)=>'<circle cx="'+p.x.toFixed(2)+'" cy="'+p.y.toFixed(2)+'" r="'+r+'" fill="none" stroke="'+colour+'" stroke-width="2.4" stroke-dasharray="6 4"/><text x="'+p.x.toFixed(2)+'" y="'+(p.y-r-6).toFixed(2)+'" fill="'+colour+'" paint-order="stroke" stroke="#12321d" stroke-width="3" font-size="11" font-weight="700" text-anchor="middle">'+safe(caption)+'</text>';
export function teachingOverlay({objects=[],previous=null,next=null,g,spotlightIds=[],ghostMode='off',ghostIds=[]}={}){
 if(!g?.toView)return '';
 const byId=new Map(objects.map(o=>[o.id,o]));
 const unique=ids=>[...new Set(ids)].filter(id=>byId.has(id)).slice(0,14);
 const spot=unique(spotlightIds),ghost=unique(ghostIds);
 let svg='';
 if(ghostMode!=='off'&&ghost.length){
  for(const id of ghost){
   if(['start','both'].includes(ghostMode)){
    const obj=previous?.objects?.find(o=>o.id===id);
    if(obj){const p=g.toView(obj.x,obj.y);svg+=circle(p,Math.max(13,g.scale?g.scale*.22:18),'#fce7a2','START')}
   }
   if(['next','both'].includes(ghostMode)){
    const obj=next?.objects?.find(o=>o.id===id);
    if(obj){const p=g.toView(obj.x,obj.y);svg+=circle(p,Math.max(13,g.scale?g.scale*.22:18),'#9eefff','NEXT')}
   }
  }
 }
 if(spot.length){
  const holes=spot.map(id=>{const p=g.toView(byId.get(id).x,byId.get(id).y);return '<circle cx="'+p.x+'" cy="'+p.y+'" r="38" fill="#000"/>'}).join('');
  const rings=spot.map(id=>{const p=g.toView(byId.get(id).x,byId.get(id).y);return '<circle cx="'+p.x+'" cy="'+p.y+'" r="39" fill="none" stroke="#e8ff9c" stroke-width="2.5" stroke-dasharray="6 5"/>'}).join('');
  svg='<defs><mask id="bb-spotlight-mask" maskUnits="userSpaceOnUse" x="-300" y="-300" width="'+(g.viewWidth+600)+'" height="'+(g.viewHeight+600)+'"><rect x="-300" y="-300" width="'+(g.viewWidth+600)+'" height="'+(g.viewHeight+600)+'" fill="#fff"/>'+holes+'</mask></defs>'+
   '<rect x="0" y="0" width="'+g.viewWidth+'" height="'+g.viewHeight+'" fill="#07190f" opacity=".66" mask="url(#bb-spotlight-mask)"/>'+rings+svg;
 }
 return svg?'<g class="bb-teaching-overlay" data-editor-only="true" pointer-events="none">'+svg+'</g>':'';
}
