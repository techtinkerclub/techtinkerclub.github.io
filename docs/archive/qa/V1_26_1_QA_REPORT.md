# 99 Club Studio v1.26.1 QA report

Date: 11 September 2026

## Regression cause reproduced

The v1.26.0 Games page failure was reproduced in headless Chromium. Initial render raised:

`TypeError: Cannot read properties of undefined (reading 'defaultSettings')`

Stack location: `engineSettings()` called by `renderEngineConfiguration()` while `state.activeEngine` was the normal empty-string startup value.

The fix checks for a real/compatible active engine before requesting its settings and also uses a defensive optional lookup for default settings.

## Browser runtime check

A standalone page built from the exact v1.26.1 Games assets was executed in headless Chromium with the setup panel initially closed.

- Initial page render: PASS, no page errors.
- Games root populated: PASS.
- Sudoku & Latin Squares card visible: PASS.
- 9×9 pupil and answer preview grids: PASS, 81 cells each.
- Configure opens one setup panel: PASS.
- Done closes the setup panel completely: PASS.
- No runtime errors after open/close cycle: PASS.

## Full 9×9 Sudoku checks

Forced 9×9 Sudoku was generated across Easy / Standard / Challenge seeds.

- 9×9 dimensions: PASS.
- 3×3 box geometry: PASS.
- Rows contain 1–9 exactly once in the solved grid: PASS.
- Columns contain 1–9 exactly once: PASS.
- Every 3×3 box contains 1–9 exactly once: PASS.
- Solver reports exactly one solution after clue removal: PASS.
- Deterministic generation from a fixed seed: covered by Games smoke suite.
- Year 6 Challenge + Auto can select 9×9 Sudoku: PASS.

A separate 60-puzzle forced-9×9 regression (20 per difficulty) is included in `games-smoke.js`.

## PDF visual check

A Challenge 9×9 Sudoku was exported to pupil, answer and combined PDFs and raster-inspected.

- 3×3 heavy box boundaries visible: PASS.
- Thin internal cell lines visible: PASS.
- Pupil digits readable: PASS.
- Answer fills readable and distinguishable from givens: PASS.
- Student puzzle has exactly one solution: PASS (50 blanks in inspected sample).

## Full existing regression suite

- `smoke.js`: PASS — 105 base families.
- `custom-visual-smoke.js`: PASS — 258 coordinate entries / 43 subtypes; 592 pie entries / 37 subtypes; 416 angle entries / 104 active subtypes.
- `angles-smoke.js`: PASS — 24,000 deterministic generated angle questions.
- `angles-visual-integrity.js`: PASS — 416 rendered-data angle variants.
- `custom-entrypoint-smoke.js`: PASS.
- `games-smoke.js`: PASS — 591 vocabulary records; topic-safe Word Search/Crossword; Number Pyramid; Magic Square reasoning; Sudoku/Latin Squares including full 9×9; PDF and selective-replacement contracts.

