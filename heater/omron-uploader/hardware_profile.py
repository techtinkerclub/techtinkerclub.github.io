"""Conservative E5CC-T option decoding from a *confirmed nameplate*.

CompoWay/F 0503 supplies only the ten-character model prefix. A suffix is
never inferred from readable registers, a COM port, or a previous session.
Source: Omron E5_C/E5_C-T datasheet, model-number legend/option matrix.
"""
from dataclasses import dataclass
import re

_PATTERN=re.compile(r"^(E5CC-T(?:RX|QX|CX|QQ|CQ)[23][AD]5M)-(000|001|003|004|005|006|007)$")
# Suffix: number of event inputs, CT input channels, RS485, transfer, remote SP.
_OPTIONS={
    "000":(0,0,False,False,False),
    "001":(2,1,False,False,False),
    "003":(0,2,True,False,False),
    "004":(2,0,True,False,False),
    "005":(4,0,False,False,False),
    "006":(2,0,False,True,False),
    "007":(2,0,False,False,True),
}
@dataclass(frozen=True)
class HardwareProfile:
    full_model: str
    usb_prefix: str
    output1: str
    output2: str | None
    auxiliary_count: int
    event_inputs: int
    ct_inputs: int
    rs485: bool
    transfer_output: bool
    remote_sp: bool

def confirm_model(model, usb_prefix):
    """Fail closed unless operator supplied the exact supported model syntax."""
    if not isinstance(model,str) or not isinstance(usb_prefix,str):
        raise ValueError("A full model number and USB identity are required")
    name=model.strip().upper()
    match=_PATTERN.fullmatch(name)
    if not match:
        raise ValueError("Unknown E5CC-T model/option combination; check the nameplate")
    if name[:10]!=usb_prefix.strip().upper():
        raise ValueError("Nameplate model does not match USB identification prefix")
    suffix=match.group(2)
    ctl=name.split("-T",1)[1][:2]
    auxiliary=int(name[8])  # E5CC-TQX3A5M-003: digit at position 8
    events,cts,rs485,transfer,remote=_OPTIONS[suffix]
    if suffix in ("001","003") and ctl in ("CX","CQ"):
        raise ValueError("CT option incompatible with current-output variant")
    if suffix=="004" and ctl!="CX":
        raise ValueError("Option 004 requires a current-output variant")
    output1={"RX":"relay","QX":"voltage pulse","CX":"linear current",
             "QQ":"voltage pulse","CQ":"linear current"}[ctl]
    output2={"QQ":"voltage pulse","CQ":"voltage pulse"}.get(ctl)
    return HardwareProfile(name,name[:10],output1,output2,auxiliary,
                           events,cts,rs485,transfer,remote)

def required_feature(register):
    """Return hardware feature(s) required, if not a common controller setting."""
    bank,sep,part=register.partition(":")
    if not sep: return None
    try: address=int(part,16)
    except ValueError: return None
    if bank=="C1":
        if address in (0x000D,0x001D):return "ct1" if address==0x000D else "ct2"
        if address in (0x001E,0x001F):return "ct1" if address==0x001E else "ct2"
    if bank=="C3":
        if 0x0016<=address<=0x0019:return "event"+str(address-0x0015)
        if address in (0x0085,0x0086):return "event"+str(address-0x007F)
        if address in (0x0024,0x0025,0x0026,0x0046,0x0047,0x0048):
            return "ct1"
        if address in (0x0010,0x0011,0x0012,0x0013,0x0014,0x004C,0x004D,
                       0x0096,0x0097,0x0098,0x0099,0x009A,0x009B):
            return "rs485"
        if address in (0x003E,0x003F,0x0040):return "transfer"
        if address==0x0041:return "current1"
        if address==0x008D:return "current2"
        if address==0x004F:return "output2"
        if address in (0x0050,0x0051,0x0056):return "aux"+str(
            {0x0050:1,0x0051:2,0x0056:3}[address])
        if address in (0x0084,0x0087,0x0088,0x008A,0x008B,0x008C):
            return "aux4"
        if address==0x0086:return "event6"
    if bank=="C0" and address in (0x0003,0x0007):return "ct1"
    if bank=="C0" and address in (0x0006,0x0008):return "ct2"
    if bank=="C9":return "rs485"
    return None

def supports(profile,register):
    """True for fitted hardware, False for absent, None if suffix unconfirmed."""
    needed=required_feature(register)
    if needed is None:return True
    if profile is None:return None
    if needed.startswith("event"):return int(needed[5:])<=profile.event_inputs
    if needed.startswith("aux"):return int(needed[3:])<=profile.auxiliary_count
    if needed=="ct1":return profile.ct_inputs>=1
    if needed=="ct2":return profile.ct_inputs>=2
    return {"rs485":profile.rs485,"transfer":profile.transfer_output,
            "remote_sp":profile.remote_sp,"current1":profile.output1=="linear current",
            "current2":profile.output2=="linear current",
            "output2":profile.output2 is not None}[needed]

def permitted(profile,register,read_value):
    """Eligible for editing only with confirmed hardware and successful read."""
    return profile is not None and supports(profile,register) and read_value is not None
