import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGithubStore} from '../js/github-store.js';

const read=p=>JSON.parse(readFileSync(new URL('../data/'+p+'.json',import.meta.url),'utf8'));
const real=read('coach-drills').drills.find(d=>d.id==='mwlwflvgp8foni');
function fakeGithub(){
 let counter=1;
 const master={data:{version:1,kind:'rugby-coach-library',drills:[structuredClone(real)]},sha:'sha-work-1'};
 const publicRecords={data:structuredClone(read('published-drills')),sha:'sha-public-1'};
 const fakeResponse=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
 const fetcher=async(url,options={})=>{
  const record=String(url).includes('published-drills.json')?publicRecords:master;
  if(options.method==='PUT'){
   const body=JSON.parse(options.body);
   if(body.sha!==record.sha)return fakeResponse({},409);
   record.data=JSON.parse(Buffer.from(body.content,'base64').toString('utf8'));
   record.sha='sha-updated-'+(++counter);
   return fakeResponse({commit:{sha:counter.toString(16).padStart(40,'0')}});
  }
  return fakeResponse({encoding:'base64',content:Buffer.from(JSON.stringify(record.data),'utf8').toString('base64'),sha:record.sha});
 };
 return {store:createGithubStore(fetcher),master,publicRecords};
}
test('publication is deliberate and stable through saves, updates, unpublishing and republishing',async()=>{
 const {store,master,publicRecords}=fakeGithub();
 await store.connect('github_pat_test_token');
 const initial=structuredClone(master.data.drills[0]);
 await assert.rejects(store.remove(initial.id,initial),/Unpublish this drill/);
 const updated=await store.save({...initial,title:initial.title+' revised'},initial);
 assert.equal(updated.snapshot.revision,(Number(initial.revision)||1)+1);
 assert.notEqual(publicRecords.data.drills.find(d=>d.id==='seed-133').title,updated.snapshot.title,
  'Saving must never silently republish');
 const published=await store.publish(initial.id,updated.snapshot,143);
 assert.equal(published.publicId,'seed-133');
 const record=published.data.drills.find(d=>d.id==='seed-133');
 assert.equal(record.savedFromCoachDrill,initial.id);
 assert.equal(record.publishedRevision,updated.snapshot.revision);
 assert.equal(record.title,updated.snapshot.title);
 await store.unpublish(initial.id);
 assert(publicRecords.data.unpublishedIds.includes('seed-133'));
 const republished=await store.publish(initial.id,updated.snapshot,143);
 assert.equal(republished.publicId,'seed-133');
 assert(!publicRecords.data.unpublishedIds.includes('seed-133'));
 await assert.rejects(store.publish(initial.id,initial,143),/changed/,'An outdated editor must not overwrite publication');
});
test('a new saved drill receives its own public link without replacing the linked family',async()=>{
 const {store}=fakeGithub();await store.connect('github_pat_test_token');
 const fresh={...structuredClone(real),id:'new-drill-1',title:'New defensive variation'};
 const saved=await store.save(fresh,null);
 const out=await store.publish(saved.snapshot.id,saved.snapshot,143);
 assert.equal(out.publicId,'seed-144');
 assert.equal(out.data.drills.find(d=>d.id==='seed-133').savedFromCoachDrill,real.id);
});
