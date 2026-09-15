# v1.30.6 QA report

## Baseline

Verified against online `master` commit:

`33825454a170ad578ae5947c5e296edecdc4a103`

The live page loads `games-pdf.js?v=13`; v1.30.6 advances it to `v=14`.

## Automated checks passed

- `games-smoke.js`
- `games-number-logic-smoke.js`
- `games-v1301-review-smoke.js`
- `games-v1302-pdf-parity-smoke.js`
- `games-v1304-number-structures-polish-smoke.js`
- `games-v1305-pdf-centering-smoke.js`
- `games-v1306-pdf-scale-smoke.js`
- `node --check assets/99club/games-pdf.js`

## Visual PDF QA

A representative two-activity pupil sheet was generated at the same two-activities-per-page density used by normal packs.

Activity 1 contains four Factor Pair Webs, including both four-spoke and six-spoke cases and a starter pair (`1 x 84`). The diagrams now make substantially better use of the available whitespace; capsules are larger, the centre circles are larger, and `FACTOR PAIRS` remains inside the centre circle.

Activity 2 contains four Rule Wheels using rules `x 11`, `+ 15`, `- 12` and `x 12`, with 2- and 3-digit node values. The centre circle is larger and both centre text lines fit with clear margins.

The QA PDF was rasterised at 160 dpi and inspected visually.
