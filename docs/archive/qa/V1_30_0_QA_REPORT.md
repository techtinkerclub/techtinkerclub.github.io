# v1.30.0 QA report - Number Patterns & Structures

## Baseline

Built on the live repository state at commit `35e0434e586d8f687d7cbbd7ac0006d92733c2ba` (v1.29.2 cumulative Vocabulary & Language state).

## Targeted Number Patterns & Structures regression

`games-number-structures-smoke.js` passes.

It checks:

- explicit Number Pyramid levels 3-7 across repeated seeds;
- controlled starting values for 6- and 7-level pyramids;
- unique-determination rank checks for pyramid clues;
- Auto depth progression by year/difficulty;
- triangle/square/pentagon/hexagon Arithmagons;
- selected diagonals and mixed operations within one Arithmagon;
- genuinely blank writable nodes;
- exact across-pack addition/multiplication mixing for Auto Arithmagons;
- Year 1 addition-only Auto behaviour;
- Magic bow-tie invariants and repair variants;
- Number Trails regression stability;
- Number Connections subtype names and challenge contracts;
- browser and direct-PDF answer-fill conventions.

## Existing regression suites

The following existing suites pass with the v1.30.0 code:

- `smoke.js` - 105 base families + Year 1-6 profiles + progression/PDF invariants;
- `custom-visual-smoke.js` - graphs, 258 coordinate entries, 592 pie entries, 416 angle entries and mixed visual generation;
- `angles-smoke.js` - 24,000 deterministic generated angle questions;
- `angles-visual-integrity.js` - 416 rendered-data angle variants;
- `custom-entrypoint-smoke.js`;
- `games-smoke.js` - 23 engines + 591 curated vocabulary entries;
- `games-arithmetic-expansion-smoke.js` - 23,400 deterministic base activities + 5,360 topic-routing activities across the 13 arithmetic engines;
- `games-number-logic-smoke.js` - 918 deterministic numeric-logic activities with uniqueness/invariant checks;
- `games-v1291-pack-compat-smoke.js` - exact 20-puzzle Mixed manual pack + 40-activity v1.29 Random pack;
- `games-vocabulary-refinement-smoke.js` - 300 Challenge crosswords plus exact Mixed difficulty across all 22 visible engines;
- `games-number-structures-smoke.js` - new category-specific regression.

The combined all-suite command exceeded the execution window while beginning the Vocabulary refinement test. The Vocabulary refinement and Number Patterns tests were then rerun separately and both passed.

## JavaScript syntax checks

`node --check` passes for all modified runtime and regression files:

- `games-engine.js`
- `games-arithmetic.js`
- `games-app.js`
- `games-pdf.js`
- modified/new Games test files

## Visual / PDF QA

An 8-page pupil + answer QA pack was generated with representative v1.30 activities and rendered at 160 dpi for visual inspection.

Checked examples include:

- 7-level Number Pyramid;
- Challenge Arithmagon with mixed operations and diagonals;
- Magic bow-tie repair puzzle;
- Number Trails;
- Rule Wheels;
- Factor Pair Webs;
- Sum & Product Diamonds;
- Magic Squares;
- matching teacher-answer pages.

The render shows writable nodes as blank on pupil pages and answer-supplied values visibly differentiated from original givens on answer pages. No clipping, black boxes or broken glyphs were observed in the inspected render.

QA PDF: `v130-number-structures-qa.pdf` (provided separately with the patch).
