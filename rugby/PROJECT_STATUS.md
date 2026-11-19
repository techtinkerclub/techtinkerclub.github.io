# Rugby Coaching Studio — project status and handover

Updated 19 November 2026. This document is the maintained handover between chats and development sessions.

## Current release

- Single supported editor: **Classic Studio** at `/rugby/`, including touch workspace on phones and tablets.
- Public catalogue: `/rugby/library.html`; read-only presentation: `/rugby/play.html`.
- UI release marker: **0.20.36** (publication system shipped in 0.17.0). Source repository: `techtinkerclub/techtinkerclub.github.io` on `master`.
- QA for commit `3cd81bdac78befe2a028fe540d9359709eaaad9c`: Node Rugby tests **passed**, Playwright browser QA **passed**, Pages deployment **succeeded**. Any later commit must earn its own check; a successful deployment alone does not prove QA passed.

## 0.20.36 — Mobile touch controls and unclipped menus (19 November 2026)

- **Screenshot and scope:** Phone view had a duplicated in-pitch camera bar, a second zoom toolbar, cumbersome horizontal toolbar scrolling and **View options opening underneath the pitch**. This is a touch editor UX problem; no changes to drill modelling or Classic player art.
- **Single camera bar:** mobile `Zoom − / Fit / Action / + / Pan` controls now live in the stage toolbar *above* the pitch, with no in-pitch duplicate. The original full desktop editing toolbar (group select, move scope and field orientation) is still available inside the existing **Edit** bottom sheet, not deleted.
- **View options:** the *existing* `#viewMenu` is moved to `document.body` in the mobile workspace and rendered as a high-z-index scrollable bottom sheet above the pitch and navigation, with a backdrop and keyboard dismissal. It is returned to its original toolbar position when switching back to desktop. This avoids the scroll-container clipping defect. This is not a second independent settings UI.
- **No right-click required:** selecting any editable object shows a clearly labelled **⋯ [object] actions** button at the lower pitch edge. Tapping it invokes the **same existing contextual action menu** as desktop right-click, in an accessible mobile bottom sheet: contact, tag/touch, ball, route, duplicate, drawing order and deletion commands are unchanged and subject to the same guards. Group menu is supported for two or more selected players; desktop contextmenu is retained.
- Updated the step-action help to say tap Actions on touch, right-click on desktop. Added `tests/mobile-overlays.test.mjs` with a DOM-level portal/restore test and overlay/action contracts. Extended `browser-tests/mobile-smoke.mjs` to verify mobile (390×844, 820×1180, 844×390) camera controls, View options, inspector selection and action menu. Added the mobile browser test to the existing GitHub Browser QA workflow.
- **Validation boundary:** the broader Rugby QA suite already had 12 failing checks at the earlier v0.20.32 commit, including starter-drill data and stale browser sprite expectations. Mobile smoke/browser acceptance and deployment must be checked per commit; successful Node parse or Pages deployment alone is not acceptance.

## 0.20.35 — Mode-toggle and visual placement fixes (19 November 2026)

- The active GitHub repository is **techtinkerclub/techtinkerclub.github.io** (master), rugby app under `/rugby/`. User expects changes directly in the repository, not a conceptual mock-up. **Classic Studio is the source of truth**; the Ruckus appearance is visual translation only.
- **Scope correction from the user:** the **view-mode button overlapping the camera controls is mobile-specific**. The **floating coloured tag strips** and **coach label positioning** are cross-device problems; do not treat them as phone-only layout defects.
- On mobile/tablet the *existing* Minion/Ruckus view-toggle button is reparented from the pitch overlay to the drill stage heading; desktop restores it to the pitch border. No duplicate button or duplicated click listener. Mobile heading remains available in short landscape.
- In Ruckus, belt strips are anchored against the visible mascot hips (not the outer transparent atlas footprint). Both strips and the held-tag counter now sit nearer the sprite; underlying tag ownership and behaviour are unchanged. The Classic renderer was not changed.
- Coach captions in **both Classic and Ruckus** are positioned from the actual object anchor, respecting the visible SVG viewport rather than clamping to the boundaries of an offset training pitch (which had displaced captions sideways).
- Browser cache references refreshed in Studio, Coach Edition, library and read-only presentation; relevant shared imports and mobile CSS revisions updated. Added `tests/visual-placement.test.mjs`; retained Classic contract tests.
- **Validation boundary:** JavaScript source syntax checked after publication, but complete Node test suite and device/browser visual QA have **not** been run in this session. Verify especially tag placement during turns/grounded poses, coach labels near cropped action-camera edges, and mobile landscape/portrait.

## Overhead Minion view (0.19.7)

