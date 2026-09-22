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
  const stage=document.createElement('span');stage.className='room-stage-badge';stage.textContent=`STAGE ${Math.min(3,(active?.roomStage||0)+1)}/3`;
  const h=document.createElement('h2');h.id='adventure-title';h.textContent=title;
  const p=document.createElement('p');p.textContent=copy;
  left.append(eyebrow,stage,h,p);
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

function renderRandomPacketCatcher(){
  setProgress('RANDOMISER CORE · ROOM 1/3 · PACKET FILTER');
  const root=active.root;
  root.appendChild(roomHeader(
    'ROOM 1 · RANDOM PACKET CATCHER',
    'Catch 5 numbers in the range',
    'Look at the range shown below. Move left and right to catch 5 numbers inside that range. Let numbers outside the range fall past.'
  ));

  const rules=[
    {label:'DICE MODE',min:1,max:6,copy:'Catch 5 numbers from 1 to 6.'},
    {label:'LED POSITION',min:0,max:4,copy:'Catch 5 numbers from 0 to 4.'}
  ];
  let wave=0,caughtInWave=0,totalCaught=0,playerLane=1,live=false,finished=false,nextPacketId=1;
  const rng=rngFromSeed(active.seed+':packet-catcher');
  const packets=[];

  const hud=document.createElement('div');hud.className='random-catcher-hud';
  const ruleBox=document.createElement('div');ruleBox.className='random-rule-box';
  const progress=document.createElement('div');progress.className='random-catch-progress';
  hud.append(ruleBox,progress);

  const arena=document.createElement('div');arena.className='random-catcher-arena';
  arena.setAttribute('role','application');
  arena.setAttribute('aria-label','Three-lane random packet catcher');
  const lanes=Array.from({length:3},(_,i)=>{
    const lane=document.createElement('div');lane.className='random-lane';lane.dataset.lane=String(i);arena.appendChild(lane);return lane;
  });
  const catcher=document.createElement('div');catcher.className='random-catcher';catcher.innerHTML='<span>CORE</span>';

  const controls=document.createElement('div');controls.className='random-catcher-controls';
  const left=document.createElement('button');left.type='button';left.textContent='←';left.setAttribute('aria-label','Move catcher left');
  const right=document.createElement('button');right.type='button';right.textContent='→';right.setAttribute('aria-label','Move catcher right');
  controls.append(left,right);
  const startRow=document.createElement('div');startRow.className='random-catcher-start';
  const startButton=document.createElement('button');startButton.type='button';startButton.className='random-catcher-start-button';startButton.textContent='Start packet run →';
  const startHint=document.createElement('span');startHint.textContent='Nothing moves until you start. The game will focus on the catcher first.';
  startRow.append(startHint,startButton);

  const legend=document.createElement('div');legend.className='adventure-info-strip';
  legend.innerHTML='<span><strong>IN RANGE</strong> catch it</span><span><strong>OUT OF RANGE</strong> let it pass</span><span><strong>TARGET</strong> catch 5</span>';

  root.append(hud,legend,startRow,arena,controls);

  function currentRule(){return rules[wave];}
  function validValue(v){const r=currentRule();return Number.isInteger(v)&&v>=r.min&&v<=r.max;}
  function paintRule(){
    const r=currentRule();
    ruleBox.innerHTML=`<small>${r.label}</small><strong>random ${r.min} to ${r.max}</strong><span>${r.copy}</span>`;
    progress.textContent=`CAUGHT ${caughtInWave}/5 · RANGE ${r.min}–${r.max}`;
  }
  function paintPlayer(){
    catcher.style.left=`calc(${playerLane*33.333+16.666}% - 32px)`;
    if(!catcher.isConnected)arena.appendChild(catcher);
  }
  function startLive(){
    if(live||finished)return;
    live=true;
    startRow.hidden=true;
    every(spawn,900);
    every(tick,50);
    spawn();
  }
  startButton.addEventListener('click',()=>{
    startButton.disabled=true;
    focusPlayArea(arena,startLive);
  });
  function move(delta){
    if(!live||finished)return;
    playerLane=Math.max(0,Math.min(2,playerLane+delta));
    paintPlayer();
    active.playTone(330+playerLane*70,.025,'sine',.012);
  }
  left.addEventListener('click',()=>move(-1));
  right.addEventListener('click',()=>move(1));

  active.keyHandler=(e)=>{
    if(active?.systemId!=='2'||active.room!==0||finished)return;
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){e.preventDefault();move(-1);}
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){e.preventDefault();move(1);}
  };
  document.addEventListener('keydown',active.keyHandler);

  function spawn(){
    if(!live||finished)return;
    const r=currentRule();
    const shouldValid=rng()<0.66;
    let value;
    if(shouldValid)value=randomInt(rng,r.min,r.max);
    else{
      const lows=[r.min-2,r.min-1].filter(v=>v>=0);
      const highs=[r.max+1,r.max+2,r.max+3];
      const pool=[...lows,...highs];
      value=pool[Math.floor(rng()*pool.length)] ?? r.max+1;
    }
    const packet={id:nextPacketId++,lane:randomInt(rng,0,2),value,y:-12,resolved:false,el:document.createElement('div')};
    packet.el.className='random-packet';
    packet.el.style.left=`calc(${packet.lane*33.333+16.666}% - 22px)`;
    packet.el.style.top=`${packet.y}%`;
    packet.el.textContent=String(packet.value);
    arena.appendChild(packet.el);
    packets.push(packet);
  }

  function clearPacketNodes(){
    for(const p of packets)p.el?.remove();
    packets.splice(0,packets.length);
  }

  function renderPackets(){
    for(const p of packets){
      if(!p.el?.isConnected&&p.el)arena.appendChild(p.el);
      if(p.el){
        p.el.style.left=`calc(${p.lane*33.333+16.666}% - 22px)`;
        p.el.style.top=`${p.y}%`;
      }
    }
    paintPlayer();
    const ledCells=[[4,[0,2,4][playerLane]]];
    for(const p of packets){
      const row=Math.max(0,Math.min(3,Math.round((p.y+12)/90*3)));
      ledCells.push([row,[0,2,4][p.lane]]);
    }
    led()?.setCells(ledCells);
  }

  function resolvePacket(p){
    if(p.lane!==playerLane||p.resolved)return;
    p.resolved=true;
    if(validValue(p.value)){
      totalCaught++;caughtInWave++;active.playTone(720,.055,'sine',.025);
      showNotice(`${p.value} is in range · ${caughtInWave}/5 caught.`,'success',650);
      if(caughtInWave>=5){
        if(wave===0){
          live=false;clearTimers();
          wave=1;caughtInWave=0;clearPacketNodes();paintRule();renderPackets();led()?.setPattern('check');
          showTransition('First range complete','You caught 5 numbers from 1 to 6. Now catch 5 numbers from 0 to 4.','Start range 0–4 →',()=>{
            if(!active||active.systemId!=='2'||active.room!==0)return;
            focusPlayArea(arena,startLive);
          });
        }else{
          finished=true;live=false;clearTimers();active.roomsCompleted=Math.max(active.roomsCompleted,1);
          led()?.setPattern('check');
          showTransition('Packet filter restored','You caught 5 numbers in each target range and ignored out-of-range values.','Check output sequences →',()=>{active.room=1;renderRoom();});
        }
      }
    }else{
      active.arcadeFaults++;
      const depleted=applyAdventurePenalty();
      active.playTone(150,.08,'square',.026);led()?.flash('x',260);
      arena.classList.remove('fault');void arena.offsetWidth;arena.classList.add('fault');
      if(depleted){live=false;return;}
      showNotice(`${p.value} is outside random ${currentRule().min} to ${currentRule().max}.`,'fault',850);
      later(()=>arena.classList.remove('fault'),350);
    }
  }

  function tick(){
    if(!live||finished)return;
    for(const p of packets)p.y+=2;
    for(let i=packets.length-1;i>=0;i--){
      const p=packets[i];
      if(p.y>=78&&p.y<86){
        resolvePacket(p);
        if(!live||finished)return;
        if(p.resolved){p.el?.remove();packets.splice(i,1);continue;}
      }
      if(p.y>102){p.el?.remove();packets.splice(i,1);}
    }
    renderPackets();
  }

  paintRule();paintPlayer();renderPackets();
  led()?.setPattern('question');
  showNotice('Press Start when you are ready. Nothing will fall before then.','info',1300);
}

