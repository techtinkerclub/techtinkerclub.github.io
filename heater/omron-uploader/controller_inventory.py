"""H186-E1-06 documented E5C-T double-word parameter inventory.

This is a curated list of published address maps, not a blind scan. Any
undocumented/variant-dependent register is marked unavailable if the controller
rejects it. No write path exists here. Read-only 0101 operations only.

H186 sections 3-1 (PDF pp. 47–73); DA memory is separately backed up using
the existing tested eight-block 150-register transfer workflow.
"""
from __future__ import annotations
from dataclasses import dataclass, asdict
from datetime import datetime,timezone
import json
from controller_setup import CONFIG, signed32

SCHEMA="e5cct-extended-inventory-1"
MANUAL="Omron H186-E1-06, section 3-1"
SOURCE="https://files.omron.eu/downloads/latest/manual/en/h186_e5_c-t_digital_temperature_controllers_communications_manual_en.pdf"

@dataclass(frozen=True)
class Parameter:
    register: str
    group: str
    name: str
    meaning: str
    manual_page: str
    access: str = "read-only in app"
    unit: str = ""
    scale: int = 1
    minimum: int | None = None
    maximum: int | None = None
    options: dict[int,str] | None = None
    applicability: str = "Model and configured options may restrict availability."
    context: str = ""
    def as_json(self):
        return asdict(self)

CATALOG={}

def add(group,register,name,meaning,page,**kw):
    if register in CATALOG:
        raise ValueError(f"Duplicate H186 register {register}")
    CATALOG[register]=Parameter(register,group,name,meaning,str(page),**kw)

# Existing verified subset; retain its explanations and enumerated choices.
for old in CONFIG:
    code=old["code"]
    add(old["group"],code,old["name"],old["explanation"],
        "3-4 to 3-22",options=old["options"],
        access="documented R/W; application draft only" if old["options"] is not None
               else "documented R/W; review-only in application")

# C0 (read-only operating monitors), pp. 3-2..3-3. PV scaling depends on input.
C0=[
(0x0000,"Process value","Actual measured process value (PV); engineering scaling depends on input type."),
(0x0001,"Controller status","Bit-field operating status; decode against H186 section 3-2."),
(0x0002,"Present setpoint","Controller's current commanded setpoint, not measured temperature."),
(0x0003,"Heater current 1","Heater-break current monitor; only available with supported CT equipment."),
(0x0004,"Heating manipulated variable","Controller's requested heating output; not a measurement of heater power."),
(0x0005,"Cooling manipulated variable","Controller's requested cooling output; optional."),
(0x0006,"Heater current 2","Second current-transformer monitor; only if equipped."),
(0x0007,"Leakage current 1","Heater leakage-current monitor; only if equipped."),
(0x0008,"Leakage current 2","Second leakage-current monitor; only if equipped."),
(0x000A,"Valve opening","Position-proportional option only."),
(0x000D,"Active PID-set number","Which of the eight stored PID sets is currently selected."),
(0x000E,"Decimal-point monitor","Current PV/SP decimal placement."),
(0x0011,"Status 2","Extended operating status bit field."),
(0x0012,"Alternate status","Status bit-field via alternate word access."),
(0x0013,"Alternate status 2","Extended status via alternate word access."),
(0x0014,"Monitored programme number","Programme selected for RUN or editing depending on RUN/RESET state."),
(0x0015,"Monitored segment number","Currently active programme segment."),
(0x0016,"Remaining standby time","Controller time-format value; not raw seconds."),
(0x0017,"Elapsed programme time","Controller time-format value."),
(0x0018,"Remaining programme time","Controller time-format value."),
(0x0019,"Elapsed segment time","Controller time-format value."),
(0x001A,"Remaining segment time","Controller time-format value."),
(0x001B,"Programme repetitions monitor","Current repetition count."),
(0x001C,"SP mode","0: programmed setpoint; 1: fixed setpoint."),
]
for address,name,meaning in C0:
    options={0:"Programmed SP",1:"Fixed SP"} if address==0x001C else None
    unit="A" if address in (3,6,7,8) else "%" if address in (4,5,0x0A) else ""
    scale=10 if unit else 1
    add("Live readings / status",f"C0:{address:04X}",name,meaning,
        "3-2–3-3",access="read-only by Omron",options=options,unit=unit,scale=scale)

