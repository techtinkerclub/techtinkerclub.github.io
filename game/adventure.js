/* Tech Tinker: System Rescue — micro:bit adventure layer
 * System 1: arcade routing + startup sequence logic + 6×6 binary memory repair.
 * System 2: random packet arcade + range diagnostics + number-property data routing.
 *
 * The RAM generator is adapted from the verified 99 Club Studio Takuzu engine.
 * The System 2 Data Router is adapted from the verified 99 Club Studio Property Maze
 * approach: seeded induced paths, mathematically valid dead ends, and a unique route.
 */
(function(global){
'use strict';

let active=null;

const key=(r,c)=>`${r}:${c}`;
const same=(a,b)=>a&&b&&a[0]===b[0]&&a[1]===b[1];

function hashString(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rngFromSeed(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function shuffled(arr,rng=Math.random){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function led(){return global.TTCMicrobitLED||null;}

function start(opts){
  stop();
  if(!opts?.root)throw new Error('Adventure root is required');
  active={
    root:opts.root,
    onComplete:typeof opts.onComplete==='function'?opts.onComplete:()=>{},
    onExit:typeof opts.onExit==='function'?opts.onExit:()=>{},
    playTone:typeof opts.playTone==='function'?opts.playTone:()=>{},
    toast:typeof opts.toast==='function'?opts.toast:()=>{},
    systemId:String(opts.systemId||'1'),
    room:0,
    roomStage:0,
    seed:`microbit-system-${String(opts.systemId||'1')}-${Date.now()}`,
    bits:new Set(),
    arcadeFaults:0,
    sequenceFaults:0,
    memoryFaults:0,
    logicFaults:0,
    routerFaults:0,
    branchFaults:0,
    decisionFaults:0,
    futoshikiFaults:0,
    sensorFaults:0,
    variableFaults:0,
    faultMapFaults:0,
    roomIntegrityMax:4,
    roomIntegrity:4,
    roomRestarts:0,
    roomsCompleted:0,
    keyHandler:null,
    timers:new Set(),
    completed:false
  };
  led()?.clear();
  renderRoom();
}

function clearTimers(){
  if(!active?.timers)return;
  for(const id of active.timers){clearInterval(id);clearTimeout(id);}
  active.timers.clear();
}
function later(fn,ms){
  if(!active)return null;
  const id=setTimeout(()=>{active?.timers?.delete(id);fn();},ms);
  active.timers.add(id);return id;
}
function every(fn,ms){
  if(!active)return null;
  const id=setInterval(fn,ms);active.timers.add(id);return id;
}
function clearExpeditionViewport(){
  document.body.classList.remove('expedition-immersive-open');
  document.getElementById('screen-adventure')?.classList.remove('expedition-fullscreen-host');
  try{if(screen.orientation&&screen.orientation.unlock)screen.orientation.unlock();}catch(_){}
  const fs=document.fullscreenElement;
  if(fs&&document.exitFullscreen&&(fs.id==='screen-adventure'||fs.classList?.contains('expedition-shell'))){
    try{
      const p=document.exitFullscreen();
      if(p&&typeof p.catch==='function')p.catch(()=>{});
    }catch(_){}
  }
}
function stop(){
  if(active?.keyHandler)document.removeEventListener('keydown',active.keyHandler);
  clearTimers();
  clearOverlay();
  clearExpeditionViewport();
  led()?.clear();
  active=null;
}

function setProgress(label){
  const el=document.getElementById('adventure-progress');
  if(el)el.textContent=label;
  const side=document.getElementById('adventure-side-progress');
  if(side)side.textContent=label;
}

function renderRoom(){
  if(!active)return;
  if(active.keyHandler){document.removeEventListener('keydown',active.keyHandler);active.keyHandler=null;}
  clearTimers();
  clearOverlay();
  clearExpeditionViewport();
  document.getElementById('screen-adventure')?.classList.remove('expedition-map-mode');
  active.roomIntegrity=active.roomIntegrityMax;
  active.root.replaceChildren();
  if(active.systemId==='2'){
    if(active.room===0)renderRandomPacketCatcher();
    else if(active.room===1)renderBrokenRandomiser();
    else if(active.room===2)renderPropertyRouter();
    else renderRandomiserFinalGate();
    return;
  }
  if(active.systemId==='3'){
    if(active.room===0)renderBranchRunner();
    else if(active.room===1)renderDecisionEngine();
    else if(active.room===2)renderLogicFutoshiki();
    else renderLogicRouterFinalGate();
    return;
  }
  if(active.systemId==='4'){
    if(active.room===0)renderSensorScanner();
    else if(active.room===1)renderVariableProcessor();
    else if(active.room===2)renderSensorFaultMap();
    else renderSensorArrayFinalGate();
    return;
  }
  if(active.room===0)renderPulseRun();
  else if(active.room===1)renderBootOrder();
  else if(active.room===2)renderMemoryBank();
  else renderFinalGate();
}

function paintAdventureIntegrity(){
  if(!active)return;
  document.querySelectorAll('[data-adventure-integrity]').forEach(el=>{
    const value=el.querySelector('.adventure-integrity-value');
    if(value)value.textContent=`${active.roomIntegrity}/${active.roomIntegrityMax}`;
    el.querySelectorAll('.adventure-integrity-pip').forEach((pip,i)=>pip.classList.toggle('off',i>=active.roomIntegrity));
    el.classList.toggle('critical',active.roomIntegrity===1);
  });
}
function applyAdventurePenalty(){
  if(!active)return false;
  active.roomIntegrity=Math.max(0,active.roomIntegrity-1);
  paintAdventureIntegrity();
  if(active.roomIntegrity>0)return false;
  active.roomRestarts++;
  clearTimers();
  led()?.flash('x',520);
  showTransition(
    'Integrity depleted',
    'Too many faults reached this subsystem. This room will restart, but your earlier completed rooms are safe.',
    'Restart room →',
    ()=>renderRoom(),
    'fault'
  );
  return true;
}
function focusPlayArea(el,after){
  if(!el){after?.();return;}
  el.setAttribute('tabindex','-1');
  try{el.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){el.scrollIntoView();}
  later(()=>{try{el.focus({preventScroll:true});}catch(_){}after?.();},420);
}

function roomHeader(kicker,title,copy){
  const head=document.createElement('div');head.className='adventure-room-head';
  const left=document.createElement('div');
  const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent=kicker;
  const h=document.createElement('h2');h.id='adventure-title';h.textContent=title;
  const p=document.createElement('p');p.textContent=copy;
  left.appendChild(eyebrow);
  if(active&&active.room<3){
    const stage=document.createElement('span');stage.className='room-stage-badge';
    if(active.systemId==='1'||active.systemId==='2'){
      const globalStage=active.room*3+(active.roomStage||0)+1;
      stage.textContent='STAGE '+Math.min(9,globalStage)+'/9';
    }else{
      stage.textContent='STAGE '+Math.min(3,(active.roomStage||0)+1)+'/3';
    }
    left.appendChild(stage);
  }
  left.append(h,p);
  head.appendChild(left);
  if(active&&active.room<3){
    const meter=document.createElement('div');meter.className='adventure-integrity';meter.dataset.adventureIntegrity='1';
    const label=document.createElement('small');label.textContent='ADVENTURE INTEGRITY';
    const row=document.createElement('div');row.className='adventure-integrity-row';
    const pips=document.createElement('div');pips.className='adventure-integrity-pips';
    for(let i=0;i<active.roomIntegrityMax;i++){const pip=document.createElement('i');pip.className='adventure-integrity-pip';pips.appendChild(pip);}
    const value=document.createElement('strong');value.className='adventure-integrity-value';value.textContent=`${active.roomIntegrity}/${active.roomIntegrityMax}`;
    row.append(pips,value);meter.append(label,row);head.appendChild(meter);
    requestAnimationFrame(paintAdventureIntegrity);
  }
  return head;
}

function overlayHost(){
  return document.getElementById('adventure-overlay-host');
}
function clearOverlay(){
  const host=overlayHost();
  if(host)host.replaceChildren();
  document.body.classList.remove('adventure-modal-open');
}
function showNotice(text,tone='info',ms=1500){
  const host=overlayHost();if(!host)return;
  const current=host.querySelector('.adventure-popup.notice');
  if(current&&current.textContent===text)return;
  const note=document.createElement('div');
  note.className=`adventure-popup notice ${tone}`;
  note.setAttribute('role','status');
  note.textContent=text;
  host.replaceChildren(note);
  later(()=>{if(note.isConnected)note.remove();},ms);
}
function showTransition(title,text,buttonText,next,tone='success'){
  const host=overlayHost();if(!host)return;
  document.body.classList.add('adventure-modal-open');
  const shade=document.createElement('div');shade.className='adventure-popup-shade';
  const card=document.createElement('div');card.className=`adventure-popup transition ${tone}`;card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');
  const icon=document.createElement('div');icon.className='adventure-popup-icon';icon.textContent=tone==='success'?'✓':'!';
  const copy=document.createElement('div');copy.className='adventure-popup-copy';
  const strong=document.createElement('strong');strong.textContent=title;
  const p=document.createElement('span');p.textContent=text;copy.append(strong,p);
  const button=document.createElement('button');button.type='button';button.textContent=buttonText;
  button.addEventListener('click',()=>{clearOverlay();next();});
  card.append(icon,copy,button);shade.appendChild(card);host.replaceChildren(shade);
  requestAnimationFrame(()=>button.focus({preventScroll:true}));
}

function finishRoomStage(stageTitle,stageText,finalTitle,finalText,nextButton,onRoomComplete){
  if(!active)return;
  if(active.roomStage<2){
    const completed=active.roomStage+1;
    showTransition(
      stageTitle||`Stage ${completed}/3 complete`,
      stageText||`Stage ${completed} is stable. The next stage will be harder.`,
      `Start stage ${completed+1}/3 →`,
      ()=>{active.roomStage++;renderRoom();}
    );
    return;
  }
  showTransition(finalTitle,finalText,nextButton,()=>{
    active.roomStage=0;
    onRoomComplete();
  });
}

/* ---------------- Room 1: Data Pulse Run ---------------- */


function expeditionConfig(stage){
  return [
    {
      rows:15,cols:23,pickups:3,relays:2,hazards:1,arcs:2,hazardMs:920,ordered:false,chambers:2,
      area:'POWER INTAKE',module:'POWER COUPLER',pickupNames:['P1','P2','P3'],
      copy:'Explore the power intake, recover three couplers, then energise relays R1 → R2 to unlock the maintenance gate.'
    },
    {
      rows:17,cols:27,pickups:4,relays:2,hazards:2,arcs:3,hazardMs:840,ordered:false,chambers:3,
      area:'DATA BUS',module:'BUS INTERFACE',pickupNames:['A','B','C','D'],
      copy:'Search the wider data bus, recover four boot fragments and energise R1 → R2 while corruption patrols the board.'
    },
    {
      rows:19,cols:31,pickups:5,relays:3,hazards:3,arcs:4,hazardMs:780,ordered:true,chambers:4,
      area:'CPU CORE',module:'CORE LINK',pickupNames:['A','B','C','D','E'],
      copy:'Recover core keys A → B → C → D → E, energise relays R1 → R2 → R3, then reach the CPU repair port.'
    }
  ][stage]||null;
}
function expeditionNeighbours(grid,r,c){
  const out=[];
  for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){
    const rr=r+d[0],cc=c+d[1];
    if(rr>=0&&cc>=0&&rr<grid.length&&cc<grid[0].length&&grid[rr][cc]!==1)out.push([rr,cc]);
  }
  return out;
}
function expeditionDistances(grid,start){
  const dist=Array.from({length:grid.length},()=>Array(grid[0].length).fill(Infinity));
  const q=[start.slice()];dist[start[0]][start[1]]=0;
  for(let i=0;i<q.length;i++){
    const p=q[i];
    for(const n of expeditionNeighbours(grid,p[0],p[1])){
      if(dist[n[0]][n[1]]!==Infinity)continue;
      dist[n[0]][n[1]]=dist[p[0]][p[1]]+1;q.push(n);
    }
  }
  return dist;
}
function carveExpeditionChambers(grid,rng,count){
  const rows=grid.length,cols=grid[0].length,chambers=[],chamberSet=new Set();
  const sizes=[[5,5],[5,7],[7,7],[5,9],[3,7],[3,5]];
  for(let i=0;i<count;i++){
    let placed=false;
    for(let attempt=0;attempt<120&&!placed;attempt++){
      const size=sizes[(i+attempt)%sizes.length],h=Math.min(size[0],rows-4),w=Math.min(size[1],cols-4);
      let r=1+2*Math.floor(rng()*Math.max(1,Math.floor((rows-h-2)/2)+1));
      let c=1+2*Math.floor(rng()*Math.max(1,Math.floor((cols-w-2)/2)+1));
      r=Math.max(1,Math.min(rows-h-1,r));c=Math.max(1,Math.min(cols-w-1,c));
      const rect={r,c,h,w};
      const overlaps=chambers.some(x=>!(r+h+1<x.r||x.r+x.h+1<r||c+w+1<x.c||x.c+x.w+1<c));
      if(overlaps)continue;
      for(let rr=r;rr<r+h;rr++)for(let cc=c;cc<c+w;cc++){
        grid[rr][cc]=0;chamberSet.add(key(rr,cc));
      }
      chambers.push(rect);placed=true;
    }
  }

  // Rare crowded layouts get a smaller fallback chamber with no buffer,
  // so the intended number of distinct open spaces is guaranteed.
  let guard=0;
  while(chambers.length<count&&guard++<400){
    const h=3,w=5;
    let r=1+Math.floor(rng()*Math.max(1,rows-h-1));
    let c=1+Math.floor(rng()*Math.max(1,cols-w-1));
    r=Math.max(1,Math.min(rows-h-1,r));c=Math.max(1,Math.min(cols-w-1,c));
    const overlaps=chambers.some(x=>!(r+h<=x.r||x.r+x.h<=r||c+w<=x.c||x.c+x.w<=c));
    if(overlaps)continue;
    const rect={r,c,h,w};
    for(let rr=r;rr<r+h;rr++)for(let cc=c;cc<c+w;cc++){
      grid[rr][cc]=0;chamberSet.add(key(rr,cc));
    }
    chambers.push(rect);
  }
  return {chambers,chamberSet};
}
function makeExpeditionMaze(rows,cols,seed,stage,chamberCount=2){
  const rng=rngFromSeed(seed+':maze:'+stage);
  const grid=Array.from({length:rows},()=>Array(cols).fill(1));
  const start=[1,1],stack=[start.slice()];grid[1][1]=0;
  const dirs=[[2,0],[-2,0],[0,2],[0,-2]];
  while(stack.length){
    const cur=stack[stack.length-1],opts=[];
    for(const d of shuffled(dirs.map(x=>x.slice()),rng)){
      const nr=cur[0]+d[0],nc=cur[1]+d[1];
      if(nr<=0||nc<=0||nr>=rows-1||nc>=cols-1||grid[nr][nc]===0)continue;
      opts.push([nr,nc,d[0]/2,d[1]/2]);
    }
    if(!opts.length){stack.pop();continue;}
    const pick=opts[Math.floor(rng()*opts.length)];
    grid[cur[0]+pick[2]][cur[1]+pick[3]]=0;
    grid[pick[0]][pick[1]]=0;stack.push([pick[0],pick[1]]);
  }

  const carved=carveExpeditionChambers(grid,rng,chamberCount);

  const loopChance=[.045,.06,.075][stage]||.05;
  for(let r=1;r<rows-1;r++)for(let c=1;c<cols-1;c++)if(grid[r][c]===1&&rng()<loopChance){
    const horizontal=grid[r][c-1]===0&&grid[r][c+1]===0;
    const vertical=grid[r-1][c]===0&&grid[r+1][c]===0;
    if(horizontal!==vertical)grid[r][c]=0;
  }

  const dist=expeditionDistances(grid,start),floors=[];
  for(let r=1;r<rows-1;r++)for(let c=1;c<cols-1;c++)if(grid[r][c]===0)floors.push([r,c]);
  floors.sort((a,b)=>dist[b[0]][b[1]]-dist[a[0]][a[1]]);
  const exit=floors[0].slice();
  const deadEnds=floors.filter(p=>expeditionNeighbours(grid,p[0],p[1]).length===1&&!same(p,start)&&!same(p,exit));
  return {grid,start,exit,dist,floors,deadEnds,rng,chambers:carved.chambers,chamberSet:carved.chamberSet};
}
function chooseExpeditionPickups(maze,count,names){
  const deep=(maze.deadEnds.length>=count?maze.deadEnds:maze.floors)
    .filter(p=>maze.dist[p[0]][p[1]]>=8&&!same(p,maze.exit)&&!same(p,maze.start));
  const fallback=maze.floors
    .filter(p=>!same(p,maze.exit)&&!same(p,maze.start))
    .sort((a,b)=>maze.dist[b[0]][b[1]]-maze.dist[a[0]][a[1]]);
  const candidates=[...deep,...fallback.filter(p=>!deep.some(q=>same(q,p)))];
  const chosen=[];
  for(const p of candidates){
    if(chosen.length>=count)break;
    if(chosen.every(q=>Math.abs(q[0]-p[0])+Math.abs(q[1]-p[1])>=6))chosen.push(p.slice());
  }
  for(const p of candidates){
    if(chosen.length>=count)break;
    if(!chosen.some(q=>same(q,p)))chosen.push(p.slice());
  }
  return chosen.slice(0,count).map((pos,i)=>({pos,name:names[i]}));
}
function chooseExpeditionRelays(maze,count,bannedKeys){
  const candidates=maze.floors
    .filter(p=>maze.dist[p[0]][p[1]]>=10&&!bannedKeys.has(key(...p))&&!same(p,maze.exit))
    .sort((a,b)=>maze.dist[b[0]][b[1]]-maze.dist[a[0]][a[1]]);
  const relays=[];
  for(const p of candidates){
    if(relays.length>=count)break;
    if(relays.every(q=>Math.abs(q.pos[0]-p[0])+Math.abs(q.pos[1]-p[1])>=8)){
      relays.push({pos:p.slice(),name:'R'+(relays.length+1),active:false});
      bannedKeys.add(key(...p));
    }
  }
  for(const p of candidates){
    if(relays.length>=count)break;
    if(!bannedKeys.has(key(...p))){
      relays.push({pos:p.slice(),name:'R'+(relays.length+1),active:false});
      bannedKeys.add(key(...p));
    }
  }
  return relays;
}
function chooseExpeditionHazards(maze,count,bannedKeys){
  const types=['chaser','patrol','sentry'];
  const pool=maze.floors
    .filter(p=>maze.dist[p[0]][p[1]]>=12)
    .sort((a,b)=>maze.dist[b[0]][b[1]]-maze.dist[a[0]][a[1]]);
  const chosen=[];
  for(let i=0;i<count;i++){
    let type=types[i%types.length];
    let candidates=pool.filter(p=>!bannedKeys.has(key(...p)));
    if(type==='sentry'){
      // A sentry must have room to play around it: chamber or junction only.
      // If the generated maze has no fair position, use a patrol instead of
      // dropping an unavoidable sentry into a one-cell corridor.
      const tactical=candidates.filter(p=>
        maze.chamberSet.has(key(...p))||
        expeditionNeighbours(maze.grid,p[0],p[1]).length>=3
      );
      if(tactical.length)candidates=tactical;
      else type='patrol';
    }
    const pos=candidates[0];
    if(!pos)break;
    chosen.push({pos:pos.slice(),spawn:pos.slice(),stunUntil:0,lockSince:0,id:chosen.length,type,dir:[0,1]});
    bannedKeys.add(key(...pos));
  }
  return chosen;
}
function chooseExpeditionArcs(maze,count,bannedKeys){
  const candidates=shuffled(maze.floors.filter(p=>{
    const k=key(...p);
    return maze.dist[p[0]][p[1]]>=7&&!bannedKeys.has(k)&&!maze.chamberSet.has(k);
  }),maze.rng);
  const arcs=[];
  for(const p of candidates){
    if(arcs.length>=count)break;
    const k=key(...p);
    if(bannedKeys.has(k))continue;
    arcs.push({pos:p.slice(),phase:Math.floor(maze.rng()*3),period:1400+Math.floor(maze.rng()*500)});
    bannedKeys.add(k);
  }
  return arcs;
}
function expeditionVisibleCells(grid,player,visited){
  for(let dr=-4;dr<=4;dr++)for(let dc=-4;dc<=4;dc++){
    if(Math.abs(dr)+Math.abs(dc)>6)continue;
    const r=player[0]+dr,c=player[1]+dc;
    if(r>=0&&c>=0&&r<grid.length&&c<grid[0].length)visited.add(key(r,c));
  }
}
function expeditionLineClear(grid,a,b){
  if(a[0]!==b[0]&&a[1]!==b[1])return false;
  const dr=Math.sign(b[0]-a[0]),dc=Math.sign(b[1]-a[1]);
  let r=a[0]+dr,c=a[1]+dc;
  while(r!==b[0]||c!==b[1]){
    if(grid[r][c]===1)return false;
    r+=dr;c+=dc;
  }
  return true;
}

function expeditionGuideEntries(){
  return [
    {cell:'trace player',inner:'expedition-player',symbol:'●',title:'BIT',copy:'Your repair probe. Move through open circuit paths.'},
    {cell:'trace pickup',inner:'expedition-pickup',symbol:'A',title:'Module / core key',copy:'Walk onto it to recover it. In the CPU Core, collect A → B → C → D → E in order.'},
    {cell:'trace relay',inner:'expedition-relay',symbol:'R1',title:'Relay',copy:'After every module is recovered, stand on R1, R2… in order and use PULSE.'},
    {cell:'trace exit',inner:'expedition-exit',symbol:'LOCK',title:'Maintenance gate',copy:'It changes to OPEN only after the modules and relay chain are complete.'},
    {cell:'trace hazard enemy-chaser',inner:'expedition-hazard',symbol:'◆',title:'Chaser',copy:'Actively moves towards BIT. A nearby PULSE stuns it temporarily.'},
    {cell:'trace hazard enemy-patrol',inner:'expedition-hazard',symbol:'▲',title:'Patrol',copy:'Roams the corridors. Watch its movement and PULSE when it gets too close.'},
    {cell:'trace hazard enemy-sentry',inner:'expedition-hazard',symbol:'⊕',title:'Sentry',copy:'Locks onto BIT along a clear row or column, then fires after a warning. Break line of sight or PULSE to jam it.'},
    {cell:'trace arc-active',inner:'expedition-arc',symbol:'≈',title:'Live power arc',copy:'Cycles between live and quiet. Cross when it dims; touching it live causes a fault.'}
  ];
}
function buildExpeditionGuideGrid(){
  const grid=document.createElement('div');grid.className='expedition-guide-grid';
  for(const item of expeditionGuideEntries()){
    const row=document.createElement('div');row.className='expedition-guide-item';
    const cell=document.createElement('div');cell.className='expedition-guide-icon expedition-cell '+item.cell;
    const symbol=document.createElement('span');symbol.className=item.inner;symbol.textContent=item.symbol;cell.appendChild(symbol);
    const copy=document.createElement('div');copy.className='expedition-guide-copy';
    const title=document.createElement('strong');title.textContent=item.title;
    const text=document.createElement('span');text.textContent=item.copy;
    copy.append(title,text);row.append(cell,copy);grid.appendChild(row);
  }
  return grid;
}
function showExpeditionGuide(onClose){
  const host=overlayHost();if(!host)return;
  document.body.classList.add('adventure-modal-open');
  const shade=document.createElement('div');shade.className='adventure-popup-shade expedition-guide-shade';
  const card=document.createElement('div');card.className='adventure-popup expedition-guide-popup';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label','Expedition field guide');
  const head=document.createElement('div');head.className='expedition-guide-head';
  const copy=document.createElement('div');
  const eyebrow=document.createElement('small');eyebrow.textContent='MICRO:BIT EXPEDITION';
  const title=document.createElement('strong');title.textContent='Field guide';
  const sub=document.createElement('span');sub.textContent='These are the exact symbols and colours used on the board.';
  copy.append(eyebrow,title,sub);
  const close=document.createElement('button');close.type='button';close.className='secondary expedition-guide-close';close.textContent='CLOSE';
  head.append(copy,close);
  const controls=document.createElement('div');controls.className='expedition-guide-controls';
  controls.innerHTML='<span><kbd>↑ ↓ ← →</kbd> or <kbd>W A S D</kbd> move</span><span><kbd>SPACE</kbd> PULSE / activate</span><span><strong>×</strong> means an enemy is stunned</span>';
  card.append(head,controls,buildExpeditionGuideGrid());shade.appendChild(card);host.replaceChildren(shade);
  const finish=()=>{clearOverlay();if(typeof onClose==='function')onClose();};
  close.addEventListener('click',finish);
  card.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();finish();}});
  requestAnimationFrame(()=>close.focus({preventScroll:true}));
}
function levelOneJourneyStages(){
  return [
    {region:'INTERNAL TRACES',short:'PWR',name:'POWER INTAKE',sub:'Coupler bay'},
    {region:'INTERNAL TRACES',short:'BUS',name:'DATA BUS',sub:'Routing lanes'},
    {region:'INTERNAL TRACES',short:'CPU',name:'CPU CORE',sub:'Processing chamber'},
    {region:'STARTUP CONTROLLER',short:'B1',name:'BOOT SEQUENCER I',sub:'Three-step startup'},
    {region:'STARTUP CONTROLLER',short:'B2',name:'BOOT SEQUENCER II',sub:'Hardware check'},
    {region:'STARTUP CONTROLLER',short:'B3',name:'BOOT SEQUENCER III',sub:'Full initialise chain'},
    {region:'MEMORY BANK',short:'M1',name:'ADDRESS GRID',sub:'Guided RAM repair'},
    {region:'MEMORY BANK',short:'M2',name:'FRAGMENTED RAM',sub:'Reduced clues'},
    {region:'MEMORY BANK',short:'M3',name:'CORE RESTORE',sub:'Final memory bank'}
  ];
}
function expeditionRouteCopy(stageIndex,phase){
  if(phase==='start')return {
    kicker:'LEVEL 1 · NINE-STAGE EXPEDITION',
    title:'BIT enters the micro:bit',
    copy:'Nine repair stages lie ahead: three internal-trace areas, three Startup Controller stages and three Memory Bank stages.',
    button:'Enter Power Intake →'
  };
  const next=stageIndex+1;
  const messages=[
    ['Power Intake stable','Power is flowing again. BIT can follow the internal traces deeper into the Data Bus.','Travel to Data Bus →'],
    ['Data Bus stable','The bus interface is restored. Next is the CPU Core, where ordered keys and sentry defence are introduced.','Descend to CPU Core →'],
    ['CPU Core stable','The internal traces are stable. BIT can now enter the Startup Controller and rebuild the boot sequence.','Enter Startup Controller →'],
    ['Boot Sequencer I stable','The three-step startup path works. The controller now adds a hardware-check stage.','Continue to Boot Sequencer II →'],
    ['Boot Sequencer II stable','The hardware-check path is stable. One final, longer startup chain remains.','Continue to Boot Sequencer III →'],
    ['Startup Controller stable','All three startup stages are restored. BIT can now cross into the Memory Bank.','Open Memory Bank →'],
    ['Address Grid stable','The first RAM bank is repaired. The next bank has fewer fixed bits and a more fragmented layout.','Continue to Fragmented RAM →'],
    ['Fragmented RAM stable','The second bank passes its checksum. One final core-memory repair remains.','Continue to Core Restore →'],
    ['Level 1 repair complete','All nine repair stages are stable. The micro:bit is ready for the final diagnostic boot check.','Proceed to Final Diagnostic →']
  ];
  const m=messages[Math.max(0,Math.min(messages.length-1,stageIndex))];
  return {
    kicker:stageIndex===8?'NINE STAGES COMPLETE':'STAGE '+(stageIndex+1)+'/9 COMPLETE',
    title:m[0],
    copy:m[1],
    button:m[2],
    next
  };
}
function renderExpeditionRoute(stageIndex,phase,onContinue){
  const root=active?.root;if(!root){onContinue?.();return;}
  const screen=document.getElementById('screen-adventure');
  const stages=levelOneJourneyStages();
  const completedThrough=phase==='complete'?stageIndex:stageIndex-1;
  const current=phase==='complete'?Math.min(stageIndex+1,stages.length):stageIndex;
  const meta=expeditionRouteCopy(stageIndex,phase);
  screen?.classList.add('expedition-map-mode');
  setProgress('BOOT SEQUENCE · LEVEL 1 JOURNEY MAP · '+Math.max(0,completedThrough+1)+'/9 STAGES');
  root.replaceChildren();

  const panel=document.createElement('section');panel.className='expedition-route-screen level-one-route-screen';
  const intro=document.createElement('div');intro.className='expedition-route-intro';
  const kicker=document.createElement('small');kicker.textContent=meta.kicker;
  const title=document.createElement('h2');title.textContent=meta.title;
  const copy=document.createElement('p');copy.textContent=meta.copy;
  intro.append(kicker,title,copy);

  const map=document.createElement('div');map.className='level-one-journey-map';
  const regionNames=['INTERNAL TRACES','STARTUP CONTROLLER','MEMORY BANK'];
  regionNames.forEach((regionName,regionIndex)=>{
    const region=document.createElement('section');region.className='level-one-route-region region-'+(regionIndex+1);
    const head=document.createElement('div');head.className='level-one-route-region-head';
    const regionNo=document.createElement('small');regionNo.textContent='ZONE '+(regionIndex+1);
    const regionTitle=document.createElement('strong');regionTitle.textContent=regionName;
    head.append(regionNo,regionTitle);
    const rail=document.createElement('div');rail.className='level-one-route-rail';
    stages.slice(regionIndex*3,regionIndex*3+3).forEach((stage,localIndex)=>{
      const i=regionIndex*3+localIndex;
      const stop=document.createElement('div');
      stop.className='level-one-mini-stop '+(i<=completedThrough?'complete':i===current?'current':'locked');
      const marker=document.createElement('b');marker.textContent=i<=completedThrough?'✓':i===current?'BIT':stage.short;
      const label=document.createElement('span');
      const name=document.createElement('strong');name.textContent=(i+1)+'. '+stage.name;
      const sub=document.createElement('small');sub.textContent=stage.sub;
      label.append(name,sub);stop.append(marker,label);rail.appendChild(stop);
      if(localIndex<2){
        const link=document.createElement('i');link.className='level-one-mini-link '+(i<completedThrough?'complete':'');
        rail.appendChild(link);
      }
    });
    region.append(head,rail);map.appendChild(region);
  });

  const final=document.createElement('div');
  final.className='level-one-final-node '+(current===stages.length?'current':completedThrough>=stages.length-1?'ready':'locked');
  final.innerHTML='<b>'+(current===stages.length?'BOOT':completedThrough>=8?'✓':'BOOT')+'</b><span><strong>FINAL DIAGNOSTIC</strong><small>12-question boot check</small></span>';
  map.appendChild(final);

  const key=document.createElement('div');key.className='expedition-route-key';
  key.innerHTML='<span><i class="done"></i> cleared</span><span><i class="here"></i> BIT location</span><span><i class="locked"></i> locked route</span><span><strong>'+(Math.max(0,completedThrough+1))+'/9</strong> stages repaired</span>';

  const action=document.createElement('button');action.type='button';action.className='expedition-route-action';action.textContent=meta.button;
  action.addEventListener('click',()=>{
    screen?.classList.remove('expedition-map-mode');
    onContinue?.();
  });

  panel.append(intro,map,key,action);root.appendChild(panel);
  requestAnimationFrame(()=>action.focus({preventScroll:true}));
}
function renderPulseRun(){
  const stageIndex=active.roomStage||0,areaNo=stageIndex+1,cfg=expeditionConfig(stageIndex);
  active.expeditionModules=active.expeditionModules||new Set();
  if(stageIndex===0&&!active.expeditionMapSeen){
    active.expeditionMapSeen=true;
    renderExpeditionRoute(0,'start',()=>renderRoom());
    return;
  }
  setProgress('BOOT SEQUENCE · LEVEL 1 · STAGE '+areaNo+'/9 · '+cfg.area);
  const root=active.root;
  root.appendChild(roomHeader(
    'LEVEL 1 · STAGE '+areaNo+'/9 · MICRO:BIT EXPEDITION',
    'Explore the '+cfg.area.toLowerCase(),
    cfg.copy
  ));

  const info=document.createElement('div');info.className='adventure-info-strip expedition-info-strip';
  info.innerHTML='<span><strong>DESKTOP</strong> arrows / WASD move · <kbd>SPACE</kbd> PULSE</span><span><strong>MISSION</strong> modules → relays → OPEN gate</span>'+
    (cfg.ordered?'<span><strong>CPU CORE</strong> collect A → B → C → D → E in order</span>':'');
  const infoGuide=document.createElement('button');infoGuide.type='button';infoGuide.className='secondary expedition-info-guide';infoGuide.textContent='FIELD GUIDE';
  info.appendChild(infoGuide);root.appendChild(info);

  const maze=makeExpeditionMaze(cfg.rows,cfg.cols,active.seed,stageIndex,cfg.chambers);
  const pickups=chooseExpeditionPickups(maze,cfg.pickups,cfg.pickupNames);
  const banned=new Set([key(...maze.start),key(...maze.exit),...pickups.map(x=>key(...x.pos))]);
  const relays=chooseExpeditionRelays(maze,cfg.relays,banned);
  const hazards=chooseExpeditionHazards(maze,cfg.hazards,banned);
  const arcs=chooseExpeditionArcs(maze,cfg.arcs,banned);
  const collected=new Set(),visited=new Set();
  let player=maze.start.slice(),live=false,finished=false,faultLock=false,pulseReadyAt=0,relayIndex=0;
  expeditionVisibleCells(maze.grid,player,visited);

  const shell=document.createElement('div');shell.className='expedition-shell expedition-neon';
  const hud=document.createElement('div');hud.className='expedition-hud';
  const objective=document.createElement('strong');
  const areaStatus=document.createElement('span');
  const moduleStatus=document.createElement('span');
  hud.append(objective,areaStatus,moduleStatus);

  const board=document.createElement('div');board.className='expedition-grid';
  board.style.setProperty('--exp-cols',String(cfg.cols));
  board.style.setProperty('--exp-rows',String(cfg.rows));
  board.style.aspectRatio=cfg.cols+'/'+cfg.rows;
  board.setAttribute('role','application');
  board.setAttribute('aria-label','Microbit interior exploration area '+areaNo);
  const cells=[];
  for(let r=0;r<cfg.rows;r++)for(let c=0;c<cfg.cols;c++){
    const cell=document.createElement('div');cell.className='expedition-cell';cell.dataset.key=key(r,c);
    board.appendChild(cell);cells.push(cell);
  }

  const displayActions=document.createElement('div');displayActions.className='expedition-display-actions';
  const guideButton=document.createElement('button');guideButton.type='button';guideButton.className='expedition-guide-toggle';guideButton.textContent='GUIDE';
  const immersiveButton=document.createElement('button');immersiveButton.type='button';immersiveButton.className='expedition-immersive-toggle';
  immersiveButton.textContent='FULL SCREEN';immersiveButton.setAttribute('aria-pressed','false');
  displayActions.append(guideButton,immersiveButton);

  const controls=document.createElement('div');controls.className='expedition-controls';
  const defs=[['↑','up',-1,0],['←','left',0,-1],['PULSE','pulse',0,0],['→','right',0,1],['↓','down',1,0]];
  for(const d of defs){
    const b=document.createElement('button');b.type='button';b.className='expedition-'+d[1];b.textContent=d[0];
    if(d[1]==='pulse')b.addEventListener('click',()=>usePulse(b));
    else b.addEventListener('click',()=>movePlayer(d[2],d[3],b));
    controls.appendChild(b);
  }

  const joystick=document.createElement('div');joystick.className='expedition-joystick';
  joystick.setAttribute('role','application');joystick.setAttribute('aria-label','Movement joystick. Put your thumb down, drag in a direction, and hold to keep moving.');
  const joystickBase=document.createElement('div');joystickBase.className='expedition-joystick-base';
  const joystickKnob=document.createElement('div');joystickKnob.className='expedition-joystick-knob';
  const joystickLabel=document.createElement('span');joystickLabel.className='expedition-joystick-label';joystickLabel.textContent='MOVE';
  joystickBase.append(joystickKnob,joystickLabel);joystick.appendChild(joystickBase);
  controls.appendChild(joystick);

  const pulseButton=controls.querySelector('.expedition-pulse');
  const mission=document.createElement('div');mission.className='expedition-mission';
  const rotateNotice=document.createElement('div');rotateNotice.className='expedition-rotate-notice';
  rotateNotice.innerHTML='<div class="expedition-rotate-phone" aria-hidden="true">▯↻</div><strong>Rotate your phone</strong><span>System Rescue is designed for landscape play on mobile.</span>';
  shell.append(hud,displayActions,board,mission,controls,rotateNotice);root.appendChild(shell);

  let joystickPointer=null,joystickOrigin=null,joystickRepeat=null,joystickRepeatDelay=null,joystickDir=null;
  function clearJoystickRepeat(){
    if(joystickRepeatDelay){clearTimeout(joystickRepeatDelay);joystickRepeatDelay=null;}
    if(joystickRepeat){clearInterval(joystickRepeat);joystickRepeat=null;}
  }
  function stopJoystick(){
    clearJoystickRepeat();
    joystickPointer=null;joystickOrigin=null;joystickDir=null;
    joystickKnob.style.transform='translate3d(0,0,0)';
    joystick.classList.remove('active');
  }
  function startJoystickRepeat(next){
    clearJoystickRepeat();
    // One deliberate push gives one step. Holding then becomes smooth travel.
    joystickRepeatDelay=setTimeout(()=>{
      joystickRepeatDelay=null;
      if(!joystickDir)return;
      joystickRepeat=setInterval(()=>{
        if(joystickDir)movePlayer(next[0],next[1],null);
      },175);
    },225);
  }
  function joystickVector(e){
    if(!joystickOrigin)return {dx:0,dy:0,limit:1};
    const rect=joystickBase.getBoundingClientRect();
    const limit=Math.min(rect.width,rect.height)*.31;
    let dx=e.clientX-joystickOrigin.x,dy=e.clientY-joystickOrigin.y;
    const mag=Math.hypot(dx,dy)||1;
    if(mag>limit){dx=dx/mag*limit;dy=dy/mag*limit;}
    return {dx,dy,limit};
  }
  function driveJoystick(e){
    const {dx,dy,limit}=joystickVector(e);
    joystickKnob.style.transform='translate3d('+dx+'px,'+dy+'px,0)';

    // Relative control: where the thumb first lands is neutral. This prevents
    // an off-centre touch from immediately sending BIT in the wrong direction.
    const dead=limit*.28;
    if(Math.hypot(dx,dy)<dead){
      joystickDir=null;
      clearJoystickRepeat();
      return;
    }

    const angle=Math.atan2(dy,dx);
    let next;
    if(angle>=-Math.PI/4&&angle<Math.PI/4)next=[0,1];
    else if(angle>=Math.PI/4&&angle<3*Math.PI/4)next=[1,0];
    else if(angle>=-3*Math.PI/4&&angle<-Math.PI/4)next=[-1,0];
    else next=[0,-1];

    const code=next[0]+':'+next[1];
    if(code!==joystickDir){
      joystickDir=code;
      movePlayer(next[0],next[1],null);
      startJoystickRepeat(next);
    }
  }
  joystickBase.addEventListener('pointerdown',e=>{
    e.preventDefault();
    joystickPointer=e.pointerId;
    joystickOrigin={x:e.clientX,y:e.clientY};
    joystick.classList.add('active');
    try{joystickBase.setPointerCapture(e.pointerId);}catch(_){}
  });
  joystickBase.addEventListener('pointermove',e=>{
    if(joystickPointer!==e.pointerId)return;
    e.preventDefault();
    driveJoystick(e);
  });
  joystickBase.addEventListener('pointerup',e=>{if(joystickPointer===e.pointerId)stopJoystick();});
  joystickBase.addEventListener('pointercancel',stopJoystick);
  joystickBase.addEventListener('lostpointercapture',stopJoystick);

  function mobileExpeditionMode(){
    return window.matchMedia('(max-width:950px) and (pointer:coarse)').matches;
  }
  const viewportHost=document.getElementById('screen-adventure');
  async function setImmersive(entering,{native=true,landscape=true}={}){
    shell.classList.toggle('expedition-immersive',entering);
    document.body.classList.toggle('expedition-immersive-open',entering);
    viewportHost?.classList.toggle('expedition-fullscreen-host',entering);
    immersiveButton.textContent=entering?'EXIT':'FULL SCREEN';
    immersiveButton.setAttribute('aria-pressed',entering?'true':'false');

    if(entering){
      if(native){
        try{
          if(viewportHost?.requestFullscreen&&!document.fullscreenElement){
            await viewportHost.requestFullscreen({navigationUI:'hide'});
            shell.classList.add('expedition-native-fullscreen');
          }
        }catch(_){}
      }
      if(landscape){
        try{
          if(screen.orientation&&screen.orientation.lock)await screen.orientation.lock('landscape');
        }catch(_){}
      }
    }else{
      shell.classList.remove('expedition-native-fullscreen');
      document.body.classList.remove('expedition-immersive-open');
      viewportHost?.classList.remove('expedition-fullscreen-host');
      try{if(screen.orientation&&screen.orientation.unlock)screen.orientation.unlock();}catch(_){}
      try{
        if((document.fullscreenElement===viewportHost||document.fullscreenElement===shell)&&document.exitFullscreen){
          await document.exitFullscreen();
        }
      }catch(_){}
    }
  }
  async function toggleImmersive(){
    await setImmersive(!shell.classList.contains('expedition-immersive'));
  }
  immersiveButton.addEventListener('click',toggleImmersive);
  document.addEventListener('fullscreenchange',()=>{
    if(!document.fullscreenElement&&shell.classList.contains('expedition-native-fullscreen')){
      // Keep the CSS viewport mode active if native fullscreen disappears.
      // This is the reliable fallback on mobile Safari.
      shell.classList.remove('expedition-native-fullscreen');
    }
  });
  function openFieldGuide(){
    const resume=live&&!finished;
    live=false;stopJoystick();
    showExpeditionGuide(()=>{if(resume&&!finished)live=true;});
  }
  guideButton.addEventListener('click',openFieldGuide);
  infoGuide.addEventListener('click',openFieldGuide);

  function pickupAt(k){return pickups.find(x=>key(...x.pos)===k&&!collected.has(x.name));}
  function relayAt(k){return relays.find(x=>key(...x.pos)===k);}
  function hazardAt(k){return hazards.find(h=>key(...h.pos)===k&&Date.now()>=h.stunUntil);}
  function arcAt(k){return arcs.find(a=>key(...a.pos)===k);}
  function arcActive(arc,now=Date.now()){return Math.floor(now/arc.period+arc.phase)%2===0;}
  function pickupNext(){return cfg.ordered?cfg.pickupNames[collected.size]:null;}
  function relayNext(){return relays[relayIndex]||null;}
  function objectivesReady(){return collected.size===cfg.pickups;}
  function exitReady(){return objectivesReady()&&relayIndex===relays.length;}

  function paint(){
    expeditionVisibleCells(maze.grid,player,visited);
    const now=Date.now();
    const sentryBeamKeys=new Set();
    for(const h of hazards){
      if(h.type!=='sentry'||now<h.stunUntil||!h.lockSince||!sentryThreat(h))continue;
      const dr=Math.sign(player[0]-h.pos[0]),dc=Math.sign(player[1]-h.pos[1]);
      let r=h.pos[0],c=h.pos[1];
      while(true){
        sentryBeamKeys.add(key(r,c));
        if(r===player[0]&&c===player[1])break;
        r+=dr;c+=dc;
      }
    }
    for(const cell of cells){
      const parts=cell.dataset.key.split(':').map(Number),r=parts[0],c=parts[1],k=cell.dataset.key;
      const known=visited.has(k),wall=maze.grid[r][c]===1;
      const pickup=pickupAt(k),relay=relayAt(k),hazard=hazards.find(h=>key(...h.pos)===k),arc=arcAt(k);
      cell.className='expedition-cell';
      if(wall)cell.classList.add('wall');
      else {
        cell.classList.add('trace');
        if(maze.chamberSet.has(k))cell.classList.add('chamber');
      }
      if(!known)cell.classList.add('fog');
      if(known&&sentryBeamKeys.has(k))cell.classList.add('sentry-beam');
      if(same([r,c],maze.start))cell.classList.add('entry');
      if(same([r,c],maze.exit))cell.classList.add('exit');
      if(same([r,c],player))cell.classList.add('player');
      if(pickup&&known)cell.classList.add('pickup');
      if(relay&&known)cell.classList.add(relay.active?'relay-active':'relay');
      if(arc&&known)cell.classList.add(arcActive(arc,now)?'arc-active':'arc-idle');
      if(hazard&&known){
        cell.classList.add(now<hazard.stunUntil?'hazard-stunned':'hazard','enemy-'+hazard.type);
        if(hazard.type==='sentry'&&now>=hazard.stunUntil&&hazard.lockSince)cell.classList.add('sentry-aiming');
      }
      cell.replaceChildren();
      if(!known)continue;

      if(same([r,c],player)){
        const s=document.createElement('span');s.className='expedition-player';s.textContent='●';cell.appendChild(s);
      }else if(hazard){
        const s=document.createElement('span');s.className='expedition-hazard';
        s.textContent=now<hazard.stunUntil?'×':hazard.type==='chaser'?'◆':hazard.type==='patrol'?'▲':'⊕';
        cell.appendChild(s);
      }else if(pickup){
        const s=document.createElement('span');s.className='expedition-pickup';s.textContent=pickup.name;cell.appendChild(s);
      }else if(relay){
        const s=document.createElement('span');s.className='expedition-relay';s.textContent=relay.active?'✓':relay.name;cell.appendChild(s);
      }else if(arc){
        const s=document.createElement('span');s.className='expedition-arc';s.textContent=arcActive(arc,now)?'≈':'·';cell.appendChild(s);
      }else if(same([r,c],maze.exit)){
        const s=document.createElement('span');s.className='expedition-exit';s.textContent=exitReady()?'OPEN':'LOCK';cell.appendChild(s);
      }else if(same([r,c],maze.start)){
        const s=document.createElement('span');s.className='expedition-entry';s.textContent='USB';cell.appendChild(s);
      }
    }

    const next=pickupNext(),nextRelay=relayNext();
    objective.textContent=cfg.ordered
      ?'CORE KEYS '+collected.size+'/'+cfg.pickups+(next?' · NEXT '+next:'')
      :'MODULES '+collected.size+'/'+cfg.pickups;
    areaStatus.textContent=cfg.area+' · '+cfg.rows+'×'+cfg.cols;
    moduleStatus.textContent='RELAYS '+relayIndex+'/'+relays.length;

    if(!objectivesReady()){
      mission.textContent=cfg.ordered
        ?'Explore the board and recover '+next+' next. Wrong-order keys remain locked.'
        :'Explore the board and recover every glowing module.';
    }else if(nextRelay){
      mission.textContent='Modules recovered. Find '+nextRelay.name+' and press PULSE while standing on it.';
    }else{
      mission.textContent='Relay chain stable. Reach the OPEN maintenance gate.';
    }

    const remain=Math.max(0,pulseReadyAt-now);
    pulseButton.disabled=remain>0;
    pulseButton.textContent=remain>0?'PULSE '+Math.ceil(remain/1000)+'s':'PULSE';

    const ledCells=[
      led()?.mapPoint(player[0],player[1],cfg.rows,cfg.cols),
      ...hazards.filter(h=>now>=h.stunUntil).map(h=>led()?.mapPoint(h.pos[0],h.pos[1],cfg.rows,cfg.cols)),
      ...relays.filter(r=>r.active).map(r=>led()?.mapPoint(r.pos[0],r.pos[1],cfg.rows,cfg.cols))
    ].filter(Boolean);
    led()?.setCells(ledCells);
  }

  function resetAfterHit(reason='Corruption hit BIT.'){
    player=maze.start.slice();
    hazards.forEach(h=>{h.pos=h.spawn.slice();h.stunUntil=Date.now()+1100;h.lockSince=0;});
    expeditionVisibleCells(maze.grid,player,visited);paint();
    showNotice(reason+' Returning to the area entry — recovered modules and relays are safe.','fault',1500);
  }
  function collide(reason){
    if(faultLock||finished)return;
    faultLock=true;active.arcadeFaults++;
    const depleted=applyAdventurePenalty();active.playTone(140,.1,'sawtooth',.03);led()?.flash('x',360);
    if(depleted)return;
    resetAfterHit(reason||'Corruption hit BIT.');
    later(()=>{faultLock=false;},900);
  }
  function collectHere(){
    const k=key(...player),p=pickupAt(k);
    if(!p)return;
    const expected=pickupNext();
    if(cfg.ordered&&p.name!==expected){
      showNotice('Core key '+p.name+' is locked. Find '+expected+' first.','warn',950);return;
    }
    collected.add(p.name);active.bits.add('EXP'+areaNo+'-'+p.name);active.playTone(720,.06,'sine',.03);
    showNotice('Recovered '+p.name+' · '+collected.size+'/'+cfg.pickups,'success',800);
  }
  function activateRelay(){
    const relay=relayAt(key(...player));
    if(!relay)return false;
    if(!objectivesReady()){
      showNotice('Relay chain is locked until every module is recovered.','warn',900);return true;
    }
    const expected=relayNext();
    if(!expected){
      showNotice('Relay chain already stable. Head for the exit.','info',850);return true;
    }
    if(relay!==expected){
      showNotice(relay.name+' is not next. Energise '+expected.name+' first.','warn',1000);return true;
    }
    relay.active=true;relayIndex++;active.playTone(880,.09,'sine',.035);led()?.flash('check',220);
    showNotice(relay.name+' energised · '+relayIndex+'/'+relays.length,'success',900);
    return true;
  }
  function checkExit(){
    if(!same(player,maze.exit))return;
    if(!exitReady()){
      if(!objectivesReady())showNotice('Maintenance gate locked. Recover every module first.','warn',1050);
      else showNotice('Maintenance gate locked. Complete the relay chain first.','warn',1050);
      return;
    }
    finished=true;live=false;clearTimers();active.expeditionModules.add(stageIndex);led()?.setPattern('check');paint();
    if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,1);
    renderExpeditionRoute(stageIndex,'complete',()=>{
      if(stageIndex<2){
        active.roomStage++;
        renderRoom();
      }else{
        active.roomStage=0;
        active.room=1;
        renderRoom();
      }
    });
  }
  function movePlayer(dr,dc,button){
    if(!live||finished||faultLock)return;
    const next=[player[0]+dr,player[1]+dc];
    if(next[0]<0||next[1]<0||next[0]>=cfg.rows||next[1]>=cfg.cols||maze.grid[next[0]][next[1]]===1){
      active.playTone(170,.025,'square',.012);return;
    }
    if(button){button.classList.add('pressed');later(()=>button.classList.remove('pressed'),90);}
    player=next;collectHere();
    const arc=arcAt(key(...player));
    if(arc&&arcActive(arc)){collide('A live power arc hit BIT.');return;}
    if(hazardAt(key(...player))){collide('Corruption intercepted BIT.');return;}
    checkExit();paint();
  }
  function usePulse(button){
    if(!live||finished||faultLock)return;
    if(activateRelay()){paint();return;}
    const now=Date.now();
    if(now<pulseReadyAt)return;
    pulseReadyAt=now+4200;
    let hit=0;
    const pulseDist=expeditionDistances(maze.grid,player);
    for(const h of hazards){
      const d=pulseDist[h.pos[0]][h.pos[1]];
      // A sentry can lock on from farther away than moving corruption, so a
      // PULSE may jam a threatening sentry anywhere inside its firing range.
      const range=h.type==='sentry'?7:3;
      if(d<=range){
        h.stunUntil=now+(h.type==='sentry'?5200:2900);
        h.lockSince=0;
        hit++;
      }
    }
    active.playTone(hit?620:300,.07,'sine',.025);
    showNotice(hit?'Repair pulse stunned '+hit+' corruption signal'+(hit===1?'':'s')+'.':'No corruption within pulse range.','info',800);
    button.classList.add('pressed');later(()=>button.classList.remove('pressed'),100);paint();
  }
  function patrolStep(h){
    const neighbours=expeditionNeighbours(maze.grid,h.pos[0],h.pos[1]).filter(p=>!same(p,maze.exit));
    if(!neighbours.length)return;
    const forward=[h.pos[0]+h.dir[0],h.pos[1]+h.dir[1]];
    const forwardOpen=neighbours.find(p=>same(p,forward));
    if(forwardOpen&&maze.rng()>.18){h.pos=forwardOpen.slice();return;}
    const pick=neighbours[Math.floor(maze.rng()*neighbours.length)];
    h.dir=[pick[0]-h.pos[0],pick[1]-h.pos[1]];h.pos=pick.slice();
  }
  function sentryThreat(h){
    const dr=Math.abs(h.pos[0]-player[0]),dc=Math.abs(h.pos[1]-player[1]);
    if(dr&&dc)return false;
    if(dr+dc>7)return false;
    return expeditionLineClear(maze.grid,h.pos,player);
  }
  function hazardTick(){
    if(!live||finished||faultLock)return;
    const now=Date.now(),dist=expeditionDistances(maze.grid,player);
    const standingArc=arcAt(key(...player));
    if(standingArc&&arcActive(standingArc,now)){collide('A power arc surged under BIT.');return;}
    let sentryHit=false;
    for(const h of hazards){
      if(now<h.stunUntil){h.lockSince=0;continue;}
      if(h.type==='sentry'){
        if(sentryThreat(h)){
          if(!h.lockSince){
            h.lockSince=now;
            active.playTone(360,.05,'square',.02);
            showNotice('SENTRY LOCK — break line of sight or PULSE!','warn',900);
          }else if(now-h.lockSince>=1450){
            sentryHit=true;
          }
        }else{
          h.lockSince=0;
        }
        continue;
      }
      if(h.type==='patrol'){patrolStep(h);continue;}
      const opts=expeditionNeighbours(maze.grid,h.pos[0],h.pos[1])
        .filter(p=>!same(p,maze.exit))
        .sort((a,b)=>dist[a[0]][a[1]]-dist[b[0]][b[1]]);
      if(!opts.length)continue;
      const choice=opts.length>1&&maze.rng()<.14?opts[1]:opts[0];
      h.pos=choice.slice();
    }
    if(sentryHit){collide('A sentry beam locked onto BIT.');return;}
    if(hazards.some(h=>now>=h.stunUntil&&h.type!=='sentry'&&same(h.pos,player))){collide('Corruption intercepted BIT.');return;}
    paint();
  }

  active.keyHandler=(e)=>{
    if(active?.systemId!=='1'||active.room!==0||finished)return;
    const map={ArrowUp:[-1,0],w:[-1,0],W:[-1,0],ArrowDown:[1,0],s:[1,0],S:[1,0],ArrowLeft:[0,-1],a:[0,-1],A:[0,-1],ArrowRight:[0,1],d:[0,1],D:[0,1]};
    if(map[e.key]){e.preventDefault();movePlayer(map[e.key][0],map[e.key][1]);return;}
    if(e.key===' '||e.key==='Enter'){e.preventDefault();usePulse(pulseButton);}
  };
  document.addEventListener('keydown',active.keyHandler);

  paint();
  const startButton=document.createElement('button');startButton.type='button';startButton.className='expedition-start';startButton.textContent='Enter '+cfg.area+' →';
  function beginArea(){
    if(live||finished)return;
    if(mobileExpeditionMode()){
      // This runs from the player's tap so browsers that support native
      // fullscreen may grant it. iOS Safari keeps the CSS viewport fallback.
      setImmersive(true,{native:true,landscape:true});
    }
    startButton.remove();
    focusPlayArea(board,()=>{
      live=true;
      hazards.forEach(h=>h.stunUntil=Date.now()+1200);
      every(hazardTick,cfg.hazardMs);
      every(paint,220);
      showNotice('BIT online. Modules first, then relays, then the OPEN gate. SPACE uses PULSE on desktop.','success',1650);
    });
  }
  startButton.addEventListener('click',beginArea);
  shell.insertBefore(startButton,board);
}

