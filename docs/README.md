# Tech Tinker Club repository documentation

This directory is the maintainer documentation hub for the Tech Tinker Club website and its 99 Club Studio tools.

## Current source-of-truth documents

- [`99club/README.md`](99club/README.md) — current 99 Club Studio architecture, file map, testing rules and release discipline.
- [`99club/GAMES.md`](99club/GAMES.md) — Games & Puzzles engine inventory, current issues and ordered roadmap.
- [`99club/CURRICULUM.md`](99club/CURRICULUM.md) — curriculum-mapping principles and current reference locations.
- [`99club/CUSTOM_WORKSHEETS.md`](99club/CUSTOM_WORKSHEETS.md) — Custom Worksheet architecture and maintenance notes.
- [`club/`](club/) — Tech Tinker Club term planning, curriculum links and weekly authoring notes.

## Historical material

Older release notes, QA reports, recovery notes and one-off patch documents are retained under [`archive/`](archive/) for traceability. They are historical evidence, not instructions for the current build.

When an archived document conflicts with a current source-of-truth document or the code on `master`, the current code and current documentation win.

## Public pages versus maintainer docs

Some Markdown files at repository root are live Jekyll pages and intentionally remain there, including `index.md`, `99-club-custom.md` and `99-club-help.md`. Maintainer notes should not be added back to repository root; put them under `docs/` instead.
