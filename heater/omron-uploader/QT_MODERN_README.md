# E5CC-T Programme Studio — modern PySide6 development build

This is the NEW PARALLEL Windows app, not a replacement for the working Tkinter app.py. Its working START_*.cmd launchers are left intact.

## Functional five-step workflow

1. Mode — Connected or completely offline/manual, no website required.
2. Read & Backup — reads Omron model prefix and nine key settings, saves all eight complete DA programme memories, reads selected setup, attempts the H186 expanded C0/C1/C3/C4/C5/C9 inventory, and saves all successful snapshots. A failed extended survey does NOT invalidate an already verified DA backup. Browse existing profiles/curves, or verify a saved upload receipt after a USB power cycle.
3. Programme — PyQtGraph curve and editable Ramp/Soak/Step table; eight memory slots; add, remove, duplicate, reorder; copy from a saved controller backup; four-segment bench example; save/open local offline projects.
4. Initial Settings — searchable, grouped H186 register catalogue, plain-English meaning, original/raw values, numerical and dropdown proposal inputs. All controller-configuration changes are local drafts. Offline baselines correctly say unknown.
5. Apply / Manual — read-only DA difference preview, guarded RAM stage/readback, separate SAVE RAM DATA using the existing TransferSession backend; full offline HTML keypad guide and independent configuration change-risk report.

Serial work is performed in a worker, not the GUI thread. Read-only status checks monitor a disconnected USB port and a non-responsive controller. The app uses a compact sidebar rather than sacrificing graph and table space.

## Programme and offline UX refinements (13 October 2026)

- Step 2 in Offline mode now contains a **real preparation workspace**, offering a fresh programme, existing project, saved controller backup, configuration browsing and direct manual-entry access. No serial port is opened for offline operations.
- Step 3 now uses **type-aware segment cards**, not a wide fixed column grid. Ramp shows Target + Rate; Soak shows Hold time only; Step shows Target only. Dedicated, visible ▲/▼ controls are present on each numerical input. Segment cards provide their own move/duplicate/remove actions.
- The graph remains above the taller segment area, with an adjustable vertical splitter and an outer scrollbar for smaller laptop displays.
- Step 5's manual-entry view now follows the site's readable **two-column Omron display/value table** on the left, with an explicit explanation and full keypad directions on the right. There are stage filters and Previous/Next navigation; printable HTML still contains every step.
- The website's own segment cards now align the applicable controls dynamically and expose consistent increase/decrease buttons, including keyboard-operable numeric inputs.
- A website-script syntax and conditional-field regression test is included in the original backend test suite.
- **No new controller communication-writing commands** were introduced by these layout changes.

## Functional parity with Tkinter and the website

The Qt app is intended to be a replacement for the proven Tkinter workflow,
not a limited visual prototype.

| Established function | Modern Qt |
| --- | --- |
| Five-step connected/offline wizard | Native navigation |
| All 8 DA memories, read-only backup and human-readable Explorer | Implemented with plots |
| Detailed initial setup and expanded C0/C1/C3/C4/C5/C9 inventory | Read-only capture; saved snapshots |
| Open saved backup/setup/inventory files | Implemented, clearly labelled offline |
| Programme editing, ramp, soak, step, reorder, duplicate | Native live graph/table |
| One-click four-segment bench example | Implemented |
| Local eight-programme projects | Open and atomic save |
| Website-quality manual-entry parameter table | Built into Step 5, no browser |
| Full printable manual with keypad navigation and explanations | Same source as displayed table |
| Initial-setting manual steps | Verified menu paths where documented; unknown paths flagged |
| Website five-button simulator | Original simulator bundled locally, available offline and optional |
| DA register-change preview, RAM stage, SAVE RAM DATA | Original tested backend retained; Qt path pending real-device qualification |
| Receipt verification after USB power cycle | Implemented |
| Automatic USB disconnect detection and heartbeat | Implemented |
| Clear reason when upload is disabled | Implemented |
| Session activity log, saved-profile export | Implemented |
| Configuration C1/C3/C5/C9 writes | **Not hardware-validated in either app** |

