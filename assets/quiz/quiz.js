/* Tech Tinker Club Quiz Engine (Weeks 1–12, lockable)
   File: /assets/quiz/quiz.js
   WHAT THIS DOES
   - Loads questions JSON (supports { weeks: {...} } or a direct object of weeks).
   - Normalises question shapes (mcq vs match).
   - Renders a fixed 12-week selector bar:
        * Active = week exists, has questions, and not locked
        * Inactive/grey = missing, empty, or locked:true
   - Delivers MCQ and Drag/Drop match questions with hints and feedback.
   - Tracks score and shows a final result card.
*/

(function(){
  //---------------------------
  // Small DOM helper functions
  //---------------------------
  const qs  = (sel, el=document)=>el.querySelector(sel);
  const qsa = (sel, el=document)=>Array.from(el.querySelectorAll(sel));
  const el  = (tag, cls, html)=>{
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  //-----------------------------------------
  // Read JSON URL from <script data-questions>
  //-----------------------------------------
  const dataURL = document.currentScript.getAttribute('data-questions') || '/assets/quiz/questions.json';

  //------------------------
  // Central runtime state
  //------------------------
  const state = {
    weeks: {},          // { "1": { title, description, locked?, questions: [...] }, ... }
    currentWeek: null,  // e.g., "1"
    idx: 0,             // question index within current week
    score: 0,           // number correct in current week
    selected: null,     // current MCQ selected index
    dragAnswers: {},    // defIndex -> termIndex (for match questions)
    hintUsed: false     // track if hint used for current question
  };

  //------------------------
  // Load & normalise JSON
  //------------------------
  async function loadData(){
    const res = await fetch(dataURL, { cache: 'no-store' });
    if(!res.ok) throw new Error('Cannot load questions.json');
    const json = await res.json();

    // Accept either top-level { weeks: {...} } or a direct object already keyed by weeks
    const maybeWeeks = json.weeks || json;
    state.weeks = normalizeWeeks(maybeWeeks);
  }

  /**
   * NORMALISE the weeks object into a consistent internal format
   * Supports:
   *  - missing "title"/"description"
   *  - optional "locked": true
   *  - varying question field names (type: "multiple-choice"/"mcq", "drag-drop"/"match", "correct"/"answer")
   */
  function normalizeWeeks(weeksObj){
    const out = {};
    Object.keys(weeksObj).forEach(weekKey=>{
      const w = weeksObj[weekKey] || {};
      const questions = (w.questions || []).map(q => normalizeQuestion(q));
      out[weekKey] = {
        title: w.title || `Week ${weekKey}`,
        description: w.description || '',
        questions,
        locked: w.locked === true
      };
    });
    return out;
  }

  function normalizeQuestion(q){
    const qq = { ...q };

    // Normalise type
    const t = (qq.type || '').toLowerCase().trim();
    if (t === 'multiple-choice' || t === 'mcq') qq.type = 'mcq';
    else if (t === 'drag-drop' || t === 'match') qq.type = 'match';

    // Normalise "answer" index (fallback from "correct")
    if (typeof qq.answer === 'undefined' && typeof qq.correct !== 'undefined'){
      qq.answer = qq.correct;
    }

    // Ensure fields exist
    if (qq.type === 'mcq'){
      qq.options = qq.options || [];
      // If missing entirely, default to 0 to avoid crashes
      if (typeof qq.answer !== 'number'){ qq.answer = 0; }
    } else if (qq.type === 'match'){
      qq.terms = qq.terms || [];
      qq.definitions = qq.definitions || [];
      // "correctMatches" must be an array of defIndex -> termIndex
      qq.correctMatches = qq.correctMatches || [];
    }

    // Optional fields
    qq.hint = qq.hint || '';            // Only show hint button if non-empty
    qq.explanation = qq.explanation || '';
    qq.definition  = qq.definition  || '';
    qq.difficulty  = qq.difficulty  || '';

    return qq;
  }

  //-----------------------------
  // URL param helper (?week=3)
  //-----------------------------
  function getParam(name){
    const p = new URLSearchParams(location.search);
    return p.get(name);
  }

  //------------------------------------------
  // Main render function (frame the whole UI)
  //------------------------------------------
  function render(container){
    container.innerHTML = '';

    const card = el('div','tqc-card ttc-quiz');

    // Header
    const header = el('div','tqc-header');
    header.appendChild(el('h1','tqc-title','🎮 Tech Tinker Club — Quizzes'));
    header.appendChild(el('p','tqc-sub','Weekly learning adventures — choose a week!'));
    card.appendChild(header);

    // Weeks bar
    const weeksBar = el('div','tqc-weeks');

    // Build weeks bar (fixed list so we can show greyed future weeks)
    const allWeeks = ['1','2','3','4','5','6','7','8','9','10','11','12','13'];
    allWeeks.forEach((wk)=>{
      const exists = !!state.weeks[wk];
      const hasQs = exists && Array.isArray(state.weeks[wk].questions) && state.weeks[wk].questions.length > 0;
      const locked = exists && state.weeks[wk].locked === true;

      const b = el('button','tqc-btn',`Week ${wk}`);
      if (String(state.currentWeek)===wk) b.setAttribute('aria-current','true');

      if (!exists || !hasQs || locked){
        b.disabled = true;                 // greyed out
        b.title = locked ? 'Coming soon (locked)' : 'Coming soon';
      } else {
        b.addEventListener('click',()=>selectWeek(wk, container));
      }
      weeksBar.appendChild(b);
    });
    card.appendChild(weeksBar);

    // Week info
    const w = state.weeks[state.currentWeek];
    const info = el('div','tqc-info');
    info.innerHTML = `
      <div><strong>${w.title}</strong></div>
      <div>${w.description || ''}</div>`;
    card.appendChild(info);

    // Score/Progress row
    const score = el('div','tqc-score');
    score.innerHTML = `
      <div class="item"><div class="num" id="qcur">${state.idx+1}</div><div>Question</div></div>
      <div class="item"><div class="num" id="qtot">${w.questions.length}</div><div>Total</div></div>
      <div class="item"><div class="num" id="qscore">${state.score}</div><div>Score</div></div>
      <div class="item"><div class="num" id="qprog">0%</div><div>Progress</div></div>`;
    card.appendChild(score);

    // Progress bar
    const prog = el('div','tqc-progress');
    const bar  = el('div','tqc-progress-bar');
    const fill = el('span','tqc-progress-fill'); fill.id = 'tqc-fill';
    bar.appendChild(fill);
    prog.appendChild(bar);
    card.appendChild(prog);

    // Question wrapper
    const qwrap = el('div'); 
    qwrap.id='tqc-qwrap';
    card.appendChild(qwrap);

    container.appendChild(card);
    renderQuestion(); // show the first (or current) question
  }

  //---------------------
  // Progress percentage
  //---------------------
  function pct(){
    const w = state.weeks[state.currentWeek];
    return Math.round(((state.idx+1)/w.questions.length)*100);
  }

  //---------------------------------
  // Render a single current question
  //---------------------------------
  function renderQuestion(){
    const w = state.weeks[state.currentWeek];
    const q = w.questions[state.idx];

    // Update numbers
    qs('#qcur').textContent  = state.idx+1;
    qs('#qtot').textContent  = w.questions.length;
    qs('#qscore').textContent= state.score;
    qs('#qprog').textContent = `${pct()}%`;
    qs('#tqc-fill').style.width = `${pct()}%`;

    // Question card
    const box  = qs('#tqc-qwrap'); 
    box.innerHTML = '';
    const card = el('div','tqc-qcard');

    // Question content
    card.appendChild(el('div','tqc-qnum',`Question ${state.idx+1}`));
    card.appendChild(el('div','tqc-qtext', q.question));

    // Optional code snippet (preformatted)
    if(q.code){
      const code = el('pre','tqc-code');
      code.textContent = q.code;
      card.appendChild(code);
    }

    // Hint panel placeholder
    const hintPanel = el('div'); 
    hintPanel.id = 'tqc-hint';
    card.appendChild(hintPanel);

    // Render type-specific UI
    if(q.type==='match'){
      // Drag & drop (terms -> definitions)
      // Shuffle terms for randomness
      const order = [...q.terms.keys()];
      for(let i=order.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [order[i],order[j]]=[order[j],order[i]];
      }

      const dd   = el('div','tqc-dd');

      // Left column (terms)
      const left = el('div','tqc-col');
      left.appendChild(el('div','tqc-col-h','📝 Terms'));
      const lwrap = el('div');
      order.forEach(idx=>{
        const t = el('div','tqc-term',q.terms[idx]);
        t.draggable = true;
        t.dataset.termIndex = String(idx);
        t.addEventListener('dragstart', dragStart);
        t.addEventListener('dragend',   dragEnd);
        lwrap.appendChild(t);
      });
      left.appendChild(lwrap);

      // Right column (definitions)
      const right = el('div','tqc-col');
      right.appendChild(el('div','tqc-col-h','📖 Definitions'));
      const rwrap = el('div');
      q.definitions.forEach((d,i)=>{
        const z = el('div','tqc-drop', d);
        z.dataset.defIndex = String(i);
        ['dragover','drop','dragenter','dragleave'].forEach(evt=>z.addEventListener(evt, dropHandler));
        rwrap.appendChild(z);
      });
      right.appendChild(rwrap);

      dd.appendChild(left); 
      dd.appendChild(right);
      card.appendChild(dd);

      state.dragAnswers = {}; // reset for this question

    } else {
      // Multiple Choice
      const grid = el('div','tqc-options');
      q.options.forEach((opt,i)=>{
        const o = el('div','tqc-option', opt);
        o.addEventListener('click',()=>{
          qsa('.tqc-option',grid).forEach(x=>x.removeAttribute('aria-selected'));
          o.setAttribute('aria-selected','true');
          state.selected = i;
        });
        grid.appendChild(o);
      });
      card.appendChild(grid);
    }

    // Actions row (Hint + Submit)
    const actions = el('div','tqc-actions');

    // Show hint button only if we actually have a hint
    if (q.hint && q.hint.trim().length){
      const hintBtn = el('button','tqc-hint','💡 Hint');
      hintBtn.addEventListener('click', ()=>{
        if(state.hintUsed) return;
        state.hintUsed = true;
        hintBtn.disabled = true;
        const hp = el('div','tqc-hint-panel', `<strong>Hint:</strong> ${q.hint}`);
        qs('#tqc-hint').appendChild(hp);
      });
      actions.appendChild(hintBtn);
    }

    const submitBtn = el('button','tqc-submit','Submit Answer');
    submitBtn.addEventListener('click', submitAnswer);
    actions.appendChild(submitBtn);

    card.appendChild(actions);

    // Feedback container
    const fb = el('div','tqc-feedback'); 
    fb.id = 'tqc-fb';
    card.appendChild(fb);

    box.appendChild(card);

    // Reset per-question state
    state.selected = null;
    state.hintUsed = false;
  }

  //-----------------------------
  // Submit current question flow
  //-----------------------------
  function submitAnswer(){
    const w = state.weeks[state.currentWeek];
    const q = w.questions[state.idx];
    let isCorrect = false;

    if(q.type==='match'){
      // For match questions, build user's map from DOM
      const zones = qsa('.tqc-drop');
      state.dragAnswers = {};
      zones.forEach(z=>{
        const defIndex = Number(z.dataset.defIndex);
        const term = z.querySelector('.tqc-term');
        if(term){
          state.dragAnswers[defIndex] = Number(term.dataset.termIndex);
        }
      });

      // All zones should be filled and match correctMatches
      isCorrect = zones.every((z, i)=>{
        const user = state.dragAnswers[i];
        return typeof user === 'number' && user === q.correctMatches[i];
      });

      // Visual feedback on each definition row
      zones.forEach((z,i)=>{
        z.classList.remove('correct','incorrect');
        const user = state.dragAnswers[i];
        if(typeof user === 'number'){
          z.classList.add(user === q.correctMatches[i] ? 'correct' : 'incorrect');
        }
      });

    } else {
      // Multiple choice
      if (state.selected === null) return; // guard: nothing picked
      isCorrect = state.selected === q.answer;

      // Visual feedback on options
      const opts = qsa('.tqc-option');
      opts.forEach((o,i)=>{
        o.classList.remove('correct','incorrect');
        if (i === q.answer) o.classList.add('correct');
        else if (i === state.selected && !isCorrect) o.classList.add('incorrect');
      });
    }

    if(isCorrect) state.score++;

    // Feedback
    const fb = qs('#tqc-fb');
    const exp = q.explanation ? `<div class="tqc-exp"><strong>Why:</strong> ${q.explanation}</div>` : '';
    const defn = q.definition  ? `<div class="tqc-def"><strong>Definition:</strong> ${q.definition}</div>` : '';
    fb.innerHTML = `
      <div class="tqc-feedback-inner ${isCorrect?'ok':'nope'}">
        ${isCorrect ? '🎉 Correct!' : '❌ Not quite.'}
        ${exp}${defn}
        <div class="tqc-next-row">
          ${state.idx < w.questions.length-1
            ? '<button class="tqc-next">Next Question →</button>'
            : '<button class="tqc-next">See Final Score →</button>'}
        </div>
      </div>
    `;

    // Next/Finish
    const nextBtn = qs('.tqc-next', fb);
    nextBtn.addEventListener('click', ()=>{
      if (state.idx < w.questions.length-1){
        state.idx++;
        renderQuestion();
      } else {
        renderFinal();
      }
    });
  }

  //------------------------
  // Final result card view
  //------------------------
  function renderFinal(){
    const w = state.weeks[state.currentWeek];
    const pct = Math.round((state.score / w.questions.length) * 100);

    // Friendly message based on percentage
    let msg = '';
    if (pct >= 95) msg = "🏆 Phenomenal!";
    else if (pct >= 90) msg = "🌟 Outstanding!";
    else if (pct >= 80) msg = "👏 Excellent!";
    else if (pct >= 70) msg = "👍 Great job!";
    else if (pct >= 60) msg = "😊 Good work!";
    else if (pct >= 50) msg = "🌱 Nice effort!";
    else msg = "🌟 Keep going!";

    const box = qs('#tqc-qwrap'); 
    box.innerHTML='';
    const card = el('div','tqc-final');
    card.innerHTML = `
      <h2>🎉 ${w.title} Complete!</h2>
      <div class="tqc-big">${pct}%</div>
      <p><strong>You got ${state.score} out of ${w.questions.length} correct.</strong></p>
      <p><strong>${msg}</strong></p>
      <div class="tqc-final-actions">
        <button class="tqc-restart">Try This Week Again</button>
        ${nextAvailableWeekButtonHTML()}
      </div>
    `;
    box.appendChild(card);

    // Restart current week
    qs('.tqc-restart', card).addEventListener('click', ()=>{
      state.idx=0; state.score=0; renderQuestion();
    });

    // If a next available week exists, wire it
    const nx = qs('.tqc-next-week', card);
    if (nx){
      nx.addEventListener('click', ()=>{
        const next = findNextAvailableWeek(state.currentWeek);
        if(next) selectWeek(next, qs('#tqc-root'));
      });
    }
  }

  //------------------------------
  // Decide the "next available" week
  //------------------------------
  function nextAvailableWeekButtonHTML(){
    const next = findNextAvailableWeek(state.currentWeek);
    return next 
      ? '<button class="tqc-next-week">Next Week →</button>'
      : '';
  }

  function findNextAvailableWeek(currentWeekKey){
    // Choose the next week number higher than current that is active (exists & hasQs & !locked)
    const all = ['1','2','3','4','5','6','7','8','9','10','11','12'];
    const curIndex = all.indexOf(String(currentWeekKey));
    for (let i=curIndex+1; i<all.length; i++){
      const wk = all[i];
      const exists = !!state.weeks[wk];
      const hasQs  = exists && Array.isArray(state.weeks[wk].questions) && state.weeks[wk].questions.length > 0;
      const locked = exists && state.weeks[wk].locked === true;
      if (exists && hasQs && !locked) return wk;
    }
    return null;
  }

  //---------------------------
  // Switch to a particular week
  //---------------------------
  function selectWeek(weekKey, container){
    state.currentWeek = String(weekKey);
    state.idx = 0;
    state.score = 0;
    state.selected = null;
    state.dragAnswers = {};
    state.hintUsed = false;
    render(container);
  }

  //--------------------
  // Drag & Drop helpers
  //--------------------
  function dragStart(e){
    e.dataTransfer.setData('text/plain', e.target.dataset.termIndex);
    e.target.classList.add('dragging');
  }
  function dragEnd(e){
    e.target.classList.remove('dragging');
  }
  function dropHandler(e){
    e.preventDefault();
    const z = e.currentTarget;
    if (e.type==='dragenter') { z.classList.add('drag-over'); return; }
    if (e.type==='dragleave'){ z.classList.remove('drag-over'); return; }
    if (e.type==='dragover'){ return; }

    // On drop
    z.classList.remove('drag-over');
    const termIndex = e.dataTransfer.getData('text/plain');
    if (termIndex == null || termIndex === '') return;

    // Remove existing term (if any) from this drop zone
    const existing = z.querySelector('.tqc-term');
    if (existing) existing.remove();

    // Move dragged term here
    const dragged = qs(`.tqc-term[data-term-index="${termIndex}"]`);
    if (dragged) z.appendChild(dragged);
  }

  //----------------
  // App bootstrap
  //----------------
  (async function init(){
    try {
      await loadData();

      const container = document.getElementById('tqc-root');
      if(!container){
        console.error('Missing #tqc-root container.');
        return;
      }

      // Decide which week to show first:
      //  1) ?week= param if valid and available
      //  2) else, the first available week from 1..12 that is not locked and has questions
      const paramWeek = getParam('week');
      const requested = paramWeek && state.weeks[paramWeek] ? String(paramWeek) : null;

      const all = ['1','2','3','4','5','6','7','8','9','10','11','12'];
      function isAvailable(wk){
        const exists = !!state.weeks[wk];
        const hasQs  = exists && Array.isArray(state.weeks[wk].questions) && state.weeks[wk].questions.length > 0;
        const locked = exists && state.weeks[wk].locked === true;
        return exists && hasQs && !locked;
      }

      let firstAvailable = all.find(isAvailable) || '1';

      if (requested && isAvailable(requested)){
        selectWeek(requested, container);
      } else {
        selectWeek(firstAvailable, container);
      }

    } catch (e){
      console.error(e);
    }
  })();

})();
