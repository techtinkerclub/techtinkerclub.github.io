/* ===========================================================
   Tech Tinker Boss Battle — game.js (Arcade Build v6.5)
   Changes from v6.4:
   • Delegated Start handler (unbreakable even after re-render)
   • DnD submit button hides + locks after submit
   • HP/Hearts states stay consistent to the end
   • Matrix digits bigger/slower; wrong-answer shake/flash kept
   • Hint floaty (“+1 Hint!”) when earned
   =========================================================== */

(() => {
  const byId = (id) => document.getElementById(id);

  /* Screens */
  const screenLevels  = byId('screen-levels');
  const screenIntro   = byId('screen-intro');
  const screenGame    = byId('screen-game');
  const screenResults = byId('screen-results');

  /* Wait for data then boot */
  waitForData(initGame);
  function waitForData(cb, tries=0){
    if (window.TTC_DATA && window.TTC_DATA.weeks) return cb();
    if (tries>100){
      if (screenLevels){
        screenLevels.innerHTML = `<div class="card"><h3>Game data not loaded</h3><div class="small">
        Couldn’t find <code>window.TTC_DATA.weeks</code>. Make sure <code>questions.js</code> loads before <code>game.js</code>.
        </div></div>`;
      }
      return;
    }
    setTimeout(()=>waitForData(cb,tries+1),50);
  }

  /* ——— Default stories/dialogue if not provided in questions.js ——— */
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
      dialog:[`Goblin: "FOR-EVER! FOR-EVER!"`,`You: "break;  // mentally and literally"`] },
    "6": { story:`Sprite Specter haunts the 5×5 grid—diagonal when you wanted horizontal.`,
      dialog:[`Specter: "Booolean logic scares me."`,`You: "Good. I brought XOR-cise equipment."`] },
    "7": { story:`Sensor Slime tastes the light, the air… and your homework.`,
      dialog:[`Slime: "Mmm… ambient level 82 with hints of panic."`,`You: "Savor the aftertaste of defeat."`] },
    "8": { story:`Debug Duck stares until your bug confesses. Quacks are peer-reviewed.`,
      dialog:[`Duck: "Quack? (Explain your code, slowly.)"`,`You: "It was the off-by-one in the while loop! Happy?"`] },
    "9": { story:`Voltage Vampire bills you for current you supplied. Won’t ground itself.`,
      dialog:[`Vampire: "I vant to sip your milliamp!"`,`You: "Stakeholder meeting in 3… 2… 1…" `] },
    "10": { story:`Data Djinn appears when you rub a USB cable; grants three parse errors.`,
      dialog:[`Djinn: "Your wish is my parse error."`,`You: "Then I wish for three correct answers in a row."`] },
    "11": { story:`Logic Lord speaks only in truth tables. Sometimes he lies about that.`,
      dialog:[`Lord: "All knights lie, including this sentence."`,`You: "Then it’s TRUE you’re going down."`] },
    "12": { story:`Firmware Pharaoh woke after 3,000 years to… a pending update. Declines release notes.`,
      dialog:[`Pharaoh: "Entombed with v0.9.0-alpha."`,`You: "Prepare for 1.0.0-mummy. Breaking changes."`] },
    "13": { story:`Debug Dragon hoards stack traces and breathes spicy exceptions. May seg-fault reality.`,
      dialog:[`Dragon: "You dare arrive with untested code?"`,`You: "I tested the tests. Roll initiative."`] },
  };

  function initGame(){
    /* Stage */
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

    /* Q area */
    const qpanel   = byId('qpanel');
    const navRow   = byId('navRow');
    const nextBtn  = byId('nextBtn');

    /* Intro */
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
    nextBtn.onclick         = onNext;

    const DATA  = window.TTC_DATA;
    const SKEY  = 'ttcBossBattle_arcade_v6_5';
    const state = loadState();

    function loadState(){ 
      let s={unlocked:['1'],stars:0,clears:{},settings:{timer:true}};
      try{ const raw=localStorage.getItem(SKEY); if(raw) Object.assign(s,JSON.parse(raw)); }catch(e){}
      return s;
    }
    function save(){ localStorage.setItem(SKEY, JSON.stringify(state)); }
    function reset(){ localStorage.removeItem(SKEY); location.reload(); }

    /* Tiny toast */
    function toast(msg){ const t=byId('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1200); }

    /* Callouts under question title */
    function renderCallout(kind, html){
      let div = byId('callout');
      if(!div){
        div=document.createElement('div'); div.id='callout';
        const title=qpanel.querySelector('h2'); (title?.parentNode||qpanel).insertBefore(div, title?.nextSibling||qpanel.firstChild);
      }
      div.className=`callout callout--${kind} callout-appear`;
      div.innerHTML=html;
    }
    function clearCallout(){ byId('callout')?.remove(); }

    /* Minimal SFX */
    const ACtx = window.AudioContext || window.webkitAudioContext;
    const ctx  = ACtx ? new ACtx() : null;
    function beep(freq=440, dur=.08, type='square', vol=.05){
      if(!ctx) return; const o=ctx.createOscillator(), g=ctx.createGain();
      o.type=type; o.frequency.value=freq; g.gain.value=vol;
      o.connect(g); g.connect(ctx.destination); o.start(); setTimeout(()=>o.stop(), dur*1000);
    }

    /* Matrix rain — larger/slower */
    let matrix=null;
    function startMatrix(){
      const c = matrixCanvas; if(!c) return;
      const g = c.getContext('2d',{alpha:true});
      const FONT_PX=36, COL_W=28, FALL_MIN=2, FALL_VAR=3, FRAME_SKIP=2;
      let w=0,h=0,cols=0,drops=[];
      function size(){
        const r=stageEl.getBoundingClientRect();
        c.width=Math.max(1,Math.floor(r.width));
        c.height=Math.max(1,Math.floor(r.height));
        w=c.width; h=c.height;
        cols=Math.max(1,Math.floor(w/COL_W));
        drops=new Array(cols).fill(0).map(()=>Math.random()*h);
        g.font=`${FONT_PX}px VT323, monospace`;
      }
      size(); setTimeout(size,0);
      const res=()=>size(); window.addEventListener('resize',res);
      let raf,frame=0;
      function tick(){
        frame=(frame+1)%FRAME_SKIP; if(frame!==0){ raf=requestAnimationFrame(tick); return; }
        g.fillStyle='rgba(8,12,26,0.18)'; g.fillRect(0,0,w,h);
        for(let i=0;i<cols;i++){
          const ch=String((Math.random()*10)|0), x=i*COL_W, y=drops[i];
          g.fillStyle='rgba(140,255,170,0.85)'; g.fillText(ch,x,y);
          drops[i]= y>h ? 0 : y + (FALL_MIN + Math.random()*FALL_VAR);
        }
        raf=requestAnimationFrame(tick);
      }
      tick();
      matrix={ stop:()=>cancelAnimationFrame(raf), off:()=>window.removeEventListener('resize',res) };
    }

    /* Level select */
    function renderLevels(){
      screenLevels.innerHTML='';
      const ids=Object.keys(DATA.weeks).sort((a,b)=>(+a)-(+b));
      const cleared=Object.keys(state.clears).length;
      starsPill.textContent=`⭐ ${state.stars}`;
      progressPill.textContent=`Progress: ${cleared}/${ids.length}`;

      ids.forEach(id=>{
        const w=DATA.weeks[id];
        const locked=!state.unlocked.includes(id)&&!w.forceUnlock;
        const total=(w.questions||[]).length;

        const card=document.createElement('div'); card.className='card';
        card.innerHTML=`<h3>${w.title||`Week ${id}`}</h3>
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

      // Direct binding (kept) — plus delegated fallback below
      screenLevels.querySelectorAll('button[data-id]')
        .forEach(b=> b.addEventListener('click',()=>openIntro(b.dataset.id)));
    }

    // Delegated fallback (never goes stale)
    document.addEventListener('click', (e)=>{
      const b=e.target.closest('#screen-levels button[data-id]');
      if(!b) return;
      if (b.disabled) {
        b.classList.add('shake-deny');
        setTimeout(()=>b.classList.remove('shake-deny'),400);
        return;
      }
      openIntro(b.dataset.id);
    });

    function openIntro(id){
      const w = DATA.weeks[id];
      const sb = STORY_BOOK[id] || {};
      const story  = w.story  || sb.story  || 'Time to face this week’s boss!';
      const dialog = w.dialog || sb.dialog || [`Boss: "…"` , `You: "…"`];

      introImg.src = w.bossImage || `assets/w${id}b.png`;
      introTitle.textContent = w.title || `Week ${id}`;
      introTag.textContent   = w.description || '';
      introStory.textContent = story;

      introComic.innerHTML = `
        <div class="comic">
          <img class="portrait" src="${w.bossImage || `assets/w${id}b.png`}" alt="boss">
          <div class="bubbles">
            <div class="bubble boss">${dialog[0]||''}</div>
            <div class="bubble me">${dialog[1]||''}</div>
          </div>
        </div>`;

      introStart.onclick=()=>startLevel(id);
      screenLevels.style.display='none'; screenResults.style.display='none'; screenGame.style.display='none'; screenIntro.style.display='';
    }

    /* Runtime state */
    let G=null;

    function startLevel(id){
      const w=DATA.weeks[id];
      const questions=(w.questions||[]).slice();
      if(!questions.length){ alert('No questions in this week.'); showLevels(); return; }

      G={ id, w, questions,
          heartsMax:3, hearts:3,
          hpMax:questions.length, hp:questions.length,
          score:0, SCORE_PER_CORRECT:100,
          hints:3, hintUsedThisQuestion:false, correctForHintCounter:0,
          idx:0, streak:0, incorrect:[], runStart:Date.now(), waitingNext:false };

      setBossAppearance(w,id); renderHUD();
      stageOverlay.hidden=true; stageOverlay.innerHTML='';
      matrix?.stop?.(); matrix?.off?.(); startMatrix();

      screenIntro.style.display='none'; screenResults.style.display='none'; screenGame.style.display='';
      navRow.style.display='none'; nextQuestion();
    }

    function setBossAppearance(week,id){
      bossName.textContent=week.bossName||'BOSS';
      bossImg.src=week.bossImage||`assets/w${id}b.png`;
      stageEl.classList.remove('boss--hit','boss--dead');
      bossImg.classList.remove('boss-bounce','boss-roll-out','boss-lunge');
      bossImg.style.opacity='1';
      document.documentElement.style.setProperty('--accent', week.bossTint || '#7bd3ff');
    }

    function renderHUD(){
      const HEART_ON='<svg viewBox="0 0 16 14"><path class="heart-fill" d="M8 13s-3.2-2.3-5.1-4.2C1.5 7.4 1 6.3 1 5.1 1 3.4 2.4 2 4.1 2c1.1 0 2.1.6 2.7 1.5C7.4 2.6 8.4 2 9.5 2 11.2 2 12.6 3.4 12.6 5.1c0 1.2-.5 2.3-1.9 3.7C11.2 9.2 8 13 8 13z"/></svg>';
      const HEART_OFF='<svg viewBox="0 0 16 14"><path class="heart-off" d="M8 13s-3.2-2.3-5.1-4.2C1.5 7.4 1 6.3 1 5.1 1 3.4 2.4 2 4.1 2c1.1 0 2.1.6 2.7 1.5C7.4 2.6 8.4 2 9.5 2 11.2 2 12.6 3.4 12.6 5.1c0 1.2-.5 2.3-1.9 3.7C11.2 9.2 8 13 8 13z"/></svg>';
      heartsEl.innerHTML=''; for(let i=0;i<G.heartsMax;i++) heartsEl.insertAdjacentHTML('beforeend', i<G.hearts?HEART_ON:HEART_OFF);

      const pct=(G.hp/G.hpMax)*100;
      if (G.hp<=0){ hpFill.classList.add('empty'); hpFill.style.width='0%'; }
      else { hpFill.classList.remove('empty'); hpFill.style.width = `${Math.max(0,Math.min(100,pct))}%`; }
      hpCount.textContent=`(${G.hp}/${G.hpMax})`;

      streakPill.textContent=`Streak: ${G.streak}`;
      scorePill.textContent=`Score: ${G.score}`;
      hintLeftPill.textContent=`⭐ Hints: ${G.hints}`;
      timerPill.textContent = state.settings.timer ? `⏱️ ${Math.max(0, Math.floor((Date.now()-G.runStart)/1000))}s` : '⏱️ off';

      const useHint=byId('useHint');
      if (G.hints<=0 || G.hintUsedThisQuestion || !G.current?.hint){ useHint.disabled=true; useHint.classList.add('hintlock'); }
      else { useHint.disabled=false; useHint.classList.remove('hintlock'); }
    }
    setInterval(()=>{ if(screenGame.style.display!=='none' && state.settings.timer) renderHUD(); },500);

    /* Boss FX */
    function bossShowState(stateStr){
      if(stateStr==='hit'){
        stageEl.classList.add('boss--hit');
        const dx=(Math.random()*48-24)|0, dy=(Math.random()*28-14)|0, dr=(Math.random()*24-12).toFixed(1)+'deg';
        bossImg.style.setProperty('--hitX', dx+'px'); bossImg.style.setProperty('--hitY', dy+'px'); bossImg.style.setProperty('--hitR', dr);
        bossImg.classList.remove('boss-bounce'); void bossImg.offsetWidth; bossImg.classList.add('boss-bounce');
        setTimeout(()=>stageEl.classList.remove('boss--hit'),250);
      } else if(stateStr==='dead'){ stageEl.classList.add('boss--dead'); }
      else { stageEl.classList.remove('boss--hit','boss--dead'); }
    }

    /* Wrong answer FX (screen flash + lunge + shake) */
    function playerHitFX(){
      stageEl.classList.add('player-hit','shake');
      bossImg.classList.remove('boss-lunge'); void bossImg.offsetWidth;
      bossImg.classList.add('boss-lunge');
      setTimeout(()=>{ stageEl.classList.remove('player-hit','shake'); bossImg.classList.remove('boss-lunge'); }, 320);
    }

    /* Hint floaty */
    function showHintFloaty(){
      const btn = byId('useHint'); if(!btn) return;
      const rect = btn.getBoundingClientRect();
      const el = document.createElement('div');
      el.className = 'floaty';
      el.textContent = '+1 Hint!';
      el.style.left = (rect.left + rect.width/2 - 40) + 'px';
      el.style.top  = (window.scrollY + rect.top - 10) + 'px';
      document.body.appendChild(el);
      setTimeout(()=>el.remove(), 900);
    }

    /* Questions flow */
    function nextQuestion(){
      const q=(G.current=G.questions[G.idx]);
      G.hintUsedThisQuestion=false; clearCallout(); navRow.style.display='none'; G.waitingNext=false;

      if(!q){ finishOrFlee(); return; }

      let html = `<div class="row"><div class="tag">Q ${G.idx+1} / ${G.questions.length}</div></div>
                  <h2 style="margin:6px 0 6px">${q.question}</h2>`;
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
        const tileByTerm=new Map(), assignment=new Map();

        function makeTile(term){ const t=document.createElement('div'); t.className='tile'; t.textContent=term; t.draggable=true; t.dataset.term=term; t.ondragstart=e=>e.dataTransfer.setData('text/plain',term); return t; }
        function getTile(term){ return tileByTerm.get(term); }
        function setBucketTerm(bucket,newTerm){
          const prev=assignment.get(bucket); if(prev && prev!==newTerm) getTile(prev)?.classList.remove('hidden');
          assignment.set(bucket,newTerm); bucket.dataset.term=newTerm||''; const c=bucket.querySelector('.chosen'); if(c) c.textContent=newTerm||'';
          if(newTerm){ getTile(newTerm)?.classList.add('hidden');
            document.querySelectorAll('.bucket').forEach(other=>{ if(other!==bucket && other.dataset.term===newTerm){ assignment.set(other,''); other.dataset.term=''; other.querySelector('.chosen').textContent=''; }});
          }
        }
        function lockDD(){
          tilesEl.querySelectorAll('.tile').forEach(t=>t.draggable=false);
          bucketsEl.querySelectorAll('.bucket').forEach(b=>{ b.classList.add('locked'); b.ondragover=null; b.ondrop=null; });
          submitBtn.style.display='none'; // hide after submit
        }

        terms.forEach(term=>{ const t=makeTile(term); tileByTerm.set(term,t); tilesEl.appendChild(t); });
        defs.forEach(def=>{
          const b=document.createElement('div'); b.className='bucket'; b.dataset.def=def;
          b.innerHTML=`<div>${def}</div><div class="chosen small"></div>`;
          b.ondragover=e=>e.preventDefault();
          b.ondrop=e=>{ e.preventDefault(); if(submitBtn.style.display==='none') return;
            const dropped=e.dataTransfer.getData('text/plain'); if(!dropped) return;
            const cur=assignment.get(b); if(cur && cur!==dropped) getTile(cur)?.classList.remove('hidden');
            setBucketTerm(b,dropped);
          };
          bucketsEl.appendChild(b); assignment.set(b,'');
        });

        submitBtn.onclick=()=>{
          const expectedByDef={}; q.correctMatches.forEach((defIdx,termIdx)=>{ expectedByDef[q.definitions[defIdx]]=q.terms[termIdx]; });
          let all=true; document.querySelectorAll('.bucket').forEach(b=>{
            const d=b.dataset.term||'', e=expectedByDef[b.dataset.def]||''; b.classList.remove('correct','wrong');
            if(d && d===e) b.classList.add('correct'); else { b.classList.add('wrong'); all=false; }
          });
          lockDD(); settleAnswer(all, q.explanation||'');
        };
      } else {
        qpanel.innerHTML=html+`<div class="note">Unsupported question type: ${q.type}</div>`;
        navRow.style.display='flex'; G.waitingNext=true;
      }

      renderHUD();
    }

    function answerMC(i){
      const q=G.current, opts=byId('opts').children; for(let k=0;k<opts.length;k++) opts[k].disabled=true;
      const correct=(i===q.correct);
      const addBadge=(btn,good)=>{ const b=document.createElement('span'); b.className=`answer-badge ${good?'good':'bad'}`; b.textContent=good?'✓':'✗'; btn.appendChild(b); };
      if(correct){ opts[i].classList.add('good'); addBadge(opts[i],true); }
      else { opts[i].classList.add('bad'); addBadge(opts[i],false); if(typeof q.correct==='number' && opts[q.correct]){ opts[q.correct].classList.add('good'); addBadge(opts[q.correct],true); } }
      settleAnswer(correct, q.explanation||'');
    }

    function settleAnswer(correct, explanation){
      if(correct){
        G.streak++; G.score+=G.SCORE_PER_CORRECT; G.hp=Math.max(0,G.hp-1);
        renderCallout('good', `<span class="title">✅ Correct!</span> ${explanation||''}`);
        bossShowState('hit'); beep(660,.07,'square'); setTimeout(()=>beep(880,.06,'square'),70);
        if(++G.correctForHintCounter>=3){ G.hints++; G.correctForHintCounter-=3; showHintFloaty(); toast('Bonus hint earned! ⭐'); }
      }else{
        G.incorrect.push({ q:G.current }); G.streak=0; G.hearts=Math.max(0,G.hearts-1);
        renderCallout('bad', `<span class="title">❌ Not quite.</span> ${explanation||''}`);
        beep(220,.12,'sawtooth'); toast('Ouch! You lost a heart 💔'); playerHitFX();
      }
      renderHUD();

      if(G.hearts<=0){ showOverlay(true); return; }
      if(G.hp<=0){ bossImg.classList.add('boss-roll-out'); bossImg.addEventListener('animationend',()=>showOverlay(false),{once:true}); return; }

      navRow.style.display='flex'; G.waitingNext=true;
    }

    function onNext(){ if(!G || !G.waitingNext) return; G.idx++; nextQuestion(); }

    function finishOrFlee(){
      if(G.hp<=0){ bossImg.classList.add('boss-roll-out'); bossImg.addEventListener('animationend',()=>showOverlay(false),{once:true}); }
      else { bossImg.classList.add('boss-roll-out'); bossImg.addEventListener('animationend',()=>showOverlay(false,true),{once:true}); }
    }

    function onUseHint(){
      if(!G) return; const q=G.current;
      if(G.hintUsedThisQuestion){ toast('Hint already used on this question.'); return; }
      if(G.hints<=0){ toast('No hints left. Earn more by answering 3 correctly.'); return; }
      if(!q || !q.hint){ toast('No hint for this one.'); return; }
      G.hints--; G.hintUsedThisQuestion=true; renderCallout('hint', `<span class="title">💡 Hint:</span> ${q.hint}`); renderHUD();
    }

    function showOverlay(gameOver, fled=false){
      matrix?.stop?.(); matrix?.off?.();
      if (gameOver) bossImg.style.opacity='0.3';

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
      bossImg.classList.remove('boss-bounce','boss-roll-out','boss-lunge');
      matrix?.stop?.(); matrix?.off?.();
      renderLevels();
    }

    function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }

    /* Boot */
    renderLevels();
  }
})();