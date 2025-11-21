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

**Theme:** Functions, Reusability, and Multi‑Object Games  
**Focus Concept:** Breaking programs into reusable functions; coordinating sprites, timing, and events  
**Mini‑Project:** Part A — Functions (flash patterns + return values)  
Part B — Space Invaders (movement, shooting, collision, accelerometer controls)

---

## Learning Objectives

By the end of this session, participants should be able to:

- Read and write TTC‑style **pseudocode** for functions with and without inputs.  
- Explain why programming uses **functions** to avoid repetition and make code clearer.  
- Understand **parameters**, **return values**, and **abstraction** at a KS2‑friendly level.  
- Coordinate multiple sprites interacting in real time (player ship, alien, laser, bomb).  
- Use **conditions**, **loops**, **timing**, and **collisions** to build a multi‑stage game.

---

## Vocabulary Focus

- **function** — a named block of code that performs a task.  
- **parameter** — an input value a function needs to do its job.  
- **return value** — the value a function gives back after it finishes.  
- **sprite** — a movable object on the LED grid.  
- **collision** — when two sprites touch.  
- **projectile** — something that moves across the screen (laser, bomb).  
- **accelerometer** — a sensor detecting tilt and movement.

Model statements like:

> “This function returns a number.”  
> “flashSquare uses a parameter to control how slow or fast it flashes.”  
> “The ship moves because we read the accelerometer.”

---

# Part A — Functions  
*(≈ 25–30 minutes)*

We introduce **functions** using three clear examples:

1. A function that **returns** a number.  
2. A function that **takes a parameter**.  
3. A function that uses **no parameters and no return value**, just behaviour.

### Blocks version (MakeCode)

<div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S75217-00243-09727-56214" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe></div>

---

## A1 — TTC Pseudocode: Functions Example

```text
DEFINE FUNCTION add_numbers(a, b) DO
    RETURN a + b
END FUNCTION

DEFINE FUNCTION flash_square(time_ms) DO
    SHOW ICON big_square
    PAUSE time_ms
    SHOW ICON small_square
    PAUSE time_ms
END FUNCTION

DEFINE FUNCTION flash_heart() DO
    SHOW ICON heart
    PAUSE 200 ms
    SHOW ICON small_heart
    PAUSE 200 ms
END FUNCTION

WHEN button A is pressed DO
    CALL flash_square(300)
END WHEN

WHEN button A+B is pressed DO
    CALL flash_square( add_numbers(600, 400) )
END WHEN

WHEN button B is pressed DO
    SHOW NUMBER add_numbers(33, 34)
END WHEN

CALL flash_heart()
```

---

## A2 — Verbose Instructor Explanation (Step‑by‑Step)

### 1. Why functions?

Explain:

- Functions are like **mini‑machines**.  
- You give them *inputs* (values).  
- They do something.  
- They may give you an *output*.  

Use KS2‑friendly analogies:

- “A toaster is a function: bread goes in, toast comes out.”  
- “A vending machine is a function: choose number + pay → drink appears.”

---

### 2. `add_numbers(a, b)` — Return values

Emphasise:

- The function does **not show anything** on the micro:bit.  
- It simply RETURNS a number.  
- Other code must decide what to do with that number.

Ask:

> “If add_numbers returns 1000, what could we use 1000 for?”

---

### 3. `flash_square(time_ms)` — Function with a parameter

Explain carefully:

- The function **expects** a value (time_ms).  
- If we use 300, the flash is quick.  
- If we use 1000, the flash is slow.  
- The function does not know where the number came from — it just uses it.

Show the nested call:

```
flash_square( add_numbers(600, 400) )
```

Explain:

- `add_numbers` runs first → returns `1000`.  
- Then we call `flash_square(1000)`.

This helps participants understand flow of execution.

---

### 4. `flash_heart()` — Function with no parameters

Explain:

- Not all functions need inputs.  
- Some are small reusable animations.  
- These keep the main program tidy.

---

### 5. Outputs triggered by buttons

Walk through:

- Button A → calls flash_square(300).  
- Button A+B → uses add_numbers to decide how long to pause.  
- Button B → shows a number created by add_numbers.

Reinforce:

> “A function is written once but used many times.”

---

# Part B — Space Invaders  
*(≈ 40–45 minutes)*

This project brings together:

- Functions  
- Sprites  
- Collisions  
- Repeated events  
- Accelerometer control  
- Timing  
- Projectiles (lasers & bombs)

It is one of the most complex projects in Autumn term — ideal for applying everything learned so far.

### Blocks version (MakeCode)

<div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S02862-67759-70499-11772" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe></div>

---

## B1 — TTC Pseudocode: Space Invaders

