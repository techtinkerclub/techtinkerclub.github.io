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
**Focus Concept:** Lists, indexing and multi‑object updates  
**Mini‑Project:** *Crashy Bird* (scrolling obstacle game built in stages)

---

## Learning Objectives

By the end of this session, participants should be able to:

- Explain that an **array/list** is one variable that stores many values in order.  
- Use a **position/index** to select a value from a list.  
- Describe how a game can use an array to track multiple obstacles.  
- Build and test a scrolling game that uses arrays and loops together.

---

## Session Flow (≈ 80 min)

1. **Starter & Recap (10 min)**  
2. **Part A – Arrays with Words (10–15 min)**  
3. **Part B – Rock–Paper–Scissors with Arrays (15–20 min)**  
4. **Part C – Crashy Bird Build (30–35 min)**  
5. **Reflection & Extensions (5–10 min)**  

---

## Part A – Arrays with Words

### Aim
Introduce arrays using a simple list of text options.

### Conceptual Focus
- Arrays store **many related items** under one variable name.  
- Each item has a **position/index**.  
- Use a random index to choose an element.

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
    <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" 
      src="https://makecode.microbit.org/---codeembed#pub:S57666-26417-59731-40588"
      allowfullscreen="allowfullscreen" frameborder="0"
      sandbox="allow-scripts allow-same-origin"></iframe>
  </div>
</div>

---

## Part B – Rock–Paper–Scissors with Arrays

### Aim
Show arrays storing images.

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

### Blocks version

<div class="makecode-embed">
  <div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;">
    <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" 
      src="https://makecode.microbit.org/---codeembed#pub:S61168-68102-35768-98938"
      allowfullscreen="allowfullscreen" frameborder="0"
      sandbox="allow-scripts allow-same-origin"></iframe>
  </div>
</div>

---

## Part C – Crashy Bird Build

### Conceptual Focus
- Arrays hold all obstacles.  
- Loops update every obstacle each cycle.  
- The **forever** loop is the game engine.  
- Collisions occur when coordinates match.

---

## Pseudocode Overview (Improved Blocks‑Style)

```text
on start:
    create bird at (0, 2)
    set bird to blink
    make empty array obstacles
    set ticks to 0

on button A pressed: move bird up by 1
on button B pressed: move bird down by 1

forever:
    # 1. Remove off-screen obstacles
    while length of obstacles > 0 AND x-position of first obstacle = 0:
        delete first obstacle sprite
        remove first element from obstacles

    # 2. Move all obstacles left
    for each obstacle in obstacles:
        move obstacle left by 1

    # 3. Spawn new obstacles occasionally
    if (ticks remainder of 3) = 0:
        set gap to random 0–4
        for row from 0 to 4:
            if row ≠ gap:
                create obstacle at (4, row)
                add obstacle to obstacles

    # 4. Collision check
    for each obstacle in obstacles:
        if obstacle position = bird position:
            game over

    # 5. Timing
    change ticks by 1
    pause 1000 ms
```

### Blocks version

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

### Step 1 – Initialise Bird, Array and Timer

```text
on start:
    create bird at (0, 2)
    set bird to blink
    make empty array obstacles
    set ticks to 0
```

**Explanation:**  
Creates the player, prepares the empty array to store many obstacles, and sets up a counter used as a timer.

---

### Step 2 – Player Controls

```text
on button A pressed: move bird up by 1
on button B pressed: move bird down by 1
```

**Explanation:**  
Simple vertical controls. Ensure participants understand rows 0–4.

---

### Step 3 — Everything Below Runs Inside the Forever Loop

---

### 3a — Remove Off‑Screen Obstacles

```text
while length of obstacles > 0 AND x-position of first obstacle = 0:
    delete first obstacle
    remove first element from obstacles
```

**Explanation:**  
Obstacles scroll left. When an obstacle reaches x=0, it should be deleted to avoid clutter and slowdowns.  
The **while** loop handles cases where more than one obstacle reaches the edge at the same time.

---

### 3b — Move All Obstacles Left

```text
for each obstacle in obstacles:
    move obstacle left by 1
```

**Explanation:**  
Arrays allow us to update all sprites with one loop.

---

### 3c — Spawn New Obstacles

```text
if (ticks remainder of 3) = 0:
    set gap to random 0–4
    for row 0–4:
        if row ≠ gap:
            create obstacle at (4, row)
            add obstacle to obstacles
```

**Explanation:**  
Every few ticks, spawn a full column of obstacles except for the gap.  
Participants can easily tune difficulty by changing the remainder check or spawn frequency.

---

### 3d — Detect Collisions

```text
for each obstacle in obstacles:
    if obstacle position = bird position:
        game over
```

**Explanation:**  
Collision happens when two sprites share exactly the same coordinates.

---

### 3e — Timing

```text
change ticks by 1
pause 1000 ms
```

**Explanation:**  
Ticks increments each cycle. Pause controls game speed.

---

## Instructor Tips
- Reinforce: **one array → many obstacles updated easily**.  
- Ask learners to predict behaviour before running code.

---

## Common Misconceptions
- Arrays start at **0**, not 1.  
- You must delete off-screen obstacles.  
- Moving items inside a loop does **not** delete them.

---

## Differentiation
**Support:** provide starter with bird + movement.  
**Extend:** scoring, variable speed, animations.

---

## Reflection Questions
- “What is an array?”  
- “Why is it helpful in Crashy Bird?”  
- “Where do we loop through all obstacles?”  

---

{% include back-to-autumn.html %}
