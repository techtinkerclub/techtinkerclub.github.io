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
  const expanded=await page.locator('#toggleTracks').getAttribute('aria-expanded');
  await page.locator('[data-bb="tracks"]').click();
  assert.notEqual(await page.locator('#toggleTracks').getAttribute('aria-expanded'),expanded,
   'The actual movement timing tracks can be toggled');
  await page.locator('[data-bb="close-timeline"]').click();
  assert.equal(await page.locator('#bbTimelinePanel').isVisible(),false);
  await page.locator('[data-bb="camera"]').click();
  assert(await page.locator('#bbCameraPanel').isVisible(),'Camera controls are accessible');
  const beforeZoom=await page.locator('#pitch').getAttribute('viewBox');
  await page.locator('[data-bb="zoom-in"]').click();
  const afterZoom=await page.locator('#pitch').getAttribute('viewBox');
  assert.notEqual(beforeZoom,afterZoom,'Zoom works inside Blackboard');
  await page.locator('#bbCameraPanel [data-bb="fit"]').click();
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
  await page.locator('[data-bb="reset-panels"]').click();
  assert.equal(await title.evaluate(el=>el.classList.contains('is-moved')),false,
   'Reset returns the panel to its original layout');
  await page.locator('[data-bb="close-camera"]').click();

  await page.locator('[data-bb="exit"]').click();
  assert.equal(await page.locator('body.blackboard-mode').count(),0,'exit restores the editor');
  assert(await page.locator('body > header').isVisible(),'normal Studio chrome returns');
  assert.equal(await page.locator('#scenes .scene').count(),previousStepCount+1,
   'new step persists after closing Blackboard');
  assert.equal(await page.locator('body > #timelinePanel').count(),1,'Native timeline returns to Studio after exit');
  const currentPlayerCount=await page.locator('#pitch .obj[data-id="'+selectedId+'"]').count();
  const currentIndex=await page.locator('#scenes .scene.selected').getAttribute('data-step');
  await page.locator('#back').click();
  const setupPlayerCount=await page.locator('#pitch .obj[data-id="'+selectedId+'"]').count();
  console.log('BLACKBOARD player continuity '+viewport.width+'px: selected='+selectedId+
   ' currentStep='+currentIndex+' current='+currentPlayerCount+' previous='+setupPlayerCount);
  assert.equal(setupPlayerCount,1,'original added player must survive changes and Blackboard exit');
  assert.equal(currentPlayerCount,1,'new step copied from setup must retain its player');
  await page.close();
  console.log('BLACKBOARD PASS '+viewport.width+'x'+viewport.height+': fullscreen, add, edit, ink, step management, duration, timeline, zoom, drag and restore');
 }
 if(errors.length)throw new Error('Blackboard JavaScript error(s): '+errors.join(' | '));
}finally{await browser.close()}
