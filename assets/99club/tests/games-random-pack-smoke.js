'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

function rngFromSeed(seed){let h=2166136261>>>0;for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}let a=h||0x6d2b79f5;return()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const ENGINES={a:{id:'a'},b:{id:'b'},c:{id:'c'},d:{id:'d'}};
const base={
  ENGINES,rngFromSeed,
  normalizeSettings(s={}){return{minYear:1,maxYear:6,topics:['calculation'],sheets:Number(s.sheets)||1,activitiesPerSheet:Number(s.activitiesPerSheet)||1,selectedEngines:Array.isArray(s.selectedEngines)?s.selectedEngines:['a','b'],workedExamples:s.workedExamples==='front'?'front':'none'};},
  compatibleEngines(){return['a','b','c','d'];},
  selectedCompatibleEngines(s){return (s.selectedEngines||[]).filter(id=>ENGINES[id]);},
  generateWorkedExample(id){return{engineId:id,title:`${id} example`};},
  generatePack(s,seed){const sel=s.selectedEngines||[];let k=0;const sheets=[];for(let i=0;i<s.sheets;i++){const activities=[];for(let j=0;j<s.activitiesPerSheet;j++,k++)activities.push({engineId:sel[k<sel.length?k:k%sel.length]});sheets.push({index:i+1,activities});}return{seed,settings:s,sheets,workedExamples:[]};}
};
const context={globalThis:{TT99Games:base},console};context.globalThis.globalThis=context.globalThis;vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../games-pack-mode.js','utf8'),context);
const G=context.globalThis.TT99Games;
let p=G.generateRandomPack({activityCount:5,workedExamples:'front'},'seed');
assert.strictEqual(p.sheets.length,3);assert.strictEqual(JSON.stringify(p.sheets.map(s=>s.activities.length)),JSON.stringify([2,2,1]));assert.strictEqual(p.activityCount,5);assert.strictEqual(new Set(p.sheets.flatMap(s=>s.activities.map(a=>a.engineId))).size,4);assert.strictEqual(p.workedExamples.length,4);
let q=G.generateRandomPack({activityCount:3},'same-seed');let r=G.generateRandomPack({activityCount:3},'same-seed');assert.strictEqual(JSON.stringify(q.sheets),JSON.stringify(r.sheets));
let m=G.generatePack({activityCount:3,packMode:'manual',selectedEngines:['a','b']},'manual');assert.strictEqual(JSON.stringify(m.sheets.map(s=>s.activities.length)),JSON.stringify([2,1]));assert(m.sheets.flatMap(s=>s.activities).every(a=>['a','b'].includes(a.engineId)));
console.log('Games random-pack smoke: PASS');
