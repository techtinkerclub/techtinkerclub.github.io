"""Explain and navigate prerequisite global settings for selected C1 changes.

This describes prerequisites; it never silently changes a global controller
setting or enables additional CompoWay writes. The readback must actually
match the requirement before a dependent C1 setting can be transferred.
"""
from __future__ import annotations
from dataclasses import dataclass

MODE_KEY="C3:0007"
PID=frozenset({"C1:0015","C1:0016","C1:0017"})
ON_OFF=frozenset({"C1:001B"})

@dataclass(frozen=True)
class Dependency:
    register: str
    name: str
    required: int
    actual: int | None
    proposed: int | None
    matches_controller: bool
    proposed_conflict: bool

    @property
    def explanation(self):
        needed="PID (2-PID)" if self.required==1 else "ON/OFF"
        observed=({0:"ON/OFF",1:"PID (2-PID)"}.get(self.actual,"unavailable"))
        if self.actual is None:
            return (f"REQUIRES: Control algorithm = {needed}. "
                    "Current controller mode is unknown. Read the controller first; "
                    "USB transfer is not allowed until the mode is verified.")
        if self.proposed_conflict:
            return (f"REQUIRES: Control algorithm = {needed}. Controller currently "
                    f"reads {observed}, but the local proposal conflicts. "
                    "Resolve that global setting before transferring this parameter.")
        if not self.matches_controller:
            return (f"REQUIRES: Control algorithm = {needed}. Controller currently "
                    f"reads {observed}. Change and verify the global mode first. "
                    "C3:0007 is not yet USB-writable in this app; use the controller's "
                    "documented manual procedure, then reconnect and read back.")
        return (f"REQUIREMENT MET: Control algorithm = {needed} on the controller. "
                "Changing it later may invalidate the selected tuning setting.")

def dependency_for(register, fields, draft=None):
    if register in PID: required=1
    elif register in ON_OFF:required=0
    else:return None
    draft=draft or {}
    actual=fields.get(MODE_KEY)
    proposed=draft.get(MODE_KEY)
    return Dependency(MODE_KEY,"Control algorithm",required,actual,proposed,
                      actual==required,proposed is not None and proposed!=required)