# Documented C1 adjustment/protection entries not already present. pp. 3-4..3-8.
extra_c1=[
(0x000D,"Heater burnout detection 1","Threshold for detecting heater break; CT option.",0,500,10,"A"),
(0x0013,"PV slope coefficient","Sensor input gain adjustment, resolution 0.001.",1,9999,1000,""),
(0x0019,"Dead band","Heating/cooling proportional overlap/deadband; input-dependent.",-1999,9999,10,"°C"),
(0x001A,"Manual reset value","Offset used without integral action.",0,1000,10,"%"),
(0x001B,"Heating hysteresis","Switching hysteresis for ON/OFF heating.",1,9999,10,"°C"),
(0x001C,"Cooling hysteresis","Switching hysteresis for ON/OFF cooling.",1,9999,10,"°C"),
(0x001D,"Heater burnout detection 2","Second heater-break threshold, if equipped.",0,500,10,"A"),
(0x001E,"Heater short alarm 1","Heater short alarm threshold, if equipped.",0,500,10,"A"),
(0x001F,"Heater short alarm 2","Second heater short alarm threshold.",0,500,10,"A"),
(0x0021,"Wait band","Band that pauses programme time until PV reaches commanded SP.",0,9999,10,"°C"),
(0x0024,"Manual manipulated variable","Manual output value; can directly change controller output.",-1050,1050,10,"%"),
(0x0026,"MV upper limit","Maximum controller output, depends on heating/cooling mode.",0,1050,10,"%"),
(0x0027,"MV lower limit","Minimum controller output, depends on heating/cooling mode.",-1050,0,10,"%"),
(0x0028,"Move to Protect Level","Controller protection-level selection.",-1999,9999,1,""),
(0x0029,"Protection password","WRITE-ONLY SECRET: controller always reads zero. Never regard zero as real password.",-1999,9999,1,""),
(0x002A,"Parameter mask enable","Enable/disable parameter masking.",0,1,1,""),
(0x002B,"PF key protection","Locks configurable PF key action.",0,1,1,""),
(0x002C,"MV change-rate limit","Rate limit on manipulated-variable changes.",0,1000,10,"%"),
(0x002D,"Position proportional dead band","Option-dependent positioning deadband.",1,100,10,"%"),
(0x002E,"Open/close hysteresis","Option-dependent valve movement hysteresis.",1,200,10,"%"),
(0x0031,"Square-root low-cut point","For selected analogue input mode.",0,1000,10,"%"),
(0x0039,"Cooling proportional band","P value of current PID set (cooling).",1,9999,10,"°C"),
(0x003A,"Cooling integral time","I value of current PID set (cooling), unit conditional.",0,9999,1,"raw"),
(0x003B,"Cooling derivative time","D value of current PID set (cooling), unit conditional.",0,9999,1,"raw"),
(0x004E,"Programme selection","Operation-level programme selection, 0–7.",0,7,1,""),
(0x004F,"Fixed setpoint","Setpoint used during fixed-SP operation, range depends on selected sensor.",-1999,9999,1,"°C"),
(0x0050,"Standby time","Time encoded as H.MM or D.HH, depending on controller setting.",0,0x9959,1,"time"),
(0x0051,"Programme SP shift","Offset applied to entire programme setpoint trajectory.",-1999,9999,1,"°C"),
]
for addr,name,meaning,lo,hi,scale,unit in extra_c1:
    options={0:"Off",1:"On"} if addr in (0x002A,0x002B) else None
    special="READ-ONLY masked password value" if addr==0x0029 else ""
    add("Adjustment / protection / operation",f"C1:{addr:04X}",name,
        meaning+" "+special,"3-4–3-8",scale=scale,unit=unit,
        minimum=lo,maximum=hi,options=options,
        access="write-only / reported zero" if addr==0x0029 else "documented R/W; review-only in app")
