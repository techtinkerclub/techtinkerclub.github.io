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

const appSnippet=fs.readFileSync('scripts/sumplete-app-snippet.txt','utf8');
const pdfSnippet=fs.readFileSync('scripts/sumplete-pdf-snippet.txt','utf8');

patch('assets/99club/games-app.js',[
  ["engines:['maze','crossnumber','numbersearch','equationcrossgrid','target','brokencalc','operationgrid','kakuro','arithmeticcages']","engines:['maze','crossnumber','numbersearch','equationcrossgrid','target','brokencalc','operationgrid','kakuro','arithmeticcages','sumplete']",'arithmetic category'],
  ['  function renderNumberLogicActivity',appSnippet+'  function renderNumberLogicActivity','Sumplete browser renderer insertion'],
  ["if(a.engineId==='numberpath')return renderNumberPath(a,answers,index,si,ai);return","if(a.engineId==='numberpath')return renderNumberPath(a,answers,index,si,ai);if(a.engineId==='sumplete')return renderSumplete(a,answers,index,si,ai);return",'Sumplete browser dispatch']
]);

patch('assets/99club/games-pdf.js',[
  ['  function drawNumberLogicActivity',pdfSnippet+'  function drawNumberLogicActivity','Sumplete PDF renderer insertion'],
  ["if(a.engineId==='numberpath')return drawNumberPath(page,a,answers,x,y,w,h,index);}","if(a.engineId==='numberpath')return drawNumberPath(page,a,answers,x,y,w,h,index);if(a.engineId==='sumplete')return drawSumplete(page,a,answers,x,y,w,h,index);}",'Sumplete PDF logic dispatch'],
  ["['kakuro','futoshiki','arithmeticcages','nonogram','numberpath'].includes(a.engineId)","['kakuro','futoshiki','arithmeticcages','nonogram','numberpath','sumplete'].includes(a.engineId)",'Sumplete PDF activity dispatch']
]);

console.log('Sumplete integration patch applied.');
