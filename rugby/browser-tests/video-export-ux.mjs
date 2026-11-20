// Real browser acceptance: sensible export controls plus actual Ruckus video.
// Run with the repository served on localhost:8765 (GitHub browser QA).
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {movieOptions} from '../js/movie.js';

const origin=process.env.RUGBY_TEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-fake-ui-for-media-stream']});
const errors=[];
const track=page=>{
 page.on('pageerror',error=>errors.push('JS: '+error.message));
 page.on('console',message=>{if(message.type()==='error')errors.push('Console: '+message.text())});
};
try{
 // Regression: normalisation must preserve the selected camera mode. This
 // previously discarded 'follow' and silently exported a fixed whole pitch.
 assert.equal(movieOptions({framing:'follow'}).framing,'follow');
 assert.equal(movieOptions({framing:'action'}).framing,'action');
 assert.equal(movieOptions({framing:'field'}).framing,'field');
 assert.equal(movieOptions({framing:'invalid'}).framing,'action');
 // Public library: a preselected regular drill should offer one tidy export.
 const pub=await browser.newPage({viewport:{width:920,height:900},acceptDownloads:true});
 track(pub);
 await pub.goto(origin+'/rugby/library.html?video=seed-143&style=ruckus',
  {waitUntil:'networkidle',timeout:45000});
 await pub.locator('#videoBuilder').waitFor({state:'visible',timeout:12000});
 assert.equal(await pub.locator('#videoStages li').count(),1);
 assert.equal(await pub.locator('#publicVideoStyle').inputValue(),'minion');
 assert(await pub.locator('#publicMovieCamera').isVisible(),'video camera choice must not be buried');
 assert.equal(await pub.locator('#publicMovieCamera').inputValue(),'follow','Ruckus starts with follow action camera');
 await pub.locator('#publicMovieCamera').selectOption('follow');
 assert.equal(await pub.locator('#videoMoreDrills').getAttribute('open'),null,
  'multi-drill composition must be collapsed for a single video');
 assert.equal(await pub.locator('#videoTitleField').isVisible(),false,
  'single drill must not demand a separate progression title');
 assert.equal(await pub.locator('#videoProgressionActions').isVisible(),false);
 await pub.locator('#publicMovieOptions').evaluate(el=>{
  for(let n=el;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;
 });
 assert.equal(await pub.locator('#publicMovieBranches').isVisible(),false,
  'simple drill must not display decision outcomes');
 assert.equal(await pub.locator('#publicMovieDecisionSeconds').isVisible(),false);
 assert.equal(await pub.locator('#publicMovieIntroSeconds').isVisible(),false,
  'intro duration control should not clutter a simple drill');
 await pub.locator('#publicMovieMode').selectOption('single');
 await pub.locator('#publicMovieQuality').selectOption('720');
 await pub.locator('#publicMovieNotes').uncheck();
 assert.equal(await pub.locator('#publicMovieSpeed').isVisible(),false,
  'replay speed is irrelevant when normal-speed-only is selected');
 const downloadPromise=pub.waitForEvent('download',{timeout:110000});
 await pub.locator('#videoExport').click();
 const download=await downloadPromise;
 assert.match(download.suggestedFilename(),/\.(mp4|webm)$/i);
 assert.ok((await download.path())?.length);
 console.log('PUBLIC RUCKUS EXPORT PASS: single drill, no irrelevant settings, cartoon movie downloaded');
 await pub.close();

 // Read-only drill presentation is the second library route.
 const player=await browser.newPage({viewport:{width:1050,height:830}});
 track(player);
 await player.goto(origin+'/rugby/play.html?drill=seed-143',{waitUntil:'networkidle',timeout:45000});
 await player.locator('#playerMinionMode').click();
 assert.equal(await player.locator('#playerVideoStyle').inputValue(),'ruckus');
 assert.ok(await player.locator('#board .ruckus-player').count()>0);
 assert.equal(await player.locator('#board .cartoon-pitch-decor').count(),0);
 await player.locator('#playerFollow').click();
 assert.equal(await player.locator('#playerFollow').getAttribute('aria-pressed'),'true');
 assert.equal(await player.locator('#framing').inputValue(),'follow');
 const startView=await player.locator('#board > svg:not(.public-board-ink)').getAttribute('viewBox');
 await player.locator('#seek').evaluate(el=>{el.value=String(Number(el.max)*.65);el.dispatchEvent(new Event('input',{bubbles:true}))});
 const followView=await player.locator('#board > svg:not(.public-board-ink)').getAttribute('viewBox');
 assert.notEqual(startView,followView,'read-only camera follows the moving players at different times');
 await player.close();

 // The editable library/Studio uses the same video options, but composition
 // controls appear only after the user opens the optional section.
 const editor=await browser.newPage({viewport:{width:1280,height:880}});
 track(editor);
 await editor.goto(origin+'/rugby/',{waitUntil:'networkidle',timeout:45000});
 const raw=JSON.parse(readFileSync(new URL('../data/drills.json',import.meta.url),'utf8'));
 const drill=raw.drills.find(d=>d.id==='seed-143');
 await editor.locator('#file').setInputFiles({
  name:'regular-drill.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(drill))
 });
 await editor.waitForFunction(()=>document.querySelector('#stageTitle')?.textContent?.includes('Whistle'),null,{timeout:12000});
 await editor.locator('#minionMode').click();
 await editor.locator('#viewMenu > summary').click();
 await editor.locator('#followAction').check();
 assert.equal(await editor.locator('#followAction').isChecked(),true);
 await editor.locator('#viewMenu > summary').click();
 await editor.locator('#share').click();
 await editor.locator('#shareDialog').waitFor({state:'visible'});
 assert.equal(await editor.locator('#shareVideoStyle').inputValue(),'ruckus');
 assert(await editor.locator('#movieCamera').isVisible(),'export camera must be a visible first-class choice');
 assert.equal(await editor.locator('#movieCamera').inputValue(),'follow');
 assert.equal(await editor.locator('#movieSequenceDisclosure').getAttribute('open'),null);
 await editor.locator('#movieOptions').evaluate(el=>{
  for(let n=el;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;
 });
 assert.equal(await editor.locator('#movieBranches').isVisible(),false);
 assert.equal(await editor.locator('#movieDecisionSeconds').isVisible(),false);
 await editor.locator('#movieSequenceDisclosure summary').click();
 assert.equal(await editor.locator('#movieSequenceList li').count(),1);
 const second=await editor.locator('#movieSequencePick option').evaluateAll(options=>
  options.map(o=>o.value).find(Boolean));
 assert.ok(second);
 await editor.locator('#movieSequencePick').selectOption(second);
 await editor.locator('#movieSequenceAdd').click();
 assert.equal(await editor.locator('#movieSequenceList li').count(),2);
 assert.equal(await editor.locator('#movieSequenceDisclosure').evaluate(el=>el.open),true);
 console.log('STUDIO EXPORT PASS: theme follows Ruckus view, decision controls hidden, multi-drill shown only when selected');
 await editor.close();
 if(errors.length)throw Error('Browser JavaScript errors: '+errors.join(' | '));
}finally{
 await browser.close();
}
