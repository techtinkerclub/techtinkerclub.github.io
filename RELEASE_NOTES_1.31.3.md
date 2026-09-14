# 99 Club Studio v1.31.3 — Random Pack mixed difficulty

Adds weighted mixed difficulty to **Random compatible games & puzzles** without changing the manual game-selection workflow.

## What changed

- Random Pack difficulty now supports **Mixed — weighted** alongside Easy, Standard and Challenge.
- Default mixed profile is **25% Easy / 50% Standard / 25% Challenge**.
- Adds four quick presets:
  - Balanced — 25 / 50 / 25
  - Gentle — 50 / 40 / 10
  - Mostly standard — 15 / 70 / 15
  - Challenge-heavy — 10 / 40 / 50
- Easy and Challenge percentages can be edited directly; Standard is automatically calculated as the remaining percentage.
- Mixed difficulty is allocated as a **pack-wide quota**, not as unrelated random rolls. For example, an 8-activity pack at 25/50/25 produces 2 Easy, 4 Standard and 2 Challenge activities, then shuffles their positions.
- Quotas use largest-remainder rounding for pack sizes that do not divide cleanly.
- The difficulty plan remains deterministic for a given seed.
- If an engine does not support the requested difficulty, the nearest supported level is used.
- Mixed settings and weights are saved locally with the Random Pack controls.
- Existing fixed Easy / Standard / Challenge Random Packs and manual per-engine difficulty settings remain unchanged.

## Cache updates

- `games-pack-mode.js?v=1` → `v=2`
- `games-random-ui.js?v=1` → `v=2`

No PDF renderer changes are required; PDFs consume the generated activities and therefore inherit the mixed difficulty allocation automatically.
