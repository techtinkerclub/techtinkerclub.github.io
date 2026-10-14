"""Guarded single-register configuration transfer for E5CC-T bench commissioning.

First QUALIFICATION TARGET ONLY: Omron H186 adjustment-level Wait Band
(wt-b, C1:0021). NOT a general C1/C3 writer yet. Nothing in this module
starts control, changes alarm/PID/input configuration, or enters area 1.

Procedure: live READ + file backup -> preview -> enable CMW / RAM mode ->
write one C1 value -> independent readback -> explicit SAVE RAM DATA ->
receipt -> physical power-cycle + separate read/receipt verification.
"""
from __future__ import annotations

from datetime import datetime,timezone
from pathlib import Path
import json,hashlib
from compoway import ProtocolError
from transfer import PreflightError

REGISTER="C1:0021"
BANK="C1"
ADDRESS=0x0021
MIN_RAW=0
MAX_RAW=9999
SCHEMA="e5cct-waitband-receipt-1"
BASE_SCHEMA="e5cct-waitband-baseline-1"


def _stamp():
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")

def _write_checked_json(folder,prefix,data):
    folder=Path(folder)
    if not folder.is_dir():
        raise PreflightError("Choose an existing backup directory")
    stamp=_stamp()
    digest=hashlib.sha256(json.dumps(data,sort_keys=True).encode()).hexdigest()[:10]
    output=folder/f"E5CC-T-{prefix}-{stamp}-{digest}.json"
    with output.open("x",encoding="utf-8") as out:
        json.dump(data,out,indent=2,ensure_ascii=False)
    with output.open("r",encoding="utf-8") as src:
        if json.load(src)!=data:
            raise ProtocolError("Configuration evidence file did not survive read-back")
    return output