/* ---------------- Room 2: simplified boot order ---------------- */




function bootStageConfig(stage){
  return [
    {
      label:'BOOT SEQUENCER I',scene:'POWER PATH',accent:'cyan',
      copy:'Three core operations. Follow the illuminated startup trace from power to program run.',
      mechanic:'ORDER'
    },
    {
      label:'BOOT SEQUENCER II',scene:'CHECK GATE',accent:'amber',
      copy:'A hardware-check node is now inserted into the route. Decide which operation can happen next from what has already completed.',
      mechanic:'DEPENDENCIES'
    },
    {
      label:'BOOT SEQUENCER III',scene:'CONTROL MATRIX',accent:'violet',
      copy:'Five operations cross the full controller. The longer chain combines power, checking, hardware initialisation and program start.',
      mechanic:'FULL CHAIN'
    }
  ][stage]||null;
}
function bootOrderSteps(stage){
  if(stage===0)return [
    {id:'power',label:'Power reaches the micro:bit',short:'POWER'},
    {id:'prepare',label:'Startup code prepares the board',short:'PREPARE'},
    {id:'run',label:'Main program starts running',short:'RUN'}
  ];
  if(stage===1)return [
    {id:'power',label:'Power reaches the micro:bit',short:'POWER'},
    {id:'check',label:'Startup code checks the hardware',short:'CHECK'},
    {id:'load',label:'Your program is prepared to run',short:'LOAD'},
    {id:'run',label:'Main program starts running',short:'RUN'}
  ];
  return [
    {id:'power',label:'Power reaches the micro:bit',short:'POWER'},
    {id:'check',label:'Startup code checks the hardware',short:'CHECK'},
    {id:'io',label:'Inputs, display and other hardware are initialised',short:'INITIALISE'},
    {id:'load',label:'Your program is prepared to run',short:'LOAD'},
    {id:'run',label:'Main program starts running',short:'RUN'}
  ];
}

