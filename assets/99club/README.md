# Tech Tinker Club · 99 Club Studio

Client-side worksheet generator used by `/tools/99-club/`.

## Current baseline

Version **1.17** refines the curriculum-aware **Custom Worksheet** workflow, removes the provisional contextual story-problem family, and adds optional teacher notes to answer sheets while preserving the regression-frozen 99 Club maths paths. The app now has two distinct uses:

1. **99 Club progression** — Classic 11–99, optional alternative progressions, and Bronze–Diamond challenge presets.
2. **Custom Worksheet** — neutral starter/quiz/homework/retrieval sheets built by choosing curriculum topics, relative weights, question count and an optional time limit.

The public app name remains **99 Club Studio**. Classic 99 Club remains the default progression:

`11 -> 22 -> 33 -> 44 -> 55 -> 66 -> 77 -> 88 -> 99`

The TTC Classic default is **5 minutes** and **3 perfect attempts that do not need to be consecutive**. Both remain editable. Alternative published-school presets keep their own defaults unless edited.

### v1.17 Custom Worksheet, direct-maths scope and teacher notes

- Custom Worksheet is **not a Club level**: no 11/22/33 etc. label, no advancement rule and no Club achievement badge on the pupil sheet.
- Teachers can set a worksheet title, choose **1–200 questions**, make the sheet timed or untimed, select any available topic families, and set relative topic weights.
- Quick-picks are provided for **Years 1–6** plus a Core 4 Operations option. The quick-picks use year-aware ranges/question forms, including decimals capped at **2 d.p. in Year 4** and **3 d.p. in Years 5–6**.
- Topic selection is grouped into collapsible curriculum strands. Large selections keep the weight editor collapsed by default so Year 5/6 quick-picks remain usable rather than producing a huge wall of controls.
- The direct-maths engine covers statutory content that can be represented honestly as numerical questions or concise mathematical prompts without requiring a diagram, clock face, chart, measured drawing or practical representation. Examples include `Round 673 to the nearest 100` and `What is the value of 6 in 678?`.
- The provisional contextual/story word-problem family has been removed from all teacher selectors and Year quick-picks. Proper word problems will be designed separately with a richer, structured language/context engine rather than a handful of repeated templates.
- Teachers can add an optional **240-character teacher note**. It is printed only at the end of answer sheets, never on pupil worksheets. It is saved in browser state, setup files, full backups and Full recreation codes, but omitted from the compact QR so note text cannot make the QR unnecessarily dense.
- Exact square roots and non-standard rounding remain clearly marked as **Extension** rather than appearing in statutory Year quick-picks.
- Full scope and deliberately deferred graphical objectives are documented in [`CURRICULUM_COVERAGE.md`](CURRICULUM_COVERAGE.md).
- New open-worksheet arithmetic uses deterministic sampled pools for large ranges. This avoids the quadratic memory/time cost of exhaustively constructing e.g. every addition pair to 5,000 while keeping the named 99 Club generation paths untouched.
- Saved Custom Worksheet presets retain their non-progression behaviour when reopened.
- Custom Worksheet PDFs use adaptive column counts and two-line wrapping for genuinely long curriculum prompts. This keeps starters/homework readable without changing the legacy Club column thresholds.
- PDF text fallbacks now preserve common mathematical arrows, minus signs and approximate-equality notation when using the dependency-free standard-font PDF writer.
- Year-aware refinements include Year 3 fraction comparison/addition constraints, Year 6 mixed-number fraction calculations and decimal division, Year 6-only formal angle-sum/cuboid-volume text families, and tighter age-sensitive geometry/measurement variants.

### Regression status for v1.17

The pre-Custom-Worksheet generator and the v1.17 line were compared with fixed seeds across every built-in Classic/alternative 11–99 preset and Bronze–Diamond preset. Existing generated question sequences remain identical. New curriculum families are appended to the family catalogue so historical compact family indices do not shift.

## v1.17 release QA

Before packaging this baseline:

- every one of the **106 active** registered question families was smoke-tested for a non-empty pool and reproducible generation;
- full Year 1–6 Custom Worksheet quick-picks generated 60-question samples without errors (22/33/41/55/65/90 selected families respectively);
- Year 1 and Year 6 quick-picks were exercised in a headless Chromium render with no JavaScript page errors;
- Custom Worksheet portrait and landscape PDFs were rendered and visually checked, including long wrapped text prompts and answer pages;
- a representative Classic 33 Club PDF was rendered after the PDF-layout changes;
- fixed-seed regression comparison against the supplied pre-Custom-Worksheet generator reported **0 differences** across every built-in Classic/alternative 11–99 preset and Bronze–Diamond preset.

