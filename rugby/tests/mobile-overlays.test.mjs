import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {initMobileEditor} from '../js/mobile-editor.js';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

function cls(){
 const values=new Set();
 return {add:(...v)=>v.forEach(x=>values.add(x)),remove:(...v)=>v.forEach(x=>values.delete(x)),
  contains:x=>values.has(x),toggle:(x,set)=>{const active=set===undefined?!values.has(x):!!set;
   if(active)values.add(x);else values.delete(x);return active;}};
}
function element(tag){
 const el={tag,children:[],parentElement:null,listeners:{},attributes:{},
  classList:cls(),dataset:{},hidden:false,open:false,
  setAttribute(k,v){this.attributes[k]=String(v)},
  addEventListener(k,fn){this.listeners[k]=fn},
  querySelector(k){return k==='summary'?this.summary||null:null},
  querySelectorAll(){return []},
  appendChild(child){return this.insertBefore(child,null)},
  prepend(child){return this.insertBefore(child,this.children[0]||null)},
  insertBefore(child,next){
   if(child.parentElement)child.parentElement.children.splice(child.parentElement.children.indexOf(child),1);
   const i=next?this.children.indexOf(next):-1;
   this.children.splice(i<0?this.children.length:i,0,child);child.parentElement=this;return child;
  },
  get nextSibling(){
   if(!this.parentElement)return null;
   return this.parentElement.children[this.parentElement.children.indexOf(this)+1]||null;
  }
 };
 return el;
}

test('mobile View menu escapes scroll containers and returns on desktop',()=>{
 const previous=globalThis.document,body=element('body'),toolbar=element('toolbar'),
  field=element('field'),heading=element('heading'),boardActions=element('board'),
  inspectorBody=element('inspector'),viewMenu=element('view-menu'),
  mode=element('mode'),sidebar=element('sidebar'),timeline=element('timeline');
 toolbar.appendChild(heading);toolbar.appendChild(boardActions);
 field.appendChild(mode);boardActions.appendChild(viewMenu);
 viewMenu.summary=element('summary');
 timeline.after=()=>{};
 const selectors={
  '.field-wrap':field,'.stage .toolbar':toolbar,'.stage-heading':heading,
  '.board-actions':boardActions,'#inspectorPanel .inspector-body':inspectorBody
 };
 const nodes={timelinePanel:timeline,minionMode:mode,viewMenu,equipmentPanel:sidebar};
 globalThis.document={body,createElement:element,getElementById:k=>nodes[k]||null,
  querySelector:k=>k==='.mobile-camera-controls'
   ?field.children.find(x=>x.className==='mobile-camera-controls')||null
   :selectors[k]||null};
 try{
  const ui=initMobileEditor({enabled:()=>true});
  ui.reset(true);
  assert.equal(viewMenu.parentElement,body,'Options sheet must be portalled to body');
  assert.equal(boardActions.parentElement,inspectorBody,'Editing tools move to Edit sheet');
  assert.equal(mode.parentElement,heading,'View-mode control is in mobile heading');
  const quick=toolbar.children.find(x=>x.className==='mobile-quick-controls');
  assert.ok(quick);
  const camera=quick.children.find(x=>x.className==='mobile-camera-controls');
  assert.ok(camera,'Exactly one mobile camera row is shown outside the pitch');
  assert.equal(field.children.some(x=>x.className==='mobile-camera-controls'),false);
  const trigger=quick.children.find(x=>x.id==='mobileViewOptions');
  assert.ok(trigger);
  trigger.listeners.click();
  assert.equal(viewMenu.open,true);
  viewMenu.listeners.toggle();
  assert.equal(trigger.attributes['aria-expanded'],'true');
  assert.equal(body.children.find(x=>x.id==='mobileViewScrim').hidden,false);
  ui.reset(false);
  assert.equal(viewMenu.parentElement,boardActions);
  assert.equal(boardActions.parentElement,toolbar);
  assert.equal(camera.parentElement,field);
  assert.equal(mode.parentElement,field);
 }finally{globalThis.document=previous}
});

test('mobile action button reuses the desktop context menu and is visible only for a selection',()=>{
 const app=read('js/app.js'),css=read('assets/mobile-editor.css');
 assert.match(app,/touchActions\.hidden=!available/);
 assert.match(app,/openObjectMenu\(\{target:node,clientX:/);
 assert.match(app,/pitch\.addEventListener\('contextmenu',openObjectMenu\)/);
 assert.match(css,/mobile-object-actions:not\(\[hidden\]\)/);
 assert.match(css,/#objectMenu:not\(\[hidden\]\)/);
 assert.match(css,/body\.mobile-workspace #objectMenu button/);
 assert.match(app,/tap the Actions button/);
});

test('View options is an above-pitch scrollable sheet with a tappable backdrop',()=>{
 const css=read('assets/mobile-editor.css'),mobile=read('js/mobile-editor.js');
 assert.match(css,/#viewMenu\[open\]/);
 assert.match(css,/#mobileViewScrim:not\(\[hidden\]\)/);
 assert.match(css,/position:fixed;top:auto!important/);
 assert.match(mobile,/body\.appendChild\(viewMenu\)/);
 assert.match(mobile,/viewScrim\.addEventListener\('click'/);
 assert.match(css,/mobile-quick-controls \.mobile-camera-controls/);
 assert.match(css,/\.inspector-body > \.board-actions/);
 assert.match(css,/\.board-actions \.zoom-tools\{display:none!important\}/);
});
