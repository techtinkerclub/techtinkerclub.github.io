# 99 Club Studio v1.29.1 Vocabulary & Language patch

## Baseline

Apply this patch to the current live v1.29.0 repository state (the state containing `games-pack-mode.js`, `games-random-ui.js` and `RELEASE_NOTES_1.29.0.md`).

This patch must **not** be applied to the older v1.28.0 ZIP as a substitute for v1.29.0.

## Changed files

- `_pages/99-club-games.md` - cache-bust updated Games assets while preserving the v1.29 random-pack scripts.
- `assets/99club/games-engine.js` - Word Search direction rules, stronger Crossword placement, exact per-game Mixed difficulty, 40-activity pack compatibility.
- `assets/99club/games-app.js` - Mixed difficulty controls/weights and replacement fidelity.
- `assets/99club/games-pdf.js` - Word Search rule line and hard Crossword containment / clue fitting.
- `assets/99club/games.css` - Mixed controls and Crossword containment styles.
- `assets/99club/tests/games-smoke.js` - updated regression contract.
- `assets/99club/tests/games-vocabulary-refinement-smoke.js` - new category-specific regression.
- `assets/99club/tests/games-v1291-pack-compat-smoke.js` - verifies compatibility with the live v1.29 pack-mode wrapper.
- `RELEASE_NOTES_1.29.1.md`
- `V1_29_1_QA_REPORT.md`

## Important compatibility point

The patch intentionally does not replace `games-pack-mode.js` or `games-random-ui.js`. Those are the newer v1.29 files already in the live repo and remain the source of truth for Random compatible packs.

After uploading, hard-refresh the Games & Puzzles page once so the new `games.css?v=13`, `games-engine.js?v=13`, `games-pdf.js?v=9` and `games-app.js?v=13` assets are loaded.
