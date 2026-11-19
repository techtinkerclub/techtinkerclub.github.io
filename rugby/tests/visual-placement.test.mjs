import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {labelPosition,cartoonLabelPosition} from '../js/symbol-scale.js';
import {cartoonTagIcon,playerAppearance} from '../js/cartoon-players.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const g={scale:40,displayMode:'realistic',margin:44,fw:400,fh:250,
 viewWidth:900,viewHeight:540,rotation:0,toView:(x,y)=>({x,y})};

test('Coach caption is centred on the character, not clamped to an offset training pitch',()=>{
 const coach={type:'coach',x:720,y:220,rot:90,label:'Coach'};
 for(const position of [labelPosition,cartoonLabelPosition]){
  const p=position(coach,g,'standing');
  assert.ok(Math.abs(p.x)<.01,'Coach label must stay directly below its anchor');
  assert.ok(p.y>0,'Coach label should sit below the player away from the viewport edge');
 }
 const nearEdge={type:'coach',x:895,y:220,label:'Coach'};
 assert.ok(cartoonLabelPosition(nearEdge,g,'standing').x<0,'Edge caption stays on screen');
});

test('Ruckus tag strips stay on the illustrated hips and maintain ownership state',()=>{
 const player={type:'attacker',tagBelt:true,tagColor:'red',tags:{left:true,right:true},heldTags:0};
 const both=cartoonTagIcon(player);
 assert.match(both,/class="ruckus-tag-left"/);
 assert.match(both,/class="ruckus-tag-right"/);
 assert.match(both,/x="-12"/);
 assert.match(both,/x="7"/);
 assert.doesNotMatch(both,/x="-20"|x="14"/,'Old sprite-viewport positions were outside the visible body');
 assert.ok(!both.includes('translate(30 -25)'));
 const after=cartoonTagIcon({...player,tags:{left:false,right:true},heldTags:1});
 assert.doesNotMatch(after,/class="ruckus-tag-left"/);
 assert.match(after,/class="ruckus-tag-right"/);
 assert.ok(after.includes('translate(19 -17)'));
 assert.equal(cartoonTagIcon({...player,tagBelt:false}),'');
});

test('Mobile mode button is moved out of the pitch overlay without duplicating it',()=>{
 const js=read('js/mobile-editor.js'),css=read('assets/mobile-editor.css');
 assert.ok(js.includes("const visualMode=document.getElementById('minionMode')"));
 assert.ok(js.includes('const target=mobile?modeHeading:modeHome'));
 assert.ok(js.includes('target.appendChild(visualMode)'));
 assert.ok(js.includes('modeHome.insertBefore(visualMode,modeHome.firstChild)'));
 assert.ok(css.includes('.stage-heading > .mobile-mode-toggle'));
 assert.ok(css.includes('grid-column:2;grid-row:1/span 2;position:static'));
 assert.ok(!css.includes('.field-wrap > .pitch-cartoon-toggle'));
});

test('Classic player appearance remains independent of the Ruckus tag layout',()=>{
 const o={id:'p1',type:'attacker',x:100,y:150,rot:0};
 const src='<circle r="15" fill="#75c9ff"/>';
 const classic=playerAppearance(o,'standing',src,[o],g,null,null,1,{cartoonMode:false});
 assert.doesNotMatch(classic,/ruckus-tag-indicators/);
});
