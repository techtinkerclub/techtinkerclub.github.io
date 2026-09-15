# 99 Club Studio v1.23.1 — Per-game setup for Games & Puzzles

Release date: 11 September 2026

## Games & Puzzles UX

- Removes the shared/global game difficulty control.
- Adds a scalable game-card library: teachers include one or more compatible games and open only one game's setup panel at a time.
- One selected game repeats across the pack; multiple selected games are mixed through the pack.
- Keeps pack-level controls limited to year range, curriculum topics, sheet count, activities per sheet and answer pages.
- Each game now owns its own settings contract (`defaultSettings` + `settingsSchema`) so future engines can add specialist controls without cluttering the whole page.
- Per-game settings are stored locally in the browser and migrated from the previous Games settings where possible.

## Maths Word Search

- Two explicit clue styles:
  - **Words + definitions** — every supplied term is shown together with its mathematical meaning.
  - **Definitions only** — pupils infer the terms from definitions before locating them.
- Word Search now has its own difficulty, term-count and grid-size controls.
- Bare word-bank-only pupil sheets are no longer generated.

## Number Pyramid

- Number Pyramid has its own independent difficulty.
- Adds explicit level count (Auto / 3 / 4 / 5).
- Adds clue density (More / Balanced / Fewer).
- Existing unique-solvability protection remains in place.

## Compatibility

- No changes to the 99 Club timed-fluency generator.
- No changes to Custom Worksheet maths generators, graphical angles, graphs, coordinates or pie charts.
- Existing locally stored personal vocabulary remains compatible.
