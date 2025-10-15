---

layout: single
title: "Teacher Notes — Week 6"
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

* Participants recall what a **loop** is and how it repeats code automatically.
* Participants understand how **pause time** controls **game speed**.
* Participants can use a **forever loop** as a continuous **game engine**.
* Participants use **variables** to manage `score`, `speed`, and `level`.
* Participants can explain what **collision detection** means in a game.
* Participants are introduced to **functions** as reusable blocks of code.

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

### Step 1 — Setup (5 min)

Create sprites and variables.

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
* `speed` will control how often the barrel moves (larger = slower).

---

### Step 2 — Jump Action (10 min)

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
* Let participants experiment with timings (e.g. 50 ms for a quicker jump).

💬 *Ask:*
“What happens if you remove one of the repeat blocks?”

---

### Step 3 — Game Loop (15 min)

Add a **forever** loop to move the barrel.

```blocks
forever
    barrel move by 1
    barrel if on edge, bounce
    pause (speed) ms
```

🟩 **Instructor Notes**

* This loop is the **engine** of the game.
* `move by 1` slides the barrel each loop.
* `if on edge, bounce` reverses its direction automatically.
* Use this to explain how changing `speed` affects difficulty.

💬 *Maths link:*
At 200 ms per move, 5 moves ≈ 1 second per full cross.

---

### Step 4 — Collision + Scoring (15 min)

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

* "Touching" checks if two sprites overlap.
* Barrel hitting jumper triggers **game over**.
* Every time the barrel reaches the left edge, score increases.
* Decreasing speed = faster gameplay.

💬 *Maths connection:*
Start speed = 200 → after 5 points: 200 - (5 × 10) = 150 ms → faster game.

---

### Step 5 — Adding Levels and a Simple Function (20 min)

Now we’ll show a message when we move up a level.

#### Create a simple function:

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

* Explain that a **function** is a block of code we can **call** whenever needed.
* It helps us avoid repeating the same set of instructions multiple times.
* Functions can be called anywhere in the program.

💬 *Analogy:* A function is like a reusable recipe — call it when you need that result.

#### Modify the main loop:

```blocks
set intendedLevel to 1 + (score ÷ 5)
if intendedLevel > level then
    set level to intendedLevel
    set speed to speed - 5
    call showLevelToast()
```

🟩 **Instructor Notes**

* `score ÷ 5` (integer division) means every 5 points = new level.
  Example: 12 ÷ 5 = 2 → Level 2.
* Use the function `showLevelToast` to display level change visually.
* Reinforce: no new arguments here — function is simple and reusable.

💬 *Extension idea:* add a short sound to the function for a level-up chime.

---

## Vocabulary Focus

* **Loop** — a block that repeats automatically.
* **Forever loop** — keeps running until the game ends.
* **Variable** — a named box storing a value (e.g. score, speed, level).
* **Sprite** — a moving object on the LED grid.
* **Collision detection** — when two sprites touch.
* **Function** — a reusable set of instructions.
* **Integer division** — division ignoring remainders (used for levels).

---

## Differentiation

* **New participants:** build up to Step 3 (jump + movement).
* **Confident:** include scoring and speed change.
* **Stretch:** add levels, functions, and sound feedback.

---

## Assessment

* Can participants explain what a **function** does?
* Can they describe how **speed** changes difficulty?
* Can they identify where **game over** is triggered?
* Can they explain what variables are used for?

---

## Troubleshooting

| Problem              | Likely Cause             | Fix                               |
| :------------------- | :----------------------- | :-------------------------------- |
| Game too fast        | Speed too low            | Increase `pause` or reset `speed` |
| Barrel not moving    | Missing `forever` loop   | Wrap movement in loop             |
| Jump not working     | One repeat missing       | Add both up & down loops          |
| Score not changing   | Wrong x-position check   | Use `if barrel x = 0`             |
| Level not updating   | Missing integer division | Add `score ÷ 5`                   |
| Function not showing | Function not called      | Add `call showLevelToast()`       |

---

## Materials & Setup

* BBC micro:bits + USB cables
* Computers or Chromebooks with MakeCode
* Optional: headphones for sound effects

---

## Safety & Safeguarding

* Keep USB cables tidy and clear of workspace.
* Encourage sharing and pair programming.

---

## Reflection (for instructor)

* Who could explain the purpose of a **function**?
* Who adjusted timing or speed successfully?
* Who debugged their project independently?
* Note participants ready to mentor others next session.

---

{% include back-to-autumn.html %}
