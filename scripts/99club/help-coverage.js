#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const reportPath=path.join(ROOT,'99club-browser-qa-report.json');
if(!fs.existsSync(reportPath)){console.error('Browser QA report is missing.');process.exit(1);}
const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
const runtime=[...new Set((report.games||[]).map(x=>x.id).filter(Boolean))].sort();
const help=fs.readFileSync(path.join(ROOT,'assets/99club/games-help-guides.js'),'utf8');
const guides=[...help.matchAll(/\{id:'([^']+)'[^\n]*title:'([^']*)'/g)].filter(m=>m[2]&&!m[1].includes('placeholder')).map(m=>m[1]);
const guideSet=new Set(guides),runtimeSet=new Set(runtime);
const missing=runtime.filter(id=>!guideSet.has(id));
const orphan=guides.filter(id=>!runtimeSet.has(id));
const page=fs.readFileSync(path.join(ROOT,'_pages/99-club-games-help.md'),'utf8');
const stated=Number((page.match(/covers all <strong>(\d+) current one-player games<\/strong>/)||[])[1]||0);
if(missing.length)console.error('Missing one-page guides for runtime games: '+missing.join(', '));
if(orphan.length)console.warn('Guides without an online runtime adapter: '+orphan.join(', '));
if(stated!==runtime.length)console.error(`Help page says ${stated} games but runtime registered ${runtime.length}.`);
console.log(`Help coverage: ${guides.length} visible guides, ${runtime.length} runtime games.`);
if(missing.length||stated!==runtime.length)process.exit(1);