for n in range(8):
    for phase,delta in (("ON",0),("OFF",1)):
        addr=0x003D+n*2+delta
        add("Event and work-bit timing",f"C1:{addr:04X}",f"Work bit {n+1} {phase} delay",
            "Delay for work-bit event signalling; check assignment and output hardware.","3-7–3-8",
            minimum=0,maximum=9999,unit="controller time",access="documented R/W; review-only in app")

# Additional H186 C3 settings. Keep hardware-dependent ones descriptive.
c3_add=[
(0x0001,"Analogue scaling upper limit","Upper engineering scale for analogue inputs; irrelevant for thermocouple.",-1999,9999,1,""),
(0x0002,"Analogue scaling lower limit","Lower engineering scale for analogue inputs; irrelevant for thermocouple.",-1999,9999,1,""),
(0x0003,"Analogue input decimal point","Decimal point for an analogue input.",0,3,1,""),
(0x0010,"Communications unit number","Node identifier; changing can break the active serial link.",0,99,1,""),
(0x0011,"Communications baud rate","May take effect after controller reset.",3,6,1,""),
(0x0012,"Communications data length","May take effect after controller reset.",7,8,1,""),
(0x0013,"Communications stop bits","May take effect after controller reset.",1,2,1,""),
(0x0014,"Communications parity","May take effect after controller reset.",0,2,1,""),
(0x001D,"Alarm standby sequence reset","How alarm standby reset behaves.",0,1,1,""),
(0x001E,"Auxiliary output 1 contact sense","Close or open its contact in alarm.",0,1,1,""),
(0x001F,"Alarm 1 hysteresis","Difference needed to reset alarm 1.",1,9999,10,"°C"),
(0x0020,"Auxiliary output 2 contact sense","Close or open its contact in alarm.",0,1,1,""),
(0x0021,"Alarm 2 hysteresis","Difference needed to reset alarm 2.",1,9999,10,"°C"),
(0x0022,"Auxiliary output 3 contact sense","Close or open its contact in alarm.",0,1,1,""),
(0x0023,"Alarm 3 hysteresis","Difference needed to reset alarm 3.",1,9999,10,"°C"),
(0x0024,"Heater burnout detection enable","Alarm and detection option.",0,1,1,""),
(0x0025,"Heater burnout latch","Latches heater burnout alarm.",0,1,1,""),
(0x0026,"Heater burnout hysteresis","Amount of current recovery before alarm reset.",1,500,10,"A"),
(0x0028,"Alpha","Control algorithm parameter.",0,100,100,""),
(0x002B,"Input digital filter","Filters measured PV; important for transient-response studies.",0,9999,10,"s"),
(0x002C,"Second PV/SP display format","Selects operating-panel alternate display.",0,7,1,""),
(0x0045,"RT option","Control option on supported models.",0,1,1,""),
(0x0046,"Heater short alarm enable","Alarm option on supported models.",0,1,1,""),
(0x0047,"Heater short alarm latch","Alarm option on supported models.",0,1,1,""),
(0x0048,"Heater short alarm hysteresis","Alarm reset margin.",1,500,10,"A"),
(0x0049,"Loop burnout detection time","Alarm time threshold.",0,9999,1,"s"),
(0x00B8,"Cooling minimum on-time","Low-cost cooling output minimum time.",1,10,10,"s"),
(0x00C0,"Programme end signal ON duration","Signal length at programme completion; FFFFFFFF is continuous ON.",0,0xFFFFFFFF,10,"s"),
(0x00C1,"Standby time unit","Hours/minutes or days/hours.",0,1,1,""),
(0x00C8,"All-PID AT upper setpoint","Autotune upper bound; depends on selected input.",-1999,9999,1,"°C"),
(0x00C9,"Thermocouple burnout method","Upscale or downscale on failed temperature input.",0,1,1,""),
]
for addr,name,meaning,lo,hi,scale,unit in c3_add:
    options={0:"Off",1:"On"} if addr in (0x0024,0x0025,0x0045,0x0046,0x0047) else None
    if addr==0x0011: options={3:"9.6 kbaud",4:"19.2 kbaud",5:"38.4 kbaud",6:"57.6 kbaud"}
    if addr==0x0014: options={0:"None",1:"Even",2:"Odd"}
    if addr==0x00C9: options={0:"Upscale",1:"Downscale"}
    if addr==0x00C1: options={0:"Hours:minutes",1:"Days:hours"}
    group="Communications configuration" if 0x0010<=addr<=0x0014 else ("Alarms / outputs / advanced" if 0x001D<=addr<=0x0049 else "Initial / advanced options")
    add(group,f"C3:{addr:04X}",name,meaning,"3-8–3-21",minimum=lo,maximum=hi,scale=scale,unit=unit,
        options=options,access="documented R/W; review-only in app")
