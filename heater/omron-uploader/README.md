# Omron E5CC-T Programme Studio — laboratory validation release (v0.1)

> **Modern Qt interface:** A separate PySide6 version is being developed alongside this validated Tkinter app. It uses the same Omron protocol backend and adds an editable programme graph, grouped initial settings and the five-step workflow. See [Qt build notes](QT_MODERN_README.md) and the [new Windows build workflow](../../.github/workflows/build-omron-qt.yml). Qt hardware transfer has not yet been independently validated; retain this original version as a fallback.


**Target controller (one controller per USB session): Omron E5CC-TQX3A5M-000**. Cable: **E58-CIFQ2**.

**Status (13 October 2026, extended parameter development):** Real COM7 reads, eight-programme DA memory backup, a supervised programme-0 RAM stage/read-back and a nonvolatile save acknowledgement have been observed; a four-segment profile was subsequently read after USB power cycling. These results validate an initial **DA programme transfer**, not a complete heater commissioning or configuration-write procedure. The source now includes a much larger H186-derived parameter catalogue and new extended read-only inventory plus numeric/dropdown *offline* change editor. **This new inventory/editor code and its Windows build are NOT yet tested on the physical controller. Non-DA initial/PID/communications USB writes remain DISABLED.**

The desktop shell uses Tkinter and PySerial for USB/COM. Its native programme editor, self-contained manual guide and the five-step wizard do not need a website or Internet. The controller Explorer can open previously saved backup JSON files without reconnecting.

## Run without installing Python (once the Windows build has completed)

1. Obtain `E5CC-T-Programme-Studio-Windows.zip` from the GitHub Actions build artifact and extract it to an ordinary local directory.
2. Double-click **`START_READ_ONLY.cmd`**. This allows the generator, identification, configuration inspection, programme backups and persistence comparisons; it cannot write controller parameters.
3. Later, only for supervised bench commissioning with the heater system physically isolated, use **`START_LAB_UPLOAD.cmd`**. This opens the **same app** with lab transfer enabled, but all safety confirmations and backup requirements still apply.
4. Always disconnect from an Omron before unplugging the cable, where possible.

**There is no compiled Windows executable inside the source ZIP.** Executables must be built on Windows, using the included reproducible GitHub Actions recipe (or on a trusted Windows PC). A Windows file cannot be built or functionally tested in the Linux packaging environment used for this release.

## Run source on a PC that has Python

Windows:

```powershell
py -3 -m pip install -r requirements.txt
py -3 -m unittest discover -s tests -v
py -3 app.py
```

`py -3 app.py --enable-lab-writes` explicitly activates *experimental* writing. Never enable it for live heater operation. A work laptop might require IT approval before installing Python or Omron USB drivers; the portable EXE removes the Python requirement, **not** any operating-system driver/policy restriction.

## Build the Windows portable executable with GitHub Actions

The supplied workflow expects the repository folder `heater/omron-uploader/` and a root workflow file `.github/workflows/build-omron-uploader.yml`.

1. Copy the contents of this source package (except the bundled `.github` directory, test cache and ZIP) into `heater/omron-uploader/` in the GitHub repository.
2. Copy **this package's** `.github/workflows/build-windows.yml` to the repository root at `.github/workflows/build-omron-uploader.yml`.
3. Commit the files. In GitHub → Actions → **Build portable E5CC-T Studio for Windows** → Run workflow. Alternatively, a push changing those paths starts a build.
4. Wait for tests and PyInstaller packaging to finish; download the `E5CC-T-Programme-Studio-Windows` artifact. Extract the included ZIP.
5. Check Windows Defender / your organisation's policies before running an unsigned EXE; an unsigned PyInstaller binary may trigger a warning. Do **not** bypass an organisation security restriction.

A local Windows command-line build, if permitted:

```powershell
py -3 -m pip install -r requirements.txt pyinstaller
py -3 -m unittest discover -s tests -v
py -3 -m PyInstaller --onefile --windowed --hidden-import serial.tools.list_ports --add-data "../program-tools/index.html;offline" --name E5CC-Programme-Studio app.py
```

Copy the resulting `dist/E5CC-Programme-Studio.exe`, both `START_*.cmd` files and this README to the same directory for an offline package.

## Automatic USB disconnect monitoring

The connected app now checks Windows USB/COM presence approximately every 1.8 seconds and, if the COM port remains present, performs a **read-only Omron 0601 status request** about every 7 seconds while idle. This covers both unplugging the USB cable from the PC and disconnecting the controller-side end while the PC's serial adaptor stays enumerated.