function renderBootOrder(){
  const stageIndex=active.roomStage||0,stageNo=stageIndex+1;
  const steps=bootOrderSteps(stageIndex),stageCfg=bootStageConfig(stageIndex);
  setProgress('BOOT SEQUENCE · LEVEL 1 · STAGE '+(stageIndex+4)+'/9 · '+stageCfg.label);
  const root=active.root;
  root.appendChild(roomHeader(
    'LEVEL 1 · STAGE '+(stageIndex+4)+'/9 · STARTUP CONTROLLER',
    stageCfg.label,
    stageCfg.copy
  ));

  const note=document.createElement('div');note.className='reality-note';
  note.innerHTML='<strong>Game model</strong><span>Real micro:bit startup involves low-level boot code and hardware initialisation. These stages use a simplified sequence to practise algorithmic order.</span>';
  root.appendChild(note);

  const rng=rngFromSeed(active.seed+':sequence:'+stageNo);
  const cards=shuffled(steps,rng);
  let nextIndex=0;

  const consoleEl=document.createElement('section');consoleEl.className='startup-console startup-stage-'+stageNo+' startup-'+stageCfg.accent;
  const scene=document.createElement('div');scene.className='startup-scene';
  const sceneMeta=document.createElement('div');sceneMeta.className='startup-scene-meta';
  sceneMeta.innerHTML='<small>STAGE '+(stageIndex+4)+'/9 · '+stageCfg.mechanic+'</small><strong>'+stageCfg.scene+'</strong><span>BIT is rebuilding the controller one dependency at a time.</span>';
  const sceneTrack=document.createElement('div');sceneTrack.className='startup-scene-track';
  const sceneNodes=steps.map((s,i)=>{
    const n=document.createElement('div');n.className='startup-scene-node'+(i===0?' current':'');
    n.innerHTML='<b>'+(i+1)+'</b><span>'+s.short+'</span>';
    sceneTrack.appendChild(n);
    if(i<steps.length-1){const wire=document.createElement('i');wire.className='startup-scene-wire';sceneTrack.appendChild(wire);}
    return n;
  });
  scene.append(sceneMeta,sceneTrack);

  const chain=document.createElement('div');chain.className='boot-chain boot-chain-stage-'+stageNo;
  chain.style.setProperty('--boot-count',String(steps.length));
  const slots=steps.map((s,i)=>{
    const slot=document.createElement('div');slot.className='boot-slot';
    slot.innerHTML='<small>'+(i+1)+'</small><span>?</span>';
    chain.appendChild(slot);return slot;
  });
  const choices=document.createElement('div');choices.className='boot-choices';
  const status=document.createElement('div');status.className='logic-status';status.textContent='Choose operation 1 of '+steps.length+'.';
  led()?.progress(0,steps.length);

  for(const step of cards){
    const b=document.createElement('button');b.type='button';b.className='boot-choice';b.dataset.step=step.id;
    b.innerHTML='<strong>'+step.short+'</strong><span>'+step.label+'</span>';
    b.addEventListener('click',()=>{
      if(nextIndex>=steps.length)return;
      const expected=steps[nextIndex];
      if(step.id!==expected.id){
        active.sequenceFaults++;b.classList.remove('wrong');void b.offsetWidth;b.classList.add('wrong');
        const depleted=applyAdventurePenalty();
        status.textContent='Choose the next startup operation.';
        active.playTone(165,.08,'square',.025);led()?.flash('x',340);
        if(depleted)return;
        showNotice(step.short+' does not fit in position '+(nextIndex+1)+'. What must already have happened?','fault',1400);
        return;
      }
      b.disabled=true;b.classList.add('used');
      slots[nextIndex].classList.add('filled');slots[nextIndex].querySelector('span').textContent=step.short;
      nextIndex++;
      sceneNodes.forEach((n,i)=>{n.classList.toggle('complete',i<nextIndex);n.classList.toggle('current',i===nextIndex);});
      active.playTone(580+nextIndex*65,.05,'sine',.025);led()?.progress(nextIndex,steps.length);
      if(nextIndex===steps.length){
        status.textContent='Stage '+stageNo+' startup order valid.';led()?.setPattern('check');
        if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,2);
        later(()=>renderExpeditionRoute(stageIndex+3,'complete',()=>{
          if(stageIndex<2){
            active.roomStage++;
            renderRoom();
          }else{
            active.roomStage=0;
            active.room=2;
            renderRoom();
          }
        }),420);
      }else{
        status.textContent='Choose operation '+(nextIndex+1)+' of '+steps.length+'.';
        showNotice(step.short+' locked into position '+nextIndex+'.','success',800);
      }
    });
    choices.appendChild(b);
  }
  consoleEl.append(scene,chain,choices,status);
  root.appendChild(consoleEl);
}

/* ---------------- Room 3: RAM Calibration / Takuzu ---------------- */

const LINE_CACHE={};
function validLine(bits){const n=bits.length,half=n/2;if(bits.reduce((a,b)=>a+b,0)!==half)return false;for(let i=0;i<n-2;i++)if(bits[i]===bits[i+1]&&bits[i]===bits[i+2])return false;return true;}
function linePatterns(n){if(LINE_CACHE[n])return LINE_CACHE[n];const out=[];for(let mask=0;mask<(1<<n);mask++){const bits=Array.from({length:n},(_,i)=>(mask>>(n-1-i))&1);if(validLine(bits))out.push(bits);}return LINE_CACHE[n]=out;}
function partialColumnOK(grid,row,r,n){const half=n/2,remaining=n-r-1;for(let c=0;c<n;c++){let ones=row[c],zeros=1-row[c];for(let rr=0;rr<r;rr++){if(grid[rr][c]===1)ones++;else zeros++;}if(ones>half||zeros>half||ones+remaining<half||zeros+remaining<half)return false;if(r>=2&&grid[r-1][c]===row[c]&&grid[r-2][c]===row[c])return false;}return true;}
function columnsUnique(grid,n){const seen=new Set();for(let c=0;c<n;c++){const k=grid.map(row=>row[c]).join('');if(seen.has(k))return false;seen.add(k);}return true;}
function buildSolution(n,seed){const rng=rngFromSeed(seed+':solution'),patterns=linePatterns(n),ordered=shuffled(patterns,rng),grid=[],used=new Set();function rec(r){if(r===n)return columnsUnique(grid,n);const offset=Math.floor(rng()*ordered.length);for(let k=0;k<ordered.length;k++){const row=ordered[(k+offset)%ordered.length],rk=row.join('');if(used.has(rk)||!partialColumnOK(grid,row,r,n))continue;grid[r]=row;used.add(rk);if(rec(r+1))return true;used.delete(rk);grid.pop();}return false;}if(!rec(0))return null;return grid.map(r=>r.slice());}
function rowMatches(row,givens){for(let c=0;c<row.length;c++)if(givens[c]!=null&&givens[c]!==row[c])return false;return true;}
function countSolutions(display,limit=2){const n=display.length,patterns=linePatterns(n),candidates=display.map(row=>patterns.filter(p=>rowMatches(p,row))),grid=[],used=new Set();let count=0;function rec(r){if(count>=limit)return;if(r===n){if(columnsUnique(grid,n))count++;return;}for(const row of candidates[r]){const rk=row.join('');if(used.has(rk)||!partialColumnOK(grid,row,r,n))continue;grid[r]=row;used.add(rk);rec(r+1);used.delete(rk);if(count>=limit)return;}}rec(0);return count;}
function makeTakuzu(seed,options={}){
  const n=6,solution=buildSolution(n,seed);if(!solution)return null;
  const display=solution.map(r=>r.slice()),rng=rngFromSeed(seed+':mask'),order=shuffled(Array.from({length:n*n},(_,i)=>[Math.floor(i/n),i%n]),rng);
  let shown=n*n;
  const target=Math.max(18,Math.min(30,Number(options.target)||20));
  const minShownPerLine=3;
  const rowCount=Array(n).fill(n),colCount=Array(n).fill(n);
  for(const pos of order){
    const r=pos[0],c=pos[1];
    if(shown<=target)break;
    if(rowCount[r]<=minShownPerLine||colCount[c]<=minShownPerLine)continue;
    const old=display[r][c];
    display[r][c]=null;
    if(countSolutions(display,2)===1){shown--;rowCount[r]--;colCount[c]--;}
    else display[r][c]=old;
  }
  return {n,solution,display,shown};
}

function memoryStageConfig(stage){
  return [
    {label:'ADDRESS GRID',scene:'BANK A · GUIDED RESTORE',accent:'cyan',copy:'The first bank exposes more fixed bits and a clean address grid.'},
    {label:'FRAGMENTED RAM',scene:'BANK B · FRAGMENT BRIDGE',accent:'amber',copy:'The second bank is split visually across two memory regions and exposes fewer fixed bits.'},
    {label:'CORE RESTORE',scene:'CORE BANK · FINAL CHECKSUM',accent:'violet',copy:'The core bank has the fewest clues. Restore it to complete Stage 9 of 9.'}
  ][stage]||null;
}
function renderMemoryBank(){
  const stageIndex=active.roomStage||0,stageNo=stageIndex+1,stageCfg=memoryStageConfig(stageIndex);
  const targets=[26,23,20];
  const target=targets[stageIndex];
  setProgress('BOOT SEQUENCE · LEVEL 1 · STAGE '+(stageIndex+7)+'/9 · '+stageCfg.label);
  const root=active.root;
  root.appendChild(roomHeader(
    'LEVEL 1 · STAGE '+(stageIndex+7)+'/9 · MEMORY BANK',
    stageCfg.label,
    stageCfg.copy
  ));

  const rules=document.createElement('div');rules.className='memory-rules';
  rules.innerHTML='<span><strong>1</strong> Three 0s and three 1s in every row and column</span><span><strong>2</strong> Never three identical bits in a row</span><span><strong>3</strong> No completed rows or columns may be identical</span>';
  root.appendChild(rules);

  const memoryConsole=document.createElement('section');memoryConsole.className='memory-console memory-stage-'+stageNo+' memory-'+stageCfg.accent;
  const memoryScene=document.createElement('div');memoryScene.className='memory-scene';
  const memorySceneCopy=document.createElement('div');memorySceneCopy.className='memory-scene-copy';
  memorySceneCopy.innerHTML='<small>STAGE '+(stageIndex+7)+'/9 · '+stageCfg.label+'</small><strong>'+stageCfg.scene+'</strong><span>Repair every missing bit, then run the checksum.</span>';
  const bankLights=document.createElement('div');bankLights.className='memory-bank-lights';
  for(let i=0;i<6;i++){const light=document.createElement('i');light.className=i<stageNo?'online':'';bankLights.appendChild(light);}
  memoryScene.append(memorySceneCopy,bankLights);
  memoryConsole.appendChild(memoryScene);

  const puzzle=makeTakuzu(active.seed+':ram:'+stageNo,{target})||makeTakuzu(active.seed+':ram:fallback:'+stageNo,{target});
  if(!puzzle){
    showTransition('RAM generator fault','A unique memory bank could not be generated.','Retry stage →',()=>renderRoom(),'fault');
    return;
  }
  const state=puzzle.display.map(r=>r.slice());
  const board=document.createElement('div');board.className='memory-grid';board.style.setProperty('--memory-n',String(puzzle.n));
  const buttons=[];
  const editableTotal=puzzle.display.flat().filter(v=>v==null).length;

  for(let r=0;r<puzzle.n;r++)for(let cc=0;cc<puzzle.n;cc++){
    const given=puzzle.display[r][cc]!=null;
    const b=document.createElement('button');b.type='button';b.className='memory-cell'+(given?' given':'');b.dataset.r=String(r);b.dataset.c=String(cc);b.disabled=given;
    function paint(){
      const v=state[r][cc];b.textContent=v==null?'·':String(v);
      b.classList.toggle('zero',v===0);b.classList.toggle('one',v===1);
    }
    if(!given)b.addEventListener('click',()=>{
      state[r][cc]=state[r][cc]==null?0:state[r][cc]===0?1:null;
      b.classList.remove('wrong','hint');paint();updateMemoryLEDs();
    });
    paint();board.appendChild(b);buttons.push(b);
  }

  function updateMemoryLEDs(){
    let filled=0;
    for(let r=0;r<puzzle.n;r++)for(let cc=0;cc<puzzle.n;cc++)if(puzzle.display[r][cc]==null&&state[r][cc]!=null)filled++;
    led()?.progress(filled,editableTotal);
  }
  updateMemoryLEDs();

  const actions=document.createElement('div');actions.className='memory-actions';
  const hint=document.createElement('button');hint.type='button';hint.className='secondary';hint.textContent='Highlight a useful cell';
  const check=document.createElement('button');check.type='button';check.textContent='Check memory';
  const status=document.createElement('div');status.className='logic-status';
  status.textContent='Stage '+stageNo+'/3 · '+editableTotal+' cells to restore · tap a blank cell to cycle · → 0 → 1 → ·';

  hint.addEventListener('click',()=>{
    buttons.forEach(b=>b.classList.remove('hint'));
    const candidates=buttons.filter(b=>!b.disabled&&state[+b.dataset.r][+b.dataset.c]==null);
    if(!candidates.length){showNotice('Every cell is filled. Run Check memory.','info',1200);return;}
    const b=candidates[0];b.classList.add('hint');
    showNotice('Hint: inspect the highlighted row and column for balance, pairs or a forced bit.','info',1800);
  });

  check.addEventListener('click',()=>{
    let wrong=0,blank=0;
    buttons.forEach(b=>{
      b.classList.remove('wrong');
      const r=+b.dataset.r,cc=+b.dataset.c,v=state[r][cc];
      if(v==null)blank++;
      else if(v!==puzzle.solution[r][cc]){wrong++;if(!b.disabled)b.classList.add('wrong');}
    });
    if(!wrong&&!blank){
      check.disabled=true;hint.disabled=true;buttons.forEach(b=>b.disabled=true);
      active.playTone(920,.1,'sine',.04);status.textContent='Stage '+stageNo+' RAM checksum valid.';led()?.setPattern('check');
      if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,3);
      bankLights.querySelectorAll('i').forEach(i=>i.classList.add('online'));
      later(()=>renderExpeditionRoute(stageIndex+6,'complete',()=>{
        if(stageIndex<2){
          active.roomStage++;
          renderRoom();
        }else{
          active.roomStage=0;
          active.room=3;
          renderRoom();
        }
      }),420);
    }else if(wrong){
      active.memoryFaults++;const depleted=applyAdventurePenalty();
      active.playTone(155,.08,'square',.025);led()?.flash('x',380);
      if(depleted)return;
      showNotice(wrong+' bit'+(wrong===1?' is':'s are')+' inconsistent. Recheck the highlighted cells.','fault',1500);
    }else showNotice(blank+' memory cell'+(blank===1?' is':'s are')+' still blank.','warn',1200);
  });

  actions.append(hint,check);memoryConsole.append(board,actions,status);root.appendChild(memoryConsole);
}

