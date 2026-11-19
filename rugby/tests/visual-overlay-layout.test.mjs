import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {labelPosition,cartoonLabelPosition} from '../js/symbol-scale.js';
import {cartoonTagIcon} from '../js/cartoon-players.js';

const g={scale:66.6667,rotation:0,displayMode:'realistic',margin:10,fw:400,fh:250,toView:(x,y)=>({x,y})};
const coach={id:'c',type:'coach',x:170,y:100,rot:0,label:'Coach'};
test('coach labels are centred below the actor across all rotations in both visual modes',()=>{
 for(const rot of [0,90,180,270]){
  const o={...coach,rot},classic=labelPosition(o,g,'standing'),ruckus=cartoonLabelPosition(o,g,'standing');
  assert.equal(classic.x,0);assert.equal(ruckus.x,0);
  assert.ok(classic.y>0);assert.ok(ruckus.y>classic.y);
 }
});
test('coach caption moves above the actor near bottom field edge',()=>{
 const o={...coach,y:230,rot:90};
 assert.ok(labelPosition(o,g,'standing').y<0);
 assert.ok(cartoonLabelPosition(o,g,'standing').y<0);
});
test('Ruckus tag indicators are on hips and hide after a tag is removed',()=>{
 const o={id:'a',type:'attacker',tagBelt:true,tagColor:'red',tags:{left:true,right:true}};
 const both=cartoonTagIcon(o);
 assert.match(both,/ruckus-tag-left/);assert.match(both,/ruckus-tag-right/);
 assert.match(both,/x="-12" y="5"/);assert.match(both,/x="7" y="5"/);
 assert.doesNotMatch(both,/x="-40"|x="33"/);
 o.tags.left=false;
 const after=cartoonTagIcon(o);
 assert.doesNotMatch(after,/ruckus-tag-left/);
 assert.match(after,/ruckus-tag-right/);
});
test('mobile toggle moves into the stage heading, away from the in-pitch camera controls',()=>{
 const css=readFileSync(new URL('../assets/mobile-editor.css',import.meta.url),'utf8');
 const js=readFileSync(new URL('../js/mobile-editor.js',import.meta.url),'utf8');
 assert.match(css,/stage-heading > \\.mobile-mode-toggle/);
 assert.match(css,/position:static/);
 assert.match(js,/const target=mobile\\?modeHeading:modeHome/);
 assert.match(css,/\\.mobile-camera-controls\\s*\\{[^}]*top:7px;right:7px/s);
});
