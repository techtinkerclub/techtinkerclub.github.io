/* Tech Tinker Club Quiz Engine (with post-submit lock + instructions modal)
   -----------------------------------------------------------------------
   - Works with Canva-style JSON (top-level { weeks: {...} } or direct weeks object)
   - 12-week bar: shows all weeks; greyed if no questions or locked:true
   - MCQ and Drag&Drop (Match) question types
   - DnD FIX: dropping onto a filled zone returns the prior term to the pool
   - DnD FIX: you can always drag from a zone back to the pool
   - Lock after first submission: disables options/drag and hides Submit
   - Clearer Hint / Submit / Next buttons
   - Instructions modal: fetches /assets/quiz/instructions.html into a popup
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
    hintUsed: false,
    locked: false       // lock current question after first submit
  };

  /* =========================
     Instructions modal (popup)
     ========================= */

  function ensureModalRoot(){
    let root = document.getElementById('tqc-modal-root');
    if (!root){
      root = document.createElement('div');
      root.id = 'tqc-modal-root';
      root.innerHTML = `
        <div class="tqc-modal" role="dialog" aria-modal="true" aria-labelledby="tqc-modal-title" hidden>
          <div class="tqc-modal__backdrop" data-close></div>
          <div class="tqc-modal__dialog" role="document">
            <button class="tqc-modal__close" type="button" aria-label="Close" data-close>&times;</button>
            <div class="tqc-card tqc-modal__card">
              <h2 id="tqc-modal-title" class="tqc-title">Instructions</h2>
              <div class="tqc-modal__content">
                <div class="tqc-loading">Loading…</div>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(root);

      // close on backdrop or X
      root.addEventListener('click', (e)=>{
        if (e.target.matches('[data-close]')) closeInstructionsModal();
      });

      // close on Esc
      document.addEventListener('keydown', (e)=>{
        const open = document.querySelector('.tqc-modal:not([hidden])');
        if (open && e.key === 'Escape') closeInstructionsModal();
      });
    }
    return root.querySelector('.tqc-modal');
  }

  function openInstructionsModalFromURL(url){
    const modal = ensureModalRoot();
    const content = modal.querySelector('.tqc-modal__content');
    content.innerHTML = '<div class="tqc-loading">Loading…</div>';
    modal.hidden = false;
    document.documentElement.classList.add('tqc-no-scroll');

    fetch(url, { cache: 'no-store' })
      .then(r => r.text())
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // Prefer <article class="tqi-article">, else <main>, else body
        const src = doc.querySelector('article.tqi-article') ||
                    doc.querySelector('main') ||
                    doc.body;

        content.innerHTML = '';

        // Wrap to inherit quiz look-and-feel
        const inner = document.createElement('div');
        inner.className = 'tqc-instructions-inner';
        inner.innerHTML = src.innerHTML;
        content.appendChild(inner);
      })
      .catch(err => {
        console.error('Failed to load instructions:', err);
        content.innerHTML = '<p>Sorry, the instructions could not be loaded right now.</p>';
      });
  }

  function closeInstructionsModal(){
    const modal = document.querySelector('.tqc-modal');
    if (!modal) return;
    modal.hidden = true;
    document.documentElement.classList.remove('tqc-no-scroll');
  }

  // Add "Instructions" button (opens modal and loads external page)
  function addInstructionsButtonTo(headerEl){
    if (!headerEl || headerEl.querySelector('.tqc-info-btn')) return;

    // ensure header is positioned for the absolute button
    if (getComputedStyle(headerEl).position === 'static'){
      headerEl.style.position = 'relative';
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Instructions';
    btn.className = 'tqc-btn tqc-info-btn';
    btn.style.position = 'absolute';
    btn.style.top = '8px';
    btn.style.right = '16px';

    // open modal and fetch /assets/quiz/instructions.html
    btn.addEventListener('click', ()=>{
      const ver = 'v=20251023-quiz'; // change this string whenever you update instructions.html
      openInstructionsModalFromURL(`/assets/quiz/instructions.html?${ver}`);
    });

    headerEl.appendChild(btn);
  }

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

    // Insert the Instructions button (opens modal)
    addInstructionsButtonTo(header);

   // Weeks bar – show all 14; greyed if locked or no questions
   const weeksBar = el('div','tqc-weeks');
   
   // change this number if you ever want more / fewer weeks
   const maxWeeks = 14;
   const allWeeks = Array.from({ length: maxWeeks }, (_, i) => String(i + 1));
   
   allWeeks.forEach((wk) => {
     const exists = !!state.weeks[wk];
     const hasQs  = exists && Array.isArray(state.weeks[wk].questions) && state.weeks[wk].questions.length > 0;
     const locked = exists && state.weeks[wk].locked === true;
   
     const b = el('button', 'tqc-btn', `Week ${wk}`);
     if (String(state.currentWeek) === wk) b.setAttribute('aria-current', 'true');
   
     if (!exists || !hasQs || locked) {
       b.disabled = true;
       b.title = locked ? 'Coming soon (locked)' : 'Coming soon';
     } else {
       b.addEventListener('click', () => selectWeek(wk, container));
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

    // reset per-question state
    state.locked = false;
    state.selected = null;
    state.hintUsed = false;

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
    const hintHost = el('div',''); hintHost.id = 'tqc-hint';
    card.appendChild(hintHost);

    if (q.type === 'match'){
      // --------- DRAG & DROP ----------
      const dd = el('div','tqc-dd');

      // LEFT (pool)
      const left = el('div','tqc-col');
      left.appendChild(el('div','tqc-col-h','📝 Terms'));
      const pool = el('div','tqc-pool'); pool.id = 'tqc-pool';
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
      pool.addEventListener('dragover', evt => { if (!state.locked) evt.preventDefault(); });
      pool.addEventListener('drop', (evt)=>{
        if (state.locked) return;
        evt.preventDefault();
        const termIndex = evt.dataTransfer.getData('text/plain');
        if (termIndex === '' || termIndex == null) return;
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
        z.addEventListener('dragover', e => { if (!state.locked) e.preventDefault(); });
        z.addEventListener('dragenter', e => { if (!state.locked) z.classList.add('drag-over'); });
        z.addEventListener('dragleave', e => z.classList.remove('drag-over'));
        z.addEventListener('drop', e => { if (!state.locked) onDropZone(e, pool); });
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
          if (state.locked) return;
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
        if (state.hintUsed || state.locked) return;
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
  }

  // ---------- DnD handlers ----------
  function onDragStart(e){
    if (state.locked) { e.preventDefault(); return; }
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

    // If zone already has a term, return it to pool
    const existing = z.querySelector('.tqc-term');
    if (existing) poolEl.appendChild(existing);

    z.appendChild(dragged);
  }

  // ---------- submit & feedback ----------
  function submitAnswer(){
    if (state.locked) return; // block double submit

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

      // Must fill all zones correctly
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

    // ---- lock the UI so the user can’t change & resubmit ----
    state.locked = true;

    // 1) Disable/Hide Submit
    const submitBtn = qs('.tqc-submit');
    if (submitBtn){
      submitBtn.disabled = true;
      submitBtn.classList.add('tqc-hidden');
      submitBtn.setAttribute('aria-disabled','true');
    }

    // 2) Disable Hint (if present)
    const hintBtn = qs('.tqc-hint');
    if (hintBtn){
      hintBtn.disabled = true;
      hintBtn.setAttribute('aria-disabled','true');
    }

    // 3) Lock MCQ options (visual + a11y)
    qsa('.tqc-option').forEach(o=>{
      o.classList.add('tqc-locked');
      o.setAttribute('aria-disabled','true');
      o.tabIndex = -1;
    });

    // 4) Lock Drag & Drop
    qsa('.tqc-term').forEach(t=>{
      t.draggable = false;
      t.classList.add('tqc-locked');
    });
    qsa('.tqc-drop').forEach(z=>{
      z.classList.add('tqc-locked');
    });

    // ---- feedback + Next button ----
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
    state.locked = false;
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
