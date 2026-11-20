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
// One spatial planner for authored speech and automatic rugby action cues.
// Callouts always remain detached from the speaker and avoid nearby characters.
// All coordinates are in SVG pixels; neither Classic nor Ruckus alters drills.
const overlap=(a,b)=>{
 const w=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
 const h=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 return w*h;
};
const bubbleBounds=(g,width,height)=>{
 const margin=Math.min(45,Math.max(8,Number(g?.margin)||12));
 const vw=Math.max(width+16,Number(g?.viewWidth)||900),vh=Math.max(height+16,Number(g?.viewHeight)||540);
 const minX=Math.min(margin,(vw-width)/2),minY=Math.min(margin,(vh-height)/2);
 return {minX,minY,maxX:Math.max(minX,vw-margin-width),maxY:Math.max(minY,vh-margin-height)};
};
export function planBubble({x,y,width,height,g,avoid=[],reserved=[]}){
 const b=bubbleBounds(g,width,height);
 const candidates=[
  {left:x+51,top:y-height-35,side:'right',rank:0},
  {left:x-51-width,top:y-height-35,side:'left',rank:1},
  {left:x+51,top:y+37,side:'right',rank:2},
  {left:x-51-width,top:y+37,side:'left',rank:3},
  {left:x-width/2,top:y-height-65,side:'top',rank:4},
  {left:x-width/2,top:y+65,side:'bottom',rank:5}
 ];
 const points=[...avoid,{x,y,id:'speaker'}];
 const evaluated=candidates.map(c=>{
  const left=Math.min(b.maxX,Math.max(b.minX,c.left)),top=Math.min(b.maxY,Math.max(b.minY,c.top));
  const r={x:left,y:top,w:width,h:height};
  const overflow=Math.abs(left-c.left)+Math.abs(top-c.top);
  let penalty=overflow*16+c.rank*3;
  for(const p of points){
   if(!Number.isFinite(p?.x)||!Number.isFinite(p?.y))continue;
   const region={x:p.x-33,y:p.y-34,w:66,h:68};
   penalty+=overlap(r,region)*(p.id==='speaker'?25:11);
  }
  for(const other of reserved)penalty+=overlap(r,other)*38;
  return {...c,left,top,width,height,penalty};
 });
 evaluated.sort((a,b)=>a.penalty-b.penalty||a.rank-b.rank);
 const best=evaluated[0];
 const bottom=best.top+height,right=best.left+width;
 const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
 const attach=best.side==='right'?{x:best.left,y:clamp(y,best.top+9,bottom-9)}:
  best.side==='left'?{x:right,y:clamp(y,best.top+9,bottom-9)}:
  best.side==='top'?{x:clamp(x,best.left+15,right-15),y:bottom}:
  {x:clamp(x,best.left+15,right-15),y:best.top};
 const dx=attach.x-x,dy=attach.y-y,len=Math.max(.001,Math.hypot(dx,dy));
 const tip={x:x+dx/len*26,y:y+dy/len*26};
 return {...best,attach,tip,rect:{x:best.left,y:best.top,w:width,h:height}};
}
const bubbleText=(rows,plan,{step=16,size=12,fontWeight=750,colour='#172c23',spacing=0}={})=>{
 const start=plan.top+plan.height/2-(rows.length-1)*step/2;
 return rows.map((line,i)=>'<text x="'+(plan.left+plan.width/2).toFixed(2)+'" y="'+(start+i*step).toFixed(2)+
  '" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="'+size+
  '" font-weight="'+fontWeight+'" fill="'+colour+'" letter-spacing="'+spacing+'">'+esc(line)+'</text>').join('');
};
const tailSVG=(plan,{fill='#fff9e6',stroke='#173329',width=2}={})=>{
 const a=plan.attach,t=plan.tip,dx=t.x-a.x,dy=t.y-a.y,len=Math.max(.001,Math.hypot(dx,dy));
 const nx=-dy/len*6,ny=dx/len*6;
 return '<path d="M'+(a.x+nx).toFixed(1)+' '+(a.y+ny).toFixed(1)+'L'+t.x.toFixed(1)+' '+t.y.toFixed(1)+
  'L'+(a.x-nx).toFixed(1)+' '+(a.y-ny).toFixed(1)+'Z" fill="'+fill+'" stroke="'+stroke+
  '" stroke-width="'+width+'" stroke-linejoin="round"/>';
};
const starburst=(plan,fill,stroke)=>{
 const {left,top,width,height}=plan,cx=left+width/2,cy=top+height/2;
 const pts=Array.from({length:24},(_,i)=>{
  const angle=-Math.PI/2+i*Math.PI/12;
  const factor=i%2===0?.98:.87;
  return (cx+Math.cos(angle)*width/2*factor).toFixed(1)+','+(cy+Math.sin(angle)*height/2*factor).toFixed(1);
 }).join(' ');
 return '<polygon points="'+pts+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2.4" stroke-linejoin="round"/>';
};
// Graphic-novel style for Ruckus; restrained sport-tactics styling in Classic.
// No shadow under either mode. The caller can pass already reserved bubbles
// so sequential callouts do not cover each other.
export function bubbleSVG({x,y,text,kind='speech',g,comic=true,ink=false,accent='#9ed3ae',avoid=[],reserved=[],onPlace}){
 const rows=wrapped(text,comic?20:23),size=comic?12.5:11.5,step=comic?17:15;
 const width=Math.max(comic?108:98,Math.min(240,Math.max(...rows.map(r=>r.length))*size*.64+(comic?38:30)));
 const height=Math.max(38,rows.length*step+(comic?24:20));
 const plan=planBubble({x,y,width,height,g,avoid,reserved});
 onPlace?.(plan.rect);
 const fill=ink?'#fff':comic?(kind==='shout'?'#fff0b9':kind==='thought'?'#e9f6fa':'#fff8df'):'#19392d';
 const border=ink?'#252525':comic?'#203429':accent;
 const font=ink?'#1b2b21':comic?'#162c24':'#f5ffe9';
 const shape=comic&&kind==='shout'?starburst(plan,fill,border):
  '<rect x="'+plan.left.toFixed(1)+'" y="'+plan.top.toFixed(1)+'" width="'+width.toFixed(1)+
  '" height="'+height.toFixed(1)+'" rx="'+(comic?(kind==='thought'?20:12):8)+'" fill="'+fill+
  '" stroke="'+border+'" stroke-width="'+(comic?2.6:1.9)+'"/>';
 const thought=comic&&kind==='thought'
  ?'<circle cx="'+((plan.attach.x+plan.tip.x)/2).toFixed(1)+'" cy="'+((plan.attach.y+plan.tip.y)/2).toFixed(1)+'" r="4" fill="'+fill+'" stroke="'+border+'" stroke-width="1.8"/>'+
   '<circle cx="'+plan.tip.x.toFixed(1)+'" cy="'+plan.tip.y.toFixed(1)+'" r="2.3" fill="'+fill+'" stroke="'+border+'" stroke-width="1.3"/>'
  :tailSVG(plan,{fill,stroke:border,width:comic?2.4:1.8});
 return '<g class="'+(comic?'graphic-novel-bubble':'standard-speech-bubble')+'" data-callout-side="'+plan.side+'" pointer-events="none"><title>'+
  esc(text)+'</title>'+thought+shape+bubbleText(rows,plan,{step,size,fontWeight:comic?850:700,colour:font,spacing:comic?.1:0})+'</g>';
}
// Auto-action captions now use the same palette, collision planner and centred
// text as authored bubbles. The smaller label avoids obscuring contact poses.
export function compactActionBubbleSVG({x,y,text,kind='speech',g,comic=true,ink=false,accent='#b9de9b',avoid=[],reserved=[],onPlace}){
 const value=String(text??'').trim().replace(/\s+/g,' ').slice(0,64);
 if(!value)return '';
 const words=value.split(' '),rows=[];let line='';
 for(let word of words){
  while(word.length>19){if(line){rows.push(line);line='';}rows.push(word.slice(0,19));word=word.slice(19)}
  if(!word)continue;
  if(line&&(line+' '+word).length>19){rows.push(line);line=word}
  else line+=(line?' ':'')+word;
 }
 if(line)rows.push(line);
 if(rows.length>2){rows.length=2;rows[1]=rows[1].slice(0,18)+'…'}
 const width=Math.max(78,Math.min(170,Math.max(...rows.map(t=>t.length))*6.6+28));
 const height=rows.length*15+16;
 const plan=planBubble({x,y,width,height,g,avoid,reserved});
 onPlace?.(plan.rect);
 const fill=ink?'#fff':comic?(kind==='shout'?'#fff0bc':'#fff8df'):'#19392d';
 const stroke=ink?'#292929':comic?'#203429':accent;
 const colour=ink?'#202820':comic?'#182e23':'#f5ffe9';
 const tail=tailSVG(plan,{fill,stroke,width:comic?2.2:1.6});
 const shape='<rect x="'+plan.left.toFixed(1)+'" y="'+plan.top.toFixed(1)+'" width="'+width.toFixed(1)+
  '" height="'+height.toFixed(1)+'" rx="'+(comic?10:7)+'" fill="'+fill+'" stroke="'+stroke+
  '" stroke-width="'+(comic?2.3:1.8)+'"/>';
 return '<g class="'+(comic?'graphic-novel-bubble':'standard-speech-bubble')+
  ' compact-action-bubble" data-callout-side="'+plan.side+'" pointer-events="none"><title>'+esc(value)+'</title>'+
  tail+shape+bubbleText(rows,plan,{step:15,size:11.8,fontWeight:comic?850:700,colour})+'</g>';
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
 const reserved=[],avoid=[...positions.values()].filter(o=>players.has(o.type)).map(o=>({...g.toView(o.x,o.y),id:o.id}));
 return '<g class="authored-speech-callouts" pointer-events="none">'+entries.slice(-8).map(a=>{
  const actor=positions.get(a.actorId),pos=g.toView(actor.x,actor.y);
  const accent=actor.type==='defender'?'#e4af82':'#a5d9f3';
  return bubbleSVG({x:pos.x,y:pos.y,text:String(a.text).slice(0,120),
   kind:CALLOUT_KINDS.includes(a.kind)?a.kind:'speech',g,comic:cartoonMode&&!ink,ink,accent,
   avoid,reserved,onPlace:rect=>reserved.push(rect)});
 }).join('')+'</g>';
}
