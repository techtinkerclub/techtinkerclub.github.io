# Tech Tinker Club 99 Club Generator

Client-side worksheet generator used by `/tools/99-club/`.

## Files

- `generator.js` - Classic 11-99 presets, rule normalisation, deterministic question generation and balancing across the selected tables/addends.
- `simple-pdf.js` - dependency-free A4 PDF writer using standard PDF fonts and optional JPEG logos.
- `pdf-layout.js` - worksheet/answer-key print layout.
- `app.js` - UI state, personalisation, custom presets, preview, local storage, settings import/export and PDF downloads.
- `99club.css` - responsive app and print-preview styling.

## Adding or changing a built-in Club

Built-in presets live in `CLASSIC_PRESETS` at the top of `generator.js`. Each preset is data-driven. Common properties are:

- `questionCount`
- `mode`: `double`, `repeated_addition`, `multiply`, `divide`, or `mixed`
- `timeMinutes`
- `perfectAttempts`
- `unaided`
- `tables`
- `factorMin` / `factorMax`
- `multiplyPercent` for mixed sheets
- `addendMin` / `addendMax` and `repeatsMin` / `repeatsMax` for repeated addition

Teachers can also edit these rules in the browser and save their own custom presets locally without changing the repository.

## Privacy

No server is used. School/class details, custom presets and the optional school logo are handled in the browser. The logo is resized locally before being used in the preview/PDF.

## Sheet reproducibility

Each generated version has a sheet code derived from its deterministic seed. Equivalent versions use the same base seed with separate variant suffixes. A printed code can be entered in the UI to recreate an untouched generated sheet using the same rules. Exported settings also include the exact current question sets, so manual replacements/shuffles can be transferred exactly.
