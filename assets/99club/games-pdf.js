/* 99 Club Studio · Maths Games & Puzzles PDF exporter
 * v1.6.0 — mixed-difficulty packs + vocabulary layout refinements.
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

  // Small vector helpers used by Games PDF renderers.  The browser preview uses
  // circles/rounded slots heavily; drawing equivalent geometry here keeps the
  // exported worksheet recognisably the same instead of falling back to boxes.
  function pdfN(v){return Number(v).toFixed(2).replace(/\.00$/,'');}
  function pdfRgb(c){return c.map(v=>Math.max(0,Math.min(255,v))/255).map(pdfN).join(' ');}
  function rawPath(page,parts,opts={}){
    const out=[];if(opts.fill)out.push(`${pdfRgb(opts.fill)} rg`);if(opts.stroke)out.push(`${pdfRgb(opts.stroke)} RG`);out.push(`${pdfN(opts.width||.7)} w`,...parts);out.push(opts.fill&&opts.stroke?'B':opts.fill?'f':'S');page.c.push(out.join(' '));
  }
  function drawCircle(page,cx,cy,r,opts={}){
    if(!page?.c)return page.rect(cx-r,cy-r,r*2,r*2,{fill:opts.fill,stroke:opts.stroke,width:opts.width});
    const k=r*.5522847498,Y=page.height-cy;
    rawPath(page,[`${pdfN(cx+r)} ${pdfN(Y)} m`,`${pdfN(cx+r)} ${pdfN(Y+k)} ${pdfN(cx+k)} ${pdfN(Y+r)} ${pdfN(cx)} ${pdfN(Y+r)} c`,`${pdfN(cx-k)} ${pdfN(Y+r)} ${pdfN(cx-r)} ${pdfN(Y+k)} ${pdfN(cx-r)} ${pdfN(Y)} c`,`${pdfN(cx-r)} ${pdfN(Y-k)} ${pdfN(cx-k)} ${pdfN(Y-r)} ${pdfN(cx)} ${pdfN(Y-r)} c`,`${pdfN(cx+k)} ${pdfN(Y-r)} ${pdfN(cx+r)} ${pdfN(Y-k)} ${pdfN(cx+r)} ${pdfN(Y)} c`,'h'],opts);
  }
  function drawRoundRect(page,x,topY,w,h,r,opts={}){
    if(!page?.c)return page.rect(x,topY,w,h,{fill:opts.fill,stroke:opts.stroke,width:opts.width});
    r=Math.max(0,Math.min(r,w/2,h/2));const k=r*.5522847498,y0=page.height-topY-h,y1=y0+h,x0=x,x1=x+w;
    rawPath(page,[`${pdfN(x0+r)} ${pdfN(y0)} m`,`${pdfN(x1-r)} ${pdfN(y0)} l`,`${pdfN(x1-r+k)} ${pdfN(y0)} ${pdfN(x1)} ${pdfN(y0+r-k)} ${pdfN(x1)} ${pdfN(y0+r)} c`,`${pdfN(x1)} ${pdfN(y1-r)} l`,`${pdfN(x1)} ${pdfN(y1-r+k)} ${pdfN(x1-r+k)} ${pdfN(y1)} ${pdfN(x1-r)} ${pdfN(y1)} c`,`${pdfN(x0+r)} ${pdfN(y1)} l`,`${pdfN(x0+r-k)} ${pdfN(y1)} ${pdfN(x0)} ${pdfN(y1-r+k)} ${pdfN(x0)} ${pdfN(y1-r)} c`,`${pdfN(x0)} ${pdfN(y0+r)} l`,`${pdfN(x0)} ${pdfN(y0+r-k)} ${pdfN(x0+r-k)} ${pdfN(y0)} ${pdfN(x0+r)} ${pdfN(y0)} c`,'h'],opts);
  }
  function drawDashedLine(page,x1,y1,x2,y2,opts={}){
    if(!page?.c)return page.line(x1,y1,x2,y2,opts);const yy1=page.height-y1,yy2=page.height-y2,dash=opts.dash||[4,3];page.c.push(`${opts.color?pdfRgb(opts.color)+' RG ':''}${pdfN(opts.width||.7)} w [${dash.map(pdfN).join(' ')}] 0 d ${pdfN(x1)} ${pdfN(yy1)} m ${pdfN(x2)} ${pdfN(yy2)} l S [] 0 d`);
  }
  // The tiny PDF writer intentionally uses a rough text-width estimator for
  // general layout.  That is fine for paragraphs but not for diagram centres:
  // Helvetica's digits are all 556 units wide, while the rough estimator treats
  // '1' as unusually narrow.  Use standard Helvetica AFM widths for diagram
  // labels/numbers so circles and axis labels are genuinely centred.
  const HELV_BOLD_UPPER={A:722,B:722,C:722,D:722,E:667,F:611,G:778,H:722,I:278,J:556,K:722,L:611,M:833,N:722,O:778,P:667,Q:778,R:722,S:667,T:611,U:722,V:722,W:1000,X:722,Y:722,Z:667};
  const HELV_UPPER={A:667,B:667,C:722,D:722,E:667,F:611,G:778,H:722,I:278,J:500,K:667,L:556,M:833,N:722,O:778,P:667,Q:778,R:722,S:667,T:611,U:722,V:667,W:944,X:667,Y:667,Z:611};
  const HELV_BOLD_LOWER={a:556,b:611,c:556,d:611,e:556,f:333,g:611,h:611,i:278,j:278,k:556,l:278,m:889,n:611,o:611,p:611,q:611,r:389,s:556,t:333,u:611,v:556,w:778,x:556,y:556,z:500};
  const HELV_LOWER={a:556,b:556,c:500,d:556,e:556,f:278,g:556,h:556,i:222,j:222,k:500,l:222,m:833,n:556,o:556,p:556,q:556,r:333,s:500,t:278,u:556,v:500,w:722,x:500,y:500,z:500};
  function diagramGlyphWidth(ch,bold){
    if(ch>='0'&&ch<='9')return 556;
    if(ch===' ')return 278;
    if(ch==='+'||ch==='-'||ch==='='||ch==='×')return 584;
    if(ch==='.'||ch===','||ch===':'||ch===';')return 278;
    if(ch==='/'||ch==='\\')return 278;
    if(ch==='('||ch===')')return 333;
    const upper=(bold?HELV_BOLD_UPPER:HELV_UPPER)[ch];if(upper)return upper;
    const lower=(bold?HELV_BOLD_LOWER:HELV_LOWER)[ch];if(lower)return lower;
    return bold?556:500;
  }
  function diagramTextWidth(text,size,bold=true){return [...clean(text)].reduce((sum,ch)=>sum+diagramGlyphWidth(ch,bold),0)*size/1000;}
  function diagramText(page,cx,baseline,text,size,opts={}){
    const value=clean(text),bold=!!opts.bold,w=diagramTextWidth(value,size,bold),o={...opts};delete o.align;page.text(cx-w/2,baseline,value,size,o);return w;
  }
  function fitDiagramText(page,cx,baseline,text,maxWidth,size,opts={}){
    let fs=size;while(fs>4.2&&diagramTextWidth(text,fs,!!opts.bold)>maxWidth)fs-=.25;diagramText(page,cx,baseline,text,fs,opts);return fs;
  }
  function drawCircleNode(page,cx,cy,text,r,opts={}){
    drawCircle(page,cx,cy,r,{fill:opts.fill||WHITE,stroke:opts.stroke||[92,119,124],width:opts.width||.8});
    if(text!==null&&text!==undefined&&text!==''){const fs=opts.fontSize||Math.max(6,Math.min(12,r*.62));diagramText(page,cx,cy+fs*.36,clean(text),fs,{bold:opts.bold!==false,color:opts.color||INK});}
  }

  function displayDate(value){if(!value)return '';const m=String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return clean(value);const months=['January','February','March','April','May','June','July','August','September','October','November','December'];return `${Number(m[3])} ${months[Number(m[2])-1]} ${m[1]}`;}
  function uniqueMeta(parts){const seen=new Set();return (parts||[]).filter(Boolean).filter(value=>{const key=String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g,'');if(!key||seen.has(key))return false;seen.add(key);return true;});}
  function drawPageHeader(page,pageKind,settings,topics,right){
    const p=settings?.personalisation||{},hasLogo=!!p.logoDataUrl;let left=M;
    if(hasLogo){const box=38,ratio=(Number(p.logoWidth)||1)/(Number(p.logoHeight)||1);let w=box,h=box;if(ratio>1)h=box/ratio;else w=box*ratio;page.image(M,21+(box-h)/2,w,h,'gamesLogo');left=M+box+9;}
    const school=clean(p.schoolName||'99 CLUB STUDIO · MATHS GAMES & PUZZLES'),title=clean(p.packTitle||'Maths Games & Puzzles');
    fitText(page,left,31,school,PAGE_W-left-M-185,8.4,{bold:true,color:INK});
    fitText(page,left,56,title,PAGE_W-left-M-185,18,{bold:true,color:INK});
    const meta=uniqueMeta([pageKind,p.classLabel,yearLabel(settings),topicLabel(settings,topics),displayDate(p.worksheetDate)]).join(' · ');
    if(meta)fitText(page,left,77,meta,PAGE_W-left-M,7.7,{color:MUTED});
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
    drawWrapped(page,x+12,top,instruction,w-24,7,{color:MUTED,maxLines:1});
    drawWrapped(page,x+12,top+12,a.directionTipPdf||a.directionLabel||'',w-24,6.2,{bold:true,color:TEAL,maxLines:1});
    const bodyY=top+28, bodyH=h-(bodyY-y)-12, leftW=Math.min(w*.54,bodyH), gap=14, rightX=x+12+leftW+gap, rightW=w-24-leftW-gap;
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
    rows.forEach((row,r)=>{const rowW=row.length*cellW,startX=x+w/2-rowW/2;row.forEach((v,c)=>{const key=`${r}:${c}`,wasBlank=missing.has(key),blank=wasBlank&&!answers,answerFill=answers&&wasBlank;page.rect(startX+c*cellW,cy,cellW-2,cellH-2,{fill:answerFill?HIT:blank?PALE:WHITE,stroke:[107,137,140],width:.8});if(!blank)page.text(startX+c*cellW+(cellW-2)/2,cy+cellH*.62,String(v),Math.min(10,cellH*.38),{bold:answerFill,color:answerFill?TEAL:INK,align:'center'});});cy+=cellH;});
  }

  function crosswordStarts(a){const map=new Map();for(const e of a.entries||[]){const k=`${e.x}:${e.y}`;if(!map.has(k))map.set(k,e.number);}return map;}
  function drawCrossword(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);
    drawWrapped(page,x+12,top,'Use the definitions to complete the crossword. Ignore spaces and punctuation in answers.',w-24,7,{color:MUTED,maxLines:2});
    const bodyY=top+28,bodyH=h-(bodyY-y)-12,gap=16,leftMax=w*.51,cols=a.width||a.grid?.[0]?.length||1,rows=a.height||a.grid?.length||1,gridAvailH=Math.max(24,bodyH-8);
    const cell=Math.min((leftMax-4)/cols,gridAvailH/rows,30),gridW=cell*cols,gridH=cell*rows,gridX=x+12+(leftMax-gridW)/2,gridY=bodyY+4+(gridAvailH-gridH)/2,rightX=x+12+leftMax+gap,rightW=w-24-leftMax-gap,starts=crosswordStarts(a);
    // Freeform classroom criss-cross: draw only answer cells. Empty locations
    // remain plain white paper, avoiding heavy newspaper-style black blocks.
    for(let gy=0;gy<rows;gy++)for(let gx=0;gx<cols;gx++){
      const ch=a.grid?.[gy]?.[gx]||'';if(!ch)continue;
      const cx=gridX+gx*cell,cy=gridY+gy*cell;
      page.rect(cx,cy,cell,cell,{fill:WHITE,stroke:[83,103,109],width:.62});
      const num=starts.get(`${gx}:${gy}`);if(num)page.text(cx+1.7,cy+4.8,String(num),Math.max(3.4,Math.min(5.2,cell*.24)),{bold:true,color:MUTED});
      if(answers)page.text(cx+cell/2,cy+cell*.69,ch,Math.max(5.5,Math.min(10,cell*.48)),{bold:true,color:INK,align:'center'});
    }
    const across=(a.entries||[]).filter(e=>e.dir==='across'),down=(a.entries||[]).filter(e=>e.dir==='down'),maxY=y+h-14,bankText=a.wordBank&&!answers?`Word bank: ${(a.entries||[]).map(e=>e.term).sort().join(', ')}`:'';
    const neededHeight=fs=>{const lh=fs*1.18;let total=0;for(const items of [across,down]){if(!items.length)continue;total+=10;for(const e of items)total+=wrap(`${e.number}. ${e.clue} ${e.enumeration||enumeration(e.term)}`,rightW,fs,false).length*lh+1;total+=3;}if(bankText)total+=wrap(bankText,rightW,fs,true).length*lh+2;return total;};
    let fs=h<220?5.0:h<360?5.7:6.8;while(fs>4.1&&bodyY+3+neededHeight(fs)>maxY)fs-=.2;const lh=fs*1.18;let cy=bodyY+3;
    const group=(label,items)=>{if(!items.length)return;page.text(rightX,cy,label,Math.max(5.6,fs+1),{bold:true,color:[46,87,86]});cy+=10;for(const e of items){const lines=wrap(`${e.number}. ${e.clue} ${e.enumeration||enumeration(e.term)}`,rightW,fs,false);for(const line of lines){page.text(rightX,cy,line,fs,{color:DARK});cy+=lh;}cy+=1;}cy+=3;};
    group('Across',across);group('Down',down);
    if(bankText)drawWrapped(page,rightX,cy,bankText,rightW,fs,{bold:true,color:TEAL,maxLines:99,lineHeight:lh});
  }

  function drawMagicGrid(page,grid,x,y,maxW,maxH,opts={}){
    const n=grid?.length||3,cell=Math.min(maxW/n,maxH/n,opts.maxCell||48),gw=cell*n,gh=cell*n,sx=x+(maxW-gw)/2,sy=y+(maxH-gh)/2,highlight=opts.highlight||'',answerKeys=new Set(opts.answerKeys||[]);
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const v=grid?.[r]?.[c],key=`${r}:${c}`,isHighlight=highlight===key,isAnswer=answerKeys.has(key);
      page.rect(sx+c*cell,sy+r*cell,cell,cell,{fill:isAnswer?HIT:isHighlight?[232,247,243]:WHITE,stroke:[91,113,118],width:.75});
      if(v!==null&&v!==undefined&&v!=='')page.text(sx+c*cell+cell/2,sy+r*cell+cell*.64,formatNumber(v),Math.max(7,Math.min(13,cell*.34)),{bold:isAnswer||isHighlight,color:isAnswer||isHighlight?TEAL:INK,align:'center'});
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
      const right=drawMagicGrid(page,target,x+12+blockW+gap,bodyY+10,blockW,gridH,{maxCell:38,answerKeys:answers?(a.missingSet||[]):[]});
      page.text(x+12+blockW+gap+blockW/2,right.y+right.h+13,answers?`New magic total: ${formatNumber(a.magicSum)}`:'New magic total: __________',6.2,{bold:true,color:answers?TEAL:MUTED,align:'center'});
      return;
    }
    const grid=a.puzzleType==='check'?a.displayGrid:(answers?a.solutionGrid:a.displayGrid),gridMax=Math.min(w*.58,bodyH),answerKeys=answers?(a.puzzleType==='repair'?[a.wrongCell]:(a.missingSet||[])):[],left=drawMagicGrid(page,grid,x+12,bodyY,gridMax,bodyH,{maxCell:h<230?34:50,highlight:answers&&a.puzzleType==='repair'?a.wrongCell:'',answerKeys}),sideX=x+24+gridMax,sideW=w-(sideX-x)-14;let sy=bodyY+10;
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
      const given=!!display[r][c],answerFill=answers&&!given,v=answers?(solution?.[r]?.[c]||display[r][c]):display[r][c];
      page.rect(sx+c*cell,sy+r*cell,cell,cell,{fill:answerFill?HIT:WHITE,stroke:[142,161,164],width:.5});
      if(v)page.text(sx+c*cell+cell/2,sy+r*cell+cell*.65,String(v),Math.max(7,Math.min(13,cell*.36)),{bold:answerFill,color:answerFill?TEAL:INK,align:'center'});
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

  function drawNodeBox(page,cx,cy,text,w=28,h=18,opts={}){
    const isBlank=text===null||text===undefined||text==='';
    page.rect(cx-w/2,cy-h/2,w,h,{fill:opts.fill||WHITE,stroke:opts.stroke||[92,119,124],width:opts.width||.7});
    if(!isBlank)page.text(cx,cy+3,clean(text),Math.min(8,h*.42),{bold:opts.bold!==false,color:opts.color||INK,align:'center'});
  }

  function arithmagonOpPoint(link,p,q,mx,my,cx,cy,nodeR){
    let vx,vy;if(link.diagonal){const dx=q[0]-p[0],dy=q[1]-p[1],len=Math.hypot(dx,dy)||1;vx=-dy/len;vy=dx/len;const tcx=cx-mx,tcy=cy-my;if(Math.hypot(tcx,tcy)<1){if(vy>0||(Math.abs(vy)<.01&&vx<0)){vx=-vx;vy=-vy;}}else if(vx*tcx+vy*tcy>0){vx=-vx;vy=-vy;}}
    else{vx=mx-cx;vy=my-cy;const len=Math.hypot(vx,vy)||1;vx/=len;vy/=len;}
    const off=nodeR+(link.diagonal?8:7);return [mx+vx*off,my+vy*off];
  }
  function drawArithmagon(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});
    const coords=a.coords||[],links=a.links||[],corners=answers?a.corners:a.displayCorners,shownLinks=answers?links.map(l=>l.value):(a.displayLinks||links.map(l=>l.value)),leftW=w*.72,bodyY=top+31,bodyH=h-(bodyY-y)-14,availW=leftW-28,size=Math.max(120,Math.min(availW,bodyH)),bx=x+14+(availW-size)/2,by=bodyY+(bodyH-size)/2,scaleX=v=>bx+(v/100)*size,scaleY=v=>by+(v/100)*size,centre=coords.length?coords.reduce((p,c)=>[p[0]+c[0],p[1]+c[1]],[0,0]).map(v=>v/coords.length):[50,50],ccx=scaleX(centre[0]),ccy=scaleY(centre[1]),cornerR=Math.max(12,Math.min(22,size*.087)),edgeR=Math.max(10,Math.min(19,size*.076));
    links.forEach((link,i)=>{const p=coords[link.a],q=coords[link.b],px=scaleX(p[0]),py=scaleY(p[1]),qx=scaleX(q[0]),qy=scaleY(q[1]);if(link.diagonal)drawDashedLine(page,px,py,qx,qy,{color:[138,160,164],width:1.15,dash:[5,4]});else page.line(px,py,qx,qy,{color:[88,115,120],width:1.45});});
    links.forEach((link,i)=>{const p=coords[link.a],q=coords[link.b],px=scaleX(p[0]),py=scaleY(p[1]),qx=scaleX(q[0]),qy=scaleY(q[1]),mx=(px+qx)/2,my=(py+qy)/2,wasBlank=(a.displayLinks||[])[i]==null,answerFill=answers&&wasBlank;drawCircleNode(page,mx,my,shownLinks[i],edgeR,{fill:answerFill?HIT:[238,248,246],stroke:[105,159,151],color:answerFill?TEAL:INK,bold:true,width:1.15,fontSize:Math.max(7,Math.min(11.5,edgeR*.62))});const [ox,oy]=arithmagonOpPoint(link,[px,py],[qx,qy],mx,my,ccx,ccy,edgeR);diagramText(page,ox,oy+3,link.operation==='add'?'+':'x',Math.max(7,Math.min(10.5,edgeR*.58)),{bold:true,color:[104,129,134]});});
    coords.forEach((p,i)=>{const wasBlank=(a.displayCorners||[])[i]==null,answerFill=answers&&wasBlank;drawCircleNode(page,scaleX(p[0]),scaleY(p[1]),corners[i],cornerR,{fill:answerFill?HIT:WHITE,stroke:[78,107,112],color:answerFill?TEAL:INK,bold:true,width:1.35,fontSize:Math.max(8,Math.min(13,cornerR*.62))});});
    const sx=x+leftW+5,sw=w-leftW-18;page.text(sx,bodyY+12,'Rule',8,{bold:true,color:DARK});const rule=a.operationMode==='mixed_within'?'Use the + or x shown on each connection.':a.operation==='add'?'Each result = corner + corner.':'Each result = corner x corner.';drawWrapped(page,sx,bodyY+29,rule,sw,6.8,{color:TEAL,bold:true,maxLines:4});if(a.connections==='diagonals')drawWrapped(page,sx,bodyY+72,'Dashed diagonals are connections too.',sw,5.9,{color:MUTED,maxLines:3});
  }

  function drawMagicShape(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});
    const leftW=w*.72,bodyY=top+31,bodyH=h-(bodyY-y)-14,availW=leftW-28,size=Math.max(115,Math.min(availW,bodyH)),bx=x+14+(availW-size)/2,by=bodyY+(bodyH-size)/2,vals=answers&&a.puzzleType!=='check'?a.solutionValues:a.displayValues,hidden=new Set(a.hiddenIndices||[]),nodeR=Math.max(9,Math.min(16,size*.058));
    for(const line of a.lines||[])for(let k=0;k<line.length-1;k++){const p=a.coords[line[k]],q=a.coords[line[k+1]];page.line(bx+p[0]*size,by+p[1]*size,bx+q[0]*size,by+q[1]*size,{color:[88,115,120],width:1.35});}
    a.coords.forEach((p,i)=>{const answerFill=answers&&(hidden.has(i)||(a.puzzleType==='repair'&&a.brokenIndex===i)),bad=answers&&a.puzzleType==='check'&&a.brokenIndex===i;drawCircleNode(page,bx+p[0]*size,by+p[1]*size,vals[i],nodeR,{fill:answerFill?HIT:bad?[255,244,239]:WHITE,stroke:bad?[185,115,97]:[78,107,112],color:answerFill?TEAL:bad?[150,86,74]:INK,bold:true,width:1.15,fontSize:Math.max(7,Math.min(11,nodeR*.66))});});
    const sx=x+leftW+5,sw=w-leftW-18;page.text(sx,bodyY+14,a.puzzleType==='check'?'Check':a.puzzleType==='repair'?'Repair':'Magic total',8,{bold:true,color:DARK});
    if(a.puzzleType==='check')drawWrapped(page,sx,bodyY+31,answers?(a.isMagic?'Yes - it is magic.':`No. Line totals: ${(a.lineSums||[]).join(', ')}`):'Magic?  Yes / No',sw,6.6,{color:answers?TEAL:INK,bold:true,maxLines:5});
    else if(a.puzzleType==='repair')drawWrapped(page,sx,bodyY+31,answers?`Correct value: ${formatNumber(a.correctValue)}`:'Find and replace the wrong value.',sw,6.6,{color:answers?TEAL:INK,bold:true,maxLines:4});
    else{page.text(sx,bodyY+34,formatNumber(a.target),11,{bold:true,color:TEAL});drawWrapped(page,sx,bodyY+55,answers?'Filled answers are highlighted.':'Every marked line must match.',sw,5.9,{color:MUTED,maxLines:3});}
  }

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
  function drawCrossnumber(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.8,{color:MUTED,maxLines:2});const bodyY=top+28,bodyH=h-(bodyY-y)-12,leftMax=w*.52,gap=14,cols=a.width||1,rows=a.height||1,cell=Math.min(leftMax/cols,bodyH/rows,28),gw=cell*cols,gh=cell*rows,gx=x+12+(leftMax-gw)/2,gy=bodyY+(bodyH-gh)/2,starts=crossStarts(a);for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const ch=a.grid?.[r]?.[c];if(!ch)continue;const cx=gx+c*cell,cy=gy+r*cell;page.rect(cx,cy,cell,cell,{fill:answers?HIT:WHITE,stroke:[83,103,109],width:.6});const n=starts.get(`${c}:${r}`);if(n)page.text(cx+1.5,cy+4.5,String(n),3.7,{bold:true,color:MUTED});if(answers)page.text(cx+cell/2,cy+cell*.68,ch,Math.max(5.5,Math.min(9,cell*.46)),{bold:true,color:TEAL,align:'center'});}const rx=x+12+leftMax+gap,rw=w-24-leftMax-gap;let cy=bodyY+3;for(const [label,list] of [['Across',a.entries.filter(e=>e.dir==='across')],['Down',a.entries.filter(e=>e.dir==='down')]]){page.text(rx,cy,label,6.8,{bold:true,color:[46,87,86]});cy+=9;for(const e of list){cy+=drawWrapped(page,rx,cy,`${e.number}. ${e.clue}`,rw,5.6,{color:DARK,maxLines:2})+1;if(cy>y+h-16)break;}cy+=3;}}

  function drawNumberTrail(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.8,{color:MUTED,maxLines:2});const vals=answers?a.values:a.displayValues,cols=a.values.length<=12?4:5,rows=Math.ceil(vals.length/cols),bodyY=top+30,cellW=(w-32)/cols,cellH=Math.min(38,(h-(bodyY-y)-12)/rows);vals.forEach((v,i)=>{const r=Math.floor(i/cols),cc=i%cols,c=r%2===0?cc:cols-1-cc,cx=x+16+c*cellW,cy=bodyY+r*cellH,answerFill=answers&&a.displayValues?.[i]==null;page.rect(cx,cy,cellW-4,cellH-4,{fill:answerFill?HIT:WHITE,stroke:[151,177,180],width:.6});page.text(cx+3,cy+7,String(i+1),4,{bold:true,color:MUTED});if(v!=null)page.text(cx+(cellW-4)/2,cy+cellH*.62,formatNumber(v),7.5,{bold:answerFill,color:answerFill?TEAL:INK,align:'center'});});}

  function drawTarget(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.5,{color:MUTED,maxLines:2});let cy=top+30,rowH=(h-(cy-y)-14)/a.challenges.length;for(let i=0;i<a.challenges.length;i++){const c=a.challenges[i];page.text(x+16,cy+12,`${i+1}.`,6.5,{bold:true,color:TEAL});let xx=x+38;c.numbers.forEach(n=>{page.rect(xx,cy,24,22,{fill:WHITE,stroke:[166,185,188],width:.6});page.text(xx+12,cy+15,String(n),7,{bold:true,color:INK,align:'center'});xx+=29;});page.text(x+w*.55,cy+14,`Target ${c.target}`,7,{bold:true,color:DARK});drawWrapped(page,x+w*.70,cy+5,answers?c.solution:'________________',w*.26,6.2,{color:answers?TEAL:MUTED,bold:answers,maxLines:2});cy+=rowH;}page.text(x+16,y+h-12,`Allowed: ${a.allowedOps.join(' ')}`,5.7,{color:MUTED});}

  function drawBrokenCalc(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.5,{color:MUTED,maxLines:2});let xx=x+16,ky=top+34;for(const k of a.keys){page.rect(xx,ky,27,24,{fill:[248,251,250],stroke:[117,143,147],width:.6});page.text(xx+13.5,ky+16,clean(k),7.3,{bold:true,color:INK,align:'center'});xx+=32;}let cy=ky+34;for(let i=0;i<a.targets.length;i++){const t=a.targets[i];page.text(x+18,cy+10,`${i+1}. Make ${t.target}`,7,{bold:true,color:DARK});page.text(x+w*.44,cy+10,answers?clean(t.solution):'____________________________',6.5,{color:answers?TEAL:MUTED,bold:answers});cy+=24;}}

  function drawSymbols(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.8,{color:MUTED,maxLines:2});let cy=top+32;for(const e of a.equations){page.rect(x+w*.20,cy,w*.60,27,{fill:WHITE,stroke:[214,226,227],width:.6});page.text(x+w/2,cy+18,clean(e.text),9,{bold:true,color:INK,align:'center'});cy+=34;}let xx=x+w*.25;for(let i=0;i<a.names.length;i++){page.text(xx,cy+12,`${a.names[i]} = ${answers?a.values[i]:'____'}`,8,{bold:true,color:answers?TEAL:DARK});xx+=w*.18;}}

  function drawDomino(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.4,{color:MUTED,maxLines:2});const list=answers?a.ordered:a.dominoes,cols=2,rows=Math.ceil(list.length/cols),bodyY=top+30,cw=(w-34)/2,ch=Math.min(42,(h-(bodyY-y)-10)/rows);list.forEach((d,i)=>{const r=Math.floor(i/2),c=i%2,cx=x+14+c*(cw+6),cy=bodyY+r*ch;page.rect(cx,cy,cw,ch-5,{fill:WHITE,stroke:[96,125,130],width:.7});page.line(cx+cw*.38,cy,cx+cw*.38,cy+ch-5,{color:[153,174,177],width:.5});fitText(page,cx+cw*.19,cy+ch*.58,clean(d.left),cw*.34,6.2,{bold:true,color:INK,align:'center'});drawWrapped(page,cx+cw*.42,cy+6,clean(d.right),cw*.54,5.7,{bold:true,color:DARK,maxLines:2});if(answers)page.text(cx+3,cy+6,String(i+1),4,{bold:true,color:TEAL});});}

  function drawOperationGrid(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.8,{color:MUTED,maxLines:2});let cy=top+31,rowH=(h-(cy-y)-12)/a.rows.length;for(const r of a.rows){let text=r.text;if(answers)for(const op of r.ops)text=text.replace('□',op);page.rect(x+w*.16,cy,w*.68,Math.min(30,rowH-4),{fill:WHITE,stroke:[216,227,228],width:.5});page.text(x+w/2,cy+Math.min(20,rowH*.62),clean(text),8.2,{bold:true,color:answers?TEAL:INK,align:'center'});cy+=rowH;}}

  function drawNumberWheels(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.8,{color:MUTED,maxLines:2});const bodyY=top+31,bodyH=h-(bodyY-y)-10;
    if(a.style==='wheel'){
      const cols=a.items.length<=3?Math.min(3,a.items.length):2,rows=Math.ceil(a.items.length/cols),slotW=(w-30-(cols-1)*10)/cols,slotH=(bodyH-(rows-1)*10)/rows;
      a.items.forEach((it,i)=>{const r=Math.floor(i/cols),c=i%cols,cx=x+15+c*(slotW+10)+slotW/2,cy=bodyY+r*(slotH+10)+slotH/2,size=Math.max(72,Math.min(slotW*.82,slotH*.92,145)),s=size/160,n=it.inputs.length,innerR=42*s,outerR=68*s,innerNode=10*s,outerNode=11*s,centreR=24*s;for(let j=0;j<n;j++){const ang=-Math.PI/2+j*2*Math.PI/n,ix=cx+Math.cos(ang)*innerR,iy=cy+Math.sin(ang)*innerR,ox=cx+Math.cos(ang)*outerR,oy=cy+Math.sin(ang)*outerR,inBlank=it.displayInputs?.[j]==null,outBlank=it.displayOutputs?.[j]==null,input=answers?it.inputs[j]:it.displayInputs?.[j],out=answers?it.outputs[j]:it.displayOutputs?.[j];page.line(ix,iy,ox,oy,{color:[177,194,196],width:.85});drawCircleNode(page,ix,iy,input,innerNode,{fill:answers&&inBlank?HIT:WHITE,stroke:[140,165,168],color:answers&&inBlank?TEAL:INK,width:.8,fontSize:Math.max(5.5,8*s)});drawCircleNode(page,ox,oy,out,outerNode,{fill:answers&&outBlank?HIT:(out==null?WHITE:[242,250,248]),stroke:[104,158,151],color:answers&&outBlank?TEAL:INK,width:.9,fontSize:Math.max(5.5,8*s)});}drawCircle(page,cx,cy,centreR,{fill:[229,245,241],stroke:[76,132,126],width:1.15});diagramText(page,cx,cy-4.2*s,'RULE',Math.max(3.8,5*s),{bold:true,color:MUTED});fitDiagramText(page,cx,cy+8.8*s,clean(it.rule),centreR*1.60,Math.max(5.2,8*s),{bold:true,color:TEAL});});
    }else if(a.style==='factor'){
      const cols=a.items.length>=5?3:a.items.length<=3?Math.min(3,a.items.length):2,rows=Math.ceil(a.items.length/cols),slotW=(w-30-(cols-1)*10)/cols,slotH=(bodyH-(rows-1)*10)/rows;
      a.items.forEach((it,i)=>{
        const r=Math.floor(i/cols),c=i%cols,cx=x+15+c*(slotW+10)+slotW/2,cy=bodyY+r*(slotH+10)+slotH/2,size=Math.max(92,Math.min(slotW*.93,slotH*.98,180)),sc=size/220,pairs=it.pairs||[],shown=it.displayPairs||pairs.map(()=>[null,null]),n=Math.max(3,pairs.length),pairRX=76*sc,pairRY=62*sc,centreR=25*sc,pairW=66*sc,pairH=27*sc,fieldW=24*sc,opW=15*sc;
        for(let j=0;j<n;j++){
          const ang=-Math.PI/2+j*2*Math.PI/n,px=cx+Math.cos(ang)*pairRX,py=cy+Math.sin(ang)*pairRY,dx=px-cx,dy=py-cy,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,source=answers&&pairs[j]?pairs[j]:(shown[j]||[null,null]),left=source?.[0],right=source?.[1],leftFill=answers&&shown[j]?.[0]==null,rightFill=answers&&shown[j]?.[1]==null,halfW=pairW/2,halfH=pairH/2,tx=Math.abs(ux)>1e-9?halfW/Math.abs(ux):Infinity,ty=Math.abs(uy)>1e-9?halfH/Math.abs(uy):Infinity,t=Math.min(tx,ty)+1.3*sc,startX=cx+ux*(centreR+2*sc),startY=cy+uy*(centreR+2*sc),endX=px-ux*t,endY=py-uy*t,capsuleX=px-halfW,capsuleY=py-halfH;
          page.line(startX,startY,endX,endY,{color:[187,202,204],width:.8});
          drawRoundRect(page,capsuleX,capsuleY,pairW,pairH,Math.min(9*sc,pairH*.35),{fill:WHITE,stroke:[120,148,152],width:.9});
          if(leftFill)drawRoundRect(page,capsuleX+1*sc,capsuleY+1*sc,fieldW,pairH-2*sc,Math.min(8*sc,pairH*.32),{fill:HIT,stroke:HIT,width:0});
          if(rightFill)drawRoundRect(page,capsuleX+pairW-fieldW-1*sc,capsuleY+1*sc,fieldW,pairH-2*sc,Math.min(8*sc,pairH*.32),{fill:HIT,stroke:HIT,width:0});
          page.line(px-opW/2,capsuleY+4*sc,px-opW/2,capsuleY+pairH-4*sc,{color:[213,224,225],width:.55});
          page.line(px+opW/2,capsuleY+4*sc,px+opW/2,capsuleY+pairH-4*sc,{color:[213,224,225],width:.55});
          const fs=Math.max(5.4,7.4*sc),leftX=capsuleX+fieldW/2+1*sc,rightX=capsuleX+pairW-fieldW/2-1*sc;
          if(left!=null)diagramText(page,leftX,py+fs*.36,formatNumber(left),fs,{bold:true,color:leftFill?TEAL:INK});
          diagramText(page,px,py+fs*.34,'x',Math.max(5.1,7.2*sc),{bold:true,color:MUTED});
          if(right!=null)diagramText(page,rightX,py+fs*.36,formatNumber(right),fs,{bold:true,color:rightFill?TEAL:INK});
        }
        const centre=answers?it.centre:it.displayCentre,centreFill=answers&&it.displayCentre==null,labelFs=Math.max(3.4,5.1*sc),valueFs=Math.max(6.8,10*sc);drawCircle(page,cx,cy,centreR,{fill:centreFill?HIT:[229,245,241],stroke:[76,132,126],width:1.15});diagramText(page,cx,cy-5.0*sc,'FACTOR PAIRS',labelFs,{bold:true,color:MUTED});if(centre!=null)diagramText(page,cx,cy+10.4*sc,formatNumber(centre),valueFs,{bold:true,color:centreFill?TEAL:INK});
      });
    }else{
      const cols=a.items.length<=4?2:3,rows=Math.ceil(a.items.length/cols),slotW=(w-34-(cols-1)*9)/cols,slotH=(bodyH-(rows-1)*10)/rows;
      a.items.forEach((it,i)=>{const r=Math.floor(i/cols),c=i%cols,cx=x+17+c*(slotW+9)+slotW/2,cy=bodyY+r*(slotH+10)+slotH/2,size=Math.max(76,Math.min(slotW*.80,slotH*.92,142)),sc=size/160,rx=52*sc,ry=52*sc,nodeR=16*sc,hidden=new Set(it.hidden||[]);page.line(cx,cy-ry,cx+rx,cy,{color:[122,146,151],width:1.1});page.line(cx+rx,cy,cx,cy+ry,{color:[122,146,151],width:1.1});page.line(cx,cy+ry,cx-rx,cy,{color:[122,146,151],width:1.1});page.line(cx-rx,cy,cx,cy-ry,{color:[122,146,151],width:1.1});for(const [key,nx,ny] of [['top',cx,cy-ry],['left',cx-rx,cy],['right',cx+rx,cy],['bottom',cx,cy+ry]]){const answerFill=answers&&hidden.has(key),value=answers?it[key]:(hidden.has(key)?null:it[key]);drawCircleNode(page,nx,ny,value,nodeR,{fill:answerFill?HIT:WHITE,stroke:[101,132,136],color:answerFill?TEAL:INK,bold:true,width:1,fontSize:Math.max(5.8,9*sc)});}const labFs=Math.max(3.3,5*sc);diagramText(page,cx,cy-ry-nodeR-4*sc,'PRODUCT',labFs,{bold:true,color:MUTED});diagramText(page,cx,cy+ry+nodeR+7*sc,'SUM',labFs,{bold:true,color:MUTED});});
    }
  }

  function drawFunctionMachine(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.5,{color:MUTED,maxLines:2});const rule=a.operations.map(o=>`${o.op} ${o.value}`).join(' -> ');page.text(x+w/2,top+34,clean(`INPUT -> ${rule} -> OUTPUT`),7.2,{bold:true,color:TEAL,align:'center'});const tableW=Math.min(260,w*.62),tx=x+w/2-tableW/2,ty=top+48,rowH=Math.min(28,(h-(ty-y)-12)/(a.rows.length+1));page.rect(tx,ty,tableW,rowH,{fill:[240,247,246],stroke:[167,188,190],width:.6});page.text(tx+tableW*.25,ty+rowH*.65,'Input',6.5,{bold:true,color:DARK,align:'center'});page.text(tx+tableW*.75,ty+rowH*.65,'Output',6.5,{bold:true,color:DARK,align:'center'});page.line(tx+tableW/2,ty,tx+tableW/2,ty+rowH*(a.rows.length+1),{color:[167,188,190],width:.6});for(let i=0;i<a.rows.length;i++){const r=a.rows[i],cy=ty+rowH*(i+1),inFill=answers&&r.hide==='input',outFill=answers&&r.hide==='output';page.rect(tx,cy,tableW/2,rowH,{fill:inFill?HIT:WHITE,stroke:[195,210,212],width:.45});page.rect(tx+tableW/2,cy,tableW/2,rowH,{fill:outFill?HIT:WHITE,stroke:[195,210,212],width:.45});page.text(tx+tableW*.25,cy+rowH*.65,answers||r.hide!=='input'?formatNumber(r.input):'____',6.5,{bold:inFill,color:inFill?TEAL:INK,align:'center'});page.text(tx+tableW*.75,cy+rowH*.65,answers||r.hide!=='output'?formatNumber(r.output):'____',6.5,{bold:outFill,color:outFill?TEAL:INK,align:'center'});}}

  function drawBalance(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.8,{color:MUTED,maxLines:2});let cy=top+32,rowH=(h-(cy-y)-12)/a.rows.length;for(const r of a.rows){page.rect(x+w*.15,cy,w*.70,Math.min(30,rowH-4),{fill:WHITE,stroke:[216,227,228],width:.5});page.text(x+w/2,cy+Math.min(20,rowH*.62),clean(answers?r.solution:r.display),8.2,{bold:true,color:answers?TEAL:INK,align:'center'});cy+=rowH;}}


  function drawKakuro(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});const n=a.size,bodyTop=top+27,availH=h-(bodyTop-y)-14,cell=Math.min((w-80)/n,availH/n,43),gw=cell*n,sx=x+w/2-gw/2,sy=bodyTop+Math.max(0,(availH-gw)/2),given=new Map((a.givens||[]).map(g=>[`${g.r}:${g.c}`,g.v]));for(let r=0;r<n;r++)for(let c=0;c<n;c++){const cx=sx+c*cell,cy=sy+r*cell,key=`${r}:${c}`;if(a.mask[r][c]){const answerFill=answers&&!given.has(key);page.rect(cx,cy,cell,cell,{fill:answerFill?HIT:WHITE,stroke:[112,135,139],width:.55});const v=answers?a.solutionGrid[r][c]:given.get(key);if(v)page.text(cx+cell/2,cy+cell*.66,String(v),Math.min(10,cell*.34),{bold:answerFill,color:answerFill?TEAL:INK,align:'center'});}else{const clue=a.clueCells?.[key]||{};page.rect(cx,cy,cell,cell,{fill:clue.across||clue.down?[248,250,250]:[238,242,242],stroke:[150,165,168],width:.45});if(clue.across||clue.down){page.line(cx,cy,cx+cell,cy+cell,{color:[135,151,154],width:.45});if(clue.across)page.text(cx+cell-2.5,cy+7,String(clue.across),Math.max(4,cell*.16),{bold:true,color:DARK,align:'right'});if(clue.down)page.text(cx+2.5,cy+cell-3,String(clue.down),Math.max(4,cell*.16),{bold:true,color:DARK});}}}
  }

  function drawInequalityGlyph(page,cx,cy,sign,size=8){
    const h=size/2,w=size*.55,color=[47,89,96],lw=.9;
    if(sign==='<'){page.line(cx+w,cy-h,cx-w,cy,{color,width:lw});page.line(cx-w,cy,cx+w,cy+h,{color,width:lw});}
    else if(sign==='>'){page.line(cx-w,cy-h,cx+w,cy,{color,width:lw});page.line(cx+w,cy,cx-w,cy+h,{color,width:lw});}
    else if(sign==='^'){page.line(cx-w,cy+h,cx,cy-h,{color,width:lw});page.line(cx,cy-h,cx+w,cy+h,{color,width:lw});}
    else if(sign==='v'){page.line(cx-w,cy-h,cx,cy+h,{color,width:lw});page.line(cx,cy+h,cx+w,cy-h,{color,width:lw});}
  }

  function drawFutoshiki(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});const n=a.size,bodyTop=top+27,availH=h-(bodyTop-y)-14,gap=Math.min(15,Math.max(9,(Math.min(w-80,availH)-n*34)/(n-1))),cell=Math.min(40,(w-80-gap*(n-1))/n,(availH-gap*(n-1))/n),gw=n*cell+(n-1)*gap,sx=x+w/2-gw/2,sy=bodyTop+Math.max(0,(availH-gw)/2);for(let r=0;r<n;r++)for(let c=0;c<n;c++){const cx=sx+c*(cell+gap),cy=sy+r*(cell+gap),given=!!a.displayGrid[r][c],answerFill=answers&&!given,v=answers?a.solutionGrid[r][c]:a.displayGrid[r][c];page.rect(cx,cy,cell,cell,{fill:answerFill?HIT:WHITE,stroke:[115,139,143],width:.7});if(v)page.text(cx+cell/2,cy+cell*.67,String(v),Math.min(10,cell*.34),{bold:answerFill,color:answerFill?TEAL:INK,align:'center'});if(c<n-1){const sign=a.hSigns[r]?.[c];if(sign)drawInequalityGlyph(page,cx+cell+gap/2,cy+cell/2,sign,Math.min(9,gap*.72));}if(r<n-1){const sign=a.vSigns[r]?.[c];if(sign)drawInequalityGlyph(page,cx+cell/2,cy+cell+gap/2,sign,Math.min(9,gap*.72));}}
  }

  function drawArithmeticCages(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});const n=a.size,bodyTop=top+27,availH=h-(bodyTop-y)-14,cell=Math.min((w-90)/n,availH/n,46),gw=cell*n,sx=x+w/2-gw/2,sy=bodyTop+Math.max(0,(availH-gw)/2),cageAt=new Map();(a.cages||[]).forEach((cg,i)=>cg.cells.forEach(([r,c])=>cageAt.set(`${r}:${c}`,i)));const first=new Map();(a.cages||[]).forEach((cg,i)=>{const sorted=cg.cells.slice().sort((u,v)=>u[0]-v[0]||u[1]-v[1]);first.set(i,sorted[0].join(':'));});for(let r=0;r<n;r++)for(let c=0;c<n;c++){const cx=sx+c*cell,cy=sy+r*cell,ci=cageAt.get(`${r}:${c}`),cg=a.cages[ci];page.rect(cx,cy,cell,cell,{fill:answers?HIT:WHITE,stroke:[215,224,225],width:.4});if(first.get(ci)===`${r}:${c}`){const lab=`${formatNumber(cg.target)}${cg.op==='='?'':cg.op}`;page.text(cx+2.5,cy+7,clean(lab),Math.max(4.3,cell*.14),{bold:true,color:DARK});}if(answers)page.text(cx+cell/2,cy+cell*.67,String(a.solutionGrid[r][c]),Math.min(10,cell*.33),{bold:true,color:TEAL,align:'center'});const topB=r===0||cageAt.get(`${r-1}:${c}`)!==ci,leftB=c===0||cageAt.get(`${r}:${c-1}`)!==ci,rightB=c===n-1||cageAt.get(`${r}:${c+1}`)!==ci,bottomB=r===n-1||cageAt.get(`${r+1}:${c}`)!==ci;if(topB)page.line(cx,cy,cx+cell,cy,{color:[68,91,96],width:1.35});if(leftB)page.line(cx,cy,cx,cy+cell,{color:[68,91,96],width:1.35});if(rightB)page.line(cx+cell,cy,cx+cell,cy+cell,{color:[68,91,96],width:1.35});if(bottomB)page.line(cx,cy+cell,cx+cell,cy+cell,{color:[68,91,96],width:1.35});}
  }

  function drawNonogram(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});const n=a.size,bodyTop=top+28,availH=h-(bodyTop-y)-14,maxR=Math.max(...a.rowClues.map(c=>c.length)),maxC=Math.max(...a.colClues.map(c=>c.length)),cell=Math.min((w-100)/(n+maxR),availH/(n+maxC),30),gx=x+w/2-(n*cell)/2+maxR*cell*.15,gy=bodyTop+maxC*cell+Math.max(0,(availH-(n+maxC)*cell)/2);for(let r=0;r<n;r++){const clues=a.rowClues[r].filter(v=>v!==0),txt=clues.join(' '),fs=Math.max(5.2,Math.min(7.2,cell*.42));fitText(page,gx-6,gy+r*cell+cell*.68,txt,maxR*cell-8,fs,{bold:true,color:DARK,align:'right'});}for(let c=0;c<n;c++){const clues=a.colClues[c].filter(v=>v!==0),fs=Math.max(5.2,Math.min(7.2,cell*.40));clues.slice().reverse().forEach((v,k)=>page.text(gx+c*cell+cell/2,gy-(k+.34)*cell,String(v),fs,{bold:true,color:DARK,align:'center'}));}for(let r=0;r<n;r++)for(let c=0;c<n;c++){const fill=answers&&a.solutionGrid[r][c],cx=gx+c*cell,cy=gy+r*cell;page.rect(cx,cy,cell,cell,{fill:fill?[62,81,86]:WHITE,stroke:[135,155,159],width:.62});if(c>0&&c%5===0)page.line(cx,gy,cx,gy+n*cell,{color:[76,103,109],width:1.25});if(r>0&&r%5===0)page.line(gx,cy,gx+n*cell,cy,{color:[76,103,109],width:1.25});}page.rect(gx,gy,n*cell,n*cell,{fill:null,stroke:[76,103,109],width:1.05});
  }

  function drawNumberPath(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});const n=a.size,bodyTop=top+27,availH=h-(bodyTop-y)-14,cell=Math.min((w-90)/n,availH/n,48),gw=cell*n,sx=x+w/2-gw/2,sy=bodyTop+Math.max(0,(availH-gw)/2);for(let r=0;r<n;r++)for(let c=0;c<n;c++){const cx=sx+c*cell,cy=sy+r*cell,given=!!a.displayGrid[r][c],answerFill=answers&&!given,v=answers?a.solutionGrid[r][c]:a.displayGrid[r][c];page.rect(cx,cy,cell,cell,{fill:answerFill?HIT:WHITE,stroke:[148,168,171],width:.55});if(v)page.text(cx+cell/2,cy+cell*.66,String(v),Math.min(10,cell*.32),{bold:answerFill,color:answerFill?TEAL:(v===1||v===n*n?TEAL:INK),align:'center'});}
  }

  function drawNumberLogicActivity(page,a,answers,x,y,w,h,index){if(a.engineId==='kakuro')return drawKakuro(page,a,answers,x,y,w,h,index);if(a.engineId==='futoshiki')return drawFutoshiki(page,a,answers,x,y,w,h,index);if(a.engineId==='arithmeticcages')return drawArithmeticCages(page,a,answers,x,y,w,h,index);if(a.engineId==='nonogram')return drawNonogram(page,a,answers,x,y,w,h,index);if(a.engineId==='numberpath')return drawNumberPath(page,a,answers,x,y,w,h,index);}

  function drawArithmeticActivity(page,a,answers,x,y,w,h,index){if(a.engineId==='arithmagon')return drawArithmagon(page,a,answers,x,y,w,h,index);if(a.engineId==='magicshape')return drawMagicShape(page,a,answers,x,y,w,h,index);if(a.engineId==='maze')return drawMaze(page,a,answers,x,y,w,h,index);if(a.engineId==='crossnumber')return drawCrossnumber(page,a,answers,x,y,w,h,index);if(a.engineId==='numbertrail')return drawNumberTrail(page,a,answers,x,y,w,h,index);if(a.engineId==='target')return drawTarget(page,a,answers,x,y,w,h,index);if(a.engineId==='brokencalc')return drawBrokenCalc(page,a,answers,x,y,w,h,index);if(a.engineId==='symbols')return drawSymbols(page,a,answers,x,y,w,h,index);if(a.engineId==='domino')return drawDomino(page,a,answers,x,y,w,h,index);if(a.engineId==='operationgrid')return drawOperationGrid(page,a,answers,x,y,w,h,index);if(a.engineId==='numberwheels')return drawNumberWheels(page,a,answers,x,y,w,h,index);if(a.engineId==='functionmachine')return drawFunctionMachine(page,a,answers,x,y,w,h,index);if(a.engineId==='balance')return drawBalance(page,a,answers,x,y,w,h,index);}

  function drawActivity(page,a,answers,x,y,w,h,index){
    if(a?.error){const top=activityFrame(page,x,y,w,h,index,a||{});drawWrapped(page,x+12,top,clean(a.error),w-24,8,{color:[140,70,60]});return;}
    if(a.engineId==='pyramid')return drawPyramid(page,a,answers,x,y,w,h,index);
    if(a.engineId==='crossword')return drawCrossword(page,a,answers,x,y,w,h,index);
    if(a.engineId==='magic')return drawMagic(page,a,answers,x,y,w,h,index);
    if(a.engineId==='sudoku')return drawSudoku(page,a,answers,x,y,w,h,index);
    if(['arithmagon','magicshape','maze','crossnumber','numbertrail','target','brokencalc','symbols','domino','operationgrid','numberwheels','functionmachine','balance'].includes(a.engineId))return drawArithmeticActivity(page,a,answers,x,y,w,h,index);
    if(['kakuro','futoshiki','arithmeticcages','nonogram','numberpath'].includes(a.engineId))return drawNumberLogicActivity(page,a,answers,x,y,w,h,index);
    return drawWordSearch(page,a,answers,x,y,w,h,index);
  }

  function addSheetPage(doc,sheet,answers,settings,topics,seed){
    const page=doc.addPage({orientation:'portrait'});
    drawPageHeader(page,`${answers?'Teacher answers':'Pupil sheet'} ${sheet.index}`,settings,topics,answers?'Answer key':'Name: ____________________');
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
    }else if(ex.kind==='kakuro'){
      const cell=28,sx=x+w/2-cell*1.5;page.rect(sx,cy,cell,cell,{fill:[246,249,249],stroke:[110,137,142],width:.7});page.text(sx+cell/2,cy+17,'4',8,{bold:true,color:DARK,align:'center'});for(let i=0;i<2;i++){page.rect(sx+(i+1)*cell,cy,cell,cell,{fill:WHITE,stroke:[110,137,142],width:.7});page.text(sx+(i+1)*cell+cell/2,cy+18,String(i===0?1:3),10,{bold:true,color:INK,align:'center'});}cy+=cell+5;cy+=drawWrapped(page,x+12,cy,'A two-cell run totalling 4 uses two different digits: 1 and 3.',w-24,7.2,{color:MUTED,maxLines:2})+6;
    }else if(ex.kind==='futoshiki'){
      const cell=25,gap=15,total=4*cell+3*gap,sx=x+w/2-total/2;for(let i=0;i<4;i++){const cx=sx+i*(cell+gap);page.rect(cx,cy,cell,cell,{fill:WHITE,stroke:[110,137,142],width:.7});page.text(cx+cell/2,cy+17,String(i+1),9,{bold:true,color:INK,align:'center'});if(i<3)drawInequalityGlyph(page,cx+cell+gap/2,cy+cell/2,'<',8);}cy+=cell+10;cy+=drawWrapped(page,x+12,cy,'The point faces the smaller number; rows and columns still use each number once.',w-24,7.2,{color:MUTED,maxLines:2})+6;
    }else if(ex.kind==='arithmeticcages'){
      const cell=32,sx=x+w/2-cell;page.rect(sx,cy,cell*2,cell,{fill:WHITE,stroke:[68,91,96],width:1.5});page.line(sx+cell,cy,sx+cell,cy+cell,{color:[190,203,205],width:.5});page.text(sx+3,cy+8,'6x',5.8,{bold:true,color:DARK});page.text(sx+cell/2,cy+21,'2',9,{bold:true,color:INK,align:'center'});page.text(sx+cell*1.5,cy+21,'3',9,{bold:true,color:INK,align:'center'});cy+=cell+5;cy+=drawWrapped(page,x+12,cy,'This cage makes 6 because 2 x 3 = 6.',w-24,7.2,{color:MUTED,maxLines:2})+6;
    }else if(ex.kind==='nonogram'){
      const cell=22,sx=x+w/2-(5*cell+34)/2;page.text(sx+27,cy+15,'2 1',7.5,{bold:true,color:DARK,align:'right'});for(let i=0;i<5;i++)page.rect(sx+34+i*cell,cy,cell,cell,{fill:[0,1,3].includes(i)?[62,81,86]:WHITE,stroke:[120,145,149],width:.65});cy+=cell+5;cy+=drawWrapped(page,x+12,cy,'Clue 2 1 means two shaded cells, at least one gap, then one shaded cell.',w-24,7.2,{color:MUTED,maxLines:2})+6;
    }else if(ex.kind==='numberpath'){
      const vals=[1,2,3,6,5,4,7,8,9],cell=22,sx=x+w/2-cell*1.5;for(let r=0;r<3;r++)for(let c=0;c<3;c++){const v=vals[r*3+c];page.rect(sx+c*cell,cy+r*cell,cell,cell,{fill:WHITE,stroke:[120,145,149],width:.65});page.text(sx+c*cell+cell/2,cy+r*cell+15,String(v),7.5,{bold:true,color:(v===1||v===9)?TEAL:INK,align:'center'});}cy+=cell*3+5;cy+=drawWrapped(page,x+12,cy,'The sequence winds through edge-touching cells: 1, 2, 3, 4 ... 9.',w-24,7.2,{color:MUTED,maxLines:2})+6;
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
      const chunk=examples.slice(start,start+perPage),page=doc.addPage({orientation:'portrait'});drawPageHeader(page,totalPages>1?`Worked examples ${pageNo+1}`:'Worked examples',settings,topics,'Read these before you begin');
      const gap=14,bodyTop=112,bodyBottom=PAGE_H-42,w=PAGE_W-2*M,h=(bodyBottom-bodyTop-gap*(chunk.length-1))/chunk.length;chunk.forEach((ex,i)=>drawWorkedExample(page,ex,M,bodyTop+i*(h+gap),w,h));drawFooter(page,'Worked examples use separate practice data');
    }
  }

  function buildDocument(opts={}){
    const pack=opts.pack||{},settings=opts.settings||{},kind=['student','answers','both'].includes(opts.kind)?opts.kind:'student',topics=opts.topics||{},seed=opts.seed||pack.seed||'GAMES';
    const doc=new P.PDFDocument(),personal=settings.personalisation||{};
    if(personal.logoDataUrl)doc.setJpeg(personal.logoDataUrl,personal.logoWidth||1,personal.logoHeight||1,'gamesLogo');
    if(kind==='student'||kind==='both'){
      if(settings.workedExamples==='front'&&pack.workedExamples?.length)addWorkedPages(doc,pack.workedExamples,settings,topics);
      for(const sheet of pack.sheets||[])addSheetPage(doc,sheet,false,settings,topics,seed);
    }
    if(kind==='answers'||kind==='both')for(const sheet of pack.sheets||[])addSheetPage(doc,sheet,true,settings,topics,seed);
    return doc;
  }
  function filename(settings,kind){
    const k=kind==='answers'?'answer-key':kind==='both'?'pupil-and-answers':'pupil-sheets',yr=settings.minYear===settings.maxYear?`y${settings.minYear}`:`y${settings.minYear}-${settings.maxYear}`;
    const title=safeName(settings.personalisation?.packTitle||'maths-games-puzzles');return `99-club-${title}-${yr}-${safeName(k)}.pdf`;
  }

  const api={buildDocument,filename,wrap};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.TT99GamesPDF=api;
}(typeof window!=='undefined'?window:globalThis));
