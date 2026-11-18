import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {movieStoryboard,storyboardClip,storyboardTime} from '../js/movie-storyboard.js';
import {playbackData,renderScene,drillDuration} from '../js/scene.js';
import {movieOptions,movieSettingsMarkup} from '../js/movie.js';
import {outcomeViews} from '../js/branching.js';

const file=JSON.parse(readFileSync(new URL('../data/drills.json',import.meta.url),'utf8'));
const get=id=>file.drills.find(x=>x.id===id);
test('the line reaction drill starts the progression without any contact or invented ball movement',()=>{
 const lead=get('seed-143'),next=get('seed-133');
 assert(lead&&next,'Both linked stages must be in the public library');
 assert.equal(lead.frames[0].objects.filter(x=>x.type==='defender').length,6);
 assert(lead.frames[1].signal?.kind==='whistle','The actual movement must carry the whistle cue');
 const initial=lead.frames[0].objects.filter(o=>o.type==='defender');
 const moving=lead.frames[1].objects.filter(o=>o.type==='defender');
 assert.deepEqual(initial.map(o=>o.x),moving.map(o=>o.x));
 assert(moving.every((o,i)=>Math.abs(o.y-initial[i].y-95)<1e-7),'All six advance by the same two-metre increment');
 assert(moving.every(o=>lead.frames[1].timing[o.id]?.start===0),'All move on the same signal');
 assert(!lead.frames.some(f=>f.objects.some(o=>['ruck','tackle'].includes(o.type))),'Intro must remain non-contact');
 assert.deepEqual(initial.map(o=>[o.x,o.y]),next.frames[0].objects.filter(o=>o.type==='defender').map(o=>[o.x,o.y]),
  'Both stages start from the identical defensive lineup');
});
test('decision movies pause at the actual decision and explain each option before it moves',()=>{
 const d=playbackData(get('seed-133')),story=movieStoryboard(d,{mode:'single'});
 const types=story.clips.map(x=>x.kind);
 assert.deepEqual(types,['intro','motion','decision','choice','motion','choice','motion']);
 assert.equal(story.clips.filter(x=>x.kind==='decision').length,1);
 assert.equal(story.clips.filter(x=>x.kind==='choice').length,2);
 assert.match(story.clips.find(x=>x.kind==='decision').why,/line advances/i);
 assert.match(story.clips.find(x=>x.kind==='decision').watch,/six defenders/i);
 for(const choice of story.clips.filter(x=>x.kind==='choice')){
  assert(choice.body.length>=50,'Both outcomes should have authored explanations');
  assert(choice.watch.length>=50,'Both outcomes should tell the viewer what to notice');
  assert.equal(choice.at,drillDuration({...d,frames:d.frames.slice(0,d.branching.fork+1)}));
 }
 const second=story.clips.filter(x=>x.kind==='choice')[1];
 assert.equal(storyboardClip(story,second.start+1).heading,second.heading);
 assert.equal(storyboardTime(second,second.start+1),second.at,'The pitch must stop during a pause card');
 assert(story.clips.at(-1).end<=360);
});
test('selected-only and slow replay are explicit; descriptions survive playback serialisation',()=>{
 const raw=get('seed-133'),safe=playbackData(raw);
 assert.equal(safe.branching.choices[0].explanation,raw.branching.choices[0].explanation);
 assert.equal(safe.branching.choices[1].watchFor,raw.branching.choices[1].watchFor);
 assert.equal(safe.branching.context,raw.branching.context);
 const only=movieStoryboard(safe,{mode:'single',branchMode:'selected'});
 assert.equal(only.clips.filter(x=>x.kind==='choice').length,1);
 const slow=movieStoryboard(safe,{mode:'dual',replaySpeed:.5});
 assert(slow.clips.filter(x=>x.kind==='motion'&&x.pass==='replay').length>=2);
 const a=outcomeViews(safe)[0].drill;
 assert.equal(a.branching,undefined);
 const source=JSON.stringify(safe);
 movieStoryboard(safe,{mode:'single'});
 assert.equal(JSON.stringify(safe),source,'A video timeline must never edit the saved drill');
});
test('multiple drills form independent labelled chapters in the chosen order',()=>{
 const first=playbackData(get('seed-143')),second=playbackData(get('seed-133'));
 const story=movieStoryboard([first,second],{mode:'single'});
 assert.equal(story.clips[0].title,first.title);
 assert.equal(story.clips[0].stage,'STAGE 1 / 2');
 const next=story.clips.find(x=>x.index===1);
 assert.equal(next.kind,'intro','Second drill must reset on its own explanatory still');
 assert.equal(next.stage,'STAGE 2 / 2');
 assert(story.clips.filter(x=>x.kind==='choice').length===2);
 assert(story.clips[0].start===0);
 for(let i=1;i<story.clips.length;i++)assert.equal(story.clips[i].start,story.clips[i-1].end);
 assert(movieOptions({pauseCards:false}).pauseCards===false);
 assert.match(movieSettingsMarkup('movie'),/Decision pause/);
 const svg=renderScene(first,{index:1}).svg;
 assert.match(svg,/<svg/);
});
