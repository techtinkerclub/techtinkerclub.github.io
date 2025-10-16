// Loops Lagoon v0.2 — Levels + Repeat Groups + responsive layout

class LoopsLagoon {
  static LEVELS = [
    { name: "Easy — Straight & Turn",
      grid: 7,
      start: { r: 6, c: 0, dir: 'E' },
      goal:  { r: 0, c: 6 },
      rocks: [ {r:4,c:2}, {r:3,c:2}, {r:2,c:2} ],
      hint:  "Try [F F R] × 2 + F F"
    },
    { name: "Medium — Corridor",
      grid: 7,
      start: { r: 6, c: 0, dir: 'E' },
      goal:  { r: 0, c: 6 },
      rocks: [ {r:6,c:3},{r:5,c:3},{r:4,c:3},{r:3,c:3},{r:2,c:3},{r:1,c:3}, {r:1,c:5},{r:2,c:5} ],
      hint:  "Use a group for zig-zag like [F F R F L] × ?"
    },
    { name: "Tricky — Staircase",
      grid: 8,
      start: { r: 7, c: 0, dir: 'E' },
      goal:  { r: 0, c: 7 },
      rocks: [ {r:6,c:1},{r:5,c:1},{r:5,c:2},{r:4,c:2},{r:4,c:3},{r:3,c:3},{r:3,c:4},{r:2,c:4},{r:2,c:5} ],
      hint:  "Group the repeating step pattern."
    },
    { name: "Hard — Narrow Bridges",
      grid: 8,
      start: { r: 7, c: 0, dir: 'E' },
      goal:  { r: 0, c: 7 },
      rocks: [ {r:7,c:2},{r:6,c:2},{r:5,c:2},{r:4,c:2},{r:3,c:2},{r:2,c:2},
               {r:7,c:5},{r:6,c:5},{r:5,c:5},{r:4,c:5},{r:3,c:5},{r:2,c:5},
               {r:1,c:3},{r:1,c:4} ],
      hint:  "Two short groups can be cleaner than one long one."
    },
    { name: "Challenge — Minimal Steps",
      grid: 9,
      start: { r: 8, c: 0, dir: 'E' },
      goal:  { r: 0, c: 8 },
      rocks: [ {r:8,c:3},{r:7,c:3},{r:6,c:3},{r:5,c:3},{r:4,c:3},{r:3,c:3},
               {r:6,c:6},{r:5,c:6},{r:4,c:6},{r:3,c:6},{r:2,c:6},
               {r:1,c:1},{r:1,c:2},{r:1,c:4},{r:1,c:5},{r:1,c:7} ],
      hint:  "Aim for ≤ 20 expanded steps."
    }
  ];

  constructor(manager) {
    this.m = manager;

    // Level selection
    const sel = document.getElementById('levelSelect');
    this.levelIndex = Math.max(0, parseInt(sel?.value ?? 0, 10) || 0);
    this.level = LoopsLagoon.LEVELS[this.levelIndex];

    // Grid sizing responsive
    this.rows = this.cols = this.level.grid;
    this.margin = 16;
    this.cell = 56; // will be resized in draw()

    // Directions
    this.dirOrder = ['N','E','S','W'];
    this.dirVec = { N:{r:-1,c:0}, E:{r:0,c:1}, S:{r:1,c:0}, W:{r:0,c:-1} };

    // Sequence data model:
    // tokens = [ 'F' | 'L' | 'R' | {type:'group', rep:n, seq:['F','L',...] } ]
    this.tokens = [];
    this.topRepeat = 2;

    // Temp group edit
    this.buildingGroup = false;
    this.tempGroup = [];
    this.tempRep = 2;

    // Run state
    this.resetRun();
  }

  resetRun() {
    const s = this.level.start;
    this.player = { r: s.r, c: s.c, dir: s.dir };
    this.outcome = '';
    this.running = false;
    this.expanded = [];   // flattened command list for animation
    this.stepTicker = 0;
    this.stepDelay = 10;
    this.updateStatus('Ready');
  }

