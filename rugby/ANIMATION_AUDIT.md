# Rugby Coaching Studio — Animation and teaching-drill review

Reviewed: 17 November 2026. This is the shared Classic, Coach, read-only player and movie/print renderer. The starter library contained 142 drills at review.

## Findings, changes and limitations

| Area | Finding | Correction or safeguard |
|---|---|---|
| Player tackle | The tackler looked upright until the animation finished. | Authored player-on-player tackle now uses a ready-to-wrap approach, tackling pose at contact and grounded carrier pose. No tackle is invented without a marker. |
| Recovery | Copied recovery poses persisted, leaving players sliding or still grounded when moving away. | Transitional poses normalise to standing on later steps unless deliberately pinned or still in an active contact formation. |
| Ball placement | Presenting the ball resembled a long throw. | Presentation now follows the grounded player before a short eased placement. Outlier spots were reduced; A2 collects nearby. |
| Timing | Some movement sequences ran unnaturally fast. | Teaching drills have revised stage times. Editor checker warns for more than 8.5 m/s of schematic movement. |
| Ruck offside | Key teaching guides were not displayed unless turned on. | Coloured guide lines appear by default in the U10 offside example, then disappear when the ball leaves. |
| Restart | U10 free-pass mark was not really 5 metres in. | Right touch free-pass mark is now positioned 5 m inside; opponents shown at least 7 m back. |
| Try/held up | In-goal was mentioned but no try line shown. | Marked try line and shaded in-goal region now distinguish carrying, grounding and a held-up ball. |
| Rugby explanations | U10 lessons had generic cards or lacked useful questions. | All 15 U10 Understand the Game lessons now have contextual instructions, key questions, safety notes and specific examples. |

## Whole-library audit

A full static scan of starter data checked object IDs, ownership links, presentation reach, note completeness, timings, movement speed and final poses. Library-wide regression tests now protect these properties as the collection grows. The controlled-placement heuristic uses 1.35 m from the grounded player as an alert threshold; this is **not a rugby-law limit**.

Two drills, seed-078 and seed-081, intentionally finish with a grounded player in a still-active or frozen breakdown. Automatically standing those players up would alter the meaning of the final teaching frame.

Relevant Node tests: tackle-pose-lifecycle.test.mjs, understanding-game-quality.test.mjs, understanding-game-expanded.test.mjs and library-motion-audit.test.mjs. Run from the repository root with:

    node --test rugby/tests/*.test.mjs

## Safety and completeness

Animation is schematic, not a physical tackle simulation or a technique model. Player-on-player contact requires appropriate qualified coaching; players must release and make the ball available immediately after a completed tackle. A short ball placement is separate from an animated rugby pass.

Rules and safety references:
- https://help.rfu.com/support/solutions/articles/103000094877-what-are-the-rules-of-play-for-my-childs-age-group-
- https://passport.world.rugby/laws-of-the-game/laws-by-number/14-tackle/
- https://passport.world.rugby/laws-of-the-game/laws-by-number/11-knock-forward-or-throw-forward/
- https://help.rfu.com/support/solutions/articles/103000390646-how-is-a-match-restarted-in-the-age-grade-game-if-an-attacking-player-is-held-up-in-goal-

The source and data changes are committed to GitHub. The repository tests have been added but **an actual Safari/Chrome visual replay and exported-video comparison of all 142 drills has not been completed**. Static validation alone is not an independent rugby-law, safeguarding or electrical-like safety sign-off. Visual QA is still required before representing every drill as production-perfect.

## Further geometry review — 17 November 2026

The first audit checked membership and movement speed but missed the distance between opposing players in an already formed ruck. On rechecking the complete 142-drill starter catalogue, 24 stages across seven ruck demonstrations had the on-feet contesting players positioned 1.14–1.26 m apart (centre to centre). Saved participant pairs have been brought to approximately 0.43 m, and future presets were made closer. The editor checker and new regression test now check a 0.65 m maximum centre-to-centre separation in formed non-pad rucks. This is a visual teaching-diagram heuristic, not a rugby law or a physical tackling/binding coaching instruction.

Fourteen generic 60 × 35 m starter drill pitches were reduced according to the type of action, retaining space for kicking and moving short-range passing demonstrations into the middle of their pitches. Measured lesson-specific distances in other drills were preserved. Visual replay and cross-device/video verification are still required before treating this as a finished quality review.

## Framing and workflow regression additions — 18 November 2026

A new view-only action camera uses authored player, ball and contact movement to choose a tighter presentation frame. It retains physical pitch dimensions and includes measured guides. Steps discussing waiting or offside preserve their wider participants, and the whole pitch remains selectable. The same renderer is used for videos and printable views. This is a framing convenience, not a claim about the correctness of any displayed rugby situation.

Editor regression checks now cover returning a player to the prior step on movement deletion, propagating routes through later stages, stopping at an explicitly authored run, and protecting contact-linked positions. The mobile Chromium smoke test exercises touch-sized navigation and play, but is not equivalent to real Safari testing.

Remaining work: review the entire 116-animated-drill set at multiple timestamps, evaluate which of the 26 written-only cards merit animation, compare video outputs at multiple aspect ratios, test iOS Safari/iPadOS, and obtain qualified U10 contact/age-grade coaching feedback. See QUALITY_BACKLOG.md.

## Teaching-stage semantic corrections — 18 November 2026

Two older short U10 resources were identified with narration/animation mismatches and repaired. In seed-062, the carrier and receiver previously stayed stationary during an alleged approach; they now both move and the ball remains visibly attached until the backwards pass, followed by support continuation. In seed-063, a seven-metre defensive retreat had no defenders on screen; it now shows a measured five-metre-in-from-touch restart mark, two actual retreating opponents, a backward pass with stationary players, and open play beginning afterwards. A dedicated regression checks the measured metres and movement order. These fixes do not constitute a full visual review of all other catalogue scenes.

## Whistle-only defensive line / coaching video progression (18 November 2026)

A simple precursor, seed-143, uses the **same six-defender starting geometry as seed-133**. All defenders advance approximately 2.24 m together on the coach's whistle, then stop for a spacing/communication check. This is **non-contact** and does not imply permission to rush a U10 free pass without the required retreat. The decision starter seed-133 now contains authored explanation and focus prompts for the common decision and each option.

The new movie storyboard puts a static labelled pause at the decision and before each outcome. An ordered progression joins drills in the exported film but does not conflate their editable timelines. New tests check the authoring metadata, timing, source preservation, sequence ordering and browser controls. Visual validation of final encoded text remains to be completed.
