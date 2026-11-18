import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {printProgression} from '../js/outputs.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('index.html'),app=read('js/app.js'),css=read('assets/workspace.css');
for(const id of ['menuDecision','menuEditDecision','menuWhistle','menuResetMovement','menuAddPoint','menuBall','menuRelease','menuDeleteHere','menuDeleteOnward','menuDeleteAll','printProgression']){
 assert.match(html,new RegExp('id="'+id+'"'),'Expected menu/progression action '+id);
}
assert.doesNotMatch(html,/data-object-command="left"|data-object-command="right"/,'Rotate handles replace duplicate context-menu commands');
assert.match(css,/\.object-menu button\[hidden\]/,'Hidden context actions must remain hidden despite button display CSS');
assert.match(app,/closest\('\[data-path-id\]'\)/,'Right-click must recognise actual SVG path hits');
assert.match(app,/beginDecisionPlacement\(\)/,'Context decisions must use existing decision placement');
assert.match(app,/cancelSelectedMovement\(\)/,'Movement reset must preserve player');
const src=JSON.parse(read('data/coach-drills.json')).drills.find(x=>x.id==='mwlwflvgp8foni');
const pub=JSON.parse(read('data/published-drills.json')).drills.find(x=>x.id==='seed-133');
assert.ok(src&&pub,'Decision source and public copy must exist');
for(const drill of [src,pub]){
 assert.doesNotMatch(drill.equipment,/four cones/i);
 assert.match(drill.branching.choices[0].watchFor,/D1 and D2/);
}
const nodes=[];
globalThis.document={getElementById:()=>null,createElement:()=>({id:'',innerHTML:''}),body:{append:node=>nodes.push(node)}};
let printed=0;globalThis.window={print:()=>{printed++}};
printProgression([src,pub],'Defensive progression');
assert.equal(printed,1);assert.equal(nodes.length,1);
assert.match(nodes[0].innerHTML,/PROGRESSION STAGE 2 OF 2/);
assert.match(nodes[0].innerHTML,/Session sequence/);

const publicBuilder=read('js/public-video.js');
const sequence=read('js/sequence.js');
const sequenceHtml=read('sequence.html');
assert.match(publicBuilder,/id="videoPresent"/);
assert.match(publicBuilder,/id="videoPrint"/);
assert.match(publicBuilder,/id="videoLink"/);
assert.match(publicBuilder,/sequence\.html/);
assert.match(sequence,/loadCatalogue\(\)/,'Read-only presentation must resolve current published versions');
assert.match(sequence,/play\.html\?/,'Each stage must retain the existing read-only player');
assert.match(sequenceHtml,/id="drillViewer"/);
assert.doesNotMatch(sequenceHtml,/app\.js|github-store/,'Progression must not expose editor dependencies');
