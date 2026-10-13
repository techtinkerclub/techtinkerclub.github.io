## 13 October 2026 — FIRST REAL COM7 READ-ONLY SERIAL CONNECTION (PASS)

- **Physical serial link PASS:** E58-CIFQ2 installed with Windows virtual COM driver, Programme Studio `START_READ_ONLY.cmd` connected using `COM7`. Identity command 0503 returned model prefix `E5CC-TQX3A` (10 chars; model suffix still requires physical nameplate); raw status command 0601 returned `0100`.
- **Configuration C3 reads PASSED:** `0000=5`, `0004=0`, `00B9=0`, `00BA=1`, `00BB=0`, `00BC=0`, `00BD=1`, `00BE=0`, `00BF=0`. All were actually returned by real serial I/O, unlike prior simulations.
- **Two application PRE-FLIGHT assumptions discovered to be too restrictive (not physical faults):**
  1. Omron H185 §4-3 lists `in-t=5` as a **valid factory-default Type K, −200..1300 °C** range, resolution 1 °C; `in-t=6` is also Type K but narrower −20.0..500.0 °C, resolution 0.1 °C. App presently hard-codes `C3:0000=6`; needs a deliberate sensor-range policy and range-aware model validation before enabling any writes, not a forced setting change on the controller.
  2. Omron H186 §3-3 maps `C3:00BF=0` to **SP Start**, `=1` to **PV Start**. H185 §5-15-12 specifically advises **rate-of-rise programming + RESET Stop Control** when starting segment zero's ramp from the measured PV; do **not** enable PV Start simply to get that behavior. The app presently hard-codes `C3:00BF=1` in `transfer.py`, and `README.md`/builder references require that value. Correct the specification and tests before enabling writes.
- **Do NOT change hardware settings just to silence the preflight.** Old app reports 7/9 match and **upload blocked**; this is appropriate while write assumptions are under review. Maintain USB-only setup power and leave physical heater AC/DC supplies isolated.
- **NEXT:** Read-only **Back up memory** tab → save all eight programme blocks (`DA` 150 registers per programme, including previously edited Programme 1); save timestamped JSON, no overwrite, preserve copy. This is programme memory backup + nine C3 values **not** a complete controller configuration clone. Upload/stage/save have **NOT** been exercised on physical hardware.
- **Independent sources:** Omron H185 https://files.omron.eu/downloads/latest/manual/en/h185_e5_c-t_users_manual_en.pdf ; H186 https://files.omron.eu/downloads/latest/manual/en/h186_e5_c-t_digital_temperature_controllers_communications_manual_en.pdf?v=1 .

# E5CC-TQX3A5M-000 — front-panel simulator validation

**Test type:** Read-only menu inspection (not heating programme execution)  
**Reference:** Omron H185, E5_C-T User's Manual, §§ 3-3, 3-4, 4-1 and 4-7  
**Simulator:** https://techtinker.club/heater/program-tools/#simulator  
**Target model:** E5CC-TQX3A5M-000 on both channels  
**Issue:** E58-CIFQ2 detected in Device Manager but COM-port driver unavailable (Code 28). This test does not require a COM port.

> **Safety boundary:** Use USB setup power only, normal controller supply safely isolated, and external heater supply safely isolated. No RUN command; no MODE+DOWN RUN/RESET combination; no changes to stored parameter values or initial configuration. The only adjustable value in this test is the **navigation selector** `d.seg` (0, 1, `end`). Don't change `d.prg` if you are uncertain what it selects. If a menu behaves unexpectedly, record it and stop rather than guessing.
>
> `S.ERR` usually means a sensor input error (e.g. missing or unsuitable thermocouple). This is a separate issue from the absent Windows driver. Do not attempt to suppress it by altering `in-t` during the menu test.

## Record these details

- Date/time: __________________________
- Physical channel: ☐ CH1  ☐ CH2
- Full nameplate suffix (photo): __________________________
- Initial upper display: __________ Lower display: __________
- `S.ERR` flashing? ☐ Yes ☐ No
- Normal mains and heater DC safely isolated? ☐ Verified
- Controller powered by E58-CIFQ2 only? ☐ Yes
- Menu protection message or locked key? __________________________

