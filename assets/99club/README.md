# Tech Tinker Club · 99 Club Studio

Client-side worksheet generator used by `/tools/99-club/`.

## Current baseline

Version 1.7 is the tester-readiness, persistence and reproducibility baseline. The mathematical question-generation paths from v1.6 remain frozen: Classic 11–99 and the built-in Bronze–Diamond presets are regression-checked with fixed seeds so persistence, code and PDF work cannot silently change the maths.

The public app name is **99 Club Studio**. Classic 99 Club remains the default scheme, with the normal progression:

`11 -> 22 -> 33 -> 44 -> 55 -> 66 -> 77 -> 88 -> 99`

and TTC defaults of **5 minutes** and **2 consecutive perfect attempts**. Both remain editable.

## Files

- `generator.js` - Classic presets, optional 11-99 schemes, Bronze-Diamond presets, rule normalisation, reusable question-family generators, deterministic generation and balancing.
- `simple-pdf.js` - dependency-free A4 PDF writer using standard PDF fonts, optional JPEG logos, portrait/landscape page sizes and a standard Symbol-font radical glyph for square roots.
- `pdf-layout.js` - separate portrait and landscape worksheet/answer-key layouts, including optional teacher-only recreation QR rendering.
- `app.js` - UI state, personalisation, scheme selection, page-layout selection, contextual help, custom presets, exact-sheet browser persistence, human-readable/versioned sheet codes, portable recreation codes, teacher QR recreation, full backup/restore, setup import/export and PDF downloads.
- `qr-lite.js` - dependency-free QR encoder used only for local teacher-sheet recreation links.
- `99club.css` - responsive app, contextual help, guide-page and print-preview styling.
- `../../_pages/99-club-help.md` - full Help & guide page at `/tools/99-club/help/`.

## Built-in 11-99 ruleset schemes

`Classic 99 Club` remains the default. Optional schemes are available for schools whose published progression differs:

- `Addition-first`
- `Arithmetic-first`
- `Missing-number progression`
- `Tables-first`

These are content presets, not claims of an official national standard. Public UK school implementations vary. Their published timing/advancement conventions also vary, so the optional schemes intentionally retain TTC's standard 5-minute / two-perfect-attempt defaults unless the user edits them.

## Post-99 challenge presets

The main selector also includes:

- **Bronze** - multiplication and related exact division
- **Silver** - all four operations
- **Gold** - four operations, squares and exact square roots
- **Platinum** - Gold content plus order of operations / brackets
- **Diamond** - Platinum content plus scaled multiplication/division, fractions of quantities and percentages of quantities

Post-99 naming/content is not universal between schools. These are TTC's researched defaults built from common public patterns rather than copies of any school's fixed worksheet. In v1.6 their defining core content is protected: basic multiplication/division uses all 1–12 facts and core families cannot be switched off. Weights, relevant ranges and optional extras remain editable; saving as a custom preset unlocks a fully flexible structure.

## Reusable question families

Mixed mental-arithmetic presets can be composed from:

- addition
- subtraction
- multiplication
- exact division
- missing-number multiplication/division
- squares
- exact square roots
- cubes
- order of operations
- scaled multiplication
- scaled division
- fractions of quantities
- percentages of quantities
- negative numbers
- Roman numerals
- angle facts
- simple algebra

For custom/mixed presets the rule editor can turn families on/off and change their relative weighting. Named Bronze–Diamond challenges show their defining families as locked core content and allow optional extras. Relevant controls are separated by family: arithmetic operand/result limits; tables/factor ranges where table selection is meaningful; missing-number operations/blank positions; square/cube ranges; BODMAS operations/brackets; independent scaled base/scale ranges; fraction denominators/quantity ranges; percentage choices/quantity ranges; Roman-numeral maximum; algebra unknown/coefficient limits; angle totals; time limit and advancement attempts. Family weights show an estimated percentage and estimated number of questions for the current sheet.



## v1.7 saving, backup and reproducibility

99 Club Studio keeps automatic browser storage for convenience, but makes portable saving explicit:

- **Save as reusable preset** stores one reusable ruleset in this browser.
- **Export this setup** downloads only the current challenge, exact worksheet versions and personalisation text as JSON. It deliberately does not include the school logo, other reusable presets or other challenge edits; importing a setup leaves those other browser-saved items untouched.
- **Full browser backup** downloads all Studio data saved in this browser: reusable presets, per-scheme/per-challenge edits, exact current sheets, personalisation and the school logo.
- **Restore full backup** first stores a local pre-restore safety snapshot. **Undo last restore** can swap back if the wrong backup was chosen.
- **Full recreation code** (`TT99R2…`) contains the active rules, seed and a compact exact-sheet recipe for manual replacements/shuffling. New edits are stored as a small replayable action recipe (replace/shuffle actions) so exact recreation does not require embedding a 100-position question permutation. It is portable across browsers and does not depend on a locally saved preset. The school logo is intentionally excluded.
- **Teacher answer-sheet QR** contains a compact `TT99Q1…` recreation payload in the URL fragment (`#q=`). Pupil worksheets never receive the QR. The fragment is processed client-side and is not sent to the web server. Printable QR density is capped deliberately: if a complex legacy/custom payload would be unreliable on paper, the PDF is still produced and Studio reports that the QR was omitted. Newly saved custom presets remember their source challenge so their QR payload can usually remain compact.

### Human-readable sheet codes

New printed codes identify the challenge, worksheet-generation version and variant, for example `C99-G1-7FK2M9-A`. Advanced challenge prefixes include `BRZ`, `SLV`, `GLD`, `PLT` and `DIA`. Edited/custom rules add an `X` marker plus a short functional-rule fingerprint so Studio can refuse to recreate the sheet with the wrong mathematical configuration rather than silently producing different maths. The fingerprint ignores preset names/IDs.

