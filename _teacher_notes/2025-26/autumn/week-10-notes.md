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

1. **Starter & Recap (10 min)** — recap of variables and random numbers.  
2. **Part A – Arrays with Words (10–15 min)** — build a random chooser.  
3. **Part B – Rock–Paper–Scissors with Arrays (15–20 min)** — demo with image arrays.  
4. **Part C – Crashy Bird Build (30–35 min)** — full game build inside the *forever* loop.  
5. **Reflection & Extensions (5–10 min)**  

---

## Part A – Arrays with Words

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

Blocks version (MakeCode):

<div class="makecode-embed">
  <div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S57666-26417-59731-40588" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe></div>
</div>
```

### Teaching Steps (Part A)

1. Spoken list: “pizza, pasta, salad…” → explain index positions.  
2. Build the chooser live. Emphasise choosing a **position**, not the word directly.  
3. Key idea: “A list keeps related things together and we pick by position.”

---

## Part B – Rock–Paper–Scissors with Arrays

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

Blocks version (MakeCode):

```blocks
let list: Image[] = []
basic.showIcon(IconNames.Yes)
list = [
    images.iconImage(IconNames.Target),
    images.iconImage(IconNames.Square),
    images.iconImage(IconNames.Scissors)
]
input.onGesture(Gesture.Shake, function () {
    list[randint(0, 2)].showImage(0)
})
```

---

## Part C – Crashy Bird Build

### Aim
Build Crashy Bird step by step, emphasising arrays, loops and collisions.

---

## Conceptual Focus
- Arrays: one variable storing many sprites (obstacles).  
- Indexing: positions in a list.  
- Iteration: acting on every obstacle.  
- Game loop: the **forever** loop acts as the engine.  
- Collision: bird and obstacle share same (x, y).

---

## Pseudocode Overview (Blocks-style)

**Note:** All steps below happen *inside the forever loop* unless stated otherwise.

```text
on start:
    set index to 0
    create bird at x = 0, y = 2
    set bird to blink
    create an empty list called obstacles
    set ticks to 0

on button A pressed:
    move bird up one row

on button B pressed:
    move bird down one row

forever:
    -- 1. remove off‑screen obstacles --
    while obstacles has items
          and first obstacle x = 0:
        delete first obstacle from screen
        remove it from the list

    -- 2. move all obstacles --
    for each obstacle in obstacles:
        move obstacle left by 1

    -- 3. spawn new obstacles --
    if ticks mod 3 = 0:
        choose random gap row 0–4
        for row from 0 to 4:
            if row ≠ gap:
                create obstacle at (4, row)
                add obstacle to the list

    -- 4. detect collisions --
    for each obstacle in obstacles:
        if obstacle position = bird position:
            game over

    -- 5. timing --
    change ticks by 1
    pause 1000 ms
```

Blocks version (MakeCode – full Crashy Bird):

```blocks
let emptyObstacleY = 0
let ticks = 0
let bird: game.LedSprite = null
let obstacles: game.LedSprite[] = []
bird = game.createSprite(0, 2)
bird.set(LedSpriteProperty.Blink, 300)
input.onButtonPressed(Button.A, function () {
    bird.change(LedSpriteProperty.Y, -1)
})
input.onButtonPressed(Button.B, function () {
    bird.change(LedSpriteProperty.Y, 1)
})
basic.forever(function () {
    while (obstacles.length > 0 && obstacles[0].get(LedSpriteProperty.X) == 0) {
        obstacles.removeAt(0).delete()
    }
    for (let obstacle2 of obstacles) {
        obstacle2.change(LedSpriteProperty.X, -1)
    }
    if (ticks % 3 == 0) {
        emptyObstacleY = Math.randomRange(0, 4)
        for (let row = 0; row <= 4; row++) {
            if (row != emptyObstacleY) {
                obstacles.push(game.createSprite(4, row))
            }
        }
    }
    for (let obstacle3 of obstacles) {
        if (obstacle3.get(LedSpriteProperty.X) == bird.get(LedSpriteProperty.X) &&
            obstacle3.get(LedSpriteProperty.Y) == bird.get(LedSpriteProperty.Y)) {
            game.gameOver()
        }
    }
    ticks += 1
    basic.pause(1000)
})
```

---

## Step-by-Step Build Notes

### Step 1 – Initialise Bird, Index and List

```text
on start:
    set index to 0
    create bird at (0,2)
    set bird to blink
    create empty list obstacles
    set ticks to 0
```

**Explanation:**  
This runs once at the beginning. We prepare the bird’s position, make it blink so it stands out, and create an empty list that will soon hold many obstacles.

---

### Step 2 – Player Controls

```text
when button A pressed: move bird up one row
when button B pressed: move bird down one row
```

**Explanation:**  
This recreates the familiar control scheme from earlier weeks. Remind children that going above row 0 or below row 4 will move the sprite off‑screen.

---

## Step 3 – The Game Loop (Forever Loop)

Everything from this point onward happens *inside* the `forever` loop.  
This loop acts as the **engine** of the game — it repeats again and again, updating everything on the screen.

---

### 3a – Remove Off‑Screen Obstacles

```text
while obstacles not empty
      and first obstacle x = 0:
    delete first obstacle
    remove from list
```

**Explanation:**  
Obstacles move from right to left. When one reaches the left edge (x = 0), the next movement would push it off the grid.  
If we don’t remove it, the list grows forever, slowing the game and confusing collision checks.

---

### 3b – Move All Obstacles Left

```text
for each obstacle in obstacles:
    move obstacle left by 1
```

**Explanation:**  
A single loop updates *all* obstacles, no matter how many exist.  
This demonstrates the power of arrays in games.

---

### 3c – Spawn New Obstacles

```text
if ticks mod 3 = 0:
    choose gap row
    for row 0–4:
        if row ≠ gap:
            create obstacle at (4,row)
            add obstacle to list
```

**Explanation:**  
Every few cycles (based on ticks), we create a new column of obstacles.  
One random row becomes the gap, making the game playable.

---

### 3d – Detect Collisions

```text
for each obstacle:
    if obstacle x = bird x and obstacle y = bird y:
        game over
```

**Explanation:**  
A collision occurs when the bird and any obstacle share the same coordinates.

---

### 3e – Timing with Ticks

```text
change ticks by 1
pause 1000 ms
```

**Explanation:**  
Ticks increases every cycle. The pause slows the game to a playable speed.

---

## Instructor Tips
- Reinforce: **one list → many obstacles**.  
- Ask for predictions before running code.

---

## Common Misconceptions
- Arrays start at **0**, not 1.  
- Lists can hold **many** items.  
- Removing off‑screen obstacles is essential.

---

## Differentiation

**Support:** partially built starter.  
**Extend:** scoring, speed changes, sound, patterns.

---

## Reflection Questions
- “What is an array?”  
- “Why is it useful in Crashy Bird?”  
- “Where do we loop through the entire list?”  

---

<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>

{% include back-to-autumn.html %}
