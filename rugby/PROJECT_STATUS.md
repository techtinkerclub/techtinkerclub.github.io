# Rugby Coaching Studio — project status and handover

Updated 20 November 2026. This document is the maintained handover between chats and development sessions.

## Current release

- Single supported editor: **Classic Studio** at `/rugby/`, including touch workspace on phones and tablets.
- Public catalogue: `/rugby/library.html`; read-only presentation: `/rugby/play.html`.
- UI release marker: **0.20.47** (publication system shipped in 0.17.0). Source repository: `techtinkerclub/techtinkerclub.github.io` on `master`.
- QA for commit `3cd81bdac78befe2a028fe540d9359709eaaad9c`: Node Rugby tests **passed**, Playwright browser QA **passed**, Pages deployment **succeeded**. Any later commit must earn its own check; a successful deployment alone does not prove QA passed.

## 0.20.46–0.20.47 — Immersive live Blackboard for coaches (20 November 2026)

- **Goal:** User wanted a full-screen interactive Rugby Blackboard, modelled on the 99 Club Studio manipulatives whiteboard (`techtinkerclub/99club`, `/whiteboard/`): pitch takes priority, minimal transparent floating tools, touch/pen/mouse direct interaction, selection-aware actions. Unlike **Presentation** (read-only), this mode must edit the SAME actual drill.
- **Entry:** Auto-created **▤ Blackboard** header action in both Library and Coach editions; also **Open full-screen Blackboard** in View options and a direct URL `/rugby/?blackboard=1`; keyboard `B` (outside inputs). Exit button or Esc restores existing editor. Optional native Fullscreen button where browser supports it; CSS fullscreen works independently on iOS Safari.
- **Implementation:** `js/blackboard.js` and `assets/blackboard.css`, initialised once at the end of `js/app.js`. Uses the EXISTING `#pitch` SVG, selection, history, saved frames, palette, play and action handlers. The normal editor is only visually hidden; do not create separate board state or fork Classic mode.
- **Floating controls:** semi-transparent narrow tool rail: Select, Run (click points to draw real movement), Pass (tap receiver), Ink (temporary teaching annotations), Add (blue/red player, ball, cone, marker and line marking), Details (opens the ORIGINAL Object/Step/Drill inspector). Selected-object popover: Run, Pass, ±15° via the original rotation inspector, Edit details. Top actions: Undo/Redo, Fit, browser Fullscreen, Classic/Ruckus, Save through original GitHub workflow and Exit. Bottom navigation: previous/next step, add new step, playback. State labels reflect real `idx`, `selected`, `cartoonMode`, `playing` and original button eligibility.
- **Ink boundaries:** separate overlay SVG, mapped to actual pitch SVG viewBox/zoom and screen-to-SVG coordinates, touch/pointer-enabled. Explicitly TEMPORARY, not saved or exported as drill/video and clearable with Undo mark/Clear ink. Rugby runs, passes, player moves, rotations, objects and steps remain normal persistent editor operations. Never claim temporary ink is persisted.
- **Mobile:** Fullscreen 390×844 and tablet 920×520 covered by responsive CSS; menu actions do not require right-click. Drawer reveals original full inspector only when selected; blackboard should not override mobile navigation outside this mode.
- Tests: `tests/blackboard-mode.test.mjs` checks real-editor reuse, no duplicate drill state and temporary ink, `browser-tests/blackboard-smoke.mjs` tests fullscreen, add, player rotation, ink, new step, and exit in 1380×850, 390×844 and 920×520. Browser QA workflow executes the new test BEFORE its existing video/mobile/decision checks. The latest browser Blackboard test passed all three viewports on latest candidate. Node new Blackboard tests passed; other pre-existing QA failures must be reported separately. Check release SHA/deployment before claiming live availability.
- **Future expansion (not yet built):** decide whether temporary pen strokes should be optionally persisted as proper diagram annotations; add presentation-mode read-only Blackboard when expressly requested. Avoid implying existing temporary strokes are permanently part of saved frames. Keep Classic editor intact.

## 0.20.45 — Smooth Follow action camera across editor, libraries and exported video (19 November 2026)

