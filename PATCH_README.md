# 99 Club Studio v1.25.1 patch

Apply this overlay directly on top of **v1.25.0**.

Purpose:
- keep Word Search / Crossword vocabulary strictly within selected curriculum topic(s);
- prevent numeral/symbol terms such as `3-D shape` from entering letter-grid puzzles;
- reject unsafe teacher-added local vocabulary rather than silently stripping characters;
- add regression coverage including 1,000 Statistics-only Word Searches.

Changed runtime files:
- `_pages/99-club-games.md`
- `assets/99club/games-engine.js`
- `assets/99club/games-app.js`

QA/test:
- `assets/99club/tests/games-smoke.js`
- `RELEASE_NOTES_1.25.1.md`
- `V1_25_1_QA_REPORT.md`

No PDF renderer or other 99 Club / Custom mathematics files are changed.