for n in range(4):
    add("Digital input assignments",f"C3:{0x0016+n:04X}",f"Event input {n+1} assignment",
        "Controller event-input function: RUN/RESET, hold, advance, programme select, AT and other assignments. Check fitted input terminals.","3-11–3-12",
        minimum=0,maximum=21,access="documented R/W; review-only in app")
for n in range(3):
    a=0x003E+n
    add("Transfer output / analogue options",f"C3:{a:04X}",
        ["Transfer output type","Transfer output upper limit","Transfer output lower limit"][n],
        "Optional analogue transfer output; not necessarily fitted on the -000 model.","3-13",
        access="documented R/W; review-only in app")
# The H186 parameter tables include C3 upload/download programless settings
# overlapping the C9 extended bank. Preserve both mappings as distinct registers.
for i in range(13):
    code=f"C3:{0x009C+i:04X}"
    if code not in CATALOG:
        add("Programless communications",code,f"Legacy upload setting {i+1}",
            "Communications data-link mapping; do not change without a communications plan.","3-19–3-20",
            minimum=0,maximum=179)
for i in range(13):
    code=f"C3:{0x00A9+i:04X}"
    if code not in CATALOG:
        add("Programless communications",code,f"Legacy download setting {i+1}",
            "Communications data-link mapping; do not change without a communications plan.","3-20–3-21",
            minimum=30,maximum=179)
# C4 references the selected programme/segment; reads are NOT eight-independent
# blocks. DA backup already captures all eight programmes without modifying selector.
c4=[
"Programme selection","Number of segments used","Segment selection","Segment type",
"Segment target SP","Segment slope","Segment time","Programme PID set",
"Alarm 1 value","Alarm 1 upper limit","Alarm 1 lower limit",
"Alarm 2 value","Alarm 2 upper limit","Alarm 2 lower limit",
"Alarm 3 value","Alarm 3 upper limit","Alarm 3 lower limit",
"Alarm 4 value","Alarm 4 upper limit","Alarm 4 lower limit",
"Programme repetitions","Linked programme","Time signal 1 start segment",
"Time signal 1 ON time","Time signal 1 OFF time",
"Time signal 2 start segment","Time signal 2 ON time","Time signal 2 OFF time",
]
for i,name in enumerate(c4):
    meaning=("Context-dependent view of currently selected programme (and segment if applicable). "
             "Use DA backup for all eight programme memories; C4 is NOT a second independent full backup.")
    add("Selected programme / alarm & time signals",f"C4:{i:04X}",name,meaning,"3-22–3-23",
        context="Depends on C4:0000 programme selector and sometimes C4:0002 segment selector.",
        access="documented R/W; view only; do not change selectors just to scan")