- Minion Mode retains top-down rugby players: yellow crowns, compressed leading-edge goggles, rear overalls in team colours, and short overhead gloves and boots. One/two-eye variants are stable per player across frames.
- The goggles follow the existing head tracking without adding direction arrows. Classic players and all drill data, poses, movements, and decisions remain untouched.
- The shared renderer covers Studio, read-only presentation, and video export. Browser smoke-test assertions added for switching modes; deployment and full QA are not yet independently verified.

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

## v0.19.2 — explicit ball rip, loose-ball pickup and participant selection

- **Actions…** no longer requires selecting the entire tackle/ruck/maul group first: the contact section of the dialog provides participant checkboxes, preselecting the clicked player and (for exactly two players) both. Age restrictions and actual ball prerequisites still apply; disabled options now explain what is missing (U9/U10, ball carrier, opponent, grounded ball, number of players).
- Added **Rip ball from a player (teammate / opponent)**. Choose current carrier, recipient, time (10–95% of the step) and editable coaching label. This creates a `transferKind: 'rip'` transition that changes possession *without* any imaginary pass. The presentation displays the authored rip label and an event cue, not a dashed ball flight. Supports a rip from a grounded carrier without automatically moving the tackling/player contact formation.
- RFU age guard: U7/U8 cannot use rip; U9 supports teammate rip only (then pass); U10+ may select a teammate or opponent subject to current age-grade rules and safe context. The editor does not certify physical technique or automatically force the follow-up pass.
- **Release ball** and **Pick up a loose ball** remain separate, consecutive action steps rather than one forced pass. Players from either team can be chosen for the pickup. New pickup dialog selects the free ball, picker and event time, starting from either the ball or a player. Ball changes are shown in **Step → Actions in this step** with editable timing, removable transfers and an editable rip label; player run timing remains separately adjustable on tracks.
- Tests in `ball-events-rip.test.mjs` cover rip transfer semantics, release and pickup without pass lines, UI element wiring and U9 opponent restriction. Source syntax was checked and isolated ball movement verified; full Node/Playwright live-browser acceptance is still pending.
- **Known boundary:** The rip event indicates a possession handover and coaching cue; it is not a physically animated hand/arm extraction technique. The drill author should position both players close together and separately show any legal subsequent pass. No automatic collision detection, continuity law adjudication or age-grade technique certification.

## v0.19.3 — Tackle to ground / Held upright choice (18 Nov 2026)

- **Actions… → Contact** now asks for an explicit **Contact outcome**: **Tackle to ground → ball presentation → ruck** or **Held upright · carrier stays on feet**. The existing tackle marker, player assignment and formation editor are reused; no duplicate new ruck system.
- Ground tackle still uses the established breakdown progression: tackle (carrier grounded) → release and present → support arrives → ruck formed → contest → ball secured/play away. The **Open breakdown sequence** button remains available only on a grounded tackle.
- Held upright is stored as `contactOutcome:'held'` on a tackle/contact marker; the ball carrier has a distinct `held` standing player pose and defenders remain engaged, with no grounded carrier or phantom tackle breakdown. This is a schematic upright stop, not a completed tackle. Subsequent rip/pass can be separately authored using the existing Actions menu. A new rip action does not create a ruck.
- Modified contact cleaning, saved/published playback, SVG pose depiction and editor/presentation cache versions. Existing tackle drills without a contact outcome retain their original ground-tackle/ruck behaviour.
- `tests/held-upright.test.mjs` covers no-breakdown for upright holds, ground-tackle breakdown preservation and the existing release/support/ruck phase order. Isolated JavaScript formation checks succeeded for both alternatives; full Node and live-browser regression are still outstanding.

## v0.19.4 — TAG! callout, raised tag and actual return action (18 November 2026)

- RFU U7/U8 mini-tag coaching now makes the **tagger's call visible**: an authored tag-removal moment displays a prominent **TAG!** bubble over the tagger and the removed coloured strip raised visibly in the tagger's player graphic. The raised strip remains with its holder until it is returned. This is a text/animation callout, not audio playback.
- Added **Actions… → Return a tag to its player**. The picker offers only outstanding strips and routes each back to its original wearer and original left/right hip. A return is saved as a timed `tag-return` interaction, distinct from a new tag, touch, possession change or the manual **Reset belt (setup only)** control. Tag-strip ownership is tracked in `heldTagItems` (targetId, side, colour) alongside the older numerical `heldTags` count.
- The return removes the raised strip and restores the matching hip strip in the animation, decrements the correct tagger's held count, and propagates the state into subsequent authored steps. If a tag is taken and returned from the same step, the return creates a separate following step to avoid simultaneous TAG/RETURN callouts. Individual tag or return actions can still be retimed or removed in Step → Actions in this step.
- Older saved tag drills with count-only tracking are supported where their authored removal events identify the tagger, recipient and side: ownership is reconstructed on opening Actions. No arbitrary owner is assigned when old event provenance is absent.
- RFU U8 guidance: on a tag, the tagger stops, holds the strip aloft and shouts TAG; the referee calls TAG – PASS; after the ball is passed, the tagger returns the strip before rejoining. The tagged player must replace it before rejoining. The editor **does not automatically enforce a stop or pass**; coaches must author player movement and the next pass correctly.
- Added `tests/tag-call-return.test.mjs` covering saved tag ownership, shout/raised strip, removal/return timing, return validation, legacy compatibility and read-only presentation. Adjusted the old skill-action test for the TAG! callout. Source syntax and the core model were checked in isolation; **full Node CI and live browser/mobile acceptance remain unconfirmed**.