/* ============================================================
   SYSTEM 2 · RANDOMISER CORE
   ============================================================ */

function randomInt(rng,min,max){return min+Math.floor(rng()*(max-min+1));}

/* ---------------- Room 1: Random Packet Catcher ---------------- */

function levelTwoJourneyStages(){
  return [
    {short:'D1',name:'DICE FEED',sub:'Catch 1–6 packets'},
    {short:'XY',name:'COORDINATE STREAM',sub:'Catch valid LED coordinates'},
    {short:'WIN',name:'WINDOW FILTER',sub:'Tight 2–5 range'},
    {short:'C1',name:'COIN AUDIT',sub:'Check 0/1 outputs'},
    {short:'D2',name:'DICE AUDIT',sub:'Check 1–6 outputs'},
    {short:'CA',name:'COORDINATE AUDIT',sub:'Scan longer output streams'},
    {short:'P',name:'PARITY ROUTER',sub:'Even or odd path'},
    {short:'×',name:'MULTIPLE ROUTER',sub:'Multiples path'},
    {short:'★',name:'PRIME / SQUARE',sub:'Advanced property path'}
  ];
}
function randomiserRouteCopy(stageIndex,phase){
  if(phase==='start')return {
    kicker:'LEVEL 2 · RANDOMISER CORE · NINE STAGES',
    title:'BIT leaves the Memory Bank',
    copy:'The Level 1 repair path continues through an internal data bus into the Randomiser Core. Same BIT, same micro:bit — a new region with different hazards and logic.',
    button:'Follow the bus to Dice Feed →'
  };
  const messages=[
    ['Dice Feed stable','BIT has calibrated the basic 1–6 packet feed. Next, random values become LED coordinates.','Enter Coordinate Stream →'],
    ['Coordinate Stream stable','Valid x/y positions are passing correctly. The next filter uses a narrow 2–5 window with close boundary values.','Enter Window Filter →'],
    ['Packet Intake stable','All three live packet filters are stable. BIT can now inspect stored random output streams.','Open Coin Audit →'],
    ['Coin Audit stable','Binary 0/1 outputs are valid. Next, inspect a longer six-sided-die stream.','Open Dice Audit →'],
    ['Dice Audit stable','The die stream passes its range checks. One longer coordinate-style audit remains.','Open Coordinate Audit →'],
    ['Range Diagnostics stable','All stored output streams have been checked without mistaking ordinary repeats for faults.','Open Parity Router →'],
    ['Parity Router stable','The first property route is restored. Next, route only multiples through a larger grid.','Open Multiple Router →'],
    ['Multiple Router stable','The multiples route is stable. The final stage introduces PRIME or SQUARE routing.','Open Prime / Square Router →'],
    ['Randomiser Core repaired','All nine Level 2 stages are stable. BIT can now run the final Randomiser diagnostic.','Proceed to Final Diagnostic →']
  ];
  const m=messages[Math.max(0,Math.min(8,stageIndex))];
  return {
    kicker:stageIndex===8?'NINE STAGES COMPLETE':'STAGE '+(stageIndex+1)+'/9 COMPLETE',
    title:m[0],copy:m[1],button:m[2]
  };
}
function renderRandomiserRoute(stageIndex,phase,onContinue){
  const root=active?.root;if(!root){onContinue?.();return;}
  const screen=document.getElementById('screen-adventure');
  const stages=levelTwoJourneyStages();
  const completedThrough=phase==='complete'?stageIndex:stageIndex-1;
  const current=phase==='complete'?Math.min(stageIndex+1,stages.length):stageIndex;
  const meta=randomiserRouteCopy(stageIndex,phase);
  screen?.classList.add('expedition-map-mode','randomiser-map-mode');
  setProgress('RANDOMISER CORE · LEVEL 2 JOURNEY MAP · '+Math.max(0,completedThrough+1)+'/9 STAGES');
  root.replaceChildren();

  const panel=document.createElement('section');panel.className='expedition-route-screen level-one-route-screen randomiser-route-screen';
  const intro=document.createElement('div');intro.className='expedition-route-intro';
  const kicker=document.createElement('small');kicker.textContent=meta.kicker;
  const title=document.createElement('h2');title.textContent=meta.title;
  const copy=document.createElement('p');copy.textContent=meta.copy;
  intro.append(kicker,title,copy);

  const map=document.createElement('div');map.className='level-one-journey-map level-two-journey-map';
  const groups=[
    ['LIVE PACKET INTAKE',0],
    ['RANGE DIAGNOSTICS',3],
    ['PROPERTY ROUTER',6]
  ];
  for(let g=0;g<groups.length;g++){
    const region=document.createElement('section');region.className='level-one-route-region level-two-route-region region-'+(g+1);
    const head=document.createElement('div');head.className='level-one-route-region-head';
    const zone=document.createElement('small');zone.textContent='ZONE '+(g+1);
    const name=document.createElement('strong');name.textContent=groups[g][0];
    head.append(zone,name);
    const rail=document.createElement('div');rail.className='level-one-route-rail';
    stages.slice(groups[g][1],groups[g][1]+3).forEach((stage,local)=>{
      const i=groups[g][1]+local;
      const stop=document.createElement('div');stop.className='level-one-mini-stop '+(i<=completedThrough?'complete':i===current?'current':'locked');
      const marker=document.createElement('b');marker.textContent=i<=completedThrough?'✓':i===current?'BIT':stage.short;
      const label=document.createElement('span');
      const strong=document.createElement('strong');strong.textContent=(i+1)+'. '+stage.name;
      const sub=document.createElement('small');sub.textContent=stage.sub;
      label.append(strong,sub);stop.append(marker,label);rail.appendChild(stop);
      if(local<2){const link=document.createElement('i');link.className='level-one-mini-link '+(i<completedThrough?'complete':'');rail.appendChild(link);}
    });
    region.append(head,rail);map.appendChild(region);
  }
  const final=document.createElement('div');
  final.className='level-one-final-node '+(current===stages.length?'current':completedThrough>=8?'ready':'locked');
  final.innerHTML='<b>'+(current===stages.length?'RNG':completedThrough>=8?'✓':'RNG')+'</b><span><strong>FINAL DIAGNOSTIC</strong><small>12-question Randomiser check</small></span>';
  map.appendChild(final);

  const key=document.createElement('div');key.className='expedition-route-key';
  key.innerHTML='<span><i class="done"></i> cleared</span><span><i class="here"></i> BIT location</span><span><i class="locked"></i> locked route</span><span><strong>'+Math.max(0,completedThrough+1)+'/9</strong> stages repaired</span>';
  const action=document.createElement('button');action.type='button';action.className='expedition-route-action';action.textContent=meta.button;
  action.addEventListener('click',()=>{screen?.classList.remove('expedition-map-mode','randomiser-map-mode');onContinue?.();});
  panel.append(intro,map,key,action);root.appendChild(panel);
  requestAnimationFrame(()=>action.focus({preventScroll:true}));
}

function randomPacketStage(stage){
  return [
    {label:'DICE FEED',kind:'number',min:1,max:6,target:5,validChance:.72,spawnMs:930,fallStep:2.0,copy:'Catch 5 numbers from 1 to 6.'},
    {label:'COORDINATE STREAM',kind:'coordinate',min:0,max:4,target:5,validChance:.64,spawnMs:860,fallStep:2.05,copy:'Catch 5 LED coordinates where BOTH x and y are from 0 to 4.'},
    {label:'WINDOW FILTER',kind:'number',min:2,max:5,target:5,validChance:.54,spawnMs:780,fallStep:2.2,copy:'Catch 5 numbers from 2 to 5. Boundary faults sit just outside the valid window.'}
  ][stage]||null;
}

function renderRandomPacketCatcher(){
  const stageIndex=active.roomStage||0,stageNo=stageIndex+1;
  const cfg=randomPacketStage(stageIndex);
  if(stageIndex===0&&!active.randomiserMapSeen){
    active.randomiserMapSeen=true;
    renderRandomiserRoute(0,'start',()=>renderRoom());
    return;
  }
  setProgress('RANDOMISER CORE · LEVEL 2 · STAGE '+stageNo+'/9 · '+cfg.label);
  const root=active.root;
  root.appendChild(roomHeader(
    'LEVEL 2 · STAGE '+stageNo+'/9 · RANDOMISER CORE',
    cfg.label,
    cfg.copy+' BIT has reached a live packet chamber. Move BIT between the three bus lanes to intercept valid packets and let faults pass.'
  ));

  let caught=0,playerLane=1,live=false,finished=false,nextPacketId=1;
  const rng=rngFromSeed(active.seed+':packet-catcher:'+stageNo);
  const packets=[];

  const hud=document.createElement('div');hud.className='random-catcher-hud';
  const ruleBox=document.createElement('div');ruleBox.className='random-rule-box';
  const progress=document.createElement('div');progress.className='random-catch-progress';
  hud.append(ruleBox,progress);

  const arena=document.createElement('div');arena.className='random-catcher-arena random-catcher-stage-'+stageNo;
  arena.setAttribute('role','application');arena.setAttribute('aria-label','Three-lane random packet catcher stage '+stageNo);
  for(let i=0;i<3;i++){const lane=document.createElement('div');lane.className='random-lane';lane.dataset.lane=String(i);arena.appendChild(lane);}
  const catcher=document.createElement('div');catcher.className='random-catcher bit-catcher';catcher.innerHTML='<b>●</b><span>BIT</span>';

  const controls=document.createElement('div');controls.className='random-catcher-controls';
  const left=document.createElement('button');left.type='button';left.textContent='←';left.setAttribute('aria-label','Move catcher left');
  const right=document.createElement('button');right.type='button';right.textContent='→';right.setAttribute('aria-label','Move catcher right');
  controls.append(left,right);

  const startRow=document.createElement('div');startRow.className='random-catcher-start';
  const startButton=document.createElement('button');startButton.type='button';startButton.className='random-catcher-start-button';startButton.textContent='Start stage '+stageNo+' →';
  const startHint=document.createElement('span');
  startHint.textContent=stageIndex===0
    ?'Learn the feed: only values 1–6 belong in the dice stream.'
    :stageIndex===1
      ?'New rule: each packet is an (x,y) coordinate and BOTH values must be 0–4.'
      :'Final intake stage: the valid window is only 2–5 and near-miss values arrive faster.';
  startRow.append(startHint,startButton);

  const continuity=document.createElement('div');continuity.className='randomiser-continuity-strip';
  continuity.innerHTML='<span><strong>BIT LOCATION</strong> RANDOMISER CORE · '+cfg.label+'</span><span><strong>ARRIVED FROM</strong> '+(stageIndex===0?'MEMORY BANK':stageIndex===1?'DICE FEED':'COORDINATE STREAM')+'</span><span><strong>NEXT</strong> '+(stageIndex===0?'COORDINATE STREAM':stageIndex===1?'WINDOW FILTER':'RANGE DIAGNOSTICS')+'</span>';
  const legend=document.createElement('div');legend.className='adventure-info-strip';
  legend.innerHTML=cfg.kind==='coordinate'
    ?'<span><strong>VALID</strong> both x and y are 0–4</span><span><strong>FAULT</strong> either coordinate is outside 0–4</span><span><strong>TARGET</strong> catch '+cfg.target+'</span>'
    :'<span><strong>IN RANGE</strong> catch it</span><span><strong>OUT OF RANGE</strong> let it pass</span><span><strong>TARGET</strong> catch '+cfg.target+'</span>';

  root.append(continuity,hud,legend,startRow,arena,controls);

  function paintRule(){
    const ruleText=cfg.kind==='coordinate'?'x,y = random 0 to 4':'random '+cfg.min+' to '+cfg.max;
    ruleBox.innerHTML='<small>'+cfg.label+'</small><strong>'+ruleText+'</strong><span>'+cfg.copy+'</span>';
    progress.textContent='CAUGHT '+caught+'/'+cfg.target+(cfg.kind==='coordinate'?' · BOTH COORDINATES 0–4':' · RANGE '+cfg.min+'–'+cfg.max);
  }
  function paintPlayer(){
    catcher.style.left='calc('+(playerLane*33.333+16.666)+'% - 32px)';
    if(!catcher.isConnected)arena.appendChild(catcher);
  }
  function startLive(){
    if(live||finished)return;
    live=true;startRow.hidden=true;
    every(spawn,cfg.spawnMs);every(tick,50);spawn();
  }
  startButton.addEventListener('click',()=>{startButton.disabled=true;focusPlayArea(arena,startLive);});
  function move(delta){
    if(!live||finished)return;
    playerLane=Math.max(0,Math.min(2,playerLane+delta));paintPlayer();active.playTone(330+playerLane*70,.025,'sine',.012);
  }
  left.addEventListener('click',()=>move(-1));right.addEventListener('click',()=>move(1));
  active.keyHandler=(e)=>{
    if(active?.systemId!=='2'||active.room!==0||finished)return;
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){e.preventDefault();move(-1);}
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){e.preventDefault();move(1);}
  };
  document.addEventListener('keydown',active.keyHandler);

  function spawn(){
    if(!live||finished)return;
    const shouldValid=rng()<cfg.validChance;
    let display,valid;
    if(cfg.kind==='coordinate'){
      let x=randomInt(rng,0,4),y=randomInt(rng,0,4);
      if(!shouldValid){
        if(rng()<.5)x=rng()<.5?-1:5;
        else y=rng()<.5?-1:5;
      }
      display='('+x+','+y+')';
      valid=x>=0&&x<=4&&y>=0&&y<=4;
    }else{
      let value;
      if(shouldValid)value=randomInt(rng,cfg.min,cfg.max);
      else{
        const pool=stageIndex===2?[cfg.min-1,cfg.max+1]:[cfg.min-2,cfg.min-1,cfg.max+1,cfg.max+2].filter(v=>v>=0);
        value=pool[Math.floor(rng()*pool.length)] ?? cfg.max+1;
      }
      display=String(value);
      valid=Number.isInteger(value)&&value>=cfg.min&&value<=cfg.max;
    }
    const packet={id:nextPacketId++,lane:randomInt(rng,0,2),display,valid,y:-12,resolved:false,el:document.createElement('div')};
    packet.el.className='random-packet'+(cfg.kind==='coordinate'?' coordinate':'');packet.el.style.left='calc('+(packet.lane*33.333+16.666)+'% - 22px)';
    packet.el.style.top=packet.y+'%';packet.el.textContent=packet.display;arena.appendChild(packet.el);packets.push(packet);
  }
  function clearPacketNodes(){for(const p of packets)p.el?.remove();packets.splice(0,packets.length);}
  function renderPackets(){
    for(const p of packets){
      if(!p.el?.isConnected&&p.el)arena.appendChild(p.el);
      if(p.el){p.el.style.left='calc('+(p.lane*33.333+16.666)+'% - 22px)';p.el.style.top=p.y+'%';}
    }
    paintPlayer();
    const ledCells=[[4,[0,2,4][playerLane]]];
    for(const p of packets){const row=Math.max(0,Math.min(3,Math.round((p.y+12)/90*3)));ledCells.push([row,[0,2,4][p.lane]]);}
    led()?.setCells(ledCells);
  }
  function resolvePacket(p){
    if(p.lane!==playerLane||p.resolved)return;
    p.resolved=true;
    if(p.valid){
      caught++;active.playTone(720,.055,'sine',.025);paintRule();
      showNotice(p.display+' accepted · '+caught+'/'+cfg.target+' caught.','success',650);
      if(caught>=cfg.target){
        finished=true;live=false;clearTimers();clearPacketNodes();led()?.setPattern('check');
        if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,1);
        later(()=>renderRandomiserRoute(stageIndex,'complete',()=>{
          if(stageIndex<2){active.roomStage++;renderRoom();}
          else{active.roomStage=0;active.room=1;renderRoom();}
        }),420);
      }
    }else{
      active.arcadeFaults++;const depleted=applyAdventurePenalty();
      active.playTone(150,.08,'square',.026);led()?.flash('x',260);
      arena.classList.remove('fault');void arena.offsetWidth;arena.classList.add('fault');
      if(depleted){live=false;return;}
      showNotice(cfg.kind==='coordinate'
        ?p.display+' is not a valid 5×5 LED coordinate.'
        :p.display+' is outside random '+cfg.min+' to '+cfg.max+'.','fault',850);
      later(()=>arena.classList.remove('fault'),350);
    }
  }
  function tick(){
    if(!live||finished)return;
    for(const p of packets)p.y+=cfg.fallStep;
    for(let i=packets.length-1;i>=0;i--){
      const p=packets[i];
      if(p.y>=78&&p.y<86){
        resolvePacket(p);if(!live||finished)return;
        if(p.resolved){p.el?.remove();packets.splice(i,1);continue;}
      }
      if(p.y>102){p.el?.remove();packets.splice(i,1);}
    }
    renderPackets();
  }

  paintRule();paintPlayer();renderPackets();led()?.setPattern('question');
  showNotice('Stage '+stageNo+'/9 · press Start when you are ready.','info',1300);
}

/* ---------------- Room 2: Randomiser Range Diagnostics ---------------- */

function makeRandomDiagnosticRounds(seed){
  const rng=rngFromSeed(seed+':range-diagnostics');
  const specs=[
    {name:'COIN',min:0,max:1,code:'random 0 to 1',length:5},
    {name:'DICE',min:1,max:6,code:'random 1 to 6',length:7},
    {name:'LED COORDINATE',min:0,max:4,code:'random 0 to 4',length:9}
  ];
  return specs.map((spec,roundIndex)=>{
    function goodStream(){
      const out=Array.from({length:spec.length},()=>randomInt(rng,spec.min,spec.max));
      if(new Set(out).size===1&&spec.max>spec.min)out[out.length-1]=out[0]===spec.max?spec.min:spec.max;
      return out;
    }
    const good1=goodStream(),good2=goodStream(),bad=goodStream();
    const badIndex=1+Math.floor(rng()*Math.max(1,bad.length-2));
    bad[badIndex]=rng()<.5?spec.min-1:spec.max+1;
    const streams=shuffled([{bad:false,values:good1},{bad:false,values:good2},{bad:true,values:bad}],rng);
    return {...spec,roundIndex,streams};
  });
}

function renderBrokenRandomiser(){
  const stageIndex=active.roomStage||0,stageNo=stageIndex+1;
  const round=makeRandomDiagnosticRounds(active.seed)[stageIndex];
  setProgress('RANDOMISER CORE · LEVEL 2 · STAGE '+(stageIndex+4)+'/9 · RANGE DIAGNOSTICS');
  const root=active.root;
  root.appendChild(roomHeader(
    'LEVEL 2 · STAGE '+(stageIndex+4)+'/9 · RANDOMISER CORE',
    stageIndex===0?'COIN AUDIT TERMINAL':stageIndex===1?'DICE AUDIT TERMINAL':'COORDINATE AUDIT TERMINAL',
    'BIT has reached a diagnostic terminal on the same internal route. Stage '+(stageIndex+4)+' shows '+round.length+' outputs. Select the one sequence containing a value that cannot come from '+round.code+'.'
  ));

  const travel=document.createElement('div');travel.className='randomiser-continuity-strip';
  travel.innerHTML='<span><strong>BIT LOCATION</strong> RANGE DIAGNOSTICS · TERMINAL '+stageNo+'</span><span><strong>ROUTE</strong> LIVE PACKET INTAKE → AUDIT TERMINALS → PROPERTY ROUTER</span>';
  root.appendChild(travel);

  const note=document.createElement('div');note.className='reality-note';
  note.innerHTML='<strong>Important</strong><span>You cannot prove randomness from a short sequence. Repeats are allowed. We are checking one thing we can know for certain: every output must stay inside the configured range.</span>';

  const consoleEl=document.createElement('div');consoleEl.className='random-diagnostic-console random-diagnostic-stage-'+stageNo;
  const title=document.createElement('div');title.className='random-diagnostic-title';
  const streams=document.createElement('div');streams.className='random-streams';
  const counter=document.createElement('div');counter.className='logic-status';
  root.append(note,consoleEl);consoleEl.append(title,streams,counter);

  title.innerHTML='<small>STAGE '+stageNo+'/3 · '+round.name+'</small><strong>'+round.code+'</strong><span>Select the sequence that does not match this rule.</span>';
  round.streams.forEach((stream,i)=>{
    const b=document.createElement('button');b.type='button';b.className='random-stream-card';
    const label=document.createElement('small');label.textContent='SEQUENCE '+String.fromCharCode(65+i);
    const values=document.createElement('div');values.className='random-stream-values';
    stream.values.forEach(v=>{const s=document.createElement('span');s.textContent=String(v);values.appendChild(s);});
    b.append(label,values);
    b.addEventListener('click',()=>choose(i,b));
    streams.appendChild(b);
  });
  counter.textContent='Find the sequence containing a number outside '+round.min+'–'+round.max+'. Repeated numbers are allowed.';
  led()?.setPattern('question');

  let locked=false;
  function choose(i,button){
    if(locked)return;
    const stream=round.streams[i];
    if(!stream.bad){
      active.logicFaults++;button.classList.add('wrong');
      const depleted=applyAdventurePenalty();
      active.playTone(155,.07,'square',.023);led()?.flash('x',360);
      if(depleted)return;
      showNotice('That sequence matches '+round.code+'. Every value is in range.','warn',1200);
      later(()=>button.classList.remove('wrong'),600);
      return;
    }
    locked=true;button.classList.add('correct');active.playTone(760,.065,'sine',.025);led()?.setPattern('check');
    const badValue=stream.values.find(v=>v<round.min||v>round.max);
    showNotice(badValue+' cannot come from '+round.code+'.','success',850);
    if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,2);
    later(()=>renderRandomiserRoute(stageIndex+3,'complete',()=>{
      if(stageIndex<2){active.roomStage++;renderRoom();}
      else{active.roomStage=0;active.room=2;renderRoom();}
    }),650);
  }
}

