<!-- Place in your repo as: quiz.js -->
// Tiny helpers
const $ = (sel, root=document) => root.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const getParam = (k) => new URLSearchParams(location.search).get(k);

// ---------- state ----------
const state = {
  weeks: {},         // loaded from JSON
  currentWeek: null, // string key, e.g. "7"
  idx: 0,            // question index within week
  score: 0,
  selected: null,    // selected option for MCQ
  dragAnswers: {},   // for drag-drop
  hintUsed: false,
  locked: false,     // has the current question been submitted?
  mode: 'week'       // 'week' | 'instructions'
};

// ---------- Instructions content ----------
const INSTRUCTIONS_HTML = `
  <div class="tqc-instructions">
    <h2>📘 How to Use This Quiz</h2>
    <ul class="tqc-list">
      <li>Pick a week to practise ideas we learned in class.</li>
      <li>Questions are <strong>multiple-choice</strong> or <strong>drag &amp; drop (match)</strong>.</li>
      <li>Click <strong>Submit</strong> to check your answer. The question then <strong>locks</strong>.</li>
      <li>If a question has a <strong>Hint</strong>, use it — it won’t reduce your score.</li>
    </ul>

    <h3>🧠 What is Pseudocode?</h3>
    <p>
      <strong>Pseudocode</strong> is simple, pretend code that reads like a recipe. It matches MakeCode blocks
      but is easier to read for tracing logic.
    </p>
    <pre class="tqc-code">repeat 3 times
  show icon "heart"
  pause 200
end</pre>

    <h3>🧩 Blocks vs. Pseudocode</h3>
    <ul class="tqc-list">
      <li><strong>Blocks</strong>: colourful puzzle pieces in MakeCode.</li>
      <li><strong>Pseudocode</strong>: tidy text steps that mean the same thing.</li>
      <li>Read top-to-bottom and track values like <code>x</code>, <code>score</code>, <code>level</code>.</li>
    </ul>

    <h3>✍️ Helpful Tools</h3>
    <ul class="tqc-list">
      <li>Keep a <strong>pencil &amp; paper</strong> to track numbers.</li>
      <li>Do small maths carefully (e.g., <code>2000 ms ÷ 50 ms</code>).</li>
      <li>Circle conditions such as <code>x &gt; 2</code> so you don’t miss details.</li>
    </ul>

    <h3>🧭 Reading Sensor Questions</h3>
    <ul class="tqc-list">
      <li><strong>Accelerometer X</strong>: tilt right → big positive; tilt left → big negative.</li>
      <li>If it says “move when |X| &gt; 200”, only <em>big</em> tilts count.</li>
    </ul>

    <h3>✅ Drag &amp; Drop Tips</h3>
    <ul class="tqc-list">
      <li>Drag terms into the definition boxes. Drag again to change your mind.</li>
      <li>All boxes must be correct for full marks.</li>
    </ul>

    <h3>🔐 Submitting &amp; Scoring</h3>
    <ul class="tqc-list">
      <li><strong>Submit</strong> locks the question and shows feedback.</li>
      <li>Use <strong>Next Question</strong> to continue.</li>
    </ul>

    <h3>🧒 For Children &amp; Families</h3>
    <ul class="tqc-list">
      <li>Mistakes are part of learning — read the feedback and try again later.</li>
      <li>Read pseudocode slowly; saying it aloud can help.</li>
    </ul>
  </div>
`;

