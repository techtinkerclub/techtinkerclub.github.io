# v1.31.2 QA report

## Baseline verification

Online `master` was checked immediately before this patch and was:

`62d38a7c11aa832722579cb9aeeab48fdfa22f65`

(v1.31.1). The local baseline blobs used for the patch match the live runtime files.

## Generator QA

### Crossnumber
Targeted Challenge stress verifies:
- 20 requested clues are retained;
- every answer is 3-4 digits;
- repeated crossings and branching are present;
- bounding-box aspect ratio stays at or below 2 in the release regression seeds;
- arithmetic validation remains valid.

A 40-seed exploratory stress pass produced compact grids with average branching around 10 entries and no layouts above aspect ratio 1.86 after the final scoring adjustment.

### Arithmetic Equation Crossgrid
Targeted 10x10 Challenge stress verifies:
- at least 16 interlocking equations;
- at least 55% active-cell occupancy;
- all four operations present in mixed mode;
- sequential hidden-cell solvability remains valid.

A 20-seed exploratory stress pass averaged about 59% occupancy with 17-18 lines.

## Automated checks

Passed individually on the patched tree:
- `node --check` for modified JavaScript;
- `games-smoke.js`;
- `games-number-logic-smoke.js`;
- `games-v1301-review-smoke.js`;
- `games-v1302-pdf-parity-smoke.js`;
- `games-v1304-number-structures-polish-smoke.js`;
- `games-v1305-pdf-centering-smoke.js`;
- `games-v1306-pdf-scale-smoke.js`;
- `games-v1310-arithmetic-search-crossgrid-smoke.js`;
- `games-v1311-arithmetic-review-smoke.js`;
- `games-v1312-arithmetic-density-preview-smoke.js`.

## PDF QA

A representative pupil and answer PDF were generated containing:
1. 20-clue Challenge Maths Crossnumber;
2. dense 10x10 mixed-operation Equation Crossgrid;
3. 9x9 Kakuro;
4. 6x6 mixed Arithmetic Cages.

The pupil PDF was rasterised and visually inspected. Crossnumber and Crossgrid are substantially denser/clearer; the existing direct PDF Kakuro and Arithmetic Cages output remains intact.

## Preview-specific fixes

- Crossnumber gets a tall/wide/balanced shape class and height-constrained tall rendering.
- Kakuro preview receives larger count-specific sizes and improved dark clue-cell typography.
- Arithmetic Cages explicitly reassert heavy cage edges after the ordinary cell-line rule so the v1.31.1 override cannot recur.
