/* 99 Club Studio · Maths Games & Puzzles PDF exporter
 * v1.0.1 — direct PDF output using the same dependency-free writer as 99 Club Studio.
 */
(function(global){
  'use strict';
  let P=global.TT99SimplePDF||null;
  if(!P && typeof require==='function'){
    try{P=require('./simple-pdf.js');}catch(e){}
  }
  if(!P)return;

  const INK=[36,67,74], MUTED=[96,116,121], TEAL=[15,138,131], LINE=[207,220,222], PALE=[244,249,248], DARK=[61,86,91], HIT=[218,242,237], WHITE=[255,255,255];
  const M=34, PAGE_W=P.PAGE_W, PAGE_H=P.PAGE_H;

  function clean(s){return P.asciiish(String(s??''));}
  function cap(s){s=String(s||'');return s.charAt(0).toUpperCase()+s.slice(1);}
  function yearLabel(settings){return settings.minYear===settings.maxYear?`Year ${settings.minYear}`:`Years ${settings.minYear}-${settings.maxYear}`;}
  function topicLabel(settings,topics){return (settings.topics||[]).map(id=>topics?.[id]?.label||id).join(' · ');}
  function safeName(s){return String(s||'games').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'games';}

  function wrap(text,maxWidth,size,bold=false){
    const words=clean(text).split(/\s+/).filter(Boolean),out=[];let line='';
    for(const word of words){
      const test=line?`${line} ${word}`:word;
      if(P.estimateTextWidth(test,size,bold)<=maxWidth || !line)line=test;
      else{out.push(line);line=word;}
    }
    if(line)out.push(line);return out;
  }
  function drawWrapped(page,x,y,text,maxWidth,size,opts={}){
    const lines=wrap(text,maxWidth,size,!!opts.bold),lh=opts.lineHeight||size*1.22,max=opts.maxLines||999;
    lines.slice(0,max).forEach((line,i)=>page.text(x,y+i*lh,line,size,opts));
    return Math.min(lines.length,max)*lh;
  }
  function fitText(page,x,y,text,maxWidth,size,opts={}){
    let s=size;while(s>4.5&&P.estimateTextWidth(clean(text),s,!!opts.bold)>maxWidth)s-=.25;
    page.text(x,y,text,s,opts);return s;
  }
  function box(page,x,y,w,h,fill=WHITE,stroke=LINE,width=.8){page.rect(x,y,w,h,{fill,stroke,width});}

  function drawPageHeader(page,title,subtitle,right){
    page.text(M,32,'99 CLUB STUDIO · MATHS GAMES & PUZZLES',8,{bold:true,color:INK});
    page.text(M,55,title,19,{bold:true,color:INK});
    if(subtitle)page.text(M,76,clean(subtitle),8,{color:MUTED});
    if(right)fitText(page,PAGE_W-M,58,clean(right),170,8,{bold:true,color:MUTED,align:'right'});
    page.line(M,94,PAGE_W-M,94,{color:LINE,width:1});
  }
  function drawFooter(page,left){
    page.line(M,PAGE_H-28,PAGE_W-M,PAGE_H-28,{color:[232,237,238],width:.6});
    page.text(M,PAGE_H-15,clean(left||'Generated locally'),5.8,{color:[130,145,149]});
    page.text(PAGE_W-M,PAGE_H-15,'techtinker.club/tools/99-club/games/',5.8,{color:[130,145,149],align:'right'});
  }

  function activityFrame(page,x,y,w,h,index,a){
    box(page,x,y,w,h,WHITE,LINE,.8);
    page.text(x+12,y+18,`ACTIVITY ${index}`,7,{bold:true,color:MUTED});
    page.text(x+12,y+37,clean(a.title||'Activity'),13,{bold:true,color:INK});
    page.text(x+w-12,y+19,cap(a.difficulty||''),7,{color:MUTED,align:'right'});
    return y+50;
  }

  function drawWordSearch(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);
    const instruction=a.mode==='definitions'?'Work out each maths word from its definition, then find it in the grid.':'Read each maths word and its meaning, then find the word in the grid.';
    drawWrapped(page,x+12,top, instruction,w-24,7,{color:MUTED,maxLines:2});
    const bodyY=top+24, bodyH=h-(bodyY-y)-12, leftW=Math.min(w*.54,bodyH), gap=14, rightX=x+12+leftW+gap, rightW=w-24-leftW-gap;
    const gridX=x+12, gridY=bodyY, size=a.size||a.grid?.length||12, cell=Math.min(leftW/size,bodyH/size), gridW=cell*size;
    const answerCells=new Set((a.placements||[]).flatMap(p=>(p.cells||[]).map(([cx,cy])=>`${cx}:${cy}`)));
    for(let gy=0;gy<size;gy++)for(let gx=0;gx<size;gx++){
      const hit=answers&&answerCells.has(`${gx}:${gy}`),cx=gridX+gx*cell,cy=gridY+gy*cell;
      page.rect(cx,cy,cell,cell,{fill:hit?HIT:WHITE,stroke:[190,206,208],width:.35});
      page.text(cx+cell/2,cy+cell*.68,clean(a.grid?.[gy]?.[gx]||''),Math.max(4.4,Math.min(8,cell*.48)),{bold:true,color:INK,align:'center'});
    }
    let cy=bodyY+2,fs=h<220?5.2:h<360?5.7:6.3,lh=fs*1.22;
    const entries=a.placements||[];
    for(let i=0;i<entries.length;i++){
      const p=entries[i],label=a.mode==='definitions'?`${i+1}. ${p.definition}`:`${i+1}. ${p.term} — ${p.definition}`;
      const lines=wrap(label,rightW,fs,false).slice(0,h<220?2:3);
      for(const line of lines){if(cy+lh>y+h-15)break;page.text(rightX,cy,line,fs,{color:DARK});cy+=lh;}
      cy+=1.5;if(cy>y+h-15)break;
    }
    if(answers&&cy<y+h-18){drawWrapped(page,rightX,cy+2,`Hidden words: ${entries.map(p=>p.term).join(', ')}`,rightW,fs,{bold:true,color:TEAL,maxLines:3});}
  }

  function drawPyramid(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);
    drawWrapped(page,x+12,top,`${a.instruction||'Each brick is the sum of the two bricks directly below it.'} Fill every empty brick.`,w-24,7,{color:MUTED,maxLines:2});
    const rows=a.rows||[],n=rows.length,maxCols=rows[n-1]?.length||n,bodyTop=top+28,availH=h-(bodyTop-y)-18,cellW=Math.min(58,(w-40)/maxCols),cellH=Math.min(34,availH/Math.max(1,n)),missing=new Set(a.missingSet||[]);
    let cy=bodyTop+Math.max(0,(availH-cellH*n)/2);
    rows.forEach((row,r)=>{const rowW=row.length*cellW,startX=x+w/2-rowW/2;row.forEach((v,c)=>{const blank=missing.has(`${r}:${c}`)&&!answers;page.rect(startX+c*cellW,cy,cellW-2,cellH-2,{fill:blank?PALE:WHITE,stroke:[107,137,140],width:.8});if(!blank)page.text(startX+c*cellW+(cellW-2)/2,cy+cellH*.62,String(v),Math.min(10,cellH*.38),{bold:true,color:INK,align:'center'});});cy+=cellH;});
  }

  function crosswordStarts(a){const map=new Map();for(const e of a.entries||[]){const k=`${e.x}:${e.y}`;if(!map.has(k))map.set(k,e.number);}return map;}
  function drawCrossword(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);
    drawWrapped(page,x+12,top,'Use the definitions to complete the crossword. Ignore spaces and punctuation in answers.',w-24,7,{color:MUTED,maxLines:2});
    const bodyY=top+28,bodyH=h-(bodyY-y)-12,gap=16,leftMax=w*.55,cols=a.width||a.grid?.[0]?.length||1,rows=a.height||a.grid?.length||1;
    const cell=Math.min(leftMax/cols,bodyH/rows,30),gridW=cell*cols,gridH=cell*rows,gridX=x+12+(leftMax-gridW)/2,gridY=bodyY+14,rightX=x+12+leftMax+gap,rightW=w-24-leftMax-gap,starts=crosswordStarts(a);
    // Freeform classroom criss-cross: draw only answer cells. Empty locations
    // remain plain white paper, avoiding heavy newspaper-style black blocks.
    for(let gy=0;gy<rows;gy++)for(let gx=0;gx<cols;gx++){
      const ch=a.grid?.[gy]?.[gx]||'';if(!ch)continue;
      const cx=gridX+gx*cell,cy=gridY+gy*cell;
      page.rect(cx,cy,cell,cell,{fill:WHITE,stroke:[83,103,109],width:.62});
      const num=starts.get(`${gx}:${gy}`);if(num)page.text(cx+1.7,cy+4.8,String(num),Math.max(3.4,Math.min(5.2,cell*.24)),{bold:true,color:MUTED});
      if(answers)page.text(cx+cell/2,cy+cell*.69,ch,Math.max(5.5,Math.min(10,cell*.48)),{bold:true,color:INK,align:'center'});
    }
    const across=(a.entries||[]).filter(e=>e.dir==='across'),down=(a.entries||[]).filter(e=>e.dir==='down');let cy=bodyY+3;
    const fs=h<220?5.0:h<360?5.7:6.8,lh=fs*1.22;
    const group=(label,items)=>{if(cy>y+h-18)return;page.text(rightX,cy,label,7,{bold:true,color:[46,87,86]});cy+=10;for(const e of items){const lines=wrap(`${e.number}. ${e.clue}`,rightW,fs,false).slice(0,h<220?2:3);for(const line of lines){if(cy+lh>y+h-14)return;page.text(rightX,cy,line,fs,{color:DARK});cy+=lh;}cy+=1.2;}cy+=4;};
    group('Across',across);group('Down',down);
    if(a.wordBank&&!answers&&cy<y+h-18)drawWrapped(page,rightX,cy,`Word bank: ${(a.entries||[]).map(e=>e.term).sort().join(', ')}`,rightW,fs,{bold:true,color:TEAL,maxLines:3});
  }

  function drawActivity(page,a,answers,x,y,w,h,index){
    if(a?.error){const top=activityFrame(page,x,y,w,h,index,a||{});drawWrapped(page,x+12,top,clean(a.error),w-24,8,{color:[140,70,60]});return;}
    if(a.engineId==='pyramid')return drawPyramid(page,a,answers,x,y,w,h,index);
    if(a.engineId==='crossword')return drawCrossword(page,a,answers,x,y,w,h,index);
    return drawWordSearch(page,a,answers,x,y,w,h,index);
  }

  function addSheetPage(doc,sheet,answers,settings,topics,seed){
    const page=doc.addPage({orientation:'portrait'}),subtitle=`${yearLabel(settings)} · ${topicLabel(settings,topics)}`;
    drawPageHeader(page,`${answers?'Teacher answers':'Pupil sheet'} ${sheet.index}`,subtitle,answers?'Answer key':'Name: ____________________');
    const acts=sheet.activities||[],count=Math.max(1,acts.length),bodyTop=110,bodyBottom=PAGE_H-42,gap=12,ah=(bodyBottom-bodyTop-gap*(count-1))/count,w=PAGE_W-2*M;
    acts.forEach((a,i)=>drawActivity(page,a,answers,M,bodyTop+i*(ah+gap),w,ah,i+1));
    drawFooter(page,`Generated locally · ${seed}`);
  }

  function drawWorkedExample(page,ex,x,y,w,h){
    box(page,x,y,w,h,[251,253,252],[201,220,218],.8);page.text(x+12,y+20,clean(ex.kind==='pyramid'?'Number Pyramid':ex.kind==='crossword'?'Maths Crossword':'Maths Word Search'),11,{bold:true,color:INK});let cy=y+39;
    if(ex.kind==='crossword'){
      cy+=drawWrapped(page,x+12,cy,`Clue: ${ex.clue}`,w-24,7,{color:DARK,maxLines:3})+8;
      const chars=String(ex.answer||'').split(''),cell=Math.min(24,(w-24)/Math.max(1,chars.length)),sx=x+w/2-chars.length*cell/2;chars.forEach((ch,i)=>{page.rect(sx+i*cell,cy,cell-1,cell-1,{fill:WHITE,stroke:[110,140,140],width:.7});page.text(sx+i*cell+(cell-1)/2,cy+cell*.65,ch,8,{bold:true,color:INK,align:'center'});});cy+=cell+10;
    }else if(ex.kind==='pyramid'){
      cy+=drawWrapped(page,x+12,cy,ex.explanation||'',w-24,7,{color:DARK,maxLines:3})+8;
      const rows=ex.rows||[],maxCols=rows.at(-1)?.length||3,cellW=Math.min(42,(w-36)/maxCols),cellH=26;rows.forEach(row=>{const sw=row.length*cellW,sx=x+w/2-sw/2;row.forEach((n,i)=>{page.rect(sx+i*cellW,cy,cellW-2,cellH-2,{fill:WHITE,stroke:[110,140,140],width:.7});page.text(sx+i*cellW+(cellW-2)/2,cy+17,String(n),8,{bold:true,color:INK,align:'center'});});cy+=cellH;});cy+=6;
    }else{
      const intro=ex.mode==='definitions'?`Definition: ${ex.definition}`:`${ex.term} — ${ex.definition}`;cy+=drawWrapped(page,x+12,cy,intro,w-24,7,{color:DARK,maxLines:3})+8;
      const size=ex.size||5,cell=Math.min(20,(w-40)/size,70/size),sx=x+w/2-size*cell/2;for(let gy=0;gy<size;gy++)for(let gx=0;gx<size;gx++){const hit=gy===ex.row&&gx>=ex.start&&gx<ex.start+String(ex.answer||'').length;page.rect(sx+gx*cell,cy+gy*cell,cell,cell,{fill:hit?HIT:WHITE,stroke:[190,206,208],width:.4});page.text(sx+gx*cell+cell/2,cy+gy*cell+cell*.68,ex.grid?.[gy]?.[gx]||'',Math.max(4,cell*.45),{bold:true,color:INK,align:'center'});}cy+=size*cell+8;
    }
    for(const step of ex.steps||[]){const used=drawWrapped(page,x+17,cy,`• ${step}`,w-30,6.5,{color:DARK,maxLines:2});cy+=used+3;if(cy>y+h-12)break;}
  }

  function addWorkedPage(doc,examples,settings,topics){
    if(!examples?.length)return;const page=doc.addPage({orientation:'portrait'});drawPageHeader(page,'Worked examples',`${yearLabel(settings)} · How to get started`,'Read these before you begin');
    const count=examples.length,cols=count===1?1:2,rows=Math.ceil(count/cols),gap=14,bodyTop=112,bodyBottom=PAGE_H-42,w=(PAGE_W-2*M-gap*(cols-1))/cols,h=(bodyBottom-bodyTop-gap*(rows-1))/rows;
    examples.forEach((ex,i)=>{const col=i%cols,row=Math.floor(i/cols);drawWorkedExample(page,ex,M+col*(w+gap),bodyTop+row*(h+gap),w,h);});drawFooter(page,'Worked examples use separate practice data');
  }

  function buildDocument(opts={}){
    const pack=opts.pack||{},settings=opts.settings||{},kind=['student','answers','both'].includes(opts.kind)?opts.kind:'student',topics=opts.topics||{},seed=opts.seed||pack.seed||'GAMES';
    const doc=new P.PDFDocument();
    if(kind==='student'||kind==='both'){
      if(settings.workedExamples==='front'&&pack.workedExamples?.length)addWorkedPage(doc,pack.workedExamples,settings,topics);
      for(const sheet of pack.sheets||[])addSheetPage(doc,sheet,false,settings,topics,seed);
    }
    if(kind==='answers'||kind==='both')for(const sheet of pack.sheets||[])addSheetPage(doc,sheet,true,settings,topics,seed);
    return doc;
  }
  function filename(settings,kind){
    const k=kind==='answers'?'answer-key':kind==='both'?'pupil-and-answers':'pupil-sheets',yr=settings.minYear===settings.maxYear?`y${settings.minYear}`:`y${settings.minYear}-${settings.maxYear}`;
    return `99-club-games-${yr}-${safeName(k)}.pdf`;
  }

  const api={buildDocument,filename,wrap};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.TT99GamesPDF=api;
}(typeof window!=='undefined'?window:globalThis));
