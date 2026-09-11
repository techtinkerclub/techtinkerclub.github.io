# 99 Club Studio v1.23.1 patch

Apply this overlay on top of v1.23.0.

Main changes:
- per-game configuration cards instead of one global difficulty control;
- Word Search: Words + definitions or Definitions only;
- Word Search: independent difficulty, number of terms and grid size;
- Number Pyramid: independent difficulty, level count and clue density;
- one selected game repeats; several selected games are mixed;
- browser-local settings migration and persistence;
- Games page cache versions bumped.

Run after applying:

    node assets/99club/tests/games-smoke.js

No Custom Worksheet or 99 Club timed-fluency generator files are modified by this patch.
