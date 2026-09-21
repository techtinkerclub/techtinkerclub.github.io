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
