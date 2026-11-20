import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loopStepBounds,loopProgress,keyMoments,targetViewport,teachingOverlay} from '../js/blackboard-coaching.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const player={id:'a1',type:'attacker',label:'A1',x:260,y:290,rot:0};
const defender={id:'d1',type:'defender',label:'D1',x:460,y:290,rot:0};
const frames=[
 {name:'Ready',seconds:0,objects:[player,defender],timing:{},paths:{}},
 {name:'Go',seconds:2,objects:[{...player,x:320},defender],signal:{kind:'whistle'},timing:{},paths:{}},
 {name:'Tackle',seconds:3,objects:[{...player,x:375},{...defender,x:380},
  {id:'m',type:'tackle',x:375,y:290,breakdown:{phase:'tackle'}}],timing:{},paths:{}},
 {name:'Choose',seconds:1,objects:[player,defender],timing:{},paths:{}},
 {name:'Pass',seconds:2,objects:[player,defender,
  {id:'ball',type:'ball',x:300,y:292,transferKind:'pass'}],timing:{},paths:{}}
];
const drill={frames,branching:{fork:3}};
test('step replay loops ONLY inside the authored movement interval',()=>{
 const b=loopStepBounds(drill,2);
 assert.deepEqual(b,{start:2,end:5,seconds:3,index:2});
 assert.equal(loopProgress(4.8,.5,b).toFixed(2),'2.30');
 assert.equal(loopProgress(2,.6,b).toFixed(2),'2.60');
 assert.equal(loopStepBounds(drill,0),null,'setup is not a running action');
 assert.equal(loopStepBounds(drill,100),null,'invalid step is never looped');
});
test('key moments are sourced from real authored steps and decision fork',()=>{
 const entries=keyMoments(drill);
 assert(entries.some(m=>m.kind==='whistle'&&m.index===1));
 assert(entries.some(m=>m.kind==='tackle'&&m.index===2));
 assert(entries.some(m=>m.kind==='decision'&&m.index===3));
 assert(entries.some(m=>m.kind==='pass'&&m.index===4));
 assert.deepEqual(keyMoments(drill),entries,'key moments must be deterministic');
});
test('selected focus and teaching overlays never edit the rugby model',()=>{
 const g={viewWidth:900,viewHeight:540,toView:(x,y)=>({x,y})};
 const objects=frames[2].objects.filter(o=>o.type!=='tackle');
 const before=JSON.stringify({objects,frames});
 const focus=targetViewport(objects,g,'a1');
 assert(focus&&focus.width>0&&focus.height>0);
 assert.equal(targetViewport(objects,g,'unknown'),null);
 const svg=teachingOverlay({objects,previous:frames[1],next:frames[3],g,spotlightIds:['a1'],ghostIds:['a1'],ghostMode:'both'});
 assert.match(svg,/bb-teaching-overlay/);
 assert.match(svg,/bb-spotlight-mask/);
 assert.match(svg,/START/);
 assert.match(svg,/NEXT/);
 assert.doesNotMatch(teachingOverlay({objects,g,spotlightIds:[],ghostIds:[],ghostMode:'off'}),/bb-teaching-overlay/);
 assert.equal(JSON.stringify({objects,frames}),before,'view tools must not mutate drill');
});
test('View options show common controls before a collapsed advanced section',()=>{
 const html=read('index.html'),css=read('assets/workflow.css');
 assert.match(html,/<details class="board-view-menu" id="viewMenu">/);
 assert.match(html,/<label class="camera-follow-choice"><input id="followAction" type="checkbox"><span>◎ Follow action<\/span><\/label>/);
 assert.match(html,/<details class="view-menu-advanced" id="viewAdvanced">/);
 assert(html.indexOf('id="followAction"')<html.indexOf('id="viewAdvanced"'));
 assert(html.indexOf('id="trails"')<html.indexOf('id="viewAdvanced"'));
 for(const id of ['scaleMode','grid','snapGrid','gridStep','resetLayout'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(css,/\.view-menu-panel \.camera-follow-choice\{[^}]*align-items:center/);
 assert.match(css,/\.view-menu-panel \.view-menu-advanced-body/);
 assert.equal((html.match(/id="followAction"/g)||[]).length,1);
});
test('Blackboard uses two existing panels; decisions only appear for authored branching',()=>{
 const src=read('js/blackboard.js'),app=read('js/app.js'),css=read('assets/blackboard.css');
 for(const id of ['bbSpeed','bbFollowTarget','bbGhostMode','bbLayoutPreset','bbKeyMoments','bbMomentChips','bbDecisionBar','bbDecisionShortcut'])
  assert.ok(src.includes('id="'+id+'"'),id+' is part of compact Blackboard controls');
 assert.match(src,/btn\('loop'\)/);
 assert.match(src,/keyMoments\(\{frames:state\.frames,branching:branch\}\)/);
 assert.match(src,/btn\('spotlight'\)/);
 assert.match(src,/\.hidden=!branch/,'Decision controls must not appear on ordinary drills');
 assert.match(src,/case 'decision':case 'compare-decision':click\('compareOutcomes'\)/);
 assert.match(src,/case 'edit-decision':click\('editOutcomes'\)/);
 assert.match(css,/bb-native-timeline #outcomeBar\{display:none!important\}/,
   'Native A/B bar must not duplicate compact Blackboard choices');
 assert.match(css,/\.blackboard-ui\.bb-coaching-layout \.bb-top-actions/);
 assert.doesNotMatch(css,/\.blackboard-ui \.bb-coaching-layout \.bb-top-actions/,
   'Coaching layout selectors must match the actual element');
 assert.match(app,/bbLoop&&document\.body\.classList\.contains\('blackboard-mode'\)/);
 assert.match(app,/teachingOverlay\(\{objects,previous:/);
 assert.match(app,/onCoachTool:\(kind,value\)=>/);
 assert.match(src,/localStorage\.setItem\(layoutKey/);
 assert.match(src,/onCoachTool\('reset-ephemeral',true\)/);
});

test('Blackboard Editing/Coaching use separate remembered layouts; Ruckus stays legible when off',()=>{
 const blackboard=read('js/blackboard.js'),css=read('assets/blackboard.css'),index=read('index.html');
 assert.match(index,/blackboard\.css\?v=5/);
 assert.match(blackboard,/savedLayouts\[layoutPreset\]=\{panels,camera:cameraOpen,timeline:timelineOpen\}/);
 assert.match(blackboard,/ui\.classList\.toggle\('bb-coaching-layout',name==='coaching'\)/);
 assert.match(blackboard,/id="bbLayoutHint"/);
 assert.match(blackboard,/Coaching hides Undo, Redo and Save/);
 assert.match(blackboard,/Editing shows Undo, Redo and Save/);
 assert.match(blackboard,/data-bb="ruckus" id="bbRuckus"[^>]*aria-pressed="false"/);
 assert.match(blackboard,/ruckus\.setAttribute\('aria-pressed',String\(!!state\.cartoonMode\)\)/);
 assert.match(css,/\.bb-top-actions \[data-bb="ruckus"\]\{\s*color:#f3edcc;\s*background:#314939e8/);
 assert.match(css,/\.bb-top-actions \[data-bb="ruckus"\]\.is-active/);
 assert.match(css,/\.blackboard-ui\.bb-coaching-layout \.bb-top-actions\.bb-movable/);
});