  init() {
    // Populate level dropdown (in case we came directly here)
    const sel = document.getElementById('levelSelect');
    sel.innerHTML = '';
    LoopsLagoon.LEVELS.forEach((lvl, i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = `${i+1}. ${lvl.name}`;
      if (i === this.levelIndex) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.onchange = () => this.m.set(new LoopsLagoon(this.m));

    const controls = document.getElementById('controls');
    controls.innerHTML = '';

    // Command buttons
    const btnF = this.mkBtn('F', () => this.addToken('F'));
    const btnL = this.mkBtn('L', () => this.addToken('L'));
    const btnR = this.mkBtn('R', () => this.addToken('R'));

    // Group controls
    const startG = this.mkBtn('Start Group [', () => {
      if (this.running || this.buildingGroup) return;
      this.buildingGroup = true; this.tempGroup = []; this.tempRep = 2;
      this.updateStatus('Building group… add F/L/R then “End Group”');
    });
    const endG = this.mkBtn('] ×', () => {
      if (this.running || !this.buildingGroup || this.tempGroup.length===0) return;
      this.tokens.push({ type:'group', rep: this.tempRep, seq: [...this.tempGroup] });
      this.buildingGroup = false; this.tempGroup = []; this.tempRep = 2;
      this.updateStatus('Group added');
    });
    const repMinus = this.mkBtn('– Group Rep', () => {
      if (!this.buildingGroup) return;
      if (this.tempRep>1) this.tempRep--;
      this.updateStatus(`Group repeat ×${this.tempRep}`);
    });
    const repPlus  = this.mkBtn('+ Group Rep', () => {
      if (!this.buildingGroup) return;
      if (this.tempRep<9) this.tempRep++;
      this.updateStatus(`Group repeat ×${this.tempRep}`);
    });

    // Top-level repeat
    const topMinus = this.mkBtn('– Repeat', () => { if(!this.running && this.topRepeat>1){ this.topRepeat--; this.renderStatus(); } });
    const topPlus  = this.mkBtn('+ Repeat', () => { if(!this.running && this.topRepeat<9){ this.topRepeat++; this.renderStatus(); } });

    // Editing
    const backBtn  = this.mkBtn('⟵ Back', () => {
      if (this.running) return;
      if (this.buildingGroup) this.tempGroup.pop(); else this.tokens.pop();
      this.renderStatus();
    });
    const clearBtn = this.mkBtn('Clear', () => {
      if (this.running) return;
      if (this.buildingGroup) { this.tempGroup = []; this.tempRep = 2; }
      else { this.tokens = []; this.topRepeat = 2; }
      this.renderStatus();
    });

    // Run/Reset/Menu
    const runBtn   = this.mkBtn('▶ Run', () => this.prepareRun());
    const resetBtn = this.mkBtn('↺ Reset', () => this.resetRun());
    const menuBtn  = this.mkBtn('🏝️ Menu', () => this.m.set(new MenuScene(this.m)));

    // Hint
    const hintBtn  = this.mkBtn('💡 Hint', () => this.updateStatus(this.level.hint || 'Think in repeating chunks!'));

    // Add to grid
    [
      btnF, btnL, btnR,
      startG, endG, repMinus, repPlus,
      topMinus, topPlus,
      backBtn, clearBtn, runBtn, resetBtn, menuBtn, hintBtn
    ].forEach(el => controls.appendChild(el));

    this.renderStatus();
  }

  mkBtn(label, fn){ const b=document.createElement('button'); b.textContent=label; b.onclick=fn; return b; }

  updateStatus(text){
    const pill = document.getElementById('statusPill');
    if (pill) pill.textContent = text;
  }

  renderStatus(){
    const seqText = this.prettyTokens(this.tokens);
    const groupText = this.buildingGroup ? ` [${this.tempGroup.join(' ')}] ×${this.tempRep}` : '';
    this.updateStatus(`Seq: ${seqText} ×${this.topRepeat}${groupText}`);
  }

  addToken(tok){
    if (this.running) return;
    if (this.buildingGroup) this.tempGroup.push(tok);
    else this.tokens.push(tok);
    this.renderStatus();
  }

  // Expand tokens to a flat list of 'F','L','R'
  expandTokens(){
    const out = [];
    const pushUnit = (t) => {
      if (typeof t === 'string') out.push(t);
      else if (t && t.type==='group') {
        for (let i=0;i<t.rep;i++){
          t.seq.forEach(x => out.push(x));
        }
      }
    };
    if (this.tokens.length===0) return [];
    for (let k=0;k<this.topRepeat;k++){
      this.tokens.forEach(pushUnit);
    }
    return out;
  }

  prepareRun(){
    if (this.running) return;
    if (this.buildingGroup && this.tempGroup.length>0){
      this.updateStatus('Finish the group with “] ×” first.');
      return;
    }
    this.expanded = this.expandTokens();
    if (this.expanded.length===0) { this.updateStatus('Add steps or a group first'); return; }

    // Reset player
    const s = this.level.start;
    this.player = { r: s.r, c: s.c, dir: s.dir };
    this.outcome = '';
    this.running = true;
    this.stepTicker = 0;
    this.updateStatus(`Running… ${this.expanded.length} steps`);
  }

  update(){
    if(!this.running || this.outcome) return;

    this.stepTicker++;
    if(this.stepTicker < this.stepDelay) return;
    this.stepTicker = 0;

    if(this.expanded.length === 0) {
      // Finished; did we reach goal?
      if(this.player.r === this.level.goal.r && this.player.c === this.level.goal.c) {
        this.outcome = 'win';
        this.updateStatus('🎉 Success!');
      } else {
        this.outcome = 'stopped';
        this.updateStatus('Sequence finished, not at goal — adjust plan.');
      }
      this.running = false;
      return;
    }

    const cmd = this.expanded.shift();
    if(cmd === 'L' || cmd === 'R') {
      this.player.dir = this.turn(this.player.dir, cmd);
      return;
    }
    if(cmd === 'F'){
      const next = { r: this.player.r + this.dirVec[this.player.dir].r,
                     c: this.player.c + this.dirVec[this.player.dir].c };
      if(!this.inBounds(next) || this.hitRock(next)) {
        this.outcome = this.inBounds(next) ? 'blocked' : 'offgrid';
        this.updateStatus(this.outcome==='blocked' ? '⛔ Blocked by a rock' : '🌀 Off the map');
        this.running = false;
        return;
      }
      this.player = { ...next, dir: this.player.dir };
    }
  }

  inBounds(p){ return p.r>=0 && p.c>=0 && p.r<this.rows && p.c<this.cols; }
  hitRock(p){ return this.level.rocks.some(o=>o.r===p.r && o.c===p.c); }

  turn(dir, cmd){
    const i = this.dirOrder.indexOf(dir);
    if(cmd==='L') return this.dirOrder[(i+3)%4];
    if(cmd==='R') return this.dirOrder[(i+1)%4];
    return dir;
  }

  prettyTokens(tokens){
    if (!tokens || tokens.length===0) return '(empty)';
    return tokens.map(t => {
      if (typeof t === 'string') return t;
      if (t && t.type==='group') return `[${t.seq.join(' ')}] ×${t.rep}`;
      return '?';
    }).join(' ');
  }

  // ── Drawing ───────────────────────────────────────────────
  draw(){
    background(245);

    // Responsive cell size: fit width
    const maxW = Math.min(windowWidth, 960) - this.margin*2 - 4;
    this.cell = Math.floor(maxW / this.cols);
    const canvasW = this.cols*this.cell + this.margin*2;
    const canvasH = this.rows*this.cell + this.margin*2 + 36; // message room
    resizeCanvas(canvasW, canvasH);

    this.drawGrid();
    this.drawOutcome();
  }

  drawGrid(){
    const w = this.cols * this.cell;
    const h = this.rows * this.cell;
    translate(this.margin, this.margin);

    // Board
    stroke(220); fill(250);
    rect(0,0,w,h,12);

    // Cells
    for(let r=0;r<this.rows;r++){
      for(let c=0;c<this.cols;c++){
        noFill(); stroke(235);
        rect(c*this.cell, r*this.cell, this.cell, this.cell);
      }
    }

    // Rocks
    this.level.rocks.forEach(o=>{
      fill(200, 80, 80); noStroke();
      rect(o.c*this.cell+8, o.r*this.cell+8, this.cell-16, this.cell-16, 8);
    });

    // Goal
    const g = this.level.goal;
    noStroke(); fill(255,195,0);
    const cx = g.c*this.cell + this.cell/2, cy = g.r*this.cell + this.cell/2;
    push();
    translate(cx, cy);
    beginShape();
    for (let i=0;i<5;i++){
      const a = -PI/2 + i*2*PI/5;
      const x1 = cos(a)*16, y1 = sin(a)*16;
      const x2 = cos(a+PI/5)*6, y2 = sin(a+PI/5)*6;
      vertex(x1,y1); vertex(x2,y2);
    }
    endShape(CLOSE);
    pop();

    // Player
    const p = this.player;
    const px = p.c*this.cell + this.cell/2, py = p.r*this.cell + this.cell/2;
    fill(90,130,255); noStroke();
    circle(px, py, this.cell*0.55);

    // Direction arrow
    stroke(255); strokeWeight(3);
    const dv = this.dirVec[p.dir];
    line(px, py, px + dv.c*(this.cell*0.28), py + dv.r*(this.cell*0.28));
    strokeWeight(1);

    // Top banner text
    resetMatrix();
    fill(0); noStroke(); textAlign(CENTER);
    textSize(16);
    text(`${LoopsLagoon.LEVELS[this.levelIndex].name} — Repeat ×${this.topRepeat}`, width/2, 14);
    textSize(14);
    text(this.prettyTokens(this.tokens), width/2, 32);
  }

  drawOutcome(){
    if(!this.outcome) return;
    fill(0); textAlign(CENTER); textSize(18);
    const msg = {
      win: '🎉 Success! You reached the star!',
      blocked: '⛔ Blocked by a rock — adjust your plan.',
      offgrid: '🌀 Off the map — check turns.',
      stopped: '😺 Finished but not at goal — add steps or increase repeat.'
    }[this.outcome] || this.outcome;
    text(msg, width/2, height - 12);
  }
}