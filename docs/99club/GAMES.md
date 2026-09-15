# Maths Games & Puzzles — current engine inventory and roadmap

This file is the source of truth for the Games & Puzzles roadmap. Historical backlog/release documents are retained only for context.

## Current visible engine catalogue

### Vocabulary & language
- Maths Word Search
- Maths Crossword

### Number patterns & structures
- Number Pyramid
- Magic Square
- Arithmagons
- Magic Shapes
- Number Trail
- Number Connections (rule wheels, factor webs and sum/product diamonds)

### Arithmetic & calculation
- Correct-answer Maze
- Number Property Maze
- Crossnumber
- Number Search
- Arithmetic Equation Crossgrid
- Target Numbers
- Broken Calculator
- Operation Codebreaker
- Kakuro / Cross Sums
- Arithmetic Cages / Calcudoku-style cages
- Sumplete / Cross-Out Sums

### Algebra & relationships
- Symbol Equations
- Function Machines
- Equation Repair (engine id remains `balance`)

### Number logic & grids
- Sudoku
- Futoshiki
- Nonogram / Number Picture
- Number Path
- Number Towers / Skyscrapers

`Arithmetic Domino Chain` remains hidden from the one-player library. It is a possible future cut-and-match classroom resource, not part of the current pupil puzzle catalogue.

## v1.37 repair/refinement batch

The v1.37 batch closes the outstanding review items before moving to the next puzzle engine:

1. **Operation Codebreaker**
   - Challenge equations with two missing operation slots are rendered in full in PDF.
   - Every missing operation contributes one visible final-code position.
   - Operation→digit keys are larger and more legible in preview and PDF.

2. **Function Machines**
   - The rule graphic is now one connected process/machine rather than unrelated boxes.
   - Input/output ports remain visually distinct and the existing input/output table is retained.
   - Preview and PDF use the same visual concept.

3. **Arithmagons**
   - Diagonal `+ / ×` indicators are moved inward toward the centre of the shape in preview and PDF.

4. **Kakuro**
   - 8×8 is available as a manual grid-size option.
   - Challenge/Year 6 Auto may use 8×8.
   - The 8×8 mask goes through the same uniqueness/validity checks as the existing sizes.

5. **Symbol Equations / Equation Repair**
   - The existing symbol-decoding/mystery-value and repair-tile redesigns are retained after review, with small presentation polish rather than another structural rewrite.

6. **Number Towers / Skyscrapers**
   - Added as a new deterministic number-logic engine.
   - Easy = 4×4, Standard = 5×5, Challenge = 6×6 by default.
   - Uses edge visibility clues and a Latin-square rule (1–N once in every row/column).
   - Clues are reduced only while a unique solution is preserved.
   - Preview, answer preview and PDF ship together.

## Curriculum mapping: Number Towers

The mapping is deliberately modest:
- **Number & place value** — ordering/comparing values and reasoning about relative magnitude.
- **Mathematical reasoning/problem solving** — systematic deduction, elimination and checking constraints.
- **Geometry/spatial reasoning** — supporting viewpoint/position reasoning.

Primary compatibility is Years 3–6. The puzzle is reasoning practice; it is not presented as a replacement for a statutory lesson objective.

## Next new engine: Binary Puzzle / Takuzu

After the v1.37 batch, the next new game is **Binary Puzzle / Takuzu**.

Core rules:
- fill the grid with 0s and 1s;
- each row and column contains equal numbers of 0s and 1s;
- no three identical values appear consecutively horizontally or vertically;
- no two completed rows are identical and no two completed columns are identical;
- every generated pupil puzzle must have a verified unique solution.

Provisional progression:
- **Easy:** 4×4 / 6×6 with generous givens and explicit rule reminder.
- **Standard:** 6×6 with balanced givens.
- **Challenge:** 8×8 with fewer givens and deeper interaction between rules.

Curriculum mapping should remain under number/place-value pattern reasoning and mathematical problem solving rather than overstating a direct statutory objective.

## Ordered future puzzle roadmap

After Takuzu:

1. **Killer Sudoku / Sum Sudoku** — Sudoku plus sum cages; reuse Sudoku and cage machinery where sensible.
2. **Bridges / Hashi** — connect numbered islands with horizontal/vertical bridges, no crossings.

Further candidates retained for later evaluation include Maths Mines, alphametics/number-code addition, region sums/number partition, domino placement, honeycomb/hex puzzles, equation loops, factor/prime chains, fraction-match grids and coordinate treasure puzzles.

## QA expectation for every game engine

Before an engine is called complete, check Easy/Standard/Challenge where applicable, manual variants, boundary year/topic compatibility, pupil preview, answer preview, generated PDF, instruction clarity, mathematical validity and any uniqueness requirement. Maximum grid sizes and dense/long-number cases must be included because they are where clipping and layout drift most often appear.
