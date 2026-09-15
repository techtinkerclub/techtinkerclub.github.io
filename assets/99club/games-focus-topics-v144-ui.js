/* 99 Club Studio · Games granular topic selector UI v1.44 */
(function(global){
'use strict';
const root=document.getElementById('tt99-games-root'),G=global.TT99Games;if(!root||!G?.FOCUS_TOPICS||root.dataset.focusTopicsV144==='1')return;
root.dataset.focusTopicsV144='1';let scheduled=false;
const SETTINGS_KEY='tt99-games-settings-v4';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function stored(){try{return G.normalizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'));}catch(e){return G.normalizeSettings({});}}
function yearValue(s){return Number(s.yearFilter)||0;}
function available(id,year){return G.focusAllowedForYear(id,year);}
function applyFocus(ids){
  const s=stored(),year=yearValue(s),clean=[...new Set(ids.filter(id=>G.FOCUS_TOPICS[id]&&available(id,year)))];if(!clean.length)return;
  global.__tt99PendingGameFocusTopics=clean;
  const parents=new Set(G.focusParents(clean));
  const legacy=[...root.querySelectorAll('.tt99-topic-legacy-v144 [data-topic]')];legacy.forEach(el=>el.checked=parents.has(el.dataset.topic));
  const trigger=legacy.find(el=>el.checked)||legacy[0];trigger?.dispatchEvent(new Event('change',{bubbles:true}));
}
function applyYear(value){
  const year=Number(value)||0,s=stored(),current=(s.focusTopics||[]).filter(id=>available(id,year));
  global.__tt99PendingGameYearFilter=year;global.__tt99PendingGameFocusTopics=current.length?current:Object.keys(G.FOCUS_TOPICS).filter(id=>available(id,year)).slice(0,1);
  const min=root.querySelector('#games-min-year'),max=root.querySelector('#games-max-year');if(!min||!max)return;
  min.value=String(year||1);max.value=String(year||6);min.dispatchEvent(new Event('change',{bubbles:true}));
}
function build(){
  const oldGrid=root.querySelector('.tt99-games-topic-grid'),oldYear=root.querySelector('#games-min-year')?.closest('.tt99-games-grid2'),label=root.querySelector('.tt99-games-topic-label');if(!oldGrid||!oldYear)return;
  oldGrid.classList.add('tt99-topic-legacy-v144');oldGrid.hidden=true;oldYear.classList.add('tt99-year-legacy-v144');oldYear.hidden=true;if(label)label.hidden=true;
  const card=oldGrid.closest('.tt99-games-card');if(!card||card.querySelector('.tt99-focus-v144'))return;
  const s=stored(),year=yearValue(s),selected=new Set(s.focusTopics||[]),groups=(G.FOCUS_GROUPS||[]).map((group,i)=>{
    const topics=Object.entries(G.FOCUS_TOPICS).filter(([,m])=>m.group===group.id),selectedCount=topics.filter(([id])=>selected.has(id)).length;
    return `<details class="tt99-focus-group ${selectedCount?'has-selection':''}" ${selectedCount||i===0?'open':''}><summary><span><strong>${esc(group.label)}</strong><small>${selectedCount?`${selectedCount} selected`:'Choose a focus'}</small></span><em>▾</em></summary><div class="tt99-focus-topic-list">${topics.map(([id,m])=>{const ok=available(id,year);return `<label class="tt99-focus-topic ${selected.has(id)?'is-selected':''} ${ok?'':'is-unavailable'}"><input type="checkbox" data-focus-topic="${id}" ${selected.has(id)?'checked':''} ${ok?'':'disabled'}><span>${esc(m.label)}</span></label>`;}).join('')}</div></details>`;
  }).join('');
  const el=document.createElement('div');el.className='tt99-focus-v144';el.innerHTML=`<div class="tt99-focus-year"><label class="tt99-field"><span>Year filter</span><select data-focus-year><option value="0" ${year===0?'selected':''}>All primary · Years 1–6</option>${[1,2,3,4,5,6].map(y=>`<option value="${y}" ${year===y?'selected':''}>Year ${y}</option>`).join('')}</select><small>Optional. Pick one year to hide teaching focuses that are normally introduced later.</small></label><div class="tt99-focus-actions"><button type="button" class="tt99-ghost" data-focus-all>Select all available</button><button type="button" class="tt99-ghost" data-focus-core>Core arithmetic</button></div></div><div class="tt99-focus-heading"><span>Teaching focus</span><small>Choose one or more precise areas. Puzzle difficulty is still configured separately for each game.</small></div><div class="tt99-focus-groups">${groups}</div>`;
  oldYear.insertAdjacentElement('afterend',el);
  el.querySelector('[data-focus-year]')?.addEventListener('change',e=>applyYear(e.target.value));
  el.querySelectorAll('[data-focus-topic]').forEach(cb=>cb.addEventListener('change',()=>{const ids=[...el.querySelectorAll('[data-focus-topic]:checked')].map(x=>x.dataset.focusTopic);if(!ids.length){cb.checked=true;return;}applyFocus(ids);}));
  el.querySelector('[data-focus-all]')?.addEventListener('click',()=>applyFocus(Object.keys(G.FOCUS_TOPICS).filter(id=>available(id,year))));
  el.querySelector('[data-focus-core]')?.addEventListener('click',()=>applyFocus(['addition_subtraction','multiplication_division','inverse_missing'].filter(id=>available(id,year))));
}
function enhance(){build();}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});schedule();
})(typeof globalThis!=='undefined'?globalThis:this);