// ---------- Rendering ----------
function render(container){
  container.innerHTML = '';
  const card = el('div','tqc-card');

  // Header
  const header = el('div','tqc-header');
  header.appendChild(el('h1','tqc-title','Tech Tinker Club'));
  header.appendChild(el('p','tqc-sub','Micro:bit learning adventures — choose a week!'));
  const topActions = el('div','tqc-top-actions');
  const infoBtn = el('button','tqc-btn tqc-info-btn','📘 Instructions');
  infoBtn.addEventListener('click', ()=>selectInstructions(container));
  topActions.appendChild(infoBtn);
  header.appendChild(topActions);
  card.appendChild(header);

  // Weeks bar
  const weeksBar = el('div','tqc-weeks');
  const weekKeys = Object.keys(state.weeks).sort((a,b)=>Number(a)-Number(b));
  weekKeys.forEach((wk)=>{
    const data = state.weeks[wk];
    const hasQs  = data && Array.isArray(data.questions) && data.questions.length > 0;
    const locked = data && data.locked === true;

    const b = el('button','tqc-btn',`Week ${wk}`);
    if (String(state.currentWeek) === wk && state.mode === 'week') b.setAttribute('aria-current','true');

    if (!hasQs || locked){
      b.disabled = true;
      b.title = locked ? 'Locked' : 'Coming soon';
    } else {
      b.addEventListener('click',()=>{
        state.mode = 'week';
        selectWeek(wk, container);
      });
    }
    weeksBar.appendChild(b);
  });
  card.appendChild(weeksBar);

  // If instructions page
  if (state.mode === 'instructions'){
    const wrap = el('div'); wrap.id = 'tqc-qwrap';
    card.appendChild(wrap);
    wrap.innerHTML = INSTRUCTIONS_HTML;
    container.appendChild(card);
    return;
  }

  // Week view
  const wk = state.weeks[state.currentWeek];
  const wrap = el('div'); wrap.id = 'tqc-qwrap';
  card.appendChild(wrap);

  if (!wk || !wk.questions || wk.questions.length === 0){
    wrap.appendChild(el('p','tqc-empty','No questions available.'));
    container.appendChild(card);
    return;
  }

  // Title + desc
  wrap.appendChild(el('h2','tqc-weektitle', wk.title || `Week ${state.currentWeek}`));
  if (wk.description) wrap.appendChild(el('p','tqc-weekdesc', wk.description));

  renderQuestion(wrap, wk.questions[state.idx]);

  // Footer (nav)
  const foot = el('div','tqc-foot');
  const progress = el('div','tqc-progress', `Question ${state.idx + 1} of ${wk.questions.length} • Score: ${state.score}`);
  foot.appendChild(progress);

  const prevBtn = el('button','tqc-btn','◀ Previous');
  prevBtn.disabled = state.idx === 0;
  prevBtn.addEventListener('click',()=> { if (state.idx>0){ state.idx--; state.selected=null; state.dragAnswers={}; state.locked=false; state.hintUsed=false; render(container); }});
  foot.appendChild(prevBtn);

  const nextBtn = el('button','tqc-btn tqc-prim','Next ▶');
  nextBtn.addEventListener('click',()=>{
    const wk = state.weeks[state.currentWeek];
    if (state.idx < wk.questions.length - 1){
      state.idx++; state.selected=null; state.dragAnswers={}; state.locked=false; state.hintUsed=false; render(container);
    } else {
      renderFinal(container);
    }
  });
  foot.appendChild(nextBtn);

  card.appendChild(foot);
  container.appendChild(card);
}

function renderFinal(container){
  container.innerHTML = '';
  const card = el('div','tqc-card');
  card.appendChild(el('h2','', 'Great work!'));
  card.appendChild(el('p','', `You reached a score of ${state.score}.`));

  const again = el('button','tqc-btn tqc-prim','Back to weeks');
  again.addEventListener('click', ()=>{
    state.mode = 'week';
    state.idx = 0;
    state.score = 0;
    state.selected = null;
    state.dragAnswers = {};
    state.locked = false;
    const c = $('#tqc-root');
    render(c);
  });
  card.appendChild(again);
  container.appendChild(card);
}

function selectInstructions(container){
  state.mode = 'instructions';
  render(container);
}

function selectWeek(weekKey, container){
  state.currentWeek = String(weekKey);
  state.idx = 0;
  state.score = 0;
  state.selected = null;
  state.dragAnswers = {};
  state.locked = false;
  state.mode = 'week';
  render(container);
}

// ---------- Question renderers ----------
function renderQuestion(wrap, q){
  const box = el('div','tqc-qbox');
  // stem
  const stem = el('div','tqc-stem');
  stem.appendChild(el('div','tqc-qtext', q.question));
  if (q.code){
    const label = el('div','tqc-codelabel', q.codeLabel || 'Code');
    const pre = el('pre','tqc-code'); pre.textContent = q.code;
    stem.appendChild(label);
    stem.appendChild(pre);
  }
  wrap.appendChild(stem);

  // body
  const body = el('div','tqc-body');
  if (q.type === 'multiple-choice'){
    renderMCQ(body, q);
  } else if (q.type === 'drag-drop'){
    renderDragDrop(body, q);
  } else {
    body.appendChild(el('p','', 'Unsupported question type.'));
  }
  wrap.appendChild(body);

  // hint + submit
  const actions = el('div','tqc-actions');
  if (q.hint){
    const hintBtn = el('button','tqc-btn','💡 Hint');
    hintBtn.addEventListener('click', ()=>{
      if (!state.locked){
        state.hintUsed = true;
        alert(q.hint);
      }
    });
    actions.appendChild(hintBtn);
  }

  const submit = el('button','tqc-btn tqc-prim','Submit');
  submit.disabled = state.locked;
  submit.addEventListener('click', ()=>submitAnswer(wrap, q));
  actions.appendChild(submit);

  wrap.appendChild(actions);

  // meta row (definition/difficulty)
  const meta = el('div','tqc-meta');
  if (q.definition) meta.appendChild(el('div','tqc-def', `Definition: ${q.definition}`));
  if (q.difficulty) meta.appendChild(el('div','tqc-diff', `Difficulty: ${q.difficulty}`));
  wrap.appendChild(meta);
}