The main Qt GUI requires **no online website**. For optional keypad practice,
the original simulator and its detailed programming guide are supplied inside
the ZIP as local HTML in the folders \`program-tools\` and \`omron-programming\`.
The simulator opens in the default browser but does not require internet and
cannot communicate with the physical Omron.

The native manual worksheet uses the documented rate-of-rise, degrees/minute,
hours.minutes programme convention. If an offline initial-setting draft changes
one of these assumptions, the programme-entry guide refuses to present
incompatible instructions. It marks known initial-level keypad routes separately
from advanced parameters whose exact front-panel navigation is unverified.

## Communications Writing indicator (CMW) and readable dropdowns

**CMW is NOT a heating/programme mode.** The illuminated CMW indicator
means that communications writes are enabled. The experimental DA transfer
previously sent H186 operation `3005 00 01` to enable CMW but never sent
the corresponding `3005 00 00` to turn it off. Closing the COM port or
power-cycling USB must not be treated as proof that communications writing
has been disabled.

After a successfully staged **and saved** programme with a persisted
receipt, Step 5 now offers a **separate, confirm-before-using**
`Finish programming · CMW OFF` action, which sends `3005 00 00`.
It is disabled during an unfinished RAM transfer, after errors, in read-only
mode or without a valid saved receipt. The operator must verify that the
physical CMW indicator goes out; a protocol acknowledgement alone is not
an optical confirmation. Because CMW/write-mode transitions can also
persist pending RAM changes, NEVER use this function to recover an
unknown/incomplete write session.

For a controller left in CMW from a *previous* USB connection, use the
documented physical keypad instead: From Operation Level, press LEVEL
**twice briefly** to enter Adjustment Level; press MODE until `cmwt`
appears, set `off` with the UP/DOWN keys, then return to Operation
Level using **two brief** LEVEL presses. Check the CMW indicator turns
off. If `cmwt` is not present, check protection and event-input
assignments. Keep the external heater physically isolated throughout.

The modern `StudioCombo` also now measures the complete text of each
option and reserves arrow/padding space. Values such as `Programme 0`
and `RESET (stop)` fit without clipping. Long catalogue values use
a max-width field with full-text hover and a wider choice popup.
Regression tests exercise the real Qt field geometry and selection.

**References:** Omron H185 §4-1-3 (Adjustment Level), §6-5
(`cmwt`), H186 §2-3-8 (Communications Writing operation command).

## Editing versus applying changes

- **Step 3 — Programme:** design/edit DA programme segments.
- **Step 4 — Controller Settings:** view and propose changes, including global wt-b.
  No hardware writes are issued simply by proposing a change.
- **Step 5 — Apply / Manual:** only two tabs: **Offline/manual entry**
  and **USB transfer**. The USB page has a single always-visible status summary
  for BOTH programme memory and controller settings, plus a transfer-operation
  selector for either DA programme writes or the qualified C1:0021 setting.
  If settings proposals are pending or a settings write was started, the
  settings operation opens automatically; disabled programme buttons cannot
  be mistaken for the settings transfer. These are still separate safe
  staged operations internally, with distinct readback, SAVE and receipts.
  A settings write cannot be mixed with a DA write in the same connection.
- Search/list selection in Step 4 always refreshes its detail editor even if
  the displayed search result remains on the same row number (Qt's normal
  selection-change signal would otherwise be skipped).
- A settings SAVE is shown as **acknowledged/read back**, with
  **power-cycle verification pending** until actually checked. A second
  local settings proposal remains **NOT written**, even if an earlier value
  was saved in that USB session.
- Other settings outside wt-b remain review-only; we have NOT enabled bulk
  USB register writes.

## First USB configuration-write trial: Wait Band

**Modern Qt isolated-lab launcher only.** The first supported target is the
global Omron Wait Band (wt-b): H186 C1:0021, 0–9999 raw, 0 means OFF.
For temperature input, a desired 3.0 °C band encodes as raw 30 (hex 0000001E).

Procedure, with controller mains and external heater DC physically isolated:

1. Connect and take a full eight-programme backup in Step 2.
2. In Step 4, search C1:0021, enter 3.0 °C and add a LOCAL change proposal.
   No other proposed settings can be present.
3. Continue to **Step 5 — Apply / Manual** → **USB transfer**, where
   **Controller settings (wt-b)** is automatically selected. Click Read + preview wt-b.
   The app reads the live controller setting and
   writes a separate checked backup of the ORIGINAL parameter.
4. Click Write RAM + verify, confirming hardware isolation and the exact
   old/new value. This sends C1:0021 write variable command 0102 and
   independently reads the value back. No nonvolatile save has occurred.
5. Click Save wt-b, with another explicit confirmation. H186 SAVE RAM DATA
   can persist OTHER unsaved adjustment, PID and programme RAM settings.
   The app saves a receipt and checks the value again.
6. Click CMW OFF, check that the CMW lamp extinguishes.
7. Actually power-cycle the USB cable (heater isolated) until the controller
   display turns off, reconnect and take another fresh backup.
8. In Step 5 → USB transfer → Controller settings (wt-b), select Verify saved receipt,
   choose the original receipt, and
   compare the newly read C1 value. Merely reconnecting without removing
   controller power does not establish persistence.

Stop on ANY communications error, unexpected readback or unclear RAM state;
do not repeat or attempt a blind recovery.

The write API is hard-allowlisted to this single C1:0021 register for the
first physical experiment. The new backend module settings_transfer.py adds
read-only preview, disk-checked evidence, one-time RAM staging, explicit
nonvolatile save, CMW OFF, and read-only receipt verification. It prevents
mixing with pending DA programme uploads. General settings remain local
review-only drafts pending their own qualification, especially C3/C5/C9
parameters requiring setup-area-1 access and dependencies.

Reference: Omron Communications Manual H186-E1-06 sections 2-3-2, 2-3-8
and 3-1, table C1:0021. The new writer has not yet been checked on the
physical controller; successful CI simulation alone is not hardware proof.

## Boundaries

- This is development code. The Qt build has not yet been verified with the physical controller. Keep the known-good Tkinter ZIP and original programme backup/receipt.
- The H186 extended catalogue is NOT yet qualified as exhaustive for the exact -000 model and its options. Some documented registers may be unavailable.
- DA programme-memory writing and the isolated first-test C1:0021 Wait Band writer are available. Other C0/C1/C3/C4/C5/C9 configuration writes remain DISABLED. Draft configuration changes block the DA transfer to prevent partial application.
- An HTML guide describes actual known keypad programme codes, not invented steps for unverified advanced parameters.
- The controller's normal mains and external DC heater supply must be physically isolated before USB bench operations. Confirm the full suffix on the actual nameplate.
- Read-only preview is separate from write. DA staging requires an explicit isolated-lab launcher, complete current backup, nine real preflight values, exact current preview fingerprint and six confirmations. Nonvolatile SAVE is separately confirmed and may save other RAM changes. Test persistence after a full USB power cycle.
- Do not infer live measured temperature from the commanded setpoint profile, or infer electrical/heater safety from a successful COM command.

## Portable Windows download

GitHub Actions > Build modern E5CC-T Studio (Qt) for Windows > successful run > Artifacts > E5CC-T-Modern-Studio-Windows.

Extract the entire ZIP before starting it. The new build uses PyInstaller ONEDIR to improve startup compared with onefile; do not move the EXE away from its sibling Qt libraries.

- START_READ_ONLY.cmd: browse, read, back up and edit offline with hardware writes locked.
- START_ISOLATED_LAB.cmd: experimental DA-only USB programme transfer with heater isolated.

## Developers

Install Python 3.12, PySide6, pyqtgraph, numpy and pyserial. From heater/omron-uploader, run python qt_app.py. For isolated lab DA transfers only, use python qt_app.py --enable-lab-writes.

Regression: python -m unittest discover -s qt_tests -v. Windows CI compiles all source and runs the original Omron backend tests plus the new Qt tests before packaging.

## Next checks

1. Confirm a green Windows workflow run, startup, offline UI, resize and graph performance.
2. Tomorrow, read the extended catalogue from the real E5CC-TQX3A5M-000 with heater isolated; inspect unsupported addresses and scaling.
3. Check Programme 0's four segments and stored-read graph against physical keypad values.
4. Qualify Qt programme staging/readback/save separately before retiring Tkinter.
5. Implement C1/C3/C5 writes as separate controlled engineering work after verifying allowed parameter states, dependencies and persistence.

The sidebar intentionally does not invent a controller serial number or firmware version: these were not established by the existing 0503 identity command.


## Combined USB transfer pilot (14 October 2026; hardware not yet qualified)

The USB transfer workspace has a single visible review and a single set of actions.

For a combined transfer on the verified E5CC-T bench configuration:
1. Back up the controller first, with its heater electrically isolated and the controller stopped.
2. Modify the selected programme in Step 3 and propose a Wait Band change (`C1:0021`) in Step 4.
3. In Step 5 select **Include selected programme with Wait Band: ON**. This is explicit to prevent writing unintended local programme differences.
4. **Read + Preview** compares both the C1 value and the exact DA programme register differences against fresh controller reads. No write occurs.
5. **Write RAM + Verify** enables communications writing, enters RAM mode, writes the qualified C1 register and selected DA registers, and reads back both.
6. **Save + Finish** issues one SAVE RAM DATA, verifies readback, writes a durable receipt, then issues CMW OFF. If any stage fails, the application does not attempt a blind retry or automatically send CMW OFF.
7. After a genuine controller power cycle, reconnect and use **Verify saved receipt**. A same-session readback alone does not prove persistence.

**Important:** The combined C1/DA transaction has passed simulated Windows and backend tests but is not yet confirmed against physical hardware. Treat it as isolated laboratory commissioning only; leave the heater supplies disconnected.

Changing thermocouple/input type (`C3:0000`), alarms, PID sets, output parameters, and other configuration is **not** yet supported by hardware writes. These parameters can be reviewed as local drafts; their register-specific setting area, applicable hardware features, and persistence rules must be qualified before enabling writing. Unsupported draft parameters block transfer, rather than being silently ignored. E58-CIFQ2 model identification supplies only a truncated prefix, so do not assume different Omron models are interchangeable.

## Receipt verification and parameter planning (14 October 2026)

**Verify saved receipt** is read-only. A successful SAVE creates a JSON receipt with the
controller model prefix, exact programme/Wait Band registers and expected values.
After the operator physically unplugs the setup cable and confirms the controller
display turns OFF, reconnecting and selecting the saved receipt triggers new
CompoWay/F reads. The application compares the live register values with that
file and reports matches or differences. It does **not** power-cycle the device,
prove that a power cycle happened, switch RUN/RESET, or energise the heater.

The configuration editor now displays the setting area, persistence expectations,
and qualification state of the selected parameter. Proposed configurations are
assigned to setting area 0 (operation/adjustment/PID) or 1 (initial/advanced/
communications). Changes spanning both are visibly identified as separate,
dependent procedures. This groundwork does not enable C3/C5/C9 USB writing.

Manufacturer source: Omron H186-E1-06, §§2-2-3, 2-3-8 and 3-1. C3 sensor type,
alarm setup and control settings in area 1 require entry to area 1 (operation 3005
code 07), separate persistence qualification, and a subsequent controller
restart/power cycle to return to area 0. DA/C1 SAVE RAM DATA must not be assumed
to save initial configuration. No unqualified 3005 operations are available
from the current serial writer. Reading a parameter is not evidence of
hardware support for writing that parameter.


## Experimental extra USB-write support: C1 adjustments (14 October 2026)

The first actual **additional parameter writes** beyond Wait Band are:

| Register | H186 setting | Applicability | Raw write range |
| --- | --- | --- | --- |
| C1:0015 | Proportional band (P) | PID only; selected PID set | 1…9999 (tenths of degree) |
| C1:0016 | Integral time (I) | PID only; selected PID set | 0…9999 (unit depends on configuration) |
| C1:0017 | Derivative time (D) | PID only; selected PID set | 0…9999 (unit depends on configuration) |
| C1:001B | Heating hysteresis | ON/OFF only | 1…9999 (controller raw tenths) |
| C1:0021 | Wait Band | Global, all programmes | 0…9999 |

Unlike earlier releases, several compatible C1 settings can now be **previewed,
written to RAM, read back, and persisted together with a single SAVE RAM DATA**.
Step 5 routes settings-only drafts containing only these registers through the
new isolated-lab C1 transaction. The changed local DA programme is NOT included.
The single Wait Band path and already-qualified one-programme + Wait Band path
remain available unchanged. No C3, C4, C5 or C9 arbitrary writes were added;
C5 is used for **READ ONLY confirmation** of PID-set identity and values.

**Extra PID-set protection:** P/I/D through C1 refer to the currently selected
PID set. The app reads the PID monitor (C0:000D, documented 1..8), then compares
C1 P/I/D values with the corresponding fixed-address C5 PID-set entries before
staging. It checks C1 and C5 after staging and after SAVE. If the active PID set
changes, differs from fixed-address memory, or cannot be read, NO write is
attempted. Power-cycle receipt verification also requires the same PID context.

This functionality is **experimental, not yet validated on real Omron hardware**.
The protocol write target list is explicitly restricted, the controller must
remain RESET/stopped, the heater supplies must be physically isolated, and a
current eight-programme backup is required. Failures after initiating a write
latch an uncertain-state warning; the application must not retry or send an
automatic CMW OFF after an unverified SAVE. Hardware writes must be tested using
the isolated-lab launcher. A completed automated test is not a claim that the
controller's power-cycle persistence or PID-set semantics have been verified.

C3 input range/sensor type, alarms, system behaviour and communications
configuration remain review/manual only pending an independently verified
setting-area-1 entry/exit and persistence procedure.


## Programme compatibility, dependencies and one-click revert (October 2026)

Step 3 programme validation now considers the supported installed Type K input
range, decimal precision and the controller-wide upper/lower setpoint limits.
A connected DA preview reads those values live again and refuses invalid
programme targets before any communications-write operation. A pending
controller-wide input/limit proposal is reflected in the local programme
preview, but unsupported input-type/limit writes are **not** silently included.
An existing out-of-range target is **not automatically clamped** to a different
temperature: the operator must deliberately correct the programme.

Step 4 can explain control-mode prerequisites for P/I/D (PID control required)
and heating hysteresis (ON/OFF control required), with a one-click jump to the
global Control algorithm setting `C3:0007`. The **Revert to previous value**
button below Add to change review discards only the selected proposed setting
and/or unfinished edit and restores its last read controller value. It is
disabled when nothing is changed. If the original value is unknown (offline),
the app can only discard its draft rather than claim it restored a real
controller value. Revert does **not** write anything over USB.

Changing `C3:0007` is still local proposal/manual configuration only until
the setup-area-1 hardware writer is independently qualified. Merely proposing
PID mode never satisfies a C1 PID-writing preflight: the connected controller
must **actually read as PID mode** after a fresh connection.


## Experimental area-1 USB configuration pilot (14 October 2026; supersedes earlier C3 review-only notes)

The isolated-lab `C3ConfigurationTransfer` now permits only these **five
specific initial/global settings**, subject to live preflight and readback:

- `C3:0007` Control algorithm: 0=ON/OFF or 1=2-PID.
- `C3:0000` Type K input ranges **5 or 6 only** (same thermocouple type, different range/resolution).
- `C3:0005` Upper setpoint limit.
- `C3:0006` Lower setpoint limit.
- `C3:000A` Heating output control period (documented encoding −2…99).

Settings-area-1 writes are **not** treated as ordinary staged RAM writes.
Step 5 performs a read-only preview, requires explicit heater isolation,
issues **CMW ON → Move to Setup Area 1 (3005 07 00) → C3 writes with
per-register readback → receipt → CMW OFF**, and **never** issues automatic
RUN, software reset, factory initialization or SAVE RAM DATA for C3 values.
These C3 values may affect controller operation immediately and persistence is
not established by same-session readback. After the write, the operator MUST
physically power-cycle and reconnect to verify the receipt before using the heater.

**Sensor input change with populated programmes:** the former artificial
"all eight programmes must be empty" requirement has been REMOVED. The
original complete 1,200 DA words are preserved in a durable transfer receipt.
On a Type K input 5 ↔ 6 change, Omron may update stored programme temperatures
and reset global setpoint limits internally. The application never predicts
or silently overrides that firmware behaviour. If no explicit SP limits are
provided, let the controller choose its input-type defaults. If the operator
chooses to override those defaults, BOTH bounds must be proposed.

**Software restart and full audit:** after Step 5 completes a verified C3
write and CMW OFF, a new guarded "Software restart + audit all 8 programmes"
action is available. It requires explicit confirmation that mains/output/heater
power supplies are PHYSICALLY ISOLATED. H186's `3005 06 00` software-reset
command returns no normal controller response: the USB library sends it ONCE,
never waits for a reply and **never retries the reset command** if sending was
uncertain. The app reopens the selected COM port read-only, validates model
and stopped state, rereads all 1,200 DA words, checks the C3 receipt and
compares the postrestart global C3 values with the original snapshot.
A dated JSON audit is written even when the C3 receipt readback differs,
provided the programme readings succeeded. The report names changed DA
registers, affected programme numbers and changed global parameters.

**Important:** an identical raw DA value after sensor resolution changes
does NOT prove its physical temperature interpretation remained identical.
Any sensor-type transition remains flagged for review, even if all 1,200 raw
words match; a controller-managed conversion is reported by the actual
observed differences. After the audit, all old snapshots are invalidated:
Step 2 must take a completely fresh controller read before any more writes.
Software reset is **not** equivalent to a genuine loss of power, so optional
physical power-cycle receipt verification remains valuable.

**Different setting areas cannot be merged into one CMW/SAVE transaction.**
Apply eligible C3 changes by themselves, restart and verify, then take a fresh
backup before any C1 or DA changes. Do not use software reset after ordinary
programme uploads or C1 RAM saves: it is only available after finished C3
configuration, because it can invoke global power-up behaviour. This feature
remains hardware-experimental; no alarms, output assignments, polarity,
communications parameters or arbitrary C3 registers have been enabled.

Omron source: H186-E1-06 §§2-2-3, 2-3-2, 2-3-8 and 3-1.
The ordinary C1 Proportional/Integral/Derivative values are the **active PID
set** view; the C5 PID 1–8 values are the eight stored sets, not additional
unrelated integral-time variables.


## 14 October 2026: stop-use warning after real sensor change
A physical E5CC-T changed from `in-t=5` to `in-t=6` and returned
an audit of ZERO raw DA word changes while users saw different programme
graphs. **Do not treat identical raw data as preserved temperatures.**
Our reader currently decodes a segment SP as signed DA integer /1 for
Type K input 5 and /10 for Type K input 6. Thus a raw `00000078`
is rendered as 120 °C under input 5 but 12.0 °C under input 6.
The observed result has not yet been checked against the physical
front-panel segment SP display; there may also be H185-defined
clamping/parameter initialization effects.

H185-E1-08 appendix A-6-11 explicitly documents that changing Input
Type resets the SP upper/lower limits and clamps Segment SP according
to those limits. It does NOT guarantee automatic conversion of each
stored programme to preserve its previous temperatures. This is
why the application now emits *possible before/after interpreted SP
changes* in the C3 audit JSON and the Step 5 result dialog even
when the original/new DA words match exactly. These are deliberately
labelled as UNVERIFIED until compared with actual front-panel data.

A software reset frame (3005 06 00) has no response, so neither a
successful serial transmission nor rapid reconnection proves a restart
physically occurred. Status must say 'reset command sent, restart not
independently confirmed' and never treat a same-connection receipt
comparison as proof of power-loss persistence.

Until physical verification is complete: keep heater/output supply
isolated, refrain from another sensor input write/reset and do not
transfer or run the suspect programmes. Retain original programme
backup, C3 change receipt, restart audit, and a current read-only backup.
The operator should inspect the programme segment SP on the controller,
without changing it, to establish the actual temperature interpretation.


## Read-only before/after programme backup comparison (October 2026)

The application now includes **Step 2 → Compare backups**. This requires
**NO connected controller**, no serial permissions and no writing:
1. Select a saved `e5cct-backup-1` programme backup from BEFORE the
   configuration change.
2. Select a complete programme backup from AFTER (or after restoring
   `in-t=5` and running Step 2 → Read everything).
3. The viewer compares all **eight slots / 1,200 raw DA words**, common
   global preflight settings, and programme ramp/step setpoints interpreted
   under the sensor range recorded IN EACH backup. It highlights when raw
   words match but the interpreted °C values differ.
4. Optionally export the comparison to JSON for future troubleshooting.

These are comparisons of *stored data and our decoded interpretation*, not
independent evidence of Omron's internal programme conversion. The controller
model prefix is not a unique serial number; operators must confirm the
backups came from the intended device. Check actual controller segment SP
on the front panel before heating.

The **C3 change preview** also warns of likely temperature reinterpretations
in the eight stored programmes, using the current complete raw backup with
both the old and proposed Type K display scales. This warning happens
BEFORE any USB writes; it does NOT assume the Omron firmware will preserve
or convert these temperatures after configuration.

### Recovery path after reverting a sensor change

If the controller is now back at its original sensor type and programmes
look normal, do not rewrite programme memory to 'fix' the graphs. With the
heater isolated, take one new read-only Step 2 backup, then compare it
against the original backup using Step 2 → Compare backups. If input type
matches again and no programme raw words changed, report that finding,
not a blanket claim of hardware safety. Verification on the controller
display is still required before RUN.


## Front-panel-equivalent global setting changes (14 October 2026 update)

The global configuration writer is now intentionally simple:
- **Current, confirmed controller readback** governs local programme
  editor graphs, target values and limits. A proposed sensor setting is
  NOT treated as active hardware; it can only raise a *pending*
  compatibility warning, never change an entered temperature.
- C3 settings transfer sends only the user's **exact selected C3
  register value(s)**, with permitted-encoding, model, RESET and
  temperature-limit compatibility guards. It does **NOT** touch DA
  memory, compute new programme setpoints or perform implicit migration.
- Because changing one C3 parameter can make Omron initialise other
  parameters, after C3 Finish the prior extended inventory is marked
  **STALE**. Before any further DA upload the user must return to normal
  operation as documented, then **Read everything** in Step 2. The
  original editor graph remains available as a before-change reference,
  marked accordingly.
- C3 initial-settings preflight no longer imposes unrelated rate/time
  format defaults used by the DA uploader. It still requires a
  qualifying controller model and stopped RESET/output-safe conditions.
- The documented reset button is labelled **Return to normal (reset +
  read back)**. Reset is a separate, explicitly authorised operation,
  not automatically sent after every setting change.
- A complete eight-programme backup remains a useful read-only safety
  snapshot and is never used to rewrite/reset programmes. The optional
  old/new backup comparison is diagnostic only.

Automated tests confirm that a Type K 5→6 selection sends exactly
`C3:0000=6` with no DA writes, that a local 800 °C programme is
preserved with an advisory pending-range warning, and that settings
are marked stale after C3 Finish. Physical hardware behaviour remains
to be validated; no active heater is required to test communications.

 
## Finish C3 and return from `in-t` screen (14 October 2026)

The displayed `in-t` is Omron's **Input Type parameter** in the
Initial Setting Level (e.g. a value of `5` is Type K whole-degree range).
Changing `in-t` over USB previously left the controller in setting area 1,
because the user had to press Step 5 Finish and a separate Return-to-normal
button. An old build could show `in-t` even after all selected C3 writes
had been accepted.

**New preferred C3 workflow:** Step 5 → Read + Preview → Apply C3 + Verify
→ **Finish + Return to normal** (ONE deliberate final action).

The final action checks the selected C3 values once more, creates a receipt,
turns Communications Writing OFF, re-enables it with an acknowledged command
as required for the operation reset, then transmits precisely ONE H186
Software Reset (3005 06 00). It opens the USB port read-only, checks the
controller model prefix, reads STOP/RESET status, verifies the C3 receipt
and checks all eight DA programme memories. The reset has NO response:
the software therefore says *command sent; visually check the normal
PV/SP display*. A successful read-only reconnect does not independently
prove that the display left the initial level. If a stage fails, the app
must not retry the reset blindly or claim the controller is back in area 0.

**Manual recovery:** on the real E5CC-T front panel, hold the **Level (O)**
key for **at least one second** while `in-t` is displayed to return to the
Operation Level (H185-E1-08 §4-1-1). This does not change the chosen sensor
type. The user may also use the separate Return-to-normal recovery button
after a prior two-step session with CMW OFF but no attempted reset.

**Hardware use:** even if currently powered only through the USB cable, the
controller may be connected to outputs in future. Keep explicit isolated-output
confirmation before a software reset. The new workflow neither sends RUN
nor modifies DA programme values. A completely new Step 2 read is required
before the next programme transfer.
