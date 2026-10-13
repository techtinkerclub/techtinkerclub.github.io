"""Read-only E5CC-T controller configuration inspector and OFFLINE setup planner.

Register addresses and interpretation: Omron H186-E1-06, C3/C1 variable lists.
NO functions in this module issue 0102, 3005, RUN, or any hardware write.
This is a selected configuration snapshot, NOT a complete clone of the controller.
"""
from __future__ import annotations
from datetime import datetime, timezone
import json

SCHEMA = "e5cct-setup-snapshot-1"
PLAN_SCHEMA = "e5cct-setup-proposal-1"

def item(code, group, name, menu, explanation, options=None):
    return dict(code=code, group=group, name=name, menu=menu,
                explanation=explanation, options=options)

ALARM = {
    0:"Off", 1:"Upper/lower limit", 2:"Upper limit", 3:"Lower limit",
    4:"Upper/lower range", 5:"Upper/lower limit with standby",
    6:"Upper limit with standby", 7:"Lower limit with standby",
    8:"Absolute upper", 9:"Absolute lower",
    10:"Absolute upper with standby", 11:"Absolute lower with standby",
    12:"Loop burnout (alarm 1 only)", 13:"PV change rate",
    14:"SP absolute upper", 15:"SP absolute lower",
    16:"MV absolute upper", 17:"MV absolute lower",
}
CONFIG = [
    item("C3:0000","Temperature input","Sensor input type","in-t",
         "The correct thermocouple type and range must match the installed probe. Switching 5/6 changes display resolution and can affect setpoint interpretation.",
         {5:"Type K, −200 to 1300 °C, 1 °C resolution",6:"Type K, −20.0 to 500.0 °C, 0.1 °C resolution"}),
    item("C3:0004","Temperature input","Temperature unit","d-u","Display and parameter unit.",{0:"Celsius (°C)",1:"Fahrenheit (°F)"}),
    item("C3:0005","Temperature input","Upper setpoint limit","sl-h","Controller's upper permitted SP. Raw value; display scaling depends on input type."),
    item("C3:0006","Temperature input","Lower setpoint limit","sl-l","Controller's lower permitted SP. Raw value; display scaling depends on input type."),
    item("C3:0007","Control","Control algorithm","cntl","PID modulates SSR duty cycle; ON/OFF uses hysteresis.",{0:"ON/OFF control",1:"2-PID control"}),
    item("C3:0008","Control","Heating/cooling mode","s-hc","Standard means one control direction; heating/cooling combines both.",{0:"Standard (single mode)",1:"Heating and cooling"}),
    item("C3:000A","Control","Heating output period","cp","Seconds of one heater output cycle: −2=0.1 s, −1=0.2 s, 0=0.5 s, 1–99=that many seconds. Verify against SSR electrical and thermal requirements."),
    item("C3:000C","Control","Direct/reverse action","orev","Reverse action is typical for heating. Changing direction can invert control response.",{0:"Reverse (usual heating action)",1:"Direct (usual cooling action)"}),
    item("C3:000D","Alarms","Alarm 1 type","alt1","Type is not the trip threshold; thresholds and physical alarm wiring need a separate audit.",ALARM),
    item("C3:000E","Alarms","Alarm 2 type","alt2","May be unavailable depending on the controller's installed output options.",{k:v for k,v in ALARM.items() if k!=12}),
    item("C3:000F","Alarms","Alarm 3 type","alt3","May be unavailable depending on the controller's installed output options.",{k:v for k,v in ALARM.items() if k!=12}),
    item("C3:00B9","Programme execution","Programme time unit","t-u","Affects programme soak and timing interpretation.",{0:"Hours:minutes",1:"Minutes:seconds"}),
    item("C3:00BA","Programme execution","Programming method","t-pr","Changes interpretation of every programme segment.",{0:"Step-time",1:"Rate-of-rise"}),
    item("C3:00BB","Programme execution","Ramp rate time unit","pru","Slope is in degrees per minute or per hour.",{0:"Per minute",1:"Per hour"}),
    item("C3:00BC","Programme execution","Action in RESET","rtsm","Affects whether control continues in RESET.",{0:"Stop control",1:"Fixed SP operation"}),
    item("C3:00BD","Programme execution","Power-up action","p-on","What the controller requests after restoration of its own supply.",{0:"Continue final SP",1:"RESET",2:"RUN",3:"Manual (if supported)"}),
    item("C3:00BE","Programme execution","Programme-end action","eset","Action after programme completion.",{0:"RESET",1:"Continue at final SP",2:"Fixed SP mode (conditional)"}),
    item("C3:00BF","Programme execution","Starting method","pvst","SP Start and PV Start differ; neither should be changed merely to silence an uploader check.",{0:"SP Start",1:"PV Start"}),
    item("C1:0022","Outputs and failsafe","Output in RESET","mv-r","Output percentage while in RESET; raw value in tenths of a percent, and dependent on control type. STOP status by itself does not prove output zero."),
    item("C1:0023","Outputs and failsafe","Output on sensor/PV error","mv-e","Output percentage on PV error; raw value in tenths of a percent. Confirm independently with the heater isolated."),
]
BY_CODE = {p["code"]:p for p in CONFIG}
# Offline draft changes are limited to discrete values with an explicit H186 meaning.
# Never transmit these changes to an instrument; other settings may depend on them.
DRAFT_CODES = {p["code"] for p in CONFIG if p["options"] is not None}

