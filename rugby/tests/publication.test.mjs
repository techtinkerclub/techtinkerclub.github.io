import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyPublications,validatePublications,publicationForSource,isPublished} from '../js/publication.js';
const read=p=>JSON.parse(readFileSync(new URL('../data/'+p+'.json',import.meta.url),'utf8'));
const base=read('drills').drills,source=read('coach-drills').drills,data=validatePublications(read('published-drills'));
test('retroactive publishing preserves two existing public URLs and current source data',()=>{
 const expected=[['seed-133','mwlwflvgp8foni'],['seed-143','mwlws9j9rth2wb']];
 const merged=applyPublications(base,data);
 for(const [publicId,sourceId] of expected){
  const published=merged.find(d=>d.id===publicId),original=source.find(d=>d.id===sourceId);
  assert.ok(published&&original);
  assert.equal(published.savedFromCoachDrill,sourceId);
  const {id:_p,savedFromCoachDrill:_s,publishedAt:_a,publishedSourceSavedAt:_t,publishedRevision:_r,...unwrapped}=published;
  const {id:_originalId,savedFromCoachDrill:_legacySource,...authored}=original;
  assert.deepEqual(unwrapped,authored,'Publication must not invent any uneditable drill features');
  assert.equal(published.publishedSourceSavedAt,original.savedAt);
 }
 assert.equal(merged.length,base.length);
});
test('unpublish removes the public listing but preserves its original ID for restoration',()=>{
 const next={...data,unpublishedIds:['seed-133']};
 assert.equal(applyPublications(base,next).some(d=>d.id==='seed-133'),false);
 assert.equal(publicationForSource(next,'mwlwflvgp8foni').id,'seed-133');
 assert.equal(isPublished(next,'mwlwflvgp8foni'),false);
});
test('newly published separate version gets own public ID without altering original',()=>{
 const next={...data,drills:[...data.drills,{...structuredClone(data.drills[0]),id:'seed-144',savedFromCoachDrill:'another-version'}]};
 assert.equal(applyPublications(base,next).some(d=>d.id==='seed-144'),true);
 assert.equal(applyPublications(base,next).filter(d=>d.id==='seed-133').length,1);
});
