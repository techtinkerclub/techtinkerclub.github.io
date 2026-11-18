// Shared, editable non-contact action model. No inferred collision or tackle.
import {canCarry} from './possession.js?v=0.18.0';
export const CONE_COLORS=Object.freeze({orange:'#ff9b46',yellow:'#ffda78',red:'#f06c68',blue:'#65b8f8',green:'#91d78e',white:'#f5f5ed',purple:'#bf9af5'});
export const coneColor=name=>CONE_COLORS[name]||CONE_COLORS.yellow;
export const TAG_SIDES=['left','right'];
const text=s=>String(s??'').slice(0,120);
export function sanitizeSkills(object){
 if(object.type==='cone')object.coneColor=Object.hasOwn(CONE_COLORS,object.coneColor)?object.coneColor:'yellow';
 if(canCarry(object)){
  if(object.tagBelt===true){
   object.tags={left:object.tags?.left!==false,right:object.tags?.right!==false};
   object.heldTags=Math.max(0,Math.min(12,Math.floor(Number(object.heldTags)||0)));
  }else{delete object.tagBelt;delete object.tags;delete object.heldTags}
 }
 return object;
}
export function sanitizeInteractions(frame){
 const ids=new Map((frame.objects||[]).map(o=>[o.id,o]));
 frame.interactions=(Array.isArray(frame.interactions)?frame.interactions:[]).slice(0,12).filter(a=>
  a&&['touch','tag'].includes(a.kind)&&typeof a.actorId==='string'&&typeof a.targetId==='string'&&a.actorId!==a.targetId&&ids.has(a.actorId)&&ids.has(a.targetId)&&canCarry(ids.get(a.actorId))&&
  (a.kind==='touch'||canCarry(ids.get(a.targetId)))&&
  (a.kind!=='tag'||TAG_SIDES.includes(a.side))
 ).map(a=>({kind:a.kind,actorId:a.actorId,targetId:a.targetId,side:a.kind==='tag'?a.side:undefined,at:Math.max(.1,Math.min(.95,Number(a.at)||.7)),label:text(a.label)}));
 if(!frame.interactions.length)delete frame.interactions;
 return frame;
}
export function skillIcon(object){
 if(object.type==='cone')return '';
 if(!canCarry(object)||object.tagBelt!==true)return '';
 const left=object.tags?.left!==false,right=object.tags?.right!==false;
 return '<g class="tag-belt" pointer-events="none"><path d="M-10 4H10" stroke="#242c28" stroke-width="3"/>'+
 (left?'<rect x="-14" y="1" width="5" height="14" rx="1.5" fill="#f15d62" stroke="#fff" stroke-width=".7"/>':'')+
 (right?'<rect x="9" y="1" width="5" height="14" rx="1.5" fill="#68baff" stroke="#fff" stroke-width=".7"/>':'')+
 (object.heldTags?'<circle cx="0" cy="19" r="6" fill="#f5e8a4"/><text x="0" y="22" font-size="9" font-weight="700" fill="#242c28" text-anchor="middle">'+object.heldTags+'</text>':'')+'</g>';
}
export function timedSkillObjects(objects,previous,frame,progress){
 if(!previous||!Array.isArray(frame?.interactions)||progress>=1)return objects;
 const prior=new Map(previous.objects.map(o=>[o.id,o]));
 const hold=new Set();
 for(const event of frame.interactions)if(event.kind==='tag'&&progress<event.at){hold.add(event.targetId);hold.add(event.actorId)}
 if(!hold.size)return objects;
 return objects.map(o=>{
  if(!hold.has(o.id)||!prior.has(o.id))return o;
  const before=prior.get(o.id);
  return {...o,tagBelt:before.tagBelt,tags:before.tags?{...before.tags}:undefined,heldTags:before.heldTags};
 });
}
export function interactionOverlay(frame,objects,g,progress=1,ink=false){
 if(!frame?.interactions?.length)return '';
 const positions=new Map(objects.map(o=>[o.id,o]));
 const safe=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 return '<g class="non-contact-actions" pointer-events="none">'+frame.interactions.filter(a=>progress>=a.at).map(a=>{
  const actor=positions.get(a.actorId),target=positions.get(a.targetId);if(!actor||!target)return '';
  const p=g.toView(actor.x,actor.y),q=g.toView(target.x,target.y);
  const label=a.label|| (a.kind==='tag'?'TAG '+a.side.toUpperCase():'TOUCH');
  const mid={x:(p.x+q.x)/2,y:(p.y+q.y)/2-22};
  const width=Math.max(58,Math.min(190,label.length*7+20));
  return '<path d="M'+p.x+' '+p.y+' L'+q.x+' '+q.y+'" stroke="'+(ink?'#444':'#d2f58a')+'" stroke-width="2" stroke-dasharray="4 4" fill="none"/>'+
   '<rect x="'+(mid.x-width/2)+'" y="'+(mid.y-12)+'" width="'+width+'" height="23" rx="6" fill="'+(ink?'#fff':'#20382b')+'" stroke="'+(ink?'#333':'#d2f58a')+'"/>'+
   '<text x="'+mid.x+'" y="'+(mid.y+4)+'" fill="'+(ink?'#222':'#f4ffd8')+'" text-anchor="middle" font-size="11" font-weight="700">'+safe(label)+'</text>';
 }).join('')+'</g>';
}
export function addInteraction(frame,kind,actorId,targetId,side='left',label=''){
 const actor=frame.objects.find(o=>o.id===actorId),target=frame.objects.find(o=>o.id===targetId);
 if(!canCarry(actor)||!target||actorId===targetId)return {ok:false,message:'Choose a player and a different target.'};
 if(kind==='tag'){
  if(!canCarry(target)||target.tagBelt!==true)return {ok:false,message:'The ball carrier must be wearing a tag belt.'};
  if(actor.tagBelt!==true)return {ok:false,message:'The tagger needs an equipped tag belt.'};
  if(target.tags?.[side]===false)return {ok:false,message:'That tag has already been removed. Choose the other side or reset the belt.'};
  if(!frame.objects.some(o=>o.type==='ball'&&o.ownerId===targetId))return {ok:false,message:'Tag removal requires the target to be carrying the ball.'};
  target.tags={left:target.tags?.left!==false,right:target.tags?.right!==false,[side]:false};
  actor.heldTags=Math.min(12,(Number(actor.heldTags)||0)+1);
 }
 if(kind!=='tag'&&kind!=='touch')return {ok:false,message:'Unsupported action.'};
 const entry={kind,actorId,targetId,at:.7,label:text(label)||(kind==='tag'?'Tag removed · '+side:'Touch')};
 frame.interactions=(frame.interactions||[]).concat(entry).slice(-12);
 return {ok:true,message:kind==='tag'?'Tag removed. Carrier stays standing. Create a separate pass or stop/restart step.':'Touch cue recorded. No tackle or possession change was created.'};
}
