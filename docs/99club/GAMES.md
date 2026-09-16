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
- Word Codes / Alphametics

### Number logic & grids
- Sudoku
- Futoshiki
- Nonogram / Number Picture
- Number Path
- Number Towers / Skyscrapers
- Binary Puzzle / Takuzu
- Killer Sudoku / Sum Sudoku
- Bridges / Hashi
- Maths Mines / Hidden Gems

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
- Added **Binary Puzzle / Takuzu** as a deterministic unique-solution engine.
- Easy = 4×4, Standard = 6×6, Challenge = 8×8 by default.
- Every accepted Takuzu puzzle is both unique and completable by deterministic Takuzu deductions without guessing.
- Added a reviewed pupil-instruction layer and canonical wording document.

### v1.40
- Adds **Killer Sudoku / Sum Sudoku** with 4×4, 6×6 and optional 9×9 grids. Sudoku row/column/box rules and sum-cage constraints are validated together and every accepted puzzle has one solution.
- Adds **Bridges / Hashi** with 7-, 10- and 12-island solver-verified layouts. Rotations/reflections provide visual variation while a Hashi solver checks uniqueness.
- Adds **Maths Mines / Hidden Gems** with 5×5, 6×6 and 7×7 grids. Clues are removed only while uniqueness remains, then restored as needed until the built-in local-deduction solver can complete the puzzle without guessing.
- Adds **Word Codes / Alphametics** using a curated library of meaningful word equations rather than random letter strings. Current templates include `TWO + TWO = FOUR`, `BASE + BALL = GAMES`, `SEND + MORE = MONEY`, `CROSS + ROADS = DANGER` and `FORTY + TEN + TEN = SIXTY`.
- All four engines ship with pupil preview, answer preview, PDF rendering, settings, worked-example data and automated validation.

### v1.71 — Online Play existing-game wave
- Ports **Number Towers / Skyscrapers**, **Number Property Maze**, **Correct-Answer Maze** and **Maths Crossnumber** into Online Play without replacing their mature printable generators.
- Online generation calls the same deterministic engines and validates generated puzzles before accepting them.
- Interactive square grids use explicit equal row and column tracks so entered values cannot resize cells on mobile.
- Number Towers keeps inward-facing edge-clue directions and solver-verified uniqueness.
- Maze movement is orthogonal only; Number Property Maze preserves the generator's unique valid route and deliberate matching-number dead ends.
- Crossnumber uses one fixed square per digit and keeps blocked cells structurally separate from playable cells.
- `Check` marks only work the pupil has entered or selected. It never fills untouched solution cells.
- `Hint` highlights a useful clue, line or current position and explains a strategy without disclosing the next hidden value or route square.

### v1.73 — Online Play number-structures wave
- Ports **Number Pyramid**, **Magic Squares**, **Arithmagons** and **Magic Number Shapes** into Online Play while continuing to use their mature printable generators as the source of puzzle data and answers.
- Number Pyramid supports forward addition and inverse subtraction reasoning across 3–7 levels, with the existing uniquely-solvable clue masks retained.
- Magic Squares supports fill-missing, check-is-it-magic, repair-one-value and transform variants, including shifted/scaled number patterns and explicit decimal patterns.
- Arithmagons supports triangle through hexagon layouts, addition, multiplication, mixed-operation connections and the existing optional diagonal connections.
- Magic Number Shapes supports triangle, web, bow-tie and star layouts with fill-missing, check and repair variants.
- All four adapters use the shared Online Play shell for Relaxed/Challenge modes, Check, Hint, Undo, Redo, Reset, completion, personal bests and reproducible challenge links.
- Interactive grids and diagrams are responsive on narrow screens; Magic Squares use explicit equal zero-minimum row and column tracks to prevent content-driven mobile distortion.

## Curriculum mapping principle

Puzzle engines are mapped conservatively. They are reasoning/fluency resources that exercise curriculum mathematics; they are not presented as replacements for teaching a statutory objective.

The present Games UI still uses broad topics plus a Year 1–6 range for compatibility. This is increasingly coarse compared with the detailed Custom Worksheet catalogue. A planned Games taxonomy refactor should move toward finer teacher-selected strands/subtopics, with year tags retained internally only where they genuinely control mathematical content or vocabulary.

The statutory curriculum itself is organised by both year and mathematical domain, but many puzzle mechanics cut across several years and are better chosen by the exact skill being practised than by a single year label.

## Pupil instruction standard

Reviewed instruction wording is maintained in `docs/99club/GAME_INSTRUCTIONS.md`.

The standard is:
- start with the pupil action;
- use short, familiar language;
- state every rule needed to begin fairly;
- move hints and strategies into worked examples;
- keep browser preview and PDF wording aligned.

## QA expectation for every game engine

Before an engine is called complete, check Easy/Standard/Challenge where applicable, manual variants, boundary compatibility, pupil preview, answer preview, generated PDF, instruction clarity, mathematical validity and any uniqueness requirement. Maximum grid sizes and dense/long-number cases must be included because they are where clipping and layout drift most often appear.

## Future candidates

After the existing printable catalogue is fully represented in Online Play, the next expansion should be chosen from distinct mechanics rather than adding near-duplicates. Candidates retained for later evaluation include region sums/number partition, domino placement, honeycomb/hex puzzles, equation loops, factor/prime chains, fraction-match grids and coordinate treasure puzzles.
