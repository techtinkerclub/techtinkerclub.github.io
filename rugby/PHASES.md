# Guided game phases · v0.7.0

Research checked 16 November 2026. England age-grade rules take precedence over generic World Rugby laws. Sources: rfu: https://rfu.freshdesk.com/support/solutions/articles/103000094877-what-are-the-rules-of-play-for-my-childs-age-group-
u10: https://rugbyreferee.net/wp-content/uploads/2026/09/2026-27-u10s-RRNet-RFU-Regulations.pdf
older: https://surreyrugby.co.uk/images/pages/competition_rugby/Age-Grade-Information/AgeGrade%20Variation%20Summary_26_27_vAug2026.pdf
u11: https://rugbyreferee.net/wp-content/uploads/2025/09/25-26-u11s-RRNet-RFU-Regulations.pdf

## Scrum
Law: https://passport.world.rugby/laws-of-the-game/laws-by-number/19-scrum/
Stages: Set packs → Crouch · bind · set → Feed into tunnel → Ball available → Scrum-half collects → Scrum-half distributes
Coach/referee controls engagement. Use trained players; no simulated force, collapse or live technique instruction.

## Maul
Law: https://passport.world.rugby/laws-of-the-game/laws-by-number/16-maul/
Stages: Carrier held upright → Support binds · maul formed → Ball moved to support → Use it · pass away
All remain on feet and bound; never collapse or pull players out. U10 max two per side; play away if forward movement stops.

## Lineout · throw and catch
Law: https://passport.world.rugby/laws-of-the-game/laws-by-number/18-touch-quick-throw-and-lineout/
Stages: Form two lines → Throw in · catch → Secure ball on feet → Distribute
No lifting or opposition contest is animated in this preset. U14 uncontested/no lift; U15 uncontested; U16+ may contest.

## Offload to support
Law: https://passport.world.rugby/laws-of-the-game/laws-by-number/14-tackle/
Stages: Carrier approaches support → Offload to teammate
Pass before grounding in this example. Do not use a forward throw; support stays behind the carrier.

## Free pass restart
Law: https://passport.world.rugby/laws-of-the-game/laws-by-number/20-penalty-and-free-kick/
Stages: Set restart mark → Pass away
Age-grade free pass: pass first, then run; retreat distance and touch mark depend on age.

## Tap restart · free kick / penalty
Law: https://passport.world.rugby/laws-of-the-game/laws-by-number/20-penalty-and-free-kick/
Stages: Set mark → Visible tap → Recover ball → Pass away
Retire required distance. Free kick and penalty options differ; use a free kick only where penalties are not introduced.

## Punt · kick and receive
Law: https://passport.world.rugby/laws-of-the-game/laws-by-number/10-offside-and-onside-in-open-play/
Stages: Kicker ready → Kick in flight → Receive / collect
A schematic kick from hand. Chasers start onside; no contact with airborne receivers.

## Grubber · kick and collect
Law: https://passport.world.rugby/laws-of-the-game/laws-by-number/10-offside-and-onside-in-open-play/
Stages: Kicker ready → Low kick along ground → Collect
Kick from hand; not fly hacking a loose ball. No simulated bounce physics.

## Chip · kick and collect
Law: https://passport.world.rugby/laws-of-the-game/laws-by-number/10-offside-and-onside-in-open-play/
Stages: Kicker ready → Chip over defence → Collect
Kick from hand; keep chasers onside and protect the receiver.

## Cross-field kick
Law: https://passport.world.rugby/laws-of-the-game/laws-by-number/10-offside-and-onside-in-open-play/
Stages: Kicker ready → Cross-field kick → Receive / collect
Schematic flight; coach checks kicking and chasing offside.

## Box kick · from hand
Law: https://passport.world.rugby/laws-of-the-game/laws-by-number/10-offside-and-onside-in-open-play/
Stages: Kicker ready → Box kick → Receive / collect
Schematic kick from hand, not a full breakdown or aerial contest simulation.

## Kick-off / restart kick
Law: https://passport.world.rugby/laws-of-the-game/laws-by-number/12-kick-off-and-restart-kicks/
Stages: Set restart positions → Drop kick → Receiving team collects
Use the centre line for kick-off; kicking teammates remain behind the ball. Distance/receiving options vary by age.

## Try · ground the ball
Law: https://passport.world.rugby/laws-of-the-game/laws-by-number/8-scoring
Stages: Approach designated try line → Ground the ball
The end boundary is treated as the designated try line for this diagram; no automatic scoring judgement.

## Goal kick · attempt
Law: https://passport.world.rugby/laws-of-the-game/laws-by-number/8-scoring
Stages: Set place kick → Kick towards goal
A top-down attempt only; no crossbar, height, points or success judgement. Position the target in line with the intended posts.

Design boundaries: top-down schematic, not collision, lifting, scrum engagement, kicking trajectory height, goals or referee simulation. U11 details should be confirmed against current RFU appendix; the available U11 referee summary was 2025–26. The youngest selected age is used for age gates. Current set-piece guides do not automatically position every non-participant or validate offside. Existing drills remain editable; generated phases are one step at a time.

## Implementation and interface audit

- All guided stages are ordinary editable snapshots. The panel is independent of object selection. Continue in open play creates a new step without deleting the previous stage.
- Removed redundant Present ball shortcut (breakdown dock remains), hidden add-path-point when not applicable, hid irrelevant shield-holder field and duplicate shield-extension buttons, hid Add ball shortcut when no ball exists (palette remains). Raw markers retained for manual editing and compatibility.
- Scrum pack counts: U10 and provisional U11 three, U12 five, U13 six, U14–U16 eight. Source for U11 is prior-season; recheck the latest RFU appendix. Non-participating players are not treated as law-validated. Offside/reference lines are approximate schematic positions; youth limits and human review still apply.
- Animated examples use only selected roles, not full match teams. No dynamic lift, aerial contest, physical kick/bounce, deliberate collapse, officiating or scoring adjudication, or automatic contested-outcome simulation. The lineout preset is deliberately uncontested and unlifted even at ages where more is permitted.
