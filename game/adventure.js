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
function stop(){
  if(active?.keyHandler)document.removeEventListener('keydown',active.keyHandler);
  clearTimers();
  clearOverlay();
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
  if(active&&active.room<3){const stage=document.createElement('span');stage.className='room-stage-badge';stage.textContent=`STAGE ${Math.min(3,(active.roomStage||0)+1)}/3`;left.appendChild(stage);}
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


function powerBusConfig(stage){
  if(stage===0)return {
    rows:6,cols:9,start:[5,0],goal:[2,8],ordered:false,hazardMs:760,
    lines:[
      Array.from({length:4},(_,cc)=>[5,cc]),
      [[4,3],[3,3],[2,3]],
      [[4,4],[4,5],[4,6],[3,6],[2,6]],
      [[2,4],[2,5],[2,6],[2,7],[2,8]],
      [[1,6],[1,7],[1,8]],[[3,8],[4,8]]
    ],
    packets:[[5,2,'A'],[4,6,'B'],[2,5,'C']],
    hazards:[[[3,3],[2,3],[3,3],[4,3]]],
    copy:'Recover three boot packets and reach the processor. One corruption signal is moving through the bus.'
  };
  if(stage===1)return {
    rows:7,cols:10,start:[6,0],goal:[1,9],ordered:false,hazardMs:700,
    lines:[
      Array.from({length:5},(_,cc)=>[6,cc]),
      [[5,4],[4,4],[3,4]],
      Array.from({length:6},(_,i)=>[3,4+i]),
      [[2,9],[1,9]],[[5,5],[5,6],[5,7],[4,7],[3,7]],
      [[4,3],[4,2]],[[3,6],[2,6],[1,6]],[[1,7],[1,8],[1,9]]
    ],
    packets:[[6,2,'A'],[4,2,'B'],[5,7,'C'],[1,6,'D']],
    hazards:[
      [[5,4],[4,4],[3,4],[4,4]],
      [[3,6],[2,6],[1,6],[2,6]]
    ],
    copy:'The bus is larger now. Recover four packets while two corruption signals patrol the network.'
  };
  return {
    rows:8,cols:12,start:[7,0],goal:[2,11],ordered:true,hazardMs:650,
    lines:[
      Array.from({length:5},(_,cc)=>[7,cc]),
      [[6,4],[5,4],[4,4]],
      Array.from({length:7},(_,i)=>[4,4+i]),
      [[3,9],[2,9],[2,10],[2,11]],
      [[6,5],[6,6],[6,7],[5,7],[4,7]],[[5,3],[5,2]],
      [[4,6],[3,6],[2,6]],Array.from({length:6},(_,i)=>[2,6+i]),
      [[5,10],[4,10],[3,10],[2,10]],[[3,7],[2,7]]
    ],
    packets:[[7,2,'A'],[5,2,'B'],[6,7,'C'],[2,6,'D'],[3,10,'E']],
    hazards:[
      [[6,4],[5,4],[4,4],[5,4]],
      [[4,7],[3,7],[2,7],[3,7]],
      [[4,9],[3,9],[2,9],[3,9]]
    ],
    copy:'Final stage: recover five boot packets in order A → B → C → D → E while three corruption signals move.'
  };
}

function renderPulseRun(){
  const stageIndex=active.roomStage||0;
  const stageNo=stageIndex+1;
  const cfg=powerBusConfig(stageIndex);
  setProgress('BOOT SEQUENCE · ROOM 1/3 · POWER BUS · STAGE '+stageNo+'/3');
  const root=active.root;
  root.appendChild(roomHeader(
    'ROOM 1 · POWER BUS',
    cfg.ordered?'Route an ordered boot sequence':'Route the pulse through a live data bus',
    cfg.copy
  ));

  const info=document.createElement('div');info.className='adventure-info-strip';
  info.innerHTML='<span><strong>YOU</strong> cyan pulse</span><span><strong>◆</strong> boot packet</span><span><strong>!</strong> moving corruption</span><span><strong>'+(cfg.ordered?'A→E':'ANY ORDER')+'</strong> pickup rule</span>';
  root.appendChild(info);

  const boardWrap=document.createElement('div');boardWrap.className='pulse-board-wrap';
  const board=document.createElement('div');board.className='pulse-board';
  board.setAttribute('role','application');
  board.setAttribute('aria-label','Live micro:bit power bus stage '+stageNo);
  board.style.setProperty('--pulse-cols',String(cfg.cols));
  board.style.setProperty('--pulse-rows',String(cfg.rows));
  board.style.aspectRatio=cfg.cols+'/'+cfg.rows;
  boardWrap.appendChild(board);

  const allowed=new Set();
  for(const line of cfg.lines)for(const pos of line)allowed.add(key(pos[0],pos[1]));

  const packetLocations=new Map(cfg.packets.map(p=>[key(p[0],p[1]),p[2]]));
  const packetOrder=cfg.packets.map(p=>p[2]);
  const collected=new Set();
  let player=cfg.start.slice(),roomFinished=false,live=false,faultLock=false;
  const hazards=cfg.hazards.map(route=>({route:route.map(p=>p.slice()),i:0}));

  const cells=[];
  for(let r=0;r<cfg.rows;r++)for(let cc=0;cc<cfg.cols;cc++){
    const cell=document.createElement('div');cell.className='pulse-cell';cell.dataset.key=key(r,cc);
    if(allowed.has(key(r,cc)))cell.classList.add('trace');
    if(same([r,cc],cfg.start))cell.classList.add('start-port');
    if(same([r,cc],cfg.goal))cell.classList.add('cpu-port');
    board.appendChild(cell);cells.push(cell);
  }

  const hud=document.createElement('div');hud.className='pulse-live-hud';
  const packetCount=document.createElement('strong');
  const instruction=document.createElement('span');instruction.textContent=cfg.ordered?'COLLECT A → B → C → D → E':'TAP ARROWS TO MOVE';
  const liveLabel=document.createElement('span');liveLabel.className='pulse-live-indicator';liveLabel.textContent='● CORRUPTION LIVE';
  hud.append(packetCount,instruction,liveLabel);

  const controls=document.createElement('div');controls.className='pulse-controls pulse-controls-four';controls.setAttribute('aria-label','Movement controls');
  const moves=[['↑','up',-1,0],['←','left',0,-1],['→','right',0,1],['↓','down',1,0]];
  for(const move of moves){
    const label=move[0],name=move[1],dr=move[2],dc=move[3];
    const b=document.createElement('button');b.type='button';b.className='pulse-control '+name;b.textContent=label;
    b.setAttribute('aria-label','Move '+name);
    b.addEventListener('click',()=>movePlayer(dr,dc,b));
    controls.appendChild(b);
  }
  const layout=document.createElement('div');layout.className='pulse-layout';layout.append(boardWrap,controls);root.append(hud,layout);

  function hazardKeys(){return new Set(hazards.map(h=>key(h.route[h.i][0],h.route[h.i][1])));}
  function render(){
    const hz=hazardKeys();
    for(const cell of cells){
      const parts=cell.dataset.key.split(':').map(Number),r=parts[0],cc=parts[1],k=cell.dataset.key;
      cell.classList.toggle('player',same([r,cc],player));cell.classList.toggle('hazard',hz.has(k));
      const packet=packetLocations.get(k),hasPacket=packet&&!collected.has(packet);
      cell.classList.toggle('boot-bit',!!hasPacket);cell.replaceChildren();
      if(same([r,cc],player)){const s=document.createElement('span');s.className='pulse-player';s.textContent='●';cell.appendChild(s);}
      else if(hz.has(k)){const s=document.createElement('span');s.className='pulse-hazard';s.textContent='!';cell.appendChild(s);}
      else if(hasPacket){const s=document.createElement('span');s.className='pulse-bit';s.textContent=packet;cell.appendChild(s);}
      else if(same([r,cc],cfg.goal)){const s=document.createElement('span');s.className='pulse-cpu';s.textContent='CPU';cell.appendChild(s);}
      else if(same([r,cc],cfg.start)){const s=document.createElement('span');s.className='pulse-usb';s.textContent='USB';cell.appendChild(s);}
    }
    const next=cfg.ordered?packetOrder[collected.size]:null;
    packetCount.textContent='BOOT PACKETS '+collected.size+'/'+packetOrder.length+(next?' · NEXT '+next:'');
    led()?.setCells([led().mapPoint(player[0],player[1],cfg.rows,cfg.cols)]);
  }

  function fault(){
    if(roomFinished||faultLock)return;
    faultLock=true;active.arcadeFaults++;
    const depleted=applyAdventurePenalty();
    player=cfg.start.slice();active.playTone(145,.1,'sawtooth',.03);
    board.classList.remove('fault');void board.offsetWidth;board.classList.add('fault');
    render();led()?.flash('x',330);
    if(depleted)return;
    showNotice('Corrupted signal! Pulse reset to USB.','fault',1200);
    later(()=>{faultLock=false;board.classList.remove('fault');},650);
  }

  function collectAndCheck(){
    const k=key(player[0],player[1]),packet=packetLocations.get(k);
    if(packet&&!collected.has(packet)){
      const expected=packetOrder[collected.size];
      if(cfg.ordered&&packet!==expected)showNotice('Packet '+packet+' is locked. Recover '+expected+' next.','warn',1050);
      else{collected.add(packet);active.playTone(700,.06,'sine',.03);showNotice('Boot packet '+packet+' recovered · '+collected.size+'/'+packetOrder.length,'success',900);}
    }
    if(!faultLock&&hazards.some(h=>same(h.route[h.i],player))){fault();return false;}
    if(same(player,cfg.goal)){
      if(collected.size===packetOrder.length){
        roomFinished=true;live=false;clearTimers();active.playTone(880,.09,'sine',.04);
        for(const name of packetOrder)active.bits.add('S'+stageNo+'-'+name);
        render();led()?.setPattern('check');
        if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,1);
        finishRoomStage(
          'Power Bus stage '+stageNo+'/3 stable',
          stageIndex===0?'Next: a larger bus with another corruption signal.':'Next: ordered packets and three moving corruption signals.',
          'Power bus fully restored',
          'All three routing stages are stable, including the ordered A → E boot path.',
          'Enter startup controller →',
          ()=>{active.room=1;renderRoom();}
        );
        return false;
      }
      const remaining=packetOrder.length-collected.size;
      showNotice('CPU reached — collect the remaining '+remaining+' boot packet'+(remaining===1?'':'s')+' first.','warn',1300);
    }
    return true;
  }

  function movePlayer(dr,dc,button){
    if(!live||roomFinished||faultLock)return;
    const next=[player[0]+dr,player[1]+dc];
    if(!allowed.has(key(next[0],next[1]))){showNotice('No trace in that direction. Choose a connected path.','warn',850);active.playTone(180,.035,'square',.015);return;}
    if(button){button.classList.add('pressed');later(()=>button.classList.remove('pressed'),100);}
    player=next;collectAndCheck();render();
  }
  function hazardTick(){
    if(!live||roomFinished)return;
    hazards.forEach(h=>{h.i=(h.i+1)%h.route.length;});
    if(!faultLock&&hazards.some(h=>same(h.route[h.i],player)))fault();
    render();
  }
  active.keyHandler=(e)=>{
    if(active?.room!==0||roomFinished)return;
    const map={ArrowUp:[-1,0],w:[-1,0],W:[-1,0],ArrowDown:[1,0],s:[1,0],S:[1,0],ArrowLeft:[0,-1],a:[0,-1],A:[0,-1],ArrowRight:[0,1],d:[0,1],D:[0,1]};
    const m=map[e.key];if(!m)return;e.preventDefault();movePlayer(m[0],m[1]);
  };
  document.addEventListener('keydown',active.keyHandler);

  render();showNotice('Stage '+stageNo+'/3 · get ready.','info',800);
  later(()=>{
    if(!active||active.room!==0||active.roomStage!==stageIndex)return;
    live=true;liveLabel.classList.add('active');every(hazardTick,cfg.hazardMs);
    showNotice('LIVE BUS · move when the path is clear.','success',950);
  },800);
}

