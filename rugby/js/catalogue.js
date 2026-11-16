// The read-only library and player share the same curated catalogue, not browser storage.
export const CATEGORIES=['Attack','Defence','Handling','Contact','Breakdown','Set piece','Movement','Game'];
export const FORMATS=['animated','card','rules'];
export const isAnimated=d=>Array.isArray(d.frames)&&d.frames.length>1;
export const isRules=d=>String(d.title).startsWith('Understand the game ·');
export function ageLabel(d){return d.ageMin===d.ageMax?'U'+d.ageMin:'U'+d.ageMin+'–U'+d.ageMax}
export function readFilters(input){
 const p=new URLSearchParams(input),age=Number(p.get('age')),category=p.get('category'),format=p.get('format'),sort=p.get('sort');
 return {q:(p.get('q')||'').trim().slice(0,160),age:Number.isInteger(age)&&age>=6&&age<=16?String(age):'',category:CATEGORIES.includes(category)?category:'',format:FORMATS.includes(format)?format:'',sort:['title','duration'].includes(sort)?sort:'featured'};
}
export function filterParams(f){
 const p=new URLSearchParams();for(const k of ['q','age','category','format','sort'])if(f[k]&&!(k==='sort'&&f[k]==='featured'))p.set(k,f[k]);return p;
}
const normal=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[–—−]/g,'-');
export function filterDrills(drills,f){
 const terms=normal(f.q).split(/\s+/).filter(Boolean);
 const result=drills.filter(d=>{
  if(f.age&&!(d.ageMin<=Number(f.age)&&d.ageMax>=Number(f.age)))return false;
  if(f.category&&d.category!==f.category)return false;
  if(f.format==='animated'&&!isAnimated(d)||f.format==='card'&&isAnimated(d)||f.format==='rules'&&!isRules(d))return false;
  const hay=normal([d.title,d.category,d.objective,d.equipment,d.players,d.instructions,d.coaching,d.notes,ageLabel(d),...(d.frames||[]).map(x=>x.name+' '+x.notes)].join(' '));
  return terms.every(t=>hay.includes(t));
 });
 if(f.sort==='title')result.sort((a,b)=>a.title.localeCompare(b.title,'en'));
 else if(f.sort==='duration')result.sort((a,b)=>Number(a.minutes)-Number(b.minutes)||a.title.localeCompare(b.title,'en'));
 else result.sort((a,b)=>Number(isAnimated(b))-Number(isAnimated(a)));
 return result;
}
export function libraryHref(f){const p=filterParams(f).toString();return './library.html'+(p?'?'+p:'')}
export function drillHref(id,f={}){const p=filterParams(f);p.set('drill',id);return './play.html?'+p.toString()}
export async function loadCatalogue(fetcher=fetch){
 const res=await fetcher(new URL('../data/drills.json?v=0.10.3',import.meta.url),{cache:'no-cache'});
 if(!res.ok)throw Error('The library could not load (HTTP '+res.status+').');
 const data=await res.json();if(data?.version!==1||!Array.isArray(data.drills)||!data.drills.length)throw Error('The drill catalogue is unavailable.');
 const ids=new Set();for(const d of data.drills){if(!/^seed-\d{3,}$/.test(d.id)||ids.has(d.id)||!Array.isArray(d.frames)||!d.frames.length)throw Error('The catalogue contains an invalid entry.');ids.add(d.id)}
 return data.drills;
}
export async function copyText(s){
 try{await navigator.clipboard.writeText(s);return true}catch{return false}
}
export function feedbackText(d,url){
 const title=d?d.title:'Rugby Coaching Library';
 return title+'\n'+url+'\n\nWhat works well?\n\nWhat is unclear or difficult to use?\n\nAny coaching, age-grade or safety corrections?\n\nOther suggestions:\n';
}
