#!/usr/bin/env node
'use strict';
const path=require('path'),ROOT=path.join(__dirname,'..');
require(path.join(ROOT,'games-arithmetic.js'));
require(path.join(ROOT,'games-number-logic.js'));
require(path.join(ROOT,'games-takuzu-v139.js'));
require(path.join(ROOT,'games-takuzu-v139-logic.js'));
require(path.join(ROOT,'games-puzzle-pack-v140.js'));
require(path.join(ROOT,'games-number-towers-v137.js'));
require(path.join(ROOT,'games-number-towers-v137-unique.js'));
require(path.join(ROOT,'games-number-path-v2.js'));
require(path.join(ROOT,'games-sumplete.js'));
const G=require(path.join(ROOT,'games-engine.js'));require(path.join(ROOT,'games-pack-mode.js'));require(path.join(ROOT,'games-instructions-v139.js'));
const NL=globalThis.TT99NumberLogicGames;function assert(v,m){if(!v)throw new Error(m);}const ids=['killersudoku','hashi','mathsmines','alphametics'];
for(const id of ids)assert(G.ENGINES[id],`${id} definition missing`);
for(const difficulty of ['easy','standard','challenge']){
  for(let i=0;i<8;i++){
    const base={minYear:3,maxYear:6,topics:['number_place_value','calculation','geometry','algebra'],selectedEngines:ids,engineSettings:{}};
    for(const id of ids){base.engineSettings[id]={...(G.ENGINES[id].defaultSettings||{}),difficulty};const s=G.normalizeSettings(base),a=G.generateActivity(id,s,`v140-${id}-${difficulty}-${i}`);assert(!a.error,`${id} ${difficulty} generation failed: ${a.error}`);const v=NL.validate(a);assert(v.ok,`${id} ${difficulty} invalid: ${v.error}`);assert(/TT99V140/.test(a.instruction),`${id} render marker missing`);if(id==='alphametics'){const words=[...(a.addends||[]),a.result];assert(words.every(w=>/^[A-Z]+$/.test(w)),`alphametics contains non-word token`);assert(!words.some(w=>/^A+$/.test(w)),`alphametics looks synthetic`);}}
  }
}
const alphaLabels=NL.V140.ALPHAMETICS.templates.map(t=>t.label);assert(alphaLabels.includes('BASE + BALL = GAMES'),'BASE/BALL template missing');assert(alphaLabels.includes('CROSS + ROADS = DANGER'),'CROSS/ROADS template missing');
console.log('PASS v1.40: four engines generated/validated across 96 puzzles; meaningful Alphametics templates present.');
