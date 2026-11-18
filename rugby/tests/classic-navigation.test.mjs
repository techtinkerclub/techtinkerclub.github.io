import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('supported Rugby pages do not advertise the retired alternate editor',()=>{
 for(const page of ['index.html','library.html','play.html']){
  const html=read(page);
  assert.doesNotMatch(html,/<a\b[^>]*\bhref=["'][^"']*(?:\/coach\/|coach\/index\.html|coach\/library\.html|coach\/play\.html)/i,page+' must not link to retired pages');
  assert.doesNotMatch(html,/Try Coach Edition|Switch to Coach Edition/i,page+' must not promote retired editor');
 }
});
test('Classic remains the single supported editor with mobile workflow and exports',()=>{
 const html=read('index.html');
 assert.match(html,/src="\.\/js\/app\.js\?v=/);
 assert.match(html,/href="\.\/assets\/mobile-editor\.css\?v=/);
 assert.match(html,/id="save"/);
 assert.match(html,/id="share"/);
 assert.match(html,/href="\.\/library\.html"/);
});
test('readme documents only active rugby entry points',()=>{
 const readme=read('README.md');
 assert.doesNotMatch(readme,/\/rugby\/coach\//i);
 assert.match(readme,/\/rugby\/library\.html/);
 assert.match(readme,/\/rugby\/play\.html/);
});