function renderMCQ(root, q){
  const list = el('div','tqc-mcq');
  q.options.forEach((opt, i)=>{
    const btn = el('button','tqc-opt', opt);
    if (state.selected === i) btn.classList.add('is-selected');
    btn.addEventListener('click', ()=>{
      if (state.locked) return;
      state.selected = i;
      [...list.children].forEach(c => c.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    });
    list.appendChild(btn);
  });
  root.appendChild(list);
}

function renderDragDrop(root, q){
  // Terms (draggables)
  const bank = el('div','tqc-dd-bank');
  (q.terms || []).forEach((t, idx)=>{
    const chip = el('div','tqc-chip', t);
    chip.draggable = true;
    chip.dataset.termIndex = idx;
    chip.addEventListener('dragstart', (e)=>{
      e.dataTransfer.setData('text/plain', JSON.stringify({ idx, text:t }));
    });
    bank.appendChild(chip);
  });

  // Targets (definitions)
  const targets = el('div','tqc-dd-targets');
  (q.definitions || []).forEach((d, slot)=>{
    const tgt = el('div','tqc-slot');
    const lab = el('div','tqc-slot-label', d);
    const drop = el('div','tqc-slot-drop', 'Drop term here');
    drop.dataset.slot = slot;

    drop.addEventListener('dragover', (e)=> e.preventDefault());
    drop.addEventListener('drop', (e)=>{
      e.preventDefault();
      if (state.locked) return;
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      state.dragAnswers[slot] = data.idx;
      drop.textContent = q.terms[data.idx];
      drop.classList.add('filled');
    });

    tgt.appendChild(lab);
    tgt.appendChild(drop);
    targets.appendChild(tgt);
  });

  root.appendChild(el('h4','', 'Match the terms to the definitions'));
  root.appendChild(bank);
  root.appendChild(targets);
}

function submitAnswer(wrap, q){
  if (state.locked) return;

  let correct = false;

  if (q.type === 'multiple-choice'){
    if (typeof state.selected !== 'number'){
      alert('Please choose an option first.');
      return;
    }
    correct = (state.selected === q.correct);
  }

  if (q.type === 'drag-drop'){
    const need = (q.correctMatches || []).length;
    const haveAll = Object.keys(state.dragAnswers).length === need;
    if (!haveAll){
      alert('Please fill all matches first.');
      return;
    }
    correct = q.correctMatches.every((termIndex, slotIndex)=>{
      return Number(state.dragAnswers[slotIndex]) === Number(termIndex);
    });
  }

  state.locked = true;
  if (correct) state.score += 1;

  // feedback row
  const fb = el('div', `tqc-feedback ${correct ? 'ok' : 'bad'}`);
  fb.textContent = correct ? '✅ Correct!' : '❌ Not quite — check the explanation below.';
  wrap.appendChild(fb);

  if (q.explanation){
    const exp = el('div','tqc-expl');
    exp.innerHTML = `<strong>Why:</strong> ${q.explanation}`;
    wrap.appendChild(exp);
  }

  // disable options visually
  const opts = wrap.querySelectorAll('.tqc-opt');
  opts.forEach(btn=>{
    btn.disabled = true;
    btn.classList.toggle('is-correct', q.type==='multiple-choice' && btn.textContent === q.options[q.correct]);
  });
}

// ---------- Data loading & init ----------
async function loadQuestions(){
  // Priority 1: global var (if you embed JSON directly on page)
  if (window.TQC_QUESTIONS) return window.TQC_QUESTIONS;

  // Priority 2: try common filenames in the same folder
  const candidates = [
    'questions.json',
    'questions (1).json',
    'questions_v2.json'
  ];

  for (const name of candidates){
    try {
      const r = await fetch(name, { cache:'no-store' });
      if (r.ok){
        const data = await r.json();
        return data;
      }
    } catch (_) { /* continue */ }
  }
  throw new Error('Could not load questions JSON. Place questions.json next to quiz.js or set window.TQC_QUESTIONS.');
}

async function init(){
  const container = document.getElementById('tqc-root');
  if (!container) { console.error('Missing #tqc-root'); return; }

  const data = await loadQuestions();
  // Expect shape: { weeks: { "1": {...}, "2": {...}, ... } }
  state.weeks = data.weeks || {};

  // Deep-link support: ?page=instructions
  const pageParam = (getParam('page') || '').toLowerCase();
  if (pageParam === 'instructions'){
    state.mode = 'instructions';
    render(container);
    return;
  }

  // Choose initial week: ?week=… or first with questions
  const wkParam = getParam('week');
  const weekKeys = Object.keys(state.weeks).sort((a,b)=>Number(a)-Number(b));
  let initial = wkParam && state.weeks[wkParam] ? wkParam : weekKeys.find(k => state.weeks[k].questions?.length > 0 && !state.weeks[k].locked);
  if (!initial) initial = weekKeys[0] || '1';
  state.mode = 'week';
  selectWeek(initial, container);
}

document.addEventListener('DOMContentLoaded', ()=>{
  init().catch(err=>{
    const container = document.getElementById('tqc-root');
    if (container){
      container.innerHTML = '<div class="tqc-card"><p>Failed to load quiz questions.</p></div>';
    }
    console.error(err);
  });
});
