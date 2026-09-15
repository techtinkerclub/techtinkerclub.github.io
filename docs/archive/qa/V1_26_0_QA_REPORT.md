# 99 Club Studio v1.26.0 — QA report

Date: 11 September 2026

## Automated regression suites

PASS:

- `assets/99club/tests/smoke.js`
  - 105 base families;
  - Year 1–6 generation profiles;
  - 99 Club/PDF invariants.
- `assets/99club/tests/custom-visual-smoke.js`
  - 258 coordinate entries / 43 subtypes;
  - 592 pie entries / 37 subtypes;
  - 416 graphical angle entries / 104 active subtypes.
- `assets/99club/tests/angles-smoke.js`
  - 104 active angle subtypes / 416 pool entries;
  - 24,000 deterministic angle questions.
- `assets/99club/tests/angles-visual-integrity.js`
  - all 416 active rendered-data variants audited.
- `assets/99club/tests/custom-entrypoint-smoke.js`.
- `assets/99club/tests/games-smoke.js`.

## Games-specific checks

PASS:

- 591 curated vocabulary records retained;
- strict topic-safe Word Search/Crossword filtering retained;
- Number Pyramid invariants retained;
- printer-friendly Crossword footprint/rendering retained;
- Magic Square fill/check/repair/transform variants deterministic;
- Magic check result agrees with actual row/column/diagonal sums;
- legacy `find_total` settings migrate to the new `check` mode;
- Mini Sudoku and Latin Square deterministic generation;
- 4×4 and 6×6 solution rows/columns valid;
- Mini Sudoku box constraints valid;
- each accepted Sudoku/Latin pupil puzzle has exactly one solution;
- pupil, answer and combined PDFs generated for Crossword, Magic and Sudoku;
- worked examples generated for every selected compatible engine;
- no browser/network upload path for teacher vocabulary.

## Additional stress checks

- **1,440** Mini Sudoku / Latin Square puzzles generated across Years 1–6, all three difficulty bands and both puzzle styles: **0 non-unique puzzles**.
- **1,000** Magic Square `Is it magic?` reasoning puzzles generated: **0 answer/status mismatches**.
  - sample run contained 437 valid and 563 deliberately broken squares.

## Visual checks

Generated PDFs were rasterised and inspected for:

- worked-example page containing Magic Squares + Mini Sudoku;
- pupil page with a valid `Is it magic?` task and 6×6 Mini Sudoku;
- pupil page with a deliberately broken `Is it magic?` task and 4×4 Latin Square;
- corresponding teacher answer page;
- Sudoku box-rule line weights and answer highlighting;
- absence of internal Magic number-pattern metadata on pupil resources.

No Jekyll/Bundler site build was run in this container; the JavaScript syntax checks and repository regression tests are the executable QA boundary here.
