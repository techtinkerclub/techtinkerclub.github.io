# Rugby Coaching Studio — Classic Studio v0.17.1

Standalone web application for grassroots rugby coaches. See [current status and handover](PROJECT_STATUS.md) for verified releases, known limitations and next tasks. No build step or npm dependencies. Serve the repository root with an HTTP server and open **/rugby/**.

## Main interfaces

- **Editor:** /rugby/ — complete editor, responsive mobile workspace and advanced coaching tools.
- **Public coaching library:** /rugby/library.html — curated, read-only coaching resources.
- **Read-only drill presentation:** /rugby/play.html — interactive animation, printable notes and video export.

The mobile/tablet workspace uses the same editor, drill model, renderer and GitHub storage as the desktop interface. Saving a drill to GitHub does not automatically publish it in the separate curated library.

## True animated decisions

A drill can now have one two-outcome decision:

1. Open a drill and select the step that should be the shared decision/signal.
2. Click ◆ Add playable decision beside the timeline.
3. Name the question and outcomes A and B.
4. Edit A using normal steps, runs, passes, poses, rucks and timing.
5. Click B and edit its timeline independently. You can return to A without losing either path.
6. In a shared presentation the viewer chooses A or B; video export offers both outcomes sequentially in labelled chapters (default), or only the selected outcome. Print / PDF outputs describe both paths separately.

The saved drill stores a branching object with version, fork step, question, current selection and two choice suffixes. Normal frames remains the active linear path, preserving compatibility. The shared setup is all frames through fork. The model lives in js/branching.js and js/scene.js sanitizes both saved paths.

Limits: one two-way fork per drill; nested decision trees and automatically triggered choices are not yet implemented. Older annotation-only decision diamonds remain distinct and supported. At least one step must remain in each outcome. To remove branching, select the one you want to retain and choose Edit decision → Remove fork; export JSON first if you also want the other path.

Worked example: seed-132, React to the carrier · two outcomes. Five defenders advance at the signal, then respond to a coach carry / touch or a backward pass and controlled tackle on an age-matched runner. This is schematic. Never use a live adult tackle target with U10 players; check RFU rules and qualified-coach guidance.

## Coach whistle · GO (v0.13.9)

Select a **Coach** object and use **Object → Coach start signal**. Set **Show whistle cue for (seconds)** to a value from **0.1–3.0 s** (default **0.5 s**, e.g. 0.2 s or 0.5 s). Choose **Add whistle · GO**. The cue belongs to the first action step and appears for that duration during animated playback, video and presentation. Static diagrams can show the cue as an editing annotation even after its playback duration. The optional audible whistle remains a short separate sound; the visual duration does not stretch or shorten the whole action step.

To remove the whistle, select the Coach and press **Remove whistle · GO**, then **Save to GitHub** if you want the online copy updated. Removal is independent of the current step or edits to the original coach setup. When the step was automatically named for the whistle, removal also clears that automatic label and narration; the step itself remains in case other actions were added.

The editor and read-only player share the same signal model, import/export support and rendering code. Older drills without a duration retain a default of 0.5 s.

## Convert a drawn decision into playable actions (v0.14.0)

The old yellow diamond and dotted/curved yellow preview arrows are **annotation only**. They do not make the coach or a player move, and playback does not pause at them without a playable branch.

For an existing drawing, first **pause** the animation and select the step containing the diamond. Select the yellow question-mark diamond, then use **Object → Turn this drawing into playable A + B**. Or click **Make drawn decision playable** beside the timeline. The modal starts with the existing question and the names of the two drawn options.

**Conversion:** The model splits the current action step where the diamond is anchored along the named player's running path, preserving the common setup, whistle and defenders' partial movement. Option A and option B receive separate editable suffix frames. A drawn **run** becomes an actual player running path; a drawn **pass** becomes a real ball transfer if the ball carrier possesses a ball, the arrow reaches a receiving player and the pass is not forward. The old preview lines are cleared to avoid double arrows. Other players continue any existing movements but the app intentionally does **not** invent defender responses or tackles: animate those in each outcome. A single fork with exactly two alternatives is supported; a drawn diamond must have a selected Player. A copy is changed in the editor; nothing is saved back to GitHub until the user explicitly saves it.

After converting, edit Outcome A, use the B button to edit Outcome B, then play from the start. At the fork the app pauses and displays a side-by-side comparison of real paths. Choose either to continue; media and coaching sheets can include both.

## Structure

- index.html — Classic Studio desktop and mobile editor.
- assets/branching.css — shared branch controls, player and printable headings.
- js/app.js — editor, timeline, playback and GitHub save.
- js/branching.js — shared fork model, branch switching and projections.
- js/scene.js — safe playback data and SVG scenes.
- js/outputs.js, js/movie.js, js/coaching-output.js — share links, movies and coaching documentation.
- js/player.js — branch chooser and read-only player.
- js/github-store.js — saving to data/coach-drills.json.
- data/drills.json — starter catalogue, currently 143 records.
- tests/branching.test.mjs and other tests/*.test.mjs — regression coverage.
- .github/workflows/rugby-qa.yml — continuous tests for Rugby folder changes.

## Safety and development

Run node --test rugby/tests/*.test.mjs from the repository root with Node 22, then inspect editor, player, printed sheets and movie export in a real browser. The GitHub Pages site and repository are public. No identifiable child information should be stored. A noindex tag is not authentication. GitHub credentials for saving are held in the caller's memory and not saved in drills.

Check current RFU age-grade contact rules and safeguarding guidance before use. Schematics and validations are not independent safety approval.

## Working from a phone or tablet (mobile workspace v0.1.2)

Classic Studio has a touch-first layout at widths up to 1100px. No features are deleted: the existing pitch, palette, inspector, branching controls and timeline are the same shared components.

- **Pitch** leaves the diagram at maximum usable size. Tap or drag a player or object; use the touch-sized + / − / Fit / Pan controls directly over the pitch when needed.
- **Add** opens the players/equipment/actions sheet. Selecting an add/draw action returns to the pitch to position the object or draw the path.
- **Edit** opens the existing Object / Step / Drill inspector in a scrollable bottom sheet. Selecting a specialised action can reveal this panel automatically.
- **Steps** opens the sequence, playhead and timing tracks. Swipe horizontally through the step cards.
- **Play** is a shortcut to the existing animation playback; **Save** triggers the same GitHub save process as on desktop. Both shortcuts remain available without opening the timeline or scrolling the top toolbar.
- The full top toolbar remains horizontally scrollable for advanced actions, view controls, import/export and sharing.
- Tablets use the same layout so the pitch is not squeezed between two narrow inspectors. Turning the device sideways gives more room; the browser's orientation is never locked.
- The existing read-only viewer keeps its own separately responsive layout.

**Cross-device saving:** local, unsaved edits do not sync from one device to another. Save to GitHub (with permitted GitHub credentials configured on that device), then open the saved drill on the other device. Export a JSON backup before switching devices if saving is not available. Browser movie exporting depends on format support and device processing limits.

This release is responsive and touch-oriented but should still be physically checked on iOS Safari and Android Chrome, particularly complex SVG dragging, pitch panning, modal editing and movie export. Keep controls and pinch interactions distinct from the underlying drill model.

## Animation quality and U10 Understanding the Game review (November 2026)

Player-on-player tackles now show the tackler's contact stance during playback; inherited recovery poses no longer leave moving players sliding in a low posture. Ball presentation is a short controlled placement, separate from a pass. All 15 U10 rules lessons have been reviewed for written explanations; key examples now have visible offside guides, accurate free-pass/scrum marks and marked in-goal areas where appropriate.

Read [ANIMATION_AUDIT.md](./ANIMATION_AUDIT.md) for corrections, audit thresholds, source links, current 142-drill checks and remaining browser/video verification. The new Node regression checks are included in the Rugby QA workflow. Real-device and movie visual testing remains outstanding.

## Catalogue-wide animation and U10 teaching review (November 2026)

The Rugby library now contains **142** editable starter drills. Fifteen are animated **Understand the game · U10** lessons, available through the public library's Rules walk-through filter. The original six cover ruck entry, offside, participation limits, tackle responsibilities, ball presentation and touch restarts. Nine new examples cover passing direction, knock-ons, support running, free-pass retreat, U10 scrums, mauls, tries, held-up balls and kicking/hand-off restrictions. Every rules lesson has coaching prompts, narration and age-grade references.

### Shared animation changes

- A player-on-player tackle with an **authored tackle marker** shows the tackler lowering into a ready stance before contact and tackling at impact, while the ball carrier goes to ground. This is a schematic explanation, not a physical tackling technique guide.
- The tackler releases in the following stage. A recovering player returns upright before travelling away, instead of sliding in a grounded pose. Deliberately pinned poses are preserved.
- Ball presentation eases the ball from a grounded player's hands into a nearby placed position. It is not represented as a ballistic throw or multi-metre pass. The ball stays down until an explicit collection.
- The starter catalogue received measured-distance and pacing edits: 17 overly long presentation gaps, 29 unrealistically fast movement stages, and nine inherited/final recovery poses were corrected.

### Ongoing QA and limits

The catalogue-audit regression test checks every starter for unique IDs, valid object references, renderable playback, realistic presentation reach, reasonable stage-average speed, and unpinned final recovery poses. Dedicated U10 understanding and tackle tests check technical scenarios such as release, scoring, offside guides and restarts.

An automated audit is not a guarantee of law accuracy, safe physical contact technique, artistic quality or iOS/Android behaviour. Non-directional skill exercises may have deliberately different passing directions from match play. Check current RFU rules and obtain qualified contact coaching before running these activities.

The full-library pass-direction regression now reviews ball transfers at the authored release/catch positions. Non-directional handling activities (circle, L-shaped and diamond) explicitly hide a fixed attack arrow and direct coaches to a directional drill when teaching legal backward match passes. The measured coaching-guide overlays in relevant free-pass and ball-placement lessons are preserved in editor, share view and movie rendering.

## Ruck contact and compact pitch review (Classic v0.14.6)

A second library audit found 24 formed-ruck and contest frames across seven drills in which opposing standing participants were 1.14–1.26 m apart, centre to centre. The library pairs are now about 0.43 m apart to show an actual joined contest. Auto-arranged rucks and staged tackle-to-ruck actions also use closer positions. The diagram checker reports a formed ruck with an on-feet opponent gap greater than 0.65 m. This is a drawing-quality heuristic, not an RFU law limit or instruction on safe physical contact.

Fourteen older narrated drills previously used a generic 60 × 35 m pitch. Their pitches were resized for the illustrated activity: short pass/restart demonstrations use 12–16 m lengths; scrum and maul examples are around 20–24 m; kicking activities retain 32–45 m lengths. Short passing and restart examples were re-centred so they are not stranded in a corner. This affects starter examples only, not user-saved drills. Complete visual review on actual devices and movie export comparison remain outstanding.

## Action camera and editing clarity (Classic v0.14.7)

**Two different things must stay different:** pitch dimensions are real distances for drill setup, whereas camera framing is only what is visible on screen.

- In the editor, the **Action** button next to the full-pitch zoom fits the current step without changing any player position, path, or measured distance. The mobile pitch controls also expose Action.
- In the read-only player, **View options → Camera → Follow the action** enables an optional per-step close-up. **Whole pitch** remains the default and is better for demonstrations about offside, spacing or the entire formation.
- The camera keeps each step in one frame and eases between step views to reduce jolting. Measured teaching guides are included in framing where present. Editor, Classic/Coach read-only views and video share the renderer. When action framing is selected, print pages use the same cropped view.
- The position-editing scope control explains on selection whether movement applies to one step, until the next run, to future compatible runs, or to stationary equipment across the drill.
- A separate regression test protects **Reset step movement**, future-route propagation, stop-at-next-run behaviour and protected contact formations.

The browser QA now includes Chromium phone-sized touch navigation and action-focus playback. Chromium emulation is not a physical iOS Safari test; real-device verification and full 142-drill content sign-off are still necessary. This release does not add nested decisions or silently resize user-created pitches.

## U10 teaching-demo repair (Classic v0.15.2)

The short **U10 offload to support** example now moves the carrier and tracking support player before a genuine backward transfer; the receiver visibly continues after catching. The old stage moved only the carried ball while the players stayed still. This remains explicitly non-contact practice.

The older **U10 free-pass restart** example now illustrates a restart after touch, with an accurately measured **5 m** inside-touch mark, two defenders visibly retreating **at least 7 m**, a stationary backward pass, and a separate follow-on stage when movement is allowed. The previous narrative described retreat without drawing any defending players. The check uses physical pitch metres and has a regression test. Current-season reference: https://rugbyreferee.net/wp-content/uploads/2026/09/2026-27-u10s-RRNet-RFU-Regulations.pdf (summary of RFU Regulation 15 Appendix 4); refer to the RFU's authoritative age-grade rules for any changes.

## Full marked rugby fields and movable practice areas (Classic v0.15.0)

**Drill → Full rugby field & training location** now separates the physical practice rectangle from its surrounding marked match field. The current custom training dimensions, player movements, paths and timings are untouched when you position that rectangle somewhere else on the full pitch. Select a U7–U16/Adult age-grade field template, then pick a quick location (halfway, 5m line, 22m, either try line or touchline), enter metre offsets or drag the highlighted rectangle in the preview. The larger field includes try/dead-ball lines, in-goals, halfway, appropriate 5m/22m/15m references and top-view goalpost positions. Younger pitches have simplified reference markings, not invented lineouts.

The editor has **Fit drill**, **Action**, **Fit pitch**, wheel / pinch-friendly camera controls; read-only presentations also have **+**, **−**, **Fit** and **Pan**, as well as Whole field / Follow action. A presentation's exported video follows its selected viewing style; temporary manual pan/zoom is a viewport-only feature. All Classic Studio views use the same saved `pitchContext` field. Old drills default to the original plain training rectangle.

The seed library includes a marked-field U10 touch free-pass restart (`seed-063`) and a U14 lineout near touch (`seed-061`). **U10 rugby has no lineouts**; the field is a spatial reference, not a licence to apply laws from older age grades. See [FIELD_GUIDE.md](./FIELD_GUIDE.md) for how to use it, size/source notes and limits. New regressions cover field geometry, preserved drill content and browser placement/zoom. Real iPhone/iPad Safari checks, full catalogue visual QA and coaching signoff remain open.

## Full marked rugby fields and movable training areas (Classic v0.15.2)

The Drill tab has two field modes. **Training area only** is the old default, preserving every existing drill. **Place training area on a full marked field** overlays the exact practice rectangle on an age-grade field, with try lines, in-goal, halfway, age-appropriate reference lines and schematic goalpost bases. Choose U7–U16 or Adult, position the rectangle by drag, metric offsets from the upper try line and left touchline, or presets for try line, 5 m, 22 m, touchline and halfway. The rectangle can be positioned in in-goal within the selected template. A failed fit is rejected; all player movement, timing and stored metre distances stay unchanged. Editor controls include Fit pitch, Fit drill, Fit action, wheel/touch-pan and zoom up to 16×. Full-field context is retained in saved JSON, read-only links and video; action-focused video framing is optional.

These are schematic **maximum match-field** templates, not exact surveyed locations or official law certificates. Junior markings are simplified references; for example U10 uses a free pass after touch rather than a lineout. Check the current RFU Regulation 15 appendix for the specific age group; adult Law 1 markings do not automatically apply to U10.
- RFU age-grade: https://www.englandrugby.com/run/rules-governance/rfu-rules-and-regulations/regulation-15-age-grade-rugby
- World Rugby Law 1: https://passport.world.rugby/laws-of-the-game/laws-by-number/1-the-ground/

## Explanatory decision movies and linked-drill progressions

The two-outcome editor now has optional coaching explanation fields: why the decision matters, what to watch, and what happens/what to watch for in each option. The text is included in saved JSON and read-only/print coaching notes. Video export for real decisions pauses the **actual field frame** at the decision, then shows separate, readable freeze-frame explanations before replaying A and B. Default pauses are 8 seconds for the decision and 6 seconds per outcome; the Movie settings panel lets the coach adjust them or turn them off. Standard movie replay settings and selected-only export remain supported.

Under **Share & export → Video progression**, add current, public/saved library or imported JSON drills, move stages earlier/later, remove stages and title the film. The film starts each stage with its own intro, then uses its existing choreography. This does not merge the editable animations; practice geometry and branching stay independent. The progression is held in the current editor session for export, not silently saved back to GitHub.

Starter **seed-143 · Defensive line · Whistle then advance together** has the same coach and six-player starting lineup as **seed-133 · Hold the line · Carry or pass?**. The first is a simple non-contact whistle reaction: all six move about two metres in unison, then check their shape. Put seed-143 first and seed-133 second in the video progression for the coaching sequence discussed. U10 free-pass offside/retreat requirements still apply; the coach's whistle is a training cue, not permission to advance illegally.

The code and regression suite guard saved data and film sequencing. Browser export and real-device visual QA are still required before saying every effect is production-perfect.

## Publishing and revision workflow (v0.17.1)

- **Save to GitHub** records a working revision in `data/coach-drills.json`. It does not change public presentations.
- **Publish** is an explicit action available on the saved drill in the editor or GitHub library. It copies that exact saved revision, including editable frames, notes and both decision outcomes, into `data/published-drills.json`.
- **Update public copy** replaces only the published snapshot while keeping its stable `seed-...` ID and existing public presentation URL.
- **Unpublish** hides the public entry and retains the publication snapshot and ID so it can be republished. Deleting the GitHub source is blocked while published.
- The public library and presentation player combine the original starter catalogue with the publication overlay. A failed overlay fetch shows a loading error instead of an out-of-date public drill.
- Legacy links `seed-133` and `seed-143` are retroactively mapped to saved sources `mwlwflvgp8foni` and `mwlws9j9rth2wb` respectively. Older catalogue content remains in Git history.
- Published records show the publication timestamp and source revision when available; a missing historic revision is labelled as legacy, not guessed.
- Publish deliberately, after checking your coaching notes and age-grade rules. A GitHub-saved resource is not automatically a published coaching recommendation.

