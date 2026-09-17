/* 99 Club Studio · Killer / Sum Sudoku preview wording v1.81 */
(function(global){
'use strict';
const root=document.getElementById('tt99-games-root');
if(!root)return;
let queued=false;
function polish(){
  queued=false;
  root.querySelectorAll('.tt99-killer-grid').forEach(grid=>{
    const note=grid.nextElementSibling;
    if(note?.classList?.contains('tt99-v140-note')){
      note.textContent='Small numbers are cage totals. Thin grey outlines show each cage.';
    }
  });
}
function schedule(){
  if(queued)return;
  queued=true;
  queueMicrotask(polish);
}
if(global.MutationObserver)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
schedule();
})(typeof globalThis!=='undefined'?globalThis:this);
