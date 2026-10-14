"""Guarded, hardware-*experimental* E5CC-T setup-area-0 adjustment writes.

These are selected C1 targets, never an arbitrary-variable writer. Supports
one or several selected settings with ONE SAVE RAM DATA and checked receipt.
It never changes C3 initial settings, RUN/RESET, PID selection or setting areas.
The controller must be stopped with heating supplies physically isolated.

H186-E1-06 §2-3-8 documents C1 as setup area 0 and SAVE RAM DATA for adjustment
and PID. The exact listed new C1 targets require bench qualification.
"""
from __future__ import annotations
from datetime import datetime,timezone
import json
from pathlib import Path
from compoway import ProtocolError
from transfer import PreflightError,PREFLIGHT,matches_preflight
from settings_transfer import _write_checked_json

SCHEMA="e5cct-c1-settings-receipt-1"
# Bounds are raw Omron signed integer values; not engineering/display units.
# Mode 1 = PID, 0 = ON/OFF as reported by C3:0007.
C1_SPECS={
    "C1:0015":(1,9999,1,"Proportional band (selected PID set)"),
    "C1:0016":(0,9999,1,"Integral time (selected PID set)"),
    "C1:0017":(0,9999,1,"Derivative time (selected PID set)"),
    "C1:001B":(1,9999,0,"Heating hysteresis in ON/OFF mode"),
    "C1:0021":(0,9999,None,"Global Wait Band"),
}
PID_CODES=frozenset({"C1:0015","C1:0016","C1:0017"})
PID_C5_OFFSETS={"C1:0015":0,"C1:0016":1,"C1:0017":2}

def fixed_pid_address(key,pid):
    if key not in PID_C5_OFFSETS or type(pid) is not int or not 1<=pid<=8:
        raise PreflightError("Invalid fixed PID register target")
    return (pid-1)*0x10+PID_C5_OFFSETS[key]

QUALIFIED_C1_CODES=frozenset(C1_SPECS)

def signed(raw):
    return raw-0x100000000 if raw>=0x80000000 else raw

def check_value(key,value):
    if key not in C1_SPECS:
        raise PreflightError(f"Unqualified controller setting: {key}")
    if type(value) is not int or not 0<=value<=0xffffffff:
        raise PreflightError(f"{key}: expected unsigned 32-bit raw value")
    low,high,_,_=C1_SPECS[key]
    if not low<=signed(value)<=high:
        raise PreflightError(f"{key}: value outside supported raw range {low}..{high}")
    return value

def validate_set(draft,mode):
    if not isinstance(draft,dict) or not draft:
        raise PreflightError("Select at least one qualified adjustment setting")
    if type(mode) is not int or mode not in (0,1):
        raise PreflightError("Control algorithm must be read and recognised")
    for key,value in draft.items():
        check_value(key,value)
        _,_,required_mode,_=C1_SPECS[key]
        if required_mode is not None and mode!=required_mode:
            raise PreflightError(f"{key} requires {'PID' if required_mode else 'ON/OFF'} control mode")
    return True

def _validated_receipt(path,model10):
    data=json.loads(Path(path).read_text(encoding="utf-8"))
    if data.get("schema")!=SCHEMA or data.get("model10")!=model10:
        raise PreflightError("Wrong C1 receipt schema or connected model prefix")
    changes=data.get("changes")
    if not isinstance(changes,list) or not changes:
        raise PreflightError("Empty settings receipt")
    seen=set()
    for row in changes:
        key=row.get("register")
        if key in seen or key not in C1_SPECS:
            raise PreflightError("Unexpected or repeated parameter in receipt")
        seen.add(key)
        check_value(key,row.get("written_raw"))
    return data

def verify_c1_receipt(client,path,model10):
    """No writes. User must actually power-cycle before claiming persistence."""
    data=_validated_receipt(path,model10)
    if client.read1("C3",0x0007)!=data.get("control_mode"):
        raise PreflightError("Control algorithm changed since the original SAVE")
    if data.get("pid_set") is not None:
        if client.read1("C0",0x000D)!=data["pid_set"]:
            raise PreflightError("Active PID set differs from the saved receipt; cannot compare")
    for row in data["changes"]:
        key=row["register"];expected=row["written_raw"]
        if client.read1("C1",int(key[3:],16))!=expected:
            raise ProtocolError(f"{key}: saved receipt does not match live controller")
        if key in PID_CODES:
            if client.read1("C5",fixed_pid_address(key,data["pid_set"]))!=expected:
                raise ProtocolError(f"{key}: fixed PID-set C5 register differs from receipt")
    return len(data["changes"])

