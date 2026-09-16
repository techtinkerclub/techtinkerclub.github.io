/* 99 Club Studio · Online Play completion preview v1.0.0 */
(function(){
'use strict';
function sanitiseClone(node){
  node.removeAttribute?.('id');
  node.querySelectorAll?.('[id]').forEach(el=>el.removeAttribute('id'));
  node.querySelectorAll?.('button,input,select,textarea,a').forEach(el=>{
    el.setAttribute('tabindex','-1');
    el.setAttribute('aria-hidden','true');
    if('disabled' in el)el.disabled=true;
  });
  node.querySelectorAll?.('.tt99-number-keypad,.tt99-cycle-note,.tt99-hashi-note,.tt99-play-board-tip').forEach(el=>el.remove());
}
function injectPreview(){
  const popup=document.getElementById('tt99-play-complete');
  if(!popup||popup.hidden||popup.querySelector('.tt99-play-complete-solution'))return;
  const card=popup.querySelector('.tt99-play-complete-card');
  const source=document.getElementById('tt99-play-board');
  if(!card||!source||!source.firstElementChild)return;
  const clone=source.cloneNode(true);
  sanitiseClone(clone);
  clone.classList.add('tt99-play-complete-snapshot');
  clone.setAttribute('aria-hidden','true');
  const wrap=document.createElement('section');
  wrap.className='tt99-play-complete-solution';
  wrap.innerHTML='<div class="tt99-play-complete-solution-head"><small>Your solution</small></div><div class="tt99-play-complete-solution-board"></div>';
  wrap.querySelector('.tt99-play-complete-solution-board').appendChild(clone);
  card.appendChild(wrap);
}
function watch(){
  const popup=document.getElementById('tt99-play-complete');
  if(!popup)return false;
  new MutationObserver(injectPreview).observe(popup,{childList:true,subtree:false,attributes:true,attributeFilter:['hidden']});
  injectPreview();
  return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!watch()){const root=document.getElementById('tt99-play-root');if(root)new MutationObserver(()=>watch()).observe(root,{childList:true,subtree:true});}},{once:true});else if(!watch()){const root=document.getElementById('tt99-play-root');if(root)new MutationObserver(()=>watch()).observe(root,{childList:true,subtree:true});}
})();
