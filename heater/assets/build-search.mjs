/* Rebuild the static manual search index after editing the catalogue or atlas.
 * node heater/assets/build-search.mjs
 * node heater/assets/build-search.mjs --check
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const atlasFile=path.join(here,"..","omron-atlas","atlas-data.js");
const target=path.join(here,"site-search-data.js");
// Add or revise high-level routes here; every Omron atlas entry is appended automatically.
const routes=[
  {
    "title": "Overview",
    "summary": "What the controller does and how the two channels are arranged",
    "href": "/heater/#overview",
    "group": "Manual",
    "keywords": "about start two channels control"
  },
  {
    "title": "Front-panel controls",
    "summary": "Identify buttons, sockets, meters, selectors and lamps",
    "href": "/heater/#front",
    "group": "Manual",
    "keywords": "physical front panel switch enable lamps"
  },
  {
    "title": "Electrical overview",
    "summary": "Start here to understand the controller, build or rewire it, or diagnose a problem",
    "href": "/heater/electrical/",
    "group": "Electrical",
    "keywords": "electrical overview power relay control SSR schematic supply mains voltage"
  },
  {
    "title": "Electrical diagrams and circuit drawings",
    "summary": "Current 14-sheet R1.2 electrical drawings and 70 numbered From–Via–To routes",
    "href": "/heater/electrical/diagrams/",
    "group": "Electrical",
    "keywords": "electrical diagram drawing schematic pdf print pptx power supply 24V mains heater enable active finder crydom connection"
  },
  {
    "title": "Terminal distribution and connections",
    "summary": "Reference conductor allocation, block sizes, mounting and service checks",
    "href": "/heater/electrical/distribution/",
    "group": "Electrical",
    "keywords": "PTFIX phoenix contact NS35 DIN rail WAGO PE mounting 6 way 12 way ferrule wiring diagram deviations terminal block purchase list"
  },
  {
    "title": "Reference Electrical Wiring R1.2",
    "summary": "Electrical circuit paths: mains, Finder enable relay, Omron demand and directional DC heater switching",
    "href": "/heater/electrical/reference-wiring/",
    "group": "Electrical",
    "keywords": "R1 current wiring schematic reference PDF print rebuilt 14 sheets Phoenix WAGO distribution connector terminal"
  },
  {
    "title": "Full SOP — 23-step experiment and heating sequence",
    "summary": "Pre-test preparation, Omron RUN/RESET, external DC supply, ENABLE and ACTIVE indication, fault response and cooling",
    "href": "/heater/sop/",
    "group": "Operation",
    "keywords": "sop safety standard operating procedure run reset start heater sample thermocouple experiment procedure stop led murata supply"
  },
  {
    "title": "Heater controller equipment risk assessment",
    "summary": "18 hazards, preventive controls, electrical isolation and protection, specimen-specific risks, release checks and sign-off",
    "href": "/heater/risk-assessment/",
    "group": "Safety",
    "keywords": "risk assessment RA hazards protection thermal burn runaway emergency PE fire shock DC review"
  },
  {
    "title": "Distribution capacity and terminal blocks",
    "summary": "Reference terminal groups, quantities and mounting",
    "href": "/heater/electrical/distribution/#selection",
    "group": "Electrical",
    "keywords": "mains 3 neutral 3 24v 0v 48 positions 70 spare terminal DIN Phoenix PTFIX"
  },
  {
    "title": "Terminal-by-terminal allocation",
    "summary": "All 48 allocated conductor ports, grouped by electrical potential",
    "href": "/heater/electrical/distribution/#terminals",
    "group": "Electrical",
    "keywords": "find connection wire Finder EAO Crydom Weidmuller K1 K2 13 14"
  },
  {
    "title": "Relay enable and heater-power circuits",
    "summary": "Finder 13.61 RI, 62.31 directional DC contact 34→14, Crydom SSR control and load paths",
    "href": "/heater/electrical/reference-wiring/#operation",
    "group": "Electrical",
    "keywords": "Finder 13.61 62.31 EAO momentary button 34 14 DC SSR polarity 15A"
  },
  {
    "title": "Printable From–Via–To wiring sheets",
    "summary": "70 numbered connection routes, component legend, per-circuit print pages and CSV download",
    "href": "/heater/wiring-sheets/",
    "group": "Electrical",
    "keywords": "wire wiring connections pdf print from via to K1 K2 X3 EN1 X4 terminal 70"
  },
  {
    "title": "Component register and manufacturer datasheets",
    "summary": "Searchable component register with manufacturers, models and datasheet links",
    "href": "/heater/components/",
    "group": "Reference",
    "keywords": "component EAO SCHURTER Omron Finder Crydom phoenix WAGO datasheet model reference hardware"
  },
  {
    "title": "Electrical maintenance",
    "summary": "Isolation, protective-earth bonding, component verification and independent inspection",
    "href": "/heater/electrical/#service",
    "group": "Maintenance",
    "keywords": "earth ground PE door bonding servicing safe isolate"
  },
  {
    "title": "Panel labels and connections",
    "summary": "What the markings and connectors mean on each channel",
    "href": "/heater/#labels",
    "group": "Manual",
    "keywords": "connector terminal marking red black green thermocouple"
  },
  {
    "title": "Indications and states",
    "summary": "RUN, RESET, heat-demand lamp, voltmeter and PV/SP meaning",
    "href": "/heater/#sequence",
    "group": "Operation",
    "keywords": "indicator status output led rst run"
  },
  {
    "title": "Omron setup and tuning",
    "summary": "Input type, programme setup, Omron controller and autotune reference",
    "href": "/heater/#omron",
    "group": "Programming",
    "keywords": "Omron pid controller tuning"
  },
  {
    "title": "Windows USB Studio",
    "summary": "Read, back up and prepare one controller using E58-CIFQ2",
    "href": "/heater/#software",
    "group": "Software",
    "keywords": "com port transfer firmware E58 CIFQ2 backup"
  },
  {
    "title": "Components and part numbers",
    "summary": "Main controller, relays, PSU, SSR, switches and connectors",
    "href": "/heater/components/",
    "group": "Maintenance",
    "keywords": "bom hardware spare replacement parts"
  },
  {
    "title": "Programme Studio",
    "summary": "Create up to eight heating profiles, ramps, soaks and offline setpoint graph",
    "href": "/heater/program-tools/",
    "group": "Tool",
    "keywords": "create programme program profile builder segment slope"
  },
  {
    "title": "Guided manual programming",
    "summary": "Step-by-step front-panel procedure to enter a ramp and soak",
    "href": "/heater/programming-assistant/",
    "group": "Tool",
    "keywords": "wizard tutorial button press mode level select edit"
  },
  {
    "title": "Interactive Omron menu atlas",
    "summary": "Navigate button levels, MODE paths and all parameter mnemonics",
    "href": "/heater/omron-atlas/",
    "group": "Tool",
    "keywords": "menu tree map filter hardware settings mode press"
  },
  {
    "title": "Select and run a stored programme",
    "summary": "How to find prg, pgsg and RUN/RESET",
    "href": "/heater/omron-programming/#run",
    "group": "Programming",
    "keywords": "programme selection start run reset"
  },
  {
    "title": "Enter a 50°C programme",
    "summary": "Worked Omron ramp to 50°C and 15-minute soak",
    "href": "/heater/omron-programming/#bench",
    "group": "Programming",
    "keywords": "Omron manual keypad 50 c ramp soak"
  },
  {
    "title": "Heat to 80°C",
    "summary": "Worked fixed target 80 °C programme",
    "href": "/heater/omron-programming/#fixed",
    "group": "Programming",
    "keywords": "80 degrees hold"
  },
  {
    "title": "Ramp to 120°C",
    "summary": "Worked Omron 2 °C/min ramp programme",
    "href": "/heater/omron-programming/#rate",
    "group": "Programming",
    "keywords": "120 degrees"
  },
  {
    "title": "Omron input configuration",
    "summary": "Initial settings, sensor type and global setpoint limits",
    "href": "/heater/omron-programming/#initial",
    "group": "Programming",
    "keywords": "input thermocouple RTD sensors"
  },
  {
    "title": "Omron PID autotune",
    "summary": "Autotune overview for approved inert loads",
    "href": "/heater/omron-programming/#tuning",
    "group": "Programming",
    "keywords": "at tuning pid"
  },
  {
    "title": "Manual ramp calculator",
    "summary": "Nominal ramp duration in minutes",
    "href": "/heater/omron-programming/#calculator",
    "group": "Tool",
    "keywords": "calc minutes rate delta temperature"
  },
  {
    "title": "D13 drawing archive (superseded by R1.2)",
    "summary": "Earlier 11-sheet electrical drawing PDF and editable PowerPoint, retained for historical reference; use current R1.2 drawings",
    "href": "/heater/electrical/d13/",
    "group": "Archive",
    "keywords": "original electrical schematic D13 PDF download PowerPoint PPTX 11 sheets drawing archive previews"
  },
  {
    "title": "Engineering documentation audit and issue register",
    "summary": "Cross-reference of R1.2 drawings, 70 routes, 48 terminals, components and outstanding technical inspections",
    "href": "/heater/development/document-audit/",
    "group": "Engineering",
    "keywords": "as-built audit documentation discrepancy register meter fuse connector alias revision technical inspection"
  }
];
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(atlasFile,"utf8"),sandbox,{filename:atlasFile,timeout:3000});
const catalogue=sandbox.window.OMRON_ATLAS;
if(!catalogue||!catalogue.levels)throw Error("Missing Omron atlas catalogue");
const records=[...routes];
for(const [id,level] of Object.entries(catalogue.levels)){
 for(const entry of level.entries){
  records.push({title:entry.code+" · "+entry.name,summary:entry.why,
   href:"/heater/omron-atlas/#"+id+"/"+encodeURIComponent(entry.code),
   group:"Omron parameter",
   keywords:[id,level.title,entry.code,entry.name,entry.flags.join(" "),entry.why].join(" ")});
 }
}
const source="/* Generated offline documentation index: main operator pages and every H185-based atlas entry. */\n"+
 "window.HRC_SEARCH_INDEX="+JSON.stringify(records)+";\n";
if(process.argv.includes("--check")){
 if(!fs.existsSync(target)||fs.readFileSync(target,"utf8")!==source){
   process.stderr.write("Search index is stale. Run: node heater/assets/build-search.mjs\n");
   process.exitCode=1;
 }else console.log("PASS: indexed "+records.length+" manual topics and Omron parameters");
}else{
 fs.writeFileSync(target,source);
 console.log("Updated "+target+" with "+records.length+" indexed items");
}
