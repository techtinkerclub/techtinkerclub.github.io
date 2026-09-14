/* 99 Club Studio v1.32.2 crossgrid / nonogram usability regression. */
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
function assert(ok,msg){if(!ok)throw new Error(msg);}

const A=require(path.join(ROOT,'games-arithmetic.js'));
require(path.join(ROOT,'games-crossgrid-v1321.js'));
assert(global.TT99ArithmeticGames===A,'Crossgrid patch did not attach to arithmetic module');

let operatorPuzzle=null;
for(let i=0;i<120&&!operatorPuzzle;i++){
  const settings={minYear:6,maxYear:6,topics:['calculation'],engineSettings:{equationcrossgrid:{difficulty:'challenge',gridSize:'8',operationFamily:'mixed',missingLevel:'fewer_clues'}}};
  const a=A.generate('equationcrossgrid',settings,`v1321-crossgrid:${i}`);
  if(a?.hiddenOperatorKeys?.length)operatorPuzzle=a;
}
assert(operatorPuzzle,'Could not generate a crossgrid with a hidden operator');
assert(operatorPuzzle.instruction.includes('small ? in a corner'),'Crossgrid instruction does not explain the corner question mark');
for(const k of operatorPuzzle.hiddenOperatorKeys){
  assert((operatorPuzzle.hiddenKeys||[]).includes(k),`Hidden operator ${k} is not hidden`);
  const [r,c]=k.split(':').map(Number);
  assert(['+','-','×','÷'].includes(operatorPuzzle.solutionGrid[r][c]),`Hidden operator metadata points at ${operatorPuzzle.solutionGrid[r][c]}`);
}
const ex=A.workedExample('equationcrossgrid');
assert(ex.rules.some(x=>/small \?/i.test(x)),'Worked example does not explain the small question mark');

require(path.join(ROOT,'simple-pdf.js'));
require(path.join(ROOT,'games-pdf.js'));
require(path.join(ROOT,'games-layout-v1321.js'));
const PDF=global.TT99GamesPDF;
assert(PDF?.__layoutV1321,'PDF layout patch did not attach');

const n=10,nonogram={
  engineId:'nonogram',title:'Number Picture',difficulty:'standard',size:n,
  instruction:'Use the clues to decide which squares to shade. Each number is a consecutive block; separate blocks with at least one empty square.',
  rowClues:[[1,1,1,1],[2,1,1,2],[2,2],[3,3],[1,1],[1,1,1,1],[4,4],[1,1,1,1],[2,4,2],[1,1]],
  colClues:[[2,1,4],[3,1,1],[1,2],[2,1,2],[1,4],[1],[1,4],[2,2],[3,1,1],[2,1,4]],
  solutionGrid:Array.from({length:n},()=>Array(n).fill(0))
};
const settings={minYear:4,maxYear:6,topics:['number_place_value'],workedExamples:'none',personalisation:{packTitle:'QA'}};
const doc=PDF.buildDocument({pack:{seed:'QA',sheets:[{index:1,activities:[nonogram]}]},settings,topics:{number_place_value:{label:'Number & place value'}},kind:'student',seed:'QA'});
const commands=doc.pages[0].cmds.join('\n');
assert(commands.includes('(1)'),'Redrawn nonogram row-clue digits missing from direct PDF commands');
assert(!commands.includes('(1 1 1 1)'),'Nonogram row clues should be emitted in fixed individual slots, not as one unaligned text string');
assert(commands.includes('1.45 w'),'Redrawn nonogram outer frame missing from direct PDF commands');
const layout=global.TT99GamesLayoutV1321;
const g=layout.nonogramGeometry(nonogram,34,110,527.28,689.89);
assert(g.gx-g.rowW>=34,`Nonogram left clue area escapes frame: ${g.gx-g.rowW}`);
assert(g.gx+n*g.cell<=595.28-34+.01,'Nonogram grid escapes right activity edge');
assert(g.gy-g.topClueH>=g.overlayTop-.01,'Nonogram top clues overlap instruction area');
assert(g.rowGap>=14,'Nonogram row clues do not keep a deliberate gap from the grid');
const lastOfFour=layout.rowClueX(g,4,3),single=layout.rowClueX(g,1,0);
assert(Math.abs(lastOfFour-single)<.001,'Nonogram row-clue groups are not right-aligned to a common final clue column');
assert(g.gx-lastOfFour>=g.rowGap+g.rowSlotW*.49,'Nonogram last row clue sits too close to the grid');
for(let k=1;k<4;k++)assert(layout.rowClueX(g,4,k)-layout.rowClueX(g,4,k-1)>=g.rowSlotW-.001,'Nonogram row-clue slots are collapsing together');

const crossDoc=PDF.buildDocument({pack:{seed:'QA2',sheets:[{index:1,activities:[operatorPuzzle]}]},settings,topics:{calculation:{label:'Calculation'}},kind:'student',seed:'QA2'});
assert(crossDoc.pages[0].cmds.join('\n').includes('(?)'),'Direct PDF does not draw the small corner question mark for a hidden operator');

const page=fs.readFileSync(path.resolve(ROOT,'../../_pages/99-club-games.md'),'utf8');
assert(page.includes('games-crossgrid-v1321.js?v=1'),'Games page does not load crossgrid patch');
assert(page.includes('games-layout-v1321.css?v=1')&&page.includes('games-layout-v1321.js?v=2'),'Games page does not load current layout assets');
const css=fs.readFileSync(path.join(ROOT,'games-layout-v1321.css'),'utf8');
assert(css.includes('.pixel.ng-frame-top')&&css.includes('.pixel.ng-frame-left'),'Browser nonogram outer-frame rules missing');

console.log(`Games v1.32.2 layout regression: PASS · ${operatorPuzzle.hiddenOperatorKeys.length} hidden operator hint(s), aligned nonogram row-clue slots, compact column clues and explicit browser frame.`);
