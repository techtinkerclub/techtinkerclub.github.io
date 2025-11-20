---
layout: single
title: ""
permalink: /teacher_notes/2025-26/autumn/week-10-notes/
week: 10
robots: noindex
toc: true
toc_sticky: true
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

{% include print-to-pdf.html %}

# Instructor Notes — Week 10

**Theme:** Arrays  
**Focus Concept:** Arrays, indexing and multi‑object updates  
**Mini‑Project:** *Crashy Bird* (scrolling obstacle game built in stages)

---

## Learning Objectives

By the end of this session, participants should be able to:

- Explain that an **array/list** is one variable that stores many values in order.  
- Use a **position/index** to select a value from an array.  
- Describe how a game can use an array to track multiple **obstacle sprites**.  
- Build and test a scrolling game that uses arrays and loops together.

---

## Session Flow (≈ 80 min)

1. **Starter & Recap (10 min)** — quick recap of variables and random numbers.  
2. **Part A – Arrays with Words (10–15 min)** — random chooser using an array of strings.  
3. **Part B – Rock–Paper–Scissors with Arrays (15–20 min)** — demo using an array of images.  
4. **Part C – Crashy Bird Build (30–35 min)** — full game build using arrays and loops.  
5. **Reflection & Extensions (5–10 min)** — connect arrays to other games and to concepts from the term.

---

## Part A – Arrays with Words

### Aim

Give children an intuitive feel for arrays using a simple list of text options before they see arrays inside a game.

Short project:

- **Random Activity Chooser** — array of strings.

### Conceptual Focus

- An **array** can store **many related items** under one variable name.  
- Each item has a **position** called an **index** (starting at 0).  
- We use a **random index** to pick a random element from the array.

---

### Pseudocode (Blocks-style)

```text
on start:
    make array activities:
        "PE with Joe"
        "watch a movie"
        "play a board game"
        "tidy our rooms"
        "learn a song"
        "bake a cake"

on button A pressed:
    set index to random 0 to (length of activities - 1)
    set choice to activities at index
    show string choice
```

### Blocks version (MakeCode)

<div class="makecode-embed">
  <div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;">
    <iframe 
      style="position:absolute;top:0;left:0;width:100%;height:100%;" 
      src="https://makecode.microbit.org/---codeembed#pub:S57666-26417-59731-40588" 
      allowfullscreen="allowfullscreen" 
      frameborder="0" 
      sandbox="allow-scripts allow-same-origin">
    </iframe>
  </div>
</div>

### Teaching Notes (Part A)

**How to introduce it**

- Start with a spoken list: “pizza, pasta, salad, soup…”.  
  Draw a row of boxes on the board labelled **0, 1, 2, 3** and write one item in each box.  
  Ask: *“If I say index 0, which one is it? What about index 2?”*  
- Then say:  
  > “An array in code is like these labelled boxes: one variable, many slots. Each slot has a position number called an index.”

**Key points while building**

- Make it clear that `activities` is **one array variable** that holds all the strings, not six separate variables.  
- When choosing, the program **does not choose the word directly**. It chooses a **number** (`index`), then uses that number to look up the word in the array.  
- Explicitly talk through `length - 1`: if there are 6 items, valid indexes are `0` to `5`.  
  You can ask: *“What might go wrong if we picked random 0 to 6?”* → off‑by‑one error.

**Checks and common issues**

- If nothing appears when A is pressed:
  - Check that `show string` is using the variable `choice` and not a hard‑coded string.  
  - Check that `length of activities` is set correctly.
- If learners think the array “remembers” the last index forever, show that each button press picks a **new random index**.

**Questions to ask learners**

- “What exactly does `index` store — the word or the position?”  
- “If we add another activity to the array, what happens to the length and the last index?”  
- “Could we use the same pattern to choose a random sound or a random speed later on?”

---

## Part B – Rock–Paper–Scissors with Arrays

### Aim

Show that arrays can hold **images/icons** as well as text, and that the random‑index pattern is exactly the same.

### Conceptual Focus

- Arrays can store **images**, not just words or numbers.  
- We again pick a **random index**, then read the item at that position.  
- This mirrors what we will later do with **rows** and **obstacle sprites** in Crashy Bird.

---

### Pseudocode (Blocks-style)

```text
on start:
    make array icons:
        rock image
        paper image
        scissors image

on shake:
    set index to random 0 to 2
    show leds icons at index
```

### Blocks version (MakeCode)

<div class="makecode-embed">
  <div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;">
    <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" 
      src="https://makecode.microbit.org/---codeembed#pub:S61168-68102-35768-98938" 
      allowfullscreen="allowfullscreen" frameborder="0" 
      sandbox="allow-scripts allow-same-origin"></iframe>
  </div>
