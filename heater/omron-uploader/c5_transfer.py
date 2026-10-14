"""E5CC-T fixed PID-bank (C5) transaction, explicitly selected register writes.

H186: C5 is setting area 0. C5 registers address a specific PID set
without changing the active PID selection. Never write DA or C3 here.
SAVE RAM DATA (3005 05 00) persists setting-area-0 RAM; verify on restart.
"""
from __future__ import annotations
from datetime import datetime,timezone
from pathlib import Path
import json
from controller_inventory import CATALOG
from hardware_profile import supports
from compoway import ProtocolError
from transfer import PreflightError
from settings_transfer import _write_checked_json

SCHEMA="e5cct-c5-pid-receipt-1"
# No guessed variable registers: only the twelve documented C5 offsets.
OFFSETS=frozenset({0,1,2,3,4,7,8,9,10,11,12})
# Offset 5: sensor-resolution-dependent automatic-selection setpoint;
# needs its own verified numeric decoder before enabling it.
ALLOWED=frozenset(f"C5:{pid*16+offset:04X}"
                  for pid in range(8) for offset in OFFSETS
                  if f"C5:{pid*16+offset:04X}" in CATALOG)

def signed(raw):
    return raw-(1<<32) if raw&0x80000000 else raw

def check_value(key,raw):
    if key not in ALLOWED or type(raw) is not int or not 0<=raw<=0xFFFFFFFF:
        raise PreflightError("Unqualified fixed PID register: "+str(key))
    p=CATALOG[key]
    v=signed(raw)
    if not p.minimum<=v<=p.maximum:
        raise PreflightError(f"{key}: raw value outside {p.minimum}..{p.maximum}")
    return raw

def verify_c5_receipt(client,path,model10):
    data=json.loads(Path(path).read_text(encoding="utf-8"))
    if data.get("schema")!=SCHEMA or data.get("model10")!=model10:
        raise PreflightError("Wrong PID-bank receipt or model identity")
    rows=data.get("changes")
    if not isinstance(rows,list) or not rows:
        raise PreflightError("Missing PID-bank changes")
    seen=set()
    for row in rows:
        key=row["register"]
        if key in seen:raise PreflightError("Duplicate PID register")
        seen.add(key)
        check_value(key,row["new_raw"])
        if client.read1("C5",int(key[3:],16))!=row["new_raw"]:
            raise ProtocolError("PID-bank receipt mismatch at "+key)
    return len(rows)

