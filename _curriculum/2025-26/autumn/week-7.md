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
**Mini-Projects:** *Function Challenges* → *Mini Space Invaders*

This week we explored how **functions** help us keep code tidy and reusable.  
We first built and tested small examples of functions — from simple ones that just run a few lines, to ones that use **inputs** (parameters) or even **return** results.  
After learning how they work, we revisited *Barrel Jumper* to see how a function can show the **level** or **speed-up** message, and then moved on to a new challenge game using the **accelerometer**.

---

## Objectives
- Understand what a **function** is and why we use it.  
- Create and call simple functions to group repeated actions.  
- Use **parameters** to make a function work in different ways.  
- Recognise how a function can simplify larger games.  
- Detect **collisions** and respond with variables and conditions.  
- Control sprites using **buttons** and the **accelerometer**.  

---

## Success Criteria
- I can explain what a **function** does and when it runs.  
- I can create a function that repeats an action or shows a message.  
- I can use a **parameter** inside a function to change how it behaves.  
- I can describe how functions make my program easier to read.  
- I can reuse my function in a different part of the game.  

---

## Key Vocabulary
- **Function** — a mini-program that performs one job and can be reused.  
- **Call** — the moment your program tells a function to run.  
- **Parameter** — information passed *into* a function.  
- **Return** — a value that a function sends *back*.  
- **Variable** — a box that stores a number or word such as `score`, `speed`, or `level`.  
- **Condition** — a true/false check that decides what happens next.  
- **Collision** — when two sprites touch each other.  

---

## Part A — Function Challenges & Barrel Jumper Extension

### What We Explored
1. **Static Function:**  
   A short function that performs a single action when called, for example flashing an icon or showing a message.  
   → *Helps remove repeated code.*

2. **Function with Parameter:**  
   A reusable version that accepts an **input**, such as the number of flashes or the level to show.  
   → *Same code, flexible results.*

3. **Function with Return Value:**  
   A more advanced example where the function works out an answer (for example adding two numbers) and **returns** it to be used later.  
   → *Used to pass information back into the program.*

4. **Applying It in Games:**  
   In *Advanced Barrel Jumper*, we used a function to display a “Level Up” message whenever the score reached a multiple of 5.  
   The function could also play a short tone or slow down the barrel briefly before restarting the game loop.

> 💡 *Functions keep your code neat — write once, use many times!*

### Try These Mini-Challenges
- Make a function `flash(times)` that blinks an icon a chosen number of times.  
- Create a function `showLevel(level)` that prints the level number and plays a sound.  
- Modify the Barrel Jumper project so that the level-up rule changes automatically (for example, every 3 points).  
- Prevent the game from becoming *too fast* by adding a minimum delay in your loop.  

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
- **Functions in coding** [Video](https://youtu.be/whqjRte86J4?si=YJ7L1_Nau4jytg1e){:target="_blank" rel="noopener"}  
- **Makecode Functions:** [Video](https://youtu.be/1LACtv9XvXQ?si=h9IoVpsalwd7i-BR){:target="_blank" rel="noopener"}
- **BBC Bitesize - KS2 Algebra and function machines:** [Link](https://www.bbc.co.uk/bitesize/articles/zsmgvwx){:target="_blank" rel="noopener"}
- **Maths funcfion machines (solved examples):** [Video](https://youtu.be/akj9L0HaTY4?si=hAhCA8pp1-iskAvo){:target="_blank" rel="noopener"}  

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
