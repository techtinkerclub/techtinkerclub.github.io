/* Tech Tinker Club Quiz Engine */

(function(){
  const qs = (sel, el=document)=>el.querySelector(sel);
  const qsa = (sel, el=document)=>Array.from(el.querySelectorAll(sel));

  // Resolve base URL (honours site.baseurl at build time through the page that loads this)
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
    state.weeks = json.weeks || {};
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

    // Header
    const header = el('div','tqc-header');
    header.appendChild(el('h1','tqc-title','🎮 Tech Tinker Club — Quizzes'));
    header.appendChild(el('p','tqc-sub','Weekly learning adventures — choose a week!'));
    card.appendChild(header);

    // Week buttons
    const weeksBar = el('div','tqc-weeks');
    const weekKeys = Object.keys(state.weeks).sort((a,b)=>Number(a)-Number(b));
    weekKeys.forEach((wk,i)=>{
      const b = el('button','tqc-btn',`Week ${wk}`);
      if (String(state.currentWeek)===wk) b.setAttribute('aria-current','true');
      b.addEventListener('click',()=>selectWeek(wk, container));
      weeksBar.appendChild(b);
    });
    card.appendChild(weeksBar);

    // Info
    const w = state.weeks[state.currentWeek];
    const info = el('div','tqc-info');
    info.innerHTML = `<div><strong>${w.title}</strong></div><div>${w.description||''}</div>`;
    card.appendChild(info);

    // Score row
    const score = el('div','tqc-score');
    score.innerHTML = `
      <div class="item"><div class="num" id="qcur">${state.idx+1}</div><div>Question</div></div>
      <div class="item"><div class="num" id="qtot">${w.questions.length}</div><div>Total</div></div>
      <div class="item"><div class="num" id="qscore">${state.score}</div><div>Score</div></div>
      <div class="item"><div class="num" id="qprog">0%</div><div>Progress</div></div>`;
    card.appendChild(score);

    // Progress bar
    const prog = el('div','tqc-progress');
    const bar = el('div','tqc-progress-bar');
    const fill = el('span','tqc-progress-fill'); fill.id = 'tqc-fill';
    bar.appendChild(fill);
    prog.appendChild(bar);
    card.appendChild(prog);

    // Question container
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
      // Drag & drop
      // Shuffle terms
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

    const hintBtn = el('button','tqc-hint','💡 Hint');
    hintBtn.addEventListener('click', ()=>{
      if(state.hintUsed) return;
      state.hintUsed = true;
      hintBtn.disabled = true;
      if(q.hint){
        const hp = el('div','tqc-hint-panel', `<strong>Hint:</strong> ${q.hint}`);
        qs('#tqc-hint').appendChild(hp);
      }
    });
    actions.appendChild(hintBtn);

    const submit = el('button','tqc-cta','Submit');
    submit.addEventListener('click', ()=>checkAnswer(card));
    actions.appendChild(submit);

    card.appendChild(actions);

    // Feedback area
    card.appendChild(el('div','tqc-feedback')); // empty for now

    qs('#tqc-qwrap').appendChild(card);
  }

  function dragStart(e){
    e.dataTransfer.setData('text/plain', e.target.dataset.termIndex);
    e.target.classList.add('dragging');
  }
  function dragEnd(e){ e.target.classList.remove('dragging'); }
  function dropHandler(e){
    e.preventDefault();
    const q = state.weeks[state.currentWeek].questions[state.idx];
    if(e.type==='dragover' || e.type==='dragenter'){
      e.currentTarget.classList.add('drag-over');
      return;
    }
    if(e.type==='dragleave'){
      e.currentTarget.classList.remove('drag-over');
      return;
    }
    e.currentTarget.classList.remove('drag-over');

    const termIdx = e.dataTransfer.getData('text/plain');
    const defIdx = e.currentTarget.dataset.defIndex;

    // Move dragged term inside this drop zone (remove previous if any)
    const zone = e.currentTarget;
    const existing = zone.querySelector('.tqc-term');
    if(existing){
      existing.parentElement.removeChild(existing);
      // Put it back to left column
      qs('.tqc-col .tqc-term.dragging')?.classList.remove('dragging');
    }

    const termEl = qs(`.tqc-term[data-term-index="${termIdx}"]`);
    if(termEl){
      zone.innerHTML = ''; // clear def text
      zone.appendChild(termEl);
      state.dragAnswers[defIdx] = Number(termIdx);
      zone.classList.add('filled');
    }
  }

  function checkAnswer(card){
    const q = state.weeks[state.currentWeek].questions[state.idx];
    const fb = qs('.tqc-feedback', card);

    let ok=false;

    if(q.type==='match'){
      ok = Object.keys(state.dragAnswers).length === q.definitions.length &&
           q.definitions.every((_,i)=> state.dragAnswers[i] === q.correctMatches[i]);

      // paint correctness
      q.definitions.forEach((_,i)=>{
        const zone = qs(`.tqc-drop[data-def-index="${i}"]`, card);
        zone.classList.remove('correct','incorrect');
        zone.classList.add(state.dragAnswers[i]===q.correctMatches[i] ? 'correct':'incorrect');
      });
    } else {
      if(state.selected==null){
        fb.className='tqc-feedback no';
        fb.textContent='Please select an answer.';
        return;
      }
      ok = state.selected === q.answer;

      // paint options
      qsa('.tqc-option',card).forEach((opt,i)=>{
        opt.classList.remove('correct','incorrect');
        if(i===q.answer) opt.classList.add('correct');
        else if(i===state.selected) opt.classList.add('incorrect');
      });
    }

    if(ok){ state.score++; qs('#qscore').textContent = state.score; }

    fb.className = `tqc-feedback ${ok?'ok':'no'}`;
    const def = q.definition ? `<br><br><strong>Definition:</strong> ${q.definition}` : '';
    fb.innerHTML = (ok?'✅ Correct! ':'❌ Not quite.') + (q.explanation?`<br>${q.explanation}`:'') + def;

    // Next / Final
    const actions = el('div','tqc-actions');
    const w = state.weeks[state.currentWeek];
    if(state.idx < w.questions.length-1){
      const next = el('button','tqc-cta','Next →');
      next.addEventListener('click', ()=>{
        state.idx++; state.selected=null; state.dragAnswers={}; state.hintUsed=false;
        renderQuestion();
      });
      actions.appendChild(next);
    } else {
      const finish = el('button','tqc-cta','See Final Score');
      finish.addEventListener('click', showFinal);
      actions.appendChild(finish);
    }
    fb.appendChild(actions);
  }

  function showFinal(){
    const w = state.weeks[state.currentWeek];
    const total = w.questions.length;
    const pct = Math.round((state.score/total)*100);
    const wrap = qs('#tqc-qwrap'); wrap.innerHTML='';

    const card = el('div','tqc-final');
    card.innerHTML = `
      <h2>🎉 ${w.title} Completed!</h2>
      <div style="font-size:3rem;margin:.5rem 0">${pct}%</div>
      <p><strong>You got ${state.score} out of ${total} correct.</strong></p>
    `;
    const again = el('button',null,'Try this week again');
    again.addEventListener('click', ()=>selectWeek(state.currentWeek, qs('.tqc-card').parentElement));
    const nextKey = nextWeekKey();
    card.appendChild(again);
    if(nextKey){
      const nextBtn = el('button',null,`Next week →`);
      nextBtn.addEventListener('click', ()=>selectWeek(nextKey, qs('.tqc-card').parentElement));
      card.appendChild(nextBtn);
    }
    wrap.appendChild(card);
  }

  function nextWeekKey(){
    const keys = Object.keys(state.weeks).map(Number).sort((a,b)=>a-b);
    const i = keys.indexOf(Number(state.currentWeek));
    return keys[i+1] ? String(keys[i+1]) : null;
  }

  function selectWeek(week, container){
    state.currentWeek = String(week);
    state.idx=0; state.score=0; state.selected=null; state.dragAnswers={}; state.hintUsed=false;
    render(container);
    const url = new URL(location.href); url.searchParams.set('week', state.currentWeek);
    history.replaceState(null,'',url.toString());
  }

  // Boot on page load
  window.addEventListener('DOMContentLoaded', async ()=>{
    const container = document.getElementById('ttc-quiz-root');
    if(!container){ console.error('Missing #ttc-quiz-root'); return; }

    try{
      await loadData();
      const want = getParam('week');
      const first = want && state.weeks[want] ? want : Object.keys(state.weeks).sort((a,b)=>Number(a)-Number(b))[0];
      state.currentWeek = first || '1';
      render(container);
    }catch(e){
      container.innerHTML = `<div class="tqc-card ttc-quiz"><p>Could not load quiz data. ${e.message}</p></div>`;
    }
  });
})();
