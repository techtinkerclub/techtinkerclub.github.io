# Marked rugby fields and movable training areas

Added in Rugby Coaching Studio Classic v0.15.0.

## How to use

1. Open **Drill → Full rugby field & training location**.
2. Choose **Place training area on a full marked field**. Existing drills stay in **Training area only** unless you change them.
3. Choose a **U7–U16 or Adult field template**. Templates show maximum match-pitch dimensions, not recommended practice-area dimensions.
4. Set the existing **Training length and width**. The saved routes, people and metres live inside this local area.
5. Choose a location such as **Upper try line**, **5m from left touch**, **Upper 22 m**, or **Halfway**. You can also enter a precise offset or **drag the yellow practice box** in the setup preview.
6. Apply. Use **Fit drill**, **Action** or **Fit pitch** to zoom between the practice and the larger field. Your saved drill positions do not move when zooming.
7. Open a presentation to switch between **Whole pitch** and **Follow the action**; use **+ / − / Fit / Pan** or pinch on a touchscreen. Movies render the selected whole-field/action camera, not temporary manual pan/zoom.

**Position reference:** X is metres from the left touchline. Y is metres from the **upper try line**, so a negative Y lies in the upper in-goal. The practice rectangle must fit inside the field including its two in-goals. Changing only field placement does not alter the physical distance between objects.

## Field templates (RFU 2026/27 age-grade maxima)

| Template | Playing field (metres) | Depicted in-goal at each end |
| --- | --- | --- |
| U7 | 20 × 12 | 5 m |
| U8 | 45 × 22 | 5 m |
| U9 | 60 × 30 | 5 m |
| U10 | 60 × 35 | 5 m |
| U11–U12 | 60 × 43 | 5 m |
| U13 | 90 × 60 | 5 m |
| U14 | 100 × 70 | 5 m |
| U15, U16, Adult | 100 × 70 | 10 m illustrative |

The 10 m in-goal depth on adult templates is a display choice inside World Rugby Law 1's 6–22 m range. The junior 5 m in-goals are based on RFU age-grade appendices. Coaches and referees may agree smaller junior match pitches where safe. These are schematic field templates, not permission to use adult rules, equipment, tackling or lineouts at younger ages.

Junior markings are deliberately simplified: try lines, dead-ball lines, halfway, 5 m field references and posts. Adult/U14 fields add the 22 m and other standard references; U13 also has 22 m references. The white dashes, grass striping and overhead post bases are scalable vector graphics; actual posts remain upright, not drawn lying flat. The 5 m and 15 m touch references and in-goal lines do **not** imply U10 lineouts. U10 touch is restarted with a free pass.

## Existing library examples

- `seed-063`: U10 free-pass touch restart located along the left 5 m reference; there is **no** U10 lineout.
- `seed-061`: U14 lineout exercise positioned by the left touchline, close to the 22 m reference.

## Sources (checked November 2026)

- [RFU Regulation 15 guidance](https://rfu.freshdesk.com/support/solutions/articles/103000094877-what-are-the-rules-of-play-for-my-childs-age-group-)
- [World Rugby Law 1 — ground, lines, posts, flags](https://passport.world.rugby/laws-of-the-game/laws-by-number/1-the-ground/)
- [2026/27 U10 RFU refereeing summary](https://rugbyreferee.net/wp-content/uploads/2026/09/2026-27-u10s-RRNet-RFU-Regulations.pdf)
- [Surrey Rugby 2026/27 age-grade comparison](https://surreyrugby.co.uk/images/pages/competition_rugby/Age-Grade-Information/AgeGrade%20Variation%20Summary_26_27_vAug2026.pdf)
- [RFU age-grade pitch sizes summarised by a grassroots rugby club](https://thatchamrugby.uk/age-groups)

Age-grade laws may change from season to season. Before using a pitch or contact session, consult the current RFU regulation and local safeguarding guidance.

## What this does not yet do

- Photograph-realistic 3D goal structures, real turf satellite imagery or physical site plans.
- Automatically certify every drill action as RFU-legal. A field template only sets spatial references, not legal entitlement.
- Create a training area that can be freely rotated relative to the large rugby field. For now it is aligned to the pitch.
- Synchronise unsaved edits across devices. Saving and presentation still follow the existing GitHub and JSON workflows.
