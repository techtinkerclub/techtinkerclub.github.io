/* 99 Club Studio · Maths Games & Puzzles PDF exporter
 * v1.3.0 — arithmetic games expansion renderers.
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
  function formatNumber(value){const n=Number(value);if(!Number.isFinite(n))return clean(value);const r=Math.round(n*1000)/1000;return Number.isInteger(r)?String(r):String(r).replace(/0+$/,'').replace(/\.$/,'');}
  function enumeration(term){const words=String(term||'').trim().split(/\s+/).filter(Boolean).map(word=>word.split('-').map(part=>(part.match(/[A-Za-z]/g)||[]).length).filter(Boolean).join('-')).filter(Boolean);return words.length?`(${words.join(', ')})`:'';}
  function needsEnumeration(term){return /[\s-]/.test(String(term||'').trim());}

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
      const p=entries[i],label=a.mode==='definitions'?`${i+1}. ${p.definition}${needsEnumeration(p.term)?` ${enumeration(p.term)}`:''}`:`${i+1}. ${p.term} — ${p.definition}`;
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
    const group=(label,items)=>{if(cy>y+h-18)return;page.text(rightX,cy,label,7,{bold:true,color:[46,87,86]});cy+=10;for(const e of items){const lines=wrap(`${e.number}. ${e.clue} ${e.enumeration||enumeration(e.term)}`,rightW,fs,false).slice(0,h<220?2:3);for(const line of lines){if(cy+lh>y+h-14)return;page.text(rightX,cy,line,fs,{color:DARK});cy+=lh;}cy+=1.2;}cy+=4;};
    group('Across',across);group('Down',down);
    if(a.wordBank&&!answers&&cy<y+h-18)drawWrapped(page,rightX,cy,`Word bank: ${(a.entries||[]).map(e=>e.term).sort().join(', ')}`,rightW,fs,{bold:true,color:TEAL,maxLines:3});
  }

  function drawMagicGrid(page,grid,x,y,maxW,maxH,opts={}){
    const n=grid?.length||3,cell=Math.min(maxW/n,maxH/n,opts.maxCell||48),gw=cell*n,gh=cell*n,sx=x+(maxW-gw)/2,sy=y+(maxH-gh)/2,highlight=opts.highlight||'';
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const v=grid?.[r]?.[c],key=`${r}:${c}`,isHighlight=highlight===key;
      page.rect(sx+c*cell,sy+r*cell,cell,cell,{fill:isHighlight?[232,247,243]:WHITE,stroke:[91,113,118],width:.75});
      if(v!==null&&v!==undefined&&v!=='')page.text(sx+c*cell+cell/2,sy+r*cell+cell*.64,formatNumber(v),Math.max(7,Math.min(13,cell*.34)),{bold:true,color:isHighlight?TEAL:INK,align:'center'});
      else if(opts.questionMarks)page.text(sx+c*cell+cell/2,sy+r*cell+cell*.64,'?',Math.max(7,Math.min(12,cell*.32)),{bold:true,color:MUTED,align:'center'});
    }
    return {x:sx,y:sy,w:gw,h:gh,cell};
  }
  function drawMagic(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a),typeLabel={missing:'Fill missing values',check:'Is it a magic square?',repair:'Spot & fix error',transform:'Transform square'}[a.puzzleType]||'Magic Square';
    drawWrapped(page,x+12,top,a.instruction||'Complete the magic square.',w-24,7,{color:MUTED,maxLines:2});
    const bodyY=top+28,bodyH=h-(bodyY-y)-14;
    if(a.puzzleType==='transform'){
      const gap=22,blockW=(w-36-gap)/2,gridH=bodyH-36,target=answers?a.solutionGrid:a.displayGrid;
      page.text(x+12,bodyY,'Starting square',6.6,{bold:true,color:DARK});
      drawMagicGrid(page,a.sourceGrid,x+12,bodyY+10,blockW,gridH,{maxCell:38});
      page.text(x+12+blockW+gap/2,bodyY+bodyH*.46,clean(a.transform?.label||'Transform'),6.3,{bold:true,color:TEAL,align:'center'});
      page.text(x+12+blockW+gap,bodyY,'New square',6.6,{bold:true,color:DARK});
      const right=drawMagicGrid(page,target,x+12+blockW+gap,bodyY+10,blockW,gridH,{maxCell:38});
      page.text(x+12+blockW+gap+blockW/2,right.y+right.h+13,answers?`New magic total: ${formatNumber(a.magicSum)}`:'New magic total: __________',6.2,{bold:true,color:answers?TEAL:MUTED,align:'center'});
      return;
    }
    const grid=a.puzzleType==='check'?a.displayGrid:(answers?a.solutionGrid:a.displayGrid),gridMax=Math.min(w*.58,bodyH),left=drawMagicGrid(page,grid,x+12,bodyY,gridMax,bodyH,{maxCell:h<230?34:50,highlight:answers&&a.puzzleType==='repair'?a.wrongCell:''}),sideX=x+24+gridMax,sideW=w-(sideX-x)-14;let sy=bodyY+10;
    page.text(sideX,sy,clean(typeLabel),7.5,{bold:true,color:DARK});sy+=16;
    if(a.puzzleType==='check'){
      if(answers)drawWrapped(page,sideX,sy,a.checkEvidence||'',sideW,7.0,{bold:true,color:TEAL,maxLines:4});
      else{page.text(sideX,sy,'Magic square?   Yes / No',7.2,{bold:true,color:INK});sy+=19;page.text(sideX,sy,'Evidence: ____________________',6.6,{color:MUTED});}
    }else if(a.puzzleType==='repair')drawWrapped(page,sideX,sy,answers?a.answerText:'Find the incorrect value and replace it.',sideW,7.0,{bold:true,color:answers?TEAL:INK,maxLines:4});
    else drawWrapped(page,sideX,sy,`Magic total: ${formatNumber(a.magicSum)}`,sideW,7.3,{bold:true,color:INK,maxLines:2});
  }

  function drawSudokuGrid(page,display,solution,answers,style,boxRows,boxCols,x,y,maxW,maxH,opts={}){
    const n=display?.length||4,cell=Math.min(maxW/n,maxH/n,opts.maxCell||52),gw=cell*n,gh=cell*n,sx=x+(maxW-gw)/2,sy=y+(maxH-gh)/2,boxR=boxRows||(n===9?3:2),boxC=boxCols||(n===9?3:n===6?3:2);
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const given=!!display[r][c],v=answers?(solution?.[r]?.[c]||display[r][c]):display[r][c],fill=answers&&!given?HIT:WHITE;
      page.rect(sx+c*cell,sy+r*cell,cell,cell,{fill,stroke:[142,161,164],width:.5});
      if(v)page.text(sx+c*cell+cell/2,sy+r*cell+cell*.65,String(v),Math.max(7,Math.min(13,cell*.36)),{bold:true,color:answers&&!given?TEAL:INK,align:'center'});
    }
    page.rect(sx,sy,gw,gh,{stroke:[73,99,105],width:1.4});
    if(style==='sudoku'){
      for(let c=boxC;c<n;c+=boxC)page.line(sx+c*cell,sy,sx+c*cell,sy+gh,{color:[73,99,105],width:1.4});
      for(let r=boxR;r<n;r+=boxR)page.line(sx,sy+r*cell,sx+gw,sy+r*cell,{color:[73,99,105],width:1.4});
    }
    return {x:sx,y:sy,w:gw,h:gh,cell};
  }
  function drawSudoku(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);
    drawWrapped(page,x+12,top,a.instruction||'Complete the grid.',w-24,7,{color:MUTED,maxLines:3});
    const bodyY=top+32,bodyH=h-(bodyY-y)-14;
    drawSudokuGrid(page,a.displayGrid,a.solutionGrid,answers,a.style,a.boxRows,a.boxCols,x+20,bodyY,w-40,bodyH,{maxCell:h<230?34:52});
  }

  function drawNodeBox(page,cx,cy,text,w=28,h=18,opts={}){page.rect(cx-w/2,cy-h/2,w,h,{fill:opts.fill||WHITE,stroke:opts.stroke||[92,119,124],width:opts.width||.7});page.text(cx,cy+3,clean(text==null?'?':text),Math.min(8,h*.42),{bold:true,color:opts.color||INK,align:'center'});}
  function drawArithmagon(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});const coords=a.shape==='square'?[[.18,.16],[.82,.16],[.82,.84],[.18,.84]]:[[.5,.10],[.86,.82],[.14,.82]],leftW=w*.68,bx=x+12,by=top+30,bh=h-(by-y)-12,bw=leftW-12,corners=answers?a.corners:a.displayCorners,edges=answers?a.edges:a.displayEdges;for(let i=0;i<coords.length;i++){const p=coords[i],q=coords[(i+1)%coords.length],px=bx+p[0]*bw,py=by+p[1]*bh,qx=bx+q[0]*bw,qy=by+q[1]*bh;page.line(px,py,qx,qy,{color:[88,115,120],width:1});drawNodeBox(page,(px+qx)/2,(py+qy)/2,edges[i],28,17,{fill:PALE,stroke:[105,159,151]});}coords.forEach((p,i)=>drawNodeBox(page,bx+p[0]*bw,by+p[1]*bh,corners[i],30,20));const sx=x+leftW+8;page.text(sx,by+12,'Rule',7,{bold:true,color:DARK});drawWrapped(page,sx,by+25,a.operation==='add'?'Side = corner + corner':'Side = corner x corner',w-leftW-20,6.5,{color:TEAL,bold:true,maxLines:2});}

  function drawMagicShape(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});const bx=x+12,by=top+32,bw=w*.68,bh=h-(by-y)-12,vals=answers&&a.puzzleType!=='check'?a.solutionValues:a.displayValues;for(const line of a.lines||[]){const p=a.coords[line[0]],q=a.coords[line[line.length-1]];page.line(bx+p[0]*bw,by+p[1]*bh,bx+q[0]*bw,by+q[1]*bh,{color:[88,115,120],width:1});}a.coords.forEach((p,i)=>drawNodeBox(page,bx+p[0]*bw,by+p[1]*bh,vals[i],24,17,{fill:answers&&a.brokenIndex===i?[255,244,239]:WHITE,stroke:answers&&a.brokenIndex===i?[185,115,97]:[92,119,124]}));const sx=x+w*.72;page.text(sx,by+12,a.puzzleType==='check'?'Check':'Magic total',7,{bold:true,color:DARK});if(a.puzzleType==='check'){drawWrapped(page,sx,by+26,answers?(a.isMagic?'Yes - it is magic.':`No. Line totals: ${(a.lineSums||[]).join(', ')}`):'Magic?  Yes / No',w*.25,6.2,{color:answers?TEAL:INK,bold:true,maxLines:5});}else page.text(sx,by+28,formatNumber(a.target),10,{bold:true,color:TEAL});}

  function drawMaze(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.4,{color:MUTED,maxLines:2});
    const bodyY=top+31,bodyH=h-(bodyY-y)-10,size=a.size||5,gridAvailW=w*.48,cell=Math.min((gridAvailW-8)/size,(bodyH-4)/size,42),gridW=cell*size,gx=x+14+(gridAvailW-gridW)/2,gy=bodyY+Math.max(0,(bodyH-gridW)/2),route=new Map((a.path||[]).map((p,i)=>[`${p[0]}:${p[1]}`,i]));
    for(let r=0;r<size;r++)for(let c=0;c<size;c++){
      const cellData=a.grid?.[r]?.[c],key=`${c}:${r}`,onRoute=route.has(key),fill=answers&&onRoute?HIT:WHITE,stroke=cellData?.kind==='start'||cellData?.kind==='finish'?[68,126,120]:[158,178,181];
      page.rect(gx+c*cell,gy+r*cell,cell,cell,{fill,stroke,width:cellData?.kind==='start'||cellData?.kind==='finish'?1:.55});
      if(!cellData)continue;
      const label=cellData.kind==='start'?'START':cellData.kind==='finish'?'FINISH':formatNumber(cellData.value),fs=cellData.kind==='start'||cellData.kind==='finish'?Math.max(3.5,Math.min(5.3,cell*.16)):Math.max(4.8,Math.min(7.2,cell*.25));
      fitText(page,gx+c*cell+cell/2,gy+r*cell+cell*.62,label,cell-5,fs,{bold:true,color:cellData.kind==='start'||cellData.kind==='finish'?TEAL:INK,align:'center'});
      if(answers&&cellData.kind==='answer'&&cellData.step)page.text(gx+c*cell+2.4,gy+r*cell+6,String(cellData.step),3.8,{bold:true,color:TEAL});
    }
    const qx=x+gridAvailW+22,qw=w-gridAvailW-35;page.text(qx,bodyY+7,'Questions',6.2,{bold:true,color:DARK});
    const noteH=8,usableQH=Math.max(32,bodyH-22-noteH),qh=usableQH/Math.max(1,a.steps.length),qfs=Math.max(3.5,Math.min(5.4,qh*.48));let cy=bodyY+14;
    for(let i=0;i<a.steps.length;i++){
      const st=a.steps[i],baseline=cy+Math.min(qh*.66,qfs+1.1);page.text(qx,baseline,`${i+1}.`,Math.max(3.4,qfs-.15),{bold:true,color:TEAL});
      fitText(page,qx+12,baseline,clean(st.question),qw-(answers?43:14),qfs,{bold:true,color:DARK});
      if(answers)fitText(page,qx+qw-2,baseline,formatNumber(st.answer),28,qfs,{bold:true,color:TEAL,align:'right'});
      cy+=qh;
    }
    page.text(qx,bodyY+bodyH-2,answers?'Highlighted cells = route':'Only up / down / left / right',Math.max(3.6,Math.min(4.4,qfs)),{color:MUTED});
  }

  function crossStarts(a){const m=new Map();for(const e of a.entries||[]){const k=`${e.x}:${e.y}`;if(!m.has(k))m.set(k,e.number);}return m;}
  function drawCrossnumber(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.8,{color:MUTED,maxLines:2});const bodyY=top+28,bodyH=h-(bodyY-y)-12,leftMax=w*.52,gap=14,cols=a.width||1,rows=a.height||1,cell=Math.min(leftMax/cols,bodyH/rows,28),gw=cell*cols,gh=cell*rows,gx=x+12+(leftMax-gw)/2,gy=bodyY+(bodyH-gh)/2,starts=crossStarts(a);for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const ch=a.grid?.[r]?.[c];if(!ch)continue;const cx=gx+c*cell,cy=gy+r*cell;page.rect(cx,cy,cell,cell,{fill:WHITE,stroke:[83,103,109],width:.6});const n=starts.get(`${c}:${r}`);if(n)page.text(cx+1.5,cy+4.5,String(n),3.7,{bold:true,color:MUTED});if(answers)page.text(cx+cell/2,cy+cell*.68,ch,Math.max(5.5,Math.min(9,cell*.46)),{bold:true,color:INK,align:'center'});}const rx=x+12+leftMax+gap,rw=w-24-leftMax-gap;let cy=bodyY+3;for(const [label,list] of [['Across',a.entries.filter(e=>e.dir==='across')],['Down',a.entries.filter(e=>e.dir==='down')]]){page.text(rx,cy,label,6.8,{bold:true,color:[46,87,86]});cy+=9;for(const e of list){cy+=drawWrapped(page,rx,cy,`${e.number}. ${e.clue}`,rw,5.6,{color:DARK,maxLines:2})+1;if(cy>y+h-16)break;}cy+=3;}}

  function drawNumberTrail(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.8,{color:MUTED,maxLines:2});const vals=answers?a.values:a.displayValues,cols=a.values.length<=12?4:5,rows=Math.ceil(vals.length/cols),bodyY=top+30,cellW=(w-32)/cols,cellH=Math.min(38,(h-(bodyY-y)-12)/rows);vals.forEach((v,i)=>{const r=Math.floor(i/cols),cc=i%cols,c=r%2===0?cc:cols-1-cc,cx=x+16+c*cellW,cy=bodyY+r*cellH;page.rect(cx,cy,cellW-4,cellH-4,{fill:WHITE,stroke:[151,177,180],width:.6});page.text(cx+3,cy+7,String(i+1),4,{bold:true,color:MUTED});if(v!=null)page.text(cx+(cellW-4)/2,cy+cellH*.62,formatNumber(v),7.5,{bold:true,color:INK,align:'center'});});}

  function drawTarget(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.5,{color:MUTED,maxLines:2});let cy=top+30,rowH=(h-(cy-y)-14)/a.challenges.length;for(let i=0;i<a.challenges.length;i++){const c=a.challenges[i];page.text(x+16,cy+12,`${i+1}.`,6.5,{bold:true,color:TEAL});let xx=x+38;c.numbers.forEach(n=>{page.rect(xx,cy,24,22,{fill:WHITE,stroke:[166,185,188],width:.6});page.text(xx+12,cy+15,String(n),7,{bold:true,color:INK,align:'center'});xx+=29;});page.text(x+w*.55,cy+14,`Target ${c.target}`,7,{bold:true,color:DARK});drawWrapped(page,x+w*.70,cy+5,answers?c.solution:'________________',w*.26,6.2,{color:answers?TEAL:MUTED,bold:answers,maxLines:2});cy+=rowH;}page.text(x+16,y+h-12,`Allowed: ${a.allowedOps.join(' ')}`,5.7,{color:MUTED});}

  function drawBrokenCalc(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.5,{color:MUTED,maxLines:2});let xx=x+16,ky=top+34;for(const k of a.keys){page.rect(xx,ky,27,24,{fill:[248,251,250],stroke:[117,143,147],width:.6});page.text(xx+13.5,ky+16,clean(k),7.3,{bold:true,color:INK,align:'center'});xx+=32;}let cy=ky+34;for(let i=0;i<a.targets.length;i++){const t=a.targets[i];page.text(x+18,cy+10,`${i+1}. Make ${t.target}`,7,{bold:true,color:DARK});page.text(x+w*.44,cy+10,answers?clean(t.solution):'____________________________',6.5,{color:answers?TEAL:MUTED,bold:answers});cy+=24;}}

  function drawSymbols(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.8,{color:MUTED,maxLines:2});let cy=top+32;for(const e of a.equations){page.rect(x+w*.20,cy,w*.60,27,{fill:WHITE,stroke:[214,226,227],width:.6});page.text(x+w/2,cy+18,clean(e.text),9,{bold:true,color:INK,align:'center'});cy+=34;}let xx=x+w*.25;for(let i=0;i<a.names.length;i++){page.text(xx,cy+12,`${a.names[i]} = ${answers?a.values[i]:'____'}`,8,{bold:true,color:answers?TEAL:DARK});xx+=w*.18;}}

  function drawDomino(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.4,{color:MUTED,maxLines:2});const list=answers?a.ordered:a.dominoes,cols=2,rows=Math.ceil(list.length/cols),bodyY=top+30,cw=(w-34)/2,ch=Math.min(42,(h-(bodyY-y)-10)/rows);list.forEach((d,i)=>{const r=Math.floor(i/2),c=i%2,cx=x+14+c*(cw+6),cy=bodyY+r*ch;page.rect(cx,cy,cw,ch-5,{fill:WHITE,stroke:[96,125,130],width:.7});page.line(cx+cw*.38,cy,cx+cw*.38,cy+ch-5,{color:[153,174,177],width:.5});fitText(page,cx+cw*.19,cy+ch*.58,clean(d.left),cw*.34,6.2,{bold:true,color:INK,align:'center'});drawWrapped(page,cx+cw*.42,cy+6,clean(d.right),cw*.54,5.7,{bold:true,color:DARK,maxLines:2});if(answers)page.text(cx+3,cy+6,String(i+1),4,{bold:true,color:TEAL});});}

  function drawOperationGrid(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.8,{color:MUTED,maxLines:2});let cy=top+31,rowH=(h-(cy-y)-12)/a.rows.length;for(const r of a.rows){let text=r.text;if(answers)for(const op of r.ops)text=text.replace('□',op);page.rect(x+w*.16,cy,w*.68,Math.min(30,rowH-4),{fill:WHITE,stroke:[216,227,228],width:.5});page.text(x+w/2,cy+Math.min(20,rowH*.62),clean(text),8.2,{bold:true,color:answers?TEAL:INK,align:'center'});cy+=rowH;}}

  function drawNumberWheels(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.5,{color:MUTED,maxLines:2});const bodyY=top+31,bodyH=h-(bodyY-y)-10;
    if(a.style==='wheel'){
      const cols=a.items.length<=3?Math.min(3,a.items.length):2,rows=Math.ceil(a.items.length/cols),slotW=(w-28-(cols-1)*8)/cols,slotH=bodyH/rows;
      a.items.forEach((it,i)=>{const r=Math.floor(i/cols),c=i%cols,cx=x+14+c*(slotW+8)+slotW/2,cy=bodyY+r*slotH+slotH/2,n=it.inputs.length,rad=Math.min(slotW,slotH)*.36,innerR=rad*.56;for(let j=0;j<n;j++){const ang=-Math.PI/2+j*2*Math.PI/n,ix=cx+Math.cos(ang)*innerR,iy=cy+Math.sin(ang)*innerR,ox=cx+Math.cos(ang)*rad,oy=cy+Math.sin(ang)*rad;page.line(ix,iy,ox,oy,{color:[177,194,196],width:.55});drawNodeBox(page,ix,iy,it.inputs[j],18,14,{stroke:[140,165,168],width:.5});drawNodeBox(page,ox,oy,answers?it.outputs[j]:(it.displayOutputs[j]??'?'),22,15,{fill:answers?WHITE:PALE,stroke:[104,158,151],width:.55});}drawNodeBox(page,cx,cy,clean(it.rule),34,25,{fill:[234,247,244],stroke:[76,132,126],color:TEAL,width:.8});});
    }else if(a.style==='factor'){
      const cols=a.items.length>=5?3:a.items.length<=3?Math.min(3,a.items.length):2,rows=Math.ceil(a.items.length/cols),slotW=(w-28-(cols-1)*8)/cols,slotH=bodyH/rows;
      a.items.forEach((it,i)=>{const r=Math.floor(i/cols),c=i%cols,cx=x+14+c*(slotW+8)+slotW/2,cy=bodyY+r*slotH+slotH/2,pairs=it.pairs||[],n=Math.max(3,pairs.length),nodeW=Math.min(36,slotW*.24),nodeH=13,centreW=Math.min(36,slotW*.25),rad=Math.max(23,Math.min(slotW*.31,slotH*.34));for(let j=0;j<n;j++){const ang=-Math.PI/2+j*2*Math.PI/n,px=cx+Math.cos(ang)*rad,py=cy+Math.sin(ang)*rad;page.line(cx,cy,px,py,{color:[187,202,204],width:.5});const label=answers&&pairs[j]?`${pairs[j][0]} x ${pairs[j][1]}`:'__ x __';drawNodeBox(page,px,py,label,nodeW,nodeH,{fill:WHITE,stroke:[133,165,165],width:.45});}drawNodeBox(page,cx,cy,String(it.centre),centreW,24,{fill:[226,245,241],stroke:[76,132,126],color:TEAL,width:.7});page.text(cx,cy-4,'FACTORS',3.7,{bold:true,color:MUTED,align:'center'});});
    }else{
      const cols=3,cw=(w-42)/3,rows=Math.ceil(a.items.length/3),ch=bodyH/rows;a.items.forEach((it,i)=>{const r=Math.floor(i/3),c=i%3,cx=x+14+c*(cw+7),cy=bodyY+r*ch,midX=cx+cw/2,midY=cy+ch/2;page.line(midX,cy+5,cx+cw-8,midY,{color:[102,129,133],width:.8});page.line(cx+cw-8,midY,midX,cy+ch-8,{color:[102,129,133],width:.8});page.line(midX,cy+ch-8,cx+8,midY,{color:[102,129,133],width:.8});page.line(cx+8,midY,midX,cy+5,{color:[102,129,133],width:.8});const topV=answers||it.hide!=='top'?it.top:'?',botV=answers||it.hide!=='bottom'?it.bottom:'?',l=answers||it.hide!=='sides'?it.left:'?',rr=answers||it.hide!=='sides'?it.right:'?';page.text(midX,cy+11,formatNumber(topV),6.5,{bold:true,color:INK,align:'center'});page.text(midX,cy+ch-10,formatNumber(botV),6.5,{bold:true,color:INK,align:'center'});page.text(cx+15,midY+2,formatNumber(l),6.5,{bold:true,color:INK});page.text(cx+cw-15,midY+2,formatNumber(rr),6.5,{bold:true,color:INK,align:'right'});});
    }
  }

  function drawFunctionMachine(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.5,{color:MUTED,maxLines:2});const rule=a.operations.map(o=>`${o.op} ${o.value}`).join(' -> ');page.text(x+w/2,top+34,clean(`INPUT -> ${rule} -> OUTPUT`),7.2,{bold:true,color:TEAL,align:'center'});const tableW=Math.min(260,w*.62),tx=x+w/2-tableW/2,ty=top+48,rowH=Math.min(28,(h-(ty-y)-12)/(a.rows.length+1));page.rect(tx,ty,tableW,rowH,{fill:[240,247,246],stroke:[167,188,190],width:.6});page.text(tx+tableW*.25,ty+rowH*.65,'Input',6.5,{bold:true,color:DARK,align:'center'});page.text(tx+tableW*.75,ty+rowH*.65,'Output',6.5,{bold:true,color:DARK,align:'center'});page.line(tx+tableW/2,ty,tx+tableW/2,ty+rowH*(a.rows.length+1),{color:[167,188,190],width:.6});for(let i=0;i<a.rows.length;i++){const r=a.rows[i],cy=ty+rowH*(i+1);page.rect(tx,cy,tableW,rowH,{fill:WHITE,stroke:[195,210,212],width:.45});page.text(tx+tableW*.25,cy+rowH*.65,answers||r.hide!=='input'?formatNumber(r.input):'____',6.5,{bold:true,color:INK,align:'center'});page.text(tx+tableW*.75,cy+rowH*.65,answers||r.hide!=='output'?formatNumber(r.output):'____',6.5,{bold:true,color:INK,align:'center'});}}

  function drawBalance(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.8,{color:MUTED,maxLines:2});let cy=top+32,rowH=(h-(cy-y)-12)/a.rows.length;for(const r of a.rows){page.rect(x+w*.15,cy,w*.70,Math.min(30,rowH-4),{fill:WHITE,stroke:[216,227,228],width:.5});page.text(x+w/2,cy+Math.min(20,rowH*.62),clean(answers?r.solution:r.display),8.2,{bold:true,color:answers?TEAL:INK,align:'center'});cy+=rowH;}}

  function drawArithmeticActivity(page,a,answers,x,y,w,h,index){if(a.engineId==='arithmagon')return drawArithmagon(page,a,answers,x,y,w,h,index);if(a.engineId==='magicshape')return drawMagicShape(page,a,answers,x,y,w,h,index);if(a.engineId==='maze')return drawMaze(page,a,answers,x,y,w,h,index);if(a.engineId==='crossnumber')return drawCrossnumber(page,a,answers,x,y,w,h,index);if(a.engineId==='numbertrail')return drawNumberTrail(page,a,answers,x,y,w,h,index);if(a.engineId==='target')return drawTarget(page,a,answers,x,y,w,h,index);if(a.engineId==='brokencalc')return drawBrokenCalc(page,a,answers,x,y,w,h,index);if(a.engineId==='symbols')return drawSymbols(page,a,answers,x,y,w,h,index);if(a.engineId==='domino')return drawDomino(page,a,answers,x,y,w,h,index);if(a.engineId==='operationgrid')return drawOperationGrid(page,a,answers,x,y,w,h,index);if(a.engineId==='numberwheels')return drawNumberWheels(page,a,answers,x,y,w,h,index);if(a.engineId==='functionmachine')return drawFunctionMachine(page,a,answers,x,y,w,h,index);if(a.engineId==='balance')return drawBalance(page,a,answers,x,y,w,h,index);}

  function drawActivity(page,a,answers,x,y,w,h,index){
    if(a?.error){const top=activityFrame(page,x,y,w,h,index,a||{});drawWrapped(page,x+12,top,clean(a.error),w-24,8,{color:[140,70,60]});return;}
    if(a.engineId==='pyramid')return drawPyramid(page,a,answers,x,y,w,h,index);
    if(a.engineId==='crossword')return drawCrossword(page,a,answers,x,y,w,h,index);
    if(a.engineId==='magic')return drawMagic(page,a,answers,x,y,w,h,index);
    if(a.engineId==='sudoku')return drawSudoku(page,a,answers,x,y,w,h,index);
    if(['arithmagon','magicshape','maze','crossnumber','numbertrail','target','brokencalc','symbols','domino','operationgrid','numberwheels','functionmachine','balance'].includes(a.engineId))return drawArithmeticActivity(page,a,answers,x,y,w,h,index);
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
    box(page,x,y,w,h,[251,253,252],[201,220,218],.8);
    const title=clean(ex.title||'Worked example').replace(/ worked example$/i,'');page.text(x+12,y+21,title,13,{bold:true,color:INK});let cy=y+42;
    if(ex.goal){cy+=drawWrapped(page,x+12,cy,`Goal: ${ex.goal}`,w-24,8.4,{bold:true,color:DARK,maxLines:2})+9;}
    if(ex.kind==='crossword'){
      cy+=drawWrapped(page,x+12,cy,`Clue: ${ex.clue} ${ex.enumeration||enumeration(ex.term)}`,w-24,8.0,{color:DARK,maxLines:2})+8;
      const chars=String(ex.answer||'').split(''),cell=Math.min(22,(w-28)/Math.max(1,chars.length)),sx=x+w/2-chars.length*cell/2;chars.forEach((ch,i)=>{page.rect(sx+i*cell,cy,cell-1,cell-1,{fill:WHITE,stroke:[110,140,140],width:.7});page.text(sx+i*cell+(cell-1)/2,cy+cell*.65,ch,8,{bold:true,color:INK,align:'center'});});cy+=cell+8;
    }else if(ex.kind==='pyramid'){
      const rows=ex.rows||[],maxCols=rows.at(-1)?.length||3,cellW=Math.min(38,(w-40)/maxCols),cellH=23;rows.forEach((row,r)=>{const sw=row.length*cellW,sx=x+w/2-sw/2;row.forEach((n,i)=>{const miss=ex.exampleMissing===`${r}:${i}`;page.rect(sx+i*cellW,cy,cellW-2,cellH-2,{fill:miss?PALE:WHITE,stroke:[110,140,140],width:.7});page.text(sx+i*cellW+(cellW-2)/2,cy+15,miss?'?':String(n),8,{bold:true,color:INK,align:'center'});});cy+=cellH;});cy+=6;
    }else if(ex.kind==='magic'){
      page.text(x+12,cy,`Magic total: ${formatNumber(ex.magicSum)}`,8.2,{bold:true,color:TEAL});cy+=8;const g=drawMagicGrid(page,ex.displayGrid,x+w/2-82,cy,164,98,{maxCell:32,questionMarks:true});cy+=g.h+7;
    }else if(ex.kind==='sudoku'){
      const g=drawSudokuGrid(page,ex.displayGrid,ex.solutionGrid,false,ex.style,ex.boxRows,ex.boxCols,x+w/2-78,cy,156,102,{maxCell:25});cy+=g.h+7;
    }else if(['arithmagon','magicshape','maze','crossnumber','numbertrail','target','brokencalc','symbols','domino','operationgrid','numberwheels','functionmachine','balance'].includes(ex.kind)){
      box(page,x+12,cy,w-24,26,[243,250,248],[211,231,227],.6);page.text(x+20,cy+11,clean(ex.title||'Worked example').replace(/ worked example$/i,''),7.7,{bold:true,color:[40,93,89]});page.text(x+20,cy+22,'Follow the worked steps below, then try the generated activity.',6.8,{color:MUTED});cy+=36;
    }else{
      const intro=ex.mode==='definitions'?`Definition: ${ex.definition}${needsEnumeration(ex.term)?` ${ex.enumeration||enumeration(ex.term)}`:''}`:`${ex.term} - ${ex.definition}`;cy+=drawWrapped(page,x+12,cy,intro,w-24,8.0,{color:DARK,maxLines:2})+8;
      const size=ex.size||5,cell=Math.min(20,(w-50)/size,92/size),sx=x+w/2-size*cell/2;for(let gy=0;gy<size;gy++)for(let gx=0;gx<size;gx++){const hit=gy===ex.row&&gx>=ex.start&&gx<ex.start+String(ex.answer||'').length;page.rect(sx+gx*cell,cy+gy*cell,cell,cell,{fill:hit?HIT:WHITE,stroke:[190,206,208],width:.4});page.text(sx+gx*cell+cell/2,cy+gy*cell+cell*.68,ex.grid?.[gy]?.[gx]||'',Math.max(3.8,cell*.42),{bold:true,color:INK,align:'center'});}cy+=size*cell+6;
    }
    if(ex.rules?.length){page.text(x+12,cy,'Rules',8.2,{bold:true,color:[46,87,86]});cy+=12;for(const rule of ex.rules){cy+=drawWrapped(page,x+17,cy,`- ${rule}`,w-30,7.4,{color:DARK,maxLines:2})+3;if(cy>y+h-100)break;}cy+=3;}
    if(ex.steps?.length&&cy<y+h-70){page.text(x+12,cy,'Worked steps',8.2,{bold:true,color:[46,87,86]});cy+=12;for(let i=0;i<ex.steps.length;i++){cy+=drawWrapped(page,x+17,cy,`${i+1}. ${ex.steps[i]}`,w-30,7.4,{color:DARK,maxLines:2})+3;if(cy>y+h-60)break;}cy+=3;}
    if(ex.tip&&cy<y+h-35){cy+=drawWrapped(page,x+12,cy,`Tip: ${ex.tip}`,w-24,7.2,{bold:true,color:TEAL,maxLines:2})+3;}
    if(ex.commonMistake&&cy<y+h-18)drawWrapped(page,x+12,cy,`Watch out: ${ex.commonMistake}`,w-24,7.0,{bold:true,color:[130,84,60],maxLines:2});
  }

  function addWorkedPages(doc,examples,settings,topics){
    if(!examples?.length)return;const perPage=2,totalPages=Math.ceil(examples.length/perPage);
    for(let start=0,pageNo=0;start<examples.length;start+=perPage,pageNo++){
      const chunk=examples.slice(start,start+perPage),page=doc.addPage({orientation:'portrait'});drawPageHeader(page,totalPages>1?`Worked examples ${pageNo+1}`:'Worked examples',`${yearLabel(settings)} · How to get started`,'Read these before you begin');
      const gap=14,bodyTop=112,bodyBottom=PAGE_H-42,w=PAGE_W-2*M,h=(bodyBottom-bodyTop-gap*(chunk.length-1))/chunk.length;chunk.forEach((ex,i)=>drawWorkedExample(page,ex,M,bodyTop+i*(h+gap),w,h));drawFooter(page,'Worked examples use separate practice data');
    }
  }

  function buildDocument(opts={}){
    const pack=opts.pack||{},settings=opts.settings||{},kind=['student','answers','both'].includes(opts.kind)?opts.kind:'student',topics=opts.topics||{},seed=opts.seed||pack.seed||'GAMES';
    const doc=new P.PDFDocument();
    if(kind==='student'||kind==='both'){
      if(settings.workedExamples==='front'&&pack.workedExamples?.length)addWorkedPages(doc,pack.workedExamples,settings,topics);
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
