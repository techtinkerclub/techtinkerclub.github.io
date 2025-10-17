/* ===========================================================
   Tech Tinker Boss Battle — game.js (Arcade Build v5)
   - MC & DragDrop (one-use tiles, swap pre-submit, lock post-submit)
   - Hints: start 3 / 1 per Q / +1 per 3 correct
   - Boss HP bar (👾 + numeric), pixel-heart lives
   - Score (+100 per correct) + time bonus on clear
   - Difficulty hidden
   - Callouts + ✓/✗ badges
   - Retro bleeps (no audio assets)
   - NEW: hit bounce (random nudge + snap-back), defeat roll-out, inline results overlay in stage
   - NEW: subtle Matrix rain canvas in stage background
   =========================================================== */

(() => {
  /* ---------- DOM helpers ---------- */
  const $    = (s)  => document.querySelector(s);
  const byId = (id) => document.getElementById(id);

  /* Screens */
  const screenLevels  = byId('screen-levels');
  const screenIntro   = byId('screen-intro');
  const screenGame    = byId('screen-game');
  const screenResults = byId('screen-results'); // we won’t use this for clear; we keep for fallback

  /* Stage / Boss */
  const stageEl      = byId('stage');
  const bossImg      = byId('bossSprite');
  const bossName     = byId('bossName');
  const stageOverlay = byId('stageOverlay');
  const matrixCanvas = byId('matrixCanvas');

  /* HUD */
  const heartsEl     = byId('hearts');
  const hpFill       = byId('hp');
  const hpCount      = byId('hpCount');
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
  const SKEY = 'ttcBossBattle_arcade_v5';

  function loadState(){
    let s = { unlocked: ['1'], stars: 0, clears: {}, settings: { timer: true } };
    try { const raw = localStorage.getItem(SKEY); if (raw) Object.assign(s, JSON.parse(raw)); } catch(e){}
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

  /* ---------- Callouts ---------- */
  function renderCallout(kind, html){
    let div = byId('callout');
    if (!div) {
      div = document.createElement('div');
      div.id = 'callout';
      const title = qpanel.querySelector('h2');
      if (title && title.parentNode) title.parentNode.insertBefore(div, title.nextSibling);
      else qpanel.prepend(div);
    }
    div.className = `callout callout--${kind} callout-appear`;
    div.innerHTML = html;
  }
  function clearCallout(){ const c = byId('callout'); if (c) c.remove(); }

  /* ---------- Tiny 8-bit bleeps ---------- */
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = AudioCtx ? new AudioCtx() : null;
  function beep(freq=440, dur=0.08, type='square', vol=0.05){
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    setTimeout(()=>{ o.stop(); }, dur*1000);
  }

  /* ---------- Matrix Rain (subtle) ---------- */
  let matrix = null;
  function startMatrixRain(){
    const canvas = matrixCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const chars = '0123456789';
    let w, h, cols, drops;

    function resize(){
      const rect = stageEl.getBoundingClientRect();
      canvas.width  = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
      w = canvas.width; h = canvas.height;
      cols = Math.floor(w / 14);
      drops = new Array(cols).fill(0).map(()=> Math.random()*h);
    }
    resize();
    window.addEventListener('resize', resize);

    ctx.font = '18px VT323, monospace';

    let raf;
    function tick(){
      // fade
      ctx.fillStyle = 'rgba(8,12,26,0.22)';
      ctx.fillRect(0,0,w,h);
      // draw
      for(let i=0;i<cols;i++){
        const text = chars[Math.floor(Math.random()*chars.length)];
        const x = i*14;
        const y = drops[i]*1.0;
        ctx.fillStyle = 'rgba(140, 255, 170, 0.85)';
        ctx.fillText(text, x, y);
        drops[i] = y > h ? 0 : y + (12 + Math.random()*10);
      }
      raf = requestAnimationFrame(tick);
    }
    tick();

    matrix = { stop: ()=> cancelAnimationFrame(raf) };
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
    if (!questions.length){ alert('No questions in this week.'); showLevels(); return; }

    G = {
      id, w, questions,
      heartsMax: 3, hearts: 3,
      hpMax: questions.length, hp: questions.length,
      score: 0, SCORE_PER_CORRECT: 100,
      hints: 3, hintUsedThisQuestion: false, correctForHintCounter: 0,
      idx: 0, streak: 0, incorrect: [],
      runStart: Date.now(), perQStart: Date.now(),
      waitingNext: false
    };

    setBossAppearance(w, id);
    renderHUD();

    // reset overlay + start matrix rain
    stageOverlay.hidden = true;
    stageOverlay.innerHTML = '';
    if (matrix && matrix.stop) matrix.stop();
    startMatrixRain();

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
    bossImg.classList.remove('boss-roll-out','boss-bounce');
    bossImg.style.opacity = '1';
    if (week.bossTint) document.documentElement.style.setProperty('--accent', week.bossTint);
    else               document.documentElement.style.setProperty('--accent', '#7bd3ff');
  }

  function renderHUD(){
    // hearts (SVG)
    const HEART_ON  = '<svg viewBox="0 0 16 14" aria-hidden="true"><path class="heart-fill" d="M8 13s-3.2-2.3-5.1-4.2C1.5 7.4 1 6.3 1 5.1 1 3.4 2.4 2 4.1 2c1.1 0 2.1.6 2.7 1.5C7.4 2.6 8.4 2 9.5 2 11.2 2 12.6 3.4 12.6 5.1c0 1.2-.5 2.3-1.9 3.7C11.2 9.2 8 13 8 13z"/></svg>';
    const HEART_OFF = '<svg viewBox="0 0 16 14" aria-hidden="true"><path class="heart-off"  d="M8 13s-3.2-2.3-5.1-4.2C1.5 7.4 1 6.3 1 5.1 1 3.4 2.4 2 4.1 2c1.1 0 2.1.6 2.7 1.5C7.4 2.6 8.4 2 9.5 2 11.2 2 12.6 3.4 12.6 5.1c0 1.2-.5 2.3-1.9 3.7C11.2 9.2 8 13 8 13z"/></svg>';
    heartsEl.innerHTML = '';
    for (let i=0;i<G.heartsMax;i++) heartsEl.insertAdjacentHTML('beforeend', i < G.hearts ? HEART_ON : HEART_OFF);

    // Boss HP
    const pct = (G.hp / G.hpMax) * 100;
    if (hpFill)  hpFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    if (hpCount) hpCount.textContent = `(${G.hp}/${G.hpMax})`;

    streakPill.textContent   = `Streak: ${G.streak}`;
    scorePill.textContent    = `Score: ${G.score}`;
    hintLeftPill.textContent = `⭐ Hints: ${G.hints}`;
    timerPill.textContent    = state.settings.timer ? `⏱️ ${Math.max(0, Math.floor((Date.now()-G.runStart)/1000))}s` : '⏱️ off';

    const useHintBtn = byId('useHint');
    if (G.hints<=0 || G.hintUsedThisQuestion || !G.current?.hint){
      useHintBtn.disabled = true; useHintBtn.classList.add('hintlock');
    } else {
      useHintBtn.disabled = false; useHintBtn.classList.remove('hintlock');
    }
  }
  setInterval(()=>{ if (screenGame.style.display!=='none' && state.settings.timer) renderHUD(); }, 500);

  function bossShowState(state){
    if (state === 'hit'){
      stageEl.classList.add('boss--hit');
      // bounce: set random CSS vars then trigger animation class
      const dx = (Math.random()*16 - 8) | 0;   // -8..+8 px
      const dy = (Math.random()*10 - 5) | 0;   // -5..+5 px
      const dr = (Math.random()*10 - 5).toFixed(1) + 'deg';
      bossImg.style.setProperty('--hitX', dx + 'px');
      bossImg.style.setProperty('--hitY', dy + 'px');
      bossImg.style.setProperty('--hitR', dr);
      bossImg.classList.remove('boss-bounce');
      void bossImg.offsetWidth; // reflow to restart
      bossImg.classList.add('boss-bounce');

      setTimeout(()=> stageEl.classList.remove('boss--hit'), 220);
    } else if (state === 'dead'){
      stageEl.classList.add('boss--dead');
    } else {
      stageEl.classList.remove('boss--hit','boss--dead');
    }
  }

  /* ---------- Questions ---------- */
  function nextQuestion(){
    const q = G.questions[G.idx];
    G.current = q;
    G.hintUsedThisQuestion = false;
    clearCallout();
    navRow.style.display = 'none';
    G.waitingNext = false;

    if (!q){ // boss dead handled via settle; this is safety
      inlineFinish(false);
      return;
    }

    let html = `
      <div class="row">
        <div class="tag">Q ${G.idx+1} / ${G.questions.length}</div>
      </div>
      <h2 style="margin:6px 0 6px">${q.question}</h2>
    `;
    if (q.code) html += `<div class="qcode">${q.code}</div>`;

    if (q.type === 'multiple-choice'){
      html += `<div class="options" id="opts"></div>`;
      qpanel.innerHTML = html;
      const opts = byId('opts');
      q.options.forEach((opt, i)=>{
        const b = document.createElement('button');
        b.textContent = opt;
        b.onclick = ()=> answerMC(i);
        opts.appendChild(b);
      });
    }
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

      const tileByTerm = new Map();
      const assignment = new Map();

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
        const prevTerm = assignment.get(bucketEl);
        if (prevTerm && prevTerm !== newTerm){
          const prevTile = getTile(prevTerm);
          if (prevTile) prevTile.classList.remove('hidden');
        }
        assignment.set(bucketEl, newTerm);
        bucketEl.dataset.term = newTerm || '';
        bucketEl.querySelector('.chosen').textContent = newTerm || '';
        if (newTerm){
          const newTile = getTile(newTerm);
          if (newTile) newTile.classList.add('hidden');
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

      terms.forEach(term=>{
        const t = makeTile(term); tileByTerm.set(term, t); tilesEl.appendChild(t);
      });

      defs.forEach(def=>{
        const b = document.createElement('div');
        b.className = 'bucket';
        b.dataset.def = def;
        b.innerHTML = `<div>${def}</div><div class="chosen small"></div>`;
        b.ondragover = e => e.preventDefault();
        b.ondrop = e => {
          e.preventDefault();
          if (submitBtn.disabled) return;
          const droppedTerm = e.dataTransfer.getData('text/plain');
          if (!droppedTerm) return;
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

      submitBtn.onclick = ()=>{
        const expectedByDef = {};
        q.correctMatches.forEach((defIdx, termIdx)=>{
          expectedByDef[q.definitions[defIdx]] = q.terms[termIdx];
        });

        let allCorrect = true;
        document.querySelectorAll('.bucket').forEach(b=>{
          const dropped  = b.dataset.term || '';
          const expected = expectedByDef[b.dataset.def] || '';
          b.classList.remove('correct','wrong');
          if (dropped && dropped === expected) b.classList.add('correct');
          else { b.classList.add('wrong'); allCorrect = false; }
        });

        lockDragDropUI();
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
    for (let k=0;k<opts.length;k++) opts[k].disabled = true;
    const correct = (i === q.correct);

    const addBadge = (btn, good) => {
      const b = document.createElement('span');
      b.className = `answer-badge ${good ? 'good' : 'bad'}`;
      b.textContent = good ? '✓' : '✗';
      btn.appendChild(b);
    };
    if (correct) { opts[i].classList.add('good'); addBadge(opts[i], true); }
    else {
      opts[i].classList.add('bad'); addBadge(opts[i], false);
      if (typeof q.correct === 'number' && opts[q.correct]) {
        opts[q.correct].classList.add('good'); addBadge(opts[q.correct], true);
      }
    }

    settleAnswer(correct, q.explanation || '', { chosen: i });
  }

  /* ---------- Settle ---------- */
  function settleAnswer(correct, explanation, meta={}){
    if (correct){
      G.streak++;
      G.score += G.SCORE_PER_CORRECT;
      G.hp = Math.max(0, G.hp - 1);
      renderCallout('good', `<span class="title">✅ Correct!</span>${explanation ? (' ' + explanation) : ''}`);
      bossShowState('hit');
      beep(660, 0.07, 'square'); setTimeout(()=>beep(880, 0.06, 'square'), 70);
      G.correctForHintCounter++;
      if (G.correctForHintCounter >= 3){
        G.hints++; G.correctForHintCounter -= 3; toast('Bonus hint earned! ⭐');
      }
    } else {
      G.incorrect.push({ q: G.current, chosen: meta.chosen });
      G.streak = 0;
      G.hearts--;
      renderCallout('bad', `<span class="title">❌ Not quite.</span>${explanation ? (' ' + explanation) : ''}`);
      beep(220, 0.12, 'sawtooth');
      toast('Ouch! You lost a heart 💔');
    }

    renderHUD();

    // End checks first — we animate defeat inside stage.
    if (G.hearts <= 0){ // player out of hearts
      inlineFinish(true);
      return;
    }
    if (G.hp <= 0){ // boss defeated
      animateDefeatThenOverlay();
      return;
    }

    // Otherwise continue
    navRow.style.display = '';
    G.waitingNext = true;
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
    G.hints--; G.hintUsedThisQuestion = true;
    renderCallout('hint', `<span class="title">💡 Hint:</span> ${q.hint}`);
    renderHUD();
  }

  /* ---------- Inline results (overlay in stage) ---------- */
  function animateDefeatThenOverlay(){
    // roll boss out
    bossImg.classList.add('boss-roll-out');
    bossImg.addEventListener('animationend', showOverlay, { once:true });
  }

  function inlineFinish(gameOver){
    // Stop matrix for overlay clarity
    if (matrix && matrix.stop) matrix.stop();
    // If we lost, dim boss
    if (gameOver){
      bossImg.style.opacity = '0.3';
    }
    showOverlay(gameOver);
  }

  function showOverlay(gameOver=false){
    // Stop matrix for overlay clarity (if not already)
    if (matrix && matrix.stop) matrix.stop();

    // Build summary
    const elapsedSec = Math.floor((Date.now() - G.runStart)/1000);
    const baseline   = G.questions.length * 12;
    const timeBonus  = Math.max(0, (baseline - elapsedSec) * 5);
    const finalScore = G.score + (gameOver ? 0 : timeBonus);

    // Update progression only if not gameOver
    let summaryHTML = '';
    if (gameOver){
      summaryHTML = `
        <h3>Game Over</h3>
        <div class="meta">You reached question ${G.idx+1} of ${G.questions.length}. Time: ${elapsedSec}s</div>
      `;
    } else {
      const perfect     = (G.incorrect.length === 0 && G.hearts > 0);
      const earnedStars = perfect ? 2 : 1;
      // meta progression
      state.stars += earnedStars;
      state.clears[G.id] = true;
      const ids = Object.keys(DATA.weeks).sort((a,b)=>(+a)-(+b));
      const nextIdx = ids.indexOf(G.id) + 1;
      if (ids[nextIdx] && !state.unlocked.includes(ids[nextIdx])) state.unlocked.push(ids[nextIdx]);
      save();

      summaryHTML = `
        <h3>Level Complete! 🎉</h3>
        <div class="meta">
          Boss defeated with <strong>${G.hearts}</strong> heart(s) left.<br>
          Score: <strong>${G.score}</strong> + Time Bonus: <strong>${timeBonus}</strong> = <strong>${finalScore}</strong><br>
          ⭐ <strong>${earnedStars}</strong> ${perfect ? '(perfect clear!)' : ''} • Time: ${elapsedSec}s
        </div>`;
    }

    // Build review
    let reviewHTML = '';
    if (G.incorrect.length){
      reviewHTML += `<ul class="review">`;
      G.incorrect.forEach(({q, chosen})=>{
        if (q.type === 'multiple-choice'){
          reviewHTML += `<li><strong>Q:</strong> ${q.question}<br>
                          <span class="small">Your answer:</span> ${q.options?.[chosen] ?? '—'}<br>
                          <span class="small">Correct:</span> ${q.options?.[q.correct]}<br>
                          <span class="small">${q.explanation || ''}</span></li>`;
        } else {
          reviewHTML += `<li><strong>Q:</strong> ${q.question}<br>
                          <span class="small">${q.explanation || ''}</span></li>`;
        }
      });
      reviewHTML += `</ul>`;
    } else {
      reviewHTML = `<div class="small">Flawless! Nothing to review.</div>`;
    }

    stageOverlay.innerHTML = `
      <div class="overlay-card">
        ${summaryHTML}
        ${reviewHTML}
        <div class="row" style="margin-top:10px">
          <button id="overlayNext">Back to Levels</button>
          <div class="spacer"></div>
          <button id="overlayRetry">Replay</button>
        </div>
      </div>
    `;
    stageOverlay.hidden = false;

    byId('overlayNext').onclick  = showLevels;
    byId('overlayRetry').onclick = () => startLevel(G.id);
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
    // clean stage artifacts
    stageOverlay.hidden = true; stageOverlay.innerHTML='';
    bossImg.classList.remove('boss-roll-out','boss-bounce');
    if (matrix && matrix.stop) matrix.stop();
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