- User requested camera that **actually follows moving players/ball** in Studio, both library flows and exported videos. Earlier `actionViewportAt` only moved from one fixed step framing to the next; it did not track interpolated positions *through* a step.
- Added pure `followActionViewport(d,g,i,p)` in `js/action-camera.js`: use the current interpolated moving players and ball (including timed routes) to shift the focus smoothly, retain an action-wide safe viewport to keep tactical context, clamp inside field, and ease changes at step boundaries. Does not change player or drill data; allows Full pitch and Action focus modes to remain independent.
- `renderScene(...,{framing:'follow'})` now uses this view at the **same animation timestamp** as player and ball frames. Both exported video pipelines already call `renderScene` and therefore use the same follow camera at each captured video frame. `outputOptions` now recognises `'follow'`, alongside `'field'` and `'action'`.
- Editor View options: **Follow the action during playback** checkbox, camera moves while playing; Action still means one-shot fit, manual camera controls disable follow. Editor export settings surface **Video camera** at top of share dialog beside Classic/Ruckus, seeded from editor follow preference or presentation camera choice.
- Read-only public library presentations: visible **Follow action** quick toggle and Follow option in camera select. Both track while playing and seeking, and are available on mobile. The video's camera choice is independently selectable next to character style.
- Public library video builder: visible Video camera selector, with follow preselected for Ruckus, action focus for Classic; explicitly preserve its selected mode instead of forcing `framing:'action'` at record time. This also applies to public library multi-drill videos.
- Added Node regression tests in `tests/follow-action-camera.test.mjs`, plus real-browser checks for actual viewport motion, editor/recorder UI and Ruckus export in `browser-tests/video-export-ux.mjs`. Review GH Actions after the latest commit; deployment alone does not prove QA.
- **Future fun ideas only (not implemented):** optional comic action captions, playful whistle/boing sounds, freeze-frame replay accents, celebratory end cards. Keep them off by default and never disguise actual rugby mechanics.

## 0.20.44 — Contextual video export, Ruckus films everywhere, no corner flowers (19 November 2026)

- User requested the editor and **both library routes** stop showing inapplicable multi-drill and decision-video options; explicitly provide **funny Ruckus video export** from Studio/saved library, public catalogue, and read-only presentation; **remove the four decorative flowers** from Ruckus pitch corners.
- Reworked `js/movie.js` `bindMovieSettings` with `setContext({hasDecision,story})` and `videoSettingVisibility`. Decision outcome, decision pauses, and option explanation duration are hidden/disabled unless the selected drill(s) contain branches. Slow replay speed appears only when replay is selected. Story intro duration appears only where appropriate. The return value remains the original movie options function with a `setContext` method. Opening intro timing was decoupled from decision pause cards in `movie-storyboard.js`.
- **Studio and Coach Editor** `movieSequenceDisclosure` is a closed-by-default optional progression. Adding more drills opens it, preserving all existing add/import/reorder/remove controls. `shareVideoStyle` prominently selects Classic or **Harburling Ruckus · funny cartoon video** and is initialised from the current view, but does not modify shared drill data or the presentation-link options.
- **Public library** builder: single-drill export is the default; title and progression actions appear only for multiple stages, while stage controls remain accessible in the expandable optional builder. `publicVideoStyle` is now prominent and supports a preset from `?style=ruckus` or legacy `?style=minion`. `recordDrill` uses storyboard mode for a *single* Ruckus drill too, giving playful graphic cards and scene colour scheme rather than only normal-style video with cartoon sprites.
- **Public read-only presentations** provide a prominent `playerVideoStyle` Classic/Ruckus choice, initialised/synchronised from the view toggle and explicitly passed into video export, independent of saved drill data.
- `cartoonPitchDecor()` now returns an empty string, removing pink/yellow flower corner shapes from editor, both library displays and rendered video frames without altering field markings or Classic.
- Added `tests/video-context-theme.test.mjs`; updated `tests/cartoon-mode.test.mjs`; added real-browser `browser-tests/video-export-ux.mjs` and a Browser QA workflow step to check a Ruckus download from the public library, conditional settings, editor multi-drill disclosure and player Ruckus styling.
- **User's latest camera-facing idea (discussion, not implemented):** consider a Ruckus-only visual initial/idle facing-towards-centre style (top half looking down, lower half looking up) but preserve authored movement/head direction and manually locked facing, to prevent an unnatural flip on crossing halfway. Do not force players to always face pitch centre by default.
- Validation: verify *this commit's* Pages deployment, Node regressions and browser export checks before claiming release fully QA-accepted. Native Safari MediaRecorder compatibility still needs device acceptance.

