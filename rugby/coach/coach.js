/* Coach Edition: task-based controls over the existing Rugby Coaching Studio.
 * All drill changes go through the original app's DOM event handlers. There
 * is no competing drill model, renderer, storage format or animation engine.
 */
const $=id=>document.getElementById(id);
const body=document.body;
body.classList.add('coach-edition','coach-guided');

const CATEGORIES={
 setup:[
  {id:'twoTeams',icon:'♟',title:'Add 2 attackers + 2 defenders',description:'Build a small group to arrange on the pitch. No other objects are changed.'},
  {id:'threeVTwo',icon:'♟',title:'Add 3 attackers + 2 defenders',description:'Start a simple 3 v 2 exercise; drag the players into position.'},
  {id:'attacker',icon:'＋',title:'Add attacker',description:'Add one attacker. Drag them into position on the field.'},
  {id:'defender',icon:'＋',title:'Add defender',description:'Add one defender and place them opposite the attackers.'},
  {id:'ball',icon:'◉',title:'Add a rugby ball',description:'Put a ball in the drill; give it to a player whenever you are ready.'},
  {id:'fieldLine',icon:'━',title:'Add a practice/reference line',description:'Mark a start line, tackle boundary or zone. Not an offside guide; adjust its length, direction and colour.'},
  {id:'sausage',icon:'▬',title:'Place a ground bag',description:'Add a sausage bag lying on the pitch.'},
  {id:'shield',icon:'▤',title:'Add contact shield',description:'Add a shield, then choose its holder in Object.'},
  {id:'donut',icon:'◯',title:'Add tackle donut',description:'Set its ready, rolling or down state using Object.'},
  {id:'setUp',icon:'⚙',title:'Pitch, age and drill details',description:'Name the activity, set the age group and adjust the playing area.'}
 ],
 move:[
  {id:'move',icon:'↝',title:'Show a player running',description:'Select the player, then draw their movement path.'},
  {id:'step',icon:'＋',title:'Add the next step',description:'Keep the current arrangement and show the next action.'},
  {id:'whistle',icon:'♫',title:'Coach blows whistle · GO',description:'Select the coach. Add a whistle that starts the first action step.'},
  {id:'outcome',icon:'◆',title:'Make a decision playable · A / B',description:'Select a yellow decision diamond to turn its drawn run or pass into animation. Or create a new A/B fork at this step.'},
  {id:'attach',icon:'◉',title:'Give a free ball to a player',description:'Choose a player to carry the ball before making a pass.'},
  {id:'pass',icon:'⇢',title:'Pass the ball',description:'Choose the receiver; the original ball-passing animation is used.'},
  {id:'release',icon:'↗',title:'Release the ball',description:'Place the ball on the ground after a carry or tackle.'},
  {id:'turnover',icon:'⇄',title:'Change possession',description:'Choose a new ball carrier when the other team wins it.'},
  {id:'timing',icon:'◷',title:'Fine-tune who moves when',description:'Show timing tracks to drag the start and end of a run.'}
 ],
 contact:[
  {id:'padRuck',icon:'▥',title:'Set up a ground-bag ruck',description:'Add a ground sausage bag and its linked ruck marker together.'},
  {id:'linkRuck',icon:'♙',title:'Add ruck to an existing bag',description:'Select a ground bag first, then add the linked ruck.'},
  {id:'members',icon:'◎',title:'Choose players in the ruck',description:'Select the ruck, then link the participants without moving them.'},
  {id:'breakdown',icon:'▸',title:'Build the ruck sequence',description:'Move through arrival, ruck, contest and play-away steps.'},
  {id:'contest',icon:'⇆',title:'Animate a push–pull contest',description:'Choose distance and winner in the selected Contest step.'},
  {id:'nextBall',icon:'➝',title:'Choose who plays the ball next',description:'Select the waiting player and ball; create the next step explicitly.'},
  {id:'tackle',icon:'⬡',title:'Start a tackle sequence',description:'Place the tackle marker, then follow the existing breakdown editor.'},
  {id:'guided',icon:'▤',title:'Create a guided game phase',description:'Choose a set piece or restart with players and editable stages.'}
 ],
 finish:[
  {id:'notes',icon:'✎',title:'Complete the coaching card',description:'Add the objective, instructions, coaching points and safety notes.'},
  {id:'check',icon:'✓',title:'Check the drill',description:'Review possible mistakes before sharing; this does not edit anything.'},
  {id:'variation',icon:'⧉',title:'Make a variation',description:'Create a new drill based on this one without overwriting it.'},
  {id:'presentation',icon:'▣',title:'Preview the animation',description:'Play the finished drill without the editing controls.'},
  {id:'share',icon:'↗',title:'Share or download',description:'Make a read-only link, export a file, or print coaching sheets.'},
  {id:'save',icon:'▾',title:'Save to the shared library',description:'Use the existing GitHub workflow. Never add children’s personal details.'}
 ]
};
const TITLES={setup:'Players & equipment',move:'Movement & ball',contact:'Contact & contest',finish:'Finish & review'};
const HELP={
 setup:'Start with only the players and equipment you need. Move each object by dragging it on the pitch.',
 move:'Each new step describes what has changed since the previous step. Select the player or ball first for movement and passing.',
 contact:'The ruck marker links the players and the ground pad. Choose a winning side yourself; nothing should guess who plays the ball next.',
 finish:'The full coaching card, check tool, presentation, exports and save workflow are unchanged from Classic Studio.'
};
let chosenCategory='setup',toastTimeout=null,pendingAction=null;
const label={new:'Start a new drill',library:'Open drill library',continue:'Continue editing'};
function tell(message){
 const node=$('coachToast');if(!node)return;
 node.textContent=message;node.hidden=false;
 if(toastTimeout)clearTimeout(toastTimeout);
 toastTimeout=setTimeout(()=>node.hidden=true,7000);
}
const closeDialogs=()=>{
 for(const id of ['coachWelcome','coachActionDialog'])if($(id)?.open)$(id).close();
};
function markWelcomeSeen(){try{localStorage.setItem('rugbyCoachEditionWelcomeV1','1')}catch{}}
function launch(id){
 const el=$(id);
 if(!el){tell('This action is not available in the current editor.');return false}
 if(el.disabled){tell('Select the relevant player or ball first, then try again.');return false}
 el.click();return true;
}
function add(type){
 const element=document.querySelector('#palette [data-type="'+type+'"],#rugbyPalette [data-type="'+type+'"]');
 if(!element){tell('Could not find '+type+' in the original object palette.');return false}
 element.click();return true;
}
function editObject(id){
 if(!launch('tabObject'))return false;
 const element=$(id);if(!element||element.hidden)return false;
 if(element.tagName==='DETAILS')element.open=true;
 element.scrollIntoView({behavior:'smooth',block:'nearest'});
 return true;
}
function openActions(tab='setup'){
 pendingAction=null;
 chosenCategory=Object.hasOwn(CATEGORIES,tab)?tab:'setup';
 renderObjectChoices();
 renderCards();
 closeDialogs();
 const dialog=$('coachActionDialog');
 if(!dialog)return;
 dialog.showModal();
}
function renderCards(){
 const container=$('coachActionCards');
 if(!container)return;
 container.innerHTML=CATEGORIES[chosenCategory].map(item=>
  '<button class="coach-action-card" type="button" data-coach-command="'+item.id+'">'+
   '<span class="coach-action-icon" aria-hidden="true">'+item.icon+'</span>'+
   '<span class="coach-action-copy"><strong>'+item.title+'</strong><small>'+item.description+'</small></span></button>'
 ).join('');
 for(const tab of document.querySelectorAll('[data-coach-tab]')){
  const active=tab.dataset.coachTab===chosenCategory;
  tab.setAttribute('aria-selected',String(active));
  tab.tabIndex=active?0:-1;
 }
 $('coachActionsTitle').textContent=TITLES[chosenCategory];
 $('coachActionHelp').textContent=HELP[chosenCategory];
}
// Use the original object picker, so the guide never maintains a second selection model.
function renderObjectChoices(){
 const source=$('objectPicker'),target=$('coachObjectChoice'),hint=$('coachSelectionHelp');
 if(!source||!target||!hint)return;
 target.replaceChildren(...Array.from(source.options).map(option=>new Option(option.textContent,option.value)));
 target.value=source.value||'';
 const current=source.selectedOptions?.[0]?.textContent;
 hint.textContent=source.value?'Selected: '+current+'. Choose an action below.':'No player selected. Pick an object here when an action needs one.';
 hint.classList.remove('needs-attention');
}
// A missing prerequisite is explained where the coach is choosing the action.
// In particular, never silently dismiss the action dialog for a disabled control.
function guidePreflight(key){
 if(!$('coachActionDialog')?.open)return false;
 const checks={
  move:['drawRouteSide','Choose a player from the list above, then try Run again.'],
  whistle:['coachWhistle','Select the Coach in the list above, then try Whistle · GO again.'],
  attach:['attachBallSide','Add a rugby ball first. Once it is free, choose Give ball.'],
  pass:['passBallSide','A player needs to be carrying the ball. Add a ball and use Give ball first.'],
  release:['releaseBallSide','Give the ball to a player first, then you can release it.'],
  turnover:['turnoverSide','Add a rugby ball first, then you can change possession.']
 };
 const [id,message]=checks[key]||[];
 if(!id)return false;
 const control=$(id);
 if(control&&!control.disabled&&!control.hidden)return false;
 const hint=$('coachSelectionHelp');
 if(hint){hint.textContent=message;hint.classList.add('needs-attention')}
 if(key==='move'||key==='whistle'){pendingAction=key;$('coachObjectChoice')?.focus()}
 return true;
}
function doAction(key){
 if(guidePreflight(key))return;
 pendingAction=null;
 // The underlying engine correctly blocks edits while ANY dialog is open.
 // Close the Coach Edition guide BEFORE using original editor controls.
 closeDialogs();
 let done=false,message='';
 switch(key){
 case 'new':done=launch('new');message='New drill opened. Add a few players, then build the first action.';break;
 case 'library':done=launch('library');message='Choose a saved or starter drill; you can edit it or make a separate variation.';break;
 case 'continue':done=true;message='Select any player or open Add action to make your next move.';break;
 case 'twoTeams':
  done=add('attacker')&&add('attacker')&&add('defender')&&add('defender');
  message='Four players added. Drag them apart on the pitch; use the next step to show their movement.';break;
 case 'threeVTwo':
  done=add('attacker')&&add('attacker')&&add('attacker')&&add('defender')&&add('defender');
  message='Three attackers and two defenders added. Drag them into your starting positions, then add a running or passing step.';break;
 case 'attacker':case 'defender':case 'ball':case 'sausage':case 'donut':case 'fieldLine':
  done=add(key);message=key.charAt(0).toUpperCase()+key.slice(1)+' added. Drag it into position; use Object to edit its properties.';break;
 case 'shield':done=add('shieldItem');message='Shield added. In Object → Contact shield, choose the player carrying it.';break;
 case 'setUp':done=launch('tabDrill');message='Set the drill name, age group and pitch area, then apply the settings.';break;
 case 'move':
  done=launch('drawRouteSide');message='Click where the run finishes. Add bends to the running line if you need them.';break;
 case 'step':done=launch('addStep');message='New step added. Move just the players who act next, or choose another action.';break;
 case 'whistle':done=launch('coachWhistle');message='Whistle signal added or removed on the first action step. Live playback can sound the whistle.';break;
 case 'outcome':done=launch('createOutcomes');message='Name the decision and both outcomes. You can build each movement sequence separately.';break;
 case 'attach':done=launch('attachBallSide');message='Choose the first ball carrier on the pitch.';break;
 case 'pass':done=launch('passBallSide');message='Choose the receiving player to complete the pass.';break;
 case 'release':done=launch('releaseBallSide');message='Ball released. Move it to the intended location if needed.';break;
 case 'turnover':done=launch('turnoverSide');message='Choose the player taking possession.';break;
 case 'timing':
  done=true;
  if($('trackArea')&&getComputedStyle($('trackArea')).display==='none'&&$('toggleTracks'))$('toggleTracks').click();
  $('trackArea')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  message='Drag a timing bar’s middle to shift it, or either end to change its duration.';break;
 case 'padRuck':
  done=add('sausage');
  if(done)done=add('ruck');
  if(done)launch('tabObject');
  message='Ground bag and ruck added. Drag the bag into place, then choose the attacking and defending players in Object.';break;
 case 'linkRuck':done=add('ruck');if(done)launch('tabObject');message='Ruck marker added. If the bag was selected, they are linked. Choose the included players in Object.';break;
 case 'members':
  done=editObject('currentFormationEdit');
  message=done?'Tick the involved players, then choose Link players · keep positions.':'Select the ruck marker on the pitch first; then open Object → Players in this contest.';break;
 case 'breakdown':
  done=launch('breakdownNav');
  if(!done){done=launch('continueBreakdown')}
  if(done)launch('tabStep');
  message='Use Next stage in the Step panel. You decide which players arrive and where they finish.';break;
 case 'contest':
  done=editObject('contestMovementTools');
  message=done?'Enter the push–pull distance and winning side, then generate the movement.':'Open a Contest step, select the ruck marker, then choose the push–pull distance.';break;
 case 'nextBall':
  done=editObject('ruckCalloutsTools');
  message=done?'Choose a waiting player and a ball, then Create next step · play the ball.':'Select a winning ruck marker, then open Callouts & what happens next.';break;
 case 'tackle':done=add('tackle');message='Tackle added. Use the Step panel to show how the support players arrive.';break;
 case 'guided':done=launch('gamePhases');message='Choose a rugby phase and assign the players to the roles.';break;
 case 'notes':done=launch('details');message='Complete the coaching card. The full notes appear in printed coaching sheets.';break;
 case 'check':done=launch('checkDrill');message='Review the findings; this is a coaching aid, not a referee or safety sign-off.';break;
 case 'variation':done=launch('buildOn');message='Make a separate copy. The original is preserved.';break;
 case 'presentation':done=launch('present');message='Presentation mode opened. Return to the editor to keep editing.';break;
 case 'share':done=launch('share');message='Choose a presentation link, download, printable sheet or movie.';break;
 case 'save':done=launch('save');message='Saving uses the same GitHub library as Classic Studio; anything published there is public.';break;
 default:tell('Unknown coaching action.');return;
 }
 if(done){closeDialogs();tell(message)}
 else if(message){tell(message)}
}
function showWelcome(){
 closeDialogs();
 const dialog=$('coachWelcome');
 if(dialog)dialog.showModal();
}
function toggleTools(){
 const showing=body.classList.toggle('coach-all-tools');
 body.classList.toggle('coach-guided',!showing);
 const button=$('coachMode');
 button.textContent=showing?'Simpler view':'All tools';
 button.setAttribute('aria-pressed',String(showing));
 button.title=showing?'Hide rarely used original controls, without disabling them':'Reveal all the original Rugby Coaching Studio controls';
 try{localStorage.setItem('rugbyCoachEditionAllTools',showing?'yes':'no')}catch{}
 tell(showing?'Every original feature is now visible.':'Back to the simplified layout. The detailed controls are still available.');
}
document.addEventListener('DOMContentLoaded',()=>{
 // Built on the exact same HTML interface as Classic Studio. We only route
 // familiar coaching tasks to those existing buttons.
 $('coachStart')?.addEventListener('click',showWelcome);
 $('coachActions')?.addEventListener('click',()=>openActions('setup'));
 $('coachSequence')?.addEventListener('click',()=>{launch('tabStep');tell('Choose a step along the timeline, or use + Step to create the next action.')});
 $('coachNotes')?.addEventListener('click',()=>doAction('notes'));
 $('coachShare')?.addEventListener('click',()=>doAction('share'));
 $('coachMode')?.addEventListener('click',toggleTools);
 $('coachUseObject')?.addEventListener('click',()=>{
  const choice=$('coachObjectChoice'),picker=$('objectPicker');
  if(!picker||!choice?.value){
   const hint=$('coachSelectionHelp');if(hint){hint.textContent='Choose a player or object first.';hint.classList.add('needs-attention')}
   return;
  }
  const selectedId=choice.value;
  closeDialogs(); // Selection is also an edit action in the original engine.
  picker.value=selectedId;
  picker.dispatchEvent(new Event('change',{bubbles:true}));
  const resume=pendingAction;
  pendingAction=null;
  if((resume==='move'&&!$('drawRouteSide')?.disabled)||(resume==='whistle'&&!$('coachWhistle')?.disabled))doAction(resume);
  else openActions(chosenCategory);
 });
 for(const button of document.querySelectorAll('[data-coach-close]'))
  button.addEventListener('click',()=>{markWelcomeSeen();closeDialogs()});
 $('coachWelcome')?.addEventListener('click',event=>{
  const button=event.target.closest('[data-coach-do]');if(!button)return;
  markWelcomeSeen();
  closeDialogs();
  if(button.dataset.coachDo==='continue')tell('Select a player on the pitch, or use Add action to build the next part of the drill.');
  else doAction(button.dataset.coachDo);
 });
 $('coachActionDialog')?.addEventListener('click',event=>{
  const tab=event.target.closest('[data-coach-tab]');
  if(tab){pendingAction=null;chosenCategory=tab.dataset.coachTab;renderCards();return}
  const action=event.target.closest('[data-coach-command]');
  if(action)doAction(action.dataset.coachCommand);
 });
 // Full and simplified controls are layouts of the SAME page. Neither mode
 // changes the saved drill or strips features from the data.
 try{if(localStorage.getItem('rugbyCoachEditionAllTools')==='yes'){body.classList.add('coach-all-tools');body.classList.remove('coach-guided');$('coachMode').textContent='Simpler view';$('coachMode').setAttribute('aria-pressed','true')}}catch{}
 // Warn before a page switch could discard unsaved edits. Saved/imported
 // drills can be opened by either edition; unsaved JS memory cannot.
 for(const anchor of document.querySelectorAll('.coach-journey a[href="./index.html"],.coach-modal-footer a[href="./index.html"]'))
  anchor.addEventListener('click',event=>{
   const status=$('saveState')?.textContent||'';
   if(/unsaved|not saved|changes to save/i.test(status)&&!window.confirm('Save to GitHub or export your changes before switching editions. Unsaved changes will not transfer. Continue?'))event.preventDefault();
  });
 let seen=false;try{seen=localStorage.getItem('rugbyCoachEditionWelcomeV1')==='1'}catch{}
 if(!seen)showWelcome();
});
// Non-global, lightweight test hook for the new UI only. No editor internals.
export {CATEGORIES,TITLES,HELP};
