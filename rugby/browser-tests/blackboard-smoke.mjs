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

  const selectedId=await page.locator('#pitch .obj[data-id]').last().getAttribute('data-id');
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
  await page.locator('[data-bb="exit"]').click();
  assert.equal(await page.locator('body.blackboard-mode').count(),0,'exit restores the editor');
  assert(await page.locator('body > header').isVisible(),'normal Studio chrome returns');
  assert.equal(await page.locator('#scenes .scene').count(),previousStepCount+1,
   'new step persists after closing Blackboard');
  assert.equal(await page.locator('#pitch .obj[data-id="'+selectedId+'"]').count(),1,
   'added player persists after closing Blackboard');
  await page.close();
  console.log('BLACKBOARD PASS '+viewport.width+'x'+viewport.height+': fullscreen, add, edit, ink, real step, close');
 }
 if(errors.length)throw new Error('Blackboard JavaScript error(s): '+errors.join(' | '));
}finally{await browser.close()}
