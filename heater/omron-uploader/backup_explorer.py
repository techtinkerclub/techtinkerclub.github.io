"""Read-only interpretation of E5CC-T DA programme backups.

Designed for human review of 8 x 150-word backups. Decode only documented
fields used by the programme writer. Unknown/reserved bytes remain untouched.
No CompoWay/F commands or controller writes are available in this module.
"""
from __future__ import annotations
import json
import math
from pathlib import Path
from program_model import decode_time, signed

class DecodeError(ValueError):
    pass

def _raw_block(block, slot):
    if not isinstance(block, list) or len(block) != 150:
        raise DecodeError(f"Programme {slot} must contain exactly 150 registers")
    values = []
    for i, value in enumerate(block):
        if not isinstance(value, str) or len(value) != 8 or any(c not in "0123456789ABCDEFabcdef" for c in value):
            raise DecodeError(f"Programme {slot}: invalid eight-digit hexadecimal DA word at {i:02X}")
        values.append(int(value, 16))
    return values

def load_backup(path):
    obj = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(obj, dict) or obj.get("schema") != "e5cct-backup-1":
        raise DecodeError("Not an E5CC-T controller programme backup")
    blocks = obj.get("programmes")
    if not isinstance(blocks, dict) or set(blocks) != {str(i) for i in range(8)}:
        raise DecodeError("Backup must contain all eight programme memories")
    for i in range(8):
        _raw_block(blocks[str(i)], i)
    return obj

def config_explanation(backup):
    fields = backup.get("preflight", {})
    known = [
        ("C3:0000", "Thermocouple input range", {
            5: "Type K, −200 to 1300 °C; whole-degree display",
            6: "Type K, −20.0 to 500.0 °C; tenth-degree display",
        }),
        ("C3:0004", "Temperature units", {0: "Celsius (°C)", 1: "Fahrenheit (°F)"}),
        ("C3:00B9", "Programme time format", {0: "hours.minutes (0.15 = 15 minutes)"}),
        ("C3:00BA", "Programme method", {0: "time-based", 1: "rate-of-rise (°C per chosen slope unit)"}),
        ("C3:00BB", "Ramp slope unit", {0: "per minute", 1: "per hour"}),
        ("C3:00BC", "Control during RESET", {0: "control stopped"}),
        ("C3:00BD", "Power-on operating state", {1: "RESET requested on power-up"}),
        ("C3:00BE", "Programme end action", {0: "return to RESET"}),
        ("C3:00BF", "Start method", {0: "SP Start", 1: "PV Start"}),
    ]
    result = []
    for address, name, choices in known:
        raw = fields.get(address)
        value = int(raw) if isinstance(raw, int) and not isinstance(raw, bool) else None
        result.append({"address": address, "name": name, "raw": raw,
                       "meaning": choices.get(value, "Not decoded / verify against controller")})
    return result

