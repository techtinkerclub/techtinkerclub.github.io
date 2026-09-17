/* 99 Club Studio · contextual keypad drawer v2.01 */
(function(){
'use strict';
if(window.__tt99ContextKeypadV201)return;
window.__tt99ContextKeypadV201=true;
const pads='.tt99-wave184-keypad,.tt99-wave186-keypad,.tt99-v196-keypad';
const entries='[data-conn-entry],[data-trail-i],[data-cg-key],[data-machine],[data-sym],[data-mobile-answer]';
let activePad=null,activeEntry=null;
function isMobile(){return window.matchMedia('(max-width:700px)').matches;}
function board(){return document.getElementById('tt99-play-board');}
function ensureHandle(pad){let h=pad.querySelector(':scope > .tt99-context-pad-handle');if(h)return h;h=document.createElement('button');h.type='button';h.className='tt99-context-pad-handle';h.setAttribute('aria-label','Collapse number pad');h.setAttribute('aria-expanded','true');h.innerHTML='<span class="tt99-context-handle-bar" aria-hidden="true"></span><span class="tt99-context-handle-chevron" aria-hidden="true">⌄</span>';pad.insertBefore(h,pad.firstChild);return h;}
function setPadSpace(){const b=board();if(!b||!activePad)return;requestAnimationFrame(()=>{if(!activePad||!document.contains(activePad))return;const h=activePad.getBoundingClientRect().height;b.style.setProperty('--tt99-context-pad-space',Math.ceil(h+24)+'px');});}
function keepEntryVisible(entry){if(!entry||!activePad)return;requestAnimationFrame(()=>{if(!activePad||!document.contains(activePad)||!document.contains(entry))return;const h=activePad.getBoundingClientRect().height,r=entry.getBoundingClientRect(),top=84,bottom=window.innerHeight-h-18;if(r.bottom>bottom)window.scrollBy({top:r.bottom-bottom+12,behavior:'smooth'});else if(r.top<top)window.scrollBy({top:r.top-top-10,behavior:'smooth'});});}
function setCollapsed(collapsed){if(!activePad)return;activePad.classList.toggle('tt99-context-pad-collapsed',!!collapsed);const h=ensureHandle(activePad);h.setAttribute('aria-expanded',collapsed?'false':'true');h.setAttribute('aria-label',collapsed?'Open number pad':'Collapse number pad');setPadSpace();if(!collapsed)keepEntryVisible(activeEntry);}
function hidePad(){const b=board();if(activePad){activePad.classList.remove('tt99-context-pad-active','tt99-context-pad-collapsed');const h=activePad.querySelector(':scope > .tt99-context-pad-handle');if(h){h.setAttribute('aria-expanded','true');h.setAttribute('aria-label','Collapse number pad');}}if(b){b.classList.remove('tt99-has-context-pad');b.style.removeProperty('--tt99-context-pad-space');}activePad=null;activeEntry=null;}
function promotePad(entry){if(!isMobile())return;const b=board();if(!b||!b.contains(entry))return;const pad=b.querySelector(pads);if(!pad)return;if(activePad===pad&&document.contains(pad)){activeEntry=entry;setCollapsed(false);keepEntryVisible(entry);return;}const pr=pad.getBoundingClientRect(),er=entry.getBoundingClientRect(),screen=window.innerHeight,gap=pr.top-er.bottom;if(gap<=screen*.48){hidePad();return;}hidePad();activePad=pad;activeEntry=entry;ensureHandle(pad);pad.classList.add('tt99-context-pad-active');b.classList.add('tt99-has-context-pad');setCollapsed(false);setPadSpace();keepEntryVisible(entry);}
document.addEventListener('click',e=>{if(!isMobile()){hidePad();return;}const handle=e.target.closest('.tt99-context-pad-handle');if(handle&&activePad&&activePad.contains(handle)){e.preventDefault();setCollapsed(!activePad.classList.contains('tt99-context-pad-collapsed'));return;}if(e.target.closest(pads))return;const entry=e.target.closest(entries);if(entry){activeEntry=entry;setTimeout(()=>promotePad(entry),0);return;}hidePad();});
window.addEventListener('resize',()=>{if(!isMobile())hidePad();else if(activePad){setPadSpace();keepEntryVisible(activeEntry);}});
})();