class C1SettingsTransfer:
    def __init__(self,client,programme_session,folder,emit=None):
        self.client=client
        self.session=programme_session
        self.folder=Path(folder)
        self.log=emit or (lambda _:None)
        self.preview_data=None
        self.baseline_file=None
        self.ram_touched=False
        self.staged=False
        self.saved=False
        self.cmw_off=False
        self.receipt_file=None

    def _preflight(self):
        ses=self.session
        if not getattr(self.client,"write_allowed",False):
            raise PreflightError("Read-only USB session")
        if (not ses or not ses.info or not ses.info["model10"].startswith("E5CC-T")
                or not ses.backup_data or not ses.backup_file
                or not ses.backup_file.is_file() or ses.mismatches
                or ses.staged is not None or ses.committed):
            raise PreflightError("Fresh compatible eight-programme backup and known bench setup required")
        if ses.ram_touched and not self.ram_touched:
            raise PreflightError("Another write has touched controller RAM; reconnect first")
        try:
            if json.loads(ses.backup_file.read_text(encoding="utf-8"))!=ses.backup_data:
                raise PreflightError("Saved baseline changed; stop")
        except (OSError,ValueError) as exc:
            raise PreflightError("Cannot verify original controller backup") from exc
        if not str(self.client.status()).startswith("01"):
            raise PreflightError("Controller is not confirmed RESET/stopped")
        for address,(expected,meaning) in PREFLIGHT.items():
            if not matches_preflight(address,self.client.read1("C3",address),expected):
                raise PreflightError(f"Controller setup changed at C3:{address:04X} ({meaning})")
        mode=self.client.read1("C3",0x0007)
        if mode not in (0,1):
            raise PreflightError("Unrecognised PID/ON-OFF control mode")
        return mode

    def _pid_context(self,keys):
        if any(k in PID_CODES for k in keys):
            pid=self.client.read1("C0",0x000D)
            if type(pid) is not int or not 1<=pid<=8:
                raise PreflightError("Selected PID-set monitor is unreadable or invalid")
            # C1 P/I/D address selection is context-dependent; C5 is fixed
            # per PID set. Refuse unless both banks refer to the same values.
            for key in keys:
                if key in PID_CODES:
                    c1=self.client.read1("C1",int(key[3:],16))
                    c5=self.client.read1("C5",fixed_pid_address(key,pid))
                    if c1!=c5:
                        raise PreflightError(
                            f"PID {pid} {key}: C1 current context differs from "
                            "fixed C5 PID-set value. No write permitted.")
            return pid
        return None

    def _check_context(self):
        data=self.preview_data
        mode=self._preflight()
        validate_set({row["register"]:row["new_raw"] for row in data["changes"]},mode)
        if mode!=data["control_mode"]:
            raise PreflightError("Controller control mode changed since preview")
        if data["pid_set"] is not None and self.client.read1("C0",0x000D)!=data["pid_set"]:
            raise PreflightError("Active PID set changed; refusing to write a different set")
        if self._pid_context([r["register"] for r in data["changes"]])!=data["pid_set"]:
            raise PreflightError("Selected PID context changed; refusing another PID set")

    def preview(self,draft):
        if self.preview_data is not None or self.ram_touched:
            raise PreflightError("Preview already exists; reconnect before new attempt")
        mode=self._preflight()
        validate_set(draft,mode)
        pid_set=self._pid_context(draft)
        changes=[]
        for key,new in sorted(draft.items()):
            old=self.client.read1("C1",int(key[3:],16))
            check_value(key,old)
            if old!=new:
                changes.append(dict(register=key,old_raw=old,new_raw=new))
        if not changes:
            raise PreflightError("Controller already has these values; no write required")
        data={
            "schema":"e5cct-c1-settings-preview-1",
            "model10":self.session.info["model10"],
            "read_utc":datetime.now(timezone.utc).isoformat(),
            "control_mode":mode,"pid_set":pid_set,
            "changes":changes,
            "programme_backup":str(self.session.backup_file),
            "warning":"These adjustment settings affect current control behaviour. No DA programme changes included."
        }
        self.baseline_file=_write_checked_json(self.folder,"c1-before",data)
        self.preview_data=data
        return data

    def _check_values(self,field):
        for row in self.preview_data["changes"]:
            key=row["register"]
            if self.client.read1("C1",int(key[3:],16))!=row[field]:
                raise ProtocolError(f"{key} live value differs from {field}")
            if key in PID_CODES:
                pid=self.preview_data["pid_set"]
                if self.client.read1("C5",fixed_pid_address(key,pid))!=row[field]:
                    raise ProtocolError(
                        f"PID set {pid}, {key}: fixed C5 value differs from {field}")

    def stage(self):
        if not self.preview_data or self.staged or self.ram_touched or self.saved:
            raise PreflightError("Fresh checked preview required; transfer can only be attempted once")
        if json.loads(self.baseline_file.read_text(encoding="utf-8"))!=self.preview_data:
            raise PreflightError("Settings baseline changed since preview")
        self._check_context()
        self._check_values("old_raw")
        self.ram_touched=True
        self.session.ram_touched=True
        self.client.operation("00","01")  # CMW ON
        self.client.operation("04","01")  # RAM mode
        for row in self.preview_data["changes"]:
            self.client.write_setting("C1",int(row["register"][3:],16),row["new_raw"])
        self._check_values("new_raw")
        self.staged=True
        return len(self.preview_data["changes"])

    def save_finish(self):
        if not self.staged or not self.ram_touched or self.saved:
            raise PreflightError("Only one SAVE after fully verified RAM staging")
        self._check_context()
        self._check_values("new_raw")
        self.client.operation("05","00")
        self.saved=True   # ACKed: never reissue if readback/receipt/CMW fails
        self._check_values("new_raw")
        data=self.preview_data
        receipt={
            "schema":SCHEMA,"model10":data["model10"],
            "saved_utc":datetime.now(timezone.utc).isoformat(),
            "control_mode":data["control_mode"],"pid_set":data["pid_set"],
            "changes":[dict(register=r["register"],original_raw=r["old_raw"],
                            written_raw=r["new_raw"]) for r in data["changes"]],
            "baseline_file":str(self.baseline_file),
            "status":"SAVE and same-session readback acknowledged; power-cycle retention unproven"
        }
        self.receipt_file=_write_checked_json(self.folder,"c1-receipt",receipt)
        self.client.operation("00","00")
        self.cmw_off=True
        self.session.ram_touched=False
        return self.receipt_file