/* ---------------- Room 3: Data / Property Router ---------------- */

function routerNeighbours(p,n){
  const [r,c]=p,out=[];
  if(r>0)out.push([r-1,c]);if(r<n-1)out.push([r+1,c]);if(c>0)out.push([r,c-1]);if(c<n-1)out.push([r,c+1]);
  return out;
}
function routerAllCells(n){const out=[];for(let r=0;r<n;r++)for(let c=0;c<n;c++)out.push([r,c]);return out;}
function routerBorderCells(n){return routerAllCells(n).filter(([r,c])=>r===0||c===0||r===n-1||c===n-1);}
function routerKey(p){return `${p[0]}:${p[1]}`;}
function routerIsPrime(v){if(v<2)return false;for(let d=2;d*d<=v;d++)if(v%d===0)return false;return true;}
function routerMatches(v,rule){
  if(rule.mode==='even')return v%2===0;
  if(rule.mode==='odd')return v%2===1;
  if(rule.mode==='multiple')return v%rule.a===0;
  if(rule.mode==='prime')return routerIsPrime(v);
  if(rule.mode==='square')return Number.isInteger(Math.sqrt(v));
  return false;
}
function routerRule(rng,ruleIds=null){
  const all=[
    {id:'even',mode:'even',label:'even numbers',shortLabel:'EVEN'},
    {id:'odd',mode:'odd',label:'odd numbers',shortLabel:'ODD'},
    {id:'m3',mode:'multiple',a:3,label:'multiples of 3',shortLabel:'×3'},
    {id:'m4',mode:'multiple',a:4,label:'multiples of 4',shortLabel:'×4'},
    {id:'prime',mode:'prime',label:'prime numbers',shortLabel:'PRIME'},
    {id:'square',mode:'square',label:'square numbers',shortLabel:'SQUARE'}
  ];
  const pool=Array.isArray(ruleIds)&&ruleIds.length?all.filter(r=>ruleIds.includes(r.id)):all;
  return shuffled(pool.length?pool:all,rng)[0];
}
function routerStageConfig(stage){
  return [
    {n:5,pathLength:7,branches:1,ruleIds:['even','odd']},
    {n:6,pathLength:11,branches:3,ruleIds:['m3','m4']},
    {n:7,pathLength:15,branches:4,ruleIds:['prime','square']}
  ][stage]||null;
}
function routerMakePath(n,length,rng){
  const starts=shuffled(routerBorderCells(n),rng);
  for(let outer=0;outer<Math.min(30,starts.length*2);outer++){
    const start=starts[outer%starts.length],path=[start],used=new Set([routerKey(start)]);let nodes=0;
    function dfs(){
      if(path.length===length)return true;
      if(nodes++>10000)return false;
      const cur=path[path.length-1],prev=path.length>1?path[path.length-2]:null;
      let cands=routerNeighbours(cur,n).filter(p=>!used.has(routerKey(p))&&routerNeighbours(p,n).filter(q=>used.has(routerKey(q))).length===1);
      cands=shuffled(cands,rng).sort((a,b)=>{
        const onward=p=>routerNeighbours(p,n).filter(q=>!used.has(routerKey(q))).length;
        const turn=p=>!prev?0:((cur[0]-prev[0])!==(p[0]-cur[0])||(cur[1]-prev[1])!==(p[1]-cur[1])?1:0);
        return (turn(b)-turn(a))*3+(onward(b)-onward(a));
      });
      for(const p of cands){path.push(p);used.add(routerKey(p));if(dfs())return true;used.delete(routerKey(p));path.pop();}
      return false;
    }
    if(dfs())return path.map(p=>p.slice());
  }
  return null;
}
function routerAddBranches(path,n,count,rng){
  const valid=new Set(path.map(routerKey)),protectedKeys=new Set([routerKey(path[0]),routerKey(path[path.length-1])]),added=[];
  for(let i=0;i<count;i++){
    let cands=routerAllCells(n).filter(p=>!valid.has(routerKey(p)));
    cands=cands.filter(p=>{
      const touching=routerNeighbours(p,n).filter(q=>valid.has(routerKey(q)));
      return touching.length===1&&!protectedKeys.has(routerKey(touching[0]));
    });
    if(!cands.length)break;
    const p=shuffled(cands,rng)[0];valid.add(routerKey(p));added.push(p);
  }
  return {validKeys:[...valid],branchCells:added};
}
function routerSolve(grid,rule,start,finish,limit=2){
  const n=grid.length,target=routerKey(finish),seen=new Set(),path=[],solutions=[];
  function rec(p){
    if(solutions.length>=limit)return;
    const k=routerKey(p);seen.add(k);path.push(p);
    if(k===target)solutions.push(path.map(q=>q.slice()));
    else for(const q of routerNeighbours(p,n)){
      const qk=routerKey(q);if(seen.has(qk)||!routerMatches(grid[q[0]][q[1]],rule))continue;
      rec(q);if(solutions.length>=limit)break;
    }
    path.pop();seen.delete(k);
  }
  if(routerMatches(grid[start[0]][start[1]],rule)&&routerMatches(grid[finish[0]][finish[1]],rule))rec(start);
  return {count:solutions.length,path:solutions[0]||[]};
}
function makePropertyRouter(seed,options={}){
  const n=Math.max(5,Math.min(7,Number(options.n)||5));
  const pathLength=Math.max(6,Math.min(n*n-2,Number(options.pathLength)||10));
  const branches=Math.max(0,Math.min(6,Number(options.branches)||2));
  const rng=rngFromSeed(seed+':property-router'),rule=routerRule(rng,options.ruleIds);
  for(let attempt=0;attempt<120;attempt++){
    const local=rngFromSeed(seed+':property-router:'+attempt);
    const path=routerMakePath(n,pathLength,local);if(!path)continue;
    const branched=routerAddBranches(path,n,branches,local);
    if(branched.branchCells.length<branches)continue;
    const valid=new Set(branched.validKeys),yes=[],no=[];
    const valueLimit=rule.mode==='square'?Math.max(225,Math.pow(valid.size+4,2)):Math.max(120,n*n*4);
    for(let v=1;v<=valueLimit;v++)(routerMatches(v,rule)?yes:no).push(v);
    if(yes.length<valid.size||no.length<n*n-valid.size)continue;
    const preferred=rule.mode==='prime'?[2,3,5,7,11,13]:rule.mode==='square'?[1,4,9,16,25,36]:[];
    const familiar=preferred.filter(v=>yes.includes(v));
    const remainder=shuffled(yes.filter(v=>!familiar.includes(v)),local);
    const y=[...familiar,...remainder].slice(0,valid.size),nn=shuffled(no,local).slice(0,n*n-valid.size);
    let yi=0,ni=0;const grid=Array.from({length:n},()=>Array(n).fill(0));
    for(const p of shuffled(routerAllCells(n),local))grid[p[0]][p[1]]=valid.has(routerKey(p))?y[yi++]:nn[ni++];
    const start=path[0],finish=path[path.length-1],check=routerSolve(grid,rule,start,finish,2);
    if(check.count!==1)continue;
    const routeSet=new Set(check.path.map(routerKey));
    return {n,grid,rule,start,finish,solutionPath:check.path,validKeys:[...valid],deadEnds:[...valid].filter(k=>!routeSet.has(k))};
  }
  return null;
}

function renderPropertyRouter(){
  const stageIndex=active.roomStage||0,stageNo=stageIndex+1;
  const cfg=routerStageConfig(stageIndex);
  setProgress('RANDOMISER CORE · LEVEL 2 · STAGE '+(stageIndex+7)+'/9 · PROPERTY ROUTER');
  const root=active.root;

  const seed=active.seed+':router-stage-'+stageNo;
  const puzzle=makePropertyRouter(seed,cfg)||makePropertyRouter(seed+':fallback',cfg);
  if(!puzzle){
    showTransition('Router unavailable','A unique stage '+stageNo+' route could not be generated.','Retry stage →',()=>renderRoom(),'fault');
    return;
  }

  const ruleName=puzzle.rule.label.toUpperCase();
  const stageCopy='This '+puzzle.n+'×'+puzzle.n+' board uses '+ruleName+' only. Follow touching '+puzzle.rule.label+' from START to FINISH. Other number properties do not count on this board.';
  root.appendChild(roomHeader(
    'LEVEL 2 · STAGE '+(stageIndex+7)+'/9 · RANDOMISER CORE',
    stageIndex===0?'PARITY ROUTER':stageIndex===1?'MULTIPLE ROUTER':'PRIME / SQUARE ROUTER',
    'BIT is now walking the Randomiser Core routing matrix. '+stageCopy
  ));

  const travel=document.createElement('div');travel.className='randomiser-continuity-strip';
  travel.innerHTML='<span><strong>BIT LOCATION</strong> PROPERTY ROUTER · STAGE '+(stageIndex+7)+'/9</span><span><strong>MISSION</strong> WALK THE VALID DATA PATH TO FINISH</span>';
  root.appendChild(travel);

  const rule=document.createElement('div');rule.className='property-router-rule';
  rule.innerHTML='<small>STAGE '+stageNo+'/3 · ROUTING FILTER</small><strong>'+puzzle.rule.shortLabel+'</strong><span>Use only '+puzzle.rule.label+'</span>';

  const board=document.createElement('div');board.className='property-router-grid property-router-stage-'+stageNo;board.style.setProperty('--router-n',String(puzzle.n));board.dataset.routerSize=String(puzzle.n);
  const path=[puzzle.start.slice()];
  let finished=false;
  const buttons=[];

  for(let r=0;r<puzzle.n;r++)for(let cc=0;cc<puzzle.n;cc++){
    const p=[r,cc],b=document.createElement('button');b.type='button';b.className='property-router-cell';b.dataset.r=String(r);b.dataset.c=String(cc);
    const isStart=same(p,puzzle.start),isFinish=same(p,puzzle.finish);
    if(isStart)b.classList.add('is-start');if(isFinish)b.classList.add('is-finish');
    const label=document.createElement('small');label.textContent=isStart?'START':isFinish?'FINISH':'';
    const value=document.createElement('strong');value.textContent=String(puzzle.grid[r][cc]);
    b.append(label,value);b.addEventListener('click',()=>choose(p,b));board.appendChild(b);buttons.push(b);
  }

  const hint=document.createElement('div');hint.className='logic-status';
  hint.textContent='Stage '+stageNo+'/3 · '+puzzle.n+'×'+puzzle.n+' grid · route length '+puzzle.solutionPath.length+' · use '+puzzle.rule.label+' only · tap your previous square to backtrack.';
  root.append(rule,board,hint);

  function current(){return path[path.length-1];}
  function pathSet(){return new Set(path.map(routerKey));}
  function paint(){
    const used=pathSet(),cur=current();
    for(const b of buttons){
      const p=[+b.dataset.r,+b.dataset.c],k=routerKey(p);
      const isCurrent=same(p,cur);
      b.classList.toggle('is-path',used.has(k));b.classList.toggle('is-current',isCurrent);b.disabled=finished;
      b.classList.toggle('bit-position',isCurrent);
    }
    const ledPath=path.map(p=>led()?.mapPoint(p[0],p[1],puzzle.n,puzzle.n)).filter(Boolean);
    led()?.setCells(ledPath);
  }
  function adjacent(a,b){return Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])===1;}
  function choose(p,b){
    if(finished)return;
    const cur=current();
    if(path.length>1&&same(p,path[path.length-2])){path.pop();paint();return;}
    if(!adjacent(cur,p)){showNotice('Choose a square touching your current data packet.','warn',900);return;}
    if(path.some(q=>same(q,p))){showNotice('The route cannot loop through an earlier square.','warn',900);return;}
    if(!routerMatches(puzzle.grid[p[0]][p[1]],puzzle.rule)){
      active.routerFaults++;const depleted=applyAdventurePenalty();
      b.classList.add('wrong');active.playTone(150,.07,'square',.024);led()?.flash('x',330);
      if(depleted)return;
      const value=puzzle.grid[p[0]][p[1]];
      let reason=value+' does not match '+puzzle.rule.label+'.';
      if(puzzle.rule.mode==='square'&&routerIsPrime(value))reason=value+' is prime, but this board uses SQUARE numbers only.';
      else if(puzzle.rule.mode==='prime'&&Number.isInteger(Math.sqrt(value)))reason=value+' is a square number, but this board uses PRIME numbers only.';
      showNotice(reason,'fault',1150);
      later(()=>b.classList.remove('wrong'),500);return;
    }
    path.push(p);paint();active.playTone(500+path.length*18,.035,'sine',.018);
    if(same(p,puzzle.finish)){
      const exact=path.length===puzzle.solutionPath.length&&path.every((q,i)=>same(q,puzzle.solutionPath[i]));
      if(!exact){showNotice('FINISH reached, but this route is incomplete. Backtrack and try the other matching branch.','warn',1200);return;}
      finished=true;paint();led()?.setPattern('check');
      if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,3);
      later(()=>renderRandomiserRoute(stageIndex+6,'complete',()=>{
        if(stageIndex<2){active.roomStage++;renderRoom();}
        else{active.roomStage=0;active.room=3;renderRoom();}
      }),420);
    }
  }
  paint();
}

/* ---------------- Randomiser Core final gate ---------------- */

function renderRandomiserFinalGate(){
  setProgress('RANDOMISER CORE · FINAL DIAGNOSTIC READY');
  const root=active.root;
  root.appendChild(roomHeader(
    'RANDOMISER CORE STABLE',
    'BIT has repaired the next region of the micro:bit',
    'The journey that began in Level 1 has now crossed the Randomiser Core. All nine Level 2 stages are stable; one final diagnostic remains before BIT can continue deeper into the board.'
  ));

  const board=document.createElement('div');board.className='microbit-face full-face';
  board.innerHTML=microbitBoardMarkup().replace('BOOT OK','RNG OK');

  const real=document.createElement('div');real.className='reality-note real-note';
  real.innerHTML='<strong>What is real?</strong><span>The micro:bit can generate pseudo-random values in programs, respond to button and motion events, and use numbers to make decisions. The “Randomiser Core” is our game model for those ideas.</span>';

  const totalFaults=active.arcadeFaults+active.logicFaults+active.routerFaults;
  const stats=document.createElement('div');stats.className='adventure-run-stats';
  stats.innerHTML=`<span><strong>${active.arcadeFaults}</strong> packet faults</span><span><strong>${active.logicFaults}</strong> stream faults</span><span><strong>${active.routerFaults}</strong> router faults</span><span><strong>${totalFaults}</strong> total faults</span>`;
  root.append(board,real,stats);led()?.setPattern('dice5');

  later(()=>showTransition(
    'Final diagnostic ready',
    'Nine adventure stages are complete. Clear three diagnostic stages of four questions to bring Randomiser Core online.',
    'Run 12-question diagnostic →',
    ()=>{
      if(active.completed)return;active.completed=true;
      const totalFaults=active.arcadeFaults+active.logicFaults+active.routerFaults;
      const statsOut={
        systemId:'2',
        arcadeFaults:active.arcadeFaults,
        logicFaults:active.logicFaults,
        routerFaults:active.routerFaults,
        totalFaults,
        roomsCompleted:active.roomsCompleted,
        roomRestarts:active.roomRestarts,
        bonusScore:Math.max(0,300-(active.arcadeFaults*18+active.logicFaults*18+active.routerFaults*18)-active.roomRestarts*25)
      };
      const done=active.onComplete;stop();done(statsOut);
    }
  ),250);
}


/* ============================================================
   SYSTEM 3 · LOGIC ROUTER
   ============================================================ */

/* ---------------- Room 1: Branch Runner ---------------- */

function branchRunnerConfig(stage){
  return [
    {rounds:5,duration:5500,label:'IF / ELSE',copy:'Decide whether each simple condition is TRUE or FALSE before the packet reaches the branch.'},
    {rounds:6,duration:6000,label:'COMPARISONS',copy:'The router now mixes >, <, = and ≠. Read the operator carefully.'},
    {rounds:6,duration:7000,label:'COMPOUND AND',copy:'Each packet carries two readings. BOTH comparisons must pass for an AND condition to be TRUE.'}
  ][stage]||null;
}
function branchTrial(stage,rng,index){
  if(stage===0){
    const limit=randomInt(rng,3,7),x=randomInt(rng,0,9);
    return {code:'IF x > '+limit,value:'x = '+x,result:x>limit,detail:x+' > '+limit};
  }
  if(stage===1){
    const ops=['>','<','=','≠'],op=ops[index%ops.length],limit=randomInt(rng,2,8);
    let x;
    if(op==='='||op==='≠'){
      x=rng()<.5?limit:Math.max(0,Math.min(9,limit+(rng()<.5?-1:1)*randomInt(rng,1,2)));
    }else x=randomInt(rng,0,9);
    const result=op==='>'?x>limit:op==='<'?x<limit:op==='='?x===limit:x!==limit;
    return {code:'IF x '+op+' '+limit,value:'x = '+x,result,detail:x+' '+op+' '+limit};
  }
  const temp=randomInt(rng,14,28),light=randomInt(rng,25,75);
  const tLimit=randomInt(rng,17,23),lLimit=randomInt(rng,40,60);
  return {
    code:'IF temp >= '+tLimit+' AND light >= '+lLimit,
    value:'temp = '+temp+' · light = '+light,
    result:temp>=tLimit&&light>=lLimit,
    detail:temp+' >= '+tLimit+' AND '+light+' >= '+lLimit
  };
}

function renderBranchRunner(){
  const stageIndex=active.roomStage||0,stageNo=stageIndex+1,cfg=branchRunnerConfig(stageIndex);
  setProgress('LOGIC ROUTER · ROOM 1/3 · BRANCH RUNNER · STAGE '+stageNo+'/3');
  const root=active.root;
  root.appendChild(roomHeader('ROOM 1 · BRANCH RUNNER','Route TRUE and FALSE packets',cfg.copy));

  const info=document.createElement('div');info.className='adventure-info-strip';
  info.innerHTML='<span><strong>TRUE</strong> condition passes</span><span><strong>FALSE</strong> condition fails</span><span><strong>STAGE '+stageNo+'</strong> '+cfg.rounds+' packets</span>';
  root.appendChild(info);

  const panel=document.createElement('div');panel.className='branch-runner';
  const code=document.createElement('div');code.className='branch-code';
  const value=document.createElement('div');value.className='branch-value';
  const track=document.createElement('div');track.className='branch-track';track.tabIndex=-1;
  const packet=document.createElement('div');packet.className='branch-packet';packet.textContent='DATA';
  const fork=document.createElement('div');fork.className='branch-fork';
  const falseGate=document.createElement('div');falseGate.className='branch-gate false';falseGate.innerHTML='<strong>FALSE</strong><span>←</span>';
  const trueGate=document.createElement('div');trueGate.className='branch-gate true';trueGate.innerHTML='<strong>TRUE</strong><span>→</span>';
  fork.append(falseGate,trueGate);track.append(packet,fork);
  const status=document.createElement('div');status.className='logic-status';
  const controls=document.createElement('div');controls.className='branch-controls';
  const falseButton=document.createElement('button');falseButton.type='button';falseButton.className='branch-choice false';falseButton.textContent='FALSE';
  const trueButton=document.createElement('button');trueButton.type='button';trueButton.className='branch-choice true';trueButton.textContent='TRUE';
  controls.append(falseButton,trueButton);
  panel.append(code,value,track,status,controls);root.appendChild(panel);

  const rng=rngFromSeed(active.seed+':branch-runner:'+stageNo);
  const trials=Array.from({length:cfg.rounds},(_,i)=>branchTrial(stageIndex,rng,i));
  let round=0,trial=null,progress=0,timer=null,locked=false,finished=false;

  function stopTick(){if(timer){clearInterval(timer);active?.timers?.delete(timer);timer=null;}}
  function showTrial(){
    if(finished)return;
    trial=trials[round];progress=0;locked=false;
    code.textContent=trial.code;value.textContent=trial.value;
    status.textContent='PACKET '+(round+1)+'/'+cfg.rounds+' · Is the condition TRUE or FALSE?';
    packet.style.top='5%';packet.classList.remove('true','false','fault');
    led()?.setCells([[0,2],[4,0],[4,4]]);
    stopTick();
    timer=every(()=>{
      progress+=50/cfg.duration;
      const top=5+Math.min(1,progress)*66;
      packet.style.top=top+'%';
      const row=Math.max(0,Math.min(3,Math.floor(Math.min(1,progress)*4)));
      led()?.setCells([[row,2],[4,0],[4,4]]);
      if(progress>=1){stopTick();resolve(null);}
    },50);
  }
  function next(){
    round++;
    if(round>=trials.length){
      finished=true;stopTick();led()?.setPattern('check');
      if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,1);
      finishRoomStage(
        'Branch Runner stage '+stageNo+'/3 complete',
        stageIndex===0?'Next: mixed comparison operators.':'Next: compound AND conditions with two readings.',
        'Branch Runner restored',
        'All three TRUE/FALSE routing stages are stable.',
        'Open Decision Engine →',
        ()=>{active.room=1;renderRoom();}
      );
      return;
    }
    later(showTrial,650);
  }
  function resolve(answer){
    if(locked||finished)return;
    locked=true;stopTick();
    const correct=answer===trial.result;
    if(correct){
      packet.classList.add(trial.result?'true':'false');
      packet.style.top='76%';
      active.playTone(720,.055,'sine',.025);led()?.setPattern('check');
      showNotice((trial.result?'TRUE':'FALSE')+' · '+trial.detail,'success',650);
      next();
      return;
    }
    active.branchFaults++;
    const depleted=applyAdventurePenalty();
    packet.classList.add('fault');active.playTone(150,.08,'square',.026);led()?.flash('x',330);
    if(depleted)return;
    const msg=answer==null?'Packet timed out. The condition was '+(trial.result?'TRUE.':'FALSE.'):'Not quite — '+trial.detail+' is '+(trial.result?'TRUE.':'FALSE.');
    showNotice(msg,'fault',1200);
    later(showTrial,800);
  }
  falseButton.addEventListener('click',()=>resolve(false));
  trueButton.addEventListener('click',()=>resolve(true));
  active.keyHandler=(e)=>{
    if(active?.systemId!=='3'||active.room!==0||locked||finished)return;
    if(e.key==='ArrowLeft'||e.key==='f'||e.key==='F'){e.preventDefault();resolve(false);}
    if(e.key==='ArrowRight'||e.key==='t'||e.key==='T'){e.preventDefault();resolve(true);}
  };
  document.addEventListener('keydown',active.keyHandler);

  const start=document.createElement('button');start.type='button';start.className='branch-start';start.textContent='Start stage '+stageNo+' →';
  start.addEventListener('click',()=>{start.remove();focusPlayArea(track,showTrial);});
  panel.insertBefore(start,controls);
  led()?.setPattern('question');
}


