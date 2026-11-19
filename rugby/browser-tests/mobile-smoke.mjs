// Real-browser check for the touch editor. Run after serving repository on port 8765.
// Requires Playwright + its Chromium browser, as with browser-tests/smoke.mjs.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const origin=process.env.RUGBY_TEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let failures=[];
async function check(path,viewport){
 const page=await browser.newPage({viewport,hasTouch:true,isMobile:viewport.width<600});
 page.on('pageerror',e=>failures.push(path+' '+viewport.width+' JS: '+e.message));
 page.on('console',m=>{if(m.type()==='error')failures.push(path+' '+viewport.width+' console: '+m.text())});
 try{
  await page.goto(origin+path,{waitUntil:'networkidle',timeout:45000});
  await page.locator('#stageTitle').waitFor({state:'visible'});
  const nav=page.locator('.mobile-workspace-nav');
  assert(await nav.isVisible(),path+' '+viewport.width+': bottom navigation must be visible');
  const measured=await page.evaluate(()=>{
   const nav=document.querySelector('.mobile-workspace-nav'),field=document.querySelector('.field-wrap'),pitch=document.querySelector('#pitch');
   const n=nav.getBoundingClientRect(),f=field.getBoundingClientRect(),p=pitch.getBoundingClientRect();
   return {navTop:n.top,navBottom:n.bottom,navHeight:n.height,fieldWidth:f.width,fieldHeight:f.height,pitchWidth:p.width,pitchHeight:p.height,screenHeight:innerHeight,screenWidth:innerWidth,
    rows:getComputedStyle(document.body).gridTemplateRows};
  });
  assert(measured.navHeight>=48,'nav controls cannot have zero height');
  assert(measured.navTop>=0&&measured.navTop<measured.screenHeight,'nav must fit viewport');
  assert(measured.navBottom<=measured.screenHeight+2,'nav must not be pushed below the screen');
  assert(measured.fieldWidth>100&&measured.fieldHeight>40,'pitch should remain usable');
  // Only one camera toolbar, with no buttons floating over the pitch.
  assert(await page.locator('.mobile-quick-controls .mobile-camera-controls').isVisible(),'one accessible camera row above pitch');
  assert.equal(await page.locator('.field-wrap > .mobile-camera-controls').count(),0,'camera must not obscure rugby sprites');
  assert.equal(await page.locator('.stage .toolbar > .board-actions').count(),0,'desktop editing controls move to the Edit sheet');
  await page.locator('#mobileViewOptions').click();
  await page.waitForFunction(()=>document.querySelector('#viewMenu')?.open
    &&document.querySelector('#mobileViewScrim')?.hidden===false);
  const view=await page.evaluate(()=>{
   const menu=document.querySelector('#viewMenu'),box=menu.getBoundingClientRect();
   return {body:menu.parentElement===document.body,top:box.top,bottom:box.bottom,visible:getComputedStyle(menu).display!=='none',
    scrim:!document.querySelector('#mobileViewScrim').hidden};
  });
  assert(view.body&&view.visible&&view.scrim,'View options must be a visible sheet above the pitch, with backdrop');
  assert(view.top>=-2&&view.bottom<=measured.navTop+2,'view sheet must fit above bottom navigation');
  assert(await page.locator('#scaleMode').isVisible(),'View options content cannot be clipped behind the pitch');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('#viewMenu')?.open);

  const tap=async name=>page.locator('[data-mobile-view="'+name+'"]').click();
  await tap('tools');
  assert(await page.locator('#equipmentPanel').isVisible(),'Add must open tools');
  await tap('edit');
  assert(await page.locator('#inspectorPanel').isVisible(),'Edit must open inspector');
  assert(!(await page.locator('#equipmentPanel').isVisible()),'Edit must close tools');
  // Use the inspector to select an object, then call its *existing*
  // right-click commands without a right mouse button.
  await page.locator('#tabObject').click();
  const picker=page.locator('#objectPicker');
  assert(await picker.locator('option').count()>1,'sample drill should have selectable objects');
  await picker.selectOption({index:1});
  await tap('pitch');
  const actions=page.locator('#mobileObjectActions');
  assert(await actions.isVisible(),'selected-object Actions button must be visible on touch');
  await actions.click();
  assert(await page.locator('#objectMenu').isVisible(),'mobile context menu must open');
  assert(await page.locator('#menuDeleteHere').isVisible(),'existing object commands remain accessible');
  const context=await page.locator('#objectMenu').boundingBox();
  assert(context.y+context.height<=measured.navTop+3,'object menu must stay above the bottom navigation');
  await tap('edit');
  assert(!(await page.locator('#objectMenu').isVisible()),'moving to Edit closes the context menu');

  await tap('steps');
  assert(await page.locator('#timelinePanel').isVisible(),'Steps must open timeline');
  assert(await page.locator('#play').isVisible(),'Steps must expose the original Play button');
  const switcher=page.locator('.mobile-timeline-switch');
  assert(await switcher.isVisible(),'touch editor must offer separate Steps / Timing views');
  assert(await page.locator('#scenes').isVisible(),'step cards must be visible by default');
  assert(!(await page.locator('#trackArea').isVisible()),'timing tracks must not overlap step cards');
  const sceneLayout=await page.evaluate(()=>{
   const sheet=document.getElementById('timelinePanel').getBoundingClientRect(),
    cards=document.getElementById('scenes').getBoundingClientRect(),
    nav=document.querySelector('.mobile-workspace-nav').getBoundingClientRect();
   return {sheetBottom:sheet.bottom,navTop:nav.top,cardsTop:cards.top,cardsBottom:cards.bottom};
  });
  assert(sceneLayout.sheetBottom<=sceneLayout.navTop+3,'step editor must finish above bottom navigation');
  assert(sceneLayout.cardsTop>=0&&sceneLayout.cardsBottom<=sceneLayout.sheetBottom+3,
   'step cards must remain inside scrollable sheet, not behind the pitch or tracks');
  await page.locator('[data-mobile-step-panel="timing"]').click();
  assert(await page.locator('#trackArea').isVisible(),'Timing tab must expose tracks');
  assert(!(await page.locator('#scenes').isVisible()),'Timing view must not overlap step cards');
  await page.locator('[data-mobile-step-panel="sequence"]').click();
  assert(await page.locator('#scenes').isVisible(),'returning to Steps restores step cards');
  assert(!(await page.locator('#trackArea').isVisible()));
  await page.locator('[data-mobile-step-edit]').click();
  assert(await page.locator('#inspectorPanel').isVisible(),'Edit selected step opens editable fields');
  assert.equal(await page.locator('#tabStep').getAttribute('aria-selected'),'true');
  await tap('steps');
  assert(await page.locator('.mobile-timeline-more').isVisible(),'advanced sequence commands stay accessible');
  await page.locator('.mobile-timeline-more summary').click();
  assert(await page.locator('#present').isVisible(),'Presentation command is preserved within More options');
  await tap('pitch');
  assert(!(await page.locator('#timelinePanel').isVisible()),'Pitch must close timeline');
  const play=page.locator('[data-mobile-action="play"]');
  assert(await play.isVisible(),'Play shortcut must exist when timeline is hidden');
  await play.click();
  await page.waitForTimeout(250);
  assert.match(await page.locator('#play').innerText(),/Pause/i,'Mobile Play must start existing animation engine');
  assert.match(await play.getAttribute('aria-label'),/Pause/i,'Mobile shortcut must reflect playback');
  await play.click();
  assert.match(await page.locator('#play').innerText(),/Play/i,'Mobile shortcut must pause existing playback');
  // A preview used to strand the entire pitch in non-editable mode.
  // Natural finish must return to the LAST actual authored step.
  await tap('steps');
  const steps=page.locator('#scenes .scene');
  const lastIndex=await steps.count()-1;
  assert(lastIndex>=1,'sample drill needs at least one animated step');
  await steps.last().click();
  await page.locator('#speed').selectOption('2');
  await tap('pitch');
  await play.click();
  await page.waitForFunction(()=>document.querySelector('#play')?.textContent?.includes('Play')
   &&document.querySelector('#status')?.textContent?.includes('editing last step'),{timeout:18000});
  const returned=await page.evaluate(()=>({
   selectedStep:[...document.querySelectorAll('#scenes .scene')].findIndex(x=>x.classList.contains('selected')),
   total:document.querySelectorAll('#scenes .scene').length,
   pickerDisabled:document.getElementById('objectPicker').disabled,
   previewEdit:!document.getElementById('editCurrent').hidden
  }));
  assert.equal(returned.selectedStep,returned.total-1,'after playback the last authored step is selected');
  assert.equal(returned.pickerDisabled,false,'after playback player selector is editable');
  assert.equal(returned.previewEdit,false,'playback preview lock is cleared');

  // A selected Pan mode may move the view over empty grass but must not block
  // picking a visible rugby player for editing on a touch device.
  const mobilePan=page.locator('[data-mobile-camera="panMode"]');
  await mobilePan.click();
  assert.equal(await mobilePan.getAttribute('aria-pressed'),'true');
  const candidates=page.locator('#pitch .obj[data-id]');
  assert(await candidates.count()>0,'there must be visible objects on the final pitch');
  const id=await candidates.first().getAttribute('data-id');
  const rect=await candidates.first().boundingBox();
  assert(rect?.width>0&&rect?.height>0,'first selectable object has an on-screen hitbox');
  await page.touchscreen.tap(rect.x+rect.width/2,rect.y+rect.height/2);
  const value=await page.locator('#objectPicker').inputValue();
  assert.equal(value,id,'tapping a player while Pan is selected must select that object');
  assert.equal(await mobilePan.getAttribute('aria-pressed'),'false','selection automatically exits Pan mode');

  console.log('PASS',path,viewport.width+'x'+viewport.height,measured);
 }finally{await page.close()}
}
try{
 for(const path of ['/rugby/']){
  for(const viewport of [{width:390,height:844},{width:820,height:1180},{width:844,height:390}]){
   await check(path,viewport);
  }
 }
 if(failures.length)throw Error(failures.join('\n'));
}finally{await browser.close()}
