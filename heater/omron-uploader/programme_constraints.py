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

# Omron E5CC-T H185 input table. 0–24 are temperature-type selections;
# 25–29 are analogue and derive their engineering range and decimal point
# from live C3:0001/0002/0003, never a guessed temperature envelope.
from controller_setup import SENSOR_INPUTS
_SENSOR_DATA={
    0:("-200","850","1"),1:("-199.9","500","0.1"),
    2:("0","100","0.1"),3:("-199.9","500","0.1"),
    4:("0","100","0.1"),5:("-200","1300","1"),
    6:("-20","500","0.1"),7:("-100","850","1"),
    8:("-20","400","0.1"),9:("-200","400","1"),
    10:("-199.9","400","0.1"),11:("-200","600","1"),
    12:("-100","850","1"),13:("-200","400","1"),
    14:("-199.9","400","0.1"),15:("-200","1300","1"),
    16:("0","1700","1"),17:("0","1700","1"),
    18:("100","1800","1"),19:("0","2300","1"),
    20:("0","1300","1"),21:("0","90","1"),
    22:("0","120","1"),23:("0","165","1"),
    24:("0","260","1"),
}
SENSOR_RANGES={code:(Decimal(lo),Decimal(hi),Decimal(step),SENSOR_INPUTS[code])
               for code,(lo,hi,step) in _SENSOR_DATA.items()}
ANALOGUE_TYPES=frozenset(range(25,30))

def compatible_temperature_inputs(programme):
    """All temperature range/resolution choices that fit an offline profile.
    This is NOT a claim that the physical probe is interchangeable.
    """
    answers=[]
    for code in SENSOR_RANGES:
        try:
            candidate=effective_limits({"C3:0000":code},require_readback=False)
            if not programme_issues(programme,candidate):
                answers.append(code)
        except (ValueError,TypeError):continue
    return answers

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
    unit:str = '°C'

    def description(self):
        source="controller readback" if self.verified else "provisional sensor range"
        return (f"{self.minimum:g}…{self.maximum:g} {self.unit} in steps of "
                f"{self.resolution:g} {self.unit} ({self.sensor_name}; {source})")

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
    if sensor in SENSOR_RANGES:
        low,high,resolution,name=SENSOR_RANGES[sensor]
        unit="°C"
    elif sensor in ANALOGUE_TYPES:
        name=SENSOR_INPUTS[sensor]
        unit="scaled units (confirm physical units)"
        dec=selected.get("C3:0003")
        lower=selected.get("C3:0002")
        upper=selected.get("C3:0001")
        if (type(dec) is int and 0<=dec<=3
                and type(lower) is int and type(upper) is int
                and 0<=lower<=0xffffffff and 0<=upper<=0xffffffff):
            factor=Decimal(10)**dec
            low=Decimal(signed32(lower))/factor
            high=Decimal(signed32(upper))/factor
            resolution=Decimal(1)/factor
            if low>=high or low<Decimal("-1999") or high>Decimal("9999"):
                raise ValueError("Analogue input engineering scaling invalid")
        else:
            if require_readback and sensor==fields.get("C3:0000"):
                raise ValueError("Analogue input C3:0001/0002/0003 scaling was not read")
            low,high,resolution=Decimal("-1999"),Decimal("9999"),Decimal("1")
    else:
        raise ValueError("Unsupported or unreadable input type (documented codes 0–29 only)")
    changing_type=("C3:0000" in draft and
                   fields.get("C3:0000") not in (None,sensor))
    if changing_type and not {"C3:0005","C3:0006"}.issubset(draft):
        # Omron resets upper/lower SP limits to defaults for a new input type.
        # The pre-restart raw limits cannot be treated as new limit values.
        # Mark this provisional; no DA upload is permitted until fresh read.
        if {"C3:0005","C3:0006"} & set(draft):
            raise ValueError("When overriding sensor defaults, propose BOTH SP limits")
        return TemperatureLimits(sensor,low,high,low,high,resolution,name,False,unit)
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
    return TemperatureLimits(sensor,low,high,minimum,maximum,resolution,name,True,unit)

def programme_issues(programme,limits):
    """Return actionable issues without changing/clamping the user's values."""
    from program_model import decimal
    issues=[]
    try:
        start=decimal(programme.start)
        if not limits.sensor_min<=start<=limits.sensor_max:
            issues.append(f"Assumed starting PV {start:g} °C outside sensor range "
                          f"{limits.sensor_min:g}…{limits.sensor_max:g} {limits.unit} (not uploaded)")
    except ValueError:
        issues.append("Assumed starting PV is not a valid number")
    for idx,segment in enumerate(programme.steps,1):
        if segment.type not in ("ramp","step"):continue
        try: sp=decimal(segment.sp)
        except ValueError:
            issues.append(f"Segment {idx}: invalid target temperature");continue
        if not limits.minimum<=sp<=limits.maximum:
            issues.append(f"Segment {idx} ({segment.type}): {sp:g} °C exceeds permitted "
                          f"{limits.minimum:g}…{limits.maximum:g} {limits.unit} "
                          "(sensor range and controller SP limits)")
        elif (sp/limits.resolution)!=(sp/limits.resolution).to_integral_value():
            issues.append(f"Segment {idx}: {sp:g} °C is not a valid "
                          f"{limits.resolution:g} {limits.unit} increment")
    return issues

def check_global_programming(fields,draft=None):
    """Guard controller-wide options the supported editor assumes."""
    effective={**fields,**(draft or {})}
    problems=[]
    for key,(expected,reason) in GLOBAL_PROGRAMME_VALUES.items():
        value=effective.get(key)
        if key=="C3:0004" and effective.get("C3:0000") in ANALOGUE_TYPES:
            continue # temperature units have no meaning for scaled analogue input
        if value!=expected:
            problems.append(f"{key}: {reason} (expected {expected}, "
                            f"read/proposed {value if value is not None else 'UNKNOWN'})")
    return problems
