"""Isolated-lab E5CC-T trial: one C1 Wait Band + one DA programme SAVE.

Explicitly *not* a generic configuration writer.  C3 input/alarm/PID writes
remain prohibited. This shared state machine stages both qualified targets
under one CMW/RAM session, reads back both, issues one SAVE RAM DATA, then
disables CMW only after a durable receipt and successful post-save checks.
"""
from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path
from compoway import ProtocolError
from settings_transfer import _write_checked_json, MIN_RAW, MAX_RAW
from transfer import PreflightError, PREFLIGHT

SCHEMA = "e5cct-combined-upload-receipt-1"

class CombinedTransfer:
    def __init__(self, client, session, folder, emit=None):
        self.client = client
        self.session = session
        self.folder = Path(folder)
        self.log = emit or (lambda message: None)
        self.preview_data = None
        self.baseline_file = None
        self.ram_touched = False
        self.staged = False
        self.saved = False
        self.cmw_off = False
        self.receipt_file = None

    def _preflight(self):
        ses = self.session
        if not self.client.write_allowed:
            raise PreflightError("Read-only session: combined transfer requires isolated-lab mode")
        if (not ses or not ses.info or not ses.info["model10"].startswith("E5CC-T")
                or ses.backup_data is None or ses.backup_file is None
                or not ses.backup_file.is_file() or ses.mismatches
                or ses.staged is not None or ses.committed):
            raise PreflightError("Fresh compatible eight-memory backup and verified preflight required")
        if not self.client.status().startswith("01"):
            raise PreflightError("Controller must be RESET/stopped for combined transfer")
        for address, (expected, label) in PREFLIGHT.items():
            actual = self.client.read1("C3", address)
            if actual != expected:
                raise PreflightError(f"Changed controller preflight C3:{address:04X} ({label})")
        if ses.ram_touched and not self.ram_touched:
            raise PreflightError("Another RAM write already occurred in this USB connection")

    def preview(self, slot, programme, new_wait):
        if self.preview_data or self.ram_touched or self.staged or self.saved:
            raise PreflightError("Combined preview already exists; reconnect before a new attempt")
        self._preflight()
        if type(new_wait) is not int or not MIN_RAW <= new_wait <= MAX_RAW:
            raise PreflightError("Wait Band raw value must be 0..9999")
        old_wait = self.client.read1("C1", 0x0021)
        if type(old_wait) is not int or not MIN_RAW <= old_wait <= MAX_RAW:
            raise PreflightError("Cannot verify original Wait Band")
        if old_wait == new_wait:
            raise PreflightError("Wait Band already matches; use programme-only transfer")
        changes = self.session.build_plan(slot, programme, planned_wait_band=new_wait)
        if not changes:
            raise PreflightError("Programme already matches; use Wait Band-only transfer")
        document = {
            "schema": "e5cct-combined-preview-1",
            "model10": self.session.info["model10"],
            "programme_slot": slot,
            "programme": programme.as_json(),
            "programme_changes": [{"address": a, "old": old, "new": new & 0xffffffff}
                                  for a, old, new in changes],
            "wait_band": {"address": "C1:0021", "old": old_wait, "new": new_wait},
            "programme_backup": str(self.session.backup_file),
            "read_utc": datetime.now(timezone.utc).isoformat(),
            "warning": "One SAVE may persist unrelated RAM changes; verify heater isolation."
        }
        baseline = _write_checked_json(self.folder, "combined-before", document)
        self.preview_data = document
        self.baseline_file = baseline
        self.log(f"Combined read-only preview: Wait Band {old_wait}->{new_wait}; "
                 f"programme {slot}: {len(changes)} DA register changes")
        return document

    def _verify_values(self):
        data = self.preview_data
        if self.client.read1("C1", 0x0021) != data["wait_band"]["new"]:
            raise ProtocolError("Combined Wait Band readback mismatch")
        for row in data["programme_changes"]:
            if self.client.read1("DA", row["address"]) != row["new"]:
                raise ProtocolError(f"Combined DA readback mismatch at {row['address']:04X}")

    def stage(self):
        if not self.preview_data or self.ram_touched or self.staged or self.saved:
            raise PreflightError("Read + Preview first; cannot stage more than once")
        if json.loads(self.baseline_file.read_text(encoding="utf-8")) != self.preview_data:
            raise PreflightError("Combined baseline file has changed since preview")
        self._preflight()
        data = self.preview_data
        if self.client.read1("C1", 0x0021) != data["wait_band"]["old"]:
            raise PreflightError("Wait Band changed since preview: no write performed")
        for row in data["programme_changes"]:
            if self.client.read1("DA", row["address"]) != row["old"]:
                raise PreflightError(f"DA changed since preview at {row['address']:04X}")
        # Latch uncertain state BEFORE any operation that can change controller RAM.
        self.ram_touched = True
        self.session.ram_touched = True
        self.client.operation("00", "01")  # CMW ON
        self.client.operation("04", "01")  # RAM write mode
        self.client.write_setting("C1", 0x0021, data["wait_band"]["new"])
        for row in data["programme_changes"]:
            self.client.write1(row["address"], row["new"])
        self._verify_values()
        self.staged = True
        self.log("Combined C1 and DA RAM staging verified; nonvolatile SAVE not yet issued")
        return True

    def save_finish(self):
        if not self.staged or not self.ram_touched or self.saved:
            raise PreflightError("Combined SAVE requires one verified RAM stage")
        self._preflight()
        self._verify_values()
        self.client.operation("05", "00")  # One nonvolatile SAVE RAM DATA
        self.saved = True  # Latch immediately after ACK; never auto-save twice.
        self._verify_values()
        data = self.preview_data
        receipt = {
            "schema": SCHEMA,
            "model10": data["model10"],
            "programme_slot": data["programme_slot"],
            "programme_changes": data["programme_changes"],
            "wait_band": data["wait_band"],
            "source_backup": data["programme_backup"],
            "baseline_file": str(self.baseline_file),
            "saved_utc": datetime.now(timezone.utc).isoformat(),
            "status": "SAVE acknowledged and post-save readback matched; power-cycle retention unproven"
        }
        self.receipt_file = _write_checked_json(self.folder, "combined-receipt", receipt)
        # Never switch CMW OFF after a failed SAVE/readback/receipt.
        self.client.operation("00", "00")
        self.cmw_off = True
        self.session.ram_touched = False
        self.log("Combined SAVE readback and receipt verified; CMW OFF acknowledged")
        return self.receipt_file


