import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../play.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../js/player.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/player-workspace.css',import.meta.url),'utf8');

test('public player loads the one-screen workspace styles',()=>{
 assert.match(html,/player-workspace\.css\?v=/);
 assert.match(html,/player\.js\?v=0\.20\.67/);
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
