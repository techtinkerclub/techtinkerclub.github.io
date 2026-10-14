"""Read-only full E5CC-T post-configuration programme audit.

Raw DA words are compared across all 8 programme memories. No claim is made
that unchanged raw values have the same physical meaning after changing the
sensor resolution. Audit must finish before commissioning heater outputs.
"""
from __future__ import annotations
from datetime import datetime,timezone
import json
from pathlib import Path
from transfer import PreflightError
from compoway import ProtocolError
from settings_transfer import _write_checked_json

WORDS_PER_SLOT=150
SLOTS=8
MAX_LOGGED_DIFFERENCES=1200

def read_programmes(client):
    result={}
    for slot in range(SLOTS):
        data=[]
        for offset in range(0,WORDS_PER_SLOT,25):
            words=client.read("DA",(slot<<8)|offset,min(25,WORDS_PER_SLOT-offset))
            if len(words)!=min(25,WORDS_PER_SLOT-offset):
                raise ProtocolError(f"Incomplete programme {slot}, offset {offset}")
            data.extend(f"{word:08X}" for word in words)
        if len(data)!=WORDS_PER_SLOT:
            raise ProtocolError(f"Incomplete DA block for programme {slot}")
        result[str(slot)]=data
    return result

def compare_programmes(before,after,*,sensor_changed=False):
    for name,value in (("original",before),("current",after)):
        if (not isinstance(value,dict) or set(value)!={str(i) for i in range(SLOTS)}
                or any(not isinstance(value[str(i)],list) or
                       len(value[str(i)])!=WORDS_PER_SLOT for i in range(SLOTS))):
            raise PreflightError(f"Invalid full {name} eight-programme memory snapshot")
    differences=[]
    for slot in range(SLOTS):
        for offset,(old,new) in enumerate(zip(before[str(slot)],after[str(slot)])):
            if old!=new:
                differences.append({"slot":slot,"offset":offset,
                                    "register":f"DA:{(slot<<8)|offset:04X}",
                                    "before":old,"after":new})
    counts={str(slot):sum(row["slot"]==slot for row in differences)
            for slot in range(SLOTS)}
    return {
        "schema":"e5cct-programme-audit-1",
        "checked_utc":datetime.now(timezone.utc).isoformat(),
        "memory_words_compared":SLOTS*WORDS_PER_SLOT,
        "changes_total":len(differences),
        "changes_by_programme":counts,
        "differences":differences,
        "sensor_resolution_changed":bool(sensor_changed),
        "requires_manual_review":bool(differences or sensor_changed),
        "assessment":(
            "Raw DA values changed; inspect every affected programme before use."
            if differences else
            "No DA raw words changed. Physical temperatures may STILL differ "
            "because input resolution changed; review every stored programme."
            if sensor_changed else
            "All 1200 raw DA words matched; global controller settings may "
            "still affect behaviour and require review."
        ),
    }

def interpreted_temperature_changes(before,after,old_type,new_type):
    """Illustrate what our DA reader would plot; NOT confirmed panel readings.

    Omron internal representation on input-type changes must be checked on
    hardware; preserve the raw values and avoid automatic scaling writes.
    """
    from program_model import signed
    if old_type not in (5,6) or new_type not in (5,6):
        return [],["Unrecognised input scale: programme SP interpretation unavailable"]
    changes=[]
    warnings=[]
    before_scale=1 if old_type==5 else 10
    after_scale=1 if new_type==5 else 10
    for slot in range(SLOTS):
        old=[int(x,16) for x in before[str(slot)]]
        new=[int(x,16) for x in after[str(slot)]]
        count=signed(new[0])
        if count<0 or count>32:
            warnings.append(f"Programme {slot}: invalid segment count {count}; cannot compare temperatures")
            continue
        for seg in range(count):
            base=0x16+4*seg
            kind=signed(new[base])
            if kind not in (0,2):continue  # Only ramp and step carry SP.
            old_c=signed(old[base+1])/before_scale
            new_c=signed(new[base+1])/after_scale
            if old_c!=new_c:
                changes.append({
                  "programme":slot,"segment":seg+1,
                  "register":f"DA:{(slot<<8)|base+1:04X}",
                  "raw_before":before[str(slot)][base+1],
                  "raw_after":after[str(slot)][base+1],
                  "old_interpretation_c":old_c,
                  "new_interpretation_c":new_c,
                  "warning":"Tentative interpretation from our DA decoder; check front-panel SP"
                })
    return changes,warnings

def audit_after_restart(client,receipt_path,model10,folder):
    """Read-only. Persist report even on C3 mismatch, if all DA reads succeed."""
    from c3_transfer import SCHEMA,verify_c3_receipt
    receipt=json.loads(Path(receipt_path).read_text(encoding="utf-8"))
    if receipt.get("schema")!=SCHEMA or receipt.get("model10")!=model10:
        raise PreflightError("Incorrect C3 receipt/controller identity")
    originals=receipt.get("original_programmes")
    if originals is None:
        raise PreflightError("Receipt has no original eight-programme evidence; "
                             "cannot certify a full audit")
    current=read_programmes(client)
    result=compare_programmes(originals,current,
                              sensor_changed=receipt.get("sensor_change",False))
    old_settings=receipt.get("original_settings",{})
    if not isinstance(old_settings,dict):
        raise PreflightError("Malformed original C3 setup snapshot")
    after_settings={}
    setting_differences=[]
    for key,old in sorted(old_settings.items()):
        if not key.startswith("C3:"):continue
        new=client.read1("C3",int(key[3:],16))
        after_settings[key]=new
        if old!=new:
            setting_differences.append({"register":key,"before_raw":old,"after_raw":new})
    intended={row["register"]:row["new_raw"] for row in receipt["changes"]}
    unrequested=[row for row in setting_differences
                 if row["register"] not in intended]
    estimated,interpretation_warnings=interpreted_temperature_changes(
        originals,current,old_settings.get("C3:0000"),
        after_settings.get("C3:0000"))
    result["possible_temperature_interpretation_changes"]=estimated
    result["possible_interpretation_change_count"]=len(estimated)
    result["interpretation_warnings"]=interpretation_warnings
    result["interpretation_is_verified_on_hardware"]=False
    if estimated or interpretation_warnings:
        result["requires_manual_review"]=True
    result["initial_configuration_changes"]=setting_differences
    result["unrequested_global_changes"]=unrequested
    result["current_global_settings"]=after_settings
    result["configuration_side_effects"]=len(unrequested)
    # Comparing the original input resolution with the new one is essential
    # even if all DA words still match bit-for-bit.
    if setting_differences:
        result["requires_manual_review"]=True
    try:
        verified=verify_c3_receipt(client,receipt_path,model10)
    except (ProtocolError,PreflightError) as exc:
        result["configuration_verified"]=False
        result["configuration_error"]=str(exc)
        result["requires_manual_review"]=True
    else:
        result["configuration_verified"]=True
        result["configuration_registers_checked"]=verified
    result["receipt_file"]=str(receipt_path)
    result["model10"]=model10
    result["current_programmes"]=current
    path=_write_checked_json(Path(folder),"c3-restart-audit",result)
    result["audit_file"]=str(path)
    return result
