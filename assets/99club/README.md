# Tech Tinker Club 99 Club Generator

Client-side worksheet generator used by `/tools/99-club/`.

## Current baseline

Version 1.6 is a rule-relevance and portability pass on the frozen v1.5 baseline. Classic/post-99 default worksheet outputs and the PDF engine remain regression-frozen. **Classic 11-99 remains the default** and its deterministic question output is regression-tested against the frozen v1.1/v1.2 baselines. Existing built-in Bronze-Diamond presets are also regression-tested so rule-editor work cannot silently alter their default sheets.

The normal progression shown on first load is still:

`11 -> 22 -> 33 -> 44 -> 55 -> 66 -> 77 -> 88 -> 99`

with the TTC defaults of **5 minutes** and **2 consecutive perfect attempts**. Both remain editable.

## Files

- `generator.js` - Classic presets, optional 11-99 schemes, Bronze-Diamond presets, rule normalisation, reusable question-family generators, deterministic generation and balancing.
- `simple-pdf.js` - dependency-free A4 PDF writer using standard PDF fonts, optional JPEG logos, portrait/landscape page sizes and a standard Symbol-font radical glyph for square roots.
- `pdf-layout.js` - separate portrait and landscape worksheet/answer-key layouts.
- `app.js` - UI state, personalisation, scheme selection, page-layout selection, contextual help, custom presets, exact-sheet browser persistence, portable recreation codes, full backup/restore, settings import/export and PDF downloads.
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



## v1.6 rule relevance and saved-data portability

The advanced editor now hides or locks controls that do not make sense for a named challenge rather than offering flexibility that can silently change what that challenge means.

- **Bronze–Diamond** always use the full 1–12 basic multiplication/division fact set. Their table selector and ordinary factor/quotient controls are therefore hidden.
- **Silver–Diamond** keep the families that define the named challenge as locked core families. Their weights can still be changed and optional extra families can be added/removed. Saving the result as a custom preset creates a fully flexible version.
- Scaled multiplication/division has its own `scaledBaseMin` / `scaledBaseMax`; it no longer borrows the ordinary table factor range.
- Roman numerals have their own maximum value, and simple algebra has independent unknown/coefficient limits. This removes misleading cross-coupling between unrelated controls.
- Existing v1.5 custom data migrates through normalisation: irrelevant old table/factor edits on named advanced challenges are discarded, while an old factor edit is preserved as the scaled range when scaled maths was actually part of that edited challenge.

Browser persistence is also now explicit and portable:

- Exact current worksheet versions (including manual replacements/shuffles) are stored in browser local storage and survive a normal page refresh.
- A **portable recreation code** carries the active rules + seed. When manual question edits/shuffles exist, the exact question set is included. This solves the short-sheet-code limitation for edited/custom rules on another browser.
- A **full browser backup** JSON includes custom presets, per-challenge edits, current exact sheets, personalisation and the current school logo.
- A **current setup** JSON remains available as the smaller one-challenge transfer format.
- Browser storage is local storage, not cookies. It should not be treated as permanent/cloud storage because clearing site data, using private browsing or moving browser/device can remove it.

The short printed sheet code is intentionally unchanged for backward compatibility and PDF regression safety. It remains sufficient for unchanged built-in rules; use the portable recreation code or setup file for edited/custom rules.

## v1.5 help and guidance

The generator now has a three-layer help system without changing worksheet generation:

- a full **Help & guide** page linked from the generator hero;
- selective `?` popovers beside non-obvious options;
- short visible explanations for the trickiest concepts, especially question-family weights and fraction denominator behaviour.

The help explicitly explains that **weight controls frequency, not difficulty**, that selected fraction denominators can generate varied proper numerators (for example denominator 5 can produce 1/5 through 4/5), and how custom percentages, sheet codes, independent challenge edits and settings export/import work.

`generator.js`, `pdf-layout.js` and `simple-pdf.js` are unchanged from v1.4.

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

No server is used. School/class details, custom presets and the optional school logo are handled in the browser. The logo is resized locally before being used in the preview/PDF. Local browser storage is used only for convenience; full backup/restore provides a portable copy independent of that browser.

## Sheet reproducibility

Each generated version has a short sheet code derived from its deterministic seed. Equivalent versions use the same base seed with separate variant suffixes. The short code recreates an untouched generated sheet when the same rules are available. For portability across browsers when rules were edited/custom, v1.6 adds a self-contained recreation code. Current-setup files and full backups also preserve exact manual replacements/shuffles.

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
