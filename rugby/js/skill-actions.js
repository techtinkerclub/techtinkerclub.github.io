// Shared, editable non-contact action model. No inferred collision or tackle.
import {canCarry} from './possession.js?v=0.18.0';
export const CONE_COLORS=Object.freeze({orange:'#ff9b46',yellow:'#ffda78',red:'#f06c68',blue:'#65b8f8',green:'#91d78e',white:'#f5f5ed',purple:'#bf9af5'});
export const coneColor=name=>CONE_COLORS[name]||CONE_COLORS.yellow;
export const TAG_SIDES=['left','right'];
export const TAG_COLORS=Object.freeze({red:'#f15d62',blue:'#68baff',green:'#8bd67e',yellow:'#f5d56b'});
export const tagColor=key=>TAG_COLORS[key]||TAG_COLORS.yellow;
const text=s=>String(s??'').slice(0,120);
export function sanitizeSkills(object){
 if(object.type==='cone')object.coneColor=Object.hasOwn(CONE_COLORS,object.coneColor)?object.coneColor:'yellow';
 if(canCarry(object)){
  if(object.tagBelt===true){
   object.tags={left:object.tags?.left!==false,right:object.tags?.right!==false};
   object.tagColor=Object.hasOwn(TAG_COLORS,object.tagColor)?object.tagColor:(['attacker','shield'].includes(object.type)?'yellow':'blue');
   object.heldTags=Math.max(0,Math.min(12,Math.floor(Number(object.heldTags)||0)));
  }else{delete object.tagBelt;delete object.tags;delete object.heldTags;delete object.tagColor}
 }
 return object;
}
export function sanitizeInteractions(frame){
 const ids=new Map((frame.objects||[]).map(o=>[o.id,o]));
 frame.interactions=(Array.isArray(frame.interactions)?frame.interactions:[]).slice(0,12).filter(a=>
  a&&['touch','tag'].includes(a.kind)&&typeof a.actorId==='string'&&typeof a.targetId==='string'&&a.actorId!==a.targetId&&ids.has(a.actorId)&&ids.has(a.targetId)&&canCarry(ids.get(a.actorId))&&
  (a.kind==='touch'||canCarry(ids.get(a.targetId)))&&
  (a.kind!=='tag'||(TAG_SIDES.includes(a.side)&&ids.get(a.actorId).tagBelt===true&&ids.get(a.targetId).tagBelt===true))
 ).map(a=>({kind:a.kind,actorId:a.actorId,targetId:a.targetId,side:a.kind==='tag'?a.side:undefined,at:Math.max(.1,Math.min(.95,Number(a.at)||.7)),label:text(a.label)}));
 if(!frame.interactions.length)delete frame.interactions;
 return frame;
}
export function skillIcon(object){
 if(object.type==='cone')return '';
 if(!canCarry(object)||object.tagBelt!==true)return '';
 const left=object.tags?.left!==false,right=object.tags?.right!==false,color=tagColor(object.tagColor);
 return '<g class="tag-belt" pointer-events="none"><path d="M-10 4H10" stroke="#242c28" stroke-width="3"/>'+
 (left?'<rect x="-14" y="1" width="5" height="14" rx="1.5" fill="'+color+'" stroke="#fff" stroke-width=".7"/>':'')+
 (right?'<rect x="9" y="1" width="5" height="14" rx="1.5" fill="'+color+'" stroke="#fff" stroke-width=".7"/>':'')+
 (object.heldTags?'<circle cx="0" cy="19" r="6" fill="#f5e8a4"/><text x="0" y="22" font-size="9" font-weight="700" fill="#242c28" text-anchor="middle">'+object.heldTags+'</text>':'')+'</g>';
}
export function timedSkillObjects(objects,previous,frame,progress){
 if(!previous||!Array.isArray(frame?.interactions)||progress>=1)return objects;
 const events=frame.interactions.filter(a=>a.kind==='tag').sort((a,b)=>a.at-b.at);
 if(!events.length)return objects;
 const prior=new Map(previous.objects.map(o=>[o.id,o]));
 const affected=new Map();
 for(const event of events){
  for(const id of [event.targetId,event.actorId]){
   if(!affected.has(id)){
    const original=prior.get(id)||objects.find(o=>o.id===id);
    if(original)affected.set(id,{tagBelt:original.tagBelt,tags:original.tags?{...original.tags}:undefined,heldTags:Number(original.heldTags)||0});
   }
  }
  if(progress>=event.at){
   const target=affected.get(event.targetId),actor=affected.get(event.actorId);
   if(target?.tags)target.tags[event.side]=false;
   if(actor)actor.heldTags=Math.min(12,actor.heldTags+1);
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
  const p=g.toView(actor.x,actor.y),q=g.toView(target.x,target.y),tag=a.kind==='tag',equipment=!canCarry(target);
  const label=a.label||(tag?'TAG!':equipment?'TOUCH TARGET':'TWO-HAND TOUCH');
  const highlight=ink?'#555':tag?'#f3c368':equipment?'#8de3cc':'#a9d8ff';
  const width=Math.max(84,Math.min(230,label.length*7+25));
  const mid={x:(p.x+q.x)/2,y:(p.y+q.y)/2-32};
  const flash=tag?'<rect x="'+(p.x+12)+'" y="'+(p.y-22)+'" width="7" height="18" rx="2" fill="'+tagColor(target.tagColor)+'" stroke="'+(ink?'#333':'#fff')+'" stroke-width="1"/>'
   :'<circle cx="'+q.x+'" cy="'+q.y+'" r="'+(equipment?17:23)+'" fill="none" stroke="'+highlight+'" stroke-width="2.5" stroke-dasharray="'+(equipment?'3 4':'5 3')+'"/>';
  return '<path d="M'+p.x+' '+p.y+' L'+q.x+' '+q.y+'" stroke="'+highlight+'" stroke-width="2" stroke-dasharray="'+(tag?'3 5':'5 3')+'" fill="none"/>'+
   flash+
   '<rect x="'+(mid.x-width/2)+'" y="'+(mid.y-13)+'" width="'+width+'" height="25" rx="7" fill="'+(ink?'#fff':tag?'#463721':equipment?'#153d36':'#233c51')+'" stroke="'+highlight+'" stroke-width="1.5"/>'+
   '<text x="'+mid.x+'" y="'+(mid.y+4)+'" fill="'+(ink?'#222':'#f7ffed')+'" text-anchor="middle" font-size="11" font-weight="700">'+safe(label)+'</text>';
 }).join('')+'</g>';
}
export function addInteraction(frame,kind,actorId,targetId,side='left',label=''){
 const actor=frame.objects.find(o=>o.id===actorId),target=frame.objects.find(o=>o.id===targetId);
 if(!canCarry(actor)||!target||actorId===targetId)return {ok:false,message:'Choose a player and a different target.'};
 if(kind==='tag'){
  if(!canCarry(target)||target.tagBelt!==true)return {ok:false,message:'The ball carrier must be wearing a tag belt.'};
  if(actor.tagBelt!==true)return {ok:false,message:'For RFU U7/U8 games, both players must have properly equipped tag belts.'};
  if(actor.type===target.type&&['attacker','defender'].includes(actor.type))return {ok:false,message:'Choose a player on the opposing team to take the tag.'};
  if(actor.tags?.left===false||actor.tags?.right===false)return {ok:false,message:'The tagger must replace both tags before rejoining play.'};
  if(target.tags?.[side]===false)return {ok:false,message:'That tag has already been removed. Choose the other side or reset the belt.'};
  if(!frame.objects.some(o=>o.type==='ball'&&o.ownerId===targetId))return {ok:false,message:'Tag removal requires the target to be carrying the ball.'};
  target.tags={left:target.tags?.left!==false,right:target.tags?.right!==false,[side]:false};
  actor.heldTags=Math.min(12,(Number(actor.heldTags)||0)+1);
 }
 if(kind!=='tag'&&kind!=='touch')return {ok:false,message:'Unsupported action.'};
 const entry={kind,actorId,targetId,at:.7,label:text(label)||(kind==='tag'?'Tag removed · '+side:'Touch')};
 frame.interactions=(frame.interactions||[]).concat(entry).slice(-12);
 return {ok:true,message:kind==='tag'?'Tag removed. Carrier must stop and pass within three seconds/approximately three strides; tagger calls TAG and returns the strip before rejoining. Author the pass and return separately.':'Touch recorded. No tag, tackle or automatic possession change was created.'};
}
