# 99 Club Studio v1.24.0 — Games review + Crossword patch

Apply this overlay directly on top of the accepted **v1.23.1** repository.

This patch changes only the Games & Puzzles area plus the Help page. It does not modify public 99 Club question generation or Custom Worksheet maths.

## Added
- 591-entry curated primary-maths vocabulary module.
- Maths Crossword game engine using the shared vocabulary provider.
- Pack-level Worked examples option (one example per selected game at the front).
- Word Search direction setting: automatic, straight, straight+diagonal, or all directions including backwards.
- Preview ↻ replacement for one whole activity.
- Word Search clue-level ↻ replacement for one term + definition only.

## Important replacement behaviour
- Replacing a whole activity regenerates only that slot with the same game engine and settings.
- Replacing one Word Search clue keeps every other selected term. The grid is rebuilt because the new word can have a different length/placement.
- Review buttons are preview-only and are hidden from print/PDF.
- Changing pack/game settings or generating a wholly new version intentionally starts a fresh reviewed pack.

## QA
See `V1_24_0_QA_REPORT.md`. All Node regression suites pass. The supplied standalone preview should be checked in a normal browser before production deployment.