```text
SET Alien TO NEW SPRITE AT (0, 0)
SET Ship TO NEW SPRITE AT (2, 4)

EVERY 1 ms DO
    IF Alien.x = Ship.x THEN
        SET Alien brightness TO 1000
        SET Bomb TO NEW SPRITE AT (Alien.x, 0)
        REPEAT 5 TIMES
            PAUSE 200 ms
            MOVE Bomb DOWN BY 1
        END REPEAT

        IF Bomb IS TOUCHING Ship THEN
            GAME OVER
        END IF

        DELETE Bomb
    END IF
END EVERY

FOREVER DO
    MOVE Alien BY 1 STEP
    IF Alien ON EDGE THEN
        BOUNCE Alien
    END IF

    PAUSE 200 ms

    IF acceleration_x > 100 THEN
        MOVE Ship RIGHT BY 1
    END IF

    IF acceleration_x < -100 THEN
        MOVE Ship LEFT BY 1
    END IF
END FOREVER

WHEN button B is pressed DO
    SET Laser TO NEW SPRITE AT (Ship.x, Ship.y)

    REPEAT 5 TIMES
        PAUSE 100 ms
        MOVE Laser UP BY 1

        IF Laser IS TOUCHING Alien THEN
            DELETE Alien
            ADD 1 TO score
            SET Alien TO NEW SPRITE AT (0, 0)
        END IF
    END REPEAT

    DELETE Laser
END WHEN
```

---

## B2 — Verbose Instructor Explanation (Step‑by‑Step)

### 1. Setting up sprites

- **Alien** starts at the top left.  
- **Ship** starts at bottom centre.  
- They are sprites — objects with their own position and movement.

Ask:

> “Why do you think the ship begins at (2,4)?”

(Answer: centre of the bottom row gives room to dodge.)

---

### 2. Alien movement (FOREVER loop)

Break down:

- Alien moves horizontally.  
- When it hits an edge, it **bounces**.  
- Pause controls speed of movement.

Ask:

> “How would the game feel if we changed `PAUSE 200` to `PAUSE 50`?”

---

### 3. Ship movement using the accelerometer

Explain the conditions:

- If the micro:bit tilts right → acceleration_x > 100 → ship moves right.  
- Tilt left → acceleration_x < -100 → ship moves left.

This introduces **sensor‑driven input**.

Reinforce:

> “We aren’t pressing buttons — the ship moves because we tilt the micro:bit.”

---

### 4. Shooting (Button B)

Explain the laser logic:

1. Laser appears **where the ship currently is**.  
2. Moves up one row every 100 ms.  
3. Checks for collision with the Alien.  
4. If touching:  
   - delete Alien  
   - increase score  
   - respawn Alien at (0,0)

Important concept:

> “Projectiles usually have a lifetime: they are created, move, then get deleted.”

---

### 5. Alien bomb attack (loops.everyInterval)

Explain:

- Every 1 ms, code checks if Alien’s X matches Ship’s X.  
- This means **Alien is above the Ship** → time to drop a bomb.  
- Bomb moves *downwards* using a REPEAT loop.  
- If bomb hits the ship → GAME OVER.

Explain why this interval is separate:

> “Some things happen all the time, some only when conditions match. Separating them keeps the game responsive.”

---

### 6. Collision checks

Clarify:

- Touching is how the micro:bit knows two sprites overlap.  
- We use collision for:  
  - Laser hitting Alien  
  - Bomb hitting Ship  
  - Game ending

You can demonstrate by moving two fingers on a drawn 5×5 grid and showing where overlaps occur.

---

# Differentiation

**Support:**

- Provide simplified versions (no bombs, or no bounce).  
- Allow participants to only work on ship movement or laser logic.  
- Print pseudocode with highlighted steps to follow.

**Extend:**

- Add lives instead of one‑hit game over.  
- Add multiple aliens.  
- Add alien movement patterns (zig‑zag, cascades).  
- Add sound effects on shooting or hits.

---

# Assessment & Evidence of Learning

Look for:

- Participants explaining why we use **functions**.  
- Participants combining multiple ideas: sensors, loops, collisions, scoring.  
- Ability to describe what each sprite is doing and why.

Quick checks:

- “What does the laser do in the REPEAT loop?”  
- “How does the micro:bit know the bomb hit the ship?”  
- “What part of the code makes the Alien bounce?”

---

# Reflection & Wrap‑Up

End with a short discussion:

- “Was it useful to split the game into smaller parts?”  
- “How did functions make the first program easier to understand?”  
- “What was the trickiest part of Space Invaders?”  
- “If you could add one upgrade, what would it be?”

---

<div class="notice--steam">
  <h2>Connections to STEAM Learning</h2>
  <ul>
    <li><strong>Computing:</strong> Functions abstract behaviour; sprites show real‑time programming.</li>
    <li><strong>Maths:</strong> Coordinates, directions, conditions, rates of movement.</li>
    <li><strong>Physics:</strong> Accelerometer input demonstrates response to motion.</li>
    <li><strong>Engineering:</strong> Designing reliable logic for moving parts and collisions.</li>
  </ul>
</div>

{% include back-to-autumn.html %}
