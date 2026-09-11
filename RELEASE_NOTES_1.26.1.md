# 99 Club Studio v1.26.1 — Games recovery + full Sudoku

Date: 11 September 2026

## Critical Games & Puzzles recovery

v1.26.0 introduced a browser-startup regression in the Games page. The UI attempted to read `defaultSettings` for the active game before checking whether a setup panel was actually open. Because the normal startup state deliberately has no active setup panel, `/tools/99-club/games/` could fail before rendering.

v1.26.1 fixes the order of that check and also makes the per-engine settings lookup defensive. The normal compact startup state now renders with no setup panel open; Configure opens one panel and Done collapses it again.

The Games page asset cache keys are bumped so a deployed browser does not keep stale v1.26.0 JavaScript.

## Sudoku rather than only “Mini Sudoku”

The logic-game card is renamed **Sudoku & Latin Squares**.

Sudoku sizes now include:

- 4×4 with 2×2 boxes;
- 6×6 with 2×3 boxes;
- full 9×9 with 3×3 boxes;
- Auto for year/difficulty.

Auto remains deliberately conservative: younger pupils stay on smaller grids; most KS2 automatic packs use 6×6; older Challenge packs can move to full 9×9. If a teacher explicitly selects 9×9, Auto puzzle style chooses Sudoku rather than a 9×9 Latin Square.

Every generated 4×4, 6×6 and 9×9 puzzle continues to be uniqueness-checked by the solver. Latin Squares remain available explicitly as the row/column-only derivative.

## Rendering

Browser preview and the direct PDF exporter both support the 9×9 grid. Sudoku box boundaries are drawn at 3×3 intervals, and 9×9 preview text sizes are reduced appropriately in multi-activity layouts.

