"""E5CC-T rate-of-rise programme model. Hardware-independent and unit-tested.

Reference: Omron H185/H186 (2022), programmable E5_C-T controllers.
Engineering assumption: type K input 6, 0.1 deg C resolution, rate/min,
hours.minutes timing. The uploader *checks* those settings rather than changing them.
"""
from __future__ import annotations
from dataclasses import dataclass, asdict, field
from decimal import Decimal, InvalidOperation
import json

TARGET_MODEL = "E5CC-TQX3A5M-000"
SEGMENT_LIMIT = 32
PROGRAMME_LIMIT = 8
KIND_CODE = {"ramp": 0, "soak": 1, "step": 2}
CODE_KIND = {v:k for k,v in KIND_CODE.items()}

class ValidationError(ValueError): pass

def decimal(v):
    try:
        d=Decimal(str(v))
    except (InvalidOperation,ValueError,TypeError):
        raise ValidationError(f"Invalid number {v!r}")
    if not d.is_finite(): raise ValidationError("NaN and infinities are forbidden")
    return d

@dataclass
class Segment:
    type: str
    sp: str = "120.0"   # degrees Celsius for ramp/step
    rate: str = "2"     # whole deg C per minute for ramp
    minutes: str = "15" # integer minutes for soak

@dataclass
class Programme:
    name: str = "20 -> 120 °C at 2 °C/min, 15 min soak"
    start: str = "20.0"  # graph assumption only; NOT transferred
    finish: str = "rst"  # controller-wide setting; NOT transferred
    steps: list[Segment] = field(default_factory=lambda:[Segment("ramp"),Segment("soak")])

    def validate(self):
        if len(self.steps)<1 or len(self.steps)>SEGMENT_LIMIT: raise ValidationError("Must have 1..32 segments")
        start=decimal(self.start)
        if start<Decimal("-20") or start>500:raise ValidationError("Assumed PV must be -20..500 °C")
        if self.finish not in ("rst","cont"):raise ValidationError("Invalid finish mode")
        t=Decimal(0); pv=start; points=[(float(t),float(pv))]
        for i,s in enumerate(self.steps):
            if s.type not in KIND_CODE:raise ValidationError(f"Segment {i}: unsupported type")
            if s.type in ("ramp","step"):
                sp=decimal(s.sp)
                if not Decimal(-20)<=sp<=Decimal(500):raise ValidationError(f"Segment {i}: target outside type K input 6 range")
                if sp*10 != (sp*10).to_integral_value():raise ValidationError(f"Segment {i}: target has more than one decimal place")
            if s.type=="ramp":
                r=decimal(s.rate)
                if r!=r.to_integral_value() or not 1<=r<=9999:raise ValidationError(f"Segment {i}: slope must be an integer from 1 to 9999")
                t+=abs(sp-pv)/r; pv=sp
            elif s.type=="soak":
                minutes=decimal(s.minutes)
                if minutes!=minutes.to_integral_value() or not 0<=minutes<=5999:raise ValidationError(f"Segment {i}: duration must be whole minutes from 0 to 5999")
                t+=minutes
            elif s.type=="step":pv=sp
            points.append((float(t),float(pv)))
        return {"minutes":float(t),"final_sp":float(pv),"points":points,"segments":len(self.steps)}

    @classmethod
    def from_json(cls,obj):
        if "programme" in obj:
            obj=obj["programme"]
        if not isinstance(obj,dict) or not isinstance(obj.get("steps"),list):raise ValidationError("Expected programme object containing steps")
        allowed={"ramp","soak","step"}
        steps=[]
        for i,s in enumerate(obj["steps"]):
            if not isinstance(s,dict) or s.get("type") not in allowed:raise ValidationError(f"Invalid segment {i}")
            steps.append(Segment(type=s["type"],sp=str(s.get("sp","120.0")),rate=str(s.get("rate","2")),minutes=str(s.get("minutes","15"))))
        p=cls(str(obj.get("name","Programme"))[:100],str(obj.get("start","20")),str(obj.get("finish",obj.get("endmode","rst"))),steps)
        p.validate();return p

    def as_json(self):return asdict(self)

def encode_time(minutes):
    n=decimal(minutes)
    if n!=n.to_integral_value() or not 0<=n<=5999:raise ValidationError("Minutes out of 0..5999 range")
    hrs,mins=divmod(int(n),60)
    # Omron H186 hours.minutes encoded in hexadecimal *digits* H'00009959,
    # not binary decimal minutes or decimal fractions of hours.
    return int(f"{hrs:02d}{mins:02d}",16)

def decode_time(raw):
    s=f"{raw&0xffffffff:08X}"[-4:]
    if any(c not in "0123456789" for c in s):raise ValidationError("Invalid BCD-style hours.minutes code")
    hr,mm=int(s[:2]),int(s[2:]);
    if mm>59 or hr>99:raise ValidationError("Impossible h.mm time")
    return hr*60+mm

def signed(raw):return raw-(1<<32) if raw&(1<<31) else raw

def uint32(n):return int(n)&0xffffffff

def address(slot,offset):
    if not 0<=slot<8 or not 0<=offset<=0xff:raise ValidationError("Invalid programme address")
    return (slot<<8)+offset

def planned_writes(slot,p:Programme,input_type=6):
    """Only writes programme data. Never writes initial settings, PID or alarms.
    Order: disable repeats/link, segment fields, segment count LAST.
    """
    p.validate()
    if input_type not in (5,6):
        raise ValidationError("Unverified thermocouple display resolution")
    # H186 programme SP values are encoded without a display decimal point.
    scale = 1 if input_type == 5 else 10
    if input_type == 5:
        for i,seg in enumerate(p.steps):
            if seg.type in ("ramp","step") and decimal(seg.sp) != decimal(seg.sp).to_integral_value():
                raise ValidationError(f"Segment {i+1}: input type 5 needs whole-degree targets")
    out=[(address(slot,0x0e),0),(address(slot,0x0f),0xffffffff)]
    for i,s in enumerate(p.steps):
        base=0x16+4*i
        out.append((address(slot,base),KIND_CODE[s.type]))
        if s.type in ("ramp","step"):
            out.append((address(slot,base+1),uint32(decimal(s.sp)*scale)))
        if s.type=="ramp":out.append((address(slot,base+2),int(decimal(s.rate))))
        if s.type=="soak":out.append((address(slot,base+3),encode_time(s.minutes)))
    out.append((address(slot,0),len(p.steps)))
    return out

def blank_programme():return Programme(name="New programme",start="20.0",finish="rst",steps=[Segment("ramp")])
