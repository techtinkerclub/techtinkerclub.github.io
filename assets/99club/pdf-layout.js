/* Tech Tinker Club 99 Club - print/PDF layout.
 * Pure layout layer on top of simple-pdf.js; browser and Node friendly.
 * Portrait remains the default; landscape is a separate A4 layout using the same questions/seed.
 */
(function(global){
  'use strict';
  const G = global.TT99Generator || (typeof require !== 'undefined' ? require('./generator.js') : null);
  const P = global.TT99SimplePDF || (typeof require !== 'undefined' ? require('./simple-pdf.js') : null);
  if (!G || !P) throw new Error('99 Club PDF dependencies are missing');

  function normalizeOrientation(value){ return value === 'landscape' ? 'landscape' : 'portrait'; }

  function buildDocument(options){
    const { rules, sheets, school={}, kind='student' } = options;
    const orientation = normalizeOrientation(options.orientation);
    const doc = new P.PDFDocument();
    if (school.logoDataUrl) doc.setJpeg(school.logoDataUrl, school.logoWidth, school.logoHeight);
    if (kind === 'student' || kind === 'both') sheets.forEach((sheet,i)=>drawPage(doc,rules,sheet,i,school,false,orientation));
    if (kind === 'answers' || kind === 'both') sheets.forEach((sheet,i)=>drawPage(doc,rules,sheet,i,school,true,orientation));
    return doc;
  }

  function drawPage(doc,rules,sheet,variantIndex,school,answers,orientation='portrait'){
    orientation = normalizeOrientation(orientation);
    const landscape = orientation === 'landscape';
    const page=doc.addPage({orientation}), r=G.normalizeRules(rules), s=school || {};
    const W=landscape ? P.LANDSCAPE_W : P.PAGE_W;
    const H=landscape ? P.LANDSCAPE_H : P.PAGE_H;
    const ink=[31,41,55], muted=[95,105,120], teal=[15,118,110], pale=[241,247,246], line=[202,211,215];
    const margin=landscape?34:36, right=W-margin;

    // Compact identity/header: school identity left, challenge title centred, date right.
    const logoBox=landscape?34:40;
    const logoTop=landscape?17:20;
    let identityX=margin;
    if(s.logoDataUrl){
      const ratio=(s.logoWidth||1)/(s.logoHeight||1); let w=logoBox,h=logoBox;
      if(ratio>1)h=logoBox/ratio; else w=logoBox*ratio;
      page.image(margin,logoTop+(logoBox-h)/2,w,h);
      identityX=margin+logoBox+9;
    }
    const identityMax=landscape?235:160;
    if(s.schoolName){
      const schoolFit=fitText(s.schoolName,landscape?10.7:10.4,8.2,identityMax,true);
      page.text(identityX,landscape?30:34,schoolFit.text,schoolFit.size,{bold:true,color:ink});
    }
    const metadata=headerMetadata(s);
    if(metadata){
      const metaFit=fitText(metadata,landscape?7.8:7.5,6.5,identityMax,false);
      page.text(identityX,landscape?45:50,metaFit.text,metaFit.size,{color:muted});
    }

    page.text(W/2,landscape?29:33,r.name || `${r.questionCount} Club`,landscape?22:23,{bold:true,align:'center',color:ink});
    page.text(W/2,landscape?45:51,answers?'ANSWER KEY':'MENTAL MATHS CHALLENGE',landscape?7.8:7.8,{bold:true,align:'center',color:teal});
    if(s.worksheetDate) page.text(right,landscape?30:34,formatDate(s.worksheetDate),landscape?8.6:8.7,{align:'right',color:muted});

    const headerLineY=landscape?62:70;
    page.line(margin,headerLineY,right,headerLineY,{color:line,width:0.7});

    const nameY=landscape?81:91;
    const nameLineY=nameY+2;
    page.text(margin,nameY,'Name',landscape?10:10.2,{bold:true,color:ink});
    page.line(margin+(landscape?35:34),nameLineY,landscape?360:282,nameLineY,{color:muted,width:0.65});
    const scoreX=landscape?535:345;
    page.text(scoreX,nameY,'Score',landscape?10:10.2,{bold:true,color:ink});
    page.line(scoreX+(landscape?39:38),nameLineY,scoreX+(landscape?105:101),nameLineY,{color:muted,width:0.65});
    page.text(scoreX+(landscape?111:107),nameY,`/ ${r.questionCount}`,landscape?10:10.2,{color:muted});

    const instTop=landscape?93:105, instH=landscape?28:31;
    page.rect(margin,instTop,right-margin,instH,{fill:pale,stroke:[222,232,230],width:0.6});
    wrapText(page,G.instructionText(r),margin+10,instTop+(landscape?17:18),right-margin-20,landscape?8.8:9.1,landscape?9.5:10.2,{color:ink});

    const cols=getColumns(r.questionCount,orientation), rows=Math.ceil(r.questionCount/cols);
    const colGap=landscape?18:18, contentW=right-margin, colW=(contentW-colGap*(cols-1))/cols;
    const top=landscape?134:151, footerLine=landscape?564:811, bottom=footerLine-12, available=bottom-top;
    const rowH=available/rows;
    const fonts=getQuestionFonts(r.questionCount,orientation);
    const answerLineW=landscape?(r.questionCount>=77?38:44):(r.questionCount>=77?42:48);
    for(let c=0;c<cols;c++){
      const x=margin+c*(colW+colGap);
      if(c>0)page.line(x-colGap/2,top-2,x-colGap/2,bottom,{color:[232,235,237],width:0.5});
      const start=c*rows,end=Math.min((c+1)*rows,sheet.questions.length);
      for(let idx=start;idx<end;idx++){
        const q=sheet.questions[idx], rr=idx-start;
        const y=top+rr*rowH+Math.min(14.5,Math.max(10,rowH*.64));
        page.text(x,y,`${q.number}.`,fonts.number,{bold:true,color:muted});
        page.text(x+(landscape?24:23),y,q.prompt,fonts.question,{color:ink});
        if(answers) page.text(x+colW-6,y,String(q.answer),fonts.answer,{bold:true,align:'right',color:teal});
        else page.line(x+colW-answerLineW,y+2,x+colW-5,y+2,{color:[120,128,136],width:0.6});
      }
    }

    page.line(margin,footerLine,right,footerLine,{color:line,width:0.55});
    const footerY=footerLine+(landscape?14:15);
    page.text(margin,footerY,`Sheet ${sheet.code} · Version ${String.fromCharCode(65+variantIndex)}`,landscape?7.2:7.3,{color:muted});
    page.text(right,footerY,'Generated with Tech Tinker Club · techtinker.club',landscape?7.2:7.3,{align:'right',color:muted});
  }

  function getColumns(count,orientation){
    if(normalizeOrientation(orientation)==='landscape'){
      if(count<=22)return 2;
      if(count<=33)return 3;
      return 4;
    }
    if(count<=11)return 1;
    if(count<=22)return 2;
    return 3;
  }

  function getQuestionFonts(count,orientation){
    const landscape=normalizeOrientation(orientation)==='landscape';
    if(landscape){
      if(count<=11)return {question:14.2,number:9.5,answer:13.2};
      if(count<=22)return {question:12.9,number:9.1,answer:12.1};
      if(count<=33)return {question:12.4,number:8.9,answer:11.8};
      if(count<=44)return {question:12.0,number:8.7,answer:11.5};
      if(count<=55)return {question:11.6,number:8.5,answer:11.1};
      if(count<=66)return {question:11.2,number:8.3,answer:10.8};
      if(count<=77)return {question:10.8,number:8.1,answer:10.5};
      return {question:10.4,number:8.0,answer:10.2};
    }
    if(count<=11)return {question:13.6,number:9.4,answer:12.7};
    if(count<=22)return {question:12.1,number:9.0,answer:11.6};
    if(count<=33)return {question:11.8,number:8.8,answer:11.3};
    if(count<=44)return {question:11.4,number:8.6,answer:11.0};
    if(count<=55)return {question:11.0,number:8.4,answer:10.7};
    if(count<=66)return {question:10.7,number:8.2,answer:10.4};
    if(count<=77)return {question:10.4,number:8.0,answer:10.2};
    return {question:10.1,number:7.9,answer:10.0};
  }

  function displayYear(value){
    const v=String(value||'').trim(); if(!v)return '';
    return /^year\b/i.test(v)?v:`Year ${v}`;
  }
  function displayClass(value){
    const v=String(value||'').trim(); if(!v)return '';
    return /^class\b/i.test(v)?v:`Class ${v}`;
  }
  function headerMetadata(s){ return [displayYear(s.yearGroup),displayClass(s.className),String(s.teacherName||'').trim()].filter(Boolean).join(' · '); }

  function fitText(text,startSize,minSize,maxWidth,bold){
    const raw=String(text||'');
    let size=startSize;
    while(size>minSize && P.estimateTextWidth(raw,size,bold)>maxWidth) size-=.2;
    if(P.estimateTextWidth(raw,size,bold)<=maxWidth)return {text:raw,size};
    let out=raw;
    while(out.length>3 && P.estimateTextWidth(out+'...',size,bold)>maxWidth)out=out.slice(0,-1);
    return {text:out.replace(/\s+$/,'')+'...',size};
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

  function filename(rules,kind,orientation='portrait'){
    const r=G.normalizeRules(rules);
    const club=(r.name || `${r.questionCount}-Club`).replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'');
    const suffix=kind==='student'?'worksheets':kind==='answers'?'answer-key':'worksheets-and-answers';
    const layout=normalizeOrientation(orientation)==='landscape'?'-landscape':'';
    return `${club}-${suffix}${layout}.pdf`;
  }

  const api={buildDocument,drawPage,filename,formatDate,getColumns,getQuestionFonts,normalizeOrientation,displayYear,displayClass};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  global.TT99PDFLayout=api;
}(typeof window!=='undefined'?window:globalThis));
