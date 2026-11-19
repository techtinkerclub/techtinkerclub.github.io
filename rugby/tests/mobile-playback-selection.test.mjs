import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shouldCapturePitchPan} from '../js/camera.js';

const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const touch=(target='empty')=>({button:0,pointerType:'touch',target:{closest:()=>target==='player'?{dataset:{id:'A1'}}:null}});
test('Pan consumes empty-pitch touches but leaves editable player taps for the Studio',()=>{
 const pan={panMode:true,preferEdit:e=>!!e.target.closest('[data-id]')};
 assert.equal(shouldCapturePitchPan(touch(),pan),true,'dragging blank grass can pan');
 assert.equal(shouldCapturePitchPan(touch('player'),pan),false,'a selected player tap must reach the editor');
 assert.equal(shouldCapturePitchPan(touch('player'),{panMode:false,preferEdit:pan.preferEdit}),false);
 assert.equal(shouldCapturePitchPan({button:0,pointerType:'mouse',target:{}},pan),true,
  'desktop Pan remains an explicit camera tool');
 assert.equal(shouldCapturePitchPan({button:1,pointerType:'mouse',target:{}},pan),true,
  'middle-click is always available for desktop panning');
 assert.equal(shouldCapturePitchPan(touch('player'),{space:true,preferEdit:pan.preferEdit}),true,
  'hold-space intentionally overrides normal touch selection');
});
test('Playback completion and Pause return to editable authored steps, never a stuck preview',()=>{
 const app=text('js/app.js');
 assert.ok(app.includes('if(preview>=duration()){\n   // Playback used to leave preview'),
  'natural playback finish must run the edit-state transition');
 assert.ok(app.includes('choose(drill.frames.length-1);'),
  'the final authored step is the default editing destination');
 assert.ok(app.includes("note('Playback finished · editing last step"));
 assert.ok(app.includes('const nearest=preview===null?idx:locate(preview).i;'),
  'manual Pause should return to the currently visible editable step');
 assert.ok(app.includes('choose(nearest);'));
 assert.ok(app.includes('camera.setPanMode(false);'),
  'resuming edit after playback must leave the pitch directly selectable');
 assert.ok(app.includes('const nearbyPlayer=e.pointerType===\'touch\''),
  'finger taps near a player must win over wide route-line hit targets');
});
