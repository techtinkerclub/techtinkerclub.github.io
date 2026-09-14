# 99 Club Studio v1.30.6 - direct-PDF scale polish

## Baseline

Built against the current online `master` state after v1.30.5:

`33825454a170ad578ae5947c5e296edecdc4a103`

The live Games page at that baseline loads `games-pdf.js?v=13`.

Apply this ZIP at the repository root, replacing matching files. It is intended to go directly on top of v1.30.5.

## What this fixes

This is a **PDF-only** visual correction. The browser preview is deliberately unchanged.

### Factor Pair Webs
- Uses more of the available activity space in PDF output.
- Enlarges the complete web, factor-pair capsules and writing areas.
- Enlarges the centre circle relative to its label.
- Fits `FACTOR PAIRS` to the available circle width instead of allowing it to overrun the edge.
- Fits the centre value independently so 2- and 3-digit targets remain centred.
- Keeps spokes clipped cleanly between centre circle and capsules.
- Keeps the first starter pair and the clearer instruction introduced earlier.

### Rule Wheels
- Gives the PDF wheel a larger centre circle and slightly larger overall print scale where room permits.
- Keeps inner/outer nodes clear of the larger centre.
- Fits both `RULE` and the rule expression to the usable centre-circle width.
- Retains the accurate Helvetica diagram centring added in v1.30.5.

## Files changed

- `_pages/99-club-games.md` - bumps only the PDF asset cache to `v=14`.
- `assets/99club/games-pdf.js` - PDF diagram scale/fit changes.
- `assets/99club/tests/games-v1302-pdf-parity-smoke.js` - removes obsolete fixed-size assertion while retaining capsule/parity checks.
- `assets/99club/tests/games-v1304-number-structures-polish-smoke.js` - keeps spoke/capsule regression without pinning the old print dimensions.
- `assets/99club/tests/games-v1305-pdf-centering-smoke.js` - preserves centring checks across later print geometry revisions.
- `assets/99club/tests/games-v1306-pdf-scale-smoke.js` - new targeted scale/fit regression.

## Regression boundary

No intended change to:
- browser preview;
- puzzle generation, answers or difficulty;
- public 99 Club;
- Custom Worksheets / Angles;
- vocabulary/crosswords;
- Random Pack;
- personalisation;
- unrelated Games engines.

## After upload

Hard-refresh `/tools/99-club/games/`, then generate a PDF containing **Factor Pair Webs** and **Rule Wheels**. The web diagrams should be visibly larger and the centre labels/rules should remain comfortably inside their circles.
