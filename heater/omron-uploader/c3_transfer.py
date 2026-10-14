"""Guarded *experimental* setting-area-1 E5CC-T C3 configuration writer.

H186-E1-06 2-3-8: 3005 07 00 enters setting area 1, which stops
control; returning to area 0 REQUIRES reset or power cycle. SAVE RAM DATA
does NOT document persistence of initial C3 settings, so this implementation
NEVER issues 3005 05 00 for them, NEVER automates reset or RUN, and verifies
persistence only after an operator-confirmed physical power cycle.

Physical heaters must be ISOLATED. Hardware qualification pending.
"""
from __future__ import annotations
from datetime import datetime,timezone
from pathlib import Path
import json
from transfer import PreflightError, PREFLIGHT
from compoway import ProtocolError
from settings_transfer import _write_checked_json
from programme_constraints import effective_limits

SCHEMA="e5cct-c3-configuration-receipt-1"
# Model-specific narrow whitelist. No alarm disabling/output polarity/baud.
SPECS={
    "C3:0000": ("Type K input range/resolution", {5,6}),
    "C3:0007": ("Control algorithm (0=ON/OFF, 1=PID)", {0,1}),
    "C3:0005": ("SP upper limit", None),
    "C3:0006": ("SP lower limit", None),
    "C3:000A": ("Heating output control period", {-2,-1,0,*range(1,100)}),
}
ALLOWED=frozenset(SPECS)

def signed32(raw):
    return raw-(1<<32) if raw & 0x80000000 else raw

def check_setting(key,value):
    if key not in ALLOWED or type(value) is not int or not 0<=value<=0xffffffff:
        raise PreflightError("Unqualified C3 write address or raw value: "+str(key))
    signed=signed32(value)
    allowed=SPECS[key][1]
    if allowed is not None and signed not in allowed:
        raise PreflightError(f"{key}: unsupported parameter encoding ({signed})")
    return value

def validate_draft(draft,live,backup_data):
    if not isinstance(draft,dict) or not draft or set(draft)-ALLOWED:
        raise PreflightError("Only selected C3 initial configuration targets are permitted")
    for key,val in draft.items():check_setting(key,val)
    effective=dict(live,**draft)
    sensor_change=("C3:0000" in draft and draft["C3:0000"]!=live["C3:0000"])
    if sensor_change:
        # Omron can update input type with populated DA memories. Preserve
        # all 1200 words and audit *every* word after controller restart.
        blocks=backup_data.get("programmes",{}) if isinstance(backup_data,dict) else {}
        if (set(blocks)!={str(i) for i in range(8)} or
                any(len(blocks[str(i)])!=150 for i in range(8))):
            raise PreflightError("Complete eight-programme backup required for sensor change")
        # Omron resets SP limits to defaults after input type changes. If the
        # operator overrides them, require both bounds in the same proposal.
        if ({"C3:0005","C3:0006"} & set(draft) and
                not {"C3:0005","C3:0006"}.issubset(draft)):
            raise PreflightError("To override sensor defaults, specify BOTH SP limits")
    if {"C3:0005","C3:0006"} & set(draft):
        try:effective_limits(live,draft,require_readback=True)
        except ValueError as exc:
            raise PreflightError("Proposed SP limits are invalid: "+str(exc)) from exc
    # The controller may clamp/reset stored programme setpoints internally.
    # That is not predictable from this draft; read and compare after reset.
    return sensor_change

def verify_c3_receipt(client,path,model10):
    data=json.loads(Path(path).read_text(encoding="utf-8"))
    if data.get("schema")!=SCHEMA or data.get("model10")!=model10:
        raise PreflightError("Wrong initial-configuration receipt or model")
    rows=data.get("changes")
    if not isinstance(rows,list) or not rows:
        raise PreflightError("Invalid C3 receipt")
    seen=set()
    for row in rows:
        key=row.get("register")
        if key in seen:raise PreflightError("Duplicate configuration receipt entry")
        seen.add(key)
        check_setting(key,row.get("new_raw"))
        if client.read1("C3",int(key[3:],16))!=row["new_raw"]:
            raise ProtocolError(f"{key}: C3 value does not match receipt after reset")
    return len(rows)

