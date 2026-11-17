import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isDiagramObject,diagramSettings,diagramSVG} from '../js/diagram-shapes.js';
import {types} from '../js/model.js';
import {signalForFrame,whistleAt,whistleEvents,crossedWhistles,whistleOverlay} from '../js/whistle-signal.js';
import {decisionTime,outcomePreviewSVG,outcomeCardsMarkup} from '../js/branching-visual.js';
import {playbackData,renderScene} from '../js/scene.js';
import {printMarkup} from '../js/outputs.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const catalogue=JSON.parse(read('data/drills.json')),drill=catalogue.drills.find(d=>d.id==='seed-132');
assert.ok(drill,'Five-defender decision example missing');
assert.equal(drill.frames[1].signal.kind,'whistle');
assert.equal(whistleAt(drill,1).at,0,'The coach whistle starts the first action');
assert.equal(whistleEvents(drill).length,1);
assert.equal(crossedWhistles(drill,0,0,{includeStart:true}).length,1);
assert.equal(crossedWhistles(drill,1,2).length,0);
assert.equal(signalForFrame(drill.frames[1]).coachId,'coach');
assert.equal(signalForFrame({...drill.frames[1],objects:[]}),null,'A whistle without a coach is invalid');
assert.equal(decisionTime(drill),drill.frames[1].seconds,'Decision follows shared step');
assert.ok(whistleOverlay(drill.frames[1],{toView:(x,y)=>({x,y}),margin:0,fw:900,fh:540},.1).includes('WHISTLE'));
assert.equal(whistleOverlay(drill.frames[1],{toView:(x,y)=>({x,y}),margin:0,fw:900,fh:540},1.1),'');
const safe=playbackData(drill);
assert.equal(safe.frames[1].signal.kind,'whistle','Whistle must survive presentation sanitisation');
assert.match(renderScene(safe,{index:1}).svg,/data-coach-signal="whistle"/,'Whistle must be drawn in media frame');
assert.doesNotMatch(renderScene(safe,{time:2}).svg,/data-coach-signal="whistle"/,'Whistle must be time-limited');
for(const id of ['a','b']){
 const markup=outcomePreviewSVG(safe,id);
 assert.match(markup,/<svg/);
 assert.match(markup,new RegExp('branch-'+id+'-route-arrow'));
 assert.match(markup,/marker-end="url\(#branch-/,'Preview must show actual movement arrows');
}
const interactive=outcomeCardsMarkup(safe);
assert.match(interactive,/data-branch-choice="a"/);
assert.match(interactive,/data-branch-choice="b"/);
assert.match(interactive,/Continue with this outcome/);
const printed=printMarkup(safe);
assert.match(printed,/branch-preview-grid/,'Printable sheets must show both consequences together');
assert.match(printed,/WHISTLE/,'Printable output must include coach start cue');

assert.ok(types.fieldLine,'General line missing from shared object model');
assert.equal(isDiagramObject('fieldLine'),true);
const line=diagramSettings('fieldLine',{},20);
assert.equal(line.length,20,'New reference line defaults to full pitch width');
assert.equal(line.dashed,false);
const g={scale:15,width:20},svg=diagramSVG({type:'fieldLine',diagram:line,label:'Start line'},g);
assert.match(svg,/data-line-kind="field-reference"/);
assert.match(svg,/Start line/);
assert.doesNotMatch(svg,/OFFSIDE/,'A normal pitch line must not imply offside');
const frame={name:'Reference',seconds:0,notes:'',objects:[{id:'field-1',type:'fieldLine',x:450,y:260,rot:0,label:'Start line',diagram:line}],timing:{},paths:{}};
const clean=playbackData({...drill,branching:undefined,frames:[frame]});
assert.equal(clean.frames[0].objects[0].type,'fieldLine','General line must survive export sanitising');
assert.match(renderScene(clean,{index:0}).svg,/data-line-kind="field-reference"/);
for(const page of ['index.html','coach/index.html']){
 const html=read(page);
 assert.match(html,/id="tryDecisionDemo"/);
 assert.match(html,/id="compareOutcomes"/);
 assert.match(html,/id="whistleSound"/);
}
for(const page of ['play.html','coach/play.html']){
 const html=read(page);
 for(const id of ['branchCompare','branchDecisionPanel','branchDecisionCards','whistleSound'])
  assert.ok(html.includes('id="'+id+'"'),'Missing '+id+' in '+page);
}
const editor=read('js/app.js'),player=read('js/player.js'),guide=read('coach/coach.js');
assert.match(editor,/compareOutcomePaths\(\{atFork:true\}\)/);
assert.match(player,/showOutcomeDecision\(/);
assert.match(editor,/coachWhistle/);
assert.match(guide,/case 'fieldLine'/);
assert.match(guide,/case 'whistle'/);
const css=read('assets/branching.css');
assert.match(css,/\.scenes\{min-height:58px/,'Scene cards must remain visible after branching row');
assert.match(css,/\.scene\{min-height:48px/,'Scene cards must not collapse to a thin strip');
console.log('Rugby cues: ordinary practice line, playable decision previews, shared signal, whistle sound toggles, both editions, print and model tests passed.');
