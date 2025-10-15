---

layout: single
title: ""
permalink: /teacher-notes/2025-26/autumn/week-6-notes/
week: 6
robots: noindex
toc: true
toc_sticky: true
sidebar: false
header:
overlay_image: /assets/images/banner.png
show_overlay_excerpt: false
show_overlay_text: false
------------------------

# Teacher Notes — Week 6

{% include print-to-pdf.html %}
**Theme:** Game Loops, Collision Detection & Functions
**Focus Concept:** Using Loops to Build Games and Introduce Simple Functions
**Mini-Project:** Barrel Jumper

---

## Learning Objectives

* Pupils recall what a **loop** is and how it repeats code automatically.
* Pupils understand how **pause time** controls **game speed**.
* Pupils can use a **forever loop** as a continuous **game engine**.
* Pupils use **variables** to manage `score`, `speed`, and `level`.
* Pupils can explain what **collision detection** means in a game.
* Pupils are introduced to **functions** as reusable blocks of code.

---

## Recap (≈10 min)

Brief recap from last week:

* We introduced **loops** and saw how they repeat actions automatically.
* Today we’ll use a **forever loop** to make our first full **game**, and we’ll also learn how to create a simple **function**.

On the board:

> “A forever loop keeps our game running while we play.”

Ask:

> “Why might we want to use a function in our game?”
> (Answer: to reuse code easily without repeating ourselves.)

---

## Project — *Barrel Jumper* (≈65 min)

We’ll build our game **step-by-step**, testing each version as we go.

---

### Step 1 — Setup

```blocks
on start
    set jumper to create sprite at x: 0 y: 4
    set barrel to create sprite at x: 4 y: 4
    set score to 0
    set speed to 200
    set level to 1
```

🟩 **Instructor Notes**

* Explain that a **sprite** is an object on the LED grid.
* `jumper` = player, `barrel` = obstacle.
* The **x** coordinate controls left–right, **y** controls up–down.
* `speed` controls how often the barrel moves (larger = slower).

---

### Step 2 — Jump Action

```blocks
on button B pressed
    repeat 4 times
        jumper change y by -1
        pause (100) ms
    repeat 4 times
        jumper change y by +1
        pause (100) ms
```

🟩 **Instructor Notes**

* Show that both repeats are symmetrical: up and then down.
* Each pause defines jump smoothness.
* Let pupils experiment with timings (e.g. 50 ms for a quicker jump).

💬 *Ask:*
“What happens if you remove one of the repeat blocks?”

---

### Step 3 — Game Loop

```blocks
forever
    barrel move by 1
    barrel if on edge, bounce
    pause (speed) ms
```

🟩 **Instructor Notes**

* This loop is the **engine** of the game.
* `move by 1` slides the barrel each loop.
* `if on edge, bounce` reverses direction automatically.
* Use this to explain how changing `speed` affects difficulty.

💬 *Maths link:*
At 200 ms per move, 5 moves ≈ 1 second per full cross.

---

### Step 4 — Collision + Scoring

```blocks
forever
    barrel move by 1
    barrel if on edge, bounce
    pause (speed) ms

    if jumper touching barrel then
        game over
        show string "Score:"
        show number score

    if barrel x = 0 then
        change score by 1
        change speed by -10
```

🟩 **Instructor Notes**

* "Touching" checks if sprites overlap.
* Barrel hitting jumper triggers **game over**.
* Each left edge pass increases score.
* Decreasing speed = faster gameplay.

💬 *Maths connection:*
Start speed = 200 → after 5 points: 200 - (5 × 10) = 150 ms → faster game.

---

### Step 5 — Adding Levels & a Simple Function

Create a function to display levels.

```blocks
function showLevelToast()
    clear screen
    show string "L"
    show number level
    pause (250) ms
    clear screen
end function
```

🟩 **Instructor Notes**

* Explain that a **function** is a block of code we can **call** when needed.
* It avoids repetition and keeps code tidy.
* Functions can be called anywhere in the program.

💬 *Analogy:*
A function is like a mini-recipe — call it whenever you need that action.

Modify the main loop:

```blocks
set intendedLevel to 1 + (score ÷ 5)
if intendedLevel > level then
    set level to intendedLevel
    set speed to speed - 5
    call showLevelToast()
```

🟩 **Instructor Notes**

* `score ÷ 5` (integer division) means every 5 points = new level.
  Example: score = 12 → 12 ÷ 5 = 2 → Level 2.
* The function `showLevelToast` displays level-up animation.
* Reinforce that there are **no arguments** yet — simple functions only.

💬 *Extension idea:*
Add a sound effect in `showLevelToast` for a level-up chime.

---

## Vocabulary Focus (with pupil-friendly wording)

* **Loop** — instructions that repeat automatically.
* **Forever loop** — runs continuously as long as the game is active.
* **Variable** — a named box that stores values (`score`, `speed`, `level`).
* **Sprite** — a moving object on the LED grid.
* **Collision detection** — checking if two sprites touch.
* **Function** — a reusable set of instructions.
* **Integer division** — division that ignores remainders (used for levels).

---

## Differentiation

* **New coders:** build base game (jump + movement).
* **Confident:** add score and speed-up.
* **Stretch:** add levels, create and call functions, or add sound effects.

---

## Assessment

* Can pupils explain what a **function** does?
* Can they describe how **speed** affects difficulty?
* Can they identify where **game over** happens?
* Can they recognise variables and their purpose?

---

## Troubleshooting

* **Too fast:** increase `pause (speed)`.
* **Sprites missing:** check coordinates (0–4).
* **No jump:** both repeat blocks must be in the button event.
* **No score:** ensure `if barrel x = 0`.
* **No level-up:** check `score ÷ 5` and call `showLevelToast()`.

---

## Materials & Setup

* BBC micro:bits + USB cables
* Chromebooks with internet access
* Optional: headphones/speakers for sound

---

## Safety & Safeguarding

* Keep cables tidy and volume sensible.
* Encourage turn-taking and pair collaboration.

---

## Reflection (for leader)

* Who can explain the role of a **function**?
* Who adjusted timing or speed?
* Who debugged independently?
* Note pupils ready to mentor others next session.

---

{% include back-to-autumn.html %}