## A. Basic navigation (3 minutes)

Start at normal PV/SV screen.

| Check | Key press | Expected screen | Observed screen / value |
|---|---|---|---|
| A1 | Brief LEVEL once (left rectangular key) | `d.prg` | _______________ |
| A2 | Brief MODE once (second looping-arrow key) | `s-no` | _______________ |
| A3 | Brief MODE once | `d.seg` with `end` normally | _______________ |

**Do not change `s-no` or `d.prg`.** Their displayed values may differ from our simulator's default. Record them exactly.

## B. Segment 0 (5 minutes)

At `d.seg`, select `0` using UP or DOWN. Selection is navigational; it is **not** the segment's end setting. Press MODE to see the first parameter. Keep pressing MODE just long enough to record the relevant screen codes and values.

| Check | Omron display | Meaning | Actual value / visible? |
|---|---|---|---|
| B1 | `d.seg` = `0` | Selected segment | _______________ |
| B2 | `styp` | Ramp / soak / step **if rate-of-rise mode** | _______________ |
| B3 | `sp` | Target setpoint | _______________ |
| B4 | `pr` | Rate slope **if ramp** | _______________ |
| B5 | `time` | Time **if applicable** | _______________ |
| B6 | Next parameter after last segment item | Menu transitions | _______________ |

Write **N/A**, not a guessed value, if a parameter does not appear.

## C. Segment 1 (5 minutes)

Return to `d.seg` using MODE (brief = next; held ≥1 s = previous where supported). Select `1`; press MODE and record all segment items. Do not edit them.

| Check | Omron display | Actual value / visible? |
|---|---|---|
| C1 | `d.seg` = `1` | _______________ |
| C2 | `styp` | _______________ |
| C3 | `sp` | _______________ |
| C4 | `pr` | _______________ |
| C5 | `time` | _______________ |
| C6 | How to return to `d.seg` | _______________ |

## D. Initial settings — inspect, don't edit (7 minutes)

From Programme Setting Level return to Operation by pressing LEVEL **briefly three times**. From Operation hold LEVEL for **at least 3 seconds** to display `in-t`. Use MODE to move through parameters, *without UP or DOWN*.

| Screen | Meaning | Actual value | Shown / hidden |
|---|---|---|---|
| `in-t` | Sensor type | __________ | __________ |
| `d-u` | °C / °F | __________ | __________ |
| `cntl` | PID / ON-OFF | __________ | __________ |
| `t-u` | Programme time unit | __________ | __________ |
| `t-pr` | **Programming method (critical): `time` or `pr`** | __________ | __________ |
| `pru` | Rate denominator (minute/hour) | __________ | __________ |
| `rtsm` | RESET behaviour | __________ | __________ |
| `p-on` | Power-restoration behaviour | __________ | __________ |
| `eset` | Programme-end behaviour | __________ | __________ |

**Important:** The simulator assumes `t-pr=pr`, `t-u=h-m` and `pru=m`. If the real controller is in `time` mode, the actual segment menus differ from the simulator's rate-mode menus. Record the mismatch; don't change `t-pr` to make this test pass.

Exit the Initial Setting Level with LEVEL held **at least 1 second**.

## E. Safe navigation checks (2 minutes, optional)

- [ ] From a parameter page, hold MODE ≥1 s: did the display return to the previous parameter? __________
- [ ] Brief LEVEL presses correctly cycle Operation → Program → Adjustment → PID → Operation? __________
- [ ] `d.seg=end` behaves as programme-wide settings, not an END segment? __________

**Do not** test RUN/RESET, output controls, editable digit shifting or protected/advanced settings during this session. PF can be user-configured to another function, so leave it alone for now.


## Physical controller observation — 13 October 2026 (Channel not yet identified)

Reported by user while controller is powered from E58-CIFQ2 with Windows driver unavailable (Code 28). Normal sensor input currently reports flashing `S.ERR`.

