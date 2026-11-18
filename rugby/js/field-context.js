// Regulation-informed field context for drills. Practice dimensions remain untouched.
// Coordinates: x metres from the LEFT touchline, y metres from the TOP tryline.
// y may be negative to include the upper in-goal. No age template grants permission
// to use a particular restart or contact technique: rules are age-dependent.
export const FIELD_PRESETS=Object.freeze({
 U7:{length:20,width:12,inGoal:5},U8:{length:45,width:22,inGoal:5},
 U9:{length:60,width:30,inGoal:5},U10:{length:60,width:35,inGoal:5},
 U11:{length:60,width:43,inGoal:5},U12:{length:60,width:43,inGoal:5},
 U13:{length:90,width:60,inGoal:5},U14:{length:100,width:70,inGoal:5},
 U15:{length:100,width:70,inGoal:10},U16:{length:100,width:70,inGoal:10},
 Adult:{length:100,width:70,inGoal:10}
});
const number=(x,d)=>Number.isFinite(Number(x))?Number(x):d;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export function fieldPreset(age){return FIELD_PRESETS[age]||FIELD_PRESETS.U10}
export function fieldContext(d){
 const raw=d?.pitchContext||{},inferred=d?.ageMin>=7&&d.ageMin<=16?'U'+d.ageMin:/^U(\d+)/.exec(String(d?.age||''))?.[0]||'U10';
 const age=Object.hasOwn(FIELD_PRESETS,raw.age)?raw.age:Object.hasOwn(FIELD_PRESETS,inferred)?inferred:'U7';
 const t=fieldPreset(age),l=number(d?.length,20),w=number(d?.width,15);
 return {mode:raw.mode==='field'?'field':'training',age,length:t.length,width:t.width,inGoal:t.inGoal,
  x:clamp(number(raw.x,(t.width-w)/2),0,Math.max(0,t.width-w)),
  y:clamp(number(raw.y,(t.length-l)/2),-t.inGoal,Math.max(-t.inGoal,t.length+t.inGoal-l))};
}
export function validateFieldContext(v,areaLength,areaWidth){
 const mode=v?.mode==='field'?'field':'training',age=String(v?.age||'U10');
 if(!Object.hasOwn(FIELD_PRESETS,age))return {ok:false,message:'Choose a recognised RFU age-grade pitch template.'};
 const t=fieldPreset(age);
 if(mode==='training')return {ok:true,value:{mode,age}};
 if(!Number.isFinite(areaLength)||!Number.isFinite(areaWidth)||areaLength<=0||areaWidth<=0)
  return {ok:false,message:'Choose valid training-area dimensions first.'};
 if(areaWidth>t.width+1e-7||areaLength>t.length+2*t.inGoal+1e-7)
  return {ok:false,message:'The training area is larger than this age-grade field. Reduce the training area or choose a larger template.'};
 const x=Number(v.x),y=Number(v.y);
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x+areaWidth>t.width+1e-7||y< -t.inGoal||y+areaLength>t.length+t.inGoal+1e-7)
  return {ok:false,message:'The training-area rectangle must fit inside the marked field, including the in-goal areas.'};
 return {ok:true,value:{mode,age,x:Math.round(x*100)/100,y:Math.round(y*100)/100}};
}
export function fieldAnchor(v,areaLength,areaWidth,key){
 const t=fieldPreset(v.age),middleX=(t.width-areaWidth)/2,middleY=(t.length-areaLength)/2;
 let x=middleX,y=middleY;
 switch(key){
  case 'left-touch':x=0;break;
  case 'right-touch':x=t.width-areaWidth;break;
  case 'left-five':x=5;break;
  case 'right-five':x=t.width-5-areaWidth;break;
  case 'top-try':y=-areaLength/2;break;
  case 'bottom-try':y=t.length-areaLength/2;break;
  case 'top-five':y=5-areaLength/2;break;
  case 'bottom-five':y=t.length-5-areaLength/2;break;
  case 'top-22':y=22-areaLength/2;break;
  case 'bottom-22':y=t.length-22-areaLength/2;break;
  case 'halfway':y=t.length/2-areaLength/2;break;
 }
 return {x:Math.round(clamp(x,0,Math.max(0,t.width-areaWidth))*100)/100,
  y:Math.round(clamp(y,-t.inGoal,Math.max(-t.inGoal,t.length+t.inGoal-areaLength))*100)/100};
}
// The full-pitch drawing is a scaled metric diagram, not a photograph.
// White solid vs broken markings and top-view post bases follow World Rugby Law 1.
// Junior templates use only essential markings plus reference dashes, and do not
// assert that adult lineouts/22 m rules apply at U10.
export function fullFieldSVG(g,grid=false,gridStep=.5,settings={}){
 const c=g.fieldContext,age=Number(c.age.slice(1))||15,top=c.inGoal,bottom=top+c.length,total=c.length+2*top;
 const p=(x,y)=>g.fieldPoint(x,y),f=n=>Number(n.toFixed(2)),dashes=f(5*g.scale)+' '+f(5*g.scale);
 const line=(x1,y1,x2,y2,{dash='',stroke='#edf6e9',weight=1.8,opacity=1}={})=>{
  const a=p(x1,y1),b=p(x2,y2);
  return '<path d="M'+f(a.x)+' '+f(a.y)+'L'+f(b.x)+' '+f(b.y)+'" stroke="'+stroke+'" stroke-width="'+weight+'" stroke-opacity="'+opacity+'" '+(dash?'stroke-dasharray="'+dash+'" ':'')+'fill="none" vector-effect="non-scaling-stroke"/>';
 };
 const poly=pts=>pts.map(([x,y])=>{const q=p(x,y);return f(q.x)+','+f(q.y)}).join(' ');
 const text=(x,y,s,opacity=.85)=>{const q=p(x,y);return '<text x="'+f(q.x)+'" y="'+f(q.y)+'" fill="#edf5e8" fill-opacity="'+opacity+'" font-size="8" text-anchor="middle" paint-order="stroke" stroke="#1e4a30" stroke-width="3">'+s+'</text>'};
 const w=c.width;
 const base='<rect width="'+g.viewWidth+'" height="'+g.viewHeight+'" fill="#173a29"/>'+
  '<polygon points="'+poly([[0,0],[w,0],[w,total],[0,total]])+'" fill="#326944"/>';
 let stripes='';
 for(let i=0;i<10;i++)if(i%2)stripes+='<polygon points="'+poly([[0,total*i/10],[w,total*i/10],[w,total*(i+1)/10],[0,total*(i+1)/10]])+'" fill="#ecffeb" opacity=".035"/>';
 let marks='<polygon points="'+poly([[0,0],[w,0],[w,top],[0,top]])+'" fill="#c3e5a5" opacity=".09"/>'+
  '<polygon points="'+poly([[0,bottom],[w,bottom],[w,total],[0,total]])+'" fill="#c3e5a5" opacity=".09"/>';
 // Entire perimeter: touch-in-goal, touchlines and dead-ball lines.
 marks+=line(0,0,w,0)+line(0,total,w,total)+line(0,0,0,total)+line(w,0,w,total);
 marks+=line(0,top,w,top,{weight:2.6})+line(0,bottom,w,bottom,{weight:2.6});
 marks+=line(0,top+c.length/2,w,top+c.length/2,{weight:2});
 const active=c.length>=80&&age>=13,adult=age>=14;
 if(active){
  marks+=line(0,top+22,w,top+22)+line(0,bottom-22,w,bottom-22);
  if(adult){
   marks+=line(0,top+c.length/2-10,w,top+c.length/2-10,{dash:dashes});
   marks+=line(0,top+c.length/2+10,w,top+c.length/2+10,{dash:dashes});
  }
 }
 // 5m references apply to junior touch and goal-line practice. In full adult
 // mode add the 15m lineout limits as reference dashes.
 if(w>=15){
  marks+=line(5,top,5,bottom,{dash:dashes,opacity:.83});
  marks+=line(w-5,top,w-5,bottom,{dash:dashes,opacity:.83});
 }
 if(adult&&w>=40){
  marks+=line(15,top,15,bottom,{dash:dashes,opacity:.78});
  marks+=line(w-15,top,w-15,bottom,{dash:dashes,opacity:.78});
 }
 if(c.length>=20){
  marks+=line(0,top+5,w,top+5,{dash:dashes,opacity:.8});
  marks+=line(0,bottom-5,w,bottom-5,{dash:dashes,opacity:.8});
 }
 marks+=text(w/2,top/2+2,'IN-GOAL',.46)+text(w/2,bottom+top/2+2,'IN-GOAL',.46);
 if(active){marks+=text(w/2,top+22+2,'22m',.67)+text(w/2,bottom-22-2,'22m',.67);}
 marks+=text(w/2,top+c.length/2-4,'HALFWAY',.44);
 // Top view of the actual positions of the two 5.6m-spaced uprights at each goal line.
 for(const y of [top,bottom]){
  for(const x of [w/2-2.8,w/2+2.8]){
   const q=p(x,y),r=Math.max(2.5,.15*g.scale);
   marks+='<circle cx="'+f(q.x)+'" cy="'+f(q.y)+'" r="'+f(r+1.2)+'" fill="#1a432c" stroke="#f8ffe9" stroke-width="1.8"/><circle cx="'+f(q.x)+'" cy="'+f(q.y)+'" r="'+f(r*.48)+'" fill="#fff9ce"/>';
  }
 }
 // A precise editable rectangle; never rescales any players, paths or saved metres.
 const tl=g.toView(42,37),tr=g.toView(858,37),br=g.toView(858,503),bl=g.toView(42,503);
 const area=poly([[c.x,c.inGoal+c.y],[c.x+g.practice.width,c.inGoal+c.y],
  [c.x+g.practice.width,c.inGoal+c.y+g.practice.length],[c.x,c.inGoal+c.y+g.practice.length]]);
 marks+='<polygon data-practice-area="true" points="'+area+'" fill="#d2f57a" fill-opacity=".09" stroke="#d2f57a" stroke-width="2.4" stroke-dasharray="8 5" vector-effect="non-scaling-stroke"/>';
 const q=p(c.x,c.inGoal+c.y),labelY=Math.max(12,q.y-8);
 // A small dimension badge is sufficient; the large headline used to obscure
 // the goal line and player icons when coaches zoomed into a practice area.
 marks+='<text x="'+f(q.x+3)+'" y="'+f(labelY)+'" fill="#e1f69f" font-size="8" font-weight="650" paint-order="stroke" stroke="#183a2b" stroke-width="1.5">AREA · '+g.practice.length+' × '+g.practice.width+' m</text>';
 if(grid){const step=[.25,.5,1,2,5].includes(Number(gridStep))?Number(gridStep):.5;
  const nx=Math.ceil(g.practice.width/step),ny=Math.ceil(g.practice.length/step);
  if(nx*ny<3000){
   for(let i=1;i<nx;i++)marks+=line(c.x+i*step,c.inGoal+c.y,c.x+i*step,c.inGoal+c.y+g.practice.length,{stroke:'#d8f4c1',opacity:.13,weight:.6});
   for(let i=1;i<ny;i++)marks+=line(c.x,c.inGoal+c.y+i*step,c.x+g.practice.width,c.inGoal+c.y+i*step,{stroke:'#d8f4c1',opacity:.13,weight:.6});
  }
 }
 // Other scene code uses the shared marker arrow definition.
 const defs='<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#f9f4d9"/></marker></defs>';
 return defs+base+stripes+marks;
}
