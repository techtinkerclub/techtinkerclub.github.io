# 99 Club Studio v1.31.0 — Arithmetic Search & Crossgrid

## Baseline

Built directly against the current online `master` state:

`eca75751b367e16bf7a15736ba9a35f0a59f2197`

That is the uploaded **v1.30.6 PDF scale polish** baseline. Apply this ZIP at the repository root, replacing matching files.

## What this introduces

### Maths Crossnumber — equation clue mode
The existing Maths Crossnumber is extended rather than duplicated.

New **Clue type** setting:
- Auto for selected maths
- Arithmetic calculations
- Solve equations
- Mixed calculations + equations

For Year 6 / Algebra selections, Auto can now favour equation clues such as `3x + 4 = 25`, with the solved numerical value entered into the crossing digit grid.

### Number Search — new engine
Pupils solve numerical questions first, then locate each answer as a string of digits in a search grid.

Options include:
- Easy / Standard / Challenge / Mixed difficulty
- 8 / 10 / 12 / 15 calculations
- 9×9 / 11×11 / 13×13 / 15×15 grid
- horizontal + vertical only
- add diagonals
- add backwards directions

The generator explicitly prevents duplicate/accidental occurrences of the intended answers. Filler digits remain visually varied rather than being restricted to a tiny digit set.

### Arithmetic Equation Crossgrid — new engine
A compact interlocking across/down equation grid. Number cells are shared between horizontal and vertical equations, so solving one line unlocks another.

Options include:
- additive relationships
- multiplication/division relationships when appropriate
- adjustable clue density
- harder levels can hide operation signs as well as numbers

The hidden-cell selection is validated so the puzzle retains a sequential solving route.

## Browser + PDF

Both new engines include:
- browser pupil preview
- browser answer preview
- direct PDF pupil rendering
- direct PDF answer rendering
- worked-example support
- Random Pack / pack generation compatibility
- per-engine configuration controls

## Existing behaviour preserved

No intended regression to:
- Number Patterns & Structures v1.30.6 PDF fixes
- Word Search / vocabulary Crossword
- public 99 Club fluency sheets
- Custom Worksheets / Angles
- Number Logic engines
- personalisation
- Random Pack

## Cache changes

- `games.css`: v17 → v18
- `games-arithmetic.js`: v3 → v4
- `games-pdf.js`: v14 → v15
- `games-app.js`: v16 → v17

## After upload

Hard-refresh `/tools/99-club/games/` once, then review the **Arithmetic & calculation** category. It should now include Number Search and Arithmetic Equation Crossgrid, and Maths Crossnumber should expose the new clue-type option.

### Regression housekeeping
The v1.30.5/v1.30.6 cache-bust assertions are relaxed to accept later PDF asset versions while still rejecting versions older than their respective fixes.
