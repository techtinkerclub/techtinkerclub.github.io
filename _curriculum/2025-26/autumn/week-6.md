---
layout: single
title: "Week 6 — Core Mechanics: Loops, Timing, Score & Coordinates"
permalink: /curriculum/2025-26/autumn/week-6/
week: 6
toc: true
toc_sticky: true
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

{% include back-to-autumn.html %}
{% include teacher-notes-link.html week=6 %}

## Week 6 — Core Mechanics: Loops, Timing, Score & Coordinates

**Focus Concept:** Game loop & difficulty  
**Mini-Project:** Barrel Jumper — iterative build (basic → speed-up)

This week we took last session’s start and turned it into a playable mini-game. We reviewed loops, coordinates, and movement, added a score, and linked game **speed** to the score so difficulty increases as you play.

---

## Objectives
- Review how **loops** (especially `forever`) keep a game running.
- Use **x/y coordinates** to move sprites left/right on the LED grid.
- Create and **increment** a **score** variable at the right moment.
- Control **speed** using `pause` and make the game faster as the score grows.
- Use simple **conditions** (e.g., edge checks or collisions) to react in the game.
- Understand why **pauses** are important for smooth motion.

---

## Success Criteria
- I can explain how a **forever loop** acts like the game’s heartbeat.
- I can move a sprite using **x** (left/right) and **y** (up/down) coordinates.
- I can **increment** the score when an event happens (e.g., reaching the edge).
- I can adjust **speed** so the game gets slightly harder over time.
- I can show **game over** (or a final score) when a simple condition is met.

---

## Key Vocabulary
- **Loop (forever)** — repeats code continuously while the program runs.  
- **Iteration** — one full pass through a loop.  
- **Variable** — a “box” that stores a value like `score` or `speed`.  
- **Increment** — increase a variable by a fixed amount (e.g., `change score by 1`).  
- **Coordinate** — a position on the LED grid: **x** = left↔right (0–4), **y** = up↕down (0–4).  
- **Condition** — a true/false check that decides what happens next.  
- **Speed / delay** — the pause time between updates; smaller pause = faster motion.

---

## What We Built (Step-by-Step)
1. **Recap movement** — move a sprite along the bottom row by changing **x**.  
2. **Add the game loop** — put movement inside a `forever` loop so it keeps updating.  
3. **Score** — create `score`; **increment** when an event happens (e.g., on reaching x = 0).  
4. **Speed-up** — create `speed` (e.g., 200 ms). After each score, do `change speed by -10`.  
5. **Simple ending** — show “game over” (or final score) when a condition is met.

> Timing idea we used:  
> 1 second = 1000 ms. If `pause` is 100 ms, that’s ~10 updates per second;  
> if `pause` is 50 ms, that’s ~20 updates per second.

---

## Try These Challenges
- **Sound FX:** play a short tone whenever the score increases.  
- **Minimum speed:** don’t let the game get too fast (e.g., stop at 60 ms).  
- **Edge rule:** only score when the sprite **reaches** an edge (not every step).  
- **Display score:** show the final score at the end of the game.

---

## Resources
- **MakeCode editor:** <https://makecode.microbit.org>  

---

## Equipment
- BBC micro:bits + USB cables (or simulator)  
- Chromebooks with internet access  
- Optional: speakers/headphones for sound effects

---

## Safety & Setup Notes
- Keep USB cables tidy and avoid pulling on connected micro:bits.  
- Test small changes often (download to device or use the simulator).  
- Only one MakeCode project tab at a time to prevent confusion.

---

{% include back-to-autumn.html %}
{% include teacher-notes-link.html week=6 %}