</div>

### Teaching Notes (Part B)

**How to frame it**

- Tell participants:  
  > “We’re going to reuse the same idea, but instead of a list of words, our array will store pictures.”  
- Show the three icons (rock, paper, scissors) on the projector or board.  
  Underneath them, write the indexes **0**, **1**, **2** to keep the index idea alive.

**While coding**

- Link each line of pseudocode to the blocks:
  - *“make array icons”* → array variable of type image.  
  - *“set index to random 0 to 2”* → random block that returns a number.  
  - *“show leds icons at index”* → **get‑at‑index** block feeding into `show leds`.
- Keep repeating:  
  > “The array holds the images. The random block picks a position. Then we ask the array for the image at that position.”

**Reasoning prompts**

- “What exactly happens when the random index is 1?”  
  (We show the second image: paper.)  
- “If we added two more gestures (e.g. lizard and Spock), where should we change the random range?”  

**Common misconceptions**

- Thinking that the random function chooses between rock, paper and scissors directly.  
  Gently correct: randomness always gives a **number**, and we use that number to access the array.
- Confusing “index = 1” with “first item”. Emphasise again: first item has index 0.

---

## Part C – Crashy Bird Build

### Aim

Use arrays and loops in a meaningful context: a scrolling‑obstacle game.  
The build should connect back to earlier weeks (movement, loops, collisions), with arrays as the new concept tying everything together.

### Conceptual Focus

- **Arrays:** one variable storing many **obstacle sprites**.  
- **Indexing:** the array keeps order; we can talk about “the first obstacle” as `obstacles[0]`.  
- **Iteration:** a loop can update *every* obstacle on each cycle of the game loop.  
- **Game loop:** the `forever` block is the “engine” that repeatedly updates the game state.  
- **Collision:** a hit occurs when an obstacle sprite and the bird share the same (x, y) position.

---

## Pseudocode Overview (Blocks-style, aligned to MakeCode)

```text
on start:
    create bird at (0, 2)
    set blink of bird to 300 ms
    make empty array obstacles
    set ticks to 0

on button A pressed:
    change bird y by -1

on button B pressed:
    change bird y by +1

forever:
    # 1. Remove obstacles that have left the screen
    while length of obstacles > 0
          AND x-position of obstacles[0] = 0:
        delete sprite obstacles[0]
        remove element at index 0 from obstacles

    # 2. Move all obstacles left
    for each obstacle in obstacles:
        change obstacle x by -1

    # 3. Sometimes spawn a new column of obstacles
    if remainder of (ticks / 3) = 0:
        set gapRow to random 0 to 4
        for row from 0 to 4:
            if row ≠ gapRow:
                create obstacle sprite at (4, row)
                add obstacle to obstacles

    # 4. Check for collisions
    for each obstacle in obstacles:
        if obstacle x = bird x
           AND obstacle y = bird y:
            game over

    # 5. Timing
    change ticks by 1
    pause 1000 ms
```

### Blocks version (Crashy Bird reference)

<div class="makecode-embed">
  <div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;">
    <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;"
      src="https://makecode.microbit.org/---codeembed#pub:S42595-41266-97255-32528"
      allowfullscreen="allowfullscreen" frameborder="0" 
      sandbox="allow-scripts allow-same-origin"></iframe>
  </div>
</div>

---

# Step-by-Step Build Notes (Verbose)

## Step 1 – Initialise Bird, Array and Timer

```text
on start:
    create bird at (0, 2)
    set blink of bird to 300 ms
    make empty array obstacles
    set ticks to 0
```

**What this does**

- Runs **once** at the very start of the program.  
- Creates the **bird sprite** at the left‑middle of the LED grid (x = 0, y = 2).  
- Uses the **set blink** property block to make the bird blink every 300 ms so it is easier to see.  
- Creates an **empty array** called `obstacles` — this will later hold many obstacle sprites.  
- Sets `ticks` to 0, ready to act as a simple loop counter / timer.

**How to explain it to participants**

- Compare `obstacles` to an **empty container** which will soon hold many obstacle sprites.  
  > “Right now the array is empty, but as the game runs, we’ll keep adding obstacle sprites into it.”  
- Emphasise that *no obstacles exist yet*; we are just preparing the structures we need before the game starts.

**Things to check**

- Bird appears at the left and blinks steadily.  
- No errors on download, even though `obstacles` is empty.

---

## Step 2 – Player Controls (Up / Down)

```text
on button A pressed:
    change bird y by -1

on button B pressed:
    change bird y by +1
```

**What this does**

- Button A moves the bird up one row.  
- Button B moves the bird down one row.  
- This mirrors earlier weeks’ control schemes, so it should feel familiar.

**How to explain it**

