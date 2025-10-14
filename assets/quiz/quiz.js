/* Tech Tinker Club Quiz Engine — compatible with Canva-style JSON
   File: /assets/quiz/quiz.js
*/
(function(){
  const qs = (sel, el=document)=>el.querySelector(sel);
  const qsa = (sel, el=document)=>Array.from(el.querySelectorAll(sel));

  // Reads the JSON URL from data-questions attribute
  const dataURL = document.currentScript.getAttribute('data-questions') || '/assets/quiz/questions.json';

  const state = {
    weeks: {},
    currentWeek: null,
    idx: 0,
    score: 0,
    selected: null,
    dragAnswers: {},
    hintUsed: false
  };

  async function loadData(){
    const res = await fetch(dataURL, {cache:'no-store'});
    if(!res.ok) throw new Error('Cannot load questions.json');
    const json = await res.json();
    // Accept either top-level { weeks: {...} } or a direct weeks object
    const maybeWeeks = json.weeks || json;
    state.weeks = normalizeWeeks(maybeWeeks);
  }

  /** NORMALISER
   * Accepts both:
   *  - type: "multiple-choice" or "mcq"
   *  - correct (index) or answer (index)
   *  - type: "drag-drop" or "match"
   */
  function normalizeWeeks(weeksObj){
    const out = {};
    Object.keys(weeksObj).forEach(weekKey=>{
      const w = weeksObj[weekKey];
      const questions = (w.questions || []).map(q => normalizeQuestion(q));
      out[weekKey] = {
        title: w.title || `Week ${weekKey}`,
        description: w.description || '',
        questions
      };
    });
    return out;
  }

  function normalizeQuestion(q){
    const qq = {...q};

    // Normalise type
    const t = (qq.type || '').toLowerCase().trim();
    if (t === 'multiple-choice' || t === 'mcq') qq.type = 'mcq';
    else if (t === 'drag-drop' || t === 'match') qq.type = 'match';

    // Normalise answer index
    if (typeof qq.answer === 'undefined' && typeof qq.correct !== 'undefined'){
      qq.answer = qq.correct;
    }

    // Ensure fields exist
    if (qq.type === 'mcq'){
      qq.options = qq.options || [];
      if (typeof qq.answer !== 'number'){ qq.answer = 0; } // fallback
    } else if (qq.type === 'match'){
      qq.terms = qq.terms || [];
      qq.definitions = qq.definitions || [];
      qq.correctMatches = qq.correctMatches || []; // defIndex -> termIndex
    }

    // Hint is optional — engine will show the button only if present
    if (!qq.hint) qq.hint = ''; 

    return qq;
  }

  function getParam(name){
    const p = new URLSearchParams(location.search);
    return p.get(name);
  }

  function el(tag, cls, html){
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    if(html!=null) e.innerHTML = html;
    return e;
  }

  function render(container){
    container.innerHTML = '';

    const card = el('div','tqc-card ttc-quiz');

    const header = el('div','tqc-header');
    header.appendChild(el('h1','tqc-title','🎮 Tech Tinker Club — Quizzes'));
    header.appendChild(el('p','tqc-sub','Weekly learning adventures — choose a week!'));
    card.appendChild(header);

    const weeksBar = el('div','tqc-weeks');
    const weekKeys = Object.keys(state.weeks).sort((a,b)=>Number(a)-Number(b));
    weekKeys.forEach((wk)=>{
      const b = el('button','tqc-btn',`Week ${wk}`);
      if (String(state.currentWeek)===wk) b.setAttribute('aria-current','true');
      b.addEventListener('click',()=>selectWeek(wk, container));
      weeksBar.appendChild(b);
    });
    card.appendChild(weeksBar);

    const w = state.weeks[state.currentWeek];
    const info = el('div','tqc-info');
    info.innerHTML = `<div><strong>${w.title}</strong></div><div>${w.description||''}</div>`;
    card.appendChild(info);

    const score = el('div','tqc-score');
    score.innerHTML = `
      <div class="item"><div class="num" id="qcur">${state.idx+1}</div><div>Question</div></div>
      <div class="item"><div class="num" id="qtot">${w.questions.length}</div><div>Total</div></div>
      <div class="item"><div class="num" id="qscore">${state.score}</div><div>Score</div></div>
      <div class="item"><div class="num" id="qprog">0%</div><div>Progress</div></div>`;
    card.appendChild(score);

    const prog = el('div','tqc-progress');
    const bar = el('div','tqc-progress-bar');
    const fill = el('span','tqc-progress-fill'); fill.id = 'tqc-fill';
    bar.appendChild(fill);
    prog.appendChild(bar);
    card.appendChild(prog);

    const qwrap = el('div'); qwrap.id='tqc-qwrap';
    card.appendChild(qwrap);

    container.appendChild(card);
    renderQuestion();
  }

  function pct(){
    const w = state.weeks[state.currentWeek];
    return Math.round(((state.idx+1)/w.questions.length)*100);
  }

  function renderQuestion(){
    const w = state.weeks[state.currentWeek];
    const q = w.questions[state.idx];

    qs('#qcur').textContent = state.idx+1;
    qs('#qtot').textContent = w.questions.length;
    qs('#qscore').textContent = state.score;
    qs('#qprog').textContent = `${pct()}%`;
    qs('#tqc-fill').style.width = `${pct()}%`;

    const box = qs('#tqc-qwrap'); box.innerHTML = '';
    const card = el('div','tqc-qcard');

    card.appendChild(el('div','tqc-qnum',`Question ${state.idx+1}`));
    card.appendChild(el('div','tqc-qtext', q.question));

    if(q.code){
      const code = el('pre','tqc-code');
      code.textContent = q.code;
      card.appendChild(code);
    }

    const hintPanel = el('div'); hintPanel.id = 'tqc-hint';
    card.appendChild(hintPanel);

    if(q.type==='match'){
      // Drag & drop (terms -> definitions)
      const order = [...q.terms.keys()];
      for(let i=order.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [order[i],order[j]]=[order[j],order[i]];
      }

      const dd = el('div','tqc-dd');
      const left = el('div','tqc-col');
      left.appendChild(el('div','tqc-col-h','📝 Terms'));
      const lwrap = el('div');
      order.forEach(idx=>{
        const t = el('div','tqc-term',q.terms[idx]);
        t.draggable = true;
        t.dataset.termIndex = String(idx);
        t.addEventListener('dragstart', dragStart);
        t.addEventListener('dragend', dragEnd);
        lwrap.appendChild(t);
      });
      left.appendChild(lwrap);

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

      dd.appendChild(left); dd.appendChild(right);
      card.appendChild(dd);

      state.dragAnswers = {};
    } else {
      // MCQ
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

    // Actions
    const actions = el('div','tqc-actions');

    // Only show hint button when we actually have a hint text
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

    const fb = el('div','tqc-feedback'); fb.id = 'tqc-fb';
    card.appendChild(fb);

    box.appendChild(card);

    // reset per-question state
    state.selected = null;
    state.hintUsed = false;
  }

  function submitAnswer(){
    const w = state.weeks[state.currentWeek];
    const q = w.questions[state.idx];
    let isCorrect = false;

    if(q.type==='match'){
      // Check drag & drop: defIndex -> termIndex
      // Build from DOM
      const zones = qsa('.tqc-drop');
      state.dragAnswers = {};
      zones.forEach(z=>{
        const defIndex = Number(z.dataset.defIndex);
        const term = z.querySelector('.tqc-term');
        if(term){
          state.dragAnswers[defIndex] = Number(term.dataset.termIndex);
        }
      });

      // All zones must be filled
      isCorrect = zones.every((z, i)=>{
        const user = state.dragAnswers[i];
        return typeof user === 'number' && user === q.correctMatches[i];
      });

      // Visual feedback
      zones.forEach((z,i)=>{
        z.classList.remove('correct','incorrect');
        const user = state.dragAnswers[i];
        if(typeof user === 'number'){
          z.classList.add(user === q.correctMatches[i] ? 'correct' : 'incorrect');
        }
      });

    } else {
      // MCQ
      if (state.selected === null) return; // nothing picked
      isCorrect = state.selected === q.answer;

      const opts = qsa('.tqc-option');
      opts.forEach((o,i)=>{
        o.classList.remove('correct','incorrect');
        if (i === q.answer) o.classList.add('correct');
        else if (i === state.selected && !isCorrect) o.classList.add('incorrect');
      });
    }

    if(isCorrect) state.score++;

    // Feedback text
    const fb = qs('#tqc-fb');
    const exp = q.explanation ? `<div class="tqc-exp"><strong>Why:</strong> ${q.explanation}</div>` : '';
    const defn = q.definition ? `<div class="tqc-def"><strong>Definition:</strong> ${q.definition}</div>` : '';
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

  function renderFinal(){
    const w = state.weeks[state.currentWeek];
    const pct = Math.round((state.score / w.questions.length) * 100);
    let msg = '';
    if (pct >= 95) msg = "🏆 Phenomenal!";
    else if (pct >= 90) msg = "🌟 Outstanding!";
    else if (pct >= 80) msg = "👏 Excellent!";
    else if (pct >= 70) msg = "👍 Great job!";
    else if (pct >= 60) msg = "😊 Good work!";
    else if (pct >= 50) msg = "🌱 Nice effort!";
    else msg = "🌟 Keep going!";

    const box = qs('#tqc-qwrap'); box.innerHTML='';
    const card = el('div','tqc-final');
    card.innerHTML = `
      <h2>🎉 ${w.title} Complete!</h2>
      <div class="tqc-big">${pct}%</div>
      <p><strong>You got ${state.score} out of ${w.questions.length} correct.</strong></p>
      <p><strong>${msg}</strong></p>
      <div class="tqc-final-actions">
        <button class="tqc-restart">Try This Week Again</button>
        ${Number(state.currentWeek) < Math.max(...Object.keys(state.weeks).map(n=>Number(n)))
          ? '<button class="tqc-next-week">Next Week →</button>'
          : ''}
      </div>
    `;
    box.appendChild(card);

    qs('.tqc-restart', card).addEventListener('click', ()=>{
      state.idx=0; state.score=0; renderQuestion();
    });
    const nx = qs('.tqc-next-week', card);
    if (nx){
      nx.addEventListener('click', ()=>{
        const next = String(Number(state.currentWeek)+1);
        if(state.weeks[next]) selectWeek(next, qs('#tqc-root'));
      });
    }
  }

  function selectWeek(weekKey, container){
    state.currentWeek = String(weekKey);
    state.idx = 0;
    state.score = 0;
    state.selected = null;
    state.dragAnswers = {};
    state.hintUsed = false;
    render(container);
  }

  // Drag & Drop helpers
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

    // drop
    z.classList.remove('drag-over');

    const termIndex = e.dataTransfer.getData('text/plain');
    if (!termIndex && termIndex!==0) return;

    // Remove existing term from this zone
    const existing = z.querySelector('.tqc-term');
    if (existing) existing.remove();

    // Move dragged term here
    const dragged = qs(`.tqc-term[data-term-index="${termIndex}"]`);
    if (dragged) z.appendChild(dragged);
  }

  // Bootstrap
  (async function init(){
    try {
      await loadData();
      const container = document.getElementById('tqc-root');
      if(!container){
        console.error('Missing #tqc-root container.');
        return;
      }
      const wkParam = getParam('week');
      const first = wkParam && state.weeks[wkParam] ? wkParam : Object.keys(state.weeks).sort((a,b)=>Number(a)-Number(b))[0];
      selectWeek(first, container);
    } catch (e){
      console.error(e);
    }
  })();

})();
