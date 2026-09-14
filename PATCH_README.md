# 99 Club Studio v1.30.1 — Number Patterns & Structures review patch

## Baseline

Apply this patch **on top of the accepted v1.30.0 Number Patterns & Structures patch**.

Do not apply it directly to v1.29.2 or an older Games snapshot.

## What this review patch fixes

### 1. Arithmagons — cleaner diagonal mode
- Keeps diagonal connections as a genuine higher-complexity option.
- Square Arithmagons now use only one interior diagonal.
- Pentagon/hexagon diagonal sets are sparse and deliberately non-crossing.
- Diagonal operation glyphs are omitted in the diagram to reduce centre clutter; the rule/instruction still defines the operation.
- Browser and direct-PDF renderers follow the same rule.

### 2. Magic Number Shapes — bow-tie geometry
- Replaces the confusing bent top/bottom routes with a true bow-tie made entirely from straight three-node marked lines.
- Retains the same four linked magic-line equations and therefore the same puzzle family rather than removing it.
- Bow-tie generation now rejects overly repetitive value sets where practical.

### 3. Number Connections

#### Sum & Product Diamonds
- Pulls the four nodes and PRODUCT/SUM labels safely inside the SVG frame.
- Direct-PDF layout uses a smaller protected vertical footprint and two columns for four-diamond sheets.

#### Factor Pair Webs
- Each spoke now visibly contains **two separate writing boxes** with × between them, rather than one pill that can look like an unexplained × box when both values are blank.
- Instruction explicitly explains that each spoke is one factor pair and that its two numbers multiply to the centre.
- Easy/Standard find-pairs activities keep one completed pair in the first suitable web as a visual starter example; Challenge remains unprompted.
- Browser and direct-PDF renderers use the same two-box convention.

## Files changed
- `_pages/99-club-games.md` — cache-busts changed Games assets.
- `assets/99club/games-arithmetic.js` — Arithmagon diagonals, bow-tie geometry/value variety, Factor Pair Web guidance.
- `assets/99club/games-app.js` — browser diagram refinements.
- `assets/99club/games-pdf.js` — matching direct-PDF refinements.
- `assets/99club/games.css` — Factor Pair Web slots and diamond containment.
- `assets/99club/tests/games-v1301-review-smoke.js` — targeted review regression.

## Regression boundary
This patch does **not** intentionally change:
- public 99 Club fluency generation;
- Custom Worksheets / Angles;
- vocabulary/crossword generation;
- Random Pack;
- personalisation;
- other Games engines;
- v1.29.2 crossword geometry.

## Deployment check
After overlaying the patch and hard-refreshing the Games page:
1. Generate Challenge Arithmagons with diagonals: confirm interior lines do not cross and the centre is less crowded.
2. Generate Magic Number Shapes with **Magic bow-tie**: confirm all four marked routes are visually straight.
3. Generate Standard **Factor Pair Webs**: confirm each spoke visibly shows two answer boxes with × between them and one first-web example pair is shown.
4. Generate **Sum & Product Diamonds** with four items: confirm PRODUCT/SUM labels stay inside every activity frame in browser and PDF.
5. Spot-check Random Pack and a Maths Crossword to confirm no unrelated layout regression.
