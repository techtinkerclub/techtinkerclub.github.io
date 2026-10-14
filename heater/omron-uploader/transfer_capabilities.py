"""Read-only transfer eligibility and controller parameter capability planning.

This module NEVER writes to a controller. H186's documented read access is not
proof of write availability on the connected hardware variant.
"""
from __future__ import annotations
from dataclasses import dataclass
from controller_inventory import CATALOG

QUALIFIED_WRITES = frozenset({"C1:0021"})
READ_ONLY_BANKS = frozenset({"C0"})
CONTEXT_DEPENDENT_BANKS = frozenset({"C4", "C5", "C9"})

@dataclass(frozen=True)
class ChangeCapability:
    register: str
    status: str
    reason: str
    hardware_writable: bool

def capability(register: str) -> ChangeCapability:
    if register not in CATALOG:
        raise ValueError(f"Unknown parameter register: {register}")
    p = CATALOG[register]
    bank = register.split(":", 1)[0]
    if register in QUALIFIED_WRITES:
        return ChangeCapability(register, "qualified", "Validated isolated-lab Wait Band writer", True)
    if bank in READ_ONLY_BANKS or p.access == "read-only by Omron":
        return ChangeCapability(register, "read-only", "Omron operating monitor; never write", False)
    if register == "C1:0029":
        return ChangeCapability(register, "restricted", "Masked password; cannot verify original value by readback", False)
    if bank == "C3":
        return ChangeCapability(register, "qualification-required",
            "Initial-setting area 1 and persistence/side effects require separate hardware qualification", False)
    if bank in CONTEXT_DEPENDENT_BANKS:
        return ChangeCapability(register, "qualification-required",
            "Selected context, option applicability and persistence need qualification", False)
    return ChangeCapability(register, "qualification-required",
        "Documented parameter but register-specific write, range and state not yet hardware-qualified", False)

def transfer_plan(draft: dict, *, programme_changed: bool = False) -> dict:
    """Conservative, complete plan: no hidden omissions or implied atomicity."""
    if not isinstance(draft, dict):
        raise TypeError("draft must be a mapping")
    rows = []
    for register, value in sorted(draft.items()):
        cap = capability(register)
        if type(value) is not int or not 0 <= value <= 0xffffffff:
            raise ValueError(f"Invalid proposed raw value for {register}")
        rows.append(dict(register=register, proposed_raw=value, status=cap.status,
                         reason=cap.reason, hardware_writable=cap.hardware_writable))
    blocked = [row for row in rows if not row["hardware_writable"]]
    settings = [row for row in rows if row["hardware_writable"]]
    # E5CC current protocol has two separately qualified write state machines.
    # Both can be represented but must NOT yet be staged in one RAM transaction.
    combined = programme_changed and bool(settings)
    return dict(settings=rows, programme_changed=bool(programme_changed),
                blocked=blocked, settings_eligible=settings,
                simultaneous_transfer_qualified=not combined and not blocked,
                can_write_all=not combined and not blocked,
                reason=("Mixed DA + C1 staging is not yet qualified for one save"
                        if combined else
                        "Unqualified parameters need a separately validated writer"
                        if blocked else "Eligible under existing per-bank safeguards"))
