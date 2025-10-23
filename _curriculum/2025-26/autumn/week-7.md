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

## Week 7 — Functions, Inputs & Space Invaders

**Focus Concept:** Functions and game logic  
**Mini-Projects:** *Function Challenges* → *Mini Space Invaders*

This week we explored how **functions** can make our programs cleaner, faster to edit, and easier to reuse.  
Participants first created small examples of functions to see how they work, then applied the same ideas in a larger game that used the **accelerometer** and **collisions**.

---

## Objectives
- Understand what a **function** is and why we use it.  
- Create and call functions to group repeated actions.  
- Use **parameters** to make a function behave differently.  
- Explore how a function can return a result.  
- Apply loops, variables and conditions inside a larger game.  
- Control sprites using **buttons** and the **accelerometer**.  

---

## Success Criteria
- I can explain what a **function** does and when it runs.  
- I can create my own function that performs a short task.  
- I can add **parameters** so a function can change what it does.  
- I can describe how functions keep code tidy and reusable.  
- I can reuse my helper function in another project.  

---

## Key Vocabulary
- **Function** — a named group of code that runs together to do one specific job. Programmers use functions to reuse code and keep programs tidy.  
- **Call** — when your program *tells* a function to run.  
- **Parameter** — information you *send into* a function so it knows what to do.  
- **Return** — a value a function *sends back* after it finishes.  
- **Variable** — a labelled box that stores a number or word such as `score`, `speed`, or `level`.  
- **Condition** — a true/false test that decides what happens next.  
- **Collision** — when two sprites touch each other.  
- **Accelerometer** — a sensor inside the micro:bit that detects tilt, movement, and direction.  
- **Axis** — one of the directions used to describe positions on the LED grid (**X** for left–right, **Y** for up–down).  
- **Coordinate** — the pair of numbers (**X**, **Y**) that tell you exactly where a sprite or LED is on the screen.  
- **Threshold** — a limit or boundary value that triggers an action (like moving only when the tilt is greater than 200).  
  
---

## Part A — Function Challenges

### What We Explored
1. **Simple Function** — a short reusable block (e.g. flash an icon, play a tone).  
   → *Shows how to avoid repeating the same code.*

2. **Function with Parameter** — takes input, such as how many times to flash or which icon to show.  
   → *Same recipe, flexible results.*

3. **Function with Return Value** — calculates something and gives the answer back (e.g. add two numbers).  
   → *Lets other parts of the code use the result.*

4. **Combining Functions** — several small helpers can work together, like one that displays a message and another that plays a sound.  
   → *Builds the habit of modular thinking.*

> 💡 *Functions are like reusable tools — once built, you can use them in any project.*

### Try These Mini-Challenges
- Make a function `flash(times)` that blinks an icon a chosen number of times.  
- Create a function `showMessage(text)` that scrolls a message.  
- Write a function `addNumbers(a, b)` that returns their sum and shows it.  
- Combine two functions: one plays a tone, one flashes a light — call both together for an alert effect.  

---

## Part B — Mini Space Invaders

### What We Built (Step-by-Step)
1. **Sprites:** created a `Ship` at the bottom and an `Alien` at the top.  
2. **Movement:** tilted the micro:bit left/right to move the ship; the alien moved sideways and bounced at the edges.  
3. **Shooting:** pressing B fired a `Laser` straight up; if it touched the alien, the alien disappeared, the score increased, and a new one spawned.  
4. **Bombs:** when the alien lined up with the ship, it dropped a `Bomb`; if the bomb touched the ship → **Game Over**.  

> 🔄 *This project reused ideas from previous weeks — loops, variables, collisions — in a completely new style of gameplay.*

### Try These Mini-Challenges
- Randomise where the alien respawns (use `pick random 0 to 4`).  
- Add a “lives” variable (e.g. 3 lives before Game Over).  
- Add a short **laser sound** each time you shoot.  
- Make the alien move faster each time you score 5 points.  

---

## Resources
- **MakeCode Editor:** [makecode.microbit.org](https://makecode.microbit.org){:target="_blank" rel="noopener"}  
- **Functions in coding** [Video](https://youtu.be/whqjRte86J4?si=YJ7L1_Nau4jytg1e){:target="_blank" rel="noopener"}  
- **MakeCode Functions:** [Video](https://youtu.be/1LACtv9XvXQ?si=h9IoVpsalwd7i-BR){:target="_blank" rel="noopener"}  
- **BBC Bitesize – KS2 Algebra and Function Machines:** [Link](https://www.bbc.co.uk/bitesize/articles/zsmgvwx){:target="_blank" rel="noopener"}  
- **Maths function machines (solved examples):** [Video](https://youtu.be/akj9L0HaTY4?si=hAhCA8pp1-iskAvo){:target="_blank" rel="noopener"}
- **How Space Invaders Birthed Japanese Games:** [Video](https://youtu.be/Jbn8IRmSq8M?si=bMJzEXyBVZ3iUyFE){:target="_blank" rel="noopener"}   
- **Micro:bit accelerometer:** [Video](https://youtu.be/KuekQ-m9xpw?feature=shared){:target="_blank" rel="noopener"}   
- **Behind the hardware - Acceleromiter on the Microbit:** [Video](https://youtu.be/byngcwjO51U?feature=shared){:target="_blank" rel="noopener"}
- **Microbit Space Invaders Makecode Code** [Code](https://makecode.microbit.org/S02862-67759-70499-11772){:target="_blank" rel="noopener"}   

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
