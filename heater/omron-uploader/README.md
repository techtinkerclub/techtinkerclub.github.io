# Omron E5CC-T Programme Studio — laboratory validation release (v0.1)

**Target controller (both channels): Omron E5CC-TQX3A5M-000**. Cable: **E58-CIFQ2**.

**Status (13 October 2026, updated):** The desktop shell now has a task-oriented Start screen, compact tabs and a connect+backup shortcut. Read-only COM7 hardware identification has passed. The isolated-lab writer was updated for the observed Type K input 5 (whole-degree SP values) and SP Start 0. **No physical RAM write, read-back or nonvolatile save has yet been qualified.** Heater power must remain isolated during any supervised test. Use only a newly built Windows artifact after the CI tests succeed.

The desktop shell uses Tkinter and PySerial for USB/COM, and bundles the identical website's full Programme Studio HTML as an offline browser page. A cable or internet is not required for programme design, manual-entry sheets or the five-button simulator. The Controller Explorer can use previously saved controller backup JSON without reconnecting. The supplied Windows build workflow can create an **offline, portable `.exe`** that bundles Python, Tkinter and PySerial. The Omron USB driver may still need to be installed by your organisation.

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

## Application tabs and recommended workflow

### START — Task-oriented workflow and full offline creator

The Start screen leads directly to Design, Connect, Explore and Upload. The main DESIGN button opens the real Programme Studio from a copy **bundled inside the portable executable** in the computer's usual web browser. It includes eight programme slots, ramp/soak/step entry, commanded-setpoint graph, manual parameter-entry sheet and virtual five-button Omron simulator. It works without the USB cable and without internet. Save/export JSON regularly: local browser storage may be cleared or constrained by company browser policy. This has NO serial-port access.

### 2 — Desktop editor (offline)

The native compact editor can import/export the *same* programme JSON format as the website, keep an eight-slot local design project, display a simple commanded-SP graph and print the verified button-by-button entry sheet. The **Load verified 50 °C example** button creates the physical bench-test 50 °C at 2 °C/min + 15-minute soak profile without any controller write.

### 3 — USB inspect (read-only)

Connect one Omron at a time using its E58-CIFQ2 cable. Select the Windows COM port (COM7 on the first successfully connected unit), inspect the 10-character model prefix, status and nine selected C3 settings. The full -000/-003 model suffix **cannot** be inferred from the serial prefix and needs nameplate confirmation. The -000 model has no verified live PV/multi-input monitoring capability in this tool; do not treat this software as a live data logger.

**Important:** the real controller returned `C3:0000=5` (Type K, whole degrees) and `C3:00BF=0` (SP Start). The isolated-lab policy and SP scaling now match these observed values. A different input type or start setting blocks writing. Always confirm the full -000 model suffix on its nameplate.

### 4 — Memory backup (read-only)

Read all eight DA programme blocks (8 × 150 four-byte words), retaining the nine selected initial C3 readings. The app displays progress, verifies the saved JSON and displays a success message. The Connect + automatic backup shortcut can also open Explorer automatically. Keep the JSON file somewhere safe. A file check is not an independent second read or a full controller-configuration backup.

### 5 — Explore memory (read-only human-language reverse builder)

Open the saved `E5CC-T-programme-backup-...json` file, even without a controller/cable, or select **Use current session backup** after completing Step 4. The left-side table lists programmes 0–7 and their active segment count; selecting a memory shows:

- Each segment in plain English, including target, ramp rate, soak duration or an unrecognised field warning.
- A clear **commanded-setpoint versus time graph**, calculated using an editable *assumed initial PV*. The start temperature isn't stored in the programme. This is neither measured PV nor an assurance that the heater can follow the profile.
- The repeat/link settings and human-language descriptions of the nine selected C3 configuration fields, including Type K scale 5/6 and SP/PV Start.
- A text report export, and **Copy selected to local editor** to make a design copy you can modify offline. This never writes to the Omron and refuses unknown/unsupported segments or non-zero repeat/chaining.

**Decoder caveat:** This first Explorer interprets the H186 segment fields used in our rate-mode bench example. Other stored special functions, unknown alarm/time-signal assignments and unused register fields are not fully decoded. The app preserves the full 150-word raw memory block in the backup; it **must not infer that a programme is safe to overwrite from the graph alone**. Type K 5/6 SP register scaling is based on the documented decimal-point semantics, but should be compared with actual front-panel read-back on our COM7 controller before uploading.

### 6 — Controller setup (read-only device inspection + offline configuration planner)

The **Controller setup** tab reads the physical attached controller through the E58-CIFQ2 cable, and shows a documented selection of important **C3** and **C1** settings. This is separate from the eight DA programme memories and their backups. It also works without the USB cable when opening a previously saved setup snapshot.

**To use:**
1. Connect in **USB inspect** as usual with the heater power isolated.
2. Open **Controller setup** and click **READ CONTROLLER SETTINGS (no writes)**. the tool freshly re-reads the nine original preflight values and individually reads other selected documented registers, including Type K input range, SP limits, PID/ON-OFF, heating/cooling selection, SSR heating cycle time, reverse/direct action, alarm types, programme execution/reset/power-up behaviour, and MV at RESET / PV error.
3. Review the actual values and the plain-English descriptions alongside Omron menu codes and C3/C1 register addresses. Optional settings that cannot be read (e.g. unsupported model options) are explicitly marked unavailable, **not interpreted as zero**.
4. Click **Save actual snapshot…** to retain an unmodified, read-verified JSON setup snapshot, separately from the existing 8-programme backup JSON.
5. For supported enumerated choices, select a row and use **Add to proposed changes** to create an *OFFLINE* alternative. **Clear proposed changes** resets your local draft. **Export comparison…** saves a proposal JSON and human-readable text comparison with original values.

**CRITICAL:** No control in this tab can write controller configuration, even when the executable was opened with `START_LAB_UPLOAD.cmd`. These are **offline proposed changes** only. There is deliberately no "Apply settings to Omron" button in this unqualified release. The experimental lab uploader writes only allowlisted DA programme addresses with the observed input type 5 and SP Start 0; no real-device write has yet been proven. Do not change correct hardware settings to satisfy outdated upload preflight assumptions.

**Scope:** This is not a complete configuration clone. Additional alarms thresholds, selected PID sets, advanced function and protection parameters, external output assignments, and actual interlock/SSR wiring are outside the current inspector. Output in RESET or on a thermocouple error may not be zero just because the controller's `0601` status reports stopped; inspect these values and verify electrical isolation independently. Read-only output parameters may appear as raw tenths of percent and are dependent on control mode. Omron H186 CompoWay/F C3 and C1 tables are the reference.

### 7 — Lab transfer (guarded and unqualified on real hardware)

The app does **not** assume two channels. The editable controller ID is just an audit label for whichever physical Omron is attached; only one serial controller can be connected in a session. The separate `START_LAB_UPLOAD.cmd` launcher requires explicit authorisation, stopped controller, compatible preflight, complete backup and review of all DA register changes. RAM staging/read-back and nonvolatile save are separate operations, each requiring deliberate confirmation.

**The first isolated bench upload is experimental.** The source now handles the observed Type K 5/SP Start settings. Before staging RAM on the real unit, examine its saved DA memory backup and cross-check a known SP/segment on its physical keypad. Use a sacrificial test slot, review the exact changed registers and keep heater mains and DC fully isolated. No automatic rollback exists; do not energise the heater with an unqualified uploaded programme.

### 8 — Audit log

Record identification, reads, errors and any later supervised transfer approvals and save a local text log. The workflow is still **prototype / laboratory commissioning**, not a certified temperature-control safety system.

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
