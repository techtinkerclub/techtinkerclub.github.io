/* 99 Club Studio v1.24.2 Maths Games & Puzzles smoke/regression test. */
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),REPO=path.resolve(ROOT,'../..');
const G=require(path.join(ROOT,'games-engine.js')),GPDF=require(path.join(ROOT,'games-pdf.js'));
function assert(ok,msg){if(!ok)throw new Error(msg);}const failures=[];function check(fn){try{fn();}catch(e){failures.push(e.stack||e.message);}}

check(()=>{
  assert(G.VERSION==='1.2.1','Unexpected games engine version');
  assert(Object.keys(G.ENGINES).join(',')==='wordsearch,pyramid,crossword','Expected Word Search + Number Pyramid + Crossword');
  assert(G.VOCABULARY.length===591,'Curated vocabulary database should expose 591 entries');
  for(const id of ['wordsearch','pyramid','crossword']){const e=G.ENGINES[id];assert(e.answerSheetSupport&&e.workedExampleSupport,`${id}: common output contract missing`);assert(e.needsDice===false&&e.needsPartner===false,`${id}: first games remain print → pencil → solve`);assert(e.defaultSettings&&Array.isArray(e.settingsSchema),`${id}: per-game settings missing`);}
});

check(()=>{
  const directionCases={straight:new Set(['1,0','0,1']),diagonal:new Set(['1,0','0,1','1,1','-1,1']),all:new Set(['1,0','-1,0','0,1','0,-1','1,1','-1,1','1,-1','-1,-1'])};
  for(const [mode,allowed] of Object.entries(directionCases)){
    const a=G.generateWordSearch({minYear:4,maxYear:4,topics:['fractions'],engineSettings:{wordsearch:{difficulty:'standard',directionMode:mode,wordCount:'10',gridSize:'16'}}},`dir-${mode}`);
    assert(!a.error,`wordsearch ${mode}: ${a.error}`);assert(a.placements.length>=6,`wordsearch ${mode}: too few placements`);for(const p of a.placements)assert(allowed.has(`${p.dx},${p.dy}`),`${mode}: illegal direction ${p.dx},${p.dy}`);
  }
});

check(()=>{
  for(const [topic,meta] of Object.entries(G.TOPICS))for(const year of meta.years){
    const settings={minYear:year,maxYear:year,topics:[topic],engineSettings:{wordsearch:{difficulty:'standard',clueMode:'words_definitions'}}};
    const a=G.generateWordSearch(settings,`ws-${topic}-${year}`),b=G.generateWordSearch(settings,`ws-${topic}-${year}`);assert(!a.error,`${topic} Y${year}: ${a.error}`);assert(JSON.stringify(a)===JSON.stringify(b),`${topic} Y${year}: nondeterministic`);assert(a.placements.length>=4,`${topic} Y${year}: too few terms`);
    for(const p of a.placements){const letters=G.normalizeTerm(p.term);assert(letters.length===p.cells.length,`${p.term}: length mismatch`);p.cells.forEach(([x,y],i)=>assert(a.grid[y][x]===letters[i],`${p.term}: placement mismatch`));}
  }
});

check(()=>{
  const settings={minYear:4,maxYear:5,topics:['fractions'],engineSettings:{wordsearch:{difficulty:'standard',wordCount:'8',gridSize:'16'}}};
  const a=G.generateWordSearch(settings,'replace-base'),before=a.placements.map(p=>p.term),next=G.replaceWordSearchEntry(a,2,settings,'replace-one');const after=next.placements.map(p=>p.term);
  assert(before.length===after.length,'single-term replacement changed word count');for(let i=0;i<before.length;i++)if(i!==2)assert(before[i]===after[i],`single-term replacement changed untouched term ${i}`);assert(before[2]!==after[2],'selected term was not replaced');
});

check(()=>{
  for(let year=1;year<=6;year++)for(const difficulty of ['easy','standard','challenge']){const a=G.generateNumberPyramid({minYear:year,maxYear:year,topics:['calculation'],engineSettings:{pyramid:{difficulty}}},`py-${year}-${difficulty}`),b=G.generateNumberPyramid({minYear:year,maxYear:year,topics:['calculation'],engineSettings:{pyramid:{difficulty}}},`py-${year}-${difficulty}`);assert(JSON.stringify(a)===JSON.stringify(b),`Pyramid Y${year} ${difficulty}: nondeterministic`);assert(a.rows.length>=3&&a.rows.length<=5,`Pyramid Y${year} ${difficulty}: row count`);assert(a.missingSet.length>=2,`Pyramid Y${year} ${difficulty}: insufficient blanks`);for(let r=0;r<a.rows.length-1;r++)for(let c=0;c<a.rows[r].length;c++)assert(a.rows[r][c]===a.rows[r+1][c]+a.rows[r+1][c+1],`Pyramid Y${year} ${difficulty}: broken sum invariant`);}
});

