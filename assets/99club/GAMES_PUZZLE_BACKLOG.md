# 99 Club Studio · Games & Puzzles Backlog

_Last updated: 14 September 2026_

This document captures promising puzzle types for future expansion of the **Maths Games & Puzzles** section.

## Selection rule

A puzzle should only be added when it has:

- a clear mathematical purpose;
- a proper deterministic/seeded generator;
- a validity check and, where appropriate, a uniqueness solver;
- meaningful Easy / Standard / Challenge progression;
- a pupil-friendly explanation with minimal unnecessary text;
- strong browser-preview and PDF/print parity;
- layouts that remain readable on ordinary A4 school printers.

The aim is not to maximise the number of puzzle types. Each new engine should add a genuinely different reasoning mechanic or useful curriculum application.

## Curriculum-coverage rule

Puzzle mechanics and curriculum coverage must now be planned together. We should not keep adding attractive logic puzzles while leaving important primary maths content weakly represented.

A puzzle may only claim a curriculum topic when solving the puzzle genuinely practises that mathematical idea. Merely using prime numbers as cell values, for example, does **not** make a puzzle a prime-number activity unless pupils must recognise or reason about primality.

Particular gaps / under-used areas to target deliberately are:

- **fractions** — equivalence, comparison, fraction arithmetic, fractions of quantities, mixed/improper forms;
- **number properties** — primes, factors, multiples, common factors/multiples, divisibility, square/cube numbers;
- **decimals and percentages** — equivalence and conversion, ordering, arithmetic and percentage relationships;
- **ratio and proportion** — equivalent ratios, scaling and sharing;
- **measurement** — area/perimeter relationships, units and conversion where a puzzle mechanic genuinely fits;
- **coordinates and geometry** — route, transformation and spatial puzzles rather than only isolated questions;
- **statistics/data** — generated chart/graph interpretation puzzles where the visual itself is part of the task.

The existing Custom Worksheet curriculum map should be used as the source of truth for year appropriateness. Games & Puzzles should complement it, not duplicate every direct-question family.

### Coverage-led variants to build into suitable engines

- Sumplete: whole-number mode first, then **fraction** and **decimal** modes where age-appropriate.
- Divisibility / Property Maze: primes, factors, multiples, square/cube numbers, divisibility, equivalent fractions, FDP equivalence.
- Factor / Number Chains: factors, common factors, multiples, prime relationships and multiplication fact families.
- Fraction Match Grid: fractions ↔ equivalent fractions ↔ decimals ↔ percentages.
- Honeycombs / Hex Grids: fraction, multiplication and sequence variants.
- Coordinate Treasure: coordinates, translation/reflection and route reasoning.
- Region / tiling puzzles: area, perimeter and fractional parts when the geometry is honest and visually generated.

---

## Wave 1 · Highest priority puzzle mechanics

### 1. Sumplete / Cross-Out Sums
A grid of numbers with a target for each row and column. Pupils cross out numbers so the remaining values make every target.

**Why it fits**
- very arithmetic-heavy;
- simple visual language;
- easy to scale by grid size and number range;
- lends itself to exact solution checking;
- highly printable;
- suitable for later fraction and decimal variants.

### 2. Skyscrapers / Towers
A Latin-square style puzzle where each value represents a building height. Edge clues tell how many buildings are visible from that direction.

**Why it fits**
- genuinely different logic mechanic;
- combines ordering, comparison and deduction;
- natural 4×4, 5×5 and 6×6 progression;
- deterministic solver can guarantee uniqueness.

### 3. Binary Puzzle / Takuzu
Fill a grid with 0s and 1s so each row/column contains equal numbers of each, no three identical values are adjacent, and no two complete rows/columns are identical.

**Why it fits**
- concise rules;
- highly generatable;
- strong logical reasoning;
- visually clean for print.

### 4. Killer Sudoku / Sum Sudoku
Sudoku combined with outlined cages whose cells must total a given number.

**Why it fits**
- reuses existing Sudoku and Arithmetic Cages concepts;
- arithmetic + logic in one puzzle;
- relatively efficient to implement using existing infrastructure;
- familiar format for teachers and pupils.

### 5. Bridges / Hashi
Numbered islands are joined with one or two horizontal/vertical bridges. The number on an island gives the total bridges connected to it; bridges cannot cross.

**Why it fits**
- very different spatial reasoning mechanic;
- strongly visual with little text;
- scalable difficulty;
- suitable for a dedicated uniqueness solver.

---

## Coverage track · bring forward alongside Wave 1

These should not wait until every Wave 1 logic engine is complete because they address important curriculum gaps.

