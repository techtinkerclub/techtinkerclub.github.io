# 99 Club Studio v1.30.0 - Number Patterns & Structures patch

## Baseline

Apply this patch to the current live **v1.29.2** repository state, commit:

`35e0434e586d8f687d7cbbd7ac0006d92733c2ba`

Do not apply it to the old v1.28.x snapshot.

## What it changes

- deeper but numerically controlled Number Pyramids (up to 7 levels);
- expanded Arithmagons (larger polygons, selected diagonals, across-pack mixed operations, mixed operations within a puzzle, blank writable nodes);
- expanded Magic Number Shapes including bow-tie and repair variants;
- retains Number Trails & Snakes without unnecessary redesign;
- renames/reworks Number Wheels, Flowers & Diamonds as **Number Connections** with Rule Wheels, Factor Pair Webs and Sum & Product Diamonds;
- adds a shared answer-key convention that distinguishes answer-supplied values from original givens;
- preserves v1.29 Random Pack, Mixed difficulty and v1.29.2 crossword fixes.

## Files in this patch

- `_pages/99-club-games.md` - cache-bust updated Games assets;
- `assets/99club/games-engine.js` - deeper Pyramids, Arithmagon pack mixing, answer-state support;
- `assets/99club/games-arithmetic.js` - Arithmagon, Magic Number Shapes and Number Connections engine changes;
- `assets/99club/games-app.js` - browser renderers, new labels/options, blank writable nodes and answer highlighting;
- `assets/99club/games-pdf.js` - direct-PDF renderers and answer highlighting;
- `assets/99club/games.css` - refined diagram layouts and greyscale-safe answer styling;
- `assets/99club/tests/games-smoke.js`;
- `assets/99club/tests/games-arithmetic-expansion-smoke.js`;
- `assets/99club/tests/games-v1291-pack-compat-smoke.js`;
- `assets/99club/tests/games-number-structures-smoke.js` - new v1.30 category regression;
- `RELEASE_NOTES_1.30.0.md`;
- `V1_30_0_QA_REPORT.md`.

## After upload

Hard-refresh the Games & Puzzles page once. Asset query versions were increased so normal visitors should also receive the new files without stale browser cache.