/* ---------------- Room 2: Randomiser Range Diagnostics ---------------- */

function makeRandomDiagnosticRounds(seed){
  const rng=rngFromSeed(seed+':broken-randomiser');
  const specs=[
    {name:'DICE',min:1,max:6,code:'random 1 to 6'},
    {name:'COIN',min:0,max:1,code:'random 0 to 1'},
    {name:'LED COORDINATE',min:0,max:4,code:'random 0 to 4'}
  ];
  return specs.map((spec,roundIndex)=>{
    function goodStream(){
      const out=Array.from({length:7},()=>randomInt(rng,spec.min,spec.max));
      if(new Set(out).size===1&&spec.max>spec.min)out[out.length-1]=out[0]===spec.max?spec.min:spec.max;
      return out;
    }
    const good1=goodStream(),good2=goodStream();
    const bad=goodStream();
    const badIndex=1+Math.floor(rng()*(bad.length-2));
    bad[badIndex]=rng()<.5?spec.min-1:spec.max+1;
    const streams=shuffled([
      {bad:false,values:good1},
      {bad:false,values:good2},
      {bad:true,values:bad}
    ],rng);
    return {...spec,roundIndex,streams};
  });
}

function renderBrokenRandomiser(){
  setProgress('RANDOMISER CORE · ROOM 2/3 · RANGE DIAGNOSTICS');
  const root=active.root;
  root.appendChild(roomHeader(
    'ROOM 2 · RANGE DIAGNOSTICS',
    'Select the sequence that does not match',
    'For each random block, select the one sequence that does not match its range. Every number in a matching sequence must be between the two limits, inclusive.'
  ));

  const rounds=makeRandomDiagnosticRounds(active.seed);
  let roundIndex=0,locked=false;

  const note=document.createElement('div');note.className='reality-note';
  note.innerHTML='<strong>Important</strong><span>You cannot prove randomness by looking at a few numbers. Repeats are allowed. This diagnostic only checks range correctness: a value outside the configured range is definitely a fault.</span>';

  const consoleEl=document.createElement('div');consoleEl.className='random-diagnostic-console';
  const title=document.createElement('div');title.className='random-diagnostic-title';
  const streams=document.createElement('div');streams.className='random-streams';
  const counter=document.createElement('div');counter.className='logic-status';

  root.append(note,consoleEl);
  consoleEl.append(title,streams,counter);

  function renderRound(){
    locked=false;
    const r=rounds[roundIndex];
    title.innerHTML=`<small>CHECK ${roundIndex+1}/3 · ${r.name}</small><strong>${r.code}</strong><span>Select the sequence that does not match this rule.</span>`;
    streams.replaceChildren();
    r.streams.forEach((stream,i)=>{
      const b=document.createElement('button');b.type='button';b.className='random-stream-card';
      const label=document.createElement('small');label.textContent=`SEQUENCE ${String.fromCharCode(65+i)}`;
      const values=document.createElement('div');values.className='random-stream-values';
      stream.values.forEach(v=>{const s=document.createElement('span');s.textContent=String(v);values.appendChild(s);});
      b.append(label,values);
      b.addEventListener('click',()=>choose(i,b));
      streams.appendChild(b);
    });
    counter.textContent=`Select the sequence containing a number outside ${r.min}–${r.max}. Repeated numbers are allowed.`;
    led()?.setPattern('question');
  }

  function choose(i,button){
    if(locked)return;
    const r=rounds[roundIndex],stream=r.streams[i];
    if(!stream.bad){
      active.logicFaults++;
      const depleted=applyAdventurePenalty();
      button.classList.add('wrong');
      active.playTone(155,.07,'square',.023);led()?.flash('x',360);
      if(depleted)return;
      showNotice(`That sequence matches ${r.code}. Every value is in range.`,'warn',1200);
      later(()=>button.classList.remove('wrong'),600);
      return;
    }
    locked=true;
    button.classList.add('correct');
    active.playTone(760,.065,'sine',.025);led()?.setPattern('check');
    const badValue=stream.values.find(v=>v<r.min||v>r.max);
    showNotice(`${badValue} cannot come from ${r.code}.`,'success',900);
    later(()=>{
      roundIndex++;
      if(roundIndex>=rounds.length){
        active.roomsCompleted=Math.max(active.roomsCompleted,2);
        showTransition('Sequence checks complete','You found the sequence that did not match each random-number range. Repeated values were correctly left alone when they were still in range.','Open data router →',()=>{active.room=2;renderRoom();});
      }else renderRound();
    },900);
  }

  renderRound();
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
function routerRule(rng){
  return shuffled([
    {mode:'even',label:'even numbers',shortLabel:'EVEN'},
    {mode:'odd',label:'odd numbers',shortLabel:'ODD'},
    {mode:'multiple',a:3,label:'multiples of 3',shortLabel:'×3'},
    {mode:'multiple',a:4,label:'multiples of 4',shortLabel:'×4'},
    {mode:'prime',label:'prime numbers',shortLabel:'PRIME'},
    {mode:'square',label:'square numbers',shortLabel:'SQUARE'}
  ],rng)[0];
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
function makePropertyRouter(seed){
  const n=5,rng=rngFromSeed(seed+':property-router'),rule=routerRule(rng);
  for(let attempt=0;attempt<80;attempt++){
    const local=rngFromSeed(`${seed}:property-router:${attempt}`);
    const path=routerMakePath(n,10,local);if(!path)continue;
    const branched=routerAddBranches(path,n,2,local);
    const valid=new Set(branched.validKeys),yes=[],no=[];
    const valueLimit=rule.mode==='square'?225:120;
    for(let v=1;v<=valueLimit;v++)(routerMatches(v,rule)?yes:no).push(v);
    if(yes.length<valid.size||no.length<n*n-valid.size)continue;
    const y=shuffled(yes,local).slice(0,valid.size),nn=shuffled(no,local).slice(0,n*n-valid.size);
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
  setProgress('RANDOMISER CORE · ROOM 3/3 · DATA ROUTER');
  const root=active.root;
  root.appendChild(roomHeader(
    'ROOM 3 · DATA / PROPERTY ROUTER',
    'Route data through the correct number property',
    'The Randomiser Core has lost its routing table. Build a path from START to FINISH using only touching numbers that match the filter.'
  ));

  const puzzle=makePropertyRouter(active.seed)||makePropertyRouter(active.seed+':fallback');
  if(!puzzle){showTransition('Router unavailable','A clean route could not be generated. Re-enter the mission to generate another board.','Back to mission control',()=>active.onExit());return;}

  const rule=document.createElement('div');rule.className='property-router-rule';
  rule.innerHTML=`<small>ROUTING FILTER</small><strong>${puzzle.rule.shortLabel}</strong><span>Use only ${puzzle.rule.label}</span>`;

  const board=document.createElement('div');board.className='property-router-grid';board.style.setProperty('--router-n',String(puzzle.n));
  const path=[puzzle.start.slice()];
  let finished=false;
  const buttons=[];

  for(let r=0;r<puzzle.n;r++)for(let c=0;c<puzzle.n;c++){
    const p=[r,c],b=document.createElement('button');b.type='button';b.className='property-router-cell';b.dataset.r=String(r);b.dataset.c=String(c);
    const isStart=same(p,puzzle.start),isFinish=same(p,puzzle.finish);
    if(isStart)b.classList.add('is-start');if(isFinish)b.classList.add('is-finish');
    const label=document.createElement('small');label.textContent=isStart?'START':isFinish?'FINISH':'';
    const value=document.createElement('strong');value.textContent=String(puzzle.grid[r][c]);
    b.append(label,value);b.addEventListener('click',()=>choose(p,b));board.appendChild(b);buttons.push(b);
  }

  const hint=document.createElement('div');hint.className='logic-status';hint.textContent='Move one square at a time. Tap your previous square to backtrack.';
  root.append(rule,board,hint);

  function current(){return path[path.length-1];}
  function pathSet(){return new Set(path.map(routerKey));}
  function paint(){
    const used=pathSet(),cur=current();
    for(const b of buttons){
      const p=[+b.dataset.r,+b.dataset.c],k=routerKey(p);
      b.classList.toggle('is-path',used.has(k));b.classList.toggle('is-current',same(p,cur));b.disabled=finished;
    }
    led()?.setCells(path);
  }
  function adjacent(a,b){return Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])===1;}
  function choose(p,b){
    if(finished)return;
    const cur=current();
    if(path.length>1&&same(p,path[path.length-2])){path.pop();paint();return;}
    if(!adjacent(cur,p)){showNotice('Choose a square touching your current data packet.','warn',900);return;}
    if(path.some(q=>same(q,p))){showNotice('The route cannot loop through an earlier square.','warn',900);return;}
    if(!routerMatches(puzzle.grid[p[0]][p[1]],puzzle.rule)){
      active.routerFaults++;const depleted=applyAdventurePenalty();b.classList.add('wrong');active.playTone(150,.07,'square',.024);led()?.flash('x',330);
      if(depleted)return;
      showNotice(`${puzzle.grid[p[0]][p[1]]} does not match ${puzzle.rule.label}.`,'fault',900);
      later(()=>b.classList.remove('wrong'),500);return;
    }
    path.push(p);paint();active.playTone(500+path.length*18,.035,'sine',.018);
    if(same(p,puzzle.finish)){
      const exact=path.length===puzzle.solutionPath.length&&path.every((q,i)=>same(q,puzzle.solutionPath[i]));
      if(!exact){
        showNotice('FINISH reached, but this route is incomplete. Backtrack and try the other matching branch.','warn',1200);
        return;
      }
      finished=true;active.roomsCompleted=Math.max(active.roomsCompleted,3);paint();led()?.setPattern('check');
      showTransition('Data router restored','You found the unique route using only values that match the number-property filter.','Continue →',()=>{active.room=3;renderRoom();});
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
    'Packet ranges, output-range diagnostics and the number-property router are stable. The final boss is the complete 12-question Week 2 diagnostic.'
  ));

  const board=document.createElement('div');board.className='microbit-face full-face';
  board.innerHTML=microbitBoardMarkup().replace('BOOT OK','RNG OK');

  const real=document.createElement('div');real.className='reality-note real-note';
  real.innerHTML='<strong>What is real?</strong><span>The micro:bit can generate pseudo-random values in programs, respond to button and motion events, and use numbers to make decisions. The “Randomiser Core” is our game model for those ideas.</span>';

  const totalFaults=active.arcadeFaults+active.logicFaults+active.routerFaults;
  const stats=document.createElement('div');stats.className='adventure-run-stats';
  stats.innerHTML=`<span><strong>${active.arcadeFaults}</strong> packet faults</span><span><strong>${active.logicFaults}</strong> stream faults</span><span><strong>${active.routerFaults}</strong> router faults</span><span><strong>${totalFaults}</strong> total faults</span>`;
  root.append(board,real,stats);led()?.setPattern('dice5');led()?.setPattern('check');

  later(()=>showTransition(
    'Final diagnostic ready',
    'The three repair rooms are complete. Beat all 12 Week 2 questions to bring Randomiser Core online.',
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
    'Power, startup logic and RAM are stable. The final boss is the complete 12-question Week 1 diagnostic.'
  ));

  const board=document.createElement('div');board.className='microbit-face full-face';
  board.innerHTML=microbitBoardMarkup();

  const real=document.createElement('div');real.className='reality-note real-note';
  real.innerHTML='<strong>Inside the real micro:bit</strong><span>The board really does contain a microcontroller, memory, input/output connections, sensors, a 5×5 LED display, buttons and radio hardware. Our glowing data pulse and rooms are a game model — real electrical signals do not look like tiny moving dots.</span>';

  const stats=document.createElement('div');stats.className='adventure-run-stats';
  stats.innerHTML=`<span><strong>${active.bits.size}/3</strong> boot packets</span><span><strong>${active.arcadeFaults}</strong> signal faults</span><span><strong>${active.sequenceFaults}</strong> sequence faults</span><span><strong>${active.memoryFaults}</strong> RAM checks failed</span>`;

  root.append(board,real,stats);

  later(()=>showTransition(
    'Final diagnostic ready',
    'The repair rooms are complete. Beat the full 12-question diagnostic to bring Boot Sequence online.',
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
  supports(id){return ['1','2'].includes(String(id));},
  start,
  stop,
  leds:global.TTCMicrobitLED||null
};

})(typeof globalThis!=='undefined'?globalThis:this);