def signed32(raw):
    return raw - 0x100000000 if raw >= 0x80000000 else raw

def value_text(code, raw):
    if raw is None: return "Not read"
    if type(raw) is not int or not 0 <= raw <= 0xFFFFFFFF:
        return "Invalid raw value"
    value = signed32(raw)
    parameter = BY_CODE[code]
    if parameter["options"] is not None:
        return parameter["options"].get(value, f"Unknown / unsupported ({value})")
    if code == "C3:000A":
        return {-2:"0.1 seconds", -1:"0.2 seconds", 0:"0.5 seconds"}.get(value, f"{value} seconds" if 1<=value<=99 else f"Unknown ({value})")
    if code in ("C1:0022","C1:0023"):
        return f"{value / 10:g}% (conditional on output mode; verify)"
    if code in ("C3:0005","C3:0006"):
        return f"Raw {value} (check thermocouple display scale)"
    return f"Raw {value}"

def read_snapshot(client, identity, preflight=None):
    """Per-address read so unsupported options are shown as unavailable, not zero."""
    fields, errors, changed = {}, {}, {}
    preflight = preflight or {}
    for p in CONFIG:
        key = p["code"]
        type_name, address = key.split(":")
        try:
            # This is deliberately a FRESH controller read, including the original nine.
            # USB inspection happened earlier and is not a substitute for this snapshot.
            fields[key] = client.read1(type_name, int(address, 16))
            old = preflight.get(key)
            if type(old) is int and old != fields[key]:
                changed[key] = {"at_inspection":old, "at_setup_read":fields[key]}
        except Exception as exc:
            fields[key] = None
            errors[key] = f"{type(exc).__name__}: {exc}"
    snapshot = dict(schema=SCHEMA, read_utc=datetime.now(timezone.utc).isoformat(),
                    controller={"model10":identity.get("model10",""),"buffer_bytes":identity.get("buffer_bytes")},
                    fields=fields, errors=errors, changed_since_inspection=changed,
                    scope="Selected C3 and C1 settings only; not a full controller configuration clone.",
                    warning="All reads only. A stopped controller may still drive MV at RESET. USB success is not heater safety.")
    validate_snapshot(snapshot)
    return snapshot

