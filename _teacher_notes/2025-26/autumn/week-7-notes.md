---
layout: single
title: ""
permalink: /teacher_notes/2025-26/autumn/week-7-notes/
week: 7
robots: noindex
toc: true
toc_sticky: true
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

# Instructor Notes — Week 7

**Theme:** Functions, Reuse, and Game Logic  
**Focus Concept:** Designing and using functions, passing parameters, and combining them with events  
**Mini‑Project:** Part A — Function demonstrations; Part B — *Space Invaders* mini‑game

---

## Learning Objectives

By the end of this session, participants should be able to:

- Explain what a **function** is and why we use them.  
- Understand the difference between a function **with parameters** and a function **without parameters**.  
- Use TTC‑style pseudocode to reason about reusable behaviours.  
- Build a simple game that uses functions, loops, collisions, and events.  
- Describe how acceleration input controls player movement.

---

## Vocabulary Focus

- **function** — a named block of instructions we can reuse.  
- **parameter** — information we pass *into* a function.  
- **return value** — information a function passes *back*.  
- **reuse** — writing code once and using it many times.  
- **collision** — when two sprites touch.  
- **event** — something the micro:bit reacts to (button pressed, shaking, etc.).

---

## Session Flow (≈ 80–90 minutes)

1. **Recap (5–10 min)** — what functions are and why we use them.  
2. **Part A – Functions Deep Dive (25–30 min)** — define, test, call functions with/without parameters.  
3. **Part B – Build Space Invaders (40–45 min)** — movement, lasers, aliens, bombs, collisions, scoring.  
4. **Wrap‑up (5 min)** — check understanding + show modifications.

---

# Part A — Understanding and Using Functions

### Blocks version (MakeCode)
<div class="makecode-embed">
  <div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;">
    <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S75217-00243-09727-56214" allowfullscreen frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe>
  </div>
</div>

---

## A1 — TTC Pseudocode: flashHeart (no parameters)

```
TO DO flashHeart
    SHOW ICON heart
    PAUSE 200 ms
    SHOW ICON small_heart
    PAUSE 200 ms
END TO DO
```

### Explanation

- This is the simplest type of function: **no inputs**, no return value.  
- When we *call* it, the instructions inside run exactly as written.  
- Explain to participants that this is like pressing a “macro button” — all steps happen automatically.

---

## A2 — TTC Pseudocode: addNumbers (returns a value)

```
TO DO addNumbers WITH num, num2
    RETURN num + num2
END TO DO
```

### Explanation

- This function **receives two numbers** (`num` and `num2`).  
- It **returns** a value — the sum.  
- We do not see anything on the LED grid unless we *use* the returned number somewhere (e.g., SHOW NUMBER).  
- Emphasise that functions can be “machines” that *produce* information.

---

## A3 — TTC Pseudocode: flashSquare (takes a parameter)

```
TO DO flashSquare WITH time
    SHOW ICON square
    PAUSE time ms
    SHOW ICON small_square
    PAUSE time ms
END TO DO
```

### Explanation

- This function takes a **parameter** that controls the timing.  
- When we call `flashSquare(300)` it pauses for 300 ms.  
- When we call `flashSquare(addNumbers(600, 400))`, the parameter becomes **1000**.  
- This demonstrates how functions can *work together*.

---

## A4 — Using the Functions (Events)

```
WHEN button A is pressed DO
    CALL flashSquare WITH 300
END WHEN

WHEN button AB is pressed DO
    CALL flashSquare WITH addNumbers(600, 400)
END WHEN

WHEN button B is pressed DO
    SHOW NUMBER addNumbers(33, 34)
END WHEN

CALL flashHeart
```

### Explanation

- Buttons **trigger** functions.  
- Functions can call **other functions** inside their parameters.  
- Parameters let participants customise behaviour without rewriting logic.  
- The final line runs once at the start of the program.

---

# Part B — Space Invaders Mini‑Game