When a link is lost the **top-bar USB indicator changes from CONNECTED to DISCONNECTED**, the app closes the stale serial handle, disables programme writes and invalidates old preview authorisations and the current session. A new connection requires a new programme backup and fresh initial-setting reads before a transfer. Previously saved JSON files, the offline editor and the last read-only Explorer view remain available (they are clearly no longer live).

Never assume loss of the USB link automatically resets or rolls back controller RAM. If the link is lost with uncommitted staged RAM values, a warning explicitly marks the controller state unknown. The monitor is read-only, skips probes during active reads and writes, and cannot diagnose the external heater, SSR or other power-circuit faults.

## Troubleshooting the first connected lab session

If an older version shows `'Window' object has no attribute 'home_note'`, that is a known callback bug in the earlier wizard release: download a build containing the fix (commit `09a776a` or newer). No writing follows from that exception, and the guided backup may not have finished. The fixed version uses the status footer rather than the removed widget.

For the requested Programme 0 replacement, first use the Step 2 guided read, then Step 3 **LOAD 120 → 50 °C FOUR-SEGMENT TEST** with memory 0 selected. Step 4 should remain unchanged for a programme-only USB transfer. Step 5 now clearly identifies missing prerequisites (cable connection, saved backup, preflight mismatch, pending initial setting changes, incomplete six-item checklist, missing reviewed preview or staged RAM). Keep heater mains and DC isolated throughout; do not attempt unqualified real-device writes if a prerequisite fails.

## Extended H186 parameter catalogue — current implementation

This development branch contains `controller_inventory.py`, built from the documented 32-bit CompoWay/F variable types in Omron H186-E1-06 §3-1, and `tests/test_controller_inventory.py`.

**Step 2**: the main **CONNECT + READ EVERYTHING** operation is now designed to run three read-only phases in sequence: the existing verified eight-programme DA backup (1200 words), the familiar nine plus wider initial setup inspection, and an **extended batched parameter inventory** from C0, C1, C3, C4, C5 and C9. The new full inventory is timestamped and saved alongside the other two JSON files, and can be browsed without an active USB connection. Individual unsupported options are marked *unavailable*, never silently replaced with zero. The operator receives one completion message after the guided read.

**Step 4**: there are now **Essential controls** and **Extended catalogue & editing** sub-tabs. The latter has group filters and text search, read values plus raw words, human descriptions, H186 references, per-setting limits and a choice or numeric input where the encoding is documented. All eight PID sets are represented separately in the C5 area. Configuration changes are held locally, displayed in the Step 5 change-review and can be exported as an offline change schedule. An offline/no-cable plan starts with all device values explicitly unknown.

**Capabilities and important exceptions**:

- `C0` exposes operating monitors/status and is read-only. USB setup-powered values must not be misrepresented as live heater measurements.
- `C1` holds operation/protection/adjustment parameters; many apply to the selected PID set. A protected password always reads as zero, so it is **not** a restorable backup value.
- `C3` contains initial configuration, controls, output assignments and communications options. Many writes require Omron **setting area 1**, so these are explicitly **not sent to hardware yet**. Changes to sensor, output, protection, power-on behaviour and serial settings carry additional safety/dependency restrictions.
- `C4` is a view of the **selected programme and selected segment**. Reading its values does not independently capture eight sets. This editor does not rewrite C4 selection state for browsing.
- `C5` holds eight independently addressed PID sets. Scaling of integral/derivative time can depend on C3 integral/derivative unit.
- `C9` is **programless communications mapping**, not a programme uploader.
- `DA` is the separate and already tested complete eight-programme backup and guarded programme writer.
- This catalogue is a **curated subset of documented entries and currently not certified exhaustive** across firmware/model options. The full H186 list, controller nameplate and exact options still determine final coverage. Some entries are model-dependent or require conditional read/interpretation. The app must never scan undocumented addresses or claim a failed read equals zero.
- A full inventory is **not** a firmware image or guaranteed restorability test. Future C1/C3/C5/C9 writes require area/level-protection handling, register-specific validation, baseline reread, safe persistence semantics, and live qualification of one representative low-risk setting with the heater isolated before being enabled in the GUI.

**Step 5 configuration review:** Select **EXPORT CONTROLLER CONFIGURATION CHANGE REVIEW** to save a human-readable, non-executable audit of C1/C3/C5/C9 proposals, with before/after engineering values and raw hexadecimal words, severity, H186 setting-area needs, parameter-specific risks, and commissioning prerequisites. It is never a command list to send to the controller. The existing complete manual programming sheet remains available for confirmed front-panel codes; unfamiliar advanced parameters must not be given invented button sequences.