A local full Jekyll build is still expected as part of deployment/CI. The development container used for this QA did not provide the project Bundler toolchain, so the release checks above focus on the 99 Club JavaScript/browser/PDF subsystem.

## v1.11 preview/PDF parity and mobile review

- The browser preview is now generated by `pdf-layout.js` through an SVG page adapter that implements the same `text`, `line`, `rect`, `image` and QR drawing calls as the PDF page writer. Header positions, teacher QR panel, question rows/columns and footer therefore share one geometry path.
- The PDF writer itself is unchanged by this release. Representative v1.10/v1.11 portrait/landscape, QR/no-QR PDFs are byte-for-byte identical.
- Preview-only review controls are added as an SVG overlay and are not emitted to PDFs. Replacing a question still uses the v1.8 same-family logic.
- On narrow/touch screens the A4 page no longer reflows or compresses its internal layout. Portrait previews use a readable fixed page width and landscape previews a wider fixed width inside a horizontal scroller, with a visible swipe hint.
- The compact no-QR teacher-panel fallback from v1.10 is retained unchanged.

## v1.10 badge header and compact recreation

- Every built-in 11–99 and Bronze–Diamond sheet uses its matching image from `assets/99club/images/` in the top-right of the worksheet header. The large repeated text title is removed; the badge itself identifies the level.
- School identity remains at the left and `MENTAL MATHS CHALLENGE` remains the neutral centre heading. Answer sheets use a restrained `ANSWER KEY` heading with the same challenge badge.
- If an answer-sheet QR cannot be produced, the teacher information panel collapses to a compact strip instead of leaving a large empty box.
- Recreation recipes are derived from the **final worksheet state**, not the review action history. Base-sheet questions use numeric positions; replaced questions use compact `(position, family, pool-index)` references.
- New portable codes use `TT99R3…`; new teacher QR payloads use `TT99Q2…`. Studio still reads legacy `TT99R1`, `TT99R2` and `TT99Q1` data.
- `GENERATION_VERSION` remains `G1` because the built-in question generation algorithm and fixed-seed outputs are unchanged.


## v1.8 review behaviour

- The preview replacement button always chooses another question from the **same mathematical family** as the question being replaced.
- Superseded replacements are collapsed to the latest choice at that position. New replacement recipes store only compact question keys (not full discarded prompts/answers), while shuffles use compact replay tokens; this prevents repeated review clicks from steadily inflating the teacher QR.
- Browser persistence and backups still retain the exact current questions. Earlier action-based recreation payloads remain readable for backward compatibility.
- Base question text is larger in portrait and landscape. Long advanced prompts are fitted down individually rather than forcing every question on the sheet to use a smaller font.
- The public Help page is written for teachers around practical workflows (make, review, save, share, recover, recreate), while this README remains the maintainer-facing technical reference.

## Files

- `generator.js` - Classic presets, optional 11-99 schemes, Bronze-Diamond presets, rule normalisation, reusable question-family generators, deterministic generation and balancing.
- `simple-pdf.js` - dependency-free A4 PDF writer using standard PDF fonts, multiple optional JPEG image XObjects (school logo + achievement badge), portrait/landscape page sizes and a standard Symbol-font radical glyph for square roots.
- `pdf-layout.js` - separate portrait and landscape worksheet/answer-key layouts, including optional teacher-only recreation QR rendering and optional answer-sheet teacher notes.
- `app.js` - UI state, personalisation, scheme selection, page-layout selection, contextual help, custom presets, exact-sheet browser persistence, human-readable/versioned sheet codes, portable recreation codes, teacher QR recreation, full backup/restore, setup import/export and PDF downloads.
- `qr-lite.js` - dependency-free QR encoder used only for local teacher-sheet recreation links.
- `99club.css` - responsive app, contextual help, guide-page and print-preview styling.
- `../../_pages/99-club-help.md` - full Help & guide page at `/tools/99-club/help/`.
- `CURRICULUM_COVERAGE.md` - statutory text-only coverage audit, Year 1–6 quick-pick scope, and graphical/practical objectives deliberately deferred.
- `RELEASE_NOTES_1.17.md` - current public-beta release summary and QA record.
- `RELEASE_NOTES_1.16.md` - previous Custom Worksheet baseline notes.
- `tests/smoke.js` - dependency-free Node smoke checks for every family, Year quick-picks, Classic progression defaults and PDF-layout invariants. Run with `node assets/99club/tests/smoke.js`.

## Built-in 11-99 ruleset schemes

