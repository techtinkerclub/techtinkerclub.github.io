
// ===== Tech Tinker Club — Quiz Engine (MCQ + Match + Parsons) =====
// Drop-in replacement with backward compatibility and a new 'parsons' type
// Assumptions:
// - questions.json has shape: { "weeks": { "1": {...}, "2": {...}, ... } }
// - Supported question types: 'multiple-choice' (alias: 'mcq'),
//   'drag-drop' (alias: 'match'), and NEW 'parsons'.
// - 'match' supports TWO modes automatically:
//    A) Normal matching (terms↔definitions), 0-based 'correctMatches' (term index -> def index)
//    B) Reorder-the-lines (Parsons-lite): definitions like ["1st line","2nd line",...] and
//       'correctMatches' are 1-based positions (top→bottom). This keeps your existing quizzes working.

// ====== CONFIG ======
const QUESTIONS_PATH = 'questions.json'; // adjust if you host elsewhere
const USE_HASH_WEEK   = true;            // pick week from URL hash #8

// ====== Helpers ======
const qs  = (sel, root=document) => root.querySelector(sel);
const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const el  = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (typeof html === 'string') n.innerHTML = html;
  return n;
};
function shuffle(arr){ for (let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// ====== State ======
const state = {
  data: null,
  weekKey: null,
  questions: [],
  idx: 0,
  locked: false
};

// ====== Load ======
async function loadQuestions(){
  const res = await fetch(QUESTIONS_PATH, {cache:'no-cache'});
  if (!res.ok) throw new Error('Failed to load questions.json');
  state.data = await res.json();
}

function getWeekKey(){
  if (USE_HASH_WEEK){
    const h = (location.hash||'').replace('#','').trim();
    if (h && state.data.weeks[h]) return h;
  }
  // fallback: highest week number available
  const keys = Object.keys(state.data.weeks)
    .filter(k => /^\d+$/.test(k))
    .map(k => Number(k))
    .sort((a,b)=>a-b);
  return String(keys[keys.length-1] || 1);
}

function normalizeWeek(week){
  week.title = week.title || '';
  week.description = week.description || '';
  week.locked = !!week.locked;
  week.questions = Array.isArray(week.questions) ? week.questions : [];
  week.questions.forEach(normalizeQuestion);
}

function normalizeQuestion(q){
  // type normalisation
  const t = (q.type || '').toLowerCase().trim();
  if (t === 'multiple-choice' || t === 'mcq') q.type = 'mcq';
  else if (t === 'drag-drop' || t === 'match') q.type = 'match';
  else if (t === 'parsons') q.type = 'parsons';
  else q.type = 'mcq';

  // MCQ
  if (q.type === 'mcq'){
    q.options = q.options || [];
    if (typeof q.correct === 'number' && typeof q.answer === 'undefined') q.answer = q.correct;
    if (typeof q.answer !== 'number') q.answer = 0;
  }

  // MATCH (two modes supported)
  if (q.type === 'match'){
    q.terms = q.terms || [];
    q.definitions = q.definitions || [];
    q.correctMatches = Array.isArray(q.correctMatches) ? q.correctMatches : [];
    // detection: are definitions "1st line"/"2nd line" style? -> treat as Parsons-lite (1-based)
    q._isReorder = q.definitions.every(d => /^\s*\d+(st|nd|rd|th)\s+line\s*$/i.test(d) || /^(1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th)\s+line$/i.test(d));
  }

  // PARSONS
  if (q.type === 'parsons'){
    q.lines = Array.isArray(q.lines) ? q.lines : [];
    q.correctOrder = Array.isArray(q.correctOrder) ? q.correctOrder : [];
  }

  // niceties
  q.hint = q.hint || '';
  q.explanation = q.explanation || '';
  q.difficulty = q.difficulty || '';
  q.codeLabel = q.codeLabel || '';
  q.code = q.code || '';
}

// ====== Render ======
function renderApp(){
  const root = qs('#quiz-root') || document.body;
  root.innerHTML = '';

  const header = el('div','tqc-header');
  const h1 = el('h2','', esc(state.data.weeks[state.weekKey].title || `Week ${state.weekKey}`));
  const p  = el('p','tqc-desc', esc(state.data.weeks[state.weekKey].description||''));
  header.appendChild(h1);
  header.appendChild(p);

  const card = el('div','tqc-card');
  card.id = 'tqc-card';

  const nav = el('div','tqc-nav');
  const idxInfo = el('div','tqc-idx', `Question <strong>${state.idx+1}</strong> of ${state.questions.length}`);
  const btnPrev = el('button','tqc-btn', '◀ Prev');
  const btnNext = el('button','tqc-btn', 'Next ▶');
  btnPrev.disabled = (state.idx===0);
  btnNext.disabled = (state.idx>=state.questions.length-1);
  btnPrev.addEventListener('click', ()=>{ if (state.idx>0){ state.idx--; renderApp(); }});
  btnNext.addEventListener('click', ()=>{ if (state.idx<state.questions.length-1){ state.idx++; renderApp(); }});
  nav.appendChild(idxInfo);
  nav.appendChild(btnPrev);
  nav.appendChild(btnNext);

  root.appendChild(header);
  root.appendChild(card);
  root.appendChild(nav);

  renderQuestion(card, state.questions[state.idx]);
}

function renderQuestion(card, q){
  state.locked = false;
  card.innerHTML = '';

  const title = el('div','tqc-q');
  title.appendChild(el('div','tqc-qtext', esc(q.question)));

  if (q.code){
    const pre = el('pre','tqc-code');
    pre.textContent = q.code;
    const label = q.codeLabel ? el('div','tqc-codelabel', esc(q.codeLabel)) : null;
    if (label) card.appendChild(label);
    card.appendChild(pre);
  }

  // --- type branches ---
  if (q.type === 'mcq'){
    const list = el('div','tqc-mcq');
    q.options.forEach((opt, i)=>{
      const row = el('label','tqc-mcq-row');
      const input = el('input');
      input.type = 'radio';
      input.name = 'mcq';
      input.value = String(i);
      row.appendChild(input);
      row.appendChild(el('span','', esc(opt)));
      list.appendChild(row);
    });
    card.appendChild(list);
  }
  else if (q.type === 'match'){
    // two modes:
    // A) normal match (terms↔definitions) — q._isReorder === false, 0-based correctMatches (term->def)
    // B) reorder the lines (Parsons-lite) — q._isReorder === true, 1-based positions

    const wrap = el('div','tqc-dd');

    // LEFT pool: terms
    const left = el('div','tqc-col');
    left.appendChild(el('div','tqc-col-h','🧩 Terms'));
    const pool = el('div','tqc-pool'); pool.id = 'tqc-pool';
    const terms = q.terms.map((t, i) => ({ text: t, _termIndex: i }));
    shuffle(terms).forEach(T=>{
      const t = el('div','tqc-term', T.text);
      t.draggable = true;
      t.dataset.termIndex = String(T._termIndex);
      t.addEventListener('dragstart', onDragStart);
      t.addEventListener('dragend', onDragEnd);
      pool.appendChild(t);
    });
    left.appendChild(pool);

    // pool dropback
    pool.addEventListener('dragover', e=>{ if(!state.locked) e.preventDefault(); });
    pool.addEventListener('drop', e=>{
      if (state.locked) return; e.preventDefault();
      const termIndex = e.dataTransfer.getData('text/plain');
      const n = qs(`.tqc-term[data-term-index="${termIndex}"]`);
      if (n) pool.appendChild(n);
    });

    // RIGHT: slots for definitions (or ordered positions)
    const right = el('div','tqc-col');
    right.appendChild(el('div','tqc-col-h', q._isReorder ? '📐 Order (top → bottom)' : '🎯 Definitions'));
    const rwrap = el('div');

    // Build slots
    const defs = q.definitions.map((d, i) => ({ text: d, _defIndex: i }));
    defs.forEach(D=>{
      const z = el('div','tqc-drop');
      if (!q._isReorder){
        // normal match shows definition text
        z.innerHTML = esc(D.text);
      } else {
        // reorder shows just the target label (e.g., "1st line")
        z.innerHTML = esc(D.text);
      }
      z.dataset.defIndex = String(D._defIndex);
      z.addEventListener('dragover', e=>{ if(!state.locked) e.preventDefault(); });
      z.addEventListener('dragenter', e=>{ if(!state.locked) z.classList.add('drag-over'); });
      z.addEventListener('dragleave', e=> z.classList.remove('drag-over'));
      z.addEventListener('drop', e=>{ if(!state.locked) onDropZone(e, pool); });
      rwrap.appendChild(z);
    });

    right.appendChild(rwrap);
    wrap.appendChild(left);
    wrap.appendChild(right);
    card.appendChild(wrap);
  }
  else if (q.type === 'parsons'){
    // Full Parsons: lines with optional indent/distractors; correctOrder is array of 0-based indexes
    const dd = el('div','tqc-dd');

    // LEFT column
    const left = el('div','tqc-col');
    left.appendChild(el('div','tqc-col-h','🧩 Lines'));
    const pool = el('div','tqc-pool'); pool.id = 'tqc-pool';

    const lines = q.lines.map((ln, idx)=>({ ...ln, _idx: idx }));
    shuffle(lines).forEach(L=>{
      const t = el('div','tqc-term tqc-line', L.text);
      t.draggable = true;
      t.dataset.termIndex = String(L._idx);
      if (typeof L.indent === 'number') t.dataset.indent = String(L.indent);
      t.addEventListener('dragstart', onDragStart);
      t.addEventListener('dragend', onDragEnd);
      pool.appendChild(t);
    });
    left.appendChild(pool);

    // pool accepts dropback
    pool.addEventListener('dragover', e=>{ if(!state.locked) e.preventDefault(); });
    pool.addEventListener('drop', e=>{
      if (state.locked) return; e.preventDefault();
      const termIndex = e.dataTransfer.getData('text/plain');
      const n = qs(`.tqc-term[data-term-index="${termIndex}"]`);
      if (n) pool.appendChild(n);
    });

    // RIGHT column: N slots == q.correctOrder.length
    const right = el('div','tqc-col');
    right.appendChild(el('div','tqc-col-h','📐 Order (top → bottom)'));
    const rwrap = el('div');
    for (let i=0;i<q.correctOrder.length;i++){
      const z = el('div','tqc-drop tqc-slot', `Line ${i+1}`);
      z.dataset.defIndex = String(i);
      z.addEventListener('dragover', e=>{ if(!state.locked) e.preventDefault(); });
      z.addEventListener('dragenter', e=>{ if(!state.locked) z.classList.add('drag-over'); });
      z.addEventListener('dragleave', e=> z.classList.remove('drag-over'));
      z.addEventListener('drop', e=>{ if(!state.locked) onDropZone(e, pool); });
      rwrap.appendChild(z);
    }
    right.appendChild(rwrap);

    dd.appendChild(left);
    dd.appendChild(right);
    card.appendChild(dd);
  }

  // hint
  if (q.hint){
    const hint = el('div','tqc-hint','💡 Hint: ' + esc(q.hint));
    card.appendChild(hint);
  }

  // submit
  const actions = el('div','tqc-actions');
  const btn = el('button','tqc-submit','Check Answer');
  btn.addEventListener('click', submitAnswer);
  actions.appendChild(btn);
  card.appendChild(actions);

  // feedback
  card.appendChild(el('div','tqc-feedback'));
}

function onDragStart(e){
  const t = e.target.closest('.tqc-term');
  if (!t) return;
  e.dataTransfer.setData('text/plain', t.dataset.termIndex || '');
  requestAnimationFrame(()=> t.classList.add('dragging'));
}
function onDragEnd(e){
  const t = e.target.closest('.tqc-term');
  if (!t) return;
  t.classList.remove('dragging');
}
function onDropZone(e, pool){
  e.preventDefault();
  const z = e.currentTarget;
  z.classList.remove('drag-over');
  const termIndex = e.dataTransfer.getData('text/plain');
  if (!termIndex && termIndex!== '0') return;
  const dragged = qs(`.tqc-term[data-term-index="${termIndex}"]`);
  if (!dragged) return;

  // ensure only one term per slot (move existing back to pool)
  const existing = z.querySelector('.tqc-term');
  if (existing) pool.appendChild(existing);
  z.appendChild(dragged);
}

function submitAnswer(){
  if (state.locked) return;
  const q = state.questions[state.idx];
  const card = qs('#tqc-card');
  const feedback = qs('.tqc-feedback', card);
  let isCorrect = false;

  if (q.type === 'mcq'){
    const chosen = qs('input[name="mcq"]:checked', card);
    const idx = chosen ? Number(chosen.value) : -1;
    isCorrect = (idx === q.answer);
    qsa('.tqc-mcq-row', card).forEach((row, i)=>{
      row.classList.toggle('correct', i === q.answer);
      row.classList.toggle('incorrect', i !== q.answer && i === idx);
    });
  }
  else if (q.type === 'match'){
    const zones = qsa('.tqc-drop', card);
    const pairs = []; // {termIndex, defIndex}
    zones.forEach(z=>{
      const defIndex = Number(z.dataset.defIndex);
      const term = z.querySelector('.tqc-term');
      const termIndex = term ? Number(term.dataset.termIndex) : null;
      pairs.push({defIndex, termIndex});
    });

    // Two modes:
    // A) Normal match: correctMatches = array mapping termIndex -> defIndex (0-based)
    // B) Reorder (Parsons-lite): definitions like "1st line"..."N-th line"
    //    correctMatches = [1..N] (1-based positions). We verify slot order.
    if (!q._isReorder){
      // build an answer map from termIndex -> defIndex user placed
      const userMap = {};
      pairs.forEach(p=>{ if (p.termIndex !== null) userMap[p.termIndex] = p.defIndex; });

      // check each termIndex against expected defIndex
      let allPlaced = true, allRight = true;
      q.terms.forEach((_, termIdx)=>{
        const expectedDef = q.correctMatches[termIdx]; // 0-based
        const got = userMap[termIdx];
        const ok = (typeof got === 'number') && (got === expectedDef);
        if (typeof got !== 'number') allPlaced = false;
        if (!ok) allRight = false;
      });
      isCorrect = allPlaced && allRight;

      // per-zone colouring: find which termIndex belongs to each defIndex
      zones.forEach(z=>{
        const defIdx = Number(z.dataset.defIndex);
        // find expected term for this def
        const expectedTermIdx = q.correctMatches.findIndex(def => def === defIdx);
        const placedTerm = z.querySelector('.tqc-term');
        const ok = placedTerm && Number(placedTerm.dataset.termIndex) === expectedTermIdx;
        z.classList.toggle('correct', !!ok);
        z.classList.toggle('incorrect', !ok);
      });
    } else {
      // reorder mode:
      // correctMatches are 1-based positions. Slots are in defIndex order already.
      const positions = pairs.map(p => p.termIndex); // array of termIndex in slot order
      const allFilled = positions.every(x => typeof x === 'number');
      // build expected by converting 1-based positions to termIndex we expect in each slot
      // Here we simply expect slot k to contain the term whose correct position is (k+1).
      // So if correctMatches[termIndex] === (k+1) => this term belongs in slot k.
      const expectedTermAtSlot = pairs.map(_=>null);
      q.correctMatches.forEach((pos1based, termIdx)=>{
        const slot = pos1based - 1; // convert to 0-based slot index
        if (slot>=0 && slot<expectedTermAtSlot.length){
          expectedTermAtSlot[slot] = termIdx;
        }
      });
      const same = allFilled && positions.length === expectedTermAtSlot.length &&
                   positions.every((v,i)=> v === expectedTermAtSlot[i]);
      isCorrect = same;

      // per-slot colouring
      qsa('.tqc-drop', card).forEach((z,i)=>{
        const placed = z.querySelector('.tqc-term');
        const ok = placed && Number(placed.dataset.termIndex) === expectedTermAtSlot[i];
        z.classList.toggle('correct', !!ok);
        z.classList.toggle('incorrect', !ok);
      });
    }
  }
  else if (q.type === 'parsons'){
    // collect placed original indexes in slot order
    const zones = qsa('.tqc-drop', card);
    const placed = zones.map(z=>{
      const t = z.querySelector('.tqc-term');
      return t ? Number(t.dataset.termIndex) : null;
    });
    const allFilled = placed.every(x => typeof x === 'number');
    isCorrect = allFilled &&
                placed.length === q.correctOrder.length &&
                placed.every((v,i)=> v === q.correctOrder[i]);

    zones.forEach((z,i)=>{
      const t = z.querySelector('.tqc-term');
      const ok = t && Number(t.dataset.termIndex) === q.correctOrder[i];
      z.classList.toggle('correct', !!ok);
      z.classList.toggle('incorrect', !ok);
    });
  }

  // lock + feedback
  state.locked = true;
  feedback.innerHTML = '';
  feedback.className = 'tqc-feedback ' + (isCorrect ? 'ok' : 'bad');
  const msg = isCorrect ? '✅ Correct!' : '❌ Not quite.';
  feedback.appendChild(el('div','', msg));
  if (state.questions[state.idx].explanation){
    feedback.appendChild(el('div','tqc-explain', esc(state.questions[state.idx].explanation)));
  }
}

// ====== Boot ======
async function boot(){
  await loadQuestions();
  state.weekKey = getWeekKey();
  const week = state.data.weeks[state.weekKey];
  normalizeWeek(week);
  state.questions = week.questions;
  state.idx = 0;
  renderApp();
}

document.addEventListener('DOMContentLoaded', boot);
