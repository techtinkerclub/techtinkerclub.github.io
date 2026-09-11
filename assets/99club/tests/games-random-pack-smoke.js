'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

function rngFromSeed(seed){let h=2166136261>>>0;for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}let a=h||0x6d2b79f5;return()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const ENGINES={a:{id:'a',defaultSettings:{difficulty:'standard'}},b:{id:'b',defaultSettings:{difficulty:'standard'}},c:{id:'c',defaultSettings:{difficulty:'standard'}},d:{id:'d',defaultSettings:{difficulty:'standard'}}};
const base={
  ENGINES,rngFromSeed,
  normalizeSettings(s={}){const engineSettings={};for(const id of Object.keys(ENGINES))engineSettings[id]={...ENGINES[id].defaultSettings,...(s.engineSettings?.[id]||{})};return{minYear:1,maxYear:6,topics:['calculation'],sheets:Number(s.sheets)||1,activitiesPerSheet:Number(s.activitiesPerSheet)||1,selectedEngines:Array.isArray(s.selectedEngines)?s.selectedEngines:['a','b'],workedExamples:s.workedExamples==='front'?'front':'none',engineSettings};},
  compatibleEngines(){return['a','b','c','d'];},
  selectedCompatibleEngines(s){return (s.selectedEngines||[]).filter(id=>ENGINES[id]);},
  generateWorkedExample(id,s){return{engineId:id,title:`${id} example`,difficulty:s.engineSettings?.[id]?.difficulty||'standard'};},
  generatePack(s,seed){const sel=s.selectedEngines||[];let k=0;const sheets=[];for(let i=0;i<s.sheets;i++){const activities=[];for(let j=0;j<s.activitiesPerSheet;j++,k++){const id=sel[k<sel.length?k:k%sel.length];activities.push({engineId:id,difficulty:s.engineSettings?.[id]?.difficulty||'standard'});}sheets.push({index:i+1,activities});}return{seed,settings:s,sheets,workedExamples:[]};}
};
const context={globalThis:{TT99Games:base},console};context.globalThis.globalThis=context.globalThis;vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../games-pack-mode.js','utf8'),context);
const G=context.globalThis.TT99Games;

let p=G.generateRandomPack({activityCount:5,workedExamples:'front',randomDifficulty:'challenge'},'seed');
assert.strictEqual(p.sheets.length,3);
assert.strictEqual(JSON.stringify(p.sheets.map(s=>s.activities.length)),JSON.stringify([2,2,1]));
assert.strictEqual(p.activityCount,5);
assert.strictEqual(new Set(p.sheets.flatMap(s=>s.activities.map(a=>a.engineId))).size,4);
assert.strictEqual(p.workedExamples.length,4);
assert.strictEqual(p.randomDifficulty,'challenge');
assert(p.sheets.flatMap(s=>s.activities).every(a=>a.difficulty==='challenge'),'random pack must apply the selected difficulty to every generated engine');
assert(p.workedExamples.every(ex=>ex.difficulty==='challenge'),'worked examples must use the random-pack difficulty');

let q=G.generateRandomPack({activityCount:3,randomDifficulty:'easy'},'same-seed');
let r=G.generateRandomPack({activityCount:3,randomDifficulty:'easy'},'same-seed');
assert.strictEqual(JSON.stringify(q.sheets),JSON.stringify(r.sheets));
assert(q.sheets.flatMap(s=>s.activities).every(a=>a.difficulty==='easy'));

let m=G.generatePack({activityCount:3,packMode:'manual',selectedEngines:['a','b'],engineSettings:{a:{difficulty:'easy'},b:{difficulty:'challenge'}}},'manual');
assert.strictEqual(JSON.stringify(m.sheets.map(s=>s.activities.length)),JSON.stringify([2,1]));
assert(m.sheets.flatMap(s=>s.activities).every(a=>['a','b'].includes(a.engineId)));
assert.strictEqual(m.sheets[0].activities[0].difficulty,'easy');
assert.strictEqual(m.sheets[0].activities[1].difficulty,'challenge');
console.log('Games random-pack smoke: PASS');
