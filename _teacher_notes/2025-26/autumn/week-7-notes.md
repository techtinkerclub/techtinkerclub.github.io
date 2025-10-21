---
layout: single
title: ""
permalink: /teacher-notes/2025-26/autumn/week-7-notes/
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
{% include print-to-pdf.html %}

**Theme:** Functions, Levels & Game Logic  
**Focus Concept:** Introducing Functions and Reusing Code  
**Mini-Projects:** *Advanced Barrel Jumper* (Part A) → *Mini Space Invaders* (Part B)

---

## Learning Objectives
- Participants understand that a **function** is a helper mini-program that performs one clear job and can be called whenever needed.  
- Participants use **variables** (`score`, `speed`, `level`, optionally `lives`) to control gameplay.  
- Participants apply **loops** and **conditions** to manage movement, timing, and collisions.  
- Participants recognise how the **same ideas** (loops, variables, conditions, functions) can power very different games.  
- Participants connect code behaviour with **maths** (timing, division/rounding) and **science** (motion/acceleration via the micro:bit accelerometer).

---

## Recap (≈10 min)
- Week 6 built a continuous **game loop** and linked **speed** to **score**.  
- This week adds **functions** for tidy, reusable behaviour; then we reuse everything in a new tilt-controlled shooter.

On the board:

> A **function** is a named helper that “does one job”.  
> We **call** it instead of repeating the same blocks everywhere.

Prompt:
- *“Where might a helper be useful?”* (showing the level, resetting a round, playing a short message/sound)

---

## Part A — Advanced Barrel Jumper (≈35 min)

### Step 1 — Setup & Variables
Explain sprites, coordinates, and timing. Build the start state.

**Pseudocode (blocks description):**
    create jumper at bottom-left
    create barrel at bottom-right
    set score = 0
    set level = 1
    set speed = 200 milliseconds   # smaller = faster
    (optional) show a short splash pattern, then clear

**Maths link:**  
1000 ms ÷ 200 ms ≈ 5 updates/second.  
Each new level subtracts ~5 ms → gradual difficulty ramp.

---

### Step 2 — Jump Action (Button B)
**Pseudocode:**
    when button B pressed:
        repeat 4 times:
            move jumper up by 1 row
            pause 100 ms
        repeat 4 times:
            move jumper down by 1 row
            pause 100 ms

**Instructor tips**
- Two short repeats replace eight separate moves.  
- Let participants try 50 ms vs 150 ms and compare feel.

---

### Step 3 — Forever Loop (Game Engine)
**Pseudocode:**
    forever:
        move barrel forward by 1
        if barrel hits edge: bounce
        if jumper is touching barrel:
            end game
            show "Score:" and the score

        if barrel x == 0:
            increase score by 1

        intendedLevel = 1 + floor(score ÷ 5)
        if intendedLevel > level:
            level = intendedLevel
            speed = speed - 5            # clamp later so it never gets too fast
            call showLevelToast()

        pause for (speed) milliseconds

Emphasise:
- **speed** is a **delay** between updates; smaller delay = faster game.
- We **compute** the level from score (every 5 points).

---

### Step 4 — Function: `showLevelToast`
**Pseudocode (define once, then call):**
    define function showLevelToast:
        clear screen
        show letter "L"
        show number (level)
        pause briefly
        clear screen
    end function

Notes:
- Using a function keeps level-up behaviour in **one place** (readable + easy to edit).

---

### Step 5 — Mini-Challenges (≈5 min)
- Change level rule to every **3** points.  
- Add a short sound on level-up.  
- Add a **minimum speed** guard (e.g., don’t let speed go below 60 ms).

Discussion prompts:
- *“Why do we pause while showing the level?”* (So players can see it; prevents movement during the toast.)  
- *“What happens if speed gets too small?”*

---

## Part B — Mini Space Invaders (≈45 min)

### Step 1 — Sprites & Setup
**Pseudocode:**
    create Ship at (x=2, y=4)         # bottom centre
    create Alien at (x=0, y=0)        # top row
    make variables: Laser, Bomb
    set score = 0

Notes:
- Compare with Barrel Jumper: obstacle at top, player at bottom, same 5×5 grid.

---

### Step 2 — Alien Movement (Forever)
**Pseudocode:**
    forever:
        move Alien by 1 to the right
        pause 200 ms
        if Alien hits edge: bounce

Link back:
- Same idea as the barrel movement loop, just a different story.