## 0.20.42–0.20.43 — Natural standing/running/carrying for passing and receiving (19 November 2026)

- User feedback: repeated special passing/catching sprite mirroring and rotations made players turn unnaturally; requested simply **normal standing, running or carrying poses**, looking towards teammate as they pass/receive, like ordinary movement.
- Removed the dedicated `semantic=8/9/10` pass/catch selection from `cartoonPoseIndex` and stopped choosing atlas cells 43–47 for these ball transfers. The normal Classic-derived movement/held-ball logic chooses standing, running, or carrying. Genuine pickup remains kneeling, and contacts, groundwork and presentation keep their distinct poses.
- Removed the pass/catch-specific local body turn, X/Y reflections and incompatible transform helpers from the Ruckus render path. Retained the original normal 5-direction head/visor artwork and its existing moving body orientation.
- Added `ruckusPassLook` which aims the **head/gaze only** towards teammate during a valid ball transfer; it smoothly fades in before the ball starts and out once it is received, and is limited to the normal ±90° five-way glance. No new model actions, time changes, full-body turn, or changes to Classic/player rotation/ball flight. Other head targets/movements and all nonpass transfers retain the normal look.
- Replaced tests that enshrined the bad extreme rotation with tests that verify normal atlas pose selection (standing, running, carrying), both teammate directions, fade in/out, nonpass exclusion and unchanged Classic rendering/drill state. Shared scene, editor and public/export module cache keys bumped to v0.20.42. v0.20.43 also fixes an earlier mobile Pan exit regression: choosing any selectable object or route on the pitch, not only ball-carrying players, turns Pan off; app.js cache updated.
- Release verification: check GitHub Actions Node QA and browser smoke + GitHub Pages deployment for **latest HEAD**; do not assume previous green status proves this change correct visually on Safari.

## 0.20.41 — After playback, return to editable last step; reliable mobile player selection (19 November 2026)

- User reported that **players sometimes cannot be selected after playback**, especially on mobile, and clarified the preferred destination is **editing the last step**.
- Root cause 1: the Play handler stopped at `preview=duration()`; the editor disables object hit testing while `preview!==null`. Natural finish now calls `choose(drill.frames.length-1)`, clears preview and updates tools, and disables latched Pan mode. Manual Pause similarly returns to editing the nearest current authored step. Decision fork comparison remains an intentional pause and is not affected.
- Root cause 2: `camera.js` captured *every* touch when Pan was on, even player taps, before Studio's pitch selection listener could receive them. On mobile, player/object/route hit targets and touches within the existing player hit radius take precedence over panning; blank grass can still pan. The edit selection also prefers a player when a broad route hit stroke overlaps a finger tap. Desktop spacebar/middle-button panning remains unchanged.
- New Node regression tests in `tests/mobile-playback-selection.test.mjs` and browser coverage in `browser-tests/mobile-smoke.mjs` for natural playback completion, editability of final step and selecting a player with Pan enabled. Shared camera import bumped and Studio/Coach html cache keys refreshed; Classic player artwork and underlying drill frames untouched.
- Latest QA/Pages results must be reviewed against the actual release commit; do not assume an earlier green run validates this revision.

## 0.20.40 — Fix inverted pass sprites (19 November 2026)

- Reported with screenshots of an U10 drill: **catching now correct** in v0.20.39, but during either left/right pass the passer turns upside down.
- Root cause: the same `ruckusActionSpriteTransform` used for both receiving and passing; it adds a 180-degree source turn and Y-axis reflections that are correct for the receive atlas poses but **incorrect for pass atlas frames 43–45**, which are already upright diagonally towards screen-right.
- `ruckusPassSpriteTransform(localBearing)` is separate from the existing **unchanged** catching transform. Native upright pass sprite faces approximately +45 degrees; the opposite side is a horizontally mirrored copy facing -45 degrees. Only the remaining delta rotates the sprite: +45 degrees for rightward and -45 for leftward throws, no vertical flip in lateral passing. Actions retain their original authored ball trajectory, player position and rotations, and Classic rendering.
- `tests/ruckus-catching-direction.test.mjs` now explicitly asserts both pass directions render `scale(±1 1)` and `rotate(±45 64 64)`, have no 180-degree passing turn, preserve receiving X/Y transforms, and keep actual facing vector aligned with ball direction.
- Updated module cache versions for Studio, Coach, public library, read-only player, rendering and video to 0.20.40. Verify latest workflow and Pages release individually before claiming complete QA.

