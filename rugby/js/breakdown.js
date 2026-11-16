// Author-controlled schematic breakdown stages; not a technique or law validator.
import {carrier,findObject} from './possession.js?v=0.5.1';
export const PHASES={tackle:'Tackle',release:'Release and present',support:'Attacking support arrives',ruck:'Ruck formed',contest:'Contest for possession',secured:'Ball secured · use it'};
export const validPhase=p=>Object.hasOwn(PHASES,p);
export function nextPhase(p){const keys=Object.keys(PHASES),i=keys.indexOf(p);return i<0?null:keys[i+1]||null}
export const team=o=>['attacker','shield'].includes(o?.type)?'attack':['defender','bagplayer'].includes(o?.type)?'defence':null;
export function roles(frame,m){const r=m.breakdown||{},members=m.members||[];const carrierId=r.carrierId||members.find(x=>x.pose==='grounded')?.id;return {...r,carrierId,tacklerId:r.tacklerId||members.find(x=>x.pose==='tackling')?.id,ballId:r.ballId||frame.objects.find(o=>o.type==='ball'&&o.ownerId===carrierId)?.id}}
export function candidates(frame,m,side){const r=roles(frame,m),a=findObject(frame,r.carrierId),t=team(a);return frame.objects.filter(o=>team(o)&&o.id!==r.carrierId&&o.id!==r.tacklerId&&(side==='attack'?team(o)===t:team(o)!==t))}
export function cleanBreakdowns(frames){for(const f of frames)for(const o of f.objects){if(!o.breakdown)continue;if(!['tackle','ruck'].includes(o.type)||!validPhase(o.breakdown.phase)){delete o.breakdown;continue}const r={phase:o.breakdown.phase};for(const k of ['carrierId','tacklerId','ballId'])if(typeof o.breakdown[k]==='string'&&findObject(f,o.breakdown[k]))r[k]=o.breakdown[k];o.breakdown=r}return frames}
export function setParticipants(f,m,g,ids,u10=false){
 const r=roles(f,m),a=findObject(f,r.carrierId),phase=r.phase,grounded=a?{id:a.id,pose:'grounded'}:null;
 const allowed=new Set([...candidates(f,m,'attack'),...candidates(f,m,'defence')].map(o=>o.id));
 const players=[...new Set(ids)].filter(id=>allowed.has(id)).map(id=>findObject(f,id));
 const same=players.filter(o=>team(o)===team(a)),other=players.filter(o=>team(o)!==team(a));
 if(u10&&(same.length>1||other.length>1))return {ok:false,message:'U10: one arriving support player per team; the next player plays the ball away.'};
 if(players.length>16)return {ok:false,message:'Diagram limit: 16 arriving players.'};
 if(['ruck','contest','secured'].includes(phase)&&(!same.length||!other.length))return {ok:false,message:'A formed ruck requires at least one standing player from each team.'};
 if(phase==='support'&&!same.length)return {ok:false,message:'Select at least one attacking support player.'};
 if(phase==='support'&&other.length)return {ok:false,message:'Add defending support at the Ruck formed stage.'};
 const p=g.toView(m.x,m.y),ang=(m.rot+g.rotation)*Math.PI/180,c=Math.cos(ang),s=Math.sin(ang);
 const put=(o,x,y,r)=>{Object.assign(o,g.fromView(p.x+x*c-y*s,p.y+x*s+y*c),{rot:((m.rot+r)%360+360)%360});if(f.paths?.[o.id])delete f.paths[o.id]};
 // The marker is the ball area. Separate grounded participants from standing ones.
 for(const [group,sign] of [[same,1],[other,-1]])group.forEach((o,i)=>{
  const row=Math.floor(i/3),n=Math.min(3,group.length-row*3),j=i%3;
  put(o,(j-(n-1)/2)*29,sign*((phase==='support'?40:20)+row*29),sign===1?0:180)
 });
 const active=new Set(players.map(o=>o.id));for(const x of f.objects)if(x!==m&&Array.isArray(x.members))x.members=x.members.filter(y=>!active.has(y.id));
 m.members=[...(grounded?[grounded]:[]),...players.map(o=>({id:o.id,pose:phase==='support'?'standing':'bound'}))];
 return {ok:true,message:PHASES[phase]+' · '+players.length+' arriving players'};
}
export function advance(f,m,g,phase,ids,u10=false){
 const r=roles(f,m),a=findObject(f,r.carrierId),d=findObject(f,r.tacklerId),b=findObject(f,r.ballId);
 if(phase!==nextPhase(r.phase||'tackle')||!a||!d||!b)return {ok:false,message:'An arranged tackle with a ball carrier, tackler and ball is required.'};
 const p=g.toView(m.x,m.y),angle=(m.rot+g.rotation)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 const put=(o,x,y,rot)=>{Object.assign(o,g.fromView(p.x+x*c-y*s,p.y+x*s+y*c));if(rot!==undefined)o.rot=((m.rot+rot)%360+360)%360;if(f.paths?.[o.id])delete f.paths[o.id]};
 m.breakdown={phase,carrierId:a.id,tacklerId:d.id,ballId:b.id};m.label=PHASES[phase];
 if(phase==='release'){
  // Both responsibilities happen immediately; shown as simultaneous rather than a delayed release.
  put(d,65,-10,180);put(a,-30,5,90);put(b,0,0,0);delete b.ownerId;b.groundState='presented';b.transferKind='presentation';f.timing[b.id]={start:0,end:45};m.members=[{id:a.id,pose:'grounded'}];
 }else if(phase==='secured'){const out=setParticipants(f,m,g,ids,u10);if(!out.ok)return out;put(b,0,47,0);b.groundState='secured';delete b.transferKind;f.timing[b.id]={start:0,end:90};}
 else {if(phase==='ruck'||phase==='contest')m.type='ruck';const out=setParticipants(f,m,g,ids,u10);if(!out.ok)return out}
 return {ok:true,message:PHASES[phase]};
}
