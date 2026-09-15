# v1.29.2 QA report — Crossword browser geometry

## Root cause

The final v1.29.1 CSS containment rule set `.tt99-crossword-grid` to `height:100%`. For a rectangular crossword, that made CSS Grid row tracks taller than column tracks. Since each answer cell retained a square aspect ratio, vertically adjacent cells no longer touched. The generator data and crossing coordinates were correct; the browser renderer was distorting them.

## Fix

The final override now uses `width:100%`, `height:auto`, no forced max-height, and preserves `aspect-ratio: var(--cw) / var(--ch)`. Existing density-specific maximum widths remain in place.

## Browser geometry test

Real Chromium rendering was checked for 1-, 2- and 3-activity layouts using deliberately asymmetric Challenge crosswords. Adjacent occupied cells differed by no more than 0.016 px (sub-pixel rounding) and every crossword grid stayed inside its activity frame.

## Regression suite

The following existing suites pass after the fix:

- main 99 Club smoke test;
- Custom visual smoke;
- Angles smoke and visual-integrity audit;
- Custom entrypoint smoke;
- Games smoke;
- arithmetic expansion stress;
- numeric-logic stress;
- v1.29.1 pack compatibility;
- Vocabulary & Language refinement smoke.

The Vocabulary refinement test now also asserts that the final crossword geometry override cannot regress to `height:100%`.