class WaitBandTransfer:
    """A strictly limited C1:0021 experiment; one preview, stage and save.

    A previous unsaved DA programme session and a settings session may NEVER
    be active simultaneously. The GUI enforces this too.
    """
    def __init__(self,client,programme_session,folder,emit=None):
        self.client=client
        self.programme_session=programme_session
        self.folder=Path(folder)
        self.log=emit or (lambda message:None)
        self.preview_data=None
        self.baseline_file=None
        self.staged=False
        self.ram_touched=False
        self.saved=False
        self.receipt_file=None
        self.cmw_off=False

    def _check_identity_and_stop(self):
        if not self.client.write_allowed:
            raise PreflightError("Read-only USB session. Use isolated-lab launcher")
        main=self.programme_session
        if (main is None or main.backup_data is None or main.backup_file is None
                or not main.backup_file.is_file() or not main.info
                or not main.info["model10"].startswith("E5CC-T")):
            raise PreflightError("Connect and take a current eight-memory backup first")
        if main.mismatches:
            raise PreflightError("Baseline controller settings differ from approved bench configuration")
        if main.ram_touched:
            raise PreflightError("DA programme transfer already touched RAM; do not mix transfers in this session")
        if not str(self.client.status()).startswith("01"):
            raise PreflightError("Controller is not confirmed RESET/stopped. Refusing all settings writes")

    def preview(self,new_raw):
        if self.staged or self.ram_touched or self.saved:
            raise PreflightError("Transfer already started; reconnect after finishing")
        if type(new_raw) is not int or not MIN_RAW<=new_raw<=MAX_RAW:
            raise PreflightError("Wait Band must be a whole 0..9999 raw value")
        self._check_identity_and_stop()
        old=self.client.read1(BANK,ADDRESS)
        if type(old) is not int or not MIN_RAW<=old<=MAX_RAW:
            raise PreflightError("Unrecognised live Wait Band value; no hardware write allowed")
        if old==new_raw:
            raise PreflightError("Proposed Wait Band equals the actual controller value: no write needed")
        document={
            "schema":BASE_SCHEMA,"address":REGISTER,
            "model10":self.programme_session.info["model10"],
            "old_raw":old,"new_raw":new_raw,
            "live_read_utc":datetime.now(timezone.utc).isoformat(),
            "programme_backup":str(self.programme_session.backup_file),
            "warning":"Global for all programmes. CMW OFF or SAVE RAM DATA may persist unrelated pending RAM changes."
        }
        baseline=_write_checked_json(self.folder,"wt-b-before",document)
        self.preview_data=document
        self.baseline_file=baseline
        self.log(f"Read actual {REGISTER}: {old} ({old/10:g} °C); proposed {new_raw} ({new_raw/10:g} °C).")
        self.log("Saved baseline to "+str(baseline))
        return document

    def stage(self):
        """Write C1:0021 to RAM, then read back, but DO NOT save."""
        if self.ram_touched or self.staged or self.saved:
            raise PreflightError("RAM transfer has already been attempted. Inspect hardware before retry.")
        if not self.preview_data or not self.baseline_file or not self.baseline_file.is_file():
            raise PreflightError("Preview live Wait Band and save its baseline first")
        if json.loads(self.baseline_file.read_text(encoding="utf-8"))!=self.preview_data:
            raise PreflightError("Wait Band baseline evidence changed on disk")
        self._check_identity_and_stop()
        old=self.client.read1(BANK,ADDRESS)
        if old!=self.preview_data["old_raw"]:
            raise PreflightError("Live Wait Band changed since preview. Start over; NO write performed.")
        # From here onward ANY serial failure leaves the controller state
        # uncertain, even if the operation command itself times out.
        self.ram_touched=True
        self.client.operation("00","01")  # CMW ON
        self.client.operation("04","01")  # RAM MODE, no EEPROM yet
        self.client.write_setting(BANK,ADDRESS,self.preview_data["new_raw"])
        actual=self.client.read1(BANK,ADDRESS)
        if actual!=self.preview_data["new_raw"]:
            raise ProtocolError(
                f"Wait Band RAM verification failed: expected {self.preview_data['new_raw']:08X}, "
                f"read {actual:08X}. Do NOT blindly retry or save.")
        self.staged=True
        self.log(f"Wait Band RAM staged and verified: {actual/10:g} °C. Not saved nonvolatile.")
        return actual

    def save(self):
        if not self.staged or not self.ram_touched or self.saved:
            raise PreflightError("Save requires verified RAM, and can only be issued once")
        self._check_identity_and_stop()
        new=self.preview_data["new_raw"]
        if self.client.read1(BANK,ADDRESS)!=new:
            raise PreflightError("Wait Band changed since RAM read-back; SAVE prohibited")
        # Save RAM Data can persist unrelated changes. The operator MUST affirm
        # that there are none when clicking the separately confirmed GUI button.
        self.client.operation("05","00")
        self.saved=True  # Latch before readback or file write to forbid double-save.
        after=self.client.read1(BANK,ADDRESS)
        if after!=new:
            raise ProtocolError("SAVE was acknowledged but post-save Wait Band differs. Inspect controller.")
        receipt={
            "schema":SCHEMA,"model10":self.preview_data["model10"],
            "address":REGISTER,
            "original_raw":self.preview_data["old_raw"],
            "written_raw":new,"read_after_save_raw":after,
            "baseline_file":str(self.baseline_file),
            "programme_backup":str(self.programme_session.backup_file),
            "saved_utc":datetime.now(timezone.utc).isoformat(),
            "status":"Save ACK and same-session readback ONLY. Power-cycle retention is not proven.",
            "warning":"Verify with a new read after full USB power cycle, with heater supplies isolated."
        }
        self.receipt_file=_write_checked_json(self.folder,"wt-b-receipt",receipt)
        self.log("SAVE RAM DATA ACK; Wait Band readback correct. Receipt: "+str(self.receipt_file))
        return self.receipt_file

    def disable_cmw(self):
        if not self.saved or self.receipt_file is None or not self.receipt_file.is_file():
            raise PreflightError("Only disable CMW after successful save with on-disk receipt")
        if self.cmw_off:raise PreflightError("CMW already disabled this session")
        if not self.client.status().startswith("01"):
            raise PreflightError("Controller is not stopped")
        self.client.operation("00","00")
        self.cmw_off=True
        self.log("CMW OFF acknowledged. Verify the controller indicator extinguishes.")
        return True


def verify_wait_receipt(client,path,model10):
    """Read-only independent retention verification AFTER a full USB power cycle."""
    data=json.loads(Path(path).read_text(encoding="utf-8"))
    if (data.get("schema")!=SCHEMA or data.get("address")!=REGISTER or
            data.get("model10")!=model10 or
            type(data.get("written_raw")) is not int or
            not MIN_RAW<=data["written_raw"]<=MAX_RAW):
        raise PreflightError("Invalid receipt, parameter, or controller model mismatch")
    value=client.read1(BANK,ADDRESS)
    if value!=data["written_raw"]:
        raise ProtocolError(
            f"Wait Band persistence FAILED: expected {data['written_raw']}, got {value}.")
    return value
