import {physicalUnit} from './symbol-scale.js?v=0.12.0';
// Guided phase authoring. Schematic positions, explicit outcomes, no physics or live-contact instruction.
import {pitchGeometry} from './pitch.js?v=0.6.0';
import {carrier,canCarry,syncPossession} from './possession.js?v=0.12.0';
const wr='https://passport.world.rugby/laws-of-the-game/laws-by-number/';
export const RULES={rfu:'https://rfu.freshdesk.com/support/solutions/articles/103000094877-what-are-the-rules-of-play-for-my-childs-age-group-',u10:'https://rugbyreferee.net/wp-content/uploads/2026/09/2026-27-u10s-RRNet-RFU-Regulations.pdf',older:'https://surreyrugby.co.uk/images/pages/competition_rugby/Age-Grade-Information/AgeGrade%20Variation%20Summary_26_27_vAug2026.pdf',u11:'https://rugbyreferee.net/wp-content/uploads/2025/09/25-26-u11s-RRNet-RFU-Regulations.pdf'};
const def=(title,min,law,stages,note)=>({title,min,url:wr+law,stages,note});
export const GAME_PHASES={
 scrum:def('Scrum',10,'19-scrum/',['Set packs','Crouch · bind · set','Feed into tunnel','Ball available','Scrum-half collects','Scrum-half distributes'],'Coach/referee controls engagement. Use trained players; no simulated force, collapse or live technique instruction.'),
 maul:def('Maul',10,'16-maul/',['Carrier held upright','Support binds · maul formed','Ball moved to support','Use it · pass away'],'All remain on feet and bound; never collapse or pull players out. U10 max two per side; play away if forward movement stops.'),
 lineout:def('Lineout · throw and catch',14,'18-touch-quick-throw-and-lineout/',['Form two lines','Throw in · catch','Secure ball on feet','Distribute'],'No lifting or opposition contest is animated in this preset. U14 uncontested/no lift; U15 uncontested; U16+ may contest.'),
 offload:def('Offload to support',9,'14-tackle/',['Carrier approaches support','Offload to teammate'],'Pass before grounding in this example. Do not use a forward throw; support stays behind the carrier.'),
 freepass:def('Free pass restart',6,'20-penalty-and-free-kick/',['Set restart mark','Pass away'],'Age-grade free pass: pass first, then run; retreat distance and touch mark depend on age.'),
 tap:def('Tap restart · free kick / penalty',11,'20-penalty-and-free-kick/',['Set mark','Visible tap','Recover ball','Pass away'],'Retire required distance. Free kick and penalty options differ; use a free kick only where penalties are not introduced.'),
 punt:def('Punt · kick and receive',11,'10-offside-and-onside-in-open-play/',['Kicker ready','Kick in flight','Receive / collect'],'A schematic kick from hand. Chasers start onside; no contact with airborne receivers.'),
 grubber:def('Grubber · kick and collect',11,'10-offside-and-onside-in-open-play/',['Kicker ready','Low kick along ground','Collect'],'Kick from hand; not fly hacking a loose ball. No simulated bounce physics.'),
 chip:def('Chip · kick and collect',11,'10-offside-and-onside-in-open-play/',['Kicker ready','Chip over defence','Collect'],'Kick from hand; keep chasers onside and protect the receiver.'),
 crosskick:def('Cross-field kick',11,'10-offside-and-onside-in-open-play/',['Kicker ready','Cross-field kick','Receive / collect'],'Schematic flight; coach checks kicking and chasing offside.'),
 boxkick:def('Box kick · from hand',14,'10-offside-and-onside-in-open-play/',['Kicker ready','Box kick','Receive / collect'],'Schematic kick from hand, not a full breakdown or aerial contest simulation.'),
 kickoff:def('Kick-off / restart kick',11,'12-kick-off-and-restart-kicks/',['Set restart positions','Drop kick','Receiving team collects'],'Use the centre line for kick-off; kicking teammates remain behind the ball. Distance/receiving options vary by age.'),
 try:def('Try · ground the ball',6,'8-scoring',['Approach designated try line','Ground the ball'],'The end boundary is treated as the designated try line for this diagram; no automatic scoring judgement.'),
 goal:def('Goal kick · attempt',14,'8-scoring',['Set place kick','Kick towards goal'],'A top-down attempt only; no crossbar, height, points or success judgement. Position the target in line with the intended posts.')
};
const copy=o=>JSON.parse(JSON.stringify(o)),cl=(v,a,b)=>Math.min(b,Math.max(a,v)),lookup=(f,id)=>f.objects.find(o=>o.id===id);
export const playerTeam=o=>['attacker','shield'].includes(o?.type)?'A':['defender','bagplayer'].includes(o?.type)?'D':null;
export function phaseAge(d){return Number.isFinite(d.ageMin)?d.ageMin:10}
export function phaseAllowed(kind,age){return !!GAME_PHASES[kind]&&age>=GAME_PHASES[kind].min&&!(kind==='freepass'&&age>=14)}
export function packSize(age){return age<=11?3:age===12?5:age===13?6:8}
export function ageNote(kind,age){
 if(!phaseAllowed(kind,age))return 'Not available for the youngest selected age grade. Choose an applicable match action.';
 if(kind==='scrum')return packSize(age)+' per side · '+(age<=12?'no push; '+(age===10?'feeding hooker only strikes; ':'check strike rules; ')+'scrum-half passes away.'+(age===11?' U11: reconfirm current appendix (2025–26 source).':''):'youth limits: 1.5 m maximum push, 45° maximum wheel; no No. 8 pick in this preset.');
 if(kind==='maul')return age===10?'Maximum two players per side; if forward movement stops, play away.':age===11?'Use small practice groups; confirm current age-grade limits.':'Join from own side; use the ball promptly.';
 if(kind==='lineout')return age===14?'Uncontested, no lifting.':age===15?'Uncontested; lifting permitted but not animated.':'Unlifted, uncontested practice variant; contest/lifting optional under applicable laws, not simulated.';
 if(kind==='freepass')return age===10?'Defenders 7 m back; pass before running. For touch, start 5 m in.':'Confirm restart location and retreat under the applicable age-grade rules.';
 if(kind==='kickoff'||kind==='tap')return age<=12?'Use age-grade restart variations; verify retreat/receiving options.':'Confirm restart position and required distances.';
 return GAME_PHASES[kind].note;
}
export function phaseFields(kind,age){
 const ball={key:'ball',label:'Rugby ball',type:'ball'},own=(key,label)=>({key,label,type:'own'}),opp=(key,label)=>({key,label,type:'opp'}),many=(key,label,type,min,max)=>({key,label,type,many:true,min,max});
 if(kind==='scrum'){const n=packSize(age);return [ball,own('actor','Feeding scrum-half'),own('receiver','First receiver'),many('own','Feeding pack · select '+n,'own',n,n),many('opp','Opposing pack · select '+n,'opp',n,n),opp('otherHalf','Defending scrum-half')]}
 if(kind==='maul')return [ball,own('actor','Ball carrier'),opp('opponent','Holding opponent'),own('support','First support / ball recipient'),own('receiver','Player outside maul'),many('own','Additional teammates','own',0,age===10?0:age===11?1:5),many('opp','Additional defenders','opp',0,age===10?1:age===11?2:7)];
 if(kind==='lineout')return [ball,own('actor','Thrower'),own('support','Catcher (in line)'),own('receiver','Receiver outside line'),many('own','Other lineout players','own',1,6),many('opp','Opposing lineout players','opp',2,7)];
 if(kind==='try'||kind==='goal')return [ball,own('actor',kind==='try'?'Scoring player':'Kicker')];
 if(kind==='offload'||kind==='freepass'||kind==='tap')return [ball,own('actor',kind==='offload'?'Ball carrier':'Restart taker'),own('receiver','Receiving teammate')];
 return [ball,own('actor','Kicker'),{key:'receiver',label:'Receiver / collector (either team)',type:kind==='kickoff'?'opp':'either'}];
}
export function choicesFor(frame,field,side){return frame.objects.filter(o=>field.type==='ball'?o.type==='ball':field.type==='either'?!!playerTeam(o):playerTeam(o)===(field.type==='own'?side:side==='A'?'D':'A'))}
export function validateSelection(frame,kind,age,side,roles){
 if(!phaseAllowed(kind,age))throw Error(ageNote(kind,age));if(!['A','D'].includes(side))throw Error('Choose a team.');
 const used=new Set();
 for(const field of phaseFields(kind,age)){const ids=field.many?(Array.isArray(roles[field.key])?roles[field.key]:[]):[roles[field.key]],allowed=new Set(choicesFor(frame,field,side).map(o=>o.id));
  if(field.many&&(ids.length<field.min||ids.length>field.max))throw Error(field.label+': select '+(field.min===field.max?field.min:field.min+'–'+field.max)+'.');
  for(const id of ids){if(!allowed.has(id))throw Error('Choose '+field.label.toLowerCase()+'.');if(used.has(id))throw Error('A player cannot fill two roles in this phase.');used.add(id)}
 }
 if(kind==='lineout'&&roles.opp.length>roles.own.length+1)throw Error('Opposing line cannot outnumber the throwing line.');
 if(['maul','offload','try','punt','grubber','chip','crosskick','boxkick'].includes(kind)&&lookup(frame,roles.ball)?.ownerId!==roles.actor)throw Error('Attach the ball to the selected carrier / kicker first.');
}
export function cleanGuide(f){
 const q=f.guide;if(!q||typeof q!=='object'||!Object.hasOwn(GAME_PHASES,q.kind)||!Number.isInteger(q.stage)||q.stage<0||q.stage>=GAME_PHASES[q.kind].stages.length||typeof q.id!=='string'||q.id.length>200||!['A','D'].includes(q.side)){delete f.guide;return null}
 const roles={};for(const k of ['ball','actor','receiver','support','opponent','otherHalf'])if(typeof q.roles?.[k]==='string'&&q.roles[k].length<=200)roles[k]=q.roles[k];for(const k of ['own','opp'])roles[k]=Array.isArray(q.roles?.[k])?q.roles[k].filter(x=>typeof x==='string'&&x.length<=200).slice(0,15):[];
 const validPoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=42&&p.x<=858&&p.y>=37&&p.y<=503;
 if(!validPoint(q.anchor)||!validPoint(q.target)){delete f.guide;return null}
 f.guide={id:q.id,kind:q.kind,stage:q.stage,side:q.side,age:cl(Math.round(Number(q.age)||10),6,16),roles,anchor:{x:q.anchor.x,y:q.anchor.y},target:{x:q.target.x,y:q.target.y}};
 return f.guide;
}
export function guideCaption(f){const q=f?.guide;return q&&GAME_PHASES[q.kind]?.stages[q.stage]||''}
export function nextGuide(frames,i){const q=frames[i]?.guide;if(!q)return -1;for(let j=i+1;j<frames.length;j++){const n=frames[j].guide;if(!n||n.id!==q.id)break;if(n.stage===q.stage+1)return j;if(n.stage!==q.stage)break}return -1}
export function makeGuide(frame,kind,age,side,roles,id){
 validateSelection(frame,kind,age,side,roles);
 const a=lookup(frame,roles.actor),b=lookup(frame,roles.receiver),g={id,kind,age,side,stage:0,roles:copy(roles),anchor:{x:cl(a.x,42,858),y:cl(a.y,37,503)},target:{x:cl(b?.x??a.x,42,858),y:cl(b?.y??(side==='A'?37:503),37,503)}};
 return g;
}
const title=(q)=>GAME_PHASES[q.kind].stages[q.stage];
export function generateStage(frame,guide,length,width){
 const q=copy(guide),kind=q.kind,s=q.stage,r=q.roles,g=pitchGeometry(length,width,'up'),dir=q.side==='A'?1:-1;
 if(!phaseAllowed(kind,q.age)||!GAME_PHASES[kind].stages[s])throw Error('Phase not available for this age.');
 const f=copy(frame);f.name=title(q);f.seconds=s===0?1.1:1.6;f.notes='';f.timing={};f.paths={};f.guide=q;
 // End only the guide's own formation; do not silently delete unrelated markers.
 const markerId=q.id+'-formation';f.objects=f.objects.filter(o=>o.id!==markerId);
 const b=lookup(f,r.ball),actor=lookup(f,r.actor),rec=lookup(f,r.receiver),support=lookup(f,r.support),opp=lookup(f,r.opponent);
 if(b?.type!=='ball'||playerTeam(actor)!==q.side)throw Error('The selected ball or player is missing. Return to the earlier stage or start a new phase.');
 const all=[r.receiver,r.support,r.opponent,r.otherHalf,...(r.own||[]),...(r.opp||[])].filter(Boolean);if(all.some(id=>!lookup(f,id)))throw Error('A participant is missing from this step.');
 delete b.transferKind;
 const put=(o,x,y,rot)=>{if(!o)throw Error('Missing role.');if(x<g.margin-1e-6||x>g.margin+g.fw+1e-6||y<g.margin-1e-6||y>g.margin+g.fh+1e-6)throw Error('Not enough pitch space for this formation. Increase the practice area.');Object.assign(o,g.fromView(x,y));if(rot!==undefined)o.rot=rot;};
 const ownRot=dir===1?0:180,oppRot=dir===1?180:0;
 const anchor=g.toView(q.anchor.x,q.anchor.y),target=g.toView(q.target.x,q.target.y),center=(padX,padY)=>{if(g.fw<2*padX||g.fh<2*padY)throw Error('Pitch is too narrow or short for this formation.');return {x:cl(anchor.x,g.margin+padX,g.margin+g.fw-padX),y:cl(anchor.y,g.margin+padY,g.margin+g.fh-padY)}};
 const hold=(o,kind='set',start=0,end=100)=>{if(!o||f.objects.some(x=>x.type==='ball'&&x.id!==b.id&&x.ownerId===o.id))throw Error('Recipient is missing or already holds another ball.');b.ownerId=o.id;delete b.groundState;b.transferKind=kind;f.timing[b.id]={start,end}};
 const ground=(x,y,kind='set',start=0,end=100)=>{delete b.ownerId;delete b.groundState;put(b,x,y,0);b.transferKind=kind;f.timing[b.id]={start,end}};
 const marker=(type,p,members)=>{if(f.objects.length>=200)throw Error('Maximum objects reached.');const m={id:markerId,type,label:f.name,...g.fromView(p.x,p.y),rot:ownRot,members:members.map(id=>({id,pose:type==='scrum'?'crouched':'bound'}))};f.objects.push(m)};
 const pass=(o)=>hold(o,'pass',25,75);
 if(kind==='scrum'){
  const n=packSize(q.age),a=r.own||[],d=r.opp||[];if(a.length!==n||d.length!==n)throw Error('Pack membership does not match age grade.');
  const u=physicalUnit(g),p=center(82*u,(n>3?135:98)*u),gap=(s===0?39:15)*u;
  const pack=(ids,sign,rot)=>{const coords=[[-27,0],[0,0],[27,0],[-14,29],[14,29],[-40,27],[40,27],[0,58]];
   const layout=n===6?[...coords.slice(0,5),[0,58]]:coords.slice(0,n);
   ids.forEach((id,i)=>put(lookup(f,id),p.x+layout[i][0]*u,p.y+sign*(gap+layout[i][1]*u),rot))};
  if(s<=3){pack(a,dir,ownRot);pack(d,-dir,oppRot);put(actor,p.x-65*u,p.y,90);put(lookup(f,r.otherHalf),p.x+53*u,p.y-dir*(gap+(n>3?70:27)*u),oppRot);if(s>=1)marker('scrum',p,[...a,...d]);}
  if(s===0)hold(actor,'set',85,90);
  if(s===2)ground(p.x,p.y,'feed',25,75);
  if(s===3){const rear=p.y+dir*(gap+(n>3?82:33)*u);ground(p.x,rear,'feed',20,75);put(actor,p.x-18*u,rear+dir*12*u,ownRot)}
  if(s===4){hold(actor,'set',25,60);marker('scrum',p,[...a,...d]);}
  if(s===5){if(!rec)throw Error('Choose a first receiver.');const v=g.toView(actor.x,actor.y);
    if((g.toView(rec.x,rec.y).y-v.y)*dir<0)throw Error('Place the receiver behind or level with the scrum-half in the current step.');
    // The preceding stage explicitly showed the scrum-half collecting the ball.
    pass(rec);}
  f.notes=['Select the nearest eligible players for the packs. Other players remain behind their required offside lines.','Schematic referee-controlled engagement; no pushing in U10–U12. Stop if unsafe.','Feeding scrum-half introduces the ball into the tunnel. U10: only feeding hooker strikes.','Ball reaches the rear; designated scrum-half is ready to play it.','Scrum-half gathers the available ball.','Scrum-half passes away. This preset never depicts a No. 8 pick or an illegal push.'][s];
 }else if(kind==='maul'){
  const a=[actor.id,support.id,...r.own],d=[opp.id,...r.opp],u=physicalUnit(g),p=center(64*u,Math.max(55,Math.ceil(Math.max(a.length,d.length)/2)*29+25)*u);if(q.age===10&&(a.length>2||d.length>2))throw Error('U10 maul maximum two per side.');
  if(s===0){put(actor,p.x,p.y+dir*12*u,ownRot);put(opp,p.x,p.y-dir*14*u,oppRot);hold(actor);}
  if(s===1||s===2){const form=(ids,sign,rot)=>ids.forEach((id,i)=>{const row=i===0?0:Math.floor((i+1)/2),x=i<=1?0:(i%2===0?-25:25);put(lookup(f,id),p.x+x*u,p.y+sign*(13+row*27)*u,rot)});form(a,dir,ownRot);form(d,-dir,oppRot);marker('maul',p,[...a,...d]);if(s===2)hold(support,'handover',55,60)}
  if(s===3){const v=g.toView(support.x,support.y);if((g.toView(rec.x,rec.y).y-v.y)*dir<0)throw Error('Move the outside receiver behind the ball before playing away.');pass(rec)}
  f.notes=['Carrier is held upright; this is not yet a maul.','A teammate binds, making a maul with an opponent and the carrier. Stay on feet.','Transfer to bound support without a long-arm transfer. No automatic driving or collapse.','Use the ball promptly and play away.'][s];
 }else if(kind==='lineout'){
  // Left touchline; the longitudinal mark is chosen near thrower. Actual 5–15 m corridor.
  if(width<16||length<10)throw Error('Lineout needs at least 16 m width and 10 m length.');
  const x=g.margin,y=cl(anchor.y,g.margin+3*g.scale,g.margin+g.fh-3*g.scale),own=[support.id,...r.own],other=r.opp;
  if(s===0){put(actor,x,y,90);const spread=ids=>ids.map((id,i)=>({id,x:x+(5.5+(ids.length===1?0:i*9/(ids.length-1)))*g.scale}));for(const [arr,sg,rot] of [[own,dir,ownRot],[other,-dir,oppRot]])for(const z of spread(arr))put(lookup(f,z.id),z.x,y+sg*.5*g.scale,rot);const rr=g.toView(rec.x,rec.y);if((rr.y-y)*dir<2*g.scale)put(rec,x+9*g.scale,y+dir*2.5*g.scale,ownRot);hold(actor,'set',80,85)}
  if(s===1)hold(support,'throw',20,75);
  if(s===3)pass(rec);
  f.notes=['Two lines from 5 m to 15 m from touch; other players retire to their applicable offside line. Thrower on touch.','Throw to the named catcher. Uncontested and unlifted practice; no early jumping.','Catcher is on feet and balanced; no airborne contact.','Distribute to the nominated receiver.'][s];
 }else if(kind==='try'){
  const y=dir===1?g.margin:g.margin+g.fh,x=cl(anchor.x,g.margin+15,g.margin+g.fw-15);
  if(s===0){put(actor,x,y+dir*Math.min(35,g.fh/4),ownRot);hold(actor)}
  else{put(actor,x,y,ownRot);ground(x,y,'presentation',65,90);b.groundState='grounded'}
  f.notes=s===0?'The end boundary is the designated try line for this coaching diagram.':'Ground the ball on the line; coach/referee judges the score. No conversion is implied.';
 }else if(kind==='goal'){
  if(s===0)ground(anchor.x,anchor.y,'set',85,90);
  else{const y=dir===1?g.margin:g.margin+g.fh;ground(g.margin+g.fw/2,y,'kick',15,85)}
  f.notes=s===0?'Set up an age-appropriate place kick on the chosen mark.':'Goal attempt only: the diagram cannot show clearance of the crossbar or award points.';
 }else if(['freepass','tap','offload'].includes(kind)){
  if(!rec)throw Error('Select receiver.');
  const u=g.toView(actor.x,actor.y),v=g.toView(rec.x,rec.y);
  if(s===0){if(kind!=='offload'){hold(actor,'set',85,90);if(kind==='freepass'&&q.age===10){const retreat=7*g.scale,line=cl(u.y-dir*retreat,g.margin,g.margin+g.fh);for(const o of f.objects.filter(o=>playerTeam(o)&&playerTeam(o)!==q.side)){const v=g.toView(o.x,o.y);if((v.y-line)*dir>0)put(o,v.x,line,oppRot)}if((v.y-u.y)*dir<0)put(rec,v.x,cl(u.y+dir*20,g.margin,g.margin+g.fh),ownRot)}}else hold(actor)}
  else if(kind==='tap'&&s===1){ground(u.x,u.y,'tap',15,40);f.notes='Visible tap represented schematically; ball leaves the hands.'}
  else if(kind==='tap'&&s===2){hold(actor,'set',25,60);f.notes='Taker recovers the ball after the visible tap.'}
  else{if((v.y-u.y)*dir<-1e-6)throw Error('Move the receiver behind or level with the player before passing.');pass(rec)}
  if(!f.notes)f.notes=s===0?ageNote(kind,q.age):kind==='offload'?'Offload backwards before going to ground.':'Pass first; then continue open play.';
 }else{
  if(!rec)throw Error('Select a receiver.');
  if(s===0){if(kind==='kickoff'){const mid=g.margin+g.fh/2,dist=(q.age<=12?7:10)*g.scale;if(g.fh/2<dist)throw Error('Use a longer area to illustrate the restart distance.');put(actor,g.margin+g.fw/2,mid,ownRot);const v=g.toView(rec.x,rec.y);if((mid-v.y)*dir<dist)put(rec,v.x,mid-dir*dist,oppRot);for(const o of f.objects.filter(o=>o.id!==actor.id&&playerTeam(o)===q.side)){const v=g.toView(o.x,o.y);if((v.y-mid)*dir<0)put(o,v.x,mid,ownRot)}hold(actor,'set',85,90)}else hold(actor);}
  if(s===1){const v=g.toView(rec.x,rec.y);ground(v.x,v.y,'kick',20,85)}
  if(s===2)hold(rec,'set',25,40);
  f.notes=s===0?'Confirm onside starting positions, kick type and safe receiving space.':s===1?'Illustrative ball trajectory only; height and bounces are not physically simulated.':'Receiver gathers the ball; continue open play only when safe.';
 }
 // Existing contact marker memberships involving these roles would conflict with the new formation.
 if(s===0&&f.objects.some(o=>o.id!==markerId&&['tackle','ruck','maul','scrum'].includes(o.type)&&o.members?.some(m=>[actor.id,...all].includes(m.id))))throw Error('End the previous contact formation before starting this phase.');
 if(s===0)f.notes+=' '+ageNote(kind,q.age);
 syncPossession([f],g);return f;
}

