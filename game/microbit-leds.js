/* Tech Tinker: System Rescue — live BBC micro:bit 5x5 LED controller.
 * Controls the 25 lit LED <use> elements in the official v2 SVG.
 * The Foundation SVG stores LEDs column-major; this API accepts normal row/column coordinates.
 */
(function(global){
'use strict';

const SIZE=5;
const blank=()=>Array(SIZE*SIZE).fill(false);
let current=blank();
let flashTimer=null;
let restoreAfterFlash=null;

const PATTERNS={
  blank:[],
  check:[[0,3],[1,4],[2,3],[3,2],[4,1]],
  x:[[0,0],[0,4],[1,1],[1,3],[2,2],[3,1],[3,3],[4,0],[4,4]],
  question:[[0,1],[0,2],[0,3],[1,4],[2,3],[3,2],[4,2]],
  heart:[[0,1],[0,3],[1,0],[1,2],[1,4],[2,0],[2,4],[3,1],[3,3],[4,2]],
  dice5:[[0,0],[0,4],[2,2],[4,0],[4,4]],
  full:Array.from({length:25},(_,i)=>[Math.floor(i/5),i%5])
};

function normalizeCells(cells){
  const p=blank();
  for(const q of cells||[]){
    const r=Number(q?.[0]),c=Number(q?.[1]);
    if(Number.isInteger(r)&&Number.isInteger(c)&&r>=0&&r<SIZE&&c>=0&&c<SIZE)p[r*SIZE+c]=true;
  }
  return p;
}
function cellsFromPattern(p){
  const out=[];
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(p[r*SIZE+c])out.push([r,c]);
  return out;
}
function applyToObject(obj,pattern=current){
  let doc=null;
  try{doc=obj.contentDocument||null;}catch(_){}
  if(!doc)return false;
  const group=doc.getElementById('LEDsOn');
  if(!group)return false;
  const uses=Array.from(group.children).filter(n=>String(n.tagName||'').toLowerCase()==='use');
  if(uses.length<25)return false;
  group.style.display='inline';
  for(let col=0;col<SIZE;col++)for(let row=0;row<SIZE;row++){
    const use=uses[col*SIZE+row];
    const on=!!pattern[row*SIZE+col];
    use.style.display=on?'inline':'none';
    use.style.opacity=on?'1':'0';
  }
  const heart=doc.getElementById('LEDsHeart');
  if(heart)heart.style.display='none';
  obj.classList.add('led-ready');
  return true;
}
function bindObject(obj){
  if(!obj||obj.dataset.microbitLedBound==='1')return;
  obj.dataset.microbitLedBound='1';
  const ready=()=>{applyToObject(obj,current);obj.classList.add('led-ready');};
  obj.addEventListener('load',ready);
  if(!readyNow(obj))setTimeout(()=>obj.classList.add('led-ready'),1200);
}
function readyNow(obj){
  try{return !!obj.contentDocument&&applyToObject(obj,current);}catch(_){return false;}
}
function bindAll(){
  document.querySelectorAll('object.official-microbit-object').forEach(bindObject);
}
function render(){
  bindAll();
  document.querySelectorAll('object.official-microbit-object').forEach(obj=>applyToObject(obj,current));
}
function setCells(cells){
  const next=normalizeCells(cells);
  if(flashTimer){
    restoreAfterFlash=next;
    return;
  }
  current=next;
  render();
}
function setPattern(name){
  setCells(PATTERNS[name]||PATTERNS.blank);
}
function clear(){setPattern('blank');}
function progress(done,total){
  const d=Math.max(0,Number(done)||0),t=Math.max(1,Number(total)||1);
  const count=Math.max(0,Math.min(25,Math.round(d/t*25)));
  const cells=[];
  // Fill from bottom-left, row by row, like a tiny progress display.
  for(let i=0;i<count;i++){
    const fromBottom=Math.floor(i/5),col=i%5,row=4-fromBottom;
    cells.push([row,col]);
  }
  setCells(cells);
}
function flash(name='x',ms=320){
  if(flashTimer)clearTimeout(flashTimer);
  restoreAfterFlash=current.slice();
  current=normalizeCells(PATTERNS[name]||PATTERNS.x);
  render();
  flashTimer=setTimeout(()=>{
    current=restoreAfterFlash||blank();
    restoreAfterFlash=null;flashTimer=null;render();
  },Math.max(80,Number(ms)||320));
}
function getCells(){return cellsFromPattern(current);}
function mapPoint(row,col,rows,cols){
  const r=Math.max(0,Math.min(4,Math.round(Number(row)*4/Math.max(1,Number(rows)-1))));
  const c=Math.max(0,Math.min(4,Math.round(Number(col)*4/Math.max(1,Number(cols)-1))));
  return [r,c];
}

global.TTCMicrobitLED={setCells,setPattern,clear,progress,flash,getCells,mapPoint,patterns:PATTERNS};

bindAll();
if(typeof MutationObserver!=='undefined'){
  const observer=new MutationObserver(bindAll);
  observer.observe(document.documentElement,{childList:true,subtree:true});
}
})(typeof globalThis!=='undefined'?globalThis:this);