- **Before change:** `t-pr=time`; when `d.seg=0`, the actual controller displayed **only `sp` and `time`**. This is consistent with step-time programming and does not prove the simulator's rate-of-rise display is wrong.
- **User-initiated change:** `t-pr` was changed to `pr`; the resulting Segment 0 parameters were subsequently observed (see below).
- **Observed configuration:** `pru=m`, `t-u=h-m`, `rtsm=stop`, `eset=rst`. Originally `p-on=cont`; user subsequently **changed `p-on=rst`**. **Confirmed retained after full USB unplug/reconnect power cycle** on 13 October 2026; actual RUN-to-power-loss recovery and physical output behaviour remain untested.
- **Programme-wide end settings:** With `d.seg=end`, physical controller showed `rpt=0` (no repeat) and `link=end` (no chaining). Together with `eset=rst`, the configured programme is intended to enter RESET after finishing, subject to bench verification.
- **Programme slot:** `d.prg=0` physically observed; all segment and end-menu values above relate to currently selected programme 0.
- **PID selection and programme alarm display values:** `pid=1`, `al-1=0`, `al-2=0`, `al-3=0` physically observed under `d.seg=end` for programme 0. These are displayed alarm setpoints, **not evidence that alarms are disabled**: actual alarm types, output assignments and function are unverified. The PID gain/time values were not measured or modified.
- **After switching to `t-pr=pr`:** The user confirmed `s-no=1` (one active segment: segment 0). Setting `d.seg=0` revealed `styp=ramp` → `sp=50` → `pr=0` in that order. Validates the rate-mode display flow. Omron H185 §4-7-4 explicitly says `pr=0` causes the segment to behave as a **step** despite `styp=ramp`; a positive rate must be set for an actual ramp. Do not run the test profile yet.

