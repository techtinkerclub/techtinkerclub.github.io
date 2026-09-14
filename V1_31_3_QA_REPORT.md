# v1.31.3 QA — Random Pack mixed difficulty

## Scope

This QA pass covers only the new weighted mixed-difficulty behaviour in Random Pack mode and regression protection for the existing fixed-difficulty and manual workflows.

## Automated checks

`assets/99club/tests/games-random-pack-smoke.js` now verifies:

- fixed Challenge Random Packs still generate every activity at Challenge;
- fixed-difficulty worked examples retain the selected level;
- an 8-activity 25/50/25 pack allocates exactly 2 Easy / 4 Standard / 2 Challenge;
- a 6-activity 20/50/30 pack uses largest-remainder allocation of 1 / 3 / 2;
- relative weights such as 1/2/1 normalize to 25/50/25;
- the mixed plan remains deterministic for the same seed;
- manual mode still preserves each selected engine's own difficulty;
- the UI exposes Mixed mode, all four presets and the derived-Standard explanation.

Local Node syntax checks and the expanded random-pack smoke test pass.

## Regression boundary

No intentional changes to:

- individual game generators;
- arithmetic/category generation added in v1.31.2;
- direct PDF layout/rendering;
- manual game selection and individual engine settings;
- year/topic compatibility filtering;
- personalisation or answer-sheet behaviour.
