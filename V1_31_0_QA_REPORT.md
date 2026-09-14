# v1.31.0 QA report

## Baseline verification

Current GitHub `master` was checked before packaging and remained:

`eca75751b367e16bf7a15736ba9a35f0a59f2197`

(v1.30.6 baseline).

## Automated checks passed

- `node --check assets/99club/games-arithmetic.js`
- `node --check assets/99club/games-app.js`
- `node --check assets/99club/games-pdf.js`
- `games-smoke.js` — complete 25-engine library
- `games-number-logic-smoke.js` — 918 deterministic logic activities + invariants
- `games-v1301-review-smoke.js`
- `games-v1302-pdf-parity-smoke.js`
- `games-v1304-number-structures-polish-smoke.js`
- `games-v1305-pdf-centering-smoke.js`
- `games-v1306-pdf-scale-smoke.js`
- `games-v1310-arithmetic-search-crossgrid-smoke.js`

Additional targeted generator stress:
- 1,000 Number Search activities across supported topics / years / direction modes;
- 2,000 Arithmetic Equation Crossgrids across difficulty and operation families;
- no generation errors or validation failures in that stress run.

The older all-arithmetic mega-stress file was updated for the new engine IDs/version and retained, but it is intentionally very large and was not used as the release gate for this patch.

## Number Search ambiguity guard

The final algorithm deliberately keeps answer placements separated, rejects answer strings that would contain/reverse another selected answer, seeds the filler from digits excluded from the selected answers, then safely diversifies filler cells while checking all answer windows. Final validation confirms every intended answer has exactly one valid occurrence.

## Visual QA

A pupil PDF and matching answer PDF were generated containing:
1. Maths Crossnumber in equation mode;
2. Number Search;
3. Arithmetic Equation Crossgrid.

Both were rasterised and checked for clipping, legibility and answer highlighting.
