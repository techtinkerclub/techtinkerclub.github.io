/* 99 Club Studio · Maths Games & Puzzles
 * v1.0.0 — shared, deterministic game-engine layer.
 *
 * Architecture: game engine + maths content provider + applicability rules.
 * No DOM access in this file so generation can be regression-tested in Node.
 */
(function(global){
  'use strict';

  const VERSION='1.0.0';
  const TOPICS={
    number_place_value:{label:'Number & place value',years:[1,2,3,4,5,6]},
    calculation:{label:'Calculation',years:[1,2,3,4,5,6]},
    fractions:{label:'Fractions',years:[1,2,3,4,5,6]},
    decimals_percentages:{label:'Decimals & percentages',years:[4,5,6]},
    measurement:{label:'Measurement',years:[1,2,3,4,5,6]},
    geometry:{label:'Geometry',years:[1,2,3,4,5,6]},
    statistics:{label:'Statistics',years:[2,3,4,5,6]},
    algebra:{label:'Algebra & sequences',years:[2,3,4,5,6]}
  };

  const ENGINES={
    wordsearch:{
      id:'wordsearch',title:'Maths Word Search',kind:'independent',printableMode:'grid',answerSheetSupport:true,
      supportedAnswerTypes:['vocabulary'],minItems:6,maxItems:14,difficultyOptions:['easy','standard','challenge'],
      needsCutting:false,needsDice:false,needsPartner:false,
      compatibility:Object.fromEntries(Object.keys(TOPICS).map(t=>[t,'excellent']))
    },
    pyramid:{
      id:'pyramid',title:'Number Pyramid',kind:'independent',printableMode:'puzzle',answerSheetSupport:true,
      supportedAnswerTypes:['integer'],minItems:1,maxItems:3,difficultyOptions:['easy','standard','challenge'],
      needsCutting:false,needsDice:false,needsPartner:false,
      compatibility:{number_place_value:'excellent',calculation:'excellent',fractions:'poor',decimals_percentages:'poor',measurement:'poor',geometry:'poor',statistics:'poor',algebra:'poor'}
    }
  };

  const VOCABULARY=[
    // Number & place value
    v('number_place_value','number','A mathematical value used for counting, measuring or labelling.',1,6),
    v('number_place_value','digit','One symbol used to write a number.',1,6),
    v('number_place_value','zero','The number that represents no amount.',1,6),
    v('number_place_value','one more','The next whole number when you add 1.',1,2),
    v('number_place_value','one less','The previous whole number when you subtract 1.',1,2),
    v('number_place_value','greater','Having a larger value.',1,6),
    v('number_place_value','smaller','Having a lower value.',1,6),
    v('number_place_value','equal','Having the same value.',1,6),
    v('number_place_value','tens','Groups of ten or the place immediately left of the ones digit.',1,6),
    v('number_place_value','ones','Single units in a whole number.',1,6),
    v('number_place_value','hundreds','Groups of one hundred or the third place from the right.',2,6),
    v('number_place_value','thousands','Groups of one thousand.',3,6),
    v('number_place_value','place value','The value a digit has because of its position in a number.',2,6),
    v('number_place_value','partition','To split a number into useful place-value parts.',2,6),
    v('number_place_value','round','To replace a number with a nearby value at a chosen place.',3,6),
    v('number_place_value','negative','Less than zero.',4,6),
    v('number_place_value','integer','A whole number, including positive numbers, negative numbers and zero.',5,6),
    v('number_place_value','million','One thousand thousands.',5,6),

    // Calculation
    v('calculation','add','To combine quantities to find a total.',1,6),
    v('calculation','subtract','To take one amount away from another or find the difference.',1,6),
    v('calculation','plus','A word and symbol used for addition.',1,6),
    v('calculation','minus','A word and symbol used for subtraction.',1,6),
    v('calculation','total','The amount found by adding quantities together.',1,6),
    v('calculation','difference','The result of comparing by subtraction.',2,6),
    v('calculation','multiply','To combine equal groups or find repeated addition efficiently.',2,6),
    v('calculation','divide','To share or group a quantity equally.',2,6),
    v('calculation','product','The answer to a multiplication.',3,6),
    v('calculation','quotient','The answer to a division.',5,6),
    v('calculation','factor','A whole number that divides exactly into another whole number.',4,6),
    v('calculation','multiple','A number in the times table of another number.',3,6),
    v('calculation','inverse','An operation that undoes another operation.',2,6),
    v('calculation','estimate','To find a sensible approximate answer.',3,6),
    v('calculation','operation','A mathematical process such as addition, subtraction, multiplication or division.',3,6),
    v('calculation','brackets','Symbols used to group part of a calculation so it is dealt with together.',5,6),

    // Fractions
    v('fractions','fraction','A number that represents equal parts of a whole or quantity.',1,6),
    v('fractions','whole','One complete object, shape or quantity.',1,6),
    v('fractions','part','An amount that makes up some of a whole.',1,6),
    v('fractions','equal parts','Parts that are the same size.',1,6),
    v('fractions','share','To split a quantity into groups or parts.',1,6),
    v('fractions','half','One of two equal parts.',1,6),
    v('fractions','quarter','One of four equal parts.',1,6),
    v('fractions','third','One of three equal parts.',2,6),
    v('fractions','numerator','The number above the fraction line.',3,6),
    v('fractions','denominator','The number below the fraction line.',3,6),
    v('fractions','equivalent','Having the same value even though written differently.',3,6),
    v('fractions','proper fraction','A fraction with a numerator smaller than its denominator.',5,6),
    v('fractions','improper fraction','A fraction with a numerator greater than or equal to its denominator.',5,6),
    v('fractions','mixed number','A whole number written together with a proper fraction.',5,6),
    v('fractions','simplify','To write a fraction in an equivalent form using smaller numbers.',5,6),
    v('fractions','unit fraction','A fraction with a numerator of 1.',3,6),

    // Decimals & percentages
    v('decimals_percentages','decimal','A number written using a decimal point to show parts smaller than one.',4,6),
    v('decimals_percentages','tenths','Place-value parts that are each one tenth.',4,6),
    v('decimals_percentages','hundredths','Place-value parts that are each one hundredth.',4,6),
    v('decimals_percentages','compare','To decide whether one value is greater than, less than or equal to another.',4,6),
    v('decimals_percentages','round','To replace a number with a nearby value at a chosen place.',4,6),
    v('decimals_percentages','decimal point','The point separating whole-number and fractional place values.',4,6),
    v('decimals_percentages','tenth','One of ten equal parts.',4,6),
    v('decimals_percentages','hundredth','One of one hundred equal parts.',4,6),
    v('decimals_percentages','thousandth','One of one thousand equal parts.',5,6),
    v('decimals_percentages','percentage','A number of parts out of one hundred.',5,6),
    v('decimals_percentages','percent','Meaning out of one hundred.',5,6),
    v('decimals_percentages','equivalent','Having the same value in another form.',4,6),

    // Measurement
    v('measurement','length','The distance from one end of something to the other.',1,6),
    v('measurement','height','How tall something is.',1,6),
    v('measurement','mass','A measure of how much matter an object contains.',1,6),
    v('measurement','capacity','The amount a container can hold.',1,6),
    v('measurement','volume','The amount of three-dimensional space something occupies.',5,6),
    v('measurement','perimeter','The distance all the way around a 2D shape.',3,6),
    v('measurement','area','The amount of surface covered by a 2D shape.',4,6),
    v('measurement','metre','A metric unit used to measure length.',1,6),
    v('measurement','centimetre','One hundredth of a metre.',1,6),
    v('measurement','kilometre','One thousand metres.',3,6),
    v('measurement','gram','A metric unit used to measure mass.',2,6),
    v('measurement','kilogram','One thousand grams.',2,6),
    v('measurement','litre','A metric unit used to measure capacity.',2,6),
    v('measurement','millilitre','One thousandth of a litre.',2,6),
    v('measurement','convert','To change a measure from one unit to another without changing its size.',4,6),

    // Geometry incl angles/position
    v('geometry','shape','The form or outline of an object or figure.',1,6),
    v('geometry','circle','A round 2D shape whose edge is the same distance from its centre.',1,6),
    v('geometry','triangle','A 2D shape with three straight sides.',1,6),
    v('geometry','square','A 2D shape with four equal sides and four right angles.',1,6),
    v('geometry','rectangle','A 2D shape with four right angles.',1,6),
    v('geometry','position','Where something is located.',1,6),
    v('geometry','direction','The way something is facing or moving.',1,6),
    v('geometry','turn','A change in direction or orientation.',1,6),
    v('geometry','vertex','A point where two or more edges or sides meet.',2,6),
    v('geometry','vertices','More than one vertex.',2,6),
    v('geometry','edge','A line where faces meet, or a boundary of a shape.',2,6),
    v('geometry','face','A flat or curved surface of a 3D shape.',1,6),
    v('geometry','parallel','Lines that stay the same distance apart and never meet.',3,6),
    v('geometry','perpendicular','Lines that meet at a right angle.',3,6),
    v('geometry','angle','The amount of turn between two lines or directions.',3,6),
    v('geometry','right angle','An angle of 90 degrees.',3,6),
    v('geometry','acute','An angle smaller than a right angle.',4,6),
    v('geometry','obtuse','An angle larger than 90 degrees but smaller than 180 degrees.',4,6),
    v('geometry','reflex','An angle greater than 180 degrees but less than 360 degrees.',5,6),
    v('geometry','degrees','Units used to measure angles.',5,6),
    v('geometry','coordinate','A pair or set of numbers describing a position on a grid.',4,6),
    v('geometry','translate','To move a shape without turning, flipping or resizing it.',4,6),
    v('geometry','reflect','To flip a shape across a mirror line.',5,6),
    v('geometry','quadrant','One of four regions made by the coordinate axes.',6,6),

    // Statistics
    v('statistics','data','Information collected for a purpose.',2,6),
    v('statistics','sort','To arrange data or objects into groups.',2,6),
    v('statistics','category','A named group used to organise data.',2,6),
    v('statistics','count','To find how many items there are.',2,6),
    v('statistics','block diagram','A chart using blocks to represent quantities.',2,6),
    v('statistics','tally','A counting mark used to record how often something occurs.',2,6),
    v('statistics','table','Information arranged in rows and columns.',2,6),
    v('statistics','chart','A visual way of displaying data.',2,6),
    v('statistics','bar chart','A chart that uses bars to show values or frequencies.',3,6),
    v('statistics','pictogram','A chart that uses pictures or symbols to represent data.',2,6),
    v('statistics','frequency','How often a value or event occurs.',3,6),
    v('statistics','mean','The total of the values divided by how many values there are.',6,6),
    v('statistics','pie chart','A circle divided into sectors to show proportions.',6,6),
    v('statistics','line graph','A graph that joins plotted points, often to show change over time.',5,6),

    // Algebra & sequences
    v('algebra','sequence','A list of numbers or objects arranged according to a rule.',2,6),
    v('algebra','term','One item or number in a sequence.',2,6),
    v('algebra','continue','To extend a sequence by following its rule.',2,6),
    v('algebra','repeat','To occur again in the same pattern.',2,6),
    v('algebra','increase','To become greater in value.',2,6),
    v('algebra','decrease','To become smaller in value.',2,6),
    v('algebra','pattern','A repeated or changing arrangement that follows a rule.',1,6),
    v('algebra','rule','An instruction describing how a pattern or sequence changes.',2,6),
    v('algebra','unknown','A value that has not yet been found.',4,6),
    v('algebra','variable','A symbol, often a letter, used to represent a value that can change.',6,6),
    v('algebra','formula','A mathematical rule written using symbols.',6,6),
    v('algebra','equation','A mathematical statement showing that two expressions are equal.',5,6),
    v('algebra','expression','Numbers, symbols and operations written without an equals sign.',6,6)
  ];

  function v(topic,term,definition,minYear,maxYear){return {topic,term,definition,minYear,maxYear,source:'built-in'};}
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function hashString(str){let h=2166136261>>>0;for(let i=0;i<String(str).length;i++){h^=String(str).charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
  function rngFromSeed(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function shuffle(arr,rng){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function randInt(rng,a,b){return Math.floor(rng()*(b-a+1))+a;}
  function normalizeTerm(term){return String(term||'').toUpperCase().replace(/[^A-Z]/g,'');}
  function yearText(minYear,maxYear){return minYear===maxYear?`Year ${minYear}`:`Years ${minYear}–${maxYear}`;}
  function normalizeSettings(input={}){
    const minYear=clamp(Number(input.minYear)||1,1,6),maxYear=clamp(Number(input.maxYear)||6,minYear,6);
    const topics=(Array.isArray(input.topics)?input.topics:[]).filter(t=>TOPICS[t]);
    return {
      minYear,maxYear,topics:topics.length?topics:['calculation'],difficulty:['easy','standard','challenge'].includes(input.difficulty)?input.difficulty:'standard',
      sheets:clamp(Number(input.sheets)||1,1,6),activitiesPerSheet:clamp(Number(input.activitiesPerSheet)||1,1,3),
      gameMode:['mixed','single'].includes(input.gameMode)?input.gameMode:'mixed',gameId:ENGINES[input.gameId]?input.gameId:'wordsearch',
      includeAnswers:input.includeAnswers!==false,wordSearchMode:['words','definitions','auto'].includes(input.wordSearchMode)?input.wordSearchMode:'auto'
    };
  }
  function compatibleEngines(settings){
    const s=normalizeSettings(settings),topics=s.topics;
    return Object.values(ENGINES).filter(engine=>topics.some(t=>['excellent','reasonable'].includes(engine.compatibility[t]))).map(x=>x.id);
  }
  function chooseEngine(settings,index,seed){
    const s=normalizeSettings(settings);
    if(s.gameMode==='single')return s.gameId;
    const eligible=compatibleEngines(s);if(!eligible.length)return 'wordsearch';
    // Cycle first so a mixed pack visibly contains different engines before randomising later repetitions.
    if(index<eligible.length)return eligible[index];
    return eligible[Math.floor(rngFromSeed(`${seed}:engine:${index}`)()*eligible.length)];
  }
  function sanitizeCustomVocabulary(entries){
    const out=[];
    for(const raw of Array.isArray(entries)?entries:[]){
      const topic=TOPICS[raw?.topic]?raw.topic:'number_place_value';
      const term=String(raw?.term||'').trim().replace(/\s+/g,' '),definition=String(raw?.definition||'').trim().replace(/\s+/g,' ');
      const minYear=clamp(Number(raw?.minYear)||1,1,6),maxYear=clamp(Number(raw?.maxYear)||6,minYear,6);
      const normalized=normalizeTerm(term);
      if(term && definition && normalized.length>=2 && normalized.length<=20)out.push({topic,term,definition,minYear,maxYear,source:'mine'});
    }
    const seen=new Set();return out.filter(x=>{const k=`${x.topic}|${x.term.toLowerCase()}`;if(seen.has(k))return false;seen.add(k);return true;});
  }
  function vocabularyFor(settings,customVocabulary=[]){
    const s=normalizeSettings(settings),all=VOCABULARY.concat(sanitizeCustomVocabulary(customVocabulary));
    return all.filter(x=>s.topics.includes(x.topic)&&x.minYear<=s.maxYear&&x.maxYear>=s.minYear&&normalizeTerm(x.term).length<=wordSearchGridSize(s));
  }
  function wordSearchGridSize(settings){const s=normalizeSettings(settings);return s.difficulty==='easy'?12:s.difficulty==='challenge'?16:14;}
  function wordSearchCount(settings,available){const s=normalizeSettings(settings);const target=s.difficulty==='easy'?7:s.difficulty==='challenge'?11:9;return Math.max(4,Math.min(target,available));}
  function placementDirections(difficulty){
    if(difficulty==='easy')return [[1,0],[0,1],[1,1]];
    if(difficulty==='standard')return [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1]];
    return [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  }
  function placeWord(grid,word,rng,dirs){
    const n=grid.length;
    for(let attempt=0;attempt<300;attempt++){
      const [dx,dy]=dirs[randInt(rng,0,dirs.length-1)],x0=randInt(rng,0,n-1),y0=randInt(rng,0,n-1),x1=x0+dx*(word.length-1),y1=y0+dy*(word.length-1);
      if(x1<0||x1>=n||y1<0||y1>=n)continue;
      let ok=true;for(let i=0;i<word.length;i++){const x=x0+dx*i,y=y0+dy*i,c=grid[y][x];if(c&&c!==word[i]){ok=false;break;}}
      if(!ok)continue;
      const cells=[];for(let i=0;i<word.length;i++){const x=x0+dx*i,y=y0+dy*i;grid[y][x]=word[i];cells.push([x,y]);}
      return cells;
    }
    return null;
  }
  function generateWordSearch(settings,seed,customVocabulary=[]){
    const s=normalizeSettings(settings),rng=rngFromSeed(seed),size=wordSearchGridSize(s),available=vocabularyFor(s,customVocabulary);
    if(available.length<4)return {engineId:'wordsearch',error:'Not enough vocabulary is available for this year/topic selection. Add My vocabulary entries or choose another topic.'};
    const count=wordSearchCount(s,available.length),chosen=shuffle(available,rng).slice(0,count).sort((a,b)=>normalizeTerm(b.term).length-normalizeTerm(a.term).length),grid=Array.from({length:size},()=>Array(size).fill('')),placements=[];
    const dirs=placementDirections(s.difficulty);
    for(const item of chosen){const word=normalizeTerm(item.term),cells=placeWord(grid,word,rng,dirs);if(cells)placements.push({term:item.term,definition:item.definition,source:item.source,topic:item.topic,cells});}
    const alphabet='EEEEEEEEAAAAAAIIIIIOOOONNNNRRRRTTTTSSSSLLLCCDDMPUFGHBVYWKXJQZ';
    for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!grid[y][x])grid[y][x]=alphabet[randInt(rng,0,alphabet.length-1)];
    const mode=s.wordSearchMode==='auto'?(s.difficulty==='challenge'?'definitions':'words'):s.wordSearchMode;
    return {engineId:'wordsearch',title:'Maths Word Search',topicIds:[...new Set(placements.map(x=>x.topic))],grid,size,placements,mode,difficulty:s.difficulty,yearText:yearText(s.minYear,s.maxYear),seed};
  }

  function pyramidProfile(settings){
    const s=normalizeSettings(settings),year=s.maxYear,d=s.difficulty;
    let rows=year<=2?3:4,maxApex=year===1?20:year===2?100:year===3?500:year===4?2000:year===5?5000:10000;
    if(d==='easy'){maxApex=Math.max(10,Math.floor(maxApex*.35));}
    if(d==='challenge'&&year>=4){rows=5;maxApex=Math.min(20000,Math.floor(maxApex*1.5));}
    const missingRatio=d==='easy'?.32:d==='challenge'?.58:.45;
    return {rows,maxApex,missingRatio};
  }
  function buildPyramid(bottom){
    const rows=[bottom.slice()];let current=bottom.slice();
    while(current.length>1){const next=[];for(let i=0;i<current.length-1;i++)next.push(current[i]+current[i+1]);rows.unshift(next);current=next;}
    return rows;
  }
  function matrixRank(matrix,eps=1e-9){
    const a=matrix.map(row=>row.map(Number));if(!a.length)return 0;const rows=a.length,cols=a[0].length;let rank=0,col=0;
    while(rank<rows&&col<cols){let pivot=rank;for(let r=rank+1;r<rows;r++)if(Math.abs(a[r][col])>Math.abs(a[pivot][col]))pivot=r;
      if(Math.abs(a[pivot][col])<=eps){col++;continue;}[a[rank],a[pivot]]=[a[pivot],a[rank]];const div=a[rank][col];for(let c=col;c<cols;c++)a[rank][c]/=div;
      for(let r=0;r<rows;r++){if(r===rank)continue;const f=a[r][col];if(Math.abs(f)<=eps)continue;for(let c=col;c<cols;c++)a[r][c]-=f*a[rank][c];}
      rank++;col++;
    }return rank;
  }
  function pyramidCoefficientRows(size){
    let rows=[Array.from({length:size},(_,i)=>Array.from({length:size},(__,j)=>i===j?1:0))],current=rows[0];
    while(current.length>1){const next=[];for(let i=0;i<current.length-1;i++)next.push(current[i].map((v,j)=>v+current[i+1][j]));rows.unshift(next);current=next;}return rows;
  }
  function uniquelySolvablePyramidMask(rowCount,candidates,targetMissing,rng){
    const coeff=pyramidCoefficientRows(rowCount),all=[];for(let r=0;r<coeff.length;r++)for(let c=0;c<coeff[r].length;c++)all.push([r,c]);
    const missing=new Set(),order=shuffle(candidates,rng);
    for(const [r,c] of order){if(missing.size>=targetMissing)break;const key=`${r}:${c}`;missing.add(key);const visible=all.filter(([rr,cc])=>!missing.has(`${rr}:${cc}`)).map(([rr,cc])=>coeff[rr][cc]);if(matrixRank(visible)<rowCount)missing.delete(key);}
    return [...missing].map(k=>k.split(':').map(Number));
  }
  function generateNumberPyramid(settings,seed){
    const s=normalizeSettings(settings),rng=rngFromSeed(seed),profile=pyramidProfile(s);let rows=null;
    for(let tries=0;tries<500;tries++){
      const maxBottom=Math.max(3,Math.floor(profile.maxApex/Math.pow(2,profile.rows-1))),minBottom=s.minYear<=1?0:1;
      const bottom=Array.from({length:profile.rows},()=>randInt(rng,minBottom,maxBottom));rows=buildPyramid(bottom);if(rows[0][0]<=profile.maxApex)break;
    }
    const all=[];for(let r=0;r<rows.length;r++)for(let c=0;c<rows[r].length;c++)all.push([r,c]);
    // Keep apex visible on easy. Remove clues only while the remaining visible cells
    // still have full rank against the bottom row, so each generated pyramid has a unique solution.
    const candidates=all.filter(([r])=>!(s.difficulty==='easy'&&r===0));
    const missingCount=Math.min(all.length-profile.rows,Math.max(2,Math.round(all.length*profile.missingRatio)));
    const missing=uniquelySolvablePyramidMask(profile.rows,candidates,missingCount,rng),missingSet=new Set(missing.map(([r,c])=>`${r}:${c}`));
    return {engineId:'pyramid',title:'Number Pyramid',topicIds:['calculation'],rows,missing,missingSet:[...missingSet],difficulty:s.difficulty,yearText:yearText(s.minYear,s.maxYear),seed,instruction:'Each brick is the sum of the two bricks directly below it.'};
  }

  function generateActivity(engineId,settings,seed,customVocabulary=[]){
    if(engineId==='pyramid')return generateNumberPyramid(settings,seed);
    return generateWordSearch(settings,seed,customVocabulary);
  }
  function generatePack(settings,seed='games',customVocabulary=[]){
    const s=normalizeSettings(settings),sheets=[];let globalIndex=0;
    for(let sheetIndex=0;sheetIndex<s.sheets;sheetIndex++){
      const activities=[];
      for(let i=0;i<s.activitiesPerSheet;i++,globalIndex++){
        const engineId=chooseEngine(s,globalIndex,seed),activitySeed=`${seed}:S${sheetIndex+1}:A${i+1}:${engineId}`;
        activities.push(generateActivity(engineId,s,activitySeed,customVocabulary));
      }
      sheets.push({index:sheetIndex+1,activities});
    }
    return {version:VERSION,seed,settings:s,sheets};
  }

  const api={VERSION,TOPICS,ENGINES,VOCABULARY,normalizeSettings,compatibleEngines,sanitizeCustomVocabulary,vocabularyFor,generateWordSearch,generateNumberPyramid,generateActivity,generatePack,normalizeTerm,rngFromSeed,clone,_matrixRank:matrixRank,_pyramidCoefficientRows:pyramidCoefficientRows};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.TT99Games=api;
})(typeof globalThis!=='undefined'?globalThis:this);