# PID sets 1–8: fixed 0x10 address stride documented on H186 3-24/25.
pid_registers={
0:("Proportional band","P tunes output reaction to temperature error.",10,"°C",1,9999),
1:("Integral time","I corrects accumulated error; time unit is configurable.",1,"conditional s",0,9999),
2:("Derivative time","D responds to changes in error; time unit is configurable.",1,"conditional s",0,9999),
3:("MV upper limit","Maximum controller output, dependent on control mode.",10,"%",0,1050),
4:("MV lower limit","Minimum controller output, dependent on control mode.",10,"%",-1050,0),
5:("Automatic selection upper SP limit","Upper setpoint for selecting this PID set automatically.",1,"°C",-1999,9999),
7:("Loop burnout detection time","Detection duration for this PID set.",1,"s",0,9999),
8:("Cooling proportional band","Cooling control P, if cooling fitted.",10,"°C",1,9999),
9:("Cooling integral time","Cooling control I, time unit configurable.",1,"conditional s",0,9999),
10:("Cooling derivative time","Cooling control D, time unit configurable.",1,"conditional s",0,9999),
11:("Dead band","Heating/cooling overlap or dead band.",10,"°C",-1999,9999),
12:("Manual reset value","Manual output bias with no integral term.",10,"%",0,1000),
}
for pid in range(8):
    for offset,(name,meaning,scale,unit,lo,hi) in pid_registers.items():
        addr=pid*0x10+offset
        add(f"PID sets / PID {pid+1}",f"C5:{addr:04X}",f"PID {pid+1} — {name}",
            meaning+" The controller may not expose this for the current control mode.",
            "3-23–3-25",scale=scale,unit=unit,minimum=lo,maximum=hi,
            access="documented R/W; review-only until write sequence is validated")
# C9 "Upload Settings" / "Download Settings" are programless communications
# mapping fields, NOT a customer 'programme upload/download' command.
for i in range(23):
    add("Programless communications",f"C9:{i:04X}",f"Upload mapping {i+1}",
        "Programless communications setting; unrelated to writing heating programmes.",
        "3-25–3-27",minimum=0,maximum=179)
for i in range(43):
    add("Programless communications",f"C9:{0x17+i:04X}",f"Download mapping {i+1}",
        "Programless communications setting; unrelated to reading heating programmes.",
        "3-25–3-27",minimum=30,maximum=179)
# Expanded thermocouple/RTD/analogue input catalogue from H186 3-8.
# Actual hardware may not support every selectable input: this is NOT an
# instruction to fit a different sensor or change the controller's wiring.
from dataclasses import replace as dataclass_replace
SENSOR_INPUTS={
 0:"Pt100 −200…850 °C",1:"Pt100 −199.9…500.0 °C",2:"Pt100 0.0…100.0 °C",
 3:"JPt100 −199.9…500.0 °C",4:"JPt100 0.0…100.0 °C",
 5:"Type K −200…1300 °C (1 °C)",6:"Type K −20.0…500.0 °C (0.1 °C)",
 7:"Type J −100…850 °C",8:"Type J −20.0…400.0 °C",
 9:"Type T −200…400 °C",10:"Type T −199.9…400.0 °C",
 11:"Type E −200…600 °C",12:"Type L −100…850 °C",
 13:"Type U −200…400 °C",14:"Type U −199.9…400.0 °C",
 15:"Type N −200…1300 °C",16:"Type R 0…1700 °C",
 17:"Type S 0…1700 °C",18:"Type B 100…1800 °C",
 19:"Type W 0…2300 °C",20:"PLII 0…1300 °C",
 21:"IR input 60 °C",22:"IR input 120 °C",23:"IR input 140 °C",
 24:"IR input 220 °C",25:"4–20 mA",26:"0–20 mA",
 27:"1–5 V",28:"0–5 V",29:"0–10 V"
}
CATALOG["C3:0000"]=dataclass_replace(CATALOG["C3:0000"],options=SENSOR_INPUTS,
    minimum=0,maximum=29,
    meaning="Sensor input type and range. CRITICAL: modifies all temperature scaling and programme interpretation; requires independent hardware validation.",
    access="documented R/W; offline proposal only, no live write")
# Documentation-verified variant catalogue. DA is captured separately.
SUPPORTED_READ_TYPES={"C0","C1","C3","C4","C5","C9"}
from decimal import Decimal,InvalidOperation

DANGEROUS_CODES={"C1:0024","C1:0028","C1:0029","C3:0000",
                 "C3:0007","C3:0008","C3:000C","C3:00BC","C3:00BD","C3:00BE","C3:00C9"}
