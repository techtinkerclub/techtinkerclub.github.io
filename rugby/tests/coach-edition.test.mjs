import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const classic=read('index.html'),coach=read('coach/index.html'),guide=read('coach/coach.js');
const css=read('coach/coach.css'),play=read('coach/play.html'),library=read('coach/library.html');
const store=read('js/github-store.js');
const classicEngine=classic.match(/src="\.\/js\/app\.js\?v=[\d.]+"/)?.[0];
const coachEngine=coach.match(/src="\.\/js\/app\.js\?v=[\d.]+"/)?.[0];
assert(classicEngine&&coachEngine);
assert.equal(classicEngine,coachEngine,'Coach and Classic must use exactly the same animation/editor engine');
assert.match(coach,/<base href="\.\.\/"/);
assert.match(coach,/src="\.\/coach\/coach\.js\?v=0\.3\.0"/);
assert.match(coach,/href="\.\/coach\/coach\.css\?v=0\.2\.0"/);
assert.match(classic,/href="\.\/coach\/"/,'Classic must link to the new experiment');
assert.match(coach,/href="\.\/index\.html"/,'New experiment must link back to Classic');
assert.match(coach,/href="\.\/coach\/library\.html"/);
for(const id of ['coachJourney','coachStart','coachActions','coachSequence','coachNotes','coachShare','coachMode','coachWelcome','coachActionDialog','coachActionCards','coachActionHelp','coachToast','coachObjectChoice','coachUseObject','coachSelectionHelp']){
 assert(coach.includes('id="'+id+'"'),'Missing guide UI: '+id);
}
const ids=[...coach.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Every ID in the shared editor and guide must be unique');
assert.match(guide,/classList\.add\('coach-edition','coach-guided'\)/);
assert.match(guide,/function doAction\(key\)/);
assert.match(guide,/case 'padRuck'/);
assert.match(guide,/case 'nextBall'/);
assert.match(guide,/case 'members'/);
assert.match(guide,/case 'twoTeams'/);
assert.match(guide,/case 'threeVTwo'/);
assert.match(guide,/case 'attach'/);
assert.match(guide,/function guidePreflight\(key\)/);
assert.match(guide,/pendingAction=key/,'The guide remembers the action that needs a player or coach');
assert.match(guide,/resume==='move'/,'Selecting a player resumes run creation');
assert.match(guide,/resume==='whistle'/,'Selecting a coach resumes the whistle action');
assert.match(guide,/if\(guidePreflight\(key\)\)return;/);
assert.match(guide,/closeDialogs\(\);\s*let done=/,'Close guide before calling original edit handlers');
assert.match(guide,/picker\.dispatchEvent\(new Event\('change'/,'Picker must use existing object-selection handler');
assert.match(guide,/case 'notes'/);
assert.match(guide,/case 'check'/);
assert.match(guide,/case 'save'/);
assert.match(guide,/case 'outcome'/);
assert.match(guide,/case 'fieldLine'/);
assert.match(guide,/case 'whistle'/);
assert.match(coach,/id="outcomeBar"/);
assert.match(guide,/rugbyCoachEditionAllTools/);
assert.match(css,/--coach-red:#a4223a/);
assert.match(css,/\.coach-object-bar/);
assert.match(css,/body\.coach-guided/);
assert.match(css,/body\.coach-edition > header::before/);
assert.match(store,/\/contents\/rugby\/data\/coach-drills\.json/,'Both editors use the same central GitHub drill library');
for(const [name,page] of [['play',play],['library',library]]){
 assert(!page.includes('<base href='),name+' must resolve relative local share links');
 assert.match(page,/src="\.\.\/js\//,name+' must use the existing renderer');
 assert.match(page,/href="\.\/coach-pages\.css\?v=0\.1\.0"/,name+' must share the Harbury-inspired visual theme');
}
console.log('Coach Edition: same engine, same GitHub library, full editor preserved, actionable guide and themed share pages — passed.');
