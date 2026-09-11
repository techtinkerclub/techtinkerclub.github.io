/* 99 Club Studio · Maths Games & Puzzles UI v1.0.0 */
(function(){
  'use strict';
  const G=window.TT99Games,root=document.getElementById('tt99-games-root');
  if(!G||!root)return;
  const SETTINGS_KEY='tt99-games-settings-v1',VOCAB_KEY='tt99-games-vocab-v1';
  const DEFAULTS={minYear:3,maxYear:4,topics:['calculation'],difficulty:'standard',sheets:1,activitiesPerSheet:2,gameMode:'mixed',gameId:'wordsearch',includeAnswers:true,wordSearchMode:'auto'};
  const state={settings:loadSettings(),customVocabulary:loadVocabulary(),seed:newSeed(),previewAnswers:false,status:'Choose a year range, topics and difficulty, then generate as many fresh versions as you need.'};
  state.pack=G.generatePack(state.settings,state.seed,state.customVocabulary);

  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function loadSettings(){try{return G.normalizeSettings({...DEFAULTS,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')});}catch(e){return G.normalizeSettings(DEFAULTS);}}
  function loadVocabulary(){try{return G.sanitizeCustomVocabulary(JSON.parse(localStorage.getItem(VOCAB_KEY)||'[]'));}catch(e){return [];}}
  function save(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(state.settings));localStorage.setItem(VOCAB_KEY,JSON.stringify(state.customVocabulary));}catch(e){}}
  function newSeed(){const a=new Uint32Array(2);if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(a);else{a[0]=Date.now();a[1]=Math.floor(Math.random()*2**32);}return `G-${a[0].toString(36)}${a[1].toString(36)}`;}
  function yearRangeLabel(){const s=state.settings;return s.minYear===s.maxYear?`Year ${s.minYear}`:`Years ${s.minYear}–${s.maxYear}`;}
  function topicLabels(ids=state.settings.topics){return ids.map(id=>G.TOPICS[id]?.label||id).join(' · ');}
  function difficultyLabel(){return state.settings.difficulty[0].toUpperCase()+state.settings.difficulty.slice(1);}
  function refreshPack(reseed=false){if(reseed)state.seed=newSeed();state.settings=G.normalizeSettings(state.settings);state.pack=G.generatePack(state.settings,state.seed,state.customVocabulary);save();}
  function builtInCount(topic){return G.VOCABULARY.filter(x=>x.topic===topic).length;}
  function mineCount(topic){return state.customVocabulary.filter(x=>x.topic===topic).length;}
  function topicAvailable(id){const ys=G.TOPICS[id].years||[];return ys.some(y=>y>=state.settings.minYear&&y<=state.settings.maxYear);}

  function render(){
    const s=state.settings,eligible=G.compatibleEngines(s);
    if(s.gameMode==='single'&&!eligible.includes(s.gameId)){s.gameId='wordsearch';refreshPack(false);}
    root.classList.toggle('include-answers',s.includeAnswers);
    root.classList.toggle('preview-answers',state.previewAnswers);
    root.innerHTML=`
      <div class="tt99-games-shell">
        <section class="tt99-games-hero">
          <div>
            <span class="tt99-eyebrow">Tech Tinker Club · 99 Club Studio</span>
            <h1>Maths Games &amp; Puzzles</h1>
            <p>Printable independent practice: choose the maths first, then let reusable game engines turn it into pupil-ready activities.</p>
          </div>
          <nav class="tt99-games-nav" aria-label="99 Club Studio sections">
            <a href="/tools/99-club/">99 Club</a>
            <a href="/tools/99-club/custom/">Custom Worksheets</a>
          </nav>
        </section>
        <div class="tt99-games-principle"><strong>Private by design.</strong><span>Your own vocabulary stays in this browser unless you explicitly export it. Nothing you add is published to the shared site.</span></div>
        <div class="tt99-games-workspace">
          <aside class="tt99-games-controls">
            ${renderSettings()}
            ${renderVocabularyManager()}
          </aside>
          <main class="tt99-games-preview">
            ${renderPreviewToolbar()}
            <div class="tt99-games-preview-stack tt99-games-pupil-pages">${renderPages(false)}</div>
            <div class="tt99-games-preview-stack tt99-games-answer-pages">${renderPages(true)}</div>
          </main>
        </div>
      </div>`;
    bind();
  }

  function renderSettings(){
    const s=state.settings,eligible=G.compatibleEngines(s);
    const topics=Object.entries(G.TOPICS).map(([id,m])=>{const selected=s.topics.includes(id),available=topicAvailable(id);return `<label class="tt99-game-topic ${selected?'is-selected':''} ${available?'':'is-unavailable'}" title="${available?'':'Outside the selected year range'}"><input type="checkbox" data-topic="${id}" ${selected?'checked':''} ${available?'':'disabled'}><span>${esc(m.label)}<small>${builtInCount(id)} built-in${mineCount(id)?` · ${mineCount(id)} mine`:''}</small></span></label>`;}).join('');
    const engines=Object.values(G.ENGINES).map(e=>`<option value="${e.id}" ${s.gameId===e.id?'selected':''} ${eligible.includes(e.id)?'':'disabled'}>${esc(e.title)}${eligible.includes(e.id)?'':' — not suited to selected topic'}</option>`).join('');
    return `<section class="tt99-games-card">
      <div class="tt99-games-step"><span>1</span><div><h2>Choose the maths</h2><p>Year range and topic control the content provider. Difficulty controls both the maths and the puzzle presentation.</p></div></div>
      <div class="tt99-games-grid2">
        <label class="tt99-field"><span>From year</span><select id="games-min-year">${[1,2,3,4,5,6].map(y=>`<option value="${y}" ${s.minYear===y?'selected':''}>Year ${y}</option>`).join('')}</select></label>
        <label class="tt99-field"><span>To year</span><select id="games-max-year">${[1,2,3,4,5,6].map(y=>`<option value="${y}" ${s.maxYear===y?'selected':''}>Year ${y}</option>`).join('')}</select></label>
      </div>
      <span class="tt99-field-label tt99-games-topic-label">Topics</span>
      <div class="tt99-games-topic-grid">${topics}</div>
      <div class="tt99-games-grid3 tt99-games-difficulty">
        ${['easy','standard','challenge'].map(d=>`<button type="button" data-difficulty="${d}" class="${s.difficulty===d?'is-selected':''}"><b>${d[0].toUpperCase()+d.slice(1)}</b><small>${d==='easy'?'More clues · smaller values':d==='challenge'?'Fewer clues · deeper reasoning':'Balanced classroom practice'}</small></button>`).join('')}
      </div>
      <div class="tt99-games-divider"></div>
      <div class="tt99-games-step"><span>2</span><div><h2>Build the pack</h2><p>Repeat one game or mix suitable engines. You can put more than one activity on each printable sheet.</p></div></div>
      <div class="tt99-games-choice-row">
        <label><input type="radio" name="game-mode" value="mixed" ${s.gameMode==='mixed'?'checked':''}><span><b>Mixed suitable games</b><small>The app chooses from engines that fit your topics.</small></span></label>
        <label><input type="radio" name="game-mode" value="single" ${s.gameMode==='single'?'checked':''}><span><b>Same game type</b><small>Repeat the selected engine across the pack.</small></span></label>
      </div>
      <label class="tt99-field tt99-games-engine-select"><span>Game type</span><select id="games-engine" ${s.gameMode==='mixed'?'disabled':''}>${engines}</select><small>${eligible.length?`Suitable now: ${eligible.map(id=>G.ENGINES[id].title).join(', ')}`:'Choose another topic.'}</small></label>
      <div class="tt99-games-grid3">
        <label class="tt99-field"><span>Sheets</span><select id="games-sheets">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${s.sheets===n?'selected':''}>${n}</option>`).join('')}</select></label>
        <label class="tt99-field"><span>Activities / sheet</span><select id="games-activities">${[1,2,3].map(n=>`<option value="${n}" ${s.activitiesPerSheet===n?'selected':''}>${n}</option>`).join('')}</select></label>
        <label class="tt99-field"><span>Word-search clues</span><select id="games-word-mode"><option value="auto" ${s.wordSearchMode==='auto'?'selected':''}>Auto by difficulty</option><option value="words" ${s.wordSearchMode==='words'?'selected':''}>Show words</option><option value="definitions" ${s.wordSearchMode==='definitions'?'selected':''}>Definitions only</option></select></label>
      </div>
      <label class="tt99-check tt99-games-answer-check"><input type="checkbox" id="games-answers" ${s.includeAnswers?'checked':''}><span>Include teacher answer pages when printing</span></label>
      <div class="tt99-games-actions"><button type="button" class="tt99-primary" id="games-new-version">Generate new version</button><button type="button" class="tt99-secondary" id="games-print">Print / Save PDF</button></div>
      <div class="tt99-status">${esc(state.status)}</div>
    </section>`;
  }

  function renderVocabularyManager(){
    const mine=state.customVocabulary;
    const byTopic=Object.entries(G.TOPICS).map(([id,m])=>{const entries=mine.filter(x=>x.topic===id);return `<details class="tt99-vocab-topic" ${entries.length?'open':''}><summary><span>${esc(m.label)}</span><small>${builtInCount(id)} built-in · ${entries.length} mine</small></summary>${entries.length?`<div class="tt99-vocab-mine-list">${entries.map((x,i)=>`<div><span><b>${esc(x.term)}</b><small>${esc(x.definition)} · Y${x.minYear}${x.maxYear!==x.minYear?`–${x.maxYear}`:''}</small></span><button type="button" data-delete-vocab="${mine.indexOf(x)}" aria-label="Delete ${esc(x.term)}">×</button></div>`).join('')}</div>`:`<p class="tt99-vocab-empty">No personal entries for this topic.</p>`}</details>`;}).join('');
    return `<section class="tt99-games-card tt99-vocab-card">
      <div class="tt99-games-step"><span>3</span><div><h2>Vocabulary library</h2><p>Built-in terms are curated with the site. <strong>My vocabulary</strong> is yours only and never changes the public catalogue.</p></div></div>
      <details class="tt99-vocab-add"><summary>Add my term + definition</summary><div class="tt99-vocab-add-body">
        <label class="tt99-field"><span>Topic</span><select id="vocab-topic">${Object.entries(G.TOPICS).map(([id,m])=>`<option value="${id}">${esc(m.label)}</option>`).join('')}</select></label>
        <label class="tt99-field"><span>Term</span><input id="vocab-term" maxlength="36" placeholder="e.g. denominator"></label>
        <label class="tt99-field wide"><span>Definition</span><textarea id="vocab-definition" maxlength="220" placeholder="e.g. The number below the fraction line."></textarea></label>
        <div class="tt99-games-grid2"><label class="tt99-field"><span>From year</span><select id="vocab-min-year">${[1,2,3,4,5,6].map(y=>`<option value="${y}" ${y===3?'selected':''}>Y${y}</option>`).join('')}</select></label><label class="tt99-field"><span>To year</span><select id="vocab-max-year">${[1,2,3,4,5,6].map(y=>`<option value="${y}" ${y===6?'selected':''}>Y${y}</option>`).join('')}</select></label></div>
        <button type="button" class="tt99-secondary" id="vocab-add">Add to My vocabulary</button>
      </div></details>
      <div class="tt99-vocab-summary">${byTopic}</div>
      <div class="tt99-vocab-portability"><button type="button" class="tt99-secondary" id="vocab-export">Export my vocabulary</button><label class="tt99-secondary tt99-vocab-import">Import vocabulary file<input type="file" id="vocab-import" accept="application/json,.json"></label><button type="button" class="tt99-ghost" id="vocab-clear" ${mine.length?'':'disabled'}>Clear my vocabulary</button></div>
      <small class="tt99-games-help">Portable files contain only your personal entries in a simple JSON format. Importing merges them with anything already stored on this browser.</small>
    </section>`;
  }

  function renderPreviewToolbar(){
    return `<div class="tt99-games-preview-toolbar"><div><strong>${esc(yearRangeLabel())}</strong><span>${esc(topicLabels())} · ${esc(difficultyLabel())} · ${state.settings.sheets} sheet${state.settings.sheets===1?'':'s'}</span></div><div class="tt99-games-preview-toggle"><button type="button" data-preview="pupil" class="${state.previewAnswers?'':'is-active'}">Pupil</button><button type="button" data-preview="answers" class="${state.previewAnswers?'is-active':''}">Answers</button></div></div>`;
  }

  function renderPages(answers){
    return state.pack.sheets.map(sheet=>`<article class="tt99-game-paper ${answers?'is-answer':''}">
      <header><div><span>99 Club Studio · Maths Games &amp; Puzzles</span><h2>${answers?'Teacher answers':'Pupil sheet'} ${sheet.index}</h2><p>${esc(yearRangeLabel())} · ${esc(topicLabels())} · ${esc(difficultyLabel())}</p></div><div class="tt99-game-name-line">${answers?'Answer key':'Name: __________________________'}</div></header>
      <div class="tt99-game-activities count-${sheet.activities.length}">${sheet.activities.map((a,i)=>renderActivity(a,answers,i+1)).join('')}</div>
      <footer><span>Generated locally · ${esc(state.seed)}</span><span>techtinker.club/tools/99-club/games/</span></footer>
    </article>`).join('');
  }

  function renderActivity(a,answers,index){
    if(a.error)return `<section class="tt99-game-activity tt99-game-error"><h3>${index}. ${esc(a.title||'Activity')}</h3><p>${esc(a.error)}</p></section>`;
    if(a.engineId==='pyramid')return renderPyramid(a,answers,index);
    return renderWordSearch(a,answers,index);
  }
  function renderWordSearch(a,answers,index){
    const answerCells=new Set((a.placements||[]).flatMap(p=>p.cells.map(([x,y])=>`${x}:${y}`)));
    const grid=`<div class="tt99-word-grid size-${a.size}" style="--grid-size:${a.size}">${a.grid.flatMap((row,y)=>row.map((c,x)=>`<span class="${answers&&answerCells.has(`${x}:${y}`)?'hit':''}">${c}</span>`)).join('')}</div>`;
    const clues=a.mode==='definitions'?`<ol class="tt99-word-clues">${a.placements.map(p=>`<li>${esc(p.definition)}</li>`).join('')}</ol>`:`<div class="tt99-word-bank">${a.placements.map(p=>`<span>${esc(p.term)}</span>`).join('')}</div>`;
    const answersList=answers?`<div class="tt99-word-answer-list"><strong>Words:</strong> ${a.placements.map(p=>esc(p.term)).join(' · ')}</div>`:'';
    return `<section class="tt99-game-activity tt99-wordsearch"><div class="tt99-game-activity-head"><div><span>Activity ${index}</span><h3>Maths Word Search</h3></div><small>${a.mode==='definitions'?'Definition clues':'Word bank'}</small></div><p class="tt99-game-instruction">${a.mode==='definitions'?'Work out each maths word from its definition, then find it in the grid.':'Find all the maths words hidden in the grid.'}</p><div class="tt99-word-layout">${grid}<div class="tt99-word-side">${clues}${answersList}</div></div></section>`;
  }
  function renderPyramid(a,answers,index){
    const missing=new Set(a.missingSet||[]),rows=a.rows.map((row,r)=>`<div class="tt99-pyramid-row" style="--cells:${row.length}">${row.map((n,c)=>{const blank=missing.has(`${r}:${c}`)&&!answers;return `<span class="${blank?'blank':''}">${blank?'':n}</span>`;}).join('')}</div>`).join('');
    return `<section class="tt99-game-activity tt99-pyramid"><div class="tt99-game-activity-head"><div><span>Activity ${index}</span><h3>Number Pyramid</h3></div><small>${esc(a.difficulty)}</small></div><p class="tt99-game-instruction">${esc(a.instruction)} Fill every empty brick.</p><div class="tt99-pyramid-wrap">${rows}</div>${answers?'<p class="tt99-pyramid-answer-note">Completed pyramid shown above.</p>':''}</section>`;
  }

  function bind(){
    const regen=(msg,reseed=false)=>{refreshPack(reseed);state.status=msg;render();};
    root.querySelector('#games-min-year')?.addEventListener('change',e=>{state.settings.minYear=Number(e.target.value);if(state.settings.maxYear<state.settings.minYear)state.settings.maxYear=state.settings.minYear;pruneTopics();regen('Year range updated.');});
    root.querySelector('#games-max-year')?.addEventListener('change',e=>{state.settings.maxYear=Number(e.target.value);if(state.settings.minYear>state.settings.maxYear)state.settings.minYear=state.settings.maxYear;pruneTopics();regen('Year range updated.');});
    root.querySelectorAll('[data-topic]').forEach(el=>el.addEventListener('change',()=>{const ids=[...root.querySelectorAll('[data-topic]:checked')].map(x=>x.dataset.topic);state.settings.topics=ids.length?ids:[el.dataset.topic];regen(ids.length?'Topic selection updated.':'At least one topic is kept selected.');}));
    root.querySelectorAll('[data-difficulty]').forEach(btn=>btn.addEventListener('click',()=>{state.settings.difficulty=btn.dataset.difficulty;regen('Difficulty updated.');}));
    root.querySelectorAll('input[name="game-mode"]').forEach(el=>el.addEventListener('change',()=>{state.settings.gameMode=el.value;regen(state.settings.gameMode==='mixed'?'The pack will mix suitable game engines.':'The pack will repeat one selected game type.');}));
    root.querySelector('#games-engine')?.addEventListener('change',e=>{state.settings.gameId=e.target.value;regen(`Using ${G.ENGINES[state.settings.gameId].title}.`);});
    root.querySelector('#games-sheets')?.addEventListener('change',e=>{state.settings.sheets=Number(e.target.value);regen('Sheet count updated.');});
    root.querySelector('#games-activities')?.addEventListener('change',e=>{state.settings.activitiesPerSheet=Number(e.target.value);regen('Activities per sheet updated.');});
    root.querySelector('#games-word-mode')?.addEventListener('change',e=>{state.settings.wordSearchMode=e.target.value;regen('Word-search clue mode updated.');});
    root.querySelector('#games-answers')?.addEventListener('change',e=>{state.settings.includeAnswers=e.target.checked;save();render();});
    root.querySelector('#games-new-version')?.addEventListener('click',()=>regen('Fresh puzzle version generated with the same teaching settings.',true));
    root.querySelector('#games-print')?.addEventListener('click',()=>window.print());
    root.querySelectorAll('[data-preview]').forEach(btn=>btn.addEventListener('click',()=>{state.previewAnswers=btn.dataset.preview==='answers';render();}));
    root.querySelector('#vocab-add')?.addEventListener('click',addVocabulary);
    root.querySelectorAll('[data-delete-vocab]').forEach(btn=>btn.addEventListener('click',()=>{const i=Number(btn.dataset.deleteVocab);state.customVocabulary.splice(i,1);refreshPack(false);state.status='Personal vocabulary entry removed from this browser.';render();}));
    root.querySelector('#vocab-export')?.addEventListener('click',exportVocabulary);
    root.querySelector('#vocab-import')?.addEventListener('change',importVocabulary);
    root.querySelector('#vocab-clear')?.addEventListener('click',()=>{if(!state.customVocabulary.length)return;if(confirm('Clear all My vocabulary entries stored in this browser?')){state.customVocabulary=[];refreshPack(false);state.status='My vocabulary cleared. Built-in vocabulary was not changed.';render();}});
  }
  function pruneTopics(){const kept=state.settings.topics.filter(topicAvailable);state.settings.topics=kept.length?kept:[Object.keys(G.TOPICS).find(topicAvailable)||'calculation'];}
  function addVocabulary(){
    const topic=root.querySelector('#vocab-topic')?.value,term=root.querySelector('#vocab-term')?.value||'',definition=root.querySelector('#vocab-definition')?.value||'',minYear=Number(root.querySelector('#vocab-min-year')?.value)||1,maxYear=Number(root.querySelector('#vocab-max-year')?.value)||6;
    const clean=G.sanitizeCustomVocabulary([{topic,term,definition,minYear,maxYear:Math.max(minYear,maxYear)}]);
    if(!clean.length){state.status='Add a term and definition. Word-search terms need at least two letters and no more than 20 letters after spaces/punctuation are removed.';render();return;}
    const merged=G.sanitizeCustomVocabulary([...state.customVocabulary,...clean]);
    if(merged.length===state.customVocabulary.length){state.status='That personal term already exists in this topic.';render();return;}
    state.customVocabulary=merged;refreshPack(false);state.status=`Added “${clean[0].term}” to My vocabulary on this browser.`;render();
  }
  function exportVocabulary(){
    const payload={kind:'tt99-vocabulary',version:1,exportedAt:new Date().toISOString(),entries:state.customVocabulary};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='99club-my-vocabulary.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);state.status=`Exported ${state.customVocabulary.length} personal vocabulary entr${state.customVocabulary.length===1?'y':'ies'}.`;render();
  }
  async function importVocabulary(e){
    const file=e.target.files?.[0];if(!file)return;
    try{const parsed=JSON.parse(await file.text()),entries=Array.isArray(parsed)?parsed:parsed.entries;if(!Array.isArray(entries))throw new Error('format');const clean=G.sanitizeCustomVocabulary(entries);state.customVocabulary=G.sanitizeCustomVocabulary([...state.customVocabulary,...clean]);refreshPack(false);state.status=`Imported ${clean.length} valid personal vocabulary entr${clean.length===1?'y':'ies'} locally.`;render();}catch(err){state.status='That file is not a valid 99 Club vocabulary JSON file.';render();}
  }

  render();
})();