def validate_proposal(snapshot,key,display_value):
    """Offline proposal encoder only. NEVER write to a controller.
    Avoid accidental round-off, signed overflow and invalid listed values.
    The return value is an *unsigned* 32-bit transport word.
    """
    if key not in CATALOG:raise ValueError("Unknown register")
    bank=key.split(":")[0]
    p=CATALOG[key]
    if bank=="C0":raise ValueError("Operating monitors are read-only")
    if bank=="C4":raise ValueError("Selected C4 context cannot be changed from this inventory editor; use full DA programme editor")
    if key=="C1:0029":raise ValueError("Protected password cannot be read back or compared safely")
    if p.minimum is None and p.maximum is None and p.options is None:
        raise ValueError("Range/encoding not yet verified; review-only")
    if not isinstance(display_value,str) or not display_value.strip():
        raise ValueError("Enter a new value")
    try: value=Decimal(display_value.strip())
    except InvalidOperation:raise ValueError("Enter a numeric value in the displayed units")
    if not value.is_finite():raise ValueError("Non-finite numeric value not allowed")
    raw=value*p.scale
    if raw!=raw.to_integral_value():raise ValueError(f"Use a multiple of 1/{p.scale:g} in the displayed units")
    raw=int(raw)
    if p.options is not None and raw not in p.options:
        raise ValueError("Use one of the documented choice numbers")
    if p.minimum is not None and raw<p.minimum:raise ValueError(f"Below register minimum {p.minimum/p.scale:g}")
    if p.maximum is not None and raw>p.maximum:raise ValueError(f"Above register maximum {p.maximum/p.scale:g}")
    if not -(2**31)<=raw<=2**31-1:raise ValueError("Signed 32-bit range exceeded")
    return raw & 0xFFFFFFFF

def add_proposal(snapshot,draft,key,new_value):
    validate_inventory(snapshot)
    unsigned=validate_proposal(snapshot,key,new_value)
    before=snapshot["fields"][key]
    if before is None:
        raise ValueError("Cannot propose changes against an unread parameter on a connected unit")
    next_draft=dict(draft)
    if before==unsigned:next_draft.pop(key,None)
    else:next_draft[key]=unsigned
    return next_draft

def proposal_report(snapshot,draft):
    validate_inventory(snapshot)
    if not isinstance(draft,dict) or set(draft)-set(CATALOG):
        raise ValueError("Unrecognised proposal data")
    rows=[]
    for key in sorted(draft):
        p=CATALOG[key];before=snapshot["fields"][key];after=draft[key]
        if before is None:raise ValueError("Cannot review unread register "+key)
        if type(after) is not int or not 0<=after<=0xffffffff:raise ValueError("Invalid encoded value")
        rows.append(dict(register=key,group=p.group,name=p.name,
                         previous=human_value(key,before),proposed=human_value(key,after),
                         previous_hex=f"{before:08X}",proposed_hex=f"{after:08X}",
                         danger=key in DANGEROUS_CODES,
                         context=p.context,meaning=p.meaning))
    return dict(schema="e5cct-config-offline-proposal-1",
                controller=snapshot["controller"],source_read_utc=snapshot["read_utc"],
                changes=rows,writes_performed=False,
                warning="OFFLINE PROPOSAL ONLY. No C0/C1/C3/C4/C5/C9 register writes are implemented or validated.")

def group_names():
    return sorted({p.group for p in CATALOG.values()})

