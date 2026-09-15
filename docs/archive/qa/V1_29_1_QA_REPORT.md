# QA report - Games & Puzzles v1.29.1

Date: 14 September 2026

## Baseline verification

The patch was rebuilt against the live GitHub v1.29.0 state rather than the older v1.28.0 local snapshot. The live repository versions of `games-engine.js`, `games-app.js`, `games-pdf.js`, `games.css` and `games-smoke.js` were byte-identical to the v1.28.0 baseline files used to build the earlier work; the newer v1.29 behaviour lives in `games-pack-mode.js`, `games-random-ui.js`, page wiring and release/test files. This allowed the vocabulary changes to be merged without overwriting the v1.29 random-pack work.

## Automated regression suite

PASS:

- Main 99 Club smoke: 105 base families + Year 1-6 generation profiles + progression/PDF invariants.
- Custom visual smoke: 258 coordinate entries / 43 subtypes; 592 pie entries / 37 subtypes; 416 angle entries / 104 active subtypes; mixed visual generation and marking contract.
- Angle smoke: 24,000 deterministic questions across the 104 active angle subtypes.
- Angle visual-integrity audit: all 416 active rendered-data variants.
- Custom entrypoint regression.
- Games smoke: complete 23-engine definition set, 591 curated vocabulary entries, mixed difficulty contracts and PDF invariants.
- Arithmetic expansion stress: 23,400 deterministic activities + 5,360 topic-routing activities + deep invariants across all 13 arithmetic/algebra engines.
- Numeric-logic stress: 918 deterministic activities + uniqueness/invariant checks across 5 numeric-logic engines.
- Vocabulary refinement smoke: 300 Challenge Crosswords plus exact Mixed allocation across all 22 visible one-player engines.
- v1.29 pack-mode compatibility smoke: 20-puzzle manual Mixed pack and full 40-activity random pack.

## Word Search rule QA

Straight, Diagonal and All-direction puzzles were generated and their child-facing / PDF rule text was checked against the actual direction vectors. The PDF uses text-safe wording rather than relying on arrow glyphs.

## Crossword generation benchmark

The old live algorithm and the refined algorithm were run over the same 600 fixed Challenge seeds with a 12-entry target.

| Metric | live v1.29 baseline | v1.29.1 |
|---|---:|---:|
| Average entries | 12.000 | 12.000 |
| Average crossing cells | 11.582 | 14.570 |
| Crossing cells / entry | 0.965 | 1.214 |
| Average grid footprint | 254.50 | 227.72 |

This is about 25.8% more crossing cells with about 10.5% less grid area, without reducing the 12-answer target.

## Crossword containment stress

A deliberately harsh three-Crosswords-per-page PDF was rendered at Easy, Standard and Challenge with 12 answers and a 17x17 generation grid. The rendered page confirmed that all grids, clues and word banks remained inside their activity frames.

A separate 20-Crossword Mixed pack was rendered across 10 pupil pages. Pages 1, 5 and 10 were inspected and remained inside their frames.

## Mixed difficulty QA

All 22 visible one-player engines were generated as 10-puzzle Mixed packs at 30 / 50 / 20. Every engine produced exactly 3 Easy, 5 Standard and 2 Challenge activities with no generation errors.

A 20-Crossword pack at 25 / 50 / 25 produced exactly 5 Easy, 10 Standard and 5 Challenge puzzles.

The live v1.29 random-pack wrapper was then loaded on top of the refined engine. A 40-activity Challenge random pack produced all 40 requested activities over 20 two-up sheets, confirming that the v1.29 exact-count workflow is not regressed.
