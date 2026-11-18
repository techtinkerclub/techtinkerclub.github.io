# Rugby Coaching Studio — project status and handover

Updated 18 November 2026. This document is the maintained handover between chats and development sessions.

## Current release

- Single supported editor: **Classic Studio** at `/rugby/`, including touch workspace on phones and tablets.
- Public catalogue: `/rugby/library.html`; read-only presentation: `/rugby/play.html`.
- UI release marker: **0.17.1** (publication system shipped in 0.17.0). Source repository: `techtinkerclub/techtinkerclub.github.io` on `master`.
- QA for commit `3cd81bdac78befe2a028fe540d9359709eaaad9c`: Node Rugby tests **passed**, Playwright browser QA **passed**, Pages deployment **succeeded**. Any later commit must earn its own check; a successful deployment alone does not prove QA passed.

## Public publishing workflow

Working drills live in `data/coach-drills.json`; legacy curated starters remain in `data/drills.json`.
The new `data/published-drills.json` stores explicit published snapshots and unpublish markers. The shared `js/catalogue.js` merges the publication overlay into the public library and read-only player on load. It deliberately refuses to fall back to stale starter copies if the overlay cannot load.

1. **Save to GitHub** creates or advances a working revision, not a public revision.
2. **Publish** explicitly copies the latest GitHub-saved, editable drill into the curated public catalogue. Confirm before publishing.
3. **Update public copy** replaces the published snapshot but retains the stable `seed-...` public ID and links. Previous revisions remain in Git history.
4. **Unpublish** hides the public entry and reserves its public ID for a future republish; it does not delete the working drill.
5. **Delete saved drill** is blocked while a published entry for that source is active. Unpublish first.
6. A newly published separate version receives its own `seed-...` ID. A same-ID working revision updates the *existing* public entry only after the explicit Publish action.

### Retroactive mapping

| Stable public ID | Current editable source ID | Example |
|---|---|---|
| `seed-133` | `mwlwflvgp8foni` | Hold the line · Carry or pass? |
| `seed-143` | `mwlws9j9rth2wb` | Defensive line · Whistle then advance together |

These supersede historic copies with outdated cone layouts and an obsolete shared `savedFromCoachDrill` identifier. Both public URLs continue to work and now open the correct source snapshots. The original catalogue remains unchanged for recovery in Git history.

## Non-negotiable drill authoring rule

**No magic drills.** Objects, paths, timing, branching, signals, positions, poses and notes in an example or published drill must be reproducible with the normal editor controls. Publishing copies a saved source drill faithfully; it must never synthesize a hidden renderer-only or non-editable element. Regression coverage is in `tests/coaching-drill-reproducibility.test.mjs` and `tests/publication*.test.mjs`.

## Known limitations and next tasks

- A saved revision is not immediately published; updates require explicit publication (by design).
- Older compressed share links (URL hash snapshots) remain immutable snapshots. Use stable `?drill=seed-...` public links when ongoing updates matter.
- Safeguarding and coaching review remain the author's responsibility; publication is **not** RFU endorsement.
- The decision drill still has setup notes referring to four cones even though the actual saved setup has none. Option A's defensive-pair wording also needs reconciliation. Correct both using standard coaching-card editing, save a new working revision, then explicitly update the public copy.
- A fully linked *printable progression pack* and a linked public presentation are not yet implemented; linked video exports work.
- Browser QA runs in Chromium CI; native iOS Safari acceptance testing is still outstanding.
- Avoid unnecessary sequential commits. Implement coherent changes, test, and report **committed**, **CI passed**, and **deployed** separately.

## v0.18.0 — setup hold and ball flight direction

- First step supports an editable 0–30 s stationary setup hold. Older zero-second drills are unchanged.
- Shared setup-aware clock drives editor, whistle, decisions, presentation and video, not a magic extra step.
- During a genuine player-to-player pass, the rugby ball temporarily turns toward the actual route tangent with a 10° aesthetic offset; the stored authored orientation remains unchanged.
- Separate pending polish: header link/label spacing on the read-only presentation page.

## v0.18.1 — decision entry point

- Removed redundant Try decision demo button near timeline; examples remain in the library.
- Restored a prominent Decision making section on left, using the existing reproducible A/B split mechanism.
- From setup, guide to first moving step; auto-select only if exactly one eligible runner, otherwise ask coach to choose.
- Explain minimum 0.5 s per half when the run is too short and focus Step duration field; never silently extend a run or invent a decision.

## v0.18.3 — shared video creation workflow

- Public library includes Add to video for animated drill cards, stage selection/order, title and the same recording options as Studio, using the exact shared video generator.
- Public video creation does not use GitHub credentials or modify drill data. Only published animated drills are selectable, up to eight. The list is temporary per tab.
- User-facing Movie terminology becomes Video; internal movie API names stay stable to avoid breaking saved settings and tests.
- Video format depends on browser MediaRecorder support; iOS Safari recording needs device-level acceptance testing.
