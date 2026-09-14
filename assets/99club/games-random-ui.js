/* 99 Club Studio · Random pack UI v1.2.0
 * Progressive enhancement for Games & Puzzles.
 * Random packs can use a fixed difficulty or a weighted mixed-difficulty profile.
 */
(function(global){
  'use strict';

  const root=document.getElementById('tt99-games-root');
  const G=global.TT99Games;
  if(!root||!G?.PACK_MODE)return;

  const MODE_KEY=G.PACK_MODE.storageModeKey;
  const COUNT_KEY=G.PACK_MODE.storageCountKey;
  const DIFFICULTY_KEY=G.PACK_MODE.storageDifficultyKey;
  const WEIGHTS_KEY=G.PACK_MODE.storageDifficultyWeightsKey;
  const DEFAULT_WEIGHTS=G.PACK_MODE.defaultDifficultyWeights||{easy:25,standard:50,challenge:25};
  let scheduled=false;

  function getStored(key,fallback){try{return localStorage.getItem(key)??fallback;}catch(e){return fallback;}}
  function setStored(key,value){try{localStorage.setItem(key,String(value));}catch(e){}}
  function mode(){return getStored(MODE_KEY,'manual')==='random'?'random':'manual';}
  function count(){const n=Math.round(Number(getStored(COUNT_KEY,'')));if(Number.isFinite(n)&&n>=1)return Math.min(40,n);const s=Number(root.querySelector('#games-sheets')?.value)||1,a=Number(root.querySelector('#games-activities')?.value)||2;return Math.min(40,Math.max(1,s*a));}
  function difficulty(){const value=getStored(DIFFICULTY_KEY,'standard');return ['easy','standard','challenge','mixed'].includes(value)?value:'standard';}
  function difficultyLabel(value){return value==='easy'?'Easy':value==='challenge'?'Challenge':value==='mixed'?'Mixed':'Standard';}
  function normalizeWeights(raw={}){
    let easy=Math.max(0,Math.min(100,Number(raw.easy)||0)),challenge=Math.max(0,Math.min(100,Number(raw.challenge)||0));
    if(easy+challenge>100){const total=easy+challenge;easy=Math.round(easy*100/total);challenge=100-easy;}
    return {easy,standard:100-easy-challenge,challenge};
  }
  function weights(){
    try{const parsed=JSON.parse(getStored(WEIGHTS_KEY,JSON.stringify(DEFAULT_WEIGHTS)));return normalizeWeights(parsed);}catch(e){return {...DEFAULT_WEIGHTS};}
  }
  function saveWeights(w){setStored(WEIGHTS_KEY,JSON.stringify(normalizeWeights(w)));}
  function weightsLabel(w){return `${w.easy}% Easy · ${w.standard}% Standard · ${w.challenge}% Challenge`;}

  function injectStyle(){
    if(document.getElementById('tt99-random-pack-style'))return;
    const style=document.createElement('style');style.id='tt99-random-pack-style';style.textContent=`
      .tt99-random-pack-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:12px}
      .tt99-random-pack-note{margin:0 0 12px;padding:11px 12px;border:1px solid #cfe2e3;border-radius:12px;background:#f5fbfb;color:#3d5a62;font-size:.9rem;line-height:1.4}
      .tt99-random-pack-note strong{color:#174c55}
      .tt99-random-mode .tt99-game-categories,.tt99-random-mode .tt99-selected-games,.tt99-random-mode .tt99-games-library-tools,.tt99-random-mode .tt99-engine-panel{display:none!important}
      .tt99-random-mode .tt99-games-step+ .tt99-games-library-tools{display:none!important}
      .tt99-random-mode .tt99-games-help{margin-top:0}
      .tt99-random-pack-badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:4px 9px;background:#e6f5f3;color:#176860;font-weight:700;font-size:.78rem}
      .tt99-random-pack-fields .random-only{display:none}
      .tt99-random-mode+.tt99-random-pack-fields .random-only{display:block}
      .tt99-random-pack-mix{grid-column:1/-1;padding:12px;border:1px solid #cfe2e3;border-radius:12px;background:#fbfefe}
      .tt99-random-pack-mix-head{display:flex;justify-content:space-between;gap:12px;align-items:baseline;margin-bottom:9px}
      .tt99-random-pack-mix-head strong{color:#244b51;font-size:.82rem}.tt99-random-pack-mix-head small{color:#6d8085;font-size:.68rem;text-align:right}
      .tt99-random-pack-weights{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      .tt99-random-pack-weights label{display:grid;grid-template-columns:1fr auto;gap:4px 8px;align-items:center;padding:8px 9px;border:1px solid #d9e5e6;border-radius:9px;background:#fff}
      .tt99-random-pack-weights span{font-size:.68rem;font-weight:800;color:#415d63}.tt99-random-pack-weights input{width:72px;border:1px solid #c9d8da;border-radius:7px;padding:5px 7px;font:inherit;font-size:.72rem}.tt99-random-pack-weights b{grid-column:1/-1;color:#688087;font-size:.62rem}
      .tt99-random-pack-weights .is-derived{background:#f3f7f7}.tt99-random-pack-weights .is-derived input{background:#edf3f3;color:#64787d}
      .tt99-random-pack-presets{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.tt99-random-pack-presets button{appearance:none;border:1px solid #c8dcda;border-radius:999px;background:#fff;color:#28635e;padding:5px 9px;font:750 .62rem/1 system-ui;cursor:pointer}.tt99-random-pack-presets button:hover{background:#edf8f6}
      @media(max-width:900px){.tt99-random-pack-fields{grid-template-columns:1fr 1fr}}
      @media(max-width:640px){.tt99-random-pack-fields,.tt99-random-pack-weights{grid-template-columns:1fr}.tt99-random-pack-mix-head{align-items:flex-start;flex-direction:column}.tt99-random-pack-mix-head small{text-align:left}}
    `;document.head.appendChild(style);
  }

  function mixedControls(w){return `<div class="tt99-random-pack-mix">
    <div class="tt99-random-pack-mix-head"><strong>Mixed-difficulty weights</strong><small>Quota-based across the whole random pack, then shuffled. Standard is the remaining percentage.</small></div>
    <div class="tt99-random-pack-weights">
      <label><span>Easy</span><input id="games-random-easy" type="number" min="0" max="100" step="5" value="${w.easy}"><b>${w.easy}%</b></label>
      <label class="is-derived"><span>Standard</span><input id="games-random-standard" type="number" value="${w.standard}" readonly tabindex="-1"><b>${w.standard}%</b></label>
      <label><span>Challenge</span><input id="games-random-challenge" type="number" min="0" max="100" step="5" value="${w.challenge}"><b>${w.challenge}%</b></label>
    </div>
    <div class="tt99-random-pack-presets"><button type="button" data-random-mix-preset="25:50:25">Balanced</button><button type="button" data-random-mix-preset="50:40:10">Gentle</button><button type="button" data-random-mix-preset="15:70:15">Mostly standard</button><button type="button" data-random-mix-preset="10:40:50">Challenge-heavy</button></div>
  </div>`;}

  function enhance(){
    injectStyle();
    const buildSelect=root.querySelector('#games-sheets');
    if(!buildSelect)return;
    const buildCard=buildSelect.closest('.tt99-games-card');
    const gamesCard=root.querySelector('[data-category-toggle]')?.closest('.tt99-games-card');
    if(!buildCard||!gamesCard)return;
    if(buildCard.dataset.randomPackEnhanced==='1')return;
    buildCard.dataset.randomPackEnhanced='1';

    const currentMode=mode(),currentCount=count(),currentDifficulty=difficulty(),currentWeights=weights();
    gamesCard.classList.toggle('tt99-random-mode',currentMode==='random');

    const sheetField=buildSelect.closest('.tt99-field'),activityField=root.querySelector('#games-activities')?.closest('.tt99-field');
    if(sheetField)sheetField.style.display='none';if(activityField)activityField.style.display='none';

    const grid=sheetField?.parentElement||buildCard.querySelector('.tt99-games-grid2');
    if(grid){
      const holder=document.createElement('div');holder.className='tt99-random-pack-fields wide';holder.innerHTML=`
        <label class="tt99-field"><span>Pack type</span><select id="games-pack-mode"><option value="random" ${currentMode==='random'?'selected':''}>Random compatible games & puzzles</option><option value="manual" ${currentMode==='manual'?'selected':''}>Use my selected games</option></select><small>Random mode chooses only games that fit the selected years and topics.</small></label>
        <label class="tt99-field ${currentMode==='random'?'':'random-only'}"><span>Difficulty</span><select id="games-random-difficulty"><option value="easy" ${currentDifficulty==='easy'?'selected':''}>Easy</option><option value="standard" ${currentDifficulty==='standard'?'selected':''}>Standard</option><option value="challenge" ${currentDifficulty==='challenge'?'selected':''}>Challenge</option><option value="mixed" ${currentDifficulty==='mixed'?'selected':''}>Mixed — weighted</option></select><small>${currentDifficulty==='mixed'?'Uses the weighted quota below across the whole pack.':'Applied consistently to every game chosen for a random pack.'}</small></label>
        <label class="tt99-field"><span>Number of games / puzzles</span><input id="games-activity-count" type="number" min="1" max="40" step="1" value="${currentCount}"><small>Two activities are placed on each pupil sheet. An odd total leaves one activity on the final sheet.</small></label>
        ${currentMode==='random'&&currentDifficulty==='mixed'?mixedControls(currentWeights):''}`;
      grid.prepend(holder);
      holder.querySelector('#games-pack-mode')?.addEventListener('change',e=>{setStored(MODE_KEY,e.target.value==='random'?'random':'manual');root.querySelector('#games-new-version')?.click();});
      holder.querySelector('#games-random-difficulty')?.addEventListener('change',e=>{setStored(DIFFICULTY_KEY,['easy','standard','challenge','mixed'].includes(e.target.value)?e.target.value:'standard');root.querySelector('#games-new-version')?.click();});
      holder.querySelector('#games-activity-count')?.addEventListener('change',e=>{const n=Math.max(1,Math.min(40,Math.round(Number(e.target.value)||1)));setStored(COUNT_KEY,n);root.querySelector('#games-new-version')?.click();});
      const updateEdge=key=>{let easy=Math.max(0,Math.min(100,Number(holder.querySelector('#games-random-easy')?.value??currentWeights.easy)||0)),challenge=Math.max(0,Math.min(100,Number(holder.querySelector('#games-random-challenge')?.value??currentWeights.challenge)||0));if(key==='easy'&&easy+challenge>100)challenge=100-easy;if(key==='challenge'&&easy+challenge>100)easy=100-challenge;saveWeights({easy,standard:100-easy-challenge,challenge});root.querySelector('#games-new-version')?.click();};
      holder.querySelector('#games-random-easy')?.addEventListener('change',()=>updateEdge('easy'));
      holder.querySelector('#games-random-challenge')?.addEventListener('change',()=>updateEdge('challenge'));
      holder.querySelectorAll('[data-random-mix-preset]').forEach(btn=>btn.addEventListener('click',()=>{const [easy,standard,challenge]=btn.dataset.randomMixPreset.split(':').map(Number);saveWeights({easy,standard,challenge});root.querySelector('#games-new-version')?.click();}));
    }

    if(currentMode==='random'){
      const firstStep=gamesCard.querySelector('.tt99-games-step');
      const text=firstStep?.querySelector('p');if(text)text.textContent=currentDifficulty==='mixed'?`Random mode is active. Difficulty is allocated across the whole pack using ${weightsLabel(currentWeights).toLowerCase()}.`:`Random mode is active. The app will choose a varied ${difficultyLabel(currentDifficulty).toLowerCase()} mix from every game that genuinely fits the selected years and topics.`;
      const note=document.createElement('p');note.className='tt99-random-pack-note';note.innerHTML='<strong>Random pack:</strong> manual game selections and their individual settings are preserved but temporarily ignored. Switch back to “Use my selected games” at any time.';firstStep?.after(note);
      const packStep=buildCard.querySelector('.tt99-games-step p');if(packStep)packStep.textContent=`${currentDifficulty==='mixed'?`Mixed · ${weightsLabel(currentWeights)}`:difficultyLabel(currentDifficulty)} · ${currentCount} game activit${currentCount===1?'y':'ies'} · 2 per sheet · ${Math.ceil(currentCount/2)} pupil sheet${Math.ceil(currentCount/2)===1?'':'s'}.`;
      const newBtn=buildCard.querySelector('#games-new-version');if(newBtn)newBtn.textContent='Generate random pack';
    }else{
      const packStep=buildCard.querySelector('.tt99-games-step p');if(packStep)packStep.insertAdjacentHTML('beforeend',` <span class="tt99-random-pack-badge">${currentCount} activities · 2 / sheet</span>`);
    }

    const toolbar=root.querySelector('.tt99-games-preview-toolbar > div');
    if(toolbar){const spans=toolbar.querySelectorAll(':scope > span');if(spans[0]){const sheets=Math.ceil(currentCount/2),prefix=currentMode==='random'?(currentDifficulty==='mixed'?`Random mixed · ${currentWeights.easy}/${currentWeights.standard}/${currentWeights.challenge}`:`Random ${difficultyLabel(currentDifficulty).toLowerCase()} mix`):'Selected games';spans[0].textContent=`${prefix} · ${currentCount} activit${currentCount===1?'y':'ies'} · ${sheets} sheet${sheets===1?'':'s'}`;}}
  }

  function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}
  const observer=new MutationObserver(schedule);observer.observe(root,{childList:true,subtree:true});
  schedule();
})(typeof globalThis!=='undefined'?globalThis:this);
