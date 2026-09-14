'use strict';
const fs=require('fs');

function patch(path,replacements){
  let text=fs.readFileSync(path,'utf8');
  for(const [from,to,label] of replacements){
    if(!text.includes(from))throw new Error(`${path}: missing anchor for ${label}`);
    text=text.replace(from,to);
  }
  fs.writeFileSync(path,text);
}

patch('assets/99club/games-app.js',[
  ["engines:['maze','crossnumber','numbersearch','equationcrossgrid','target','brokencalc','operationgrid','kakuro','arithmeticcages']","engines:['maze','crossnumber','numbersearch','equationcrossgrid','target','brokencalc','operationgrid','kakuro','arithmeticcages','sumplete']",'arithmetic category'],
  ["  function renderNumberLogicActivity(a,answers,index,si,ai){if(a.engineId==='kakuro')return renderKakuro(a,answers,index,si,ai);if(a.engineId==='futoshiki')return renderFutoshiki(a,answers,index,si,ai);if(a.engineId==='arithmeticcages')return renderArithmeticCages(a,answers,index,si,ai);if(a.engineId==='nonogram')return renderNonogram(a,answers,index,si,ai);if(a.engineId==='numberpath')return renderNumberPath(a,answers,index,si,ai);return `<section class=\"tt99-game-activity\">${activityReplaceButton(si,ai)}${logicHead(a,index)}</section>`;}",
`  function renderSumplete(a,answers,index,si,ai){
    const n=a.size,parts=[];
    for(let r=0;r<n;r++){
      for(let c=0;c<n;c++){
        const keep=!!a.solutionMask?.[r]?.[c],cls=answers?(keep?'answer-keep':'answer-cross'):'';
        parts.push(`<span class=\"value ${cls}\">${esc(G.formatNumber(a.valueGrid?.[r]?.[c]))}</span>`);
      }
      parts.push(`<span class=\"target row-target\" title=\"Row target\">${esc(G.formatNumber(a.rowTargets?.[r]))}</span>`);
    }
    for(let c=0;c<n;c++)parts.push(`<span class=\"target col-target\" title=\"Column target\">${esc(G.formatNumber(a.colTargets?.[c]))}</span>`);
    parts.push('<span class=\"corner\">SUM</span>');
    return `<section class=\"tt99-game-activity tt99-sumplete\">${activityReplaceButton(si,ai)}${logicHead(a,index)}<div class=\"tt99-sumplete-grid\" style=\"--sumplete-n:${n}\">${parts.join('')}</div>${answers?'<p class=\"tt99-sumplete-key\">Crossed numbers are removed; highlighted numbers are kept.</p>':'<p class=\"tt99-sumplete-key\">Targets on the right are row sums; targets underneath are column sums.</p>'}</section>`;
  }

  function renderNumberLogicActivity(a,answers,index,si,ai){if(a.engineId==='kakuro')return renderKakuro(a,answers,index,si,ai);if(a.engineId==='futoshiki')return renderFutoshiki(a,answers,index,si,ai);if(a.engineId==='arithmeticcages')return renderArithmeticCages(a,answers,index,si,ai);if(a.engineId==='nonogram')return renderNonogram(a,answers,index,si,ai);if(a.engineId==='numberpath')return renderNumberPath(a,answers,index,si,ai);if(a.engineId==='sumplete')return renderSumplete(a,answers,index,si,ai);return `<section class=\"tt99-game-activity\">${activityReplaceButton(si,ai)}${logicHead(a,index)}</section>`;}`,
  'Sumplete browser renderer']
]);

patch('assets/99club/games-pdf.js',[
  ["  function drawNumberLogicActivity(page,a,answers,x,y,w,h,index){if(a.engineId==='kakuro')return drawKakuro(page,a,answers,x,y,w,h,index);if(a.engineId==='futoshiki')return drawFutoshiki(page,a,answers,x,y,w,h,index);if(a.engineId==='arithmeticcages')return drawArithmeticCages(page,a,answers,x,y,w,h,index);if(a.engineId==='nonogram')return drawNonogram(page,a,answers,x,y,w,h,index);if(a.engineId==='numberpath')return drawNumberPath(page,a,answers,x,y,w,h,index);}",
`  function drawSumplete(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);
    drawWrapped(page,x+12,top,a.instruction,w-24,7,{color:MUTED,maxLines:2});
    const n=a.size,bodyTop=top+31,availH=h-(bodyTop-y)-14,cell=Math.min((w-88)/(n+1),availH/(n+1),45),gw=cell*(n+1),sx=x+w/2-gw/2,sy=bodyTop+Math.max(0,(availH-gw)/2);
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
      const cx=sx+c*cell,cy=sy+r*cell,keep=!!a.solutionMask?.[r]?.[c],fill=answers&&keep?HIT:WHITE;
      page.rect(cx,cy,cell,cell,{fill,stroke:[148,168,171],width:.6});
      const v=formatNumber(a.valueGrid?.[r]?.[c]);
      diagramText(page,cx+cell/2,cy+cell*.64,v,Math.max(6,Math.min(10,cell*.28)),{bold:answers&&keep,color:answers&&!keep?[145,155,158]:answers&&keep?TEAL:INK});
      if(answers&&!keep){page.line(cx+cell*.18,cy+cell*.20,cx+cell*.82,cy+cell*.80,{color:[158,102,94],width:1});page.line(cx+cell*.82,cy+cell*.20,cx+cell*.18,cy+cell*.80,{color:[158,102,94],width:1});}
    }
    for(let r=0;r<n;r++){
      const cx=sx+n*cell,cy=sy+r*cell;page.rect(cx,cy,cell,cell,{fill:PALE,stroke:[111,150,146],width:.75});fitDiagramText(page,cx+cell/2,cy+cell*.64,formatNumber(a.rowTargets?.[r]),cell-5,Math.max(6,Math.min(10,cell*.27)),{bold:true,color:TEAL});
    }
    for(let c=0;c<n;c++){
      const cx=sx+c*cell,cy=sy+n*cell;page.rect(cx,cy,cell,cell,{fill:PALE,stroke:[111,150,146],width:.75});fitDiagramText(page,cx+cell/2,cy+cell*.64,formatNumber(a.colTargets?.[c]),cell-5,Math.max(6,Math.min(10,cell*.27)),{bold:true,color:TEAL});
    }
    const cx=sx+n*cell,cy=sy+n*cell;page.rect(cx,cy,cell,cell,{fill:[232,243,241],stroke:[111,150,146],width:.75});diagramText(page,cx+cell/2,cy+cell*.61,'SUM',Math.max(4.5,Math.min(6.8,cell*.18)),{bold:true,color:DARK});
  }

  function drawNumberLogicActivity(page,a,answers,x,y,w,h,index){if(a.engineId==='kakuro')return drawKakuro(page,a,answers,x,y,w,h,index);if(a.engineId==='futoshiki')return drawFutoshiki(page,a,answers,x,y,w,h,index);if(a.engineId==='arithmeticcages')return drawArithmeticCages(page,a,answers,x,y,w,h,index);if(a.engineId==='nonogram')return drawNonogram(page,a,answers,x,y,w,h,index);if(a.engineId==='numberpath')return drawNumberPath(page,a,answers,x,y,w,h,index);if(a.engineId==='sumplete')return drawSumplete(page,a,answers,x,y,w,h,index);}`,
  'Sumplete PDF renderer'],
  ["if(['kakuro','futoshiki','arithmeticcages','nonogram','numberpath'].includes(a.engineId))return drawNumberLogicActivity(page,a,answers,x,y,w,h,index);","if(['kakuro','futoshiki','arithmeticcages','nonogram','numberpath','sumplete'].includes(a.engineId))return drawNumberLogicActivity(page,a,answers,x,y,w,h,index);",'Sumplete PDF dispatch']
]);

console.log('Sumplete integration patch applied.');