- Re‑draw the 5×5 grid and mark y positions 0 (top) to 4 (bottom).  
- Ask: *“If the bird is at y = 2 and we press A, what does y become?”* → 1.  
- Connect this to coordinates used in previous projects:

  > “x is left–right, y is up–down. Here we only change y, so the bird slides in a vertical line.”

**Things to check**

- Bird moves exactly one step per press.  
- If it goes off‑screen (y < 0 or y > 4), that is OK for now — the main focus is on the array logic later.

---

## Step 3 – The Game Loop (`forever`)

From now on, all the “game logic” lives inside the `forever` loop.

You can explain it like this:

> “The `forever` loop is the game engine. Every time it runs, it:  
> 1) cleans up old obstacles,  
> 2) moves all current obstacles,  
> 3) maybe spawns new ones,  
> 4) checks for collisions, and  
> 5) waits a bit before the next cycle.”

---

### 3a – Remove Off‑Screen Obstacles

```text
while length of obstacles > 0
      AND x-position of obstacles[0] = 0:
    delete sprite obstacles[0]
    remove element at index 0 from obstacles
```

**What this does**

- Looks at the **first** obstacle in the array (`obstacles[0]`).  
- If:
  - the array is not empty, and  
  - the x‑position of that first obstacle is 0 (left edge),  
  then that obstacle is about to leave the screen on the next move.  
- The code:
  - deletes the **sprite** so it disappears from the LEDs, and  
  - removes the **reference** from the `obstacles` array.  
- The `while` loop repeats in case more than one obstacle at the front of the array has x = 0 (for example, in a full column of obstacles).

**How to explain it**

- Draw a column of obstacle sprites moving left across the screen.  
- Mark the leftmost as `obstacles[0]`, next as `obstacles[1]`, and so on.  
- Explain:  
  > “When the first obstacle reaches the left edge, we don’t want to keep tracking it forever. We delete it from the screen and remove it from the array so the game stays tidy and fast.”

**Common mistakes**

- Using `if` instead of `while` → only one obstacle is removed even if an entire column has reached x = 0.  
- Forgetting to call **both**:
  - `delete sprite obstacles[0]`, and  
  - `remove element at index 0 from obstacles` → this leaves “ghost” entries in the array that no longer exist on screen.

**Debugging tip**

- Temporarily show `length of obstacles` on the display or in the console.  
  If the length keeps increasing even when obstacles leave the grid, the clean‑up code isn’t working correctly.

---

### 3b – Move All Obstacles Left

```text
for each obstacle in obstacles:
    change obstacle x by -1
```

**What this does**

- Loops through **every obstacle sprite** stored in the array.  
- Moves each one one step left (towards the bird).  
- Works the same whether there are 0, 3 or 20 obstacles in the array.

**How to explain it**

- Link back to Part A and B:

  > “Before, we looped through every word or every image in an array.  
  > Now we loop through an array of **sprites** and move each sprite one step.”  

- Emphasise the power of arrays:

  > “Instead of writing separate code for obstacle 1, obstacle 2, obstacle 3… we have a single array and a single loop that handles them all.”

**Common mistakes**

- Accidentally changing `y` instead of `x` (obstacles move up/down instead of sideways).  
- Forgetting this step completely, which makes newly‑spawned obstacles appear but never move.

**Good discussion question**

- “What would the game feel like if we removed this loop? Would it still be a scrolling game?”  

Let learners describe the behaviour: static obstacles suddenly appearing on the right and never moving.

---

### 3c – Spawn New Obstacles

```text
if remainder of (ticks / 3) = 0:
    set gapRow to random 0 to 4
    for row from 0 to 4:
        if row ≠ gapRow:
            create obstacle sprite at (4, row)
            add obstacle to obstacles
```

**What this does**

- Uses `ticks` as a basic **timer**: each cycle of `forever` adds 1 to `ticks`.  
- The MakeCode-style block **remainder of (ticks / 3)** gives the remainder when you divide `ticks` by 3.  
- The condition `remainder of (ticks / 3) = 0` means:  
  > “Do this when ticks is a multiple of 3: 0, 3, 6, 9, 12, …”  
- When that happens:
  - Choose a **gap row** randomly between 0 and 4.  
  - Loop over each row `0, 1, 2, 3, 4`.  
  - For every row that is **not** the gap row, create a new obstacle sprite at (4, row) and add it to the `obstacles` array.  
  - The result is a “wall” of obstacles with one missing LED — that missing LED is the tunnel for the bird.

**How to explain it**

- Connect to maths explicitly:

  > “The remainder is what is left after division.  
  > If ticks = 7 and we divide by 3, we get 2 remainder 1.  
  > Only when the remainder is 0 (like 0, 3, 6, 9, …) do we create new obstacles.”