### A. Divisibility / Property Maze
Navigate a grid by selecting cells that satisfy a mathematical rule, for example:
- prime numbers;
- multiples of 6;
- factors of 48;
- square/cube numbers;
- numbers divisible by a specified value;
- equivalent fractions;
- fraction/decimal/percentage equivalents;
- values greater/less than a target.

This should be distinct from the existing Correct-Answer Maze because the reasoning is classification/property based rather than a sequence of separate questions.

### B. Factor Chains / Number Chains
Arrange or follow numbers so neighbouring values satisfy a rule, such as:
- share a factor;
- one divides the other;
- share a common factor greater than 1;
- sum to a prime;
- form a multiplication fact family;
- satisfy a stated multiple/factor rule.

### C. Fraction Match Grid
A logic/grid puzzle linking equivalent fractions, decimals and percentages rather than a simple matching-card exercise. Variants should include fraction-only equivalence for younger pupils and FDP equivalence for Years 5–6.

---

## Wave 2 · Strong follow-up candidates

### 6. Coordinate Treasure Puzzle
Use coordinates to reveal a route, shape, picture or hidden message. Could build on the existing coordinate-question infrastructure while offering a much more game-like activity.

### 7. Missing Number Honeycombs / Hex Grids
Hexagonal number structures using horizontal and diagonal rules. Variants could target:
- addition;
- multiplication;
- fractions;
- sequences;
- missing-number reasoning.

### 8. Domino Sum Placement
Place a supplied set of dominoes into a grid so row/column or region targets are satisfied.

This should be a true placement puzzle, not simply the previous domino matching/chain format.

---

## Further candidates

### 9. Maths Mines / Neighbour-Count Puzzle
A child-friendly Minesweeper-style puzzle where clues show how many hidden stars/gems/marked cells surround each square.

### 10. Alphametics / Number Code Addition
Letters or symbols stand for digits. Start with compact primary-friendly forms such as `A7 + 2B = 95`; later consider full alphametics if a robust uniqueness solver is practical.

### 11. Number Partition / Region Sums
Shade, divide or assign cells into regions so numerical conditions are satisfied. Could support addition, multiplication, area, fractions or target sums.

### 12. Equation Loop / Arithmetic Loop
A continuous route through numbers/operators where each section forms valid arithmetic relationships. Intended to feel like a puzzle rather than isolated missing-operation exercises.

---

## Possible additional variants / later exploration

- prime-pair puzzles;
- ratio/proportion chains;
- percentage conversion paths;
- multiplication-table logic grids;
- arithmetic word wheels / radial number structures;
- codebreaker variants using number properties;
- area/perimeter tiling puzzles;
- coordinate battleship-style activities;
- symmetry completion puzzles;
- transformation-route puzzles;
- graph/data interpretation puzzles where the graph itself is generated;
- more advanced number-code and cryptarithm variants.

---

## Near-term development order

The next work should deliberately interleave new mechanics with curriculum gaps:

1. **Sumplete / Cross-Out Sums** — whole-number engine first; design data model so fractions/decimals can follow without a rewrite.
2. **Divisibility / Property Maze** — explicitly cover primes, factors, multiples and related number properties.
3. **Skyscrapers / Towers**.
4. **Fraction Match Grid** — make fractions a first-class puzzle topic rather than an afterthought.
5. **Binary Puzzle / Takuzu**.
6. **Factor Chains / Number Chains**.
7. **Killer Sudoku / Sum Sudoku**.
8. **Bridges / Hashi**.
9. **Coordinate Treasure Puzzle**.
10. **Missing Number Honeycombs / Hex Grids**.
11. **Domino Sum Placement**.

After each engine is implemented, review it in browser preview and PDF before starting the next one. Do not batch many unreviewed engines together.

## Regression / quality rules inherited from previous work

- deterministic for a given seed;
- no fake difficulty: Easy/Standard/Challenge must change meaningful puzzle properties;
- all generated answer keys must be validated;
- unique-solution puzzles must be proven unique by the engine, not assumed from construction;
- clue placement should be deliberate, not merely random deletion;
- mixed difficulty must continue to respect pack-wide weighted allocation;
- engine settings must survive switching modes and re-rendering;
- browser preview and direct PDF should tell the same mathematical story;
- printed supporting text must remain readable at normal A4 size;
- grids/graphics must stay inside their activity frame at every supported size;
- worked examples must use the same rules as the real engine;
- do not silently weaken an engine just to make generation faster: use bounded attempts and a valid fallback or fail cleanly;
- do not tag a puzzle to a curriculum topic unless the solving process actually exercises that topic;
- preserve existing engines and layout fixes unless a change is specifically required.
