# Rugby Coaching Studio — Library and animation review
**Review date:** 21 November 2026  
**Release target:** v0.20.86  
**Scope:** Both editor and public library, user-saved coach drills, published overrides, test fixtures, and all showcase films.

## 1. What was inspected
- **143** built-in starter drills in `data/drills.json`, including 7 intentionally non-animated coaching cards.
- **6** published override/addition records in `data/published-drills.json`. Two override older built-in seed IDs (`seed-133`, `seed-143`); four are distinct published additions.
- **10** separately saved editable coach drills in `data/coach-drills.json`.
- **8** short showcases in `data/showcase-drills.json` and **3** full-pitch U10 match showcases in `data/u10-match-showcases.json`.
- **20** permanent visual regression fixtures in `data/test-drills.json` (intentionally public under **Test drills**).

**Total: 190 stored records across six files.** The effective shared starter/public catalogue is **178 unique resources** (143 starters + 4 published additions + 8 showcases + 3 U10 matches + 20 test fixtures). The editor also loads 10 user-saved coach drills separately when connected. All 190 stored records have a machine-readable row in [the full audit](../data/library-quality-audit-2026-11-21.json).

The audit parsed all authored frames and their alternatives. It checked object IDs, ball ownership, age ranges, stage lengths, movement speeds (using actual pitch metres), time-window percentages, ball possession changes, contact markers, cue durations and publication relationships. Flagged sequences were examined against their objectives, notes, equipment and skill limitations. This is a **static content and code-based review**, supplemented by the recent actual exported showcase video comparison; it is not a claim that all 178 public drills have been manually re-recorded and played from start to finish.

## 2. Showcase changes — priority completed

**Full-match U10 showcases:**

| ID | Match | Old animation | New animation | Rationale |
|---|---|---:|---:|---|
| `seed-970` | Two rucks, wide try | 49.89 s | 43.63 s | Shorter pass/release transitions; keep real running distance and contact readability |
| `seed-971` | Decision match: wide or inside | 46.29 s | 40.31 s (default A branch) | Consistent early passes, pickup tempo and both authored A/B continuations |
| `seed-972` | Patient phases, central try | 43.85 s | 41.32 s | Better distinction between carries, tackle, release, ruck, contest, pickup and grounding |

**All eight shorter showcases** were examined and repaced where warranted. Short handling films now use separately timed ball-flight intervals rather than animating passes over an entire stage. Their total sequences remain approximately 10–15 seconds and preserve deliberate teaching pauses. Edited annotations also have readable display windows rather than rapid flashes. The user-authored positions, actual U10 field dimensions and number of players were not changed.

Implementation: the original editable `frames[].seconds`, `frames[].timing` and `frames[].callouts` fields are updated in the JSON packs, not injected into the video renderer. Therefore public presentation, Classic editor playback, Ruckus video, and new exports all read the **same authored movement timing**. For branching films, the `branching.choices` data and its flattened default A route were synchronised.

**Important nuance:** A player changing position only a metre or two in a long stage is often a supporting/background movement, not a player who needs sprint timing. These were not automatically accelerated.

## 3. Older library corrections — completed

| Drill | Verified problem | Correction |
|---|---|---|
| `seed-013` Diamond Passing | Follow-run could require a ~8 m/s burst within a short timing window | Give each pass-and-follow stage 3.0 s; retain the separate pass and delayed follow |
| `seed-011` L-shaped Passing | Receiver ahead of the turned ball carrier could depict an illegal forward pass | Keep receiving player behind the turned carrier in **every** stage and explain that arrangement |
| `seed-014` Two-ball End Ball | A modified scoring-zone forward pass could be mistaken for legal rugby passing | Label it explicitly as a **modified non-match game** in instructions, coaching and animation note |
| `seed-037` Ruck and Roll | Ground presentation was ~1.62 m from the carrier, too far to demonstrate placing within reach | Move the presentation to about 1 m behind the stationary carrier |
| `seed-047` Counter-attack Game | Reset forced a defender to move ~6.9 m/s immediately after a touch | Lengthen/reset stage to 2.2 s and clarify deliberate regrouping |
| `seed-079` U10 Turnover and Counter-attack | One-direction ATTACK arrow was misleading when possession reverses | Turn off the single-direction arrow for this bidirectional drill |
| `seed-086` U10 free-pass after touch | Apparent forward pass warning despite orange team now attacking down the pitch | Preserve the legal positions; explicitly clarify why the pass travels backwards for orange |
| `seed-143` Defensive line whistle | Final 0.8-second stop too quick to review connected defence | Extend final hold to 2.1 s in starter, saved and published copies |
| Saved Tag removal and pass | The direction arrow opposed the actual attacking run and backwards pass | Set attack direction down and explain the receiving support line |
| Saved/public U10 Tackle, secure and go again (`seed-921`) | A formed ruck marker persisted into the ball-pickup step | Remove the ruck marker from the pickup frame; synchronise its editor source and published copy |
| Saved Defender clear-out over bag | Ball received a new owner during an active contested ruck | Add a distinct **ball clear → pickup** step between contest and pass away |
| Saved/public 3 vs 2 to try (`seed-923`) | Final TRY review too short | Extend last celebration/coaching hold to 2.5 s without altering the published customised geometry |

