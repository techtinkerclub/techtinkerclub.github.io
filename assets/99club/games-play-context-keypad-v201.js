/* 99 Club Studio · unified contextual keypad drawer v2.02
 * One input model across phone, tablet, hybrid and desktop:
 * - touch/pen selection opens the drawer automatically;
 * - desktop keeps the drawer closed by default so the physical keyboard can be used;
 * - the compact Keypad/Keyboard button always provides mouse-only access.
 */
(function(){
'use strict';
if(window.__tt99ContextKeypadV202)return;
window.__tt99ContextKeypadV202=true;

const PAD_SELECTOR=[
  '.tt99-wave184-keypad',
  '.tt99-wave186-keypad',
  '.tt99-v196-keypad',
  '.tt99-number-keypad',
  '.tt99-alpha-pad',
  '.tt99-towers-keypad',
  '.tt99-crossnumber-keypad',
  '.tt99-letter-keypad',
  '.tt99-extra-op-pad'
].join(',');

const ENTRY_SELECTOR=[
  '[data-conn-entry]',
  '[data-trail-i]',
  '[data-cg-key]',
  '[data-machine]',
  '[data-sym]',
  '[data-mobile-answer]',
  '[data-bl-answer]',
  '.tt99-numbergrid-cell.is-editable',
  '.tt99-kakuro-play.is-editable',
  '[data-letter]',
  '[data-alpha-key]',
  '.tt99-towers-cell',
  '.tt99-crossnumber-cell',
  '[data-cw]',
  '[data-cw-clue]',
  '[data-slot]'
].join(',');

let activePad=null;
let activeEntry=null;
let lastPointerType='';
let observer=null;
let manageQueued=false;
let padId=0;

function board(){return document.getElementById('tt99-play-board');}
function mq(q){try{return window.matchMedia(q).matches;}catch(_){return false;}}
function inputProfile(){
  const primaryCoarse=mq('(pointer: coarse)');
  const primaryHover=mq('(hover: hover)');
  const anyFine=mq('(any-pointer: fine)');
  const touch=(navigator.maxTouchPoints||0)>0;
  if(primaryCoarse&&!primaryHover)return anyFine?'hybrid':'touch';
  if(touch&&anyFine)return 'hybrid';
  return 'desktop';
}
function autoOpenForCurrentInput(){
  if(lastPointerType==='mouse')return false;
  if(lastPointerType==='touch'||lastPointerType==='pen')return true;
  if(inputProfile()==='touch')return true;
  return window.innerWidth<=700;
}
function reserveBoardSpace(){
  return inputProfile()!=='desktop'||window.innerWidth<=760;
}
function padLabel(pad){
  if(!pad)return 'Keypad';
  if(pad.matches('.tt99-letter-keypad'))return 'Keyboard';
  if(pad.matches('.tt99-extra-op-pad'))return 'Operators';
  return 'Keypad';
}
function currentPad(){
  const b=board();
  return b?.querySelector(PAD_SELECTOR)||null;
}
function ensureLauncher(b){
  let btn=b.querySelector(':scope > .tt99-context-pad-launcher');
  if(btn)return btn;
  btn=document.createElement('button');
  btn.type='button';
  btn.className='tt99-context-pad-launcher';
  btn.hidden=true;
  btn.setAttribute('aria-expanded','false');
  b.appendChild(btn);
  return btn;
}
function ensureHandle(pad){
  let h=pad.querySelector(':scope > .tt99-context-pad-handle');
  if(h)return h;
  h=document.createElement('div');
  h.className='tt99-context-pad-handle';
  h.setAttribute('role','button');
  h.setAttribute('tabindex','0');
  h.setAttribute('aria-label',`Close ${padLabel(pad).toLowerCase()}`);
  h.innerHTML='<span class="tt99-context-handle-bar" aria-hidden="true"></span><span class="tt99-context-handle-text">Close</span>';
  pad.insertBefore(h,pad.firstChild);
  return h;
}
function clearBoardSpace(){
  const b=board();
  if(!b)return;
  b.classList.remove('tt99-has-context-pad','tt99-context-pad-reserve');
  b.style.removeProperty('--tt99-context-pad-space');
}
function setPadSpace(){
  const b=board();
  if(!b||!activePad||!document.contains(activePad))return;
  requestAnimationFrame(()=>{
    if(!activePad||!document.contains(activePad))return;
    const h=activePad.getBoundingClientRect().height;
    b.style.setProperty('--tt99-context-pad-space',Math.ceil(h+24)+'px');
    b.classList.toggle('tt99-context-pad-reserve',reserveBoardSpace());
  });
}
function setCollapsed(collapsed){
  if(!activePad)return;
  activePad.classList.toggle('tt99-context-pad-collapsed',!!collapsed);
  const h=ensureHandle(activePad);
  h.setAttribute('aria-expanded',collapsed?'false':'true');
  h.setAttribute('aria-label',collapsed?`Open ${padLabel(activePad).toLowerCase()}`:`Collapse ${padLabel(activePad).toLowerCase()}`);
  const text=h.querySelector('.tt99-context-handle-text');
  if(text)text.textContent=collapsed?'Open':'Close';
  setPadSpace();
  if(!collapsed)keepEntryVisible(activeEntry);
}
function keepEntryVisible(entry){
  if(!entry||!activePad||!reserveBoardSpace())return;
  requestAnimationFrame(()=>{
    if(!activePad||!document.contains(activePad)||!document.contains(entry))return;
    const h=activePad.getBoundingClientRect().height;
    const r=entry.getBoundingClientRect();
    const top=84;
    const bottom=window.innerHeight-h-18;
    if(r.bottom>bottom)window.scrollBy({top:r.bottom-bottom+12,behavior:'smooth'});
    else if(r.top<top)window.scrollBy({top:r.top-top-10,behavior:'smooth'});
  });
}
function syncLauncher(){
  const b=board();
  if(!b)return;
  const pad=currentPad();
  const btn=ensureLauncher(b);
  if(!pad){
    btn.hidden=true;
    btn.removeAttribute('aria-controls');
    btn.setAttribute('aria-expanded','false');
    return;
  }
  btn.hidden=false;
  btn.textContent=`⌨ ${padLabel(pad)}`;
  btn.setAttribute('aria-controls',pad.id);
  btn.setAttribute('aria-expanded',String(activePad===pad));
  btn.setAttribute('aria-label',`${activePad===pad?'Close':'Open'} on-screen ${padLabel(pad).toLowerCase()}`);
}
function hidePad(){
  if(activePad){
    activePad.classList.remove('tt99-context-pad-active','tt99-context-pad-collapsed');
    activePad.setAttribute('aria-hidden','true');
  }
  activePad=null;
  activeEntry=null;
  clearBoardSpace();
  syncLauncher();
}
function openPad(pad,entry){
  const b=board();
  if(!b||!pad||!b.contains(pad))return;
  if(activePad&&activePad!==pad){
    activePad.classList.remove('tt99-context-pad-active');
    activePad.setAttribute('aria-hidden','true');
  }
  activePad=pad;
  activeEntry=entry||activeEntry;
  ensureHandle(pad);
  pad.classList.add('tt99-context-pad-active');
  pad.classList.remove('tt99-context-pad-collapsed');
  pad.setAttribute('aria-hidden','false');
  b.classList.add('tt99-has-context-pad');
  syncLauncher();
  setPadSpace();
  keepEntryVisible(activeEntry);
}
function manageCurrentPad(){
  manageQueued=false;
  const b=board();
  if(!b)return;
  b.dataset.tt99InputProfile=inputProfile();

  if(activePad&&!document.contains(activePad)){
    activePad=null;
    activeEntry=null;
    clearBoardSpace();
  }

  const pad=currentPad();
  if(pad){
    if(!pad.dataset.tt99ContextManaged){
      pad.dataset.tt99ContextManaged='1';
      pad.classList.add('tt99-context-pad-managed');
      if(!pad.id)pad.id=`tt99-context-pad-${++padId}`;
      pad.setAttribute('aria-hidden',activePad===pad?'false':'true');
      ensureHandle(pad);
    }
  }else if(activePad){
    hidePad();
  }
  syncLauncher();
}
function scheduleManage(){
  if(manageQueued)return;
  manageQueued=true;
  requestAnimationFrame(manageCurrentPad);
}
function installObserver(){
  const b=board();
  if(!b)return;
  observer?.disconnect();
  observer=new MutationObserver(scheduleManage);
  observer.observe(b,{childList:true,subtree:true});
  manageCurrentPad();
}

document.addEventListener('pointerdown',e=>{lastPointerType=e.pointerType||'';},{capture:true,passive:true});

document.addEventListener('click',e=>{
  const b=board();
  if(!b)return;
  manageCurrentPad();

  const launcher=e.target.closest('.tt99-context-pad-launcher');
  if(launcher&&b.contains(launcher)){
    e.preventDefault();
    const pad=currentPad();
    if(!pad)return;
    if(activePad===pad)hidePad();else openPad(pad,activeEntry);
    return;
  }

  const handle=e.target.closest('.tt99-context-pad-handle');
  if(handle&&activePad&&activePad.contains(handle)){
    e.preventDefault();
    setCollapsed(!activePad.classList.contains('tt99-context-pad-collapsed'));
    return;
  }

  if(e.target.closest(PAD_SELECTOR))return;

  const entry=e.target.closest(ENTRY_SELECTOR);
  const pad=currentPad();
  if(entry&&pad&&b.contains(entry)){
    activeEntry=entry;
    if(activePad===pad){
      setPadSpace();
      keepEntryVisible(entry);
    }else if(autoOpenForCurrentInput()){
      setTimeout(()=>openPad(pad,entry),0);
    }
    return;
  }

  if(activePad)hidePad();
});

document.addEventListener('keydown',e=>{
  if(!activePad)return;
  const h=e.target.closest?.('.tt99-context-pad-handle');
  if(h&&(e.key==='Enter'||e.key===' ')){
    e.preventDefault();
    setCollapsed(!activePad.classList.contains('tt99-context-pad-collapsed'));
  }else if(e.key==='Escape'){
    hidePad();
  }
});

window.addEventListener('resize',()=>{
  const b=board();
  if(b)b.dataset.tt99InputProfile=inputProfile();
  if(activePad){
    setPadSpace();
    keepEntryVisible(activeEntry);
  }
});

function boot(){
  installObserver();
  setTimeout(manageCurrentPad,0);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
