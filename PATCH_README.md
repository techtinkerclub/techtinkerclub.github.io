# 99 Club Studio v1.31.1 — Arithmetic & Calculation review patch

## Baseline

Built directly against the current online `master` state of `techtinkerclub/techtinkerclub.github.io`:

`8bec53c7af567216bbf2ba4900c7c0a8e92269a7`

That is the uploaded **v1.31.0 Arithmetic Search & Crossgrid** build reviewed in the browser and PDF.

Apply this ZIP at the repository root, replacing matching files, then hard-refresh `/tools/99-club/games/` once.

## Review fixes included

### Correct-Answer Maze
- Adds explicit 8×8 and 10×10 grid options.
- Adds 12- and 15-question path options.
- Challenge Auto can use a larger/longer route.
- Keeps the existing unambiguous-step validation: every question has exactly one valid neighbouring answer.

### Maths Crossnumber
- Expands clue choices to 8 / 12 / 16 / 20.
- Expands working grids to 11×11 through 17×17.
- Auto now targets approximately 8 / 12 / 16 clues by difficulty.
- Candidate and layout search is strengthened so larger Challenge grids can place more connected entries.
- Browser preview is constrained/scaled so larger grids and clue lists do not escape the activity frame.

### Number Search
- Keeps the v1.31.0 ambiguity guard.
- Adds an independent regression scanner that exhaustively checks every permitted direction and verifies each intended numerical answer occurs exactly once.

### Arithmetic Equation Crossgrid
- Adds 5×5, 8×8 and 10×10 choices.
- Adds **All four operations mixed** (`+ − × ÷`) within one puzzle.
- Larger grids generate connected equation lattices rather than simply adding unused space.
- Unused cells are rendered dark/black in preview and PDF.

### Target Number Challenge
- Moves allowed operations into the main pupil instruction.
- Direct PDF is redesigned to match the browser card layout more closely: given-number tiles, target card and working space.

### Broken Calculator
- Direct PDF now uses calculator-key tiles and larger target/work cards, much closer to the preview presentation.

### Missing Operations → Operation Codebreaker
- Renamed/reframed as **Operation Codebreaker**.
- Missing operation signs use large, proper operator slots rather than a tiny square or PDF `?`.
- Each equation is an individual lock.
- Solved signs are copied in order into a final **Unlock Code** strip.
- Answer PDF fills the operator tiles and final code.

### Kakuro · Cross Sums
- Adds an explicit 9×9 grid option.
- Keeps Challenge Auto at 7×7 for practical generation speed; teachers can request 9×9 explicitly.
- Blocked/clue cells are dark in preview and direct PDF, with light clue text/diagonals for normal Kakuro readability.

### Arithmetic Cages
- Darkens the normal internal cell grid in preview and PDF.
- Cage outlines remain substantially heavier so cage boundaries are still visually dominant.

### Missed Number Patterns items
- **Magic Number Shapes:** star geometry now uses safe drawing bounds in preview and PDF so outer nodes cannot leave the activity frame.
- **Number Connections:** six-item preview gets a dedicated non-overlapping 3×2 layout; six Rule Wheels use a larger 3×2 PDF layout instead of six tiny diagrams.

## Cache versions

- `games.css`: 18 → 19
- `games-arithmetic.js`: 4 → 5
- `games-number-logic.js`: 2 → 3
- `games-pdf.js`: 15 → 16
- `games-app.js`: 17 → 18

## Regression boundary

No intentional changes to:
- public 99 Club fluency sheets;
- Custom Worksheets / Angles;
- vocabulary Word Search/Crossword content;
- Number Logic engines other than the explicit Kakuro option/styling and Arithmetic Cages grid-line styling;
- personalisation;
- Random Pack behaviour.
