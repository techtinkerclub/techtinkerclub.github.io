// Shared, editable non-contact action model. No inferred collision or tackle.
import {canCarry} from './possession.js?v=0.18.0';
export const CONE_COLORS=Object.freeze({orange:'#ff9b46',yellow:'#ffda78',red:'#f06c68',blue:'#65b8f8',green:'#91d78e',white:'#f5f5ed',purple:'#bf9af5'});
export const coneColor=name=>CONE_COLORS[name]||CONE_COLORS.yellow;
export const TAG_SIDES=['left','right'];
export const TAG_COLORS=Object.freeze({red:'#f15d62',blue:'#68baff',green:'#8bd67e',yellow:'#f5d56b'});
export const tagColor=key=>TAG_COLORS[key]||TAG_COLORS.yellow;
const text=s=>String(s??'').slice(0,120);
const tagItem=(item)=>item&&typeof item.targetId==='string'&&TAG_SIDES.includes(item.side)?{targetId:item.targetId,side:item.side,color:Object.hasOwn(TAG_COLORS,item.color)?item.color:'yellow'}:null;
const heldItems=object=>Array.isArray(object?.heldTagItems)?object.heldTagItems.map(tagItem).filter(Boolean).slice(0,12):[];
export function outstandingTagItems(frame){
 const ids=new Map((frame?.objects||[]).map(o=>[o.id,o]));
 return (frame?.objects||[]).filter(canCarry).flatMap(actor=>heldItems(actor).filter(item=>ids.get(item.targetId)?.tagBelt===true&&ids.get(item.targetId)?.tags?.[item.side]===false).map(item=>({actorId:actor.id,...item})));
}

