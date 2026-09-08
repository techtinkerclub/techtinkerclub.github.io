/* Tech Tinker Club 99 Club - print/PDF layout.
 * Pure layout layer on top of simple-pdf.js; browser and Node friendly.
 */
(function(global){
  'use strict';
  const G = global.TT99Generator || (typeof require !== 'undefined' ? require('./generator.js') : null);
  const P = global.TT99SimplePDF || (typeof require !== 'undefined' ? require('./simple-pdf.js') : null);
  if (!G || !P) throw new Error('99 Club PDF dependencies are missing');

  function buildDocument(options){
    const { rules, sheets, school={}, kind='student' } = options;
    const doc = new P.PDFDocument();
    if (school.logoDataUrl) doc.setJpeg(school.logoDataUrl, school.logoWidth, school.logoHeight);
    if (kind === 'student' || kind === 'both') sheets.forEach((sheet,i)=>drawPage(doc,rules,sheet,i,school,false));
    if (kind === 'answers' || kind === 'both') sheets.forEach((sheet,i)=>drawPage(doc,rules,sheet,i,school,true));
    return doc;
  }

  function drawPage(doc,rules,sheet,variantIndex,school,answers){
    const page=doc.addPage(), r=G.normalizeRules(rules), s=school || {};
    const ink=[31,41,55], muted=[95,105,120], teal=[15,118,110], pale=[241,247,246], line=[202,211,215];
    const margin=36, right=P.PAGE_W-margin;
    let logoRight=margin;
    if(s.logoDataUrl){
      const box=46, ratio=(s.logoWidth||1)/(s.logoHeight||1); let w=box,h=box;
      if(ratio>1)h=box/ratio; else w=box*ratio;
      page.image(margin,31+(box-h)/2,w,h);logoRight=margin+box+10;
    }
    if(s.schoolName) page.text(logoRight,43,s.schoolName,11,{bold:true,color:ink});
    const classInfo=[s.yearGroup,s.className].filter(Boolean).join(' · ');
    if(classInfo) page.text(logoRight,59,classInfo,8.5,{color:muted});
    if(s.teacherName) page.text(logoRight,73,s.teacherName,8.5,{color:muted});
    page.text(P.PAGE_W/2,43,r.name || `${r.questionCount} Club`,20,{bold:true,align:'center',color:ink});
    page.text(P.PAGE_W/2,61,answers?'ANSWER KEY':'MENTAL MATHS CHALLENGE',8,{bold:true,align:'center',color:teal});
    if(s.worksheetDate) page.text(right,43,formatDate(s.worksheetDate),9,{align:'right',color:muted});
    page.line(margin,91,right,91,{color:line,width:0.7});
    page.text(margin,111,'Name',9,{bold:true,color:ink}); page.line(margin+31,113,270,113,{color:muted,width:0.6});
    page.text(335,111,'Score',9,{bold:true,color:ink}); page.line(370,113,430,113,{color:muted,width:0.6}); page.text(435,111,`/ ${r.questionCount}`,9,{color:muted});
    page.rect(margin,126,right-margin,37,{fill:pale,stroke:[222,232,230],width:0.6});
    wrapText(page,G.instructionText(r),margin+10,145,right-margin-20,8.5,10,{color:ink});

    const cols=r.questionCount<=11?1:(r.questionCount<=22?2:3), rows=Math.ceil(r.questionCount/cols), colGap=18, contentW=right-margin, colW=(contentW-colGap*(cols-1))/cols;
    const top=181, bottom=789, available=bottom-top;
    const cap=r.questionCount<=11?48:r.questionCount<=22?45:r.questionCount<=33?38:r.questionCount<=55?31:999;
    const rowH=Math.min(cap,available/rows);
    const qFont=r.questionCount<=22?11:r.questionCount<=55?9.8:8.9;
    const nFont=r.questionCount<=22?8.6:r.questionCount<=55?8:7.7;
    const aFont=r.questionCount<=22?10.5:r.questionCount<=55?9.6:9;
    for(let c=0;c<cols;c++){
      const x=margin+c*(colW+colGap);
      if(c>0)page.line(x-colGap/2,top-2,x-colGap/2,bottom,{color:[232,235,237],width:0.5});
      const start=c*rows,end=Math.min((c+1)*rows,sheet.questions.length);
      for(let idx=start;idx<end;idx++){
        const q=sheet.questions[idx], rr=idx-start, y=top+rr*rowH+10.5;
        page.text(x,y,`${q.number}.`,nFont,{bold:true,color:muted});
        page.text(x+22,y,q.prompt,qFont,{color:ink});
        if(answers) page.text(x+colW-7,y,String(q.answer),aFont,{bold:true,align:'right',color:teal});
        else page.line(x+colW-45,y+2,x+colW-5,y+2,{color:[120,128,136],width:0.55});
      }
    }
    page.line(margin,808,right,808,{color:line,width:0.55});
    page.text(margin,823,`Sheet ${sheet.code} · Version ${String.fromCharCode(65+variantIndex)}`,7.1,{color:muted});
    page.text(right,823,'Generated with Tech Tinker Club · techtinker.club',7.1,{align:'right',color:muted});
  }

  function wrapText(page,text,x,y,maxWidth,size,lineHeight,opts){
    const words=String(text).split(/\s+/); let line='', yy=y;
    for(const word of words){
      const test=line?line+' '+word:word;
      if(P.estimateTextWidth(test,size,opts && opts.bold)<=maxWidth) line=test;
      else { if(line) page.text(x,yy,line,size,opts); yy+=lineHeight; line=word; }
    }
    if(line)page.text(x,yy,line,size,opts);
  }

  function formatDate(iso){
    if(!iso)return '';
    const parts=String(iso).split('-').map(Number); if(parts.length!==3 || !parts.every(Number.isFinite)) return String(iso);
    const [y,m,d]=parts;
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d} ${months[m-1] || m} ${y}`;
  }

  function filename(rules,kind){
    const r=G.normalizeRules(rules);
    const club=(r.name || `${r.questionCount}-Club`).replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'');
    const suffix=kind==='student'?'worksheets':kind==='answers'?'answer-key':'worksheets-and-answers';
    return `${club}-${suffix}.pdf`;
  }

  const api={buildDocument,drawPage,filename,formatDate};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  global.TT99PDFLayout=api;
}(typeof window!=='undefined'?window:globalThis));
