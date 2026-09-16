/* 99 Club Studio PWA registration + install helper v2 */
(function(){
'use strict';
if(!location.pathname.startsWith('/tools/99-club/'))return;

const standalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
const isSafari=/safari/i.test(navigator.userAgent)&&!/crios|fxios|edgios|opios/i.test(navigator.userAgent);
let deferredPrompt=null;
let installCard=null;

// Installed desktop/Android/iOS apps are deliberately isolated from the host
// website chrome. The normal browser site is unchanged.
if(standalone)document.documentElement.classList.add('tt99-standalone');

function registerSW(){
  if(!('serviceWorker' in navigator))return;
  window.addEventListener('load',()=>navigator.serviceWorker.register('/tools/99-club/sw.js',{scope:'/tools/99-club/'}).catch(err=>console.warn('99 Club PWA service worker registration failed',err)));
}

function ensureCard(){
  if(standalone||installCard)return;
  installCard=document.createElement('aside');
  installCard.className='tt99-pwa-install';
  installCard.setAttribute('aria-label','Install 99 Club Studio');
  installCard.innerHTML='<div><strong>Install 99 Club Studio</strong><span>Use it like an app and keep recent resources available offline.</span></div><button type="button" class="tt99-pwa-install__action">Install</button><button type="button" class="tt99-pwa-install__close" aria-label="Dismiss install message">×</button>';
  document.body.appendChild(installCard);
  installCard.querySelector('.tt99-pwa-install__close').addEventListener('click',()=>{sessionStorage.setItem('tt99-pwa-dismissed','1');hideCard();});
  installCard.querySelector('.tt99-pwa-install__action').addEventListener('click',install);
}

function hideCard(){if(installCard){installCard.remove();installCard=null;}}

function iosInstructions(){
  let modal=document.querySelector('.tt99-pwa-modal');
  if(modal)return;
  modal=document.createElement('div');
  modal.className='tt99-pwa-modal';
  modal.innerHTML='<div class="tt99-pwa-modal__panel" role="dialog" aria-modal="true" aria-labelledby="tt99-pwa-ios-title"><button type="button" class="tt99-pwa-modal__close" aria-label="Close">×</button><span class="tt99-pwa-modal__badge">99</span><h2 id="tt99-pwa-ios-title">Install 99 Club Studio</h2><p>On iPhone or iPad, Safari installs web apps from the Share menu.</p><ol><li>Tap <strong>Share</strong> in Safari.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Make sure <strong>Open as Web App</strong> is enabled if Safari shows that option, then tap <strong>Add</strong>.</li></ol></div>';
  document.body.appendChild(modal);
  const close=()=>modal.remove();
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  modal.querySelector('.tt99-pwa-modal__close').addEventListener('click',close);
}

async function install(){
  if(deferredPrompt){
    const p=deferredPrompt;
    deferredPrompt=null;
    p.prompt();
    try{await p.userChoice;}catch(e){}
    hideCard();
    return;
  }
  if(isiOS&&isSafari){iosInstructions();return;}
  alert('Use your browser menu and choose Install app or Add to Home Screen.');
}

window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();
  deferredPrompt=e;
  if(sessionStorage.getItem('tt99-pwa-dismissed')!=='1')ensureCard();
});
window.addEventListener('appinstalled',()=>{hideCard();deferredPrompt=null;});

function maybeShowIOS(){
  if(standalone||sessionStorage.getItem('tt99-pwa-dismissed')==='1')return;
  if(isiOS&&isSafari&&location.pathname==='/tools/99-club/')setTimeout(ensureCard,900);
}

registerSW();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',maybeShowIOS,{once:true});else maybeShowIOS();
})();