- Relate this to gameplay:

  > “Every few moments, a new wall of obstacles appears on the right. One random row in that wall is left empty, so the bird has somewhere to fly.”

**Things they can safely tweak**

- Change the divisor in `remainder of (ticks / something)` and see how often new obstacles appear.  
- Use two gap rows instead of one to make the game easier (e.g. allow both `gapRow` and `gapRow + 1` to be empty, if still within 0–4).

**Common mistakes**

- Forgetting to **add** each newly created obstacle to the `obstacles` array → the sprite appears once but never moves or collides.  
- Using an incorrect random range (for example, `random 1 to 4`), which means some rows never become the gap.

---

### 3d – Detect Collisions

```text
for each obstacle in obstacles:
    if obstacle x = bird x
       AND obstacle y = bird y:
        game over
```

**What this does**

- Loops through every obstacle sprite in the array.  
- Compares its (x, y) position to the bird’s position.  
- If **both** x and y match, a collision is detected and the game ends.

**How to explain it**

- Re‑use the coordinate grid from earlier:

  > “Imagine writing the bird’s coordinates as (x, y).  
  > A collision happens when an obstacle has exactly the same pair: same x and same y.  
  > That means they are on the same LED.”

- Link back to previous games (e.g. Space Invaders‑style projects) where collisions were also based on coordinates.

**Common mistakes**

- Only comparing x or only comparing y, not both → collisions trigger early or not at all.  
- Checking only a single obstacle and forgetting to loop through the entire array.

**Simple test**

- Ask a learner to intentionally fly into an obstacle and confirm that the game ends **as soon as** they overlap.

---

### 3e – Timing with `ticks` and `pause`

```text
change ticks by 1
pause 1000 ms
```

**What this does**

- `ticks` goes up by 1 on every pass through `forever`.  
- `pause 1000 ms` makes the program wait about one second before starting the next cycle.  
- Because the spawn logic depends on `ticks`, changing the pause or the remainder condition changes how challenging the game feels.

**How to explain it**

- Clarify that `ticks` is just a **counter**, not “seconds”:

  > “ticks is a number that increases every time the loop runs.  
  > We use it with the remainder rule to decide when to create new obstacles.”

- Illustrate with a short table:

  | ticks | remainder of (ticks / 3) | spawn? |
  |-------|--------------------------|--------|
  | 0     | 0                        | yes    |
  | 1     | 1                        | no     |
  | 2     | 2                        | no     |
  | 3     | 0                        | yes    |

**Extension ideas**

- Let learners try:
  - `pause 500 ms` (faster game), or  
  - `pause 200 ms` (very fast, harder to survive).  
- Ask: *“What changes if we use remainder of (ticks / 4) instead of 3?”* (Obstacles appear less often.)

---

## Instructor Tips

- Keep repeating the core idea:  
  > “One array holds all the obstacles. One loop lets us update them all in one go.”  
- When supporting debugging, help learners decide **which part** is going wrong:
  - removal, movement, spawning, collision, or timing.  
- Encourage them to refer to the pseudocode as a **map** while they work on their blocks.

---

## Common Misconceptions & Fixes

- **“Arrays start at 1.”**  
  - Re‑draw the index boxes from Part A: first element is index 0.  
- **“Arrays only store numbers.”**  
  - Remind them of Part B (images) and Part C (sprites). Arrays store many types, as long as each array is consistent.  
- **“Obstacles disappear automatically when they leave the grid.”**  
  - Demonstrate what happens when the removal code is disabled: the array grows and the game slows.  
- **“You only need to check one obstacle for collisions.”**  
  - Show a case with two obstacles in the same column; only checking one would miss the closer one.

---

## Differentiation

**Support**

- Provide a starter project with:
  - bird created and blinking,  
  - up/down controls working,  
  - an empty `forever` loop already in place.  
- Let less‑confident participants focus on:
  - movement,  
  - basic spawning, and  
  - simple collision,  
  rather than every optimisation.

**Extend**

- Add a **score** that increases each cycle while the player is still alive.  
- Speed up the game over time by:
  - reducing the `pause`, or  
  - changing the spawn remainder from 3 to 2 after a certain number of ticks.  
- Add sound:
  - a flap sound when the bird moves,  
  - a crash sound on game over.  
- Experiment with patterns:
  - double gaps,  
  - moving gaps,  
  - “bonus” rows with extra points.

---

## Reflection Questions

Use these for whole-class discussion or at the end of the session:

- “In your own words, what is an array?”  
- “Why is an array useful in Crashy Bird instead of using lots of separate variables?”  
- “Where in your game do you loop through **every** obstacle?”  
- “What would happen if we never removed off-screen obstacles from the array?”  

---

{% include back-to-autumn.html %}
