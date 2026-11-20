// Timed, user-authored speech bubbles. These are annotations, not rugby actions.
// Shared by Studio, read-only playback, movie frames and coaching outputs.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bounded=(v,lo,hi,fallback)=>Number.isFinite(Number(v))?Math.max(lo,Math.min(hi,Number(v))):fallback;
const players=new Set(['attacker','defender','neutral','coach','shield','bagplayer']);
export const CALLOUT_KINDS=Object.freeze(['speech','shout','thought']);
export function cleanCallouts(frame){
 const ids=new Set((frame?.objects||[]).filter(o=>players.has(o.type)).map(o=>o.id));
 const entries=(Array.isArray(frame?.callouts)?frame.callouts:[]).slice(0,24)
  .filter(c=>c&&typeof c.actorId==='string'&&ids.has(c.actorId)&&typeof c.text==='string'&&c.text.trim());
 const seen=new Set();
 const result=entries.map((c,i)=>{
  const id=String(c.id||'bubble-'+i).slice(0,80);
  const unique=seen.has(id)?id+'-'+i:id;seen.add(unique);
  return {id:unique,actorId:c.actorId,text:c.text.trim().slice(0,120),
   kind:CALLOUT_KINDS.includes(c.kind)?c.kind:'speech',
   at:bounded(c.at,0,1,.5),displaySeconds:bounded(c.displaySeconds,.2,8,2)};
 });
 if(result.length)frame.callouts=result;
 else delete frame.callouts;
 return result;
}
function wrapped(value,max=23){
 const words=String(value||'').replace(/\s+/g,' ').trim().split(' ').filter(Boolean),rows=[];
 let current='';
 for(let word of words){
  while(word.length>max){if(current){rows.push(current);current='';}rows.push(word.slice(0,max));word=word.slice(max);}
  if(!word)continue;
  if(!current)current=word;
  else if((current+' '+word).length<=max)current+=' '+word;
  else{rows.push(current);current=word;}
 }
 if(current)rows.push(current);
 if(rows.length>4){rows.length=4;rows[3]=rows[3].slice(0,Math.max(1,max-1))+'…';}
 return rows.length?rows:['…'];
}
// The tail points to the speaker's position. This is always outside the player
// sprite, keeping faces, rugby balls and tag strips visible.
export function bubbleSVG({x,y,text,kind='speech',g,comic=true,ink=false,accent='#f7d765'}){
 const rows=wrapped(text),size=comic?13:11.5,step=comic?17:15;
 const width=Math.max(104,Math.min(252,Math.max(...rows.map(r=>r.length))*size*.62+28));
 const height=rows.length*step+20;
 const limitX=Math.max(8,(g?.viewWidth||900)-width-8);
 const minX=(g?.margin??0)+5,maxX=Math.max(minX,(g?.viewWidth||900)-width-(g?.margin??0)-5);
 const left=Math.min(maxX,Math.max(minX,x-width/2)),right=left+width;
 const topEdge=(g?.margin??0)+5;
 const above=y-height-29>=topEdge,top=above?y-height-26:y+28;
 const attachX=Math.min(right-22,Math.max(left+22,x));
 const tailTipY=above?y-17:y+17,tailStartY=above?top+height:top;
 const tail=comic?'<path d="M'+(attachX-12)+' '+tailStartY+' Q'+(attachX-6)+' '+(above?tailStartY+16:tailStartY-16)+' '+x+' '+tailTipY+' Q'+(attachX+7)+' '+(above?tailStartY+10:tailStartY-10)+' '+(attachX+13)+' '+tailStartY+'Z" fill="'+(ink?'#fff':comic?'#fff8da':'#18382d')+'" stroke="'+(ink?'#222':'#172b23')+'" stroke-width="3" stroke-linejoin="round"/>':'<path d="M'+attachX+' '+tailStartY+'L'+x+' '+tailTipY+'" stroke="'+(ink?'#555':accent)+'" stroke-width="2" stroke-dasharray="3 4"/>';
 const fill=ink?'#fff':comic?(kind==='shout'?'#fff1a9':kind==='thought'?'#e8f8ff':'#fff8da'):'#18382d';
 const stroke=ink?'#252525':comic?'#172b23':accent;
 const shadow=comic&&!ink?'<rect x="'+(left+4)+'" y="'+(top+5)+'" width="'+width+'" height="'+height+'" rx="15" fill="#122b1c" opacity=".38"/>':'';
 let surface;
 if(comic&&kind==='shout'){
  const cx=left+width/2,cy=top+height/2,rx=width/2,ry=height/2;
  const pts=Array.from({length:28},(_,i)=>{const angle=-Math.PI/2+i*Math.PI/14,scale=i%2?.89:1.08;return (cx+Math.cos(angle)*rx*scale).toFixed(1)+','+(cy+Math.sin(angle)*ry*scale).toFixed(1)}).join(' ');
  surface='<polygon points="'+pts+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3.4" stroke-linejoin="round"/>';
 }else surface='<rect x="'+left+'" y="'+top+'" width="'+width+'" height="'+height+'" rx="'+(comic?kind==='thought'?24:16:7)+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+(comic?3.4:1.7)+'"/>';
 const thought=comic&&kind==='thought'?'<circle cx="'+(x+3)+'" cy="'+(above?y-21:y+21)+'" r="5" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2"/><circle cx="'+(x+9)+'" cy="'+(above?y-12:y+12)+'" r="2.7" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5"/>':'';
 const texts=rows.map((line,i)=>'<text x="'+(left+width/2)+'" y="'+(top+18+i*step)+'" text-anchor="middle" font-family="Arial,sans-serif" font-size="'+size+'" font-weight="'+(comic?'900':'700')+'" fill="'+(comic||ink?'#162922':'#fff9df')+'" letter-spacing="'+(comic?.25:0)+'">'+esc(line)+'</text>').join('');
 return '<g class="'+(comic?'graphic-novel-bubble':'standard-speech-bubble')+'" pointer-events="none"><title>'+esc(text)+'</title>'+shadow+(kind==='thought'&&comic?'':tail)+surface+thought+texts+'</g>';
}
// A timed callout can remain visible after the step it was authored in.
// During static editing we deliberately display all bubbles for that step.
export function calloutOverlay(frames,index,objects,g,progress=1,{cartoonMode=false,ink=false,editing=false}={}){
 if(!Array.isArray(frames)||!frames[index])return '';
 const positions=new Map((objects||[]).map(o=>[o.id,o]));
 const end=frames.slice(0,index).reduce((n,f)=>n+(Number(f.seconds)||0),0);
 const now=end+bounded(progress,0,1,1)*(Number(frames[index].seconds)||0);
 const entries=[];
 for(let i=0;i<=index;i++){
  const f=frames[i],start=frames.slice(0,i).reduce((n,s)=>n+(Number(s.seconds)||0),0);
  for(const a of f.callouts||[]){
   if(!a||!positions.has(a.actorId)||typeof a.text!=='string'||!a.text.trim())continue;
   const eventTime=start+bounded(a.at,0,1,.5)*(Number(f.seconds)||0);
   const age=now-eventTime,duration=bounded(a.displaySeconds,.2,8,2);
   if((editing&&i===index)||(age>=-1e-6&&age<duration-1e-6))entries.push(a);
  }
 }
 const seen=[];
 return '<g class="authored-speech-callouts" pointer-events="none">'+entries.slice(-12).map(a=>{
  const actor=positions.get(a.actorId),pos=g.toView(actor.x,actor.y);
  const nearby=seen.filter(p=>Math.hypot(p.x-pos.x,p.y-pos.y)<125).length;
  seen.push(pos);
  const accent=actor.type==='defender'?'#ffc58a':'#9bd7ff';
  return bubbleSVG({x:pos.x,y:pos.y-nearby*48,text:String(a.text).slice(0,120),kind:CALLOUT_KINDS.includes(a.kind)?a.kind:'speech',g,comic:cartoonMode&&!ink,ink,accent});
 }).join('')+'</g>';
}