def read_inventory(client,identity,progress=None):
    """Read only explicitly documented registers, batching contiguous addresses.
    On a block failure, recursively divide to pinpoint unsupported options.
    No selector writes, no mutating CompoWay operations, and no blind address scan.
    """
    fields={}
    errors={}
    keys_by_type={}
    for key in CATALOG:
        bank,addr=key.split(":")
        assert bank in SUPPORTED_READ_TYPES
        keys_by_type.setdefault(bank,[]).append(int(addr,16))
    total=len(CATALOG);finished=0
    def read_subset(bank,addresses):
        nonlocal finished
        # Each block is a *contiguous*, documented subset, up to 25 values.
        try:
            values=client.read(bank,addresses[0],len(addresses))
            if len(values)!=len(addresses):raise ValueError("Short controller response")
            for addr,v in zip(addresses,values):
                if type(v) is not int or not 0<=v<=0xFFFFFFFF:
                    raise ValueError("Invalid 32-bit register value")
                fields[f"{bank}:{addr:04X}"]=v
            finished+=len(addresses)
            if progress:progress(finished,total)
        except Exception as exc:
            if len(addresses)==1:
                k=f"{bank}:{addresses[0]:04X}"
                fields[k]=None
                errors[k]=f"{type(exc).__name__}: {exc}"
                finished+=1
                if progress:progress(finished,total)
            else:
                half=len(addresses)//2
                read_subset(bank,addresses[:half])
                read_subset(bank,addresses[half:])
    for bank in ("C0","C1","C3","C4","C5","C9"):
        addresses=sorted(set(keys_by_type.get(bank,[])))
        i=0
        while i<len(addresses):
            batch=[addresses[i]]
            i+=1
            while i<len(addresses) and addresses[i]==batch[-1]+1 and len(batch)<25:
                batch.append(addresses[i]);i+=1
            read_subset(bank,batch)
    result=dict(schema=SCHEMA,read_utc=datetime.now(timezone.utc).isoformat(),
                controller=dict(identity),fields=fields,errors=errors,
                register_count=total,group_count=len(group_names()),
                source_manual=MANUAL,source_url=SOURCE,
                important_notes=[
                    "Selected-programme C4 values depend on controller selection; they are not an all-programmes snapshot.",
                    "C1 protection password reads as zero regardless of configured secret.",
                    "C0 measurements with controller setup-cable power only are NOT a live heater test.",
                    "Optional and unsupported parameters are shown as unavailable, never as zero.",
                    "Read-only 0101 commands only; nothing was written to the controller."
                ])
    validate_inventory(result)
    return result

def validate_inventory(obj):
    if not isinstance(obj,dict) or obj.get("schema")!=SCHEMA:raise ValueError("Not an extended E5CC-T inventory")
    model=obj.get("controller",{}).get("model10","")
    if not model.startswith("E5CC-T"):raise ValueError("Different controller model")
    fields=obj.get("fields")
    if not isinstance(fields,dict) or set(fields)!=set(CATALOG):
        raise ValueError("Extended controller inventory is incomplete or unknown")
    for key,value in fields.items():
        if value is not None and (type(value) is not int or not 0<=value<=0xFFFFFFFF):
            raise ValueError("Invalid value "+key)
    return obj

def human_value(key,raw):
    if raw is None:return "Unavailable / not read"
    param=CATALOG[key]
    signed=signed32(raw)
    if key=="C1:0029":return "Protected password (hidden; read value is not actual password)"
    if param.options is not None:return param.options.get(signed,f"Unknown option {signed}")
    if param.scale!=1:
        # conditional cases stay raw, even if other controllers offer tenths.
        return f"{signed/param.scale:g} {param.unit}".strip()
    return f"{signed} {param.unit}".strip()

def readable_rows(snapshot,group=None,query=""):
    validate_inventory(snapshot)
    terms=query.casefold().strip()
    for code,param in CATALOG.items():
        if group and group!="All groups" and param.group!=group:continue
        if terms and terms not in (" ".join([code,param.name,param.meaning,param.group])).casefold():continue
        raw=snapshot["fields"][code]
        yield dict(code=code,name=param.name,group=param.group,actual=human_value(code,raw),
                   raw=f"{raw:08X}" if raw is not None else "",
                   meaning=param.meaning,access=param.access,page=param.manual_page,
                   error=snapshot["errors"].get(code,""),context=param.context)

def report_inventory(snapshot):
    validate_inventory(snapshot)
    lines=[f"E5CC-T EXTENDED CONTROLLER INVENTORY — {snapshot['read_utc']}",
           f"Model prefix: {snapshot['controller']['model10']}",
           f"Recorded registers: {len(CATALOG)}; unavailable: {len(snapshot['errors'])}",
           "SCOPE: documented, explicitly allowlisted H186 CompoWay/F reads only.",
           "Only active/selected C4 context; DA all-programme backup is a separate file.",""]
    for group in group_names():
        lines.append("\n"+group.upper())
        for row in readable_rows(snapshot,group):
            lines.append(f"{row['code']}  {row['name']}: {row['actual']}  [{row['raw'] or 'NO READ'}]")
    lines.extend(["","No parameter writes were sent. Selected and optional fields must be interpreted with their controller mode."])
    return "\n".join(lines)
