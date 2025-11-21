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

{% include print-to-pdf.html %}

# Instructor Notes — Week 7

**Theme:** Functions and Game Mechanics  
**Focus Concept:** Breaking programs into reusable pieces (functions) and combining multiple systems (movement, collisions, timing)  
**Mini‑Projects:**  
- **Part A:** Understanding and using *functions*  
- **Part B:** Building a simplified *Space Invaders* game

---

## Learning Objectives

By the end of this session, participants should be able to:

- Read and explain **TTC‑style pseudocode** for functions and game logic.  
- Define and call **functions** with and without parameters.  
- Recognise when a function is useful for reusing repeated logic.  
- Understand how sprites move, detect collisions, and interact in real time.  
- Apply loops, conditions, variables, and timing together in a multi‑step game.

---

## Vocabulary Focus

- **function** – a reusable block of instructions that can be *called* from different places.  
- **parameter** – a value you give a function so it can work in a flexible way.  
- **return value** – what a function sends back to you when it finishes.  
- **event** – something the micro:bit reacts to (button press, interval).  
- **sprite** – a moving object on the LED grid.  
- **collision** – when two sprites touch.  
- **logic** – the set of rules a program follows when deciding what to do.

Use model sentences like:

> “This function needs a parameter to decide how long to pause.”  
> “The sprite moves up by changing its y‑position.”  
> “A collision happens when the laser touches the alien.”

---

# Part A — Functions (Understanding, Predicting, Building)

In this part, participants learn **what functions are**, **why we use them**, and **how to build them**.  
We introduce three example functions:

- `flashHeart()` – no parameters  
- `flashSquare(time)` – takes a parameter  
- `addNumbers(a, b)` – takes parameters and *returns* a value

### Blocks version (MakeCode)

<div class="makecode-embed">
  <div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S75217-00243-09727-56214" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe></div>
</div>

---

## A1 — TTC Pseudocode: Function Definitions

### `flashHeart`

```text
DEFINE FUNCTION flash_heart
    SHOW ICON heart
    PAUSE 200 ms
    SHOW ICON small_heart
    PAUSE 200 ms
END FUNCTION
```

### `flashSquare`

```text
DEFINE FUNCTION flash_square WITH parameter time
    SHOW ICON square
    PAUSE time
    SHOW ICON small_square
    PAUSE time
END FUNCTION
```

### `addNumbers`

```text
DEFINE FUNCTION add_numbers WITH parameters a, b
    RETURN a + b
END FUNCTION
```

---

## A2 — Event Handlers Calling Functions

```text
WHEN button A is pressed DO
    CALL flash_square WITH 300
END WHEN

WHEN button AB is pressed DO
    CALL flash_square WITH add_numbers(600, 400)
END WHEN

WHEN button B is pressed DO
    SHOW NUMBER add_numbers(33, 34)
END WHEN

CALL flash_heart
```

---

## A3 — Instructor Explanation (Verbose)

### What is a function?  
A function is like a reusable “recipe”. Instead of writing the same code over and over, you write it once, give it a name, and *call* it whenever you need it.

Explain using real life examples:  
- “Tying shoelaces” is a function.  
- “Making a sandwich” is a function.  
- “Showing a flashing heart” is a function.

### Why do we use parameters?  
Parameters make a function *adjustable*.  
`flashSquare(time)` becomes more powerful because the pause length can change.

### What is a return value?  
Some functions *give back* a result.  
Participants should understand this like a vending machine: you give input → you get output.

### Analysing each function  
- `flash_heart` – always the same effect, no parameters.  
- `flash_square(time)` – customisable; the time makes the square flash faster or slower.  
- `add_numbers(a, b)` – invisible on the LEDs, but useful for calculations.

### Linking to events  
- Button A → fixed timing flash  
- Button AB → flash using calculation  
- Button B → shows a number from a function  
- Finally `flash_heart` runs automatically on startup

### Key teaching point  
> “Functions help keep your code short, clean, and powerful.”

---

# Part B — Space Invaders Game Build

The second half of Week 7 uses everything learned so far:

- functions (optional extensions)  
- loops  
- conditions  
- collisions  
- sprite movement  
- timing

This project is split into clear steps so participants understand each mechanic.

### Blocks version (MakeCode)

<div class="makecode-embed">
<div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S02862-67759-70499-11772" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe></div>
</div>

---

