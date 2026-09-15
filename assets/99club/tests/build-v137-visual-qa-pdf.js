#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const A=path.join(__dirname,'..');

require(path.join(A,'simple-pdf.js'));
require(path.join(A,'games-arithmetic.js'));
require(path.join(A,'games-number-logic.js'));
require(path.join(A,'games-number-towers-v137.js'));
require(path.join(A,'games-number-towers-v137-unique.js'));
require(path.join(A,'games-number-path-v2.js'));
require(path.join(A,'games-sumplete.js'));
require(path.join(A,'games-engine.js'));
require(path.join(A,'games-puzzle-redesign-v135-logic.js'));
require(path.join(A,'games-pdf.js'));
require(path.join(A,'games-pdf-v136.js'));
require(path.join(A,'games-pdf-v137.js'));

const G=globalThis.TT99Games;
const PDF=globalThis.TT99GamesPDF;
if(!G||!PDF)throw new Error('Games engine/PDF stack did not initialise');

const base={
  minYear:5,maxYear:6,
  topics:['number_place_value','calculation','algebra'],
  sheets:1,activitiesPerSheet:1,includeAnswers:true,workedExamples:'none',selectedEngines:[],
  personalisation:{schoolName:'99 Club Studio',packTitle:'v1.37 Visual QA Pack',classLabel:'Development review',worksheetDate:'',logoDataUrl:'',logoWidth:0,logoHeight:0},
  engineSettings:{}
};

function settingsFor(id,opts){
  return G.normalizeSettings({...base,selectedEngines:[id],engineSettings:{[id]:opts}});
}
function activity(id,opts,seed){
  const a=G.generateActivity(id,settingsFor(id,opts),seed,[]);
  if(!a||a.error)throw new Error(`${id}: ${a?.error||'generation failed'}`);
  return a;
}
function challengeCodebreaker(){
  const opts={difficulty:'challenge',operations:'four'};
  for(let i=0;i<80;i++){
    const a=activity('operationgrid',opts,`QA-CODE-${i}`);
    if((a.rows||[]).some(r=>(String(r.text||'').match(/□/g)||[]).length>=2))return a;
  }
  throw new Error('Could not find a Challenge Codebreaker with a two-operation lock');
}

const cases=[
  {label:'Operation Codebreaker - Challenge multi-operation',a:challengeCodebreaker()},
  {label:'Function Machine - Challenge / 3 stages',a:activity('functionmachine',{difficulty:'challenge',stages:'3'},'QA-MACHINE-137')},
  {label:'Arithmagons - Challenge diagonals / mixed operations',a:activity('arithmagon',{difficulty:'challenge',shape:'hexagon',operation:'mixed_within',connections:'diagonals',missing:'balanced'},'QA-ARITH-137')},
  {label:'Kakuro - 8 x 8 Challenge',a:activity('kakuro',{difficulty:'challenge',gridSize:'8',givenLevel:'minimum'},'QA-KAKURO8-137')},
  {label:'Number Towers - Easy 4 x 4',a:activity('numbertowers',{difficulty:'easy',gridSize:'4',clueLevel:'more'},'QA-TOWERS-EASY-137')},
  {label:'Number Towers - Standard 5 x 5',a:activity('numbertowers',{difficulty:'standard',gridSize:'5',clueLevel:'balanced'},'QA-TOWERS-STD-137')},
  {label:'Number Towers - Challenge 6 x 6',a:activity('numbertowers',{difficulty:'challenge',gridSize:'6',clueLevel:'fewer'},'QA-TOWERS-CH-137')},
  {label:'Symbol Equations - Challenge',a:activity('symbols',{difficulty:'challenge',symbolCount:'3',equationStyle:'coefficients'},'QA-SYMBOLS-137')},
  {label:'Equation Repair - Standard',a:activity('balance',{difficulty:'standard'},'QA-REPAIR-137')}
];

cases.forEach((q,i)=>{q.a.title=q.label;});
const sheets=cases.map((q,i)=>({index:i+1,activities:[q.a]}));
const settings=G.normalizeSettings({...base,sheets:sheets.length,activitiesPerSheet:1,selectedEngines:cases.map(q=>q.a.engineId)});
const pack={version:'v1.37-visual-qa',seed:'V137-QA',settings,workedExamples:[],sheets};
const doc=PDF.buildDocument({pack,settings,kind:'both',topics:G.TOPICS,seed:pack.seed});
const out=path.resolve(process.argv[2]||'99-club-v1.37-visual-qa.pdf');
fs.writeFileSync(out,Buffer.from(doc.outputBytes()));
console.log(`Wrote ${out} (${doc.pages.length} pages, ${cases.length} pupil + ${cases.length} answer pages)`);
console.log(cases.map((q,i)=>`${i+1}. ${q.label}`).join('\n'));
