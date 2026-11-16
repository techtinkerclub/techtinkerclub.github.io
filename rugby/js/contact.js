// Schematic formation presets, not coaching technique or an age-grade law validator.
import {canCarry,carrier} from './possession.js?v=0.5.0';
const CONTACTS={tackle:{title:'Tackle',min:2,max:2,color:'#fa9e91'},ruck:{title:'Ruck',min:2,max:6,color:'#f7d27a'},maul:{title:'Maul',min:3,max:6,color:'#c8b0f5'},scrum:{title:'Scrum',min:4,max:6,color:'#91dbce'}};
export const contactType=t=>Object.hasOwn(CONTACTS,t);
export const contactTitle=t=>CONTACTS[t]?.title||'Contact';
export function contactCandidates(frame,marker,g,radius=95){
 const p=g.toView(marker.x,marker.y);
 return frame.objects.filter(o=>canCarry(o)).map(o=>{const q=g.toView(o.x,o.y);return {o,d:Math.hypot(q.x-p.x,q.y-p.y)}}).filter(x=>x.d<=radius).sort((a,b)=>a.d-b.d).map(x=>x.o);
}
export function cleanContacts(frames){
 for(const frame of frames){
  const ids=new Set(frame.objects.filter(canCarry).map(o=>o.id));
  for(const o of frame.objects){if(!contactType(o.type)){delete o.members;continue}
   if(Array.isArray(o.members)){const seen=new Set();o.members=o.members.filter(m=>m&&ids.has(m.id)&&!seen.has(m.id)&&['grounded','tackling','bound','crouched'].includes(m.pose)&&seen.add(m.id)).slice(0,6)}
  }
 }
 return frames;
}
export function arrangeContact(frame,marker,g,previous=null,explicit=null){
 if(!contactType(marker.type))return {ok:false,message:'Select a contact marker.'};
 const spec=CONTACTS[marker.type],near=explicit?explicit.map(id=>frame.objects.find(o=>o.id===id)).filter(canCarry):contactCandidates(frame,marker,g);
 const unique=[...new Map(near.map(o=>[o.id,o])).values()];
 if(unique.length<spec.min)return {ok:false,message:'Move '+spec.min+' or more players near the '+spec.title.toLowerCase()+' marker first.'};
 const own=(fr)=>fr?.objects.filter(o=>o.type==='ball').map(b=>carrier(fr,b)?.id)||[];
 const carrierId=[...own(previous),...own(frame)].find(id=>unique.some(o=>o.id===id));
 const lead=unique.find(o=>o.id===carrierId)||unique[0],rest=unique.filter(o=>o.id!==lead.id),opponent=rest.find(o=>o.type!==lead.type&&['attacker','defender'].includes(o.type))||rest[0];
 const players=[lead,opponent,...rest.filter(o=>o.id!==opponent?.id)].filter(Boolean).slice(0,spec.max);
 let offsets=[];
 if(marker.type==='tackle')offsets=[{x:0,y:12,r:90,pose:'grounded'},{x:0,y:-12,r:180,pose:'tackling'}];
 else if(marker.type==='ruck')offsets=[{x:0,y:0,r:90,pose:'grounded'},...players.slice(1).map((_,i)=>({x:(i%2?1:-1)*(i>1?25:15),y:i%2?23:-23,r:i%2?0:180,pose:'bound'}))];
 else if(marker.type==='maul')offsets=players.map((_,i)=>({x:Math.sin(i*2*Math.PI/players.length)*26,y:-Math.cos(i*2*Math.PI/players.length)*26,r:i*360/players.length+180,pose:'bound'}));
 else {const teamA=players.filter(o=>o.type===lead.type),teamB=players.filter(o=>o.type!==lead.type);const balanced=teamA.length>=2&&teamB.length>=2;if(balanced)players.splice(0,players.length,...teamA.slice(0,3),...teamB.slice(0,3));const split=balanced?Math.min(3,teamA.length):Math.ceil(players.length/2);offsets=players.map((_,i)=>{const top=i>=split,j=top?i-split:i,count=top?players.length-split:split;return {x:(j-(count-1)/2)*27,y:top?-20:20,r:top?180:0,pose:'crouched'}})}
 const a=((Number(lead.rot)||0)+g.rotation)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);const p=g.toView(marker.x,marker.y);
 const placements=offsets.map(v=>({...v,dx:v.x*c-v.y*s,dy:v.x*s+v.y*c}));
 const minX=Math.min(...placements.map(v=>v.dx)),maxX=Math.max(...placements.map(v=>v.dx)),minY=Math.min(...placements.map(v=>v.dy)),maxY=Math.max(...placements.map(v=>v.dy));
 const clampCenter=(v,lo,hi)=>lo<=hi?Math.max(lo,Math.min(hi,v)):(lo+hi)/2;
 const cx=clampCenter(p.x,g.margin+16-minX,g.margin+g.fw-16-maxX),cy=clampCenter(p.y,g.margin+16-minY,g.margin+g.fh-16-maxY);
 Object.assign(marker,g.fromView(cx,cy));marker.members=[];
 // Remove selected players from other formations in this step.
 const chosen=new Set(players.map(o=>o.id));for(const o of frame.objects)if(o!==marker&&Array.isArray(o.members))o.members=o.members.filter(m=>!chosen.has(m.id));
 players.forEach((o,i)=>{const v=placements[i];Object.assign(o,g.fromView(cx+v.dx,cy+v.dy),{rot:((lead.rot+v.r)%360+360)%360});marker.members.push({id:o.id,pose:v.pose});if(frame.paths?.[o.id])frame.paths[o.id].follow=false});
 return {ok:true,count:players.length,message:spec.title+' formation arranged · '+players.length+' players.'};
}
export function posesFor(objects){const map=new Map();for(const marker of objects)if(contactType(marker.type))for(const m of marker.members||[])map.set(m.id,m.pose);return map}
export function posedShape(o,pose,normal,color){
 if(!pose)return normal;
 if(pose==='grounded')return '<rect x="-12" y="-23" width="24" height="46" rx="11" fill="'+color+'" stroke="#102e23" stroke-width="2.4"/><circle cy="-16" r="8" fill="'+color+'" stroke="#102e23" stroke-width="1.5"/><path d="M-9 3H9" stroke="#102e23" stroke-width="1.4"/>';
 if(pose==='tackling')return '<ellipse rx="12" ry="20" fill="'+color+'" stroke="#102e23" stroke-width="2.4"/><path d="M-10 -8L-17 -15M10 -8L17 -15" stroke="'+color+'" stroke-width="5" stroke-linecap="round"/><path d="M-4 -15L0 -21L4 -15Z" fill="#fff"/>';
 return '<ellipse rx="16" ry="12" fill="'+color+'" stroke="#102e23" stroke-width="2.4"/><path d="M-12 0H-20M12 0H20" stroke="'+color+'" stroke-width="5" stroke-linecap="round"/><path d="M-5 -7L0 -14L5 -7Z" fill="#fff"/>';
}
export function contactLabels(objects,g,escape){
 return objects.filter(o=>contactType(o.type)).map(o=>{
  const spec=CONTACTS[o.type],p=g.toView(o.x,o.y),label=String(o.label||'').replace(/ marker$/i,'').trim()||spec.title;
  const text=label.slice(0,36).toUpperCase(),w=Math.max(94,text.length*10+24);
  const x=Math.max(3,Math.min(g.viewWidth-w-3,p.x-w/2)),y=p.y>75?p.y-73:p.y+38;
  return '<g pointer-events="none" class="contact-caption"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="25" rx="6" fill="#172820" stroke="'+spec.color+'" stroke-width="1.5"/><text x="'+(x+w/2)+'" y="'+(y+17)+'" text-anchor="middle" font-size="14" font-weight="800" fill="'+spec.color+'">'+escape(text)+'</text></g>';
 }).join('');
}