- **Safety follow-up required:** Omron H185 §4-7-4 explains that `p-on=cont` restores interrupted controller programme status. For the heater cabinet, recommend assessment of `p-on=rst` to inhibit automatic post-power-loss continuation. This concerns loss of Omron controller supply, **not ordinary PWM/SSR switching of the independent heater DC supply**. `rtsm=stop` alone is not physical isolation; Omron H185 §6-5 confirms `mv-r` (MV at Reset) is an **Adjustment Level** parameter **masked by default**, with factory default `0.0%` for standard control. Its actual value is **not yet verified** on this unit. Do not change parameter masking merely to display it; verify later by a qualified commissioning method alongside the hardware fail-safe.
- **Navigation result confirmed:** With `d.seg=0`, `styp=ramp` → `sp=50` → `pr=0`, **one further short MODE displayed `d.seg=end`**, rather than `pid`. This is consistent with re-entering programme-wide parameter selection. Updated simulator MODE navigation to match the observed single-segment flow (commit `65da4e0e96d04f2f1c119b3134b776d459849482`). Three alarm screens (`al-1`, `al-2`, `al-3`) were also observed between `pid` and `rpt`; the real controller displayed `0` for each on programme 0. The simulator now shows 0 for these three on slot 0 only (commit `1bba13726904372237201c806d46429b6f75367f`), not implying actual alarm disablement or verified values on other programmes. Multi-segment return behaviour remains to be tested.
- **Menu loop physically confirmed:** With programme 0 selected and `d.seg=end`, pressing MODE after `link=end` returns to `d.prg=0`, exactly as the simulator currently does. This completes the read-only **single-segment Programme Setting Level navigation** comparison (including displayed `pid=1`, `al-1=al-2=al-3=0`, `rpt=0`, `link=end`).
- **LEVEL transition confirmed:** Starting from `d.prg=0` in Programme Setting Level, one brief LEVEL press displayed `l.adj` (Adjustment Level). The user did not report the lower-display value, so no value is assumed.
- **SP mode confirmed:** User reports `spmd=psp` (Program SP Mode) on the physical Omron. This is an **Adjustment Level** parameter. Exact key (MODE vs LEVEL) used to move from `l.adj` to `spmd` has not been confirmed; do not infer it.
- **PID-level transition confirmed:** From `spmd=psp` in Adjustment Level, user pressed brief LEVEL and observed `d.pid=1` (reported as `dpid`). This confirms the PID Setting Level entry and selection of PID set 1. Actual PID tuning values are not recorded; earlier movement from `l.adj` to `spmd` was *probably* MODE, but user was unsure.
- **PID proportional band observed:** A brief MODE from `d.pid=1` showed `1.p` (user transcribed `i.p`) with lower display reported as `8`. This is PID set 1 proportional band; Omron H177 E5_C-T programming diagram lists factory default `8.0` (temperature units °C). Exact displayed decimal place not confirmed by user, so retain reported value `8` in field notes.
- **PID integral time confirmed:** From `1.p`, brief MODE displayed `1.i=233` (user replied 'yep' to expected code/value), corresponding to PID set 1 integral time, 233 seconds. No parameter edits performed.
- **PID derivative time confirmed:** From `1.i=233`, brief MODE displayed `1.d=40`, PID set 1 derivative time 40 seconds. No edits reported. PID set 1 recorded as P=8 (reported display, decimal unverified), I=233 s, D=40 s.
- **PID output upper limit confirmed:** From `1.d=40`, brief MODE displayed `1.olh=100`, corresponding to PID set 1 manipulated-variable (MV) upper limit of 100% as defined by Omron H185 §5-10. This is a *control-output percentage limit*, not an electrical current limit or physical safe isolation setting. No change made.
- **PID output lower limit confirmed:** From `1.olh=100`, brief MODE displayed `1.oll=0`, corresponding to PID set 1 MV lower limit of 0%. P=8 (displayed as reported), I=233 seconds, D=40 seconds, OLH=100%, OLL=0%. None of this establishes safety of physical output at RESET; these are PID set bounds, not independent hardware isolation.
- **PID automatic selection upper limit confirmed:** From `1.oll=0`, brief MODE displayed `1.aut=1320`. Omron's official E5_C/E5_C-T H177 datasheet identifies `1.aut` as **PID 1 Automatic Selection Range Upper Limit** with illustrated default 1320. This is **not** an autotune command. Actual automatic PID-selection behaviour is not tested.
- **Thermocouple input test — basic functional pass:** User connected a Type K thermocouple while controller was USB setup-powered; the flashing `S.ERR` disappeared and the displayed temperature looked sensible. User subsequently confirmed that gently warming the thermocouple junction caused the displayed temperature to rise and then fall after release. This validates qualitative response direction and continuity, **not** calibrated accuracy, output behaviour or any heater controls. No mains or heater supply was required. Windows USB driver remains missing (Code 28).
- **Main LEVEL loop physically confirmed:** From `d.pid=1` in PID Setting Level, one brief LEVEL press returned to the normal Operation Level display, where `S.ERR` was flashing. Together with previous observations, the short-LEVEL sequence Operation → Programme (`d.prg`) → Adjustment (`l.adj`) → PID (`d.pid`) → Operation has been confirmed. `S.ERR` is a sensor-input error to be checked separately, not evidence of a menu/USB driver fault.
- **PID menu loop physically confirmed:** From `1.aut=1320`, one brief MODE returned to `d.pid=1`. The real unit, in its current configuration, **does not show `1.lba`** between them. Physical sequence: `d.pid=1` → `1.p=8` → `1.i=233` → `1.d=40` → `1.olh=100` → `1.oll=0` → `1.aut=1320` → `d.pid=1`. This is a display/menu validation, not verification of PID performance. The simulator was updated to match this **observed set-1 read-only navigation**, commit `eb1f352ba9ad03d7341f96b81076ba3edbb64ac0`, and its button sequence checked with a mock DOM.
- **Next validation:** Continue checking other read-only menus (e.g. Operation Level), or plan an isolated multi-segment programme navigation test once deliberate programming is approved. Keep heater supply isolated and do not RUN. Other PID sets, PID editing behaviour and physically masked settings are not yet validated.
- **Limitations:** USB-only inspection provides no heater-output or restart-interlock qualification.

## Two-segment manual-entry test — 13 October 2026 (in progress)