def decode_slot(backup, slot):
    if not isinstance(slot, int) or not 0 <= slot < 8:
        raise DecodeError("Programme slot must be 0–7")
    regs = _raw_block(backup["programmes"][str(slot)], slot)
    cfg = backup.get("preflight", {})
    input_kind = cfg.get("C3:0000")
    cel = cfg.get("C3:0004") == 0
    mode = cfg.get("C3:00BA") == 1
    slope_min = cfg.get("C3:00BB") == 0
    hour_min = cfg.get("C3:00B9") == 0
    warnings = []
    decimal_factor = {5: 1, 6: 10}.get(input_kind)
    if decimal_factor is None:
        warnings.append("Input type is not known Type K 5 or 6; temperatures cannot be decoded safely")
    if not cel: warnings.append("Temperature units are not confirmed as °C")
    if not mode: warnings.append("Controller not confirmed in rate-of-rise programme mode; segment decoding may differ")
    if not slope_min: warnings.append("Slope not confirmed per minute; graph duration not available")
    if not hour_min: warnings.append("Time format is not confirmed as hours.minutes; soak duration unavailable")

    raw_count = signed(regs[0])
    if not 1 <= raw_count <= 32:
        warnings.append(f"Segment count DA:0000 is {raw_count}, not within 1..32; contents cannot be interpreted as a normal active profile")
        count = 0
    else: count = raw_count
    segments = []
    for i in range(count):
        base = 0x16 + 4*i
        kind_raw, sp_raw, rate_raw, time_raw = regs[base:base+4]
        kind = {0: "ramp", 1: "soak"}.get(signed(kind_raw))
        if kind is None:
            warnings.append(f"Segment {i}: styp={signed(kind_raw)} is not validated; raw fields shown only")
            kind = "unknown"
        sp = (signed(sp_raw) / decimal_factor) if decimal_factor and cel and mode and kind == "ramp" else None
        rate = signed(rate_raw) if mode and kind == "ramp" else None
        if kind == "ramp" and rate is not None and rate < 0:
            warnings.append(f"Segment {i}: negative rate {rate} — verify actual programme")
        minutes = None
        if kind == "soak" and hour_min:
            try:minutes = decode_time(time_raw)
            except ValueError:
                warnings.append(f"Segment {i}: invalid h.mm time code {time_raw:08X}")
        if kind == "ramp":
            if rate == 0:
                description = f"Immediately select {sp:g} °C (zero ramp rate)" if sp is not None else "Instant setpoint change (unverified temperature scale)"
            else:
                target = f"{sp:g} °C" if sp is not None else "unknown temperature"
                unit = "°C/min" if slope_min else "controller slope units"
                description = f"Ramp to {target} at {rate} {unit}"
        elif kind == "soak":
            description = f"Hold the previous target for {minutes} min" if minutes is not None else "Soak; time needs manual verification"
        else:
            description = "Unrecognised segment type; inspect raw DA registers"
        segments.append({"index": i, "type": kind, "sp": sp, "rate": rate,
                         "minutes": minutes, "description": description,
                         "raw": [f"{x:08X}" for x in (kind_raw, sp_raw, rate_raw, time_raw)],
                         "base": f"{base:02X}"})
    rpt = signed(regs[0x0e])
    link = signed(regs[0x0f])
    result = {
        "slot": slot, "count": raw_count, "segments": segments,
        "repeat": rpt, "repeat_text": "No repetition" if rpt == 0 else f"Repeat setting = {rpt}; interpretation requires confirmation",
        "link": link, "link_text": "No chaining" if link == -1 else f"Link destination = {link} (verify before use)",
        "warnings": warnings, "model": backup.get("controller",{}).get("model10","unknown"),
        "scale": input_kind, "unit": "°C" if cel else "unconfirmed",
        "start_mode": cfg.get("C3:00BF"), "method": cfg.get("C3:00BA"),
        "duration_unit": cfg.get("C3:00B9"), "slope_unit": cfg.get("C3:00BB"),
        "raw_header": {f"DA:{off:02X}":f"{regs[off]:08X}" for off in [0,0x0e,0x0f]},
    }
    return result

def profile_points(summary, initial_pv=20.0):
    """Commanded *illustrative* SP trajectory, never measured PV or actual timing."""
    try:
        initial = float(initial_pv)
        if not math.isfinite(initial) or not -200 <= initial <= 1300: raise ValueError
    except (ValueError, TypeError):
        raise DecodeError("Starting temperature must be a finite value between −200 and 1300 °C")
    if not math.isfinite(initial):
        raise DecodeError("Starting temperature must be finite")
    if summary["warnings"]:
        # Do not claim trustworthy graph timing for uncertain programme method/units.
        return None
    if summary["scale"] not in (5, 6) or summary["unit"] != "°C":
        return None
    x, y = 0.0, initial
    points = [(x, y)]
    for seg in summary["segments"]:
        if seg["type"] == "soak" and seg["minutes"] is not None:
            x += seg["minutes"]
        elif seg["type"] == "ramp" and seg["sp"] is not None and seg["rate"] is not None:
            if seg["rate"] == 0:
                points.append((x, seg["sp"]))
            elif seg["rate"] > 0:
                x += abs(seg["sp"]-y)/seg["rate"]
            else:return None
            y=seg["sp"]
        else:return None
        points.append((x, y))
    return points


def summary_as_plaintext(summary, assumed_start=20):
    """Printable concise report. Explicitly states any unverified interpretation."""
    lines = [f"PROGRAMME {summary['slot']} — READ-ONLY CONTROLLER MEMORY",
             f"Controller prefix: {summary['model']}",
             f"Active segments: {summary['count']}",
             f"Start mode: {'SP Start' if summary['start_mode']==0 else 'PV Start' if summary['start_mode']==1 else 'unverified'}",
             ""]
    if not summary["segments"]:
        lines.append("No interpretable active segments.")
    for segment in summary["segments"]:
        lines.append(f"{segment['index'] + 1}. {segment['description']}")
    lines.extend(["", summary["repeat_text"], summary["link_text"]])
    curve = profile_points(summary, assumed_start)
    if curve is not None:
        lines.append(f"Nominal setpoint duration from ASSUMED {assumed_start:g} °C start: {curve[-1][0]:.1f} min")
    else:
        lines.append("Nominal curve unavailable: unsupported or uncertain values")
    lines.append("SV curve is a prediction from stored settings, NOT measured PV or heater performance.")
    lines.append("Type K raw SP scaling, including type 5, must be checked against the real panel before replacing a programme.")
    if summary["warnings"]:
        lines.append("WARNINGS / VALUES TO VERIFY:")
        lines.extend(" • " + v for v in summary["warnings"])
    lines.append("Original 150-word raw register block remains in the JSON backup.")
    return "\n".join(lines)
