/* 99 Club Studio v1.23.1 Maths Games & Puzzles smoke/regression test. */
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),REPO=path.resolve(ROOT,'../..');
const G=require(path.join(ROOT,'games-engine.js'));
function assert(ok,msg){if(!ok)throw new Error(msg);}
const failures=[];function check(fn){try{fn();}catch(e){failures.push(e.message);}}

check(()=>{
  assert(G.VERSION==='1.1.0','Unexpected games engine version');
  assert(Object.keys(G.ENGINES).join(',')==='wordsearch,pyramid','First public games release should expose Word Search + Number Pyramid only');
  for(const id of ['wordsearch','pyramid']){
    const e=G.ENGINES[id];assert(e.answerSheetSupport===true,`${id}: answer-sheet support missing`);assert(e.needsDice===false&&e.needsPartner===false,`${id}: first-release engine must remain print → pencil → solve`);
    assert(e.defaultSettings&&Array.isArray(e.settingsSchema),`${id}: per-game settings contract missing`);
  }
});

check(()=>{
  for(const [topic,meta] of Object.entries(G.TOPICS)){
    for(const year of meta.years){
      for(const difficulty of ['easy','standard','challenge']){
        const settings={minYear:year,maxYear:year,topics:[topic],engineSettings:{wordsearch:{difficulty,clueMode:difficulty==='challenge'?'definitions':'words_definitions'}}};
        const a=G.generateWordSearch(settings,`ws-${topic}-${year}-${difficulty}`),b=G.generateWordSearch(settings,`ws-${topic}-${year}-${difficulty}`);
        assert(!a.error,`${topic} Y${year} ${difficulty}: ${a.error}`);
        assert(JSON.stringify(a)===JSON.stringify(b),`${topic} Y${year} ${difficulty}: nondeterministic`);
        assert(a.placements.length>=4,`${topic} Y${year} ${difficulty}: too few placed words`);
        for(const p of a.placements){
          const letters=G.normalizeTerm(p.term);assert(letters.length===p.cells.length,`${p.term}: placement length mismatch`);
          p.cells.forEach(([x,y],i)=>assert(a.grid[y][x]===letters[i],`${p.term}: grid placement mismatch`));
        }
        if(difficulty==='challenge')assert(a.mode==='definitions',`${topic} Y${year}: definitions-only mode missing`);else assert(a.mode==='words_definitions',`${topic} Y${year}: words + definitions mode missing`);
      }
    }
  }
});

check(()=>{
  for(let year=1;year<=6;year++)for(const difficulty of ['easy','standard','challenge']){
    const a=G.generateNumberPyramid({minYear:year,maxYear:year,topics:['calculation'],engineSettings:{pyramid:{difficulty}}},`py-${year}-${difficulty}`),b=G.generateNumberPyramid({minYear:year,maxYear:year,topics:['calculation'],engineSettings:{pyramid:{difficulty}}},`py-${year}-${difficulty}`);
    assert(JSON.stringify(a)===JSON.stringify(b),`Pyramid Y${year} ${difficulty}: nondeterministic`);
    assert(a.rows.length>=3&&a.rows.length<=5,`Pyramid Y${year} ${difficulty}: row count`);
    assert(a.missingSet.length>=2,`Pyramid Y${year} ${difficulty}: insufficient blanks`);
    for(let r=0;r<a.rows.length-1;r++)for(let c=0;c<a.rows[r].length;c++)assert(a.rows[r][c]===a.rows[r+1][c]+a.rows[r+1][c+1],`Pyramid Y${year} ${difficulty}: broken sum invariant`);
  }
});

check(()=>{
  const mixed=G.generatePack({minYear:4,maxYear:4,topics:['calculation'],sheets:2,activitiesPerSheet:2,selectedEngines:['wordsearch','pyramid']},'mixed-pack');
  const ids=mixed.sheets.flatMap(s=>s.activities.map(a=>a.engineId));assert(ids.includes('wordsearch')&&ids.includes('pyramid'),'Calculation mixed pack should use both first-release engines');
  const geometry=G.generatePack({minYear:4,maxYear:4,topics:['geometry'],sheets:2,activitiesPerSheet:2,selectedEngines:['wordsearch','pyramid']},'geo-pack');
  assert(geometry.sheets.flatMap(s=>s.activities).every(a=>a.engineId==='wordsearch'),'Geometry pack should not force an incompatible Number Pyramid');
  const repeated=G.generatePack({minYear:3,maxYear:5,topics:['calculation'],sheets:2,activitiesPerSheet:3,selectedEngines:['pyramid'],engineSettings:{pyramid:{difficulty:'easy'}}},'repeat');
  assert(repeated.sheets.flatMap(s=>s.activities).every(a=>a.engineId==='pyramid'),'Same-game mode should repeat selected engine');
});

check(()=>{
  const custom=G.sanitizeCustomVocabulary([{topic:'fractions',term:'My special term',definition:'A teacher-created definition.',minYear:4,maxYear:6},{topic:'fractions',term:'My special term',definition:'Duplicate.',minYear:4,maxYear:6}]);
  assert(custom.length===1&&custom[0].source==='mine','Custom vocabulary should sanitize/deduplicate and remain marked as mine');
  const pool=G.vocabularyFor({minYear:4,maxYear:6,topics:['fractions'],engineSettings:{wordsearch:{difficulty:'standard'}}},custom);
  assert(pool.some(x=>x.source==='built-in')&&pool.some(x=>x.source==='mine'),'Vocabulary provider should distinguish built-in and My vocabulary');
});

check(()=>{
  const page=fs.readFileSync(path.join(REPO,'_pages/99-club-games.md'),'utf8'),ui=fs.readFileSync(path.join(ROOT,'games-app.js'),'utf8'),main=fs.readFileSync(path.join(ROOT,'app.js'),'utf8'),angles=fs.readFileSync(path.join(ROOT,'custom-angles.js'),'utf8'),custom=fs.readFileSync(path.join(ROOT,'custom-app.js'),'utf8');
  assert(/permalink:\s*\/tools\/99-club\/games\//.test(page),'Games page permalink missing');
  assert(page.includes('/assets/99club/games-engine.js')&&page.includes('/assets/99club/games-app.js'),'Games page asset stack incomplete');
  assert(main.includes('/tools/99-club/games/'),'Main 99 Club hero should link to Games & puzzles');
  for(const phrase of ['Choose &amp; configure games','Activities / sheet','Vocabulary library','Export my vocabulary','Import vocabulary file','Words + definitions','Definitions only','Number of terms','Grid size','Pyramid levels','How many clues?'])assert(ui.includes(phrase),`Games UI missing requirement: ${phrase}`);
  assert(!/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(ui),'Games UI must not upload teacher vocabulary');
  assert((angles.match(/strand:'Geometry'/g)||[]).length===8,'All 8 graphical angle families should belong to Geometry');
  assert(!/strandOrder=\[[^\]]*'Angles & turns'/.test(custom),'Custom selector should not expose a standalone Angles & turns strand');
});

if(failures.length){console.error(`Games smoke FAILED (${failures.length})`);for(const f of failures)console.error(' - '+f);process.exit(2);}
console.log(`Games smoke passed: ${G.VOCABULARY.length} built-in vocabulary entries + Word Search + Number Pyramid + selected/mixed-game packs + local vocabulary contract + Geometry angle taxonomy.`);
