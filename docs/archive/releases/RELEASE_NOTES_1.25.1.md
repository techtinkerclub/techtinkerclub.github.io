# 99 Club Studio v1.25.1 — vocabulary topic-safety hotfix

Release date: 11 September 2026

## Topic-pure vocabulary games

Word Search and Crossword now draw automatic built-in vocabulary only from the teacher-selected curriculum topic(s).

This closes a catalogue-integration edge case where broad `app_topics` metadata could make general or unrelated vocabulary eligible outside its primary curriculum topic. For example, a Statistics-only pack is now guaranteed to use Statistics vocabulary rather than pulling Geometry, Measurement, Fractions or Calculation terms.

General mathematical-language records remain in the 591-entry master catalogue for future uses, but they are not injected automatically into every topic-specific vocabulary puzzle.

## Puzzle-safe terms

Letter-grid games now reject terms containing numerals or non-word mathematical symbols. The affected built-in records remain in the master vocabulary database for other uses, but are marked unsuitable at runtime for Word Search and Crossword.

Examples deliberately excluded from letter grids include:
- `2-D shape`
- `3-D shape`
- `2-D representation`
- `12-hour clock`
- `24-hour clock`

Spaces, ordinary hyphens and apostrophes remain supported for natural word/phrase answers.

Teacher-created local vocabulary uses the same safety rule so a digit cannot silently disappear when the grid answer is normalised.

## Compatibility

No changes to:
- Magic Squares mathematics or options;
- Number Pyramids;
- Crossword/Word Search layouts;
- PDF output;
- the public 99 Club generator;
- Custom Worksheets, graphs, coordinates, pie charts or graphical angles;
- the 591-entry master vocabulary record count.
