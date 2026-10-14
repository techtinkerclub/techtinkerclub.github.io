"""Guarded *experimental* setting-area-1 E5CC-T C3 configuration writer.

H186-E1-06 2-3-8: 3005 07 00 enters setting area 1, which stops
control; returning to area 0 REQUIRES reset or power cycle. SAVE RAM DATA
does NOT document persistence of initial C3 settings. This transfer sends
only the C3 values deliberately selected by the user, then reads them back
and disables CMW. A SEPARATE explicit reset workflow can return to area 0;
no C3 edit automatically writes, converts or rescales DA programmes.

Physical heaters must be ISOLATED. Hardware qualification pending.
"""
from __future__ import annotations
from datetime import datetime,timezone
from pathlib import Path
import json
from transfer import PreflightError
from compoway import ProtocolError
from settings_transfer import _write_checked_json
from programme_constraints import effective_limits
from controller_inventory import CATALOG
from hardware_profile import supports

SCHEMA="e5cct-c3-configuration-receipt-1"
# Model-specific narrow whitelist. No alarm disabling/output polarity/baud.
SPECS={
    "C3:0000": ("Documented sensor/analogue input selection", set(range(30))),
    "C3:0007": ("Control algorithm (0=ON/OFF, 1=PID)", {0,1}),
    "C3:0005": ("SP upper limit", None),
    "C3:0006": ("SP lower limit", None),
    "C3:000A": ("Heating output control period", {-2,-1,0,*range(1,100)}),
}
# Hardware-supported, documented area-1 values may be edited as front-panel
# parameters. Keep self-disconnecting serial settings and changed RESET
# semantics in a dedicated path with explicit recovery handling.
_DEDICATED=frozenset({
    "C3:0010","C3:0011","C3:0012","C3:0013","C3:0014",
    "C3:004C","C3:004D","C3:0096","C3:0097","C3:0098",
    "C3:0099","C3:009A","C3:009B",
    "C3:00BC","C3:00BD",
})
for _code,_p in CATALOG.items():
    if (not _code.startswith("C3:") or _code in SPECS or
        _code in _DEDICATED or not _p.access.startswith("documented R/W")):
        continue
    if _p.options is not None:
        SPECS[_code]=(_p.name,frozenset(_p.options))
    elif _p.minimum is not None and _p.maximum is not None and _p.maximum<=0x7fffffff:
        SPECS[_code]=(_p.name,(_p.minimum,_p.maximum))
ALLOWED=frozenset(SPECS)

def signed32(raw):
    return raw-(1<<32) if raw & 0x80000000 else raw

def check_setting(key,value):
    if key not in ALLOWED or type(value) is not int or not 0<=value<=0xffffffff:
        raise PreflightError("Unqualified C3 write address or raw value: "+str(key))
    signed=signed32(value)
    allowed=SPECS[key][1]
    if isinstance(allowed,tuple):
        if not allowed[0]<=signed<=allowed[1]:
            raise PreflightError(f"{key}: outside documented raw range {allowed}")
    elif allowed is not None and signed not in allowed:
        raise PreflightError(f"{key}: unsupported parameter encoding ({signed})")
    return value

def validate_draft(draft,live,backup_data):
    if not isinstance(draft,dict) or not draft or set(draft)-ALLOWED:
        raise PreflightError("Only selected C3 initial configuration targets are permitted")
    for key,val in draft.items():check_setting(key,val)
    effective=dict(live,**draft)
    sensor_change=("C3:0000" in draft and draft["C3:0000"]!=live["C3:0000"])
    if sensor_change:
        # No DA programme writes or local scaling: only selected C3 values
        # are sent. Preserve the raw programme backup for optional diagnostics.
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
    # The controller handles any internal defaults/limit changes. We only
    # validate the supplied C3 values, never recalculate DA programmes.
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
    def __init__(self,client,session,folder,emit=None,hardware=None):
        self.client=client;self.session=session;self.folder=Path(folder)
        self.hardware=hardware
        self.log=emit or (lambda message:None)
        self.preview_data=None;self.baseline_file=None;self.receipt_file=None
        self.area_entered=False;self.write_attempted=False
        self.staged=False;self.finished=False;self.cmw_off=False

    def _preflight(self, extra=()):
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
        # This is a GLOBAL setting editor, not the DA programme uploader.
        # Do not impose unrelated programme-method defaults (time units,
        # slope units, end action, etc.) on otherwise valid C3 changes.
        # Confirm only the relevant display/RESET safety assumptions.
        conditions={0x0004:0,0x00BC:0,0x00BD:1}
        for address,expected in conditions.items():
            actual=self.client.read1("C3",address)
            if actual!=expected:
                raise PreflightError(
                    f"Global configuration not qualified with C3:{address:04X}"
                    f"={signed32(actual)}; expected {expected}")
        addresses={0,4,5,6,7,0x0a} | {
            int(k.split(":",1)[1],16) for k in extra
        }
        raw={f"C3:{i:04X}":self.client.read1("C3",i)
             for i in sorted(addresses)}
        return raw

    def preview(self,draft):
        if self.preview_data or self.area_entered or self.write_attempted:
            raise PreflightError("Another C3 attempt exists in this session")
        for key in draft:
            if supports(self.hardware,key) is not True:
                raise PreflightError(
                    f"{key}: confirm full nameplate model and fitted option")
        live=self._preflight(draft)
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
          "original_settings":live,
          "backup_file":str(self.session.backup_file),
          "programme_audit_available":True,
          "setting_defaults_may_change":bool(sensor_change),
          "write_scope":"Exactly the changed C3 registers; never DA programme memory",
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
        live=self._preflight(r["register"] for r in data["changes"])
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
                     original_settings=self.preview_data["original_settings"],
                     sensor_change=self.preview_data["sensor_change"],
                     programme_audit_available=True,
                     write_scope="C3-only, no DA register writes",
                     status=("C3 written/read back in area 1; hardware persistence "
                             "NOT established. Software reset or power-cycle and complete programme audit required"))
        self.receipt_file=_write_checked_json(self.folder,"c3-config-receipt",receipt)
        self.client.operation("00","00")
        self.cmw_off=True
        self.finished=True
        self.log("CMW OFF; restart and verify full programme memory before another operation.")
        return self.receipt_file
