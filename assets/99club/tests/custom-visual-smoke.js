/* 99 Club Studio v1.20 Custom Worksheet visual smoke test.
 * Run from repository root with: node assets/99club/tests/custom-visual-smoke.js
 */
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const G=require(path.join(ROOT,'generator.js'));
const P=require(path.join(ROOT,'simple-pdf.js'));
const L=require(path.join(ROOT,'pdf-layout.js'));
globalThis.TT99Generator=G;globalThis.TT99SimplePDF=P;globalThis.TT99PDFLayout=L;
require(path.join(ROOT,'custom-graphs.js'));
require(path.join(ROOT,'custom-coordinates.js'));
const C=globalThis.TT99CustomCoordinates;
function assert(ok,msg){if(!ok)throw new Error(msg);}
const expected={coordinates_y4:[72,12],transformations_y5:[54,9],coordinates_y6:[108,18],coordinates_extension:[24,4]};
const graphExpected=[['bar_charts',3,68,17],['bar_charts',4,116,29],['time_graphs',4,44,11],['line_graphs',5,80,20],['line_graphs',6,104,26]];
for(const [family,year,poolCount,typeCount] of graphExpected){const rules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:[family],familyWeights:{[family]:1},questionCount:8,progressionEnabled:false,curriculumYear:year});const pool=G.questionPool(family,rules);assert(pool.length===poolCount,`${family} Y${year}: graph pool regression`);assert(new Set(pool.map(q=>q.graphTypeId)).size===typeCount,`${family} Y${year}: graph subtype regression`);}
for(const [family,[poolCount,typeCount]] of Object.entries(expected)){
  const year=(C.COORD_FAMILIES[family].years||[])[0]||0;
  const rules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:[family],familyWeights:{[family]:1},questionCount:24,progressionEnabled:false,curriculumYear:year});
  const pool=G.questionPool(family,rules);
  assert(pool.length===poolCount,`${family}: pool ${pool.length}/${poolCount}`);
  assert(new Set(pool.map(q=>q.coordinateTypeId)).size===typeCount,`${family}: subtype count`);
  assert(pool.every(q=>C.validateVisual(q.visual).ok),`${family}: invalid visual bounds`);
  for(let seed=0;seed<100;seed++){
    const a=G.generateQuestions(rules,`coord-smoke-${seed}`),b=G.generateQuestions(rules,`coord-smoke-${seed}`);
    assert(a.length===24,`${family}: short generation`);assert(JSON.stringify(a)===JSON.stringify(b),`${family}: nondeterministic`);
  }
}
const mixedFamilies=['addition','bar_charts','time_graphs','line_graphs','coordinates_y4','transformations_y5','coordinates_y6','coordinates_extension'];
for(let seed=0;seed<25;seed++){
  const rules=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET,families:mixedFamilies,familyWeights:Object.fromEntries(mixedFamilies.map(f=>[f,1])),questionCount:60,progressionEnabled:false,curriculumYear:0});
  assert(G.generateQuestions(rules,`mixed-${seed}`).length===60,'mixed visual sheet short');
}
const app=fs.readFileSync(path.join(ROOT,'custom-app.js'),'utf8');
const graphs=fs.readFileSync(path.join(ROOT,'custom-graphs.js'),'utf8');
assert(!/data-family-preset/.test(app),'Year/Core quick-select controls should be removed');
assert(/tt99-clear-all-families/.test(app),'Clear-all topic control missing');
assert(/data-clear-family-strand/.test(app),'Per-category clear control missing');
assert(!/list\.length<=8\s*&&\s*selected>0/.test(app),'Selected categories must not auto-open themselves');
assert(!/MutationObserver/.test(graphs),'Graph module must not mutate/observe Custom UI');
const blank=G.normalizeRules({...G.OPEN_WORKSHEET_PRESET});
assert(blank.families.length===0,'Custom Worksheet should default to zero topics');
assert(G.generateQuestions(blank,'blank').length===0,'Blank state should be safe to generate internally');
console.log('Custom visual smoke test passed: blank-canvas UX + 258 coordinate pool entries / 43 stable subtypes + mixed graph/coordinate generation.');
