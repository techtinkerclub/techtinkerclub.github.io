// Drill lineage and publication helpers shared by the editor and tests.
// A revision keeps the same ID. A separate variation or extension gets a new ID.
export function familyRoot(d){
 const rel=d?.derivedFrom;
 return typeof rel?.rootId==='string'&&rel.rootId&&rel.rootId!==d?.id?rel.rootId:d?.id;
}
export function familyMembers(items,rootId){
 return items.filter(item=>familyRoot(item.d||item)===rootId).sort((a,b)=>{
  const x=a.d||a,y=b.d||b;
  return Number(!!x.derivedFrom)-Number(!!y.derivedFrom)||
    String(x.title).localeCompare(String(y.title),'en');
 });
}
export function publicationState(drill,source,publicIds){
 if(source==='seed'||publicIds.has(drill.id))return 'Published in coaching library';
 if(source==='github')return 'Saved on GitHub · not in curated library';
 if(source==='import')return 'Imported · not saved or published';
 return 'Local draft · not published';
}
export function duplicateTitleGroups(entries){
 const groups=new Map();
 for(const entry of entries){
  const d=entry.d||entry;
  const key=String(d.title||'').trim().normalize('NFKD').toLocaleLowerCase('en-GB');
  if(!key)continue;
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(d.id);
 }
 return [...groups.values()].filter(ids=>new Set(ids).size>1);
}
export function revisionLabel(d){return 'Revision '+Math.max(1,Number(d.revision)||1)}
export function changedRevision(previous,next){
 if(!next)return false;
 if(!previous)return true;
 const clean=d=>{const x=structuredClone(d);delete x.savedAt;delete x.revision;return x};
 return JSON.stringify(clean(previous))!==JSON.stringify(clean(next));
}
