import assert from 'node:assert/strict';
import {shape,blank} from '../js/model.js';
import {addInteraction,sanitizeInteractions,CONE_COLORS,TAG_COLORS,skillIcon,interactionOverlay} from '../js/skill-actions.js';
import {playbackData,renderScene} from '../js/scene.js';
import {stripDecisions} from '../js/training.js';

const d=blank();d.age='U8';d.ageMin=8;d.ageMax=8;
const objects=[
 {id:'runner',type:'attacker',label:'A1',x:400,y:320,rot:0,tagBelt:true,tags:{left:true,right:true},tagColor:'green'},
 {id:'tagger',type:'defender',label:'D1',x:420,y:320,rot:180,tagBelt:true,tags:{left:true,right:true}},
 {id:'ball',type:'ball',label:'',x:400,y:320,rot:0,ownerId:'runner'},
 {id:'cone',type:'cone',label:'',x:500,y:230,rot:0,coneColor:'blue'},
 {id:'hoop',type:'hoop',label:'',x:520,y:230,rot:0},
 {id:'hurdle',type:'hurdle',label:'',x:540,y:230,rot:0},
 {id:'pole',type:'slalomPole',label:'',x:560,y:230,rot:0},
 {id:'disc',type:'markerDisc',label:'',x:580,y:230,rot:0}
];
d.frames[0].objects=structuredClone(objects);
d.frames.push({name:'Tag',seconds:2,notes:'Tag and release ball after the stop.',objects:structuredClone(objects),timing:{},paths:{}});
assert.match(shape('cone','blue'),/fill="#65b8f8"/);
assert.equal(Object.keys(CONE_COLORS).length,7);
for(const type of ['hoop','hurdle','slalomPole','markerDisc'])assert.match(shape(type),/<(path|ellipse)/);
const action=addInteraction(d.frames[1],'tag','tagger','runner','left');
assert.equal(action.ok,true);
assert.equal(d.frames[1].objects.find(o=>o.id==='runner').tags.left,false);
assert.equal(d.frames[1].objects.find(o=>o.id==='tagger').heldTags,1);
assert.equal(addInteraction(d.frames[1],'tag','tagger','runner','left').ok,false,'Cannot take missing tag twice');
const safe=playbackData(d);
assert.equal(safe.frames[1].objects.find(o=>o.id==='cone').coneColor,'blue');
assert.equal(safe.frames[1].objects.find(o=>o.id==='runner').tags.left,false);
assert.equal(safe.frames[1].interactions[0].kind,'tag');
assert.match(renderScene(safe,{index:1}).svg,/Tag removed/);
assert.match(renderScene(safe,{index:1}).svg,/#65b8f8/);
assert.match(skillIcon(safe.frames[0].objects[0]),/tag-belt/);
assert.equal(Object.keys(TAG_COLORS).length,4);
const belts=skillIcon(safe.frames[0].objects[0]);
assert.equal((belts.match(/fill="#8bd67e"/g)||[]).length,2,'Both tags should share the player's selected strip colour');
assert.equal(safe.frames[0].objects[0].tagColor,'green','Chosen strip colour must survive export');

assert.equal(addInteraction(d.frames[1],'touch','tagger','cone').ok,true);
assert.equal(addInteraction(d.frames[1],'touch','tagger','hoop').ok,true);
assert.equal(sanitizeInteractions(d.frames[1]).interactions.length,3);
assert.match(renderScene(playbackData(d),{index:1}).svg,/Touch/);
const next=stripDecisions(structuredClone(d.frames[1]));
assert.equal(next.interactions,undefined,'New action steps must not repeat previous contact cues');
const invalid=structuredClone(d.frames[1]);invalid.objects=invalid.objects.filter(o=>o.id!=='cone');
sanitizeInteractions(invalid);
assert.equal(invalid.interactions.length,2,'Deleting equipment clears orphan touch events');

const source=await import('node:fs');
const read=path=>source.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('js/app.js'),html=read('index.html');
for(const id of ['menuGroupTouch','menuGroupTackle','menuGroupRuck','menuGroupMaul','menuTouch','menuTag','skillDialog','coneColour','tagBelt']){
 if(!['coneColour','tagBelt'].includes(id))assert.match(html,new RegExp('id="'+id+'"'));
 else assert.match(app,new RegExp(id));
}
assert.match(app,/groupIds\.size>=2/,'Right-click should retain genuine multi-selection');
assert.match(app,/age>=10&&hasOpposition/,'U8 cannot access ruck or maul shortcuts');

assert.match(app,/function updateSkillActionsPanel\(/,'Coach must be able to edit and remove touch/tag actions');
assert.match(app,/data-skill-delete/,'Contact events must be individually removable');
assert.match(app,/ensureSkillActionStep/,'Actions recorded from setup must create a real action step');
assert.match(app,/age>=10&&hasOpposition/,'U9 must not show ruck or maul shortcuts');
assert.match(html,/id="skillActionsList"/,'Step inspector must expose contact event editing');
assert.match(read('assets/workspace.css'),/skill-action-row/,'Contact event controls need visible styling');

assert.match(html,/id="actionChooser"/,'Actions must have one contextual picker');
assert.match(html,/id="menuAction"/,'Right-click exposes Actions');
assert.match(html,/id="menuConeColour"/,'Cones can open colour selection from right-click');
assert.match(app,/openActionChooser\(/,'Action chooser is wired to editor');
assert.match(app,/actionScope=scope/,'Touching players and agility equipment are distinct choices');
assert.match(app,/const draft=idx===0\?stripDecisions\(clone\(f\(\)\)\):clone\(f\(\)\)/,'Contact formations must validate on a detached draft');
const css=read('assets/workspace.css');
assert.match(css,/#skillSideRow\[hidden\]\{display:none!important\}/,'Touch dialog must not show tag-only settings');
const libcss=read('assets/library.css');
assert.match(libcss,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/,'Progression action buttons require consistent size and spacing');