/* ---------------- Room 2: Decision Engine ---------------- */

function decisionChallenges(stage,seed){
  const rng=rngFromSeed(seed+':decision:'+stage);
  if(stage===0){
    const values=shuffled([2,4,6,7,9],rng).slice(0,4);
    return values.map(x=>({
      value:'x = '+x,
      code:'IF x > 5\n  output BIG\nELSE\n  output SMALL',
      options:['BIG','SMALL'],
      answer:x>5?'BIG':'SMALL',
      explain:x+' > 5 is '+(x>5?'TRUE, so BIG runs.':'FALSE, so ELSE runs.')
    }));
  }
  if(stage===1){
    const values=shuffled([2,4,5,6,8,9],rng).slice(0,5);
    return values.map(x=>({
      value:'number = '+x,
      code:'IF number < 5\n  output LOW\nELSE IF number = 5\n  output EQUAL\nELSE\n  output HIGH',
      options:['LOW','EQUAL','HIGH'],
      answer:x<5?'LOW':x===5?'EQUAL':'HIGH',
      explain:x<5?x+' < 5 is TRUE, so LOW runs.':x===5?x+' is not < 5, but it equals 5, so EQUAL runs.':x+' is neither < 5 nor = 5, so ELSE outputs HIGH.'
    }));
  }
  const modes=shuffled(['FULL POWER','SAFE MODE','STANDBY','FULL POWER','SAFE MODE','STANDBY'],rng);
  return modes.map((mode,index)=>{
    const highTemp=randomInt(rng,19,23);
    const highLight=randomInt(rng,48,62);
    const lowTemp=highTemp-randomInt(rng,3,5);
    const lowLight=highLight-randomInt(rng,10,16);
    let temp,light;
    if(mode==='FULL POWER'){
      temp=randomInt(rng,highTemp,highTemp+5);
      light=randomInt(rng,highLight,highLight+15);
    }else if(mode==='SAFE MODE'){
      if(index%2===0){
        temp=randomInt(rng,Math.max(8,lowTemp-5),lowTemp-1);
        light=randomInt(rng,lowLight,highLight+10);
      }else{
        temp=randomInt(rng,lowTemp,highTemp+5);
        light=randomInt(rng,Math.max(5,lowLight-12),lowLight-1);
      }
    }else{
      if(index%2===0){
        temp=randomInt(rng,lowTemp,highTemp-1);
        light=randomInt(rng,highLight,highLight+10);
      }else{
        temp=randomInt(rng,highTemp,highTemp+5);
        light=randomInt(rng,lowLight,highLight-1);
      }
    }
    const first=temp>=highTemp&&light>=highLight;
    const second=temp<lowTemp||light<lowLight;
    const answer=first?'FULL POWER':second?'SAFE MODE':'STANDBY';
    return {
      value:'temp = '+temp+' · light = '+light,
      code:'IF temp >= '+highTemp+' AND light >= '+highLight+'\n  output FULL POWER\nELSE IF temp < '+lowTemp+' OR light < '+lowLight+'\n  output SAFE MODE\nELSE\n  output STANDBY',
      options:['FULL POWER','SAFE MODE','STANDBY'],
      answer,
      explain:first
        ?'Both first-branch tests are true, so FULL POWER runs and the later branches are skipped.'
        :second
          ?'The first AND condition is false. At least one SAFE MODE test is true, so the ELSE IF branch runs.'
          :'The first AND condition is false, and neither SAFE MODE test is true, so the final ELSE outputs STANDBY.'
    };
  });
}

function renderDecisionEngine(){
  const stageIndex=active.roomStage||0,stageNo=stageIndex+1;
  const challenges=decisionChallenges(stageIndex,active.seed);
  setProgress('LOGIC ROUTER · ROOM 2/3 · DECISION ENGINE · STAGE '+stageNo+'/3');
  const root=active.root;
  const copies=[
    'Run test values through a simple IF / ELSE and choose the output that executes.',
    'The router now has IF / ELSE IF / ELSE. Only the first matching branch runs.',
    'Final stage: trace a changing sensor program that combines AND, OR, ELSE IF and ELSE. The only reliable way to answer is to run the code in order.'
  ];
  root.appendChild(roomHeader('ROOM 2 · DECISION ENGINE','Run the correct branch',copies[stageIndex]));

  if(stageIndex===2){
    const rules=document.createElement('div');rules.className='decision-rules';
    rules.innerHTML='<span><strong>AND</strong> both comparisons must be true</span><span><strong>OR</strong> either comparison can make the branch true</span><span><strong>ELSE IF</strong> tested only if the first IF was false</span><span><strong>ELSE</strong> runs if every earlier branch was false</span>';
    root.appendChild(rules);
  }

  const panel=document.createElement('div');panel.className='decision-engine';
  const progress=document.createElement('div');progress.className='decision-progress';
  const value=document.createElement('div');value.className='decision-value';
  const code=document.createElement('pre');code.className='decision-code';
  const options=document.createElement('div');options.className='decision-options';
  const status=document.createElement('div');status.className='logic-status';
  panel.append(progress,value,code,options,status);root.appendChild(panel);

  let index=0,locked=false;
  function paint(){
    const q=challenges[index];
    progress.textContent='STAGE '+stageNo+'/3 · TEST '+(index+1)+'/'+challenges.length;
    value.textContent=q.value;code.textContent=q.code;options.replaceChildren();
    q.options.forEach(label=>{
      const b=document.createElement('button');b.type='button';b.className='decision-option';b.textContent=label;
      b.addEventListener('click',()=>choose(label,b));options.appendChild(b);
    });
    status.textContent=stageIndex===0?'Which branch runs?':stageIndex===1?'Read the tests from top to bottom.':'Trace the program from the first IF. Which output actually runs?';
    locked=false;led()?.setPattern('question');
  }
  function choose(label,button){
    if(locked)return;
    const q=challenges[index];
    if(label!==q.answer){
      active.decisionFaults++;button.classList.add('wrong');
      const depleted=applyAdventurePenalty();active.playTone(150,.07,'square',.024);led()?.flash('x',340);
      if(depleted)return;
      showNotice(q.explain,'fault',1450);
      later(()=>button.classList.remove('wrong'),550);
      return;
    }
    locked=true;button.classList.add('correct');active.playTone(760,.06,'sine',.025);led()?.setPattern('check');
    status.textContent=q.explain;showNotice(q.answer+' · correct branch','success',750);
    later(()=>{
      index++;
      if(index<challenges.length){paint();return;}
      if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,2);
      finishRoomStage(
        'Decision Engine stage '+stageNo+'/3 complete',
        stageIndex===0?'Next: three-way IF / ELSE IF / ELSE decisions.':'Next: combine AND and OR inside a changing multi-branch program.',
        'Decision Engine restored',
        'Simple branches, else-if chains and compound AND/OR sensor decisions are all routing correctly.',
        'Open Comparator Matrix →',
        ()=>{active.room=2;renderRoom();}
      );
    },750);
  }
  paint();
}


/* ---------------- Room 3: Comparator Matrix / Futoshiki ----------------
 * Generator adapted from the verified 99 Club Studio Futoshiki engine.
 */

function logicFutoCells(n){
  return Array.from({length:n*n},(_,i)=>[Math.floor(i/n),i%n]);
}
function logicFutoLatinSolution(n,rng){
  const symbols=shuffled(Array.from({length:n},(_,i)=>i+1),rng);
  const rows=shuffled(Array.from({length:n},(_,i)=>i),rng);
  const cols=shuffled(Array.from({length:n},(_,i)=>i),rng);
  const shift=randomInt(rng,0,n-1);
  return rows.map(r=>cols.map(cc=>symbols[(r+cc+shift)%n]));
}
function logicFutoCount(n,givens,hSigns,vSigns,limit=2){
  const grid=Array.from({length:n},()=>Array(n).fill(0));
  for(const g of givens)grid[g.r][g.c]=g.v;
  let count=0;
  function valid(r,c,v){
    for(let i=0;i<n;i++){
      if(i!==c&&grid[r][i]===v)return false;
      if(i!==r&&grid[i][c]===v)return false;
    }
    const checks=[[r,c-1,'h',c-1],[r,c+1,'h',c],[r-1,c,'v',r-1],[r+1,c,'v',r]];
    for(const item of checks){
      const rr=item[0],cc=item[1],type=item[2],idx=item[3];
      if(rr<0||cc<0||rr>=n||cc>=n||!grid[rr][cc])continue;
      const sign=type==='h'?hSigns[r]?.[idx]:vSigns[idx]?.[c];
      if(!sign)continue;
      const other=grid[rr][cc];
      if(type==='h'){
        const left=cc<c?other:v,right=cc<c?v:other;
        if(sign==='<'&&!(left<right))return false;
        if(sign==='>'&&!(left>right))return false;
      }else{
        const top=rr<r?other:v,bottom=rr<r?v:other;
        if(sign==='^'&&!(top<bottom))return false;
        if(sign==='v'&&!(top>bottom))return false;
      }
    }
    return true;
  }
  function nextCell(){
    let best=null,bestCand=null;
    for(let r=0;r<n;r++)for(let cc=0;cc<n;cc++)if(!grid[r][cc]){
      const cand=[];
      for(let v=1;v<=n;v++)if(valid(r,cc,v))cand.push(v);
      if(!cand.length)return [r,cc,[]];
      if(!bestCand||cand.length<bestCand.length){best=[r,cc];bestCand=cand;if(cand.length===1)return [r,cc,cand];}
    }
    return best?[best[0],best[1],bestCand]:null;
  }
  function rec(){
    if(count>=limit)return;
    const nxt=nextCell();
    if(!nxt){count++;return;}
    const r=nxt[0],cc=nxt[1],cand=nxt[2];
    if(!cand.length)return;
    for(const v of cand){
      grid[r][cc]=v;rec();grid[r][cc]=0;
      if(count>=limit)return;
    }
  }
  rec();return count;
}
function logicFutoStageConfig(stage){
  return [
    {n:4,signRatio:.40,givenRatio:.38,maxGivens:10,maxAttempts:2,label:'GUIDED 4×4',copy:'More starting numbers and inequality signs introduce the rules.'},
    {n:5,signRatio:.27,givenRatio:.23,maxGivens:14,maxAttempts:2,label:'STANDARD 5×5',copy:'A larger grid with fewer starting numbers requires more comparison reasoning.'},
    {n:6,signRatio:.30,givenRatio:.10,maxGivens:20,maxAttempts:3,label:'CHALLENGE 6×6',copy:'The final matrix is larger again, with fewer fixed numbers and more inequality relationships to combine.'}
  ][stage]||null;
}
function makeLogicFutoshiki(stage,seed){
  const cfg=logicFutoStageConfig(stage),n=cfg.n;
  let best=null;
  for(let attempt=0;attempt<cfg.maxAttempts;attempt++){
    const rng=rngFromSeed(seed+':futo:'+attempt);
    const solution=logicFutoLatinSolution(n,rng);
    const allH=[],allV=[];
    for(let r=0;r<n;r++)for(let cc=0;cc<n-1;cc++)allH.push({r,cc,s:solution[r][cc]<solution[r][cc+1]?'<':'>'});
    for(let r=0;r<n-1;r++)for(let cc=0;cc<n;cc++)allV.push({r,cc,s:solution[r][cc]<solution[r+1][cc]?'^':'v'});
    const hPick=shuffled(allH,rng).slice(0,Math.max(2,Math.round(allH.length*cfg.signRatio)));
    const vPick=shuffled(allV,rng).slice(0,Math.max(2,Math.round(allV.length*cfg.signRatio)));
    const hSigns=Array.from({length:n},()=>Array(n-1).fill(''));
    const vSigns=Array.from({length:n-1},()=>Array(n).fill(''));
    hPick.forEach(x=>hSigns[x.r][x.cc]=x.s);
    vPick.forEach(x=>vSigns[x.r][x.cc]=x.s);

    const order=shuffled(logicFutoCells(n),rng);
    const givens=order.slice(0,Math.max(2,Math.round(n*n*cfg.givenRatio))).map(([r,cc])=>({r,c:cc,v:solution[r][cc]}));
    const givenSet=new Set(givens.map(g=>g.r+':'+g.c));
    for(const pos of order){
      if(logicFutoCount(n,givens,hSigns,vSigns,2)===1)break;
      const r=pos[0],cc=pos[1],k=r+':'+cc;
      if(givenSet.has(k))continue;
      givens.push({r,c:cc,v:solution[r][cc]});givenSet.add(k);
    }
    if(logicFutoCount(n,givens,hSigns,vSigns,2)!==1)continue;
    const display=Array.from({length:n},()=>Array(n).fill(0));
    givens.forEach(g=>display[g.r][g.c]=g.v);
    const candidate={n,cfg,solution,display,hSigns,vSigns,givens};
    if(!best||candidate.givens.length<best.givens.length)best=candidate;
    if(candidate.givens.length<=cfg.maxGivens)return candidate;
  }
  return best;
}

function logicFutoSatisfies(sign,a,b){
  if(a==null||b==null||!sign)return true;
  if(sign==='<')return a<b;
  if(sign==='>')return a>b;
  if(sign==='^')return a<b;
  return a>b;
}
function logicFutoCandidates(p,state,r,c){
  if(state[r][c])return [];
  const n=p.n,used=new Set(state[r].filter(Boolean));
  for(let rr=0;rr<n;rr++)if(state[rr][c])used.add(state[rr][c]);
  return Array.from({length:n},(_,i)=>i+1).filter(v=>{
    if(used.has(v))return false;
    if(c>0&&!logicFutoSatisfies(p.hSigns[r][c-1],state[r][c-1]||null,v))return false;
    if(c<n-1&&!logicFutoSatisfies(p.hSigns[r][c],v,state[r][c+1]||null))return false;
    if(r>0&&!logicFutoSatisfies(p.vSigns[r-1][c],state[r-1][c]||null,v))return false;
    if(r<n-1&&!logicFutoSatisfies(p.vSigns[r][c],v,state[r+1][c]||null))return false;
    return true;
  });
}

function renderLogicFutoshiki(){
  const stageIndex=active.roomStage||0,stageNo=stageIndex+1;
  const cfg=logicFutoStageConfig(stageIndex);
  setProgress('LOGIC ROUTER · ROOM 3/3 · COMPARATOR MATRIX · STAGE '+stageNo+'/3');
  const root=active.root;
  root.appendChild(roomHeader('ROOM 3 · COMPARATOR MATRIX','Repair the Futoshiki logic grid',cfg.copy));

  const rules=document.createElement('div');rules.className='futo-rules';
  rules.innerHTML='<span><strong>1…N</strong> once in every row</span><span><strong>1…N</strong> once in every column</span><span><strong>&lt; &gt;</strong> pointed side faces the smaller number</span>';
  root.appendChild(rules);

  const puzzle=makeLogicFutoshiki(stageIndex,active.seed+':logic-futo:'+stageNo);
  if(!puzzle){
    showTransition('Comparator generator fault','A unique Futoshiki board could not be generated.','Retry stage →',()=>renderRoom(),'fault');
    return;
  }
  const n=puzzle.n,state=puzzle.display.map(row=>row.slice());
  const givenMask=puzzle.display.map(row=>row.map(v=>v>0));
  let selected=null,finished=false;
  const cellButtons=new Map();

  const meta=document.createElement('div');meta.className='futo-meta';
  meta.innerHTML='<strong>'+cfg.label+'</strong><span>'+puzzle.givens.length+' starting numbers · '+(puzzle.hSigns.flat().filter(Boolean).length+puzzle.vSigns.flat().filter(Boolean).length)+' inequality signs</span>';

  const board=document.createElement('div');board.className='logic-futo-grid';
  board.dataset.futoSize=String(n);
  board.style.gridTemplateColumns='repeat('+(n*2-1)+',minmax(0,1fr))';
  board.style.gridTemplateRows='repeat('+(n*2-1)+',minmax(0,1fr))';

  function place(node,row,col){node.style.gridRow=String(row);node.style.gridColumn=String(col);board.appendChild(node);}
  for(let r=0;r<n;r++)for(let cc=0;cc<n;cc++){
    const b=document.createElement('button');b.type='button';b.className='futo-cell';b.dataset.r=String(r);b.dataset.c=String(cc);
    if(givenMask[r][cc]){b.classList.add('given');b.disabled=true;}
    else b.addEventListener('click',()=>selectCell(r,cc));
    cellButtons.set(r+':'+cc,b);place(b,r*2+1,cc*2+1);
    if(cc<n-1){
      const sign=puzzle.hSigns[r][cc];
      const s=document.createElement('div');s.className='futo-sign horizontal';s.textContent=sign||'';place(s,r*2+1,cc*2+2);
    }
    if(r<n-1){
      const sign=puzzle.vSigns[r][cc];
      const s=document.createElement('div');s.className='futo-sign vertical';s.textContent=sign==='^'?'∧':sign==='v'?'∨':'';place(s,r*2+2,cc*2+1);
    }
  }

  const keypad=document.createElement('div');keypad.className='futo-keypad';
  for(let v=1;v<=n;v++){
    const b=document.createElement('button');b.type='button';b.textContent=String(v);b.addEventListener('click',()=>enterValue(v));keypad.appendChild(b);
  }
  const clear=document.createElement('button');clear.type='button';clear.className='secondary';clear.textContent='Clear';clear.addEventListener('click',()=>enterValue(0));keypad.appendChild(clear);

  const actions=document.createElement('div');actions.className='futo-actions';
  const hint=document.createElement('button');hint.type='button';hint.className='secondary';hint.textContent='Highlight a useful cell';
  const check=document.createElement('button');check.type='button';check.textContent='Check matrix';
  actions.append(hint,check);
  const status=document.createElement('div');status.className='logic-status';

  root.append(meta,board,keypad,actions,status);

  function filledEditable(){
    let count=0,total=0;
    for(let r=0;r<n;r++)for(let cc=0;cc<n;cc++)if(!givenMask[r][cc]){total++;if(state[r][cc])count++;}
    return {count,total};
  }
  function paint(){
    for(let r=0;r<n;r++)for(let cc=0;cc<n;cc++){
      const b=cellButtons.get(r+':'+cc),v=state[r][cc];
      b.textContent=v?String(v):'';
      b.classList.toggle('selected',!!selected&&selected[0]===r&&selected[1]===cc);
    }
    const f=filledEditable();status.textContent='Stage '+stageNo+'/3 · '+f.count+'/'+f.total+' blanks filled · select a cell, then choose 1–'+n+'.';
    led()?.progress(f.count,f.total);
  }
  function selectCell(r,cc){
    if(finished||givenMask[r][cc])return;
    selected=[r,cc];
    cellButtons.forEach(b=>b.classList.remove('hint'));
    paint();
  }
  function enterValue(v){
    if(finished||!selected)return;
    const r=selected[0],cc=selected[1];
    state[r][cc]=v;
    const b=cellButtons.get(r+':'+cc);b.classList.remove('wrong','hint');
    paint();
  }
  hint.addEventListener('click',()=>{
    cellButtons.forEach(b=>b.classList.remove('hint'));
    const opts=[];
    for(let r=0;r<n;r++)for(let cc=0;cc<n;cc++)if(!givenMask[r][cc]&&!state[r][cc]){
      const cand=logicFutoCandidates(puzzle,state,r,cc);
      if(cand.length)opts.push({r,cc,count:cand.length});
    }
    opts.sort((a,b)=>a.count-b.count);
    const q=opts[0];
    if(!q){showNotice('Every cell is filled. Run Check matrix.','info',1100);return;}
    selected=[q.r,q.cc];cellButtons.get(q.r+':'+q.cc).classList.add('hint');paint();
    showNotice('Highlighted cell: row, column and inequalities leave '+q.count+' possible value'+(q.count===1?'':'s')+'.','info',1500);
  });
  check.addEventListener('click',()=>{
    let wrong=0,blank=0;
    cellButtons.forEach((b,k)=>{
      b.classList.remove('wrong');
      const parts=k.split(':').map(Number),r=parts[0],cc=parts[1],v=state[r][cc];
      if(!v)blank++;
      else if(v!==puzzle.solution[r][cc]){wrong++;if(!givenMask[r][cc])b.classList.add('wrong');}
    });
    if(!wrong&&!blank){
      finished=true;check.disabled=true;hint.disabled=true;keypad.querySelectorAll('button').forEach(b=>b.disabled=true);cellButtons.forEach(b=>b.disabled=true);
      active.playTone(920,.1,'sine',.04);led()?.setPattern('check');status.textContent='Stage '+stageNo+' comparator matrix valid.';
      if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,3);
      finishRoomStage(
        'Comparator Matrix stage '+stageNo+'/3 solved',
        stageIndex===0?'Next: a 5×5 matrix with fewer clues.':'Next: the 6×6 challenge matrix with sparse clues.',
        'Comparator Matrix restored',
        'All three Futoshiki grids have a valid unique solution.',
        'Continue →',
        ()=>{active.room=3;renderRoom();}
      );
      return;
    }
    if(wrong){
      active.futoshikiFaults++;const depleted=applyAdventurePenalty();active.playTone(150,.08,'square',.025);led()?.flash('x',380);
      if(depleted)return;
      showNotice(wrong+' entered number'+(wrong===1?' is':'s are')+' inconsistent with the solution.','fault',1350);
    }else showNotice(blank+' cell'+(blank===1?' is':'s are')+' still blank.','warn',1100);
  });

  paint();
}

/* ---------------- Logic Router final gate ---------------- */

function renderLogicRouterFinalGate(){
  setProgress('LOGIC ROUTER · FINAL DIAGNOSTIC READY');
  const root=active.root;
  root.appendChild(roomHeader(
    'LOGIC ROUTER STABLE',
    'Conditional decisions are routing correctly',
    'All nine Logic Router adventure stages are stable. The final boss is 12 questions split into three increasingly difficult sets of four.'
  ));

  const board=document.createElement('div');board.className='microbit-face full-face';
  board.innerHTML=microbitBoardMarkup().replace('BOOT OK','LOGIC OK');

  const real=document.createElement('div');real.className='reality-note real-note';
  real.innerHTML='<strong>What is real?</strong><span>Programs really do use comparisons and conditional branches to choose what runs next. Futoshiki is our logic-training model for comparison relationships; it is not an internal micro:bit subsystem.</span>';

  const totalFaults=active.branchFaults+active.decisionFaults+active.futoshikiFaults;
  const stats=document.createElement('div');stats.className='adventure-run-stats';
  stats.innerHTML='<span><strong>'+active.branchFaults+'</strong> branch faults</span><span><strong>'+active.decisionFaults+'</strong> decision faults</span><span><strong>'+active.futoshikiFaults+'</strong> matrix checks failed</span><span><strong>'+totalFaults+'</strong> total faults</span>';
  root.append(board,real,stats);led()?.setPattern('check');

  later(()=>showTransition(
    'Final diagnostic ready',
    'Nine adventure stages are complete. Clear three diagnostic stages of four questions to bring Logic Router online.',
    'Run 12-question diagnostic →',
    ()=>{
      if(active.completed)return;active.completed=true;
      const totalFaults=active.branchFaults+active.decisionFaults+active.futoshikiFaults;
      const statsOut={
        systemId:'3',
        branchFaults:active.branchFaults,
        decisionFaults:active.decisionFaults,
        futoshikiFaults:active.futoshikiFaults,
        totalFaults,
        roomsCompleted:active.roomsCompleted,
        roomRestarts:active.roomRestarts,
        bonusScore:Math.max(0,300-(active.branchFaults*18+active.decisionFaults*16+active.futoshikiFaults*22)-active.roomRestarts*25)
      };
      const done=active.onComplete;stop();done(statsOut);
    }
  ),250);
}


