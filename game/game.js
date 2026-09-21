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
  const screens = {levels:byId('screen-levels'), briefing:byId('screen-briefing'), game:byId('screen-game'), results:byId('screen-results')};
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
      const qtag=document.createElement('span');qtag.className='tag';qtag.textContent=`${(w.questions||[]).length} challenges`;
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
    const meta=byId('brief-meta');meta.replaceChildren();for(const text of [`${(w.questions||[]).length} challenges`,'4 integrity','2 diagnostics']){const tag=document.createElement('span');tag.className='tag';tag.textContent=text;meta.appendChild(tag);}renderMatrix(byId('brief-visual'),id,state.clears[id]?'complete':'ready');showScreen('briefing');byId('brief-start').focus({preventScroll:true});
  }

  function startMission(id){
    const w=DATA.weeks[id];if(!w)return;const questions=(w.questions||[]).map(q=>({...q}));if(!questions.length){toast('This system has no challenges yet.');return;}
    G={id,w,questions,queue:questions.map(q=>({q,retry:false})),current:null,mastered:new Set(),integrityMax:4,integrity:4,streak:0,bestStreak:0,score:0,mistakes:0,hintsLeft:2,hintsUsed:0,review:new Map(),startedAt:Date.now(),finishedAt:null};
    inputLocked=false;selectedMatchTerm=null;byId('battle-week').textContent=w.title||`Week ${id}`;byId('mission-title').textContent=systemFor(id).name;byId('system-label').textContent=`SYSTEM ${id} · REPAIR MODE`;renderMatrix(byId('system-visual'),id,'repairing');renderModules();showScreen('game');renderHud();nextQuestion();startTimer();playTone(420,.06,'sine',.035);
  }
  function renderModules(){ const row=byId('module-row');row.replaceChildren();for(const label of systemFor(G.id).modules){const el=document.createElement('div');el.className='module';el.textContent=label;row.appendChild(el);} }
  function updateModules(){ const pct=G.mastered.size/G.questions.length;Array.from(byId('module-row').children).forEach((el,i)=>el.classList.toggle('online',pct>=(i+1)/4)); }
  function updateRepairMatrix(){
    const leds=Array.from(byId('system-visual').querySelectorAll('.led-matrix span.on'));const lit=Math.round(leds.length*(G.mastered.size/G.questions.length));leds.forEach((led,i)=>led.classList.toggle('repaired',i<lit));
  }
  function renderHud(){
    if(!G)return;const integrity=byId('integrity');integrity.replaceChildren();for(let i=0;i<G.integrityMax;i++){const pip=document.createElement('span');pip.className=`integrity-pip${i>=G.integrity?' off':''}`;integrity.appendChild(pip);}integrity.setAttribute('aria-label',`${G.integrity} of ${G.integrityMax} integrity points remaining`);
