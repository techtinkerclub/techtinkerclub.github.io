# v1.30.5 QA report

## Baseline verification

Patch source was compared with current online `master` before editing:

- live `_pages/99-club-games.md` blob SHA: `0bfb4f6a3feb3f20813220545d777d08f5fa8b0a`
- live `assets/99club/games-pdf.js` blob SHA: `195ac365b91810c613731029cb75cdc775d8a364`

Both matched the v1.30.4 baseline used to build this patch.

## Automated checks passed

- `games-smoke.js`
- `games-number-logic-smoke.js`
- `games-v1301-review-smoke.js`
- `games-v1302-pdf-parity-smoke.js`
- `games-v1304-number-structures-polish-smoke.js`
- `games-v1305-pdf-centering-smoke.js`
- `node --check assets/99club/games-pdf.js`

## PDF visual QA

A dedicated three-page PDF was generated with:

1. Factor Pair Webs including `1 x 24`, 48, 60 and 72;
2. Rule Wheels including values `11`, `14`, `110`, `165` and rules `x 11`, `+ 15`;
3. Sum & Product Diamonds including 380, 192 and 240.

The PDF was rendered at 180 dpi and inspected page-by-page. Diagram values and labels are centred, the Rule Wheel centre has sufficient clearance, and PRODUCT/SUM align with the diamond axis.

The same PDF was also rendered with both pdfium and pdftoppm. Differences were limited to normal rasterisation/anti-aliasing variation; no clipping or geometry divergence was observed.
