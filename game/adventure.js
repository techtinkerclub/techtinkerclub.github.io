/* Tech Tinker: System Rescue — micro:bit adventure layer
 * Level 1 is a vertical slice: arcade routing + sequence logic + binary memory repair.
 * The Takuzu generator below is adapted from the verified 99 Club Studio v1.39
 * binary-puzzle engine (unique-solution generation), with a deliberately small 4×4 grid.
 */
(function(global){
'use strict';

let active=null;

const key=(r,c)=>`${r}:${c}`;
const same=(a,b)=>a&&b&&a[0]===b[0]&&a[1]===b[1];

function hashString(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rngFromSeed(seed){let a=hashString(seed)||0x6d2b79f5;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function shuffled(arr,rng=Math.random){const out=arr.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}

function start(opts){
  stop();
  if(!opts?.root)throw new Error('Adventure root is required');
  active={
    root:opts.root,
    onComplete:typeof opts.onComplete==='function'?opts.onComplete:()=>{},
    onExit:typeof opts.onExit==='function'?opts.onExit:()=>{},
    playTone:typeof opts.playTone==='function'?opts.playTone:()=>{},
    toast:typeof opts.toast==='function'?opts.toast:()=>{},
    room:0,
    seed:`microbit-boot-${Date.now()}`,
    bits:new Set(),
    arcadeFaults:0,
    sequenceFaults:0,
    memoryFaults:0,
    roomsCompleted:0,
    keyHandler:null,
    timers:new Set(),
    completed:false
  };
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
  active=null;
}

function setProgress(label){
  const el=document.getElementById('adventure-progress');
  if(el)el.textContent=label;
}

function renderRoom(){
  if(!active)return;
  if(active.keyHandler){document.removeEventListener('keydown',active.keyHandler);active.keyHandler=null;}
  clearTimers();
  clearOverlay();
  active.root.replaceChildren();
  if(active.room===0)renderPulseRun();
  else if(active.room===1)renderBootOrder();
  else if(active.room===2)renderMemoryBank();
  else renderFinalGate();
}

function roomHeader(kicker,title,copy){
  const head=document.createElement('div');head.className='adventure-room-head';
  const left=document.createElement('div');
  const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent=kicker;
  const h=document.createElement('h2');h.id='adventure-title';h.textContent=title;
  const p=document.createElement('p');p.textContent=copy;
  left.append(eyebrow,h,p);
  head.appendChild(left);
  return head;
}

function overlayHost(){
  return document.getElementById('adventure-overlay-host');
}
function clearOverlay(){
  const host=overlayHost();
  if(host)host.replaceChildren();
}
function showNotice(text,tone='info',ms=1500){
  const host=overlayHost();if(!host)return;
  const note=document.createElement('div');
  note.className=`adventure-popup notice ${tone}`;
  note.setAttribute('role','status');
  note.textContent=text;
  host.replaceChildren(note);
  later(()=>{if(note.isConnected)note.remove();},ms);
}
function showTransition(title,text,buttonText,next,tone='success'){
  const host=overlayHost();if(!host)return;
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

/* ---------------- Room 1: Data Pulse Run ---------------- */

function renderPulseRun(){
  setProgress('BOOT SEQUENCE · ROOM 1/3 · POWER BUS');
  const root=active.root;
  root.appendChild(roomHeader(
    'ROOM 1 · POWER BUS',
    'Ride the live data bus',
    'The boot pulse is moving continuously. Steer it through the micro:bit, collect all three boot packets and avoid corrupted signals.'
  ));

  const info=document.createElement('div');info.className='adventure-info-strip';
  info.innerHTML='<span><strong>YOU</strong> cyan pulse</span><span><strong>◆</strong> boot packet</span><span><strong>!</strong> corruption</span><span><strong>HOLD</strong> pause one beat</span><span><strong>CPU</strong> destination</span>';
  root.appendChild(info);

  const boardWrap=document.createElement('div');boardWrap.className='pulse-board-wrap';
  const board=document.createElement('div');board.className='pulse-board';board.setAttribute('role','application');board.setAttribute('aria-label','Real-time micro:bit power bus');
  boardWrap.appendChild(board);

  const rows=6,cols=9;
  const allowed=new Set();
  const addLine=(cells)=>cells.forEach(([r,c])=>allowed.add(key(r,c)));
  addLine(Array.from({length:4},(_,cc)=>[5,cc]));
  addLine([[4,3],[3,3],[2,3]]);
  addLine([[4,4],[4,5],[4,6],[3,6],[2,6]]);
  addLine([[2,4],[2,5],[2,6],[2,7],[2,8]]);
  addLine([[1,6],[1,7],[1,8]]);
  addLine([[3,8],[4,8]]);

  const startPos=[5,0],goal=[2,8];
  const bitLocations=new Map([[key(5,2),'A'],[key(4,6),'B'],[key(2,5),'C']]);
  let player=startPos.slice();
  let direction=[0,1];
  let queuedDirection=[0,1];
  let holdTicks=0;
  let roomFinished=false;
  let live=false;

  const hazards=[
    {route:[[3,3],[2,3],[3,3],[4,3]],i:0},
    {route:[[2,7],[2,6],[2,7],[1,7]],i:0}
  ];

  const cells=[];
  for(let r=0;r<rows;r++)for(let cc=0;cc<cols;cc++){
    const cell=document.createElement('div');cell.className='pulse-cell';cell.dataset.key=key(r,cc);
    if(allowed.has(key(r,cc)))cell.classList.add('trace');
    if(same([r,cc],startPos))cell.classList.add('start-port');
    if(same([r,cc],goal))cell.classList.add('cpu-port');
    board.appendChild(cell);cells.push(cell);
  }

  const hud=document.createElement('div');hud.className='pulse-live-hud';
  const packetCount=document.createElement('strong');
  const directionLabel=document.createElement('span');
  const liveLabel=document.createElement('span');liveLabel.className='pulse-live-indicator';liveLabel.textContent='● LIVE';
  hud.append(packetCount,directionLabel,liveLabel);

  const controls=document.createElement('div');controls.className='pulse-controls';controls.setAttribute('aria-label','Movement controls');
  const moves=[['↑','up',-1,0],['←','left',0,-1],['HOLD','wait',0,0],['→','right',0,1],['↓','down',1,0]];
  const controlButtons=[];
  for(const [label,name,dr,dc] of moves){
    const b=document.createElement('button');b.type='button';b.className=`pulse-control ${name}`;b.textContent=label;
    b.setAttribute('aria-label',name==='wait'?'Hold position briefly':`Steer ${name}`);
    b.addEventListener('click',()=>setDirection(dr,dc,b));
    controls.appendChild(b);controlButtons.push(b);
  }

  const layout=document.createElement('div');layout.className='pulse-layout';
  layout.append(boardWrap,controls);
  root.append(hud,layout);

  function hazardKeys(){return new Set(hazards.map(h=>key(...h.route[h.i])));}
  function canUse(dir,pos=player){
    if(dir[0]===0&&dir[1]===0)return true;
    return allowed.has(key(pos[0]+dir[0],pos[1]+dir[1]));
  }
  function dirName(d){
    if(d[0]===-1)return 'UP';if(d[0]===1)return 'DOWN';if(d[1]===-1)return 'LEFT';if(d[1]===1)return 'RIGHT';return 'HOLD';
  }
  function render(){
    const hz=hazardKeys();
    for(const cell of cells){
      const [r,cc]=cell.dataset.key.split(':').map(Number),k=cell.dataset.key;
      cell.classList.toggle('player',same([r,cc],player));
      cell.classList.toggle('hazard',hz.has(k));
      const hasBit=bitLocations.has(k)&&!active.bits.has(bitLocations.get(k));
      cell.classList.toggle('boot-bit',hasBit);
      cell.replaceChildren();
      if(same([r,cc],player)){const s=document.createElement('span');s.className='pulse-player';s.textContent='●';cell.appendChild(s);}
      else if(hz.has(k)){const s=document.createElement('span');s.className='pulse-hazard';s.textContent='!';cell.appendChild(s);}
      else if(hasBit){const s=document.createElement('span');s.className='pulse-bit';s.textContent='◆';cell.appendChild(s);}
      else if(same([r,cc],goal)){const s=document.createElement('span');s.className='pulse-cpu';s.textContent='CPU';cell.appendChild(s);}
      else if(same([r,cc],startPos)){const s=document.createElement('span');s.className='pulse-usb';s.textContent='USB';cell.appendChild(s);}
    }
    packetCount.textContent=`BOOT PACKETS ${active.bits.size}/3`;
    directionLabel.textContent=`STEER: ${dirName(queuedDirection)}`;
    controlButtons.forEach(b=>b.classList.toggle('active',b.classList.contains(dirName(queuedDirection).toLowerCase())||(dirName(queuedDirection)==='HOLD'&&b.classList.contains('wait'))));
  }

  function fault(){
    if(roomFinished)return;
    active.arcadeFaults++;
    player=startPos.slice();
    direction=[0,1];queuedDirection=[0,1];holdTicks=1;
    active.playTone(145,.1,'sawtooth',.03);
    board.classList.remove('fault');void board.offsetWidth;board.classList.add('fault');
    showNotice('Corrupted signal! Pulse reset to the USB power input.','fault',1300);
    render();
  }

  function collectAndCheck(){
    const k=key(...player),bit=bitLocations.get(k);
    if(bit&&!active.bits.has(bit)){
      active.bits.add(bit);active.playTone(700,.06,'sine',.03);
      showNotice(`Boot packet ${bit} recovered · ${active.bits.size}/3`,'success',1000);
    }
    if(hazards.some(h=>same(h.route[h.i],player))){fault();return false;}
    if(same(player,goal)){
      if(active.bits.size===3){
        roomFinished=true;live=false;clearTimers();active.roomsCompleted=Math.max(active.roomsCompleted,1);active.playTone(880,.09,'sine',.04);
        render();
        showTransition('Power bus restored','All three boot packets reached the processor while the live bus was running.','Enter startup controller →',()=>{active.room=1;renderRoom();});
        return false;
      }
      showNotice(`CPU reached — ${3-active.bits.size} boot packet${3-active.bits.size===1?' is':'s are'} still missing.`,'warn',1300);
    }
    return true;
  }

  function setDirection(dr,dc,button){
    if(roomFinished)return;
    if(dr===0&&dc===0){holdTicks=1;queuedDirection=[0,0];showNotice('Pulse held for one bus beat.','info',700);}
    else queuedDirection=[dr,dc];
    if(button){controlButtons.forEach(b=>b.classList.remove('pressed'));button.classList.add('pressed');later(()=>button.classList.remove('pressed'),120);}
    render();
  }

  function playerTick(){
    if(!live||roomFinished)return;
    if(holdTicks>0){holdTicks--;if(holdTicks===0&&queuedDirection[0]===0&&queuedDirection[1]===0)queuedDirection=direction;render();return;}
    if(canUse(queuedDirection)&&!(queuedDirection[0]===0&&queuedDirection[1]===0))direction=queuedDirection;
    if(!canUse(direction)){
      showNotice('Junction ahead — choose a connected trace.','warn',650);
      return;
    }
    player=[player[0]+direction[0],player[1]+direction[1]];
    collectAndCheck();
    render();
  }

  function hazardTick(){
    if(!live||roomFinished)return;
    hazards.forEach(h=>{h.i=(h.i+1)%h.route.length;});
    if(hazards.some(h=>same(h.route[h.i],player)))fault();
    render();
  }

  active.keyHandler=(e)=>{
    if(active?.room!==0||roomFinished)return;
    const map={ArrowUp:[-1,0],w:[-1,0],W:[-1,0],ArrowDown:[1,0],s:[1,0],S:[1,0],ArrowLeft:[0,-1],a:[0,-1],A:[0,-1],ArrowRight:[0,1],d:[0,1],D:[0,1],' ':[0,0]};
    const m=map[e.key];if(!m)return;e.preventDefault();setDirection(m[0],m[1]);
  };
  document.addEventListener('keydown',active.keyHandler);

  render();
  showNotice('Get ready — the data bus is going live.','info',900);
  later(()=>{
    if(!active||active.room!==0)return;
    live=true;liveLabel.classList.add('active');
    every(playerTick,430);
    every(hazardTick,560);
    showNotice('LIVE BUS · steer the pulse before each junction.','success',1100);
  },900);
}

/* ---------------- Room 2: simplified boot order ---------------- */



function renderBootOrder(){
  setProgress('BOOT SEQUENCE · ROOM 2/3 · STARTUP CONTROLLER');
  const root=active.root;
  root.appendChild(roomHeader(
    'ROOM 2 · STARTUP CONTROLLER',
    'Rebuild the boot order',
    'The startup controller has lost its sequence. Tap the four operations in the order that makes sense for our simplified micro:bit startup model.'
  ));

  const note=document.createElement('div');note.className='reality-note';
  note.innerHTML='<strong>Game model</strong><span>Real micro:bit startup involves low-level boot code and hardware initialisation. We are using a simplified sequence to practise algorithmic order.</span>';
  root.appendChild(note);

  const steps=[
    {id:'power',label:'Power reaches the micro:bit',short:'POWER'},
    {id:'check',label:'Startup code checks the hardware',short:'CHECK'},
    {id:'load',label:'Your program is prepared to run',short:'LOAD'},
    {id:'run',label:'Main program starts running',short:'RUN'}
  ];
  const rng=rngFromSeed(active.seed+':sequence');
  const cards=shuffled(steps,rng);
  let nextIndex=0;

  const chain=document.createElement('div');chain.className='boot-chain';
  const slots=steps.map((s,i)=>{const slot=document.createElement('div');slot.className='boot-slot';slot.innerHTML=`<small>${i+1}</small><span>?</span>`;chain.appendChild(slot);return slot;});
  const choices=document.createElement('div');choices.className='boot-choices';
  const status=document.createElement('div');status.className='logic-status';status.textContent='Which operation must happen first?';

  for(const step of cards){
    const b=document.createElement('button');b.type='button';b.className='boot-choice';b.dataset.step=step.id;
    b.innerHTML=`<strong>${step.short}</strong><span>${step.label}</span>`;
    b.addEventListener('click',()=>{
      if(nextIndex>=steps.length)return;
      const expected=steps[nextIndex];
      if(step.id!==expected.id){
        active.sequenceFaults++;b.classList.remove('wrong');void b.offsetWidth;b.classList.add('wrong');
        status.textContent=`${step.short} does not fit in position ${nextIndex+1}. Trace what must already have happened.`;
        active.playTone(165,.08,'square',.025);return;
      }
      b.disabled=true;b.classList.add('used');
      slots[nextIndex].classList.add('filled');slots[nextIndex].querySelector('span').textContent=step.short;
      nextIndex++;active.playTone(580+nextIndex*65,.05,'sine',.025);
      if(nextIndex===steps.length){
        active.roomsCompleted=Math.max(active.roomsCompleted,2);status.textContent='Boot order valid. Startup controller responding.';
        root.appendChild(successPanel('Startup controller restored','The sequence is valid and control can pass to memory.','Open RAM bank →',()=>{active.room=2;renderRoom();}));
      }else status.textContent=`Good. Now choose operation ${nextIndex+1}.`;
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
function makeTakuzu(seed){
  const n=4,solution=buildSolution(n,seed);if(!solution)return null;
  const display=solution.map(r=>r.slice()),rng=rngFromSeed(seed+':mask'),order=shuffled(Array.from({length:n*n},(_,i)=>[Math.floor(i/n),i%n]),rng);
  let shown=n*n;const target=8,rowCount=Array(n).fill(n),colCount=Array(n).fill(n);
  for(const [r,c] of order){if(shown<=target)break;if(rowCount[r]<=2||colCount[c]<=2)continue;const old=display[r][c];display[r][c]=null;if(countSolutions(display,2)===1){shown--;rowCount[r]--;colCount[c]--;}else display[r][c]=old;}
  return {n,solution,display};
}

function renderMemoryBank(){
  setProgress('BOOT SEQUENCE · ROOM 3/3 · RAM BANK');
  const root=active.root;
  root.appendChild(roomHeader(
    'ROOM 3 · RAM CALIBRATION',
    'Repair the binary memory bank',
    'Some 0s and 1s were corrupted. Restore the 4×4 bank using the three binary-logic rules.'
  ));

  const rules=document.createElement('div');rules.className='memory-rules';
  rules.innerHTML='<span><strong>1</strong> Two 0s and two 1s in every row and column</span><span><strong>2</strong> Never three identical bits in a row</span><span><strong>3</strong> No completed rows or columns may be identical</span>';
  root.appendChild(rules);

  const puzzle=makeTakuzu(active.seed+':ram')||{n:4,solution:[[0,0,1,1],[0,1,0,1],[1,0,1,0],[1,1,0,0]],display:[[0,null,1,null],[null,1,null,1],[1,null,1,null],[null,1,null,0]]};
  const state=puzzle.display.map(r=>r.slice());
  const board=document.createElement('div');board.className='memory-grid';board.style.setProperty('--memory-n',String(puzzle.n));
  const buttons=[];

  for(let r=0;r<puzzle.n;r++)for(let c=0;c<puzzle.n;c++){
    const given=puzzle.display[r][c]!=null,b=document.createElement('button');b.type='button';b.className=`memory-cell${given?' given':''}`;b.dataset.r=String(r);b.dataset.c=String(c);b.disabled=given;
    function paint(){const v=state[r][c];b.textContent=v==null?'·':String(v);b.classList.toggle('zero',v===0);b.classList.toggle('one',v===1);}
    if(!given)b.addEventListener('click',()=>{state[r][c]=state[r][c]==null?0:state[r][c]===0?1:null;b.classList.remove('wrong','hint');paint();});
    paint();board.appendChild(b);buttons.push(b);
  }

  const actions=document.createElement('div');actions.className='memory-actions';
  const hint=document.createElement('button');hint.type='button';hint.className='secondary';hint.textContent='Highlight a useful cell';
  const check=document.createElement('button');check.type='button';check.textContent='Check memory';
  const status=document.createElement('div');status.className='logic-status';status.textContent='Tap a blank cell to cycle · → 0 → 1 → ·';

  hint.addEventListener('click',()=>{
    buttons.forEach(b=>b.classList.remove('hint'));
    const candidates=buttons.filter(b=>!b.disabled&&state[+b.dataset.r][+b.dataset.c]==null);
    if(!candidates.length){status.textContent='Every cell is filled. Run Check memory.';return;}
    const b=candidates[0];b.classList.add('hint');status.textContent='Look at the highlighted cell’s row and column. Check balance first, then look for pairs such as 00, 11, 0·0 or 1·1.';
  });

  check.addEventListener('click',()=>{
    let wrong=0,blank=0;
    buttons.forEach(b=>{b.classList.remove('wrong');const r=+b.dataset.r,c=+b.dataset.c,v=state[r][c];if(v==null)blank++;else if(v!==puzzle.solution[r][c]){wrong++;if(!b.disabled)b.classList.add('wrong');}});
    if(!wrong&&!blank){
      check.disabled=true;hint.disabled=true;buttons.forEach(b=>b.disabled=true);active.roomsCompleted=Math.max(active.roomsCompleted,3);active.playTone(920,.1,'sine',.04);status.textContent='RAM checksum valid. Binary memory bank restored.';
      root.appendChild(successPanel('RAM bank restored','Power, startup control and memory are stable.','Continue →',()=>{active.room=3;renderRoom();}));
    }else if(wrong){active.memoryFaults++;active.playTone(155,.08,'square',.025);status.textContent=`${wrong} bit${wrong===1?' is':'s are'} inconsistent with the unique repair. Recheck the highlighted cells.`;}
    else status.textContent=`${blank} memory cell${blank===1?' is':'s are'} still blank.`;
  });

  actions.append(hint,check);
  root.append(board,actions,status);
}

/* ---------------- Handoff to final diagnostic ---------------- */

function renderFinalGate(){
  setProgress('BOOT SEQUENCE · FINAL DIAGNOSTIC READY');
  const root=active.root;
  root.appendChild(roomHeader(
    'BOOT PATH RESTORED',
    'The micro:bit can boot again',
    'The physical repair is complete. One final diagnostic checks that the important computing ideas are understood before the processor reconnects to the rest of the board.'
  ));

  const board=document.createElement('div');board.className='microbit-cutaway';
  board.innerHTML='<div class="cutaway-leds"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><div class="cutaway-chip">MICROCONTROLLER<br><strong>BOOT OK</strong></div><div class="cutaway-radio">RADIO</div><div class="cutaway-buttons"><span>A</span><span>B</span></div>';

  const real=document.createElement('div');real.className='reality-note real-note';
  real.innerHTML='<strong>Inside the real micro:bit</strong><span>The board really does contain a microcontroller, memory, input/output connections, sensors and radio hardware. Our glowing data pulse and rooms are a game model — real electrical signals do not look like tiny moving dots.</span>';

  const stats=document.createElement('div');stats.className='adventure-run-stats';
  stats.innerHTML=`<span><strong>${active.bits.size}/3</strong> boot packets</span><span><strong>${active.arcadeFaults}</strong> signal faults</span><span><strong>${active.sequenceFaults}</strong> sequence faults</span><span><strong>${active.memoryFaults}</strong> RAM checks failed</span>`;

  const launch=document.createElement('button');launch.type='button';launch.className='launch-button final-diagnostic';launch.textContent='Run final diagnostic →';
  launch.addEventListener('click',()=>{
    if(active.completed)return;active.completed=true;
    const statsOut={
      bits:active.bits.size,
      arcadeFaults:active.arcadeFaults,
      sequenceFaults:active.sequenceFaults,
      memoryFaults:active.memoryFaults,
      roomsCompleted:active.roomsCompleted,
      bonusScore:Math.max(0,300-(active.arcadeFaults*20+active.sequenceFaults*15+active.memoryFaults*25))
    };
    const done=active.onComplete;stop();done(statsOut);
  });
  root.append(board,real,stats,launch);
}

global.TTCAdventure={
  supports(id){return String(id)==='1';},
  start,
  stop
};

})(typeof globalThis!=='undefined'?globalThis:this);
