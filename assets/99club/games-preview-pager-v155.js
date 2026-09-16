/* 99 Club Studio · paged worksheet preview v1.55
 * Replaces the old vertically stacked/truncated live preview with a single-page
 * reader. The large-pack generation cache remains untouched; only the v1.42
 * innerHTML preview limiter is retired before games-app renders the pack.
 */
(function(global){
'use strict';
const root=document.getElementById('tt99-games-root');if(!root)return;

// games-performance-v142 installs an instance-level innerHTML setter which removes
// pages from the HTML string. It is configurable, so deleting it restores the
// browser's native Element.prototype innerHTML before games-app performs its first render.
if(root.__tt99PreviewLimiter&&Object.prototype.hasOwnProperty.call(root,'innerHTML')){
  try{delete root.innerHTML;}catch(_){/* native fallback below */}
}
root.__tt99PagedPreviewV155=true;

let pupilIndex=0,answerIndex=0,lastPupilStack=null,lastAnswerStack=null,raf=0;
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;enhance();});}
function pageNumber(page,i,total){
  let footer=page.querySelector(':scope > footer');if(!footer)return;
  let n=footer.querySelector('.tt99-paper-page-number');
  if(!n){n=document.createElement('span');n.className='tt99-paper-page-number';footer.appendChild(n);}
  n.textContent=`Page ${i+1} of ${total}`;
}
function buildPager(stack,pages,kind){
  let index=kind==='answers'?answerIndex:pupilIndex;
  index=clamp(index,0,Math.max(0,pages.length-1));
  if(kind==='answers')answerIndex=index;else pupilIndex=index;
  let nav=stack.querySelector(':scope > .tt99-preview-pager');
  if(!nav){
    nav=document.createElement('div');nav.className='tt99-preview-pager';nav.setAttribute('role','navigation');nav.setAttribute('aria-label',`${kind==='answers'?'Answer':'Pupil'} preview pages`);
    nav.innerHTML='<button type="button" data-preview-prev aria-label="Previous page">‹</button><div class="tt99-preview-page-readout"><span>Page</span><input type="number" min="1" step="1" inputmode="numeric" aria-label="Preview page number"><span>of</span><strong data-preview-total></strong></div><button type="button" data-preview-next aria-label="Next page">›</button>';
    stack.insertBefore(nav,stack.firstChild);
    const go=delta=>{let next=(kind==='answers'?answerIndex:pupilIndex)+delta;next=clamp(next,0,pages.length-1);if(kind==='answers')answerIndex=next;else pupilIndex=next;showPages(stack,kind);};
    nav.querySelector('[data-preview-prev]').addEventListener('click',()=>go(-1));
    nav.querySelector('[data-preview-next]').addEventListener('click',()=>go(1));
    const input=nav.querySelector('input');
    const jump=()=>{const next=clamp((Number(input.value)||1)-1,0,pages.length-1);if(kind==='answers')answerIndex=next;else pupilIndex=next;showPages(stack,kind);};
    input.addEventListener('change',jump);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();jump();input.blur();}});
  }
  showPages(stack,kind);
}
function showPages(stack,kind){
  const pages=[...stack.querySelectorAll(':scope > article.tt99-game-paper')];if(!pages.length)return;
  let index=kind==='answers'?answerIndex:pupilIndex;index=clamp(index,0,pages.length-1);if(kind==='answers')answerIndex=index;else pupilIndex=index;
  pages.forEach((page,i)=>{const hidden=i!==index;page.classList.toggle('tt99-preview-page-hidden',hidden);page.setAttribute('aria-hidden',hidden?'true':'false');pageNumber(page,i,pages.length);});
  const nav=stack.querySelector(':scope > .tt99-preview-pager');if(!nav)return;
  const prev=nav.querySelector('[data-preview-prev]'),next=nav.querySelector('[data-preview-next]'),input=nav.querySelector('input'),total=nav.querySelector('[data-preview-total]');
  if(prev)prev.disabled=index===0;if(next)next.disabled=index===pages.length-1;if(input){input.max=String(pages.length);input.value=String(index+1);}if(total)total.textContent=String(pages.length);
}
function enhance(){
  const pupil=root.querySelector('.tt99-games-pupil-pages'),answers=root.querySelector('.tt99-games-answer-pages');
  if(pupil){if(pupil!==lastPupilStack){lastPupilStack=pupil;pupilIndex=0;}const pages=[...pupil.querySelectorAll(':scope > article.tt99-game-paper')];if(pages.length)buildPager(pupil,pages,'pupil');}
  if(answers){if(answers!==lastAnswerStack){lastAnswerStack=answers;answerIndex=0;}const pages=[...answers.querySelectorAll(':scope > article.tt99-game-paper')];if(pages.length)buildPager(answers,pages,'answers');}
}
new MutationObserver(schedule).observe(root,{childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
global.TT99GamesPreviewPagerV155={version:'1.55',refresh:schedule};
})(typeof globalThis!=='undefined'?globalThis:this);
