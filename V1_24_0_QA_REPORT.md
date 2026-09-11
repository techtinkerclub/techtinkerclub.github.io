# 99 Club Studio v1.24.0 QA report

## Automated regression — PASS

- JavaScript syntax:
  - `games-vocabulary.js`
  - `games-engine.js`
  - `games-app.js`
- `node assets/99club/tests/smoke.js`
- `node assets/99club/tests/custom-visual-smoke.js`
- `node assets/99club/tests/angles-smoke.js`
- `node assets/99club/tests/angles-visual-integrity.js`
- `node assets/99club/tests/custom-entrypoint-smoke.js`
- `node assets/99club/tests/games-smoke.js`

## Games checks

- Curated built-in vocabulary: **591 records**.
- Word Search deterministic generation exercised across every available year/topic combination.
- Word direction presets validated so restricted modes cannot silently emit reversed/upward placements.
- Single-term Word Search replacement verified to keep all non-selected terms unchanged.
- Number Pyramid deterministic generation/invariants retained for Y1–Y6 at Easy/Standard/Challenge.
- Crossword deterministic generation checked across every Games topic; placed answer letters are validated against the rendered grid.
- Stress pass: 1,760 Crosswords across topic/year/difficulty seeds — **0 generation failures**; minimum connected crossword size 6 answers.
- Stress pass: 1,760 Word Searches across topic/year/difficulty seeds — **0 generation failures**; minimum 7 placed terms.
- Mixed packs exercise Word Search + Number Pyramid + Crossword.
- Worked-example pack produces one example per selected compatible engine.
- Geometry packs do not force incompatible Number Pyramids.
- Teacher vocabulary remains local; UI contains no `fetch`, `XMLHttpRequest` or `sendBeacon` upload path.

## Existing regression checks retained

- Base families: 105.
- Coordinates: 258 entries / 43 subtypes.
- Pie charts: 592 entries / 37 subtypes.
- Angles: 416 entries / 104 active subtypes.
- Angles deterministic exercise: 24,000 questions.
- Custom entrypoint: PASS.

## Browser/render limitation of this QA environment

The container's Chromium binary does not complete even a headless `about:blank` render because of its runtime/DBus environment, so this release could not use Chromium screenshot/PDF inspection here. The standalone preview is supplied for real-browser review before deployment. Node generation/regression tests and JavaScript syntax checks pass.
