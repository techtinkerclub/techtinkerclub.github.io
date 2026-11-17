import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOutcomes,chooseOutcome,syncActiveOutcome,outcomeViews,branchInfo,removeOutcomes} from '../js/branching.js';
import {playbackData,renderScene} from '../js/scene.js';
import {printMarkup,shareCode,decodeShare} from '../js/outputs.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const data=JSON.parse(read('data/drills.json'));
const example=data.drills.find(d=>d.id==='seed-132');
assert.ok(example,'Missing coached decision demonstration');
assert.ok(data.drills.length>=132,'Keep original starter drills and published additions');
assert.equal(example.frames[0].objects.filter(o=>o.type==='defender').length,5,'Five defenders needed');
assert.equal(example.branching.fork,1);
assert.equal(example.branching.choices.length,2);
assert.equal(example.branching.choices[0].frames.length,2);
assert.equal(example.branching.choices[1].frames.length,4);

const track=JSON.parse(JSON.stringify(example));
assert.equal(outcomeViews(track)[0].drill.frames.length,4);
assert.equal(outcomeViews(track)[1].drill.frames.length,6);
track.frames[2].notes='Independent A';
syncActiveOutcome(track);
chooseOutcome(track,'b');
track.frames.at(-1).notes='Independent B';
track.frames[0].notes='Updated shared setup';
syncActiveOutcome(track);
chooseOutcome(track,'a');
assert.equal(track.frames[2].notes,'Independent A');
assert.equal(track.frames[0].notes,'Updated shared setup');
chooseOutcome(track,'b');
assert.equal(track.frames.at(-1).notes,'Independent B');

const small={version:1,frames:[{name:'Setup',seconds:0,notes:'',objects:[{id:'p',type:'attacker',label:'P',x:300,y:300,rot:0}],paths:{},timing:{}}]};
createOutcomes(small,0,'Carry or pass?','Carry','Pass');
assert.equal(small.frames.length,2);
chooseOutcome(small,'b');
small.frames.at(-1).objects[0].x=420;
chooseOutcome(small,'a');
assert.equal(small.frames.at(-1).objects[0].x,300,'A should not inherit B movement');
assert.equal(branchInfo(small).question,'Carry or pass?');
removeOutcomes(small);
assert.equal(small.branching,undefined);

const clean=playbackData(example);
assert.equal(clean.branching.choices.length,2,'Playback must preserve both outcomes');
assert.equal(clean.branching.markerId,'choice-132');
const paths=outcomeViews(clean);
for(const path of paths){
 assert.equal(path.drill.frames[0].objects.filter(o=>o.type==='defender').length,5);
 const result=renderScene(path.drill,{time:0,runs:true,passes:true,labels:true,decisions:true});
 assert.match(result.svg,/<svg/);
 assert.ok(result.g,'Missing scene geometry');
}
const tackle=paths[1].drill.frames.at(-1).objects.find(o=>o.type==='tackle');
assert.ok(tackle,'Option B needs a tackle');
assert.equal(tackle.members.filter(x=>x.pose==='tackling').length,2);
assert.ok(!paths[0].drill.frames.some(f=>f.objects.some(o=>o.type==='tackle')),'Adult coach option must remain touch-only');

const printed=printMarkup(example);
assert.match(printed,/OPTION A/);
assert.match(printed,/OPTION B/);
assert.match(printed,/Coach carries/);
assert.match(printed,/Coach passes/);
assert.match(printed,/DECISION DRILL/);
const code=await shareCode(example,{decisions:true});
const readBack=await decodeShare(code);
assert.equal(readBack.drill.branching.choices.length,2,'Sharing lost the alternative outcome');

for(const editor of ['index.html','coach/index.html']){
 const page=read(editor);
 for(const id of ['outcomeBar','createOutcomes','outcomeControls','outcomeA','outcomeB','outcomePrompt','outcomeDialog','outcomeSave'])
  assert.ok(page.includes('id="'+id+'"'),editor+' missing '+id);
}
for(const player of ['play.html','coach/play.html']){
 assert.ok(read(player).includes('id="branchChoice"'),player+' missing outcome selector');
}
const exports=read('js/outputs.js');
assert.match(exports,/const chapters=views\.map/,'Movie must have per-outcome chapters');
assert.match(exports,/print-branch-heading/,'Print must separate outcomes');
console.log('Rugby decision branches: independent edits, shared signal, age-appropriate example, SVG scenes, share link, print and both editions — passed.');
