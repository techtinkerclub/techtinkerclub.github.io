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
    "title": "Electrical architecture",
    "summary": "Simple three-layer overview of control, enable and DC heating power",
    "href": "/heater/#wiring",
    "group": "Electrical",
    "keywords": "relay supply wiring power"
  },
  {
    "title": "Current point-to-point wiring register · 22 October 2026",
    "summary": "Individual mains, 24 V, Finder, EAO, Crydom and Weidmüller connections; builder reports versus unverified work",
    "href": "/heater/electrical/wiring-reconciliation/",
    "group": "Electrical",
    "keywords": "D13 revised wiring as built 3 Live 3 Neutral three +24 0V Finder 13.61 A1 A2 EAO COM EN1 Crydom A1 A2 Weidmueller 13 14 ACTIVE wiring worksheets"
  },
  {
    "title": "Printable D13 draft wiring PDF",
    "summary": "Four-page A4 landscape draft connection register, 12 mains/PE and 17 control paths per channel",
    "href": "/heater/electrical/wiring-reconciliation/Heating_Controller_D13_Field_Wiring_Reconciliation_DRAFT.pdf",
    "group": "Electrical",
    "keywords": "wiring PDF print workbench sheet 2026 revised D13 control AC mains neutral positive ground"
  },
  {
    "title": "Panel labels and connections",
    "summary": "What the markings and connectors mean on each channel",
    "href": "/heater/#labels",
    "group": "Manual",
    "keywords": "connector terminal marking red black green thermocouple"
  },
  {
    "title": "Operating procedure",
    "summary": "Pre-use checks, controller start and post-test shutdown on a commissioned system",
    "href": "/heater/#sop",
    "group": "Operation",
    "keywords": "operating checklist start shut down heater run"
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
    "href": "/heater/#components",
    "group": "Maintenance",
    "keywords": "bom hardware spare replacement parts"
  },
  {
    "title": "Manufacturer datasheets",
    "summary": "Manufacturer manuals and reference links",
    "href": "/heater/#datasheets",
    "group": "Reference",
    "keywords": "datasheet h185 h186 Omron Finder Crydom"
  },
  {
    "title": "Safety and commissioning",
    "summary": "Not-commissioned status, release constraints and approved tests",
    "href": "/heater/#review",
    "group": "Safety",
    "keywords": "inspection checklist not commissioned heater"
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
    "title": "Electrical schematics · D12",
    "summary": "Complete eleven-sheet diagram pack and technical overview",
    "href": "/heater/electrical/#d12-original",
    "group": "Electrical",
    "keywords": "schematic drawing electrical power circuit"
  },
  {
    "title": "24 V distribution",
    "summary": "Control supply and independently gated enable branches",
    "href": "/heater/electrical/#sheet-02",
    "group": "Electrical",
    "keywords": "24v mean well xdr source"
  },
  {
    "title": "Finder heater relay and enable",
    "summary": "Momentary EAO enable and Finder relay logic",
    "href": "/heater/electrical/#sheet-03-04",
    "group": "Electrical",
    "keywords": "13.61 62.31 latch reset switch"
  },
  {
    "title": "SSR heater demand",
    "summary": "Omron output, Weidmüller interface, Crydom SSR and ACTIVE lamp",
    "href": "/heater/electrical/#sheet-05-06",
    "group": "Electrical",
    "keywords": "heat active led ssr solid state relay"
  },
  {
    "title": "DC heater supply and polarity",
    "summary": "External 0–60 V supply, switched positive contact and heater return",
    "href": "/heater/electrical/#sheet-07-08",
    "group": "Electrical",
    "keywords": "15 amp finder 34 14 dc power polarity"
  },
  {
    "title": "Terminal connection schedule",
    "summary": "Circuit nodes, physical points and reference labels",
    "href": "/heater/electrical/#schedule",
    "group": "Electrical",
    "keywords": "wire wiring terminal connectors x1 x2"
  },
  {
    "title": "Service and replacement",
    "summary": "Disconnect, inspect, check polarities and replace components",
    "href": "/heater/electrical/#service",
    "group": "Maintenance",
    "keywords": "service maintain repair relay connector"
  },
  {
    "title": "Development and verification",
    "summary": "Test history, commissioned status and remaining validation work",
    "href": "/heater/development/",
    "group": "Engineering",
    "keywords": "progress roadmap bench trials not verified"
  },
  {
    "title": "Outstanding engineering checks",
    "summary": "Open electrical, hardware and software qualification tests",
    "href": "/heater/development/#open",
    "group": "Engineering",
    "keywords": "todo remaining tests qualification checks"
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