- User deliberately changed `s-no` from **1 to 2** while the actual selected slot was **`d.prg=0`** (confirmed by user afterward). Thus the modification was applied to Programme 0, not Programme 1. This was identified before editing segment content. Instructed user to restore Programme 0 `s-no=1` first, then select `d.prg=1` and inspect its existing `s-no`. Reversion and programme switch **not yet confirmed**.
- **Programme 1 pre-edit observation:** User reports `s-no=8` after being instructed to select `d.prg=1`. This is eight *active* segments, not proof the programme is empty. No existing segment data has yet been backed up. `s-no=8` recorded before intentional test changes. Programme 0 restoration to `s-no=1` was requested but not explicitly re-confirmed.
- **Next action:** With external heater supply disconnected, confirm permission to repurpose Programme 1 before reducing `s-no` to 2; original eight active segments and any stored values would no longer all be active. Then inspect selected segments before changing setpoints, times and rates. No RUN.
- Intended isolated, non-running test profile: Segment 0 ramp to 50 °C at 2 °C/min, Segment 1 soak 15 min (`0.15` with `t-u=h-m`), `rpt=0`, `link=end`, `eset=rst`. No external heater supply.
- **Segment 0 entered:** User reports having configured Segment 0 `sp=50`, `pr=2` in Programme 1 (the chosen ramp-and-soak test). Exact `styp` setting at this time not independently re-read; previously instructed to set it to `ramp`.
- **Physical multi-segment navigation confirmed:** With `s-no=2` and `d.seg=0`, pressing MODE immediately after `pr=2` **automatically displayed `d.seg=1`**. This differs from the single-segment case where the same key press displayed `d.seg=end`. Simulator updated to auto-select next active segment and to show `end` after the last segment (commit `a760438bd970f2e52a6c6c887c20492355f3bebb`). Both the one-segment and two-segment cases passed mocked-button sequence checks; more-than-two progression is extrapolated, not hardware-verified.
- **Final-segment menu navigation confirmed:** In the two-segment Programme 1 test, user reports MODE advanced from the last Segment 1 parameter to `d.seg=end`, then another MODE advanced to `pid=1`. This validates final-segment return to programme-wide settings. **Segment 1 values physically confirmed by user:** `styp=soak` and `time=0.15` (15 minutes with `t-u=h-m`). Segment 0 had been entered as `styp=ramp` (not re-read), `sp=50`, `pr=2`. Programme 1 `rpt`, `link` and full-profile run behaviour remain unverified.
- **Programme 1 ending confirmed:** User read `rpt=0` and `link=end` under `d.seg=end` for Programme 1. Combined with controller-wide `eset=rst`, this is the intended finish-without-repeat/chain configuration, but the actual RUN/end behaviour and outputs have not been tested.
- **USB power-cycle retention test — both segments pass:** After unplugging E58-CIFQ2 until controller powered down and reconnecting, user confirmed Programme 1 `s-no=2`, Segment 0 `styp=ramp`, `sp=50`, `pr=2`, and Segment 1 `styp=soak`, `time=0.15` all persisted. Programme 1 completion settings (`rpt`, `link`) **have not yet been re-read after this power cycle**. No RUN or output activation.
- **Programme-wide completion settings retained after power cycle:** On Programme 1 after the same USB power cycle, user confirmed `rpt=0` and `link=end` still displayed under `d.seg=end`. Full manually entered profile confirmed to persist: `d.prg=1`, `s-no=2`, segment 0 `styp=ramp`, `sp=50`, `pr=2`, segment 1 `styp=soak`, `time=0.15`, `rpt=0`, `link=end`. Controller-wide `eset=rst` had been observed before power cycle; its persistence was not rechecked in this specific sequence.
- **Test outcome:** PASS for manual button entry, menu progression, and configuration readback after full USB power removal and restoration. NOT YET TESTED: programme execution/RUN sequence, measured PV tracking, timing against actual heater, control SSR output, RESET output behaviour, any safety interlock or USB communications.
- **Next action:** With normal mains and heater DC safely isolated and controller USB powered, navigate to normal Operation Level and inspect displayed status/read-only RESET indication without pressing RUN or changing any parameter. Record screen codes, actual PV, and displayed state. Bench commissioning and controlled heater testing require separate safety review.

## Operation Level follow-up — 13 October 2026

