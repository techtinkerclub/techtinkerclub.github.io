/* ===========================================================
   Tech Tinker Boss Battle — game.js (Arcade Build v6.7)
   Based on v6.6
   ✅ Fix: No Next button on final question
   ✅ Sticky footer (Next inside panel, never overlaps)
   ✅ DnD re-drag allowed before Submit
   ✅ Hint floaty, boss FX, consistent hearts/hp
   =========================================================== */

(() => {
  const byId = (id) => document.getElementById(id);

  const screenLevels  = byId('screen-levels');
  const screenIntro   = byId('screen-intro');
  const screenGame    = byId('screen-game');
  const screenResults = byId('screen-results');

  waitForData(initGame);
  function waitForData(cb, tries=0){
    if (window.TTC_DATA && window.TTC_DATA.weeks) return cb();
    if (tries>100){
      if (screenLevels){
        screenLevels.innerHTML = `<div class="card"><h3>Game data not loaded</h3>
        <div class="small">Couldn’t find <code>window.TTC_DATA.weeks</code>.</div></div>`;
      }
      return;
    }
    setTimeout(()=>waitForData(cb,tries+1),50);
  }

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
  };

  function initGame(){
    const stageEl = byId('stage'), bossImg = byId('bossSprite'), bossName = byId('bossName'),
          stageOverlay = byId('stageOverlay'), matrixCanvas = byId('matrixCanvas');
    const heartsEl = byId('hearts'), hpFill = byId('hp'), hpCount = byId('hpCount'),
          streakPill = byId('streak'), scorePill = byId('scorePill'),
          timerPill = byId('timer'), hintLeftPill = byId('hintLeft'),
          starsPill = byId('stars'), progressPill = byId('progress-pill'),
          qpanel = byId('qpanel');
    const introImg = byId('introBossImg'), introTitle = byId('introTitle'),
          introTag = byId('introTag'), introStory = byId('introStory'),
          introStart = byId('introStart'), introComic = byId('introComic');

    byId('reset').onclick = reset;
    byId('quit').onclick = onQuit;
    byId('useHint').onclick = onUseHint;
    byId('back').onclick = () => showLevels();
    byId('retry').onclick = () => startLevel(G.id);

    const DATA = window.TTC_DATA;
    const SKEY = 'ttcBossBattle_arcade_v6_7';
    const state = loadState();

    function loadState(){ 
      let s={unlocked:['1'],stars:0,clears:{},settings:{timer:true}};
      try{ const raw=localStorage.getItem(SKEY); if(raw) Object.assign(s,JSON.parse(raw)); }catch(e){}
      return s;
    }
    function save(){ localStorage.setItem(SKEY, JSON.stringify(state)); }
    function reset(){ localStorage.removeItem(SKEY); location.reload(); }

    const ACtx = window.AudioContext || window.webkitAudioContext;
    const ctx  = ACtx ? new ACtx() : null;
    function beep(freq=440,dur=.08,type='square',vol=.05){
      if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();
      o.type=type;o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(ctx.destination);
      o.start();setTimeout(()=>o.stop(),dur*1000);
    }

    function toast(msg){ const t=byId('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1200); }
    function clearCallout(){ byId('callout')?.remove(); }
    function renderCallout(kind,html){
      let d=byId('callout');
      if(!d){ d=document.createElement('div');d.id='callout';
        const t=qpanel.querySelector('h2');(t?.parentNode||qpanel).insertBefore(d,t?.nextSibling||qpanel.firstChild);}
      d.className=`callout callout--${kind} callout-appear`;d.innerHTML=html;
    }

    let matrix=null;
    function startMatrix(){
      const c=matrixCanvas;if(!c)return;const g=c.getContext('2d',{alpha:true});
      const FONT=36,CW=28,MIN=2,VAR=3,SKIP=2;let w=0,h=0,cols=0,drops=[];
      function size(){const r=stageEl.getBoundingClientRect();
        c.width=Math.floor(r.width);c.height=Math.floor(r.height);
        w=c.width;h=c.height;cols=Math.floor(w/CW);
        drops=new Array(cols).fill(0).map(()=>Math.random()*h);
        g.font=`${FONT}px VT323, monospace`;}
      size();window.addEventListener('resize',size);
      let raf,f=0;function tick(){f=(f+1)%SKIP;if(f!==0){raf=requestAnimationFrame(tick);return;}
        g.fillStyle='rgba(8,12,26,0.18)';g.fillRect(0,0,w,h);
        for(let i=0;i<cols;i++){const ch=String((Math.random()*10)|0),x=i*CW,y=drops[i];
          g.fillStyle='rgba(140,255,170,0.85)';g.fillText(ch,x,y);
          drops[i]=y>h?0:y+(MIN+Math.random()*VAR);}raf=requestAnimationFrame(tick);}
      tick();matrix={stop:()=>cancelAnimationFrame(raf)};}

    function renderLevels(){
      screenLevels.innerHTML='';
      const ids=Object.keys(DATA.weeks).sort((a,b)=>(+a)-(+b));
      const cleared=Object.keys(state.clears).length;
      starsPill.textContent=`⭐ ${state.stars}`;
      progressPill.textContent=`Progress: ${cleared}/${ids.length}`;
      ids.forEach(id=>{
        const w=DATA.weeks[id];const locked=!state.unlocked.includes(id)&&!w.forceUnlock;
        const total=(w.questions||[]).length;
        const c=document.createElement('div');c.className='card';
        c.innerHTML=`<h3>${w.title||`Week ${id}`}</h3><div class="small">${w.description||''}</div>
        <div class="row"><span class="tag">${total} Qs</span>
        ${state.clears[id]?`<span class="tag">Cleared ✓</span>`:''}
        ${locked?`<span class="lock">🔒 Locked</span>`:`<span class="spacer"></span>`}</div>
        <div class="row"><button ${locked?'disabled class="ghost"':''} data-id="${id}">${state.clears[id]?'Replay':'Start'}</button></div>`;
        screenLevels.appendChild(c);
      });
    }

    document.addEventListener('click',e=>{
      const b=e.target.closest('#screen-levels button[data-id]');if(!b)return;
      if(b.disabled){b.classList.add('shake-deny');setTimeout(()=>b.classList.remove('shake-deny'),400);return;}
      openIntro(b.dataset.id);
    });

    function openIntro(id){
      const w=DATA.weeks[id],s=STORY_BOOK[id]||{};
      const story=w.story||s.story||'Time to face this boss!';
      const dialog=w.dialog||s.dialog||[`Boss: "..."`,`You: "..."`];
      introImg.src=w.bossImage||`assets/w${id}b.png`;
      introTitle.textContent=w.title||`Week ${id}`;
      introTag.textContent=w.description||'';
      introStory.textContent=story;
      introComic.innerHTML=`<div class="comic"><img class="portrait" src="${w.bossImage||`assets/w${id}b.png`}" alt="">
      <div class="bubbles"><div class="bubble boss">${dialog[0]}</div><div class="bubble me">${dialog[1]}</div></div></div>`;
      introStart.onclick=()=>startLevel(id);
      screenLevels.style.display='none';screenIntro.style.display='';
    }

    let G=null;

    function startLevel(id){
      const w=DATA.weeks[id];const qs=(w.questions||[]).slice();
      if(!qs.length){alert('No questions');showLevels();return;}
      G={id,w,questions:qs,heartsMax:3,hearts:3,hpMax:qs.length,hp:qs.length,score:0,SCORE_PER_CORRECT:100,
         hints:3,hintUsedThisQuestion:false,correctForHintCounter:0,idx:0,streak:0,incorrect:[],runStart:Date.now(),waitingNext:false};
      setBossAppearance(w,id);renderHUD();
      stageOverlay.hidden=true;stageOverlay.innerHTML='';
      matrix?.stop?.();startMatrix();
      screenIntro.style.display='none';screenGame.style.display='';
      nextQuestion();
    }

    function setBossAppearance(w,id){
      bossName.textContent=w.bossName||'BOSS';
      bossImg.src=w.bossImage||`assets/w${id}b.png`;
      bossImg.style.opacity='1';
      document.documentElement.style.setProperty('--accent',w.bossTint||'#7bd3ff');
    }

    function renderHUD(){
      const HEART_ON='<svg viewBox="0 0 16 14"><path class="heart-fill" d="M8 13s-3.2-2.3-5.1-4.2C1.5 7.4 1 6.3 1 5.1 1 3.4 2.4 2 4.1 2c1.1 0 2.1.6 2.7 1.5C7.4 2.6 8.4 2 9.5 2 11.2 2 12.6 3.4 12.6 5.1c0 1.2-.5 2.3-1.9 3.7C11.2 9.2 8 13 8 13z"/></svg>';
      const HEART_OFF='<svg viewBox="0 0 16 14"><path class="heart-off" d="M8 13s-3.2-2.3-5.1-4.2C1.5 7.4 1 6.3 1 5.1 1 3.4 2.4 2 4.1 2c1.1 0 2.1.6 2.7 1.5C7.4 2.6 8.4 2 9.5 2 11.2 2 12.6 3.4 12.6 5.1c0 1.2-.5 2.3-1.9 3.7C11.2 9.2 8 13 8 13z"/></svg>';
      heartsEl.innerHTML='';for(let i=0;i<G.heartsMax;i++)heartsEl.insertAdjacentHTML('beforeend',i<G.hearts?HEART_ON:HEART_OFF);
      const pct=(G.hp/G.hpMax)*100;hpFill.style.width=`${Math.max(0,Math.min(100,pct))}%`;
      hpCount.textContent=`(${G.hp}/${G.hpMax})`;
      streakPill.textContent=`Streak: ${G.streak}`;
      scorePill.textContent=`Score: ${G.score}`;
      hintLeftPill.textContent=`⭐ Hints: ${G.hints}`;
      timerPill.textContent=`⏱️ ${Math.floor((Date.now()-G.runStart)/1000)}s`;
      const h=byId('useHint');
      if(G.hints<=0||G.hintUsedThisQuestion||!G.current?.hint){h.disabled=true;h.classList.add('hintlock');}
      else{h.disabled=false;h.classList.remove('hintlock');}
    }

    function ensureFooter(container){
      let f=container.querySelector('.q-footer');
      if(!f){f=document.createElement('div');f.className='q-footer';f.innerHTML=`<button id="nextBtn" class="nextBtn" style="display:none">Next ▶</button>`;container.appendChild(f);}
      return f;
    }
    function showNextBtn(){const b=qpanel.querySelector('#nextBtn');if(b)b.style.display='';qpanel.classList.add('qpanel-has-footer');}
    function hideNextBtn(){const b=qpanel.querySelector('#nextBtn');if(b)b.style.display='none';qpanel.classList.remove('qpanel-has-footer');}

    function nextQuestion(){
      const q=(G.current=G.questions[G.idx]);G.hintUsedThisQuestion=false;clearCallout();G.waitingNext=false;
      if(!q){finishOrFlee();return;}
      let html=`<div class="row"><div class="tag">Q ${G.idx+1}/${G.questions.length}</div></div><h2>${q.question}</h2>`;
      if(q.code)html+=`<div class="qcode">${q.code}</div>`;
      if(q.type==='multiple-choice'){
        html+=`<div class="options" id="opts"></div>`;qpanel.innerHTML=html;
        const o=byId('opts');q.options.forEach((opt,i)=>{const b=document.createElement('button');b.textContent=opt;b.onclick=()=>answerMC(i);o.appendChild(b);});
      }
      ensureFooter(qpanel);const n=qpanel.querySelector('#nextBtn');n.onclick=onNext;hideNextBtn();renderHUD();
    }

    function answerMC(i){
      const q=G.current,opts=byId('opts').children;for(let k=0;k<opts.length;k++)opts[k].disabled=true;
      const correct=(i===q.correct);
      if(correct){opts[i].classList.add('good');}else{opts[i].classList.add('bad');opts[q.correct]?.classList.add('good');}
      settleAnswer(correct,q.explanation||'');
    }

    /* --- FIXED settleAnswer (no Next after last question) --- */
    function settleAnswer(correct,explanation){
      if(correct){
        G.streak++;G.score+=G.SCORE_PER_CORRECT;G.hp=Math.max(0,G.hp-1);
        renderCallout('good',`<span class="title">✅ Correct!</span> ${explanation||''}`);beep(660,.07);
        if(++G.correctForHintCounter>=3){G.hints++;G.correctForHintCounter-=3;toast('⭐ Bonus hint!');}
      }else{
        G.incorrect.push({q:G.current});G.streak=0;G.hearts=Math.max(0,G.hearts-1);
        renderCallout('bad',`<span class="title">❌ Not quite.</span> ${explanation||''}`);beep(220,.12);
      }
      renderHUD();

      if(G.hearts<=0){showOverlay(true);return;}
      if(G.hp<=0){bossImg.classList.add('boss-roll-out');bossImg.addEventListener('animationend',()=>showOverlay(false),{once:true});return;}

      // ✅ End immediately if last question
      if(G.idx >= G.questions.length-1){finishOrFlee();return;}

      G.waitingNext=true;showNextBtn();
    }

    function onNext(){if(!G||!G.waitingNext)return;G.idx++;nextQuestion();}
    function finishOrFlee(){
      if(G.hp<=0){bossImg.classList.add('boss-roll-out');bossImg.addEventListener('animationend',()=>showOverlay(false),{once:true});}
      else{bossImg.classList.add('boss-roll-out');bossImg.addEventListener('animationend',()=>showOverlay(false,true),{once:true});}
    }

    function onUseHint(){
      if(!G)return;const q=G.current;
      if(G.hintUsedThisQuestion||G.hints<=0||!q.hint){toast('No hint available.');return;}
      G.hints--;G.hintUsedThisQuestion=true;renderCallout('hint',`<span class="title">💡 Hint:</span> ${q.hint}`);renderHUD();
    }

    function showOverlay(gameOver,fled=false){
      if(gameOver)bossImg.style.opacity='0.3';
      const elapsed=Math.floor((Date.now()-G.runStart)/1000);
      const summary=gameOver?`<h3>Game Over</h3><div class="meta">You reached ${G.idx+1}/${G.questions