**Latest workflow changes:** The low-level serial reader now explicitly accepts *read-only* C4/C5/C9 transactions in addition to C0/C1/C3 and tested DA. There is a protocol test proving these are allowed without permitting unsupported parameter writes. The full guided read may take longer than the small initial backup because undocumented model options need per-address rejection checks. A progress indicator tracks completed catalogue reads. A USB transport timeout aborts rather than treating a disconnected cable as hundreds of unsupported options.

**Current hardware-write limitation:** Only the existing guarded `DA` programme transfer is available; all extended catalogue and essential configuration proposals are **offline plans only**. When configuration proposals exist, programme RAM staging/save remain blocked to avoid applying only part of a requested change.

**Source:** [Omron H186 Communications Manual](https://files.omron.eu/downloads/latest/manual/en/h186_e5_c-t_digital_temperature_controllers_communications_manual_en.pdf), especially §§2-3, 3-1 and the variable-type/setting-area restrictions.

## Five-step connected or offline workflow

The native Windows app has a single workflow, with no website or programme JSON hand-off required.

### 1 — Choose Connected or Offline/manual

**Connected**: one E5CC-T at a time through the E58-CIFQ2 USB setup cable. Continue to Step 2.

**Offline/manual**: skip Step 2, open the same native programme editor in Step 3, and finish with a printable manual-entry guide. No cable, browser or Internet required.

### 2 — Read/save/backup/show existing (Connected only)

With controller mains and external heater DC physically isolated, select the COM port, click the single **CONNECT + READ EVERYTHING** button, and wait while the read-only programme memory and initial configuration are both saved and checked. The device is identified by 10-character model prefix; check the full -000 nameplate separately. The initial nine C3 values and controller status are shown. The eight DA programme blocks are saved (8 × 150 registers) and the Stored programmes view displays the existing segments and graphs.

The guided read proceeds to the detailed C3/C1 setup snapshot and then the extended H186 catalogue (C0/C1/C3/C4/C5/C9), all shown in Step 2 alongside the programme memories. **The detailed settings are automatically saved and checked as a second timestamped JSON next to the programme backup.** Step 4 uses the read values to prepare a change proposal; you can also save an additional unmodified snapshot there. This is not a complete controller clone or a restoration guarantee. Always keep the original backup.

### 3 — Create or edit a programme

Choose local target memory 0–7. Add, edit, remove and reorder ramp, soak and commanded-SP step segments, with a nominal temperature-versus-time preview. **LOAD 120 → 50 °C FOUR-SEGMENT TEST** creates the requested 120 °C at 2 °C/min, 15 min soak, 50 °C at 2 °C/min, 15 min soak example immediately inside the desktop editor without any JSON import. In Connected mode, **Use saved controller programme** copies the selected backed-up memory directly into the native editor, never to the hardware. Unknown segments, unsupported repetition and programme links cannot silently be discarded.

There is no requirement to export/import a website JSON to transfer between screens.

### 4 — Initial settings

In Connected mode the app reads the selected C3/C1 parameter values and the extended catalogue, with human-readable explanations and register references. You can propose changes for documented enumerations and numeric ranges in the Extended catalogue tab. These are **offline change proposals**; no C1/C3/C5/C9 USB writes occur.

In Offline/manual mode, the baseline is explicitly UNKNOWN; selected setup choices are proposals only, not values claimed to have been read from hardware.

### 5 — Apply or generate manual instructions

**Offline/manual**: **GENERATE COMPLETE OFFLINE MANUAL ENTRY SHEET** produces a self-contained, printable HTML document containing the selected programme, exact per-segment values, menu labels, keypad-navigation guidance, the initial-setting proposals from Step 4, and final check/read-back steps. No website access is needed.

**Connected**: review the selected programme and proposed changes. The three actions **1 PREVIEW CHANGES → 2 WRITE TO RAM + VERIFY → 3 SAVE TO CONTROLLER** remain visible at the top of Step 5. There is no case-sensitive magic authorisation phrase. The six safety checklist items must be completed and the final RAM-write confirmation accepted. Stage is disabled until the **current** register changes have been previewed; editing the programme after preview forces another preview. The screen explains what is blocking the next action. With no initial-setting changes pending, this guarded experimental route transfers only the selected DA programme memory. The first physical controller upload is **not yet qualified**; keep the heater completely isolated and use an intentionally supervised bench experiment only.

**Current limitation:** USB writes for C3/C1 initial settings are **not yet implemented or validated**. If Step 4 has pending initial-setting changes, programme staging and SAVE are locked to prevent uploading a profile that relies on unapplied configuration. Step 5 includes those initial changes in the offline manual instructions; do not interpret that as an automatic controller setup write.

A communication success does not prove heater safety, thermocouple response, SSR isolation or that the real temperature will follow the commanded setpoint graph.

## Exactly which controller values the app verifies

All reads use CompoWay/F variable type C3, 32-bit data. Values shown are deliberate assumptions for this specific Type K application. The tool does NOT change these settings.

| C3 address | Omron function | Required value |
|---|---|---:|
| `0000` | Input type (K −20.0..500.0 °C) | 6 |
| `0004` | Celsius | 0 |
| `00B9` | Programme time unit (hours.minutes) | 0 |
| `00BA` | Rate-of-rise method | 1 |
| `00BB` | Slope unit (per minute) | 0 |
| `00BC` | Reset operation stops control | 0 |
| `00BD` | Power-on operation RESET | 1 |
| `00BE` | Programme-end operation RESET | 0 |
| `00BF` | PV Start mode | 1 |

**More independent commissioning is necessary**: the Omron's MV-at-reset output, thermocouple error response, PID direction/tuning, SSR electrical state, external heater relay interlock, Finder 13.61 power-return behaviour, E-stop/isolation strategy, protective coordination and 15 A thermal design are not proven by these nine register checks. **This software cannot serve as a safety function.**

## Protocol / addressing reference

- Setup interface: E58-CIFQ2 at 38400, 7E2, node 01 by default, CompoWay/F STX, ETX and XOR BCC.
- H186 `0503` Controller Attributes returns **only 10 ASCII model characters** + communication buffer size.
- H186 `0601` Controller Status: returns the operating state, but inactive control also covers some fault/manual conditions; use independent physical isolation.
- H186 `0101` Read Variable Area; `0102` Write Variable Area; `3005` Operation Command.
- DA (32-bit) register base = slot × `0x100`. Segment base = `0x16 + 4 × segment_index`; `type` offset 0, `SP` +1, `slope` +2, `time` +3. Segment count offset `0`, repetition offset `0x0E`, link destination `0x0F` (no link `FFFFFFFF`).
- Omron parameter setpoint encoding **removes the decimal point**: 120.0 °C → 1200 (`000004B0`). Soak 15 minutes, with h.mm selected, uses encoded hex digits `00000015`, not binary 15-minute count (`0000000F`).
- No working COM connection is required for local programme editing or test suite.

Manufacturer references:

- [Omron H185 — E5_C-T User's Manual](https://files.omron.eu/downloads/latest/manual/en/h185_e5_c-t_users_manual_en.pdf)
- [Omron H186 — E5_C-T Communications Manual](https://files.omron.eu/downloads/latest/manual/en/h186_e5_c-t_digital_temperature_controllers_communications_manual_en.pdf)
- [Python + E58-CIFQ2 CompoWay/F precedent (E5AC-T; not exact model)](https://github.com/Its-OK-Wakamatsu-san/OMRON_CompoWay-F_protocol_on_Temperature_Controller_module)

## Verification status and release gates

Automated tests cover protocol framing, synthetic programme memory, backup integrity, unknown segment handling, sample profile graphs, offline HTML packaging and numerical interpretation. The portable executable is built by GitHub Actions; check the latest successful workflow run before downloading. **Real COM7 identification and selected C3 read-back have passed; controller programme upload, RAM staging, EEPROM save, post-save persistence, and heater operation remain untested.**

Before a production-approved release, complete and record: correct COM driver and discovery; verified `0503` identification; H186 `0601` status interpretation on your exact E5CC-T; full DA read-back including unused slot memory; C3 values and button-screen confirmation; time encoding verification against the physical display; RAM write vs saved memory persistence; interrupted transfer tests; second-channel tests; independent physical safety interlock checks; and a source-reviewed signed Windows build in the actual corporate environment.

## Troubleshooting

| Symptom | Safe action |
|---|---|
| No COM port | Check E58-CIFQ2 driver/USB recognition in Device Manager. Do not guess other devices' COM ports. |
| No STX / response timeout | Check USB cable, port assignment, cable driver, and whether CX-Thermo is already using the port. No writes are sent on identify. |
| Wrong model | Stop. This version is only for E5CC-T family with physical confirmation of exact suffix. |
| Preflight mismatch | Backup can proceed. Do not upload until the setting is understood, adjusted manually by a competent person, and re-verified. |
| Backup fails | Do not upload. Save the log, retain original controller data and diagnose the read error. |
| 2203 Omron operation error | Inspect control status, protections, communication-write mode and setup area. Do not blindly retry any write. |
| Mismatch after staging / save | Do not energise. Save logs and backup. Manually inspect and recover according to approved commissioning procedure. |
| Antivirus/IT blocks EXE | Obtain IT approval for the unsigned custom application; do not bypass security settings. |

© User's local engineering project. **Not an Omron product**, not an Omron-endorsed tool, and not a certified safety controller.
