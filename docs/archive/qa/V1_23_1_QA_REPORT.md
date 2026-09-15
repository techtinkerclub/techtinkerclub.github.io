# 99 Club Studio v1.23.1 QA report

## Scope

Games & Puzzles per-engine configuration refactor only.

## Automated checks

PASS:

- `node --check assets/99club/games-engine.js`
- `node --check assets/99club/games-app.js`
- `node assets/99club/tests/games-smoke.js`
- `node assets/99club/tests/smoke.js`
- `node assets/99club/tests/custom-visual-smoke.js`
- `node assets/99club/tests/angles-smoke.js`
- `node assets/99club/tests/angles-visual-integrity.js`
- `node assets/99club/tests/custom-entrypoint-smoke.js`

## Games contract verified

- 128 built-in vocabulary entries retained.
- Word Search and Number Pyramid both expose independent `defaultSettings` and `settingsSchema` metadata.
- Word Search generation supports `words_definitions` and `definitions` clue modes.
- Word Search difficulty/grid size/term count are independent of Number Pyramid settings.
- Number Pyramid difficulty/level count/clue density are independent of Word Search settings.
- Mixed packs respect the teacher's selected compatible engines.
- Selecting one engine repeats that engine.
- Incompatible engines are not forced into a topic.
- Personal vocabulary remains local-only; no network upload path is introduced.

## Regression status

- 105 base worksheet families PASS.
- Coordinates: 258 entries / 43 subtypes PASS.
- Pie charts: 592 entries / 37 subtypes PASS.
- Angles: 416 entries / 104 active subtypes PASS.
- 24,000 deterministic angle questions PASS.
