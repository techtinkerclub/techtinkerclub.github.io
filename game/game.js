/* Tech Tinker: System Rescue — live game engine */
(() => {
  'use strict';

  const DATA = window.TTC_DATA;
  if (!DATA || !DATA.weeks) {
    document.body.innerHTML = '<main style="padding:2rem;font-family:system-ui;color:white;background:#07101d;min-height:100vh"><h1>Game data could not be loaded</h1><p>Please check questions.js.</p></main>';
    return;
  }

  const SYSTEMS = [
    {name:'Boot Sequence', objective:'Restart the microcontroller core and restore input/output control.', modules:['POWER','INPUT','OUTPUT','BOOT'], pattern:['00100','01110','10101','00100','01110']},
    {name:'Randomiser Core', objective:'Reconnect events and randomness so the core can generate safe outputs.', modules:['EVENT','RNG','DATA','OUTPUT'], pattern:['10001','00000','00100','00000','10001']},
    {name:'Logic Router', objective:'Repair the decision paths and route every condition to the right branch.', modules:['TEST','TRUE','FALSE','ROUTE'], pattern:['00100','00100','11111','01010','10001']},
    {name:'Sensor Array', objective:'Recalibrate stored values, thresholds and live sensor readings.', modules:['LIGHT','TEMP','VALUE','LIMIT'], pattern:['00100','01110','11111','00100','00100']},
    {name:'Loop Engine', objective:'Restart repeated processes, timing cycles and game logic.', modules:['REPEAT','TIME','SPRITE','CYCLE'], pattern:['01110','10001','10001','10001','01110']},
    {name:'Grid Controller', objective:'Restore coordinates, timing and movement across the 5×5 control grid.', modules:['X/Y','MOVE','TIME','DEBUG'], pattern:['10101','01110','11111','01110','10101']},
    {name:'Function Bay', objective:'Reconnect reusable code modules, variables and sensor-driven helpers.', modules:['CALL','PARAM','RETURN','SENSOR'], pattern:['11100','00100','01110','00100','00111']},
    {name:'Signal Lab', objective:'Repair waves, radio logic and the lab’s mixed diagnostic routines.', modules:['WAVE','RADIO','LOGIC','TEST'], pattern:['10001','01010','00100','01010','10001']},
    {name:'Firefly Network', objective:'Resynchronise the swarm using radio groups, local rules and message logic.', modules:['GROUP','SYNC','LOCAL','LINK'], pattern:['10101','00000','01110','00000','10101']}
  ];

  const STORAGE_KEY = 'ttcSystemRescueV1';
  const LEGACY_KEYS = ['ttcBossBattle_arcade_v6_8','ttcBossBattleV3','ttcBossBattleV2'];
  const DEFAULT_SETTINGS = {timer:true,sound:true};
  const byId = id => document.getElementById(id);
  const screens = {levels:byId('screen-levels'), briefing:byId('screen-briefing'), adventure:byId('screen-adventure'), game:byId('screen-game'), results:byId('screen-results')};
  const levelGrid = byId('level-grid');
  const params = new URLSearchParams(location.search);
  const DEBUG = params.get('debug') === '1';
  const DEBUG_WEEK = params.get('week');

  let G = null;
  let timerTicker = null;
  let toastTimer = null;
  let selectedMatchTerm = null;
  let inputLocked = false;
  let pendingBriefId = null;
  let audioCtx = null;

  const state = loadState();
  if (DEBUG) state.unlocked = weekIds();

  function weekIds(){ return Object.keys(DATA.weeks).sort((a,b)=>Number(a)-Number(b)); }
  function systemFor(id){ return SYSTEMS[(Number(id)-1) % SYSTEMS.length]; }
  function freshState(){ return {version:1,unlocked:['1'],clears:{},ratings:{},best:{},settings:{...DEFAULT_SETTINGS}}; }
  function normalise(candidate){
    const s=freshState(), ids=weekIds();
    if(!candidate || typeof candidate!=='object') return s;
    s.unlocked=Array.from(new Set(['1',...(Array.isArray(candidate.unlocked)?candidate.unlocked.map(String):[])] )).filter(id=>ids.includes(id));
    s.clears=candidate.clears&&typeof candidate.clears==='object'?{...candidate.clears}:{};
    s.ratings=candidate.ratings&&typeof candidate.ratings==='object'?{...candidate.ratings}:{};
    s.best=candidate.best&&typeof candidate.best==='object'?{...candidate.best}:{};
    s.settings={...DEFAULT_SETTINGS,...(candidate.settings||{})};
    for(const id of ids){
      if(!s.clears[id]) delete s.clears[id];
      const r=Number(s.ratings[id]); s.ratings[id]=Number.isFinite(r)?Math.max(0,Math.min(3,Math.round(r))):0;
    }
    return s;
  }
  function loadState(){
    try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw) return normalise(JSON.parse(raw)); }catch(_){ }
    for(const key of LEGACY_KEYS){
      try{
        const raw=localStorage.getItem(key); if(!raw) continue;
        const old=JSON.parse(raw), s=freshState();
        if(Array.isArray(old.unlocked)) s.unlocked=old.unlocked.map(String);
        if(old.clears&&typeof old.clears==='object') s.clears={...old.clears};
        if(old.settings&&typeof old.settings==='object') s.settings={...DEFAULT_SETTINGS,...old.settings};
        for(const id of Object.keys(s.clears)) if(s.clears[id]) s.ratings[id]=1;
        return normalise(s);
      }catch(_){ }
    }
    return freshState();
  }
  function save(){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(_){ } }
  function totalStars(){ return weekIds().reduce((n,id)=>n+(Number(state.ratings[id])||0),0); }
  function onlineCount(){ return weekIds().filter(id=>state.clears[id]).length; }
  function cleanTopic(title,id){ return String(title||`Week ${id}`).replace(new RegExp(`^Week\\s+${id}\\s*:\\s*`,'i'),'').trim(); }

  function showScreen(name){
    for(const [key,node] of Object.entries(screens)) node.hidden = key!==name;
    document.body.classList.toggle('adventure-wide',name==='adventure');
    window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }

  function buildMatrix(id,stateName='ready'){
    const sys=systemFor(id), matrix=document.createElement('div');
    matrix.className=`led-matrix ${stateName}`; matrix.setAttribute('aria-hidden','true');
    sys.pattern.join('').split('').forEach(bit=>{const led=document.createElement('span');if(bit==='1')led.classList.add('on');matrix.appendChild(led);});
    return matrix;
  }
  function renderMatrix(target,id,stateName='ready'){ target.replaceChildren(buildMatrix(id,stateName)); }
  function buildStars(rating,label){
    const wrap=document.createElement('div');wrap.setAttribute('role','img');wrap.setAttribute('aria-label',label);
    for(let i=1;i<=3;i++){const s=document.createElement('span');s.textContent='★';if(i>rating)s.className='empty';wrap.appendChild(s);}return wrap;
  }
  function renderHeader(){
    const ids=weekIds(); byId('stars').textContent=`★ ${totalStars()} / ${ids.length*3}`; byId('progress-pill').textContent=`${onlineCount()} / ${ids.length} online`; byId('hero-online-count').textContent=`${onlineCount()}/${ids.length}`;
  }
  function renderLevels(){
    levelGrid.replaceChildren();renderHeader();const ids=weekIds();
    ids.forEach((id,index)=>{
      const w=DATA.weeks[id], sys=systemFor(id), locked=!DEBUG&&!state.unlocked.includes(id)&&!w.forceUnlock, rating=Number(state.ratings[id])||0, best=state.best[id]||{};
      const card=document.createElement('article');card.className=`card${locked?' locked':''}${state.clears[id]?' completed':''}`;
      const top=document.createElement('div');top.className='card-top';
      const sid=document.createElement('div');sid.className='system-id';sid.textContent=`System ${id}`;
      top.append(sid,buildMatrix(id,locked?'locked':state.clears[id]?'complete':'ready'));
      const title=document.createElement('h3');title.textContent=sys.name;
      const topic=document.createElement('div');topic.className='card-topic';topic.textContent=cleanTopic(w.title,id);
      const desc=document.createElement('p');desc.className='card-description';desc.textContent=w.description||'Coding challenge';
      const meta=document.createElement('div');meta.className='card-meta';
      const qtag=document.createElement('span');qtag.className='tag';qtag.textContent=['1','2','3','4'].includes(String(id))?'3 rooms × 3 stages + diagnostic':`${(w.questions||[]).length} challenges`;
      const stag=document.createElement('span');stag.className=`tag system-status-tag ${locked?'offline':state.clears[id]?'online':'ready'}`;stag.textContent=locked?'OFFLINE':state.clears[id]?'ONLINE':'READY';meta.append(qtag,stag);
      const stars=buildStars(rating,`System ${id}: ${rating} of 3 stars`);stars.classList.add('level-stars');
      const footer=document.createElement('div');footer.className='card-footer';
      const note=document.createElement('div');note.className='card-note';
      if(locked) note.textContent=index?`Restore System ${ids[index-1]} to unlock`:'Offline'; else if(best.seconds) note.textContent=`Best ${formatTime(best.seconds)}`; else note.textContent=state.clears[id]?'Online · improve your rating':'Awaiting repair';
      const button=document.createElement('button');button.type='button';button.disabled=locked;button.textContent=locked?'Offline':state.clears[id]?'Re-run':'Repair';button.addEventListener('click',()=>openBriefing(id));
      footer.append(note,button);card.append(top,title,topic,desc,meta,stars,footer);levelGrid.appendChild(card);
    });
  }

  function openBriefing(id){
    const w=DATA.weeks[id],sys=systemFor(id);if(!w)return;pendingBriefId=id;
    byId('brief-system-label').textContent=`SYSTEM ${id}`;byId('briefing-title').textContent=sys.name;byId('brief-topic').textContent=cleanTopic(w.title,id);byId('brief-description').textContent=w.description||'';byId('brief-objective').textContent=sys.objective;
    const meta=byId('brief-meta');meta.replaceChildren();const metaItems=['1','2','3','4'].includes(String(id))?['3 rooms · 3 stages each',`${(w.questions||[]).length} questions · 3 diagnostic stages`,'inside a micro:bit']:[`${(w.questions||[]).length} challenges`,'4 integrity','2 diagnostics'];for(const text of metaItems){const tag=document.createElement('span');tag.className='tag';tag.textContent=text;meta.appendChild(tag);}renderMatrix(byId('brief-visual'),id,state.clears[id]?'complete':'ready');showScreen('briefing');byId('brief-start').focus({preventScroll:true});
  }

  function difficultyRank(q){
    const d=String(q?.difficulty||'medium').toLowerCase().replace(/\s+/g,'-');
    if(d==='easy')return 1;
    if(d==='medium')return 2;
    if(d==='medium-hard'||d==='mediumhard')return 3;
    if(d==='hard')return 4;
    return 2;
  }
  function buildDiagnosticStages(questions){
    const ordered=questions.map((q,i)=>({q,i,rank:difficultyRank(q)}))
      .sort((a,b)=>a.rank-b.rank||a.i-b.i)
      .map(x=>x.q);
    const n=ordered.length,base=Math.floor(n/3),extra=n%3;
    const sizes=[base+(extra>0?1:0),base+(extra>1?1:0),base];
    const stages=[];let cursor=0;
    for(const size of sizes){stages.push(ordered.slice(cursor,cursor+size));cursor+=size;}
    return stages;
  }
  function currentDiagnosticStageQuestions(){
    return G?.diagnosticStages?.[G.diagnosticStage]||G?.questions||[];
  }
  function diagnosticStageMastered(){
    const stageQs=currentDiagnosticStageQuestions();
    return stageQs.filter(q=>G.mastered.has(keyFor(q))).length;
  }
  function diagnosticStageComplete(){
    const stageQs=currentDiagnosticStageQuestions();
    return stageQs.length>0&&stageQs.every(q=>G.mastered.has(keyFor(q)));
  }
  function updateDiagnosticStageLabel(){
    if(!G)return;
    const stageQs=currentDiagnosticStageQuestions();
    byId('battle-week').textContent='Final diagnostic · Stage '+(G.diagnosticStage+1)+'/3 · '+stageQs.length+' checks';
  }
  function enterDiagnosticStage(index){
    G.diagnosticStage=Math.max(0,Math.min(2,index));
    const stageQs=currentDiagnosticStageQuestions();
    G.queue=stageQs.filter(q=>!G.mastered.has(keyFor(q))).map(q=>({q,retry:false}));
    G.integrity=G.integrityMax;
    updateDiagnosticStageLabel();
    renderHud();
  }
  function renderDiagnosticStageGate(){
    const completed=G.diagnosticStage+1;
    const nextStage=completed+1;
    inputLocked=true;
    const fb=byId('feedback');fb.hidden=true;fb.replaceChildren();
    const panel=byId('qpanel');panel.replaceChildren();
    const gate=document.createElement('div');gate.className='diagnostic-stage-gate';
    const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent='DIAGNOSTIC STAGE '+completed+'/3 COMPLETE';
    const title=document.createElement('h2');title.textContent=nextStage===3?'Final diagnostic stage unlocked':'Diagnostic stage '+nextStage+' unlocked';
    const copy=document.createElement('p');
    copy.textContent=nextStage===2
      ?'Four checks verified. Integrity is restored before Stage 2, where the questions become more demanding.'
      :'Eight checks verified. Integrity is restored for the final four, highest-difficulty checks.';
    const strip=document.createElement('div');strip.className='diagnostic-stage-strip';
    for(let i=1;i<=3;i++){const s=document.createElement('span');s.className=i<=completed?'complete':i===nextStage?'next':'';s.textContent='STAGE '+i;strip.appendChild(s);}
    const button=document.createElement('button');button.type='button';button.textContent='Start stage '+nextStage+'/3 →';
    button.addEventListener('click',()=>{enterDiagnosticStage(nextStage-1);inputLocked=false;nextQuestion();});
    gate.append(eyebrow,title,copy,strip,button);panel.appendChild(gate);
    updateDiagnosticStageLabel();
    requestAnimationFrame(()=>button.focus({preventScroll:true}));
  }

  function startMission(id){
    if(globalThis.TTCAdventure?.supports?.(id))return startAdventureMission(id);
    return startDiagnostic(id,null);
  }

  function startAdventureMission(id){
    const w=DATA.weeks[id];if(!w)return;
    stopTimer();
    G={id,w,stage:'adventure',mastered:new Set(),mistakes:0,adventureStats:null};
    showScreen('adventure');
    globalThis.TTCAdventure.start({
      systemId:id,
      root:byId('adventure-root'),
      playTone,
      toast,
      onExit:()=>exitAdventure(),
      onComplete:(stats)=>startDiagnostic(id,stats)
    });
  }

  function startDiagnostic(id,adventureStats=null){
    const w=DATA.weeks[id];if(!w)return;
    const allQuestions=(w.questions||[]).map(q=>({...q}));
    if(!allQuestions.length){toast('This system has no challenges yet.');return;}
    const questions=allQuestions;
    const diagnosticStages=buildDiagnosticStages(questions);
    G={
      id,w,stage:'diagnostic',adventureStats,questions,diagnosticStages,diagnosticStage:0,
      queue:diagnosticStages[0].map(q=>({q,retry:false})),current:null,mastered:new Set(),
      integrityMax:4,integrity:4,streak:0,bestStreak:0,score:Number(adventureStats?.bonusScore)||0,
      mistakes:0,hintsLeft:2,hintsUsed:0,review:new Map(),startedAt:Date.now(),finishedAt:null
    };
    inputLocked=false;selectedMatchTerm=null;
    updateDiagnosticStageLabel();
    byId('mission-title').textContent=adventureStats?systemFor(id).name+' Verification':systemFor(id).name;
    byId('system-label').textContent=adventureStats?'SYSTEM '+id+' · FINAL DIAGNOSTIC':'SYSTEM '+id+' · REPAIR MODE';
    renderMatrix(byId('system-visual'),id,'repairing');renderModules();showScreen('game');renderHud();nextQuestion();startTimer();playTone(420,.06,'sine',.035);
  }
  function renderModules(){ const row=byId('module-row');row.replaceChildren();for(const label of systemFor(G.id).modules){const el=document.createElement('div');el.className='module';el.textContent=label;row.appendChild(el);} }
  function updateModules(){ const pct=G.mastered.size/G.questions.length;Array.from(byId('module-row').children).forEach((el,i)=>el.classList.toggle('online',pct>=(i+1)/4)); }
  function updateRepairMatrix(){
    const leds=Array.from(byId('system-visual').querySelectorAll('.led-matrix span.on'));const lit=Math.round(leds.length*(G.mastered.size/G.questions.length));leds.forEach((led,i)=>led.classList.toggle('repaired',i<lit));
  }
  function renderHud(){
    if(!G)return;const integrity=byId('integrity');integrity.replaceChildren();for(let i=0;i<G.integrityMax;i++){const pip=document.createElement('span');pip.className=`integrity-pip${i>=G.integrity?' off':''}`;integrity.appendChild(pip);}integrity.setAttribute('aria-label',`${G.integrity} of ${G.integrityMax} integrity points remaining`);
    const repaired=G.mastered.size,total=G.questions.length,pct=total?repaired/total*100:0;byId('repair-fill').style.width=`${pct}%`;document.querySelector('.repair-bar')?.setAttribute('aria-valuenow',String(Math.round(pct)));byId('repair-count').textContent=G.adventureStats?`${repaired} / ${total} verified`:`${repaired} / ${total} repaired`;byId('mastered').textContent=`${repaired} / ${total}`;byId('streak').textContent=`${G.streak}×`;byId('score').textContent=String(G.score);byId('hintLeft').textContent=String(G.hintsLeft);byId('useHint').disabled=G.hintsLeft<=0||inputLocked||!G.current?.q?.hint;byId('timer-wrap').hidden=!state.settings.timer;renderTimer();updateModules();updateRepairMatrix();
  }
  function startTimer(){stopTimer();timerTicker=setInterval(()=>{if(G&&!screens.game.hidden)renderTimer();},500)}function stopTimer(){if(timerTicker)clearInterval(timerTicker);timerTicker=null}function renderTimer(){if(!G)return;const seconds=Math.floor(((G.finishedAt||Date.now())-G.startedAt)/1000);byId('timer').textContent=formatTime(seconds);}

  function nextQuestion(){
    if(!G)return;
    if(G.mastered.size>=G.questions.length){finishMission(false);return;}
    if(diagnosticStageComplete()){
      if(G.diagnosticStage<2){renderDiagnosticStageGate();return;}
      finishMission(false);return;
    }
    let item=null;
    while(G.queue.length&&!item){
      const candidate=G.queue.shift();
      if(candidate&&!G.mastered.has(keyFor(candidate.q)))item=candidate;
    }
    if(!item){
      const stageQs=currentDiagnosticStageQuestions();
      G.queue=stageQs.filter(q=>!G.mastered.has(keyFor(q))).map(q=>({q,retry:true}));
      while(G.queue.length&&!item){
        const candidate=G.queue.shift();
        if(candidate&&!G.mastered.has(keyFor(candidate.q)))item=candidate;
      }
      if(!item){
        if(G.diagnosticStage<2){renderDiagnosticStageGate();return;}
        finishMission(false);return;
      }
    }
    G.current=item;inputLocked=false;selectedMatchTerm=null;
    const fb=byId('feedback');fb.hidden=true;fb.className='feedback';fb.replaceChildren();
    renderQuestion(item.q,item.retry);renderHud();
  }
  function renderQuestion(q,retry){
    const panel=byId('qpanel');panel.replaceChildren();const head=document.createElement('div');head.className='question-head';const count=document.createElement('div');count.className='question-count';const stageQs=currentDiagnosticStageQuestions(),stageDone=diagnosticStageMastered();count.textContent='STAGE '+(G.diagnosticStage+1)+'/3 · '+stageDone+'/'+stageQs.length+' verified · '+G.mastered.size+'/'+G.questions.length+' overall';head.appendChild(count);if(retry){const badge=document.createElement('div');badge.className='retry-badge';badge.textContent='Second chance';head.appendChild(badge);}const title=document.createElement('h2');title.textContent=q.question||'Challenge';panel.append(head,title);
    if(q.code){const code=document.createElement('pre');code.className='qcode';code.textContent=q.code;panel.appendChild(code);}if(q.type==='multiple-choice')renderMC(panel,q);else if(q.type==='drag-drop')renderMatch(panel,q);else{const p=document.createElement('p');p.textContent=`Unsupported challenge type: ${q.type}`;panel.appendChild(p);}requestAnimationFrame(()=>panel.querySelector('button:not(:disabled)')?.focus({preventScroll:true}));
  }
  function renderMC(panel,q){
    const options=document.createElement('div');options.className='options';
    const source=q.options||[];
    let order=shuffle(source.map((_,i)=>i));
    G.mcOrders=G.mcOrders||new Map();
    const qKey=keyFor(q),previous=G.mcOrders.get(qKey);
    if(order.length>1&&previous===order.join(',')){[order[0],order[1]]=[order[1],order[0]];}
    G.mcOrders.set(qKey,order.join(','));
    order.forEach((optionIndex,displayIndex)=>{
      const opt=source[optionIndex];
      const b=document.createElement('button');b.type='button';b.className='option-button';
      b.dataset.optionIndex=String(optionIndex);
      b.dataset.displayIndex=String(displayIndex);
      const key=document.createElement('span');key.className='option-key';key.textContent=String(displayIndex+1);
      const text=document.createElement('span');text.textContent=opt;
      b.append(key,text);
      b.setAttribute('aria-label',`${displayIndex+1}. ${opt}`);
      b.addEventListener('click',()=>answerMC(optionIndex));
      options.appendChild(b);
    });
    panel.appendChild(options);
  }
  function answerMC(i){
    if(inputLocked)return;
    const q=G.current.q,buttons=Array.from(document.querySelectorAll('.option-button'));
    buttons.forEach(b=>b.disabled=true);
    const correct=i===q.correct;
    const correctButton=buttons.find(b=>Number(b.dataset.optionIndex)===q.correct);
    const chosenButton=buttons.find(b=>Number(b.dataset.optionIndex)===i);
    if(correctButton)correctButton.classList.add('good');
    if(!correct&&chosenButton)chosenButton.classList.add('bad');
    settle(correct,{chosenIndex:i,answerSummary:correct?`Correct: ${q.options[q.correct]}`:`Your answer: ${q.options[i]||'—'} · Correct: ${q.options[q.correct]||'—'}`});
  }

  function renderMatch(panel,q){
    const intro=document.createElement('p');intro.className='match-intro';intro.textContent='Choose a term, then choose its matching definition. Tap a matched definition to change it.';const layout=document.createElement('div');layout.className='match-layout';const terms=document.createElement('div'),defs=document.createElement('div');terms.className=defs.className='match-column';terms.innerHTML='<div class="match-column-title">Terms</div>';defs.innerHTML='<div class="match-column-title">Definitions</div>';const termOrder=shuffle([...q.terms.keys()]),defOrder=shuffle([...q.definitions.keys()]);G.matchState={assignments:new Map(),termOrder,defOrder};
    for(const ti of termOrder){const b=document.createElement('button');b.type='button';b.className='match-term';b.dataset.termIndex=String(ti);b.textContent=q.terms[ti];b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>selectTerm(ti));terms.appendChild(b);}for(const di of defOrder){const b=document.createElement('button');b.type='button';b.className='match-definition';b.dataset.defIndex=String(di);b.addEventListener('click',()=>chooseDef(di));defs.appendChild(b);}layout.append(terms,defs);const actions=document.createElement('div');actions.className='match-actions';const submit=document.createElement('button');submit.type='button';submit.id='submit-match';submit.textContent='Check repair';submit.disabled=true;submit.addEventListener('click',submitMatch);actions.appendChild(submit);panel.append(intro,layout,actions);refreshMatch();
  }
  function selectTerm(ti){if(inputLocked)return;selectedMatchTerm=selectedMatchTerm===ti?null:ti;refreshMatch();}
  function chooseDef(di){if(inputLocked)return;const a=G.matchState.assignments;if(selectedMatchTerm==null){if(a.has(di)){selectedMatchTerm=a.get(di);a.delete(di);refreshMatch();}else toast('Choose a term first.');return;}for(const [d,t] of a.entries())if(t===selectedMatchTerm)a.delete(d);a.set(di,selectedMatchTerm);selectedMatchTerm=null;refreshMatch();}
  function refreshMatch(){if(!G?.matchState)return;const q=G.current.q,a=G.matchState.assignments,paired=new Set(a.values());document.querySelectorAll('.match-term').forEach(b=>{const ti=Number(b.dataset.termIndex);b.classList.toggle('selected',ti===selectedMatchTerm);b.classList.toggle('paired',paired.has(ti));b.setAttribute('aria-pressed',ti===selectedMatchTerm?'true':'false');});document.querySelectorAll('.match-definition').forEach(b=>{const di=Number(b.dataset.defIndex),ti=a.get(di);b.replaceChildren();const t=document.createElement('span');t.textContent=q.definitions[di];b.appendChild(t);if(ti!=null){const p=document.createElement('span');p.className='paired-with';p.textContent=`← ${q.terms[ti]}`;b.appendChild(p);}});byId('submit-match').disabled=a.size!==q.terms.length;}
  function submitMatch(){if(inputLocked)return;const q=G.current.q,a=G.matchState.assignments;let ok=0;document.querySelectorAll('.match-definition').forEach(b=>{b.disabled=true;const di=Number(b.dataset.defIndex),ti=a.get(di),good=q.correctMatches?.[ti]===di;b.classList.add(good?'correct':'wrong');if(good)ok++;else{const correction=document.createElement('span');correction.className='correct-match';correction.textContent=`Correct: ${q.terms[q.correctMatches.indexOf(di)]||'review this pair'}`;b.appendChild(correction);}});document.querySelectorAll('.match-term').forEach(b=>b.disabled=true);byId('submit-match').disabled=true;settle(ok===q.terms.length,{answerSummary:ok===q.terms.length?'All circuits matched correctly.':`${ok} of ${q.terms.length} pairs were correct.`});}

  function settle(correct,meta={}){
    if(inputLocked)return;inputLocked=true;const q=G.current.q,visual=byId('system-visual');visual.classList.remove('hit','fault');void visual.offsetWidth;let combo='';
    if(correct){G.mastered.add(keyFor(q));G.streak++;G.bestStreak=Math.max(G.bestStreak,G.streak);const bonus=Math.min(100,G.streak*10);G.score+=100+bonus;if(G.streak>0&&G.streak%3===0)combo=`⚡ Clean compile ×${G.streak}! +${bonus} bonus`;visual.classList.add('hit');playTone(640,.07,'sine',.04);}
    else{G.mistakes++;G.streak=0;G.integrity=Math.max(0,G.integrity-1);G.review.set(keyFor(q),{q,meta});if(G.integrity>0)G.queue.push({q,retry:true});visual.classList.add('fault');playTone(150,.11,'sawtooth',.035);}
    renderHud();showFeedback(correct,q,meta,combo);if(!correct&&G.integrity<=0)byId('continue-btn').textContent='See fault log';
  }
  function showFeedback(correct,q,meta,combo){const fb=byId('feedback');fb.hidden=false;fb.className=`feedback ${correct?'correct':'incorrect'}`;fb.replaceChildren();const row=document.createElement('div');row.className='feedback-row';const copy=document.createElement('div');copy.className='feedback-copy';const strong=document.createElement('strong');strong.textContent=correct?(G.adventureStats?'✓ Diagnostic check passed.':'✓ Circuit repaired.'):'⚠ Fault found — this challenge will return.';const exp=document.createElement('div');exp.textContent=q.explanation||meta.answerSummary||'';copy.append(strong,exp);if(q.definition){const d=document.createElement('div');d.className='definition-note';d.textContent=q.definition;copy.appendChild(d);}if(!correct&&meta.answerSummary){const a=document.createElement('div');a.style.marginTop='5px';a.textContent=meta.answerSummary;copy.appendChild(a);}if(combo){const c=document.createElement('span');c.className='combo';c.textContent=combo;copy.appendChild(c);}const next=document.createElement('button');next.type='button';next.id='continue-btn';next.textContent='Continue';next.addEventListener('click',continueAfter);row.append(copy,next);fb.appendChild(row);next.focus({preventScroll:true});}
  function continueAfter(){if(G.integrity<=0){finishMission(true);return;}if(G.mastered.size>=G.questions.length){finishMission(false);return;}nextQuestion();}

  function useHint(){if(!G||inputLocked||G.hintsLeft<=0||!G.current?.q?.hint){if(G&&G.hintsLeft<=0)toast('No diagnostics left in this mission.');return;}G.hintsLeft--;G.hintsUsed++;renderHud();const fb=byId('feedback');fb.hidden=false;fb.className='feedback hint';fb.replaceChildren();const copy=document.createElement('div');copy.className='feedback-copy';const h=document.createElement('strong');h.textContent='⌕ Diagnostic hint';const t=document.createElement('div');t.textContent=G.current.q.hint;copy.append(h,t);fb.appendChild(copy);playTone(360,.05,'sine',.025);}

  function finishMission(failed){
    G.finishedAt=Date.now();
    stopTimer();
    const seconds=Math.floor((G.finishedAt-G.startedAt)/1000);
    const attempts=G.mastered.size+G.mistakes;
    const accuracy=attempts?Math.round(G.mastered.size/attempts*100):0;
    const isAdventure=!!G.adventureStats;
    const adventureId=String(G.id);
    const a=G.adventureStats||{};
    const adventureFaults=Number(a.totalFaults ?? (
      adventureId==='1'
        ? (Number(a.arcadeFaults||0)+Number(a.sequenceFaults||0)+Number(a.memoryFaults||0))
        : (Number(a.arcadeFaults||0)+Number(a.logicFaults||0)+Number(a.routerFaults||0))
    ))||0;
    let rating=0;

    if(failed){
      byId('results-kicker').textContent=isAdventure?'FINAL DIAGNOSTIC FAILED':'REPAIR PAUSED';
      const failureTitles={
        '1':'Boot verification incomplete',
        '2':'Randomiser verification incomplete',
        '3':'Logic Router verification incomplete',
        '4':'Sensor Array verification incomplete'
      };
      byId('results-title').textContent=isAdventure?(failureTitles[adventureId]||'System verification incomplete'):'System still unstable';
      byId('results-summary').textContent=isAdventure
        ?`The nine adventure stages are complete, but only ${G.mastered.size} of ${G.questions.length} diagnostic checks were verified. Review the fault log and re-run the mission.`
        :`You repaired ${G.mastered.size} of ${G.questions.length} circuits. Review the fault log and re-run the mission.`;
    }else{
      if(isAdventure){
        const adventureClean=adventureFaults===0;
        const diagnosticClean=G.mistakes===0;
        rating=1+(adventureClean?1:0)+(diagnosticClean?1:0);
        const resultCopy={
          '1':{
            kicker:'MICRO:BIT BOOT COMPLETE',
            perfect:'Flawless boot!',
            title:'Boot Sequence online!',
            perfectSummary:'Power routing, startup logic, RAM repair and the final diagnostic all completed without a fault.',
            summary:'The micro:bit can boot again. Replay the mission if you want to earn the clean-repair and flawless-diagnostic stars.'
          },
          '2':{
            kicker:'RANDOMISER CORE ONLINE',
            perfect:'Perfect randomisation!',
            title:'Randomiser Core online!',
            perfectSummary:'Packet filtering, range diagnostics, data routing and the final diagnostic all completed without a fault.',
            summary:'Random behaviour is stable again. Replay the mission if you want the clean-adventure and flawless-diagnostic stars.'
          },
          '3':{
            kicker:'LOGIC ROUTER ONLINE',
            perfect:'Flawless logic!',
            title:'Logic Router online!',
            perfectSummary:'Branch routing, decision logic, Futoshiki repair and the final diagnostic all completed without a fault.',
            summary:'Conditional routing is stable again. Replay the mission if you want the clean-adventure and flawless-diagnostic stars.'
          },
          '4':{
            kicker:'SENSOR ARRAY ONLINE',
            perfect:'Perfect calibration!',
            title:'Sensor Array online!',
            perfectSummary:'Sensor sweeping, variable processing, sensor-map deduction and the final diagnostic all completed without a fault.',
            summary:'Stored values and sensor thresholds are stable again. Replay the mission if you want the clean-adventure and flawless-diagnostic stars.'
          },        };
        const rc=resultCopy[adventureId]||{kicker:'SYSTEM ONLINE',perfect:'Flawless repair!',title:'System online!',perfectSummary:'Every adventure stage and diagnostic completed without a fault.',summary:'The system is online again.'};
        byId('results-kicker').textContent=rc.kicker;
        byId('results-title').textContent=rating===3?rc.perfect:rc.title;
        byId('results-summary').textContent=rating===3?rc.perfectSummary:rc.summary;
      }else{
        rating=G.mistakes===0?3:G.mistakes<=2?2:1;
        byId('results-kicker').textContent='SYSTEM ONLINE';
        byId('results-title').textContent=rating===3?'Flawless repair!':'System restored!';
        byId('results-summary').textContent=rating===3?'Every circuit restored without a fault. Excellent work.':'Every challenge is mastered and the system is back online.';
      }

      state.clears[G.id]=true;
      state.ratings[G.id]=Math.max(Number(state.ratings[G.id])||0,rating);
      const old=state.best[G.id]||{};
      if(!old.seconds||rating>(old.rating||0)||(rating===(old.rating||0)&&seconds<old.seconds)){
        state.best[G.id]={rating,seconds,mistakes:G.mistakes,hintsUsed:G.hintsUsed,bestStreak:G.bestStreak,score:G.score,adventureStats:G.adventureStats||null};
      }
      const ids=weekIds(),next=ids[ids.indexOf(G.id)+1];
      if(next&&!state.unlocked.includes(next))state.unlocked.push(next);
      save();
      playTone(780,.09,'sine',.04);
      setTimeout(()=>playTone(980,.11,'sine',.035),90);
    }

    renderMatrix(byId('results-visual'),G.id,failed?'ready':'complete');
    const stars=byId('result-stars');stars.replaceChildren();
    const node=buildStars(failed?0:rating,`${failed?0:rating} of 3 stars`);
    while(node.firstChild)stars.appendChild(node.firstChild);

    const stats=byId('result-stats');stats.replaceChildren();
    if(isAdventure){
      addStat(stats,'Adventure','9 stages');
      addStat(stats,'Adventure faults',String(adventureFaults));
      addStat(stats,'Diagnostic',`${accuracy}%`);
      addStat(stats,'Score',String(G.score));
    }else{
      addStat(stats,'Repaired',`${G.mastered.size}/${G.questions.length}`);
      addStat(stats,'Accuracy',`${accuracy}%`);
      addStat(stats,'Best streak',`${G.bestStreak}×`);
      addStat(stats,'Score',String(G.score));
    }

    const list=byId('review-list');list.replaceChildren();
    byId('review-count').textContent=G.review.size?`(${G.review.size})`:'';
    byId('review-details').hidden=!G.review.size;
    for(const {q} of G.review.values()){
      const li=document.createElement('li');
      const qq=document.createElement('div');qq.className='review-question';qq.textContent=q.question;
      const e=document.createElement('div');e.textContent=q.explanation||'';
      li.append(qq,e);list.appendChild(li);
    }
    const ids=weekIds(),next=ids[ids.indexOf(G.id)+1];
    byId('next-system').hidden=failed||!next;
    showScreen('results');
    renderHeader();
    byId('retry').focus({preventScroll:true});
  }

  function addStat(parent,label,value){const d=document.createElement('div');d.className='result-stat';const s=document.createElement('span');s.textContent=label;const b=document.createElement('strong');b.textContent=value;d.append(s,b);parent.appendChild(d);}

  function openDialog(id){const d=byId(id);if(d?.showModal)d.showModal();}
  function resetProgress(){try{localStorage.removeItem(STORAGE_KEY);for(const k of LEGACY_KEYS)localStorage.removeItem(k);}catch(_){ }globalThis.TTCAdventure?.stop?.();Object.assign(state,freshState());save();byId('reset-dialog')?.close();byId('settings-dialog')?.close();G=null;renderLevels();showScreen('levels');toast('Progress reset. System 1 is ready.');}
  function exitMission(){if(!G){showScreen('levels');return;}const dirty=G.mastered.size||G.mistakes;if(!dirty||confirm('Exit this mission? This run will be discarded, but completed systems and best results stay saved.')){stopTimer();G=null;renderLevels();showScreen('levels');}}
  function exitAdventure(){if(!G){renderLevels();showScreen('levels');return;}if(confirm('Exit the micro:bit repair mission? This run will be discarded, but completed systems stay saved.')){globalThis.TTCAdventure?.stop?.();G=null;renderLevels();showScreen('levels');}}
  function toast(msg){const t=byId('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1600);}
  function keyFor(q){return q.id||`${q.question||''}|${q.code||''}`;}
  function formatTime(sec){const v=Math.max(0,Math.floor(Number(sec)||0));return `${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`;}
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function playTone(freq=440,dur=.06,type='sine',vol=.03){if(state.settings.sound===false)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!audioCtx)audioCtx=new AC();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);}catch(_){}}
  function handleKeys(e){if(!G||screens.game.hidden||document.querySelector('dialog[open]'))return;const tag=document.activeElement?.tagName?.toLowerCase();if(tag==='input'||tag==='textarea')return;if(e.key.toLowerCase()==='h'&&!inputLocked){e.preventDefault();useHint();return;}if(e.key==='Enter'&&inputLocked&&byId('continue-btn')){e.preventDefault();continueAfter();return;}if(!inputLocked&&/^[1-9]$/.test(e.key)){const b=document.querySelector(`.option-button[data-display-index="${Number(e.key)-1}"]`);if(b&&!b.disabled){e.preventDefault();b.click();}}}

  byId('brief-back').addEventListener('click',()=>{renderLevels();showScreen('levels');});
  byId('brief-start').addEventListener('click',()=>pendingBriefId&&startMission(pendingBriefId));
  byId('adventure-exit').addEventListener('click',exitAdventure);
  byId('quit').addEventListener('click',exitMission);byId('useHint').addEventListener('click',useHint);
  byId('retry').addEventListener('click',()=>G&&startMission(G.id));
  byId('back-levels').addEventListener('click',()=>{globalThis.TTCAdventure?.stop?.();G=null;renderLevels();showScreen('levels');});
  byId('next-system').addEventListener('click',()=>{if(!G)return;const ids=weekIds(),next=ids[ids.indexOf(G.id)+1];if(next)openBriefing(next);});
  byId('help').addEventListener('click',()=>openDialog('help-dialog'));
  byId('settings').addEventListener('click',()=>{byId('setting-timer').checked=state.settings.timer;byId('setting-sound').checked=state.settings.sound;openDialog('settings-dialog');});
  byId('setting-timer').addEventListener('change',e=>{state.settings.timer=!!e.target.checked;save();if(G)renderHud();});
  byId('setting-sound').addEventListener('change',e=>{state.settings.sound=!!e.target.checked;save();});
  byId('reset').addEventListener('click',()=>openDialog('reset-dialog'));
  byId('confirm-reset').addEventListener('click',e=>{e.preventDefault();resetProgress();});document.addEventListener('keydown',handleKeys);

  renderLevels();showScreen('levels');
  if(DEBUG_WEEK&&DATA.weeks[DEBUG_WEEK])openBriefing(DEBUG_WEEK);
})();
