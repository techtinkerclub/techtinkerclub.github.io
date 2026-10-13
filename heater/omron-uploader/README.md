# Omron E5CC-T Programme Studio — laboratory validation release (v0.1)

**Target controller (both channels): Omron E5CC-TQX3A5M-000**. Cable: **E58-CIFQ2**.

**Status:** production-intent source with working offline programme builder, read-only serial inspection, eight-programme memory backup, guarded RAM transfer, read-back, explicit nonvolatile save and post-reconnect persistence comparison. **It has NOT yet been tested against the owner's physical E5CC-TQX3A5M-000 or the E58-CIFQ2. It is NOT approved for use with an energised heater.** The protocol is grounded in the H186 manual and tested against synthetic responses; actual-hardware qualification remains essential.

The desktop application uses Tkinter (Python standard library GUI) and PySerial for USB/COM. No internet or cloud service is needed to operate it after installation. The supplied Windows build workflow can create an **offline, portable `.exe`** that bundles Python, Tkinter and PySerial. The Omron USB driver may still need to be installed by your organisation.

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
py -3 -m PyInstaller --onefile --windowed --hidden-import serial.tools.list_ports --name E5CC-Programme-Studio app.py
```

Copy the resulting `dist/E5CC-Programme-Studio.exe`, both `START_*.cmd` files and this README to the same directory for an offline package.

## Application tabs

### 1 — Programme builder (fully offline)

Use the **Programme** selector for slots 0–7. Add, remove or reorder up to 32 segments per programme:

- **Ramp:** target SP (°C) and slope (whole °C/min, range 1–9999). The curve can rise or fall.
- **Soak:** hold the preceding SP for a number of complete minutes (0–5999), encoded as hours.minutes.
- **Step:** commanded instantaneous change to a new SP; the measured PV is not expected to jump.

The graph plots the **commanded setpoint** only and assumes the temperature entered in `Starting PV` at RUN. `PV Start = 1` must be commissioned. Actual temperature may lag, and the programme duration is not an actual temperature guarantee. If you require 15 minutes of **measured** temperature at target, a different specification (and qualified control strategy) is needed.

The builder supports saving/reading all eight programmes as a project file, importing a JSON export from our existing GitHub Pages Programme Studio, exporting a single programme JSON, and generating a printable Omron button-entry sheet. JSON data is never transferred to the controller without explicit steps in the later tabs.

**Scope:** rate-of-rise programming only (`t-pr = pr`). Do not mix with time-step programming. Completion RESET is required for hardware upload. Different controller-wide `eset` end behaviours are intentionally not overwritten by the upload tool.

### 2 — Connect & inspect (read-only)

1. Remove controller normal supply **and** externally powered heater supply. On the completed cabinet, have a competent person establish and verify the required safe isolation. Do not assume a front-panel selector alone provides full isolation.
2. Connect the E58-CIFQ2 to **one** of the two E5CC-T controllers and to the Windows laptop.
3. Check **Device Manager → Ports (COM & LPT)** for the assigned COM port. Only COM ports recognised by Windows will appear. Do not change 38400 baud, 7 data bits, even parity and 2 stop bits for the setup cable.
4. Select the COM port, choose **Connect + inspect**. The app sends only `0503`, `0601` and `0101` read commands in this tab.
5. Confirm the returned **10-character model prefix** looks like `E5CC-T…`. The full `E5CC-TQX3A5M-000` suffix **cannot** be established from `0503`; read the controller nameplate.
6. The app reads nine C3 configuration fields without changing them (see table below). A mismatch **does not prevent backing up**, but prevents uploading. A different model prefix prevents connecting this version.

### 3 — Back up the existing memory (read-only)

Choose a writable local folder, then click **READ AND SAVE ALL PROGRAMME MEMORY**. This reads each of the eight documented DA programme blocks, `0000..0095` (150 four-byte registers per programme), including alarm and time-signal fields as well as all 32 segment fields. It also records the nine selected C3 initial-configuration values used for safety checks. Each run saves a timestamped JSON with no overwrite.

**Revised backup feedback (after the Windows app is rebuilt):** a progress bar and status line show `1/8` through `8/8` programme blocks. The tool then reopens the saved JSON and compares its contents with the 1,200 DA registers and nine selected C3 values collected in that session. **A visible success dialogue shows the file path, 8/8 block count and read-only status.** The app deliberately stays on **Tab 3 — Back up memory** and will **not** automatically open the Lab transfer tab. A failed/incomplete new read or an invalid saved file displays an error and cannot be treated as a verified current-session backup.

This verification checks **the saved file against the data collected during the first controller read**, not a second independent controller read. For extra assurance, disconnect/reconnect while power sources remain physically isolated and repeat a separate read-only backup to compare the two sets. The existing JSON made by an **older build** may still be valid, but its creation alone was not independently file-verified by that version.

**Scope limitation:** this is a **complete programme-area backup**, not a complete clone of every controller configuration register. Restoration is **not yet implemented or hardware-qualified**; keep CX-Thermo and the controller's existing settings as fallback. Backup capture is a prerequisite for lab uploading but does not, by itself, ensure recoverability.

### 4 — Lab transfer: strict two-phase upload

First launch via `START_LAB_UPLOAD.cmd` (or the `--enable-lab-writes` flag). Complete ALL six physical checks, select the channel and type the exact authorisation phrase.

**Additional blocking conditions:** accepted model prefix, stopped-control status, correct C3 settings, complete file backup, and an error-free 1..32-segment programme. The app re-reads current settings and each changed register before sending the first parameter write.

1. **Preview exact register changes.** This is read-only; review the DA address, existing value and intended new value.
2. **Stage and verify in RAM.** Sends only allowlisted Omron CompoWay/F operations: enable communications writing `30050001`, select RAM write mode `30050401`, then `0102 DA` writes for the selected programme, followed immediately by `0101 DA` read-back comparisons. Only differing registers are written. The uploader never sends RUN, software reset, firmware upgrade, change-sensor, PID/autotune, or change alarm commands.
3. **Separate explicit SAVE RAM DATA.** Requires a further confirmation. Sends `30050500` after verifying every staged changed register. Then performs one more read-back. The app writes a receipt JSON in your backup folder.
4. **Verify persistence after controller USB power cycle.** Disconnect while heater supplies remain isolated; unplug and reconnect the USB programming cable so the controller actually loses and regains setup power. Reconnect, inspect, then choose **VERIFY SAVED PROGRAMME AFTER USB POWER CYCLE**, select the receipt JSON, and compare the stored DA values. Save the generated verification JSON.
5. On the controller's front display, independently check segment count, SPs, slopes, times, repeat/link settings and behaviour when program ends. Record the result in the commissioning form. Repeat the process for the **other channel**, with its own named backup and receipt.

**Crucial Omron subtlety:** `SAVE RAM DATA` may save **other RAM changes that are pending** (not just the selected programme). Do not run our tool in parallel with CX-Thermo or any other controller configurator. Do not issue additional writes before the bench qualification proves memory-save semantics. Changing communications writing mode also has documented memory-write side effects (H186 §2-3-8); the tool does **not** automatically flip it back at the end or claim that it restored the prior communications state.

**If any transfer operation fails:** the app latches a fail-closed lock. No further writes in that session; it performs **no automatic retry, save, restore, reset, restart, or output change**. The controller might contain partially staged RAM changes. Keep all heater supplies isolated, retain backup and log, investigate before any subsequent commissioning. A restart/disconnection is **not** a substitute for inspection.

### 5 — Log & commissioning checklist

The event log records the basic sequence, changed registers, acknowledgement, errors and receipt location. Export it to a text file; it is not yet a digitally signed audit log.

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

This version has passed **19 backend unit tests** (synthetic protocol replies and simulated controller memory) plus Tkinter smoke tests under a virtual display. The Windows EXE has **not** been built here; GitHub Actions contains the build instructions. **No hardware reads, staged writes, nonvolatile saves, thermal validation or Windows driver tests have yet been performed.**

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
