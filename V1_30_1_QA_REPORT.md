# 99 Club Studio v1.30.1 QA report

## Automated checks

Passed:
- JavaScript syntax checks for `games-arithmetic.js`, `games-app.js`, `games-pdf.js` and the new regression test.
- Existing `games-number-structures-smoke.js`.
- Existing `games-arithmetic-expansion-smoke.js`: 23,400 deterministic base activities + 5,360 topic-routing activities + deep invariant checks across all 13 arithmetic engines.
- New `games-v1301-review-smoke.js`.

## New targeted regression coverage

The v1.30.1 test verifies:
- square diagonal Arithmagons contain one interior diagonal;
- pentagon/hexagon diagonal configurations are capped at two and do not cross;
- bow-tie Magic Number Shape marked routes are geometrically collinear;
- generated bow-ties retain the magic-total invariant and at least five distinct solution values;
- Standard Factor Pair Webs explain the spoke/factor relationship and contain a visual starter pair;
- browser and direct-PDF Arithmagons suppress diagonal operation glyphs;
- browser Factor Pair Webs contain two distinct answer slots per spoke;
- browser and PDF diamond layouts include the new protected bounds.

## Scope note

The available v1.30.0 patch snapshot contains the arithmetic/number-structure regression suite but not every dependency from the full live repository. The two relevant existing suites and the new targeted suite were run directly against the patched v1.30.0 modules and passed. No claim is made here that a full Jekyll/site CI build was run in this container.