- **Physical navigation:** After returning from PID Setting Level to Operation Level and connecting the Type K sensor, user pressed MODE once. Real controller displayed **`a-m`** (Auto/Manual Switch). This corrects the previous simulator assumption that first MODE would display `r-r`.
- **Next Operation Level screen physically confirmed:** One brief MODE after `a-m` showed **`pgsg=0.00`**. Omron H185 §6-3 defines `pgsg` as **Programme Number / Segment Number Monitor**, formatted programme.segment (e.g. `2.03` means programme 2, segment 3). Here monitor reports programme 0, segment 0; this must not be mistaken for the previously edited Programme 1. During RESET, the monitor does **not** imply active heating.
- **Crucial difference:** In H185 §6-3, `d.prg` (Programme Setting Level) chooses the **editing target**, while `prg` (Operation Level) chooses which programme is used at RUN when RESET and no event-input programme override. `prg` on this particular controller **has not yet been read**, and should be checked before any RUN test. Never assume `d.prg=1` means Programme 1 will run.
- **Simulator patch:** Added `pgsg` and `prg` at their documented operation-menu positions and separated edit programme from RUN programme in the virtual model. Stub later operation monitors are approximations of H185 and not physical-hardware verified. Virtual selection of `prg` is allowed only in RESET. Commit `fa5a518424ec37ddc6dcb2ce2ab8be88249cae4b`; mock-button tests passed.
- **Safety:** Omron H185 §§5-11/6-3 states holding LEVEL for at least three seconds on `a-m` switches to Manual Control Level, where manual MV can take priority even during programme RESET. No such key hold or manual control was requested or tested.
- **Simulator patch:** Inserted a non-editable `a-m` page as first MODE after PV/SP, commit `933950f4aa926477a0674e6c9d0be479db304afb`, and passed a basic button-flow test. Other Operation Level pages and their visibility have **not** yet been validated. Simulator's subsequent `r-r` screen is provisional, not real-hardware confirmed.
- **Operation-level elapsed time monitor confirmed:** While navigating after selecting `prg=1`, user observed `prgt=0` (correcting an earlier transcription of `07`). Omron H185 and H177 define `prgt` as the **Elapsed Program Time Monitor**; zero is expected before RUN, and is not a programme-selection identifier. `pgsg` has not yet been rechecked since choosing `prg=1`. Actual RUN and heater-output behaviour not tested.
- **Operation-level repetition monitor confirmed:** On the next Operation Level screen after `prgt=0`, user observed `rptm=0`. Omron H177 identifies `rptm` as **Program Execution Repetitions Monitor**, different from editable programme `rpt`. Zero is consistent with no recorded programme repetitions; RUN has not been tested. The `pgsg` monitor was subsequently observed indicating Programme 1 after selection.
- **RUN/RESET status confirmed:** Following `prgt=0` → `rptm=0`, brief MODE displayed `r-r=rst` in Operation Level. The controller reports RESET, not RUN. This does **not** verify electrically that the heater/SSR output is inactive. The next display after `r-r` and the post-selection `pgsg` value remain to be observed.
- **Physical RUN programme selector and monitor confirmed:** After `pgsg=0.00`, brief MODE displayed `prg=0`, even though previously edited programme was `d.prg=1`. User intentionally changed `prg` from `0` to `1` with mains/heater DC isolated. The user subsequently observed **`pgsg=1`** (as transcribed; exact decimal/segment suffix not yet confirmed). This confirms the monitor changed to Programme 1 even while `r-r=rst`. **After a subsequent complete USB power cycle, user confirmed `prg=1` was retained.** The RUN/RESET state *after this most recent restart* was not explicitly reported; no heater RUN or physical output verification has been performed.
- **Power-on RESET indication confirmed on real hardware:** After unplugging E58-CIFQ2 USB supply and reconnecting, user verified `prg=1` is retained **and `r-r=rst` appears**. Combined with `p-on=rst` surviving an earlier power cycle, this validates the displayed power-on/reset state for USB setup power. It **does not verify** electrical control output state, restored normal-mains behavior, interrupted RUN recovery, or any independent heater cutoff.
- **Next validation:** Optionally record the exact `pgsg` format on the real controller. The next meaningful stage is a deliberately authorized programme RUN/timing test **only after separately checking Omron USB setup power limitations and maintaining verified isolation of all mains and external heater DC supplies**. Do not treat a software RESET or an indicated RUN as proof of safe heater output.

