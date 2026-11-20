import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../play.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../js/player.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/player-workspace.css',import.meta.url),'utf8');

test('public player loads the one-screen workspace styles',()=>{
 assert.match(html,/player-workspace\.css\?v=/);
 assert.match(html,/player\.js\?v=0\.20\.71/);
 assert.match(css,/height:100dvh/);
 assert.match(css,/overflow:hidden/);
 assert.match(css,/\.presentation-panel/);
});

test('all existing functional surfaces move into stable panels',()=>{
 for(const id of ['stepReading','coachResources','coachSequenceContent','catalogueReview','downloadDrill','viewerCamera','controls','branchDecisionPanel']){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 for(const key of ['step','coach','steps','view','share']){
  assert.ok(js.includes("'"+key+"'"),key+' workspace tab registered');
 }
 assert.match(js,/main\.prepend\(workspace\)/);
 assert.match(js,/panels\.share\.append\(\$\('catalogueReview'\)\)/);
 assert.match(js,/panels\.step\.append\(\$\('stepReading'\)\)/);
});

test('coaching step navigation does not scroll the page',()=>{
 assert.doesNotMatch(js,/scrollIntoView/);
 assert.match(js,/presentation-tab-step/);
});

test('mobile uses a contained drawer, not a page-length column',()=>{
 assert.match(css,/max-width:850px/);
 assert.match(css,/position:fixed/);
 assert.match(css,/data-open="true"/);
 assert.match(js,/event\.key==='Escape'/);
});

test('blackboard mode displays the actual drill flow and coaching menu',()=>{
 assert.match(js,/function renderStepRoute\(index\)/);
 assert.match(js,/renderStepRoute\(s\.index\)/);
 assert.match(js,/button\.addEventListener\('click',\(\)=>jumpStep\(i\)\)/);
 assert.match(js,/COACH/);
 assert.match(css,/COACH'S BOARD/);
 assert.match(css,/chalk-route-step/);
 assert.match(css,/aria-current="step"/);
 assert.match(html,/player-workspace\.css\?v=2/);
});

test('published drills open as fullscreen read-only blackboards',()=>{
 const stylesheet=readFileSync(new URL('../assets/public-blackboard.css',import.meta.url),'utf8');
 assert.match(html,/public-blackboard\.css\?v=4/);
 assert.match(js,/function initPublicBoard\(\)/);
 assert.match(js,/document\.body\.classList\.add\('public-blackboard'\)/);
 assert.match(stylesheet,/\.read-only-player\.public-blackboard>header\{display:none\}/);
 assert.match(stylesheet,/height:100dvh/);
 assert.match(stylesheet,/\.public-board-toolbar/);
 assert.match(js,/fullscreenElement/);
 assert.match(js,/requestFullscreen/);
});

test('the public board offers coaching tools without editor mutations',()=>{
 for(const keyword of ['publicInkColour','publicInkUndo','publicInkClear','publicSnapshotPng',
  'publicSpotlight','publicGhost','publicCameraTarget','publicCameraFraming',
  'publicReplayStep','publicLoopStep','publicKeyMoments']){
  assert.ok(js.includes(keyword),keyword+' exists');
 }
 assert.match(js,/const overlay=teachingOverlay/);
 assert.match(js,/saveBlob\(png,outputName\(d\)/);
 assert.match(js,/Local only/);
 assert.match(js,/local\s*to this board/);
 assert.match(js,/stepLoop=false/);
 assert.match(js,/new URLSearchParams\(location\.search\)\.has\('drill'\)/);
});

test('fullscreen board leaves standard share and published frames alone',()=>{
 assert.match(js,/publicBoard\?\.cameraView\(s\)\|\|s\.camera/);
 assert.match(js,/publicBoard\?\.refresh\(s\)/);
 assert.match(js,/saveBlob\(png/);
 assert.match(js,/document\.body\.classList\.contains\('public-blackboard'\)/);
});

test('read-only chalk includes non-editing shapes and a visual reference grid',()=>{
 assert.match(js,/publicInkTool/);
 assert.match(js,/tool==='arrow'/);
 assert.match(js,/tool==='circle'/);
 assert.match(js,/tool==='marker'/);
 assert.match(js,/publicBoardGrid/);
 assert.match(js,/public-board-grid/);
 assert.match(js,/publicSnapshotInk/);
});

test('floating boards can move, retract and adjust opacity without editing drills',()=>{
 const blackboard=readFileSync(new URL('../assets/public-blackboard.css',import.meta.url),'utf8');
 assert.match(js,/function positionPanel\(node,left,top\)/);
 assert.match(js,/function resetPanelPositions\(\)/);
 assert.match(js,/function reflowPanels\(\)/);
 assert.match(js,/pointermove/);
 assert.match(js,/publicPanelOpacity/);
 assert.match(js,/public-board-dock/);
 assert.match(js,/data\.collapsed/);
 assert.match(blackboard,/public-panel-alpha/);
 assert.match(blackboard,/data-collapsed="true"/);
});
test('mobile can open a compact tools menu and bottom-sheet coaching notes',()=>{
 const blackboard=readFileSync(new URL('../assets/public-blackboard.css',import.meta.url),'utf8');
 assert.match(js,/public-board-mobile-menu/);
 assert.match(js,/data\.mobileOpen/);
 assert.match(blackboard,/max-width:700px/);
 assert.match(blackboard,/transform:translateY\(105%\)/);
 assert.match(blackboard,/data-mobile-open="true"/);
});
test('tap-to-focus remains view-only and playback has safe keyboard shortcuts',()=>{
 assert.match(js,/function setPickFocus\(value\)/);
 assert.match(js,/board\.addEventListener\('click'/);
 assert.match(js,/local\.spot=nearest\.id/);
 assert.match(js,/public-board-shortcuts/);
 assert.match(js,/event\.code==='Space'/);
 assert.match(js,/event\.key==='ArrowLeft'/);
});
