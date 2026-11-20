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
  assert.match(s,/assets\/blackboard\.css\?v=1/);
  assert.match(s,/js\/app\.js\?v=0\.20\.46/);
 }
 const app=read('js/app.js');
 assert.match(app,/import \{initBlackboard\} from '\.\/blackboard\.js\?v=1'/);
 assert.match(app,/const blackboard=initBlackboard\(/);
 assert.match(app,/rotate:delta=>/);
});