## 13 October 2026 — USB-only programme timer and SV ramp observed

- **Physical PASS — programme execution internally advances with E58-CIFQ2 USB setup power:** After setting Operation Level `r-r = run` (DOWN from `rst`), the user observed `prgt` **changing over time** and the **SV (programmed setpoint) increasing**. This confirms the real E5CC-T advances its programme clock and calculates an increasing commanded SP while powered from its USB setup cable alone.
- The user did **not** observe an on-screen indication of actual heating. That is consistent with **no live heater and no controller terminal mains supply**; PV response, real output activity, physical heater current, PID following, ramp-to-soak transition, final reset and RUN→RESET key behaviour remain **unverified**.
- **Manufacturer source:** Omron H185 §2-4 states control/alarm/transfer outputs do not operate without the rated controller terminal supply. Its troubleshooting appendix also explicitly states control output cannot turn on when power is supplied via USB-serial conversion cable. H185 §3-3-1 identifies OUT1/OUT2 as assigned **control-output indicators** on the E5CC-T front; indicator behaviour under USB setup power was **not physically checked**. The distinct ramp/soak direction status lights pictured for E5EC-T/E5AC-T are **not** an E5CC-T feature.
- **Important interpretation:** A climbing SV is a setpoint command, **not an indication of measured heating**; the real PV should not be expected to track it on an unheated bench. Output indicator (if active under different powered conditions) is not proof of external 0–60 V heater current.
- **Next physical check:** Monitor `pgsg` at ramp completion if desired, with USB-only and all other supplies isolated. The controller may have wait/hold settings affecting soak entry when PV never reaches SP. Then **return to `r-r = rst`** and report the observed button direction and display result before unplugging USB.
- **Sources:** https://files.omron.eu/downloads/latest/manual/en/h185_e5_c-t_users_manual_en.pdf (sections 2-4, 3-3-1, Appendix A output troubleshooting).
- **Status:** Internal RUN clock/SV ramp PASS; hardware outputs, programme-end action and output-safety functions remain NOT TESTED.
- **Updated code/docs (committed to `master`):** Main manual commit `dd3e4e391824413c44b820be2b8357b3e4fa41a2`, programming guide commit `75a9378547f1d26c1c728c72efc6e9d17488488d`, simulator commit `cc0ccb4b7300af8b738a5fe1cfcfee3abe0a1efb`. Simulator shows a virtual RST lamp but intentionally does **not** model OUT1/OUT2 since no actual output observation exists. The +1/+5-minute buttons deliberately accelerate its simulated time while the actual USB-powered unit's programme clock advances in real time.
- **Regression tests:** PASS: JavaScript syntax and tag nesting for all three pages; observed Operation Level order; DOWN from RST → RUN / UP from RST stays RST / expected virtual reverse direction; visual RST status changes; memory power cycle and sample builder. Physical RUN → RESET direction, indicator illumination and soak/end behaviour require new observations.


## 13 October 2026 — USB-only RUN key behaviour (live physical observation)

- With the E5CC-T powered **only from the E58-CIFQ2 USB setup cable** (normal mains and external heater DC isolated), in Operation Level at **`r-r = rst`**, the user pressed **UP**: `r-r` remained `rst`. Then the user pressed **DOWN**: the real display changed to **`r-r = run`**.
- **PASS: controller accepts the RUN indication from USB-only setup power**. This does **not** yet show that `prgt` increments, a segment advances, PV/SP tracks, any output works, or that heater power could energise. Omron's USB setup-power limitations still apply.
- **Key direction corrected:** `r-r = rst` → **DOWN** → `run`. The reverse `run` → **UP** → `rst` is the logical parameter order and now used by the simulator but **has not yet been physically validated**. Do not assume RESET until it appears on the display.
- **Next physical test:** while USB-only, with the controller currently showing `r-r = run`, use brief MODE presses to locate `prgt`; record the displayed value and whether it increments. Afterwards verify a deliberate return to `r-r = rst` before unplugging.
- **Simulator / guide:** fixed the RUN/RESET arrow orientation in the virtual keypad and updated the USB-only and normal operating procedures. User must continue maintaining electrical isolation throughout the trial.

