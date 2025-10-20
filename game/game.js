/* ===========================================================
   Tech Tinker Boss Battle — game.js (Arcade Build v6.8)
   • Animations restored + extra punch (hit/lunge/flash/roll-out)
   • DnD: re-arrange freely until Submit; drop back to tiles = unassign
   • “Next” appears under explanation (no footer bar); never on last Q
   • Hint floaty, matrix rain, score hearts/HP — all intact
   =========================================================== */

(() => {
  const byId = (id) => document.getElementById(id);

  /* Screens */
  const screenLevels  = byId('screen-levels');
  const screenIntro   = byId('screen-intro');
  const screenGame    = byId('screen-game');
  const screenResults = byId('screen-results');

  /* Boot after data is present */
  waitForData(initGame);
  function waitForData(cb, tries=0){
    if (window.TTC_DATA && window.TTC_DATA.weeks) return cb();
    if (tries > 100){
      if (screenLevels){
        screenLevels.innerHTML = `<div class="card"><h3>Game data not loaded</h3>
          <div class="small">Make sure <code>questions.js</code> loads before <code>game.js</code>.</div>
        </div>`;
      }
      return;
    }
    setTimeout(()=>waitForData(cb, tries+1), 50);
  }

  /* Fallback story/dialogue (used if not provided in questions.js) */
  const STORY_BOOK = {
    "1": { story:`The Bootloader Blob camps on your USB bus and eats half-flashed .hex files.`,
           dialog:[`Blob: "Your code has… *gelatinous dependencies*."`,`You: "Cool. I’m about to *jellify* your HP bar."`] },
    "2": { story:`Randomizer Dice claims it landed on "sideways seven." Statistically rude.`,
           dialog:[`Dice: "I only lose one out of six times… per universe."`,`You: "Great. I brought six universes and a reset button."`] },
    "3": { story:`Condition Cat debugs by knocking variables off the table. if(cup==on_table) push(cup).`,
           dialog:[`Cat: "ELSE? I hardly know her."`,`You: "Meow if you’re ready to evaluate claws > face."`] },
    "4": { story:`Threshold Troll lives under if-statements and shouts "TOO LOW!" at innocent sensors.`,
           dialog:[`Troll: "None shall pass below 100!"`,`You: "I’ve got 99 problems and this troll is one."`] },
    "5": { story:`Loop Goblin winds gears and steals semicolons. Iterates until morale improves.`,
           dialog:[`Goblin: "FOR-EVER! FOR-EVER!"`,`You: "break; // mentally and literally"`] },
    "6": { story:`Sprite Specter haunts the 5×5 grid—diagonal when you wanted horizontal.`,
           dialog:[`Specter: "Booolean logic scares me."`,`You: "Good. I brought XOR-cise equipment."`] }
  };

  function initGame(){
    /* Stage + HUD refs */
    const stageEl      = byId('stage');
    const bossImg      = byId('bossSprite');
    const bossName     = byId('bossName');
    const stageOverlay = byId('stageOverlay');
    const matrixCanvas = byId('matrixCanvas');

    const heartsEl     = byId('hearts');
    const hpFill       = byId('hp');
    const hpCount      = byId('hpCount');
    const streakPill   = byId('streak');
    const scorePill    = byId('scorePill');
    const timerPill    = byId('timer');
    const hintLeftPill = byId('hintLeft');
    const starsPill    = byId('stars');
    const progressPill = byId('progress-pill');

    /* Q panel */
    const qpanel = byId('qpanel');

    /* Intro modal refs */
    const introImg   = byId('introBossImg');
    const introTitle = byId('introTitle');
    const introTag   = byId('introTag');
    const introStory = byId('introStory');
    const introStart = byId('introStart');
    const introComic = byId('introComic');

    /* Top controls */
    byId('reset').onclick   = reset;
    byId('quit').onclick    = onQuit;
    byId('useHint').onclick = onUseHint;
    byId('back').onclick    = () => showLevels();
    byId('retry').onclick   = () => startLevel(G.id);

    const DATA  = window.TTC_DATA;
    const SKEY  = 'ttcBossBattle_arcade_v6_8';
    const state = loadState();

    function loadState(){
      let s={unlocked:['1'],stars:0,clears:{},settings:{timer:true}};
      try{ const raw=localStorage.getItem(SKEY); if(raw) Object.assign(s, JSON.parse(raw)); }catch(e){}
      return s;
    }
    function save(){ localStorage.setItem(SKEY, JSON.stringify(state)); }
    function reset(){ localStorage.removeItem(SKEY); location.reload(); }

    /* Toast */
    function toast(msg){ const t=byId('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1200); }

    /* Callouts under the question title */
    function clearCallout(){ byId('callout')?.remove(); }
    function renderCallout(kind, html){
      let div = byId('callout');
      if(!div){
        div = document.createElement('div'); div.id='callout';
        const title = qpanel.querySelector('h2');
        (title?.parentNode||qpanel).insertBefore(div, title?.nextSibling||qpanel.firstChild);
      }
      div.className = `callout callout--${kind} callout-appear`;
      div.innerHTML = html;
    }

    /* Minimal SFX */
    const ACtx = window.AudioContext || window.webkitAudioContext;
    const ctx  = ACtx ? new ACtx() : null;
    function beep(freq=440, dur=.08, type='square', vol=.05){
      if(!ctx) return; const o=ctx.createOscillator(), g=ctx.createGain();
      o.type=type; o.frequency.value=freq; g.gain.value=vol;
      o.connect(g); g.connect(ctx.destination);
      o.start(); setTimeout(()=>o.stop(), dur*1000);
    }

    /* Matrix rain */
    let matrix=null;
    function startMatrix(){
      const c=matrixCanvas; if(!c) return;
      const g=c.getContext('2d',{alpha:true});
      const FONT=36, COL=28, MIN=2, VAR=3, SKIP=2;
      let w=0,h=0,cols=0,drops=[];
      function size(){
        const r=stageEl.getBoundingClientRect();
        c.width=Math.floor(r.width); c.height=Math.floor(r.height);
        w=c.width; h=c.height; cols=Math.max(1,Math.floor(w/COL));
        drops=new Array(cols).fill(0).map(()=>Math.random()*h);
        g.font=`${FONT}px VT323, monospace`;
      }
      size(); window.addEventListener('resize', size);
      let raf,frame=0;
      function tick(){
        frame=(frame+1)%SKIP; if(frame!==0){ raf=requestAnimationFrame(tick); return; }
        g.fillStyle='rgba(8,12,26,0.18)'; g.fillRect(0,0,w,h);
        for(let i=0;i<cols;i++){
          const x=i*COL, y=drops[i], ch=String((Math.random()*10)|0);
          g.fillStyle='rgba(140,255,170,0.85)'; g.fillText(ch,x,y);
          drops[i] = y>h ? 0 : y + (MIN + Math.random()*VAR);
        }
        raf=requestAnimationFrame(tick);
      }
      tick(); matrix={ stop:()=>cancelAnimationFrame(raf) };
    }

    /* Level select cards */
    function renderLevels(){
      screenLevels.innerHTML='';
      const ids = Object.keys(DATA.weeks).sort((a,b)=>(+a)-(+b));
      const cleared = Object.keys(state.clears).length;
      starsPill.textContent   = `⭐ ${state.stars}`;
      progressPill.textContent= `Progress: ${cleared}/${ids.length}`;

      ids.forEach(id=>{
        const w=DATA.weeks[id], locked=!state.unlocked.includes(id)&&!w.forceUnlock;
        const total=(w.questions||[]).length;
        const card=document.createElement('div'); card.className='card';
        card.innerHTML = `
          <h3>${w.title||`Week ${id}`}</h3>
          <div class="small">${w.description||''}</div>
          <div class="row">
            <span class="tag">${total} Qs</span>
            ${state.clears[id]?`<span class="tag">Cleared ✓</span>`:''}
            ${locked?`<span class="lock">🔒 Locked</span>`:`<span class="spacer"></span>`}
          </div>
          <div class="row">
            <button ${locked?'disabled class="ghost"':''} data-id="${id}">${state.clears[id]?'Replay':'Start'}</button>
          </div>`;
        screenLevels.appendChild(card);
      });
    }

    /* Delegated start (never stale) */
    document.addEventListener('click', (e)=>{
      const b=e.target.closest('#screen-levels button[data-id]');
      if(!b) return;
      if (b.disabled){
        b.classList.add('shake-deny'); setTimeout(()=>b.classList.remove('shake-deny'),400);
        return;
      }
      openIntro(b.dataset.id);
    });

    function openIntro(id){
      const w=DATA.weeks[id], sb=STORY_BOOK[id]||{};
      const story  = w.story  || sb.story  || 'Time to face this week’s boss!';
      const dialog = w.dialog || sb.dialog || [`Boss: "…"`,`You: "…"`];
      introImg.src = w.bossImage || `assets/w${id}b.png`;
      introTitle.textContent = w.title || `Week ${id}`;
      introTag.textContent   = w.description || '';
      introStory.textContent = story;
      introComic.innerHTML = `
        <div class="comic">
          <img class="portrait" src="${w.bossImage || `assets/w${id}b.png`}" alt="">
          <div class="bubbles">
            <div class="bubble boss">${dialog[0]}</div>
            <div class="bubble me">${dialog[1]}</div>
          </div>
        </div>`;
      introStart.onclick = () => startLevel(id);
      screenLevels.style.display='none'; screenIntro.style.display='';
    }

    /* Runtime state */
    let G=null;

    function startLevel(id){
      const w=DATA.weeks[id], qs=(w.questions||[]).slice();
      if(!qs.length){ alert('No questions in this week.'); showLevels(); return; }
      G={ id, w, questions:qs,
          heartsMax:3, hearts:3,
          hpMax:qs.length, hp:qs.length,
          score:0, SCORE_PER_CORRECT:100,
          hints:3, hintUsedThisQuestion:false, correctForHintCounter:0,
          idx:0, streak:0, incorrect:[], runStart:Date.now(), waitingNext:false };

      setBossAppearance(w,id); renderHUD();
      stageOverlay.hidden=true; stageOverlay.innerHTML='';
      matrix?.stop?.(); startMatrix();

      screenIntro.style.display='none'; screenGame.style.display='';
      nextQuestion();
    }

    function setBossAppearance(week,id){
      bossName.textContent=week.bossName||'BOSS';
      bossImg.src=week.bossImage||`assets/w${id}b.png`;
      bossImg.style.opacity='1';
      document.documentElement.style.setProperty('--accent', week.bossTint || '#7bd3ff');
    }

    /* ====== FX (amped up) ====== */
    function bossShowState(stateStr){
      if(stateStr==='hit'){
        // stronger random knock + quick bounce-back
        const dx=(Math.random()*84-42)|0;   // ±42px
        const dy=(Math.random()*48-24)|0;   // ±24px
        const dr=(Math.random()*44-22).toFixed(1)+'deg'; // ±22°
        bossImg.style.setProperty('--hitX', dx+'px');
        bossImg.style.setProperty('--hitY', dy+'px');
        bossImg.style.setProperty('--hitR', dr);
        bossImg.classList.remove('boss-bounce'); void bossImg.offsetWidth;
        bossImg.classList.add('boss-bounce');
        // brief stage flash
        stageEl.classList.add('boss--hit');
        setTimeout(()=>stageEl.classList.remove('boss--hit'), 280);
      } else if(stateStr==='dead'){
        // let CSS handle roll-out, we just mark the stage
        stageEl.classList.add('boss--dead');
      } else {
        stageEl.classList.remove('boss--hit','boss--dead');
      }
    }

    function playerHitFX(){
      // screen flash + heavier shake + boss lunge
      stageEl.classList.add('player-hit','shake');
      bossImg.classList.remove('boss-lunge'); void bossImg.offsetWidth;
      bossImg.classList.add('boss-lunge');
      setTimeout(()=>{ stageEl.classList.remove('player-hit','shake'); bossImg.classList.remove('boss-lunge'); }, 380);
    }

    /* HUD */
    function renderHUD(){
      const HEART_ON  = '<svg viewBox="0 0 16 14"><path class="heart-fill" d="M8 13s-3.2-2.3-5.1-4.2C1.5 7.4 1 6.3 1 5.1 1 3.4 2.4 2 4.1 2c1.1 0 2.1.6 2.7 1.5C7.4 2.6 8.4 2 9.5 2 11.2 2 12.6 3.4 12.6 5.1c0 1.2-.5 2.3-1.9 3.7C11.2 9.2 8 13 8 13z"/></svg>';
      const HEART_OFF = '<svg viewBox="0 0 16 14"><path class="heart-off" d="M8 13s-3.2-2.3-5.1-4.2C1.5 7.4 1 6.3 1 5.1 1 3.4 2.4 2 4.1 2c1.1 0 2.1.6 2.7 1.5C7.4 2.6 8.4 2 9.5 2 11.2 2 12.6 3.4 12.6 5.1c0 1.2-.5 2.3-1.9 3.7C11.2 9.2 8 13 8 13z"/></svg>';
      heartsEl.innerHTML=''; for(let i=0;i<G.heartsMax;i++) heartsEl.insertAdjacentHTML('beforeend', i<G.hearts?HEART_ON:HEART_OFF);

      const pct=(G.hp/G.hpMax)*100; hpFill.style.width=`${Math.max(0,Math.min(100,pct))}%`;
      hpCount.textContent=`(${G.hp}/${G.hpMax})`;

      streakPill.textContent=`Streak: ${G.streak}`;
      scorePill.textContent =`Score: ${G.score}`;
      timerPill.textContent  = state.settings.timer ? `⏱️ ${Math.floor((Date.now()-G.runStart)/1000)}s` : '⏱️ off';
      hintLeftPill.textContent=`⭐ Hints: ${G.hints}`;

      const useHint=byId('useHint');
      if (G.hints<=0 || G.hintUsedThisQuestion || !G.current?.hint){ useHint.disabled=true; useHint.classList.add('hintlock'); }
      else { useHint.disabled=false; useHint.classList.remove('hintlock'); }
    }

    /* "+1 Hint" floaty */
    function showHintFloaty(){
      const btn = byId('useHint'); if(!btn) return;
      const rect = btn.getBoundingClientRect();
      const el = document.createElement('div');
      el.className = 'floaty';
      el.textContent = '+1 Hint!';
      el.style.left = (rect.left + rect.width/2 - 40) + 'px';
      el.style.top  = (window.scrollY + rect.top - 10) + 'px';
      document.body.appendChild(el);
      setTimeout(()=>el.remove(), 950);
    }

    /* Next button: inline below the callout (no footer bar) */
    function ensureNextRow(){
      let row = qpanel.querySelector('.q-nextrow');
      if (!row){
        row = document.createElement('div');
        row.className = 'q-nextrow row';
        row.innerHTML = `<div class="spacer"></div><button id="nextBtn">Next ▶</button>`;
      }
      return row;
    }
    function showNextBtn(){
      const callout = byId('callout');
      const row = ensureNextRow();
      if (callout) callout.insertAdjacentElement('afterend', row);
      else qpanel.appendChild(row);
      row.style.display='flex';
      row.querySelector('#nextBtn').onclick = onNext;
    }
    function hideNextBtn(){
      const row = qpanel.querySelector('.q-nextrow');
      if (row) row.style.display='none';
    }

    /* Questions */
    function nextQuestion(){
      const q=(G.current=G.questions[G.idx]);
      G.hintUsedThisQuestion=false; clearCallout(); G.waitingNext=false;
      hideNextBtn();

      if(!q){ finishOrFlee(); return; }

      let html = `<div class="row"><div class="tag">Q ${G.idx+1}/${G.questions.length}</div></div>
                  <h2>${q.question}</h2>`;
      if(q.code) html+=`<div class="qcode">${q.code}</div>`;

      if(q.type==='multiple-choice'){
        html+=`<div class="options" id="opts"></div>`; qpanel.innerHTML=html;
        const opts=byId('opts');
        q.options.forEach((opt,i)=>{ const b=document.createElement('button'); b.textContent=opt; b.onclick=()=>answerMC(i); opts.appendChild(b); });
      } else if(q.type==='drag-drop'){
        const terms=q.terms.slice(), defs=q.definitions.slice(); shuffle(terms); shuffle(defs);
        html+=`<div class="drag-wrap">
                 <div><strong>Terms</strong><div class="tiles" id="tiles"></div></div>
                 <div><strong>Definitions</strong><div class="buckets" id="buckets"></div></div>
               </div>
               <div class="row" style="margin-top:10px; justify-content:flex-end"><button id="submitDD">Submit</button></div>`;
        qpanel.innerHTML=html;

        const tilesEl=byId('tiles'), bucketsEl=byId('buckets'), submitBtn=byId('submitDD');
        const tileByTerm=new Map(), assignment=new Map(); // Map<bucketEl, termOrEmpty>

        // tiles
        function makeTile(term){
          const t=document.createElement('div');
          t.className='tile'; t.textContent=term; t.draggable=true; t.dataset.term=term;
          t.ondragstart = e => e.dataTransfer.setData('text/plain', term);
          return t;
        }
        terms.forEach(term=>{ const t=makeTile(term); tileByTerm.set(term,t); tilesEl.appendChild(t); });

        // buckets accept
        defs.forEach(def=>{
          const b=document.createElement('div'); b.className='bucket'; b.dataset.def=def;
          b.innerHTML=`<div>${def}</div><div class="chosen small"></div>`;
          b.ondragover=e=>e.preventDefault();
          b.ondrop=e=>{
            e.preventDefault();
            if(submitBtn.style.display==='none') return;
            const dropped=e.dataTransfer.getData('text/plain'); if(!dropped) return;

            // clear any other bucket that holds this term
            bucketsEl.querySelectorAll('.bucket').forEach(other=>{
              if (other.dataset.term === dropped){
                assignment.set(other,''); other.dataset.term=''; other.querySelector('.chosen').textContent='';
                other.classList.remove('correct','wrong');
              }
            });

            assignment.set(b, dropped);
            b.dataset.term = dropped;
            b.querySelector('.chosen').textContent = dropped;
            b.classList.remove('correct','wrong');
          };
          bucketsEl.appendChild(b); assignment.set(b,'');
        });

        // drop back on tiles to unassign
        tilesEl.ondragover=e=>e.preventDefault();
        tilesEl.ondrop=e=>{
          e.preventDefault();
          if(submitBtn.style.display==='none') return;
          const dropped=e.dataTransfer.getData('text/plain'); if(!dropped) return;
          bucketsEl.querySelectorAll('.bucket').forEach(other=>{
            if (other.dataset.term === dropped){
              assignment.set(other,''); other.dataset.term=''; other.querySelector('.chosen').textContent='';
              other.classList.remove('correct','wrong');
            }
          });
        };

        // lock after submit
        function lockDD(){
          tilesEl.querySelectorAll('.tile').forEach(t=>t.draggable=false);
          bucketsEl.querySelectorAll('.bucket').forEach(b=>{ b.classList.add('locked'); b.ondragover=null; b.ondrop=null; });
          tilesEl.ondragover = tilesEl.ondrop = null;
          submitBtn.style.display='none';
        }

        // check
        submitBtn.onclick=()=>{
          const expectedByDef={}; q.correctMatches.forEach((defIdx,termIdx)=>{ expectedByDef[q.definitions[defIdx]]=q.terms[termIdx]; });
          let all=true; bucketsEl.querySelectorAll('.bucket').forEach(b=>{
            const d=b.dataset.term||'', e=expectedByDef[b.dataset.def]||''; b.classList.remove('correct','wrong');
            if(d && d===e) b.classList.add('correct'); else { b.classList.add('wrong'); all=false; }
          });
          lockDD(); settleAnswer(all, q.explanation||'');
        };
      } else {
        qpanel.innerHTML=html+`<div class="note">Unsupported question type: ${q.type}</div>`;
      }

      renderHUD();
    }

    function answerMC(i){
      const q=G.current, opts=byId('opts').children;
      for(let k=0;k<opts.length;k++) opts[k].disabled=true;
      const correct=(i===q.correct);
      const addBadge=(btn,good)=>{ const b=document.createElement('span'); b.className=`answer-badge ${good?'good':'bad'}`; b.textContent=good?'✓':'✗'; btn.appendChild(b); };
      if(correct){ opts[i].classList.add('good'); addBadge(opts[i],true); }
      else { opts[i].classList.add('bad'); if(typeof q.correct==='number' && opts[q.correct]){ opts[q.correct].classList.add('good'); addBadge(opts[q.correct],true); } }
      settleAnswer(correct, q.explanation||'');
    }

    /* Settle answer + decide what to show next */
    function settleAnswer(correct, explanation){
      if(correct){
        G.streak++; G.score+=G.SCORE_PER_CORRECT; G.hp=Math.max(0,G.hp-1);
        renderCallout('good', `<span class="title">✅ Correct!</span> ${explanation||''}`);
        bossShowState('hit');               // <<< bounce (amped)
        beep(660,.07); setTimeout(()=>beep(880,.06), 70);
        if(++G.correctForHintCounter>=3){ G.hints++; G.correctForHintCounter-=3; showHintFloaty(); toast('⭐ Bonus hint!'); }
      }else{
        G.incorrect.push({ q:G.current }); G.streak=0; G.hearts=Math.max(0,G.hearts-1);
        renderCallout('bad', `<span class="title">❌ Not quite.</span> ${explanation||''}`);
        playerHitFX();                      // <<< lunge + flash + shake
        beep(220,.12,'sawtooth');
      }
      renderHUD();

      if(G.hearts<=0){ showOverlay(true); return; }
      if(G.hp<=0){
        bossImg.classList.add('boss-roll-out');   // CSS handles big dramatic exit
        bossImg.addEventListener('animationend',()=>showOverlay(false),{once:true});
        return;
      }

      // If this was the LAST question, finish immediately (no Next button)
      if (G.idx >= G.questions.length - 1){ finishOrFlee(); return; }

      // Otherwise, show Next right under the explanation
      G.waitingNext=true; showNextBtn();
    }

    function onNext(){ if(!G || !G.waitingNext) return; G.idx++; nextQuestion(); }

    function finishOrFlee(){
      bossImg.classList.add('boss-roll-out');
      bossImg.addEventListener('animationend',()=>showOverlay(false, G.hp>0),{once:true});
    }

    function onUseHint(){
      if(!G) return; const q=G.current;
      if(G.hintUsedThisQuestion){ toast('Hint already used on this question.'); return; }
      if(G.hints<=0){ toast('No hints left. Earn more by answering 3 correctly.'); return; }
      if(!q || !q.hint){ toast('No hint for this one.'); return; }
      G.hints--; G.hintUsedThisQuestion=true;
      renderCallout('hint', `<span class="title">💡 Hint:</span> ${q.hint}`); renderHUD();
    }

    function showOverlay(gameOver, fled=false){
      const elapsedSec=Math.floor((Date.now()-G.runStart)/1000);
      const baseline=G.questions.length*12;
      const timeBonus=Math.max(0,(baseline-elapsedSec)*5);
      const finalScore = G.score + (gameOver?0:timeBonus);

      let summary='';
      if(gameOver){
        summary = `<h3>Game Over</h3><div class="meta">You reached question ${G.idx+1} of ${G.questions.length}. Time: ${elapsedSec}s</div>`;
      }else{
        const perfect=(G.incorrect.length===0 && G.hearts>0);
        const earnedStars = fled ? 0 : (perfect?2:1);
        state.stars += earnedStars; state.clears[G.id]=true;
        const ids=Object.keys(window.TTC_DATA.weeks).sort((a,b)=>(+a)-(+b));
        const nextIdx=ids.indexOf(G.id)+1;
        if(ids[nextIdx] && !state.unlocked.includes(ids[nextIdx])) state.unlocked.push(ids[nextIdx]);
        save();

        summary = `
          <h3>${fled ? 'Boss Fled!' : 'Level Complete! 🎉'}</h3>
          <div class="meta">
            ${fled ? 'The boss escaped while you regrouped.' : `Boss defeated with <strong>${G.hearts}</strong> heart(s) left.`}<br>
            Score: <strong>${G.score}</strong> ${gameOver?'':`+ Time Bonus: <strong>${timeBonus}</strong> = <strong>${finalScore}</strong>`}<br>
            ${fled ? '⭐ <strong>0</strong> (try again for stars)' : `⭐ <strong>${earnedStars}</strong> ${perfect ? '(perfect clear!)' : ''}`} • Time: ${elapsedSec}s
          </div>`;
      }

      let review='';
      if(G.incorrect.length){
        let list='<ul class="review">';
        G.incorrect.forEach(({q})=>{ list+=`<li><strong>Q:</strong> ${q.question}<br><span class="small">${q.explanation||''}</span></li>`; });
        list+='</ul>';
        review = `<details><summary>Review explanations</summary>${list}</details>`;
      }else{
        review = `<details><summary>Review explanations</summary><div class="small">Flawless! Nothing to review.</div></details>`;
      }

      stageOverlay.innerHTML = `
        <div class="overlay-card">
          ${summary}
          ${review}
          <div class="row" style="margin-top:10px; justify-content:space-between">
            <button id="overlayNext">Back to Levels</button>
            <button id="overlayRetry">Replay</button>
          </div>
        </div>`;
      stageOverlay.hidden=false;

      byId('overlayNext').onclick=showLevels;
      byId('overlayRetry').onclick=()=>startLevel(G.id);
    }

    function onQuit(){ if(confirm('Quit this level? Progress for this run will be lost.')) showLevels(); }
    function showLevels(){
      screenIntro.style.display='none'; screenResults.style.display='none'; screenGame.style.display='none';
      screenLevels.style.display=''; stageOverlay.hidden=true; stageOverlay.innerHTML='';
      bossImg.classList.remove('boss-roll-out','boss-bounce','boss-lunge');
      matrix?.stop?.();
      renderLevels();
    }

    function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }

    /* Boot */
    renderLevels();
  }
})();
