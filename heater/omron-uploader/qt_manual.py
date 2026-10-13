"""Standalone print-ready Omron keypad instructions — exactly the same source
of truth as the Qt in-app offline entry table. No website, controller or browser
connection is needed to GENERATE this file. The saved HTML opens/prints offline.
"""
from __future__ import annotations
from html import escape
from pathlib import Path
from qt_entry_plan import make_entry_plan,plain_instructions

STYLE="""<style>
:root{font:14px/1.5 'Segoe UI',Arial,sans-serif;color:#18334a;background:#eef4f9}
*{box-sizing:border-box}body{max-width:1060px;margin:30px auto;padding:0 18px}
main{background:white;border:1px solid #d7e4ee;padding:34px;border-radius:14px}
h1{font-size:26px;margin:0 0 10px}h2{font-size:19px;color:#145a84;margin-top:30px}
p{margin:10px 0}.muted{color:#59748a}.warn{background:#fff5df;border-left:4px solid #ca901b;
padding:12px 16px;margin:14px 0}.good{background:#eaf5fb;padding:12px 16px}
table{width:100%;border-collapse:collapse;table-layout:fixed}
th{background:#e8f1f8;text-align:left;color:#33536c}
td,th{border-bottom:1px solid #dce7f0;vertical-align:top;padding:9px 10px;overflow-wrap:anywhere}
code{font:13px/1.4 Consolas,monospace;background:#e9f1f8;border-radius:4px;
padding:3px 5px;color:#0d598c}.section td{background:#f1f6fa;font-weight:700}
.key{font-weight:700;color:#165d9d}.foot{margin-top:26px;color:#607b8e;font-size:12px}
@media print{body{background:white;margin:0;padding:0}main{border:0;border-radius:0;padding:0}
tr{break-inside:avoid}thead{display:table-header-group}h2{break-after:avoid}}
</style>"""

def make_manual(programme, slot, configuration=None, draft=None):
    plan=make_entry_plan(programme,slot,configuration,draft)
    rows=[]
    previous=None
    for item in plan["entry_rows"]:
        sec=item["section"]
        if sec!=previous:
            rows.append('<tr class="section"><td colspan="4">'+escape(sec)+'</td></tr>')
            previous=sec
        rows.append('<tr><td><code>'+escape(item["code"])+'</code></td>'+
                    '<td><strong>'+escape(item["value"])+'</strong></td>'+
                    '<td>'+escape(item["purpose"])+'</td>'+
                    '<td>'+escape(item["instruction"])+'</td></tr>')
    proposals=[]
    for change in plan["setup_proposals"]:
        proposals.append('<tr><td><code>'+escape(change["code"])+'</code> '+
                         escape(change["name"])+'</td><td>'+escape(change["current"])+
                         '</td><td>'+escape(change["proposed"])+'</td><td>'+
                         escape(change["meaning"])+'<p><strong>Manual action:</strong> '+
                         escape(change["entry"])+'</p></td></tr>')
    proposed_html=("<h2>Additional configuration change proposals</h2><p>These changes "
                   "are a review schedule. Their specific menu sequence is NOT VERIFIED and "
                   "must not be guessed.</p><table><thead><tr><th>Parameter</th><th>Existing</th>"
                   "<th>Requested</th><th>Purpose and limitation</th></tr></thead><tbody>"+
                   "".join(proposals)+"</tbody></table>") if proposals else ""
    warnings="".join("<li>"+escape(item)+"</li>" for item in plan["warnings"])
    return f"""<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>E5CC-T Programme {slot} — complete manual entry guide</title>{STYLE}
</head><body><main><p class="muted">E5CC-T PROGRAMME STUDIO · OFFLINE MANUAL GUIDE</p>
<h1>Programme {slot}: {escape(plan['name'])}</h1>
<p>{sum(r['code']=='styp' for r in plan['entry_rows'])} segments · assumed start
PV {escape(plan['assumed_start_pv'])} °C · nominal
{plan['nominal_minutes']:.1f} minutes · final commanded SP {plan['final_sp']:g} °C</p>
<div class="warn"><strong>Safety:</strong> This is a commanded setpoint programme,
not a measured temperature trajectory. Do not energise the heater during
keypad programming, and check the actual hardware model and available menus.</div>
<h2>Step-by-step Omron keypad entry worksheet</h2>
<p>This uses the same <code>d.prg</code>, <code>s-no</code>,
<code>d.seg</code>, <code>styp</code>, <code>sp</code>, <code>pr</code>
and <code>time</code> sequence as the offline website builder.
The <strong>HOW TO ENTER IT</strong> column explains the actual LEVEL, MODE,
UP/DOWN and PF operations. Confirm each code on the controller
display before entering a value.</p>
<table><colgroup><col style="width:15%"><col style="width:17%">
<col style="width:23%"><col style="width:45%"></colgroup>
<thead><tr><th>Omron display</th><th>Required value</th>
<th>What it controls</th><th>How to enter or verify it</th></tr></thead>
<tbody>{''.join(rows)}</tbody></table>
{proposed_html}
<h2>Checks before leaving the controller</h2>
<ul>{warnings}</ul>
<p><strong>Important:</strong> The physical keypad does not use the separate
USB SAVE RAM DATA operation. Read the entered programme back, then verify
retention after an appropriate, fully isolated controller power cycle.</p>
<p class="foot">Controller ID: ____________________ &nbsp; Operator:
____________________ &nbsp; Date: ____________________</p>
</main></body></html>"""

def save_manual(path,programme,slot,configuration=None,draft=None):
    content=make_manual(programme,slot,configuration,draft)
    Path(path).write_text(content,encoding="utf-8")
    return path
