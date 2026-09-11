99 Club Studio v1.22.2c — Graphical Angles recovery hotfix

Apply at repository root, preserving paths.

Purpose
- Restores the completed graphical Angles & turns catalogue in Custom Worksheets.
- Includes the known-good v0.1.4 angle engine (104 active subtypes / 416 deterministic entries).
- Restores the defensive family merge in custom-app.js using browser-safe `window`, not the invalid `global` reference that broke v1.22.2a.
- Keeps the v1.22.2b Custom page recovery intact.
- Bumps custom-angles.js to ?v=6 and custom-app.js to ?v=225 to defeat stale browser/CDN caches.

Expected Custom Worksheet UI
A separate "Angles & turns" accordion appears, containing 8 graphical families:
1. turns & orientation (Y1–2)
2. right angles & turns (Y3)
3. identify, compare & order angles (Y4)
4. degrees: classify, estimate, measure & draw (Y5)
5. angles on lines & around points (Y5–6)
6. angles in triangles (Y6)
7. angles in quadrilaterals & polygons (Y6)
8. angle reasoning & problem solving (Y5–6)

The older text-only angle fallbacks are demoted to Extension by the angle module.

No graph, coordinate, pie-chart, PDF, public 99 Club, Help, generator core, QR or stylesheet files are changed.
