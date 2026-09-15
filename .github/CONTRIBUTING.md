# Contributing

This repository is the Tech Tinker Club website and 99 Club Studio codebase.

For project structure and current maintainer guidance, start with [`../docs/README.md`](../docs/README.md).

When changing 99 Club Studio:

1. Work on a branch and keep the change focused.
2. Preserve deterministic generation unless the change intentionally modifies the maths engine.
3. Check browser preview and generated PDF for visual or worksheet changes.
4. Run the relevant regression tests under `assets/99club/tests/`.
5. Add or update invariant-based tests for new behaviour; avoid tests that only pin cache strings or obsolete internal version numbers.
6. Do not add maintainer release notes or roadmaps to repository root. Put current documentation under `docs/` and historical material under `docs/archive/`.

For Games & Puzzles work, see [`../docs/99club/GAMES.md`](../docs/99club/GAMES.md).
