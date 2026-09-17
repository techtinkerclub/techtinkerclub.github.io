require('../simple-pdf.js');
require('../games-vocabulary.js');
require('../games-arithmetic.js');
require('../games-balance-lab-v192.js');
require('../games-number-logic.js');
require('../games-engine.js');
require('../games-puzzle-redesign-v135-logic.js');
require('../games-pdf.js');
require('../games-pdf-v136.js');
const fs=require('fs');
const G=global.TT99Games,PDF=global.TT99GamesPDF;
for(const difficulty of ['easy','standard','challenge']){
  const settings=G.normalizeSettings({minYear:4,maxYear:6,topics:['calculation','algebra'],sheets:1,activitiesPerSheet:1,selectedEngines:['balance'],includeAnswers:true,engineSettings:{balance:{difficulty,rowCount:'auto',style:'auto'}}});
  const pack=G.generatePack(settings,`paper-v193-${difficulty}`);
  const a=pack.sheets[0].activities[0];
  if(!a.finalChallenge?.solutionSides||a.finalChallenge.solutionSides.length!==a.rows.length)throw new Error('missing final side mapping');
  const doc=PDF.buildDocument({pack,settings:pack.settings,kind:'both',topics:G.TOPICS||{},seed:pack.seed});
  const commands=doc.pages.flatMap(p=>p.cmds||[]).join('\n');
  for(const marker of ['WEIGHT A','FINAL BALANCE','LEFT PAN','RIGHT PAN','TOTAL']) if(!commands.includes(marker))throw new Error(`missing ${marker}`);
  if(commands.includes('REPAIR TILES'))throw new Error('legacy repair overlay returned');
  const bytes=doc.outputBytes();
  if(bytes.length<5000)throw new Error('PDF unexpectedly small');
  fs.writeFileSync(`/tmp/balance-lab-${difficulty}.pdf`,Buffer.from(bytes));
}
console.log('Balance Lab paper v1.93 checks passed');
