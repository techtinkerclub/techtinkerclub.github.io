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
- Binary Puzzle / Takuzu

`Arithmetic Domino Chain` remains hidden from the one-player library. It is a possible future cut-and-match classroom resource, not part of the current pupil puzzle catalogue.

## Recent refinement batches

### v1.37
- Fixed Challenge Operation Codebreaker multi-slot rendering.
- Improved Function Machines and Arithmagons.
- Added Kakuro 8×8.
- Added Number Towers / Skyscrapers with verified unique solutions.

### v1.38
- Refined Codebreaker layout.
- Rebuilt Function Machines as a clean process/flowchart diagram.
- Added inward-pointing Number Towers clue tabs and cleaned the grid edge rendering.

### v1.39
- Adds **Binary Puzzle / Takuzu** as a deterministic unique-solution engine.
- Easy = 4×4, Standard = 6×6, Challenge = 8×8 by default.
- Supports manual 4×4 / 6×6 / 8×8 sizes and starting-digit density controls.
- Preview, answer preview and PDF use the same puzzle data.
- Adds a reviewed pupil-instruction layer and a canonical instruction wording document at `docs/99club/GAME_INSTRUCTIONS.md`.

## Curriculum mapping: Number Towers

The mapping is deliberately modest:
- **Number & place value** — ordering/comparing values and reasoning about relative magnitude.
- **Mathematical reasoning/problem solving** — systematic deduction, elimination and checking constraints.
- **Geometry/spatial reasoning** — supporting viewpoint/position reasoning.

Primary compatibility is Years 3–6. The puzzle is reasoning practice; it is not presented as a replacement for a statutory lesson objective.

## Curriculum mapping: Binary Puzzle / Takuzu

Takuzu is mapped conservatively rather than presented as a direct statutory objective:
- **Number & place value / number patterns** — reasoning with two values and balanced quantities.
- **Mathematical reasoning/problem solving** — systematic deduction, elimination and checking multiple simultaneous constraints.
- **Algebraic/pattern reasoning** — recognising and extending constrained patterns.

Primary compatibility is Years 3–6. The puzzle is intended as compact mathematical reasoning practice.

Core rules:
- fill the grid with 0s and 1s;
- each row and column contains equal numbers of 0s and 1s;
- no three identical values appear consecutively horizontally or vertically;
- no two completed rows are identical and no two completed columns are identical;
- every generated pupil puzzle has a verified unique solution.

Default progression:
- **Easy:** 4×4 with generous starting digits.
- **Standard:** 6×6 with balanced starting digits.
- **Challenge:** 8×8 with fewer starting digits and deeper interaction between rules.

## Next new engine: Killer Sudoku / Sum Sudoku

The next planned engine after Takuzu is **Killer Sudoku / Sum Sudoku** — Sudoku combined with outlined sum cages. Reuse the existing Sudoku and arithmetic-cage machinery where sensible, while still validating every generated puzzle for a unique solution.

## Ordered future puzzle roadmap

1. **Killer Sudoku / Sum Sudoku**
2. **Bridges / Hashi** — connect numbered islands with horizontal/vertical bridges, no crossings.

Further candidates retained for later evaluation include Maths Mines, alphametics/number-code addition, region sums/number partition, domino placement, honeycomb/hex puzzles, equation loops, factor/prime chains, fraction-match grids and coordinate treasure puzzles.

## Pupil instruction standard

The reviewed instruction wording is maintained in `docs/99club/GAME_INSTRUCTIONS.md`.

The standard is:
- start with the pupil action;
- use short, familiar language;
- state every rule needed to begin fairly;
- move hints and strategies into worked examples;
- keep browser preview and PDF wording aligned.

## QA expectation for every game engine

Before an engine is called complete, check Easy/Standard/Challenge where applicable, manual variants, boundary year/topic compatibility, pupil preview, answer preview, generated PDF, instruction clarity, mathematical validity and any uniqueness requirement. Maximum grid sizes and dense/long-number cases must be included because they are where clipping and layout drift most often appear.
