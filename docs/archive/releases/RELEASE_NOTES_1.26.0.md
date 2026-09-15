# 99 Club Studio v1.26.0 — Magic reasoning + Mini Sudoku / Latin Squares

Release date: 11 September 2026

## Magic Squares reasoning refresh

The former **Find the magic total** activity has been replaced by a stronger reasoning task:

- **Check: is it a magic square?**
- pupils check rows, columns and both main diagonals;
- if two totals differ they can stop and explain why;
- if the square is valid they need evidence that the required totals agree;
- generated check puzzles deliberately mix valid and broken squares.

The remaining Magic Square variants are retained:

- Fill missing values;
- Spot & fix the error;
- Transform the square;
- Mixed variants.

Internal number-generation descriptions such as `step 3, starting 24` remain in activity data for reproducibility but are no longer shown on pupil/answer previews or PDFs.

## New game engine: Mini Sudoku & Latin Squares

A fifth printable game engine has been added under **Logic & patterns**.

Teacher options:

- Easy / Standard / Challenge;
- Auto / 4×4 / 6×6;
- Auto mix / Mini Sudoku / Latin Square;
- More / Balanced / Fewer clues.

Mini Sudoku requires each number once in every row, column and outlined box. Latin Squares use the row/column rule only.

Every generated puzzle is solved by the engine before it is accepted. Clues are removed only while the resulting puzzle retains exactly one solution.

## Game setup UX

The setup interaction has been simplified:

- game cards show **Configure** when closed;
- the open card shows **Done**;
- Done actually removes the specialist setup panel;
- selecting a game no longer forces its setup to remain open;
- all per-game settings remain saved while the panel is collapsed.

## Worked examples

Mini Sudoku / Latin Squares participate in the common worked-example system. The example explains the row/column/box rules, demonstrates a single missing-cell deduction and includes a tip and common-mistake warning.

The existing richer Magic Square worked example is retained.

## Compatibility

No changes to the public 99 Club generator, Custom Worksheets, graph/coordinate/pie/angle engines, curated vocabulary count, printer-friendly Crossword layout or the existing PDF download split.