def verify_combined_receipt(client, path, model10):
    """Read-only comparison; actual physical power cycle must be confirmed by user."""
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if data.get("schema") != SCHEMA or data.get("model10") != model10:
        raise PreflightError("Wrong combined receipt or controller model")
    slot = data.get("programme_slot")
    if type(slot) is not int or not 0 <= slot <= 7:
        raise PreflightError("Invalid combined receipt slot")
    wait = data.get("wait_band", {})
    expected = wait.get("new")
    if wait.get("address") != "C1:0021" or type(expected) is not int or not 0 <= expected <= 9999:
        raise PreflightError("Invalid combined receipt Wait Band")
    if client.read1("C1", 0x0021) != expected:
        raise ProtocolError("Saved Wait Band differs from combined receipt")
    rows = data.get("programme_changes")
    if not isinstance(rows, list) or not rows:
        raise PreflightError("Empty combined programme receipt")
    allowed = {0, 0x0e, 0x0f} | {0x16 + 4*i + j for i in range(32) for j in range(4)}
    for row in rows:
        address = row["address"]
        value = row["new"]
        if (type(address) is not int or address >> 8 != slot
                or (address & 255) not in allowed or type(value) is not int
                or not 0 <= value <= 0xffffffff):
            raise PreflightError("Unqualified DA address in combined receipt")
        if client.read1("DA", address) != value:
            raise ProtocolError(f"Saved DA differs from receipt at {address:04X}")
    return len(rows) + 1
