// A drill family is a set of independent, editable copies.
// Never alter the original when a coach creates a variation or continuation.
const copy=value=>JSON.parse(JSON.stringify(value));
const safe=value=>String(value??'').trim().slice(0,180);
export function readDerivation(raw,selfId=''){
 if(!raw||typeof raw!=='object')return null;
 const parentId=safe(raw.parentId),rootId=safe(raw.rootId)||parentId;
 if(!parentId||parentId===selfId||rootId===selfId)return null;
 return {parentId,rootId,parentTitle:safe(raw.parentTitle)||'Earlier drill',kind:raw.kind==='extension'?'extension':'variation'};
}
export function relationLabel(drill){
 const d=readDerivation(drill?.derivedFrom,drill?.id);
 return d?(d.kind==='extension'?'Extension of ':'Variation of ')+d.parentTitle:'';
}
export function deriveDrill(source,kind,newId){
 if(!source||!Array.isArray(source.frames)||!source.frames.length)throw Error('Open a drill before building a version.');
 if(!['variation','extension'].includes(kind))throw Error('Choose a variation or an extension.');
 const id=safe(newId);if(!id||id===source.id)throw Error('A new drill needs a unique ID.');
 if(kind==='extension'&&source.frames.length>=150)throw Error('Maximum of 150 steps reached.');
 const result=copy(source),parent=readDerivation(source.derivedFrom,source.id);
 result.id=id;
 result.title=safe(source.title)+(kind==='extension'?' · extension':' · variation');
 result.derivedFrom={parentId:safe(source.id),rootId:parent?.rootId||safe(source.id),parentTitle:safe(source.title),kind};
 delete result.savedAt;
 if(kind==='extension'){
  const next=copy(result.frames[result.frames.length-1]);
  next.name='New stage';next.seconds=2;next.notes='';next.timing={};next.paths={};
  delete next.guide;
  next.objects=(next.objects||[]).filter(o=>o.type!=='decision').map(o=>{
   delete o.posePinned;
   if(o.type==='ball')delete o.transferKind;
   return o;
  });
  result.frames.push(next);
 }
 return result;
}
// Importing a backup assigns fresh IDs. Remap parent/root links within
// that backup too; links to starter drills or external parents remain unchanged.
export function rekeyImportedFamilies(drills,makeId){
 const map=new Map();
 for(const d of drills)map.set(d.id,makeId());
 return drills.map(d=>{
  const item=copy(d);item.id=map.get(d.id);
  const rel=readDerivation(item.derivedFrom,d.id);
  if(rel)item.derivedFrom={...rel,parentId:map.get(rel.parentId)||rel.parentId,rootId:map.get(rel.rootId)||rel.rootId};
  else delete item.derivedFrom;
  return item;
 });
}
