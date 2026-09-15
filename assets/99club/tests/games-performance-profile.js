#!/usr/bin/env node
'use strict';
const path=require('path');
const root=path.join(__dirname,'..');
const load=f=>require(path.join(root,f));
[
 'games-vocabulary.js','games-arithmetic.js','games-crossgrid-v1321.js','games-property-maze.js',
 'games-number-logic.js','games-takuzu-v139.js','games-takuzu-v139-logic.js',
 'games-puzzle-pack-v140.js','games-puzzle-pack-v140-hashi.js','games-alphametics-library-v141.js',
 'games-number-towers-v137.js','games-number-towers-v137-unique.js','games-number-path-v2.js','games-sumplete.js',
 'games-engine.js','games-pack-mode.js'
].forEach(load);
const G=globalThis.TT99Games;
if(!G)throw new Error('TT99Games not loaded');
const topics=Object.keys(G.TOPICS);
function settingsFor(id,difficulty='challenge'){
  const s=G.normalizeSettings({minYear:6,maxYear:6,topics,selectedEngines:[id],sheets:1,activitiesPerSheet:1,activityCount:1,packMode:'manual',workedExamples:'none'});
  s.engineSettings[id]={...(s.engineSettings[id]||G.ENGINES[id]?.defaultSettings||{}),difficulty};
  return s;
}
function timed(label,fn){const t=process.hrtime.bigint();let value,error;try{value=fn();}catch(e){error=e;}const ms=Number(process.hrtime.bigint()-t)/1e6;console.log(`${label}\t${ms.toFixed(1)} ms${error?' ERROR '+error.message:''}`);if(error)throw error;return {value,ms};}
const engines=['takuzu','numbertowers','kakuro','killersudoku','hashi','mathsmines','alphametics','futoshiki','arithmeticcages','nonogram','numberpath','sumplete'];
console.log('--- per-engine challenge generation ---');
for(const id of engines){if(!G.ENGINES[id])continue;const s=settingsFor(id,'challenge');timed(id,()=>G.generateActivity(id,s,`perf:${id}`));}
console.log('\n--- repeated heavy engines (3 each) ---');
for(const id of ['numbertowers','killersudoku','hashi']){if(!G.ENGINES[id])continue;const s=settingsFor(id,'challenge');timed(`${id} x3`,()=>Array.from({length:3},(_,i)=>G.generateActivity(id,s,`perf:${id}:${i}`)));}
console.log('\n--- pack generation ---');
function randomSettings(count,difficulty){return G.normalizeSettings({minYear:3,maxYear:6,topics,activityCount:count,packMode:'random',randomDifficulty:difficulty,randomDifficultyWeights:{easy:25,standard:50,challenge:25},workedExamples:'none'});}
for(const count of [10,20,40])timed(`random standard ${count}`,()=>G.generatePack(randomSettings(count,'standard'),`perf:pack:std:${count}`,[]));
for(const count of [10,20,40])timed(`random mixed ${count}`,()=>G.generatePack(randomSettings(count,'mixed'),`perf:pack:mix:${count}`,[]));
