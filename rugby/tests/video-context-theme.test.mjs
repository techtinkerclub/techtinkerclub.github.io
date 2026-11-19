import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {movieOptions,movieSettingsMarkup,videoSettingVisibility} from '../js/movie.js';
import {cartoonPitchDecor} from '../js/cartoon-players.js';
import {playbackData,renderScene} from '../js/scene.js';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('a normal single drill has no decision, option, or progression-only settings',()=>{
 const shown=videoSettingVisibility({hasDecision:false,story:false},'single',true);
 assert.equal(shown.decision,false);
 assert.equal(shown['decision-pause'],false);
 assert.equal(shown.story,false);
 assert.equal(shown.replay,false);
 assert.equal(movieOptions({mode:'single'}).mode,'single');
 const html=movieSettingsMarkup('simple');
 assert.match(html,/data-video-if="decision"/);
 assert.match(html,/data-video-if="decision-pause"/);
 assert.match(html,/data-video-if="replay"/);
 assert.match(html,/data-video-if="story"/);
});
test('decision explanations and replay settings appear only when relevant',()=>{
 const decision=videoSettingVisibility({hasDecision:true,story:true},'dual',true);
 assert.equal(decision.decision,true);
 assert.equal(decision['decision-pause'],true);
 assert.equal(decision.replay,true);
 assert.equal(decision.story,true);
 assert.equal(videoSettingVisibility({hasDecision:true,story:true},'dual',false)['decision-pause'],false);
 assert.equal(videoSettingVisibility({hasDecision:false,story:true},'dual',true).decision,false);
 assert.equal(videoSettingVisibility({hasDecision:false,story:true},'dual',true).story,true,
  'multi-drill intro options remain possible without a decision');
});
test('Studio and both public entry points explicitly support exporting a funny Ruckus video',()=>{
 const app=read('js/app.js'),editor=read('index.html'),coach=read('coach/index.html');
 const player=read('js/player.js'),play=read('play.html'),publicVideo=read('js/public-video.js');
 const outputs=read('js/outputs.js'),recorder=read('js/video-recorder.js');
 assert.match(editor,/id="shareVideoStyle"/);
 assert.match(coach,/id="shareVideoStyle"/);
 assert.match(app,/cartoonMode:\$\('shareVideoStyle'\)\.value==='ruckus'/);
 assert.match(editor,/id="movieSequenceDisclosure"/);
 assert.match(coach,/id="movieSequenceDisclosure"/);
 assert.match(play,/id="playerVideoStyle"/);
 assert.match(player,/cartoonMode:\$\('playerVideoStyle'\)\.value==='ruckus'/);
 assert.match(player,/searchParams\.set\('style','ruckus'\)/,'library playlist link remembers Ruckus choice');
 assert.match(publicVideo,/id="publicVideoStyle"/);
 assert.match(publicVideo,/cartoonMode:get\('publicVideoStyle'\)\.value==='minion'/);
 assert.match(outputs,/hasOutcomes\(d\)\|\|opts\.cartoonMode===true/,
  'even a single ordinary Ruckus drill must use cartoon storyboard');
 assert.match(recorder,/const cartoon=opts\.cartoonMode===true/);
 assert.match(recorder,/cartoonMode:opts\.cartoonMode===true/);
});
test('Ruckus pitch and movie source have no decorative corner flowers',()=>{
 assert.equal(cartoonPitchDecor(),'');
 const data=JSON.parse(read('data/drills.json')).drills.find(d=>d.frames?.length>1);
 assert.ok(data);
 const scene=renderScene(playbackData(data),{index:0,cartoonMode:true});
 assert.doesNotMatch(scene.svg,/cartoon-pitch-decor|#f7b0d1|#f9f3c5/);
});
test('video introduction can be chosen independently of decision pause cards',()=>{
 const storyboard=read('js/movie-storyboard.js');
 assert.match(storyboard,/const intro=seconds\(opts\.introSeconds,3,0,12\)/);
 assert.match(storyboard,/const decisionPause=opts\.pauseCards===false\?0:/);
});
