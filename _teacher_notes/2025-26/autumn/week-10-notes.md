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
- Describe how a game can use an array to track multiple obstacles.  
- Build and test a scrolling game that uses arrays and loops together.

---

## Session Flow (≈ 80 min)

1. **Starter & Recap (10 min)** — quick recap of variables and random numbers.  
2. **Part A – Arrays with Words (10–15 min)** — random chooser with a text array.  
3. **Part B – Rock–Paper–Scissors with Arrays (15–20 min)** — demo with an array of images.  
4. **Part C – Crashy Bird Build (30–35 min)** — full game build using arrays and loops.  
5. **Reflection & Extensions (5–10 min)** — connect arrays to other games and term concepts.

---

## Part A – Arrays with Words

### Aim

Give children an intuitive feel for arrays using a simple list of text options before they see arrays inside games.

Short project:

- **Random Activity Chooser** — array of strings.

### Conceptual Focus

- An **array** can store **many related items** under one variable name.  
- Each item has a **position** called an **index** (starting at 0).  
- We can use a **random index** to pick a random element from the array.

---

### Pseudocode (Blocks‑style)

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
  Ask: *“If I say index 0, which one is it? What about index 2?”*  
  Draw small boxes on the board labeled `0, 1, 2, 3` and write the items inside to make the idea of **index positions** concrete.
- Then say: *“A list/array in code is like these boxes — one variable, many slots.”*

**Key points while building**

- Emphasise that `activities` is **one array variable** holding many strings, not six separate variables.  
- When choosing, the program **does not choose the text directly**. It chooses an **index**, then reads the value at that index.
- Make the “length − 1” idea explicit: if there are 6 items, valid indexes are `0` to `5`.
  - You can quickly ask: *“What would happen if we picked random 0 to 6?”* → off‑by‑one error.

**Checks and common issues**

- If nothing appears, check that `show string choice` uses the **variable** `choice`, not a literal word.  
- If the same item appears suspiciously often, explain that randomness can repeat and that this is normal.

**Good questions to ask learners**

- “What does `index` store — the word or the position?”  
- “If I add a new activity at the end, does the array get longer? What happens to the last index?”

---

## Part B – Rock–Paper–Scissors with Arrays

### Aim

Show that arrays can hold **images/icons** as well as text, and that the random‑index pattern is exactly the same.

### Conceptual Focus

- Arrays can store **images**, not just words or numbers.  
- We again pick a **random index**, then read the item at that position.  
- This mirrors what we will later do with **rows** and **obstacles** in Crashy Bird.

---

### Pseudocode (Blocks‑style)

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

- Tell participants: *“We’re going to reuse the same idea, but instead of words, our array will store pictures.”*  
- Show the three icons on the board or screen first: rock, paper, scissors.  
  Label them with indexes 0, 1, 2 to keep the connection clear.

**While coding**

- Link each line of pseudocode to blocks:
  - *“make array icons”* → array variable of type image.  
  - *“set index to random 0 to 2”* → built‑in block for random number.  
  - *“show leds icons at index”* → array **get‑at‑index** block feeding an image into `show leds`.
- Make explicit that the **array structure** is identical to Part A:
  - One variable, multiple items, choose a position, then use it.

**Questions and reasoning prompts**

- “What do we expect to see if the random index is 1?”  
- “If we wanted to add ‘lizard’ and ‘Spock’, what would we need to change?”  
  (Array length + random range.)

**Common misconceptions**

- Learners sometimes think randomness is applied to the **icon** rather than to the **index**.  
  Correct this gently: the randomness always acts on a **number**, which we use as an address inside the array.

---

## Part C – Crashy Bird Build

### Aim

Use arrays and loops in a meaningful context: a scrolling‑obstacle game.  
The build should connect back to earlier weeks (movement, loops, collisions), with arrays as the new concept.

### Conceptual Focus

- **Arrays:** one variable storing many obstacle sprites.  
- **Indexing:** the array keeps order; we can talk about “the first obstacle”.  
- **Iteration:** a loop can update *every* obstacle each cycle.  
- **Game loop:** the `forever` block is the “engine” that runs the game.  
- **Collision:** a hit occurs when two sprites share the same (x, y) position.

---

## Pseudocode Overview (Improved Blocks‑style)