check(()=>{
  for(const [topic,meta] of Object.entries(G.TOPICS)){
    const year=meta.years[Math.floor(meta.years.length/2)],settings={minYear:year,maxYear:year,topics:[topic],engineSettings:{crossword:{difficulty:'standard',gridSize:'17',wordCount:'8'}}};const a=G.generateCrossword(settings,`cw-${topic}-${year}`),b=G.generateCrossword(settings,`cw-${topic}-${year}`);assert(!a.error,`${topic} crossword: ${a.error}`);assert(JSON.stringify(a)===JSON.stringify(b),`${topic} crossword nondeterministic`);assert(a.entries.length>=4,`${topic} crossword too small`);for(const e of a.entries)e.cells.forEach(([x,y],i)=>assert(a.grid[y][x]===e.answer[i],`${topic}: crossword cell mismatch for ${e.term}`));
    const used=a.entries.flatMap(e=>e.cells),xs=used.map(c=>c[0]),ys=used.map(c=>c[1]);assert(Math.min(...xs)===0&&Math.min(...ys)===0&&Math.max(...xs)===a.width-1&&Math.max(...ys)===a.height-1,`${topic}: crossword footprint should trim exactly to occupied cells`);
  }
});

check(()=>{
  const settings={minYear:4,maxYear:4,topics:['calculation'],sheets:2,activitiesPerSheet:3,selectedEngines:['wordsearch','pyramid','crossword'],workedExamples:'front'};const pack=G.generatePack(settings,'mixed-pack'),ids=pack.sheets.flatMap(s=>s.activities.map(a=>a.engineId));for(const id of ['wordsearch','pyramid','crossword'])assert(ids.includes(id),`mixed pack missing ${id}`);assert(pack.workedExamples.length===3,'worked examples should include one per selected compatible game');
  const geometry=G.generatePack({minYear:4,maxYear:4,topics:['geometry'],sheets:2,activitiesPerSheet:2,selectedEngines:['wordsearch','pyramid','crossword']},'geo-pack');assert(geometry.sheets.flatMap(s=>s.activities).every(a=>['wordsearch','crossword'].includes(a.engineId)),'Geometry pack should not force Number Pyramid');
});

check(()=>{
  const custom=G.sanitizeCustomVocabulary([{topic:'fractions',term:'My special term',definition:'A teacher-created definition.',minYear:4,maxYear:6},{topic:'fractions',term:'My special term',definition:'Duplicate.',minYear:4,maxYear:6}]);assert(custom.length===1&&custom[0].source==='mine','Custom vocabulary dedupe/source failed');const pool=G.vocabularyFor({minYear:4,maxYear:6,topics:['fractions'],engineSettings:{wordsearch:{difficulty:'standard'}}},custom);assert(pool.some(x=>x.source==='built-in')&&pool.some(x=>x.source==='mine'),'Vocabulary provider should distinguish built-in and My vocabulary');
});


check(()=>{
  const settings=G.normalizeSettings({minYear:3,maxYear:6,topics:['statistics'],sheets:2,activitiesPerSheet:2,selectedEngines:['crossword'],workedExamples:'front'}),pack=G.generatePack(settings,'pdf-crossword-pack');
  for(const kind of ['student','answers','both']){
    const doc=GPDF.buildDocument({pack,settings,kind,topics:G.TOPICS,seed:'pdf-crossword-pack'}),bytes=doc.outputBytes(),text=Buffer.from(bytes).toString('latin1');
    assert(bytes.length>8000,`${kind} PDF unexpectedly small`);assert(text.startsWith('%PDF-1.4'),`${kind} PDF header missing`);assert((text.match(/ re /g)||[]).length>50,`${kind} PDF did not draw crossword cells/boxes`);
  }
});

check(()=>{
  const page=fs.readFileSync(path.join(REPO,'_pages/99-club-games.md'),'utf8'),ui=fs.readFileSync(path.join(ROOT,'games-app.js'),'utf8'),main=fs.readFileSync(path.join(ROOT,'app.js'),'utf8'),angles=fs.readFileSync(path.join(ROOT,'custom-angles.js'),'utf8'),custom=fs.readFileSync(path.join(ROOT,'custom-app.js'),'utf8');
  assert(/permalink:\s*\/tools\/99-club\/games\//.test(page),'Games page permalink missing');assert(page.includes('/assets/99club/games-vocabulary.js')&&page.includes('/assets/99club/games-engine.js')&&page.includes('/assets/99club/simple-pdf.js')&&page.includes('/assets/99club/games-pdf.js')&&page.includes('/assets/99club/games-app.js'),'Games page asset stack incomplete');assert(main.includes('/tools/99-club/games/'),'Main 99 Club hero should link Games');
  assert(!/class=\"black\"/.test(ui),'Crossword browser renderer must not create blocked cells');
  const pdf=fs.readFileSync(path.join(ROOT,'games-pdf.js'),'utf8');assert(pdf.includes('Freeform classroom criss-cross')&&!pdf.includes("fill:[64,88,93],stroke:[64,88,93]"),'Crossword PDF renderer must draw active cells only');
  for(const phrase of ['Maths Crossword','Word directions','Any direction incl. backwards','Worked examples','At front — one example for each selected game','data-replace-activity','data-replace-word','curated built-in entries','Pupil sheets PDF','Answer key PDF','Pupil sheets + answers'])assert(ui.includes(phrase),`Games UI missing requirement: ${phrase}`);
  assert(!/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(ui),'Games UI must not upload teacher vocabulary');assert((angles.match(/strand:'Geometry'/g)||[]).length===8,'All 8 graphical angle families should belong to Geometry');assert(!/strandOrder=\[[^\]]*'Angles & turns'/.test(custom),'Custom selector should not expose standalone Angles & turns');
});

if(failures.length){console.error(`Games smoke FAILED (${failures.length})`);for(const f of failures)console.error(' - '+f);process.exit(2);}console.log(`Games smoke passed: ${G.VOCABULARY.length} curated vocabulary entries + Word Search direction presets + selective term/activity replacement contract + Number Pyramid + Crossword + worked examples.`);
