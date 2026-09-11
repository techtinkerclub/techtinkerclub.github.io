/* 99 Club Studio · Maths Games & Puzzles UI v1.1.0 */
(function(){
  'use strict';
  const G=window.TT99Games,root=document.getElementById('tt99-games-root');
  if(!G||!root)return;

  const SETTINGS_KEY='tt99-games-settings-v2',LEGACY_SETTINGS_KEY='tt99-games-settings-v1',VOCAB_KEY='tt99-games-vocab-v1';
  const DEFAULTS={
    minYear:3,maxYear:4,topics:['calculation'],sheets:1,activitiesPerSheet:2,includeAnswers:true,
    selectedEngines:['wordsearch','pyramid'],
    engineSettings:{
      wordsearch:{difficulty:'standard',clueMode:'words_definitions',wordCount:'auto',gridSize:'auto'},
      pyramid:{difficulty:'standard',levels:'auto',clueLevel:'balanced'}
    }
  };
  const state={
    settings:loadSettings(),customVocabulary:loadVocabulary(),seed:newSeed(),previewAnswers:false,
    activeEngine:'wordsearch',
    status:'Choose the maths, include the games you want, then configure each game separately.'
  };
  state.pack=G.generatePack(state.settings,state.seed,state.customVocabulary);

  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function cap(s){return String(s||'').charAt(0).toUpperCase()+String(s||'').slice(1);}
  function loadSettings(){
    try{
      const current=localStorage.getItem(SETTINGS_KEY),legacy=localStorage.getItem(LEGACY_SETTINGS_KEY);
      return G.normalizeSettings({...DEFAULTS,...JSON.parse(current||legacy||'{}')});
    }catch(e){return G.normalizeSettings(DEFAULTS);}
  }
  function loadVocabulary(){try{return G.sanitizeCustomVocabulary(JSON.parse(localStorage.getItem(VOCAB_KEY)||'[]'));}catch(e){return [];}}
  function save(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(state.settings));localStorage.setItem(VOCAB_KEY,JSON.stringify(state.customVocabulary));}catch(e){}}
  function newSeed(){const a=new Uint32Array(2);if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(a);else{a[0]=Date.now();a[1]=Math.floor(Math.random()*2**32);}return `G-${a[0].toString(36)}${a[1].toString(36)}`;}
  function yearRangeLabel(){const s=state.settings;return s.minYear===s.maxYear?`Year ${s.minYear}`:`Years ${s.minYear}–${s.maxYear}`;}
  function topicLabels(ids=state.settings.topics){return ids.map(id=>G.TOPICS[id]?.label||id).join(' · ');}
  function refreshPack(reseed=false){if(reseed)state.seed=newSeed();state.settings=G.normalizeSettings(state.settings);state.pack=G.generatePack(state.settings,state.seed,state.customVocabulary);save();}
  function builtInCount(topic){return G.VOCABULARY.filter(x=>x.topic===topic).length;}
  function mineCount(topic){return state.customVocabulary.filter(x=>x.topic===topic).length;}
  function topicAvailable(id){const ys=G.TOPICS[id].years||[];return ys.some(y=>y>=state.settings.minYear&&y<=state.settings.maxYear);}
  function compatibleSet(){return new Set(G.compatibleEngines(state.settings));}
  function selectedCompatible(){return G.selectedCompatibleEngines(state.settings);}
  function engineSettings(id){return state.settings.engineSettings[id]||G.ENGINES[id].defaultSettings||{};}

  function render(){
    const eligible=compatibleSet();
    // Keep at least one currently compatible game included.
    if(!state.settings.selectedEngines.some(id=>eligible.has(id))){
      const first=[...eligible][0]||'wordsearch';
      state.settings.selectedEngines=[first];
      state.activeEngine=first;
      refreshPack(false);
    }
    if(state.activeEngine && !eligible.has(state.activeEngine))state.activeEngine=selectedCompatible()[0]||[...eligible][0]||'wordsearch';

    root.classList.toggle('include-answers',state.settings.includeAnswers);
    root.classList.toggle('preview-answers',state.previewAnswers);
    root.innerHTML=`
      <div class="tt99-games-shell">
        <section class="tt99-games-hero">
          <div>
            <span class="tt99-eyebrow">Tech Tinker Club · 99 Club Studio</span>
            <h1>Maths Games &amp; Puzzles</h1>
            <p>Choose the maths, then build a pack from reusable puzzle engines. Each game keeps its own difficulty and options, so the page stays manageable as the library grows.</p>
          </div>
          <nav class="tt99-games-nav" aria-label="99 Club Studio sections">
            <a href="/tools/99-club/">99 Club</a>
            <a href="/tools/99-club/custom/">Custom Worksheets</a>
          </nav>
        </section>
        <div class="tt99-games-principle"><strong>Private by design.</strong><span>Your own vocabulary stays in this browser unless you explicitly export it. Nothing you add is published to the shared site.</span></div>
        <div class="tt99-games-workspace">
          <aside class="tt99-games-controls">
            ${renderMathsCard()}
            ${renderGamesCard()}
            ${renderPackCard()}
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

  function renderMathsCard(){
    const s=state.settings;
    const topics=Object.entries(G.TOPICS).map(([id,m])=>{
      const selected=s.topics.includes(id),available=topicAvailable(id);
      return `<label class="tt99-game-topic ${selected?'is-selected':''} ${available?'':'is-unavailable'}" title="${available?'':'Outside the selected year range'}">
        <input type="checkbox" data-topic="${id}" ${selected?'checked':''} ${available?'':'disabled'}>
        <span>${esc(m.label)}<small>${builtInCount(id)} built-in${mineCount(id)?` · ${mineCount(id)} mine`:''}</small></span>
      </label>`;
    }).join('');
    return `<section class="tt99-games-card">
      <div class="tt99-games-step"><span>1</span><div><h2>Choose the maths</h2><p>These are pack-level choices. Game difficulty is configured separately for each puzzle type.</p></div></div>
      <div class="tt99-games-grid2">
        <label class="tt99-field"><span>From year</span><select id="games-min-year">${[1,2,3,4,5,6].map(y=>`<option value="${y}" ${s.minYear===y?'selected':''}>Year ${y}</option>`).join('')}</select></label>
        <label class="tt99-field"><span>To year</span><select id="games-max-year">${[1,2,3,4,5,6].map(y=>`<option value="${y}" ${s.maxYear===y?'selected':''}>Year ${y}</option>`).join('')}</select></label>
      </div>
      <span class="tt99-field-label tt99-games-topic-label">Topics</span>
      <div class="tt99-games-topic-grid">${topics}</div>
    </section>`;
  }

  function renderGamesCard(){
    const eligible=compatibleSet(),selected=new Set(state.settings.selectedEngines);
    const cards=Object.values(G.ENGINES).map(e=>{
      const isEligible=eligible.has(e.id),isSelected=selected.has(e.id)&&isEligible,active=state.activeEngine===e.id;
      return `<article class="tt99-engine-card ${isSelected?'is-selected':''} ${active?'is-active':''} ${isEligible?'':'is-incompatible'}">
        <label class="tt99-engine-include">
          <input type="checkbox" data-engine-select="${e.id}" ${isSelected?'checked':''} ${isEligible?'':'disabled'}>
          <span class="tt99-engine-check"></span>
          <span><b>${esc(e.title)}</b><small>${esc(e.group||'Game')}</small></span>
        </label>
        <div class="tt99-engine-summary">${renderEngineSummary(e.id)}</div>
        <button type="button" class="tt99-engine-configure" data-configure-engine="${e.id}" ${isEligible?'':'disabled'}>${active?'Hide setup':'Configure'}</button>
        ${!isEligible?`<p class="tt99-engine-compatibility">Not a good fit for the selected topic${state.settings.topics.length>1?'s':''}.</p>`:''}
      </article>`;
    }).join('');
    return `<section class="tt99-games-card">
      <div class="tt99-games-step"><span>2</span><div><h2>Choose &amp; configure games</h2><p>Tick one game to repeat it, or tick several to mix them. Only one setup panel opens at a time.</p></div></div>
      <div class="tt99-engine-library">${cards}</div>
      ${renderEngineConfiguration()}
      <p class="tt99-games-help">As more games are added they stay as compact cards here; their specialist options live only inside their own setup panel.</p>
    </section>`;
  }

  function renderEngineSummary(id){
    const o=engineSettings(id);
    if(id==='wordsearch'){
      const clue=o.clueMode==='definitions'?'Definitions only':'Words + definitions';
      const terms=o.wordCount==='auto'?'Auto terms':`${o.wordCount} terms`;
      const grid=o.gridSize==='auto'?'Auto grid':`${o.gridSize}×${o.gridSize}`;
      return `<span>${cap(o.difficulty)}</span><span>${clue}</span><span>${terms}</span><span>${grid}</span>`;
    }
    if(id==='pyramid'){
      const levels=o.levels==='auto'?'Auto levels':`${o.levels} levels`;
      const clues=o.clueLevel==='more'?'More clues':o.clueLevel==='fewer'?'Fewer clues':'Balanced clues';
      return `<span>${cap(o.difficulty)}</span><span>${levels}</span><span>${clues}</span>`;
    }
    return '';
  }

  function difficultyChoices(id,current){
    const descriptions={
      wordsearch:{easy:'Simpler directions',standard:'More directions',challenge:'All 8 directions'},
      pyramid:{easy:'Smaller numbers',standard:'Balanced numbers',challenge:'Larger/deeper puzzle'}
    };
    return `<div class="tt99-engine-choice3">${['easy','standard','challenge'].map(d=>`<button type="button" data-engine-difficulty="${id}:${d}" class="${current===d?'is-selected':''}"><b>${cap(d)}</b><small>${descriptions[id]?.[d]||''}</small></button>`).join('')}</div>`;
  }

  function renderEngineConfiguration(){
    const id=state.activeEngine,e=G.ENGINES[id],o=engineSettings(id);
    if(!e||!compatibleSet().has(id))return '';
    if(id==='wordsearch'){
      return `<div class="tt99-engine-panel">
        <div class="tt99-engine-panel-head"><div><small>${esc(e.group)}</small><h3>${esc(e.title)} setup</h3></div><button type="button" data-close-engine>×</button></div>
        <label class="tt99-field-label">Difficulty</label>
        ${difficultyChoices(id,o.difficulty)}
        <div class="tt99-engine-panel-grid">
          <label class="tt99-field"><span>Clue style</span><select data-engine-option="wordsearch:clueMode">
            <option value="words_definitions" ${o.clueMode==='words_definitions'?'selected':''}>Words + definitions</option>
            <option value="definitions" ${o.clueMode==='definitions'?'selected':''}>Definitions only</option>
          </select><small>${o.clueMode==='definitions'?'Pupils work out each term before finding it.':'Pupils see each term together with its mathematical meaning.'}</small></label>
          <label class="tt99-field"><span>Number of terms</span><select data-engine-option="wordsearch:wordCount">${['auto','6','8','10','12'].map(v=>`<option value="${v}" ${o.wordCount===v?'selected':''}>${v==='auto'?'Auto for difficulty':v}</option>`).join('')}</select></label>
          <label class="tt99-field"><span>Grid size</span><select data-engine-option="wordsearch:gridSize">${['auto','12','14','16'].map(v=>`<option value="${v}" ${o.gridSize===v?'selected':''}>${v==='auto'?'Auto for difficulty':`${v} × ${v}`}</option>`).join('')}</select></label>
        </div>
      </div>`;
    }
    if(id==='pyramid'){
      return `<div class="tt99-engine-panel">
        <div class="tt99-engine-panel-head"><div><small>${esc(e.group)}</small><h3>${esc(e.title)} setup</h3></div><button type="button" data-close-engine>×</button></div>
        <label class="tt99-field-label">Difficulty</label>
        ${difficultyChoices(id,o.difficulty)}
        <div class="tt99-engine-panel-grid">
          <label class="tt99-field"><span>Pyramid levels</span><select data-engine-option="pyramid:levels">${['auto','3','4','5'].map(v=>`<option value="${v}" ${o.levels===v?'selected':''}>${v==='auto'?'Auto for year/difficulty':v}</option>`).join('')}</select></label>
          <label class="tt99-field"><span>How many clues?</span><select data-engine-option="pyramid:clueLevel">
            <option value="more" ${o.clueLevel==='more'?'selected':''}>More clues</option>
            <option value="balanced" ${o.clueLevel==='balanced'?'selected':''}>Balanced</option>
            <option value="fewer" ${o.clueLevel==='fewer'?'selected':''}>Fewer clues</option>
          </select></label>
        </div>
      </div>`;
    }
    return '';
  }

  function renderPackCard(){
    const s=state.settings,selected=selectedCompatible();
    return `<section class="tt99-games-card">
      <div class="tt99-games-step"><span>3</span><div><h2>Build the pack</h2><p>${selected.length===1?`Every activity will use ${esc(G.ENGINES[selected[0]].title)}.`:`Activities will rotate through ${selected.map(id=>esc(G.ENGINES[id].title)).join(' and ')}.`}</p></div></div>
      <div class="tt99-games-grid2">
        <label class="tt99-field"><span>Sheets</span><select id="games-sheets">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${s.sheets===n?'selected':''}>${n}</option>`).join('')}</select></label>
        <label class="tt99-field"><span>Activities / sheet</span><select id="games-activities">${[1,2,3].map(n=>`<option value="${n}" ${s.activitiesPerSheet===n?'selected':''}>${n}</option>`).join('')}</select></label>
      </div>
      <label class="tt99-check tt99-games-answer-check"><input type="checkbox" id="games-answers" ${s.includeAnswers?'checked':''}><span>Include teacher answer pages when printing</span></label>
      <div class="tt99-games-actions"><button type="button" class="tt99-primary" id="games-new-version">Generate new version</button><button type="button" class="tt99-secondary" id="games-print">Print / Save PDF</button></div>
      <div class="tt99-status">${esc(state.status)}</div>
    </section>`;
  }

  function renderVocabularyManager(){
    const mine=state.customVocabulary;
    const byTopic=Object.entries(G.TOPICS).map(([id,m])=>{
      const entries=mine.filter(x=>x.topic===id);
      return `<details class="tt99-vocab-topic" ${entries.length?'open':''}><summary><span>${esc(m.label)}</span><small>${builtInCount(id)} built-in · ${entries.length} mine</small></summary>${entries.length?`<div class="tt99-vocab-mine-list">${entries.map(x=>`<div><span><b>${esc(x.term)}</b><small>${esc(x.definition)} · Y${x.minYear}${x.maxYear!==x.minYear?`–${x.maxYear}`:''}</small></span><button type="button" data-delete-vocab="${mine.indexOf(x)}" aria-label="Delete ${esc(x.term)}">×</button></div>`).join('')}</div>`:`<p class="tt99-vocab-empty">No personal entries for this topic.</p>`}</details>`;
    }).join('');
    return `<section class="tt99-games-card tt99-vocab-card">
      <div class="tt99-games-step"><span>4</span><div><h2>Vocabulary library</h2><p>Built-in terms are curated with the site. <strong>My vocabulary</strong> is yours only and never changes the public catalogue.</p></div></div>
      <details class="tt99-vocab-add"><summary>Add my term + definition</summary><div class="tt99-vocab-add-body">
        <label class="tt99-field"><span>Topic</span><select id="vocab-topic">${Object.entries(G.TOPICS).map(([id,m])=>`<option value="${id}">${esc(m.label)}</option>`).join('')}</select></label>
        <label class="tt99-field"><span>Term</span><input id="vocab-term" type="text" maxlength="40" placeholder="e.g. denominator"></label>
        <label class="tt99-field wide"><span>Definition</span><textarea id="vocab-definition" maxlength="240" placeholder="e.g. The number below the fraction line."></textarea></label>
        <label class="tt99-field"><span>From year</span><select id="vocab-min-year">${[1,2,3,4,5,6].map(y=>`<option value="${y}">Year ${y}</option>`).join('')}</select></label>
        <label class="tt99-field"><span>To year</span><select id="vocab-max-year">${[1,2,3,4,5,6].map(y=>`<option value="${y}" ${y===6?'selected':''}>Year ${y}</option>`).join('')}</select></label>
        <button type="button" class="tt99-secondary" id="vocab-add">Add to My vocabulary</button>
      </div></details>
      <div class="tt99-vocab-summary">${byTopic}</div>
      <div class="tt99-vocab-portability"><button type="button" class="tt99-secondary" id="vocab-export">Export my vocabulary</button><label class="tt99-secondary tt99-vocab-import">Import vocabulary file<input type="file" id="vocab-import" accept="application/json,.json"></label><button type="button" class="tt99-ghost" id="vocab-clear" ${mine.length?'':'disabled'}>Clear my vocabulary</button></div>
      <small class="tt99-games-help">Portable files contain only your personal entries. Importing merges them with anything already stored on this browser.</small>
    </section>`;
  }

  function renderPreviewToolbar(){
    const selected=selectedCompatible();
    return `<div class="tt99-games-preview-toolbar"><div><strong>${esc(yearRangeLabel())}</strong><span>${esc(topicLabels())} · ${selected.map(id=>esc(G.ENGINES[id].title)).join(' + ')} · ${state.settings.sheets} sheet${state.settings.sheets===1?'':'s'}</span></div><div class="tt99-games-preview-toggle"><button type="button" data-preview="pupil" class="${state.previewAnswers?'':'is-active'}">Pupil</button><button type="button" data-preview="answers" class="${state.previewAnswers?'is-active':''}">Answers</button></div></div>`;
  }

  function renderPages(answers){
    return state.pack.sheets.map(sheet=>`<article class="tt99-game-paper ${answers?'is-answer':''}">
      <header><div><span>99 Club Studio · Maths Games &amp; Puzzles</span><h2>${answers?'Teacher answers':'Pupil sheet'} ${sheet.index}</h2><p>${esc(yearRangeLabel())} · ${esc(topicLabels())}</p></div><div class="tt99-game-name-line">${answers?'Answer key':'Name: __________________________'}</div></header>
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
    let clues='';
    if(a.mode==='definitions'){
      clues=`<ol class="tt99-word-clues">${a.placements.map(p=>`<li>${esc(p.definition)}</li>`).join('')}</ol>`;
    }else{
      clues=`<div class="tt99-word-pairs">${a.placements.map(p=>`<div><b>${esc(p.term)}</b><span>${esc(p.definition)}</span></div>`).join('')}</div>`;
    }
    const answersList=answers?`<div class="tt99-word-answer-list"><strong>Hidden words:</strong> ${a.placements.map(p=>esc(p.term)).join(' · ')}</div>`:'';
    const label=a.mode==='definitions'?'Definitions only':'Words + definitions';
    const instruction=a.mode==='definitions'?'Work out each maths word from its definition, then find it in the grid.':'Read each maths word and its meaning, then find the word in the grid.';
    return `<section class="tt99-game-activity tt99-wordsearch"><div class="tt99-game-activity-head"><div><span>Activity ${index}</span><h3>Maths Word Search</h3></div><small>${esc(a.difficulty)} · ${label}</small></div><p class="tt99-game-instruction">${instruction}</p><div class="tt99-word-layout">${grid}<div class="tt99-word-side">${clues}${answersList}</div></div></section>`;
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

    root.querySelectorAll('[data-engine-select]').forEach(el=>el.addEventListener('change',()=>{
      const id=el.dataset.engineSelect,selected=new Set(state.settings.selectedEngines);
      if(el.checked)selected.add(id);else selected.delete(id);
      const eligible=compatibleSet();
      const valid=[...selected].filter(x=>eligible.has(x));
      if(!valid.length){el.checked=true;state.status='Keep at least one compatible game selected.';render();return;}
      state.settings.selectedEngines=valid;
      if(el.checked)state.activeEngine=id;
      regen(el.checked?`${G.ENGINES[id].title} added to this pack.`:`${G.ENGINES[id].title} removed from this pack.`);
    }));
    root.querySelectorAll('[data-configure-engine]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.configureEngine;state.activeEngine=state.activeEngine===id?'':id;render();}));
    root.querySelector('[data-close-engine]')?.addEventListener('click',()=>{state.activeEngine='';render();});
    root.querySelectorAll('[data-engine-difficulty]').forEach(btn=>btn.addEventListener('click',()=>{const [id,value]=btn.dataset.engineDifficulty.split(':');state.settings.engineSettings[id].difficulty=value;regen(`${G.ENGINES[id].title} difficulty updated.`);}));
    root.querySelectorAll('[data-engine-option]').forEach(el=>el.addEventListener('change',()=>{const [id,key]=el.dataset.engineOption.split(':');state.settings.engineSettings[id][key]=el.value;regen(`${G.ENGINES[id].title} setup updated.`);}));

    root.querySelector('#games-sheets')?.addEventListener('change',e=>{state.settings.sheets=Number(e.target.value);regen('Sheet count updated.');});
    root.querySelector('#games-activities')?.addEventListener('change',e=>{state.settings.activitiesPerSheet=Number(e.target.value);regen('Activities per sheet updated.');});
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