/* ---------------- Room 2: simplified boot order ---------------- */




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
  const steps=bootOrderSteps(stageIndex);
  setProgress('BOOT SEQUENCE · ROOM 2/3 · STARTUP CONTROLLER · STAGE '+stageNo+'/3');
  const root=active.root;
  root.appendChild(roomHeader(
    'ROOM 2 · STARTUP CONTROLLER',
    'Rebuild the boot order',
    stageIndex===0
      ?'Start with a short three-step startup sequence.'
      :stageIndex===1
        ?'The controller now needs four startup operations in the correct order.'
        :'Final stage: place five startup operations in the correct order.'
  ));

  const note=document.createElement('div');note.className='reality-note';
  note.innerHTML='<strong>Game model</strong><span>Real micro:bit startup involves low-level boot code and hardware initialisation. These stages use a simplified sequence to practise algorithmic order.</span>';
  root.appendChild(note);

  const rng=rngFromSeed(active.seed+':sequence:'+stageNo);
  const cards=shuffled(steps,rng);
  let nextIndex=0;

  const chain=document.createElement('div');chain.className='boot-chain';
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
      nextIndex++;active.playTone(580+nextIndex*65,.05,'sine',.025);led()?.progress(nextIndex,steps.length);
      if(nextIndex===steps.length){
        status.textContent='Stage '+stageNo+' startup order valid.';led()?.setPattern('check');
        if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,2);
        finishRoomStage(
          'Startup stage '+stageNo+'/3 valid',
          stageIndex===0?'Next: add hardware checking to the startup sequence.':'Next: add another initialisation step and solve the five-step sequence.',
          'Startup controller fully restored',
          'All three startup-order stages are valid.',
          'Open RAM bank →',
          ()=>{active.room=2;renderRoom();}
        );
      }else{
        status.textContent='Choose operation '+(nextIndex+1)+' of '+steps.length+'.';
        showNotice(step.short+' locked into position '+nextIndex+'.','success',800);
      }
    });
    choices.appendChild(b);
  }
  root.append(chain,choices,status);
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

