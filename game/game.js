/* ===========================================================
   Tech Tinker Boss Battle — v1 Engine
   - Retro CRT visuals
   - Level select → Intro story → Battle
   - Multiple choice + drag-drop (MC used first to validate)
   - Readable answer buttons (fixes “can’t see answers”)
   - Single boss image per week; CSS simulates hit/dead
   =========================================================== */
(() => {
  // ----- Grab DOM elements -----
  const $ = s => document.querySelector(s);
  const byId = id => document.getElementById(id);

  const screenLevels  = byId('screen-levels');
  const screenIntro   = byId('screen-intro');
  const screenGame    = byId('screen-game');
  const screenResults = byId('screen-results');

  const stageEl   = byId('stage');
  const bossImg   = byId('bossSprite');
  const bossName  = byId('bossName');

  const qpanel    = byId('qpanel');
  const explainEl = byId('explain');
  const nextBtn   = byId('nextBtn');
  const navRow    = byId('navRow');

  const starsPill = byId('stars');
  const progressPill = byId('progress-pill');
  const heartsEl = byId('hearts');
  const hpFill   = byId('hp');
  const streakPill = byId('streak');
  const timerPill  = byId('timer');
  const hintLeftPill = byId('hintLeft');

  // Intro UI
  const introImg   = byId('introBossImg');
  const introTitle = byId('introTitle');
  const introTag   = byId('introTag');
  const introStory = byId('introStory');
  const introStart = byId('introStart');

  // Buttons
  byId('reset').onclick = reset;
  byId('quit').onclick = onQuit;
  byId('useHint').onclick = onUseHint;
  byId('back').onclick = () => { showLevels(); };
  byId('retry').onclick = () => { startLevel(G.id); };
  nextBtn.onclick = onNext;

  // ----- State & storage -----
  const DATA = window.TTC_DATA; // from questions.js
  if(!DATA || !DATA.weeks) {
    alert('questions.js missing or malformed (window.TTC_DATA.weeks)');
    return;
  }
  const SKEY = 'ttcBossBattleV3';
  const state = loadState();

  function loadState(){
    let s = { unlocked: ['1'], stars: 0, clears: {}, settings: { timer:true } };
    try {
      const raw = localStorage.getItem(SKEY);
      if(raw) Object.assign(s, JSON.parse(raw));
    } catch(e){}
    return s;
  }
  function save(){ localStorage.setItem(SKEY, JSON.stringify(state)); }
  function reset(){ localStorage.removeItem(SKEY); location.reload(); }

  // ----- Utility: arcade toasts -----
  function toast(msg){
    const t = byId('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), 1200);
  }

  // ----- Build Level Select -----
  function renderLevels(){
    screenLevels.innerHTML = '';
    const ids = Object.keys(DATA.weeks).sort((a,b)=>(+a)-(+b));
    const cleared = Object.keys(state.clears).length;
    starsPill.textContent = `⭐ ${state.stars}`;
    progressPill.textContent = `Progress: ${cleared}/${ids.length}`;

    ids.forEach(id => {
      const w = DATA.weeks[id];
      const locked = !state.unlocked.includes(id) && !w.forceUnlock;
      const totalQ = (w.questions||[]).length;
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${w.title || `Week ${id}`}</h3>
        <div class="small">${w.description || ''}</div>
        <div class="row">
          <span class="tag">${totalQ} Qs</span>
          ${state.clears[id] ? `<span class="tag">Cleared ✓</span>` : ``}
          ${locked ? `<span class="lock">🔒 Locked</span>` : `<span class="spacer"></span>`}
        </div>
        <div class="row">
          <button ${locked?'disabled class="ghost"':''} data-id="${id}">${state.clears[id]?'Replay':'Start'}</button>
        </div>`;
      screenLevels.appendChild(card);
    });

    screenLevels.querySelectorAll('button[data-id]').forEach(b=>{
      b.addEventListener('click', ()=>openIntro(b.dataset.id));
    });
  }

  // ----- Intro story then Start Battle -----
  function openIntro(id){
    const w = DATA.weeks[id];
    // Fill intro modal
    introImg.src = w.bossImage || `assets/w${id}b.png`;
    introTitle.textContent = w.title || `Week ${id}`;
    introTag.textContent = w.description || '';
    introStory.textContent = w.story || 'Face the weekly boss!';
    introStart.onclick = ()=> startLevel(id);

    // Show intro
    screenLevels.style.display = 'none';
    screenResults.style.display = 'none';
    screenGame.style.display = 'none';
    screenIntro.style.display = '';
  }

  // ----- Game runtime -----
  let G = null; // current run

  function startLevel(id){
    const w = DATA.weeks[id];
    const cfg = {
      hearts: 3,
      bonusOnPerfect: 2,
      bonusOnClear: 1,
      bossTint: w.bossTint || undefined,
    };
    const questions = (w.questions||[]).slice(); // shallow copy
    if(!questions.length){ alert('No questions in this week.'); showLevels(); return; }

    G = {
      id, w, cfg, questions,
      idx: 0,
      hp: questions.length,
      hpMax: questions.length,
      hearts: cfg.hearts,
      streak: 0,
      hintBank: state.stars,
      incorrect: [],
      runStart: Date.now(),
      perQStart: Date.now(),
      waitingNext: false
    };

    // Stage setup
    setBossAppearance(w);
    renderHUD();

    // Show game screen
    screenIntro.style.display = 'none';
    screenResults.style.display = 'none';
    screenGame.style.display = '';
    navRow.style.display = 'none';

    nextQuestion();
  }

  function setBossAppearance(week){
    const tint = week.bossTint;
    bossName.textContent = week.bossName || 'BOSS';
    bossImg.src = week.bossImage || `assets/w${G?.id||1}b.png`;
    stageEl.classList.remove('boss--hit','boss--dead');
    if(tint){
      document.documentElement.style.setProperty('--accent', tint);
    } else {
      document.documentElement.style.setProperty('--accent', '#7bd3ff');
    }
  }

  function renderHUD(){
    // hearts
    heartsEl.innerHTML = '';
    for(let i=0;i<G.cfg.hearts;i++){
      const s = document.createElement('span');
      if(i>=G.hearts) s.classList.add('off');
      heartsEl.appendChild(s);
    }
    // boss hp
    hpFill.style.width = `${(G.hp/G.hpMax)*100}%`;
    streakPill.textContent = `Streak: ${G.streak}`;
    hintLeftPill.textContent = `⭐ Hints: ${G.hintBank}`;
    timerPill.textContent = state.settings.timer
      ? `⏱️ ${Math.max(0, Math.floor((Date.now()-G.runStart)/1000))}s`
      : '⏱️ off';
  }
  setInterval(()=>{ if(screenGame.style.display!=='none' && state.settings.timer) renderHUD(); }, 500);

  function bossShowState(state){ // 'idle' | 'hit' | 'dead'
    if(state === 'hit'){
      stageEl.classList.add('boss--hit');
      bossImg.classList.remove('flash'); void bossImg.offsetWidth;
      bossImg.classList.add('flash');
      setTimeout(()=> stageEl.classList.remove('boss--hit'), 250);
    } else if(state === 'dead'){
      stageEl.classList.add('boss--dead');
    } else {
      stageEl.classList.remove('boss--hit','boss--dead');
    }
  }

  // ----- Questions -----
  function nextQuestion(){
    const q = G.questions[G.idx];
    G.current = q;
    explainEl.textContent = '';
    navRow.style.display = 'none';
    G.waitingNext = false;

    if(!q){ finishLevel(false); return; }

    // header
    let html = `
      <div class="row">
        <div class="tag">Q ${G.idx+1} / ${G.questions.length}</div>
        ${q.difficulty?`<div class="tag">${q.difficulty}</div>`:''}
      </div>
      <h2 style="margin:6px 0 6px">${q.question}</h2>
    `;
    if(q.code){ html += `<div class="qcode">${q.code}</div>`; }

    // MC type (focus for v1)
    if(q.type === 'multiple-choice'){
      html += `<div class="options" id="opts"></div>`;
      qpanel.innerHTML = html;
      const opts = byId('opts');
      q.options.forEach((opt, i)=>{
        const b = document.createElement('button');
        b.textContent = opt;
        b.onclick = ()=>answerMC(i);
        opts.appendChild(b);
      });
    }
    // Drag-drop (optional later; v1 shows MC best)
    else if(q.type === 'drag-drop'){
      html += `<div class="note">Drag-drop supported in v2. For now, keep weeks on multiple-choice to test the loop.</div>`;
      qpanel.innerHTML = html;
      // Fallback: treat as info card, auto-advance
      navRow.style.display = '';
      G.waitingNext = true;
    }
    renderHUD();
  }

  function answerMC(i){
    const q = G.current;
    const opts = byId('opts').children;
    // Disable all, reveal correct/incorrect with high-contrast outlines
    for(let k=0;k<opts.length;k++) opts[k].disabled = true;
    const correct = (i===q.correct);
    if(correct){
      opts[i].classList.add('good');
    } else {
      opts[i].classList.add('bad');
      if(typeof q.correct === 'number' && opts[q.correct]){
        opts[q.correct].classList.add('good');
      }
    }
    settleAnswer(correct, q.explanation || '', {chosen:i});
  }

  function settleAnswer(correct, explanation, meta={}){
    if(correct){
      G.streak++;
      // 1 damage per correct answer (simple v1)
      G.hp = Math.max(0, G.hp - 1);
      explainEl.innerHTML = `✅ <strong>Correct!</strong> ${explanation ? ('<br>'+explanation):''}`;
      bossShowState('hit');
      toast('Hit!');
    } else {
      G.incorrect.push({q:G.current, chosen:meta.chosen});
      G.streak = 0;
      G.hearts--;
      explainEl.innerHTML = `❌ <strong>Not quite.</strong> ${explanation ? ('<br>'+explanation):''}`;
      toast('Ouch! You lost a heart 💔');
    }
    renderHUD();

    // Show "Next" button so pupils can read the answer before moving on
    navRow.style.display = '';
    G.waitingNext = true;

    // End checks
    if(G.hearts<=0){ bossShowState('idle'); finishLevel(true); return; }
    if(G.hp<=0){ bossShowState('dead'); finishLevel(false); return; }
  }

  function onNext(){
    if(!G || !G.waitingNext) return;
    G.idx++;
    G.perQStart = Date.now();
    nextQuestion();
  }

  // ----- Results & unlocks -----
  function finishLevel(gameOver){
    screenGame.style.display='none';
    screenResults.style.display='';
    const title = byId('resTitle');
    const summary = byId('resSummary');
    const review = byId('reviewList'); review.innerHTML='';

    if(gameOver){
      title.textContent = 'Game Over';
      summary.textContent = `You reached question ${G.idx+1} of ${G.questions.length}. Try again!`;
    } else {
      title.textContent = 'Level Complete! 🎉';
      const perfect = G.incorrect.length===0 && G.hearts>0;
      const earned = perfect ? G.cfg.bonusOnPerfect : G.cfg.bonusOnClear;
      state.stars += earned;
      state.clears[G.id] = true;

      // unlock next
      const ids = Object.keys(DATA.weeks).sort((a,b)=>(+a)-(+b));
      const nextIdx = ids.indexOf(G.id)+1;
      if(ids[nextIdx] && !state.unlocked.includes(ids[nextIdx])){
        state.unlocked.push(ids[nextIdx]);
      }
      save();

      summary.innerHTML = `Boss defeated with <strong>${G.hearts}</strong> heart(s) left.<br>
                           You earned ⭐ <strong>${earned}</strong> ${perfect?'(perfect clear!)':''}`;
    }

    if(G.incorrect.length){
      G.incorrect.forEach(({q,chosen})=>{
        const li = document.createElement('li');
        if(q.type==='multiple-choice'){
          li.innerHTML = `<strong>Q:</strong> ${q.question}<br>
                          <span class="small">Your answer:</span> ${q.options?.[chosen] ?? '—'}<br>
                          <span class="small">Correct:</span> ${q.options?.[q.correct]}<br>
                          <span class="small">${q.explanation || ''}</span>`;
        } else {
          li.innerHTML = `<strong>Q:</strong> ${q.question}<br><span class="small">${q.explanation||''}</span>`;
        }
        review.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'Flawless! Nothing to review.';
      review.appendChild(li);
    }
  }

  // ----- Hints / Quit -----
  function onUseHint(){
    if(!G) return;
    const q = G.current;
    if(state.stars<=0){ toast('No ⭐ left. Earn stars by clearing levels.'); return; }
    if(!q || !q.hint){ toast('No hint for this one.'); return; }
    state.stars--; save();
    starsPill.textContent = `⭐ ${state.stars}`;
    explainEl.innerHTML = `<em>Hint:</em> ${q.hint}`;
  }

  function onQuit(){
    if(confirm('Quit this level? Progress for this run will be lost.')){
      showLevels();
    }
  }

  function showLevels(){
    screenIntro.style.display = 'none';
    screenResults.style.display = 'none';
    screenGame.style.display = 'none';
    screenLevels.style.display = '';
    renderLevels();
  }

  // ----- Boot -----
  renderLevels();
})();
