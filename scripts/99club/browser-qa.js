#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const mode=process.argv[2]||'prepare';
const HARNESS=path.join(ROOT,'99club-browser-qa.html');
function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}
function localTags(page,kind){
  const text=read(page),rx=kind==='css'?/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g:/<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/g;
  return [...text.matchAll(rx)].map(m=>m[1]).filter(u=>u.startsWith('/assets/99club/'));
}
function prepare(){
  const css=[...new Set(localTags('_pages/99-club-games-play.md','css'))];
  const js=localTags('_pages/99-club-games-play.md','js');
  const runner=String.raw`
  (function(){
    const report={failures:[],warnings:[],passes:[],games:[]};
    const fail=(area,msg)=>{report.failures.push({area,msg});console.error('QA FAIL',area,msg)};
    const warn=(area,msg)=>{report.warnings.push({area,msg});console.warn('QA WARN',area,msg)};
    const pass=(area,msg)=>report.passes.push({area,msg});
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    function finish(){
      const json=JSON.stringify(report),encoded=btoa(unescape(encodeURIComponent(json)));
      let pre=document.getElementById('qa-result');if(!pre){pre=document.createElement('pre');pre.id='qa-result';document.body.appendChild(pre);}
      pre.textContent=encoded;pre.dataset.status=report.failures.length?'fail':'pass';
      document.documentElement.dataset.qaStatus=pre.dataset.status;
      document.title='99club-browser-qa:'+pre.dataset.status;
    }
    window.addEventListener('error',e=>fail('runtime',e.message||String(e.error||'window error')));
    window.addEventListener('unhandledrejection',e=>fail('runtime','Unhandled rejection: '+String(e.reason||'')));
    async function genericAdapterTests(){
      const P=window.TT99GamesPlay;if(!P){fail('boot','TT99GamesPlay missing');return;}
      const list=P.gameList||[];if(list.length<35)fail('catalogue','Expected at least 35 online games, found '+list.length);else pass('catalogue',list.length+' online games registered');
      const scratch=document.createElement('div');scratch.id='qa-scratch';scratch.style.cssText='position:absolute;left:-10000px;top:0;width:390px;max-width:390px;visibility:hidden;';document.body.appendChild(scratch);
      for(const a of list){
        const item={id:a.id,warnings:[]};report.games.push(item);
        try{
          scratch.className='';scratch.innerHTML='';
          const cfg=a.normalizeConfig?a.normalizeConfig({difficulty:'standard'}):{};
          const puzzle=a.createPuzzle(cfg,'browser-qa:'+a.id+':0');
          if(!puzzle||puzzle.error){fail(a.id,'createPuzzle failed: '+(puzzle&&puzzle.error||'empty puzzle'));continue;}
          if(puzzle.engineId&&puzzle.engineId!==a.id){const m='adapter '+a.id+' returned engineId '+puzzle.engineId;warn('engine-map',m);item.warnings.push(m);}
          let changed=0;
          const view=a.mount(scratch,puzzle,{onChange:()=>changed++,onStatus:()=>{},isPaused:()=>false});
          for(const fn of ['snapshot','restore','emptySnapshot','progress','check','hint','setFinished','destroy'])if(typeof view?.[fn]!=='function')fail(a.id,'missing view contract '+fn+'()');
          if(view){
            const snap=view.snapshot?.();if(snap==null)fail(a.id,'snapshot() returned null/undefined');
            const progress=view.progress?.();if(typeof progress!=='string')fail(a.id,'progress() did not return text');
            const check=view.check?.({silent:true});if(!check||typeof check.complete!=='boolean')fail(a.id,'check() did not return {complete:boolean}');
            const hint=view.hint?.();if(!hint||typeof hint.message!=='string')fail(a.id,'hint() did not return a message');
            view.setFinished?.(true);view.setFinished?.(false);
            const empty=view.emptySnapshot?.();if(empty==null)fail(a.id,'emptySnapshot() returned null/undefined');else view.restore?.(empty);
          }
          const width=scratch.clientWidth||390,overflow=scratch.scrollWidth-width;
          if(overflow>8){const m='mobile-width overflow '+Math.round(overflow)+'px at 390px';warn('mobile-layout',a.id+': '+m);item.warnings.push(m);}
          const tiny=[...scratch.querySelectorAll('button:not([hidden])')].filter(b=>{const r=b.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<28||r.height<28);});
          if(tiny.length){const m=tiny.length+' very small tap target(s) under 28px';warn('tap-target',a.id+': '+m);item.warnings.push(m);}
          view?.destroy?.();pass('adapter',a.id+' mounted and core controls responded');
        }catch(e){fail(a.id,(e&&e.stack)||String(e));}
      }
      scratch.remove();
    }
    async function brokenCalcTest(){
      try{
        const U=window.TT99PlayArithmetic,a=window.TT99GamesPlay?.adapters?.get('brokencalc');
        if(!U||!a){fail('brokencalc','adapter/evaluator missing');return;}
        const v=U.evaluate(['7','+','2','×','5']);if(v!==17)fail('brokencalc','7 + 2 × 5 evaluated as '+v+' instead of 17');
        const host=document.createElement('div');document.body.appendChild(host);const c=a.normalizeConfig({difficulty:'standard'}),p=a.createPuzzle(c,'browser-qa:calc');const view=a.mount(host,p,{onChange:()=>{},onStatus:()=>{},isPaused:()=>false});
        if(host.querySelector('[data-calc-key="("],[data-calc-key=")"]'))fail('brokencalc','bracket keys are visible');else pass('brokencalc','standard precedence active and bracket keys absent');
        view.destroy?.();host.remove();
      }catch(e){fail('brokencalc',(e&&e.stack)||String(e));}
    }
    async function colourFillTest(){
      try{
        const a=window.TT99GamesPlay?.adapters?.get('colourlogic');if(!a)return fail('colourlogic','adapter missing');
        const host=document.createElement('div');host.style.width='390px';document.body.appendChild(host);const c=a.normalizeConfig({difficulty:'easy',layout:'row'}),p=a.createPuzzle(c,'browser-qa:colour');const view=a.mount(host,p,{onChange:()=>{},onStatus:()=>{},isPaused:()=>false});
        const cell=host.querySelector('[data-cl-cell]');cell?.click();await sleep(30);
        if(!cell?.classList.contains('has-colour'))fail('colourlogic','tapping a box did not select a colour');
        else{const bg=getComputedStyle(cell).backgroundColor;if(!bg||bg==='rgb(255, 255, 255)'||bg==='rgba(0, 0, 0, 0)')fail('colourlogic','selected colour did not fill the whole box');else pass('colourlogic','whole-box colour fill verified');}
        view.destroy?.();host.remove();
      }catch(e){fail('colourlogic',(e&&e.stack)||String(e));}
    }
    async function perimeterDirectTest(){
      try{
        const a=window.TT99GamesPlay?.adapters?.get('perimeterregions');if(!a)return fail('perimeterregions','adapter missing');
        const host=document.createElement('div');host.style.width='390px';document.body.appendChild(host);const cfg=a.normalizeConfig({difficulty:'standard'}),p=a.createPuzzle(cfg,'browser-qa:perimeter');let changed=0;const view=a.mount(host,p,{onChange:()=>changed++,onStatus:()=>{},isPaused:()=>false});
        const edge=host.querySelector('[data-edge]');if(!edge){fail('perimeterregions','direct boundary controls are missing');view.destroy?.();host.remove();return;}
        const r=edge.getBoundingClientRect(),evt={bubbles:true,pointerId:31,clientX:r.left+r.width/2,clientY:r.top+r.height/2};
        edge.dispatchEvent(new PointerEvent('pointerdown',evt));edge.dispatchEvent(new PointerEvent('pointerup',evt));await sleep(30);
        if(!view.snapshot().length||changed<1)fail('perimeterregions','tapping a grid line did not draw a boundary');else pass('perimeterregions','direct grid-line boundary interaction verified');
        view.destroy?.();host.remove();
      }catch(e){fail('perimeterregions',(e&&e.stack)||String(e));}
    }
    async function alphameticsVarietyTest(){
      try{
        const a=window.TT99GamesPlay?.adapters?.get('alphametics'),lib=window.TT99AlphaLibrary;if(!a)return fail('alphametics','adapter missing');if(!lib||!Array.isArray(lib.templates)||lib.templates.length<60)return fail('alphametics','full curated word library is not loaded online');
        const cfg=a.normalizeConfig({difficulty:'standard',hintLevel:'auto',theme:'auto',template:'auto'}),seen=new Set();for(let i=0;i<14;i++){const p=a.createPuzzle(cfg,'browser-qa:alpha:'+i);seen.add(p.templateId);}
        if(seen.size<5)fail('alphametics','New puzzle seeds are not producing enough word-puzzle variety ('+seen.size+' distinct)');else pass('alphametics','full library loaded and '+seen.size+' standard puzzles sampled');
      }catch(e){fail('alphametics',(e&&e.stack)||String(e));}
    }
    async function groupedLibraryTest(){
      try{
        const open=document.getElementById('tt99-play-change-game'),search=document.getElementById('tt99-play-library-search'),grid=document.getElementById('tt99-play-library-grid');
        if(!open||!search||!grid)return fail('grouped-library','library controls missing');
        open.click();await sleep(80);
        let groups=[...grid.querySelectorAll('.tt99-play-library-group')];
        if(groups.length<6)fail('grouped-library','expected six grouped sections, found '+groups.length);
        search.value='Perimeter Regions';search.dispatchEvent(new Event('input',{bubbles:true}));await sleep(100);
        const card=grid.querySelector('[data-game-id="perimeterregions"]'),parent=card?.closest('.tt99-play-library-group');
        if(!card)fail('grouped-library','search did not retain Perimeter Regions');
        else if(!parent?.open)fail('grouped-library','search result group did not open automatically');
        else pass('grouped-library','accordion groups and cross-group search verified');
        search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));await sleep(60);
      }catch(e){fail('grouped-library',(e&&e.stack)||String(e));}
    }
    async function drawerTest(){
      try{
        const P=window.TT99GamesPlay,a=P?.adapters?.get('numberwheels'),board=document.getElementById('tt99-play-board');if(!a||!board)return fail('mobile-drawer','Number Connections adapter or board missing');
        board.innerHTML='';board.className='';const c=a.normalizeConfig({difficulty:'challenge',style:'factor',itemCount:'6'}),p=a.createPuzzle(c,'browser-qa:drawer');const view=a.mount(board,p,{onChange:()=>{},onStatus:()=>{},isPaused:()=>false});
        await sleep(60);const entries=[...board.querySelectorAll('[data-conn-entry]')],pad=board.querySelector('.tt99-wave184-keypad,.tt99-wave186-keypad,.tt99-v196-keypad');
        if(entries.length<2||!pad){fail('mobile-drawer','long Factor Web did not expose entries/keypad');view.destroy?.();return;}
        entries[0].click();await sleep(120);
        if(!pad.classList.contains('tt99-context-pad-active'))fail('mobile-drawer','drawer did not open for a distant answer box');
        entries[1].click();await sleep(80);
        if(!pad.classList.contains('tt99-context-pad-active'))fail('mobile-drawer','drawer closed when moving to another fillable box');
        const handle=pad.querySelector('.tt99-context-pad-handle');if(!handle)fail('mobile-drawer','drawer handle missing');else{handle.click();await sleep(30);if(!pad.classList.contains('tt99-context-pad-collapsed'))fail('mobile-drawer','handle did not collapse drawer');handle.click();await sleep(30);if(pad.classList.contains('tt99-context-pad-collapsed'))fail('mobile-drawer','handle did not reopen drawer');}
        const outside=board.querySelector('.tt99-conn-card header')||document.body;outside.click();await sleep(40);if(pad.classList.contains('tt99-context-pad-active'))fail('mobile-drawer','outside tap did not dismiss drawer');else pass('mobile-drawer','open, persist, collapse, reopen and dismiss behaviours verified');
        view.destroy?.();
      }catch(e){fail('mobile-drawer',(e&&e.stack)||String(e));}
    }
    async function run(){
      try{await sleep(500);await genericAdapterTests();await brokenCalcTest();await colourFillTest();await perimeterDirectTest();await alphameticsVarietyTest();await groupedLibraryTest();await drawerTest();}
      catch(e){fail('runner',(e&&e.stack)||String(e));}
      finally{finish();}
    }
    if(document.readyState==='complete')run();else window.addEventListener('load',run,{once:true});
  })();`;
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>99club-browser-qa:running</title>${css.map(u=>`<link rel="stylesheet" href="${u}">`).join('\n')}<style>body{margin:0}#qa-result{white-space:pre-wrap}</style></head><body><div id="tt99-play-root"></div>${js.map(u=>`<script src="${u}"></script>`).join('\n')}<script>${runner}<\/script></body></html>`;
  fs.writeFileSync(HARNESS,html);console.log('Prepared '+path.basename(HARNESS)+' with '+js.length+' scripts and '+css.length+' stylesheets.');
}
function check(file){
  const dom=fs.readFileSync(file,'utf8'),m=dom.match(/<pre[^>]*id=["']qa-result["'][^>]*>([A-Za-z0-9+/=]+)<\/pre>/i);
  if(!m){console.error('Browser QA result marker not found.');process.exit(1);}
  const report=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));
  fs.writeFileSync(path.join(ROOT,'99club-browser-qa-report.json'),JSON.stringify(report,null,2)+'\n');
  for(const x of report.warnings||[])console.warn('WARN ['+x.area+'] '+x.msg);
  for(const x of report.failures||[])console.error('FAIL ['+x.area+'] '+x.msg);
  console.log(`Browser QA: ${(report.failures||[]).length} failure(s), ${(report.warnings||[]).length} warning(s), ${(report.games||[]).length} game adapters exercised.`);
  if(report.failures?.length)process.exit(1);
}
if(mode==='prepare')prepare();else if(mode==='check')check(process.argv[3]);else{console.error('Usage: browser-qa.js prepare | check <dumped-dom-file>');process.exit(2);}
