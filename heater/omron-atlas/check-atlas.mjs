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
 assert.ok(el);if(el.type==="checkbox")el.checked=Boolean(value);else el.value=value;el.dispatchEvent(new w.Event("change",{bubbles:true}));
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
 // Start with likely settings, not the reference-only catalogue.
 assert.equal(d.getElementById("showSkipped").checked,false);
 assert.equal(d.getElementById("sequenceDetails").open,false);
 assert.equal(d.getElementById("mapDetails").open,false);
 assert.equal(d.getElementById("extraConfig").open,false);
 assert.equal(d.getElementById("levelSelect").options.length,10);
 // The most common settings are one tap away without browsing 10 menus.
 assert.equal(d.querySelectorAll(".quickFind button").length,5);
 click(dom.window,d.querySelector('[data-quick-code="wt-b"]'));
 assert.equal(d.getElementById("lcd").textContent,"wt-b");
 assert.equal(d.getElementById("showSkipped").checked,false);
 // MODE navigation has a true deterministic next item.
 click(dom.window,d.querySelector('[data-level="program"]'));
 assert.equal(d.getElementById("lcd").textContent,"d.prg");
 click(dom.window,d.getElementById("modeNext"));
 assert.equal(d.getElementById("lcd").textContent,"s-no");
 // Numbered segment vs programme-wide branch stays explicit.
 change(dom.window,d.getElementById("programBranch"),"end");
 assert.equal(d.querySelector('#sequence [data-entry="program-4"]'),null,"conditional segment SP hidden by default");
 change(dom.window,d.getElementById("showSkipped"),true);
 click(dom.window,d.querySelector('#sequence [data-entry="program-4"]'));
 assert.equal(d.getElementById("status").textContent,"May be hidden"); // segment SP excluded in END
 click(dom.window,d.querySelector('#sequence [data-entry="program-7"]'));
 assert.equal(d.getElementById("status").textContent,"Likely visible"); // pid when END
 // Known hardware absences must not masquerade as active.
 click(dom.window,d.querySelector('[data-level="operation"]'));
 click(dom.window,d.querySelector('#sequence [data-entry="operation-10"]'));
 assert.equal(d.getElementById("status").textContent,"Not fitted / unavailable");
 change(dom.window,d.getElementById("showSkipped"),false);
 assert.ok(d.querySelector('#sequence [data-entry="operation-10"]'),"selected hidden item remains inspectable");
 click(dom.window,d.getElementById("showAll"));
 assert.equal(d.getElementById("sequenceDetails").open,true);
 // Per-parameter documented input choices (all 30) are visible.
 change(dom.window,d.getElementById("levelSelect"),"initial");
 assert.equal(d.getElementById("lcd").textContent,"in-t");
 const inT=cat.levels.initial.entries.find(x=>x.code==="in-t");
 click(dom.window,d.querySelector('#sequence [data-entry="'+inT.id+'"]'));
 assert.equal(d.querySelectorAll("#choiceBox .choice").length,30);
 click(dom.window,d.querySelector('#choiceBox [data-choice="25"]'));
 assert.ok(d.querySelector('#choiceBox [data-choice="25"]').classList.contains("selected"));
 // Search is across levels, not the selected menu.
 const input=d.getElementById("search");
 input.value="wait band";input.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.ok(!d.getElementById("searchResults").hidden);
 assert.ok(d.getElementById("searchResults").textContent.includes("wt-b"));
 // Every item has a full map browse affordance.
 assert.ok(d.querySelectorAll("#levelTopology [data-top-level]").length>=10);
 click(dom.window,d.querySelector('#levelTopology [data-top-level="advanced"]'));
 assert.equal(d.getElementById("levelHeading").textContent,"Advanced function setting level");
 assert.ok(d.getElementById("modePath").textContent.includes("MODE"));
 assert.ok(d.querySelectorAll("#allMap .mapGroup").length===10);
 assert.ok(d.querySelectorAll("#allMap [data-map-level]").length>0);
 // Searching for a hidden CT should still open that reference without switching on Show hidden.
 const hidden=d.getElementById("showSkipped");
 hidden.checked=false;hidden.dispatchEvent(new dom.window.Event("change",{bubbles:true}));
 input.value="heater current";input.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 const firstHit=d.querySelector('[data-hit^="operation-"]');
 assert.ok(firstHit);click(dom.window,firstHit);
 assert.equal(hidden.checked,false);
 assert.ok(d.getElementById("lcd").textContent.length>0);
 // Semantics: website makes no USB write claims.
 assert.ok(html.includes("This map does not connect to or change the Omron"));
 dom.window.close();
 return total;
}
function testOperator(){
 const {dom,document:d,html}=page(path.join(root,"index.html"),"https://techtinker.club/heater/");
 const script=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(script,"Operator manual contains its navigation script");
 dom.window.eval(script[1]);
 const sections=d.querySelectorAll("section.view");
 assert.ok(sections.length>=10,"All operator chapters are present");
 click(dom.window,d.querySelector('[data-v="wiring"]'));
 assert.equal(d.querySelector("section.view.active").id,"wiring");
 assert.ok(d.querySelector('#wiring a[href="./electrical/#understand"]'),"Electrical overview is linked");
 assert.ok(d.querySelector('#wiring a[href="./electrical/diagrams/"]'),"Current electrical drawings are linked");
 assert.ok(d.querySelector('#omron a[href="./omron-atlas/"]'),"Omron atlas is linked");
 click(dom.window,d.getElementById("nextChapter"));
 assert.equal(d.querySelector("section.view.active").id,"labels");
 click(dom.window,d.getElementById("prevChapter"));
 assert.equal(d.querySelector("section.view.active").id,"wiring");
 assert.equal(dom.window.location.hash,"#wiring");
 click(dom.window,d.querySelector('.navbtn[data-v="front"]'));
 assert.equal(d.querySelectorAll("#front .point").length,9,"The panel identifies nine component groups");
 click(dom.window,d.querySelector('#front .point[data-part="hl"]'));
 assert.equal(d.getElementById("partTitle").textContent,"Heat Active indicator");
 assert.ok(d.getElementById("partText").textContent.includes("amber HEAT ACTIVE"),"Amber lamp description is displayed");
 assert.ok(!html.includes("dark green indicator lens"),"Outdated lamp-colour claim removed");
 assert.equal(d.querySelectorAll("#wiring svg").length,0,"No obsolete diagram is duplicated in the overview");
 dom.window.close();
}
function testProgrammingAndElectricalLinks(){
 const programming=readFileSync(path.join(root,"omron-programming","index.html"),"utf8");
 const electrical=readFileSync(path.join(root,"electrical","index.html"),"utf8");
 assert.ok(programming.includes("../omron-atlas/"),"Programming guide links to atlas");
 assert.ok(electrical.includes("../#wiring"),"Electrical guide links back to manual");
 assert.ok(electrical.includes("./diagrams/"),"Electrical guide links to current drawings");
 assert.ok(electrical.includes("./reference-wiring/"),"Electrical guide links to connection details");
}
function testEditorialSeparation(){
 const operator=readFileSync(path.join(root,"index.html"),"utf8");
 const programming=readFileSync(path.join(root,"omron-programming","index.html"),"utf8");
 const studio=readFileSync(path.join(root,"program-tools","index.html"),"utf8");
 const electrical=readFileSync(path.join(root,"electrical","index.html"),"utf8");
 const statusHtml=readFileSync(path.join(root,"development","index.html"),"utf8");
 const statusDom=page(path.join(root,"development","index.html"),"https://techtinker.club/heater/development/");
 const docs=[operator,programming,studio,electrical];
 for(const [i,d] of docs.entries()){
  assert.ok(!d.includes("The user then observed"),"Development diary leaked into operator page "+i);
  assert.ok(!d.includes("Development status · 14 October"),"Dated development banner still in operator page "+i);
 }
 assert.ok(!operator.includes("Indicator lens (function to confirm)"),"Panel labels are customer-facing");
 assert.ok(!operator.includes("dark green indicator lens"),"Indicator colour is corrected");
 assert.ok(!programming.includes("We removed USB power"),"Programming steps are written for operators");
 assert.ok(electrical.includes("R1.2"),"Current electrical issue is identified");
 assert.ok(programming.includes("../development/#evidence"),"Programming test records remain in engineering archive");
 assert.ok(studio.includes("../development/#evidence"),"Simulator test evidence remains in engineering archive");
 assert.ok(statusDom.document.getElementById("current-drawings"),"Current R1.2 issue is prominent");
 assert.ok(statusDom.document.getElementById("open"),"Outstanding checks are accessible");
 assert.ok(statusDom.document.getElementById("software"),"Software qualification records remain available");
 assert.ok(statusDom.document.querySelectorAll("details.record").length>=5,"Original technical records are preserved");
 assert.ok(statusHtml.includes("Commissioning evidence"),"Safety qualification status remains explicit");
 assert.ok(operator.includes("Before first use"),"Operator checks remain visible");
 assert.ok(programming.toLowerCase().includes("do not"),"Programming precautions remain visible");
 const inner=statusDom.document.querySelector("details.record");
 assert.ok(inner&&inner.querySelector("summary")&&inner.querySelector(".recordbody"));
 statusDom.dom.window.close();
}
function testQuickStartAndSearch(){
 const {dom,document:d,html}=page(path.join(root,"index.html"),"https://techtinker.club/heater/");
 dom.window.eval(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
 assert.ok(d.querySelectorAll("#overview .taskCard").length>=7,"Task-based homepage navigation is populated");
 assert.ok(d.getElementById("mobileMenu"),"Compact mobile chapter menu exists");
 assert.ok(d.getElementById("mobileSearchButton"),"Mobile global search action exists");
 click(dom.window,d.getElementById("mobileSearchButton"));
 assert.equal(d.querySelector("section.view.active").id,"overview");
 click(dom.window,d.querySelector('.taskCard[data-v="front"]'));
 assert.equal(d.querySelector("section.view.active").id,"front");
 assert.ok(d.getElementById("mobileChapterName").textContent.includes("Front"));
 click(dom.window,d.querySelector('.navbtn[data-v="overview"]'));
 const source=readFileSync(path.join(root,"assets","site-search-data.js"),"utf8");
 const library=readFileSync(path.join(root,"assets","site-search.js"),"utf8");
 dom.window.eval(source);dom.window.eval(library);
 dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
 assert.ok(dom.window.HRC_SEARCH_INDEX.length>=255);
 assert.ok(dom.window.HRCManualSearch.rank("wt-b")[0].href.includes("/heater/omron-atlas/#adjustment/wt-b"));
 const input=d.getElementById("siteSearchInput");
 input.value="wt-b";input.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.ok(d.querySelectorAll(".searchHit").length>0);
 assert.ok(d.querySelector(".searchHit").getAttribute("href").includes("wt-b"));
 input.value="Finder";input.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.ok(d.querySelector(".searchResultGrid").textContent.toLowerCase().includes("finder"));
 input.value="nonsense-unfindable-zzz";input.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.ok(d.getElementById("siteSearchCount").textContent.includes("No matching"));
 input.dispatchEvent(new dom.window.KeyboardEvent("keydown",{key:"Escape",bubbles:true}));
 assert.equal(input.value,"");
 assert.equal(d.querySelectorAll(".searchHit").length,0);
 dom.window.close();
}
function testGuidedKeypad(){
 const file=path.join(root,"programming-assistant","index.html");
 const {dom,document:d,html}=page(file,"https://techtinker.club/heater/programming-assistant/");
 const script=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(script,"Guided workflow application present");
 dom.window.eval(script[1]);
 assert.equal(d.getElementById("screenCode").textContent,"PV/SP");
 assert.ok(d.getElementById("fullSteps").querySelectorAll("li").length>=19);
 assert.ok(d.getElementById("stepAction").textContent.includes("external heater power"));
 click(dom.window,d.getElementById("next"));
 assert.equal(d.getElementById("screenCode").textContent,"r-r");
 const slot=d.getElementById("memory");
 change(dom.window,slot,"4");
 assert.equal(d.getElementById("progressLabel").textContent.split(" of ")[0],"Step 1");
 const target=d.getElementById("target");target.value="120.0";target.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 const minutes=d.getElementById("minutes");minutes.value="90";minutes.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.equal(d.getElementById("previewTime").textContent,"Display: 1.30");
 assert.ok(d.getElementById("fullSteps").textContent.includes("120.0"));
 assert.ok(d.getElementById("fullSteps").textContent.includes("1.30"));
 target.value="601";target.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.equal(d.getElementById("stepCard").hidden,true);
 assert.equal(d.getElementById("fieldError").hidden,false);
 target.value="50";target.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.equal(d.getElementById("stepCard").hidden,false);
 click(dom.window,d.getElementById("flowSelect"));
 assert.equal(d.querySelectorAll("#fullSteps li").length,6);
 assert.equal(d.getElementById("rampSettings").hidden,true);
 const progSteps=d.getElementById("fullSteps").textContent;
 assert.ok(progSteps.includes("prg"),"Choose RUN slot using prg");
 assert.ok(progSteps.includes("d.prg"),"Differentiate editing from running");
 assert.ok(!/press down .*run now/i.test(progSteps),"Never silently start heating");
 dom.window.close();
}
const total=testAtlas();testOperator();testProgrammingAndElectricalLinks();testEditorialSeparation();testQuickStartAndSearch();testGuidedKeypad();
console.log("PASS: "+total+" Omron atlas entries, model filters, MODE navigation, input choices, search, electrical tabs, deep links, and cross-page references.");
