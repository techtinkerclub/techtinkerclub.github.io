# Omron E5CC-T Programme Studio — laboratory validation release (v0.1)

**Target controller (one controller per USB session): Omron E5CC-TQX3A5M-000**. Cable: **E58-CIFQ2**.

**Status (13 October 2026, updated):** The desktop shell now has a task-oriented Start screen, compact tabs and a connect+backup shortcut. Read-only COM7 hardware identification has passed. The isolated-lab writer was updated for the observed Type K input 5 (whole-degree SP values) and SP Start 0. **No physical RAM write, read-back or nonvolatile save has yet been qualified.** Heater power must remain isolated during any supervised test. Use only a newly built Windows artifact after the CI tests succeed.

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

## Five-step connected or offline workflow

The native Windows app has a single workflow, with no website or programme JSON hand-off required.

### 1 — Choose Connected or Offline/manual

**Connected**: one E5CC-T at a time through the E58-CIFQ2 USB setup cable. Continue to Step 2.

**Offline/manual**: skip Step 2, open the same native programme editor in Step 3, and finish with a printable manual-entry guide. No cable, browser or Internet required.

### 2 — Read/save/backup/show existing (Connected only)

With controller mains and external heater DC physically isolated, select the COM port, click **Connect + automatically back up all 8 programmes**, and wait for the read-only file verification. The device is identified by 10-character model prefix; check the full -000 nameplate separately. The initial nine C3 values and controller status are shown. The eight DA programme blocks are saved (8 × 150 registers) and the Stored programmes view displays the existing segments and graphs.

The guided read proceeds to the detailed C3/C1 initial-setting snapshot and shows it within Step 2 alongside the programme memories. Step 4 uses those live values to prepare a change proposal; you can also save the unmodified configuration snapshot there. This is not a complete controller clone or a restoration guarantee. Always keep the original backup.

### 3 — Create or edit a programme

Choose local target memory 0–7. Add, edit, remove and reorder ramp, soak and commanded-SP step segments, with a nominal temperature-versus-time preview. In Connected mode, **Use saved controller programme** copies the selected backed-up memory directly into the native editor, never to the hardware. Unknown segments, unsupported repetition and programme links cannot silently be discarded.

There is no requirement to export/import a website JSON to transfer between screens.

### 4 — Initial settings

In Connected mode the app reads the selected C3/C1 parameter values and gives human-readable descriptions. You can propose changes for supported mapped enumerations. Other PID/advanced numeric values are shown for review but are not yet safely editable or writable.

In Offline/manual mode, the baseline is explicitly UNKNOWN; selected setup choices are proposals only, not values claimed to have been read from hardware.

### 5 — Apply or generate manual instructions

**Offline/manual**: **GENERATE COMPLETE OFFLINE MANUAL ENTRY SHEET** produces a self-contained, printable HTML document containing the selected programme, exact per-segment values, menu labels, keypad-navigation guidance, the initial-setting proposals from Step 4, and final check/read-back steps. No website access is needed.

**Connected**: review the selected programme and proposed changes. With no initial-setting changes pending, the isolated-laboratory route offers exact DA change preview, a separately authorised RAM stage with immediate readback, and a separate explicit nonvolatile SAVE. The first physical controller upload is **not yet qualified**; keep the heater completely isolated and use an intentionally supervised bench experiment only.

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
