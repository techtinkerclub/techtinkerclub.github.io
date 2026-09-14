# 99 Club Studio v1.30.0

## Number Patterns & Structures refinement

This release completes the review of the **Number patterns & structures** Games category and adds a shared answer-key clarity convention across puzzle families.

### Number Pyramid

- Pyramid depth now supports **3 to 7 levels**.
- Auto progression stays conservative for younger pupils and can reach 6-7 levels for older/challenge selections.
- Taller pyramids deliberately start from smaller base values so additional depth adds reasoning rather than runaway arithmetic.
- Missing-value density reduces as pyramids get deeper.
- The generator still checks that the visible clues uniquely determine the pyramid.

### Magic Squares

No conceptual changes. Existing generation remains in place; answer keys now distinguish completed cells from original givens.

### Arithmagons

- Writable nodes are genuinely blank; question marks have been removed.
- Shapes now include **triangle, square, pentagon and hexagon**.
- Challenge puzzles can add selected diagonals.
- Operation choices now distinguish:
  - **Mixed across the pack (recommended)** - a deliberate mix of addition and multiplication puzzles;
  - Addition only;
  - Multiplication only;
  - **Mixed + and x within each puzzle**.
- Year 1 Auto remains addition-only.
- Mixed-within puzzles label every connection with its operation.
- More varied missing-corner / missing-connection patterns strengthen inverse reasoning.

### Magic Number Shapes

This family is retained and expanded as line-sum reasoning rather than duplicating Magic Squares or Arithmagons.

- Existing triangle, web/circle and star structures remain.
- Added **Magic bow-tie**.
- Added **Find and repair the wrong value** alongside fill-missing and check/prove variants.
- Challenge generation can use denser overlapping structures and fewer clues.

### Number Trails & Snakes

No conceptual changes. The existing engine was kept stable; answer keys now distinguish filled values from givens.

### Number Connections

The former **Number Wheels, Flowers & Diamonds** engine is renamed **Number Connections**. Each generated subtype now has its own useful title:

- **Rule Wheels**
- **Factor Pair Webs**
- **Sum & Product Diamonds**

Presentation and progression were also reworked:

- question marks removed from writable positions;
- more breathing room between wheel diagrams;
- factor "flowers" replaced by clean factor-pair webs without the large surrounding oval;
- diamonds redrawn with dedicated value nodes and clearer product/sum labels;
- Rule Wheels can include missing inputs as well as outputs and, on Challenge for older pupils, two-step rules;
- Factor Pair Webs can ask for factor pairs or, on Challenge, ask pupils to infer the centre number from shown pairs;
- Challenge Diamonds can give sum + product and ask pupils to recover both side numbers.

### Answer-key clarity

For puzzle families with original givens and pupil-completed values, answer keys now distinguish **values supplied by the answer key** from **values that were already present on the pupil sheet**. Browser/colour output uses a restrained teal highlight; print styling also uses weight/neutral shading so the distinction survives greyscale printing and photocopying.

### Compatibility

The v1.29 Random compatible pack workflow, exact activity counts, per-engine Mixed difficulty, Vocabulary & Language refinements and v1.29.2 crossword geometry fix are preserved.
