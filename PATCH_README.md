# v1.26.1 patch instructions

Apply this patch **on top of v1.26.0**.

It fixes the v1.26.0 Games & Puzzles startup crash and expands the Sudoku engine to full 9×9 support.

After deployment, hard-refresh `/tools/99-club/games/` once so the bumped asset versions are loaded.

Quick deployment checks:

1. Games & Puzzles loads with no setup panel open.
2. Configure any game, then press Done; the panel should disappear completely.
3. Open Sudoku & Latin Squares → Grid size → choose 9×9.
4. Generate a new version and confirm a 9×9 grid with 3×3 heavy box boundaries.
5. Download pupil and answer PDFs and confirm both render the same Sudoku footprint.

