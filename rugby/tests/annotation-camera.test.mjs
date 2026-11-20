import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {annotationCamera,withAnnotationCamera,cameraTextPlacement,bubbleCameraSpace} from '../js/annotation-camera.js';
import {bubbleSVG,compactActionBubbleSVG} from '../js/comic-callouts.js';
import {textLabelSVG} from '../js/text-label.js';
import {playbackData,renderScene} from '../js/scene.js';

const pitch={viewWidth:1000,viewHeight:600,margin:40,fw:920,fh:520};
const focus={x:290,y:180,width:320,height:192};
const g=withAnnotationCamera(pitch,focus);
const showcases=JSON.parse(readFileSync(new URL('../data/u10-match-showcases.json',import.meta.url),'utf8'));
const hero=()=>playbackData(showcases.drills.find(d=>d.id==='seed-970'));

test('follow-camera presentation size shrinks inversely with crop; field geometry stays unchanged',()=>{
 const base=annotationCamera(pitch,{x:0,y:0,width:1000,height:600});
 assert.equal(base.scale,1);
 assert(Math.abs(g.annotationScale-.32)<1e-10);
 assert.equal(g.viewWidth,1000);
 assert.equal(g.fw,920);
 assert.deepEqual(g.annotationViewport,focus);
});

test('authored and automatic speech fit camera without mutating speaker or pitch',()=>{
 const b=bubbleSVG({x:400,y:260,text:'RELEASE',g,comic:true,avoid:[{x:400,y:260,id:'a3'}]});
 const c=compactActionBubbleSVG({x:400,y:260,text:'TACKLE',g,comic:true});
 assert.match(b,/camera-readable-bubble/);
 assert.match(c,/camera-readable-bubble/);
 assert.match(b,/scale\(0\.32\)/);
 assert.match(c,/scale\(0\.32\)/);
 assert.match(b,/RELEASE/);
 assert.match(c,/TACKLE/);
 assert.equal(bubbleCameraSpace(g,30,30)?.hidden,true,'off-camera speaker does not create a giant bubble');
 const box=[];bubbleSVG({x:400,y:260,text:'ON FEET',g,onPlace:r=>box.push(r)});
 assert(box[0].x>=focus.x-1e-8&&box[0].y>=focus.y-1e-8);
 assert(box[0].x+box[0].w<=focus.x+focus.width+1e-8);
 assert(box[0].y+box[0].h<=focus.y+focus.height+1e-8);
});

test('author text shrinks and stays inside visible crop, without moving saved drill positions',()=>{
 const marker={id:'instruction',type:'label',x:300,y:300,label:'SPACE WIDE',textStyle:{fontSize:24,background:true}};
 const html=textLabelSVG(marker,{g,anchor:{x:400,y:260}});
 assert.match(html,/scale\(0\.32\)/);
 assert.match(html,/SPACE WIDE/);
 assert.deepEqual([marker.x,marker.y],[300,300]);
 assert.equal(textLabelSVG(marker,{g,anchor:{x:5,y:5}}),'');
 const p=cameraTextPlacement(g,{x:focus.x+2,y:focus.y+2},180,40);
 assert(p.dx>=0&&p.dy>=0);
});

test('the actual full-pitch U10 showcase has responsive follow labels and score badge',()=>{
 const d=hero(),unchanged=JSON.stringify(d);
 const contact=renderScene(d,{index:4,framing:'follow',cartoonMode:true});
 assert(contact.camera.width<contact.g.fw*1.3,'camera genuinely focuses on action');
 assert.match(contact.svg,/camera-readable-bubble/);
 assert.match(contact.svg,/contact-caption/);
 assert.match(contact.svg,/viewBox="/);
 // The final frame shows the single grounded try, not a second invented score.
 const last=renderScene(d,{index:d.frames.length-1,framing:'follow',cartoonMode:true});
 assert.match(last.svg,/try-score-feedback/);
 assert.match(last.svg,/data-score="1"/);
 assert.equal(JSON.stringify(d),unchanged,'viewing does not edit a saved drill');
});

test('camera override is applied before rendering annotations, in both public board and video renderer',()=>{
 const d=hero();
 const base=renderScene(d,{index:4,framing:'field'});
 const crop={x:200,y:170,width:base.camera.width/3,height:base.camera.height/3};
 const closer=renderScene(d,{index:4,framing:'field',cameraOverride:crop,cartoonMode:true});
 assert.deepEqual(closer.camera,crop);
 assert.match(closer.svg,/camera-readable-bubble/);
 const player=readFileSync(new URL('../js/player.js',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
 const recorder=readFileSync(new URL('../js/video-recorder.js',import.meta.url),'utf8');
 assert.match(player,/cameraOverride=publicBoard\?\.cameraView/);
 assert.match(player,/renderScene\(d,\{\.\.\.opts,time:t,cameraOverride/);
 assert.match(editor,/withAnnotationCamera\(g,/);
 assert.match(editor,/scheduleAnnotationRefresh\(\)/);
 assert.match(recorder,/renderScene\(/);
});