```text
on start:
    create bird at (0, 2)
    set bird to blink
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
    if (ticks remainder of 3) = 0:
        set gapRow to random 0 to 4
        for row from 0 to 4:
            if row ≠ gapRow:
                create obstacle at (4, row)
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

### Blocks version (MakeCode)

<div class="makecode-embed">
  <div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;">
    <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;"
      src="https://makecode.microbit.org/---codeembed#pub:S42595-41266-97255-32528"
      allowfullscreen="allowfullscreen" frameborder="0" 
      sandbox="allow-scripts allow-same-origin"></iframe>
  </div>
</div>

---

# Step‑by‑Step Build Notes (Verbose)

## Step 1 – Initialise Bird, Array and Timer

```text
on start:
    create bird at (0, 2)
    set bird to blink
    make empty array obstacles
    set ticks to 0
```

**What this does**

- Runs **once** at the very beginning.  
- Puts the bird on the left, in the middle of the screen (column 0, row 2).  
- Sets a gentle blink to make the bird easier to spot.  
- Creates an **empty array** `obstacles` — this will later hold every obstacle sprite.  
- Sets `ticks` to 0, ready to act as a simple timer.

**How to explain it to participants**

- Compare `obstacles` to an **empty shelf** that will soon hold many pipes.  
- Emphasise that we are *not* creating any obstacles yet; we are just preparing the array.

**Things to check**

- Bird is visible and blinking.  
- No errors when running, even though no obstacles exist yet.

---

## Step 2 – Player Controls (Up / Down)

```text
on button A pressed:
    change bird y by -1

on button B pressed:
    change bird y by +1
```

**What this does**

- Button A moves the bird **up one row**.  
- Button B moves the bird **down one row**.  
- This is identical in spirit to earlier weeks — the focus is on making the bird feel responsive.

**How to explain it to participants**

- Remind them of the LED grid coordinates: x is left–right, y is up–down.  
- Ask them to predict: *“If y = 2 now and I press A, what does y become?”*

**Things to check**

- Bird moves exactly **one** step at a time, not more.  
- Bird does not need to wrap; if it goes off‑screen, that’s okay at this stage (we are focusing on arrays later).

---

## Step 3 – The Game Loop (Forever)

From now on, every change happens **inside** the `forever` block.

You can describe it to the group as:

> “This loop is the game engine. Each time around the loop, the game updates everything: cleans up obstacles, moves them, maybe spawns new ones, checks for collisions, and then waits a bit.”

---

### 3a – Remove Off‑Screen Obstacles

```text
while length of obstacles > 0
      AND x-position of obstacles[0] = 0:
    delete sprite obstacles[0]
    remove element at index 0 from obstacles
```

**What this does**

- Looks at the **first obstacle** in the array (index 0).  
- If its x‑position is 0, it is at the left edge and will leave the screen on the next move.  
- We:
  - delete the sprite so it disappears visually, and  
  - remove the reference from the `obstacles` array.  
- The **while** loop repeats in case several obstacles leave at once (e.g. a full column).

**How to explain it to participants**

- Show an imaginary row of pipes drawn on the board, moving left.  
- Label the leftmost one as “index 0”, the next as “index 1”, and so on.  
- Explain: *“When the first one falls off, we remove it from both the screen and from our list so we don’t keep tracking a ghost.”*

**Common mistakes**

- Using `if` instead of `while` → only removes one obstacle when multiple should be removed.  
- Forgetting to call both **delete sprite** *and* **remove from array** → leads to invisible sprites still being tracked in the array.

**Quick debugging tip**

- Temporarily show `length of obstacles` on the screen. If the number climbs forever, this clean‑up step is not working properly.

---

### 3b – Move All Obstacles Left

```text
for each obstacle in obstacles:
    change obstacle x by -1
```

**What this does**

- Goes through every element in the `obstacles` array.  
- Moves each obstacle one step left.  
- Works no matter whether there are 0, 5 or 20 obstacles.

**How to explain it to participants**

- Link directly back to earlier array work:  
  - *“Before, we used loops to show each word or number. Now we loop through an array of sprites and move each one.”*  
- Emphasise that we don’t need separate variables like `pipe1`, `pipe2`, `pipe3` — the **array plus loop** replaces all that.

**Common mistakes**

- Accidentally changing y instead of x.  
- Forgetting this loop and wondering why newly created obstacles never move.

**Good question to ask**

- “What would happen if we removed this loop completely? Would the game still feel like a scrolling game?”

---

### 3c – Spawn New Obstacles

```text
if (ticks remainder of 3) = 0:
    set gapRow to random 0 to 4
    for row from 0 to 4:
        if row ≠ gapRow:
            create obstacle at (4, row)
            add obstacle to obstacles