class C5PIDTransfer:
    def __init__(self,client,session,folder,emit=None,hardware=None):
        self.client=client;self.session=session;self.folder=Path(folder)
        self.hardware=hardware
        self.log=emit or (lambda _:None)
        self.preview_data=None;self.baseline_file=None;self.receipt_file=None
        self.ram_touched=False;self.staged=False;self.saved=False;self.cmw_off=False

    def _preflight(self):
        ses=self.session
        if not getattr(self.client,"write_allowed",False):
            raise PreflightError("Read-only USB session")
        if (not ses or not ses.info or not ses.info["model10"].startswith("E5CC-T")
            or not ses.backup_data or not ses.backup_file or
            not ses.backup_file.is_file() or ses.ram_touched or
            ses.staged is not None or ses.committed):
            raise PreflightError("Fresh verified backup and exclusive write session required")
        if json.loads(ses.backup_file.read_text(encoding="utf-8"))!=ses.backup_data:
            raise PreflightError("Saved backup changed")
        if not str(self.client.status()).startswith("01"):
            raise PreflightError("Controller must be RESET/stopped")
        if self.client.read1("C3",0x0007)!=1:
            raise PreflightError("PID-bank editing requires PID control mode")
        sensor=self.client.read1("C3",0x0000)
        if sensor not in (5,6):
            raise PreflightError("Fixed PID parameter scaling not yet checked for this input type")
        return sensor

    def _check_context(self):
        sensor=self._preflight()
        if self.preview_data["input_type"]!=sensor:
            raise PreflightError("Sensor changed since PID bank preview")

    def preview(self,draft):
        if self.preview_data is not None or self.ram_touched:
            raise PreflightError("Another PID-bank attempt exists in this session")
        sensor=self._preflight()
        if not isinstance(draft,dict) or not draft or not set(draft).issubset(ALLOWED):
            raise PreflightError("Select documented fixed PID registers only")
        for key,value in draft.items():
            check_value(key,value)
            if supports(self.hardware,key) is not True:
                raise PreflightError("Unconfirmed hardware applicability: "+key)
            if int(key[3:],16)%16 in (8,9,10,11):
                if self.client.read1("C3",0x0008)!=1:
                    raise PreflightError("Cooling PID values require heating/cooling control")
        # For each PID set touched, check MV min/max together against final
        # live values; do not alter either bound as a hidden side effect.
        for pid in {int(k[3:],16)//16 for k in draft}:
            lo_key=f"C5:{pid*16+4:04X}"
            hi_key=f"C5:{pid*16+3:04X}"
            lo=draft.get(lo_key,self.client.read1("C5",pid*16+4))
            hi=draft.get(hi_key,self.client.read1("C5",pid*16+3))
            if signed(lo)>signed(hi):
                raise PreflightError(f"PID {pid+1}: MV lower limit exceeds upper limit")
        changes=[]
        for key,val in sorted(draft.items()):
            old=self.client.read1("C5",int(key[3:],16))
            check_value(key,old)
            if old!=val:changes.append(dict(register=key,old_raw=old,new_raw=val))
        if not changes:raise PreflightError("No changed PID-bank values")
        data={"schema":"e5cct-c5-pid-preview-1",
              "model10":self.session.info["model10"],
              "read_utc":datetime.now(timezone.utc).isoformat(),
              "input_type":sensor,"changes":changes,
              "source_backup":str(self.session.backup_file),
              "scope":"Selected C5 PID-bank registers only, no DA memory"}
        self.baseline_file=_write_checked_json(self.folder,"c5-pid-before",data)
        self.preview_data=data
        return data

    def _verify(self,field):
        for row in self.preview_data["changes"]:
            k=row["register"]
            if self.client.read1("C5",int(k[3:],16))!=row[field]:
                raise ProtocolError(f"{k}: PID-bank {field} mismatch")

    def stage(self):
        if not self.preview_data or self.ram_touched or self.staged:
            raise PreflightError("Fresh PID-bank preview required; do not retry")
        if json.loads(self.baseline_file.read_text(encoding="utf-8"))!=self.preview_data:
            raise PreflightError("PID baseline file changed")
        self._check_context();self._verify("old_raw")
        self.ram_touched=True;self.session.ram_touched=True
        self.client.operation("00","01")
        self.client.operation("04","01")
        for row in self.preview_data["changes"]:
            self.client.write_setting("C5",int(row["register"][3:],16),row["new_raw"])
            self._verify("new_raw")
        self.staged=True
        return len(self.preview_data["changes"])

    def save_finish(self):
        if not self.staged or self.saved:
            raise PreflightError("Verified PID-bank RAM stage required")
        self._check_context()
        self._verify("new_raw")
        self.client.operation("05","00")
        self.saved=True  # no blind retry after SAVE acknowledgement
        self._verify("new_raw")
        data=dict(schema=SCHEMA,model10=self.preview_data["model10"],
                  saved_utc=datetime.now(timezone.utc).isoformat(),
                  changes=self.preview_data["changes"],
                  input_type=self.preview_data["input_type"],
                  baseline_file=str(self.baseline_file),
                  status="SAVE/readback acknowledged; USB power-cycle check pending")
        self.receipt_file=_write_checked_json(self.folder,"c5-pid-receipt",data)
        self.client.operation("00","00")
        self.cmw_off=True;self.session.ram_touched=False
        return self.receipt_file