---

### Step 3 — Ship Control (Tilt)
**Pseudocode (can be inside a forever or as separate checks):**
    if tilt right (acceleration X > 100):
        move Ship right by 1
    if tilt left (acceleration X < -100):
        move Ship left by 1
    (optional) clamp Ship x between 0 and 4

Science link:
- The accelerometer senses **gravity/tilt** → real-world physics input.

---

### Step 4 — Fire a Laser (Button B)
**Pseudocode:**
    when button B pressed:
        create Laser at (Ship x, Ship y)
        repeat 5 times:
            pause 100 ms
            move Laser up by 1 row
            if Laser is touching Alien:
                delete Alien
                increase score by 1
                create Alien at (random x 0..4, y=0)   # respawn at top
        delete Laser

Notes:
- The grid height is 5 rows → repeat 5 steps to reach the top.
- Introduce the word **respawn**.

---

### Step 5 — Alien Drops a Bomb (Forever)
**Pseudocode:**
    forever:
        if Alien x == Ship x:     # lined up above the Ship
            create Bomb at (Alien x, y=0)
            repeat 5 times:
                pause 200 ms
                move Bomb down by 1 row
            if Bomb is touching Ship:
                end game
            delete Bomb

Compare:
- Symmetry with the Laser, but in the opposite direction.

---

### Step 6 — Extensions (if time)
- Add a `lives` variable (start at 3; on hit, reduce by 1; only game over at 0).  
- Add sound effects for **laser** and **hit**.  
- Increase alien speed every 5 points (reduce the pause or add a level system).  
- Create a **function** that shows a “Level Up!” or “Wave Cleared!” message (reusing the Barrel Jumper idea).

---

## Vocabulary Focus
| Term | Child-friendly definition |
|------|---------------------------|
| **Function** | A named helper that does one job; we can call it any time. |
| **Variable** | A box that stores a value for later (e.g., score, speed, level). |
| **Loop (forever / repeat)** | Runs instructions again and again. |
| **Condition** | A yes/no test that decides what happens next. |
| **Collision** | When two sprites touch on the grid. |
| **Respawn** | Create a new object after the old one was deleted. |

---

## Differentiation
- **Beginners:** follow the guided build; focus on jump + basic laser.  
- **Confident:** tweak level maths, add sounds, clamp speed, randomise spawns.  
- **Stretch:** add lives, second alien, or a reusable **function** for messages/power-ups.

---

## Assessment & Reflection
- Can participants explain **what a function is** and **where they used one**?  
- Can they describe how **speed (pause)** affects difficulty?  
- Can they show where **variables** change and **why**?  
- Can they explain the **difference between looping** and **calling a function**?  
- Observe teamwork, debugging strategies, and safe handling of devices.

---

## Common Mistakes
- Calling a function before it exists (define it first).  
- Deleting sprites **before** checking collisions.  
- Using coordinates outside 0–4 (sprites seem to “vanish”).  
- Making `speed` too small → game unreadable.

---

## Materials & Setup
- BBC micro:bits + USB cables (or classroom use of the simulator)  
- Chromebooks/laptops with internet access  
- Optional speakers/headphones for SFX

---

## Safety & Safeguarding
- Keep cables tidy; keep drinks away from devices.  
- Use sensible volume for any sounds.  
- Encourage turn-taking, pair programming, and peer support.

---

## Cross-Curricular Links
| Subject | Connection |
|--------|------------|
| **Maths** | Timing (milliseconds), division/rounding for level maths, incremental change. |
| **Science** | Forces and motion via the **accelerometer**; cause/effect in physical systems. |
| **Design & Technology** | Plan → build → test → iterate (game design cycle). |
| **PSHE / Teamwork** | Communication, resilience, sharing devices, helping peers.

---

## KS2 Computing Curriculum Mapping
| Strand | Evidence in Session |
|-------|---------------------|
| **Programming A — Sequence** | Ordered actions for jumping, shooting, bomb dropping. |
| **Programming B — Repetition** | `forever` loops and `repeat` structures drive movement and timing. |
| **Programming C — Variables** | `score`, `speed`, `level`, optional `lives` manage game state. |
| **Programming D — Selection** | `if touching`, `if x == …`, `if score/level …` create branching logic. |
| **Programming E — Modifying/Creating Programs** | Debugging and extending both games with new rules and effects. |

---

{% include back-to-autumn.html %}
