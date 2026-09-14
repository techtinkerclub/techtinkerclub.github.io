# 99 Club Studio v1.30.5 - direct-PDF diagram centring fix

## Baseline

This patch was built from and verified against the current online `master` state after v1.30.4.

Verified live blobs before patching:

- `_pages/99-club-games.md`: `0bfb4f6a3feb3f20813220545d777d08f5fa8b0a`
- `assets/99club/games-pdf.js`: `195ac365b91810c613731029cb75cdc775d8a364`

Apply this patch at the repository root, replacing matching files.

## What it fixes

This is deliberately a **PDF-only visual correction**. Browser preview geometry is not changed.

### 1. Correct centring of numbers in circular PDF nodes
The tiny direct-PDF writer uses a deliberately rough width estimate for general layout. That approximation treated `1` as narrower than the other digits, but Helvetica's digits all use the same 556-unit advance. As a result values such as `11`, `14`, `110` and `165` could be visibly shifted inside circles.

v1.30.5 adds diagram-specific Helvetica AFM width metrics and uses them when centring visual puzzle labels and values.

This improves:
- Rule Wheel inner/outer values;
- Factor Pair Web centre values and capsule values;
- Sum & Product Diamond values;
- Arithmagon and Magic Number Shape circular values which use the shared PDF circle-node helper.

### 2. Rule Wheels
- PDF centre rule circle enlarged from 20 to 24 scale units.
- inner/outer radii adjusted to preserve breathing room;
- `RULE` and the actual rule are centred using the accurate diagram metrics;
- long-ish rules are fitted against the usable circle width rather than the generic text estimate.

### 3. Factor Pair Webs
- `FACTOR PAIRS` and the centre number now use accurate horizontal centring;
- values and multiplication signs inside each capsule use the same accurate centring;
- the accepted v1.30.4 web geometry/spacing is otherwise unchanged.

### 4. Sum & Product Diamonds
- `PRODUCT` and `SUM` now use accurate diagram centring instead of the generic PDF estimator;
- circular values use the corrected shared node-centre helper.

## Files changed

- `_pages/99-club-games.md` - advances only `games-pdf.js` cache version from 12 to 13.
- `assets/99club/games-pdf.js` - direct-PDF diagram typography/geometry correction.
- `assets/99club/tests/games-v1305-pdf-centering-smoke.js` - targeted regression guard.

## Regression boundary

No intentional changes to:
- browser preview;
- puzzle generation or answers;
- Number Connections browser geometry;
- Custom Worksheets / Angles;
- vocabulary/crosswords;
- Random Pack;
- personalisation;
- unrelated Games engines.

## After upload

Hard-refresh the Games page once. Generate a PDF containing Rule Wheels and Number Connections, then check:

1. `1`, `11`, `14`, `110`, `165`, etc. sit visually in the centre of circles;
2. centre rules remain comfortably inside the Rule Wheel centre circle;
3. `FACTOR PAIRS` and the centre value sit on the same visual axis;
4. `PRODUCT` and `SUM` are centred over/under the diamond node axis.
