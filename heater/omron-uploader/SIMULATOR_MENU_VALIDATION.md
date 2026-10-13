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
- **User-initiated change:** `t-pr` was changed to `pr`. Subsequent Segment 0 parameter visibility **has not yet been checked**.
- **Observed configuration:** `pru=m`, `t-u=h-m`, `rtsm=stop`, `p-on=cont`, `eset=rst`.
- **After switching to `t-pr=pr`:** Setting `d.seg=0` revealed `styp=ramp` → `sp=50` → `pr=0` in that order. Validates the rate-mode display flow. Omron H185 §4-7-4 explicitly says `pr=0` causes the segment to behave as a **step** despite `styp=ramp`; a positive rate must be set for an actual ramp. Do not run the test profile yet.

- **Safety follow-up required:** Omron H185 §4-7-4 explains that `p-on=cont` restores interrupted controller programme status. For the heater cabinet, recommend assessment of `p-on=rst` to inhibit automatic post-power-loss continuation. This concerns loss of Omron controller supply, **not ordinary PWM/SSR switching of the independent heater DC supply**. `rtsm=stop` alone is not physical isolation; Omron H185 §6-5 confirms `mv-r` (MV at Reset) is an **Adjustment Level** parameter **masked by default**, with factory default `0.0%` for standard control. Its actual value is **not yet verified** on this unit. Do not change parameter masking merely to display it; verify later by a qualified commissioning method alongside the hardware fail-safe.
- **Next validation:** Check `s-no` to determine the active segment count, then inspect `d.seg=1` (if active) without changing parameters; capture segment format and visible fields. Do not RUN.
- **Limitations:** USB-only inspection provides no heater-output or restart-interlock qualification.

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