## v0.19.5 — readable coaching callouts and player gaze (18 November 2026)

- Authored **TAG!**, touch and tag-return events can now set **Show callout for (seconds)** in the creation dialog and edit **Callout (s)** under **Step → Actions in this step**. Range 0.2–8 seconds; defaults 1.6 s for tag calls, 1.2 s for returns and 1.0 s for touch cues. The overlay renders across step boundaries until its allotted duration expires, rather than disappearing at the end of its creation step. The raised stolen tag remains until the separately authored return event even after the TAG bubble vanishes. No speech audio is synthesised.
- Added a per-player **Head direction** Object inspector setting. Defaults to **Follow running direction** with no migration required, plus **Follow another player** (select target) and **Look straight ahead**. Head cue rotates separately from player body: it does not change authored path or full-body orientation. The heading and target ID survive save/import, public presentation, printable stills and shared video renderer.
- Teaching-priority auto gaze temporarily overrides manual modes: defenders engaged in an explicitly authored tackle/held-up contact track the carrier, a defender closing on a ball carrier during a genuine chase tracks that carrier, and a ball passer turns towards the intended receiver shortly before the authored pass begins. Ordinary unrelated defenders do not all auto-track; no gaze tracking is inferred from arbitrary proximity alone. Grounded/kneeling formation players suppress the standing head cue.
- Added `js/player-gaze.js` shared geometric renderer and `tests/head-gaze-callouts.test.mjs` covering defaults, manual/follow modes, tackle and pre-pass overrides, ground pose, callout trigger/display time, cross-step persistence and output preservation. Inspector spacing adjusted and all rendering module references refreshed.
- **Known limits:** the gaze symbol is a schematic overhead head/direction cue, not anatomical neck animation; automatic pursuit is heuristic and deliberately restricted. It does not move players or change safety decisions. TAG! is a visual callout only. Full Node/Playwright CI, browser playback on real devices and printed/video rendering remain to be signed off; syntax and isolated model checks passed in development.

## v0.19.6 — two distinct player-facing visual modes (18 Nov 2026)

- Coach-requested fun Easter egg: **◉ Minion Mode** toggle in the top-right corner of the pitch border in both Classic Studio and the public read-only drill presentation. The second click returns to **◉ Classic view**. This is an entirely **visual option**: it does not alter drill objects, player IDs, timings, paths, decisions, contact state, ball possession, or tag states.
- **Normal view**: remove the duplicate eye/head indicator and the old fixed-forward arrow inside each player symbol. Replace with exactly one white, high-contrast directional arrow that follows the existing independent head/gaze logic (run direction, follow player, tackle pursuit, look to receiver before pass). No animated eyes in Classic view.
- **Fun mode**: replace player-only SVG bodies with yellow cartoon teammates, blue/orange/purple/green team clothes, varied single/two-eye goggles and small expressions/hair, while retaining the same gaze angles and authored player pose categories. **No player gaze arrows.** Keep all equipment, contact/ball actions, tag-strips, movement trails and rules unaffected. Add restrained flower decoration near the pitch corners. This is a playful original SVG depiction, not an external image dependency or an official rugby mascot.
- Shared renderer accepts `cartoonMode` (false by default); editor switch feeds its sharing/video options; public player switch adjusts the in-page visual mode. Linked presentation may carry the visual option, and exports can preserve it. Black-and-white `ink` print uses standard shapes to stay legible. Cache-busted editor, player, video and public library modules.
- Added `tests/cartoon-mode.test.mjs`: normal arrow only, cartoon goggles only, consistent character variation and non-player preservation, pitch decoration, export option handling, and UI toggle wiring. Static syntax and isolated SVG checks passed; full browser/Playwright acceptance, screenshots on different browsers, output visual inspection and small-screen layout tests still required.
