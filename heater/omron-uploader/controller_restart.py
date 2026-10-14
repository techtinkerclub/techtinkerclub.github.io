"""One-shot E5CC-T software restart and automatic read-only configuration audit.

Reset is a distinct, no-response CompoWay/F command. Never send it twice
because of an uncertain response. The controller may restart its configured
outputs: caller MUST obtain explicit isolation/RESET confirmation first.
"""
from __future__ import annotations
import time
from compoway import ProtocolError
from transfer import PreflightError
from programme_audit import audit_after_restart

def restart_and_audit(transfer,port,serial_factory,folder,*,timeout_seconds=22,
                      retry_delay=0.7,clock=None,sleep=None):
    """Return (new_read_only_client, audit); caller owns the returned port.

    On failure after issuing reset, reconnect manually and inspect. Read-only
    reconnect attempts are permitted; the RESET COMMAND is NEVER retried.
    """
    if not (transfer and transfer.finished and transfer.cmw_off
            and transfer.receipt_file and transfer.receipt_file.is_file()
            and transfer.preview_data and transfer.client):
        raise PreflightError("Finish and verify C3, record receipt and turn CMW OFF before restart")
    if transfer.__dict__.get("reset_attempted"):
        raise PreflightError("Controller reset was already attempted in this connection")
    if not isinstance(port,str) or not port.strip():
        raise PreflightError("Missing original USB port")
    clock=clock or time.monotonic
    sleep=sleep or time.sleep
    expected_model=transfer.preview_data["model10"]
    transfer.reset_attempted=True  # Set BEFORE sending: a timeout is uncertain.
    old=transfer.client
    try:
        old.software_reset()       # H186: intentionally NO controller response
    finally:
        try:old.close()
        except Exception:pass
    start=clock()
    last_error=None
    while clock()-start<timeout_seconds:
        new=None
        try:
            new=serial_factory(port,write_allowed=False)
            info=new.identify()
            if info.get("model10")!=expected_model:
                raise PreflightError("Reconnected to a different controller")
            status=new.status()
            if not str(status).startswith("01"):
                raise PreflightError("Rebooted controller is NOT confirmed RESET/stopped")
            report=audit_after_restart(
                new,transfer.receipt_file,expected_model,folder)
            report["software_reset_attempted"]=True
            report["reconnected_status"]=status
            return new,report
        except PreflightError as exc:
            # Identity or active controller status failures are not transient.
            if new:
                try:new.close()
                except Exception:pass
            raise
        except (OSError,ProtocolError) as exc:
            last_error=exc
            if new:
                try:new.close()
                except Exception:pass
            sleep(retry_delay)
    raise ProtocolError("Controller did not reconnect after software restart; "
                        "reset MUST NOT be repeated blindly. Last read error: "
                        +str(last_error))
