# 99 Club Studio v1.29.2

## Vocabulary & Language crossword browser hotfix

This release fixes a browser-preview regression introduced by the final v1.29.1 crossword containment override.

The crossword grid was being forced to the full activity height. On rectangular crosswords that made the CSS row tracks taller than the column tracks; individual cells stayed square, so Down answers appeared as separated boxes even though the generated crossword itself was connected correctly.

The browser grid now keeps the crossword's real width:height ratio and sizes from width rather than stretching to the activity height. Across and Down cells therefore meet as a single crossword grid.

The direct PDF renderer was not affected by this browser CSS bug.

The patch is cumulative with v1.29.1 and is safe to apply over either v1.29.0 or v1.29.1.