class C3ConfigurationTransfer:
    def __init__(self,client,session,folder,emit=None):
        self.client=client;self.session=session;self.folder=Path(folder)
        self.log=emit or (lambda message:None)
        self.preview_data=None;self.baseline_file=None;self.receipt_file=None
        self.area_entered=False;self.write_attempted=False
        self.staged=False;self.finished=False;self.cmw_off=False

    def _preflight(self):
        ses=self.session
        if not getattr(self.client,"write_allowed",False):
            raise PreflightError("Read-only serial connection")
        if (not ses or not ses.info or not ses.info["model10"].startswith("E5CC-T")
                or not ses.backup_data or not ses.backup_file or
                not ses.backup_file.is_file() or ses.staged is not None or
                ses.committed or ses.ram_touched):
            raise PreflightError("Fresh full controller backup and exclusive write session required")
        if json.loads(ses.backup_file.read_text(encoding="utf-8"))!=ses.backup_data:
            raise PreflightError("Controller backup file has changed")
        if not str(self.client.status()).startswith("01"):
            raise PreflightError("Controller must be RESET/stopped")
        # Existing programme safety policy must hold apart from the setting(s)
        # this dedicated configuration transfer explicitly intends to change.
        for address,(expected,_) in PREFLIGHT.items():
            if address in (0x0000,): continue
            if self.client.read1("C3",address)!=expected:
                raise PreflightError(f"Controller safety preflight C3:{address:04X} mismatched")
        raw={f"C3:{i:04X}":self.client.read1("C3",i)
             for i in (0,4,5,6,7,0x0a)}
        if raw["C3:0000"] not in (5,6):
            raise PreflightError("Initial configuration is only qualified for Type K input 5 or 6")
        return raw

    def preview(self,draft):
        if self.preview_data or self.area_entered or self.write_attempted:
            raise PreflightError("Another C3 attempt exists in this session")
        live=self._preflight()
        sensor_change=validate_draft(draft,live,self.session.backup_data)
        changes=[]
        for key,val in sorted(draft.items()):
            current=live.get(key)
            if current is None:raise PreflightError("Missing controller C3 baseline: "+key)
            # Switching K display resolution reinterprets old raw SP limit
            # words even when the integer bits do not change. Explicitly
            # reapply BOTH bounds after writing input type.
            if current!=val or (sensor_change and key in ("C3:0005","C3:0006")):
                changes.append(dict(register=key,old_raw=current,new_raw=val))
        if not changes:raise PreflightError("No changed C3 parameters")
        data={
          "schema":"e5cct-c3-config-preview-1",
          "model10":self.session.info["model10"],
          "read_utc":datetime.now(timezone.utc).isoformat(),
          "changes":changes,"sensor_change":sensor_change,
          "backup_file":str(self.session.backup_file),
          "programme_audit_required":True,
          "setting_defaults_may_change":bool(sensor_change),
          "warning":("Area 1 stops control. C3 changes may be persisted immediately. "
                     "Do not assume RAM-only staging or automatic rollback. "
                     "Power-cycle required to return to area 0.")
        }
        self.baseline_file=_write_checked_json(self.folder,"c3-config-before",data)
        self.preview_data=data
        return data

    def stage(self):
        data=self.preview_data
        if not data or self.area_entered or self.write_attempted or self.staged or self.finished:
            raise PreflightError("A fresh read-only preview is required; no retries")
        if json.loads(self.baseline_file.read_text(encoding="utf-8"))!=data:
            raise PreflightError("C3 backup evidence changed")
        live=self._preflight()
        plan={r["register"]:r["new_raw"] for r in data["changes"]}
        validate_draft(plan,live,self.session.backup_data)
        for row in data["changes"]:
            if live[row["register"]]!=row["old_raw"]:
                raise PreflightError(f"{row['register']} has changed since preview")
        # 3005 07 00 requires communications writing enabled. No automatic
        # reset; the operator must power-cycle to leave area 1.
        self.area_entered=True
        self.client.operation("00","01")
        self.client.operation("07","00")
        for row in data["changes"]:
            self.write_attempted=True
            self.client.write_setting("C3",int(row["register"][3:],16),row["new_raw"])
            got=self.client.read1("C3",int(row["register"][3:],16))
            if got!=row["new_raw"]:
                raise ProtocolError(f"Initial setting {row['register']} readback mismatch")
        self.staged=True
        self.log("C3 changes were written/read back in setting area 1. Persistence is not yet established.")
        return len(data["changes"])

    def finish(self):
        if not self.staged or self.finished or not self.area_entered:
            raise PreflightError("Verified C3 area-1 writes are required")
        for row in self.preview_data["changes"]:
            if self.client.read1("C3",int(row["register"][3:],16))!=row["new_raw"]:
                raise ProtocolError("C3 final readback differs at "+row["register"])
        receipt=dict(schema=SCHEMA,model10=self.preview_data["model10"],
                     changes=self.preview_data["changes"],
                     saved_utc=datetime.now(timezone.utc).isoformat(),
                     baseline_file=str(self.baseline_file),
                     original_programmes=self.session.backup_data["programmes"],
                     sensor_change=self.preview_data["sensor_change"],
                     programme_audit_required=True,
                     status=("C3 written/read back in area 1; hardware persistence "
                             "NOT established. Software reset or power-cycle and complete programme audit required"))
        self.receipt_file=_write_checked_json(self.folder,"c3-config-receipt",receipt)
        self.client.operation("00","00")
        self.cmw_off=True
        self.finished=True
        self.log("CMW OFF; restart and verify full programme memory before another operation.")
        return self.receipt_file