export function phaseOverlay(frame,g){
 const q=frame?.guide;if(!q)return '';const kind=q.kind,dir=q.side==='A'?1:-1,roles=q.roles,actor=lookup(frame,roles.actor);
 const line=(a,b,color)=>{const x=g.toView(a.x,a.y),y=g.toView(b.x,b.y);return '<path d="M'+x.x+' '+x.y+'L'+y.x+' '+y.y+'" stroke="'+color+'" stroke-width="1.5" stroke-dasharray="5 4" opacity=".7" fill="none" pointer-events="none"/>'};
 const across=(y,color)=>line({x:42,y},{x:858,y},color),color='#e1e5b5';
 if(kind==='scrum'&&q.stage<5){const m=frame.objects.find(o=>o.id===q.id+'-formation');if(!m)return '';const a=roles.own.map(id=>lookup(frame,id)).filter(Boolean),b=roles.opp.map(id=>lookup(frame,id)).filter(Boolean);if(!a.length||!b.length)return '';const delta=5/g.length*466,ya=cl((dir===1?Math.max(...a.map(o=>o.y)):Math.min(...a.map(o=>o.y)))+dir*delta,37,503),yb=cl((dir===1?Math.min(...b.map(o=>o.y)):Math.max(...b.map(o=>o.y)))-dir*delta,37,503);return across(ya,color)+across(yb,color)}
 if(kind==='lineout'&&q.stage<3){const x5=42+5/g.width*816,x15=42+15/g.width*816;if(g.width<15||!actor)return '';return line({x:x5,y:37},{x:x5,y:503},color)+line({x:x15,y:37},{x:x15,y:503},color)}
 if(kind==='freepass'&&q.stage===0&&q.age===10&&actor){return across(cl(actor.y-dir*7/g.length*466,37,503),color)}
 if(kind==='kickoff'&&q.stage<2)return across(270,color)+across(cl(270-dir*(q.age<=12?7:10)/g.length*466,37,503),color);
 return '';
}
