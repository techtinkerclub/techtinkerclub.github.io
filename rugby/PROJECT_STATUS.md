# Rugby Coaching Studio — project status and handover

Updated 18 November 2026. This document is the maintained handover between chats and development sessions.

## Current release

- Single supported editor: **Classic Studio** at `/rugby/`, including touch workspace on phones and tablets.
- Public catalogue: `/rugby/library.html`; read-only presentation: `/rugby/play.html`.
- UI release marker: **0.19.0** (publication system shipped in 0.17.0). Source repository: `techtinkerclub/techtinkerclub.github.io` on `master`.
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
- The published decision-drill equipment and defensive-pair wording were reconciled in the 0.18.6 source and publication snapshots.
- A printable progression pack is available from Studio's video-sequence builder. A stable linked public multi-drill presentation is not yet implemented.
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

## v0.18.4 — presentation-to-library continuity

- Read-only public presentations have Add to video, linking into the public library with the same published drill preselected.
- The presentation header separates navigation links and the uppercase caption, including narrow mobile viewports.
- Public video builder remains read-only; snapshot share links do not silently become published catalogue entries.

## v0.18.5 — decision controls cleanup

The left Decision making tool is the single creation/edit entry point; duplicate timeline/route-panel buttons are removed. A/B switches and comparison stay available. Removing a playable marker or Remove fork clears its branch, marker and editing references, leaving the selected path linear. No saved or public drill records are altered automatically.

## v0.18.6 — contextual right-click and printable progression packs

- Context menus now show relevant commands rather than a universal list. Removed redundant 15-degree rotate commands (rotation handles and inspector remain).
- Running-path SVG hit targets are recognised directly on right-click; eligible player runs offer **Add decision to this run** using the existing decision placement model. A/B edit, whistle, movement reset, ball actions, layer ordering and deletion scopes are shown only where applicable.
- Ordered video sequences can be printed as a coaching progression pack with a contents page, each drill's coaching card and all step diagrams; the editor drill models remain independent. A regression test covers core controls, CSS hiding and print composition.
- The editable and public versions of **Hold the line · Carry or pass?** have matching equipment wording (boundary flags, no four-cone claim) and Option A watch-points (D1 and D2).
- **Verification still required:** live Chromium CI for the new commits, manual right-click on players and SVG paths, mobile touch alternatives, physical iOS Safari recording, multi-drill print pagination. Latest source commits are not a browser sign-off.
- **Linked presentation implemented in v0.18.7:** public library sequences now open `/rugby/sequence.html?drills=seed-...,...` with next/previous navigation and embedded read-only drill players. Only existing published IDs resolve. A copied link follows published updates. Real-coach usability and iOS Safari testing remain pending.

## v0.18.7 — shareable read-only multi-drill progression

- Public library video builder now offers **Open linked presentation**, **Copy presentation link** and **Print progression pack** alongside video export.
- New `/rugby/sequence.html?drills=seed-143,seed-133` example (ordered public drill IDs; only actually published resources resolve). Stable links load explicitly published revisions and use the existing read-only player for each stage.
- Public printing reuses shared print CSS and print markup. The progression never changes source drills or grants edit rights.
- Right-click on the actual SVG running path works, adding a point at the click position. Irrelevant equipment movement actions are hidden.
- **Acceptance outstanding:** Node/Playwright CI for latest HEAD, public sequence URL, phone/tablet operation, iOS Safari video recording, printed pagination and right-click/long-press UX. Source commits alone do not prove tests passed.

## v0.18.9 — colour-coded agility, touch, tag and selected-player actions (18 Nov 2026)

