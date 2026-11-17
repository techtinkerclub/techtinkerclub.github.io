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
  const tap=async name=>page.locator('[data-mobile-view="'+name+'"]').click();
  await tap('tools');
  assert(await page.locator('#equipmentPanel').isVisible(),'Add must open tools');
  await tap('edit');
  assert(await page.locator('#inspectorPanel').isVisible(),'Edit must open inspector');
  assert(!(await page.locator('#equipmentPanel').isVisible()),'Edit must close tools');
  await tap('steps');
  assert(await page.locator('#timelinePanel').isVisible(),'Steps must open timeline');
  assert(await page.locator('#play').isVisible(),'Steps must expose the original Play button');
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
  console.log('PASS',path,viewport.width+'x'+viewport.height,measured);
 }finally{await page.close()}
}
try{
 for(const path of ['/rugby/','/rugby/coach/']){
  for(const viewport of [{width:390,height:844},{width:820,height:1180},{width:844,height:390}]){
   await check(path,viewport);
  }
 }
 if(failures.length)throw Error(failures.join('\n'));
}finally{await browser.close()}
