"""E5CC-T parameter-write qualification plan (NO CompoWay/F operations).

H186-E1-06 §§2-2-3, 2-3-8:
 C0 is read-only. C1/C4/C5/DA are setting area 0; C3/C9 are area 1.
 SAVE RAM DATA explicitly covers operation/programme/adjustment/PID levels.
 Initial configuration needs a separate setup-area and persistence strategy.

The existence of an H186 R/W address never grants runtime write permission.
"""
from __future__ import annotations
from dataclasses import dataclass
from controller_inventory import CATALOG, validate_inventory, human_value

SOURCE="Omron H186-E1-06 sections 2-2-3, 2-3-8 and 3-1"
APPROVED_SETTING_REGISTERS=frozenset({"C1:0021"})

@dataclass(frozen=True)
class WriteRequirements:
    key: str
    area: str
    category: str
    persistence: str
    qualification: str
    note: str
    allowed_in_current_app: bool=False

def requirements(key):
    if key not in CATALOG:
        raise ValueError("Unrecognised documented register: "+str(key))
    bank=key.split(":",1)[0]
    if bank=="C0":
        return WriteRequirements(key,"0","read-only","not applicable","never",
                                 "Operating monitor; do not attempt to write.")
    if key=="C1:0029":
        return WriteRequirements(key,"0","protection secret","not verifiable","excluded",
                                 "Password reads as zero; readback and rollback cannot verify the original.")
    if key in APPROVED_SETTING_REGISTERS:
        return WriteRequirements(key,"0","adjustment","SAVE RAM DATA","bench-pilot",
                                 "Global Wait Band: affects progression of all eight programmes.",
                                 True)
    if bank=="C1":
        return WriteRequirements(key,"0","adjustment / operation / protection",
                                 "SAVE RAM DATA if applicable","requires-hardware-qualification",
                                 "Check protection, operating level, modes, range and output effects.")
    if bank=="C5":
        return WriteRequirements(key,"0","PID selected-set context","SAVE RAM DATA",
                                 "requires-hardware-qualification",
                                 "Correct PID set selection, resolution and readback must be verified.")
    if bank=="C4":
        return WriteRequirements(key,"0","current programme selection",
                                 "SAVE RAM DATA","use-DA-programme-editor",
                                 "C4 addresses depend on selected programme/segment; use the qualified DA editor.")
    if bank=="C3":
        if key=="C3:0000":
            detail=("Sensor input type/range affects decimal resolution, limits, "
                    "alarm values and all DA programme setpoints. Revalidate after change.")
        else:
            detail=("Initial or advanced setup may change behaviour, reset related settings "
                    "or require a restart. Verify hardware options and effects.")
        return WriteRequirements(key,"1","initial / advanced / communications",
                                 "separate area-1 persistence; restart or power-cycle qualification",
                                 "requires-hardware-qualification",detail)
    if bank=="C9":
        return WriteRequirements(key,"1","communications / option-dependent",
                                 "separate area-1 persistence; reconnection may be necessary",
                                 "requires-hardware-qualification",
                                 "Communications configuration changes may interrupt the USB link.")
    raise ValueError("Unknown controller variable bank")

def create_write_plan(snapshot,draft,*,programme_changed=False,include_programme=False):
    """Report every requested change, including blocked items; never send writes."""
    validate_inventory(snapshot)
    if not isinstance(draft,dict) or set(draft)-set(CATALOG):
        raise ValueError("Draft contains unknown register")
    rows=[]
    for key,raw in sorted(draft.items()):
        r=requirements(key)
        old=snapshot["fields"].get(key)
        if type(raw) is not int or not 0<=raw<=0xffffffff:
            raise ValueError("Invalid encoded 32-bit proposed value at "+key)
        if old is None and snapshot.get("mode")!="offline":
            raise ValueError("Controller register was not read: "+key)
        rows.append({
            "register":key,"name":CATALOG[key].name,"previous_raw":old,
            "proposed_raw":raw,"setting_area":r.area,"family":r.category,
            "persistence":r.persistence,"qualification":r.qualification,
            "reason":r.note,"usb_writable":r.allowed_in_current_app,
        })
    blocked=[row for row in rows if not row["usb_writable"]]
    qualified=[row for row in rows if row["usb_writable"]]
    combined=bool(programme_changed and include_programme)
    combined_eligible=bool(combined and len(rows)==1 and rows[0]["register"]=="C1:0021")
    if include_programme and not programme_changed:
        raise ValueError("Cannot include an unchanged programme")
    if combined and not combined_eligible:
        status="blocked: proposed settings cannot be combined with DA programme memory"
    elif blocked:
        status="blocked: at least one setting requires hardware qualification"
    elif combined_eligible:
        status="combined C1 Wait Band + DA pilot eligible subject to live preflight"
    elif qualified:
        status="qualified setting-only pilot eligible subject to live preflight"
    elif programme_changed:
        status="DA programme-only path; requires live preflight"
    else:
        status="no pending changes"
    groups={"0":[],"1":[]}
    for row in rows: groups[row["setting_area"]].append(row["register"])
    return {
        "schema":"e5cct-parameter-write-qualification-plan-1",
        "scope":"Read-only planning; no communications writes issued",
        "controller_prefix":snapshot["controller"].get("model10"),
        "source":SOURCE,"parameters":rows,"blocked":blocked,"qualified":qualified,
        "setting_area_0":groups["0"],"setting_area_1":groups["1"],
        "programme_changed":bool(programme_changed),
        "programme_explicitly_included":bool(include_programme),
        "combined_qualified":combined_eligible,
        "all_changes_usb_writable":not blocked and (not combined or combined_eligible),
        "status":status,
        "warning":("C3/C9 writes require setup area 1 and a distinct persistence/"
                   "restart procedure; they MUST NOT be processed by the DA/C1 "
                   "SAVE RAM DATA sequence. Actual full model suffix needs nameplate confirmation.")
    }
