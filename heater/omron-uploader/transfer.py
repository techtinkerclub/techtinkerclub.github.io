"""Safety-gated, two-phase controller transfer. Designed for validation on bench.
Only E5CC-T identity prefix, C3 configuration checks, DA programme writes.
No functions ever energise outputs, change sensor settings, PID, RUN or reset.
"""
from __future__ import annotations
from datetime import datetime,timezone
from pathlib import Path
import hashlib,json
from program_model import Programme,planned_writes,signed,decode_time
from compoway import ProtocolError

# Omron H186 C3 initial setting addresses, read-only preflight.
PREFLIGHT={
  0x0000:(5,"Type K, -200 to 1300°C, whole degrees (observed COM7 bench policy)"),
  0x0004:(0,"Temperature unit °C"),
  0x00B9:(0,"Programme time hours.minutes"),
  0x00BA:(1,"Rate-of-rise programming"),
  0x00BB:(0,"Ramp slope per minute"),
  0x00BC:(0,"RESET stops control"),
  0x00BD:(1,"Power-up enters RESET"),
  0x00BE:(0,"End-of-programme enters RESET"),
  0x00BF:(0,"SP Start (observed COM7 bench policy)"),
}
class PreflightError(RuntimeError):pass

class TransferSession:
    def __init__(self,client,emit=None):
        self.client=client;self.emit=emit or (lambda message:None)
        self.info=None;self.settings=None;self.status=None;self.mismatches=[];self.ram_touched=False;self.backup_data=None
        self.backup_file=None;self.staged=None;self.committed=False;self.receipt_file=None
    def log(self,m):self.emit(m)
    def preflight(self):
        """READ ONLY. Fail closed on any unknown/mismatched value."""
        self.info=self.client.identify()
        model=self.info["model10"]
        if not model.startswith("E5CC-T"):
            raise PreflightError(f"Expected E5CC-T but reported model prefix {model!r}")
        self.status=self.client.status()
        self.settings={f"C3:{addr:04X}":self.client.read1("C3",addr) for addr in PREFLIGHT}
        mismatches=[]
        for addr,(expected,description) in PREFLIGHT.items():
            got=self.settings[f"C3:{addr:04X}"]
            if got!=expected:mismatches.append(f"{description}: expected {expected}, controller returned {signed(got)}")
        self.log("Identified model: "+model+" (10-character ID; verify full suffix on nameplate)")
        self.log("Controller status (raw 0601): "+str(self.status))
        self.mismatches=mismatches
        if mismatches:self.log("READ-ONLY INSPECTION FOUND MISMATCHES (backup remains available; upload forbidden):\n"+"\n".join(mismatches))
        else:self.log("Read-only preflight passed (9 controller settings)")
        return {"model10":model,"status":self.status,"settings":self.settings.copy(),"mismatches":mismatches}
    def backup(self,directory,progress=None):
        """READ ONLY. Back up all 8 DA programme blocks plus nine selected C3 fields.

        Progress callback receives (completed_blocks, 8). The JSON is reopened
        and compared to the collected data before this counts as a successful
        file backup. This is NOT an independent second read of the controller.
        """
        # Fail closed: a fresh backup failure cannot leave an earlier backup
        # authorising a later transfer in this connected session.
        self.backup_data=None
        self.backup_file=None
        if not self.info: self.preflight()
        data={}
        for slot in range(8):
            vals=[]
            for offset in range(0,150,25):
                count=min(25,150-offset)
                chunk=self.client.read("DA",(slot<<8)+offset,count)
                if len(chunk)!=count:
                    raise ProtocolError(f"Incomplete programme {slot}: expected {count} registers at offset {offset}, got {len(chunk)}")
                vals.extend(chunk)
            if len(vals)!=150:raise ProtocolError(f"Incomplete programme {slot} backup")
            data[str(slot)]=[f"{x:08X}" for x in vals]
            self.log(f"Read programme {slot}: 150 registers")
            if progress is not None:progress(slot+1,8)
        timestamp=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        result={"schema":"e5cct-backup-1","read_utc":timestamp,
            "controller":self.info,"status":self.status,"preflight":self.settings,
            "register_type":"DA","programmes":data,
            "scope":"Eight complete DA programme blocks (150 words each) and selected C3 configuration: NOT a complete controller configuration backup",
            "warnings":["Do not edit controller register backups by hand.","Full model suffix is not returned by 0503; verify label."]}
        folder=Path(directory);folder.mkdir(parents=True,exist_ok=True)
        name=f"E5CC-T-programme-backup-{timestamp}-{hashlib.sha256(json.dumps(result,sort_keys=True).encode()).hexdigest()[:8]}.json"
        filepath=folder/name
        with filepath.open("x",encoding="utf-8") as handle:
            json.dump(result,handle,indent=2,ensure_ascii=False)
        # Read the actual on-disk file back. An existing file, interrupted
        # write, malformed JSON, or mismatched payload is NOT a successful save.
        with filepath.open("r",encoding="utf-8") as handle:
            saved=json.load(handle)
        blocks=saved.get("programmes",{})
        if saved!=result or set(blocks)!={str(i) for i in range(8)} or any(len(blocks[str(i)])!=150 for i in range(8)):
            raise ProtocolError("Saved JSON does not match all 8 programme blocks and 9 C3 settings")
        self.backup_data=result;self.backup_file=filepath
        self.log("PASS: 8/8 programmes, 1200 DA registers and 9 selected C3 values saved and checked on disk.")
        self.log("Saved read-only controller programme backup: "+str(filepath))
        return filepath
    def build_plan(self,slot,prog):
        if self.backup_data is None:raise PreflightError("Mandatory backup has not completed")
        if not self.info or not self.settings:raise PreflightError("Preflight incomplete")
        if self.mismatches:raise PreflightError("Controller settings do not match required isolated rate-mode configuration:\n"+"\n".join(self.mismatches))
        if not str(self.status).startswith("01"):raise PreflightError("0601 status does not confirm control stopped; do not write")
        if self.staged is not None:raise PreflightError("Staged changes already exist")
        if not 0<=slot<=7:raise PreflightError("Wrong programme number")
        if prog.finish!="rst":raise PreflightError("Production-intent transfers only allow controller-wide RESET on completion")
        pairs=planned_writes(slot,prog,input_type=self.settings["C3:0000"])
        existing=self.backup_data["programmes"][str(slot)]
        changes=[]
        for a,v in pairs:
            old=int(existing[a&255],16)
            if old!=(v&0xffffffff):changes.append((a,old,v))
        # Only allowlisted ranges. 0x00 count; 0x0e/0x0f repetitions/link;
        # segment 0..31 @ 0x16..0x95, all within chosen programme block.
        allowed={0,0x0e,0x0f}|{0x16+i*4+j for i in range(32) for j in range(4)}
        if any((a>>8)!=slot or (a&255) not in allowed for a,_,_ in changes):raise PreflightError("Write plan includes unknown address")
        return changes
    def stage(self,slot,prog):
        """STAGE TO RAM, READ BACK. Does NOT commit/save nonvolatile memory.
        MUST only be called after operator has deliberately unlocked write mode.
        """
        changes=self.build_plan(slot,prog)
        if not self.client.write_allowed:raise PreflightError("Client write capability locked")
        # Re-read and compare selected target registers vs the original backup
        # to detect another tool/operator changing memory since backup.
        for addr,old,new in changes:
            got=self.client.read1("DA",addr)
            if got!=old:raise PreflightError(f"Memory changed since backup at DA {addr:04X}; abort")
        self.log(f"Baseline unchanged at {len(changes)} target addresses")
        # Check again at the moment of transfer; USB setup-powered controller
        # should report NOT controlling (H186 0601 operating status 01).
        current_status=self.client.status()
        if not current_status.startswith("01"):raise PreflightError("Controller not confirmed stopped at transfer time")
        for addr,(expected,description) in PREFLIGHT.items():
            actual=self.client.read1("C3",addr)
            if actual!=expected:raise PreflightError(f"Controller configuration changed since backup: {description} now {actual}")
        self.client.operation("00","01")  # enable communications writing
        self.client.operation("04","01")  # RAM mode, not flash on each change
        self.ram_touched=True  # latch caution even if an intermediate write fails
        self.log("RAM write mode requested. No nonvolatile save issued.")
        for pos,(addr,old,new) in enumerate(changes,1):
            self.client.write1(addr,new)
            got=self.client.read1("DA",addr)
            if got!=(new&0xffffffff):
                raise ProtocolError(f"Read-back mismatch DA {addr:04X}: expected {new:08X} got {got:08X}")
            if pos%8==0 or pos==len(changes):self.log(f"Staged & read back {pos}/{len(changes)} changed registers")
        self.staged={"slot":slot,"changes":changes,"programme":prog.as_json(),"verified_utc":datetime.now(timezone.utc).isoformat()}
        self.log("RAM staging verified; controller NONVOLATILE MEMORY NOT SAVED")
        return self.staged
    def commit(self):
        """Explicit one-time save of staged, read-back-verified RAM data."""
        if not self.staged:raise PreflightError("No verified RAM staging; cannot commit")
        if self.committed:raise PreflightError("Already committed")
        # Re-verify all touched registers immediately before save.
        for a,_,new in self.staged["changes"]:
            if self.client.read1("DA",a)!=(new&0xffffffff):raise ProtocolError("Changed since staging, save prohibited")
        if not self.client.status().startswith("01"):raise PreflightError("Controller no longer confirmed stopped; save prohibited")
        self.client.operation("05","00") # SAVE RAM DATA per H186
        self.log("Controller acknowledged SAVE RAM DATA (EEPROM/nonvolatile).")
        for a,_,new in self.staged["changes"]:
            if self.client.read1("DA",a)!=(new&0xffffffff):raise ProtocolError("Mismatch after save; inspect controller")
        self.committed=True
        stamp=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        receipt={"schema":"e5cct-upload-receipt-1", "time_utc":stamp,
            "controller_model10":self.info["model10"],"programme_slot":self.staged["slot"],
            "source_backup":str(self.backup_file),
            "changes":[{"address":f"{a:04X}","original":f"{old:08X}","written":f"{new&0xffffffff:08X}"} for a,old,new in self.staged["changes"]],
            "programme":self.staged["programme"],
            "status":"SAVED; persistence after power removal NOT YET TESTED",
            "warning":"Read this receipt back only after unplugging/replugging the USB setup cable with heater power isolated."}
        receipt_path=self.backup_file.parent/f"E5CC-T-upload-receipt-{stamp}-slot{self.staged['slot']}.json"
        with receipt_path.open("x",encoding="utf-8") as f:json.dump(receipt,f,indent=2,ensure_ascii=False)
        self.receipt_file=receipt_path
        self.log("Post-save read-back passed. Receipt: "+str(receipt_path))
        self.log("IMPORTANT: Later power-cycle persistence check still required.")
        return receipt_path

    def verify_persistence(self,receipt_path):
        """READ ONLY. Operator must power-cycle via setup-cable disconnect/reconnect.
        Checks the saved registers match the receipt after reboot. This method
        cannot itself prove that a power cycle has occurred.
        """
        path=Path(receipt_path)
        receipt=json.loads(path.read_text(encoding="utf-8"))
        if receipt.get("schema")!="e5cct-upload-receipt-1":raise PreflightError("Not an Omron upload receipt")
        if not self.info:self.preflight()
        if receipt["controller_model10"]!=self.info["model10"]:raise PreflightError("Controller model prefix different from receipt")
        slot=receipt["programme_slot"]
        if not 0<=slot<=7:raise PreflightError("Invalid receipt slot")
        checks=receipt.get("changes",[])
        if not checks:raise PreflightError("Receipt contains no changes")
        allowed={0,0x0e,0x0f}|{0x16+i*4+j for i in range(32) for j in range(4)}
        for item in checks:
            a=int(item["address"],16);expected=int(item["written"],16)
            if (a>>8)!=slot or (a&255) not in allowed:raise PreflightError("Receipt address not allowed")
            got=self.client.read1("DA",a)
            if got!=expected:raise ProtocolError(f"Persistence mismatch at DA:{a:04X} expected {expected:08X} got {got:08X}")
        verification={"schema":"e5cct-persistence-verification-1",
          "read_utc":datetime.now(timezone.utc).isoformat(),"model10":self.info["model10"],
          "receipt_file":str(path),"registers_checked":len(checks),
          "result":"MATCHED — only if operator confirms controller USB power was physically cycled"}
        checkfile=path.with_name(path.stem+"-verified.json")
        with checkfile.open("x",encoding="utf-8") as f:json.dump(verification,f,indent=2)
        self.log("Persistence comparison passed; verify power cycle was performed. "+str(checkfile))
        return checkfile