```

**What this does**

- Uses `ticks` as a simple timer: every time around the `forever` loop, `ticks` increases by 1.  
- The condition *“ticks remainder of 3 = 0”* means *“every 3 cycles”*.  
- When the condition is true:
  - We choose one **gap row** at random (0–4).  
  - We loop over each row from 0 to 4.  
  - For every row that is **not** the gap row, we create an obstacle at the right edge (x = 4) and add it to the array.

**How to explain it to participants**

- Connect this to maths: remainder is what’s left after division.  
  - Example: 7 ÷ 3 = 2 remainder 1.  
  - So ticks = 0, 3, 6, 9… are exactly the times when the remainder is 0.  
- Explain the game idea:
  > “Every few moments, a new wall of obstacles appears on the right, but one row is missing — that’s the tunnel the bird must fly through.”

**Things they can tweak**

- Change the number 3 to 2 or 4 and see how it affects difficulty.  
- Use two gap rows for an easier game, or move the gap based on another rule.

**Common mistakes**

- Forgetting to add the new obstacle to the `obstacles` array → sprite appears once but is never moved.  
- Using the wrong range (e.g. `random 1 to 4`), which makes row 0 or 4 never be a gap.

---

### 3d – Detect Collisions

```text
for each obstacle in obstacles:
    if obstacle x = bird x
       AND obstacle y = bird y:
        game over
```

**What this does**

- Checks every obstacle in the array.  
- If any obstacle’s position exactly matches the bird’s position, the game ends.

**How to explain it to participants**

- Revisit the idea of coordinates from earlier weeks:  
  - *“Two sprites collide when both their x and y match — they share a single LED.”*  
- You can illustrate with a quick table or grid: mark bird and obstacle positions and ask: *“Is this a collision?”*

**Common mistakes**

- Only checking x or only checking y, not both.  
- Checking just one obstacle instead of looping through the array.

**Simple test**

- Ask a learner to deliberately fly into an obstacle and check whether the game ends immediately.

---

### 3e – Timing with Ticks

```text
change ticks by 1
pause 1000 ms
```

**What this does**

- `ticks` increases by 1 each time the loop runs.  
- `pause 1000 ms` makes the loop wait one second before repeating.  
- Together they control how often:
  - obstacles move,  
  - new walls appear, and  
  - collision checks happen.

**How to explain it to participants**

- Clarify that `ticks` is not “seconds”, it is just a **counter**.  
- The link to spawn timing is through the remainder rule:  
  - *“Every time ticks hits a multiple of 3 (0, 3, 6, 9…), we spawn obstacles.”*

**Extension ideas**

- Let them experiment: try `pause 500 ms` or `pause 200 ms` and ask:  
  - *“Is the game still fair?”*  
- Show that difficulty can be changed just by tweaking timing and spawn rules, not by rewriting everything.

---

## Instructor Tips

- Keep repeating the mantra: **“One array, many obstacles; one loop, update them all.”**  
- When something breaks, help learners identify **which stage** is misbehaving:  
  - clean‑up, movement, spawning, collision, or timing.  
- Use the pseudocode as a map: point to the relevant part while inspecting their blocks.

---

## Common Misconceptions & Fixes

- **“Arrays start at 1.”**  
  - Re‑draw the box diagram from Part A and label from 0. Emphasise that the **first** element is index 0.

- **“Removing obstacles is optional.”**  
  - Show what happens if the clean‑up step is commented out: the array length grows, performance drops, and collisions feel strange.

- **“Loops only work on numbers.”**  
  - Remind them that in Part C we loop over an array of **sprites**, not numbers or strings.

---

## Differentiation

**Support:**

- Provide a starter file with:
  - bird created,  
  - controls working,  
  - an empty `forever` loop ready.  
- Give them one section at a time (e.g. movement, then spawning) instead of the whole game at once.

**Extend:**

- Add a score that increases every loop where the game is still running.  
- Gradually increase difficulty by:
  - reducing the pause, or  
  - changing the remainder check from 3 to 2 over time.  
- Add sound effects for flapping or crashing, or special “bonus” gaps.

---

## Reflection Questions

You can use these for an end‑of‑session recap or for the quiz:

- “In your own words, what is an array?”  
- “Why is an array useful in Crashy Bird?”  
- “Where in the game do we loop through every obstacle?”  
- “What could go wrong if we forgot to remove off‑screen obstacles?”

---

{% include back-to-autumn.html %}
