"""One authoritative manual-entry plan for the Qt offline screen and printable guide.

Matches the self-contained website builder's Omron code/value table, with the
verified button navigation from the project's omron-programming instructions.
No hardware writes, external pages or made-up advanced parameter key paths.

Checked front-panel procedure: H185 E5C-T user manual, project bench notes.
Menu visibility and specific button paths can vary with protection and options.
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from program_model import Programme
from controller_inventory import CATALOG,human_value

@dataclass(frozen=True)
class Entry:
    section: str
    code: str
    value: str
    purpose: str
    instruction: str
    kind: str = "set" # set, check, navigate

    def to_dict(self):
        return dict(section=self.section,code=self.code,value=self.value,
                    purpose=self.purpose,instruction=self.instruction,kind=self.kind)

def _min_to_hm(raw):
    mins = Decimal(str(raw))
    if not mins.is_finite() or mins != mins.to_integral_value() or mins<0:
        raise ValueError("Soak durations must be whole nonnegative minutes.")
    n=int(mins)
    return f"{n//60}.{n%60:02d}"

def _target(raw):
    d=Decimal(str(raw))
    return f"{d:g} °C"

def make_entry_plan(programme:Programme,slot:int,baseline=None,changes=None):
    """Return ordered keypad worksheet model for one valid native programme.

    Writes deliberately NOT performed. Controller setup changes from H186 are
    a separate review schedule unless a front-panel route is verified.
    """
    if type(slot) is not int or not 0<=slot<=7:
        raise ValueError("Expected programme 0–7")
    met=programme.validate()
    baseline=baseline or {}
    changes=changes or {}
    entries=[]
    add=lambda section,code,value,purpose,instruction,kind="set":entries.append(
        Entry(section,code,str(value),purpose,instruction,kind))
    add("Preparation","r-r","rst","Confirm controller stopped",
        "From PV/SP in Operation Level, press MODE briefly until r-r is displayed. "
        "Confirm rst. Do not run during programming.","check")
    add("Preparation","in-t","5 (Type K, whole °C) — VERIFY",
        "Thermocouple input range and temperature resolution",
        "From PV/SP, hold LEVEL ≥3 s for Initial Setting Level; press MODE until in-t. "
        "Compare the actual value with the sensor wiring. Do not change it casually.","check")
    for code,value,purpose in [
        ("t-pr","pr","Programme ramp method (rate)"),
        ("pru","m","Ramp-rate unit: degrees per minute"),
        ("t-u","h-m","Segment time unit: hours.minutes"),
        ("rtsm","stop","Program restarts stop at intended stage"),
        ("p-on","rst","Restore controller in RESET on power-up"),
        ("eset",programme.finish,"Controller action when programme ends")]:
        add("Preparation",code,value+" — VERIFY",purpose,
            "In Initial Setting Level press MODE until this code is displayed. "
            "Check the actual setting; make a change only if it is an approved change "
            "in the separate configuration plan.","check")
    add("Preparation","spmd","psp — VERIFY",
        "Programmed setpoint mode",
        "From Operation Level press LEVEL briefly twice for Adjustment Level, "
        "then MODE until spmd. Verify psp without altering other parameters.","check")
    add("Programme selection","d.prg",slot,"Choose memory to EDIT, not RUN",
        f"From normal PV/SP, press LEVEL briefly once (<1 s) for Program Setting Level. "
        f"At d.prg use UP/DOWN to select {slot}. Press MODE once to store/advance.")
    add("Programme selection","s-no",len(programme.steps),
        "Active number of segments (0-based indexing)",
        f"At s-no use UP/DOWN to set {len(programme.steps)}. "
        "Press MODE to reach d.seg.")
    for i,seg in enumerate(programme.steps):
        sec=f"Segment {i} — {seg.type.upper()}"
        add(sec,"d.seg",i,f"Select segment {i}",
            (f"MODE normally advances to d.seg = {i} after the previous segment. "
             "If not, use UP/DOWN at d.seg to choose the displayed segment. "
             "Check the segment number before editing."),"navigate")
        add(sec,"styp",seg.type,"Segment mode",
            f"Press MODE until styp. Choose {seg.type} with UP/DOWN and "
            "press MODE to confirm.")
        if seg.type=="ramp":
            add(sec,"sp",_target(seg.sp),"Target commanded setpoint",
                f"Press MODE until sp; set {_target(seg.sp)} with UP/DOWN "
                "(PF can select the digit where supported); press MODE to store.")
            add(sec,"pr",f"{Decimal(str(seg.rate)):g} °C/min","Ramp rate",
                "Press MODE until pr; set the specified degrees per minute. "
                "This is the setpoint rate, not a measured heating-rate guarantee.")
        elif seg.type=="step":
            add(sec,"sp",_target(seg.sp),"Immediate commanded setpoint",
                "Press MODE until sp and set the target. An instant STEP uses "
                "styp = step and does NOT have a ramp-rate field.")
        elif seg.type=="soak":
            hm=_min_to_hm(seg.minutes)
            add(sec,"time",hm+ " (h.mm)","Hold previous setpoint",
                f"Press MODE until time; enter {hm} (hours.minutes). "
                "Example 0.15 means 15 minutes, NOT 0.15 decimal hours. "
                "Soak has no independent SP or ramp rate.")
    add("Programme-wide","d.seg","end","Select programme-wide parameters",
        "After the last field, press MODE until d.seg = end. "
        "This is a settings position, NOT another programme segment.","navigate")
    add("Programme-wide","pid","1 — VERIFY","PID set assigned to programme",
        "Press MODE until pid. Confirm the intended PID set; do not overwrite "
        "the existing tuning or assume PID set 1 is always appropriate.","check")
    add("Programme-wide","al-1 / al-2 / al-3","existing — VERIFY",
        "Programme alarm functions",
        "Press MODE through any visible alarm parameters. Record current values "
        "and DO NOT overwrite unapproved alarm settings.","check")
    add("Programme-wide","rpt",0,"Number of repetitions",
        "Press MODE until rpt; set 0 unless your engineering plan specifies repetition.")
    add("Programme-wide","link","end","Do not chain to another programme",
        "Press MODE until link and select end.")
    add("Finish and verify","LEVEL","3 × short from Programme Level",
        "Return to Operation Level",
        "Short-press LEVEL three times from Program Setting Level to return "
        "to the PV/SP operation display. Verify current status is rst.","navigate")
    add("Finish and verify","prg",slot,"Programme selected for eventual RUN",
        f"In Operation Level press MODE until prg. Set {slot} to select "
        f"Programme {slot} for later execution. prg is separate from d.prg; "
        "DO NOT command RUN during programming.")
    add("Finish and verify","pgsg",f"{slot}.00 (example)", "Programme/segment monitor",
        "Confirm the displayed programme number in pgsg. "
        "Segment suffix varies with controller state.","check")
    add("Finish and verify","d.prg / d.seg","read back every entry",
        "Verify configuration against the worksheet",
        "Return to Programme Setting Level; read each parameter without changing it. "
        "Normal front-panel entry does not use the separate USB SAVE RAM DATA command.","check")
    add("Finish and verify","POWER OFF/ON","verify persistence",
        "Confirm values survived power loss",
        "With heater/controller mains and DC isolated, finish edits, "
        "remove controller setup power until its display turns off, "
        "then restore USB-only power and reread programme. "
        "Never unplug during an active edit.","check")

    if programme.finish=="cont":
        add("Finish and verify","eset","cont — CAUTION",
            "Controller may continue output after profile completion",
            "The requested CONTINUE end action requires a separate approved initial-setting "
            "change. The DA USB programme writer does not set this parameter. "
            "Verify the external emergency cut-off and control behaviour before any heater use.","check")

    proposals=[]
    for code,raw in sorted(changes.items()):
        if code not in CATALOG:raise ValueError("Unrecognised draft register "+code)
        p=CATALOG[code]
        old=baseline.get(code)
        typ=baseline.get("C3:0000")
        proposals.append(dict(
            code=code,name=p.name,
            current=human_value(code,old,typ) if old is not None else "Unknown — must check device",
            proposed=human_value(code,raw,typ),
            meaning=p.meaning,
            entry="Front-panel key sequence is NOT VERIFIED for this parameter; "
                  "consult the exact H185 menu before changing it."
        ))
    return dict(slot=slot,name=programme.name,
                nominal_minutes=float(met["minutes"]),final_sp=float(met["final_sp"]),
                assumed_start_pv=str(programme.start),
                entry_rows=[e.to_dict() for e in entries],
                setup_proposals=proposals,
                warnings=[
                    "Never energise the heater while learning these controls.",
                    "The commanded SP curve does not guarantee actual PV follows a cooling ramp.",
                    "A parameter absent from the screen may be protected, masked or model-dependent.",
                    "For value edits, press MODE once or wait at least 3 seconds to register a change.",
                    "Do not confuse d.prg (edit), prg (select for RUN), and pgsg (monitor).",
                    "Advanced initial-setting proposals are not validated front-panel keypresses."
                ])

def plain_instructions(plan):
    lines=[f"PROGRAMME {plan['slot']} — {plan['name']}",
           f"{len([r for r in plan['entry_rows'] if r['code']=='styp'])} segments",
           f"Nominal {plan['nominal_minutes']:g} minutes; final SP {plan['final_sp']:g} °C",""]
    section=None
    for row in plan["entry_rows"]:
        if row["section"]!=section:
            section=row["section"];lines.append(section.upper())
        lines.append(f"  {row['code']} = {row['value']} — {row['purpose']}")
        lines.append(f"    {row['instruction']}")
    if plan["setup_proposals"]:
        lines.append("\nPROPOSED CONFIGURATION CHANGES (NOT WRITTEN)")
        for proposal in plan["setup_proposals"]:
            lines.append(f"  {proposal['name']} ({proposal['code']}) — "
                         f"{proposal['current']} → {proposal['proposed']}")
            lines.append("    "+proposal["entry"])
    lines.extend(["","IMPORTANT WARNINGS"]+[f"  • {x}" for x in plan["warnings"]])
    return "\n".join(lines)
