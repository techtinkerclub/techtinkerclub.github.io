import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Blackboard lives in the same Studio pitch and uses existing drill controls',()=>{
 const source=read('js/blackboard.js');
 assert.match(source,/document\.querySelector\('\.field-wrap'\)/);
 assert.match(source,/pitch=\$\('pitch'\)/);
 assert.match(source,/const click=id=>/);
 for(const id of ['drawRouteSide','passBallSide','addStep','undoEdit','redoEdit','minionMode','back','forward','play']){
  assert.ok(source.includes("click('"+id+"')"),id+' must use the existing editor control');
 }
 assert.match(source,/original\.click\(\)/,'adding players must use existing editor palette');
 assert.match(source,/getState\(\)/,'selected objects must be read from live editor state');
 assert.match(source,/openDetails\(\)/,'details must reuse the existing inspector');
 assert.match(source,/openObjectActions\?\.\(\)/,'all existing contextual rugby actions must be reachable');
 assert.doesNotMatch(source,/\bnewDrill\b|\bcreateHistory\b|\bclone\(drill\)/,
  'Blackboard must not create independent model/history');
});
test('Blackboard is a full-screen pitch, not an embedded webpage; editor visibility is restored',()=>{
 const css=read('assets/blackboard.css'),src=read('js/blackboard.js');
 assert.match(css,/body\.blackboard-mode>\.main\{position:fixed!important;inset:0!important/);
 assert.match(css,/body\.blackboard-mode \.stage>\.field-wrap\{position:absolute!important;inset:0!important/);
 assert.match(css,/body\.blackboard-mode\.blackboard-details-open \.main>\.inspector/);
 assert.match(css,/backdrop-filter:blur/);
 assert.match(src,/document\.body\.classList\.add\('blackboard-mode'\)/);
 assert.match(src,/document\.body\.classList\.remove\('blackboard-mode'\)/);
 assert.match(src,/new URLSearchParams\(location\.search\)\.get\('blackboard'\)==='1'/);
 assert.match(src,/id='blackboardFromView'/);
});
test('Ink is explicitly ephemeral and separate from real routes and passes',()=>{
 const src=read('js/blackboard.js');
 assert.match(src,/not saved or included in video export/);
 assert.match(src,/document\.createElementNS\(STROKE_NS,'svg'\)/);
 assert.match(src,/ink\.setPointerCapture/);
 assert.match(src,/ink\.getScreenCTM\(\)\.inverse\(\)/);
 assert.match(src,/syncInkView\(\)/);
 assert.match(src,/marks\.splice\(0\)\.forEach\(p=>p\.remove\(\)\)/);
 assert.doesNotMatch(src,/drill\.frames\.push|f\(\)\.objects\.push/);
});
test('Both Studio editions load Blackboard and the same live JS module',()=>{
 for(const path of ['index.html','coach/index.html']){
  const s=read(path);
  assert.match(s,path==='index.html'?/assets\/blackboard\.css\?v=5/:/assets\/blackboard\.css\?v=2/);
  assert.match(s,path==='index.html'?/js\/app\.js\?v=0\.20\.59/:/js\/app\.js\?v=0\.20\.48/);
 }
 const app=read('js/app.js');
 assert.match(app,/import \{initBlackboard\} from '\.\/blackboard\.js\?v=11'/);
 assert.match(app,/const blackboard=initBlackboard\(/);
 assert.match(app,/rotate:delta=>/);
});

test('Blackboard timeline reuses the original step cards, scrubber and timing tracks',()=>{
 const src=read('js/blackboard.js');
 assert.match(src,/const nativeTimeline=\$\('timelinePanel'\)/);
 assert.match(src,/slot\.appendChild\(nativeTimeline\)/);
 assert.match(src,/timelineHome\.insertBefore\(nativeTimeline,timelineNext\)/);
 assert.match(src,/restoreTimeline\(\)/);
 for(const value of ["click('deleteStep')","click('addStep')","click('toggleTracks')","click('zoomIn')","click('zoomOut')","click('zoomFit')","click('zoomAction')","click('zoomArea')","click('panMode')","click('orientation')"]){
  assert.ok(src.includes(value),'Blackboard must reuse native control: '+value);
 }
 assert.match(src,/edit\.dispatchEvent\(new Event\('change'/,'Changing duration must reuse Studio validation/history');
 assert.match(src,/openStepDetails\?\.\(\)/,'Blackboard can open Step inspector directly');
 assert.doesNotMatch(src,/createHistory|createDrill|clone\(drill\)/,'No duplicate Blackboard drill engine');
});
test('Blackboard move grips remain compact, keyboard accessible and restore panel layouts',()=>{
 const src=read('js/blackboard.js'),css=read('assets/blackboard.css');
 for(const panel of ['title','tools','options','steps','add','selection','ink','camera','timeline']){
  assert.match(src,new RegExp('data-bb-panel="'+panel+'"'));
 }
 assert.match(src,/grip\.setPointerCapture\(event\.pointerId\)/);
 assert.match(src,/event\.key==='ArrowLeft'/);
 assert.match(src,/Math\.max\(6,Math\.min\(x,/,'Panels must be clamped to the viewport');
 assert.match(src,/resetPanels\(\)/);
 assert.match(css,/\.bb-movable\{opacity:\.81/,'Idle panels should be unobtrusive');
 assert.match(css,/\.bb-movable:hover/,'Interaction restores opacity');
 assert.match(css,/\.bb-movable\.is-moved\{transform:none!important/);
 assert.match(css,/\.bb-native-timeline #timelinePanel/,'Timeline stays compact in its movable panel');
});

test('Blackboard Follow action uses the original Studio camera setting',()=>{
 const src=read('js/blackboard.js'),html=read('index.html');
 assert.match(html,/id="followAction" type="checkbox"/);
 assert.match(src,/data-bb="follow" aria-pressed="false"/);
 assert.match(src,/case 'follow':if\(!click\('followAction'\)\)/,
  'Follow must call native camera toggle, not create its own camera model');
 assert.match(src,/const enabled=originalFollow\.checked===true/);
 assert.match(src,/follow\.setAttribute\('aria-pressed',String\(enabled\)\)/);
 assert.match(src,/follow\.classList\.toggle\('is-active',enabled\)/);
});

test('Follow action is presented consistently across studio, mobile, blackboard and video',()=>{
 const studio=read('index.html'),blackboard=read('js/blackboard.js'),css=read('assets/output.css');
 const presentation=read('play.html'),movie=read('js/movie.js');
 assert.match(studio,/<label class="camera-follow-choice"><input id="followAction" type="checkbox"><span>◎ Follow action<\/span><\/label>/);
 assert.match(blackboard,/data-bb="follow" aria-pressed="false"[^>]*>◎ Follow action<\/button>/);
 assert.match(presentation,/id="playerFollow"[^>]*>Follow action<\/button>/);
 assert.match(presentation,/<option value="follow">Follow action · moving camera<\/option>/);
 assert.match(studio,/<option value="follow">Follow action · moving camera<\/option>/);
 assert.match(movie,/<option value="follow">Follow action · smooth moving camera<\/option>/);
 assert.match(css,/\.camera-follow-choice:has\(input:checked\)/);
 assert.match(read('js/mobile-editor.js'),/body\.appendChild\(viewMenu\)/,
  'Mobile must continue displaying the same follow control in its View sheet');
});
