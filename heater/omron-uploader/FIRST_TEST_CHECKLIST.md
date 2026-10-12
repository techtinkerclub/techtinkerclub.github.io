# First hardware session — keep this beside the controller

**Device:** E5CC-TQX3A5M-000 (verify full side label)  
**Cable:** E58-CIFQ2  
**Scope:** strictly de-energised identification and backup on the first visit. **No upload at first connection.**

## Before connecting

- [ ] Controller physically isolated from mains and DC heater power; safe isolation verified by competent personnel.
- [ ] All SSR/heater output paths safely separated; no hazardous live load attached.
- [ ] Full side label photographed/recorded: E5CC-TQX3A5M-000, serial no. __________.
- [ ] Mark which physical channel is being tested: CH1 / CH2.
- [ ] Windows USB driver installed/approved; E58-CIFQ2 cable available.
- [ ] Portable program extracted to a trusted local folder; READ ONLY launcher selected.

## Read-only session

- [ ] Device Manager shows the Omron cable COM port ______.
- [ ] Connect, select port, and read `0503` identity. Returned first ten characters ______.
- [ ] `0601` status recorded ______; app does not claim output safety from status alone.
- [ ] Nine C3 settings recorded; any mismatch investigated before writing.
- [ ] Backed up eight full DA programme areas to `________________________`.
- [ ] Copy the backup file to a second secure location and preserve it.
- [ ] Check the programme's actual manual-menu values on the physical Omron.

**STOP here on the first visit unless the protocol and memory map have been independently reviewed against your physical controller.**

## Only after formal bench validation — controlled transfer

- [ ] Programme generator produces expected graph and Omron values.
- [ ] Intended programme memory selected (0–7) and prior data preserved.
- [ ] All lab authorisation checks completed; physical heater isolation reconfirmed.
- [ ] Read-only plan shows ONLY intended addresses and values.
- [ ] Stage in RAM; each write immediately read back.
- [ ] Examine all staged values; separately authorise nonvolatile save.
- [ ] Save receipt; independently disconnect/reconnect USB setup power (heater still isolated).
- [ ] Verify saved registers match receipt *after* reconnect; keep both files.
- [ ] Check physical controller screen for segment types, SP, slopes, soak times, repetitions and links.
- [ ] Verify Omron power-up RESET, end RESET, MV-at-reset inactive, interlocks, SSR OFF and independent emergency isolation.
- [ ] Carry out qualified, instrumented inert-load test before any hazardous experiment.

**Never treat a successful USB transfer as proof that the heating system is safe.**
