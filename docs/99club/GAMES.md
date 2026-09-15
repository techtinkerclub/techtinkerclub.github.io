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
- Equation Repair (engine id remains `balance` while the redesign is being evaluated)

### Number logic & grids
- Sudoku
- Futoshiki
- Nonogram / Number Picture
- Number Path

`Arithmetic Domino Chain` remains hidden from the one-player library. It is a possible future cut-and-match classroom resource, not part of the current pupil puzzle catalogue.

## Current repair/refinement batch

These items should be fixed before or alongside the next new engine:

1. **Operation Codebreaker — critical Challenge repair**
   - Challenge may contain two missing operation slots.
   - Every slot must be visible in preview and PDF.
   - Final unlock-code box count must exactly match visible operation blanks.
   - Replace tiny compact mappings such as `+:4 -:5 x:1 /:7` with larger, clearly separated key tiles.
   - Strengthen lock labels and final code hierarchy.
   - Add regression coverage for two-operation Challenge locks.

2. **Function Machines visual refinement**
   - Keep the input/output table.
   - Turn the rule graphic into one connected machine/process rather than a row of independent rectangles.
   - Use distinct input/output ports, stronger operation chambers and clear flow arrows.
   - Tighten spacing between machine and table.
   - Maintain preview/PDF parity.

3. **Arithmagons diagonal operation markers**
   - On dashed diagonal connections, place +/x operation indicators inward toward the centre of the shape so they remain visible and clearly associated with the connection.
   - Apply the same placement rule in preview and PDF.

4. **Kakuro 8x8**
   - Add 8x8 to manual grid-size options.
   - Verify generation, uniqueness/validity, preview, answer preview and PDF.
   - Review whether Auto should select 8x8 at suitable difficulty/year combinations.

5. **Symbol Equations / Equation Repair**
   - Continue visual and classroom-usefulness review before treating the current redesigns as final.

## Next new engine: Number Towers / Skyscrapers

The next new puzzle after Sumplete is **Skyscrapers / Towers**, preferably presented to teachers/pupils as **Number Towers** with the familiar puzzle name available in supporting text.

Core rule: each row and column contains each tower height exactly once; clues around the grid show how many towers are visible from that direction because taller towers hide shorter towers behind them.

### Curriculum mapping
Primary mapping should be honest rather than overstated:
- Number & place value: ordering/comparing numbers and reasoning with relative magnitude.
- Mathematical reasoning/problem solving: systematic deduction, elimination and checking constraints.
- Position/spatial reasoning as a supporting skill.

Provisional compatibility: Years 3–6, subject to generation and classroom review.

### Difficulty model
- **Easy:** 4x4, generous edge clues and straightforward deductions.
- **Standard:** 5x5, reduced clue set while retaining a unique solution.
- **Challenge:** 6x6, carefully reduced clues and deeper deduction.

Every accepted puzzle must have a mathematically verified unique solution. Preview, answer view and PDF must ship together.

## Ordered future puzzle roadmap

After Number Towers:

1. **Binary Puzzle / Takuzu** — balanced 0/1 rows and columns, no triples, no duplicate rows/columns.
2. **Killer Sudoku / Sum Sudoku** — Sudoku plus sum cages; reuse Sudoku and cage machinery where sensible.
3. **Bridges / Hashi** — connect numbered islands with horizontal/vertical bridges, no crossings.

Further candidates retained for later evaluation include Maths Mines, alphametics/number-code addition, region sums/number partition, domino placement, honeycomb/hex puzzles, equation loops, factor/prime chains, fraction-match grids and coordinate treasure puzzles.

## QA expectation for every game engine

Before an engine is called complete, check Easy/Standard/Challenge where applicable, manual variants, boundary year/topic compatibility, pupil preview, answer preview, generated PDF, instruction clarity, mathematical validity and any uniqueness requirement. Maximum grid sizes and dense/long-number cases must be included because they are where clipping and layout drift most often appear.
