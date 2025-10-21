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
**Mini-Projects:** *Advanced Barrel Jumper* → *Mini Space Invaders*

This week we explored how a function can simplify our code and make games more dynamic.  
We first revisited *Barrel Jumper* to understand **levels** and **speed**, then built a brand-new game where the player uses the **accelerometer** to move and fire at an alien.

---

## Objectives
- Understand what a **function** is and why we use it.  
- Use **variables** and **maths** to change speed and difficulty.  
- Detect **collisions** and respond to them in different ways.  
- Control sprites using **buttons** and the **accelerometer**.  
- Recognise how the same coding ideas can create completely different games.  

---

## Success Criteria
- I can describe what a **function** does and where I used one.  
- I can make a game get harder automatically as the **score** increases.  
- I can detect when two sprites **touch** and make something happen.  
- I can move sprites smoothly using loops, pauses, and conditions.  
- I can adapt familiar code to make a new type of game.  

---

## Key Vocabulary
- **Function** — a mini-program that performs one job and can be reused.  
- **Variable** — a box that stores a number or word such as `score`, `speed`, or `level`.  
- **Loop (forever)** — repeats instructions over and over.  
- **Condition** — a true/false check that decides what happens next.  
- **Collision** — when two sprites touch each other.  
- **Respawn** — recreate something (like a new alien) after it’s deleted.  

---

## Part A — Advanced Barrel Jumper

### What We Built (Step-by-Step)
1. **Game Loop:** keeps the barrel moving and checks for collisions with the jumper.  
2. **Jump Logic:** button B moves the jumper up 4 steps, then down 4, using two short loops.  
3. **Scoring & Speed:** each time the barrel reaches the edge, the score increases; every few points, the game speeds up slightly.  
4. **Level Function:** a function called `showLevelToast()` shows “L” + the current level and briefly pauses play — our first example of reusable code.  

> 💡 *This project introduced “function” as a key programming idea: one neat block of code that we can call any time we need it.*

### Try These Mini-Challenges
- Change the level-up rule (every 3 points instead of 5).  
- Add a sound when the level changes.  
- Prevent the game from becoming *too fast* (minimum pause = 60 ms).  

---

## Part B — Mini Space Invaders

### What We Built (Step-by-Step)
1. **Sprites:** created a `Ship` at the bottom and an `Alien` at the top.  
2. **Movement:** tilted the micro:bit left/right to move the ship; the alien moved sideways and bounced at the edges.  
3. **Shooting:** pressing B fired a `Laser` straight up; if it touched the alien, the alien disappeared, the score increased, and a new one spawned.  
4. **Bombs:** when the alien lined up with the ship, it dropped a `Bomb`; if the bomb touched the ship → **Game Over**.  

> 🔄 *This project reused ideas from Barrel Jumper — loops, variables, collisions — in a completely new style of gameplay.*

### Try These Mini-Challenges
- Randomise where the alien respawns (use `pick random 0 to 4`).  
- Add a “lives” variable (e.g. 3 lives before Game Over).  
- Add a short **laser sound** each time you shoot.  
- Make the alien move faster each time you score 5 points.  

---

## Resources
- **MakeCode Editor:** [makecode.microbit.org](https://makecode.microbit.org){:target="_blank" rel="noopener"}  
- **Advanced Barrel Jumper code:** [View project](https://makecode.microbit.org/S04773-39055-37520-43538){:target="_blank" rel="noopener"}  
- **Game (sprites, collisions, levels) reference:** [Reference](https://makecode.microbit.org/reference/game){:target="_blank" rel="noopener"}  
- **BBC Bitesize – What are functions?** [Link](https://www.bbc.co.uk/bitesize/topics/zsjm7ty/articles/zj6rjhv){:target="_blank" rel="noopener"}  
- **STE(A)M careers in gaming:** [Video](https://youtu.be/dzQmbI5LmQI?si=wVgV52gKlP53VUEt){:target="_blank" rel="noopener"}  

---

## Equipment
- BBC micro:bits + USB cables (or simulator)  
- Chromebooks / laptops with internet  
- Optional: speakers or headphones for sound effects  

---

## Safety & Setup Notes
- Keep USB cables tidy and test in the simulator first.  
- Work in pairs when debugging — one reads code, one tests.  
- Save and name projects clearly before starting the new one.  

---

{% include back-to-autumn.html %}
{% include teacher-notes-link.html week=7 %}
