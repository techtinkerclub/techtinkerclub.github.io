/* ===========================================================
   Tech Tinker Boss Battle — game.js (Polished Full Build v3)
   - Level select → Intro → Battle → Results
   - MC & DragDrop questions (one-use tiles, swap before submit, lock after)
   - Hints: start 3 / 1 per question / +1 per 3 correct answers
   - Boss HP drains 1 per correct; labeled bar updates
   - Score: +100 per correct; end time bonus (baseline 12s/question)
   - Difficulty hidden intentionally
   - Single boss image; CSS handles hit/dead effects
   - Prominent callouts for hint/correct/incorrect + ✓/✗ badges on MC
   =========================================================== */

(() => {
  /* ---------- DOM helpers ---------- */
  const $   = (s) => document.querySelector(s);
  const byId = (id) => document.getElementById(id);

  /* Screens */
  const screenLevels  = byId('screen-levels');
  const screenIntro   = byId('screen-intro');
  const screenGame    = byId('screen-game');
  const screenResults = byId('screen-results');

  /* Stage / Boss */
  const stageEl  = byId('stage');
  const bossImg  = byId('bossSprite');
  const bossName = byId('bossName');

  /* HUD */
  const heartsEl     = byId('hearts');
  const hpFill       = byId('hp');
  const streakPill   = byId('streak');
  const scorePill    = byId('scorePill');
  const timerPill    = byId('timer');
  const hintLeftPill = byId('hintLeft');
  const starsPill    = byId('stars');
  const progressPill = byId('progress-pill');

  /* Q&A */
  const qpanel   = byId('qpanel');
  const navRow   = byId('navRow');
  const nextBtn  = byId('nextBtn');

  /* Intro modal */
  const introImg   = byId('introBossImg');
  const introTitle = byId('introTitle');
  const introTag   = byId('introTag');
  const introStory = byId('introStory');
  const introStart = byId('introStart');

  /* Buttons */
  byId('reset').onclick   = reset;
  byId('quit').onclick    = onQuit;
  byId('useHint').onclick = onUseHint;
  byId('back').onclick    = () => showLevels();
  byId('retry').onclick   = () => startLevel(G.id);
  nextBtn.onclick         = onNext;

  /* ---------- Data / Storage ---------- */
  const DATA = window.TTC_DATA;
  if (!DATA || !DATA.weeks) {
    alert('questions.js missing or malformed (expected window.TTC_DATA.weeks)');
    return;
  }
  const SKEY = 'ttcBossBattle_v3';

  function loadState(){
    let s = { unlocked: ['1'], stars: 0, clears: {}, settings: { timer: true } };
    try { const raw = localStorage.getItem(SKEY); if(raw) Object.assign(s, JSON.parse(raw)); } catch(e){}
    return s;
  }
  const state = loadState();
  function save(){ localStorage.setItem(SKEY, JSON.stringify(state)); }
  function reset(){ localStorage.removeItem(SKEY); location.reload(); }

  /* ---------- Toast ---------- */
  function toast(msg){
    const t = byId('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), 1200);
  }

  /* ---------- Callouts (hint/correct/incorrect) ---------- */
  function renderCallout(kind, html){
    // kind: 'hint' | 'good' | 'bad'
    let div = byId('callout');
    if (!div) {
      div = document.createElement('div');
      div.id = 'callout';
      // Insert right after the <h2> question title if present
      const title = qpanel.querySelector('h2');
      if (title && title.parentNode) {
        title.parentNode.insertBefore(div, title.nextSibling);
      } else {
        qpanel.prepend(div);
      }
    }
    div.className = `callout callout--${kind} callout-appear`;
    div.innerHTML = html;
  }
  function clearCallout(){
    const c = byId('callout'); if (c) c.remove();
  }

  /* ---------- Level Select ---------- */
  function renderLevels(){
    screenLevels.innerHTML = '';
    const ids = Object.keys(DATA.weeks).sort((a,b)=>(+a)-(+b));
    const cleared = Object.keys(state.clears).length;
    starsPill.textContent = `⭐ ${state.stars}`;
    progressPill.textContent = `Progress: ${cleared}/${ids.length}`;

    ids.forEach(id => {
      const w = DATA.weeks[id];
      const locked = !state.unlocked.includes(id) && !w.forceUnlock;
      const totalQ = (w.questions || []).length;
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

  function openIntro(id){
    const w = DATA.weeks[id];
    introImg.src = w.bossImage || `assets/w${id}b.png`;
    introTitle.textContent = w.title || `Week ${id}`;
    introTag.textContent   = w.description || '';
    introStory.textContent = w.story || 'Face the weekly boss!';
    introStart.onclick     = ()=> startLevel(id);

    screenLevels.style.display = 'none';
    screenResults.style.display= 'none';
    screenGame.style.display   = 'none';
    screenIntro.style.display  = '';
  }

  /* ---------- Game runtime ---------- */
  let G = null;

  function startLevel(id){
    const w = DATA.weeks[id];
    const questions = (w.questions || []).slice();
    if (!questions.length) { alert('No questions in this week.'); showLevels(); return; }

    G = {
      id, w, questions,

      // Player
      heartsMax: 3,
      hearts: 3,

      // Boss
      hpMax: questions.length,
      hp: questions.length,

      // Scoring
      score: 0,
      SCORE_PER_CORRECT: 100,

      // Hints
      hints: 3,                 // start with 3
      hintUsedThisQuestion: false,
      correctForHintCounter: 0, // +1 hint per 3 correct

      // Flow
      idx: 0,
      streak: 0,
      incorrect: [],
      runStart: Date.now(),
      perQStart: Date.now(),
      waitingNext: false
    };

    setBossAppearance(w, id);
    renderHUD();

    screenIntro.style.display  = 'none';
    screenResults.style.display= 'none';
    screenGame.style.display   = '';
    navRow.style.display       = 'none';

    nextQuestion();
  }

  function setBossAppearance(week, id){
    bossName.textContent = week.bossName || 'BOSS';
    bossImg.src = week.bossImage || `assets/w${id}b.png`;
    stageEl.classList.remove('boss--hit','boss--dead');

    if (week.bossTint) document.documentElement.style.setProperty('--accent', week.bossTint);
    else               document.documentElement.style.setProperty('--accent', '#7bd3ff');
  }

  function renderHUD(){
    // Hearts
    heartsEl.innerHTML = '';
    for (let i=0;i<G.heartsMax;i++){
      const s = document.createElement('span');
      if (i>=G.hearts) s.classList.add('off');
      heartsEl.appendChild(s);
    }
    // Boss HP
    const pct = (G.hp/G.hpMax)*100;
    hpFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;

    // Pills
    streakPill.textContent   = `Streak: ${G.streak}`;
    scorePill.textContent    = `Score: ${G.score}`;
    hintLeftPill.textContent = `⭐ Hints: ${G.hints}`;
    timerPill.textContent    = state.settings.timer
      ? `⏱️ ${Math.max(0, Math.floor((Date.now()-G.runStart)/1000))}s`
      : '⏱️ off';

    // Hint button
    const useHintBtn = byId('useHint');
    if (G.hints<=0 || G.hintUsedThisQuestion || !G.current?.hint){
      useHintBtn.disabled = true; useHintBtn.classList.add('hintlock');
    } else {
      useHintBtn.disabled = false; useHintBtn.classList.remove('hintlock');
    }
  }
  setInterval(()=>{ if(screenGame.style.display!=='none' && state.settings.timer) renderHUD(); }, 500);

  function bossShowState(state){ // 'idle' | 'hit' | 'dead'
    if (state === 'hit'){
      stageEl.classList.add('boss--hit');
      bossImg.classList.remove('flash'); void bossImg.offsetWidth;
      bossImg.classList.add('flash');
      setTimeout(()=> stageEl.classList.remove('boss--hit'), 250);
    } else if (state === 'dead'){
      stageEl.classList.add('boss--dead');
    } else {
      stageEl.classList.remove('boss--hit','boss--dead');
    }
  }

  /* ---------- Question flow ---------- */
  function nextQuestion(){
    const q = G.questions[G.idx];
    G.current = q;
    G.hintUsedThisQuestion = false;
    clearCallout();
    navRow.style.display = 'none';
    G.waitingNext = false;

    if (!q){ finishLevel(false); return; }

    // Header (hide difficulty)
    let html = `
      <div class="row">
        <div class="tag">Q ${G.idx+1} / ${G.questions.length}</div>
      </div>
      <h2 style="margin:6px 0 6px">${q.question}</h2>
    `;
    if (q.code) html += `<div class="qcode">${q.code}</div>`;

    // MC
    if (q.type === 'multiple-choice'){
      html += `<div class="options" id="opts"></div>`;
      qpanel.innerHTML = html;

      const opts = byId('opts');
      q.options.forEach((opt,i)=>{
        const b = document.createElement('button');
        b.textContent = opt;
        b.onclick = ()=> answerMC(i);
        opts.appendChild(b);
      });
    }
    // Drag & Drop
    else if (q.type === 'drag-drop'){
      const terms = q.terms.slice();
      const defs  = q.definitions.slice();
      shuffleArray(terms); shuffleArray(defs);

      html += `
        <div class="drag-wrap">
          <div>
            <strong>Terms</strong>
            <div class="tiles" id="tiles"></div>
          </div>
          <div>
            <strong>Definitions</strong>
            <div class="buckets" id="buckets"></div>
          </div>
        </div>
        <div class="row" style="margin-top:10px">
          <div class="spacer"></div>
          <button id="submitDD">Submit</button>
        </div>`;
      qpanel.innerHTML = html;

      const tilesEl   = byId('tiles');
      const bucketsEl = byId('buckets');
      const submitBtn = byId('submitDD');

      // Per-question runtime state
      const tileByTerm = new Map(); // term -> tileEl
      const assignment = new Map(); // bucketEl -> term string

      // Helpers
      function makeTile(term){
        const t = document.createElement('div');
        t.className = 'tile';
        t.textContent = term;
        t.draggable = true;
        t.dataset.term = term;
        t.ondragstart = e => e.dataTransfer.setData('text/plain', term);
        return t;
      }
      function getTile(term){ return tileByTerm.get(term); }

      function setBucketTerm(bucketEl, newTerm){
        // Return previous term (if any)
        const prevTerm = assignment.get(bucketEl);
        if (prevTerm && prevTerm !== newTerm){
          const prevTile = getTile(prevTerm);
          if (prevTile) prevTile.classList.remove('hidden');
        }
        // Assign
        assignment.set(bucketEl, newTerm);
        bucketEl.dataset.term = newTerm || '';
        bucketEl.querySelector('.chosen').textContent = newTerm || '';

        // Hide used tile
        if (newTerm){
          const newTile = getTile(newTerm);
          if (newTile) newTile.classList.add('hidden');

          // Ensure uniqueness: same term cannot be in two buckets
          document.querySelectorAll('.bucket').forEach(other=>{
            if (other !== bucketEl && other.dataset.term === newTerm){
              assignment.set(other, '');
              other.dataset.term = '';
              other.querySelector('.chosen').textContent = '';
            }
          });
        }
      }

      function lockDragDropUI(){
        tilesEl.querySelectorAll('.tile').forEach(t => t.draggable = false);
        bucketsEl.querySelectorAll('.bucket').forEach(b => {
          b.classList.add('locked');
          b.ondragover = null;
          b.ondrop = null;
        });
        submitBtn.disabled = true;
      }

      // Build tiles
      terms.forEach(term=>{
        const t = makeTile(term);
        tileByTerm.set(term, t);
        tilesEl.appendChild(t);
      });

      // Build buckets
      defs.forEach(def=>{
        const b = document.createElement('div');
        b.className = 'bucket';
        b.dataset.def = def;
        b.innerHTML = `<div>${def}</div><div class="chosen small"></div>`;
        b.ondragover = e => e.preventDefault();
        b.ondrop = e => {
          e.preventDefault();
          if (submitBtn.disabled) return; // already answered
          const droppedTerm = e.dataTransfer.getData('text/plain');
          if (!droppedTerm) return;
          // Replace old if needed
          const current = assignment.get(b);
          if (current && current !== droppedTerm){
            const oldTile = getTile(current);
            if (oldTile) oldTile.classList.remove('hidden');
          }
          setBucketTerm(b, droppedTerm);
        };
        bucketsEl.appendChild(b);
        assignment.set(b, '');
      });

      // Submit evaluation
      submitBtn.onclick = ()=>{
        const expectedByDef = {};
        // correctMatches[i] = index in definitions that term[i] should match
        q.correctMatches.forEach((defIdx, termIdx)=>{
          const defText  = q.definitions[defIdx];
          const termText = q.terms[termIdx];
          expectedByDef[defText] = termText;
        });

        let allCorrect = true;
        document.querySelectorAll('.bucket').forEach(b=>{
          const dropped  = b.dataset.term || '';
          const expected = expectedByDef[b.dataset.def] || '';
          b.classList.remove('correct','wrong');
          if (dropped && dropped === expected) b.classList.add('correct');
          else { b.classList.add('wrong'); allCorrect = false; }
        });

        // Lock inputs
        lockDragDropUI();

        // Resolve
        settleAnswer(allCorrect, q.explanation || '');
      };
    }
    else {
      qpanel.innerHTML = html + `<div class="note">Unsupported question type: ${q.type}</div>`;
      navRow.style.display = '';
      G.waitingNext = true;
    }

    renderHUD();
  }

  /* ---------- MC evaluation ---------- */
  function answerMC(i){
    const q = G.current;
    const opts = byId('opts').children;

    // Lock buttons
    for (let k=0;k<opts.length;k++) opts[k].disabled = true;

    const correct = (i === q.correct);

    // Visual badges ✓ / ✗
    const addBadge = (btn, good) => {
      const b = document.createElement('span');
      b.className = `answer-badge ${good ? 'good' : 'bad'}`;
      b.textContent = good ? '✓' : '✗';
      btn.appendChild(b);
    };

    if (correct) {
      opts[i].classList.add('good');
      addBadge(opts[i], true);
    } else {
      opts[i].classList.add('bad');
      addBadge(opts[i], false);
      if (typeof q.correct === 'number' && opts[q.correct]) {
        opts[q.correct].classList.add('good');
        addBadge(opts[q.correct], true);
      }
    }

    settleAnswer(correct, q.explanation || '', { chosen: i });
  }

  /* ---------- Settle flow (both MC & DragDrop) ---------- */
  function settleAnswer(correct, explanation, meta={}){
    if (correct){
      G.streak++;
      G.score += G.SCORE_PER_CORRECT;
      G.hp = Math.max(0, G.hp - 1);
      renderCallout('good', `<span class="title">✅ Correct!</span>${explanation ? (' ' + explanation) : ''}`);
      bossShowState('hit');
      toast('Hit!');

      // Hint economy
      G.correctForHintCounter++;
      if (G.correctForHintCounter >= 3){
        G.hints++;
        G.correctForHintCounter -= 3;
        toast('Bonus hint earned! ⭐');
      }
    } else {
      G.incorrect.push({ q: G.current, chosen: meta.chosen });
      G.streak = 0;
      G.hearts--;
      renderCallout('bad', `<span class="title">❌ Not quite.</span>${explanation ? (' ' + explanation) : ''}`);
      toast('Ouch! You lost a heart 💔');
    }

    renderHUD();

    // Show Next so students can read the callout
    navRow.style.display = '';
    G.waitingNext = true;

    // End checks
    if (G.hearts <= 0){ bossShowState('idle'); finishLevel(true);  return; }
    if (G.hp     <= 0){ bossShowState('dead'); finishLevel(false); return; }
  }

  function onNext(){
    if (!G || !G.waitingNext) return;
    G.idx++;
    G.perQStart = Date.now();
    nextQuestion();
  }

  /* ---------- Hints ---------- */
  function onUseHint(){
    if (!G) return;
    const q = G.current;

    if (G.hintUsedThisQuestion){ toast('Hint already used on this question.'); return; }
    if (G.hints <= 0){ toast('No hints left. Earn more by answering 3 correctly.'); return; }
    if (!q || !q.hint){ toast('No hint for this one.'); return; }

    G.hints--;
    G.hintUsedThisQuestion = true;
    renderCallout('hint', `<span class="title">💡 Hint:</span> ${q.hint}`);
    renderHUD();
  }

  /* ---------- Finish & Results ---------- */
  function finishLevel(gameOver){
    screenGame.style.display    = 'none';
    screenResults.style.display = '';

    const title   = byId('resTitle');
    const summary = byId('resSummary');
    const review  = byId('reviewList'); review.innerHTML = '';

    const elapsedSec = Math.floor((Date.now() - G.runStart)/1000);
    const baseline   = G.questions.length * 12;
    const timeBonus  = Math.max(0, (baseline - elapsedSec) * 5);
    const finalScore = G.score + timeBonus;

    if (gameOver){
      title.textContent = 'Game Over';
      summary.innerHTML = `You reached question ${G.idx+1} of ${G.questions.length}.<br>
                           <strong>Score:</strong> ${G.score} • <strong>Time:</strong> ${elapsedSec}s`;
    } else {
      title.textContent = 'Level Complete! 🎉';
      const perfect     = (G.incorrect.length === 0 && G.hearts > 0);
      const earnedStars = perfect ? 2 : 1;
      state.stars += earnedStars;
      state.clears[G.id] = true;

      // Unlock next
      const ids = Object.keys(DATA.weeks).sort((a,b)=>(+a)-(+b));
      const nextIdx = ids.indexOf(G.id) + 1;
      if (ids[nextIdx] && !state.unlocked.includes(ids[nextIdx])) state.unlocked.push(ids[nextIdx]);
      save();

      summary.innerHTML =
        `Boss defeated with <strong>${G.hearts}</strong> heart(s) left.<br>
         <strong>Score:</strong> ${G.score} + <strong>Time Bonus:</strong> ${timeBonus} = <strong>${finalScore}</strong><br>
         ⭐ <strong>${earnedStars}</strong> ${perfect ? '(perfect clear!)' : ''}<br>
         <span class="small">Time: ${elapsedSec}s • Baseline: ${baseline}s</span>`;
    }

    // Review mistakes
    if (G.incorrect.length){
      G.incorrect.forEach(({q, chosen})=>{
        const li = document.createElement('li');
        if (q.type === 'multiple-choice'){
          li.innerHTML = `<strong>Q:</strong> ${q.question}<br>
                          <span class="small">Your answer:</span> ${q.options?.[chosen] ?? '—'}<br>
                          <span class="small">Correct:</span> ${q.options?.[q.correct]}<br>
                          <span class="small">${q.explanation || ''}</span>`;
        } else {
          li.innerHTML = `<strong>Q:</strong> ${q.question}<br>
                          <span class="small">${q.explanation || ''}</span>`;
        }
        review.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'Flawless! Nothing to review.';
      review.appendChild(li);
    }
  }

  /* ---------- Quit / Levels ---------- */
  function onQuit(){
    if (confirm('Quit this level? Progress for this run will be lost.')) showLevels();
  }
  function showLevels(){
    screenIntro.style.display   = 'none';
    screenResults.style.display = 'none';
    screenGame.style.display    = 'none';
    screenLevels.style.display  = '';
    renderLevels();
  }

  /* ---------- Utils ---------- */
  function shuffleArray(a){
    for (let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  /* ---------- Boot ---------- */
  renderLevels();

})();
