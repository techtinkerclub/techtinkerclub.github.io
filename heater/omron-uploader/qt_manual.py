"""Offline keypad guide from the native Qt editor. No controller access or website needed.

Use only verified front-panel codes from the existing Tkinter entry-sheet workflow.
Advanced settings without verified keypad paths are a change schedule, NOT invented
button presses.
"""
from __future__ import annotations
from html import escape
from pathlib import Path

from program_model import Programme, decimal
from controller_inventory import CATALOG, human_value


def make_manual(programme: Programme, slot: int, configuration=None, draft=None) -> str:
    metrics = programme.validate()
    if not 0 <= slot <= 7:
        raise ValueError("Programme memory must be 0–7")
    configuration = configuration or {}
    draft = draft or {}
    parts = [("d.prg", str(slot)), ("s-no", str(len(programme.steps)))]
    for index, segment in enumerate(programme.steps):
        parts.extend([("d.seg", str(index)), ("styp", segment.type)])
        if segment.type in ("ramp", "step"):
            parts.append(("sp", f"{decimal(segment.sp):g} °C"))
        if segment.type == "ramp":
            parts.append(("pr", f"{decimal(segment.rate):g} °C/min"))
        elif segment.type == "soak":
            minutes = int(decimal(segment.minutes))
            parts.append(("time", f"{minutes // 60}.{minutes % 60:02d} (hours.minutes)"))
    parts.extend([
        ("d.seg", "end — programme-wide settings"),
        ("pid", "inspect selected PID set; do not change without review"),
        ("al-1 / al-2 / al-3", "inspect alarm functions and actual wiring"),
        ("rpt", "0 — no repetition"),
        ("link", "end — no programme chaining"),
        ("LEVEL", "return to Operation Level as described in H185"),
        ("prg", f"{slot} — programme to RUN, distinct from d.prg"),
        ("r-r", "rst — ensure not RUN while configuring"),
    ])
    rows = "".join(f"<tr><td><code>{escape(k)}</code></td><td>{escape(v)}</td></tr>"
                   for k, v in parts)
    changed = []
    for code, value in sorted(draft.items()):
        if code not in CATALOG:
            raise ValueError("Unknown configuration setting " + code)
        item = CATALOG[code]
        original = configuration.get(code)
        before = (human_value(code, original, configuration.get("C3:0000"))
                  if original is not None else "Unknown — not read from a device")
        after = human_value(code, value, configuration.get("C3:0000"))
        changed.append((code, item.name, before, after, item.meaning))
    changes = "".join(
        "<tr><td><code>" + escape(c) + "</code><p>" + escape(name) + "</p></td>"
        "<td>" + escape(old) + "</td><td><strong>" + escape(new) + "</strong></td>"
        "<td>" + escape(meaning) + "</td></tr>"
        for c, name, old, new, meaning in changed)
    note = ("<h2>Configuration changes proposed in Step 4</h2>"
            "<p>The table is a review schedule, not a verified per-button guide for "
            "advanced parameters. Only follow documented front-panel paths on the "
            "actual fitted model; do not guess menu levels or bypass protections.</p>"
            "<table><thead><tr><th>Register / setting</th><th>Actual</th>"
            "<th>Requested</th><th>Meaning</th></tr></thead><tbody>" + changes +
            "</tbody></table>") if changed else (
            "<p>No configuration changes have been proposed. Confirm the actual "
            "controller input, programme mode and power-on behaviour before use.</p>")
    title = escape(programme.name)
    return f"""<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>E5CC-T programme {slot} — keypad entry</title>
<style>
body{{max-width:950px;margin:28px auto;padding:0 18px;background:#edf3f8;color:#1b3347;
font:14px/1.65 'Segoe UI',Arial,sans-serif}}
main{{background:white;padding:36px;border:1px solid #d5e2ec;border-radius:16px}}
h1,h2{{color:#174e73}}h1{{margin-top:0}}h2{{margin-top:27px}}
table{{width:100%;border-collapse:collapse}}th,td{{border-bottom:1px solid #d8e4ed;
text-align:left;padding:9px;vertical-align:top}}th{{background:#e9f1f8}}
code{{font:13px Consolas,monospace}}.warn{{padding:12px 16px;background:#fff4df;
border-left:4px solid #c78c2a}}.note{{background:#ebf5ff;padding:12px 16px}}
@media print{{body{{background:white;margin:0}}main{{padding:0;border:0}}}}
</style></head><body><main>
<p>E5CC-T Programme Studio · offline front-panel guide · programme {slot}</p>
<h1>{title}</h1>
<p>{len(programme.steps)} segments · assumed PV {escape(str(programme.start))} °C ·
nominal {metrics["minutes"]:.1f} minutes · final commanded SP {metrics["final_sp"]:g} °C</p>
<div class="warn"><strong>Safety:</strong> Keep the controller's normal mains
and external DC heater supply isolated during setup. This document specifies
commanded setpoints, not measured temperatures or verified electrical interlocks.
Never assume an actual cooling ramp follows the plotted slope.</div>
<h2>1. Verify the controller's existing setup</h2>
<p>For the tested bench configuration: <code>in-t=5</code> (Type K whole degrees),
<code>t-pr=pr</code> (rate programme), <code>pru=m</code> (degrees/min),
<code>t-u=h-m</code> (hours.minutes), <code>rtsm=stop</code>,
<code>p-on=rst</code>, <code>eset=rst</code>, and SP Start.
These are <em>settings to verify</em>, not commands to apply blindly.
Refer to H185/H186 and the actual controller's installed options.</p>
{note}
<h2>2. Enter the selected programme using the front panel</h2>
<p>From PV/SP, press LEVEL briefly to reach Programme Level (<code>d.prg</code>).
Select programme memory {slot}. Use MODE to navigate through the codes below
and UP/DOWN to adjust each value. Where applicable use PF for digit editing.
For each segment set <code>d.seg</code>, then <code>styp</code>; enter only
the fields appropriate to Ramp, Soak or Step. Segment time values are
hours.minutes, not decimal fractions of an hour.</p>
<table><thead><tr><th>Omron display</th><th>Enter / check</th></tr></thead>
<tbody>{rows}</tbody></table>
<h2>3. Read back and verify</h2>
<p>Return to the operation display. Revisit <code>d.prg</code> and read
each segment and programme-wide setting back. The programme selected for
execution is <code>prg</code>, not <code>d.prg</code>. Verify <code>r-r=rst</code>.
Do not RUN the heater during this procedure. Confirm persistence after
a complete controller power cycle with the heater isolated.</p>
<div class="note">Generated entirely offline from the native application.
Unknown advanced parameters have no fabricated keypad sequence.</div>
<p>Controller ID: ___________________ &nbsp; Date: ____________
&nbsp; Checked by: ___________________</p>
</main></body></html>"""


def save_manual(path, programme, slot, configuration=None, draft=None):
    html = make_manual(programme, slot, configuration, draft)
    Path(path).write_text(html, encoding="utf-8")
    return path
