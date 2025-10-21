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
- Participants understand that a **function** is a helper mini-program that performs one clear job and can be called when needed.  
- Participants use **variables** (`score`, `speed`, `level`, optionally `lives`) to control gameplay.  
- Participants apply **loops** and **conditions** to manage movement, timing, and collisions.  
- Participants recognise how the same ideas (loops, variables, conditions, functions) power very different games.  
- Participants connect behaviour with **maths** (timing, division/rounding) and **science** (motion/acceleration with the micro:bit accelerometer).

---

## Recap (≈10 min)
Write on the board:

> A **function** is a named helper that “does one job”. We **call** it instead of repeating the same blocks everywhere.

Prompt: *Where might a helper be useful?* (showing the level, resetting a round, short message/sound)

---

## Part A — Advanced Barrel Jumper (≈35 min)

### Step 1 — Setup & Variables
**Pseudocode (blocks-style):**
- `create jumper at bottom-left`  
- `create barrel at bottom-right`  
- `set score = 0`  
- `set level = 1`  
- `set speed = 200 ms` *(smaller = faster)*  
- *(optional)* `show splash pattern → clear`

**Maths link:** *1000 ms ÷ 200 ms ≈ 5 updates/second. Each new level subtracts ~5 ms → gradual ramp.*

---

### Step 2 — Jump Action (Button B)
**Pseudocode:**
- `when button B pressed → repeat 4: move jumper up 1; pause 100 ms`  
- `repeat 4: move jumper down 1; pause 100 ms`

**Instructor tips:** two repeats replace eight moves; try 50 ms vs 150 ms to compare “feel”.

---

### Step 3 — Forever Loop (Game Engine)
**Pseudocode:**
- `forever:`  
  - `move barrel forward 1`  
  - `if barrel hits edge → bounce`  
  - `if jumper touching barrel → end game → show "Score:" + score`  
  - `if barrel x == 0 → score = score + 1`  
  - `intendedLevel = 1 + floor(score ÷ 5)`  
  - `if intendedLevel > level → level = intendedLevel; speed = speed - 5; call showLevelToast()`  
  - `pause (speed)`

**Emphasise:** `speed` is a **delay**; smaller delay = faster gameplay.

---

### Step 4 — Function: `showLevelToast`
**Pseudocode (define once, then call):**
- `define function showLevelToast:`  
  - `clear screen`  
  - `show "L"`  
  - `show (level)`  
  - `pause briefly`  
  - `clear screen`  
- `end function`

**Why a function?** Keeps level-up behaviour in one place — readable and easy to change.

---

### Step 5 — Mini-Challenges (≈5 min)
- Level every **3** points (not 5).  
- Add a **sound** on level-up.  
- Add a **minimum speed** guard (e.g., don’t let `speed < 60 ms`).  

**Discuss:** *Why pause during the level toast?* (so players can read it) • *What happens if speed gets too small?*

---

## Part B — Mini Space Invaders (≈45 min)

### Step 1 — Sprites & Setup
**Pseudocode:**
- `create Ship at (2,4)` *(bottom centre)*  
- `create Alien at (0,0)` *(top row)*  
- `make variables: Laser, Bomb`  
- `set score = 0`

*Compare with Barrel Jumper: same 5×5 grid; player at bottom, threat at top.*

---

### Step 2 — Alien Movement (Forever)
**Pseudocode:**
- `forever: move Alien right 1 → pause 200 ms → if edge → bounce`

*Same structure as the barrel loop — different story.*

---

### Step 3 — Ship Control (Tilt)
**Pseudocode:**
- `if accel X > 100 → Ship x = Ship x + 1`  
- `if accel X < -100 → Ship x = Ship x - 1`  
- *(optional)* `clamp Ship x to 0..4`

**Science link:** accelerometer senses gravity/tilt → physics input.

---

### Step 4 — Fire a Laser (Button B)
**Pseudocode:**
- `when button B pressed:`  
  - `create Laser at (Ship x, Ship y)`  
  - `repeat 5: pause 100 ms; move Laser up 1`  
  - `if Laser touching Alien → delete Alien; score = score + 1; create Alien at (random x 0..4, y=0)` *(respawn)*  
  - `delete Laser`

*Grid height = 5 rows → 5 steps.*

---

### Step 5 — Alien Drops a Bomb (Forever)
**Pseudocode:**
- `forever:`  
  - `if Alien x == Ship x:`  
    - `create Bomb at (Alien x, 0)`  
    - `repeat 5: pause 200 ms; move Bomb down 1`  
    - `if Bomb touching Ship → game over`  
    - `delete Bomb`

*Symmetry with the laser, but downward.*

---

### Step 6 — Extensions (if time)
- `lives` variable (start 3; −1 on hit; game over at 0).  
- Sound effects for **laser** and **hit**.  
- Increase alien speed every 5 points (reduce pause or add a level system).  
- A **function** to show “Level Up!” or “Wave Cleared!” messages.

---

## Vocabulary Focus
| Term | Child-friendly definition |
|------|---------------------------|
| **Function** | A named helper that does one job; call it any time. |
| **Variable** | A box storing a value (e.g., `score`, `speed`, `level`). |
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
- Can they explain **looping vs calling a function**?  
- Observe teamwork, debugging strategies, and safe device handling.

---

## Common Mistakes
- Calling a function before it exists (define it first).  
- Deleting sprites **before** checking collisions.  
- Using coordinates outside `0–4` (sprites “vanish”).  
- Making `speed` too small → unreadable gameplay.

---

## Materials & Setup
- BBC micro:bits + USB cables (or simulator)  
- Chromebooks/laptops with internet access  
- Optional speakers/headphones for SFX

---

## Safety & Safeguarding
- Keep cables tidy; drinks away from devices.  
- Sensible volume for sounds.  
- Encourage turn-taking, pair programming, and peer support.

---

## Cross-Curricular Links
| Subject | Connection |
|--------|------------|
| **Maths** | Timing (milliseconds), division/rounding for level maths, incremental change. |
| **Science** | Forces and motion via the **accelerometer**; cause/effect in physical systems. |
| **Design & Technology** | Plan → build → test → iterate (game design cycle). |
| **PSHE / Teamwork** | Communication, resilience, sharing devices, helping peers. |

---

## KS2 Computing Curriculum Mapping
| Strand | Evidence in Session |
|-------|---------------------|
| **Programming A — Sequence** | Ordered actions for jumping, shooting, bomb-dropping. |
| **Programming B — Repetition** | `forever` loops and `repeat` structures drive movement and timing. |
| **Programming C — Variables** | `score`, `speed`, `level`, optional `lives` manage game state. |
| **Programming D — Selection** | `if touching`, `if x == …`, `if score/level …` create branching logic. |
| **Programming E — Modifying/Creating Programs** | Debugging and extending both games with new rules and effects. |

---

{% include back-to-autumn.html %}
