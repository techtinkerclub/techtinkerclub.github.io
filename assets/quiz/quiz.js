/* Tech Tinker Club Quiz Engine
   ------------------------------------------------------------
   - Works with Canva-style JSON (top-level { weeks: {...} } or direct weeks object)
   - 12-week bar: shows all weeks; greyed if no questions or locked:true
   - MCQ and Drag&Drop (Match) question types
   - DnD FIX: dropping onto a filled zone returns the prior term to the pool
   - DnD FIX: you can always drag from a zone back to the pool
   - Clearer Hint / Submit / Next buttons
   - Small debug hooks in console
*/

(function(){
  // ---------- tiny helpers ----------
  const qs  = (sel, el=document)=>el.querySelector(sel);
  const qsa = (sel, el=document)=>Array.from(el.querySelectorAll(sel));
  const log = (...a)=>console.debug('[TTC-QUIZ]', ...a);

  // Read JSON URL from <script data-questions="...">
  const dataURL = document.currentScript.getAttribute('data-questions') || '/assets/quiz/questions.json';

  // ---------- state ----------
  const state = {
    weeks: {},
    currentWeek: null,
    idx: 0,
    score: 0,
    selected: null,     // MCQ selected index
    dragAnswers: {},    // for Match: defIndex -> termIndex
    hintUsed: false
  };

  // ---------- data load & normalize ----------
  async function loadData(){
    const res = await fetch(dataURL, { cache: 'no-store' });
    if(!res.ok) throw new Error('Cannot load questions.json');
    const json = await res.json();
    const weeksObj = json.weeks || json;
    state.weeks = normalizeWeeks(weeksObj);
    log('Loaded weeks:', Object.keys(state.weeks));
  }

  function normalizeWeeks(weeksObj){
    const out = {};
    for (const weekKey of Object.keys(weeksObj)){
      const w = weeksObj[weekKey] || {};
      out[weekKey] = {
        title:       w.title || `Week ${weekKey}`,
        description: w.description || '',
        locked:      !!w.locked,
        questions:   (w.questions || []).map(q => normalizeQuestion(q))
      };
    }
    return out;
  }

  function normalizeQuestion(q){
    const qq = { ...q };

    // type normalisation
    const t = (qq.type || '').toLowerCase().trim();
    if (t === 'multiple-choice' || t === 'mcq') qq.type = 'mcq';
    else if (t === 'drag-drop' || t === 'match') qq.type = 'match';

    // answer normalisation (mcq)
    if (typeof qq.answer === 'undefined' && typeof qq.correct !== 'undefined'){
      qq.answer = qq.correct;
    }

    if (qq.type === 'mcq'){
      qq.options = qq.options || [];
      if (typeof qq.answer !== 'number') qq.answer = 0;
    } else if (qq.type === 'match'){
      qq.terms = qq.terms || [];
      qq.definitions = qq.definitions || [];
      qq.correctMatches = qq.correctMatches || []; // defIndex -> termIndex
    }

    // optional fields
    qq.hint = qq.hint || '';
    qq.explanation = qq.explanation || '';
    qq.definition  = qq.definition || '';
    qq.code = qq.code || '';

    return qq;
  }

  // ---------- DOM helpers ----------
  function el(tag, cls, html){
    const e = document.createElement(tag);
    if (cls)  e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function getParam(name){
    const p = new URLSearchParams(location.search);
    return p.get(name);
  }

  // ---------- render root ----------
  function render(container){
    container.innerHTML = '';

    const card = el('div','tqc-card ttc-quiz');

    // Header
    const header = el('div','tqc-header');
    header.appendChild(el('h1','tqc-title','Tech Tinker Club'));
    header.appendChild(el('p','tqc-sub','Micro:bit learning adventures — choose a week!'));
    card.appendChild(header);

    // Weeks bar – show all 12; greyed if locked or no questions
    const weeksBar = el('div','tqc-weeks');
    const allWeeks = ['1','2','3','4','5','6','7','8','9','10','11','12'];
    allWeeks.forEach((wk)=>{
      const exists = !!state.weeks[wk];
      const hasQs  = exists && Array.isArray(state.weeks[wk].questions) && state.weeks[wk].questions.length > 0;
      const locked = exists && state.weeks[wk].locked === true;

      const b = el('button','tqc-btn',`Week ${wk}`);
      if (String(state.currentWeek) === wk) b.setAttribute('aria-current','true');

      if (!exists || !hasQs || locked){
        b.disabled = true;
        b.title = locked ? 'Coming soon (locked)' : 'Coming soon';
      } else {
        b.addEventListener('click',()=>selectWeek(wk, container));
      }
      weeksBar.appendChild(b);
    });
    card.appendChild(weeksBar);

    // Week info (title/desc)
    const w = state.weeks[state.currentWeek];
    const info = el('div','tqc-info');
    info.innerHTML = `<div><strong>${w.title}</strong></div><div>${w.description || ''}</div>`;
    card.appendChild(info);

    // Score strip
    const score = el('div','tqc-score');
    score.innerHTML = `
    <div class="item"><div class="num" id="qcur">${state.idx+1}</div><div class="label">Question</div></div>
    <div class="item"><div class="num" id="qtot">${w.questions.length}</div><div class="label">Total</div></div>
    <div class="item"><div class="num" id="qscore">${state.score}</div><div class="label">Score</div></div>
    <div class="item"><div class="num" id="qprog">0%</div><div class="label">Progress</div></div>
    `;
    
    card.appendChild(score);

    // Progress
    const prog = el('div','tqc-progress');
    const bar  = el('div','tqc-progress-bar');
    const fill = el('span','tqc-progress-fill'); fill.id = 'tqc-fill';
    bar.appendChild(fill);
    prog.appendChild(bar);
    card.appendChild(prog);

    // Question host
    const qwrap = el('div'); qwrap.id = 'tqc-qwrap';
    card.appendChild(qwrap);

    container.appendChild(card);
    renderQuestion();
  }

  function pct(){
    const w = state.weeks[state.currentWeek];
    return Math.round(((state.idx+1)/w.questions.length)*100);
  }

  // ---------- render a question ----------
  function renderQuestion(){
    const w = state.weeks[state.currentWeek];
    const q = w.questions[state.idx];

    qs('#qcur').textContent = state.idx+1;
    qs('#qtot').textContent = w.questions.length;
    qs('#qscore').textContent = state.score;
    qs('#qprog').textContent  = `${pct()}%`;
    qs('#tqc-fill').style.width = `${pct()}%`;

    const box = qs('#tqc-qwrap'); box.innerHTML = '';
    const card = el('div','tqc-qcard');

    card.appendChild(el('div','tqc-qnum',`Question ${state.idx+1}`));
    card.appendChild(el('div','tqc-qtext', q.question));

    if (q.code){
      const code = el('pre','tqc-code');
      code.textContent = q.code;
      card.appendChild(code);
    }

    // hint panel region (empty until clicked)
    card.appendChild(el('div','', '')).id = 'tqc-hint';

    if (q.type === 'match'){
      // --------- DRAG & DROP (Terms -> Definitions) ----------
      // left: pool of terms (draggable)
      // right: definition zones (droppable, one term each)
      const dd = el('div','tqc-dd');

      // LEFT (pool)
      const left = el('div','tqc-col');
      left.appendChild(el('div','tqc-col-h','📝 Terms'));
      const pool = el('div','tqc-pool'); pool.id = 'tqc-pool';
      // shuffle order for variety
      const order = [...q.terms.keys()];
      for (let i=order.length-1; i>0; i--){
        const j = Math.floor(Math.random()*(i+1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      order.forEach(idx=>{
        const t = el('div','tqc-term', q.terms[idx]);
        t.draggable = true;
        t.dataset.termIndex = String(idx);
        t.addEventListener('dragstart', onDragStart);
        t.addEventListener('dragend', onDragEnd);
        pool.appendChild(t);
      });
      left.appendChild(pool);

      // Make the pool a valid drop target (to return terms)
      pool.addEventListener('dragover', evt => { evt.preventDefault(); });
      pool.addEventListener('drop', (evt)=>{
        evt.preventDefault();
        const termIndex = evt.dataTransfer.getData('text/plain');
        if (termIndex === '' || termIndex == null) return;
        // move dragged element from any zone back to pool
        const dragged = qs(`.tqc-term[data-term-index="${termIndex}"]`);
        if (dragged) pool.appendChild(dragged);
      });

      // RIGHT (defs)
      const right = el('div','tqc-col');
      right.appendChild(el('div','tqc-col-h','📖 Definitions'));
      const rwrap = el('div');
      q.definitions.forEach((d, i)=>{
        const z = el('div','tqc-drop', d);
        z.dataset.defIndex = String(i);
        z.addEventListener('dragover', e => e.preventDefault());
        z.addEventListener('dragenter', e => z.classList.add('drag-over'));
        z.addEventListener('dragleave', e => z.classList.remove('drag-over'));
        z.addEventListener('drop', e => onDropZone(e, pool));
        rwrap.appendChild(z);
      });
      right.appendChild(rwrap);

      dd.appendChild(left);
      dd.appendChild(right);
      card.appendChild(dd);

      state.dragAnswers = {}; // reset

    } else {
      // --------- MCQ ----------
      const grid = el('div','tqc-options');
      q.options.forEach((opt, i)=>{
        const o = el('div','tqc-option', opt);
        o.addEventListener('click', ()=>{
          qsa('.tqc-option', grid).forEach(x=>x.removeAttribute('aria-selected'));
          o.setAttribute('aria-selected','true');
          state.selected = i;
        });
        grid.appendChild(o);
      });
      card.appendChild(grid);
    }

    // Actions: Hint (only if exists) + Submit
    const actions = el('div','tqc-actions');

    if (q.hint && q.hint.trim().length){
      const hintBtn = el('button','tqc-hint','💡 Hint');
      hintBtn.addEventListener('click', ()=>{
        if (state.hintUsed) return;
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

  // ---------- DnD handlers ----------
  function onDragStart(e){
    e.dataTransfer.setData('text/plain', e.target.dataset.termIndex);
    e.target.classList.add('dragging');
  }
  function onDragEnd(e){
    e.target.classList.remove('dragging');
  }

  // Drop onto a definition zone
  function onDropZone(evt, poolEl){
    evt.preventDefault();
    const z = evt.currentTarget;
    z.classList.remove('drag-over');

    const termIndex = evt.dataTransfer.getData('text/plain');
    if (termIndex === '' || termIndex == null) return;

    const dragged = qs(`.tqc-term[data-term-index="${termIndex}"]`);
    if (!dragged) return;

    // If zone already has a term, return it to pool (FIX: no more “lost” terms)
    const existing = z.querySelector('.tqc-term');
    if (existing) poolEl.appendChild(existing);

    // If dragged lives inside another zone, remove it from there first (DOM append below handles it)
    z.appendChild(dragged);
  }

  // ---------- submit & feedback ----------
  function submitAnswer(){
    const w = state.weeks[state.currentWeek];
    const q = w.questions[state.idx];
    let isCorrect = false;

    if (q.type === 'match'){
      // Build answers from zones
      const zones = qsa('.tqc-drop');
      state.dragAnswers = {};
      zones.forEach(z=>{
        const defIndex = Number(z.dataset.defIndex);
        const term = z.querySelector('.tqc-term');
        if (term){
          state.dragAnswers[defIndex] = Number(term.dataset.termIndex);
        }
      });

      // Must fill all zones
      isCorrect = zones.every((z, i)=>{
        const user = state.dragAnswers[i];
        return typeof user === 'number' && user === q.correctMatches[i];
      });

      // Zone feedback
      zones.forEach((z, i)=>{
        z.classList.remove('correct','incorrect');
        const user = state.dragAnswers[i];
        if (typeof user === 'number'){
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

    if (isCorrect) state.score++;

    // Feedback text block
    const fb = qs('#tqc-fb');
    const exp = q.explanation ? `<div class="tqc-exp"><strong>Why:</strong> ${q.explanation}</div>` : '';
    const defn = q.definition  ? `<div class="tqc-def"><strong>Definition:</strong> ${q.definition}</div>` : '';
    fb.innerHTML = `
      <div class="tqc-feedback-inner ${isCorrect ? 'ok':'nope'}">
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
    const percent = Math.round((state.score / w.questions.length) * 100);
    let msg = '';
    if (percent >= 95) msg = "🏆 Phenomenal!";
    else if (percent >= 90) msg = "🌟 Outstanding!";
    else if (percent >= 80) msg = "👏 Excellent!";
    else if (percent >= 70) msg = "👍 Great job!";
    else if (percent >= 60) msg = "😊 Good work!";
    else if (percent >= 50) msg = "🌱 Nice effort!";
    else msg = "🌟 Keep going!";

    const box = qs('#tqc-qwrap'); box.innerHTML = '';
    const card = el('div','tqc-final');
    card.innerHTML = `
      <h2>🎉 ${w.title} Complete!</h2>
      <div class="tqc-big">${percent}%</div>
      <p><strong>You got ${state.score} out of ${w.questions.length} correct.</strong></p>
      <p><strong>${msg}</strong></p>
      <div class="tqc-final-actions">
        <button class="tqc-restart">Try This Week Again</button>
        ${Number(state.currentWeek) < Math.max(...Object.keys(state.weeks).map(n=>Number(n)))
          ? '<button class="tqc-next-week">Next Week →</button>' : ''}
      </div>
    `;
    box.appendChild(card);

    qs('.tqc-restart', card).addEventListener('click', ()=>{
      state.idx = 0; state.score = 0; renderQuestion();
    });
    const nx = qs('.tqc-next-week', card);
    if (nx){
      nx.addEventListener('click', ()=>{
        const next = String(Number(state.currentWeek)+1);
        if (state.weeks[next]) selectWeek(next, qs('#tqc-root'));
      });
    }
  }

  // ---------- select week ----------
  function selectWeek(weekKey, container){
    state.currentWeek = String(weekKey);
    state.idx = 0;
    state.score = 0;
    state.selected = null;
    state.dragAnswers = {};
    state.hintUsed = false;
    render(container);
  }

  // ---------- bootstrap ----------
  (async function init(){
    try {
      await loadData();
      const container = document.getElementById('tqc-root');
      if (!container){
        console.error('Missing #tqc-root container.');
        return;
      }
      const wkParam = getParam('week');
      // choose initial week: ?week=… or first available with questions
      const weekKeys = Object.keys(state.weeks).sort((a,b)=>Number(a)-Number(b));
      let initial = wkParam && state.weeks[wkParam] ? wkParam : weekKeys.find(k => state.weeks[k].questions.length > 0 && !state.weeks[k].locked);
      if (!initial) initial = weekKeys[0]; // fallback
      selectWeek(initial, container);
    } catch (e){
      console.error(e);
    }
  })();

})();
