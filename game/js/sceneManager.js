class SceneManager {
  constructor() { this.current = null; }
  set(scene) { this.current = scene; this.current.init?.(); }
  update() { this.current?.update?.(); }
  draw()   { this.current?.draw?.(); }
  keyPressed(k) { this.current?.keyPressed?.(k); }
  mousePressed() { this.current?.mousePressed?.(); }
}