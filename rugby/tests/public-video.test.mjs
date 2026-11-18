import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('public catalogue offers a multi-drill video builder without editor access',()=>{
 const html=read('library.html'),library=read('js/library.js'),video=read('js/public-video.js');
 assert.match(html,/library\.js\?v=0\.18\.3/);
 assert.match(library,/data-add-video/);
 assert.match(library,/publicVideoBuilder/);
 assert.match(video,/sequenceDrills:stages/);
 assert.match(video,/recordDrill\(stages\[0\]/);
 assert.match(video,/getDrills\(\)\.filter/);
 assert.match(video,/ids\.length>=8/);
 assert.doesNotMatch(video,/githubStore|publish\(|localStorage|fetch\(/);
});
test('Studio and public video builder reuse the same movie settings and recorder',()=>{
 const app=read('js/app.js'),video=read('js/public-video.js'),movie=read('js/movie.js'),progress=read('js/export-progress.js');
 assert.match(app,/bindMovieSettings/);
 assert.match(video,/bindMovieSettings/);
 assert.match(video,/createExportProgress/);
 assert.match(movie,/Video settings<\/legend>/);
 assert.match(progress,/Exporting video/);
});