- Added seven fixed cone colours: yellow, orange, red, blue, green, white and purple, selected in Object inspector. Colour is saved as `coneColor` and preserved in the shared renderer and outputs.
- Extended Agility equipment palette: low hurdle, hoop, slalom pole and flat marker disc, alongside the existing ladder. These are schematic equipment icons, not manufacturer-dimensioned training products.
- Added **Record touch** through player right-click. An actor can touch another player, training object or pitch line; the cue has an adjustable time in its step, appears in playback and can be removed in Step details. No tackle, fall or possession change is invented.
- Added individual **Tag rugby belt** equip/unequip/reset and the non-contact **Remove tag** action. Left/right strips and a taken-tag count display on players. Tag capture requires a ball-carrying tagged player and a tagged opponent. The action is timed and retained in saved/shared drills. Tag is not treated as a physical tackle or ruck; the author creates subsequent pass/restart steps.
- Multi-select at least two players (Ctrl-click or Group select), then right-click a selected member for conditional Touch, Tackle, Ruck or Maul actions. Group-contact shortcuts use the **existing** contact formation model, not hidden generated animations. Age gates: U7/U8 no contact shortcuts, U9 tackle only, U10+ ruck/maul with proper prerequisites. Explicitly selected players must satisfy formation validation.
- Timed touch/tag cues are visible in Step inspector, where they can be retimed or removed without deleting players. Cancelled action dialogs do not create empty steps. New steps do not inherit already-executed cues. A setup-stage action creates an editable movement step only once confirmed.
- Added `tests/skill-actions.test.mjs` and expanded assertions for multi-selection/contact gating, save/renderer state and deletion. Updated client module cache references.

### Known boundaries and acceptance checks

- This implementation uses **authored schematic contact**: touch and tag badges do not automatically detect a physical collision, shorten a previously drawn run, enforce a pass count or award an RFU-law restart. Coaches must edit the stop/pass/restart sequence deliberately. Do not imply automatic rules refereeing.
- Multi-player contact arrangements may reposition the selected players to a preset. Review the diagram and timing before using it for an actual coaching drill.
- Verify Node tests and Playwright/real-browser checks (including mobile long-press, video and printing). Syntax and isolated model checks passed during authoring, but the full CI and live site acceptance results were not independently established in this session.
- U7/U8 tag rugby and U9 transitional tackling distinctions are aligned with RFU Regulation 15 guidance, but current season rules and club contact policy remain authoritative.

## v0.19.0 — contextual action chooser and tag/touch semantics (18 Nov 2026)

- Feedback-driven UI overhaul: replaced six competing right-click touch/tag/contact buttons with one **Actions…** command on individual players or multi-selected groups. The modal distinguishes **Touch another player**, **Touch equipment or pitch line**, **Remove a tag**, **Tackle**, **Ruck**, **Maul** and disables choices whose selected actors, ball status or age-group prerequisites are missing. After choosing, touch/tag open a focused actor/target/time editor; contact uses the existing validated formation editor. No extra contact type is introduced.
- Right-click a cone → **Change cone colour…**, which opens the existing fixed-colour Object setting; no duplicate palette or inconsistent separate colour state.
- Corrected tag belt: both hip tags have the same user-selected strip colour (red, blue, green or yellow) that contrasts with the player's kit; side removed and colour are independent. Existing tag belts without an explicit colour receive a conservative default. A chosen tag colour survives save/import/presentation/video. Tag removal additionally checks the opposing player and whether the tagger has both their own strips.
- Visually differentiated tag removal (colour strip at tagger and amber cue), a non-contact player touch (blue cue), and equipment/line contact (teal target cue). They are distinct edit-time actions, not synonyms. A plain touch never requires tag belts.
- Tag guidance now explicitly mentions RFU U7/U8 expectations: ball carrier attempts to stop and pass within 3 seconds / approximately 3 strides; tagger calls TAG and returns the strip before rejoining. These are **guidance, not automatic physics or referee enforcement**. Touch/target cues do not automatically alter possession. The player can author subsequent steps normally.
- Revised group-contact creation validates on a detached frame before committing. Invalid participants no longer leave ghost markers or empty steps; contact formations still use their existing age/possession checks.
- Improved video builder and editor action-dialog spacing, minimum action button sizes, multi-column wrap on narrower viewports and [hidden] handling for tag-specific fields so **Tag to remove** never appears while recording a touch.
- Expanded regression assertions for matching strip colours, action separation, new contextual menus, colour shortcut, modal hiding and layout; verified JS syntax and isolated core tag/touch logic. Refreshed public asset module versions.

**Acceptance still needed:** native browser interaction tests of both modals, right-click on group selection, printable/video outputs and small-screen layouts, plus full CI (GitHub status API returned no check result in this session). Do not claim these user journeys are fully tested. Current RFU Regulation 15 appendices remain authoritative for live coaching.