/* ============================================================
   SYSTEM 4 · SENSOR ARRAY
   ============================================================ */

/* ---------------- Room 1: Sensor Scanner ---------------- */

function sensorSweepConfig(stage){
  return [
    {n:5,target:5,nodes:2,lifetime:11000,label:'LIGHT SWEEP',copy:'Two live nodes appear. Reach and scan the DARK node where light < 50.'},
    {n:6,target:6,nodes:3,lifetime:13000,label:'TEMPERATURE SWEEP',copy:'Three live nodes appear and the HOT threshold changes every wave. Reach the node where temp > threshold.'},
    {n:7,target:6,nodes:3,lifetime:16000,label:'DUAL SENSOR SWEEP',copy:'The largest field uses two readings per node. Reach the one where temp and light are BOTH below their limits.'}
  ][stage]||null;
}
function sensorSweepWave(stage,seed,waveNo){
  const rng=rngFromSeed(seed+':sensor-sweep:'+stage+':'+waveNo);
  if(stage===0){
    const threshold=50;
    const alert={light:randomInt(rng,18,46),alert:true};
    const safe={light:randomInt(rng,50,82),alert:false};
    return {
      condition:'light < '+threshold,
      thresholdText:'DARK if light < '+threshold,
      nodes:shuffled([alert,safe],rng),
      explain:n=>'light '+n.light+(n.light<threshold?' < ':' ≥ ')+threshold
    };
  }
  if(stage===1){
    const threshold=randomInt(rng,25,32);
    const nodes=[
      {temp:randomInt(rng,threshold+1,threshold+7),alert:true},
      {temp:randomInt(rng,threshold-7,threshold),alert:false},
      {temp:randomInt(rng,threshold-7,threshold),alert:false}
    ];
    return {
      condition:'temp > '+threshold,
      thresholdText:'HOT if temp > '+threshold,
      nodes:shuffled(nodes,rng),
      explain:n=>'temp '+n.temp+(n.temp>threshold?' > ':' ≤ ')+threshold
    };
  }
  const tempLimit=randomInt(rng,16,20),lightLimit=randomInt(rng,42,58);
  const alert={temp:randomInt(rng,10,tempLimit-1),light:randomInt(rng,18,lightLimit-1),alert:true};
  const safeA={temp:randomInt(rng,tempLimit,tempLimit+7),light:randomInt(rng,18,lightLimit-1),alert:false};
  const safeB={temp:randomInt(rng,10,tempLimit-1),light:randomInt(rng,lightLimit,lightLimit+20),alert:false};
  return {
    condition:'temp < '+tempLimit+' AND light < '+lightLimit,
    thresholdText:'COLD & DARK only if BOTH tests are true',
    nodes:shuffled([alert,safeA,safeB],rng),
    explain:n=>'temp '+n.temp+(n.temp<tempLimit?' < ':' ≥ ')+tempLimit+' AND light '+n.light+(n.light<lightLimit?' < ':' ≥ ')+lightLimit
  };
}
function sensorSweepPositions(n,count,rng,player){
  const cells=[];
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
    if(player&&player[0]===r&&player[1]===c)continue;
    cells.push([r,c]);
  }
  return shuffled(cells,rng).slice(0,count);
}
function renderSensorScanner(){
  const stageIndex=active.roomStage||0,stageNo=stageIndex+1,cfg=sensorSweepConfig(stageIndex);
  setProgress('SENSOR ARRAY · ROOM 1/3 · SENSOR SWEEP · STAGE '+stageNo+'/3');
  const root=active.root;
  root.appendChild(roomHeader('ROOM 1 · SENSOR SWEEP','Hunt the sensor that crosses the threshold',cfg.copy));

  const info=document.createElement('div');info.className='adventure-info-strip';
  info.innerHTML='<span><strong>MOVE</strong> arrows / WASD</span><span><strong>SCAN</strong> Space / button</span><span><strong>MISS</strong> costs integrity</span><span><strong>TARGET</strong> '+cfg.target+' correct scans</span>';
  root.appendChild(info);

  const panel=document.createElement('div');panel.className='sensor-sweep';
  const top=document.createElement('div');top.className='sensor-sweep-top';
  const mode=document.createElement('small');mode.textContent=cfg.label;
  const progress=document.createElement('strong');
  top.append(mode,progress);
  const condition=document.createElement('div');condition.className='sensor-condition';
  const hint=document.createElement('div');hint.className='sensor-sweep-hint';
  const timer=document.createElement('div');timer.className='sensor-sweep-timer';
  const timerFill=document.createElement('i');timer.appendChild(timerFill);
  const field=document.createElement('div');field.className='sensor-sweep-grid';field.dataset.sweepSize=String(cfg.n);
  field.style.setProperty('--sweep-n',String(cfg.n));
  field.setAttribute('role','application');
  field.setAttribute('aria-label','Sensor Sweep field');
  const status=document.createElement('div');status.className='logic-status';

  const controls=document.createElement('div');controls.className='sensor-sweep-controls';
  const up=document.createElement('button');up.type='button';up.textContent='↑';up.className='sweep-up';up.setAttribute('aria-label','Move up');
  const left=document.createElement('button');left.type='button';left.textContent='←';left.className='sweep-left';left.setAttribute('aria-label','Move left');
  const scan=document.createElement('button');scan.type='button';scan.textContent='SCAN';scan.className='sweep-scan';
  const right=document.createElement('button');right.type='button';right.textContent='→';right.className='sweep-right';right.setAttribute('aria-label','Move right');
  const down=document.createElement('button');down.type='button';down.textContent='↓';down.className='sweep-down';down.setAttribute('aria-label','Move down');
  controls.append(up,left,scan,right,down);

  panel.append(top,condition,hint,timer,field,status,controls);
  root.appendChild(panel);

  const cells=[];
  for(let r=0;r<cfg.n;r++)for(let c=0;c<cfg.n;c++){
    const cell=document.createElement('div');cell.className='sensor-sweep-cell';cell.dataset.r=String(r);cell.dataset.c=String(c);
    field.appendChild(cell);cells.push(cell);
  }

  let player=[Math.floor(cfg.n/2),Math.floor(cfg.n/2)];
  let waveNo=0,score=0,wave=null,liveNodes=[],elapsed=0,tickId=null,locked=true,finished=false;
  const seed=active.seed+':sweep-stage-'+stageNo;

  function stopTick(){
    if(tickId){clearInterval(tickId);active?.timers?.delete(tickId);tickId=null;}
  }
  function nodeText(node){
    if(stageIndex===0)return '<small>LIGHT</small><strong>'+node.light+'</strong>';
    if(stageIndex===1)return '<small>TEMP</small><strong>'+node.temp+'°</strong>';
    return '<small>T '+node.temp+'°</small><strong>L '+node.light+'</strong>';
  }
  function renderField(){
    const nodeByKey=new Map(liveNodes.map(n=>[sensorFaultKey(n.pos[0],n.pos[1]),n]));
    for(const cell of cells){
      const r=+cell.dataset.r,c=+cell.dataset.c,k=sensorFaultKey(r,c);
      cell.replaceChildren();
      cell.classList.toggle('player',player[0]===r&&player[1]===c);
      cell.classList.toggle('live-node',nodeByKey.has(k));
      if(nodeByKey.has(k)){
        const node=nodeByKey.get(k),wrap=document.createElement('div');wrap.className='sensor-node-reading';
        wrap.innerHTML=nodeText(node);cell.appendChild(wrap);
      }
      if(player[0]===r&&player[1]===c){
        const p=document.createElement('span');p.className='sensor-sweep-player';p.textContent='◎';cell.appendChild(p);
      }
    }
    const mappedNodes=liveNodes.map(n=>led()?.mapPoint(n.pos[0],n.pos[1],cfg.n,cfg.n)).filter(Boolean);
    const mappedPlayer=led()?.mapPoint(player[0],player[1],cfg.n,cfg.n);
    led()?.setCells([...(mappedPlayer?[mappedPlayer]:[]),...mappedNodes]);
  }
  function setWave(){
    if(finished)return;
    locked=false;elapsed=0;
    wave=sensorSweepWave(stageIndex,seed,waveNo);
    const rng=rngFromSeed(seed+':positions:'+waveNo);
    const positions=sensorSweepPositions(cfg.n,wave.nodes.length,rng,player);
    liveNodes=wave.nodes.map((node,i)=>({...node,pos:positions[i]}));
    condition.textContent='SCAN IF '+wave.condition;
    hint.textContent=wave.thresholdText;
    progress.textContent='CALIBRATED '+score+'/'+cfg.target;
    status.textContent='Move to the matching live node and press SCAN before it expires.';
    timerFill.style.width='100%';renderField();
    stopTick();
    tickId=every(()=>{
      elapsed+=50;
      timerFill.style.width=Math.max(0,100-elapsed/cfg.lifetime*100)+'%';
      if(elapsed>=cfg.lifetime){stopTick();missWave();}
    },50);
  }
  function move(dr,dc){
    if(locked||finished)return;
    const nr=Math.max(0,Math.min(cfg.n-1,player[0]+dr));
    const nc=Math.max(0,Math.min(cfg.n-1,player[1]+dc));
    if(nr===player[0]&&nc===player[1])return;
    player=[nr,nc];active.playTone(320,.025,'sine',.012);renderField();
  }
  function nodeAtPlayer(){
    return liveNodes.find(n=>n.pos[0]===player[0]&&n.pos[1]===player[1])||null;
  }
  function missWave(){
    if(locked||finished)return;
    locked=true;active.sensorFaults++;
    const target=liveNodes.find(n=>n.alert);
    const depleted=applyAdventurePenalty();active.playTone(145,.09,'square',.028);led()?.flash('x',360);
    if(depleted)return;
    showNotice('Alert node expired. '+wave.explain(target)+' was TRUE.','fault',1350);
    waveNo++;later(setWave,950);
  }
  function scanHere(){
    if(locked||finished)return;
    const node=nodeAtPlayer();
    if(!node){
      showNotice('No live sensor at the scanner position.','warn',700);
      active.playTone(180,.035,'square',.015);return;
    }
    if(!node.alert){
      active.sensorFaults++;
      const depleted=applyAdventurePenalty();active.playTone(150,.08,'square',.026);led()?.flash('x',330);
      if(depleted)return;
      showNotice('Wrong sensor. '+wave.explain(node)+' is FALSE.','fault',1200);
      return;
    }
    locked=true;stopTick();score++;active.playTone(780,.07,'sine',.03);led()?.setPattern('check');
    showNotice('Sensor captured! '+wave.explain(node)+' is TRUE.','success',800);
    if(score>=cfg.target){
      finished=true;
      if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,1);
      finishRoomStage(
        'Sensor Sweep stage '+stageNo+'/3 complete',
        stageIndex===0?'Next: a larger field with changing temperature thresholds.':'Next: the 7×7 dual-sensor field using AND.',
        'Sensor Sweep calibrated',
        'All three moving sensor fields are responding to the correct threshold conditions.',
        'Open Variable Processor →',
        ()=>{active.room=1;renderRoom();}
      );
      return;
    }
    waveNo++;later(setWave,700);
  }

  up.addEventListener('click',()=>move(-1,0));
  down.addEventListener('click',()=>move(1,0));
  left.addEventListener('click',()=>move(0,-1));
  right.addEventListener('click',()=>move(0,1));
  scan.addEventListener('click',scanHere);
  active.keyHandler=(e)=>{
    if(active?.systemId!=='4'||active.room!==0||finished)return;
    const map={ArrowUp:[-1,0],w:[-1,0],W:[-1,0],ArrowDown:[1,0],s:[1,0],S:[1,0],ArrowLeft:[0,-1],a:[0,-1],A:[0,-1],ArrowRight:[0,1],d:[0,1],D:[0,1]};
    if(map[e.key]){e.preventDefault();move(map[e.key][0],map[e.key][1]);return;}
    if(e.key===' '||e.key==='Enter'){e.preventDefault();scanHere();}
  };
  document.addEventListener('keydown',active.keyHandler);

  const start=document.createElement('button');start.type='button';start.className='sensor-start';start.textContent='Start Sensor Sweep →';
  start.addEventListener('click',()=>{start.remove();focusPlayArea(field,setWave);});
  panel.insertBefore(start,field);
  led()?.setPattern('question');
}

/* ---------------- Room 2: Variable Processor ---------------- */

function variableOptions(correct,rng,spread=5){
  const set=new Set([correct]);
  let guard=0;
  while(set.size<4&&guard++<50){
    const delta=randomInt(rng,-spread,spread);
    const v=correct+delta;
    if(v>=0)set.add(v);
  }
  while(set.size<4)set.add(correct+set.size+1);
  return shuffled([...set],rng);
}
function variableChallenges(stage,seed){
  const rng=rngFromSeed(seed+':variable:'+stage);
  if(stage===0){
    const types=shuffled(['set','change','set','change','set','change'],rng);
    return types.map((type,i)=>{
      const start=randomInt(rng,4,20);
      if(type==='set'){
        const target=randomInt(rng,2,25);
        return {
          title:'SET THE REGISTER',
          registerLabel:'CURRENT VALUE',
          registerBefore:'value = '+start,
          registerAfter:'value = '+target,
          code:'SET value TO '+target,
          options:variableOptions(target,rng,6).map(String),
          answer:String(target),
          explain:'SET replaces the old value. The register becomes '+target+'.'
        };
      }
      const delta=randomInt(rng,2,8)*(rng()<.25?-1:1);
      const result=Math.max(0,start+delta);
      const actualDelta=result-start;
      return {
        title:'CHANGE THE REGISTER',
        registerLabel:'CURRENT VALUE',
        registerBefore:'value = '+start,
        registerAfter:'value = '+result,
        code:'CHANGE value BY '+(actualDelta>=0?'+':'')+actualDelta,
        options:variableOptions(result,rng,7).map(String),
        answer:String(result),
        explain:'CHANGE modifies the stored value: '+start+(actualDelta>=0?' + ':' - ')+Math.abs(actualDelta)+' = '+result+'.'
      };
    });
  }
  if(stage===1){
    return Array.from({length:5},(_,i)=>{
      const start=randomInt(rng,5,18);
      const d1=randomInt(rng,2,7);
      const d2=randomInt(rng,1,5);
      const mult=i%2===0?2:3;
      const subtract=i%2===0?d2:-d2;
      const mid=start+d1;
      const mid2=mid+subtract;
      const result=mid2*mult;
      const op2=subtract>=0?'CHANGE value BY +'+subtract:'CHANGE value BY '+subtract;
      return {
        title:'TRACE THE REGISTER',
        registerLabel:'STARTING VALUE',
        registerBefore:'value = '+start,
        registerAfter:'value = '+result,
        code:'CHANGE value BY +'+d1+'\n'+op2+'\nSET value TO value × '+mult,
        options:variableOptions(result,rng,Math.max(6,d1+d2)).map(String),
        answer:String(result),
        explain:start+' → '+mid+' → '+mid2+' → '+result+'. Apply every instruction in order.'
      };
    });
  }
  return Array.from({length:6},(_,i)=>{
    const tempMode=i%2===0;
    const sensor=tempMode?'temp':'light';
    const reading=tempMode?randomInt(rng,20,36):randomInt(rng,30,80);
    const readingAdjust=randomInt(rng,-3,3);
    const limitStart=tempMode?randomInt(rng,26,31):randomInt(rng,45,60);
    const limitAdjust=randomInt(rng,-4,4);
    const storedReading=Math.max(0,reading+readingAdjust);
    const storedLimit=Math.max(0,limitStart+limitAdjust);
    const alert=tempMode?storedReading>storedLimit:storedReading<storedLimit;
    const alertLabel=tempMode?'HOT':'DARK';
    return {
      title:(tempMode?'TEMPERATURE':'LIGHT')+' CALIBRATION',
      registerLabel:'STARTING MEMORY',
      registerBefore:sensor+' = '+reading+' · threshold = '+limitStart,
      registerAfter:sensor+' = '+storedReading+' · threshold = '+storedLimit,
      code:'CHANGE '+sensor+' BY '+(readingAdjust>=0?'+':'')+readingAdjust+
        '\nCHANGE threshold BY '+(limitAdjust>=0?'+':'')+limitAdjust+
        '\nIF '+sensor+(tempMode?' > ':' < ')+'threshold\n  OUTPUT '+alertLabel+'\nELSE\n  OUTPUT OK',
      options:[alertLabel,'OK'],
      answer:alert?alertLabel:'OK',
      explain:sensor+' becomes '+storedReading+' and threshold becomes '+storedLimit+'. '+storedReading+(tempMode?' > ':' < ')+storedLimit+' is '+(alert?'TRUE, so '+alertLabel+' runs.':'FALSE, so ELSE outputs OK.')
    };
  });
}
function renderVariableProcessor(){
  const stageIndex=active.roomStage||0,stageNo=stageIndex+1;
  const challenges=variableChallenges(stageIndex,active.seed);
  setProgress('SENSOR ARRAY · ROOM 2/3 · VARIABLE PROCESSOR · STAGE '+stageNo+'/3');
  const root=active.root;
  const copies=[
    'Decide what the register stores after SET or CHANGE. SET replaces; CHANGE modifies.',
    'Trace several updates in order. The value after one instruction becomes the input to the next.',
    'Apply sensor calibration changes and threshold changes before deciding which output runs.'
  ];
  root.appendChild(roomHeader('ROOM 2 · VARIABLE PROCESSOR','Track the value stored in memory',copies[stageIndex]));

  const note=document.createElement('div');note.className='reality-note';
  note.innerHTML='<strong>Variable = labelled storage</strong><span>A variable stores a value while the program runs. SET replaces that value; CHANGE adds or subtracts from the value already stored.</span>';
  root.appendChild(note);

  const panel=document.createElement('div');panel.className='variable-processor';
  const progress=document.createElement('div');progress.className='variable-progress';
  const title=document.createElement('div');title.className='variable-title';
  const register=document.createElement('div');register.className='variable-register';
  const registerLabel=document.createElement('small');
  const registerValue=document.createElement('strong');
  register.append(registerLabel,registerValue);
  const code=document.createElement('pre');code.className='variable-code';
  const options=document.createElement('div');options.className='variable-options';
  const status=document.createElement('div');status.className='logic-status';
  panel.append(progress,title,register,code,options,status);root.appendChild(panel);

  let index=0,locked=false;
  function paint(){
    const q=challenges[index];
    progress.textContent='STAGE '+stageNo+'/3 · PROGRAM '+(index+1)+'/'+challenges.length;
    title.textContent=q.title;code.textContent=q.code;
    registerLabel.textContent=q.registerLabel||'MEMORY REGISTER';
    registerValue.textContent=q.registerBefore||'?';
    register.classList.remove('resolved');
    options.replaceChildren();
    q.options.forEach(label=>{
      const b=document.createElement('button');b.type='button';b.className='variable-option';b.textContent=label;
      b.addEventListener('click',()=>choose(label,b));options.appendChild(b);
    });
    status.textContent=stageIndex===0?'What value is stored afterwards?':stageIndex===1?'Trace every update. What value remains?':'Use the calibrated stored values. Which output runs?';
    locked=false;led()?.setPattern('question');
  }
  function choose(label,button){
    if(locked)return;
    const q=challenges[index];
    if(label!==q.answer){
      active.variableFaults++;button.classList.add('wrong');
      const depleted=applyAdventurePenalty();active.playTone(150,.07,'square',.024);led()?.flash('x',340);
      if(depleted)return;
      showNotice(q.explain,'fault',1500);
      later(()=>button.classList.remove('wrong'),550);return;
    }
    locked=true;button.classList.add('correct');
    registerLabel.textContent=stageIndex===2?'UPDATED MEMORY':'RESULT';
    registerValue.textContent=q.registerAfter||q.answer;
    register.classList.add('resolved');
    active.playTone(760,.06,'sine',.025);led()?.setPattern('check');status.textContent=q.explain;
    later(()=>{
      index++;
      if(index<challenges.length){paint();return;}
      if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,2);
      finishRoomStage(
        'Variable Processor stage '+stageNo+'/3 complete',
        stageIndex===0?'Next: trace longer update sequences.':'Next: sensor readings, calibration changes and stored thresholds.',
        'Variable Processor restored',
        'SET, CHANGE, sequential updates and calibrated threshold variables are all tracking correctly.',
        'Open Sensor Fault Map →',
        ()=>{active.room=2;renderRoom();}
      );
    },800);
  }
  paint();
}


/* ---------------- Room 3: Sensor Fault Map / neighbour-count logic ---------------- */

function sensorFaultStageConfig(stage){
  return [
    {n:5,sensors:4,minClues:8,maxClues:15,subset:false,label:'5×5 · 4 TRIPPED',copy:'Every step can be deduced directly from a clue or the total number of tripped sensors — no guessing.'},
    {n:6,sensors:6,minClues:10,maxClues:21,subset:true,label:'6×6 · 6 TRIPPED',copy:'Combine direct clue deductions and overlapping clue neighbourhoods. Every move is logically forced.'},
    {n:7,sensors:8,minClues:12,maxClues:26,subset:true,label:'7×7 · 8 TRIPPED',copy:'Final stage: longer deduction chains and overlapping clues, but still no guessing is required.'}
  ][stage]||null;
}
function sensorFaultKey(r,c){return r+':'+c;}
function sensorFaultNeighbours(n,r,c,clueSet=null){
  const out=[];
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    if(!dr&&!dc)continue;
    const rr=r+dr,cc=c+dc,k=sensorFaultKey(rr,cc);
    if(rr<0||cc<0||rr>=n||cc>=n)continue;
    if(clueSet&&clueSet.has(k))continue;
    out.push([rr,cc]);
  }
  return out;
}
function sensorFaultClues(n,sensorSet,clueSet){
  const clues={};
  for(const k of clueSet){
    const parts=k.split(':').map(Number),r=parts[0],c=parts[1];
    clues[k]=sensorFaultNeighbours(n,r,c).filter(p=>sensorSet.has(sensorFaultKey(p[0],p[1]))).length;
  }
  return clues;
}
function sensorFaultCountSolutions(n,sensorCount,clues,limit=2){
  const clueSet=new Set(Object.keys(clues));
  const vars=[];
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
    const k=sensorFaultKey(r,c);
    if(!clueSet.has(k))vars.push([r,c]);
  }
  if(sensorCount>vars.length)return 0;
  const indexByKey=new Map(vars.map((p,i)=>[sensorFaultKey(p[0],p[1]),i]));
  const constraints=Object.entries(clues).map(([k,target])=>{
    const parts=k.split(':').map(Number);
    const ids=sensorFaultNeighbours(n,parts[0],parts[1],clueSet)
      .map(p=>indexByKey.get(sensorFaultKey(p[0],p[1]))).filter(i=>i!=null);
    return {target:Number(target),ids};
  });
  const varConstraints=Array.from({length:vars.length},()=>[]);
  constraints.forEach((con,ci)=>con.ids.forEach(i=>varConstraints[i].push(ci)));
  const order=Array.from({length:vars.length},(_,i)=>i).sort((a,b)=>varConstraints[b].length-varConstraints[a].length);
  const ones=new Int16Array(constraints.length);
  const unknown=new Int16Array(constraints.map(x=>x.ids.length));
  let count=0,selected=0,assigned=0;

  function assign(id,value,delta){
    for(const ci of varConstraints[id]){
      unknown[ci]-=delta;
      if(value)ones[ci]+=delta;
    }
    selected+=value*delta;assigned+=delta;
  }
  function valid(){
    for(let ci=0;ci<constraints.length;ci++){
      const t=constraints[ci].target;
      if(ones[ci]>t||ones[ci]+unknown[ci]<t)return false;
    }
    const remain=vars.length-assigned;
    if(selected>sensorCount||selected+remain<sensorCount)return false;
    return true;
  }
  function rec(pos){
    if(count>=limit)return;
    if(pos>=order.length){
      if(selected!==sensorCount)return;
      for(let ci=0;ci<constraints.length;ci++)if(ones[ci]!==constraints[ci].target)return;
      count++;return;
    }
    const id=order[pos];
    assign(id,1,1);if(valid())rec(pos+1);assign(id,1,-1);
    if(count>=limit)return;
    assign(id,0,1);if(valid())rec(pos+1);assign(id,0,-1);
  }
  rec(0);return count;
}

