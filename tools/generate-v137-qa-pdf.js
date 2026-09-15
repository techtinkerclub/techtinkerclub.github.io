#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const req=p=>require(path.join(root,p));

req('assets/99club/games-vocabulary.js');
req('assets/99club/games-arithmetic.js');
req('assets/99club/games-number-logic.js');
req('assets/99club/games-number-towers-v137.js');
req('assets/99club/games-number-towers-v137-unique.js');
const G=req('assets/99club/games-engine.js');
req('assets/99club/games-puzzle-redesign-v135-logic.js');
req('assets/99club/simple-pdf.js');
req('assets/99club/games-pdf.js');
req('assets/99club/games-pdf-v136.js');
req('assets/99club/games-pdf-v137.js');
const PDF=global.TT99GamesPDF;

const raw={
  minYear:5,maxYear:6,
  topics:['number_place_value','calculation','algebra'],
  sheets:8,activitiesPerSheet:1,includeAnswers:true,workedExamples:'none',
  selectedEngines:['operationgrid','functionmachine','arithmagon','kakuro','numbertowers','symbols','balance'],
  personalisation:{schoolName:'99 CLUB STUDIO - VISUAL QA',packTitle:'v1.37 Puzzle Refinement Review',classLabel:'Pupil + answer pages',worksheetDate:'',logoDataUrl:'',logoWidth:0,logoHeight:0},
  engineSettings:{
    operationgrid:{difficulty:'challenge'},
    functionmachine:{difficulty:'challenge'},
    arithmagon:{difficulty:'challenge',shape:'square',operation:'mixed_within',connections:'diagonals',missing:'balanced'},
    kakuro:{difficulty:'challenge',gridSize:'8',givenLevel:'minimum'},
    numbertowers:{difficulty:'challenge',gridSize:'6',clueLevel:'balanced'},
    symbols:{difficulty:'challenge',symbolCount:'3',equationStyle:'coefficients'},
    balance:{difficulty:'challenge',rowCount:'6',style:'auto'}
  }
};
const settings=G.normalizeSettings(raw);
function activity(id,seed,patch={}){
  const s=G.clone(settings);
  s.engineSettings[id]={...(s.engineSettings[id]||{}),...patch};
  const a=G.generateActivity(id,s,seed);
  if(!a||a.error)throw new Error(`${id}: ${a?.error||'generation returned nothing'}`);
  return a;
}
const activities=[
  activity('operationgrid','qa-v137-codebreaker'),
  activity('functionmachine','qa-v137-machine'),
  activity('arithmagon','qa-v137-arithmagon'),
  activity('kakuro','qa-v137-kakuro8'),
  activity('numbertowers','qa-v137-towers-easy',{difficulty:'easy',gridSize:'4',clueLevel:'more'}),
  activity('numbertowers','qa-v137-towers-challenge',{difficulty:'challenge',gridSize:'6',clueLevel:'balanced'}),
  activity('symbols','qa-v137-symbols'),
  activity('balance','qa-v137-repair')
];
const pack={version:'v1.37-qa',seed:'QA-V137',settings,workedExamples:[],sheets:activities.map((a,i)=>({index:i+1,activities:[a]}))};
const doc=PDF.buildDocument({pack,settings,topics:G.TOPICS,seed:pack.seed,kind:'both'});
const out=process.argv[2]||path.join(root,'v1.37-visual-qa-pack.pdf');
fs.writeFileSync(out,Buffer.from(doc.outputBytes()));
console.log(`Wrote ${out} (${doc.pages.length} pages)`);
console.log(activities.map((a,i)=>`${i+1}. ${a.title} [${a.difficulty||''}]`).join('\n'));