## 13 October 2026 — documentation and simulator consolidation

**Next USB-only trial procedure documented:** The programming guide now includes [USB-only RUN indication check](https://techtinker.club/heater/omron-programming/#usbtrial) which explicitly requires controller terminal power and heater DC isolated, observes whether `r-r=run` and `prgt` change, and returns to `rst`. H185 also warns against switching the normal controller supply while the USB cable is connected. No physical RUN check yet; this trial cannot verify physical control outputs.


- **Updated user manual:** [Heating Rate Controller](https://techtinker.club/heater/) links the validated bench workflow; [Omron five-button guide](https://techtinker.club/heater/omron-programming/#bench) now specifies Programme 1 entry, no separate Save button, full read-back/power-cycle, `prg` versus `d.prg`, programme-wide settings, operation monitors, PID-1 observed values, hidden `mv-r` and USB setup limitations.
- **Updated interactive simulator:** [Programme Studio](https://techtinker.club/heater/program-tools/#simulator) includes the real RESET menu sequence (`a-m → pgsg → prg → prgt → rptm → r-r`), conditional RUN-only monitors, separate editor/RUN selections, browser-persistent virtual programme memory, a virtual power-cycle retaining `prg`, a one-click load of the verified 50 °C example in Programme 1, and a more complete initial/programme-wide target checklist.
- **Automated simulation tests:** PASS: RESET menu order; `prg` editing and `pgsg` monitor; virtual power cycle and page-reload memory retention; virtual memory clear; bench example builder row values. **Full manual-key test PASS**: entered `d.prg=1`, `s-no=2`, segment 0 `ramp,sp=50,pr=2`, segment 1 `soak,time=0.15`, selected `prg=1`, simulated power cycle and re-read all values. Tests use a mocked browser DOM and do not exercise real controller outputs.
- **Omron manufacturer limitation — confirmed in H185 §§2-4, 5-23:** when powered only from E58-CIFQ2 USB setup cable, the physical unit permits keypad parameter changes and PV display, but control/auxiliary/alarm outputs and event inputs do **not** operate. It remains unknown whether the actual RUN programme/elapsed timer operates under USB power; no such physical trial completed yet.
- **Outstanding:** RUN timing and segment transitions on physical controller, final output commands, physical RESET/output-off verification, protective cut-off and restart inhibition, Channel 2, direct serial connection (Windows E58-CIFQ2 Code 28 still awaiting IT drivers). Confirm exact `pgsg` decimal segment suffix on the real unit if possible.

## Results

- Actual `t-pr`: __________ ; actual `t-u`: __________ ; actual `pru`: __________
- Does `styp` appear for segment 0? ☐ Yes ☐ No
- Does `pr` appear when the selected segment is a ramp? ☐ Yes ☐ No
- Does `time` appear for a soak? ☐ Yes ☐ No
- Did short LEVEL/MODE navigation differ from simulator? __________________________
- Any unexpected screens or messages: __________________________
- Photos recommended: A1–A3, B1–B4, C1–C4, D's `t-pr` and `rtsm`.

## Interpretation and next actions

- Differences in **parameter visibility** may be caused by the `t-pr` programming method, active parameter masking, protections, or model/firmware configuration. Record first; do not assume a broken controller.
- No live-heater, PID response, true temperature tracking, nonvolatile upload/persistence, or safety-interlock behaviour is verified by this menu-only test.
- Share screenshots or the observations above. Update the simulator from observed controller behaviour and H185 documentation, then repeat this test on Channel 2.
- Windows Code 28 / no COM port remains an independent IT-driver issue; direct Python communications must wait until Windows exposes the E58-CIFQ2 correctly.

Reference: https://files.omron.eu/downloads/latest/manual/en/h185_e5_c-t_users_manual_en.pdf
