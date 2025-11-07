---
layout: single
title: ""
permalink: /instructor-notes/2025-26/autumn/week-5-notes/
week: 5
robots: noindex
toc: true
toc_sticky: true
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

# Instructor Notes — Week 5
{% include print-to-pdf.html %}
**Theme:** Loops & Iteration  
**Focus Concept:** Loops and Game Mechanics  
**Mini-Project:** Barrel Jumper

---

## Learning Objectives
- Participants understand what a **loop** is and can recognise different types (`repeat`, `for`, `while`, `forever`).
- Participants know that an **iteration** is one pass through a loop.
- Participants can explain how **timing** (`pause`, `millis`) controls loop speed.
- Participants use loops to move **sprites**, check **collisions**, and keep score in a simple game.

---

## Part 1: PRIMM — Loop Showcase (≈30 min)

### Predict (5)
Explain that the program below shows four loop styles and timing with `millis()`. Ask:
- *Which blocks look like they repeat?*
- *Which loop will stop by itself? Which might run forever?*
- *What will happen first when we run it?*

### Run (5)
Run each section and talk as you go.

**A) `repeat` countdown**
```blocks
on start
    set counter to 5
    repeat 6 times
        show number counter
        set counter to counter - 1
        pause (500) ms
    show arrow west
```

**B) `for` loops (grid fill)**
```blocks
for x from 0 to 4
    for y from 0 to 4
        plot x y
        pause (50) ms
```

**C) `while` + `break` timed by `millis()`**
```blocks
set timer to millis()
while true
    // do something simple so participants can see it looping
    toggle (0,0)
    pause (100) ms

    set stopTimer to millis()
    if stopTimer > timer + 5000 then
        break
```

**D) `forever`**
```blocks
forever
    show icon Heart
    pause (200) ms
    show icon SmallHeart
    pause (200) ms
```

### Investigate (10)
- **Loop** = repeats code automatically.
  - **repeat / for** → fixed number of times or across a range.
  - **while** → repeats while a condition is true; stop with **`break`**.
  - **forever** → never stops; great for a **game loop**.
- **Iteration** = one trip around the loop.
- **`millis()`** = micro:bit’s clock (ms since start). Compare values to time things.

**Child-friendly analogy:** a loop is like a song on repeat; **`break`** is pressing stop.

### Modify (5–7)
- Change repeat counts and pause times.
- Swap `repeat` for `while` and add your own stop condition.
- Time a 3-second effect using `millis()`.

### Make (5)
- Create a short animation using a nested `for`.
- Add a sound each iteration.

---

## Part 2: Project — *Barrel Jumper* (≈45–50 min)

### Overview
First micro:bit **game**: a player sprite **jumps** to avoid a moving **barrel**.  
Uses a **forever** game loop, **collision detection**, **score**, and optional **speed-up** and **sound**.

### Step 1 — Setup
```blocks
on start
    set jumper to create sprite at x: 0 y: 4
    set barrel to create sprite at x: 4 y: 4
    set score to 0
    set speed to 200   // bigger = slower; we’ll reduce this to speed up
```

### Step 2 — Jump action (two `repeat` loops)
```blocks
on button B pressed
    repeat 4 times
        change y by -1
        pause (100) ms
    repeat 4 times
        change y by +1
        pause (100) ms
```

### Step 3 — Game loop (`forever`): move, bounce, collide
```blocks
forever
    barrel move by 1
    barrel if on edge, bounce
    pause (speed) ms

    if jumper touching barrel then
        game over
        show string "Score:"
        show number score

    if barrel x = 0 then   // barrel reached the left edge
        change score by 1
        change speed by -10   // make game gradually harder
```

### Extensions (pick & mix)
- Add **sound** on jump / score / game over.
- Add a **second barrel** or randomise start side.
- Add a **timer** with `millis()` and show survival time at the end.

---

## Vocabulary Focus (with participant-friendly wording)
- **Loop** — instructions that repeat automatically.
  - **repeat / for**: run a fixed number of times or across a range.
  - **while**: keep going while a rule is true (stop with **break**).
  - **forever**: never stops; great for the **game loop**.
- **Iteration** — one trip around the loop.
- **Timer / `millis()`** — the micro:bit’s clock in milliseconds; use it to time things.
- **Variable** — a labelled box that stores values like `score`, `speed`, `x`, `y`.
- **Sprite** — a movable object on the LED grid (player or obstacle).
- **Collision detection** — checking if two sprites touch.

---

## Differentiation
- **New coders:** build base game (jump + collision).
- **Confident:** add score and speed-up.
- **Stretch:** add `millis()` timer, sounds, or multiple barrels.

---

## Assessment
- Can participants name two loop types and explain when to use them?
- Can they describe how **pause/speed** changes difficulty?
- Does their game loop correctly move the barrel and detect collisions?

---

## Troubleshooting
- **Too fast:** increase `pause (speed)`.
- **Sprites missing:** check coordinates are 0–4.
- **No jump:** both `repeat` blocks must be inside the button event.
- **No score:** ensure the edge check uses `barrel x = 0`.

---

## Materials & Setup
- BBC micro:bits + USB cables  
- Chromebooks with internet access  
- Optional: headphones/speakers for sound

---

## Safety & Safeguarding
- Keep cables tidy and volume sensible.
- Encourage turn-taking and pair support.

---

## Reflection (for leader)
- Who can clearly explain **repeat vs while vs forever**?
- Who adjusted timing/iterations to balance the game?
- Note participants ready to mentor others next session.

---
{% include back-to-autumn.html %}



<div class="notice--steam">
  <h2>Connections to STEAM Learning &amp; Real-World Links</h2>
  <ul>
    <li><strong>Computing:</strong> We will combine <strong>loops</strong> and <strong>collisions</strong> to create our first full game.</li>
    <li><strong>Maths:</strong> We will use ideas of <strong>timing</strong> and <strong>position</strong> to keep gameplay fair and balanced.</li>
    <li><strong>Art &amp; Design:</strong> We will choose and design sprites that emphasise <strong>contrast</strong> and <strong>readability</strong>.</li>
    <li><strong>Engineering:</strong> We will carry out quick <strong>play-test cycles</strong> and fix bugs based on what we observe.</li>
    <li><em>Real world:</em> If time allows, we will connect this idea to everyday technology or careers.</li>
  </ul>
</div>


