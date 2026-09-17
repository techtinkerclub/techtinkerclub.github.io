/* 99 Club Studio · Equation Crossgrid board-size correction v1.87
 *
 * A linked equation occupies five cells: number, operation, number, equals,
 * number. Crossings therefore sit on every-other cell. On an even-sized board
 * (8x8 / 10x10) one outer row/column is structurally unreachable, which creates
 * a misleading band of blocked squares around otherwise valid puzzles.
 *
 * Keep the existing generator and maths logic, but normalise larger Crossgrid
 * canvases to 9x9. 5x5 remains available for compact/easy puzzles. This gives
 * the equation lattice an odd footprint so it can legitimately reach every
 * outer edge instead of advertising unusable cells.
 */
(function(global){
'use strict';
const A=global.TT99ArithmeticGames;
if(!A||typeof A.generate!=='function'||A.__crossgridOddBoardV187)return;

const previousGenerate=A.generate.bind(A);
const previousNormalise=typeof A.normalise==='function'?A.normalise.bind(A):null;

function correctedCrossgrid(raw={}){
  const c={...raw};
  const difficulty=['easy','standard','challenge'].includes(c.difficulty)?c.difficulty:'standard';
  const requested=String(c.gridSize??'auto');
  if(requested==='auto')c.gridSize=difficulty==='easy'?'5':'9';
  else if(requested==='8'||requested==='10')c.gridSize='9';
  else if(requested!=='5'&&requested!=='9')c.gridSize=difficulty==='easy'?'5':'9';
  return c;
}

A.generate=function(id,settings,seed){
  if(id!=='equationcrossgrid')return previousGenerate(id,settings,seed);
  const src=settings&&typeof settings==='object'?settings:{};
  const engineSettings={...(src.engineSettings||{})};
  engineSettings.equationcrossgrid=correctedCrossgrid(engineSettings.equationcrossgrid||{});
  return previousGenerate(id,{...src,engineSettings},seed);
};

if(previousNormalise){
  A.normalise=function(id,raw={}){
    if(id==='equationcrossgrid')return previousNormalise(id,correctedCrossgrid(raw));
    return previousNormalise(id,raw);
  };
}

const def=A.DEFINITIONS?.equationcrossgrid;
if(def){
  def.defaultSettings={...def.defaultSettings,gridSize:'auto'};
  const gridSetting=def.settingsSchema?.find(x=>x.id==='gridSize');
  if(gridSetting)gridSetting.options=[
    {value:'auto',label:'Auto for difficulty'},
    {value:'5',label:'5 × 5'},
    {value:'9',label:'9 × 9'}
  ];
  def.difficultyDescriptions={
    ...def.difficultyDescriptions,
    standard:'9×9 linked equation lattice with mixed relationships',
    challenge:'Dense 9×9 linked equation lattice, fewer clues and all four operations'
  };
}

A.__crossgridOddBoardV187=true;
})(typeof globalThis!=='undefined'?globalThis:this);
