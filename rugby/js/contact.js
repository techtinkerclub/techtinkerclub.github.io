import {physicalUnit} from './symbol-scale.js?v=0.12.0';
// Schematic formation presets, not coaching technique or an age-grade law validator.
import {canCarry,carrier} from './possession.js?v=0.12.30';
import {team,roles,setParticipants} from './breakdown.js?v=0.12.30';
const CONTACTS={tackle:{title:'Tackle',min:2,max:3,color:'#fa9e91'},ruck:{title:'Ruck',min:2,max:16,color:'#f7d27a'},maul:{title:'Maul',min:3,max:16,color:'#c8b0f5'},scrum:{title:'Scrum',min:4,max:16,color:'#91dbce'}};
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
   if(Array.isArray(o.members)){const seen=new Set();o.members=o.members.filter(m=>m&&ids.has(m.id)&&!seen.has(m.id)&&['grounded','tackling','bound','crouched','standing','kneeling','recovering','ready'].includes(m.pose)&&seen.add(m.id)).slice(0,17)}
  }
 }
 return frames;
}
export function arrangeContact(frame,marker,g,previous=null,explicit=null,u10=false){
 if(marker.breakdown?.mode==='pad'&&marker.breakdown.phase==='pad'){
  if(!explicit?.length)return {ok:false,message:'Choose one player from each side, or use Next stage to show the arrivals separately.'};
  const old={...marker.breakdown};
  marker.breakdown.phase='ruck';
  const res=setParticipants(frame,marker,g,explicit,u10);
  if(!res.ok){marker.breakdown=old;return res}
  marker.label='Ruck formed · pad drill';
  return {...res,message:'Ruck practice arranged over ground equipment. You can continue to the contest.'};
 }
 if(marker.breakdown&&marker.breakdown.phase!=='tackle'){if(!explicit)return {ok:false,message:'Choose participants in the inspector.'};return setParticipants(frame,marker,g,explicit,u10)}
 if(!contactType(marker.type))return {ok:false,message:'Select a contact marker.'};
 const spec=CONTACTS[marker.type],near=explicit?explicit.map(id=>frame.objects.find(o=>o.id===id)).filter(canCarry):contactCandidates(frame,marker,g);
 let unique=[...new Map(near.map(o=>[o.id,o])).values()];
 if(marker.type==='ruck'){
  const ball=frame.objects.find(o=>o.type==='ball'&&!carrier(frame,o)&&Math.hypot(g.toView(o.x,o.y).x-g.toView(marker.x,marker.y).x,g.toView(o.x,o.y).y-g.toView(marker.x,marker.y).y)<100);
  if(!ball)return {ok:false,message:'Present the ball on the ground before arranging a ruck.'};
  const prior=[...frame.objects,...(previous?.objects||[])].find(o=>o.type==='tackle'&&o.members?.length&&Math.hypot(g.toView(o.x,o.y).x-g.toView(marker.x,marker.y).x,g.toView(o.x,o.y).y-g.toView(marker.x,marker.y).y)<100);
  const r=prior&&roles(frame,prior);unique=unique.filter(o=>team(o)&&o.id!==r?.carrierId&&!r?.tacklerIds?.includes(o.id));
  const a=unique.filter(o=>team(o)==='attack'),d=unique.filter(o=>team(o)==='defence');if(!a.length||!d.length)return {ok:false,message:'Select standing arrivals from both teams, not the original tackle pair.'};
  if(u10&&(a.length>1||d.length>1)){if(explicit)return {ok:false,message:'U10: one arriving player per team.'};unique=[a[0],d[0]]}
 }
 if(marker.type==='maul'&&u10){const a=unique.filter(o=>team(o)==='attack'),d=unique.filter(o=>team(o)==='defence');if(!a.length||!d.length)return {ok:false,message:'Choose players from both teams.'};if(a.length>2||d.length>2){if(explicit)return {ok:false,message:'U10 maul: at most two players per team.'};unique=[...a.slice(0,2),...d.slice(0,2)]}}
 if(marker.type==='scrum'&&u10){const a=unique.filter(o=>team(o)==='attack'),d=unique.filter(o=>team(o)==='defence');if(a.length<3||d.length<3)return {ok:false,message:'U10 scrum: choose three players from each team.'};if(explicit&&(a.length!==3||d.length!==3))return {ok:false,message:'U10 scrum: exactly three per team.'};unique=[...a.slice(0,3),...d.slice(0,3)]}
 if(explicit&&unique.length>spec.max)return {ok:false,message:'Too many participants for this diagram preset.'};
 if(unique.length<spec.min)return {ok:false,message:'Move '+spec.min+' or more players near the '+spec.title.toLowerCase()+' marker first.'};
 const own=(fr)=>fr?.objects.filter(o=>o.type==='ball').map(b=>carrier(fr,b)?.id)||[];
 const carrierId=[...own(frame),...own(previous)].find(id=>unique.some(o=>o.id===id));
 const lead=unique.find(o=>o.id===carrierId)||unique[0],rest=unique.filter(o=>o.id!==lead.id),opponent=rest.find(o=>o.type!==lead.type&&['attacker','defender'].includes(o.type))||rest[0];
 const players=[lead,opponent,...rest.filter(o=>o.id!==opponent?.id)].filter(Boolean).slice(0,marker.type==='tackle'&&!explicit?2:spec.max);
 if(marker.type==='tackle'&&(!carrierId||!team(lead)||players.slice(1).some(p=>!team(p)||team(p)===team(lead))))return {ok:false,message:'Choose the ball carrier and one or two opponents.'};
 let offsets=[];
 if(marker.type==='tackle')offsets=players.length===3?[{x:0,y:12,r:90,pose:'grounded'},{x:-19,y:-13,r:145,pose:'tackling'},{x:19,y:-13,r:215,pose:'tackling'}]:[{x:0,y:12,r:90,pose:'grounded'},{x:0,y:-12,r:180,pose:'tackling'}];
 else if(marker.type==='ruck')offsets=players.map(o=>{const t=team(o),same=players.filter(p=>team(p)===t),i=same.indexOf(o),row=Math.floor(i/3),n=Math.min(3,same.length-row*3);return {x:(i%3-(n-1)/2)*29,y:(t==='attack'?1:-1)*(18+row*29),r:t==='attack'?0:180,pose:'bound'}});
 else if(marker.type==='maul')offsets=players.map((_,i)=>({x:Math.sin(i*2*Math.PI/players.length)*26,y:-Math.cos(i*2*Math.PI/players.length)*26,r:i*360/players.length+180,pose:'bound'}));
 else {const teamA=players.filter(o=>o.type===lead.type),teamB=players.filter(o=>o.type!==lead.type);const balanced=teamA.length>=2&&teamB.length>=2;if(balanced)players.splice(0,players.length,...teamA,...teamB);const split=balanced?teamA.length:Math.ceil(players.length/2);offsets=players.map((_,i)=>{const top=i>=split,j=top?i-split:i,count=top?players.length-split:split;return {x:(j-(count-1)/2)*27,y:top?-20:20,r:top?180:0,pose:'crouched'}})}
 const heading=marker.members?.length?Number(marker.rot)||0:Number(lead.rot)||0;
 const a=(heading+g.rotation)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);const p=g.toView(marker.x,marker.y);
 const unit=physicalUnit(g),placements=offsets.map(v=>({...v,dx:unit*(v.x*c-v.y*s),dy:unit*(v.x*s+v.y*c)}));
 const minX=Math.min(...placements.map(v=>v.dx)),maxX=Math.max(...placements.map(v=>v.dx)),minY=Math.min(...placements.map(v=>v.dy)),maxY=Math.max(...placements.map(v=>v.dy));
 const clampCenter=(v,lo,hi)=>lo<=hi?Math.max(lo,Math.min(hi,v)):(lo+hi)/2;
 const cx=clampCenter(p.x,g.margin+16*unit-minX,g.margin+g.fw-16*unit-maxX),cy=clampCenter(p.y,g.margin+16*unit-minY,g.margin+g.fh-16*unit-maxY);
 Object.assign(marker,g.fromView(cx,cy),{rot:heading});marker.members=[];
 // Remove selected players from other formations in this step.
 const chosen=new Set(players.map(o=>o.id));for(const o of frame.objects)if(o!==marker&&Array.isArray(o.members))o.members=o.members.filter(m=>!chosen.has(m.id));
 players.forEach((o,i)=>{const v=placements[i];Object.assign(o,g.fromView(cx+v.dx,cy+v.dy),{rot:((heading+v.r)%360+360)%360});delete o.playerPose;marker.members.push({id:o.id,pose:v.pose});if(frame.paths?.[o.id])frame.paths[o.id].follow=false});
 if(marker.type==='tackle'){const b=frame.objects.find(o=>o.type==='ball'&&o.ownerId===players[0]?.id);if(b)marker.breakdown={phase:'tackle',carrierId:players[0].id,tacklerId:players[1].id,tacklerIds:players.slice(1).map(p=>p.id),ballId:b.id};marker.label=players.length===3?'Double tackle':'Tackle';}
 return {ok:true,count:players.length,message:spec.title+' formation arranged · '+players.length+' players.'};
}
export const PLAYER_POSES={standing:'Standing / running',tackling:'Tackling',grounded:'On the ground',kneeling:'Kneeling',bound:'Bound',recovering:'Recovering to feet',crouched:'Crouched',ready:'Ready to react · low stance'};
export function posesFor(objects){const map=new Map(objects.filter(o=>canCarry(o)&&Object.hasOwn(PLAYER_POSES,o.playerPose)).map(o=>[o.id,o.playerPose]));for(const marker of objects)if(contactType(marker.type))for(const m of marker.members||[])map.set(m.id,m.pose);return map}
// Arranged contact is communicated by player poses and the top caption, not a legacy letter.
export function contactMarkerShape(o,base){
 if(!contactType(o.type))return base;
 if(o.members?.length)return '';
 return base.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g,'');
}
export function posedShape(o,pose,normal,color){
 if(!pose||pose==='standing')return normal;
 // Same visual language as the standard player: oval body, short arms only.
 // Hands angle modestly forward to suggest a balanced, ready-to-wrap stance.
 if(pose==='ready')return '<path d="M-13 -3Q-18 -4 -22 -9M13 -3Q18 -4 22 -9" fill="none" stroke="#102e23" stroke-width="8" stroke-linecap="round"/>'+
 '<path d="M-13 -3Q-18 -4 -22 -9M13 -3Q18 -4 22 -9" fill="none" stroke="'+color+'" stroke-width="5" stroke-linecap="round"/>'+
 '<ellipse rx="15.5" ry="13.5" fill="'+color+'" stroke="#102e23" stroke-width="2.5"/>'+
 '<path d="M-5 -8L0 -16L5 -8Z" fill="#fff"/>';
 if(pose==='kneeling')return '<ellipse rx="12" ry="14" fill="'+color+'" stroke="#102e23" stroke-width="2.4"/><circle cy="-9" r="7" fill="'+color+'" stroke="#102e23" stroke-width="1.6"/><path d="M-9 9v8M9 9v8" stroke="'+color+'" stroke-width="5" stroke-linecap="round"/>';
 if(pose==='recovering')return '<ellipse rx="12" ry="18" fill="'+color+'" stroke="#102e23" stroke-width="2.4"/><circle cy="-11" r="7" fill="'+color+'" stroke="#102e23" stroke-width="1.4"/><path d="M-8 6L-14 15M8 6L13 15" stroke="'+color+'" stroke-width="5" stroke-linecap="round"/>';
 if(pose==='grounded')return '<rect x="-12" y="-23" width="24" height="46" rx="11" fill="'+color+'" stroke="#102e23" stroke-width="2.4"/><circle cy="-16" r="8" fill="'+color+'" stroke="#102e23" stroke-width="1.5"/><path d="M-9 3H9" stroke="#102e23" stroke-width="1.4"/>';
 if(pose==='tackling')return '<ellipse rx="12" ry="20" fill="'+color+'" stroke="#102e23" stroke-width="2.4"/><path d="M-10 -8L-17 -15M10 -8L17 -15" stroke="'+color+'" stroke-width="5" stroke-linecap="round"/><path d="M-4 -15L0 -21L4 -15Z" fill="#fff"/>';
 return '<ellipse rx="16" ry="12" fill="'+color+'" stroke="#102e23" stroke-width="2.4"/><path d="M-12 0H-20M12 0H20" stroke="'+color+'" stroke-width="5" stroke-linecap="round"/><path d="M-5 -7L0 -14L5 -7Z" fill="#fff"/>';
}
// Keep action captions in a narrow band outside the playing area.
export function contactLabels(objects,g,escape,extra=[]){
 const labels=[...objects.filter(o=>contactType(o.type)).map(o=>({text:String(o.label||'').replace(/ marker$/i,'').trim()||CONTACTS[o.type].title,color:CONTACTS[o.type].color})),...extra.map(text=>({text,color:'#ffe994'}))];
 if(!labels.length)return '';
 const max=Math.max(7,Math.floor((g.viewWidth-24)/8.8)),full=labels.map(x=>x.text).join(' · '),text=full.length>max?full.slice(0,max-1)+'…':full,w=Math.min(g.viewWidth-10,Math.max(84,text.length*8.8+26));
 return '<g pointer-events="none" class="contact-caption"><rect x="'+((g.viewWidth-w)/2)+'" y="3" width="'+w+'" height="24" rx="5" fill="#172820" stroke="'+labels[0].color+'" stroke-width=".9"/><text x="'+(g.viewWidth/2)+'" y="20" text-anchor="middle" font-size="15" font-weight="700" fill="'+labels[0].color+'">'+escape(text)+'</text></g>';
}