def validate_snapshot(snapshot):
    if not isinstance(snapshot,dict) or snapshot.get("schema")!=SCHEMA:
        raise ValueError("Not an E5CC-T controller setup snapshot")
    model = snapshot.get("controller",{}).get("model10","")
    if not isinstance(model,str) or not model.startswith("E5CC-T"):
        raise ValueError("Snapshot controller identity missing or incompatible")
    fields = snapshot.get("fields")
    if not isinstance(fields,dict) or not fields or set(fields)-set(BY_CODE):
        raise ValueError("Invalid or unrecognised register fields")
    for code, raw in fields.items():
        if raw is not None and (type(raw) is not int or not 0<=raw<=0xFFFFFFFF):
            raise ValueError(f"Bad raw value for {code}")
    return snapshot

def apply_draft(snapshot, draft, code, new_value):
    """Set an offline proposal only; never communicates with controller."""
    validate_snapshot(snapshot)
    if code not in DRAFT_CODES:
        raise ValueError("This setting is review-only: no safe offline proposal defined")
    raw = snapshot["fields"].get(code)
    if raw is None:
        raise ValueError("Cannot propose a change to an unread parameter")
    options = BY_CODE[code]["options"]
    if type(new_value) is not int or new_value not in options:
        raise ValueError("Proposed value is not a documented menu choice")
    out = dict(draft)
    if new_value == signed32(raw):
        out.pop(code,None)
    else:
        out[code] = new_value
    return out

def build_proposal(snapshot, draft):
    validate_snapshot(snapshot)
    if not isinstance(draft,dict): raise ValueError("Invalid draft")
    changes = []
    for code, new_value in sorted(draft.items()):
        if code not in DRAFT_CODES or type(new_value) is not int:
            raise ValueError("Proposal contains unsupported changes")
        old = snapshot["fields"].get(code)
        if old is None or new_value not in BY_CODE[code]["options"]:
            raise ValueError(f"Invalid or unread field {code}")
        if signed32(old) != new_value:
            changes.append({"register":code,"name":BY_CODE[code]["name"],
                            "previous_raw":f"{old:08X}","previous":value_text(code,old),
                            "requested_raw":f"{new_value & 0xffffffff:08X}",
                            "requested":BY_CODE[code]["options"][new_value]})
    return dict(schema=PLAN_SCHEMA, created_utc=datetime.now(timezone.utc).isoformat(),
                controller=snapshot["controller"], source_read_utc=snapshot["read_utc"],
                proposed_changes=changes, controller_writes_performed=False,
                warning="OFFLINE PLAN ONLY. NOT A CONTROLLER UPLOAD OR VERIFIED KEY SEQUENCE. "
                        "Changing sensor type, program mode or action can invalidate SP scaling, alarms, or safety assumptions. "
                        "Have a competent person validate every setting and the electrical design.")

def report(snapshot, draft=None):
    validate_snapshot(snapshot)
    draft = draft or {}
    lines = ["E5CC-T / CONTROLLER SETUP — READ-ONLY SNAPSHOT",
             "Model prefix: "+snapshot["controller"]["model10"],
             "Read UTC: "+snapshot.get("read_utc","unknown"),
             "SELECTED REGISTERS ONLY — NOT A FULL CLONE",""]
    previous = None
    for p in CONFIG:
        if p["group"] != previous:
            previous = p["group"]
            lines += ["",previous.upper()]
        code = p["code"]
        raw = snapshot["fields"].get(code)
        line = f'{p["name"]} [{p["menu"]}, {code}]: {value_text(code,raw)}'
        if code in draft:
            line += f'  => OFFLINE PROPOSAL: {p["options"][draft[code]]}'
        if code in snapshot.get("errors",{}):
            line += "  (unavailable: "+snapshot["errors"][code]+")"
        lines.append(line)
    lines += ["","No controller writes performed. MV in RESET/PV error must be checked independently."]
    return "\n".join(lines)

def write_new_json(path, obj):
    """Never overwrite any previous configuration read or proposal."""
    with open(path, "x", encoding="utf-8") as handle:
        json.dump(obj, handle, indent=2, ensure_ascii=False)
    with open(path, encoding="utf-8") as handle:
        if json.load(handle) != obj: raise IOError("Saved configuration file verification failed")
    return path
