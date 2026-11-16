// Drill-wide settings and conservative snapshot propagation. Coordinates stay backwards compatible.
const copy=x=>JSON.parse(JSON.stringify(x));
const same=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-5;
const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const inField=p=>valid(p)&&p.x>=42-1e-6&&p.x<=858+1e-6&&p.y>=37-1e-6&&p.y<=503+1e-6;
const inEditor=p=>valid(p)&&p.x>=24-1e-6&&p.x<=876+1e-6&&p.y>=25-1e-6&&p.y<=515+1e-6;
const pointList=f=>[...f.objects.filter(o=>!o.ownerId),...Object.values(f.paths||{}).flatMap(r=>r.points||[]),...f.objects.filter(o=>o.type==='decision').flatMap(o=>o.decision?.options?.flatMap(v=>v.points||[])||[]),...[f.guide?.anchor,f.guide?.target].filter(Boolean)];
export function pitchSettings(d){
 return {attackDirection:['up','right','down','left'].includes(d?.attackDirection)?d.attackDirection:'up',showAttack:d?.showAttack!==false,boundary:['line','cones','flags','none'].includes(d?.boundary)?d.boundary:'line'};
}
export function resizeDrill(d,length,width,mode='relative'){
 if(!Number.isFinite(length)||!Number.isFinite(width)||length<5||length>100||width<5||width>70)return {ok:false,message:'Choose a length of 5–100 m and a width of 5–70 m.'};
 const next=copy(d);next.length=length;next.width=width;
 if(mode!=='physical'||length===d.length&&width===d.width)return {ok:true,drill:next};
 // Preserve world distances from the top-left pitch corner wherever possible.
 // If that crop does not fit, find one common translation for ALL steps and paths.
 // Never scale individual objects, clamp individual points, or alter relative spacing.
 const world=p=>({x:(p.x-42)*d.width/816,y:(p.y-37)*d.length/466});
 const rows=[];
 let minX=-Infinity,maxX=Infinity,minY=-Infinity,maxY=Infinity;
 for(let i=0;i<next.frames.length;i++){
  const points=pointList(next.frames[i]).filter(p=>!p.layoutMarker),before=pointList(d.frames[i]).filter(p=>!p.layoutMarker);
  for(let j=0;j<points.length;j++){
   const p=before[j],q=world(p),inside=inField(p);
   const loX=inside?0:(24-42)*width/816,hiX=inside?width:(876-42)*width/816;
   const loY=inside?0:(25-37)*length/466,hiY=inside?length:(515-37)*length/466;
   minX=Math.max(minX,loX-q.x);maxX=Math.min(maxX,hiX-q.x);
   minY=Math.max(minY,loY-q.y);maxY=Math.min(maxY,hiY-q.y);
   if(minX>maxX+1e-7||minY>maxY+1e-7)return {ok:false,message:'The existing objects and movement paths cannot all fit this pitch without changing distances (step '+(i+1)+'). Increase the pitch or choose Scale arrangement.'};
   rows.push({p:points[j],q});
  }
 }
 const nearestZero=(lo,hi)=>lo>0?lo:hi<0?hi:0;
 const dx=nearestZero(minX,maxX),dy=nearestZero(minY,maxY);
 for(const {p,q} of rows)Object.assign(p,{x:42+(q.x+dx)*816/width,y:37+(q.y+dy)*466/length});
 return {ok:true,drill:next,translation:{x:dx,y:dy}};
}
const contactTypes=new Set(['tackle','ruck','maul','scrum']);
const staticTypes=new Set(['cone','flag','bag','sausage','ladder','label']);
const linked=(f,id)=>f.objects.some(o=>contactTypes.has(o.type)&&(o.id===id||o.members?.some(m=>m.id===id)||[o.breakdown?.carrierId,o.breakdown?.tacklerId,...(o.breakdown?.tacklerIds||[])].includes(id)))||f.objects.some(o=>o.type==='donut'&&o.donutTacklerId===id)||!!f.guide&&Object.values(f.guide.roles||{}).flat().includes(id);
const find=(f,id)=>f?.objects.find(o=>o.id===id);
const route=(f,id)=>f?.paths?.[id]?.points||[];
const stateChanged=(a,b)=>a.ownerId!==b.ownerId||a.groundState!==b.groundState||a.transferKind!==b.transferKind||a.donutState!==b.donutState||a.playerPose!==b.playerPose;
export function canPropagate(f,o){return !!o&&!contactTypes.has(o.type)&&!['decision','donut','ball','shieldItem'].includes(o.type)&&!o.ownerId&&!linked(f,o.id)}
export function canEntire(o){return !!o&&staticTypes.has(o.type)&&!o.layoutMarker}
export function propagatePosition(frames,index,id,origin,scope){
 const current=frames[index],source=find(current,id);
 const result={count:0,stop:null,reason:'',ok:true};
 if(scope==='here'||!source||!valid(origin)||same(source,origin))return result;
 if(!canPropagate(current,source))return {...result,ok:false,reason:'This position is controlled by a contact formation, guided action or equipment relationship. Use Current step only.'};
 const dx=source.x-origin.x,dy=source.y-origin.y;
 const move=p=>({x:p.x+dx,y:p.y+dy});
 const fits=p=>inField(p)?inField(move(p)):inEditor(move(p));
 const stop=(i,why)=>{result.stop=i;result.reason=why;return result};
 const decisions=(f)=>f.objects.filter(o=>o.type==='decision'&&o.decision?.playerId===id);
 const extras=(f)=>[...route(f,id),...decisions(f).flatMap(o=>[o,...(o.decision.options||[]).flatMap(v=>v.points||[])])];
 if(scope==='entire'){
  if(!canEntire(source))return {...result,ok:false,reason:'Entire drill is for stationary, manually placed equipment.'};
  const set=frames.map((f,i)=>({f,i,o:find(f,id)})).filter(z=>z.o&&z.i!==index);
  if(set.some(({f,o})=>!canPropagate(f,o)||!same(o,origin)||route(f,id).length||!fits(o)))return {...result,ok:false,reason:'Equipment has deliberate movement, a protected relationship or a boundary conflict. Use another scope.'};
  for(const {o} of set){Object.assign(o,move(o));result.count++}return result;
 }
 let previous={...source,...origin};
 for(let i=index+1;i<frames.length;i++){
  const f=frames[i],o=find(f,id);
  if(!o)return stop(i,'object is no longer present');
  if(!canPropagate(f,o))return stop(i,'contact formation or guided action');
  if(stateChanged(previous,o))return stop(i,'deliberate change of action or pose');
  if(scope==='until'&&(!same(previous,o)||route(f,id).length))return stop(i,'next deliberate movement');
  const extra=scope==='onward'?extras(f):[];
  if(!fits(o)||extra.some(p=>!fits(p)))return stop(i,'pitch boundary');
  previous={...o};
  Object.assign(o,move(o));for(const p of extra)Object.assign(p,move(p));
  result.count++;
 }
 return result;
}
export function copyLayoutMarker(src,dst){if(src?.layoutMarker===true&&['cone','flag'].includes(src.type))dst.layoutMarker=true;return dst}
