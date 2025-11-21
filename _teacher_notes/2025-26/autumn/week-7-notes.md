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

**Theme:** Functions & Game Mechanics  
**Focus Concept:** Defining and using functions; building Space Invaders  
**Mini‑Project:** Two‑part lesson — (A) Functions exploration, (B) Space Invaders game

---

## Learning Objectives

- Understand what a **function** is and why we use it.  
- Define functions with **parameters** and **return values**.  
- Call functions from button events and use their outputs.  
- Apply functions inside a game project (Space Invaders).  
- Work with sprites, movement, collision, and sensors.

---

## Vocabulary Focus

- **function** — a named block of code you can run any time.  
- **parameter** — information you pass *into* a function.  
- **return value** — information a function gives *back*.  
- **sprite** — an object that moves on the LED grid.  
- **collision** — when two sprites touch.  
- **accelerometer** — motion sensor that measures tilt.  
- **loop** — repeats actions over time (FOREVER, REPEAT, intervals).

---

# Part A — Understanding Functions

### Blocks version (MakeCode)

<div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S75217-00243-09727-56214" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe></div>

---

## A1 — TTC‑Style Pseudocode for Functions Demo

### Function: addNumbers

```
DEFINE FUNCTION addNumbers (num, num2)
    RETURN num + num2
END FUNCTION
```

### Function: flashSquare

```
DEFINE FUNCTION flashSquare (duration)
    SHOW ICON big_square
    PAUSE duration
    SHOW ICON small_square
    PAUSE duration
END FUNCTION
```

### Function: flashHeart

```
DEFINE FUNCTION flashHeart
    SHOW ICON heart
    PAUSE 200
    SHOW ICON small_heart
    PAUSE 200
END FUNCTION
```

### Button events

```
WHEN button A is pressed DO
    CALL flashSquare (300)
END WHEN

WHEN button AB is pressed DO
    CALL flashSquare ( addNumbers(600, 400) )
END WHEN

WHEN button B is pressed DO
    SHOW NUMBER ( addNumbers(33, 34) )
END WHEN

CALL flashHeart
```

---

## A2 — Verbose Instructor Explanation

### 1) What is a function?

A **function** is a reusable mini‑program.  
It lets participants write something once and use it many times.

Explain:

- “Functions help us avoid repeating code.”  
- “Functions make your programs cleaner and easier to understand.”  
- “Functions can *do* something or *return* something.”

### 2) addNumbers — introducing *return values*

Walk through line‑by‑line:

- The function takes **two numbers** (`num`, `num2`).  
- It calculates the sum.  
- It *returns* that result.  
- Nothing is shown — the function just gives a number back.

Show examples on the board:

`addNumbers(3, 5)` → 8  
`addNumbers(10, -2)` → 8  
`addNumbers(600, 400)` → 1000

Reinforce:

> “A return value behaves just like a number you typed into the program.”

### 3) flashSquare — introducing *parameters*

Explain:

- The function needs to know *how long* to show each shape.  
- That value is the **parameter** called `duration`.  
- Different button presses use different values, so the animation changes.

Good guiding question:

- “What would happen if we used 50 instead of 300?”

### 4) flashHeart — a simple no‑parameter function

This function:

- Takes no inputs  
- Does a fixed animation  
- Is called once at the bottom of the program

Highlight the idea:

> “A function doesn’t need parameters.  
> It can also be used just to organise your code.”

### 5) Buttons calling functions

Show how each button triggers a function:

- Button A → flashSquare(300)  
- Button AB → flashSquare(addNumbers(600, 400))  
- Button B → showNumber(addNumbers(33, 34))

Explain how functions can be **combined**:

> “addNumbers runs first, gives back a number,  
> and that number becomes the parameter for flashSquare.”

### 6) Why functions matter for games

Explain clearly:

- Games often have animations (like explosions or damage flashes).  
- Instead of rewriting the animation many times, we put it in a function.  
- Functions help keep big game projects manageable.

Transition to Part B:

> “Now we’ll use functions and everything we’ve learned about loops, sprites, and sensors to build our Space Invaders game.”

---

# Part B — Space Invaders Game

### Blocks version (MakeCode)

<div style="position:relative;height:calc(300px + 5em);width:100%;overflow:hidden;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://makecode.microbit.org/---codeembed#pub:S02862-67759-70499-11772" allowfullscreen="allowfullscreen" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe></div>

---

## B1 — TTC‑Style Pseudocode: Space Invaders (Full Game)

### ON START

```
SET Alien TO NEW SPRITE AT (0, 0)
SET Ship TO NEW SPRITE AT (2, 4)
```

### Button B — Firing a Laser

```
WHEN button B is pressed DO
    SET Laser TO NEW SPRITE AT (Ship.x, Ship.y)

    REPEAT 5 TIMES
        PAUSE 100 ms
        MOVE Laser UP BY 1

        IF Laser IS TOUCHING Alien THEN
            DELETE Alien
            INCREASE score BY 1
            SET Alien TO NEW SPRITE AT (0, 0)
        END IF
    END REPEAT

    DELETE Laser
END WHEN
```

