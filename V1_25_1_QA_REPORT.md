# 99 Club Studio v1.25.1 QA report

## Full automated regression — PASS

- `node assets/99club/tests/smoke.js`
- `node assets/99club/tests/custom-visual-smoke.js`
- `node assets/99club/tests/angles-smoke.js`
- `node assets/99club/tests/angles-visual-integrity.js`
- `node assets/99club/tests/custom-entrypoint-smoke.js`
- `node assets/99club/tests/games-smoke.js`
- JavaScript syntax checks for changed Games files

## Existing counts retained

- Base registered families: 105
- Coordinates: 258 entries / 43 subtypes
- Pie Charts: 592 entries / 37 subtypes
- Angles: 416 entries / 104 active subtypes
- Curated master maths vocabulary: 591 records

## Vocabulary topic-purity checks

For every available Year × Games-topic combination, both Word Search and Crossword pools are checked to ensure:
- at least four suitable terms remain available;
- every returned built-in term has that selected topic as its primary curriculum topic;
- no unrelated topic record leaks into the pool;
- every returned term is safe for a letter grid.

A dedicated regression stress test generates **1,000 different Statistics Challenge Word Searches** across Years 2–6 and asserts that every selected term is Statistics vocabulary.

Representative result after the fix included only Statistics terms such as pie chart, sector, tally, pictogram, frequency, time graph, average, questionnaire and survey.

## Numeral/symbol safety

The master records `2-D shape`, `3-D shape`, `2-D representation`, `12-hour clock` and `24-hour clock` are retained, but the mapped Games catalogue exposes both `wordsearchSuitable=false` and `crosswordSuitable=false` for them.

Teacher-created local terms containing numerals/symbols are rejected rather than silently stripping characters from the grid answer.

## Regression boundary

No game rendering, PDF layout, Magic Square generation, Pyramid generation, Custom Worksheet maths, graphical engines or public 99 Club arithmetic paths were changed.
