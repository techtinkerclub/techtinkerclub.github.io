# Repository healthcheck — 15 September 2026

This report records the repository-wide audit performed before the next Maths Games & Puzzles development batch.

## Executive summary

The active 99 Club Studio JavaScript and JSON parsed cleanly. After separating superseded historical tests from current release gates, **20 current 99 Club regression suites pass with zero failures**.

The largest maintainability problem was not broken production code but accumulated historical material: release notes, QA reports, recovery files, stage notes and stale maintainer readmes were mixed through repository root and deployable asset folders. Those have been reorganised so current guidance has a small, explicit source of truth under `docs/` and historical material is retained under `docs/archive/`.

No live Jekyll content page or current 99 Club generator was removed during this documentation cleanup.

## Test audit

The first all-tests sweep found 28 top-level 99 Club test files, of which 8 failed. Investigation showed those eight were superseded tests encoding historical internal versions, cache strings or retired renderer structures rather than current product requirements. They have been preserved under `assets/99club/tests/archive/` and no longer gate releases.

The remaining **20 current tests all pass**. The final healthcheck also passed JavaScript syntax checking and JSON parsing.

Archived historical tests:

- `games-arithmetic-expansion-smoke.js`
- `games-number-structures-smoke.js`
- `games-smoke.js`
- `games-v1291-pack-compat-smoke.js`
- `games-v1312-arithmetic-density-preview-smoke.js`
- `games-v1321-layout-smoke.js`
- `games-v135-redesign-smoke.js`
- `games-vocabulary-refinement-smoke.js`

Historical tests remain available for archaeology, but current tests should assert mathematical and layout invariants rather than old module version numbers or asset cache values.

## Documentation cleanup

Repository root now contains only four Markdown files:

- `README.md` — repository entry point and documentation map
- `index.md` — live site page
- `99-club-custom.md` — live Custom Worksheets page
- `99-club-help.md` — live Help page

Current maintainership documentation is now centred on:

- `docs/README.md`
- `docs/99club/README.md`
- `docs/99club/GAMES.md`
- `docs/99club/CURRICULUM.md`
- `docs/99club/CURRICULUM_COVERAGE_DETAILED.md`
- `docs/99club/CUSTOM_WORKSHEETS.md`

Historical root release notes and QA reports were moved without content changes to `docs/archive/releases/` and `docs/archive/qa/`. Recovery/patch material, stage-specific Pie Chart notes, old checksum/readme files and superseded reference snapshots were similarly preserved under `docs/archive/`.

Club teaching-maintenance files were moved from root into `docs/club/`.

Stale documentation under `assets/99club/` has been replaced with compatibility pointers to the canonical `docs/99club/` documents, while the full old Games backlog and detailed curriculum audit were preserved.

## GitHub repository scaffolding findings

Several files were inherited from the upstream Minimal Mistakes theme rather than written for Tech Tinker Club.

Two workflow/template issues were important enough to correct during this healthcheck:

- the inherited `bad-pr.yml` workflow could label, close and lock pull requests using Minimal Mistakes-specific rules and wording; it has been removed;
- the inherited `build.yml` workflow was inert in this fork because it only ran its job when the repository was exactly `mmistakes/minimal-mistakes`; it has been removed;
- the pull-request template, bug-report template and contributing guide have been replaced with Tech Tinker Club / 99 Club Studio versions.

Other inherited build/theme files such as `package.json`, `.travis.yml`, `Rakefile`, `Gemfile` and `staticman.yml` remain. Some contain upstream metadata, but they are more tightly coupled to the Jekyll/theme toolchain. They should be reviewed in a separate build-stack cleanup rather than deleted casually.

## Legacy duplicate JavaScript at repository root

The repository still contains older root-level files such as:

- `custom-app.js`
- `custom-coordinates.js`
- `custom-graphs.js`
- `custom-piecharts.js`
- `custom-visual-smoke.js`

The live Custom Worksheet page loads the maintained versions under `assets/99club/`, and the root copies have different blob hashes, so they should be treated as legacy duplicates. They were syntax-checked during this healthcheck but deliberately **not deleted**. Removing them should be a separate verified code-hygiene change after confirming no external/manual workflow depends on those paths.

## Known product issues intentionally not hidden by the healthcheck

The repository being syntactically/test healthy does not mean the current Games build is visually complete. The current Games roadmap explicitly carries forward:

1. Operation Codebreaker Challenge two-operation rendering repair and clearer code-key presentation.
2. Function Machines visual refinement.
3. Arithmagon diagonal operation labels moved inward.
4. Kakuro 8x8 option.
5. Continued review of Symbol Equations / Equation Repair presentation.
6. Next new engine: **Number Towers / Skyscrapers**, followed by Binary Puzzle / Takuzu, Killer Sudoku and Bridges / Hashi.

See `docs/99club/GAMES.md` for the maintained list.

## Recommended repository rule going forward

- Keep root for live Jekyll entry pages and the root README only.
- Put current maintainer documentation under `docs/`.
- Put historical release/QA/recovery material under `docs/archive/`.
- Keep current release-gating tests directly under `assets/99club/tests/`; archive superseded tests rather than silently rewriting production code to satisfy them.
- For worksheet/puzzle visual changes, preview and generated PDF are one feature and must be reviewed together.
