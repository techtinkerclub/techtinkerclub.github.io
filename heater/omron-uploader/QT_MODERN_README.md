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
