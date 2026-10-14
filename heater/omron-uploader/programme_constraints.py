"""Shared temperature programme constraints for E5CC-T Type K controller setup.

H186: input C3:0000 selects sensor range/resolution. C3:0005/0006 are
controller-wide maximum/minimum permitted setpoints. These are not part of
DA programme memory; a programme must remain inside their intersection.

This module does not write to the instrument or pretend unknown settings are
safe. Type K input types 5 and 6 are the only currently qualified encodings.
"""
from __future__ import annotations
from dataclasses import dataclass
from decimal import Decimal

SENSOR_RANGES={
    5:(Decimal("-200"),Decimal("1300"),Decimal("1"),
       "Type K −200…1300 °C (whole degrees)"),
    6:(Decimal("-20"),Decimal("500"),Decimal("0.1"),
       "Type K −20.0…500.0 °C (0.1 °C)"),
}
GLOBAL_PROGRAMME_VALUES={
    "C3:0004":(0,"Temperature units must be °C"),
    "C3:00B9":(0,"Programme duration must use hours:minutes"),
    "C3:00BA":(1,"Programme method must be rate-of-rise"),
    "C3:00BB":(0,"Ramp rate unit must be °C/min"),
    "C3:00BC":(0,"RESET must stop control"),
    "C3:00BD":(1,"Power-up must enter RESET"),
    "C3:00BE":(0,"Programme-end action must be RESET"),
    "C3:00BF":(0,"Starting method must be SP Start"),
}

def signed32(value):
    if type(value) is not int or not 0<=value<=0xffffffff:
        raise ValueError("Controller setpoint limit is missing or invalid")
    return value-(1<<32) if value&(1<<31) else value

@dataclass(frozen=True)
class TemperatureLimits:
    input_type:int
    sensor_min:Decimal
    sensor_max:Decimal
    minimum:Decimal
    maximum:Decimal
    resolution:Decimal
    sensor_name:str
    verified:bool

    def description(self):
        source="controller readback" if self.verified else "provisional sensor range"
        return (f"{self.minimum:g}…{self.maximum:g} °C in steps of "
                f"{self.resolution:g} °C ({self.sensor_name}; {source})")

def effective_limits(fields, draft=None, *, require_readback=True):
    """Resolve the live + proposed global configuration without side effects.

    If sensor type changes, *both* SP limits must be re-proposed, because
    existing raw values can change physical meaning with decimal resolution.
    An unknown/unreadable limit is not interpreted as zero or ignored.
    """
    if not isinstance(fields,dict) or not isinstance(draft or {},dict):
        raise ValueError("Invalid controller settings")
    draft=draft or {}
    selected={**fields,**draft}
    sensor=selected.get("C3:0000")
    if sensor not in SENSOR_RANGES:
        raise ValueError("Unsupported or unreadable input type; only Type K 5/6 have verified programme encoding")
    low,high,resolution,name=SENSOR_RANGES[sensor]
    changing_type=("C3:0000" in draft and
                   fields.get("C3:0000") not in (None,sensor))
    if changing_type and not {"C3:0005","C3:0006"}.issubset(draft):
        raise ValueError("Changing input range requires explicitly reviewing BOTH upper and lower SP limits")
    current_raw=[selected.get("C3:0006"),selected.get("C3:0005")]
    if any(x is None for x in current_raw):
        if require_readback:
            raise ValueError("SP upper/lower limits were not read; connect and read the controller before transfer")
        return TemperatureLimits(sensor,low,high,low,high,resolution,name,False)
    scale=Decimal(1)/resolution
    minimum=Decimal(signed32(current_raw[0]))/scale
    maximum=Decimal(signed32(current_raw[1]))/scale
    if minimum>=maximum:
        raise ValueError(f"Controller SP limits are inconsistent ({minimum:g} ≥ {maximum:g} °C)")
    if minimum<low or maximum>high:
        raise ValueError(f"SP limits {minimum:g}…{maximum:g} °C exceed {name}")
    return TemperatureLimits(sensor,low,high,minimum,maximum,resolution,name,True)

def programme_issues(programme,limits):
    """Return actionable issues without changing/clamping the user's values."""
    from program_model import decimal
    issues=[]
    try:
        start=decimal(programme.start)
        if not limits.sensor_min<=start<=limits.sensor_max:
            issues.append(f"Assumed starting PV {start:g} °C outside sensor range "
                          f"{limits.sensor_min:g}…{limits.sensor_max:g} °C (not uploaded)")
    except ValueError:
        issues.append("Assumed starting PV is not a valid number")
    for idx,segment in enumerate(programme.steps,1):
        if segment.type not in ("ramp","step"):continue
        try: sp=decimal(segment.sp)
        except ValueError:
            issues.append(f"Segment {idx}: invalid target temperature");continue
        if not limits.minimum<=sp<=limits.maximum:
            issues.append(f"Segment {idx} ({segment.type}): {sp:g} °C exceeds permitted "
                          f"{limits.minimum:g}…{limits.maximum:g} °C "
                          "(sensor range and controller SP limits)")
        elif (sp/limits.resolution)!=(sp/limits.resolution).to_integral_value():
            issues.append(f"Segment {idx}: {sp:g} °C is not a valid "
                          f"{limits.resolution:g} °C increment")
    return issues

def check_global_programming(fields,draft=None):
    """Guard controller-wide options the supported editor assumes."""
    effective={**fields,**(draft or {})}
    problems=[]
    for key,(expected,reason) in GLOBAL_PROGRAMME_VALUES.items():
        value=effective.get(key)
        if value!=expected:
            problems.append(f"{key}: {reason} (expected {expected}, "
                            f"read/proposed {value if value is not None else 'UNKNOWN'})")
    return problems