function renderMemoryBank(){
  const stageIndex=active.roomStage||0,stageNo=stageIndex+1;
  const targets=[26,23,20];
  const target=targets[stageIndex];
  setProgress('BOOT SEQUENCE · ROOM 3/3 · RAM BANK · STAGE '+stageNo+'/3');
  const root=active.root;
  root.appendChild(roomHeader(
    'ROOM 3 · RAM CALIBRATION',
    'Repair the binary memory bank',
    stageIndex===0
      ?'Stage 1 has more clues. Restore the missing bits using the binary-logic rules.'
      :stageIndex===1
        ?'Stage 2 removes more clues, so more cells must be deduced.'
        :'Final stage: the 6×6 bank has only 20 fixed clues. Use all three rules carefully.'
  ));

  const rules=document.createElement('div');rules.className='memory-rules';
  rules.innerHTML='<span><strong>1</strong> Three 0s and three 1s in every row and column</span><span><strong>2</strong> Never three identical bits in a row</span><span><strong>3</strong> No completed rows or columns may be identical</span>';
  root.appendChild(rules);

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
      finishRoomStage(
        'RAM stage '+stageNo+'/3 restored',
        stageIndex===0?'Next: fewer clues and more missing memory cells.':'Next: the final 20-clue memory bank.',
        'RAM bank fully restored',
        'All three 6×6 memory banks passed their checksum.',
        'Continue →',
        ()=>{active.room=3;renderRoom();}
      );
    }else if(wrong){
      active.memoryFaults++;const depleted=applyAdventurePenalty();
      active.playTone(155,.08,'square',.025);led()?.flash('x',380);
      if(depleted)return;
      showNotice(wrong+' bit'+(wrong===1?' is':'s are')+' inconsistent. Recheck the highlighted cells.','fault',1500);
    }else showNotice(blank+' memory cell'+(blank===1?' is':'s are')+' still blank.','warn',1200);
  });

  actions.append(hint,check);root.append(board,actions,status);
}

