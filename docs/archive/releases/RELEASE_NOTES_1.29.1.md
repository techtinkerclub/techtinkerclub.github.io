# 99 Club Studio v1.29.1 - Vocabulary & Language refinement

This patch is based on the live v1.29.0 repository state, including the existing random-compatible pack mode.

## Word Search

- Every generated Word Search now tells pupils which directions are actually allowed.
- Straight mode states left-to-right and top-to-bottom only, with no backwards words.
- Diagonal mode explicitly adds the two downward diagonal directions and still states that words are not backwards.
- All-directions mode states that horizontal, vertical and diagonal words may run forwards or backwards.
- The same rule is shown in browser preview and pupil PDF output.

## Maths Crossword

- Placement now scores candidate positions instead of choosing a random valid crossing.
- More useful crossing letters are strongly preferred, while compact layouts are used as a secondary quality signal.
- Multiple deterministic candidate layouts are compared and the strongest connected layout is retained.
- Browser and PDF layouts were tightened so rectangular / tall crosswords and long clue sets remain inside the activity frame.
- PDF clue text shrinks only when necessary and is no longer silently truncated at the bottom of the activity.

## Mixed difficulty per game type

Each game can now use:

- Easy
- Standard
- Challenge
- Mixed

Mixed exposes weighted Easy / Standard / Challenge percentages and presets. The generator converts those weights into exact activity counts for each game type, then deterministically shuffles the order.

Example: 20 Crosswords at 25 / 50 / 25 produce exactly 5 Easy, 10 Standard and 5 Challenge Crosswords.

Replacing a complete activity preserves that activity's assigned difficulty. Replacing a single Word Search term also preserves the activity difficulty.

## v1.29 random-pack compatibility

The existing random compatible pack mode remains separate from per-game Mixed difficulty. Random mode continues to apply its single Easy / Standard / Challenge choice consistently across the random pack.

The engine sheet ceiling is raised to 20 so the existing v1.29 activity-count control can genuinely generate its advertised maximum of 40 activities at two activities per sheet.
