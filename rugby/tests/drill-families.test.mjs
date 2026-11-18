import test from 'node:test';
import assert from 'node:assert/strict';
import {familyRoot,familyMembers,publicationState,duplicateTitleGroups,revisionLabel,changedRevision} from '../js/drill-families.js';

const root={id:'original',title:'Hold the line',revision:2};
const variation={id:'variation',title:'Hold the line · sidestep',derivedFrom:{rootId:'original',parentId:'original',kind:'variation'},revision:1};
const extension={id:'extension',title:'Hold the line · continuation',derivedFrom:{rootId:'original',parentId:'variation',kind:'extension'},revision:3};
test('revisions keep identity, variations belong to the root family',()=>{
 assert.equal(familyRoot(root),'original');
 assert.equal(familyRoot(variation),'original');
 assert.equal(familyRoot(extension),'original');
 assert.deepEqual(familyMembers([{d:extension},{d:variation},{d:root}],'original').map(x=>x.d.id).sort(),['extension','original','variation']);
});
test('GitHub saved does not imply curated publication',()=>{
 const published=new Set(['seed-001']);
 assert.equal(publicationState(root,'github',published),'Saved on GitHub · not in curated library');
 assert.equal(publicationState({id:'seed-001'},'seed',published),'Published in coaching library');
 assert.match(publicationState(root,'import',published),/not saved/);
});
test('title duplicates are distinct IDs, not revisions',()=>{
 const groups=duplicateTitleGroups([root,{...root,id:'another',revision:7},variation]);
 assert.deepEqual(groups,[['original','another']]);
 assert.equal(revisionLabel(extension),'Revision 3');
});
test('revision comparison ignores revision and savedAt metadata',()=>{
 const a={...root,savedAt:'2026-11-18T09:00:00Z',frames:[]};
 const b={...a,revision:3,savedAt:'2026-11-18T09:02:00Z'};
 assert.equal(changedRevision(a,b),false);
 assert.equal(changedRevision(a,{...b,title:'Improved title'}),true);
});
