import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pitchGeometry} from '../js/pitch.js';
import {tryLineEvents} from '../js/try-scoring.js';
import {playbackData,renderScene} from '../js/scene.js';
const load=p=>JSON.parse(readFileSync(new URL('../data/'+p,import.meta.url),'utf8'));
const origin=load('drills.json').drills.find(x=>x.id==='seed-020');
const editor=load('coach-drills.json').drills.find(x=>x.id==='u10-3v2-overload-to-try-v1');
const publicDrill=load('published-drills.json').drills.find(x=>x.id==='seed-923');
const person=(f,id)=>f?.objects?.find(x=>x.id===id);
test('original 3 vs 2 overload starter remains intact; derivative reuses its five players and passes',()=>{
 assert(origin&&editor&&publicDrill,'Original, editable and published copies must exist');
 assert.equal(origin.title,'3 vs 2 Overload');
 assert.equal(origin.frames.length,5,'Do not rewrite the older starter');
 assert(!origin.frames.some(f=>f.objects.some(x=>x.type==='tryLine')));
 assert.equal(editor.frames.length,7);
 assert.deepEqual(editor.frames,publicDrill.frames);
 assert.equal(publicDrill.savedFromCoachDrill,editor.id);
 assert.equal(editor.ageMin,10);assert.equal(editor.ageMax,10);
 assert.equal(editor.length,20);assert.equal(editor.width,18);
 for(const id of ['o0','o1','o2','o3','o4','o5']){
  assert.deepEqual(person(editor.frames[0],id),person(origin.frames[0],id),
   'Starting roster and ball should be cloned from the real 3 vs 2 source: '+id);
 }
 assert.equal(person(editor.frames[2],'o5').ownerId,'o1');
 assert.equal(person(editor.frames[3],'o5').ownerId,'o2');
 assert.equal(person(editor.frames[2],'o5').transferKind,'pass');
 assert.equal(person(editor.frames[3],'o5').transferKind,'pass');
 assert(person(editor.frames[2],'o1').y>person(editor.frames[2],'o0').y,
  'First pass must go to supporting attacker positioned behind the carrier');
 assert(person(editor.frames[3],'o2').y>person(editor.frames[3],'o1').y,
  'Second pass must be backward, not forward');
});
test('the try line points toward in-goal and grounds in a DISTINCT later step',()=>{
 const frames=editor.frames;
 for(const f of frames){
  const lines=f.objects.filter(o=>o.type==='tryLine');
  assert.equal(lines.length,1,'Every step must show the same try line');
  assert.equal(lines[0].id,'try923line');
  assert.equal(lines[0].diagram.scoringSide,'negative');
 }
 assert.match(frames[4].notes,/NO try yet/);
 assert(!frames[4].tryGroundings?.length,'Crossing step must not award a try');
 assert.equal(frames[5].tryGroundings[0].actorId,'o2');
 assert.equal(frames[5].tryGroundings[0].at,.65);
 assert.equal(frames[5].objects.find(o=>o.type==='ball').ownerId,'o2');
 const events=tryLineEvents(editor,pitchGeometry(editor.length,editor.width,'up'));
 assert.equal(events.length,1,'Exactly one try for legal attacking entry + grounding');
 assert.equal(events[0].actorId,'o2');
 assert.equal(events[0].step,5);
 assert(events[0].time>8.5&&events[0].time<9.5);
});
test('published normal and Ruckus playback shows no TRY at crossing and one after grounding',()=>{
 const scene=playbackData(publicDrill);
 assert.equal(scene.frames[5].tryGroundings[0].actorId,'o2');
 const noTry=renderScene(scene,{time:8.5,cartoonMode:false}).svg;
 assert.doesNotMatch(noTry,/try-score-feedback/);
 const result=renderScene(scene,{time:9.5,cartoonMode:true}).svg;
 assert.match(result,/try-score-feedback/);
 assert.match(result,/TRY!/);
});
test('coaching literature is complete and linked to current, primary rugby guidance',()=>{
 const fields=['title','objective','safety','minutes','players','equipment','instructions','coaching',
  'regression','progression','questions','notes','provenance','review'];
 for(const key of fields){
  const value=editor[key];
  if(key==='minutes')assert(Number.isFinite(value)&&value>=5&&value<=30,'Missing sensible duration');
  else assert(value!==undefined&&String(value).trim().length>=3,'Missing '+key);
 }
 for(const f of editor.frames)assert(f.notes?.length>=65,'Step needs useful coaching narration: '+f.name);
 assert(editor.instructions.includes('A1')&&editor.instructions.includes('A2')&&editor.instructions.includes('A3'));
 assert.match(editor.safety,/non-contact/i);
 assert.match(editor.coaching,/ground/i);
 assert.match(editor.questions,/cross/i);
 assert.match(editor.provenance,/seed-020/);
 const urls=(editor.links||[]).map(x=>x.url);
 assert(urls.some(x=>/englandrugby\.com.*appendix-4-u10-rules-of-play/.test(x)));
 assert(urls.some(x=>/passport\.world\.rugby.*8-scoring/.test(x)));
 assert(urls.some(x=>/passport\.world\.rugby.*21-in-goal/.test(x)));
 assert(urls.some(x=>/coaching-through-games/.test(x)));
 assert.deepEqual(editor.links,publicDrill.links);
});
test('Blackboard Add panel mirrors supported live editor icons and excludes deprecated tools',()=>{
 const board=readFileSync(new URL('../js/blackboard.js',import.meta.url),'utf8');
 assert.match(board,/nativePalette=\$\('palette'\)/);
 assert.match(board,/nativePalette\.querySelectorAll\('\.group'\)/);
 assert.match(board,/\$\('rugbyPalette'\)\?\.querySelectorAll\('button\[data-type\]'\)/);
 assert.match(board,/const clone=native\.cloneNode\(true\)/);
 assert.match(board,/clone\.removeAttribute\('data-type'\);clone\.dataset\.bbAdd=native\.dataset\.type/);
 assert(!board.includes("['palette','rugbyPalette','legacyPalette']"),
  'Do not duplicate legacy diagram controls or expose unsupported palette items');
 assert.match(board,/document\.querySelector\('#palette \[data-type=/);
 assert.match(board,/if\(!original\)original=document\.querySelector\('#rugbyPalette/);
});