Legacy pre-v1.7 codes are still accepted. Because the old format did not encode the scheme/rule identity, exact historical recreation of an old customised sheet still requires the matching rules/setup.

### v1.6 rule relevance retained

The v1.6 contextual-rule safeguards remain unchanged:

- **Bronze–Diamond** always use the full 1–12 basic multiplication/division fact set; irrelevant table/factor selectors are hidden.
- **Silver–Diamond** keep the families that define the named challenge as locked core families. Their weights can be changed and optional extra families can be added/removed. Saving as a custom preset creates a fully flexible version.
- Scaled multiplication/division has independent base/scale ranges; Roman numerals and simple algebra have their own family-specific ranges instead of borrowing ordinary table/arithmetic controls.

## v1.5 help and guidance

The generator now has a three-layer help system without changing worksheet generation:

- a full **Help & guide** page linked from the generator hero;
- selective `?` popovers beside non-obvious options;
- short visible explanations for the trickiest concepts, especially question-family weights and fraction denominator behaviour.

The help explicitly explains that **weight controls frequency, not difficulty**, that selected fraction denominators can generate varied proper numerators (for example denominator 5 can produce 1/5 through 4/5), and how custom percentages, sheet codes, independent challenge edits and settings export/import work.

At the v1.5 help-only baseline, the maths and PDF-generation paths were intentionally left unchanged; later versions retain the same frozen maths core while adding contextual rules, persistence and teacher-copy QR recreation.

## v1.4 fraction and percentage controls

The advanced fraction editor exposes every standard denominator from **2 to 12**, including 7, 9 and 11, while leaving existing preset selections unchanged. Teachers can also enter additional whole-number denominators from 2 to 100 as a comma-separated list.

Percentage choices expose every **5% step from 5% to 100%**. Existing presets keep their previous selected values, and teachers can add other whole-number percentages from 1% to 100% with a comma-separated custom field (for example `37%, 42%, 67%`). Percentage-of-quantity generation continues to keep whole-number answers by pairing selected percentages with suitable quantities.

These controls are additive only: built-in Classic and Bronze-Diamond fixed-seed outputs remain unchanged unless a teacher explicitly selects one of the new choices.

## v1.3 independent rule state

Rule edits are remembered independently for each **scheme + challenge** combination. For example, editing Classic Gold does not alter Classic Silver, and editing Addition-first 33 Club does not alter Classic 33 Club. The challenge cards mark edited combinations, and the editor provides both **Reset this challenge** and **Reset scheme** controls. Settings export/import preserves these independent overrides.

The page workflow is intentionally ordered as:

1. Personalise the sheet
2. Choose the challenge
3. Check / edit rules
4. Generate and download

The generator warns when a custom rule combination is too restrictive to create the requested number of unique questions and disables PDF downloads until the rules are made valid.

## Adding or changing a built-in Club

Classic presets live in `CLASSIC_PRESETS`; post-99 presets live in `CHALLENGE_PRESETS`; alternative progressions live in `SCHEME_PRESETS` at the top of `generator.js`. Presets are data-driven rather than separate hard-coded worksheet functions.

Teachers can also edit rules in the browser and save their own custom presets locally without changing the repository.

## Privacy

No application server is used for worksheet generation or storage. School/class details, custom presets and the optional school logo are handled in the browser. The logo is resized locally before being used in the preview/PDF. Local browser storage is a convenience layer only; full backup/restore provides a portable copy independent of that browser. Teacher QR recreation data is placed in the URL fragment so it is not sent to the website server.

## Sheet reproducibility

Each generated version has a human-readable, generation-versioned sheet code. Unedited built-in sheets can be recreated directly from that short code. Edited/custom codes carry a rule fingerprint and Studio refuses to recreate them when the matching rules are unavailable. For complete portability, use the self-contained Full recreation code or the teacher-copy QR; setup files and full backups also preserve exact manual replacements/shuffles. The generation version is kept separate from the app release version so future UI changes do not silently redefine historical worksheet codes.

## Page layouts

Portrait is the default and keeps the familiar three-column dense-sheet format. Landscape is a separate layout, not a rotated portrait page: dense sheets use four columns and larger working text. Switching orientation never changes the question seed, question order or sheet code. The selected orientation is saved in browser settings and exported/imported with the generator settings.

## Regression rule

Do not rewrite or route the existing Classic generation paths through the newer mixed-family engine. The frozen Classic outputs are used as exact regression fixtures so future feature work cannot silently change existing 11-99 sheets. Built-in Bronze-Diamond presets are also checked with fixed seeds and representative portrait/landscape PDFs before a new baseline is accepted.

## Public source basis for optional presets

These URLs are maintenance references for the *rule patterns only*. The generator does not copy or redistribute the schools' fixed worksheet content.

- Classic 11-99 progression: `https://www.aloeric.wilts.sch.uk/policies-1/curriculum/curriculum-subjects/maths/the-99-club`
- Addition-first and Bronze/Gold/Platinum descriptions: `https://www.holyportprimaryschool.co.uk/holyports-99-club/`
- Arithmetic-first / Bronze-Silver-Gold-Diamond branch: `https://pencoys.croftymat.org/the-99-club/`
- Missing-number 99 progression: `https://www.wantageprimaryacademy.org.uk/99-club`
- Tables-first progression: `https://www.thewillowsprimary.org/maths`
- Optional advanced-Platinum families (negative numbers, Roman numerals, degrees/angles, BIDMAS and algebra): `https://www.bosburyprimaryschool.co.uk/News/The-Platinum-Club-is-Here/` and `https://www.tredworth-jun.gloucs.sch.uk/maths-1/`

Because these public schemes disagree with one another, TTC presents them as optional presets rather than as an "official" standard.
