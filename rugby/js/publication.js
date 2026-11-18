// Public catalogue publication layer. Preserve legacy seed IDs so existing links survive.
// Every published payload is a normal, reproducible drill copied from GitHub saved work.
export function validatePublications(data){
 if(data?.version!==1||data.kind!=='rugby-public-overrides'||!Array.isArray(data.drills)||!Array.isArray(data.unpublishedIds))throw Error('Invalid publication index.');
 const ids=new Set(),sources=new Set();
 for(const d of data.drills){
  if(!/^seed-\d{3,}$/.test(d?.id)||ids.has(d.id)||typeof d.savedFromCoachDrill!=='string'||sources.has(d.savedFromCoachDrill)||!Array.isArray(d.frames)||!d.frames.length)throw Error('Invalid or duplicate published drill.');
  ids.add(d.id);sources.add(d.savedFromCoachDrill);
 }
 for(const id of data.unpublishedIds)if(!ids.has(id))throw Error('Unpublish entry lacks an archived drill: '+id);
 if(new Set(data.unpublishedIds).size!==data.unpublishedIds.length)throw Error('Duplicate unpublish marker.');
 return data;
}
export function applyPublications(base,overrides){
 const publications=validatePublications(overrides),hidden=new Set(publications.unpublishedIds);
 const mapped=new Map(publications.drills.map(d=>[d.id,d]));
 const originals=new Set(base.map(d=>d.id));
 const merged=base.map(d=>mapped.get(d.id)||d).filter(d=>!hidden.has(d.id));
 for(const d of publications.drills)if(!originals.has(d.id)&&!hidden.has(d.id))merged.push(d);
 return merged;
}
export function publicationForSource(data,id){
 return data?.drills?.find(d=>d.savedFromCoachDrill===id)||null;
}
export function isPublished(data,id){
 const d=publicationForSource(data,id);
 return !!d&&!data.unpublishedIds.includes(d.id);
}
export async function loadPublicationData(fetcher=fetch){
 const url=new URL('../data/published-drills.json?fresh='+Date.now(),import.meta.url);
 const res=await fetcher(url,{cache:'no-store'});
 if(!res.ok)throw Error('Public publication index could not load (HTTP '+res.status+').');
 return validatePublications(await res.json());
}
