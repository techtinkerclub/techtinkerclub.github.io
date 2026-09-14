/* 99 Club Studio · v1.32.1 layout corrections
 * Browser: explicit nonogram frame.
 * Direct PDF: compact nonogram clue stacks and corner hints for missing operators.
 */
(function(global){
  'use strict';

  const P=global.TT99SimplePDF;
  const PDF=global.TT99GamesPDF;
  const WHITE=[255,255,255], GRID=[76,103,109], CELL=[135,155,159], DARK=[61,86,91], MUTED=[104,124,129], FILLED=[62,81,86];
  const PAGE_H=P?.PAGE_H||841.89, PAGE_W=P?.PAGE_W||595.28, M=34;

  function pdfN(v){return Number(v).toFixed(2).replace(/\.00$/,'');}
  function pdfRgb(c){return c.map(v=>Math.max(0,Math.min(255,v))/255).map(pdfN).join(' ');}
  function pdfEscape(text){
    return (P?.asciiish?P.asciiish(String(text??'')):String(text??''))
      .replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ');
  }
  function estimate(text,size,bold){return P?.estimateTextWidth?P.estimateTextWidth(String(text??''),size,!!bold):String(text??'').length*size*.54;}
  function rawText(entry,x,topY,text,size,opts={}){
    const cmds=entry?.cmds;if(!cmds)return;
    let tx=x,w=estimate(text,size,opts.bold);
    if(opts.align==='center')tx-=w/2;else if(opts.align==='right')tx-=w;
    const y=(entry.height||PAGE_H)-topY,font=opts.bold?'F2':'F1',color=opts.color?`${pdfRgb(opts.color)} rg `:'';
    cmds.push(`BT /${font} ${pdfN(size)} Tf ${color}1 0 0 1 ${pdfN(tx)} ${pdfN(y)} Tm (${pdfEscape(text)}) Tj ET`);
  }
  function rawRect(entry,x,topY,w,h,opts={}){
    const cmds=entry?.cmds;if(!cmds)return;
    const y=(entry.height||PAGE_H)-topY-h,parts=[];
    if(opts.fill)parts.push(`${pdfRgb(opts.fill)} rg`);
    if(opts.stroke)parts.push(`${pdfRgb(opts.stroke)} RG`);
    parts.push(`${pdfN(opts.width||.7)} w`,`${pdfN(x)} ${pdfN(y)} ${pdfN(w)} ${pdfN(h)} re`);
    parts.push(opts.fill&&opts.stroke?'B':opts.fill?'f':'S');cmds.push(parts.join(' '));
  }
  function rawLine(entry,x1,y1Top,x2,y2Top,opts={}){
    const h=entry.height||PAGE_H,y1=h-y1Top,y2=h-y2Top,color=opts.color?`${pdfRgb(opts.color)} RG `:'';
    entry.cmds.push(`${color}${pdfN(opts.width||.7)} w ${pdfN(x1)} ${pdfN(y1)} m ${pdfN(x2)} ${pdfN(y2)} l S`);
  }
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

  function nonogramGeometry(a,x,y,w,h){
    const n=a.size||a.solutionGrid?.length||10,rows=a.rowClues||[],cols=a.colClues||[],maxC=Math.max(1,...cols.map(c=>(c||[]).filter(v=>v!==0).length));
    const top=y+50,overlayTop=top+24,availH=Math.max(80,y+h-8-overlayTop);
    let cell=Math.min((w-82)/n,(availH-46)/n,30);
    let fs=clamp(cell*.34,6.2,8.2),gap=fs+2.1,topClueH=maxC*gap+5;
    const longest=rows.reduce((best,c)=>{const s=(c||[]).filter(v=>v!==0).join(' ');return estimate(s,fs,true)>estimate(best,fs,true)?s:best;},'');
    let rowW=clamp(estimate(longest,fs,true)+12,38,84);
    cell=Math.max(8,Math.min((w-24-rowW)/n,(availH-topClueH-6)/n,30));
    fs=clamp(cell*.34,6.2,8.2);gap=fs+2.1;topClueH=maxC*gap+5;
    rowW=clamp(estimate(longest,fs,true)+12,38,84);
    cell=Math.max(8,Math.min((w-24-rowW)/n,(availH-topClueH-6)/n,30));
    const totalW=rowW+n*cell,gx=x+(w-totalW)/2+rowW,usedH=topClueH+n*cell,gy=overlayTop+topClueH+Math.max(0,(availH-usedH)/2);
    return {n,top,overlayTop,availH,cell,fs,gap,topClueH,rowW,gx,gy};
  }

  function redrawNonogram(entry,a,answers,x,y,w,h){
    const g=nonogramGeometry(a,x,y,w,h),{n,overlayTop,cell,fs,gap,gx,gy}=g;
    // Cover only the old puzzle body; preserve title, instruction and activity frame.
    rawRect(entry,x+1,overlayTop,w-2,Math.max(1,y+h-overlayTop-2),{fill:WHITE,width:.1});

    for(let r=0;r<n;r++){
      const clues=(a.rowClues?.[r]||[]).filter(v=>v!==0),txt=clues.join(' ');
      if(txt)rawText(entry,gx-8,gy+r*cell+cell*.66,txt,fs,{bold:true,color:DARK,align:'right'});
    }
    for(let c=0;c<n;c++){
      const clues=(a.colClues?.[c]||[]).filter(v=>v!==0),len=clues.length;
      clues.forEach((v,k)=>{
        const ty=gy-5-(len-1-k)*gap;
        rawText(entry,gx+c*cell+cell/2,ty,String(v),fs,{bold:true,color:DARK,align:'center'});
      });
    }

    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const cx=gx+c*cell,cy=gy+r*cell,fill=answers&&a.solutionGrid?.[r]?.[c];
      rawRect(entry,cx,cy,cell,cell,{fill:fill?FILLED:WHITE,stroke:CELL,width:.58});
    }
    for(let c=5;c<n;c+=5)rawLine(entry,gx+c*cell,gy,gx+c*cell,gy+n*cell,{color:GRID,width:1.35});
    for(let r=5;r<n;r+=5)rawLine(entry,gx,gy+r*cell,gx+n*cell,gy+r*cell,{color:GRID,width:1.35});
    rawRect(entry,gx,gy,n*cell,n*cell,{stroke:GRID,width:1.45});
  }

  function addCrossgridHints(entry,a,x,y,w,h){
    const solution=a.solutionGrid||[],hidden=new Set(a.hiddenOperatorKeys||[]),n=a.size||solution.length||5;
    if(!hidden.size){
      const allHidden=new Set(a.hiddenKeys||[]);
      for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(allHidden.has(`${r}:${c}`)&&['+','-','×','÷'].includes(solution?.[r]?.[c]))hidden.add(`${r}:${c}`);
    }
    if(!hidden.size)return;
    const top=y+50,bodyY=top+28,bodyH=h-(bodyY-y)-14,gridSize=Math.min(w-74,bodyH,n>=10?320:300),cell=gridSize/n,gx=x+w/2-gridSize/2,gy=bodyY+Math.max(0,(bodyH-gridSize)/2),fs=clamp(cell*.18,4.2,6.2);
    for(const k of hidden){
      const [r,c]=k.split(':').map(Number),cx=gx+c*cell,cy=gy+r*cell;
      rawText(entry,cx+cell-3.2,cy+fs+1.2,'?',fs,{bold:true,color:MUTED,align:'right'});
    }
  }

  function patchSheet(entry,sheet,answers){
    const acts=sheet?.activities||[],count=Math.max(1,acts.length),bodyTop=110,bodyBottom=PAGE_H-42,gap=12,ah=(bodyBottom-bodyTop-gap*(count-1))/count,w=PAGE_W-2*M;
    acts.forEach((a,i)=>{
      const y=bodyTop+i*(ah+gap);
      if(a?.engineId==='nonogram')redrawNonogram(entry,a,answers,M,y,w,ah);
      if(!answers&&a?.engineId==='equationcrossgrid')addCrossgridHints(entry,a,M,y,w,ah);
    });
  }

  function patchPdfDocument(doc,opts={}){
    const pack=opts.pack||{},settings=opts.settings||{},kind=['student','answers','both'].includes(opts.kind)?opts.kind:'student',sheets=pack.sheets||[];
    let pageIndex=0;
    if((kind==='student'||kind==='both')&&settings.workedExamples==='front'&&pack.workedExamples?.length)pageIndex+=Math.ceil(pack.workedExamples.length/2);
    if(kind==='student'||kind==='both')for(const sheet of sheets)patchSheet(doc.pages?.[pageIndex++],sheet,false);
    if(kind==='answers'||kind==='both')for(const sheet of sheets)patchSheet(doc.pages?.[pageIndex++],sheet,true);
  }

  if(PDF&&!PDF.__layoutV1321){
    const originalBuild=PDF.buildDocument.bind(PDF);
    PDF.buildDocument=function(opts={}){
      const doc=originalBuild(opts);
      try{patchPdfDocument(doc,opts);}catch(err){if(global.console?.warn)console.warn('99 Club v1.32.1 PDF layout patch skipped:',err);}
      return doc;
    };
    PDF.__layoutV1321=true;
  }

  function enhanceNonogramFrames(){
    const root=global.document?.getElementById('tt99-games-root');if(!root)return;
    root.querySelectorAll('.tt99-nonogram-grid:not([data-ng-frame-v1321])').forEach(grid=>{
      const clueCols=Number(grid.style.getPropertyValue('--ng-clue-cols'))||0,clueRows=Number(grid.style.getPropertyValue('--ng-clue-rows'))||0,totalCols=Number(grid.style.getPropertyValue('--ng-cols'))||0,totalRows=Number(grid.style.getPropertyValue('--ng-rows'))||0;
      const firstCol=clueCols+1,firstRow=clueRows+1;
      grid.querySelectorAll('.pixel').forEach(cell=>{
        const col=parseInt(cell.style.gridColumn,10),row=parseInt(cell.style.gridRow,10);
        if(col===firstCol)cell.classList.add('ng-frame-left');
        if(col===totalCols)cell.classList.add('ng-frame-right');
        if(row===firstRow)cell.classList.add('ng-frame-top');
        if(row===totalRows)cell.classList.add('ng-frame-bottom');
      });
      grid.dataset.ngFrameV1321='1';
    });
  }
  const root=global.document?.getElementById('tt99-games-root');
  if(root){new MutationObserver(enhanceNonogramFrames).observe(root,{childList:true,subtree:true});queueMicrotask(enhanceNonogramFrames);}

  global.TT99GamesLayoutV1321={patchPdfDocument,nonogramGeometry,enhanceNonogramFrames};
})(typeof window!=='undefined'?window:globalThis);
