(function(){
  'use strict';
  const G = window.TT99Generator;
  const P = window.TT99SimplePDF;
  const L = window.TT99PDFLayout;
  const root = document.getElementById('tt99-root');
  if (!root || !G || !P || !L) return;

  const STORAGE_KEY = 'tt99-settings-v1';
  const CUSTOM_KEY = 'tt99-custom-presets-v1';
  const VERSION = '1.2';
  const state = {
    schemeId: 'classic',
    clubId: '33',
    rules: G.clone(G.CLASSIC_PRESETS['33']),
    seed: G.newSeed('33'),
    variants: 1,
    orientation: 'portrait',
    sheets: [],
    previewVariant: 0,
    previewAnswers: false,
    school: { schoolName:'', yearGroup:'', className:'', teacherName:'', worksheetDate:'', logoDataUrl:'', logoWidth:0, logoHeight:0 },
    customPresets: loadCustomPresets(),
    advancedOpen: false,
    status: ''
  };

  restoreSettings();
  generateAll();
  render();

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function loadCustomPresets(){ try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); } catch(e){ return []; } }
  function saveCustomPresets(){ try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(state.customPresets)); } catch(e) {} }
  function restoreSettings(){
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (s.schemeId && G.SCHEME_PRESETS[s.schemeId]) state.schemeId = s.schemeId;
      if (s.clubId && (getSchemePreset(s.clubId) || G.CHALLENGE_PRESETS[s.clubId] || state.customPresets.find(p => p.id === s.clubId))) state.clubId = s.clubId;
      const preset = getPreset(state.clubId) || G.CLASSIC_PRESETS['33'];
      state.rules = G.normalizeRules(s.rules || preset);
      state.variants = Math.min(4, Math.max(1, Number(s.variants) || 1));
      state.orientation = s.orientation === 'landscape' ? 'landscape' : 'portrait';
      state.school = { ...state.school, ...(s.school || {}) };
      state.seed = s.seed || G.newSeed(state.clubId);
    } catch(e) {}
  }
  function persist(){
    const payload = { schemeId: state.schemeId, clubId: state.clubId, rules: state.rules, variants: state.variants, orientation: state.orientation, seed: state.seed, school: { ...state.school } };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch(e) {
      // Logo may exceed browser quota; keep text settings if that happens.
      try { payload.school.logoDataUrl=''; localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch(ignore) {}
    }
  }
  function getScheme(){ return G.SCHEME_PRESETS[state.schemeId] || G.SCHEME_PRESETS.classic; }
  function getSchemePreset(id){ return getScheme().presets[id]; }
  function getPreset(id){ return getSchemePreset(id) || G.CHALLENGE_PRESETS[id] || state.customPresets.find(p => p.id === id); }
  function generateAll(){
    state.rules = G.normalizeRules(state.rules);
    state.sheets = Array.from({length: state.variants}, (_, i) => {
      const variantSeed = `${state.seed}-V${i+1}`;
      return { seed: variantSeed, code: displayCode(variantSeed), questions: G.generateQuestions(state.rules, variantSeed) };
    });
    state.previewVariant = Math.min(state.previewVariant, state.sheets.length - 1);
    persist();
  }
  function displayCode(seed){ return String(seed).replace(/-V(\d+)$/, '-$1'); }
  function newQuestions(){ state.seed = G.newSeed(state.clubId === 'custom' ? 'C' : state.clubId); generateAll(); state.status='New equivalent questions generated.'; render(); }
  function shuffleCurrent(){
    state.sheets = state.sheets.map((s,i)=>({ ...s, questions:G.shuffleQuestions(s.questions, `${s.seed}:${Date.now()}:${i}`) }));
    state.status='Question order shuffled.'; render();
  }

  function render(){
    root.innerHTML = `
      <div class="tt99-shell">
        <section class="tt99-hero">
          <div class="tt99-hero__copy">
            <span class="tt99-eyebrow">Tech Tinker Club · Free classroom tool</span>
            <h1>99 Club Sheet Generator</h1>
            <p>Create balanced, personalised 99 Club worksheets and answer keys in seconds. Everything runs in your browser; school details and logos are not uploaded anywhere.</p>
          </div>
          <div class="tt99-hero__badge" aria-hidden="true"><span>99</span><small>CLUB</small></div>
        </section>

        <div class="tt99-workspace">
          <aside class="tt99-controls">
            ${renderStepClub()}
            ${renderStepPersonalise()}
            ${renderStepRules()}
            ${renderStepGenerate()}
          </aside>
          <main class="tt99-preview-panel">
            ${renderPreviewToolbar()}
            <div class="tt99-preview-wrap">${renderPaper()}</div>
            <div class="tt99-privacy"><strong>Private by design.</strong> Questions, names and school logos are processed only on this device.</div>
          </main>
        </div>
      </div>`;
    bindEvents();
  }

  function renderStepClub(){
    const scheme=getScheme();
    const classics = Object.keys(scheme.presets).map(id => clubCard(scheme.presets[id])).join('');
    const challenges = Object.values(G.CHALLENGE_PRESETS).map(p => clubCard(p)).join('');
    const customs = state.customPresets.map(p => `<div class="tt99-custom-wrap">${clubCard(p, true)}<button type="button" class="tt99-custom-delete" data-delete-preset="${esc(p.id)}" aria-label="Delete ${esc(p.name)} preset" title="Delete custom preset">×</button></div>`).join('');
    const schemeOptions=Object.values(G.SCHEME_PRESETS).map(x=>`<option value="${esc(x.id)}" ${x.id===state.schemeId?'selected':''}>${esc(x.name)}</option>`).join('');
    return `<section class="tt99-card">
      <div class="tt99-step"><span>1</span><div><h2>Choose the challenge</h2><p>Classic 99 Club is the default. Other published-style progressions are optional.</p></div></div>
      <label class="tt99-field tt99-scheme-select"><span>Ruleset scheme</span><select id="tt99-scheme">${schemeOptions}</select><small>${esc(scheme.tagline)}</small></label>
      <div class="tt99-club-section-label">11–99 progression</div>
      <div class="tt99-club-grid">${classics}</div>
      <div class="tt99-club-section-label tt99-club-section-label--advanced">Post-99 challenges</div>
      <div class="tt99-club-grid tt99-club-grid--advanced">${challenges}</div>
      ${customs?`<div class="tt99-club-section-label tt99-club-section-label--advanced">Saved custom rules</div><div class="tt99-club-grid">${customs}</div>`:''}
    </section>`;
  }

  function clubCard(p, custom=false){
    const selected = state.clubId === p.id;
    return `<button type="button" class="tt99-club ${selected?'is-selected':''} ${custom?'is-custom':''}" data-club="${esc(p.id)}" aria-pressed="${selected}">
      <strong>${esc(p.name)}</strong><span>${esc(p.tagline || 'Saved custom rules')}</span>${custom?'<em>Custom</em>':''}
    </button>`;
  }

  function renderStepPersonalise(){
    const s=state.school;
    return `<section class="tt99-card">
      <div class="tt99-step"><span>2</span><div><h2>Personalise the sheet</h2><p>Optional. These details are remembered on this browser.</p></div></div>
      <div class="tt99-form-grid">
        ${field('School name','schoolName',s.schoolName,'e.g. Oakfield Primary School','wide')}
        ${field('Year group','yearGroup',s.yearGroup,'e.g. Year 4')}
        ${field('Class','className',s.className,'e.g. 4B')}
        ${field('Teacher','teacherName',s.teacherName,'e.g. Mrs Patel')}
        <label class="tt99-field"><span>Date on sheet</span><input data-school="worksheetDate" type="date" value="${esc(s.worksheetDate)}"></label>
      </div>
      <div class="tt99-logo-row">
        <div class="tt99-logo-preview">${s.logoDataUrl?`<img src="${s.logoDataUrl}" alt="School logo preview">`:'<span>LOGO</span>'}</div>
        <div><label class="tt99-upload"><input id="tt99-logo" type="file" accept="image/png,image/jpeg,image/webp"><span>${s.logoDataUrl?'Replace school logo':'Add school logo'}</span></label>${s.logoDataUrl?'<button type="button" class="tt99-linkbtn" id="tt99-remove-logo">Remove logo</button>':''}<small>PNG, JPG or WebP. Resized locally for print.</small></div>
      </div>
    </section>`;
  }
  function field(label,key,value,placeholder,cls=''){ return `<label class="tt99-field ${cls}"><span>${label}</span><input data-school="${key}" type="text" maxlength="80" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`; }

  function renderStepRules(){
    const r=state.rules;
    return `<section class="tt99-card">
      <div class="tt99-step tt99-step--rules"><span>3</span><div><h2>Check the rules</h2><p id="tt99-summary">${esc(G.rulesSummary(r))}</p></div></div>
      <div class="tt99-rule-actions">
        <button type="button" class="tt99-secondary" id="tt99-toggle-rules">${state.advancedOpen?'Hide rule editor':'Edit rules'}</button>
        <button type="button" class="tt99-ghost" id="tt99-reset-rules">Reset to preset</button>
      </div>
      ${state.advancedOpen ? renderAdvancedRules() : ''}
    </section>`;
  }

  function renderAdvancedRules(){
    const r=state.rules;
    const mathModes=[
      ['double','Doubling'],['repeated_addition','Repeated addition'],['addition','Addition'],['add_subtract','Addition & subtraction'],
      ['multiply','Multiplication'],['divide','Division'],['mixed','Mixed × and ÷'],['missing_number','Missing-number facts'],['family_mix','Mixed mental arithmetic']
    ];
    const tableFamilies=['multiply','divide','missing_number'];
    const needTables=['multiply','divide','mixed','missing_number'].includes(r.mode) || (r.mode==='family_mix' && r.families.some(f=>tableFamilies.includes(f)));
    const needArithmetic=['addition','add_subtract'].includes(r.mode) || (r.mode==='family_mix' && r.families.some(f=>['addition','subtraction','negative_numbers','roman_numerals','simple_algebra'].includes(f)));
    const needSubtraction=r.mode==='add_subtract' || (r.mode==='family_mix' && r.families.includes('subtraction'));
    const needSquares=r.mode==='family_mix' && r.families.some(f=>['square','square_root'].includes(f));
    const needCubes=r.mode==='family_mix' && r.families.includes('cube');
    const needBodmas=r.mode==='family_mix' && r.families.includes('bodmas');
    const needScaled=r.mode==='family_mix' && r.families.some(f=>['scaled_multiply','scaled_divide'].includes(f));
    const needFractions=r.mode==='family_mix' && r.families.includes('fraction_of');
    const needPercentages=r.mode==='family_mix' && r.families.includes('percentage_of');
    return `<div class="tt99-advanced">
      <div class="tt99-form-grid">
        <label class="tt99-field"><span>Number of questions</span><input data-rule="questionCount" type="number" min="1" max="200" value="${r.questionCount}"></label>
        <label class="tt99-field"><span>Time limit (minutes)</span><input data-rule="timeMinutes" type="number" min="0.25" max="60" step="0.25" value="${r.timeMinutes}"></label>
        <label class="tt99-field"><span>Perfect attempts to advance</span><input data-rule="perfectAttempts" type="number" min="1" max="10" value="${r.perfectAttempts}"></label>
        <label class="tt99-field"><span>Question type</span><select data-rule="mode">${mathModes.map(([v,l])=>`<option value="${v}" ${r.mode===v?'selected':''}>${l}</option>`).join('')}</select></label>
      </div>
      <label class="tt99-check"><input data-rule-check="unaided" type="checkbox" ${r.unaided?'checked':''}><span>State that the sheet should be completed independently/unaided</span></label>
      ${r.mode==='family_mix'?renderFamilySelector(r)+renderFamilyWeights(r):''}
      ${r.mode==='double'?`<div class="tt99-inline-fields">${numField('Smallest number','numberMin',r.numberMin,0,100)}${numField('Largest number','numberMax',r.numberMax,0,100)}</div>`:''}
      ${r.mode==='repeated_addition'?`<div class="tt99-inline-fields">${numField('Smallest addend','addendMin',r.addendMin,0,100)}${numField('Largest addend','addendMax',r.addendMax,0,100)}${numField('Minimum repeats','repeatsMin',r.repeatsMin,2,20)}${numField('Maximum repeats','repeatsMax',r.repeatsMax,2,20)}</div>`:''}
      ${needArithmetic?`<div class="tt99-inline-fields">${numField('Arithmetic answer limit','arithmeticMax',r.arithmeticMax,1,5000)}${numField('Largest arithmetic operand','arithmeticOperandMax',r.arithmeticOperandMax,1,5000)}</div>`:''}
      ${needSubtraction?`<label class="tt99-check"><input data-rule-check="allowNegativeAnswers" type="checkbox" ${r.allowNegativeAnswers?'checked':''}><span>Allow subtraction questions with negative answers</span></label>`:''}
      ${needTables?renderTableSelector(r):''}
      ${(needTables||needScaled)?`<div class="tt99-inline-fields">${numField(needTables?'Smallest factor / quotient':'Smallest scaled base','factorMin',r.factorMin,0,100)}${numField(needTables?'Largest factor / quotient':'Largest scaled base','factorMax',r.factorMax,0,100)}${r.mode==='mixed'?`<label class="tt99-field tt99-percent"><span>Multiplication share <b>${r.multiplyPercent}%</b></span><input data-rule="multiplyPercent" type="range" min="0" max="100" step="5" value="${r.multiplyPercent}"></label>`:''}</div>`:''}
      ${needSquares?`<div class="tt99-inline-fields">${numField('Smallest square/root base','squareMin',r.squareMin,0,50)}${numField('Largest square/root base','squareMax',r.squareMax,0,50)}</div>`:''}
      ${needCubes?`<div class="tt99-inline-fields">${numField('Smallest cube base','cubeMin',r.cubeMin,0,20)}${numField('Largest cube base','cubeMax',r.cubeMax,0,20)}</div>`:''}
      ${needBodmas?`<div class="tt99-inline-fields">${numField('Order-of-operations base limit','bodmasMax',r.bodmasMax,2,30)}</div>`:''}
      ${needFractions?renderChoiceSelector('Fraction denominators','fractionDenominator',[2,3,4,5,6,8,10,12],r.fractionDenominators,n=>`1/${n}`):''}
      ${needPercentages?renderChoiceSelector('Percentages included','percentageChoice',[5,10,20,25,50,75],r.percentageChoices,n=>`${n}%`):''}
      <div class="tt99-check-row">
        <label class="tt99-check"><input data-rule-check="avoidExactDuplicates" type="checkbox" ${r.avoidExactDuplicates?'checked':''}><span>Avoid exact duplicate questions where possible</span></label>
        ${['multiply','mixed'].includes(r.mode) || (r.mode==='family_mix'&&r.families.includes('multiply'))?`<label class="tt99-check"><input data-rule-check="avoidReversedDuplicates" type="checkbox" ${r.avoidReversedDuplicates?'checked':''}><span>Treat 3 × 7 and 7 × 3 as duplicates</span></label>`:''}
      </div>
      <div class="tt99-save-preset"><input id="tt99-preset-name" type="text" maxlength="40" placeholder="Preset name, e.g. Year 4 Autumn"><button type="button" id="tt99-save-preset" class="tt99-secondary">Save these rules</button></div>
    </div>`;
  }

  function renderFamilySelector(r){
    const order=['addition','subtraction','multiply','divide','missing_number','square','square_root','cube','bodmas','scaled_multiply','scaled_divide','fraction_of','percentage_of','negative_numbers','roman_numerals','angle_facts','simple_algebra'];
    return `<div class="tt99-family-select"><span class="tt99-field-label">Question families included</span><div class="tt99-family-chips">${order.map(f=>`<label><input type="checkbox" data-family="${f}" ${r.families.includes(f)?'checked':''}><span>${esc(G.FAMILY_LABELS[f]||f)}</span></label>`).join('')}</div><small>Turn families on or off. Use the relative weights below to make a family more or less common.</small></div>`;
  }
  function renderFamilyWeights(r){
    return `<div class="tt99-family-weights"><span class="tt99-field-label">Relative question mix</span><div>${r.families.map(f=>`<label><span>${esc(G.FAMILY_LABELS[f]||f)}</span><input type="number" min="1" max="20" step="1" value="${Number(r.familyWeights[f])||1}" data-family-weight="${esc(f)}"></label>`).join('')}</div><small>These are relative weights, not percentages. For example 2 : 1 gives the first family roughly twice as many questions.</small></div>`;
  }
  function renderChoiceSelector(label,key,choices,selected,labelFn){
    const set=new Set((selected||[]).map(Number));
    return `<div class="tt99-choice-select"><span class="tt99-field-label">${esc(label)}</span><div>${choices.map(n=>`<label><input type="checkbox" data-${key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}="${n}" ${set.has(n)?'checked':''}><span>${esc(labelFn(n))}</span></label>`).join('')}</div></div>`;
  }

  function numField(label,key,value,min,max){ return `<label class="tt99-field"><span>${label}</span><input data-rule="${key}" type="number" min="${min}" max="${max}" value="${value}"></label>`; }
  function renderTableSelector(r){
    return `<div class="tt99-table-select"><span class="tt99-field-label">Tables included</span><div class="tt99-table-chips">${Array.from({length:12},(_,i)=>i+1).map(n=>`<label><input type="checkbox" data-table="${n}" ${r.tables.includes(n)?'checked':''}><span>${n}×</span></label>`).join('')}</div><div class="tt99-mini-actions"><button type="button" data-tables-action="all">1–12</button><button type="button" data-tables-action="core">2, 3, 5, 10</button><button type="button" data-tables-action="single">2× only</button></div></div>`;
  }

  function renderStepGenerate(){
    return `<section class="tt99-card tt99-card--action">
      <div class="tt99-step"><span>4</span><div><h2>Generate & download</h2><p>Create up to four equivalent versions. Answer keys use the same sheet codes.</p></div></div>
      <div class="tt99-layout-control"><span class="tt99-field-label">Page layout</span><div class="tt99-layout-picker" role="group" aria-label="Page layout">
        <button type="button" class="tt99-layout-option ${state.orientation==='portrait'?'is-selected':''}" data-page-orientation="portrait" aria-pressed="${state.orientation==='portrait'}"><span class="tt99-page-icon tt99-page-icon--portrait" aria-hidden="true"></span><span><b>Portrait</b><small>Classic worksheet layout</small></span></button>
        <button type="button" class="tt99-layout-option ${state.orientation==='landscape'?'is-selected':''}" data-page-orientation="landscape" aria-pressed="${state.orientation==='landscape'}"><span class="tt99-page-icon tt99-page-icon--landscape" aria-hidden="true"></span><span><b>Landscape</b><small>Wider, larger working text</small></span></button>
      </div></div>
      <label class="tt99-field"><span>Equivalent versions</span><select id="tt99-variants">${[1,2,3,4].map(n=>`<option value="${n}" ${state.variants===n?'selected':''}>${n} ${n===1?'version':'versions'}</option>`).join('')}</select></label>
      <div class="tt99-action-row"><button type="button" class="tt99-primary" id="tt99-new">Generate new questions</button><button type="button" class="tt99-secondary" id="tt99-shuffle">Shuffle order</button></div>
      <div class="tt99-recreate"><div><strong>Recreate from sheet code</strong><small>Uses the current rules. Enter the code printed at the bottom of a worksheet.</small></div><div><input id="tt99-sheet-code" type="text" maxlength="90" spellcheck="false" placeholder="e.g. 99-ABCDE-1"><button type="button" id="tt99-recreate" class="tt99-secondary">Recreate</button></div></div>
      <div class="tt99-downloads"><button id="tt99-pdf-student" class="tt99-download"><b>Worksheet PDF</b><span>Pupil sheets only</span></button><button id="tt99-pdf-answer" class="tt99-download"><b>Answer key PDF</b><span>Matching answers</span></button><button id="tt99-pdf-both" class="tt99-download tt99-download--accent"><b>Worksheet + answers</b><span>One complete PDF</span></button></div>
      <div class="tt99-config-actions"><button type="button" class="tt99-linkbtn" id="tt99-export-settings">Export settings</button><label class="tt99-linkbtn tt99-import">Import settings<input id="tt99-import-settings" type="file" accept="application/json,.json"></label></div>
      ${state.status?`<div class="tt99-status" role="status">${esc(state.status)}</div>`:''}
    </section>`;
  }

  function renderPreviewToolbar(){
    return `<div class="tt99-preview-toolbar"><div><strong>Print preview</strong><span>${esc(state.previewAnswers?'Answer key':'Pupil worksheet')}</span></div><div class="tt99-preview-tabs">${state.sheets.map((s,i)=>`<button data-preview-variant="${i}" class="${i===state.previewVariant?'is-active':''}">Version ${String.fromCharCode(65+i)}</button>`).join('')}</div><div class="tt99-preview-mode"><button data-preview-mode="student" class="${!state.previewAnswers?'is-active':''}">Worksheet</button><button data-preview-mode="answers" class="${state.previewAnswers?'is-active':''}">Answers</button></div></div>`;
  }

  function renderPaper(){
    const sheet = state.sheets[state.previewVariant];
    if (!sheet) return '';
    const r=state.rules, s=state.school;
    const cols = L.getColumns(r.questionCount,state.orientation);
    const rows = Math.ceil(r.questionCount / cols);
    const identityMeta=[L.displayYear(s.yearGroup),L.displayClass(s.className),s.teacherName].filter(Boolean).join(' · ');
    const dateText=s.worksheetDate ? formatDate(s.worksheetDate) : '';
    const groups = Array.from({length:cols},(_,c)=>sheet.questions.slice(c*rows, Math.min((c+1)*rows,sheet.questions.length)));
    return `<article class="tt99-paper is-${state.orientation} cols-${cols} rows-${rows}" data-orientation="${state.orientation}" style="--paper-cols:${cols};--row-count:${rows}">
      <header class="tt99-paper-head">
        <div class="tt99-paper-identity"><div class="tt99-paper-logo">${s.logoDataUrl?`<img src="${s.logoDataUrl}" alt="">`:''}</div><div class="tt99-paper-identity-copy"><div class="tt99-paper-school">${esc(s.schoolName || 'School name')}</div>${identityMeta?`<div class="tt99-paper-classmeta">${esc(identityMeta)}</div>`:''}</div></div>
        <div class="tt99-paper-title"><h2>${esc(r.name || `${r.questionCount} Club`)}</h2><span>${state.previewAnswers?'ANSWER KEY':'MENTAL MATHS CHALLENGE'}</span></div>
        <div class="tt99-paper-date">${dateText?esc(dateText):''}</div>
      </header>
      <div class="tt99-paper-student"><span>Name <i></i></span><span>Score <i class="short"></i> / ${r.questionCount}</span></div>
      <div class="tt99-paper-instructions">${esc(G.instructionText(r))}</div>
      <div class="tt99-question-grid">${groups.map(group=>`<div class="tt99-question-col">${group.map(q=>`<div class="tt99-question" data-q="${q.number}"><b>${q.number}.</b><span>${esc(q.prompt)}</span>${state.previewAnswers?`<strong>${esc(q.answer)}</strong>`:'<i></i>'}<button type="button" data-replace="${q.number-1}" aria-label="Replace question ${q.number}" title="Replace this question">↻</button></div>`).join('')}</div>`).join('')}</div>
      <footer class="tt99-paper-foot"><span>Sheet ${esc(sheet.code)} · Version ${String.fromCharCode(65+state.previewVariant)}</span><span>Generated with Tech Tinker Club · techtinker.club</span></footer>
    </article>`;
  }

  function bindEvents(){
    root.querySelector('#tt99-scheme')?.addEventListener('change',e=>selectScheme(e.target.value));
    root.querySelectorAll('[data-club]').forEach(btn=>btn.addEventListener('click',()=>selectClub(btn.dataset.club)));
    root.querySelectorAll('[data-delete-preset]').forEach(btn=>btn.addEventListener('click',()=>deletePreset(btn.dataset.deletePreset)));
    root.querySelectorAll('[data-school]').forEach(input=>input.addEventListener('input',()=>{ state.school[input.dataset.school]=input.value; persist(); softRenderPaper(); }));
    const logo=root.querySelector('#tt99-logo'); if(logo) logo.addEventListener('change',handleLogo);
    root.querySelector('#tt99-remove-logo')?.addEventListener('click',()=>{ state.school.logoDataUrl='';state.school.logoWidth=0;state.school.logoHeight=0;persist();render(); });
    root.querySelector('#tt99-toggle-rules')?.addEventListener('click',()=>{state.advancedOpen=!state.advancedOpen;render();});
    root.querySelector('#tt99-reset-rules')?.addEventListener('click',resetRules);
    root.querySelectorAll('[data-rule]').forEach(input=>input.addEventListener(input.type==='range'?'input':'change',()=>ruleChanged(input.dataset.rule,input.value)));
    root.querySelectorAll('[data-rule-check]').forEach(input=>input.addEventListener('change',()=>ruleChanged(input.dataset.ruleCheck,input.checked)));
    root.querySelectorAll('[data-family]').forEach(input=>input.addEventListener('change',familiesChanged));
    root.querySelectorAll('[data-family-weight]').forEach(input=>input.addEventListener('change',()=>familyWeightChanged(input.dataset.familyWeight,input.value)));
    root.querySelectorAll('[data-fraction-denominator]').forEach(input=>input.addEventListener('change',fractionChoicesChanged));
    root.querySelectorAll('[data-percentage-choice]').forEach(input=>input.addEventListener('change',percentageChoicesChanged));
    root.querySelectorAll('[data-table]').forEach(input=>input.addEventListener('change',tablesChanged));
    root.querySelectorAll('[data-tables-action]').forEach(btn=>btn.addEventListener('click',()=>tableAction(btn.dataset.tablesAction)));
    root.querySelector('#tt99-save-preset')?.addEventListener('click',savePreset);
    root.querySelectorAll('[data-page-orientation]').forEach(btn=>btn.addEventListener('click',()=>setOrientation(btn.dataset.pageOrientation)));
    root.querySelector('#tt99-variants')?.addEventListener('change',e=>{state.variants=Number(e.target.value);generateAll();render();});
    root.querySelector('#tt99-new')?.addEventListener('click',newQuestions);
    root.querySelector('#tt99-shuffle')?.addEventListener('click',shuffleCurrent);
    root.querySelector('#tt99-recreate')?.addEventListener('click',recreateFromCode);
    root.querySelector('#tt99-sheet-code')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();recreateFromCode();}});
    root.querySelectorAll('[data-preview-variant]').forEach(btn=>btn.addEventListener('click',()=>{state.previewVariant=Number(btn.dataset.previewVariant);render();}));
    root.querySelectorAll('[data-preview-mode]').forEach(btn=>btn.addEventListener('click',()=>{state.previewAnswers=btn.dataset.previewMode==='answers';render();}));
    root.querySelectorAll('[data-replace]').forEach(btn=>btn.addEventListener('click',()=>replaceOne(Number(btn.dataset.replace))));
    root.querySelector('#tt99-pdf-student')?.addEventListener('click',()=>downloadPDF('student'));
    root.querySelector('#tt99-pdf-answer')?.addEventListener('click',()=>downloadPDF('answers'));
    root.querySelector('#tt99-pdf-both')?.addEventListener('click',()=>downloadPDF('both'));
    root.querySelector('#tt99-export-settings')?.addEventListener('click',exportSettings);
    root.querySelector('#tt99-import-settings')?.addEventListener('change',importSettings);
  }

  function setOrientation(value){
    const next=value==='landscape'?'landscape':'portrait';
    if(state.orientation===next)return;
    state.orientation=next;
    persist();
    state.status=`${next==='landscape'?'Landscape':'Portrait'} layout selected. Questions and sheet codes are unchanged.`;
    render();
  }

  function selectScheme(id){
    if(!G.SCHEME_PRESETS[id] || id===state.schemeId)return;
    state.schemeId=id;
    if(getScheme().presets[state.clubId]){
      state.rules=G.clone(getScheme().presets[state.clubId]);
      state.seed=G.newSeed(state.clubId);
      generateAll();
    } else persist();
    state.status=`${getScheme().name} rules selected. Standard timing and advancement remain editable.`;
    render();
  }

  function selectClub(id){
    const p=getPreset(id); if(!p)return;
    state.clubId=id; state.rules=G.clone(p); state.seed=G.newSeed(id); state.status=''; generateAll(); render();
  }
  function resetRules(){ const p=getPreset(state.clubId); if(p){state.rules=G.clone(p);state.seed=G.newSeed(state.clubId);generateAll();state.status='Preset rules restored.';render();} }
  function ruleChanged(key,value){
    state.rules[key] = ['questionCount','timeMinutes','perfectAttempts','numberMin','numberMax','addendMin','addendMax','repeatsMin','repeatsMax','factorMin','factorMax','multiplyPercent','arithmeticMax','arithmeticOperandMax','squareMin','squareMax','cubeMin','cubeMax','bodmasMax'].includes(key) ? Number(value) : value;
    state.rules=G.normalizeRules(state.rules); state.seed=G.newSeed(state.clubId); generateAll(); render(); state.advancedOpen=true;
  }
  function familiesChanged(){
    const selected=Array.from(root.querySelectorAll('[data-family]:checked')).map(x=>x.dataset.family);
    if(!selected.length){state.status='At least one question family must stay selected.';render();state.advancedOpen=true;return;}
    const previous=state.rules.familyWeights||{};
    state.rules.families=selected;
    state.rules.familyWeights=Object.fromEntries(selected.map(f=>[f,previous[f]||1]));
    state.seed=G.newSeed(state.clubId);generateAll();render();state.advancedOpen=true;
  }
  function familyWeightChanged(family,value){
    if(!state.rules.families.includes(family))return;
    state.rules.familyWeights={...(state.rules.familyWeights||{}),[family]:Math.max(1,Math.min(20,Number(value)||1))};
    state.rules=G.normalizeRules(state.rules);state.seed=G.newSeed(state.clubId);generateAll();render();state.advancedOpen=true;
  }
  function fractionChoicesChanged(){
    const selected=Array.from(root.querySelectorAll('[data-fraction-denominator]:checked')).map(x=>Number(x.dataset.fractionDenominator));
    if(!selected.length){state.status='Keep at least one fraction denominator selected.';render();state.advancedOpen=true;return;}
    state.rules.fractionDenominators=selected;state.seed=G.newSeed(state.clubId);generateAll();render();state.advancedOpen=true;
  }
  function percentageChoicesChanged(){
    const selected=Array.from(root.querySelectorAll('[data-percentage-choice]:checked')).map(x=>Number(x.dataset.percentageChoice));
    if(!selected.length){state.status='Keep at least one percentage selected.';render();state.advancedOpen=true;return;}
    state.rules.percentageChoices=selected;state.seed=G.newSeed(state.clubId);generateAll();render();state.advancedOpen=true;
  }
  function tablesChanged(){ const selected=Array.from(root.querySelectorAll('[data-table]:checked')).map(x=>Number(x.dataset.table)); if(!selected.length){state.status='At least one times table must stay selected.';render();state.advancedOpen=true;return;} state.rules.tables=selected; state.seed=G.newSeed(state.clubId);generateAll();render();state.advancedOpen=true; }
  function tableAction(action){ state.rules.tables=action==='all'?Array.from({length:12},(_,i)=>i+1):action==='core'?[2,3,5,10]:[2]; state.seed=G.newSeed(state.clubId);generateAll();render();state.advancedOpen=true; }
  function savePreset(){
    const input=root.querySelector('#tt99-preset-name'); const name=(input?.value||'').trim(); if(!name){state.status='Give your preset a name first.';render();state.advancedOpen=true;return;}
    const id='custom-'+Date.now().toString(36); const preset={...G.clone(state.rules),id,name,tagline:'Saved custom rules'}; state.customPresets.push(preset);saveCustomPresets();state.clubId=id;state.rules=G.clone(preset);state.status=`Saved “${name}” on this browser.`;persist();render();
  }
  function deletePreset(id){
    const p=state.customPresets.find(x=>x.id===id); if(!p)return;
    state.customPresets=state.customPresets.filter(x=>x.id!==id); saveCustomPresets();
    if(state.clubId===id){state.clubId='33';state.rules=G.clone(getScheme().presets['33']);state.seed=G.newSeed('33');generateAll();}
    state.status=`Deleted custom preset “${p.name}”.`;render();
  }
  function replaceOne(index){ const s=state.sheets[state.previewVariant]; s.questions=G.replaceQuestion(s.questions,index,state.rules,s.seed);state.status=`Question ${index+1} replaced in Version ${String.fromCharCode(65+state.previewVariant)}. Export settings if you want to preserve this manual edit exactly.`;render(); }

  function recreateFromCode(){
    const input=root.querySelector('#tt99-sheet-code');
    const code=(input?.value||'').trim();
    const match=code.match(/^(.+)-(\d+)$/);
    if(!match){state.status='Enter a valid sheet code, for example 99-ABCDE-1.';render();return;}
    const variant=Number(match[2]);
    if(!Number.isInteger(variant) || variant<1 || variant>4){state.status='This version of the generator supports sheet versions 1 to 4.';render();return;}
    state.seed=match[1];
    state.variants=Math.max(state.variants,variant);
    generateAll();
    state.previewVariant=variant-1;
    state.status=`Recreated sheet ${code} using the current rules.`;
    render();
  }

  function softRenderPaper(){ const wrap=root.querySelector('.tt99-preview-wrap'); if(wrap)wrap.innerHTML=renderPaper(); const paper=wrap?.querySelector('.tt99-paper'); paper?.querySelectorAll('[data-replace]').forEach(btn=>btn.addEventListener('click',()=>replaceOne(Number(btn.dataset.replace)))); }

  async function handleLogo(e){
    const file=e.target.files?.[0]; if(!file)return;
    if(file.size>8*1024*1024){state.status='Logo is too large. Please choose an image under 8 MB.';render();return;}
    try { const result=await imageFileToJpeg(file,360); state.school.logoDataUrl=result.dataUrl; state.school.logoWidth=result.width; state.school.logoHeight=result.height; persist();state.status='School logo added.';render(); }
    catch(err){state.status='That logo could not be read. Try a PNG or JPG.';render();}
  }
  function imageFileToJpeg(file,maxSize){ return new Promise((resolve,reject)=>{ const img=new Image(); const url=URL.createObjectURL(file); img.onload=()=>{ const scale=Math.min(1,maxSize/Math.max(img.naturalWidth,img.naturalHeight)); const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale)); const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);URL.revokeObjectURL(url);resolve({dataUrl:c.toDataURL('image/jpeg',0.9),width:w,height:h});};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('image'));};img.src=url;}); }

  function downloadPDF(kind){
    try {
      const doc=L.buildDocument({rules:state.rules,sheets:state.sheets,school:state.school,kind,orientation:state.orientation});
      doc.save(L.filename(state.rules,kind,state.orientation));
      state.status='PDF created.'; render();
    } catch(err){ console.error(err); state.status='PDF generation failed in this browser. Please refresh and try again.';render(); }
  }

  function exportSettings(){
    const data={
      app:'Tech Tinker Club 99 Club Generator',version:VERSION,schemeId:state.schemeId,clubId:state.clubId,
      rules:state.rules,variants:state.variants,orientation:state.orientation,seed:state.seed,
      sheets:state.sheets.map(s=>({seed:s.seed,code:s.code,questions:s.questions})),
      school:{schoolName:state.school.schoolName,yearGroup:state.school.yearGroup,className:state.school.className,teacherName:state.school.teacherName,worksheetDate:state.school.worksheetDate}
    };
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='99-club-settings.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function importSettings(e){
    const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{
      const d=JSON.parse(reader.result);
      if(!d || typeof d!=='object' || !d.rules) throw new Error('settings');
      state.rules=G.normalizeRules(d.rules);
      if(d.schemeId && G.SCHEME_PRESETS[d.schemeId])state.schemeId=d.schemeId;
      let requestedId=String(d.clubId||state.rules.id||'').trim();
      if(requestedId && !getPreset(requestedId)){
        const imported={...G.clone(state.rules),id:requestedId,name:state.rules.name||'Imported preset',tagline:'Imported custom rules'};
        state.customPresets=state.customPresets.filter(p=>p.id!==requestedId);state.customPresets.push(imported);saveCustomPresets();
      }
      state.clubId=requestedId&&getPreset(requestedId)?requestedId:(getSchemePreset(state.rules.id)||G.CHALLENGE_PRESETS[state.rules.id]?state.rules.id:'33');
      state.variants=Math.min(4,Math.max(1,Number(d.variants)||1));
      state.orientation=d.orientation==='landscape'?'landscape':'portrait';
      if(d.school)state.school={...state.school,...d.school,logoDataUrl:state.school.logoDataUrl,logoWidth:state.school.logoWidth,logoHeight:state.school.logoHeight};
      state.seed=typeof d.seed==='string'&&d.seed?d.seed:G.newSeed(state.clubId);
      const exactSheets=Array.isArray(d.sheets)&&d.sheets.length===state.variants&&d.sheets.every(s=>s&&typeof s.seed==='string'&&typeof s.code==='string'&&Array.isArray(s.questions)&&s.questions.length===state.rules.questionCount);
      if(exactSheets){state.sheets=G.clone(d.sheets);state.previewVariant=0;persist();}
      else generateAll();
      state.status=exactSheets?'Settings and exact worksheet versions imported.':'Settings imported.';render();
    }catch(err){state.status='That settings file is not valid.';render();}};reader.readAsText(file);
  }
  function formatDate(iso){ if(!iso)return ''; const [y,m,d]=iso.split('-').map(Number); if(!y||!m||!d)return iso; return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(new Date(y,m-1,d)); }
})();