export function sanitizeSkills(object){
 if(object.type==='cone')object.coneColor=Object.hasOwn(CONE_COLORS,object.coneColor)?object.coneColor:'yellow';
 if(canCarry(object)){
  if(object.tagBelt===true){
   object.tags={left:object.tags?.left!==false,right:object.tags?.right!==false};
   object.tagColor=Object.hasOwn(TAG_COLORS,object.tagColor)?object.tagColor:(['attacker','shield'].includes(object.type)?'yellow':'blue');
   object.heldTagItems=heldItems(object);
   object.heldTags=Math.max(object.heldTagItems.length,Math.min(12,Math.max(0,Math.floor(Number(object.heldTags)||0))));
  }else{delete object.tagBelt;delete object.tags;delete object.heldTags;delete object.tagColor;delete object.heldTagItems}
 }
 return object;
}
export function sanitizeInteractions(frame){
 const ids=new Map((frame.objects||[]).map(o=>[o.id,o]));
 frame.interactions=(Array.isArray(frame.interactions)?frame.interactions:[]).slice(0,12).filter(a=>
  a&&['touch','tag','tag-return'].includes(a.kind)&&typeof a.actorId==='string'&&typeof a.targetId==='string'&&a.actorId!==a.targetId&&ids.has(a.actorId)&&ids.has(a.targetId)&&canCarry(ids.get(a.actorId))&&
  (a.kind==='touch'||canCarry(ids.get(a.targetId)))&&
  (a.kind==='touch'||(TAG_SIDES.includes(a.side)&&ids.get(a.actorId).tagBelt===true&&ids.get(a.targetId).tagBelt===true))
 ).map(a=>({kind:a.kind,actorId:a.actorId,targetId:a.targetId,side:a.kind!=='touch'?a.side:undefined,at:Math.max(.1,Math.min(.95,Number(a.at)||.7)),label:text(a.label)}));
 if(!frame.interactions.length)delete frame.interactions;
 return frame;
}
export function skillIcon(object){
 if(object.type==='cone'||!canCarry(object)||object.tagBelt!==true)return '';
 const left=object.tags?.left!==false,right=object.tags?.right!==false,color=tagColor(object.tagColor),items=heldItems(object);
 const raised=items.length?'<path d="M9 -7 L19 -24" fill="none" stroke="#102e23" stroke-width="6" stroke-linecap="round"/>'+
 '<path d="M9 -7 L19 -24" fill="none" stroke="#eac7a0" stroke-width="3" stroke-linecap="round"/>'+
 '<rect x="17" y="-37" width="6" height="17" rx="2" fill="'+tagColor(items[items.length-1].color)+'" stroke="#fff" stroke-width="1"/>':'';
 return '<g class="tag-belt" pointer-events="none"><path d="M-10 4H10" stroke="#242c28" stroke-width="3"/>'+
 (left?'<rect x="-14" y="1" width="5" height="14" rx="1.5" fill="'+color+'" stroke="#fff" stroke-width=".7"/>':'')+
 (right?'<rect x="9" y="1" width="5" height="14" rx="1.5" fill="'+color+'" stroke="#fff" stroke-width=".7"/>':'')+
 raised+
 (object.heldTags?'<circle cx="0" cy="19" r="6" fill="#f5e8a4"/><text x="0" y="22" font-size="9" font-weight="700" fill="#242c28" text-anchor="middle">'+object.heldTags+'</text>':'')+'</g>';
}
export function timedSkillObjects(objects,previous,frame,progress){
 if(!previous||!Array.isArray(frame?.interactions)||progress>=1)return objects;
 const events=frame.interactions.filter(a=>a.kind==='tag'||a.kind==='tag-return').sort((a,b)=>a.at-b.at);
 if(!events.length)return objects;
 const prior=new Map(previous.objects.map(o=>[o.id,o])),affected=new Map();
 for(const event of events){
  for(const id of [event.targetId,event.actorId]){
   if(!affected.has(id)){
    const old=prior.get(id)||objects.find(o=>o.id===id);
    if(old)affected.set(id,{tagBelt:old.tagBelt,tags:old.tags?{...old.tags}:undefined,heldTags:Number(old.heldTags)||0,heldTagItems:heldItems(old)});
   }
  }
  if(progress>=event.at){
   const target=affected.get(event.targetId),actor=affected.get(event.actorId);
   if(event.kind==='tag'){
    if(target?.tags)target.tags[event.side]=false;
    if(actor){actor.heldTags=Math.min(12,actor.heldTags+1);actor.heldTagItems=[...actor.heldTagItems,{targetId:event.targetId,side:event.side,color:prior.get(event.targetId)?.tagColor||'yellow'}]}
   }else{
    if(target?.tags)target.tags[event.side]=true;
    if(actor){const i=actor.heldTagItems.findIndex(item=>item.targetId===event.targetId&&item.side===event.side);if(i>=0)actor.heldTagItems.splice(i,1);actor.heldTags=Math.max(0,actor.heldTags-1)}
   }
  }
 }
 return objects.map(o=>affected.has(o.id)?{...o,...affected.get(o.id)}:o);
}
export function interactionOverlay(frame,objects,g,progress=1,ink=false){
 if(!frame?.interactions?.length)return '';
 const positions=new Map(objects.map(o=>[o.id,o]));
 const safe=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 return '<g class="non-contact-actions" pointer-events="none">'+frame.interactions.filter(a=>progress>=a.at).map(a=>{
  const actor=positions.get(a.actorId),target=positions.get(a.targetId);if(!actor||!target)return '';
  const p=g.toView(actor.x,actor.y),q=g.toView(target.x,target.y);
  const taking=a.kind==='tag',returning=a.kind==='tag-return',tag=taking||returning,equipment=!canCarry(target);
  const label=taking?'TAG!':returning?'TAG RETURNED':a.label||(equipment?'TOUCH TARGET':'TWO-HAND TOUCH');
  const highlight=ink?'#555':taking?'#f3c368':returning?'#a9dd9d':equipment?'#8de3cc':'#a9d8ff';
  const width=Math.max(84,Math.min(230,label.length*7+25));
  const mid=taking?{x:p.x,y:p.y-59}:returning?{x:(p.x+q.x)/2,y:(p.y+q.y)/2-35}:{x:(p.x+q.x)/2,y:(p.y+q.y)/2-32};
  const raised=taking?'<path d="M'+(p.x+9)+' '+(p.y-7)+'L'+(p.x+18)+' '+(p.y-39)+'" stroke="'+(ink?'#444':'#f0d5b1')+'" stroke-width="5" stroke-linecap="round"/>'+
  '<rect x="'+(p.x+15)+'" y="'+(p.y-56)+'" width="7" height="18" rx="2" fill="'+tagColor(target.tagColor)+'" stroke="'+(ink?'#333':'#fff')+'" stroke-width="1"/>':'';
  const flash=tag?raised:'<circle cx="'+q.x+'" cy="'+q.y+'" r="'+(equipment?17:23)+'" fill="none" stroke="'+highlight+'" stroke-width="2.5" stroke-dasharray="'+(equipment?'3 4':'5 3')+'"/>';
  const note=taking&&a.label&&!/^tag( removed)?/i.test(a.label)?'<text x="'+mid.x+'" y="'+(mid.y+20)+'" font-size="10" fill="'+(ink?'#333':'#f3dcb3')+'" text-anchor="middle">'+safe(a.label)+'</text>':'';
  return '<path d="M'+p.x+' '+p.y+'L'+q.x+' '+q.y+'" stroke="'+highlight+'" stroke-width="2" stroke-dasharray="'+(tag?'3 5':'5 3')+'" fill="none"/>'+
   flash+
   '<rect x="'+(mid.x-width/2)+'" y="'+(mid.y-13)+'" width="'+width+'" height="25" rx="7" fill="'+(ink?'#fff':taking?'#463721':returning?'#203f32':equipment?'#153d36':'#233c51')+'" stroke="'+highlight+'" stroke-width="1.5"/>'+
   '<text x="'+mid.x+'" y="'+(mid.y+4)+'" fill="'+(ink?'#222':'#f7ffed')+'" text-anchor="middle" font-size="11" font-weight="700">'+safe(label)+'</text>'+note;
 }).join('')+'</g>';
}
export function ripOverlay(frame,previous,objects,g,progress=1,ink=false){
 if(!previous||!frame?.objects)return '';
 const current=new Map(frame.objects.map(o=>[o.id,o]));
 const positions=new Map(objects.map(o=>[o.id,o]));
 return frame.objects.filter(b=>b.type==='ball'&&b.transferKind==='rip'&&previous.objects.some(o=>o.id===b.id&&o.ownerId!==b.ownerId)&&progress*100>=(frame.timing?.[b.id]?.end??70)).map(ball=>{
  const holder=positions.get(ball.ownerId),oldBall=previous.objects.find(o=>o.id===ball.id);
  if(!holder||!oldBall)return '';
  const oldHolder=positions.get(oldBall.ownerId),v=g.toView(holder.x,holder.y);
  const text=String(ball.ripLabel||'RIP BALL').slice(0,100).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const w=Math.max(85,Math.min(210,text.length*7+18));
  const x=v.x,y=v.y-43;
  const colour=ink?'#444':'#efc989';
  return '<g class="ball-rip-cue" pointer-events="none">'+
   (oldHolder?'<circle cx="'+v.x+'" cy="'+v.y+'" r="27" stroke="'+colour+'" stroke-width="2" stroke-dasharray="2 5" fill="none"/>':'')+
   '<rect x="'+(x-w/2)+'" y="'+(y-12)+'" width="'+w+'" height="25" rx="6" fill="'+(ink?'#fff':'#44341f')+'" stroke="'+colour+'"/>'+
   '<text x="'+x+'" y="'+(y+4)+'" text-anchor="middle" fill="'+(ink?'#222':'#ffeac4')+'" font-size="11" font-weight="700">'+text+'</text></g>';
 }).join('');
}
export function addInteraction(frame,kind,actorId,targetId,side='left',label=''){
 const actor=frame.objects.find(o=>o.id===actorId),target=frame.objects.find(o=>o.id===targetId);
 if(!canCarry(actor)||!target||actorId===targetId)return {ok:false,message:'Choose a player and a different target.'};
 if(kind==='tag'||kind==='tag-return'){
  if(!canCarry(target)||target.tagBelt!==true||actor.tagBelt!==true)return {ok:false,message:'Both players must be wearing tag belts.'};
  if(!TAG_SIDES.includes(side))return {ok:false,message:'Choose left or right hip.'};
  if(kind==='tag'){
   if(actor.type===target.type&&['attacker','defender'].includes(actor.type))return {ok:false,message:'Choose an opponent to take the tag.'};
   if(actor.tags?.left===false||actor.tags?.right===false)return {ok:false,message:'Tagger must replace both of their own tags first.'};
   if(target.tags?.[side]===false)return {ok:false,message:'That tag has already been taken.'};
   if(!frame.objects.some(o=>o.type==='ball'&&o.ownerId===targetId))return {ok:false,message:'The tagged player must be carrying the ball.'};
   target.tags={left:target.tags?.left!==false,right:target.tags?.right!==false,[side]:false};
   actor.heldTagItems=[...heldItems(actor),{targetId,side,color:target.tagColor||'yellow'}];
   actor.heldTags=Math.min(12,(Number(actor.heldTags)||0)+1);
  }else{
   const i=heldItems(actor).findIndex(item=>item.targetId===targetId&&item.side===side);
   if(i<0)return {ok:false,message:'This player is not holding that player’s tag. Choose the correct tagger and recipient.'};
   if(target.tags?.[side]!==false)return {ok:false,message:'The strip is already attached to that hip.'};
   actor.heldTagItems=heldItems(actor);actor.heldTagItems.splice(i,1);
   actor.heldTags=Math.max(0,(Number(actor.heldTags)||0)-1);
   target.tags={...target.tags,[side]:true};
  }
 }
 if(!['tag','tag-return','touch'].includes(kind))return {ok:false,message:'Unsupported action.'};
 const entry={kind,actorId,targetId,side:kind==='touch'?undefined:side,at:.7,label:text(label)||(kind==='tag'?'TAG!':kind==='tag-return'?'Tag returned':'Touch')};
 frame.interactions=(frame.interactions||[]).concat(entry).slice(-12);
 return {ok:true,message:kind==='tag'?'TAG! Tagger raises the strip and calls TAG. Carrier stops and passes, then tagger returns the strip.':kind==='tag-return'?'Tag returned to the correct player and hip. Both player states updated; no ball possession changed.':'Touch recorded; no rugby tag or turnover created.'};
}
