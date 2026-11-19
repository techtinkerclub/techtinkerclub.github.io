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
 assert.equal(merged.length,base.length+1,'New normal drill is published in addition to the existing curated catalogue');
 const newSource=source.find(d=>d.id==='mwut10tackle191126');
 const newPublic=merged.find(d=>d.id==='seed-144');
 assert.ok(newSource&&newPublic,'U10 tackling demo exists in saved and public libraries');
 assert.equal(newPublic.savedFromCoachDrill,newSource.id);
 const {id:_pNew,savedFromCoachDrill:_sNew,publishedAt:_aNew,publishedSourceSavedAt:_tNew,publishedRevision:_rNew,...publishedEditable}=newPublic;
 const {id:_originNew,...editableSource}=newSource;
 assert.deepEqual(publishedEditable,editableSource,'Public tackling drill is identical to editable source, no QA-only features');
 assert.equal(newPublic.frames[0].seconds,0);
 assert.equal(newPublic.category,'Contact');
 assert.equal(newPublic.ageMin,10);
 assert.equal(newPublic.ageMax,10);
 assert.equal(newPublic.length,10);
 assert.equal(newPublic.width,8);
 assert.equal(newPublic.frames.length,7);
 const release=newPublic.frames.find(f=>f.name.startsWith('Release'));
 const presented=release.objects.find(x=>x.type==='ball');
 assert.equal(presented.transferKind,'presentation');
 assert.equal(presented.groundState,'presented');
 assert.equal(presented.ownerId,undefined);
 assert.ok(presented.y>release.objects.find(x=>x.id==='tackle_demo_a1').y,'Ball is presented towards supporting team (larger Y)');
 assert.ok(newPublic.frames.some(f=>f.objects.some(x=>x.type==='tackle'&&x.members?.some(m=>m.pose==='tackling'))),'Authentic editor tackle formation is used');
});
test('unpublish removes the public listing but preserves its original ID for restoration',()=>{
 const next={...data,unpublishedIds:['seed-133']};
 assert.equal(applyPublications(base,next).some(d=>d.id==='seed-133'),false);
 assert.equal(publicationForSource(next,'mwlwflvgp8foni').id,'seed-133');
 assert.equal(isPublished(next,'mwlwflvgp8foni'),false);
});
test('newly published separate version gets own public ID without altering original',()=>{
 const next={...data,drills:[...data.drills,{...structuredClone(data.drills[0]),id:'seed-145',savedFromCoachDrill:'another-version'}]};
 assert.equal(applyPublications(base,next).some(d=>d.id==='seed-145'),true);
 assert.equal(applyPublications(base,next).filter(d=>d.id==='seed-133').length,1);
});


test('old special-case tackling demos are removed from the public QA catalogue',()=>{
 const qa=read('test-drills').drills;
 assert.ok(!qa.some(d=>d.id==='seed-901'||d.id==='seed-903'),'Old QA tackle demonstrations should not reappear');
 assert.ok(qa.length>=10,'Retain the unrelated visual regression test drills');
 assert.ok(qa.some(d=>d.id==='seed-908'),'Unrelated passing QA demo is retained');
 assert.ok(qa.every(d=>d.category==='Test drills'));
});
