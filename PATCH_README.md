# 99 Club Studio v1.25.0 — Magic Squares patch

Apply this overlay directly over the accepted **v1.24.2** repository.

## Adds

- Magic Squares as the fourth Games & Puzzles engine.
- 3x3 and 4x4 generated squares.
- Fill missing values, find the magic total, spot & fix an error, and transform-the-square variants.
- Classic, shifted, scaled and age-appropriate decimal number patterns.
- Per-game difficulty, square size, puzzle style, number pattern and clue-density controls.
- Richer pupil worked examples for all four current game engines.
- Automatic clue enumeration such as `(5, 5)` for multi-word crossword answers.
- Enumeration on Definitions-only Word Searches where the hidden answer has multiple words/hyphens.

## Preserved

- Existing Word Search, Number Pyramid and Crossword behaviour.
- Selective single-activity replacement in Games preview.
- Pupil / answer / combined direct PDF downloads.
- The 591-entry curated vocabulary catalogue.
- Public 99 Club generator maths and Custom Worksheet question engines.

## Deployment

Copy this ZIP over the v1.24.2 repository, preserving paths. Then hard-refresh:

`/tools/99-club/games/`

The cache-busted Games assets are already referenced by `_pages/99-club-games.md`.
