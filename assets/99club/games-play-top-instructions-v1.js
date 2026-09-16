/* 99 Club Studio · Online Play top instructions v1.0.0
 * Moves the existing objective + How to play content above the board so the
 * player sees the rules before interacting, especially on phones.
 */
(function(){
'use strict';
let panel=null;
function arrange(){
  const card=document.querySelector('.tt99-play-board-card'),head=card?.querySelector('.tt99-play-board-head');
  const instruction=document.getElementById('tt99-play-instruction'),how=document.querySelector('.tt99-play-how');
  if(!card||!head||!instruction||!how)return;
  if(!panel||!panel.isConnected){
    panel=document.createElement('div');panel.className='tt99-play-top-instructions';
    head.insertAdjacentElement('afterend',panel);
  }
  if(instruction.parentElement!==panel)panel.appendChild(instruction);
  if(how.parentElement!==panel)panel.appendChild(how);
  instruction.classList.add('is-top');
}
function boot(){arrange();const root=document.getElementById('tt99-play-root');if(root&&window.MutationObserver)new MutationObserver(arrange).observe(root,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
