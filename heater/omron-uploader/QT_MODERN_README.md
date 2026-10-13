# E5CC-T Programme Studio — modern PySide6 development build

This is the NEW PARALLEL Windows app, not a replacement for the working Tkinter app.py. Its working START_*.cmd launchers are left intact.

## Functional five-step workflow

1. Mode — Connected or completely offline/manual, no website required.
2. Read & Backup — reads Omron model prefix and nine key settings, saves all eight complete DA programme memories, reads selected setup, attempts the H186 expanded C0/C1/C3/C4/C5/C9 inventory, and saves all successful snapshots. A failed extended survey does NOT invalidate an already verified DA backup. Browse existing profiles/curves, or verify a saved upload receipt after a USB power cycle.
3. Programme — PyQtGraph curve and editable Ramp/Soak/Step table; eight memory slots; add, remove, duplicate, reorder; copy from a saved controller backup; four-segment bench example; save/open local offline projects.
4. Initial Settings — searchable, grouped H186 register catalogue, plain-English meaning, original/raw values, numerical and dropdown proposal inputs. All controller-configuration changes are local drafts. Offline baselines correctly say unknown.
5. Apply / Manual — read-only DA difference preview, guarded RAM stage/readback, separate SAVE RAM DATA using the existing TransferSession backend; full offline HTML keypad guide and independent configuration change-risk report.

Serial work is performed in a worker, not the GUI thread. Read-only status checks monitor a disconnected USB port and a non-responsive controller. The app uses a compact sidebar rather than sacrificing graph and table space.

## Boundaries

- This is development code. The Qt build has not yet been verified with the physical controller. Keep the known-good Tkinter ZIP and original programme backup/receipt.
- The H186 extended catalogue is NOT yet qualified as exhaustive for the exact -000 model and its options. Some documented registers may be unavailable.
- Only DA programme-memory writes are implemented; C0/C1/C3/C4/C5/C9 configuration USB writing remains DISABLED. Draft configuration changes block the DA transfer to prevent partial application.
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
