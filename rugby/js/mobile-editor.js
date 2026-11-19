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
 // Camera shortcuts on the pitch itself: keep zoom, fit and pan discoverable
 // without scrolling through the desktop toolbar. They forward to existing controls.
 const field=document.querySelector?.('.field-wrap');
 if(field){
  const cameraTools=document.createElement('div');
  cameraTools.className='mobile-camera-controls';
  cameraTools.setAttribute('role','group');
  cameraTools.setAttribute('aria-label','Pitch zoom and pan');
  cameraTools.innerHTML='<button type="button" data-mobile-camera="zoomOut" aria-label="Zoom out">−</button>'+
   '<button type="button" data-mobile-camera="zoomFit" aria-label="Fit whole pitch to screen">Fit</button>'+
   '<button type="button" data-mobile-camera="zoomAction" aria-label="Fit current action to screen">Action</button>'+
   '<button type="button" data-mobile-camera="zoomIn" aria-label="Zoom in">+</button>'+
   '<button type="button" data-mobile-camera="panMode" aria-pressed="false" aria-label="Move the pitch view">Pan</button>';
  field.appendChild(cameraTools);
  // A visible contextual-action trigger means touch users never need right-click.
  const selectedActions=document.createElement('button');
  selectedActions.type='button';selectedActions.id='mobileObjectActions';
  selectedActions.className='mobile-object-actions';
  selectedActions.textContent='⋯ Object actions';selectedActions.hidden=true;
  selectedActions.setAttribute('aria-controls','objectMenu');
  field.appendChild(selectedActions);
  cameraTools.addEventListener('click',event=>{
   const button=event.target.closest('[data-mobile-camera]');
   if(!button||!enabled())return;
   const original=document.getElementById(button.dataset.mobileCamera);
   original?.click();
   if(button.dataset.mobileCamera==='panMode'){
    button.setAttribute('aria-pressed',original?.getAttribute('aria-pressed')||'false');
   }
  });
 }
 // Mobile: keep the view switch in the title bar, never atop pitch zoom.
 // Reparent the SAME button, retaining its event listener and pressed state.
 const visualMode=document.getElementById('minionMode');
 const modeHome=visualMode?.parentElement;
 const modeHeading=document.querySelector?.('.stage-heading');
 function placeVisualMode(mobile){
  if(!visualMode||!modeHome||!modeHeading)return;
  const target=mobile?modeHeading:modeHome;
  if(visualMode.parentElement!==target){
   if(mobile)target.appendChild(visualMode);
   else target.insertBefore(visualMode,target.firstChild);
  }
  visualMode.classList.toggle('mobile-mode-toggle',mobile);
 }
 // The original desktop toolbar is much too crowded on phones. Keep its
 // existing controls, but move them into the Edit bottom sheet. Put the only
 // visible mobile camera row beside a View button, outside the pitch.
 // The View details is portalled to body so overflow:hidden / overflow-x:auto
 // ancestors can never clip its contents behind the pitch.
 const toolbar=document.querySelector?.('.stage .toolbar');
 const boardActions=document.querySelector?.('.board-actions');
 const inspectorBody=document.querySelector?.('#inspectorPanel .inspector-body');
 const viewMenu=document.getElementById('viewMenu');
 const boardHome=boardActions?.parentElement,boardNext=boardActions?.nextSibling;
 const menuHome=viewMenu?.parentElement,menuNext=viewMenu?.nextSibling;
 const cameraTools=document.querySelector?.('.mobile-camera-controls');
 const cameraHome=cameraTools?.parentElement;
 let quickBar=null,viewButton=null,viewScrim=null;
 if(toolbar&&boardActions&&inspectorBody&&viewMenu){
  quickBar=document.createElement('div');
  quickBar.className='mobile-quick-controls';
  quickBar.setAttribute('role','group');
  quickBar.setAttribute('aria-label','Mobile pitch camera and view settings');
  toolbar.appendChild(quickBar);
  viewButton=document.createElement('button');
  viewButton.type='button';viewButton.id='mobileViewOptions';
  viewButton.textContent='View ▾';viewButton.setAttribute('aria-controls','viewMenu');
  viewButton.setAttribute('aria-expanded','false');
  quickBar.appendChild(viewButton);
  viewScrim=document.createElement('button');
  viewScrim.type='button';viewScrim.id='mobileViewScrim';
  viewScrim.className='mobile-view-scrim';viewScrim.hidden=true;
  viewScrim.setAttribute('aria-label','Close view options');
  body.appendChild(viewScrim);
  viewScrim.addEventListener('click',()=>{viewMenu.open=false});
  viewButton.addEventListener('click',()=>{viewMenu.open=!viewMenu.open});
  const syncView=()=>{
   const open=body.classList.contains('mobile-workspace')&&viewMenu.open;
   viewButton.setAttribute('aria-expanded',String(open));
   viewButton.classList.toggle('selected',open);
   viewScrim.hidden=!open;
  };
  viewMenu.addEventListener('toggle',syncView);
  viewMenu.querySelector('summary')?.addEventListener('click',()=>{queueMicrotask(syncView)});
 }
 function placeMobileUi(mobile){
  if(!quickBar||!viewMenu||!boardActions||!inspectorBody)return;
  if(mobile){
   // Portal first; otherwise the menu inherits the toolbar's scroll clipping.
   if(viewMenu.parentElement!==body)body.appendChild(viewMenu);
   if(boardActions.parentElement!==inspectorBody)inspectorBody.prepend(boardActions);
   if(cameraTools&&cameraTools.parentElement!==quickBar)quickBar.prepend(cameraTools);
  }else{
   viewMenu.open=false;
   viewScrim.hidden=true;
   if(boardHome&&boardActions.parentElement!==boardHome)boardHome.insertBefore(boardActions,boardNext);
   if(menuHome&&viewMenu.parentElement!==menuHome)menuHome.insertBefore(viewMenu,menuNext);
   if(cameraTools&&cameraHome&&cameraTools.parentElement!==cameraHome)cameraHome.appendChild(cameraTools);
   viewButton.setAttribute('aria-expanded','false');
  }
 }
 // The old mobile sheet tried to show both step cards AND timing tracks in
 // one clipped 54dvh grid (five children but only four declared rows).
 // Use two clear editing views inside the SAME existing timeline.
 const scenes=document.getElementById('scenes');
 let timelineSwitch=null,stepPanel='sequence';
 if(scenes?.parentElement===timeline){
  timelineSwitch=document.createElement('div');
  timelineSwitch.className='mobile-timeline-switch';
  timelineSwitch.setAttribute('role','group');
  timelineSwitch.setAttribute('aria-label','Choose step cards or player timing');
  timelineSwitch.innerHTML='<button type="button" data-mobile-step-panel="sequence" aria-pressed="true">Steps</button>'+
   '<button type="button" data-mobile-step-panel="timing" aria-pressed="false">Timing</button>'+
   '<button type="button" data-mobile-step-edit="true">Edit selected step</button>';
  timeline.insertBefore(timelineSwitch,scenes);
  timelineSwitch.addEventListener('click',event=>{
   const button=event.target.closest('button');
   if(!button||!enabled())return;
   if(button.dataset.mobileStepPanel){
    stepPanel=button.dataset.mobileStepPanel;
    paintStepPanel();
    return;
   }
   if(button.dataset.mobileStepEdit){
    const current=document.getElementById('editCurrent');
    if(current&&!current.hidden)current.click();
    const tab=document.getElementById('tabStep');
    if(tab)tab.click();else show('edit');
   }
  });
  scenes.addEventListener('click',event=>{
   if(!enabled()||!event.target.closest('[data-step]'))return;
   // app.js rebuilds the cards on selection; reveal the highlighted card.
   queueMicrotask(()=>revealSelectedStep());
  });
 }
 function revealSelectedStep(){
  if(!enabled()||!body.classList.contains('mobile-view-steps'))return;
  const selected=scenes?.querySelector?.('.scene.selected');
  selected?.scrollIntoView?.({behavior:'instant',block:'nearest',inline:'center'});
 }
 function paintStepPanel(){
  body.classList.toggle('mobile-timing-view',stepPanel==='timing');
  for(const button of timelineSwitch?.querySelectorAll('[data-mobile-step-panel]')||[]){
   const on=button.dataset.mobileStepPanel===stepPanel;
   button.setAttribute('aria-pressed',String(on));
   button.classList.toggle('selected',on);
  }
 }
 // Keep the original desktop sequence buttons available under one
 // mobile disclosure; all buttons retain their existing handlers and IDs.
 const timelineTop=timeline.querySelector?.('.timeline-top');
 const playback=timelineTop?.querySelector?.('.playback-group');
 const sequence=timelineTop?.querySelector?.('.sequence-group');
 const advancedIds=['whistleSound','restart','present','gameNav','breakdownNav','deleteStep','toggleTracks'];
 let more=null,moreContent=null;
 const advancedHomes=[];
 if(timelineTop&&playback&&sequence){
  more=document.createElement('details');more.className='mobile-timeline-more';
  const summary=document.createElement('summary');
  summary.textContent='More options';
  moreContent=document.createElement('div');moreContent.className='mobile-timeline-more-content';
  more.appendChild(summary);more.appendChild(moreContent);timelineTop.appendChild(more);
  for(const id of advancedIds){
   const element=document.getElementById(id);
   if(element?.parentElement)advancedHomes.push({element,home:element.parentElement,next:element.nextSibling});
  }
 }
 function placeTimelineExtras(mobile){
  if(!moreContent)return;
  if(mobile){
   for(const {element} of advancedHomes)if(element.parentElement!==moreContent)moreContent.appendChild(element);
  }else{
   more.open=false;
   for(const {element,home,next} of advancedHomes)if(element.parentElement!==home)home.insertBefore(element,next?.parentElement===home?next:null);
  }
 }
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
  if(viewMenu?.open)viewMenu.open=false;
  const context=document.getElementById('objectMenu');
  if(context&&!context.hidden)context.hidden=true;
  active=view;
  body.classList.toggle('hide-equipment',view!=='tools');
  body.classList.toggle('hide-inspector',view!=='edit');
  body.classList.toggle('hide-tracks',view!=='steps');
  paint();
  paintStepPanel();
  if(view==='steps')queueMicrotask(revealSelectedStep);
  sync();
 }
 function reset(mobile){
  placeVisualMode(mobile);
  placeMobileUi(mobile);
  placeTimelineExtras(mobile);
  if(mobile){body.classList.add('mobile-workspace');show('pitch')}
  else{
   body.classList.remove('mobile-workspace','mobile-timing-view',...VIEWS.map(x=>'mobile-view-'+x));
   active='pitch';
  }
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