/* ============================================================
   SYSTEM 2 · RANDOMISER CORE
   ============================================================ */

function randomInt(rng,min,max){return min+Math.floor(rng()*(max-min+1));}

/* ---------------- Room 1: Random Packet Catcher ---------------- */

function randomPacketStage(stage){
  return [
    {label:'DICE MODE',min:1,max:6,target:5,validChance:.72,copy:'Catch 5 numbers from 1 to 6.'},
    {label:'LED POSITION',min:0,max:4,target:5,validChance:.64,copy:'Catch 5 numbers from 0 to 4.'},
    {label:'NARROW RANGE',min:2,max:5,target:5,validChance:.54,copy:'Catch 5 numbers from 2 to 5. Out-of-range values are deliberately close.'}
  ][stage]||null;
}

function renderRandomPacketCatcher(){
  const stageIndex=active.roomStage||0,stageNo=stageIndex+1;
  const cfg=randomPacketStage(stageIndex);
  setProgress('RANDOMISER CORE · ROOM 1/3 · PACKET FILTER · STAGE '+stageNo+'/3');
  const root=active.root;
  root.appendChild(roomHeader(
    'ROOM 1 · RANDOM PACKET CATCHER',
    'Catch '+cfg.target+' numbers in the range',
    cfg.copy+' Move left and right to catch in-range numbers and let the others fall past.'
  ));

  let caught=0,playerLane=1,live=false,finished=false,nextPacketId=1;
  const rng=rngFromSeed(active.seed+':packet-catcher:'+stageNo);
  const packets=[];

  const hud=document.createElement('div');hud.className='random-catcher-hud';
  const ruleBox=document.createElement('div');ruleBox.className='random-rule-box';
  const progress=document.createElement('div');progress.className='random-catch-progress';
  hud.append(ruleBox,progress);

  const arena=document.createElement('div');arena.className='random-catcher-arena';
  arena.setAttribute('role','application');arena.setAttribute('aria-label','Three-lane random packet catcher stage '+stageNo);
  for(let i=0;i<3;i++){const lane=document.createElement('div');lane.className='random-lane';lane.dataset.lane=String(i);arena.appendChild(lane);}
  const catcher=document.createElement('div');catcher.className='random-catcher';catcher.innerHTML='<span>CORE</span>';

  const controls=document.createElement('div');controls.className='random-catcher-controls';
  const left=document.createElement('button');left.type='button';left.textContent='←';left.setAttribute('aria-label','Move catcher left');
  const right=document.createElement('button');right.type='button';right.textContent='→';right.setAttribute('aria-label','Move catcher right');
  controls.append(left,right);

  const startRow=document.createElement('div');startRow.className='random-catcher-start';
  const startButton=document.createElement('button');startButton.type='button';startButton.className='random-catcher-start-button';startButton.textContent='Start stage '+stageNo+' →';
  const startHint=document.createElement('span');
  startHint.textContent=stageIndex===0?'Nothing moves until you start.':stageIndex===1?'Same speed, but more out-of-range packets.':'Same speed again. The final range is narrower and the distractors sit closer to its limits.';
  startRow.append(startHint,startButton);

  const legend=document.createElement('div');legend.className='adventure-info-strip';
  legend.innerHTML='<span><strong>IN RANGE</strong> catch it</span><span><strong>OUT OF RANGE</strong> let it pass</span><span><strong>TARGET</strong> catch '+cfg.target+'</span>';

  root.append(hud,legend,startRow,arena,controls);

  function validValue(v){return Number.isInteger(v)&&v>=cfg.min&&v<=cfg.max;}
  function paintRule(){
    ruleBox.innerHTML='<small>'+cfg.label+'</small><strong>random '+cfg.min+' to '+cfg.max+'</strong><span>'+cfg.copy+'</span>';
    progress.textContent='CAUGHT '+caught+'/'+cfg.target+' · RANGE '+cfg.min+'–'+cfg.max;
  }
  function paintPlayer(){
    catcher.style.left='calc('+(playerLane*33.333+16.666)+'% - 32px)';
    if(!catcher.isConnected)arena.appendChild(catcher);
  }
  function startLive(){
    if(live||finished)return;
    live=true;startRow.hidden=true;
    every(spawn,900);every(tick,50);spawn();
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
    let value;
    if(shouldValid)value=randomInt(rng,cfg.min,cfg.max);
    else{
      const pool=[cfg.min-2,cfg.min-1,cfg.max+1,cfg.max+2].filter(v=>v>=0);
      value=pool[Math.floor(rng()*pool.length)] ?? cfg.max+1;
    }
    const packet={id:nextPacketId++,lane:randomInt(rng,0,2),value,y:-12,resolved:false,el:document.createElement('div')};
    packet.el.className='random-packet';packet.el.style.left='calc('+(packet.lane*33.333+16.666)+'% - 22px)';
    packet.el.style.top=packet.y+'%';packet.el.textContent=String(packet.value);arena.appendChild(packet.el);packets.push(packet);
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
    if(validValue(p.value)){
      caught++;active.playTone(720,.055,'sine',.025);paintRule();
      showNotice(p.value+' is in range · '+caught+'/'+cfg.target+' caught.','success',650);
      if(caught>=cfg.target){
        finished=true;live=false;clearTimers();clearPacketNodes();led()?.setPattern('check');
        if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,1);
        finishRoomStage(
          'Packet stage '+stageNo+'/3 complete',
          stageIndex===0?'Next: the 0–4 LED-position range with more distractors.':'Next: a narrower 2–5 range with close distractors.',
          'Packet filter fully restored',
          'All three range-catching stages are stable.',
          'Check output sequences →',
          ()=>{active.room=1;renderRoom();}
        );
      }
    }else{
      active.arcadeFaults++;const depleted=applyAdventurePenalty();
      active.playTone(150,.08,'square',.026);led()?.flash('x',260);
      arena.classList.remove('fault');void arena.offsetWidth;arena.classList.add('fault');
      if(depleted){live=false;return;}
      showNotice(p.value+' is outside random '+cfg.min+' to '+cfg.max+'.','fault',850);
      later(()=>arena.classList.remove('fault'),350);
    }
  }
  function tick(){
    if(!live||finished)return;
    for(const p of packets)p.y+=2;
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
  showNotice('Stage '+stageNo+'/3 · press Start when you are ready.','info',1300);
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
  setProgress('RANDOMISER CORE · ROOM 2/3 · RANGE DIAGNOSTICS · STAGE '+stageNo+'/3');
  const root=active.root;
  root.appendChild(roomHeader(
    'ROOM 2 · RANGE DIAGNOSTICS',
    'Select the sequence that does not match',
    'Stage '+stageNo+' shows '+round.length+' outputs. Select the one sequence containing a value that cannot come from '+round.code+'.'
  ));

  const note=document.createElement('div');note.className='reality-note';
  note.innerHTML='<strong>Important</strong><span>You cannot prove randomness from a short sequence. Repeats are allowed. We are checking one thing we can know for certain: every output must stay inside the configured range.</span>';

  const consoleEl=document.createElement('div');consoleEl.className='random-diagnostic-console';
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
    later(()=>finishRoomStage(
      'Range stage '+stageNo+'/3 complete',
      stageIndex===0?'Next: a longer six-sided-die sequence.':'Next: nine LED-coordinate outputs to scan.',
      'Range diagnostics fully restored',
      'You found the out-of-range sequence in all three stages without treating ordinary repeats as faults.',
      'Open data router →',
      ()=>{active.room=2;renderRoom();}
    ),650);
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
  setProgress('RANDOMISER CORE · ROOM 3/3 · DATA ROUTER · STAGE '+stageNo+'/3');
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
    'ROOM 3 · DATA / PROPERTY ROUTER',
    'Route data using '+puzzle.rule.label,
    stageCopy
  ));

  const rule=document.createElement('div');rule.className='property-router-rule';
  rule.innerHTML='<small>STAGE '+stageNo+'/3 · ROUTING FILTER</small><strong>'+puzzle.rule.shortLabel+'</strong><span>Use only '+puzzle.rule.label+'</span>';

  const board=document.createElement('div');board.className='property-router-grid';board.style.setProperty('--router-n',String(puzzle.n));board.dataset.routerSize=String(puzzle.n);
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
      b.classList.toggle('is-path',used.has(k));b.classList.toggle('is-current',same(p,cur));b.disabled=finished;
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
      finishRoomStage(
        'Router stage '+stageNo+'/3 complete',
        stageIndex===0?'Next: a 6×6 grid, multiples and more dead ends.':'Next: a 7×7 grid using one advanced property — PRIME or SQUARE.',
        'Data router fully restored',
        'All three number-property routes are stable.',
        'Continue →',
        ()=>{active.room=3;renderRoom();}
      );
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
    'Events and random outputs are responding again',
    'All nine Randomiser Core adventure stages are stable. The final boss is 12 questions split into three increasingly difficult sets of four.'
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

