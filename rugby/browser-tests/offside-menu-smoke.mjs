import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.RUGBY_TEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const watch=page=>page.on('pageerror',e=>errors.push(e.message));
const trigger=async node=>node.evaluate(el=>{
 const rect=el.getBoundingClientRect();
 return el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,
  clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2}));
});
try{
 const page=await browser.newPage({viewport:{width:1320,height:900}});
 watch(page);
 await page.goto(base+'/rugby/',{waitUntil:'networkidle',timeout:45000});
 await page.locator('#pitch .obj[data-id]').first().waitFor({state:'visible',timeout:15000});
 await page.locator('#palette button[data-type="offsideLine"]').click();
 const lineId=await page.locator('#objectPicker').inputValue();
 assert(lineId,'Studio selected the added offside line');
 await trigger(page.locator('#pitch .obj[data-id="'+lineId+'"]'));
 assert.equal(await page.locator('#objectMenu').isVisible(),true,'context menu opens for line');
 for(const selector of ['#menuAction','#menuBall','#menuRelease','#menuSpeech','#menuAddPoint'])
  assert.equal(await page.locator(selector).evaluate(el=>el.hidden),true,
   selector+' is not a line action');
 assert.equal(await page.locator('#menuDeleteHere').evaluate(el=>el.hidden),false);
 await page.keyboard.press('Escape');
 await page.locator('#palette button[data-type="attacker"]').click();
 const playerId=await page.locator('#objectPicker').inputValue();
 assert(playerId&&playerId!==lineId);
 await trigger(page.locator('#pitch .obj[data-id="'+playerId+'"]'));
 assert.equal(await page.locator('#menuAction').evaluate(el=>el.hidden),false,
  'a player retains rugby actions');
 await page.keyboard.press('Escape');
 // Public playback and video frame generation share this SVG engine.
 const scenes=await page.evaluate(async()=>{
  const pack=await (await fetch('/rugby/data/u10-match-showcases.json')).json();
  const {playbackData,renderScene}=await import('/rugby/js/scene.js?v=0.20.88');
  const drill=playbackData(pack.drills.find(d=>d.id==='seed-972'));
  const full=renderScene(drill,{index:6,framing:'field',markups:true,offside:true});
  const follow=renderScene(drill,{index:6,framing:'follow',markups:true,offside:true});
  const hidden=renderScene(drill,{index:6,framing:'field',markups:false,offside:true});
  const count=(s,rx)=>(s.match(rx)||[]).length;
  return {full:count(full.svg,/data-line-kind="offside-guide"/g),
   follow:count(follow.svg,/data-line-kind="offside-guide"/g),
   duplicate:count(full.svg,/data-offside-guide="true"/g),
   hidden:count(hidden.svg,/data-line-kind="offside-guide"/g)};
 });
 assert.equal(scenes.full,2,'both live lines show in full-field output');
 assert.equal(scenes.follow,2,'both lines survive follow-camera rendering');
 assert.equal(scenes.duplicate,0,'do not draw automatic duplicate over coach marks');
 assert.equal(scenes.hidden,0,'markups toggle hides drawn lines');
 await page.goto(base+'/rugby/?blackboard=1',{waitUntil:'networkidle',timeout:45000});
 await page.locator('#blackboardUI').waitFor({state:'visible',timeout:15000});
 await page.locator('[data-bb="add"]').first().click();
 await page.locator('#bbAddPalette button[data-bb-add="offsideLine"]').click();
 await page.locator('[data-bb="actions"]').click();
 assert.equal(await page.locator('#objectMenu').isVisible(),true,'Blackboard uses same object menu');
 assert.equal(await page.locator('#menuAction').evaluate(el=>el.hidden),true,'Blackboard line cannot pass the ball');
 assert.equal(await page.locator('#menuBall').evaluate(el=>el.hidden),true,'Blackboard line cannot attach the ball');
 assert.deepEqual(errors,[],'no JS startup errors in Studio or Blackboard');
 console.log('PASS dynamic offside, editor/Blackboard context menus and public scene outputs');
}finally{await browser.close()}
