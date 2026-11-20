import test from 'node:test';
import {readFileSync} from 'node:fs';
// Temporary diagnostic to locate the ORIGINAL 3v2 overload in the large
// starter catalogue before replacing this file with permanent regression tests.
test('identify existing overload source for editing-safe try variant',()=>{
 const catalogue=JSON.parse(readFileSync(new URL('../data/drills.json',import.meta.url),'utf8'));
 const drills=catalogue.drills||[];
 const matches=drills.filter(d=>/overload|3\s*(?:v|vs|against)\s*2|three.{0,20}two/i.test(
  [d.title,d.objective,d.id,d.instructions].join(' ')));
 console.log('OVERLOAD_DISCOVERY_COUNT '+matches.length+' total='+drills.length);
 console.log('OVERLOAD_DISCOVERY_TITLES '+JSON.stringify(matches.map(d=>({id:d.id,title:d.title,age:d.age,category:d.category,frames:d.frames?.length}))));
 const best=matches.filter(d=>/overload|3\s*(?:v|vs)\s*2/i.test(d.title)).slice(0,3);
 for(const d of best){
  const data={...d,frames:d.frames.map(f=>({...f,objects:f.objects.map(o=>({...o})),paths:f.paths||{},timing:f.timing||{}}))};
  console.log('OVERLOAD_SOURCE_JSON '+JSON.stringify(data));
 }
});
