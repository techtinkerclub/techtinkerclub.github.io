import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {initMobileEditor} from '../js/mobile-editor.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('both editors load the same mobile and tablet skin without replacing the engine',()=>{
 const classic=read('index.html'),coach=read('coach/index.html'),css=read('assets/mobile-editor.css'),workspace=read('js/workspace.js');
 for(const page of [classic,coach])assert.match(page,/href="\.\/assets\/mobile-editor\.css\?v=0\.1\.1"/);
 assert.match(workspace,/initMobileEditor/);
 assert.match(workspace,/max-width:1100px/);
 assert.match(css,/\.mobile-view-tools #equipmentPanel/);
 assert.match(css,/\.mobile-view-edit #inspectorPanel/);
 assert.match(css,/\.mobile-view-steps:not\(\.presentation-mode\) > \.timeline/);
 assert.match(css,/env\(safe-area-inset-bottom\)/);
 assert.match(css,/body\.mobile-workspace\.presentation-mode/);
 assert.match(css,/min-height:48px/);
 assert.match(css,/mobile-camera-controls/);
 assert.match(css,/body\\.mobile-workspace \\.mobile-workspace-nav\\s*\\{\\s*display:grid/,'Mobile navbar must be visible when editor is active');
 assert.doesNotMatch(css,/body\\.mobile-workspace-nav\\s*\\{/,'Nav is an element, not a body class');
 assert.match(read('js/mobile-editor.js'),/data-mobile-camera="zoomFit"/);
 assert.equal(classic.match(/src="\.\/js\/app\.js\?v=[\d.]+"/)?.[0],coach.match(/src="\.\/js\/app\.js\?v=[\d.]+"/)?.[0]);
});
function classes(){
 const state=new Set();
 return {contains:x=>state.has(x),add:(...xs)=>xs.forEach(x=>state.add(x)),remove:(...xs)=>xs.forEach(x=>state.delete(x)),
  toggle:(x,force)=>{const on=force===undefined?!state.has(x):!!force;if(on)state.add(x);else state.delete(x);return on}};
}
function button(view=null,action=null){
 const label={textContent:''},icon={textContent:''};
 const b={dataset:{},classList:classes(),disabled:false,attrs:{},setAttribute(k,v){this.attrs[k]=v},
  querySelector(k){return k==='[aria-hidden]'?icon:k==='.mobile-command-label'?label:null},
  closest(k){return k==='button'?this:null}};
 if(view)b.dataset.mobileView=view;
 if(action)b.dataset.mobileAction=action;
 return b;
}
test('mobile navigation opens a single existing editing panel and keeps pitch accessible',()=>{
 const prev=globalThis.document;
 const body={classList:classes()};
 const views=['pitch','tools','edit','steps'].map(v=>button(v)),playNav=button(null,'play'),saveNav=button(null,'save');
 const nav={className:'',attrs:{},handlers:{},setAttribute(k,v){this.attrs[k]=v},
  set innerHTML(v){this.markup=v},
  querySelectorAll(q){return q==='[data-mobile-view]'?views:[]},
  querySelector(q){return q.includes('"play"')?playNav:q.includes('"save"')?saveNav:null},
  addEventListener(k,h){this.handlers[k]=h}};
 const timeline={after(el){assert.equal(el,nav)}};
 const sidebar={addEventListener(){}};
 let played=0,saved=0,synced=0;
 const nodes={
  timelinePanel:timeline,equipmentPanel:sidebar,
  play:{textContent:'▶ Play',disabled:false,click(){played++}},
  save:{disabled:false,click(){saved++}},
  saveState:{dataset:{state:'pending'},textContent:'Not saved yet'}
 };
 globalThis.document={body,createElement:()=>nav,getElementById:id=>nodes[id]};
 try{
  const ui=initMobileEditor({enabled:()=>true,sync:()=>{synced++}});
  body.classList.add('mobile-workspace');
  ui.show('tools');
  assert(body.classList.contains('mobile-view-tools'));
  assert(!body.classList.contains('hide-equipment'));
  assert(body.classList.contains('hide-inspector'));
  assert(body.classList.contains('hide-tracks'));
  ui.show('edit');
  assert(body.classList.contains('mobile-view-edit'));
  assert(body.classList.contains('hide-equipment'));
  assert(!body.classList.contains('hide-inspector'));
  ui.show('steps');
  assert(body.classList.contains('mobile-view-steps'));
  assert(!body.classList.contains('hide-tracks'));
  nav.handlers.click({target:views[0]});
  assert(body.classList.contains('mobile-view-pitch'));
  assert(body.classList.contains('hide-inspector'));
  assert(body.classList.contains('hide-equipment'));
  assert(body.classList.contains('hide-tracks'));
  nav.handlers.click({target:playNav});
  nav.handlers.click({target:saveNav});
  assert.equal(played,1);
  assert.equal(saved,1);
  assert(synced>=5);
  ui.reset(false);
  assert(!body.classList.contains('mobile-workspace'));
 }finally{globalThis.document=prev}
});
