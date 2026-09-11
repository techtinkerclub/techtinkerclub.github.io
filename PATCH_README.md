# 99 Club Studio v1.26.0 patch

Apply this overlay directly on top of **v1.25.1**.

## Main changes

- replaces Magic Squares `Find the magic total` with **Check: is it a magic square?** reasoning;
- removes internal Magic number-generation metadata from pupil/answer resources;
- fixes game setup collapse: **Configure → Done** genuinely closes the specialist setup panel;
- adds **Mini Sudoku & Latin Squares** with 4×4/6×6, per-game difficulty/style/clue controls and unique-solution validation;
- adds worked examples and PDF/answer rendering for the new logic engine;
- updates Help and regression tests.

After deployment, hard-refresh `/tools/99-club/games/` so the bumped asset versions are loaded.
