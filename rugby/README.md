# Rugby Coaching Studio — Classic v0.14.0 / Coach Edition v0.3.3

Standalone web application for grassroots rugby coaches. No build step or npm dependencies. Serve the repository root with an HTTP server and open /rugby/ or /rugby/coach/.

## Two interchangeable interfaces

- Classic Studio (/rugby/) — full editor and advanced controls.
- Coach Edition (/rugby/coach/) — Harbury-inspired interface and guided actions over the exact same engine.
- Public coaching libraries: /rugby/library.html and /rugby/coach/library.html.
- Read-only players: /rugby/play.html and /rugby/coach/play.html.

Both editors use the same js/app.js, js/scene.js, data model and GitHub store. Develop shared capabilities once, exposing them from both interfaces rather than creating competing code.

## True animated decisions

A drill can now have one two-outcome decision:

1. Open a drill and select the step that should be the shared decision/signal.
2. Click ◆ Add playable decision beside the timeline; in Coach Edition, Add action → Create two playable outcomes is another entry point.
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

Both editors and read-only players share the same signal model, import/export support and rendering code. Older drills without a duration retain a default of 0.5 s.

## Convert a drawn decision into playable actions (v0.14.0)

The old yellow diamond and dotted/curved yellow preview arrows are **annotation only**. They do not make the coach or a player move, and playback does not pause at them without a playable branch.

For an existing drawing, first **pause** the animation and select the step containing the diamond. Select the yellow question-mark diamond, then use **Object → Turn this drawing into playable A + B**. Or click **Make drawn decision playable** beside the timeline. The modal starts with the existing question and the names of the two drawn options.

**Conversion:** The model splits the current action step where the diamond is anchored along the named player's running path, preserving the common setup, whistle and defenders' partial movement. Option A and option B receive separate editable suffix frames. A drawn **run** becomes an actual player running path; a drawn **pass** becomes a real ball transfer if the ball carrier possesses a ball, the arrow reaches a receiving player and the pass is not forward. The old preview lines are cleared to avoid double arrows. Other players continue any existing movements but the app intentionally does **not** invent defender responses or tackles: animate those in each outcome. A single fork with exactly two alternatives is supported; a drawn diamond must have a selected Player. A copy is changed in the editor; nothing is saved back to GitHub until the user explicitly saves it.

After converting, edit Outcome A, use the B button to edit Outcome B, then play from the start. At the fork the app pauses and displays a side-by-side comparison of real paths. Choose either to continue; media and coaching sheets can include both.

## Structure

- index.html and coach/index.html — Classic and Coach UI.
- assets/branching.css — shared branch controls, player and printable headings.
- js/app.js — editor, timeline, playback and GitHub save.
- js/branching.js — shared fork model, branch switching and projections.
- js/scene.js — safe playback data and SVG scenes.
- js/outputs.js, js/movie.js, js/coaching-output.js — share links, movies and coaching documentation.
- js/player.js — branch chooser and read-only player.
- js/github-store.js — saving to data/coach-drills.json.
- data/drills.json — starter catalogue, currently 132 records.
- tests/branching.test.mjs and other tests/*.test.mjs — regression coverage.
- .github/workflows/rugby-qa.yml — continuous tests for Rugby folder changes.

## Safety and development

Run node --test rugby/tests/*.test.mjs from the repository root with Node 22, then inspect editor, player, printed sheets and movie export in a real browser. The GitHub Pages site and repository are public. No identifiable child information should be stored. A noindex tag is not authentication. GitHub credentials for saving are held in the caller's memory and not saved in drills.

Check current RFU age-grade contact rules and safeguarding guidance before use. Schematics and validations are not independent safety approval.
