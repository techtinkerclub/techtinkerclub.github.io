// Matrix rain (slower, larger digits)
function startMatrix(){
  const c = matrixCanvas; if (!c) return;
  const g = c.getContext('2d', { alpha:true });

  // Tunables
  const FONT_PX = 26;      // bigger digits
  const COL_W   = 22;      // column width
  const FALL_MIN = 3;      // min fall speed per frame
  const FALL_VAR = 4;      // extra random speed
  const FRAME_SKIP = 2;    // draw every Nth frame (~30fps if 60Hz)

  let w=0,h=0,cols=0,drops=[];
  function size(){
    const r = stageEl.getBoundingClientRect();
    c.width  = Math.max(1, Math.floor(r.width));
    c.height = Math.max(1, Math.floor(r.height));
    w=c.width; h=c.height;
    cols = Math.max(1, Math.floor(w / COL_W));
    drops = new Array(cols).fill(0).map(()=> Math.random()*h);
    g.font = `${FONT_PX}px VT323, monospace`;
  }
  size(); setTimeout(size,0);
  const res = () => size();
  window.addEventListener('resize', res);

  let raf, frame=0;
  function tick(){
    frame = (frame + 1) % FRAME_SKIP;
    if (frame !== 0) { raf = requestAnimationFrame(tick); return; }

    g.fillStyle = 'rgba(8,12,26,0.18)';
    g.fillRect(0,0,w,h);
    for (let i=0;i<cols;i++){
      const ch = String((Math.random()*10)|0);
      const x = i * COL_W, y = drops[i];
      g.fillStyle = 'rgba(140,255,170,0.85)';
      g.fillText(ch, x, y);
      drops[i] = (y > h) ? 0 : y + (FALL_MIN + Math.random()*FALL_VAR);
    }
    raf = requestAnimationFrame(tick);
  }
  tick();

  matrix = { stop:()=>cancelAnimationFrame(raf), off:()=>window.removeEventListener('resize',res) };
}
  renderLevels();
})();
