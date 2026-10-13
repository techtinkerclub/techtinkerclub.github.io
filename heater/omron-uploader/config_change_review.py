"""Pure, non-executable controller configuration change audit for E5C-T.

Designed for five-step workflow Step 5. This module NEVER sends CompoWay/F
commands, attempts serial writes, starts RUN, changes EEPROM or switches area.

H186-E1-06 2-3-8: C3 initial/advanced parameters generally need setting
area 1, C1 operation/protection differs, PID set parameters use C5;
Save RAM Data applies to operation/programme/adjustment/PID values, not
automatically to initial C3 configuration.
"""
from __future__ import annotations
from datetime import datetime, timezone
from controller_inventory import CATALOG,human_value,validate_inventory

SCHEMA="e5cct-config-write-readiness-1"
RISK_ORDER={"high":0,"significant":1,"review":2}

def classify_parameter(key):
    p=CATALOG[key]
    bank=key[:2]
    title=(p.name+" "+p.meaning+" "+p.group).casefold()
    if bank=="C0":
        return dict(risk="review",area="Read-only monitor",
                    note="The E5C-T exposes this value for reading, not a settable parameter.",
                    can_apply=False)
    if bank=="C4":
        return dict(risk="significant",area="Selected programme context",
                    note="C4 depends on selected programme/segment; use separate verified DA editor, not a generic configuration writer.",
                    can_apply=False)
    if key=="C1:0029":
        return dict(risk="high",area="Protection level",
                    note="The password is masked on read; original secret cannot be recovered, compared or restored.",
                    can_apply=False)
    high_terms=("output","fail","sensor","input type","burnout","protection","password",
                "control direction","manual mv","manual output","reset","power-up",
                "run/reset","heating/cooling","communication","serial","protocol",
                "baud","parity","unit number","node number","alarm","ct")
    risk=("high" if any(t in title for t in high_terms)
          else "significant" if bank in ("C3","C9") else "review")
    if bank=="C3":
        area="Initial/advanced setup (setting area 1)"
        note=("Controller setup-area and protection checks are required; modifying some "
              "parameters can reinitialise related settings or interrupt communications. "
              "DA's Save RAM Data procedure does NOT establish how C3 changes persist.")
    elif bank=="C9":
        area="Programless communications / model-dependent"
        note=("Changes concern communications mapping, not heating profiles. "
              "Requires a verified setting area, hardware variant and independent communication-recovery plan.")
    elif bank=="C5":
        area="PID set / setting area 0 (subject to protections)"
        note=("Applies to a particular PID set. Verify tuning units, selected control mode and "
              "controller-specific persistence behaviour before writing.")
    else:
        area="Operation / adjustment / protection (state-dependent)"
        note=("Check current protection, control mode, allowed setting level and parameter-specific "
              "write restrictions before any 0102 command.")
    return dict(risk=risk,area=area,note=note,can_apply=False)

def build_review(snapshot,draft,selected_slot=None,programme_preview=None):
    """Return a human-readable, conservative offline plan. Always non-executable."""
    validate_inventory(snapshot)
    if not isinstance(draft,dict) or set(draft)-set(CATALOG):
        raise ValueError("Proposal has unknown controller parameters")
    if selected_slot is not None and (type(selected_slot) is not int or not 0<=selected_slot<8):
        raise ValueError("Invalid programme memory")
    rows=[]
    for key in sorted(draft):
        old=snapshot["fields"][key]
        raw=draft[key]
        if type(raw) is not int or not 0<=raw<=0xffffffff:
            raise ValueError("Invalid raw proposal value")
        if old is None and snapshot.get("mode")!="offline":
            raise ValueError(f"Current value for {key} was not read; cannot compare safely")
        if old==raw:continue
        p=CATALOG[key]
        flags=classify_parameter(key)
        itype=snapshot["fields"].get("C3:0000")
        rows.append(dict(register=key,group=p.group,name=p.name,
                         actual=human_value(key,old,itype) if old is not None else "Unknown (offline)",
                         proposed=human_value(key,raw,itype),
                         actual_raw=f"{old:08X}" if old is not None else None,
                         proposed_raw=f"{raw:08X}",
                         risk=flags["risk"],required_setting_area=flags["area"],
                         explanation=p.meaning,requirements=flags["note"],
                         approved_for_hardware_write=False))
    rows.sort(key=lambda x:(RISK_ORDER[x["risk"]],x["group"],x["register"]))
    has_initial=bool(rows)
    return dict(schema=SCHEMA,generated_utc=datetime.now(timezone.utc).isoformat(),
                controller=snapshot["controller"],baseline_utc=snapshot["read_utc"],
                programme_slot=selected_slot,
                programme_differences=programme_preview if programme_preview is not None else "Not compared",
                summary={"count":len(rows),"high_risk":sum(x["risk"]=="high" for x in rows),
                         "configuration_usb_writes_enabled":False,
                         "programme_write_locked_by_config_draft":has_initial},
                changes=rows,
                required_validation=[
                    "Verify the complete controller model and fitted output/communications options.",
                    "Reread baseline settings directly from the physical unit before any future write.",
                    "Check protection, setting area, control state, ranges and dependent parameters.",
                    "Validate the appropriate persistence/restart procedure separately for each memory type.",
                    "Apply one documented low-risk parameter in a separate hardware-controlled qualification first.",
                    "Independently verify display, physical terminals/outputs and persistence after USB power cycle.",
                ],
                warning=("OFFLINE REVIEW ONLY. This proposal has NOT been applied. There is no "
                         "C0/C1/C3/C4/C5/C9 communication-writing routine in this release. "
                         "Omron Save RAM Data for DA/PID must not be assumed to save C3/C9."))
def readable_review(plan):
    if plan.get("schema")!=SCHEMA:raise ValueError("Wrong review type")
    lines=["E5CC-T — CONTROLLER CHANGE SAFETY REVIEW (NO WRITES)",
           "Controller prefix: "+str(plan["controller"].get("model10","")),
           "Baseline read: "+plan["baseline_utc"],
           "Configuration modifications requested: "+str(plan["summary"]["count"]),
           "USB writing for configuration: NOT ENABLED",
           "Do not assume a programme transfer will also write these settings.",""]
    for c in plan["changes"]:
        lines.extend([f"{c['register']} — {c['name']} [{c['risk'].upper()}]",
                      f"  Actual: {c['actual']} [{c['actual_raw'] or 'NOT READ'}]",
                      f"  Proposed: {c['proposed']} [{c['proposed_raw']}]",
                      "  Access: "+c["required_setting_area"],
                      "  Restrictions: "+c["requirements"],""])
    lines.append("REQUIRED VERIFICATION BEFORE A FUTURE HARDWARE CONFIGURATION WRITER:")
    lines.extend(" • "+item for item in plan["required_validation"])
    lines.extend(["",plan["warning"]])
    return "\n".join(lines)
