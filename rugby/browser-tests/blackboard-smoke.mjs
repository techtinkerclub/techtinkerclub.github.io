import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.RUGBY_TEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 for(const viewport of [{width:1380,height:850},{width:390,height:844},{width:920,height:520}]){
  const mobile=viewport.width<=600;
  const page=await browser.newPage({viewport,hasTouch:mobile,isMobile:mobile});
  page.on('pageerror',e=>errors.push(viewport.width+' '+e.message));
  await page.goto(origin+'/rugby/?blackboard=1',{waitUntil:'networkidle',timeout:45000});
  await page.locator('#blackboardUI').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('body.blackboard-mode').count(),1,'Blackboard loads through direct link');
  assert(await page.locator('.bb-rail').isVisible(),'accessible floating tools');
  assert(await page.locator('.bb-steps').isVisible(),'compact step/play controls');
  assert.equal(await page.locator('body > header').isVisible(),false,'normal editor chrome hidden');
  const bounds=await page.locator('#pitch').boundingBox();
  assert(bounds&&bounds.width>=viewport.width-3&&bounds.height>=viewport.height-3,
   'original live pitch should fill the window');
  const startingPlayers=await page.locator('#pitch .obj[data-id]').count();
  assert(startingPlayers>0,'existing players present');
  const first=page.locator('[data-bb="add"]').first();
  await first.click();
  await page.locator('[data-bb-add="attacker"]').click();
  assert.equal(await page.locator('#pitch .obj[data-id]').count(),startingPlayers+1,
   'adding a blackboard player uses original Studio model');
  await page.locator('#bbSelection').waitFor({state:'visible'});
  await page.locator('[data-bb="actions"]').click();
  assert(await page.locator('#objectMenu').isVisible(),'Blackboard exposes original object menu');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.getElementById('objectMenu')?.hidden===true);

  const selectedId=await page.locator('#objectPicker').inputValue();
  assert(selectedId,'Newly added player should be the selected editor object');
  const before=Number(await page.locator('#objRot').inputValue());
  await page.locator('[data-bb="turn-right"]').click();
  const after=Number(await page.locator('#objRot').inputValue());
  assert.equal(after,before+15,'context Turn edits original authored player rotation');
  await page.locator('[data-bb="ink"]').first().click();
  const overlay=page.locator('#blackboardInk'),rect=await overlay.boundingBox();
  assert(rect&&rect.width>100);
  await page.mouse.move(rect.x+rect.width*.5,rect.y+rect.height*.55);
  await page.mouse.down();
  await page.mouse.move(rect.x+rect.width*.56,rect.y+rect.height*.62,{steps:6});
  await page.mouse.up();
  assert.equal(await page.locator('#blackboardInk path').count(),1,'ink strokes draw over pitch');
  await page.locator('[data-bb="ink-clear"]').click();
  assert.equal(await page.locator('#blackboardInk path').count(),0,'temporary ink can be cleared');
  await page.locator('[data-bb="select"]').click();
  const previousStepCount=await page.locator('#scenes .scene').count();
  await page.locator('[data-bb="new-step"]').click();
  assert.equal(await page.locator('#scenes .scene').count(),previousStepCount+1,
   'blackboard adds real editable step');

  await page.locator('[data-bb="delete-step"]').click();
  assert.equal(await page.locator('#scenes .scene').count(),previousStepCount,
   'Blackboard Delete step uses the original Studio delete action');
  // Deletion deliberately selects the next existing step. Go back to the
  // authored setup before copying it again, rather than copying a later step
  // that did not yet include our newly added (current-step-only) player.
  await page.locator('[data-bb="prev"]').click();
  await page.locator('[data-bb="new-step"]').click();
  assert.equal(await page.locator('#scenes .scene').count(),previousStepCount+1,
   'A new step remains editable after deletion');
  await page.locator('[data-bb="timeline"]').click();
  assert(await page.locator('#bbTimelinePanel').isVisible(),'Floating timeline can be opened');
  assert.equal(await page.locator('#bbNativeTimeline > #timelinePanel').count(),1,
   'The original live Studio timeline is reparented, not cloned');
  const seconds=page.locator('#bbStepSeconds');
  await seconds.fill('2.5');
  await seconds.press('Tab');
  assert.equal(Number(await page.locator('#stepTime').inputValue()),2.5,
   'Blackboard step duration changes the actual Studio step');
  await page.locator('#bbSpeed').selectOption('0.25');
  assert.equal(await page.locator('#speed').inputValue(),'0.25','Slow motion uses Studio playback speed');
  await page.locator('[data-bb="loop"]').click();
  assert.equal(await page.locator('[data-bb="loop"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-bb="loop"]').click();
  assert.equal(await page.locator('[data-bb="loop"]').getAttribute('aria-pressed'),'false');
  await page.locator('[data-bb="replay"]').click();
  await page.waitForFunction(()=>document.getElementById('play').textContent.includes('Pause'),{timeout:5000});
  await page.locator('[data-bb="play"]').click();
  assert.equal(await page.locator('#play').textContent(),'▶ Play','Pause returns to native editor');
  const expanded=await page.locator('#toggleTracks').getAttribute('aria-expanded');
  await page.locator('[data-bb="tracks"]').click();
  assert.notEqual(await page.locator('#toggleTracks').getAttribute('aria-expanded'),expanded,
   'The actual movement timing tracks can be toggled');
  await page.locator('[data-bb="close-timeline"]').click();
  assert.equal(await page.locator('#bbTimelinePanel').isVisible(),false);
  await page.locator('[data-bb="camera"]').click();
  assert(await page.locator('#bbCameraPanel').isVisible(),'Camera controls are accessible');
  const follow=page.locator('#bbCameraPanel [data-bb="follow"]');
  assert.equal(await follow.getAttribute('aria-pressed'),'false','Follow starts off');
  await follow.click();
  assert.equal(await page.locator('#followAction').isChecked(),true,
   'Blackboard activates the native Studio camera follower');
  assert.equal(await follow.getAttribute('aria-pressed'),'true','Follow is visibly active');
  assert.equal(await follow.evaluate(el=>el.classList.contains('is-active')),true);
  await follow.click();
  assert.equal(await page.locator('#followAction').isChecked(),false,'Follow switches off');
  await follow.click();
  assert.equal(await page.locator('#followAction').isChecked(),true,'Follow re-enables');
  const beforeZoom=await page.locator('#pitch').getAttribute('viewBox');
  await page.locator('[data-bb="zoom-in"]').click();
  const afterZoom=await page.locator('#pitch').getAttribute('viewBox');
  assert.notEqual(beforeZoom,afterZoom,'Zoom works inside Blackboard');
  assert.equal(await page.locator('#followAction').isChecked(),false,
   'Native manual zoom automatically turns follow off');
  assert.equal(await follow.getAttribute('aria-pressed'),'false',
   'Blackboard reflects the disabled follower immediately');
  await page.locator('#bbCameraPanel [data-bb="fit"]').click();
  // Focus tools are deliberately tucked away until requested.
  assert.equal(await page.locator('#bbAdvancedView').evaluate(el=>el.open),false);
  await page.locator('#bbAdvancedView > summary').click();
  assert(await page.locator('#bbFollowTarget').isVisible(),'Follow target has a compact advanced control');
  // A floating panel may cover part of the pitch on phones. Close it before
  // selecting the real player, then reopen without losing our advanced state.
  await page.locator('[data-bb="close-camera"]').click();
  await page.locator('#pitch .obj[data-id="'+selectedId+'"]').click();
  await page.locator('[data-bb="camera"]').click();
  if(!await page.locator('#bbAdvancedView').evaluate(el=>el.open))
   await page.locator('#bbAdvancedView > summary').click();
  await page.locator('#bbFollowTarget').selectOption('selected');
  assert.equal(await page.locator('#followAction').isChecked(),true,'Follow selected uses native camera follower');
  const followFraming=page.locator('#bbFollowFraming');
  await followFraming.selectOption('close');
  const closeView=await page.locator('#pitch').getAttribute('viewBox');
  const closeWidth=Number(closeView.split(' ')[2]);
  await followFraming.selectOption('wide');
  const wideWidth=Number((await page.locator('#pitch').getAttribute('viewBox')).split(' ')[2]);
  assert(wideWidth>closeWidth+20,'Wide framing reveals more pitch around selected player');
  await followFraming.selectOption('full');
  const fullWidth=Number((await page.locator('#pitch').getAttribute('viewBox')).split(' ')[2]);
  assert(fullWidth>=wideWidth,'Full pitch follow shows the widest field of view');
  assert.equal(await page.locator('#followAction').isChecked(),true,'Framing selection retains Follow action');
  assert.equal(await page.evaluate(()=>localStorage.getItem('rugby-blackboard-follow-framing-v1')),'full',
   'Framing preference persists on this device');
  await followFraming.selectOption('standard');
  await page.locator('#bbFollowTarget').selectOption('ball');
  assert.equal(await followFraming.inputValue(),'standard','Ball and player modes share framing selection');
  await followFraming.selectOption('wide');
  assert.equal(await page.locator('#followAction').isChecked(),true,'Ball follow remains enabled when widening view');
  await page.locator('#bbFollowTarget').selectOption('selected');
  await page.locator('#bbCameraPanel [data-bb="spotlight"]').click();
  assert.equal(await page.locator('#pitch #bb-spotlight-mask').count(),1,
   'Spotlight uses one view-only SVG mask');
  assert.equal(await page.locator('#pitch .bb-teaching-overlay').count(),1,
   'Spotlight is a temporary SVG view overlay');
  await page.locator('#bbGhostMode').selectOption('start');
  assert(await page.locator('#pitch .bb-teaching-overlay').isVisible(),
   'Start ghost is visible in the current Blackboard preview');
  await page.locator('#bbGhostMode').selectOption('off');
  await page.locator('#bbCameraPanel [data-bb="spotlight"]').click();
  await page.locator('#bbFollowTarget').selectOption('action');
  await page.locator('[data-bb="pan"]').click();
  assert.equal(await page.locator('#panMode').getAttribute('aria-pressed'),'true',
   'Pan is the native camera control');
  await page.locator('[data-bb="pan"]').click();
  await page.locator('[data-bb="close-camera"]').click();
  // The grip is deliberately tiny and should move a panel without changing its size.
  const title=page.locator('.bb-title'),grip=title.locator('.bb-grip');
  const beforeDrag=await title.boundingBox(),gripBounds=await grip.boundingBox();
  await page.mouse.move(gripBounds.x+gripBounds.width/2,gripBounds.y+gripBounds.height/2);
  await page.mouse.down();
  await page.mouse.move(gripBounds.x+gripBounds.width/2+38,gripBounds.y+gripBounds.height/2+18,{steps:5});
  await page.mouse.up();
  const afterDrag=await title.boundingBox();
  assert(afterDrag.x>beforeDrag.x+10,'Grip moves an existing floating panel');
  await page.locator('[data-bb="camera"]').click();
  await page.locator('#bbAdvancedView [data-bb="save-layout"]').click();
  assert(await page.evaluate(()=>!!localStorage.getItem('rugby-blackboard-layouts-v1')),
   'User layout is stored on this device');
  await page.locator('#bbLayoutPreset').selectOption('coaching');
  assert.equal(await page.locator('#blackboardUI').evaluate(el=>el.classList.contains('bb-coaching-layout')),true);
  await page.locator('#bbLayoutPreset').selectOption('editing');
  await page.locator('#bbAdvancedView [data-bb="reset-panels"]').click();
  assert.equal(await title.evaluate(el=>el.classList.contains('is-moved')),false,
   'Reset returns the panel to its original layout');
  await page.locator('[data-bb="close-camera"]').click();
  await page.locator('[data-bb="prev"]').click();
  assert.equal(await page.locator('#pitch .obj[data-id="'+selectedId+'"]').count(),1,
   'Blackboard Previous step retains the original added player');
  await page.locator('[data-bb="next"]').click();
  assert.equal(await page.locator('#pitch .obj[data-id="'+selectedId+'"]').count(),1,
   'Blackboard Next step retains copied players');

  await page.locator('[data-bb="exit"]').click();
  assert.equal(await page.locator('body.blackboard-mode').count(),0,'exit restores the editor');
  assert(await page.locator('body > header').isVisible(),'normal Studio chrome returns');
  assert.equal(await page.locator('#scenes .scene').count(),previousStepCount+1,
   'new step persists after closing Blackboard');
  assert.equal(await page.locator('body > #timelinePanel').count(),1,'Native timeline returns to Studio after exit');
  assert.equal(await page.locator('#pitch .obj[data-id="'+selectedId+'"]').count(),1,
   'added player persists after closing Blackboard');
  if(!mobile&&viewport.width>1000){
   await page.locator('#viewMenu > summary').click();
   assert(await page.locator('#followAction').isVisible(),'Studio presents Follow action as a compact row');
   const box=await page.locator('.camera-follow-choice').boundingBox();
   const input=await page.locator('#followAction').boundingBox();
   const text=await page.locator('.camera-follow-choice span').boundingBox();
   assert(box&&input&&text&&input.x<text.x&&Math.abs(input.y-text.y)<12,
    'Follow checkbox and label stay aligned on one row');
   assert.equal(await page.locator('#viewAdvanced').evaluate(el=>el.open),false,
    'Rarely-used options are collapsed by default');
   await page.locator('#viewAdvanced > summary').click();
   assert(await page.locator('#scaleMode').isVisible(),'Scale remains accessible');
   assert(await page.locator('#gridStep').isVisible(),'Grid remains accessible');
  }
  await page.close();
  console.log('BLACKBOARD PASS '+viewport.width+'x'+viewport.height+': fullscreen, add, edit, ink, step management, duration, timeline, zoom, drag and restore');
 }
 if(errors.length)throw new Error('Blackboard JavaScript error(s): '+errors.join(' | '));
}finally{await browser.close()}
