/* v1.37 Number Towers uniqueness acceptance wrapper.
 * Some Latin squares can share the same complete visibility signature. Reject those
 * deterministically and advance to the next seeded candidate before the engine is exposed.
 */
(function(global){
  'use strict';
  let NL=global.TT99NumberLogicGames||null;
  if(!NL&&typeof require==='function'){try{NL=require('./games-number-towers-v137.js');}catch(e){}}
  if(!NL||NL.__v137UniqueAcceptance)return;
  NL.__v137UniqueAcceptance=true;
  const base=NL.generate.bind(NL);
  NL.generate=function(id,settings,seed){
    if(id!=='numbertowers')return base(id,settings,seed);
    let last=null;
    for(let attempt=0;attempt<40;attempt++){
      const candidate=base(id,settings,attempt===0?seed:`${seed}:unique:${attempt}`);last=candidate;
      if(candidate&&!candidate.error&&NL.validate(candidate).ok)return candidate;
    }
    return {...(last||{}),engineId:'numbertowers',title:'Number Towers · Skyscrapers',error:'A unique Number Towers puzzle could not be built. Generate another version.'};
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=NL;
})(typeof globalThis!=='undefined'?globalThis:this);
