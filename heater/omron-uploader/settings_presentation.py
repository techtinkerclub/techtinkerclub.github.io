"""Plain-language settings presentation; no permission or protocol decisions.

The audience level controls discovery only. All users may browse every
documented parameter. Write eligibility remains exclusively in the hardware
capability and transfer modules.
"""
from __future__ import annotations

VIEWS=("Everyday essentials","Control & tuning","Equipment & system","All parameters")

EVERYDAY=frozenset({
    "C1:0021",  # Wait Band: affects segment progression of all programmes
    "C1:004E",  # Select stored programme (operation setting)
    "C1:0050",  # Standby time (controller time format)
    "C1:0051",  # Programme SP shift (controller-wide)
})
ADVANCED=frozenset({
    "C1:0012","C1:0015","C1:0016","C1:0017",
    "C1:0019","C1:001A","C1:001B","C1:001C",
    "C1:0026","C1:0027","C1:0039","C1:003A","C1:003B",
    "C3:000A","C3:000B","C3:0028","C3:002B",
    "C3:0049","C3:0059","C3:0065","C3:0066",
    "C3:0089","C3:0091",
})

def view_for(code,group=""):
    """Classify for navigation, never for write permission."""
    if code in EVERYDAY:
        return VIEWS[0]
    if code in ADVANCED or code.startswith("C5:"):
        return VIEWS[1]
    return VIEWS[2]

def visible_in_view(code,group,view,query=""):
    """Search across *every* category; no hidden matches due to a chosen view."""
    if view not in VIEWS:
        raise ValueError("Unknown settings view")
    if query.strip():
        return True
    return view==VIEWS[3] or view_for(code,group)==view

def scope_for(code):
    if code in ("C1:0015","C1:0016","C1:0017"):
        return ("ACTIVE PID SET — this is the P/I/D value for the currently "
                "selected PID set. PID 1–8 in the C5 bank are the same eight "
                "stored sets, not extra integral or derivative times.")
    if code=="C1:0021":
        return ("GLOBAL — affects segment progression in all eight programmes. "
                "It is not saved separately in each programme.")
    if code=="C3:00BE":
        return ("GLOBAL — the programme-end action applies to the whole controller, "
                "not to one programme memory.")
    if code=="C3:0000":
        return ("SYSTEM-WIDE — defines the installed temperature sensor and display "
                "resolution. Changing it can invalidate temperature limits and stored programmes.")
    if code.startswith("C3:"):
        return ("SYSTEM-WIDE — initial/advanced configuration; changes may affect "
                "every programme and the connected equipment.")
    if code.startswith("C9:"):
        return "SYSTEM-WIDE — communications settings; changing them can interrupt the USB link."
    if code.startswith("C5:"):
        return ("PID SET — belongs to one of the controller's PID sets; its effect "
                "depends on which set is selected.")
    if code.startswith("C4:"):
        return ("SELECTED PROGRAMME/SEGMENT — depends on the currently selected "
                "programme context, not an independent global value.")
    if code.startswith("C0:"):
        return "READ-ONLY — a live controller measurement or status value."
    if code=="C1:004E":
        return "OPERATIONAL — selects one stored programme; it does not change all programmes."
    if code=="C1:0051":
        return "CONTROLLER-WIDE — a programme setpoint shift, not a change to one segment."
    return ("CONTROLLER SETTING — can affect operation beyond the selected programme. "
            "Check the parameter description before changing it.")
