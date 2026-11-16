// A single transactional setup operation, shared by the editor and tests.
import {pitchSettings,resizeDrill} from './drill-edit.js?v=0.9.0';
import {PRESETS,presetPositions} from './presets.js?v=0.6.0';
const ages={'U6–U8':[6,8],'U9':[9,9],'U10':[10,10],'U11–U12':[11,12],'U13–U14':[13,14],'U15–U16':[15,16],'All ages':[6,16]};
const categories=['Attack','Defence','Handling','Contact','Breakdown','Set piece','Movement','Game'];
const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
export function ageLabel(min,max){return Object.keys(ages).find(k=>ages[k][0]===min&&ages[k][1]===max)||'Custom range'}
export function normaliseAge(d){
 const fallback=ages[d.age]||[6,16];
 const min=int(d.ageMin,6,16)?d.ageMin:fallback[0];
 const max=int(d.ageMax,min,16)?d.ageMax:Math.max(min,fallback[1]);
 return {age:ageLabel(min,max),ageMin:min,ageMax:max};
}
export function setupValues(d){
 const p=pitchSettings(d);
 return {title:d.title||'',...normaliseAge(d),category:categories.includes(d.category)?d.category:'Attack',minutes:d.minutes??8,length:d.length,width:d.width,attackDirection:p.showAttack?p.attackDirection:'hidden',boundary:p.boundary,preset:'',markers:'keep',resizeMode:'relative'};
}
export function setupAge(age){return ages[age]||null}
export function prepareSetup(d,v,makeId){
 const title=String(v.title||'').trim(),minutes=Number(v.minutes),range=ages[v.age]||[Number(v.ageMin),Number(v.ageMax)];
 const fail=message=>({ok:false,message});
 if(!title)return fail('Enter a drill name.');
 if(!int(minutes,1,120))return fail('Duration must be a whole number from 1 to 120 minutes.');
 if(!int(range[0],6,16)||!int(range[1],range[0],16))return fail('Choose a valid age range from U6 to U16.');
 if(!categories.includes(v.category))return fail('Choose a drill category.');
 if(!['up','right','down','left','hidden'].includes(v.attackDirection)||!['line','cones','flags','none'].includes(v.boundary))return fail('Choose valid pitch markings.');
 const preset=PRESETS.find(p=>p.id===v.preset);
 if(['cone','flag'].includes(v.markers)&&!preset)return fail('Choose a layout preset before generating its practice markers.');
 const resized=resizeDrill(d,Number(v.length),Number(v.width),v.resizeMode);
 if(!resized.ok)return resized;
 const next=resized.drill;
 Object.assign(next,{title,age:ageLabel(...range),ageMin:range[0],ageMax:range[1],minutes,category:v.category,attackDirection:v.attackDirection==='hidden'?pitchSettings(d).attackDirection:v.attackDirection,showAttack:v.attackDirection!=='hidden',boundary:v.boundary});
 let removed=0,added=0;
 if(v.markers!=='keep'){
  for(const f of next.frames){
   const gone=new Set(f.objects.filter(o=>o.layoutMarker===true&&['cone','flag'].includes(o.type)).map(o=>o.id));
   removed+=gone.size;f.objects=f.objects.filter(o=>!gone.has(o.id));
   for(const id of gone){if(f.paths)delete f.paths[id];if(f.timing)delete f.timing[id]}
  }
  // Corner markers are controlled by Pitch boundary, not by preset equipment.
  const points=['cone','flag'].includes(v.markers)?presetPositions(preset).filter(p=>!([42,858].includes(p.x)&&[37,503].includes(p.y))):[];
  const missing=(f,q)=>!f.objects.some(o=>['cone','flag'].includes(o.type)&&Math.hypot(o.x-q.x,o.y-q.y)<.1);
  if(next.frames.some(f=>f.objects.length+points.filter(q=>missing(f,q)).length>200))return fail('This layout would exceed the 200-object limit per step.');
  for(const q of points){const id=makeId();for(const f of next.frames){if(!missing(f,q))continue;f.objects.push({id,type:v.markers,label:'',...q,layoutMarker:true});added++}}
 }
 return {ok:true,drill:next,added,removed};
}
