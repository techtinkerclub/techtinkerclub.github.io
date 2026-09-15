# Tech Tinker Club website

This repository contains the Tech Tinker Club website and the 99 Club Studio teaching tools.

## Main areas

- **Tech Tinker Club website** — public club pages, curriculum material and teaching resources.
- **99 Club** — printable/timed arithmetic resources.
- **99 Club Studio · Custom Worksheets** — curriculum-driven worksheet generation, including numerical and graphical question engines.
- **99 Club Studio · Maths Games & Puzzles** — printable puzzle packs with browser preview, answer sheets and PDF export.

The site is built with Jekyll/GitHub Pages. Public content lives across root Jekyll pages, `_pages/`, collections and assets. The 99 Club Studio implementation is primarily under `assets/99club/`.

## Maintainer documentation

Start with [`docs/README.md`](docs/README.md).

Current 99 Club Studio source-of-truth documents:

- [`docs/99club/README.md`](docs/99club/README.md) — architecture and release discipline.
- [`docs/99club/GAMES.md`](docs/99club/GAMES.md) — current game inventory, known fixes and ordered puzzle roadmap.
- [`docs/99club/CURRICULUM.md`](docs/99club/CURRICULUM.md) — curriculum-mapping rules.
- [`docs/99club/CUSTOM_WORKSHEETS.md`](docs/99club/CUSTOM_WORKSHEETS.md) — Custom Worksheet maintenance guide.

Historical release notes, QA reports and one-off recovery/patch documents are archived under `docs/archive/`; they should not be treated as current implementation instructions.

## Root Markdown policy

Repository root intentionally contains a small number of live Jekyll pages such as `index.md`, `99-club-custom.md` and `99-club-help.md`, plus this README. New maintainer notes, QA reports and release documentation belong under `docs/`, not at root.

## 99 Club tests

Current regression tests live in `assets/99club/tests/`. Tests should check current behaviour and mathematical/layout invariants rather than pinning old internal version numbers or cache strings. Superseded tests are retained under `assets/99club/tests/archive/` for history but do not gate releases.

## Current Games & Puzzles direction

The next Games release should first address the queued Codebreaker, Function Machine, Arithmagon and Kakuro refinements, then add **Number Towers / Skyscrapers** as the next curriculum-mapped puzzle engine. See [`docs/99club/GAMES.md`](docs/99club/GAMES.md) for the definitive list.
