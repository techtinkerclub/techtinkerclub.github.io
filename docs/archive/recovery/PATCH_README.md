# 99 Club Studio v1.31.2 — Arithmetic density + preview correction

## Baseline

Built directly against the current online `master` state:

`62d38a7c11aa832722579cb9aeeab48fdfa22f65`

That commit is the uploaded **v1.31.1 Arithmetic & Calculation review** build. Apply this patch at the repository root, replacing matching files.

## What this fixes

### Maths Crossnumber
- Reworks the placement strategy so Challenge grids branch and cross repeatedly instead of commonly forming staircase / ladder layouts.
- Scores candidate placements for compactness, balanced Across/Down use, multiple crossings and branching.
- Challenge answers now deliberately favour 3- and 4-digit values, including equation clues with larger unknown values.
- Keeps requested 20-clue Challenge grids when possible.
- Adds preview shape-awareness so tall grids scale to the available activity height instead of escaping the frame.

### Arithmetic Equation Crossgrid
- Reworks the 8x8 / 10x10 constructor so new equations may intersect existing equations at more than one number cell.
- Challenge 10x10 now targets a much denser lattice (normally about 17-18 connected equations and ~59% active cells in stress QA).
- Retains genuine mixed `+ - × ÷` mode and sequentially-solvable hidden cells.

### Kakuro preview
- Leaves the direct PDF renderer unchanged.
- Enlarges browser-preview Kakuro grids and uses the available activity space better.
- Keeps conventional dark clue/blocked cells, white diagonal separators and clearer clue positioning.

### Arithmetic Cages preview
- Fixes the v1.31.1 CSS regression where an `!important` thin cell border overrode the heavier cage boundaries.
- Internal cell lines remain visible, while cage walls are again clearly dominant.

## Files changed

- `_pages/99-club-games.md` — cache bumps for CSS / arithmetic / app.
- `assets/99club/games-arithmetic.js` — Crossnumber and Crossgrid generator improvements.
- `assets/99club/games-app.js` — Crossnumber preview shape hook.
- `assets/99club/games.css` — Crossnumber containment, Kakuro preview polish, Arithmetic Cage wall fix.
- `assets/99club/tests/games-v1311-arithmetic-review-smoke.js` — later-version cache compatibility.
- `assets/99club/tests/games-v1312-arithmetic-density-preview-smoke.js` — new regression coverage.

## Cache versions

- `games.css`: v19 -> v20
- `games-arithmetic.js`: v5 -> v6
- `games-app.js`: v18 -> v19
- PDF and number-logic asset versions are unchanged because their renderers/engines are not modified in this patch.

## Regression boundary

No intended changes to:
- Number Search uniqueness logic;
- Target Number, Broken Calculator or Operation Codebreaker maths;
- direct PDF styling for Kakuro / Arithmetic Cages;
- Number Patterns fixes already accepted;
- Custom Worksheets / Angles;
- Vocabulary / Crossword;
- Random Pack or personalisation.

## After upload

Hard-refresh `/tools/99-club/games/`. Review a Challenge Crossnumber, a 10x10 Challenge Equation Crossgrid, a 9x9 Kakuro and a 6x6 Arithmetic Cages preview.
