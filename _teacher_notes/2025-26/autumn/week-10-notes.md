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
   Quick recap of variables and random numbers. Introduce list positions as “0, 1, 2…”.

2. **Part A – Arrays with Words (10–15 min)**  
   Build a simple random chooser with a list of text options.

3. **Part B – Rock–Paper–Scissors with Arrays (15–20 min)**  
   Show and discuss a Rock–Paper–Scissors game implemented using an array of images.

4. **Part C – Crashy Bird Build (30–35 min)**  
   Build the game in stages: player movement → empty obstacle list → scrolling obstacles → spawning → collisions → timing.

5. **Reflection & Extensions (5–10 min)**  
   Discuss where arrays appear in other games. Offer challenges.

---

# Part A – Arrays with Words

### Aim
Give children an intuitive feel for arrays using a simple list of text options before they see arrays inside games.

Short project:
- **Random Activity Chooser** – list of strings

### Conceptual Focus
- A list can store **many related items** under one variable name.  
- Each item has a **position** called an index (starting at 0).  
- We can use a random index to pick a random element.

---

### Pseudocode (Blocks-style)

#### A1. Random Activity Chooser

```text
on start:
    make a list of activities:
        "PE with Joe"
        "watch a movie"
        "play a board game"
        "tidy our rooms"
        "learn a song"
        "bake a cake"

on button A pressed:
    pick a random position between 0 and last position in the list
    read the activity at that position
    show the chosen activity
```

### Teaching Steps (Part A)

1. Spoken list: “pizza, pasta, salad…” → explain index positions.  
2. Build the chooser live. Emphasise choosing a **position**.  
3. Key sentence: “A list keeps related things together and we pick by position.”

---

# Part B – Rock–Paper–Scissors with Arrays

### Aim
Show a mini‑game using an array of images.

### Conceptual Focus
- Arrays can hold **icons/images**, not just text.  
- Random index → random image.  
- Same idea later for choosing the gap row in Crashy Bird.

### Pseudocode

```text
on start:
    make a list of images:
        rock picture
        paper picture
        scissors picture

on shake:
    pick a random number 0–2
    read the image at that position
    show that image
```

---

# Part C – Crashy Bird Build

### Aim
Build Crashy Bird step by step, emphasising arrays, loops and collisions.

## Conceptual Focus
- Arrays: one variable storing many sprites (obstacles).  
- Indexing: positions in a list.  
- Iteration: acting on every obstacle.  
- Game loop: the forever block as the engine.  
- Collision: bird and obstacle share same (x, y).

---

## Pseudocode Overview

```text
on start:
    set index to 0
    create bird at x = 0, y = 2
    make bird blink

on button A pressed:
    move bird up one row

on button B pressed:
    move bird down one row

forever:
    while obstacles has at least one item
          and the first obstacle's x is 0:
        delete the first obstacle from the list

    for each obstacle in obstacles:
        move obstacle left

    if ticks ÷ 3 has remainder 0:
        choose random gap row 0–4
        for each row 0–4:
            if row ≠ gap:
                create obstacle at (4, row)
                add to obstacles

    for each obstacle in obstacles:
        if obstacle position = bird position:
            game over

    change ticks by 1
    pause 1000 ms
```

---

# Step-by-Step Build Notes

## Step 1 – Initialise Bird and Index
```text
on start:
    set index to 0
    create bird at (0,2)
    set bird to blink
```

## Step 2 – Player Controls
```text
when button A pressed: move bird up
when button B pressed: move bird down
```

## Step 3 – Game Loop

### 3a. Remove off-screen obstacles
```text
while obstacles not empty
      and first obstacle x = 0:
    delete first obstacle
```

### 3b. Move all obstacles
```text
for each obstacle: move obstacle left
```

### 3c. Spawn new obstacles
```text
if ticks mod 3 = 0:
    choose gap row
    for row 0–4:
        if row ≠ gap:
            create obstacle at (4,row)
            add to list
```

### 3d. Detect collisions
```text
for each obstacle:
    if obstacle x = bird x and obstacle y = bird y:
        game over
```

### 3e. Timing
```text
ticks += 1
pause 1000 ms
```

---

## Instructor Tips
- Emphasise: **one list → many obstacles**.  
- Narrate loops in simple language.  
- Pause for predictions before running code.

---

## Common Misconceptions
- Arrays start at 0, not 1.  
- Lists can hold **many** obstacles.  
- Removing obstacles is required.  
- Must check **all** obstacles for collisions.

---

## Differentiation
**Support:** part‑built starter file.  
**Extend:** scoring, speed changes, sounds, special patterns.

---

## Reflection
- What is an array?  
- Why is it useful?  
- What happens in the movement loop?

---

{% include back-to-autumn.html %}
