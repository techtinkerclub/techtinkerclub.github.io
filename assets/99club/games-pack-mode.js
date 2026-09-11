/* 99 Club Studio · Games pack mode v1.1.0
 * Adds exact activity counts and a deterministic random-compatible pack mode
 * without changing the individual game engines.
 */
(function(global){
  'use strict';

  const G=global.TT99Games;
  if(!G||G.__packModeV1)return;

  const STORAGE_MODE='tt99-games-pack-mode-v1';
  const STORAGE_COUNT='tt99-games-activity-count-v1';
  const STORAGE_DIFFICULTY='tt99-games-random-difficulty-v1';
  const DIFFICULTIES=['easy','standard','challenge'];
  const baseNormalize=G.normalizeSettings.bind(G);
  const baseSelected=G.selectedCompatibleEngines.bind(G);
  const baseCompatible=G.compatibleEngines.bind(G);
  const baseGeneratePack=G.generatePack.bind(G);

  function storageGet(key){
    try{return global.localStorage?.getItem(key)??null;}catch(e){return null;}
  }
  function clampCount(value,fallback=4){
    const n=Math.round(Number(value));
    return Math.max(1,Math.min(40,Number.isFinite(n)?n:fallback));
  }
  function resolveMode(input={}){
    if(input._forcePackMode==='random')return 'random';
    if(input._forcePackMode==='manual')return 'manual';
    const stored=storageGet(STORAGE_MODE);
    if(stored==='random'||stored==='manual')return stored;
    return input.packMode==='random'?'random':'manual';
  }
  function resolveCount(input,base){
    const legacy=Math.max(1,(Number(base.sheets)||1)*(Number(base.activitiesPerSheet)||1));
    const stored=storageGet(STORAGE_COUNT);
    return clampCount(stored??input.activityCount??legacy,legacy);
  }
  function resolveDifficulty(input={}){
    if(DIFFICULTIES.includes(input._forceRandomDifficulty))return input._forceRandomDifficulty;
    const stored=storageGet(STORAGE_DIFFICULTY);
    if(DIFFICULTIES.includes(stored))return stored;
    return DIFFICULTIES.includes(input.randomDifficulty)?input.randomDifficulty:'standard';
  }
  function normalizeSettings(input={}){
    const base=baseNormalize(input);
    const activityCount=resolveCount(input,base);
    return {...base,activityCount,packMode:resolveMode(input),randomDifficulty:resolveDifficulty(input),activitiesPerSheet:2,sheets:Math.ceil(activityCount/2)};
  }
  function manualSettings(settings){
    const s=normalizeSettings(settings);
    return {...s,_forcePackMode:'manual',packMode:'manual'};
  }
  function selectedCompatibleEngines(settings){
    const s=normalizeSettings(settings);
    if(s.packMode==='random')return baseCompatible(manualSettings(s));
    return baseSelected(manualSettings(s));
  }
  function shuffleDeterministic(items,seed){
    const out=items.slice(),rng=G.rngFromSeed(`${seed}:random-engine-bag`);
    for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
    return out;
  }
  function trimSheets(sheets,total){
    let remaining=total,index=1;const out=[];
    for(const sheet of sheets||[]){
      if(remaining<=0)break;
      const activities=(sheet.activities||[]).slice(0,remaining);
      if(activities.length)out.push({...sheet,index:index++,activities});
      remaining-=activities.length;
    }
    return out;
  }
  function uniqueUsedEngines(sheets){
    const seen=new Set(),ids=[];
    for(const sheet of sheets||[])for(const a of sheet.activities||[]){
      if(a?.engineId&&!seen.has(a.engineId)){seen.add(a.engineId);ids.push(a.engineId);}
    }
    return ids;
  }
  function applyRandomDifficulty(settings,engineIds,difficulty){
    const engineSettings={...(settings.engineSettings||{})};
    for(const id of engineIds){
      const current=engineSettings[id]||G.ENGINES[id]?.defaultSettings||{};
      engineSettings[id]={...current,difficulty};
    }
    return {...settings,engineSettings};
  }
  function generatePack(settings,seed='games',customVocabulary=[]){
    const s=normalizeSettings(settings);
    let requested={...s,activitiesPerSheet:2,sheets:Math.ceil(s.activityCount/2),workedExamples:'none',_forcePackMode:'manual',packMode:'manual'};

    if(s.packMode==='random'){
      const compatible=baseCompatible(requested);
      requested.selectedEngines=shuffleDeterministic(compatible,seed);
      requested=applyRandomDifficulty(requested,compatible,s.randomDifficulty);
    }

    const raw=baseGeneratePack(requested,seed,customVocabulary);
    const sheets=trimSheets(raw.sheets,s.activityCount);
    const usedIds=uniqueUsedEngines(sheets);
    const exampleSettings=s.packMode==='random'?applyRandomDifficulty(s,usedIds,s.randomDifficulty):s;
    const workedExamples=s.workedExamples==='front'
      ? usedIds.map((id,i)=>G.generateWorkedExample(id,exampleSettings,`${seed}:worked:${i}:${id}`,customVocabulary)).filter(Boolean)
      : [];

    return {...raw,settings:s,sheets,workedExamples,activityCount:s.activityCount,packMode:s.packMode,randomDifficulty:s.randomDifficulty,usedEngineIds:usedIds};
  }
  function generateRandomPack(settings,seed='games',customVocabulary=[]){
    return generatePack({...settings,_forcePackMode:'random'},seed,customVocabulary);
  }

  Object.assign(G,{
    normalizeSettings,
    selectedCompatibleEngines,
    generatePack,
    generateRandomPack,
    PACK_MODE:{version:'1.1.0',storageModeKey:STORAGE_MODE,storageCountKey:STORAGE_COUNT,storageDifficultyKey:STORAGE_DIFFICULTY,difficulties:DIFFICULTIES.slice(),maxActivities:40}
  });
  G.__packModeV1=true;
})(typeof globalThis!=='undefined'?globalThis:this);