### Bomb Dropping Logic (Runs every 1 ms)

```
EVERY 1 ms DO
    IF Alien.x = Ship.x THEN
        SET Alien BRIGHTNESS TO 1000

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
```

### Alien Movement (FOREVER)

```
FOREVER DO
    MOVE Alien BY 1 STEP
    IF Alien IS ON EDGE THEN
        BOUNCE Alien
    END IF

    PAUSE 200 ms

    IF Ship TILTED RIGHT THEN
        MOVE Ship RIGHT BY 1
    END IF

    IF Ship TILTED LEFT THEN
        MOVE Ship LEFT BY 1
    END IF
END FOREVER
```

---

## B2 — Verbose Instructor Explanation (Very Detailed)

### 1) Game Setup — Sprites and Starting Positions

Explain:

- The **Alien** begins at the top‑left corner.  
- The **Ship** begins at the bottom centre (`(2, 4)`).  
- Both are sprites, which means they have:
  - x and y coordinates  
  - movement direction  
  - brightness  
  - built‑in collision detection  
  - delete / create behaviours

Use the whiteboard to mark the 5×5 grid and show coordinates.

### 2) Shooting (Button B)

Break it down:

- When Button B is pressed, the code creates a new **Laser** sprite at the Ship’s exact position.  
- The Laser moves upward by decreasing its `y` position.  
- It moves in a controlled loop:
  - 5 steps  
  - 100 ms pause between each  
  - deletes itself at the end so it doesn’t clutter the board

Explain collision:

- If Laser touches Alien at any time:
  - Alien is destroyed  
  - Score increases  
  - A new Alien respawns at top‑left  
  - (This mimics classic Space Invaders)

Good questions:

- “What happens if we increase the number of loop steps?”  
- “What happens if the Alien moves faster than the laser?”

### 3) The Bomb Logic — WHY everyInterval?

Explain carefully:

- We want the Alien to drop a bomb **only when it is aligned** with the Ship.  
- Checking Alien.x = Ship.x needs to happen frequently.  
- loops.everyInterval(1, …) is MakeCode’s way to run a piece of code *very often*, almost like a mini‑FOREVER loop with timing.

Walk through what happens:

1. Alien moves left-right in FOREVER loop.  
2. everyInterval checks constantly:  
   - “Are the x positions the same?”  
3. If YES:  
   - Alien glows bright  
   - Bomb appears at Alien’s column  
   - Bomb falls 5 steps  
4. If Bomb touches Ship → **game over**

Explain visually with arrows:

Alien  
↓  
Bomb  
↓  
Ship

### 4) Alien Movement (FOREVER Loop)

Explain step-by-step:

- Alien moves horizontally by 1 step.  
- When it reaches the LED edge, `ifOnEdgeBounce` reverses its direction.  
- This creates the classic “pacing” movement.

Ask participants:

- “What would happen if we removed the bounce?”  
- “What if we changed pause 200 ms to pause 50 ms?”  

Explain accelerometer control:

- The micro:bit senses tilt using the **accelerometer**.  
- If tilted right:
  - Ship moves right  
- If tilted left:
  - Ship moves left  
- Values above +100 or below −100 work like thresholds.

This allows hands‑on gameplay: tilting the micro:bit to move the ship.

### 5) Putting It All Together

Explain:

- Three systems run at once:  
  1. Shooting (event-driven)  
  2. Bomb dropping (interval-based)  
  3. Alien movement + tilt control (FOREVER loop)

Highlight:

> “Games are made of separate systems running at the same time.  
> That’s why events, loops, and intervals are so important.”

---

# Differentiation

### Support

- Give learners partially completed code with missing pieces.  
- Allow some to build only the laser or only the bombs.  
- Provide pre-labelled grid printouts for coordinate reasoning.

### Extend

- Add multiple aliens.  
- Add shield blocks.  
- Add sound effects for shooting and explosions.  
- Add lives instead of immediate game over.  
- Add levels with faster movement.

---

# Assessment & Evidence of Learning

Look for:

- Explaining what a parameter is.  
- Explaining what a return value is.  
- Correctly using functions in button events.  
- Reasoning about sprite positions and collisions.  
- Debugging movement issues by checking coordinates.

---

# Troubleshooting

- **Laser doesn’t move:** Check REPEAT loop or direction.  
- **Alien never drops bombs:** Check Alien.x = Ship.x condition.  
- **Ship doesn’t move:** Check accelerometer thresholds.  
- **Alien gets stuck:** Check ifOnEdgeBounce placement.

---

# Reflection & Wrap‑Up

Discussion prompts:

- “Why are functions helpful in games?”  
- “Which part of Space Invaders was hardest to debug?”  
- “How do events, loops, and intervals work together?”  
- “If you continued next week, what would you add to the game?”

---

{% include back-to-autumn.html %}
