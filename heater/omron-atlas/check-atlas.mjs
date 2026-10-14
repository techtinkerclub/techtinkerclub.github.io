/* Interactive manual DOM smoke tests. No Omron communications or network writes.
 * Run from repo root after: npm install --no-save jsdom@26
 *    node heater/omron-atlas/check-atlas.mjs
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {JSDOM} from "jsdom";
import {fileURLToPath} from "node:url";
import path from "node:path";
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,"..");
function page(file,url){
 const html=readFileSync(file,"utf8");
 const dom=new JSDOM(html,{url,runScripts:"outside-only"});
 dom.window.scrollTo=()=>{};
 dom.window.Element.prototype.scrollIntoView=()=>{};
 return {dom,document:dom.window.document,html};
}
function click(w,el){assert.ok(el,"Clickable element exists");el.dispatchEvent(new w.MouseEvent("click",{bubbles:true}))}
function change(w,el,value){
 assert.ok(el);el.value=value;el.dispatchEvent(new w.Event("change",{bubbles:true}));
}
function testAtlas(){
 const {dom,document:d,html}=page(path.join(here,"index.html"),"https://techtinker.club/heater/omron-atlas/");
 const data=readFileSync(path.join(here,"atlas-data.js"),"utf8");
 const app=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(app,"Atlas has a browser application");
 dom.window.eval(data);
 const cat=dom.window.OMRON_ATLAS;
 assert.equal(Object.keys(cat.levels).length,10);
 const total=Object.values(cat.levels).reduce((a,x)=>a+x.entries.length,0);
 assert.ok(total>=220,"Broad parameter coverage across setting levels");
 for(const [key,level] of Object.entries(cat.levels)){
  const seen=new Set;
  for(const e of level.entries){
   assert.ok(e.code && e.name && e.why, key+" lacks explanatory data");
   assert.ok(!seen.has(e.id),key+" duplicate node ID");
   seen.add(e.id);
  }
 }
 for(const [key,code] of [
  ["operation","r-r"],["program","d.seg"],["adjustment","wt-b"],
  ["initial","in-t"],["pid","d.pid"],["communications","bps"],
  ["advanced","pf"],["protect","icpt"]
 ])assert.ok(cat.levels[key].entries.some(x=>x.code===code),key+" missing essential parameter "+code);
 dom.window.eval(app[1]);
 assert.equal(d.getElementById("total").textContent,String(total));
 assert.ok(d.getElementById("levelList").querySelectorAll("button").length===10);
 assert.ok(d.getElementById("model").options.length>=60,"Full E5CC variants selectable");
 // MODE navigation has a true deterministic next item.
 click(dom.window,d.querySelector('[data-level="program"]'));
 assert.equal(d.getElementById("lcd").textContent,"d.prg");
 click(dom.window,d.getElementById("modeNext"));
 assert.equal(d.getElementById("lcd").textContent,"s-no");
 // Numbered segment vs programme-wide branch stays explicit.
 change(dom.window,d.getElementById("programBranch"),"end");
 click(dom.window,d.querySelector('[data-entry="program-4"]'));
 assert.equal(d.getElementById("status").textContent,"Conditional display"); // segment SP excluded in END
 click(dom.window,d.querySelector('[data-entry="program-7"]'));
 assert.equal(d.getElementById("status").textContent,"In documented path"); // pid when END
 // Known hardware absences must not masquerade as active.
 click(dom.window,d.querySelector('[data-level="operation"]'));
 click(dom.window,d.querySelector('[data-entry="operation-10"]'));
 assert.equal(d.getElementById("status").textContent,"Hardware unavailable");
 // Per-parameter documented input choices (all 30) are visible.
 click(dom.window,d.querySelector('[data-level="initial"]'));
 const inT=cat.levels.initial.entries.find(x=>x.code==="in-t");
 click(dom.window,d.querySelector('[data-entry="'+inT.id+'"]'));
 assert.equal(d.querySelectorAll("#choiceBox .choice").length,30);
 click(dom.window,d.querySelector('#choiceBox [data-choice="25"]'));
 assert.ok(d.querySelector('#choiceBox [data-choice="25"]').classList.contains("selected"));
 // Search is across levels, not the selected menu.
 const input=d.getElementById("search");
 input.value="wait band";input.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.ok(!d.getElementById("searchResults").hidden);
 assert.ok(d.getElementById("searchResults").textContent.includes("wt-b"));
 // Every item has a full map browse affordance.
 assert.ok(d.querySelectorAll("#allMap .mapGroup").length===10);
 assert.ok(d.querySelectorAll("#allMap [data-map-level]").length>0);
 // Semantics: website makes no USB write claims.
 assert.ok(html.includes("No control or write operation"));
 dom.window.close();
 return total;
}
function testOperator(){
 const {dom,document:d,html}=page(path.join(root,"index.html"),"https://techtinker.club/heater/");
 const script=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(script);
 dom.window.eval(script[1]);
 const sections=d.querySelectorAll("section.view");
 assert.ok(sections.length>=10);
 const wiring=d.querySelector('[data-v="wiring"]');
 click(dom.window,wiring);
 assert.equal(d.querySelector("section.view.active").id,"wiring");
 assert.ok(d.getElementById("electricPath").textContent.includes("Mean Well"));
 click(dom.window,d.querySelector('[data-electric="power"]'));
 assert.ok(d.getElementById("electricPath").textContent.includes("Crydom"));
 assert.ok(d.querySelector('#wiring a[href="./electrical/#schedule"]'));
 assert.ok(d.querySelector('#omron a[href="./omron-atlas/"]'));
 // Cross-section history-aware navigation.
 click(dom.window,d.getElementById("nextChapter"));
 assert.equal(d.querySelector("section.view.active").id,"labels");
 click(dom.window,d.getElementById("prevChapter"));
 assert.equal(d.querySelector("section.view.active").id,"wiring");
 assert.equal(dom.window.location.hash,"#wiring");
 // No duplicated huge SVG electrical drawings on overview page.
 assert.equal(d.querySelectorAll("#wiring svg").length,0);
 dom.window.close();
}
function testProgrammingAndElectricalLinks(){
 const programming=readFileSync(path.join(root,"omron-programming","index.html"),"utf8");
 const electrical=readFileSync(path.join(root,"electrical","index.html"),"utf8");
 assert.ok(programming.includes("../omron-atlas/"));
 assert.ok(electrical.includes("../omron-atlas/"));
 assert.ok(electrical.includes("../#wiring"));
}
const total=testAtlas();testOperator();testProgrammingAndElectricalLinks();
console.log("PASS: "+total+" Omron atlas entries, model filters, MODE navigation, input choices, search, electrical tabs, deep links, and cross-page references.");