`Classic 99 Club` remains the default. Optional schemes are available for schools whose published progression differs:

- `Addition-first`
- `Arithmetic-first`
- `Missing-number progression`
- `Tables-first`

These are content presets, not claims of an official national standard. Public UK school implementations vary. Their published timing/advancement conventions also vary. The Classic scheme now uses a 5-minute / three-perfect-attempt default with no consecutive requirement; the optional alternative schemes retain their previous 5-minute / two-consecutive-perfect-attempt defaults unless the user edits them.

## Post-99 challenge presets

The main selector also includes:

- **Bronze** - multiplication and related exact division
- **Silver** - all four operations
- **Gold** - four operations, squares and exact square roots
- **Platinum** - Gold content plus order of operations / brackets
- **Diamond** - Platinum content plus scaled multiplication/division, fractions of quantities and percentages of quantities

Post-99 naming/content is not universal between schools. These are TTC's researched defaults built from common public patterns rather than copies of any school's fixed worksheet. In v1.6 their defining core content is protected: basic multiplication/division uses all 1–12 facts and core families cannot be switched off. Weights, relevant ranges and optional extras remain editable; saving as a custom preset unlocks a fully flexible structure.

## Reusable question families

The family catalogue is now intentionally broader than the original 99 Club challenge set. Custom Worksheet groups families under:

- **Number & place value** — counting/sequences, number words, place value, comparison, rounding, more/less, partitioning, negative-number progression and powers of 10;
- **Number properties** — odd/even, factors, multiples, factor pairs, common factors/multiples, primes, square/cube numbers;
- **Calculation** — addition/subtraction, number bonds, three addends, multiplication/division facts, inverse/commutative fact families, missing numbers, multi-digit calculation, remainders, long division, estimation, distributive/correspondence reasoning, order of operations and direct mathematical prompts;
- **Fractions** — fractions of quantities, equivalence, comparison, sequences, simplification, mixed/improper conversion, addition/subtraction, multiplication and division;
- **Decimals & percentages** — place value/comparison/rounding, ×/÷ by powers of 10, decimal calculation, decimal↔fraction and fraction↔decimal conversion, FDP equivalence, percentages of quantities and percentage comparison;
- **Ratio & proportion** — equivalent ratios, unequal sharing, scale factors and unit rates;
- **Measurement** — unit choice/comparison/conversion, money, time/calendar, perimeter/area/volume, triangle/parallelogram area, missing measures, temperatures and area/perimeter relationships;
- **Geometry** — text-based shape/line/angle properties, turns/position language, coordinate translations and coordinate reflections;
- **Algebra** — missing-value algebra, formula substitution, linear sequences and pairs satisfying equations;
- **Statistics** — text-data interpretation, pie-chart angle groundwork and mean;
- **Extension** — square roots and non-standard rounding.

For Custom Worksheet the rule editor can turn topics on/off and change their relative weighting. **Weight controls frequency, not difficulty.** Named Bronze–Diamond challenges continue to show their defining families as locked core content with optional extras.

See [`CURRICULUM_COVERAGE.md`](CURRICULUM_COVERAGE.md) for the complete family/year table and the list of objectives that remain intentionally visual.

## v1.7 saving, backup and reproducibility

99 Club Studio keeps automatic browser storage for convenience, but makes portable saving explicit:

- **Save as reusable preset** stores one reusable ruleset in this browser.
- **Export this setup** downloads only the current challenge, exact worksheet versions and personalisation text as JSON. It deliberately does not include the school logo, other reusable presets or other challenge edits; importing a setup leaves those other browser-saved items untouched.
- **Full browser backup** downloads all Studio data saved in this browser: reusable presets, per-scheme/per-challenge edits, exact current sheets, personalisation and the school logo.
- **Restore full backup** first stores a local pre-restore safety snapshot. **Undo last restore** can swap back if the wrong backup was chosen.
- **Full recreation code** (`TT99R3…`) contains the active rules, seed and a compact exact-sheet recipe derived from the final reviewed worksheet. It is portable across browsers and does not depend on a locally saved preset. The school logo is intentionally excluded. Older `TT99R1…` and `TT99R2…` codes remain readable.
- **Teacher answer-sheet QR** contains a compact `TT99Q2…` recreation payload in the URL fragment (`#q=`). Replacements are stored as numeric references to the final question pool rather than long prompt/key strings, and shuffling is represented by final worksheet order. Pupil worksheets never receive the QR. The fragment is processed client-side and is not sent to the web server. Printable QR density is still capped deliberately; legacy `TT99Q1…` codes remain readable.

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
