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
 'games-engine.js','games-pack-mode.js','games-performance-v142.js'
].forEach(load);
const G=globalThis.TT99Games;
if(!G)throw new Error('TT99Games not loaded');
const topics=Object.keys(G.TOPICS);
function timed(label,fn){const t=process.hrtime.bigint();let value,error;try{value=fn();}catch(e){error=e;}const ms=Number(process.hrtime.bigint()-t)/1e6;console.log(`${label}\t${ms.toFixed(1)} ms${error?' ERROR '+error.message:''}`);if(error)throw error;return {value,ms};}
function randomSettings(count,difficulty){return G.normalizeSettings({minYear:3,maxYear:6,topics,activityCount:count,packMode:'random',randomDifficulty:difficulty,randomDifficultyWeights:{easy:25,standard:50,challenge:25},workedExamples:'none'});}
console.log(`Performance layer ${G.PERFORMANCE?.version}; fast threshold ${G.PERFORMANCE?.largePackThreshold}`);
console.log('--- optimized pack generation ---');
const results=[];
for(const count of [10,20,40])results.push([`standard ${count}`,timed(`random standard ${count}`,()=>G.generatePack(randomSettings(count,'standard'),`perf:pack:std:${count}`,[])).ms]);
for(const count of [10,20,40])results.push([`mixed ${count}`,timed(`random mixed ${count}`,()=>G.generatePack(randomSettings(count,'mixed'),`perf:pack:mix:${count}`,[])).ms]);
console.log(`cache size after run\t${G.PERFORMANCE?.cacheSize?.()}`);
const slow=results.filter(([,ms])=>ms>15000);if(slow.length){console.error('Large-pack performance still unacceptable:',slow);process.exitCode=2;}
