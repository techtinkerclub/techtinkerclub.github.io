import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {pitchGeometry} from '../js/pitch.js';
import {actionViewport,actionViewportAt,wholeFieldView} from '../js/action-camera.js';
import {renderScene,playbackData} from '../js/scene.js';

const drills=JSON.parse(readFileSync(new URL('../data/drills.json',import.meta.url),'utf8')).drills;
const pick=id=>playbackData(drills.find(d=>d.id===id));
const within=(v,p)=>p.x>=v.x-1e-5&&p.y>=v.y-1e-5&&p.x<=v.x+v.width+1e-5&&p.y<=v.y+v.height+1e-5;

test('framing never changes the underlying physical pitch or object coordinates',()=>{
 const d=pick('seed-057'),unchanged=JSON.stringify(d),g=pitchGeometry(d.length,d.width,'up');
 const v=actionViewport(d,g,4);
 assert(v.width<g.viewWidth&&v.height<g.viewHeight,'Formed ruck should allow closer view');
 for(const id of ['a1','a2','d2','b']){
  const o=d.frames[4].objects.find(x=>x.id===id);
  assert(within(v,g.toView(o.x,o.y)),'Ruck participant or ball outside camera: '+id);
 }
 assert.equal(JSON.stringify(d),unchanged);
});

test('initial framing includes the first moving action and transitions smoothly',()=>{
 const d=pick('seed-057'),g=pitchGeometry(d.length,d.width,'up');
 const start=actionViewport(d,g,0),next=actionViewportAt(d,g,1,0);
 assert.deepEqual(next,start,'Next-step camera at zero must equal prior action view');
 const final=actionViewport(d,g,1);
 assert.deepEqual(actionViewportAt(d,g,1,1),final);
});

test('offside discussion retains wide context; whole-field remains an option',()=>{
 const d=pick('seed-082'),g=pitchGeometry(d.length,d.width,'up');
 const i=d.frames.findIndex(f=>/who waits|wait onside|hold your line/i.test(f.name));
 assert(i>=0);
 const focus=actionViewport(d,g,i);
 for(const id of ['a3','d3']){
  const o=d.frames[i].objects.find(p=>p.id===id);
  assert(within(focus,g.toView(o.x,o.y)),id+' must stay visible in an onside/offside lesson');
 }
 assert.deepEqual(wholeFieldView(g),{x:0,y:0,width:g.viewWidth,height:g.viewHeight});
});

test('presentation and video renderer share the same optional action camera',()=>{
 const d=pick('seed-057'),a=renderScene(d,{index:4,framing:'action'}),b=renderScene(d,{index:4,framing:'field'});
 assert(a.g.viewWidth<b.g.viewWidth);
 assert(a.svg.includes('viewBox="'+a.camera.x+' '+a.camera.y+' '+a.camera.width+' '+a.camera.height+'"'));
 assert.match(b.svg,/viewBox="0 0 /);
 assert.equal(a.frame.name,b.frame.name);
});
