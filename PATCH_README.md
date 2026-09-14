# 99 Club Studio v1.30.4 — consolidated Number Patterns visual correction

## Baseline verified against the online repository

This patch was built against the current `master` state of:

`techtinkerclub/techtinkerclub.github.io`

Verified live commit before patching:

`4c53012a280da102a147ac38ac471787ef25f8e3`

That commit contains the uploaded **v1.30.1 Number Patterns & Structures review patch**.

Apply **v1.30.4 directly to that live state**. You do **not** need to apply the previously supplied local v1.30.2 or v1.30.3 ZIPs first; those were review builds and are superseded by this consolidated patch.

## Fixes included

### Arithmagons
- Keeps the v1.30.1 sparse / non-crossing diagonal selection.
- Restores an explicit operation sign on diagonal connections.
- Moves perimeter operation signs to the outside of the polygon rather than into the working area.
- Mirrors the same notation in direct PDF output.

### Magic Number Shapes
- Retains the corrected v1.30.1 straight-line bow-tie topology and repeated-value guard.
- Direct PDF output now uses circular nodes and preserved aspect ratio so the shape matches the browser visual language much more closely.

### Factor Pair Webs
- Keeps the clearer instruction and first-web starter pair introduced in v1.30.1.
- Replaces disconnected factor boxes with one grouped capsule per spoke: `[ factor ] × [ factor ]`.
- Moves capsules farther away from the centre circle.
- Clips each spoke cleanly between the centre-circle boundary and the factor-pair capsule; no line runs through the answer area.
- Centres the `FACTOR PAIRS` label and centre value as one balanced two-line block.
- Uses the same geometry in browser preview and direct PDF output.

### Sum & Product Diamonds
- Keeps circular nodes and safe activity bounds.
- Removes the optical shift caused by letter spacing on `PRODUCT` / `SUM`.
- Explicitly centres both labels on the top/bottom node axis in the browser renderer.
- Direct PDF labels remain centre-aligned with the matching nodes.

### PDF parity
The direct Games PDF renderer now uses vector circles / rounded rectangles / dashed diagonals for the Number Patterns visual families instead of rectangular stand-ins and stretched geometry. This covers:
- Arithmagons;
- Magic Number Shapes;
- Rule Wheels;
- Factor Pair Webs;
- Sum & Product Diamonds.

## Files changed
- `_pages/99-club-games.md` — cache-bust only for changed assets.
- `assets/99club/games-app.js` — browser visual geometry / notation.
- `assets/99club/games-pdf.js` — direct-PDF visual parity and matching geometry.
- `assets/99club/games.css` — Factor Pair capsule styling and Diamond label centring.
- `assets/99club/tests/games-v1301-review-smoke.js` — updates the earlier diagonal-sign expectation.
- `assets/99club/tests/games-v1302-pdf-parity-smoke.js` — PDF parity regression.
- `assets/99club/tests/games-v1304-number-structures-polish-smoke.js` — final layout regression.

The arithmetic generator itself (`games-arithmetic.js`) is **not changed** because the current online v1.30.1 already contains the accepted sparse-diagonal, bow-tie and Factor Pair instruction/generation fixes.

## Regression boundary
No intentional changes to:
- public 99 Club fluency;
- Custom Worksheets / Angles;
- vocabulary / crosswords;
- Random Pack;
- personalisation;
- number-logic engines;
- other arithmetic game generation.

## Deployment
Overlay this ZIP at the repository root and replace matching files. Then hard-refresh `/tools/99-club/games/` once.
