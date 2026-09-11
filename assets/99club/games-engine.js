/* 99 Club Studio · Maths Games & Puzzles
 * v1.3.1 — strict topical vocabulary + puzzle-safe term filtering.
 * Architecture: game engine + maths content provider + applicability rules.
 */
(function(global){
  'use strict';

  const VERSION='1.3.1';
  let VOCAB_DATA=global.TT99GamesVocabularyV2||null;
  if(!VOCAB_DATA && typeof require==='function'){
    try{VOCAB_DATA=require('./games-vocabulary.js');}catch(e){}
  }

  const TOPICS={
    number_place_value:{label:'Number & place value',years:[1,2,3,4,5,6]},
    calculation:{label:'Calculation',years:[1,2,3,4,5,6]},
    fractions:{label:'Fractions',years:[1,2,3,4,5,6]},
    decimals_percentages:{label:'Decimals & percentages',years:[4,5,6]},
    ratio_proportion:{label:'Ratio & proportion',years:[6]},
    measurement:{label:'Measurement',years:[1,2,3,4,5,6]},
    geometry:{label:'Geometry',years:[1,2,3,4,5,6]},
    statistics:{label:'Statistics',years:[2,3,4,5,6]},
    algebra:{label:'Algebra & sequences',years:[2,3,4,5,6]}
  };

  const ENGINES={
    wordsearch:{
      id:'wordsearch',title:'Maths Word Search',group:'Vocabulary & language',kind:'independent',printableMode:'grid',answerSheetSupport:true,workedExampleSupport:true,
      supportedAnswerTypes:['vocabulary'],minItems:6,maxItems:14,difficultyOptions:['easy','standard','challenge'],needsCutting:false,needsDice:false,needsPartner:false,
      defaultSettings:{difficulty:'standard',clueMode:'words_definitions',wordCount:'auto',gridSize:'auto',directionMode:'auto'},
      settingsSchema:[
        {id:'difficulty',type:'choice',label:'Difficulty',options:['easy','standard','challenge']},
        {id:'clueMode',type:'choice',label:'Clues',options:['words_definitions','definitions']},
        {id:'wordCount',type:'select',label:'Number of terms',options:['auto','6','8','10','12']},
        {id:'gridSize',type:'select',label:'Grid size',options:['auto','12','14','16']},
        {id:'directionMode',type:'select',label:'Word directions',options:['auto','straight','diagonal','all']}
      ],
      compatibility:Object.fromEntries(Object.keys(TOPICS).map(t=>[t,'excellent']))
    },
    pyramid:{
      id:'pyramid',title:'Number Pyramid',group:'Number & arithmetic',kind:'independent',printableMode:'puzzle',answerSheetSupport:true,workedExampleSupport:true,
      supportedAnswerTypes:['integer'],minItems:1,maxItems:3,difficultyOptions:['easy','standard','challenge'],needsCutting:false,needsDice:false,needsPartner:false,
      defaultSettings:{difficulty:'standard',levels:'auto',clueLevel:'balanced'},
      settingsSchema:[
        {id:'difficulty',type:'choice',label:'Difficulty',options:['easy','standard','challenge']},
        {id:'levels',type:'select',label:'Pyramid levels',options:['auto','3','4','5']},
        {id:'clueLevel',type:'choice',label:'Clues shown',options:['more','balanced','fewer']}
      ],
      compatibility:{number_place_value:'excellent',calculation:'excellent',fractions:'poor',decimals_percentages:'poor',ratio_proportion:'poor',measurement:'poor',geometry:'poor',statistics:'poor',algebra:'poor'}
    },
    crossword:{
      id:'crossword',title:'Maths Crossword',group:'Vocabulary & language',kind:'independent',printableMode:'grid',answerSheetSupport:true,workedExampleSupport:true,
      supportedAnswerTypes:['vocabulary'],minItems:5,maxItems:12,difficultyOptions:['easy','standard','challenge'],needsCutting:false,needsDice:false,needsPartner:false,
      defaultSettings:{difficulty:'standard',wordCount:'auto',gridSize:'auto',wordBank:'auto'},
      settingsSchema:[
        {id:'difficulty',type:'choice',label:'Difficulty',options:['easy','standard','challenge']},
        {id:'wordCount',type:'select',label:'Number of answers',options:['auto','6','8','10','12']},
        {id:'gridSize',type:'select',label:'Grid size',options:['auto','13','15','17']},
        {id:'wordBank',type:'select',label:'Word bank',options:['auto','show','hide']}
      ],
      compatibility:Object.fromEntries(Object.keys(TOPICS).map(t=>[t,'excellent']))
    },
    magic:{
      id:'magic',title:'Magic Squares',group:'Logic & patterns',kind:'independent',printableMode:'puzzle',answerSheetSupport:true,workedExampleSupport:true,
      supportedAnswerTypes:['number','reasoning'],minItems:1,maxItems:3,difficultyOptions:['easy','standard','challenge'],needsCutting:false,needsDice:false,needsPartner:false,
      defaultSettings:{difficulty:'standard',gridSize:'auto',puzzleType:'auto',numberPattern:'auto',clueLevel:'balanced'},
      settingsSchema:[
        {id:'difficulty',type:'choice',label:'Difficulty',options:['easy','standard','challenge']},
        {id:'gridSize',type:'select',label:'Square size',options:['auto','3','4']},
        {id:'puzzleType',type:'select',label:'Puzzle style',options:['auto','missing','find_total','repair','transform']},
        {id:'numberPattern',type:'select',label:'Numbers',options:['auto','classic','shifted','scaled','decimal']},
        {id:'clueLevel',type:'choice',label:'Clues shown',options:['more','balanced','fewer']}
      ],
      compatibility:{number_place_value:'excellent',calculation:'excellent',fractions:'poor',decimals_percentages:'reasonable',ratio_proportion:'poor',measurement:'poor',geometry:'poor',statistics:'poor',algebra:'reasonable'}
    }
  };

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function hashString(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function rngFromSeed(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function randInt(rng,a,b){return Math.floor(rng()*(b-a+1))+a;}
  function normalizeTerm(term){return String(term||'').toUpperCase().replace(/[^A-Z]/g,'');}
  // Vocabulary grids are letter puzzles. Keep numerals / mathematical symbols in the master
  // vocabulary catalogue for other uses, but do not turn e.g. "3-D shape" into "DSHAPE".
  function puzzleTermSuitable(term){const text=String(term||'').trim();return /^[A-Za-z][A-Za-z '\u2019-]*$/.test(text)&&!/[0-9]/.test(text)&&normalizeTerm(text).length>=2;}
  function answerEnumeration(term){const words=String(term||'').trim().split(/\s+/).filter(Boolean).map(word=>word.split('-').map(part=>(part.match(/[A-Za-z]/g)||[]).length).filter(Boolean).join('-')).filter(Boolean);return words.length?`(${words.join(', ')})`:'';}
  function needsEnumeration(term){return /[\s-]/.test(String(term||'').trim());}
  function formatNumber(value){const n=Number(value);if(!Number.isFinite(n))return String(value??'');const r=Math.round(n*1000)/1000;return Number.isInteger(r)?String(r):String(r).replace(/0+$/,'').replace(/\.$/,'');}
  function yearText(minYear,maxYear){return minYear===maxYear?`Year ${minYear}`:`Years ${minYear}–${maxYear}`;}

  function mapBuiltInVocabulary(raw){
    const term=String(raw?.term||'').trim(),definition=String(raw?.definition||'').trim();
    if(!term||!definition)return null;
    const primaryTopic=TOPICS[raw.topic]?raw.topic:null;
    const appTopics=[...new Set([...(Array.isArray(raw.app_topics)?raw.app_topics:[]),primaryTopic].filter(t=>TOPICS[t]))];
    const puzzleSafe=puzzleTermSuitable(term);
    return {
      id:raw.id||`${raw.topic||appTopics[0]}.${term.toLowerCase().replace(/[^a-z0-9]+/g,'_')}`,
      topic:primaryTopic||(appTopics[0]||'number_place_value'),primaryTopic,sourceTopic:String(raw.topic||''),appTopics:appTopics.length?appTopics:['number_place_value'],subtopic:raw.subtopic||'',
      term,definition,crosswordClue:String(raw.crossword_clue||definition),gridAnswer:String(raw.grid_answer||normalizeTerm(term)),
      minYear:clamp(Number(raw.min_year)||1,1,6),maxYear:clamp(Number(raw.max_year)||6,1,6),priority:raw.priority||'core',source:'built-in',
      wordsearchSuitable:raw.wordsearch_suitable!==false&&puzzleSafe,crosswordSuitable:raw.crossword_suitable!==false&&puzzleSafe,minimumWordsearchGrid:Number(raw.minimum_wordsearch_grid)||Math.max(8,normalizeTerm(term).length),aliases:raw.aliases||[]
    };
  }
  const VOCABULARY=((VOCAB_DATA&&Array.isArray(VOCAB_DATA.entries))?VOCAB_DATA.entries:[]).map(mapBuiltInVocabulary).filter(Boolean);
  const VOCABULARY_METADATA=(VOCAB_DATA&&VOCAB_DATA.metadata)||{};

  function normalizeEngineSettings(engineId,raw={}){
    const defaults=ENGINES[engineId]?.defaultSettings||{};
    if(engineId==='wordsearch'){
      const legacyMode=raw.clueMode||raw.wordSearchMode;
      return {
        difficulty:['easy','standard','challenge'].includes(raw.difficulty)?raw.difficulty:defaults.difficulty,
        clueMode:['words_definitions','definitions'].includes(legacyMode)?legacyMode:(legacyMode==='words'?'words_definitions':defaults.clueMode),
        wordCount:['auto','6','8','10','12'].includes(String(raw.wordCount??'auto'))?String(raw.wordCount??'auto'):'auto',
        gridSize:['auto','12','14','16'].includes(String(raw.gridSize??'auto'))?String(raw.gridSize??'auto'):'auto',
        directionMode:['auto','straight','diagonal','all'].includes(raw.directionMode)?raw.directionMode:'auto'
      };
    }
    if(engineId==='pyramid')return {
      difficulty:['easy','standard','challenge'].includes(raw.difficulty)?raw.difficulty:defaults.difficulty,
      levels:['auto','3','4','5'].includes(String(raw.levels??'auto'))?String(raw.levels??'auto'):'auto',
      clueLevel:['more','balanced','fewer'].includes(raw.clueLevel)?raw.clueLevel:defaults.clueLevel
    };
    if(engineId==='crossword')return {
      difficulty:['easy','standard','challenge'].includes(raw.difficulty)?raw.difficulty:defaults.difficulty,
      wordCount:['auto','6','8','10','12'].includes(String(raw.wordCount??'auto'))?String(raw.wordCount??'auto'):'auto',
      gridSize:['auto','13','15','17'].includes(String(raw.gridSize??'auto'))?String(raw.gridSize??'auto'):'auto',
      wordBank:['auto','show','hide'].includes(raw.wordBank)?raw.wordBank:'auto'
    };
    if(engineId==='magic')return {
      difficulty:['easy','standard','challenge'].includes(raw.difficulty)?raw.difficulty:defaults.difficulty,
      gridSize:['auto','3','4'].includes(String(raw.gridSize??'auto'))?String(raw.gridSize??'auto'):'auto',
      puzzleType:['auto','missing','find_total','repair','transform'].includes(raw.puzzleType)?raw.puzzleType:'auto',
      numberPattern:['auto','classic','shifted','scaled','decimal'].includes(raw.numberPattern)?raw.numberPattern:'auto',
      clueLevel:['more','balanced','fewer'].includes(raw.clueLevel)?raw.clueLevel:'balanced'
    };
    return {...defaults,...raw};
  }

  function normalizeSettings(input={}){
    const minYear=clamp(Number(input.minYear)||1,1,6),maxYear=clamp(Number(input.maxYear)||6,minYear,6);
    const topics=(Array.isArray(input.topics)?input.topics:[]).filter(t=>TOPICS[t]);
    const legacyDifficulty=['easy','standard','challenge'].includes(input.difficulty)?input.difficulty:'standard';
    const legacyWordMode=input.wordSearchMode==='definitions'?'definitions':'words_definitions';
    const rawEngineSettings=input.engineSettings||{};
    const engineSettings={
      wordsearch:normalizeEngineSettings('wordsearch',{difficulty:legacyDifficulty,clueMode:legacyWordMode,...rawEngineSettings.wordsearch}),
      pyramid:normalizeEngineSettings('pyramid',{difficulty:legacyDifficulty,...rawEngineSettings.pyramid}),
      crossword:normalizeEngineSettings('crossword',{difficulty:legacyDifficulty,...rawEngineSettings.crossword}),
      magic:normalizeEngineSettings('magic',{difficulty:legacyDifficulty,...rawEngineSettings.magic})
    };
    let selectedEngines=Array.isArray(input.selectedEngines)?input.selectedEngines.filter(id=>ENGINES[id]):[];
    if(!selectedEngines.length&&input.gameMode==='single'&&ENGINES[input.gameId])selectedEngines=[input.gameId];
    if(!selectedEngines.length)selectedEngines=['wordsearch','pyramid'];
    return {
      minYear,maxYear,topics:topics.length?topics:['calculation'],sheets:clamp(Number(input.sheets)||1,1,6),activitiesPerSheet:clamp(Number(input.activitiesPerSheet)||1,1,3),
      selectedEngines:[...new Set(selectedEngines)],includeAnswers:input.includeAnswers!==false,workedExamples:input.workedExamples==='front'?'front':'none',engineSettings
    };
  }

  function compatibleEngines(settings){
    const s=normalizeSettings(settings);return Object.values(ENGINES).filter(engine=>s.topics.some(t=>['excellent','reasonable'].includes(engine.compatibility[t]))).map(x=>x.id);
  }
  function selectedCompatibleEngines(settings){
    const s=normalizeSettings(settings),eligible=new Set(compatibleEngines(s)),selected=s.selectedEngines.filter(id=>eligible.has(id));
    return selected.length?selected:(eligible.size?[...eligible].slice(0,1):['wordsearch']);
  }
  function chooseEngine(settings,index,seed){
    const selected=selectedCompatibleEngines(settings);if(selected.length===1)return selected[0];if(index<selected.length)return selected[index];return selected[Math.floor(rngFromSeed(`${seed}:engine:${index}`)()*selected.length)];
  }

  function sanitizeCustomVocabulary(entries){
    const out=[];
    for(const raw of Array.isArray(entries)?entries:[]){
      const topic=TOPICS[raw?.topic]?raw.topic:'number_place_value',term=String(raw?.term||'').trim().replace(/\s+/g,' '),definition=String(raw?.definition||'').trim().replace(/\s+/g,' ');
      const minYear=clamp(Number(raw?.minYear??raw?.min_year)||1,1,6),maxYear=clamp(Number(raw?.maxYear??raw?.max_year)||6,minYear,6),normalized=normalizeTerm(term);
      if(term&&definition&&puzzleTermSuitable(term)&&normalized.length>=2&&normalized.length<=24)out.push({id:`mine.${topic}.${term.toLowerCase().replace(/[^a-z0-9]+/g,'_')}`,topic,primaryTopic:topic,sourceTopic:topic,appTopics:[topic],term,definition,crosswordClue:definition,gridAnswer:normalized,minYear,maxYear,priority:'core',source:'mine',wordsearchSuitable:true,crosswordSuitable:normalized.length>=3,minimumWordsearchGrid:Math.max(8,normalized.length)});
    }
    const seen=new Set();return out.filter(x=>{const k=`${x.topic}|${x.term.toLowerCase()}`;if(seen.has(k))return false;seen.add(k);return true;});
  }

  // Automatic topic packs are deliberately topic-pure. General mathematical-language
  // records stay in the master catalogue, but do not leak into every subject pack.
  function vocabularyMatchesSelectedTopic(entry,topics){return !!entry?.primaryTopic&&topics.includes(entry.primaryTopic);}
  function vocabularyCountForTopic(topic){return VOCABULARY.filter(x=>x.primaryTopic===topic&&x.wordsearchSuitable).length;}
  function vocabularyPool(settings,customVocabulary=[],purpose='wordsearch'){
    const s=normalizeSettings(settings),all=VOCABULARY.concat(sanitizeCustomVocabulary(customVocabulary));
    const engineId=purpose==='crossword'?'crossword':'wordsearch',difficulty=s.engineSettings[engineId].difficulty;
    return all.filter(x=>vocabularyMatchesSelectedTopic(x,s.topics)&&x.minYear<=s.maxYear&&x.maxYear>=s.minYear&&
      (purpose==='crossword'?x.crosswordSuitable:x.wordsearchSuitable)&&
      (difficulty==='challenge'||x.priority!=='extension'));
  }

  function wordSearchOptions(settings){return normalizeSettings(settings).engineSettings.wordsearch;}
  function wordSearchGridSize(settings){const o=wordSearchOptions(settings);if(o.gridSize!=='auto')return Number(o.gridSize);return o.difficulty==='easy'?12:o.difficulty==='challenge'?16:14;}
  function wordSearchCount(settings,available){const o=wordSearchOptions(settings),target=o.wordCount!=='auto'?Number(o.wordCount):(o.difficulty==='easy'?7:o.difficulty==='challenge'?11:9);return Math.max(4,Math.min(target,available));}
  function wordSearchDirections(settings){
    const o=wordSearchOptions(settings),mode=o.directionMode==='auto'?(o.difficulty==='easy'?'straight':o.difficulty==='challenge'?'all':'diagonal'):o.directionMode;
    if(mode==='straight')return {mode,dirs:[[1,0],[0,1]],label:'left→right / top→bottom'};
    if(mode==='diagonal')return {mode,dirs:[[1,0],[0,1],[1,1],[-1,1]],label:'straight + diagonals'};
    return {mode:'all',dirs:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]],label:'all directions, including backwards'};
  }
  function vocabularyFor(settings,customVocabulary=[]){
    const size=wordSearchGridSize(settings);return vocabularyPool(settings,customVocabulary,'wordsearch').filter(x=>normalizeTerm(x.term).length<=size&&x.minimumWordsearchGrid<=size);
  }
  function placeWord(grid,word,rng,dirs){
    const n=grid.length;
    for(let attempt=0;attempt<500;attempt++){
      const [dx,dy]=dirs[randInt(rng,0,dirs.length-1)],x0=randInt(rng,0,n-1),y0=randInt(rng,0,n-1),x1=x0+dx*(word.length-1),y1=y0+dy*(word.length-1);
      if(x1<0||x1>=n||y1<0||y1>=n)continue;
      let ok=true;for(let i=0;i<word.length;i++){const x=x0+dx*i,y=y0+dy*i,c=grid[y][x];if(c&&c!==word[i]){ok=false;break;}}
      if(!ok)continue;
      const cells=[];for(let i=0;i<word.length;i++){const x=x0+dx*i,y=y0+dy*i;grid[y][x]=word[i];cells.push([x,y]);}
      return {cells,dx,dy};
    }return null;
  }
  function buildWordSearchFromItems(settings,seed,items){
    const s=normalizeSettings(settings),rng=rngFromSeed(seed),size=wordSearchGridSize(s),grid=Array.from({length:size},()=>Array(size).fill('')),placements=[],direction=wordSearchDirections(s);
    const tagged=items.map((item,order)=>({...item,_displayOrder:order})),ordered=tagged.slice().sort((a,b)=>normalizeTerm(b.term).length-normalizeTerm(a.term).length);
    for(const item of ordered){const word=normalizeTerm(item.term),placed=placeWord(grid,word,rng,direction.dirs);if(placed)placements.push({id:item.id,term:item.term,definition:item.definition,source:item.source,topic:item.topic,appTopics:item.appTopics,cells:placed.cells,dx:placed.dx,dy:placed.dy,_displayOrder:item._displayOrder});}
    placements.sort((a,b)=>a._displayOrder-b._displayOrder);for(const p of placements)delete p._displayOrder;
    const alphabet='EEEEEEEEAAAAAAIIIIIOOOONNNNRRRRTTTTSSSSLLLCCDDMPUFGHBVYWKXJQZ';
    for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!grid[y][x])grid[y][x]=alphabet[randInt(rng,0,alphabet.length-1)];
    const o=wordSearchOptions(s);return {engineId:'wordsearch',title:'Maths Word Search',topicIds:[...new Set(placements.flatMap(x=>x.appTopics||[x.topic]))],grid,size,placements,mode:o.clueMode,difficulty:o.difficulty,yearText:yearText(s.minYear,s.maxYear),seed,options:o,directionMode:direction.mode,directionLabel:direction.label};
  }
  function generateWordSearch(settings,seed,customVocabulary=[]){
    const s=normalizeSettings(settings),rng=rngFromSeed(seed),available=vocabularyFor(s,customVocabulary);
    if(available.length<4)return {engineId:'wordsearch',title:'Maths Word Search',error:'Not enough vocabulary is available for this year/topic selection. Add My vocabulary entries or choose another topic.'};
    const count=wordSearchCount(s,available.length),chosen=shuffle(available,rng).slice(0,count);return buildWordSearchFromItems(s,seed,chosen);
  }
  function replaceWordSearchEntry(activity,index,settings,seed,customVocabulary=[]){
    if(!activity||activity.engineId!=='wordsearch'||!activity.placements?.[index])return activity;
    const pool=vocabularyFor(settings,customVocabulary),existing=activity.placements.map(p=>String(p.term).toLowerCase()),old=existing[index];
    const candidates=pool.filter(x=>!existing.includes(x.term.toLowerCase())&&x.term.toLowerCase()!==old);
    if(!candidates.length)return activity;
    const rng=rngFromSeed(seed),replacement=shuffle(candidates,rng)[0],items=activity.placements.map((p,i)=>i===index?replacement:pool.find(x=>x.id===p.id)||{...p,id:p.id||`kept.${i}`,appTopics:p.appTopics||[p.topic]});
    const next=buildWordSearchFromItems(settings,seed,items);next.replacedIndex=index;return next;
  }

  function pyramidProfile(settings){
    const s=normalizeSettings(settings),year=s.maxYear,o=s.engineSettings.pyramid,d=o.difficulty;let rows=year<=2?3:4,maxApex=year===1?20:year===2?100:year===3?500:year===4?2000:year===5?5000:10000;
    if(o.levels!=='auto')rows=Number(o.levels);else if(d==='challenge'&&year>=4)rows=5;if(d==='easy')maxApex=Math.max(10,Math.floor(maxApex*.35));if(d==='challenge'&&year>=4)maxApex=Math.min(20000,Math.floor(maxApex*1.5));
    const missingRatio=o.clueLevel==='more'?.28:o.clueLevel==='fewer'?.62:(d==='easy'?.34:d==='challenge'?.56:.45);return {rows,maxApex,missingRatio,difficulty:d,clueLevel:o.clueLevel};
  }
  function buildPyramid(bottom){const rows=[bottom.slice()];let current=bottom.slice();while(current.length>1){const next=[];for(let i=0;i<current.length-1;i++)next.push(current[i]+current[i+1]);rows.unshift(next);current=next;}return rows;}
  function matrixRank(matrix,eps=1e-9){const a=matrix.map(row=>row.map(Number));if(!a.length)return 0;const rows=a.length,cols=a[0].length;let rank=0,col=0;while(rank<rows&&col<cols){let pivot=rank;for(let r=rank+1;r<rows;r++)if(Math.abs(a[r][col])>Math.abs(a[pivot][col]))pivot=r;if(Math.abs(a[pivot][col])<=eps){col++;continue;}[a[rank],a[pivot]]=[a[pivot],a[rank]];const div=a[rank][col];for(let c=col;c<cols;c++)a[rank][c]/=div;for(let r=0;r<rows;r++){if(r===rank)continue;const f=a[r][col];if(Math.abs(f)<=eps)continue;for(let c=col;c<cols;c++)a[r][c]-=f*a[rank][c];}rank++;col++;}return rank;}
  function pyramidCoefficientRows(size){let rows=[Array.from({length:size},(_,i)=>Array.from({length:size},(__,j)=>i===j?1:0))],current=rows[0];while(current.length>1){const next=[];for(let i=0;i<current.length-1;i++)next.push(current[i].map((v,j)=>v+current[i+1][j]));rows.unshift(next);current=next;}return rows;}
  function uniquelySolvablePyramidMask(rowCount,candidates,targetMissing,rng){const coeff=pyramidCoefficientRows(rowCount),all=[];for(let r=0;r<coeff.length;r++)for(let c=0;c<coeff[r].length;c++)all.push([r,c]);const missing=new Set(),order=shuffle(candidates,rng);for(const [r,c] of order){if(missing.size>=targetMissing)break;const key=`${r}:${c}`;missing.add(key);const visible=all.filter(([rr,cc])=>!missing.has(`${rr}:${cc}`)).map(([rr,cc])=>coeff[rr][cc]);if(matrixRank(visible)<rowCount)missing.delete(key);}return [...missing].map(k=>k.split(':').map(Number));}
  function generateNumberPyramid(settings,seed){
    const s=normalizeSettings(settings),rng=rngFromSeed(seed),profile=pyramidProfile(s);let rows=null;
    for(let tries=0;tries<500;tries++){const maxBottom=Math.max(3,Math.floor(profile.maxApex/Math.pow(2,profile.rows-1))),minBottom=s.minYear<=1?0:1,bottom=Array.from({length:profile.rows},()=>randInt(rng,minBottom,maxBottom));rows=buildPyramid(bottom);if(rows[0][0]<=profile.maxApex)break;}
    const all=[];for(let r=0;r<rows.length;r++)for(let c=0;c<rows[r].length;c++)all.push([r,c]);const candidates=all.filter(([r])=>!(profile.difficulty==='easy'&&r===0));
    const missingCount=Math.min(all.length-profile.rows,Math.max(2,Math.round(all.length*profile.missingRatio))),missing=uniquelySolvablePyramidMask(profile.rows,candidates,missingCount,rng),missingSet=new Set(missing.map(([r,c])=>`${r}:${c}`));
    return {engineId:'pyramid',title:'Number Pyramid',topicIds:['calculation'],rows,missing,missingSet:[...missingSet],difficulty:profile.difficulty,yearText:yearText(s.minYear,s.maxYear),seed,instruction:'Each brick is the sum of the two bricks directly below it.',options:s.engineSettings.pyramid};
  }


  const MAGIC3=[[8,1,6],[3,5,7],[4,9,2]];
  const MAGIC4=[[16,2,3,13],[5,11,10,8],[9,7,6,12],[4,14,15,1]];
  function cloneGrid(grid){return grid.map(row=>row.slice());}
  function rotateGrid(grid){const n=grid.length;return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>grid[n-1-c][r]));}
  function reflectGrid(grid){return grid.map(row=>row.slice().reverse());}
  function magicVariant(base,rng){let g=cloneGrid(base);const turns=randInt(rng,0,3);for(let i=0;i<turns;i++)g=rotateGrid(g);if(rng()<.5)g=reflectGrid(g);return g;}
  function mapMagicValues(grid,offset,step){return grid.map(row=>row.map(v=>Math.round((offset+step*(v-1))*1000)/1000));}
  function magicLineSums(grid){const n=grid.length,rows=grid.map(row=>row.reduce((a,b)=>a+b,0)),cols=Array.from({length:n},(_,c)=>grid.reduce((sum,row)=>sum+row[c],0)),diag1=grid.reduce((sum,row,i)=>sum+row[i],0),diag2=grid.reduce((sum,row,i)=>sum+row[n-1-i],0);return {rows,cols,diags:[diag1,diag2]};}
  function isMagicGrid(grid,eps=1e-8){if(!grid?.length)return false;const sums=magicLineSums(grid),all=[...sums.rows,...sums.cols,...sums.diags];return all.every(x=>Math.abs(x-all[0])<eps);}
  function magicOptions(settings){return normalizeSettings(settings).engineSettings.magic;}
  function magicGridSize(settings,seed='magic'){const s=normalizeSettings(settings),o=s.engineSettings.magic;if(o.gridSize!=='auto')return Number(o.gridSize);if(o.difficulty==='challenge'&&s.maxYear>=4)return rngFromSeed(`${seed}:size`)()<.62?4:3;return 3;}
  function magicNumberProfile(settings,seed,size){const s=normalizeSettings(settings),o=s.engineSettings.magic,rng=rngFromSeed(`${seed}:numbers`),year=s.maxYear;let kind=o.numberPattern;
    if(kind==='auto'){if(s.topics.includes('decimals_percentages')&&year>=4)kind='decimal';else if(o.difficulty==='easy')kind=rng()<.7?'classic':'shifted';else if(o.difficulty==='challenge')kind=rng()<.65?'scaled':'shifted';else kind=rng()<.5?'shifted':'scaled';}
    if(kind==='decimal'&&year<4)kind='shifted';
    let offset=1,step=1,label='consecutive numbers';
    if(kind==='classic'){offset=1;step=1;label=size===3?'1 to 9':'1 to 16';}
    else if(kind==='shifted'){const maxStart=year<=2?5:year===3?15:year===4?30:year===5?60:100;offset=randInt(rng,2,maxStart);step=1;label=`consecutive numbers from ${formatNumber(offset)}`;}
    else if(kind==='scaled'){const choices=year<=2?[2]:year===3?[2,3,5]:year===4?[2,3,5,10]:[2,3,5,10,25];step=choices[randInt(rng,0,choices.length-1)];offset=(o.difficulty==='challenge'&&year>=4&&rng()<.4)?randInt(rng,0,Math.max(5,year*5)):step;label=`step ${formatNumber(step)}${offset!==step?`, starting ${formatNumber(offset)}`:''}`;}
    else if(kind==='decimal'){const choices=year===4?[0.1,0.2,0.5]:[0.1,0.2,0.25,0.5];step=choices[randInt(rng,0,choices.length-1)];offset=Math.round(step*randInt(rng,0,10)*100)/100;label=`decimal step ${formatNumber(step)}`;}
    return {kind,offset,step,label};
  }
  function magicPuzzleType(settings,seed,size){const s=normalizeSettings(settings),o=s.engineSettings.magic;if(o.puzzleType!=='auto')return o.puzzleType;const rng=rngFromSeed(`${seed}:type`),d=o.difficulty,r=rng();if(d==='easy')return r<.72?'missing':'find_total';if(d==='standard')return r<.50?'missing':r<.70?'find_total':r<.88?'repair':'transform';return r<.38?'missing':r<.58?'repair':r<.83?'transform':'find_total';}
  function magicEquationRows(size,hiddenSet){const vars=[...hiddenSet].map(k=>k.split(':').map(Number)),index=new Map(vars.map((rc,i)=>[`${rc[0]}:${rc[1]}`,i])),rows=[];const addLine=cells=>{const row=Array(vars.length).fill(0);for(const [r,c] of cells){const idx=index.get(`${r}:${c}`);if(idx!==undefined)row[idx]=1;}if(row.some(Boolean))rows.push(row);};for(let r=0;r<size;r++)addLine(Array.from({length:size},(_,c)=>[r,c]));for(let c=0;c<size;c++)addLine(Array.from({length:size},(_,r)=>[r,c]));addLine(Array.from({length:size},(_,i)=>[i,i]));addLine(Array.from({length:size},(_,i)=>[i,size-1-i]));return rows;}
  function uniquelySolvableMagicMask(size,target,rng){const all=[];for(let r=0;r<size;r++)for(let c=0;c<size;c++)all.push([r,c]);const hidden=new Set();for(const [r,c] of shuffle(all,rng)){if(hidden.size>=target)break;const k=`${r}:${c}`;hidden.add(k);const rows=magicEquationRows(size,hidden);if(matrixRank(rows)<hidden.size)hidden.delete(k);}return [...hidden];}
  function magicMissingCount(settings,size){const o=magicOptions(settings),total=size*size,ratio=o.clueLevel==='more'?.26:o.clueLevel==='fewer'?.56:(o.difficulty==='easy'?.30:o.difficulty==='challenge'?.52:.42);const cap=size===3?5:8;return Math.max(1,Math.min(cap,Math.round(total*ratio)));}
  function magicTransform(settings,seed,source){const s=normalizeSettings(settings),rng=rngFromSeed(`${seed}:transform`),year=s.maxYear,isDecimal=source.some(row=>row.some(v=>!Number.isInteger(v)));let operation='add',amount;if(rng()<.48){operation='multiply';amount=randInt(rng,2,year<=2?3:5);}else{if(isDecimal)amount=[0.5,1,2][randInt(rng,0,2)];else amount=randInt(rng,1,year<=2?5:year<=4?12:25);}const grid=source.map(row=>row.map(v=>Math.round((operation==='add'?v+amount:v*amount)*1000)/1000));return {operation,amount,grid,label:operation==='add'?`Add ${formatNumber(amount)} to every number`:`Multiply every number by ${formatNumber(amount)}`};}
  function generateMagicSquare(settings,seed){const s=normalizeSettings(settings),rng=rngFromSeed(seed),size=magicGridSize(s,seed),profile=magicNumberProfile(s,seed,size),base=magicVariant(size===4?MAGIC4:MAGIC3,rng),solutionGrid=mapMagicValues(base,profile.offset,profile.step),magicSum=magicLineSums(solutionGrid).rows[0],puzzleType=magicPuzzleType(s,seed,size),o=s.engineSettings.magic;
    const common={engineId:'magic',title:'Magic Squares',topicIds:s.topics.filter(t=>['number_place_value','calculation','decimals_percentages','algebra'].includes(t)),size,difficulty:o.difficulty,puzzleType,numberPattern:profile.kind,numberPatternLabel:profile.label,solutionGrid,magicSum,yearText:yearText(s.minYear,s.maxYear),seed,options:o};
    if(puzzleType==='find_total')return {...common,displayGrid:cloneGrid(solutionGrid),missingSet:[],instruction:'Every row, column and main diagonal has the same total. Find the magic total.',answerText:`Magic total = ${formatNumber(magicSum)}`};
    if(puzzleType==='repair'){const candidates=size===3?[[0,0],[0,size-1],[size-1,0],[size-1,size-1],[1,1]]:[[0,0],[0,size-1],[size-1,0],[size-1,size-1]],cell=candidates[randInt(rng,0,candidates.length-1)],delta=profile.step*randInt(rng,1,3)*(rng()<.5?-1:1),displayGrid=cloneGrid(solutionGrid),correct=displayGrid[cell[0]][cell[1]],wrong=Math.round((correct+delta)*1000)/1000;displayGrid[cell[0]][cell[1]]=wrong;return {...common,displayGrid,missingSet:[],wrongCell:`${cell[0]}:${cell[1]}`,wrongValue:wrong,correctValue:correct,instruction:`One number is wrong. Find it and correct it so every line totals ${formatNumber(magicSum)}.`,answerText:`Replace ${formatNumber(wrong)} with ${formatNumber(correct)}.`};}
    if(puzzleType==='transform'){const tx=magicTransform(s,seed,solutionGrid),target=tx.grid,targetSum=magicLineSums(target).rows[0],givenCount=o.clueLevel==='more'?Math.ceil(size*size*.45):o.clueLevel==='fewer'?Math.ceil(size*size*.18):Math.ceil(size*size*.30),positions=shuffle(Array.from({length:size*size},(_,i)=>[Math.floor(i/size),i%size]),rng).slice(0,givenCount),given=new Set(positions.map(([r,c])=>`${r}:${c}`));return {...common,sourceGrid:solutionGrid,solutionGrid:target,displayGrid:target.map((row,r)=>row.map((v,c)=>given.has(`${r}:${c}`)?v:null)),missingSet:Array.from({length:size*size},(_,i)=>`${Math.floor(i/size)}:${i%size}`).filter(k=>!given.has(k)),magicSum:targetSum,sourceMagicSum:magicSum,transform:tx,instruction:`${tx.label}. Complete the new magic square and find its magic total.`,answerText:`New magic total = ${formatNumber(targetSum)}`};}
    const target=magicMissingCount(s,size),hidden=uniquelySolvableMagicMask(size,target,rng),hiddenSet=new Set(hidden),displayGrid=solutionGrid.map((row,r)=>row.map((v,c)=>hiddenSet.has(`${r}:${c}`)?null:v));return {...common,displayGrid,missingSet:[...hiddenSet],instruction:`Every row, column and main diagonal totals ${formatNumber(magicSum)}. Fill the missing numbers.`,answerText:`Magic total = ${formatNumber(magicSum)}`};
  }

  function crosswordOptions(settings){return normalizeSettings(settings).engineSettings.crossword;}
  function crosswordGridSize(settings){const o=crosswordOptions(settings);if(o.gridSize!=='auto')return Number(o.gridSize);return o.difficulty==='easy'?13:o.difficulty==='challenge'?17:15;}
  function crosswordCount(settings,available){const o=crosswordOptions(settings),target=o.wordCount!=='auto'?Number(o.wordCount):(o.difficulty==='easy'?6:o.difficulty==='challenge'?10:8);return Math.max(4,Math.min(target,available));}
  function crosswordWordBank(settings){const o=crosswordOptions(settings);return o.wordBank==='show'||(o.wordBank==='auto'&&o.difficulty==='easy');}
  function crosswordVocabularyFor(settings,customVocabulary=[]){const size=crosswordGridSize(settings);return vocabularyPool(settings,customVocabulary,'crossword').filter(x=>{const n=normalizeTerm(x.term).length;return n>=3&&n<=size-2;});}
  function emptyCrossword(n){return Array.from({length:n},()=>Array.from({length:n},()=>({ch:'',dirs:new Set()})));}
  function canPlaceCrossword(grid,word,x,y,dir,requireCross=true){
    const n=grid.length,dx=dir==='across'?1:0,dy=dir==='down'?1:0,endX=x+dx*(word.length-1),endY=y+dy*(word.length-1);if(x<0||y<0||endX>=n||endY>=n)return false;
    const beforeX=x-dx,beforeY=y-dy,afterX=endX+dx,afterY=endY+dy;if(beforeX>=0&&beforeY>=0&&beforeX<n&&beforeY<n&&grid[beforeY][beforeX].ch)return false;if(afterX>=0&&afterY>=0&&afterX<n&&afterY<n&&grid[afterY][afterX].ch)return false;
    let crosses=0;
    for(let i=0;i<word.length;i++){
      const xx=x+dx*i,yy=y+dy*i,cell=grid[yy][xx];
      if(cell.ch){if(cell.ch!==word[i]||cell.dirs.has(dir))return false;crosses++;continue;}
      if(dir==='across'){
        if((yy>0&&grid[yy-1][xx].ch)||(yy<n-1&&grid[yy+1][xx].ch))return false;
      }else if((xx>0&&grid[yy][xx-1].ch)||(xx<n-1&&grid[yy][xx+1].ch))return false;
    }
    return !requireCross||crosses>0;
  }
  function placeCrosswordEntry(grid,item,x,y,dir){const word=normalizeTerm(item.term),dx=dir==='across'?1:0,dy=dir==='down'?1:0,cells=[];for(let i=0;i<word.length;i++){const xx=x+dx*i,yy=y+dy*i;grid[yy][xx].ch=word[i];grid[yy][xx].dirs.add(dir);cells.push([xx,yy]);}return {id:item.id,term:item.term,answer:word,clue:item.crosswordClue||item.definition,enumeration:answerEnumeration(item.term),definition:item.definition,source:item.source,topic:item.topic,appTopics:item.appTopics,x,y,dir,cells};}
  function crosswordAttempt(items,size,seed,target){
    const rng=rngFromSeed(seed),grid=emptyCrossword(size),entries=[];if(!items.length)return {grid,entries};
    const first=items.slice().sort((a,b)=>normalizeTerm(b.term).length-normalizeTerm(a.term).length)[0],fw=normalizeTerm(first.term),fx=Math.floor((size-fw.length)/2),fy=Math.floor(size/2);entries.push(placeCrosswordEntry(grid,first,fx,fy,'across'));
    const remaining=shuffle(items.filter(x=>x.id!==first.id),rng);
    for(const item of remaining){if(entries.length>=target)break;const word=normalizeTerm(item.term),candidates=[];
      for(let i=0;i<word.length;i++)for(let yy=0;yy<size;yy++)for(let xx=0;xx<size;xx++)if(grid[yy][xx].ch===word[i]){
        for(const dir of ['across','down']){if(grid[yy][xx].dirs.has(dir))continue;const x=xx-(dir==='across'?i:0),y=yy-(dir==='down'?i:0);if(canPlaceCrossword(grid,word,x,y,dir,true))candidates.push({x,y,dir});}
      }
      if(candidates.length){const p=candidates[randInt(rng,0,candidates.length-1)];entries.push(placeCrosswordEntry(grid,item,p.x,p.y,p.dir));}
    }
    return {grid,entries};
  }
  function finaliseCrossword(raw,size){
    const used=raw.entries.flatMap(e=>e.cells),xs=used.map(c=>c[0]),ys=used.map(c=>c[1]);if(!used.length)return {grid:[],entries:[]};
    // Trim to the exact occupied footprint. The renderer is a printer-friendly
    // freeform criss-cross: unused cells are white page, not blocked squares.
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),w=maxX-minX+1,h=maxY-minY+1;
    const grid=Array.from({length:h},(_,yy)=>Array.from({length:w},(_,xx)=>raw.grid[yy+minY][xx+minX].ch||''));
    const entries=raw.entries.map(e=>({...e,x:e.x-minX,y:e.y-minY,cells:e.cells.map(([x,y])=>[x-minX,y-minY])}));
    const starts=new Map();for(const e of entries){const k=`${e.x}:${e.y}`;if(!starts.has(k))starts.set(k,[]);starts.get(k).push(e);}
    let num=1;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=`${x}:${y}`;if(starts.has(k)){for(const e of starts.get(k))e.number=num;num++;}}
    entries.sort((a,b)=>a.number-b.number||(a.dir==='across'?-1:1));return {grid,entries,width:w,height:h};
  }
  function generateCrossword(settings,seed,customVocabulary=[]){
    const s=normalizeSettings(settings),available=crosswordVocabularyFor(s,customVocabulary);if(available.length<4)return {engineId:'crossword',title:'Maths Crossword',error:'Not enough crossword vocabulary is available for this year/topic selection.'};
    const size=crosswordGridSize(s),target=crosswordCount(s,available.length),rng=rngFromSeed(seed),candidatePool=shuffle(available,rng).slice(0,Math.min(36,available.length));let best=null;
    for(let attempt=0;attempt<40;attempt++){const raw=crosswordAttempt(shuffle(candidatePool,rngFromSeed(`${seed}:order:${attempt}`)),size,`${seed}:cw:${attempt}`,target);if(!best||raw.entries.length>best.entries.length)best=raw;if(best.entries.length>=target)break;}
    if(!best||best.entries.length<4)return {engineId:'crossword',title:'Maths Crossword',error:'A connected crossword could not be built from this selection. Try a wider year/topic range or generate a new version.'};
    const final=finaliseCrossword(best,size),o=crosswordOptions(s);return {engineId:'crossword',title:'Maths Crossword',topicIds:[...new Set(final.entries.flatMap(x=>x.appTopics||[x.topic]))],grid:final.grid,entries:final.entries,width:final.width,height:final.height,difficulty:o.difficulty,wordBank:crosswordWordBank(s),yearText:yearText(s.minYear,s.maxYear),seed,options:o};
  }

  function generateWorkedExample(engineId,settings,seed,customVocabulary=[]){
    const s=normalizeSettings(settings);
    if(engineId==='pyramid'){
      const rng=rngFromSeed(seed),a=randInt(rng,2,6),b=randInt(rng,2,6),c=randInt(rng,2,6),rows=buildPyramid([a,b,c]),missingValue=b;
      return {engineId,title:'Number Pyramid worked example',kind:'pyramid',rows,exampleMissing:'2:1',goal:'Fill every empty brick using the addition rule.',rules:['A brick is the sum of the two bricks directly below it.','If a lower brick is missing, use subtraction to work backwards.'],steps:[`${a} + ${b} = ${a+b}, so the left middle brick is ${a+b}.`,`${b} + ${c} = ${b+c}, so the right middle brick is ${b+c}.`,`${a+b} + ${b+c} = ${rows[0][0]}, so the top brick is ${rows[0][0]}.`,`Working backwards also works: ${a+b} - ${a} = ${missingValue}.`],tip:'Check each completed brick against the two bricks below it.',commonMistake:'Do not add bricks that are not directly next to each other.'};
    }
    if(engineId==='crossword'){
      const pool=crosswordVocabularyFor(s,customVocabulary);const item=pool.length?shuffle(pool,rngFromSeed(seed))[0]:null;if(!item)return null;const enumeration=answerEnumeration(item.term);
      return {engineId,title:'Maths Crossword worked example',kind:'crossword',term:item.term,answer:normalizeTerm(item.term),enumeration,clue:item.crosswordClue||item.definition,goal:'Use each definition to work out a mathematical word, then write it into the grid.',rules:['The number tells you where an answer starts.','Across answers run left to right; Down answers run top to bottom.',`The pattern ${enumeration} tells you the word length${needsEnumeration(item.term)?'s':''}. Spaces and punctuation are not written in the grid.`],steps:['Read the definition and look at the answer pattern.',`This clue describes “${item.term}”.`,'Write the letters into the numbered cells.','Use crossing letters to help solve another clue.'],tip:'If you are unsure of a clue, solve a crossing word first and use the letters you gain.',commonMistake:'Do not put spaces or punctuation into crossword cells.'};
    }
    if(engineId==='magic'){
      const grid=[[8,1,6],[3,5,7],[4,9,2]],magicSum=15;
      return {engineId,title:'Magic Squares worked example',kind:'magic',grid,displayGrid:[[8,1,6],[3,5,null],[4,9,2]],magicSum,goal:'Fill the missing number so every row, column and main diagonal has the same total.',rules:['First find or use the magic total.','Each complete row, column and main diagonal must equal that same total.','Use subtraction when one value is missing from a line.'],steps:['The top row is 8 + 1 + 6 = 15, so the magic total is 15.','The middle row must also total 15: 3 + 5 + □ = 15.','3 + 5 = 8, so □ = 15 − 8 = 7.','Check the right column: 6 + 7 + 2 = 15.'],tip:'Use a row or column with only one missing number first.',commonMistake:'Do not forget the two main diagonals — they must match the magic total too.'};
    }
    const pool=vocabularyFor(s,customVocabulary),item=pool.length?shuffle(pool,rngFromSeed(seed))[0]:null;if(!item)return null;const answer=normalizeTerm(item.term),size=Math.max(8,Math.min(12,answer.length+2)),grid=Array.from({length:size},()=>Array(size).fill(''));
    const rng=rngFromSeed(`${seed}:grid`),row=randInt(rng,1,size-2),maxStart=Math.max(0,size-answer.length),start=randInt(rng,0,maxStart);for(let i=0;i<answer.length;i++)grid[row][start+i]=answer[i];const alphabet='ETAOINSHRDLUCMFPGWYBVKXJQZ';for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!grid[y][x])grid[y][x]=alphabet[randInt(rng,0,alphabet.length-1)];const enumeration=answerEnumeration(item.term);
    return {engineId:'wordsearch',title:'Maths Word Search worked example',kind:'wordsearch',term:item.term,definition:item.definition,enumeration,answer,row,start,grid,size,mode:s.engineSettings.wordsearch.clueMode,goal:'Find the mathematical vocabulary hidden in the letter grid.',rules:[s.engineSettings.wordsearch.clueMode==='definitions'?'Use each definition to work out the hidden word first.':'Read the word and its definition before searching.',`The word may run in the allowed directions for this puzzle. Spaces and punctuation are removed in the grid.${needsEnumeration(item.term)?` ${enumeration} shows the word lengths.`:''}`],steps:s.engineSettings.wordsearch.clueMode==='definitions'?['Read the definition carefully.',`The mathematical term is “${item.term}” ${enumeration}.`,`Look for the letters ${answer} in one straight line.`,'Trace or circle the complete word.']:['Read the term and its meaning.',`Look for ${answer} in one straight line.`,'Trace or circle the complete word.'],tip:'Start by looking for an unusual first letter or a long group of letters.',commonMistake:'Do not change direction halfway through a hidden word.'};
  }

  function generateActivity(engineId,settings,seed,customVocabulary=[]){if(engineId==='pyramid')return generateNumberPyramid(settings,seed);if(engineId==='crossword')return generateCrossword(settings,seed,customVocabulary);if(engineId==='magic')return generateMagicSquare(settings,seed);return generateWordSearch(settings,seed,customVocabulary);}
  function generatePack(settings,seed='games',customVocabulary=[]){
    const s=normalizeSettings(settings),sheets=[];let globalIndex=0;
    for(let sheetIndex=0;sheetIndex<s.sheets;sheetIndex++){const activities=[];for(let i=0;i<s.activitiesPerSheet;i++,globalIndex++){const engineId=chooseEngine(s,globalIndex,seed),activitySeed=`${seed}:S${sheetIndex+1}:A${i+1}:${engineId}`;activities.push(generateActivity(engineId,s,activitySeed,customVocabulary));}sheets.push({index:sheetIndex+1,activities});}
    const workedExamples=s.workedExamples==='front'?selectedCompatibleEngines(s).map((id,i)=>generateWorkedExample(id,s,`${seed}:worked:${i}:${id}`,customVocabulary)).filter(Boolean):[];
    return {version:VERSION,seed,settings:s,workedExamples,sheets};
  }

  const api={VERSION,TOPICS,ENGINES,VOCABULARY,VOCABULARY_METADATA,normalizeSettings,normalizeEngineSettings,compatibleEngines,selectedCompatibleEngines,sanitizeCustomVocabulary,vocabularyCountForTopic,vocabularyFor,crosswordVocabularyFor,generateWordSearch,replaceWordSearchEntry,generateNumberPyramid,generateCrossword,generateMagicSquare,generateWorkedExample,generateActivity,generatePack,normalizeTerm,puzzleTermSuitable,answerEnumeration,needsEnumeration,formatNumber,rngFromSeed,clone,wordSearchDirections,_matrixRank:matrixRank,_pyramidCoefficientRows:pyramidCoefficientRows,_isMagicGrid:isMagicGrid,_magicLineSums:magicLineSums,_magicEquationRows:magicEquationRows};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;global.TT99Games=api;
})(typeof globalThis!=='undefined'?globalThis:this);
