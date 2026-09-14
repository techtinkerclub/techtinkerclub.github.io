'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..','assets','99club');

require(path.join(ROOT,'simple-pdf.js'));
require(path.join(ROOT,'games-number-logic.js'));
require(path.join(ROOT,'games-number-path-v2.js'));
require(path.join(ROOT,'games-sumplete.js'));
const G=require(path.join(ROOT,'games-engine.js'));
const PDF=require(path.join(ROOT,'games-pdf.js'));

const base={
  minYear:4,maxYear:6,topics:['calculation'],selectedEngines:['sumplete'],
  sheets:3,activitiesPerSheet:1,includeAnswers:true,workedExamples:'none',
  personalisation:{schoolName:'99 Club Studio QA',packTitle:'Sumplete - print review',classLabel:'',worksheetDate:'',logoDataUrl:'',logoWidth:0,logoHeight:0},
  engineSettings:{sumplete:{difficulty:'standard',gridSize:'auto',numberRange:'auto'}}
};
const variants=[
  ['easy','sumplete-qa-easy'],
  ['standard','sumplete-qa-standard'],
  ['challenge','sumplete-qa-challenge']
];
const sheets=variants.map(([difficulty,seed],i)=>{
  const settings=JSON.parse(JSON.stringify(base));
  settings.engineSettings.sumplete.difficulty=difficulty;
  const a=G.generateActivity('sumplete',settings,seed,[]);
  const v=G.NUMLOGIC.validate(a);
  if(!v.ok)throw new Error(`${difficulty}: ${v.error}`);
  return {index:i+1,activities:[a]};
});
const settings=G.normalizeSettings(base);
const pack={version:G.VERSION,seed:'sumplete-qa',settings,workedExamples:[],sheets};
const doc=PDF.buildDocument({pack,settings,kind:'both',topics:G.TOPICS,seed:pack.seed});
fs.mkdirSync('qa-output',{recursive:true});
fs.writeFileSync('qa-output/sumplete-qa.pdf',Buffer.from(doc.outputBytes()));
fs.writeFileSync('qa-output/sumplete-qa.json',JSON.stringify(sheets.map(s=>({difficulty:s.activities[0].difficulty,size:s.activities[0].size,complexity:s.activities[0].complexity,rowTargets:s.activities[0].rowTargets,colTargets:s.activities[0].colTargets,valueGrid:s.activities[0].valueGrid,solutionMask:s.activities[0].solutionMask})),null,2));
console.log('Generated Sumplete QA PDF with Easy 4x4, Standard 5x5 and Challenge 6x6 pupil + answer pages.');
