# Rugby Coaching Studio — quality and usability backlog

Updated 18 November 2026. Scope: Classic Studio editor (desktop and mobile), 143 starter drill resources, read-only library and share/video/print outputs. This is the next-release acceptance plan, not a claim that every item has been finished.

## Baseline and current evidence

- Classic Studio is the primary maintained editor; the public library and mobile workspace reuse its rendering and data model.
- 142 resources: 116 animated drills and 26 written coaching cards with no pitch objects.
- Specific corrections completed: player tackle/recovery lifecycle, short ball presentation, 24 disconnected ruck contest frames, measured free-pass/offside teaching guides, and 14 mismatched large pitch examples.
- Automated regression and a Chromium browser smoke test cover branching and media export. The test has now been expanded with action camera and mobile touch-sized controls. Green CI is necessary but not a sign-off for rugby law accuracy or Safari.
- A separate, opt-in camera now follows the action; it never changes drill size or player geometry.

## Priority A — teaching credibility (open)

1. Watch **every** one of the 116 animated drills in full (not only final stills) with at least these checkpoints: setup, beginning/middle/end of each run or pass, contact start, ball presentation, breakdown, restart and final pose. Record per-drill review results.
2. For ruck/maul/tackle examples, verify spacing *during contact*, arrival direction, possession continuity, immediately fulfilled release duties, correct player poses and transitions. Passing must be judged at release against the chosen attack direction.
3. Revisit all 15 U10 Understanding the Game lessons with current RFU age-grade rules and a qualified coach. Review actual rugby teaching—not just word counts, URL presence or automated coordinate checks. Keep static free-pass/scrum marks true to measured dimensions.
4. Review all 26 written cards. Some team games are better kept as cards; promote only activities where animation materially helps. Explicitly label card vs animation in public lists.
5. Maintain source links and readable natural coaching notes. Don't represent schematic demonstrations as RFU-certified training guidance.

## Priority B — editor workflow (partially implemented, more open)

1. Have a coach who did not build the app create: a run and backwards pass; a simple contact/pad exercise; a two-outcome decision; a whistle cue; and a revised earlier step. Observe without prompting.
2. Preserve reset movement without deleting players, future-route propagation with clear scope, and protected contact actions. Confirm these by browser interaction as well as Node tests.
3. Reduce discovery burden: prefer context-sensitive verbs and useful defaults, with advanced settings remaining available. Remove *only* duplicates after a verified workflow comparison.
4. Avoid conflating manual field lines with automatic offside guides or a decision annotation with an animated two-way branch.

## Priority C — presentation and devices (partially implemented, more open)

1. iPhone Safari (portrait/landscape) and iPadOS Safari: load library, open share, Play/Pause/Seek, switch A/B, drag a player, move waypoint, choose an inspector sheet, save and reopen a drill.
2. Compare **Whole pitch** and **Follow the action** for small breakdown drills, wide offside demonstrations, long passes and kicking. Camera must not crop essential ball release/catch points or guide annotations; use whole pitch where context matters.
3. Export short/long films (landscape/portrait), print coaching sheets, compare displayed poses and ball locations at corresponding timestamps. Browser MediaRecorder and 4K depend on device support and performance.
4. Verify GitHub save error handling, cross-device switching and unsaved edits. No automatic cross-device local-draft syncing is promised.

## Definition of done

A feature is only 'complete' when automated regression passes, its end-user interaction is checked, the presentation and video agree, and rugby-relevant examples are reviewed by a competent age-grade coach. Everything else stays classified as **implemented, not fully verified**.

## Current field-view work (Classic v0.15.0)

- Added age-grade full-field layouts and age-aware pitch references, with an independently sized, positionable custom practice rectangle.
- A local practice route retains its physical metre distances when moved to a marked match-field location; existing plain practice-only drills keep their original view by default.
- Add full-field zoom and user-controlled presentation magnification without altering the authored action. Verify the 16× editor limit and 12× read-only zoom on small mobile screens.
- New published examples: U10 touch free-pass (`seed-063`) and U14 lineout near touch (`seed-061`).
- Work still needed: age-grade law/line verification by a competent coach; check whether lineout and 22m markers are appropriate for each junior format, physical Safari/iPad touch gestures, screenshots of all editor/presentation modes, and output-movie visual equivalence. This is still **implemented, awaiting complete user acceptance**, rather than all 142 drills certified.

## November 2026 implementation — field context and coaching video

- **Implemented:** full marked field layer, selectable age-grade templates, moveable metre-based training area, zoom to drill and action, legacy field mode, decision/option video explanations, and video-only ordered multi-drill progression.
- **New starter:** seed-143, a non-contact whistle-triggered six-defender line advance whose starting positions exactly match seed-133. Editing seed-143 does not alter seed-133.
- **QA still required:** replay full-field editing and drag on physical iOS Safari; visually inspect adult and U7–U14 field marking differences, particularly in-goal and posts; verify audio/whistle playback, readable text pauses at 720/1080/portrait, and all linked-stage films. Browser smoke test cannot replace coaching sign-off.
- **Limits:** One two-way fork per drill, maximum eight drills in a video progression, and maximum six-minute export; the video playlist currently lives only in the editor session. The user must export their editable drills separately to preserve all stages.
