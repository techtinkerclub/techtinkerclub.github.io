class MenuScene {
  constructor(manager) { this.m = manager; }

  init() {
    const controls = document.getElementById('controls');
    controls.innerHTML = '';

    const startBtn = document.createElement('button');
    startBtn.textContent = '▶ Start';
    startBtn.className = 'wide';
    startBtn.onclick = () => this.m.set(new LoopsLagoon(this.m));
    controls.appendChild(startBtn);

    // Fill level dropdown now; LoopsLagoon will also refresh it on load
    const sel = document.getElementById('levelSelect');
    sel.innerHTML = '';
    (LoopsLagoon?.LEVELS || ["Easy"]).forEach((lvl, i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = `${i+1}. ${lvl.name}`;
      sel.appendChild(opt);
    });
  }

  draw() {
    background(248);
    push();
    textAlign(CENTER, CENTER);
    textSize(28);
    text('🗺️ CodeQuest Island', width/2, height/2 - 24);
    textSize(18);
    text('Use Repeat and Groups to solve harder levels.', width/2, height/2 + 8);
    pop();
  }
}