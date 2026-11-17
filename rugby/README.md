# Rugby Coaching Studio — Classic v0.13.0 / Coach Edition v0.3.0

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
