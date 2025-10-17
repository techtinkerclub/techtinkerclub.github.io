/* ===========================================================
   Tech Tinker Boss Battle — game.js (Arcade Build v5.1)
   Fixes:
   - Boss bounce/roll visible (bob moved to wrapper via CSS)
   - Matrix rain sizing/layering
   - Overlay z-index & clickability
   - HP bar updates consistently
   =========================================================== */

(() => {
  const byId = (id) => document.getElementById(id);

  /* Screens */
  const screenLevels  = byId('screen-levels');
  const screenIntro   = byId('screen-intro');
  const screenGame    = byId('screen-game');
  const screenResults = byId('screen-results');

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

  /* Intro */
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

  /* Data / Storage */
  const DATA = window.TTC_DATA;
  if (!DATA || !DATA.weeks) { alert('questions.js missing'); return; }
  const SKEY = 'ttcBossBattle_arcade_v5_1';
  function loadState(){
    let s = { unlocked: ['1'], stars: 0, clears: {}, settings: { timer: true } };
    try { const raw = localStorage.getItem(SKEY); if (raw) Object.assign(s, JSON.parse(raw)); } catch(e){}
    return s;
  }
  const state = loadState();
  function save(){ localStorage.setItem(SKEY, JSON.stringify(state)); }
  function reset(){ localStorage.removeItem(SKEY); location.reload(); }

  /* Toast */
  function toast(msg){ const t = byId('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 1200); }

  /* Callouts */
  function renderCallout(kind, html){
    let div = byId('callout');
    if (!div) {
      div = document.createElement('div'); div.id = 'callout';
      const title = qpanel.querySelector('h2'); (title?.parentNode || qpanel).insertBefore(div, title?.nextSibling || qpanel.firstChild);
    }
    div.className = `callout callout--${kind} callout-appear`;
    div.innerHTML = html;
  }
  function clearCallout(){ byId('callout')?.remove(); }

  /* Beeps */
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = AudioCtx ? new AudioCtx() : null;
  function beep(freq=440, dur=0.08, type='square', vol=0.05){
    if (!audioCtx) return;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    o.connect(g); g.connect(audioCtx.destination); o.start(); setTimeout(()=>o.stop(), dur*1000);
  }

  /* Matrix rain */
  let matrix = null;
  function startMatrixRain(){
    const c = matrixCanvas; if (!c) return;
    const ctx = c.getContext('2d');
    const chars = '0123456789';
    let w=0, h=0, cols=0, drops=[];
    function resize(){
      // size to stage’s content box
      const rect = stageEl.getBoundingClientRect();
      c.width = Math.max(1, Math.floor(rect.width));
      c.height= Math.max(1, Math.floor(rect.height));
      w = c.width; h = c.height;
      cols = Math.max(1, Math.floor(w / 14));
      drops = new Array(cols).fill(0).map(()=> Math.random()*h);
      ctx.font = '18px VT323, monospace';
    }
    resize(); setTimeout(resize, 0);
    window.addEventListener('resize', resize);

    let raf;
    function tick(){
      ctx.fillStyle = 'rgba(8,12,26,0.2)'; // gentle fade
      ctx.fillRect(0,0,w,h);
      for(let i=0;i<cols;i++){
        const ch = chars[(Math.random()*chars.length)|0];
        const x = i*14, y = drops[i];
        ctx.fillStyle = 'rgba(140,255,170,0.85)';
        ctx.fillText(ch, x, y);
        drops[i] = y > h ? 0 : y + (12 + Math.random()*10);
      }
      raf = requestAnimationFrame(tick);
    }
    tick();
    matrix = { stop: ()=> cancelAnimationFrame(raf) };
  }

  /* Level select */
  function renderLevels(){
    screenLevels.innerHTML = '';
    const ids = Object.keys(DATA.weeks).sort((a,b)=>(+a)-(+b));
    const cleared = Object.keys(state.clears).length;
    starsPill.textContent = `⭐ ${state.stars}`;
    progressPill.textContent = `Progress: ${cleared}/${ids.length}`;
    ids.forEach(id=>{
      const w = DATA.weeks[id], locked = !state.unlocked.includes(id) && !w.forceUnlock;
      const totalQ = (w.questions||[]).length;
      const card = document.createElement('div'); card.className='card';
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
    screenLevels.querySelectorAll('button[data-id]').forEach(b=> b.addEventListener('click', ()=>openIntro(b.dataset.id)));
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

  /* Runtime */
  let G = null;

  function startLevel(id){
    const w = DATA.weeks[id];
    const questions = (w.questions||[]).slice();
    if (!questions.length){ alert('No questions in this week.'); showLevels(); return; }

    G = {
      id, w, questions,
      heartsMax:3, hearts:3,
      hpMax:questions.length, hp:questions.length,
      score:0, SCORE_PER_CORRECT:100,
      hints:3, hintUsedThisQuestion:false, correctForHintCounter:0,
      idx:0, streak:0, incorrect:[],
      runStart:Date.now(), perQStart:Date.now(), waitingNext:false
    };

    setBossAppearance(w, id);
    renderHUD();

    stageOverlay.hidden = true; stageOverlay.innerHTML='';
    matrix?.stop?.(); startMatrixRain();

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
    document.documentElement.style.setProperty('--accent', week.bossTint || '#7bd3ff');
  }

  function renderHUD(){
    const HEART_ON  = '<svg viewBox="0 0 16 14" aria-hidden="true"><path class="heart-fill" d="M8 13s-3.2-2.3-5.1-4.2C1.5 7.4 1 6.3 1 5.1 1 3.4 2.4 2 4.1 2c1.1 0 2.1.6 2.7 1.5C7.4 2.6 8.4 2 9.5 2 11.2 2 12.6 3.4 12.6 5.1c0 1.2-.5 2.3-1.9 3.7C11.2 9.2 8 13 8 13z"/></svg>';
    const HEART_OFF = '<svg viewBox="0 0 16 14" aria-hidden="true"><path class="heart-off"  d="M8 13s-3.2-2.3-5.1-4.2C1.5 7.4 1 6.3 1 5.1 1 3.4 2.4 2 4.1 2c1.1 0 2.1.6 2.7 1.5C7.4 2.6 8.4 2 9.5 2 11.2 2 12.6 3.4 12.6 5.1c0 1.2-.5 2.3-1.9 3.7C11.2 9.2 8 13 8 13z"/></svg>';
    heartsEl.innerHTML = ''; for (let i=0;i<G.heartsMax;i++) heartsEl.insertAdjacentHTML('beforeend', i < G.hearts ? HEART_ON : HEART_OFF);

    const pct = (G.hp/G.hpMax)*100;
    hpFill.style.width = `${Math.max(0,Math.min(100,pct))}%`;
    hpCount.textContent = `(${G.hp}/${G.hpMax})`;

    streakPill.textContent   = `Streak: ${G.streak}`;
    scorePill.textContent    = `Score: ${G.score}`;
    hintLeftPill.textContent = `⭐ Hints: ${G.hints}`;
    timerPill.textContent    = state.settings.timer ? `⏱️ ${Math.max(0, Math.floor((Date.now()-G.runStart)/1000))}s` : '⏱️ off';

    const useHintBtn = byId('useHint');
    if (G.hints<=0 || G.hintUsedThisQuestion || !G.current?.hint){ useHintBtn.disabled = true; useHintBtn.classList.add('hintlock'); }
    else { useHintBtn.disabled = false; useHintBtn.classList.remove('hintlock'); }
  }
  setInterval(()=>{ if (screenGame.style.display!=='none' && state.settings.timer) renderHUD(); }, 500);

  function bossShowState(state){
    if (state === 'hit'){
      stageEl.classList.add('boss--hit');
      const dx = (Math.random()*16 - 8)|0, dy=(Math.random()*10 - 5)|0, dr=(Math.random()*10 - 5).toFixed(1)+'deg';
      bossImg.style.setProperty('--hitX', dx+'px');
      bossImg.style.setProperty('--hitY', dy+'px');
      bossImg.style.setProperty('--hitR', dr);
      bossImg.classList.remove('boss-bounce'); void bossImg.offsetWidth; bossImg.classList.add('boss-bounce');
      setTimeout(()=> stageEl.classList.remove('boss--hit'), 220);
    } else if (state === 'dead'){
      stageEl.classList.add('boss--dead');
    } else {
      stageEl.classList.remove('boss--hit','boss--dead');
    }
  }

  function nextQuestion(){
    const q = (G.current = G.questions[G.idx]);
    G.hintUsedThisQuestion = false;
    clearCallout(); navRow.style.display='none'; G.waitingNext=false;
    if (!q){ showOverlay(false); return; }

    let html = `
      <div class="row"><div class="tag">Q ${G.idx+1} / ${G.questions.length}</div></div>
      <h2 style="margin:6px 0 6px">${q.question}</h2>
    `;
    if (q.code) html += `<div class="qcode">${q.code}</div>`;

    if (q.type === 'multiple-choice'){
      html += `<div class="options" id="opts"></div>`; qpanel.innerHTML = html;
      const opts = byId('opts'); q.options.forEach((opt,i)=>{ const b=document.createElement('button'); b.textContent=opt; b.onclick=()=>answerMC(i); opts.appendChild(b); });
    } else if (q.type === 'drag-drop'){
      const terms=q.terms.slice(), defs=q.definitions.slice(); shuffle(terms); shuffle(defs);
      html += `
        <div class="drag-wrap">
          <div><strong>Terms</strong><div class="tiles" id="tiles"></div></div>
          <div><strong>Definitions</strong><div class="buckets" id="buckets"></div></div>
        </div>
        <div class="row" style="margin-top:10px"><div class="spacer"></div><button id="submitDD">Submit</button></div>`;
      qpanel.innerHTML = html;

      const tilesEl=byId('tiles'), bucketsEl=byId('buckets'), submitBtn=byId('submitDD');
      const tileByTerm=new Map(), assignment=new Map();
      function makeTile(term){ const t=document.createElement('div'); t.className='tile'; t.textContent=term; t.draggable=true; t.dataset.term=term; t.ondragstart=e=>e.dataTransfer.setData('text/plain',term); return t; }
      function getTile(term){ return tileByTerm.get(term); }
      function setBucketTerm(bucket,newTerm){
        const prev=assignment.get(bucket);
        if(prev && prev!==newTerm){ getTile(prev)?.classList.remove('hidden'); }
        assignment.set(bucket,newTerm); bucket.dataset.term=newTerm||''; bucket.querySelector('.chosen').textContent=newTerm||'';
        if(newTerm){
          getTile(newTerm)?.classList.add('hidden');
          document.querySelectorAll('.bucket').forEach(other=>{
            if(other!==bucket && other.dataset.term===newTerm){
              assignment.set(other,''); other.dataset.term=''; other.querySelector('.chosen').textContent='';
            }
          });
        }
      }
      function lockDD(){
        tilesEl.querySelectorAll('.tile').forEach(t=>t.draggable=false);
        bucketsEl.querySelectorAll('.bucket').forEach(b=>{ b.classList.add('locked'); b.ondragover=null; b.ondrop=null; });
        submitBtn.disabled=true;
      }
      terms.forEach(term=>{ const t=makeTile(term); tileByTerm.set(term,t); tilesEl.appendChild(t); });
      defs.forEach(def=>{
        const b=document.createElement('div'); b.className='bucket'; b.dataset.def=def; b.innerHTML=`<div>${def}</div><div class="chosen small"></div>`;
        b.ondragover=e=>e.preventDefault();
        b.ondrop=e=>{ e.preventDefault(); if(submitBtn.disabled) return; const dropped=e.dataTransfer.getData('text/plain'); if(!dropped) return;
          const cur=assignment.get(b); if(cur && cur!==dropped) getTile(cur)?.classList.remove('hidden'); setBucketTerm(b,dropped);
        };
        bucketsEl.appendChild(b); assignment.set(b,'');
      });
      submitBtn.onclick=()=>{
        const expectedByDef={}; q.correctMatches.forEach((defIdx,termIdx)=>{ expectedByDef[q.definitions[defIdx]]=q.terms[termIdx]; });
        let all=true; document.querySelectorAll('.bucket').forEach(b=>{
          const d=b.dataset.term||'', e=expectedByDef[b.dataset.def]||''; b.classList.remove('correct','wrong');
          if(d && d===e) b.classList.add('correct'); else { b.classList.add('wrong'); all=false; }
        });
        lockDD(); settleAnswer(all,q.explanation||'');
      };
    } else {
      qpanel.innerHTML = html + `<div class="note">Unsupported question type: ${q.type}</div>`;
      navRow.style.display=''; G.waitingNext=true;
    }
    renderHUD();
  }

  function answerMC(i){
    const q = G.current, opts = byId('opts').children;
    for(let k=0;k<opts.length;k++) opts[k].disabled=true;
    const correct = (i===q.correct);
    const addBadge=(btn,good)=>{ const b=document.createElement('span'); b.className=`answer-badge ${good?'good':'bad'}`; b.textContent=good?'✓':'✗'; btn.appendChild(b); };
    if(correct){ opts[i].classList.add('good'); addBadge(opts[i],true); }
    else{ opts[i].classList.add('bad'); addBadge(opts[i],false); if(typeof q.correct==='number' && opts[q.correct]){ opts[q.correct].classList.add('good'); addBadge(opts[q.correct],true); } }
    settleAnswer(correct, q.explanation||'', {chosen:i});
  }

  function settleAnswer(correct, explanation){
    if (correct){
      G.streak++; G.score += G.SCORE_PER_CORRECT; G.hp = Math.max(0, G.hp-1);
      renderCallout('good', `<span class="title">✅ Correct!</span> ${explanation||''}`);
      bossShowState('hit'); beep(660,.07,'square'); setTimeout(()=>beep(880,.06,'square'),70);
      if(++G.correctForHintCounter >= 3){ G.hints++; G.correctForHintCounter-=3; toast('Bonus hint earned! ⭐'); }
    } else {
      G.incorrect.push({ q: G.current });
      G.streak=0; G.hearts--;
      renderCallout('bad', `<span class="title">❌ Not quite.</span> ${explanation||''}`);
      beep(220,.12,'sawtooth'); toast('Ouch! You lost a heart 💔');
    }
    renderHUD();

    if (G.hearts <= 0){ showOverlay(true); return; }
    if (G.hp <= 0){ bossImg.classList.add('boss-roll-out'); bossImg.addEventListener('animationend', ()=>showOverlay(false), { once:true }); return; }

    navRow.style.display=''; G.waitingNext=true;
  }

  function onNext(){ if(!G || !G.waitingNext) return; G.idx++; G.perQStart=Date.now(); nextQuestion(); }

  function onUseHint(){
    if (!G) return; const q=G.current;
    if (G.hintUsedThisQuestion){ toast('Hint already used on this question.'); return; }
    if (G.hints<=0){ toast('No hints left. Earn more by answering 3 correctly.'); return; }
    if (!q || !q.hint){ toast('No hint for this one.'); return; }
    G.hints--; G.hintUsedThisQuestion=true; renderCallout('hint', `<span class="title">💡 Hint:</span> ${q.hint}`); renderHUD();
  }

  function showOverlay(gameOver){
    matrix?.stop?.();
    if (gameOver){ bossImg.style.opacity='0.3'; }

    const elapsedSec = Math.floor((Date.now()-G.runStart)/1000);
    const baseline   = G.questions.length * 12;
    const timeBonus  = Math.max(0, (baseline - elapsedSec) * 5);
    const finalScore = G.score + (gameOver ? 0 : timeBonus);

    let summaryHTML='';
    if (gameOver){
      summaryHTML = `<h3>Game Over</h3><div class="meta">You reached question ${G.idx+1} of ${G.questions.length}. Time: ${elapsedSec}s</div>`;
    } else {
      const perfect = (G.incorrect.length===0 && G.hearts>0);
      const earnedStars = perfect ? 2 : 1;
      state.stars += earnedStars; state.clears[G.id]=true;
      const ids=Object.keys(DATA.weeks).sort((a,b)=>(+a)-(+b)); const nextIdx=ids.indexOf(G.id)+1;
      if(ids[nextIdx] && !state.unlocked.includes(ids[nextIdx])) state.unlocked.push(ids[nextIdx]);
      save();
      summaryHTML = `
        <h3>Level Complete! 🎉</h3>
        <div class="meta">
          Boss defeated with <strong>${G.hearts}</strong> heart(s) left.<br>
          Score: <strong>${G.score}</strong> + Time Bonus: <strong>${timeBonus}</strong> = <strong>${finalScore}</strong><br>
          ⭐ <strong>${earnedStars}</strong> ${perfect ? '(perfect clear!)' : ''} • Time: ${elapsedSec}s
        </div>`;
    }

    let reviewHTML='';
    if (G.incorrect.length){
      reviewHTML += `<ul class="review">`;
      G.incorrect.forEach(({q})=>{
        if (q.type === 'multiple-choice'){
          reviewHTML += `<li><strong>Q:</strong> ${q.question}<br><span class="small">${q.explanation || ''}</span></li>`;
        } else {
          reviewHTML += `<li><strong>Q:</strong> ${q.question}<br><span class="small">${q.explanation || ''}</span></li>`;
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
      </div>`;
    stageOverlay.hidden = false;

    byId('overlayNext').onclick  = showLevels;
    byId('overlayRetry').onclick = () => startLevel(G.id);
  }

  function onQuit(){ if (confirm('Quit this level? Progress for this run will be lost.')) showLevels(); }
  function showLevels(){
    screenIntro.style.display='none'; screenResults.style.display='none'; screenGame.style.display='none';
    screenLevels.style.display=''; stageOverlay.hidden=true; stageOverlay.innerHTML=''; bossImg.classList.remove('boss-roll-out','boss-bounce');
    matrix?.stop?.(); renderLevels();
  }

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }

  /* Boot */
  renderLevels();
})();
