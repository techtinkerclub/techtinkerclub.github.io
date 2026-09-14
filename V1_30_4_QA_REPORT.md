# v1.30.4 QA report

## Baseline

Built against online `master` commit:

`4c53012a280da102a147ac38ac471787ef25f8e3`

The relevant live files were independently reconstructed from the saved v1.28.0 full repository plus v1.28.1, v1.29.1, v1.29.2, v1.30.0 and v1.30.1 overlays. SHA-256 hashes of `games-app.js`, `games-pdf.js` and `games-arithmetic.js` matched the saved v1.30.1 overlay used for this patch.

## Automated checks passed

- `node --check` — modified `games-app.js`, `games-pdf.js` and all new/updated regression tests.
- `games-smoke.js` — 23-engine general smoke suite.
- `games-number-logic-smoke.js` — 918 deterministic base activities plus deep uniqueness/invariant checks across five numeric-logic engines.
- `games-v1301-review-smoke.js` — sparse/non-crossing Arithmagons, straight bow-tie geometry, Factor Pair guidance/starter behaviour and reviewed visual guards.
- `games-v1302-pdf-parity-smoke.js` — vector PDF primitives, Arithmagon notation, visual parity and student/answer PDF generation.
- `games-v1304-number-structures-polish-smoke.js` — Factor Pair spacing/clipping/centering, Diamond label centring, Arithmagon notation and PDF matching geometry.

The older `games-arithmetic-expansion-smoke.js` in the live repository predates the v1.30 arithmetic module contract and contains stale v1.1.0 / old Number Wheel assertions, so it is not used as a release gate for this renderer-only patch. The arithmetic generator is unchanged by v1.30.4.

## Visual checks

Generated fresh pupil and answer PDFs from the patched current-live repository and rendered them to images. Checked:

- Factor Pair capsules no longer touch the centre circle and spokes terminate at their boundaries.
- `FACTOR PAIRS` and the centre number read as a centred two-line group.
- Diamond `PRODUCT` / `SUM` labels are centred on the node axis.
- Arithmagon diagonal signs are visible and perimeter signs sit outside the polygon.
- Arithmagon and Magic Number Shape PDF geometry is not stretched.
- PDF nodes use the same circular / rounded visual language as preview.
