// Scoped insertion only fills missing identities. Existing authored snapshots are never overwritten.
import {canCarry,carrier,isShield,shieldPose,carriedPose,findObject} from './possession.js?v=0.5.3';
export const insertable=o=>!!o&&!['tackle','ruck','maul','scrum','decision'].includes(o.type);
export function scopeIndices(frames,index,scope){return frames.map((_,i)=>i).filter(i=>scope==='all'||(scope==='onward'?i>=index:i===index))}
export function candidateCopy(frame,source,g){
 if(!insertable(source)||findObject(frame,source.id))return null;
 const copy=JSON.parse(JSON.stringify(source));
 delete copy.donutTacklerId;if(copy.type==='donut')copy.donutState='ready';delete copy.transferKind;delete copy.members;delete copy.breakdown;
 if(copy.type==='ball'||isShield(copy)){
  if(copy.ownerId){const p=carrier(frame,copy);
   if(!canCarry(p)||frame.objects.some(o=>o.type===copy.type&&o.ownerId===p.id))return null;
   Object.assign(copy,isShield(copy)?shieldPose(copy,p,g):carriedPose(copy,p,g));
  }else if(copy.groundState)delete copy.groundState;
 }else delete copy.ownerId;
 return copy;
}
export function fillMissing(frames,index,source,scope,g){
 const result={added:[],existing:0,skipped:0};
 for(const i of scopeIndices(frames,index,scope)){
  const f=frames[i];if(findObject(f,source.id)){result.existing++;continue}
  if(f.objects.length>=200){result.skipped++;continue}
  const copy=candidateCopy(f,source,g);if(!copy){result.skipped++;continue}
  f.objects.push(copy);result.added.push(i)
 }return result;
}
// Only change copies newly created by this insertion gesture; not pre-existing snapshots.
export function syncInsertedCopies(frames,indices,source,origin,g){
 let count=0,skipped=0;
 for(const i of indices){
  const f=frames[i],o=findObject(f,source.id);if(!o)continue;
  if(o.ownerId&&o.ownerId===source.ownerId)continue; // forward assignment already followed the carrier
  if(o.ownerId||Math.hypot(o.x-origin.x,o.y-origin.y)>1e-5||f.paths?.[o.id]?.points?.length||Object.hasOwn(f.timing||{},o.id))continue;
  if(source.ownerId&&(source.type==='ball'||isShield(source))){
   const p=carrier(f,source);if(!p||f.objects.some(x=>x.id!==o.id&&x.type===source.type&&x.ownerId===p.id)){f.objects=f.objects.filter(x=>x.id!==o.id);skipped++;continue}
   Object.assign(o,isShield(source)?shieldPose(source,p,g):carriedPose(source,p,g));delete o.transferKind;
  }else Object.assign(o,{x:source.x,y:source.y,rot:source.rot});
  count++
 }return {count,skipped};
}