## 0.20.38–0.20.39 — Bidirectional Ruckus actions + separated mobile Steps/Timing (19 November 2026)

- **User-reported regression:** In v0.20.37, Ruckus catch poses faced backwards and the once-working opposite side was also damaged. A later screenshot showed pass animation had the same one-sided issue. The previous patch assumed a 45° receive pose and applied a simplistic one-axis flip, which is not sufficient for all four directional quadrants. The user suggested original artwork + X and Y mirrored copies.
- **Fix in `js/cartoon-players.js`:** both passing and receiving now use the same **four-axis-variant source-art transform** (unmirrored, X mirror, Y mirror, X+Y mirror) derived from actual authored ball flight. A small ±45° rotation aligns intermediate angles. These are SVG reflections of the genuine supplied sprite atlas; no new placeholder images. Explicitly handles the standard editor pass *without* a `transferKind`, which was previously failing to select the passing sprite. Sender faces the outbound tangent; receiver faces the incoming side. Classic gameplay, player rotations, camera, ball motion and authored timing remain untouched.
- Added more demanding `tests/ruckus-catching-direction.test.mjs` checks that mathematically validate the **rendered sprite's face direction after mirroring and rotation**, not just metadata, along with real pass/catch sprite selection and exclusion of turnovers/pickups.
- **Mobile Steps usability:** v0.20.36 had five timeline sections in a grid with only four explicit rows and an override forcing a maximum 290 px height; tracks overlapped the step cards. Mobile now uses a larger bounded bottom sheet and distinct **Steps** and **Timing** tabs (one view visible at a time), one-tap **Edit selected step** access, generous touch handles, selectable step card strip and **More options** disclosure for secondary sequence controls. All existing desktop buttons/timeline mechanics restored when leaving mobile mode. No new step format.
- v0.20.40 also makes mobile View-sheet backdrop state synchronous and refreshes the Studio→workspace→mobile module cache chain after a Playwright tablet timing race. Browser smoke test extended for portrait phone, portrait tablet and landscape phone to assert step cards and timing tracks do not overlap, both subviews switch correctly, Edit selected step opens the inspector, and advanced controls stay reachable. The regular full-suite/desktop smoke failures from earlier commits remain independent issues; check latest run statuses before asserting deployment or complete QA.

## 0.20.37 — Ruckus receiving animation faces incoming pass (19 November 2026)

- User's mobile screenshot of an untitled U10 drill showed A1 receiving a left-to-right pass with the Ruckus visor/hands facing the wrong way. This is **not** a change to the Classic drill, player rotation or ball movement.
- Root cause: semantic `receive` (pose 10, supplied 54-sprite atlas cells 46/47) used the receiver's old head-gaze/relative-facing value and applied the generic 180° sprite rotation. The receiver's gaze model does not automatically track a pass *towards* it; those two lateral source sprites need incoming-flight orientation.
- Added `ruckusIncomingPassBearing(o, previous, frame, g)` in `js/cartoon-players.js`: detect real incoming ball ownership change, derive incoming direction from the actual authored ball route's final tangent (or sender position for degenerate flight), invert for the receiver's look direction, subtract the already-applied body/field rotation, and mirror the artwork when appropriate. Calibrated to the source art's diagonal (~45°) receive pose. Do not modify positions, timing, headMode, ball ownership or editor Classic rendering. Pickups, rips, turnovers, handovers, presentations and drops do not get false 'catch' orientation.
- Added `tests/ruckus-catching-direction.test.mjs` covering left/right, above/below, diagonal, curved pass, rotated field, excluded transfer types and Classic non-regression. Shared scene import/caches refreshed for editor, read-only presentation, public library, print and video export (including the nested public-video/video-recorder imports).
- QA: Playwright browser workflow still has a known pre-existing desktop smoke failure for stale `.minion-top-down` assertions; fresh targeted catch tests must be checked separately when Actions completes. Pages deployment is not evidence of the visual orientation on iOS Safari.

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