function sensorScannerConfig(stage){
  return [
    {rounds:6,duration:6000,label:'LIGHT THRESHOLD',copy:'Trigger DARK ALERT only when the light reading is below the threshold.'},
    {rounds:6,duration:6500,label:'TEMPERATURE THRESHOLD',copy:'The temperature limit changes each scan. Trigger HOT ALERT only when the reading is above the current threshold.'},
    {rounds:6,duration:7500,label:'DUAL SENSOR AND',copy:'Trigger COLD & DARK only when BOTH temperature and light are below their thresholds.'}
  ][stage]||null;
}
function sensorScanTrials(stage,seed){
  const rng=rngFromSeed(seed+':sensor-scan:'+stage);
  const wanted=shuffled([true,false,true,false,true,false],rng);
  return wanted.map((alert,index)=>{
    if(stage===0){
      const threshold=50;
      const light=alert?randomInt(rng,18,46):randomInt(rng,50,82);
      return {
        kind:'LIGHT',reading1:light,limit1:threshold,alert,
        condition:'light < '+threshold,
        value:'light = '+light,
        alertLabel:'DARK ALERT',
        explain:light+' < '+threshold+' is '+(alert?'TRUE.':'FALSE.')
      };
    }
    if(stage===1){
      const threshold=randomInt(rng,25,32);
      const temp=alert?randomInt(rng,threshold+1,threshold+7):randomInt(rng,threshold-7,threshold);
      return {
        kind:'TEMP',reading1:temp,limit1:threshold,alert,
        condition:'temp > '+threshold,
        value:'temp = '+temp,
        alertLabel:'HOT ALERT',
        explain:temp+' > '+threshold+' is '+(alert?'TRUE.':'FALSE.')
      };
    }
    const tLimit=randomInt(rng,16,20),lLimit=randomInt(rng,42,58);
    let temp,light;
    if(alert){
      temp=randomInt(rng,10,tLimit-1);
      light=randomInt(rng,18,lLimit-1);
    }else if(index%2===0){
      temp=randomInt(rng,tLimit,tLimit+7);
      light=randomInt(rng,18,lLimit-1);
    }else{
      temp=randomInt(rng,10,tLimit-1);
      light=randomInt(rng,lLimit,lLimit+20);
    }
    return {
      kind:'DUAL',reading1:temp,limit1:tLimit,reading2:light,limit2:lLimit,alert,
      condition:'temp < '+tLimit+' AND light < '+lLimit,
      value:'temp = '+temp+' · light = '+light,
      alertLabel:'COLD & DARK',
      explain:'temp '+temp+' < '+tLimit+' is '+(temp<tLimit?'TRUE':'FALSE')+' and light '+light+' < '+lLimit+' is '+(light<lLimit?'TRUE.':'FALSE.')
    };
  });
}
function sensorLedBars(trial){
  const cells=[];
  if(!trial)return cells;
  if(trial.kind==='LIGHT'){
    const h=Math.max(1,Math.min(5,Math.ceil(trial.reading1/100*5)));
    for(let r=5-h;r<5;r++)for(let col=1;col<=3;col++)cells.push([r,col]);
  }else if(trial.kind==='TEMP'){
    const h=Math.max(1,Math.min(5,Math.ceil((trial.reading1-10)/30*5)));
    for(let r=5-h;r<5;r++)for(let col=1;col<=3;col++)cells.push([r,col]);
  }else{
    const th=Math.max(1,Math.min(5,Math.ceil((trial.reading1-8)/28*5)));
    const lh=Math.max(1,Math.min(5,Math.ceil(trial.reading2/100*5)));
    for(let r=5-th;r<5;r++){cells.push([r,0]);cells.push([r,1]);}
    for(let r=5-lh;r<5;r++){cells.push([r,3]);cells.push([r,4]);}
  }
  return cells;
}
function renderSensorScanner(){
  const stageIndex=active.roomStage||0,stageNo=stageIndex+1,cfg=sensorScannerConfig(stageIndex);
  setProgress('SENSOR ARRAY · ROOM 1/3 · SENSOR SCANNER · STAGE '+stageNo+'/3');
  const root=active.root;
  root.appendChild(roomHeader('ROOM 1 · SENSOR SCANNER','Watch the readings and respond to the threshold',cfg.copy));

  const info=document.createElement('div');info.className='adventure-info-strip';
  info.innerHTML='<span><strong>ALERT</strong> condition is true</span><span><strong>OK</strong> condition is false</span><span><strong>'+cfg.rounds+'</strong> scans this stage</span>';
  root.appendChild(info);

  const panel=document.createElement('div');panel.className='sensor-scanner';
  const top=document.createElement('div');top.className='sensor-scan-top';
  const mode=document.createElement('small');mode.textContent=cfg.label;
  const count=document.createElement('strong');
  top.append(mode,count);
  const condition=document.createElement('div');condition.className='sensor-condition';
  const values=document.createElement('div');values.className='sensor-values';
  const gauges=document.createElement('div');gauges.className='sensor-gauges';
  const timer=document.createElement('div');timer.className='sensor-scan-timer';
  const timerFill=document.createElement('i');timer.appendChild(timerFill);
  const status=document.createElement('div');status.className='logic-status';
  const controls=document.createElement('div');controls.className='sensor-scan-controls';
  const okButton=document.createElement('button');okButton.type='button';okButton.className='sensor-ok';okButton.textContent='OK';
  const alertButton=document.createElement('button');alertButton.type='button';alertButton.className='sensor-alert';alertButton.textContent='ALERT';
  controls.append(okButton,alertButton);
  panel.append(top,condition,values,gauges,timer,status,controls);root.appendChild(panel);

  const trials=sensorScanTrials(stageIndex,active.seed);
  let index=0,trial=null,elapsed=0,tickId=null,locked=true,finished=false;

  function stopTick(){if(tickId){clearInterval(tickId);active?.timers?.delete(tickId);tickId=null;}}
  function paintGauges(){
    gauges.replaceChildren();
    const specs=trial.kind==='DUAL'
      ?[{name:'TEMP',value:trial.reading1,limit:trial.limit1,max:40,unit:'°C'},{name:'LIGHT',value:trial.reading2,limit:trial.limit2,max:100,unit:''}]
      :trial.kind==='TEMP'
        ?[{name:'TEMP',value:trial.reading1,limit:trial.limit1,max:40,unit:'°C'}]
        :[{name:'LIGHT',value:trial.reading1,limit:trial.limit1,max:100,unit:''}];
    for(const spec of specs){
      const card=document.createElement('div');card.className='sensor-gauge-card';
      const head=document.createElement('div');head.innerHTML='<strong>'+spec.name+'</strong><span>'+spec.value+spec.unit+'</span>';
      const rail=document.createElement('div');rail.className='sensor-gauge-rail';
      const fill=document.createElement('i');fill.style.width=Math.max(0,Math.min(100,spec.value/spec.max*100))+'%';
      const limit=document.createElement('b');limit.style.left=Math.max(0,Math.min(100,spec.limit/spec.max*100))+'%';limit.title='Threshold '+spec.limit;
      rail.append(fill,limit);
      const foot=document.createElement('small');foot.textContent='threshold '+spec.limit+spec.unit;
      card.append(head,rail,foot);gauges.appendChild(card);
    }
  }
  function showTrial(){
    if(finished)return;
    trial=trials[index];elapsed=0;locked=false;
    count.textContent='SCAN '+(index+1)+'/'+cfg.rounds;
    condition.textContent='IF '+trial.condition;
    values.textContent=trial.value;
    status.textContent='Is the condition TRUE? Trigger '+trial.alertLabel+' or choose OK.';
    paintGauges();timerFill.style.width='100%';led()?.setCells(sensorLedBars(trial));
    stopTick();
    tickId=every(()=>{
      elapsed+=50;
      timerFill.style.width=Math.max(0,100-elapsed/cfg.duration*100)+'%';
      if(elapsed>=cfg.duration){stopTick();resolve(null);}
    },50);
  }
  function next(){
    index++;
    if(index>=trials.length){
      finished=true;stopTick();led()?.setPattern('check');
      if(stageIndex===2)active.roomsCompleted=Math.max(active.roomsCompleted,1);
      finishRoomStage(
        'Sensor Scanner stage '+stageNo+'/3 complete',
        stageIndex===0?'Next: changing temperature thresholds.':'Next: two live sensors joined by AND.',
        'Sensor Scanner calibrated',
        'Light, temperature and combined threshold scans are all responding correctly.',
        'Open Variable Processor →',
        ()=>{active.room=1;renderRoom();}
      );
      return;
    }
    later(showTrial,700);
  }
  function resolve(answer){
    if(locked||finished)return;
    locked=true;stopTick();
    const correct=answer===trial.alert;
    if(correct){
      active.playTone(740,.055,'sine',.025);led()?.setPattern('check');
      showNotice((trial.alert?trial.alertLabel:'OK')+' · '+trial.explain,'success',800);
      next();return;
    }
    active.sensorFaults++;
    const depleted=applyAdventurePenalty();active.playTone(150,.08,'square',.026);led()?.flash('x',340);
    if(depleted)return;
    const msg=answer==null?'Scan timed out. '+trial.explain:'Not quite. '+trial.explain;
    showNotice(msg,'fault',1300);
    later(showTrial,850);
  }
  okButton.addEventListener('click',()=>resolve(false));
  alertButton.addEventListener('click',()=>resolve(true));
  active.keyHandler=(e)=>{
    if(active?.systemId!=='4'||active.room!==0||locked||finished)return;
    if(e.key==='ArrowLeft'||e.key==='o'||e.key==='O'){e.preventDefault();resolve(false);}
    if(e.key==='ArrowRight'||e.key==='a'||e.key==='A'){e.preventDefault();resolve(true);}
  };
  document.addEventListener('keydown',active.keyHandler);

  const start=document.createElement('button');start.type='button';start.className='sensor-start';start.textContent='Start stage '+stageNo+' →';
  start.addEventListener('click',()=>{start.remove();focusPlayArea(panel,showTrial);});
  panel.insertBefore(start,controls);
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
          title:'REGISTER value = '+start,
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
        title:'REGISTER value = '+start,
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
        code:'SET value TO '+start+'\nCHANGE value BY +'+d1+'\n'+op2+'\nSET value TO value × '+mult,
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
      code:'SET '+sensor+' TO ['+(tempMode?'temperature':'light level')+']   # '+reading+
        '\nCHANGE '+sensor+' BY '+(readingAdjust>=0?'+':'')+readingAdjust+
        '\nSET threshold TO '+limitStart+
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
  const register=document.createElement('div');register.className='variable-register';register.innerHTML='<small>MEMORY REGISTER</small><strong>?</strong>';
  const code=document.createElement('pre');code.className='variable-code';
  const options=document.createElement('div');options.className='variable-options';
  const status=document.createElement('div');status.className='logic-status';
  panel.append(progress,title,register,code,options,status);root.appendChild(panel);

  let index=0,locked=false;
  function paint(){
    const q=challenges[index];
    progress.textContent='STAGE '+stageNo+'/3 · PROGRAM '+(index+1)+'/'+challenges.length;
    title.textContent=q.title;code.textContent=q.code;
    register.querySelector('strong').textContent='?';
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
    locked=true;button.classList.add('correct');register.querySelector('strong').textContent=q.answer;
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
  real.innerHTML='<strong>Inside the real micro:bit</strong><span>The board really does contain a microcontroller, memory, input/output connections, sensors, a 5×5 LED display, buttons and radio hardware. Our glowing data pulse and rooms are a game model — real electrical signals do not look like tiny moving dots.</span>';

  const stats=document.createElement('div');stats.className='adventure-run-stats';
  stats.innerHTML=`<span><strong>${active.bits.size}/12</strong> boot packets</span><span><strong>${active.arcadeFaults}</strong> signal faults</span><span><strong>${active.sequenceFaults}</strong> sequence faults</span><span><strong>${active.memoryFaults}</strong> RAM checks failed</span>`;

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
