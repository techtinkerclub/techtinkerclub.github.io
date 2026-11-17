// A touch-first workspace wrapper for Classic and Coach Edition.
// This rearranges existing panels; it does not create another drill editor.
const VIEWS=['pitch','tools','edit','steps'];
export function initMobileEditor({enabled=()=>false,sync=()=>{}}={}){
 const body=document.body, timeline=document.getElementById('timelinePanel');
 if(!timeline)return {show:()=>{},reset:()=>{},update:()=>{}};
 const nav=document.createElement('nav');
 nav.className='mobile-workspace-nav';
 nav.setAttribute('aria-label','Mobile drill editor');
 nav.innerHTML='<button type="button" data-mobile-view="pitch" aria-pressed="true"><span aria-hidden="true">▦</span>Pitch</button>'+
  '<button type="button" data-mobile-view="tools" aria-pressed="false" aria-controls="equipmentPanel"><span aria-hidden="true">＋</span>Add</button>'+
  '<button type="button" data-mobile-view="edit" aria-pressed="false" aria-controls="inspectorPanel"><span aria-hidden="true">✎</span>Edit</button>'+
  '<button type="button" data-mobile-view="steps" aria-pressed="false" aria-controls="timelinePanel"><span aria-hidden="true">▤</span>Steps</button>'+
  '<button type="button" data-mobile-action="play" aria-label="Play drill"><span aria-hidden="true">▶</span><span class="mobile-command-label">Play</span></button>'+
  '<button type="button" data-mobile-action="save" aria-label="Save drill to GitHub"><span aria-hidden="true">⇧</span><span class="mobile-command-label">Save</span></button>';
 timeline.after(nav);
 const viewButtons=[...nav.querySelectorAll('[data-mobile-view]')];
 let active='pitch';
 function paint(){
  if(!enabled())return;
  body.classList.remove(...VIEWS.map(x=>'mobile-view-'+x));
  body.classList.add('mobile-view-'+active);
  for(const button of viewButtons){
   const selected=button.dataset.mobileView===active;
   button.setAttribute('aria-pressed',String(selected));
   button.classList.toggle('selected',selected);
  }
 }
 function show(view){
  if(!enabled()||!VIEWS.includes(view))return;
  active=view;
  body.classList.toggle('hide-equipment',view!=='tools');
  body.classList.toggle('hide-inspector',view!=='edit');
  body.classList.toggle('hide-tracks',view!=='steps');
  paint();sync();
 }
 function reset(mobile){
  if(mobile){body.classList.add('mobile-workspace');show('pitch')}
  else{body.classList.remove('mobile-workspace',...VIEWS.map(x=>'mobile-view-'+x));active='pitch'}
 }
 // Also reflect the original Tools and Inspector toolbar buttons.
 function update(){
  if(!enabled())return;
  if(!body.classList.contains('hide-equipment'))active='tools';
  else if(!body.classList.contains('hide-inspector'))active='edit';
  else if(active==='tools'||active==='edit')active='pitch';
  paint();
 }
 nav.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button||!enabled())return;
  if(button.dataset.mobileView){show(button.dataset.mobileView===active?'pitch':button.dataset.mobileView);return}
  if(button.dataset.mobileAction==='save'){document.getElementById('save')?.click();return}
  if(button.dataset.mobileAction==='play'){
   document.getElementById('play')?.click();
   show('pitch');
  }
 });
 // After placing an object or choosing a drawing tool, expose the pitch to tap/drag.
 // Keep settings, dropdowns and advanced configuration accessible in the drawer.
 const sidebar=document.getElementById('equipmentPanel');
 sidebar?.addEventListener('click',event=>{
  if(!enabled()||active!=='tools')return;
  const button=event.target.closest('button');
  if(!button||button.disabled)return;
  if(button.closest('#palette,#rugbyPalette,#legacyPalette,.action-grid')){
   queueMicrotask(()=>{if(enabled()&&active==='tools')show('pitch')});
  }
 });
 const playButton=document.getElementById('play'),saveState=document.getElementById('saveState');
 function updateCommands(){
  const player=nav.querySelector('[data-mobile-action="play"]');
  if(player&&playButton){
   const isPlaying=/pause|stop/i.test(playButton.textContent||'');
   player.querySelector('[aria-hidden]').textContent=isPlaying?'Ⅱ':'▶';
   player.querySelector('.mobile-command-label').textContent=isPlaying?'Pause':'Play';
   player.setAttribute('aria-label',isPlaying?'Pause drill':'Play drill');
   player.disabled=playButton.disabled;
  }
  const save=nav.querySelector('[data-mobile-action="save"]'),source=document.getElementById('save');
  if(save){save.disabled=!!source?.disabled;save.dataset.state=saveState?.dataset.state||'';save.title=saveState?.textContent?.trim()||'Save to GitHub'}
 }
 if(typeof MutationObserver!=='undefined'){
  const observer=new MutationObserver(updateCommands);
  if(playButton)observer.observe(playButton,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['disabled']});
  if(saveState)observer.observe(saveState,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['data-state']});
  const saveButton=document.getElementById('save');
  if(saveButton)observer.observe(saveButton,{attributes:true,attributeFilter:['disabled']});
 }
 updateCommands();
 return {show,reset,update};
}
