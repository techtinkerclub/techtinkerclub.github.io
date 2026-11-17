import {physicalUnit} from './symbol-scale.js?v=0.12.0';
// Author-controlled schematic breakdown stages; not a technique or law validator.
import {carrier,findObject} from './possession.js?v=0.12.0';
import {isGroundPad} from './ruck-practice.js?v=0.12.28';
export const PHASES={pad:'Pad ready · ruck practice',tackle:'Tackle',release:'Release and present',support:'Attacking support arrives',ruck:'Ruck formed',contest:'Contest for possession',secured:'Ball secured · use it'};
export const validPhase=p=>Object.hasOwn(PHASES,p);
export function supportTitle(side){return side==='defence'?'Defending support arrives':'Attacking support arrives'}
export function nextPhase(p){if(p==='pad')return 'support';const keys=['tackle','release','support','ruck','contest','secured'],i=keys.indexOf(p);return i<0?null:keys[i+1]||null}
export const team=o=>['attacker','shield'].includes(o?.type)?'attack':['defender','bagplayer'].includes(o?.type)?'defence':null;
export function roles(frame,m){const r=m.breakdown||{},members=m.members||[];const carrierId=r.mode==='pad'?null:r.carrierId||members.find(x=>x.pose==='grounded')?.id;const tacklerId=(findObject(frame,r.tacklerId)?r.tacklerId:null)||members.find(x=>x.pose==='tackling')?.id;const tacklerIds=[...new Set([tacklerId,...(Array.isArray(r.tacklerIds)?r.tacklerIds:[]),...members.filter(x=>x.pose==='tackling').map(x=>x.id)].filter(id=>id&&id!==carrierId&&findObject(frame,id)))].slice(0,2);return {...r,carrierId,tacklerId,tacklerIds,ballId:r.mode==='pad'?r.ballId||null:r.ballId||(carrierId?frame.objects.find(o=>o.type==='ball'&&o.ownerId===carrierId)?.id:null)}}
export function candidates(frame,m,side){const r=roles(frame,m),a=findObject(frame,r.carrierId),t=r.mode==='pad'?'attack':team(a);return frame.objects.filter(o=>team(o)&&o.id!==r.carrierId&&!r.tacklerIds.includes(o.id)&&(side==='attack'?team(o)===t:team(o)!==t))}
export function cleanBreakdowns(frames){for(const f of frames)for(const o of f.objects){if(!o.breakdown)continue;if(!['tackle','ruck'].includes(o.type)||!validPhase(o.breakdown.phase)){delete o.breakdown;continue}const r={phase:o.breakdown.phase};if(o.breakdown.mode==='pad'&&o.type==='ruck'){r.mode='pad';if(typeof o.breakdown.padId==='string')r.padId=o.breakdown.padId}if(['attack','defence'].includes(o.breakdown.arrivalSide))r.arrivalSide=o.breakdown.arrivalSide;for(const k of ['carrierId','tacklerId','ballId'])if(typeof o.breakdown[k]==='string'&&findObject(f,o.breakdown[k]))r[k]=o.breakdown[k];const ids=roles(f,o).tacklerIds;if(ids.length){r.tacklerId=ids[0];r.tacklerIds=ids}o.breakdown=r}return frames}
export function setParticipants(f,m,g,ids,u10=false){
 const r=roles(f,m),a=findObject(f,r.carrierId),phase=r.phase,grounded=r.mode==='pad'?null:a?{id:a.id,pose:'grounded'}:null;
 const allowed=new Set([...candidates(f,m,'attack'),...candidates(f,m,'defence')].map(o=>o.id));
 const players=[...new Set(ids)].filter(id=>allowed.has(id)).map(id=>findObject(f,id));
 const referenceTeam=r.mode==='pad'?'attack':team(a),same=players.filter(o=>team(o)===referenceTeam),other=players.filter(o=>team(o)!==referenceTeam);
 if(u10&&(same.length>1||other.length>1))return {ok:false,message:'U10: one arriving support player per team; the next player plays the ball away.'};
 if(players.length>16)return {ok:false,message:'Diagram limit: 16 arriving players.'};
 if(['ruck','contest','secured'].includes(phase)&&(!same.length||!other.length))return {ok:false,message:'A formed ruck requires at least one standing player from each team.'};
 const first=r.arrivalSide==='defence'?'defence':'attack';
 if(phase==='support'&&!(first==='defence'?other.length:same.length))return {ok:false,message:'Select a first arriving '+(first==='defence'?'defender.':'attacker.')};
 if(phase==='support'&&(first==='defence'?same.length:other.length))return {ok:false,message:'Add the opposing support at the Ruck formed stage.'};
 // A pad practice has no inferred ball or tackle. A sequence stage should
 // only set membership/pose and preserve EVERY authored position and route.
 // Otherwise a ball placed aside pulls the whole ruck towards it and all
 // arriving players 'dance' into new preset positions at every stage.
 if(r.mode==='pad'){
  const active=new Set(players.map(o=>o.id));
  for(const x of f.objects)if(x!==m&&Array.isArray(x.members))x.members=x.members.filter(y=>!active.has(y.id));
  m.members=players.map(o=>({id:o.id,pose:phase==='support'?'standing':'bound'}));
  return {ok:true,message:(phase==='support'?supportTitle(first):PHASES[phase])+' · '+players.length+' arriving players, positions preserved'};
 }
 const ball=findObject(f,r.ballId),p=g.toView(ball?.x??m.x,ball?.y??m.y),ang=(m.rot+g.rotation)*Math.PI/180,c=Math.cos(ang),s=Math.sin(ang);
 const put=(o,x,y,r)=>{Object.assign(o,g.fromView(p.x+physicalUnit(g)*(x*c-y*s),p.y+physicalUnit(g)*(x*s+y*c)),{rot:((m.rot+r)%360+360)%360});if(f.paths?.[o.id])delete f.paths[o.id]};
 // The marker is the ball area. Separate grounded participants from standing ones.
 for(const [group,sign] of [[same,1],[other,-1]])group.forEach((o,i)=>{
  const row=Math.floor(i/3),n=Math.min(3,group.length-row*3),j=i%3;
  const base=sign*((phase==='support'?40:20)+row*29);const advance=phase==='secured'?20+Math.max(1,Math.ceil(same.length/3))*29:0;
  put(o,(j-(n-1)/2)*29,base-advance,sign===1?0:180)
 });
 const active=new Set(players.map(o=>o.id));for(const x of f.objects)if(x!==m&&Array.isArray(x.members))x.members=x.members.filter(y=>!active.has(y.id));
 for(const o of players)delete o.playerPose;m.members=[...(grounded?[grounded]:[]),...players.map(o=>({id:o.id,pose:phase==='support'?'standing':'bound'}))];
 return {ok:true,message:(phase==='support'?supportTitle(first):PHASES[phase])+' · '+players.length+' arriving players'};
}
export function advance(f,m,g,phase,ids,u10=false,arrivalSide=null){
 const r=roles(f,m),a=findObject(f,r.carrierId),d=findObject(f,r.tacklerId),b=findObject(f,r.ballId);
 // A sausage ruck drill is a separate coaching sequence. There is no tackled
 // ball carrier, no tackler and no requirement to invent a grounded player.
 if(r.mode==='pad'){
  if(phase!==nextPhase(r.phase))return {ok:false,message:'Continue the current pad practice stage first.'};
  const pad=findObject(f,r.padId);
  if(!isGroundPad(pad))return {ok:false,message:'Add a sausage bag or a donut lying flat, or restore the linked equipment.'};
  const side=arrivalSide||r.arrivalSide||'attack',old=m.breakdown;
  m.breakdown={phase,mode:'pad',padId:r.padId,arrivalSide:side};
  const result=setParticipants(f,m,g,ids,u10);
  if(!result.ok){m.breakdown=old;return result}
  m.type='ruck';
  m.label=phase==='secured'?'Clearout complete · reset':phase==='ruck'?'Ruck formed · pad drill':phase==='contest'?'Contest over the pad':phase==='support'?supportTitle(side):PHASES[phase];
  return {ok:true,message:m.label};
 }

 if(phase!==nextPhase(r.phase||'tackle')||!a||!d||!b)return {ok:false,message:'An arranged tackle with a ball carrier, tackler and ball is required.'};
 const p=g.toView(m.x,m.y),angle=(m.rot+g.rotation)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 const put=(o,x,y,rot)=>{Object.assign(o,g.fromView(p.x+physicalUnit(g)*(x*c-y*s),p.y+physicalUnit(g)*(x*s+y*c)));if(rot!==undefined)o.rot=((m.rot+rot)%360+360)%360;if(f.paths?.[o.id])delete f.paths[o.id]};
 const first=arrivalSide||(r.arrivalSide||'attack');m.breakdown={phase,carrierId:a.id,tacklerId:d.id,tacklerIds:r.tacklerIds,ballId:b.id,arrivalSide:first};m.label=phase==='support'?supportTitle(first):phase==='ruck'&&first==='defence'?'Clearout · ruck formed':PHASES[phase];
 if(phase==='release'){
  // Both responsibilities happen immediately; shown as simultaneous rather than a delayed release.
  r.tacklerIds.forEach((id,i)=>{const player=findObject(f,id);if(player){put(player,i===0?65:-65,-15,180);player.playerPose='standing'}});delete a.playerPose;put(a,-12,-9,180);put(b,0,25,0);delete b.ownerId;b.groundState='presented';b.transferKind='presentation';f.timing[b.id]={start:0,end:45};m.members=[{id:a.id,pose:'grounded'}];
 }else if(phase==='secured'){const out=setParticipants(f,m,g,ids,u10);if(!out.ok)return out;// Make the ball available at the rear by advancing the bound group, not by sliding the ball unaided.
 b.groundState='secured';delete b.transferKind;}
 else {if(phase==='ruck'||phase==='contest')m.type='ruck';const out=setParticipants(f,m,g,ids,u10);if(!out.ok)return out}
 return {ok:true,message:m.label};
}
