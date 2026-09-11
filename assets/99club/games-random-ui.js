/* 99 Club Studio · Random pack UI v1.0.0
 * Progressive enhancement for Games & Puzzles.
 * Keeps the existing manual engine selector, but adds a simple random-pack mode
 * driven only by year(s), topic(s), and total game/puzzle count.
 */
(function(global){
  'use strict';

  const root=document.getElementById('tt99-games-root');
  const G=global.TT99Games;
  if(!root||!G?.PACK_MODE)return;

  const MODE_KEY=G.PACK_MODE.storageModeKey;
  const COUNT_KEY=G.PACK_MODE.storageCountKey;
  let scheduled=false;

  function getStored(key,fallback){try{return localStorage.getItem(key)??fallback;}catch(e){return fallback;}}
  function setStored(key,value){try{localStorage.setItem(key,String(value));}catch(e){}}
  function mode(){return getStored(MODE_KEY,'manual')==='random'?'random':'manual';}
  function count(){const n=Math.round(Number(getStored(COUNT_KEY,'')));if(Number.isFinite(n)&&n>=1)return Math.min(40,n);const s=Number(root.querySelector('#games-sheets')?.value)||1,a=Number(root.querySelector('#games-activities')?.value)||2;return Math.min(40,Math.max(1,s*a));}

  function injectStyle(){
    if(document.getElementById('tt99-random-pack-style'))return;
    const style=document.createElement('style');style.id='tt99-random-pack-style';style.textContent=`
      .tt99-random-pack-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
      .tt99-random-pack-note{margin:0 0 12px;padding:11px 12px;border:1px solid #cfe2e3;border-radius:12px;background:#f5fbfb;color:#3d5a62;font-size:.9rem;line-height:1.4}
      .tt99-random-pack-note strong{color:#174c55}
      .tt99-random-mode .tt99-game-categories,.tt99-random-mode .tt99-selected-games,.tt99-random-mode .tt99-games-library-tools,.tt99-random-mode .tt99-engine-panel{display:none!important}
      .tt99-random-mode .tt99-games-step+ .tt99-games-library-tools{display:none!important}
      .tt99-random-mode .tt99-games-help{margin-top:0}
      .tt99-random-pack-badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:4px 9px;background:#e6f5f3;color:#176860;font-weight:700;font-size:.78rem}
      @media(max-width:640px){.tt99-random-pack-fields{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
  }

  function enhance(){
    injectStyle();
    const buildSelect=root.querySelector('#games-sheets');
    if(!buildSelect)return;
    const buildCard=buildSelect.closest('.tt99-games-card');
    const gamesCard=root.querySelector('[data-category-toggle]')?.closest('.tt99-games-card');
    if(!buildCard||!gamesCard)return;

    const currentMode=mode(),currentCount=count();
    gamesCard.classList.toggle('tt99-random-mode',currentMode==='random');

    const sheetField=buildSelect.closest('.tt99-field'),activityField=root.querySelector('#games-activities')?.closest('.tt99-field');
    if(sheetField)sheetField.style.display='none';if(activityField)activityField.style.display='none';

    const grid=sheetField?.parentElement||buildCard.querySelector('.tt99-games-grid2');
    if(grid&&!grid.querySelector('.tt99-random-pack-fields')){
      const holder=document.createElement('div');holder.className='tt99-random-pack-fields wide';holder.innerHTML=`
        <label class="tt99-field"><span>Pack type</span><select id="games-pack-mode"><option value="random" ${currentMode==='random'?'selected':''}>Random compatible games & puzzles</option><option value="manual" ${currentMode==='manual'?'selected':''}>Use my selected games</option></select><small>Random mode chooses only games that fit the selected years and topics.</small></label>
        <label class="tt99-field"><span>Number of games / puzzles</span><input id="games-activity-count" type="number" min="1" max="40" step="1" value="${currentCount}"><small>Two activities are placed on each pupil sheet. An odd total leaves one activity on the final sheet.</small></label>`;
      grid.prepend(holder);
      holder.querySelector('#games-pack-mode')?.addEventListener('change',e=>{setStored(MODE_KEY,e.target.value==='random'?'random':'manual');root.querySelector('#games-new-version')?.click();});
      holder.querySelector('#games-activity-count')?.addEventListener('change',e=>{const n=Math.max(1,Math.min(40,Math.round(Number(e.target.value)||1)));setStored(COUNT_KEY,n);root.querySelector('#games-new-version')?.click();});
    }

    if(currentMode==='random'){
      const firstStep=gamesCard.querySelector('.tt99-games-step');
      const text=firstStep?.querySelector('p');if(text)text.textContent='Random mode is active. The app will choose a varied mix from every game that genuinely fits the selected years and topics.';
      if(!gamesCard.querySelector('.tt99-random-pack-note')){const note=document.createElement('p');note.className='tt99-random-pack-note';note.innerHTML='<strong>Random pack:</strong> manual game selections are preserved but temporarily ignored. Switch back to “Use my selected games” at any time.';firstStep?.after(note);}
      const packStep=buildCard.querySelector('.tt99-games-step p');if(packStep)packStep.textContent=`${currentCount} game activit${currentCount===1?'y':'ies'} · 2 per sheet · ${Math.ceil(currentCount/2)} pupil sheet${Math.ceil(currentCount/2)===1?'':'s'}.`;
      const newBtn=buildCard.querySelector('#games-new-version');if(newBtn)newBtn.textContent='Generate random pack';
    }else{
      const packStep=buildCard.querySelector('.tt99-games-step p');if(packStep)packStep.insertAdjacentHTML('beforeend',` <span class="tt99-random-pack-badge">${currentCount} activities · 2 / sheet</span>`);
    }

    const toolbar=root.querySelector('.tt99-games-preview-toolbar > div');
    if(toolbar){const spans=toolbar.querySelectorAll(':scope > span');if(spans[0]){const sheets=Math.ceil(currentCount/2),prefix=currentMode==='random'?'Random mix':'Selected games';spans[0].textContent=`${prefix} · ${currentCount} activit${currentCount===1?'y':'ies'} · ${sheets} sheet${sheets===1?'':'s'}`;}}
  }

  function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}
  const observer=new MutationObserver(schedule);observer.observe(root,{childList:true,subtree:true});
  schedule();
})(typeof globalThis!=='undefined'?globalThis:this);
