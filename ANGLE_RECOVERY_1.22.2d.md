# 99 Club Studio v1.22.2d — Custom entrypoint / Angles recovery

## Root cause
The repository contained **two Markdown pages with the same permalink** `/tools/99-club/custom/`:

- `_pages/99-club-custom.md` — current asset stack, including `custom-angles.js`
- `99-club-custom.md` — stale asset stack, with no `custom-angles.js`

That duplicate output target meant a deployment could serve the stale Custom page even though the current Angles engine and `custom-app.js` were present in `assets/99club/`.

## Fix
- Synchronise both page sources so they load the same current Custom Worksheet stack.
- Explicitly load `custom-angles.js` before `custom-app.js` in both sources.
- Cache-bust `custom-angles.js` to `v=7` and `custom-app.js` to `v=226`.
- No Angles question content was rebuilt or reduced.
- Add `assets/99club/tests/custom-entrypoint-smoke.js` to prevent the two page sources drifting again.

## Expected Custom catalogue
A separate **Angles & turns** accordion with 8 graphical families should appear:
1. turns & orientation — Y1–2
2. right angles & turns — Y3
3. identify, compare & order angles — Y4
4. degrees: classify, estimate, measure & draw — Y5
5. angles on lines & around points — Y5–6
6. angles in triangles — Y6
7. angles in quadrilaterals & polygons — Y6
8. angle reasoning & problem solving — Y5–6