function sensorFaultConstraintState(n,clues,state){
  const clueSet=new Set(Object.keys(clues));
  return Object.entries(clues).map(([k,target])=>{
    const parts=k.split(':').map(Number);
    const cells=sensorFaultNeighbours(n,parts[0],parts[1],clueSet).map(p=>sensorFaultKey(p[0],p[1]));
    let tripped=0;
    const unknown=[];
    for(const cell of cells){
      const v=state.get(cell)||0;
      if(v===1)tripped++;
      else if(v===0)unknown.push(cell);
    }
    return {k,target:Number(target),tripped,need:Number(target)-tripped,unknown};
  });
}
function sensorFaultSetSubset(a,b){
  if(a.size>=b.size)return false;
  for(const x of a)if(!b.has(x))return false;
  return true;
}
function sensorFaultNextDeduction(n,sensorCount,clues,inputState=null,options={}){
  const clueSet=new Set(Object.keys(clues));
  const state=new Map();
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
    const k=sensorFaultKey(r,c);
    if(clueSet.has(k))continue;
    let v=0;
    if(inputState instanceof Map)v=Number(inputState.get(k)||0);
    else if(Array.isArray(inputState))v=Number(inputState[r]?.[c]||0);
    state.set(k,v===1?1:v===2?2:0);
  }

  const constraints=sensorFaultConstraintState(n,clues,state);
  for(const con of constraints){
    if(con.need<0||con.need>con.unknown.length)return {contradiction:true,reason:'clue',clues:[con.k],cells:[]};
    if(!con.unknown.length)continue;
    if(con.need===0){
      return {value:2,technique:'direct-safe',clues:[con.k],cells:con.unknown.slice(),target:con.target,state};
    }
    if(con.need===con.unknown.length){
      return {value:1,technique:'direct-tripped',clues:[con.k],cells:con.unknown.slice(),target:con.target,state};
    }
  }

  const allUnknown=[...state.entries()].filter(([,v])=>v===0).map(([k])=>k);
  const marked=[...state.values()].filter(v=>v===1).length;
  if(allUnknown.length){
    if(marked===sensorCount)return {value:2,technique:'global-safe',clues:[],cells:allUnknown,target:sensorCount,state};
    if(marked+allUnknown.length===sensorCount)return {value:1,technique:'global-tripped',clues:[],cells:allUnknown,target:sensorCount,state};
  }

  if(options.subset){
    for(let i=0;i<constraints.length;i++)for(let j=0;j<constraints.length;j++){
      if(i===j)continue;
      const a=constraints[i],b=constraints[j];
      if(!a.unknown.length||!b.unknown.length)continue;
      const A=new Set(a.unknown),B=new Set(b.unknown);
      if(!sensorFaultSetSubset(A,B))continue;
      const diff=[...B].filter(x=>!A.has(x));
      if(!diff.length)continue;
      const need=b.need-a.need;
      if(need<0||need>diff.length)return {contradiction:true,reason:'subset',clues:[a.k,b.k],cells:diff};
      if(need===0)return {value:2,technique:'subset-safe',clues:[a.k,b.k],cells:diff,target:0,state};
      if(need===diff.length)return {value:1,technique:'subset-tripped',clues:[a.k,b.k],cells:diff,target:need,state};
    }
  }
  return null;
}
function sensorFaultLogicalSolve(n,sensorCount,clues,options={}){
  const clueSet=new Set(Object.keys(clues));
  const state=new Map();
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
    const k=sensorFaultKey(r,c);
    if(!clueSet.has(k))state.set(k,0);
  }
  const steps=[];
  const maxSteps=n*n*4;
  for(let guard=0;guard<maxSteps;guard++){
    if([...state.values()].every(v=>v!==0)){
      const tripped=[...state.values()].filter(v=>v===1).length;
      const constraints=sensorFaultConstraintState(n,clues,state);
      const valid=tripped===sensorCount&&constraints.every(x=>x.need===0&&x.unknown.length===0);
      return {solved:valid,contradiction:!valid,state,steps};
    }
    const step=sensorFaultNextDeduction(n,sensorCount,clues,state,options);
    if(!step)return {solved:false,contradiction:false,state,steps,stuck:true};
    if(step.contradiction)return {solved:false,contradiction:true,state,steps};
    let changed=0;
    for(const k of step.cells){
      if((state.get(k)||0)===0){state.set(k,step.value);changed++;}
      else if(state.get(k)!==step.value)return {solved:false,contradiction:true,state,steps};
    }
    if(!changed)return {solved:false,contradiction:false,state,steps,stuck:true};
    steps.push({...step,state:undefined});
  }
  return {solved:false,contradiction:false,state,steps,stuck:true};
}

function makeSensorFaultMap(stage,seed){
  const cfg=sensorFaultStageConfig(stage),n=cfg.n;
  let best=null;
  for(let attempt=0;attempt<80;attempt++){
    const rng=rngFromSeed(seed+':fault-map:'+attempt);
    const all=shuffled(Array.from({length:n*n},(_,i)=>[Math.floor(i/n),i%n]),rng);
    const sensorSet=new Set(all.slice(0,cfg.sensors).map(p=>sensorFaultKey(p[0],p[1])));
    const safe=all.filter(p=>!sensorSet.has(sensorFaultKey(p[0],p[1])));
    const initial=Math.min(safe.length,Math.max(cfg.minClues,Math.round(n*n*.38)));
    const clueSet=new Set(shuffled(safe,rng).slice(0,initial).map(p=>sensorFaultKey(p[0],p[1])));
    let remaining=shuffled(safe.filter(p=>!clueSet.has(sensorFaultKey(p[0],p[1]))),rng);
    let clues=sensorFaultClues(n,sensorSet,clueSet);
    let unique=sensorFaultCountSolutions(n,cfg.sensors,clues,2)===1;
    let logic=sensorFaultLogicalSolve(n,cfg.sensors,clues,{subset:cfg.subset});

    while((!unique||!logic.solved)&&remaining.length){
      const p=remaining.pop();
      clueSet.add(sensorFaultKey(p[0],p[1]));
      clues=sensorFaultClues(n,sensorSet,clueSet);
      unique=sensorFaultCountSolutions(n,cfg.sensors,clues,2)===1;
      logic=sensorFaultLogicalSolve(n,cfg.sensors,clues,{subset:cfg.subset});
    }
    if(!unique||!logic.solved)continue;

    for(const k of shuffled([...clueSet],rng)){
      if(clueSet.size<=cfg.minClues)break;
      clueSet.delete(k);
      const trial=sensorFaultClues(n,sensorSet,clueSet);
      const trialUnique=sensorFaultCountSolutions(n,cfg.sensors,trial,2)===1;
      const trialLogic=trialUnique?sensorFaultLogicalSolve(n,cfg.sensors,trial,{subset:cfg.subset}):null;
      if(trialUnique&&trialLogic?.solved){
        clues=trial;
        logic=trialLogic;
      }else clueSet.add(k);
    }

    clues=sensorFaultClues(n,sensorSet,clueSet);
    logic=sensorFaultLogicalSolve(n,cfg.sensors,clues,{subset:cfg.subset});
    if(!logic.solved)continue;
    const candidate={
      n,cfg,sensorSet:[...sensorSet],clues,
      logicSteps:logic.steps.length,
      logicTechniques:[...new Set(logic.steps.map(s=>s.technique))]
    };
    if(!best||Object.keys(candidate.clues).length<Object.keys(best.clues).length)best=candidate;
    if(Object.keys(candidate.clues).length<=cfg.maxClues)return candidate;
  }
  return best;
}

function renderSensorFaultMap(){
  const stageIndex=active.roomStage||0,stageNo=stageIndex+1,cfg=sensorFaultStageConfig(stageIndex);
  setProgress('SENSOR ARRAY · ROOM 3/3 · SENSOR FAULT MAP · STAGE '+stageNo+'/3');
  const root=active.root;
  root.appendChild(roomHeader('ROOM 3 · SENSOR FAULT MAP','Deduce which sensors are over threshold',cfg.copy));

  const rules=document.createElement('div');rules.className='sensor-map-rules';
  rules.innerHTML='<span><strong>NUMBER</strong> = tripped sensors in the surrounding 8 squares</span><span><strong>!</strong> mark TRIPPED</span><span><strong>×</strong> mark SAFE</span>';
  root.appendChild(rules);

  const puzzle=makeSensorFaultMap(stageIndex,active.seed+':sensor-map:'+stageNo);
  if(!puzzle){
    showTransition('Fault-map generator error','A unique sensor map could not be generated.','Retry stage →',()=>renderRoom(),'fault');
    return;
  }
  const n=puzzle.n,solution=new Set(puzzle.sensorSet),clues=puzzle.clues,clueSet=new Set(Object.keys(clues));
  const state=Array.from({length:n},()=>Array(n).fill(0));
  let finished=false,hintClues=new Set(),hintCells=new Set();
  const cellButtons=new Map(),clueNodes=new Map();

  const meta=document.createElement('div');meta.className='sensor-map-meta';
  meta.innerHTML='<strong>'+cfg.label+'</strong><span>'+Object.keys(clues).length+' clues · '+(puzzle.logicSteps||0)+' forced deduction steps · NO GUESSING</span>';

  const board=document.createElement('div');board.className='sensor-map-grid';board.dataset.sensorMapSize=String(n);board.style.setProperty('--sensor-map-n',String(n));
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
    const k=sensorFaultKey(r,c);
    if(clueSet.has(k)){
      const d=document.createElement('div');d.className='sensor-map-cell clue';d.dataset.key=k;
      const small=document.createElement('small');small.textContent='CLUE';
      const strong=document.createElement('strong');strong.textContent=String(clues[k]);
      d.append(small,strong);board.appendChild(d);clueNodes.set(k,d);
    }else{
      const b=document.createElement('button');b.type='button';b.className='sensor-map-cell';b.dataset.r=String(r);b.dataset.c=String(c);
      b.addEventListener('click',()=>cycle(r,c));board.appendChild(b);cellButtons.set(k,b);
    }
  }

  const actions=document.createElement('div');actions.className='sensor-map-actions';
  const hint=document.createElement('button');hint.type='button';hint.className='secondary';hint.textContent='Highlight a useful clue';
  const check=document.createElement('button');check.type='button';check.textContent='Check sensor map';
  actions.append(hint,check);
  const status=document.createElement('div');status.className='logic-status';
  root.append(meta,board,actions,status);

  function candidateNeighbours(k){
    const parts=k.split(':').map(Number);
    return sensorFaultNeighbours(n,parts[0],parts[1],clueSet);
  }
  function clueState(k){
    const ns=candidateNeighbours(k),target=Number(clues[k]);
    let tripped=0,unknown=0;
    for(const p of ns){
      const v=state[p[0]][p[1]];
      if(v===1)tripped++;else if(v===0)unknown++;
    }
    return {
      target,tripped,unknown,
      satisfied:tripped===target,
      over:tripped>target,
      impossible:tripped+unknown<target,
      forcedTripped:unknown>0&&target-tripped===unknown,
      forcedSafe:unknown>0&&tripped===target
    };
  }
  function markedTripped(){
    const set=new Set();
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(state[r][c]===1)set.add(sensorFaultKey(r,c));
    return set;
  }
  function wrongMarks(){
    const bad=[];
    for(const [k,b] of cellButtons){
      const r=+b.dataset.r,c=+b.dataset.c,v=state[r][c],isTrip=solution.has(k);
      if((v===1&&!isTrip)||(v===2&&isTrip))bad.push(k);
    }
    return bad;
  }
  function paint(){
    const marked=markedTripped(),bad=new Set();
    for(const [k,b] of cellButtons){
      const r=+b.dataset.r,c=+b.dataset.c,v=state[r][c];
      b.classList.toggle('tripped',v===1);b.classList.toggle('safe',v===2);
      b.classList.toggle('hint',hintCells.has(k));
      b.classList.toggle('wrong',bad.has(k));
      b.textContent=v===1?'!':v===2?'×':'';
      b.setAttribute('aria-label','Row '+(r+1)+', column '+(c+1)+(v===1?', tripped':v===2?', safe':', unknown'));
    }
    for(const [k,d] of clueNodes){
      const s=clueState(k);
      d.classList.toggle('satisfied',s.satisfied&&!s.over&&!s.impossible);
      d.classList.toggle('over',s.over);d.classList.toggle('impossible',s.impossible);d.classList.toggle('hint',hintClues.has(k));
    }
    status.textContent='Stage '+stageNo+'/3 · '+marked.size+'/'+cfg.sensors+' tripped sensors marked · tap: ! → × → clear.';
    const ledCells=[...marked].map(k=>{const p=k.split(':').map(Number);return led()?.mapPoint(p[0],p[1],n,n);}).filter(Boolean);
    led()?.setCells(ledCells);
  }
  function cycle(r,c){
    if(finished)return;
    state[r][c]=(state[r][c]+1)%3;hintClues.clear();hintCells.clear();
    cellButtons.forEach(b=>b.classList.remove('wrong'));paint();
  }
  hint.addEventListener('click',()=>{
    hintClues.clear();hintCells.clear();
    const step=sensorFaultNextDeduction(n,cfg.sensors,clues,state,{subset:cfg.subset});
    if(!step){
      if(wrongMarks().length)showNotice('Your current marks no longer leave a forced deduction. Use Check sensor map to review them first.','warn',1700);
      else showNotice('No unresolved forced move remains. Run Check sensor map.','info',1300);
      paint();return;
    }
    if(step.contradiction){
      showNotice('The current marks contradict a clue. Use Check sensor map to find the problem.','fault',1600);
      paint();return;
    }
    step.clues.forEach(k=>hintClues.add(k));
    step.cells.forEach(k=>hintCells.add(k));
    paint();

    function clueLabel(k){
      const p=k.split(':').map(Number);
      return 'clue '+clues[k]+' at row '+(p[0]+1)+', column '+(p[1]+1);
    }
    let message='';
    if(step.technique==='direct-safe'){
      message=clueLabel(step.clues[0])+' already has all the tripped neighbours it needs. Every highlighted unknown cell is SAFE.';
    }else if(step.technique==='direct-tripped'){
      message=clueLabel(step.clues[0])+' still needs exactly '+step.cells.length+' tripped sensor'+(step.cells.length===1?'':'s')+', and exactly that many unknown neighbours remain. Highlighted cells are TRIPPED.';
    }else if(step.technique==='global-safe'){
      message='All '+cfg.sensors+' tripped sensors are already accounted for. Every highlighted unknown cell is SAFE.';
    }else if(step.technique==='global-tripped'){
      message='Exactly '+step.cells.length+' tripped sensor'+(step.cells.length===1?' remains':'s remain')+' to place, and exactly '+step.cells.length+' cells are unknown. Highlighted cells are TRIPPED.';
    }else if(step.technique==='subset-safe'){
      message='Compare '+clueLabel(step.clues[0])+' with '+clueLabel(step.clues[1])+'. Their shared unknown cells account for the required faults, so the highlighted extra cells are SAFE.';
    }else if(step.technique==='subset-tripped'){
      message='Compare '+clueLabel(step.clues[0])+' with '+clueLabel(step.clues[1])+'. After cancelling the shared unknown cells, every highlighted extra cell must be TRIPPED.';
    }
    showNotice(message||'The highlighted cells are forced by the clues.','info',2400);
  });
  check.addEventListener('click',()=>{
    const marked=markedTripped(),wrong=wrongMarks();
    cellButtons.forEach(b=>b.classList.remove('wrong'));
    if(marked.size===solution.size&&[...solution].every(k=>marked.has(k))&&!wrong.length){
      finished=true;check.disabled=true;hint.disabled=true;cellButtons.forEach(b=>b.disabled=true);
      active.playTone(920,.1,'sine',.04);led()?.setPattern('check');status.textContent='Stage '+stageNo+' sensor map verified.';
      if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,3);
      finishRoomStage(
        'Sensor Fault Map stage '+stageNo+'/3 solved',
        stageIndex===0?'Next: a 6×6 map with six hidden faults.':'Next: the 7×7 map with eight hidden faults.',
        'Sensor Fault Map restored',
        'All three neighbour-count logic maps have been solved.',
        'Continue →',
        ()=>{active.room=3;renderRoom();}
      );
      return;
    }
    if(wrong.length){
      active.faultMapFaults++;
      for(const k of wrong)cellButtons.get(k)?.classList.add('wrong');
      const depleted=applyAdventurePenalty();active.playTone(150,.08,'square',.025);led()?.flash('x',380);
      if(depleted)return;
      showNotice(wrong.length+' mark'+(wrong.length===1?' is':'s are')+' inconsistent with the sensor clues.','fault',1350);return;
    }
    if(marked.size>cfg.sensors){showNotice('Too many sensors are marked TRIPPED. This map contains '+cfg.sensors+'.','warn',1200);return;}
    showNotice('No incorrect marks so far. '+Math.max(0,cfg.sensors-marked.size)+' tripped sensor'+(cfg.sensors-marked.size===1?' remains':'s remain')+' to find.','info',1200);
  });
  paint();
}

/* ---------------- Sensor Array final gate ---------------- */

function renderSensorArrayFinalGate(){
  setProgress('SENSOR ARRAY · FINAL DIAGNOSTIC READY');
  const root=active.root;
  root.appendChild(roomHeader(
    'SENSOR ARRAY STABLE',
    'Stored values and sensor thresholds are calibrated',
    'All nine Sensor Array adventure stages are stable. The final boss is 12 questions split into three increasingly difficult sets of four.'
  ));
  const board=document.createElement('div');board.className='microbit-face full-face';
  board.innerHTML=microbitBoardMarkup().replace('BOOT OK','SENSOR OK');
  const real=document.createElement('div');real.className='reality-note real-note';
  real.innerHTML='<strong>Inside the real micro:bit</strong><span>Programs can store changing values in variables and compare live light or temperature readings against thresholds. The hidden fault map is a logic-training model, not a literal sensor layout inside the board.</span>';
  const totalFaults=active.sensorFaults+active.variableFaults+active.faultMapFaults;
  const stats=document.createElement('div');stats.className='adventure-run-stats';
  stats.innerHTML='<span><strong>'+active.sensorFaults+'</strong> scan faults</span><span><strong>'+active.variableFaults+'</strong> variable faults</span><span><strong>'+active.faultMapFaults+'</strong> map-check faults</span><span><strong>'+totalFaults+'</strong> total faults</span>';
  root.append(board,real,stats);led()?.setPattern('check');

  later(()=>showTransition(
    'Final diagnostic ready',
    'Nine adventure stages are complete. Clear three diagnostic stages of four questions to bring Sensor Array online.',
    'Run 12-question diagnostic →',
    ()=>{
      if(active.completed)return;active.completed=true;
      const totalFaults=active.sensorFaults+active.variableFaults+active.faultMapFaults;
      const statsOut={
        systemId:'4',
        sensorFaults:active.sensorFaults,
        variableFaults:active.variableFaults,
        faultMapFaults:active.faultMapFaults,
        totalFaults,
        roomsCompleted:active.roomsCompleted,
        roomRestarts:active.roomRestarts,
        bonusScore:Math.max(0,300-(active.sensorFaults*18+active.variableFaults*16+active.faultMapFaults*22)-active.roomRestarts*25)
      };
      const done=active.onComplete;stop();done(statsOut);
    }
  ),250);
}

function microbitBoardMarkup(){
  return `
    <div class="official-microbit-final">
      <object
        class="official-microbit-object"
        data="assets/microbit/microbit-drawing-v2.svg"
        type="image/svg+xml"
        aria-label="BBC micro:bit v2 front view with live LED display"
      >
        <img class="official-microbit-img" src="assets/microbit/microbit-drawing-v2.svg" alt="BBC micro:bit v2 front view" />
      </object>
      <div class="boot-ok-pill">BOOT OK</div>
    </div>
  `;
}

/* ---------------- Handoff to final diagnostic ---------------- */

function renderFinalGate(){
  setProgress('BOOT SEQUENCE · FINAL DIAGNOSTIC READY');
  const root=active.root;
  root.appendChild(roomHeader(
    'BOOT PATH RESTORED',
    'The micro:bit can boot again',
    'All nine Boot Sequence adventure stages are stable. The final boss is 12 questions split into three increasingly difficult sets of four.'
  ));

  const board=document.createElement('div');board.className='microbit-face full-face';
  board.innerHTML=microbitBoardMarkup();

  const real=document.createElement('div');real.className='reality-note real-note';
  real.innerHTML='<strong>Inside the real micro:bit</strong><span>The board really does contain a microcontroller, memory, input/output connections, sensors, a 5×5 LED display, buttons and radio hardware. BIT, the corridors and roaming corruption are our game-world model of travelling through those systems.</span>';

  const stats=document.createElement('div');stats.className='adventure-run-stats';
  stats.innerHTML=`<span><strong>${active.bits.size}/12</strong> expedition items</span><span><strong>${active.arcadeFaults}</strong> corruption hits</span><span><strong>${active.sequenceFaults}</strong> sequence faults</span><span><strong>${active.memoryFaults}</strong> RAM checks failed</span>`;

  root.append(board,real,stats);

  later(()=>showTransition(
    'Final diagnostic ready',
    'Nine adventure stages are complete. Clear three diagnostic stages of four questions to bring Boot Sequence online.',
    'Run 12-question diagnostic →',
    ()=>{
      if(active.completed)return;active.completed=true;
      const statsOut={
        bits:active.bits.size,
        arcadeFaults:active.arcadeFaults,
        sequenceFaults:active.sequenceFaults,
        memoryFaults:active.memoryFaults,
        roomsCompleted:active.roomsCompleted,
        roomRestarts:active.roomRestarts,
        bonusScore:Math.max(0,300-(active.arcadeFaults*20+active.sequenceFaults*15+active.memoryFaults*25)-active.roomRestarts*25)
      };
      const done=active.onComplete;stop();done(statsOut);
    }
  ),250);
}

global.TTCAdventure={
  supports(id){return ['1','2','3','4'].includes(String(id));},
  start,
  stop,
  leds:global.TTCMicrobitLED||null
};

})(typeof globalThis!=='undefined'?globalThis:this);