Additionally, the shared playback engine now hides any outgoing ruck marker when the subsequently timed pickup has completed. This avoids a false picture of live possession while a ruck is still formed, without modifying player movements or the Classic/Ruckus rendering styles.

## 4. Data quality and physical timing results

- **No** duplicate IDs within the respective packs and **no** missing ball owners in examined frames.
- **No** invalid positive animation-step durations and **no** blank step narration.
- **171** possession-to-possession pass transitions reviewed; **none lack separately authored pass-flight timing** in the updated packs.
- **No** player motion over the audit's 7 m/s warning threshold after the corrections. This is a rough speed check based on pitch endpoints and timing windows, *not* a biomechanical speed limit.
- **18** remaining slow player-movement flags (generally waiting, support drift, formation, or intentionally coached walking). These should not be automatically shortened.
- The U10 full-match showcase pack preserves **8 v 8**, a **60 × 35 m** field, one arriving ruck player per team, a distinct controlled tackle/release/present/contest progression, and grounding to score.

## 5. Editor/public relationship checked

The main editor (`index.html`), Coach Edition (`coach/index.html`), public library (`library.html`), read-only player and video export share the same JS catalogue/scene. The Coach Edition had much older module cache query strings; these are now bumped alongside all entry points to avoid stale files when the new JSON is deployed.

Publication links and IDs have **not** been reassigned. In `published-drills.json`, source-linked coaching copies are kept consistent where their frames were changed; `seed-923` is a deliberate independently customised published derivative, so its saved-source geometry was not blindly copied across.

The **Test drills** category remains available in both libraries, as requested previously. Its 20 entries are regression demonstrations, not recommended match-training session plans.

## 6. Work requiring editorial judgment (not silently rewritten)

1. **Seven static coaching cards** — Animal Walks Relay (`seed-004`), Balance Challenge (`007`), Jump and Land (`008`), Controlled Tackle Progression (`027`), Side-on Tackle (`028`), Rugby Tennis (`044`), Lineout End Ball (`045`). They were not made into misleading or potentially unsafe animations automatically. If animated, each needs an authored step-by-step teaching sequence.
2. **Age and context** — drills explicitly presented as touch, tag, non-contact or modified games must not automatically be described as U10 match-law demonstrations. The Diamond/Circle/Memory passing patterns are handling activities; a positional “forward” heuristic must not label them illegal match passes without context.
3. **High-speed showcase versus teaching** — match animations are explanatory diagrams, not collision-speed technique instruction. Contact stages retain supervision/qualified-coach warnings.
4. **Existing QA debt** — the overall legacy test suite contains pre-existing failures across annotations/coach-mode UI, data expectations and editorial assets. They are distinct from the newly added content regression checks. A green content review is not a claim that all earlier browser/viewer or snapshot tests are fixed.

## 7. Regression coverage

Added `tests/library-content-review.test.mjs` to check six file families, ball owners and IDs, showcase flight/callout timing, the corrected handling examples, contact pickup transitions and saved/public sync.

Updated an existing U10 contact test to expect the ruck to end at pickup. Corrected two unrelated but faulty rule tests which measured a five-metre scrum from an arbitrary coordinate instead of the actual try line, and scored a grounding by an arbitrary `y < 100` threshold instead of the actual marked goal line. These test corrections **did not alter the legitimate scoring or held-up examples**.

## 8. Follow-up checks after release

Verify the same showcase in the main editor and public read-only playback with Follow Action at 1080p; compare pass flight, ground/pickup and coaching cue readability. In the library, open the corrected Diamond Passing, L-shaped Passing, Ruck and Roll, U10 turnover, and published U10 tackle sequence. Ensure both Coach Edition and Classic/Ruckus play from the new catalogue without cached old versions. Keep the broad QA baseline outstanding failures separately tracked rather than hiding them.
