---
layout: single
title: ""
permalink: /curriculum/2025-26/autumn/week-7/
week: 7
toc: true
toc_sticky: true
sidebar: false
header:
  overlay_image: /assets/images/banner.png
  show_overlay_excerpt: false
  show_overlay_text: false
---

{% include back-to-autumn.html %}
{% include teacher-notes-link.html week=7 %}

## Week 7 — Functions, Levels & Space Invaders

**Focus Concept:** Functions and game logic  
**Mini-Projects:** Advanced *Barrel Jumper* (with levels) → Mini *Space Invaders*

This week we revisited *Barrel Jumper* to explore how a game can become more dynamic using **variables**, **loops**, and a brand-new idea — **functions**.  
We then applied those ideas in a fast-paced *Space Invaders-style* challenge that used motion sensors, timing, and sprite collisions.

---

## Objectives
- Understand what a **function** is and how it keeps code tidy and reusable.  
- Use **variables** to manage **level**, **speed**, and **score**.  
- Apply **loops** to repeat movement and control game rhythm.  
- Detect and react to **collisions** between sprites.  
- Explore input from the **accelerometer** for movement control.  

---

## Success Criteria
- I can explain what a **function** does in a program.  
- I can make a game change **difficulty** automatically using maths and logic.  
- I can use the **accelerometer** or buttons to control sprites.  
- I can explain how the game loop updates the world every cycle.  
- I can make my own simple improvements (e.g. sound, new enemy, level message).

---

## Key Vocabulary
- **Function** — a mini-program that performs a specific job and can be called whenever needed.  
- **Variable** — a “box” that stores a value like `score`, `level`, or `speed`.  
- **Loop (forever)** — repeats code continuously while the game runs.  
- **Condition** — a true/false check that decides what happens next.  
- **Collision** — when two sprites touch each other on the grid.  
- **Respawn** — recreate an object after it’s been deleted or destroyed.  

---

## What We Built (Step-by-Step)

1. **Level System** — the game checks the score every few points; when it’s high enough, a **function** called `showLevelToast()` displays the new level and makes the game slightly faster.  
2. **Game Loop** — the *forever* loop moves the barrel, checks for collisions, updates the score, and calls the level function when needed.  
3. **Jump Logic** — button B makes the player move up and down in two short **for loops**, showing how loops save time and space in code.  
4. **Introducing Functions** — `showLevelToast()` is our first reusable function: it clears the screen, shows “L” + the level number, pauses, then returns to play.  
5. **Mini Space Invaders** — players tilt the micro:bit to move a ship and press B to fire a laser at an alien that bounces across the top row. If the alien lines up above the ship, it drops a bomb — and that’s *game over*!  

> We saw how similar ideas (movement, loops, variables, collisions) appear in many games — only the story changes.

---

## Try These Challenges
- Change how often levels increase (every 3 points instead of 5).  
- Add a short sound when the level changes or when the laser hits.  
- Randomise the alien’s starting x position to make it unpredictable.  
- Add a **“lives”** variable so the player gets 3 tries before game over.  
- Create a **shield** or **power-up** block using another function.

---

## Resources
- **MakeCode Editor:** [makecode.microbit.org](https://makecode.microbit.org){:target="_blank" rel="noopener"}  
- **Advanced Barrel Jumper code:** [MakeCode link](https://makecode.microbit.org/S50863-44059-71252-00559){:target="_blank" rel="noopener"}  
- **Game (sprites, collisions, levels) reference:** [Reference](https://makecode.microbit.org/reference/game){:target="_blank" rel="noopener"}  
- **BBC Bitesize – What are functions?** [Link](https://www.bbc.co.uk/bitesize/topics/zsjm7ty/articles/zj6rjhv){:target="_blank" rel="noopener"}  
- **STE(A)M careers in gaming:** [Video](https://youtu.be/dzQmbI5LmQI?si=wVgV52gKlP53VUEt){:target="_blank" rel="noopener"}  

---

## Equipment
- BBC micro:bits + USB cables (or simulator)  
- Chromebooks / laptops with internet  
- Optional speakers or headphones for sound effects  

---

## Safety & Setup Notes
- Keep USB cables untangled and micro:bits clear of drinks.  
- Test small changes often; use the simulator before downloading.  
- Only open one MakeCode project at a time to avoid confusion.  

---

{% include back-to-autumn.html %}
{% include teacher-notes-link.html week=7 %}

