# 99 Club Studio v1.23.0 QA report

## Automated regression — PASS

Run from repository root:

- `node assets/99club/tests/smoke.js`
- `node assets/99club/tests/custom-visual-smoke.js`
- `node assets/99club/tests/angles-smoke.js`
- `node assets/99club/tests/angles-visual-integrity.js`
- `node assets/99club/tests/custom-entrypoint-smoke.js`
- `node assets/99club/tests/games-smoke.js`

## Games & Puzzles checks

- 128 curated built-in vocabulary entries.
- Word Search exercised for every supported topic × year × Easy/Standard/Challenge combination.
- Deterministic generation checked for each case.
- Every placed word is checked against the corresponding grid cells.
- Challenge `Auto` mode uses definition clues.
- Number Pyramids exercised across Years 1–6 and all three difficulties.
- Every pyramid is deterministic and every parent cell equals the sum of the two cells below it.
- Generated clue masks preserve enough independent information for a unique solution.
- Calculation mixed packs contain both Word Search and Number Pyramid.
- Incompatible topics such as Geometry do not receive Number Pyramids.
- Same-game mode repeats the selected compatible engine.
- Built-in and personal vocabulary remain distinguishable.
- Games UI contains no `fetch`, `XMLHttpRequest` or `sendBeacon` path for teacher vocabulary.

## Custom Worksheets checks

- All eight graphical angle families register under `Geometry`.
- No standalone `Angles & turns` accordion remains in the Custom selector.
- Angle generation remains 104 active subtypes / 416 variants.
- 24,000 deterministic generated angle questions pass the Angles smoke suite.
- Both duplicate Custom-page entrypoints remain byte-for-byte synchronised.

## Build note

A full local Jekyll build could not be run in the ChatGPT container because the Ruby `bundle` executable is not installed. JavaScript syntax checks and the full repository Node regression suite above pass.
