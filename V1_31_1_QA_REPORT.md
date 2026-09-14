# v1.31.1 QA report

## Baseline verification

Immediately before packaging, GitHub `master` remained:

`8bec53c7af567216bbf2ba4900c7c0a8e92269a7`

The locally reconstructed baseline blobs were checked against live GitHub blob SHAs for:
- `_pages/99-club-games.md`
- `games-app.js`
- `games-arithmetic.js`
- `games-number-logic.js`
- `games-pdf.js`
- `games.css`

They matched exactly.

## Automated checks passed

Syntax:
- `node --check` for all modified runtime JS and the v1.31.1 regression.

Regression suites:
- `games-smoke.js` — complete 25-engine library.
- `games-number-logic-smoke.js` — 918 deterministic base activities plus deep invariants; now also exercises explicit 9×9 Kakuro.
- `games-v1301-review-smoke.js`
- `games-v1302-pdf-parity-smoke.js`
- `games-v1304-number-structures-polish-smoke.js`
- `games-v1305-pdf-centering-smoke.js`
- `games-v1306-pdf-scale-smoke.js`
- `games-v1310-arithmetic-search-crossgrid-smoke.js`
- `games-v1311-arithmetic-review-smoke.js`

The historical all-arithmetic mega-stress file was updated to the new arithmetic module version. It is intentionally extremely large and was not used as the release gate; the focused current suites above cover the modified contracts directly.

## v1.31.1 targeted generator checks

The new regression includes:
- repeated 10×10 Correct-Answer Maze generation + validation;
- repeated requested 20-clue Challenge Crossnumbers, requiring at least 16 connected entries;
- an **independent** Number Search occurrence scanner across straight, diagonal and backwards modes (450 generated searches in this suite), requiring exactly one occurrence for every target answer;
- 5×5 / 8×8 / 10×10 Arithmetic Equation Crossgrids, with 10×10 mixed mode required to contain all four operations;
- Target Number main-instruction operation list;
- Operation Codebreaker uniqueness and final-code length checks;
- explicit 9×9 Kakuro generation and uniqueness validation.

## PDF visual QA

Five pupil pages and five answer pages were generated and rasterised at review resolution. They cover:
1. 10×10 Correct-Answer Maze + large Maths Crossnumber;
2. Target Number Challenge + Broken Calculator;
3. Operation Codebreaker + 10×10 four-operation Equation Crossgrid;
4. 9×9 Kakuro + Arithmetic Cages;
5. six Rule Wheels + Challenge Magic Star.

Visual inspection confirmed:
- no clipping in the reviewed PDF pages;
- Target/Calculator hierarchy and writing space are substantially improved;
- Codebreaker uses large operator boxes, not question-mark placeholders;
- Crossgrid/Kakuro blocked cells print dark and remain readable;
- Arithmetic Cage internal lines remain visible while cage borders stay dominant;
- six Rule Wheels are materially larger in the 3×2 arrangement;
- the Magic Star remains inside its activity bounds.