### Blocks version (MakeCode)
<div class="makecode-embed">
  <div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;">
    <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S02862-67759-70499-11772" allowfullscreen frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe>
  </div>
</div>

---

# Part B1 — Game Setup (Sprites)

## TTC Pseudocode

```
SET Alien TO NEW SPRITE AT (0,0)
SET Ship TO NEW SPRITE AT (2,4)
```

### Explanation

- The **Alien** starts at the top-left corner and will move horizontally.  
- The **Ship** starts at the middle-bottom and will be player‑controlled.  
- Keep reinforcing coordinates:  
  - x increases left → right  
  - y increases top → bottom

---

# Part B2 — Ship Movement (Tilt Control)

## TTC Pseudocode

```
FOREVER DO
    IF [x acceleration] > 100 THEN
        CHANGE Ship x BY +1
    END IF

    IF [x acceleration] < -100 THEN
        CHANGE Ship x BY -1
    END IF
END FOREVER
```

### Explanation

- Tilting right moves the ship right; tilting left moves left.  
- The thresholds ±100 prevent “noise” movement.  
- This is the main player control system.

---

# Part B3 — Alien Movement (Bouncing)

## TTC Pseudocode

```
FOREVER DO
    MOVE Alien BY 1 STEP
    IF Alien IS ON EDGE THEN
        BOUNCE Alien
    END IF
    PAUSE 200 ms
END FOREVER
```

### Explanation

- Alien slides left–right, bouncing off edges.  
- This creates predictable but challenging behaviour.

---

# Part B4 — Bomb Drop Logic (Alien Attacks)

## TTC Pseudocode

```
EVERY 1 ms DO
    IF Alien.x = Ship.x THEN
        SET Alien brightness TO 1000

        SET Bomb TO NEW SPRITE AT (Alien.x, 0)

        REPEAT 5 TIMES
            PAUSE 200 ms
            CHANGE Bomb y BY +1
        END REPEAT

        IF Bomb IS TOUCHING Ship THEN
            GAME OVER
        END IF

        DELETE Bomb
    END IF
END EVERY
```

### Explanation

- **Alien shoots only when aligned** with the ship (same x‑value).  
- Brightness changes briefly to show “charging / warning”.  
- Bomb falls straight down using a REPEAT loop.  
- If the bomb touches the ship → **game over**.  
- Bomb is deleted either way to avoid piling up sprites.

---

# Part B5 — Shooting Lasers (Button B)

## TTC Pseudocode

```
WHEN button B is pressed DO
    SET Laser TO NEW SPRITE AT (Ship.x, Ship.y)

    REPEAT 5 TIMES
        PAUSE 100 ms
        CHANGE Laser y BY -1

        IF Laser IS TOUCHING Alien THEN
            DELETE Alien
            ADD 1 TO score
            SET Alien TO NEW SPRITE AT (0,0)
        END IF
    END REPEAT

    DELETE Laser
END WHEN
```

### Explanation

- Laser starts at the ship’s position and travels up (y decreases).  
- If it touches the alien:  
  - alien is destroyed  
  - score increases  
  - new alien respawns at (0,0).  
- This introduces **collision detection** and **respawning**.

---

# Part B6 — Full Game Loop Interaction

Participants now have:

- ship movement loop  
- alien movement loop  
- bomb drop logic (event-like interval)  
- laser shooting behaviour  
- scoring and game over

Encourage them to test:

- shoot alien while it moves  
- dodge bomb drops  
- play until score increases multiple times

---

# Differentiation

**Support:**  
- Provide printed pseudocode blocks for matching.  
- Allow them to build only laser OR only bomb logic.

**Extend:**  
- Add sound effects for shooting and explosions.  
- Add alien speed increase based on score.  
- Add multiple aliens or shields.

---

# Reflection & Wrap‑Up

Questions to ask:

- “Where did we use functions today?”  
- “How do parameters help us reuse ideas?”  
- “How did the game decide when to drop a bomb?”  
- “What part of the code controls difficulty?”

Participants should now understand functions deeply and see how they fit into a real game.