# Part B1 — Setting Up the Sprites

## TTC Pseudocode

```text
SET Alien TO NEW SPRITE AT (0, 0)
SET Ship TO NEW SPRITE AT (2, 4)
```

## Instructor Notes

- `Alien` starts at the top-left corner.  
- `Ship` starts at the bottom of the screen (x = 2).  
- Both are sprites and can move.

Ask participants:
- “Why do you think the player ship starts at the bottom?”  
- “Where would be a silly place to put the alien?”

---

# Part B2 — Moving the Alien (FOREVER Loop)

## TTC Pseudocode

```text
FOREVER DO
    MOVE Alien BY 1 STEP
    IF Alien IS ON EDGE THEN
        BOUNCE Alien
    END IF

    PAUSE 200 ms

    IF [acceleration x] > 100 THEN
        CHANGE Ship x BY +1
    END IF

    IF [acceleration x] < -100 THEN
        CHANGE Ship x BY -1
    END IF
END FOREVER
```

## Instructor Notes (Verbose)

Explain each piece:

### Alien Movement
- `MOVE` makes the alien walk across the row.  
- `BOUNCE` flips direction when it hits the edge.  
- This creates the classic horizontal enemy movement.

### Ship Movement Using Tilt
- The ship moves right if the micro:bit is tilted right.  
- It moves left if tilted left.  
- Threshold (`100` and `-100`) prevents tiny shakes from moving the ship.

Great guiding questions:
- “What happens if we remove the thresholds?”  
- “How fast is the alien moving? Which number controls that?”

---

# Part B3 — Shooting with Button B (Laser Logic)

## TTC Pseudocode

```text
WHEN button B is pressed DO
    SET Laser TO NEW SPRITE AT (Ship.x, Ship.y)

    REPEAT 5 TIMES
        PAUSE 100 ms
        CHANGE Laser y BY -1

        IF Laser IS TOUCHING Alien THEN
            DELETE Alien
            INCREASE score BY 1
            SET Alien TO NEW SPRITE AT (0, 0)
        END IF
    END REPEAT

    DELETE Laser
END WHEN
```

## Instructor Notes (Verbose)

### How shooting works

- A new sprite appears *at the ship’s location*.  
- We move it upward (y decreases).  
- It moves step‑by‑step so players can see it travel.

### Collision Logic

When the laser touches the alien:

- Delete the alien  
- Increase score  
- Spawn a new alien at the top (basic respawn)

Key discussion points:
- “Why do we delete the laser at the end?”  
- “Why does the alien respawn at (0, 0)?”  
- “What would happen if we spawned it somewhere random instead?”

---

# Part B4 — Alien Dropping a Bomb

## TTC Pseudocode

```text
EVERY 1 ms DO
    IF Alien.x = Ship.x THEN
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

## Instructor Notes (Verbose)

### Why check if `Alien.x = Ship.x`?  
This means the alien is *above the ship* — the perfect moment to drop a bomb.

### Bomb behaviour
- Bomb falls straight down by increasing y.  
- It moves slowly so players have time to dodge.

### Collision
If the bomb touches the ship → **Game Over**.

Great questions:
- “How would the game change if a bomb dropped every 2 seconds instead?”  
- “What happens if the bomb is too fast?”

---

# Differentiation

## Support
- Provide printed TTC pseudocode for each part.  
- Let less confident participants implement **only movement** or **only shooting**.  
- Allow them to test collision using just one sprite.

## Extend
- Add sound effects for shooting or getting hit.  
- Add multiple aliens moving at different speeds.  
- Add shields or health points.  
- Randomise alien spawn positions.

---

# Assessment & Evidence of Learning

Look for participants who can:

- Explain what a function is and why we use parameters.  
- Trace how the laser travels and where collisions occur.  
- Predict what will happen if the alien’s speed or bomb timing changes.  
- Read TTC pseudocode and point to matching MakeCode blocks.

Quick questions:
- “Which part of the code controls the ship’s movement?”  
- “What condition makes the alien drop a bomb?”  
- “Where does the score increase?”

---

# Reflection & Wrap‑Up

End with a short discussion:

- “Where did we use functions today?”  
- “Why do games use lots of small pieces of logic instead of one big block?”  
- “If you could add one power‑up to the game, what would it be?”

Encourage participants to show their versions and talk through at least one decision they made.

---

{% include back-to-autumn.html %}
