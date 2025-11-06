// Tech Tinker Club — Quiz Engine (MCQ + Match + Parsons)
// Safe drop-in: no global CSS assumptions, no <script> wrapper

const QUESTIONS_PATH = '/assets/quiz/questions.json';

const qs  = (sel, root=document) => root.querySelector(sel);
const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const el  = (tag, cls, html) => { const n=document.createElement(tag); if(cls) n.className=cls; if(typeof html==='string') n.innerHTML=html; return n; };
const shuffle = a => { for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

const state = { data:null, weekKey:null, questions:[], idx:0, locked:false };

function getRoot(){
  return qs('#quiz-root') || qs('#tqc-root') || qs('#quiz') || (()=>{
    const host = document.createElement('div');
    host.id = 'quiz-root';
    const main = qs('main') || document.body;
    main.appendChild(host);
    return host;
  })();
}

async function loadQuestions(){
  const r = await fetch(QUESTIONS_PATH, {cache:'no-store'});
  if(!r.ok) throw new Error('questions.json not found');
  state.data = await r.json();
}

function pickWeek(){
  const weeks = state.data.weeks || {};
  const keys = Object.keys(weeks).filter(k=>/^\d+$/.test(k)).map(Number).sort((a,b)=>a-b);
  const fromHash = (location.hash||'').replace('#','').trim();
  if (fromHash && weeks[fromHash]) return String(fromHash);
  return String(keys[keys.length-1] || keys[0] || '1');
}

function normWeek(w){
  w.title = w.title || '';
  w.description = w.description || '';
  w.locked = !!w.locked;
  w.questions = Array.isArray(w.questions) ? w.questions : [];
  w.questions.forEach(normQ);
}

function normQ(q){
  const t = (q.type||'').toLowerCase().trim();
  if (t==='multiple-choice' || t==='mcq') q.type='mcq';
  else if (t==='drag-drop' || t==='match') q.type='match';
  else if (t==='parsons') q.type='parsons';
  else q.type='mcq';

  if (q.type==='mcq'){
    q.options = q.options || [];
    if (typeof q.answer==='undefined' && typeof q.correct==='number') q.answer=q.correct;
    if (typeof q.answer!=='number') q.answer=0;
  }

  if (q.type==='match'){
    q.terms = q.terms || [];
    q.definitions = q.definitions || [];
    q.correctMatches = Array.isArray(q.correctMatches)?q.correctMatches:[];
    // auto-detect “reorder” style (definitions = “1st line”, “2nd line”, …)
    q._isReorder = q.definitions.every(d => /^\s*\d+(st|nd|rd|th)\s+line\s*$/i.test(d));
  }

  if (q.type==='parsons'){
    q.lines = Array.isArray(q.lines)?q.lines:[];
    q.correctOrder = Array.isArray(q.correctOrder)?q.correctOrder:[];
  }

  q.hint = q.hint || '';
  q.explanation = q.explanation || '';
  q.code = q.code || '';
  q.codeLabel = q.codeLabel || '';
}

function renderApp(){
  const root = getRoot();
  root.innerHTML = '';

  const header = el('div','tqc-header');
  header.appendChild(el('h2','', esc(state.data.weeks[state.weekKey].title||`Week ${state.weekKey}`)));
  if (state.data.weeks[state.weekKey].description){
    header.appendChild(el('p','tqc-desc', esc(state.data.weeks[state.weekKey].description)));
  }
  root.appendChild(header);

  const card = el('div','tqc-card'); card.id='tqc-card'; root.appendChild(card);

  const nav = el('div','tqc-nav');
  const idxInfo = el('div','tqc-idx', `Question <strong>${state.idx+1}</strong> of ${state.questions.length}`);
  const prev = el('button','tqc-btn','◀ Prev');
  const next = el('button','tqc-btn','Next ▶');
  prev.disabled = (state.idx===0);
  next.disabled = (state.idx>=state.questions.length-1);
  prev.addEventListener('click',()=>{ if(state.idx>0){ state.idx--; renderApp(); }});
  next.addEventListener('click',()=>{ if(state.idx<state.questions.length-1){ state.idx++; renderApp(); }});
  nav.appendChild(idxInfo); nav.appendChild(prev); nav.appendChild(next);
  root.appendChild(nav);

  renderQuestion(card, state.questions[state.idx]);
}

function renderQuestion(card,q){
  state.locked=false; card.innerHTML='';

  const title = el('div','tqc-q');
  title.appendChild(el('div','tqc-qtext', esc(q.question)));
  card.appendChild(title);

  if (q.code){
    if (q.codeLabel) card.appendChild(el('div','tqc-codelabel', esc(q.codeLabel)));
    const pre=el('pre','tqc-code'); pre.textContent=q.code; card.appendChild(pre);
  }

  if (q.type==='mcq'){
    const list = el('div','tqc-mcq');
    q.options.forEach((opt,i)=>{
      const row = el('label','tqc-mcq-row');
      const input = el('input'); input.type='radio'; input.name='mcq'; input.value=String(i);
      row.appendChild(input); row.appendChild(el('span','',esc(opt)));
      list.appendChild(row);
    });
    card.appendChild(list);
  }

  if (q.type==='match'){
    const wrap = el('div','tqc-dd');

    // LEFT pool
    const left = el('div','tqc-col');
    left.appendChild(el('div','tqc-col-h','🧩 Terms'));
    const pool = el('div','tqc-pool'); pool.id='tqc-pool';
    shuffle(q.terms.map((t,i)=>({text:t,_i:i}))).forEach(T=>{
      const t=el('div','tqc-term',T.text); t.draggable=true; t.dataset.termIndex=String(T._i);
      t.addEventListener('dragstart',onDragStart); t.addEventListener('dragend',onDragEnd);
      pool.appendChild(t);
    });
    pool.addEventListener('dragover',e=>{ if(!state.locked) e.preventDefault(); });
    pool.addEventListener('drop',e=>{
      if(state.locked) return; e.preventDefault();
      const idx=e.dataTransfer.getData('text/plain'); const n=qs(`.tqc-term[data-term-index="${idx}"]`); if(n) pool.appendChild(n);
    });
    left.appendChild(pool);

    // RIGHT drops (definitions or ordered slots)
    const right = el('div','tqc-col');
    right.appendChild(el('div','tqc-col-h', q._isReorder?'📐 Order (top → bottom)':'🎯 Definitions'));
    const rwrap = el('div');
    q.definitions.forEach((d,i)=>{
      const z=el('div','tqc-drop', esc(d)); z.dataset.defIndex=String(i);
      z.addEventListener('dragover',e=>{ if(!state.locked) e.preventDefault(); });
      z.addEventListener('dragenter',e=>{ if(!state.locked) z.classList.add('drag-over'); });
      z.addEventListener('dragleave',e=> z.classList.remove('drag-over'));
      z.addEventListener('drop',e=>{ if(!state.locked) onDropZone(e,pool); });
      rwrap.appendChild(z);
    });
    right.appendChild(rwrap);

    wrap.appendChild(left); wrap.appendChild(right);
    card.appendChild(wrap);
  }

  if (q.type==='parsons'){
    const dd = el('div','tqc-dd');

    const left = el('div','tqc-col');
    left.appendChild(el('div','tqc-col-h','🧩 Lines'));
    const pool = el('div','tqc-pool'); pool.id='tqc-pool';
    shuffle(q.lines.map((ln,i)=>({ ...ln, _i:i }))).forEach(L=>{
      const t=el('div','tqc-term tqc-line', L.text); t.draggable=true; t.dataset.termIndex=String(L._i);
      if (typeof L.indent==='number') t.dataset.indent=String(L.indent);
      t.addEventListener('dragstart',onDragStart); t.addEventListener('dragend',onDragEnd);
      pool.appendChild(t);
    });
    pool.addEventListener('dragover',e=>{ if(!state.locked) e.preventDefault(); });
    pool.addEventListener('drop',e=>{
      if(state.locked) return; e.preventDefault();
      const idx=e.dataTransfer.getData('text/plain'); const n=qs(`.tqc-term[data-term-index="${idx}"]`); if(n) pool.appendChild(n);
    });
    left.appendChild(pool);

    const right = el('div','tqc-col');
    right.appendChild(el('div','tqc-col-h','📐 Order (top → bottom)'));
    const rwrap = el('div');
    for(let i=0;i<q.correctOrder.length;i++){
      const z=el('div','tqc-drop tqc-slot',`Line ${i+1}`); z.dataset.defIndex=String(i);
      z.addEventListener('dragover',e=>{ if(!state.locked) e.preventDefault(); });
      z.addEventListener('dragenter',e=>{ if(!state.locked) z.classList.add('drag-over'); });
      z.addEventListener('dragleave',e=> z.classList.remove('drag-over'));
      z.addEventListener('drop',e=>{ if(!state.locked) onDropZone(e,pool); });
      rwrap.appendChild(z);
    }
    right.appendChild(rwrap);

    dd.appendChild(left); dd.appendChild(right);
    card.appendChild(dd);
  }

  if (q.hint){
    card.appendChild(el('div','tqc-hint','💡 Hint: '+esc(q.hint)));
  }

  const actions = el('div','tqc-actions');
  const submit = el('button','tqc-submit','Check Answer');
  submit.addEventListener('click', submitAnswer);
  actions.appendChild(submit);
  card.appendChild(actions);

  card.appendChild(el('div','tqc-feedback'));
}

function onDragStart(e){
  const t=e.target.closest('.tqc-term'); if(!t) return;
  e.dataTransfer.setData('text/plain', t.dataset.termIndex||'');
  requestAnimationFrame(()=> t.classList.add('dragging'));
}
function onDragEnd(e){ const t=e.target.closest('.tqc-term'); if(t) t.classList.remove('dragging'); }
function onDropZone(e,pool){
  e.preventDefault();
  const z=e.currentTarget; z.classList.remove('drag-over');
  const idx=e.dataTransfer.getData('text/plain');
  const dragged=qs(`.tqc-term[data-term-index="${idx}"]`);
  if(!dragged) return;
  const existing=z.querySelector('.tqc-term');
  if(existing) pool.appendChild(existing);
  z.appendChild(dragged);
}

function submitAnswer(){
  if(state.locked) return;
  const q = state.questions[state.idx];
  const card = qs('#tqc-card');
  const fb = qs('.tqc-feedback', card);
  let ok=false;

  if (q.type==='mcq'){
    const chosen = qs('input[name="mcq"]:checked',card);
    const idx = chosen ? Number(chosen.value) : -1;
    ok = (idx === q.answer);
    qsa('.tqc-mcq-row',card).forEach((row,i)=>{
      row.classList.toggle('correct', i===q.answer);
      row.classList.toggle('incorrect', i!==q.answer && i===idx);
    });
  }

  if (q.type==='match'){
    const zones = qsa('.tqc-drop',card);
    const pairs = zones.map(z=>{
      const term = z.querySelector('.tqc-term');
      return { defIndex:Number(z.dataset.defIndex), termIndex: term?Number(term.dataset.termIndex):null };
    });

    if (!q._isReorder){
      const userMap = {};
      pairs.forEach(p=>{ if(p.termIndex!==null) userMap[p.termIndex]=p.defIndex; });
      let allPlaced=true, allRight=true;
      q.terms.forEach((_,termIdx)=>{
        const expectedDef = q.correctMatches[termIdx];
        const got = userMap[termIdx];
        if (typeof got!=='number') allPlaced=false;
        if (got!==expectedDef) allRight=false;
      });
      ok = allPlaced && allRight;

      zones.forEach(z=>{
        const defIdx=Number(z.dataset.defIndex);
        const expectedTermIdx = q.correctMatches.findIndex(d=>d===defIdx);
        const placed=z.querySelector('.tqc-term');
        const good = placed && Number(placed.dataset.termIndex)===expectedTermIdx;
        z.classList.toggle('correct', !!good);
        z.classList.toggle('incorrect', !good);
      });
    } else {
      // reorder: correctMatches are 1-based positions per termIndex
      const expectedTermAtSlot = pairs.map(()=>null);
      q.correctMatches.forEach((pos1,termIdx)=>{
        const slot = pos1-1;
        if (slot>=0 && slot<expectedTermAtSlot.length) expectedTermAtSlot[slot]=termIdx;
      });
      const placed = pairs.map(p=>p.termIndex);
      const allFilled = placed.every(x=>typeof x==='number');
      ok = allFilled && placed.length===expectedTermAtSlot.length &&
           placed.every((v,i)=> v===expectedTermAtSlot[i]);

      zones.forEach((z,i)=>{
        const placedTerm=z.querySelector('.tqc-term');
        const good = placedTerm && Number(placedTerm.dataset.termIndex)===expectedTermAtSlot[i];
        z.classList.toggle('correct', !!good);
        z.classList.toggle('incorrect', !good);
      });
    }
  }

  if (q.type==='parsons'){
    const zones = qsa('.tqc-drop',card);
    const placed = zones.map(z=>{
      const t=z.querySelector('.tqc-term');
      return t?Number(t.dataset.termIndex):null;
    });
    const allFilled = placed.every(x=>typeof x==='number');
    ok = allFilled && placed.length===q.correctOrder.length &&
         placed.every((v,i)=> v===q.correctOrder[i]);

    zones.forEach((z,i)=>{
      const t=z.querySelector('.tqc-term');
      const good = t && Number(t.dataset.termIndex)===q.correctOrder[i];
      z.classList.toggle('correct', !!good);
      z.classList.toggle('incorrect', !good);
    });
  }

  state.locked = true;
  fb.className = 'tqc-feedback ' + (ok?'ok':'bad');
  fb.innerHTML = (ok?'✅ Correct!':'❌ Not quite.') + (q.explanation? `<div class="tqc-explain">${esc(q.explanation)}</div>`:'');
}

async function boot(){
  try{
    await loadQuestions();
    state.weekKey = pickWeek();
    const week = state.data.weeks[state.weekKey];
    normWeek(week);
    state.questions = week.questions;
    state.idx = 0;
    renderApp();
  }catch(e){
    console.error(e);
    const root = getRoot();
    root.innerHTML = '<p>Quiz failed to load. Check console for details.</p>';
  }
}

document.addEventListener('DOMContentLoaded', boot);
